import { useState, useEffect } from 'react';
import { api, budgetApi, expenseApi } from '../services/api';
import { fmt, MONTH_NAMES } from '../utils/formatters';

interface Expense {
  id: string;
  code: string;
  shortDescription: string;
  financialCompanyId: string;
}

interface PlanValue {
  id: string;
  expenseId: string;
  month: number;
  transactionCurrency: string;
  transactionValue: number;
  usdValue: number;
}

interface Budget {
  id: string;
  year: number;
  version: string;
}

export default function PlanValuesPage() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [selectedBudgetId, setSelectedBudgetId] = useState<string>('');
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [planValues, setPlanValues] = useState<PlanValue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingCell, setEditingCell] = useState<{ expenseId: string; month: number } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [pendingChanges, setPendingChanges] = useState<Map<string, { expenseId: string; month: number; value: number }>>(new Map());

  useEffect(() => {
    loadBudgets();
  }, []);

  useEffect(() => {
    if (selectedBudgetId) {
      loadBudgetData();
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

  const loadBudgetData = async () => {
    try {
      setIsLoading(true);
      const expensesRes = await expenseApi.getByBudget(selectedBudgetId);
      setExpenses(expensesRes.data);

      const planValuesRes = await api.get(`/plan-values?budgetId=${selectedBudgetId}`);
      setPlanValues(planValuesRes.data || []);
    } catch (error) {
      console.error('Error loading budget data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getPlanValue = (expenseId: string, month: number): number => {
    const key = `${expenseId}-${month}`;
    if (pendingChanges.has(key)) {
      return pendingChanges.get(key)!.value;
    }
    const planValue = planValues.find(pv => pv.expenseId === expenseId && pv.month === month);
    return planValue ? planValue.transactionValue : 0;
  };

  const handleCellClick = (expenseId: string, month: number) => {
    setEditingCell({ expenseId, month });
    setEditValue(getPlanValue(expenseId, month).toString());
  };

  const handleCellBlur = () => {
    if (editingCell) {
      const value = parseFloat(editValue);
      if (!isNaN(value) && value >= 0) {
        const key = `${editingCell.expenseId}-${editingCell.month}`;
        const newChanges = new Map(pendingChanges);
        newChanges.set(key, {
          expenseId: editingCell.expenseId,
          month: editingCell.month,
          value
        });
        setPendingChanges(newChanges);
      }
    }
    setEditingCell(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCellBlur();
    } else if (e.key === 'Escape') {
      setEditingCell(null);
    }
  };

  const handleSaveChanges = async () => {
    if (pendingChanges.size === 0) {
      alert('No hay cambios pendientes');
      return;
    }

    if (!confirm(`¿Crear nueva versión del presupuesto con ${pendingChanges.size} cambios?`)) {
      return;
    }

    try {
      const changes = Array.from(pendingChanges.values()).map(change => ({
        expenseId: change.expenseId,
        month: change.month,
        transactionValue: change.value,
        transactionCurrency: 'USD' // Por ahora asumimos USD
      }));

      await api.post(`/budgets/${selectedBudgetId}/versions`, { planValueChanges: changes });
      
      alert('Nueva versión creada exitosamente');
      setPendingChanges(new Map());
      loadBudgets();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error al crear nueva versión');
    }
  };

  const handleDiscardChanges = () => {
    if (confirm('¿Descartar todos los cambios pendientes?')) {
      setPendingChanges(new Map());
    }
  };

  const getMonthTotal = (expenseId: string): number => {
    let total = 0;
    for (let month = 1; month <= 12; month++) {
      total += getPlanValue(expenseId, month);
    }
    return total;
  };

  if (isLoading) {
    return <div className="text-center py-8">Cargando...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Valores Planeados</h1>
        <div className="flex space-x-3">
          {pendingChanges.size > 0 && (
            <>
              <span className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg">
                {pendingChanges.size} cambios pendientes
              </span>
              <button
                onClick={handleDiscardChanges}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Descartar
              </button>
              <button
                onClick={handleSaveChanges}
                className="btn-primary"
              >
                Guardar y Crear Versión
              </button>
            </>
          )}
        </div>
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

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase sticky left-0 bg-gray-50">
                Código
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase sticky left-20 bg-gray-50">
                Descripción
              </th>
              {MONTH_NAMES.map((name, i) => (
                <th key={i} className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  {name}
                </th>
              ))}
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase bg-blue-50">
                Total
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {expenses.map((expense) => (
              <tr key={expense.id}>
                <td className="px-4 py-2 text-sm text-gray-900 sticky left-0 bg-white">
                  {expense.code}
                </td>
                <td className="px-4 py-2 text-sm text-gray-900 sticky left-20 bg-white">
                  {expense.shortDescription}
                </td>
                {Array.from({ length: 12 }, (_, i) => i + 1).map(month => {
                  const isEditing = editingCell?.expenseId === expense.id && editingCell?.month === month;
                  const value = getPlanValue(expense.id, month);
                  const key = `${expense.id}-${month}`;
                  const hasChange = pendingChanges.has(key);

                  return (
                    <td
                      key={month}
                      className={`px-4 py-2 text-sm text-right cursor-pointer hover:bg-gray-50 ${
                        hasChange ? 'bg-yellow-100' : ''
                      }`}
                      onClick={() => handleCellClick(expense.id, month)}
                    >
                      {isEditing ? (
                        <input
                          type="number"
                          step="0.01"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={handleCellBlur}
                          onKeyDown={handleKeyDown}
                          className="w-full px-2 py-1 border rounded text-right"
                          autoFocus
                        />
                      ) : (
                        <span>{fmt(value)}</span>
                      )}
                    </td>
                  );
                })}
                <td className="px-4 py-2 text-sm text-right font-bold bg-blue-50">
                  {fmt(getMonthTotal(expense.id))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
