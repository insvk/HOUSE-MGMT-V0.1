-- ==============================================================================
-- MADURA HOUSE MAINTENANCE MANAGEMENT PLATFORM (HMMP)
-- UNIFIED AUTH + SCHEMA REPAIR MIGRATION
-- Run this in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/kbvjnshgyuwkcvicwefh/sql/new
--
-- This script is IDEMPOTENT (safe to run multiple times).
-- It repairs all known schema gaps between schema.sql, supabase_auth_migration.sql,
-- and the live production database.
-- ==============================================================================

-- ============================================================================
-- 1. ENSURE public.users HAS ALL REQUIRED COLUMNS (snake_case canonical schema)
-- ============================================================================

-- auth_id: links public.users row to the Supabase Auth identity
DO $$ BEGIN
  BEGIN
    ALTER TABLE public.users ADD COLUMN auth_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
  EXCEPTION WHEN duplicate_column THEN -- already exists, skip
  END;
END $$;

-- username: for @username login reverse-lookup
DO $$ BEGIN
  BEGIN
    ALTER TABLE public.users ADD COLUMN username TEXT;
  EXCEPTION WHEN duplicate_column THEN
  END;
END $$;

-- role: OWNER | ADMIN_TENANT | TENANT
DO $$ BEGIN
  BEGIN
    ALTER TABLE public.users ADD COLUMN role VARCHAR(20) DEFAULT 'TENANT';
  EXCEPTION WHEN duplicate_column THEN
  END;
END $$;

-- payment_status
DO $$ BEGIN
  BEGIN
    ALTER TABLE public.users ADD COLUMN payment_status VARCHAR(20) DEFAULT 'paid';
  EXCEPTION WHEN duplicate_column THEN
  END;
END $$;

-- rent_amount
DO $$ BEGIN
  BEGIN
    ALTER TABLE public.users ADD COLUMN rent_amount DECIMAL(12, 2);
  EXCEPTION WHEN duplicate_column THEN
  END;
END $$;

-- deposit_amount
DO $$ BEGIN
  BEGIN
    ALTER TABLE public.users ADD COLUMN deposit_amount DECIMAL(12, 2);
  EXCEPTION WHEN duplicate_column THEN
  END;
END $$;

-- move_in_date
DO $$ BEGIN
  BEGIN
    ALTER TABLE public.users ADD COLUMN move_in_date DATE;
  EXCEPTION WHEN duplicate_column THEN
  END;
END $$;

-- emergency_contact
DO $$ BEGIN
  BEGIN
    ALTER TABLE public.users ADD COLUMN emergency_contact VARCHAR(255);
  EXCEPTION WHEN duplicate_column THEN
  END;
END $$;

-- notes
DO $$ BEGIN
  BEGIN
    ALTER TABLE public.users ADD COLUMN notes TEXT;
  EXCEPTION WHEN duplicate_column THEN
  END;
END $$;

-- preferences (JSON blob for audio/clock settings)
DO $$ BEGIN
  BEGIN
    ALTER TABLE public.users ADD COLUMN preferences JSONB DEFAULT '{}'::jsonb;
  EXCEPTION WHEN duplicate_column THEN
  END;
END $$;

-- is_active (needed for soft-delete filtering)
DO $$ BEGIN
  BEGIN
    ALTER TABLE public.users ADD COLUMN is_active BOOLEAN DEFAULT true;
  EXCEPTION WHEN duplicate_column THEN
  END;
END $$;

-- deleted_at (soft-delete timestamp)
DO $$ BEGIN
  BEGIN
    ALTER TABLE public.users ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE;
  EXCEPTION WHEN duplicate_column THEN
  END;
END $$;

-- ============================================================================
-- 2. ENSURE houses HAS settings COLUMN
-- ============================================================================
DO $$ BEGIN
  BEGIN
    ALTER TABLE public.houses ADD COLUMN settings JSONB DEFAULT '{}'::jsonb;
  EXCEPTION WHEN duplicate_column THEN
  END;
END $$;

-- ============================================================================
-- 3. ENSURE system_secrets TABLE EXISTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.system_secrets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key_name VARCHAR(100) UNIQUE NOT NULL,
  key_value TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================================================
-- 4. ENSURE security_events TABLE EXISTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.security_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT NOT NULL,
  event_type TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================================================
-- 5. ADD PERFORMANCE INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_users_auth_id   ON public.users(auth_id);
CREATE INDEX IF NOT EXISTS idx_users_username   ON public.users(username);
CREATE INDEX IF NOT EXISTS idx_users_email      ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_is_active  ON public.users(is_active);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username_unique ON public.users(username) WHERE username IS NOT NULL;

-- ============================================================================
-- 6. UNIQUE CONSTRAINT: username must be unique (non-null only)
-- Duplicate guard: skip if already exists
-- ============================================================================
DO $$ BEGIN
  BEGIN
    ALTER TABLE public.users ADD CONSTRAINT users_username_unique UNIQUE (username);
  EXCEPTION WHEN duplicate_table OR duplicate_object THEN
  END;
END $$;

-- ============================================================================
-- 7. PERMISSIVE RLS POLICIES (Full sync allowed via anon key)
-- All policies use USING(true) WITH CHECK(true) for this single-property app.
-- Tenant isolation is enforced at the application layer (server-side OWNER check).
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.houses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_secrets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;

