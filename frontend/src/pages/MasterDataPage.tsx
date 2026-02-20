import { useState, useEffect } from 'react';
import { technologyDirectionApi, userAreaApi, financialCompanyApi, expenseCategoryApi } from '../services/api';
import { HiOutlinePencilSquare, HiOutlineTrash, HiOutlinePlusCircle } from 'react-icons/hi2';
import { showToast } from '../components/Toast';
import ConfirmationDialog from '../components/ConfirmationDialog';
import { useI18n } from '../contexts/I18nContext';

type TabType = 'tech' | 'areas' | 'companies' | 'categories';

export default function MasterDataPage() {
  const { t } = useI18n();
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
        case 'categories': response = await expenseCategoryApi.getAll(); break;
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
      case 'categories': return expenseCategoryApi;
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
      showToast(error.response?.data?.error || error.response?.data?.message || t('msg.errorSaving'), 'error');
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
      showToast(error.response?.data?.error || t('masterData.errorDeleting'), 'error');
    }
    setShowDeleteDialog(false);
    setDeleteTarget(null);
  };

  const tabLabel = activeTab === 'tech' ? t('masterData.techDirection') : activeTab === 'areas' ? t('masterData.userArea') : activeTab === 'companies' ? t('masterData.financialCompany') : t('masterData.expenseCategory');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div />
        <button onClick={() => { setShowForm(!showForm); setEditingItem(null); setForm({ code: '', name: '', description: '', taxId: '' }); }}
          className="btn-primary flex items-center gap-2">
          <HiOutlinePlusCircle className="w-5 h-5" />
          {showForm ? t('btn.cancel') : `${t('masterData.newItem')} ${tabLabel}`}
        </button>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            {[
              { key: 'tech' as TabType, label: t('masterData.techDirections') },
              { key: 'areas' as TabType, label: t('masterData.userAreas') },
              { key: 'companies' as TabType, label: t('masterData.companies') },
              { key: 'categories' as TabType, label: t('masterData.expenseCategories') }
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
            <h3 className="text-lg font-bold mb-4">{editingItem ? t('masterData.editItem') : t('masterData.createItem')} {tabLabel}</h3>
            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">{t('masterData.code')}</label>
                <input type="text" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })}
                  className="w-full border rounded px-3 py-2" required disabled={!!editingItem} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('masterData.name')}</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border rounded px-3 py-2" required />
              </div>
              <div className={activeTab === 'companies' ? '' : 'col-span-2'}>
                <label className="block text-sm font-medium mb-1">{t('masterData.description')}</label>
                <input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full border rounded px-3 py-2" />
              </div>
              {activeTab === 'companies' && (
                <div>
                  <label className="block text-sm font-medium mb-1">{t('masterData.taxId')}</label>
                  <input type="text" value={form.taxId} onChange={(e) => setForm({ ...form, taxId: e.target.value })}
                    className="w-full border rounded px-3 py-2" />
                </div>
              )}
              <div className="col-span-2 flex gap-2">
                <button type="submit" className="btn-success">{editingItem ? t('btn.update') : t('btn.create')}</button>
                <button type="button" onClick={() => { setShowForm(false); setEditingItem(null); }} className="btn-cancel">{t('btn.cancel')}</button>
              </div>
            </form>
          </div>
        )}

        <div className="p-6">
          {loading ? (
            <div className="text-center py-8">{t('msg.loading')}</div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('label.code')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('label.name')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('label.description')}</th>
                  {activeTab === 'companies' && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('masterData.taxId')}</th>}
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">{t('label.actions')}</th>
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
                      <button onClick={() => handleEdit(item)} className="icon-btn" title={t('btn.edit')}><HiOutlinePencilSquare className="w-5 h-5" /></button>
                      <button onClick={() => handleDelete(item)} className="icon-btn-danger" title={t('btn.delete')}><HiOutlineTrash className="w-5 h-5" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <ConfirmationDialog isOpen={showDeleteDialog} message={`${t('masterData.deleteConfirm')} "${deleteTarget?.name}"?`} onConfirm={confirmDelete} onCancel={() => { setShowDeleteDialog(false); setDeleteTarget(null); }} />
    </div>
  );
}
