import { PrismaClient, Transaction, TransactionType } from '@prisma/client';
import { TransactionInput } from '../types';

export class TransactionService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async createTransaction(data: TransactionInput): Promise<Transaction> {
    if (!data.budgetLineId || !data.financialCompanyId || !data.type || !data.serviceDate ||
        !data.postingDate || !data.referenceDocumentNumber || !data.externalPlatformLink ||
        !data.transactionCurrency || data.transactionValue === undefined) {
      throw new Error('Todos los campos requeridos deben ser proporcionados');
    }

    const postingDateObj = new Date(data.postingDate);
    const serviceDateObj = new Date(data.serviceDate);
    const month = postingDateObj.getMonth() + 1; // Derivar mes de postingDate

    // Validar que la línea de presupuesto existe
    const budgetLine = await this.prisma.budgetLine.findUnique({
      where: { id: data.budgetLineId },
      include: { budget: true }
    });
    if (!budgetLine) throw new Error('Línea de presupuesto no encontrada');

    // Validar que la empresa financiera existe
    const company = await this.prisma.financialCompany.findUnique({ where: { id: data.financialCompanyId } });
    if (!company) throw new Error('Empresa financiera no encontrada');

    // Validar unicidad de referenceDocumentNumber por budgetLine
    const existing = await this.prisma.transaction.findUnique({
      where: {
        budgetLineId_referenceDocumentNumber: {
          budgetLineId: data.budgetLineId,
          referenceDocumentNumber: data.referenceDocumentNumber
        }
      }
    });
    if (existing) throw new Error(`Ya existe una transacción con el número de documento ${data.referenceDocumentNumber}`);

    if (month < 1 || month > 12) throw new Error('El mes debe estar entre 1 y 12');

    // Obtener tasa de conversión
    const conversionRate = await this.prisma.conversionRate.findUnique({
      where: {
        budgetId_currency_month: {
          budgetId: budgetLine.budgetId,
          currency: data.transactionCurrency,
          month
        }
      }
    });
    if (!conversionRate) throw new Error(`No se encontró tasa de conversión para ${data.transactionCurrency} en el mes ${month}`);

    const usdValue = data.transactionValue * Number(conversionRate.rate);

    // Lógica de compensación: si es REAL y referencia una comprometida
    if (data.type === TransactionType.REAL && data.committedTransactionId) {
      const committed = await this.prisma.transaction.findUnique({ where: { id: data.committedTransactionId } });
      if (!committed) throw new Error('Transacción comprometida referenciada no encontrada');
      if (committed.type !== TransactionType.COMMITTED) throw new Error('La transacción referenciada no es comprometida');
      if (committed.isCompensated) throw new Error('La transacción comprometida ya está compensada');
    }

