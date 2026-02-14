import { PrismaClient, TagDefinition, TagValue, TagInputType } from '@prisma/client';
import { TagDefinitionInput, TagValueInput } from '../types';

export class TaggingService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  // Tag Definitions
  async createTagDefinition(data: TagDefinitionInput): Promise<TagDefinition> {
    // Validar unicidad de nombre
    const existing = await this.prisma.tagDefinition.findUnique({
      where: { name: data.name }
    });

    if (existing) {
      throw new Error(`Ya existe una definición de etiqueta con el nombre ${data.name}`);
    }

    // Validar campos según tipo de entrada
    if (data.inputType === TagInputType.FORMAT && !data.format) {
      throw new Error('El campo format es requerido para tipo FORMAT');
    }

    if (data.inputType === TagInputType.SELECT_LIST && (!data.selectOptions || data.selectOptions.length === 0)) {
      throw new Error('El campo selectOptions es requerido para tipo SELECT_LIST');
    }

    return await this.prisma.tagDefinition.create({
      data: {
        name: data.name,
        description: data.description,
        inputType: data.inputType,
        format: data.format,
        selectOptions: data.selectOptions || []
      }
    });
  }

  async getTagDefinitions(): Promise<TagDefinition[]> {
    return await this.prisma.tagDefinition.findMany({
      orderBy: {
        name: 'asc'
      }
    });
  }

  async getTagDefinition(id: string): Promise<TagDefinition | null> {
    return await this.prisma.tagDefinition.findUnique({
      where: { id },
      include: {
        tagValues: true
      }
    });
  }

  async updateTagDefinition(id: string, data: Partial<TagDefinitionInput>): Promise<TagDefinition> {
    // Validar unicidad de nombre si se actualiza
    if (data.name) {
      const existing = await this.prisma.tagDefinition.findFirst({
        where: {
          name: data.name,
          NOT: { id }
        }
      });

      if (existing) {
        throw new Error(`Ya existe una definición de etiqueta con el nombre ${data.name}`);
      }
    }

    // Validar campos según tipo de entrada si se actualiza
    const current = await this.prisma.tagDefinition.findUnique({ where: { id } });
    if (!current) {
      throw new Error('Definición de etiqueta no encontrada');
    }

    const inputType = data.inputType ?? current.inputType;

    if (inputType === TagInputType.FORMAT) {
      const format = data.format ?? current.format;
      if (!format) {
        throw new Error('El campo format es requerido para tipo FORMAT');
      }
    }

    if (inputType === TagInputType.SELECT_LIST) {
      const selectOptions = data.selectOptions ?? current.selectOptions;
      if (!selectOptions || selectOptions.length === 0) {
        throw new Error('El campo selectOptions es requerido para tipo SELECT_LIST');
      }
    }

    return await this.prisma.tagDefinition.update({
      where: { id },
      data
    });
  }

  async deleteTagDefinition(id: string): Promise<void> {
    // Verificar si está en uso
    const tagValues = await this.prisma.tagValue.findFirst({
      where: { tagId: id }
    });

    if (tagValues) {
      throw new Error('No se puede eliminar la definición de etiqueta porque está en uso');
    }

    await this.prisma.tagDefinition.delete({
      where: { id }
    });
  }

  // Tag Values
  async setTagValue(data: TagValueInput): Promise<TagValue> {
    // Validar que el gasto existe
    const expense = await this.prisma.expense.findUnique({
      where: { id: data.expenseId }
    });
    if (!expense) {
      throw new Error('Gasto no encontrado');
    }

    // Validar que la definición de etiqueta existe
    const tagDefinition = await this.prisma.tagDefinition.findUnique({
      where: { id: data.tagId }
    });
    if (!tagDefinition) {
      throw new Error('Definición de etiqueta no encontrada');
    }

    // Validar formato del valor según tipo de entrada
    this.validateTagValue(tagDefinition, data.value);

    // Verificar si ya existe un valor para esta etiqueta y gasto
    const existing = await this.prisma.tagValue.findUnique({
      where: {
        expenseId_tagId: {
          expenseId: data.expenseId,
          tagId: data.tagId
        }
      }
    });

    if (existing) {
      // Actualizar valor existente
      return await this.prisma.tagValue.update({
        where: {
          expenseId_tagId: {
            expenseId: data.expenseId,
            tagId: data.tagId
          }
        },
        data: {
          value: data.value
        },
        include: {
          expense: true,
          tagDefinition: true
        }
      });
    }

    // Crear nuevo valor
    return await this.prisma.tagValue.create({
      data: {
        expenseId: data.expenseId,
        tagId: data.tagId,
        value: data.value
      },
      include: {
        expense: true,
        tagDefinition: true
      }
    });
  }

  async getTagValue(expenseId: string, tagId: string): Promise<TagValue | null> {
    return await this.prisma.tagValue.findUnique({
      where: {
        expenseId_tagId: {
          expenseId,
          tagId
        }
      },
      include: {
        expense: true,
        tagDefinition: true
      }
    });
  }

  async getTagValuesByExpense(expenseId: string): Promise<TagValue[]> {
    return await this.prisma.tagValue.findMany({
      where: { expenseId },
      include: {
        tagDefinition: true
      },
      orderBy: {
        tagDefinition: {
          name: 'asc'
        }
      }
    });
  }

  async deleteTagValue(expenseId: string, tagId: string): Promise<void> {
    await this.prisma.tagValue.delete({
      where: {
        expenseId_tagId: {
          expenseId,
          tagId
        }
      }
    });
  }

  // Validation helper
  private validateTagValue(tagDefinition: TagDefinition, value: any): void {
    switch (tagDefinition.inputType) {
      case TagInputType.FORMAT:
        if (tagDefinition.format) {
          try {
            const regex = new RegExp(tagDefinition.format);
            if (!regex.test(String(value))) {
              throw new Error(`El valor no cumple con el formato requerido: ${tagDefinition.format}`);
            }
          } catch (error) {
            throw new Error(`Error al validar formato: ${error}`);
          }
        }
        break;

      case TagInputType.SELECT_LIST:
        if (!tagDefinition.selectOptions.includes(String(value))) {
          throw new Error(`El valor debe ser uno de: ${tagDefinition.selectOptions.join(', ')}`);
        }
        break;

      case TagInputType.FREE_TEXT:
        // No hay validación específica para texto libre
        break;
    }
  }
}
