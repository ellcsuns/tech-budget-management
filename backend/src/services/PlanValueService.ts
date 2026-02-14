import { PrismaClient, PlanValue } from '@prisma/client';
import { PlanValueInput } from '../types';

export class PlanValueService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async createPlanValue(data: PlanValueInput): Promise<PlanValue> {
    // Validar que el gasto existe
    const expense = await this.prisma.expense.findUnique({
      where: { id: data.expenseId }
    });
    if (!expense) {
      throw new Error('Gasto no encontrado');
    }

    // Validar mes (1-12)
    if (data.month < 1 || data.month > 12) {
      throw new Error('El mes debe estar entre 1 y 12');
    }

    // Validar unicidad de expenseId + month
    const existing = await this.prisma.planValue.findUnique({
      where: {
        expenseId_month: {
          expenseId: data.expenseId,
          month: data.month
        }
      }
    });

    if (existing) {
      throw new Error(`Ya existe un valor plan para el mes ${data.month} de este gasto`);
    }

    // Obtener tasa de conversión del presupuesto
    const conversionRate = await this.prisma.conversionRate.findUnique({
      where: {
        budgetId_currency_month: {
          budgetId: expense.budgetId,
          currency: data.transactionCurrency,
          month: data.month
        }
      }
    });

    if (!conversionRate) {
      throw new Error(`No se encontró tasa de conversión para ${data.transactionCurrency} en el mes ${data.month}`);
    }

    // Calcular valor en USD
    const usdValue = data.transactionValue * Number(conversionRate.rate);

    // Crear valor plan
    return await this.prisma.planValue.create({
      data: {
        expenseId: data.expenseId,
        month: data.month,
        transactionCurrency: data.transactionCurrency,
        transactionValue: data.transactionValue,
        usdValue,
        conversionRate: conversionRate.rate
      },
      include: {
        expense: true
      }
    });
  }

  async getPlanValue(id: string): Promise<PlanValue | null> {
    return await this.prisma.planValue.findUnique({
      where: { id },
      include: {
        expense: true
      }
    });
  }

  async getPlanValuesByExpense(expenseId: string): Promise<PlanValue[]> {
    return await this.prisma.planValue.findMany({
      where: { expenseId },
      orderBy: {
        month: 'asc'
      },
      include: {
        expense: true
      }
    });
  }

  async updatePlanValue(id: string, data: Partial<PlanValueInput>): Promise<PlanValue> {
    const planValue = await this.prisma.planValue.findUnique({
      where: { id },
      include: { expense: true }
    });

    if (!planValue) {
      throw new Error('Valor plan no encontrado');
    }

    // Si se actualiza el mes, validar unicidad
    if (data.month && data.month !== planValue.month) {
      if (data.month < 1 || data.month > 12) {
        throw new Error('El mes debe estar entre 1 y 12');
      }

      const existing = await this.prisma.planValue.findUnique({
        where: {
          expenseId_month: {
            expenseId: planValue.expenseId,
            month: data.month
          }
        }
      });

      if (existing) {
        throw new Error(`Ya existe un valor plan para el mes ${data.month} de este gasto`);
      }
    }

    // Recalcular USD si cambia valor o moneda
    let updateData: any = { ...data };
    
    if (data.transactionValue || data.transactionCurrency) {
      const month = data.month ?? planValue.month;
      const currency = data.transactionCurrency ?? planValue.transactionCurrency;
      const value = data.transactionValue ?? Number(planValue.transactionValue);

      const conversionRate = await this.prisma.conversionRate.findUnique({
        where: {
          budgetId_currency_month: {
            budgetId: planValue.expense.budgetId,
            currency,
            month
          }
        }
      });

      if (!conversionRate) {
        throw new Error(`No se encontró tasa de conversión para ${currency} en el mes ${month}`);
      }

      updateData.usdValue = value * Number(conversionRate.rate);
      updateData.conversionRate = conversionRate.rate;
    }

    return await this.prisma.planValue.update({
      where: { id },
      data: updateData,
      include: {
        expense: true
      }
    });
  }

  async deletePlanValue(id: string): Promise<void> {
    await this.prisma.planValue.delete({
      where: { id }
    });
  }

  async getMonthlyPlan(expenseId: string, month: number) {
    const planValue = await this.prisma.planValue.findUnique({
      where: {
        expenseId_month: {
          expenseId,
          month
        }
      }
    });

    if (!planValue) {
      return {
        transactionCurrency: '',
        transactionValue: 0,
        usdValue: 0,
        conversionRate: 0,
        month
      };
    }

    return {
      transactionCurrency: planValue.transactionCurrency,
      transactionValue: Number(planValue.transactionValue),
      usdValue: Number(planValue.usdValue),
      conversionRate: Number(planValue.conversionRate),
      month: planValue.month
    };
  }

  async getTotalPlan(expenseId: string) {
    const planValues = await this.prisma.planValue.findMany({
      where: { expenseId }
    });

    if (planValues.length === 0) {
      return {
        transactionCurrency: '',
        transactionValue: 0,
        usdValue: 0,
        conversionRate: 0,
        month: 0
      };
    }

    // Sumar todos los valores
    const totalTransactionValue = planValues.reduce((sum, pv) => sum + Number(pv.transactionValue), 0);
    const totalUsdValue = planValues.reduce((sum, pv) => sum + Number(pv.usdValue), 0);

    return {
      transactionCurrency: planValues[0].transactionCurrency,
      transactionValue: totalTransactionValue,
      usdValue: totalUsdValue,
      conversionRate: totalUsdValue / totalTransactionValue,
      month: 0 // Total anual
    };
  }
}
