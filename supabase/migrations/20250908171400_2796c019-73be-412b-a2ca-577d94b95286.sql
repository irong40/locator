-- Create enum types
CREATE TYPE vendor_status AS ENUM ('draft', 'active', 'suspended');

-- Create roles table
CREATE TABLE public.roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    permissions JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create users table (without profile_id FK initially due to circular dependency)
CREATE TABLE public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMP WITH TIME ZONE,
    role_id UUID REFERENCES public.roles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create profiles table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    first_name TEXT,
    last_name TEXT,
    phone TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add profile_id FK to users table
ALTER TABLE public.users ADD COLUMN profile_id UUID REFERENCES public.profiles(id);

-- Create vendors table
CREATE TABLE public.vendors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE,
    status vendor_status DEFAULT 'draft',
    contact_email TEXT,
    contact_phone TEXT,
    website TEXT,
    address JSONB,
    owner_user_id UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create engine_brands table
CREATE TABLE public.engine_brands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE,
    oem BOOLEAN DEFAULT false,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create payment_types table
CREATE TABLE public.payment_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL,
    label TEXT,
    terms JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create vendor_engine_brands junction table
CREATE TABLE public.vendor_engine_brands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
    engine_brand_id UUID NOT NULL REFERENCES public.engine_brands(id) ON DELETE CASCADE,
    authorized BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(vendor_id, engine_brand_id)
);

