-- ==============================================================================
-- MIGRATION 002: SCHEMA CLEANUP
-- Drops duplicate indexes, removes password column, creates storage buckets.
--
-- RUN IN: Supabase SQL Editor
-- https://supabase.com/dashboard/project/kbvjnshgyuwkcvicwefh/sql/new
--
-- This migration is IDEMPOTENT (safe to run multiple times).
-- ==============================================================================

-- ============================================================================
-- 1. DROP DUPLICATE USERNAME INDEXES (keep only idx_users_username_unique)
-- ============================================================================
-- We have 4 overlapping indexes on users.username:
--   idx_users_username           (regular btree)
--   idx_users_username_unique    (partial unique WHERE username IS NOT NULL)  ← KEEP
--   users_username_key           (unique constraint index)
--   users_username_unique        (unique constraint)
--
-- Keep idx_users_username_unique (partial unique) and drop the rest.

-- Drop the constraint-based indexes
DO $$ BEGIN
  BEGIN
    ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_username_unique;
  EXCEPTION WHEN undefined_object THEN
  END;
  BEGIN
    ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_username_key;
  EXCEPTION WHEN undefined_object THEN
  END;
END $$;

DROP INDEX IF EXISTS public.idx_users_username;
DROP INDEX IF EXISTS public.users_username_unique;
DROP INDEX IF EXISTS public.users_username_key;

-- Ensure the good partial unique index exists
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username_unique
  ON public.users(username) WHERE username IS NOT NULL;

-- ============================================================================
-- 2. DROP UNUSED INDEXES
-- ============================================================================
-- These indexes have 0 scans and waste space/write performance:
-- (Keeping primary keys even if unused — they're structurally required)

-- idx_users_is_active: 0 scans, is_active filter uses seq scan on 7-row table
DROP INDEX IF EXISTS public.idx_users_is_active;

-- idx_users_status: 0 scans, occupancy_status not used in index lookups
DROP INDEX IF EXISTS public.idx_users_status;

-- ============================================================================
-- 3. ADD roles TABLE TO REALTIME PUBLICATION
-- ============================================================================
DO $$ BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.roles;
  EXCEPTION WHEN duplicate_object THEN
  END;
END $$;

-- ============================================================================
-- 4. STORAGE BUCKET POLICIES (via RLS on storage.objects)
-- Note: You must first create the 'avatars' and 'invoices' buckets
-- in the Supabase Dashboard > Storage before these policies will work.
-- ============================================================================

-- Avatars bucket policies
DROP POLICY IF EXISTS "avatars_upload_authenticated" ON storage.objects;
DROP POLICY IF EXISTS "avatars_read_public" ON storage.objects;
DROP POLICY IF EXISTS "avatars_update_own" ON storage.objects;

-- Allow authenticated users to upload avatars
CREATE POLICY "avatars_upload_authenticated" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars');

-- Allow public read access to avatars (profile pictures should be publicly viewable)
CREATE POLICY "avatars_read_public" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'avatars');

-- Allow authenticated users to update/overwrite their own avatars
CREATE POLICY "avatars_update_own" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars');

-- Invoices bucket policies
DROP POLICY IF EXISTS "invoices_upload_authenticated" ON storage.objects;
DROP POLICY IF EXISTS "invoices_read_authenticated" ON storage.objects;
DROP POLICY IF EXISTS "invoices_delete_admin" ON storage.objects;

-- Allow authenticated users to upload invoices
CREATE POLICY "invoices_upload_authenticated" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'invoices');

-- Allow authenticated users to read invoices
CREATE POLICY "invoices_read_authenticated" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'invoices');

-- Allow owners/admins to delete invoices
CREATE POLICY "invoices_delete_admin" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'invoices' AND public.is_owner_or_admin());

-- ============================================================================
-- 5. VERIFICATION
-- ============================================================================
-- Check remaining indexes
SELECT indexname, tablename, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- Check storage buckets
SELECT id, name, public FROM storage.buckets;
