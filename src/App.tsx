import React, { useState, useEffect } from 'react';
import { initialHouse, initialUsers, initialMaintenanceRecords, initialInvoices, initialNotificationLogs, initialAuditLogs } from './data/initialData';
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
  Bell, 
  ShoppingBag, 
  Maximize, 
  Moon, 
  Grid,
  ChevronDown,
  Sparkles,
  Home,
  Plus
} from 'lucide-react';

const STORAGE_KEY_USERS = 'madura_house_users_db_v3';
const STORAGE_KEY_RECORDS = 'madura_house_records_db_v3';

export function App() {
  // Persistent State for Users & Records
  const [users, setUsers] = useState<User[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_USERS);
      return saved ? JSON.parse(saved) : initialUsers;
    } catch {
      return initialUsers;
    }
  });

  const [records, setRecords] = useState<MaintenanceRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_RECORDS);
      return saved ? JSON.parse(saved) : initialMaintenanceRecords;
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
  const [userDropdownOpen, setUserDropdownOpen] = useState<boolean>(false);

  const [house] = useState(initialHouse);
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
  const [notificationLogs, setNotificationLogs] = useState<NotificationLog[]>(initialNotificationLogs);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(initialAuditLogs);
  
  const [selectedRecordId, setSelectedRecordId] = useState<string>(initialMaintenanceRecords[0].id);
  const [showSettings, setShowSettings] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const activeRecord = records.find((r) => r.id === selectedRecordId) || records[0];

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
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
      id: `al-${Date.now().toString().slice(-4)}`,
      userId: user.id,
      userEmail: user.email,
      action: 'USER_LOGIN_AUTHENTICATED',
      resourceType: 'auth_session',
      timestamp: new Date().toISOString(),
      ipAddress: '122.178.45.10',
    };
    setAuditLogs((prev) => [loginAudit, ...prev]);
  };

  // Sign Up Handler
  const handleSignUpSuccess = (newUser: User) => {
    // Save new user into persistent state
    setUsers((prev) => [...prev, newUser]);
    
    // Auto-login with the newly created account
    setCurrentUser(newUser);
    setCurrentUserRole(newUser.role);
    setIsLoggedIn(true);

    // Audit Log
    const signupAudit: AuditLog = {
      id: `al-${Date.now().toString().slice(-4)}`,
      userId: newUser.id,
      userEmail: newUser.email,
      action: 'NEW_RESIDENT_PORTAL_SIGNUP',
      resourceType: 'users',
      resourceId: newUser.id,
      timestamp: new Date().toISOString(),
      ipAddress: '122.178.45.10',
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
    const expenseId = `e-${Date.now().toString().slice(-4)}`;
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
          const newContribution = newGrandTotal / (r.activeTenantsCount || 6);

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
      id: `al-${Date.now().toString().slice(-4)}`,
      userId: currentUserRole === 'OWNER' ? 'u-owner-01' : 'u-admin-tenant-01',
      userEmail: currentUser.email,
      action: 'ADD_EXPENSE_ITEM',
      resourceType: 'expenses',
      resourceId: expenseId,
      timestamp: new Date().toISOString(),
      ipAddress: '122.178.45.10',
    };
    setAuditLogs((prev) => [newAudit, ...prev]);

    showToast(`Added expense "${newExpenseData.particular}" (₹${newExpenseData.amount.toLocaleString('en-IN')})`);
  };

  // Edit Expense Handler
  const handleSaveEditedExpense = (updatedExpense: Expense) => {
    setRecords((prev) =>
      prev.map((r) => {
        if (r.id === activeRecord.id) {
          const updatedExpenses = r.expenses.map((e) => (e.id === updatedExpense.id ? updatedExpense : e));
          const newGrandTotal = updatedExpenses.reduce((sum, e) => sum + e.amount, 0);
          const newContribution = newGrandTotal / (r.activeTenantsCount || 6);

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
      id: `al-${Date.now().toString().slice(-4)}`,
      userId: currentUserRole === 'OWNER' ? 'u-owner-01' : 'u-admin-tenant-01',
      userEmail: currentUser.email,
      action: 'UPDATE_EXPENSE_ITEM',
      resourceType: 'expenses',
      resourceId: updatedExpense.id,
      timestamp: new Date().toISOString(),
      ipAddress: '122.178.45.10',
    };
    setAuditLogs((prev) => [newAudit, ...prev]);

    showToast(`Updated expense "${updatedExpense.particular}" (₹${updatedExpense.amount.toLocaleString('en-IN')})`);
  };

  // Delete Expense Handler
  const handleDeleteExpense = (expenseId: string) => {
    setRecords((prev) =>
      prev.map((r) => {
        if (r.id === activeRecord.id) {
          const updatedExpenses = r.expenses.filter((e) => e.id !== expenseId);
          const newGrandTotal = updatedExpenses.reduce((sum, e) => sum + e.amount, 0);
          const newContribution = newGrandTotal / (r.activeTenantsCount || 6);

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

    showToast('Deleted line item expense.');
  };

  // User Management Handlers
  const handleAddUser = (userData: Omit<User, 'id'>) => {
    const newUser: User = {
      ...userData,
      id: `u-${Date.now().toString().slice(-4)}`,
    };

    setUsers((prev) => [...prev, newUser]);

    const newAudit: AuditLog = {
      id: `al-${Date.now().toString().slice(-4)}`,
      userId: 'u-owner-01',
      userEmail: currentUser.email,
      action: 'CREATE_TENANT_PROFILE',
      resourceType: 'users',
      resourceId: newUser.id,
      timestamp: new Date().toISOString(),
      ipAddress: '122.178.45.10',
    };
    setAuditLogs((prev) => [newAudit, ...prev]);

    showToast(`Registered resident ${userData.fullName} (${userData.flatNumber})`);
  };

  const handleUpdateUser = (updatedUser: User) => {
    setUsers((prev) => prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)));

    const newAudit: AuditLog = {
      id: `al-${Date.now().toString().slice(-4)}`,
      userId: 'u-owner-01',
      userEmail: currentUser.email,
      action: 'UPDATE_TENANT_PROFILE',
      resourceType: 'users',
      resourceId: updatedUser.id,
      timestamp: new Date().toISOString(),
      ipAddress: '122.178.45.10',
    };
    setAuditLogs((prev) => [newAudit, ...prev]);

    showToast(`Updated complete profile for ${updatedUser.fullName}`);
  };

  const handleDeleteUser = (userId: string) => {
    const targetUser = users.find((u) => u.id === userId);
    setUsers((prev) => prev.filter((u) => u.id !== userId));

    const newAudit: AuditLog = {
      id: `al-${Date.now().toString().slice(-4)}`,
      userId: 'u-owner-01',
      userEmail: currentUser.email,
      action: 'DELETE_TENANT_PROFILE',
      resourceType: 'users',
      resourceId: userId,
      timestamp: new Date().toISOString(),
      ipAddress: '122.178.45.10',
    };
    setAuditLogs((prev) => [newAudit, ...prev]);

    showToast(`Removed user ${targetUser?.fullName || userId}`);
  };

  const handleToggleTenantPaymentStatus = (userId: string) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          const nextStatus = u.paymentStatus === 'paid' ? 'pending' : u.paymentStatus === 'pending' ? 'unpaid' : 'paid';
          return { ...u, paymentStatus: nextStatus };
        }
        return u;
      })
    );
    showToast('Updated tenant monthly maintenance payment status.');
  };

  // Invoice Upload Handler
  const handleUploadInvoice = (invData: Omit<Invoice, 'id' | 'uploadedAt'>) => {
    const newInv: Invoice = {
      ...invData,
      id: `inv-${Date.now().toString().slice(-4)}`,
      uploadedAt: new Date().toISOString(),
    };
    setInvoices((prev) => [newInv, ...prev]);
    showToast(`Uploaded bill "${invData.fileName}"`);
  };

  // Trigger Notifications Handler
  const handleTriggerNotifications = () => {
    const activeTenants = users.filter((u) => u.occupancyStatus === 'active');
    const newLogs: NotificationLog[] = activeTenants.map((u) => ({
      id: `n-${Date.now().toString().slice(-4)}-${u.id.slice(-2)}`,
      maintenanceRecordId: activeRecord.id,
      recipientEmail: u.email,
      type: 'maintenance_added',
      subject: `[Madura House] September 2026 Maintenance Notice - ₹${activeRecord.individualContribution.toFixed(2)} Due`,
      status: 'sent',
      sentAt: new Date().toISOString(),
    }));

    setNotificationLogs((prev) => [...newLogs, ...prev]);
    showToast(`Dispatched Resend emails to ${activeTenants.length} residents!`);
  };

  // Export handlers
  const handleExportReport = () => {
    showToast('Generated official maintenance statement PDF & Excel ledger.');
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
      
      {/* 1. Left Dark Navy Sidebar (Velzon Theme) */}
      <aside 
        className={`${
          sidebarCollapsed ? 'w-20' : 'w-64'
        } velzon-sidebar shrink-0 transition-all duration-300 flex flex-col justify-between z-30 fixed inset-y-0 left-0`}
      >
        <div>
          {/* Brand Logo Header */}
          <div className="h-16 flex items-center px-6 gap-3 border-b border-white/10">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#0ab39c] via-[#299cdb] to-[#405189] flex items-center justify-center text-white shadow-md">
              <Building2 className="w-4 h-4" />
            </div>
            {!sidebarCollapsed && (
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

          {/* Navigation Menu */}
          <div className="py-4 px-3 space-y-1">
            {!sidebarCollapsed && (
              <div className="px-3 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Menu
              </div>
            )}

            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-md text-xs font-semibold velzon-sidebar-item ${
                activeTab === 'dashboard' ? 'active font-bold text-white' : ''
              }`}
              title="Dashboard"
            >
              <LayoutDashboard className="w-4 h-4 shrink-0 text-[#0ab39c]" />
              {!sidebarCollapsed && <span>Dashboard</span>}
            </button>

            <button
              onClick={() => setActiveTab('maintenance')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-md text-xs font-semibold velzon-sidebar-item ${
                activeTab === 'maintenance' ? 'active font-bold text-white' : ''
              }`}
              title="Monthly Maintenance"
            >
              <Calendar className="w-4 h-4 shrink-0 text-[#299cdb]" />
              {!sidebarCollapsed && <span>Maintenance & Expenses</span>}
            </button>

            <button
              onClick={() => setActiveTab('tenants')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-md text-xs font-semibold velzon-sidebar-item ${
                activeTab === 'tenants' ? 'active font-bold text-white' : ''
              }`}
              title="Tenant Directory"
            >
              <Users className="w-4 h-4 shrink-0 text-[#f7b84b]" />
              {!sidebarCollapsed && <span>Tenants & CRM</span>}
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-md text-xs font-semibold velzon-sidebar-item ${
                activeTab === 'analytics' ? 'active font-bold text-white' : ''
              }`}
              title="Financial Analytics"
            >
              <BarChart3 className="w-4 h-4 shrink-0 text-[#f06548]" />
              {!sidebarCollapsed && <span>Financial Analytics</span>}
            </button>

            <button
              onClick={() => setActiveTab('invoices')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-md text-xs font-semibold velzon-sidebar-item ${
                activeTab === 'invoices' ? 'active font-bold text-white' : ''
              }`}
              title="Digital Invoices"
            >
              <FileText className="w-4 h-4 shrink-0 text-[#0ab39c]" />
              {!sidebarCollapsed && <span>Invoices & OCR</span>}
            </button>

            <button
              onClick={() => setActiveTab('notifications')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-md text-xs font-semibold velzon-sidebar-item ${
                activeTab === 'notifications' ? 'active font-bold text-white' : ''
              }`}
              title="Email Notifications"
            >
              <Mail className="w-4 h-4 shrink-0 text-[#299cdb]" />
              {!sidebarCollapsed && <span>Resend Notifications</span>}
            </button>

            <button
              onClick={() => setActiveTab('audit')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-md text-xs font-semibold velzon-sidebar-item ${
                activeTab === 'audit' ? 'active font-bold text-white' : ''
              }`}
              title="Security Audit Log"
            >
              <ShieldCheck className="w-4 h-4 shrink-0 text-[#878a99]" />
              {!sidebarCollapsed && <span>Security Audit Trail</span>}
            </button>
          </div>
        </div>

        {/* Sidebar Footer */}
        {!sidebarCollapsed && (
          <div className="p-4 border-t border-white/10 m-3 rounded bg-white/5 text-xs text-slate-400 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#0ab39c] animate-pulse" />
              <span className="font-semibold text-slate-300">v1.0 Enterprise</span>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">Madurai, TN</span>
          </div>
        )}
      </aside>

      {/* Main Wrapper */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarCollapsed ? 'ml-20' : 'ml-64'}`}>
        
        {/* 2. Top White Navigation Bar (Velzon Header) */}
        <header className="h-16 velzon-topbar sticky top-0 z-20 px-6 flex items-center justify-between shadow-xs">
          
          {/* Left: Toggle + Search */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-1.5 rounded hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
              title="Toggle Sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="relative hidden sm:block">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search..."
                className="bg-[#f3f3f9] border border-transparent hover:border-slate-300 focus:border-[#405189] focus:bg-white pl-9 pr-4 py-1.5 rounded text-xs text-slate-700 w-60 transition-all focus:outline-none"
              />
            </div>
          </div>

          {/* Right: Role Switcher & Profile Dropdown */}
          <div className="flex items-center gap-3">
            
            {/* Active View Role Display */}
            {currentUser.role === 'OWNER' ? (
              <div className="hidden lg:flex items-center gap-1.5 bg-[#f3f3f9] px-2.5 py-1 rounded border border-slate-200 text-xs text-slate-700">
                <UserCheck className="w-3.5 h-3.5 text-[#405189]" />
                <span className="text-slate-400 text-[11px]">Role:</span>
                <select
                  value={currentUserRole}
                  onChange={(e) => {
                    const role = e.target.value as UserRole;
                    setCurrentUserRole(role);
                    showToast(`Switched active view role to ${role}`);
                  }}
                  className="bg-transparent text-xs font-bold text-[#405189] cursor-pointer focus:outline-none"
                >
                  <option value="OWNER">House Owner (Sampath Kumar)</option>
                  <option value="ADMIN_TENANT">Admin Tenant (Rajesh Kumar)</option>
                  <option value="TENANT">Regular Tenant View</option>
                </select>
              </div>
            ) : (
              <div className="hidden lg:flex items-center gap-1.5 bg-[#f3f3f9] px-2.5 py-1 rounded border border-slate-200 text-xs text-slate-700">
                <UserCheck className="w-3.5 h-3.5 text-[#0ab39c]" />
                <span className="text-slate-400 text-[11px]">Role:</span>
                <span className="text-xs font-bold text-[#0ab39c] uppercase">
                  {currentUser.role === 'ADMIN_TENANT' ? 'Admin Tenant' : `Resident (${currentUser.flatNumber})`}
                </span>
              </div>
            )}

            {/* Quick Icon Set */}
            <button className="p-2 rounded hover:bg-slate-100 text-slate-500 relative cursor-pointer" title="Expenses count">
              <ShoppingBag className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-4 h-4 bg-[#299cdb] text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {activeRecord.expenses.length}
              </span>
            </button>

            <button 
              onClick={() => setActiveTab('notifications')}
              className="p-2 rounded hover:bg-slate-100 text-slate-500 relative cursor-pointer" 
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-4 h-4 bg-[#f06548] text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                3
              </span>
            </button>

            <button 
              onClick={() => setShowSettings(true)}
              className="p-2 rounded hover:bg-slate-100 text-slate-500 cursor-pointer" 
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* User Profile Info & Dropdown */}
            <div className="relative border-l border-slate-200 pl-3">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2.5 p-1 rounded hover:bg-slate-100 transition-all text-left cursor-pointer"
              >
                <img
                  src={currentUser.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                  alt={currentUser.fullName}
                  className="w-8 h-8 rounded-full object-cover border border-slate-300"
                />
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
                <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-md shadow-lg py-1 z-50 animate-in fade-in zoom-in-95 duration-100 text-xs">
                  <div className="px-4 py-2 border-b border-slate-100 font-semibold text-slate-700">
                    {currentUser.fullName} ({currentUser.email})
                  </div>

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
        <main className="flex-1 p-6 max-w-7xl w-full mx-auto">
          {activeTab === 'dashboard' && (
            <Dashboard
              currentRecord={activeRecord}
              records={records}
              users={users}
              currentUser={currentUser}
              currentUserRole={currentUserRole}
              onNavigate={(tab) => setActiveTab(tab)}
              onOpenAddExpense={() => setActiveTab('maintenance')}
              onOpenAddTenant={() => setActiveTab('tenants')}
              onOpenEditExpense={(exp) => setEditingExpense(exp)}
              onDeleteExpense={handleDeleteExpense}
              onToggleTenantPaymentStatus={handleToggleTenantPaymentStatus}
              onExportReport={handleExportReport}
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
              onExportExcel={() => showToast('Exported Excel report.')}
              onExportPDF={() => showToast('Generated PDF report.')}
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
              onTriggerNotifications={handleTriggerNotifications}
            />
          )}

          {activeTab === 'audit' && (
            <AuditLogViewer logs={auditLogs} />
          )}
        </main>

        {/* 4. Velzon Footer */}
        <footer className="h-12 bg-white border-t border-slate-200 px-6 flex items-center justify-between text-xs text-slate-500">
          <div>2026 © Madura House Maintenance Management Platform.</div>
          <div>Design & Developed with Enterprise Cloud Architecture</div>
        </footer>

      </div>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded shadow-xl text-xs font-semibold flex items-center gap-2 border border-slate-700 animate-in slide-in-from-bottom-5 duration-200">
          <CheckCircle2 className="w-4 h-4 text-[#0ab39c]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <SettingsModal
          house={house}
          currentUserRole={currentUserRole}
          onClose={() => setShowSettings(false)}
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

    </div>
  );
}

export default App;
