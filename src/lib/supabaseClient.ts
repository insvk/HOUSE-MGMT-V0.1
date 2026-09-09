import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { User, MaintenanceRecord, Expense, Invoice, NotificationLog, House } from '../types';

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
      };
    } catch (err) {
      console.warn('Cloud DB fetch house fallback:', err);
      return null;
    }
  },

  // Update / Upsert House Master Permanently in DB
  async updateHouse(house: House): Promise<boolean> {
    if (!isSupabaseConfigured || !supabase) return false;
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
          updated_at: new Date().toISOString(),
        }, { onConflict: 'id' });

      if (error) throw error;
      return true;
    } catch (err) {
      console.warn('Cloud DB update house warning:', err);
      return false;
    }
  },

  // Fetch Users
  async getUsers(): Promise<User[] | null> {
    if (!isSupabaseConfigured || !supabase) return null;
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;

      return (data || []).map((u: any) => ({
        id: u.id,
        email: u.email,
        password: u.password,
        phone: u.phone || '',
        fullName: u.full_name || '',
        flatNumber: u.flat_number || 'GF',
        role: u.role || 'TENANT',
        occupancyStatus: u.occupancy_status || 'active',
        paymentStatus: u.payment_status || 'paid',
        avatarUrl: u.avatar_url,
        moveInDate: u.move_in_date,
        rentAmount: u.rent_amount ? Number(u.rent_amount) : 0,
        depositAmount: u.deposit_amount ? Number(u.deposit_amount) : 0,
        emergencyContact: u.emergency_contact,
        notes: u.notes,
      }));
    } catch (err) {
      console.warn('Cloud DB fetch users fallback:', err);
      return null;
    }
  },

  // Insert New User
  async createUser(user: User): Promise<boolean> {
    if (!isSupabaseConfigured || !supabase) return false;
    try {
      const { error } = await supabase.from('users').insert({
        id: user.id,
        email: user.email,
        password: user.password,
        phone: user.phone,
        full_name: user.fullName,
        flat_number: user.flatNumber,
        occupancy_status: user.occupancyStatus,
        payment_status: user.paymentStatus,
        avatar_url: user.avatarUrl,
        move_in_date: user.moveInDate,
        rent_amount: user.rentAmount,
        deposit_amount: user.depositAmount,
        emergency_contact: user.emergencyContact,
        notes: user.notes,
      });

      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Cloud DB insert user error:', err);
      return false;
    }
  },

  // Update Existing User Details & Profile Picture
  async updateUser(user: User): Promise<boolean> {
    if (!isSupabaseConfigured || !supabase) return false;
    try {
      const { error } = await supabase
        .from('users')
        .update({
          password: user.password,
          phone: user.phone,
          full_name: user.fullName,
          flat_number: user.flatNumber,
          occupancy_status: user.occupancyStatus,
          payment_status: user.paymentStatus,
          avatar_url: user.avatarUrl,
          move_in_date: user.moveInDate,
          rent_amount: user.rentAmount,
          deposit_amount: user.depositAmount,
          emergency_contact: user.emergencyContact,
          notes: user.notes,
          updated_at: new Date().toISOString(),
        })
        .eq('email', user.email.toLowerCase());

      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Cloud DB update user error:', err);
      return false;
    }
  },

  // Direct Update for User Avatar URL
  async updateUserAvatar(email: string, avatarUrl: string): Promise<boolean> {
    if (!isSupabaseConfigured || !supabase) return false;
    try {
      const { error } = await supabase
        .from('users')
        .update({
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('email', email.toLowerCase());

      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Cloud DB update avatar error:', err);
      return false;
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
  async updateMaintenanceRecord(record: MaintenanceRecord): Promise<boolean> {
    if (!isSupabaseConfigured || !supabase) return false;
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

      if (error) throw error;
      return true;
    } catch (err) {
      console.warn('Cloud DB update maintenance record notice:', err);
      return false;
    }
  },

  // Delete User from Cloud DB (soft-delete)
  async deleteUser(userIdOrEmail: string): Promise<boolean> {
    if (!isSupabaseConfigured || !supabase) return false;
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
        query = query.eq('email', userIdOrEmail.toLowerCase());
      }

      const { error } = await query;
      if (error) throw error;
      return true;
    } catch (err) {
      console.warn('Cloud DB delete user notice:', err);
      return false;
    }
  },

  // Update User Payment Status in Cloud DB
  async updateUserPaymentStatus(email: string, paymentStatus: string): Promise<boolean> {
    if (!isSupabaseConfigured || !supabase) return false;
    try {
      const { error } = await supabase
        .from('users')
        .update({
          payment_status: paymentStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('email', email.toLowerCase());

      if (error) throw error;
      return true;
    } catch (err) {
      console.warn('Cloud DB update payment status notice:', err);
      return false;
    }
  },

  // Add Expense to Cloud DB (UUID Compliant)
  async addExpense(expense: Expense, currentUserId?: string): Promise<boolean> {
    if (!isSupabaseConfigured || !supabase) return false;
    try {
      const validId = isValidUUID(expense.id) ? expense.id : generateUUID();
      const validRecordId = isValidUUID(expense.maintenanceRecordId)
        ? expense.maintenanceRecordId
        : null;

      if (!validRecordId) {
        console.warn('Cloud DB addExpense: invalid maintenanceRecordId, skipping');
        return false;
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

      if (error) throw error;
      return true;
    } catch (err) {
      console.warn('Cloud DB add expense notice:', err);
      return false;
    }
  },

  // Update Expense in Cloud DB
  async updateExpense(expense: Expense): Promise<boolean> {
    if (!isSupabaseConfigured || !supabase) return false;
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

      if (error) throw error;
      return true;
    } catch (err) {
      console.warn('Cloud DB update expense notice:', err);
      return false;
    }
  },

  // Delete Expense from Cloud DB
  async deleteExpense(expenseId: string): Promise<boolean> {
    if (!isSupabaseConfigured || !supabase) return false;
    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', expenseId);

      if (error) throw error;
      return true;
    } catch (err) {
      console.warn('Cloud DB delete expense notice:', err);
      return false;
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
      console.warn('Realtime subscription fallback:', err);
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
  async addInvoice(invoice: Invoice, currentUserId?: string): Promise<boolean> {
    if (!isSupabaseConfigured || !supabase) return false;
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
      };
      if (recordId) insertData.maintenance_record_id = recordId;

      const { error } = await supabase.from('invoices').insert(insertData);

      if (error) throw error;
      return true;
    } catch (err) {
      console.warn('Cloud DB insert invoice notice:', err);
      return false;
    }
  },

  // Delete Invoice from Cloud DB
  async deleteInvoice(invoiceId: string): Promise<boolean> {
    if (!isSupabaseConfigured || !supabase) return false;
    try {
      const { error } = await supabase.from('invoices').delete().eq('id', invoiceId);
      if (error) throw error;
      return true;
    } catch (err) {
      console.warn('Cloud DB delete invoice notice:', err);
      return false;
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
  async addNotificationLog(log: NotificationLog, currentUserId?: string): Promise<boolean> {
    if (!isSupabaseConfigured || !supabase) return false;
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
        sent_at: log.sentAt,
      };
      if (recordId) insertData.maintenance_record_id = recordId;

      const { error } = await supabase.from('notifications').insert(insertData);

      if (error) throw error;
      return true;
    } catch (err) {
      console.warn('Cloud DB add notification notice:', err);
      return false;
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
        details.house = await cloudDb.updateHouse(data.house);
      }

      // 2. Sync Users
      if (data.users && data.users.length > 0) {
        for (const u of data.users) {
          const ok = await cloudDb.updateUser(u);
          if (ok) details.users++;
        }
      }

      // 3. Sync Maintenance Record
      if (data.record) {
        details.record = await cloudDb.updateMaintenanceRecord(data.record);
      }

      // 4. Sync Expenses
      if (data.expenses && data.expenses.length > 0) {
        for (const exp of data.expenses) {
          const ok = await cloudDb.addExpense(exp);
          if (ok) details.expenses++;
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
