// ====================================
// MERENDAMONITOR - TIPOS ESTENDIDOS
// Novos tipos para as novas funcionalidades
// ====================================

// Receitas e Preparos
export interface Recipe {
  id: string;
  name: string;
  category: string;
  servings: number;
  preparationTime?: number;
  instructions?: string;
  costPerServing: number;
  ingredients?: RecipeIngredient[];
}

export interface RecipeIngredient {
  id: string;
  recipeId: string;
  ingredientId: string;
  ingredientName?: string;
  quantityKg: number;
}

// Cardápios Mensais
export interface MonthlyMenu {
  id: string;
  year: number;
  month: number;
  schoolDays: number;
  estimatedStudents: number;
  status: 'draft' | 'approved' | 'executed';
  items?: MenuItem[];
  createdAt?: string;
}

export interface MenuItem {
  id: string;
  menuId: string;
  date: string;
  recipeId?: string;
  recipeName?: string;
  plannedStudents: number;
  actualStudents?: number;
  status: 'planned' | 'executed' | 'cancelled';
  notes?: string;
}

// Desperdícios
export interface WasteLog {
  id: string;
  date: string;
  ingredientId: string;
  ingredientName: string;
  amount: number;
  reason: 'expired' | 'spoiled' | 'leftover' | 'other';
  costImpact: number;
  notes?: string;
  createdAt?: string;
}

// Controle de Custos
export interface CostTracking {
  id: string;
  ingredientId: string;
  ingredientName?: string;
  supplyLogId?: string;
  unitCost: number;
  totalCost: number;
  purchaseDate: string;
  createdAt?: string;
}

// Calendário Escolar
export interface SchoolDay {
  id: string;
  date: string;
  isSchoolDay: boolean;
  eventName?: string;
  expectedAttendanceRate: number; // 0.0 a 1.0
  notes?: string;
}

// Fornecedores
export interface Supplier {
  id: string;
  name: string;
  contact?: string;
  phone?: string;
  email?: string;
  address?: string;
  rating: number;
  isActive: boolean;
  createdAt?: string;
}

// Relatórios Estruturados
export interface DailyReport {
  date: string;
  studentsServed: number;
  recipesServed: Recipe[];
  totalCost: number;
  ingredientsUsed: Array<{
    id: string;
    name: string;
    amount: number;
    cost: number;
  }>;
  wasteAmount: number;
  wasteCost: number;
}

export interface WeeklyReport {
  weekStart: string;
  weekEnd: string;
  totalStudents: number;
  totalCost: number;
  averageStudentsPerDay: number;
  averageCostPerStudent: number;
  topIngredients: Array<{ name: string; amount: number }>;
  totalWaste: number;
  wasteCost: number;
  daysWithRecords: number;
}

export interface MonthlyReport {
  year: number;
  month: number;
  monthName: string;
  totalStudents: number;
  totalCost: number;
  averageCostPerStudent: number;
  schoolDays: number;
  operatingDays: number;
  topRecipes: Array<{ name: string; timesServed: number }>;
  topIngredients: Array<{ name: string; amount: number; cost: number }>;
  stockStatus: Array<{ name: string; status: string; daysRemaining: number }>;
  wasteAmount: number;
  wasteCost: number;
  wastePercentage: number;
  budgetUtilization?: number;
}

// Estatísticas Agregadas
export interface PeriodStats {
  period: string;
  totalStudents: number;
  totalCost: number;
  averageCostPerStudent: number;
  totalMeals: number;
  averageMealsPerDay: number;
  wastePercentage: number;
}

// Notificações
export interface Notification {
  id: string;
  type: 'low_stock' | 'expiring' | 'waste_alert' | 'budget_alert' | 'general';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  relatedId?: string;
  relatedType?: string;
  read: boolean;
  createdAt: string;
}

// Configurações do Sistema
export interface SystemSettings {
  schoolName: string;
  averageStudents: number;
  monthlyBudget: number;
  wasteThreshold: number; // porcentagem
  alertDaysBeforeExpiration: number;
  lowStockMultiplier: number;
}
