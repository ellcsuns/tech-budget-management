import React, { useState, useEffect, useMemo } from 'react';
import { budgetApi, budgetLineApi, expenseApi, financialCompanyApi } from '../services/api';
import type { Budget, BudgetLine } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { fmt } from '../utils/formatters';
import SaveButton from '../components/SaveButton';
import ConfirmationDialog from '../components/ConfirmationDialog';
import BudgetTable from '../components/BudgetTable';
import { HiOutlineLockClosed, HiOutlinePlusCircle } from 'react-icons/hi2';

interface BudgetLineEdit {
  budgetLineId: string;
  month: number;
  value: number;
}

export default function BudgetsPage() {
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);
  const [budgetLines, setBudgetLines] = useState<BudgetLine[]>([]);
  const [editedCells, setEditedCells] = useState<Map<string, BudgetLineEdit>>(new Map());
  const [validationErrors, setValidationErrors] = useState<Map<string, string>>(new Map());
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [addExpenseId, setAddExpenseId] = useState('');
  const [addCompanyId, setAddCompanyId] = useState('');
  const [allExpenses, setAllExpenses] = useState<any[]>([]);
  const [allCompanies, setAllCompanies] = useState<any[]>([]);

  const { hasPermission } = useAuth();
  const canEdit = hasPermission('budgets', 'MODIFY');

  useEffect(() => { loadBudgets(); loadMasterData(); }, []);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) { e.preventDefault(); }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const loadMasterData = async () => {
    try {
      const [expRes, compRes] = await Promise.all([
        expenseApi.getAll(),
        financialCompanyApi.getAll()
      ]);
      setAllExpenses(expRes.data);
      setAllCompanies(compRes.data);
    } catch (error) {
      console.error('Error loading master data:', error);
    }
  };

  const loadBudgets = async () => {
    try {
      const res = await budgetApi.getAll();
      if (res.data.length > 0) {
        const latest = res.data[res.data.length - 1];
        loadBudgetDetails(latest.id);
      }
    } catch (error) {
      console.error('Error loading budgets:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadBudgetDetails = async (budgetId: string) => {
    try {
      setIsLoading(true);
      const res = await budgetApi.getBudgetWithDetails(budgetId);
      setSelectedBudget(res.data);
      setBudgetLines(res.data.budgetLines || []);
      setEditedCells(new Map());
      setValidationErrors(new Map());
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Error loading budget details:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getCellKey = (budgetLineId: string, month: number) => `${budgetLineId}-${month}`;

  const getPlanValue = (bl: BudgetLine, month: number): number => {
    const key = `planM${month}` as keyof BudgetLine;
    return Number(bl[key]) || 0;
  };

  const handleCellEdit = (budgetLineId: string, month: number, value: string) => {
    const cellKey = getCellKey(budgetLineId, month);
    const newValidationErrors = new Map(validationErrors);

    if (value.trim() !== '' && (isNaN(parseFloat(value)) || parseFloat(value) < 0)) {
      newValidationErrors.set(cellKey, 'Valor inválido');
    } else {
      newValidationErrors.delete(cellKey);
    }
    setValidationErrors(newValidationErrors);

    const numValue = value.trim() === '' ? 0 : parseFloat(value);
    const newEditedCells = new Map(editedCells);
    newEditedCells.set(cellKey, { budgetLineId, month, value: isNaN(numValue) ? 0 : numValue });
    setEditedCells(newEditedCells);
    setHasUnsavedChanges(true);
  };

  const handleRemoveRow = (budgetLineId: string) => { setShowDeleteDialog(budgetLineId); };

  const confirmRemoveRow = () => {
    if (!showDeleteDialog) return;
    setBudgetLines(budgetLines.filter(bl => bl.id !== showDeleteDialog));
    const newEditedCells = new Map(editedCells);
    for (let month = 1; month <= 12; month++) newEditedCells.delete(getCellKey(showDeleteDialog, month));
    setEditedCells(newEditedCells);
    setHasUnsavedChanges(true);
    setShowDeleteDialog(null);
  };

  const handleAddBudgetLine = async () => {
    if (!selectedBudget || !addExpenseId || !addCompanyId) return;
    try {
      await budgetApi.addBudgetLine(selectedBudget.id, addExpenseId, addCompanyId);
      setShowAddForm(false);
      setAddExpenseId('');
      setAddCompanyId('');
      loadBudgetDetails(selectedBudget.id);
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error al agregar línea');
    }
  };

  const handleSave = async () => {
    if (!selectedBudget) return;
    try {
      setIsSaving(true);
      const planValueChanges = Array.from(editedCells.values()).map(cell => ({
        budgetLineId: cell.budgetLineId,
        month: cell.month,
        value: cell.value
      }));
      const res = await budgetApi.createNewVersion(selectedBudget.id, planValueChanges);
      await loadBudgetDetails(res.data.id);
      alert(`Nueva versión ${res.data.version} creada exitosamente`);
    } catch (error: any) {
      if (error.response?.status === 403) alert('No tienes permisos para modificar este presupuesto');
      else if (error.response?.status === 409) alert('Este presupuesto ha sido modificado por otro usuario. Por favor recarga la página.');
      else alert('Error al guardar el presupuesto.');
    } finally { setIsSaving(false); }
  };

  const filteredLines = useMemo(() => {
    if (!searchText.trim()) return budgetLines;
    const s = searchText.toLowerCase();
    return budgetLines.filter(bl =>
      bl.expense?.code?.toLowerCase().includes(s) ||
      bl.expense?.shortDescription?.toLowerCase().includes(s) ||
      bl.financialCompany?.name?.toLowerCase().includes(s)
    );
  }, [budgetLines, searchText]);

  const totals = useMemo(() => {
    const byCurrency: Record<string, number> = {};
    filteredLines.forEach(bl => {
      let lineTotal = 0;
      for (let m = 1; m <= 12; m++) {
        const cellKey = getCellKey(bl.id, m);
        const edited = editedCells.get(cellKey);
        lineTotal += edited ? edited.value : getPlanValue(bl, m);
      }
      const curr = bl.currency || 'USD';
      byCurrency[curr] = (byCurrency[curr] || 0) + lineTotal;
    });
    return byCurrency;
  }, [filteredLines, editedCells]);

  if (isLoading && !selectedBudget) return <div className="text-center py-8">Cargando...</div>;

  return (
    <div className="space-y-4">
      {selectedBudget && (
        <>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <input
                type="text"
                value={searchText}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchText(e.target.value)}
                placeholder="Buscar por código, descripción o empresa..."
                className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent w-56"
              />
              <div className="ml-auto flex items-center gap-3">
                <p className="text-sm text-gray-500">{selectedBudget.year} - v{selectedBudget.version}</p>
                {!canEdit && <p className="text-sm text-gray-500 flex items-center gap-1"><HiOutlineLockClosed className="w-4 h-4" /> Solo lectura</p>}
                {hasUnsavedChanges && <span className="text-sm text-yellow-600 font-medium">⚠ Cambios sin guardar</span>}
                {canEdit && (
                  <>
                    <button onClick={() => setShowAddForm(!showAddForm)} className="btn-secondary flex items-center gap-1 text-sm">
                      <HiOutlinePlusCircle className="w-4 h-4" /> Agregar Línea
                    </button>
                    <SaveButton hasUnsavedChanges={hasUnsavedChanges} hasValidationErrors={validationErrors.size > 0} isSaving={isSaving} onSave={() => setShowConfirmDialog(true)} />
                  </>
                )}
              </div>
            </div>

            {showAddForm && (
              <div className="bg-gray-50 p-4 rounded mb-4 flex gap-4 items-end">
                <div className="flex-1">
                  <label className="block text-xs font-medium mb-1">Gasto</label>
                  <select value={addExpenseId} onChange={e => setAddExpenseId(e.target.value)} className="w-full border rounded px-2 py-1 text-sm">
                    <option value="">Seleccionar...</option>
                    {allExpenses.map(e => <option key={e.id} value={e.id}>{e.code} - {e.shortDescription}</option>)}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-medium mb-1">Empresa Financiera</label>
                  <select value={addCompanyId} onChange={e => setAddCompanyId(e.target.value)} className="w-full border rounded px-2 py-1 text-sm">
                    <option value="">Seleccionar...</option>
                    {allCompanies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <button onClick={handleAddBudgetLine} disabled={!addExpenseId || !addCompanyId} className="btn-success text-sm disabled:opacity-50">Agregar</button>
                <button onClick={() => setShowAddForm(false)} className="btn-cancel text-sm">Cancelar</button>
              </div>
            )}

            <div className="flex gap-4 flex-wrap">
              {Object.entries(totals).map(([curr, val]) => (
                <div key={curr} className="bg-blue-50 px-4 py-2 rounded-lg">
                  <span className="text-xs text-gray-500">Total {curr}</span>
                  <p className="text-sm font-bold text-blue-800">${fmt(val as number)}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            {isLoading ? (
              <div className="text-center py-8">Cargando detalles...</div>
            ) : (
              <BudgetTable
                budgetLines={filteredLines}
                editedCells={editedCells}
                validationErrors={validationErrors}
                canEdit={canEdit}
                onCellEdit={handleCellEdit}
                onRemoveRow={handleRemoveRow}
              />
            )}
          </div>
        </>
      )}

      <ConfirmationDialog isOpen={showConfirmDialog} message="Esto creará una nueva versión del presupuesto como copia del actual con los cambios aplicados. ¿Continuar?" onConfirm={() => { setShowConfirmDialog(false); handleSave(); }} onCancel={() => setShowConfirmDialog(false)} />
      <ConfirmationDialog isOpen={!!showDeleteDialog} message="¿Estás seguro de eliminar esta línea del presupuesto?" onConfirm={confirmRemoveRow} onCancel={() => setShowDeleteDialog(null)} />
    </div>
  );
}
