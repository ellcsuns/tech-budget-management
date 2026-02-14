import { useState, useEffect } from 'react';
import { budgetApi, expenseApi } from '../services/api';
import type { Budget, Expense } from '../types';
import ExpenseTable from '../components/ExpenseTable';
import FilterPanel from '../components/FilterPanel';

export default function Dashboard() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [selectedBudget, setSelectedBudget] = useState<string>('');
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'PLAN' | 'COMPARISON'>('PLAN');
  const [filters, setFilters] = useState({
    currency: undefined as string | undefined,
    financialCompanyId: undefined as string | undefined,
    visibleColumns: {
      budget: true,
      committed: true,
      real: true
    }
  });

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
        <h2 className="text-2xl font-bold mb-4">Dashboard de Presupuesto</h2>
        
        <div className="flex gap-4 mb-6">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Presupuesto
            </label>
            <select
              value={selectedBudget}
              onChange={(e) => setSelectedBudget(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {budgets.map((budget) => (
                <key={budget.id} value={budget.id}>
                  {budget.year} - {budget.version}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Modo de Vista
            </label>
            <select
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value as 'PLAN' | 'COMPARISON')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="PLAN">Vista Plan</option>
              <option value="COMPARISON">Vista Comparativa</option>
            </select>
          </div>
        </div>

        <FilterPanel
          expenses={expenses}
          filters={filters}
          onFiltersChange={setFilters}
        />
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <ExpenseTable
          expenses={expenses}
          viewMode={viewMode}
          filters={filters}
        />
      </div>
    </div>
  );
}
