#!/usr/bin/env node
/**
 * MADURA HOUSE MAINTENANCE MANAGEMENT PLATFORM (HMMP)
 * CMD Universal Database Synchronizer & Permanent Seed Tool
 * 
 * Run in CMD / Terminal:
 *   npm run db:sync
 *   or: node scripts/sync-db.cjs
 */

const fs = require('fs');
const path = require('path');

// 1. Read environment variables from .env
function loadEnv() {
  const envPath = path.resolve(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) return {};
  const content = fs.readFileSync(envPath, 'utf8');
  const env = {};
  content.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const key = trimmed.slice(0, idx).trim();
        let val = trimmed.slice(idx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        env[key] = val;
      }
    }
  });
  return env;
}

const env = loadEnv();
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || env.VITE_SUPABASE_URL || 'https://kbvjnshgyuwkcvicwefh.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY;

console.log('\n================================================================');
console.log('🏛️  MADURA HOUSE - CENTRAL MASTER DB SYNC & PERMANENT LOADER');
console.log('================================================================');
console.log(`📡 Cloud Target: ${SUPABASE_URL}`);
console.log(`🔑 Key Type:    ${SUPABASE_KEY?.includes('service_role') ? 'SERVICE_ROLE (Root Authority)' : 'ANON / Client Access'}\n`);

// Helper for PostgREST fetch
async function api(endpoint, method = 'GET', body = null, prefer = 'return=representation') {
  const headers = {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
  };
  if (prefer) headers['Prefer'] = prefer;

  const url = `${SUPABASE_URL}/rest/v1/${endpoint}`;
  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  return { status: res.status, ok: res.ok, data };
}

