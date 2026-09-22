// Financial Analytics & Visual Trends Component
// Ported from React AnalyticsDashboard.tsx using Chart.js

function renderAnalytics() {
    const state = window.appStore ? window.appStore.getState() : {};
    const records = state.records || [];
    const activeRecord = records.length > 0 ? records[0] : null;
    const expenses = activeRecord ? (activeRecord.expenses || []) : [];

    const categoryTotals = {};
    expenses.forEach(exp => {
        const cat = (exp.category || 'other').toLowerCase();
        categoryTotals[cat] = (categoryTotals[cat] || 0) + parseFloat(exp.amount || 0);
    });

    const categoryLabels = Object.keys(categoryTotals).map(c => c.toUpperCase());
    const categoryValues = Object.values(categoryTotals);
    const categoryColors = ['#0ab39c', '#f7b84b', '#405189', '#f06548', '#299cdb', '#8884d8'];

    const monthLabels = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const trendLabels = records.map(r => `${monthLabels[(r.month || 9) - 1]?.substring(0, 3)} ${r.year || 2026}`).reverse();
    const trendValues = records.map(r => parseFloat(r.grand_total || r.grandTotal || 0)).reverse();

    const actionsHtml = `
        <button id="export-analytics-excel-btn" class="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-black text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer">
            <i data-lucide="file-spreadsheet" class="w-3.5 h-3.5"></i>
            <span>Export Analytics (Excel)</span>
        </button>
    `;

    const bodyHtml = `
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- Monthly Trend Chart -->
            <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col">
                <div class="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                    <div>
                        <h3 class="text-sm font-bold text-slate-900 flex items-center gap-2">
                            <i data-lucide="trending-up" class="w-4 h-4 text-emerald-600"></i>
                            <span>Monthly Expenditure Trends</span>
                        </h3>
                        <p class="text-xs text-slate-400">Total monthly expenditure comparison across periods</p>
                    </div>
                </div>
                <div class="relative h-64 w-full flex items-center justify-center">
                    <canvas id="trendChart" data-chart="expenses-monthly-chart" class="expenses-monthly-chart"></canvas>
                </div>
            </div>

            <!-- Category Breakdown Donut Chart -->
            <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col">
                <div class="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                    <div>
                        <h3 class="text-sm font-bold text-slate-900 flex items-center gap-2">
                            <i data-lucide="pie-chart" class="w-4 h-4 text-amber-500"></i>
                            <span>Category Cost Distribution</span>
                        </h3>
                        <p class="text-xs text-slate-400">Ratio of utilities, repairs, cleaning, and maintenance</p>
                    </div>
                </div>
                <div class="relative h-64 w-full flex items-center justify-center">
                    ${categoryValues.length === 0 ? `
                        <div class="text-center text-slate-400 text-xs">
                            <i data-lucide="pie-chart" class="w-8 h-8 mx-auto mb-2 text-slate-300"></i>
                            <p class="font-medium text-slate-600">No categorized expenses recorded yet</p>
                        </div>
                    ` : `
                        <canvas id="categoryChart"></canvas>
                    `}
                </div>
            </div>
        </div>

        <!-- Summary Metric Stats -->
        <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <h3 class="text-sm font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">Financial Split Efficiency</h3>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div class="p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <span class="text-[11px] text-slate-400 uppercase font-bold tracking-wider">Active Billing Months</span>
                    <p class="text-xl font-bold text-slate-900 mt-1">${records.length} Cycles</p>
                </div>
                <div class="p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <span class="text-[11px] text-slate-400 uppercase font-bold tracking-wider">Average Monthly Burn</span>
                    <p class="text-xl font-bold text-slate-900 mt-1">₹${(trendValues.reduce((s, v) => s + v, 0) / (trendValues.length || 1)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                </div>
                <div class="p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <span class="text-[11px] text-slate-400 uppercase font-bold tracking-wider">Highest Recorded Cost</span>
                    <p class="text-xl font-bold text-slate-900 mt-1">₹${(Math.max(...(trendValues.length > 0 ? trendValues : [0]))).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                </div>
            </div>
        </div>
    `;

    renderAppLayout({
        activeTab: 'analytics',
        title: 'Financial Analytics & Trends',
        subtitle: 'Historical expenditure trends, category distributions, and burn rate metrics',
        actionsHtml,
        bodyHtml
    });

    // Initialize Chart.js
    setTimeout(() => {
        const trendCanvas = document.getElementById('trendChart');
        if (trendCanvas && window.Chart) {
            new window.Chart(trendCanvas, {
                type: 'bar',
                data: {
                    labels: trendLabels.length > 0 ? trendLabels : ['Sep 2026'],
                    datasets: [{
                        label: 'Total Expenses (₹)',
                        data: trendValues.length > 0 ? trendValues : [0],
                        backgroundColor: '#405189',
                        borderRadius: 8
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        y: { beginAtZero: true, grid: { color: '#f1f5f9' } },
                        x: { grid: { display: false } }
                    }
                }
            });
        }

        const categoryCanvas = document.getElementById('categoryChart');
        if (categoryCanvas && window.Chart && categoryValues.length > 0) {
            new window.Chart(categoryCanvas, {
                type: 'doughnut',
                data: {
                    labels: categoryLabels,
                    datasets: [{
                        data: categoryValues,
                        backgroundColor: categoryColors
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } }
                    }
                }
            });
        }
    }, 50);

    // Export handler
    document.getElementById('export-analytics-excel-btn')?.addEventListener('click', () => {
        if (window.exportUtils) window.exportUtils.exportExcel(records, state.house);
    });
}

window.renderAnalytics = renderAnalytics;
