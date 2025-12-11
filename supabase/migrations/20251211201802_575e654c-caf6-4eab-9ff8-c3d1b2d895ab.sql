-- Fix RLS on vendor_engine_brands
DROP POLICY IF EXISTS "Allow authenticated access" ON vendor_engine_brands;

CREATE POLICY "Authenticated users can read vendor_engine_brands" ON vendor_engine_brands
FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins and Managers can modify vendor_engine_brands" ON vendor_engine_brands
FOR INSERT WITH CHECK (has_role(auth.uid(), 'Admin') OR has_role(auth.uid(), 'Manager'));

CREATE POLICY "Admins and Managers can update vendor_engine_brands" ON vendor_engine_brands
FOR UPDATE USING (has_role(auth.uid(), 'Admin') OR has_role(auth.uid(), 'Manager'));

CREATE POLICY "Admins and Managers can delete vendor_engine_brands" ON vendor_engine_brands
FOR DELETE USING (has_role(auth.uid(), 'Admin') OR has_role(auth.uid(), 'Manager'));

-- Fix RLS on vendor_oem_brands
DROP POLICY IF EXISTS "Allow authenticated access" ON vendor_oem_brands;

CREATE POLICY "Authenticated users can read vendor_oem_brands" ON vendor_oem_brands
FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins and Managers can modify vendor_oem_brands" ON vendor_oem_brands
FOR INSERT WITH CHECK (has_role(auth.uid(), 'Admin') OR has_role(auth.uid(), 'Manager'));

CREATE POLICY "Admins and Managers can update vendor_oem_brands" ON vendor_oem_brands
FOR UPDATE USING (has_role(auth.uid(), 'Admin') OR has_role(auth.uid(), 'Manager'));

CREATE POLICY "Admins and Managers can delete vendor_oem_brands" ON vendor_oem_brands
FOR DELETE USING (has_role(auth.uid(), 'Admin') OR has_role(auth.uid(), 'Manager'));

-- Fix RLS on vendor_epp_brands
DROP POLICY IF EXISTS "Allow authenticated access" ON vendor_epp_brands;

CREATE POLICY "Authenticated users can read vendor_epp_brands" ON vendor_epp_brands
FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins and Managers can modify vendor_epp_brands" ON vendor_epp_brands
FOR INSERT WITH CHECK (has_role(auth.uid(), 'Admin') OR has_role(auth.uid(), 'Manager'));

CREATE POLICY "Admins and Managers can update vendor_epp_brands" ON vendor_epp_brands
FOR UPDATE USING (has_role(auth.uid(), 'Admin') OR has_role(auth.uid(), 'Manager'));

CREATE POLICY "Admins and Managers can delete vendor_epp_brands" ON vendor_epp_brands
FOR DELETE USING (has_role(auth.uid(), 'Admin') OR has_role(auth.uid(), 'Manager'));

-- Fix RLS on vendor_products
DROP POLICY IF EXISTS "Allow authenticated access" ON vendor_products;

CREATE POLICY "Authenticated users can read vendor_products" ON vendor_products
FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins and Managers can modify vendor_products" ON vendor_products
FOR INSERT WITH CHECK (has_role(auth.uid(), 'Admin') OR has_role(auth.uid(), 'Manager'));

CREATE POLICY "Admins and Managers can update vendor_products" ON vendor_products
FOR UPDATE USING (has_role(auth.uid(), 'Admin') OR has_role(auth.uid(), 'Manager'));

CREATE POLICY "Admins and Managers can delete vendor_products" ON vendor_products
FOR DELETE USING (has_role(auth.uid(), 'Admin') OR has_role(auth.uid(), 'Manager'));

-- Fix RLS on payment_types
DROP POLICY IF EXISTS "Allow authenticated access" ON payment_types;

CREATE POLICY "Authenticated users can read payment_types" ON payment_types
FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins and Managers can modify payment_types" ON payment_types
FOR INSERT WITH CHECK (has_role(auth.uid(), 'Admin') OR has_role(auth.uid(), 'Manager'));

CREATE POLICY "Admins and Managers can update payment_types" ON payment_types
FOR UPDATE USING (has_role(auth.uid(), 'Admin') OR has_role(auth.uid(), 'Manager'));

CREATE POLICY "Admins and Managers can delete payment_types" ON payment_types
FOR DELETE USING (has_role(auth.uid(), 'Admin') OR has_role(auth.uid(), 'Manager'));

-- Fix RLS on products
DROP POLICY IF EXISTS "Allow authenticated access" ON products;

CREATE POLICY "Authenticated users can read products" ON products
FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins and Managers can modify products" ON products
FOR INSERT WITH CHECK (has_role(auth.uid(), 'Admin') OR has_role(auth.uid(), 'Manager'));

CREATE POLICY "Admins and Managers can update products" ON products
FOR UPDATE USING (has_role(auth.uid(), 'Admin') OR has_role(auth.uid(), 'Manager'));

CREATE POLICY "Admins and Managers can delete products" ON products
FOR DELETE USING (has_role(auth.uid(), 'Admin') OR has_role(auth.uid(), 'Manager'));

-- Fix RLS on oem_brands
DROP POLICY IF EXISTS "Allow authenticated access" ON oem_brands;

CREATE POLICY "Authenticated users can read oem_brands" ON oem_brands
FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins and Managers can modify oem_brands" ON oem_brands
FOR INSERT WITH CHECK (has_role(auth.uid(), 'Admin') OR has_role(auth.uid(), 'Manager'));

CREATE POLICY "Admins and Managers can update oem_brands" ON oem_brands
FOR UPDATE USING (has_role(auth.uid(), 'Admin') OR has_role(auth.uid(), 'Manager'));

CREATE POLICY "Admins and Managers can delete oem_brands" ON oem_brands
FOR DELETE USING (has_role(auth.uid(), 'Admin') OR has_role(auth.uid(), 'Manager'));

-- Fix RLS on engine_brands
DROP POLICY IF EXISTS "Allow authenticated access" ON engine_brands;

CREATE POLICY "Authenticated users can read engine_brands" ON engine_brands
FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins and Managers can modify engine_brands" ON engine_brands
FOR INSERT WITH CHECK (has_role(auth.uid(), 'Admin') OR has_role(auth.uid(), 'Manager'));

CREATE POLICY "Admins and Managers can update engine_brands" ON engine_brands
FOR UPDATE USING (has_role(auth.uid(), 'Admin') OR has_role(auth.uid(), 'Manager'));

CREATE POLICY "Admins and Managers can delete engine_brands" ON engine_brands
FOR DELETE USING (has_role(auth.uid(), 'Admin') OR has_role(auth.uid(), 'Manager'));

-- Fix RLS on vendors table too (mentioned in scan as critical)
DROP POLICY IF EXISTS "Allow authenticated access" ON vendors;

CREATE POLICY "Authenticated users can read vendors" ON vendors
FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins and Managers can modify vendors" ON vendors
FOR INSERT WITH CHECK (has_role(auth.uid(), 'Admin') OR has_role(auth.uid(), 'Manager'));

CREATE POLICY "Admins and Managers can update vendors" ON vendors
FOR UPDATE USING (has_role(auth.uid(), 'Admin') OR has_role(auth.uid(), 'Manager'));

CREATE POLICY "Admins and Managers can delete vendors" ON vendors
FOR DELETE USING (has_role(auth.uid(), 'Admin') OR has_role(auth.uid(), 'Manager'));