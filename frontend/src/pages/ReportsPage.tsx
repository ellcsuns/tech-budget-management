import { useState, useEffect } from 'react';
import { budgetApi, expenseApi } from '../services/api';
import type { Budget, Expense } from '../types';
import { HiOutlineArrowDownTray } from 'react-icons/hi2';

const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'];

export default function ReportsPage() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [selectedBudget, setSelectedBudget] = useState<string>('');
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadBudgets(); }, []);
  useEffect(() => { if (selectedBudget) loadExpenses(selectedBudget); }, [selectedBudget]);

  const loadBudgets = async () => {
    try {
      const response = await budgetApi.getAll();
      setBudgets(response.data);
      if (response.data.length > 0) setSelectedBudget(response.data[response.data.length - 1].id);
    } catch (error) { console.error('Error:', error); }
    finally { setLoading(false); }
  };

  const loadExpenses = async (budgetId: string) => {
    try {
      setLoading(true);
      const response = await expenseApi.getByBudget(budgetId);
      setExpenses(response.data);
    } catch (error) { console.error('Error:', error); }
    finally { setLoading(false); }
  };

  // Helper: get monthly values for an expense
  const getMonthlyValues = (expense: Expense) => {
    const values: { month: number; budget: number; committed: number; real: number }[] = [];
    for (let m = 1; m <= 12; m++) {
      const pv = expense.planValues?.find(p => p.month === m);
      const committed = expense.transactions?.filter(t => t.month === m && t.type === 'COMMITTED').reduce((s, t) => s + Number(t.transactionValue), 0) || 0;
      const real = expense.transactions?.filter(t => t.month === m && t.type === 'REAL').reduce((s, t) => s + Number(t.transactionValue), 0) || 0;
      values.push({ month: m, budget: pv ? Number(pv.transactionValue) : 0, committed, real });
    }
    return values;
  };

  // 1. Budget by Category (pie-like)
  const categoryData = expenses.map(e => ({
    name: e.shortDescription,
    value: e.planValues?.reduce((s, pv) => s + Number(pv.transactionValue), 0) || 0
  })).filter(d => d.value > 0).sort((a, b) => b.value - a.value);
  const totalCategory = categoryData.reduce((s, d) => s + d.value, 0);

  // 2. Budget vs Committed vs Real totals
  const totalBudget = expenses.reduce((s, e) => s + (e.planValues?.reduce((ss, pv) => ss + Number(pv.transactionValue), 0) || 0), 0);
  const totalCommitted = expenses.reduce((s, e) => s + (e.transactions?.filter(t => t.type === 'COMMITTED').reduce((ss, t) => ss + Number(t.transactionValue), 0) || 0), 0);
  const totalReal = expenses.reduce((s, e) => s + (e.transactions?.filter(t => t.type === 'REAL').reduce((ss, t) => ss + Number(t.transactionValue), 0) || 0), 0);
  const maxBVR = Math.max(totalBudget, totalCommitted, totalReal, 1);

  // 3. Monthly budget trend
  const monthlyBudget = MONTHS.map((_, i) => expenses.reduce((s, e) => {
    const pv = e.planValues?.find(p => p.month === i + 1);
    return s + (pv ? Number(pv.transactionValue) : 0);
  }, 0));
  const maxMonthlyBudget = Math.max(...monthlyBudget, 1);

  // 4. Monthly committed trend
  const monthlyCommitted = MONTHS.map((_, i) => expenses.reduce((s, e) =>
    s + (e.transactions?.filter(t => t.month === i + 1 && t.type === 'COMMITTED').reduce((ss, t) => ss + Number(t.transactionValue), 0) || 0), 0));
  const maxMonthlyCommitted = Math.max(...monthlyCommitted, 1);

  // 5. Monthly real trend
  const monthlyReal = MONTHS.map((_, i) => expenses.reduce((s, e) =>
    s + (e.transactions?.filter(t => t.month === i + 1 && t.type === 'REAL').reduce((ss, t) => ss + Number(t.transactionValue), 0) || 0), 0));
  const maxMonthlyReal = Math.max(...monthlyReal, 1);

  // 6. Budget by user area
  const areaMap = new Map<string, number>();
  expenses.forEach(e => {
    const total = e.planValues?.reduce((s, pv) => s + Number(pv.transactionValue), 0) || 0;
    (e.userAreas || []).forEach(a => areaMap.set(a, (areaMap.get(a) || 0) + total));
  });
  const areaData = Array.from(areaMap.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  const maxArea = Math.max(...areaData.map(d => d.value), 1);

  // 7. Execution % by expense (committed+real / budget)
  const executionData = expenses.map(e => {
    const budget = e.planValues?.reduce((s, pv) => s + Number(pv.transactionValue), 0) || 0;
    const executed = (e.transactions?.reduce((s, t) => s + Number(t.transactionValue), 0) || 0);
    return { name: e.code, pct: budget > 0 ? (executed / budget) * 100 : 0 };
  }).filter(d => d.pct > 0).sort((a, b) => b.pct - a.pct).slice(0, 10);

  // 8. Top 10 expenses by budget
  const top10 = [...categoryData].slice(0, 10);
  const maxTop10 = Math.max(...top10.map(d => d.value), 1);

  // 9. Monthly comparison (budget vs committed+real)
  const monthlyComparison = MONTHS.map((_, i) => ({
    budget: monthlyBudget[i],
    executed: monthlyCommitted[i] + monthlyReal[i]
  }));
  const maxComparison = Math.max(...monthlyComparison.map(d => Math.max(d.budget, d.executed)), 1);

  // 10. Savings potential (budget - committed - real, positive only)
  const savingsData = expenses.map(e => {
    const budget = e.planValues?.reduce((s, pv) => s + Number(pv.transactionValue), 0) || 0;
    const spent = e.transactions?.reduce((s, t) => s + Number(t.transactionValue), 0) || 0;
    return { name: e.code, value: Math.max(budget - spent, 0) };
  }).filter(d => d.value > 0).sort((a, b) => b.value - a.value).slice(0, 10);
  const maxSavings = Math.max(...savingsData.map(d => d.value), 1);

  // Excel export
  const exportToExcel = () => {
    const rows: string[][] = [];
    // Header
    rows.push(['Código', 'Descripción', 'Empresa', ...MONTHS.map(m => `Ppto ${m}`), 'Total Ppto',
      ...MONTHS.map(m => `Comp ${m}`), 'Total Comp', ...MONTHS.map(m => `Real ${m}`), 'Total Real', 'Diferencia']);

    expenses.forEach(e => {
      const mv = getMonthlyValues(e);
      const tBudget = mv.reduce((s, v) => s + v.budget, 0);
      const tComm = mv.reduce((s, v) => s + v.committed, 0);
      const tReal = mv.reduce((s, v) => s + v.real, 0);
      rows.push([
        e.code, e.shortDescription, e.financialCompany?.name || '',
        ...mv.map(v => v.budget.toString()), tBudget.toString(),
        ...mv.map(v => v.committed.toString()), tComm.toString(),
        ...mv.map(v => v.real.toString()), tReal.toString(),
        (tBudget - tComm - tReal).toString()
      ]);
    });

    // Totals row
    rows.push(['TOTAL', '', '',
      ...MONTHS.map((_, i) => monthlyBudget[i].toString()), totalBudget.toString(),
      ...MONTHS.map((_, i) => monthlyCommitted[i].toString()), totalCommitted.toString(),
      ...MONTHS.map((_, i) => monthlyReal[i].toString()), totalReal.toString(),
      (totalBudget - totalCommitted - totalReal).toString()
    ]);

    // Convert to CSV with BOM for Excel
    const csv = '\uFEFF' + rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte_presupuesto_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Bar chart component
  const HBar = ({ label, value, max, color, showValue = true }: { label: string; value: number; max: number; color: string; showValue?: boolean }) => (
    <div className="mb-2">
      <div className="flex justify-between text-sm mb-1">
        <span className="truncate max-w-[200px]">{label}</span>
        {showValue && <span className="text-gray-600 ml-2">${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>}
      </div>
      <div className="w-full bg-gray-200 rounded-full h-5">
        <div className="h-5 rounded-full transition-all" style={{ width: `${Math.max((value / max) * 100, 2)}%`, backgroundColor: color }} />
      </div>
    </div>
  );

  // Vertical bar chart
  const VBarChart = ({ data, max, colors }: { data: { label: string; value: number }[]; max: number; colors?: string[] }) => (
    <div className="flex items-end gap-2 h-48">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center">
          <span className="text-xs text-gray-600 mb-1">{d.value > 0 ? (d.value / 1000).toFixed(0) + 'k' : ''}</span>
          <div className="w-full rounded-t" style={{ height: `${Math.max((d.value / max) * 100, 2)}%`, backgroundColor: colors ? colors[i % colors.length] : COLORS[i % COLORS.length], minHeight: '4px' }} />
          <span className="text-xs text-gray-500 mt-1">{d.label}</span>
        </div>
      ))}
    </div>
  );

  if (loading && !selectedBudget) return <div className="flex justify-center items-center h-64"><div className="text-lg text-gray-600">Cargando...</div></div>;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Reportes</h2>
          <button onClick={exportToExcel} className="btn-success flex items-center gap-2">
            <HiOutlineArrowDownTray className="w-5 h-5" /> Exportar Excel
          </button>
        </div>
        <div className="max-w-md">
          <select value={selectedBudget} onChange={(e) => setSelectedBudget(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md">
            {budgets.map(b => (<option key={b.id} value={b.id}>{b.year} - {b.version}</option>))}
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4"><p className="text-sm text-gray-500">Presupuesto Total</p><p className="text-xl font-bold text-blue-600">${totalBudget.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p></div>
        <div className="bg-white rounded-lg shadow p-4"><p className="text-sm text-gray-500">Comprometido</p><p className="text-xl font-bold text-yellow-600">${totalCommitted.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p></div>
        <div className="bg-white rounded-lg shadow p-4"><p className="text-sm text-gray-500">Real</p><p className="text-xl font-bold text-green-600">${totalReal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p></div>
        <div className="bg-white rounded-lg shadow p-4"><p className="text-sm text-gray-500">Disponible</p><p className="text-xl font-bold text-purple-600">${(totalBudget - totalCommitted - totalReal).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p></div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* 1. Pie: Budget by Category */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold mb-4">1. Presupuesto por Categoría</h3>
          {categoryData.length === 0 ? <p className="text-gray-500 text-center py-8">Sin datos</p> : (
            <div className="space-y-2">
              {categoryData.slice(0, 8).map((item, idx) => {
                const pct = totalCategory > 0 ? ((item.value / totalCategory) * 100).toFixed(1) : '0';
                return (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between text-sm"><span className="truncate">{item.name}</span><span className="font-medium ml-2">{pct}%</span></div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-1"><div className="h-2 rounded-full" style={{ width: `${pct}%`, backgroundColor: COLORS[idx % COLORS.length] }} /></div>
                    </div>
                    <span className="text-sm text-gray-600 flex-shrink-0">${item.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 2. Bar: Budget vs Committed vs Real */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold mb-4">2. Presupuesto vs Comprometido vs Real</h3>
          <HBar label="Presupuesto" value={totalBudget} max={maxBVR} color="#3B82F6" />
          <HBar label="Comprometido" value={totalCommitted} max={maxBVR} color="#F59E0B" />
          <HBar label="Real" value={totalReal} max={maxBVR} color="#10B981" />
        </div>

        {/* 3. Vertical: Monthly Budget */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold mb-4">3. Presupuesto Mensual</h3>
          <VBarChart data={MONTHS.map((m, i) => ({ label: m, value: monthlyBudget[i] }))} max={maxMonthlyBudget} colors={Array(12).fill('#3B82F6')} />
        </div>

        {/* 4. Vertical: Monthly Committed */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold mb-4">4. Comprometido Mensual</h3>
          <VBarChart data={MONTHS.map((m, i) => ({ label: m, value: monthlyCommitted[i] }))} max={maxMonthlyCommitted} colors={Array(12).fill('#F59E0B')} />
        </div>

        {/* 5. Vertical: Monthly Real */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold mb-4">5. Real Mensual</h3>
          <VBarChart data={MONTHS.map((m, i) => ({ label: m, value: monthlyReal[i] }))} max={maxMonthlyReal} colors={Array(12).fill('#10B981')} />
        </div>

        {/* 6. Bar: By User Area */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold mb-4">6. Presupuesto por Área</h3>
          {areaData.length === 0 ? <p className="text-gray-500 text-center py-8">Sin datos</p> :
            areaData.map((item, idx) => <HBar key={idx} label={item.name} value={item.value} max={maxArea} color={COLORS[idx % COLORS.length]} />)}
        </div>

        {/* 7. Bar: Execution % */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold mb-4">7. % Ejecución por Gasto</h3>
          {executionData.length === 0 ? <p className="text-gray-500 text-center py-8">Sin datos</p> :
            executionData.map((item, idx) => (
              <div key={idx} className="mb-2">
                <div className="flex justify-between text-sm mb-1"><span>{item.name}</span><span className={item.pct > 100 ? 'text-red-600 font-bold' : 'text-gray-600'}>{item.pct.toFixed(1)}%</span></div>
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div className="h-4 rounded-full" style={{ width: `${Math.min(item.pct, 100)}%`, backgroundColor: item.pct > 100 ? '#EF4444' : item.pct > 80 ? '#F59E0B' : '#10B981' }} />
                </div>
              </div>
            ))}
        </div>

        {/* 8. Bar: Top 10 Expenses */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold mb-4">8. Top 10 Gastos</h3>
          {top10.map((item, idx) => <HBar key={idx} label={item.name} value={item.value} max={maxTop10} color={COLORS[idx % COLORS.length]} />)}
        </div>

        {/* 9. Vertical: Monthly Budget vs Executed */}
        <div className="bg-white rounded-lg shadow p-6 col-span-2">
          <h3 className="text-lg font-bold mb-4">9. Presupuesto vs Ejecutado Mensual</h3>
          <div className="flex items-end gap-1 h-48">
            {MONTHS.map((_m, i) => (
              <div key={i} className="flex-1 flex gap-0.5">
                <div className="flex-1 flex flex-col items-center">
                  <div className="w-full rounded-t bg-blue-400" style={{ height: `${Math.max((monthlyComparison[i].budget / maxComparison) * 100, 2)}%`, minHeight: '4px' }} />
                </div>
                <div className="flex-1 flex flex-col items-center">
                  <div className="w-full rounded-t bg-green-400" style={{ height: `${Math.max((monthlyComparison[i].executed / maxComparison) * 100, 2)}%`, minHeight: '4px' }} />
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-1 mt-1">{MONTHS.map((m, i) => <div key={i} className="flex-1 text-center text-xs text-gray-500">{m}</div>)}</div>
          <div className="flex gap-4 mt-3 justify-center">
            <span className="flex items-center gap-1 text-sm"><span className="w-3 h-3 bg-blue-400 rounded" /> Presupuesto</span>
            <span className="flex items-center gap-1 text-sm"><span className="w-3 h-3 bg-green-400 rounded" /> Ejecutado</span>
          </div>
        </div>

        {/* 10. Bar: Savings Potential */}
        <div className="bg-white rounded-lg shadow p-6 col-span-2">
          <h3 className="text-lg font-bold mb-4">10. Potencial de Ahorro por Gasto</h3>
          {savingsData.length === 0 ? <p className="text-gray-500 text-center py-8">Sin datos</p> :
            <div className="grid grid-cols-2 gap-x-6">
              {savingsData.map((item, idx) => <HBar key={idx} label={item.name} value={item.value} max={maxSavings} color={COLORS[idx % COLORS.length]} />)}
            </div>}
        </div>
      </div>
    </div>
  );
}
