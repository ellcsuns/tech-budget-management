import { useState, useEffect } from 'react';
import { budgetApi, budgetLineApi } from '../services/api';
import { fmt, MONTH_NAMES } from '../utils/formatters';
import type { BudgetLine } from '../types';
import { showToast } from '../components/Toast';
import ConfirmationDialog from '../components/ConfirmationDialog';

interface Budget {
  id: string;
  year: number;
  version: string;
}

export default function PlanValuesPage() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [selectedBudgetId, setSelectedBudgetId] = useState<string>('');
  const [budgetLines, setBudgetLines] = useState<BudgetLine[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingCell, setEditingCell] = useState<{ lineId: string; month: number } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [pendingChanges, setPendingChanges] = useState<Map<string, { lineId: string; month: number; value: number }>>(new Map());
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);

  useEffect(() => { loadBudgets(); }, []);
  useEffect(() => { if (selectedBudgetId) loadBudgetData(); }, [selectedBudgetId]);

  const loadBudgets = async () => {
    try {
      const res = await budgetApi.getAll();
      setBudgets(res.data);
      if (res.data.length > 0) {
        const active = res.data.find((b: any) => b.isActive);
        setSelectedBudgetId((active || res.data[0]).id);
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
      const res = await budgetLineApi.getByBudget(selectedBudgetId);
      setBudgetLines(res.data);
    } catch (error) {
      console.error('Error loading budget data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getPlanValue = (line: BudgetLine, month: number): number => {
    const key = `${line.id}-${month}`;
    if (pendingChanges.has(key)) return pendingChanges.get(key)!.value;
    const field = `planM${month}` as keyof BudgetLine;
    return Number(line[field]) || 0;
  };

  const handleCellClick = (lineId: string, month: number) => {
    const line = budgetLines.find(l => l.id === lineId);
    if (!line) return;
    setEditingCell({ lineId, month });
    setEditValue(getPlanValue(line, month).toString());
  };

  const handleCellBlur = () => {
    if (editingCell) {
      const value = parseFloat(editValue);
      if (!isNaN(value) && value >= 0) {
        const key = `${editingCell.lineId}-${editingCell.month}`;
        const newChanges = new Map(pendingChanges);
        newChanges.set(key, { lineId: editingCell.lineId, month: editingCell.month, value });
        setPendingChanges(newChanges);
      }
    }
    setEditingCell(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleCellBlur();
    else if (e.key === 'Escape') setEditingCell(null);
  };

  const handleSaveChanges = async () => {
    if (pendingChanges.size === 0) { showToast('No hay cambios pendientes', 'info'); return; }
    setShowSaveDialog(true);
  };

  const confirmSave = async () => {
    setShowSaveDialog(false);

    try {
      // Group changes by budgetLine
      const changesByLine = new Map<string, Record<string, number>>();
      pendingChanges.forEach(change => {
        if (!changesByLine.has(change.lineId)) changesByLine.set(change.lineId, {});
        changesByLine.get(change.lineId)![`planM${change.month}`] = change.value;
      });

      // Update each budget line
      for (const [lineId, planData] of changesByLine) {
        await budgetLineApi.updatePlanValues(lineId, planData);
      }

      showToast('Valores plan actualizados exitosamente', 'success');
      setPendingChanges(new Map());
      loadBudgetData();
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Error al guardar cambios', 'error');
    }
  };

  const handleDiscardChanges = () => {
    setShowDiscardDialog(true);
  };

  const confirmDiscard = () => {
    setPendingChanges(new Map());
    setShowDiscardDialog(false);
  };

  const getLineTotal = (line: BudgetLine): number => {
    let total = 0;
    for (let m = 1; m <= 12; m++) total += getPlanValue(line, m);
    return total;
  };

  if (isLoading) return <div className="text-center py-8">Cargando...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div />
        <div className="flex space-x-3">
          {pendingChanges.size > 0 && (
            <>
              <span className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg">
                {pendingChanges.size} cambios pendientes
              </span>
              <button onClick={handleDiscardChanges} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                Descartar
              </button>
              <button onClick={handleSaveChanges} className="btn-primary">
                Guardar Cambios
              </button>
            </>
          )}
        </div>
      </div>

      <div className="mb-4 flex items-center gap-3">
        <label className="text-sm font-medium text-gray-600">Presupuesto:</label>
        <select value={selectedBudgetId} onChange={(e) => setSelectedBudgetId(e.target.value)} className="px-3 py-1.5 border rounded text-sm min-w-[220px]">
          {budgets.map(budget => (
            <option key={budget.id} value={budget.id}>{budget.year} - {budget.version}{(budget as any).isActive ? ' ★ Vigente' : ''}</option>
          ))}
        </select>
        {budgets.find((b: any) => b.isActive && b.id === selectedBudgetId) && (
          <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">★ Vigente</span>
        )}
      </div>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase sticky left-0 bg-gray-50">Código</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descripción</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Empresa</th>
              {MONTH_NAMES.map((name, i) => (
                <th key={i} className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">{name}</th>
              ))}
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase bg-blue-50">Total</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {budgetLines.map((line) => (
              <tr key={line.id}>
                <td className="px-4 py-2 text-sm text-gray-900 sticky left-0 bg-white">{line.expense?.code || ''}</td>
                <td className="px-4 py-2 text-sm text-gray-900">{line.expense?.shortDescription || ''}</td>
                <td className="px-4 py-2 text-sm text-gray-900">{line.financialCompany?.name || ''}</td>
                {Array.from({ length: 12 }, (_, i) => i + 1).map(month => {
                  const isEditing = editingCell?.lineId === line.id && editingCell?.month === month;
                  const value = getPlanValue(line, month);
                  const key = `${line.id}-${month}`;
                  const hasChange = pendingChanges.has(key);
                  return (
                    <td key={month} className={`px-4 py-2 text-sm text-right cursor-pointer hover:bg-gray-50 ${hasChange ? 'bg-yellow-100' : ''}`}
                      onClick={() => handleCellClick(line.id, month)}>
                      {isEditing ? (
                        <input type="number" step="0.01" value={editValue} onChange={(e) => setEditValue(e.target.value)}
                          onBlur={handleCellBlur} onKeyDown={handleKeyDown} className="w-full px-2 py-1 border rounded text-right" autoFocus />
                      ) : (
                        <span>{fmt(value)}</span>
                      )}
                    </td>
                  );
                })}
                <td className="px-4 py-2 text-sm text-right font-bold bg-blue-50">{fmt(getLineTotal(line))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ConfirmationDialog isOpen={showSaveDialog} message={`¿Guardar ${pendingChanges.size} cambios en valores plan?`} onConfirm={confirmSave} onCancel={() => setShowSaveDialog(false)} />
      <ConfirmationDialog isOpen={showDiscardDialog} message="¿Descartar todos los cambios pendientes?" onConfirm={confirmDiscard} onCancel={() => setShowDiscardDialog(false)} />
    </div>
  );
}