-- Create products table
CREATE TABLE public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
    sku TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    active BOOLEAN DEFAULT true,
    inventory_qty INTEGER DEFAULT 0,
    engine_brand_id UUID REFERENCES public.engine_brands(id),
    images TEXT[],
    specs JSONB,
    payment_type_id UUID REFERENCES public.payment_types(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create audit_logs table
CREATE TABLE public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_user_id UUID REFERENCES public.users(id),
    entity_type TEXT,
    entity_id UUID,
    action TEXT,
    before JSONB,
    after JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.engine_brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_engine_brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Create function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS TEXT
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
    SELECT r.name
    FROM public.users u
    JOIN public.roles r ON u.role_id = r.id
    WHERE u.id = user_id;
$$;

-- Create function to get user vendor_id
CREATE OR REPLACE FUNCTION public.get_user_vendor_id(user_id UUID)
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
    SELECT v.id
    FROM public.vendors v
    WHERE v.owner_user_id = user_id
    LIMIT 1;
$$;

-- RLS Policies for roles (Admin only)
CREATE POLICY "Admin can manage roles" ON public.roles
    FOR ALL TO authenticated
    USING (public.get_user_role(auth.uid()) = 'Admin');

-- RLS Policies for users
CREATE POLICY "Admin can manage all users" ON public.users
    FOR ALL TO authenticated
    USING (public.get_user_role(auth.uid()) = 'Admin');

CREATE POLICY "Users can view their own record" ON public.users
    FOR SELECT TO authenticated
    USING (id = auth.uid());

-- RLS Policies for profiles
CREATE POLICY "Admin can manage all profiles" ON public.profiles
    FOR ALL TO authenticated
    USING (public.get_user_role(auth.uid()) = 'Admin');

CREATE POLICY "Users can view their own profile" ON public.profiles
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE TO authenticated
    USING (user_id = auth.uid());

-- RLS Policies for vendors
CREATE POLICY "Admin can manage all vendors" ON public.vendors
    FOR ALL TO authenticated
    USING (public.get_user_role(auth.uid()) = 'Admin');

CREATE POLICY "VendorAdmin can manage their vendor" ON public.vendors
    FOR ALL TO authenticated
    USING (
        public.get_user_role(auth.uid()) = 'VendorAdmin' AND 
        id = public.get_user_vendor_id(auth.uid())
    );

CREATE POLICY "Staff and Viewer can read vendors" ON public.vendors
    FOR SELECT TO authenticated
    USING (
        public.get_user_role(auth.uid()) IN ('Staff', 'Viewer') OR
        (public.get_user_role(auth.uid()) = 'Staff' AND id = public.get_user_vendor_id(auth.uid()))
    );

-- RLS Policies for engine_brands (readable by all authenticated users)
CREATE POLICY "All authenticated users can read engine_brands" ON public.engine_brands
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Admin can manage engine_brands" ON public.engine_brands
    FOR ALL TO authenticated
    USING (public.get_user_role(auth.uid()) = 'Admin');

-- RLS Policies for payment_types (readable by all authenticated users)
CREATE POLICY "All authenticated users can read payment_types" ON public.payment_types
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Admin can manage payment_types" ON public.payment_types
    FOR ALL TO authenticated
    USING (public.get_user_role(auth.uid()) = 'Admin');

-- RLS Policies for vendor_engine_brands
CREATE POLICY "Admin can manage all vendor_engine_brands" ON public.vendor_engine_brands
    FOR ALL TO authenticated
    USING (public.get_user_role(auth.uid()) = 'Admin');

CREATE POLICY "VendorAdmin can manage their vendor_engine_brands" ON public.vendor_engine_brands
    FOR ALL TO authenticated
    USING (
        public.get_user_role(auth.uid()) = 'VendorAdmin' AND 
        vendor_id = public.get_user_vendor_id(auth.uid())
    );

CREATE POLICY "All authenticated users can read vendor_engine_brands" ON public.vendor_engine_brands
    FOR SELECT TO authenticated
    USING (true);

-- RLS Policies for products
CREATE POLICY "Admin can manage all products" ON public.products
    FOR ALL TO authenticated
    USING (public.get_user_role(auth.uid()) = 'Admin');

CREATE POLICY "VendorAdmin can manage their products" ON public.products
    FOR ALL TO authenticated
    USING (
        public.get_user_role(auth.uid()) = 'VendorAdmin' AND 
        vendor_id = public.get_user_vendor_id(auth.uid())
    );

CREATE POLICY "Staff can read and update their vendor products" ON public.products
    FOR SELECT TO authenticated
    USING (
        public.get_user_role(auth.uid()) IN ('Staff', 'Viewer') OR
        (public.get_user_role(auth.uid()) = 'Staff' AND vendor_id = public.get_user_vendor_id(auth.uid()))
    );

CREATE POLICY "Staff can update their vendor products" ON public.products
    FOR UPDATE TO authenticated
    USING (
        public.get_user_role(auth.uid()) = 'Staff' AND 
        vendor_id = public.get_user_vendor_id(auth.uid())
    );

-- RLS Policies for audit_logs (Admin only)
CREATE POLICY "Admin can read audit_logs" ON public.audit_logs
    FOR SELECT TO authenticated
    USING (public.get_user_role(auth.uid()) = 'Admin');

-- Validation functions
CREATE OR REPLACE FUNCTION public.validate_product_activation()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Check if product is being activated
    IF NEW.active = true THEN
        -- Validate price is non-negative
        IF NEW.price < 0 THEN
            RAISE EXCEPTION 'Product price must be non-negative when active';
        END IF;
        
        -- Validate at least one image exists
        IF NEW.images IS NULL OR array_length(NEW.images, 1) < 1 THEN
            RAISE EXCEPTION 'Product must have at least one image when active';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Create trigger for product validation
CREATE TRIGGER validate_product_activation_trigger
    BEFORE INSERT OR UPDATE ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_product_activation();

-- Email validation function
CREATE OR REPLACE FUNCTION public.validate_email()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.email IS NULL OR NEW.email !~ '^[^@]+@[^@]+\.[^@]+$' THEN
        RAISE EXCEPTION 'Invalid email format';
    END IF;
    
    RETURN NEW;
END;
$$;

-- Create trigger for email validation
CREATE TRIGGER validate_email_trigger
    BEFORE INSERT OR UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_email();

-- Create indexes for better performance
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_role_id ON public.users(role_id);
CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX idx_vendors_slug ON public.vendors(slug);
CREATE INDEX idx_vendors_owner_user_id ON public.vendors(owner_user_id);
CREATE INDEX idx_engine_brands_slug ON public.engine_brands(slug);
CREATE INDEX idx_vendor_engine_brands_vendor_id ON public.vendor_engine_brands(vendor_id);
CREATE INDEX idx_vendor_engine_brands_engine_brand_id ON public.vendor_engine_brands(engine_brand_id);
CREATE INDEX idx_products_vendor_id ON public.products(vendor_id);
CREATE INDEX idx_products_sku ON public.products(sku);
CREATE INDEX idx_products_engine_brand_id ON public.products(engine_brand_id);
CREATE INDEX idx_audit_logs_entity_type_id ON public.audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_actor_user_id ON public.audit_logs(actor_user_id);

-- Insert default roles
INSERT INTO public.roles (name, permissions) VALUES 
('Admin', '{"*": ["*"]}'::jsonb),
('VendorAdmin', '{"vendors": ["read", "update"], "products": ["create", "read", "update", "delete"], "vendor_engine_brands": ["create", "read", "delete"]}'::jsonb),
('Staff', '{"vendors": ["read"], "products": ["read", "update"]}'::jsonb),
('Viewer', '{"*": ["read"]}'::jsonb);

-- Insert default payment types
INSERT INTO public.payment_types (code, label, terms) VALUES 
('CARD', 'Credit Card', '{"processing_fee": 2.9, "settlement_days": 1}'::jsonb),
('ACH', 'ACH Transfer', '{"processing_fee": 0.8, "settlement_days": 3}'::jsonb),
('NET30', 'Net 30 Terms', '{"credit_check_required": true, "payment_days": 30}'::jsonb);