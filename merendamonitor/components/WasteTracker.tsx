import React, { useState, useMemo } from 'react';
import { Ingredient } from '../types';
import { WasteLog } from '../types-extended';
import { Trash2, AlertTriangle, TrendingDown, Calendar, DollarSign, PieChart } from 'lucide-react';
import { supabase } from '../services/supabase';

interface WasteTrackerProps {
  inventory: Ingredient[];
  onRefresh?: () => void;
}

export const WasteTracker: React.FC<WasteTrackerProps> = ({ inventory, onRefresh }) => {
  const [wasteLogs, setWasteLogs] = useState<WasteLog[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    ingredientId: '',
    amount: '',
    reason: 'expired' as WasteLog['reason'],
    costImpact: '',
    notes: ''
  });

  // Fetch waste logs
  React.useEffect(() => {
    fetchWasteLogs();
  }, []);

  const fetchWasteLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('waste_logs')
        .select('*')
        .order('date', { ascending: false })
        .limit(50);

      if (error) throw error;

      const formatted: WasteLog[] = (data || []).map((item: any) => ({
        id: item.id,
        date: item.date,
        ingredientId: item.ingredient_id,
        ingredientName: item.ingredient_name,
        amount: item.amount,
        reason: item.reason,
        costImpact: item.cost_impact,
        notes: item.notes
      }));

      setWasteLogs(formatted);
    } catch (error) {
      console.error('Error fetching waste logs:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.ingredientId || !formData.amount) return;

    const ingredient = inventory.find(i => i.id === formData.ingredientId);
    if (!ingredient) return;

    setLoading(true);

    try {
      const { error } = await supabase
        .from('waste_logs')
        .insert([{
          date: new Date().toISOString().split('T')[0],
          ingredient_id: formData.ingredientId,
          ingredient_name: ingredient.name,
          amount: parseFloat(formData.amount),
          reason: formData.reason,
          cost_impact: parseFloat(formData.costImpact) || 0,
          notes: formData.notes
        }]);

      if (error) throw error;

      setSuccessMsg(`Desperdício de ${formData.amount}kg de ${ingredient.name} registrado!`);
      setTimeout(() => setSuccessMsg(''), 3000);

      // Reset form
      setFormData({
        ingredientId: '',
        amount: '',
        reason: 'expired',
        costImpact: '',
        notes: ''
      });
      setIsAdding(false);

      // Refresh data
      fetchWasteLogs();
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Error adding waste log:', error);
      alert('Erro ao registrar desperdício');
    } finally {
      setLoading(false);
    }
  };

  // Analytics
  const analytics = useMemo(() => {
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);

    const recentWaste = wasteLogs.filter(log => new Date(log.date) >= thirtyDaysAgo);

    const totalAmount = recentWaste.reduce((acc, log) => acc + log.amount, 0);
    const totalCost = recentWaste.reduce((acc, log) => acc + log.costImpact, 0);

    const byReason = recentWaste.reduce((acc, log) => {
      acc[log.reason] = (acc[log.reason] || 0) + log.amount;
      return acc;
    }, {} as Record<string, number>);

    const byIngredient = recentWaste.reduce((acc, log) => {
      if (!acc[log.ingredientName]) {
        acc[log.ingredientName] = { amount: 0, cost: 0 };
      }
      acc[log.ingredientName].amount += log.amount;
      acc[log.ingredientName].cost += log.costImpact;
      return acc;
    }, {} as Record<string, { amount: number; cost: number }>);

    const topWasted = Object.entries(byIngredient)
      .sort((a, b) => b[1].amount - a[1].amount)
      .slice(0, 5);

    return {
      totalAmount,
      totalCost,
      byReason,
      topWasted,
      count: recentWaste.length
    };
  }, [wasteLogs]);

  const getReasonLabel = (reason: WasteLog['reason']) => {
    const labels = {
      expired: 'Vencido',
      spoiled: 'Estragado',
      leftover: 'Sobra',
      other: 'Outro'
    };
    return labels[reason];
  };

  const getReasonColor = (reason: WasteLog['reason']) => {
    const colors = {
      expired: 'bg-red-100 text-red-800 border-red-200',
      spoiled: 'bg-orange-100 text-orange-800 border-orange-200',
      leftover: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      other: 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colors[reason];
  };

  return (
    <div className="p-6 space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <Trash2 className="text-red-500" />
            Controle de Desperdício
          </h2>
          <p className="text-gray-500">Registre e analise desperdícios para otimizar recursos</p>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 bg-red-600 text-white px-6 py-3 rounded-xl hover:bg-red-700 transition-colors shadow-lg font-bold"
        >
          <Trash2 className="w-5 h-5" />
          Registrar Desperdício
        </button>
      </header>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-red-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Desperdiçado</p>
              <h3 className="text-3xl font-bold text-red-600 mt-2">{analytics.totalAmount.toFixed(1)} kg</h3>
              <p className="text-xs text-gray-400 mt-1">Últimos 30 dias</p>
            </div>
            <div className="p-3 bg-red-100 text-red-600 rounded-xl">
              <TrendingDown className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-orange-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">Impacto Financeiro</p>
              <h3 className="text-3xl font-bold text-orange-600 mt-2">R$ {analytics.totalCost.toFixed(2)}</h3>
              <p className="text-xs text-gray-400 mt-1">Últimos 30 dias</p>
            </div>
            <div className="p-3 bg-orange-100 text-orange-600 rounded-xl">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-yellow-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">Registros</p>
              <h3 className="text-3xl font-bold text-yellow-600 mt-2">{analytics.count}</h3>
              <p className="text-xs text-gray-400 mt-1">Últimos 30 dias</p>
            </div>
            <div className="p-3 bg-yellow-100 text-yellow-600 rounded-xl">
              <Calendar className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-purple-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">Principal Motivo</p>
              <h3 className="text-2xl font-bold text-purple-600 mt-2">
                {Object.keys(analytics.byReason).length > 0
                  ? getReasonLabel(Object.keys(analytics.byReason).sort((a, b) => 
                      analytics.byReason[b] - analytics.byReason[a])[0] as WasteLog['reason'])
                  : '-'}
              </h3>
              <p className="text-xs text-gray-400 mt-1">Mais frequente</p>
            </div>
            <div className="p-3 bg-purple-100 text-purple-600 rounded-xl">
              <PieChart className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Form Modal */}
      {isAdding && (
        <div className="bg-white p-6 rounded-xl shadow-md border border-red-100 animate-fade-in">
          <h3 className="text-lg font-semibold mb-4 text-red-800 flex items-center gap-2">
            <Trash2 className="w-5 h-5" />
            Novo Registro de Desperdício
          </h3>

          {successMsg && (
            <div className="bg-green-100 border border-green-300 text-green-800 px-4 py-3 rounded-lg mb-4">
              ✅ {successMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ingrediente</label>
                <select
                  value={formData.ingredientId}
                  onChange={(e) => setFormData({ ...formData, ingredientId: e.target.value })}
                  className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-red-500 outline-none"
                  required
                >
                  <option value="">Selecione...</option>
                  {inventory.map(item => (
                    <option key={item.id} value={item.id}>{item.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantidade (kg)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-red-500 outline-none"
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Motivo</label>
                <select
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value as WasteLog['reason'] })}
                  className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-red-500 outline-none"
                  required
                >
                  <option value="expired">Vencido</option>
                  <option value="spoiled">Estragado</option>
                  <option value="leftover">Sobra</option>
                  <option value="other">Outro</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Impacto Financeiro (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.costImpact}
                  onChange={(e) => setFormData({ ...formData, costImpact: e.target.value })}
                  className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-red-500 outline-none"
                  placeholder="0.00"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-red-500 outline-none"
                  rows={2}
                  placeholder="Detalhes adicionais..."
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 shadow-sm font-medium disabled:bg-gray-400"
              >
                {loading ? 'Salvando...' : 'Registrar'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Top Wasted Items */}
      {analytics.topWasted.length > 0 && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <AlertTriangle className="text-red-500" />
            Top 5 Itens Mais Desperdiçados (30 dias)
          </h3>
          <div className="space-y-3">
            {analytics.topWasted.map(([name, data], index) => (
              <div key={name} className="flex items-center justify-between p-4 bg-red-50 rounded-xl border border-red-100">
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-bold text-red-400">#{index + 1}</span>
                  <div>
                    <h4 className="font-semibold text-gray-800">{name}</h4>
                    <p className="text-sm text-gray-500">{data.amount.toFixed(1)} kg desperdiçados</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-red-600">R$ {data.cost.toFixed(2)}</p>
                  <p className="text-xs text-gray-500">Impacto</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Logs */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Histórico Recente</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 text-gray-700">
              <tr>
                <th className="p-4 text-left font-semibold">Data</th>
                <th className="p-4 text-left font-semibold">Ingrediente</th>
                <th className="p-4 text-right font-semibold">Quantidade</th>
                <th className="p-4 text-center font-semibold">Motivo</th>
                <th className="p-4 text-right font-semibold">Impacto (R$)</th>
                <th className="p-4 text-left font-semibold">Observações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {wasteLogs.slice(0, 20).map(log => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="p-4 text-gray-600">
                    {new Date(log.date + 'T12:00:00').toLocaleDateString('pt-BR')}
                  </td>
                  <td className="p-4 font-medium text-gray-800">{log.ingredientName}</td>
                  <td className="p-4 text-right font-mono">{log.amount.toFixed(2)} kg</td>
                  <td className="p-4 text-center">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getReasonColor(log.reason)}`}>
                      {getReasonLabel(log.reason)}
                    </span>
                  </td>
                  <td className="p-4 text-right font-mono text-red-600">
                    {log.costImpact > 0 ? `R$ ${log.costImpact.toFixed(2)}` : '-'}
                  </td>
                  <td className="p-4 text-sm text-gray-500">{log.notes || '-'}</td>
                </tr>
              ))}
              {wasteLogs.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-400">
                    Nenhum desperdício registrado. Isso é ótimo! 🎉
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
