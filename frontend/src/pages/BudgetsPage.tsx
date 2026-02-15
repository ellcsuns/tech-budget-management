import { useState, useEffect } from 'react';
import { budgetApi, planValueApi, expenseApi } from '../services/api';
import { Budget, ExpenseRow, CellEdit, Expense } from '../types';
import { getCellKey, validateCellValue, transformToExpenseRows } from '../utils/budgetEditHelpers';
import { useAuth } from '../contexts/AuthContext';
import BudgetSelector from '../components/BudgetSelector';
import BudgetTable from '../components/BudgetTable';
import RowManager from '../components/RowManager';
import SaveButton from '../components/SaveButton';
import ConfirmationDialog from '../components/ConfirmationDialog';

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

  // Check permission for editing
  const { hasPermission } = useAuth();
  const canEdit = hasPermission('budgets', 'MODIFY');

  useEffect(() => {
    loadBudgets();
  }, []);

  // Add beforeunload listener for unsaved changes warning
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasUnsavedChanges]);

  const loadBudgets = async () => {
    try {
      const res = await budgetApi.getAll();
      setBudgets(res.data);
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
      
      // Reset edit state
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
    if (budgetId) {
      loadBudgetDetails(budgetId);
    } else {
      setSelectedBudget(null);
      setExpenses([]);
    }
  };

  const handleCellEdit = (expenseId: string, month: number, value: string) => {
    const cellKey = getCellKey(expenseId, month);
    const validation = validateCellValue(value);
    
    // Update validation errors
    const newValidationErrors = new Map(validationErrors);
    if (validation.isValid) {
      newValidationErrors.delete(cellKey);
    } else {
      newValidationErrors.set(cellKey, validation.error || 'Invalid value');
    }
    setValidationErrors(newValidationErrors);
    
    // Update edited cells
    const numValue = value.trim() === '' ? 0 : parseFloat(value);
    const expense = expenses.find(e => e.id === expenseId);
    const planValue = expense?.planValues.find(pv => pv.month === month);
    
    if (planValue) {
      const newEditedCells = new Map(editedCells);
      newEditedCells.set(cellKey, {
        expenseId,
        month,
        value: isNaN(numValue) ? 0 : numValue,
        currency: planValue.transactionCurrency,
        isValid: validation.isValid
      });
      setEditedCells(newEditedCells);
      setHasUnsavedChanges(true);
    }
  };

  const handleRemoveRow = (expenseId: string) => {
    // Remove expense from list
    setExpenses(expenses.filter(e => e.id !== expenseId));
    
    // Remove any edits for this expense
    const newEditedCells = new Map(editedCells);
    for (let month = 1; month <= 12; month++) {
      const cellKey = getCellKey(expenseId, month);
      newEditedCells.delete(cellKey);
    }
    setEditedCells(newEditedCells);
    
    setHasUnsavedChanges(true);
  };

  const handleAddRow = async (expenseCode: string) => {
    try {
      // Find expense by code from all expenses
      const res = await expenseApi.getByBudget(selectedBudget!.id);
      const expense = res.data.find((e: Expense) => e.code === expenseCode);
      
      if (!expense) {
        console.error('Expense not found:', expenseCode);
        return;
      }

      // Check if expense already exists in the table
      if (expenses.some(e => e.id === expense.id)) {
        alert('Este gasto ya está en la tabla');
        return;
      }

      // Fetch plan values for this expense
      const planValuesRes = await planValueApi.getByExpense(expense.id);
      
      // Create plan values for all 12 months
      const planValues = [];
      for (let month = 1; month <= 12; month++) {
        const existingPlanValue = planValuesRes.data.find(pv => pv.month === month);
        if (existingPlanValue) {
          planValues.push(existingPlanValue);
        } else {
          planValues.push({
            id: `new-${expense.id}-${month}`,
            expenseId: expense.id,
            month,
            transactionCurrency: 'USD',
            transactionValue: 0,
            usdValue: 0,
            conversionRate: 1,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        }
      }

      // Add to expenses list
      const newExpenseRow = {
        id: expense.id,
        code: expense.code,
        description: expense.shortDescription,
        planValues,
        isNew: true
      };

      setExpenses([...expenses, newExpenseRow]);
      setHasUnsavedChanges(true);
    } catch (error) {
      console.error('Error adding row:', error);
      alert('Error al agregar la fila');
    }
  };

  const handleSave = async () => {
    if (!selectedBudget) return;

    try {
      setIsSaving(true);

      // Build planValueChanges array from editedCells
      const planValueChanges = Array.from(editedCells.values()).map(cell => ({
        expenseId: cell.expenseId,
        month: cell.month,
        transactionValue: cell.value,
        transactionCurrency: cell.currency
      }));

      // Call API to create new version
      const res = await budgetApi.createNewVersion(selectedBudget.id, planValueChanges);

      // Reload budget details with new version
      await loadBudgetDetails(res.data.id);

      alert(`Nueva versión ${res.data.version} creada exitosamente`);
    } catch (error: any) {
      console.error('Error saving budget:', error);
      
      if (error.response?.status === 403) {
        alert('No tienes permisos para modificar este presupuesto');
      } else if (error.response?.status === 409) {
        alert('Este presupuesto ha sido modificado por otro usuario. Por favor recarga la página.');
      } else {
        alert('Error al guardar el presupuesto. Por favor verifica tu conexión.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading && !selectedBudget) {
    return <div className="text-center py-8">Cargando...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Presupuestos</h1>
      </div>

      <BudgetSelector
        budgets={budgets}
        selectedBudgetId={selectedBudget?.id || null}
        onSelect={handleBudgetSelect}
      />

      {selectedBudget && (
        <div className="mt-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">
                Presupuesto: {selectedBudget.year} - {selectedBudget.version}
              </p>
              {!canEdit && (
                <p className="text-sm text-gray-500 flex items-center gap-1">
                  <span>🔒</span> Solo lectura - No tienes permisos de modificación
                </p>
              )}
              {hasUnsavedChanges && (
                <p className="text-sm text-yellow-600 font-medium">
                  ⚠ Hay cambios sin guardar
                </p>
              )}
            </div>
            <div className="flex gap-3">
              {canEdit && (
                <>
                  <RowManager budgetId={selectedBudget.id} onAddRow={handleAddRow} />
                  <SaveButton
                    hasUnsavedChanges={hasUnsavedChanges}
                    hasValidationErrors={validationErrors.size > 0}
                    isSaving={isSaving}
                    onSave={() => setShowConfirmDialog(true)}
                  />
                </>
              )}
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-8">Cargando detalles...</div>
          ) : (
            <BudgetTable
              expenses={expenses}
              editedCells={editedCells}
              validationErrors={validationErrors}
              canEdit={canEdit}
              onCellEdit={handleCellEdit}
              onRemoveRow={handleRemoveRow}
            />
          )}
        </div>
      )}

      <ConfirmationDialog
        isOpen={showConfirmDialog}
        message="Esto creará una nueva versión del presupuesto. ¿Continuar?"
        onConfirm={() => {
          setShowConfirmDialog(false);
          handleSave();
        }}
        onCancel={() => setShowConfirmDialog(false)}
      />
    </div>
  );
}
