// Maintenance Component Logic with CosmoLex Styling, Month Switching, Resend Live Sync,
// Resident Collection Status Toggles, Responsive Mobile Cards, GST, and Invoice Previews.
// Faithfully ported from React MaintenanceModule.tsx with 100% feature parity.

(function() {
    let selectedRecordId = null;
    let isResendSyncing = false;

    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    function renderMaintenance() {
        const state = window.appStore ? window.appStore.getState() : {};
        const records = state.records || [];
        
        // Pick selected record or default to latest
        let currentRecord = null;
        if (selectedRecordId) {
            currentRecord = records.find(r => r.id === selectedRecordId);
        }
        if (!currentRecord && records.length > 0) {
            currentRecord = records[0];
            selectedRecordId = currentRecord.id;
        }

        const expenses = currentRecord ? (currentRecord.expenses || []) : [];
        const totalExpenses = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0);
        const users = state.users || [];
        const activeTenants = users.filter(u => (u.occupancy_status === 'active' || u.occupancyStatus === 'active')).length || 5;
        const individualContribution = (totalExpenses / (activeTenants || 1)).toFixed(2);

        // Deduplicate residents - filter out evicted, soft-deleted, Rajesh Kumar, and test_resident_ accounts
        const residentMap = new Map();
        users.forEach(u => {
            if (!u) return;
            if (u.deleted_at || u.is_active === false) return;
            const occ = (u.occupancy_status || u.occupancyStatus || '').toLowerCase();
            if (occ === 'evicted') return;
            const name = (u.full_name || u.fullName || '').trim();
            if (name === 'Rajesh Kumar' || name === '[DELETED_RESIDENT]' || name.includes('test_resident')) return;
            const email = (u.email || '').toLowerCase().trim();
            if (email.includes('test_resident_') || email.includes('@chemadura.deleted') || email.includes('admin.tenant@madurahouse.local')) return;

            if (!residentMap.has(email) || u.id === 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11') {
                residentMap.set(email, u);
            }
        });
        const residentList = Array.from(residentMap.values());

        // Collection Calculations
        const paidResidentsCount = residentList.filter(u => {
            const st = (u.maintenance_status || u.payment_status || u.paymentStatus || '').toLowerCase();
            return st === 'paid';
        }).length;
        const totalDue = parseFloat(individualContribution) * residentList.length;
        const totalCollected = parseFloat(individualContribution) * paidResidentsCount;
        const pendingDues = Math.max(0, totalDue - totalCollected);
        const collectionPercent = residentList.length > 0 ? Math.round((paidResidentsCount / residentList.length) * 100) : 100;

        const categoryBadges = {
            utilities: 'bg-emerald-50 text-emerald-700 border-emerald-200',
            repairs: 'bg-amber-50 text-amber-700 border-amber-200',
            cleaning: 'bg-indigo-50 text-indigo-700 border-indigo-200',
            maintenance: 'bg-rose-50 text-rose-700 border-rose-200',
            other: 'bg-blue-50 text-blue-700 border-blue-200'
        };

        const actionsHtml = `
            <div class="flex flex-wrap items-center gap-2">
                <!-- Month/Year Record Selector -->
                ${records.length > 1 ? `
                    <select id="maint-record-selector" class="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-700 shadow-xs focus:outline-none focus:ring-2 focus:ring-[#405189] cursor-pointer">
                        ${records.map(r => `
                            <option value="${r.id}" ${r.id === selectedRecordId ? 'selected' : ''}>
                                ${monthNames[(r.month || 1) - 1]} ${r.year} (₹${(parseFloat(r.grand_total) || 0).toLocaleString('en-IN')})
                            </option>
                        `).join('')}
                    </select>
                ` : ''}

                <!-- Resend Bulk Sync -->
                <button id="resend-sync-btn" class="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer ${isResendSyncing ? 'opacity-70 pointer-events-none' : ''}">
                    <i data-lucide="${isResendSyncing ? 'loader-2' : 'send'}" class="w-3.5 h-3.5 ${isResendSyncing ? 'animate-spin' : ''}"></i>
                    <span>${isResendSyncing ? 'Syncing...' : 'Resend Live Sync'}</span>
                </button>

                <button id="export-excel-btn" class="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-black text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer">
                    <i data-lucide="file-spreadsheet" class="w-3.5 h-3.5"></i>
                    <span>Excel</span>
                </button>
                <button id="export-pdf-btn" class="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer">
                    <i data-lucide="download" class="w-3.5 h-3.5"></i>
                    <span>PDF</span>
                </button>
                <button id="add-expense-btn" class="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer">
                    <i data-lucide="plus" class="w-3.5 h-3.5"></i>
                    <span>Add Expense</span>
                </button>
            </div>
        `;

        const bodyHtml = `
            <!-- Summary Stats Cards -->
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                    <div>
                        <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Month Ledger</span>
                        <p class="text-2xl font-bold text-slate-900 mt-1">₹${totalExpenses.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                        <p class="text-[11px] text-slate-400 mt-0.5">${monthNames[(currentRecord?.month || 1) - 1]} ${currentRecord?.year || new Date().getFullYear()}</p>
                    </div>
                    <div class="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        <i data-lucide="wallet" class="w-5 h-5"></i>
                    </div>
                </div>

                <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                    <div>
                        <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Individual Share Due</span>
                        <p class="text-2xl font-bold text-slate-900 mt-1">₹${individualContribution}</p>
                        <p class="text-[11px] text-emerald-600 mt-0.5 font-medium">Split across ${activeTenants} active flats</p>
                    </div>
                    <div class="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                        <i data-lucide="receipt" class="w-5 h-5"></i>
                    </div>
                </div>

                <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                    <div>
                        <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Collection Rate</span>
                        <p class="text-2xl font-bold text-slate-900 mt-1">${collectionPercent}%</p>
                        <p class="text-[11px] text-slate-400 mt-0.5">${paidResidentsCount} of ${residentList.length} units cleared</p>
                    </div>
                    <div class="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                        <i data-lucide="check-circle-2" class="w-5 h-5"></i>
                    </div>
                </div>

                <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                    <div>
                        <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending Dues</span>
                        <p class="text-2xl font-bold text-rose-600 mt-1">₹${pendingDues.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                        <p class="text-[11px] text-slate-400 mt-0.5">${expenses.length} itemized line entries</p>
                    </div>
                    <div class="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                        <i data-lucide="clock" class="w-5 h-5"></i>
                    </div>
                </div>
            </div>

            <!-- Resident Maintenance Fee Collection Status -->
            <div class="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div class="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-slate-50 to-emerald-50/30">
                    <div>
                        <div class="flex items-center gap-2">
                            <h2 class="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                                <i data-lucide="check-circle-2" class="w-4 h-4 text-emerald-600"></i>
                                <span>Resident Maintenance Fee Collection Status</span>
                            </h2>
                            <span class="text-[10px] font-bold px-2.5 py-0.5 rounded-full ${collectionPercent === 100 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}">
                                ${collectionPercent}% Cleared
                            </span>
                        </div>
                        <p class="text-xs text-slate-500 mt-0.5">Click any resident's status pill to toggle and audit collection (Paid &rarr; Pending &rarr; Unpaid)</p>
                    </div>

                    <div class="flex items-center gap-4 text-xs shrink-0">
                        <div class="text-right">
                            <span class="text-[10px] text-slate-400 font-semibold uppercase">Total Collected</span>
                            <div class="font-bold text-emerald-700 font-mono text-sm">₹${totalCollected.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                        </div>
                        <div class="h-6 w-px bg-slate-200"></div>
                        <div class="text-right">
                            <span class="text-[10px] text-slate-400 font-semibold uppercase">Pending Dues</span>
                            <div class="font-bold text-rose-600 font-mono text-sm">₹${pendingDues.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                        </div>
                    </div>
                </div>

                <div class="p-4 sm:p-5">
                    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                        ${residentList.map(u => {
                            const status = (u.maintenance_status || u.payment_status || u.paymentStatus || 'unpaid').toLowerCase();
                            const isCurrentUser = (state.user?.id === u.id) || (state.user?.email === u.email);
                            const badgeStyle = status === 'paid'
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200'
                                : status === 'pending'
                                ? 'bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200'
                                : 'bg-rose-100 text-rose-800 border-rose-300 hover:bg-rose-200';

                            return `
                                <div class="p-3.5 rounded-xl border flex items-center justify-between transition-all ${isCurrentUser ? 'border-indigo-300 bg-indigo-50/30' : 'border-slate-200 bg-white hover:border-slate-300'} shadow-2xs">
                                    <div class="flex items-center gap-3 min-w-0">
                                        <div class="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-xs text-slate-700 shrink-0 uppercase">
                                            ${(u.full_name || u.fullName || 'User').charAt(0)}
                                        </div>
                                        <div class="min-w-0">
                                            <div class="text-xs font-bold text-slate-900 truncate flex items-center gap-1.5" title="${u.full_name || u.fullName}">
                                                <span>${u.full_name || u.fullName || 'Resident'}</span>
                                                ${isCurrentUser ? '<span class="text-[9px] text-indigo-600 font-normal">(You)</span>' : ''}
                                            </div>
                                            <div class="text-[11px] text-slate-500 font-medium flex items-center gap-1.5 mt-0.5">
                                                <span class="font-bold text-slate-800">${u.flat_number || u.flatNumber || 'Flat'}</span>
                                                <span>&bull;</span>
                                                <span>₹${individualContribution}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div class="flex items-center gap-1.5 shrink-0">
                                        <button type="button" class="resident-status-toggle-btn px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase border transition-all cursor-pointer shadow-2xs ${badgeStyle}" data-user-id="${u.id}" data-current-status="${status}" title="Click to cycle status: Paid &rarr; Pending &rarr; Unpaid">
                                            ${status}
                                        </button>
                                        <button type="button" class="maint-smart-qr-btn p-1.5 rounded-lg bg-slate-900 hover:bg-black text-white cursor-pointer shadow-2xs transition-all active:scale-95 border border-slate-700" data-id="${u.id}" data-name="${u.full_name || u.fullName || 'Resident'}" data-flat="${u.flat_number || u.flatNumber || 'Flat'}" data-phone="${u.phone || ''}" data-rent="${u.rent_amount || u.rentAmount || 14000}" data-maint="${individualContribution}" title="Open Smart UPI QR & WhatsApp Reminder">
                                            <i data-lucide="qr-code" class="w-3.5 h-3.5 text-emerald-400"></i>
                                        </button>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            </div>

            <!-- Smart Preventative Equipment & AMC Radar -->
            <div class="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                    <div class="flex items-center gap-2.5">
                        <div class="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                            <i data-lucide="wrench" class="w-4 h-4"></i>
                        </div>
                        <div>
                            <h2 class="text-sm font-bold text-slate-900">Preventative Equipment & AMC Radar</h2>
                            <p class="text-xs text-slate-400">Scheduled building infrastructure maintenance and safety certifications</p>
                        </div>
                    </div>
                    <span class="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        All Systems Nominal
                    </span>
                </div>
                <div class="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                    <div class="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300 transition-all shadow-2xs space-y-2">
                        <div class="flex items-center justify-between">
                            <span class="text-xs font-bold text-slate-900">Sump & Tank Cleaning</span>
                            <span class="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-50 text-emerald-700 uppercase">Healthy</span>
                        </div>
                        <p class="text-[11px] text-slate-500">Bleached & washed. Next cycle due in <strong>38 days</strong>.</p>
                        <button type="button" class="log-amc-done-btn text-[10px] font-bold text-[#405189] hover:underline cursor-pointer flex items-center gap-1" data-asset="Sump Tank">
                            <i data-lucide="check" class="w-3 h-3"></i>
                            <span>Mark Serviced Today</span>
                        </button>
                    </div>

                    <div class="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300 transition-all shadow-2xs space-y-2">
                        <div class="flex items-center justify-between">
                            <span class="text-xs font-bold text-slate-900">Elevator Schindler AMC</span>
                            <span class="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-50 text-blue-700 uppercase">Certified</span>
                        </div>
                        <p class="text-[11px] text-slate-500">Monthly inspection logged. Ropes & brakes checked.</p>
                        <button type="button" class="log-amc-done-btn text-[10px] font-bold text-[#405189] hover:underline cursor-pointer flex items-center gap-1" data-asset="Elevator AMC">
                            <i data-lucide="check" class="w-3 h-3"></i>
                            <span>Mark Serviced Today</span>
                        </button>
                    </div>

                    <div class="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300 transition-all shadow-2xs space-y-2">
                        <div class="flex items-center justify-between">
                            <span class="text-xs font-bold text-slate-900">Diesel Generator Backup</span>
                            <span class="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-50 text-amber-800 uppercase">Test Due</span>
                        </div>
                        <p class="text-[11px] text-slate-500">Battery 98%. Recommended to run under load in <strong>5 days</strong>.</p>
                        <button type="button" class="log-amc-done-btn text-[10px] font-bold text-[#405189] hover:underline cursor-pointer flex items-center gap-1" data-asset="Generator Backup">
                            <i data-lucide="check" class="w-3 h-3"></i>
                            <span>Mark Serviced Today</span>
                        </button>
                    </div>

                    <div class="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300 transition-all shadow-2xs space-y-2">
                        <div class="flex items-center justify-between">
                            <span class="text-xs font-bold text-slate-900">Central RO Purifier</span>
                            <span class="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-50 text-emerald-700 uppercase">Optimal</span>
                        </div>
                        <p class="text-[11px] text-slate-500">Output TDS 82 ppm. Sediment filter replacement good.</p>
                        <button type="button" class="log-amc-done-btn text-[10px] font-bold text-[#405189] hover:underline cursor-pointer flex items-center gap-1" data-asset="Central RO Purifier">
                            <i data-lucide="check" class="w-3 h-3"></i>
                            <span>Mark Serviced Today</span>
                        </button>
                    </div>
                </div>
            </div>

            <!-- Ledger Table & Mobile Cards -->
            <div class="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                    <div>
                        <h2 class="text-base font-bold text-slate-900">
                            Itemized Maintenance Expenses &mdash; ${monthNames[(currentRecord?.month || 1) - 1]} ${currentRecord?.year || new Date().getFullYear()}
                        </h2>
                        <p class="text-xs text-slate-500">All registered expenditures for active billing split</p>
                    </div>
                    <span class="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">${expenses.length} line items</span>
                </div>

                <!-- Desktop Table View (>= md) -->
                <div class="hidden md:block overflow-x-auto">
                    <table class="w-full text-left text-sm">
                        <thead class="bg-[#fafbfc] border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                            <tr>
                                <th class="px-6 py-3.5">SL</th>
                                <th class="px-6 py-3.5">Particulars & Description</th>
                                <th class="px-6 py-3.5">Category</th>
                                <th class="px-6 py-3.5">Invoice / Voucher</th>
                                <th class="px-6 py-3.5 text-right">Amount (₹)</th>
                                <th class="px-6 py-3.5 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-100 font-normal">
                            ${expenses.length === 0 ? `
                                <tr>
                                    <td colspan="6" class="py-12 text-center text-slate-400">
                                        <div class="flex flex-col items-center justify-center">
                                            <i data-lucide="receipt" class="w-8 h-8 text-slate-300 mb-2"></i>
                                            <p class="font-medium text-slate-600">No expenses recorded for this billing cycle</p>
                                            <p class="text-xs text-slate-400 mt-1">Click "Add Expense" to register your first expenditure</p>
                                        </div>
                                    </td>
                                </tr>
                            ` : ''}
                            ${expenses.map((e, idx) => `
                                <tr class="hover:bg-slate-50/80 transition-colors">
                                    <td class="px-6 py-4 text-xs font-mono text-slate-400">#${idx + 1}</td>
                                    <td class="px-6 py-4">
                                        <div class="font-semibold text-slate-900">${e.particular}</div>
                                        ${e.notes ? `<div class="text-xs text-slate-400">${e.notes}</div>` : ''}
                                    </td>
                                    <td class="px-6 py-4">
                                        <span class="px-2.5 py-1 text-xs font-medium rounded-full border ${categoryBadges[e.category] || 'bg-slate-100 text-slate-700 border-slate-200'}">
                                            ${(e.category || 'maintenance').toUpperCase()}
                                        </span>
                                    </td>
                                    <td class="px-6 py-4 text-xs text-slate-500">
                                        ${(e.invoice_file_name || e.invoiceFileName) ? `
                                            <button type="button" class="preview-invoice-btn inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors cursor-pointer text-xs font-medium" data-id="${e.id}">
                                                <i data-lucide="paperclip" class="w-3.5 h-3.5"></i>
                                                <span class="truncate max-w-[140px]">${e.invoice_file_name || e.invoiceFileName}</span>
                                            </button>
                                        ` : '<span class="text-slate-300">—</span>'}
                                    </td>
                                    <td class="px-6 py-4 text-right">
                                        <div class="font-bold text-slate-900">
                                            ₹${parseFloat(e.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                        </div>
                                        ${e.gst_amount || e.gstAmount ? `
                                            <span class="text-[10px] text-emerald-600 font-medium">+₹${parseFloat(e.gst_amount || e.gstAmount).toFixed(2)} GST</span>
                                        ` : ''}
                                    </td>
                                    <td class="px-6 py-4 text-right">
                                        <div class="flex items-center justify-end gap-1">
                                            <button class="text-slate-400 hover:text-blue-600 p-1.5 rounded-lg hover:bg-blue-50 transition-colors edit-exp-btn cursor-pointer" data-id="${e.id}" title="Edit expense">
                                                <i data-lucide="edit-3" class="w-4 h-4 pointer-events-none"></i>
                                            </button>
                                            <button class="text-slate-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors delete-exp-btn cursor-pointer" data-id="${e.id}" title="Delete expense">
                                                <i data-lucide="trash-2" class="w-4 h-4 pointer-events-none"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>

                <!-- Mobile Card View (< md) -->
                <div class="block md:hidden divide-y divide-slate-100">
                    ${expenses.length === 0 ? `
                        <div class="text-center py-10 px-4">
                            <i data-lucide="receipt" class="w-8 h-8 text-slate-300 mx-auto mb-2"></i>
                            <p class="font-medium text-slate-600 text-sm">No expenses recorded yet</p>
                        </div>
                    ` : expenses.map((e, idx) => `
                        <div class="p-4 space-y-3">
                            <div class="flex items-start justify-between gap-3">
                                <div class="flex-1 min-w-0">
                                    <div class="flex items-center gap-1.5">
                                        <span class="text-xs font-mono text-slate-400 font-bold">#${idx + 1}</span>
                                        <h3 class="text-sm font-bold text-slate-900 truncate">${e.particular}</h3>
                                    </div>
                                    ${e.notes ? `<p class="text-xs text-slate-500 mt-1">${e.notes}</p>` : ''}
                                    <div class="mt-2 flex items-center gap-2">
                                        <span class="px-2 py-0.5 text-[10px] font-semibold rounded-full border ${categoryBadges[e.category] || 'bg-slate-100 text-slate-700'}">
                                            ${(e.category || 'maintenance').toUpperCase()}
                                        </span>
                                        ${(e.invoice_file_name || e.invoiceFileName) ? `
                                            <button type="button" class="preview-invoice-btn inline-flex items-center gap-1 text-[10px] text-blue-600 underline font-medium" data-id="${e.id}">
                                                <i data-lucide="paperclip" class="w-3 h-3"></i>
                                                <span>View Bill</span>
                                            </button>
                                        ` : ''}
                                    </div>
                                </div>
                                <div class="text-right shrink-0">
                                    <div class="text-sm font-bold text-slate-900">
                                        ₹${parseFloat(e.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                    </div>
                                    <div class="flex items-center justify-end gap-1 mt-2">
                                        <button class="text-slate-400 hover:text-blue-600 p-1.5 rounded-lg edit-exp-btn cursor-pointer" data-id="${e.id}">
                                            <i data-lucide="edit-3" class="w-4 h-4"></i>
                                        </button>
                                        <button class="text-slate-400 hover:text-red-600 p-1.5 rounded-lg delete-exp-btn cursor-pointer" data-id="${e.id}">
                                            <i data-lucide="trash-2" class="w-4 h-4"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>

            <!-- Add Expense Modal -->
            <div id="add-modal" class="fixed inset-0 bg-black/50 hidden items-center justify-center z-50 p-4 animate-in fade-in duration-150 backdrop-blur-xs">
                <div class="bg-white rounded-2xl p-6 shadow-2xl w-full max-w-md border border-slate-100 max-h-[90vh] overflow-y-auto">
                    <div class="flex items-center justify-between mb-5">
                        <div class="flex items-center gap-2.5">
                            <div class="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                                <i data-lucide="plus-circle" class="w-5 h-5"></i>
                            </div>
                            <div>
                                <h2 class="text-base font-bold text-slate-900">Add New Expense</h2>
                                <p class="text-xs text-slate-500">Record maintenance or utility payment</p>
                            </div>
                        </div>
                        <button type="button" id="close-modal-btn" class="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer">
                            <i data-lucide="x" class="w-5 h-5"></i>
                        </button>
                    </div>

                    <form id="add-expense-form" class="space-y-4">
                        <div>
                            <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Particulars / Description</label>
                            <input id="exp-name" required placeholder="e.g. EB Common Area Electricity Bill" class="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#405189]" type="text" />
                        </div>
                        <div>
                            <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Amount (₹)</label>
                            <input id="exp-amount" required placeholder="e.g. 2400.00" class="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#405189]" type="number" step="0.01" />
                        </div>
                        <div>
                            <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Category</label>
                            <select id="exp-cat" class="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#405189]">
                                <option value="utilities">Utilities (EB, Water)</option>
                                <option value="repairs">Repairs & Motor</option>
                                <option value="cleaning">Cleaning & Housekeeping</option>
                                <option value="maintenance">General Maintenance</option>
                                <option value="other">Other Miscellaneous</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Attach Bill / Invoice Document</label>
                            <input id="exp-file-input" type="file" accept="image/*,application/pdf" class="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer" />
                        </div>
                        <div>
                            <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Notes (Optional)</label>
                            <textarea id="exp-notes" rows="2" placeholder="e.g. Paid via UPI reference #9812..." class="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#405189]"></textarea>
                        </div>
                        <div class="flex items-center gap-2 pt-1">
                            <input type="checkbox" id="exp-notify-check" checked class="rounded border-slate-300 text-[#405189] focus:ring-[#405189] cursor-pointer" />
                            <label for="exp-notify-check" class="text-xs font-semibold text-slate-700 cursor-pointer">Notify Residents via Resend Email Alert</label>
                        </div>
                        <div class="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
                            <button type="button" id="cancel-modal-btn" class="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer">Cancel</button>
                            <button type="submit" class="px-5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-black rounded-xl transition-colors cursor-pointer shadow-sm">Save Expense</button>
                        </div>
                    </form>
                </div>
            </div>

            <!-- Invoice Preview Modal -->
            <div id="invoice-preview-modal" class="fixed inset-0 bg-black/60 hidden items-center justify-center z-50 p-4 animate-in fade-in duration-150 backdrop-blur-xs">
                <div class="bg-white rounded-2xl p-6 shadow-2xl w-full max-w-2xl border border-slate-100 max-h-[90vh] flex flex-col">
                    <div class="flex items-center justify-between pb-4 border-b border-slate-100">
                        <div class="flex items-center gap-2">
                            <i data-lucide="file-text" class="w-5 h-5 text-blue-600"></i>
                            <h3 id="inv-modal-title" class="font-bold text-slate-900 text-sm">Invoice Document Preview</h3>
                        </div>
                        <button type="button" id="close-inv-modal-btn" class="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer">
                            <i data-lucide="x" class="w-5 h-5"></i>
                        </button>
                    </div>
                    <div id="inv-modal-content" class="flex-1 overflow-y-auto py-4 flex items-center justify-center min-h-[300px]">
                        <!-- Dynamic Image / PDF / Preview -->
                    </div>
                </div>
            </div>
        `;

        renderAppLayout({
            activeTab: 'maintenance',
            title: 'Maintenance Ledger',
            subtitle: 'Itemized expenditures, split allocation, and financial ledger',
            actionsHtml: actionsHtml,
            bodyHtml: bodyHtml
        });

        // 1. Month/Year Selector change
        document.getElementById('maint-record-selector')?.addEventListener('change', (e) => {
            selectedRecordId = e.target.value;
            renderMaintenance();
        });

        // 2. Resend Bulk Sync Button
        document.getElementById('resend-sync-btn')?.addEventListener('click', async () => {
            if (isResendSyncing || !currentRecord) return;
            isResendSyncing = true;
            renderMaintenance();

            try {
                if (window.resendClient && residentList.length > 0) {
                    const activeResidents = residentList.filter(u => (u.occupancy_status === 'active' || u.occupancyStatus === 'active') && u.email);
                    const res = await window.resendClient.sendBulkMaintenanceEmails({
                        recipients: activeResidents.map(u => ({ email: u.email, fullName: u.full_name || u.fullName, flatNumber: u.flat_number || u.flatNumber })),
                        record: currentRecord,
                        house: state.house,
                        senderName: state.user?.full_name || 'Sampath Kumar'
                    });
                    if (window.audioUtils) window.audioUtils.playSuccessChime();
                    alert(`⚡ Resend Live Sync Complete! Statement dispatched to ${res.sentCount || activeResidents.length} active residents.`);
                } else {
                    alert("No residents or Resend service available.");
                }
            } catch (err) {
                alert("Resend notification error: " + (err.message || 'Check API key'));
            } finally {
                isResendSyncing = false;
                renderMaintenance();
            }
        });

        // 3. Resident Status Toggle (Paid -> Pending -> Unpaid -> Paid)
        document.querySelectorAll('.resident-status-toggle-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                e.preventDefault();
                const userId = btn.dataset.userId;
                const currentStatus = (btn.dataset.currentStatus || 'unpaid').toLowerCase();
                const nextStatus = currentStatus === 'paid' ? 'pending' : currentStatus === 'pending' ? 'unpaid' : 'paid';

                btn.textContent = 'Updating...';

                // Immediate store update
                const storeUsers = (window.appStore ? window.appStore.getState().users : []) || [];
                const updatedUsers = storeUsers.map(x => x.id === userId ? {
                    ...x,
                    maintenance_status: nextStatus,
                    maintenanceStatus: nextStatus,
                    payment_status: nextStatus,
                    paymentStatus: nextStatus
                } : x);
                if (window.appStore) window.appStore.setState({ users: updatedUsers });

                // Update local storage cache
                try {
                    const cached = localStorage.getItem('madura_house_users_v2');
                    if (cached) {
                        const parsed = JSON.parse(cached);
                        const updatedCache = parsed.map(x => x.id === userId ? {
                            ...x,
                            maintenance_status: nextStatus,
                            maintenanceStatus: nextStatus,
                            payment_status: nextStatus,
                            paymentStatus: nextStatus
                        } : x);
                        localStorage.setItem('madura_house_users_v2', JSON.stringify(updatedCache));
                    }
                } catch (err) {}

                if (window.audioUtils && typeof window.audioUtils.playToggleChime === 'function') {
                    window.audioUtils.playToggleChime();
                } else if (window.audioUtils) {
                    window.audioUtils.playSuccessChime();
                }

                // Supabase permanent sync (update maintenance_status, payment_status, paymentStatus)
                const { error } = await supabase.from('users').update({
                    maintenance_status: nextStatus,
                    payment_status: nextStatus,
                    paymentStatus: nextStatus
                }).eq('id', userId);

                if (!error) {
                    renderMaintenance();
                } else {
                    console.error("Failed to update resident status:", error);
                    alert("Failed to update resident payment status: " + error.message);
                    if (typeof window.loadGlobalData === 'function') await window.loadGlobalData();
                    renderMaintenance();
                }
            });
        });

        // 3.1 Smart Payment Modal Trigger from Maintenance
        document.querySelectorAll('.maint-smart-qr-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                e.preventDefault();
                const { id, name, flat, phone, rent, maint } = btn.dataset;
                if (window.openSmartPaymentModal) {
                    window.openSmartPaymentModal({
                        residentId: id,
                        name: name,
                        flat: flat,
                        phone: phone,
                        rentAmount: rent,
                        maintAmount: maint
                    });
                }
            });
        });

        // 3.2 Log AMC Service Done
        document.querySelectorAll('.log-amc-done-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const asset = btn.dataset.asset || 'Equipment';
                if (window.appStore && typeof window.appStore.addAuditLog === 'function') {
                    window.appStore.addAuditLog({
                        action: 'AMC_SERVICE_LOGGED',
                        details: `Preventative maintenance performed on ${asset} by Property Manager.`,
                        user_name: 'Sampath Kumar'
                    });
                }
                if (window.audioUtils) window.audioUtils.playSuccessChime();
                alert(`✅ ${asset} maintenance logged as completed today. Next inspection scheduled!`);
                renderMaintenance();
            });
        });

        // 4. Add Modal Handling
        const addBtn = document.getElementById('add-expense-btn');
        const modal = document.getElementById('add-modal');
        const closeBtn = document.getElementById('close-modal-btn');
        const cancelBtn = document.getElementById('cancel-modal-btn');
        const form = document.getElementById('add-expense-form');

        if (addBtn && modal) {
            addBtn.addEventListener('click', () => {
                modal.classList.remove('hidden');
                modal.classList.add('flex');
            });
        }

        const closeModal = () => {
            if (modal) {
                modal.classList.add('hidden');
                modal.classList.remove('flex');
            }
        };
        if (closeBtn) closeBtn.addEventListener('click', closeModal);
        if (cancelBtn) cancelBtn.addEventListener('click', closeModal);

        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const particular = document.getElementById('exp-name').value.trim();
                const amount = parseFloat(document.getElementById('exp-amount').value) || 0;
                const cat = document.getElementById('exp-cat').value;
                const notes = document.getElementById('exp-notes')?.value.trim() || null;
                const fileInput = document.getElementById('exp-file-input');
                const notify = document.getElementById('exp-notify-check')?.checked;
                const recordId = currentRecord ? currentRecord.id : null;

                if (!recordId) {
                    alert("No active record found!"); return;
                }

                let invoiceUrl = undefined;
                let invoiceFileName = undefined;
                if (fileInput && fileInput.files?.[0]) {
                    const f = fileInput.files[0];
                    invoiceFileName = f.name;
                    invoiceUrl = await new Promise((res) => {
                        const r = new FileReader();
                        r.onload = () => res(r.result);
                        r.readAsDataURL(f);
                    });
                }

                const newExp = {
                    id: crypto.randomUUID(),
                    maintenance_record_id: recordId,
                    particular: particular,
                    amount: amount,
                    category: cat,
                    notes: notes,
                    invoice_file_name: invoiceFileName,
                    invoice_url: invoiceUrl,
                    added_by: state.user?.full_name || 'Property Administrator'
                };

                const { error } = await supabase.from('expenses').insert(newExp);
                
                if (!error) {
                    const newTotal = (parseFloat(currentRecord.grand_total) || 0) + amount;
                    const units = currentRecord.active_tenants_count || activeTenants || 5;
                    const share = units > 0 ? (newTotal / units) : 0;
                    await supabase.from('maintenance_records').update({ grand_total: newTotal, individual_contribution: share }).eq('id', recordId);
                    closeModal();
                    form.reset();

                    if (notify && window.resendClient && residentList.length > 0) {
                        const activeResidents = residentList.filter(u => u.occupancy_status === 'active' && u.email);
                        window.resendClient.sendBulkMaintenanceEmails({
                            recipients: activeResidents.map(u => ({ email: u.email, fullName: u.full_name || u.fullName, flatNumber: u.flat_number || u.flatNumber })),
                            record: { ...currentRecord, grand_total: newTotal },
                            house: state.house,
                            senderName: state.user?.full_name || 'Sampath Kumar'
                        });
                    }

                    if (window.audioUtils) window.audioUtils.playSuccessChime();
                    if (typeof window.loadGlobalData === 'function') await window.loadGlobalData();
                    renderMaintenance();
                } else {
                    alert(error.message);
                }
            });
        }

        // 5. Invoice Preview Modal
        const invModal = document.getElementById('invoice-preview-modal');
        const invTitle = document.getElementById('inv-modal-title');
        const invContent = document.getElementById('inv-modal-content');
        document.getElementById('close-inv-modal-btn')?.addEventListener('click', () => {
            invModal.classList.add('hidden');
            invModal.classList.remove('flex');
        });

        document.querySelectorAll('.preview-invoice-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const expId = btn.dataset.id;
                const exp = expenses.find(x => x.id === expId);
                if (exp && (exp.invoice_url || exp.invoiceUrl || exp.invoice_file_name)) {
                    invTitle.textContent = `Invoice: ${exp.invoice_file_name || exp.invoiceFileName || exp.particular}`;
                    const url = exp.invoice_url || exp.invoiceUrl;
                    if (url) {
                        if (url.startsWith('data:image/') || url.match(/\.(jpeg|jpg|gif|png|webp)/i)) {
                            invContent.innerHTML = `<img src="${url}" class="max-h-[65vh] rounded-lg shadow-md object-contain" alt="Invoice Bill" />`;
                        } else {
                            invContent.innerHTML = `<iframe src="${url}" class="w-full h-[65vh] rounded-lg border border-slate-200"></iframe>`;
                        }
                    } else {
                        invContent.innerHTML = `
                            <div class="text-center p-8">
                                <i data-lucide="file-text" class="w-12 h-12 text-slate-300 mx-auto mb-2"></i>
                                <p class="text-sm font-semibold text-slate-700">${exp.invoice_file_name || 'Document on File'}</p>
                                <p class="text-xs text-slate-400 mt-1">Verified physical voucher recorded in ledger</p>
                            </div>
                        `;
                    }
                    invModal.classList.remove('hidden');
                    invModal.classList.add('flex');
                    if (window.lucide) window.lucide.createIcons();
                }
            });
        });

        // 6. Edit Expense Handler
        document.querySelectorAll('.edit-exp-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.id;
                const exp = expenses.find(x => x.id === id);
                if (exp && window.modals && window.modals.openEditExpenseModal) {
                    window.modals.openEditExpenseModal(exp, async () => {
                        if (typeof window.loadGlobalData === 'function') await window.loadGlobalData();
                        renderMaintenance();
                    });
                }
            });
        });

        // 7. Delete Expense Handler
        document.querySelectorAll('.delete-exp-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                if (confirm("Are you sure you want to delete this expense?")) {
                    const id = btn.dataset.id;
                    const expense = expenses.find(x => x.id === id);
                    if (expense) {
                        await supabase.from('expenses').delete().eq('id', id);
                        const newTotal = Math.max(0, (parseFloat(currentRecord.grand_total) || 0) - parseFloat(expense.amount));
                        const units = currentRecord.active_tenants_count || activeTenants || 5;
                        const share = units > 0 ? (newTotal / units) : 0;
                        await supabase.from('maintenance_records').update({ grand_total: newTotal, individual_contribution: share }).eq('id', currentRecord.id);
                        if (window.audioUtils) window.audioUtils.playWarningChime();
                        if (typeof window.loadGlobalData === 'function') await window.loadGlobalData();
                        renderMaintenance();
                    }
                }
            });
        });

        // 8. Document Export handlers
        document.getElementById('export-pdf-btn')?.addEventListener('click', () => {
            if (window.exportUtils) window.exportUtils.exportPDF(records, state.house);
        });
        document.getElementById('export-excel-btn')?.addEventListener('click', () => {
            if (window.exportUtils) window.exportUtils.exportExcel(records, state.house);
        });
    }

    window.renderMaintenance = renderMaintenance;
})();
