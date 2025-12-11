-- Create function to auto-populate vendor coordinates from zipcode_lists
CREATE OR REPLACE FUNCTION public.populate_vendor_coordinates()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  zip_lat numeric;
  zip_lng numeric;
BEGIN
  -- Only update if zip_code is provided and coordinates are missing or zero
  IF NEW.zip_code IS NOT NULL AND (NEW.latitude IS NULL OR NEW.latitude = 0 OR NEW.longitude IS NULL OR NEW.longitude = 0) THEN
    SELECT latitude, longitude INTO zip_lat, zip_lng
    FROM public.zipcode_lists
    WHERE zipcode = NEW.zip_code
    LIMIT 1;
    
    IF zip_lat IS NOT NULL AND zip_lng IS NOT NULL THEN
      NEW.latitude := zip_lat;
      NEW.longitude := zip_lng;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for INSERT
CREATE TRIGGER populate_vendor_coordinates_on_insert
  BEFORE INSERT ON public.vendors
  FOR EACH ROW
  EXECUTE FUNCTION public.populate_vendor_coordinates();

-- Create trigger for UPDATE (only when zip_code changes)
CREATE TRIGGER populate_vendor_coordinates_on_update
  BEFORE UPDATE ON public.vendors
  FOR EACH ROW
  WHEN (OLD.zip_code IS DISTINCT FROM NEW.zip_code)
  EXECUTE FUNCTION public.populate_vendor_coordinates();