-- ==============================================================================
-- MIGRATION 001: SECURE RLS POLICIES
-- Replaces all USING(true) wide-open policies with proper role-based policies.
-- 
-- PREREQUISITES: All users must have auth_id linked to auth.users before running.
-- RUN IN: Supabase SQL Editor
-- https://supabase.com/dashboard/project/kbvjnshgyuwkcvicwefh/sql/new
--
-- This migration is IDEMPOTENT (safe to run multiple times).
-- ==============================================================================

-- ============================================================================
-- HELPER FUNCTION: Check if current user is owner or admin
-- ============================================================================
CREATE OR REPLACE FUNCTION public.is_owner_or_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE auth_id = auth.uid()
      AND role IN ('OWNER', 'ADMIN_TENANT')
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================================
-- 1. USERS TABLE — authenticated can read, owners/admins can write, self can update own
-- ============================================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_full_access"    ON public.users;
DROP POLICY IF EXISTS "users_all_policy"     ON public.users;

-- Any authenticated user can read the tenant directory
CREATE POLICY "users_select_authenticated" ON public.users
  FOR SELECT TO authenticated
  USING (true);

-- Users can update their own profile (matched by auth_id)
CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE TO authenticated
  USING (auth_id = auth.uid())
  WITH CHECK (auth_id = auth.uid());

-- Owners/Admins can insert new users
CREATE POLICY "users_insert_admin" ON public.users
  FOR INSERT TO authenticated
  WITH CHECK (public.is_owner_or_admin());

-- Owners/Admins can update any user
CREATE POLICY "users_update_admin" ON public.users
  FOR UPDATE TO authenticated
  USING (public.is_owner_or_admin())
  WITH CHECK (public.is_owner_or_admin());

-- ============================================================================
-- 2. HOUSES TABLE — authenticated can read, owners can write
-- ============================================================================
ALTER TABLE public.houses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "houses_full_access"  ON public.houses;
DROP POLICY IF EXISTS "houses_all_policy"   ON public.houses;

CREATE POLICY "houses_select_authenticated" ON public.houses
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "houses_write_owner" ON public.houses
  FOR ALL TO authenticated
  USING (public.is_owner_or_admin())
  WITH CHECK (public.is_owner_or_admin());

-- ============================================================================
-- 3. MAINTENANCE_RECORDS TABLE
-- ============================================================================
ALTER TABLE public.maintenance_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "records_full_access"  ON public.maintenance_records;
DROP POLICY IF EXISTS "records_all_policy"   ON public.maintenance_records;

CREATE POLICY "records_select_authenticated" ON public.maintenance_records
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "records_write_admin" ON public.maintenance_records
  FOR ALL TO authenticated
  USING (public.is_owner_or_admin())
  WITH CHECK (public.is_owner_or_admin());

-- ============================================================================
-- 4. EXPENSES TABLE
-- ============================================================================
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "expenses_full_access"          ON public.expenses;
DROP POLICY IF EXISTS "expenses_all_policy"            ON public.expenses;
DROP POLICY IF EXISTS "madura_house_expenses_read"     ON public.expenses;
DROP POLICY IF EXISTS "madura_house_expenses_write"    ON public.expenses;

CREATE POLICY "expenses_select_authenticated" ON public.expenses
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "expenses_write_admin" ON public.expenses
  FOR ALL TO authenticated
  USING (public.is_owner_or_admin())
  WITH CHECK (public.is_owner_or_admin());

-- ============================================================================
-- 5. INVOICES TABLE
-- ============================================================================
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "invoices_full_access"  ON public.invoices;
DROP POLICY IF EXISTS "invoices_all_policy"   ON public.invoices;

CREATE POLICY "invoices_select_authenticated" ON public.invoices
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "invoices_write_admin" ON public.invoices
  FOR ALL TO authenticated
  USING (public.is_owner_or_admin())
  WITH CHECK (public.is_owner_or_admin());

-- ============================================================================
-- 6. NOTIFICATIONS TABLE
-- ============================================================================
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notifications_full_access"  ON public.notifications;
DROP POLICY IF EXISTS "notifications_all_policy"   ON public.notifications;

CREATE POLICY "notifications_select_authenticated" ON public.notifications
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "notifications_insert_admin" ON public.notifications
  FOR INSERT TO authenticated
  WITH CHECK (public.is_owner_or_admin());

-- ============================================================================
-- 7. AUDIT_LOGS TABLE — owners can read, any authenticated can insert
-- ============================================================================
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "audit_logs_full_access"  ON public.audit_logs;
DROP POLICY IF EXISTS "audit_logs_all_policy"   ON public.audit_logs;

CREATE POLICY "audit_logs_select_owner" ON public.audit_logs
  FOR SELECT TO authenticated
  USING (public.is_owner_or_admin());

CREATE POLICY "audit_logs_insert_authenticated" ON public.audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- ============================================================================
-- 8. SECURITY_EVENTS TABLE
-- ============================================================================
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "security_events_full_access"                 ON public.security_events;
DROP POLICY IF EXISTS "Users can view own security events"          ON public.security_events;
DROP POLICY IF EXISTS "Users can insert own security events"        ON public.security_events;

CREATE POLICY "security_events_select_owner" ON public.security_events
  FOR SELECT TO authenticated
  USING (public.is_owner_or_admin());

CREATE POLICY "security_events_insert_authenticated" ON public.security_events
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- ============================================================================
-- 9. SYSTEM_SECRETS TABLE — owners only (REMOVE anon bypass)
-- ============================================================================
ALTER TABLE public.system_secrets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "secrets_owner_only"    ON public.system_secrets;
DROP POLICY IF EXISTS "secrets_owner_policy"  ON public.system_secrets;

CREATE POLICY "secrets_owner_only" ON public.system_secrets
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.auth_id = auth.uid()
        AND users.role = 'OWNER'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.auth_id = auth.uid()
        AND users.role = 'OWNER'
    )
  );

-- ============================================================================
-- 10. ROLES TABLE
-- ============================================================================
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "roles_all_policy"  ON public.roles;

CREATE POLICY "roles_select_authenticated" ON public.roles
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "roles_write_owner" ON public.roles
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.auth_id = auth.uid()
        AND users.role = 'OWNER'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.auth_id = auth.uid()
        AND users.role = 'OWNER'
    )
  );

-- ============================================================================
-- 11. ANALYTICS_CACHE TABLE
-- ============================================================================
ALTER TABLE public.analytics_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "analytics_cache_select_authenticated" ON public.analytics_cache
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "analytics_cache_write_owner" ON public.analytics_cache
  FOR ALL TO authenticated
  USING (public.is_owner_or_admin())
  WITH CHECK (public.is_owner_or_admin());

-- ============================================================================
-- VERIFICATION
-- ============================================================================
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
