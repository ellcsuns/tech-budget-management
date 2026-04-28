import { useState, useEffect, useRef } from 'react';
import { savingsApi, budgetApi, budgetLineApi, financialCompanyApi, expenseCategoryApi, technologyDirectionApi } from '../services/api';
import type { Saving, Budget, BudgetLine, FinancialCompany, ExpenseCategory, TechnologyDirection } from '../types';
import { HiOutlineTrash, HiOutlinePlusCircle, HiOutlinePlay, HiOutlineXMark, HiOutlinePause, HiOutlineChevronDown, HiOutlineFunnel } from 'react-icons/hi2';
import { showToast } from '../components/Toast';
import ConfirmationDialog from '../components/ConfirmationDialog';
import { fmt } from '../utils/formatters';
import { useI18n } from '../contexts/I18nContext';

const MONTHS = ['M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7', 'M8', 'M9', 'M10', 'M11', 'M12'];

export default function SavingsPage() {
  const { t } = useI18n();
  const [savings, setSavings] = useState<Saving[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [budgetLines, setBudgetLines] = useState<BudgetLine[]>([]);
  const [selectedBudget, setSelectedBudget] = useState<string>('');
  const [selectedBudgetLine, setSelectedBudgetLine] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [detailSaving, setDetailSaving] = useState<Saving | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [activateTarget, setActivateTarget] = useState<string | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<string | null>(null);

  const [monthlyValues, setMonthlyValues] = useState<number[]>(Array(12).fill(0));
  const [formData, setFormData] = useState({ budgetLineId: '', description: '' });
  const [lineSavings, setLineSavings] = useState<Saving[]>([]);

  // Filter state
  const [filterCurrencies, setFilterCurrencies] = useState<string[]>([]);
  const [filterCompanyIds, setFilterCompanyIds] = useState<string[]>([]);
  const [filterCategories, setFilterCategories] = useState<string[]>([]);
  const [filterTechDirIds, setFilterTechDirIds] = useState<string[]>([]);
  const [allCompanies, setAllCompanies] = useState<FinancialCompany[]>([]);
  const [allCategories, setAllCategories] = useState<ExpenseCategory[]>([]);
  const [allTechDirections, setAllTechDirections] = useState<TechnologyDirection[]>([]);

  useEffect(() => { loadBudgets(); loadSavings(); loadMasterData(); }, []);
  useEffect(() => { if (selectedBudget) loadBudgetLines(selectedBudget); }, [selectedBudget]);

  const activeBudgetId = budgets.find(b => b.isActive)?.id || '';
  const isActiveBudgetSelected = selectedBudget === activeBudgetId;

  const loadMasterData = async () => {
    try {
      const [compRes, catRes, techRes] = await Promise.all([
        financialCompanyApi.getAll(), expenseCategoryApi.getAll(), technologyDirectionApi.getAll()
      ]);
      setAllCompanies(compRes.data);
      setAllCategories(catRes.data);
      setAllTechDirections(techRes.data);
    } catch (error) { console.error('Error loading master data:', error); }
  };

  const loadBudgets = async () => {
    try {
      const res = await budgetApi.getAll();
      setBudgets(res.data);
      if (res.data.length > 0) {
        const active = res.data.find((b: any) => b.isActive);
        setSelectedBudget((active || res.data[0]).id);
      }
    } catch (error) { console.error('Error loading budgets:', error); }
  };

  const loadBudgetLines = async (budgetId: string) => {
    try { setBudgetLines((await budgetLineApi.getByBudget(budgetId)).data); }
    catch (error) { console.error('Error loading budget lines:', error); }
  };

  const loadSavings = async () => {
    setIsLoading(true);
    try {
      const filters: any = {};
      if (selectedBudgetLine) filters.budgetLineId = selectedBudgetLine;
      if (statusFilter) filters.status = statusFilter;
      if (selectedBudget) filters.budgetId = selectedBudget;
      setSavings((await savingsApi.getAll(filters)).data);
    } catch (error) { console.error('Error loading savings:', error); }
    finally { setIsLoading(false); }
  };

  const total = monthlyValues.reduce((a, b) => a + b, 0);

  // Compute available budget per month for the selected budget line
  const selectedBL = budgetLines.find(bl => bl.id === formData.budgetLineId);
  const monthlyAvailable = MONTHS.map((_, i) => {
    if (!selectedBL) return 0;
    const planValue = Number((selectedBL as any)[`planM${i + 1}`]) || 0;
    let existingTotal = 0;
    lineSavings.forEach(s => { existingTotal += Number((s as any)[`savingM${i + 1}`]) || 0; });
    return planValue - existingTotal;
  });
  const hasExceeded = monthlyValues.some((v, i) => v > 0 && v > monthlyAvailable[i] && selectedBL);

  const loadLineSavings = async (budgetLineId: string) => {
    if (!budgetLineId) { setLineSavings([]); return; }
    try {
      const res = await savingsApi.getAll({ budgetLineId });
      setLineSavings(res.data);
    } catch { setLineSavings([]); }
  };

  const handleCreateSaving = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data: any = { ...formData };
      MONTHS.forEach((_, i) => { data[`savingM${i + 1}`] = monthlyValues[i]; });
      await savingsApi.create(data);
      setShowForm(false);
      setFormData({ budgetLineId: '', description: '' });
      setMonthlyValues(Array(12).fill(0));
      setLineSavings([]);
      loadSavings();
      showToast(t('saving.created'), 'success');
    } catch (error: any) { showToast(error.response?.data?.error || 'Error al crear ahorro', 'error'); }
  };

  const handleDeleteSaving = async () => {
    if (!deleteTarget) return;
    try { await savingsApi.delete(deleteTarget); setDeleteTarget(null); loadSavings(); showToast(t('saving.deleted'), 'success'); }
    catch (error: any) { showToast(error.response?.data?.error || 'Error al eliminar ahorro', 'error'); setDeleteTarget(null); }
  };

  const handleActivateSaving = async () => {
    if (!activateTarget) return;
    try { await savingsApi.activate(activateTarget); setActivateTarget(null); loadSavings(); showToast(t('saving.activated'), 'success'); }
    catch (error: any) { showToast(error.response?.data?.error || 'Error al activar ahorro', 'error'); setActivateTarget(null); }
  };

  const handleDeactivateSaving = async () => {
    if (!deactivateTarget) return;
    try { await savingsApi.deactivate(deactivateTarget); setDeactivateTarget(null); loadSavings(); showToast(t('saving.deactivated') || 'Ahorro desactivado', 'success'); }
    catch (error: any) { showToast(error.response?.data?.error || 'Error al desactivar ahorro', 'error'); setDeactivateTarget(null); }
  };

  const getBudgetLineLabel = (bl?: BudgetLine) => bl ? `${bl.expense?.code || ''} - ${bl.financialCompany?.code || ''}` : '-';

  const availableCurrencies = Array.from(new Set(savings.map(s => s.budgetLine?.currency).filter(Boolean))) as string[];

  const filteredSavings = savings.filter(s => {
    const bl = s.budgetLine;
    if (!bl) return true;
    if (filterCurrencies.length > 0 && !filterCurrencies.includes(bl.currency)) return false;
    if (filterCompanyIds.length > 0 && !filterCompanyIds.includes(bl.financialCompanyId)) return false;
    if (filterCategories.length > 0) {
      const catId = (bl.expense as any)?.categoryId;
      if (!catId || !filterCategories.includes(catId)) return false;
    }
    if (filterTechDirIds.length > 0) {
      const tdId = bl.technologyDirectionId;
      if (!tdId || !filterTechDirIds.includes(tdId)) return false;
    }
    return true;
  });

  const toggleFilter = (current: string[], value: string, setter: (v: string[]) => void) => {
    setter(current.includes(value) ? current.filter(v => v !== value) : [...current, value]);
  };

  const clearAllFilters = () => {
    setFilterCurrencies([]);
    setFilterCompanyIds([]);
    setFilterCategories([]);
    setFilterTechDirIds([]);
  };

  const hasActiveFilters = filterCurrencies.length > 0 || filterCompanyIds.length > 0 || filterCategories.length > 0 || filterTechDirIds.length > 0;

  const accentOn = 'bg-accent text-white';
  const accentOff = 'bg-gray-200 text-gray-500';

  // Dropdown filter helper
  const DropBtn = ({ label, active, children, onClear }: { label: string; active: boolean; children: React.ReactNode; onClear?: () => void }) => {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
      const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
      document.addEventListener('mousedown', h);
      return () => document.removeEventListener('mousedown', h);
    }, []);
    return (
      <div ref={ref} className="relative">
        <button onClick={() => setOpen(!open)} className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all border whitespace-nowrap ${active ? 'bg-accent/10 dark:bg-accent/20 border-accent text-accent dark:text-blue-300' : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-gray-400'}`}>
          <HiOutlineFunnel className="w-3.5 h-3.5" />
          {label}
          <HiOutlineChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
        {open && (
          <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-xl z-30 min-w-[200px] max-h-[280px] overflow-y-auto py-1">
            {onClear && active && <button onClick={onClear} className="w-full text-left px-3 py-1.5 text-xs text-accent hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700">Limpiar</button>}
            {children}
          </div>
        )}
      </div>
    );
  };

  const ChkItem = ({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) => (
    <button onClick={onChange} className={`w-full text-left px-3 py-1.5 text-xs flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700 ${checked ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400 dark:text-gray-500'}`}>
      <span className={`w-3.5 h-3.5 rounded border flex-shrink-0 flex items-center justify-center ${checked ? 'bg-accent border-accent text-white' : 'border-gray-300 dark:border-gray-600'}`}>
        {checked && <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
      </span>
      {label}
    </button>
  );

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          {!isActiveBudgetSelected && selectedBudget && (
            <span className="text-sm text-amber-600 bg-amber-50 px-3 py-1 rounded">{t('saving.readOnly')}</span>
          )}
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2" disabled={!isActiveBudgetSelected}>
          <HiOutlinePlusCircle className="w-5 h-5" />
          {showForm ? t('btn.cancel') : t('saving.new')}
        </button>
      </div>

      {/* Filters - single line dropdowns */}
      <div className="bg-white dark:bg-gray-800 p-3 rounded shadow mb-4">
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Budget dropdown */}
          <DropBtn label={selectedBudget ? budgets.find(b => b.id === selectedBudget)?.year + ' v' + budgets.find(b => b.id === selectedBudget)?.version : (t('label.budget') || 'Presupuesto')} active={!!selectedBudget}>
            {budgets.map(b => (
              <ChkItem key={b.id} label={`${b.year} - v${b.version}${b.isActive ? ` (${t('label.active').toLowerCase()})` : ''}`} checked={selectedBudget === b.id} onChange={() => { setSelectedBudget(b.id); setShowForm(false); setLineSavings([]); loadSavings(); }} />
            ))}
          </DropBtn>

          {/* Budget Line dropdown */}
          <DropBtn label={selectedBudgetLine ? (budgetLines.find(bl => bl.id === selectedBudgetLine)?.expense?.code || t('table.budgetLine')) : (t('table.budgetLine') || 'Línea')} active={!!selectedBudgetLine} onClear={() => { setSelectedBudgetLine(''); }}>
            {budgetLines.map(bl => (
              <ChkItem key={bl.id} label={`${bl.expense?.code} - ${bl.financialCompany?.code}`} checked={selectedBudgetLine === bl.id} onChange={() => setSelectedBudgetLine(bl.id)} />
            ))}
          </DropBtn>

          {/* Status dropdown */}
          <DropBtn label={statusFilter ? (statusFilter === 'ACTIVE' ? t('label.active') : t('label.pending')) : (t('label.status') || 'Estado')} active={!!statusFilter} onClear={() => setStatusFilter('')}>
            <ChkItem label={t('label.pending') || 'Pendiente'} checked={statusFilter === 'PENDING'} onChange={() => setStatusFilter(statusFilter === 'PENDING' ? '' : 'PENDING')} />
            <ChkItem label={t('label.active') || 'Activo'} checked={statusFilter === 'ACTIVE'} onChange={() => setStatusFilter(statusFilter === 'ACTIVE' ? '' : 'ACTIVE')} />
          </DropBtn>

          {/* Currency dropdown */}
          {availableCurrencies.length > 0 && (
            <DropBtn label={filterCurrencies.length > 0 ? `${t('label.currency') || 'Moneda'} (${filterCurrencies.length})` : (t('label.currency') || 'Moneda')} active={filterCurrencies.length > 0} onClear={() => setFilterCurrencies([])}>
              {availableCurrencies.map(c => (
                <ChkItem key={c} label={c} checked={filterCurrencies.length === 0 || filterCurrencies.includes(c)} onChange={() => toggleFilter(filterCurrencies, c, setFilterCurrencies)} />
              ))}
            </DropBtn>
          )}

          {/* Company dropdown */}
          {allCompanies.length > 0 && (
            <DropBtn label={filterCompanyIds.length > 0 ? `${t('label.company') || 'Empresa'} (${filterCompanyIds.length})` : (t('label.company') || 'Empresa')} active={filterCompanyIds.length > 0} onClear={() => setFilterCompanyIds([])}>
              {allCompanies.map(c => (
                <ChkItem key={c.id} label={`${c.code} — ${c.name}`} checked={filterCompanyIds.length === 0 || filterCompanyIds.includes(c.id)} onChange={() => toggleFilter(filterCompanyIds, c.id, setFilterCompanyIds)} />
              ))}
            </DropBtn>
          )}

          {/* Category dropdown */}
          {allCategories.length > 0 && (
            <DropBtn label={filterCategories.length > 0 ? `${t('label.category') || 'Categoría'} (${filterCategories.length})` : (t('label.category') || 'Categoría')} active={filterCategories.length > 0} onClear={() => setFilterCategories([])}>
              {allCategories.map(c => (
                <ChkItem key={c.id} label={c.name} checked={filterCategories.length === 0 || filterCategories.includes(c.id)} onChange={() => toggleFilter(filterCategories, c.id, setFilterCategories)} />
              ))}
            </DropBtn>
          )}

          <button onClick={loadSavings} className="px-3 py-1.5 text-xs font-medium bg-accent text-white rounded-md hover:opacity-90 transition-opacity">{t('btn.filter')}</button>

          {hasActiveFilters && (
            <button onClick={clearAllFilters} className="inline-flex items-center gap-1 px-2 py-1.5 text-xs text-accent hover:opacity-70 ml-auto">
              <HiOutlineXMark className="w-4 h-4" />
              {t('filter.clear') || 'Limpiar'}
            </button>
          )}
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">{t('saving.new')}</h2>
              <button onClick={() => { setShowForm(false); setLineSavings([]); }} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
            </div>
            <form onSubmit={handleCreateSaving}>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">{t('table.budgetLine')} *</label>
                  <select value={formData.budgetLineId} onChange={(e) => { setFormData({ ...formData, budgetLineId: e.target.value }); loadLineSavings(e.target.value); }} className="w-full border rounded px-3 py-2" required>
                    <option value="">{t('msg.select') || 'Seleccionar'}</option>
                    {budgetLines.map(bl => (<option key={bl.id} value={bl.id}>{bl.expense?.code} - {bl.expense?.shortDescription} ({bl.financialCompany?.code})</option>))}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">{t('label.description')} *</label>
                  <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full border rounded px-3 py-2" rows={2} required />
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">{t('saving.monthlyValues')}</label>
                <div className="border rounded divide-y">
                  <div className="flex items-center px-4 py-2 bg-gray-50 text-xs text-gray-500 font-medium">
                    <span className="w-16">{t('label.month')}</span>
                    <span className="flex-1 text-right">{t('saving.availableBudget') || 'Disponible'}</span>
                    <span className="w-36 text-right ml-4">{t('saving.savingValue') || 'Ahorro'}</span>
                  </div>
                  {MONTHS.map((m, i) => {
                    const available = monthlyAvailable[i];
                    const exceeded = selectedBL && monthlyValues[i] > 0 && monthlyValues[i] > available;
                    return (
                      <div key={i} className={`flex items-center px-4 py-2 ${exceeded ? 'bg-red-50' : ''}`}>
                        <label className="text-sm font-medium text-gray-600 w-16">{m}</label>
                        <div className="flex-1 text-right text-sm">
                          {selectedBL ? (
                            <span className={exceeded ? 'text-red-600 font-medium' : 'text-gray-500'}>{fmt(available)}</span>
                          ) : (
                            <span className="text-gray-300">-</span>
                          )}
                        </div>
                        <div className="w-36 ml-4">
                          <input type="number" step="0.01" min="0" value={monthlyValues[i] || ''} onChange={(e) => { const v = [...monthlyValues]; v[i] = parseFloat(e.target.value) || 0; setMonthlyValues(v); }}
                            className={`w-full border rounded px-3 py-1.5 text-sm text-right focus:ring-2 focus:ring-accent focus:border-accent ${exceeded ? 'border-red-400 text-red-600' : ''}`} />
                        </div>
                      </div>
                    );
                  })}
                </div>
                {hasExceeded && (
                  <p className="mt-1 text-xs text-red-600">{t('saving.exceedsBudget') || 'El ahorro excede el presupuesto disponible en uno o más meses'}</p>
                )}
                <div className="mt-2 text-right text-sm font-semibold">Total: ${fmt(total)}</div>
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => { setShowForm(false); setLineSavings([]); }} className="btn-cancel">{t('btn.cancel')}</button>
                <button type="submit" className="btn-success" disabled={total <= 0 || hasExceeded}>{t('saving.create')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded shadow">
        {isLoading ? (
          <div className="p-8 text-center">{t('msg.loading')}</div>
        ) : filteredSavings.length === 0 ? (
          <div className="p-8 text-center text-gray-500">{t('saving.noRecords') || 'No hay ahorros registrados'}</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 text-left">{t('table.budgetLine')}</th>
                <th className="p-3 text-left">{t('label.description')}</th>
                <th className="p-3 text-right">{t('label.amount')}</th>
                <th className="p-3 text-left">{t('label.status')}</th>
                <th className="p-3 text-left">{t('saving.createdBy') || 'Creado por'}</th>
                <th className="p-3 text-left">{t('label.date')}</th>
                <th className="p-3 text-left">{t('label.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredSavings.map(saving => (
                <tr key={saving.id} className="border-t hover:bg-gray-50 cursor-pointer" onClick={() => setDetailSaving(saving)}>
                  <td className="p-3">{getBudgetLineLabel(saving.budgetLine)}</td>
                  <td className="p-3">{saving.description}</td>
                  <td className="p-3 text-right">${fmt(MONTHS.reduce((sum, _, i) => sum + (Number((saving as any)[`savingM${i + 1}`]) || 0), 0))}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded text-xs ${saving.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {saving.status === 'ACTIVE' ? t('label.active') : t('label.pending')}
                    </span>
                  </td>
                  <td className="p-3">{saving.user?.fullName}</td>
                  <td className="p-3">{new Date(saving.createdAt).toLocaleDateString()}</td>
                  <td className="p-3 flex gap-1" onClick={(e) => e.stopPropagation()}>
                    {saving.status === 'PENDING' && isActiveBudgetSelected && (
                      <>
                        <button onClick={() => setActivateTarget(saving.id)} className="icon-btn-success" title={t('saving.activateSaving')}>
                          <HiOutlinePlay className="w-5 h-5" />
                        </button>
                        <button onClick={() => setDeleteTarget(saving.id)} className="icon-btn-danger" title={t('saving.deleteSaving')}>
                          <HiOutlineTrash className="w-5 h-5" />
                        </button>
                      </>
                    )}
                    {saving.status === 'ACTIVE' && isActiveBudgetSelected && (
                      <button onClick={() => setDeactivateTarget(saving.id)} className="icon-btn-warning" title={t('saving.deactivateSaving') || 'Desactivar ahorro'}>
                        <HiOutlinePause className="w-5 h-5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Detail Popup */}
      {detailSaving && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[80vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">{t('saving.detail') || 'Detalle del Ahorro'}</h2>
              <button onClick={() => setDetailSaving(null)} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
              <div><span className="text-gray-500">{t('saving.line') || 'Línea'}:</span> {getBudgetLineLabel(detailSaving.budgetLine)}</div>
              <div><span className="text-gray-500">{t('label.status')}:</span> <span className={`px-2 py-0.5 rounded text-xs ${detailSaving.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{detailSaving.status === 'ACTIVE' ? t('label.active') : t('label.pending')}</span></div>
              <div><span className="text-gray-500">{t('label.description')}:</span> {detailSaving.description}</div>
              <div><span className="text-gray-500">{t('saving.createdBy') || 'Creado por'}:</span> {detailSaving.user?.fullName}</div>
            </div>
            <table className="w-full text-sm divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left">{t('label.month')}</th>
                  <th className="px-3 py-2 text-right">{t('saving.savingValue') || 'Valor Ahorro'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {MONTHS.map((m, i) => {
                  const val = Number((detailSaving as any)[`savingM${i + 1}`]) || 0;
                  return (
                    <tr key={i} className={val > 0 ? 'bg-amber-50' : ''}>
                      <td className="px-3 py-2">{m}</td>
                      <td className="px-3 py-2 text-right">{val > 0 ? `$${fmt(val)}` : '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-gray-50 font-semibold">
                <tr>
                  <td className="px-3 py-2">Total</td>
                  <td className="px-3 py-2 text-right">${fmt(MONTHS.reduce((sum, _, i) => sum + (Number((detailSaving as any)[`savingM${i + 1}`]) || 0), 0))}</td>
                </tr>
              </tfoot>
            </table>
            <div className="mt-4 flex justify-end">
              <button onClick={() => setDetailSaving(null)} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 text-sm">{t('btn.close')}</button>
            </div>
          </div>
        </div>
      )}

      <ConfirmationDialog
        isOpen={!!deleteTarget}
        title={t('saving.deleteSaving') || 'Eliminar Ahorro'}
        message={t('saving.confirmDelete') || '¿Estás seguro de eliminar este ahorro?'}
        onConfirm={handleDeleteSaving}
        onCancel={() => setDeleteTarget(null)}
      />
      <ConfirmationDialog
        isOpen={!!activateTarget}
        title={t('saving.activateSaving') || 'Activar Ahorro'}
        message={t('saving.confirmActivate') || '¿Estás seguro de activar este ahorro? Los valores se reflejarán en el Dashboard.'}
        onConfirm={handleActivateSaving}
        onCancel={() => setActivateTarget(null)}
      />
      <ConfirmationDialog
        isOpen={!!deactivateTarget}
        title={t('saving.deactivateSaving') || 'Desactivar Ahorro'}
        message={t('saving.confirmDeactivate') || '¿Estás seguro de desactivar este ahorro? Los valores dejarán de reflejarse en el Dashboard.'}
        onConfirm={handleDeactivateSaving}
        onCancel={() => setDeactivateTarget(null)}
      />
    </div>
  );
}
