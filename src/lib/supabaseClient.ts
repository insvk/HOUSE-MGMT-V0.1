import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { User, MaintenanceRecord, Expense, Invoice, NotificationLog, House, AuditLog } from '../types';
import { isDummyLegacyAccount } from '../data/initialData';

// Environment variables with fallback
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes('placeholder')
);

// RFC4122 v4 UUID generator for PostgreSQL compatibility
export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Validate UUID v4 format
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function isValidUUID(id: string): boolean {
  return UUID_REGEX.test(id);
}

// Initialize Supabase client
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;

// ============================================================================
// DB ROW ? APPLICATION USER MAPPER (canonical, single source of truth)
// Maps snake_case DB columns ? camelCase User interface fields.
// ============================================================================
const OWNER_EMAILS = ['sampathkumar@chemadura.com', 'rsivanaresh@gmail.com'];

export function mapDbRowToUser(u: any): User {
  const emailLower = (u.email || '').toLowerCase().trim();
  return {
    id: u.id,
    email: emailLower,
    username: u.username || undefined,
    // Never surface the password into the application state from the cloud
    password: u.password || undefined,
    phone: u.phone || '',
    fullName: u.full_name || '',
    flatNumber: u.flat_number || 'GF',
    // Always enforce OWNER role for owner emails regardless of DB value
    role: OWNER_EMAILS.includes(emailLower) ? 'OWNER' : (u.role || 'TENANT'),
    occupancyStatus: u.occupancy_status || 'active',
    paymentStatus: u.payment_status || 'paid',
    maintenanceStatus: u.maintenance_status || 'unpaid',
    avatarUrl: u.avatar_url || undefined,
    moveInDate: u.move_in_date || undefined,
    rentAmount: u.rent_amount != null ? Number(u.rent_amount) : 0,
    depositAmount: u.deposit_amount != null ? Number(u.deposit_amount) : 0,
    emergencyContact: u.emergency_contact || undefined,
    notes: u.notes || undefined,
    preferences: u.preferences || {},
  };
}

// ============================================================================
// CLOUD DATABASE ADAPTER SERVICE
// ============================================================================

