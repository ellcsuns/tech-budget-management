import { useState, useEffect } from 'react';
import { expenseApi } from '../services/api';
import type { Expense } from '../types';

interface ExpenseDetailPopupProps {
  expenseId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function ExpenseDetailPopup({ expenseId, isOpen, onClose }: ExpenseDetailPopupProps) {
  const [expense, setExpense] = useState<Expense | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && expenseId) {
      loadExpense();
    }
  }, [isOpen, expenseId]);

  const loadExpense = async () => {
    try {
      setLoading(true);
      const response = await expenseApi.getById(expenseId);
      setExpense(response.data);
    } catch (error) {
      console.error('Error loading expense:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Detalle del Gasto</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8">Cargando...</div>
        ) : expense ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Código</label>
              <p className="mt-1 text-sm text-gray-900">{expense.code}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Descripción Corta</label>
              <p className="mt-1 text-sm text-gray-900">{expense.shortDescription}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Descripción Larga</label>
              <p className="mt-1 text-sm text-gray-900">{expense.longDescription}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Empresa Financiera</label>
              <p className="mt-1 text-sm text-gray-900">{expense.financialCompany?.name || 'N/A'}</p>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">No se pudo cargar el gasto</div>
        )}
      </div>
    </div>
  );
}
