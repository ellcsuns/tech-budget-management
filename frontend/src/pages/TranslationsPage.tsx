import { useState, useEffect, useCallback, useMemo } from 'react';
import { translationApi } from '../services/api';
import { useI18n } from '../contexts/I18nContext';
import ConfirmationDialog from '../components/ConfirmationDialog';
import { HiOutlineChevronDown, HiOutlineChevronRight } from 'react-icons/hi2';

interface Translation {
  id: string;
  key: string;
  es: string;
  en: string;
  category: string;
}

export default function TranslationsPage() {
  const { t } = useI18n();
  const [translations, setTranslations] = useState<Translation[]>([]);
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState({ es: '', en: '' });
  const [showNew, setShowNew] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [newData, setNewData] = useState({ key: '', es: '', en: '', category: 'common' });
  const [loading, setLoading] = useState(true);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [filterCategory, setFilterCategory] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await translationApi.getAll({ search: search || undefined });
      const responseData = res.data;
      setTranslations(Array.isArray(responseData) ? responseData : responseData.data || []);
    } catch { /* ignore */ } finally { setLoading(false); }
  }, [search]);

  useEffect(() => { load(); }, [load]);

  const SIDEBAR_SECTION_ORDER = [
    'common', 'sidebar', 'login', 'dashboard', 'presupuestos', 'ahorros', 'diferidos',
    'aprobaciones', 'gastos', 'transacciones', 'tasas_cambio', 'reportes',
    'reportes_detallados', 'configuracion', 'datos_maestros', 'usuarios', 'roles', 'traducciones', 'auditoria'
  ];

  const SIDEBAR_SECTION_LABELS: Record<string, string> = {
    common: '🔧 Common',
    sidebar: '📋 Sidebar',
    login: '🔐 Login',
    dashboard: '📊 Dashboard',
    presupuestos: '💰 Presupuestos',
    ahorros: '🏦 Ahorros',
    diferidos: '📅 Diferidos',
    aprobaciones: '✅ Aprobaciones',
    gastos: '💸 Gastos',
    transacciones: '🔄 Transacciones',
    tasas_cambio: '💱 Tasas de Cambio',
    reportes: '📈 Reportes',
    reportes_detallados: '📑 Reportes Detallados',
    configuracion: '⚙️ Configuración',
    datos_maestros: '🗂 Datos Maestros',
    usuarios: '👤 Usuarios',
    roles: '🛡 Roles',
    traducciones: '🌐 Traducciones',
    auditoria: '📝 Auditoría'
  };

  const grouped = useMemo(() => {
    let filtered = translations;
    if (filterCategory) filtered = filtered.filter(t => t.category === filterCategory);
    const groups: Record<string, Translation[]> = {};
    filtered.forEach(t => {
      const section = t.category || 'common';
      if (!groups[section]) groups[section] = [];
      groups[section].push(t);
    });
    // Sort by sidebar section order
    return Object.entries(groups).sort(([a], [b]) => {
      const ia = SIDEBAR_SECTION_ORDER.indexOf(a);
      const ib = SIDEBAR_SECTION_ORDER.indexOf(b);
      if (ia === -1 && ib === -1) return a.localeCompare(b);
      if (ia === -1) return 1;
      if (ib === -1) return -1;
      return ia - ib;
    });
  }, [translations, filterCategory]);

  const categories = useMemo(() =>
    Array.from(new Set(translations.map(t => t.category).filter(Boolean))).sort(),
  [translations]);

  const toggleGroup = (group: string) => {
    const next = new Set(collapsedGroups);
    if (next.has(group)) next.delete(group); else next.add(group);
    setCollapsedGroups(next);
  };

  const startEdit = (tr: Translation) => {
    setEditingId(tr.id);
    setEditData({ es: tr.es, en: tr.en });
  };

  const saveEdit = async () => {
    if (!editingId) return;
    await translationApi.update(editingId, editData);
    setEditingId(null);
    load();
  };

  const handleCreate = async () => {
    if (!newData.key.trim()) return;
    await translationApi.create(newData);
    setShowNew(false);
    setNewData({ key: '', es: '', en: '', category: 'common' });
    load();
  };

  const handleDelete = async (id: string) => {
    setDeleteTargetId(id);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!deleteTargetId) return;
    await translationApi.delete(deleteTargetId);
    load();
    setShowDeleteDialog(false);
    setDeleteTargetId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">{translations.length} {t('translations.count')}</span>
          {grouped.length > 0 && (
            <span className="text-sm text-gray-400">· {grouped.length} {t('translations.sections')}</span>
          )}
        </div>
        <button onClick={() => setShowNew(true)} className="btn-primary">+ {t('translations.new')}</button>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex gap-3 mb-4">
          <input type="text" placeholder={t('translations.searchPlaceholder')} value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 px-4 py-2 border rounded-lg" />
          <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm">
            <option value="">{t('translations.allCategories')}</option>
            {categories.map(c => <option key={c} value={c}>{SIDEBAR_SECTION_LABELS[c] || c}</option>)}
          </select>
        </div>

        {showNew && (
          <div className="mb-4 p-4 bg-blue-50 rounded-lg space-y-2">
            <div className="grid grid-cols-4 gap-2">
              <input placeholder="Clave" value={newData.key} onChange={e => setNewData({...newData, key: e.target.value})} className="px-3 py-2 border rounded" />
              <input placeholder="Español" value={newData.es} onChange={e => setNewData({...newData, es: e.target.value})} className="px-3 py-2 border rounded" />
              <input placeholder="English" value={newData.en} onChange={e => setNewData({...newData, en: e.target.value})} className="px-3 py-2 border rounded" />
              <div className="flex gap-2">
                <select value={newData.category} onChange={e => setNewData({...newData, category: e.target.value})} className="px-3 py-2 border rounded flex-1">
                  <option value="common">Common</option>
                  <option value="sidebar">Sidebar</option>
                  <option value="login">Login</option>
                  <option value="dashboard">Dashboard</option>
                  <option value="presupuestos">Presupuestos</option>
                  <option value="ahorros">Ahorros</option>
                  <option value="diferidos">Diferidos</option>
                  <option value="aprobaciones">Aprobaciones</option>
                  <option value="gastos">Gastos</option>
                  <option value="transacciones">Transacciones</option>
                  <option value="tasas_cambio">Tasas de Cambio</option>
                  <option value="reportes">Reportes</option>
                  <option value="reportes_detallados">Reportes Detallados</option>
                  <option value="configuracion">Configuración</option>
                  <option value="datos_maestros">Datos Maestros</option>
                  <option value="usuarios">Usuarios</option>
                  <option value="roles">Roles</option>
                  <option value="traducciones">Traducciones</option>
                  <option value="auditoria">Auditoría</option>
                </select>
                <button onClick={handleCreate} className="px-3 py-2 btn-success text-sm">✓</button>
                <button onClick={() => setShowNew(false)} className="px-3 py-2 btn-cancel text-sm">✕</button>
              </div>
            </div>
          </div>
        )}

        {loading ? <p className="text-center py-8 text-gray-500">{t('translations.loading')}</p> : (
          <div className="space-y-2">
            {grouped.map(([section, items]) => {
              const isCollapsed = collapsedGroups.has(section);
              return (
                <div key={section} className="border rounded-lg overflow-hidden">
                  <button onClick={() => toggleGroup(section)}
                    className="w-full flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 text-left">
                    {isCollapsed ? <HiOutlineChevronRight className="w-4 h-4" /> : <HiOutlineChevronDown className="w-4 h-4" />}
                    <span className="font-medium text-sm text-gray-700">{SIDEBAR_SECTION_LABELS[section] || section}</span>
                    <span className="text-xs text-gray-400">({items.length})</span>
                  </button>
                  {!isCollapsed && (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-gray-50">
                          <th className="text-left p-3 w-1/4">{t('translations.key')}</th>
                          <th className="text-left p-3 w-1/4">{t('translations.spanish')}</th>
                          <th className="text-left p-3 w-1/4">{t('translations.english')}</th>
                          <th className="text-left p-3 w-20">{t('translations.cat')}</th>
                          <th className="text-center p-3 w-32">{t('label.actions')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map(tr => (
                          <tr key={tr.id} className="border-b hover:bg-gray-50">
                            <td className="p-3 font-mono text-xs">{tr.key}</td>
                            <td className="p-3">
                              {editingId === tr.id ? (
                                <input value={editData.es} onChange={e => setEditData({...editData, es: e.target.value})} className="w-full px-2 py-1 border rounded" />
                              ) : tr.es}
                            </td>
                            <td className="p-3">
                              {editingId === tr.id ? (
                                <input value={editData.en} onChange={e => setEditData({...editData, en: e.target.value})} className="w-full px-2 py-1 border rounded" />
                              ) : tr.en}
                            </td>
                            <td className="p-3"><span className="px-2 py-1 bg-gray-100 rounded text-xs">{tr.category}</span></td>
                            <td className="p-3 text-center space-x-2">
                              {editingId === tr.id ? (
                                <>
                                  <button onClick={saveEdit} className="text-green-600 hover:text-green-800">{t('translations.save')}</button>
                                  <button onClick={() => setEditingId(null)} className="text-gray-500 hover:text-gray-700">{t('common.cancel')}</button>
                                </>
                              ) : (
                                <>
                                  <button onClick={() => startEdit(tr)} className="text-accent hover:opacity-70">{t('translations.edit')}</button>
                                  <button onClick={() => handleDelete(tr.id)} className="text-red-600 hover:text-red-800">{t('translations.delete')}</button>
                                </>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ConfirmationDialog isOpen={showDeleteDialog} message={t('translations.deleteConfirm')} onConfirm={confirmDelete} onCancel={() => { setShowDeleteDialog(false); setDeleteTargetId(null); }} />
    </div>
  );
}
