import React, { useState } from 'react';
import { MaintenanceRecord, User, UserRole, Expense, House, Invoice, NotificationLog } from '../types';
import { GodModeMasterModal, GodModeTab } from './GodModeMasterModal';
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
  Copy
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

  const totalCatSum = pieData.reduce((acc, curr) => acc + curr.value, 0);

  return (
    <div className="space-y-5">
      
      {/* ========================================================================= */}
      {/* 0. GOD MAXX MASTER DASHBOARD BANNER (FOR SAMPATH KUMAR)                   */}
      {/* ========================================================================= */}
      {isGodMode && (
        <div className="bg-gradient-to-r from-slate-900 via-[#1e1b4b] to-[#312e81] rounded-2xl p-4 sm:p-5 text-white shadow-xl border border-indigo-500/30 flex flex-col lg:flex-row lg:items-center justify-between gap-4 animate-in fade-in duration-200">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-amber-500/30 shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-[10px] uppercase tracking-wider shadow-xs">
                  GOD MAXX ROOT ACCESS
                </span>
                <span className="text-xs font-bold text-indigo-200">
                  Sampath Kumar (Owner Suite)
                </span>
                <span className="text-[11px] text-emerald-400 font-mono hidden sm:inline">
                  • All Fields Fully Editable
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-extrabold text-white tracking-tight mt-0.5">
                Central Master Controller & Universal Editor
              </h2>
              <p className="text-xs text-indigo-200/80 mt-0.5">
                Full authority to edit building details, ledger rules, tenant credentials, expenses, and digital bills.
              </p>
            </div>
          </div>

          {/* Quick Action Buttons on God Mode Banner */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => openMasterTab('property')}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              title="Edit Property Name, Address & Total Units"
            >
              <Building2 className="w-3.5 h-3.5 text-amber-300" /> Building Info
            </button>

            <button
              type="button"
              onClick={() => openMasterTab('ledger')}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              title="Edit Month, Grand Total & Per-Flat Share Formula"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-sky-300" /> Billing Rules
            </button>

            <button
              type="button"
              onClick={() => openMasterTab('residents')}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              title="Edit Any Resident Credentials & Profile"
            >
              <Users className="w-3.5 h-3.5 text-emerald-300" /> Residents
            </button>

            <button
              type="button"
              onClick={() => openMasterTab('invoices')}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              title="Upload Digital Bill / Contractor Receipt"
            >
              <Receipt className="w-3.5 h-3.5 text-purple-300" /> Upload Bill
            </button>

            {onMasterCloudSync && (
              <button
                type="button"
                onClick={onMasterCloudSync}
                disabled={isSyncing}
                className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                title="Lock & Make All Changes Permanent in Cloud PostgreSQL DB"
              >
                <Database className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-amber-300' : 'text-emerald-400'}`} />
                {isSyncing ? 'Saving to DB...' : 'Permanent DB Sync'}
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowCmdModal(true)}
              className="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-sky-200 border border-sky-500/30 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              title="CMD Terminal Commands & Sync Script"
            >
              <Terminal className="w-3.5 h-3.5 text-sky-400" /> CMD Loader
            </button>

            <button
              type="button"
              onClick={() => openMasterTab('property')}
              className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4" /> Open Master Editor
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. PROPERTY & BUILDING OVERVIEW CARD                                      */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 shadow-xs shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                {house.name}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-bold uppercase tracking-wider">
                {house.totalUnits} Standard Units
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {house.address}, {house.city} - {house.postalCode} • <span className="text-indigo-900 font-bold">Property Developer & Primary Owner: Sampath Kumar</span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isGodMode && (
            <button
              type="button"
              onClick={() => openMasterTab('property')}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-200"
              title="Edit Building Name, Address & Postal Code"
            >
              <Edit3 className="w-3.5 h-3.5 text-indigo-700" /> Edit Building Details
            </button>
          )}

          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700">
            <span>01 {currentMonthName.slice(0, 3)}, {currentRecord.year} to 30 {currentMonthName.slice(0, 3)}, {currentRecord.year}</span>
            <div className="w-5 h-5 bg-[#405189] text-white rounded flex items-center justify-center">
              <Calendar className="w-3 h-3" />
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. VELZON 4 STAT METRIC CARDS WITH MASTER EDIT ACCESS                    */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metric 1: Total Maintenance Cost */}
        <div className="velzon-card p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                TOTAL EXPENSES
              </span>
              <span className="text-xs font-semibold text-[#0ab39c] flex items-center">
                <ArrowUpRight className="w-3.5 h-3.5" /> Live
              </span>
            </div>
            <div className="text-2xl font-bold text-slate-800 mt-2">
              ₹{currentRecord.grandTotal.toLocaleString('en-IN')}
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
            {isGodMode ? (
              <button
                onClick={() => openMasterTab('ledger')}
                className="text-xs text-indigo-700 hover:underline font-bold cursor-pointer flex items-center gap-1"
              >
                <Edit3 className="w-3 h-3" /> Edit Ledger Rules
              </button>
            ) : (
              <button
                onClick={() => onNavigate('maintenance')}
                className="text-xs text-slate-500 hover:text-[#405189] underline underline-offset-2 cursor-pointer"
              >
                View {currentRecord.expenses.length} expense items
              </button>
            )}
            <div className="w-9 h-9 rounded bg-[#0ab39c]/10 text-[#0ab39c] flex items-center justify-center font-bold">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Metric 2: Paid Tenants Collection */}
        <div className="velzon-card p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                COLLECTIONS (PAID)
              </span>
              <span className="text-xs font-semibold text-[#0ab39c]">
                {paidTenantsCount} of {activeTenants.length} Paid
              </span>
            </div>
            <div className="text-2xl font-bold text-slate-800 mt-2">
              ₹{totalCollections.toLocaleString('en-IN')}
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
            {isGodMode ? (
              <button
                onClick={() => openMasterTab('residents')}
                className="text-xs text-indigo-700 hover:underline font-bold cursor-pointer flex items-center gap-1"
              >
                <Edit3 className="w-3 h-3" /> Edit Residents
              </button>
            ) : (
              <span className="text-xs text-slate-500">
                {((paidTenantsCount / (activeTenants.length || 1)) * 100).toFixed(0)}% Collected
              </span>
            )}
            <div className="w-9 h-9 rounded bg-[#405189]/10 text-[#405189] flex items-center justify-center font-bold">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Metric 3: Outstanding Maintenance */}
        <div className="velzon-card p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                OUTSTANDING DUES
              </span>
              <span className="text-xs font-semibold text-[#f06548] flex items-center">
                <AlertCircle className="w-3.5 h-3.5" /> Pending
              </span>
            </div>
            <div className="text-2xl font-bold text-slate-800 mt-2">
              ₹{pendingCollections.toLocaleString('en-IN')}
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={() => onNavigate('notifications')}
              className="text-xs text-slate-500 hover:text-[#405189] underline underline-offset-2 cursor-pointer"
            >
              {pendingTenantsCount + unpaidTenantsCount} Units Pending
            </button>
            <div className="w-9 h-9 rounded bg-[#f06548]/10 text-[#f06548] flex items-center justify-center font-bold">
              <Clock className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Metric 4: Individual Unit Contribution */}
        <div className="velzon-card p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                PER FLAT SHARE
              </span>
              <span className="text-xs font-semibold text-slate-700">
                {currentRecord.activeTenantsCount || 5} Flats
              </span>
            </div>
            <div className="text-2xl font-bold text-slate-800 mt-2">
              ₹{currentRecord.individualContribution.toFixed(2)}
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
            {isGodMode ? (
              <button
                onClick={() => openMasterTab('ledger')}
                className="text-xs text-indigo-700 hover:underline font-bold cursor-pointer flex items-center gap-1"
              >
                <Edit3 className="w-3 h-3" /> Adjust Share
              </button>
            ) : (
              <span className="text-xs text-slate-500">Equal Division</span>
            )}
            <div className="w-9 h-9 rounded bg-[#299cdb]/10 text-[#299cdb] flex items-center justify-center font-bold">
              <Users className="w-4 h-4" />
            </div>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 3. MIDDLE CHARTS SECTION                                                  */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left (8 cols): Maintenance Trend Overview */}
        <div className="lg:col-span-8 velzon-card p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
            <div>
              <h2 className="text-sm font-bold text-slate-800">
                Maintenance Cost Trends & History
              </h2>
              <span className="text-xs text-slate-400">Monthly Expenses & Split Performance</span>
            </div>

            <div className="flex items-center gap-1 text-xs">
              {(['1M', '6M', '1Y', 'All'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setTimeFilter(filter)}
                  className={`px-2.5 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                    timeFilter === filter
                      ? 'bg-[#405189] text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          {/* Chart */}
          <div className="h-72 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', fontSize: '12px' }}
                  formatter={(value: any, name: any) => [
                    `₹${Number(value).toLocaleString('en-IN')}`,
                    name === 'amount' ? 'Total Expenses' : 'Per Tenant Share'
                  ]}
                />
                <Bar dataKey="amount" fill="#405189" radius={[4, 4, 0, 0]} barSize={28} />
                <Line type="monotone" dataKey="line" stroke="#0ab39c" strokeWidth={3} dot={{ r: 4, fill: '#0ab39c' }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right (4 cols): Occupancy & Payment Progress */}
        <div className="lg:col-span-4 velzon-card p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-800">
                Occupancy & Collections
              </h2>
              <span className="text-xs text-[#0ab39c] font-semibold">100% Occupied</span>
            </div>

            <div className="space-y-4 mt-4">
              {users.map((u) => {
                const isPaid = u.paymentStatus === 'paid';
                const isPending = u.paymentStatus === 'pending';
                const percent = isPaid ? 100 : isPending ? 50 : 0;

                return (
                  <div key={u.id}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-semibold text-slate-700">{u.fullName} ({u.flatNumber})</span>
                      <span className={`text-[11px] font-bold ${
                        isPaid ? 'text-[#0ab39c]' : isPending ? 'text-[#f7b84b]' : 'text-[#f06548]'
                      }`}>
                        {isPaid ? 'Paid (100%)' : isPending ? 'Pending (50%)' : 'Unpaid (0%)'}
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          isPaid ? 'bg-[#0ab39c]' : isPending ? 'bg-[#f7b84b]' : 'bg-[#f06548]'
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Property: <strong className="text-slate-800">{house.name}</strong></span>
            <span className="font-semibold text-[#405189]">{users.length} Active Records</span>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 4. LOWER SECTION: LINE ITEMS & RESIDENT MATRIX                            */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left (6 cols): Maintenance Line Items */}
        <div className="lg:col-span-6 velzon-card p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-800">
              Maintenance Expense Line Items
            </h2>

            <div className="flex items-center gap-2">
              {isGodMode && (
                <button
                  type="button"
                  onClick={() => openMasterTab('expenses')}
                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg flex items-center gap-1 shadow-xs cursor-pointer"
                >
                  <Plus className="w-3 h-3" /> Add Expense
                </button>
              )}

              <div className="flex items-center gap-1 text-xs text-slate-500">
                <select
                  value={selectedSort}
                  onChange={(e) => setSelectedSort(e.target.value as any)}
                  className="bg-transparent font-semibold text-slate-800 cursor-pointer focus:outline-none"
                >
                  <option value="Today">Today</option>
                  <option value="Monthly">Monthly</option>
                  <option value="Yearly">Yearly</option>
                </select>
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="overflow-x-auto mt-2">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                <tr>
                  <th className="py-2.5 px-3">Particulars</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3 text-right">Amount</th>
                  {(currentUserRole === 'OWNER' || currentUserRole === 'ADMIN_TENANT' || isGodMode) && (
                    <th className="py-2.5 px-3 text-center">Action</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {currentRecord.expenses.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-1.5">
                        <Receipt className="w-6 h-6 text-slate-300" />
                        <span className="font-semibold text-xs text-slate-600">No expense line items added yet</span>
                        <span className="text-[11px] text-slate-400">Click "+ Add Expense" above to record maintenance bills.</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  currentRecord.expenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-800">{exp.particular}</div>
                        <div className="text-[10px] text-slate-400">{new Date(exp.createdAt).toLocaleDateString()}</div>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                          exp.category === 'utilities' ? 'bg-[#299cdb]/10 text-[#299cdb]' :
                          exp.category === 'cleaning' ? 'bg-[#0ab39c]/10 text-[#0ab39c]' :
                          exp.category === 'repairs' ? 'bg-[#f7b84b]/10 text-[#f7b84b]' :
                          'bg-[#405189]/10 text-[#405189]'
                        }`}>
                          {exp.category}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-slate-800">
                        ₹{exp.amount.toLocaleString('en-IN')}
                      </td>
                      {(currentUserRole === 'OWNER' || currentUserRole === 'ADMIN_TENANT' || isGodMode) && (
                        <td className="py-3 px-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            {onOpenEditExpense && (
                              <button
                                onClick={() => onOpenEditExpense(exp)}
                                className="p-1 rounded hover:bg-slate-100 text-slate-500 hover:text-[#405189] cursor-pointer"
                                title="Edit Expense"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {onDeleteExpense && (
                              <button
                                onClick={() => onDeleteExpense(exp.id)}
                                className="p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-500 cursor-pointer"
                                title="Delete Expense"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Showing {currentRecord.expenses.length} Line Items</span>
            <div className="flex items-center gap-1">
              <span className="text-[11px] text-slate-400 font-semibold">Live Store</span>
            </div>
          </div>
        </div>

        {/* Right (6 cols): Active Tenants Contribution Matrix */}
        <div className="lg:col-span-6 velzon-card p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-800">
              Active Tenants Payment Matrix
            </h2>
            <div className="flex items-center gap-2">
              {isGodMode && (
                <button
                  type="button"
                  onClick={() => openMasterTab('residents')}
                  className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg flex items-center gap-1 shadow-xs cursor-pointer"
                >
                  <Plus className="w-3 h-3" /> Add Resident
                </button>
              )}
              <button
                onClick={() => onNavigate('tenants')}
                className="text-xs text-[#405189] hover:underline font-semibold cursor-pointer"
              >
                View Directory →
              </button>
            </div>
          </div>

          <div className="space-y-3 mt-3">
            {users.map((u) => {
              const isPaid = u.paymentStatus === 'paid';
              const isPending = u.paymentStatus === 'pending';

              return (
                <div key={u.id} className="p-2.5 rounded-xl border border-slate-100 hover:border-slate-200 flex items-center justify-between transition-colors bg-white">
                  <div className="flex items-center gap-3">
                    <img
                      src={u.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                      alt={u.fullName}
                      className="w-8 h-8 rounded-full object-cover border border-slate-200"
                    />
                    <div>
                      <div className="text-xs font-bold text-slate-800">{u.fullName}</div>
                      <div className="text-[11px] text-slate-400">{u.flatNumber} • {u.role}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="text-right hidden sm:block">
                      <div className="text-xs font-bold text-slate-800">₹{currentRecord.individualContribution.toFixed(0)}</div>
                      <div className="text-[10px] text-slate-400">Due Share</div>
                    </div>

                    <button
                      onClick={() => onToggleTenantPaymentStatus && onToggleTenantPaymentStatus(u.id)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-all cursor-pointer ${
                        isPaid ? 'bg-[#0ab39c]/10 text-[#0ab39c] border border-[#0ab39c]/20 hover:bg-[#0ab39c]/20' :
                        isPending ? 'bg-[#f7b84b]/10 text-[#f7b84b] border border-[#f7b84b]/20 hover:bg-[#f7b84b]/20' :
                        'bg-[#f06548]/10 text-[#f06548] border border-[#f06548]/20 hover:bg-[#f06548]/20'
                      }`}
                      title="Click to toggle Paid/Pending/Unpaid status"
                    >
                      {u.paymentStatus || 'unpaid'}
                    </button>

                    {isGodMode && (
                      <button
                        type="button"
                        onClick={() => openMasterTab('residents')}
                        className="p-1 text-slate-400 hover:text-indigo-700 hover:bg-slate-50 rounded cursor-pointer"
                        title={`Edit profile for ${u.fullName}`}
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Occupancy Rate: <strong>100%</strong></span>
            <span className="text-[#0ab39c] font-bold">{paidTenantsCount}/{users.length} Settled</span>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 5. LOWER SECTION 2: EXPENSE DONUT + RECENT TRANSACTIONS                   */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left (4 cols): Expense Distribution Donut Chart */}
        <div className="lg:col-span-4 velzon-card p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-800">
                Expense Distribution
              </h2>
              <span className="text-xs text-slate-400">Live Breakdown</span>
            </div>

            <div className="h-56 w-full flex items-center justify-center my-2">
              {pieData.length === 0 ? (
                <div className="h-full w-full flex flex-col items-center justify-center text-slate-400 text-xs gap-2">
                  <div className="w-14 h-14 rounded-full border-2 border-dashed border-slate-200 flex items-center justify-center">
                    <Tag className="w-5 h-5 text-slate-300" />
                  </div>
                  <span className="font-semibold text-slate-600">No categories to display</span>
                  <span className="text-[11px]">Add line items to generate breakdown.</span>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '6px', fontSize: '11px' }}
                      formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Cost']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Custom Donut Legend */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2 border-t border-slate-100 text-[11px] text-slate-600 font-medium">
            {pieData.length === 0 ? (
              <span className="text-slate-400 text-[11px]">Awaiting expense data</span>
            ) : (
              pieData.map((d) => (
                <div key={d.name} className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                  <span>{d.name} ({totalCatSum > 0 ? ((d.value / totalCatSum) * 100).toFixed(1) : 0}%)</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right (8 cols): Recent Maintenance Transactions Ledger */}
        <div className="lg:col-span-8 velzon-card p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-800">
              Recent Maintenance Transactions & Ledger
            </h2>

            <button
              onClick={onExportReport}
              className="px-3 py-1 bg-[#299cdb]/10 hover:bg-[#299cdb]/20 text-[#299cdb] text-xs font-semibold rounded flex items-center gap-1 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" /> Generate Report
            </button>
          </div>

          <div className="overflow-x-auto mt-2">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                <tr>
                  <th className="py-2.5 px-3">Order ID</th>
                  <th className="py-2.5 px-3">Particulars</th>
                  <th className="py-2.5 px-3 text-right">Amount</th>
                  <th className="py-2.5 px-3">Authorized By</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {currentRecord.expenses.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-1.5">
                        <Receipt className="w-6 h-6 text-slate-300" />
                        <span className="font-semibold text-xs text-slate-600">No transactions recorded yet</span>
                        <span className="text-[11px] text-slate-400">Authorized expenses will populate the ledger automatically.</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  currentRecord.expenses.map((exp, idx) => (
                    <tr key={exp.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3 font-semibold text-[#405189]">#MH-SEP0{idx + 1}</td>
                      <td className="py-3 px-3 font-semibold text-slate-800">{exp.particular}</td>
                      <td className="py-3 px-3 text-right font-bold text-slate-800">₹{exp.amount.toLocaleString('en-IN')}</td>
                      <td className="py-3 px-3 text-slate-600 font-medium">{exp.addedBy}</td>
                      <td className="py-3 px-3 text-center">
                        <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase bg-[#0ab39c]/10 text-[#0ab39c] border border-[#0ab39c]/20">
                          Audited
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

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

    </div>
  );
};
