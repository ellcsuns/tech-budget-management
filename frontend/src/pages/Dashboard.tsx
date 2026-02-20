import { useState, useEffect, useMemo } from 'react';
import { budgetApi, savingsApi } from '../services/api';
import type { BudgetLine, Saving, CompanyTotals } from '../types';
import ExpenseTable from '../components/ExpenseTable';
import FilterPanel from '../components/FilterPanel';
import { fmt } from '../utils/formatters';

export default function Dashboard() {
  const [budgetLines, setBudgetLines] = useState<BudgetLine[]>([]);
  const [activeSavings, setActiveSavings] = useState<Saving[]>([]);
  const [loading, setLoading] = useState(true);
  const [noBudget, setNoBudget] = useState(false);
  const [totals, setTotals] = useState({ budget: 0, committed: 0, real: 0, diff: 0 });
  const [filters, setFilters] = useState({
    currencies: undefined as string[] | undefined,
    financialCompanyIds: undefined as string[] | undefined,
    categories: undefined as string[] | undefined,
    searchText: '',
    visibleColumns: { budget: true, committed: true, real: true }
  });

  useEffect(() => { loadActiveBudget(); }, []);

  const loadActiveBudget = async () => {
    try {
      const response = await budgetApi.getActive();
      const budget = response.data;
      setBudgetLines(budget.budgetLines || []);
      // Load active savings for this budget
      try {
        const savingsRes = await savingsApi.getAll({ budgetId: budget.id, status: 'ACTIVE' });
        setActiveSavings(savingsRes.data);
      } catch { setActiveSavings([]); }
    } catch (error) {
      console.error('Error loading active budget:', error);
      setNoBudget(true);
    } finally {
      setLoading(false);
    }
  };

  // Filter budget lines
  const filteredLines = useMemo(() => {
    return budgetLines.filter(bl => {
      if (filters.currencies && !filters.currencies.includes(bl.currency)) return false;
      if (filters.financialCompanyIds && !filters.financialCompanyIds.includes(bl.financialCompanyId)) return false;
      if (filters.categories) {
        const catId = (bl.expense as any)?.categoryId;
        if (!catId || !filters.categories.includes(catId)) return false;
      }
      if (filters.searchText) {
        const searchTerms = filters.searchText.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
        if (searchTerms.length > 0) {
          const code = bl.expense?.code?.toLowerCase() || '';
          const desc = bl.expense?.shortDescription?.toLowerCase() || '';
          const catName = (bl.expense as any)?.category?.name?.toLowerCase() || '';
          const matchesAny = searchTerms.some(term => code.includes(term) || desc.includes(term) || catName.includes(term));
          if (!matchesAny) return false;
        }
      }
      return true;
    });
  }, [budgetLines, filters]);

  // Company totals
  const companyTotals = useMemo<CompanyTotals[]>(() => {
    const map = new Map<string, CompanyTotals>();
    filteredLines.forEach(bl => {
      const cid = bl.financialCompanyId;
      if (!map.has(cid)) {
        map.set(cid, {
          companyId: cid,
          companyCode: bl.financialCompany?.code || cid,
          companyName: bl.financialCompany?.name || '',
          budget: 0, committed: 0, real: 0, diff: 0
        });
      }
      const ct = map.get(cid)!;
      let planTotal = 0;
      for (let m = 1; m <= 12; m++) {
        const planKey = `planM${m}` as keyof BudgetLine;
        planTotal += Number(bl[planKey]) || 0;
      }
      // Subtract active savings
      const lineSavings = activeSavings.filter(s => s.budgetLineId === bl.id);
      let savingTotal = 0;
      lineSavings.forEach(s => {
        for (let m = 1; m <= 12; m++) {
          savingTotal += Number((s as any)[`savingM${m}`]) || 0;
        }
      });
      ct.budget += planTotal - savingTotal;

      let committed = 0, real = 0;
      (bl.transactions || []).forEach(t => {
        if (t.type === 'COMMITTED') committed += Number(t.transactionValue) || 0;
        else if (t.type === 'REAL') real += Number(t.transactionValue) || 0;
      });
      ct.committed += committed;
      ct.real += real;
      ct.diff = ct.budget - ct.committed - ct.real;
    });
    return Array.from(map.values());
  }, [filteredLines, activeSavings]);

  const getDiffColor = () => totals.diff === 0 ? 'text-gray-500' : totals.diff > 0 ? 'text-green-700' : 'text-red-700';
  const getDiffBg = () => totals.diff === 0 ? 'bg-gray-50' : totals.diff > 0 ? 'bg-green-50' : 'bg-red-50';

  if (loading) return <div className="flex justify-center items-center h-64"><div className="text-lg text-gray-600">Cargando...</div></div>;
  if (noBudget) return <div className="flex justify-center items-center h-64"><div className="text-lg text-amber-600">No hay presupuesto vigente configurado. Configure uno en la sección de Configuración.</div></div>;

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow p-4">
        <FilterPanel budgetLines={budgetLines} filters={filters} onFiltersChange={setFilters} />
        <div className="flex gap-4 flex-wrap mb-4">
          <div className="bg-blue-50 px-4 py-2 rounded-lg">
            <span className="text-xs text-gray-500">Presupuesto</span>
            <p className="text-sm font-bold text-blue-800">${fmt(totals.budget)}</p>
          </div>
          <div className="bg-indigo-50 px-4 py-2 rounded-lg">
            <span className="text-xs text-gray-500">Comprometido</span>
            <p className="text-sm font-bold text-indigo-800">${fmt(totals.committed)}</p>
          </div>
          <div className="bg-emerald-50 px-4 py-2 rounded-lg">
            <span className="text-xs text-gray-500">Real</span>
            <p className="text-sm font-bold text-emerald-800">${fmt(totals.real)}</p>
          </div>
          <div className={`${getDiffBg()} px-4 py-2 rounded-lg`}>
            <span className="text-xs text-gray-500">Diferencia</span>
            <p className={`text-sm font-bold ${getDiffColor()}`}>${fmt(totals.diff)}</p>
          </div>
        </div>
        {companyTotals.length > 1 && (
          <div className="border-t pt-3">
            <p className="text-xs text-gray-500 mb-2">Totales por Compañía</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {companyTotals.map(ct => (
                <div key={ct.companyId} className="bg-gray-50 px-3 py-2 rounded" title={ct.companyName}>
                  <span className="text-xs font-semibold text-gray-700">{ct.companyCode}</span>
                  <div className="flex gap-2 text-xs mt-1">
                    <span className="text-blue-700">P: ${fmt(ct.budget)}</span>
                    <span className="text-indigo-700">C: ${fmt(ct.committed)}</span>
                    <span className="text-emerald-700">R: ${fmt(ct.real)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <ExpenseTable
          budgetLines={filteredLines}
          viewMode="COMPARISON"
          filters={filters}
          readOnly={true}
          onTotalsChange={setTotals}
          activeSavings={activeSavings}
        />
      </div>
    </div>
  );
}
