// Dashboard Component (Vanilla JS)

function renderDashboard() {
    const root = document.getElementById('app-root');
    const state = window.appStore.getState();
    const user = state.user;
    
    // Ensure data exists, fallback if not
    const users = state.users || [];
    const records = state.records || [];
    const currentRecord = records.length > 0 ? records[0] : null;
    const expenses = currentRecord ? currentRecord.expenses || [] : [];
    
    // Metrics calculation
    const totalExpenses = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
    const activeTenants = users.filter(u => u.occupancy_status === 'active').length || 1;
    const individualContribution = totalExpenses / activeTenants;

    root.innerHTML = `
        <div class="flex h-screen w-full bg-gray-50 overflow-hidden">
            <!-- Sidebar -->
            <aside class="w-64 bg-gray-900 text-white flex flex-col flex-shrink-0 z-20">
                <div class="p-4 font-bold text-xl border-b border-gray-700 flex items-center gap-2">
                    <i data-lucide="building-2" class="w-6 h-6 text-blue-400"></i>
                    MADURA HOUSE
                </div>
                <nav class="flex-1 p-4 flex flex-col gap-2 overflow-y-auto">
                    <a href="#/" class="flex items-center gap-2 p-3 rounded bg-blue-600 text-white font-medium shadow-md">
                        <i data-lucide="home" class="w-5 h-5"></i> Dashboard
                    </a>
                    <a href="#/maintenance" class="flex items-center gap-2 p-3 rounded hover:bg-gray-800 text-gray-300 transition-colors">
                        <i data-lucide="wallet" class="w-5 h-5"></i> Maintenance
                    </a>
                    <a href="#/tenants" class="flex items-center gap-2 p-3 rounded hover:bg-gray-800 text-gray-300 transition-colors">
                        <i data-lucide="users" class="w-5 h-5"></i> Tenants
                    </a>
                    <a href="#/invoices" class="flex items-center gap-2 p-3 rounded hover:bg-gray-800 text-gray-300 transition-colors">
                        <i data-lucide="receipt" class="w-5 h-5"></i> Invoices
                    </a>
                    <a href="#/notifications" class="flex items-center gap-2 p-3 rounded hover:bg-gray-800 text-gray-300 transition-colors">
                        <i data-lucide="bell" class="w-5 h-5"></i> Notifications
                    </a>
                    ${user?.role === 'OWNER' || user?.role === 'ADMIN_TENANT' ? `
                    <a href="#/audit" class="flex items-center gap-2 p-3 rounded hover:bg-gray-800 text-gray-300 transition-colors">
                        <i data-lucide="shield" class="w-5 h-5"></i> Audit Logs
                    </a>
                    ` : ''}
                </nav>
                <div class="p-4 border-t border-gray-700 flex flex-col gap-3">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                            ${user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div class="flex flex-col overflow-hidden">
                            <span class="text-sm font-medium truncate">${user?.full_name || 'User'}</span>
                            <span class="text-xs text-gray-400 truncate">${user?.role || 'TENANT'}</span>
                        </div>
                    </div>
                    <button id="logout-btn" class="flex items-center justify-center gap-2 bg-gray-800 hover:bg-red-600 p-2 rounded text-sm w-full transition-colors mt-2">
                        <i data-lucide="log-out" class="w-4 h-4"></i> Logout
                    </button>
                </div>
            </aside>
            
            <!-- Main Content -->
            <main class="flex-1 flex flex-col overflow-hidden relative">
                <!-- Header -->
                <header class="bg-white border-b border-gray-200 p-4 flex items-center justify-between z-10 flex-shrink-0">
                    <div>
                        <h1 class="text-2xl font-bold text-gray-800">Dashboard Overview</h1>
                        <p class="text-sm text-gray-500">Welcome back, ${user?.full_name?.split(' ')[0] || 'User'}</p>
                    </div>
                    <div class="flex items-center gap-4">
                        <div class="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2 border border-blue-200">
                            <i data-lucide="calendar" class="w-4 h-4"></i>
                            ${currentRecord ? (getMonthName(currentRecord.month) + ' ' + currentRecord.year) : 'No Active Month'}
                        </div>
                        <button class="bg-gray-100 hover:bg-gray-200 p-2 rounded-full transition-colors">
                            <i data-lucide="settings" class="w-5 h-5 text-gray-600"></i>
                        </button>
                    </div>
                </header>
                
                <!-- Scrollable Body -->
                <div class="flex-1 overflow-y-auto p-6 lg:p-8 bg-gray-50">
                    <!-- KPI Cards -->
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        
                        <!-- Card 1: Total Expenses -->
                        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col relative overflow-hidden group hover:shadow-md transition-shadow">
                            <div class="absolute top-0 right-0 w-24 h-24 bg-red-50 rounded-bl-full -mr-4 -mt-4 opacity-50"></div>
                            <div class="flex items-center justify-between mb-4 relative z-10">
                                <h3 class="text-sm font-semibold text-gray-500 uppercase tracking-wider">Total Expenses</h3>
                                <div class="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                                    <i data-lucide="trending-down" class="w-5 h-5"></i>
                                </div>
                            </div>
                            <div class="text-3xl font-bold text-gray-800 mb-1 relative z-10">₹${totalExpenses.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                            <div class="text-sm text-gray-500 relative z-10">For ${currentRecord ? getMonthName(currentRecord.month) : 'Current'} Month</div>
                        </div>
                        
                        <!-- Card 2: Per Tenant -->
                        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col relative overflow-hidden group hover:shadow-md transition-shadow">
                            <div class="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full -mr-4 -mt-4 opacity-50"></div>
                            <div class="flex items-center justify-between mb-4 relative z-10">
                                <h3 class="text-sm font-semibold text-gray-500 uppercase tracking-wider">Per Tenant</h3>
                                <div class="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                    <i data-lucide="users" class="w-5 h-5"></i>
                                </div>
                            </div>
                            <div class="text-3xl font-bold text-blue-700 mb-1 relative z-10">₹${individualContribution.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                            <div class="text-sm text-gray-500 relative z-10">Divided among ${activeTenants} active tenants</div>
                        </div>

                        <!-- Card 3: Active Tenants -->
                        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col relative overflow-hidden group hover:shadow-md transition-shadow">
                            <div class="absolute top-0 right-0 w-24 h-24 bg-green-50 rounded-bl-full -mr-4 -mt-4 opacity-50"></div>
                            <div class="flex items-center justify-between mb-4 relative z-10">
                                <h3 class="text-sm font-semibold text-gray-500 uppercase tracking-wider">Active Tenants</h3>
                                <div class="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                                    <i data-lucide="home" class="w-5 h-5"></i>
                                </div>
                            </div>
                            <div class="text-3xl font-bold text-gray-800 mb-1 relative z-10">${activeTenants} / ${users.length}</div>
                            <div class="text-sm text-gray-500 relative z-10">Total occupancy</div>
                        </div>

                        <!-- Card 4: Action / Status -->
                        <div class="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-sm border border-indigo-200 p-6 flex flex-col text-white relative overflow-hidden">
                            <div class="absolute top-0 right-0 w-32 h-32 bg-white rounded-bl-full opacity-10"></div>
                            <h3 class="text-sm font-semibold text-indigo-100 uppercase tracking-wider mb-2 relative z-10">Quick Actions</h3>
                            
                            <div class="flex flex-col gap-2 mt-auto relative z-10">
                                <button onclick="window.location.hash='#/maintenance'" class="w-full py-2 px-3 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors backdrop-blur-sm">
                                    <i data-lucide="plus" class="w-4 h-4"></i> Add Expense
                                </button>
                                <button onclick="window.location.hash='#/invoices'" class="w-full py-2 px-3 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors backdrop-blur-sm">
                                    <i data-lucide="upload-cloud" class="w-4 h-4"></i> Upload Invoice
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Charts Area -->
                    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                        <!-- Main Chart -->
                        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 lg:col-span-2">
                            <div class="flex items-center justify-between mb-6">
                                <h3 class="text-lg font-bold text-gray-800">Expense Trend (Last 6 Months)</h3>
                                <button class="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1">
                                    View Report <i data-lucide="arrow-up-right" class="w-4 h-4"></i>
                                </button>
                            </div>
                            <div class="h-72 w-full relative">
                                <canvas id="trendChart"></canvas>
                            </div>
                        </div>

                        <!-- Category Chart -->
                        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 lg:col-span-1">
                            <h3 class="text-lg font-bold text-gray-800 mb-6">Expenses by Category</h3>
                            <div class="h-64 w-full relative flex items-center justify-center">
                                <canvas id="categoryChart"></canvas>
                            </div>
                        </div>
                    </div>

                    <!-- Recent Expenses Table -->
                    <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-8">
                        <div class="p-6 border-b border-gray-200 flex items-center justify-between">
                            <h3 class="text-lg font-bold text-gray-800">Recent Expenses</h3>
                            <a href="#/maintenance" class="text-sm text-blue-600 hover:text-blue-800 font-medium">View All</a>
                        </div>
                        <div class="overflow-x-auto">
                            <table class="w-full text-left text-sm">
                                <thead class="bg-gray-50 text-gray-500 uppercase text-xs font-semibold">
                                    <tr>
                                        <th class="px-6 py-4">Particulars</th>
                                        <th class="px-6 py-4">Category</th>
                                        <th class="px-6 py-4">Amount</th>
                                        <th class="px-6 py-4">Added By</th>
                                        <th class="px-6 py-4 text-right">Invoice</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-gray-100 text-gray-700">
                                    ${expenses.slice(0, 5).map(exp => `
                                    <tr class="hover:bg-gray-50 transition-colors">
                                        <td class="px-6 py-4 font-medium text-gray-900">${exp.particular}</td>
                                        <td class="px-6 py-4">
                                            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                ${exp.category || 'maintenance'}
                                            </span>
                                        </td>
                                        <td class="px-6 py-4 font-semibold text-gray-900">₹${parseFloat(exp.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                        <td class="px-6 py-4 text-gray-500">
                                            ${users.find(u => u.id === exp.added_by)?.full_name || 'System'}
                                        </td>
                                        <td class="px-6 py-4 text-right">
                                            ${exp.invoice_url ? `
                                                <button class="text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 p-2 rounded-lg transition-colors inline-flex">
                                                    <i data-lucide="file-text" class="w-4 h-4"></i>
                                                </button>
                                            ` : `<span class="text-gray-300">-</span>`}
                                        </td>
                                    </tr>
                                    `).join('')}
                                    ${expenses.length === 0 ? `
                                    <tr>
                                        <td colspan="5" class="px-6 py-12 text-center text-gray-500">
                                            <div class="flex flex-col items-center justify-center">
                                                <i data-lucide="inbox" class="w-12 h-12 text-gray-300 mb-3"></i>
                                                <p>No expenses recorded for this month yet.</p>
                                                <button onclick="window.location.hash='#/maintenance'" class="mt-4 text-blue-600 hover:underline font-medium">Add first expense</button>
                                            </div>
                                        </td>
                                    </tr>
                                    ` : ''}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    `;

    // Re-initialize icons in newly injected HTML
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
        try { window.lucide.createIcons(); } catch (e) { console.warn('Lucide icon error:', e); }
    }

    // Attach event listeners
    document.getElementById('logout-btn').addEventListener('click', async () => {
        await window.authService.logout();
        window.location.hash = '#/login';
    });

    // Render Charts
    initDashboardCharts(records, expenses);
}

function initDashboardCharts(records, currentExpenses) {
    // Trend Chart (Bar/Line Combo)
    const trendCanvas = document.getElementById('trendChart');
    if (trendCanvas && records.length > 0) {
        // Sort records chronologically
        const sortedRecords = [...records].sort((a, b) => {
            if (a.year !== b.year) return a.year - b.year;
            return a.month - b.month;
        }).slice(-6); // Last 6 months

        const labels = sortedRecords.map(r => `${getMonthName(r.month).substring(0,3)} ${r.year}`);
        const totalData = sortedRecords.map(r => r.grand_total);
        const perTenantData = sortedRecords.map(r => r.individual_contribution || (r.grand_total / (r.number_of_active_tenants || 5)));

        new Chart(trendCanvas, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Total Expenses (₹)',
                        data: totalData,
                        backgroundColor: 'rgba(59, 130, 246, 0.2)', // blue-500 20%
                        borderColor: 'rgba(59, 130, 246, 1)',
                        borderWidth: 1,
                        borderRadius: 4,
                        order: 2
                    },
                    {
                        label: 'Per Tenant (₹)',
                        data: perTenantData,
                        type: 'line',
                        fill: false,
                        borderColor: 'rgba(239, 68, 68, 1)', // red-500
                        backgroundColor: 'rgba(239, 68, 68, 1)',
                        tension: 0.4,
                        borderWidth: 2,
                        pointBackgroundColor: 'white',
                        pointBorderWidth: 2,
                        pointRadius: 4,
                        order: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }

    // Category Doughnut Chart
    const categoryCanvas = document.getElementById('categoryChart');
    if (categoryCanvas && currentExpenses.length > 0) {
        const categories = {};
        currentExpenses.forEach(exp => {
            const cat = exp.category || 'maintenance';
            categories[cat] = (categories[cat] || 0) + parseFloat(exp.amount);
        });

        const labels = Object.keys(categories).map(c => c.charAt(0).toUpperCase() + c.slice(1));
        const data = Object.values(categories);
        
        // Colors from Tailwind palette
        const colors = [
            '#3b82f6', // blue-500
            '#10b981', // emerald-500
            '#f59e0b', // amber-500
            '#ef4444', // red-500
            '#8b5cf6', // violet-500
            '#64748b'  // slate-500
        ];

        new Chart(categoryCanvas, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: colors.slice(0, data.length),
                    borderWidth: 0,
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '70%',
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            usePointStyle: true,
                            padding: 20
                        }
                    }
                }
            }
        });
    } else if (categoryCanvas) {
         // Empty state handling
         const ctx = categoryCanvas.getContext('2d');
         ctx.font = '14px Inter';
         ctx.fillStyle = '#9ca3af'; // gray-400
         ctx.textAlign = 'center';
         ctx.fillText('No data available', categoryCanvas.width / 2, categoryCanvas.height / 2);
    }
}

function getMonthName(monthNumber) {
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    return months[monthNumber - 1] || "";
}
