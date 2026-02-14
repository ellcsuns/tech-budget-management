import { PrismaClient, TechnologyDirection, UserArea, FinancialCompany } from '@prisma/client';
import { MasterDataInput, FinancialCompanyInput } from '../types';

export class MasterDataService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  // Technology Directions
  async createTechnologyDirection(data: MasterDataInput): Promise<TechnologyDirection> {
    // Validar unicidad de código
    const existing = await this.prisma.technologyDirection.findUnique({
      where: { code: data.code }
    });

    if (existing) {
      throw new Error(`Ya existe una dirección tecnológica con el código ${data.code}`);
    }

    return await this.prisma.technologyDirection.create({
      data: {
        code: data.code,
        name: data.name,
        description: data.description
      }
    });
  }

  async getTechnologyDirections(): Promise<TechnologyDirection[]> {
    return await this.prisma.technologyDirection.findMany({
      orderBy: {
        code: 'asc'
      }
    });
  }

  async getTechnologyDirection(id: string): Promise<TechnologyDirection | null> {
    return await this.prisma.technologyDirection.findUnique({
      where: { id }
    });
  }

  async updateTechnologyDirection(id: string, data: Partial<MasterDataInput>): Promise<TechnologyDirection> {
    // Validar unicidad de código si se actualiza
    if (data.code) {
      const existing = await this.prisma.technologyDirection.findFirst({
        where: {
          code: data.code,
          NOT: { id }
        }
      });

      if (existing) {
        throw new Error(`Ya existe una dirección tecnológica con el código ${data.code}`);
      }
    }

    return await this.prisma.technologyDirection.update({
      where: { id },
      data
    });
  }

  async deleteTechnologyDirection(id: string): Promise<void> {
    // Verificar si está en uso
    const inUse = await this.isInUse('TECH_DIRECTION', id);
    if (inUse) {
      throw new Error('No se puede eliminar la dirección tecnológica porque está en uso por gastos existentes');
    }

    await this.prisma.technologyDirection.delete({
      where: { id }
    });
  }

  // User Areas
  async createUserArea(data: MasterDataInput): Promise<UserArea> {
    // Validar unicidad de código
    const existing = await this.prisma.userArea.findUnique({
      where: { code: data.code }
    });

    if (existing) {
      throw new Error(`Ya existe un área de usuario con el código ${data.code}`);
    }

    return await this.prisma.userArea.create({
      data: {
        code: data.code,
        name: data.name,
        description: data.description
      }
    });
  }

  async getUserAreas(): Promise<UserArea[]> {
    return await this.prisma.userArea.findMany({
      orderBy: {
        code: 'asc'
      }
    });
  }

  async getUserArea(id: string): Promise<UserArea | null> {
    return await this.prisma.userArea.findUnique({
      where: { id }
    });
  }

  async updateUserArea(id: string, data: Partial<MasterDataInput>): Promise<UserArea> {
    // Validar unicidad de código si se actualiza
    if (data.code) {
      const existing = await this.prisma.userArea.findFirst({
        where: {
          code: data.code,
          NOT: { id }
        }
      });

      if (existing) {
        throw new Error(`Ya existe un área de usuario con el código ${data.code}`);
      }
    }

    return await this.prisma.userArea.update({
      where: { id },
      data
    });
  }

  async deleteUserArea(id: string): Promise<void> {
    // Verificar si está en uso
    const inUse = await this.isInUse('USER_AREA', id);
    if (inUse) {
      throw new Error('No se puede eliminar el área de usuario porque está en uso por gastos existentes');
    }

    await this.prisma.userArea.delete({
      where: { id }
    });
  }

  // Financial Companies
  async createFinancialCompany(data: FinancialCompanyInput): Promise<FinancialCompany> {
    // Validar unicidad de código
    const existing = await this.prisma.financialCompany.findUnique({
      where: { code: data.code }
    });

    if (existing) {
      throw new Error(`Ya existe una empresa financiera con el código ${data.code}`);
    }

    return await this.prisma.financialCompany.create({
      data: {
        code: data.code,
        name: data.name,
        description: data.description,
        taxId: data.taxId
      }
    });
  }

  async getFinancialCompanies(): Promise<FinancialCompany[]> {
    return await this.prisma.financialCompany.findMany({
      orderBy: {
        code: 'asc'
      }
    });
  }

  async getFinancialCompany(id: string): Promise<FinancialCompany | null> {
    return await this.prisma.financialCompany.findUnique({
      where: { id }
    });
  }

  async updateFinancialCompany(id: string, data: Partial<FinancialCompanyInput>): Promise<FinancialCompany> {
    // Validar unicidad de código si se actualiza
    if (data.code) {
      const existing = await this.prisma.financialCompany.findFirst({
        where: {
          code: data.code,
          NOT: { id }
        }
      });

      if (existing) {
        throw new Error(`Ya existe una empresa financiera con el código ${data.code}`);
      }
    }

    return await this.prisma.financialCompany.update({
      where: { id },
      data
    });
  }

  async deleteFinancialCompany(id: string): Promise<void> {
    // Verificar si está en uso
    const inUse = await this.isInUse('FINANCIAL_COMPANY', id);
    if (inUse) {
      throw new Error('No se puede eliminar la empresa financiera porque está en uso por gastos existentes');
    }

    await this.prisma.financialCompany.delete({
      where: { id }
    });
  }

  // Validation
  async isInUse(type: 'TECH_DIRECTION' | 'USER_AREA' | 'FINANCIAL_COMPANY', id: string): Promise<boolean> {
    switch (type) {
      case 'TECH_DIRECTION':
        const expensesWithTechDir = await this.prisma.expense.findFirst({
          where: {
            technologyDirections: {
              has: id
            }
          }
        });
        return !!expensesWithTechDir;

      case 'USER_AREA':
        const expensesWithUserArea = await this.prisma.expense.findFirst({
          where: {
            userAreas: {
              has: id
            }
          }
        });
        return !!expensesWithUserArea;

      case 'FINANCIAL_COMPANY':
        const expensesWithFinancialCompany = await this.prisma.expense.findFirst({
          where: {
            financialCompanyId: id
          }
        });
        return !!expensesWithFinancialCompany;

      default:
        return false;
    }
  }
}
