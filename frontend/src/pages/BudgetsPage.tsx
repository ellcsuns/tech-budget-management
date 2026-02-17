import { useState, useEffect, useMemo } from 'react';
import { budgetApi, expenseApi, financialCompanyApi, userAreaApi, changeRequestApi } from '../services/api';
import type { Budget, BudgetLine, UserArea, ChangeRequest } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { fmt } from '../utils/formatters';
import ConfirmationDialog from '../components/ConfirmationDialog';
import BudgetTable from '../components/BudgetTable';
import FilterPanel from '../components/FilterPanel';
import { HiOutlineLockClosed, HiOutlinePlusCircle } from 'react-icons/hi2';

const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

export default function BudgetsPage() {
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);
  const [budgetLines, setBudgetLines] = useState<BudgetLine[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addExpenseId, setAddExpenseId] = useState('');
  const [addCompanyId, setAddCompanyId] = useState('');
  const [allExpenses, setAllExpenses] = useState<any[]>([]);
  const [allCompanies, setAllCompanies] = useState<any[]>([]);
  const [allUserAreas, setAllUserAreas] = useState<UserArea[]>([]);

  // Popup state
  const [editPopupLine, setEditPopupLine] = useState<BudgetLine | null>(null);
  const [popupValues, setPopupValues] = useState<Record<number, string>>({});
  const [popupComment, setPopupComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // My change requests
  const [myRequests, setMyRequests] = useState<ChangeRequest[]>([]);
  const [showMyRequests, setShowMyRequests] = useState(false);
  const [loadingRequests, setLoadingRequests] = useState(false);

  const [filters, setFilters] = useState({
    currencies: undefined as string[] | undefined,
    financialCompanyIds: undefined as string[] | undefined,
    searchText: '',
    visibleColumns: { budget: true, committed: true, real: true }
  });

  const { hasPermission } = useAuth();
  const canEdit = hasPermission('budgets', 'MODIFY');

  useEffect(() => { loadBudgets(); loadMasterData(); }, []);

  const loadMasterData = async () => {
    try {
      const [expRes, compRes, areaRes] = await Promise.all([
        expenseApi.getAll(), financialCompanyApi.getAll(), userAreaApi.getAll()
      ]);
      setAllExpenses(expRes.data);
      setAllCompanies(compRes.data);
      setAllUserAreas(areaRes.data);
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
    } catch (error) { console.error('Error loading budget details:', error); }
    finally { setIsLoading(false); }
  };

  const loadMyRequests = async () => {
    try {
      setLoadingRequests(true);
      const res = await changeRequestApi.getMyRequests();
      setMyRequests(Array.isArray(res.data) ? res.data : []);
    } catch (error) { console.error('Error loading my requests:', error); setMyRequests([]); }
    finally { setLoadingRequests(false); }
  };

  const getPlanValue = (bl: BudgetLine, month: number): number => {
    const key = `planM${month}` as keyof BudgetLine;
    return Number(bl[key]) || 0;
  };

  const handleRemoveRow = (budgetLineId: string) => { setShowDeleteDialog(budgetLineId); };
  const confirmRemoveRow = () => {
    if (!showDeleteDialog) return;
    setBudgetLines(budgetLines.filter(bl => bl.id !== showDeleteDialog));
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

  const openEditPopup = (bl: BudgetLine) => {
    setEditPopupLine(bl);
    const vals: Record<number, string> = {};
    for (let m = 1; m <= 12; m++) vals[m] = String(getPlanValue(bl, m));
    setPopupValues(vals);
    setPopupComment('');
  };

  // Submit change request from popup
  const submitChangeRequest = async () => {
    if (!editPopupLine) return;
    setIsSubmitting(true);
    try {
      const proposedValues: Record<string, number> = {};
      for (let m = 1; m <= 12; m++) {
        proposedValues[`planM${m}`] = parseFloat(popupValues[m]) || 0;
      }
      await changeRequestApi.create({
        budgetLineId: editPopupLine.id,
        proposedValues,
        comment: popupComment || undefined,
      });
      alert('Solicitud de cambio enviada a aprobación exitosamente');
      setEditPopupLine(null);
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error al enviar solicitud de cambio');
    } finally { setIsSubmitting(false); }
  };

  // Check if popup has actual changes
  const popupHasChanges = useMemo(() => {
    if (!editPopupLine) return false;
    for (let m = 1; m <= 12; m++) {
      const current = getPlanValue(editPopupLine, m);
      const proposed = parseFloat(popupValues[m]) || 0;
      if (current !== proposed) return true;
    }
    return false;
  }, [editPopupLine, popupValues]);

  const popupTotal = useMemo(() =>
    Object.values(popupValues).reduce((s: number, v: string) => s + (parseFloat(v) || 0), 0),
  [popupValues]);

  const getAreaNames = (bl: BudgetLine): string => {
    const areaIds = bl.expense?.userAreas || [];
    if (areaIds.length === 0) return '-';
    return areaIds.map((id: string) => {
      const area = allUserAreas.find(a => a.id === id);
      return area ? area.name : '';
    }).filter(Boolean).join(', ');
  };

  const filteredLines = useMemo(() => budgetLines.filter(bl => {
    if (filters.searchText && filters.searchText.trim()) {
      const s = filters.searchText.toLowerCase();
      const matchCode = bl.expense?.code?.toLowerCase().includes(s);
      const matchDesc = bl.expense?.shortDescription?.toLowerCase().includes(s);
      const matchComp = bl.financialCompany?.name?.toLowerCase().includes(s);
      const matchArea = getAreaNames(bl).toLowerCase().includes(s);
      if (!matchCode && !matchDesc && !matchComp && !matchArea) return false;
    }
    if (filters.currencies && filters.currencies.length > 0) {
      if (!filters.currencies.includes(bl.currency)) return false;
    }
    if (filters.financialCompanyIds && filters.financialCompanyIds.length > 0) {
      if (!filters.financialCompanyIds.includes(bl.financialCompanyId)) return false;
    }
    return true;
  }), [budgetLines, filters, allUserAreas]);

  const totals = useMemo(() => {
    const byCurrency: Record<string, number> = {};
    filteredLines.forEach(bl => {
      let lineTotal = 0;
      for (let m = 1; m <= 12; m++) lineTotal += getPlanValue(bl, m);
      const curr = bl.currency || 'USD';
      byCurrency[curr] = (byCurrency[curr] || 0) + lineTotal;
    });
    return byCurrency;
  }, [filteredLines]);

  const statusLabel = (s: string) => {
    if (s === 'PENDING') return { text: 'Pendiente', cls: 'bg-yellow-100 text-yellow-800' };
    if (s === 'APPROVED') return { text: 'Aprobada', cls: 'bg-green-100 text-green-800' };
    return { text: 'Rechazada', cls: 'bg-red-100 text-red-800' };
  };

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
                {canEdit && (
                  <button onClick={() => setShowAddForm(!showAddForm)} className="btn-secondary flex items-center gap-1 text-sm">
                    <HiOutlinePlusCircle className="w-4 h-4" /> Agregar Línea
                  </button>
                )}
                <button onClick={() => { setShowMyRequests(!showMyRequests); if (!showMyRequests) loadMyRequests(); }}
                  className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded text-sm hover:bg-blue-100">
                  {showMyRequests ? 'Ocultar Solicitudes' : 'Mis Solicitudes'}
                </button>
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

          {/* My Change Requests panel */}
          {showMyRequests && (
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-sm font-bold mb-3">Mis Solicitudes de Cambio</h3>
              {loadingRequests ? (
                <p className="text-center py-4 text-gray-400">Cargando...</p>
              ) : myRequests.length === 0 ? (
                <p className="text-center py-4 text-gray-400">No tienes solicitudes de cambio</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs text-gray-500">Fecha</th>
                        <th className="px-3 py-2 text-left text-xs text-gray-500">Gasto</th>
                        <th className="px-3 py-2 text-left text-xs text-gray-500">Empresa</th>
                        <th className="px-3 py-2 text-left text-xs text-gray-500">Estado</th>
                        <th className="px-3 py-2 text-left text-xs text-gray-500">Comentario</th>
                        <th className="px-3 py-2 text-left text-xs text-gray-500">Aprobado por</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {myRequests.map(req => {
                        const st = statusLabel(req.status);
                        return (
                          <tr key={req.id} className="hover:bg-gray-50">
                            <td className="px-3 py-2 whitespace-nowrap">{new Date(req.createdAt).toLocaleDateString()}</td>
                            <td className="px-3 py-2">{req.budgetLine?.expense?.code} - {req.budgetLine?.expense?.shortDescription}</td>
                            <td className="px-3 py-2">{req.budgetLine?.financialCompany?.name}</td>
                            <td className="px-3 py-2"><span className={`px-2 py-0.5 rounded text-xs font-medium ${st.cls}`}>{st.text}</span></td>
                            <td className="px-3 py-2 text-gray-500">{req.comment || '-'}</td>
                            <td className="px-3 py-2">{req.approvedBy?.fullName || '-'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          <div className="bg-white rounded-lg shadow p-4">
            {isLoading ? (
              <div className="text-center py-8">Cargando detalles...</div>
            ) : (
              <BudgetTable
                budgetLines={filteredLines}
                editedCells={new Map()}
                validationErrors={new Map()}
                canEdit={false}
                onCellEdit={() => {}}
                onRemoveRow={handleRemoveRow}
                onRowClick={canEdit ? openEditPopup : undefined}
                userAreas={allUserAreas}
              />
            )}
          </div>
        </>
      )}

      {/* Edit Popup - Vertical month layout with change request submission */}
      {editPopupLine && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">Solicitar Cambio de Presupuesto</h2>
              <button onClick={() => setEditPopupLine(null)} className="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
            </div>
            <div className="space-y-1 mb-4 text-sm">
              <div><span className="text-gray-500">Código:</span> {editPopupLine.expense?.code}</div>
              <div><span className="text-gray-500">Descripción:</span> {editPopupLine.expense?.shortDescription}</div>
              <div><span className="text-gray-500">Empresa:</span> {editPopupLine.financialCompany?.name}</div>
              <div><span className="text-gray-500">Moneda:</span> {editPopupLine.currency}</div>
              {editPopupLine.technologyDirection && <div><span className="text-gray-500">Dir. Tecnología:</span> {editPopupLine.technologyDirection.name}</div>}
              <div><span className="text-gray-500">Área Responsable:</span> {getAreaNames(editPopupLine)}</div>
            </div>

            {/* Vertical month list with current vs proposed */}
            <div className="border rounded divide-y mb-4">
              <div className="flex items-center px-4 py-2 bg-gray-50 text-xs font-medium text-gray-500">
                <span className="w-16">Mes</span>
                <span className="w-28 text-right">Actual</span>
                <span className="flex-1 text-right">Propuesto</span>
              </div>
              {MONTHS.map((m, i) => {
                const currentVal = getPlanValue(editPopupLine, i + 1);
                const proposedVal = parseFloat(popupValues[i + 1]) || 0;
                const changed = currentVal !== proposedVal;
                return (
                  <div key={i} className={`flex items-center px-4 py-2 ${changed ? 'bg-yellow-50' : ''}`}>
                    <label className="text-sm font-medium text-gray-600 w-16">{m}</label>
                    <span className="w-28 text-right text-sm text-gray-400">{fmt(currentVal)}</span>
                    <div className="flex-1 flex justify-end">
                      <input
                        type="number" step="0.01" value={popupValues[i + 1] || '0'}
                        onChange={(e) => setPopupValues({ ...popupValues, [i + 1]: e.target.value })}
                        className="w-36 border rounded px-3 py-1.5 text-sm text-right focus:ring-2 focus:ring-accent focus:border-accent"
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Comment */}
            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-500 mb-1">Comentario (opcional)</label>
              <textarea value={popupComment} onChange={(e) => setPopupComment(e.target.value)}
                className="w-full border rounded px-3 py-2 text-sm" rows={2} placeholder="Justificación del cambio..." />
            </div>

            <div className="flex justify-between items-center">
              <div className="text-sm font-semibold">
                Total: {fmt(popupTotal)} {editPopupLine.currency}
              </div>
              <div className="flex gap-2">
                <button onClick={() => setEditPopupLine(null)} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 text-sm">Cancelar</button>
                <button onClick={submitChangeRequest} disabled={!popupHasChanges || isSubmitting}
                  className="px-4 py-2 bg-accent text-white rounded hover:opacity-90 text-sm disabled:opacity-50">
                  {isSubmitting ? 'Enviando...' : 'Enviar a Aprobación'}
                </button>
              </div>
            </div>

            {!popupHasChanges && (
              <p className="text-xs text-gray-400 mt-2 text-center">Modifica al menos un valor para enviar la solicitud</p>
            )}
          </div>
        </div>
      )}

      <ConfirmationDialog isOpen={!!showDeleteDialog} message="¿Estás seguro de eliminar esta línea del presupuesto?" onConfirm={confirmRemoveRow} onCancel={() => setShowDeleteDialog(null)} />
    </div>
  );
}