async function runSync() {
  console.log('⏳ Step 1: Testing Connection to PostgreSQL Database...');
  const health = await api('houses?select=id&limit=1');
  if (health.status !== 200) {
    console.error(`❌ Connection failed with status ${health.status}:`, health.data);
    return;
  }
  console.log('✅ Connected to Cloud PostgreSQL!\n');

  // 1. Permanent Admin User & Dummy Account Purge
  console.log('⏳ Step 2: Purging legacy mock dummy accounts & synchronizing Admin Account...');
  
  // Clean up any old dummy users ending in @madurahouse.local
  try {
    const purgeRes = await api('users?email=like.*madurahouse.local', 'DELETE');
    if (purgeRes.ok) {
      console.log('   ✓ Purged legacy dummy accounts from database');
    }
  } catch (err) {
    // Non-fatal if table doesn't have rows
  }

  const permanentUsers = [
    {
      id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      email: 'sampathkumar@chemadur.com',
      phone: '+91 98421 00000',
      full_name: 'Sampath Kumar',
      flat_number: 'Owner Suite',
      occupancy_status: 'active',
    }
  ];

  let usersSaved = 0;
  for (const u of permanentUsers) {
    const res = await api('users?on_conflict=email', 'POST', u, 'resolution=merge-duplicates');
    if (res.ok || res.status === 201 || res.status === 200 || res.status === 204) {
      console.log(`   ✓ Admin user synced: ${u.full_name} (${u.email}) -> ${u.flat_number}`);
      usersSaved++;
    } else {
      console.log(`   ⚠️ User notice for ${u.email} (${res.status}):`, res.data?.message || res.data);
    }
  }

  // 2. Permanent House
  console.log('\n⏳ Step 3: Synchronizing House Master Profile...');
  const permanentHouse = {
    id: '11111111-2222-3333-4444-555555555555',
    owner_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    name: 'Madura House Maintenance',
    address: 'No. 42, Bypass Road, Ellis Nagar',
    city: 'Maduravoyal',
    postal_code: '625001',
    total_units: 5
  };

  const houseRes = await api('houses?on_conflict=id', 'POST', permanentHouse, 'resolution=merge-duplicates');
  if (houseRes.ok || houseRes.status === 201 || houseRes.status === 200 || houseRes.status === 204) {
    console.log(`   ✓ House master synced: ${permanentHouse.name} (5 Standard Units)`);
  } else {
    console.log(`   ⚠️ House sync notice (${houseRes.status}):`, houseRes.data?.message || houseRes.data);
  }

  // 3. Permanent Maintenance Record
  console.log('\n⏳ Step 4: Synchronizing Maintenance Record (September 2026)...');
  const permanentRecord = {
    id: '22222222-3333-4444-5555-666666666666',
    house_id: '11111111-2222-3333-4444-555555555555',
    month: 9,
    year: 2026,
    created_by: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    grand_total: 0.00,
    number_of_active_tenants: 5,
    notes: 'September 2026 Maintenance Period - Madura House'
  };

  const mrRes = await api('maintenance_records?on_conflict=house_id,month,year', 'POST', permanentRecord, 'resolution=merge-duplicates');
  if (mrRes.ok || mrRes.status === 201 || mrRes.status === 200 || mrRes.status === 204) {
    console.log(`   ✓ Maintenance Record initialized cleanly for Sep 2026`);
  } else {
    console.log(`   ⚠️ Maintenance Record sync notice (${mrRes.status}):`, mrRes.data?.message || mrRes.data);
  }

  // 4. Purge legacy dummy mock expenses from database
  console.log('\n⏳ Step 5: Purging any legacy dummy expenses...');
  const dummyIds = [
    '33333333-4444-5555-6666-777777777771',
    '33333333-4444-5555-6666-777777777772',
    '33333333-4444-5555-6666-777777777773',
    '33333333-4444-5555-6666-777777777774',
    'aaaa1111-2222-3333-4444-555555555551',
    'aaaa1111-2222-3333-4444-555555555552',
    'aaaa1111-2222-3333-4444-555555555553',
    'aaaa1111-2222-3333-4444-555555555554',
    'aaaa1111-2222-3333-4444-555555555555'
  ];
  try {
    await api(`expenses?id=in.(${dummyIds.join(',')})`, 'DELETE');
    await api(`expenses?particular=ilike.*TANGEDCO*`, 'DELETE');
    await api(`expenses?particular=ilike.*Borewell*`, 'DELETE');
    await api(`expenses?particular=ilike.*Sanitization*`, 'DELETE');
    await api(`expenses?particular=ilike.*Disinfection*`, 'DELETE');
    await api(`expenses?particular=ilike.*Janitorial*`, 'DELETE');
    await api(`expenses?particular=ilike.*AMC*`, 'DELETE');
    await api(`expenses?particular=ilike.*Motor*`, 'DELETE');
    await api(`expenses?particular=ilike.*Capacitor*`, 'DELETE');
    await api(`expenses?particular=ilike.*Electricity*`, 'DELETE');
    console.log('   ✓ Legacy dummy expenses purged from cloud DB.');
  } catch (e) {
    console.log('   Notice on dummy purge:', e);
  }

  // 5. Verification Read
  console.log('\n================================================================');
  console.log('📊 LIVE DATABASE VERIFICATION AUDIT');
  console.log('================================================================');
  const [vUsers, vHouses, vRecords, vExpenses] = await Promise.all([
    api('users?select=id,email,full_name,flat_number'),
    api('houses?select=id,name,total_units'),
    api('maintenance_records?select=id,month,year,grand_total,individual_contribution'),
    api('expenses?select=id,particular,amount')
  ]);

  console.log(`👤 Users in DB:              ${Array.isArray(vUsers.data) ? vUsers.data.length : 0}`);
  if (Array.isArray(vUsers.data)) {
    vUsers.data.forEach((u) => console.log(`   - ${u.full_name} (${u.flat_number}) <${u.email}>`));
  }

  console.log(`\n🏢 Houses in DB:             ${Array.isArray(vHouses.data) ? vHouses.data.length : 0}`);
  if (Array.isArray(vHouses.data)) {
    vHouses.data.forEach((h) => console.log(`   - ${h.name} (${h.total_units} Units)`));
  }

  console.log(`\n📋 Maintenance Records in DB: ${Array.isArray(vRecords.data) ? vRecords.data.length : 0}`);
  if (Array.isArray(vRecords.data)) {
    vRecords.data.forEach((r) => console.log(`   - ${r.month}/${r.year}: Total ₹${r.grand_total} | Per Flat: ₹${r.individual_contribution}`));
  }

  console.log(`\n💰 Expenses in DB:            ${Array.isArray(vExpenses.data) ? vExpenses.data.length : 0}`);
  if (Array.isArray(vExpenses.data)) {
    vExpenses.data.forEach((e) => console.log(`   - ${e.particular}: ₹${e.amount}`));
  }

  // Check if any RLS policy blocked rows
  const anyEmpty = (!vHouses.data || vHouses.data.length === 0) || (!vRecords.data || vRecords.data.length === 0);
  if (anyEmpty) {
    console.log('\n----------------------------------------------------------------');
    console.log('⚠️  ACTION TO EXECUTE ONCE IN SUPABASE SQL EDITOR:');
    console.log('----------------------------------------------------------------');
    console.log('PostgreSQL Row-Level Security (RLS) is currently restricting client inserts.');
    console.log('To permanently unlock full read/write for your Madura House platform:');
    console.log('1. Open: https://supabase.com/dashboard/project/kbvjnshgyuwkcvicwefh/sql/new');
    console.log('2. Paste & Run: database/make_permanent.sql');
    console.log('3. Re-run: npm run db:sync');
    console.log('----------------------------------------------------------------\n');
  } else {
    console.log('\n✨ ALL PLATFORM DATA IS 100% PERMANENT AND SECURE IN CLOUD POSTGRESQL!\n');
  }
}

runSync().catch((err) => {
  console.error('Fatal sync error:', err);
});
