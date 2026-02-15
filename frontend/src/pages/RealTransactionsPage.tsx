import { useState, useEffect } from 'react';
import { api, transactionApi, expenseApi, budgetApi } from '../services/api';

interface Transaction {
  id: string;
  expenseId: string;
  type: 'COMMITTED' | 'REAL';
  serviceDate: string;
  postingDate: string;
  referenceDocumentNumber: string;
  externalPlatformLink: string;
  transactionCurrency: string;
  transactionValue: number;
  usdValue: number;
  month: number;
}

interface Expense {
  id: string;
  code: string;
  shortDescription: string;
}

export default function RealTransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [committedTransactions, setCommittedTransactions] = useState<Transaction[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showCommittedPicker, setShowCommittedPicker] = useState(false);
  const [formData, setFormData] = useState({
    expenseId: '', serviceDate: '', postingDate: '', referenceDocumentNumber: '',
    externalPlatformLink: '', transactionCurrency: 'USD', transactionValue: ''
  });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const budgetsRes = await budgetApi.getAll();
      if (budgetsRes.data.length > 0) {
        const expensesRes = await expenseApi.getByBudget(budgetsRes.data[0].id);
        setExpenses(expensesRes.data);
      }
      const [realRes, committedRes] = await Promise.all([
        api.get('/transactions?type=REAL'),
        api.get('/transactions?type=COMMITTED')
      ]);
      setTransactions(realRes.data || []);
      setCommittedTransactions(committedRes.data || []);
    } catch (error) { console.error('Error:', error); }
    finally { setIsLoading(false); }
  };

  const handleCreate = () => {
    setSelectedTransaction(null);
    setFormData({ expenseId: '', serviceDate: '', postingDate: '', referenceDocumentNumber: '', externalPlatformLink: '', transactionCurrency: 'USD', transactionValue: '' });
    setShowCommittedPicker(false);
    setIsModalOpen(true);
  };

  const handleCreateFromCommitted = (committed: Transaction) => {
    setSelectedTransaction(null);
    setFormData({
      expenseId: committed.expenseId,
      serviceDate: committed.serviceDate.split('T')[0],
      postingDate: committed.postingDate.split('T')[0],
      referenceDocumentNumber: committed.referenceDocumentNumber + '-REAL',
      externalPlatformLink: committed.externalPlatformLink,
      transactionCurrency: committed.transactionCurrency,
      transactionValue: committed.transactionValue.toString()
    });
    setShowCommittedPicker(false);
    setIsModalOpen(true);
  };

  const handleEdit = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setFormData({
      expenseId: transaction.expenseId,
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
      const data = { ...formData, type: 'REAL' as const, transactionValue: parseFloat(formData.transactionValue) };
      if (selectedTransaction) await transactionApi.update(selectedTransaction.id, data);
      else await transactionApi.create(data);
      setIsModalOpen(false);
      loadData();
    } catch (error: any) {
      alert(error.response?.data?.error || error.response?.data?.message || 'Error al guardar transacción');
    }
  };

  const handleDelete = async (transaction: Transaction) => {
    if (!confirm('¿Eliminar esta transacción?')) return;
    try { await transactionApi.delete(transaction.id); loadData(); }
    catch (error) { alert('Error al eliminar transacción'); }
  };

  const getMonthFromDate = (dateStr: string) => {
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return months[new Date(dateStr).getMonth()] || '-';
  };

  if (isLoading) return <div className="text-center py-8">Cargando...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Transacciones Reales</h1>
        <div className="flex gap-2">
          <button onClick={() => setShowCommittedPicker(!showCommittedPicker)}
            className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700">
            {showCommittedPicker ? 'Ocultar Comprometidas' : '📋 Desde Comprometida'}
          </button>
          <button onClick={handleCreate} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">+ Nueva Transacción</button>
        </div>
      </div>

      {/* Committed transactions picker */}
      {showCommittedPicker && committedTransactions.length > 0 && (
        <div className="bg-yellow-50 rounded-lg shadow p-4 mb-6">
          <h3 className="text-sm font-bold text-yellow-800 mb-3">Selecciona una transacción comprometida para crear la real:</h3>
          <div className="max-h-48 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-yellow-100">
                <tr>
                  <th className="px-3 py-2 text-left">Gasto</th>
                  <th className="px-3 py-2 text-left">Ref. Doc</th>
                  <th className="px-3 py-2 text-right">Valor</th>
                  <th className="px-3 py-2 text-left">Moneda</th>
                  <th className="px-3 py-2 text-center">Acción</th>
                </tr>
              </thead>
              <tbody>
                {committedTransactions.map(ct => {
                  const expense = expenses.find(e => e.id === ct.expenseId);
                  return (
                    <tr key={ct.id} className="border-t hover:bg-yellow-100">
                      <td className="px-3 py-2">{expense?.code || '-'}</td>
                      <td className="px-3 py-2">{ct.referenceDocumentNumber}</td>
                      <td className="px-3 py-2 text-right">{ct.transactionValue.toLocaleString()}</td>
                      <td className="px-3 py-2">{ct.transactionCurrency}</td>
                      <td className="px-3 py-2 text-center">
                        <button onClick={() => handleCreateFromCommitted(ct)} className="text-blue-600 hover:text-blue-800 text-xs font-medium">Usar →</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Gasto</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha Servicio</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha Imputación</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ref. Documento</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Moneda</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Valor</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Mes</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {transactions.map((transaction) => {
              const expense = expenses.find(e => e.id === transaction.expenseId);
              return (
                <tr key={transaction.id}>
                  <td className="px-6 py-4 text-sm text-gray-900">{expense?.code} - {expense?.shortDescription}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{new Date(transaction.serviceDate).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{new Date(transaction.postingDate).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{transaction.referenceDocumentNumber}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{transaction.transactionCurrency}</td>
                  <td className="px-6 py-4 text-sm text-right text-gray-900">{transaction.transactionValue.toLocaleString()}</td>
                  <td className="px-6 py-4 text-sm text-center text-gray-500">{getMonthFromDate(transaction.serviceDate)}</td>
                  <td className="px-6 py-4 text-sm text-center space-x-2">
                    <button onClick={() => handleEdit(transaction)} className="text-blue-600 hover:text-blue-900">✏️</button>
                    <button onClick={() => handleDelete(transaction)} className="text-red-600 hover:text-red-900">🗑️</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <h2 className="text-2xl font-bold mb-4">{selectedTransaction ? 'Editar Transacción' : 'Nueva Transacción Real'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gasto</label>
                  <select value={formData.expenseId} onChange={(e) => setFormData({ ...formData, expenseId: e.target.value })} className="w-full px-3 py-2 border rounded-md" required>
                    <option value="">Seleccione un gasto</option>
                    {expenses.map(expense => (<option key={expense.id} value={expense.id}>{expense.code} - {expense.shortDescription}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Servicio</label>
                  <input type="date" value={formData.serviceDate} onChange={(e) => setFormData({ ...formData, serviceDate: e.target.value })} className="w-full px-3 py-2 border rounded-md" required />
                  {formData.serviceDate && <p className="text-xs text-gray-500 mt-1">Mes: {getMonthFromDate(formData.serviceDate)}</p>}
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
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border rounded-md hover:bg-gray-50">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
