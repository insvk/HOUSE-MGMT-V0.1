export type UserRole = 'OWNER' | 'ADMIN_TENANT' | 'TENANT';

export const AVAILABLE_FLATS = [
  'GF',
  'F01 - FRONT',
  'F01 - BACK',
  'F02 - FRONT',
  'F02 - BACK',
] as const;

export type FlatNumber = typeof AVAILABLE_FLATS[number];

export interface User {
  id: string;
  email: string;
  password?: string;
  fullName: string;
  phone: string;
  flatNumber: string;
  role: UserRole;
  occupancyStatus: 'active' | 'inactive' | 'evicted';
  paymentStatus?: 'paid' | 'pending' | 'unpaid';
  avatarUrl?: string;
  moveInDate?: string;
  rentAmount?: number;
  depositAmount?: number;
  emergencyContact?: string;
  notes?: string;
}

export interface House {
  id: string;
  name: string;
  address: string;
  city: string;
  postalCode: string;
  totalUnits: number;
  ownerId: string;
}

export type ExpenseCategory = 'maintenance' | 'utilities' | 'repairs' | 'cleaning' | 'other';

export interface Expense {
  id: string;
  maintenanceRecordId: string;
  slNo: number;
  particular: string;
  amount: number;
  category: ExpenseCategory;
  gstApplicable: boolean;
  gstAmount: number;
  notes?: string;
  addedBy: string;
  createdAt: string;
}

export interface MaintenanceRecord {
  id: string;
  houseId: string;
  month: number; // 1-12
  year: number;
  grandTotal: number;
  activeTenantsCount: number;
  individualContribution: number;
  notes?: string;
  createdBy: string;
  createdAt: string;
  expenses: Expense[];
}

export interface Invoice {
  id: string;
  expenseId?: string;
  maintenanceRecordId: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  storagePath: string;
  uploadedBy: string;
  uploadedAt: string;
  ocrText?: string;
}

export interface NotificationLog {
  id: string;
  maintenanceRecordId: string;
  recipientEmail: string;
  type: 'maintenance_added' | 'contribution_due' | 'payment_received';
  subject: string;
  status: 'sent' | 'pending' | 'failed';
  sentAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userEmail: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  timestamp: string;
  ipAddress: string;
}
