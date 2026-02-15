import { useState, useEffect } from 'react';
import { savingsApi, budgetApi, expenseApi } from '../services/api';
import type { Saving, Budget, Expense } from '../types';

export default function SavingsPage() {
  const [savings, setSavings] = useState<Saving[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [selectedBudget, setSelectedBudget] = useState<string>('');
  const [selectedExpense, setSelectedExpense] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedSavings, setSelectedSavings] = useState<Set<string>>(new Set());

  // Form state
  const [formData, setFormData] = useState({
    expenseId: '',
    budgetId: '',
    totalAmount: 0,
    description: '',
    distributionStrategy: 'EVEN' as 'EVEN' | 'SINGLE_MONTH' | 'CUSTOM',
    targetMonth: 1,
    customDistribution: {} as Record<number, number>
  });

  useEffect(() => {
    loadBudgets();
    loadSavings();
  }, []);

  useEffect(() => {
    if (selectedBudget) {
      loadExpenses(selectedBudget);
    }
  }, [selectedBudget]);

  const loadBudgets = async () => {
    try {
      const res = await budgetApi.getAll();
      setBudgets(res.data);
    } catch (error) {
      console.error('Error loading budgets:', error);
    }
  };

  const loadExpenses = async (budgetId: string) => {
    try {
      const res = await expenseApi.getByBudget(budgetId);
      setExpenses(res.data);
    } catch (error) {
      console.error('Error loading expenses:', error);
    }
  };

  const loadSavings = async () => {
    setIsLoading(true);
    try {
      const filters: any = {};
      if (selectedBudget) filters.budgetId = selectedBudget;
      if (selectedExpense) filters.expenseId = selectedExpense;
      if (statusFilter) filters.status = statusFilter;

      const res = await savingsApi.getAll(filters);
      setSavings(res.data);
    } catch (error) {
      console.error('Error loading savings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateSaving = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await savingsApi.create(formData);
      setShowForm(false);
      resetForm();
      loadSavings();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error al crear ahorro');
    }
  };

  const handleApproveSavings = async () => {
    if (selectedSavings.size === 0) {
      alert('Selecciona al menos un ahorro para aprobar');
      return;
    }

    try {
      await savingsApi.approve(Array.from(selectedSavings));
      setSelectedSavings(new Set());
      loadSavings();
      alert('Ahorros aprobados exitosamente');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error al aprobar ahorros');
    }
  };

  const handleDeleteSaving = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este ahorro?')) return;

    try {
      await savingsApi.delete(id);
      loadSavings();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error al eliminar ahorro');
    }
  };

  const resetForm = () => {
    setFormData({
      expenseId: '',
      budgetId: '',
      totalAmount: 0,
      description: '',
      distributionStrategy: 'EVEN',
      targetMonth: 1,
      customDistribution: {}
    });
  };

  const toggleSavingSelection = (id: string) => {
    const newSelection = new Set(selectedSavings);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedSavings(newSelection);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Módulo de Ahorros</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {showForm ? 'Cancelar' : 'Nuevo Ahorro'}
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded shadow mb-6">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Presupuesto</label>
            <select
              value={selectedBudget}
              onChange={(e) => setSelectedBudget(e.target.value)}
              className="w-full border rounded px-3 py-2"
            >
              <option value="">Todos</option>
              {budgets.map(b => (
                <option key={b.id} value={b.id}>{b.year} - v{b.version}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Gasto</label>
            <select
              value={selectedExpense}
              onChange={(e) => setSelectedExpense(e.target.value)}
              className="w-full border rounded px-3 py-2"
              disabled={!selectedBudget}
            >
              <option value="">Todos</option>
              {expenses.map(e => (
                <option key={e.id} value={e.id}>{e.code} - {e.shortDescription}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Estado</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full border rounded px-3 py-2"
            >
              <option value="">Todos</option>
              <option value="PENDING">Pendiente</option>
              <option value="APPROVED">Aprobado</option>
            </select>
          </div>
        </div>
        <button
          onClick={loadSavings}
          className="mt-4 bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
        >
          Filtrar
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white p-6 rounded shadow mb-6">
          <h2 className="text-xl font-bold mb-4">Crear Nuevo Ahorro</h2>
          <form onSubmit={handleCreateSaving}>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1">Presupuesto *</label>
                <select
                  value={formData.budgetId}
                  onChange={(e) => {
                    setFormData({ ...formData, budgetId: e.target.value, expenseId: '' });
                    loadExpenses(e.target.value);
                  }}
                  className="w-full border rounded px-3 py-2"
                  required
                >
                  <option value="">Seleccionar</option>
                  {budgets.map(b => (
                    <option key={b.id} value={b.id}>{b.year} - v{b.version}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Gasto *</label>
                <select
                  value={formData.expenseId}
                  onChange={(e) => setFormData({ ...formData, expenseId: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  required
                  disabled={!formData.budgetId}
                >
                  <option value="">Seleccionar</option>
                  {expenses.map(e => (
                    <option key={e.id} value={e.id}>{e.code} - {e.shortDescription}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1">Monto Total *</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.totalAmount}
                  onChange={(e) => setFormData({ ...formData, totalAmount: parseFloat(e.target.value) })}
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Estrategia de Distribución *</label>
                <select
                  value={formData.distributionStrategy}
                  onChange={(e) => setFormData({ ...formData, distributionStrategy: e.target.value as any })}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="EVEN">Homogénea (12 meses)</option>
                  <option value="SINGLE_MONTH">Un solo mes</option>
                  <option value="CUSTOM">Personalizada</option>
                </select>
              </div>
            </div>

            {formData.distributionStrategy === 'SINGLE_MONTH' && (
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Mes *</label>
                <select
                  value={formData.targetMonth}
                  onChange={(e) => setFormData({ ...formData, targetMonth: parseInt(e.target.value) })}
                  className="w-full border rounded px-3 py-2"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                    <option key={m} value={m}>Mes {m}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Descripción *</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full border rounded px-3 py-2"
                rows={3}
                required
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              >
                Crear Ahorro
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Approve Button */}
      {selectedSavings.size > 0 && (
        <div className="bg-yellow-100 p-4 rounded shadow mb-6">
          <div className="flex justify-between items-center">
            <span>{selectedSavings.size} ahorro(s) seleccionado(s)</span>
            <button
              onClick={handleApproveSavings}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Aprobar Seleccionados
            </button>
          </div>
        </div>
      )}

      {/* Savings List */}
      <div className="bg-white rounded shadow">
        {isLoading ? (
          <div className="p-8 text-center">Cargando...</div>
        ) : savings.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No hay ahorros registrados</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 text-left">Sel</th>
                <th className="p-3 text-left">Presupuesto</th>
                <th className="p-3 text-left">Gasto</th>
                <th className="p-3 text-left">Descripción</th>
                <th className="p-3 text-right">Monto</th>
                <th className="p-3 text-left">Estado</th>
                <th className="p-3 text-left">Creado por</th>
                <th className="p-3 text-left">Fecha</th>
                <th className="p-3 text-left">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {savings.map(saving => (
                <tr key={saving.id} className="border-t hover:bg-gray-50">
                  <td className="p-3">
                    {saving.status === 'PENDING' && (
                      <input
                        type="checkbox"
                        checked={selectedSavings.has(saving.id)}
                        onChange={() => toggleSavingSelection(saving.id)}
                      />
                    )}
                  </td>
                  <td className="p-3">{saving.budget?.year} - v{saving.budget?.version}</td>
                  <td className="p-3">{saving.expense?.code}</td>
                  <td className="p-3">{saving.description}</td>
                  <td className="p-3 text-right">${saving.totalAmount.toFixed(2)}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded text-xs ${
                      saving.status === 'APPROVED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {saving.status === 'APPROVED' ? 'Aprobado' : 'Pendiente'}
                    </span>
                  </td>
                  <td className="p-3">{saving.user?.fullName}</td>
                  <td className="p-3">{new Date(saving.createdAt).toLocaleDateString()}</td>
                  <td className="p-3">
                    {saving.status === 'PENDING' && (
                      <button
                        onClick={() => handleDeleteSaving(saving.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Eliminar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
