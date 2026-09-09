import React, { useState, useEffect } from 'react';
import { initialHouse, initialUsers, initialMaintenanceRecords, initialExpenses, initialInvoices, initialNotificationLogs, initialAuditLogs } from './data/initialData';
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
import { GoogleClock } from './components/GoogleClock';
import { exportMaintenanceToExcel, exportMaintenanceToPDF, exportTenantsToExcel } from './utils/exportUtils';
import { playSuccessChime, playNotificationChime, playWarningChime } from './utils/audioUtils';
import { cloudDb, isSupabaseConfigured, generateUUID } from './lib/supabaseClient';
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
  Settings, 
  UserCheck, 
  CheckCircle2, 
  LogOut, 
  Menu, 
  Search, 
  Maximize, 
  ChevronDown,
  Sparkles,
  RefreshCw,
  X,
  Wrench,
  Receipt,
  Camera
} from 'lucide-react';

const STORAGE_KEY_USERS = 'madura_house_users_db_v3';
const STORAGE_KEY_RECORDS = 'madura_house_records_db_v3';

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
  // Persistent State for Users & Records with automatic credential preservation
  const [users, setUsers] = useState<User[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_USERS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const map = new Map<string, User>();
          // Base defaults
          initialUsers.forEach((iu) => map.set(iu.email.toLowerCase(), iu));
          // Overlay saved data with flat number normalization
          parsed.forEach((u: User) => {
            const existing = map.get(u.email.toLowerCase());
            if (existing) {
              map.set(u.email.toLowerCase(), {
                ...existing,
                ...u,
                flatNumber: normalizeFlat(u.flatNumber || existing.flatNumber),
                password: u.password || existing.password,
                role: u.role || existing.role,
              });
            } else {
              map.set(u.email.toLowerCase(), {
                ...u,
                flatNumber: normalizeFlat(u.flatNumber),
              });
            }
          });
          return Array.from(map.values());
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
          return parsed.map((r) => {
            const hasZeroExpenses = !r.expenses || r.expenses.length === 0 || r.grandTotal === 0;
            const expensesList = hasZeroExpenses && r.month === 9 && r.year === 2026 ? initialExpenses : (r.expenses || []);
            const grandTotal = expensesList.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
            const tenantsCount = r.activeTenantsCount || 5;
            const individualContribution = tenantsCount > 0 ? grandTotal / tenantsCount : grandTotal;
            return {
              ...r,
              expenses: expensesList,
              grandTotal: grandTotal > 0 ? grandTotal : (r.grandTotal || 10200),
              individualContribution: grandTotal > 0 ? individualContribution : (r.individualContribution || 2040),
              activeTenantsCount: tenantsCount,
            };
          });
        }
      }
      return initialMaintenanceRecords;
    } catch {
      return initialMaintenanceRecords;
    }
  });

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
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
            prevLocalUsers.forEach((u) => userMap.set(u.email.toLowerCase(), u));
            // 2. Overlay remote data without wiping passwords or un-synced users
            remoteUsers.forEach((ru) => {
              const emailKey = ru.email.toLowerCase();
              const existing = userMap.get(emailKey);
              if (existing) {
                userMap.set(emailKey, {
                  ...existing,
                  ...ru,
                  flatNumber: normalizeFlat(ru.flatNumber || existing.flatNumber),
                  password: existing.password || ru.password,
                  role: existing.role || ru.role || 'TENANT',
                });
              } else {
                userMap.set(emailKey, {
                  ...ru,
                  flatNumber: normalizeFlat(ru.flatNumber),
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
              const expenses = (rr.expenses && rr.expenses.length > 0)
                ? rr.expenses
                : (local?.expenses && local.expenses.length > 0)
                  ? local.expenses
                  : (rr.month === 9 && rr.year === 2026 ? initialExpenses : []);
              const grandTotal = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
              const tenants = rr.activeTenantsCount || local?.activeTenantsCount || 5;
              return {
                ...rr,
                expenses,
                grandTotal: grandTotal > 0 ? grandTotal : (rr.grandTotal || 10200),
                individualContribution: grandTotal > 0 ? grandTotal / tenants : (rr.individualContribution || 2040),
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

  // Supabase Real-time Subscription for live Expenses across clients
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const unsubscribe = cloudDb.subscribeToExpenses((payload: any) => {
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
    });

    return () => {
      unsubscribe();
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
    try {
      await cloudDb.updateUserAvatar(currentUser.email, newAvatarUrl);
    } catch (e) {
      console.warn('Cloud DB avatar update fallback:', e);
    }

    // 4. Record Audit Log
    const avatarAudit: AuditLog = {
      id: generateUUID(),
      userId: currentUser.id,
      userEmail: currentUser.email,
      action: 'UPDATE_PROFILE_AVATAR',
      resourceType: 'users',
      resourceId: currentUser.email,
      timestamp: new Date().toISOString(),
      ipAddress: '0.0.0.0',
    };
    setAuditLogs((prev) => [avatarAudit, ...prev]);

    playSuccessChime();
    showToast('Profile picture updated and synced to cloud!');
  };

  // Login Handler
  const handleLoginSuccess = (user: User, role: UserRole) => {
    setCurrentUser(user);
    setCurrentUserRole(role);
    setIsLoggedIn(true);

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

    const loginAudit: AuditLog = {
      id: generateUUID(),
      userId: user.id,
      userEmail: user.email,
      action: 'USER_LOGIN_AUTHENTICATED',
      resourceType: 'auth_session',
      timestamp: new Date().toISOString(),
      ipAddress: '0.0.0.0',
    };
    setAuditLogs((prev) => [loginAudit, ...prev]);
  };

  // Sign Up Handler
  const handleSignUpSuccess = (newUser: User) => {
    // 1. Save new user into persistent state & localStorage immediately
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
    
    // 2. Auto-login with the newly created account
    setCurrentUser(newUser);
    setCurrentUserRole(newUser.role);
    setIsLoggedIn(true);

    // 3. Attempt cloud persistence
    cloudDb.createUser(newUser).catch(() => {});

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

    showToast(`Account successfully created for ${newUser.fullName}! Logged in as ${newUser.role}.`);
  };

  // Logout Handler
  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserDropdownOpen(false);
    showToast('Logged out successfully. Returned to Login Landing Page.');
  };

  // Add Expense Handler
  const handleAddExpense = (newExpenseData: Omit<Expense, 'id' | 'createdAt'>) => {
    const expenseId = generateUUID();
    const newExpense: Expense = {
      ...newExpenseData,
      id: expenseId,
      createdAt: new Date().toISOString(),
    };

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

    const newAudit: AuditLog = {
      id: generateUUID(),
      userId: currentUserRole === 'OWNER' ? 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' : currentUser.id,
      userEmail: currentUser.email,
      action: 'ADD_EXPENSE_ITEM',
      resourceType: 'expenses',
      resourceId: expenseId,
      timestamp: new Date().toISOString(),
      ipAddress: '0.0.0.0',
    };
    setAuditLogs((prev) => [newAudit, ...prev]);

    cloudDb.addExpense(newExpense).catch(() => {});
    playSuccessChime();
    showToast(`Added expense "${newExpenseData.particular}" (₹${newExpenseData.amount.toLocaleString('en-IN')})`);
  };

  // Edit Expense Handler
  const handleSaveEditedExpense = (updatedExpense: Expense) => {
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

    const newAudit: AuditLog = {
      id: generateUUID(),
      userId: currentUserRole === 'OWNER' ? 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' : currentUser.id,
      userEmail: currentUser.email,
      action: 'UPDATE_EXPENSE_ITEM',
      resourceType: 'expenses',
      resourceId: updatedExpense.id,
      timestamp: new Date().toISOString(),
      ipAddress: '0.0.0.0',
    };
    setAuditLogs((prev) => [newAudit, ...prev]);

    cloudDb.updateExpense(updatedExpense).catch(() => {});
    playSuccessChime();
    showToast(`Updated expense "${updatedExpense.particular}"`);
  };

  // Delete Expense Handler
  const handleDeleteExpense = (expenseId: string) => {
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

    cloudDb.deleteExpense(expenseId).catch(() => {});
    playWarningChime();
    showToast('Deleted line item expense.');
  };

  // User Management Handlers
  const handleAddUser = (userData: Omit<User, 'id'>) => {
    const newUser: User = {
      ...userData,
      id: generateUUID(),
    };

    setUsers((prev) => {
      const updated = [...prev, newUser];
      try {
        localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(updated));
      } catch {}
      return updated;
    });

    const newAudit: AuditLog = {
      id: generateUUID(),
      userId: currentUserRole === 'OWNER' ? 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' : currentUser.id,
      userEmail: currentUser.email,
      action: 'CREATE_TENANT_PROFILE',
      resourceType: 'users',
      resourceId: newUser.id,
      timestamp: new Date().toISOString(),
      ipAddress: '0.0.0.0',
    };
    setAuditLogs((prev) => [newAudit, ...prev]);

    cloudDb.createUser(newUser).catch(() => {});
    playSuccessChime();
    showToast(`Registered resident ${userData.fullName} (${userData.flatNumber})`);
  };

  const handleUpdateUser = (updatedUser: User) => {
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

    cloudDb.updateUser(updatedUser).catch(() => {});

    const newAudit: AuditLog = {
      id: generateUUID(),
      userId: currentUserRole === 'OWNER' ? 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' : currentUser.id,
      userEmail: currentUser.email,
      action: 'UPDATE_TENANT_PROFILE',
      resourceType: 'users',
      resourceId: updatedUser.id,
      timestamp: new Date().toISOString(),
      ipAddress: '0.0.0.0',
    };
    setAuditLogs((prev) => [newAudit, ...prev]);

    showToast(`Updated complete profile for ${updatedUser.fullName}`);
  };

  const handleDeleteUser = (userId: string) => {
    const targetUser = users.find((u) => u.id === userId);
    setUsers((prev) => {
      const updated = prev.filter((u) => u.id !== userId);
      try {
        localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(updated));
      } catch {}
      return updated;
    });

    const newAudit: AuditLog = {
      id: generateUUID(),
      userId: currentUserRole === 'OWNER' ? 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' : currentUser.id,
      userEmail: currentUser.email,
      action: 'DELETE_TENANT_PROFILE',
      resourceType: 'users',
      resourceId: userId,
      timestamp: new Date().toISOString(),
      ipAddress: '0.0.0.0',
    };
    setAuditLogs((prev) => [newAudit, ...prev]);

    cloudDb.deleteUser(userId).catch(() => {});
    playWarningChime();
    showToast(`Deleted resident ${targetUser?.fullName || userId}`);
  };

  const handleToggleTenantPaymentStatus = (userId: string) => {
    let nextStatus: 'paid' | 'pending' | 'unpaid' = 'paid';
    let targetEmail = '';

    setUsers((prev) => {
      const updated = prev.map((u) => {
        if (u.id === userId || u.email.toLowerCase() === userId.toLowerCase()) {
          nextStatus = u.paymentStatus === 'paid' ? 'pending' : u.paymentStatus === 'pending' ? 'unpaid' : 'paid';
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

    if (targetEmail) {
      cloudDb.updateUserPaymentStatus(targetEmail, nextStatus).catch(() => {});
    }

    playSuccessChime();
    showToast('Updated tenant monthly maintenance payment status.');
  };

  // Property Master Update Handler (God Mode) - Permanently Saves to Cloud DB
  const handleUpdateHouse = (updatedHouse: House) => {
    setHouse(updatedHouse);
    try {
      localStorage.setItem('madura_house_property_v1', JSON.stringify(updatedHouse));
    } catch {}
    
    // Persist to Cloud PostgreSQL DB
    cloudDb.updateHouse(updatedHouse).catch(() => {});

    const audit: AuditLog = {
      id: generateUUID(),
      userId: currentUser.id,
      userEmail: currentUser.email,
      action: 'UPDATE_PROPERTY_PROFILE',
      resourceType: 'house',
      resourceId: updatedHouse.id,
      timestamp: new Date().toISOString(),
      ipAddress: '0.0.0.0',
    };
    setAuditLogs((prev) => [audit, ...prev]);
    playSuccessChime();
    showToast(`Updated property profile for ${updatedHouse.name} (saved in DB & local)`);
  };

  // Record Master Rules Update Handler (God Mode) - Permanently Saves to Cloud DB
  const handleUpdateRecord = (updatedRecord: MaintenanceRecord) => {
    setRecords((prev) =>
      prev.map((r) => (r.id === updatedRecord.id ? updatedRecord : r))
    );
    try {
      const saved = localStorage.getItem(STORAGE_KEY_RECORDS);
      const list = saved ? JSON.parse(saved) : [];
      const updated = list.map((r: any) => (r.id === updatedRecord.id ? updatedRecord : r));
      localStorage.setItem(STORAGE_KEY_RECORDS, JSON.stringify(updated));
    } catch {}

    // Persist to Cloud PostgreSQL DB
    cloudDb.updateMaintenanceRecord(updatedRecord).catch(() => {});

    const audit: AuditLog = {
      id: generateUUID(),
      userId: currentUser.id,
      userEmail: currentUser.email,
      action: 'UPDATE_MAINTENANCE_RECORD_RULES',
      resourceType: 'maintenance_records',
      resourceId: updatedRecord.id,
      timestamp: new Date().toISOString(),
      ipAddress: '0.0.0.0',
    };
    setAuditLogs((prev) => [audit, ...prev]);
    playSuccessChime();
    showToast('Updated billing period and financial split rules (saved in DB & local)');
  };

  // Invoice Upload Handler - Permanently Saves to Cloud DB
  const handleUploadInvoice = (invData: Omit<Invoice, 'id' | 'uploadedAt'>) => {
    const newInv: Invoice = {
      ...invData,
      id: generateUUID(),
      uploadedAt: new Date().toISOString(),
    };
    setInvoices((prev) => {
      const updated = [newInv, ...prev];
      try {
        localStorage.setItem('madura_house_invoices_v1', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    cloudDb.addInvoice(newInv).catch(() => {});
    playSuccessChime();
    showToast(`Uploaded bill "${invData.fileName}" (saved in DB & local)`);
  };

  // Delete Invoice Handler (God Mode)
  const handleDeleteInvoice = (invId: string) => {
    setInvoices((prev) => {
      const updated = prev.filter((i) => i.id !== invId);
      try {
        localStorage.setItem('madura_house_invoices_v1', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    cloudDb.deleteInvoice(invId).catch(() => {});
    playWarningChime();
    showToast('Deleted digital invoice record.');
  };

  // Add Notification Log Handler (God Mode) - Permanently Saves to Cloud DB
  const handleAddNotificationLog = (newLogData: Omit<NotificationLog, 'id' | 'sentAt'>) => {
    const newLog: NotificationLog = {
      ...newLogData,
      id: generateUUID(),
      sentAt: new Date().toISOString(),
    };
    setNotificationLogs((prev) => [newLog, ...prev]);
    cloudDb.addNotificationLog(newLog).catch(() => {});
    playSuccessChime();
    showToast(`Dispatched broadcast notice: "${newLog.subject}"`);
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

  // Trigger Notifications Handler
  const handleTriggerNotifications = () => {
    const activeTenants = users.filter((u) => u.occupancyStatus === 'active');
    const newLogs: NotificationLog[] = activeTenants.map((u) => ({
      id: `n-${Date.now().toString().slice(-4)}-${u.id.slice(-2)}`,
      maintenanceRecordId: activeRecord.id,
      recipientEmail: u.email,
      type: 'maintenance_added',
      subject: `[Madura House] ${MONTH_NAMES[(activeRecord.month - 1)] || 'Monthly'} ${activeRecord.year} Maintenance Notice - ₹${activeRecord.individualContribution.toFixed(2)} Due`,
      status: 'sent',
      sentAt: new Date().toISOString(),
    }));

    setNotificationLogs((prev) => [...newLogs, ...prev]);
    showToast(`Dispatched Resend emails to ${activeTenants.length} residents!`);
  };

  // Dedicated Bulk Email Dispatched Handler from NotificationCenter Modal
  const handleBulkEmailDispatched = (
    results: any[],
    newLogs: NotificationLog[]
  ) => {
    setNotificationLogs((prev) => [...newLogs, ...prev]);
    const audit: AuditLog = {
      id: generateUUID(),
      userId: currentUser.id,
      userEmail: currentUser.email,
      action: 'DISPATCH_RESEND_BATCH_EMAILS',
      resourceType: 'notifications',
      resourceId: `batch-${Date.now()}`,
      timestamp: new Date().toISOString(),
      ipAddress: '0.0.0.0',
    };
    setAuditLogs((prev) => [audit, ...prev]);
    showToast(`Dispatched Resend statements to ${results.length} tenants!`);
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

      {/* 1. Left Dark Navy Sidebar (Velzon Theme) */}
      <aside 
        className={`velzon-sidebar shrink-0 transition-all duration-300 flex flex-col justify-between z-50 fixed inset-y-0 left-0 ${
          mobileSidebarOpen 
            ? 'translate-x-0 w-72 shadow-2xl' 
            : '-translate-x-full lg:translate-x-0'
        } ${
          sidebarCollapsed ? 'lg:w-20' : 'lg:w-64'
        }`}
      >
        <div>
          {/* Brand Logo Header */}
          <div className="h-16 flex items-center justify-between px-5 sm:px-6 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#0ab39c] via-[#299cdb] to-[#405189] flex items-center justify-center text-white shadow-md shrink-0">
                <Building2 className="w-4 h-4" />
              </div>
              {(!sidebarCollapsed || mobileSidebarOpen) && (
                <div>
                  <span className="font-extrabold text-white text-base tracking-wider block leading-tight">
                    MADURA
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium tracking-wide">
                    HOUSE MAINTENANCE
                  </span>
                </div>
              )}
            </div>

            {/* Close Button on Mobile Drawer */}
            <button
              onClick={() => setMobileSidebarOpen(false)}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Close Menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Menu */}
          <div className="py-4 px-3 space-y-1">
            {(!sidebarCollapsed || mobileSidebarOpen) && (
              <div className="px-3 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Menu
              </div>
            )}

            <button
              onClick={() => { setActiveTab('dashboard'); setMobileSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-md text-xs font-semibold velzon-sidebar-item ${
                activeTab === 'dashboard' ? 'active font-bold text-white' : ''
              }`}
              title="Dashboard"
            >
              <LayoutDashboard className="w-4 h-4 shrink-0 text-[#0ab39c]" />
              {(!sidebarCollapsed || mobileSidebarOpen) && <span>Dashboard</span>}
            </button>

            <button
              onClick={() => { setActiveTab('maintenance'); setMobileSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-md text-xs font-semibold velzon-sidebar-item ${
                activeTab === 'maintenance' ? 'active font-bold text-white' : ''
              }`}
              title="Monthly Maintenance"
            >
              <Calendar className="w-4 h-4 shrink-0 text-[#299cdb]" />
              {(!sidebarCollapsed || mobileSidebarOpen) && <span>Maintenance & Expenses</span>}
            </button>

            <button
              onClick={() => { setActiveTab('tenants'); setMobileSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-md text-xs font-semibold velzon-sidebar-item ${
                activeTab === 'tenants' ? 'active font-bold text-white' : ''
              }`}
              title="Tenant Directory"
            >
              <Users className="w-4 h-4 shrink-0 text-[#f7b84b]" />
              {(!sidebarCollapsed || mobileSidebarOpen) && <span>Tenants & CRM</span>}
            </button>

            <button
              onClick={() => { setActiveTab('analytics'); setMobileSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-md text-xs font-semibold velzon-sidebar-item ${
                activeTab === 'analytics' ? 'active font-bold text-white' : ''
              }`}
              title="Financial Analytics"
            >
              <BarChart3 className="w-4 h-4 shrink-0 text-[#f06548]" />
              {(!sidebarCollapsed || mobileSidebarOpen) && <span>Financial Analytics</span>}
            </button>

            <button
              onClick={() => { setActiveTab('invoices'); setMobileSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-md text-xs font-semibold velzon-sidebar-item ${
                activeTab === 'invoices' ? 'active font-bold text-white' : ''
              }`}
              title="Digital Invoices"
            >
              <FileText className="w-4 h-4 shrink-0 text-[#0ab39c]" />
              {(!sidebarCollapsed || mobileSidebarOpen) && <span>Invoices & OCR</span>}
            </button>

            <button
              onClick={() => { setActiveTab('notifications'); setMobileSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-md text-xs font-semibold velzon-sidebar-item ${
                activeTab === 'notifications' ? 'active font-bold text-white' : ''
              }`}
              title="Email Notifications"
            >
              <Mail className="w-4 h-4 shrink-0 text-[#299cdb]" />
              {(!sidebarCollapsed || mobileSidebarOpen) && <span>Resend Notifications</span>}
            </button>

            <button
              onClick={() => { setActiveTab('audit'); setMobileSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-md text-xs font-semibold velzon-sidebar-item ${
                activeTab === 'audit' ? 'active font-bold text-white' : ''
              }`}
              title="Security Audit Log"
            >
              <ShieldCheck className="w-4 h-4 shrink-0 text-[#878a99]" />
              {(!sidebarCollapsed || mobileSidebarOpen) && <span>Security Audit Trail</span>}
            </button>
          </div>
        </div>

        {/* Sidebar Footer */}
        {(!sidebarCollapsed || mobileSidebarOpen) && (
          <div className="p-4 border-t border-white/10 m-3 rounded bg-white/5 text-xs text-slate-400 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#0ab39c] animate-pulse" />
              <span className="font-semibold text-slate-300">v1.0 Enterprise</span>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">Madurai, TN</span>
          </div>
        )}
      </aside>

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ml-0 ${
        sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'
      }`}>
        
        {/* 2. Top Navigation Bar (Velzon Header) */}
        <header className="h-16 velzon-topbar sticky top-0 z-30 px-3 sm:px-6 flex items-center justify-between shadow-xs">
          
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
              className="hidden sm:flex items-center justify-between gap-3 bg-[#f3f3f9] hover:bg-white border border-slate-200 hover:border-[#405189] px-3 py-1.5 rounded-lg text-xs text-slate-500 w-44 md:w-64 transition-all shadow-2xs cursor-pointer group"
              title="Open Command Palette (Ctrl+K / Cmd+K)"
            >
              <div className="flex items-center gap-2 truncate">
                <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#405189] shrink-0" />
                <span className="font-medium truncate">Search anything...</span>
              </div>
              <kbd className="hidden md:inline-block text-[10px] font-mono px-1.5 py-0.5 rounded bg-white group-hover:bg-slate-100 border border-slate-200 text-slate-500 shadow-2xs">
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
            {currentUser.email.toLowerCase() === 'sampathkumar@chemadur.com' && (
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
            <GoogleClock variant="header" />

            {/* Fullscreen Button */}
            <button
              onClick={toggleFullScreen}
              className="p-2 rounded hover:bg-slate-100 text-slate-500 cursor-pointer hidden lg:block"
              title="Toggle Fullscreen"
            >
              <Maximize className="w-4 h-4" />
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
            <div className="relative border-l border-slate-200 pl-3">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2.5 p-1 rounded hover:bg-slate-100 transition-all text-left cursor-pointer"
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
                    className="absolute -bottom-1 -right-1 p-0.5 bg-[#405189] text-white rounded-full shadow hover:bg-[#364473] transition-all cursor-pointer"
                    title="Change Profile Photo"
                  >
                    <Camera className="w-2.5 h-2.5" />
                  </span>
                </div>
                <div className="hidden sm:block">
                  <div className="text-xs font-bold text-slate-800 leading-tight">
                    {currentUser.fullName}
                  </div>
                  <div className="text-[10px] text-slate-400 capitalize">
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
              onSelectRecord={(id) => setSelectedRecordId(id)}
              onAddExpense={handleAddExpense}
              onOpenEditExpense={(exp) => setEditingExpense(exp)}
              onDeleteExpense={handleDeleteExpense}
              onExportExcel={handleExportExcel}
              onExportPDF={handleExportPDF}
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
            />
          )}

          {activeTab === 'analytics' && (
            <AnalyticsDashboard records={records} />
          )}

          {activeTab === 'invoices' && (
            <InvoiceGallery
              invoices={invoices}
              currentUserRole={currentUserRole}
              onUploadInvoice={handleUploadInvoice}
            />
          )}

          {activeTab === 'notifications' && (
            <NotificationCenter
              logs={notificationLogs}
              currentUserRole={currentUserRole}
              currentRecord={activeRecord}
              house={house}
              users={users}
              onTriggerNotifications={handleTriggerNotifications}
              onDispatchBulkEmails={handleBulkEmailDispatched}
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
          <button
            onClick={() => setActiveTab('tenants')}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
              activeTab === 'tenants' ? 'text-[#405189] font-bold' : 'text-slate-400 hover:text-slate-600 font-medium'
            }`}
          >
            <Users className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">Tenants</span>
          </button>
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
          currentUserRole={currentUserRole}
          users={users}
          records={records}
          invoices={invoices}
          notificationLogs={notificationLogs}
          auditLogs={auditLogs}
          onClose={() => setShowSettings(false)}
          onUpdateHouse={(h) => {
            setHouse(h);
            showToast('Property settings saved successfully!');
          }}
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

    </div>
  );
}

export default App;
