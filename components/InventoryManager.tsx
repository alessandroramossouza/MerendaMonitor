import React, { useState } from 'react';
import { Ingredient, ConsumptionLog, SupplyLog } from '../types';
import { Plus, Edit2, AlertTriangle, Trash2, History } from 'lucide-react';
import { MovementHistory } from './MovementHistory';

interface InventoryManagerProps {
  inventory: Ingredient[];
  onUpdateInventory: (item: Ingredient) => void;
  onDelete: (id: string) => void;
  onAdd: (item: Ingredient) => void;
  consumptionLogs?: ConsumptionLog[];
  supplyLogs?: SupplyLog[];
}

export const InventoryManager: React.FC<InventoryManagerProps> = ({
  inventory,
  onUpdateInventory,
  onDelete,
  onAdd,
  consumptionLogs = [],
  supplyLogs = []
}) => {
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [historyItem, setHistoryItem] = useState<Ingredient | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<Ingredient>>({
    name: '',
    category: 'Grãos',
    currentStock: 0,
    minThreshold: 10,
    unit: 'kg'
  });

  const handleSave = () => {
    if (!formData.name || formData.currentStock === undefined) return;

    const newItem: Ingredient = {
      id: isEditing || crypto.randomUUID(),
      name: formData.name,
      category: formData.category || 'Geral',
      currentStock: Number(formData.currentStock),
      minThreshold: Number(formData.minThreshold || 5),
      unit: 'kg'
    };

    if (isEditing) {
      onUpdateInventory(newItem);
    } else {
      onAdd(newItem);
    }
    resetForm();
  };

  const resetForm = () => {
    setIsEditing(null);
    setIsAdding(false);
    setFormData({ name: '', category: 'Grãos', currentStock: 0, minThreshold: 10, unit: 'kg' });
  };

  const startEdit = (item: Ingredient) => {
    setFormData(item);
    setIsEditing(item.id);
    setIsAdding(true);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Gestão de Estoque</h2>
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
        >
          <Plus className="w-5 h-5" /> Adicionar Item
        </button>
      </div>

      {isAdding && (
        <div className="bg-white p-6 rounded-xl shadow-md border border-emerald-100 animate-fade-in">
          <h3 className="text-lg font-semibold mb-4 text-emerald-800">{isEditing ? 'Editar Item' : 'Novo Item'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Produto</label>
              <input
                type="text"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-emerald-500 outline-none"
                placeholder="Ex: Arroz Branco"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
              <select
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value })}
                className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-emerald-500 outline-none"
              >
                <option value="Grãos">Grãos</option>
                <option value="Proteínas">Proteínas</option>
                <option value="Hortifruti">Hortifruti</option>
                <option value="Laticínios">Laticínios</option>
                <option value="Outros">Outros</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estoque Atual (kg)</label>
              <input
                type="number"
                value={formData.currentStock}
                onChange={e => setFormData({ ...formData, currentStock: parseFloat(e.target.value) })}
                className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Alerta Mínimo (kg)</label>
              <input
                type="number"
                value={formData.minThreshold}
                onChange={e => setFormData({ ...formData, minThreshold: parseFloat(e.target.value) })}
                className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4 justify-end">
            <button onClick={resetForm} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md">Cancelar</button>
            <button onClick={handleSave} className="px-6 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 shadow-sm font-medium">Salvar</button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-emerald-50 text-emerald-900">
            <tr>
              <th className="p-4 font-semibold">Produto</th>
              <th className="p-4 font-semibold">Categoria</th>
              <th className="p-4 font-semibold text-right">Estoque Atual</th>
              <th className="p-4 font-semibold text-right">Status</th>
              <th className="p-4 font-semibold text-center">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {inventory.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                <td className="p-4 font-medium text-gray-800">{item.name}</td>
                <td className="p-4 text-gray-600">
                  <span className="bg-gray-100 px-2 py-1 rounded-full text-xs font-medium">{item.category}</span>
                </td>
                <td className="p-4 text-right font-mono font-medium">{item.currentStock.toFixed(1)} kg</td>
                <td className="p-4 text-right">
                  {item.currentStock <= item.minThreshold ? (
                    <span className="inline-flex items-center gap-1 text-amber-600 bg-amber-50 px-2 py-1 rounded-full text-xs font-bold">
                      <AlertTriangle className="w-3 h-3" /> Baixo
                    </span>
                  ) : (
                    <span className="text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full text-xs font-bold">OK</span>
                  )}
                </td>
                <td className="p-4 flex justify-center gap-2">
                  <button
                    onClick={() => setHistoryItem(item)}
                    className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg"
                    title="Ver Histórico"
                  >
                    <History className="w-4 h-4" />
                  </button>
                  <button onClick={() => startEdit(item)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => onDelete(item.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
            {inventory.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-gray-400">Nenhum item cadastrado no estoque.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Movement History Modal */}
      {historyItem && (
        <MovementHistory
          ingredientId={historyItem.id}
          ingredientName={historyItem.name}
          consumptionLogs={consumptionLogs}
          supplyLogs={supplyLogs}
          onClose={() => setHistoryItem(null)}
        />
      )}
    </div>
  );
};