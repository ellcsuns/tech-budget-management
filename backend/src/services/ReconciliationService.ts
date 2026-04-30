import { PrismaClient, ChangeRequestStatus, SavingStatus, TransactionType } from '@prisma/client';
import { SavingService } from './SavingService';
import { ChangeRequestService } from './ChangeRequestService';

// ── Types ────────────────────────────────────────────────────────────────────

export interface MonthlyExecution {
  planned: number;
  actual: number;
  difference: number; // positive = under-execution, negative = over-execution
}

export interface ReconciliationMonthData {
  month: number;
  planned: number;
  actual: number;
  difference: number;
  isClosed: boolean;
  isReconciled: boolean;
  reconciliation?: {
    id: string;
    decisionType: string;
    createdAt: Date;
  };
}

export interface ReconciliationLineSummary {
  budgetLineId: string;
  expenseCode: string;
  expenseDescription: string;
  financialCompany: string;
  currency: string;
  months: ReconciliationMonthData[];
}

export interface ReconciliationSummary {
  budgetId: string;
  currentMonth: number;
  lines: ReconciliationLineSummary[];
}

export interface MonthStatus {
  month: number;
  year: number;
  totalLines: number;
  reconciledLines: number;
  isComplete: boolean;
}

export interface UserTrackingRow {
  userId: string;
  fullName: string;
  technologyDirection: string;
  months: {
    month: number;
    isComplete: boolean;
    reconciledAt: string | null;
  }[];
}

// ── Service ──────────────────────────────────────────────────────────────────

export class ReconciliationService {
  constructor(
    private prisma: PrismaClient,
    private savingService: SavingService,
    private changeRequestService: ChangeRequestService
  ) {}

  // ── 2.2 computeMonthlyExecution ──────────────────────────────────────────
  /**
   * Computes planned vs actual for a budget line and a specific month.
   *
   * planned = planMX (base)
   *         + sum of approved change-request deltas for month X
   *         - sum of active savings for month X
   *
   * actual  = sum of REAL transactions where month = X
   *
   * difference = planned - actual
   *   positive → under-execution
   *   negative → over-execution
   */
  private async computeMonthlyExecution(
    budgetLineId: string,
    month: number
  ): Promise<MonthlyExecution> {
    const planKey = `planM${month}` as string;

    // Fetch budget line with approved change requests and active savings
    const budgetLine = await this.prisma.budgetLine.findUnique({
      where: { id: budgetLineId },
      include: {
        changeRequests: { where: { status: ChangeRequestStatus.APPROVED } },
        savings: { where: { status: SavingStatus.ACTIVE } },
      },
    });
    if (!budgetLine) throw new Error('Línea de presupuesto no encontrada');

    // Base plan value
    const base = Number((budgetLine as any)[planKey]) || 0;

    // Approved change-request deltas
    let correctionDelta = 0;
    for (const cr of budgetLine.changeRequests) {
      const proposed = ((cr.proposedValues as Record<string, number>) ?? {})[planKey] ?? 0;
      const current = ((cr.currentValues as Record<string, number>) ?? {})[planKey] ?? 0;
      correctionDelta += proposed - current;
    }

    // Active savings for this month
    let savingTotal = 0;
    for (const s of budgetLine.savings) {
      savingTotal += Number((s as any)[`savingM${month}`]) || 0;
    }

    const planned = base + correctionDelta - savingTotal;

    // Actual: sum of REAL transactions for this month
    const txAgg = await this.prisma.transaction.aggregate({
      where: {
        budgetLineId,
        type: TransactionType.REAL,
        month,
      },
      _sum: { usdValue: true },
    });
    const actual = Number(txAgg._sum.usdValue) || 0;

    const difference = planned - actual;

    return { planned, actual, difference };
  }

