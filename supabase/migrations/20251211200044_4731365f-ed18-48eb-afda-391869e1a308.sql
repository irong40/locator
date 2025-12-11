-- Add audit triggers to key tables
-- Uses existing audit_trigger_func() function

-- Vendors audit trigger
DROP TRIGGER IF EXISTS audit_vendors ON public.vendors;
CREATE TRIGGER audit_vendors
  AFTER INSERT OR UPDATE OR DELETE ON public.vendors
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

-- Vendor engine brands audit trigger
DROP TRIGGER IF EXISTS audit_vendor_engine_brands ON public.vendor_engine_brands;
CREATE TRIGGER audit_vendor_engine_brands
  AFTER INSERT OR UPDATE OR DELETE ON public.vendor_engine_brands
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

-- Vendor OEM brands audit trigger
DROP TRIGGER IF EXISTS audit_vendor_oem_brands ON public.vendor_oem_brands;
CREATE TRIGGER audit_vendor_oem_brands
  AFTER INSERT OR UPDATE OR DELETE ON public.vendor_oem_brands
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

-- Vendor EPP brands audit trigger
DROP TRIGGER IF EXISTS audit_vendor_epp_brands ON public.vendor_epp_brands;
CREATE TRIGGER audit_vendor_epp_brands
  AFTER INSERT OR UPDATE OR DELETE ON public.vendor_epp_brands
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

-- Vendor products audit trigger
DROP TRIGGER IF EXISTS audit_vendor_products ON public.vendor_products;
CREATE TRIGGER audit_vendor_products
  AFTER INSERT OR UPDATE OR DELETE ON public.vendor_products
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();