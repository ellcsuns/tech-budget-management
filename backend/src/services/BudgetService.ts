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
}
