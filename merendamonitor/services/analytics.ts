import { Ingredient, ConsumptionLog, SupplyLog } from '../types';
import { DailyReport, WeeklyReport, MonthlyReport, PeriodStats } from '../types-extended';

/**
 * Calculate daily statistics for a specific date
 */
export const calculateDailyStats = (
  date: string,
  logs: ConsumptionLog[],
  supplyLogs: SupplyLog[]
): DailyReport => {
  const dayLogs = logs.filter(log => log.date === date);
  const daySupplies = supplyLogs.filter(log => log.date === date);

  const studentsServed = dayLogs.reduce((acc, log) => acc + log.studentCount, 0);
  const totalCost = 0; // Will be enhanced with cost tracking

  const ingredientsUsed = dayLogs.map(log => ({
    id: log.ingredientId,
    name: log.ingredientName,
    amount: log.amountUsed,
    cost: 0 // Will be enhanced with cost tracking
  }));

  return {
    date,
    studentsServed,
    recipesServed: [],
    totalCost,
    ingredientsUsed,
    wasteAmount: 0,
    wasteCost: 0
  };
};

/**
 * Calculate weekly statistics
 */
export const calculateWeeklyStats = (
  weekStart: string,
  logs: ConsumptionLog[],
  supplyLogs: SupplyLog[]
): WeeklyReport => {
  const start = new Date(weekStart + 'T12:00:00');
  const weekDates: string[] = [];
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    weekDates.push(date.toISOString().split('T')[0]);
  }

  const weekEnd = weekDates[weekDates.length - 1];
  const weekLogs = logs.filter(log => weekDates.includes(log.date));

  const totalStudents = weekLogs.reduce((acc, log) => acc + log.studentCount, 0);
  const totalCost = 0;
  const daysWithRecords = new Set(weekLogs.map(log => log.date)).size;
  const averageStudentsPerDay = daysWithRecords > 0 ? totalStudents / daysWithRecords : 0;

  // Top ingredients
  const consumptionMap: Record<string, number> = {};
  weekLogs.forEach(log => {
    consumptionMap[log.ingredientName] = (consumptionMap[log.ingredientName] || 0) + log.amountUsed;
  });

  const topIngredients = Object.entries(consumptionMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, amount]) => ({ name, amount }));

  return {
    weekStart,
    weekEnd,
    totalStudents,
    totalCost,
    averageStudentsPerDay,
    averageCostPerStudent: 0,
    topIngredients,
    totalWaste: 0,
    wasteCost: 0,
    daysWithRecords
  };
};

/**
 * Calculate monthly statistics
 */
export const calculateMonthlyStats = (
  year: number,
  month: number,
  logs: ConsumptionLog[],
  supplyLogs: SupplyLog[],
  inventory: Ingredient[]
): MonthlyReport => {
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const endDate = new Date(year, month, 0).toISOString().split('T')[0];
  
  const monthLogs = logs.filter(log => log.date >= startDate && log.date <= endDate);
  const monthSupplies = supplyLogs.filter(log => log.date >= startDate && log.date <= endDate);

  const totalStudents = monthLogs.reduce((acc, log) => acc + log.studentCount, 0);
  const totalConsumed = monthLogs.reduce((acc, log) => acc + log.amountUsed, 0);
  const totalReceived = monthSupplies.reduce((acc, log) => acc + log.amountAdded, 0);
  const schoolDays = new Date(year, month, 0).getDate();
  const operatingDays = new Set(monthLogs.map(log => log.date)).size;

  // Top ingredients
  const consumptionMap: Record<string, { amount: number; cost: number }> = {};
  monthLogs.forEach(log => {
    if (!consumptionMap[log.ingredientName]) {
      consumptionMap[log.ingredientName] = { amount: 0, cost: 0 };
    }
    consumptionMap[log.ingredientName].amount += log.amountUsed;
  });

  const topIngredients = Object.entries(consumptionMap)
    .sort((a, b) => b[1].amount - a[1].amount)
    .slice(0, 10)
    .map(([name, data]) => ({ name, amount: data.amount, cost: data.cost }));

  // Stock status
  const stockStatus = inventory.map(item => ({
    name: item.name,
    status: item.currentStock <= item.minThreshold ? 'critical' : 'ok',
    daysRemaining: 0 // Will be calculated by forecasting service
  }));

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  return {
    year,
    month,
    monthName: monthNames[month - 1],
    totalStudents,
    totalCost: 0,
    averageCostPerStudent: 0,
    schoolDays,
    operatingDays,
    topRecipes: [],
    topIngredients,
    stockStatus,
    wasteAmount: 0,
    wasteCost: 0,
    wastePercentage: 0
  };
};

/**
 * Compare two periods
 */
