import React, { useState, useEffect, useCallback } from 'react';
import { auditApi, api } from '../services/api';
import type { AuditLog } from '../types';

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const [users, setUsers] = useState<Array<{ id: string; username: string; fullName: string }>>([]);
  const [actions, setActions] = useState<string[]>([]);
  const [entities, setEntities] = useState<string[]>([]);
  const [filterUserId, setFilterUserId] = useState('');
  const [filterAction, setFilterAction] = useState('');
  const [filterEntity, setFilterEntity] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(true);

  useEffect(() => {
    api.get('/users').then((r: any) => {
      const data = r.data;
      setUsers(Array.isArray(data) ? data : (data?.users || []));
    }).catch(() => {});
    auditApi.getActions().then((r: any) => setActions(Array.isArray(r.data) ? r.data : [])).catch(() => {});
    auditApi.getEntities().then((r: any) => setEntities(Array.isArray(r.data) ? r.data : [])).catch(() => {});
  }, []);

  const loadLogs = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const filters: any = { page, pageSize };
      if (filterUserId) filters.userId = filterUserId;
      if (filterAction) filters.action = filterAction;
      if (filterEntity) filters.entity = filterEntity;
      if (filterDateFrom) filters.dateFrom = filterDateFrom;
      if (filterDateTo) filters.dateTo = filterDateTo;
      const res = await auditApi.getLogs(filters);
      const data = res.data || {};
      setLogs(data.logs || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 0);
    } catch (err: any) {
      console.error('Error loading audit logs:', err);
      setError(err?.response?.data?.error || 'Error al cargar registros de auditoría');
      setLogs([]);
      setTotal(0);
      setTotalPages(0);
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, filterUserId, filterAction, filterEntity, filterDateFrom, filterDateTo]);

  useEffect(() => { loadLogs(); }, [loadLogs]);

  const clearFilters = () => {
    setFilterUserId('');
    setFilterAction('');
    setFilterEntity('');
    setFilterDateFrom('');
    setFilterDateTo('');
    setPage(1);
  };

  const formatDate = (d: string) => {
    try {
      return new Date(d).toLocaleString('es-CL', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit'
      });
    } catch { return d; }
  };

  const actionColor = (action: string) => {
    if (action === 'LOGIN' || action === 'LOGOUT') return 'bg-blue-100 text-blue-800';
    if (action === 'CREATE' || action === 'ADD_TO_BUDGET') return 'bg-green-100 text-green-800';
    if (action === 'UPDATE' || action === 'CHANGE_STATUS' || action === 'CHANGE_PASSWORD') return 'bg-yellow-100 text-yellow-800';
    if (action === 'DELETE') return 'bg-red-100 text-red-800';
    if (action === 'APPROVE') return 'bg-emerald-100 text-emerald-800';
    if (action === 'REJECT') return 'bg-orange-100 text-orange-800';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-800">Auditoría</h1>

      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-500">{total} registros encontrados</div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="text-sm text-blue-600 hover:underline"
        >
          {showFilters ? 'Ocultar filtros' : 'Mostrar filtros'}
        </button>
      </div>

      {showFilters && (
        <div className="bg-white rounded-lg shadow p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Usuario</label>
              <select value={filterUserId} onChange={(e) => { setFilterUserId(e.target.value); setPage(1); }} className="w-full px-2 py-1.5 border rounded text-sm">
                <option value="">Todos</option>
                {users.map((u) => <option key={u.id} value={u.id}>{u.fullName}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Acción</label>
              <select value={filterAction} onChange={(e) => { setFilterAction(e.target.value); setPage(1); }} className="w-full px-2 py-1.5 border rounded text-sm">
                <option value="">Todas</option>
                {actions.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Entidad</label>
              <select value={filterEntity} onChange={(e) => { setFilterEntity(e.target.value); setPage(1); }} className="w-full px-2 py-1.5 border rounded text-sm">
                <option value="">Todas</option>
                {entities.map((ent) => <option key={ent} value={ent}>{ent}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Desde</label>
              <input type="date" value={filterDateFrom} onChange={(e) => { setFilterDateFrom(e.target.value); setPage(1); }} className="w-full px-2 py-1.5 border rounded text-sm" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Hasta</label>
              <input type="date" value={filterDateTo} onChange={(e) => { setFilterDateTo(e.target.value); setPage(1); }} className="w-full px-2 py-1.5 border rounded text-sm" />
            </div>
            <div className="flex items-end">
              <button onClick={clearFilters} className="w-full px-3 py-1.5 bg-gray-100 text-gray-600 rounded text-sm hover:bg-gray-200">Limpiar</button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Fecha/Hora</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Usuario</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Acción</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Entidad</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">ID Entidad</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">IP</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={6} className="text-center py-8 text-gray-400">Cargando...</td></tr>
            ) : error ? (
              <tr><td colSpan={6} className="text-center py-8 text-red-500">{error}</td></tr>
            ) : logs.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-8 text-gray-400">No hay registros de auditoría</td></tr>
            ) : (
              logs.map((log) => (
                <React.Fragment key={log.id}>
                  <tr
                    className="border-t hover:bg-gray-50 cursor-pointer"
                    onClick={() => setExpandedRow(expandedRow === log.id ? null : log.id)}
                  >
                    <td className="px-4 py-2.5 text-gray-600 whitespace-nowrap">{formatDate(log.createdAt)}</td>
                    <td className="px-4 py-2.5">{log.user?.fullName || log.userId || '—'}</td>
                    <td className="px-4 py-2.5">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${actionColor(log.action)}`}>{log.action}</span>
                    </td>
                    <td className="px-4 py-2.5 text-gray-700">{log.entity}</td>
                    <td className="px-4 py-2.5 text-gray-500 font-mono text-xs">
                      {log.entityId ? log.entityId.substring(0, 8) + '...' : '—'}
                    </td>
                    <td className="px-4 py-2.5 text-gray-500 text-xs">{log.ipAddress || '—'}</td>
                  </tr>
                  {expandedRow === log.id && log.details && (
                    <tr className="bg-gray-50">
                      <td colSpan={6} className="px-4 py-3">
                        <div className="text-xs font-medium text-gray-500 mb-1">Detalles:</div>
                        <pre className="text-xs bg-gray-100 p-3 rounded overflow-x-auto max-h-48">
                          {JSON.stringify(log.details, null, 2)}
                        </pre>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">Página {page} de {totalPages} ({total} registros)</div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1 rounded border text-sm hover:bg-gray-50 disabled:opacity-30"
            >
              ‹
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 5) pageNum = i + 1;
              else if (page <= 3) pageNum = i + 1;
              else if (page >= totalPages - 2) pageNum = totalPages - 4 + i;
              else pageNum = page - 2 + i;
              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={`px-3 py-1 rounded text-sm ${page === pageNum ? 'bg-blue-600 text-white' : 'border hover:bg-gray-50'}`}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1 rounded border text-sm hover:bg-gray-50 disabled:opacity-30"
            >
              ›
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
