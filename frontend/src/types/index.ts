export interface Budget {
  id: string;
  year: number;
  version: string;
  isActive: boolean;
  reviewStatus?: string;
  reviewSubmittedAt?: string;
  reviewSubmittedById?: string;
  reviewSubmittedBy?: { id: string; fullName: string };
  budgetLines?: BudgetLine[];
  conversionRates?: ConversionRate[];
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseCategory {
  id: string;
  code: string;
  name: string;
  description?: string;
  active?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Expense {
  id: string;
  code: string;
  shortDescription: string;
  longDescription: string;
  technologyDirections: string[];
  userAreas: string[];
  categoryId?: string;
  category?: ExpenseCategory;
  parentExpenseId?: string;
  active?: boolean;
  tagValues?: TagValue[];
  createdAt: string;
  updatedAt: string;
}

export interface BudgetLine {
  id: string;
  budgetId: string;
  expenseId: string;
  financialCompanyId: string;
  technologyDirectionId?: string;
  currency: string;
  planM1: number;
  planM2: number;
  planM3: number;
  planM4: number;
  planM5: number;
  planM6: number;
  planM7: number;
  planM8: number;
  planM9: number;
  planM10: number;
  planM11: number;
  planM12: number;
  expense?: Expense;
  financialCompany?: FinancialCompany;
  technologyDirection?: TechnologyDirection;
  transactions?: Transaction[];
  savings?: Saving[];
  lastModifiedAt?: string;
  lastModifiedById?: string;
  lastModifiedBy?: { id: string; username: string; fullName: string };
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  budgetLineId?: string;
  financialCompanyId: string;
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
  compensatedById?: string;
  isCompensated: boolean;
  budgetLine?: BudgetLine;
  financialCompany?: FinancialCompany;
  createdAt: string;
  updatedAt: string;
}

export interface AllowedCurrency {
  id: string;
  code: string;
  name: string;
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
  currencyCode: string;
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

// Budget Editing Types - now based on BudgetLine
export interface BudgetEditState {
  selectedBudget: Budget | null;
  budgetLines: BudgetLineRow[];
  editedCells: Map<string, CellEdit>;
  hasUnsavedChanges: boolean;
  validationErrors: Map<string, string>;
  isLoading: boolean;
  isSaving: boolean;
}

export interface BudgetLineRow {
  id: string;
  expenseCode: string;
  expenseDescription: string;
  financialCompanyName: string;
  currency: string;
  planValues: { month: number; value: number }[];
  isNew: boolean;
}

// Keep ExpenseRow for backward compat
export interface ExpenseRow {
  id: string;
  code: string;
  description: string;
  planValues: PlanValue[];
  isNew: boolean;
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

// Savings Types
export interface Saving {
  id: string;
  budgetLineId: string;
  totalAmount: number;
  description: string;
  status: 'PENDING' | 'ACTIVE';
  monthlyDistribution: Record<number, number>;
  savingM1: number;
  savingM2: number;
  savingM3: number;
  savingM4: number;
  savingM5: number;
  savingM6: number;
  savingM7: number;
  savingM8: number;
  savingM9: number;
  savingM10: number;
  savingM11: number;
  savingM12: number;
  createdBy: string;
  activatedAt?: string;
  createdAt: string;
  budgetLine?: BudgetLine;
  user?: {
    id: string;
    username: string;
    fullName: string;
  };
}

// Custom Tags Types
export interface CustomTag {
  key: string;
  value: string | number | Date;
  valueType: 'TEXT' | 'NUMBER' | 'DATE' | 'SELECT';
}

export interface ExpenseWithTags extends Expense {
  customTags: CustomTag[];
}

// Deferral Types
export interface Deferral {
  id: string;
  budgetLineId: string;
  description: string;
  totalAmount: number;
  startMonth: number;
  endMonth: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  budgetLine?: BudgetLine;
  user?: {
    id: string;
    username: string;
    fullName: string;
  };
}


// Change Request Types
export interface ChangeRequest {
  id: string;
  budgetLineId: string;
  requestedById: string;
  approvedById?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  currentValues: Record<string, number>;
  proposedValues: Record<string, number>;
  comment?: string;
  resolvedAt?: string;
  budgetLine?: BudgetLine & { budget?: Budget };
  requestedBy?: { id: string; username: string; fullName: string };
  approvedBy?: { id: string; username: string; fullName: string };
  createdAt: string;
  updatedAt: string;
}


// Audit Log Types
export interface AuditLog {
  id: string;
  userId?: string;
  action: string;
  entity: string;
  entityId?: string;
  details?: any;
  ipAddress?: string;
  createdAt: string;
  user?: {
    id: string;
    username: string;
    fullName: string;
  };
}


// Company Totals for Dashboard
export interface CompanyTotals {
  companyId: string;
  companyCode: string;
  companyName: string;
  budget: number;
  committed: number;
  real: number;
  diff: number;
}
