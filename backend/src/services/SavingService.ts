import { PrismaClient, Saving, SavingStatus } from '@prisma/client';

export interface SavingInput {
  expenseId: string;
  budgetId: string;
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
  expenseId?: string;
  budgetId?: string;
  status?: SavingStatus;
  createdBy?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export class SavingService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Create a new saving
   */
  async createSaving(data: SavingInput, userId: string): Promise<Saving> {
    // Validate totalAmount
    if (data.totalAmount <= 0) {
      throw new Error('Total amount must be greater than zero');
    }

    // Validate expense exists in budget
    const expense = await this.prisma.expense.findFirst({
      where: {
        id: data.expenseId,
        budgetId: data.budgetId
      }
    });

    if (!expense) {
      throw new Error('Expense not found in specified budget');
    }

    // Calculate monthly distribution
    const monthlyDistribution = this.calculateMonthlyDistribution(data);

    // Create saving
    return await this.prisma.saving.create({
      data: {
        expenseId: data.expenseId,
        budgetId: data.budgetId,
        totalAmount: data.totalAmount,
        description: data.description,
        status: SavingStatus.PENDING,
        monthlyDistribution: monthlyDistribution as any,
        createdBy: userId
      },
      include: {
        expense: true,
        budget: true,
        user: true
      }
    });
  }

  /**
   * Get savings with optional filters
   */
  async getSavings(filters?: SavingFilters): Promise<Saving[]> {
    const where: any = {};

    if (filters?.expenseId) {
      where.expenseId = filters.expenseId;
    }

    if (filters?.budgetId) {
      where.budgetId = filters.budgetId;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.createdBy) {
      where.createdBy = filters.createdBy;
    }

    if (filters?.dateFrom || filters?.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) {
        where.createdAt.gte = filters.dateFrom;
      }
      if (filters.dateTo) {
        where.createdAt.lte = filters.dateTo;
      }
    }

