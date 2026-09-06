import React from 'react';
import { NotificationLog, UserRole } from '../types';
import { Mail, Send, CheckCircle2, Clock, Shield, AlertCircle } from 'lucide-react';

interface NotificationCenterProps {
  logs: NotificationLog[];
  currentUserRole: UserRole;
  onTriggerNotifications: () => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  logs,
  currentUserRole,
  onTriggerNotifications,
}) => {
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="velzon-card p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <Mail className="w-5 h-5 text-[#405189]" /> Resend Email Notifications & Dispatch Log
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Madura House • Automated monthly maintenance emails & delivery confirmation
          </p>
        </div>

        {(currentUserRole === 'OWNER' || currentUserRole === 'ADMIN_TENANT') && (
          <button
            onClick={onTriggerNotifications}
            className="px-3.5 py-1.5 bg-[#405189] hover:bg-[#364574] text-white text-xs font-semibold rounded flex items-center gap-1.5 shadow-sm"
          >
            <Send className="w-3.5 h-3.5" /> Dispatch Monthly Maintenance Emails
          </button>
        )}
      </div>

      {/* Email Template Preview Box */}
      <div className="velzon-card p-5">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Mail className="w-4 h-4 text-[#0ab39c]" /> Transactional Email Template Preview
        </h3>

        <div className="bg-slate-50 p-4 rounded border border-slate-200 text-xs text-slate-700 space-y-2.5 font-sans">
          <div className="border-b border-slate-200 pb-2 flex justify-between items-center text-slate-500">
            <span><strong>From:</strong> Madura House Property Administration &lt;noreply@madurahouse.local&gt;</span>
            <span className="text-[10px] bg-slate-200 px-2 py-0.5 rounded font-mono font-semibold">Resend API</span>
          </div>
          <div><strong>Subject:</strong> [Madura House] September 2026 Maintenance Notice - ₹1,250.00 Due</div>

          <div className="pt-2 text-slate-800 leading-relaxed space-y-2">
            <p>Dear Resident,</p>
            <p>The monthly maintenance summary for <strong>Madura House</strong> has been updated for <strong>September 2026</strong>.</p>
            <div className="p-3 rounded bg-white border border-slate-200 my-2 shadow-xs">
              <div>Total Monthly Cost: <strong>₹7,500.00</strong></div>
              <div>Individual Contribution per Flat: <strong className="text-[#0ab39c] font-bold text-sm">₹1,250.00</strong></div>
              <div>Due Date: <strong>15th September 2026</strong></div>
            </div>
            <p>Thank you,<br />Property Admin: <strong>Sampath Kumar</strong></p>
          </div>
        </div>
      </div>

      {/* Delivery Log Table */}
      <div className="velzon-card overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-800">Sent Notification Delivery Logs</h2>
          <span className="text-xs text-slate-400 font-mono">Gateway: Resend</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
              <tr>
                <th className="py-2.5 px-4">Recipient</th>
                <th className="py-2.5 px-4">Type</th>
                <th className="py-2.5 px-4">Subject</th>
                <th className="py-2.5 px-4 text-center">Status</th>
                <th className="py-2.5 px-4 text-right">Sent Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-800">{log.recipientEmail}</td>
                  <td className="py-3 px-4">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-[#405189]/10 text-[#405189] font-semibold">
                      {log.type}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-700">{log.subject}</td>
                  <td className="py-3 px-4 text-center">
                    <span className="inline-flex items-center gap-1 text-[10px] px-2.5 py-0.5 rounded font-bold uppercase bg-[#0ab39c]/10 text-[#0ab39c]">
                      <CheckCircle2 className="w-3 h-3" /> {log.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right text-slate-500 font-mono">
                    {new Date(log.sentAt).toLocaleString()}
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
