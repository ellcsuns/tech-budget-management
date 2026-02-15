import { useState } from 'react';
import { expensesEnhancedApi } from '../services/api';
import type { ExpenseWithTags, CustomTag } from '../types';

interface Props {
  expense: ExpenseWithTags;
  onClose: () => void;
  onUpdate: () => void;
}

export default function ExpenseDetailPopup({ expense, onClose, onUpdate }: Props) {
  const [showTagForm, setShowTagForm] = useState(false);
  const [editingTag, setEditingTag] = useState<CustomTag | null>(null);
  const [tagForm, setTagForm] = useState({
    key: '',
    value: '',
    valueType: 'TEXT' as 'TEXT' | 'NUMBER' | 'DATE' | 'SELECT'
  });

  const handleAddTag = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await expensesEnhancedApi.addTag(expense.id, tagForm);
      resetTagForm();
      onUpdate();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error al agregar tag');
    }
  };

  const handleUpdateTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTag) return;

    try {
      await expensesEnhancedApi.updateTag(expense.id, editingTag.key, tagForm);
      resetTagForm();
      onUpdate();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error al actualizar tag');
    }
  };

  const handleDeleteTag = async (tagKey: string) => {
    if (!confirm('¿Estás seguro de eliminar este tag?')) return;

    try {
      await expensesEnhancedApi.removeTag(expense.id, tagKey);
      onUpdate();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error al eliminar tag');
    }
  };

  const startEditTag = (tag: CustomTag) => {
    setEditingTag(tag);
    setTagForm({
      key: tag.key,
      value: String(tag.value),
      valueType: tag.valueType
    });
    setShowTagForm(true);
  };

  const resetTagForm = () => {
    setTagForm({ key: '', value: '', valueType: 'TEXT' });
    setEditingTag(null);
    setShowTagForm(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Detalle del Gasto</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          </div>

          {/* Expense Info */}
          <div className="mb-6">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Código</label>
                <p className="mt-1 text-gray-900">{expense.code}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Empresa Financiera</label>
                <p className="mt-1 text-gray-900">{expense.financialCompany?.name}</p>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">Descripción Corta</label>
              <p className="mt-1 text-gray-900">{expense.shortDescription}</p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">Descripción Larga</label>
              <p className="mt-1 text-gray-900">{expense.longDescription}</p>
            </div>
          </div>

          {/* Custom Tags Section */}
          <div className="border-t pt-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Tags Personalizados</h3>
              <button
                onClick={() => setShowTagForm(!showTagForm)}
                className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 text-sm"
              >
                {showTagForm ? 'Cancelar' : 'Agregar Tag'}
              </button>
            </div>

            {/* Tag Form */}
            {showTagForm && (
              <div className="bg-gray-50 p-4 rounded mb-4">
                <form onSubmit={editingTag ? handleUpdateTag : handleAddTag}>
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Clave *</label>
                      <input
                        type="text"
                        value={tagForm.key}
                        onChange={(e) => setTagForm({ ...tagForm, key: e.target.value })}
                        className="w-full border rounded px-3 py-2"
                        required
                        disabled={!!editingTag}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Valor *</label>
                      <input
                        type={tagForm.valueType === 'NUMBER' ? 'number' : tagForm.valueType === 'DATE' ? 'date' : 'text'}
                        value={tagForm.value}
                        onChange={(e) => setTagForm({ ...tagForm, value: e.target.value })}
                        className="w-full border rounded px-3 py-2"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Tipo *</label>
                      <select
                        value={tagForm.valueType}
                        onChange={(e) => setTagForm({ ...tagForm, valueType: e.target.value as any })}
                        className="w-full border rounded px-3 py-2"
                      >
                        <option value="TEXT">Texto</option>
                        <option value="NUMBER">Número</option>
                        <option value="DATE">Fecha</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                    >
                      {editingTag ? 'Actualizar' : 'Agregar'}
                    </button>
                    <button
                      type="button"
                      onClick={resetTagForm}
                      className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Tags List */}
            {expense.customTags.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No hay tags personalizados</p>
            ) : (
              <div className="space-y-2">
                {expense.customTags.map((tag, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-gray-50 p-3 rounded">
                    <div>
                      <span className="font-medium">{tag.key}:</span>{' '}
                      <span className="text-gray-700">
                        {tag.valueType === 'DATE' 
                          ? new Date(tag.value).toLocaleDateString()
                          : String(tag.value)
                        }
                      </span>
                      <span className="text-xs text-gray-500 ml-2">({tag.valueType})</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEditTag(tag)}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDeleteTag(tag.key)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Close Button */}
          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="bg-gray-600 text-white px-6 py-2 rounded hover:bg-gray-700"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
