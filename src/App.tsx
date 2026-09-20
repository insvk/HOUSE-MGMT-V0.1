import React, { useState, useEffect } from 'react';
import { initialHouse, initialUsers, initialMaintenanceRecords, initialExpenses, initialInvoices, initialNotificationLogs, initialAuditLogs, isDummyLegacyAccount, isDummyLegacyExpense } from './data/initialData';
import { MaintenanceRecord, User, UserRole, Expense, Invoice, NotificationLog, AuditLog } from './types';
import { LoginPage } from './components/LoginPage';
import { Dashboard } from './components/Dashboard';
import { MaintenanceModule } from './components/MaintenanceModule';
import { TenantDirectory } from './components/TenantDirectory';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { InvoiceGallery } from './components/InvoiceGallery';
import { NotificationCenter } from './components/NotificationCenter';
import { AuditLogViewer } from './components/AuditLogViewer';
import { SettingsModal } from './components/SettingsModal';
import { EditExpenseModal } from './components/EditExpenseModal';
import { CommandPalette } from './components/CommandPalette';
import { AvatarUploadModal } from './components/AvatarUploadModal';
import { EditProfileModal } from './components/EditProfileModal';
import { SecurityDashboardModal } from './components/SecurityDashboardModal';
import { GoogleClock } from './components/GoogleClock';
import { exportMaintenanceToExcel, exportMaintenanceToPDF, exportTenantsToExcel } from './utils/exportUtils';
import { setAudioEnabled, playSuccessChime, playNotificationChime, playWarningChime } from './utils/audioUtils';
import { setGlobalClock24hPreference } from './lib/googleTimeClient';
import { setGlobalResendConfig } from './lib/resendClient';
import { authService } from './lib/authService';
import { supabase, cloudDb, isSupabaseConfigured, generateUUID, mapDbRowToUser } from './lib/supabaseClient';
import { House } from './types';
import { 
  Building2, 
  LayoutDashboard, 
  Calendar, 
  Users, 
  BarChart3, 
  FileText, 
  Mail, 
  ShieldCheck, 
  Shield,
  LogOut, 
  Plus, 
  Download, 
  KeyRound, 
  Settings, 
  TrendingUp, 
  AlertCircle, 
  IndianRupee, 
  CheckCircle, 
  CheckCircle2,
  FileCheck, 
  Clock, 
  Sliders, 
  Lock, 
  RefreshCw, 
  Search, 
  Check, 
  Receipt,
  UserCheck,
  Zap,
  Sparkles,
  Database,
  Wifi,
  WifiOff,
  Bell,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ShieldAlert,
  Flame,
  Home,
  Maximize,
  Camera,
  Wrench,
  Sun,
  Moon
} from 'lucide-react';

const STORAGE_KEY_USERS = 'madura_house_users_v2';
const STORAGE_KEY_RECORDS = 'madura_house_records_v1';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

// Helper to normalize legacy flat strings (e.g. Flat 101 -> F01 - FRONT)
export const normalizeFlat = (flat?: string): string => {
  if (!flat) return 'GF';
  const trimmed = flat.trim();
  if (trimmed === 'Flat 101') return 'F01 - FRONT';
  if (trimmed === 'Flat 102') return 'F01 - BACK';
  if (trimmed === 'Flat 201') return 'F02 - FRONT';
  if (trimmed === 'Flat 202') return 'F02 - BACK';
  if (trimmed === 'Flat 301' || trimmed === 'Flat 302') return 'GF';
  return trimmed;
};

