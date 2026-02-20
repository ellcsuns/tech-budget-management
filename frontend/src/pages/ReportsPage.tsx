import { useState, useEffect } from 'react';
import { budgetApi, budgetLineApi } from '../services/api';
import type { Budget, BudgetLine } from '../types';
import { HiOutlineArrowDownTray } from 'react-icons/hi2';
import { useI18n } from '../contexts/I18nContext';

const MONTHS_KEYS = [1,2,3,4,5,6,7,8,9,10,11,12];
const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'];

export default function ReportsPage() {
  const { t } = useI18n();
  const MONTHS = MONTHS_KEYS.map(m => t(`month.short.${m}`));
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [selectedBudget, setSelectedBudget] = useState<string>('');
  const [budgetLines, setBudgetLines] = useState<BudgetLine[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadBudgets(); }, []);
  useEffect(() => { if (selectedBudget) loadBudgetLines(selectedBudget); }, [selectedBudget]);

  const loadBudgets = async () => {
    try {
      const response = await budgetApi.getAll();
      setBudgets(response.data);
      if (response.data.length > 0) {
        const active = response.data.find((b: any) => b.isActive);
        setSelectedBudget((active || response.data[0]).id);
      }
    } catch (error) { console.error('Error:', error); }
    finally { setLoading(false); }
  };

  const loadBudgetLines = async (budgetId: string) => {
    try {
      setLoading(true);
      const response = await budgetLineApi.getByBudget(budgetId);
      setBudgetLines(response.data);
    } catch (error) { console.error('Error:', error); }
    finally { setLoading(false); }
  };

  // Helper: get plan value for a month from BudgetLine
  const getPlan = (line: BudgetLine, month: number): number => {
    const field = `planM${month}` as keyof BudgetLine;
    return Number(line[field]) || 0;
  };

  // Helper: get monthly values for a budget line
  const getMonthlyValues = (line: BudgetLine) => {
    const values: { month: number; budget: number; committed: number; real: number }[] = [];
    for (let m = 1; m <= 12; m++) {
      const committed = line.transactions?.filter(t => t.month === m && t.type === 'COMMITTED').reduce((s, t) => s + Number(t.transactionValue), 0) || 0;
      const real = line.transactions?.filter(t => t.month === m && t.type === 'REAL').reduce((s, t) => s + Number(t.transactionValue), 0) || 0;
      values.push({ month: m, budget: getPlan(line, m), committed, real });
    }
    return values;
  };

  // Line total plan
  const linePlanTotal = (line: BudgetLine): number => {
    let t = 0; for (let m = 1; m <= 12; m++) t += getPlan(line, m); return t;
  };

  // 1. Budget by Category (pie-like) - group by expense description
  const categoryMap = new Map<string, number>();
  budgetLines.forEach(line => {
    const desc = line.expense?.shortDescription || 'Sin descripción';
    categoryMap.set(desc, (categoryMap.get(desc) || 0) + linePlanTotal(line));
  });
  const categoryData = Array.from(categoryMap.entries()).map(([name, value]) => ({ name, value })).filter(d => d.value > 0).sort((a, b) => b.value - a.value);
  const totalCategory = categoryData.reduce((s, d) => s + d.value, 0);

  // 2. Budget vs Committed vs Real totals
  const totalBudget = budgetLines.reduce((s, l) => s + linePlanTotal(l), 0);
  const totalCommitted = budgetLines.reduce((s, l) => s + (l.transactions?.filter(t => t.type === 'COMMITTED').reduce((ss, t) => ss + Number(t.transactionValue), 0) || 0), 0);
  const totalReal = budgetLines.reduce((s, l) => s + (l.transactions?.filter(t => t.type === 'REAL').reduce((ss, t) => ss + Number(t.transactionValue), 0) || 0), 0);
  const maxBVR = Math.max(totalBudget, totalCommitted, totalReal, 1);

  // 3. Monthly budget trend
  const monthlyBudget = MONTHS.map((_, i) => budgetLines.reduce((s, l) => s + getPlan(l, i + 1), 0));
  const maxMonthlyBudget = Math.max(...monthlyBudget, 1);

  // 4. Monthly committed trend
  const monthlyCommitted = MONTHS.map((_, i) => budgetLines.reduce((s, l) =>
    s + (l.transactions?.filter(t => t.month === i + 1 && t.type === 'COMMITTED').reduce((ss, t) => ss + Number(t.transactionValue), 0) || 0), 0));
  const maxMonthlyCommitted = Math.max(...monthlyCommitted, 1);

  // 5. Monthly real trend
  const monthlyReal = MONTHS.map((_, i) => budgetLines.reduce((s, l) =>
    s + (l.transactions?.filter(t => t.month === i + 1 && t.type === 'REAL').reduce((ss, t) => ss + Number(t.transactionValue), 0) || 0), 0));
  const maxMonthlyReal = Math.max(...monthlyReal, 1);

  // 6. Budget by user area
  const areaMap = new Map<string, number>();
  budgetLines.forEach(l => {
    const total = linePlanTotal(l);
    (l.expense?.userAreas || []).forEach(a => areaMap.set(a, (areaMap.get(a) || 0) + total));
  });
  const areaData = Array.from(areaMap.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  const maxArea = Math.max(...areaData.map(d => d.value), 1);

  // 7. Execution % by expense code (committed+real / budget)
  const execMap = new Map<string, { budget: number; executed: number }>();
  budgetLines.forEach(l => {
    const code = l.expense?.code || l.id;
    const prev = execMap.get(code) || { budget: 0, executed: 0 };
    prev.budget += linePlanTotal(l);
    prev.executed += l.transactions?.reduce((s, t) => s + Number(t.transactionValue), 0) || 0;
    execMap.set(code, prev);
  });
  const executionData = Array.from(execMap.entries()).map(([name, d]) => ({
    name, pct: d.budget > 0 ? (d.executed / d.budget) * 100 : 0
  })).filter(d => d.pct > 0).sort((a, b) => b.pct - a.pct).slice(0, 10);

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
  const savingsMap = new Map<string, { budget: number; spent: number }>();
  budgetLines.forEach(l => {
    const code = l.expense?.code || l.id;
    const prev = savingsMap.get(code) || { budget: 0, spent: 0 };
    prev.budget += linePlanTotal(l);
    prev.spent += l.transactions?.reduce((s, t) => s + Number(t.transactionValue), 0) || 0;
    savingsMap.set(code, prev);
  });
  const savingsData = Array.from(savingsMap.entries()).map(([name, d]) => ({
    name, value: Math.max(d.budget - d.spent, 0)
  })).filter(d => d.value > 0).sort((a, b) => b.value - a.value).slice(0, 10);
  const maxSavings = Math.max(...savingsData.map(d => d.value), 1);

  // Excel export
  const exportToExcel = () => {
    const rows: string[][] = [];
    rows.push(['Código', 'Descripción', 'Empresa', ...MONTHS.map(m => `Ppto ${m}`), 'Total Ppto',
      ...MONTHS.map(m => `Comp ${m}`), 'Total Comp', ...MONTHS.map(m => `Real ${m}`), 'Total Real', 'Diferencia']);

    budgetLines.forEach(l => {
      const mv = getMonthlyValues(l);
      const tBudget = mv.reduce((s, v) => s + v.budget, 0);
      const tComm = mv.reduce((s, v) => s + v.committed, 0);
      const tReal = mv.reduce((s, v) => s + v.real, 0);
      rows.push([
        l.expense?.code || '', l.expense?.shortDescription || '', l.financialCompany?.name || '',
        ...mv.map(v => v.budget.toString()), tBudget.toString(),
        ...mv.map(v => v.committed.toString()), tComm.toString(),
        ...mv.map(v => v.real.toString()), tReal.toString(),
        (tBudget - tComm - tReal).toString()
      ]);
    });

    rows.push(['TOTAL', '', '',
      ...MONTHS.map((_, i) => monthlyBudget[i].toString()), totalBudget.toString(),
      ...MONTHS.map((_, i) => monthlyCommitted[i].toString()), totalCommitted.toString(),
      ...MONTHS.map((_, i) => monthlyReal[i].toString()), totalReal.toString(),
      (totalBudget - totalCommitted - totalReal).toString()
    ]);

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

  if (loading && !selectedBudget) return <div className="flex justify-center items-center h-64"><div className="text-lg text-gray-600">{t('msg.loading')}</div></div>;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <div />
          <button onClick={exportToExcel} className="btn-success flex items-center gap-2">
            <HiOutlineArrowDownTray className="w-5 h-5" /> {t('report.exportExcel')}
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
        <div className="bg-white rounded-lg shadow p-4"><p className="text-sm text-gray-500">{t('report.totalBudget')}</p><p className="text-xl font-bold text-blue-600">${totalBudget.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p></div>
        <div className="bg-white rounded-lg shadow p-4"><p className="text-sm text-gray-500">{t('report.committed')}</p><p className="text-xl font-bold text-yellow-600">${totalCommitted.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p></div>
        <div className="bg-white rounded-lg shadow p-4"><p className="text-sm text-gray-500">{t('report.real')}</p><p className="text-xl font-bold text-green-600">${totalReal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p></div>
        <div className="bg-white rounded-lg shadow p-4"><p className="text-sm text-gray-500">{t('report.available')}</p><p className="text-xl font-bold text-purple-600">${(totalBudget - totalCommitted - totalReal).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p></div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* 1. Pie: Budget by Category */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold mb-4">{t('report.chart1')}</h3>
          {categoryData.length === 0 ? <p className="text-gray-500 text-center py-8">{t('report.noData')}</p> : (
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
          <h3 className="text-lg font-bold mb-4">{t('report.chart2')}</h3>
          <HBar label={t('report.legendBudget')} value={totalBudget} max={maxBVR} color="#3B82F6" />
          <HBar label={t('report.committed')} value={totalCommitted} max={maxBVR} color="#F59E0B" />
          <HBar label={t('report.real')} value={totalReal} max={maxBVR} color="#10B981" />
        </div>

        {/* 3. Vertical: Monthly Budget */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold mb-4">{t('report.chart3')}</h3>
          <VBarChart data={MONTHS.map((m, i) => ({ label: m, value: monthlyBudget[i] }))} max={maxMonthlyBudget} colors={Array(12).fill('#3B82F6')} />
        </div>

        {/* 4. Vertical: Monthly Committed */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold mb-4">{t('report.chart4')}</h3>
          <VBarChart data={MONTHS.map((m, i) => ({ label: m, value: monthlyCommitted[i] }))} max={maxMonthlyCommitted} colors={Array(12).fill('#F59E0B')} />
        </div>

        {/* 5. Vertical: Monthly Real */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold mb-4">{t('report.chart5')}</h3>
          <VBarChart data={MONTHS.map((m, i) => ({ label: m, value: monthlyReal[i] }))} max={maxMonthlyReal} colors={Array(12).fill('#10B981')} />
        </div>

        {/* 6. Bar: By User Area */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold mb-4">{t('report.chart6')}</h3>
          {areaData.length === 0 ? <p className="text-gray-500 text-center py-8">{t('report.noData')}</p> :
            areaData.map((item, idx) => <HBar key={idx} label={item.name} value={item.value} max={maxArea} color={COLORS[idx % COLORS.length]} />)}
        </div>

        {/* 7. Bar: Execution % */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold mb-4">{t('report.chart7')}</h3>
          {executionData.length === 0 ? <p className="text-gray-500 text-center py-8">{t('report.noData')}</p> :
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
          <h3 className="text-lg font-bold mb-4">{t('report.chart8')}</h3>
          {top10.map((item, idx) => <HBar key={idx} label={item.name} value={item.value} max={maxTop10} color={COLORS[idx % COLORS.length]} />)}
        </div>

        {/* 9. Vertical: Monthly Budget vs Executed */}
        <div className="bg-white rounded-lg shadow p-6 col-span-2">
          <h3 className="text-lg font-bold mb-4">{t('report.chart9')}</h3>
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
            <span className="flex items-center gap-1 text-sm"><span className="w-3 h-3 bg-blue-400 rounded" /> {t('report.legendBudget')}</span>
            <span className="flex items-center gap-1 text-sm"><span className="w-3 h-3 bg-green-400 rounded" /> {t('report.legendExecuted')}</span>
          </div>
        </div>

        {/* 10. Bar: Savings Potential */}
        <div className="bg-white rounded-lg shadow p-6 col-span-2">
          <h3 className="text-lg font-bold mb-4">{t('report.chart10')}</h3>
          {savingsData.length === 0 ? <p className="text-gray-500 text-center py-8">{t('report.noData')}</p> :
            <div className="grid grid-cols-2 gap-x-6">
              {savingsData.map((item, idx) => <HBar key={idx} label={item.name} value={item.value} max={maxSavings} color={COLORS[idx % COLORS.length]} />)}
            </div>}
        </div>
      </div>
    </div>
  );
}
