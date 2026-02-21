import { useState, useEffect } from 'react';
import { useI18n } from '../contexts/I18nContext';
import { budgetApi } from '../services/api';
import type { Budget } from '../types';
import { showToast } from '../components/Toast';
import ConfirmationDialog from '../components/ConfirmationDialog';
import { HiOutlinePlusCircle, HiOutlineTrash, HiOutlineStar, HiOutlineDocumentDuplicate } from 'react-icons/hi2';

const THEMES = [
  { id: 'default', nameKey: 'theme.default', primary: '#1E40AF', sidebar: '#111827', accent: '#3B82F6' },
  { id: 'green', nameKey: 'theme.green', primary: '#065F46', sidebar: '#064E3B', accent: '#10B981' },
  { id: 'purple', nameKey: 'theme.purple', primary: '#5B21B6', sidebar: '#1E1B4B', accent: '#8B5CF6' },
  { id: 'red', nameKey: 'theme.red', primary: '#991B1B', sidebar: '#1C1917', accent: '#EF4444' },
  { id: 'teal', nameKey: 'theme.teal', primary: '#0F766E', sidebar: '#134E4A', accent: '#14B8A6' },
  { id: 'orange', nameKey: 'theme.orange', primary: '#9A3412', sidebar: '#1C1917', accent: '#F97316' },
];

const FONT_SIZES = [
  { id: 'xs', labelKey: 'config.fontSize.xs', scale: 0.8 },
  { id: 'sm', labelKey: 'config.fontSize.sm', scale: 0.9 },
  { id: 'md', labelKey: 'config.fontSize.md', scale: 1.0 },
  { id: 'lg', labelKey: 'config.fontSize.lg', scale: 1.1 },
  { id: 'xl', labelKey: 'config.fontSize.xl', scale: 1.2 },
];

