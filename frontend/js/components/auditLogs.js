// Security Audit Trail & Immutable Log Component
// Ported from React AuditLogViewer.tsx

function renderAuditLogs() {
    const state = window.appStore ? window.appStore.getState() : {};
    const house = state.house || { name: 'CHE-MADURA HS-1 MGMT' };

    let logs = [];
    try {
        const raw = localStorage.getItem('madura_audit_logs');
        if (raw) logs = JSON.parse(raw);
    } catch (e) {}

    if (logs.length === 0) {
        logs = [
            {
                id: 'aud_init_01',
                userEmail: 'sampathkumar@chemadura.com',
                action: 'SYSTEM_INITIALIZED_CLEAN_DEPLOYMENT',
                resourceType: 'platform_core',
                resourceId: 'madura-house-system',
                ipAddress: '127.0.0.1',
                timestamp: new Date().toISOString()
            }
        ];
    }

    let activeFilter = 'ALL';
    let searchQuery = '';

    const actionsHtml = `
        <button id="export-audit-csv-btn" class="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-black text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer">
            <i data-lucide="download" class="w-3.5 h-3.5"></i>
            <span>Export Audit (CSV)</span>
        </button>
    `;

    function getFilteredLogs() {
        return logs.filter(l => {
            const email = (l.userEmail || l.user_email || '').toLowerCase();
            const action = (l.action || '').toLowerCase();
            const type = (l.resourceType || l.resource_type || '').toLowerCase();
            const q = searchQuery.toLowerCase();

            const matchesSearch = !q || email.includes(q) || action.includes(q) || type.includes(q);
            if (!matchesSearch) return false;

            if (activeFilter === 'ALL') return true;
            if (activeFilter === 'AUTH') return action.includes('LOGIN') || action.includes('AUTH');
            if (activeFilter === 'CREATE') return action.includes('CREATE') || action.includes('ADD');
            if (activeFilter === 'UPDATE') return action.includes('UPDATE') || action.includes('SET');
            if (activeFilter === 'DELETE') return action.includes('DELETE') || action.includes('REMOVE');
            return true;
        });
    }

    function getBadgeColor(action) {
        const act = (action || '').toUpperCase();
        if (act.includes('LOGIN') || act.includes('AUTH')) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
        if (act.includes('CREATE') || act.includes('ADD')) return 'bg-blue-50 text-blue-700 border-blue-200';
        if (act.includes('UPDATE') || act.includes('SET')) return 'bg-amber-50 text-amber-700 border-amber-200';
        if (act.includes('DELETE') || act.includes('REMOVE')) return 'bg-rose-50 text-rose-700 border-rose-200';
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }

    function buildTableHtml() {
        const filtered = getFilteredLogs();
        if (filtered.length === 0) {
            return `<tr><td colspan="5" class="py-12 text-center text-slate-400 text-xs">No audit logs matching this filter.</td></tr>`;
        }
        return filtered.map(l => `
            <tr class="hover:bg-slate-50/80 transition-colors">
                <td class="px-6 py-3.5 font-semibold text-slate-900">${l.userEmail || l.user_email}</td>
                <td class="px-6 py-3.5">
                    <span class="px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${getBadgeColor(l.action)}">
                        ${l.action}
                    </span>
                </td>
                <td class="px-6 py-3.5 text-xs text-slate-600">
                    <span class="font-semibold text-slate-800">${l.resourceType || l.resource_type}</span>
                    ${l.resourceId ? `<span class="text-slate-400 font-mono ml-1">(${l.resourceId})</span>` : ''}
                </td>
                <td class="px-6 py-3.5 text-xs font-mono text-slate-400">${l.ipAddress || l.ip_address || '127.0.0.1'}</td>
                <td class="px-6 py-3.5 text-right text-xs font-mono text-slate-400">${new Date(l.timestamp).toLocaleTimeString()}</td>
            </tr>
        `).join('');
    }

    const bodyHtml = `
        <div class="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <!-- Filter & Search Controls -->
            <div class="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div class="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
                    ${['ALL', 'AUTH', 'CREATE', 'UPDATE', 'DELETE'].map(f => `
                        <button type="button" class="audit-filter-btn px-3 py-1 rounded-lg transition-all cursor-pointer ${activeFilter === f ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'}" data-filter="${f}">
                            ${f}
                        </button>
                    `).join('')}
                </div>

                <div class="relative w-full sm:w-64">
                    <input id="audit-search-input" type="text" placeholder="Search email, action..." class="w-full pl-3 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-black" />
                </div>
            </div>

            <!-- Table -->
            <div class="overflow-x-auto">
                <table class="w-full text-left text-sm">
                    <thead class="bg-[#fafbfc] border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        <tr>
                            <th class="px-6 py-3.5">Operator / User</th>
                            <th class="px-6 py-3.5">Action</th>
                            <th class="px-6 py-3.5">Target Resource</th>
                            <th class="px-6 py-3.5">Client IP</th>
                            <th class="px-6 py-3.5 text-right">Timestamp</th>
                        </tr>
                    </thead>
                    <tbody id="audit-table-body" class="divide-y divide-slate-100 font-normal">
                        ${buildTableHtml()}
                    </tbody>
                </table>
            </div>
        </div>
    `;

    renderAppLayout({
        activeTab: 'audit',
        title: 'Security Audit Trail & Compliance Log',
        subtitle: 'Row-Level Security telemetry, user mutation actions, and access timestamps',
        actionsHtml,
        bodyHtml
    });

    // Attach listeners
    document.querySelectorAll('.audit-filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            activeFilter = btn.dataset.filter;
            document.querySelectorAll('.audit-filter-btn').forEach(b => {
                b.className = `audit-filter-btn px-3 py-1 rounded-lg transition-all cursor-pointer ${b.dataset.filter === activeFilter ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`;
            });
            const tbody = document.getElementById('audit-table-body');
            if (tbody) tbody.innerHTML = buildTableHtml();
        });
    });

    document.getElementById('audit-search-input')?.addEventListener('input', (e) => {
        searchQuery = e.target.value.trim();
        const tbody = document.getElementById('audit-table-body');
        if (tbody) tbody.innerHTML = buildTableHtml();
    });

    document.getElementById('export-audit-csv-btn')?.addEventListener('click', () => {
        if (window.exportUtils) window.exportUtils.exportAuditLogsToCSV(getFilteredLogs(), house);
    });
}

window.renderAuditLogs = renderAuditLogs;
