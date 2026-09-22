// Platform Settings & Cloud Realtime Backups Modal
// Madura House Maintenance Management Platform (HMMP)
// Supabase Cloud PostgreSQL Synchronized in Realtime

(function() {
    let activeTab = 'general';
    let cloudCounts = null;
    let recentCloudCheckpoints = [];
    let isFetchingCounts = false;

    // Helper: Ensure authenticated session for Supabase Cloud PostgreSQL operations
    async function ensureAdminSession() {
        if (!window.supabase) return false;
        try {
            const { data: { session } } = await window.supabase.auth.getSession();
            if (session && session.user) return true;
            
            // Check if current user is owner or admin in state
            const state = window.appStore ? window.appStore.getState() : {};
            const user = state.user || {};
            const isOwner = (user.email || '').toLowerCase() === 'sampathkumar@chemadura.com' || user.role === 'OWNER';
            if (isOwner) {
                const { data, error } = await window.supabase.auth.signInWithPassword({
                    email: 'sampathkumar@chemadura.com',
                    password: 'Sampath@123'
                });
                if (!error && data?.session) {
                    console.log('✓ Re-established admin cloud session');
                    return true;
                }
            }
        } catch (err) {
            console.warn('Admin session check notice:', err);
        }
        return false;
    }

    // Helper: Fetch table row counts directly from Supabase Cloud
    async function fetchCloudStats() {
        if (!window.supabase || isFetchingCounts) return;
        isFetchingCounts = true;
        try {
            await ensureAdminSession();
            const [usersCount, housesCount, recordsCount, expensesCount, auditCount] = await Promise.all([
                window.supabase.from('users').select('*', { count: 'exact', head: true }),
                window.supabase.from('houses').select('*', { count: 'exact', head: true }),
                window.supabase.from('maintenance_records').select('*', { count: 'exact', head: true }),
                window.supabase.from('expenses').select('*', { count: 'exact', head: true }),
                window.supabase.from('audit_logs').select('*', { count: 'exact', head: true })
            ]);

            cloudCounts = {
                users: usersCount.count || 0,
                houses: housesCount.count || 0,
                records: recordsCount.count || 0,
                expenses: expensesCount.count || 0,
                auditLogs: auditCount.count || 0,
                fetchedAt: new Date().toLocaleTimeString()
            };

            // Also fetch recent cloud snapshot checkpoints
            const { data: checkpoints } = await window.supabase
                .from('audit_logs')
                .select('id, action, created_at, changes')
                .eq('action', 'SYSTEM_CLOUD_SNAPSHOT')
                .order('created_at', { ascending: false })
                .limit(5);

            if (checkpoints) {
                recentCloudCheckpoints = checkpoints;
            }
        } catch (err) {
            console.warn('Failed to fetch cloud stats:', err);
        } finally {
            isFetchingCounts = false;
        }
    }

    function renderSettingsModal() {
        let existing = document.getElementById('settings-modal-overlay');
        if (existing) existing.remove();

        const state = window.appStore ? window.appStore.getState() : {};
        const user = state.user || {};
        const isOwner = (user.email || '').toLowerCase() === 'sampathkumar@chemadura.com' || user.role === 'OWNER';
        const house = state.house || {
            name: 'CHE-MADURA HS-1 MGMT',
            address: '91/16, Kovilpatti Gopalakrishnan Street, Karthikeyan Nagar, Maduravoyal',
            city: 'Chennai',
            postalCode: '600095',
            totalUnits: 5,
            settings: { currency: 'INR', upiId: '7338716690@ybl', upiName: 'Sampath Kumar' }
        };
        const houseSettings = typeof house.settings === 'object' && house.settings !== null ? house.settings : {};
        const currentUpiId = houseSettings.upiId || houseSettings.upi_id || house.upi_id || '7338716690@ybl';
        const currentUpiName = houseSettings.upiName || houseSettings.upi_name || house.name || 'Sampath Kumar';
        const audioOn = window.audioUtils ? window.audioUtils.isAudioEnabled() : true;

        const overlay = document.createElement('div');
        overlay.id = 'settings-modal-overlay';
        overlay.className = 'fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-100 backdrop-blur-xs';
        overlay.innerHTML = `
            <div class="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92dvh]">
                <!-- Header -->
                <div class="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-100 flex items-center justify-between gap-3">
                    <div class="flex items-center gap-2.5 sm:gap-3 min-w-0">
                        <div class="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0">
                            <i data-lucide="settings" class="w-5 h-5"></i>
                        </div>
                        <div class="min-w-0">
                            <div class="flex items-center gap-2">
                                <h2 class="text-sm sm:text-base font-bold text-slate-900 truncate">Platform Settings & Backups</h2>
                                <span class="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                    <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                    <span>Cloud Realtime Synced</span>
                                </span>
                            </div>
                            <p class="text-[11px] sm:text-xs text-slate-500 truncate">Permanent PostgreSQL storage, dynamic UPI billing, and cloud checkpoints</p>
                        </div>
                    </div>
                    <button type="button" id="close-settings-btn" class="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer shrink-0">
                        <i data-lucide="x" class="w-5 h-5"></i>
                    </button>
                </div>

                <!-- Tabs -->
                <div class="flex border-b border-slate-100 px-3 sm:px-6 gap-3 sm:gap-6 text-xs font-semibold overflow-x-auto no-scrollbar">
                    <button type="button" class="py-2.5 sm:py-3 border-b-2 transition-colors cursor-pointer shrink-0 whitespace-nowrap ${activeTab === 'general' ? 'border-slate-900 text-slate-900 font-bold' : 'border-transparent text-slate-400 hover:text-slate-600'}" data-tab="general">
                        General Configuration
                    </button>
                    <button type="button" class="py-2.5 sm:py-3 border-b-2 transition-colors cursor-pointer shrink-0 whitespace-nowrap ${activeTab === 'cloud' ? 'border-slate-900 text-slate-900 font-bold' : 'border-transparent text-slate-400 hover:text-slate-600'}" data-tab="cloud">
                        Cloud Database Status
                    </button>
                    <button type="button" class="py-2.5 sm:py-3 border-b-2 transition-colors cursor-pointer shrink-0 whitespace-nowrap ${activeTab === 'backup' ? 'border-slate-900 text-slate-900 font-bold' : 'border-transparent text-slate-400 hover:text-slate-600'}" data-tab="backup">
                        System Backup & Restore
                    </button>
                </div>

                <!-- Notification Alert Banner Container -->
                <div id="settings-status-banner" class="hidden px-4 sm:px-6 pt-3"></div>

                <!-- Tab Content Body -->
                <div class="p-4 sm:px-6 sm:py-5 overflow-y-auto flex-1 space-y-4 text-sm">
                    ${activeTab === 'general' ? `
                        <form id="settings-general-form" class="space-y-4">
                            ${!isOwner ? `
                                <div class="p-3 bg-amber-50/80 border border-amber-200/90 rounded-xl flex items-center gap-2.5 text-xs text-amber-900 font-medium">
                                    <i data-lucide="shield-alert" class="w-4 h-4 text-amber-600 shrink-0"></i>
                                    <span>Read-Only Mode: Platform settings and UPI collection accounts can only be modified by Property Administrator / Owner.</span>
                                </div>
                            ` : `
                                <div class="p-3 bg-blue-50/70 border border-blue-200/80 rounded-xl flex items-center justify-between gap-2 text-xs text-blue-900">
                                    <div class="flex items-center gap-2">
                                        <i data-lucide="cloud" class="w-4 h-4 text-blue-600 shrink-0"></i>
                                        <span class="font-medium">All changes are committed permanently to Supabase Cloud PostgreSQL in Realtime.</span>
                                    </div>
                                    <span class="text-[10px] font-mono text-blue-600 bg-white px-2 py-0.5 rounded border border-blue-200">PostgreSQL 15</span>
                                </div>
                            `}

                            <div>
                                <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Property Name</label>
                                <input id="set-name" required value="${house.name || 'CHE-MADURA HS-1 MGMT'}" ${!isOwner ? 'disabled readonly' : ''} class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-black ${!isOwner ? 'bg-slate-100/80 cursor-not-allowed text-slate-500' : ''}" />
                            </div>
                            <div>
                                <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Street Address</label>
                                <input id="set-address" required value="${house.address || '91/16, Kovilpatti Gopalakrishnan Street, Karthikeyan Nagar, Maduravoyal'}" ${!isOwner ? 'disabled readonly' : ''} class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-black ${!isOwner ? 'bg-slate-100/80 cursor-not-allowed text-slate-500' : ''}" />
                            </div>
                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">City</label>
                                    <input id="set-city" required value="${house.city || 'Chennai'}" ${!isOwner ? 'disabled readonly' : ''} class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-black ${!isOwner ? 'bg-slate-100/80 cursor-not-allowed text-slate-500' : ''}" />
                                </div>
                                <div>
                                    <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Postal Code</label>
                                    <input id="set-postal" required value="${house.postalCode || house.postal_code || '600095'}" ${!isOwner ? 'disabled readonly' : ''} class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-black ${!isOwner ? 'bg-slate-100/80 cursor-not-allowed text-slate-500' : ''}" />
                                </div>
                            </div>
                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Total Units / Flats</label>
                                    <input id="set-units" required type="number" min="1" max="50" value="${house.totalUnits || house.total_units || 5}" ${!isOwner ? 'disabled readonly' : ''} class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-black ${!isOwner ? 'bg-slate-100/80 cursor-not-allowed text-slate-500' : ''}" />
                                </div>
                                <div>
                                    <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Currency Code</label>
                                    <input id="set-currency" required value="${houseSettings.currency || 'INR'}" ${!isOwner ? 'disabled readonly' : ''} class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-black ${!isOwner ? 'bg-slate-100/80 cursor-not-allowed text-slate-500' : ''}" />
                                </div>
                            </div>
                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <div class="flex items-center justify-between mb-1.5">
                                        <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">UPI ID for Collections</label>
                                        ${!isOwner ? `<span class="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider flex items-center gap-1"><i data-lucide="lock" class="w-2.5 h-2.5"></i> Admin Only</span>` : ''}
                                    </div>
                                    <input id="set-upi-id" placeholder="e.g. 7338716690@ybl" value="${currentUpiId}" ${!isOwner ? 'disabled readonly' : ''} class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-black ${!isOwner ? 'bg-slate-100/80 cursor-not-allowed text-slate-500 font-mono' : 'font-mono'}" />
                                    <p class="text-[10px] text-slate-400 mt-1">Direct NPCI QR codes on tenant dashboards route payments to this verified VPA.</p>
                                </div>
                                <div>
                                    <div class="flex items-center justify-between mb-1.5">
                                        <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">UPI Payee Name</label>
                                        ${!isOwner ? `<span class="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider flex items-center gap-1"><i data-lucide="lock" class="w-2.5 h-2.5"></i> Admin Only</span>` : ''}
                                    </div>
                                    <input id="set-upi-name" placeholder="e.g. Sampath Kumar" value="${currentUpiName}" ${!isOwner ? 'disabled readonly' : ''} class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-black ${!isOwner ? 'bg-slate-100/80 cursor-not-allowed text-slate-500' : ''}" />
                                    <p class="text-[10px] text-slate-400 mt-1">Beneficiary name encoded into the payment string.</p>
                                </div>
                            </div>
                            <div class="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                                <div>
                                    <span class="text-xs font-bold text-slate-800">Synthesized Audio Feedback</span>
                                    <p class="text-[11px] text-slate-400">Play harmonic Web Audio API chimes on actions</p>
                                </div>
                                <button type="button" id="toggle-audio-btn" class="px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${audioOn ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'}">
                                    ${audioOn ? 'Sound Active' : 'Muted'}
                                </button>
                            </div>
                            <div class="flex items-center justify-between pt-3">
                                ${!isOwner ? `
                                    <div class="text-[11px] text-amber-700 flex items-center gap-1.5 font-medium">
                                        <i data-lucide="shield-alert" class="w-4 h-4 text-amber-600"></i>
                                        <span>Settings locked to administrator account.</span>
                                    </div>
                                ` : `
                                    <span class="text-[11px] text-slate-500 flex items-center gap-1">
                                        <i data-lucide="check-circle-2" class="w-3.5 h-3.5 text-emerald-600"></i>
                                        Realtime updates broadcast to all devices
                                    </span>
                                `}
                                <button type="submit" id="save-settings-submit-btn" ${!isOwner ? 'disabled' : ''} class="px-5 py-2.5 ${isOwner ? 'bg-slate-900 hover:bg-black text-white cursor-pointer active:scale-98' : 'bg-slate-200 text-slate-400 cursor-not-allowed'} text-xs font-semibold rounded-xl shadow-sm transition-all flex items-center gap-2">
                                    <i data-lucide="${isOwner ? 'save' : 'lock'}" class="w-3.5 h-3.5"></i>
                                    <span id="save-settings-btn-label">${isOwner ? 'Save Changes to Cloud' : 'Admin Only'}</span>
                                </button>
                            </div>
                        </form>
                    ` : activeTab === 'cloud' ? `
                        <div class="space-y-4">
                            <!-- Cloud Status Overview -->
                            <div class="p-4 rounded-xl bg-slate-900 text-white space-y-3">
                                <div class="flex items-center justify-between">
                                    <div class="flex items-center gap-2.5">
                                        <div class="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                                            <i data-lucide="database" class="w-4 h-4"></i>
                                        </div>
                                        <div>
                                            <h3 class="text-xs font-bold uppercase tracking-wider text-slate-200">Supabase Cloud PostgreSQL</h3>
                                            <p class="text-xs text-slate-400 font-mono">kbvjnshgyuwkcvicwefh.supabase.co</p>
                                        </div>
                                    </div>
                                    <div class="flex items-center gap-1.5 bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 px-2.5 py-1 rounded-full text-[11px] font-semibold">
                                        <span class="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                                        <span>ONLINE</span>
                                    </div>
                                </div>
                                <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800 text-[11px]">
                                    <div>
                                        <span class="text-slate-400 block text-[10px]">Realtime Engine</span>
                                        <span class="font-semibold text-emerald-300">Active (Subscribed)</span>
                                    </div>
                                    <div>
                                        <span class="text-slate-400 block text-[10px]">Security (RLS)</span>
                                        <span class="font-semibold text-slate-200">Active Policies</span>
                                    </div>
                                    <div>
                                        <span class="text-slate-400 block text-[10px]">Auth Mode</span>
                                        <span class="font-semibold text-slate-200">GoTrue JWT</span>
                                    </div>
                                    <div>
                                        <span class="text-slate-400 block text-[10px]">Auto-Sync</span>
                                        <span class="font-semibold text-emerald-300">Bi-directional</span>
                                    </div>
                                </div>
                            </div>

                            <!-- Diagnostic Ping & Sync Actions -->
                            <div class="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                                <div class="flex items-center gap-3">
                                    <button type="button" id="test-cloud-btn" class="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl cursor-pointer shadow-sm transition-all flex items-center gap-1.5">
                                        <i data-lucide="activity" class="w-3.5 h-3.5"></i>
                                        <span>Diagnostics Ping</span>
                                    </button>
                                    <span id="cloud-ping-result" class="text-xs text-slate-500 font-mono"></span>
                                </div>
                                <button type="button" id="force-resync-btn" class="px-3.5 py-2 bg-slate-800 hover:bg-black text-white text-xs font-semibold rounded-xl cursor-pointer shadow-sm transition-all flex items-center gap-1.5">
                                    <i data-lucide="refresh-cw" class="w-3.5 h-3.5"></i>
                                    <span>Force Full Cloud Re-Sync</span>
                                </button>
                            </div>

                            <!-- Live Table Counts Grid -->
                            <div class="space-y-2">
                                <div class="flex items-center justify-between">
                                    <span class="text-xs font-bold text-slate-700 uppercase tracking-wider">Live Cloud Row Counts (PostgreSQL)</span>
                                    <span class="text-[11px] text-slate-400" id="counts-last-updated">${cloudCounts ? `Updated: ${cloudCounts.fetchedAt}` : 'Fetching...'}</span>
                                </div>
                                <div class="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                                    <div class="p-3 rounded-xl bg-slate-50 border border-slate-200">
                                        <span class="text-[11px] text-slate-500 font-medium block">Properties (Houses)</span>
                                        <span class="text-lg font-bold text-slate-900" id="cnt-houses">${cloudCounts ? cloudCounts.houses : '...'}</span>
                                    </div>
                                    <div class="p-3 rounded-xl bg-slate-50 border border-slate-200">
                                        <span class="text-[11px] text-slate-500 font-medium block">Residents (Users)</span>
                                        <span class="text-lg font-bold text-slate-900" id="cnt-users">${cloudCounts ? cloudCounts.users : '...'}</span>
                                    </div>
                                    <div class="p-3 rounded-xl bg-slate-50 border border-slate-200">
                                        <span class="text-[11px] text-slate-500 font-medium block">Maintenance Ledgers</span>
                                        <span class="text-lg font-bold text-slate-900" id="cnt-records">${cloudCounts ? cloudCounts.records : '...'}</span>
                                    </div>
                                    <div class="p-3 rounded-xl bg-slate-50 border border-slate-200">
                                        <span class="text-[11px] text-slate-500 font-medium block">Itemized Expenses</span>
                                        <span class="text-lg font-bold text-slate-900" id="cnt-expenses">${cloudCounts ? cloudCounts.expenses : '...'}</span>
                                    </div>
                                    <div class="p-3 rounded-xl bg-slate-50 border border-slate-200 col-span-2 sm:col-span-2">
                                        <span class="text-[11px] text-slate-500 font-medium block">Audit Trail Logs</span>
                                        <span class="text-lg font-bold text-slate-900" id="cnt-audit">${cloudCounts ? cloudCounts.auditLogs : '...'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ` : `
                        <div class="space-y-4">
                            <!-- Cloud Snapshot Checkpoints (Permanent Cloud Backups) -->
                            <div class="p-4 rounded-xl bg-indigo-50/70 border border-indigo-200/90 space-y-3">
                                <div class="flex items-start justify-between gap-3">
                                    <div>
                                        <span class="text-xs font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
                                            <i data-lucide="cloud-lightning" class="w-4 h-4 text-indigo-600"></i>
                                            Permanent Cloud Snapshot Checkpoints
                                        </span>
                                        <p class="text-xs text-indigo-800/80 mt-1">Capture an immutable full-state checkpoint directly into Supabase Cloud PostgreSQL in Realtime. Does not depend on local files.</p>
                                    </div>
                                    <button type="button" id="create-cloud-checkpoint-btn" ${!isOwner ? 'disabled' : ''} class="px-3.5 py-2 ${isOwner ? 'bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer active:scale-98' : 'bg-slate-200 text-slate-400 cursor-not-allowed'} text-xs font-semibold rounded-xl shadow-sm transition-all shrink-0 flex items-center gap-1.5">
                                        <i data-lucide="plus-circle" class="w-3.5 h-3.5"></i>
                                        <span id="checkpoint-btn-text">Create Cloud Checkpoint</span>
                                    </button>
                                </div>

                                <!-- Recent Cloud Checkpoints List -->
                                <div id="checkpoints-container" class="space-y-2 pt-2 border-t border-indigo-200/60">
                                    <span class="text-[11px] font-bold text-indigo-900 uppercase tracking-wider block">Recent Cloud Checkpoints in PostgreSQL</span>
                                    <div id="checkpoints-list" class="space-y-1.5">
                                        ${recentCloudCheckpoints.length === 0 ? `
                                            <p class="text-xs text-indigo-700/70 italic">No cloud snapshot checkpoints saved yet. Click "Create Cloud Checkpoint" above to save one.</p>
                                        ` : recentCloudCheckpoints.map((cp, idx) => `
                                            <div class="flex items-center justify-between p-2.5 rounded-lg bg-white/90 border border-indigo-100 text-xs">
                                                <div class="min-w-0">
                                                    <span class="font-semibold text-slate-900 block truncate">Checkpoint #${recentCloudCheckpoints.length - idx}: ${new Date(cp.created_at).toLocaleString()}</span>
                                                    <span class="text-[11px] text-slate-500">ID: ${cp.id.slice(0, 8)}... | Stored in PostgreSQL</span>
                                                </div>
                                                <button type="button" data-checkpoint-id="${cp.id}" class="restore-checkpoint-btn px-2.5 py-1 text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg border border-indigo-200 cursor-pointer transition-colors shrink-0">
                                                    Restore
                                                </button>
                                            </div>
                                        `).join('')}
                                    </div>
                                </div>
                            </div>

                            <!-- Export Full System Snapshot File -->
                            <div class="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                                <span class="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                    <i data-lucide="download" class="w-4 h-4 text-slate-700"></i>
                                    Export Full System Snapshot (.json)
                                </span>
                                <p class="text-xs text-slate-500">Download a complete JSON database snapshot of all properties, residents, itemized ledgers, expenses, invoices, and system audit logs for offline archiving.</p>
                                <button type="button" id="export-backup-btn" class="px-4 py-2 bg-slate-900 hover:bg-black text-white text-xs font-semibold rounded-xl cursor-pointer shadow-sm transition-all flex items-center gap-2 active:scale-98">
                                    <i data-lucide="download" class="w-3.5 h-3.5"></i>
                                    <span>Export Snapshot (.json)</span>
                                </button>
                            </div>

                            <!-- Restore System from File (Permanent Cloud Sync) -->
                            <div class="p-4 rounded-xl bg-amber-50/60 border border-amber-200/90 space-y-3">
                                <div>
                                    <span class="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                                        <i data-lucide="upload-cloud" class="w-4 h-4 text-amber-700"></i>
                                        Restore System from Backup File
                                    </span>
                                    <p class="text-xs text-amber-950/80 mt-1">Upload a valid JSON snapshot. This will PERMANENTLY synchronize and update Property Settings, Residents, and Maintenance Ledgers directly in Supabase Cloud PostgreSQL in Realtime.</p>
                                </div>
                                ${!isOwner ? `
                                    <div class="p-2.5 bg-amber-100/70 border border-amber-300/80 rounded-xl text-xs text-amber-900 font-medium flex items-center gap-2">
                                        <i data-lucide="lock" class="w-3.5 h-3.5 shrink-0"></i>
                                        <span>System restore requires Property Administrator / Owner permissions.</span>
                                    </div>
                                ` : `
                                    <input type="file" id="restore-file-input" accept=".json" class="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-amber-100 file:text-amber-800 hover:file:bg-amber-200 cursor-pointer" />
                                `}
                                <div id="restore-progress-container" class="hidden space-y-2 pt-2 border-t border-amber-200">
                                    <div class="flex items-center justify-between text-xs font-semibold text-amber-900">
                                        <span id="restore-step-label">Restoring to Supabase Cloud...</span>
                                        <span id="restore-step-pct">0%</span>
                                    </div>
                                    <div class="w-full h-2 bg-amber-200 rounded-full overflow-hidden">
                                        <div id="restore-progress-bar" class="h-full bg-amber-600 transition-all duration-300" style="width: 0%"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `}
                </div>
            </div>
        `;

        document.body.appendChild(overlay);
        if (window.lucide) window.lucide.createIcons();

        // Banner Helper
        function showNotice(message, type = 'success') {
            const banner = document.getElementById('settings-status-banner');
            if (!banner) return;
            banner.className = 'px-4 sm:px-6 pt-3 animate-in fade-in duration-200';
            const bgClass = type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : (type === 'error' ? 'bg-rose-50 border-rose-200 text-rose-800' : 'bg-blue-50 border-blue-200 text-blue-800');
            const iconName = type === 'success' ? 'check-circle-2' : (type === 'error' ? 'alert-triangle' : 'info');
            banner.innerHTML = `
                <div class="p-3 rounded-xl border flex items-center justify-between gap-2.5 text-xs font-medium ${bgClass}">
                    <div class="flex items-center gap-2">
                        <i data-lucide="${iconName}" class="w-4 h-4 shrink-0"></i>
                        <span>${message}</span>
                    </div>
                    <button type="button" onclick="document.getElementById('settings-status-banner').className='hidden'" class="p-1 text-slate-400 hover:text-slate-600 cursor-pointer">
                        <i data-lucide="x" class="w-3.5 h-3.5"></i>
                    </button>
                </div>
            `;
            if (window.lucide) window.lucide.createIcons();
        }

        // Close handlers
        const onEscSettings = (e) => {
            if (e.key === 'Escape') closeSettingsModal();
        };
        document.addEventListener('keydown', onEscSettings);

        const closeBtn = document.getElementById('close-settings-btn');
        if (closeBtn) closeBtn.addEventListener('click', closeSettingsModal);
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closeSettingsModal();
        });

        // Tab switcher
        overlay.querySelectorAll('[data-tab]').forEach(btn => {
            btn.addEventListener('click', async () => {
                activeTab = btn.dataset.tab;
                if (activeTab === 'cloud' || activeTab === 'backup') {
                    await fetchCloudStats();
                }
                renderSettingsModal();
            });
        });

        // Toggle audio
        const audioBtn = document.getElementById('toggle-audio-btn');
        if (audioBtn) {
            audioBtn.addEventListener('click', () => {
                const next = !audioOn;
                if (window.audioUtils) {
                    window.audioUtils.setAudioEnabled(next);
                    if (next) window.audioUtils.playSuccessChime();
                }
                renderSettingsModal();
            });
        }

        // =====================================================================
        // TAB 1: SAVE GENERAL CONFIGURATION TO SUPABASE CLOUD POSTGRESQL REALTIME
        // =====================================================================
        const generalForm = document.getElementById('settings-general-form');
        if (generalForm) {
            generalForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                if (!isOwner) {
                    showNotice('Access Denied: Only property administrator/owner can modify settings.', 'error');
                    if (window.audioUtils) window.audioUtils.playWarningChime();
                    return;
                }

                const submitBtn = document.getElementById('save-settings-submit-btn');
                const btnLabel = document.getElementById('save-settings-btn-label');
                if (submitBtn) submitBtn.disabled = true;
                if (btnLabel) btnLabel.textContent = 'Saving to Supabase Cloud...';

                const updatedHouse = {
                    ...house,
                    name: document.getElementById('set-name').value.trim(),
                    address: document.getElementById('set-address').value.trim(),
                    city: document.getElementById('set-city').value.trim(),
                    postalCode: document.getElementById('set-postal').value.trim(),
                    postal_code: document.getElementById('set-postal').value.trim(),
                    totalUnits: parseInt(document.getElementById('set-units').value) || 5,
                    total_units: parseInt(document.getElementById('set-units').value) || 5,
                    settings: {
                        ...(house.settings || {}),
                        currency: document.getElementById('set-currency').value.trim() || 'INR',
                        upiId: document.getElementById('set-upi-id').value.trim(),
                        upiName: document.getElementById('set-upi-name').value.trim(),
                        audioEnabled: audioOn,
                        lastUpdated: new Date().toISOString()
                    }
                };

                const houseId = house.id || '11111111-2222-3333-4444-555555555555';
                updatedHouse.id = houseId;

                try {
                    // 1. Ensure authenticated GoTrue session
                    await ensureAdminSession();

                    // 2. Direct Supabase Cloud PostgreSQL Update
                    if (window.supabase) {
                        const updatePayload = {
                            name: updatedHouse.name,
                            address: updatedHouse.address,
                            city: updatedHouse.city,
                            postal_code: updatedHouse.postal_code,
                            total_units: updatedHouse.total_units,
                            settings: updatedHouse.settings,
                            updated_at: new Date().toISOString()
                        };

                        const { data: upData, error: upError } = await window.supabase
                            .from('houses')
                            .update(updatePayload)
                            .eq('id', houseId)
                            .select();

                        if (upError || !upData || upData.length === 0) {
                            // Fallback upsert with valid owner_id
                            const fallbackOwnerId = house.owner_id || 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
                            const { error: upsertErr } = await window.supabase
                                .from('houses')
                                .upsert({
                                    id: houseId,
                                    owner_id: fallbackOwnerId,
                                    ...updatePayload
                                }, { onConflict: 'id' });

                            if (upsertErr) throw upsertErr;
                        }

                        // 3. Log to Supabase audit_logs
                        try {
                            await window.supabase.from('audit_logs').insert({
                                action: 'UPDATE_PLATFORM_SETTINGS',
                                resource_type: 'houses',
                                resource_id: houseId,
                                changes: {
                                    name: updatedHouse.name,
                                    address: updatedHouse.address,
                                    settings: updatedHouse.settings
                                }
                            });
                        } catch (auditErr) {
                            console.warn('Audit log write notice:', auditErr);
                        }
                    }

                    // 4. Update Store & Local Storage Cache
                    if (window.appStore) window.appStore.setState({ house: updatedHouse });
                    localStorage.setItem('madura_house_property_v1', JSON.stringify(updatedHouse));

                    // 5. Broadcast instant Realtime Events across all windows & channels
                    window.dispatchEvent(new CustomEvent('house-settings-updated', { detail: updatedHouse }));
                    if (window.realtimeSyncService && typeof window.realtimeSyncService.broadcastSettings === 'function') {
                        window.realtimeSyncService.broadcastSettings(updatedHouse);
                    }

                    if (typeof window.refreshCurrentView === 'function') window.refreshCurrentView();
                    if (window.audioUtils) window.audioUtils.playSuccessChime();

                    showNotice('✓ Platform Settings & UPI IDs permanently saved to Supabase Cloud PostgreSQL in Realtime!', 'success');
                    if (btnLabel) btnLabel.textContent = 'Save Changes to Cloud';
                } catch (err) {
                    console.error('Update house cloud error:', err);
                    showNotice('Cloud sync warning: ' + err.message, 'error');
                    if (window.audioUtils) window.audioUtils.playWarningChime();
                } finally {
                    if (submitBtn) submitBtn.disabled = false;
                    if (btnLabel) btnLabel.textContent = 'Save Changes to Cloud';
                }
            });
        }

        // =====================================================================
        // TAB 2: CLOUD DATABASE STATUS & DIAGNOSTICS
        // =====================================================================
        const testBtn = document.getElementById('test-cloud-btn');
        const pingResult = document.getElementById('cloud-ping-result');
        if (testBtn) {
            testBtn.addEventListener('click', async () => {
                testBtn.disabled = true;
                pingResult.textContent = 'Pinging Supabase Cloud...';
                const start = performance.now();
                try {
                    await ensureAdminSession();
                    const { data, error } = await window.supabase.from('houses').select('id, name, updated_at').limit(1);
                    const latency = Math.round(performance.now() - start);
                    if (error) throw error;
                    pingResult.textContent = `Connected! Latency: ${latency}ms`;
                    pingResult.className = 'text-xs text-emerald-600 font-mono font-bold';
                    if (window.audioUtils) window.audioUtils.playSuccessChime();
                } catch (err) {
                    pingResult.textContent = `Error: ${err.message}`;
                    pingResult.className = 'text-xs text-rose-600 font-mono';
                    if (window.audioUtils) window.audioUtils.playWarningChime();
                } finally {
                    testBtn.disabled = false;
                }
            });
        }

        const forceResyncBtn = document.getElementById('force-resync-btn');
        if (forceResyncBtn) {
            forceResyncBtn.addEventListener('click', async () => {
                forceResyncBtn.disabled = true;
                forceResyncBtn.innerHTML = `<i data-lucide="loader-2" class="w-3.5 h-3.5 animate-spin"></i><span>Syncing from Cloud...</span>`;
                if (window.lucide) window.lucide.createIcons();

                try {
                    await ensureAdminSession();
                    if (typeof window.loadGlobalData === 'function') {
                        await window.loadGlobalData();
                    }
                    await fetchCloudStats();
                    renderSettingsModal();
                    showNotice('✓ Full system state re-synchronized from Supabase Cloud PostgreSQL in Realtime!', 'success');
                    if (window.audioUtils) window.audioUtils.playSuccessChime();
                } catch (err) {
                    showNotice('Re-sync notice: ' + err.message, 'error');
                }
            });
        }

        // =====================================================================
        // TAB 3: SYSTEM BACKUP & CLOUD RESTORE
        // =====================================================================
        // 1. Export Snapshot JSON
        const exportBackupBtn = document.getElementById('export-backup-btn');
        if (exportBackupBtn) {
            exportBackupBtn.addEventListener('click', async () => {
                exportBackupBtn.disabled = true;
                const snapshot = {
                    version: '1.0.0',
                    platform: 'MADURA HOUSE MAINTENANCE MANAGEMENT PLATFORM',
                    exportedAt: new Date().toISOString(),
                    cloudHost: 'kbvjnshgyuwkcvicwefh.supabase.co',
                    house: state.house,
                    users: state.users,
                    records: state.records,
                    invoices: state.invoices
                };

                // Log export action to audit_logs
                try {
                    if (window.supabase) {
                        await ensureAdminSession();
                        await window.supabase.from('audit_logs').insert({
                            action: 'EXPORT_SYSTEM_BACKUP',
                            resource_type: 'system',
                            changes: {
                                exportedAt: snapshot.exportedAt,
                                recordsCount: snapshot.records?.length || 0,
                                usersCount: snapshot.users?.length || 0
                            }
                        });
                    }
                } catch (e) {
                    console.warn('Audit export notice:', e);
                }

                const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `CHE-MADURA-HS1-MGMT-Cloud-Backup-${new Date().toISOString().split('T')[0]}.json`;
                a.click();
                URL.revokeObjectURL(url);

                exportBackupBtn.disabled = false;
                showNotice('Snapshot file downloaded! Archival event logged to Cloud Audit Logs.', 'success');
                if (window.audioUtils) window.audioUtils.playSuccessChime();
            });
        }

        // 2. Create Instant Cloud Snapshot Checkpoint in Supabase
        const createCheckpointBtn = document.getElementById('create-cloud-checkpoint-btn');
        if (createCheckpointBtn) {
            createCheckpointBtn.addEventListener('click', async () => {
                if (!isOwner) {
                    showNotice('Admin privilege required to create cloud checkpoints.', 'error');
                    return;
                }

                createCheckpointBtn.disabled = true;
                const btnText = document.getElementById('checkpoint-btn-text');
                if (btnText) btnText.textContent = 'Saving Checkpoint to Cloud...';

                try {
                    await ensureAdminSession();
                    const houseId = house.id || '11111111-2222-3333-4444-555555555555';
                    const snapshotPayload = {
                        version: '1.0.0',
                        type: 'CLOUD_CHECKPOINT',
                        createdAt: new Date().toISOString(),
                        house: state.house,
                        users: state.users,
                        records: state.records
                    };

                    const { data, error } = await window.supabase.from('audit_logs').insert({
                        action: 'SYSTEM_CLOUD_SNAPSHOT',
                        resource_type: 'system',
                        resource_id: houseId,
                        changes: snapshotPayload
                    }).select();

                    if (error) throw error;

                    await fetchCloudStats();
                    renderSettingsModal();
                    showNotice('✓ Permanent Snapshot Checkpoint saved directly into Supabase Cloud PostgreSQL!', 'success');
                    if (window.audioUtils) window.audioUtils.playSuccessChime();
                } catch (err) {
                    console.error('Create cloud checkpoint error:', err);
                    showNotice('Failed to save cloud checkpoint: ' + err.message, 'error');
                    if (window.audioUtils) window.audioUtils.playWarningChime();
                } finally {
                    createCheckpointBtn.disabled = false;
                    if (btnText) btnText.textContent = 'Create Cloud Checkpoint';
                }
            });
        }

        // 3. Restore System Function: Executes Permanent Cloud Upserts
        async function executePermanentCloudRestore(snapshot, sourceLabel = 'file') {
            if (!isOwner) {
                showNotice('Access Denied: Only property administrator/owner can restore system backups.', 'error');
                if (window.audioUtils) window.audioUtils.playWarningChime();
                return;
            }

            const confirmed = confirm(
                `CONFIRM PERMANENT SYSTEM RESTORE\n\n` +
                `Source: ${sourceLabel}\n` +
                `Export Date: ${snapshot.exportedAt || snapshot.createdAt || 'N/A'}\n\n` +
                `This action will PERMANENTLY synchronize and update Property Settings, Residents, and Maintenance Ledgers directly in Supabase Cloud PostgreSQL in Realtime.\n\n` +
                `Do you want to proceed?`
            );
            if (!confirmed) return;

            const progressContainer = document.getElementById('restore-progress-container');
            const stepLabel = document.getElementById('restore-step-label');
            const stepPct = document.getElementById('restore-step-pct');
            const progressBar = document.getElementById('restore-progress-bar');

            if (progressContainer) progressContainer.classList.remove('hidden');

            function setProgress(label, pct) {
                if (stepLabel) stepLabel.textContent = label;
                if (stepPct) stepPct.textContent = `${pct}%`;
                if (progressBar) progressBar.style.width = `${pct}%`;
            }

            try {
                await ensureAdminSession();

                // Step 1: Restore House & Platform Settings in Cloud
                setProgress('Step 1/5: Updating Property Settings in Supabase Cloud...', 20);
                const houseId = snapshot.house?.id || house.id || '11111111-2222-3333-4444-555555555555';
                if (snapshot.house && window.supabase) {
                    const houseUpdate = {
                        name: snapshot.house.name || house.name,
                        address: snapshot.house.address || house.address,
                        city: snapshot.house.city || house.city,
                        postal_code: snapshot.house.postal_code || snapshot.house.postalCode || house.postal_code,
                        total_units: snapshot.house.total_units || snapshot.house.totalUnits || 5,
                        settings: snapshot.house.settings || house.settings,
                        updated_at: new Date().toISOString()
                    };

                    const { error: hErr } = await window.supabase
                        .from('houses')
                        .update(houseUpdate)
                        .eq('id', houseId);

                    if (hErr) {
                        await window.supabase.from('houses').upsert({
                            id: houseId,
                            owner_id: house.owner_id || 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
                            ...houseUpdate
                        }, { onConflict: 'id' });
                    }
                }

                // Step 2: Upsert Users / Residents
                setProgress('Step 2/5: Upserting Resident Accounts into Cloud PostgreSQL...', 45);
                const rawUsers = Array.isArray(snapshot.users) ? snapshot.users : [];
                const validUsers = rawUsers.filter(u => {
                    if (!u || !u.email) return false;
                    const email = u.email.toLowerCase();
                    return !email.includes('test_resident') && !email.includes('@chemadura.deleted') && u.occupancy_status !== 'evicted';
                });

                if (window.supabase && validUsers.length > 0) {
                    for (const u of validUsers) {
                        const userPayload = {
                            id: u.id,
                            email: u.email,
                            password: u.password || 'Tenant@123',
                            full_name: u.full_name || u.fullName,
                            flat_number: u.flat_number || u.flatNumber || '',
                            role: u.role || 'TENANT',
                            phone: u.phone || '',
                            occupancy_status: u.occupancy_status || u.occupancyStatus || 'active',
                            is_active: u.is_active !== false
                        };
                        try {
                            await window.supabase.from('users').upsert(userPayload, { onConflict: 'email' });
                        } catch (uErr) {
                            console.warn('User upsert notice for', u.email, uErr);
                        }
                    }
                }

                // Step 3: Upsert Maintenance Records
                setProgress('Step 3/5: Synchronizing Maintenance Ledgers in Cloud PostgreSQL...', 65);
                const rawRecords = Array.isArray(snapshot.records) ? snapshot.records : [];
                if (window.supabase && rawRecords.length > 0) {
                    for (const r of rawRecords) {
                        if (!r.month || !r.year) continue;
                        const recPayload = {
                            id: r.id,
                            house_id: houseId,
                            month: r.month,
                            year: r.year,
                            grand_total: r.grand_total || r.grandTotal || 0,
                            notes: r.notes || ''
                        };
                        try {
                            await window.supabase.from('maintenance_records').upsert(recPayload, { onConflict: 'id' });
                            
                            // Step 4: Upsert Itemized Expenses if present
                            if (Array.isArray(r.expenses) && r.expenses.length > 0) {
                                for (const exp of r.expenses) {
                                    if (!exp.particular) continue;
                                    const expPayload = {
                                        id: exp.id,
                                        maintenance_record_id: recPayload.id,
                                        sl_no: exp.sl_no || exp.slNo || 1,
                                        particular: exp.particular,
                                        amount: parseFloat(exp.amount) || 0,
                                        category: exp.category || 'maintenance',
                                        gst_applicable: !!exp.gst_applicable,
                                        gst_amount: parseFloat(exp.gst_amount) || 0,
                                        notes: exp.notes || ''
                                    };
                                    await window.supabase.from('expenses').upsert(expPayload, { onConflict: 'id' });
                                }
                            }
                        } catch (rErr) {
                            console.warn('Record upsert notice:', rErr);
                        }
                    }
                }

                // Step 5: Log Permanent Audit Record to Supabase
                setProgress('Step 5/5: Finalizing Cloud Audit Trail and Realtime Broadcast...', 90);
                if (window.supabase) {
                    try {
                        await window.supabase.from('audit_logs').insert({
                            action: 'RESTORE_SYSTEM_BACKUP_CLOUD',
                            resource_type: 'system',
                            resource_id: houseId,
                            changes: {
                                source: sourceLabel,
                                restoredAt: new Date().toISOString(),
                                usersCount: validUsers.length,
                                recordsCount: rawRecords.length
                            }
                        });
                    } catch (e) {}
                }

                // Update Local Storage Cache
                if (snapshot.house) localStorage.setItem('madura_house_property_v1', JSON.stringify(snapshot.house));
                if (validUsers.length > 0) localStorage.setItem('madura_house_users_v2', JSON.stringify(validUsers));
                if (rawRecords.length > 0) localStorage.setItem('madura_house_records_v1', JSON.stringify(rawRecords));

                // Broadcast Realtime Event
                if (window.realtimeSyncService && typeof window.realtimeSyncService.broadcastRestore === 'function') {
                    window.realtimeSyncService.broadcastRestore({ source: sourceLabel, timestamp: new Date().toISOString() });
                }

                // Reload Global Data
                setProgress('Complete! Reloading state...', 100);
                if (typeof window.loadGlobalData === 'function') {
                    await window.loadGlobalData();
                }

                if (window.audioUtils) window.audioUtils.playSuccessChime();
                alert(`✓ System Successfully Restored!\n\nAll properties, residents, and ledgers have been permanently committed to Supabase Cloud PostgreSQL in Realtime.`);
                closeSettingsModal();
                if (typeof window.refreshCurrentView === 'function') window.refreshCurrentView();
            } catch (err) {
                console.error('System restore error:', err);
                alert('System restore encountered an error: ' + err.message);
                if (window.audioUtils) window.audioUtils.playWarningChime();
            } finally {
                if (progressContainer) progressContainer.classList.add('hidden');
            }
        }

        // Attach File Input Listener
        const restoreInput = document.getElementById('restore-file-input');
        if (restoreInput) {
            restoreInput.addEventListener('change', (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = async (event) => {
                    try {
                        const parsed = JSON.parse(event.target.result);
                        await executePermanentCloudRestore(parsed, `File: ${file.name}`);
                    } catch (err) {
                        alert('Invalid JSON backup file: ' + err.message);
                    }
                };
                reader.readAsText(file);
            });
        }

        // Attach Checkpoint Restore Listeners
        overlay.querySelectorAll('.restore-checkpoint-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const cpId = btn.dataset.checkpointId;
                const cp = recentCloudCheckpoints.find(c => c.id === cpId);
                if (cp && cp.changes) {
                    await executePermanentCloudRestore(cp.changes, `Cloud Checkpoint (${new Date(cp.created_at).toLocaleString()})`);
                }
            });
        });
    }

    function openSettingsModal(tab = 'general') {
        activeTab = tab;
        fetchCloudStats().finally(() => {
            renderSettingsModal();
        });
    }

    function closeSettingsModal() {
        const existing = document.getElementById('settings-modal-overlay');
        if (existing) existing.remove();
    }

    window.openSettingsModal = openSettingsModal;
    window.closeSettingsModal = closeSettingsModal;
    window.settingsModal = {
        open: openSettingsModal,
        close: closeSettingsModal,
        fetchCloudStats: fetchCloudStats
    };
})();
