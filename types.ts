export interface Ingredient {
  id: string;
  name: string;
  category: string;
  currentStock: number; // in Kg
  minThreshold: number; // in Kg for alert
  unit: string;
}

export interface ConsumptionLog {
  id: string;
  date: string;
  ingredientId: string;
  ingredientName: string;
  amountUsed: number; // in Kg
  studentCount: number;
  gramsPerStudent: number;
}

export type UserRole = 'admin' | 'cook';

export interface Alert {
  id: string;
  ingredientId: string;
  message: string;
  severity: 'low' | 'critical';
}

export interface SupplyLog {
  id: string;
  date: string;
  ingredientId: string;
  ingredientName: string;
  amountAdded: number; // in Kg
  source: string;
  notes?: string;
  expirationDate?: string;
}