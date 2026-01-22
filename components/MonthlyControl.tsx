import React, { useState, useMemo } from 'react';
import { Ingredient, ConsumptionLog, SupplyLog } from '../types';
import { Calendar, TrendingUp, TrendingDown, DollarSign, Users, Package, AlertTriangle } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface MonthlyControlProps {
  inventory: Ingredient[];
  logs: ConsumptionLog[];
  supplyLogs: SupplyLog[];
}

export const MonthlyControl: React.FC<MonthlyControlProps> = ({ inventory, logs, supplyLogs }) => {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  });

  // Get month start and end dates
  const monthDates = useMemo(() => {
    const [year, month] = currentMonth.split('-').map(Number);
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0);
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0],
      year,
      month,
      daysInMonth: end.getDate()
    };
  }, [currentMonth]);

  // Filter data for current month
  const monthLogs = useMemo(() => {
    return logs.filter(log => log.date >= monthDates.start && log.date <= monthDates.end);
  }, [logs, monthDates]);

  const monthSupplies = useMemo(() => {
    return supplyLogs.filter(log => log.date >= monthDates.start && log.date <= monthDates.end);
  }, [supplyLogs, monthDates]);

  // Calculate comprehensive stats
  const stats = useMemo(() => {
    const totalStudents = monthLogs.reduce((acc, log) => acc + log.studentCount, 0);
    const totalConsumed = monthLogs.reduce((acc, log) => acc + log.amountUsed, 0);
    const totalReceived = monthSupplies.reduce((acc, log) => acc + log.amountAdded, 0);
    const daysWithRecords = new Set(monthLogs.map(log => log.date)).size;
    const avgStudentsPerDay = daysWithRecords > 0 ? totalStudents / daysWithRecords : 0;

    // Consumption by category
    const consumptionByCategory: Record<string, number> = {};
    monthLogs.forEach(log => {
      const ingredient = inventory.find(i => i.id === log.ingredientId);
      const category = ingredient?.category || 'Outros';
      consumptionByCategory[category] = (consumptionByCategory[category] || 0) + log.amountUsed;
    });

    // Top ingredients
    const consumptionByIngredient: Record<string, number> = {};
    monthLogs.forEach(log => {
      consumptionByIngredient[log.ingredientName] = 
        (consumptionByIngredient[log.ingredientName] || 0) + log.amountUsed;
    });

    const topIngredients = Object.entries(consumptionByIngredient)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    // Daily trend
    const dailyConsumption: Record<string, { students: number; consumed: number }> = {};
    monthLogs.forEach(log => {
      if (!dailyConsumption[log.date]) {
        dailyConsumption[log.date] = { students: 0, consumed: 0 };
      }
      dailyConsumption[log.date].students += log.studentCount;
      dailyConsumption[log.date].consumed += log.amountUsed;
    });

    return {
      totalStudents,
      totalConsumed,
      totalReceived,
      daysWithRecords,
      avgStudentsPerDay,
      consumptionByCategory,
      topIngredients,
      dailyConsumption,
      balance: totalReceived - totalConsumed
    };
  }, [monthLogs, monthSupplies, inventory]);

  // Previous month comparison
  const previousMonthStats = useMemo(() => {
    const [year, month] = currentMonth.split('-').map(Number);
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    const prevStart = `${prevYear}-${String(prevMonth).padStart(2, '0')}-01`;
    const prevEnd = new Date(prevYear, prevMonth, 0).toISOString().split('T')[0];

    const prevLogs = logs.filter(log => log.date >= prevStart && log.date <= prevEnd);
    const totalStudents = prevLogs.reduce((acc, log) => acc + log.studentCount, 0);
    const totalConsumed = prevLogs.reduce((acc, log) => acc + log.amountUsed, 0);

    return { totalStudents, totalConsumed };
  }, [currentMonth, logs]);

  // Chart data
  const categoryChartData = useMemo(() => {
    return Object.entries(stats.consumptionByCategory).map(([category, amount]) => ({
      name: category,
      value: amount
    }));
  }, [stats.consumptionByCategory]);

  const dailyTrendData = useMemo(() => {
    const data = [];
    for (let day = 1; day <= monthDates.daysInMonth; day++) {
      const date = `${monthDates.year}-${String(monthDates.month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayData = stats.dailyConsumption[date];
      data.push({
        day,
        date,
        students: dayData?.students || 0,
        consumed: dayData?.consumed || 0
      });
    }
    return data;
  }, [stats.dailyConsumption, monthDates]);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

  const goToPreviousMonth = () => {
    const [year, month] = currentMonth.split('-').map(Number);
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    setCurrentMonth(`${prevYear}-${String(prevMonth).padStart(2, '0')}`);
  };

  const goToNextMonth = () => {
    const [year, month] = currentMonth.split('-').map(Number);
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;
    setCurrentMonth(`${nextYear}-${String(nextMonth).padStart(2, '0')}`);
  };

  const goToCurrentMonth = () => {
    const today = new Date();
    setCurrentMonth(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`);
  };

  const getMonthName = () => {
    const [year, month] = currentMonth.split('-').map(Number);
    return new Date(year, month - 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
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
            <Calendar className="text-indigo-600" />
            Controle Mensal
          </h2>
          <p className="text-gray-500 capitalize">Análise completa de {getMonthName()}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={goToPreviousMonth}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium"
          >
            ← Anterior
          </button>
          <button
            onClick={goToCurrentMonth}
            className="px-4 py-2 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 rounded-lg font-medium"
          >
            Mês Atual
          </button>
          <button
            onClick={goToNextMonth}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium"
          >
            Próximo →
          </button>
        </div>
      </header>

      {/* Executive Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-2xl shadow-lg">
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="text-blue-100 text-sm font-medium">Total de Refeições</p>
              <h3 className="text-4xl font-bold mt-2">{stats.totalStudents.toLocaleString()}</h3>
            </div>
            <Users className="w-12 h-12 opacity-50" />
          </div>
          {previousMonthStats.totalStudents > 0 && (
            <div className="flex items-center gap-1 text-sm mt-3">
              {calculateChange(stats.totalStudents, previousMonthStats.totalStudents) >= 0 ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              <span>
                {Math.abs(calculateChange(stats.totalStudents, previousMonthStats.totalStudents)).toFixed(1)}% vs mês anterior
              </span>
            </div>
          )}
        </div>

        <div className="bg-gradient-to-br from-red-500 to-red-600 text-white p-6 rounded-2xl shadow-lg">
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="text-red-100 text-sm font-medium">Total Consumido</p>
              <h3 className="text-4xl font-bold mt-2">{stats.totalConsumed.toFixed(0)} <span className="text-xl">kg</span></h3>
            </div>
            <TrendingDown className="w-12 h-12 opacity-50" />
          </div>
          {previousMonthStats.totalConsumed > 0 && (
            <div className="flex items-center gap-1 text-sm mt-3">
              {calculateChange(stats.totalConsumed, previousMonthStats.totalConsumed) >= 0 ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              <span>
                {Math.abs(calculateChange(stats.totalConsumed, previousMonthStats.totalConsumed)).toFixed(1)}% vs mês anterior
              </span>
            </div>
          )}
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-2xl shadow-lg">
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="text-green-100 text-sm font-medium">Total Recebido</p>
              <h3 className="text-4xl font-bold mt-2">{stats.totalReceived.toFixed(0)} <span className="text-xl">kg</span></h3>
            </div>
            <Package className="w-12 h-12 opacity-50" />
          </div>
          <div className="text-sm mt-3">
            <span className={stats.balance >= 0 ? 'text-green-100' : 'text-red-200'}>
              Saldo: {stats.balance >= 0 ? '+' : ''}{stats.balance.toFixed(1)} kg
            </span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-2xl shadow-lg">
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="text-purple-100 text-sm font-medium">Média Diária</p>
              <h3 className="text-4xl font-bold mt-2">{Math.round(stats.avgStudentsPerDay)}</h3>
            </div>
            <Calendar className="w-12 h-12 opacity-50" />
          </div>
          <div className="text-sm mt-3">
            <span>{stats.daysWithRecords} de {monthDates.daysInMonth} dias com registro</span>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Trend */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Tendência Diária</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="students" stroke="#3b82f6" strokeWidth={2} name="Alunos" />
                <Line yAxisId="right" type="monotone" dataKey="consumed" stroke="#10b981" strokeWidth={2} name="Consumo (kg)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Consumption by Category */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Consumo por Categoria</h3>
          <div className="h-80">
            {categoryChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">
                Sem dados de consumo
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Top Ingredients */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Top 10 Ingredientes Mais Consumidos</h3>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.topIngredients.map(([name, amount]) => ({ name, amount }))} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis type="category" dataKey="name" width={150} />
              <Tooltip />
              <Bar dataKey="amount" fill="#8b5cf6" radius={[0, 8, 8, 0]} name="Consumo (kg)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Performance Summary */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="text-xl font-bold text-gray-800 mb-6">Resumo Executivo</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="border-l-4 border-blue-500 pl-4">
            <h4 className="font-semibold text-gray-700 mb-2">Taxa de Ocupação</h4>
            <p className="text-3xl font-bold text-blue-600">
              {((stats.daysWithRecords / monthDates.daysInMonth) * 100).toFixed(1)}%
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {stats.daysWithRecords} de {monthDates.daysInMonth} dias operacionais
            </p>
          </div>

          <div className="border-l-4 border-green-500 pl-4">
            <h4 className="font-semibold text-gray-700 mb-2">Eficiência de Estoque</h4>
            <p className="text-3xl font-bold text-green-600">
              {stats.totalReceived > 0 ? ((stats.totalConsumed / stats.totalReceived) * 100).toFixed(1) : 0}%
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Utilização do estoque recebido
            </p>
          </div>

          <div className="border-l-4 border-purple-500 pl-4">
            <h4 className="font-semibold text-gray-700 mb-2">Consumo Médio por Aluno</h4>
            <p className="text-3xl font-bold text-purple-600">
              {stats.totalStudents > 0 ? ((stats.totalConsumed / stats.totalStudents) * 1000).toFixed(0) : 0} <span className="text-lg">g</span>
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Por refeição servida
            </p>
          </div>
        </div>
      </div>

      {/* Alerts and Recommendations */}
      {stats.daysWithRecords < monthDates.daysInMonth / 2 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-yellow-800 font-medium">Atenção: Poucos Registros</p>
            <p className="text-yellow-700 text-sm">
              Apenas {stats.daysWithRecords} dias com registros neste mês. 
              Certifique-se de registrar diariamente para análises mais precisas.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
