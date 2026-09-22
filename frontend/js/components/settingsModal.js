// Settings & System Backup/Restore Modal
// Ported from React SettingsModal.tsx

(function() {
    let activeTab = 'general';

    function renderSettingsModal() {
        let existing = document.getElementById('settings-modal-overlay');
        if (existing) existing.remove();

        const state = window.appStore ? window.appStore.getState() : {};
        const house = state.house || {
            name: 'CHE-MADURA HS-1 MGMT',
            address: '91/16, Kovilpatti Gopalakrishnan Street, Karthikeyan Nagar, Maduravoyal',
            city: 'Chennai',
            postalCode: '600095',
            totalUnits: 5,
            settings: { currency: 'INR', upiId: '', upiName: 'Sampath Kumar' }
        };
        const audioOn = window.audioUtils ? window.audioUtils.isAudioEnabled() : true;

        const overlay = document.createElement('div');
        overlay.id = 'settings-modal-overlay';
        overlay.className = 'fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-in fade-in duration-100 backdrop-blur-xs';
        overlay.innerHTML = `
            <div class="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
                <!-- Header -->
                <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center">
                            <i data-lucide="settings" class="w-5 h-5"></i>
                        </div>
                        <div>
                            <h2 class="text-base font-bold text-slate-900">Platform Settings & Backups</h2>
                            <p class="text-xs text-slate-500">Property metadata, audio feedback, and database snapshots</p>
                        </div>
                    </div>
                    <button type="button" id="close-settings-btn" class="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer">
                        <i data-lucide="x" class="w-5 h-5"></i>
                    </button>
                </div>

                <!-- Tabs -->
                <div class="flex border-b border-slate-100 px-6 gap-6 text-xs font-semibold">
                    <button type="button" class="py-3 border-b-2 transition-colors cursor-pointer ${activeTab === 'general' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-600'}" data-tab="general">
                        General Configuration
                    </button>
                    <button type="button" class="py-3 border-b-2 transition-colors cursor-pointer ${activeTab === 'cloud' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-600'}" data-tab="cloud">
                        Cloud Database Status
                    </button>
                    <button type="button" class="py-3 border-b-2 transition-colors cursor-pointer ${activeTab === 'backup' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-600'}" data-tab="backup">
                        System Backup & Restore
                    </button>
                </div>

                <!-- Tab Content Body -->
                <div class="p-6 overflow-y-auto flex-1 space-y-5 text-sm">
                    ${activeTab === 'general' ? `
                        <form id="settings-general-form" class="space-y-4">
                            <div>
                                <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Property Name</label>
                                <input id="set-name" required value="${house.name || 'CHE-MADURA HS-1 MGMT'}" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-black" />
                            </div>
                            <div>
                                <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Street Address</label>
                                <input id="set-address" required value="${house.address || '91/16, Kovilpatti Gopalakrishnan Street, Karthikeyan Nagar, Maduravoyal'}" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-black" />
                            </div>
                            <div class="grid grid-cols-2 gap-3">
                                <div>
                                    <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">City</label>
                                    <input id="set-city" required value="${house.city || 'Chennai'}" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-black" />
                                </div>
                                <div>
                                    <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Postal Code</label>
                                    <input id="set-postal" required value="${house.postalCode || '600095'}" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-black" />
                                </div>
                            </div>
                            <div class="grid grid-cols-2 gap-3">
                                <div>
                                    <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Total Units / Flats</label>
                                    <input id="set-units" required type="number" value="${house.totalUnits || 5}" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-black" />
                                </div>
                                <div>
                                    <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Currency Code</label>
                                    <input id="set-currency" required value="${house.settings?.currency || 'INR'}" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-black" />
                                </div>
                            </div>
                            <div class="grid grid-cols-2 gap-3">
                                <div>
                                    <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">UPI ID for Collections</label>
                                    <input id="set-upi-id" placeholder="e.g. 7338716690@ybl" value="${house.settings?.upiId || ''}" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-black" />
                                </div>
                                <div>
                                    <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">UPI Payee Name</label>
                                    <input id="set-upi-name" placeholder="e.g. Sampath Kumar" value="${house.settings?.upiName || ''}" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-black" />
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
                            <div class="flex justify-end pt-3">
                                <button type="submit" class="px-5 py-2.5 bg-slate-900 hover:bg-black text-white text-xs font-semibold rounded-xl cursor-pointer shadow-sm transition-all">Save Changes</button>
                            </div>
                        </form>
                    ` : activeTab === 'cloud' ? `
                        <div class="space-y-4">
                            <div class="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                                <span class="text-xs font-bold text-slate-700 uppercase tracking-wider">Cloud PostgreSQL Instance</span>
                                <p class="text-xs text-slate-500 font-mono">kbvjnshgyuwkcvicwefh.supabase.co</p>
                                <div class="flex items-center gap-2 pt-2">
                                    <span class="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                                    <span class="text-xs font-semibold text-emerald-700">Database Engine Online</span>
                                </div>
                            </div>
                            <div class="flex items-center gap-3">
                                <button type="button" id="test-cloud-btn" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl cursor-pointer shadow-sm transition-all flex items-center gap-2">
                                    <i data-lucide="refresh-cw" class="w-3.5 h-3.5"></i>
                                    <span>Run Diagnostics Ping</span>
                                </button>
                                <span id="cloud-ping-result" class="text-xs text-slate-500 font-mono"></span>
                            </div>
                        </div>
                    ` : `
                        <div class="space-y-4">
                            <div class="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                                <span class="text-xs font-bold text-slate-700 uppercase tracking-wider">Export Full System Snapshot</span>
                                <p class="text-xs text-slate-500">Download a complete JSON database snapshot of all properties, residents, itemized ledgers, expenses, invoices, and audit logs.</p>
                                <button type="button" id="export-backup-btn" class="px-4 py-2 bg-slate-900 hover:bg-black text-white text-xs font-semibold rounded-xl cursor-pointer shadow-sm transition-all flex items-center gap-2">
                                    <i data-lucide="download" class="w-3.5 h-3.5"></i>
                                    <span>Export Snapshot (.json)</span>
                                </button>
                            </div>

                            <div class="p-4 rounded-xl bg-amber-50/50 border border-amber-200/80 space-y-3">
                                <span class="text-xs font-bold text-amber-800 uppercase tracking-wider">Restore System from Backup</span>
                                <p class="text-xs text-slate-600">Upload a valid JSON backup file to overwrite or restore resident and maintenance ledger data.</p>
                                <input type="file" id="restore-file-input" accept=".json" class="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-amber-100 file:text-amber-800 hover:file:bg-amber-200 cursor-pointer" />
                            </div>
                        </div>
                    `}
                </div>
            </div>
        `;

        document.body.appendChild(overlay);
        if (window.lucide) window.lucide.createIcons();

        // Close handlers
        const closeBtn = document.getElementById('close-settings-btn');
        if (closeBtn) closeBtn.addEventListener('click', closeSettingsModal);
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closeSettingsModal();
        });

        // Tab switcher
        overlay.querySelectorAll('[data-tab]').forEach(btn => {
            btn.addEventListener('click', () => {
                activeTab = btn.dataset.tab;
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

        // Save General Form
        const generalForm = document.getElementById('settings-general-form');
        if (generalForm) {
            generalForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const updatedHouse = {
                    ...house,
                    name: document.getElementById('set-name').value.trim(),
                    address: document.getElementById('set-address').value.trim(),
                    city: document.getElementById('set-city').value.trim(),
                    postalCode: document.getElementById('set-postal').value.trim(),
                    totalUnits: parseInt(document.getElementById('set-units').value) || 5,
                    settings: {
                        currency: document.getElementById('set-currency').value.trim() || 'INR',
                        upiId: document.getElementById('set-upi-id').value.trim(),
                        upiName: document.getElementById('set-upi-name').value.trim()
                    }
                };

                try {
                    localStorage.setItem('madura_house_property_v1', JSON.stringify(updatedHouse));
                    if (window.supabase) {
                        await window.supabase.from('houses').update({
                            name: updatedHouse.name,
                            address: updatedHouse.address,
                            city: updatedHouse.city,
                            postal_code: updatedHouse.postalCode,
                            total_units: updatedHouse.totalUnits,
                            settings: updatedHouse.settings
                        }).eq('id', house.id);
                    }
                } catch (err) {
                    console.error('Update house error:', err);
                }

                if (window.appStore) window.appStore.setState({ house: updatedHouse });
                if (window.audioUtils) window.audioUtils.playSuccessChime();
                alert('Property profile settings saved successfully!');
                closeSettingsModal();
            });
        }

        // Test Cloud DB Ping
        const testBtn = document.getElementById('test-cloud-btn');
        const pingResult = document.getElementById('cloud-ping-result');
        if (testBtn) {
            testBtn.addEventListener('click', async () => {
                testBtn.disabled = true;
                pingResult.textContent = 'Pinging Supabase...';
                const start = performance.now();
                try {
                    const { data, error } = await window.supabase.from('houses').select('id, name').limit(1);
                    const latency = Math.round(performance.now() - start);
                    if (error) throw error;
                    pingResult.textContent = `Connected! Latency: ${latency}ms`;
                    pingResult.className = 'text-xs text-emerald-600 font-mono';
                    if (window.audioUtils) window.audioUtils.playSuccessChime();
                } catch (err) {
                    pingResult.textContent = `Error: ${err.message}`;
                    pingResult.className = 'text-xs text-rose-600 font-mono';
                    if (window.audioUtils) window.audioUtils.playWarningChime();
                }
                testBtn.disabled = false;
            });
        }

        // Export Snapshot Backup
        const exportBackupBtn = document.getElementById('export-backup-btn');
        if (exportBackupBtn) {
            exportBackupBtn.addEventListener('click', () => {
                const snapshot = {
                    version: '1.0.0',
                    exportedAt: new Date().toISOString(),
                    house: state.house,
                    users: state.users,
                    records: state.records,
                    invoices: state.invoices
                };
                const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `CHE-MADURA-HS1-MGMT-Backup-${new Date().toISOString().split('T')[0]}.json`;
                a.click();
                URL.revokeObjectURL(url);
                if (window.audioUtils) window.audioUtils.playSuccessChime();
            });
        }

        // Restore Backup
        const restoreInput = document.getElementById('restore-file-input');
        if (restoreInput) {
            restoreInput.addEventListener('change', (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = async (event) => {
                    try {
                        const parsed = JSON.parse(event.target.result);
                        if (confirm(`Restore system backup from ${parsed.exportedAt || 'file'}? This will update local state.`)) {
                            if (parsed.users) localStorage.setItem('madura_house_users_v2', JSON.stringify(parsed.users));
                            if (parsed.house) localStorage.setItem('madura_house_property_v1', JSON.stringify(parsed.house));
                            if (parsed.records) localStorage.setItem('madura_house_records_v1', JSON.stringify(parsed.records));
                            alert('System snapshot restored! Reloading application data...');
                            if (typeof window.loadGlobalData === 'function') await window.loadGlobalData();
                            closeSettingsModal();
                            window.location.reload();
                        }
                    } catch (err) {
                        alert('Invalid JSON backup file: ' + err.message);
                    }
                };
                reader.readAsText(file);
            });
        }
    }

    function openSettingsModal(tab = 'general') {
        activeTab = tab;
        renderSettingsModal();
    }

    function closeSettingsModal() {
        const existing = document.getElementById('settings-modal-overlay');
        if (existing) existing.remove();
    }

    window.openSettingsModal = openSettingsModal;
    window.closeSettingsModal = closeSettingsModal;
    window.settingsModal = {
        open: openSettingsModal,
        close: closeSettingsModal
    };
})();
