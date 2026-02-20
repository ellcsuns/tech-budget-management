import { useState, useEffect } from 'react';
import { budgetApi, budgetLineApi, deferralApi } from '../services/api';
import type { Budget, BudgetLine, Deferral } from '../types';
import { HiOutlineTrash, HiOutlinePlusCircle } from 'react-icons/hi2';
import { showToast } from '../components/Toast';
import ConfirmationDialog from '../components/ConfirmationDialog';

const MONTHS = ['M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7', 'M8', 'M9', 'M10', 'M11', 'M12'];

export default function DeferralsPage() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [selectedBudget, setSelectedBudget] = useState<string>('');
  const [budgetLines, setBudgetLines] = useState<BudgetLine[]>([]);
  const [deferrals, setDeferrals] = useState<Deferral[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  const [selectedBudgetLine, setSelectedBudgetLine] = useState<BudgetLine | null>(null);
  const [form, setForm] = useState({
    description: '',
    totalAmount: '',
    startMonth: '1',
    endMonth: '12'
  });

  useEffect(() => { loadBudgets(); }, []);
  useEffect(() => {
    if (selectedBudget) loadData(selectedBudget);
  }, [selectedBudget]);

  const loadBudgets = async () => {
    try {
      const res = await budgetApi.getAll();
      setBudgets(res.data);
      if (res.data.length > 0) {
        const active = res.data.find((b: any) => b.isActive);
        setSelectedBudget((active || res.data[0]).id);
      }
    } catch (error) { console.error('Error:', error); }
    finally { setLoading(false); }
  };

  const loadData = async (budgetId: string) => {
    try {
      setLoading(true);
      const [linesRes, defRes] = await Promise.all([
        budgetLineApi.getByBudget(budgetId),
        deferralApi.getByBudget(budgetId)
      ]);
      setBudgetLines(linesRes.data);
      setDeferrals(defRes.data);
    } catch (error) { console.error('Error:', error); }
    finally { setLoading(false); }
  };

  const filteredLines = budgetLines.filter(bl =>
    bl.expense?.code?.toLowerCase().includes(searchText.toLowerCase()) ||
    bl.expense?.shortDescription?.toLowerCase().includes(searchText.toLowerCase()) ||
    bl.financialCompany?.name?.toLowerCase().includes(searchText.toLowerCase())
  );

  const handleSelectBudgetLine = (bl: BudgetLine) => {
    setSelectedBudgetLine(bl);
    setSearchText(`${bl.expense?.code} - ${bl.expense?.shortDescription} (${bl.financialCompany?.name})`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBudgetLine) return;

    if (parseInt(form.startMonth) >= parseInt(form.endMonth)) {
      showToast('El mes de inicio debe ser menor al mes de fin', 'error');
      return;
    }

    try {
      await deferralApi.create({
        budgetLineId: selectedBudgetLine.id,
        description: form.description,
        totalAmount: parseFloat(form.totalAmount),
        startMonth: parseInt(form.startMonth),
        endMonth: parseInt(form.endMonth)
      });
      setShowForm(false);
      setForm({ description: '', totalAmount: '', startMonth: '1', endMonth: '12' });
      setSelectedBudgetLine(null);
      setSearchText('');
      loadData(selectedBudget);
    } catch (error: any) {
      showToast(error.response?.data?.error || 'Error al crear diferido', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    setDeleteTargetId(id);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!deleteTargetId) return;
    try { await deferralApi.delete(deleteTargetId); loadData(selectedBudget); }
    catch (error) { console.error('Error:', error); }
    setShowDeleteDialog(false);
    setDeleteTargetId(null);
  };
  };

  const getBudgetLineLabel = (bl?: BudgetLine) => {
    if (!bl) return '-';
    return `${bl.expense?.code || ''} - ${bl.expense?.shortDescription || ''} (${bl.financialCompany?.name || ''})`;
  };

  if (loading && !selectedBudget) return <div className="text-center py-8">Cargando...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div />
        <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2">
          <HiOutlinePlusCircle className="w-5 h-5" />
          {showForm ? 'Cancelar' : 'Nuevo Diferido'}
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="max-w-md mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Presupuesto</label>
          <select value={selectedBudget} onChange={(e) => setSelectedBudget(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md">
            {budgets.map((b) => (<option key={b.id} value={b.id}>{b.year} - {b.version}</option>))}
          </select>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="bg-gray-50 p-4 rounded-lg mb-6 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Buscar Línea de Presupuesto *</label>
              <input type="text" value={searchText} onChange={(e) => { setSearchText(e.target.value); setSelectedBudgetLine(null); }}
                placeholder="Buscar por código, descripción o empresa..." className="w-full border rounded px-3 py-2" />
              {searchText && !selectedBudgetLine && filteredLines.length > 0 && (
                <div className="border rounded mt-1 max-h-40 overflow-y-auto bg-white">
                  {filteredLines.slice(0, 10).map(bl => (
                    <div key={bl.id} onClick={() => handleSelectBudgetLine(bl)} className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm">
                      {bl.expense?.code} - {bl.expense?.shortDescription} ({bl.financialCompany?.name})
                    </div>
                  ))}
                </div>
              )}
              {selectedBudgetLine && <p className="text-sm text-green-600 mt-1">✓ Línea seleccionada: {selectedBudgetLine.expense?.code}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Descripción *</label>
              <input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full border rounded px-3 py-2" required />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Monto Total *</label>
                <input type="number" step="0.01" value={form.totalAmount} onChange={(e) => setForm({ ...form, totalAmount: e.target.value })} className="w-full border rounded px-3 py-2" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Mes Inicio *</label>
                <select value={form.startMonth} onChange={(e) => setForm({ ...form, startMonth: e.target.value })} className="w-full border rounded px-3 py-2">
                  {MONTHS.map((m, i) => (<option key={i} value={i + 1}>{m}</option>))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Mes Fin *</label>
                <select value={form.endMonth} onChange={(e) => setForm({ ...form, endMonth: e.target.value })} className="w-full border rounded px-3 py-2">
                  {MONTHS.map((m, i) => (<option key={i} value={i + 1}>{m}</option>))}
                </select>
              </div>
            </div>
            <button type="submit" disabled={!selectedBudgetLine} className="btn-success disabled:opacity-50">Crear Diferido</button>
          </form>
        )}

        {deferrals.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No hay diferidos registrados</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Línea Presupuesto</th>
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
                    <td className="px-4 py-3 text-sm">{getBudgetLineLabel(def.budgetLine)}</td>
                    <td className="px-4 py-3 text-sm">{def.description}</td>
                    <td className="px-4 py-3 text-sm text-right">${Number(def.totalAmount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td className="px-4 py-3 text-sm text-center">{MONTHS[def.startMonth - 1]} - {MONTHS[def.endMonth - 1]}</td>
                    <td className="px-4 py-3 text-sm">{def.user?.fullName || def.createdBy}</td>
                    <td className="px-4 py-3 text-sm text-center">
                      <button onClick={() => handleDelete(def.id)} className="icon-btn-danger" title="Eliminar">
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

      <ConfirmationDialog isOpen={showDeleteDialog} message="¿Estás seguro de eliminar este diferido?" onConfirm={confirmDelete} onCancel={() => { setShowDeleteDialog(false); setDeleteTargetId(null); }} />
    </div>
  );
}