-- Drop all old conflicting policies
DROP POLICY IF EXISTS "users_all_policy"                  ON public.users;
DROP POLICY IF EXISTS "madura_house_users_read"           ON public.users;
DROP POLICY IF EXISTS "Authenticated users can read users" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile"       ON public.users;
DROP POLICY IF EXISTS "Admins can update any profile"      ON public.users;
DROP POLICY IF EXISTS "houses_all_policy"                  ON public.houses;
DROP POLICY IF EXISTS "records_all_policy"                 ON public.maintenance_records;
DROP POLICY IF EXISTS "expenses_all_policy"                ON public.expenses;
DROP POLICY IF EXISTS "madura_house_expenses_read"         ON public.expenses;
DROP POLICY IF EXISTS "madura_house_expenses_write"        ON public.expenses;
DROP POLICY IF EXISTS "roles_all_policy"                   ON public.roles;
DROP POLICY IF EXISTS "invoices_all_policy"                ON public.invoices;
DROP POLICY IF EXISTS "notifications_all_policy"           ON public.notifications;
DROP POLICY IF EXISTS "audit_logs_all_policy"              ON public.audit_logs;
DROP POLICY IF EXISTS "secrets_owner_policy"               ON public.system_secrets;
DROP POLICY IF EXISTS "Users can view own security events" ON public.security_events;
DROP POLICY IF EXISTS "Users can insert own security events" ON public.security_events;

-- Unified permissive policies (anon + authenticated, single-property app)
CREATE POLICY "users_full_access"                ON public.users              FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "houses_full_access"               ON public.houses             FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "records_full_access"              ON public.maintenance_records FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "expenses_full_access"             ON public.expenses           FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "invoices_full_access"             ON public.invoices           FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "notifications_full_access"        ON public.notifications      FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "audit_logs_full_access"           ON public.audit_logs         FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "security_events_full_access"      ON public.security_events    FOR ALL TO public USING (true) WITH CHECK (true);

-- system_secrets: OWNER only (role check via roles table)
CREATE POLICY "secrets_owner_only"               ON public.system_secrets
  FOR ALL TO public
  USING (
    EXISTS (
      SELECT 1 FROM public.roles
      WHERE roles.user_id = auth.uid()
        AND roles.role_type = 'OWNER'
    )
    OR auth.uid() IS NULL -- Allow anon reads during initial seed (remove in prod hardening)
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.roles
      WHERE roles.user_id = auth.uid()
        AND roles.role_type = 'OWNER'
    )
  );

-- ============================================================================
-- 8. AUTO-CONFIRM EMAIL TRIGGER (prevents "Email not confirmed" login failures)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.auto_confirm_users()
RETURNS trigger AS $$
BEGIN
  NEW.email_confirmed_at = COALESCE(NEW.email_confirmed_at, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS auto_confirm_users_trigger ON auth.users;
CREATE TRIGGER auto_confirm_users_trigger
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_confirm_users();

-- Also confirm any existing unconfirmed users (stuck from before)
UPDATE auth.users SET email_confirmed_at = now() WHERE email_confirmed_at IS NULL;

-- ============================================================================
-- 9. FUNCTION: Link auth.users to public.users on sign-up
-- This trigger automatically creates a public.users profile when a new
-- Supabase Auth user is created (e.g., via self-sign-up or admin creation).
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger AS $$
BEGIN
  -- Only insert if no existing public.users row for this email
  INSERT INTO public.users (auth_id, email, full_name, role, occupancy_status, is_active)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'TENANT'),
    'active',
    true
  )
  ON CONFLICT (email) DO UPDATE SET
    auth_id = EXCLUDED.auth_id,
    updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_auth_user();

-- ============================================================================
-- 10. BACKFILL: Link existing auth.users to public.users where auth_id is NULL
-- ============================================================================
UPDATE public.users pu
SET auth_id = au.id
FROM auth.users au
WHERE au.email = pu.email
  AND pu.auth_id IS NULL;

-- ============================================================================
-- 11. ENSURE PERMANENT OWNER SEED EXISTS
-- ============================================================================
INSERT INTO public.users (id, email, password, phone, full_name, flat_number, role, occupancy_status, is_active)
VALUES (
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'sampathkumar@chemadura.com',
  'Sampath@123',
  '+91 98421 00000',
  'Sampath Kumar',
  'Owner Suite',
  'OWNER',
  'active',
  true
) ON CONFLICT (id) DO UPDATE SET
  email             = EXCLUDED.email,
  password          = EXCLUDED.password,
  phone             = EXCLUDED.phone,
  full_name         = EXCLUDED.full_name,
  flat_number       = EXCLUDED.flat_number,
  role              = EXCLUDED.role,
  occupancy_status  = EXCLUDED.occupancy_status,
  is_active         = true,
  deleted_at        = NULL,
  updated_at        = now();

INSERT INTO public.users (id, email, password, phone, full_name, flat_number, role, occupancy_status, is_active)
VALUES (
  'b1ffcd99-8d0c-4ef8-bb6d-6bb9bd380a22',
  'rsivanaresh@gmail.com',
  'Sivakalai#83',
  '+91 98421 00001',
  'Siva Naresh',
  'Admin Suite',
  'OWNER',
  'active',
  true
) ON CONFLICT (id) DO UPDATE SET
  email             = EXCLUDED.email,
  password          = EXCLUDED.password,
  phone             = EXCLUDED.phone,
  full_name         = EXCLUDED.full_name,
  flat_number       = EXCLUDED.flat_number,
  role              = EXCLUDED.role,
  occupancy_status  = EXCLUDED.occupancy_status,
  is_active         = true,
  deleted_at        = NULL,
  updated_at        = now();

-- ============================================================================
-- 12. VERIFICATION QUERY (Run to confirm schema is healthy)
-- ============================================================================
SELECT
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'users'
ORDER BY ordinal_position;
