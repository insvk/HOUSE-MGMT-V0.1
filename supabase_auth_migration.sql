-- Enterprise Auth Migration Script for Supabase
-- Copy and paste this into the Supabase SQL Editor to prepare your database for Enterprise Auth

-- 1. Create or Update public.users table for Supabase
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    email TEXT UNIQUE NOT NULL,
    "fullName" TEXT,
    phone TEXT,
    "flatNumber" TEXT,
    role TEXT DEFAULT 'TENANT',
    "occupancyStatus" TEXT DEFAULT 'active',
    "paymentStatus" TEXT DEFAULT 'pending',
    "avatarUrl" TEXT,
    "moveInDate" DATE,
    "rentAmount" NUMERIC,
    "depositAmount" NUMERIC,
    "emergencyContact" TEXT,
    notes TEXT,
    password TEXT -- Only for legacy auth, will be nulled out post-migration
);

-- Safely add columns if the table already existed but was missing them
DO $$
BEGIN
    BEGIN ALTER TABLE public.users ADD COLUMN auth_id UUID REFERENCES auth.users(id) ON DELETE SET NULL; EXCEPTION WHEN duplicate_column THEN END;
    BEGIN ALTER TABLE public.users ADD COLUMN email TEXT; EXCEPTION WHEN duplicate_column THEN END;
    BEGIN ALTER TABLE public.users ADD COLUMN "fullName" TEXT; EXCEPTION WHEN duplicate_column THEN END;
    BEGIN ALTER TABLE public.users ADD COLUMN phone TEXT; EXCEPTION WHEN duplicate_column THEN END;
    BEGIN ALTER TABLE public.users ADD COLUMN "flatNumber" TEXT; EXCEPTION WHEN duplicate_column THEN END;
    BEGIN ALTER TABLE public.users ADD COLUMN role TEXT DEFAULT 'TENANT'; EXCEPTION WHEN duplicate_column THEN END;
    BEGIN ALTER TABLE public.users ADD COLUMN "occupancyStatus" TEXT DEFAULT 'active'; EXCEPTION WHEN duplicate_column THEN END;
    BEGIN ALTER TABLE public.users ADD COLUMN "paymentStatus" TEXT DEFAULT 'pending'; EXCEPTION WHEN duplicate_column THEN END;
    BEGIN ALTER TABLE public.users ADD COLUMN "avatarUrl" TEXT; EXCEPTION WHEN duplicate_column THEN END;
    BEGIN ALTER TABLE public.users ADD COLUMN "moveInDate" DATE; EXCEPTION WHEN duplicate_column THEN END;
    BEGIN ALTER TABLE public.users ADD COLUMN "rentAmount" NUMERIC; EXCEPTION WHEN duplicate_column THEN END;
    BEGIN ALTER TABLE public.users ADD COLUMN "depositAmount" NUMERIC; EXCEPTION WHEN duplicate_column THEN END;
    BEGIN ALTER TABLE public.users ADD COLUMN "emergencyContact" TEXT; EXCEPTION WHEN duplicate_column THEN END;
    BEGIN ALTER TABLE public.users ADD COLUMN notes TEXT; EXCEPTION WHEN duplicate_column THEN END;
    BEGIN ALTER TABLE public.users ADD COLUMN password TEXT; EXCEPTION WHEN duplicate_column THEN END;
END $$;
-- 2. Create Security Events Audit Table
CREATE TABLE IF NOT EXISTS public.security_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    user_email TEXT NOT NULL,
    event_type TEXT NOT NULL, -- e.g., 'LOGIN_SUCCESS', 'PASSWORD_RESET_REQUESTED', 'TWO_FACTOR_ENABLED'
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Enable Row Level Security (RLS) on security_events
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only view their own security events
CREATE POLICY "Users can view own security events" ON public.security_events
    FOR SELECT
    USING (auth_id = auth.uid() OR user_email = current_setting('request.jwt.claims', true)::json->>'email');

-- Policy: Users can insert their own security events
CREATE POLICY "Users can insert own security events" ON public.security_events
    FOR INSERT
    WITH CHECK (auth_id = auth.uid() OR user_email = current_setting('request.jwt.claims', true)::json->>'email');

-- 4. Enable Row Level Security on public.users
-- Note: Assuming you want users to view all tenant profiles (like a directory) but only edit their own.
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone logged in can read the directory
CREATE POLICY "Authenticated users can read users" ON public.users
    FOR SELECT
    USING (auth.role() = 'authenticated' OR auth.role() = 'anon'); -- Anon allowed temporarily for JIT migration

-- Policy: Users can only update their own profile (or Admins can update all - requires an admin check)
CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE
    USING (auth_id = auth.uid() OR email = current_setting('request.jwt.claims', true)::json->>'email');

-- Policy: Admins can update any profile (assuming 'OWNER' role is checked)
CREATE POLICY "Admins can update any profile" ON public.users
    FOR UPDATE
    USING (
        (SELECT role FROM public.users WHERE auth_id = auth.uid() LIMIT 1) IN ('OWNER', 'ADMIN_TENANT')
        OR
        current_setting('request.jwt.claims', true)::json->>'email' IN ('sampathkumar@chemadur.com', 'production.chemadura26@gmail.com')
    );

-- 5. IMPORTANT MANUAL STEPS IN SUPABASE DASHBOARD:
-- Go to Authentication -> Providers -> Email
-- Ensure "Confirm email" is OFF if you want seamless Just-In-Time (JIT) migration for existing users.
-- Ensure "Secure password recovery" is ON.
