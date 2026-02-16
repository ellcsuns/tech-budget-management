import React, { useState, useMemo } from 'react';
import { expensesEnhancedApi } from '../services/api';
import type { ExpenseWithTags, CustomTag } from '../types';
import { HiOutlinePencilSquare, HiOutlineTrash } from 'react-icons/hi2';
import { fmt, MONTH_NAMES } from '../utils/formatters';

interface Props {
  expense: ExpenseWithTags;
  onClose: () => void;
  onUpdate?: () => void;
  readOnly?: boolean;
}

export default function ExpenseDetailPopup({ expense, onClose, onUpdate, readOnly = false }: Props) {
  const [showTagForm, setShowTagForm] = useState(false);
  const [editingTag, setEditingTag] = useState<CustomTag | null>(null);
  const [tagForm, setTagForm] = useState({ key: '', value: '', valueType: 'TEXT' as 'TEXT' | 'NUMBER' | 'DATE' | 'SELECT' });

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

  // Group transactions by type and month (newest first)
  const committedByMonth = useMemo(() => {
    const txns = (expense.transactions || []).filter(t => t.type === 'COMMITTED').sort((a, b) => new Date(b.serviceDate).getTime() - new Date(a.serviceDate).getTime());
    const grouped: Record<number, typeof txns> = {};
    txns.forEach(t => { if (!grouped[t.month]) grouped[t.month] = []; grouped[t.month].push(t); });
    return Object.entries(grouped).sort(([a], [b]) => Number(b) - Number(a)).map(([month, items]) => ({ month: Number(month), items }));
  }, [expense.transactions]);

  const realByMonth = useMemo(() => {
    const txns = (expense.transactions || []).filter(t => t.type === 'REAL').sort((a, b) => new Date(b.serviceDate).getTime() - new Date(a.serviceDate).getTime());
    const grouped: Record<number, typeof txns> = {};
    txns.forEach(t => { if (!grouped[t.month]) grouped[t.month] = []; grouped[t.month].push(t); });
    return Object.entries(grouped).sort(([a], [b]) => Number(b) - Number(a)).map(([month, items]) => ({ month: Number(month), items }));
  }, [expense.transactions]);

  const renderTxnTable = (groups: { month: number; items: any[] }[], title: string, color: string) => (
    <div className="flex-1 min-w-0">
      <h4 className={`text-sm font-bold ${color} mb-2`}>{title}</h4>
      {groups.length === 0 ? (
        <p className="text-gray-400 text-sm text-center py-4">Sin transacciones</p>
      ) : (
        <div className="space-y-3">
          {groups.map(g => (
            <div key={g.month}>
              <div className={`text-xs font-semibold ${color} bg-gray-50 px-2 py-1 rounded`}>{MONTH_NAMES[g.month - 1]} — {g.items.length} transacción(es)</div>
              <table className="w-full text-xs mt-1">
                <thead><tr className="text-gray-500">
                  <th className="text-left py-1 px-1">Fecha</th>
                  <th className="text-left py-1 px-1">Ref</th>
                  <th className="text-right py-1 px-1">Valor</th>
                  <th className="text-right py-1 px-1">USD</th>
                </tr></thead>
                <tbody>
                  {g.items.map(t => (
                    <tr key={t.id} className="border-t border-gray-100">
                      <td className="py-1 px-1">{new Date(t.serviceDate).toLocaleDateString()}</td>
                      <td className="py-1 px-1 truncate max-w-[100px]" title={t.referenceDocumentNumber}>{t.referenceDocumentNumber}</td>
                      <td className="py-1 px-1 text-right">{fmt(Number(t.transactionValue))} {t.transactionCurrency}</td>
                      <td className="py-1 px-1 text-right">{fmt(Number(t.usdValue))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">{expense.code} — {expense.shortDescription}</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
          </div>

          {/* Info */}
          <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
            <div><span className="text-gray-500">Empresa:</span> {expense.financialCompany?.name}</div>
            <div><span className="text-gray-500">Descripción:</span> {expense.longDescription}</div>
          </div>

          {/* Transactions section */}
          <div className="border-t pt-4 mb-4">
            <div className="flex gap-6">
              {renderTxnTable(committedByMonth, 'Comprometido', 'text-blue-700')}
              {renderTxnTable(realByMonth, 'Real', 'text-green-700')}
            </div>
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

          <div className="mt-4 flex justify-end">
            <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 text-sm">Cerrar</button>
          </div>
        </div>
      </div>
    </div>
  );
}