import { PrismaClient } from '@prisma/client';
import { BudgetLineInput, MonthlyPlanValues } from '../types';

export class BudgetLineService {
  constructor(private prisma: PrismaClient) {}

  async createBudgetLine(data: BudgetLineInput) {
    // Validar que el presupuesto existe
    const budget = await this.prisma.budget.findUnique({ where: { id: data.budgetId } });
    if (!budget) throw new Error('Presupuesto no encontrado');

    // Validar que el gasto existe
    const expense = await this.prisma.expense.findUnique({ where: { id: data.expenseId } });
    if (!expense) throw new Error('Gasto no encontrado');

    // Validar que la empresa financiera existe
    const company = await this.prisma.financialCompany.findUnique({ where: { id: data.financialCompanyId } });
    if (!company) throw new Error('Empresa financiera no encontrada');

    // Validar unicidad de clave compuesta
    const existing = await this.prisma.budgetLine.findUnique({
      where: {
        budgetId_expenseId_financialCompanyId: {
          budgetId: data.budgetId,
          expenseId: data.expenseId,
          financialCompanyId: data.financialCompanyId
        }
      }
    });
    if (existing) throw new Error('Ya existe una línea para este gasto y empresa en este presupuesto');

    // Derivar moneda de la empresa financiera
    const currency = company.currencyCode;

    return await this.prisma.budgetLine.create({
      data: {
        budgetId: data.budgetId,
        expenseId: data.expenseId,
        financialCompanyId: data.financialCompanyId,
        technologyDirectionId: data.technologyDirectionId || null,
        currency,
        planM1: data.planM1 || 0,
        planM2: data.planM2 || 0,
        planM3: data.planM3 || 0,
        planM4: data.planM4 || 0,
        planM5: data.planM5 || 0,
        planM6: data.planM6 || 0,
        planM7: data.planM7 || 0,
        planM8: data.planM8 || 0,
        planM9: data.planM9 || 0,
        planM10: data.planM10 || 0,
        planM11: data.planM11 || 0,
        planM12: data.planM12 || 0,
      },
      include: { expense: true, financialCompany: true, budget: true, technologyDirection: true }
    });
  }

  async getBudgetLinesByBudget(budgetId: string) {
    return await this.prisma.budgetLine.findMany({
      where: { budgetId },
      include: {
        expense: { include: { tagValues: { include: { tagDefinition: true } } } },
        financialCompany: true,
        technologyDirection: true,
        transactions: true
      },
      orderBy: { expense: { code: 'asc' } }
    });
  }

  async getBudgetLine(id: string) {
    return await this.prisma.budgetLine.findUnique({
      where: { id },
      include: {
        expense: true,
        financialCompany: true,
        technologyDirection: true,
        budget: true,
        transactions: true
      }
    });
  }

  async updatePlanValues(id: string, values: MonthlyPlanValues) {
    const budgetLine = await this.prisma.budgetLine.findUnique({ where: { id } });
    if (!budgetLine) throw new Error('Línea de presupuesto no encontrada');

    return await this.prisma.budgetLine.update({
      where: { id },
      data: values,
      include: { expense: true, financialCompany: true }
    });
  }

  async deleteBudgetLine(id: string) {
    await this.prisma.budgetLine.delete({ where: { id } });
  }
}
