-- Migration: Add Username to Users Table
-- This script adds a unique username column to the public.users table

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.users ADD COLUMN username TEXT UNIQUE;
    EXCEPTION
        WHEN duplicate_column THEN
            -- Column already exists, do nothing
    END;
END $$;

-- Optional: Create an index for faster reverse-lookups during login
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);
