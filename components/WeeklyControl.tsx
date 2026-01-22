import React, { useState, useMemo } from 'react';
import { Ingredient, ConsumptionLog, SupplyLog } from '../types';
import { Calendar, TrendingUp, TrendingDown, DollarSign, Users, Package } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';

interface WeeklyControlProps {
  inventory: Ingredient[];
  logs: ConsumptionLog[];
  supplyLogs: SupplyLog[];
}

export const WeeklyControl: React.FC<WeeklyControlProps> = ({ inventory, logs, supplyLogs }) => {
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(today);
    monday.setDate(today.getDate() + mondayOffset);
    return monday.toISOString().split('T')[0];
  });

  // Calculate week dates
  const weekDates = useMemo(() => {
    const dates: string[] = [];
    const start = new Date(currentWeekStart + 'T12:00:00');
    for (let i = 0; i < 5; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }
    return dates;
  }, [currentWeekStart]);

  // Filter data for current week
  const weekLogs = useMemo(() => {
    return logs.filter(log => weekDates.includes(log.date));
  }, [logs, weekDates]);

  const weekSupplies = useMemo(() => {
    return supplyLogs.filter(log => weekDates.includes(log.date));
  }, [supplyLogs, weekDates]);

  // Calculate stats
  const stats = useMemo(() => {
    const totalStudents = weekLogs.reduce((acc, log) => acc + log.studentCount, 0);
    const totalConsumed = weekLogs.reduce((acc, log) => acc + log.amountUsed, 0);
    const totalReceived = weekSupplies.reduce((acc, log) => acc + log.amountAdded, 0);
    const daysWithRecords = new Set(weekLogs.map(log => log.date)).size;
    const avgStudentsPerDay = daysWithRecords > 0 ? totalStudents / daysWithRecords : 0;

    // Group by ingredient
    const consumptionByIngredient: Record<string, number> = {};
    weekLogs.forEach(log => {
      consumptionByIngredient[log.ingredientName] = 
        (consumptionByIngredient[log.ingredientName] || 0) + log.amountUsed;
    });

    const topConsumed = Object.entries(consumptionByIngredient)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    return {
      totalStudents,
      totalConsumed,
      totalReceived,
      daysWithRecords,
      avgStudentsPerDay,
      topConsumed
    };
  }, [weekLogs, weekSupplies]);

  // Daily consumption chart data
  const dailyChartData = useMemo(() => {
    return weekDates.map(date => {
      const dayLogs = weekLogs.filter(log => log.date === date);
      const dayName = new Date(date + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'short' });
      
      return {
        date: dayName,
        fullDate: date,
        students: dayLogs.reduce((acc, log) => acc + log.studentCount, 0),
        consumed: dayLogs.reduce((acc, log) => acc + log.amountUsed, 0)
      };
    });
  }, [weekDates, weekLogs]);

  // Previous week comparison
  const previousWeekStart = useMemo(() => {
    const date = new Date(currentWeekStart + 'T12:00:00');
    date.setDate(date.getDate() - 7);
    return date.toISOString().split('T')[0];
  }, [currentWeekStart]);

  const previousWeekDates = useMemo(() => {
    const dates: string[] = [];
    const start = new Date(previousWeekStart + 'T12:00:00');
    for (let i = 0; i < 5; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }
    return dates;
  }, [previousWeekStart]);

  const previousWeekStats = useMemo(() => {
    const prevLogs = logs.filter(log => previousWeekDates.includes(log.date));
    const totalStudents = prevLogs.reduce((acc, log) => acc + log.studentCount, 0);
    const totalConsumed = prevLogs.reduce((acc, log) => acc + log.amountUsed, 0);
    const daysWithRecords = new Set(prevLogs.map(log => log.date)).size;
    
    return {
      totalStudents,
      totalConsumed,
      avgStudentsPerDay: daysWithRecords > 0 ? totalStudents / daysWithRecords : 0
    };
  }, [logs, previousWeekDates]);

  const goToPreviousWeek = () => {
    const date = new Date(currentWeekStart + 'T12:00:00');
    date.setDate(date.getDate() - 7);
    setCurrentWeekStart(date.toISOString().split('T')[0]);
  };

  const goToNextWeek = () => {
    const date = new Date(currentWeekStart + 'T12:00:00');
    date.setDate(date.getDate() + 7);
    setCurrentWeekStart(date.toISOString().split('T')[0]);
  };

  const goToCurrentWeek = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(today);
    monday.setDate(today.getDate() + mondayOffset);
    setCurrentWeekStart(monday.toISOString().split('T')[0]);
  };

  const formatWeekRange = () => {
    const start = new Date(currentWeekStart + 'T12:00:00');
    const end = new Date(start);
    end.setDate(start.getDate() + 4);
    return `${start.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} - ${end.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}`;
  };

  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  return (
    <div className="p-6 space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <Calendar className="text-purple-600" />
            Controle Semanal
          </h2>
          <p className="text-gray-500">Análise da semana {formatWeekRange()}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={goToPreviousWeek}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium"
          >
            ← Anterior
          </button>
          <button
            onClick={goToCurrentWeek}
            className="px-4 py-2 bg-purple-100 text-purple-700 hover:bg-purple-200 rounded-lg font-medium"
          >
            Semana Atual
          </button>
          <button
            onClick={goToNextWeek}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium"
          >
            Próxima →
          </button>
        </div>
      </header>

      {/* Stats Cards with Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-blue-100">
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="text-sm font-medium text-gray-500">Refeições Servidas</p>
              <h3 className="text-3xl font-bold text-blue-600 mt-2">{stats.totalStudents}</h3>
            </div>
            <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
              <Users className="w-6 h-6" />
            </div>
          </div>
          {previousWeekStats.totalStudents > 0 && (
            <div className="flex items-center gap-1 text-sm">
              {calculateChange(stats.totalStudents, previousWeekStats.totalStudents) >= 0 ? (
                <TrendingUp className="w-4 h-4 text-green-600" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-600" />
              )}
              <span className={calculateChange(stats.totalStudents, previousWeekStats.totalStudents) >= 0 ? 'text-green-600' : 'text-red-600'}>
                {Math.abs(calculateChange(stats.totalStudents, previousWeekStats.totalStudents)).toFixed(1)}%
              </span>
              <span className="text-gray-500 ml-1">vs semana anterior</span>
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-red-100">
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Consumido</p>
              <h3 className="text-3xl font-bold text-red-600 mt-2">{stats.totalConsumed.toFixed(1)} kg</h3>
            </div>
            <div className="p-3 bg-red-100 text-red-600 rounded-xl">
              <TrendingDown className="w-6 h-6" />
            </div>
          </div>
          {previousWeekStats.totalConsumed > 0 && (
            <div className="flex items-center gap-1 text-sm">
              {calculateChange(stats.totalConsumed, previousWeekStats.totalConsumed) >= 0 ? (
                <TrendingUp className="w-4 h-4 text-green-600" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-600" />
              )}
              <span className={calculateChange(stats.totalConsumed, previousWeekStats.totalConsumed) >= 0 ? 'text-green-600' : 'text-red-600'}>
                {Math.abs(calculateChange(stats.totalConsumed, previousWeekStats.totalConsumed)).toFixed(1)}%
              </span>
              <span className="text-gray-500 ml-1">vs semana anterior</span>
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-green-100">
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Recebido</p>
              <h3 className="text-3xl font-bold text-green-600 mt-2">{stats.totalReceived.toFixed(1)} kg</h3>
            </div>
            <div className="p-3 bg-green-100 text-green-600 rounded-xl">
              <Package className="w-6 h-6" />
            </div>
          </div>
          <p className="text-xs text-gray-500">Entradas da semana</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-purple-100">
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="text-sm font-medium text-gray-500">Média Diária</p>
              <h3 className="text-3xl font-bold text-purple-600 mt-2">{Math.round(stats.avgStudentsPerDay)}</h3>
            </div>
            <div className="p-3 bg-purple-100 text-purple-600 rounded-xl">
              <Users className="w-6 h-6" />
            </div>
          </div>
          <p className="text-xs text-gray-500">{stats.daysWithRecords} dias com registro</p>
        </div>
      </div>

      {/* Daily Consumption Chart */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="text-xl font-bold text-gray-800 mb-6">Consumo Diário da Semana</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dailyChartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" />
              <YAxis yAxisId="left" orientation="left" stroke="#8884d8" label={{ value: 'Alunos', angle: -90, position: 'insideLeft' }} />
              <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" label={{ value: 'kg', angle: 90, position: 'insideRight' }} />
              <Tooltip />
              <Legend />
              <Bar yAxisId="left" dataKey="students" fill="#3b82f6" name="Alunos" radius={[8, 8, 0, 0]} />
              <Bar yAxisId="right" dataKey="consumed" fill="#10b981" name="Consumo (kg)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Consumed Items */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Top 5 Mais Consumidos da Semana</h3>
        <div className="space-y-3">
          {stats.topConsumed.length === 0 ? (
            <p className="text-center text-gray-400 py-8">Nenhum consumo registrado nesta semana</p>
          ) : (
            stats.topConsumed.map(([name, amount], index) => (
              <div key={name} className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-white rounded-xl border border-purple-100">
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-bold text-purple-400">#{index + 1}</span>
                  <div>
                    <h4 className="font-semibold text-gray-800">{name}</h4>
                    <p className="text-sm text-gray-500">{amount.toFixed(1)} kg consumidos</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="w-32 bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-purple-600 h-3 rounded-full"
                      style={{ width: `${(amount / stats.topConsumed[0][1]) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Daily Detail Table */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Detalhamento Diário</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-purple-50 text-purple-900">
              <tr>
                <th className="p-4 text-left font-semibold">Dia</th>
                <th className="p-4 text-right font-semibold">Alunos</th>
                <th className="p-4 text-right font-semibold">Consumo (kg)</th>
                <th className="p-4 text-right font-semibold">Entradas (kg)</th>
                <th className="p-4 text-right font-semibold">Saldo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {dailyChartData.map(day => {
                const daySupplies = weekSupplies.filter(s => s.date === day.fullDate);
                const received = daySupplies.reduce((acc, s) => acc + s.amountAdded, 0);
                const balance = received - day.consumed;

                return (
                  <tr key={day.fullDate} className="hover:bg-gray-50">
                    <td className="p-4">
                      <div>
                        <div className="font-medium text-gray-800">{day.date}</div>
                        <div className="text-sm text-gray-500">
                          {new Date(day.fullDate + 'T12:00:00').toLocaleDateString('pt-BR')}
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-right font-mono">{day.students || '-'}</td>
                    <td className="p-4 text-right font-mono text-red-600">
                      {day.consumed > 0 ? `${day.consumed.toFixed(1)}` : '-'}
                    </td>
                    <td className="p-4 text-right font-mono text-green-600">
                      {received > 0 ? `${received.toFixed(1)}` : '-'}
                    </td>
                    <td className="p-4 text-right font-mono">
                      <span className={balance > 0 ? 'text-green-600' : balance < 0 ? 'text-red-600' : 'text-gray-400'}>
                        {balance !== 0 ? (balance > 0 ? '+' : '') + balance.toFixed(1) : '-'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
