import React from 'react';
import { AuditLog } from '../types';
import { ShieldCheck, Lock, Activity, Clock } from 'lucide-react';

interface AuditLogViewerProps {
  logs: AuditLog[];
}

export const AuditLogViewer: React.FC<AuditLogViewerProps> = ({ logs }) => {
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="velzon-card p-5">
        <h1 className="text-lg font-bold text-slate-800 tracking-tight flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-[#405189]" /> Security Audit Trail & Immutable Log
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Madura House • Row-Level Security telemetry, user mutation actions & access timestamps
        </p>
      </div>

      {/* Logs Table */}
      <div className="velzon-card overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-800">System Activity & Mutation Logs</h2>
          <span className="text-xs text-slate-400 font-mono">Status: RLS Active</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
              <tr>
                <th className="py-2.5 px-4">User</th>
                <th className="py-2.5 px-4">Action</th>
                <th className="py-2.5 px-4">Resource</th>
                <th className="py-2.5 px-4">IP Address</th>
                <th className="py-2.5 px-4 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-xs">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-sans font-bold text-slate-800">{log.userEmail}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded bg-[#405189]/10 text-[#405189] font-semibold">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-500">{log.resourceType} ({log.resourceId})</td>
                  <td className="py-3 px-4 text-slate-500">{log.ipAddress}</td>
                  <td className="py-3 px-4 text-right text-slate-400">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
