import { useState, useEffect, useMemo } from 'react';
import { budgetApi, planValueApi, expenseApi } from '../services/api';
import { Budget, ExpenseRow, CellEdit, Expense } from '../types';
import { getCellKey, validateCellValue, transformToExpenseRows } from '../utils/budgetEditHelpers';
import { useAuth } from '../contexts/AuthContext';
import BudgetSelector from '../components/BudgetSelector';
import BudgetTable from '../components/BudgetTable';
import RowManager from '../components/RowManager';
import SaveButton from '../components/SaveButton';
import ConfirmationDialog from '../components/ConfirmationDialog';
import { HiOutlineLockClosed } from 'react-icons/hi2';

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);
  const [expenses, setExpenses] = useState<ExpenseRow[]>([]);
  const [editedCells, setEditedCells] = useState<Map<string, CellEdit>>(new Map());
  const [validationErrors, setValidationErrors] = useState<Map<string, string>>(new Map());
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState<string | null>(null);

  const { hasPermission } = useAuth();
  const canEdit = hasPermission('budgets', 'MODIFY');

  useEffect(() => { loadBudgets(); }, []);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) { e.preventDefault(); e.returnValue = ''; }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const loadBudgets = async () => {
    try {
      const res = await budgetApi.getAll();
      setBudgets(res.data);
      // Auto-select latest budget (last created = vigente)
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
      if (res.data.expenses) {
        const expenseRows = transformToExpenseRows(res.data.expenses);
        setExpenses(expenseRows);
      }
      setEditedCells(new Map());
      setValidationErrors(new Map());
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Error loading budget details:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBudgetSelect = (budgetId: string) => {
    if (budgetId) loadBudgetDetails(budgetId);
    else { setSelectedBudget(null); setExpenses([]); }
  };

  const handleCellEdit = (expenseId: string, month: number, value: string) => {
    const cellKey = getCellKey(expenseId, month);
    const validation = validateCellValue(value);
    const newValidationErrors = new Map(validationErrors);
    if (validation.isValid) newValidationErrors.delete(cellKey);
    else newValidationErrors.set(cellKey, validation.error || 'Invalid value');
    setValidationErrors(newValidationErrors);

    const numValue = value.trim() === '' ? 0 : parseFloat(value);
    const expense = expenses.find(e => e.id === expenseId);
    const planValue = expense?.planValues.find(pv => pv.month === month);
    if (planValue) {
      const newEditedCells = new Map(editedCells);
      newEditedCells.set(cellKey, { expenseId, month, value: isNaN(numValue) ? 0 : numValue, currency: planValue.transactionCurrency, isValid: validation.isValid });
      setEditedCells(newEditedCells);
      setHasUnsavedChanges(true);
    }
  };

  const handleRemoveRow = (expenseId: string) => {
    setShowDeleteDialog(expenseId);
  };

  const confirmRemoveRow = () => {
    if (!showDeleteDialog) return;
    setExpenses(expenses.filter(e => e.id !== showDeleteDialog));
    const newEditedCells = new Map(editedCells);
    for (let month = 1; month <= 12; month++) newEditedCells.delete(getCellKey(showDeleteDialog, month));
    setEditedCells(newEditedCells);
    setHasUnsavedChanges(true);
    setShowDeleteDialog(null);
  };

  const handleAddRow = async (expenseCode: string) => {
    try {
      const res = await expenseApi.getByBudget(selectedBudget!.id);
      const expense = res.data.find((e: Expense) => e.code === expenseCode);
      if (!expense) return;
      if (expenses.some(e => e.id === expense.id)) { alert('Este gasto ya está en la tabla'); return; }

      const planValuesRes = await planValueApi.getByExpense(expense.id);
      const planValues = [];
      for (let month = 1; month <= 12; month++) {
        const existing = planValuesRes.data.find(pv => pv.month === month);
        planValues.push(existing || { id: `new-${expense.id}-${month}`, expenseId: expense.id, month, transactionCurrency: 'USD', transactionValue: 0, usdValue: 0, conversionRate: 1, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
      }
      setExpenses([...expenses, { id: expense.id, code: expense.code, description: expense.shortDescription, planValues, isNew: true }]);
      setHasUnsavedChanges(true);
    } catch (error) {
      alert('Error al agregar la fila');
    }
  };

  const handleSave = async () => {
    if (!selectedBudget) return;
    try {
      setIsSaving(true);
      const planValueChanges = Array.from(editedCells.values()).map(cell => ({
        expenseId: cell.expenseId, month: cell.month, transactionValue: cell.value, transactionCurrency: cell.currency
      }));
      const res = await budgetApi.createNewVersion(selectedBudget.id, planValueChanges);
      await loadBudgetDetails(res.data.id);
      await loadBudgets();
      alert(`Nueva versión ${res.data.version} creada exitosamente`);
    } catch (error: any) {
      if (error.response?.status === 403) alert('No tienes permisos para modificar este presupuesto');
      else if (error.response?.status === 409) alert('Este presupuesto ha sido modificado por otro usuario. Por favor recarga la página.');
      else alert('Error al guardar el presupuesto.');
    } finally {
      setIsSaving(false);
    }
  };

  // Calculate totals by currency and company
  const totals = useMemo(() => {
    const byCurrency: Record<string, number> = {};
    const byCompany: Record<string, number> = {};
    let totalUSD = 0;

    expenses.forEach(exp => {
      exp.planValues.forEach(pv => {
        const cellKey = getCellKey(exp.id, pv.month);
        const edited = editedCells.get(cellKey);
        const val = edited ? edited.value : Number(pv.transactionValue);
        const curr = pv.transactionCurrency || 'USD';
        byCurrency[curr] = (byCurrency[curr] || 0) + val;
        totalUSD += Number(pv.usdValue) || val;
      });
    });

    return { byCurrency, byCompany, totalUSD };
  }, [expenses, editedCells]);

  if (isLoading && !selectedBudget) return <div className="text-center py-8">Cargando...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Presupuestos</h1>
      </div>

      <BudgetSelector budgets={budgets} selectedBudgetId={selectedBudget?.id || null} onSelect={handleBudgetSelect} />

      {selectedBudget && (
        <div className="mt-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Presupuesto: {selectedBudget.year} - {selectedBudget.version}</p>
              {!canEdit && <p className="text-sm text-gray-500 flex items-center gap-1"><HiOutlineLockClosed className="w-4 h-4" /> Solo lectura</p>}
              {hasUnsavedChanges && <p className="text-sm text-yellow-600 font-medium">⚠ Hay cambios sin guardar</p>}
            </div>
            <div className="flex gap-3">
              {canEdit && (
                <>
                  <RowManager budgetId={selectedBudget.id} onAddRow={handleAddRow} />
                  <SaveButton hasUnsavedChanges={hasUnsavedChanges} hasValidationErrors={validationErrors.size > 0} isSaving={isSaving} onSave={() => setShowConfirmDialog(true)} />
                </>
              )}
            </div>
          </div>

          {/* Totals indicators */}
          <div className="flex gap-4 mb-4 flex-wrap">
            {Object.entries(totals.byCurrency).map(([curr, val]) => (
              <div key={curr} className="bg-blue-50 px-4 py-2 rounded-lg">
                <span className="text-xs text-gray-500">Total {curr}</span>
                <p className="text-sm font-bold text-blue-800">${val.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
              </div>
            ))}
            <div className="bg-green-50 px-4 py-2 rounded-lg">
              <span className="text-xs text-gray-500">Total USD</span>
              <p className="text-sm font-bold text-green-800">${totals.totalUSD.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-8">Cargando detalles...</div>
          ) : (
            <BudgetTable expenses={expenses} editedCells={editedCells} validationErrors={validationErrors} canEdit={canEdit} onCellEdit={handleCellEdit} onRemoveRow={handleRemoveRow} />
          )}
        </div>
      )}

      <ConfirmationDialog
        isOpen={showConfirmDialog}
        message="Esto creará una nueva versión del presupuesto como copia del actual con los cambios aplicados. ¿Continuar?"
        onConfirm={() => { setShowConfirmDialog(false); handleSave(); }}
        onCancel={() => setShowConfirmDialog(false)}
      />

      <ConfirmationDialog
        isOpen={!!showDeleteDialog}
        message="¿Estás seguro de eliminar esta fila del presupuesto?"
        onConfirm={confirmRemoveRow}
        onCancel={() => setShowDeleteDialog(null)}
      />
    </div>
  );
}
