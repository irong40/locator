-- Drop existing tables (cascade to handle foreign keys)
DROP TABLE IF EXISTS vendor_engine_brands CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS engine_brands CASCADE;
DROP TABLE IF EXISTS payment_types CASCADE;
DROP TABLE IF EXISTS vendors CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS roles CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP VIEW IF EXISTS users_safe CASCADE;
DROP TYPE IF EXISTS vendor_status CASCADE;

-- Drop existing functions
DROP FUNCTION IF EXISTS get_user_role(uuid) CASCADE;
DROP FUNCTION IF EXISTS get_user_vendor_id(uuid) CASCADE;
DROP FUNCTION IF EXISTS validate_product_activation() CASCADE;
DROP FUNCTION IF EXISTS validate_email() CASCADE;
DROP FUNCTION IF EXISTS prevent_sensitive_user_field_changes() CASCADE;
DROP FUNCTION IF EXISTS check_order_limit() CASCADE;

-- Create new C&R Repair Solutions schema

-- Payment Types
CREATE TABLE payment_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_type TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vendors
CREATE TABLE vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_name TEXT NOT NULL,
  poc TEXT,
  hr_labour_rate DECIMAL(10,2) DEFAULT 0,
  phone_no VARCHAR(15),
  fax_no VARCHAR(15),
  email_address TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  latitude DECIMAL(10,6),
  longitude DECIMAL(10,6),
  oem BOOLEAN DEFAULT false,
  epp BOOLEAN DEFAULT false,
  vendor_level TEXT CHECK (vendor_level IN ('Good', 'Bad')),
  preference TEXT CHECK (preference IN ('Preferred', 'Do Not Use')),
  comments TEXT,
  payment_type_id UUID REFERENCES payment_types(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- OEM Brands
CREATE TABLE oem_brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  oem_brand TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Engine Brands
CREATE TABLE engine_brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engine_brand TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Zipcode Lists (for geographic search)
CREATE TABLE zipcode_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zipcode VARCHAR(20) NOT NULL UNIQUE,
  latitude DECIMAL(10,6) NOT NULL,
  longitude DECIMAL(10,6) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pivot Tables (Many-to-Many)
CREATE TABLE vendor_oem_brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  oem_brand_id UUID NOT NULL REFERENCES oem_brands(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(vendor_id, oem_brand_id)
);

CREATE TABLE vendor_epp_brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  oem_brand_id UUID NOT NULL REFERENCES oem_brands(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(vendor_id, oem_brand_id)
);

CREATE TABLE vendor_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(vendor_id, product_id)
);

CREATE TABLE vendor_engine_brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  engine_brand_id UUID NOT NULL REFERENCES engine_brands(id) ON DELETE CASCADE,
  is_certified BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(vendor_id, engine_brand_id)
);

-- Performance Indexes
CREATE INDEX idx_vendors_zip ON vendors(zip_code);
CREATE INDEX idx_vendors_coords ON vendors(latitude, longitude);
CREATE INDEX idx_zipcode_coords ON zipcode_lists(latitude, longitude);
CREATE INDEX idx_vendor_oem_brands_vendor ON vendor_oem_brands(vendor_id);
CREATE INDEX idx_vendor_epp_brands_vendor ON vendor_epp_brands(vendor_id);
CREATE INDEX idx_vendor_products_vendor ON vendor_products(vendor_id);
CREATE INDEX idx_vendor_engine_brands_vendor ON vendor_engine_brands(vendor_id);

-- Enable RLS
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE oem_brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE engine_brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE zipcode_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_oem_brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_epp_brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_engine_brands ENABLE ROW LEVEL SECURITY;

-- RLS Policies: authenticated users have full access
CREATE POLICY "Allow authenticated access" ON vendors FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated access" ON oem_brands FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated access" ON products FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated access" ON engine_brands FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated access" ON payment_types FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated access" ON vendor_oem_brands FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated access" ON vendor_epp_brands FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated access" ON vendor_products FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated access" ON vendor_engine_brands FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read" ON zipcode_lists FOR SELECT TO public USING (true);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Trigger for vendors updated_at
CREATE TRIGGER update_vendors_updated_at
  BEFORE UPDATE ON vendors
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();