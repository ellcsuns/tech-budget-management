import { useState, useEffect, useMemo } from 'react';
import { changeRequestApi } from '../services/api';
import type { ChangeRequest } from '../types';
import { fmt } from '../utils/formatters';
import { HiOutlineCheckCircle, HiOutlineXMark, HiOutlineChevronDown, HiOutlineChevronRight } from 'react-icons/hi2';
import { showToast } from '../components/Toast';
import ConfirmationDialog from '../components/ConfirmationDialog';
import { useI18n } from '../contexts/I18nContext';
import { useActiveBudget } from '../contexts/ActiveBudgetContext';

const MONTHS = ['M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7', 'M8', 'M9', 'M10', 'M11', 'M12'];

export default function ApprovalsPage() {
  const { t } = useI18n();
  const { activeBudget } = useActiveBudget();
  const [requests, setRequests] = useState<ChangeRequest[]>([]);
  const [resolvedRequests, setResolvedRequests] = useState<ChangeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<ChangeRequest | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isProcessing, setIsProcessing] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ type: 'approve' | 'reject' | 'approveMultiple'; id?: string } | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [historyDetailRequest, setHistoryDetailRequest] = useState<ChangeRequest | null>(null);

  // History filters
  const [filterBudgetId, setFilterBudgetId] = useState<string>('');
  const [filterRequestedBy, setFilterRequestedBy] = useState<string>('');
  const [filterExpense, setFilterExpense] = useState<string>('');

  useEffect(() => { loadPending(); }, []);

  // Set default budget filter to active budget once loaded
  useEffect(() => {
    if (activeBudget && !filterBudgetId) {
      setFilterBudgetId(activeBudget.id);
    }
  }, [activeBudget]);

  const loadPending = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await changeRequestApi.getPending();
      setRequests(Array.isArray(res.data) ? res.data : []);
      setSelectedIds(new Set());
    } catch (err: any) {
      console.error('Error:', err);
      setError(err?.response?.data?.error || 'Error al cargar solicitudes pendientes');
      setRequests([]);
    } finally { setLoading(false); }
  };

  const loadHistory = async () => {
    try {
      setLoadingHistory(true);
      const res = await changeRequestApi.getResolved();
      setResolvedRequests(Array.isArray(res.data) ? res.data : []);
    } catch (err: any) {
      console.error('Error loading history:', err);
      setResolvedRequests([]);
    } finally { setLoadingHistory(false); }
  };

  const toggleHistory = () => {
    const next = !showHistory;
    setShowHistory(next);
    if (next && resolvedRequests.length === 0) loadHistory();
  };

  // Extract unique values for filter dropdowns
  const historyBudgets = useMemo(() => {
    const map = new Map<string, string>();
    resolvedRequests.forEach(r => {
      const b = r.budgetLine?.budget;
      if (b) map.set(b.id || '', `${b.year} ${b.version}`);
    });
    return Array.from(map.entries());
  }, [resolvedRequests]);

  const historyRequesters = useMemo(() => {
    const map = new Map<string, string>();
    resolvedRequests.forEach(r => {
      if (r.requestedBy) map.set(r.requestedBy.fullName, r.requestedBy.fullName);
    });
    return Array.from(map.values()).sort();
  }, [resolvedRequests]);

  const historyExpenses = useMemo(() => {
    const map = new Map<string, string>();
    resolvedRequests.forEach(r => {
      const exp = r.budgetLine?.expense;
      if (exp) map.set(exp.code, `${exp.code} - ${exp.shortDescription}`);
    });
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [resolvedRequests]);

  // Filtered history
  const filteredHistory = useMemo(() => {
    return resolvedRequests.filter(r => {
      if (filterBudgetId && r.budgetLine?.budget?.id !== filterBudgetId) return false;
      if (filterRequestedBy && r.requestedBy?.fullName !== filterRequestedBy) return false;
      if (filterExpense && r.budgetLine?.expense?.code !== filterExpense) return false;
      return true;
    });
  }, [resolvedRequests, filterBudgetId, filterRequestedBy, filterExpense]);

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedIds(next);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === requests.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(requests.map(r => r.id)));
  };

  const handleApprove = async (id: string) => { setConfirmAction({ type: 'approve', id }); };
  const handleApproveMultiple = async () => { if (selectedIds.size === 0) return; setConfirmAction({ type: 'approveMultiple' }); };
  const handleReject = async (id: string) => { setConfirmAction({ type: 'reject', id }); };

  const executeConfirmAction = async () => {
    if (!confirmAction) return;
    try {
      setIsProcessing(true);
      if (confirmAction.type === 'approve' && confirmAction.id) {
        await changeRequestApi.approve(confirmAction.id);
        setSelectedRequest(null);
      } else if (confirmAction.type === 'approveMultiple') {
        await changeRequestApi.approveMultiple(Array.from(selectedIds));
        showToast(`${selectedIds.size} solicitud(es) aprobadas exitosamente`, 'success');
      } else if (confirmAction.type === 'reject' && confirmAction.id) {
        await changeRequestApi.reject(confirmAction.id);
        setSelectedRequest(null);
      }
      loadPending();
      if (showHistory) loadHistory();
    } catch (error: any) {
      showToast(error.response?.data?.error || 'Error al procesar solicitud', 'error');
    } finally {
      setIsProcessing(false);
      setConfirmAction(null);
    }
  };

  const renderMonthComparison = (req: ChangeRequest) => (
    <div className="border rounded divide-y mb-4">
      <div className="flex items-center px-4 py-2 bg-gray-50 text-xs font-medium text-gray-500">
        <span className="w-16">{t('budget.month')}</span>
        <span className="w-28 text-right">{t('approval.current')}</span>
        <span className="w-28 text-right">{t('approval.proposed')}</span>
        <span className="flex-1 text-right">{t('label.difference')}</span>
      </div>
      {MONTHS.map((m, i) => {
        const current = (req.currentValues as Record<string, number>)?.[`planM${i + 1}`] || 0;
        const proposed = (req.proposedValues as Record<string, number>)?.[`planM${i + 1}`] || 0;
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
        const totalCurrent = Object.values(req.currentValues as Record<string, number>).reduce((s, v) => s + (v || 0), 0);
        const totalProposed = Object.values(req.proposedValues as Record<string, number>).reduce((s, v) => s + (v || 0), 0);
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
  );

  if (loading) return <div className="text-center py-8">{t('msg.loading')}</div>;
  if (error) return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">{t('approval.title')}</h1>
      <div className="bg-white rounded-lg shadow p-8 text-center text-red-500">{error}</div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Pending Section */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">{t('approval.title')}</h1>
        {selectedIds.size > 0 && (
          <button onClick={handleApproveMultiple} disabled={isProcessing}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm disabled:opacity-50">
            {t('btn.approve')} {selectedIds.size} {t('approval.selected') || 'seleccionada(s)'}
          </button>
        )}
      </div>

      {requests.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">{t('approval.noPending')}</div>
      ) : (
        <div className="bg-white rounded-lg shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-center">
                  <input type="checkbox" checked={selectedIds.size === requests.length && requests.length > 0}
                    onChange={toggleSelectAll} className="rounded" />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('table.expense')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('table.company')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('table.budget')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('table.requestedBy')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('table.comment')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('table.date')}</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">{t('table.actions')}</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {requests.map(req => (
                <tr key={req.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedRequest(req)}>
                  <td className="px-4 py-3 text-center" onClick={e => e.stopPropagation()}>
                    <input type="checkbox" checked={selectedIds.has(req.id)} onChange={() => toggleSelect(req.id)} className="rounded" />
                  </td>
                  <td className="px-4 py-3 text-sm">{req.budgetLine?.expense?.code} - {req.budgetLine?.expense?.shortDescription}</td>
                  <td className="px-4 py-3 text-sm">{req.budgetLine?.financialCompany?.name}</td>
                  <td className="px-4 py-3 text-sm">{req.budgetLine?.budget?.year} {req.budgetLine?.budget?.version}</td>
                  <td className="px-4 py-3 text-sm">{req.requestedBy?.fullName}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{req.comment || '-'}</td>
                  <td className="px-4 py-3 text-sm">{new Date(req.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-center" onClick={e => e.stopPropagation()}>
                    <div className="flex justify-center gap-2">
                      <button onClick={() => handleApprove(req.id)} disabled={isProcessing} className="text-green-600 hover:text-green-800" title={t('btn.approve')}>
                        <HiOutlineCheckCircle className="w-5 h-5" />
                      </button>
                      <button onClick={() => handleReject(req.id)} disabled={isProcessing} className="text-red-600 hover:text-red-800" title={t('btn.reject')}>
                        <HiOutlineXMark className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* History Section */}
      <div className="bg-white rounded-lg shadow">
        <button onClick={toggleHistory}
          className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50 transition-colors">
          <div className="flex items-center gap-2">
            {showHistory ? <HiOutlineChevronDown className="w-5 h-5 text-gray-500" /> : <HiOutlineChevronRight className="w-5 h-5 text-gray-500" />}
            <h2 className="text-lg font-semibold text-gray-800">{t('approval.history') || 'Historial de Aprobaciones'}</h2>
            {filteredHistory.length > 0 && (
              <span className="bg-gray-200 text-gray-600 text-xs px-2 py-0.5 rounded-full">{filteredHistory.length}</span>
            )}
          </div>
        </button>

        {showHistory && (
          <div className="border-t">
            {/* Filters */}
            <div className="px-6 py-3 bg-gray-50 border-b flex flex-wrap gap-3 items-center">
              <select value={filterBudgetId} onChange={e => setFilterBudgetId(e.target.value)}
                className="border rounded px-2 py-1.5 text-sm min-w-[180px]">
                <option value="">{t('approval.allBudgets') || 'Todos los presupuestos'}</option>
                {historyBudgets.map(([id, label]) => (
                  <option key={id} value={id}>{label}</option>
                ))}
              </select>
              <select value={filterRequestedBy} onChange={e => setFilterRequestedBy(e.target.value)}
                className="border rounded px-2 py-1.5 text-sm min-w-[160px]">
                <option value="">{t('approval.allRequesters') || 'Todos los solicitantes'}</option>
                {historyRequesters.map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
              <select value={filterExpense} onChange={e => setFilterExpense(e.target.value)}
                className="border rounded px-2 py-1.5 text-sm min-w-[200px]">
                <option value="">{t('approval.allExpenses') || 'Todos los gastos'}</option>
                {historyExpenses.map(([code, label]) => (
                  <option key={code} value={code}>{label}</option>
                ))}
              </select>
              {(filterBudgetId || filterRequestedBy || filterExpense) && (
                <button onClick={() => { setFilterBudgetId(''); setFilterRequestedBy(''); setFilterExpense(''); }}
                  className="text-xs text-gray-500 hover:text-gray-700 underline">
                  {t('filter.clearFilters') || 'Limpiar filtros'}
                </button>
              )}
            </div>

            {loadingHistory ? (
              <div className="p-8 text-center text-gray-500">{t('msg.loading')}</div>
            ) : filteredHistory.length === 0 ? (
              <div className="p-8 text-center text-gray-500">{t('approval.noHistory') || 'No hay aprobaciones pasadas'}</div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('label.status')}</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('table.expense')}</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('table.company')}</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('table.budget')}</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('table.requestedBy')}</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('approval.resolvedBy') || 'Resuelto por'}</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('approval.resolvedAt') || 'Fecha resolución'}</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredHistory.map(req => (
                    <tr key={req.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setHistoryDetailRequest(req)}>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          req.status === 'APPROVED' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {req.status === 'APPROVED' ? (t('approval.approved') || 'Aprobada') : (t('approval.rejected') || 'Rechazada')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">{req.budgetLine?.expense?.code} - {req.budgetLine?.expense?.shortDescription}</td>
                      <td className="px-4 py-3 text-sm">{req.budgetLine?.financialCompany?.name}</td>
                      <td className="px-4 py-3 text-sm">{req.budgetLine?.budget?.year} {req.budgetLine?.budget?.version}</td>
                      <td className="px-4 py-3 text-sm">{req.requestedBy?.fullName}</td>
                      <td className="px-4 py-3 text-sm">{req.approvedBy?.fullName || '-'}</td>
                      <td className="px-4 py-3 text-sm">{req.resolvedAt ? new Date(req.resolvedAt).toLocaleString() : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* Pending Detail Popup */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">{t('approval.detail')}</h2>
              <button onClick={() => setSelectedRequest(null)} className="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
            </div>
            <div className="space-y-1 mb-4 text-sm">
              <div><span className="text-gray-500">{t('table.expense')}:</span> {selectedRequest.budgetLine?.expense?.code} - {selectedRequest.budgetLine?.expense?.shortDescription}</div>
              <div><span className="text-gray-500">{t('table.company')}:</span> {selectedRequest.budgetLine?.financialCompany?.name}</div>
              <div><span className="text-gray-500">{t('label.budget')}:</span> {selectedRequest.budgetLine?.budget?.year} {selectedRequest.budgetLine?.budget?.version}</div>
              <div><span className="text-gray-500">{t('table.requestedBy')}:</span> {selectedRequest.requestedBy?.fullName}</div>
              <div><span className="text-gray-500">{t('label.date')}:</span> {new Date(selectedRequest.createdAt).toLocaleDateString()}</div>
              {selectedRequest.comment && <div><span className="text-gray-500">{t('table.comment')}:</span> {selectedRequest.comment}</div>}
            </div>
            {renderMonthComparison(selectedRequest)}
            <div className="flex justify-end gap-3">
              <button onClick={() => setSelectedRequest(null)} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 text-sm">{t('btn.close')}</button>
              <button onClick={() => handleReject(selectedRequest.id)} disabled={isProcessing}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm disabled:opacity-50">{t('btn.reject')}</button>
              <button onClick={() => handleApprove(selectedRequest.id)} disabled={isProcessing}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm disabled:opacity-50">{t('btn.approve')}</button>
            </div>
          </div>
        </div>
      )}

      {/* History Detail Popup */}
      {historyDetailRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-bold">{t('approval.detail')}</h2>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  historyDetailRequest.status === 'APPROVED' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {historyDetailRequest.status === 'APPROVED' ? (t('approval.approved') || 'Aprobada') : (t('approval.rejected') || 'Rechazada')}
                </span>
              </div>
              <button onClick={() => setHistoryDetailRequest(null)} className="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
            </div>
            <div className="space-y-1 mb-4 text-sm">
              <div><span className="text-gray-500">{t('table.expense')}:</span> {historyDetailRequest.budgetLine?.expense?.code} - {historyDetailRequest.budgetLine?.expense?.shortDescription}</div>
              <div><span className="text-gray-500">{t('table.company')}:</span> {historyDetailRequest.budgetLine?.financialCompany?.name}</div>
              <div><span className="text-gray-500">{t('label.budget')}:</span> {historyDetailRequest.budgetLine?.budget?.year} {historyDetailRequest.budgetLine?.budget?.version}</div>
              <div><span className="text-gray-500">{t('table.requestedBy')}:</span> {historyDetailRequest.requestedBy?.fullName}</div>
              <div><span className="text-gray-500">{t('approval.resolvedBy') || 'Resuelto por'}:</span> {historyDetailRequest.approvedBy?.fullName || '-'}</div>
              <div><span className="text-gray-500">{t('label.date')}:</span> {new Date(historyDetailRequest.createdAt).toLocaleDateString()}</div>
              <div><span className="text-gray-500">{t('approval.resolvedAt') || 'Fecha resolución'}:</span> {historyDetailRequest.resolvedAt ? new Date(historyDetailRequest.resolvedAt).toLocaleString() : '-'}</div>
              {historyDetailRequest.comment && <div><span className="text-gray-500">{t('table.comment')}:</span> {historyDetailRequest.comment}</div>}
            </div>
            {renderMonthComparison(historyDetailRequest)}
            <div className="flex justify-end">
              <button onClick={() => setHistoryDetailRequest(null)} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 text-sm">{t('btn.close')}</button>
            </div>
          </div>
        </div>
      )}

      <ConfirmationDialog
        isOpen={!!confirmAction}
        message={
          confirmAction?.type === 'approve' ? t('approval.confirmApprove') :
          confirmAction?.type === 'reject' ? t('approval.confirmReject') :
          t('approval.confirmApproveMultiple')
        }
        onConfirm={executeConfirmAction}
        onCancel={() => setConfirmAction(null)}
      />
    </div>
  );
}
