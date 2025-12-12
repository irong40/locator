-- Allow Users to update vendors (not insert or delete)
CREATE POLICY "Users can update vendors"
ON public.vendors
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'User'::text));

-- Allow Users to manage vendor_oem_brands
CREATE POLICY "Users can insert vendor_oem_brands"
ON public.vendor_oem_brands
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'User'::text));

CREATE POLICY "Users can update vendor_oem_brands"
ON public.vendor_oem_brands
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'User'::text));

CREATE POLICY "Users can delete vendor_oem_brands"
ON public.vendor_oem_brands
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'User'::text));

-- Allow Users to manage vendor_epp_brands
CREATE POLICY "Users can insert vendor_epp_brands"
ON public.vendor_epp_brands
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'User'::text));

CREATE POLICY "Users can update vendor_epp_brands"
ON public.vendor_epp_brands
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'User'::text));

CREATE POLICY "Users can delete vendor_epp_brands"
ON public.vendor_epp_brands
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'User'::text));

-- Allow Users to manage vendor_engine_brands
CREATE POLICY "Users can insert vendor_engine_brands"
ON public.vendor_engine_brands
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'User'::text));

CREATE POLICY "Users can update vendor_engine_brands"
ON public.vendor_engine_brands
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'User'::text));

CREATE POLICY "Users can delete vendor_engine_brands"
ON public.vendor_engine_brands
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'User'::text));

-- Allow Users to manage vendor_products
CREATE POLICY "Users can insert vendor_products"
ON public.vendor_products
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'User'::text));

CREATE POLICY "Users can update vendor_products"
ON public.vendor_products
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'User'::text));

CREATE POLICY "Users can delete vendor_products"
ON public.vendor_products
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'User'::text));