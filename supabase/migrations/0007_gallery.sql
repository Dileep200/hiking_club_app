-- 0007_gallery.sql

CREATE TABLE gallery_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    image_url TEXT NOT NULL,
    caption TEXT,
    uploaded_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE gallery_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read gallery photos" ON gallery_photos FOR SELECT USING (true);
CREATE POLICY "Admins can insert gallery photos" ON gallery_photos FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Admins can delete gallery photos" ON gallery_photos FOR DELETE USING (public.is_admin());
