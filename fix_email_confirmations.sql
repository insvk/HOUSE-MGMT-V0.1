-- GOD MAXX AUTO-CONFIRM SCRIPT
-- This script forcefully confirms the email address of every user in the Supabase Auth system.
-- Run this in your Supabase SQL Editor to instantly unlock all "Email not confirmed" accounts!

UPDATE auth.users
SET email_confirmed_at = now(),
    confirmed_at = now()
WHERE email_confirmed_at IS NULL;
