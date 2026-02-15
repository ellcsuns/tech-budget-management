import { useState, useEffect } from 'react';
import { budgetApi, expenseApi } from '../services/api';
import type { Budget, Expense } from '../types';

interface ChartData {
  name: string;
  value: number;
  budget?: number;
  real?: number;
  committed?: number;
}

export default function ReportsPage() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [selectedBudget, setSelectedBudget] = useState<string>('');
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBudgets();
  }, []);

  useEffect(() => {
    if (selectedBudget) {
      loadExpenses(selectedBudget);
    }
  }, [selectedBudget]);

  const loadBudgets = async () => {
    try {
      const response = await budgetApi.getAll();
      setBudgets(response.data);
      if (response.data.length > 0) {
        setSelectedBudget(response.data[0].id);
      }
    } catch (error) {
      console.error('Error loading budgets:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadExpenses = async (budgetId: string) => {
    try {
      setLoading(true);
      const response = await expenseApi.getByBudget(budgetId);
      setExpenses(response.data);
    } catch (error) {
      console.error('Error loading expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  // Data for pie chart: Budget by category (shortDescription)
  const categoryData: ChartData[] = expenses.map(expense => {
    const total = expense.planValues?.reduce((sum, pv) => sum + Number(pv.transactionValue), 0) || 0;
    return { name: expense.shortDescription, value: total };
  }).filter(d => d.value > 0).sort((a, b) => b.value - a.value);

  // Data for bar chart: Budget vs Real
  const budgetVsRealData: ChartData[] = (() => {
    const totalBudget = expenses.reduce((sum, exp) => 
      sum + (exp.planValues?.reduce((s, pv) => s + Number(pv.transactionValue), 0) || 0), 0);
    const totalCommitted = expenses.reduce((sum, exp) => 
      sum + (exp.transactions?.filter(t => t.type === 'COMMITTED').reduce((s, t) => s + Number(t.transactionValue), 0) || 0), 0);
    const totalReal = expenses.reduce((sum, exp) => 
      sum + (exp.transactions?.filter(t => t.type === 'REAL').reduce((s, t) => s + Number(t.transactionValue), 0) || 0), 0);
    return [
      { name: 'Presupuesto', value: totalBudget },
      { name: 'Comprometido', value: totalCommitted },
      { name: 'Real', value: totalReal }
    ];
  })();

  // Data for bar chart: Expenses by user area
  const userAreaData: ChartData[] = (() => {
    const areaMap = new Map<string, number>();
    expenses.forEach(expense => {
      const total = expense.planValues?.reduce((sum, pv) => sum + Number(pv.transactionValue), 0) || 0;
      (expense.userAreas || []).forEach(area => {
        areaMap.set(area, (areaMap.get(area) || 0) + total);
      });
    });
    return Array.from(areaMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  })();

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];

  const maxBudgetValue = Math.max(...budgetVsRealData.map(d => d.value), 1);
  const maxAreaValue = Math.max(...userAreaData.map(d => d.value), 1);
  const totalPie = categoryData.reduce((sum, d) => sum + d.value, 0);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-gray-600">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-4">Reportes</h2>
        <div className="max-w-md">
          <label className="block text-sm font-medium text-gray-700 mb-2">Presupuesto</label>
          <select
            value={selectedBudget}
            onChange={(e) => setSelectedBudget(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {budgets.map((budget) => (
              <option key={budget.id} value={budget.id}>
                {budget.year} - {budget.version}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Pie Chart: Budget by Category */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-bold mb-4">División del Presupuesto por Categoría</h3>
        {categoryData.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No hay datos disponibles</p>
        ) : (
          <div className="flex gap-8">
            {/* Simple CSS pie chart representation */}
            <div className="flex-1">
              <div className="space-y-2">
                {categoryData.map((item, idx) => {
                  const pct = totalPie > 0 ? ((item.value / totalPie) * 100).toFixed(1) : '0';
                  return (
                    <div key={idx} className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between text-sm">
                          <span className="truncate">{item.name}</span>
                          <span className="font-medium ml-2">{pct}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                          <div
                            className="h-2 rounded-full transition-all"
                            style={{ width: `${pct}%`, backgroundColor: COLORS[idx % COLORS.length] }}
                          />
                        </div>
                      </div>
                      <span className="text-sm text-gray-600 flex-shrink-0">${item.value.toLocaleString()}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bar Chart: Budget vs Committed vs Real */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-bold mb-4">Presupuesto Total vs Comprometido vs Real</h3>
        <div className="space-y-4">
          {budgetVsRealData.map((item, idx) => {
            const barColors = ['#3B82F6', '#F59E0B', '#10B981'];
            const pct = maxBudgetValue > 0 ? (item.value / maxBudgetValue) * 100 : 0;
            return (
              <div key={idx}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium">{item.name}</span>
                  <span className="text-gray-600">${item.value.toLocaleString()}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-6">
                  <div
                    className="h-6 rounded-full transition-all flex items-center justify-end pr-2"
                    style={{ width: `${Math.max(pct, 2)}%`, backgroundColor: barColors[idx] }}
                  >
                    {pct > 15 && <span className="text-white text-xs font-medium">${item.value.toLocaleString()}</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bar Chart: Expenses by User Area */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-bold mb-4">Presupuesto por Área de Usuario</h3>
        {userAreaData.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No hay datos de áreas disponibles</p>
        ) : (
          <div className="space-y-3">
            {userAreaData.map((item, idx) => {
              const pct = maxAreaValue > 0 ? (item.value / maxAreaValue) * 100 : 0;
              return (
                <div key={idx}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">{item.name}</span>
                    <span className="text-gray-600">${item.value.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-5">
                    <div
                      className="h-5 rounded-full transition-all"
                      style={{ width: `${Math.max(pct, 2)}%`, backgroundColor: COLORS[idx % COLORS.length] }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
