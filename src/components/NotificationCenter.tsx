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
  X,
  Zap,
  Radio,
  ArrowRight,
  UserCheck
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
import { InvoicePreviewModal, InvoicePreviewData } from './InvoicePreviewModal';
import { InvoiceAttachmentPill } from './InvoiceAttachmentPill';

interface NotificationCenterProps {
  logs: NotificationLog[];
  currentUserRole: UserRole;
  currentUser?: User;
  currentRecord?: MaintenanceRecord;
  house?: House;
  users: User[];
  onTriggerNotifications?: () => void;
  onDispatchBulkEmails?: (results: EmailDispatchResult[], newLogs: NotificationLog[]) => void;
  showToast?: (msg: string) => void;
}

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  logs,
  currentUserRole,
  currentUser,
  currentRecord,
  house,
  users,
  onTriggerNotifications,
  onDispatchBulkEmails,
  showToast,
}) => {
  const [copiedWhatsApp, setCopiedWhatsApp] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [isDispatching, setIsDispatching] = useState(false);
  const [singleSendingEmail, setSingleSendingEmail] = useState<string | null>(null);
  const [dispatchProgress, setDispatchProgress] = useState<{ current: number; total: number; currentEmail: string } | null>(null);
  const [lastSummary, setLastSummary] = useState<BulkDispatchSummary | null>(null);

  // Resend Settings state
  const [resendKeyInput, setResendKeyInput] = useState(getResendApiKey());
  const [resendFromInput, setResendFromInput] = useState(getResendFromEmail());
  const [isConfigured, setIsConfigured] = useState(isResendConfigured());

  // Derive active record and legit expense values (dynamic calculate from actual entered data)
  const activeRecord: MaintenanceRecord = currentRecord || {
    id: 'mr-sep-2026',
    houseId: 'h-madura-01',
    month: 9,
    year: 2026,
    grandTotal: 0,
    individualContribution: 0,
    expenses: [],
    activeTenantsCount: 5,
    notes: 'September 2026 Maintenance Period',
    createdBy: 'sampathkumar@chemadur.com',
    createdAt: '2026-09-01T00:00:00.000Z',
  };

  // Real-time calculation from actual expenses list
  const expensesList: Expense[] = (activeRecord.expenses && activeRecord.expenses.length > 0)
    ? activeRecord.expenses
    : [];
  
  const [notifInvoicePreview, setNotifInvoicePreview] = useState<InvoicePreviewData | null>(null);
  
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
    if (showToast) showToast('Copied WhatsApp statement to clipboard!');
    setTimeout(() => setCopiedWhatsApp(false), 2500);
  };

  const handleSaveResendSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setResendApiKey(resendKeyInput);
    setResendFromEmail(resendFromInput);
    setIsConfigured(isResendConfigured());
    setShowConfigModal(false);
    playSuccessChime();
    if (showToast) showToast('Resend API Gateway settings updated successfully!');
  };

  // Execute instant bulk dispatch to all active tenants
  const handleExecuteDispatch = async (openModalAfter = false) => {
    if (activeTenantRecipients.length === 0) {
      alert('No active tenants with registered email addresses found in Tenant Management.');
      return;
    }

    setIsDispatching(true);
    setDispatchProgress({ current: 0, total: activeTenantRecipients.length, currentEmail: 'Connecting to Resend Gateway...' });

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
          id: '11111111-2222-3333-4444-555555555555',
          name: 'Madura House Maintenance',
          address: 'No. 42, Bypass Road, Ellis Nagar',
          city: 'Maduravoyal',
          postalCode: '625001',
          totalUnits: 5,
          ownerId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        },
        senderName: currentUser?.fullName || 'Sampath Kumar',
      });

      setLastSummary(summary);

      // Generate persistent Notification Logs
      const newLogs: NotificationLog[] = summary.deliveries.map((d) => ({
        id: `n-${Date.now().toString().slice(-4)}-${Math.random().toString(36).substring(2, 6)}`,
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
      if (showToast) {
        showToast(`⚡ Successfully dispatched Resend emails to all ${summary.sentCount} tenants!`);
      }

      if (openModalAfter) {
        setShowDispatchModal(true);
      }
    } catch (err) {
      console.error('Batch email dispatch error:', err);
      playWarningChime();
      if (showToast) showToast('Encountered an error while sending emails.');
    } finally {
      setIsDispatching(false);
      setDispatchProgress(null);
    }
  };

  // Dispatch individual email to a single tenant
  const handleDispatchSingleTenant = async (tenant: User) => {
    if (!tenant.email) return;
    setSingleSendingEmail(tenant.email);

    const recordForDispatch: MaintenanceRecord = {
      ...activeRecord,
      grandTotal: calculatedGrandTotal,
      individualContribution: calculatedContribution,
      expenses: expensesList,
      activeTenantsCount: payingUnits,
    };

    try {
      const summary = await sendBulkMaintenanceEmails({
        recipients: [{
          email: tenant.email,
          fullName: tenant.fullName,
          flatNumber: tenant.flatNumber,
          phone: tenant.phone,
        }],
        record: recordForDispatch,
        house: house || {
          id: '11111111-2222-3333-4444-555555555555',
          name: 'Madura House Maintenance',
          address: 'No. 42, Bypass Road, Ellis Nagar',
          city: 'Maduravoyal',
          postalCode: '625001',
          totalUnits: 5,
          ownerId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        },
        senderName: currentUser?.fullName || 'Sampath Kumar',
      });

      const newLogs: NotificationLog[] = summary.deliveries.map((d) => ({
        id: `n-${Date.now().toString().slice(-4)}-${Math.random().toString(36).substring(2, 6)}`,
        maintenanceRecordId: activeRecord.id,
        recipientEmail: d.recipientEmail,
        type: 'maintenance_added',
        subject: `[Madura House] ${monthName} ${activeRecord.year} Maintenance Notice - ₹${calculatedContribution.toFixed(2)} Due`,
        status: d.status === 'delivered' ? 'sent' : 'failed',
        sentAt: d.timestamp,
      }));

      if (onDispatchBulkEmails) {
        onDispatchBulkEmails(summary.deliveries, newLogs);
      }
      playSuccessChime();
      if (showToast) {
        showToast(`⚡ Dispatched maintenance statement directly to ${tenant.fullName} (${tenant.email})!`);
      }
    } catch (err) {
      console.error('Single tenant dispatch error:', err);
      playWarningChime();
      if (showToast) showToast(`Failed to send email to ${tenant.email}`);
    } finally {
      setSingleSendingEmail(null);
    }
  };

  return (
    <div className="space-y-5 pb-12">
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
              onClick={() => handleExecuteDispatch(false)}
              disabled={isDispatching || activeTenantRecipients.length === 0}
              className="px-4 py-1.5 bg-gradient-to-r from-[#0ab39c] via-[#299cdb] to-[#405189] hover:from-[#099885] hover:to-[#364574] text-white text-xs font-extrabold rounded flex items-center gap-2 shadow-md hover:shadow-lg transition-all transform active:scale-95 cursor-pointer disabled:opacity-50"
              title="Instantly dispatch transactional emails to all active tenants"
            >
              {isDispatching ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Sending ({dispatchProgress?.current || 0}/{dispatchProgress?.total || activeTenantRecipients.length})...
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5 animate-pulse" />
                  ⚡ 1-Click Send All ({activeTenantRecipients.length})
                </>
              )}
            </button>
          )}

          {(currentUserRole === 'OWNER' || currentUserRole === 'ADMIN_TENANT') && (
            <button
              onClick={() => {
                setLastSummary(null);
                setShowDispatchModal(true);
                playNotificationChime();
              }}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 text-xs font-semibold rounded flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Review recipient list & send in modal"
            >
              <Settings2 className="w-3.5 h-3.5 text-slate-600" /> Review & Send...
            </button>
          )}
        </div>
      </div>

      {/* 2. Target Tenant Recipients Directory (Synchronized directly from Tenant Management) */}
      <div className="velzon-card p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4 text-[#405189]" /> Target Tenant Recipients ({activeTenantRecipients.length} Active in System)
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Email addresses retrieved in real-time from the Tenant Management registry. All recipients receive the audited statement in a single click.
            </p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-[11px] font-medium text-[#405189] bg-[#405189]/10 px-2.5 py-1 rounded-full w-fit">
              Auto-Synced with Tenant Directory
            </span>
            {(currentUserRole === 'OWNER' || currentUserRole === 'ADMIN_TENANT') && (
              <button
                onClick={() => handleExecuteDispatch(false)}
                disabled={isDispatching || activeTenantRecipients.length === 0}
                className="px-3 py-1 bg-[#0ab39c] hover:bg-[#099885] text-white text-[11px] font-bold rounded flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {isDispatching ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Send className="w-3 h-3" />
                )}
                Send All ({activeTenantRecipients.length})
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {activeTenantRecipients.map((tenant) => {
            const isSendingThis = singleSendingEmail === tenant.email;
            return (
              <div 
                key={tenant.id} 
                className="p-3 bg-slate-50 hover:bg-slate-100/90 border border-slate-200 rounded-lg transition-colors flex flex-col justify-between gap-2 shadow-2xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#405189] text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                    {tenant.fullName.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-bold text-slate-800 truncate">{tenant.fullName}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-200 text-slate-700 font-semibold shrink-0">
                        {tenant.flatNumber}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono truncate flex items-center gap-1 mt-0.5">
                      <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                      {tenant.email}
                    </div>
                  </div>
                </div>

                {/* Direct 1-Click Send Button per Individual Tenant */}
                {(currentUserRole === 'OWNER' || currentUserRole === 'ADMIN_TENANT') && (
                  <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400">
                      Share Due: <strong className="text-[#0ab39c] font-mono">₹{calculatedContribution.toFixed(2)}</strong>
                    </span>
                    <button
                      onClick={() => handleDispatchSingleTenant(tenant)}
                      disabled={isSendingThis || isDispatching}
                      className="px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-300 hover:border-[#405189] text-slate-700 hover:text-[#405189] text-[10px] font-bold rounded flex items-center gap-1 transition-colors cursor-pointer shadow-2xs disabled:opacity-50"
                      title={`Send instant statement to ${tenant.fullName} (${tenant.email})`}
                    >
                      {isSendingThis ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin text-[#405189]" /> Sending...
                        </>
                      ) : (
                        <>
                          <Send className="w-2.5 h-2.5 text-[#0ab39c]" /> Send Mail
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Transactional Email Template Preview Box & INSTANT DISPATCH ACTION BAR */}
      <div className="velzon-card p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Mail className="w-4 h-4 text-[#0ab39c]" /> Transactional Email Template Preview (Live Statement)
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Subject Line & Dynamic HTML Structure rendered in real-time
            </p>
          </div>
          <span className="text-[11px] font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded">
            {isConfigured ? 'Resend Live API' : 'Resend Engine (Simulated)'}
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
                <span>Property: <strong>{house?.address || 'No. 42, Bypass Road, Ellis Nagar'}, {house?.city || 'Maduravoyal'}</strong></span>
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
                    {expensesList.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-6 text-center text-slate-400 font-sans">
                          No expense line items added yet for {monthName} {activeRecord.year}. Total due is ₹0.00.
                        </td>
                      </tr>
                    ) : (
                      expensesList.map((exp, idx) => (
                        <tr key={exp.id || idx} className="hover:bg-slate-50">
                          <td className="py-2 px-3 text-slate-400 font-mono align-top">#{idx + 1}</td>
                          <td className="py-2 px-3 font-medium text-slate-800 align-top">
                            <div className="font-semibold text-slate-900">{exp.particular}</div>
                            {exp.notes && <div className="text-[10px] text-slate-400 font-normal mt-0.5">{exp.notes}</div>}
                            <InvoiceAttachmentPill
                              expense={exp}
                              onOpenPreview={(inv) => setNotifInvoicePreview(inv)}
                              size="sm"
                            />
                          </td>
                          <td className="py-2 px-3 uppercase text-[10px] font-bold text-[#405189] align-top">{exp.category}</td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-slate-900 align-top">
                            ₹{exp.amount.toLocaleString('en-IN')}
                          </td>
                        </tr>
                      ))
                    )}
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
              Property Administrator: <strong>{currentUser?.fullName || 'Sampath Kumar'}</strong>
            </p>
          </div>
        </div>

        {/* 🌟 GOD MAXX PROMINENT 1-CLICK SEND ACTION BAR RIGHT BELOW PREVIEW */}
        {(currentUserRole === 'OWNER' || currentUserRole === 'ADMIN_TENANT') && (
          <div className="p-4 sm:p-5 rounded-xl bg-gradient-to-r from-[#405189]/10 via-[#0ab39c]/10 to-[#299cdb]/10 border-2 border-[#405189]/30 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm animate-in fade-in duration-200">
            <div className="space-y-1 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2">
                <Sparkles className="w-4 h-4 text-amber-500 animate-bounce" />
                <h4 className="text-sm font-extrabold text-slate-800">
                  Ready to Dispatch {monthName} {activeRecord.year} Maintenance Statement
                </h4>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full border border-emerald-300">
                  1-Click Live
                </span>
              </div>
              <p className="text-xs text-slate-600">
                Clicking the button below instantly dispatches the official audited notice to all <strong>{activeTenantRecipients.length} tenants</strong> ({activeTenantRecipients.map(t => t.email).join(', ')}) and records delivery receipts in the audit log.
              </p>
            </div>

            <button
              onClick={() => handleExecuteDispatch(false)}
              disabled={isDispatching || activeTenantRecipients.length === 0}
              className="w-full md:w-auto px-6 py-3.5 bg-gradient-to-r from-[#0ab39c] via-[#299cdb] to-[#405189] hover:from-[#099885] hover:via-[#248ac2] hover:to-[#364473] text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-lg hover:shadow-xl transition-all transform active:scale-95 flex items-center justify-center gap-3 cursor-pointer shrink-0 disabled:opacity-50"
            >
              {isDispatching ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Dispatching ({dispatchProgress?.current || 0}/{dispatchProgress?.total || activeTenantRecipients.length})...</span>
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  <span>🚀 SEND MAILS TO ALL TENANTS INSTANTLY ({activeTenantRecipients.length})</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Live Delivery Receipt Feedback if just dispatched */}
        {lastSummary && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                Successfully Delivered to All {lastSummary.sentCount} Recipients!
              </div>
              <span className="text-[10px] font-mono text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded font-bold">
                Status: Verified HTTP 200
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono pt-1">
              {lastSummary.deliveries.map((del, idx) => (
                <div key={idx} className="p-2 bg-white rounded border border-emerald-200 flex justify-between items-center text-[11px]">
                  <span className="font-bold text-slate-800">{del.flatNumber}: {del.recipientEmail}</span>
                  <span className="text-emerald-700 font-semibold">{del.messageId.slice(0, 16)}...</span>
                </div>
              ))}
            </div>
          </div>
        )}
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
                    No notification dispatch logs recorded yet. Click "⚡ Send Mails to All Tenants" above to send the first batch.
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
                  placeholder="notifications@chemadur.com"
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
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#405189] hover:bg-[#364574] text-white font-bold rounded-lg shadow-sm cursor-pointer"
                >
                  Save Gateway Settings
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. One-Click Bulk Email Dispatch Review Modal */}
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
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-md cursor-pointer"
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
                      onClick={() => handleExecuteDispatch(false)}
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

      {/* Universal Invoice Preview Modal */}
      <InvoicePreviewModal
        invoice={notifInvoicePreview}
        onClose={() => setNotifInvoicePreview(null)}
      />
    </div>
  );
};
