-- Phase 1: Database triggers for auto-profile creation and default role assignment

-- 1.1 Create trigger function to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'last_name'
  );
  RETURN NEW;
END;
$$;

-- Create trigger on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 1.2 Create trigger function to auto-assign 'User' role on profile creation
CREATE OR REPLACE FUNCTION public.assign_default_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  default_role_id uuid;
BEGIN
  -- Get the 'User' role id
  SELECT id INTO default_role_id FROM public.user_roles WHERE role_name = 'User';
  
  -- Only assign if we found the role and user doesn't already have a role assignment
  IF default_role_id IS NOT NULL THEN
    INSERT INTO public.user_role_assignments (user_id, role_id)
    VALUES (NEW.user_id, default_role_id)
    ON CONFLICT DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on profiles table
CREATE TRIGGER on_profile_created
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.assign_default_role();