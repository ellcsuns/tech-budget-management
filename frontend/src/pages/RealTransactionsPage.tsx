import { useState, useEffect, useMemo } from 'react';
import { transactionApi, budgetApi, budgetLineApi } from '../services/api';
import type { Budget, BudgetLine } from '../types';
import { HiOutlinePencilSquare, HiOutlineTrash, HiOutlinePlusCircle, HiOutlineClipboardDocumentList, HiOutlineChevronUpDown } from 'react-icons/hi2';
import { showToast } from '../components/Toast';
import ConfirmationDialog from '../components/ConfirmationDialog';

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
  compensatedById?: string;
}

type SortField = 'budgetLine' | 'serviceDate' | 'postingDate' | 'refDoc' | 'currency' | 'value' | 'month';
type SortDir = 'asc' | 'desc';

export default function RealTransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [committedTransactions, setCommittedTransactions] = useState<Transaction[]>([]);
  const [allBudgets, setAllBudgets] = useState<Budget[]>([]);
  const [selectedBudgetId, setSelectedBudgetId] = useState<string>('');
  const [budgetLines, setBudgetLines] = useState<BudgetLine[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [selectedCommittedId, setSelectedCommittedId] = useState('');
  const [showCommittedPicker, setShowCommittedPicker] = useState(false);
  const [formData, setFormData] = useState({
    budgetLineId: '', financialCompanyId: '', serviceDate: '', postingDate: '',
    referenceDocumentNumber: '', externalPlatformLink: '', transactionCurrency: 'USD', transactionValue: ''
  });
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>('serviceDate');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [filterText, setFilterText] = useState('');

  useEffect(() => { loadInitial(); }, []);

  const loadInitial = async () => {
    try {
      const budgetsRes = await budgetApi.getAll();
      setAllBudgets(budgetsRes.data);
      const active = budgetsRes.data.find((b: Budget) => b.isActive);
      const target = active || budgetsRes.data[0];
      if (target) {
        setSelectedBudgetId(target.id);
        const linesRes = await budgetLineApi.getByBudget(target.id);
        setBudgetLines(linesRes.data);
      }
      const [realRes, committedRes] = await Promise.all([
        transactionApi.getByType('REAL'),
        transactionApi.getByType('COMMITTED')
      ]);
      setTransactions((realRes.data || []) as Transaction[]);
      setCommittedTransactions(((committedRes.data || []) as Transaction[]).filter((t: Transaction) => !t.isCompensated));
    } catch (error) { console.error('Error loading data:', error); }
    finally { setIsLoading(false); }
  };

  const handleBudgetChange = async (budgetId: string) => {
    setSelectedBudgetId(budgetId);
    try {
      const linesRes = await budgetLineApi.getByBudget(budgetId);
      setBudgetLines(linesRes.data);
    } catch (error) { console.error('Error:', error); }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <HiOutlineChevronUpDown className="w-3 h-3 inline opacity-30" />;
    return <HiOutlineChevronUpDown className="w-3 h-3 inline text-accent" />;
  };

  const getBudgetLineLabel = (blId: string) => {
    const bl = budgetLines.find(b => b.id === blId);
    if (!bl) return '-';
    return `${bl.expense?.code || ''} - ${bl.financialCompany?.name || ''}`;
  };

  const getMonthFromDate = (dateStr: string) => {
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return months[new Date(dateStr).getMonth()] || '-';
  };

  const filteredAndSorted = useMemo(() => {
    let result = [...transactions];
    if (filterText) {
      const terms = filterText.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
      result = result.filter(t => {
        const label = getBudgetLineLabel(t.budgetLineId).toLowerCase();
        const ref = t.referenceDocumentNumber.toLowerCase();
        const curr = t.transactionCurrency.toLowerCase();
        return terms.some(term => label.includes(term) || ref.includes(term) || curr.includes(term));
      });
    }
    result.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'serviceDate': cmp = new Date(a.serviceDate).getTime() - new Date(b.serviceDate).getTime(); break;
        case 'postingDate': cmp = new Date(a.postingDate).getTime() - new Date(b.postingDate).getTime(); break;
        case 'value': cmp = a.transactionValue - b.transactionValue; break;
        case 'currency': cmp = a.transactionCurrency.localeCompare(b.transactionCurrency); break;
        case 'refDoc': cmp = a.referenceDocumentNumber.localeCompare(b.referenceDocumentNumber); break;
        case 'month': cmp = a.month - b.month; break;
        case 'budgetLine': cmp = getBudgetLineLabel(a.budgetLineId).localeCompare(getBudgetLineLabel(b.budgetLineId)); break;
        default: cmp = 0;
      }
      return sortDir === 'desc' ? -cmp : cmp;
    });
    return result;
  }, [transactions, filterText, sortField, sortDir, budgetLines]);

  const handleCreate = () => {
    setSelectedTransaction(null);
    setSelectedCommittedId('');
    setFormData({ budgetLineId: '', financialCompanyId: '', serviceDate: '', postingDate: '', referenceDocumentNumber: '', externalPlatformLink: '', transactionCurrency: 'USD', transactionValue: '' });
    setShowCommittedPicker(false);
    setIsModalOpen(true);
  };

  const handleCreateFromCommitted = (committed: Transaction) => {
    setSelectedTransaction(null);
    setSelectedCommittedId(committed.id);
    const bl = budgetLines.find(b => b.id === committed.budgetLineId);
    setFormData({
      budgetLineId: committed.budgetLineId,
      financialCompanyId: committed.financialCompanyId || bl?.financialCompanyId || '',
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
    setSelectedCommittedId('');
    setFormData({
      budgetLineId: transaction.budgetLineId, financialCompanyId: transaction.financialCompanyId,
      serviceDate: transaction.serviceDate.split('T')[0], postingDate: transaction.postingDate.split('T')[0],
      referenceDocumentNumber: transaction.referenceDocumentNumber, externalPlatformLink: transaction.externalPlatformLink,
      transactionCurrency: transaction.transactionCurrency, transactionValue: transaction.transactionValue.toString()
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data: any = { ...formData, type: 'REAL' as const, transactionValue: parseFloat(formData.transactionValue) };
      if (selectedCommittedId) data.committedTransactionId = selectedCommittedId;
      if (selectedTransaction) await transactionApi.update(selectedTransaction.id, data);
      else await transactionApi.create(data);
      setIsModalOpen(false);
      loadInitial();
    } catch (error: any) {
      showToast(error.response?.data?.error || error.response?.data?.message || 'Error al guardar transacción', 'error');
    }
  };

  const handleDelete = (transaction: Transaction) => { setDeleteTargetId(transaction.id); setShowDeleteDialog(true); };
  const confirmDelete = async () => {
    if (!deleteTargetId) return;
    try { await transactionApi.delete(deleteTargetId); loadInitial(); }
    catch (error) { showToast('Error al eliminar transacción', 'error'); }
    setShowDeleteDialog(false); setDeleteTargetId(null);
  };

  const activeBudget = allBudgets.find(b => b.isActive);

  if (isLoading) return <div className="text-center py-8">Cargando...</div>;

  const thSortable = "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 select-none";

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-3">
          <select value={selectedBudgetId} onChange={e => handleBudgetChange(e.target.value)} className="border rounded px-3 py-1.5 text-sm min-w-[220px]">
            {allBudgets.map(b => (
              <option key={b.id} value={b.id}>{b.year} - {b.version}{b.isActive ? ' ★ Vigente' : ''}</option>
            ))}
          </select>
          {activeBudget && selectedBudgetId === activeBudget.id && (
            <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">★ Vigente</span>
          )}
          <input type="text" value={filterText} onChange={e => setFilterText(e.target.value)}
            placeholder="Filtrar (separar por comas)..." className="border rounded px-3 py-1.5 text-sm w-64" />
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowCommittedPicker(!showCommittedPicker)} className="btn-secondary flex items-center gap-2">
            <HiOutlineClipboardDocumentList className="w-5 h-5" />
            {showCommittedPicker ? 'Ocultar Comprometidas' : 'Desde Comprometida'}
          </button>
          <button onClick={handleCreate} className="btn-primary flex items-center gap-2">
            <HiOutlinePlusCircle className="w-5 h-5" /> Nueva Transacción
          </button>
        </div>
      </div>

      {showCommittedPicker && committedTransactions.length > 0 && (
        <div className="bg-yellow-50 rounded-lg shadow p-4 mb-4">
          <h3 className="text-sm font-bold text-yellow-800 mb-3">Selecciona una transacción comprometida no compensada:</h3>
          <div className="max-h-48 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-yellow-100">
                <tr>
                  <th className="px-3 py-2 text-left">Línea Presupuesto</th>
                  <th className="px-3 py-2 text-left">Ref. Doc</th>
                  <th className="px-3 py-2 text-right">Valor</th>
                  <th className="px-3 py-2 text-left">Moneda</th>
                  <th className="px-3 py-2 text-center">Acción</th>
                </tr>
              </thead>
              <tbody>
                {committedTransactions.map(ct => (
                  <tr key={ct.id} className="border-t hover:bg-yellow-100">
                    <td className="px-3 py-2">{getBudgetLineLabel(ct.budgetLineId)}</td>
                    <td className="px-3 py-2">{ct.referenceDocumentNumber}</td>
                    <td className="px-3 py-2 text-right">{ct.transactionValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td className="px-3 py-2">{ct.transactionCurrency}</td>
                    <td className="px-3 py-2 text-center">
                      <button onClick={() => handleCreateFromCommitted(ct)} className="text-accent hover:opacity-70 text-xs font-medium">Usar →</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className={thSortable} onClick={() => handleSort('budgetLine')}>Línea Presupuesto <SortIcon field="budgetLine" /></th>
              <th className={thSortable} onClick={() => handleSort('serviceDate')}>Fecha Servicio <SortIcon field="serviceDate" /></th>
              <th className={thSortable} onClick={() => handleSort('postingDate')}>Fecha Imputación <SortIcon field="postingDate" /></th>
              <th className={thSortable} onClick={() => handleSort('refDoc')}>Ref. Documento <SortIcon field="refDoc" /></th>
              <th className={thSortable} onClick={() => handleSort('currency')}>Moneda <SortIcon field="currency" /></th>
              <th className={thSortable + " text-right"} onClick={() => handleSort('value')}>Valor <SortIcon field="value" /></th>
              <th className={thSortable + " text-center"} onClick={() => handleSort('month')}>Mes <SortIcon field="month" /></th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredAndSorted.map((transaction) => (
              <tr key={transaction.id}>
                <td className="px-6 py-4 text-sm text-gray-900">{getBudgetLineLabel(transaction.budgetLineId)}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{new Date(transaction.serviceDate).toLocaleDateString()}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{new Date(transaction.postingDate).toLocaleDateString()}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{transaction.referenceDocumentNumber}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{transaction.transactionCurrency}</td>
                <td className="px-6 py-4 text-sm text-right text-gray-900">{transaction.transactionValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td className="px-6 py-4 text-sm text-center text-gray-500">{getMonthFromDate(transaction.serviceDate)}</td>
                <td className="px-6 py-4 text-sm text-center space-x-2">
                  <button onClick={() => handleEdit(transaction)} className="icon-btn" title="Editar"><HiOutlinePencilSquare className="w-5 h-5" /></button>
                  <button onClick={() => handleDelete(transaction)} className="icon-btn-danger" title="Eliminar"><HiOutlineTrash className="w-5 h-5" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <h2 className="text-2xl font-bold mb-4">{selectedTransaction ? 'Editar Transacción' : 'Nueva Transacción Real'}</h2>
            {selectedCommittedId && <p className="text-sm text-blue-600 mb-3">Compensando transacción comprometida</p>}
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
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-cancel">Cancelar</button>
                <button type="submit" className="btn-primary">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmationDialog isOpen={showDeleteDialog} message="¿Estás seguro de eliminar esta transacción?" onConfirm={confirmDelete} onCancel={() => { setShowDeleteDialog(false); setDeleteTargetId(null); }} />
    </div>
  );
}
