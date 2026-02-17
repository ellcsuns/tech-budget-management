import { PrismaClient } from '@prisma/client';

export interface SavingInput {
  budgetLineId: string;
  totalAmount: number;
  description: string;
  distributionStrategy: 'EVEN' | 'SINGLE_MONTH' | 'CUSTOM';
  targetMonth?: number;
  customDistribution?: Record<number, number>;
}

export interface MonthlyDistribution {
  [month: number]: number;
}

export interface SavingFilters {
  budgetLineId?: string;
  budgetId?: string;
  status?: 'PENDING' | 'APPROVED';
  createdBy?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export class SavingService {
  constructor(private prisma: PrismaClient) {}

  async createSaving(data: SavingInput, userId: string): Promise<any> {
    if (data.totalAmount <= 0) throw new Error('Total amount must be greater than zero');

    const budgetLine = await this.prisma.budgetLine.findUnique({
      where: { id: data.budgetLineId },
      include: { expense: true, budget: true }
    });
    if (!budgetLine) throw new Error('Budget line not found');

    const monthlyDistribution = this.calculateMonthlyDistribution(data);

    return await this.prisma.saving.create({
      data: {
        budgetLineId: data.budgetLineId,
        totalAmount: data.totalAmount,
        description: data.description,
        status: 'PENDING',
        monthlyDistribution: monthlyDistribution as any,
        createdBy: userId
      },
      include: { budgetLine: { include: { expense: true, budget: true } }, user: true }
    });
  }

  async getSavings(filters?: SavingFilters): Promise<any[]> {
    const where: any = {};
    if (filters?.budgetLineId) where.budgetLineId = filters.budgetLineId;
    if (filters?.budgetId) where.budgetLine = { budgetId: filters.budgetId };
    if (filters?.status) where.status = filters.status;
    if (filters?.createdBy) where.createdBy = filters.createdBy;
    if (filters?.dateFrom || filters?.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) where.createdAt.gte = filters.dateFrom;
      if (filters.dateTo) where.createdAt.lte = filters.dateTo;
    }

    return await this.prisma.saving.findMany({
      where,
      include: {
        budgetLine: { include: { expense: true, budget: true } },
        user: { select: { id: true, username: true, fullName: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getSavingById(id: string): Promise<any | null> {
    return await this.prisma.saving.findUnique({
      where: { id },
      include: {
        budgetLine: { include: { expense: true, budget: true } },
        user: { select: { id: true, username: true, fullName: true } }
      }
    });
  }

  async approveSavings(savingIds: string[]): Promise<any> {
    return await this.prisma.$transaction(async (tx: any) => {
      const savings = await tx.saving.findMany({
        where: { id: { in: savingIds } },
        include: { budgetLine: { include: { expense: true } } }
      });

      if (savings.length !== savingIds.length) throw new Error('One or more savings not found');
      const alreadyApproved = savings.filter((s: any) => s.status === 'APPROVED');
      if (alreadyApproved.length > 0) throw new Error('One or more savings have already been approved');

      await tx.saving.updateMany({
        where: { id: { in: savingIds } },
        data: { status: 'APPROVED', approvedAt: new Date() }
      });

      return { success: true, savingsApproved: savingIds.length };
    });
  }

  async deleteSaving(id: string): Promise<void> {
    await this.prisma.saving.delete({ where: { id } });
  }

  private calculateMonthlyDistribution(data: SavingInput): MonthlyDistribution {
    const distribution: MonthlyDistribution = {};
    switch (data.distributionStrategy) {
      case 'EVEN': {
        const amountPerMonth = Math.floor((data.totalAmount * 100) / 12) / 100;
        const remainder = data.totalAmount - (amountPerMonth * 12);
        for (let month = 1; month <= 12; month++) {
          distribution[month] = month === 1 ? amountPerMonth + remainder : amountPerMonth;
        }
        break;
      }
      case 'SINGLE_MONTH':
        if (!data.targetMonth || data.targetMonth < 1 || data.targetMonth > 12) throw new Error('Target month must be between 1 and 12');
        distribution[data.targetMonth] = data.totalAmount;
        break;
      case 'CUSTOM':
        if (!data.customDistribution) throw new Error('Custom distribution is required for CUSTOM strategy');
        this.validateCustomDistribution(data.customDistribution, data.totalAmount);
        Object.assign(distribution, data.customDistribution);
        break;
      default: throw new Error('Invalid distribution strategy');
    }
    return distribution;
  }

  private validateCustomDistribution(distribution: Record<number, number>, totalAmount: number): void {
    for (const month of Object.keys(distribution)) {
      if (parseInt(month) < 1 || parseInt(month) > 12) throw new Error('Month must be between 1 and 12');
    }
    for (const amount of Object.values(distribution)) {
      if (amount < 0) throw new Error('Monthly amounts must be non-negative');
    }
    const sum = Object.values(distribution).reduce((acc, val) => acc + val, 0);
    if (Math.abs(sum - totalAmount) > 0.01) throw new Error(`Sum of monthly distributions (${sum}) must equal total amount (${totalAmount})`);
    if (!Object.values(distribution).some(val => val > 0)) throw new Error('At least one month must have a non-zero amount');
  }
}
