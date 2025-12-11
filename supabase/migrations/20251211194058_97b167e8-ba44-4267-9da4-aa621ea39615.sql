-- Fix malformed vendor records where CSV data ended up in vendor_name
-- Pattern 1: ",City,ST,ZIPCODE" format (e.g., ",Berea,KY,40403")
UPDATE vendors
SET 
  city = TRIM(split_part(vendor_name, ',', 2)),
  state = TRIM(split_part(vendor_name, ',', 3)),
  zip_code = SUBSTRING(split_part(vendor_name, ',', 4), 1, 5),
  vendor_name = 'UNKNOWN - Needs Review',
  updated_at = now()
WHERE vendor_name ~ '^,[A-Za-z ]+,[A-Z]{2},\d{5}'
  AND city IS NULL;

-- Pattern 2: ",ST,ZIPCODE" format (e.g., ",AL,35055")
UPDATE vendors
SET 
  state = TRIM(split_part(vendor_name, ',', 2)),
  zip_code = SUBSTRING(split_part(vendor_name, ',', 3), 1, 5),
  vendor_name = 'UNKNOWN - Needs Review',
  updated_at = now()
WHERE vendor_name ~ '^,[A-Z]{2},\d{5}'
  AND state IS NULL;

-- Pattern 3: ",City,ST,ZIPCODE,extra..." format with trailing data
UPDATE vendors
SET 
  city = TRIM(split_part(vendor_name, ',', 2)),
  state = TRIM(split_part(vendor_name, ',', 3)),
  zip_code = SUBSTRING(split_part(vendor_name, ',', 4), 1, 5),
  comments = COALESCE(comments || ' | ', '') || 'Original data: ' || vendor_name,
  vendor_name = 'UNKNOWN - Needs Review',
  updated_at = now()
WHERE vendor_name LIKE ',%' 
  AND vendor_name ~ ',\d{5},'
  AND city IS NULL;