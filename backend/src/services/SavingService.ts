import { PrismaClient } from '@prisma/client';

export interface SavingInput {
  budgetLineId: string;
  description: string;
  savingM1?: number;
  savingM2?: number;
  savingM3?: number;
  savingM4?: number;
  savingM5?: number;
  savingM6?: number;
  savingM7?: number;
  savingM8?: number;
  savingM9?: number;
  savingM10?: number;
  savingM11?: number;
  savingM12?: number;
}

export interface SavingFilters {
  budgetLineId?: string;
  budgetId?: string;
  status?: 'PENDING' | 'ACTIVE';
  createdBy?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

const savingInclude = {
  budgetLine: { include: { expense: true, budget: true, financialCompany: true } },
  user: { select: { id: true, username: true, fullName: true } }
};

export class SavingService {
  constructor(private prisma: PrismaClient) {}

  async createSaving(data: SavingInput, userId: string): Promise<any> {
    const budgetLine = await this.prisma.budgetLine.findUnique({
      where: { id: data.budgetLineId },
      include: { expense: true, budget: true }
    });
    if (!budgetLine) throw new Error('Línea de presupuesto no encontrada');

    const m = [
      data.savingM1 || 0, data.savingM2 || 0, data.savingM3 || 0,
      data.savingM4 || 0, data.savingM5 || 0, data.savingM6 || 0,
      data.savingM7 || 0, data.savingM8 || 0, data.savingM9 || 0,
      data.savingM10 || 0, data.savingM11 || 0, data.savingM12 || 0
    ];

    for (const v of m) {
      if (v < 0) throw new Error('Los valores mensuales no pueden ser negativos');
    }

    const totalAmount = m.reduce((a, b) => a + b, 0);
    if (totalAmount <= 0) throw new Error('El total del ahorro debe ser mayor a cero');

    // Build monthlyDistribution for backward compat
    const monthlyDistribution: Record<number, number> = {};
    m.forEach((v, i) => { if (v > 0) monthlyDistribution[i + 1] = v; });

    return await this.prisma.saving.create({
      data: {
        budgetLineId: data.budgetLineId,
        totalAmount,
        description: data.description,
        status: 'PENDING',
        monthlyDistribution: monthlyDistribution as any,
        savingM1: m[0], savingM2: m[1], savingM3: m[2],
        savingM4: m[3], savingM5: m[4], savingM6: m[5],
        savingM7: m[6], savingM8: m[7], savingM9: m[8],
        savingM10: m[9], savingM11: m[10], savingM12: m[11],
        createdBy: userId
      },
      include: savingInclude
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
      include: savingInclude,
      orderBy: { createdAt: 'desc' }
    });
  }

  async getSavingById(id: string): Promise<any | null> {
    return await this.prisma.saving.findUnique({
      where: { id },
      include: savingInclude
    });
  }

  async activateSaving(id: string): Promise<any> {
    const saving = await this.prisma.saving.findUnique({ where: { id } });
    if (!saving) throw new Error('Ahorro no encontrado');
    if (saving.status === 'ACTIVE') throw new Error('El ahorro ya está activo');

    return await this.prisma.saving.update({
      where: { id },
      data: { status: 'ACTIVE', activatedAt: new Date() },
      include: savingInclude
    });
  }

  async activateSavings(savingIds: string[]): Promise<any> {
    return await this.prisma.$transaction(async (tx: any) => {
      const savings = await tx.saving.findMany({
        where: { id: { in: savingIds } }
      });
      if (savings.length !== savingIds.length) throw new Error('Uno o más ahorros no encontrados');
      const alreadyActive = savings.filter((s: any) => s.status === 'ACTIVE');
      if (alreadyActive.length > 0) throw new Error('Uno o más ahorros ya están activos');

      await tx.saving.updateMany({
        where: { id: { in: savingIds } },
        data: { status: 'ACTIVE', activatedAt: new Date() }
      });

      return { success: true, savingsActivated: savingIds.length };
    });
  }

  async deleteSaving(id: string): Promise<void> {
    const saving = await this.prisma.saving.findUnique({ where: { id } });
    if (!saving) throw new Error('Ahorro no encontrado');
    if (saving.status === 'ACTIVE') throw new Error('No se puede eliminar un ahorro activo');
    await this.prisma.saving.delete({ where: { id } });
  }
}
