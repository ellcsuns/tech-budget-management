import { useState, useEffect } from 'react';
import { transactionApi, budgetApi, budgetLineApi } from '../services/api';
import type { BudgetLine } from '../types';
import { HiOutlinePencilSquare, HiOutlineTrash, HiOutlinePlusCircle } from 'react-icons/hi2';
import { showToast } from '../components/Toast';

interface Transaction {
  id: string;
  budgetLineId: string;
  financialCompanyId: string;
  type: 'COMMITTED' | 'REAL';
  serviceDate: string;
  postingDate: string;
  referenceDocumentNumber: string;
  externalPlatformLink: string;
  transactionCurrency: string;
  transactionValue: number;
  usdValue: number;
  month: number;
  isCompensated: boolean;
}

export default function CommittedTransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgetLines, setBudgetLines] = useState<BudgetLine[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [formData, setFormData] = useState({
    budgetLineId: '', financialCompanyId: '', serviceDate: '', postingDate: '',
    referenceDocumentNumber: '', externalPlatformLink: '', transactionCurrency: 'USD', transactionValue: ''
  });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const budgetsRes = await budgetApi.getAll();
      if (budgetsRes.data.length > 0) {
        const active = budgetsRes.data.find((b: any) => b.isActive);
        const latest = active || budgetsRes.data[0];
        const linesRes = await budgetLineApi.getByBudget(latest.id);
        setBudgetLines(linesRes.data);
      }
      const transactionsRes = await transactionApi.getByType('COMMITTED');
      setTransactions((transactionsRes.data || []) as Transaction[]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = () => {
    setSelectedTransaction(null);
    setFormData({ budgetLineId: '', financialCompanyId: '', serviceDate: '', postingDate: '', referenceDocumentNumber: '', externalPlatformLink: '', transactionCurrency: 'USD', transactionValue: '' });
    setIsModalOpen(true);
  };

  const handleEdit = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setFormData({
      budgetLineId: transaction.budgetLineId,
      financialCompanyId: transaction.financialCompanyId,
      serviceDate: transaction.serviceDate.split('T')[0],
      postingDate: transaction.postingDate.split('T')[0],
      referenceDocumentNumber: transaction.referenceDocumentNumber,
      externalPlatformLink: transaction.externalPlatformLink,
      transactionCurrency: transaction.transactionCurrency,
      transactionValue: transaction.transactionValue.toString()
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = { ...formData, type: 'COMMITTED' as const, transactionValue: parseFloat(formData.transactionValue) };
      if (selectedTransaction) await transactionApi.update(selectedTransaction.id, data);
      else await transactionApi.create(data);
      setIsModalOpen(false);
      loadData();
    } catch (error: any) {
      showToast(error.response?.data?.error || error.response?.data?.message || 'Error al guardar transacción', 'error');
    }
  };

  const handleDelete = async (transaction: Transaction) => {
    if (!confirm('¿Está seguro de eliminar esta transacción?')) return;
    try { await transactionApi.delete(transaction.id); loadData(); }
    catch (error) { showToast('Error al eliminar transacción', 'error'); }
  };

  const getMonthFromDate = (dateStr: string) => {
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return months[new Date(dateStr).getMonth()] || '-';
  };

  const getBudgetLineLabel = (blId: string) => {
    const bl = budgetLines.find(b => b.id === blId);
    if (!bl) return '-';
    return `${bl.expense?.code || ''} - ${bl.financialCompany?.name || ''}`;
  };

  if (isLoading) return <div className="text-center py-8">Cargando...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div />
        <button onClick={handleCreate} className="btn-primary flex items-center gap-2">
          <HiOutlinePlusCircle className="w-5 h-5" /> Nueva Transacción
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Línea Presupuesto</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha Servicio</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha Imputación</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ref. Documento</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Moneda</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Valor</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Mes</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Compensada</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {transactions.map((transaction) => (
              <tr key={transaction.id} className={transaction.isCompensated ? 'opacity-50' : ''}>
                <td className="px-6 py-4 text-sm text-gray-900">{getBudgetLineLabel(transaction.budgetLineId)}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{new Date(transaction.serviceDate).toLocaleDateString()}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{new Date(transaction.postingDate).toLocaleDateString()}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{transaction.referenceDocumentNumber}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{transaction.transactionCurrency}</td>
                <td className="px-6 py-4 text-sm text-right text-gray-900">{transaction.transactionValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td className="px-6 py-4 text-sm text-center text-gray-500">{getMonthFromDate(transaction.serviceDate)}</td>
                <td className="px-6 py-4 text-sm text-center">
                  <span className={`px-2 py-1 rounded text-xs ${transaction.isCompensated ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {transaction.isCompensated ? 'Sí' : 'No'}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm space-x-2">
                  {!transaction.isCompensated && (
                    <>
                      <button onClick={() => handleEdit(transaction)} className="icon-btn" title="Editar"><HiOutlinePencilSquare className="w-5 h-5" /></button>
                      <button onClick={() => handleDelete(transaction)} className="icon-btn-danger" title="Eliminar"><HiOutlineTrash className="w-5 h-5" /></button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <h2 className="text-2xl font-bold mb-4">{selectedTransaction ? 'Editar Transacción' : 'Nueva Transacción Comprometida'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Línea de Presupuesto</label>
                  <select value={formData.budgetLineId} onChange={(e) => {
                    const bl = budgetLines.find(b => b.id === e.target.value);
                    setFormData({ ...formData, budgetLineId: e.target.value, financialCompanyId: bl?.financialCompanyId || '' });
                  }} className="w-full px-3 py-2 border rounded-md" required>
                    <option value="">Seleccione</option>
                    {budgetLines.map(bl => (<option key={bl.id} value={bl.id}>{bl.expense?.code} - {bl.expense?.shortDescription} ({bl.financialCompany?.name})</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Servicio</label>
                  <input type="date" value={formData.serviceDate} onChange={(e) => setFormData({ ...formData, serviceDate: e.target.value })} className="w-full px-3 py-2 border rounded-md" required />
                  {formData.serviceDate && <p className="text-xs text-gray-500 mt-1">Mes auto-derivado: {getMonthFromDate(formData.serviceDate)}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Imputación</label>
                  <input type="date" value={formData.postingDate} onChange={(e) => setFormData({ ...formData, postingDate: e.target.value })} className="w-full px-3 py-2 border rounded-md" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Número de Documento</label>
                  <input type="text" value={formData.referenceDocumentNumber} onChange={(e) => setFormData({ ...formData, referenceDocumentNumber: e.target.value })} className="w-full px-3 py-2 border rounded-md" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Link Plataforma Externa</label>
                  <input type="url" value={formData.externalPlatformLink} onChange={(e) => setFormData({ ...formData, externalPlatformLink: e.target.value })} className="w-full px-3 py-2 border rounded-md" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Moneda</label>
                  <select value={formData.transactionCurrency} onChange={(e) => setFormData({ ...formData, transactionCurrency: e.target.value })} className="w-full px-3 py-2 border rounded-md" required>
                    <option value="USD">USD</option><option value="EUR">EUR</option><option value="CLP">CLP</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Valor</label>
                  <input type="number" step="0.01" value={formData.transactionValue} onChange={(e) => setFormData({ ...formData, transactionValue: e.target.value })} className="w-full px-3 py-2 border rounded-md" required />
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
