import React, { useState, useMemo } from 'react';
import { Ingredient, ConsumptionLog, SupplyLog } from '../types';
import { Plus, Edit2, AlertTriangle, Trash2, History, Clock, Package } from 'lucide-react';
import { MovementHistory } from './MovementHistory';

interface InventoryManagerProps {
  inventory: Ingredient[];
  onUpdateInventory: (item: Ingredient) => void;
  onDelete: (id: string) => void;
  onAdd: (item: Ingredient) => void;
  consumptionLogs?: ConsumptionLog[];
  supplyLogs?: SupplyLog[];
  readOnly?: boolean;
}

export const InventoryManager: React.FC<InventoryManagerProps> = ({
  inventory,
  onUpdateInventory,
  onDelete,
  onAdd,
  consumptionLogs = [],
  supplyLogs = [],
  readOnly = false
}) => {
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [historyItem, setHistoryItem] = useState<Ingredient | null>(null);

  // Form State - simplified: only product info, no stock value
  const [formData, setFormData] = useState<Partial<Ingredient>>({
    name: '',
    category: 'Grãos',
    minThreshold: 10,
    unit: 'kg'
  });

  // Calculate nearest expiration for each ingredient
  const expirationMap = useMemo(() => {
    const map: Record<string, { date: string; daysLeft: number } | null> = {};
    const today = new Date();

    inventory.forEach(item => {
      const itemSupplies = supplyLogs
        .filter(log => log.ingredientId === item.id && log.expirationDate)
        .map(log => ({
          date: log.expirationDate!,
          daysLeft: Math.ceil((new Date(log.expirationDate!).getTime() - today.getTime()) / (1000 * 3600 * 24))
        }))
        .sort((a, b) => a.daysLeft - b.daysLeft);

      map[item.id] = itemSupplies.length > 0 ? itemSupplies[0] : null;
    });

    return map;
  }, [inventory, supplyLogs]);

  const handleSave = () => {
    if (!formData.name) return;

    const newItem: Ingredient = {
      id: isEditing || crypto.randomUUID(),
      name: formData.name,
      category: formData.category || 'Geral',
      currentStock: isEditing ? (inventory.find(i => i.id === isEditing)?.currentStock || 0) : 0, // Keep existing or start at 0
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
    setFormData({ name: '', category: 'Grãos', minThreshold: 10, unit: 'kg' });
  };

  const startEdit = (item: Ingredient) => {
    setFormData({
      name: item.name,
      category: item.category,
      minThreshold: item.minThreshold,
      unit: item.unit
    });
    setIsEditing(item.id);
    setIsAdding(true);
  };

  const getExpirationBadge = (itemId: string) => {
    const exp = expirationMap[itemId];
    if (!exp) return null;

    if (exp.daysLeft < 0) {
      return (
        <span className="inline-flex items-center gap-1 text-red-700 bg-red-100 px-2 py-1 rounded-full text-xs font-bold">
          <Clock className="w-3 h-3" /> VENCIDO
        </span>
      );
    } else if (exp.daysLeft <= 7) {
      return (
        <span className="inline-flex items-center gap-1 text-red-600 bg-red-50 px-2 py-1 rounded-full text-xs font-bold">
          <Clock className="w-3 h-3" /> {exp.daysLeft}d
        </span>
      );
    } else if (exp.daysLeft <= 30) {
      return (
        <span className="inline-flex items-center gap-1 text-amber-600 bg-amber-50 px-2 py-1 rounded-full text-xs font-bold">
          <Clock className="w-3 h-3" /> {exp.daysLeft}d
        </span>
      );
    }
    return null;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Cadastro de Produtos</h2>
          <p className="text-gray-500 text-sm">Cadastre os produtos. Para adicionar estoque, use "Entradas".</p>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
        >
          <Plus className="w-5 h-5" /> Novo Produto
        </button>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
        <Package className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-blue-800 font-medium">Como funciona?</p>
          <p className="text-blue-700 text-sm">
            1. Cadastre o produto aqui → 2. Vá em <strong>Entradas</strong> para abastecer o estoque com validade
          </p>
        </div>
      </div>

      {isAdding && (
        <div className="bg-white p-6 rounded-xl shadow-md border border-emerald-100 animate-fade-in">
          <h3 className="text-lg font-semibold mb-4 text-emerald-800">{isEditing ? 'Editar Produto' : 'Novo Produto'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                <option value="Temperos">Temperos</option>
                <option value="Bebidas">Bebidas</option>
                <option value="Outros">Outros</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Alerta Mínimo (kg)</label>
              <input
                type="number"
                value={formData.minThreshold}
                onChange={e => setFormData({ ...formData, minThreshold: parseFloat(e.target.value) })}
                className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-emerald-500 outline-none"
                placeholder="Ex: 10"
              />
              <p className="text-xs text-gray-400 mt-1">Avisa quando estoque for menor que este valor</p>
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
              <th className="p-4 font-semibold text-center">Próx. Validade</th>
              <th className="p-4 font-semibold text-right">Status</th>
              <th className="p-4 font-semibold text-center">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
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