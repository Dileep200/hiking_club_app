-- 0006_fix_rls.sql

-- 1. Create a secure function that bypasses RLS to check admin status
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_role public.user_role;
BEGIN
  -- Because this is SECURITY DEFINER, it bypasses the infinite recursion
  SELECT role INTO v_role FROM public.users WHERE id = auth.uid();
  RETURN v_role = 'admin';
END;
$$;

-- 2. Drop the recursively broken policies
DROP POLICY IF EXISTS "Users can read own profile or Admins can read all" ON public.users;
DROP POLICY IF EXISTS "Admins can update users" ON public.users;

-- 3. Create the new, safe policies
CREATE POLICY "Users can read own profile or Admins can read all" 
ON public.users 
FOR SELECT 
USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "Admins can update users" 
ON public.users 
FOR UPDATE 
USING (public.is_admin());
