export interface Product {
  id: string;
  code: string; // Ex: LC-001
  name: string; // Ex: Camiseta Lacoste
  costPrice: number; // Valor de compra
  margin: number; // Margem de lucro em %
  suggestedPrice: number; // Preço de venda sugerido
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
  paymentMethod: 'dinheiro' | 'cartao_credito' | 'cartao_debito' | 'pix';
  customerId?: string; // Optional customer reference
  customerName?: string; // Denormalized for display
  timestamp: string;
}

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  totalPurchases: number;
  totalSpent: number;
  createdAt: string;
}

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  type: 'entrada' | 'saida' | 'ajuste' | 'venda';
  quantity: number;
  previousStock: number;
  newStock: number;
  reason: string;
  timestamp: string;
}

export type ViewState = 'dashboard' | 'inventory' | 'sales' | 'admin' | 'reports' | 'customers' | 'movements';

export type PaymentMethod = 'dinheiro' | 'cartao_credito' | 'cartao_debito' | 'pix';

export const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'dinheiro', label: 'Dinheiro' },
  { value: 'cartao_credito', label: 'Cartão de Crédito' },
  { value: 'cartao_debito', label: 'Cartão de Débito' },
  { value: 'pix', label: 'PIX' },
];

export interface DashboardMetrics {
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  salesCount: number;
}