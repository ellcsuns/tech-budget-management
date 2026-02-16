import { useState, useEffect } from 'react';
import { budgetApi, expenseApi, deferralApi } from '../services/api';
import type { Budget, Expense, Deferral } from '../types';
import { HiOutlineTrash, HiOutlinePlusCircle } from 'react-icons/hi2';

const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

export default function DeferralsPage() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [selectedBudget, setSelectedBudget] = useState<string>('');
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [deferrals, setDeferrals] = useState<Deferral[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [form, setForm] = useState({
    description: '',
    totalAmount: '',
    startMonth: '1',
    endMonth: '12'
  });

  useEffect(() => { loadBudgets(); }, []);
  useEffect(() => {
    if (selectedBudget) {
      loadData(selectedBudget);
    }
  }, [selectedBudget]);

  const loadBudgets = async () => {
    try {
      const res = await budgetApi.getAll();
      setBudgets(res.data);
      // Auto-select latest budget (vigente)
      if (res.data.length > 0) setSelectedBudget(res.data[res.data.length - 1].id);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadData = async (budgetId: string) => {
    try {
      setLoading(true);
      const [expRes, defRes] = await Promise.all([
        expenseApi.getByBudget(budgetId),
        deferralApi.getByBudget(budgetId)
      ]);
      setExpenses(expRes.data);
      setDeferrals(defRes.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredExpenses = expenses.filter(e =>
    e.code.toLowerCase().includes(searchText.toLowerCase()) ||
    e.shortDescription.toLowerCase().includes(searchText.toLowerCase())
  );

  const handleSelectExpense = (expense: Expense) => {
    setSelectedExpense(expense);
    setSearchText(expense.code + ' - ' + expense.shortDescription);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExpense || !selectedBudget) return;

    if (parseInt(form.startMonth) >= parseInt(form.endMonth)) {
      alert('El mes de inicio debe ser menor al mes de fin');
      return;
    }

    try {
      await deferralApi.create({
        expenseId: selectedExpense.id,
        budgetId: selectedBudget,
        description: form.description,
        totalAmount: parseFloat(form.totalAmount),
        startMonth: parseInt(form.startMonth),
        endMonth: parseInt(form.endMonth)
      });
      setShowForm(false);
      setForm({ description: '', totalAmount: '', startMonth: '1', endMonth: '12' });
      setSelectedExpense(null);
      setSearchText('');
      loadData(selectedBudget);
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error al crear diferido');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este diferido?')) return;
    try {
      await deferralApi.delete(id);
      loadData(selectedBudget);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  if (loading && !selectedBudget) {
    return <div className="text-center py-8">Cargando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div />
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary flex items-center gap-2"
        >
          <HiOutlinePlusCircle className="w-5 h-5" />
          {showForm ? 'Cancelar' : 'Nuevo Diferido'}
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="max-w-md mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Presupuesto</label>
          <select
            value={selectedBudget}
            onChange={(e) => setSelectedBudget(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {budgets.map((b) => (
              <option key={b.id} value={b.id}>{b.year} - {b.version}</option>
            ))}
          </select>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="bg-gray-50 p-4 rounded-lg mb-6 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Buscar Gasto *</label>
              <input
                type="text"
                value={searchText}
                onChange={(e) => { setSearchText(e.target.value); setSelectedExpense(null); }}
                placeholder="Buscar por código o descripción..."
                className="w-full border rounded px-3 py-2"
              />
              {searchText && !selectedExpense && filteredExpenses.length > 0 && (
                <div className="border rounded mt-1 max-h-40 overflow-y-auto bg-white">
                  {filteredExpenses.slice(0, 10).map(exp => (
                    <div
                      key={exp.id}
                      onClick={() => handleSelectExpense(exp)}
                      className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm"
                    >
                      {exp.code} - {exp.shortDescription}
                    </div>
                  ))}
                </div>
              )}
              {selectedExpense && (
                <p className="text-sm text-green-600 mt-1">✓ Gasto seleccionado: {selectedExpense.code}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Descripción *</label>
              <input
                type="text"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full border rounded px-3 py-2"
                required
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Monto Total *</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.totalAmount}
                  onChange={(e) => setForm({ ...form, totalAmount: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Mes Inicio *</label>
                <select
                  value={form.startMonth}
                  onChange={(e) => setForm({ ...form, startMonth: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                >
                  {MONTHS.map((m, i) => (
                    <option key={i} value={i + 1}>{m}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Mes Fin *</label>
                <select
                  value={form.endMonth}
                  onChange={(e) => setForm({ ...form, endMonth: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                >
                  {MONTHS.map((m, i) => (
                    <option key={i} value={i + 1}>{m}</option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={!selectedExpense}
              className="btn-success disabled:opacity-50"
            >
              Crear Diferido
            </button>
          </form>
        )}

        {/* Deferrals List */}
        {deferrals.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No hay diferidos registrados</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Gasto</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descripción</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Monto</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Período</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Creado por</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {deferrals.map((def) => (
                  <tr key={def.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">{def.expense?.code} - {def.expense?.shortDescription}</td>
                    <td className="px-4 py-3 text-sm">{def.description}</td>
                    <td className="px-4 py-3 text-sm text-right">${Number(def.totalAmount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td className="px-4 py-3 text-sm text-center">{MONTHS[def.startMonth - 1]} - {MONTHS[def.endMonth - 1]}</td>
                    <td className="px-4 py-3 text-sm">{def.user?.fullName || def.createdBy}</td>
                    <td className="px-4 py-3 text-sm text-center">
                      <button
                        onClick={() => handleDelete(def.id)}
                        className="icon-btn-danger"
                        title="Eliminar"
                      >
                        <HiOutlineTrash className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
