import { ConsumptionLog, Ingredient } from '../types';

export interface StockForecast {
    ingredientId: string;
    ingredientName: string;
    averageDailyUsage: number; // kg per day (last 30 days)
    daysRemaining: number;
    monthlySufficiency: boolean; // true if it lasts until end of current month
    projectedStockoutDate: Date | null;
    status: 'critical' | 'warning' | 'safe' | 'abundant';
}

export const calculateStockForecast = (
    inventory: Ingredient[],
    consumptionLogs: ConsumptionLog[]
): StockForecast[] => {
    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 30);

    // Helper to ensure date string comparison works
    const isWithinLast30Days = (dateStr: string) => {
        const date = new Date(dateStr + 'T12:00:00'); // Normalize time
        return date >= thirtyDaysAgo && date <= now;
    };

    // 1. Calculate usage per ingredient in last 30 days
    const usageMap: Record<string, number> = {};

    consumptionLogs.forEach(log => {
        if (isWithinLast30Days(log.date)) {
            usageMap[log.ingredientId] = (usageMap[log.ingredientId] || 0) + log.amountUsed;
        }
    });

    const daysInPeriod = 30; // Moving window
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const daysUntilMonthEnd = Math.max(0, Math.ceil((currentMonthEnd.getTime() - now.getTime()) / (1000 * 3600 * 24)));

    return inventory.map(item => {
        const totalUsed30d = usageMap[item.id] || 0;
        const averageDailyUsage = totalUsed30d / daysInPeriod;

        let daysRemaining = Infinity;
        let projectedStockoutDate: Date | null = null;

        if (averageDailyUsage > 0) {
            daysRemaining = item.currentStock / averageDailyUsage;

            const stockoutDate = new Date();
            stockoutDate.setDate(now.getDate() + Math.ceil(daysRemaining));
            projectedStockoutDate = stockoutDate;
        }

        // Determine status
        let status: StockForecast['status'] = 'safe';
        if (item.currentStock === 0) {
            status = 'critical';
        } else if (daysRemaining < 7) {
            status = 'critical';
        } else if (daysRemaining < 15) {
            status = 'warning';
        } else if (daysRemaining > 60) {
            status = 'abundant';
        }

        // Check if it lasts until end of month
        // If daysRemaining >= daysUntilMonthEnd, it covers the month.
        const monthlySufficiency = daysRemaining >= daysUntilMonthEnd;

        return {
            ingredientId: item.id,
            ingredientName: item.name,
            averageDailyUsage,
            daysRemaining,
            monthlySufficiency,
            projectedStockoutDate,
            status
        };
    });
};
