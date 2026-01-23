import React, { useMemo, useEffect, useState } from 'react';
import { Ingredient, ConsumptionLog, SupplyLog } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { AlertTriangle, TrendingDown, Package, Clock, Hourglass, Users, ChefHat } from 'lucide-react';
import { calculateStockForecast } from '../services/forecasting';
import { getTodayAttendanceSummary } from '../services/notifications';


interface DashboardProps {
  inventory: Ingredient[];
  logs: ConsumptionLog[];
  supplyLogs?: SupplyLog[];
}

interface AttendanceSummary {
  totalStudents: number;
  byShift: { shift: string; count: number }[];
  byClassroom: { name: string; count: number }[];
}

export const Dashboard: React.FC<DashboardProps> = ({ inventory, logs, supplyLogs = [] }) => {
  // Attendance Summary State
  const [attendanceSummary, setAttendanceSummary] = useState<AttendanceSummary>({
    totalStudents: 0,
    byShift: [],
    byClassroom: []
  });

  // Fetch attendance summary on mount
  useEffect(() => {
    const loadAttendance = async () => {
      const summary = await getTodayAttendanceSummary();
      setAttendanceSummary(summary);
    };
    loadAttendance();
  }, []);

  // Low Stock Items
  const lowStockItems = inventory.filter(item => item.currentStock <= item.minThreshold);

  // Forecast Data
  const forecast = useMemo(() => calculateStockForecast(inventory, logs), [inventory, logs]);
  const criticalStockItems = forecast.filter(f => f.status === 'critical' || f.daysRemaining < 7);


  // Calculate Expiration Alerts (Items expiring in next 30 days)
  const expiringItems = useMemo(() => {
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);

    return supplyLogs
      .filter(log => log.expirationDate)
      .map(log => ({
        ...log,
        daysToZap: Math.ceil((new Date(log.expirationDate!).getTime() - today.getTime()) / (1000 * 3600 * 24))
      }))
      .filter(item => item.daysToZap <= 30 && item.daysToZap >= -5) // Show expired nearby too
      .sort((a, b) => a.daysToZap - b.daysToZap);
  }, [supplyLogs]);

  // Aggregate Consumption for Chart
  const chartData = useMemo(() => {
    const data: Record<string, number> = {};
    logs.slice(0, 50).forEach(log => {
      data[log.ingredientName] = (data[log.ingredientName] || 0) + log.amountUsed;
    });
    return Object.entries(data)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5); // Top 5
  }, [logs]);

  return (
    <div className="p-6 space-y-8">
      <header>
        <h2 className="text-3xl font-bold text-gray-800">Painel de Controle</h2>
        <p className="text-gray-500">Visão geral da merenda escolar</p>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        {/* Kitchen Attendance Card - NEW */}
        <div className="bg-gradient-to-br from-orange-500 to-red-500 p-6 rounded-2xl shadow-lg text-white xl:col-span-2">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-orange-100 flex items-center gap-1">
                <ChefHat className="w-4 h-4" /> Atenção Cozinha
              </p>
              <h3 className="text-4xl font-bold mt-2">{attendanceSummary.totalStudents}</h3>
              <p className="text-sm text-orange-100 mt-1">Alunos Presentes Hoje</p>
            </div>
            <div className="p-3 bg-white/20 rounded-xl">
              <Users className="w-8 h-8" />
            </div>
          </div>
          {attendanceSummary.byShift.length > 0 && (
            <div className="mt-4 pt-3 border-t border-white/20">
              <p className="text-xs text-orange-100 mb-2">Por Turno:</p>
              <div className="flex flex-wrap gap-2">
                {attendanceSummary.byShift.map(shift => (
                  <span key={shift.shift} className="bg-white/20 text-white text-xs font-semibold px-2 py-1 rounded-full">
                    {shift.shift === 'morning' ? '☀️ Manhã' : shift.shift === 'afternoon' ? '🌅 Tarde' : '🌙 Integral'}: {shift.count}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-emerald-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">Itens no Estoque</p>
              <h3 className="text-3xl font-bold text-gray-800 mt-2">{inventory.length}</h3>
            </div>
            <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl">
              <Package className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Forecast Card: Items running out soon */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-purple-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">Acabando em &lt;7 dias</p>
              <h3 className={`text-3xl font-bold mt-2 ${criticalStockItems.length > 0 ? 'text-purple-600' : 'text-gray-400'}`}>
                {criticalStockItems.length}
              </h3>
            </div>
            <div className="p-3 bg-purple-100 text-purple-600 rounded-xl">
              <Hourglass className="w-6 h-6" />
            </div>
          </div>
        </div>


        <div className="bg-white p-6 rounded-2xl shadow-sm border border-red-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">Estoque Crítico</p>
              <h3 className="text-3xl font-bold text-red-600 mt-2">{lowStockItems.length}</h3>
            </div>
            <div className="p-3 bg-red-100 text-red-600 rounded-xl">
              <TrendingDown className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-amber-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">Vencendo em Breve</p>
              <h3 className="text-3xl font-bold text-amber-600 mt-2">{expiringItems.length}</h3>
              <p className="text-xs text-gray-400 mt-1">Próximos 30 dias</p>
            </div>
            <div className="p-3 bg-amber-100 text-amber-600 rounded-xl">
              <Clock className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Low Stock Alerts */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <AlertTriangle className="text-red-500" />
            Alertas de Reposição
          </h3>
          <div className="space-y-4">
            {lowStockItems.length === 0 ? (
              <p className="text-center text-gray-400 py-8">Estoque saudável! ✅</p>
            ) : (
              lowStockItems.map(item => (
                <div key={item.id} className="flex items-center justify-between p-4 bg-red-50 rounded-xl border border-red-100">
                  <div>
                    <h4 className="font-semibold text-gray-800">{item.name}</h4>
                    <p className="text-sm text-red-600">Restam apenas {item.currentStock} {item.unit}</p>
                  </div>
                  <span className="text-xs font-bold text-red-700 bg-red-200 px-3 py-1 rounded-full">
                    Mín: {item.minThreshold}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Expiration Alerts (NEW) */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <Clock className="text-amber-500" />
            Atenção: Validade
          </h3>
          <div className="space-y-4 max-h-[300px] overflow-y-auto">
            {expiringItems.length === 0 ? (
              <p className="text-center text-gray-400 py-8">Nenhum item vencendo em breve. ✅</p>
            ) : (
              expiringItems.map(log => (
                <div key={log.id} className="flex items-center justify-between p-4 bg-amber-50 rounded-xl border border-amber-100">
                  <div>
                    <h4 className="font-semibold text-gray-800">{log.ingredientName}</h4>
                    <p className="text-sm text-amber-800">
                      Vence dia {new Date(log.expirationDate!).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${log.daysToZap < 0 ? 'bg-red-200 text-red-800' : 'bg-amber-200 text-amber-800'}`}>
                      {log.daysToZap < 0 ? 'VENCEU' : `${log.daysToZap} dias`}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Consumption Chart */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="text-xl font-bold text-gray-800 mb-6">Top 5 Mais Consumidos (Total)</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip cursor={{ fill: 'transparent' }} />
              <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'][index % 5]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};