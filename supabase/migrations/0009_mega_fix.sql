-- COMBINED FIX FOR GALLERY, EVENTS, AND FINANCE

-- 1. Create Gallery Table
CREATE TABLE IF NOT EXISTS gallery_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    image_url TEXT NOT NULL,
    caption TEXT,
    uploaded_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE gallery_photos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read gallery photos" ON gallery_photos;
DROP POLICY IF EXISTS "Admins can insert gallery photos" ON gallery_photos;
DROP POLICY IF EXISTS "Admins can delete gallery photos" ON gallery_photos;

CREATE POLICY "Anyone can read gallery photos" ON gallery_photos FOR SELECT USING (true);
CREATE POLICY "Admins can insert gallery photos" ON gallery_photos FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Admins can delete gallery photos" ON gallery_photos FOR DELETE USING (public.is_admin());

-- 2. Add missing columns to Events
ALTER TABLE events ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE events ALTER COLUMN type DROP NOT NULL;

-- 3. Fix the infinite recursion RLS for all V2 tables by using the is_admin() function

-- Events
DROP POLICY IF EXISTS "Admins can insert events" ON events;
DROP POLICY IF EXISTS "Admins can update events" ON events;
DROP POLICY IF EXISTS "Admins can delete events" ON events;

CREATE POLICY "Admins can insert events" ON events FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update events" ON events FOR UPDATE USING (public.is_admin());
CREATE POLICY "Admins can delete events" ON events FOR DELETE USING (public.is_admin());

-- Event Registrations
DROP POLICY IF EXISTS "Users can read own registrations" ON event_registrations;
DROP POLICY IF EXISTS "Admins can update attendance" ON event_registrations;

CREATE POLICY "Users can read own registrations" ON event_registrations FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Admins can update attendance" ON event_registrations FOR UPDATE USING (public.is_admin());

-- Announcements
DROP POLICY IF EXISTS "Admins can insert announcements" ON announcements;
CREATE POLICY "Admins can insert announcements" ON announcements FOR INSERT WITH CHECK (public.is_admin());

-- Trip Reports
DROP POLICY IF EXISTS "Admins can insert trip reports" ON trip_reports;
CREATE POLICY "Admins can insert trip reports" ON trip_reports FOR INSERT WITH CHECK (public.is_admin());

-- Transactions
DROP POLICY IF EXISTS "Admins can insert transactions" ON transactions;
CREATE POLICY "Admins can insert transactions" ON transactions FOR INSERT WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "Admins can delete transactions" ON transactions;
CREATE POLICY "Admins can delete transactions" ON transactions FOR DELETE USING (public.is_admin());
