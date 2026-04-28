import React, { useState, useEffect, useRef } from 'react';
import { financialCompanyApi, expenseCategoryApi } from '../services/api';
import type { BudgetLine, FinancialCompany, ExpenseCategory } from '../types';
import { HiOutlineXMark, HiOutlineFunnel, HiOutlineChevronDown, HiOutlineMagnifyingGlass } from 'react-icons/hi2';
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
      diff: boolean;
    };
  };
  onFiltersChange: (filters: any) => void;
}

function DropdownFilter({ label, icon, children, active, onClear }: {
  label: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  active?: boolean;
  onClear?: () => void;
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

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all border whitespace-nowrap ${
          active
            ? 'bg-accent/10 dark:bg-accent/20 border-accent text-accent dark:text-blue-300'
            : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500'
        }`}
      >
        {icon}
        {label}
        <HiOutlineChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-xl z-30 min-w-[200px] max-h-[320px] overflow-y-auto py-1">
          {onClear && active && (
            <button onClick={() => { onClear(); }} className="w-full text-left px-3 py-1.5 text-xs text-accent hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700">
              {('Limpiar filtro')}
            </button>
          )}
          {children}
        </div>
      )}
    </div>
  );
}

function CheckItem({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <button onClick={onChange} className={`w-full text-left px-3 py-1.5 text-xs flex items-center gap-2 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700 ${checked ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400 dark:text-gray-500'}`}>
      <span className={`w-3.5 h-3.5 rounded border flex-shrink-0 flex items-center justify-center ${checked ? 'bg-accent border-accent text-white' : 'border-gray-300 dark:border-gray-600'}`}>
        {checked && <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
      </span>
      {label}
    </button>
  );
}

export default function FilterPanel({ budgetLines, filters, onFiltersChange }: FilterPanelProps) {
  const { t } = useI18n();
  const [financialCompanies, setFinancialCompanies] = useState<FinancialCompany[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>([]);

  useEffect(() => {
    financialCompanyApi.getAll().then(r => setFinancialCompanies(r.data)).catch(() => {});
    expenseCategoryApi.getAll().then(r => setExpenseCategories(r.data)).catch(() => {});
  }, []);

  const currencies = Array.from(new Set(budgetLines.map(bl => bl.currency).filter(Boolean)));
  const descriptions = Array.from(new Set(budgetLines.map(bl => bl.expense?.shortDescription).filter(Boolean))) as string[];

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

  const toggleColumn = (column: 'budget' | 'committed' | 'real' | 'diff') => {
    onFiltersChange({ ...filters, visibleColumns: { ...filters.visibleColumns, [column]: !filters.visibleColumns[column] } });
  };

  const toggleDescription = (desc: string) => {
    const current = (filters.searchText || '').split(',').map(s => s.trim()).filter(Boolean);
    const next = current.includes(desc) ? current.filter(d => d !== desc) : [...current, desc];
    onFiltersChange({ ...filters, searchText: next.join(', ') });
  };

  const clearFilters = () => {
    onFiltersChange({ currencies: undefined, financialCompanyIds: undefined, categories: undefined, searchText: '', visibleColumns: { budget: true, committed: true, real: true, diff: true } });
  };

  const hasActiveFilters = !!(filters.currencies || filters.financialCompanyIds || filters.categories || filters.searchText);
  const searchTerms = (filters.searchText || '').split(',').map(s => s.trim()).filter(Boolean);

  const colCount = [filters.visibleColumns.budget, filters.visibleColumns.committed, filters.visibleColumns.real, filters.visibleColumns.diff].filter(Boolean).length;

  return (
    <div className="flex items-center gap-1.5 flex-wrap mb-4">
      {/* Description search dropdown */}
      <DropdownFilter
        label={searchTerms.length > 0 ? `${t('table.description')} (${searchTerms.length})` : (t('table.description') || 'Descripción')}
        icon={<HiOutlineMagnifyingGlass className="w-3.5 h-3.5" />}
        active={searchTerms.length > 0}
        onClear={() => onFiltersChange({ ...filters, searchText: '' })}
      >
        <div className="px-3 py-1.5 border-b border-gray-100 dark:border-gray-700">
          <input
            type="text"
            value={filters.searchText || ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onFiltersChange({ ...filters, searchText: e.target.value })}
            placeholder={t('filter.searchComma')}
            className="w-full px-2 py-1 text-xs border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>
        <div className="max-h-[200px] overflow-y-auto">
          {descriptions.sort().map(desc => (
            <CheckItem key={desc} label={desc} checked={searchTerms.length === 0 || searchTerms.some(t => desc.toLowerCase().includes(t.toLowerCase()))} onChange={() => toggleDescription(desc)} />
          ))}
        </div>
      </DropdownFilter>

      {/* Values dropdown */}
      <DropdownFilter
        label={`${t('filter.values') || 'Valores'} (${colCount})`}
        active={colCount < 4}
      >
        <CheckItem label={t('dashboard.budget') || 'Presupuesto'} checked={filters.visibleColumns.budget} onChange={() => toggleColumn('budget')} />
        <CheckItem label={t('dashboard.committed') || 'Comprometido'} checked={filters.visibleColumns.committed} onChange={() => toggleColumn('committed')} />
        <CheckItem label={t('dashboard.real') || 'Real'} checked={filters.visibleColumns.real} onChange={() => toggleColumn('real')} />
        <CheckItem label={t('dashboard.difference') || 'Diferencia'} checked={filters.visibleColumns.diff} onChange={() => toggleColumn('diff')} />
      </DropdownFilter>

      {/* Currency dropdown */}
      {currencies.length > 0 && (
        <DropdownFilter
          label={filters.currencies ? `${t('label.currency') || 'Moneda'} (${filters.currencies.length})` : (t('label.currency') || 'Moneda')}
          active={!!filters.currencies}
          onClear={() => onFiltersChange({ ...filters, currencies: undefined })}
        >
          {currencies.map(c => (
            <CheckItem key={c} label={c} checked={!filters.currencies || filters.currencies.includes(c)} onChange={() => toggleCurrency(c)} />
          ))}
        </DropdownFilter>
      )}

      {/* Company dropdown */}
      {financialCompanies.length > 0 && (
        <DropdownFilter
          label={filters.financialCompanyIds ? `${t('label.company') || 'Empresa'} (${filters.financialCompanyIds.length})` : (t('label.company') || 'Empresa')}
          icon={<HiOutlineFunnel className="w-3.5 h-3.5" />}
          active={!!filters.financialCompanyIds}
          onClear={() => onFiltersChange({ ...filters, financialCompanyIds: undefined })}
        >
          {financialCompanies.map((c: FinancialCompany) => (
            <CheckItem key={c.id} label={`${c.code} — ${c.name}`} checked={!filters.financialCompanyIds || filters.financialCompanyIds.includes(c.id)} onChange={() => toggleFinancialCompany(c.id)} />
          ))}
        </DropdownFilter>
      )}

      {/* Category dropdown */}
      {expenseCategories.length > 0 && (
        <DropdownFilter
          label={filters.categories ? `${t('label.category') || 'Categoría'} (${filters.categories.length})` : (t('label.category') || 'Categoría')}
          icon={<HiOutlineFunnel className="w-3.5 h-3.5" />}
          active={!!filters.categories}
          onClear={() => onFiltersChange({ ...filters, categories: undefined })}
        >
          {expenseCategories.map((c: ExpenseCategory) => (
            <CheckItem key={c.id} label={c.name} checked={!filters.categories || filters.categories.includes(c.id)} onChange={() => toggleCategory(c.id)} />
          ))}
        </DropdownFilter>
      )}

      {/* Clear all */}
      {hasActiveFilters && (
        <button onClick={clearFilters} className="inline-flex items-center gap-1 px-2 py-1.5 text-xs text-accent hover:opacity-70 transition-opacity ml-auto" title={t('filter.clearFilters')}>
          <HiOutlineXMark className="w-4 h-4" />
          {t('filter.clear') || 'Limpiar'}
        </button>
      )}
    </div>
  );
}
