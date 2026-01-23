import { Ingredient, ConsumptionLog, SupplyLog } from '../types';
import { Notification, DBNotification } from '../types-extended';
import { calculateStockForecast } from './forecasting';
import { supabase } from './supabase';

/**
 * Check for low stock items
 */
export const checkLowStock = (inventory: Ingredient[]): Notification[] => {
  const notifications: Notification[] = [];

  inventory.forEach(item => {
    if (item.currentStock <= 0) {
      notifications.push({
        id: `low-stock-${item.id}-${Date.now()}`,
        type: 'low_stock',
        severity: 'critical',
        title: `Estoque Esgotado: ${item.name}`,
        message: `O item ${item.name} está com estoque ZERO. Providencie reabastecimento urgente.`,
        relatedId: item.id,
        relatedType: 'ingredient',
        read: false,
        createdAt: new Date().toISOString()
      });
    } else if (item.currentStock <= item.minThreshold) {
      notifications.push({
        id: `low-stock-${item.id}-${Date.now()}`,
        type: 'low_stock',
        severity: 'high',
        title: `Estoque Baixo: ${item.name}`,
        message: `O item ${item.name} está abaixo do mínimo (${item.currentStock}kg / ${item.minThreshold}kg). Planeje reabastecimento.`,
        relatedId: item.id,
        relatedType: 'ingredient',
        read: false,
        createdAt: new Date().toISOString()
      });
    }
  });

  return notifications;
};

/**
 * Check for items expiring soon
 */
export const checkExpiringItems = (supplyLogs: SupplyLog[], daysAhead: number = 7): Notification[] => {
  const notifications: Notification[] = [];
  const today = new Date();
  const futureDate = new Date();
  futureDate.setDate(today.getDate() + daysAhead);

  supplyLogs.forEach(log => {
    if (!log.expirationDate) return;

    const expirationDate = new Date(log.expirationDate);
    const daysToExpiration = Math.ceil((expirationDate.getTime() - today.getTime()) / (1000 * 3600 * 24));

    if (daysToExpiration < 0) {
      notifications.push({
        id: `expired-${log.id}-${Date.now()}`,
        type: 'expiring',
        severity: 'critical',
        title: `Produto Vencido: ${log.ingredientName}`,
        message: `${log.ingredientName} (${log.amountAdded}kg) venceu em ${new Date(log.expirationDate).toLocaleDateString('pt-BR')}. Descarte o produto e registre o desperdício.`,
        relatedId: log.id,
        relatedType: 'supply',
        read: false,
        createdAt: new Date().toISOString()
      });
    } else if (daysToExpiration <= 3) {
      notifications.push({
        id: `expiring-${log.id}-${Date.now()}`,
        type: 'expiring',
        severity: 'high',
        title: `Vencendo em ${daysToExpiration} dia(s): ${log.ingredientName}`,
        message: `${log.ingredientName} (${log.amountAdded}kg) vence em ${new Date(log.expirationDate).toLocaleDateString('pt-BR')}. Use prioritariamente.`,
        relatedId: log.id,
        relatedType: 'supply',
        read: false,
        createdAt: new Date().toISOString()
      });
    } else if (daysToExpiration <= daysAhead) {
      notifications.push({
        id: `expiring-${log.id}-${Date.now()}`,
        type: 'expiring',
        severity: 'medium',
        title: `Vence em breve: ${log.ingredientName}`,
        message: `${log.ingredientName} vence em ${daysToExpiration} dias (${new Date(log.expirationDate).toLocaleDateString('pt-BR')}).`,
        relatedId: log.id,
        relatedType: 'supply',
        read: false,
        createdAt: new Date().toISOString()
      });
    }
  });

  return notifications;
};

/**
 * Check for budget alerts
 */
