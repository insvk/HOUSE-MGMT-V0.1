import React, { useState } from 'react';
import { NotificationLog, UserRole, MaintenanceRecord, House } from '../types';
import { Mail, Send, CheckCircle2, Clock, Shield, AlertCircle, MessageSquare, Copy, Check } from 'lucide-react';
import { playNotificationChime, playSuccessChime } from '../utils/audioUtils';

interface NotificationCenterProps {
  logs: NotificationLog[];
  currentUserRole: UserRole;
  currentRecord?: MaintenanceRecord;
  house?: House;
  onTriggerNotifications: () => void;
}

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  logs,
  currentUserRole,
  currentRecord,
  house,
  onTriggerNotifications,
}) => {
  const [copiedWhatsApp, setCopiedWhatsApp] = useState(false);

  const activeRecord = currentRecord || {
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    grandTotal: 0,
    individualContribution: 0,
    expenses: [],
    activeTenantsCount: 6,
  };

  const monthName = monthNames[activeRecord.month - 1] || 'Current Month';

  const handleCopyWhatsApp = () => {
    const text = `📢 *MADURA HOUSE MAINTENANCE NOTICE - ${monthName.toUpperCase()} ${activeRecord.year}*

Dear Residents,
The monthly maintenance statement for *Madura House* has been generated:

💰 *Total Month Expenditure:* ₹${activeRecord.grandTotal.toLocaleString('en-IN')}
👥 *Active Flats:* ${activeRecord.activeTenantsCount || 5} Units
🏷️ *Per-Flat Share Due:* ₹${activeRecord.individualContribution.toFixed(2)}
🗓️ *Payment Due Date:* 10th of this month

Please remit your share via UPI / Bank Transfer to the Property Account. For audited breakdown, view the resident portal or contact *Sampath Kumar (Property Admin)*.`;

    navigator.clipboard.writeText(text);
    playSuccessChime();
    setCopiedWhatsApp(true);
    setTimeout(() => setCopiedWhatsApp(false), 2500);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="velzon-card p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <Mail className="w-5 h-5 text-[#405189]" /> Resend Email Notifications & Dispatch Log
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Madura House • Automated monthly maintenance emails, WhatsApp alerts & delivery logs
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleCopyWhatsApp}
            className="px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 text-xs font-semibold rounded flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Copy pre-formatted WhatsApp maintenance notice to clipboard"
          >
            {copiedWhatsApp ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" /> Copied WhatsApp Notice
              </>
            ) : (
              <>
                <MessageSquare className="w-3.5 h-3.5 text-emerald-600" /> Copy WhatsApp Notice
              </>
            )}
          </button>

          {(currentUserRole === 'OWNER' || currentUserRole === 'ADMIN_TENANT') && (
            <button
              onClick={() => {
                onTriggerNotifications();
                playNotificationChime();
              }}
              className="px-3.5 py-1.5 bg-[#405189] hover:bg-[#364574] text-white text-xs font-semibold rounded flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" /> Dispatch Resend Emails
            </button>
          )}
        </div>
      </div>

      {/* Email Template Preview Box */}
      <div className="velzon-card p-5">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Mail className="w-4 h-4 text-[#0ab39c]" /> Transactional Email Template Preview
        </h3>

        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-xs text-slate-700 space-y-2.5 font-sans">
          <div className="border-b border-slate-200 pb-2 flex justify-between items-center text-slate-500">
            <span><strong>From:</strong> Madura House Property Administration &lt;noreply@madurahouse.local&gt;</span>
            <span className="text-[10px] bg-slate-200 px-2 py-0.5 rounded font-mono font-semibold">Resend API (Live)</span>
          </div>
          <div>
            <strong>Subject:</strong> [Madura House] {monthName} {activeRecord.year} Maintenance Notice - ₹{activeRecord.individualContribution.toFixed(2)} Due
          </div>

          <div className="pt-2 text-slate-800 leading-relaxed space-y-2">
            <p>Dear Resident,</p>
            <p>The monthly maintenance summary for <strong>{house?.name || 'Madura House'}</strong> has been audited and finalized for <strong>{monthName} {activeRecord.year}</strong>.</p>
            <div className="p-3.5 rounded bg-white border border-slate-200 my-2 shadow-xs space-y-1">
              <div>Total Monthly Cost: <strong className="font-mono text-slate-900">₹{activeRecord.grandTotal.toLocaleString('en-IN')}</strong></div>
              <div>Individual Contribution per Flat: <strong className="text-[#0ab39c] font-bold text-sm font-mono">₹{activeRecord.individualContribution.toFixed(2)}</strong></div>
              <div>Residential Property: <span>{house?.address || 'No. 42, Bypass Road, Ellis Nagar'}, {house?.city || 'Madurai'}</span></div>
              <div>Due Date: <strong>10th {monthName} {activeRecord.year}</strong></div>
            </div>
            <p>Thank you,<br />Property Administrator: <strong>Sampath Kumar</strong></p>
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
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400 font-sans">
                    No notification dispatch logs recorded yet.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
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
                      {new Date(log.sentAt).toLocaleString('en-IN')}
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
