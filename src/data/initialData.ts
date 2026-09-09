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

// Clean Production Accounts: Property Owner (Admin) & All 5 Resident Flat Tenants
// Default credential constants — used only for initial login matching.
// NOT stored in the User objects to prevent leakage via localStorage/state.
export const DEFAULT_CREDENTIALS: Record<string, string> = {
  'sampathkumar@chemadur.com': 'Sampath@123',
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

// Active September 2026 Maintenance Expenses (Audited & Itemized)
export const initialExpenses: Expense[] = [
  {
    id: 'aaaa1111-0001-4000-8000-000000000001',
    maintenanceRecordId: '22222222-3333-4444-5555-666666666666',
    slNo: 1,
    particular: 'Common Area Electricity Bill (TANGEDCO EB)',
    amount: 2850,
    category: 'utilities',
    gstApplicable: false,
    gstAmount: 0,
    notes: 'Consumer #07-124-004-982 (Main Motor Pump & Staircase Lighting)',
    addedBy: 'sampathkumar@chemadur.com',
    createdAt: '2026-09-02T10:00:00.000Z',
  },
  {
    id: 'aaaa1111-0002-4000-8000-000000000002',
    maintenanceRecordId: '22222222-3333-4444-5555-666666666666',
    slNo: 2,
    particular: 'Water Sump Tank Cleaning & Disinfection',
    amount: 1500,
    category: 'cleaning',
    gstApplicable: false,
    gstAmount: 0,
    notes: 'Quarterly deep cleaning and chlorination of ground & overhead sumps',
    addedBy: 'sampathkumar@chemadur.com',
    createdAt: '2026-09-03T11:30:00.000Z',
  },
  {
    id: 'aaaa1111-0003-4000-8000-000000000003',
    maintenanceRecordId: '22222222-3333-4444-5555-666666666666',
    slNo: 3,
    particular: 'Passenger Lift Maintenance AMC & Inspection',
    amount: 3200,
    category: 'maintenance',
    gstApplicable: true,
    gstAmount: 488,
    notes: 'Johnson Lifts scheduled monthly servicing & safety audit',
    addedBy: 'sampathkumar@chemadur.com',
    createdAt: '2026-09-04T14:15:00.000Z',
  },
  {
    id: 'aaaa1111-0004-4000-8000-000000000004',
    maintenanceRecordId: '22222222-3333-4444-5555-666666666666',
    slNo: 4,
    particular: 'Corridor Janitorial Cleaning & Supplies',
    amount: 1250,
    category: 'cleaning',
    gstApplicable: false,
    gstAmount: 0,
    notes: 'Weekly staircase sweeping, phenyl, mop heads & janitorial supplies',
    addedBy: 'admin.tenant@madurahouse.local',
    createdAt: '2026-09-05T09:00:00.000Z',
  },
  {
    id: 'aaaa1111-0005-4000-8000-000000000005',
    maintenanceRecordId: '22222222-3333-4444-5555-666666666666',
    slNo: 5,
    particular: 'Motor Pump Electrical Service & Capacitor',
    amount: 1400,
    category: 'repairs',
    gstApplicable: false,
    gstAmount: 0,
    notes: 'Replaced 36MFD starter capacitor and greased borewell pump bearings',
    addedBy: 'admin.tenant@madurahouse.local',
    createdAt: '2026-09-06T08:30:00.000Z',
  },
];

// Active Maintenance Record with real itemized expenses and auto-computed split
export const initialMaintenanceRecords: MaintenanceRecord[] = [
  {
    id: '22222222-3333-4444-5555-666666666666',
    houseId: '11111111-2222-3333-4444-555555555555',
    month: 9,
    year: 2026,
    grandTotal: 10200,
    activeTenantsCount: 5,
    individualContribution: 2040,
    notes: 'September 2026 Active Maintenance Period • All 5 flats contributing equally',
    createdBy: 'sampathkumar@chemadur.com',
    createdAt: '2026-09-01T00:00:00.000Z',
    expenses: initialExpenses,
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
