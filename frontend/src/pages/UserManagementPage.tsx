import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { HiOutlinePencilSquare, HiOutlinePauseCircle, HiOutlinePlayCircle, HiOutlinePlusCircle } from 'react-icons/hi2';

interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  active: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  roles: Array<{ id: string; name: string }>;
}

interface Role {
  id: string;
  name: string;
  description: string;
}

export default function UserManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    username: '', password: '', email: '', fullName: '', roleIds: [] as string[]
  });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [usersRes, rolesRes] = await Promise.all([api.get('/users'), api.get('/roles')]);
      setUsers(usersRes.data.users || []);
      setRoles(rolesRes.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = () => {
    setSelectedUser(null);
    setFormData({ username: '', password: '', email: '', fullName: '', roleIds: [] });
    setIsModalOpen(true);
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setFormData({ username: user.username, password: '', email: user.email, fullName: user.fullName, roleIds: user.roles.map(r => r.id) });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (selectedUser) {
        await api.put(`/users/${selectedUser.id}`, { email: formData.email, fullName: formData.fullName, roleIds: formData.roleIds });
      } else {
        await api.post('/users', formData);
      }
      setIsModalOpen(false);
      loadData();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error al guardar usuario');
    }
  };

  const handleToggleStatus = async (user: User) => {
    try {
      await api.put(`/users/${user.id}/status`, { active: !user.active });
      loadData();
    } catch (error) {
      alert('Error al cambiar estado del usuario');
    }
  };

  const activeCount = users.filter(u => u.active).length;
  const inactiveCount = users.filter(u => !u.active).length;

  if (isLoading) return <div className="text-center py-8">Cargando...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Gestión de Usuarios</h1>
        <button onClick={handleCreate} className="btn-primary flex items-center gap-2"><HiOutlinePlusCircle className="w-5 h-5" /> Crear Usuario</button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Total Usuarios</p>
          <p className="text-2xl font-bold text-gray-800">{users.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Activos</p>
          <p className="text-2xl font-bold text-green-600">{activeCount}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Inactivos</p>
          <p className="text-2xl font-bold text-red-600">{inactiveCount}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usuario</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Roles</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Último Login</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{user.username}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{user.fullName}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{user.email}</td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  <div className="flex flex-wrap gap-1">
                    {user.roles.map(r => (
                      <span key={r.id} className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded">{r.name}</span>
                    ))}
                  </div>
                  <span className="text-xs text-gray-400">{user.roles.length} rol(es)</span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : <span className="text-gray-400">Nunca</span>}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs rounded-full ${user.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {user.active ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="px-6 py-4 text-center space-x-2">
                  <button onClick={() => handleEdit(user)} className="icon-btn" title="Editar"><HiOutlinePencilSquare className="w-5 h-5" /></button>
                  <button onClick={() => handleToggleStatus(user)} className={user.active ? 'icon-btn text-yellow-600' : 'icon-btn text-green-600'} title={user.active ? 'Desactivar' : 'Activar'}>
                    {user.active ? <HiOutlinePauseCircle className="w-5 h-5" /> : <HiOutlinePlayCircle className="w-5 h-5" />}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4">{selectedUser ? 'Editar Usuario' : 'Crear Usuario'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Usuario</label>
                  <input type="text" value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} className="w-full px-3 py-2 border rounded-md" required disabled={!!selectedUser} />
                </div>
                {!selectedUser && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
                    <input type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="w-full px-3 py-2 border rounded-md" required />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full px-3 py-2 border rounded-md" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
                  <input type="text" value={formData.fullName} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} className="w-full px-3 py-2 border rounded-md" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Roles</label>
                  <select multiple value={formData.roleIds} onChange={(e) => setFormData({ ...formData, roleIds: Array.from(e.target.selectedOptions, o => o.value) })} className="w-full px-3 py-2 border rounded-md" size={4} required>
                    {roles.map(role => (<option key={role.id} value={role.id}>{role.name}</option>))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Ctrl/Cmd + click para seleccionar múltiples</p>
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
