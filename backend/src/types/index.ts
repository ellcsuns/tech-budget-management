import { TransactionType, TagInputType } from '@prisma/client';

export interface MonetaryAmount {
  transactionCurrency: string;
  transactionValue: number;
  usdValue: number;
  conversionRate: number;
  month: number;
}

export interface BudgetInput {
  year: number;
  version: string;
}

export interface ExpenseInput {
  code: string;
  shortDescription: string;
  longDescription: string;
  technologyDirections: string[];
  userAreas: string[];
  financialCompanyId: string;
  parentExpenseId?: string;
}

export interface ExpenseFilters {
  searchText?: string;
  technologyDirectionIds?: string[];
  userAreaIds?: string[];
  financialCompanyId?: string;
  parentExpenseId?: string;
  hasTag?: { key: string; value?: string };
}

export interface CustomTag {
  key: string;
  value: string | number | Date;
  valueType: 'TEXT' | 'NUMBER' | 'DATE' | 'SELECT';
}

export interface TransactionInput {
  expenseId: string;
  type: TransactionType;
  serviceDate: Date;
  postingDate: Date;
  referenceDocumentNumber: string;
  externalPlatformLink: string;
  transactionCurrency: string;
  transactionValue: number;
  month: number;
}

export interface PlanValueInput {
  expenseId: string;
  month: number;
  transactionCurrency: string;
  transactionValue: number;
}

export interface MasterDataInput {
  code: string;
  name: string;
  description?: string;
}

export interface FinancialCompanyInput extends MasterDataInput {
  taxId?: string;
}

export interface TagDefinitionInput {
  name: string;
  description?: string;
  inputType: TagInputType;
  format?: string;
  selectOptions?: string[];
}

export interface TagValueInput {
  expenseId: string;
  tagId: string;
  value: any;
}

export interface ConversionRateInput {
  budgetId: string;
  currency: string;
  month: number;
  rate: number;
}

export { TransactionType, TagInputType };
