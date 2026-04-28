import React, { useMemo, useState, useRef, useCallback } from 'react';
import type { BudgetLine } from '../types';
import { fmt } from '../utils/formatters';
import EditableCell from './EditableCell';
import TotalCell from './TotalCell';
import { HiOutlineTrash } from 'react-icons/hi2';

interface BudgetTableProps {
  budgetLines: BudgetLine[];
  editedCells: Map<string, any>;
  validationErrors: Map<string, string>;
  canEdit: boolean;
  onCellEdit: (budgetLineId: string, month: number, value: string) => void;
  onRemoveRow: (budgetLineId: string) => void;
  onRowClick?: (bl: BudgetLine) => void;
  userAreas?: any[];
  showComputed?: boolean;
}

const MONTHS = ['M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7', 'M8', 'M9', 'M10', 'M11', 'M12'];

export default function BudgetTable(props: BudgetTableProps) {
  const { budgetLines, editedCells, validationErrors, canEdit, onCellEdit, onRemoveRow, onRowClick, showComputed } = props;
  const [descWidth, setDescWidth] = useState(180);
  const resizing = useRef(false);
  const startX = useRef(0);
  const startW = useRef(0);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    resizing.current = true;
    startX.current = e.clientX;
    startW.current = descWidth;
    const onMove = (ev: MouseEvent) => {
      if (resizing.current) setDescWidth(Math.max(100, startW.current + ev.clientX - startX.current));
    };
    const onUp = () => {
      resizing.current = false;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [descWidth]);

  const getCellKey = (blId: string, month: number) => `${blId}-${month}`;

  const getPlanValue = (bl: BudgetLine, month: number): number => {
    if (showComputed) {
      const key = `computedM${month}` as any;
      if ((bl as any)[key] !== undefined) return Number((bl as any)[key]) || 0;
    }
    const key = `planM${month}` as keyof BudgetLine;
    return Number(bl[key]) || 0;
  };

  const getCellValue = (bl: BudgetLine, month: number): number => {
    const cellKey = getCellKey(bl.id, month);
    const editedCell = editedCells.get(cellKey);
    if (editedCell) return editedCell.value;
    return getPlanValue(bl, month);
  };

  const getLineTotal = (bl: BudgetLine): number => {
    let total = 0;
    for (let m = 1; m <= 12; m++) total += getCellValue(bl, m);
    return total;
  };

  const isCellEdited = (blId: string, month: number): boolean =>
    editedCells.has(getCellKey(blId, month));

  const getCellError = (blId: string, month: number): string | undefined =>
    validationErrors.get(getCellKey(blId, month));

  const getLineDots = (bl: any): JSX.Element[] => {
    const dots: JSX.Element[] = [];
    if (bl.hasSavings) dots.push(<span key="s" className="inline-block w-2 h-2 rounded-full bg-green-500 mr-0.5" title="Ahorro activo" />);
    if (bl.hasCorrections) dots.push(<span key="c" className="inline-block w-2 h-2 rounded-full bg-blue-500 mr-0.5" title="Corrección aprobada" />);
    return dots;
  };

  const monthlyTotals = useMemo(() => {
    const totals: number[] = [];
    for (let month = 1; month <= 12; month++) {
      let sum = 0;
      budgetLines.forEach(bl => { sum += getCellValue(bl, month); });
      totals.push(sum);
    }
    return totals;
  }, [budgetLines, editedCells, showComputed]);

  const grandTotal = useMemo(() =>
    budgetLines.reduce((s, bl) => s + getLineTotal(bl), 0), [budgetLines, editedCells, showComputed]);

  if (budgetLines.length === 0) {
    return <div className="text-center py-8 text-gray-500">No hay líneas de presupuesto para mostrar</div>;
  }

  return (
    <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-lg shadow">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
        <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Código</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider relative" style={{ width: descWidth, minWidth: 100 }}>
              Descripción
              <span className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-accent" onMouseDown={onMouseDown} />
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Empresa</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Moneda</th>
            {MONTHS.map((month, idx) => (
              <th key={idx} className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{month}</th>
            ))}
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total</th>
            {canEdit && (
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Acciones</th>
            )}
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-600">
          {budgetLines.map((bl) => {
            const lineTotal = getLineTotal(bl);
            const dots = getLineDots(bl);
            return (
              <tr key={bl.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 group cursor-pointer" onClick={() => onRowClick?.(bl)}>
                <td className="px-4 py-2 text-sm font-medium text-gray-900 dark:text-gray-100 whitespace-nowrap">
                  {bl.expense?.code}
                </td>
                <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300" style={{ width: descWidth, maxWidth: descWidth, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {bl.expense?.shortDescription}
                </td>
                <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">{bl.financialCompany?.name || '-'}</td>
                <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">{bl.currency}</td>
                {MONTHS.map((_, monthIdx) => {
                  const month = monthIdx + 1;
                  return (
                    <EditableCell
                      key={month}
                      value={getCellValue(bl, month)}
                      isEdited={isCellEdited(bl.id, month)}
                      error={getCellError(bl.id, month)}
                      disabled={!canEdit}
                      onChange={(value) => onCellEdit(bl.id, month, value)}
                    />
                  );
                })}
                <TotalCell total={lineTotal} currency={bl.currency} />
                {canEdit && (
                  <td className="px-4 py-2 text-center">
                    <button onClick={(e) => { e.stopPropagation(); onRemoveRow(bl.id); }} className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity" title="Eliminar fila">
                      <HiOutlineTrash className="w-4 h-4" />
                    </button>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
        <tfoot className="bg-gray-100 dark:bg-gray-700 font-bold">
          <tr>
            <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100" colSpan={4}>Total</td>
            {monthlyTotals.map((t, i) => (
              <td key={i} className="px-4 py-3 text-sm text-right text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-600">{fmt(t)}</td>
            ))}
            <td className="px-4 py-3 text-sm text-right text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-600">{fmt(grandTotal)}</td>
            {canEdit && <td></td>}
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