export default function ConfigurationPage() {
  const { locale, setLocale, t } = useI18n();
  const [currentTheme, setCurrentTheme] = useState('default');
  const [previewTheme, setPreviewTheme] = useState<string | null>(null);
  const [fontSize, setFontSize] = useState('md');
  const [allBudgets, setAllBudgets] = useState<Budget[]>([]);
  const [selectedActiveBudget, setSelectedActiveBudget] = useState<string>('');
  const [showActivateConfirm, setShowActivateConfirm] = useState(false);

  // Budget management
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newBudgetYear, setNewBudgetYear] = useState(new Date().getFullYear());
  const [newBudgetVersion, setNewBudgetVersion] = useState('v1');
  const [sourceBudgetId, setSourceBudgetId] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [showDeleteBudgetDialog, setShowDeleteBudgetDialog] = useState<string | null>(null);

  useEffect(() => {
    const savedTheme = localStorage.getItem('app_theme');
    if (savedTheme) setCurrentTheme(savedTheme);
    const savedFont = localStorage.getItem('app_font_size');
    if (savedFont) setFontSize(savedFont);
    loadBudgets();
  }, []);

  const loadBudgets = async () => {
    try {
      const res = await budgetApi.getAll();
      setAllBudgets(res.data);
      const active = res.data.find((b: Budget) => b.isActive);
      if (active) setSelectedActiveBudget(active.id);
    } catch (error) { console.error('Error loading budgets:', error); }
  };

  const handleSetActiveBudget = async () => {
    try {
      await budgetApi.setActive(selectedActiveBudget);
      showToast(t('config.activeUpdated'), 'success');
      setShowActivateConfirm(false);
      loadBudgets();
    } catch (error: any) {
      showToast(error.response?.data?.error || 'Error al cambiar presupuesto vigente', 'error');
      setShowActivateConfirm(false);
    }
  };

  const handleCreateBudget = async () => {
    setIsCreating(true);
    try {
      await budgetApi.create({ year: newBudgetYear, version: newBudgetVersion, sourceBudgetId: sourceBudgetId || undefined });
      showToast(t('budget.budgetCreated') || 'Presupuesto creado', 'success');
      setShowCreateModal(false);
      setSourceBudgetId('');
      setNewBudgetVersion('v1');
      loadBudgets();
    } catch (error: any) {
      showToast(error.response?.data?.error || 'Error al crear presupuesto', 'error');
    } finally { setIsCreating(false); }
  };

  const handleDeleteBudget = async () => {
    if (!showDeleteBudgetDialog) return;
    try {
      await budgetApi.delete(showDeleteBudgetDialog);
      showToast(t('budget.budgetDeleted') || 'Presupuesto eliminado', 'success');
      setShowDeleteBudgetDialog(null);
      loadBudgets();
    } catch (error: any) {
      showToast(error.response?.data?.error || 'Error al eliminar presupuesto', 'error');
    }
  };

  const applyTheme = (themeId: string) => {
    const theme = THEMES.find(t => t.id === themeId);
    if (!theme) return;
    document.documentElement.style.setProperty('--color-primary', theme.primary);
    document.documentElement.style.setProperty('--color-sidebar', theme.sidebar);
    document.documentElement.style.setProperty('--color-accent', theme.accent);
    localStorage.setItem('app_theme', themeId);
    setCurrentTheme(themeId);
  };

  const applyFontSize = (sizeId: string) => {
    const size = FONT_SIZES.find(s => s.id === sizeId);
    if (!size) return;
    document.documentElement.style.fontSize = `${size.scale * 16}px`;
    localStorage.setItem('app_font_size', sizeId);
    setFontSize(sizeId);
  };

  const previewData = previewTheme ? THEMES.find(t => t.id === previewTheme) : null;

  return (
    <div className="space-y-6">

      {/* Active Budget Selection */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">{t('config.activeBudget')}</h2>
        <p className="text-sm text-gray-600 mb-4">{t('config.activeBudgetDesc')}</p>
        <div className="flex items-center gap-4">
          <select value={selectedActiveBudget} onChange={(e) => setSelectedActiveBudget(e.target.value)} className="border rounded px-3 py-2 w-64">
            <option value="">{t('config.selectBudget')}</option>
            {allBudgets.map(b => (
              <option key={b.id} value={b.id}>
                {b.year} - v{b.version} {b.isActive ? '(Vigente)' : ''}
              </option>
            ))}
          </select>
          {selectedActiveBudget && !allBudgets.find(b => b.id === selectedActiveBudget)?.isActive && (
            <button onClick={() => setShowActivateConfirm(true)} className="btn-primary">
              {t('config.setActive')}
            </button>
          )}
          {allBudgets.find(b => b.isActive) && (
            <span className="px-3 py-1 bg-green-100 text-green-800 rounded text-sm">
              {t('config.currentActive')} {allBudgets.find(b => b.isActive)?.year} v{allBudgets.find(b => b.isActive)?.version}
            </span>
          )}
        </div>
      </div>

      {showActivateConfirm && (
        <ConfirmationDialog
          isOpen={showActivateConfirm}
          title={t('config.changeActiveTitle')}
          message={t('config.changeActiveConfirm')}
          onConfirm={handleSetActiveBudget}
          onCancel={() => setShowActivateConfirm(false)}
        />
      )}

      {/* Budget Management */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">{t('config.budgetManagement') || 'Gestión de Presupuestos'}</h2>
          <button onClick={() => setShowCreateModal(true)} className="flex items-center gap-1 px-4 py-2 bg-accent text-white rounded hover:opacity-90 text-sm">
            <HiOutlinePlusCircle className="w-4 h-4" /> {t('budget.newBudget') || 'Nuevo Presupuesto'}
          </button>
        </div>
        <p className="text-sm text-gray-600 mb-4">{t('config.budgetManagementDesc') || 'Crear, eliminar y administrar presupuestos del sistema.'}</p>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs text-gray-500">{t('label.year') || 'Año'}</th>
                <th className="px-4 py-2 text-left text-xs text-gray-500">{t('label.version') || 'Versión'}</th>
                <th className="px-4 py-2 text-left text-xs text-gray-500">{t('label.status') || 'Estado'}</th>
                <th className="px-4 py-2 text-right text-xs text-gray-500">{t('table.actions') || 'Acciones'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {allBudgets.map(b => (
                <tr key={b.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2">{b.year}</td>
                  <td className="px-4 py-2">{b.version}</td>
                  <td className="px-4 py-2">
                    {b.isActive ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-800 rounded text-xs font-medium">
                        <HiOutlineStar className="w-3 h-3" /> {t('budget.active') || 'Vigente'}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">{t('budget.inactive') || 'Inactivo'}</span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-right">
                    {!b.isActive && (
                      <button onClick={() => setShowDeleteBudgetDialog(b.id)} className="text-red-500 hover:text-red-700" title={t('btn.delete') || 'Eliminar'}>
                        <HiOutlineTrash className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {allBudgets.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-4 text-center text-gray-400">{t('config.noBudgets') || 'No hay presupuestos creados'}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Budget Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">{t('budget.newBudget') || 'Nuevo Presupuesto'}</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('label.year') || 'Año'}</label>
                <input type="number" value={newBudgetYear} onChange={e => setNewBudgetYear(parseInt(e.target.value))}
                  className="w-full border rounded px-3 py-2 text-sm" min={2020} max={2040} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('label.version') || 'Versión'}</label>
                <input type="text" value={newBudgetVersion} onChange={e => setNewBudgetVersion(e.target.value)}
                  className="w-full border rounded px-3 py-2 text-sm" placeholder="v1" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <HiOutlineDocumentDuplicate className="w-4 h-4 inline mr-1" />
                  {t('budget.copyFrom') || 'Copiar desde'}
                </label>
                <select value={sourceBudgetId} onChange={e => setSourceBudgetId(e.target.value)}
                  className="w-full border rounded px-3 py-2 text-sm">
                  <option value="">{t('budget.emptyBudget') || 'Presupuesto vacío'}</option>
                  {allBudgets.map(b => (
                    <option key={b.id} value={b.id}>{b.year} - {b.version}{b.isActive ? ` (${t('budget.active') || 'Vigente'})` : ''}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-400 mt-1">{t('budget.copyNote') || 'Se copiarán las líneas y valores del presupuesto seleccionado'}</p>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setShowCreateModal(false)} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 text-sm">{t('btn.cancel') || 'Cancelar'}</button>
              <button onClick={handleCreateBudget} disabled={isCreating || !newBudgetVersion.trim()}
                className="px-4 py-2 bg-accent text-white rounded hover:opacity-90 text-sm disabled:opacity-50">
                {isCreating ? t('msg.creating') || 'Creando...' : t('budget.createBudget') || 'Crear Presupuesto'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteBudgetDialog && (
        <ConfirmationDialog
          isOpen={!!showDeleteBudgetDialog}
          title={t('budget.deleteBudgetTitle') || 'Eliminar Presupuesto'}
          message={t('budget.deleteBudgetConfirm') || '¿Estás seguro de que deseas eliminar este presupuesto? Esta acción no se puede deshacer.'}
          onConfirm={handleDeleteBudget}
          onCancel={() => setShowDeleteBudgetDialog(null)}
        />
      )}

      {/* Language Selection */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">{t('config.language') || 'Idioma'}</h2>
        <p className="text-sm text-gray-600 mb-4">{t('config.language_desc') || 'Selecciona el idioma de la interfaz.'}</p>
        <div className="flex gap-4">
          <button onClick={() => setLocale('es')}
            className={`px-6 py-3 rounded-lg border-2 transition-all ${locale === 'es' ? 'border-accent bg-blue-50 ring-2 ring-accent' : 'border-gray-200 hover:border-gray-400'}`}>
            <span className="text-2xl mr-2">🇪🇸</span>
            <span className="font-medium">Español</span>
          </button>
          <button onClick={() => setLocale('en')}
            className={`px-6 py-3 rounded-lg border-2 transition-all ${locale === 'en' ? 'border-accent bg-blue-50 ring-2 ring-accent' : 'border-gray-200 hover:border-gray-400'}`}>
            <span className="text-2xl mr-2">🇺🇸</span>
            <span className="font-medium">English</span>
          </button>
        </div>
      </div>

      {/* Font Size */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">{t('config.font_size') || 'Tamaño de Texto'}</h2>
        <p className="text-sm text-gray-600 mb-4">{t('config.font_size_desc') || 'Ajusta el tamaño del texto en toda la aplicación.'}</p>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400">A</span>
          <div className="flex gap-2">
            {FONT_SIZES.map(size => (
              <button
                key={size.id}
                onClick={() => applyFontSize(size.id)}
                className={`px-4 py-2 rounded-lg border-2 transition-all ${fontSize === size.id ? 'border-accent bg-blue-50 ring-2 ring-accent' : 'border-gray-200 hover:border-gray-400'}`}
              >
                <span style={{ fontSize: `${size.scale * 14}px` }} className="font-medium">{t(size.labelKey)}</span>
              </button>
            ))}
          </div>
          <span className="text-xl text-gray-400">A</span>
        </div>
        <p className="text-xs text-gray-400 mt-3">{t('config.fontPreview')} <span style={{ fontSize: `${(FONT_SIZES.find(s => s.id === fontSize)?.scale || 1) * 14}px` }}>{t('config.fontPreviewText')}</span></p>
      </div>

      {/* Theme Selection */}
      <div className="bg-white rounded-lg shadow p-6 relative">
        <h2 className="text-xl font-bold mb-4">{t('config.theme') || 'Paleta de Colores / Tema'}</h2>
        <p className="text-sm text-gray-600 mb-4">{t('config.theme_desc') || 'Selecciona un tema. Pasa el cursor para ver un preview.'}</p>
        <div className="grid grid-cols-3 gap-4">
          {THEMES.map(theme => (
            <button
              key={theme.id}
              onClick={() => applyTheme(theme.id)}
              onMouseEnter={() => setPreviewTheme(theme.id)}
              onMouseLeave={() => setPreviewTheme(null)}
              className={`p-4 rounded-lg border-2 transition-all ${currentTheme === theme.id ? 'border-accent ring-2 ring-accent' : 'border-gray-200 hover:border-gray-400'}`}
            >
              <div className="flex gap-2 mb-3">
                <div className="w-8 h-8 rounded-full" style={{ backgroundColor: theme.primary }} />
                <div className="w-8 h-8 rounded-full" style={{ backgroundColor: theme.sidebar }} />
                <div className="w-8 h-8 rounded-full" style={{ backgroundColor: theme.accent }} />
              </div>
              <p className="text-sm font-medium text-gray-800">{t(theme.nameKey)}</p>
              {currentTheme === theme.id && <p className="text-xs text-accent mt-1">{t('config.themeActive')}</p>}
            </button>
          ))}
        </div>

        {previewData && (
          <div className="absolute right-0 top-16 w-72 bg-white rounded-lg shadow-xl border p-4 z-50">
            <p className="text-sm font-bold mb-3">{t('config.themePreview')} {previewData ? t(previewData.nameKey) : ''}</p>
            <div className="rounded-lg overflow-hidden mb-3" style={{ backgroundColor: previewData.sidebar }}>
              <div className="p-3 border-b border-gray-600">
                <p className="text-white text-sm font-bold">Tech Budget</p>
              </div>
              <div className="p-2 space-y-1">
                <div className="px-3 py-2 rounded text-white text-xs" style={{ backgroundColor: previewData.accent }}>Dashboard</div>
                <div className="px-3 py-2 rounded text-gray-300 text-xs">Presupuestos</div>
                <div className="px-3 py-2 rounded text-gray-300 text-xs">Gastos</div>
              </div>
            </div>
            <div className="flex gap-2 mb-3">
              <button className="px-3 py-1 text-white text-xs rounded" style={{ backgroundColor: previewData.primary }}>Guardar</button>
              <button className="px-3 py-1 text-white text-xs rounded" style={{ backgroundColor: previewData.accent }}>Editar</button>
              <button className="px-3 py-1 text-xs rounded border" style={{ borderColor: previewData.accent, color: previewData.accent }}>Cancelar</button>
            </div>
          </div>
        )}
      </div>

      {/* App Info */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">{t('config.system_info') || 'Información del Sistema'}</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><span className="text-gray-500">{t('config.sysApp')}</span> <span className="font-medium">Tech Budget Management</span></div>
          <div><span className="text-gray-500">{t('config.sysVersion')}</span> <span className="font-medium">2.0.0</span></div>
          <div><span className="text-gray-500">{t('config.sysBackend')}</span> <span className="font-medium">Node.js + Express + Prisma</span></div>
          <div><span className="text-gray-500">{t('config.sysFrontend')}</span> <span className="font-medium">React + TypeScript + Tailwind</span></div>
          <div><span className="text-gray-500">{t('config.sysDatabase')}</span> <span className="font-medium">PostgreSQL</span></div>
          <div><span className="text-gray-500">{t('config.sysHosting')}</span> <span className="font-medium">AWS EC2</span></div>
        </div>
      </div>
    </div>
  );
}