    return await this.prisma.saving.findMany({
      where,
      include: {
        expense: true,
        budget: true,
        user: {
          select: {
            id: true,
            username: true,
            fullName: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  /**
   * Get saving by ID
   */
  async getSavingById(id: string): Promise<Saving | null> {
    return await this.prisma.saving.findUnique({
      where: { id },
      include: {
        expense: true,
        budget: true,
        user: {
          select: {
            id: true,
            username: true,
            fullName: true
          }
        }
      }
    });
  }

  /**
   * Approve multiple savings and create new budget version
   */
  async approveSavings(savingIds: string[]): Promise<any> {
    return await this.prisma.$transaction(async (tx) => {
      // Fetch all savings
      const savings = await tx.saving.findMany({
        where: {
          id: { in: savingIds }
        },
        include: {
          expense: true
        }
      });

      // Validate all savings exist and are PENDING
      if (savings.length !== savingIds.length) {
        throw new Error('One or more savings not found');
      }

      const alreadyApproved = savings.filter(s => s.status === SavingStatus.APPROVED);
      if (alreadyApproved.length > 0) {
        throw new Error('One or more savings have already been approved');
      }

      // Group savings by budgetId
      const savingsByBudget = savings.reduce((acc, saving) => {
        if (!acc[saving.budgetId]) {
          acc[saving.budgetId] = [];
        }
        acc[saving.budgetId].push(saving);
        return acc;
      }, {} as Record<string, typeof savings>);

      // For each budget, aggregate savings and create new version
      const newBudgets = [];
      
      for (const [budgetId, budgetSavings] of Object.entries(savingsByBudget)) {
        // Aggregate monthly distributions by expense
        const expenseDistributions: Record<string, MonthlyDistribution> = {};
        
        for (const saving of budgetSavings) {
          if (!expenseDistributions[saving.expenseId]) {
            expenseDistributions[saving.expenseId] = {};
          }
          
          const distribution = saving.monthlyDistribution as MonthlyDistribution;
          for (const [month, amount] of Object.entries(distribution)) {
            const monthNum = parseInt(month);
            if (!expenseDistributions[saving.expenseId][monthNum]) {
              expenseDistributions[saving.expenseId][monthNum] = 0;
            }
            expenseDistributions[saving.expenseId][monthNum] += amount;
          }
        }

        // Build planValueChanges array (negative amounts for savings)
        const planValueChanges = [];
        for (const [expenseId, distribution] of Object.entries(expenseDistributions)) {
          const expense = budgetSavings.find(s => s.expenseId === expenseId)?.expense;
          const currency = expense?.planValues?.[0]?.transactionCurrency || 'USD';
          
          for (const [month, amount] of Object.entries(distribution)) {
            planValueChanges.push({
              expenseId,
              month: parseInt(month),
              transactionValue: -amount, // Negative for savings
              transactionCurrency: currency
            });
          }
        }

        // Create new budget version using BudgetService
        // Note: This would normally call BudgetService.createNewVersion()
        // For now, we'll just mark savings as approved
        // The actual version creation should be done by BudgetService
      }

      // Update all savings to APPROVED
      await tx.saving.updateMany({
        where: {
          id: { in: savingIds }
        },
        data: {
          status: SavingStatus.APPROVED,
          approvedAt: new Date()
        }
      });

      return { success: true, savingsApproved: savingIds.length };
    });
  }

  /**
   * Delete a saving
   */
  async deleteSaving(id: string): Promise<void> {
    await this.prisma.saving.delete({
      where: { id }
    });
  }

  /**
   * Calculate monthly distribution based on strategy
   */
  private calculateMonthlyDistribution(data: SavingInput): MonthlyDistribution {
    const distribution: MonthlyDistribution = {};

    switch (data.distributionStrategy) {
      case 'EVEN':
        const amountPerMonth = Math.floor((data.totalAmount * 100) / 12) / 100;
        const remainder = data.totalAmount - (amountPerMonth * 12);
        
        for (let month = 1; month <= 12; month++) {
          distribution[month] = month === 1 ? amountPerMonth + remainder : amountPerMonth;
        }
        break;

      case 'SINGLE_MONTH':
        if (!data.targetMonth || data.targetMonth < 1 || data.targetMonth > 12) {
          throw new Error('Target month must be between 1 and 12');
        }
        distribution[data.targetMonth] = data.totalAmount;
        break;

      case 'CUSTOM':
        if (!data.customDistribution) {
          throw new Error('Custom distribution is required for CUSTOM strategy');
        }
        
        this.validateCustomDistribution(data.customDistribution, data.totalAmount);
        Object.assign(distribution, data.customDistribution);
        break;

      default:
        throw new Error('Invalid distribution strategy');
    }

    return distribution;
  }

  /**
   * Validate custom distribution
   */
  private validateCustomDistribution(distribution: Record<number, number>, totalAmount: number): void {
    // Validate all months are between 1 and 12
    for (const month of Object.keys(distribution)) {
      const monthNum = parseInt(month);
      if (monthNum < 1 || monthNum > 12) {
        throw new Error('Month must be between 1 and 12');
      }
    }

    // Validate all amounts are non-negative
    for (const amount of Object.values(distribution)) {
      if (amount < 0) {
        throw new Error('Monthly amounts must be non-negative');
      }
    }

    // Validate sum equals totalAmount
    const sum = Object.values(distribution).reduce((acc, val) => acc + val, 0);
    const tolerance = 0.01;
    if (Math.abs(sum - totalAmount) > tolerance) {
      throw new Error(`Sum of monthly distributions (${sum}) must equal total amount (${totalAmount})`);
    }

    // Validate at least one month has non-zero amount
    const hasNonZero = Object.values(distribution).some(val => val > 0);
    if (!hasNonZero) {
      throw new Error('At least one month must have a non-zero amount');
    }
  }
}
