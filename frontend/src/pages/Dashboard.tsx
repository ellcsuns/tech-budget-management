import { useState, useEffect } from 'react';
import { budgetApi, expenseApi } from '../services/api';
import type { Expense } from '../types';
import ExpenseTable from '../components/ExpenseTable';
import FilterPanel from '../components/FilterPanel';

export default function Dashboard() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    currencies: undefined as string[] | undefined,
    financialCompanyIds: undefined as string[] | undefined,
    searchText: '',
    visibleColumns: {
      budget: true,
      committed: true,
      real: true
    }
  });

  useEffect(() => { loadLatestBudget(); }, []);

  const loadLatestBudget = async () => {
    try {
      const response = await budgetApi.getAll();
      if (response.data.length > 0) {
        // Auto-select latest (vigente) budget
        const latest = response.data[response.data.length - 1];
        await loadExpenses(latest.id);
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
    return <div className="flex justify-center items-center h-64"><div className="text-lg text-gray-600">Cargando...</div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <FilterPanel expenses={expenses} filters={filters} onFiltersChange={setFilters} />
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <ExpenseTable
          expenses={expenses}
          viewMode="COMPARISON"
          filters={filters}
          readOnly={true}
        />
      </div>
    </div>
  );
}
