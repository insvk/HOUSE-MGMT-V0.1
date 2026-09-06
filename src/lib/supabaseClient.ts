import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { User, MaintenanceRecord, Expense, Invoice, NotificationLog } from '../types';

// Environment variables with fallback
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes('placeholder')
);

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
        })),
      }));
    } catch (err) {
      console.warn('Cloud DB fetch records fallback:', err);
      return null;
    }
  },

  // Add Expense to Cloud DB
  async addExpense(expense: Expense): Promise<boolean> {
    if (!isSupabaseConfigured || !supabase) return false;
    try {
      const { error } = await supabase.from('expenses').insert({
        id: expense.id,
        maintenance_record_id: expense.maintenanceRecordId,
        sl_no: expense.slNo,
        particular: expense.particular,
        amount: expense.amount,
        category: expense.category,
        gst_applicable: expense.gstApplicable,
        gst_amount: expense.gstAmount,
        notes: expense.notes,
        added_by: expense.addedBy,
      });

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
      const { error } = await supabase
        .from('expenses')
        .update({
          particular: expense.particular,
          amount: expense.amount,
          category: expense.category,
          gst_applicable: expense.gstApplicable,
          gst_amount: expense.gstAmount,
          notes: expense.notes,
        })
        .eq('id', expense.id);

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
};
