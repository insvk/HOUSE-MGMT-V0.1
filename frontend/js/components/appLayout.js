// Unified CosmoLex Shell Layout for CHE-MADURA HS-1 MGMT V0.1
// Provides consistent sidebar navigation, header with GoogleClock, and profile info

function renderAppLayout({ activeTab, title, subtitle, actionsHtml, bodyHtml }) {
    const root = document.getElementById('app-root');
    if (!root) return;

    const state = window.appStore ? window.appStore.getState() : {};
    const user = state.user || {
        full_name: 'Sampath Kumar',
        email: 'sampathkumar@chemadura.com',
        role: 'OWNER',
        flat_number: 'Owner Suite'
    };
    const records = state.records || [];
    const currentRecord = records.length > 0 ? records[0] : null;
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
                    <a href="#/" class="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-[13px] ${activeTab === 'dashboard' ? 'bg-[#f1f2f4] font-semibold text-slate-900 shadow-2xs' : 'text-slate-600 hover:bg-slate-50 font-medium'} transition-all">
                        <i data-lucide="home" class="w-4 h-4 ${activeTab === 'dashboard' ? 'text-slate-900' : 'text-slate-500'}"></i>
                        <span>Dashboard</span>
                    </a>

                    <a href="#/maintenance" class="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-[13px] ${activeTab === 'maintenance' ? 'bg-[#f1f2f4] font-semibold text-slate-900 shadow-2xs' : 'text-slate-600 hover:bg-slate-50 font-medium'} transition-all">
                        <i data-lucide="calendar" class="w-4 h-4 ${activeTab === 'maintenance' ? 'text-slate-900' : 'text-slate-500'}"></i>
                        <span>Maintenance</span>
                    </a>

                    <a href="#/tenants" class="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-[13px] ${activeTab === 'tenants' ? 'bg-[#f1f2f4] font-semibold text-slate-900 shadow-2xs' : 'text-slate-600 hover:bg-slate-50 font-medium'} transition-all">
                        <i data-lucide="users" class="w-4 h-4 ${activeTab === 'tenants' ? 'text-slate-900' : 'text-slate-500'}"></i>
                        <span>Tenants & CRM</span>
                    </a>

                    <a href="#/invoices" class="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-[13px] ${activeTab === 'invoices' ? 'bg-[#f1f2f4] font-semibold text-slate-900 shadow-2xs' : 'text-slate-600 hover:bg-slate-50 font-medium'} transition-all">
                        <i data-lucide="receipt" class="w-4 h-4 ${activeTab === 'invoices' ? 'text-slate-900' : 'text-slate-500'}"></i>
                        <span>Invoices & OCR</span>
                    </a>

                    <div class="h-px bg-slate-200 my-4 mx-2"></div>

                    <a href="#/notifications" class="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-[13px] ${activeTab === 'notifications' ? 'bg-[#f1f2f4] font-semibold text-slate-900 shadow-2xs' : 'text-slate-600 hover:bg-slate-50 font-medium'} transition-all">
                        <i data-lucide="mail" class="w-4 h-4 text-slate-500"></i>
                        <span>Communications</span>
                    </a>

                    ${(user.role === 'OWNER' || user.role === 'ADMIN_TENANT') ? `
                    <a href="#/audit" class="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-[13px] ${activeTab === 'audit' ? 'bg-[#f1f2f4] font-semibold text-slate-900 shadow-2xs' : 'text-slate-600 hover:bg-slate-50 font-medium'} transition-all">
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
                        src="${user.avatar_url || user.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}" 
                        alt="Avatar" 
                        class="w-9 h-9 rounded-full object-cover border border-slate-200 shadow-2xs" 
                    />
                    <div class="flex flex-col min-w-0">
                        <span class="text-xs font-semibold text-slate-900 truncate">${user.full_name || user.fullName || 'Resident'}</span>
                        <span class="text-[10px] text-slate-500 truncate">${user.role || 'TENANT'} • ${user.flat_number || user.flatNumber || 'Unit'}</span>
                    </div>
                </div>
                <button id="global-logout-btn" class="w-full flex items-center justify-center gap-2 py-2 px-3 bg-slate-50 hover:bg-red-50 text-slate-600 hover:text-red-600 text-xs font-semibold rounded-lg border border-slate-200 transition-colors cursor-pointer">
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
                    <h1 class="text-lg font-bold text-slate-900 tracking-tight">${title}</h1>
                    <p class="text-xs text-slate-500">${subtitle}</p>
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

                    <!-- Action Buttons -->
                    ${actionsHtml || ''}
                </div>
            </header>

            <!-- Body Container -->
            <main class="p-8 space-y-8 flex-1 bg-[#fbfbfe]">
                ${bodyHtml}
            </main>
        </div>
    </div>
    `;

    // Initialize clock ticker
    if (window.googleClock) window.googleClock.startTicker();

    // Lucide icons init
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
        try { window.lucide.createIcons(); } catch (e) {}
    }

    // Attach logout
    const logoutBtn = document.getElementById('global-logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            if (window.authService) await window.authService.logout();
            window.location.hash = '#/login';
        });
    }
}

window.renderAppLayout = renderAppLayout;
