-- Drop and recreate the view with SECURITY INVOKER (default, safer)
DROP VIEW IF EXISTS public.vendors_limited;

CREATE VIEW public.vendors_limited 
WITH (security_invoker = true)
AS
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
  payment_type_id,
  created_at,
  updated_at
FROM public.vendors;

-- Grant SELECT on the view to authenticated users
GRANT SELECT ON public.vendors_limited TO authenticated;