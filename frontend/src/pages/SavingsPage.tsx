import { useState, useEffect } from 'react';
import { savingsApi, budgetApi, budgetLineApi, financialCompanyApi, expenseCategoryApi, technologyDirectionApi } from '../services/api';
import type { Saving, Budget, BudgetLine, FinancialCompany, ExpenseCategory, TechnologyDirection } from '../types';
import { HiOutlineTrash, HiOutlinePlusCircle, HiOutlinePlay, HiOutlineXMark } from 'react-icons/hi2';
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

  const [monthlyValues, setMonthlyValues] = useState<number[]>(Array(12).fill(0));
  const [formData, setFormData] = useState({ budgetLineId: '', description: '' });

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

  const handleCreateSaving = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data: any = { ...formData };
      MONTHS.forEach((_, i) => { data[`savingM${i + 1}`] = monthlyValues[i]; });
      await savingsApi.create(data);
      setShowForm(false);
      setFormData({ budgetLineId: '', description: '' });
      setMonthlyValues(Array(12).fill(0));
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

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
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

      {/* Filters */}
      <div className="bg-white p-4 rounded shadow mb-6">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">{t('label.budget')}</label>
            <select value={selectedBudget} onChange={(e) => { setSelectedBudget(e.target.value); setShowForm(false); }} className="w-full border rounded px-3 py-2">
              <option value="">{t('label.all')}</option>
              {budgets.map(b => (<option key={b.id} value={b.id}>{b.year} - v{b.version}{b.isActive ? ` (${t('label.active').toLowerCase()})` : ''}</option>))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('table.budgetLine')}</label>
            <select value={selectedBudgetLine} onChange={(e) => setSelectedBudgetLine(e.target.value)} className="w-full border rounded px-3 py-2" disabled={!selectedBudget}>
              <option value="">{t('filter.all')}</option>
              {budgetLines.map(bl => (<option key={bl.id} value={bl.id}>{bl.expense?.code} - {bl.financialCompany?.code}</option>))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('label.status')}</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full border rounded px-3 py-2">
              <option value="">{t('label.all')}</option>
              <option value="PENDING">{t('label.pending')}</option>
              <option value="ACTIVE">{t('label.active')}</option>
            </select>
          </div>
        </div>
        <button onClick={loadSavings} className="mt-4 btn-secondary">{t('btn.filter')}</button>
      </div>

      {/* Advanced Filters */}
      <div className="bg-white p-4 rounded shadow mb-6">
        <div className="flex flex-wrap items-center gap-3">
          {availableCurrencies.length > 0 && (
            <>
              <div className="flex items-center gap-1">
                {availableCurrencies.map(currency => (
                  <button key={currency} onClick={() => toggleFilter(filterCurrencies, currency, setFilterCurrencies)}
                    className={`px-3 py-1 rounded text-xs font-medium transition-colors ${filterCurrencies.includes(currency) ? accentOn : accentOff}`}>{currency}</button>
                ))}
              </div>
              <div className="w-px h-6 bg-gray-300" />
            </>
          )}
          {allCompanies.length > 0 && (
            <>
              <div className="flex items-center gap-1">
                {allCompanies.map(company => (
                  <button key={company.id} onClick={() => toggleFilter(filterCompanyIds, company.id, setFilterCompanyIds)}
                    title={company.name} className={`px-3 py-1 rounded text-xs font-medium transition-colors ${filterCompanyIds.includes(company.id) ? accentOn : accentOff}`}>{company.code}</button>
                ))}
              </div>
              <div className="w-px h-6 bg-gray-300" />
            </>
          )}
          {allCategories.length > 0 && (
            <>
              <div className="flex items-center gap-1 flex-wrap">
                {allCategories.map(cat => (
                  <button key={cat.id} onClick={() => toggleFilter(filterCategories, cat.id, setFilterCategories)}
                    className={`px-3 py-1 rounded text-xs font-medium transition-colors ${filterCategories.includes(cat.id) ? accentOn : accentOff}`}>{cat.name}</button>
                ))}
              </div>
              <div className="w-px h-6 bg-gray-300" />
            </>
          )}
          {allTechDirections.length > 0 && (
            <>
              <div className="flex items-center gap-1 flex-wrap">
                {allTechDirections.map(td => (
                  <button key={td.id} onClick={() => toggleFilter(filterTechDirIds, td.id, setFilterTechDirIds)}
                    className={`px-3 py-1 rounded text-xs font-medium transition-colors ${filterTechDirIds.includes(td.id) ? accentOn : accentOff}`}>{td.code}</button>
                ))}
              </div>
              <div className="w-px h-6 bg-gray-300" />
            </>
          )}
          {hasActiveFilters && (
            <button onClick={clearAllFilters} className="text-accent hover:opacity-70 transition-opacity ml-auto" title={t('filter.clearFilters')}>
              <HiOutlineXMark className="w-6 h-6" />
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
              <button onClick={() => setShowForm(false)} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
            </div>
            <form onSubmit={handleCreateSaving}>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">{t('table.budgetLine')} *</label>
                  <select value={formData.budgetLineId} onChange={(e) => setFormData({ ...formData, budgetLineId: e.target.value })} className="w-full border rounded px-3 py-2" required>
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
                  {MONTHS.map((m, i) => (
                    <div key={i} className="flex items-center px-4 py-2">
                      <label className="text-sm font-medium text-gray-600 w-16">{m}</label>
                      <div className="flex-1 flex justify-end">
                        <input type="number" step="0.01" min="0" value={monthlyValues[i] || ''} onChange={(e) => { const v = [...monthlyValues]; v[i] = parseFloat(e.target.value) || 0; setMonthlyValues(v); }} className="w-36 border rounded px-3 py-1.5 text-sm text-right focus:ring-2 focus:ring-accent focus:border-accent" />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-2 text-right text-sm font-semibold">Total: ${fmt(total)}</div>
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowForm(false)} className="btn-cancel">{t('btn.cancel')}</button>
                <button type="submit" className="btn-success" disabled={total <= 0}>{t('saving.create')}</button>
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

      {deleteTarget && (
        <ConfirmationDialog
          title={t('saving.deleteSaving') || 'Eliminar Ahorro'}
          message={t('saving.confirmDelete') || '¿Estás seguro de eliminar este ahorro?'}
          onConfirm={handleDeleteSaving}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
      {activateTarget && (
        <ConfirmationDialog
          title={t('saving.activateSaving') || 'Activar Ahorro'}
          message={t('saving.confirmActivate') || '¿Estás seguro de activar este ahorro? Los valores se reflejarán en el Dashboard.'}
          onConfirm={handleActivateSaving}
          onCancel={() => setActivateTarget(null)}
        />
      )}
    </div>
  );
}
