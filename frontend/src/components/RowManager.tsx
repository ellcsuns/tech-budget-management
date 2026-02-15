import { useState, useEffect } from 'react';
import { expenseApi } from '../services/api';
import { Expense } from '../types';

interface RowManagerProps {
  budgetId: string;
  onAddRow: (expenseCode: string) => void;
}

export default function RowManager({ budgetId, onAddRow }: RowManagerProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [allExpenses, setAllExpenses] = useState<Expense[]>([]);
  const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isModalOpen && allExpenses.length === 0) {
      loadExpenses();
    }
  }, [isModalOpen]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredExpenses(allExpenses);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = allExpenses.filter(
        expense =>
          expense.code.toLowerCase().includes(query) ||
          expense.shortDescription.toLowerCase().includes(query)
      );
      setFilteredExpenses(filtered);
    }
  }, [searchQuery, allExpenses]);

  const loadExpenses = async () => {
    try {
      setIsLoading(true);
      const res = await expenseApi.getByBudget(budgetId);
      setAllExpenses(res.data);
      setFilteredExpenses(res.data);
    } catch (error) {
      console.error('Error loading expenses:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectExpense = (expenseCode: string) => {
    onAddRow(expenseCode);
    setIsModalOpen(false);
    setSearchQuery('');
  };

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="btn-primary"
      >
        + Agregar Fila
      </button>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Buscar Gasto</h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por código o descripción..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {isLoading ? (
                <div className="text-center py-8 text-gray-500">Cargando...</div>
              ) : filteredExpenses.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No se encontraron gastos
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredExpenses.map((expense) => (
                    <button
                      key={expense.id}
                      onClick={() => handleSelectExpense(expense.code)}
                      className="w-full text-left px-4 py-3 border border-gray-200 rounded-md hover:bg-blue-50 hover:border-blue-300 transition-colors"
                    >
                      <div className="font-medium text-gray-900">{expense.code}</div>
                      <div className="text-sm text-gray-600">{expense.shortDescription}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-200">
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