    // Crear transacción (y compensar si aplica) en una transacción de BD
    return await this.prisma.$transaction(async (tx: any) => {
      const transaction = await tx.transaction.create({
        data: {
          budgetLineId: data.budgetLineId,
          financialCompanyId: data.financialCompanyId,
          type: data.type,
          serviceDate: serviceDateObj,
          postingDate: postingDateObj,
          referenceDocumentNumber: data.referenceDocumentNumber,
          externalPlatformLink: data.externalPlatformLink,
          transactionCurrency: data.transactionCurrency,
          transactionValue: data.transactionValue,
          usdValue,
          conversionRate: conversionRate.rate,
          month,
          compensatedById: data.committedTransactionId || null,
          isCompensated: false
        },
        include: { budgetLine: { include: { expense: true } }, financialCompany: true }
      });

      // Marcar la comprometida como compensada
      if (data.type === TransactionType.REAL && data.committedTransactionId) {
        await tx.transaction.update({
          where: { id: data.committedTransactionId },
          data: { isCompensated: true }
        });
      }

      return transaction;
    });
  }

  async getTransaction(id: string): Promise<Transaction | null> {
    return await this.prisma.transaction.findUnique({
      where: { id },
      include: { budgetLine: { include: { expense: true } }, financialCompany: true }
    });
  }

  async getTransactionsByBudgetLine(budgetLineId: string): Promise<Transaction[]> {
    return await this.prisma.transaction.findMany({
      where: { budgetLineId },
      orderBy: [{ month: 'asc' }, { postingDate: 'asc' }],
      include: { budgetLine: { include: { expense: true } }, financialCompany: true }
    });
  }

  async getTransactionsByType(type: TransactionType): Promise<Transaction[]> {
    return await this.prisma.transaction.findMany({
      where: { type },
      orderBy: { createdAt: 'desc' },
      include: { budgetLine: { include: { expense: true } }, financialCompany: true }
    });
  }

  async getUncompensatedCommitted(budgetLineId: string): Promise<Transaction[]> {
    return await this.prisma.transaction.findMany({
      where: {
        budgetLineId,
        type: TransactionType.COMMITTED,
        isCompensated: false
      },
      orderBy: { postingDate: 'asc' },
      include: { budgetLine: { include: { expense: true } }, financialCompany: true }
    });
  }

  async updateTransaction(id: string, data: Partial<TransactionInput>): Promise<Transaction> {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id },
      include: { budgetLine: { include: { budget: true } } }
    });
    if (!transaction) throw new Error('Transacción no encontrada');

    let updateData: any = { ...data };

    if (updateData.serviceDate && typeof updateData.serviceDate === 'string') {
      updateData.serviceDate = new Date(updateData.serviceDate);
    }
    if (updateData.postingDate && typeof updateData.postingDate === 'string') {
      updateData.postingDate = new Date(updateData.postingDate);
    }
    // Derivar mes de postingDate si cambió
    if (updateData.postingDate) {
      updateData.month = new Date(updateData.postingDate).getMonth() + 1;
    }

    // Recalcular USD si cambia valor o moneda
    if (data.transactionValue !== undefined || data.transactionCurrency) {
      const month = updateData.month ?? transaction.month;
      const currency = data.transactionCurrency ?? transaction.transactionCurrency;
      const value = data.transactionValue ?? Number(transaction.transactionValue);

      const conversionRate = await this.prisma.conversionRate.findUnique({
        where: {
          budgetId_currency_month: {
            budgetId: transaction.budgetLine.budgetId,
            currency,
            month
          }
        }
      });
      if (!conversionRate) throw new Error(`No se encontró tasa de conversión para ${currency} en el mes ${month}`);

      updateData.usdValue = value * Number(conversionRate.rate);
      updateData.conversionRate = conversionRate.rate;
    }

    // Remove fields that shouldn't be passed to update
    delete updateData.committedTransactionId;
    delete updateData.budgetLineId;
    delete updateData.financialCompanyId;

    return await this.prisma.transaction.update({
      where: { id },
      data: updateData,
      include: { budgetLine: { include: { expense: true } }, financialCompany: true }
    });
  }

  async deleteTransaction(id: string): Promise<void> {
    const transaction = await this.prisma.transaction.findUnique({ where: { id } });
    if (!transaction) throw new Error('Transacción no encontrada');

    await this.prisma.$transaction(async (tx: any) => {
      // Si es REAL y compensaba una comprometida, revertir compensación
      if (transaction.type === TransactionType.REAL && transaction.compensatedById) {
        await tx.transaction.update({
          where: { id: transaction.compensatedById },
          data: { isCompensated: false }
        });
      }
      await tx.transaction.delete({ where: { id } });
    });
  }

  async getMonthlyCommitted(budgetLineId: string, month: number) {
    const transactions = await this.prisma.transaction.findMany({
      where: { budgetLineId, month, type: TransactionType.COMMITTED, isCompensated: false }
    });

    if (transactions.length === 0) {
      return { transactionCurrency: '', transactionValue: 0, usdValue: 0, conversionRate: 0, month };
    }

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

  async getMonthlyReal(budgetLineId: string, month: number) {
    const transactions = await this.prisma.transaction.findMany({
      where: { budgetLineId, month, type: TransactionType.REAL }
    });

    if (transactions.length === 0) {
      return { transactionCurrency: '', transactionValue: 0, usdValue: 0, conversionRate: 0, month };
    }

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
