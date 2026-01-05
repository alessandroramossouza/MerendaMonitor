import { supabase } from './supabaseClient';
import { Product, Sale, Customer, StockMovement, PaymentMethod } from '../types';

// TABLE NAMES
const PRODUCTS_TABLE = 'products';
const SALES_TABLE = 'sales';
const CUSTOMERS_TABLE = 'customers';
const MOVEMENTS_TABLE = 'stock_movements';

// Helper to map DB snake_case to TS camelCase
const mapProductFromDB = (data: any): Product => ({
  id: data.id,
  code: data.code,
  name: data.name,
  costPrice: data.cost_price || 0,
  margin: data.margin || 50,
  suggestedPrice: data.suggested_price || (data.cost_price * 1.5),
  stock: data.stock || 0,
  category: data.category || 'Geral',
  createdAt: data.created_at,
});

const mapSaleFromDB = (data: any): Sale => ({
  id: data.id,
  productId: data.product_id,
  productName: data.product_name,
  quantity: data.quantity,
  costAtSale: data.cost_at_sale,
  salePrice: data.sale_price,
  total: data.total,
  paymentMethod: data.payment_method || 'dinheiro',
  customerId: data.customer_id,
  customerName: data.customer_name,
  timestamp: data.created_at || data.timestamp,
});

const mapCustomerFromDB = (data: any): Customer => ({
  id: data.id,
  name: data.name,
  phone: data.phone,
  email: data.email,
  totalPurchases: data.total_purchases || 0,
  totalSpent: data.total_spent || 0,
  createdAt: data.created_at,
});

const mapMovementFromDB = (data: any): StockMovement => ({
  id: data.id,
  productId: data.product_id,
  productName: data.product_name,
  type: data.type,
  quantity: data.quantity,
  previousStock: data.previous_stock,
  newStock: data.new_stock,
  reason: data.reason,
  timestamp: data.created_at,
});

// --- PRODUCTS ---

export const getProducts = async (): Promise<Product[]> => {
  const { data, error } = await supabase
    .from(PRODUCTS_TABLE)
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
  return (data || []).map(mapProductFromDB);
};

export const addProduct = async (product: Omit<Product, 'id' | 'createdAt'>): Promise<Product> => {
  const dbProduct = {
    code: product.code,
    name: product.name,
    cost_price: product.costPrice,
    margin: product.margin || 50,
    suggested_price: product.suggestedPrice || (product.costPrice * (1 + (product.margin || 50) / 100)),
    stock: product.stock,
    category: product.category,
  };

  const { data, error } = await supabase
    .from(PRODUCTS_TABLE)
    .insert(dbProduct)
    .select()
    .single();

  if (error) {
    console.error('Error adding product:', error);
    throw error;
  }

  // Log movement
  await logStockMovement(data.id, data.name, 'entrada', product.stock, 0, product.stock, 'Cadastro inicial');

  return mapProductFromDB(data);
};

export const updateProductStock = async (id: string, newStock: number): Promise<void> => {
  const { error } = await supabase
    .from(PRODUCTS_TABLE)
    .update({ stock: newStock })
    .eq('id', id);

  if (error) {
    console.error('Error updating stock:', error);
    throw error;
  }
};

export const updateProduct = async (id: string, product: Partial<Omit<Product, 'id' | 'createdAt'>>): Promise<void> => {
  // Get current product for movement logging
  const { data: currentProduct } = await supabase.from(PRODUCTS_TABLE).select('*').eq('id', id).single();

  const dbProduct: Record<string, any> = {};
  if (product.code !== undefined) dbProduct.code = product.code;
  if (product.name !== undefined) dbProduct.name = product.name;
  if (product.costPrice !== undefined) dbProduct.cost_price = product.costPrice;
  if (product.margin !== undefined) dbProduct.margin = product.margin;
  if (product.suggestedPrice !== undefined) dbProduct.suggested_price = product.suggestedPrice;
  if (product.stock !== undefined) dbProduct.stock = product.stock;
  if (product.category !== undefined) dbProduct.category = product.category;

  const { error } = await supabase
    .from(PRODUCTS_TABLE)
    .update(dbProduct)
    .eq('id', id);

  if (error) {
    console.error('Error updating product:', error);
    throw error;
  }

  // Log stock movement if stock changed
  if (product.stock !== undefined && currentProduct && currentProduct.stock !== product.stock) {
    const type = product.stock > currentProduct.stock ? 'entrada' : 'ajuste';
    await logStockMovement(id, currentProduct.name, type, Math.abs(product.stock - currentProduct.stock), currentProduct.stock, product.stock, 'Ajuste manual');
  }
};

export const deleteProduct = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from(PRODUCTS_TABLE)
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting product:', error);
    throw error;
  }
};

// --- SALES ---

export const getSales = async (): Promise<Sale[]> => {
  const { data, error } = await supabase
    .from(SALES_TABLE)
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching sales:', error);
    throw error;
  }
  return (data || []).map(mapSaleFromDB);
};

