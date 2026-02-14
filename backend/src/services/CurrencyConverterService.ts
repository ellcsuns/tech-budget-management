import { PrismaClient, ConversionRate } from '@prisma/client';
import { ConversionRateInput } from '../types';

export class CurrencyConverterService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async setConversionRate(data: ConversionRateInput): Promise<ConversionRate> {
    // Validar que el presupuesto existe
    const budget = await this.prisma.budget.findUnique({
      where: { id: data.budgetId }
    });
    if (!budget) {
      throw new Error('Presupuesto no encontrado');
    }

    // Validar mes (1-12)
    if (data.month < 1 || data.month > 12) {
      throw new Error('El mes debe estar entre 1 y 12');
    }

    // Validar tasa positiva
    if (data.rate <= 0) {
      throw new Error('La tasa de conversión debe ser mayor a 0');
    }

    // Verificar si ya existe una tasa para este presupuesto, moneda y mes
    const existing = await this.prisma.conversionRate.findUnique({
      where: {
        budgetId_currency_month: {
          budgetId: data.budgetId,
          currency: data.currency,
          month: data.month
        }
      }
    });

    if (existing) {
      // Actualizar tasa existente
      return await this.prisma.conversionRate.update({
        where: {
          budgetId_currency_month: {
            budgetId: data.budgetId,
            currency: data.currency,
            month: data.month
          }
        },
        data: {
          rate: data.rate
        },
        include: {
          budget: true
        }
      });
    }

    // Crear nueva tasa
    return await this.prisma.conversionRate.create({
      data: {
        budgetId: data.budgetId,
        currency: data.currency,
        month: data.month,
        rate: data.rate
      },
      include: {
        budget: true
      }
    });
  }

  async getConversionRate(budgetId: string, currency: string, month: number): Promise<ConversionRate | null> {
    return await this.prisma.conversionRate.findUnique({
      where: {
        budgetId_currency_month: {
          budgetId,
          currency,
          month
        }
      },
      include: {
        budget: true
      }
    });
  }

  async convertToUSD(budgetId: string, amount: number, currency: string, month: number): Promise<number> {
    // Si ya es USD, retornar el mismo valor
    if (currency === 'USD') {
      return amount;
    }

    const conversionRate = await this.getConversionRate(budgetId, currency, month);
    
    if (!conversionRate) {
      throw new Error(`No se encontró tasa de conversión para ${currency} en el mes ${month} del presupuesto ${budgetId}`);
    }

    return amount * Number(conversionRate.rate);
  }

  async getConversionHistory(budgetId: string): Promise<ConversionRate[]> {
    return await this.prisma.conversionRate.findMany({
      where: { budgetId },
      orderBy: [
        { currency: 'asc' },
        { month: 'asc' }
      ],
      include: {
        budget: true
      }
    });
  }

  async deleteConversionRate(budgetId: string, currency: string, month: number): Promise<void> {
    await this.prisma.conversionRate.delete({
      where: {
        budgetId_currency_month: {
          budgetId,
          currency,
          month
        }
      }
    });
  }

  async getConversionRatesByCurrency(budgetId: string, currency: string): Promise<ConversionRate[]> {
    return await this.prisma.conversionRate.findMany({
      where: {
        budgetId,
        currency
      },
      orderBy: {
        month: 'asc'
      },
      include: {
        budget: true
      }
    });
  }

  async getConversionRatesByMonth(budgetId: string, month: number): Promise<ConversionRate[]> {
    return await this.prisma.conversionRate.findMany({
      where: {
        budgetId,
        month
      },
      orderBy: {
        currency: 'asc'
      },
      include: {
        budget: true
      }
    });
  }
}