export const checkBudgetLimit = (
  currentSpending: number,
  budgetLimit: number,
  month: string
): Notification[] => {
  const notifications: Notification[] = [];
  const utilizationPercentage = (currentSpending / budgetLimit) * 100;

  if (utilizationPercentage >= 100) {
    notifications.push({
      id: `budget-exceeded-${month}`,
      type: 'budget_alert',
      severity: 'critical',
      title: 'Orçamento Excedido',
      message: `O orçamento de ${month} foi excedido. Gasto atual: R$ ${currentSpending.toFixed(2)} (${utilizationPercentage.toFixed(1)}% do orçamento).`,
      read: false,
      createdAt: new Date().toISOString()
    });
  } else if (utilizationPercentage >= 90) {
    notifications.push({
      id: `budget-warning-${month}`,
      type: 'budget_alert',
      severity: 'high',
      title: 'Orçamento Próximo do Limite',
      message: `${utilizationPercentage.toFixed(1)}% do orçamento de ${month} já foi utilizado (R$ ${currentSpending.toFixed(2)} de R$ ${budgetLimit.toFixed(2)}).`,
      read: false,
      createdAt: new Date().toISOString()
    });
  } else if (utilizationPercentage >= 75) {
    notifications.push({
      id: `budget-info-${month}`,
      type: 'budget_alert',
      severity: 'medium',
      title: 'Acompanhamento de Orçamento',
      message: `${utilizationPercentage.toFixed(1)}% do orçamento de ${month} utilizado.`,
      read: false,
      createdAt: new Date().toISOString()
    });
  }

  return notifications;
};

/**
 * Check waste threshold
 */
export const checkWasteThreshold = (
  wasteAmount: number,
  totalConsumed: number,
  threshold: number = 10
): Notification[] => {
  const notifications: Notification[] = [];

  if (totalConsumed === 0) return notifications;

  const wastePercentage = (wasteAmount / totalConsumed) * 100;

  if (wastePercentage >= threshold * 2) {
    notifications.push({
      id: `waste-critical-${Date.now()}`,
      type: 'waste_alert',
      severity: 'critical',
      title: 'Desperdício Crítico',
      message: `Taxa de desperdício está em ${wastePercentage.toFixed(1)}%, muito acima da meta de ${threshold}%. Revise processos urgentemente.`,
      read: false,
      createdAt: new Date().toISOString()
    });
  } else if (wastePercentage >= threshold) {
    notifications.push({
      id: `waste-high-${Date.now()}`,
      type: 'waste_alert',
      severity: 'high',
      title: 'Desperdício Acima da Meta',
      message: `Taxa de desperdício está em ${wastePercentage.toFixed(1)}%, acima da meta de ${threshold}%.`,
      read: false,
      createdAt: new Date().toISOString()
    });
  }

  return notifications;
};

/**
 * Check stock forecast
 */
export const checkStockForecast = (
  inventory: Ingredient[],
  logs: ConsumptionLog[]
): Notification[] => {
  const notifications: Notification[] = [];
  const forecasts = calculateStockForecast(inventory, logs);

  forecasts.forEach(forecast => {
    if (forecast.status === 'critical' && forecast.averageDailyUsage > 0) {
      notifications.push({
        id: `forecast-critical-${forecast.ingredientId}`,
        type: 'low_stock',
        severity: 'critical',
        title: `${forecast.ingredientName} acabará em breve`,
        message: `Com base no consumo médio, ${forecast.ingredientName} durará apenas ${Math.floor(forecast.daysRemaining)} dias. Providencie compra urgente.`,
        relatedId: forecast.ingredientId,
        relatedType: 'ingredient',
        read: false,
        createdAt: new Date().toISOString()
      });
    } else if (!forecast.monthlySufficiency && forecast.averageDailyUsage > 0) {
      notifications.push({
        id: `forecast-monthly-${forecast.ingredientId}`,
        type: 'low_stock',
        severity: 'medium',
        title: `${forecast.ingredientName} não durará o mês`,
        message: `Estoque de ${forecast.ingredientName} não é suficiente até o fim do mês. Planeje reabastecimento.`,
        relatedId: forecast.ingredientId,
        relatedType: 'ingredient',
        read: false,
        createdAt: new Date().toISOString()
      });
    }
  });

  return notifications;
};

/**
 * Get all notifications
 */
