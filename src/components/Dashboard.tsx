import React, { useState } from 'react';
import { MaintenanceRecord, User, UserRole, Expense } from '../types';
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
  Receipt
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
  onNavigate: (tab: string) => void;
  onOpenAddExpense: () => void;
  onOpenAddTenant: () => void;
  onOpenEditExpense?: (expense: Expense) => void;
  onDeleteExpense?: (expenseId: string) => void;
  onToggleTenantPaymentStatus?: (userId: string) => void;
  onExportReport: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  currentRecord,
  records,
  users,
  currentUser,
  currentUserRole,
  onNavigate,
  onOpenAddExpense,
  onOpenAddTenant,
  onOpenEditExpense,
  onDeleteExpense,
  onToggleTenantPaymentStatus,
  onExportReport,
}) => {
  const [timeFilter, setTimeFilter] = useState<'All' | '1M' | '6M' | '1Y'>('1M');
  const [selectedSort, setSelectedSort] = useState<'Today' | 'Monthly' | 'Yearly'>('Monthly');

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
      {/* 1. Velzon Greeting & Top Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">
            Good Morning, {currentUser.fullName}!
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Here's what's happening with <span className="font-semibold text-slate-700">Madura House</span> maintenance today.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Date Range Selector Pill */}
          <div className="flex items-center gap-2 bg-white px-3.5 py-1.5 rounded border border-slate-200 shadow-sm text-xs font-medium text-slate-700">
            <span>01 {currentMonthName.slice(0, 3)}, {currentRecord.year} to 30 {currentMonthName.slice(0, 3)}, {currentRecord.year}</span>
            <div className="w-6 h-6 bg-[#405189] text-white rounded flex items-center justify-center">
              <Calendar className="w-3.5 h-3.5" />
            </div>
          </div>

          {(currentUserRole === 'OWNER' || currentUserRole === 'ADMIN_TENANT') && (
            <button
              onClick={onOpenAddExpense}
              className="px-3.5 py-1.5 bg-[#0ab39c] hover:bg-[#089380] text-white text-xs font-semibold rounded flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Add Expense
            </button>
          )}

          <button
            onClick={onExportReport}
            className="px-3 py-1.5 bg-[#299cdb]/10 hover:bg-[#299cdb]/20 text-[#299cdb] border border-[#299cdb]/30 text-xs font-semibold rounded flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" /> Export Report
          </button>
        </div>
      </div>

      {/* 2. Velzon 4 Stat Metric Cards */}
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
            <button
              onClick={() => onNavigate('maintenance')}
              className="text-xs text-slate-500 hover:text-[#405189] underline underline-offset-2 cursor-pointer"
            >
              View {currentRecord.expenses.length} expense items
            </button>
            <div className="w-9 h-9 rounded bg-[#0ab39c]/10 text-[#0ab39c] flex items-center justify-center font-bold">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Metric 2: Individual Flat Contribution */}
        <div className="velzon-card p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                TENANT SHARE
              </span>
              <span className="text-xs font-semibold text-[#299cdb] flex items-center">
                <CheckCircle2 className="w-3.5 h-3.5 mr-0.5" /> 6 Units Total
              </span>
            </div>
            <div className="text-2xl font-bold text-slate-800 mt-2">
              ₹{currentRecord.individualContribution.toFixed(2)}
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={() => onNavigate('maintenance')}
              className="text-xs text-slate-500 hover:text-[#405189] underline underline-offset-2 cursor-pointer"
            >
              Split equal across units
            </button>
            <div className="w-9 h-9 rounded bg-[#299cdb]/10 text-[#299cdb] flex items-center justify-center font-bold">
              <Home className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Metric 3: Active Occupancy */}
        <div className="velzon-card p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                OCCUPANCY
              </span>
              <span className="text-xs font-semibold text-[#0ab39c] flex items-center">
                <Users className="w-3.5 h-3.5 mr-1" /> Active
              </span>
            </div>
            <div className="text-2xl font-bold text-slate-800 mt-2">
              {activeTenants.length} Registered
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={() => onNavigate('tenants')}
              className="text-xs text-slate-500 hover:text-[#405189] underline underline-offset-2 cursor-pointer"
            >
              See tenant CRM
            </button>
            <div className="w-9 h-9 rounded bg-[#f7b84b]/10 text-[#f7b84b] flex items-center justify-center font-bold">
              <Users className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Metric 4: Collections & Balance */}
        <div className="velzon-card p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                SETTLED REVENUE
              </span>
              <span className="text-xs font-semibold text-[#0ab39c] flex items-center">
                <CheckCircle2 className="w-3.5 h-3.5 mr-0.5" /> {paidTenantsCount} Paid
              </span>
            </div>
            <div className="text-2xl font-bold text-slate-800 mt-2">
              ₹{totalCollections.toLocaleString('en-IN')}
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={() => onNavigate('tenants')}
              className="text-xs text-slate-500 hover:text-[#405189] underline underline-offset-2 cursor-pointer"
            >
              Pending: ₹{pendingCollections.toFixed(0)}
            </button>
            <div className="w-9 h-9 rounded bg-[#405189]/10 text-[#405189] flex items-center justify-center font-bold">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
        </div>

      </div>

      {/* 3. Middle Section: Revenue/Expense Chart + Unit Status by Location/Flat */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left Column (8 cols): Revenue & Expenditure Chart */}
        <div className="lg:col-span-8 velzon-card p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-800">
              Maintenance Expenditure & Historical Trends
            </h2>

            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded text-xs">
              {(['All', '1M', '6M', '1Y'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTimeFilter(t)}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
                    timeFilter === t ? 'bg-[#299cdb] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Sub-Stat Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 border-b border-slate-100 text-center">
            <div>
              <div className="text-lg font-bold text-slate-800">{currentRecord.expenses.length}</div>
              <div className="text-[11px] text-slate-400 uppercase font-semibold mt-0.5">Line Items</div>
            </div>
            <div>
              <div className="text-lg font-bold text-slate-800">₹{currentRecord.grandTotal.toLocaleString('en-IN')}</div>
              <div className="text-[11px] text-slate-400 uppercase font-semibold mt-0.5">Monthly Cost</div>
            </div>
            <div>
              <div className="text-lg font-bold text-slate-800">₹{currentRecord.individualContribution.toFixed(0)}</div>
              <div className="text-[11px] text-slate-400 uppercase font-semibold mt-0.5">Per Flat Due</div>
            </div>
            <div>
              <div className="text-lg font-bold text-[#0ab39c]">{users.length}</div>
              <div className="text-[11px] text-slate-400 uppercase font-semibold mt-0.5">Occupants</div>
            </div>
          </div>

          {/* Chart Canvas */}
          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={(v) => `₹${v}`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '6px', color: '#1e293b', fontSize: '12px' }}
                  formatter={(value: any) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Expenditure']}
                />
                <Bar dataKey="amount" fill="#0ab39c" radius={[3, 3, 0, 0]} barSize={24} />
                <Line type="monotone" dataKey="line" stroke="#364574" strokeWidth={2.5} dot={{ r: 4, fill: '#364574' }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Column (4 cols): Unit Status by Flat */}
        <div className="lg:col-span-4 velzon-card p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-800">
                Unit Status by Flat
              </h2>
              <button
                onClick={onExportReport}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded cursor-pointer"
              >
                Export
              </button>
            </div>

            {/* Flat Status Progress Bars */}
            <div className="mt-4 space-y-3.5">
              {users.map((u) => {
                const isPaid = u.paymentStatus === 'paid';
                const isPending = u.paymentStatus === 'pending';
                const percent = isPaid ? 100 : isPending ? 50 : 0;

                return (
                  <div key={u.id}>
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1">
                      <span>{u.flatNumber} ({u.fullName.split(' ')[0]})</span>
                      <span className={isPaid ? 'text-[#0ab39c]' : isPending ? 'text-[#f7b84b]' : 'text-[#f06548]'}>
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
            <span>Property: <strong className="text-slate-800">Madura House</strong></span>
            <span className="font-semibold text-[#405189]">{users.length} Active Records</span>
          </div>
        </div>

      </div>

      {/* 4. Lower Section 1: Maintenance Line Items + Active Tenants Payment Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left (6 cols): Maintenance Line Items */}
        <div className="lg:col-span-6 velzon-card p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-800">
              Maintenance Expense Line Items
            </h2>

            <div className="flex items-center gap-1 text-xs text-slate-500">
              <span>SORT BY:</span>
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

          {/* Line Items Table */}
          <div className="overflow-x-auto mt-2">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                <tr>
                  <th className="py-2.5 px-3">Particulars</th>
                  <th className="py-2.5 px-3 text-right">Price</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3 text-right">Amount</th>
                  {(currentUserRole === 'OWNER' || currentUserRole === 'ADMIN_TENANT') && (
                    <th className="py-2.5 px-3 text-center">Action</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {currentRecord.expenses.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-1.5">
                        <Receipt className="w-6 h-6 text-slate-300" />
                        <span className="font-semibold text-xs text-slate-600">No expense line items added yet</span>
                        <span className="text-[11px] text-slate-400">Click "+ Add Expense" above to record electricity, water, or repair bills.</span>
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
                      <td className="py-3 px-3 text-right font-medium">₹{exp.amount.toLocaleString('en-IN')}</td>
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
                      {(currentUserRole === 'OWNER' || currentUserRole === 'ADMIN_TENANT') && (
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
            <button
              onClick={() => onNavigate('tenants')}
              className="text-xs text-[#405189] hover:underline font-semibold cursor-pointer"
            >
              View Directory →
            </button>
          </div>

          <div className="space-y-3 mt-3">
            {users.map((u) => {
              const isPaid = u.paymentStatus === 'paid';
              const isPending = u.paymentStatus === 'pending';

              return (
                <div key={u.id} className="p-2.5 rounded border border-slate-100 hover:border-slate-200 flex items-center justify-between transition-colors">
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

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-xs font-bold text-slate-800">₹{currentRecord.individualContribution.toFixed(0)}</div>
                      <div className="text-[10px] text-slate-400">Due Share</div>
                    </div>

                    <button
                      onClick={() => onToggleTenantPaymentStatus && onToggleTenantPaymentStatus(u.id)}
                      className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase transition-all cursor-pointer ${
                        isPaid ? 'bg-[#0ab39c]/10 text-[#0ab39c] border border-[#0ab39c]/20 hover:bg-[#0ab39c]/20' :
                        isPending ? 'bg-[#f7b84b]/10 text-[#f7b84b] border border-[#f7b84b]/20 hover:bg-[#f7b84b]/20' :
                        'bg-[#f06548]/10 text-[#f06548] border border-[#f06548]/20 hover:bg-[#f06548]/20'
                      }`}
                      title="Click to toggle Paid/Pending/Unpaid status"
                    >
                      {u.paymentStatus || 'unpaid'}
                    </button>
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

      {/* 5. Lower Section 2: Expense Distribution Donut + Ledger Table */}
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

    </div>
  );
};
