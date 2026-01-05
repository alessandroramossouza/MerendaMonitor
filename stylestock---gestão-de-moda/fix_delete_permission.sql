-- =====================================================
-- STYLESTOCK - FIX DELETE PERMISSION
-- Run this in your Supabase SQL Editor if delete is not working
-- =====================================================

-- 1. Drop existing restrictive policies if any
DROP POLICY IF EXISTS "Enable all for products" ON products;
DROP POLICY IF EXISTS "Enable read for products" ON products;
DROP POLICY IF EXISTS "Enable insert for products" ON products;
DROP POLICY IF EXISTS "Enable update for products" ON products;
DROP POLICY IF EXISTS "Enable delete for products" ON products;

-- 2. Create a permissive policy for all operations on products
CREATE POLICY "Enable all for products" ON products 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- 3. Same for sales table
DROP POLICY IF EXISTS "Enable all for sales" ON sales;
CREATE POLICY "Enable all for sales" ON sales 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- 4. Fix stock_movements foreign key to allow deletion
-- First drop the existing constraint if it exists
DO $$
BEGIN
    ALTER TABLE stock_movements DROP CONSTRAINT IF EXISTS stock_movements_product_id_fkey;
EXCEPTION
    WHEN undefined_table THEN NULL;
    WHEN undefined_object THEN NULL;
END $$;

-- 5. If stock_movements table exists, add the constraint again with ON DELETE SET NULL
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'stock_movements') THEN
        ALTER TABLE stock_movements 
        ADD CONSTRAINT stock_movements_product_id_fkey 
        FOREIGN KEY (product_id) 
        REFERENCES products(id) 
        ON DELETE SET NULL;
    END IF;
END $$;

-- Done! Try deleting a product again.
