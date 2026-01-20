import React from 'react';
import { Ingredient, ConsumptionLog } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';
import { AlertTriangle, TrendingDown, Users, Package } from 'lucide-react';

interface DashboardProps {
  inventory: Ingredient[];
  logs: ConsumptionLog[];
}

export const Dashboard: React.FC<DashboardProps> = ({ inventory, logs }) => {
  const lowStockItems = inventory.filter(i => i.currentStock <= i.minThreshold);
  
  // Aggregate data for charts
  const consumptionData = logs.slice(-7).map(log => ({
    name: log.date.split('-').slice(1).join('/'), // Format MM/DD
    grams: log.gramsPerStudent,
    amount: log.amountUsed,
    item: log.ingredientName
  }));

  // Group by item for stock chart
  const stockData = inventory.map(item => ({
    name: item.name,
    stock: item.currentStock,
    min: item.minThreshold
  })).sort((a, b) => a.stock - b.stock).slice(0, 10); // Show top 10 lowest

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Visão Geral</h2>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 font-medium">Itens em Alerta</p>
            <h3 className="text-2xl font-bold text-red-600">{lowStockItems.length}</h3>
          </div>
          <div className="p-3 bg-red-100 rounded-full text-red-600">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 font-medium">Itens Totais</p>
            <h3 className="text-2xl font-bold text-gray-800">{inventory.length}</h3>
          </div>
          <div className="p-3 bg-blue-100 rounded-full text-blue-600">
            <Package className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 font-medium">Registros Hoje</p>
            <h3 className="text-2xl font-bold text-gray-800">
              {logs.filter(l => l.date === new Date().toISOString().split('T')[0]).length}
            </h3>
          </div>
          <div className="p-3 bg-green-100 rounded-full text-green-600">
            <TrendingDown className="w-6 h-6" />
          </div>
        </div>

         <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 font-medium">Média Alunos (7d)</p>
            <h3 className="text-2xl font-bold text-gray-800">
              {Math.round(logs.slice(-7).reduce((acc, curr) => acc + curr.studentCount, 0) / (logs.slice(-7).length || 1))}
            </h3>
          </div>
          <div className="p-3 bg-purple-100 rounded-full text-purple-600">
            <Users className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Alerts Section */}
      {lowStockItems.length > 0 && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
          <h3 className="font-bold text-red-800 mb-2 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" /> Reposição Necessária
          </h3>
          <div className="flex flex-wrap gap-2">
            {lowStockItems.map(item => (
              <span key={item.id} className="bg-white text-red-700 px-3 py-1 rounded-full text-sm border border-red-200 shadow-sm">
                {item.name}: <b>{item.currentStock}kg</b> (Mín: {item.minThreshold}kg)
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="font-semibold text-gray-700 mb-6">Consumo por Aluno (Gramas) - Últimos Registros</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={consumptionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  formatter={(value: number) => [`${value.toFixed(1)}g`, 'Por Aluno']}
                  labelFormatter={(label) => `Data: ${label}`}
                />
                <Legend />
                <Line type="monotone" dataKey="grams" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} name="Gramas/Aluno" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="font-semibold text-gray-700 mb-6">Níveis de Estoque (Itens Críticos)</h3>
          <div className="h-64">
             <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stockData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px' }}
                  formatter={(value: number) => [`${value}kg`, 'Quantidade']}
                />
                <Legend />
                <Bar dataKey="stock" fill="#3b82f6" radius={[0, 4, 4, 0]} name="Estoque Atual" />
                <Bar dataKey="min" fill="#ef4444" radius={[0, 4, 4, 0]} name="Mínimo" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};