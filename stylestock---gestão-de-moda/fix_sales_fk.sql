-- =====================================================
-- STYLESTOCK - FIX SALES FOREIGN KEY
-- Run this in Supabase SQL Editor
-- =====================================================

-- The error is: "sales_product_id_fkey" prevents deletion
-- We need to change it to ON DELETE SET NULL

-- 1. Drop the existing foreign key constraint
ALTER TABLE sales DROP CONSTRAINT IF EXISTS sales_product_id_fkey;

-- 2. Re-add the constraint with ON DELETE SET NULL
ALTER TABLE sales 
ADD CONSTRAINT sales_product_id_fkey 
FOREIGN KEY (product_id) 
REFERENCES products(id) 
ON DELETE SET NULL;

-- Done! Now you can delete products even if they have sales history.
-- The sales records will keep the product_name field for reference.
