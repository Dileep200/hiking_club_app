-- 0005_fix.sql

-- 1. Safely add the column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'admin_request_status') THEN
        ALTER TABLE public.users ADD COLUMN admin_request_status TEXT DEFAULT 'none';
    END IF;
END $$;

-- 2. Safely replace the trigger function with bulletproof syntax
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_user_count INT;
    v_assigned_role public.user_role;
    v_req_status TEXT;
    v_name TEXT;
BEGIN
    -- Check how many users exist
    SELECT COUNT(*) INTO v_user_count FROM public.users;
    
    -- If first user, make them admin
    IF v_user_count = 0 THEN
        v_assigned_role := 'admin'::public.user_role;
        v_req_status := 'approved';
    ELSE
        v_assigned_role := 'member'::public.user_role;
        -- Safely check metadata
        IF new.raw_user_meta_data IS NOT NULL AND new.raw_user_meta_data->>'request_admin' = 'true' THEN
            v_req_status := 'pending';
        ELSE
            v_req_status := 'none';
        END IF;
    END IF;

    -- Extract name safely
    IF new.raw_user_meta_data IS NOT NULL AND new.raw_user_meta_data->>'name' IS NOT NULL THEN
        v_name := new.raw_user_meta_data->>'name';
    ELSE
        v_name := 'New Member';
    END IF;

    -- Insert the new user
    INSERT INTO public.users (id, role, name, admin_request_status)
    VALUES (new.id, v_assigned_role, v_name, v_req_status);
    
    RETURN new;
END;
$$;

-- 3. Ensure the trigger is actually bound to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Update Policies
DROP POLICY IF EXISTS "Users can read own profile" ON public.users;
DROP POLICY IF EXISTS "Users can read own profile or Admins can read all" ON public.users;
DROP POLICY IF EXISTS "Admins can update users" ON public.users;

CREATE POLICY "Users can read own profile or Admins can read all" 
ON public.users 
FOR SELECT 
USING (auth.uid() = id OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can update users" 
ON public.users 
FOR UPDATE 
USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));
