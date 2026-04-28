// FilterPanel - shared filter component for Dashboard and BudgetsPage
import React, { useState, useEffect, useRef } from 'react';
import { financialCompanyApi, expenseCategoryApi } from '../services/api';
import type { BudgetLine, FinancialCompany, ExpenseCategory } from '../types';
import { HiOutlineXMark, HiOutlineChevronDown, HiOutlineMagnifyingGlass, HiOutlineCurrencyDollar, HiOutlineBuildingOffice2, HiOutlineTag, HiOutlineAdjustmentsHorizontal, HiOutlineTableCells } from 'react-icons/hi2';
import { useI18n } from '../contexts/I18nContext';

interface FilterPanelProps {
  budgetLines: BudgetLine[];
  filters: {
    currencies?: string[];
    financialCompanyIds?: string[];
    categories?: string[];
    searchText?: string;
    visibleColumns: { budget: boolean; committed: boolean; real: boolean; diff: boolean };
  };
  onFiltersChange: (filters: any) => void;
  hideValues?: boolean;
  showBaseToggle?: boolean;
  showBase?: boolean;
  onShowBaseChange?: (v: boolean) => void;
  showSummaryToggle?: boolean;
  showSummary?: boolean;
  onShowSummaryChange?: (v: boolean) => void;
}

function DropBtn({ label, icon, children, active, onClear }: {
  label: string; icon?: React.ReactNode; children: React.ReactNode; active?: boolean; onClear?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(!open)}
        className={`inline-flex items-center gap-1.5 h-8 px-2.5 rounded-md text-xs font-medium transition-all border whitespace-nowrap ${
          active ? 'bg-accent text-white border-accent' : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500'
        }`}>
        {icon}{label}<HiOutlineChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-xl z-30 min-w-[200px] max-h-[320px] overflow-y-auto py-1">
          {onClear && active && <button onClick={onClear} className="w-full text-left px-3 py-1.5 text-xs text-accent hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700">Limpiar filtro</button>}
          {children}
        </div>
      )}
    </div>
  );
}

