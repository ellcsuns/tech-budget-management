import { useState, useEffect } from 'react';
import { changeRequestApi } from '../services/api';
import type { ChangeRequest } from '../types';
import { fmt } from '../utils/formatters';
import { HiOutlineCheckCircle, HiOutlineXMark } from 'react-icons/hi2';
import { showToast } from '../components/Toast';
import ConfirmationDialog from '../components/ConfirmationDialog';

const MONTHS = ['M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7', 'M8', 'M9', 'M10', 'M11', 'M12'];

export default function ApprovalsPage() {
  const [requests, setRequests] = useState<ChangeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<ChangeRequest | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isProcessing, setIsProcessing] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ type: 'approve' | 'reject' | 'approveMultiple'; id?: string } | null>(null);

  useEffect(() => { loadPending(); }, []);

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

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedIds(next);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === requests.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(requests.map(r => r.id)));
  };

  const handleApprove = async (id: string) => {
    setConfirmAction({ type: 'approve', id });
  };

  const handleApproveMultiple = async () => {
    if (selectedIds.size === 0) return;
    setConfirmAction({ type: 'approveMultiple' });
  };

  const handleReject = async (id: string) => {
    setConfirmAction({ type: 'reject', id });
  };

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
    } catch (error: any) {
      showToast(error.response?.data?.error || 'Error al procesar solicitud', 'error');
    } finally {
      setIsProcessing(false);
      setConfirmAction(null);
    }
  };

  if (loading) return <div className="text-center py-8">Cargando...</div>;
  if (error) return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Aprobaciones Pendientes</h1>
      <div className="bg-white rounded-lg shadow p-8 text-center text-red-500">{error}</div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Aprobaciones Pendientes</h1>
        {selectedIds.size > 0 && (
          <button onClick={handleApproveMultiple} disabled={isProcessing}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm disabled:opacity-50">
            Aprobar {selectedIds.size} seleccionada(s)
          </button>
        )}
      </div>

      {requests.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">No hay solicitudes pendientes de aprobación</div>
      ) : (
        <div className="bg-white rounded-lg shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-center">
                  <input type="checkbox" checked={selectedIds.size === requests.length && requests.length > 0}
                    onChange={toggleSelectAll} className="rounded" />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Gasto</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Empresa</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Presupuesto</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Solicitado por</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Comentario</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Acciones</th>
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
                      <button onClick={() => handleApprove(req.id)} disabled={isProcessing} className="text-green-600 hover:text-green-800" title="Aprobar">
                        <HiOutlineCheckCircle className="w-5 h-5" />
                      </button>
                      <button onClick={() => handleReject(req.id)} disabled={isProcessing} className="text-red-600 hover:text-red-800" title="Rechazar">
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

      {/* Detail Popup - shows current vs proposed comparison */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">Detalle de Solicitud</h2>
              <button onClick={() => setSelectedRequest(null)} className="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
            </div>

            <div className="space-y-1 mb-4 text-sm">
              <div><span className="text-gray-500">Gasto:</span> {selectedRequest.budgetLine?.expense?.code} - {selectedRequest.budgetLine?.expense?.shortDescription}</div>
              <div><span className="text-gray-500">Empresa:</span> {selectedRequest.budgetLine?.financialCompany?.name}</div>
              <div><span className="text-gray-500">Presupuesto:</span> {selectedRequest.budgetLine?.budget?.year} {selectedRequest.budgetLine?.budget?.version}</div>
              <div><span className="text-gray-500">Solicitado por:</span> {selectedRequest.requestedBy?.fullName}</div>
              <div><span className="text-gray-500">Fecha:</span> {new Date(selectedRequest.createdAt).toLocaleDateString()}</div>
              {selectedRequest.comment && <div><span className="text-gray-500">Comentario:</span> {selectedRequest.comment}</div>}
            </div>

            {/* Month comparison table */}
            <div className="border rounded divide-y mb-4">
              <div className="flex items-center px-4 py-2 bg-gray-50 text-xs font-medium text-gray-500">
                <span className="w-16">Mes</span>
                <span className="w-28 text-right">Actual</span>
                <span className="w-28 text-right">Propuesto</span>
                <span className="flex-1 text-right">Diferencia</span>
              </div>
              {MONTHS.map((m, i) => {
                const current = (selectedRequest.currentValues as Record<string, number>)?.[`planM${i + 1}`] || 0;
                const proposed = (selectedRequest.proposedValues as Record<string, number>)?.[`planM${i + 1}`] || 0;
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
              {/* Totals row */}
              {(() => {
                const totalCurrent = Object.values(selectedRequest.currentValues as Record<string, number>).reduce((s, v) => s + (v || 0), 0);
                const totalProposed = Object.values(selectedRequest.proposedValues as Record<string, number>).reduce((s, v) => s + (v || 0), 0);
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

            <div className="flex justify-end gap-3">
              <button onClick={() => setSelectedRequest(null)} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 text-sm">Cerrar</button>
              <button onClick={() => handleReject(selectedRequest.id)} disabled={isProcessing}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm disabled:opacity-50">
                Rechazar
              </button>
              <button onClick={() => handleApprove(selectedRequest.id)} disabled={isProcessing}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm disabled:opacity-50">
                Aprobar
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmationDialog
        isOpen={!!confirmAction}
        message={
          confirmAction?.type === 'approve' ? '¿Aprobar esta solicitud de cambio?' :
          confirmAction?.type === 'reject' ? '¿Rechazar esta solicitud de cambio?' :
          `¿Aprobar ${selectedIds.size} solicitud(es) de cambio seleccionadas?`
        }
        onConfirm={executeConfirmAction}
        onCancel={() => setConfirmAction(null)}
      />
    </div>
  );
}
