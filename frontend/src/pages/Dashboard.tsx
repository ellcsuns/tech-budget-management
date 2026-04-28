import { useState, useEffect, useMemo } from 'react';
import { budgetApi, savingsApi } from '../services/api';
import type { BudgetLine, Saving, CompanyTotals, ComputedBudgetLine, MonthBreakdown } from '../types';
import ExpenseTable from '../components/ExpenseTable';
import FilterPanel from '../components/FilterPanel';
import { fmt } from '../utils/formatters';
import { useI18n } from '../contexts/I18nContext';

const MONTHS = ['M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7', 'M8', 'M9', 'M10', 'M11', 'M12'];

export default function Dashboard() {
  const { t } = useI18n();
  const [budgetLines, setBudgetLines] = useState<ComputedBudgetLine[]>([]);
  const [activeSavings, setActiveSavings] = useState<Saving[]>([]);
  const [monthlySummary, setMonthlySummary] = useState<MonthBreakdown[]>([]);
  const [loading, setLoading] = useState(true);
  const [noBudget, setNoBudget] = useState(false);
  const [showBase, setShowBase] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [totals, setTotals] = useState({ budget: 0, committed: 0, real: 0, diff: 0 });
  const [filters, setFilters] = useState({
    currencies: undefined as string[] | undefined,
    financialCompanyIds: undefined as string[] | undefined,
    categories: undefined as string[] | undefined,
    searchText: '',
    visibleColumns: { budget: true, committed: true, real: true, diff: true }
  });

  useEffect(() => { loadActiveBudget(); }, []);

  const loadActiveBudget = async () => {
    try {
      const response = await budgetApi.getActive();
      const budget = response.data;
      // Load active savings
      try {
        const savingsRes = await savingsApi.getAll({ budgetId: budget.id, status: 'ACTIVE' });
        setActiveSavings(savingsRes.data);
      } catch { setActiveSavings([]); }
      // Load computed budget
      try {
        const computedRes = await budgetApi.getComputed(budget.id);
        setBudgetLines(computedRes.data.budgetLines || []);
        setMonthlySummary(computedRes.data.monthlySummary || []);
      } catch {
        setBudgetLines((budget.budgetLines || []) as any);
        setMonthlySummary([]);
      }
    } catch (error) {
      console.error('Error loading active budget:', error);
      setNoBudget(true);
    } finally { setLoading(false); }
  };

  const filteredLines = useMemo(() => {
    return budgetLines.filter(bl => {
      if (filters.currencies && !filters.currencies.includes(bl.currency)) return false;
      if (filters.financialCompanyIds && !filters.financialCompanyIds.includes(bl.financialCompanyId)) return false;
      if (filters.categories) {
        const catId = (bl.expense as any)?.categoryId;
        if (!catId || !filters.categories.includes(catId)) return false;
      }
      if (filters.searchText) {
        const terms = filters.searchText.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
        if (terms.length > 0) {
          const code = bl.expense?.code?.toLowerCase() || '';
          const desc = bl.expense?.shortDescription?.toLowerCase() || '';
          const catName = (bl.expense as any)?.category?.name?.toLowerCase() || '';
          if (!terms.some(term => code.includes(term) || desc.includes(term) || catName.includes(term))) return false;
        }
      }
      return true;
    });
  }, [budgetLines, filters]);

  const getVal = (bl: any, m: number) => {
    if (showBase) return Number(bl[`planM${m}`]) || 0;
    return Number(bl[`computedM${m}`]) ?? Number(bl[`planM${m}`]) ?? 0;
  };

  const companyTotals = useMemo<CompanyTotals[]>(() => {
    const map = new Map<string, CompanyTotals>();
    filteredLines.forEach(bl => {
      const cid = bl.financialCompanyId;
      if (!map.has(cid)) map.set(cid, { companyId: cid, companyCode: bl.financialCompany?.code || cid, companyName: bl.financialCompany?.name || '', budget: 0, committed: 0, real: 0, diff: 0 });
      const ct = map.get(cid)!;
      let plan = 0;
      for (let m = 1; m <= 12; m++) plan += getVal(bl, m);
      ct.budget += plan;
      let committed = 0, real = 0;
      (bl.transactions || []).forEach(t => {
        if (t.type === 'COMMITTED') committed += Number(t.transactionValue) || 0;
        else if (t.type === 'REAL') real += Number(t.transactionValue) || 0;
      });
      ct.committed += committed; ct.real += real; ct.diff = ct.budget - ct.committed - ct.real;
    });
    return Array.from(map.values());
  }, [filteredLines, showBase]);

  // Currency totals
  const currencyTotals = useMemo(() => {
    const map = new Map<string, number>();
    filteredLines.forEach(bl => {
      const curr = bl.currency || 'USD';
      let plan = 0;
      for (let m = 1; m <= 12; m++) plan += getVal(bl, m);
      map.set(curr, (map.get(curr) || 0) + plan);
    });
    return Array.from(map.entries());
  }, [filteredLines, showBase]);

  useEffect(() => {
    let budget = 0, committed = 0, real = 0;
    filteredLines.forEach(bl => {
      for (let m = 1; m <= 12; m++) budget += getVal(bl, m);
      (bl.transactions || []).forEach(t => {
        if (t.type === 'COMMITTED') committed += Number(t.transactionValue) || 0;
        else if (t.type === 'REAL') real += Number(t.transactionValue) || 0;
      });
    });
    setTotals({ budget, committed, real, diff: budget - committed - real });
  }, [filteredLines, showBase]);

  const expenseTableLines = useMemo(() => {
    if (showBase) return filteredLines as any;
    return filteredLines.map(bl => {
      const m: any = { ...bl };
      for (let i = 1; i <= 12; i++) {
        if ((bl as any)[`computedM${i}`] !== undefined) m[`planM${i}`] = (bl as any)[`computedM${i}`];
      }
      return m;
    }) as any;
  }, [filteredLines, showBase]);

  const getDiffColor = () => totals.diff === 0 ? 'text-gray-500' : totals.diff > 0 ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400';
  const getDiffBg = () => totals.diff === 0 ? 'bg-gray-50 dark:bg-gray-700' : totals.diff > 0 ? 'bg-green-50 dark:bg-green-900/30' : 'bg-red-50 dark:bg-red-900/30';

  if (loading) return <div className="flex justify-center items-center h-64"><div className="text-lg text-gray-600 dark:text-gray-400">{t('msg.loading')}</div></div>;
  if (noBudget) return <div className="flex justify-center items-center h-64"><div className="text-lg text-amber-600">{t('dashboard.noBudget') || 'No hay presupuesto vigente configurado.'}</div></div>;

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <FilterPanel budgetLines={budgetLines as any} filters={filters} onFiltersChange={setFilters}
          showBaseToggle={true} showBase={showBase} onShowBaseChange={setShowBase}
          showSummaryToggle={true} showSummary={showSummary} onShowSummaryChange={setShowSummary}
        />

        {/* KPI totals */}
        <div className="flex gap-3 flex-wrap mb-4">
          <div className="bg-blue-50 dark:bg-blue-900/30 px-4 py-2 rounded-lg text-center">
            <span className="text-[10px] text-gray-500 dark:text-gray-400 uppercase">{t('dashboard.budget') || 'Presupuesto'}</span>
            <p className="text-sm font-bold text-blue-800 dark:text-blue-300">${fmt(totals.budget)}</p>
          </div>
          <div className="bg-indigo-50 dark:bg-indigo-900/30 px-4 py-2 rounded-lg text-center">
            <span className="text-[10px] text-gray-500 dark:text-gray-400 uppercase">{t('dashboard.committed') || 'Comprometido'}</span>
            <p className="text-sm font-bold text-indigo-800 dark:text-indigo-300">${fmt(totals.committed)}</p>
          </div>
          <div className="bg-emerald-50 dark:bg-emerald-900/30 px-4 py-2 rounded-lg text-center">
            <span className="text-[10px] text-gray-500 dark:text-gray-400 uppercase">{t('dashboard.real') || 'Real'}</span>
            <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300">${fmt(totals.real)}</p>
          </div>
          <div className={`${getDiffBg()} px-4 py-2 rounded-lg text-center`}>
            <span className="text-[10px] text-gray-500 dark:text-gray-400 uppercase">{t('dashboard.difference') || 'Diferencia'}</span>
            <p className={`text-sm font-bold ${getDiffColor()}`}>${fmt(totals.diff)}</p>
          </div>
        </div>

        {/* Company + Currency totals */}
        {(companyTotals.length > 1 || currencyTotals.length > 1) && (
          <div className="flex gap-1.5 overflow-x-auto mb-3 pb-1">
            {companyTotals.map(ct => (
              <div key={ct.companyId} className="bg-gray-50 dark:bg-gray-700 px-2 py-1 rounded flex-shrink-0 text-center" title={ct.companyName}>
                <div className="text-[10px] font-bold text-gray-700 dark:text-gray-300">{ct.companyCode}</div>
                <div className="flex gap-1.5 text-[10px] whitespace-nowrap">
                  <span className="text-blue-700 dark:text-blue-400">${fmt(ct.budget)}</span>
                  <span className="text-indigo-700 dark:text-indigo-400">${fmt(ct.committed)}</span>
                  <span className="text-emerald-700 dark:text-emerald-400">${fmt(ct.real)}</span>
                </div>
              </div>
            ))}
            {currencyTotals.length > 1 && currencyTotals.map(([curr, val]) => (
              <div key={curr} className="bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded flex-shrink-0 text-center">
                <div className="text-[10px] font-bold text-gray-700 dark:text-gray-300">{curr}</div>
                <div className="text-[10px] text-blue-700 dark:text-blue-400 whitespace-nowrap">${fmt(val)}</div>
              </div>
            ))}
          </div>
        )}

        {/* Monthly summary */}
        {showSummary && monthlySummary.length > 0 && (
          <div className="border dark:border-gray-600 rounded-lg overflow-x-auto mb-4">
            <table className="min-w-full text-xs">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-3 py-2 text-left text-gray-500 dark:text-gray-400">{t('budget.concept') || 'Concepto'}</th>
                  {MONTHS.map(m => <th key={m} className="px-3 py-2 text-right text-gray-500 dark:text-gray-400">{m}</th>)}
                  <th className="px-3 py-2 text-right text-gray-500 dark:text-gray-400">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                <tr>
                  <td className="px-3 py-1.5 text-gray-700 dark:text-gray-300 font-medium">{t('budget.baseValues') || 'Base'}</td>
                  {monthlySummary.map((ms, i) => <td key={i} className="px-3 py-1.5 text-right text-gray-600 dark:text-gray-400">{fmt(ms.base)}</td>)}
                  <td className="px-3 py-1.5 text-right font-medium text-gray-700 dark:text-gray-300">{fmt(monthlySummary.reduce((s, ms) => s + ms.base, 0))}</td>
                </tr>
                <tr className="bg-green-50/50 dark:bg-green-900/10">
                  <td className="px-3 py-1.5 text-green-700 dark:text-green-400 font-medium">- {t('budget.savings') || 'Ahorros'}</td>
                  {monthlySummary.map((ms, i) => <td key={i} className="px-3 py-1.5 text-right text-green-600 dark:text-green-400">{ms.savings > 0 ? fmt(ms.savings) : '-'}</td>)}
                  <td className="px-3 py-1.5 text-right font-medium text-green-700 dark:text-green-400">{fmt(monthlySummary.reduce((s, ms) => s + ms.savings, 0))}</td>
                </tr>
                <tr className="bg-blue-50/50 dark:bg-blue-900/10">
                  <td className="px-3 py-1.5 text-blue-700 dark:text-blue-400 font-medium">+/- {t('budget.corrections') || 'Correcciones'}</td>
                  {monthlySummary.map((ms, i) => <td key={i} className="px-3 py-1.5 text-right text-blue-600 dark:text-blue-400">{ms.corrections !== 0 ? (ms.corrections > 0 ? '+' : '') + fmt(ms.corrections) : '-'}</td>)}
                  <td className="px-3 py-1.5 text-right font-medium text-blue-700 dark:text-blue-400">{fmt(monthlySummary.reduce((s, ms) => s + ms.corrections, 0))}</td>
                </tr>
                <tr className="bg-gray-100 dark:bg-gray-700 font-bold">
                  <td className="px-3 py-1.5 text-gray-900 dark:text-gray-100">= {t('budget.computedTotal') || 'Total Computado'}</td>
                  {monthlySummary.map((ms, i) => <td key={i} className="px-3 py-1.5 text-right text-gray-900 dark:text-gray-100">{fmt(ms.computed)}</td>)}
                  <td className="px-3 py-1.5 text-right text-gray-900 dark:text-gray-100">{fmt(monthlySummary.reduce((s, ms) => s + ms.computed, 0))}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <ExpenseTable budgetLines={expenseTableLines} viewMode="COMPARISON" filters={filters} readOnly={true} onTotalsChange={setTotals} activeSavings={activeSavings} />
      </div>
    </div>
  );
}