export const getAllNotifications = (
  inventory: Ingredient[],
  logs: ConsumptionLog[],
  supplyLogs: SupplyLog[],
  options?: {
    budgetLimit?: number;
    wasteThreshold?: number;
    currentSpending?: number;
    wasteAmount?: number;
    totalConsumed?: number;
  }
): Notification[] => {
  let notifications: Notification[] = [];

  // Low stock alerts
  notifications = notifications.concat(checkLowStock(inventory));

  // Expiring items
  notifications = notifications.concat(checkExpiringItems(supplyLogs));

  // Stock forecast
  notifications = notifications.concat(checkStockForecast(inventory, logs));

  // Budget alerts
  if (options?.budgetLimit && options?.currentSpending !== undefined) {
    const today = new Date();
    const month = today.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    notifications = notifications.concat(
      checkBudgetLimit(options.currentSpending, options.budgetLimit, month)
    );
  }

  // Waste alerts
  if (options?.wasteAmount !== undefined && options?.totalConsumed !== undefined) {
    notifications = notifications.concat(
      checkWasteThreshold(options.wasteAmount, options.totalConsumed, options.wasteThreshold)
    );
  }

  // Sort by severity
  const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  notifications.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  // Remove duplicates
  const seen = new Set();
  notifications = notifications.filter(notif => {
    const key = `${notif.type}-${notif.relatedId || notif.title}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return notifications;
};

/**
 * Format notification for display
 */
export const formatNotification = (notification: Notification): string => {
  const icons: Record<string, string> = {
    low_stock: '📦',
    expiring: '⏰',
    waste_alert: '🗑️',
    budget_alert: '💰',
    attendance_alert: '👩‍🍳',
    general: 'ℹ️'
  };

  return `${icons[notification.type] || 'ℹ️'} ${notification.title}: ${notification.message}`;
};

/**
 * Fetch notifications from database (attendance alerts, etc.)
 */
export const fetchDatabaseNotifications = async (): Promise<Notification[]> => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.warn('Error fetching database notifications:', error.message);
      return [];
    }

    if (!data) return [];

    // Convert DBNotification to Notification format
    return data.map((dbNotif: DBNotification) => ({
      id: dbNotif.id,
      type: (dbNotif.type || 'general') as Notification['type'],
      severity: getSeverityFromType(dbNotif.type),
      title: dbNotif.title,
      message: dbNotif.message,
      metadata: dbNotif.metadata,
      read: dbNotif.is_read,
      createdAt: dbNotif.created_at
    }));
  } catch (error) {
    console.warn('Failed to fetch database notifications:', error);
    return [];
  }
};

/**
 * Get severity based on notification type
 */
const getSeverityFromType = (type: string): Notification['severity'] => {
  switch (type) {
    case 'attendance_alert':
      return 'medium';
    case 'low_stock':
    case 'waste_alert':
      return 'high';
    case 'expiring':
      return 'critical';
    default:
      return 'low';
  }
};

/**
 * Mark notification as read in database
 */
export const markNotificationAsRead = async (notificationId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    if (error) {
      console.error('Error marking notification as read:', error.message);
      return false;
    }
    return true;
  } catch (error) {
    console.error('Failed to mark notification as read:', error);
    return false;
  }
};

/**
 * Mark all notifications as read in database
 */
export const markAllNotificationsAsRead = async (): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('is_read', false);

    if (error) {
      console.error('Error marking all notifications as read:', error.message);
      return false;
    }
    return true;
  } catch (error) {
    console.error('Failed to mark all notifications as read:', error);
    return false;
  }
};

/**
 * Get today's attendance summary for kitchen
 */
export const getTodayAttendanceSummary = async (): Promise<{
  totalStudents: number;
  byShift: { shift: string; count: number }[];
  byClassroom: { name: string; count: number }[];
}> => {
  const today = new Date().toISOString().split('T')[0];

  try {
    const { data, error } = await supabase
      .from('daily_attendance')
      .select(`
        students_present,
        shift,
        classrooms (name)
      `)
      .eq('attendance_date', today);

    if (error) {
      console.warn('Error fetching attendance summary:', error.message);
      return { totalStudents: 0, byShift: [], byClassroom: [] };
    }

    if (!data || data.length === 0) {
      return { totalStudents: 0, byShift: [], byClassroom: [] };
    }

    const totalStudents = data.reduce((sum, record) => sum + (record.students_present || 0), 0);

    // Group by shift
    const shiftMap = new Map<string, number>();
    data.forEach(record => {
      const current = shiftMap.get(record.shift) || 0;
      shiftMap.set(record.shift, current + (record.students_present || 0));
    });
    const byShift = Array.from(shiftMap.entries()).map(([shift, count]) => ({ shift, count }));

    // Group by classroom
    const classroomMap = new Map<string, number>();
    data.forEach(record => {
      const classroomName = (record.classrooms as any)?.name || 'Desconhecida';
      const current = classroomMap.get(classroomName) || 0;
      classroomMap.set(classroomName, current + (record.students_present || 0));
    });
    const byClassroom = Array.from(classroomMap.entries()).map(([name, count]) => ({ name, count }));

    return { totalStudents, byShift, byClassroom };
  } catch (error) {
    console.warn('Failed to fetch attendance summary:', error);
    return { totalStudents: 0, byShift: [], byClassroom: [] };
  }
};

