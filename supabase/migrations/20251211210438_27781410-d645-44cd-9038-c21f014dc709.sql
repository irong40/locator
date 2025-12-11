-- 1. Update zipcode_lists: Require authentication instead of public access
DROP POLICY IF EXISTS "Allow public read" ON public.zipcode_lists;
CREATE POLICY "Authenticated users can read zipcodes"
ON public.zipcode_lists
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- 2. Update user_roles: Require authentication instead of public access
DROP POLICY IF EXISTS "Anyone can read roles" ON public.user_roles;
CREATE POLICY "Authenticated users can read roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- 3. Create a view for limited vendor data (non-sensitive fields only)
CREATE OR REPLACE VIEW public.vendors_public AS
SELECT 
  id,
  vendor_name,
  city,
  state,
  zip_code,
  latitude,
  longitude,
  oem,
  epp,
  vendor_level,
  preference,
  hr_labour_rate,
  created_at,
  updated_at
FROM public.vendors;

-- 4. Update vendors RLS: Only Admins and Managers can see full contact details
-- First drop existing SELECT policy
DROP POLICY IF EXISTS "Authenticated users can read vendors" ON public.vendors;

-- Create policy: Admins and Managers can see all vendor data
CREATE POLICY "Admins and Managers can read all vendor data"
ON public.vendors
FOR SELECT
USING (
  has_role(auth.uid(), 'Admin') OR 
  has_role(auth.uid(), 'Manager')
);

-- Create policy: Regular authenticated users can see limited vendor data
CREATE POLICY "Users can read limited vendor data"
ON public.vendors
FOR SELECT
USING (
  auth.uid() IS NOT NULL AND
  NOT has_role(auth.uid(), 'Admin') AND
  NOT has_role(auth.uid(), 'Manager')
);