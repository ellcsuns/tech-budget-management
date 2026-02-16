import { useState, useEffect, useCallback } from 'react';
import { translationApi } from '../services/api';
import { useI18n } from '../contexts/I18nContext';

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
  const [newData, setNewData] = useState({ key: '', es: '', en: '', category: 'general' });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await translationApi.getAll({ search: search || undefined });
      const responseData = res.data;
      setTranslations(Array.isArray(responseData) ? responseData : responseData.data || []);
    } catch { /* ignore */ } finally { setLoading(false); }
  }, [search]);

  useEffect(() => { load(); }, [load]);

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
    setNewData({ key: '', es: '', en: '', category: 'general' });
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta traducción?')) return;
    await translationApi.delete(id);
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div />
        <button onClick={() => setShowNew(true)} className="btn-primary">
          + Nueva Traducción
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <input type="text" placeholder="Buscar por clave o texto..." value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full px-4 py-2 border rounded-lg mb-4" />

        {showNew && (
          <div className="mb-4 p-4 bg-blue-50 rounded-lg space-y-2">
            <div className="grid grid-cols-4 gap-2">
              <input placeholder="Clave" value={newData.key} onChange={e => setNewData({...newData, key: e.target.value})} className="px-3 py-2 border rounded" />
              <input placeholder="Español" value={newData.es} onChange={e => setNewData({...newData, es: e.target.value})} className="px-3 py-2 border rounded" />
              <input placeholder="English" value={newData.en} onChange={e => setNewData({...newData, en: e.target.value})} className="px-3 py-2 border rounded" />
              <div className="flex gap-2">
                <select value={newData.category} onChange={e => setNewData({...newData, category: e.target.value})} className="px-3 py-2 border rounded flex-1">
                  <option value="general">General</option>
                  <option value="menu">Menú</option>
                  <option value="button">Botón</option>
                  <option value="label">Etiqueta</option>
                  <option value="message">Mensaje</option>
                </select>
                <button onClick={handleCreate} className="px-3 py-2 btn-success text-sm">✓</button>
                <button onClick={() => setShowNew(false)} className="px-3 py-2 btn-cancel text-sm">✕</button>
              </div>
            </div>
          </div>
        )}

        {loading ? <p className="text-center py-8 text-gray-500">Cargando...</p> : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left p-3">Clave</th>
                <th className="text-left p-3">Español</th>
                <th className="text-left p-3">English</th>
                <th className="text-left p-3">Categoría</th>
                <th className="text-center p-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {translations.map(tr => (
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
                        <button onClick={saveEdit} className="text-green-600 hover:text-green-800">Guardar</button>
                        <button onClick={() => setEditingId(null)} className="text-gray-500 hover:text-gray-700">Cancelar</button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => startEdit(tr)} className="text-accent hover:opacity-70">Editar</button>
                        <button onClick={() => handleDelete(tr.id)} className="text-red-600 hover:text-red-800">Eliminar</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
