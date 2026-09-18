-- ==============================================================================
-- MADURA HOUSE — CLEANUP DUPLICATE / TYPO ACCOUNTS & ENABLE REALTIME SYNC
-- Run this in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/kbvjnshgyuwkcvicwefh/sql/new
-- ==============================================================================

-- 1. ENABLE SUPABASE REALTIME ON ALL TABLES FOR LIVE SYNC ACROSS DEVICES
DO $$ BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.users;
  EXCEPTION WHEN duplicate_object THEN
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.houses;
  EXCEPTION WHEN duplicate_object THEN
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.maintenance_records;
  EXCEPTION WHEN duplicate_object THEN
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.expenses;
  EXCEPTION WHEN duplicate_object THEN
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.invoices;
  EXCEPTION WHEN duplicate_object THEN
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  EXCEPTION WHEN duplicate_object THEN
  END;
END $$;

-- 2. Delete all misspelled typo accounts: chemadur.com (missing the 'a')
DELETE FROM public.users WHERE email = 'sampathkumar@chemadur.com' OR email LIKE '%@chemadur.com';
DELETE FROM auth.users  WHERE email = 'sampathkumar@chemadur.com' OR email LIKE '%@chemadur.com';

-- 3. Remove any secondary/duplicate rows for sampathkumar@chemadura.com
DELETE FROM public.users 
WHERE LOWER(email) = 'sampathkumar@chemadura.com' 
  AND id != 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

-- 4. Ensure the canonical Sampath Kumar account exists with OWNER role & correct phone
INSERT INTO public.users (
  id, 
  email, 
  full_name, 
  phone, 
  flat_number, 
  role, 
  occupancy_status, 
  is_active, 
  payment_status
)
VALUES (
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'sampathkumar@chemadura.com',
  'Sampath Kumar',
  '+91 7338716690',
  'Owner Suite',
  'OWNER',
  'active',
  true,
  'paid'
) ON CONFLICT (id) DO UPDATE SET
  email            = EXCLUDED.email,
  full_name        = EXCLUDED.full_name,
  phone            = EXCLUDED.phone,
  flat_number      = EXCLUDED.flat_number,
  role             = 'OWNER',
  occupancy_status = 'active',
  is_active        = true,
  deleted_at       = NULL,
  updated_at       = now();

-- 5. Ensure rsivanaresh@gmail.com is also active OWNER
UPDATE public.users
SET role = 'OWNER', is_active = true, deleted_at = NULL, updated_at = now()
WHERE email = 'rsivanaresh@gmail.com';

-- 6. Verification query — confirm clean, deduplicated resident directory
SELECT id, email, role, full_name, phone, flat_number, is_active, deleted_at
FROM public.users
ORDER BY role DESC, full_name ASC;
