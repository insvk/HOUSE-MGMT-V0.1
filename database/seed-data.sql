-- ==============================================================================
-- MADURA HOUSE MAINTENANCE MANAGEMENT PLATFORM (HMMP)
-- Production Seed Script (Zero Dummy Expenses & Clean Admin Accounts)
-- Product Name: Madura House Maintenance
-- ==============================================================================

-- 1. Insert Property Owner (Sampath Kumar)
INSERT INTO users (id, email, phone, full_name, flat_number, occupancy_status)
VALUES (
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'sampathkumar@chemadur.com',
  '+91-9842100000',
  'Sampath Kumar',
  'Owner-Suite',
  'active'
) ON CONFLICT (email) DO NOTHING;

-- 2. Insert Admin Tenant (Rajesh Kumar)
INSERT INTO users (id, email, phone, full_name, flat_number, occupancy_status)
VALUES (
  'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
  'admin.tenant@madurahouse.local',
  '+91-9842111111',
  'Rajesh Kumar',
  'Flat-101',
  'active'
) ON CONFLICT (email) DO NOTHING;

-- 3. Insert Property Record for Madura House
INSERT INTO houses (id, owner_id, name, address, city, postal_code, total_units)
VALUES (
  '11111111-2222-3333-4444-555555555555',
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'Madura House',
  'No. 42, Bypass Road, Madurai',
  'Madurai',
  '625001',
  6
) ON CONFLICT DO NOTHING;

-- 4. Insert User Roles
INSERT INTO roles (user_id, house_id, role_type) VALUES
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '11111111-2222-3333-4444-555555555555', 'OWNER'),
('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', '11111111-2222-3333-4444-555555555555', 'ADMIN_TENANT')
ON CONFLICT DO NOTHING;

-- 5. Insert Active Monthly Maintenance Record (September 2026 - Clean State)
INSERT INTO maintenance_records (id, house_id, month, year, created_by, grand_total, number_of_active_tenants, notes)
VALUES (
  '22222222-3333-4444-5555-666666666666',
  '11111111-2222-3333-4444-555555555555',
  9,
  2026,
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  0.00,
  6,
  'September 2026 Active Maintenance Period - Madura House'
) ON CONFLICT DO NOTHING;
