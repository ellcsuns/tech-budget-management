import { PrismaClient } from '@prisma/client';

export class DeferralService {
  constructor(private prisma: PrismaClient) {}

  async create(data: {
    expenseId: string;
    budgetId: string;
    description: string;
    totalAmount: number;
    startMonth: number;
    endMonth: number;
    createdBy: string;
  }) {
    if (data.startMonth < 1 || data.startMonth > 12 || data.endMonth < 1 || data.endMonth > 12) {
      throw new Error('Los meses deben estar entre 1 y 12');
    }
    if (data.startMonth > data.endMonth) {
      throw new Error('El mes de inicio debe ser menor o igual al mes de fin');
    }
    if (data.totalAmount <= 0) {
      throw new Error('El monto total debe ser mayor a 0');
    }

    return await this.prisma.deferral.create({
      data: {
        expenseId: data.expenseId,
        budgetId: data.budgetId,
        description: data.description,
        totalAmount: data.totalAmount,
        startMonth: data.startMonth,
        endMonth: data.endMonth,
        createdBy: data.createdBy
      },
      include: { expense: true, budget: true, user: true }
    });
  }

  async getByBudget(budgetId: string) {
    return await this.prisma.deferral.findMany({
      where: { budgetId },
      include: { expense: true, budget: true, user: true },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getById(id: string) {
    return await this.prisma.deferral.findUnique({
      where: { id },
      include: { expense: true, budget: true, user: true }
    });
  }

  async delete(id: string) {
    return await this.prisma.deferral.delete({ where: { id } });
  }
}
