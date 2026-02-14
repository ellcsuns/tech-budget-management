import { useState, useEffect } from 'react';
import { budgetApi, expenseApi } from '../services/api';

interface Expense {
  id: string;
  code: string;
  shortDescription: string;
  longDescription: string;
  financialCompanyId: string;
}

interface Budget {
  id: string;
  year: number;
  version: string;
}

export default function ExpensesPage() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [selectedBudgetId, setSelectedBudgetId] = useState<string>('');
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadBudgets();
  }, []);

  useEffect(() => {
    if (selectedBudgetId) {
      loadExpenses();
    }
  }, [selectedBudgetId]);

  const loadBudgets = async () => {
    try {
      const res = await budgetApi.getAll();
      setBudgets(res.data);
      if (res.data.length > 0) {
        setSelectedBudgetId(res.data[0].id);
      }
    } catch (error) {
      console.error('Error loading budgets:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadExpenses = async () => {
    try {
      setIsLoading(true);
      const res = await expenseApi.getByBudget(selectedBudgetId);
      setExpenses(res.data);
    } catch (error) {
      console.error('Error loading expenses:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Cargando...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Gastos</h1>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Presupuesto
        </label>
        <select
          value={selectedBudgetId}
          onChange={(e) => setSelectedBudgetId(e.target.value)}
          className="px-3 py-2 border rounded-md"
        >
          {budgets.map(budget => (
            <option key={budget.id} value={budget.id}>
              {budget.year} - {budget.version}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Código</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descripción Corta</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descripción Larga</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {expenses.map((expense) => (
              <tr key={expense.id}>
                <td className="px-6 py-4 text-sm text-gray-900">{expense.code}</td>
                <td className="px-6 py-4 text-sm text-gray-900">{expense.shortDescription}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{expense.longDescription}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
