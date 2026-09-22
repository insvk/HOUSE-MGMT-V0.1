// Exact faithful Vanilla JS reproduction of React Dashboard.tsx & App.tsx layout
// CosmoLex Light Enterprise Styling (bg-[#fbfbfe], slate-200 borders, inter typography)

(function() {
    let activeDashboardTab = 'property'; // 'property' | 'personal' | 'activities'

    function renderDashboard() {
        const state = window.appStore ? window.appStore.getState() : {};
        const user = state.user || { full_name: 'Sampath Kumar', email: 'sampathkumar@chemadura.com', role: 'OWNER', flat_number: 'Owner Suite' };
        const users = state.users || [];
        const records = state.records || [];
        const currentRecord = records.length > 0 ? records[0] : null;
        const expenses = currentRecord ? (currentRecord.expenses || []) : [];

        const totalExpenses = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0);
        const activeTenants = users.filter(u => (u.occupancy_status === 'active' || u.occupancyStatus === 'active')).length || 5;
        const individualContribution = (totalExpenses / (activeTenants || 1)).toFixed(2);
        const paidTenantsCount = users.filter(u => {
            const st = (u.maintenance_status || u.payment_status || u.paymentStatus || '').toLowerCase();
            return st === 'paid';
        }).length;
        const totalCollections = (paidTenantsCount * parseFloat(individualContribution)).toFixed(2);
        const unpaidBalance = Math.max(0, totalExpenses - parseFloat(totalCollections)).toFixed(2);

        const isGodMode = user.email.toLowerCase() === 'sampathkumar@chemadura.com' || user.role === 'OWNER';
        const greeting = new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 18 ? 'Good afternoon' : 'Good evening';
        const firstName = (user.full_name || user.fullName || 'User').split(' ')[0];

        const myMaintStatus = (user.maintenance_status || user.payment_status || user.paymentStatus || 'paid').toLowerCase();

        const actionsHtml = `
            <button id="dash-export-pdf-btn" class="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer">
                <i data-lucide="download" class="w-3.5 h-3.5"></i>
                <span>PDF Report</span>
            </button>
            <button id="dash-export-excel-btn" class="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-black text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer">
                <i data-lucide="file-spreadsheet" class="w-3.5 h-3.5"></i>
                <span>Excel</span>
            </button>
        `;

        const bodyHtml = `
            <!-- Greeting & Sub-tabs (CosmoLex Style) -->
            <div class="flex flex-col mb-2">
                <h1 class="text-2xl font-bold text-slate-900 tracking-tight">
                    ${greeting}, ${firstName}!
                </h1>
                
                <div class="flex items-center gap-6 mt-4 border-b border-slate-200">
                    <button type="button" class="dash-tab-btn pb-3 text-sm transition-colors cursor-pointer ${activeDashboardTab === 'property' ? 'font-semibold text-slate-900 border-b-2 border-slate-900' : 'font-medium text-slate-500 hover:text-slate-700'}" data-dash-tab="property">
                        Property dashboard
                    </button>
                    <button type="button" class="dash-tab-btn pb-3 text-sm transition-colors cursor-pointer ${activeDashboardTab === 'personal' ? 'font-semibold text-slate-900 border-b-2 border-slate-900' : 'font-medium text-slate-500 hover:text-slate-700'}" data-dash-tab="personal">
                        Personal dashboard
                    </button>
                    <button type="button" class="dash-tab-btn pb-3 text-sm transition-colors cursor-pointer ${activeDashboardTab === 'activities' ? 'font-semibold text-slate-900 border-b-2 border-slate-900' : 'font-medium text-slate-500 hover:text-slate-700'}" data-dash-tab="activities">
                        Recent activities
                    </button>
                </div>
            </div>

            <!-- God Maxx Banner -->
            ${isGodMode ? `
            <div class="bg-slate-900 rounded-2xl p-4 text-white flex items-center justify-between shadow-xs">
                <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center shrink-0">
                        <i data-lucide="sparkles" class="w-4 h-4 text-amber-950"></i>
                    </div>
                    <div>
                        <div class="text-xs font-bold text-amber-300 uppercase tracking-wider">GOD MODE &bull; GOD MAXX ACCESS ACTIVE</div>
                        <p class="text-xs text-slate-400">Direct superadmin master editor enabled for property configurations and raw tables.</p>
                    </div>
                </div>
                <button type="button" id="dash-open-master-btn" class="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors cursor-pointer">
                    Open Master Editor
                </button>
            </div>
            ` : ''}

            ${activeDashboardTab === 'property' ? `
                <!-- Smart AI Copilot Insights Banner -->
                <div class="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 border border-indigo-900/40">
                    <div class="flex items-center gap-3.5">
                        <div class="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-400 via-purple-500 to-indigo-400 flex items-center justify-center text-white shrink-0 shadow-md">
                            <i data-lucide="sparkles" class="w-5 h-5 text-amber-300 animate-pulse"></i>
                        </div>
                        <div>
                            <div class="flex items-center gap-2">
                                <span class="text-xs font-bold uppercase tracking-wider text-amber-300">AI Financial & Operations Copilot</span>
                                <span class="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[9px] font-bold border border-emerald-500/30">ACTIVE RADAR</span>
                            </div>
                            <p class="text-xs text-slate-300 mt-0.5">
                                ${paidTenantsCount} of ${activeTenants} units cleared. ₹${unpaidBalance} pending collection. Projected next month spend: ₹${(parseFloat(totalExpenses) * 1.04).toFixed(0)}. Sump cleaning due in 38 days.
                            </p>
                        </div>
                    </div>
                    <div class="flex items-center gap-2 shrink-0">
                        <button type="button" id="dash-open-copilot-btn" class="px-3.5 py-1.5 rounded-xl bg-white text-slate-900 hover:bg-slate-100 text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95">
                            <i data-lucide="bot" class="w-3.5 h-3.5 text-indigo-600"></i>
                            <span>Ask AI Copilot</span>
                        </button>
                        <button type="button" id="dash-wa-blast-btn" class="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95">
                            <i data-lucide="message-square" class="w-3.5 h-3.5"></i>
                            <span>WhatsApp Reminders</span>
                        </button>
                    </div>
                </div>

                <!-- 4 Top KPI Cards (CosmoLex Style) -->
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    <!-- KPI 1: Total Expenses -->
                    <div class="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
                        <div class="flex items-center justify-between mb-2">
                            <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Monthly</span>
                            <div class="p-2 bg-blue-50 text-blue-600 rounded-xl">
                                <i data-lucide="wallet" class="w-4 h-4"></i>
                            </div>
                        </div>
                        <div>
                            <span class="text-2xl font-bold text-slate-900 tracking-tight">₹${parseFloat(totalExpenses).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                            <div class="flex items-center gap-1.5 mt-2 text-xs font-medium text-emerald-600">
                                <i data-lucide="trending-up" class="w-3.5 h-3.5"></i>
                                <span>Active Billing Split</span>
                            </div>
                        </div>
                    </div>

                    <!-- KPI 2: Total Collected -->
                    <div class="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
                        <div class="flex items-center justify-between mb-2">
                            <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Collected</span>
                            <div class="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                                <i data-lucide="shield-check" class="w-4 h-4"></i>
                            </div>
                        </div>
                        <div>
                            <span class="text-2xl font-bold text-slate-900 tracking-tight">₹${parseFloat(totalCollections).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                            <div class="flex items-center gap-1.5 mt-2 text-xs font-medium text-emerald-600">
                                <i data-lucide="arrow-up-right" class="w-3.5 h-3.5"></i>
                                <span>${paidTenantsCount} Units Paid</span>
                            </div>
                        </div>
                    </div>

                    <!-- KPI 3: Unpaid Balance -->
                    <div class="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
                        <div class="flex items-center justify-between mb-2">
                            <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Unpaid Balance</span>
                            <div class="p-2 bg-amber-50 text-amber-600 rounded-xl">
                                <i data-lucide="alert-circle" class="w-4 h-4"></i>
                            </div>
                        </div>
                        <div>
                            <span class="text-2xl font-bold text-slate-900 tracking-tight">₹${parseFloat(unpaidBalance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                            <div class="flex items-center gap-1.5 mt-2 text-xs font-medium text-amber-600">
                                <i data-lucide="clock" class="w-3.5 h-3.5"></i>
                                <span>${activeTenants - paidTenantsCount} Units Pending</span>
                            </div>
                        </div>
                    </div>

                    <!-- KPI 4: Per Flat Share -->
                    <div class="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
                        <div class="flex items-center justify-between mb-2">
                            <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Per Flat Share</span>
                            <div class="p-2 bg-purple-50 text-purple-600 rounded-xl">
                                <i data-lucide="users" class="w-4 h-4"></i>
                            </div>
                        </div>
                        <div>
                            <span class="text-2xl font-bold text-slate-900 tracking-tight">₹${parseFloat(individualContribution).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                            <div class="flex items-center gap-1.5 mt-2 text-xs font-medium text-purple-600">
                                <i data-lucide="home" class="w-3.5 h-3.5"></i>
                                <span>${activeTenants} Flats Active</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Active Expenses Table -->
                <div class="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                    <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                        <div>
                            <h2 class="text-base font-bold text-slate-900">Current Cycle Line Items</h2>
                            <p class="text-xs text-slate-500">Itemized maintenance ledger breakdown</p>
                        </div>
                        <a href="#/maintenance" class="text-xs font-semibold text-blue-600 hover:text-blue-700">View Full Ledger →</a>
                    </div>

                    <div class="overflow-x-auto">
                        <table class="w-full text-left text-sm">
                            <thead class="bg-[#fafbfc] border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                <tr>
                                    <th class="px-6 py-3.5">Line Item</th>
                                    <th class="px-6 py-3.5">Category</th>
                                    <th class="px-6 py-3.5">Amount</th>
                                    <th class="px-6 py-3.5 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-slate-100 font-normal">
                                ${expenses.length === 0 ? `
                                    <tr><td colspan="4" class="py-10 text-center text-slate-400 text-xs">No expenses entered for this billing period</td></tr>
                                ` : expenses.slice(0, 5).map(e => `
                                    <tr class="hover:bg-slate-50/80 transition-colors">
                                        <td class="px-6 py-4 font-semibold text-slate-900">${e.particular}</td>
                                        <td class="px-6 py-4">
                                            <span class="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                                                ${(e.category || 'maintenance').toUpperCase()}
                                            </span>
                                        </td>
                                        <td class="px-6 py-4 font-bold text-slate-900">₹${parseFloat(e.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                        <td class="px-6 py-4 text-right">
                                            <button class="dash-edit-exp-btn text-slate-400 hover:text-blue-600 p-1.5 cursor-pointer" data-id="${e.id}" title="Edit line item">
                                                <i data-lucide="edit-3" class="w-4 h-4 pointer-events-none"></i>
                                            </button>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            ` : activeDashboardTab === 'personal' ? `
                <div class="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
                    <h2 class="text-base font-bold text-slate-900">Your Resident Statement (${user.flat_number || 'Unit'})</h2>
                    <div class="grid grid-cols-2 gap-4 text-sm">
                        <div class="p-4 rounded-xl bg-slate-50 border border-slate-100">
                            <span class="text-xs text-slate-500 font-semibold">Monthly Maintenance Share Due</span>
                            <p class="text-2xl font-bold text-slate-900 mt-1">₹${individualContribution}</p>
                        </div>
                        <div class="p-4 rounded-xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
                            <div>
                                <span class="text-xs text-slate-500 font-semibold">Payment Status</span>
                                <p class="text-2xl font-bold mt-1 ${myMaintStatus === 'paid' ? 'text-emerald-600' : myMaintStatus === 'pending' ? 'text-amber-600' : 'text-rose-600'}">${myMaintStatus.toUpperCase()}</p>
                            </div>
                            ${myMaintStatus !== 'paid' ? `
                                <button type="button" id="dash-personal-upi-btn" class="mt-3 px-3 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer active:scale-95 transition-all">
                                    <i data-lucide="qr-code" class="w-3.5 h-3.5 text-emerald-400"></i>
                                    <span>Pay Now via Dynamic UPI QR</span>
                                </button>
                            ` : `
                                <div class="mt-3 flex items-center gap-1.5 text-xs text-emerald-600 font-semibold">
                                    <i data-lucide="check-circle" class="w-4 h-4"></i>
                                    <span>Account is in good standing</span>
                                </div>
                            `}
                        </div>
                    </div>
                </div>
            ` : `
                <div class="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
                    <h2 class="text-base font-bold text-slate-900">Recent Platform Activities</h2>
                    <p class="text-xs text-slate-500">Live system audit events and transactions</p>
                    <a href="#/audit" class="inline-block px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold">Open Full Audit Trail →</a>
                </div>
            `}
        `;

        renderAppLayout({
            activeTab: 'dashboard',
            title: 'Dashboard Overview',
            subtitle: 'Property Maintenance & Equal Split Allocation Portal',
            actionsHtml,
            bodyHtml
        });

        // Tab events
        document.querySelectorAll('.dash-tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                activeDashboardTab = btn.dataset.dashTab;
                renderDashboard();
            });
        });

        // Open Master Editor
        document.getElementById('dash-open-master-btn')?.addEventListener('click', () => {
            if (window.openGodModeModal) window.openGodModeModal('property');
        });

        // Edit Expense handler
        document.querySelectorAll('.dash-edit-exp-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.id;
                const exp = expenses.find(x => x.id === id);
                if (exp && window.modals && window.modals.openEditExpenseModal) {
                    window.modals.openEditExpenseModal(exp, async () => {
                        if (typeof window.loadGlobalData === 'function') await window.loadGlobalData();
                        renderDashboard();
                    });
                }
            });
        });

        // Exports
        document.getElementById('dash-export-pdf-btn')?.addEventListener('click', () => {
            if (window.exportUtils) window.exportUtils.exportPDF(records, state.house);
        });
        document.getElementById('dash-export-excel-btn')?.addEventListener('click', () => {
            if (window.exportUtils) window.exportUtils.exportExcel(records, state.house);
        });

        // AI Copilot triggers
        document.getElementById('dash-open-copilot-btn')?.addEventListener('click', () => {
            if (window.smartCopilot) window.smartCopilot.open();
        });
        document.getElementById('dash-wa-blast-btn')?.addEventListener('click', () => {
            if (window.smartCopilot) window.smartCopilot.open('unpaid');
        });

        // Personal UPI QR Trigger
        document.getElementById('dash-personal-upi-btn')?.addEventListener('click', () => {
            if (window.openSmartPaymentModal) {
                window.openSmartPaymentModal({
                    residentId: user.id,
                    name: user.full_name || user.fullName,
                    flat: user.flat_number || user.flatNumber || 'Flat',
                    phone: user.phone || '',
                    rentAmount: user.rent_amount || user.rentAmount || 14000,
                    maintAmount: individualContribution
                });
            }
        });
    }

    window.renderDashboard = renderDashboard;
})();
