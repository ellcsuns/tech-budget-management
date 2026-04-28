import React, { useState, useEffect, useRef } from 'react';
import { financialCompanyApi, expenseCategoryApi } from '../services/api';
import type { BudgetLine, FinancialCompany, ExpenseCategory } from '../types';
import { HiOutlineXMark, HiOutlineFunnel, HiOutlineChevronDown } from 'react-icons/hi2';
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

function MultiSelectDropdown({ label, items, selectedIds, onToggle, renderItem }: {
  label: string;
  items: { id: string; label: string }[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  renderItem?: (item: { id: string; label: string }, selected: boolean) => React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const activeCount = selectedIds.length;
  const allSelected = activeCount === 0 || activeCount === items.length;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
          !allSelected
            ? 'bg-accent/10 border-accent text-accent dark:bg-accent/20 dark:text-white'
            : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:border-gray-400 dark:hover:border-gray-500'
        }`}
      >
        <HiOutlineFunnel className="w-3.5 h-3.5" />
        {label}
        {!allSelected && <span className="bg-accent text-white text-[10px] px-1.5 py-0.5 rounded-full leading-none">{activeCount}</span>}
        <HiOutlineChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-30 min-w-[180px] max-h-[280px] overflow-y-auto py-1">
          {items.map(item => {
            const selected = selectedIds.length === 0 || selectedIds.includes(item.id);
            return (
              <button
                key={item.id}
                onClick={() => onToggle(item.id)}
                className={`w-full text-left px-3 py-1.5 text-xs flex items-center gap-2 transition-colors ${
                  selected
                    ? 'text-gray-900 dark:text-gray-100'
                    : 'text-gray-400 dark:text-gray-500'
                } hover:bg-gray-50 dark:hover:bg-gray-700`}
              >
                <span className={`w-3.5 h-3.5 rounded border flex-shrink-0 flex items-center justify-center ${
                  selected
                    ? 'bg-accent border-accent text-white'
                    : 'border-gray-300 dark:border-gray-600'
                }`}>
                  {selected && <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                </span>
                {renderItem ? renderItem(item, selected) : item.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
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
    try { setFinancialCompanies((await financialCompanyApi.getAll()).data); }
    catch (error) { console.error('Error loading financial companies:', error); }
  };

  const loadExpenseCategories = async () => {
    try { setExpenseCategories((await expenseCategoryApi.getAll()).data); }
    catch (error) { console.error('Error loading expense categories:', error); }
  };

  const currencies = Array.from(new Set(budgetLines.map(bl => bl.currency).filter(Boolean)));

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

  const hasActiveFilters = !!(filters.currencies || filters.financialCompanyIds || filters.categories || filters.searchText);

  const colOn = 'bg-accent text-white shadow-sm';
  const colOff = 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600';

  const currOn = 'bg-accent text-white shadow-sm';
  const currOff = 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:border-accent dark:hover:border-accent';

  return (
    <div className="space-y-3 mb-4">
      {/* Row 1: Search + Column toggles */}
      <div className="flex items-center gap-3">
        <div className="relative flex-shrink-0">
          <input
            type="text"
            value={filters.searchText || ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSearchChange(e.target.value)}
            placeholder={t('filter.searchComma')}
            className="pl-3 pr-8 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent w-56 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
          {filters.searchText && (
            <button onClick={() => handleSearchChange('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <HiOutlineXMark className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="h-5 w-px bg-gray-300 dark:bg-gray-600" />

        {/* Column visibility toggles */}
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wider mr-1">{t('filter.columns') || 'Columnas'}</span>
          <button onClick={() => toggleColumn('budget')} className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${filters.visibleColumns.budget ? colOn : colOff}`}>{t('expense.budget')}</button>
          <button onClick={() => toggleColumn('committed')} className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${filters.visibleColumns.committed ? colOn : colOff}`}>{t('expense.committed')}</button>
          <button onClick={() => toggleColumn('real')} className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${filters.visibleColumns.real ? colOn : colOff}`}>{t('expense.real')}</button>
        </div>

        {hasActiveFilters && (
          <>
            <div className="ml-auto" />
            <button onClick={clearFilters} className="inline-flex items-center gap-1 text-xs text-accent hover:opacity-70 transition-opacity" title={t('filter.clearFilters')}>
              <HiOutlineXMark className="w-4 h-4" />
              {t('filter.clear') || 'Limpiar'}
            </button>
          </>
        )}
      </div>

      {/* Row 2: Filter dropdowns + currency pills */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Currency pills */}
        {currencies.length > 0 && (
          <div className="flex items-center gap-1">
            {currencies.map(currency => (
              <button
                key={currency}
                onClick={() => toggleCurrency(currency)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                  (filters.currencies?.includes(currency) ?? true) ? currOn : currOff
                }`}
              >
                {currency}
              </button>
            ))}
          </div>
        )}

        {currencies.length > 0 && (financialCompanies.length > 0 || expenseCategories.length > 0) && (
          <div className="h-5 w-px bg-gray-300 dark:bg-gray-600" />
        )}

        {/* Company dropdown */}
        {financialCompanies.length > 0 && (
          <MultiSelectDropdown
            label={t('label.company') || 'Empresa'}
            items={financialCompanies.map((c: FinancialCompany) => ({ id: c.id, label: `${c.code} — ${c.name}` }))}
            selectedIds={filters.financialCompanyIds || []}
            onToggle={toggleFinancialCompany}
          />
        )}

        {/* Category dropdown */}
        {expenseCategories.length > 0 && (
          <MultiSelectDropdown
            label={t('label.category') || 'Categoría'}
            items={expenseCategories.map((c: ExpenseCategory) => ({ id: c.id, label: c.name }))}
            selectedIds={filters.categories || []}
            onToggle={toggleCategory}
          />
        )}
      </div>
    </div>
  );
}
