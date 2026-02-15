import axios from 'axios';
import type {
  Budget,
  Expense,
  Transaction,
  PlanValue,
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
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to add JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling and token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 Unauthorized (token expired or invalid)
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      // Redirect to login if not already there
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
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
    const [budgetRes, expensesRes] = await Promise.all([
      api.get<Budget>(`/budgets/${budgetId}`),
      api.get<Expense[]>(`/expenses?budgetId=${budgetId}`)
    ]);
    
    // Fetch plan values for all expenses
    const expensesWithPlanValues = await Promise.all(
      expensesRes.data.map(async (expense) => {
        const planValuesRes = await api.get<PlanValue[]>(`/plan-values?expenseId=${expense.id}`);
        return { ...expense, planValues: planValuesRes.data };
      })
    );
    
    return {
      ...budgetRes,
      data: {
        ...budgetRes.data,
        expenses: expensesWithPlanValues
      }
    };
  },
  create: (data: { year: number; version: string }) => api.post<Budget>('/budgets', data),
  update: (id: string, data: Partial<Budget>) => api.put<Budget>(`/budgets/${id}`, data),
  delete: (id: string) => api.delete(`/budgets/${id}`),
  createNewVersion: (budgetId: string, planValueChanges: any[]) => 
    api.post(`/budgets/${budgetId}/new-version`, { planValueChanges })
};

// Expense API
export const expenseApi = {
  getByBudget: (budgetId: string) => api.get<Expense[]>(`/expenses?budgetId=${budgetId}`),
  getById: (id: string) => api.get<Expense>(`/expenses/${id}`),
  getMetadata: (id: string) => api.get(`/expenses/${id}/metadata`),
  create: (data: any) => api.post<Expense>('/expenses', data),
  update: (id: string, data: Partial<Expense>) => api.put<Expense>(`/expenses/${id}`, data),
  delete: (id: string) => api.delete(`/expenses/${id}`)
};

// Transaction API
export const transactionApi = {
  getByExpense: (expenseId: string) => api.get<Transaction[]>(`/transactions?expenseId=${expenseId}`),
  getByExpenseAndMonth: (expenseId: string, month: number) => 
    api.get<Transaction[]>(`/transactions?expenseId=${expenseId}&month=${month}`),
  getById: (id: string) => api.get<Transaction>(`/transactions/${id}`),
  create: (data: any) => api.post<Transaction>('/transactions', data),
  update: (id: string, data: Partial<Transaction>) => api.put<Transaction>(`/transactions/${id}`, data),
  delete: (id: string) => api.delete(`/transactions/${id}`)
};

// PlanValue API
export const planValueApi = {
  getByExpense: (expenseId: string) => api.get<PlanValue[]>(`/plan-values?expenseId=${expenseId}`),
  getMonthly: (expenseId: string, month: number) => 
    api.get<PlanValue>(`/plan-values/${expenseId}/monthly/${month}`),
  getTotal: (expenseId: string) => api.get(`/plan-values/${expenseId}/total`),
  getById: (id: string) => api.get<PlanValue>(`/plan-values/${id}`),
  create: (data: any) => api.post<PlanValue>('/plan-values', data),
  update: (id: string, data: Partial<PlanValue>) => api.put<PlanValue>(`/plan-values/${id}`, data),
  delete: (id: string) => api.delete(`/plan-values/${id}`)
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
  update: (id: string, data: Partial<TechnologyDirection>) => 
    api.put<TechnologyDirection>(`/technology-directions/${id}`, data),
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
  update: (id: string, data: Partial<FinancialCompany>) => 
    api.put<FinancialCompany>(`/financial-companies/${id}`, data),
  delete: (id: string) => api.delete(`/financial-companies/${id}`)
};

// TagDefinition API
export const tagDefinitionApi = {
  getAll: () => api.get<TagDefinition[]>('/tag-definitions'),
  getById: (id: string) => api.get<TagDefinition>(`/tag-definitions/${id}`),
  create: (data: any) => api.post<TagDefinition>('/tag-definitions', data),
  update: (id: string, data: Partial<TagDefinition>) => 
    api.put<TagDefinition>(`/tag-definitions/${id}`, data),
  delete: (id: string) => api.delete(`/tag-definitions/${id}`)
};

// Savings API
export const savingsApi = {
  getAll: (filters?: {
    expenseId?: string;
    budgetId?: string;
    status?: string;
    createdBy?: string;
    dateFrom?: string;
    dateTo?: string;
  }) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
    }
    return api.get<Saving[]>(`/savings?${params.toString()}`);
  },
  getById: (id: string) => api.get<Saving>(`/savings/${id}`),
  create: (data: {
    expenseId: string;
    budgetId: string;
    totalAmount: number;
    description: string;
    distributionStrategy: 'EVEN' | 'SINGLE_MONTH' | 'CUSTOM';
    targetMonth?: number;
    customDistribution?: Record<number, number>;
  }) => api.post<Saving>('/savings', data),
  approve: (savingIds: string[]) => api.post('/savings/approve', { savingIds }),
  delete: (id: string) => api.delete(`/savings/${id}`)
};

// Enhanced Expenses API (with custom tags)
export const expensesEnhancedApi = {
  getAll: (filters?: {
    searchText?: string;
    technologyDirectionIds?: string;
    userAreaIds?: string;
    financialCompanyId?: string;
    parentExpenseId?: string;
    tagKey?: string;
    tagValue?: string;
  }) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
    }
    return api.get<ExpenseWithTags[]>(`/expenses-enhanced?${params.toString()}`);
  },
  getById: (id: string) => api.get<ExpenseWithTags>(`/expenses-enhanced/${id}`),
  create: (data: {
    budgetId: string;
    code: string;
    shortDescription: string;
    longDescription: string;
    technologyDirections: string[];
    userAreas: string[];
    financialCompanyId: string;
    parentExpenseId?: string;
  }) => api.post<ExpenseWithTags>('/expenses-enhanced', data),
  update: (id: string, data: Partial<ExpenseWithTags>) => 
    api.put<ExpenseWithTags>(`/expenses-enhanced/${id}`, data),
  delete: (id: string) => api.delete(`/expenses-enhanced/${id}`),
  addTag: (expenseId: string, tag: CustomTag) => 
    api.post(`/expenses-enhanced/${expenseId}/tags`, tag),
  updateTag: (expenseId: string, tagKey: string, tag: CustomTag) => 
    api.put(`/expenses-enhanced/${expenseId}/tags/${tagKey}`, tag),
  removeTag: (expenseId: string, tagKey: string) => 
    api.delete(`/expenses-enhanced/${expenseId}/tags/${tagKey}`)
};

// Deferrals API
export const deferralApi = {
  getByBudget: (budgetId: string) => api.get<Deferral[]>(`/deferrals?budgetId=${budgetId}`),
  getById: (id: string) => api.get<Deferral>(`/deferrals/${id}`),
  create: (data: {
    expenseId: string;
    budgetId: string;
    description: string;
    totalAmount: number;
    startMonth: number;
    endMonth: number;
  }) => api.post<Deferral>('/deferrals', data),
  delete: (id: string) => api.delete(`/deferrals/${id}`)
};

export default api;
export { api };

