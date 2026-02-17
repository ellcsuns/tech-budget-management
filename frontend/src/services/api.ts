import axios from 'axios';
import type {
  Budget,
  Expense,
  Transaction,
  BudgetLine,
  ConversionRate,
  TechnologyDirection,
  UserArea,
  FinancialCompany,
  TagDefinition,
  Saving,
  ExpenseWithTags,
  CustomTag,
  Deferral
} from '../types';

const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      if (window.location.pathname !== '/login') window.location.href = '/login';
    }
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Budget API
export const budgetApi = {
  getAll: () => api.get<Budget[]>('/budgets'),
  getByYear: (year: number) => api.get<Budget[]>(`/budgets?year=${year}`),
  getById: (id: string) => api.get<Budget>(`/budgets/${id}`),
  getBudgetWithDetails: async (budgetId: string) => {
    const [budgetRes, linesRes] = await Promise.all([
      api.get<Budget>(`/budgets/${budgetId}`),
      api.get<BudgetLine[]>(`/budget-lines?budgetId=${budgetId}`)
    ]);
    return {
      ...budgetRes,
      data: { ...budgetRes.data, budgetLines: linesRes.data }
    };
  },
  create: (data: { year: number; version: string }) => api.post<Budget>('/budgets', data),
  update: (id: string, data: Partial<Budget>) => api.put<Budget>(`/budgets/${id}`, data),
  delete: (id: string) => api.delete(`/budgets/${id}`),
  createNewVersion: (budgetId: string, planValueChanges: any[]) =>
    api.post(`/budgets/${budgetId}/versions`, { planValueChanges }),
  getActive: () => api.get<Budget>('/budgets/active'),
  compare: (budgetAId: string, budgetBId: string) =>
    api.get(`/budgets/compare?budgetA=${budgetAId}&budgetB=${budgetBId}`),
  addBudgetLine: (budgetId: string, expenseId: string, financialCompanyId: string) =>
    api.post(`/budgets/${budgetId}/budget-lines`, { expenseId, financialCompanyId }),
  removeBudgetLine: (budgetId: string, budgetLineId: string) =>
    api.delete(`/budgets/${budgetId}/budget-lines/${budgetLineId}`)
};

// BudgetLine API
export const budgetLineApi = {
  getByBudget: (budgetId: string) => api.get<BudgetLine[]>(`/budget-lines?budgetId=${budgetId}`),
  getById: (id: string) => api.get<BudgetLine>(`/budget-lines/${id}`),
  create: (data: any) => api.post<BudgetLine>('/budget-lines', data),
  updatePlanValues: (id: string, data: any) => api.put<BudgetLine>(`/budget-lines/${id}`, data),
  delete: (id: string) => api.delete(`/budget-lines/${id}`)
};

// Expense API (master data only, no budgetId)
export const expenseApi = {
  getAll: (filters?: any) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) params.append(key, String(value));
      });
    }
    return api.get<Expense[]>(`/expenses?${params.toString()}`);
  },
  getById: (id: string) => api.get<Expense>(`/expenses/${id}`),
  create: (data: any) => api.post<Expense>('/expenses', data),
  update: (id: string, data: Partial<Expense>) => api.put<Expense>(`/expenses/${id}`, data),
  delete: (id: string) => api.delete(`/expenses/${id}`)
};

// Transaction API
export const transactionApi = {
  getByBudgetLine: (budgetLineId: string) => api.get<Transaction[]>(`/transactions?budgetLineId=${budgetLineId}`),
  getByType: (type: 'COMMITTED' | 'REAL') => api.get<Transaction[]>(`/transactions?type=${type}`),
  getUncompensated: (budgetLineId: string) => api.get<Transaction[]>(`/transactions?budgetLineId=${budgetLineId}&uncompensated=true`),
  getById: (id: string) => api.get<Transaction>(`/transactions/${id}`),
  create: (data: any) => api.post<Transaction>('/transactions', data),
  update: (id: string, data: Partial<Transaction>) => api.put<Transaction>(`/transactions/${id}`, data),
  delete: (id: string) => api.delete(`/transactions/${id}`)
};

// ConversionRate API
export const conversionRateApi = {
  getByBudget: (budgetId: string) => api.get<ConversionRate[]>(`/conversion-rates?budgetId=${budgetId}`),
  getSpecific: (budgetId: string, currency: string, month: number) =>
    api.get<ConversionRate>(`/conversion-rates/${budgetId}/${currency}/${month}`),
  create: (data: any) => api.post<ConversionRate>('/conversion-rates', data),
  delete: (budgetId: string, currency: string, month: number) =>
    api.delete(`/conversion-rates/${budgetId}/${currency}/${month}`)
};

// TechnologyDirection API
export const technologyDirectionApi = {
  getAll: () => api.get<TechnologyDirection[]>('/technology-directions'),
  getById: (id: string) => api.get<TechnologyDirection>(`/technology-directions/${id}`),
  create: (data: any) => api.post<TechnologyDirection>('/technology-directions', data),
  update: (id: string, data: Partial<TechnologyDirection>) => api.put<TechnologyDirection>(`/technology-directions/${id}`, data),
  delete: (id: string) => api.delete(`/technology-directions/${id}`)
};

// UserArea API
export const userAreaApi = {
  getAll: () => api.get<UserArea[]>('/user-areas'),
  getById: (id: string) => api.get<UserArea>(`/user-areas/${id}`),
  create: (data: any) => api.post<UserArea>('/user-areas', data),
  update: (id: string, data: Partial<UserArea>) => api.put<UserArea>(`/user-areas/${id}`, data),
  delete: (id: string) => api.delete(`/user-areas/${id}`)
};

