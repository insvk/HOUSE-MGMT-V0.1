import { MaintenanceRecord, House, Expense, User } from '../types';

const RESEND_STORAGE_KEY = 'madura_resend_api_key';
const RESEND_FROM_STORAGE_KEY = 'madura_resend_from_email';

export interface EmailRecipient {
  email: string;
  fullName: string;
  flatNumber: string;
  phone?: string;
}

export interface EmailDispatchResult {
  recipientEmail: string;
  recipientName: string;
  flatNumber: string;
  status: 'delivered' | 'queued' | 'failed';
  messageId: string;
  timestamp: string;
  error?: string;
}

export interface BulkDispatchSummary {
  success: boolean;
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
  isLiveApi: boolean;
  deliveries: EmailDispatchResult[];
}

// Helper to get active Resend API Key
export const getResendApiKey = (): string => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(RESEND_STORAGE_KEY);
    if (saved && saved.trim()) return saved.trim();
  }
  return (import.meta.env.VITE_RESEND_API_KEY || '').trim();
};

export const setResendApiKey = (key: string): void => {
  if (typeof window !== 'undefined') {
    if (key.trim()) {
      localStorage.setItem(RESEND_STORAGE_KEY, key.trim());
    } else {
      localStorage.removeItem(RESEND_STORAGE_KEY);
    }
  }
};

export const getResendFromEmail = (): string => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(RESEND_FROM_STORAGE_KEY);
    if (saved && saved.trim()) return saved.trim();
  }
  return (import.meta.env.VITE_RESEND_FROM_EMAIL || 'notifications@chemadur.com').trim();
};

export const setResendFromEmail = (fromEmail: string): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(RESEND_FROM_STORAGE_KEY, fromEmail.trim());
  }
};

export const isResendConfigured = (): boolean => {
  const key = getResendApiKey();
  return Boolean(key && key.startsWith('re_') && key.length > 8);
};

export const getResendEndpoint = (): string => {
  if (typeof window !== 'undefined') {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return '/api/resend/emails';
    }
  }
  return 'https://api.resend.com/emails';
};

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

/**
 * Generate Executive Transactional HTML Email Template
 */
