import { useState, useEffect } from 'react';
import { budgetApi } from '../services/api';
import { classifyExpenses, calculateSummary, getDifferenceColor, generateDifferenceDescription } from '../utils/budgetComparison';
import type { ComparisonRow, ComparisonSummary } from '../utils/budgetComparison';
import type { Budget } from '../types';
import { showToast } from '../components/Toast';

export default function BudgetComparePage() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [yearA, setYearA] = useState<number>(0);
  const [yearB, setYearB] = useState<number>(0);
  const [budgetAId, setBudgetAId] = useState('');
  const [budgetBId, setBudgetBId] = useState('');
  const [rows, setRows] = useState<ComparisonRow[]>([]);
  const [summary, setSummary] = useState<ComparisonSummary | null>(null);
  const [budgetAData, setBudgetAData] = useState<any>(null);
  const [budgetBData, setBudgetBData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showDescription, setShowDescription] = useState(false);

  useEffect(() => {
    budgetApi.getAll().then(res => {
      setBudgets(res.data);
      const allYears = [...new Set(res.data.map((b: Budget) => b.year))].sort((a, b) => b - a);
      if (allYears.length > 0) {
        setYearA(allYears[0]);
        setYearB(allYears[0]);
      }
    });
  }, []);

  const years = [...new Set(budgets.map(b => b.year))].sort((a, b) => b - a);
  const budgetsForYearA = budgets.filter(b => b.year === yearA);
  const budgetsForYearB = budgets.filter(b => b.year === yearB);

  const compare = async () => {
    if (!budgetAId || !budgetBId) return;
    setLoading(true);
    try {
      const res = await budgetApi.compare(budgetAId, budgetBId);
      const { budgetA, budgetB } = res.data;
      setBudgetAData(budgetA);
      setBudgetBData(budgetB);
      const compRows = classifyExpenses(budgetA, budgetB);
      setRows(compRows);
      setSummary(calculateSummary(compRows));
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Error al comparar', 'error');
    } finally { setLoading(false); }
  };

  const statusLabel = (s: string) => {
    if (s === 'new') return <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">Nuevo</span>;
    if (s === 'removed') return <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs">Eliminado</span>;
    if (s === 'modified') return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs">Modificado</span>;
    return <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">Sin cambios</span>;
  };

  return (
    <div className="space-y-6">

      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-600 uppercase">Presupuesto A</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Año</label>
                <select value={yearA} onChange={e => { setYearA(Number(e.target.value)); setBudgetAId(''); }}
                  className="w-full px-3 py-2 border rounded-lg">
                  {years.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Versión</label>
                <select value={budgetAId} onChange={e => setBudgetAId(e.target.value)} className="w-full px-3 py-2 border rounded-lg">
                  <option value="">Seleccionar...</option>
                  {budgetsForYearA.map(b => <option key={b.id} value={b.id}>{b.version}{b.isActive ? ' (vigente)' : ''}</option>)}
                </select>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-600 uppercase">Presupuesto B</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Año</label>
                <select value={yearB} onChange={e => { setYearB(Number(e.target.value)); setBudgetBId(''); }}
                  className="w-full px-3 py-2 border rounded-lg">
                  {years.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Versión</label>
                <select value={budgetBId} onChange={e => setBudgetBId(e.target.value)} className="w-full px-3 py-2 border rounded-lg">
                  <option value="">Seleccionar...</option>
                  {budgetsForYearB.filter(b => b.id !== budgetAId).map(b => <option key={b.id} value={b.id}>{b.version}{b.isActive ? ' (vigente)' : ''}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-4">
          <button onClick={compare} disabled={!budgetAId || !budgetBId || loading}
            className="btn-primary disabled:opacity-50 w-full">
            {loading ? 'Comparando...' : 'Comparar'}
          </button>
        </div>
      </div>

      {summary && (
        <>
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow p-4 text-center">
              <p className="text-sm text-gray-500">Total {budgetAData?.version}</p>
              <p className="text-2xl font-bold">${summary.totalA.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4 text-center">
              <p className="text-sm text-gray-500">Total {budgetBData?.version}</p>
              <p className="text-2xl font-bold">${summary.totalB.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
            <div className={`bg-white rounded-lg shadow p-4 text-center ${summary.difference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              <p className="text-sm text-gray-500">Diferencia</p>
              <p className="text-2xl font-bold">{summary.difference >= 0 ? '+' : ''}${summary.difference.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              <p className="text-sm">({summary.percentChange.toFixed(1)}%)</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4 text-center">
              <p className="text-sm text-gray-500">Cambios</p>
              <div className="flex justify-center gap-3 mt-1">
                <span className="text-green-600 text-sm">+{summary.newExpenses}</span>
                <span className="text-red-600 text-sm">-{summary.removedExpenses}</span>
                <span className="text-yellow-600 text-sm">~{summary.modifiedExpenses}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={() => setShowDescription(!showDescription)}
              className="btn-secondary text-sm">
              {showDescription ? 'Ocultar' : 'Ver'} Descripción Detallada
            </button>
          </div>

          {showDescription && (
            <div className="bg-white rounded-lg shadow p-6">
              <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono">
                {generateDifferenceDescription(rows, budgetAData, budgetBData)}
              </pre>
            </div>
          )}

          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="p-3 text-left">Estado</th>
                  <th className="p-3 text-left">Código</th>
                  <th className="p-3 text-left">Descripción</th>
                  <th className="p-3 text-right">Total A</th>
                  <th className="p-3 text-right">Total B</th>
                  <th className="p-3 text-right">Diferencia</th>
                  <th className="p-3 text-right">%</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(r => (
                  <tr key={r.expenseCode} className="border-b hover:bg-gray-50">
                    <td className="p-3">{statusLabel(r.status)}</td>
                    <td className="p-3 font-mono">{r.expenseCode}</td>
                    <td className="p-3">{r.expenseDescription}</td>
                    <td className="p-3 text-right">${r.totalA.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td className="p-3 text-right">${r.totalB.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td className={`p-3 text-right ${getDifferenceColor(r.difference)}`}>
                      {r.difference >= 0 ? '+' : ''}${r.difference.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className={`p-3 text-right ${getDifferenceColor(r.percentChange)}`}>
                      {r.percentChange.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
