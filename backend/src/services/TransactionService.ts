import { PrismaClient, Transaction, TransactionType } from '@prisma/client';
import { TransactionInput } from '../types';

export class TransactionService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async createTransaction(data: TransactionInput): Promise<Transaction> {
    // Validar campos requeridos
    if (!data.expenseId || !data.type || !data.serviceDate || !data.postingDate ||
        !data.referenceDocumentNumber || !data.externalPlatformLink ||
        !data.transactionCurrency || data.transactionValue === undefined || !data.month) {
      throw new Error('Todos los campos requeridos deben ser proporcionados');
    }

    // Validar que el gasto existe
    const expense = await this.prisma.expense.findUnique({
      where: { id: data.expenseId }
    });
    if (!expense) {
      throw new Error('Gasto no encontrado');
    }

    // Validar unicidad de referenceDocumentNumber por gasto
    const existing = await this.prisma.transaction.findUnique({
      where: {
        expenseId_referenceDocumentNumber: {
          expenseId: data.expenseId,
          referenceDocumentNumber: data.referenceDocumentNumber
        }
      }
    });

    if (existing) {
      throw new Error(`Ya existe una transacción con el número de documento ${data.referenceDocumentNumber} para este gasto`);
    }

    // Validar mes (1-12)
    if (data.month < 1 || data.month > 12) {
      throw new Error('El mes debe estar entre 1 y 12');
    }

    // Obtener tasa de conversión
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

    // Crear transacción
    return await this.prisma.transaction.create({
      data: {
        expenseId: data.expenseId,
        type: data.type,
        serviceDate: data.serviceDate,
        postingDate: data.postingDate,
        referenceDocumentNumber: data.referenceDocumentNumber,
        externalPlatformLink: data.externalPlatformLink,
        transactionCurrency: data.transactionCurrency,
        transactionValue: data.transactionValue,
        usdValue,
        conversionRate: conversionRate.rate,
        month: data.month
      },
      include: {
        expense: true
      }
    });
  }

  async getTransaction(id: string): Promise<Transaction | null> {
    return await this.prisma.transaction.findUnique({
      where: { id },
      include: {
        expense: true
      }
    });
  }

  async getTransactionsByExpense(expenseId: string): Promise<Transaction[]> {
    return await this.prisma.transaction.findMany({
      where: { expenseId },
      orderBy: [
        { month: 'asc' },
        { postingDate: 'asc' }
      ],
      include: {
        expense: true
      }
    });
  }

  async getTransactionsByMonth(expenseId: string, month: number): Promise<Transaction[]> {
    return await this.prisma.transaction.findMany({
      where: {
        expenseId,
        month
      },
      orderBy: {
        postingDate: 'asc'
      },
      include: {
        expense: true
      }
    });
  }

  async updateTransaction(id: string, data: Partial<TransactionInput>): Promise<Transaction> {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id },
      include: { expense: true }
    });

    if (!transaction) {
      throw new Error('Transacción no encontrada');
    }

    // Validar unicidad de referenceDocumentNumber si se actualiza
    if (data.referenceDocumentNumber && data.referenceDocumentNumber !== transaction.referenceDocumentNumber) {
      const existing = await this.prisma.transaction.findUnique({
        where: {
          expenseId_referenceDocumentNumber: {
            expenseId: transaction.expenseId,
            referenceDocumentNumber: data.referenceDocumentNumber
          }
        }
      });

      if (existing) {
        throw new Error(`Ya existe una transacción con el número de documento ${data.referenceDocumentNumber} para este gasto`);
      }
    }

    // Recalcular USD si cambia valor, moneda o mes
    let updateData: any = { ...data };
    
    if (data.transactionValue !== undefined || data.transactionCurrency || data.month) {
      const month = data.month ?? transaction.month;
      const currency = data.transactionCurrency ?? transaction.transactionCurrency;
      const value = data.transactionValue ?? Number(transaction.transactionValue);

      const conversionRate = await this.prisma.conversionRate.findUnique({
        where: {
          budgetId_currency_month: {
            budgetId: transaction.expense.budgetId,
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

    return await this.prisma.transaction.update({
      where: { id },
      data: updateData,
      include: {
        expense: true
      }
    });
  }

  async deleteTransaction(id: string): Promise<void> {
    await this.prisma.transaction.delete({
      where: { id }
    });
  }

  async getMonthlyCommitted(expenseId: string, month: number) {
    const transactions = await this.prisma.transaction.findMany({
      where: {
        expenseId,
        month,
        type: TransactionType.COMMITTED
      }
    });

    if (transactions.length === 0) {
      return {
        transactionCurrency: '',
        transactionValue: 0,
        usdValue: 0,
        conversionRate: 0,
        month
      };
    }

    // Sumar todas las transacciones del mes
    const totalTransactionValue = transactions.reduce((sum, t) => sum + Number(t.transactionValue), 0);
    const totalUsdValue = transactions.reduce((sum, t) => sum + Number(t.usdValue), 0);

    return {
      transactionCurrency: transactions[0].transactionCurrency,
      transactionValue: totalTransactionValue,
      usdValue: totalUsdValue,
      conversionRate: totalUsdValue / totalTransactionValue,
      month
    };
  }

  async getMonthlyReal(expenseId: string, month: number) {
    const transactions = await this.prisma.transaction.findMany({
      where: {
        expenseId,
        month,
        type: TransactionType.REAL
      }
    });

    if (transactions.length === 0) {
      return {
        transactionCurrency: '',
        transactionValue: 0,
        usdValue: 0,
        conversionRate: 0,
        month
      };
    }

    // Sumar todas las transacciones del mes
    const totalTransactionValue = transactions.reduce((sum, t) => sum + Number(t.transactionValue), 0);
    const totalUsdValue = transactions.reduce((sum, t) => sum + Number(t.usdValue), 0);

    return {
      transactionCurrency: transactions[0].transactionCurrency,
      transactionValue: totalTransactionValue,
      usdValue: totalUsdValue,
      conversionRate: totalUsdValue / totalTransactionValue,
      month
    };
  }
}
