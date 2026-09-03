-- 0010_trips_fix.sql

ALTER TABLE trips ADD COLUMN IF NOT EXISTS distance TEXT;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS difficulty TEXT;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Trips Policies for Admin
DROP POLICY IF EXISTS "Admins can insert trips" ON trips;
DROP POLICY IF EXISTS "Admins can update trips" ON trips;
DROP POLICY IF EXISTS "Admins can delete trips" ON trips;

CREATE POLICY "Admins can insert trips" ON trips FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update trips" ON trips FOR UPDATE USING (public.is_admin());
CREATE POLICY "Admins can delete trips" ON trips FOR DELETE USING (public.is_admin());
