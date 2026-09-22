// Unified CosmoLex Shell Layout for CHE-MADURA HS-1 MGMT V0.1
// Provides consistent sidebar navigation, header with GoogleClock, role switcher, and profile management.

(function() {
    let profileDropdownOpen = false;

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
        const isOwner = user.email.toLowerCase() === 'sampathkumar@chemadura.com' || user.role === 'OWNER';

        root.innerHTML = `
        <div class="min-h-screen flex bg-[#fbfbfe] text-[#111827] font-sans antialiased overflow-x-hidden">
            
            <!-- Mobile Sidebar Backdrop -->
            <div id="sidebar-backdrop" class="fixed inset-0 bg-black/40 z-30 hidden lg:hidden backdrop-blur-xs transition-opacity"></div>

            <!-- CosmoLex Sidebar -->
            <aside id="app-sidebar" class="w-64 bg-[#fbfbfe] border-r border-slate-200 flex flex-col justify-between shrink-0 fixed inset-y-0 left-0 z-40 transition-transform duration-200 -translate-x-full lg:translate-x-0">
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

                        <a href="#/analytics" class="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-[13px] ${activeTab === 'analytics' ? 'bg-[#f1f2f4] font-semibold text-slate-900 shadow-2xs' : 'text-slate-600 hover:bg-slate-50 font-medium'} transition-all">
                            <i data-lucide="bar-chart-3" class="w-4 h-4 ${activeTab === 'analytics' ? 'text-slate-900' : 'text-slate-500'}"></i>
                            <span>Financial Analytics</span>
                        </a>

                        <a href="#/notifications" class="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-[13px] ${activeTab === 'notifications' ? 'bg-[#f1f2f4] font-semibold text-slate-900 shadow-2xs' : 'text-slate-600 hover:bg-slate-50 font-medium'} transition-all">
                            <i data-lucide="mail" class="w-4 h-4 ${activeTab === 'notifications' ? 'text-slate-900' : 'text-slate-500'}"></i>
                            <span>Communications</span>
                        </a>

                        ${(user.role === 'OWNER' || user.role === 'ADMIN_TENANT') ? `
                        <a href="#/audit" class="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-[13px] ${activeTab === 'audit' ? 'bg-[#f1f2f4] font-semibold text-slate-900 shadow-2xs' : 'text-slate-600 hover:bg-slate-50 font-medium'} transition-all">
                            <i data-lucide="clock" class="w-4 h-4 ${activeTab === 'audit' ? 'text-slate-900' : 'text-slate-500'}"></i>
                            <span>Audit Trail</span>
                        </a>
                        ` : ''}
                    </div>
                </div>

                <!-- Profile & Settings Footer -->
                <div class="p-3 border-t border-slate-200 bg-white">
                    <button id="sidebar-settings-btn" class="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer mb-2">
                        <i data-lucide="settings" class="w-4 h-4 text-slate-400"></i>
                        <span>Property Settings</span>
                    </button>

                    <div class="flex items-center gap-3 p-2 rounded-xl bg-slate-50 border border-slate-100">
                        <div class="relative group shrink-0">
                            <img 
                                src="${user.avatar_url || user.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}" 
                                alt="Avatar" 
                                class="w-9 h-9 rounded-full object-cover border border-slate-200 shadow-2xs" 
                            />
                            <button id="quick-change-avatar-btn" class="absolute -bottom-1 -right-1 p-0.5 bg-slate-900 text-white rounded-full shadow hover:bg-black transition-all cursor-pointer" title="Change Avatar">
                                <i data-lucide="camera" class="w-2.5 h-2.5"></i>
                            </button>
                        </div>
                        <div class="flex flex-col min-w-0 flex-1">
                            <span class="text-xs font-bold text-slate-900 truncate">${user.full_name || user.fullName || 'Resident'}</span>
                            <span class="text-[10px] text-slate-400 truncate">${user.role || 'TENANT'} • ${user.flat_number || user.flatNumber || 'Unit'}</span>
                        </div>
                    </div>
                </div>
            </aside>

            <!-- Main Content Area -->
            <div class="flex-1 lg:ml-64 flex flex-col min-h-screen min-w-0">
                
                <!-- Top Header Bar (CosmoLex Style) -->
                <header class="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 flex items-center justify-between sticky top-0 z-20 shadow-2xs">
                    <!-- Left: Mobile Toggle, Title & Command Palette trigger -->
                    <div class="flex items-center gap-3 sm:gap-4">
                        <button id="mobile-sidebar-toggle-btn" class="lg:hidden p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 cursor-pointer" title="Menu">
                            <i data-lucide="menu" class="w-5 h-5"></i>
                        </button>
                        <div>
                            <h1 class="text-sm sm:text-base font-bold text-slate-900 tracking-tight leading-tight">${title}</h1>
                            <p class="text-[11px] text-slate-400 hidden sm:block">${subtitle}</p>
                        </div>

                        <!-- Command Palette Search Button -->
                        <button id="header-cmd-search-btn" class="hidden md:flex items-center gap-2.5 bg-[#f3f4f6] hover:bg-slate-200 px-3.5 py-1.5 rounded-full text-xs text-slate-500 transition-colors cursor-pointer ml-2">
                            <i data-lucide="search" class="w-3.5 h-3.5 text-slate-400"></i>
                            <span class="font-medium">Search...</span>
                            <kbd class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white text-slate-400 shadow-2xs">⌘K</kbd>
                        </button>
                    </div>

                    <!-- Right Controls -->
                    <div class="flex items-center gap-2.5">
                        <!-- Cloud DB Pill -->
                        <button id="header-sync-pill" class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs cursor-pointer" title="Click to test database latency">
                            <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span>Cloud DB Live</span>
                        </button>

                        <!-- God Maxx Access Pill (for Sampath Kumar / OWNER) -->
                        ${isOwner ? `
                        <button id="header-god-badge" class="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gradient-to-r from-amber-500/15 via-purple-500/10 to-indigo-500/15 border border-amber-400/40 text-amber-900 font-extrabold text-[11px] tracking-wide uppercase shadow-2xs cursor-pointer hover:bg-amber-100/50 transition-colors" title="Open Master Property Editor">
                            <i data-lucide="sparkles" class="w-3.5 h-3.5 text-amber-600 animate-pulse"></i>
                            <span class="hidden sm:inline">GOD MAXX ACCESS</span>
                        </button>
                        ` : ''}

                        <!-- Active View Role Selector -->
                        ${isOwner ? `
                        <div class="flex items-center gap-1 bg-[#f3f3f9] px-2 py-1 rounded border border-slate-200 text-xs">
                            <select id="header-role-select" class="bg-transparent text-[11px] font-bold text-[#405189] cursor-pointer focus:outline-none">
                                <option value="OWNER" ${user.role === 'OWNER' ? 'selected' : ''}>Owner (Sampath)</option>
                                <option value="ADMIN_TENANT" ${user.role === 'ADMIN_TENANT' ? 'selected' : ''}>Admin Tenant</option>
                                <option value="TENANT" ${user.role === 'TENANT' ? 'selected' : ''}>Tenant View</option>
                            </select>
                        </div>
                        ` : ''}

                        <!-- Active Month Badge -->
                        <div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                            <i data-lucide="calendar" class="w-3 h-3"></i>
                            <span>${currentMonthLabel}</span>
                        </div>

                        <!-- GoogleClock Header -->
                        ${window.googleClock ? window.googleClock.renderHeaderHtml() : ''}

                        <!-- Action Buttons -->
                        ${actionsHtml || ''}

                        <!-- User Profile Dropdown -->
                        <div class="relative ml-2">
                            <button id="header-profile-menu-btn" class="flex items-center gap-2 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer">
                                <img 
                                    src="${user.avatar_url || user.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}" 
                                    alt="Avatar" 
                                    class="w-8 h-8 rounded-full object-cover border border-slate-200" 
                                />
                                <i data-lucide="chevron-down" class="w-3.5 h-3.5 text-slate-400"></i>
                            </button>

                            <!-- Dropdown Menu -->
                            <div id="header-profile-dropdown" class="hidden absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-slate-200 py-1 z-50 text-xs animate-in fade-in duration-100">
                                <div class="px-4 py-2 border-b border-slate-100">
                                    <p class="font-bold text-slate-900 truncate">${user.full_name || 'Resident'}</p>
                                    <p class="text-[11px] text-slate-400 truncate">${user.email}</p>
                                </div>
                                <button type="button" id="menu-edit-profile-btn" class="w-full text-left px-4 py-2 text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer">
                                    <i data-lucide="user" class="w-3.5 h-3.5 text-slate-400"></i>
                                    <span>Edit Profile</span>
                                </button>
                                <button type="button" id="menu-change-avatar-btn" class="w-full text-left px-4 py-2 text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer">
                                    <i data-lucide="camera" class="w-3.5 h-3.5 text-slate-400"></i>
                                    <span>Change Photo</span>
                                </button>
                                <button type="button" id="menu-settings-btn" class="w-full text-left px-4 py-2 text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer">
                                    <i data-lucide="settings" class="w-3.5 h-3.5 text-slate-400"></i>
                                    <span>Property Settings</span>
                                </button>
                                <div class="border-t border-slate-100 my-1"></div>
                                <button type="button" id="menu-logout-btn" class="w-full text-left px-4 py-2 text-rose-600 hover:bg-rose-50 flex items-center gap-2 font-semibold cursor-pointer">
                                    <i data-lucide="log-out" class="w-3.5 h-3.5"></i>
                                    <span>Sign Out</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </header>

                <!-- Body Container -->
                <main class="p-4 sm:p-6 lg:p-8 space-y-6 lg:space-y-8 flex-1 bg-[#fbfbfe]">
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

        // Mobile Sidebar Toggle
        const sidebar = document.getElementById('app-sidebar');
        const backdrop = document.getElementById('sidebar-backdrop');
        const mobileToggleBtn = document.getElementById('mobile-sidebar-toggle-btn');
        mobileToggleBtn?.addEventListener('click', () => {
            sidebar?.classList.toggle('-translate-x-full');
            backdrop?.classList.toggle('hidden');
        });
        backdrop?.addEventListener('click', () => {
            sidebar?.classList.add('-translate-x-full');
            backdrop?.classList.add('hidden');
        });
        // Auto-close sidebar on mobile when navigating
        sidebar?.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                if (window.innerWidth < 1024) {
                    sidebar.classList.add('-translate-x-full');
                    backdrop?.classList.add('hidden');
                }
            });
        });

        // Attach Command Palette
        document.getElementById('header-cmd-search-btn')?.addEventListener('click', () => {
            if (window.openCommandPalette) window.openCommandPalette();
        });

        // Attach God Mode modal
        document.getElementById('header-god-badge')?.addEventListener('click', () => {
            if (window.openGodModeModal) window.openGodModeModal('property');
        });

        // Attach Settings modal
        document.getElementById('sidebar-settings-btn')?.addEventListener('click', () => {
            if (window.openSettingsModal) window.openSettingsModal('general');
        });
        document.getElementById('menu-settings-btn')?.addEventListener('click', () => {
            if (window.openSettingsModal) window.openSettingsModal('general');
        });

        // Attach Quick Avatar
        const handleAvatarChange = () => {
            if (window.modals && window.modals.openAvatarModal) {
                window.modals.openAvatarModal(user.avatar_url || user.avatarUrl, async (newUrl) => {
                    const updated = { ...user, avatar_url: newUrl, avatarUrl: newUrl };
                    if (window.supabase && user.id) {
                        await window.supabase.from('users').update({ avatar_url: newUrl }).eq('id', user.id);
                    }
                    if (window.appStore) window.appStore.setState({ user: updated });
                    if (typeof window.refreshCurrentView === 'function') {
                        window.refreshCurrentView();
                    } else {
                        window.location.reload();
                    }
                });
            }
        };
        document.getElementById('quick-change-avatar-btn')?.addEventListener('click', handleAvatarChange);
        document.getElementById('menu-change-avatar-btn')?.addEventListener('click', handleAvatarChange);

        // Attach Edit Profile
        document.getElementById('menu-edit-profile-btn')?.addEventListener('click', () => {
            if (window.modals && window.modals.openEditProfileModal) {
                window.modals.openEditProfileModal(user, (updated) => {
                    if (window.appStore) window.appStore.setState({ user: updated });
                    if (typeof window.refreshCurrentView === 'function') {
                        window.refreshCurrentView();
                    } else {
                        window.location.reload();
                    }
                });
            }
        });

        // Attach Sync Pill Ping
        document.getElementById('header-sync-pill')?.addEventListener('click', () => {
            if (window.openSettingsModal) window.openSettingsModal('cloud');
        });

        // Attach Profile Dropdown Toggle
        const dropdownBtn = document.getElementById('header-profile-menu-btn');
        const dropdownMenu = document.getElementById('header-profile-dropdown');
        if (dropdownBtn && dropdownMenu) {
            dropdownBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                dropdownMenu.classList.toggle('hidden');
            });
            document.addEventListener('click', () => {
                dropdownMenu.classList.add('hidden');
            });
        }

        // Attach Logout
        document.getElementById('menu-logout-btn')?.addEventListener('click', async () => {
            if (window.authService) await window.authService.logout();
            window.location.hash = '#/login';
        });

        // Role Switcher
        document.getElementById('header-role-select')?.addEventListener('change', (e) => {
            const role = e.target.value;
            const updated = { ...user, role };
            if (window.appStore) window.appStore.setState({ user: updated });
            if (typeof window.refreshCurrentView === 'function') {
                window.refreshCurrentView();
            } else {
                window.location.reload();
            }
        });
    }

    window.renderAppLayout = renderAppLayout;
})();
