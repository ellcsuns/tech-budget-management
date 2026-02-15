import { useState, useEffect, useMemo } from 'react';
import { budgetApi, planValueApi, expenseApi } from '../services/api';
import { Budget, ExpenseRow, CellEdit, Expense } from '../types';
import { getCellKey, validateCellValue, transformToExpenseRows } from '../utils/budgetEditHelpers';
import { useAuth } from '../contexts/AuthContext';
import BudgetTable from '../components/BudgetTable';
import RowManager from '../components/RowManager';
import SaveButton from '../components/SaveButton';
import ConfirmationDialog from '../components/ConfirmationDialog';
import { fmt } from '../utils/formatters';
import { HiOutlineLockClosed } from 'react-icons/hi2';

export default function BudgetsPage() {
  const [, setBudgets] = useState<Budget[]>([]);
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);
  const [expenses, setExpenses] = useState<ExpenseRow[]>([]);
  const [editedCells, setEditedCells] = useState<Map<string, CellEdit>>(new Map());
  const [validationErrors, setValidationErrors] = useState<Map<string, string>>(new Map());
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');

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

  const handleRemoveRow = (expenseId: string) => { setShowDeleteDialog(expenseId); };

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
    } catch (error) { alert('Error al agregar la fila'); }
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
    } finally { setIsSaving(false); }
  };

  // Filter expenses by search text
  const filteredExpenses = useMemo(() => {
    if (!searchText.trim()) return expenses;
    const s = searchText.toLowerCase();
    return expenses.filter(e => e.code?.toLowerCase().includes(s) || e.description?.toLowerCase().includes(s));
  }, [expenses, searchText]);

  // Calculate totals from filtered expenses
  const totals = useMemo(() => {
    const byCurrency: Record<string, number> = {};
    let totalUSD = 0;
    filteredExpenses.forEach(exp => {
      exp.planValues.forEach(pv => {
        const cellKey = getCellKey(exp.id, pv.month);
        const edited = editedCells.get(cellKey);
        const val = edited ? edited.value : Number(pv.transactionValue);
        const curr = pv.transactionCurrency || 'USD';
        byCurrency[curr] = (byCurrency[curr] || 0) + val;
        totalUSD += Number(pv.usdValue) || val;
      });
    });
    return { byCurrency, totalUSD };
  }, [filteredExpenses, editedCells]);

  if (isLoading && !selectedBudget) return <div className="text-center py-8">Cargando...</div>;

  return (
    <div className="space-y-4">
      {selectedBudget && (
        <>
          <div className="bg-white rounded-lg shadow p-4">
            {/* Search + controls row */}
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Buscar gasto..."
                className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent w-48"
              />
              <div className="ml-auto flex items-center gap-3">
                <p className="text-sm text-gray-500">{selectedBudget.year} - {selectedBudget.version}</p>
                {!canEdit && <p className="text-sm text-gray-500 flex items-center gap-1"><HiOutlineLockClosed className="w-4 h-4" /> Solo lectura</p>}
                {hasUnsavedChanges && <span className="text-sm text-yellow-600 font-medium">⚠ Cambios sin guardar</span>}
                {canEdit && (
                  <>
                    <RowManager budgetId={selectedBudget.id} onAddRow={handleAddRow} />
                    <SaveButton hasUnsavedChanges={hasUnsavedChanges} hasValidationErrors={validationErrors.size > 0} isSaving={isSaving} onSave={() => setShowConfirmDialog(true)} />
                  </>
                )}
              </div>
            </div>

            {/* Dynamic totals indicators */}
            <div className="flex gap-4 flex-wrap">
              {Object.entries(totals.byCurrency).map(([curr, val]) => (
                <div key={curr} className="bg-blue-50 px-4 py-2 rounded-lg">
                  <span className="text-xs text-gray-500">Total {curr}</span>
                  <p className="text-sm font-bold text-blue-800">${fmt(val)}</p>
                </div>
              ))}
              <div className="bg-green-50 px-4 py-2 rounded-lg">
                <span className="text-xs text-gray-500">Total USD</span>
                <p className="text-sm font-bold text-green-800">${fmt(totals.totalUSD)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            {isLoading ? (
              <div className="text-center py-8">Cargando detalles...</div>
            ) : (
              <BudgetTable expenses={filteredExpenses} editedCells={editedCells} validationErrors={validationErrors} canEdit={canEdit} onCellEdit={handleCellEdit} onRemoveRow={handleRemoveRow} />
            )}
          </div>
        </>
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
