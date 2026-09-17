import React, { useState } from 'react';
import { MaintenanceRecord, User, UserRole, Expense, House, Invoice, NotificationLog } from '../types';
import { GodModeMasterModal, GodModeTab } from './GodModeMasterModal';
import { InvoicePreviewModal, InvoicePreviewData } from './InvoicePreviewModal';
import { InvoiceAttachmentPill } from './InvoiceAttachmentPill';
import { 
  Building2, 
  IndianRupee, 
  Users, 
  Wallet, 
  Home, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Plus, 
  Download, 
  Eye, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Tag, 
  ArrowUpRight, 
  MoreVertical,
  ExternalLink,
  ChevronRight,
  Filter,
  Check,
  Zap,
  SlidersHorizontal,
  Receipt,
  Sparkles,
  Shield,
  UploadCloud,
  Bell,
  Database,
  Terminal,
  Copy,
  RefreshCw
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Line, 
  ComposedChart,
  PieChart, 
  Pie, 
  Cell,
  Legend
} from 'recharts';

interface DashboardProps {
  currentRecord: MaintenanceRecord;
  records: MaintenanceRecord[];
  users: User[];
  currentUser: User;
  currentUserRole: UserRole;
  house: House;
  invoices: Invoice[];
  notificationLogs: NotificationLog[];
  onNavigate: (tab: string) => void;
  onOpenAddExpense: () => void;
  onOpenAddTenant: () => void;
  onOpenEditExpense?: (expense: Expense) => void;
  onDeleteExpense?: (expenseId: string) => void;
  onToggleTenantPaymentStatus?: (userId: string) => void;
  onExportReport: () => void;
  onUpdateHouse: (updatedHouse: House) => void;
  onUpdateRecord: (updatedRecord: MaintenanceRecord) => void;
  onUpdateUser: (updatedUser: User) => void;
  onAddUser: (newUser: Omit<User, 'id'>) => void;
  onDeleteUser: (userId: string) => void;
  onAddExpense: (newExpense: Omit<Expense, 'id' | 'createdAt'>) => void;
  onUploadInvoice: (invoice: Omit<Invoice, 'id' | 'uploadedAt'>) => void;
  onDeleteInvoice?: (invoiceId: string) => void;
  onAddNotificationLog?: (log: Omit<NotificationLog, 'id' | 'sentAt'>) => void;
  onMasterCloudSync?: () => Promise<void>;
  isSyncing?: boolean;
}

