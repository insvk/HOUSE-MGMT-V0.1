// Command Palette Component (Cmd+K / Ctrl+K)
// Provides instant fuzzy search, quick actions, and direct navigation.

(function() {
    let isOpen = false;

    function renderCommandPalette() {
        let existing = document.getElementById('command-palette-overlay');
        if (existing) existing.remove();

        const state = window.appStore ? window.appStore.getState() : {};
        const users = state.users || [];
        const records = state.records || [];
        const currentRecord = records.length > 0 ? records[0] : null;
        const expenses = currentRecord ? (currentRecord.expenses || []) : [];

        const overlay = document.createElement('div');
        overlay.id = 'command-palette-overlay';
        overlay.className = 'fixed inset-0 bg-black/60 z-50 flex items-start justify-center pt-4 sm:pt-16 p-2 sm:p-4 animate-in fade-in duration-100 backdrop-blur-xs';
        overlay.innerHTML = `
            <div class="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-150" style="max-height: 75vh; max-height: 75dvh;">
                <!-- Search Input Header -->
                <div class="p-3 sm:p-4 border-b border-slate-100 flex items-center gap-2.5 sm:gap-3 shrink-0">
                    <i data-lucide="search" class="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 shrink-0"></i>
                    <input
                        id="cmd-input"
                        type="text"
                        placeholder="Type a command or search residents, bills, settings..."
                        class="w-full text-xs sm:text-sm text-slate-900 placeholder-slate-400 bg-transparent focus:outline-none"
                        autofocus
                    />
                    <kbd class="text-[10px] font-mono px-1.5 sm:px-2 py-0.5 sm:py-1 rounded bg-slate-100 text-slate-500 border border-slate-200">ESC</kbd>
                </div>

                <!-- Results List -->
                <div id="cmd-results" class="flex-1 min-h-0 overflow-y-auto p-2 divide-y divide-slate-100 text-xs">
                    <!-- Actions Section -->
                    <div class="p-2">
                        <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 px-2">AI Copilot & Smart Actions</div>
                        <div class="space-y-0.5" id="cmd-smart-actions">
                            <button class="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left hover:bg-indigo-50 text-indigo-900 transition-colors cmd-item" data-action="open-copilot">
                                <i data-lucide="sparkles" class="w-4 h-4 text-indigo-600"></i>
                                <span class="font-medium">Ask AI Property Copilot (⚡ Natural Language)</span>
                            </button>
                            <button class="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left hover:bg-slate-50 text-slate-700 transition-colors cmd-item" data-action="scan-anomalies">
                                <i data-lucide="shield-alert" class="w-4 h-4 text-emerald-600"></i>
                                <span class="font-medium">Run AI Anomaly & Duplicate Expense Scan</span>
                            </button>
                            <button class="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left hover:bg-slate-50 text-slate-700 transition-colors cmd-item" data-action="predict-burn">
                                <i data-lucide="brain-circuit" class="w-4 h-4 text-purple-600"></i>
                                <span class="font-medium">Forecast Next 3-Month Expenditure Burn</span>
                            </button>
                            <button class="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left hover:bg-slate-50 text-slate-700 transition-colors cmd-item" data-action="open-smart-qr">
                                <i data-lucide="qr-code" class="w-4 h-4 text-blue-600"></i>
                                <span class="font-medium">Open Dynamic UPI QR & WhatsApp Collector</span>
                            </button>
                            <button class="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left hover:bg-slate-50 text-slate-700 transition-colors cmd-item" data-action="check-amc">
                                <i data-lucide="activity" class="w-4 h-4 text-amber-600"></i>
                                <span class="font-medium">Audit Preventative AMC & Equipment Health</span>
                            </button>
                        </div>
                    </div>

                    <!-- Actions Section -->
                    <div class="p-2">
                        <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 px-2">Quick Actions</div>
                        <div class="space-y-0.5" id="cmd-actions">
                            <button class="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left hover:bg-slate-50 text-slate-700 transition-colors cmd-item" data-action="add-expense">
                                <i data-lucide="plus-circle" class="w-4 h-4 text-blue-600"></i>
                                <span class="font-medium">Add Expense Line Item</span>
                            </button>
                            <button class="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left hover:bg-slate-50 text-slate-700 transition-colors cmd-item" data-action="add-tenant">
                                <i data-lucide="user-plus" class="w-4 h-4 text-emerald-600"></i>
                                <span class="font-medium">Register New Resident</span>
                            </button>
                            <button class="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left hover:bg-slate-50 text-slate-700 transition-colors cmd-item" data-action="upload-bill">
                                <i data-lucide="upload-cloud" class="w-4 h-4 text-purple-600"></i>
                                <span class="font-medium">Upload Invoice / EB Bill</span>
                            </button>
                            <button class="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left hover:bg-slate-50 text-slate-700 transition-colors cmd-item" data-action="export-pdf">
                                <i data-lucide="file-text" class="w-4 h-4 text-rose-600"></i>
                                <span class="font-medium">Export Executive PDF Statement</span>
                            </button>
                            <button class="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left hover:bg-slate-50 text-slate-700 transition-colors cmd-item" data-action="export-excel">
                                <i data-lucide="file-spreadsheet" class="w-4 h-4 text-emerald-700"></i>
                                <span class="font-medium">Export Excel Ledger</span>
                            </button>
                            <button class="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left hover:bg-slate-50 text-slate-700 transition-colors cmd-item" data-action="open-master">
                                <i data-lucide="sliders" class="w-4 h-4 text-amber-500"></i>
                                <span class="font-medium">Open God Mode Master Editor</span>
                            </button>
                        </div>
                    </div>

                    <!-- Navigation Section -->
                    <div class="p-2">
                        <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 px-2">Navigation</div>
                        <div class="space-y-0.5">
                            <button class="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left hover:bg-slate-50 text-slate-700 transition-colors cmd-item" data-nav="#/">
                                <i data-lucide="home" class="w-4 h-4 text-slate-500"></i>
                                <span>Go to Dashboard</span>
                            </button>
                            <button class="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left hover:bg-slate-50 text-slate-700 transition-colors cmd-item" data-nav="#/maintenance">
                                <i data-lucide="calendar" class="w-4 h-4 text-slate-500"></i>
                                <span>Go to Maintenance Ledger</span>
                            </button>
                            <button class="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left hover:bg-slate-50 text-slate-700 transition-colors cmd-item" data-nav="#/tenants">
                                <i data-lucide="users" class="w-4 h-4 text-slate-500"></i>
                                <span>Go to Tenant Directory & CRM</span>
                            </button>
                            <button class="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left hover:bg-slate-50 text-slate-700 transition-colors cmd-item" data-nav="#/invoices">
                                <i data-lucide="receipt" class="w-4 h-4 text-slate-500"></i>
                                <span>Go to Invoices & OCR</span>
                            </button>
                            <button class="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left hover:bg-slate-50 text-slate-700 transition-colors cmd-item" data-nav="#/analytics">
                                <i data-lucide="bar-chart-3" class="w-4 h-4 text-slate-500"></i>
                                <span>Go to Financial Analytics</span>
                            </button>
                            <button class="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left hover:bg-slate-50 text-slate-700 transition-colors cmd-item" data-nav="#/notifications">
                                <i data-lucide="mail" class="w-4 h-4 text-slate-500"></i>
                                <span>Go to Communications & Alerts</span>
                            </button>
                            <button class="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left hover:bg-slate-50 text-slate-700 transition-colors cmd-item" data-nav="#/audit">
                                <i data-lucide="clock" class="w-4 h-4 text-slate-500"></i>
                                <span>Go to Audit Trail</span>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Footer Hint -->
                <div class="p-3 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-1 text-[11px] text-slate-400">
                    <span>Press <kbd class="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-[10px]">Ctrl+K</kbd> to toggle anytime</span>
                    <span class="hidden sm:inline">CHE-MADURA HS-1 MGMT</span>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);
        if (window.lucide) window.lucide.createIcons();

        const input = document.getElementById('cmd-input');
        if (input) input.focus();

        // Close on background click
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closeCommandPalette();
        });

        // Attach action handlers
        overlay.querySelectorAll('.cmd-item').forEach(item => {
            item.addEventListener('click', () => {
                const nav = item.dataset.nav;
                const act = item.dataset.action;
                closeCommandPalette();

                if (nav) {
                    window.location.hash = nav;
                } else if (act === 'open-copilot') {
                    if (window.smartCopilot) window.smartCopilot.open();
                } else if (act === 'scan-anomalies') {
                    if (window.smartCopilot) window.smartCopilot.ask('Scan for financial anomalies and duplicate bills');
                } else if (act === 'predict-burn') {
                    if (window.smartCopilot) window.smartCopilot.ask('Predict next month maintenance and expense burn');
                } else if (act === 'open-smart-qr') {
                    if (window.smartPaymentModal) window.smartPaymentModal.open();
                } else if (act === 'check-amc') {
                    if (window.smartCopilot) window.smartCopilot.ask('Audit building assets and preventative maintenance calendar');
                } else if (act === 'add-expense') {
                    window.location.hash = '#/maintenance';
                    setTimeout(() => {
                        const btn = document.getElementById('add-expense-btn');
                        if (btn) btn.click();
                    }, 100);
                } else if (act === 'add-tenant') {
                    window.location.hash = '#/tenants';
                    setTimeout(() => {
                        const btn = document.getElementById('add-tenant-btn');
                        if (btn) btn.click();
                    }, 100);
                } else if (act === 'upload-bill') {
                    window.location.hash = '#/invoices';
                    setTimeout(() => {
                        const btn = document.getElementById('upload-invoice-btn');
                        if (btn) btn.click();
                    }, 100);
                } else if (act === 'export-pdf') {
                    if (window.exportUtils) window.exportUtils.exportPDF(state.records, state.house);
                } else if (act === 'export-excel') {
                    if (window.exportUtils) window.exportUtils.exportExcel(state.records, state.house);
                } else if (act === 'open-master') {
                    if (window.openGodModeModal) window.openGodModeModal('property');
                }
            });
        });

        // Filter items on input
        input.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase().trim();
            overlay.querySelectorAll('.cmd-item').forEach(item => {
                const text = item.textContent.toLowerCase();
                item.style.display = text.includes(query) ? 'flex' : 'none';
            });
        });
    }

    function openCommandPalette() {
        isOpen = true;
        renderCommandPalette();
    }

    function closeCommandPalette() {
        isOpen = false;
        const existing = document.getElementById('command-palette-overlay');
        if (existing) existing.remove();
    }

    // Global keyboard listener
    window.addEventListener('keydown', (e) => {
        if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
            e.preventDefault();
            if (isOpen) closeCommandPalette();
            else openCommandPalette();
        } else if (e.key === 'Escape' && isOpen) {
            closeCommandPalette();
        }
    });

    window.openCommandPalette = openCommandPalette;
    window.closeCommandPalette = closeCommandPalette;
    window.commandPalette = {
        open: openCommandPalette,
        close: closeCommandPalette
    };
})();
