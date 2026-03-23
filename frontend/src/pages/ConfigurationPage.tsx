import { useState, useEffect } from 'react';
import { useI18n } from '../contexts/I18nContext';
import { budgetApi } from '../services/api';
import type { Budget } from '../types';
import { showToast } from '../components/Toast';
import ConfirmationDialog from '../components/ConfirmationDialog';
import { HiOutlinePlusCircle, HiOutlineTrash, HiOutlineStar, HiOutlineDocumentDuplicate } from 'react-icons/hi2';

export default function ConfigurationPage() {
  const { t } = useI18n();
  const [allBudgets, setAllBudgets] = useState<Budget[]>([]);
  const [selectedActiveBudget, setSelectedActiveBudget] = useState<string>('');
  const [showActivateConfirm, setShowActivateConfirm] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newBudgetYear, setNewBudgetYear] = useState(new Date().getFullYear());
  const [newBudgetVersion, setNewBudgetVersion] = useState('v1');
  const [sourceBudgetId, setSourceBudgetId] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [showDeleteBudgetDialog, setShowDeleteBudgetDialog] = useState<string | null>(null);

  useEffect(() => { loadBudgets(); }, []);

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

      {/* App Info */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">{t('config.system_info') || 'Información del Sistema'}</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><span className="text-gray-500">{t('config.sysApp')}</span> <span className="font-medium">InvestIQ</span></div>
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
