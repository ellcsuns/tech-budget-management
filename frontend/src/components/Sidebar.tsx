import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface MenuItem {
  path: string;
  label: string;
  icon: string;
  menuCode: string;
  section?: string;
}

const menuItems: MenuItem[] = [
  { path: '/dashboard', label: 'Dashboard', icon: '📊', menuCode: 'dashboard' },
  { path: '/budgets', label: 'Presupuestos', icon: '💰', menuCode: 'budgets' },
  { path: '/savings', label: 'Ahorros', icon: '💵', menuCode: 'budgets' },
  { path: '/deferrals', label: 'Diferidos', icon: '📅', menuCode: 'budgets' },
  { path: '/expenses', label: 'Gastos', icon: '📝', menuCode: 'expenses' },
  { path: '/plan-values', label: 'Valores Plan', icon: '📈', menuCode: 'plan-values' },
  { path: '/committed-transactions', label: 'Trans. Comprometidas', icon: '🔒', menuCode: 'committed-transactions' },
  { path: '/real-transactions', label: 'Trans. Reales', icon: '✅', menuCode: 'real-transactions' },
  { path: '/reports', label: 'Reportes', icon: '📄', menuCode: 'reports' },
  // Configuration section
  { path: '/configuration', label: 'Configuración', icon: '⚙️', menuCode: 'users', section: 'config' },
  { path: '/master-data', label: 'Datos Maestros', icon: '🗂️', menuCode: 'master-data', section: 'config' },
  { path: '/users', label: 'Usuarios', icon: '👥', menuCode: 'users', section: 'config' },
  { path: '/roles', label: 'Roles', icon: '🔐', menuCode: 'roles', section: 'config' },
];

export default function Sidebar() {
  const location = useLocation();
  const { hasPermission, logout, user } = useAuth();

  const visibleMenuItems = menuItems.filter(item => 
    hasPermission(item.menuCode, 'VIEW')
  );

  const mainItems = visibleMenuItems.filter(i => !i.section);
  const configItems = visibleMenuItems.filter(i => i.section === 'config');

  return (
    <div className="w-64 bg-gray-900 text-white min-h-screen flex flex-col">
      <div className="p-6 border-b border-gray-700">
        <h1 className="text-xl font-bold">Tech Budget</h1>
        <p className="text-sm text-gray-400 mt-1">Gestión de Presupuesto</p>
      </div>

      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="text-lg">👤</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.fullName}</p>
            <p className="text-xs text-gray-400 truncate">{user?.username}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {mainItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link key={item.path} to={item.path}
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${isActive ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'}`}>
              <span className="text-xl">{item.icon}</span>
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          );
        })}

        {configItems.length > 0 && (
          <>
            <div className="pt-4 pb-2">
              <p className="text-xs text-gray-500 uppercase tracking-wider px-4">Administración</p>
            </div>
            {configItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link key={item.path} to={item.path}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${isActive ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'}`}>
                  <span className="text-xl">{item.icon}</span>
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              );
            })}
          </>
        )}
      </nav>

      <div className="p-4 border-t border-gray-700">
        <button onClick={logout}
          className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-red-600 hover:text-white transition-colors">
          <span className="text-xl">🚪</span>
          <span className="text-sm font-medium">Cerrar Sesión</span>
        </button>
      </div>
    </div>
  );
}
