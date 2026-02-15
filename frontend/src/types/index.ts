export interface Budget {
  id: string;
  year: number;
  version: string;
  expenses?: Expense[];
  conversionRates?: ConversionRate[];
  createdAt: string;
  updatedAt: string;
}

export interface Expense {
  id: string;
  budgetId: string;
  code: string;
  shortDescription: string;
  longDescription: string;
  technologyDirections: string[];
  userAreas: string[];
  financialCompanyId: string;
  financialCompany?: FinancialCompany;
  parentExpenseId?: string;
  transactions?: Transaction[];
  planValues?: PlanValue[];
  tagValues?: TagValue[];
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  expenseId: string;
  type: 'COMMITTED' | 'REAL';
  serviceDate: string;
  postingDate: string;
  referenceDocumentNumber: string;
  externalPlatformLink: string;
  transactionCurrency: string;
  transactionValue: number;
  usdValue: number;
  conversionRate: number;
  month: number;
  createdAt: string;
  updatedAt: string;
}

export interface PlanValue {
  id: string;
  expenseId: string;
  month: number;
  transactionCurrency: string;
  transactionValue: number;
  usdValue: number;
  conversionRate: number;
  createdAt: string;
  updatedAt: string;
}

export interface ConversionRate {
  id: string;
  budgetId: string;
  currency: string;
  month: number;
  rate: number;
  createdAt: string;
  updatedAt: string;
}

export interface TechnologyDirection {
  id: string;
  code: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserArea {
  id: string;
  code: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FinancialCompany {
  id: string;
  code: string;
  name: string;
  description?: string;
  taxId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TagDefinition {
  id: string;
  name: string;
  description?: string;
  inputType: 'FORMAT' | 'FREE_TEXT' | 'SELECT_LIST';
  format?: string;
  selectOptions: string[];
  createdAt: string;
  updatedAt: string;
}

export interface TagValue {
  id: string;
  expenseId: string;
  tagId: string;
  tagDefinition?: TagDefinition;
  value: any;
  createdAt: string;
  updatedAt: string;
}

export interface MonthlyValue {
  month: number;
  budget?: number;
  committed?: number;
  real?: number;
}

export interface TableFilters {
  currency?: string;
  financialCompanyId?: string;
  columnFilters: Record<string, string>;
  visibleColumns: {
    budget: boolean;
    committed: boolean;
    real: boolean;
  };
}

// Budget Editing Types
export interface BudgetEditState {
  selectedBudget: Budget | null;
  expenses: ExpenseRow[];
  editedCells: Map<string, CellEdit>;
  hasUnsavedChanges: boolean;
  validationErrors: Map<string, string>;
  isLoading: boolean;
  isSaving: boolean;
}

export interface ExpenseRow {
  id: string;
  code: string;
  description: string;
  planValues: PlanValue[];
  isNew: boolean;
}

export interface CellEdit {
  expenseId: string;
  month: number;
  value: number;
  currency: string;
  isValid: boolean;
}

export interface PlanValueChange {
  expenseId: string;
  month: number;
  transactionValue: number;
  transactionCurrency: string;
}
