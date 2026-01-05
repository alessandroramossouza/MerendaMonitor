import { supabase } from './supabaseClient';
import { Product, Sale } from '../types';

// TABLE NAMES
const PRODUCTS_TABLE = 'products';
const SALES_TABLE = 'sales';

// Helper to map DB snake_case to TS camelCase
// Assumes DB has columns: created_at, cost_price, etc.
const mapProductFromDB = (data: any): Product => ({
  id: data.id,
  code: data.code,
  name: data.name,
  costPrice: data.cost_price,
  stock: data.stock,
  category: data.category,
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
  timestamp: data.created_at || data.timestamp, // Handle potential inconsistent naming
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
  // DB expects snake_case for insert
  const dbProduct = {
    code: product.code,
    name: product.name,
    cost_price: product.costPrice,
    stock: product.stock,
    category: product.category,
    // created_at is automatic in default Supabase setup
  };

  const { data, error } = await supabase
    .from(PRODUCTS_TABLE)
    .insert(dbProduct)
    .select() // Select to get back the ID and created_at
    .single();

  if (error) {
    console.error('Error adding product:', error);
    throw error;
  }
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
  const dbProduct: Record<string, any> = {};
  if (product.code !== undefined) dbProduct.code = product.code;
  if (product.name !== undefined) dbProduct.name = product.name;
  if (product.costPrice !== undefined) dbProduct.cost_price = product.costPrice;
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
  salePrice: number
): Promise<Sale> => {
  // 1. Verify Stock Logic (Server-side constraint is better, but doing client-side check for now)
  // Fetch current stock first to be safe
  const { data: product, error: productError } = await supabase
    .from(PRODUCTS_TABLE)
    .select('id, name, stock, cost_price')
    .eq('id', productId)
    .single();

  if (productError || !product) throw new Error("Produto não encontrado ou erro de conexão");
  if (product.stock < quantity) throw new Error("Estoque insuficiente");

  // 2. Create Sale Record
  const newSalePayload = {
    product_id: product.id,
    product_name: product.name,
    quantity,
    cost_at_sale: product.cost_price,
    sale_price: salePrice,
    total: salePrice * quantity,
    // created_at automatic
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

  // 3. Update Stock
  const { error: updateError } = await supabase
    .from(PRODUCTS_TABLE)
    .update({ stock: product.stock - quantity })
    .eq('id', productId);

  if (updateError) {
    console.error('CRITICAL: Stock update failed after sale!', updateError);
  }

  return mapSaleFromDB(saleData);
};

// --- REALTIME SUBSCRIPTIONS ---

export const subscribeToProducts = (onUpdate: () => void) => {
  const subscription = supabase
    .channel('products-channel')
    .on('postgres_changes', { event: '*', schema: 'public', table: PRODUCTS_TABLE }, () => {
      onUpdate();
    })
    .subscribe();

  return () => {
    supabase.removeChannel(subscription);
  };
};

export const subscribeToSales = (onUpdate: () => void) => {
  const subscription = supabase
    .channel('sales-channel')
    .on('postgres_changes', { event: '*', schema: 'public', table: SALES_TABLE }, () => {
      onUpdate();
    })
    .subscribe();

  return () => {
    supabase.removeChannel(subscription);
  };
};