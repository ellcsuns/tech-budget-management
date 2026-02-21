import React, { useState, useEffect } from 'react';
import { financialCompanyApi, expenseCategoryApi } from '../services/api';
import type { BudgetLine, FinancialCompany, ExpenseCategory } from '../types';
import { HiOutlineXMark } from 'react-icons/hi2';
import { useI18n } from '../contexts/I18nContext';

interface FilterPanelProps {
  budgetLines: BudgetLine[];
  filters: {
    currencies?: string[];
    financialCompanyIds?: string[];
    categories?: string[];
    searchText?: string;
    visibleColumns: {
      budget: boolean;
      committed: boolean;
      real: boolean;
    };
  };
  onFiltersChange: (filters: any) => void;
}

export default function FilterPanel({ budgetLines, filters, onFiltersChange }: FilterPanelProps) {
  const { t } = useI18n();
  const [financialCompanies, setFinancialCompanies] = useState<FinancialCompany[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>([]);

  useEffect(() => {
    loadFinancialCompanies();
    loadExpenseCategories();
  }, []);

  const loadFinancialCompanies = async () => {
    try {
      const response = await financialCompanyApi.getAll();
      setFinancialCompanies(response.data);
    } catch (error) {
      console.error('Error loading financial companies:', error);
    }
  };

  const loadExpenseCategories = async () => {
    try {
      const response = await expenseCategoryApi.getAll();
      setExpenseCategories(response.data);
    } catch (error) {
      console.error('Error loading expense categories:', error);
    }
  };

  const currencies = Array.from(new Set(
    budgetLines.map(bl => bl.currency).filter(Boolean)
  ));

  const toggleCurrency = (currency: string) => {
    const current = filters.currencies || [];
    const next = current.includes(currency) ? current.filter(c => c !== currency) : [...current, currency];
    onFiltersChange({ ...filters, currencies: next.length > 0 ? next : undefined });
  };

  const toggleFinancialCompany = (companyId: string) => {
    const current = filters.financialCompanyIds || [];
    const next = current.includes(companyId) ? current.filter(c => c !== companyId) : [...current, companyId];
    onFiltersChange({ ...filters, financialCompanyIds: next.length > 0 ? next : undefined });
  };

  const toggleCategory = (categoryId: string) => {
    const current = filters.categories || [];
    const next = current.includes(categoryId) ? current.filter(c => c !== categoryId) : [...current, categoryId];
    onFiltersChange({ ...filters, categories: next.length > 0 ? next : undefined });
  };

  const toggleColumn = (column: 'budget' | 'committed' | 'real') => {
    onFiltersChange({ ...filters, visibleColumns: { ...filters.visibleColumns, [column]: !filters.visibleColumns[column] } });
  };

  const clearFilters = () => {
    onFiltersChange({ currencies: undefined, financialCompanyIds: undefined, categories: undefined, searchText: '', visibleColumns: { budget: true, committed: true, real: true } });
  };

  const handleSearchChange = (value: string) => {
    onFiltersChange({ ...filters, searchText: value });
  };

  const accentOn = 'bg-accent text-white';
  const accentOff = 'bg-gray-200 text-gray-500';

  return (
    <div className="flex flex-wrap items-center gap-3 mb-4">
      <input
        type="text"
        value={filters.searchText || ''}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSearchChange(e.target.value)}
        placeholder={t('filter.searchComma')}
        className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent w-64"
      />
      <div className="w-px h-6 bg-gray-300" />
      <div className="flex items-center gap-1">
        <button onClick={() => toggleColumn('budget')} className={`px-3 py-1 rounded text-xs font-medium transition-colors ${filters.visibleColumns.budget ? accentOn : accentOff}`}>{t('expense.budget')}</button>
        <button onClick={() => toggleColumn('committed')} className={`px-3 py-1 rounded text-xs font-medium transition-colors ${filters.visibleColumns.committed ? accentOn : accentOff}`}>{t('expense.committed')}</button>
        <button onClick={() => toggleColumn('real')} className={`px-3 py-1 rounded text-xs font-medium transition-colors ${filters.visibleColumns.real ? accentOn : accentOff}`}>{t('expense.real')}</button>
      </div>
      <div className="w-px h-6 bg-gray-300" />
      {currencies.length > 0 && (
        <>
          <div className="flex items-center gap-1">
            {currencies.map(currency => (
              <button key={currency} onClick={() => toggleCurrency(currency)} className={`px-3 py-1 rounded text-xs font-medium transition-colors ${(filters.currencies?.includes(currency) ?? true) ? accentOn : accentOff}`}>{currency}</button>
            ))}
          </div>
          <div className="w-px h-6 bg-gray-300" />
        </>
      )}
      {financialCompanies.length > 0 && (
        <>
          <div className="flex items-center gap-1">
            {financialCompanies.map(company => (
              <button key={company.id} onClick={() => toggleFinancialCompany(company.id)} title={company.name} className={`px-3 py-1 rounded text-xs font-medium transition-colors ${(filters.financialCompanyIds?.includes(company.id) ?? true) ? accentOn : accentOff}`}>{company.code}</button>
            ))}
          </div>
          <div className="w-px h-6 bg-gray-300" />
        </>
      )}
      {expenseCategories.length > 0 && (
        <>
          <div className="flex items-center gap-1 flex-wrap">
            {expenseCategories.map(cat => (
              <button key={cat.id} onClick={() => toggleCategory(cat.id)} className={`px-3 py-1 rounded text-xs font-medium transition-colors ${(filters.categories?.includes(cat.id) ?? true) ? accentOn : accentOff}`}>{cat.name}</button>
            ))}
          </div>
          <div className="w-px h-6 bg-gray-300" />
        </>
      )}
      <button onClick={clearFilters} className="text-accent hover:opacity-70 transition-opacity ml-auto" title={t('filter.clearFilters')}>
        <HiOutlineXMark className="w-6 h-6" />
      </button>
    </div>
  );
}
