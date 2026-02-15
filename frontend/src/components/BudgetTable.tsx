import { useMemo } from 'react';
import { ExpenseRow, CellEdit } from '../types';
import { getCellKey, calculateTotal } from '../utils/budgetEditHelpers';
import EditableCell from './EditableCell';
import TotalCell from './TotalCell';

interface BudgetTableProps {
  expenses: ExpenseRow[];
  editedCells: Map<string, CellEdit>;
  validationErrors: Map<string, string>;
  canEdit: boolean;
  onCellEdit: (expenseId: string, month: number, value: string) => void;
  onRemoveRow: (expenseId: string) => void;
}

const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

export default function BudgetTable({
  expenses,
  editedCells,
  validationErrors,
  canEdit,
  onCellEdit,
  onRemoveRow
}: BudgetTableProps) {
  
  // Memoize totals calculation
  const expenseTotals = useMemo(() => {
    return expenses.map(expense => ({
      expenseId: expense.id,
      total: calculateTotal(expense, editedCells)
    }));
  }, [expenses, editedCells]);

  const getCellValue = (expense: ExpenseRow, month: number): number => {
    const cellKey = getCellKey(expense.id, month);
    const editedCell = editedCells.get(cellKey);
    
    if (editedCell) {
      return editedCell.value;
    }
    
    const planValue = expense.planValues.find(pv => pv.month === month);
    return planValue?.transactionValue || 0;
  };

  const isCellEdited = (expenseId: string, month: number): boolean => {
    const cellKey = getCellKey(expenseId, month);
    return editedCells.has(cellKey);
  };

  const getCellError = (expenseId: string, month: number): string | undefined => {
    const cellKey = getCellKey(expenseId, month);
    return validationErrors.get(cellKey);
  };

  if (expenses.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No hay gastos para mostrar
      </div>
    );
  }

  return (
    <div className="overflow-x-auto bg-white rounded-lg shadow">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50 sticky top-0">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Código
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Descripción
            </th>
            {MONTHS.map((month, idx) => (
              <th key={idx} className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                {month}
              </th>
            ))}
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Total
            </th>
            {canEdit && (
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            )}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {expenses.map((expense) => {
            const expenseTotal = expenseTotals.find(t => t.expenseId === expense.id);
            const currency = expense.planValues[0]?.transactionCurrency || 'USD';
            
            return (
              <tr key={expense.id} className="hover:bg-gray-50 group">
                <td className="px-4 py-2 text-sm font-medium text-gray-900 whitespace-nowrap">
                  {expense.code}
                </td>
                <td className="px-4 py-2 text-sm text-gray-700">
                  {expense.description}
                </td>
                {MONTHS.map((_, monthIdx) => {
                  const month = monthIdx + 1;
                  return (
                    <EditableCell
                      key={month}
                      value={getCellValue(expense, month)}
                      isEdited={isCellEdited(expense.id, month)}
                      error={getCellError(expense.id, month)}
                      disabled={!canEdit}
                      onChange={(value) => onCellEdit(expense.id, month, value)}
                    />
                  );
                })}
                <TotalCell total={expenseTotal?.total || 0} currency={currency} />
                {canEdit && (
                  <td className="px-4 py-2 text-center">
                    <button
                      onClick={() => onRemoveRow(expense.id)}
                      className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Eliminar fila"
                    >
                      🗑️
                    </button>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
