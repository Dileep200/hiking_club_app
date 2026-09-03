-- 0001_initial_schema.sql

-- Enums
CREATE TYPE user_role AS ENUM ('admin', 'member');
CREATE TYPE trip_status AS ENUM ('planned', 'in_progress', 'completed', 'cancelled');

-- Users Table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT auth.uid(),
    role user_role NOT NULL DEFAULT 'member',
    name TEXT NOT NULL
);

-- Trips Table
CREATE TABLE trips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    status trip_status NOT NULL DEFAULT 'planned',
    date DATE NOT NULL
);

-- Live Tracking Table
CREATE TABLE live_tracking (
    trip_id UUID PRIMARY KEY REFERENCES trips(id) ON DELETE CASCADE,
    lat DECIMAL(10, 8) NOT NULL,
    lng DECIMAL(11, 8) NOT NULL
);

-- Transactions Table
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    amount DECIMAL(12, 2) NOT NULL,
    category TEXT NOT NULL
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Trips: Anyone can read
CREATE POLICY "Anyone can read trips" 
ON trips 
FOR SELECT 
USING (true);

-- Transactions: Only admins can insert
CREATE POLICY "Admins can insert transactions" 
ON transactions 
FOR INSERT 
WITH CHECK (
    EXISTS (
        SELECT 1 
        FROM users 
        WHERE users.id = auth.uid() AND users.role = 'admin'
    )
);

-- Live Tracking: Anyone can read
CREATE POLICY "Anyone can read live tracking" 
ON live_tracking 
FOR SELECT 
USING (true);

-- Users: Users can read their own profile
CREATE POLICY "Users can read own profile" 
ON users 
FOR SELECT 
USING (auth.uid() = id);
