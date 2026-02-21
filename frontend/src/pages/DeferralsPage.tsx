import { useState, useEffect } from 'react';
import { budgetApi, budgetLineApi, deferralApi } from '../services/api';
import type { Budget, BudgetLine, Deferral } from '../types';
import { HiOutlineTrash, HiOutlinePlusCircle } from 'react-icons/hi2';
import { showToast } from '../components/Toast';
import ConfirmationDialog from '../components/ConfirmationDialog';
import { useI18n } from '../contexts/I18nContext';

const MONTHS = ['M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7', 'M8', 'M9', 'M10', 'M11', 'M12'];

export default function DeferralsPage() {
  const { t } = useI18n();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [selectedBudget, setSelectedBudget] = useState<string>('');
  const [budgetLines, setBudgetLines] = useState<BudgetLine[]>([]);
  const [deferrals, setDeferrals] = useState<Deferral[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [detailDeferral, setDetailDeferral] = useState<Deferral | null>(null);
  const [searchText, setSearchText] = useState('');
  const [selectedBudgetLine, setSelectedBudgetLine] = useState<BudgetLine | null>(null);
  const [form, setForm] = useState({
    description: '',
    totalAmount: '',
    startMonth: '1',
    endMonth: '12'
  });

  useEffect(() => { loadBudgets(); }, []);
  useEffect(() => {
    if (selectedBudget) loadData(selectedBudget);
  }, [selectedBudget]);

  const loadBudgets = async () => {
    try {
      const res = await budgetApi.getAll();
      setBudgets(res.data);
      if (res.data.length > 0) {
        const active = res.data.find((b: any) => b.isActive);
        setSelectedBudget((active || res.data[0]).id);
      }
    } catch (error) { console.error('Error:', error); }
    finally { setLoading(false); }
  };

  const loadData = async (budgetId: string) => {
    try {
      setLoading(true);
      const [linesRes, defRes] = await Promise.all([
        budgetLineApi.getByBudget(budgetId),
        deferralApi.getByBudget(budgetId)
      ]);
      setBudgetLines(linesRes.data);
      setDeferrals(defRes.data);
    } catch (error) { console.error('Error:', error); }
    finally { setLoading(false); }
  };

  const filteredLines = budgetLines.filter(bl =>
    bl.expense?.code?.toLowerCase().includes(searchText.toLowerCase()) ||
    bl.expense?.shortDescription?.toLowerCase().includes(searchText.toLowerCase()) ||
    bl.financialCompany?.name?.toLowerCase().includes(searchText.toLowerCase())
  );

  const handleSelectBudgetLine = (bl: BudgetLine) => {
    setSelectedBudgetLine(bl);
    setSearchText(`${bl.expense?.code} - ${bl.expense?.shortDescription} (${bl.financialCompany?.name})`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBudgetLine) return;

    if (parseInt(form.startMonth) >= parseInt(form.endMonth)) {
      showToast(t('deferral.startBeforeEnd'), 'error');
      return;
    }

    try {
      await deferralApi.create({
        budgetLineId: selectedBudgetLine.id,
        description: form.description,
        totalAmount: parseFloat(form.totalAmount),
        startMonth: parseInt(form.startMonth),
        endMonth: parseInt(form.endMonth)
      });
      setShowForm(false);
      setForm({ description: '', totalAmount: '', startMonth: '1', endMonth: '12' });
      setSelectedBudgetLine(null);
      setSearchText('');
      loadData(selectedBudget);
    } catch (error: any) {
      showToast(error.response?.data?.error || 'Error al crear diferido', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    setDeleteTargetId(id);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!deleteTargetId) return;
    try { await deferralApi.delete(deleteTargetId); loadData(selectedBudget); }
    catch (error) { console.error('Error:', error); }
    setShowDeleteDialog(false);
    setDeleteTargetId(null);
  };

  const getBudgetLineLabel = (bl?: BudgetLine) => {
    if (!bl) return '-';
    return `${bl.expense?.code || ''} - ${bl.expense?.shortDescription || ''} (${bl.financialCompany?.name || ''})`;
  };

  if (loading && !selectedBudget) return <div className="text-center py-8">{t('msg.loading')}</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div />
        <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2">
          <HiOutlinePlusCircle className="w-5 h-5" />
          {showForm ? t('btn.cancel') : t('deferral.new')}
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="max-w-md mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">{t('label.budget')}</label>
          <select value={selectedBudget} onChange={(e) => setSelectedBudget(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md">
            {budgets.map((b) => (<option key={b.id} value={b.id}>{b.year} - {b.version}</option>))}
          </select>
        </div>

        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold">{t('deferral.new')}</h2>
                <button onClick={() => { setShowForm(false); setSelectedBudgetLine(null); setSearchText(''); }} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">{t('table.budgetLine')} *</label>
                  <input type="text" value={searchText} onChange={(e) => { setSearchText(e.target.value); setSelectedBudgetLine(null); }}
                    placeholder={t('deferral.searchLine')} className="w-full border rounded px-3 py-2" />
                  {searchText && !selectedBudgetLine && filteredLines.length > 0 && (
                    <div className="border rounded mt-1 max-h-40 overflow-y-auto bg-white">
                      {filteredLines.slice(0, 10).map(bl => (
                        <div key={bl.id} onClick={() => handleSelectBudgetLine(bl)} className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm">
                          {bl.expense?.code} - {bl.expense?.shortDescription} ({bl.financialCompany?.name})
                        </div>
                      ))}
                    </div>
                  )}
                  {selectedBudgetLine && <p className="text-sm text-green-600 mt-1">✓ {t('table.budgetLine')}: {selectedBudgetLine.expense?.code}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t('label.description')} *</label>
                  <input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full border rounded px-3 py-2" required />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">{t('deferral.totalAmount')} *</label>
                    <input type="number" step="0.01" value={form.totalAmount} onChange={(e) => setForm({ ...form, totalAmount: e.target.value })} className="w-full border rounded px-3 py-2" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">{t('deferral.startMonth')} *</label>
                    <select value={form.startMonth} onChange={(e) => setForm({ ...form, startMonth: e.target.value })} className="w-full border rounded px-3 py-2">
                      {MONTHS.map((m, i) => (<option key={i} value={i + 1}>{m}</option>))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">{t('deferral.endMonth')} *</label>
                    <select value={form.endMonth} onChange={(e) => setForm({ ...form, endMonth: e.target.value })} className="w-full border rounded px-3 py-2">
                      {MONTHS.map((m, i) => (<option key={i} value={i + 1}>{m}</option>))}
                    </select>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => { setShowForm(false); setSelectedBudgetLine(null); setSearchText(''); }} className="btn-cancel">{t('btn.cancel')}</button>
                  <button type="submit" disabled={!selectedBudgetLine} className="btn-success disabled:opacity-50">{t('deferral.create')}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {deferrals.length === 0 ? (
          <p className="text-gray-500 text-center py-8">{t('deferral.noRecords')}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('table.budgetLine')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('label.description')}</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">{t('label.amount')}</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">{t('deferral.period')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('saving.createdBy')}</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">{t('label.actions')}</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {deferrals.map((def) => (
                  <tr key={def.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setDetailDeferral(def)}>
                    <td className="px-4 py-3 text-sm">{getBudgetLineLabel(def.budgetLine)}</td>
                    <td className="px-4 py-3 text-sm">{def.description}</td>
                    <td className="px-4 py-3 text-sm text-right">${Number(def.totalAmount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td className="px-4 py-3 text-sm text-center">{MONTHS[def.startMonth - 1]} - {MONTHS[def.endMonth - 1]}</td>
                    <td className="px-4 py-3 text-sm">{def.user?.fullName || def.createdBy}</td>
                    <td className="px-4 py-3 text-sm text-center" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => handleDelete(def.id)} className="icon-btn-danger" title={t('btn.delete')}>
                        <HiOutlineTrash className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Popup */}
      {detailDeferral && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[80vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">{t('deferral.detail') || 'Detalle del Diferido'}</h2>
              <button onClick={() => setDetailDeferral(null)} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
            </div>
            <div className="space-y-3 text-sm mb-4">
              <div><span className="text-gray-500">{t('table.budgetLine')}:</span> {getBudgetLineLabel(detailDeferral.budgetLine)}</div>
              <div><span className="text-gray-500">{t('label.description')}:</span> {detailDeferral.description}</div>
              <div><span className="text-gray-500">{t('deferral.totalAmount') || 'Monto Total'}:</span> <span className="font-semibold">${Number(detailDeferral.totalAmount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
              <div><span className="text-gray-500">{t('deferral.period') || 'Período'}:</span> {MONTHS[detailDeferral.startMonth - 1]} - {MONTHS[detailDeferral.endMonth - 1]}</div>
              <div><span className="text-gray-500">{t('saving.createdBy') || 'Creado por'}:</span> {detailDeferral.user?.fullName || detailDeferral.createdBy}</div>
              <div><span className="text-gray-500">{t('label.date')}:</span> {new Date(detailDeferral.createdAt).toLocaleDateString()}</div>
            </div>
            {/* Monthly distribution */}
            <table className="w-full text-sm divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left">{t('label.month')}</th>
                  <th className="px-3 py-2 text-right">{t('label.value') || 'Valor'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {MONTHS.map((m, i) => {
                  const monthNum = i + 1;
                  const inRange = monthNum >= detailDeferral.startMonth && monthNum <= detailDeferral.endMonth;
                  const monthCount = detailDeferral.endMonth - detailDeferral.startMonth + 1;
                  const monthlyAmount = inRange ? Number(detailDeferral.totalAmount) / monthCount : 0;
                  return (
                    <tr key={i} className={inRange ? 'bg-blue-50' : ''}>
                      <td className="px-3 py-2">{m}</td>
                      <td className="px-3 py-2 text-right">{inRange ? `$${monthlyAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-gray-50 font-semibold">
                <tr>
                  <td className="px-3 py-2">Total</td>
                  <td className="px-3 py-2 text-right">${Number(detailDeferral.totalAmount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>
              </tfoot>
            </table>
            <div className="mt-4 flex justify-end">
              <button onClick={() => setDetailDeferral(null)} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 text-sm">{t('btn.close')}</button>
            </div>
          </div>
        </div>
      )}

      <ConfirmationDialog isOpen={showDeleteDialog} message={t('deferral.deleteConfirm')} onConfirm={confirmDelete} onCancel={() => { setShowDeleteDialog(false); setDeleteTargetId(null); }} />
    </div>
  );
}