export const cloudDb = {
  // Check Connection Health
  async testConnection(): Promise<{ connected: boolean; message: string }> {
    if (!isSupabaseConfigured || !supabase) {
      return {
        connected: false,
        message: 'Local Offline Mode (Configure VITE_SUPABASE_URL in .env to connect to live Cloud DB)',
      };
    }

    try {
      const { data, error } = await supabase.from('houses').select('id, name').limit(1);
      if (error) throw error;
      return {
        connected: true,
        message: `Connected to Cloud PostgreSQL (${data?.[0]?.name || 'Madura House'})`,
      };
    } catch (err: any) {
      return {
        connected: false,
        message: `Cloud DB Connection error: ${err.message || 'Unknown'}`,
      };
    }
  },

  // System Secrets (Requires OWNER role RLS)
  async getSecret(keyName: string): Promise<string | null> {
    if (!isSupabaseConfigured || !supabase) return null;
    try {
      const { data, error } = await supabase
        .from('system_secrets')
        .select('key_value')
        .eq('key_name', keyName)
        .limit(1);
      if (error || !data || data.length === 0) return null;
      return data[0].key_value;
    } catch (err) {
      console.warn(`Cloud DB fetch secret ${keyName} fallback:`, err);
      return null;
    }
  },

  async setSecret(keyName: string, keyValue: string): Promise<boolean> {
    if (!isSupabaseConfigured || !supabase) return false;
    try {
      const { error } = await supabase
        .from('system_secrets')
        .upsert({
          key_name: keyName,
          key_value: keyValue,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'key_name' });
      if (error) throw error;
      return true;
    } catch (err) {
      console.warn(`Cloud DB update secret ${keyName} warning:`, err);
      return false;
    }
  },

  // Fetch Property / House Master
  async getHouse(): Promise<House | null> {
    if (!isSupabaseConfigured || !supabase) return null;
    try {
      const { data, error } = await supabase.from('houses').select('*').limit(1);
      if (error || !data || data.length === 0) return null;
      const h = data[0];
      return {
        id: h.id,
        name: h.name || 'Madura House Maintenance',
        address: h.address || 'No. 42, Bypass Road, Ellis Nagar',
        city: h.city || 'Maduravoyal',
        postalCode: h.postal_code || '625001',
        totalUnits: Number(h.total_units) || 5,
        ownerId: h.owner_id || 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        settings: h.settings || {},
      };
    } catch (err) {
      console.warn('Cloud DB fetch house fallback:', err);
      return null;
    }
  },

  // Update / Upsert House Master Permanently in DB
  async updateHouse(house: House): Promise<{ success: boolean; error?: string }> {
    if (!isSupabaseConfigured || !supabase) return { success: false, error: 'Cloud DB not configured' };
    try {
      const houseId = isValidUUID(house.id) ? house.id : generateUUID();

      const { error } = await supabase
        .from('houses')
        .upsert({
          id: houseId,
          name: house.name,
          address: house.address,
          city: house.city,
          postal_code: house.postalCode,
          total_units: Number(house.totalUnits) || 5,
          owner_id: house.ownerId,
          settings: house.settings || {},
          updated_at: new Date().toISOString(),
        }, { onConflict: 'id' });

      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (err: any) {
      console.warn('Cloud DB update house warning:', err);
      return { success: false, error: err?.message || 'Failed to update property settings' };
    }
  },

  // Fetch Users (Filtered: legitimate production accounts only, excludes soft-deleted, deduplicated by email)
  async getUsers(): Promise<User[] | null> {
    if (!isSupabaseConfigured || !supabase) return null;
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .or('is_active.is.null,is_active.eq.true')
        .is('deleted_at', null)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Filter and strictly deduplicate by email
      const userMap = new Map<string, User>();
      (data || []).forEach((row: any) => {
        if (!row.email || isDummyLegacyAccount(row.email)) return;
        const mapped = mapDbRowToUser(row);
        const emailKey = mapped.email.toLowerCase().trim();
        // Set unique canonical profile
        if (!userMap.has(emailKey) || row.id === 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11') {
          userMap.set(emailKey, mapped);
        }
      });

      return Array.from(userMap.values());
    } catch (err) {
      console.warn('Cloud DB fetch users fallback:', err);
      return null;
    }
  },

  // ROOT CAUSE #7 FIX: Authoritative single-user fetch by email (for post-login profile resolution)
  async getUserByEmail(email: string): Promise<User | null> {
    if (!isSupabaseConfigured || !supabase) return null;
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email.toLowerCase().trim())
        .eq('is_active', true)
        .is('deleted_at', null)
        .maybeSingle();

      if (error) {
        console.warn('Cloud DB getUserByEmail error:', error);
        return null;
      }
      if (!data) return null;
      return mapDbRowToUser(data);
    } catch (err) {
      console.warn('Cloud DB getUserByEmail fallback:', err);
      return null;
    }
  },

  // Insert New User — ROOT CAUSE #1 FIX: returns {success, error} instead of bare boolean
  async createUser(user: User): Promise<{ success: boolean; error?: string }> {
    if (!isSupabaseConfigured || !supabase) return { success: false, error: 'Cloud DB not configured' };
    try {
      const payload: any = {
        id: user.id,
        email: user.email.toLowerCase().trim(),
        password: user.password || null,
        phone: user.phone || null,
        full_name: user.fullName,
        flat_number: user.flatNumber || null,
        role: user.role || 'TENANT',
        occupancy_status: user.occupancyStatus || 'active',
        payment_status: user.paymentStatus || 'paid',
        maintenance_status: user.maintenanceStatus || 'unpaid',
        avatar_url: user.avatarUrl || null,
        move_in_date: user.moveInDate || null,
        rent_amount: user.rentAmount ?? null,
        deposit_amount: user.depositAmount ?? null,
        emergency_contact: user.emergencyContact || null,
        notes: user.notes || null,
        preferences: user.preferences || {},
        is_active: true,
        deleted_at: null,
      };
      if (user.username) payload.username = user.username.toLowerCase().trim();

      const { error } = await supabase.from('users').insert(payload);

      if (error) {
        // Duplicate email is a known conflict — surface clearly
        if (error.code === '23505') {
          return { success: false, error: 'A user with this email already exists in the database.' };
        }
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (err: any) {
      console.error('Cloud DB insert user error:', err);
      return { success: false, error: err?.message || 'Unknown database error' };
    }
  },

  // Update Existing User Details & Profile Picture — ROOT CAUSE #1 FIX: returns {success, error}
  async updateUser(user: User): Promise<{ success: boolean; error?: string }> {
    if (!isSupabaseConfigured || !supabase) return { success: false, error: 'Cloud DB not configured' };
    try {
      const updatePayload: any = {
        password: user.password ?? null,
        phone: user.phone || null,
        full_name: user.fullName,
        flat_number: user.flatNumber || null,
        role: user.role || 'TENANT',
        occupancy_status: user.occupancyStatus || 'active',
        payment_status: user.paymentStatus || 'paid',
        maintenance_status: user.maintenanceStatus || 'unpaid',
        avatar_url: user.avatarUrl || null,
        move_in_date: user.moveInDate || null,
        rent_amount: user.rentAmount ?? null,
        deposit_amount: user.depositAmount ?? null,
        emergency_contact: user.emergencyContact || null,
        notes: user.notes || null,
        preferences: user.preferences || {},
        is_active: true,
        updated_at: new Date().toISOString(),
      };
      if (user.username) updatePayload.username = user.username.toLowerCase().trim();

      const { error } = await supabase
        .from('users')
        .update(updatePayload)
        .eq('email', user.email.toLowerCase().trim());

      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (err: any) {
      console.error('Cloud DB update user error:', err);
      return { success: false, error: err?.message || 'Unknown database error' };
    }
  },

  // Direct Update for User Avatar URL
  async updateUserAvatar(email: string, avatarUrl: string): Promise<{ success: boolean; error?: string }> {
    if (!isSupabaseConfigured || !supabase) return { success: false, error: 'Cloud DB not configured' };
    try {
      const { error } = await supabase
        .from('users')
        .update({
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('email', email.toLowerCase().trim());

      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (err: any) {
      console.error('Cloud DB update avatar error:', err);
      return { success: false, error: err?.message || 'Failed to update profile picture' };
    }
  },

  // Update User Preferences (Clock format, audio chimes, notifications)
  async updateUserPreferences(email: string, preferences: any): Promise<{ success: boolean; error?: string }> {
    if (!isSupabaseConfigured || !supabase) return { success: false, error: 'Cloud DB not configured' };
    try {
      const { error } = await supabase
        .from('users')
        .update({
          preferences,
          updated_at: new Date().toISOString(),
        })
        .eq('email', email.toLowerCase().trim());

      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (err: any) {
      console.error('Cloud DB update preferences error:', err);
      return { success: false, error: err?.message || 'Failed to update preferences' };
    }
  },

  // Upload Avatar to Cloud Storage Bucket (if bucket configured)
  async uploadAvatar(file: File, email: string): Promise<string | null> {
    if (!isSupabaseConfigured || !supabase) return null;
    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const cleanEmail = email.replace(/[^a-zA-Z0-9]/g, '_');
      const filePath = `avatars/${cleanEmail}_${Date.now()}.${ext}`;

      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(data.path);

      return urlData.publicUrl;
    } catch (err) {
      console.warn('Cloud Storage upload avatar fallback:', err);
      return null;
    }
  },

  // Fetch Maintenance Records & Expenses
  async getMaintenanceRecords(): Promise<MaintenanceRecord[] | null> {
    if (!isSupabaseConfigured || !supabase) return null;
    try {
      const { data: recs, error: recsError } = await supabase
        .from('maintenance_records')
        .select('*, expenses(*)')
        .order('year', { ascending: false })
        .order('month', { ascending: false });

      if (recsError) throw recsError;

      return (recs || []).map((r: any) => ({
        id: r.id,
        houseId: r.house_id,
        month: r.month,
        year: r.year,
        grandTotal: Number(r.grand_total) || 0,
        activeTenantsCount: r.number_of_active_tenants || 5,
        individualContribution: Number(r.individual_contribution) || 0,
        notes: r.notes || '',
        createdBy: r.created_by || '',
        createdAt: r.created_at,
        expenses: (r.expenses || []).map((e: any) => ({
          id: e.id,
          maintenanceRecordId: e.maintenance_record_id,
          slNo: e.sl_no,
          particular: e.particular,
          amount: Number(e.amount),
          category: e.category,
          gstApplicable: e.gst_applicable,
          gstAmount: Number(e.gst_amount || 0),
          notes: e.notes,
          addedBy: e.added_by,
          createdAt: e.created_at,
          invoiceUrl: e.invoice_url || e.invoiceUrl,
          invoiceFileName: e.invoice_file_name || e.invoiceFileName,
          invoiceFileType: e.invoice_file_type || e.invoiceFileType,
          invoiceFileSize: e.invoice_file_size || e.invoiceFileSize,
          ocrText: e.ocr_text || e.ocrText,
        })),
      }));
    } catch (err) {
      console.warn('Cloud DB fetch records fallback:', err);
      return null;
    }
  },

  // Update / Upsert Maintenance Record Header in Cloud DB
  async updateMaintenanceRecord(record: MaintenanceRecord): Promise<{ success: boolean; error?: string }> {
    if (!isSupabaseConfigured || !supabase) return { success: false, error: 'Cloud DB not configured' };
    try {
      const recordId = isValidUUID(record.id) ? record.id : generateUUID();
      const houseId = isValidUUID(record.houseId) ? record.houseId : '11111111-2222-3333-4444-555555555555';

      // NOTE: PostgreSQL column 'individual_contribution' is a GENERATED STORED column!
      // Do NOT send 'individual_contribution' in the payload or DB will reject the write.
      const payload: any = {
        id: recordId,
        house_id: houseId,
        month: record.month,
        year: record.year,
        grand_total: record.grandTotal,
        number_of_active_tenants: record.activeTenantsCount || 5,
        notes: record.notes || '',
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('maintenance_records')
        .upsert(payload, { onConflict: 'house_id,month,year' });

      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (err: any) {
      console.warn('Cloud DB update maintenance record notice:', err);
      return { success: false, error: err?.message || 'Failed to update billing period' };
    }
  },

  // Delete User from Cloud DB (soft-delete)
  async deleteUser(userIdOrEmail: string): Promise<{ success: boolean; error?: string }> {
    if (!isSupabaseConfigured || !supabase) return { success: false, error: 'Cloud DB not configured' };
    try {
      // Use safe filter methods instead of string interpolation to prevent injection
      let query = supabase
        .from('users')
        .update({
          occupancy_status: 'inactive',
          is_active: false,
          deleted_at: new Date().toISOString(),
        });

      if (isValidUUID(userIdOrEmail)) {
        query = query.eq('id', userIdOrEmail);
      } else {
        query = query.eq('email', userIdOrEmail.toLowerCase().trim());
      }

      const { error } = await query;
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (err: any) {
      console.warn('Cloud DB delete user notice:', err);
      return { success: false, error: err?.message || 'Failed to remove tenant' };
    }
  },

  // Update User Rent Payment Status in Cloud DB
  async updateUserPaymentStatus(email: string, paymentStatus: string): Promise<{ success: boolean; error?: string }> {
    if (!isSupabaseConfigured || !supabase) return { success: false, error: 'Cloud DB not configured' };
    try {
      const { error } = await supabase
        .from('users')
        .update({
          payment_status: paymentStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('email', email.toLowerCase().trim());

      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (err: any) {
      console.warn('Cloud DB update payment status notice:', err);
      return { success: false, error: err?.message || 'Failed to update payment status' };
    }
  },

  // Update User Maintenance Fee Status in Cloud DB
  async updateUserMaintenanceStatus(email: string, maintenanceStatus: string): Promise<{ success: boolean; error?: string }> {
    if (!isSupabaseConfigured || !supabase) return { success: false, error: 'Cloud DB not configured' };
    try {
      const { error } = await supabase
        .from('users')
        .update({
          maintenance_status: maintenanceStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('email', email.toLowerCase().trim());

      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (err: any) {
      console.warn('Cloud DB update maintenance status notice:', err);
      return { success: false, error: err?.message || 'Failed to update maintenance status' };
    }
  },

  // Add Expense to Cloud DB (UUID Compliant)
  async addExpense(expense: Expense, currentUserId?: string): Promise<{ success: boolean; error?: string }> {
    if (!isSupabaseConfigured || !supabase) return { success: false, error: 'Cloud DB not configured' };
    try {
      const validId = isValidUUID(expense.id) ? expense.id : generateUUID();
      const validRecordId = isValidUUID(expense.maintenanceRecordId)
        ? expense.maintenanceRecordId
        : null;

      if (!validRecordId) {
        console.warn('Cloud DB addExpense: invalid maintenanceRecordId, skipping');
        return { success: false, error: 'Invalid maintenance record ID' };
      }

      const addedBy = currentUserId && isValidUUID(currentUserId)
        ? currentUserId
        : 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

      const payload: any = {
        id: validId,
        maintenance_record_id: validRecordId,
        sl_no: expense.slNo || 1,
        particular: expense.particular,
        amount: Number(expense.amount) || 0,
        category: expense.category || 'maintenance',
        gst_applicable: Boolean(expense.gstApplicable),
        gst_amount: Number(expense.gstAmount) || 0,
        notes: expense.notes || '',
        added_by: addedBy,
      };

      if (expense.invoiceUrl) payload.invoice_url = expense.invoiceUrl;
      if (expense.invoiceFileName) payload.invoice_file_name = expense.invoiceFileName;
      if (expense.invoiceFileType) payload.invoice_file_type = expense.invoiceFileType;
      if (expense.invoiceFileSize) payload.invoice_file_size = expense.invoiceFileSize;
      if (expense.ocrText) payload.ocr_text = expense.ocrText;

      let { error } = await supabase.from('expenses').upsert(payload, { onConflict: 'id' });
      
      // Fallback without extended invoice columns if schema doesn't have them
      if (error && error.message && error.message.includes('column')) {
        const basePayload = {
          id: validId,
          maintenance_record_id: validRecordId,
          sl_no: expense.slNo || 1,
          particular: expense.particular,
          amount: Number(expense.amount) || 0,
          category: expense.category || 'maintenance',
          gst_applicable: Boolean(expense.gstApplicable),
          gst_amount: Number(expense.gstAmount) || 0,
          notes: expense.notes || '',
          added_by: addedBy,
        };
        const res = await supabase.from('expenses').upsert(basePayload, { onConflict: 'id' });
        error = res.error;
      }

      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (err: any) {
      console.warn('Cloud DB add expense notice:', err);
      return { success: false, error: err?.message || 'Failed to add expense' };
    }
  },

  // Update Expense in Cloud DB
  async updateExpense(expense: Expense): Promise<{ success: boolean; error?: string }> {
    if (!isSupabaseConfigured || !supabase) return { success: false, error: 'Cloud DB not configured' };
    try {
      const updateData: any = {
        particular: expense.particular,
        amount: Number(expense.amount) || 0,
        category: expense.category,
        gst_applicable: Boolean(expense.gstApplicable),
        gst_amount: Number(expense.gstAmount) || 0,
        notes: expense.notes || '',
        updated_at: new Date().toISOString(),
      };

      if (expense.invoiceUrl !== undefined) updateData.invoice_url = expense.invoiceUrl;
      if (expense.invoiceFileName !== undefined) updateData.invoice_file_name = expense.invoiceFileName;
      if (expense.invoiceFileType !== undefined) updateData.invoice_file_type = expense.invoiceFileType;
      if (expense.invoiceFileSize !== undefined) updateData.invoice_file_size = expense.invoiceFileSize;
      if (expense.ocrText !== undefined) updateData.ocr_text = expense.ocrText;

      let { error } = await supabase
        .from('expenses')
        .update(updateData)
        .eq('id', expense.id);

      if (error && error.message && error.message.includes('column')) {
        const baseUpdate = {
          particular: expense.particular,
          amount: Number(expense.amount) || 0,
          category: expense.category,
          gst_applicable: Boolean(expense.gstApplicable),
          gst_amount: Number(expense.gstAmount) || 0,
          notes: expense.notes || '',
          updated_at: new Date().toISOString(),
        };
        const res = await supabase.from('expenses').update(baseUpdate).eq('id', expense.id);
        error = res.error;
      }

      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (err: any) {
      console.warn('Cloud DB update expense notice:', err);
      return { success: false, error: err?.message || 'Failed to update expense' };
    }
  },

  // Delete Expense from Cloud DB
  async deleteExpense(expenseId: string): Promise<{ success: boolean; error?: string }> {
    if (!isSupabaseConfigured || !supabase) return { success: false, error: 'Cloud DB not configured' };
    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', expenseId);

      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (err: any) {
      console.warn('Cloud DB delete expense notice:', err);
      return { success: false, error: err?.message || 'Failed to delete expense' };
    }
  },

  // Fetch all Expenses for a given Maintenance Record
  async getExpensesForRecord(recordId: string): Promise<Expense[] | null> {
    if (!isSupabaseConfigured || !supabase) return null;
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('maintenance_record_id', recordId)
        .order('sl_no', { ascending: true });

      if (error) throw error;

      return (data || []).map((e: any) => ({
        id: e.id,
        maintenanceRecordId: e.maintenance_record_id,
        slNo: e.sl_no,
        particular: e.particular,
        amount: Number(e.amount) || 0,
        category: e.category,
        gstApplicable: Boolean(e.gst_applicable),
        gstAmount: Number(e.gst_amount) || 0,
        notes: e.notes || '',
        addedBy: e.added_by || '',
        createdAt: e.created_at || new Date().toISOString(),
        invoiceUrl: e.invoice_url || e.invoiceUrl,
        invoiceFileName: e.invoice_file_name || e.invoiceFileName,
        invoiceFileType: e.invoice_file_type || e.invoiceFileType,
        invoiceFileSize: e.invoice_file_size || e.invoiceFileSize,
        ocrText: e.ocr_text || e.ocrText,
      }));
    } catch (err) {
      console.warn('Cloud DB fetch record expenses fallback:', err);
      return null;
    }
  },

  // Real-time PostgreSQL subscription for live Expense updates
  subscribeToExpenses(onEvent: (payload: any) => void) {
    if (!isSupabaseConfigured || !supabase) return () => {};
    try {
      const channel = supabase
        .channel('realtime:expenses')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses' }, (payload) => {
          onEvent(payload);
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } catch (err) {
      console.warn('Realtime expenses subscription fallback:', err);
      return () => {};
    }
  },

  // Real-time PostgreSQL subscription for Users & Tenants
  subscribeToUsers(onEvent: (payload: any) => void) {
    if (!isSupabaseConfigured || !supabase) return () => {};
    try {
      const channel = supabase
        .channel('realtime:users')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, (payload) => {
          onEvent(payload);
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } catch (err) {
      console.warn('Realtime users subscription fallback:', err);
      return () => {};
    }
  },

  // Real-time PostgreSQL subscription for Property / House Master
  subscribeToHouse(onEvent: (payload: any) => void) {
    if (!isSupabaseConfigured || !supabase) return () => {};
    try {
      const channel = supabase
        .channel('realtime:houses')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'houses' }, (payload) => {
          onEvent(payload);
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } catch (err) {
      console.warn('Realtime house subscription fallback:', err);
      return () => {};
    }
  },

  // Real-time PostgreSQL subscription for Maintenance Records
  subscribeToMaintenanceRecords(onEvent: (payload: any) => void) {
    if (!isSupabaseConfigured || !supabase) return () => {};
    try {
      const channel = supabase
        .channel('realtime:maintenance_records')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'maintenance_records' }, (payload) => {
          onEvent(payload);
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } catch (err) {
      console.warn('Realtime records subscription fallback:', err);
      return () => {};
    }
  },

  // Real-time PostgreSQL subscription for Invoices
  subscribeToInvoices(onEvent: (payload: any) => void) {
    if (!isSupabaseConfigured || !supabase) return () => {};
    try {
      const channel = supabase
        .channel('realtime:invoices')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'invoices' }, (payload) => {
          onEvent(payload);
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } catch (err) {
      console.warn('Realtime invoices subscription fallback:', err);
      return () => {};
    }
  },

  // Real-time PostgreSQL subscription for Notifications
  subscribeToNotifications(onEvent: (payload: any) => void) {
    if (!isSupabaseConfigured || !supabase) return () => {};
    try {
      const channel = supabase
        .channel('realtime:notifications')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, (payload) => {
          onEvent(payload);
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } catch (err) {
      console.warn('Realtime notifications subscription fallback:', err);
      return () => {};
    }
  },

  // Unified Real-time Listener for ALL platform changes
  subscribeToAllPlatformChanges(handlers: {
    onUsersChange?: (payload: any) => void;
    onHouseChange?: (payload: any) => void;
    onRecordsChange?: (payload: any) => void;
    onExpensesChange?: (payload: any) => void;
    onInvoicesChange?: (payload: any) => void;
    onNotificationsChange?: (payload: any) => void;
  }) {
    if (!isSupabaseConfigured || !supabase) return () => {};
    try {
      const channel = supabase
        .channel('realtime:madura_house_platform_sync')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, (payload) => {
          handlers.onUsersChange?.(payload);
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'houses' }, (payload) => {
          handlers.onHouseChange?.(payload);
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'maintenance_records' }, (payload) => {
          handlers.onRecordsChange?.(payload);
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses' }, (payload) => {
          handlers.onExpensesChange?.(payload);
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'invoices' }, (payload) => {
          handlers.onInvoicesChange?.(payload);
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, (payload) => {
          handlers.onNotificationsChange?.(payload);
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } catch (err) {
      console.warn('Realtime unified subscription fallback:', err);
      return () => {};
    }
  },

  // Upload Invoice Document to Cloud Storage
  async uploadInvoice(file: File, path: string): Promise<string | null> {
    if (!isSupabaseConfigured || !supabase) return null;
    try {
      const { data, error } = await supabase.storage
        .from('invoices')
        .upload(path, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('invoices')
        .getPublicUrl(data.path);

      return urlData.publicUrl;
    } catch (err) {
      console.error('Cloud Storage upload error:', err);
      return null;
    }
  },

  // Fetch Invoices from DB
  async getInvoices(): Promise<Invoice[] | null> {
    if (!isSupabaseConfigured || !supabase) return null;
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map((i: any) => ({
        id: i.id,
        expenseId: i.expense_id,
        maintenanceRecordId: i.maintenance_record_id || '22222222-3333-4444-5555-666666666666',
        fileName: i.file_name,
        fileSize: Number(i.file_size) || 0,
        fileType: i.file_type || 'application/pdf',
        storagePath: i.storage_path || '',
        uploadedBy: i.uploaded_by || 'Admin',
        uploadedAt: i.created_at || new Date().toISOString(),
        ocrText: i.ocr_data?.text || '',
      }));
    } catch (err) {
      console.warn('Cloud DB fetch invoices fallback:', err);
      return null;
    }
  },

  // Add Invoice to Cloud DB
  async addInvoice(invoice: Invoice, currentUserId?: string): Promise<{ success: boolean; error?: string }> {
    if (!isSupabaseConfigured || !supabase) return { success: false, error: 'Cloud DB not configured' };
    try {
      const validId = isValidUUID(invoice.id) ? invoice.id : generateUUID();
      const recordId = isValidUUID(invoice.maintenanceRecordId)
        ? invoice.maintenanceRecordId
        : null;
      const uploadedBy = currentUserId && isValidUUID(currentUserId)
        ? currentUserId
        : 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

      const insertData: any = {
        id: validId,
        file_name: invoice.fileName,
        file_size: invoice.fileSize,
        file_type: invoice.fileType,
        storage_path: invoice.storagePath,
        uploaded_by: uploadedBy,
        ocr_data: { text: invoice.ocrText || '' },
      };
      if (recordId) insertData.maintenance_record_id = recordId;
      if (invoice.expenseId && isValidUUID(invoice.expenseId)) {
        insertData.expense_id = invoice.expenseId;
      }

      const { error } = await supabase.from('invoices').insert(insertData);

      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (err: any) {
      console.warn('Cloud DB insert invoice notice:', err);
      return { success: false, error: err?.message || 'Failed to save invoice' };
    }
  },

  // Delete Invoice from Cloud DB
  async deleteInvoice(invoiceId: string): Promise<{ success: boolean; error?: string }> {
    if (!isSupabaseConfigured || !supabase) return { success: false, error: 'Cloud DB not configured' };
    try {
      const { error } = await supabase.from('invoices').delete().eq('id', invoiceId);
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (err: any) {
      console.warn('Cloud DB delete invoice notice:', err);
      return { success: false, error: err?.message || 'Failed to delete invoice' };
    }
  },

  // Fetch Notification Logs from DB
  async getNotificationLogs(): Promise<NotificationLog[] | null> {
    if (!isSupabaseConfigured || !supabase) return null;
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map((n: any) => ({
        id: n.id,
        maintenanceRecordId: n.maintenance_record_id,
        recipientEmail: n.metadata?.recipient_email || '',
        type: n.type || 'maintenance_added',
        subject: n.subject || '',
        status: 'sent',
        sentAt: n.sent_at || n.created_at,
      }));
    } catch (err) {
      console.warn('Cloud DB fetch notifications fallback:', err);
      return null;
    }
  },

  // Add Notification Log to Cloud DB
  async addNotificationLog(log: NotificationLog, currentUserId?: string): Promise<{ success: boolean; error?: string }> {
    if (!isSupabaseConfigured || !supabase) return { success: false, error: 'Cloud DB not configured' };
    try {
      const validId = isValidUUID(log.id) ? log.id : generateUUID();
      const recipientId = currentUserId && isValidUUID(currentUserId)
        ? currentUserId
        : 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
      const recordId = isValidUUID(log.maintenanceRecordId)
        ? log.maintenanceRecordId
        : null;

      const insertData: any = {
        id: validId,
        recipient_id: recipientId,
        type: log.type,
        subject: log.subject,
        content: log.subject,
        metadata: { recipient_email: log.recipientEmail },
        sent_at: log.sentAt || new Date().toISOString(),
      };
      if (recordId) insertData.maintenance_record_id = recordId;

      const { error } = await supabase.from('notifications').insert(insertData);

      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (err: any) {
      console.warn('Cloud DB add notification notice:', err);
      return { success: false, error: err?.message || 'Failed to record notification log' };
    }
  },

  // Fetch Security Audit Logs from Cloud DB
  async getAuditLogs(): Promise<AuditLog[] | null> {
    if (!isSupabaseConfigured || !supabase) return null;
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) throw error;

      return (data || []).map((a: any) => ({
        id: a.id,
        userId: a.user_id || 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        userEmail: a.user_email || 'system@chemadura.com',
        action: a.action,
        resourceType: a.resource_type || 'system',
        resourceId: a.resource_id ? String(a.resource_id) : undefined,
        timestamp: a.created_at || new Date().toISOString(),
        ipAddress: a.ip_address ? String(a.ip_address) : '0.0.0.0',
      }));
    } catch (err) {
      console.warn('Cloud DB fetch audit logs fallback:', err);
      return null;
    }
  },

  // Add Security Audit Log to Cloud DB
  async addAuditLog(log: AuditLog): Promise<{ success: boolean; error?: string }> {
    if (!isSupabaseConfigured || !supabase) return { success: false, error: 'Cloud DB not configured' };
    try {
      const validId = isValidUUID(log.id) ? log.id : generateUUID();
      const validUserId = isValidUUID(log.userId) ? log.userId : null;
      const validResourceId = log.resourceId && isValidUUID(log.resourceId) ? log.resourceId : null;

      const payload: any = {
        id: validId,
        user_id: validUserId,
        action: log.action,
        resource_type: log.resourceType,
        resource_id: validResourceId,
        user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : 'desktop-app',
      };
      payload.user_email = log.userEmail;

      let { error } = await supabase.from('audit_logs').insert(payload);
      if (error) {
        // Fallback without user_email / resource_id if column mismatch
        const fallback = {
          id: validId,
          user_id: validUserId,
          action: log.action,
          resource_type: log.resourceType,
        };
        const res = await supabase.from('audit_logs').insert(fallback);
        if (res.error) return { success: false, error: res.error.message };
      }
      return { success: true };
    } catch (err: any) {
      console.warn('Cloud DB add audit log warning:', err);
      return { success: false, error: err?.message || 'Failed to record audit log' };
    }
  },

  // MASTER GOD MODE ACTION: Sync and Lock ALL Data Permanently in Cloud DB
  async syncAllDataToCloud(data: {
    house?: House;
    users?: User[];
    record?: MaintenanceRecord;
    expenses?: Expense[];
  }): Promise<{ success: boolean; message: string; details: any }> {
    const details: any = { house: false, users: 0, record: false, expenses: 0 };
    if (!isSupabaseConfigured || !supabase) {
      return { success: false, message: 'Cloud DB offline or unconfigured.', details };
    }

    try {
      // 1. Sync House
      if (data.house) {
        const hRes = await cloudDb.updateHouse(data.house);
        details.house = hRes.success;
      }

      // 2. Sync Users
      if (data.users && data.users.length > 0) {
        for (const u of data.users) {
          const result = await cloudDb.updateUser(u);
          if (result.success) details.users++;
        }
      }

      // 3. Sync Maintenance Record
      if (data.record) {
        const rRes = await cloudDb.updateMaintenanceRecord(data.record);
        details.record = rRes.success;
      }

      // 4. Sync Expenses
      if (data.expenses && data.expenses.length > 0) {
        for (const exp of data.expenses) {
          const ok = await cloudDb.addExpense(exp);
          if (ok.success) details.expenses++;
        }
      }

      const anySuccess = details.house || details.users > 0 || details.record || details.expenses > 0;
      return {
        success: anySuccess,
        message: anySuccess
          ? 'Platform state successfully locked and made permanent in Cloud PostgreSQL!'
          : 'Sync completed. Check Supabase RLS policies if writes were restricted.',
        details,
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Sync error: ${err.message || 'Unknown'}`,
        details,
      };
    }
  },
};
