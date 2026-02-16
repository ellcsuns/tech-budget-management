import React, { useMemo, useState, useRef, useCallback } from 'react';
import { ExpenseRow, CellEdit } from '../types';
import { getCellKey, calculateTotal } from '../utils/budgetEditHelpers';
import { fmt } from '../utils/formatters';
import EditableCell from './EditableCell';
import TotalCell from './TotalCell';
import { HiOutlineTrash } from 'react-icons/hi2';

interface BudgetTableProps {
  expenses: ExpenseRow[];
  editedCells: Map<string, CellEdit>;
  validationErrors: Map<string, string>;
  canEdit: boolean;
  onCellEdit: (expenseId: string, month: number, value: string) => void;
  onRemoveRow: (expenseId: string) => void;
}

const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

export default function BudgetTable({ expenses, editedCells, validationErrors, canEdit, onCellEdit, onRemoveRow }: BudgetTableProps) {
  const [descWidth, setDescWidth] = useState(180);
  const resizing = useRef(false);
  const startX = useRef(0);
  const startW = useRef(0);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    resizing.current = true;
    startX.current = e.clientX;
    startW.current = descWidth;
    const onMove = (ev: MouseEvent) => { if (resizing.current) setDescWidth(Math.max(100, startW.current + ev.clientX - startX.current)); };
    const onUp = () => { resizing.current = false; document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [descWidth]);

  const expenseTotals = useMemo(() => {
    return expenses.map(expense => ({
      expenseId: expense.id,
      total: calculateTotal(expense, editedCells)
    }));
  }, [expenses, editedCells]);

  const getCellValue = (expense: ExpenseRow, month: number): number => {
    const cellKey = getCellKey(expense.id, month);
    const editedCell = editedCells.get(cellKey);
    if (editedCell) return editedCell.value;
    const planValue = expense.planValues.find(pv => pv.month === month);
    return Number(planValue?.transactionValue) || 0;
  };

  const isCellEdited = (expenseId: string, month: number): boolean => editedCells.has(getCellKey(expenseId, month));
  const getCellError = (expenseId: string, month: number): string | undefined => validationErrors.get(getCellKey(expenseId, month));

  // Monthly grand totals
  const monthlyTotals = useMemo(() => {
    const totals: number[] = [];
    for (let month = 1; month <= 12; month++) {
      let sum = 0;
      expenses.forEach(exp => { sum += getCellValue(exp, month); });
      totals.push(sum);
    }
    return totals;
  }, [expenses, editedCells]);

  const grandTotal = useMemo(() => expenseTotals.reduce((s, t) => s + t.total, 0), [expenseTotals]);

  if (expenses.length === 0) {
    return <div className="text-center py-8 text-gray-500">No hay gastos para mostrar</div>;
  }

  return (
    <div className="overflow-x-auto bg-white rounded-lg shadow">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50 sticky top-0">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Código</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider relative" style={{ width: descWidth, minWidth: 100 }}>
              Descripción
              <span className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-accent" onMouseDown={onMouseDown} />
            </th>
            {MONTHS.map((month, idx) => (
              <th key={idx} className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{month}</th>
            ))}
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
            {canEdit && <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {expenses.map((expense) => {
            const expenseTotal = expenseTotals.find(t => t.expenseId === expense.id);
            const currency = expense.planValues[0]?.transactionCurrency || 'USD';
            return (
              <tr key={expense.id} className="hover:bg-gray-50 group">
                <td className="px-4 py-2 text-sm font-medium text-gray-900 whitespace-nowrap">{expense.code}</td>
                <td className="px-4 py-2 text-sm text-gray-700" style={{ width: descWidth, maxWidth: descWidth, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{expense.description}</td>
                {MONTHS.map((_, monthIdx) => {
                  const month = monthIdx + 1;
                  return (
                    <EditableCell key={month} value={getCellValue(expense, month)} isEdited={isCellEdited(expense.id, month)}
                      error={getCellError(expense.id, month)} disabled={!canEdit} onChange={(value) => onCellEdit(expense.id, month, value)} />
                  );
                })}
                <TotalCell total={expenseTotal?.total || 0} currency={currency} />
                {canEdit && (
                  <td className="px-4 py-2 text-center">
                    <button onClick={() => onRemoveRow(expense.id)} className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity" title="Eliminar fila">
                      <HiOutlineTrash className="w-4 h-4" />
                    </button>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
        <tfoot className="bg-gray-100 font-bold">
          <tr>
            <td className="px-4 py-3 text-sm" colSpan={2}>Total</td>
            {monthlyTotals.map((t, i) => (
              <td key={i} className="px-4 py-3 text-sm text-right border border-gray-200">{fmt(t)}</td>
            ))}
            <td className="px-4 py-3 text-sm text-right border border-gray-200">{fmt(grandTotal)}</td>
            {canEdit && <td></td>}
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
