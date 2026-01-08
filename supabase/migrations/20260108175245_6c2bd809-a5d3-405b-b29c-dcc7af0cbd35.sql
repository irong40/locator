-- Function to securely fetch last_sign_in_at from auth.users
CREATE OR REPLACE FUNCTION public.get_user_last_sign_in(_user_id uuid)
RETURNS timestamptz
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT last_sign_in_at FROM auth.users WHERE id = _user_id
$$;

-- Grant access to authenticated users
GRANT EXECUTE ON FUNCTION public.get_user_last_sign_in TO authenticated;