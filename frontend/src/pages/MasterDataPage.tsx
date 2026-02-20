import { useState, useEffect } from 'react';
import { technologyDirectionApi, userAreaApi, financialCompanyApi } from '../services/api';
import { HiOutlinePencilSquare, HiOutlineTrash, HiOutlinePlusCircle } from 'react-icons/hi2';
import { showToast } from '../components/Toast';
import ConfirmationDialog from '../components/ConfirmationDialog';

type TabType = 'tech' | 'areas' | 'companies';

export default function MasterDataPage() {
  const [activeTab, setActiveTab] = useState<TabType>('tech');
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [form, setForm] = useState({ code: '', name: '', description: '', taxId: '' });
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);

  useEffect(() => { loadData(); }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      let response;
      switch (activeTab) {
        case 'tech': response = await technologyDirectionApi.getAll(); break;
        case 'areas': response = await userAreaApi.getAll(); break;
        case 'companies': response = await financialCompanyApi.getAll(); break;
      }
      setItems(response.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getApi = () => {
    switch (activeTab) {
      case 'tech': return technologyDirectionApi;
      case 'areas': return userAreaApi;
      case 'companies': return financialCompanyApi;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const apiObj = getApi();
      const data: any = { code: form.code, name: form.name, description: form.description };
      if (activeTab === 'companies' && form.taxId) data.taxId = form.taxId;

      if (editingItem) {
        await apiObj.update(editingItem.id, data);
      } else {
        await apiObj.create(data);
      }
      setShowForm(false);
      setEditingItem(null);
      setForm({ code: '', name: '', description: '', taxId: '' });
      loadData();
    } catch (error: any) {
      showToast(error.response?.data?.error || error.response?.data?.message || 'Error al guardar', 'error');
    }
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setForm({ code: item.code, name: item.name, description: item.description || '', taxId: item.taxId || '' });
    setShowForm(true);
  };

  const handleDelete = async (item: any) => {
    setDeleteTarget(item);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await getApi().delete(deleteTarget.id);
      loadData();
    } catch (error: any) {
      showToast(error.response?.data?.error || 'Error al eliminar. Puede estar en uso.', 'error');
    }
  };

  const tabLabel = activeTab === 'tech' ? 'Dirección Tecnológica' : activeTab === 'areas' ? 'Área de Usuario' : 'Empresa Financiera';

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div />
        <button onClick={() => { setShowForm(!showForm); setEditingItem(null); setForm({ code: '', name: '', description: '', taxId: '' }); }}
          className="btn-primary flex items-center gap-2">
          <HiOutlinePlusCircle className="w-5 h-5" />
          {showForm ? 'Cancelar' : `+ Nueva ${tabLabel}`}
        </button>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            {[
              { key: 'tech' as TabType, label: 'Direcciones Tecnológicas' },
              { key: 'areas' as TabType, label: 'Áreas de Usuario' },
              { key: 'companies' as TabType, label: 'Empresas Financieras' }
            ].map(tab => (
              <button key={tab.key} onClick={() => { setActiveTab(tab.key); setShowForm(false); }}
                className={`px-6 py-3 text-sm font-medium ${activeTab === tab.key ? 'tab-active' : 'text-gray-500 hover:text-gray-700'}`}>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {showForm && (
          <div className="p-6 bg-gray-50 border-b">
            <h3 className="text-lg font-bold mb-4">{editingItem ? 'Editar' : 'Crear'} {tabLabel}</h3>
            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Código *</label>
                <input type="text" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })}
                  className="w-full border rounded px-3 py-2" required disabled={!!editingItem} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Nombre *</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border rounded px-3 py-2" required />
              </div>
              <div className={activeTab === 'companies' ? '' : 'col-span-2'}>
                <label className="block text-sm font-medium mb-1">Descripción</label>
                <input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full border rounded px-3 py-2" />
              </div>
              {activeTab === 'companies' && (
                <div>
                  <label className="block text-sm font-medium mb-1">RUT/Tax ID</label>
                  <input type="text" value={form.taxId} onChange={(e) => setForm({ ...form, taxId: e.target.value })}
                    className="w-full border rounded px-3 py-2" />
                </div>
              )}
              <div className="col-span-2 flex gap-2">
                <button type="submit" className="btn-success">
                  {editingItem ? 'Actualizar' : 'Crear'}
                </button>
                <button type="button" onClick={() => { setShowForm(false); setEditingItem(null); }}
                  className="btn-cancel">Cancelar</button>
              </div>
            </form>
          </div>
        )}

        <div className="p-6">
          {loading ? (
            <div className="text-center py-8">Cargando...</div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Código</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descripción</th>
                  {activeTab === 'companies' && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">RUT</th>}
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">{item.code}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{item.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{item.description || '-'}</td>
                    {activeTab === 'companies' && <td className="px-6 py-4 text-sm text-gray-500">{item.taxId || '-'}</td>}
                    <td className="px-6 py-4 text-sm text-center space-x-2">
                      <button onClick={() => handleEdit(item)} className="icon-btn" title="Editar"><HiOutlinePencilSquare className="w-5 h-5" /></button>
                      <button onClick={() => handleDelete(item)} className="icon-btn-danger" title="Eliminar"><HiOutlineTrash className="w-5 h-5" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <ConfirmationDialog isOpen={showDeleteDialog} message={`¿Eliminar "${deleteTarget?.name}"?`} onConfirm={confirmDelete} onCancel={() => { setShowDeleteDialog(false); setDeleteTarget(null); }} />
    </div>
  );
}
