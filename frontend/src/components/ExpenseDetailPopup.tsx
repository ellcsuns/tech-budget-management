import React, { useState, useEffect } from 'react';
import { expensesEnhancedApi, transactionApi, budgetApi, budgetLineApi } from '../services/api';
import type { ExpenseWithTags, CustomTag, Transaction, BudgetLine } from '../types';
import { HiOutlinePencilSquare, HiOutlineTrash } from 'react-icons/hi2';
import { fmt } from '../utils/formatters';

interface Props {
  expense: ExpenseWithTags;
  onClose: () => void;
  onUpdate?: () => void;
  readOnly?: boolean;
}

const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

export default function ExpenseDetailPopup({ expense, onClose, onUpdate, readOnly = false }: Props) {
  const [showTagForm, setShowTagForm] = useState(false);
  const [editingTag, setEditingTag] = useState<CustomTag | null>(null);
  const [tagForm, setTagForm] = useState({ key: '', value: '', valueType: 'TEXT' as 'TEXT' | 'NUMBER' | 'DATE' | 'SELECT' });
  const [, setBudgetLines] = useState<BudgetLine[]>([]);
  const [committedTxns, setCommittedTxns] = useState<Transaction[]>([]);
  const [realTxns, setRealTxns] = useState<Transaction[]>([]);
  const [loadingTxns, setLoadingTxns] = useState(true);
  const [activeTab, setActiveTab] = useState<'info' | 'committed' | 'real'>('info');

  useEffect(() => { loadTransactions(); }, [expense.id]);

  const loadTransactions = async () => {
    try {
      setLoadingTxns(true);
      const budgetsRes = await budgetApi.getAll();
      if (budgetsRes.data.length > 0) {
        const latest = budgetsRes.data[budgetsRes.data.length - 1];
        const linesRes = await budgetLineApi.getByBudget(latest.id);
        const expenseLines = linesRes.data.filter((bl: BudgetLine) => bl.expenseId === expense.id);
        setBudgetLines(expenseLines);
        const allCommitted: Transaction[] = [];
        const allReal: Transaction[] = [];
        for (const bl of expenseLines) {
          const txnRes = await transactionApi.getByBudgetLine(bl.id);
          txnRes.data.forEach((t: Transaction) => {
            if (t.type === 'COMMITTED') allCommitted.push(t);
            else allReal.push(t);
          });
        }
        setCommittedTxns(allCommitted);
        setRealTxns(allReal);
      }
    } catch (error) { console.error('Error loading transactions:', error); }
    finally { setLoadingTxns(false); }
  };

  const handleAddTag = async (e: React.FormEvent) => {
    e.preventDefault();
    try { await expensesEnhancedApi.addTag(expense.id, tagForm); resetTagForm(); onUpdate?.(); }
    catch (error: any) { alert(error.response?.data?.error || 'Error al agregar tag'); }
  };

  const handleUpdateTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTag) return;
    try { await expensesEnhancedApi.updateTag(expense.id, editingTag.key, tagForm); resetTagForm(); onUpdate?.(); }
    catch (error: any) { alert(error.response?.data?.error || 'Error al actualizar tag'); }
  };

  const handleDeleteTag = async (tagKey: string) => {
    if (!confirm('¿Estás seguro de eliminar este tag?')) return;
    try { await expensesEnhancedApi.removeTag(expense.id, tagKey); onUpdate?.(); }
    catch (error: any) { alert(error.response?.data?.error || 'Error al eliminar tag'); }
  };

  const startEditTag = (tag: CustomTag) => {
    setEditingTag(tag);
    setTagForm({ key: tag.key, value: String(tag.value), valueType: tag.valueType });
    setShowTagForm(true);
  };

  const resetTagForm = () => { setTagForm({ key: '', value: '', valueType: 'TEXT' }); setEditingTag(null); setShowTagForm(false); };

  const renderTransactionTable = (txns: Transaction[], type: string) => {
    if (loadingTxns) return <p className="text-center py-4 text-gray-400">Cargando...</p>;
    if (txns.length === 0) return <p className="text-center py-4 text-gray-400">No hay transacciones {type}</p>;
    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left text-xs text-gray-500">Ref. Doc</th>
              <th className="px-3 py-2 text-left text-xs text-gray-500">Empresa</th>
              <th className="px-3 py-2 text-left text-xs text-gray-500">Fecha Servicio</th>
              <th className="px-3 py-2 text-left text-xs text-gray-500">Fecha Imputación</th>
              <th className="px-3 py-2 text-left text-xs text-gray-500">Moneda</th>
              <th className="px-3 py-2 text-right text-xs text-gray-500">Valor</th>
              <th className="px-3 py-2 text-right text-xs text-gray-500">USD</th>
              <th className="px-3 py-2 text-center text-xs text-gray-500">Mes</th>
              {type === 'comprometidas' && <th className="px-3 py-2 text-center text-xs text-gray-500">Compensada</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {txns.map(t => (
              <tr key={t.id} className={t.isCompensated ? 'opacity-50' : ''}>
                <td className="px-3 py-2">{t.referenceDocumentNumber}</td>
                <td className="px-3 py-2">{t.financialCompany?.name || '-'}</td>
                <td className="px-3 py-2">{new Date(t.serviceDate).toLocaleDateString()}</td>
                <td className="px-3 py-2">{new Date(t.postingDate).toLocaleDateString()}</td>
                <td className="px-3 py-2">{t.transactionCurrency}</td>
                <td className="px-3 py-2 text-right">{fmt(Number(t.transactionValue))}</td>
                <td className="px-3 py-2 text-right">{fmt(Number(t.usdValue))}</td>
                <td className="px-3 py-2 text-center">{MONTHS[t.month - 1]}</td>
                {type === 'comprometidas' && (
                  <td className="px-3 py-2 text-center">
                    <span className={`px-2 py-0.5 rounded text-xs ${t.isCompensated ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {t.isCompensated ? 'Sí' : 'No'}
                    </span>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-50 font-semibold">
            <tr>
              <td colSpan={5} className="px-3 py-2">Total</td>
              <td className="px-3 py-2 text-right">{fmt(txns.reduce((s, t) => s + Number(t.transactionValue), 0))}</td>
              <td className="px-3 py-2 text-right">{fmt(txns.reduce((s, t) => s + Number(t.usdValue), 0))}</td>
              <td colSpan={type === 'comprometidas' ? 2 : 1}></td>
            </tr>
          </tfoot>
        </table>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">{expense.code} — {expense.shortDescription}</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
          </div>

          {/* Tabs */}
          <div className="flex border-b mb-4">
            <button onClick={() => setActiveTab('info')} className={`px-4 py-2 text-sm font-medium border-b-2 ${activeTab === 'info' ? 'border-accent text-accent' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Info & Tags</button>
            <button onClick={() => setActiveTab('committed')} className={`px-4 py-2 text-sm font-medium border-b-2 ${activeTab === 'committed' ? 'border-accent text-accent' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              Comprometidas ({committedTxns.length})
            </button>
            <button onClick={() => setActiveTab('real')} className={`px-4 py-2 text-sm font-medium border-b-2 ${activeTab === 'real' ? 'border-accent text-accent' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              Reales ({realTxns.length})
            </button>
          </div>

          {activeTab === 'info' && (
            <>
              <div className="grid grid-cols-1 gap-4 mb-4 text-sm">
                <div><span className="text-gray-500">Descripción:</span> {expense.longDescription}</div>
              </div>
              {/* Tags */}
              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-sm font-bold">Tags</h3>
                  {!readOnly && (
                    <button onClick={() => setShowTagForm(!showTagForm)} className="text-xs px-3 py-1 bg-accent text-white rounded">{showTagForm ? 'Cancelar' : 'Agregar Tag'}</button>
                  )}
                </div>
                {showTagForm && (
                  <div className="bg-gray-50 p-3 rounded mb-3">
                    <form onSubmit={editingTag ? handleUpdateTag : handleAddTag}>
                      <div className="grid grid-cols-3 gap-3 mb-3">
                        <div>
                          <label className="block text-xs font-medium mb-1">Clave</label>
                          <input type="text" value={tagForm.key} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTagForm({ ...tagForm, key: e.target.value })} className="w-full border rounded px-2 py-1 text-sm" required disabled={!!editingTag} />
                        </div>
                        <div>
                          <label className="block text-xs font-medium mb-1">Valor</label>
                          <input type={tagForm.valueType === 'NUMBER' ? 'number' : tagForm.valueType === 'DATE' ? 'date' : 'text'} value={tagForm.value} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTagForm({ ...tagForm, value: e.target.value })} className="w-full border rounded px-2 py-1 text-sm" required />
                        </div>
                        <div>
                          <label className="block text-xs font-medium mb-1">Tipo</label>
                          <select value={tagForm.valueType} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setTagForm({ ...tagForm, valueType: e.target.value as any })} className="w-full border rounded px-2 py-1 text-sm">
                            <option value="TEXT">Texto</option><option value="NUMBER">Número</option><option value="DATE">Fecha</option>
                          </select>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button type="submit" className="text-xs px-3 py-1 bg-green-600 text-white rounded">{editingTag ? 'Actualizar' : 'Agregar'}</button>
                        <button type="button" onClick={resetTagForm} className="text-xs px-3 py-1 bg-gray-300 rounded">Cancelar</button>
                      </div>
                    </form>
                  </div>
                )}
                {expense.customTags.length === 0 ? (
                  <p className="text-gray-400 text-sm text-center py-2">Sin tags</p>
                ) : (
                  <div className="space-y-1">
                    {expense.customTags.map((tag, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-gray-50 p-2 rounded text-sm">
                        <div><span className="font-medium">{tag.key}:</span> {tag.valueType === 'DATE' ? new Date(tag.value as string).toLocaleDateString() : String(tag.value)} <span className="text-xs text-gray-400">({tag.valueType})</span></div>
                        {!readOnly && (
                          <div className="flex gap-1">
                            <button onClick={() => startEditTag(tag)} className="text-gray-400 hover:text-blue-600"><HiOutlinePencilSquare className="w-4 h-4" /></button>
                            <button onClick={() => handleDeleteTag(tag.key)} className="text-gray-400 hover:text-red-600"><HiOutlineTrash className="w-4 h-4" /></button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {activeTab === 'committed' && renderTransactionTable(committedTxns, 'comprometidas')}
          {activeTab === 'real' && renderTransactionTable(realTxns, 'reales')}

          <div className="mt-4 flex justify-end">
            <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 text-sm">Cerrar</button>
          </div>
        </div>
      </div>
    </div>
  );
}
