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

  async createExpense(data: ExpenseInput): Promise<Expense> {
    if (!data.code || data.code.trim() === '') {
      throw new Error('Field code is required');
    }
    if (!data.shortDescription || data.shortDescription.trim() === '') {
      throw new Error('Field shortDescription is required');
    }
    if (!data.longDescription || data.longDescription.trim() === '') {
      throw new Error('Field longDescription is required');
    }
    if (!data.technologyDirections || data.technologyDirections.length === 0) {
      throw new Error('Field technologyDirections is required');
    }
    if (!data.userAreas || data.userAreas.length === 0) {
      throw new Error('Field userAreas is required');
    }

    // Validar unicidad global de código
    const existing = await this.prisma.expense.findUnique({
      where: { code: data.code }
    });
    if (existing) {
      throw new Error(`Ya existe un gasto con el código ${data.code}`);
    }

    // Validar direcciones tecnológicas
    for (const techDirId of data.technologyDirections) {
      const techDir = await this.prisma.technologyDirection.findUnique({ where: { id: techDirId } });
      if (!techDir) throw new Error(`Dirección tecnológica ${techDirId} no encontrada`);
    }

    // Validar áreas de usuario
    for (const userAreaId of data.userAreas) {
      const userArea = await this.prisma.userArea.findUnique({ where: { id: userAreaId } });
      if (!userArea) throw new Error(`Área de usuario ${userAreaId} no encontrada`);
    }

    // Validar padre si se proporciona
    if (data.parentExpenseId) {
      const parent = await this.prisma.expense.findUnique({ where: { id: data.parentExpenseId } });
      if (!parent) throw new Error('Gasto padre no encontrado');
    }

    return await this.prisma.expense.create({
      data: {
        code: data.code,
        shortDescription: data.shortDescription,
        longDescription: data.longDescription,
        technologyDirections: data.technologyDirections,
        userAreas: data.userAreas,
        parentExpenseId: data.parentExpenseId
      },
      include: {
        parentExpense: true,
        childExpenses: true
      }
    });
  }

  async getExpense(id: string): Promise<Expense | null> {
    return await this.prisma.expense.findUnique({
      where: { id },
      include: {
        parentExpense: true,
        childExpenses: true,
        tagValues: {
          include: { tagDefinition: true }
        }
      }
    });
  }

  async updateExpense(id: string, data: Partial<ExpenseInput>): Promise<Expense> {
    const expense = await this.prisma.expense.findUnique({ where: { id } });
    if (!expense) throw new Error('Gasto no encontrado');

    if (data.code && data.code !== expense.code) {
      const existing = await this.prisma.expense.findUnique({ where: { code: data.code } });
      if (existing) throw new Error(`Ya existe un gasto con el código ${data.code}`);
    }

    if (data.technologyDirections) {
      for (const techDirId of data.technologyDirections) {
        const techDir = await this.prisma.technologyDirection.findUnique({ where: { id: techDirId } });
        if (!techDir) throw new Error(`Dirección tecnológica ${techDirId} no encontrada`);
      }
    }

    if (data.userAreas) {
      for (const userAreaId of data.userAreas) {
        const userArea = await this.prisma.userArea.findUnique({ where: { id: userAreaId } });
        if (!userArea) throw new Error(`Área de usuario ${userAreaId} no encontrada`);
      }
    }

    return await this.prisma.expense.update({
      where: { id },
      data,
      include: {
        parentExpense: true,
        childExpenses: true
      }
    });
  }

  async deleteExpense(id: string): Promise<void> {
    const tagDefs = await this.prisma.tagDefinition.findMany({
      where: { name: { startsWith: `custom:${id}:` } }
    });
    await this.prisma.tagDefinition.deleteMany({
      where: { id: { in: tagDefs.map(td => td.id) } }
    });
    await this.prisma.expense.delete({ where: { id } });
  }

  async getAllExpenses(filters?: ExpenseFilters): Promise<ExpenseWithTags[]> {
    const where: any = {};

    if (!filters?.includeInactive) {
      where.active = true;
    }

    if (filters?.searchText) {
      where.OR = [
        { code: { contains: filters.searchText, mode: 'insensitive' } },
        { shortDescription: { contains: filters.searchText, mode: 'insensitive' } },
        { longDescription: { contains: filters.searchText, mode: 'insensitive' } }
      ];
    }

    if (filters?.technologyDirectionIds && filters.technologyDirectionIds.length > 0) {
      where.technologyDirections = { hasSome: filters.technologyDirectionIds };
    }

    if (filters?.userAreaIds && filters.userAreaIds.length > 0) {
      where.userAreas = { hasSome: filters.userAreaIds };
    }

    if (filters?.parentExpenseId) {
      where.parentExpenseId = filters.parentExpenseId;
    }

    const expenses = await this.prisma.expense.findMany({
      where,
      include: {
        parentExpense: true,
        tagValues: { include: { tagDefinition: true } }
      },
      orderBy: { code: 'asc' }
    });

    const expensesWithTags: ExpenseWithTags[] = expenses.map((expense) => ({
      ...expense,
      customTags: this.extractCustomTags(expense.tagValues)
    }));

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
        const key = parts.slice(2).join(':');
        const valueData = typeof tv.value === 'string' ? JSON.parse(tv.value) : tv.value;
        return { key, value: valueData.value, valueType: valueData.valueType || 'TEXT' };
      });
  }

  async addCustomTag(expenseId: string, tag: CustomTag): Promise<void> {
    const expense = await this.prisma.expense.findUnique({ where: { id: expenseId } });
    if (!expense) throw new Error('Gasto no encontrado');
    if (!tag.key || tag.key.trim() === '') throw new Error('Tag key cannot be empty');

    const tagDefName = `custom:${expenseId}:${tag.key}`;
    const existingTagDef = await this.prisma.tagDefinition.findUnique({ where: { name: tagDefName } });
    if (existingTagDef) throw new Error('Tag key already exists on this expense');

    this.validateTagValue(tag);

    const tagDefinition = await this.prisma.tagDefinition.create({
      data: { name: tagDefName, description: `Custom tag for expense ${expenseId}`, inputType: 'FREE_TEXT', selectOptions: [] }
    });

    await this.prisma.tagValue.create({
      data: { expenseId, tagId: tagDefinition.id, value: { value: tag.value, valueType: tag.valueType } }
    });
  }

  async updateCustomTag(expenseId: string, tagKey: string, newTag: CustomTag): Promise<void> {
    const expense = await this.prisma.expense.findUnique({ where: { id: expenseId } });
    if (!expense) throw new Error('Gasto no encontrado');

    const oldTagDefName = `custom:${expenseId}:${tagKey}`;
    const tagDefinition = await this.prisma.tagDefinition.findUnique({ where: { name: oldTagDefName } });
    if (!tagDefinition) throw new Error('Tag not found on expense');
    if (!newTag.key || newTag.key.trim() === '') throw new Error('Tag key cannot be empty');

    this.validateTagValue(newTag);

    if (tagKey !== newTag.key) {
      const newTagDefName = `custom:${expenseId}:${newTag.key}`;
      const existingTagDef = await this.prisma.tagDefinition.findUnique({ where: { name: newTagDefName } });
      if (existingTagDef) throw new Error('Tag key already exists on this expense');
      await this.prisma.tagDefinition.update({ where: { id: tagDefinition.id }, data: { name: newTagDefName } });
    }

    await this.prisma.tagValue.updateMany({
      where: { expenseId, tagId: tagDefinition.id },
      data: { value: { value: newTag.value, valueType: newTag.valueType } }
    });
  }

  async removeCustomTag(expenseId: string, tagKey: string): Promise<void> {
    const tagDefName = `custom:${expenseId}:${tagKey}`;
    const tagDefinition = await this.prisma.tagDefinition.findUnique({ where: { name: tagDefName } });
    if (!tagDefinition) throw new Error('Tag not found on expense');
    await this.prisma.tagDefinition.delete({ where: { id: tagDefinition.id } });
  }

  async getExpenseWithTags(expenseId: string): Promise<ExpenseWithTags> {
    const expense = await this.prisma.expense.findUnique({
      where: { id: expenseId },
      include: {
        parentExpense: true,
        childExpenses: true,
        tagValues: { include: { tagDefinition: true } }
      }
    });
    if (!expense) throw new Error('Gasto no encontrado');
    return { ...expense, customTags: this.extractCustomTags(expense.tagValues) };
  }

  async searchExpenses(searchText: string): Promise<ExpenseWithTags[]> {
    if (!searchText || searchText.trim() === '') return this.getAllExpenses();
    const searchLower = searchText.toLowerCase();

    const expenses = await this.prisma.expense.findMany({
      where: {
        OR: [
          { code: { contains: searchText, mode: 'insensitive' } },
          { shortDescription: { contains: searchText, mode: 'insensitive' } },
          { longDescription: { contains: searchText, mode: 'insensitive' } }
        ]
      },
      include: {
        parentExpense: true,
        tagValues: { include: { tagDefinition: true } }
      },
      orderBy: { code: 'asc' }
    });

    const expensesWithTags: ExpenseWithTags[] = expenses.map(expense => ({
      ...expense,
      customTags: this.extractCustomTags(expense.tagValues)
    }));

    const allExpenses = await this.getAllExpenses();
    const tagMatchedExpenses = allExpenses.filter(expense =>
      expense.customTags.some(tag =>
        tag.key.toLowerCase().includes(searchLower) ||
        String(tag.value).toLowerCase().includes(searchLower)
      )
    );

    const combinedMap = new Map<string, ExpenseWithTags>();
    [...expensesWithTags, ...tagMatchedExpenses].forEach(expense => combinedMap.set(expense.id, expense));
    return Array.from(combinedMap.values()).sort((a, b) => a.code.localeCompare(b.code));
  }

  private validateTagValue(tag: CustomTag): void {
    if (tag.valueType === 'NUMBER') {
      if (isNaN(Number(tag.value))) throw new Error('Tag value does not match specified type');
    } else if (tag.valueType === 'DATE') {
      if (isNaN(new Date(tag.value as string).getTime())) throw new Error('Tag value does not match specified type');
    }
  }
}
