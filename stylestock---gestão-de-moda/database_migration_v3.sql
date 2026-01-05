-- =====================================================
-- STYLESTOCK DATABASE MIGRATION v3.0
-- Run this in your Supabase SQL Editor
-- =====================================================

-- 1. Add new columns to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS margin NUMERIC DEFAULT 50;
ALTER TABLE products ADD COLUMN IF NOT EXISTS suggested_price NUMERIC;

-- Update existing products with suggested price
UPDATE products SET suggested_price = cost_price * 1.5 WHERE suggested_price IS NULL;

-- 2. Add new columns to sales table
ALTER TABLE sales ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) DEFAULT 'dinheiro';
ALTER TABLE sales ADD COLUMN IF NOT EXISTS customer_id UUID;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS customer_name VARCHAR(255);

-- 3. Create customers table
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  email VARCHAR(255),
  total_purchases INTEGER DEFAULT 0,
  total_spent NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create stock_movements table
CREATE TABLE IF NOT EXISTS stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'entrada', 'saida', 'ajuste', 'venda'
  quantity INTEGER NOT NULL,
  previous_stock INTEGER NOT NULL,
  new_stock INTEGER NOT NULL,
  reason VARCHAR(500),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Enable Row Level Security
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;

-- 6. Create policies for public access
DROP POLICY IF EXISTS "Enable all for customers" ON customers;
DROP POLICY IF EXISTS "Enable all for stock_movements" ON stock_movements;
CREATE POLICY "Enable all for customers" ON customers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for stock_movements" ON stock_movements FOR ALL USING (true) WITH CHECK (true);

-- 7. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_stock_movements_product_id ON stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_created_at ON stock_movements(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sales_customer_id ON sales(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_payment_method ON sales(payment_method);

-- Note: Realtime is already enabled for all tables in your Supabase project.
-- Done! Your database is now ready for StyleStock v3.0
