import { useState, useEffect, useMemo } from 'react';
import { budgetApi, expenseApi, financialCompanyApi, userAreaApi, changeRequestApi, technologyDirectionApi, budgetLineApi } from '../services/api';
import type { Budget, BudgetLine, UserArea, ChangeRequest, TechnologyDirection } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { fmt } from '../utils/formatters';
import ConfirmationDialog from '../components/ConfirmationDialog';
import BudgetTable from '../components/BudgetTable';
import FilterPanel from '../components/FilterPanel';
import { HiOutlineLockClosed, HiOutlinePlusCircle, HiOutlineTrash, HiOutlineStar, HiOutlineDocumentDuplicate } from 'react-icons/hi2';
import { showToast } from '../components/Toast';
import { useI18n } from '../contexts/I18nContext';

const MONTHS = ['M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7', 'M8', 'M9', 'M10', 'M11', 'M12'];

export default function BudgetsPage() {
  const { t } = useI18n();
  const [allBudgets, setAllBudgets] = useState<Budget[]>([]);
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);
  const [budgetLines, setBudgetLines] = useState<BudgetLine[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState<string | null>(null);
  const [showDeleteBudgetDialog, setShowDeleteBudgetDialog] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addExpenseId, setAddExpenseId] = useState('');
  const [addCompanyId, setAddCompanyId] = useState('');
  const [addTechDirId, setAddTechDirId] = useState('');
  const [addMonthlyValues, setAddMonthlyValues] = useState<number[]>(Array(12).fill(0));
  const [allExpenses, setAllExpenses] = useState<any[]>([]);
  const [allCompanies, setAllCompanies] = useState<any[]>([]);
  const [allUserAreas, setAllUserAreas] = useState<UserArea[]>([]);
  const [allTechDirections, setAllTechDirections] = useState<TechnologyDirection[]>([]);

  // Create budget modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newBudgetYear, setNewBudgetYear] = useState(new Date().getFullYear());
  const [newBudgetVersion, setNewBudgetVersion] = useState('v1');
  const [sourceBudgetId, setSourceBudgetId] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Popup state
  const [editPopupLine, setEditPopupLine] = useState<BudgetLine | null>(null);
  const [popupValues, setPopupValues] = useState<Record<number, string>>({});
  const [popupComment, setPopupComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // My change requests
  const [myRequests, setMyRequests] = useState<ChangeRequest[]>([]);
  const [showMyRequests, setShowMyRequests] = useState(false);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [selectedChangeRequest, setSelectedChangeRequest] = useState<ChangeRequest | null>(null);

  const [filters, setFilters] = useState({
    currencies: undefined as string[] | undefined,
    financialCompanyIds: undefined as string[] | undefined,
    categories: undefined as string[] | undefined,
    searchText: '',
    visibleColumns: { budget: true, committed: true, real: true }
  });

  const { hasPermission } = useAuth();
  const canEdit = hasPermission('budgets', 'MODIFY');
  const isAdmin = hasPermission('roles', 'MODIFY'); // Only admin can manage roles = admin check

  useEffect(() => { loadBudgets(); loadMasterData(); }, []);

  const loadMasterData = async () => {
    try {
      const [expRes, compRes, areaRes, techRes] = await Promise.all([
        expenseApi.getAll(), financialCompanyApi.getAll(), userAreaApi.getAll(), technologyDirectionApi.getAll()
      ]);
      setAllExpenses(expRes.data);
      setAllCompanies(compRes.data);
      setAllUserAreas(areaRes.data);
      setAllTechDirections(techRes.data);
    } catch (error) { console.error('Error loading master data:', error); }
  };

  const loadBudgets = async () => {
    try {
      const res = await budgetApi.getAll();
      setAllBudgets(res.data);
      if (res.data.length > 0) {
        const active = res.data.find((b: Budget) => b.isActive);
        const target = active || res.data[0];
        loadBudgetDetails(target.id);
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

  const confirmRemoveRow = async () => {
    if (!showDeleteDialog || !selectedBudget) return;
    try {
      await budgetApi.removeBudgetLine(selectedBudget.id, showDeleteDialog);
      setBudgetLines(budgetLines.filter(bl => bl.id !== showDeleteDialog));
      showToast(t('budget.lineDeleted'), 'success');
    } catch (error: any) {
      showToast(error.response?.data?.error || 'Error al eliminar línea', 'error');
    }
    setShowDeleteDialog(null);
  };

  const handleAddBudgetLine = async () => {
    if (!selectedBudget || !addExpenseId || !addCompanyId) return;
    try {
      const res = await budgetApi.addBudgetLine(selectedBudget.id, addExpenseId, addCompanyId, addTechDirId || undefined);
      // If monthly values were entered, update them
      const newLineId = res.data?.id;
      if (newLineId && addMonthlyValues.some(v => v > 0)) {
        const planData: Record<string, number> = {};
        for (let m = 1; m <= 12; m++) planData[`planM${m}`] = addMonthlyValues[m - 1];
        try { await budgetLineApi.updatePlanValues(newLineId, planData); } catch {}
      }
      setShowAddForm(false); setAddExpenseId(''); setAddCompanyId(''); setAddTechDirId(''); setAddMonthlyValues(Array(12).fill(0));
      loadBudgetDetails(selectedBudget.id);
      showToast(t('budget.lineAdded'), 'success');
    } catch (error: any) { showToast(error.response?.data?.error || 'Error al agregar línea', 'error'); }
  };

  const handleCreateBudget = async () => {
    setIsCreating(true);
    try {
      await budgetApi.create({ year: newBudgetYear, version: newBudgetVersion, sourceBudgetId: sourceBudgetId || undefined });
      showToast(t('budget.budgetCreated'), 'success');
      setShowCreateModal(false);
      setSourceBudgetId('');
      loadBudgets();
    } catch (error: any) {
      showToast(error.response?.data?.error || 'Error al crear presupuesto', 'error');
    } finally { setIsCreating(false); }
  };

  const handleSetActive = async () => {
    if (!selectedBudget) return;
    try {
      await budgetApi.setActive(selectedBudget.id);
      showToast(t('budget.markedActive'), 'success');
      // Refresh budget list and current budget details
      const res = await budgetApi.getAll();
      setAllBudgets(res.data);
      loadBudgetDetails(selectedBudget.id);
    } catch (error: any) {
      showToast(error.response?.data?.error || 'Error al marcar como vigente', 'error');
    }
  };

  const handleDeleteBudget = async () => {
    if (!selectedBudget) return;
    try {
      await budgetApi.delete(selectedBudget.id);
      showToast(t('budget.budgetDeleted'), 'success');
      setShowDeleteBudgetDialog(false);
      setSelectedBudget(null);
      setBudgetLines([]);
      loadBudgets();
    } catch (error: any) {
      showToast(error.response?.data?.error || 'Error al eliminar presupuesto', 'error');
    }
  };

  const handleSubmitForReview = async () => {
    if (!selectedBudget) return;
    try {
      await budgetApi.submitForReview(selectedBudget.id);
      showToast(t('budget.sentToReview'), 'success');
      loadBudgetDetails(selectedBudget.id);
      loadBudgets();
    } catch (error: any) {
      showToast(error.response?.data?.error || 'Error al enviar a revisión', 'error');
    }
  };

  const openEditPopup = (bl: BudgetLine) => {
    setEditPopupLine(bl);
    const vals: Record<number, string> = {};
    for (let m = 1; m <= 12; m++) vals[m] = String(getPlanValue(bl, m));
    setPopupValues(vals);
    setPopupComment('');
  };

  const submitChangeRequest = async () => {
    if (!editPopupLine) return;
    setIsSubmitting(true);
    try {
      const proposedValues: Record<string, number> = {};
      for (let m = 1; m <= 12; m++) proposedValues[`planM${m}`] = parseFloat(popupValues[m]) || 0;
      await changeRequestApi.create({ budgetLineId: editPopupLine.id, proposedValues, comment: popupComment || undefined });
      showToast(t('budget.changeRequestSent'), 'success');
      setEditPopupLine(null);
    } catch (error: any) {
      showToast(error.response?.data?.error || 'Error al enviar solicitud de cambio', 'error');
    } finally { setIsSubmitting(false); }
  };

  const popupHasChanges = useMemo(() => {
    if (!editPopupLine) return false;
    for (let m = 1; m <= 12; m++) {
      if (getPlanValue(editPopupLine, m) !== (parseFloat(popupValues[m]) || 0)) return true;
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
    if (filters.categories && filters.categories.length > 0) {
      const catId = (bl.expense as any)?.categoryId;
      if (!catId || !filters.categories.includes(catId)) return false;
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
    if (s === 'PENDING') return { text: t('common.pending'), cls: 'bg-yellow-100 text-yellow-800' };
    if (s === 'APPROVED') return { text: t('common.approved'), cls: 'bg-green-100 text-green-800' };
    return { text: t('common.rejected'), cls: 'bg-red-100 text-red-800' };
  };

  if (isLoading && !selectedBudget) return <div className="text-center py-8">{t('msg.loading')}</div>;

  return (
    <div className="space-y-4">
      {/* Budget selector + actions bar */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-600">{t('label.budget')}:</label>
            <select
              value={selectedBudget?.id || ''}
              onChange={(e) => { if (e.target.value) loadBudgetDetails(e.target.value); }}
              className="border rounded px-3 py-1.5 text-sm min-w-[220px]"
            >
              {allBudgets.map(b => (
                <option key={b.id} value={b.id}>
                  {b.year} - {b.version}{b.isActive ? ` ★ ${t('budget.active')}` : ''}
                </option>
              ))}
            </select>
          </div>

          {selectedBudget?.isActive && (
            <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">★ {t('budget.active')}</span>
          )}

          <div className="ml-auto flex items-center gap-2">
            {isAdmin && selectedBudget && !selectedBudget.isActive && (
              <button onClick={handleSetActive} className="flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-700 rounded text-sm hover:bg-green-100" title={t('budget.setActive')}>
                <HiOutlineStar className="w-4 h-4" /> {t('budget.setActive')}
              </button>
            )}
            {selectedBudget && !selectedBudget.reviewStatus && (
              <button onClick={() => handleSubmitForReview()} className="flex items-center gap-1 px-3 py-1.5 bg-amber-50 text-amber-700 rounded text-sm hover:bg-amber-100" title={t('budget.submitReview')}>
                <HiOutlineLockClosed className="w-4 h-4" /> {t('budget.submitReview')}
              </button>
            )}
            {selectedBudget?.reviewStatus && (
              <span className="px-2 py-1 bg-amber-100 text-amber-800 rounded text-xs font-medium">
                {t('budget.inReview')} {selectedBudget.reviewSubmittedBy ? `(${selectedBudget.reviewSubmittedBy.fullName})` : ''}
              </span>
            )}
            {isAdmin && (
              <button onClick={() => setShowCreateModal(true)} className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 rounded text-sm hover:bg-blue-100">
                <HiOutlinePlusCircle className="w-4 h-4" /> {t('budget.newBudget')}
              </button>
            )}
            {isAdmin && selectedBudget && !selectedBudget.isActive && (
              <button onClick={() => setShowDeleteBudgetDialog(true)} className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-700 rounded text-sm hover:bg-red-100" title={t('btn.delete')}>
                <HiOutlineTrash className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {selectedBudget && (
        <>
          <div className="bg-white rounded-lg shadow p-4">
            <FilterPanel budgetLines={budgetLines} filters={filters} onFiltersChange={setFilters} />
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <div className="ml-auto flex items-center gap-3">
                {!canEdit && <p className="text-sm text-gray-500 flex items-center gap-1"><HiOutlineLockClosed className="w-4 h-4" /> {t('budget.readOnly')}</p>}
                {canEdit && (
                  <button onClick={() => setShowAddForm(true)} className="btn-secondary flex items-center gap-1 text-sm">
                    <HiOutlinePlusCircle className="w-4 h-4" /> {t('budget.addLine')}
                  </button>
                )}
                <button onClick={() => { setShowMyRequests(!showMyRequests); if (!showMyRequests) loadMyRequests(); }}
                  className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded text-sm hover:bg-blue-100">
                  {showMyRequests ? t('budget.hideRequests') || 'Ocultar Solicitudes' : t('budget.myRequests')}
                </button>
              </div>
            </div>


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
              <h3 className="text-sm font-bold mb-3">{t('budget.myChangeRequests') || 'Mis Solicitudes de Cambio'}</h3>
              {loadingRequests ? (
                <p className="text-center py-4 text-gray-400">{t('msg.loading')}</p>
              ) : myRequests.length === 0 ? (
                <p className="text-center py-4 text-gray-400">{t('budget.noChangeRequests') || 'No tienes solicitudes de cambio'}</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs text-gray-500">{t('label.date')}</th>
                        <th className="px-3 py-2 text-left text-xs text-gray-500">{t('table.expense')}</th>
                        <th className="px-3 py-2 text-left text-xs text-gray-500">{t('table.company')}</th>
                        <th className="px-3 py-2 text-left text-xs text-gray-500">{t('label.status')}</th>
                        <th className="px-3 py-2 text-left text-xs text-gray-500">{t('table.comment')}</th>
                        <th className="px-3 py-2 text-left text-xs text-gray-500">{t('table.approvedBy')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {myRequests.map(req => {
                        const st = statusLabel(req.status);
                        return (
                          <tr key={req.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedChangeRequest(req)}>
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
              <div className="text-center py-8">{t('msg.loading')}</div>
            ) : (
              <BudgetTable
                budgetLines={filteredLines}
                editedCells={new Map()}
                validationErrors={new Map()}
                canEdit={canEdit}
                onCellEdit={() => {}}
                onRemoveRow={handleRemoveRow}
                onRowClick={canEdit ? openEditPopup : undefined}
                userAreas={allUserAreas}
              />
            )}
          </div>
        </>
      )}

      {/* Edit Popup */}
      {editPopupLine && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">{t('budget.requestChange')}</h2>
              <button onClick={() => setEditPopupLine(null)} className="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
            </div>
            <div className="space-y-1 mb-4 text-sm">
              <div><span className="text-gray-500">{t('table.code')}:</span> {editPopupLine.expense?.code}</div>
              <div><span className="text-gray-500">{t('table.description')}:</span> {editPopupLine.expense?.shortDescription}</div>
              <div><span className="text-gray-500">{t('table.company')}:</span> {editPopupLine.financialCompany?.name}</div>
              <div><span className="text-gray-500">{t('table.currency')}:</span> {editPopupLine.currency}</div>
              {editPopupLine.technologyDirection && <div><span className="text-gray-500">{t('budget.techDirection')}:</span> {editPopupLine.technologyDirection.name}</div>}
              <div><span className="text-gray-500">{t('table.area')}:</span> {getAreaNames(editPopupLine)}</div>
            </div>
            <div className="border rounded divide-y mb-4">
              <div className="flex items-center px-4 py-2 bg-gray-50 text-xs font-medium text-gray-500">
                <span className="w-16">{t('budget.month')}</span>
                <span className="w-28 text-right">{t('budget.current')}</span>
                <span className="flex-1 text-right">{t('budget.proposed')}</span>
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
                      <input type="number" step="0.01" value={popupValues[i + 1] || '0'}
                        onChange={(e) => setPopupValues({ ...popupValues, [i + 1]: e.target.value })}
                        className="w-36 border rounded px-3 py-1.5 text-sm text-right focus:ring-2 focus:ring-accent focus:border-accent" />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-500 mb-1">{t('budget.commentOptional')}</label>
              <textarea value={popupComment} onChange={(e) => setPopupComment(e.target.value)}
                className="w-full border rounded px-3 py-2 text-sm" rows={2} placeholder={t('budget.justification')} />
            </div>
            <div className="flex justify-between items-center">
              <div className="text-sm font-semibold">Total: {fmt(popupTotal)} {editPopupLine.currency}</div>
              <div className="flex gap-2">
                <button onClick={() => setEditPopupLine(null)} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 text-sm">{t('btn.cancel')}</button>
                <button onClick={submitChangeRequest} disabled={!popupHasChanges || isSubmitting}
                  className="px-4 py-2 bg-accent text-white rounded hover:opacity-90 text-sm disabled:opacity-50">
                  {isSubmitting ? t('msg.sending') || 'Enviando...' : t('budget.sendApproval') || 'Enviar a Aprobación'}
                </button>
              </div>
            </div>
            {!popupHasChanges && <p className="text-xs text-gray-400 mt-2 text-center">{t('budget.modifyValue')}</p>}
          </div>
        </div>
      )}

      {/* Create Budget Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">{t('budget.newBudget')}</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('label.year')}</label>
                <input type="number" value={newBudgetYear} onChange={e => setNewBudgetYear(parseInt(e.target.value))}
                  className="w-full border rounded px-3 py-2 text-sm" min={2020} max={2040} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('label.version')}</label>
                <input type="text" value={newBudgetVersion} onChange={e => setNewBudgetVersion(e.target.value)}
                  className="w-full border rounded px-3 py-2 text-sm" placeholder="v1" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <HiOutlineDocumentDuplicate className="w-4 h-4 inline mr-1" />
                  {t('budget.copyFrom')}
                </label>
                <select value={sourceBudgetId} onChange={e => setSourceBudgetId(e.target.value)}
                  className="w-full border rounded px-3 py-2 text-sm">
                  <option value="">{t('budget.emptyBudget')}</option>
                  {allBudgets.map(b => (
                    <option key={b.id} value={b.id}>{b.year} - {b.version}{b.isActive ? ` (${t('budget.active')})` : ''}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-400 mt-1">{t('budget.copyNote')}</p>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setShowCreateModal(false)} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 text-sm">{t('btn.cancel')}</button>
              <button onClick={handleCreateBudget} disabled={isCreating || !newBudgetVersion.trim()}
                className="px-4 py-2 bg-accent text-white rounded hover:opacity-90 text-sm disabled:opacity-50">
                {isCreating ? t('msg.creating') || 'Creando...' : t('budget.createBudget') || 'Crear Presupuesto'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Budget Line Popup */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">{t('budget.addBudgetLine')}</h2>
              <button onClick={() => { setShowAddForm(false); setAddExpenseId(''); setAddCompanyId(''); setAddTechDirId(''); setAddMonthlyValues(Array(12).fill(0)); }} className="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('budget.expense')} *</label>
                <select value={addExpenseId} onChange={e => setAddExpenseId(e.target.value)} className="w-full border rounded px-3 py-2 text-sm">
                  <option value="">{t('budget.selectExpense')}</option>
                  {allExpenses.map(e => <option key={e.id} value={e.id}>{e.code} - {e.shortDescription}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('budget.financialCompany')} *</label>
                <select value={addCompanyId} onChange={e => setAddCompanyId(e.target.value)} className="w-full border rounded px-3 py-2 text-sm">
                  <option value="">{t('budget.selectCompany')}</option>
                  {allCompanies.map(c => <option key={c.id} value={c.id}>{c.code} - {c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('budget.techDirection')}</label>
                <select value={addTechDirId} onChange={e => setAddTechDirId(e.target.value)} className="w-full border rounded px-3 py-2 text-sm">
                  <option value="">{t('budget.noTechDirection')}</option>
                  {allTechDirections.map(td => <option key={td.id} value={td.id}>{td.code} - {td.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('saving.monthlyValues')}</label>
                <div className="grid grid-cols-6 gap-2">
                  {MONTHS.map((m, i) => (
                    <div key={i}>
                      <label className="block text-xs text-gray-500 mb-1">{m}</label>
                      <input type="number" step="0.01" min="0" value={addMonthlyValues[i] || ''}
                        onChange={(e) => { const v = [...addMonthlyValues]; v[i] = parseFloat(e.target.value) || 0; setAddMonthlyValues(v); }}
                        className="w-full border rounded px-2 py-1 text-sm text-right" />
                    </div>
                  ))}
                </div>
                <div className="mt-2 text-right text-sm font-semibold">
                  {t('table.total')}: ${fmt(addMonthlyValues.reduce((a, b) => a + b, 0))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => { setShowAddForm(false); setAddExpenseId(''); setAddCompanyId(''); setAddTechDirId(''); setAddMonthlyValues(Array(12).fill(0)); }} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 text-sm">{t('common.cancel')}</button>
              <button onClick={handleAddBudgetLine} disabled={!addExpenseId || !addCompanyId}
                className="px-4 py-2 bg-accent text-white rounded hover:opacity-90 text-sm disabled:opacity-50">{t('btn.create')}</button>
            </div>
          </div>
        </div>
      )}

      <ConfirmationDialog isOpen={!!showDeleteDialog} message={t('budget.deleteLineConfirm')} onConfirm={confirmRemoveRow} onCancel={() => setShowDeleteDialog(null)} />
      <ConfirmationDialog isOpen={showDeleteBudgetDialog} message={t('budget.deleteBudgetConfirm')} onConfirm={handleDeleteBudget} onCancel={() => setShowDeleteBudgetDialog(false)} />

      {/* Change Request Detail Popup */}
      {selectedChangeRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">{t('budget.changeRequestDetail')}</h2>
              <button onClick={() => setSelectedChangeRequest(null)} className="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
            </div>
            <div className="space-y-1 mb-4 text-sm">
              <div><span className="text-gray-500">{t('budget.expense')}:</span> {selectedChangeRequest.budgetLine?.expense?.code} - {selectedChangeRequest.budgetLine?.expense?.shortDescription}</div>
              <div><span className="text-gray-500">{t('table.company')}:</span> {selectedChangeRequest.budgetLine?.financialCompany?.name}</div>
              <div><span className="text-gray-500">{t('label.status')}:</span> <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusLabel(selectedChangeRequest.status).cls}`}>{statusLabel(selectedChangeRequest.status).text}</span></div>
              <div><span className="text-gray-500">{t('label.date')}:</span> {new Date(selectedChangeRequest.createdAt).toLocaleDateString()}</div>
              {selectedChangeRequest.comment && <div><span className="text-gray-500">{t('table.comment')}:</span> {selectedChangeRequest.comment}</div>}
              {selectedChangeRequest.approvedBy && <div><span className="text-gray-500">{t('table.approvedBy')}:</span> {selectedChangeRequest.approvedBy.fullName}</div>}
            </div>
            <div className="border rounded divide-y mb-4">
              <div className="flex items-center px-4 py-2 bg-gray-50 text-xs font-medium text-gray-500">
                <span className="w-16">{t('budget.month')}</span>
                <span className="w-28 text-right">{t('budget.previous')}</span>
                <span className="w-28 text-right">{t('budget.proposed')}</span>
                <span className="flex-1 text-right">{t('budget.difference')}</span>
              </div>
              {MONTHS.map((m, i) => {
                const current = (selectedChangeRequest.currentValues as Record<string, number>)?.[`planM${i + 1}`] || 0;
                const proposed = (selectedChangeRequest.proposedValues as Record<string, number>)?.[`planM${i + 1}`] || 0;
                const diff = proposed - current;
                const changed = diff !== 0;
                return (
                  <div key={i} className={`flex items-center px-4 py-2 ${changed ? 'bg-yellow-50' : ''}`}>
                    <span className="text-sm font-medium text-gray-600 w-16">{m}</span>
                    <span className="w-28 text-right text-sm text-gray-500">{fmt(current)}</span>
                    <span className={`w-28 text-right text-sm ${changed ? 'font-semibold text-blue-700' : 'text-gray-500'}`}>{fmt(proposed)}</span>
                    <span className={`flex-1 text-right text-sm ${diff > 0 ? 'text-red-600' : diff < 0 ? 'text-green-600' : 'text-gray-400'}`}>
                      {diff !== 0 ? (diff > 0 ? '+' : '') + fmt(diff) : '-'}
                    </span>
                  </div>
                );
              })}
              {(() => {
                const totalCurrent = Object.values((selectedChangeRequest.currentValues || {}) as Record<string, number>).reduce((s, v) => s + (v || 0), 0);
                const totalProposed = Object.values((selectedChangeRequest.proposedValues || {}) as Record<string, number>).reduce((s, v) => s + (v || 0), 0);
                const totalDiff = totalProposed - totalCurrent;
                return (
                  <div className="flex items-center px-4 py-2 bg-gray-100 font-bold">
                    <span className="text-sm w-16">Total</span>
                    <span className="w-28 text-right text-sm">{fmt(totalCurrent)}</span>
                    <span className="w-28 text-right text-sm text-blue-700">{fmt(totalProposed)}</span>
                    <span className={`flex-1 text-right text-sm ${totalDiff > 0 ? 'text-red-600' : totalDiff < 0 ? 'text-green-600' : ''}`}>
                      {totalDiff !== 0 ? (totalDiff > 0 ? '+' : '') + fmt(totalDiff) : '-'}
                    </span>
                  </div>
                );
              })()}
            </div>
            <div className="flex justify-end">
              <button onClick={() => setSelectedChangeRequest(null)} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 text-sm">{t('btn.close')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
