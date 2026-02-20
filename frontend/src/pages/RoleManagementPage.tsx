import { useState, useEffect } from 'react';
import { api, technologyDirectionApi } from '../services/api';
import type { TechnologyDirection } from '../types';
import { HiOutlinePencilSquare, HiOutlineTrash, HiOutlinePlusCircle } from 'react-icons/hi2';
import { showToast } from '../components/Toast';
import ConfirmationDialog from '../components/ConfirmationDialog';
import { useI18n } from '../contexts/I18nContext';

interface Role {
  id: string;
  name: string;
  description: string;
  isSystem: boolean;
  approveAllDirections: boolean;
  approverTechDirectionIds: string[];
  userCount: number;
  permissions: Array<{ menuCode: string; permissionType: string }>;
}

const MENU_CODES = [
  { code: 'dashboard', label: 'Dashboard' },
  { code: 'budgets', label: 'Presupuestos' },
  { code: 'expenses', label: 'Gastos' },
  { code: 'plan-values', label: 'Valores Plan' },
  { code: 'committed-transactions', label: 'Trans. Comprometidas' },
  { code: 'real-transactions', label: 'Trans. Reales' },
  { code: 'master-data', label: 'Datos Maestros' },
  { code: 'users', label: 'Usuarios' },
  { code: 'roles', label: 'Roles' },
  { code: 'reports', label: 'Reportes' },
  { code: 'deferrals', label: 'Diferidos' },
  { code: 'approvals', label: 'Aprobaciones' },
  { code: 'audit', label: 'Auditoría' },
];

const PERMISSION_TYPES = [
  { type: 'VIEW', labelKey: 'roles.viewAll' },
  { type: 'VIEW_OWN', labelKey: 'roles.viewOwn' },
  { type: 'MODIFY', labelKey: 'roles.modifyAll' },
  { type: 'MODIFY_OWN', labelKey: 'roles.modifyOwn' },
  { type: 'APPROVE_BUDGET', labelKey: 'roles.approvePerm' },
];

