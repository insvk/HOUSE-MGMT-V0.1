-- GOD MAXX AUTO-CONFIRMATION TRIGGER (FIXED)
-- This permanently removes the email confirmation requirement directly in the database.
-- It works by forcefully confirming every new user the millisecond they are created.

-- 1. Confirm all existing stuck users (Updated: confirmed_at is generated automatically)
UPDATE auth.users 
SET email_confirmed_at = now() 
WHERE email_confirmed_at IS NULL;

-- 2. Create the auto-confirm function
CREATE OR REPLACE FUNCTION public.auto_confirm_users()
RETURNS trigger AS $$
BEGIN
  -- Instantly confirm the email for every new user
  NEW.email_confirmed_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Drop the trigger if it already exists (to prevent errors)
DROP TRIGGER IF EXISTS auto_confirm_users_trigger ON auth.users;

-- 4. Attach the trigger to the auth.users table
CREATE TRIGGER auto_confirm_users_trigger
BEFORE INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.auto_confirm_users();
