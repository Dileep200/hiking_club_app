-- 0004_admin_approval.sql

-- Add the request status column to users
ALTER TABLE users ADD COLUMN admin_request_status TEXT DEFAULT 'none'; -- none, pending, approved, rejected

-- Update the handle_new_user function to implement the First-User Rule
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
DECLARE
    user_count INT;
    assigned_role user_role;
    req_status TEXT;
BEGIN
    -- Check how many users exist currently
    SELECT COUNT(*) INTO user_count FROM public.users;
    
    -- If this is the very first user, make them admin automatically
    IF user_count = 0 THEN
        assigned_role := 'admin';
        req_status := 'approved';
    ELSE
        assigned_role := 'member';
        -- Check if they requested admin in their signup metadata
        IF new.raw_user_meta_data->>'request_admin' = 'true' THEN
            req_status := 'pending';
        ELSE
            req_status := 'none';
        END IF;
    END IF;

    INSERT INTO public.users (id, role, name, admin_request_status)
    VALUES (new.id, assigned_role, COALESCE(new.raw_user_meta_data->>'name', 'New Member'), req_status);
    
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add RLS policy so Admins can update the users table (to approve requests)
-- First, drop any existing restrictive policies on users if necessary
-- By default, users could only read their own profile. We need to let admins read all and update all.
DROP POLICY IF EXISTS "Users can read own profile" ON users;

CREATE POLICY "Users can read own profile or Admins can read all" 
ON users 
FOR SELECT 
USING (auth.uid() = id OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can update users" 
ON users 
FOR UPDATE 
USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));
