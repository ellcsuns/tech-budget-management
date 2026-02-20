import { PrismaClient, Budget, SavingStatus } from '@prisma/client';
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
}
