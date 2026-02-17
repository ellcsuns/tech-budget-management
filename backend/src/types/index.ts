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
  parentExpenseId?: string;
}

export interface ExpenseFilters {
  searchText?: string;
  technologyDirectionIds?: string[];
  userAreaIds?: string[];
  parentExpenseId?: string;
  hasTag?: { key: string; value?: string };
  includeInactive?: boolean;
}

export interface CustomTag {
  key: string;
  value: string | number | Date;
  valueType: 'TEXT' | 'NUMBER' | 'DATE' | 'SELECT';
}

export interface BudgetLineInput {
  budgetId: string;
  expenseId: string;
  financialCompanyId: string;
  planM1?: number;
  planM2?: number;
  planM3?: number;
  planM4?: number;
  planM5?: number;
  planM6?: number;
  planM7?: number;
  planM8?: number;
  planM9?: number;
  planM10?: number;
  planM11?: number;
  planM12?: number;
}

export interface MonthlyPlanValues {
  planM1?: number;
  planM2?: number;
  planM3?: number;
  planM4?: number;
  planM5?: number;
  planM6?: number;
  planM7?: number;
  planM8?: number;
  planM9?: number;
  planM10?: number;
  planM11?: number;
  planM12?: number;
}

export interface TransactionInput {
  budgetLineId: string;
  financialCompanyId: string;
  type: TransactionType;
  serviceDate: Date | string;
  postingDate: Date | string;
  referenceDocumentNumber: string;
  externalPlatformLink: string;
  transactionCurrency: string;
  transactionValue: number;
  committedTransactionId?: string;
}

export interface MasterDataInput {
  code: string;
  name: string;
  description?: string;
}

export interface FinancialCompanyInput extends MasterDataInput {
  taxId?: string;
  currencyCode: string;
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
