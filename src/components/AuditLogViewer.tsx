import React, { useState } from 'react';
import { AuditLog } from '../types';
import { ShieldCheck, Lock, Activity, Clock, Search, Download, Filter, CheckCircle2, AlertTriangle, UserCheck } from 'lucide-react';
import { exportAuditLogsToCSV } from '../utils/exportUtils';
import { playSuccessChime } from '../utils/audioUtils';

interface AuditLogViewerProps {
  logs: AuditLog[];
}

export const AuditLogViewer: React.FC<AuditLogViewerProps> = ({ logs }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'AUTH' | 'CREATE' | 'UPDATE' | 'DELETE'>('ALL');

  const filteredLogs = logs.filter((log) => {
    const matchesSearch = 
      log.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.resourceType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.resourceId && log.resourceId.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;

    if (selectedFilter === 'ALL') return true;
    if (selectedFilter === 'AUTH') return log.action.includes('LOGIN') || log.action.includes('AUTH');
    if (selectedFilter === 'CREATE') return log.action.includes('CREATE') || log.action.includes('ADD');
    if (selectedFilter === 'UPDATE') return log.action.includes('UPDATE') || log.action.includes('SET');
    if (selectedFilter === 'DELETE') return log.action.includes('DELETE') || log.action.includes('REMOVE');
    return true;
  });

  const getActionBadgeColor = (action: string) => {
    const act = action.toUpperCase();
    if (act.includes('LOGIN') || act.includes('AUTH')) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (act.includes('CREATE') || act.includes('ADD')) return 'bg-blue-50 text-blue-700 border-blue-200';
    if (act.includes('UPDATE') || act.includes('SET')) return 'bg-amber-50 text-amber-700 border-amber-200';
    if (act.includes('DELETE') || act.includes('REMOVE')) return 'bg-red-50 text-red-700 border-red-200';
    return 'bg-slate-50 text-slate-700 border-slate-200';
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="velzon-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#405189]" /> Security Audit Trail & Immutable Log
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Madura House • Row-Level Security telemetry, user mutation actions & access timestamps
          </p>
        </div>

        <button
          onClick={() => {
            exportAuditLogsToCSV(filteredLogs);
            playSuccessChime();
          }}
          className="px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold rounded flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          title="Export audit records to CSV for compliance reporting"
        >
          <Download className="w-3.5 h-3.5 text-[#405189]" /> Export Audit Log (CSV)
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="velzon-card p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Action Filter Pills */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-md text-xs">
          {(['ALL', 'AUTH', 'CREATE', 'UPDATE', 'DELETE'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedFilter(cat)}
              className={`px-3 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                selectedFilter === cat ? 'bg-[#405189] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search email, action, resource..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="velzon-input pl-8 pr-3 py-1.5 text-xs text-slate-700 w-full sm:w-64"
          />
        </div>
      </div>

      {/* Logs Table */}
      <div className="velzon-card overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-800">
            System Activity & Mutation Logs ({filteredLogs.length} Records)
          </h2>
          <span className="text-xs text-emerald-600 font-mono font-bold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> RLS Protection Active
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
              <tr>
                <th className="py-2.5 px-4">Operator / User</th>
                <th className="py-2.5 px-4">Action</th>
                <th className="py-2.5 px-4">Target Resource</th>
                <th className="py-2.5 px-4">Client IP</th>
                <th className="py-2.5 px-4 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-xs">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-slate-400 font-sans">
                    No audit log records match the selected filter.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-sans font-bold text-slate-800 flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-slate-400" /> {log.userEmail}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded border text-[11px] font-semibold ${getActionBadgeColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-sans">
                      <span className="font-semibold text-slate-800">{log.resourceType}</span>
                      {log.resourceId && <span className="text-slate-400 text-[11px] ml-1">({log.resourceId})</span>}
                    </td>
                    <td className="py-3 px-4 text-slate-500">{log.ipAddress}</td>
                    <td className="py-3 px-4 text-right text-slate-400">
                      {new Date(log.timestamp).toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
