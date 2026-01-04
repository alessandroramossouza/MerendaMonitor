import { Product, Sale } from '../types';

// MOCK DATA KEYS
const PRODUCTS_KEY = 'stylestock_products';
const SALES_KEY = 'stylestock_sales';

// Helper to simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// --- PRODUCTS ---

export const getProducts = async (): Promise<Product[]> => {
  await delay(300);
  const data = localStorage.getItem(PRODUCTS_KEY);
  return data ? JSON.parse(data) : [];
};

export const addProduct = async (product: Omit<Product, 'id' | 'createdAt'>): Promise<Product> => {
  await delay(300);
  const products = await getProducts();
  const newProduct: Product = {
    ...product,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  products.push(newProduct);
  localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
  return newProduct;
};

export const updateProductStock = async (id: string, newStock: number): Promise<void> => {
  const products = await getProducts();
  const index = products.findIndex(p => p.id === id);
  if (index !== -1) {
    products[index].stock = newStock;
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
  }
};

// --- SALES ---

export const getSales = async (): Promise<Sale[]> => {
  await delay(300);
  const data = localStorage.getItem(SALES_KEY);
  return data ? JSON.parse(data) : [];
};

export const processSale = async (
  productId: string,
  quantity: number,
  salePrice: number
): Promise<Sale> => {
  await delay(500);
  const products = await getProducts();
  const product = products.find(p => p.id === productId);

  if (!product) throw new Error("Produto não encontrado");
  if (product.stock < quantity) throw new Error("Estoque insuficiente");

  // 1. Create Sale Record
  const newSale: Sale = {
    id: crypto.randomUUID(),
    productId: product.id,
    productName: product.name,
    quantity,
    costAtSale: product.costPrice,
    salePrice,
    total: salePrice * quantity,
    timestamp: new Date().toISOString(),
  };

  // 2. Update Stock
  product.stock -= quantity;
  
  // 3. Save Both
  const sales = await getSales();
  sales.push(newSale);
  
  localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
  localStorage.setItem(SALES_KEY, JSON.stringify(sales));

  return newSale;
};

/* 
  NOTE FOR USER: 
  To use Supabase, replace the functions above with Supabase client calls.
  
  Example:
  export const getProducts = async () => {
    const { data, error } = await supabase.from('products').select('*');
    if (error) throw error;
    return data;
  }
*/