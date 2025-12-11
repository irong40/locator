-- Update vendors' latitude/longitude based on their zip_code from zipcode_lists
UPDATE vendors v
SET 
  latitude = z.latitude,
  longitude = z.longitude
FROM zipcode_lists z
WHERE v.zip_code = z.zipcode
  AND (v.latitude IS NULL OR v.latitude = 0);