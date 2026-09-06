import React from 'react';
import { MaintenanceRecord } from '../types';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  LineChart, 
  Line,
  Legend
} from 'recharts';
import { BarChart3, PieChart as PieIcon, TrendingUp, IndianRupee, Download } from 'lucide-react';
import { exportMaintenanceToExcel } from '../utils/exportUtils';

interface AnalyticsDashboardProps {
  records: MaintenanceRecord[];
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ records }) => {
  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  const trendData = records.map((r) => ({
    name: `${monthNames[r.month - 1]} ${r.year}`,
    Total: r.grandTotal,
    PerTenantShare: r.individualContribution,
  })).reverse();

  const activeRecord = records[0] || { expenses: [] };
  const categoryTotals: Record<string, number> = {};

  activeRecord.expenses.forEach((exp) => {
    categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + exp.amount;
  });

  const pieColors: Record<string, string> = {
    utilities: '#0ab39c',
    repairs: '#f7b84b',
    cleaning: '#405189',
    maintenance: '#f06548',
    other: '#299cdb',
  };

  const pieData = Object.keys(categoryTotals).map((cat) => ({
    name: cat.toUpperCase(),
    value: categoryTotals[cat],
    color: pieColors[cat] || '#8884d8',
  }));

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="velzon-card p-5 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#405189]" /> Financial Analytics & Visual Trends
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Madura House • Historical expenditure trends, category ratios & share history
          </p>
        </div>

        <button
          onClick={() => {
            if (records.length > 0) {
              exportMaintenanceToExcel(records[0]);
            }
          }}
          className="px-3 py-1.5 bg-[#299cdb]/10 hover:bg-[#299cdb]/20 text-[#299cdb] text-xs font-semibold rounded flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" /> Export Analytics (Excel)
        </button>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Chart 1: Monthly Expenditure Trend */}
        <div className="velzon-card p-5">
          <div className="pb-3 border-b border-slate-100 mb-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#0ab39c]" /> Monthly Expense Trend
            </h3>
            <p className="text-[11px] text-slate-400">Total monthly expenditure comparison</p>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={(v) => `₹${v}`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '6px', fontSize: '12px' }}
                  formatter={(value: any) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Expenditure']}
                />
                <Bar dataKey="Total" fill="#405189" radius={[4, 4, 0, 0]} barSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Category Expense Breakdown */}
        <div className="velzon-card p-5">
          <div className="pb-3 border-b border-slate-100 mb-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-[#f7b84b]" /> Category Breakdown
            </h3>
            <p className="text-[11px] text-slate-400">Expense distribution across categories</p>
          </div>

          <div className="h-72 w-full flex items-center justify-center">
            {pieData.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-slate-400 text-xs gap-2">
                <PieIcon className="w-8 h-8 text-slate-300" />
                <span className="font-semibold text-slate-600">No expense categories recorded yet</span>
                <span className="text-[11px]">Add line items to generate real-time visual distributions.</span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '6px', fontSize: '11px' }}
                    formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Total']}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Individual Tenant Share History */}
      <div className="velzon-card p-5">
        <div className="pb-3 border-b border-slate-100 mb-4">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <IndianRupee className="w-4 h-4 text-[#0ab39c]" /> Individual Tenant Share History
          </h3>
          <p className="text-[11px] text-slate-400">Trend of per-flat contribution amount over recorded months</p>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={(v) => `₹${v}`} />
              <Tooltip
                contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '6px', fontSize: '12px' }}
                formatter={(val: any) => [`₹${Number(val).toFixed(2)}`, 'Per Flat Due']}
              />
              <Line type="monotone" dataKey="PerTenantShare" stroke="#0ab39c" strokeWidth={3} dot={{ r: 5, fill: '#0ab39c' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
