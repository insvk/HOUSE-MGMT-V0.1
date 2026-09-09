-- ==============================================================================
-- MADURA HOUSE MAINTENANCE MANAGEMENT PLATFORM (HMMP)
-- PERMANENT DATABASE SEED & RLS UNLOCK SCRIPT
-- Execute this script in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/kbvjnshgyuwkcvicwefh/sql/new
-- ==============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 2. CREATE / VERIFY TABLES
-- ==============================================================================

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255),
  phone VARCHAR(20),
  full_name VARCHAR(255) NOT NULL,
  flat_number VARCHAR(50),
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  occupancy_status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS houses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL DEFAULT 'Madura House Maintenance',
  address TEXT NOT NULL DEFAULT 'No. 42, Bypass Road, Ellis Nagar',
  city VARCHAR(100) DEFAULT 'Maduravoyal',
  postal_code VARCHAR(20) DEFAULT '625001',
  total_units INTEGER DEFAULT 5,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  house_id UUID NOT NULL REFERENCES houses(id) ON DELETE CASCADE,
  role_type VARCHAR(20) NOT NULL,
  permissions JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT unique_user_house_role UNIQUE(user_id, house_id)
);

CREATE TABLE IF NOT EXISTS maintenance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  house_id UUID REFERENCES houses(id) ON DELETE CASCADE,
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  year INTEGER NOT NULL CHECK (year >= 2020),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  grand_total DECIMAL(12, 2) DEFAULT 0.00,
  number_of_active_tenants INTEGER DEFAULT 5,
  individual_contribution DECIMAL(12, 2) GENERATED ALWAYS AS (
    CASE 
      WHEN number_of_active_tenants > 0 THEN grand_total / number_of_active_tenants 
      ELSE 0.00 
    END
  ) STORED,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT unique_house_month_year UNIQUE(house_id, month, year)
);

CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  maintenance_record_id UUID REFERENCES maintenance_records(id) ON DELETE CASCADE,
  sl_no INTEGER,
  particular VARCHAR(255) NOT NULL,
  amount DECIMAL(12, 2) NOT NULL CHECK (amount >= 0),
  category VARCHAR(50) DEFAULT 'maintenance',
  gst_applicable BOOLEAN DEFAULT false,
  gst_amount DECIMAL(12, 2) DEFAULT 0.00,
  notes TEXT,
  added_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id UUID REFERENCES expenses(id) ON DELETE SET NULL,
  maintenance_record_id UUID REFERENCES maintenance_records(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_size INTEGER,
  file_type VARCHAR(50),
  storage_path TEXT NOT NULL,
  ocr_data JSONB DEFAULT '{}'::jsonb,
  uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  maintenance_record_id UUID REFERENCES maintenance_records(id) ON DELETE CASCADE,
  recipient_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  subject VARCHAR(255),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  sent_at TIMESTAMP WITH TIME ZONE,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(255) NOT NULL,
  resource_type VARCHAR(100),
  resource_id UUID,
  changes JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- 3. PERMISSIVE ROW LEVEL SECURITY (ALLOW FULL SYNC & PERMANENT STORAGE)
-- ==============================================================================

-- Houses
ALTER TABLE houses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "houses_all_policy" ON houses;
CREATE POLICY "houses_all_policy" ON houses FOR ALL TO public USING (true) WITH CHECK (true);

-- Users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "users_all_policy" ON users;
DROP POLICY IF EXISTS "madura_house_users_read" ON users;
CREATE POLICY "users_all_policy" ON users FOR ALL TO public USING (true) WITH CHECK (true);

-- Maintenance Records
ALTER TABLE maintenance_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "records_all_policy" ON maintenance_records;
CREATE POLICY "records_all_policy" ON maintenance_records FOR ALL TO public USING (true) WITH CHECK (true);

-- Expenses
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "expenses_all_policy" ON expenses;
DROP POLICY IF EXISTS "madura_house_expenses_read" ON expenses;
DROP POLICY IF EXISTS "madura_house_expenses_write" ON expenses;
CREATE POLICY "expenses_all_policy" ON expenses FOR ALL TO public USING (true) WITH CHECK (true);

-- Roles
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "roles_all_policy" ON roles;
CREATE POLICY "roles_all_policy" ON roles FOR ALL TO public USING (true) WITH CHECK (true);

-- Invoices
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "invoices_all_policy" ON invoices;
CREATE POLICY "invoices_all_policy" ON invoices FOR ALL TO public USING (true) WITH CHECK (true);

-- Notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "notifications_all_policy" ON notifications;
CREATE POLICY "notifications_all_policy" ON notifications FOR ALL TO public USING (true) WITH CHECK (true);

-- Audit Logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "audit_logs_all_policy" ON audit_logs;
CREATE POLICY "audit_logs_all_policy" ON audit_logs FOR ALL TO public USING (true) WITH CHECK (true);

-- ==============================================================================
-- 4. INSERT / UPSERT PERMANENT USERS
-- ==============================================================================

-- Owner: Sampath Kumar
INSERT INTO users (id, email, password, phone, full_name, flat_number, occupancy_status)
VALUES (
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'sampathkumar@chemadur.com',
  'Sampath@123',
  '+91 98421 00000',
  'Sampath Kumar',
  'Owner Suite',
  'active'
) ON CONFLICT (email) DO UPDATE SET
  password = EXCLUDED.password,
  phone = EXCLUDED.phone,
  full_name = EXCLUDED.full_name,
  flat_number = EXCLUDED.flat_number,
  occupancy_status = EXCLUDED.occupancy_status,
  updated_at = timezone('utc'::text, now());

-- ==============================================================================
-- 5. INSERT / UPSERT PERMANENT HOUSE (PROPERTY MASTER)
-- ==============================================================================

INSERT INTO houses (id, owner_id, name, address, city, postal_code, total_units)
VALUES (
  '11111111-2222-3333-4444-555555555555',
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'Madura House Maintenance',
  'No. 42, Bypass Road, Ellis Nagar',
  'Maduravoyal',
  '625001',
  5
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  address = EXCLUDED.address,
  city = EXCLUDED.city,
  postal_code = EXCLUDED.postal_code,
  total_units = EXCLUDED.total_units,
  owner_id = EXCLUDED.owner_id,
  updated_at = timezone('utc'::text, now());

-- ==============================================================================
-- 6. INSERT / UPSERT USER ROLES
-- ==============================================================================

INSERT INTO roles (user_id, house_id, role_type) VALUES
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '11111111-2222-3333-4444-555555555555', 'OWNER'),
('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', '11111111-2222-3333-4444-555555555555', 'ADMIN_TENANT')
ON CONFLICT (user_id, house_id) DO UPDATE SET
  role_type = EXCLUDED.role_type,
  updated_at = timezone('utc'::text, now());

-- ==============================================================================
-- 7. INSERT / UPSERT MAINTENANCE RECORD (SEPTEMBER 2026)
-- ==============================================================================

INSERT INTO maintenance_records (id, house_id, month, year, created_by, grand_total, number_of_active_tenants, notes)
VALUES (
  '22222222-3333-4444-5555-666666666666',
  '11111111-2222-3333-4444-555555555555',
  9,
  2026,
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  10200.00,
  5,
  'September 2026 Active Maintenance Period - Madura House'
) ON CONFLICT (house_id, month, year) DO UPDATE SET
  grand_total = EXCLUDED.grand_total,
  number_of_active_tenants = EXCLUDED.number_of_active_tenants,
  notes = EXCLUDED.notes,
  updated_at = timezone('utc'::text, now());

-- ==============================================================================
-- 8. INSERT / UPSERT EXPENSES FOR SEPTEMBER 2026
-- ==============================================================================

INSERT INTO expenses (id, maintenance_record_id, sl_no, particular, amount, category, gst_applicable, gst_amount, notes, added_by)
VALUES
(
  '33333333-4444-5555-6666-777777777771',
  '22222222-3333-4444-5555-666666666666',
  1,
  'Common Area Electricity Bill (EB)',
  3200.00,
  'utilities',
  false,
  0.00,
  'TANGEDCO Meter #89214 - Staircase & Compound Lighting',
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
),
(
  '33333333-4444-5555-6666-777777777772',
  '22222222-3333-4444-5555-666666666666',
  2,
  'Motor Pump & Borewell Servicing',
  2500.00,
  'repairs',
  false,
  0.00,
  'Borewell capacitor replacement & plumbing maintenance by Sri Meenakshi Electricals',
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
),
(
  '33333333-4444-5555-6666-777777777773',
  '22222222-3333-4444-5555-666666666666',
  3,
  'Compound Cleaning & Waste Disposal',
  1800.00,
  'cleaning',
  false,
  0.00,
  'Monthly building corridor & perimeter sanitization service',
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
),
(
  '33333333-4444-5555-6666-777777777774',
  '22222222-3333-4444-5555-666666666666',
  4,
  'Terrace Water Tank Sanitization',
  2700.00,
  'maintenance',
  false,
  0.00,
  'Bi-monthly overhead storage reservoir cleaning & chlorine treatment',
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
)
ON CONFLICT (id) DO UPDATE SET
  particular = EXCLUDED.particular,
  amount = EXCLUDED.amount,
  category = EXCLUDED.category,
  notes = EXCLUDED.notes,
  updated_at = timezone('utc'::text, now());

-- ==============================================================================
-- 9. VERIFICATION QUERY (RUN TO CONFIRM EVERYTHING LOADED PERMANENTLY)
-- ==============================================================================
SELECT 'Houses Count' as metric, count(*)::text as value FROM houses
UNION ALL
SELECT 'Users Count', count(*)::text FROM users
UNION ALL
SELECT 'Records Count', count(*)::text FROM maintenance_records
UNION ALL
SELECT 'Expenses Count', count(*)::text FROM expenses;