export const comparePeriods = (
  period1Start: string,
  period1End: string,
  period2Start: string,
  period2End: string,
  logs: ConsumptionLog[]
): { period1: PeriodStats; period2: PeriodStats; changes: Record<string, number> } => {
  const calculatePeriodStats = (start: string, end: string): PeriodStats => {
    const periodLogs = logs.filter(log => log.date >= start && log.date <= end);
    const totalStudents = periodLogs.reduce((acc, log) => acc + log.studentCount, 0);
    const daysWithRecords = new Set(periodLogs.map(log => log.date)).size;

    return {
      period: `${start} a ${end}`,
      totalStudents,
      totalCost: 0,
      averageCostPerStudent: 0,
      totalMeals: totalStudents,
      averageMealsPerDay: daysWithRecords > 0 ? totalStudents / daysWithRecords : 0,
      wastePercentage: 0
    };
  };

  const period1 = calculatePeriodStats(period1Start, period1End);
  const period2 = calculatePeriodStats(period2Start, period2End);

  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  const changes = {
    students: calculateChange(period1.totalStudents, period2.totalStudents),
    cost: calculateChange(period1.totalCost, period2.totalCost),
    mealsPerDay: calculateChange(period1.averageMealsPerDay, period2.averageMealsPerDay)
  };

  return { period1, period2, changes };
};

/**
 * Predict future consumption based on historical data
 */
export const predictFutureConsumption = (
  ingredientId: string,
  logs: ConsumptionLog[],
  daysAhead: number = 30
): { daily: number; total: number; confidence: 'high' | 'medium' | 'low' } => {
  const ingredientLogs = logs.filter(log => log.ingredientId === ingredientId);
  
  if (ingredientLogs.length < 5) {
    return { daily: 0, total: 0, confidence: 'low' };
  }

  // Calculate average daily consumption
  const totalConsumed = ingredientLogs.reduce((acc, log) => acc + log.amountUsed, 0);
  const uniqueDays = new Set(ingredientLogs.map(log => log.date)).size;
  const dailyAverage = totalConsumed / uniqueDays;

  const confidence = ingredientLogs.length > 20 ? 'high' : ingredientLogs.length > 10 ? 'medium' : 'low';

  return {
    daily: dailyAverage,
    total: dailyAverage * daysAhead,
    confidence
  };
};

/**
 * Calculate waste trends
 */
export const calculateWasteTrends = (
  wasteAmount: number,
  totalConsumed: number
): { percentage: number; trend: 'improving' | 'stable' | 'worsening'; status: 'good' | 'acceptable' | 'high' } => {
  const percentage = totalConsumed > 0 ? (wasteAmount / totalConsumed) * 100 : 0;

  let status: 'good' | 'acceptable' | 'high';
  if (percentage < 5) status = 'good';
  else if (percentage < 10) status = 'acceptable';
  else status = 'high';

  return {
    percentage,
    trend: 'stable', // Would need historical data to determine
    status
  };
};

/**
 * Calculate cost efficiency
 */
export const calculateCostEfficiency = (
  totalCost: number,
  totalStudents: number,
  targetCostPerStudent: number = 2.5
): { costPerStudent: number; efficiency: number; status: 'excellent' | 'good' | 'needs_improvement' } => {
  const costPerStudent = totalStudents > 0 ? totalCost / totalStudents : 0;
  const efficiency = targetCostPerStudent > 0 ? (targetCostPerStudent / costPerStudent) * 100 : 0;

  let status: 'excellent' | 'good' | 'needs_improvement';
  if (costPerStudent <= targetCostPerStudent) status = 'excellent';
  else if (costPerStudent <= targetCostPerStudent * 1.2) status = 'good';
  else status = 'needs_improvement';

  return { costPerStudent, efficiency, status };
};

/**
 * Get performance insights
 */
export const getPerformanceInsights = (
  logs: ConsumptionLog[],
  supplyLogs: SupplyLog[],
  inventory: Ingredient[]
): string[] => {
  const insights: string[] = [];

  // Check data quality
  const today = new Date();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(today.getDate() - 7);
  const recentLogs = logs.filter(log => new Date(log.date) >= sevenDaysAgo);

  if (recentLogs.length === 0) {
    insights.push('⚠️ Nenhum registro nos últimos 7 dias. Lembre-se de registrar diariamente.');
  }

  // Check low stock
  const lowStock = inventory.filter(i => i.currentStock <= i.minThreshold);
  if (lowStock.length > 0) {
    insights.push(`🚨 ${lowStock.length} itens com estoque crítico precisam de reposição.`);
  }

  // Check balanced consumption
  const totalConsumed = logs.reduce((acc, log) => acc + log.amountUsed, 0);
  const totalReceived = supplyLogs.reduce((acc, log) => acc + log.amountAdded, 0);
  const balance = totalReceived - totalConsumed;

  if (balance < 0) {
    insights.push('📉 Consumo total maior que entradas. Verifique registros de abastecimento.');
  } else if (balance > totalReceived * 0.5) {
    insights.push('📈 Alto saldo de estoque. Considere otimizar compras para reduzir desperdício.');
  }

  return insights;
};
