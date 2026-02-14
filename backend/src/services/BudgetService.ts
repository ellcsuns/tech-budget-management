import { PrismaClient, Budget } from '@prisma/client';
import { BudgetInput } from '../types';

export class BudgetService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async createBudget(data: BudgetInput): Promise<Budget> {
    // Validar unicidad de year + version
    const existing = await this.prisma.budget.findUnique({
      where: {
        year_version: {
          year: data.year,
          version: data.version
        }
      }
    });

    if (existing) {
      throw new Error(`Ya existe un presupuesto para el año ${data.year} versión ${data.version}`);
    }

    // Crear presupuesto
    const budget = await this.prisma.budget.create({
      data: {
        year: data.year,
        version: data.version
      },
      include: {
        expenses: true,
        conversionRates: true
      }
    });

    return budget;
  }

  async getBudget(id: string): Promise<Budget | null> {
    return await this.prisma.budget.findUnique({
      where: { id },
      include: {
        expenses: {
          include: {
            financialCompany: true,
            transactions: true,
            planValues: true,
            tagValues: {
              include: {
                tagDefinition: true
              }
            }
          }
        },
        conversionRates: true
      }
    });
  }

  async getBudgetsByYear(year: number): Promise<Budget[]> {
    return await this.prisma.budget.findMany({
      where: { year },
      include: {
        expenses: true,
        conversionRates: true
      },
      orderBy: {
        version: 'asc'
      }
    });
  }

  async updateBudget(id: string, data: Partial<BudgetInput>): Promise<Budget> {
    // Si se actualiza year o version, validar unicidad
    if (data.year || data.version) {
      const current = await this.prisma.budget.findUnique({ where: { id } });
      if (!current) {
        throw new Error('Presupuesto no encontrado');
      }

      const year = data.year ?? current.year;
      const version = data.version ?? current.version;

      const existing = await this.prisma.budget.findFirst({
        where: {
          year,
          version,
          NOT: { id }
        }
      });

      if (existing) {
        throw new Error(`Ya existe un presupuesto para el año ${year} versión ${version}`);
      }
    }

    return await this.prisma.budget.update({
      where: { id },
      data,
      include: {
        expenses: true,
        conversionRates: true
      }
    });
  }

  async deleteBudget(id: string): Promise<void> {
    await this.prisma.budget.delete({
      where: { id }
    });
  }

  async getAllBudgets(): Promise<Budget[]> {
    return await this.prisma.budget.findMany({
      include: {
        expenses: true,
        conversionRates: true
      },
      orderBy: [
        { year: 'desc' },
        { version: 'asc' }
      ]
    });
  }

  async createNewVersion(
    sourceBudgetId: string,
    planValueChanges: Array<{ expenseId: string; month: number; transactionValue: number; transactionCurrency: string }>
  ): Promise<Budget> {
    return await this.prisma.$transaction(async (tx) => {
      // Obtener presupuesto fuente
      const sourceBudget = await tx.budget.findUnique({
        where: { id: sourceBudgetId },
        include: {
          expenses: {
            include: {
              planValues: true,
              tagValues: {
                include: {
                  tagDefinition: true
                }
              }
            }
          },
          conversionRates: true
        }
      });

      if (!sourceBudget) {
        throw new Error('Presupuesto fuente no encontrado');
      }

      // Calcular siguiente versión
      const nextVersion = await this.getNextVersion(sourceBudget.year);

      // Crear nuevo presupuesto
      const newBudget = await tx.budget.create({
        data: {
          year: sourceBudget.year,
          version: nextVersion
        }
      });

      // Copiar tasas de conversión
      for (const rate of sourceBudget.conversionRates) {
        await tx.conversionRate.create({
          data: {
            budgetId: newBudget.id,
            currency: rate.currency,
            month: rate.month,
            rate: rate.rate
          }
        });
      }

      // Copiar gastos
      for (const expense of sourceBudget.expenses) {
        const newExpense = await tx.expense.create({
          data: {
            budgetId: newBudget.id,
            code: expense.code,
            shortDescription: expense.shortDescription,
            longDescription: expense.longDescription,
            technologyDirections: expense.technologyDirections,
            userAreas: expense.userAreas,
            financialCompanyId: expense.financialCompanyId,
            parentExpenseId: expense.parentExpenseId
          }
        });

        // Copiar valores plan
        for (const planValue of expense.planValues) {
          // Buscar si hay cambio para este gasto y mes
          const change = planValueChanges.find(
            c => c.expenseId === expense.id && c.month === planValue.month
          );

          let transactionValue = planValue.transactionValue;
          let transactionCurrency = planValue.transactionCurrency;

          if (change) {
            transactionValue = change.transactionValue as any;
            transactionCurrency = change.transactionCurrency;
          }

          // Obtener tasa de conversión
          const conversionRate = await tx.conversionRate.findUnique({
            where: {
              budgetId_currency_month: {
                budgetId: newBudget.id,
                currency: transactionCurrency,
                month: planValue.month
              }
            }
          });

          if (!conversionRate) {
            throw new Error(`No se encontró tasa de conversión para ${transactionCurrency} en el mes ${planValue.month}`);
          }

          const usdValue = Number(transactionValue) * Number(conversionRate.rate);

          await tx.planValue.create({
            data: {
              expenseId: newExpense.id,
              month: planValue.month,
              transactionCurrency,
              transactionValue,
              usdValue,
              conversionRate: conversionRate.rate
            }
          });
        }

        // Copiar tag values
        for (const tagValue of expense.tagValues) {
          await tx.tagValue.create({
            // @ts-ignore - tagDefinitionId exists in the unchecked input type
            data: {
              expenseId: newExpense.id,
              tagDefinitionId: tagValue.tagDefinition.id,
              value: tagValue.value as any
            }
          });
        }
      }

      return await tx.budget.findUnique({
        where: { id: newBudget.id },
        include: {
          expenses: {
            include: {
              planValues: true,
              tagValues: true
            }
          },
          conversionRates: true
        }
      }) as Budget;
    });
  }

  async getNextVersion(year: number): Promise<string> {
    const budgets = await this.prisma.budget.findMany({
      where: { year },
      orderBy: { version: 'desc' }
    });

    if (budgets.length === 0) {
      return 'v1.0';
    }

    const lastVersion = budgets[0].version;
    const match = lastVersion.match(/v(\d+)\.(\d+)/);
    
    if (!match) {
      return 'v1.0';
    }

    const major = parseInt(match[1]);
    const minor = parseInt(match[2]);

    return `v${major}.${minor + 1}`;
  }

  async addExpenseToBudget(budgetId: string, expenseCode: string): Promise<any> {
    // Buscar el gasto en otros presupuestos
    const existingExpense = await this.prisma.expense.findFirst({
      where: { code: expenseCode }
    });

    if (!existingExpense) {
      throw new Error('Gasto no encontrado');
    }

    // Crear copia del gasto en el presupuesto actual
    const newExpense = await this.prisma.expense.create({
      data: {
        budgetId,
        code: existingExpense.code,
        shortDescription: existingExpense.shortDescription,
        longDescription: existingExpense.longDescription,
        technologyDirections: existingExpense.technologyDirections,
        userAreas: existingExpense.userAreas,
        financialCompanyId: existingExpense.financialCompanyId,
        parentExpenseId: existingExpense.parentExpenseId
      }
    });

    // Inicializar valores plan en 0 para todos los meses
    for (let month = 1; month <= 12; month++) {
      await this.prisma.planValue.create({
        data: {
          expenseId: newExpense.id,
          month,
          transactionCurrency: 'USD',
          transactionValue: 0,
          usdValue: 0,
          conversionRate: 1
        }
      });
    }

    return newExpense;
  }

  async removeExpenseFromBudget(budgetId: string, expenseId: string): Promise<void> {
    const expense = await this.prisma.expense.findUnique({
      where: { id: expenseId }
    });

    if (!expense || expense.budgetId !== budgetId) {
      throw new Error('Gasto no encontrado en este presupuesto');
    }

    // Eliminar valores plan
    await this.prisma.planValue.deleteMany({
      where: { expenseId }
    });

    // Eliminar tag values
    await this.prisma.tagValue.deleteMany({
      where: { expenseId }
    });

    // Eliminar transacciones
    await this.prisma.transaction.deleteMany({
      where: { expenseId }
    });

    // Eliminar gasto
    await this.prisma.expense.delete({
      where: { id: expenseId }
    });
  }
}
