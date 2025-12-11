-- Update coordinates for the newly fixed vendors
UPDATE vendors v
SET 
  latitude = z.latitude,
  longitude = z.longitude,
  updated_at = now()
FROM zipcode_lists z
WHERE SUBSTRING(v.zip_code, 1, 5) = z.zipcode
  AND (v.latitude IS NULL OR v.latitude = 0 OR v.longitude IS NULL OR v.longitude = 0);