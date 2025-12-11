-- 1. Create a restricted view for vendor data (non-sensitive fields only)
-- This view excludes PII like email, phone, fax, address, and POC
CREATE OR REPLACE VIEW public.vendors_limited AS
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

-- 2. Add explicit denial policies to audit_logs table for INSERT/UPDATE/DELETE
-- This ensures audit logs cannot be tampered with even if someone tries
CREATE POLICY "Deny direct inserts to audit_logs"
ON public.audit_logs
FOR INSERT
TO authenticated
WITH CHECK (false);

CREATE POLICY "Deny updates to audit_logs"
ON public.audit_logs
FOR UPDATE
TO authenticated
USING (false);

CREATE POLICY "Deny deletes from audit_logs"
ON public.audit_logs
FOR DELETE
TO authenticated
USING (false);