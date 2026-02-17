import { useState, useEffect } from 'react';
import { changeRequestApi } from '../services/api';
import type { ChangeRequest } from '../types';
import { fmt } from '../utils/formatters';
import { HiOutlineCheckCircle, HiOutlineXMark } from 'react-icons/hi2';

const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

export default function ApprovalsPage() {
  const [requests, setRequests] = useState<ChangeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<ChangeRequest | null>(null);

  useEffect(() => { loadPending(); }, []);

  const loadPending = async () => {
    try {
      setLoading(true);
      const res = await changeRequestApi.getPending();
      setRequests(res.data);
    } catch (error) { console.error('Error:', error); }
    finally { setLoading(false); }
  };

  const handleApprove = async (id: string) => {
    if (!confirm('¿Aprobar esta solicitud de cambio?')) return;
    try { await changeRequestApi.approve(id); setSelectedRequest(null); loadPending(); }
    catch (error: any) { alert(error.response?.data?.error || 'Error al aprobar'); }
  };

  const handleReject = async (id: string) => {
    if (!confirm('¿Rechazar esta solicitud de cambio?')) return;
    try { await changeRequestApi.reject(id); setSelectedRequest(null); loadPending(); }
    catch (error: any) { alert(error.response?.data?.error || 'Error al rechazar'); }
  };

  if (loading) return <div className="text-center py-8">Cargando...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Aprobaciones Pendientes</h1>
      {requests.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">No hay solicitudes pendientes de aprobación</div>
      ) : (
        <div className="bg-white rounded-lg shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Gasto</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Empresa</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Presupuesto</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Solicitado por</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {requests.map(req => (
                <tr key={req.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedRequest(req)}>
                  <td className="px-4 py-3 text-sm">{req.budgetLine?.expense?.code} - {req.budgetLine?.expense?.shortDescription}</td>
                  <td className="px-4 py-3 text-sm">{req.budgetLine?.financialCompany?.name}</td>
                  <td className="px-4 py-3 text-sm">{req.budgetLine?.budget?.year} {req.budgetLine?.budget?.version}</td>
                  <td className="px-4 py-3 text-sm">{req.requestedBy?.fullName}</td>
                  <td className="px-4 py-3 text-sm">{new Date(req.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex justify-center gap-2">
                      <button onClick={(e) => { e.stopPropagation(); handleApprove(req.id); }} className="text-green-600 hover:text-green-800" title="Aprobar">
                        <HiOutlineCheckCircle className="w-5 h-5" />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); handleReject(req.id); }} className="text-red-600 hover:text-red-800" title="Rechazar">
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

      {/* Detail popup */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">Detalle de Solicitud de Cambio</h2>
              <button onClick={() => setSelectedRequest(null)} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
              <div><span className="text-gray-500">Gasto:</span> {selectedRequest.budgetLine?.expense?.code} - {selectedRequest.budgetLine?.expense?.shortDescription}</div>
              <div><span className="text-gray-500">Empresa:</span> {selectedRequest.budgetLine?.financialCompany?.name}</div>
              <div><span className="text-gray-500">Solicitado por:</span> {selectedRequest.requestedBy?.fullName}</div>
              {selectedRequest.comment && <div className="col-span-2"><span className="text-gray-500">Comentario:</span> {selectedRequest.comment}</div>}
            </div>

            {/* Comparison table */}
            <div className="overflow-x-auto mb-4">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Concepto</th>
                    {MONTHS.map(m => <th key={m} className="px-3 py-2 text-right text-xs font-medium text-gray-500">{m}</th>)}
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-red-50">
                    <td className="px-3 py-2 font-medium">Actual</td>
                    {MONTHS.map((_, i) => {
                      const val = selectedRequest.currentValues[`planM${i + 1}`] || 0;
                      return <td key={i} className="px-3 py-2 text-right">{fmt(val)}</td>;
                    })}
                    <td className="px-3 py-2 text-right font-bold">{fmt(Object.values(selectedRequest.currentValues).reduce((s, v) => s + (Number(v) || 0), 0))}</td>
                  </tr>
                  <tr className="bg-green-50">
                    <td className="px-3 py-2 font-medium">Propuesto</td>
                    {MONTHS.map((_, i) => {
                      const val = selectedRequest.proposedValues[`planM${i + 1}`] || 0;
                      return <td key={i} className="px-3 py-2 text-right">{fmt(val)}</td>;
                    })}
                    <td className="px-3 py-2 text-right font-bold">{fmt(Object.values(selectedRequest.proposedValues).reduce((s, v) => s + (Number(v) || 0), 0))}</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="px-3 py-2 font-medium">Diferencia</td>
                    {MONTHS.map((_, i) => {
                      const curr = selectedRequest.currentValues[`planM${i + 1}`] || 0;
                      const prop = selectedRequest.proposedValues[`planM${i + 1}`] || 0;
                      const diff = Number(prop) - Number(curr);
                      return <td key={i} className={`px-3 py-2 text-right ${diff > 0 ? 'text-green-600' : diff < 0 ? 'text-red-600' : ''}`}>{diff !== 0 ? fmt(diff) : '-'}</td>;
                    })}
                    <td className="px-3 py-2 text-right font-bold">
                      {(() => {
                        const totalDiff = Object.keys(selectedRequest.proposedValues).reduce((s, k) => s + ((Number(selectedRequest.proposedValues[k]) || 0) - (Number(selectedRequest.currentValues[k]) || 0)), 0);
                        return <span className={totalDiff > 0 ? 'text-green-600' : totalDiff < 0 ? 'text-red-600' : ''}>{fmt(totalDiff)}</span>;
                      })()}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="flex justify-end gap-3">
              <button onClick={() => handleReject(selectedRequest.id)} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm">Rechazar</button>
              <button onClick={() => handleApprove(selectedRequest.id)} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm">Aprobar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
