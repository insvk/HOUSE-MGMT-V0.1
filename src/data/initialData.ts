import { House, User, MaintenanceRecord, Invoice, NotificationLog, AuditLog } from '../types';

export const initialHouse: House = {
  id: 'h-madura-01',
  name: 'Madura House Maintenance',
  address: 'No. 42, Bypass Road, Ellis Nagar',
  city: 'Madurai',
  postalCode: '625001',
  totalUnits: 6,
  ownerId: 'u-owner-01',
};

// Clean Production Accounts: Only Property Owner (Admin) & Admin Tenant
export const initialUsers: User[] = [
  {
    id: 'u-owner-01',
    email: 'sampathkumar@chemadur.com',
    password: 'Sampath@123',
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
  {
    id: 'u-admin-tenant-01',
    email: 'admin.tenant@madurahouse.local',
    password: 'Admin@123',
    fullName: 'Rajesh Kumar',
    phone: '+91 98421 11111',
    flatNumber: 'Flat 101',
    role: 'ADMIN_TENANT',
    occupancyStatus: 'active',
    paymentStatus: 'paid',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    moveInDate: '2023-06-01',
    rentAmount: 14000,
    depositAmount: 70000,
    emergencyContact: '+91 98421 88888',
    notes: 'Admin Tenant - Assists with local maintenance & contractor coordination',
  },
];

// Clean Active Maintenance Record (Zero dummy expenses - ready for live user input)
export const initialMaintenanceRecords: MaintenanceRecord[] = [
  {
    id: 'mr-sep-2026',
    houseId: 'h-madura-01',
    month: 9,
    year: 2026,
    grandTotal: 0,
    activeTenantsCount: 6,
    individualContribution: 0,
    notes: 'September 2026 Active Maintenance Period',
    createdBy: 'sampathkumar@chemadur.com',
    createdAt: new Date().toISOString(),
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
    id: 'al-01',
    userId: 'u-owner-01',
    userEmail: 'sampathkumar@chemadur.com',
    action: 'SYSTEM_INITIALIZED_CLEAN_DEPLOYMENT',
    resourceType: 'platform_core',
    resourceId: 'madura-house-system',
    timestamp: new Date().toISOString(),
    ipAddress: '122.178.45.10',
  },
];
