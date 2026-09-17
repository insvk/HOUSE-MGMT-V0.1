-- Add JSONB columns for standard configuration
ALTER TABLE users ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}'::jsonb;
ALTER TABLE houses ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}'::jsonb;

-- Create highly-restricted System Secrets Table
CREATE TABLE IF NOT EXISTS system_secrets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key_name VARCHAR(100) UNIQUE NOT NULL,
  key_value TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for Secrets
ALTER TABLE system_secrets ENABLE ROW LEVEL SECURITY;

-- Allow ONLY owners to read/write secrets.
-- We check the roles table to ensure the active user has the 'OWNER' role.
-- Note: In Supabase, auth.uid() returns the current authenticated user's ID.
DROP POLICY IF EXISTS "secrets_owner_policy" ON system_secrets;
CREATE POLICY "secrets_owner_policy" 
ON system_secrets
FOR ALL 
TO public 
USING (
  EXISTS (
    SELECT 1 FROM roles 
    WHERE roles.user_id = auth.uid() 
    AND roles.role_type = 'OWNER'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM roles 
    WHERE roles.user_id = auth.uid() 
    AND roles.role_type = 'OWNER'
  )
);
