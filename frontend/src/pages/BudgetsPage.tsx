import { useState, useEffect, useMemo } from 'react';
import { budgetApi, expenseApi, financialCompanyApi } from '../services/api';
import type { Budget, BudgetLine } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { fmt } from '../utils/formatters';
import SaveButton from '../components/SaveButton';
import ConfirmationDialog from '../components/ConfirmationDialog';
import BudgetTable from '../components/BudgetTable';
import FilterPanel from '../components/FilterPanel';
import { HiOutlineLockClosed, HiOutlinePlusCircle } from 'react-icons/hi2';

interface BudgetLineEdit {
  budgetLineId: string;
  month: number;
  value: number;
}

const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

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
  const [showAddForm, setShowAddForm] = useState(false);
  const [addExpenseId, setAddExpenseId] = useState('');
  const [addCompanyId, setAddCompanyId] = useState('');
  const [allExpenses, setAllExpenses] = useState<any[]>([]);
  const [allCompanies, setAllCompanies] = useState<any[]>([]);
  const [editPopupLine, setEditPopupLine] = useState<BudgetLine | null>(null);
  const [popupValues, setPopupValues] = useState<Record<number, string>>({});
  const [filters, setFilters] = useState({
    currencies: undefined as string[] | undefined,
    financialCompanyIds: undefined as string[] | undefined,
    searchText: '',
    visibleColumns: { budget: true, committed: true, real: true }
  });

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
      const [expRes, compRes] = await Promise.all([expenseApi.getAll(), financialCompanyApi.getAll()]);
      setAllExpenses(expRes.data);
      setAllCompanies(compRes.data);
    } catch (error) { console.error('Error loading master data:', error); }
  };

  const loadBudgets = async () => {
    try {
      const res = await budgetApi.getAll();
      if (res.data.length > 0) {
        const latest = res.data[res.data.length - 1];
        loadBudgetDetails(latest.id);
      }
    } catch (error) { console.error('Error loading budgets:', error); }
    finally { setIsLoading(false); }
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
    } catch (error) { console.error('Error loading budget details:', error); }
    finally { setIsLoading(false); }
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
    } else { newValidationErrors.delete(cellKey); }
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
      setShowAddForm(false); setAddExpenseId(''); setAddCompanyId('');
      loadBudgetDetails(selectedBudget.id);
    } catch (error: any) { alert(error.response?.data?.error || 'Error al agregar línea'); }
  };

  const handleSave = async () => {
    if (!selectedBudget) return;
    try {
      setIsSaving(true);
      const planValueChanges = Array.from(editedCells.values()).map((cell: BudgetLineEdit) => ({
        budgetLineId: cell.budgetLineId, month: cell.month, value: cell.value
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

  const openEditPopup = (bl: BudgetLine) => {
    setEditPopupLine(bl);
    const vals: Record<number, string> = {};
    for (let m = 1; m <= 12; m++) {
      const cellKey = getCellKey(bl.id, m);
      const edited = editedCells.get(cellKey);
      vals[m] = String(edited ? edited.value : getPlanValue(bl, m));
    }
    setPopupValues(vals);
  };

  const applyPopupEdits = () => {
    if (!editPopupLine) return;
    for (let m = 1; m <= 12; m++) {
      handleCellEdit(editPopupLine.id, m, popupValues[m] || '0');
    }
    setEditPopupLine(null);
  };

  const filteredLines = useMemo(() => budgetLines.filter(bl => {
    if (filters.searchText && filters.searchText.trim()) {
      const s = filters.searchText.toLowerCase();
      const matchCode = bl.expense?.code?.toLowerCase().includes(s);
      const matchDesc = bl.expense?.shortDescription?.toLowerCase().includes(s);
      const matchComp = bl.financialCompany?.name?.toLowerCase().includes(s);
      if (!matchCode && !matchDesc && !matchComp) return false;
    }
    if (filters.currencies && filters.currencies.length > 0) {
      if (!filters.currencies.includes(bl.currency)) return false;
    }
    if (filters.financialCompanyIds && filters.financialCompanyIds.length > 0) {
      if (!filters.financialCompanyIds.includes(bl.financialCompanyId)) return false;
    }
    return true;
  }), [budgetLines, filters]);

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
            <FilterPanel budgetLines={budgetLines} filters={filters} onFiltersChange={setFilters} />
            <div className="flex flex-wrap items-center gap-3 mb-4">
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
                onRowClick={openEditPopup}
              />
            )}
          </div>
        </>
      )}

      {/* Edit Popup */}
      {editPopupLine && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">Editar Línea de Presupuesto</h2>
              <button onClick={() => setEditPopupLine(null)} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
              <div><span className="text-gray-500">Código:</span> {editPopupLine.expense?.code}</div>
              <div><span className="text-gray-500">Descripción:</span> {editPopupLine.expense?.shortDescription}</div>
              <div><span className="text-gray-500">Empresa:</span> {editPopupLine.financialCompany?.name}</div>
              <div><span className="text-gray-500">Moneda:</span> {editPopupLine.currency}</div>
              {editPopupLine.technologyDirection && <div><span className="text-gray-500">Área Tecnología:</span> {editPopupLine.technologyDirection.name}</div>}
            </div>
            <div className="grid grid-cols-4 gap-3 mb-4">
              {MONTHS.map((m, i) => (
                <div key={i}>
                  <label className="block text-xs font-medium text-gray-500 mb-1">{m}</label>
                  <input
                    type="number" step="0.01" value={popupValues[i + 1] || '0'}
                    onChange={(e) => setPopupValues({ ...popupValues, [i + 1]: e.target.value })}
                    className="w-full border rounded px-2 py-1 text-sm text-right"
                    disabled={!canEdit}
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-between items-center">
              <div className="text-sm font-semibold">
                Total: {fmt(Object.values(popupValues).reduce((s: number, v: string) => s + (parseFloat(v) || 0), 0))} {editPopupLine.currency}
              </div>
              <div className="flex gap-2">
                <button onClick={() => setEditPopupLine(null)} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 text-sm">Cancelar</button>
                {canEdit && <button onClick={applyPopupEdits} className="px-4 py-2 bg-accent text-white rounded hover:opacity-90 text-sm">Aplicar Cambios</button>}
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmationDialog isOpen={showConfirmDialog} message="Esto creará una nueva versión del presupuesto como copia del actual con los cambios aplicados. ¿Continuar?" onConfirm={() => { setShowConfirmDialog(false); handleSave(); }} onCancel={() => setShowConfirmDialog(false)} />
      <ConfirmationDialog isOpen={!!showDeleteDialog} message="¿Estás seguro de eliminar esta línea del presupuesto?" onConfirm={confirmRemoveRow} onCancel={() => setShowDeleteDialog(null)} />
    </div>
  );
}
