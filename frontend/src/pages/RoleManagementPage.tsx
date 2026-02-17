import { useState, useEffect } from 'react';
import { api, technologyDirectionApi } from '../services/api';
import type { TechnologyDirection } from '../types';
import { HiOutlinePencilSquare, HiOutlineTrash, HiOutlinePlusCircle } from 'react-icons/hi2';
import { showToast } from '../components/Toast';

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
  { type: 'VIEW', label: 'Ver Todas' },
  { type: 'VIEW_OWN', label: 'Ver Propias' },
  { type: 'MODIFY', label: 'Modificar Todas' },
  { type: 'MODIFY_OWN', label: 'Modificar Propias' },
  { type: 'APPROVE_BUDGET', label: 'Aprobar' },
];

export default function RoleManagementPage() {
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
    if (role.isSystem) { showToast('No se puede eliminar un rol del sistema', 'error'); return; }
    if (role.userCount > 0) { showToast(`No se puede eliminar: tiene ${role.userCount} usuarios asignados`, 'error'); return; }
    if (!confirm(`¿Eliminar el rol "${role.name}"?`)) return;
    try { await api.delete(`/roles/${role.id}`); loadRoles(); } catch (error) { showToast('Error al eliminar rol', 'error'); }
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

  if (isLoading) return <div className="text-center py-8">Cargando...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div />
        <button onClick={handleCreate} className="btn-primary flex items-center gap-2"><HiOutlinePlusCircle className="w-5 h-5" /> Crear Rol</button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Total Roles</p>
          <p className="text-2xl font-bold text-gray-800">{roles.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Usuarios Asignados</p>
          <p className="text-2xl font-bold text-blue-600">{totalUsers}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Permisos Configurados</p>
          <p className="text-2xl font-bold text-green-600">{totalPermissions}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {roles.map((role) => (
          <div key={role.id} className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-800">{role.name}</h3>
                {role.isSystem && <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Sistema</span>}
                {role.approveAllDirections && <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded ml-1">Aprobador Global</span>}
                {!role.approveAllDirections && role.approverTechDirectionIds?.length > 0 && (
                  <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded ml-1">Aprobador ({role.approverTechDirectionIds.length} áreas)</span>
                )}
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-blue-600">{role.userCount}</p>
                <p className="text-xs text-gray-500">usuarios</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-3">{role.description}</p>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">{role.permissions?.length || 0} permisos</span>
            </div>
            <div className="flex space-x-2">
              <button onClick={() => handleEdit(role)} className="flex-1 bg-blue-50 text-accent px-3 py-2 rounded hover:bg-blue-100 text-sm flex items-center justify-center gap-1"><HiOutlinePencilSquare className="w-4 h-4" /> Editar</button>
              {!role.isSystem && (
                <button onClick={() => handleDelete(role)} className="flex-1 bg-red-50 text-red-600 px-3 py-2 rounded hover:bg-red-100 text-sm flex items-center justify-center gap-1" disabled={role.userCount > 0}><HiOutlineTrash className="w-4 h-4" /> Eliminar</button>
              )}
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 w-full max-w-5xl m-4">
            <h2 className="text-2xl font-bold mb-4">{selectedRole ? 'Editar Rol' : 'Crear Rol'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Rol</label>
                    <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 border rounded-md" required disabled={selectedRole?.isSystem} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                    <input type="text" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full px-3 py-2 border rounded-md" required />
                  </div>
                </div>

                {/* Approver Config */}
                <div className="border rounded-md p-4 bg-gray-50">
                  <h3 className="text-sm font-bold mb-2">Configuración de Aprobador</h3>
                  <label className="flex items-center gap-2 mb-3">
                    <input type="checkbox" checked={formData.approveAllDirections} onChange={(e) => setFormData({ ...formData, approveAllDirections: e.target.checked })} className="w-4 h-4" />
                    <span className="text-sm">Aprobar todas las áreas de tecnología</span>
                  </label>
                  {!formData.approveAllDirections && (
                    <div>
                      <p className="text-xs text-gray-500 mb-2">Seleccionar áreas de tecnología que puede aprobar:</p>
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Permisos</label>
                  <div className="border rounded-md p-4 max-h-96 overflow-y-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 text-sm">Menú</th>
                          {PERMISSION_TYPES.map(pt => (
                            <th key={pt.type} className="text-center py-2 text-xs">{pt.label}</th>
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
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-cancel">Cancelar</button>
                <button type="submit" className="btn-primary">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