export const processSale = async (
  productId: string,
  quantity: number,
  salePrice: number,
  paymentMethod: PaymentMethod = 'dinheiro',
  customerId?: string,
  customerName?: string
): Promise<Sale> => {
  const { data: product, error: productError } = await supabase
    .from(PRODUCTS_TABLE)
    .select('id, name, stock, cost_price')
    .eq('id', productId)
    .single();

  if (productError || !product) throw new Error("Produto não encontrado ou erro de conexão");
  if (product.stock < quantity) throw new Error("Estoque insuficiente");

  const newSalePayload = {
    product_id: product.id,
    product_name: product.name,
    quantity,
    cost_at_sale: product.cost_price,
    sale_price: salePrice,
    total: salePrice * quantity,
    payment_method: paymentMethod,
    customer_id: customerId || null,
    customer_name: customerName || null,
  };

  const { data: saleData, error: saleError } = await supabase
    .from(SALES_TABLE)
    .insert(newSalePayload)
    .select()
    .single();

  if (saleError) {
    console.error('Error creating sale:', saleError);
    throw saleError;
  }

  const newStock = product.stock - quantity;
  await supabase.from(PRODUCTS_TABLE).update({ stock: newStock }).eq('id', productId);

  // Log movement
  await logStockMovement(productId, product.name, 'venda', quantity, product.stock, newStock, `Venda #${saleData.id.slice(0, 8)}`);

  // Update customer stats if applicable
  if (customerId) {
    await updateCustomerStats(customerId, salePrice * quantity);
  }

  return mapSaleFromDB(saleData);
};

// --- CUSTOMERS ---

export const getCustomers = async (): Promise<Customer[]> => {
  const { data, error } = await supabase
    .from(CUSTOMERS_TABLE)
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching customers:', error);
    return []; // Return empty array if table doesn't exist yet
  }
  return (data || []).map(mapCustomerFromDB);
};

export const addCustomer = async (customer: Omit<Customer, 'id' | 'createdAt' | 'totalPurchases' | 'totalSpent'>): Promise<Customer> => {
  const dbCustomer = {
    name: customer.name,
    phone: customer.phone || null,
    email: customer.email || null,
    total_purchases: 0,
    total_spent: 0,
  };

  const { data, error } = await supabase
    .from(CUSTOMERS_TABLE)
    .insert(dbCustomer)
    .select()
    .single();

  if (error) {
    console.error('Error adding customer:', error);
    throw error;
  }
  return mapCustomerFromDB(data);
};

export const updateCustomer = async (id: string, customer: Partial<Omit<Customer, 'id' | 'createdAt'>>): Promise<void> => {
  const dbCustomer: Record<string, any> = {};
  if (customer.name !== undefined) dbCustomer.name = customer.name;
  if (customer.phone !== undefined) dbCustomer.phone = customer.phone;
  if (customer.email !== undefined) dbCustomer.email = customer.email;

  const { error } = await supabase.from(CUSTOMERS_TABLE).update(dbCustomer).eq('id', id);
  if (error) throw error;
};

export const deleteCustomer = async (id: string): Promise<void> => {
  const { error } = await supabase.from(CUSTOMERS_TABLE).delete().eq('id', id);
  if (error) throw error;
};

const updateCustomerStats = async (customerId: string, amount: number): Promise<void> => {
  const { data: customer } = await supabase.from(CUSTOMERS_TABLE).select('*').eq('id', customerId).single();
  if (customer) {
    await supabase.from(CUSTOMERS_TABLE).update({
      total_purchases: (customer.total_purchases || 0) + 1,
      total_spent: (customer.total_spent || 0) + amount,
    }).eq('id', customerId);
  }
};

// --- STOCK MOVEMENTS ---

export const getStockMovements = async (): Promise<StockMovement[]> => {
  const { data, error } = await supabase
    .from(MOVEMENTS_TABLE)
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching movements:', error);
    return [];
  }
  return (data || []).map(mapMovementFromDB);
};

const logStockMovement = async (
  productId: string,
  productName: string,
  type: 'entrada' | 'saida' | 'ajuste' | 'venda',
  quantity: number,
  previousStock: number,
  newStock: number,
  reason: string
): Promise<void> => {
  try {
    await supabase.from(MOVEMENTS_TABLE).insert({
      product_id: productId,
      product_name: productName,
      type,
      quantity,
      previous_stock: previousStock,
      new_stock: newStock,
      reason,
    });
  } catch (e) {
    console.warn('Could not log movement:', e);
  }
};

// --- REALTIME SUBSCRIPTIONS ---

export const subscribeToProducts = (onUpdate: () => void) => {
  const subscription = supabase
    .channel('products-channel')
    .on('postgres_changes', { event: '*', schema: 'public', table: PRODUCTS_TABLE }, () => onUpdate())
    .subscribe();
  return () => supabase.removeChannel(subscription);
};

export const subscribeToSales = (onUpdate: () => void) => {
  const subscription = supabase
    .channel('sales-channel')
    .on('postgres_changes', { event: '*', schema: 'public', table: SALES_TABLE }, () => onUpdate())
    .subscribe();
  return () => supabase.removeChannel(subscription);
};

export const subscribeToCustomers = (onUpdate: () => void) => {
  const subscription = supabase
    .channel('customers-channel')
    .on('postgres_changes', { event: '*', schema: 'public', table: CUSTOMERS_TABLE }, () => onUpdate())
    .subscribe();
  return () => supabase.removeChannel(subscription);
};