export default function RoleManagementPage() {
  const { t } = useI18n();
  const [roles, setRoles] = useState<Role[]>([]);
  const [techDirections, setTechDirections] = useState<TechnologyDirection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [formData, setFormData] = useState({
    name: '', description: '',
    approveAllDirections: false,
    approverTechDirectionIds: [] as string[],
    permissions: [] as Array<{ menuCode: string; permissionType: string }>
  });
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteTargetRole, setDeleteTargetRole] = useState<Role | null>(null);

  useEffect(() => { loadRoles(); loadTechDirections(); }, []);

  const loadRoles = async () => {
    try {
      const response = await api.get('/roles');
      setRoles(response.data || []);
    } catch (error) { console.error('Error loading roles:', error); }
    finally { setIsLoading(false); }
  };

  const loadTechDirections = async () => {
    try {
      const res = await technologyDirectionApi.getAll();
      setTechDirections(res.data);
    } catch (error) { console.error('Error loading tech directions:', error); }
  };

  const handleCreate = () => {
    setSelectedRole(null);
    setFormData({ name: '', description: '', approveAllDirections: false, approverTechDirectionIds: [], permissions: [] });
    setIsModalOpen(true);
  };

  const handleEdit = async (role: Role) => {
    try {
      const response = await api.get(`/roles/${role.id}`);
      const r = response.data;
      setSelectedRole(r);
      setFormData({
        name: r.name, description: r.description,
        approveAllDirections: r.approveAllDirections || false,
        approverTechDirectionIds: r.approverTechDirectionIds || [],
        permissions: r.permissions || []
      });
      setIsModalOpen(true);
    } catch (error) { showToast('Error al cargar rol', 'error'); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (selectedRole) await api.put(`/roles/${selectedRole.id}`, formData);
      else await api.post('/roles', formData);
      setIsModalOpen(false);
      loadRoles();
    } catch (error: any) { showToast(error.response?.data?.message || 'Error al guardar rol', 'error'); }
  };

  const handleDelete = async (role: Role) => {
    if (role.isSystem) { showToast(t('roles.cantDeleteSystem'), 'error'); return; }
    if (role.userCount > 0) { showToast(t('roles.cantDeleteUsers'), 'error'); return; }
    setDeleteTargetRole(role);
    setShowDeleteDialog(true);
  };

  const confirmDeleteRole = async () => {
    if (!deleteTargetRole) return;
    try { await api.delete(`/roles/${deleteTargetRole.id}`); loadRoles(); } catch (error) { showToast('Error al eliminar rol', 'error'); }
    setShowDeleteDialog(false);
    setDeleteTargetRole(null);
  };

  const togglePermission = (menuCode: string, permissionType: string) => {
    const exists = formData.permissions.some(p => p.menuCode === menuCode && p.permissionType === permissionType);
    if (exists) {
      setFormData({ ...formData, permissions: formData.permissions.filter(p => !(p.menuCode === menuCode && p.permissionType === permissionType)) });
    } else {
      setFormData({ ...formData, permissions: [...formData.permissions, { menuCode, permissionType }] });
    }
  };

  const hasPermission = (menuCode: string, permissionType: string) =>
    formData.permissions.some(p => p.menuCode === menuCode && p.permissionType === permissionType);

  const toggleApproverDirection = (dirId: string) => {
    const ids = formData.approverTechDirectionIds;
    if (ids.includes(dirId)) {
      setFormData({ ...formData, approverTechDirectionIds: ids.filter(id => id !== dirId) });
    } else {
      setFormData({ ...formData, approverTechDirectionIds: [...ids, dirId] });
    }
  };

  const totalUsers = roles.reduce((sum, r) => sum + (r.userCount || 0), 0);
  const totalPermissions = roles.reduce((sum, r) => sum + (r.permissions?.length || 0), 0);

  if (isLoading) return <div className="text-center py-8">{t('msg.loading')}</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div />
        <button onClick={handleCreate} className="btn-primary flex items-center gap-2"><HiOutlinePlusCircle className="w-5 h-5" /> {t('roles.create')}</button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">{t('roles.totalRoles')}</p>
          <p className="text-2xl font-bold text-gray-800">{roles.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">{t('roles.assignedUsers')}</p>
          <p className="text-2xl font-bold text-blue-600">{totalUsers}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">{t('roles.configuredPerms')}</p>
          <p className="text-2xl font-bold text-green-600">{totalPermissions}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {roles.map((role) => (
          <div key={role.id} className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-800">{role.name}</h3>
                {role.isSystem && <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">{t('roles.system')}</span>}
                {role.approveAllDirections && <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded ml-1">{t('roles.globalApprover')}</span>}
                {!role.approveAllDirections && role.approverTechDirectionIds?.length > 0 && (
                  <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded ml-1">{t('roles.areaApprover')} ({role.approverTechDirectionIds.length} {t('roles.areas')})</span>
                )}
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-blue-600">{role.userCount}</p>
                <p className="text-xs text-gray-500">{t('roles.users')}</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-3">{role.description}</p>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">{role.permissions?.length || 0} {t('roles.permissions')}</span>
            </div>
            <div className="flex space-x-2">
              <button onClick={() => handleEdit(role)} className="flex-1 bg-blue-50 text-accent px-3 py-2 rounded hover:bg-blue-100 text-sm flex items-center justify-center gap-1"><HiOutlinePencilSquare className="w-4 h-4" /> {t('btn.edit')}</button>
              {!role.isSystem && (
                <button onClick={() => handleDelete(role)} className="flex-1 bg-red-50 text-red-600 px-3 py-2 rounded hover:bg-red-100 text-sm flex items-center justify-center gap-1" disabled={role.userCount > 0}><HiOutlineTrash className="w-4 h-4" /> {t('btn.delete')}</button>
              )}
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 w-full max-w-5xl m-4">
            <h2 className="text-2xl font-bold mb-4">{selectedRole ? t('roles.edit') : t('roles.create')}</h2>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('roles.roleName')}</label>
                    <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 border rounded-md" required disabled={selectedRole?.isSystem} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('label.description')}</label>
                    <input type="text" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full px-3 py-2 border rounded-md" required />
                  </div>
                </div>

                {/* Approver Config */}
                <div className="border rounded-md p-4 bg-gray-50">
                  <h3 className="text-sm font-bold mb-2">{t('roles.approverConfig')}</h3>
                  <label className="flex items-center gap-2 mb-3">
                    <input type="checkbox" checked={formData.approveAllDirections} onChange={(e) => setFormData({ ...formData, approveAllDirections: e.target.checked })} className="w-4 h-4" />
                    <span className="text-sm">{t('roles.approveAll')}</span>
                  </label>
                  {!formData.approveAllDirections && (
                    <div>
                      <p className="text-xs text-gray-500 mb-2">{t('roles.selectAreas')}</p>
                      <div className="flex flex-wrap gap-2">
                        {techDirections.map(td => (
                          <button key={td.id} type="button" onClick={() => toggleApproverDirection(td.id)}
                            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${formData.approverTechDirectionIds.includes(td.id) ? 'bg-accent text-white' : 'bg-gray-200 text-gray-600'}`}>
                            {td.code} - {td.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Permissions */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('roles.permissionsLabel')}</label>
                  <div className="border rounded-md p-4 max-h-96 overflow-y-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 text-sm">{t('roles.menuLabel')}</th>
                          {PERMISSION_TYPES.map(pt => (
                            <th key={pt.type} className="text-center py-2 text-xs">{t(pt.labelKey)}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {MENU_CODES.map((menu) => (
                          <tr key={menu.code} className="border-b">
                            <td className="py-2 text-sm">{menu.label}</td>
                            {PERMISSION_TYPES.map(pt => (
                              <td key={pt.type} className="text-center">
                                <input type="checkbox" checked={hasPermission(menu.code, pt.type)} onChange={() => togglePermission(menu.code, pt.type)} className="w-4 h-4" />
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-cancel">{t('btn.cancel')}</button>
                <button type="submit" className="btn-primary">{t('btn.save')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmationDialog isOpen={showDeleteDialog} message={`${t('roles.deleteConfirm')} "${deleteTargetRole?.name}"?`} onConfirm={confirmDeleteRole} onCancel={() => { setShowDeleteDialog(false); setDeleteTargetRole(null); }} />
    </div>
  );
}
