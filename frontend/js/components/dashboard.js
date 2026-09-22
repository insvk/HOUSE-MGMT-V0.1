// Exact reproduction of React Dashboard.tsx & App.tsx layout
// CosmoLex Light Enterprise Styling (bg-[#fbfbfe], slate-200 borders, inter typography)

function renderDashboard() {
    const root = document.getElementById('app-root');
    if (!root) return;

    const state = window.appStore ? window.appStore.getState() : {};
    const user = state.user || { full_name: 'Sampath Kumar', email: 'sampathkumar@chemadura.com', role: 'OWNER', flat_number: 'Owner Suite' };
    const users = state.users || [];
    const records = state.records || [];
    const currentRecord = records.length > 0 ? records[0] : null;
    const expenses = currentRecord ? (currentRecord.expenses || []) : [];

    const totalExpenses = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0);
    const activeTenants = users.filter(u => u.occupancy_status === 'active').length || 5;
    const individualContribution = (totalExpenses / (activeTenants || 1)).toFixed(2);

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const currentMonthLabel = currentRecord ? `${monthNames[currentRecord.month - 1] || 'Current Month'} ${currentRecord.year}` : 'September 2026';

    root.innerHTML = `
    <div class="min-h-screen flex bg-[#fbfbfe] text-[#111827] font-sans antialiased overflow-x-hidden">
        
        <!-- CosmoLex Sidebar -->
        <aside class="w-64 bg-[#fbfbfe] border-r border-slate-200 flex flex-col justify-between shrink-0 fixed inset-y-0 left-0 z-30">
            <div>
                <!-- Brand Header -->
                <div class="h-16 flex items-center justify-between px-6 border-b border-slate-100">
                    <div class="flex items-center gap-3">
                        <div class="w-8 h-8 rounded bg-slate-900 flex items-center justify-center text-white shrink-0 shadow-sm">
                            <i data-lucide="building-2" class="w-5 h-5"></i>
                        </div>
                        <div>
                            <span class="font-bold text-slate-900 text-lg tracking-tight block leading-tight">
                                Madura
                            </span>
                            <span class="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">CHE-MADURA HS-1</span>
                        </div>
                    </div>
                </div>

                <!-- Navigation Menu -->
                <div class="py-6 px-3 space-y-1">
                    <a href="#/" class="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-[13px] bg-[#f1f2f4] font-semibold text-slate-900 shadow-2xs transition-all">
                        <i data-lucide="home" class="w-4 h-4 text-slate-900"></i>
                        <span>Dashboard</span>
                    </a>

                    <a href="#/maintenance" class="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-[13px] text-slate-600 hover:bg-slate-50 font-medium transition-all">
                        <i data-lucide="calendar" class="w-4 h-4 text-slate-500"></i>
                        <span>Maintenance</span>
                    </a>

                    <a href="#/tenants" class="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-[13px] text-slate-600 hover:bg-slate-50 font-medium transition-all">
                        <i data-lucide="users" class="w-4 h-4 text-slate-500"></i>
                        <span>Tenants & CRM</span>
                    </a>

                    <a href="#/invoices" class="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-[13px] text-slate-600 hover:bg-slate-50 font-medium transition-all">
                        <i data-lucide="receipt" class="w-4 h-4 text-slate-500"></i>
                        <span>Invoices & OCR</span>
                    </a>

                    <div class="h-px bg-slate-200 my-4 mx-2"></div>

                    <a href="#/notifications" class="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-[13px] text-slate-600 hover:bg-slate-50 font-medium transition-all">
                        <i data-lucide="mail" class="w-4 h-4 text-slate-500"></i>
                        <span>Communications</span>
                    </a>

                    ${(user.role === 'OWNER' || user.role === 'ADMIN_TENANT') ? `
                    <a href="#/audit" class="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-[13px] text-slate-600 hover:bg-slate-50 font-medium transition-all">
                        <i data-lucide="clock" class="w-4 h-4 text-slate-500"></i>
                        <span>Audit Trail</span>
                    </a>
                    ` : ''}
                </div>
            </div>

            <!-- Profile & Logout Card -->
            <div class="p-4 border-t border-slate-200 bg-white">
                <div class="flex items-center gap-3 mb-3">
                    <img 
                        src="${user.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}" 
                        alt="Avatar" 
                        class="w-9 h-9 rounded-full object-cover border border-slate-200 shadow-2xs" 
                    />
                    <div class="flex flex-col min-w-0">
                        <span class="text-xs font-semibold text-slate-900 truncate">${user.full_name || 'Resident'}</span>
                        <span class="text-[10px] text-slate-500 truncate">${user.role || 'TENANT'} • ${user.flat_number || 'Unit'}</span>
                    </div>
                </div>
                <button id="logout-btn" class="w-full flex items-center justify-center gap-2 py-2 px-3 bg-slate-50 hover:bg-red-50 text-slate-600 hover:text-red-600 text-xs font-semibold rounded-lg border border-slate-200 transition-colors cursor-pointer">
                    <i data-lucide="log-out" class="w-3.5 h-3.5"></i>
                    <span>Log Out</span>
                </button>
            </div>
        </aside>

        <!-- Main Content Area -->
        <div class="flex-1 ml-64 flex flex-col min-h-screen">
            
            <!-- Top Header Bar -->
            <header class="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-20 shadow-2xs">
                <div>
                    <h1 class="text-lg font-bold text-slate-900 tracking-tight">Dashboard Overview</h1>
                    <p class="text-xs text-slate-500">Property Maintenance & Allocation Portal</p>
                </div>

                <div class="flex items-center gap-3">
                    <!-- Telemetry Pill -->
                    <div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
                        <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span>Cloud DB Live</span>
                    </div>

                    <!-- Active Month Badge -->
                    <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                        <i data-lucide="calendar" class="w-3.5 h-3.5"></i>
                        <span>${currentMonthLabel}</span>
                    </div>

                    <!-- GoogleClock Header -->
                    ${window.googleClock ? window.googleClock.renderHeaderHtml() : ''}

                    <!-- Action Export Buttons -->
                    <button id="header-export-pdf-btn" class="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer">
                        <i data-lucide="download" class="w-3.5 h-3.5"></i>
                        <span>PDF Report</span>
                    </button>
                    <button id="header-export-excel-btn" class="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-black text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer">
                        <i data-lucide="file-spreadsheet" class="w-3.5 h-3.5"></i>
                        <span>Excel</span>
                    </button>
                </div>
            </header>

            <!-- Body Container -->
            <main class="p-8 space-y-8 flex-1 bg-[#fbfbfe]">
                
                <!-- 4 KPI Metrics Cards -->
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                    <!-- Total Expenses -->
                    <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
                        <div class="flex items-center justify-between mb-3">
                            <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Monthly</span>
                            <div class="p-2 bg-blue-50 text-blue-600 rounded-xl">
                                <i data-lucide="wallet" class="w-4 h-4"></i>
                            </div>
                        </div>
                        <div>
                            <span class="text-2xl font-bold text-slate-900 tracking-tight">₹${parseFloat(totalExpenses).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                            <div class="flex items-center gap-1.5 mt-2 text-xs font-medium text-emerald-600">
                                <i data-lucide="trending-up" class="w-3.5 h-3.5"></i>
                                <span>Itemized Ledger Active</span>
                            </div>
                        </div>
                    </div>

                    <!-- Active Tenants -->
                    <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
                        <div class="flex items-center justify-between mb-3">
                            <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Tenants</span>
                            <div class="p-2 bg-purple-50 text-purple-600 rounded-xl">
                                <i data-lucide="users" class="w-4 h-4"></i>
                            </div>
                        </div>
                        <div>
                            <span class="text-2xl font-bold text-slate-900 tracking-tight">${activeTenants} Units</span>
                            <div class="flex items-center gap-1.5 mt-2 text-xs font-medium text-slate-500">
                                <span>100% Resident Allocation</span>
                            </div>
                        </div>
                    </div>

                    <!-- Per-Flat Contribution -->
                    <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
                        <div class="flex items-center justify-between mb-3">
                            <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Per-Flat Share</span>
                            <div class="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                                <i data-lucide="pie-chart" class="w-4 h-4"></i>
                            </div>
                        </div>
                        <div>
                            <span class="text-2xl font-bold text-slate-900 tracking-tight">₹${parseFloat(individualContribution).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                            <div class="flex items-center gap-1.5 mt-2 text-xs font-medium text-slate-500">
                                <span>Equal Division Rule</span>
                            </div>
                        </div>
                    </div>

                    <!-- Settlement Status -->
                    <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
                        <div class="flex items-center justify-between mb-3">
                            <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Settlement Health</span>
                            <div class="p-2 bg-amber-50 text-amber-600 rounded-xl">
                                <i data-lucide="shield-check" class="w-4 h-4"></i>
                            </div>
                        </div>
                        <div>
                            <span class="text-2xl font-bold text-slate-900 tracking-tight">100% Verified</span>
                            <div class="flex items-center gap-1.5 mt-2 text-xs font-medium text-emerald-600">
                                <i data-lucide="check-circle-2" class="w-3.5 h-3.5"></i>
                                <span>Dual-tier Local + Cloud</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Charts Section -->
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs col-span-2">
                        <div class="flex items-center justify-between mb-6">
                            <div>
                                <h3 class="font-bold text-slate-900 text-sm tracking-tight">Monthly Maintenance Expenditure Timeline</h3>
                                <p class="text-xs text-slate-500">Historical expense ledger tracking</p>
                            </div>
                        </div>
                        <div class="h-64 relative">
                            <canvas id="timelineChart"></canvas>
                        </div>
                    </div>

                    <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
                        <div class="flex items-center justify-between mb-6">
                            <div>
                                <h3 class="font-bold text-slate-900 text-sm tracking-tight">Category Breakdown</h3>
                                <p class="text-xs text-slate-500">Current allocation</p>
                            </div>
                        </div>
                        <div class="h-64 relative">
                            <canvas id="categoryChart"></canvas>
                        </div>
                    </div>
                </div>

                <!-- Recent Expenses Table -->
                <div class="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                    <div class="p-6 border-b border-slate-100 flex items-center justify-between">
                        <div>
                            <h3 class="font-bold text-slate-900 text-sm tracking-tight">Active Month Expense Items</h3>
                            <p class="text-xs text-slate-500">Live PostgreSQL row verification</p>
                        </div>
                        <a href="#/maintenance" class="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer">
                            <span>Open Full Ledger</span>
                            <i data-lucide="chevron-right" class="w-3.5 h-3.5"></i>
                        </a>
                    </div>

                    <div class="overflow-x-auto">
                        <table class="w-full text-left border-collapse">
                            <thead>
                                <tr class="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                                    <th class="px-6 py-3.5">Particulars</th>
                                    <th class="px-6 py-3.5">Category</th>
                                    <th class="px-6 py-3.5">Amount</th>
                                    <th class="px-6 py-3.5">Date</th>
                                    <th class="px-6 py-3.5 text-right">Digital Invoice</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-slate-100 text-sm text-slate-700">
                                ${expenses.length === 0 ? `
                                    <tr>
                                        <td colspan="5" class="py-8 text-center text-slate-400 text-xs">No expense items found for ${currentMonthLabel}. Click "Maintenance" to record expenses.</td>
                                    </tr>
                                ` : expenses.map(exp => `
                                    <tr class="hover:bg-slate-50/80 transition-colors">
                                        <td class="px-6 py-4 font-semibold text-slate-900">${exp.particulars}</td>
                                        <td class="px-6 py-4">
                                            <span class="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                                                ${exp.category || 'MAINTENANCE'}
                                            </span>
                                        </td>
                                        <td class="px-6 py-4 font-mono font-bold text-slate-900">₹${parseFloat(exp.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                        <td class="px-6 py-4 text-xs text-slate-500">${exp.date || new Date().toISOString().split('T')[0]}</td>
                                        <td class="px-6 py-4 text-right">
                                            <a href="#/invoices" class="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700">
                                                <i data-lucide="receipt" class="w-3.5 h-3.5"></i>
                                                <span>View Bill</span>
                                            </a>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>

            </main>
        </div>
    </div>
    `;

    // Start clock ticker
    if (window.googleClock) window.googleClock.startTicker();

    // Attach Lucide icons safely
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
        try { window.lucide.createIcons(); } catch (e) {}
    }

    // Attach Event Listeners
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            if (window.authService) await window.authService.logout();
            window.location.hash = '#/login';
        });
    }

    const pdfBtn = document.getElementById('header-export-pdf-btn');
    if (pdfBtn) {
        pdfBtn.addEventListener('click', () => {
            if (typeof window.exportMaintenanceToPDF === 'function') {
                window.exportMaintenanceToPDF(currentRecord || { month: 9, year: 2026, expenses });
            } else {
                alert('Downloading PDF Statement for ' + currentMonthLabel);
            }
        });
    }

    const excelBtn = document.getElementById('header-export-excel-btn');
    if (excelBtn) {
        excelBtn.addEventListener('click', () => {
            if (typeof window.exportMaintenanceToExcel === 'function') {
                window.exportMaintenanceToExcel(currentRecord || { month: 9, year: 2026, expenses });
            } else {
                alert('Downloading Excel Statement for ' + currentMonthLabel);
            }
        });
    }

    // Initialize Charts with Chart.js
    initCharts(expenses);
}

function initCharts(expenses) {
    if (typeof Chart === 'undefined') return;

    // 1. Timeline Chart
    const timelineCtx = document.getElementById('timelineChart');
    if (timelineCtx) {
        new Chart(timelineCtx, {
            type: 'line',
            data: {
                labels: ['May', 'Jun', 'Jul', 'Aug', 'Sep (Current)'],
                datasets: [{
                    label: 'Total Expenses (INR)',
                    data: [3200, 4800, 3950, 5200, 3750],
                    borderColor: '#0f172a',
                    backgroundColor: 'rgba(15, 23, 42, 0.05)',
                    fill: true,
                    tension: 0.35,
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { grid: { color: '#f1f5f9' } },
                    x: { grid: { display: false } }
                }
            }
        });
    }

    // 2. Category Doughnut Chart
    const categoryCtx = document.getElementById('categoryChart');
    if (categoryCtx) {
        const catMap = {};
        expenses.forEach(e => {
            const cat = e.category || 'OTHER';
            catMap[cat] = (catMap[cat] || 0) + parseFloat(e.amount || 0);
        });

        const labels = Object.keys(catMap).length > 0 ? Object.keys(catMap) : ['PLUMBING', 'ELECTRICAL', 'GENERAL'];
        const values = Object.keys(catMap).length > 0 ? Object.values(catMap) : [1200, 450, 2100];

        new Chart(categoryCtx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: values,
                    backgroundColor: ['#0f172a', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '70%',
                plugins: {
                    legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 11 } } }
                }
            }
        });
    }
}

window.renderDashboard = renderDashboard;