export const Dashboard: React.FC<DashboardProps> = ({
  currentRecord,
  records,
  users,
  currentUser,
  currentUserRole,
  house,
  invoices,
  notificationLogs,
  onNavigate,
  onOpenAddExpense,
  onOpenAddTenant,
  onOpenEditExpense,
  onDeleteExpense,
  onToggleTenantPaymentStatus,
  onExportReport,
  onUpdateHouse,
  onUpdateRecord,
  onUpdateUser,
  onAddUser,
  onDeleteUser,
  onAddExpense,
  onUploadInvoice,
  onDeleteInvoice,
  onAddNotificationLog,
  onMasterCloudSync,
  isSyncing = false,
}) => {
  const [timeFilter, setTimeFilter] = useState<'All' | '1M' | '6M' | '1Y'>('1M');
  const [selectedSort, setSelectedSort] = useState<'Today' | 'Monthly' | 'Yearly'>('Monthly');
  const [dashboardInvoicePreview, setDashboardInvoicePreview] = useState<InvoicePreviewData | null>(null);
  const [activeDashboardTab, setActiveDashboardTab] = useState<'property' | 'personal' | 'activities'>('property');

  // God Mode Master Modal State (Exclusively for Sampath Kumar / Owner)
  const isGodMode = currentUser.email.toLowerCase() === 'sampathkumar@chemadur.com' || currentUserRole === 'OWNER';
  const [showGodModal, setShowGodModal] = useState<boolean>(false);
  const [godTab, setGodTab] = useState<GodModeTab>('property');
  const [showCmdModal, setShowCmdModal] = useState<boolean>(false);
  const [copiedCmd, setCopiedCmd] = useState<boolean>(false);

  const openMasterTab = (tab: GodModeTab) => {
    setGodTab(tab);
    setShowGodModal(true);
  };

  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];
  const fullMonthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const currentMonthName = fullMonthNames[currentRecord.month - 1] || 'Current Month';

  // Dynamic calculations from real project store
  const activeTenants = users.filter((u) => u.occupancyStatus === 'active');
  const paidTenantsCount = users.filter((u) => u.paymentStatus === 'paid').length;
  const pendingTenantsCount = users.filter((u) => u.paymentStatus === 'pending').length;
  const unpaidTenantsCount = users.filter((u) => u.paymentStatus === 'unpaid').length;
  
  const totalCollections = (paidTenantsCount * currentRecord.individualContribution);
  const pendingCollections = (pendingTenantsCount + unpaidTenantsCount) * currentRecord.individualContribution;

  // Chart Data dynamically derived from real records
  const chartData = records.map((r) => ({
    name: `${monthNames[r.month - 1]} ${r.year}`,
    amount: r.grandTotal,
    line: r.individualContribution,
    expensesCount: r.expenses.length,
  })).reverse();

  // Category Breakdown for Donut Chart (Dynamically computed from active expenses)
  const categoryTotals: Record<string, number> = {};
  currentRecord.expenses.forEach((exp) => {
    categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + exp.amount;
  });

  const pieColors: Record<string, string> = {
    utilities: '#0ab39c', // Teal
    repairs: '#f7b84b',   // Yellow
    cleaning: '#405189',  // Navy
    maintenance: '#f06548', // Coral
    other: '#299cdb',    // Blue
  };

  const pieData = Object.keys(categoryTotals).map((cat) => ({
    name: cat.charAt(0).toUpperCase() + cat.slice(1),
    value: categoryTotals[cat],
    color: pieColors[cat] || '#8884d8',
  }));

  const greeting = new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 18 ? 'Good afternoon' : 'Good evening';
  const firstName = currentUser.fullName.split(' ')[0] || 'User';

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      
      {/* 1. DASHBOARD HEADER & TABS (CosmoLex Style) */}
      <div className="flex flex-col mb-4">
        <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
          {greeting}, {firstName}!
        </h1>
        
        <div className="flex items-center gap-6 mt-4 border-b border-slate-200">
          <button 
            onClick={() => setActiveDashboardTab('property')}
            className={`pb-3 text-sm transition-colors ${activeDashboardTab === 'property' ? 'font-semibold text-slate-900 border-b-2 border-slate-900' : 'font-medium text-slate-500 hover:text-slate-700 cursor-pointer'}`}>
            Property dashboard
          </button>
          <button 
            onClick={() => setActiveDashboardTab('personal')}
            className={`pb-3 text-sm transition-colors ${activeDashboardTab === 'personal' ? 'font-semibold text-slate-900 border-b-2 border-slate-900' : 'font-medium text-slate-500 hover:text-slate-700 cursor-pointer'}`}>
            Personal dashboard
          </button>
          <button 
            onClick={() => setActiveDashboardTab('activities')}
            className={`pb-3 text-sm transition-colors ${activeDashboardTab === 'activities' ? 'font-semibold text-slate-900 border-b-2 border-slate-900' : 'font-medium text-slate-500 hover:text-slate-700 cursor-pointer'}`}>
            Recent activities
          </button>
        </div>
      </div>

      {/* GOD MAXX BANNER (Moved below tabs, styled minimally) */}
      {isGodMode && (
        <div className="bg-slate-900 rounded-xl p-3 text-white flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-medium">God Maxx Access Active — Master Editor</span>
          </div>
          <button
            onClick={() => openMasterTab('property')}
            className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold transition-colors"
          >
            Open Master Editor
          </button>
        </div>
      )}

      {/* ======================= TABS CONTENT ======================= */}
      {activeDashboardTab === 'property' && (
        <>
          {/* 2. TOP KPI CARDS (CosmoLex Style) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* KPI 1: Total Expenses */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between h-[104px]">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-medium text-slate-600">
              Total expenses
            </span>
            <RefreshCw className="w-4 h-4 text-slate-400" />
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-bold text-slate-900 tracking-tight">
              ₹{currentRecord.grandTotal.toLocaleString('en-IN')}
            </span>
            <span className="flex items-center text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
              <ArrowUpRight className="w-3 h-3" /> 2.4%
            </span>
          </div>
        </div>

        {/* KPI 2: Total Collected */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between h-[104px]">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-medium text-slate-600">
              Total collected
            </span>
            <Shield className="w-4 h-4 text-slate-400" />
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-bold text-slate-900 tracking-tight">
              ₹{totalCollections.toLocaleString('en-IN')}
            </span>
            <span className="flex items-center text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
              <ArrowUpRight className="w-3 h-3" /> 8.1%
            </span>
          </div>
        </div>

        {/* KPI 3: Pending Dues */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between h-[104px]">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-medium text-slate-600">
              Unpaid balance
            </span>
            <AlertCircle className="w-4 h-4 text-slate-400" />
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-bold text-slate-900 tracking-tight">
              ₹{pendingCollections.toLocaleString('en-IN')}
            </span>
            <span className="flex items-center text-[10px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded">
              <ArrowUpRight className="w-3 h-3" /> 7.5%
            </span>
          </div>
        </div>

        {/* KPI 4: Individual Share */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between h-[104px]">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-medium text-slate-600">
              Per flat share
            </span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-bold text-slate-900 tracking-tight">
              ₹{currentRecord.individualContribution.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 3. MIDDLE SECTION (CosmoLex Style: Money Finder & Billing Summary)        */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        {/* Left: Money Finder (Pending Dues Table) */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col h-[320px]">
          <div className="flex items-center justify-between pb-4">
            <h2 className="text-base font-semibold text-slate-900 tracking-tight">
              Money finder
            </h2>
            <button 
              onClick={() => onNavigate('tenants')}
              className="text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors bg-slate-100 hover:bg-slate-200 px-3 py-1 rounded"
            >
              View all
            </button>
          </div>
          
          <div className="overflow-y-auto flex-1 pr-1">
            <table className="w-full text-left text-sm">
              <thead className="text-slate-400 font-normal border-b border-slate-100 sticky top-0 bg-white">
                <tr>
                  <th className="pb-2 font-medium">Tenant</th>
                  <th className="pb-2 font-medium">Aging</th>
                  <th className="pb-2 font-medium">Category</th>
                  <th className="pb-2 font-medium text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {users.filter(u => u.paymentStatus !== 'paid').slice(0, 5).map(u => (
                  <tr key={u.id}>
                    <td className="py-3 truncate font-medium text-slate-800">{u.fullName}</td>
                    <td className="py-3 text-rose-600 font-medium">{u.paymentStatus === 'unpaid' ? '> 30 days' : '15 days'}</td>
                    <td className="py-3">Maintenance</td>
                    <td className="py-3 text-right font-medium">₹{currentRecord.individualContribution.toLocaleString('en-IN')}</td>
                  </tr>
                ))}
                {users.filter(u => u.paymentStatus !== 'paid').length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-slate-400">All dues are cleared.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Billing Summary (Bar Chart) */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col h-[320px]">
          <div className="flex items-center justify-between pb-2">
            <h2 className="text-base font-semibold text-slate-900 tracking-tight">
              Billing summary
            </h2>
            <div className="flex items-center gap-4 text-xs font-medium">
              <div className="flex items-center gap-1.5 text-slate-600">
                <span className="w-2.5 h-2.5 rounded bg-[#1e3a5f]" /> Billed amount
              </div>
              <div className="flex items-center gap-1.5 text-slate-600">
                <span className="w-2.5 h-2.5 rounded bg-[#94a3b8]" /> Unpaid amount
              </div>
            </div>
          </div>

          <div className="flex-1 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }} barGap={0}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(val) => `₹${val/1000}k`} />
                <Tooltip
                  cursor={{fill: 'transparent'}}
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '4px', fontSize: '12px', boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)' }}
                />
                <Bar dataKey="amount" name="Billed" fill="#1e3a5f" radius={[2, 2, 0, 0]} barSize={12} />
                <Bar dataKey="line" name="Unpaid (Est)" fill="#94a3b8" radius={[2, 2, 0, 0]} barSize={12} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 4. LOWER SECTION (CosmoLex Style: Staff Activity & Top Clients)           */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        {/* Left: Staff Activity (Recent Expenses) */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col h-[320px]">
          <div className="flex items-center justify-between pb-4">
            <h2 className="text-base font-semibold text-slate-900 tracking-tight">
              Recent activity
            </h2>
            <select className="text-sm font-semibold text-slate-600 bg-transparent border-none outline-none cursor-pointer">
              <option>This month</option>
              <option>Last month</option>
              <option>This year</option>
            </select>
          </div>

          <div className="overflow-y-auto flex-1 pr-1">
            <table className="w-full text-left text-sm">
              <thead className="text-slate-400 font-normal border-b border-slate-100 sticky top-0 bg-white">
                <tr>
                  <th className="pb-2 font-medium">Spender</th>
                  <th className="pb-2 font-medium">Category</th>
                  <th className="pb-2 font-medium">Particulars</th>
                  <th className="pb-2 font-medium text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {currentRecord.expenses.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-slate-400">No recent activity.</td>
                  </tr>
                ) : (
                  currentRecord.expenses.slice(0, 5).map((exp) => (
                    <tr key={exp.id}>
                      <td className="py-3 font-medium text-slate-800">{exp.addedBy.split(' ')[0]}</td>
                      <td className="py-3 text-slate-600 capitalize">{exp.category}</td>
                      <td className="py-3 text-slate-600 truncate max-w-[120px]">{exp.particular}</td>
                      <td className="py-3 text-right font-medium text-slate-900">₹{exp.amount.toLocaleString('en-IN')}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Top 5 Clients (Expense Donut) */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col h-[320px]">
          <div className="flex items-center justify-between pb-2">
            <h2 className="text-base font-semibold text-slate-900 tracking-tight">
              Top 5 categories
            </h2>
            <button className="text-slate-400 hover:text-slate-600 cursor-pointer">
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 flex items-center justify-between">
            {pieData.length === 0 ? (
              <div className="w-full flex justify-center text-sm text-slate-400">No data available.</div>
            ) : (
              <>
                <div className="w-1/2 h-full py-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={2}
                        dataKey="value"
                        stroke="none"
                      >
                        {pieData.map((entry, index) => {
                          const cosmoColors = ['#f87171', '#fb923c', '#fbbf24', '#a3e635', '#2dd4bf'];
                          return <Cell key={`cell-${index}`} fill={cosmoColors[index % cosmoColors.length]} />;
                        })}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: '4px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="w-1/2 pl-4 flex flex-col justify-center space-y-3">
                  {pieData.map((d, i) => {
                    const cosmoColors = ['#f87171', '#fb923c', '#fbbf24', '#a3e635', '#2dd4bf'];
                    return (
                      <div key={d.name} className="flex flex-col">
                        <div className="flex items-center gap-2 text-sm text-slate-700">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cosmoColors[i % cosmoColors.length] }} />
                          <span className="font-medium truncate">{d.name}</span>
                        </div>
                        <div className="pl-4 text-xs font-semibold text-slate-500">
                          ₹{d.value.toLocaleString('en-IN')}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>

      </div>
        </>
      )}

      {activeDashboardTab === 'personal' && (
        <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm flex flex-col items-center justify-center min-h-[400px]">
          <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-slate-100 shadow-sm mb-4">
            <img src={currentUser.avatarUrl || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80'} alt="Avatar" className="w-full h-full object-cover" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">{currentUser.fullName}</h2>
          <span className="px-3 py-1 bg-sky-50 text-sky-700 text-xs font-bold rounded-full uppercase mt-2">
            {currentUser.flatNumber}
          </span>
          <div className="grid grid-cols-2 gap-8 mt-8 w-full max-w-md">
            <div className="flex flex-col items-center">
              <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">Monthly Rent</span>
              <span className="text-xl font-bold text-slate-900">₹{currentUser.rentAmount?.toLocaleString('en-IN') || '0'}</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">Status</span>
              <span className="text-xl font-bold text-emerald-600 uppercase">{currentUser.paymentStatus || 'PAID'}</span>
            </div>
          </div>
        </div>
      )}

      {activeDashboardTab === 'activities' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm min-h-[400px]">
          <h2 className="text-lg font-bold text-slate-900 mb-6">Recent Platform Activities</h2>
          {notificationLogs.length > 0 ? (
            <div className="space-y-4">
              {notificationLogs.slice(0, 10).map((log, i) => (
                <div key={i} className="flex items-start gap-4 p-4 rounded-xl border border-slate-100 bg-slate-50/50">
                  <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center shrink-0">
                    <Bell className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 text-sm">{log.subject}</h4>
                    <p className="text-slate-600 text-xs mt-1 capitalize">
                      {log.type.replace(/_/g, ' ')} • To: {log.recipientEmail}
                    </p>
                    <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider mt-2 block">
                      {new Date(log.sentAt).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-slate-500">
              <AlertCircle className="w-12 h-12 text-slate-300 mb-3" />
              <p className="text-sm font-medium">No recent activities found.</p>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. UNIVERSAL GOD MODE MASTER MODAL                                        */}
      {/* ========================================================================= */}
      {showGodModal && (
        <GodModeMasterModal
          isOpen={showGodModal}
          onClose={() => setShowGodModal(false)}
          initialTab={godTab}
          house={house}
          onUpdateHouse={onUpdateHouse}
          currentRecord={currentRecord}
          onUpdateRecord={onUpdateRecord}
          users={users}
          onUpdateUser={onUpdateUser}
          onAddUser={onAddUser}
          onDeleteUser={onDeleteUser}
          onAddExpense={onAddExpense}
          onUpdateExpense={onOpenEditExpense ? (exp) => onOpenEditExpense(exp) : () => {}}
          onDeleteExpense={onDeleteExpense || (() => {})}
          invoices={invoices}
          onUploadInvoice={onUploadInvoice}
          onDeleteInvoice={onDeleteInvoice}
          notificationLogs={notificationLogs}
          onAddNotificationLog={onAddNotificationLog}
        />
      )}

      {/* ========================================================================= */}
      {/* 7. CMD TERMINAL & PERMANENT DB LOADER MODAL                               */}
      {/* ========================================================================= */}
      {showCmdModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-indigo-500/40 rounded-2xl max-w-xl w-full text-white shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-4 border-b border-indigo-500/30 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center justify-center">
                  <Terminal className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                    CMD Terminal DB Loader & Permanent Sync
                  </h3>
                  <p className="text-xs text-indigo-300">
                    CLI commands to permanently seed & load all admin changes into Cloud PostgreSQL
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCmdModal(false)}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4 text-xs">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Command Line (Run in CMD or PowerShell):
                </span>
                <div className="mt-1.5 p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-emerald-400 flex items-center justify-between gap-3">
                  <span className="select-all overflow-x-auto whitespace-nowrap">npm run db:sync</span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText('npm run db:sync');
                      setCopiedCmd(true);
                      setTimeout(() => setCopiedCmd(false), 2500);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-indigo-600/50 hover:bg-indigo-600 text-white font-sans text-xs flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                  >
                    {copiedCmd ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedCmd ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-indigo-950/40 border border-indigo-500/20 text-indigo-200/90 space-y-2">
                <div className="flex items-center gap-2 text-indigo-300 font-bold">
                  <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>How Permanent Sync Works:</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-slate-300 text-[11px]">
                  <li>All changes made in <strong>Building Info, Billing Rules, Residents, and Expenses</strong> are instantly recorded in local vault.</li>
                  <li>Every mutation triggers live background synchronization to <strong>Supabase Cloud PostgreSQL</strong>.</li>
                  <li>Running <code className="text-emerald-400 font-mono">npm run db:sync</code> in CMD seeds and permanently verifies all records directly.</li>
                  <li>If PostgreSQL RLS policies restrict writes, run <code className="text-sky-300 font-mono">database/make_permanent.sql</code> once in the Supabase SQL editor.</li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-wrap items-center justify-end gap-2 border-t border-slate-800">
                {onMasterCloudSync && (
                  <button
                    type="button"
                    onClick={async () => {
                      await onMasterCloudSync();
                    }}
                    disabled={isSyncing}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
                  >
                    <Database className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                    {isSyncing ? 'Writing to DB...' : 'Sync All Data to DB Now'}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowCmdModal(false)}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Universal Invoice Preview Modal */}
      <InvoicePreviewModal
        invoice={dashboardInvoicePreview}
        onClose={() => setDashboardInvoicePreview(null)}
      />
    </div>
  );
};
