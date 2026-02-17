// Menu codes for the application
export const MENU_CODES = {
  DASHBOARD: 'dashboard',
  BUDGETS: 'budgets',
  EXPENSES: 'expenses',
  TRANSACTIONS: 'transactions',
  PLAN_VALUES: 'plan-values',
  COMMITTED_TRANSACTIONS: 'committed-transactions',
  REAL_TRANSACTIONS: 'real-transactions',
  MASTER_DATA: 'master-data',
  TECHNOLOGY_DIRECTIONS: 'technology-directions',
  USER_AREAS: 'user-areas',
  FINANCIAL_COMPANIES: 'financial-companies',
  TAG_DEFINITIONS: 'tag-definitions',
  CONVERSION_RATES: 'conversion-rates',
  USERS: 'users',
  ROLES: 'roles',
  REPORTS: 'reports',
  DEFERRALS: 'deferrals',
  CONFIGURATION: 'configuration',
  APPROVALS: 'approvals'
} as const;

export type MenuCode = typeof MENU_CODES[keyof typeof MENU_CODES];

export const MENU_CODE_LIST = Object.values(MENU_CODES);

export function isValidMenuCode(code: string): code is MenuCode {
  return MENU_CODE_LIST.includes(code as MenuCode);
}