// FinancialCompany API
export const financialCompanyApi = {
  getAll: () => api.get<FinancialCompany[]>('/financial-companies'),
  getById: (id: string) => api.get<FinancialCompany>(`/financial-companies/${id}`),
  create: (data: any) => api.post<FinancialCompany>('/financial-companies', data),
  update: (id: string, data: Partial<FinancialCompany>) => api.put<FinancialCompany>(`/financial-companies/${id}`, data),
  delete: (id: string) => api.delete(`/financial-companies/${id}`)
};

// TagDefinition API
export const tagDefinitionApi = {
  getAll: () => api.get<TagDefinition[]>('/tag-definitions'),
  getById: (id: string) => api.get<TagDefinition>(`/tag-definitions/${id}`),
  create: (data: any) => api.post<TagDefinition>('/tag-definitions', data),
  update: (id: string, data: Partial<TagDefinition>) => api.put<TagDefinition>(`/tag-definitions/${id}`, data),
  delete: (id: string) => api.delete(`/tag-definitions/${id}`)
};

// Savings API
export const savingsApi = {
  getAll: (filters?: { budgetLineId?: string; budgetId?: string; status?: string; createdBy?: string; dateFrom?: string; dateTo?: string }) => {
    const params = new URLSearchParams();
    if (filters) Object.entries(filters).forEach(([key, value]) => { if (value) params.append(key, value); });
    return api.get<Saving[]>(`/savings?${params.toString()}`);
  },
  getById: (id: string) => api.get<Saving>(`/savings/${id}`),
  create: (data: any) => api.post<Saving>('/savings', data),
  approve: (savingIds: string[]) => api.post('/savings/approve', { savingIds }),
  delete: (id: string) => api.delete(`/savings/${id}`)
};

// Enhanced Expenses API (with custom tags)
export const expensesEnhancedApi = {
  getAll: (filters?: any) => {
    const params = new URLSearchParams();
    if (filters) Object.entries(filters).forEach(([key, value]) => { if (value !== undefined && value !== null) params.append(key, String(value)); });
    return api.get<ExpenseWithTags[]>(`/expenses-enhanced?${params.toString()}`);
  },
  getById: (id: string) => api.get<ExpenseWithTags>(`/expenses-enhanced/${id}`),
  create: (data: any) => api.post<ExpenseWithTags>('/expenses-enhanced', data),
  update: (id: string, data: Partial<ExpenseWithTags>) => api.put<ExpenseWithTags>(`/expenses-enhanced/${id}`, data),
  delete: (id: string) => api.delete(`/expenses-enhanced/${id}`),
  reactivate: (id: string) => api.put(`/expenses-enhanced/${id}/reactivate`),
  addTag: (expenseId: string, tag: CustomTag) => api.post(`/expenses-enhanced/${expenseId}/tags`, tag),
  updateTag: (expenseId: string, tagKey: string, tag: CustomTag) => api.put(`/expenses-enhanced/${expenseId}/tags/${tagKey}`, tag),
  removeTag: (expenseId: string, tagKey: string) => api.delete(`/expenses-enhanced/${expenseId}/tags/${tagKey}`)
};

// Deferrals API
export const deferralApi = {
  getByBudget: (budgetId: string) => api.get<Deferral[]>(`/deferrals?budgetId=${budgetId}`),
  getById: (id: string) => api.get<Deferral>(`/deferrals/${id}`),
  create: (data: any) => api.post<Deferral>('/deferrals', data),
  delete: (id: string) => api.delete(`/deferrals/${id}`)
};

// Translation API
export const translationApi = {
  getAll: (params?: { page?: number; limit?: number; search?: string; category?: string }) => {
    const p = new URLSearchParams();
    if (params?.page) p.append('page', String(params.page));
    if (params?.limit) p.append('limit', String(params.limit));
    if (params?.search) p.append('search', params.search);
    if (params?.category) p.append('category', params.category);
    return api.get(`/translations?${p.toString()}`);
  },
  getByLocale: (locale: string) => api.get<Record<string, string>>(`/translations/locale/${locale}`),
  create: (data: { key: string; es: string; en: string; category?: string }) => api.post('/translations', data),
  update: (id: string, data: { es?: string; en?: string; category?: string }) => api.put(`/translations/${id}`, data),
  delete: (id: string) => api.delete(`/translations/${id}`)
};

// Config API
export const configApi = {
  get: (key: string) => api.get<{ key: string; value: string }>(`/config/${key}`),
  set: (key: string, value: string) => api.put(`/config/${key}`, { value })
};

// Report API
export const reportApi = {
  get: (type: string, filters: Record<string, string>) => {
    const p = new URLSearchParams(filters);
    return api.get(`/reports/${type}?${p.toString()}`);
  }
};

// Keep planValueApi for backward compat (redirects to budget-lines)
export const planValueApi = {
  getByExpense: (expenseId: string) => api.get(`/budget-lines?expenseId=${expenseId}`),
  getById: (id: string) => api.get(`/budget-lines/${id}`),
  create: (data: any) => api.post('/budget-lines', data),
  update: (id: string, data: any) => api.put(`/budget-lines/${id}`, data),
  delete: (id: string) => api.delete(`/budget-lines/${id}`)
};

export default api;
export { api };
