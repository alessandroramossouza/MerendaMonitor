-- =====================================================
-- STYLESTOCK - FORCE RESET ALL DATA
-- Run this in Supabase SQL Editor
-- ⚠️ This will permanently delete ALL data!
-- =====================================================

-- Step 1: Remove all foreign key constraints temporarily
ALTER TABLE sales DROP CONSTRAINT IF EXISTS sales_product_id_fkey;
ALTER TABLE stock_movements DROP CONSTRAINT IF EXISTS stock_movements_product_id_fkey;

-- Step 2: TRUNCATE all tables (faster and more reliable than DELETE)
TRUNCATE TABLE stock_movements CASCADE;
TRUNCATE TABLE sales CASCADE;
TRUNCATE TABLE customers CASCADE;
TRUNCATE TABLE products CASCADE;

-- Step 3: Re-add the foreign key constraints with ON DELETE SET NULL
ALTER TABLE sales 
ADD CONSTRAINT sales_product_id_fkey 
FOREIGN KEY (product_id) 
REFERENCES products(id) 
ON DELETE SET NULL;

ALTER TABLE stock_movements 
ADD CONSTRAINT stock_movements_product_id_fkey 
FOREIGN KEY (product_id) 
REFERENCES products(id) 
ON DELETE SET NULL;

-- Step 4: Confirm all data is deleted
SELECT 'products' as tabela, COUNT(*) as registros FROM products
UNION ALL SELECT 'sales', COUNT(*) FROM sales
UNION ALL SELECT 'customers', COUNT(*) FROM customers
UNION ALL SELECT 'stock_movements', COUNT(*) FROM stock_movements;

-- All tables should show 0 records.
-- After running this, refresh your browser (Ctrl+F5) or click "Atualizar Dados"
