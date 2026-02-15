import { useState, useEffect } from 'react';
import { expensesEnhancedApi, budgetApi, technologyDirectionApi, userAreaApi, financialCompanyApi } from '../services/api';
import type { ExpenseWithTags, Budget, TechnologyDirection, UserArea, FinancialCompany } from '../types';
import ExpenseDetailPopup from '../components/ExpenseDetailPopup';

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<ExpenseWithTags[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [techDirections, setTechDirections] = useState<TechnologyDirection[]>([]);
  const [userAreas, setUserAreas] = useState<UserArea[]>([]);
  const [financialCompanies, setFinancialCompanies] = useState<FinancialCompany[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedExpense, setSelectedExpense] = useState<ExpenseWithTags | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    budgetId: '',
    code: '',
    shortDescription: '',
    longDescription: '',
    technologyDirections: [] as string[],
    userAreas: [] as string[],
    financialCompanyId: '',
    parentExpenseId: ''
  });

  useEffect(() => {
    loadMasterData();
    loadExpenses();
  }, []);

  const loadMasterData = async () => {
    try {
      const [budgetsRes, techRes, areasRes, companiesRes] = await Promise.all([
        budgetApi.getAll(),
        technologyDirectionApi.getAll(),
        userAreaApi.getAll(),
        financialCompanyApi.getAll()
      ]);
      setBudgets(budgetsRes.data);
      setTechDirections(techRes.data);
      setUserAreas(areasRes.data);
      setFinancialCompanies(companiesRes.data);
    } catch (error) {
      console.error('Error loading master data:', error);
    }
  };

  const loadExpenses = async () => {
    setIsLoading(true);
    try {
      const filters: any = {};
      if (searchText) filters.searchText = searchText;
      
      const res = await expensesEnhancedApi.getAll(filters);
      setExpenses(res.data);
    } catch (error) {
      console.error('Error loading expenses:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    loadExpenses();
  };

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await expensesEnhancedApi.create(formData);
      setShowForm(false);
      resetForm();
      loadExpenses();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error al crear gasto');
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este gasto?')) return;

    try {
      await expensesEnhancedApi.delete(id);
      loadExpenses();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error al eliminar gasto');
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
    setFormData({
      budgetId: '',
      code: '',
      shortDescription: '',
      longDescription: '',
      technologyDirections: [],
      userAreas: [],
      financialCompanyId: '',
      parentExpenseId: ''
    });
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gestión de Gastos</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {showForm ? 'Cancelar' : 'Nuevo Gasto'}
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded shadow mb-6">
        <div className="flex gap-4">
          <input
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Buscar por código, descripción o tags..."
            className="flex-1 border rounded px-3 py-2"
          />
          <button
            onClick={handleSearch}
            className="bg-gray-600 text-white px-6 py-2 rounded hover:bg-gray-700"
          >
            Buscar
          </button>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white p-6 rounded shadow mb-6">
          <h2 className="text-xl font-bold mb-4">Crear Nuevo Gasto</h2>
          <form onSubmit={handleCreateExpense}>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1">Presupuesto *</label>
                <select
                  value={formData.budgetId}
                  onChange={(e) => setFormData({ ...formData, budgetId: e.target.value })}
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
                <label className="block text-sm font-medium mb-1">Código *</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Descripción Corta *</label>
              <input
                type="text"
                value={formData.shortDescription}
                onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                className="w-full border rounded px-3 py-2"
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Descripción Larga *</label>
              <textarea
                value={formData.longDescription}
                onChange={(e) => setFormData({ ...formData, longDescription: e.target.value })}
                className="w-full border rounded px-3 py-2"
                rows={3}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1">Direcciones Tecnológicas *</label>
                <select
                  multiple
                  value={formData.technologyDirections}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    technologyDirections: Array.from(e.target.selectedOptions, option => option.value)
                  })}
                  className="w-full border rounded px-3 py-2 h-24"
                  required
                >
                  {techDirections.map(td => (
                    <option key={td.id} value={td.id}>{td.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Áreas de Usuario *</label>
                <select
                  multiple
                  value={formData.userAreas}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    userAreas: Array.from(e.target.selectedOptions, option => option.value)
                  })}
                  className="w-full border rounded px-3 py-2 h-24"
                  required
                >
                  {userAreas.map(ua => (
                    <option key={ua.id} value={ua.id}>{ua.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Empresa Financiera *</label>
              <select
                value={formData.financialCompanyId}
                onChange={(e) => setFormData({ ...formData, financialCompanyId: e.target.value })}
                className="w-full border rounded px-3 py-2"
                required
              >
                <option value="">Seleccionar</option>
                {financialCompanies.map(fc => (
                  <option key={fc.id} value={fc.id}>{fc.name}</option>
                ))}
              </select>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              >
                Crear Gasto
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

      {/* Expenses Table */}
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
                <th className="p-3 text-left">Empresa</th>
                <th className="p-3 text-left">Tags</th>
                <th className="p-3 text-left">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map(expense => (
                <tr key={expense.id} className="border-t hover:bg-gray-50">
                  <td className="p-3">{expense.code}</td>
                  <td className="p-3">{expense.shortDescription}</td>
                  <td className="p-3">{expense.financialCompany?.name}</td>
                  <td className="p-3">
                    {expense.customTags.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {expense.customTags.slice(0, 2).map((tag, idx) => (
                          <span key={idx} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                            {tag.key}
                          </span>
                        ))}
                        {expense.customTags.length > 2 && (
                          <span className="text-xs text-gray-500">+{expense.customTags.length - 2}</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">Sin tags</span>
                    )}
                  </td>
                  <td className="p-3">
                    <button
                      onClick={() => handleViewDetail(expense)}
                      className="text-blue-600 hover:text-blue-800 mr-3"
                    >
                      Ver Detalle
                    </button>
                    <button
                      onClick={() => handleDeleteExpense(expense.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Detail Popup */}
      {showDetail && selectedExpense && (
        <ExpenseDetailPopup
          expense={selectedExpense}
          onClose={() => {
            setShowDetail(false);
            setSelectedExpense(null);
          }}
          onUpdate={() => {
            loadExpenses();
            if (selectedExpense) {
              handleViewDetail(selectedExpense);
            }
          }}
        />
      )}
    </div>
  );
}
