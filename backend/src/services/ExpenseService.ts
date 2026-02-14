import { PrismaClient, Expense } from '@prisma/client';
import { ExpenseInput } from '../types';

export class ExpenseService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async createExpense(budgetId: string, data: ExpenseInput): Promise<Expense> {
    // Validar campos requeridos
    if (!data.code || !data.shortDescription || !data.longDescription || 
        !data.technologyDirections || data.technologyDirections.length === 0 ||
        !data.userAreas || data.userAreas.length === 0 ||
        !data.financialCompanyId) {
      throw new Error('Todos los campos requeridos deben ser proporcionados');
    }

    // Validar que el presupuesto existe
    const budget = await this.prisma.budget.findUnique({ where: { id: budgetId } });
    if (!budget) {
      throw new Error('Presupuesto no encontrado');
    }

    // Validar unicidad de código dentro del presupuesto
    const existing = await this.prisma.expense.findUnique({
      where: {
        budgetId_code: {
          budgetId,
          code: data.code
        }
      }
    });

    if (existing) {
      throw new Error(`Ya existe un gasto con el código ${data.code} en este presupuesto`);
    }

    // Validar que las direcciones tecnológicas existen
    for (const techDirId of data.technologyDirections) {
      const techDir = await this.prisma.technologyDirection.findUnique({ where: { id: techDirId } });
      if (!techDir) {
        throw new Error(`Dirección tecnológica ${techDirId} no encontrada`);
      }
    }

    // Validar que las áreas de usuario existen
    for (const userAreaId of data.userAreas) {
      const userArea = await this.prisma.userArea.findUnique({ where: { id: userAreaId } });
      if (!userArea) {
        throw new Error(`Área de usuario ${userAreaId} no encontrada`);
      }
    }

    // Validar que la empresa financiera existe
    const financialCompany = await this.prisma.financialCompany.findUnique({
      where: { id: data.financialCompanyId }
    });
    if (!financialCompany) {
      throw new Error('Empresa financiera no encontrada');
    }

    // Validar padre si se proporciona
    if (data.parentExpenseId) {
      const parent = await this.prisma.expense.findUnique({
        where: { id: data.parentExpenseId }
      });
      if (!parent) {
        throw new Error('Gasto padre no encontrado');
      }
      if (parent.budgetId !== budgetId) {
        throw new Error('El gasto padre debe pertenecer al mismo presupuesto');
      }
    }

    // Crear gasto
    return await this.prisma.expense.create({
      data: {
        budgetId,
        code: data.code,
        shortDescription: data.shortDescription,
        longDescription: data.longDescription,
        technologyDirections: data.technologyDirections,
        userAreas: data.userAreas,
        financialCompanyId: data.financialCompanyId,
        parentExpenseId: data.parentExpenseId
      },
      include: {
        financialCompany: true,
        parentExpense: true,
        childExpenses: true
      }
    });
  }

  async getExpense(id: string): Promise<Expense | null> {
    return await this.prisma.expense.findUnique({
      where: { id },
      include: {
        budget: true,
        financialCompany: true,
        parentExpense: true,
        childExpenses: true,
        transactions: true,
        planValues: true,
        tagValues: {
          include: {
            tagDefinition: true
          }
        }
      }
    });
  }

  async getExpensesByBudget(budgetId: string): Promise<Expense[]> {
    return await this.prisma.expense.findMany({
      where: { budgetId },
      include: {
        financialCompany: true,
        parentExpense: true,
        childExpenses: true,
        transactions: true,
        planValues: true
      },
      orderBy: {
        code: 'asc'
      }
    });
  }

  async updateExpense(id: string, data: Partial<ExpenseInput>): Promise<Expense> {
    const expense = await this.prisma.expense.findUnique({ where: { id } });
    if (!expense) {
      throw new Error('Gasto no encontrado');
    }

    // Validar código único si se actualiza
    if (data.code && data.code !== expense.code) {
      const existing = await this.prisma.expense.findUnique({
        where: {
          budgetId_code: {
            budgetId: expense.budgetId,
            code: data.code
          }
        }
      });
      if (existing) {
        throw new Error(`Ya existe un gasto con el código ${data.code} en este presupuesto`);
      }
    }

    // Validar referencias si se actualizan
    if (data.technologyDirections) {
      for (const techDirId of data.technologyDirections) {
        const techDir = await this.prisma.technologyDirection.findUnique({ where: { id: techDirId } });
        if (!techDir) {
          throw new Error(`Dirección tecnológica ${techDirId} no encontrada`);
        }
      }
    }

    if (data.userAreas) {
      for (const userAreaId of data.userAreas) {
        const userArea = await this.prisma.userArea.findUnique({ where: { id: userAreaId } });
        if (!userArea) {
          throw new Error(`Área de usuario ${userAreaId} no encontrada`);
        }
      }
    }

    if (data.financialCompanyId) {
      const financialCompany = await this.prisma.financialCompany.findUnique({
        where: { id: data.financialCompanyId }
      });
      if (!financialCompany) {
        throw new Error('Empresa financiera no encontrada');
      }
    }

    return await this.prisma.expense.update({
      where: { id },
      data,
      include: {
        financialCompany: true,
        parentExpense: true,
        childExpenses: true
      }
    });
  }

  async deleteExpense(id: string): Promise<void> {
    await this.prisma.expense.delete({
      where: { id }
    });
  }

  async getExpenseMetadata(id: string) {
    const expense = await this.prisma.expense.findUnique({
      where: { id },
      include: {
        financialCompany: true,
        tagValues: {
          include: {
            tagDefinition: true
          }
        }
      }
    });

    if (!expense) {
      throw new Error('Gasto no encontrado');
    }

    // Cargar direcciones tecnológicas
    const technologyDirections = await this.prisma.technologyDirection.findMany({
      where: {
        id: {
          in: expense.technologyDirections
        }
      }
    });

    // Cargar áreas de usuario
    const userAreas = await this.prisma.userArea.findMany({
      where: {
        id: {
          in: expense.userAreas
        }
      }
    });

    return {
      expense,
      technologyDirections,
      userAreas,
      financialCompany: expense.financialCompany,
      tags: expense.tagValues
    };
  }
}
