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
    invoiceFileName: 'TANGEDCO_EB_Bill_Consumer_07124004982.pdf',
    invoiceFileType: 'application/pdf',
    invoiceFileSize: 284500,
    invoiceUrl: 'invoices/tangedco_eb_sep2026.pdf',
    ocrText: 'TANGEDCO TAMIL NADU ELECTRICITY BOARD. Consumer No: 07-124-004-982. Tariff: LT-1A Commercial/Common. Bill Period: Aug-Sep 2026. Total Payable: ₹2,850.00. Status: PAID via NetBanking.',
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
    invoiceFileName: 'AquaClean_Sump_Tank_Disinfection_Voucher.jpg',
    invoiceFileType: 'image/jpeg',
    invoiceFileSize: 198400,
    invoiceUrl: 'invoices/aquaclean_sump_cleaning.jpg',
    ocrText: 'AQUACLEAN TANK SERVICES. Bill No: 8842. Underground 12,000L Sump & Overhead 4,000L PVC Tank Cleaning. Bleaching powder & UV sanitization. Amount Paid: ₹1,500.00 Cash.',
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
    invoiceFileName: 'Johnson_Lifts_AMC_Service_Tax_Invoice.pdf',
    invoiceFileType: 'application/pdf',
    invoiceFileSize: 412000,
    invoiceUrl: 'invoices/johnson_lifts_amc.pdf',
    ocrText: 'JOHNSON LIFTS PVT LTD. Tax Invoice #JL-CHE-2026-892. Client: Madura House. 6-Passenger Automatic Lift Servicing, Guide Rails Lubrication & ARD Battery Check. Base: ₹2,712, 18% GST: ₹488. Total: ₹3,200.00.',
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
    addedBy: 'sampathkumar@chemadur.com',
    createdAt: '2026-09-05T09:00:00.000Z',
    invoiceFileName: 'Sri_Murugan_Stores_Janitorial_Voucher.jpg',
    invoiceFileType: 'image/jpeg',
    invoiceFileSize: 165200,
    invoiceUrl: 'invoices/sri_murugan_janitorial.jpg',
    ocrText: 'SRI MURUGAN GENERAL STORES. Cash Memo #104. 5L Neem Phenyl (₹350), 2x Mop Rods (₹400), Harpic Toilet Cleaner (₹250), Microfiber Dusters (₹250). Total: ₹1,250.00.',
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
    addedBy: 'sampathkumar@chemadur.com',
    createdAt: '2026-09-06T08:30:00.000Z',
    invoiceFileName: 'Sri_Balaji_Electricals_Service_Bill.pdf',
    invoiceFileType: 'application/pdf',
    invoiceFileSize: 325100,
    invoiceUrl: 'invoices/balaji_electricals_motor_service.pdf',
    ocrText: 'SRI BALAJI ELECTRICAL WORKSHOP. Tax Invoice #BE-492. Maduravoyal. Replaced 36MFD Starter Capacitor (₹650), Greased Bearings & Rewiring Service (₹750). Total: ₹1,400.00. Paid via UPI.',
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
