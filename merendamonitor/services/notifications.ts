import { Ingredient, ConsumptionLog, SupplyLog } from '../types';
import { Notification } from '../types-extended';
import { calculateStockForecast } from './forecasting';

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
  const icons = {
    low_stock: '📦',
    expiring: '⏰',
    waste_alert: '🗑️',
    budget_alert: '💰',
    general: 'ℹ️'
  };

  return `${icons[notification.type]} ${notification.title}: ${notification.message}`;
};
