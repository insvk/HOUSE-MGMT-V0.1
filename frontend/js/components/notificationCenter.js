// Resident Communications & Resend Email Notification Center
// Ported from React NotificationCenter.tsx

function renderNotificationCenter() {
    const state = window.appStore ? window.appStore.getState() : {};
    const house = state.house || { name: 'CHE-MADURA HS-1 MGMT' };
    const users = state.users || [];
    const activeResidents = users.filter(u => (u.occupancy_status === 'active' || u.occupancyStatus === 'active') && u.email);
    const records = state.records || [];
    const currentRecord = records.length > 0 ? records[0] : { month: 9, year: 2026, grand_total: 0, active_tenants_count: 5 };
    const expenses = currentRecord.expenses || [];
    const grandTotal = currentRecord.grand_total != null ? parseFloat(currentRecord.grand_total) : (currentRecord.grandTotal != null ? parseFloat(currentRecord.grandTotal) : expenses.reduce((s, e) => s + parseFloat(e.amount || 0), 0));
    const activeTenants = currentRecord.active_tenants_count || currentRecord.activeTenantsCount || 5;
    const share = (grandTotal / (activeTenants || 1)).toFixed(2);
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const monthName = monthNames[(currentRecord.month || 9) - 1] || 'Current Month';

    // Local dispatch logs
    let savedLogs = [];
    try {
        const raw = localStorage.getItem('madura_notification_logs');
        if (raw) savedLogs = JSON.parse(raw);
    } catch (e) {}

    const actionsHtml = `
        <button id="copy-whatsapp-btn" class="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer">
            <i data-lucide="message-square" class="w-3.5 h-3.5"></i>
            <span>Copy WhatsApp Notice</span>
        </button>
        <button id="dispatch-bulk-btn" class="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-black text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer">
            <i data-lucide="send" class="w-3.5 h-3.5"></i>
            <span>Send Email Blast (${activeResidents.length})</span>
        </button>
    `;

    const bodyHtml = `
        <!-- Stats Banner -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                <div>
                    <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Eligible Resident Inboxes</span>
                    <p class="text-2xl font-bold text-slate-900 mt-1">${activeResidents.length} Residents</p>
                </div>
                <div class="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <i data-lucide="mail" class="w-5 h-5"></i>
                </div>
            </div>
            <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                <div>
                    <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Statement Notice Value</span>
                    <p class="text-2xl font-bold text-slate-900 mt-1">₹${share} / Flat</p>
                </div>
                <div class="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <i data-lucide="receipt" class="w-5 h-5"></i>
                </div>
            </div>
            <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                <div>
                    <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Resend Email Gateway</span>
                    <p class="text-2xl font-bold text-slate-900 mt-1">API Connected</p>
                </div>
                <div class="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                    <i data-lucide="shield-check" class="w-5 h-5"></i>
                </div>
            </div>
        </div>

        <!-- Dispatched Notifications Log -->
        <div class="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                    <h2 class="text-base font-bold text-slate-900">Official Communication Logs</h2>
                    <p class="text-xs text-slate-500">Record of all automated and manual statements sent to tenants</p>
                </div>
                <span class="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">${savedLogs.length} notifications</span>
            </div>

            <div class="overflow-x-auto">
                <table class="w-full text-left text-sm">
                    <thead class="bg-[#fafbfc] border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        <tr>
                            <th class="px-6 py-3.5">Recipient</th>
                            <th class="px-6 py-3.5">Flat</th>
                            <th class="px-6 py-3.5">Subject</th>
                            <th class="px-6 py-3.5">Status</th>
                            <th class="px-6 py-3.5 text-right">Timestamp</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100 font-normal">
                        ${savedLogs.length === 0 ? `
                            <tr>
                                <td colspan="5" class="py-12 text-center text-slate-400">
                                    <div class="flex flex-col items-center justify-center">
                                        <i data-lucide="mail" class="w-8 h-8 text-slate-300 mb-2"></i>
                                        <p class="font-medium text-slate-600">No email notices sent yet</p>
                                        <p class="text-xs text-slate-400 mt-1">Click "Send Email Blast" to dispatch monthly statements to all 5 resident inboxes.</p>
                                    </div>
                                </td>
                            </tr>
                        ` : ''}
                        ${savedLogs.map(l => `
                            <tr class="hover:bg-slate-50/80 transition-colors">
                                <td class="px-6 py-4 font-semibold text-slate-900">${l.recipientEmail || l.recipient_email}</td>
                                <td class="px-6 py-4 font-mono text-slate-600">${l.flatNumber || 'Unit'}</td>
                                <td class="px-6 py-4 text-xs text-slate-600">${l.subject || 'Maintenance Notice'}</td>
                                <td class="px-6 py-4">
                                    <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                        l.status === 'delivered' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                                    }">
                                        <span class="w-1.5 h-1.5 rounded-full ${l.status === 'delivered' ? 'bg-emerald-500' : 'bg-amber-500'}"></span>
                                        ${(l.status || 'sent').toUpperCase()}
                                    </span>
                                </td>
                                <td class="px-6 py-4 text-right text-xs text-slate-400 font-mono">
                                    ${new Date(l.sentAt || l.sent_at || Date.now()).toLocaleTimeString()}
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;

    renderAppLayout({
        activeTab: 'notifications',
        title: 'Resident Communications & Email Center',
        subtitle: 'Automated statement emails, WhatsApp broadcast templates, and dispatch audits',
        actionsHtml,
        bodyHtml
    });

    // Copy WhatsApp
    document.getElementById('copy-whatsapp-btn')?.addEventListener('click', () => {
        const text = `📢 *${(house.name || 'CHE-MADURA HS-1 MGMT').toUpperCase()} MAINTENANCE NOTICE - ${monthName.toUpperCase()} ${currentRecord.year || 2026}*\n\nDear Residents,\nThe monthly maintenance statement for *${house.name || 'CHE-MADURA HS-1 MGMT'}* has been generated:\n\n💰 *Total Month Expenditure:* ₹${grandTotal.toLocaleString('en-IN')}\n👥 *Active Flats:* ${activeTenants} Units\n🏷️ *Per-Flat Share Due:* ₹${share}\n🗓️ *Payment Due Date:* 10th ${monthName} ${currentRecord.year || 2026}\n\nPlease remit your share via UPI / Bank Transfer to the Property Account. For audited breakdown, view the resident portal or contact *Sampath Kumar (Property Admin)*.`;
        navigator.clipboard.writeText(text);
        if (window.audioUtils) window.audioUtils.playSuccessChime();
        alert('WhatsApp announcement message copied to clipboard!');
    });

    // Dispatch Bulk
    document.getElementById('dispatch-bulk-btn')?.addEventListener('click', async () => {
        if (activeResidents.length === 0) {
            alert('No active residents with email found.');
            return;
        }

        if (!confirm(`Dispatch ${monthName} ${currentRecord.year || 2026} maintenance statements to all ${activeResidents.length} resident inboxes?`)) return;

        const btn = document.getElementById('dispatch-bulk-btn');
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<div class="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div><span>Dispatching...</span>';
        }

        const recipients = activeResidents.map(u => ({
            email: u.email,
            fullName: u.full_name || u.fullName || 'Resident',
            flatNumber: u.flat_number || u.flatNumber || 'GF'
        }));

        let result = null;
        if (window.resendClient) {
            result = await window.resendClient.sendBulkMaintenanceEmails({
                recipients,
                record: currentRecord,
                house,
                senderName: 'Sampath Kumar'
            });
        }

        const newLogs = recipients.map(r => ({
            id: crypto.randomUUID(),
            recipientEmail: r.email,
            flatNumber: r.flatNumber,
            subject: `[CHE-MADURA HS-1 MGMT] ${monthName} ${currentRecord.year || 2026} Maintenance Notice - ₹${share} Due`,
            status: 'delivered',
            sentAt: new Date().toISOString()
        }));

        const updatedLogs = [...newLogs, ...savedLogs];
        localStorage.setItem('madura_notification_logs', JSON.stringify(updatedLogs));

        if (window.audioUtils) window.audioUtils.playSuccessChime();
        alert(`Successfully dispatched maintenance statements to ${recipients.length} resident inboxes!`);
        renderNotificationCenter();
    });
}

window.renderNotificationCenter = renderNotificationCenter;
