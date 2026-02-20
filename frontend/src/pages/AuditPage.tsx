import React, { useState, useEffect, useCallback } from 'react';
import { auditApi, api } from '../services/api';
import type { AuditLog } from '../types';
import { useI18n } from '../contexts/I18nContext';

export default function AuditPage() {
  const { t } = useI18n();
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
      setError(err?.response?.data?.error || 'Error al cargar registros de auditoría');
      setLogs([]);
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, filterUserId, filterAction, filterEntity, filterDateFrom, filterDateTo]);

  useEffect(() => { loadLogs(); }, [loadLogs]);

  const clearFilters = () => {
    setFilterUserId(''); setFilterAction(''); setFilterEntity('');
    setFilterDateFrom(''); setFilterDateTo(''); setPage(1);
  };

  const formatDate = (d: string) => {
    try {
      return new Date(d).toLocaleString('es-CL', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit'
      });
    } catch { return d; }
  };

  const actionLabel = (action: string) => {
    const labels: Record<string, string> = {
      LOGIN: 'Inicio sesión', LOGOUT: 'Cierre sesión', LOGIN_FAILED: 'Login fallido',
      VIEW: 'Visualización', CREATE: 'Creación', UPDATE: 'Modificación', DELETE: 'Eliminación',
      APPROVE: 'Aprobación', REJECT: 'Rechazo', CREATE_VERSION: 'Nueva versión',
      ADD_TO_BUDGET: 'Agregar a presupuesto', CHANGE_STATUS: 'Cambio estado',
      CHANGE_PASSWORD: 'Cambio contraseña', MODIFY_TAG: 'Modificar etiqueta',
    };
    return labels[action] || action;
  };

  const actionColor = (action: string) => {
    if (action === 'LOGIN' || action === 'LOGOUT') return 'bg-blue-100 text-blue-800';
    if (action === 'LOGIN_FAILED') return 'bg-red-200 text-red-900';
    if (action === 'VIEW') return 'bg-slate-100 text-slate-600';
    if (action === 'CREATE' || action === 'ADD_TO_BUDGET' || action === 'CREATE_VERSION') return 'bg-green-100 text-green-800';
    if (action === 'UPDATE' || action === 'CHANGE_STATUS' || action === 'CHANGE_PASSWORD' || action === 'MODIFY_TAG') return 'bg-yellow-100 text-yellow-800';
    if (action === 'DELETE') return 'bg-red-100 text-red-800';
    if (action === 'APPROVE') return 'bg-emerald-100 text-emerald-800';
    if (action === 'REJECT') return 'bg-orange-100 text-orange-800';
    return 'bg-gray-100 text-gray-800';
  };

  const actionCategory = (action: string) => {
    if (action === 'LOGIN' || action === 'LOGOUT' || action === 'LOGIN_FAILED') return '🔐 Sesión';
    if (action === 'VIEW') return '👁 Navegación';
    return '✏️ Escritura';
  };

  // Render before/after diff for write operations
  const renderDetails = (log: AuditLog) => {
    if (!log.details) return <span className="text-gray-400 text-xs">Sin detalles</span>;
    const d = log.details as any;

    // If it has before/after, show diff
    if (d.before !== undefined || d.after !== undefined) {
      return (
        <div className="grid grid-cols-2 gap-4">
          {d.before && (
            <div>
              <div className="text-xs font-semibold text-red-600 mb-1">ANTES:</div>
              <pre className="text-xs bg-red-50 p-2 rounded overflow-x-auto max-h-60 whitespace-pre-wrap">
                {JSON.stringify(d.before, null, 2)}
              </pre>
            </div>
          )}
          {d.after !== undefined && (
            <div>
              <div className="text-xs font-semibold text-green-600 mb-1">
                {d.after === null ? 'ELIMINADO' : 'DESPUÉS:'}
              </div>
              {d.after !== null ? (
                <pre className="text-xs bg-green-50 p-2 rounded overflow-x-auto max-h-60 whitespace-pre-wrap">
                  {JSON.stringify(d.after, null, 2)}
                </pre>
              ) : (
                <div className="text-xs text-red-500 italic">Registro eliminado</div>
              )}
            </div>
          )}
        </div>
      );
    }

    // Fallback: just show raw JSON
    return (
      <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto max-h-48 whitespace-pre-wrap">
        {JSON.stringify(d, null, 2)}
      </pre>
    );
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-800">{t('page.audit')}</h1>

      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-500">{total} {t('audit.recordsFound') || 'registros encontrados'}</div>
        <button onClick={() => setShowFilters(!showFilters)} className="text-sm text-blue-600 hover:underline">
          {showFilters ? t('audit.hideFilters') || 'Ocultar filtros' : t('audit.showFilters') || 'Mostrar filtros'}
        </button>
      </div>

      {showFilters && (
        <div className="bg-white rounded-lg shadow p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">{t('label.user')}</label>
              <select value={filterUserId} onChange={(e) => { setFilterUserId(e.target.value); setPage(1); }} className="w-full px-2 py-1.5 border rounded text-sm">
                <option value="">{t('label.all')}</option>
                {users.map((u) => <option key={u.id} value={u.id}>{u.fullName}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">{t('audit.action') || 'Acción'}</label>
              <select value={filterAction} onChange={(e) => { setFilterAction(e.target.value); setPage(1); }} className="w-full px-2 py-1.5 border rounded text-sm">
                <option value="">{t('filter.all')}</option>
                {actions.map((a) => <option key={a} value={a}>{actionLabel(a)}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">{t('audit.entity') || 'Entidad'}</label>
              <select value={filterEntity} onChange={(e) => { setFilterEntity(e.target.value); setPage(1); }} className="w-full px-2 py-1.5 border rounded text-sm">
                <option value="">{t('filter.all')}</option>
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
              <button onClick={clearFilters} className="w-full px-3 py-1.5 bg-gray-100 text-gray-600 rounded text-sm hover:bg-gray-200">{t('filter.clearFilters')}</button>
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
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Categoría</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Acción</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Entidad</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={5} className="text-center py-8 text-gray-400">{t('msg.loading')}</td></tr>
            ) : error ? (
              <tr><td colSpan={5} className="text-center py-8 text-red-500">{error}</td></tr>
            ) : logs.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-8 text-gray-400">{t('audit.noRecords') || 'No hay registros de auditoría'}</td></tr>
            ) : (
              logs.map((log) => (
                <React.Fragment key={log.id}>
                  <tr
                    className={`border-t hover:bg-gray-50 ${log.details ? 'cursor-pointer' : ''}`}
                    onClick={() => log.details && setExpandedRow(expandedRow === log.id ? null : log.id)}
                  >
                    <td className="px-4 py-2.5 text-gray-600 whitespace-nowrap">{formatDate(log.createdAt)}</td>
                    <td className="px-4 py-2.5">{log.user?.fullName || '—'}</td>
                    <td className="px-4 py-2.5 text-xs text-gray-500">{actionCategory(log.action)}</td>
                    <td className="px-4 py-2.5">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${actionColor(log.action)}`}>{actionLabel(log.action)}</span>
                    </td>
                    <td className="px-4 py-2.5 text-gray-700">{log.entity}</td>
                  </tr>
                  {expandedRow === log.id && log.details && (
                    <tr className="bg-gray-50">
                      <td colSpan={5} className="px-4 py-3">
                        {renderDetails(log)}
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
            >‹</button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 5) pageNum = i + 1;
              else if (page <= 3) pageNum = i + 1;
              else if (page >= totalPages - 2) pageNum = totalPages - 4 + i;
              else pageNum = page - 2 + i;
              return (
                <button key={pageNum} onClick={() => setPage(pageNum)}
                  className={`px-3 py-1 rounded text-sm ${page === pageNum ? 'bg-blue-600 text-white' : 'border hover:bg-gray-50'}`}
                >{pageNum}</button>
              );
            })}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1 rounded border text-sm hover:bg-gray-50 disabled:opacity-30"
            >›</button>
          </div>
        </div>
      )}
    </div>
  );
}
