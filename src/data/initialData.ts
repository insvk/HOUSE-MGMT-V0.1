import { House, User, MaintenanceRecord, Expense, Invoice, NotificationLog, AuditLog } from '../types';

export const initialHouse: House = {
  id: '11111111-2222-3333-4444-555555555555',
  name: 'Madura House Maintenance',
  address: 'No. 42, Bypass Road, Ellis Nagar',
  city: 'Maduravoyal',
  postalCode: '625001',
  totalUnits: 5,
  ownerId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
};

// Clean Production Accounts: Property Owner (Admin)
// Default credential constants — used only for initial login matching.
// NOT stored in the User objects to prevent leakage via localStorage/state.
export const DEFAULT_CREDENTIALS: Record<string, string> = {
  'sampathkumar@chemadur.com': 'Sampath@123',
};

/**
 * Utility to identify legacy dummy mock accounts and prevent their resurrection
 */
export const isDummyLegacyAccount = (email?: string): boolean => {
  if (!email) return true;
  const lower = email.toLowerCase().trim();
  if (lower === 'sampathkumar@chemadur.com') return false; // Primary Admin / Owner Account is permanently legitimate
  if (
    lower.endsWith('@madurahouse.local') ||
    lower.endsWith('@test.local') ||
    lower.includes('admin.tenant@') ||
    lower.includes('mock.tenant@')
  ) {
    return true;
  }
  return false;
};

export const initialUsers: User[] = [
  {
    id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    email: 'sampathkumar@chemadur.com',
    fullName: 'Sampath Kumar',
    phone: '+91 98421 00000',
    flatNumber: 'Owner Suite',
    role: 'OWNER',
    occupancyStatus: 'active',
    paymentStatus: 'paid',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    moveInDate: '2020-01-15',
    rentAmount: 0,
    depositAmount: 0,
    emergencyContact: '+91 98421 99999',
    notes: 'Property Developer & Primary Owner of Madura House',
  },
];

/**
 * Utility to identify legacy dummy mock expenses and prevent their resurrection
 */
export const isDummyLegacyExpense = (expense?: Expense | any): boolean => {
  if (!expense) return true;
  const id = (expense.id || '').toString().toLowerCase();
  const particular = (expense.particular || '').toString().toLowerCase();
  if (
    id.startsWith('aaaa1111-') ||
    id.startsWith('33333333-4444-') ||
    id.includes('000000000001') ||
    id.includes('000000000002') ||
    id.includes('000000000003') ||
    id.includes('000000000004') ||
    id.includes('000000000005') ||
    particular.includes('tangedco eb') ||
    particular.includes('water sump tank cleaning') ||
    particular.includes('passenger lift maintenance amc') ||
    particular.includes('corridor janitorial cleaning') ||
    particular.includes('motor pump electrical service') ||
    particular.includes('terrace water tank sanitization')
  ) {
    return true;
  }
  return false;
};

// Clean Production Expenses Ledger (Only user-entered data will populate)
export const initialExpenses: Expense[] = [];

// Clean Active Maintenance Record with 0 baseline (Calculates dynamically from user-entered expenses)
export const initialMaintenanceRecords: MaintenanceRecord[] = [
  {
    id: '22222222-3333-4444-5555-666666666666',
    houseId: '11111111-2222-3333-4444-555555555555',
    month: 9,
    year: 2026,
    grandTotal: 0,
    activeTenantsCount: 1,
    individualContribution: 0,
    notes: 'September 2026 Active Maintenance Period',
    createdBy: 'sampathkumar@chemadur.com',
    createdAt: '2026-09-01T00:00:00.000Z',
    expenses: [],
  },
];

// Clean Invoices Archive (Zero dummy files - ready for live user uploads)
export const initialInvoices: Invoice[] = [];

// Clean Notification Logs (Ready for real dispatches)
export const initialNotificationLogs: NotificationLog[] = [];

// Production Audit Trail
export const initialAuditLogs: AuditLog[] = [
  {
    id: 'aaaa0000-0000-4000-8000-000000000000',
    userId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    userEmail: 'sampathkumar@chemadur.com',
    action: 'SYSTEM_INITIALIZED_CLEAN_DEPLOYMENT',
    resourceType: 'platform_core',
    resourceId: 'madura-house-system',
    timestamp: new Date().toISOString(),
    ipAddress: '0.0.0.0',
  },
];
