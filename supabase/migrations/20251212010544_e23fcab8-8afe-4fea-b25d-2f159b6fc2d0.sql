-- Step 1: Clean up duplicate role assignments
-- Delete "User" role for users who also have "Admin" (keep the more privileged role)
DELETE FROM public.user_role_assignments
WHERE id IN (
  SELECT ura_user.id
  FROM public.user_role_assignments ura_user
  JOIN public.user_roles ur_user ON ura_user.role_id = ur_user.id
  WHERE ur_user.role_name = 'User'
    AND EXISTS (
      SELECT 1
      FROM public.user_role_assignments ura_admin
      JOIN public.user_roles ur_admin ON ura_admin.role_id = ur_admin.id
      WHERE ura_admin.user_id = ura_user.user_id
        AND ur_admin.role_name = 'Admin'
    )
);

-- Step 2: Drop the existing constraint that allows multiple roles per user
ALTER TABLE public.user_role_assignments 
DROP CONSTRAINT IF EXISTS user_role_assignments_user_id_role_id_key;

-- Step 3: Add unique constraint on user_id to enforce one-role-per-user
ALTER TABLE public.user_role_assignments 
ADD CONSTRAINT user_role_assignments_user_id_key UNIQUE (user_id);

-- Step 4: Update the assign_default_role trigger to use the new constraint
CREATE OR REPLACE FUNCTION public.assign_default_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;