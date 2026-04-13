import { PrismaClient, Budget, SavingStatus, ChangeRequestStatus } from '@prisma/client';
import { BudgetInput } from '../types';

export class BudgetService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async createBudget(data: BudgetInput & { sourceBudgetId?: string }): Promise<Budget> {
    const existing = await this.prisma.budget.findUnique({
      where: { year_version: { year: data.year, version: data.version } }
    });
    if (existing) throw new Error(`Ya existe un presupuesto para el año ${data.year} versión ${data.version}`);

    return await this.prisma.$transaction(async (tx: any) => {
      const newBudget = await tx.budget.create({
        data: { year: data.year, version: data.version, isActive: false }
      });

      // If sourceBudgetId provided, copy lines and conversion rates
      if (data.sourceBudgetId) {
        const source = await tx.budget.findUnique({
          where: { id: data.sourceBudgetId },
          include: { budgetLines: true, conversionRates: true }
        });
        if (source) {
          for (const rate of source.conversionRates) {
            await tx.conversionRate.create({
              data: { budgetId: newBudget.id, currency: rate.currency, month: rate.month, rate: rate.rate }
            });
          }
          for (const line of source.budgetLines) {
            await tx.budgetLine.create({
              data: {
                budgetId: newBudget.id, expenseId: line.expenseId,
                financialCompanyId: line.financialCompanyId,
                technologyDirectionId: line.technologyDirectionId,
                currency: line.currency,
                planM1: line.planM1, planM2: line.planM2, planM3: line.planM3, planM4: line.planM4,
                planM5: line.planM5, planM6: line.planM6, planM7: line.planM7, planM8: line.planM8,
                planM9: line.planM9, planM10: line.planM10, planM11: line.planM11, planM12: line.planM12,
              }
            });
          }
        }
      }

      return await tx.budget.findUnique({
        where: { id: newBudget.id },
        include: { budgetLines: { include: { expense: true, financialCompany: true, technologyDirection: true } }, conversionRates: true }
      }) as Budget;
    });
  }

  async getBudget(id: string): Promise<Budget | null> {
    return await this.prisma.budget.findUnique({
      where: { id },
      include: {
        budgetLines: {
          include: {
            expense: { include: { category: true, tagValues: { include: { tagDefinition: true } } } },
            financialCompany: true,
            technologyDirection: true,
            transactions: true,
            deferrals: true,
            lastModifiedBy: { select: { id: true, username: true, fullName: true } },
            savings: true
          }
        },
        conversionRates: true,
        reviewSubmittedBy: { select: { id: true, fullName: true } }
      }
    });
  }

  async getBudgetsByYear(year: number): Promise<Budget[]> {
    return await this.prisma.budget.findMany({
      where: { year },
      include: { budgetLines: true, conversionRates: true },
      orderBy: { version: 'asc' }
    });
  }

  async updateBudget(id: string, data: Partial<BudgetInput>): Promise<Budget> {
    if (data.year || data.version) {
      const current = await this.prisma.budget.findUnique({ where: { id } });
      if (!current) throw new Error('Presupuesto no encontrado');
      const year = data.year ?? current.year;
      const version = data.version ?? current.version;
      const existing = await this.prisma.budget.findFirst({ where: { year, version, NOT: { id } } });
      if (existing) throw new Error(`Ya existe un presupuesto para el año ${year} versión ${version}`);
    }
    return await this.prisma.budget.update({
      where: { id }, data,
      include: { budgetLines: true, conversionRates: true }
    });
  }

  async deleteBudget(id: string): Promise<void> {
    const budget = await this.prisma.budget.findUnique({ where: { id } });
    if (!budget) throw new Error('Presupuesto no encontrado');
    if (budget.isActive) throw new Error('No se puede eliminar el presupuesto vigente');
    await this.prisma.budget.delete({ where: { id } });
  }

  async getAllBudgets(): Promise<Budget[]> {
    return await this.prisma.budget.findMany({
      include: { budgetLines: true, conversionRates: true },
      orderBy: [{ year: 'desc' }, { version: 'asc' }]
    });
  }

  async getActiveBudget(): Promise<Budget | null> {
    const budgetInclude = {
      budgetLines: {
        include: {
          expense: { include: { category: true } },
          financialCompany: true,
          technologyDirection: true,
          transactions: true,
          deferrals: true,
          lastModifiedBy: { select: { id: true, username: true, fullName: true } },
          savings: { where: { status: SavingStatus.ACTIVE } }
        }
      },
      conversionRates: true,
      reviewSubmittedBy: { select: { id: true, fullName: true } }
    };
    const active = await this.prisma.budget.findFirst({
      where: { isActive: true },
      include: budgetInclude
    });
    if (active) return active;
    // Fallback: most recent budget
    return await this.prisma.budget.findFirst({
      orderBy: [{ year: 'desc' }, { createdAt: 'desc' }],
      include: budgetInclude
    });
  }

  async setActiveBudget(id: string): Promise<Budget> {
    const budget = await this.prisma.budget.findUnique({ where: { id } });
    if (!budget) throw new Error('Presupuesto no encontrado');

    return await this.prisma.$transaction(async (tx: any) => {
      // Deactivate all budgets
      await tx.budget.updateMany({ data: { isActive: false } });
      // Activate the selected one
      return await tx.budget.update({
        where: { id },
        data: { isActive: true },
        include: { budgetLines: true, conversionRates: true }
      });
    });
  }

  async compareBudgets(budgetAId: string, budgetBId: string) {
    const [budgetA, budgetB] = await Promise.all([
      this.prisma.budget.findUnique({
        where: { id: budgetAId },
        include: {
          budgetLines: { include: { expense: true, financialCompany: true, technologyDirection: true } },
          conversionRates: true
        }
      }),
      this.prisma.budget.findUnique({
        where: { id: budgetBId },
        include: {
          budgetLines: { include: { expense: true, financialCompany: true, technologyDirection: true } },
          conversionRates: true
        }
      })
    ]);
    if (!budgetA || !budgetB) throw new Error('Budget not found');
    return { budgetA, budgetB };
  }

  async createNewVersion(
    sourceBudgetId: string,
    planValueChanges: Array<{ budgetLineId: string; planM1?: number; planM2?: number; planM3?: number; planM4?: number; planM5?: number; planM6?: number; planM7?: number; planM8?: number; planM9?: number; planM10?: number; planM11?: number; planM12?: number }>
  ): Promise<Budget> {
    return await this.prisma.$transaction(async (tx: any) => {
      const sourceBudget = await tx.budget.findUnique({
        where: { id: sourceBudgetId },
        include: {
          budgetLines: { include: { expense: true, financialCompany: true, technologyDirection: true } },
          conversionRates: true
        }
      });
      if (!sourceBudget) throw new Error('Presupuesto fuente no encontrado');

      const nextVersion = await this.getNextVersion(sourceBudget.year);

      const newBudget = await tx.budget.create({
        data: { year: sourceBudget.year, version: nextVersion }
      });

      for (const rate of sourceBudget.conversionRates) {
        await tx.conversionRate.create({
          data: { budgetId: newBudget.id, currency: rate.currency, month: rate.month, rate: rate.rate }
        });
      }

      for (const line of sourceBudget.budgetLines) {
        const change = planValueChanges.find((c: any) => c.budgetLineId === line.id);
        await tx.budgetLine.create({
          data: {
            budgetId: newBudget.id, expenseId: line.expenseId,
            financialCompanyId: line.financialCompanyId,
            technologyDirectionId: line.technologyDirectionId,
            currency: line.currency,
            planM1: change?.planM1 ?? line.planM1, planM2: change?.planM2 ?? line.planM2,
            planM3: change?.planM3 ?? line.planM3, planM4: change?.planM4 ?? line.planM4,
            planM5: change?.planM5 ?? line.planM5, planM6: change?.planM6 ?? line.planM6,
            planM7: change?.planM7 ?? line.planM7, planM8: change?.planM8 ?? line.planM8,
            planM9: change?.planM9 ?? line.planM9, planM10: change?.planM10 ?? line.planM10,
            planM11: change?.planM11 ?? line.planM11, planM12: change?.planM12 ?? line.planM12,
          }
        });
      }

      return await tx.budget.findUnique({
        where: { id: newBudget.id },
        include: { budgetLines: { include: { expense: true, financialCompany: true, technologyDirection: true } }, conversionRates: true }
      }) as Budget;
    });
  }

  async getNextVersion(year: number): Promise<string> {
    const budgets = await this.prisma.budget.findMany({ where: { year }, orderBy: { version: 'desc' } });
    if (budgets.length === 0) return 'v1';
    const versions = budgets.map(b => {
      const m = b.version.match(/v(\d+)/);
      return m ? parseInt(m[1]) : 0;
    });
    return `v${Math.max(...versions) + 1}`;
  }

  async addBudgetLine(budgetId: string, expenseId: string, financialCompanyId: string, technologyDirectionId?: string) {
    const budget = await this.prisma.budget.findUnique({ where: { id: budgetId } });
    if (!budget) throw new Error('Presupuesto no encontrado');
    const expense = await this.prisma.expense.findUnique({ where: { id: expenseId } });
    if (!expense) throw new Error('Gasto no encontrado');
    const company = await this.prisma.financialCompany.findUnique({ where: { id: financialCompanyId } });
    if (!company) throw new Error('Empresa financiera no encontrada');
    const existing = await this.prisma.budgetLine.findUnique({
      where: { budgetId_expenseId_financialCompanyId: { budgetId, expenseId, financialCompanyId } }
    });
    if (existing) throw new Error('Ya existe una línea para este gasto y empresa en este presupuesto');
    return await this.prisma.budgetLine.create({
      data: { budgetId, expenseId, financialCompanyId, technologyDirectionId, currency: company.currencyCode },
      include: { expense: true, financialCompany: true, technologyDirection: true }
    });
  }

  async removeBudgetLine(budgetLineId: string): Promise<void> {
    await this.prisma.budgetLine.delete({ where: { id: budgetLineId } });
  }

  async submitForReview(budgetId: string, userId: string): Promise<any> {
    const budget = await this.prisma.budget.findUnique({ where: { id: budgetId } });
    if (!budget) throw new Error('Presupuesto no encontrado');
    if (budget.reviewStatus === 'IN_REVIEW') throw new Error('El presupuesto ya está en revisión');

    return await this.prisma.budget.update({
      where: { id: budgetId },
      data: {
        reviewStatus: 'IN_REVIEW',
        reviewSubmittedAt: new Date(),
        reviewSubmittedById: userId
      },
      include: {
        reviewSubmittedBy: { select: { id: true, fullName: true } }
      }
    });
  }

  /**
   * Retorna el presupuesto con valores computados:
   * computedM* = base(planM*) + correcciones aprobadas - ahorros activos
   * Incluye breakdown por línea y resumen mensual global.
   */
  async getComputedBudget(budgetId: string): Promise<any> {
    const budget = await this.prisma.budget.findUnique({
      where: { id: budgetId },
      include: {
        budgetLines: {
          include: {
            expense: { include: { category: true, tagValues: { include: { tagDefinition: true } } } },
            financialCompany: true,
            technologyDirection: true,
            transactions: true,
            deferrals: true,
            lastModifiedBy: { select: { id: true, username: true, fullName: true } },
            savings: { where: { status: SavingStatus.ACTIVE } },
            changeRequests: { where: { status: ChangeRequestStatus.APPROVED } }
          }
        },
        conversionRates: true,
        reviewSubmittedBy: { select: { id: true, fullName: true } }
      }
    });
    if (!budget) throw new Error('Presupuesto no encontrado');

    const monthlySummary: Array<{
      month: number;
      base: number;
      savings: number;
      corrections: number;
      computed: number;
    }> = [];

    for (let m = 1; m <= 12; m++) {
      monthlySummary.push({ month: m, base: 0, savings: 0, corrections: 0, computed: 0 });
    }

    const computedLines = (budget as any).budgetLines.map((bl: any) => {
      const lineBreakdown: Array<{
        month: number;
        base: number;
        savings: number;
        corrections: number;
        computed: number;
      }> = [];

      let hasSavings = false;
      let hasCorrections = false;

      for (let m = 1; m <= 12; m++) {
        const planKey = `planM${m}`;
        const base = Number(bl[planKey]) || 0;

        // Sumar ahorros activos para este mes
        let savingTotal = 0;
        (bl.savings || []).forEach((s: any) => {
          const sv = Number(s[`savingM${m}`]) || 0;
          savingTotal += sv;
        });
        if (savingTotal > 0) hasSavings = true;

        // Calcular corrección neta de change requests aprobados
        // La corrección es la diferencia entre el valor propuesto y el valor actual al momento de la solicitud
        let correctionDelta = 0;
        (bl.changeRequests || []).forEach((cr: any) => {
          const proposed = (cr.proposedValues as Record<string, number>)?.[planKey] ?? 0;
          const current = (cr.currentValues as Record<string, number>)?.[planKey] ?? 0;
          correctionDelta += (proposed - current);
        });
        if (correctionDelta !== 0) hasCorrections = true;

        const computed = base + correctionDelta - savingTotal;

        lineBreakdown.push({ month: m, base, savings: savingTotal, corrections: correctionDelta, computed });

        // Acumular en resumen global
        monthlySummary[m - 1].base += base;
        monthlySummary[m - 1].savings += savingTotal;
        monthlySummary[m - 1].corrections += correctionDelta;
        monthlySummary[m - 1].computed += computed;
      }

      return {
        ...bl,
        breakdown: lineBreakdown,
        hasSavings,
        hasCorrections,
        // Agregar campos computedM* para uso directo
        computedM1: lineBreakdown[0].computed,
        computedM2: lineBreakdown[1].computed,
        computedM3: lineBreakdown[2].computed,
        computedM4: lineBreakdown[3].computed,
        computedM5: lineBreakdown[4].computed,
        computedM6: lineBreakdown[5].computed,
        computedM7: lineBreakdown[6].computed,
        computedM8: lineBreakdown[7].computed,
        computedM9: lineBreakdown[8].computed,
        computedM10: lineBreakdown[9].computed,
        computedM11: lineBreakdown[10].computed,
        computedM12: lineBreakdown[11].computed,
      };
    });

    return {
      ...budget,
      budgetLines: computedLines,
      monthlySummary
    };
  }

  /**
   * Consolida todas las transacciones (correcciones, ahorros) en una nueva versión.
   * Los valores computados se escriben como nuevos valores base.
   */
  async createVersionSnapshot(budgetId: string): Promise<Budget> {
    const computed = await this.getComputedBudget(budgetId);

    return await this.prisma.$transaction(async (tx: any) => {
      const sourceBudget = await tx.budget.findUnique({
        where: { id: budgetId },
        include: { conversionRates: true }
      });
      if (!sourceBudget) throw new Error('Presupuesto fuente no encontrado');

      const nextVersion = await this.getNextVersion(sourceBudget.year);

      const newBudget = await tx.budget.create({
        data: { year: sourceBudget.year, version: nextVersion }
      });

      // Copiar tasas de conversión
      for (const rate of sourceBudget.conversionRates) {
        await tx.conversionRate.create({
          data: { budgetId: newBudget.id, currency: rate.currency, month: rate.month, rate: rate.rate }
        });
      }

      // Crear líneas con valores computados como nueva base
      for (const line of computed.budgetLines) {
        await tx.budgetLine.create({
          data: {
            budgetId: newBudget.id,
            expenseId: line.expenseId,
            financialCompanyId: line.financialCompanyId,
            technologyDirectionId: line.technologyDirectionId,
            currency: line.currency,
            planM1: line.computedM1, planM2: line.computedM2, planM3: line.computedM3,
            planM4: line.computedM4, planM5: line.computedM5, planM6: line.computedM6,
            planM7: line.computedM7, planM8: line.computedM8, planM9: line.computedM9,
            planM10: line.computedM10, planM11: line.computedM11, planM12: line.computedM12,
          }
        });
      }

      return await tx.budget.findUnique({
        where: { id: newBudget.id },
        include: { budgetLines: { include: { expense: true, financialCompany: true, technologyDirection: true } }, conversionRates: true }
      }) as Budget;
    });
  }
}
