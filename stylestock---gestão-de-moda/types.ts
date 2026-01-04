export interface Product {
  id: string;
  code: string; // Ex: LC-001
  name: string; // Ex: Camiseta Lacoste
  costPrice: number; // Valor de compra
  stock: number; // Quantidade atual
  category: string;
  createdAt: string;
}

export interface Sale {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  costAtSale: number; // Snapshot of cost when sold
  salePrice: number; // Valor de venda
  total: number;
  timestamp: string;
}

export type ViewState = 'inventory' | 'sales' | 'admin';

export interface DashboardMetrics {
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  salesCount: number;
}