function ChkItem({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <button onClick={onChange} className={`w-full text-left px-3 py-1.5 text-xs flex items-center gap-2 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700 ${checked ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400 dark:text-gray-500'}`}>
      <span className={`w-3.5 h-3.5 rounded border flex-shrink-0 flex items-center justify-center ${checked ? 'bg-accent border-accent text-white' : 'border-gray-300 dark:border-gray-600'}`}>
        {checked && <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
      </span>
      {label}
    </button>
  );
}

export default function FilterPanel({ budgetLines, filters, onFiltersChange, hideValues, showBaseToggle, showBase, onShowBaseChange, showSummaryToggle, showSummary, onShowSummaryChange }: FilterPanelProps) {
  const { t } = useI18n();
  const [financialCompanies, setFinancialCompanies] = useState<FinancialCompany[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>([]);

  useEffect(() => {
    financialCompanyApi.getAll().then(r => setFinancialCompanies(r.data)).catch(() => {});
    expenseCategoryApi.getAll().then(r => setExpenseCategories(r.data)).catch(() => {});
  }, []);

  const currencies = Array.from(new Set(budgetLines.map(bl => bl.currency).filter(Boolean)));
  const descriptions = Array.from(new Set(budgetLines.map(bl => bl.expense?.shortDescription).filter(Boolean))) as string[];

  const toggleCurrency = (c: string) => { const cur = filters.currencies || []; const n = cur.includes(c) ? cur.filter(x => x !== c) : [...cur, c]; onFiltersChange({ ...filters, currencies: n.length > 0 ? n : undefined }); };
  const toggleCompany = (id: string) => { const cur = filters.financialCompanyIds || []; const n = cur.includes(id) ? cur.filter(x => x !== id) : [...cur, id]; onFiltersChange({ ...filters, financialCompanyIds: n.length > 0 ? n : undefined }); };
  const toggleCategory = (id: string) => { const cur = filters.categories || []; const n = cur.includes(id) ? cur.filter(x => x !== id) : [...cur, id]; onFiltersChange({ ...filters, categories: n.length > 0 ? n : undefined }); };
  const toggleColumn = (col: 'budget' | 'committed' | 'real' | 'diff') => { onFiltersChange({ ...filters, visibleColumns: { ...filters.visibleColumns, [col]: !filters.visibleColumns[col] } }); };
  const toggleDesc = (desc: string) => { const cur = (filters.searchText || '').split(',').map(s => s.trim()).filter(Boolean); const n = cur.includes(desc) ? cur.filter(d => d !== desc) : [...cur, desc]; onFiltersChange({ ...filters, searchText: n.join(', ') }); };
  const clearAll = () => { onFiltersChange({ currencies: undefined, financialCompanyIds: undefined, categories: undefined, searchText: '', visibleColumns: { budget: true, committed: true, real: true, diff: true } }); };

  const hasActive = !!(filters.currencies || filters.financialCompanyIds || filters.categories || filters.searchText);
  const terms = (filters.searchText || '').split(',').map(s => s.trim()).filter(Boolean);
  const hiddenCols = [filters.visibleColumns.budget, filters.visibleColumns.committed, filters.visibleColumns.real, filters.visibleColumns.diff].filter(v => !v).length;

  return (
    <div className="flex items-center gap-1.5 mb-4">
      {/* Left: filters */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <DropBtn label={t('table.description') || 'Descripción'} icon={<HiOutlineMagnifyingGlass className="w-3.5 h-3.5" />} active={terms.length > 0} onClear={() => onFiltersChange({ ...filters, searchText: '' })}>
          <div className="px-3 py-1.5 border-b border-gray-100 dark:border-gray-700">
            <input type="text" value={filters.searchText || ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => onFiltersChange({ ...filters, searchText: e.target.value })} placeholder={t('filter.searchComma')} className="w-full px-2 py-1 text-xs border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-accent" />
          </div>
          <div className="max-h-[200px] overflow-y-auto">{descriptions.sort().map(d => <ChkItem key={d} label={d} checked={terms.length === 0 || terms.some(t => d.toLowerCase().includes(t.toLowerCase()))} onChange={() => toggleDesc(d)} />)}</div>
        </DropBtn>

        {!hideValues && <DropBtn label={hiddenCols > 0 ? `${t('filter.values') || 'Valores'} (${4 - hiddenCols})` : (t('filter.values') || 'Valores')} icon={<HiOutlineTableCells className="w-3.5 h-3.5" />} active={hiddenCols > 0}>
          <ChkItem label={t('dashboard.budget') || 'Presupuesto'} checked={filters.visibleColumns.budget} onChange={() => toggleColumn('budget')} />
          <ChkItem label={t('dashboard.committed') || 'Comprometido'} checked={filters.visibleColumns.committed} onChange={() => toggleColumn('committed')} />
          <ChkItem label={t('dashboard.real') || 'Real'} checked={filters.visibleColumns.real} onChange={() => toggleColumn('real')} />
          <ChkItem label={t('dashboard.difference') || 'Diferencia'} checked={filters.visibleColumns.diff} onChange={() => toggleColumn('diff')} />
        </DropBtn>}

        {currencies.length > 0 && (
          <DropBtn label={t('label.currency') || 'Moneda'} icon={<HiOutlineCurrencyDollar className="w-3.5 h-3.5" />} active={!!filters.currencies} onClear={() => onFiltersChange({ ...filters, currencies: undefined })}>
            {currencies.map(c => <ChkItem key={c} label={c} checked={!filters.currencies || filters.currencies.includes(c)} onChange={() => toggleCurrency(c)} />)}
          </DropBtn>
        )}

        {financialCompanies.length > 0 && (
          <DropBtn label={t('label.company') || 'Empresa'} icon={<HiOutlineBuildingOffice2 className="w-3.5 h-3.5" />} active={!!filters.financialCompanyIds} onClear={() => onFiltersChange({ ...filters, financialCompanyIds: undefined })}>
            {financialCompanies.map((c: FinancialCompany) => <ChkItem key={c.id} label={`${c.code} — ${c.name}`} checked={!filters.financialCompanyIds || filters.financialCompanyIds.includes(c.id)} onChange={() => toggleCompany(c.id)} />)}
          </DropBtn>
        )}

        {expenseCategories.length > 0 && (
          <DropBtn label={t('label.category') || 'Categoría'} icon={<HiOutlineTag className="w-3.5 h-3.5" />} active={!!filters.categories} onClear={() => onFiltersChange({ ...filters, categories: undefined })}>
            {expenseCategories.map((c: ExpenseCategory) => <ChkItem key={c.id} label={c.name} checked={!filters.categories || filters.categories.includes(c.id)} onChange={() => toggleCategory(c.id)} />)}
          </DropBtn>
        )}

        {hasActive && (
          <button onClick={clearAll} className="inline-flex items-center gap-1 h-8 px-2 text-xs text-accent hover:opacity-70 transition-opacity" title={t('filter.clearFilters')}>
            <HiOutlineXMark className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Right: toggles */}
      {(showBaseToggle || showSummaryToggle) && (
        <div className="flex items-center gap-1.5 ml-auto flex-shrink-0">
          {showBaseToggle && onShowBaseChange && (
            <button onClick={() => onShowBaseChange(!showBase)}
              className={`inline-flex items-center gap-1.5 h-8 px-2.5 rounded-md text-xs font-medium transition-all border whitespace-nowrap ${
                showBase ? 'bg-accent text-white border-accent' : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500'
              }`}>
              <HiOutlineAdjustmentsHorizontal className="w-3.5 h-3.5" />{t('budget.adjustments') || 'Ajustes'}
            </button>
          )}
          {showSummaryToggle && onShowSummaryChange && (
            <button onClick={() => onShowSummaryChange(!showSummary)}
              className={`inline-flex items-center gap-1.5 h-8 px-2.5 rounded-md text-xs font-medium transition-all border whitespace-nowrap ${
                showSummary ? 'bg-accent text-white border-accent' : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500'
              }`}>
              <HiOutlineTableCells className="w-3.5 h-3.5" />{t('budget.showSummary') || 'Resumen Mensual'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