  // ── 2.3 getReconciliationSummary ─────────────────────────────────────────
  async getReconciliationSummary(
    userId: string,
    budgetId?: string
  ): Promise<ReconciliationSummary> {
    // Resolve budget
    let budget: any;
    if (budgetId) {
      budget = await this.prisma.budget.findUnique({ where: { id: budgetId } });
    } else {
      budget = await this.prisma.budget.findFirst({ where: { isActive: true } });
      if (!budget) {
        budget = await this.prisma.budget.findFirst({
          orderBy: [{ year: 'desc' }, { createdAt: 'desc' }],
        });
      }
    }
    if (!budget) throw new Error('Presupuesto no encontrado');

    // Get user's technology direction
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { technologyDirectionId: true },
    });
    if (!user) throw new Error('Usuario no encontrado');

    // Get budget lines for user's tech direction
    const whereClause: any = { budgetId: budget.id };
    if (user.technologyDirectionId) {
      whereClause.technologyDirectionId = user.technologyDirectionId;
    }

    const budgetLines = await this.prisma.budgetLine.findMany({
      where: whereClause,
      include: {
        expense: true,
        financialCompany: true,
        reconciliations: true,
      },
    });

    const currentMonth = new Date().getMonth() + 1; // 1-based
    const currentYear = new Date().getFullYear();

    const lines: ReconciliationLineSummary[] = [];

    for (const bl of budgetLines) {
      const months: ReconciliationMonthData[] = [];

      for (let m = 1; m <= 12; m++) {
        const execution = await this.computeMonthlyExecution(bl.id, m);
        const isClosed = m < currentMonth;

        // Check if reconciled
        const recon = bl.reconciliations.find(
          (r: any) => r.month === m && r.year === (budget as any).year
        );

        months.push({
          month: m,
          planned: execution.planned,
          actual: execution.actual,
          difference: execution.difference,
          isClosed,
          isReconciled: !!recon,
          reconciliation: recon
            ? {
                id: recon.id,
                decisionType: recon.decisionType,
                createdAt: recon.createdAt,
              }
            : undefined,
        });
      }

      lines.push({
        budgetLineId: bl.id,
        expenseCode: (bl as any).expense?.code ?? '',
        expenseDescription: (bl as any).expense?.shortDescription ?? '',
        financialCompany: (bl as any).financialCompany?.name ?? '',
        currency: bl.currency,
        months,
      });
    }

    return {
      budgetId: budget.id,
      currentMonth,
      lines,
    };
  }

  // ── 2.4 confirmSaving ───────────────────────────────────────────────────
  async confirmSaving(
    userId: string,
    budgetLineId: string,
    month: number,
    amount: number
  ): Promise<{ reconciliation: any; saving: any }> {
    const currentMonth = new Date().getMonth() + 1;
    if (month >= currentMonth) {
      throw new Error('Solo se pueden conciliar meses cerrados');
    }

    // Check not already reconciled
    const budgetLine = await this.prisma.budgetLine.findUnique({
      where: { id: budgetLineId },
      include: { budget: true },
    });
    if (!budgetLine) throw new Error('Línea de presupuesto no encontrada');

    const year = (budgetLine as any).budget.year;

    const existing = await this.prisma.monthlyReconciliation.findUnique({
      where: {
        budgetLineId_month_year: { budgetLineId, month, year },
      },
    });
    if (existing) throw new Error('Este mes ya fue conciliado para esta línea');

    // Compute execution
    const execution = await this.computeMonthlyExecution(budgetLineId, month);
    if (execution.difference <= 0) {
      throw new Error('No hay sub-ejecución para confirmar como ahorro');
    }
    if (amount > execution.difference) {
      throw new Error(
        `El monto del ahorro (${amount}) excede la sub-ejecución disponible (${execution.difference})`
      );
    }

    // Build saving input — put the amount in the corresponding savingMX field
    const savingData: any = {
      budgetLineId,
      description: `Ahorro por conciliación mensual - M${month}`,
    };
    savingData[`savingM${month}`] = amount;

    // Create saving via SavingService
    const saving = await this.savingService.createSaving(savingData, userId);

    // Create reconciliation record
    const reconciliation = await this.prisma.monthlyReconciliation.create({
      data: {
        budgetLineId,
        userId,
        month,
        year,
        decisionType: 'SAVING',
        plannedAmount: execution.planned,
        actualAmount: execution.actual,
        differenceAmount: execution.difference,
        details: { amount },
        savingId: saving.id,
      },
    });

    // Audit log
    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'RECONCILIATION_SAVING',
        entity: 'RECONCILIATION',
        entityId: reconciliation.id,
        details: {
          budgetLineId,
          month,
          year,
          amount,
          savingId: saving.id,
          planned: execution.planned,
          actual: execution.actual,
          difference: execution.difference,
        },
      },
    });

    return { reconciliation, saving };
  }

  // ── 2.5 redistributeUnderExecution ───────────────────────────────────────
  async redistributeUnderExecution(
    userId: string,
    budgetLineId: string,
    month: number,
    distribution: Record<number, number>
  ): Promise<{ reconciliation: any; changeRequest: any }> {
    const currentMonth = new Date().getMonth() + 1;
    if (month >= currentMonth) {
      throw new Error('Solo se pueden conciliar meses cerrados');
    }

    const budgetLine = await this.prisma.budgetLine.findUnique({
      where: { id: budgetLineId },
      include: {
        budget: true,
        changeRequests: { where: { status: ChangeRequestStatus.APPROVED } },
        savings: { where: { status: SavingStatus.ACTIVE } },
      },
    });
    if (!budgetLine) throw new Error('Línea de presupuesto no encontrada');

    const year = (budgetLine as any).budget.year;

    const existing = await this.prisma.monthlyReconciliation.findUnique({
      where: {
        budgetLineId_month_year: { budgetLineId, month, year },
      },
    });
    if (existing) throw new Error('Este mes ya fue conciliado para esta línea');

    // Compute execution
    const execution = await this.computeMonthlyExecution(budgetLineId, month);
    if (execution.difference <= 0) {
      throw new Error('No hay sub-ejecución para redistribuir');
    }

    // Validate distribution sum equals under-execution
    const distributionSum = Object.values(distribution).reduce((a, b) => a + b, 0);
    if (Math.abs(distributionSum - execution.difference) > 0.01) {
      throw new Error(
        `La suma de la distribución (${distributionSum}) debe ser igual a la sub-ejecución (${execution.difference})`
      );
    }

    // Validate all target months are future (> reconciled month) and <= 12
    for (const targetMonth of Object.keys(distribution).map(Number)) {
      if (targetMonth <= month) {
        throw new Error(
          `El mes destino ${targetMonth} debe ser posterior al mes conciliado ${month}`
        );
      }
      if (targetMonth > 12 || targetMonth < 1) {
        throw new Error(`Mes inválido: ${targetMonth}`);
      }
    }

    // Build proposed values: current computed values + distribution additions
    const proposedValues: Record<string, number> = {};
    const currentValues: Record<string, number> = {};

    for (let m = 1; m <= 12; m++) {
      const planKey = `planM${m}`;
      const base = Number((budgetLine as any)[planKey]) || 0;

      // Compute current effective value (base + approved deltas - active savings)
      let correctionDelta = 0;
      for (const cr of budgetLine.changeRequests) {
        const proposed = ((cr.proposedValues as Record<string, number>) ?? {})[planKey] ?? 0;
        const current = ((cr.currentValues as Record<string, number>) ?? {})[planKey] ?? 0;
        correctionDelta += proposed - current;
      }
      let savingTotal = 0;
      for (const s of budgetLine.savings) {
        savingTotal += Number((s as any)[`savingM${m}`]) || 0;
      }

      const currentComputed = base + correctionDelta - savingTotal;
      currentValues[planKey] = currentComputed;

      const addition = distribution[m] || 0;
      proposedValues[planKey] = currentComputed + addition;
    }

    // Validate annual total does not exceed original allocation
    // Original allocation = sum of base planM1..planM12
    let originalAnnualTotal = 0;
    for (let m = 1; m <= 12; m++) {
      originalAnnualTotal += Number((budgetLine as any)[`planM${m}`]) || 0;
    }
    const newAnnualTotal = Object.values(proposedValues).reduce((a, b) => a + b, 0);
    if (newAnnualTotal > originalAnnualTotal + 0.01) {
      throw new Error(
        `La redistribución excede la asignación anual total (${originalAnnualTotal.toFixed(2)}). Nuevo total: ${newAnnualTotal.toFixed(2)}`
      );
    }

    // Create change request via ChangeRequestService
    const distributionDesc = Object.entries(distribution)
      .map(([m, v]) => `M${m}: +${v}`)
      .join(', ');
    const changeRequest = await this.changeRequestService.createChangeRequest(
      {
        budgetLineId,
        proposedValues,
        comment: `Redistribución por conciliación mensual M${month}: ${distributionDesc}`,
      },
      userId
    );

    // Create reconciliation record
    const reconciliation = await this.prisma.monthlyReconciliation.create({
      data: {
        budgetLineId,
        userId,
        month,
        year,
        decisionType: 'REDISTRIBUTION',
        plannedAmount: execution.planned,
        actualAmount: execution.actual,
        differenceAmount: execution.difference,
        details: distribution as any,
        changeRequestId: changeRequest.id,
      },
    });

    // Audit log
    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'RECONCILIATION_REDISTRIBUTION',
        entity: 'RECONCILIATION',
        entityId: reconciliation.id,
        details: {
          budgetLineId,
          month,
          year,
          distribution,
          changeRequestId: changeRequest.id,
          planned: execution.planned,
          actual: execution.actual,
          difference: execution.difference,
        },
      },
    });

    return { reconciliation, changeRequest };
  }

  // ── 2.6 adjustOverExecution ──────────────────────────────────────────────
  async adjustOverExecution(
    userId: string,
    budgetLineId: string,
    month: number,
    reductions: Record<number, number>
  ): Promise<{ reconciliation: any; changeRequest: any }> {
    const currentMonth = new Date().getMonth() + 1;
    if (month >= currentMonth) {
      throw new Error('Solo se pueden conciliar meses cerrados');
    }

    const budgetLine = await this.prisma.budgetLine.findUnique({
      where: { id: budgetLineId },
      include: {
        budget: true,
        changeRequests: { where: { status: ChangeRequestStatus.APPROVED } },
        savings: { where: { status: SavingStatus.ACTIVE } },
      },
    });
    if (!budgetLine) throw new Error('Línea de presupuesto no encontrada');

    const year = (budgetLine as any).budget.year;

    const existing = await this.prisma.monthlyReconciliation.findUnique({
      where: {
        budgetLineId_month_year: { budgetLineId, month, year },
      },
    });
    if (existing) throw new Error('Este mes ya fue conciliado para esta línea');

    // Compute execution
    const execution = await this.computeMonthlyExecution(budgetLineId, month);
    const overExecution = Math.abs(execution.difference);
    if (execution.difference >= 0) {
      throw new Error('No hay sobre-ejecución para ajustar');
    }

    // Validate total reductions >= over-execution
    const totalReductions = Object.values(reductions).reduce((a, b) => a + b, 0);
    if (totalReductions < overExecution - 0.01) {
      throw new Error(
        `Las reducciones totales (${totalReductions}) deben ser >= la sobre-ejecución (${overExecution})`
      );
    }

    // Build proposed values: current computed values - reductions
    const proposedValues: Record<string, number> = {};

    for (let m = 1; m <= 12; m++) {
      const planKey = `planM${m}`;
      const base = Number((budgetLine as any)[planKey]) || 0;

      let correctionDelta = 0;
      for (const cr of budgetLine.changeRequests) {
        const proposed = ((cr.proposedValues as Record<string, number>) ?? {})[planKey] ?? 0;
        const current = ((cr.currentValues as Record<string, number>) ?? {})[planKey] ?? 0;
        correctionDelta += proposed - current;
      }
      let savingTotal = 0;
      for (const s of budgetLine.savings) {
        savingTotal += Number((s as any)[`savingM${m}`]) || 0;
      }

      const currentComputed = base + correctionDelta - savingTotal;
      const reduction = reductions[m] || 0;
      const newValue = currentComputed - reduction;

      // Validate no month goes below zero
      if (newValue < -0.01) {
        throw new Error(
          `El mes ${m} quedaría con valor negativo (${newValue.toFixed(2)}) después de la reducción`
        );
      }

      proposedValues[planKey] = Math.max(0, newValue);
    }

    // Create change request via ChangeRequestService
    const reductionDesc = Object.entries(reductions)
      .map(([m, v]) => `M${m}: -${v}`)
      .join(', ');
    const changeRequest = await this.changeRequestService.createChangeRequest(
      {
        budgetLineId,
        proposedValues,
        comment: `Ajuste por sobre-ejecución en M${month}: ${reductionDesc}`,
      },
      userId
    );

    // Create reconciliation record
    const reconciliation = await this.prisma.monthlyReconciliation.create({
      data: {
        budgetLineId,
        userId,
        month,
        year,
        decisionType: 'ADJUSTMENT',
        plannedAmount: execution.planned,
        actualAmount: execution.actual,
        differenceAmount: execution.difference,
        details: reductions as any,
        changeRequestId: changeRequest.id,
      },
    });

    // Audit log
    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'RECONCILIATION_ADJUSTMENT',
        entity: 'RECONCILIATION',
        entityId: reconciliation.id,
        details: {
          budgetLineId,
          month,
          year,
          reductions,
          changeRequestId: changeRequest.id,
          planned: execution.planned,
          actual: execution.actual,
          difference: execution.difference,
        },
      },
    });

    return { reconciliation, changeRequest };
  }

  // ── 2.7 getUserStatus ───────────────────────────────────────────────────
  async getUserStatus(userId: string, budgetId?: string): Promise<MonthStatus[]> {
    // Resolve budget
    let budget: any;
    if (budgetId) {
      budget = await this.prisma.budget.findUnique({ where: { id: budgetId } });
    } else {
      budget = await this.prisma.budget.findFirst({ where: { isActive: true } });
      if (!budget) {
        budget = await this.prisma.budget.findFirst({
          orderBy: [{ year: 'desc' }, { createdAt: 'desc' }],
        });
      }
    }
    if (!budget) throw new Error('Presupuesto no encontrado');

    // Get user's tech direction
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { technologyDirectionId: true },
    });
    if (!user) throw new Error('Usuario no encontrado');

    // Get budget lines for user's tech direction
    const whereClause: any = { budgetId: budget.id };
    if (user.technologyDirectionId) {
      whereClause.technologyDirectionId = user.technologyDirectionId;
    }

    const budgetLines = await this.prisma.budgetLine.findMany({
      where: whereClause,
      select: { id: true },
    });

    const totalLines = budgetLines.length;
    const budgetLineIds = budgetLines.map((bl) => bl.id);

    const currentMonth = new Date().getMonth() + 1;
    const statuses: MonthStatus[] = [];

    for (let m = 1; m < currentMonth; m++) {
      // Count reconciled lines for this month
      const reconciledCount = await this.prisma.monthlyReconciliation.count({
        where: {
          budgetLineId: { in: budgetLineIds },
          month: m,
          year: budget.year,
        },
      });

      statuses.push({
        month: m,
        year: budget.year,
        totalLines,
        reconciledLines: reconciledCount,
        isComplete: totalLines > 0 && reconciledCount >= totalLines,
      });
    }

    return statuses;
  }

  // ── 2.8 getTrackingMatrix ───────────────────────────────────────────────
  async getTrackingMatrix(budgetId?: string): Promise<UserTrackingRow[]> {
    // Resolve budget
    let budget: any;
    if (budgetId) {
      budget = await this.prisma.budget.findUnique({ where: { id: budgetId } });
    } else {
      budget = await this.prisma.budget.findFirst({ where: { isActive: true } });
      if (!budget) {
        budget = await this.prisma.budget.findFirst({
          orderBy: [{ year: 'desc' }, { createdAt: 'desc' }],
        });
      }
    }
    if (!budget) throw new Error('Presupuesto no encontrado');

    // Get all active users with a technology direction
    const users = await this.prisma.user.findMany({
      where: { active: true, technologyDirectionId: { not: null } },
      include: { technologyDirection: true },
    });

    const currentMonth = new Date().getMonth() + 1;
    const rows: UserTrackingRow[] = [];

    for (const u of users) {
      // Get budget lines for this user's tech direction
      const budgetLines = await this.prisma.budgetLine.findMany({
        where: {
          budgetId: budget.id,
          technologyDirectionId: u.technologyDirectionId!,
        },
        select: { id: true },
      });

      if (budgetLines.length === 0) continue; // skip users with no lines

      const budgetLineIds = budgetLines.map((bl) => bl.id);
      const totalLines = budgetLines.length;

      const monthData: UserTrackingRow['months'] = [];

      for (let m = 1; m < currentMonth; m++) {
        const reconciliations = await this.prisma.monthlyReconciliation.findMany({
          where: {
            budgetLineId: { in: budgetLineIds },
            month: m,
            year: budget.year,
          },
          select: { createdAt: true },
          orderBy: { createdAt: 'desc' },
          take: 1,
        });

        const reconciledCount = await this.prisma.monthlyReconciliation.count({
          where: {
            budgetLineId: { in: budgetLineIds },
            month: m,
            year: budget.year,
          },
        });

        const isComplete = reconciledCount >= totalLines;
        const lastRecon = reconciliations[0];

        monthData.push({
          month: m,
          isComplete,
          reconciledAt: isComplete && lastRecon ? lastRecon.createdAt.toISOString() : null,
        });
      }

      rows.push({
        userId: u.id,
        fullName: u.fullName,
        technologyDirection: u.technologyDirection?.name ?? '',
        months: monthData,
      });
    }

    return rows;
  }

  // ── 2.9 getHistory ──────────────────────────────────────────────────────
  async getHistory(budgetLineId: string): Promise<any[]> {
    return await this.prisma.monthlyReconciliation.findMany({
      where: { budgetLineId },
      include: {
        user: { select: { id: true, fullName: true } },
      },
      orderBy: [{ month: 'asc' }, { createdAt: 'asc' }],
    });
  }

  // ── 2.10 getPendingCount ────────────────────────────────────────────────
  async getPendingCount(userId: string): Promise<number> {
    // Resolve active budget
    let budget: any = await this.prisma.budget.findFirst({ where: { isActive: true } });
    if (!budget) {
      budget = await this.prisma.budget.findFirst({
        orderBy: [{ year: 'desc' }, { createdAt: 'desc' }],
      });
    }
    if (!budget) return 0;

    // Get user's tech direction
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { technologyDirectionId: true },
    });
    if (!user) return 0;

    // Get budget lines for user's tech direction
    const whereClause: any = { budgetId: budget.id };
    if (user.technologyDirectionId) {
      whereClause.technologyDirectionId = user.technologyDirectionId;
    }

    const budgetLines = await this.prisma.budgetLine.findMany({
      where: whereClause,
      select: { id: true },
    });

    if (budgetLines.length === 0) return 0;

    const budgetLineIds = budgetLines.map((bl) => bl.id);
    const totalLines = budgetLines.length;
    const currentMonth = new Date().getMonth() + 1;

    let pendingMonths = 0;

    for (let m = 1; m < currentMonth; m++) {
      const reconciledCount = await this.prisma.monthlyReconciliation.count({
        where: {
          budgetLineId: { in: budgetLineIds },
          month: m,
          year: budget.year,
        },
      });

      if (reconciledCount < totalLines) {
        pendingMonths++;
      }
    }

    return pendingMonths;
  }
}
