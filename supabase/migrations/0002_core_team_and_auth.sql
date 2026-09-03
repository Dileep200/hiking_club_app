-- 0002_core_team_and_auth.sql

-- Core Team Table
CREATE TABLE core_team (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    position TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    year TEXT,
    photo_url TEXT
);

-- Enable RLS for core_team
ALTER TABLE core_team ENABLE ROW LEVEL SECURITY;

-- RLS Policies for core_team
-- Anyone can read the core team
CREATE POLICY "Anyone can read core team" 
ON core_team 
FOR SELECT 
USING (true);

-- Only admins can insert/update/delete core team members
CREATE POLICY "Admins can insert core team" 
ON core_team 
FOR INSERT 
WITH CHECK (
    EXISTS (
        SELECT 1 
        FROM users 
        WHERE users.id = auth.uid() AND users.role = 'admin'
    )
);

CREATE POLICY "Admins can update core team" 
ON core_team 
FOR UPDATE 
USING (
    EXISTS (
        SELECT 1 
        FROM users 
        WHERE users.id = auth.uid() AND users.role = 'admin'
    )
);

CREATE POLICY "Admins can delete core team" 
ON core_team 
FOR DELETE 
USING (
    EXISTS (
        SELECT 1 
        FROM users 
        WHERE users.id = auth.uid() AND users.role = 'admin'
    )
);

-- Update Trips RLS so only admins can insert/update/delete (it already had SELECT for anyone)
CREATE POLICY "Admins can insert trips" 
ON trips 
FOR INSERT 
WITH CHECK (
    EXISTS (
        SELECT 1 
        FROM users 
        WHERE users.id = auth.uid() AND users.role = 'admin'
    )
);

CREATE POLICY "Admins can update trips" 
ON trips 
FOR UPDATE 
USING (
    EXISTS (
        SELECT 1 
        FROM users 
        WHERE users.id = auth.uid() AND users.role = 'admin'
    )
);

CREATE POLICY "Admins can delete trips" 
ON trips 
FOR DELETE 
USING (
    EXISTS (
        SELECT 1 
        FROM users 
        WHERE users.id = auth.uid() AND users.role = 'admin'
    )
);

-- Function to handle new user signups
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, role, name)
    VALUES (new.id, 'member', COALESCE(new.raw_user_meta_data->>'name', 'New Member'));
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function every time a user signs up
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
