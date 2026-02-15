import { PrismaClient, Expense } from '@prisma/client';
import { ExpenseInput, ExpenseFilters, CustomTag } from '../types';

export interface ExpenseWithTags extends Expense {
  customTags: CustomTag[];
}

export class ExpenseService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async createExpense(budgetId: string, data: ExpenseInput): Promise<Expense> {
    // Validar campos requeridos con mensajes específicos
    if (!data.code || data.code.trim() === '') {
      throw new Error('Field code is required');
    }
    if (!data.shortDescription || data.shortDescription.trim() === '') {
      throw new Error('Field shortDescription is required');
    }
    if (!data.longDescription || data.longDescription.trim() === '') {
      throw new Error('Field longDescription is required');
    }
    if (!data.financialCompanyId || data.financialCompanyId.trim() === '') {
      throw new Error('Field financialCompanyId is required');
    }
    if (!data.technologyDirections || data.technologyDirections.length === 0) {
      throw new Error('Field technologyDirections is required');
    }
    if (!data.userAreas || data.userAreas.length === 0) {
      throw new Error('Field userAreas is required');
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
    // Delete custom tag definitions (cascade will delete tag values)
    const tagDefs = await this.prisma.tagDefinition.findMany({
      where: {
        name: {
          startsWith: `custom:${id}:`
        }
      }
    });

    await this.prisma.tagDefinition.deleteMany({
      where: {
        id: {
          in: tagDefs.map(td => td.id)
        }
      }
    });

    // Delete expense (cascade will delete other related records)
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

  async getAllExpenses(filters?: ExpenseFilters): Promise<ExpenseWithTags[]> {
    const where: any = {};

    // By default, only show active expenses
    if (!filters?.includeInactive) {
      where.active = true;
    }

    // Apply search text filter
    if (filters?.searchText) {
      const searchText = filters.searchText.toLowerCase();
      where.OR = [
        { code: { contains: searchText, mode: 'insensitive' } },
        { shortDescription: { contains: searchText, mode: 'insensitive' } },
        { longDescription: { contains: searchText, mode: 'insensitive' } }
      ];
    }

    // Apply technology direction filter
    if (filters?.technologyDirectionIds && filters.technologyDirectionIds.length > 0) {
      where.technologyDirections = {
        hasSome: filters.technologyDirectionIds
      };
    }

    // Apply user area filter
    if (filters?.userAreaIds && filters.userAreaIds.length > 0) {
      where.userAreas = {
        hasSome: filters.userAreaIds
      };
    }

    // Apply financial company filter
    if (filters?.financialCompanyId) {
      where.financialCompanyId = filters.financialCompanyId;
    }

    // Apply parent expense filter
    if (filters?.parentExpenseId) {
      where.parentExpenseId = filters.parentExpenseId;
    }

    const expenses = await this.prisma.expense.findMany({
      where,
      include: {
        financialCompany: true,
        parentExpense: true,
        tagValues: {
          include: {
            tagDefinition: true
          }
        }
      },
      orderBy: {
        code: 'asc'
      }
    });

    // Transform expenses to include custom tags
    const expensesWithTags: ExpenseWithTags[] = await Promise.all(
      expenses.map(async (expense) => {
        const customTags = this.extractCustomTags(expense.tagValues);
        return {
          ...expense,
          customTags
        };
      })
    );

    // Apply tag filter if specified
    if (filters?.hasTag) {
      return expensesWithTags.filter(expense => {
        const matchingTag = expense.customTags.find(tag => 
          tag.key === filters.hasTag!.key &&
          (!filters.hasTag!.value || String(tag.value).toLowerCase().includes(filters.hasTag!.value.toLowerCase()))
        );
        return !!matchingTag;
      });
    }

    return expensesWithTags;
  }

  private extractCustomTags(tagValues: any[]): CustomTag[] {
    return tagValues
      .filter(tv => tv.tagDefinition.name.startsWith('custom:'))
      .map(tv => {
        const parts = tv.tagDefinition.name.split(':');
        const key = parts.slice(2).join(':'); // Handle keys with colons
        const valueData = typeof tv.value === 'string' ? JSON.parse(tv.value) : tv.value;
        
        return {
          key,
          value: valueData.value,
          valueType: valueData.valueType || 'TEXT'
        };
      });
  }

  async searchExpenses(searchText: string): Promise<ExpenseWithTags[]> {
    if (!searchText || searchText.trim() === '') {
      return this.getAllExpenses();
    }

    const searchLower = searchText.toLowerCase();

    // Search in expense fields
    const expenses = await this.prisma.expense.findMany({
      where: {
        OR: [
          { code: { contains: searchText, mode: 'insensitive' } },
          { shortDescription: { contains: searchText, mode: 'insensitive' } },
          { longDescription: { contains: searchText, mode: 'insensitive' } }
        ]
      },
      include: {
        financialCompany: true,
        parentExpense: true,
        tagValues: {
          include: {
            tagDefinition: true
          }
        }
      },
      orderBy: {
        code: 'asc'
      }
    });

    // Transform to include custom tags
    const expensesWithTags: ExpenseWithTags[] = expenses.map(expense => ({
      ...expense,
      customTags: this.extractCustomTags(expense.tagValues)
    }));

    // Also search in tag values
    const allExpenses = await this.getAllExpenses();
    const tagMatchedExpenses = allExpenses.filter(expense => {
      return expense.customTags.some(tag => 
        tag.key.toLowerCase().includes(searchLower) ||
        String(tag.value).toLowerCase().includes(searchLower)
      );
    });

    // Combine results and remove duplicates
    const combinedMap = new Map<string, ExpenseWithTags>();
    [...expensesWithTags, ...tagMatchedExpenses].forEach(expense => {
      combinedMap.set(expense.id, expense);
    });

    return Array.from(combinedMap.values()).sort((a, b) => a.code.localeCompare(b.code));
  }

  async addCustomTag(expenseId: string, tag: CustomTag): Promise<void> {
    // Validate expense exists
    const expense = await this.prisma.expense.findUnique({ where: { id: expenseId } });
    if (!expense) {
      throw new Error('Gasto no encontrado');
    }

    // Validate tag key is not empty
    if (!tag.key || tag.key.trim() === '') {
      throw new Error('Tag key cannot be empty');
    }

    // Check for duplicate tag key
    const tagDefName = `custom:${expenseId}:${tag.key}`;
    const existingTagDef = await this.prisma.tagDefinition.findUnique({
      where: { name: tagDefName }
    });

    if (existingTagDef) {
      throw new Error('Tag key already exists on this expense');
    }

    // Validate value type
    this.validateTagValue(tag);

    // Create tag definition
    const tagDefinition = await this.prisma.tagDefinition.create({
      data: {
        name: tagDefName,
        description: `Custom tag for expense ${expenseId}`,
        inputType: 'FREE_TEXT',
        selectOptions: []
      }
    });

    // Create tag value
    await this.prisma.tagValue.create({
      data: {
        expenseId,
        tagId: tagDefinition.id,
        value: {
          value: tag.value,
          valueType: tag.valueType
        }
      }
    });
  }

  async updateCustomTag(expenseId: string, tagKey: string, newTag: CustomTag): Promise<void> {
    // Validate expense exists
    const expense = await this.prisma.expense.findUnique({ where: { id: expenseId } });
    if (!expense) {
      throw new Error('Gasto no encontrado');
    }

    // Find existing tag definition
    const oldTagDefName = `custom:${expenseId}:${tagKey}`;
    const tagDefinition = await this.prisma.tagDefinition.findUnique({
      where: { name: oldTagDefName }
    });

    if (!tagDefinition) {
      throw new Error('Tag not found on expense');
    }

    // Validate new tag key is not empty
    if (!newTag.key || newTag.key.trim() === '') {
      throw new Error('Tag key cannot be empty');
    }

    // Validate value type
    this.validateTagValue(newTag);

    // If key changed, check for duplicate
    if (tagKey !== newTag.key) {
      const newTagDefName = `custom:${expenseId}:${newTag.key}`;
      const existingTagDef = await this.prisma.tagDefinition.findUnique({
        where: { name: newTagDefName }
      });

      if (existingTagDef) {
        throw new Error('Tag key already exists on this expense');
      }

      // Update tag definition name
      await this.prisma.tagDefinition.update({
        where: { id: tagDefinition.id },
        data: { name: newTagDefName }
      });
    }

    // Update tag value
    await this.prisma.tagValue.updateMany({
      where: {
        expenseId,
        tagId: tagDefinition.id
      },
      data: {
        value: {
          value: newTag.value,
          valueType: newTag.valueType
        }
      }
    });
  }

  async removeCustomTag(expenseId: string, tagKey: string): Promise<void> {
    // Find tag definition
    const tagDefName = `custom:${expenseId}:${tagKey}`;
    const tagDefinition = await this.prisma.tagDefinition.findUnique({
      where: { name: tagDefName }
    });

    if (!tagDefinition) {
      throw new Error('Tag not found on expense');
    }

    // Delete tag definition (cascade will delete tag values)
    await this.prisma.tagDefinition.delete({
      where: { id: tagDefinition.id }
    });
  }

  async getExpenseWithTags(expenseId: string): Promise<ExpenseWithTags> {
    const expense = await this.prisma.expense.findUnique({
      where: { id: expenseId },
      include: {
        financialCompany: true,
        parentExpense: true,
        childExpenses: true,
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

    return {
      ...expense,
      customTags: this.extractCustomTags(expense.tagValues)
    };
  }

  private validateTagValue(tag: CustomTag): void {
    if (tag.valueType === 'NUMBER') {
      const numValue = Number(tag.value);
      if (isNaN(numValue)) {
        throw new Error('Tag value does not match specified type');
      }
    } else if (tag.valueType === 'DATE') {
      const dateValue = new Date(tag.value);
      if (isNaN(dateValue.getTime())) {
        throw new Error('Tag value does not match specified type');
      }
    }
  }
}
