-- 0011_club_settings.sql

CREATE TABLE club_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

ALTER TABLE club_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read club settings" ON club_settings FOR SELECT USING (true);
CREATE POLICY "Admins can update club settings" ON club_settings FOR UPDATE USING (public.is_admin());
CREATE POLICY "Admins can insert club settings" ON club_settings FOR INSERT WITH CHECK (public.is_admin());

INSERT INTO club_settings (key, value) VALUES ('contact_url', 'mailto:hikingclub@university.edu');
