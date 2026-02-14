import { useState, useEffect } from 'react';
import { api } from '../services/api';

interface Role {
  id: string;
  name: string;
  description: string;
  isSystem: boolean;
  userCount: number;
  permissions: Array<{
    menuCode: string;
    permissionType: 'VIEW' | 'MODIFY';
  }>;
}

const MENU_CODES = [
  { code: 'dashboard', label: 'Dashboard' },
  { code: 'budgets', label: 'Presupuestos' },
  { code: 'expenses', label: 'Gastos' },
  { code: 'plan-values', label: 'Valores Plan' },
  { code: 'committed-transactions', label: 'Transacciones Comprometidas' },
  { code: 'real-transactions', label: 'Transacciones Reales' },
  { code: 'master-data', label: 'Datos Maestros' },
  { code: 'users', label: 'Usuarios' },
  { code: 'roles', label: 'Roles' },
  { code: 'reports', label: 'Reportes' },
];

export default function RoleManagementPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permissions: [] as Array<{ menuCode: string; permissionType: 'VIEW' | 'MODIFY' }>
  });

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    try {
      const response = await api.get('/roles');
      setRoles(response.data || []);
    } catch (error) {
      console.error('Error loading roles:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = () => {
    setSelectedRole(null);
    setFormData({
      name: '',
      description: '',
      permissions: []
    });
    setIsModalOpen(true);
  };

  const handleEdit = async (role: Role) => {
    try {
      const response = await api.get(`/roles/${role.id}`);
      setSelectedRole(response.data);
      setFormData({
        name: response.data.name,
        description: response.data.description,
        permissions: response.data.permissions || []
      });
      setIsModalOpen(true);
    } catch (error) {
      alert('Error al cargar rol');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (selectedRole) {
        await api.put(`/roles/${selectedRole.id}`, formData);
      } else {
        await api.post('/roles', formData);
      }
      setIsModalOpen(false);
      loadRoles();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error al guardar rol');
    }
  };

  const handleDelete = async (role: Role) => {
    if (role.isSystem) {
      alert('No se puede eliminar un rol del sistema');
      return;
    }
    if (role.userCount > 0) {
      alert(`No se puede eliminar el rol porque tiene ${role.userCount} usuarios asignados`);
      return;
    }
    if (!confirm(`¿Está seguro de eliminar el rol "${role.name}"?`)) {
      return;
    }
    try {
      await api.delete(`/roles/${role.id}`);
      loadRoles();
    } catch (error) {
      alert('Error al eliminar rol');
    }
  };

  const togglePermission = (menuCode: string, permissionType: 'VIEW' | 'MODIFY') => {
    const exists = formData.permissions.some(
      p => p.menuCode === menuCode && p.permissionType === permissionType
    );

    if (exists) {
      setFormData({
        ...formData,
        permissions: formData.permissions.filter(
          p => !(p.menuCode === menuCode && p.permissionType === permissionType)
        )
      });
    } else {
      setFormData({
        ...formData,
        permissions: [...formData.permissions, { menuCode, permissionType }]
      });
    }
  };

  const hasPermission = (menuCode: string, permissionType: 'VIEW' | 'MODIFY') => {
    return formData.permissions.some(
      p => p.menuCode === menuCode && p.permissionType === permissionType
    );
  };

  if (isLoading) {
    return <div className="text-center py-8">Cargando...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Gestión de Roles</h1>
        <button
          onClick={handleCreate}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          + Crear Rol
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {roles.map((role) => (
          <div key={role.id} className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-800">{role.name}</h3>
                {role.isSystem && (
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    Sistema
                  </span>
                )}
              </div>
              <div className="text-sm text-gray-500">
                {role.userCount} usuarios
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-4">{role.description}</p>
            <div className="text-sm text-gray-500 mb-4">
              {role.permissions?.length || 0} permisos configurados
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => handleEdit(role)}
                className="flex-1 bg-blue-50 text-blue-600 px-3 py-2 rounded hover:bg-blue-100"
              >
                Editar
              </button>
              {!role.isSystem && (
                <button
                  onClick={() => handleDelete(role)}
                  className="flex-1 bg-red-50 text-red-600 px-3 py-2 rounded hover:bg-red-100"
                  disabled={role.userCount > 0}
                >
                  Eliminar
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl m-4">
            <h2 className="text-2xl font-bold mb-4">
              {selectedRole ? 'Editar Rol' : 'Crear Rol'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre del Rol
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                    required
                    disabled={selectedRole?.isSystem}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                    rows={3}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Permisos
                  </label>
                  <div className="border rounded-md p-4 max-h-96 overflow-y-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2">Menú</th>
                          <th className="text-center py-2">Ver</th>
                          <th className="text-center py-2">Modificar</th>
                        </tr>
                      </thead>
                      <tbody>
                        {MENU_CODES.map((menu) => (
                          <tr key={menu.code} className="border-b">
                            <td className="py-2">{menu.label}</td>
                            <td className="text-center">
                              <input
                                type="checkbox"
                                checked={hasPermission(menu.code, 'VIEW')}
                                onChange={() => togglePermission(menu.code, 'VIEW')}
                                className="w-4 h-4"
                              />
                            </td>
                            <td className="text-center">
                              <input
                                type="checkbox"
                                checked={hasPermission(menu.code, 'MODIFY')}
                                onChange={() => togglePermission(menu.code, 'MODIFY')}
                                className="w-4 h-4"
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    El permiso de "Modificar" incluye automáticamente el permiso de "Ver"
                  </p>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border rounded-md hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
