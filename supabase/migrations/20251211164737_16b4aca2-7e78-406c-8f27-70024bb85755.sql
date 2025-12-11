-- Create enum for roles
CREATE TYPE public.app_role AS ENUM ('admin', 'manager', 'user', 'viewer');

-- Create user_roles table (role definitions)
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_name text UNIQUE NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

-- Insert the 4 roles
INSERT INTO public.user_roles (role_name, description) VALUES
  ('Admin', 'Full system access - can manage all data and users'),
  ('Manager', 'Can manage vendors and data but not users'),
  ('User', 'Standard user - can view and edit assigned vendors'),
  ('Viewer', 'Read-only access to data');

-- Create profiles table
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  first_name text,
  last_name text,
  short_name text,
  phone_no text,
  old_laravel_id integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create user_role_assignments junction table
CREATE TABLE public.user_role_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role_id uuid REFERENCES public.user_roles(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, role_id)
);

-- Enable RLS on all new tables
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_role_assignments ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_role_assignments ura
    JOIN public.user_roles ur ON ura.role_id = ur.id
    WHERE ura.user_id = _user_id
      AND ur.role_name = _role
  )
$$;

-- Function to get user's role name
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ur.role_name
  FROM public.user_role_assignments ura
  JOIN public.user_roles ur ON ura.role_id = ur.id
  WHERE ura.user_id = _user_id
  LIMIT 1
$$;

-- Function to get user's full name
CREATE OR REPLACE FUNCTION public.get_user_full_name(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(first_name || ' ' || last_name, first_name, last_name, 'Unknown')
  FROM public.profiles
  WHERE user_id = _user_id
$$;

-- RLS Policies for user_roles (anyone authenticated can read roles)
CREATE POLICY "Anyone can read roles" ON public.user_roles
  FOR SELECT TO authenticated USING (true);

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'Admin'));

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all profiles" ON public.profiles
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'Admin'));

-- RLS Policies for user_role_assignments
CREATE POLICY "Users can view own role" ON public.user_role_assignments
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles" ON public.user_role_assignments
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'Admin'));

CREATE POLICY "Admins can manage roles" ON public.user_role_assignments
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'Admin'));

-- Create indexes for performance
CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX idx_user_role_assignments_user_id ON public.user_role_assignments(user_id);
CREATE INDEX idx_user_role_assignments_role_id ON public.user_role_assignments(role_id);

-- Add created_by and updated_by to vendors table
ALTER TABLE public.vendors 
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS updated_by uuid REFERENCES auth.users(id);

CREATE INDEX IF NOT EXISTS idx_vendors_created_by ON public.vendors(created_by);
CREATE INDEX IF NOT EXISTS idx_vendors_updated_by ON public.vendors(updated_by);

-- Trigger to update profiles.updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Assign Admin role to dradamopierce@gmail.com (user ID: 3a850b8f-b0fd-4a6d-b921-a726e2977489)
INSERT INTO public.profiles (user_id, first_name, last_name)
VALUES ('3a850b8f-b0fd-4a6d-b921-a726e2977489', 'Adam', 'Pierce')
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO public.user_role_assignments (user_id, role_id)
SELECT '3a850b8f-b0fd-4a6d-b921-a726e2977489', id
FROM public.user_roles
WHERE role_name = 'Admin'
ON CONFLICT (user_id, role_id) DO NOTHING;