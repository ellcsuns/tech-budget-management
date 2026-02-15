import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';
import Logo from './icons/Logo';
import {
  HiOutlineChartBarSquare,
  HiOutlineBanknotes,
  HiOutlineCurrencyDollar,
  HiOutlineCalendarDays,
  HiOutlineDocumentText,
  HiOutlineChartBar,
  HiOutlineLockClosed,
  HiOutlineCheckCircle,
  HiOutlineDocumentChartBar,
  HiOutlineCog6Tooth,
  HiOutlineCircleStack,
  HiOutlineUserGroup,
  HiOutlineShieldCheck,
  HiOutlineArrowRightOnRectangle,
  HiOutlineScale,
  HiOutlineTableCells,
  HiOutlineLanguage,
} from 'react-icons/hi2';
import { IconType } from 'react-icons';

interface MenuItem {
  path: string;
  labelKey: string;
  fallback: string;
  icon: IconType;
  menuCode: string;
  section?: string;
}

const menuItems: MenuItem[] = [
  { path: '/dashboard', labelKey: 'menu.dashboard', fallback: 'Dashboard', icon: HiOutlineChartBarSquare, menuCode: 'dashboard' },
  { path: '/budgets', labelKey: 'menu.budgets', fallback: 'Presupuestos', icon: HiOutlineBanknotes, menuCode: 'budgets' },
  { path: '/budget-compare', labelKey: 'menu.compareBudgets', fallback: 'Comparar Presupuestos', icon: HiOutlineScale, menuCode: 'budgets' },
  { path: '/savings', labelKey: 'menu.savings', fallback: 'Ahorros', icon: HiOutlineCurrencyDollar, menuCode: 'budgets' },
  { path: '/deferrals', labelKey: 'menu.deferrals', fallback: 'Diferidos', icon: HiOutlineCalendarDays, menuCode: 'budgets' },
  { path: '/expenses', labelKey: 'menu.expenses', fallback: 'Gastos', icon: HiOutlineDocumentText, menuCode: 'expenses' },
  { path: '/plan-values', labelKey: 'menu.planValues', fallback: 'Valores Plan', icon: HiOutlineChartBar, menuCode: 'plan-values' },
  { path: '/committed-transactions', labelKey: 'menu.committedTransactions', fallback: 'Trans. Comprometidas', icon: HiOutlineLockClosed, menuCode: 'committed-transactions' },
  { path: '/real-transactions', labelKey: 'menu.realTransactions', fallback: 'Trans. Reales', icon: HiOutlineCheckCircle, menuCode: 'real-transactions' },
  { path: '/reports', labelKey: 'menu.reports', fallback: 'Reportes', icon: HiOutlineDocumentChartBar, menuCode: 'reports' },
  { path: '/detailed-reports', labelKey: 'menu.detailedReports', fallback: 'Reportes Detallados', icon: HiOutlineTableCells, menuCode: 'reports' },
  { path: '/configuration', labelKey: 'menu.configuration', fallback: 'Configuración', icon: HiOutlineCog6Tooth, menuCode: 'users', section: 'config' },
  { path: '/master-data', labelKey: 'menu.masterData', fallback: 'Datos Maestros', icon: HiOutlineCircleStack, menuCode: 'master-data', section: 'config' },
  { path: '/users', labelKey: 'menu.users', fallback: 'Usuarios', icon: HiOutlineUserGroup, menuCode: 'users', section: 'config' },
  { path: '/roles', labelKey: 'menu.roles', fallback: 'Roles', icon: HiOutlineShieldCheck, menuCode: 'roles', section: 'config' },
  { path: '/translations', labelKey: 'menu.translations', fallback: 'Traducciones', icon: HiOutlineLanguage, menuCode: 'users', section: 'config' },
];

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { hasPermission, logout, user } = useAuth();
  const { t } = useI18n();
  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem('sidebar_collapsed') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('sidebar_collapsed', String(collapsed));
  }, [collapsed]);

  const visibleMenuItems = menuItems.filter(item => hasPermission(item.menuCode, 'VIEW'));
  const mainItems = visibleMenuItems.filter(i => !i.section);
  const configItems = visibleMenuItems.filter(i => i.section === 'config');

  return (
    <div className={`${collapsed ? 'w-16' : 'w-64'} bg-sidebar text-white min-h-screen flex flex-col transition-all duration-300`}>
      {/* Header - clickable to go to dashboard */}
      <div className="p-4 border-b border-gray-700">
        <div
          className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => navigate('/dashboard')}
          title="Ir al Dashboard"
        >
          <Logo size={collapsed ? 28 : 36} />
          {!collapsed && (
            <div>
              <h1 className="text-lg font-bold">Tech Budget</h1>
              <p className="text-xs text-gray-400">{t('app.subtitle') || 'Gestión de Presupuesto'}</p>
            </div>
          )}
        </div>
      </div>

      {/* Toggle button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="mx-auto my-2 p-1 rounded hover:bg-gray-700 transition-colors text-gray-400 hover:text-white"
        title={collapsed ? 'Expandir menú' : 'Colapsar menú'}
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          {collapsed ? (
            <path d="M7 4l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          ) : (
            <path d="M13 4l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          )}
        </svg>
      </button>

      {/* User info */}
      {!collapsed && (
        <div className="px-4 pb-3 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-accent rounded-full flex items-center justify-center flex-shrink-0">
              <HiOutlineUserGroup className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.fullName}</p>
              <p className="text-xs text-gray-400 truncate">{user?.username}</p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {mainItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <Link key={item.path} to={item.path}
              title={collapsed ? (t(item.labelKey) || item.fallback) : undefined}
              className={`flex items-center ${collapsed ? 'justify-center' : 'space-x-3 px-4'} py-3 rounded-lg transition-colors ${isActive ? 'bg-accent text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'}`}>
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span className="text-sm font-medium">{t(item.labelKey) || item.fallback}</span>}
            </Link>
          );
        })}

        {configItems.length > 0 && (
          <>
            <div className="pt-4 pb-2">
              {!collapsed && (
                <p className="text-xs text-gray-500 uppercase tracking-wider px-4">{t('section.administration') || 'Administración'}</p>
              )}
              {collapsed && <div className="border-t border-gray-700 mx-2" />}
            </div>
            {configItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              return (
                <Link key={item.path} to={item.path}
                  title={collapsed ? (t(item.labelKey) || item.fallback) : undefined}
                  className={`flex items-center ${collapsed ? 'justify-center' : 'space-x-3 px-4'} py-3 rounded-lg transition-colors ${isActive ? 'bg-accent text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'}`}>
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {!collapsed && <span className="text-sm font-medium">{t(item.labelKey) || item.fallback}</span>}
                </Link>
              );
            })}
          </>
        )}
      </nav>

      {/* Logout */}
      <div className="p-2 border-t border-gray-700">
        <button onClick={logout}
          title={collapsed ? (t('btn.logout') || 'Cerrar Sesión') : undefined}
          className={`w-full flex items-center ${collapsed ? 'justify-center' : 'space-x-3 px-4'} py-3 rounded-lg text-gray-300 hover:bg-red-600 hover:text-white transition-colors`}>
          <HiOutlineArrowRightOnRectangle className="w-5 h-5" />
          {!collapsed && <span className="text-sm font-medium">{t('btn.logout') || 'Cerrar Sesión'}</span>}
        </button>
      </div>
    </div>
  );
}