export const generateMaintenanceEmailHtml = ({
  recipient,
  record,
  house,
  senderName = 'Sampath Kumar',
}: {
  recipient: EmailRecipient;
  record: MaintenanceRecord;
  house: House;
  senderName?: string;
}): string => {
  const monthName = monthNames[record.month - 1] || 'Current Month';

  const expenseRowsHtml = (record.expenses || [])
    .map(
      (e, idx) => `
      <tr style="border-bottom: 1px solid #e2e8f0; font-size: 13px;">
        <td style="padding: 10px 12px; color: #64748b; font-family: monospace;">#${idx + 1}</td>
        <td style="padding: 10px 12px; font-weight: 600; color: #1e293b;">
          ${e.particular}
          ${e.notes ? `<div style="font-size: 11px; color: #94a3b8; font-weight: 400;">${e.notes}</div>` : ''}
        </td>
        <td style="padding: 10px 12px; text-transform: uppercase; font-size: 11px; font-weight: 700; color: #405189;">
          ${e.category}
        </td>
        <td style="padding: 10px 12px; text-align: right; font-weight: 700; color: #0f172a; font-family: monospace;">
          ₹${e.amount.toLocaleString('en-IN')}
        </td>
      </tr>
    `
    )
    .join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Madura House Maintenance Statement</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b;">
  <div style="max-width: 620px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.04);">
    
    <!-- Top Brand Header -->
    <div style="background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%); padding: 28px 32px; color: #ffffff;">
      <div style="font-size: 11px; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase; color: #fbbf24; margin-bottom: 6px;">
        OFFICIAL PROPERTY MAINTENANCE STATEMENT
      </div>
      <h1 style="margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px; color: #ffffff;">
        ${house.name}
      </h1>
      <p style="margin: 4px 0 0 0; font-size: 13px; color: #c7d2fe;">
        ${house.address}, ${house.city} - ${house.postalCode}
      </p>
    </div>

    <!-- Main Content Body -->
    <div style="padding: 28px 32px;">
      
      <!-- Greeting -->
      <p style="font-size: 15px; margin-top: 0; color: #334155; line-height: 1.5;">
        Dear <strong>${recipient.fullName}</strong> (${recipient.flatNumber}),
      </p>
      <p style="font-size: 14px; color: #475569; line-height: 1.5; margin-bottom: 24px;">
        The monthly common maintenance statement for <strong>${house.name}</strong> has been audited and compiled for <strong>${monthName} ${record.year}</strong>. Below is the itemized summary and your individual contribution.
      </p>

      <!-- Key Financial Highlights Card -->
      <div style="background-color: #f1f5f9; border-radius: 12px; border: 1px solid #cbd5e1; padding: 20px; margin-bottom: 24px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 13px;">
          <span style="color: #64748b; font-weight: 600;">Total Month Expenditure:</span>
          <strong style="color: #0f172a; font-family: monospace; font-size: 15px;">₹${record.grandTotal.toLocaleString('en-IN')}</strong>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 13px;">
          <span style="color: #64748b; font-weight: 600;">Total Paying Flats:</span>
          <strong style="color: #0f172a;">${record.activeTenantsCount || 5} Units</strong>
        </div>
        <div style="border-top: 2px dashed #cbd5e1; margin: 12px 0;"></div>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="color: #1e293b; font-weight: 700; font-size: 14px;">Your Flat Share Due (${recipient.flatNumber}):</span>
          <span style="background-color: #059669; color: #ffffff; padding: 6px 14px; border-radius: 8px; font-weight: 800; font-size: 16px; font-family: monospace;">
            ₹${record.individualContribution.toFixed(2)}
          </span>
        </div>
        <div style="margin-top: 10px; font-size: 12px; color: #b45309; font-weight: 600;">
          🗓️ Remittance Due Date: 10th ${monthName} ${record.year}
        </div>
      </div>

      <!-- Itemized Table -->
      <h3 style="font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; color: #475569; margin: 24px 0 12px 0;">
        Itemized Expenses Breakdown (${record.expenses.length} Line Items)
      </h3>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
        <thead>
          <tr style="background-color: #f8fafc; border-bottom: 2px solid #e2e8f0; font-size: 11px; text-transform: uppercase; color: #64748b;">
            <th style="padding: 8px 12px; text-align: left;">#</th>
            <th style="padding: 8px 12px; text-align: left;">Particulars</th>
            <th style="padding: 8px 12px; text-align: left;">Category</th>
            <th style="padding: 8px 12px; text-align: right;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${expenseRowsHtml || '<tr><td colspan="4" style="padding: 16px; text-align: center; color: #94a3b8;">Zero expenses logged for this period.</td></tr>'}
        </tbody>
      </table>

      <!-- Remittance Instructions -->
      <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 12px; padding: 16px; font-size: 12px; color: #1e40af; line-height: 1.6; margin-bottom: 24px;">
        <strong>Remittance Options:</strong><br>
        1. <strong>UPI / QR Transfer:</strong> Pay to property admin via UPI ID on file.<br>
        2. <strong>Bank Transfer / Cash:</strong> Contact Property Administrator <strong>${senderName}</strong> (+91 98421 00000).<br>
        3. Payment receipts will be audited and marked 'Paid' in your Resident Portal.
      </div>

      <!-- Sign Off -->
      <p style="font-size: 13px; color: #64748b; margin: 0;">
        Warm regards,<br>
        <strong style="color: #1e293b;">${senderName}</strong><br>
        Property Developer & Primary Owner<br>
        ${house.name}
      </p>

    </div>

    <!-- Footer -->
    <div style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px 32px; font-size: 11px; color: #94a3b8; text-align: center;">
      This is an automated transactional statement dispatched via Resend Email Services for Madura House Maintenance Management V0.1.
    </div>

  </div>
</body>
</html>
  `.trim();
};

/**
 * Dispatch Batch Maintenance Emails to All Tenants via Resend
 */
export async function sendBulkMaintenanceEmails({
  recipients,
  record,
  house,
  senderName = 'Sampath Kumar',
}: {
  recipients: EmailRecipient[];
  record: MaintenanceRecord;
  house: House;
  senderName?: string;
}): Promise<BulkDispatchSummary> {
  const apiKey = getResendApiKey();
  const fromEmail = getResendFromEmail();
  const isLive = isResendConfigured();
  const monthName = monthNames[record.month - 1] || 'Current Month';

  const deliveries: EmailDispatchResult[] = [];
  let sentCount = 0;
  let failedCount = 0;

  for (const recipient of recipients) {
    const subject = `[Madura House] ${monthName} ${record.year} Maintenance Notice - ₹${record.individualContribution.toFixed(2)} Due`;
    const html = generateMaintenanceEmailHtml({ recipient, record, house, senderName });

    if (isLive) {
      // Live Resend API Call
      try {
        const endpoint = getResendEndpoint();
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: fromEmail.includes('@') ? fromEmail : `Madura House <${fromEmail}>`,
            to: [recipient.email],
            subject,
            html,
          }),
        });

        const data = await response.json();

        if (response.ok && data.id) {
          sentCount++;
          deliveries.push({
            recipientEmail: recipient.email,
            recipientName: recipient.fullName,
            flatNumber: recipient.flatNumber,
            status: 'delivered',
            messageId: data.id,
            timestamp: new Date().toISOString(),
          });
        } else {
          // Resend rejected the email — report as FAILED, not delivered
          console.warn(`Resend API rejection for ${recipient.email}:`, data);
          failedCount++;
          deliveries.push({
            recipientEmail: recipient.email,
            recipientName: recipient.fullName,
            flatNumber: recipient.flatNumber,
            status: 'failed',
            messageId: `resend_err_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            timestamp: new Date().toISOString(),
            error: data.message || 'Email delivery rejected by Resend API',
          });
        }
      } catch (err: any) {
        console.error('Resend dispatch error for', recipient.email, err);
        failedCount++;
        deliveries.push({
          recipientEmail: recipient.email,
          recipientName: recipient.fullName,
          flatNumber: recipient.flatNumber,
          status: 'failed',
          messageId: `msg_err_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          timestamp: new Date().toISOString(),
          error: err?.message || 'Network error during email dispatch',
        });
      }
    } else {
      // High-Fidelity Resend Simulation Mode (Instant delivery receipt)
      await new Promise((resolve) => setTimeout(resolve, 150));
      sentCount++;
      deliveries.push({
        recipientEmail: recipient.email,
        recipientName: recipient.fullName,
        flatNumber: recipient.flatNumber,
        status: 'delivered',
        messageId: `re_sim_${Date.now().toString().slice(-6)}_${recipient.flatNumber.replace(/[^a-zA-Z0-9]/g, '')}`,
        timestamp: new Date().toISOString(),
      });
    }
  }

  return {
    success: sentCount > 0,
    totalRecipients: recipients.length,
    sentCount,
    failedCount,
    isLiveApi: isLive,
    deliveries,
  };
}