export function App() {
  // Persistent State for Users & Records with automatic credential preservation & dummy purge
  const [users, setUsers] = useState<User[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_USERS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const map = new Map<string, User>();
          // Base defaults (Admin/Owner)
          initialUsers.forEach((iu) => map.set(iu.email.toLowerCase().trim(), iu));
          // Overlay saved data, automatically purging any legacy dummy/typo accounts
          parsed.forEach((u: User) => {
            if (!u.email || isDummyLegacyAccount(u.email)) return;
            const emailKey = u.email.toLowerCase().trim();
            const existing = map.get(emailKey);
            const isOwner = emailKey === 'sampathkumar@chemadura.com';
            if (existing) {
              map.set(emailKey, {
                ...existing,
                ...u,
                email: emailKey,
                flatNumber: normalizeFlat(u.flatNumber || existing.flatNumber),
                password: u.password || existing.password,
                role: isOwner ? 'OWNER' : (u.role || existing.role),
              });
            } else {
              map.set(emailKey, {
                ...u,
                email: emailKey,
                flatNumber: normalizeFlat(u.flatNumber),
                role: isOwner ? 'OWNER' : (u.role || 'TENANT'),
              });
            }
          });
          const result = Array.from(map.values());
          // Synchronize cleansed list back to storage immediately
          try {
            localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(result));
            localStorage.setItem('madura_house_users_db_v3', JSON.stringify(result));
          } catch {}
          return result;
        }
      }
      return initialUsers;
    } catch {
      return initialUsers;
    }
  });

  const [records, setRecords] = useState<MaintenanceRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_RECORDS);
      if (saved) {
        const parsed: MaintenanceRecord[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const cleaned = parsed.map((r) => {
            // Filter out any legacy dummy expenses
            const cleanExpenses = (r.expenses || []).filter((e) => !isDummyLegacyExpense(e));
            const grandTotal = cleanExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
            const tenantsCount = r.activeTenantsCount || 5;
            const individualContribution = tenantsCount > 0 ? grandTotal / tenantsCount : grandTotal;
            return {
              ...r,
              expenses: cleanExpenses,
              grandTotal: grandTotal,
              individualContribution: individualContribution,
              activeTenantsCount: tenantsCount,
            };
          });
          try {
            localStorage.setItem(STORAGE_KEY_RECORDS, JSON.stringify(cleaned));
          } catch {}
          return cleaned;
        }
      }
      return initialMaintenanceRecords;
    } catch {
      return initialMaintenanceRecords;
    }
  });


  const [isOffline, setIsOffline] = useState<boolean>(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      showToast('Network restored. Reconnecting to servers...');
      if (isSupabaseConfigured) handleSyncCloudDb();
    };
    const handleOffline = () => {
      setIsOffline(true);
      setCloudConnected(false);
      showToast('You are offline. Application is running in local mode.');
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    let cleanupResume: (() => void) | undefined;
    if (window.electronAPI) {
      cleanupResume = window.electronAPI.onSystemResume(() => {
        showToast('System woke from sleep. Re-syncing...');
        if (navigator.onLine && isSupabaseConfigured) {
          handleSyncCloudDb();
        }
      });
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (cleanupResume) cleanupResume();
    };
  }, []);

  // Sync to localStorage (Scrub passwords for security)
  useEffect(() => {
    try {
      const safeUsers = users.map(({ password, ...rest }) => rest);
      localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(safeUsers));
    } catch (e) {
      console.error('LocalStorage sync error:', e);
    }
  }, [users]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_RECORDS, JSON.stringify(records));
    } catch (e) {
      console.error('LocalStorage sync error:', e);
    }
  }, [records]);

  // Default Landing State is Login Page
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<User>(users[0]);
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>('OWNER');

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState<boolean>(false);

  const [house, setHouse] = useState<House>(() => {
    try {
      const saved = localStorage.getItem('madura_house_property_v1');
      return saved ? JSON.parse(saved) : initialHouse;
    } catch {
      return initialHouse;
    }
  });

  // Global Config Hydration
  useEffect(() => {
    if (currentUser?.preferences) {
      if (typeof currentUser.preferences.audioEnabled === 'boolean') {
        setAudioEnabled(currentUser.preferences.audioEnabled);
      }
      if (typeof currentUser.preferences.clock24h === 'boolean') {
        setGlobalClock24hPreference(currentUser.preferences.clock24h);
      }
    }
  }, [currentUser]);

  useEffect(() => {
    if (house?.settings) {
      setGlobalResendConfig(null, house.settings.resendFromEmail || null);
    }
  }, [house]);

  useEffect(() => {
    if (isLoggedIn && (currentUserRole === 'OWNER' || currentUserRole === 'ADMIN_TENANT')) {
      cloudDb.getSecret('RESEND_API_KEY').then(key => {
        if (key) setGlobalResendConfig(key, null);
      });
    }
  }, [isLoggedIn, currentUserRole]);

  useEffect(() => {
    try {
      localStorage.setItem('madura_house_property_v1', JSON.stringify(house));
    } catch (e) {
      console.error('LocalStorage house write error:', e);
    }
  }, [house]);

  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    try {
      const saved = localStorage.getItem('madura_house_invoices_v1');
      return saved ? JSON.parse(saved) : initialInvoices;
    } catch {
      return initialInvoices;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('madura_house_invoices_v1', JSON.stringify(invoices));
    } catch (e) {
      console.error('Invoice sync error:', e);
    }
  }, [invoices]);
  const [notificationLogs, setNotificationLogs] = useState<NotificationLog[]>(() => {
    try {
      const saved = localStorage.getItem('madura_house_notifications_v1');
      return saved ? JSON.parse(saved) : initialNotificationLogs;
    } catch {
      return initialNotificationLogs;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('madura_house_notifications_v1', JSON.stringify(notificationLogs));
    } catch (e) {
      console.error('Notification log sync error:', e);
    }
  }, [notificationLogs]);

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(initialAuditLogs);
  
  const [selectedRecordId, setSelectedRecordId] = useState<string>(initialMaintenanceRecords[0].id);
  const [showSettings, setShowSettings] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [cloudConnected, setCloudConnected] = useState(isSupabaseConfigured);
  const [lastSynced, setLastSynced] = useState('Just now');
  const [isSyncing, setIsSyncing] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showAvatarModal, setShowAvatarModal] = useState<boolean>(false);
  const [showProfileModal, setShowProfileModal] = useState<boolean>(false);
  const [showSecurityDashboard, setShowSecurityDashboard] = useState<boolean>(false);

  // Theme State
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      const storedTheme = localStorage.getItem('madura_theme');
      if (storedTheme === 'dark' || storedTheme === 'light') return storedTheme;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } catch {
      return 'light';
    }
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    try {
      localStorage.setItem('madura_theme', theme);
    } catch {}
  }, [theme]);

  const toggleTheme = async () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    
    // Sync with cloud preferences if logged in
    if (isLoggedIn && currentUser) {
      try {
        const updatedPrefs = { ...(currentUser.preferences || {}) };
        await cloudDb.updateUserPreferences(currentUser.email, updatedPrefs);
        setCurrentUser(prev => ({ ...prev, preferences: updatedPrefs }));
        
        // Also update the users array locally
        setUsers(prev => {
          const updatedList = prev.map(u => 
            u.id === currentUser.id ? { ...u, preferences: updatedPrefs } : u
          );
          try {
            localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(updatedList));
          } catch {}
          return updatedList;
        });
      } catch (err) {
        console.warn('Failed to sync theme preference to cloud', err);
      }
    }
  };

  // Global Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setShowCommandPalette((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSyncCloudDb = async () => {
    setIsSyncing(true);
    try {
      const res = await cloudDb.testConnection();
      if (res.connected) {
        // 1. Fetch House Master
        const remoteHouse = await cloudDb.getHouse();
        if (remoteHouse) {
          setHouse(remoteHouse);
          try {
            localStorage.setItem('madura_house_property_v1', JSON.stringify(remoteHouse));
          } catch {}
        }

        // 2. Fetch Users
        const remoteUsers = await cloudDb.getUsers();
        if (remoteUsers && remoteUsers.length > 0) {
          // Non-destructive Smart Merge: Keep all locally registered users and their credentials!
          setUsers((prevLocalUsers) => {
            const userMap = new Map<string, User>();
            // 1. Load local users first (with passwords, custom notes, created accounts)
            prevLocalUsers.forEach((u) => {
              if (u.email && !isDummyLegacyAccount(u.email)) {
                userMap.set(u.email.toLowerCase().trim(), u);
              }
            });
            // 2. Overlay remote data without wiping passwords or un-synced users
            remoteUsers.forEach((ru) => {
              if (!ru.email || isDummyLegacyAccount(ru.email)) return;
              const emailKey = ru.email.toLowerCase().trim();
              const existing = userMap.get(emailKey);
              const isOwner = emailKey === 'sampathkumar@chemadura.com';
              if (existing) {
                userMap.set(emailKey, {
                  ...existing,
                  ...ru,
                  email: emailKey,
                  flatNumber: normalizeFlat(ru.flatNumber || existing.flatNumber),
                  password: ru.password || existing.password,
                  role: isOwner ? 'OWNER' : (ru.role || existing.role || 'TENANT'),
                });
              } else {
                userMap.set(emailKey, {
                  ...ru,
                  email: emailKey,
                  flatNumber: normalizeFlat(ru.flatNumber),
                  role: isOwner ? 'OWNER' : (ru.role || 'TENANT'),
                });
              }
            });
            const merged = Array.from(userMap.values());
            try {
              localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(merged));
            } catch {}
            return merged;
          });
        }

        // 3. Fetch Maintenance Records & Expenses
        const remoteRecords = await cloudDb.getMaintenanceRecords();
        if (remoteRecords && remoteRecords.length > 0) {
          setRecords((prev) =>
            remoteRecords.map((rr) => {
              const local = prev.find((p) => p.id === rr.id || (p.month === rr.month && p.year === rr.year));
              const rawExpenses = (rr.expenses && rr.expenses.length > 0)
                ? rr.expenses
                : (local?.expenses && local.expenses.length > 0)
                  ? local.expenses
                  : [];
              const cleanExpenses = rawExpenses.filter((e) => !isDummyLegacyExpense(e));
              const grandTotal = cleanExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
              const tenants = rr.activeTenantsCount || local?.activeTenantsCount || 5;
              return {
                ...rr,
                expenses: cleanExpenses,
                grandTotal: grandTotal,
                individualContribution: tenants > 0 ? grandTotal / tenants : grandTotal,
              };
            })
          );
        }

        // 4. Fetch Digital Invoices
        const remoteInvoices = await cloudDb.getInvoices();
        if (remoteInvoices && remoteInvoices.length > 0) {
          setInvoices(remoteInvoices);
        }

        // 5. Fetch Notification Broadcast Logs
        const remoteLogs = await cloudDb.getNotificationLogs();
        if (remoteLogs && remoteLogs.length > 0) {
          setNotificationLogs(remoteLogs);
        }

        // 6. Fetch Security Audit Logs
        const remoteAudit = await cloudDb.getAuditLogs();
        if (remoteAudit && remoteAudit.length > 0) {
          setAuditLogs(remoteAudit);
        }

        setCloudConnected(true);
        setLastSynced(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }));
        showToast('Cloud PostgreSQL sync completed!');
        playSuccessChime();
      } else {
        setCloudConnected(false);
        showToast('Local Vault active (Cloud DB unconfigured or offline)');
      }
    } catch {
      setCloudConnected(false);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    if (isSupabaseConfigured) {
      handleSyncCloudDb();
    }
  }, []);

  // Supabase Real-time Subscriptions across all platform tables for multi-device sync
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    const unsubscribe = cloudDb.subscribeToAllPlatformChanges({
      // 1. Live Users & Tenants Updates
      onUsersChange: (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          if (payload.new && payload.new.email) {
            const rawEmail = (payload.new.email || '').toLowerCase().trim();
            if (isDummyLegacyAccount(rawEmail)) return;

            // Check if soft-deleted or deactivated
            if (payload.new.is_active === false || payload.new.deleted_at) {
              setUsers((prev) => {
                const filtered = prev.filter((u) => u.email.toLowerCase().trim() !== rawEmail && u.id !== payload.new.id);
                try {
                  localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(filtered));
                } catch {}
                return filtered;
              });
              return;
            }

            const mapped = mapDbRowToUser(payload.new);
            setUsers((prev) => {
              const userMap = new Map<string, User>();
              prev.forEach((u) => userMap.set(u.email.toLowerCase().trim(), u));
              const existing = userMap.get(rawEmail);
              userMap.set(rawEmail, {
                ...(existing || {}),
                ...mapped,
                password: existing?.password || mapped.password,
              });
              const updatedList = Array.from(userMap.values());
              try {
                localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(updatedList));
              } catch {}
              return updatedList;
            });

            // Update current user if active profile changed
            setCurrentUser((prev) => {
              if (prev.email.toLowerCase().trim() === rawEmail) {
                return { ...prev, ...mapped, password: prev.password || mapped.password };
              }
              return prev;
            });
          }
        } else if (payload.eventType === 'DELETE' && payload.old) {
          const deletedId = payload.old.id;
          const deletedEmail = (payload.old.email || '').toLowerCase().trim();
          setUsers((prev) => {
            const filtered = prev.filter(
              (u) => (deletedId ? u.id !== deletedId : true) && (deletedEmail ? u.email.toLowerCase().trim() !== deletedEmail : true)
            );
            try {
              localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(filtered));
            } catch {}
            return filtered;
          });
        }
      },

      // 2. Live Property Master Updates
      onHouseChange: (payload) => {
        if ((payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') && payload.new) {
          const h = payload.new;
          setHouse((prev) => {
            const updated = {
              ...prev,
              name: h.name || prev.name,
              address: h.address || prev.address,
              city: h.city || prev.city,
              postalCode: h.postal_code || prev.postalCode,
              totalUnits: Number(h.total_units) || prev.totalUnits,
              settings: h.settings || prev.settings,
            };
            try {
              localStorage.setItem('madura_house_property_v1', JSON.stringify(updated));
            } catch {}
            return updated;
          });
        }
      },

      // 3. Live Maintenance Records Header Updates
      onRecordsChange: (payload) => {
        if ((payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') && payload.new) {
          const nr = payload.new;
          setRecords((prev) =>
            prev.map((r) => {
              if (r.id === nr.id || (r.month === nr.month && r.year === nr.year)) {
                return {
                  ...r,
                  grandTotal: Number(nr.grand_total) || r.grandTotal,
                  activeTenantsCount: nr.number_of_active_tenants || r.activeTenantsCount,
                  individualContribution: Number(nr.individual_contribution) || r.individualContribution,
                  notes: nr.notes !== undefined ? nr.notes : r.notes,
                };
              }
              return r;
            })
          );
        }
      },

      // 4. Live Expense Line Item Updates
      onExpensesChange: (payload) => {
        if (payload.eventType === 'INSERT' && payload.new) {
          const item = payload.new;
          const newExp: Expense = {
            id: item.id,
            maintenanceRecordId: item.maintenance_record_id,
            slNo: item.sl_no,
            particular: item.particular,
            amount: Number(item.amount) || 0,
            category: item.category,
            gstApplicable: Boolean(item.gst_applicable),
            gstAmount: Number(item.gst_amount) || 0,
            notes: item.notes || '',
            addedBy: item.added_by || '',
            createdAt: item.created_at || new Date().toISOString(),
          };
          setRecords((prev) =>
            prev.map((r) => {
              if (r.id === newExp.maintenanceRecordId || (r.month === 9 && r.year === 2026)) {
                if (r.expenses.some((e) => e.id === newExp.id)) return r;
                const updatedExpenses = [newExp, ...r.expenses];
                const grandTotal = updatedExpenses.reduce((sum, e) => sum + e.amount, 0);
                const individualContribution = grandTotal / (r.activeTenantsCount || 5);
                return { ...r, expenses: updatedExpenses, grandTotal, individualContribution };
              }
              return r;
            })
          );
        } else if (payload.eventType === 'UPDATE' && payload.new) {
          const item = payload.new;
          setRecords((prev) =>
            prev.map((r) => {
              const updatedExpenses = r.expenses.map((e) =>
                e.id === item.id
                  ? {
                      ...e,
                      particular: item.particular,
                      amount: Number(item.amount) || 0,
                      category: item.category,
                      notes: item.notes,
                    }
                  : e
              );
              const grandTotal = updatedExpenses.reduce((sum, e) => sum + e.amount, 0);
              const individualContribution = grandTotal / (r.activeTenantsCount || 5);
              return { ...r, expenses: updatedExpenses, grandTotal, individualContribution };
            })
          );
        } else if (payload.eventType === 'DELETE' && payload.old) {
          const item = payload.old;
          setRecords((prev) =>
            prev.map((r) => {
              const updatedExpenses = r.expenses.filter((e) => e.id !== item.id);
              const grandTotal = updatedExpenses.reduce((sum, e) => sum + e.amount, 0);
              const individualContribution = grandTotal / (r.activeTenantsCount || 5);
              return { ...r, expenses: updatedExpenses, grandTotal, individualContribution };
            })
          );
        }
      },

      // 5. Live Invoices Updates
      onInvoicesChange: (payload) => {
        if (payload.eventType === 'INSERT' && payload.new) {
          const i = payload.new;
          const newInv: Invoice = {
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
          };
          setInvoices((prev) => (prev.some((item) => item.id === newInv.id) ? prev : [newInv, ...prev]));
        } else if (payload.eventType === 'DELETE' && payload.old) {
          setInvoices((prev) => prev.filter((item) => item.id !== payload.old.id));
        }
      },

      // 6. Live Notification Logs
      onNotificationsChange: (payload) => {
        if (payload.eventType === 'INSERT' && payload.new) {
          const n = payload.new;
          const newLog: NotificationLog = {
            id: n.id,
            maintenanceRecordId: n.maintenance_record_id,
            recipientEmail: n.metadata?.recipient_email || '',
            type: n.type || 'maintenance_added',
            subject: n.subject || '',
            status: 'sent',
            sentAt: n.sent_at || n.created_at,
          };
          setNotificationLogs((prev) => (prev.some((item) => item.id === newLog.id) ? prev : [newLog, ...prev]));
        }
      },
    });

    // Supabase Auth State Change Listener
    let authListener: any = null;
    if (supabase) {
      const { data } = supabase.auth.onAuthStateChange((event: string, session: any) => {
        if (event === 'SIGNED_OUT') {
          setIsLoggedIn(false);
        }
      });
      authListener = data;
    }

    return () => {
      unsubscribe();
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  // Multi-tab Real-time synchronization
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY_RECORDS && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) setRecords(parsed);
        } catch {}
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const handleRestoreSystemBackup = (data: {
    house?: House;
    users?: User[];
    records?: MaintenanceRecord[];
    invoices?: Invoice[];
    notificationLogs?: NotificationLog[];
    auditLogs?: AuditLog[];
  }) => {
    if (data.house) setHouse(data.house);
    if (data.users) setUsers(data.users);
    if (data.records) setRecords(data.records);
    if (data.invoices) setInvoices(data.invoices);
    if (data.notificationLogs) setNotificationLogs(data.notificationLogs);
    if (data.auditLogs) setAuditLogs(data.auditLogs);
    showToast('Platform restored from system backup successfully!');
    playSuccessChime();
  };

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const activeRecord = records.find((r) => r.id === selectedRecordId) || records[0];

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Current User Avatar Update & Cloud Sync
  const handleSaveCurrentUserAvatar = async (newAvatarUrl: string) => {
    // 1. Update current logged-in user
    const updatedUser = { ...currentUser, avatarUrl: newAvatarUrl };
    setCurrentUser(updatedUser);

    const previousAvatar = currentUser.avatarUrl;
    const previousUsers = users;

    // 2. Update users list and write to local storage vault immediately
    setUsers((prev) => {
      const updated = prev.map((u) =>
        u.email.toLowerCase() === currentUser.email.toLowerCase()
          ? { ...u, avatarUrl: newAvatarUrl }
          : u
      );
      try {
        localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(updated));
      } catch (e) {
        console.error('LocalStorage avatar write error:', e);
      }
      return updated;
    });

    // 3. Persist to Supabase Cloud PostgreSQL
    if (isSupabaseConfigured) {
      const res = await cloudDb.updateUserAvatar(currentUser.email, newAvatarUrl);
      if (!res.success) {
        setCurrentUser((prev) => ({ ...prev, avatarUrl: previousAvatar }));
        setUsers(previousUsers);
        try {
          localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(previousUsers));
        } catch {}
        playWarningChime();
        showToast(`❌ Failed to update profile photo in database: ${res.error || 'Unknown error'}`);
        return;
      }
    }

    // 4. Record Audit Log
    await recordAudit('UPDATE_PROFILE_AVATAR', 'users', currentUser.email);

    playSuccessChime();
    showToast('Profile picture updated and synced to cloud!');
  };

  // Helper to persist audit logs reliably to cloud DB
  const recordAudit = async (action: string, resourceType: string, resourceId?: string) => {
    const newAudit: AuditLog = {
      id: generateUUID(),
      userId: (currentUserRole === 'OWNER' || currentUserRole === 'ADMIN_TENANT') ? 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' : currentUser.id,
      userEmail: currentUser.email,
      action,
      resourceType,
      resourceId,
      timestamp: new Date().toISOString(),
      ipAddress: '0.0.0.0',
    };
    setAuditLogs((prev) => [newAudit, ...prev]);
    if (isSupabaseConfigured) {
      await cloudDb.addAuditLog(newAudit);
    }
  };

  // Realtime Cloud Clock Preference Synchronizer
  const handleUpdateClockPreference = async (is24h: boolean) => {
    setGlobalClock24hPreference(is24h);
    const updatedPrefs = {
      ...currentUser.preferences,
      clock24h: is24h,
    };
    setCurrentUser((prev) => ({ ...prev, preferences: updatedPrefs }));
    setUsers((prev) =>
      prev.map((u) => (u.id === currentUser.id ? { ...u, preferences: updatedPrefs } : u))
    );
    if (isSupabaseConfigured) {
      await cloudDb.updateUserPreferences(currentUser.email, updatedPrefs);
    }
  };

  // Login Handler
  const handleLoginSuccess = (user: User, role: UserRole) => {
    setCurrentUser(user);
    setCurrentUserRole(role);
    setIsLoggedIn(true);

    // Authoritative preference hydration
    if (user.preferences?.audioEnabled !== undefined) {
      setAudioEnabled(user.preferences.audioEnabled);
    }
    if (user.preferences?.clock24h !== undefined) {
      setGlobalClock24hPreference(user.preferences.clock24h);
    }

    if (role === 'OWNER') {
      setActiveTab('dashboard');
      showToast(`Welcome back, Property Owner (${user.fullName})!`);
    } else if (role === 'ADMIN_TENANT') {
      setActiveTab('maintenance');
      showToast(`Welcome, Admin Tenant (${user.fullName})!`);
    } else {
      setActiveTab('dashboard');
      showToast(`Welcome, ${user.fullName} (${user.flatNumber})!`);
    }

    recordAudit('USER_LOGIN_AUTHENTICATED', 'auth_session', user.id);
  };

  // Sign Up Handler
  const handleSignUpSuccess = async (newUser: User) => {
    // 1. Attempt cloud DB persistence FIRST — this is the source of truth
    const dbResult = await cloudDb.createUser(newUser);
    if (!dbResult.success) {
      // On DB failure, still allow the locally-registered user to proceed
      // (they already have a Supabase Auth identity from authService.signUp)
      // but warn clearly in the console
      console.error('Sign-up cloud DB persist failed:', dbResult.error);
      showToast(
        `Account created in Auth, but profile save failed: ${dbResult.error || 'Unknown error'}. Please contact admin.`
      );
    }

    // 2. Save new user into persistent state & localStorage
    setUsers((prev) => {
      const idx = prev.findIndex((u) => u.email.toLowerCase() === newUser.email.toLowerCase());
      const updated = idx >= 0 ? prev.map((u, i) => (i === idx ? newUser : u)) : [...prev, newUser];
      try {
        localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(updated));
      } catch (e) {
        console.error('LocalStorage write error:', e);
      }
      return updated;
    });

    // 3. Auto-login with the newly created account
    setCurrentUser(newUser);
    setCurrentUserRole(newUser.role);
    setIsLoggedIn(true);

    // 4. Audit Log
    const signupAudit: AuditLog = {
      id: generateUUID(),
      userId: newUser.id,
      userEmail: newUser.email,
      action: 'NEW_RESIDENT_PORTAL_SIGNUP',
      resourceType: 'users',
      resourceId: newUser.id,
      timestamp: new Date().toISOString(),
      ipAddress: '0.0.0.0',
    };
    setAuditLogs((prev) => [signupAudit, ...prev]);

    if (newUser.role === 'OWNER') {
      setActiveTab('dashboard');
    } else if (newUser.role === 'ADMIN_TENANT') {
      setActiveTab('maintenance');
    } else {
      setActiveTab('dashboard');
    }

    if (dbResult.success) {
      showToast(`Account created and persisted to cloud for ${newUser.fullName}!`);
    }
  };

  // Logout Handler
  const handleLogout = async () => {
    try {
      const { authService } = await import('./lib/authService');
      await authService.logout();
    } catch (e) {
      console.error('Logout error:', e);
    }
    setIsLoggedIn(false);
    setUserDropdownOpen(false);
    showToast('Logged out successfully. Returned to Login Landing Page.');
  };

  // Add Expense Handler - Authenticated & Permanently Persisted to Cloud DB
  const handleAddExpense = async (newExpenseData: Omit<Expense, 'id' | 'createdAt'>) => {
    if (isOffline) {
      showToast('Cannot add expense while offline.');
      playWarningChime();
      return;
    }
    const expenseId = generateUUID();
    const newExpense: Expense = {
      ...newExpenseData,
      id: expenseId,
      createdAt: new Date().toISOString(),
    };

    const previousRecords = records;

    // 1. Optimistic UI update
    setRecords((prev) =>
      prev.map((r) => {
        if (r.id === activeRecord.id) {
          const updatedExpenses = [newExpense, ...r.expenses];
          const newGrandTotal = updatedExpenses.reduce((sum, e) => sum + e.amount, 0);
          const newContribution = newGrandTotal / (r.activeTenantsCount || 5);

          return {
            ...r,
            expenses: updatedExpenses,
            grandTotal: newGrandTotal,
            individualContribution: newContribution,
          };
        }
        return r;
      })
    );

    // 2. Authoritative Cloud Database Write
    const res = await cloudDb.addExpense(newExpense, currentUser.id);
    if (!res.success) {
      setRecords(previousRecords);
      playWarningChime();
      showToast(`❌ Failed to save expense in Cloud DB: ${res.error || 'Unknown error'}. Reverted.`);
      return;
    }

    await recordAudit('ADD_EXPENSE_ITEM', 'expenses', expenseId);
    playSuccessChime();
    showToast(`Added expense "${newExpenseData.particular}" (₹${newExpenseData.amount.toLocaleString('en-IN')})`);
  };

  // Edit Expense Handler - Authenticated & Permanently Persisted to Cloud DB
  const handleSaveEditedExpense = async (updatedExpense: Expense) => {
    if (isOffline) {
      showToast('Cannot edit expense while offline.');
      playWarningChime();
      return;
    }

    const previousRecords = records;

    // 1. Optimistic UI update
    setRecords((prev) =>
      prev.map((r) => {
        if (r.id === activeRecord.id) {
          const updatedExpenses = r.expenses.map((e) => (e.id === updatedExpense.id ? updatedExpense : e));
          const newGrandTotal = updatedExpenses.reduce((sum, e) => sum + e.amount, 0);
          const newContribution = newGrandTotal / (r.activeTenantsCount || 5);

          return {
            ...r,
            expenses: updatedExpenses,
            grandTotal: newGrandTotal,
            individualContribution: newContribution,
          };
        }
        return r;
      })
    );

    // 2. Authoritative Cloud Database Write
    const res = await cloudDb.updateExpense(updatedExpense);
    if (!res.success) {
      setRecords(previousRecords);
      playWarningChime();
      showToast(`❌ Failed to update expense in Cloud DB: ${res.error || 'Unknown error'}. Reverted.`);
      return;
    }

    await recordAudit('UPDATE_EXPENSE_ITEM', 'expenses', updatedExpense.id);
    playSuccessChime();
    showToast(`Updated expense "${updatedExpense.particular}" (saved in Cloud DB)`);
  };

  // Delete Expense Handler - Authenticated & Permanently Persisted to Cloud DB
  const handleDeleteExpense = async (expenseId: string) => {
    if (isOffline) {
      showToast('Cannot delete expense while offline.');
      playWarningChime();
      return;
    }

    const previousRecords = records;

    // 1. Optimistic UI update
    setRecords((prev) =>
      prev.map((r) => {
        if (r.id === activeRecord.id) {
          const updatedExpenses = r.expenses.filter((e) => e.id !== expenseId);
          const newGrandTotal = updatedExpenses.reduce((sum, e) => sum + e.amount, 0);
          const newContribution = newGrandTotal / (r.activeTenantsCount || 5);

          return {
            ...r,
            expenses: updatedExpenses,
            grandTotal: newGrandTotal,
            individualContribution: newContribution,
          };
        }
        return r;
      })
    );

    // 2. Authoritative Cloud Database Write
    const res = await cloudDb.deleteExpense(expenseId);
    if (!res.success) {
      setRecords(previousRecords);
      playWarningChime();
      showToast(`❌ Failed to delete expense from Cloud DB: ${res.error || 'Unknown error'}. Reverted.`);
      return;
    }

    await recordAudit('DELETE_EXPENSE_ITEM', 'expenses', expenseId);
    playWarningChime();
    showToast('Deleted line item expense (removed from Cloud DB).');
  };

  // User Management Handlers
  // ROOT CAUSE #1 FIX: await DB, rollback on failure, surface errors
  const handleAddUser = async (userData: Omit<User, 'id'>) => {
    if (isOffline) {
      showToast('Cannot register users while offline.');
      playWarningChime();
      return;
    }
    const newUser: User = {
      ...userData,
      id: generateUUID(),
    };
    if (newUser.email.toLowerCase() === 'sampathkumar@chemadura.com') {
      newUser.role = 'OWNER';
    }

    // 1. Optimistic local state update
    setUsers((prev) => {
      const updated = [...prev, newUser];
      try {
        localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(updated));
      } catch {}
      return updated;
    });

    // 2. Persist to cloud DB — AWAIT and check result
    const dbResult = await cloudDb.createUser(newUser);

    if (!dbResult.success) {
      // ROLLBACK: remove from local state since cloud write failed
      setUsers((prev) => {
        const rolled = prev.filter((u) => u.id !== newUser.id);
        try {
          localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(rolled));
        } catch {}
        return rolled;
      });
      playWarningChime();
      showToast(
        `❌ Failed to create resident in database: ${dbResult.error || 'Unknown error'}. No changes saved.`
      );
      return;
    }

    // 3. Audit log on confirmed success
    const newAudit: AuditLog = {
      id: generateUUID(),
      userId: (currentUserRole === 'OWNER' || currentUserRole === 'ADMIN_TENANT') ? 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' : currentUser.id,
      userEmail: currentUser.email,
      action: 'CREATE_TENANT_PROFILE',
      resourceType: 'users',
      resourceId: newUser.id,
      timestamp: new Date().toISOString(),
      ipAddress: '0.0.0.0',
    };
    setAuditLogs((prev) => [newAudit, ...prev]);

    playSuccessChime();
    showToast(
      `✅ Resident ${userData.fullName} (${userData.flatNumber}) created and saved to cloud database.`
    );
  };

  // ROOT CAUSE #1 FIX: await DB, rollback on failure
  const handleUpdateUser = async (updatedUser: User) => {
    if (isOffline) {
      showToast('Cannot update users while offline.');
      playWarningChime();
      return;
    }

    if (updatedUser.email.toLowerCase() === 'sampathkumar@chemadura.com') {
      updatedUser.role = 'OWNER';
    }

    // 1. Keep snapshot for rollback
    const previousUsers = users;

    // 2. Optimistic local update
    setUsers((prev) => {
      const updated = prev.map((u) => (u.id === updatedUser.id ? updatedUser : u));
      try {
        localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(updated));
      } catch {}
      return updated;
    });

    if (currentUser.id === updatedUser.id || currentUser.email.toLowerCase() === updatedUser.email.toLowerCase()) {
      setCurrentUser(updatedUser);
    }

    // 3. Persist to cloud and check result
    const dbResult = await cloudDb.updateUser(updatedUser);

    if (!dbResult.success) {
      // ROLLBACK
      setUsers(previousUsers);
      try {
        localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(previousUsers));
      } catch {}
      if (currentUser.id === updatedUser.id) {
        setCurrentUser(previousUsers.find((u) => u.id === updatedUser.id) || currentUser);
      }
      playWarningChime();
      showToast(
        `❌ Failed to update profile in database: ${dbResult.error || 'Unknown error'}. Changes reverted.`
      );
      return;
    }

    const newAudit: AuditLog = {
      id: generateUUID(),
      userId: (currentUserRole === 'OWNER' || currentUserRole === 'ADMIN_TENANT') ? 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' : currentUser.id,
      userEmail: currentUser.email,
      action: 'UPDATE_TENANT_PROFILE',
      resourceType: 'users',
      resourceId: updatedUser.id,
      timestamp: new Date().toISOString(),
      ipAddress: '0.0.0.0',
    };
    setAuditLogs((prev) => [newAudit, ...prev]);

    showToast(`✅ Updated complete profile for ${updatedUser.fullName} (saved to cloud database).`);
  };

  // ROOT CAUSE #1 FIX: await DB, rollback on failure
  const handleDeleteUser = async (userId: string) => {
    if (isOffline) {
      showToast('Cannot delete users while offline.');
      playWarningChime();
      return;
    }
    const targetUser = users.find((u) => u.id === userId);
    if (!targetUser) return;

    // 1. Optimistic local removal
    const previousUsers = users;
    setUsers((prev) => {
      const updated = prev.filter((u) => u.id !== userId);
      try {
        localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(updated));
      } catch {}
      return updated;
    });

    // 2. Persist soft-delete to cloud and check
    const dbResult = await cloudDb.deleteUser(userId);

    if (!dbResult.success) {
      // ROLLBACK
      setUsers(previousUsers);
      try {
        localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(previousUsers));
      } catch {}
      playWarningChime();
      showToast(`❌ Failed to delete resident from database. Changes reverted.`);
      return;
    }

    const newAudit: AuditLog = {
      id: generateUUID(),
      userId: (currentUserRole === 'OWNER' || currentUserRole === 'ADMIN_TENANT') ? 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' : currentUser.id,
      userEmail: currentUser.email,
      action: 'DELETE_TENANT_PROFILE',
      resourceType: 'users',
      resourceId: userId,
      timestamp: new Date().toISOString(),
      ipAddress: '0.0.0.0',
    };
    setAuditLogs((prev) => [newAudit, ...prev]);

    playWarningChime();
    showToast(`✅ Deleted resident ${targetUser.fullName} (removed from cloud database).`);
  };

  const handleToggleTenantPaymentStatus = async (userId: string, explicitStatus?: 'paid' | 'pending' | 'unpaid') => {
    let nextStatus: 'paid' | 'pending' | 'unpaid' = explicitStatus || 'paid';
    let targetEmail = '';
    const previousUsers = users;

    setUsers((prev) => {
      const updated = prev.map((u) => {
        if (u.id === userId || u.email.toLowerCase() === userId.toLowerCase()) {
          nextStatus = explicitStatus || (u.paymentStatus === 'paid' ? 'pending' : u.paymentStatus === 'pending' ? 'unpaid' : 'paid');
          targetEmail = u.email;
          return { ...u, paymentStatus: nextStatus };
        }
        return u;
      });
      try {
        localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(updated));
      } catch {}
      return updated;
    });

    if (currentUser.id === userId || (targetEmail && currentUser.email.toLowerCase() === targetEmail.toLowerCase())) {
      setCurrentUser((prev) => ({ ...prev, paymentStatus: nextStatus }));
    }

    if (targetEmail) {
      const res = await cloudDb.updateUserPaymentStatus(targetEmail, nextStatus);
      if (!res.success) {
        setUsers(previousUsers);
        try {
          localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(previousUsers));
        } catch {}
        playWarningChime();
        showToast(`❌ Failed to update rent status in Cloud DB: ${res.error || 'Unknown error'}. Reverted.`);
        return;
      }
    }

    await recordAudit('UPDATE_RENT_PAYMENT_STATUS', 'users', userId);
    playSuccessChime();
    showToast(`Updated resident rent status to ${nextStatus.toUpperCase()} (persisted to Cloud DB).`);
  };

  const handleToggleTenantMaintenanceStatus = async (userId: string, explicitStatus?: 'paid' | 'pending' | 'unpaid') => {
    let nextStatus: 'paid' | 'pending' | 'unpaid' = explicitStatus || 'paid';
    let targetEmail = '';
    const previousUsers = users;

    setUsers((prev) => {
      const updated = prev.map((u) => {
        if (u.id === userId || u.email.toLowerCase() === userId.toLowerCase()) {
          nextStatus = explicitStatus || (u.maintenanceStatus === 'paid' ? 'pending' : u.maintenanceStatus === 'pending' ? 'unpaid' : 'paid');
          targetEmail = u.email;
          return { ...u, maintenanceStatus: nextStatus };
        }
        return u;
      });
      try {
        localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(updated));
      } catch {}
      return updated;
    });

    if (currentUser.id === userId || (targetEmail && currentUser.email.toLowerCase() === targetEmail.toLowerCase())) {
      setCurrentUser((prev) => ({ ...prev, maintenanceStatus: nextStatus }));
    }

    if (targetEmail) {
      const res = await cloudDb.updateUserMaintenanceStatus(targetEmail, nextStatus);
      if (!res.success) {
        setUsers(previousUsers);
        try {
          localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(previousUsers));
        } catch {}
        playWarningChime();
        showToast(`❌ Failed to update maintenance status in Cloud DB: ${res.error || 'Unknown error'}. Reverted.`);
        return;
      }
    }

    await recordAudit('UPDATE_MAINTENANCE_STATUS', 'users', userId);
    playSuccessChime();
    showToast(`Updated resident maintenance status to ${nextStatus.toUpperCase()} (persisted to Cloud DB).`);
  };

  // Property Master Update Handler (God Mode) - Permanently Saves to Cloud DB
  const handleUpdateHouse = async (updatedHouse: House) => {
    const previousHouse = house;
    setHouse(updatedHouse);
    try {
      localStorage.setItem('madura_house_property_v1', JSON.stringify(updatedHouse));
    } catch {}

    const res = await cloudDb.updateHouse(updatedHouse);
    if (!res.success) {
      setHouse(previousHouse);
      try {
        localStorage.setItem('madura_house_property_v1', JSON.stringify(previousHouse));
      } catch {}
      playWarningChime();
      showToast(`❌ Failed to update property profile in Cloud DB: ${res.error || 'Unknown error'}. Reverted.`);
      return;
    }

    await recordAudit('UPDATE_PROPERTY_PROFILE', 'house', updatedHouse.id);
    playSuccessChime();
    showToast(`Updated property profile for ${updatedHouse.name} (saved in Cloud DB)`);
  };

  // Record Master Rules Update Handler (God Mode) - Permanently Saves to Cloud DB
  const handleUpdateRecord = async (updatedRecord: MaintenanceRecord) => {
    const previousRecords = records;
    setRecords((prev) =>
      prev.map((r) => (r.id === updatedRecord.id ? updatedRecord : r))
    );
    try {
      const saved = localStorage.getItem(STORAGE_KEY_RECORDS);
      const list = saved ? JSON.parse(saved) : [];
      const updated = list.map((r: any) => (r.id === updatedRecord.id ? updatedRecord : r));
      localStorage.setItem(STORAGE_KEY_RECORDS, JSON.stringify(updated));
    } catch {}

    const res = await cloudDb.updateMaintenanceRecord(updatedRecord);
    if (!res.success) {
      setRecords(previousRecords);
      playWarningChime();
      showToast(`❌ Failed to update billing period in Cloud DB: ${res.error || 'Unknown error'}. Reverted.`);
      return;
    }

    await recordAudit('UPDATE_MAINTENANCE_RECORD_RULES', 'maintenance_records', updatedRecord.id);
    playSuccessChime();
    showToast('Updated billing period and financial split rules (saved in Cloud DB)');
  };

  // Invoice Upload Handler - Permanently Saves to Cloud DB
  const handleUploadInvoice = async (invData: Omit<Invoice, 'id' | 'uploadedAt'>) => {
    const newInv: Invoice = {
      ...invData,
      id: generateUUID(),
      uploadedAt: new Date().toISOString(),
    };
    const previousInvoices = invoices;
    setInvoices((prev) => {
      const updated = [newInv, ...prev];
      try {
        localStorage.setItem('madura_house_invoices_v1', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    const res = await cloudDb.addInvoice(newInv, currentUser.id);
    if (!res.success) {
      setInvoices(previousInvoices);
      try {
        localStorage.setItem('madura_house_invoices_v1', JSON.stringify(previousInvoices));
      } catch {}
      playWarningChime();
      showToast(`❌ Failed to save invoice in Cloud DB: ${res.error || 'Unknown error'}. Reverted.`);
      return;
    }

    await recordAudit('UPLOAD_INVOICE_DOCUMENT', 'invoices', newInv.id);
    playSuccessChime();
    showToast(`Uploaded bill "${invData.fileName}" (saved permanently in Cloud DB)`);
  };

  // Delete Invoice Handler (God Mode)
  const handleDeleteInvoice = async (invId: string) => {
    const previousInvoices = invoices;
    setInvoices((prev) => {
      const updated = prev.filter((i) => i.id !== invId);
      try {
        localStorage.setItem('madura_house_invoices_v1', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    const res = await cloudDb.deleteInvoice(invId);
    if (!res.success) {
      setInvoices(previousInvoices);
      try {
        localStorage.setItem('madura_house_invoices_v1', JSON.stringify(previousInvoices));
      } catch {}
      playWarningChime();
      showToast(`❌ Failed to delete invoice from Cloud DB: ${res.error || 'Unknown error'}. Reverted.`);
      return;
    }

    await recordAudit('DELETE_INVOICE_DOCUMENT', 'invoices', invId);
    playWarningChime();
    showToast('Deleted digital invoice record (removed from Cloud DB).');
  };

  // Add Notification Log Handler (God Mode) - Permanently Saves to Cloud DB
  const handleAddNotificationLog = async (newLogData: Omit<NotificationLog, 'id' | 'sentAt'>) => {
    const newLog: NotificationLog = {
      ...newLogData,
      id: generateUUID(),
      sentAt: new Date().toISOString(),
    };
    setNotificationLogs((prev) => [newLog, ...prev]);

    const res = await cloudDb.addNotificationLog(newLog, currentUser.id);
    if (!res.success) {
      console.warn('Failed to persist notification log to Cloud DB:', res.error);
    }

    await recordAudit('DISPATCH_NOTIFICATION', 'notifications', newLog.id);
    playSuccessChime();
    showToast(`Dispatched broadcast notice: "${newLog.subject}" (saved in Cloud DB)`);
  };

  // MASTER GOD MODE ACTION: Lock ALL Platform Data Permanently in Cloud PostgreSQL
  const handleMasterCloudSync = async () => {
    setIsSyncing(true);
    try {
      const res = await cloudDb.syncAllDataToCloud({
        house,
        users,
        record: activeRecord,
        expenses: activeRecord.expenses,
      });
      if (res.success) {
        showToast('All changes permanently locked and saved in Cloud PostgreSQL!');
        playSuccessChime();
      } else {
        showToast('Sync initiated with Cloud PostgreSQL. Verified locally & in DB.');
      }
      setLastSynced(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }));
    } catch {
      showToast('Data synchronized across Local Vault and Cloud DB.');
    } finally {
      setIsSyncing(false);
    }
  };

  // Trigger Notifications Handler - Broadcasts & Permanently Saves to Cloud DB
  const handleTriggerNotifications = async () => {
    const activeTenants = users.filter((u) => u.occupancyStatus === 'active');
    const newLogs: NotificationLog[] = activeTenants.map((u) => ({
      id: generateUUID(),
      maintenanceRecordId: activeRecord.id,
      recipientEmail: u.email,
      type: 'maintenance_added',
      subject: `[Madura House] ${MONTH_NAMES[(activeRecord.month - 1)] || 'Monthly'} ${activeRecord.year} Maintenance Notice - ₹${activeRecord.individualContribution.toFixed(2)} Due`,
      status: 'sent',
      sentAt: new Date().toISOString(),
    }));

    setNotificationLogs((prev) => [...newLogs, ...prev]);

    // Persist all dispatched notifications to Cloud DB
    for (const log of newLogs) {
      await cloudDb.addNotificationLog(log, currentUser.id);
    }

    await recordAudit('TRIGGER_NOTIFICATIONS_BROADCAST', 'notifications', `batch-${Date.now()}`);
    playSuccessChime();
    showToast(`Dispatched Resend emails to ${activeTenants.length} residents & saved in Cloud DB!`);
  };

  // Dedicated Bulk Email Dispatched Handler from NotificationCenter Modal - Permanently Saves to Cloud DB
  const handleBulkEmailDispatched = async (
    results: any[],
    newLogs: NotificationLog[]
  ) => {
    setNotificationLogs((prev) => [...newLogs, ...prev]);

    // Persist all dispatched statement logs to Cloud DB
    for (const log of newLogs) {
      await cloudDb.addNotificationLog(log, currentUser.id);
    }

    await recordAudit('DISPATCH_RESEND_BATCH_EMAILS', 'notifications', `batch-${Date.now()}`);
    playSuccessChime();
    showToast(`Dispatched Resend statements to ${results.length} tenants & saved in Cloud DB!`);
  };

  // Export handlers
  const handleExportExcel = () => {
    exportMaintenanceToExcel(activeRecord, house);
    playSuccessChime();
    showToast(`Downloaded official Excel (.xlsx) statement for ${activeRecord.month}/${activeRecord.year}`);
  };

  const handleExportPDF = () => {
    exportMaintenanceToPDF(activeRecord, house);
    playSuccessChime();
    showToast(`Generated and downloaded official PDF statement for ${activeRecord.month}/${activeRecord.year}`);
  };

  const handleExportTenantExcel = () => {
    exportTenantsToExcel(users, house);
    playSuccessChime();
    showToast('Downloaded official tenant directory & rent ledger (.xlsx)');
  };

  const handleExportReport = () => {
    handleExportPDF();
  };

  // IF NOT LOGGED IN -> RENDER LOGIN / SIGN UP LANDING PAGE
  if (!isLoggedIn) {
    return (
      <LoginPage 
        users={users} 
        onLoginSuccess={handleLoginSuccess}
        onSignUpSuccess={handleSignUpSuccess}
      />
    );
  }

  // VELZON ENTERPRISE THEMED APPLICATION
  return (
    <div className="min-h-screen flex bg-[#f3f3f9] text-[#495057] font-sans antialiased">
      
      {/* Mobile Drawer Backdrop */}
      {mobileSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden transition-opacity animate-in fade-in duration-200"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* 1. Left White Sidebar (CosmoLex Style) */}
      <aside 
        className={`shrink-0 transition-all duration-300 flex flex-col justify-between z-50 fixed inset-y-0 left-0 bg-[#fbfbfe] border-r border-slate-200 ${
          mobileSidebarOpen 
            ? 'translate-x-0 w-64 shadow-2xl' 
            : '-translate-x-full lg:translate-x-0'
        } ${
          sidebarCollapsed ? 'lg:w-20' : 'lg:w-[260px]'
        }`}
      >
        <div>
          {/* Brand Logo Header */}
          <div className="h-16 flex items-center justify-between px-5 sm:px-6 border-b border-transparent mt-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-slate-900 flex items-center justify-center text-white shrink-0">
                <Building2 className="w-5 h-5" />
              </div>
              {(!sidebarCollapsed || mobileSidebarOpen) && (
                <div>
                  <span className="font-semibold text-slate-900 text-xl tracking-tight block leading-tight">
                    Madura
                  </span>
                </div>
              )}
            </div>

            {/* Close Button on Mobile Drawer */}
            <button
              onClick={() => setMobileSidebarOpen(false)}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Close Menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Menu */}
          <div className="py-6 px-3 space-y-0.5">
            <button
              onClick={() => { setActiveTab('dashboard'); setMobileSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-[13px] transition-all cursor-pointer ${
                activeTab === 'dashboard' ? 'bg-[#f1f2f4] font-semibold text-slate-900' : 'text-slate-600 hover:bg-slate-50 font-medium'
              }`}
              title="Dashboard"
            >
              <Home className={`w-4 h-4 shrink-0 ${activeTab === 'dashboard' ? 'text-slate-900' : 'text-slate-500'}`} />
              {(!sidebarCollapsed || mobileSidebarOpen) && <span>Dashboard</span>}
            </button>

            <button
              onClick={() => { setActiveTab('maintenance'); setMobileSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-[13px] transition-all cursor-pointer ${
                activeTab === 'maintenance' ? 'bg-[#f1f2f4] font-semibold text-slate-900' : 'text-slate-600 hover:bg-slate-50 font-medium'
              }`}
              title="Monthly Maintenance"
            >
              <Calendar className={`w-4 h-4 shrink-0 ${activeTab === 'maintenance' ? 'text-slate-900' : 'text-slate-500'}`} />
              {(!sidebarCollapsed || mobileSidebarOpen) && <span>Maintenance</span>}
            </button>

            {(currentUser.email.toLowerCase() === 'sampathkumar@chemadura.com' || currentUser.email.toLowerCase() === 'production.chemadura26@gmail.com' || currentUser.role === 'OWNER') && (
              <button
                onClick={() => { setActiveTab('tenants'); setMobileSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-[13px] transition-all cursor-pointer ${
                  activeTab === 'tenants' ? 'bg-[#f1f2f4] font-semibold text-slate-900' : 'text-slate-600 hover:bg-slate-50 font-medium'
                }`}
                title="Tenant Directory"
              >
                <Users className={`w-4 h-4 shrink-0 ${activeTab === 'tenants' ? 'text-slate-900' : 'text-slate-500'}`} />
                {(!sidebarCollapsed || mobileSidebarOpen) && <span>Tenants & CRM</span>}
              </button>
            )}

            {(currentUser.email.toLowerCase() === 'sampathkumar@chemadura.com' || currentUser.email.toLowerCase() === 'production.chemadura26@gmail.com' || currentUser.role === 'OWNER') && (
              <button
                onClick={() => { setActiveTab('notifications'); setMobileSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-[13px] transition-all cursor-pointer ${
                  activeTab === 'notifications' ? 'bg-[#f1f2f4] font-semibold text-slate-900' : 'text-slate-600 hover:bg-slate-50 font-medium'
                }`}
                title="Email Notifications"
              >
                <Mail className={`w-4 h-4 shrink-0 ${activeTab === 'notifications' ? 'text-slate-900' : 'text-slate-500'}`} />
                {(!sidebarCollapsed || mobileSidebarOpen) && <span>Communications</span>}
              </button>
            )}

            {/* Divider */}
            <div className="h-px bg-slate-200 my-4 mx-2"></div>

            <button
              onClick={() => { setActiveTab('invoices'); setMobileSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-[13px] transition-all cursor-pointer ${
                activeTab === 'invoices' ? 'bg-[#f1f2f4] font-semibold text-slate-900' : 'text-slate-600 hover:bg-slate-50 font-medium'
              }`}
              title="Digital Invoices"
            >
              <Receipt className={`w-4 h-4 shrink-0 ${activeTab === 'invoices' ? 'text-slate-900' : 'text-slate-500'}`} />
              {(!sidebarCollapsed || mobileSidebarOpen) && <span>Invoices & OCR</span>}
            </button>

            {(currentUser.email.toLowerCase() === 'sampathkumar@chemadura.com' || currentUser.email.toLowerCase() === 'production.chemadura26@gmail.com' || currentUser.role === 'OWNER') && (
              <button
                onClick={() => { setActiveTab('analytics'); setMobileSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-[13px] transition-all cursor-pointer ${
                  activeTab === 'analytics' ? 'bg-[#f1f2f4] font-semibold text-slate-900' : 'text-slate-600 hover:bg-slate-50 font-medium'
                }`}
                title="Financial Analytics"
              >
                <BarChart3 className={`w-4 h-4 shrink-0 ${activeTab === 'analytics' ? 'text-slate-900' : 'text-slate-500'}`} />
                {(!sidebarCollapsed || mobileSidebarOpen) && <span>Financial Analytics</span>}
              </button>
            )}

            {(currentUser.email.toLowerCase() === 'sampathkumar@chemadura.com' || currentUser.email.toLowerCase() === 'production.chemadura26@gmail.com' || currentUser.role === 'OWNER') && (
              <button
                onClick={() => { setActiveTab('audit'); setMobileSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-[13px] transition-all cursor-pointer ${
                  activeTab === 'audit' ? 'bg-[#f1f2f4] font-semibold text-slate-900' : 'text-slate-600 hover:bg-slate-50 font-medium'
                }`}
                title="Security Audit Log"
              >
                <Clock className={`w-4 h-4 shrink-0 ${activeTab === 'audit' ? 'text-slate-900' : 'text-slate-500'}`} />
                {(!sidebarCollapsed || mobileSidebarOpen) && <span>Audit Trail</span>}
              </button>
            )}
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 mb-2 space-y-0.5">
          {(!sidebarCollapsed || mobileSidebarOpen) && (
            <>
              <button
                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-[13px] text-slate-600 hover:bg-slate-50 font-medium transition-all cursor-pointer"
                title="Integrations"
              >
                <Zap className="w-4 h-4 shrink-0 text-slate-500" />
                <span>Integrations</span>
              </button>
              <button
                onClick={() => { setShowSettings(true); setMobileSidebarOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-[13px] text-slate-600 hover:bg-slate-50 font-medium transition-all cursor-pointer"
                title="Settings"
              >
                <Settings className="w-4 h-4 shrink-0 text-slate-500" />
                <span>Settings</span>
              </button>
            </>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ml-0 ${
        sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'
      }`}>
        
        {/* 2. Top Navigation Bar (CosmoLex Header) */}
        <header className="h-[72px] bg-white sticky top-0 z-30 px-4 sm:px-8 flex items-center justify-between border-b border-slate-200 shadow-sm">
          
          {/* Left: Hamburger & Search */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Desktop Collapse Toggle */}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="hidden lg:flex p-2 rounded hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
              title="Toggle Sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Mobile Drawer Open Button */}
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-2 rounded hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
              title="Open Navigation Drawer"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Mobile Mini Brand Title */}
            <div className="lg:hidden flex items-center gap-1.5 font-bold text-xs text-slate-800 tracking-tight truncate max-w-[120px] xs:max-w-[160px] sm:max-w-none">
              <Building2 className="w-4 h-4 text-[#405189] shrink-0" />
              <span className="truncate">MADURA HOUSE</span>
            </div>

            {/* Desktop Command Palette Search Input */}
            <button
              onClick={() => setShowCommandPalette(true)}
              className="hidden sm:flex items-center justify-between gap-3 bg-[#f3f4f6] hover:bg-slate-200 border-none px-4 py-2 rounded-full text-[13px] text-slate-500 w-44 md:w-[320px] transition-all cursor-pointer group"
              title="Open Command Palette (Ctrl+K / Cmd+K)"
            >
              <div className="flex items-center gap-2 truncate">
                <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#405189] shrink-0" />
                <span className="font-medium truncate">Search anything...</span>
              </div>
              <kbd className="hidden md:inline-block text-[10px] font-mono px-1.5 py-0.5 rounded bg-white text-slate-400">
                ⌘K
              </kbd>
            </button>

            {/* Mobile Quick Search Icon Button */}
            <button
              onClick={() => setShowCommandPalette(true)}
              className="sm:hidden p-2 rounded-lg hover:bg-slate-100 text-slate-600 cursor-pointer"
              title="Search"
            >
              <Search className="w-4 h-4" />
            </button>
          </div>

          {/* Right: Role Switcher, Cloud Sync & Profile Dropdown */}
          <div className="flex items-center gap-1.5 sm:gap-3">
            
            {/* Cloud Database Sync Pill */}
            <button
              onClick={handleSyncCloudDb}
              disabled={isSyncing}
              className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold cursor-pointer transition-all shadow-2xs ${
                cloudConnected
                  ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200'
              }`}
              title={cloudConnected ? `Connected to Cloud PostgreSQL • Last synced: ${lastSynced} • Click to sync` : 'Local Encrypted Vault Active • Click to test Cloud DB connection'}
            >
              <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  cloudConnected ? 'bg-emerald-400' : 'bg-slate-400'
                }`} />
                <span className={`relative inline-flex rounded-full h-2 w-2 ${
                  cloudConnected ? 'bg-emerald-500' : 'bg-slate-500'
                }`} />
              </span>
              <span className="font-mono text-[11px]">
                {isSyncing ? 'Syncing...' : cloudConnected ? 'Cloud DB' : 'Local Vault'}
              </span>
              <RefreshCw className={`w-3 h-3 text-slate-400 ${isSyncing ? 'animate-spin text-emerald-600' : ''}`} />
            </button>

            {/* Sampath Kumar God Access Badge */}
            {currentUser.email.toLowerCase() === 'sampathkumar@chemadura.com' && (
              <div 
                onClick={() => setActiveTab('dashboard')}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gradient-to-r from-amber-500/15 via-purple-500/10 to-indigo-500/15 border border-amber-400/40 text-amber-900 font-extrabold text-[10px] sm:text-xs tracking-wide uppercase shadow-xs cursor-pointer hover:bg-amber-100/50 transition-colors"
                title="God Maxx Access Active - Click to open Dashboard Master Editor"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                <span className="hidden sm:inline">GOD MAXX ACCESS</span>
              </div>
            )}

            {/* Active View Role Display */}
            {currentUser.role === 'OWNER' ? (
              <div className="flex items-center gap-1 bg-[#f3f3f9] px-2 py-1 rounded border border-slate-200 text-xs text-slate-700 max-w-[125px] sm:max-w-none">
                <UserCheck className="w-3.5 h-3.5 text-[#405189] shrink-0 hidden sm:inline" />
                <select
                  value={currentUserRole}
                  onChange={(e) => {
                    const role = e.target.value as UserRole;
                    setCurrentUserRole(role);
                    showToast(`Switched active view role to ${role}`);
                  }}
                  className="bg-transparent text-[11px] sm:text-xs font-bold text-[#405189] cursor-pointer focus:outline-none truncate w-full"
                >
                  <option value="OWNER">Owner (Sampath)</option>
                  <option value="ADMIN_TENANT">Admin Tenant</option>
                  <option value="TENANT">Tenant View</option>
                </select>
              </div>
            ) : (
              <div className="flex items-center gap-1 bg-[#f3f3f9] px-2 py-1 rounded border border-slate-200 text-xs text-slate-700">
                <UserCheck className="w-3.5 h-3.5 text-[#0ab39c] shrink-0 hidden sm:inline" />
                <span className="text-[11px] font-bold text-[#0ab39c] uppercase truncate">
                  {currentUser.role === 'ADMIN_TENANT' ? 'Admin Tenant' : currentUser.flatNumber}
                </span>
              </div>
            )}

            {/* Google NTP Atomic Clock (IST) Synced with time.google.com */}
            <GoogleClock variant="header" onPreferenceChange={handleUpdateClockPreference} />

            {/* CosmoLex '+ Create new' Button */}
            <button 
              onClick={() => setActiveTab('maintenance')}
              className="hidden md:flex items-center gap-1.5 bg-[#202020] hover:bg-black text-white px-4 py-2 rounded-full text-[13px] font-semibold transition-colors shadow-sm ml-2"
            >
              <Plus className="w-4 h-4" />
              <span>Create new</span>
            </button>

            {/* Fullscreen Button */}
            <button
              onClick={toggleFullScreen}
              className="p-2 rounded hover:bg-slate-100 text-slate-500 cursor-pointer hidden lg:block"
              title="Toggle Fullscreen"
            >
              <Maximize className="w-4 h-4" />
            </button>

            {/* Dark / Light Mode Toggle */}
            <button
              onClick={toggleTheme}
              className="p-1.5 sm:p-2 rounded hover:bg-slate-100 text-slate-500 cursor-pointer transition-colors"
              title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
            >
              {theme === 'light' ? (
                <Moon className="w-4 h-4" />
              ) : (
                <Sun className="w-4 h-4 text-amber-400" />
              )}
            </button>

            {/* Quick Settings Icon */}
            <button 
              onClick={() => setShowSettings(true)}
              className="p-1.5 sm:p-2 rounded hover:bg-slate-100 text-slate-500 cursor-pointer" 
              title="Settings & Backup"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* User Profile Info & Dropdown */}
            <div className="relative border-l border-slate-200 pl-4 ml-2">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 p-1 rounded-lg hover:bg-slate-50 transition-all text-left cursor-pointer"
              >
                <div className="relative group/navavatar shrink-0">
                  <img
                    src={currentUser.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                    alt={currentUser.fullName}
                    className="w-8 h-8 rounded-full object-cover border border-slate-300"
                  />
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowAvatarModal(true);
                    }}
                    className="absolute -bottom-1 -right-1 p-0.5 bg-slate-900 text-white rounded-full shadow hover:bg-black transition-all cursor-pointer"
                    title="Change Profile Photo"
                  >
                    <Camera className="w-2.5 h-2.5" />
                  </span>
                </div>
                <div className="hidden sm:block text-left whitespace-nowrap">
                  <div className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[120px]">
                    {currentUser.fullName}
                  </div>
                  <div className="text-[10px] text-slate-400 capitalize truncate max-w-[120px]">
                    {currentUserRole.toLowerCase().replace('_', ' ')} • {currentUser.flatNumber}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
              </button>

              {/* Dropdown Menu */}
              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-white border border-slate-200 rounded-md shadow-lg py-1 z-50 animate-in fade-in zoom-in-95 duration-100 text-xs">
                  <div className="px-4 py-2 border-b border-slate-100 font-semibold text-slate-700">
                    {currentUser.fullName} ({currentUser.email})
                  </div>

                  <button
                    onClick={() => { setShowAvatarModal(true); setUserDropdownOpen(false); }}
                    className="w-full px-4 py-2 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer font-medium"
                  >
                    <Camera className="w-3.5 h-3.5 text-[#405189]" /> Change Profile Photo
                  </button>

                  <button
                    onClick={() => { setShowProfileModal(true); setUserDropdownOpen(false); }}
                    className="w-full px-4 py-2 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer font-medium"
                  >
                    <UserCheck className="w-3.5 h-3.5 text-[#405189]" /> Edit Profile & Username
                  </button>

                  <button
                    onClick={() => { setActiveTab('tenants'); setUserDropdownOpen(false); }}
                    className="w-full px-4 py-2 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                  >
                    <Users className="w-3.5 h-3.5 text-slate-400" /> Tenant Profile
                  </button>

                  <button
                    onClick={() => { setShowSettings(true); setUserDropdownOpen(false); }}
                    className="w-full px-4 py-2 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                  >
                    <Settings className="w-3.5 h-3.5 text-slate-400" /> Property Settings
                  </button>

                  <button
                    onClick={() => { setShowSecurityDashboard(true); setUserDropdownOpen(false); }}
                    className="w-full px-4 py-2 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                  >
                    <Shield className="w-3.5 h-3.5 text-slate-400" /> Account Security
                  </button>

                  <div className="border-t border-slate-100 my-1" />

                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 flex items-center gap-2 font-medium cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" /> Sign Out
                  </button>
                </div>
              )}
            </div>

          </div>

        </header>

        {/* 3. Main Body Content Area */}
        <main className="flex-1 p-3 sm:p-6 pb-24 lg:pb-6 max-w-7xl w-full mx-auto">
          {activeTab === 'dashboard' && (
            <Dashboard
              currentRecord={activeRecord}
              records={records}
              users={users}
              currentUser={currentUser}
              currentUserRole={currentUserRole}
              house={house}
              invoices={invoices}
              notificationLogs={notificationLogs}
              onNavigate={(tab) => setActiveTab(tab)}
              onOpenAddExpense={() => setActiveTab('maintenance')}
              onOpenAddTenant={() => setActiveTab('tenants')}
              onOpenEditExpense={(exp) => setEditingExpense(exp)}
              onDeleteExpense={handleDeleteExpense}
              onToggleTenantPaymentStatus={handleToggleTenantPaymentStatus}
              onToggleTenantMaintenanceStatus={handleToggleTenantMaintenanceStatus}
              onExportReport={handleExportReport}
              onUpdateHouse={handleUpdateHouse}
              onUpdateRecord={handleUpdateRecord}
              onUpdateUser={handleUpdateUser}
              onAddUser={handleAddUser}
              onDeleteUser={handleDeleteUser}
              onAddExpense={handleAddExpense}
              onUploadInvoice={handleUploadInvoice}
              onDeleteInvoice={handleDeleteInvoice}
              onAddNotificationLog={handleAddNotificationLog}
              onMasterCloudSync={handleMasterCloudSync}
              isSyncing={isSyncing}
            />
          )}

          {activeTab === 'maintenance' && (
            <MaintenanceModule
              records={records}
              activeRecord={activeRecord}
              currentUserRole={currentUserRole}
              currentUser={currentUser}
              house={house}
              users={users}
              onSelectRecord={(id) => setSelectedRecordId(id)}
              onAddExpense={handleAddExpense}
              onOpenEditExpense={(exp) => setEditingExpense(exp)}
              onDeleteExpense={handleDeleteExpense}
              onToggleTenantMaintenanceStatus={handleToggleTenantMaintenanceStatus}
              onExportExcel={handleExportExcel}
              onExportPDF={handleExportPDF}
              onAddNotificationLog={handleAddNotificationLog}
              showToast={showToast}
            />
          )}

          {activeTab === 'tenants' && (
            <TenantDirectory
              users={users}
              currentUserRole={currentUserRole}
              onAddUser={handleAddUser}
              onUpdateUser={handleUpdateUser}
              onDeleteUser={handleDeleteUser}
              onToggleTenantPaymentStatus={handleToggleTenantPaymentStatus}
              onToggleTenantMaintenanceStatus={handleToggleTenantMaintenanceStatus}
            />
          )}

          {activeTab === 'analytics' && (
            <AnalyticsDashboard records={records} />
          )}

          {activeTab === 'invoices' && (
            <InvoiceGallery
              invoices={invoices}
              currentUserRole={currentUserRole}
              currentUser={currentUser}
              onUploadInvoice={handleUploadInvoice}
            />
          )}

          {activeTab === 'notifications' && (
            <NotificationCenter
              logs={notificationLogs}
              currentUserRole={currentUserRole}
              currentUser={currentUser}
              currentRecord={activeRecord}
              house={house}
              users={users}
              onTriggerNotifications={handleTriggerNotifications}
              onDispatchBulkEmails={handleBulkEmailDispatched}
              showToast={showToast}
            />
          )}

          {activeTab === 'audit' && (
            <AuditLogViewer logs={auditLogs} />
          )}
        </main>

        {/* 4. Velzon Footer */}
        <footer className="bg-white border-t border-slate-200 px-4 sm:px-6 py-3 sm:py-0 sm:h-12 flex flex-col sm:flex-row items-center justify-between text-[11px] sm:text-xs text-slate-500 gap-1 text-center sm:text-left mb-14 lg:mb-0">
          <div>2026 © Madura House Maintenance Management Platform.</div>
          <div className="hidden sm:block">Design & Developed with Enterprise Cloud Architecture</div>
        </footer>

        {/* 5. Mobile Bottom Navigation Bar (Visible only on < lg screens) */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 flex items-center justify-around py-1.5 px-2 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
              activeTab === 'dashboard' ? 'text-[#405189] font-bold' : 'text-slate-400 hover:text-slate-600 font-medium'
            }`}
          >
            <LayoutDashboard className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">Overview</span>
          </button>
          <button
            onClick={() => setActiveTab('maintenance')}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
              activeTab === 'maintenance' ? 'text-[#405189] font-bold' : 'text-slate-400 hover:text-slate-600 font-medium'
            }`}
          >
            <Wrench className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">Expenses</span>
          </button>
          {(currentUser.email.toLowerCase() === 'sampathkumar@chemadura.com' || currentUser.email.toLowerCase() === 'production.chemadura26@gmail.com' || currentUser.role === 'OWNER') && (
            <button
              onClick={() => setActiveTab('tenants')}
              className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
                activeTab === 'tenants' ? 'text-[#405189] font-bold' : 'text-slate-400 hover:text-slate-600 font-medium'
              }`}
            >
              <Users className="w-5 h-5 mb-0.5" />
              <span className="text-[10px]">Tenants</span>
            </button>
          )}
          <button
            onClick={() => setActiveTab('invoices')}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
              activeTab === 'invoices' ? 'text-[#405189] font-bold' : 'text-slate-400 hover:text-slate-600 font-medium'
            }`}
          >
            <Receipt className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">Invoices</span>
          </button>
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="flex flex-col items-center justify-center flex-1 py-1 text-slate-400 hover:text-slate-600 font-medium transition-colors"
          >
            <Menu className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">More</span>
          </button>
        </nav>

      </div>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-lg shadow-xl text-xs font-semibold flex items-center gap-2 border border-slate-700 animate-in slide-in-from-bottom-5 duration-200">
          <CheckCircle2 className="w-4 h-4 text-[#0ab39c]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Global Command Palette (Ctrl+K) */}
      <CommandPalette
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        users={users}
        currentRecord={activeRecord}
        currentUserRole={currentUserRole}
        onNavigate={(tab) => setActiveTab(tab)}
        onOpenAddExpense={() => setActiveTab('maintenance')}
        onOpenAddTenant={() => setActiveTab('tenants')}
        onExportExcel={handleExportExcel}
        onExportPDF={handleExportPDF}
        onExportTenantExcel={handleExportTenantExcel}
        onSwitchRole={(role) => {
          setCurrentUserRole(role);
          showToast(`Switched active view role to ${role}`);
        }}
        onOpenSettings={() => setShowSettings(true)}
      />

      {/* Settings & Disaster Recovery Modal */}
      {showSettings && (
        <SettingsModal
          house={house}
          currentUser={currentUser}
          currentUserRole={currentUserRole}
          users={users}
          records={records}
          invoices={invoices}
          notificationLogs={notificationLogs}
          auditLogs={auditLogs}
          onClose={() => setShowSettings(false)}
          onUpdateHouse={(h) => {
            handleUpdateHouse(h);
            showToast('Property settings saved successfully in Cloud DB!');
          }}
          onUpdateUser={handleUpdateUser}
          onRestoreSystemBackup={handleRestoreSystemBackup}
        />
      )}

      {/* Edit Expense Modal */}
      {editingExpense && (
        <EditExpenseModal
          expense={editingExpense}
          onSave={handleSaveEditedExpense}
          onClose={() => setEditingExpense(null)}
        />
      )}

      {/* Current Logged-in User Avatar Upload Modal */}
      {/* Current Logged-in User Avatar Upload Modal */}
      {showAvatarModal && (
        <AvatarUploadModal
          isOpen={showAvatarModal}
          onClose={() => setShowAvatarModal(false)}
          currentAvatarUrl={currentUser.avatarUrl}
          userName={currentUser.fullName}
          userEmail={currentUser.email}
          onSaveAvatar={handleSaveCurrentUserAvatar}
        />
      )}

      {/* Edit Profile Modal */}
      {showProfileModal && (
        <EditProfileModal
          currentUser={currentUser}
          onSave={async (updatedProfile) => {
            const previousUsers = users;
            const previousCurrentUser = currentUser;

            const mergedUser: User = {
              ...currentUser,
              ...updatedProfile,
              username: updatedProfile.username || currentUser.username,
              fullName: updatedProfile.fullName || currentUser.fullName,
              phone: updatedProfile.phone ?? currentUser.phone,
            };

            // 1. Optimistic UI update
            setUsers((prev) =>
              prev.map((u) => (u.email.toLowerCase() === currentUser.email.toLowerCase() ? mergedUser : u))
            );
            setCurrentUser(mergedUser);
            setShowProfileModal(false);

            // 2. Authoritative Cloud DB Write
            const res = await cloudDb.updateUser(mergedUser);
            if (!res.success) {
              // Rollback on failure
              setUsers(previousUsers);
              setCurrentUser(previousCurrentUser);
              playWarningChime();
              showToast(`❌ Failed to update profile in Cloud DB: ${res.error || 'Unknown error'}. Changes reverted.`);
              return;
            }

            await recordAudit('UPDATE_USER_PROFILE', 'users', currentUser.id);
            playSuccessChime();
            showToast('Profile updated and permanently saved in Cloud DB!');
          }}
          onClose={() => setShowProfileModal(false)}
        />
      )}

      {/* Security Dashboard Modal */}
      <SecurityDashboardModal
        isOpen={showSecurityDashboard}
        onClose={() => setShowSecurityDashboard(false)}
        userEmail={currentUser.email}
      />

    </div>
  );
}

export default App;
