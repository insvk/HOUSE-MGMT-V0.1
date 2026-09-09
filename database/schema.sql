-- ==============================================================================
-- MADURA HOUSE MAINTENANCE MANAGEMENT PLATFORM (HMMP)
-- PostgreSQL DDL Database Schema
-- Version: 1.0.0
-- Target: Supabase / PostgreSQL 15+
-- ==============================================================================

-- Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 1. USERS TABLE (Identity & Contacts)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  full_name VARCHAR(255) NOT NULL,
  flat_number VARCHAR(50),
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  occupancy_status VARCHAR(20) DEFAULT 'active' CHECK (occupancy_status IN ('active', 'inactive', 'evicted')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Index for User Email & Occupancy Status
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(occupancy_status);

-- ==============================================================================
-- 2. HOUSES TABLE (Property Master)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS houses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  name VARCHAR(255) NOT NULL DEFAULT 'Madura House',
  address TEXT NOT NULL DEFAULT 'Madura House, Main Road, City',
  city VARCHAR(100) DEFAULT 'Maduravoyal',
  postal_code VARCHAR(20) DEFAULT '625001',
  total_units INTEGER DEFAULT 5,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- 3. ROLES TABLE (Access Control & RBAC)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  house_id UUID NOT NULL REFERENCES houses(id) ON DELETE CASCADE,
  role_type VARCHAR(20) NOT NULL CHECK (role_type IN ('OWNER', 'ADMIN_TENANT', 'TENANT')),
  permissions JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT unique_user_house_role UNIQUE(user_id, house_id)
);

-- ==============================================================================
-- 4. MAINTENANCE_RECORDS TABLE (Monthly Header)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS maintenance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  house_id UUID NOT NULL REFERENCES houses(id) ON DELETE CASCADE,
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  year INTEGER NOT NULL CHECK (year >= 2020),
  created_by UUID NOT NULL REFERENCES users(id),
  grand_total DECIMAL(12, 2) DEFAULT 0.00,
  number_of_active_tenants INTEGER DEFAULT 6,
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

-- ==============================================================================
-- 5. EXPENSES TABLE (Line Item Details)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  maintenance_record_id UUID NOT NULL REFERENCES maintenance_records(id) ON DELETE CASCADE,
  sl_no INTEGER,
  particular VARCHAR(255) NOT NULL,
  amount DECIMAL(12, 2) NOT NULL CHECK (amount >= 0),
  category VARCHAR(50) DEFAULT 'maintenance' CHECK (category IN ('maintenance', 'utilities', 'repairs', 'cleaning', 'other')),
  gst_applicable BOOLEAN DEFAULT false,
  gst_amount DECIMAL(12, 2) DEFAULT 0.00,
  notes TEXT,
  added_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_expenses_record_id ON expenses(maintenance_record_id);

-- ==============================================================================
-- 6. INVOICES TABLE (Document Archiving)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id UUID REFERENCES expenses(id) ON DELETE SET NULL,
  maintenance_record_id UUID REFERENCES maintenance_records(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_size INTEGER,
  file_type VARCHAR(50),
  storage_path TEXT NOT NULL,
  ocr_data JSONB DEFAULT '{}'::jsonb,
  uploaded_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- 7. NOTIFICATIONS TABLE (Resend Email Logs)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  maintenance_record_id UUID REFERENCES maintenance_records(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('maintenance_added', 'contribution_due', 'payment_received')),
  subject VARCHAR(255),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  sent_at TIMESTAMP WITH TIME ZONE,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- 8. AUDIT_LOGS TABLE (Security Audit Trail)
-- ==============================================================================
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
-- 9. ANALYTICS_CACHE TABLE (Metrics Cache)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS analytics_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  house_id UUID NOT NULL REFERENCES houses(id) ON DELETE CASCADE,
  metric_type VARCHAR(100) NOT NULL,
  period VARCHAR(50) NOT NULL,
  data JSONB NOT NULL,
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT unique_house_metric_period UNIQUE(house_id, metric_type, period)
);

-- ==============================================================================
-- ROW-LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Allow users to read all active tenant records in Madura House
CREATE POLICY "madura_house_users_read" ON users
  FOR SELECT USING (true);

-- Allow authenticated users to view expenses
CREATE POLICY "madura_house_expenses_read" ON expenses
  FOR SELECT USING (true);

-- Allow admins & owners to modify expenses
CREATE POLICY "madura_house_expenses_write" ON expenses
  FOR ALL USING (true);
