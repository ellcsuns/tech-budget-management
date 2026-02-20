import { useState, useEffect } from 'react';
import { expensesEnhancedApi, technologyDirectionApi, userAreaApi } from '../services/api';
import type { ExpenseWithTags, TechnologyDirection, UserArea } from '../types';
import ExpenseDetailPopup from '../components/ExpenseDetailPopup';
import { HiOutlineMagnifyingGlass, HiOutlineTrash, HiOutlineArrowPath, HiOutlinePlusCircle } from 'react-icons/hi2';
import { showToast } from '../components/Toast';
import ConfirmationDialog from '../components/ConfirmationDialog';

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<ExpenseWithTags[]>([]);
  const [techDirections, setTechDirections] = useState<TechnologyDirection[]>([]);
  const [userAreas, setUserAreas] = useState<UserArea[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<ExpenseWithTags | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false);
  const [deactivateTargetId, setDeactivateTargetId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    code: '',
    shortDescription: '',
    longDescription: '',
    technologyDirections: [] as string[],
    userAreas: [] as string[],
    parentExpenseId: ''
  });

  useEffect(() => {
    loadMasterData();
    loadExpenses();
  }, []);

  useEffect(() => { loadExpenses(); }, [showInactive]);

  const loadMasterData = async () => {
    try {
      const [techRes, areasRes] = await Promise.all([
        technologyDirectionApi.getAll(),
        userAreaApi.getAll()
      ]);
      setTechDirections(techRes.data);
      setUserAreas(areasRes.data);
    } catch (error) {
      console.error('Error loading master data:', error);
    }
  };

  const loadExpenses = async () => {
    setIsLoading(true);
    try {
      const filters: any = {};
      if (searchText) filters.searchText = searchText;
      if (showInactive) filters.includeInactive = true;
      const res = await expensesEnhancedApi.getAll(filters);
      setExpenses(res.data);
    } catch (error) {
      console.error('Error loading expenses:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => { loadExpenses(); };

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await expensesEnhancedApi.create(formData);
      setShowForm(false);
      resetForm();
      loadExpenses();
    } catch (error: any) {
      showToast(error.response?.data?.error || 'Error al crear gasto', 'error');
    }
  };

  const handleDeactivateExpense = async (id: string) => {
    setDeactivateTargetId(id);
    setShowDeactivateDialog(true);
  };

  const confirmDeactivate = async () => {
    if (!deactivateTargetId) return;
    try {
      await expensesEnhancedApi.delete(deactivateTargetId);
      loadExpenses();
    } catch (error: any) {
      showToast(error.response?.data?.error || 'Error al desactivar gasto', 'error');
    }
    setShowDeactivateDialog(false);
    setDeactivateTargetId(null);
  };

  const handleReactivateExpense = async (id: string) => {
    try {
      await expensesEnhancedApi.reactivate(id);
      loadExpenses();
    } catch (error: any) {
      showToast(error.response?.data?.error || 'Error al reactivar gasto', 'error');
    }
  };

  const handleViewDetail = async (expense: ExpenseWithTags) => {
    try {
      const res = await expensesEnhancedApi.getById(expense.id);
      setSelectedExpense(res.data);
      setShowDetail(true);
    } catch (error) {
      console.error('Error loading expense detail:', error);
    }
  };

  const resetForm = () => {
    setFormData({ code: '', shortDescription: '', longDescription: '', technologyDirections: [], userAreas: [], parentExpenseId: '' });
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div />
        <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2">
          <HiOutlinePlusCircle className="w-5 h-5" />
          {showForm ? 'Cancelar' : 'Nuevo Gasto'}
        </button>
      </div>

      {/* Search Bar + Inactive Toggle */}
      <div className="bg-white p-4 rounded shadow mb-6">
        <div className="flex gap-4 items-center">
          <input type="text" value={searchText} onChange={(e) => setSearchText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Buscar por código, descripción o tags..." className="flex-1 border rounded px-3 py-2" />
          <button onClick={handleSearch} className="btn-secondary flex items-center gap-2">
            <HiOutlineMagnifyingGlass className="w-4 h-4" /> Buscar
          </button>
          <label className="flex items-center gap-2 text-sm whitespace-nowrap">
            <input type="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} />
            Ver desactivados
          </label>
        </div>
      </div>

      {/* Form - No budgetId, no financialCompanyId */}
      {showForm && (
        <div className="bg-white p-6 rounded shadow mb-6">
          <h2 className="text-xl font-bold mb-4">Crear Nuevo Gasto</h2>
          <form onSubmit={handleCreateExpense}>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Código *</label>
              <input type="text" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} className="w-full border rounded px-3 py-2" required />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Descripción Corta *</label>
              <input type="text" value={formData.shortDescription} onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })} className="w-full border rounded px-3 py-2" required />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Descripción Larga *</label>
              <textarea value={formData.longDescription} onChange={(e) => setFormData({ ...formData, longDescription: e.target.value })} className="w-full border rounded px-3 py-2" rows={3} required />
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1">Direcciones Tecnológicas *</label>
                <select multiple value={formData.technologyDirections} onChange={(e) => setFormData({ ...formData, technologyDirections: Array.from(e.target.selectedOptions, o => o.value) })} className="w-full border rounded px-3 py-2 h-24" required>
                  {techDirections.map(td => (<option key={td.id} value={td.id}>{td.name}</option>))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Áreas de Usuario *</label>
                <select multiple value={formData.userAreas} onChange={(e) => setFormData({ ...formData, userAreas: Array.from(e.target.selectedOptions, o => o.value) })} className="w-full border rounded px-3 py-2 h-24" required>
                  {userAreas.map(ua => (<option key={ua.id} value={ua.id}>{ua.name}</option>))}
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <button type="submit" className="btn-success">Crear Gasto</button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-cancel">Cancelar</button>
            </div>
          </form>
        </div>
      )}

      {/* Expenses Table - No Empresa/Moneda columns */}
      <div className="bg-white rounded shadow">
        {isLoading ? (
          <div className="p-8 text-center">Cargando...</div>
        ) : expenses.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No hay gastos registrados</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 text-left">Código</th>
                <th className="p-3 text-left">Descripción</th>
                <th className="p-3 text-left">Tags</th>
                <th className="p-3 text-center">Estado</th>
                <th className="p-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map(expense => (
                <tr key={expense.id} className={`border-t hover:bg-gray-50 ${!(expense as any).active ? 'opacity-50' : ''}`}>
                  <td className="p-3">{expense.code}</td>
                  <td className="p-3">{expense.shortDescription}</td>
                  <td className="p-3">
                    {expense.customTags.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {expense.customTags.slice(0, 2).map((tag, idx) => (
                          <span key={idx} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">{tag.key}</span>
                        ))}
                        {expense.customTags.length > 2 && <span className="text-xs text-gray-500">+{expense.customTags.length - 2}</span>}
                      </div>
                    ) : <span className="text-gray-400 text-sm">Sin tags</span>}
                  </td>
                  <td className="p-3 text-center">
                    <span className={`px-2 py-1 rounded text-xs ${(expense as any).active !== false ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {(expense as any).active !== false ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="p-3 text-center space-x-2">
                    <button onClick={() => handleViewDetail(expense)} className="icon-btn" title="Ver Detalle"><HiOutlineMagnifyingGlass className="w-5 h-5" /></button>
                    {(expense as any).active !== false ? (
                      <button onClick={() => handleDeactivateExpense(expense.id)} className="icon-btn-danger" title="Desactivar"><HiOutlineTrash className="w-5 h-5" /></button>
                    ) : (
                      <button onClick={() => handleReactivateExpense(expense.id)} className="icon-btn" title="Reactivar"><HiOutlineArrowPath className="w-5 h-5" /></button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showDetail && selectedExpense && (
        <ExpenseDetailPopup expense={selectedExpense} onClose={() => { setShowDetail(false); setSelectedExpense(null); }}
          onUpdate={() => { loadExpenses(); if (selectedExpense) handleViewDetail(selectedExpense); }} />
      )}

      <ConfirmationDialog isOpen={showDeactivateDialog} message="¿Desactivar este gasto? No se eliminará, solo se ocultará de los presupuestos activos." onConfirm={confirmDeactivate} onCancel={() => { setShowDeactivateDialog(false); setDeactivateTargetId(null); }} />
    </div>
  );
}
