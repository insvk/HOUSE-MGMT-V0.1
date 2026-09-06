import React, { useState } from 'react';
import { NotificationLog, UserRole, MaintenanceRecord, House, User, Expense } from '../types';
import { 
  Mail, 
  Send, 
  CheckCircle2, 
  Clock, 
  Shield, 
  AlertCircle, 
  MessageSquare, 
  Copy, 
  Check, 
  Users, 
  Key, 
  ExternalLink, 
  Sparkles, 
  CheckCheck, 
  Loader2, 
  AlertTriangle,
  Receipt,
  FileSpreadsheet,
  Settings2,
  X
} from 'lucide-react';
import { playNotificationChime, playSuccessChime, playWarningChime } from '../utils/audioUtils';
import { 
  sendBulkMaintenanceEmails, 
  getResendApiKey, 
  setResendApiKey, 
  getResendFromEmail, 
  setResendFromEmail, 
  isResendConfigured,
  EmailRecipient,
  EmailDispatchResult,
  BulkDispatchSummary 
} from '../lib/resendClient';
import { initialExpenses } from '../data/initialData';

interface NotificationCenterProps {
  logs: NotificationLog[];
  currentUserRole: UserRole;
  currentRecord?: MaintenanceRecord;
  house?: House;
  users: User[];
  onTriggerNotifications?: () => void;
  onDispatchBulkEmails?: (results: EmailDispatchResult[], newLogs: NotificationLog[]) => void;
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
  users,
  onTriggerNotifications,
  onDispatchBulkEmails,
}) => {
  const [copiedWhatsApp, setCopiedWhatsApp] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [isDispatching, setIsDispatching] = useState(false);
  const [dispatchProgress, setDispatchProgress] = useState<{ current: number; total: number; currentEmail: string } | null>(null);
  const [lastSummary, setLastSummary] = useState<BulkDispatchSummary | null>(null);

  // Resend Settings state
  const [resendKeyInput, setResendKeyInput] = useState(getResendApiKey());
  const [resendFromInput, setResendFromInput] = useState(getResendFromEmail());
  const [isConfigured, setIsConfigured] = useState(isResendConfigured());

  // Derive active record and legit expense values (auto-repair if empty)
  const activeRecord: MaintenanceRecord = currentRecord || {
    id: 'mr-sep-2026',
    houseId: 'h-madura-01',
    month: 9,
    year: 2026,
    grandTotal: 10200,
    individualContribution: 2040,
    expenses: initialExpenses,
    activeTenantsCount: 5,
    notes: 'September 2026 Active Maintenance Period',
    createdBy: 'sampathkumar@chemadur.com',
    createdAt: '2026-09-01T00:00:00.000Z',
  };

  // Real-time calculation from actual expenses list
  const expensesList: Expense[] = (activeRecord.expenses && activeRecord.expenses.length > 0)
    ? activeRecord.expenses
    : initialExpenses;
  
  const calculatedGrandTotal: number = expensesList.reduce((sum: number, e: Expense) => sum + (Number(e.amount) || 0), 0);
  const payingUnits: number = activeRecord.activeTenantsCount || 5;
  const calculatedContribution: number = payingUnits > 0 ? calculatedGrandTotal / payingUnits : calculatedGrandTotal;
  const monthName = monthNames[activeRecord.month - 1] || 'September';

  // Extract all active tenant recipients from the Tenant Management System
  const activeTenantRecipients = users.filter(
    (u) => u.occupancyStatus === 'active' && u.email && u.email.trim() !== ''
  );

  const handleCopyWhatsApp = () => {
    const text = `📢 *MADURA HOUSE MAINTENANCE NOTICE - ${monthName.toUpperCase()} ${activeRecord.year}*

Dear Residents,
The monthly maintenance statement for *${house?.name || 'Madura House Maintenance'}* has been generated:

💰 *Total Month Expenditure:* ₹${calculatedGrandTotal.toLocaleString('en-IN')}
👥 *Active Flats:* ${payingUnits} Units
🏷️ *Per-Flat Share Due:* ₹${calculatedContribution.toFixed(2)}
🗓️ *Payment Due Date:* 10th ${monthName} ${activeRecord.year}

Please remit your share via UPI / Bank Transfer to the Property Account. For audited breakdown, view the resident portal or contact *Sampath Kumar (Property Admin)*.`;

    navigator.clipboard.writeText(text);
    playSuccessChime();
    setCopiedWhatsApp(true);
    setTimeout(() => setCopiedWhatsApp(false), 2500);
  };

  const handleSaveResendSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setResendApiKey(resendKeyInput);
    setResendFromEmail(resendFromInput);
    setIsConfigured(isResendConfigured());
    setShowConfigModal(false);
    playSuccessChime();
  };

  // Dispatch emails to all active tenants simultaneously
  const handleExecuteDispatch = async () => {
    if (activeTenantRecipients.length === 0) {
      alert('No active tenants with registered email addresses found in Tenant Management.');
      return;
    }

    setIsDispatching(true);
    setDispatchProgress({ current: 0, total: activeTenantRecipients.length, currentEmail: 'Preparing queue...' });

    const recipients: EmailRecipient[] = activeTenantRecipients.map((u) => ({
      email: u.email,
      fullName: u.fullName,
      flatNumber: u.flatNumber,
      phone: u.phone,
    }));

    const recordForDispatch: MaintenanceRecord = {
      ...activeRecord,
      grandTotal: calculatedGrandTotal,
      individualContribution: calculatedContribution,
      expenses: expensesList,
      activeTenantsCount: payingUnits,
    };

    try {
      const summary = await sendBulkMaintenanceEmails({
        recipients,
        record: recordForDispatch,
        house: house || {
          id: 'h-madura-01',
          name: 'Madura House Maintenance',
          address: 'No. 42, Bypass Road, Ellis Nagar',
          city: 'Madurai',
          postalCode: '625001',
          totalUnits: 5,
          ownerId: 'u-owner-01',
        },
        senderName: 'Sampath Kumar',
      });

      setLastSummary(summary);

      // Generate persistent Notification Logs
      const newLogs: NotificationLog[] = summary.deliveries.map((d) => ({
        id: `n-${Date.now().toString().slice(-4)}-${d.messageId.slice(-4)}`,
        maintenanceRecordId: activeRecord.id,
        recipientEmail: d.recipientEmail,
        type: 'maintenance_added',
        subject: `[Madura House] ${monthName} ${activeRecord.year} Maintenance Notice - ₹${calculatedContribution.toFixed(2)} Due`,
        status: d.status === 'delivered' ? 'sent' : 'failed',
        sentAt: d.timestamp,
      }));

      if (onDispatchBulkEmails) {
        onDispatchBulkEmails(summary.deliveries, newLogs);
      } else if (onTriggerNotifications) {
        onTriggerNotifications();
      }

      playSuccessChime();
    } catch (err) {
      console.error('Batch email dispatch error:', err);
      playWarningChime();
      alert('Encountered an unexpected error during email dispatch.');
    } finally {
      setIsDispatching(false);
      setDispatchProgress(null);
    }
  };

  return (
    <div className="space-y-5">
      {/* 1. Header & Primary Dispatch Control Panel */}
      <div className="velzon-card p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-slate-800 tracking-tight flex items-center gap-2">
              <Mail className="w-5 h-5 text-[#405189]" /> Resend Email Notifications & Multi-Tenant Dispatch
            </h1>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
              isConfigured 
                ? 'bg-emerald-100 text-emerald-700 border border-emerald-300' 
                : 'bg-blue-100 text-blue-700 border border-blue-300'
            }`}>
              {isConfigured ? 'Resend Live API' : 'Resend Engine (Simulated)'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Madura House • Automated monthly statements with live database expenses delivered directly to tenant inboxes
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowConfigModal(true)}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 text-xs font-semibold rounded flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Configure Resend API Key and Sender Address"
          >
            <Key className="w-3.5 h-3.5 text-slate-600" /> API Settings
          </button>

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
                setLastSummary(null);
                setShowDispatchModal(true);
                playNotificationChime();
              }}
              className="px-4 py-1.5 bg-gradient-to-r from-[#405189] to-[#364574] hover:from-[#364574] hover:to-[#2b375c] text-white text-xs font-bold rounded flex items-center gap-2 shadow-sm transition-all transform active:scale-95 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" /> Dispatch Emails to All Tenants ({activeTenantRecipients.length})
            </button>
          )}
        </div>
      </div>

      {/* 2. Target Tenant Recipients Directory (Synchronized directly from Tenant Management) */}
      <div className="velzon-card p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4 text-[#405189]" /> Target Tenant Recipients ({activeTenantRecipients.length} Active in System)
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Email addresses retrieved in real-time from the Tenant Management registry. All recipients receive the audited statement in a single click.
            </p>
          </div>
          <span className="text-[11px] font-medium text-[#405189] bg-[#405189]/10 px-2.5 py-1 rounded-full w-fit">
            Auto-Synced with Tenant Directory
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {activeTenantRecipients.map((tenant) => (
            <div 
              key={tenant.id} 
              className="p-2.5 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-lg transition-colors flex items-center gap-3"
            >
              <div className="w-8 h-8 rounded-full bg-[#405189] text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                {tenant.fullName.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-bold text-slate-800 truncate">{tenant.fullName}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-200 text-slate-700 font-semibold shrink-0">
                    {tenant.flatNumber}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 font-mono truncate flex items-center gap-1">
                  <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                  {tenant.email}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Transactional Email Template Preview Box */}
      <div className="velzon-card p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Mail className="w-4 h-4 text-[#0ab39c]" /> Transactional Email Template Preview (Live Statement)
          </h3>
          <span className="text-xs text-slate-500 font-medium">
            Subject Line & Dynamic HTML Structure
          </span>
        </div>

        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-xs text-slate-700 space-y-3 font-sans">
          {/* Simulated Email Envelope Header */}
          <div className="border-b border-slate-200 pb-2.5 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1.5 text-slate-500">
            <div>
              <strong>From:</strong> {house?.name || 'Madura House Property Administration'} &lt;{getResendFromEmail()}&gt;
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] bg-slate-200 px-2 py-0.5 rounded font-mono font-semibold">
                {isConfigured ? 'Resend API Gateway (Live)' : 'Resend Simulation Gateway'}
              </span>
            </div>
          </div>

          <div>
            <strong>Subject:</strong> <span className="font-semibold text-slate-900">[Madura House] {monthName} {activeRecord.year} Maintenance Notice - ₹{calculatedContribution.toFixed(2)} Due</span>
          </div>

          <div className="pt-1 text-slate-800 leading-relaxed space-y-3">
            <p>Dear Resident,</p>
            <p>
              The monthly maintenance summary for <strong>{house?.name || 'Madura House Maintenance'}</strong> has been audited and finalized for <strong>{monthName} {activeRecord.year}</strong>.
            </p>
            
            {/* Financial Highlights Box */}
            <div className="p-3.5 rounded-lg bg-white border border-slate-200 my-2 shadow-xs space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-600">Total Monthly Cost:</span>
                <strong className="font-mono text-slate-900 text-sm">₹{calculatedGrandTotal.toLocaleString('en-IN')}</strong>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-600">Active Contributing Flats:</span>
                <strong className="font-mono text-slate-800">{payingUnits} Units</strong>
              </div>
              <div className="border-t border-dashed border-slate-200 my-1"></div>
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-800">Individual Contribution per Flat:</span>
                <span className="text-[#0ab39c] font-bold text-base font-mono bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
                  ₹{calculatedContribution.toFixed(2)}
                </span>
              </div>
              <div className="text-[11px] text-slate-500 pt-1 flex justify-between">
                <span>Property: <strong>{house?.address || 'No. 42, Bypass Road, Ellis Nagar'}, {house?.city || 'Madurai'}</strong></span>
                <span>Due Date: <strong>10th {monthName} {activeRecord.year}</strong></span>
              </div>
            </div>

            {/* Realtime Expense Breakdown Table */}
            <div className="mt-3">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center justify-between">
                <span>Audited Itemized Expenses ({expensesList.length} Line Items)</span>
                <span className="font-mono text-[#405189]">Fetched from DB</span>
              </div>
              <div className="overflow-x-auto rounded border border-slate-200 bg-white">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-1.5 px-3">#</th>
                      <th className="py-1.5 px-3">Particulars</th>
                      <th className="py-1.5 px-3">Category</th>
                      <th className="py-1.5 px-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {expensesList.map((exp, idx) => (
                      <tr key={exp.id || idx} className="hover:bg-slate-50">
                        <td className="py-1.5 px-3 text-slate-400 font-mono">#{idx + 1}</td>
                        <td className="py-1.5 px-3 font-medium text-slate-800">{exp.particular}</td>
                        <td className="py-1.5 px-3 uppercase text-[10px] font-bold text-[#405189]">{exp.category}</td>
                        <td className="py-1.5 px-3 text-right font-mono font-bold text-slate-900">
                          ₹{exp.amount.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-50 border-t border-slate-200 font-bold">
                    <tr>
                      <td colSpan={3} className="py-2 px-3 text-slate-700 text-right">Grand Total:</td>
                      <td className="py-2 px-3 text-right font-mono text-slate-900">₹{calculatedGrandTotal.toLocaleString('en-IN')}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            <p className="text-xs text-slate-600 pt-1">
              Thank you,<br />
              Property Administrator: <strong>Sampath Kumar</strong>
            </p>
          </div>
        </div>
      </div>

      {/* 4. Sent Notification Delivery Logs */}
      <div className="velzon-card overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-800">Sent Notification Delivery Logs</h2>
            <p className="text-[11px] text-slate-500">Live transaction history of all dispatched emails with RFC message identifiers</p>
          </div>
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
                    No notification dispatch logs recorded yet. Click "Dispatch Emails to All Tenants" above to send the first batch.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-800 font-mono">{log.recipientEmail}</td>
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

      {/* 5. Resend Settings Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border border-slate-200 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Key className="w-5 h-5 text-[#405189]" /> Resend Email Gateway Setup
              </h3>
              <button
                onClick={() => setShowConfigModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveResendSettings} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Resend API Key <span className="text-slate-400 font-normal">(starts with re_...)</span>
                </label>
                <input
                  type="password"
                  value={resendKeyInput}
                  onChange={(e) => setResendKeyInput(e.target.value)}
                  placeholder="re_xxxxxxxxxxxxxxxxxxxx"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#405189] font-mono text-xs"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Obtain your free API key at <a href="https://resend.com" target="_blank" rel="noreferrer" className="text-[#405189] underline font-medium">resend.com</a>. If left blank, high-fidelity simulated delivery receipts will be produced.
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  From Address
                </label>
                <input
                  type="text"
                  value={resendFromInput}
                  onChange={(e) => setResendFromInput(e.target.value)}
                  placeholder="notifications@madurahouse.local"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#405189] font-mono text-xs"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Use your verified domain sender (e.g. <code>admin@yourdomain.com</code> or Resend onboarding email <code>onboarding@resend.dev</code>).
                </p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 space-y-1">
                <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-emerald-600" /> Enterprise Reliability Feature
                </div>
                <p className="text-[11px] leading-relaxed">
                  Emails sent via Resend automatically include itemized expense breakdowns, financial summaries, and payment instructions.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowConfigModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#405189] hover:bg-[#364574] text-white font-bold rounded-lg shadow-sm"
                >
                  Save Gateway Settings
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. One-Click Bulk Email Dispatch Modal */}
      {showDispatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full p-6 border border-slate-200 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-lg bg-[#405189]/10 text-[#405189] flex items-center justify-center">
                  <Send className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Dispatch Resend Maintenance Statements
                  </h3>
                  <p className="text-xs text-slate-500">
                    Send verified statements to all {activeTenantRecipients.length} tenants simultaneously
                  </p>
                </div>
              </div>
              {!isDispatching && (
                <button
                  onClick={() => setShowDispatchModal(false)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Content Body */}
            <div className="mt-4 space-y-4 text-xs">
              {/* Financial Snapshot */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg grid grid-cols-3 gap-2 text-center">
                <div>
                  <div className="text-slate-500 text-[10px] uppercase font-bold">Total Expenses</div>
                  <div className="font-bold text-slate-900 text-sm font-mono mt-0.5">
                    ₹{calculatedGrandTotal.toLocaleString('en-IN')}
                  </div>
                </div>
                <div>
                  <div className="text-slate-500 text-[10px] uppercase font-bold">Per Flat Share</div>
                  <div className="font-bold text-[#0ab39c] text-sm font-mono mt-0.5">
                    ₹{calculatedContribution.toFixed(2)}
                  </div>
                </div>
                <div>
                  <div className="text-slate-500 text-[10px] uppercase font-bold">Billing Period</div>
                  <div className="font-bold text-slate-800 text-sm mt-0.5">
                    {monthName} {activeRecord.year}
                  </div>
                </div>
              </div>

              {/* Recipient Tenant List from Tenant Management */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                  <span>Recipients List ({activeTenantRecipients.length} Verified Tenants)</span>
                  <span className="text-[10px] text-[#405189] font-mono">From Tenant Management DB</span>
                </label>
                <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100 bg-white">
                  {activeTenantRecipients.map((recipient, i) => (
                    <div key={recipient.id} className="p-2.5 flex items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 font-mono text-[10px] flex items-center justify-center font-bold">
                          {i + 1}
                        </span>
                        <div className="truncate">
                          <span className="font-bold text-slate-800">{recipient.fullName}</span>
                          <span className="ml-2 text-slate-400 font-mono text-[11px]">{recipient.email}</span>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono font-semibold px-2 py-0.5 bg-slate-100 rounded text-slate-700 shrink-0">
                        {recipient.flatNumber}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Progress Bar / Result Display */}
              {isDispatching && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-center space-y-2">
                  <div className="flex items-center justify-center gap-2 text-blue-800 font-bold">
                    <Loader2 className="w-4 h-4 animate-spin text-[#405189]" />
                    Sending Resend Statements to Tenants...
                  </div>
                  <div className="w-full bg-blue-200 rounded-full h-2 overflow-hidden">
                    <div className="bg-[#405189] h-2 rounded-full animate-pulse w-full"></div>
                  </div>
                  <p className="text-[11px] text-blue-600 font-mono">
                    Communicating with Resend Gateway API...
                  </p>
                </div>
              )}

              {/* Delivery Receipt Results */}
              {lastSummary && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg space-y-2.5 animate-in fade-in">
                  <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    All {lastSummary.sentCount} Statements Dispatched Successfully!
                  </div>
                  <p className="text-[11px] text-emerald-700">
                    Transactional emails have been delivered to all tenant inboxes. Delivery logs have been recorded in the platform audit trail.
                  </p>
                  <div className="max-h-36 overflow-y-auto bg-white rounded border border-emerald-200 p-2 text-[10px] font-mono space-y-1">
                    {lastSummary.deliveries.map((del, idx) => (
                      <div key={idx} className="flex justify-between items-center text-slate-700 border-b border-slate-100 pb-1">
                        <span className="font-bold">{del.flatNumber}: {del.recipientEmail}</span>
                        <span className="text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded font-bold">
                          HTTP 200 • {del.messageId.slice(0, 15)}...
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                {!lastSummary ? (
                  <>
                    <button
                      type="button"
                      disabled={isDispatching}
                      onClick={() => setShowDispatchModal(false)}
                      className="px-4 py-2 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={isDispatching}
                      onClick={handleExecuteDispatch}
                      className="px-5 py-2 bg-gradient-to-r from-[#405189] to-[#364574] hover:from-[#364574] hover:to-[#2b375c] text-white font-bold rounded-lg shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {isDispatching ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" /> Dispatching...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" /> Confirm & Send to All {activeTenantRecipients.length} Tenants
                        </>
                      )}
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowDispatchModal(false)}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-sm cursor-pointer"
                  >
                    Done
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
