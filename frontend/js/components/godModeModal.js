// God Mode Master Modal Component
// Exclusive Master Property Editor for Sampath Kumar / Property Owner & Admin

(function() {
    let activeGodTab = 'property'; // 'property' | 'ledger' | 'residents' | 'expenses' | 'invoices' | 'announcements' | 'raw'

    function renderGodModeModal() {
        let existing = document.getElementById('god-mode-modal-overlay');
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
        const users = state.users || [];
        const records = state.records || [];
        const currentRecord = records.length > 0 ? records[0] : { month: 9, year: 2026, grandTotal: 0, activeTenantsCount: 5, individualContribution: 0, expenses: [] };
        const expenses = currentRecord.expenses || [];
        const invoices = state.invoices || [];

        const overlay = document.createElement('div');
        overlay.id = 'god-mode-modal-overlay';
        overlay.className = 'fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 animate-in fade-in duration-100 backdrop-blur-xs';
        overlay.innerHTML = `
            <div class="w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
                <!-- Header Banner -->
                <div class="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
                    <div class="flex items-center gap-3">
                        <div class="w-9 h-9 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center shadow-sm">
                            <i data-lucide="sparkles" class="w-5 h-5"></i>
                        </div>
                        <div>
                            <div class="flex items-center gap-2">
                                <h2 class="text-base font-bold text-white tracking-tight">God Maxx Master Property Editor</h2>
                                <span class="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30">Superadmin Privilege</span>
                            </div>
                            <p class="text-xs text-slate-400">Authoritative direct editor for database records, rules, and property configurations</p>
                        </div>
                    </div>
                    <button type="button" id="close-god-btn" class="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer">
                        <i data-lucide="x" class="w-5 h-5"></i>
                    </button>
                </div>

                <!-- Tabs Navigation -->
                <div class="flex border-b border-slate-200 px-6 gap-5 text-xs font-semibold overflow-x-auto bg-[#fafbfc]">
                    ${[
                        { id: 'property', label: '1. Property Master', icon: 'building-2' },
                        { id: 'ledger', label: '2. Billing & Split Rules', icon: 'sliders-horizontal' },
                        { id: 'residents', label: '3. Resident Directory', icon: 'users' },
                        { id: 'expenses', label: '4. Expenses Ledger', icon: 'receipt' },
                        { id: 'invoices', label: '5. Invoices & OCR', icon: 'file-text' },
                        { id: 'announcements', label: '6. Email Broadcast', icon: 'mail' },
                        { id: 'raw', label: '7. Raw JSON Inspector', icon: 'code' }
                    ].map(t => `
                        <button type="button" class="py-3 border-b-2 flex items-center gap-2 shrink-0 transition-colors cursor-pointer ${activeGodTab === t.id ? 'border-slate-900 text-slate-900 font-bold' : 'border-transparent text-slate-500 hover:text-slate-800'}" data-tab="${t.id}">
                            <i data-lucide="${t.icon}" class="w-3.5 h-3.5"></i>
                            <span>${t.label}</span>
                        </button>
                    `).join('')}
                </div>

                <!-- Tab Content Body -->
                <div class="p-6 overflow-y-auto flex-1 text-sm bg-white">
                    ${activeGodTab === 'property' ? `
                        <form id="god-property-form" class="space-y-4">
                            <div class="grid grid-cols-2 gap-4">
                                <div>
                                    <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Property Brand Title</label>
                                    <input id="god-prop-name" required value="${house.name || 'CHE-MADURA HS-1 MGMT'}" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-medium" />
                                </div>
                                <div>
                                    <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Total Flats / Paying Units</label>
                                    <input id="god-prop-units" type="number" required value="${house.totalUnits || 5}" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-medium" />
                                </div>
                            </div>
                            <div>
                                <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Street Address</label>
                                <input id="god-prop-address" required value="${house.address || ''}" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-medium" />
                            </div>
                            <div class="grid grid-cols-3 gap-3">
                                <div>
                                    <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">City</label>
                                    <input id="god-prop-city" required value="${house.city || 'Chennai'}" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-medium" />
                                </div>
                                <div>
                                    <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Postal Code</label>
                                    <input id="god-prop-postal" required value="${house.postalCode || '600095'}" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-medium" />
                                </div>
                                <div>
                                    <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Currency</label>
                                    <input id="god-prop-currency" required value="${house.settings?.currency || 'INR'}" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-medium" />
                                </div>
                            </div>
                            <div class="grid grid-cols-2 gap-4 pt-2">
                                <div>
                                    <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">UPI ID for Rent / Maintenance</label>
                                    <input id="god-prop-upi" value="${house.settings?.upiId || ''}" placeholder="e.g. 7338716690@ybl" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-medium" />
                                </div>
                                <div>
                                    <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">UPI Payee Full Name</label>
                                    <input id="god-prop-upiname" value="${house.settings?.upiName || 'Sampath Kumar'}" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-medium" />
                                </div>
                            </div>
                            <div class="flex justify-end pt-4 border-t border-slate-100">
                                <button type="submit" class="px-5 py-2.5 bg-slate-900 hover:bg-black text-white text-xs font-semibold rounded-xl cursor-pointer shadow-sm">Save Property Profile</button>
                            </div>
                        </form>
                    ` : activeGodTab === 'ledger' ? `
                        <form id="god-ledger-form" class="space-y-4">
                            <div class="grid grid-cols-2 gap-4">
                                <div>
                                    <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Billing Month (1 - 12)</label>
                                    <input id="god-ledger-month" type="number" min="1" max="12" value="${currentRecord.month || 9}" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-medium" />
                                </div>
                                <div>
                                    <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Billing Year</label>
                                    <input id="god-ledger-year" type="number" value="${currentRecord.year || 2026}" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-medium" />
                                </div>
                            </div>
                            <div class="grid grid-cols-2 gap-4">
                                <div>
                                    <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Grand Total Expenditure (₹)</label>
                                    <input id="god-ledger-total" type="number" step="0.01" value="${currentRecord.grand_total || currentRecord.grandTotal || 0}" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-medium" />
                                </div>
                                <div>
                                    <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Active Units for Equal Split</label>
                                    <input id="god-ledger-tenants" type="number" value="${currentRecord.active_tenants_count || currentRecord.activeTenantsCount || 5}" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-medium" />
                                </div>
                            </div>
                            <div>
                                <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Audited Billing Notes / Remarks</label>
                                <textarea id="god-ledger-notes" rows="2" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-medium">${currentRecord.notes || 'September 2026 Active Maintenance Period'}</textarea>
                            </div>
                            <div class="flex justify-end pt-4 border-t border-slate-100">
                                <button type="submit" class="px-5 py-2.5 bg-slate-900 hover:bg-black text-white text-xs font-semibold rounded-xl cursor-pointer shadow-sm">Commit Ledger Rules</button>
                            </div>
                        </form>
                    ` : activeGodTab === 'residents' ? `
                        <div class="space-y-4">
                            <div class="flex items-center justify-between mb-2">
                                <span class="text-xs font-bold text-slate-700 uppercase tracking-wider">Residents & Lease Records (${users.length})</span>
                                <button type="button" id="god-add-res-btn" class="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer">
                                    <i data-lucide="user-plus" class="w-3.5 h-3.5"></i>
                                    <span>Add Resident</span>
                                </button>
                            </div>
                            <div class="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 max-h-96 overflow-y-auto">
                                ${users.map(u => `
                                    <div class="p-3 flex items-center justify-between text-xs hover:bg-slate-50">
                                        <div class="flex items-center gap-3">
                                            <img src="${u.avatar_url || u.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}" class="w-8 h-8 rounded-full object-cover" />
                                            <div>
                                                <div class="font-bold text-slate-900">${u.full_name || u.fullName || 'Resident'}</div>
                                                <div class="text-slate-400 text-[11px]">${u.email} • ${u.flat_number || u.flatNumber || 'Unit'} • ${u.role}</div>
                                            </div>
                                        </div>
                                        <div class="flex items-center gap-2">
                                            <span class="px-2 py-0.5 rounded text-[10px] font-bold ${
                                                (u.payment_status === 'paid' || u.paymentStatus === 'paid') ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                                            }">
                                                ${(u.payment_status || u.paymentStatus || 'paid').toUpperCase()}
                                            </span>
                                            <button type="button" class="god-del-user-btn text-slate-400 hover:text-red-600 p-1 cursor-pointer" data-id="${u.id}">
                                                <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                                            </button>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : activeGodTab === 'expenses' ? `
                        <div class="space-y-4">
                            <div class="flex items-center justify-between mb-2">
                                <span class="text-xs font-bold text-slate-700 uppercase tracking-wider">Itemized Expenses (${expenses.length})</span>
                                <button type="button" id="god-add-exp-btn" class="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer">
                                    <i data-lucide="plus" class="w-3.5 h-3.5"></i>
                                    <span>Add Line Item</span>
                                </button>
                            </div>
                            <div class="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 max-h-96 overflow-y-auto">
                                ${expenses.length === 0 ? '<div class="p-4 text-center text-slate-400 text-xs">No expenses logged for this billing period</div>' : ''}
                                ${expenses.map(e => `
                                    <div class="p-3 flex items-center justify-between text-xs hover:bg-slate-50">
                                        <div>
                                            <div class="font-bold text-slate-900">${e.particular}</div>
                                            <div class="text-slate-400 text-[11px]">${(e.category || 'maintenance').toUpperCase()} • Added by ${e.added_by || e.addedBy || 'Admin'}</div>
                                        </div>
                                        <div class="flex items-center gap-3">
                                            <span class="font-bold text-slate-900 font-mono">₹${parseFloat(e.amount || 0).toLocaleString('en-IN')}</span>
                                            <button type="button" class="god-del-exp-btn text-slate-400 hover:text-red-600 p-1 cursor-pointer" data-id="${e.id}">
                                                <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                                            </button>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : activeGodTab === 'invoices' ? `
                        <div class="space-y-4">
                            <span class="text-xs font-bold text-slate-700 uppercase tracking-wider">Uploaded Documents & Vouchers (${invoices.length})</span>
                            <div class="grid grid-cols-3 gap-3">
                                ${invoices.length === 0 ? '<div class="col-span-3 p-6 text-center text-slate-400 text-xs">No documents uploaded</div>' : ''}
                                ${invoices.map(inv => `
                                    <div class="p-3 rounded-xl border border-slate-200 flex flex-col justify-between text-xs">
                                        <div class="font-bold text-slate-900 truncate" title="${inv.file_name || inv.fileName}">${inv.file_name || inv.fileName}</div>
                                        <div class="text-[11px] text-slate-400 mt-1">${inv.particular || 'Maintenance Bill'}</div>
                                        <div class="flex justify-end mt-2 pt-2 border-t border-slate-100">
                                            <a href="${inv.file_url || inv.fileUrl}" target="_blank" class="text-blue-600 font-semibold hover:underline">View File ↗</a>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : activeGodTab === 'announcements' ? `
                        <div class="space-y-4">
                            <span class="text-xs font-bold text-slate-700 uppercase tracking-wider">Broadcast Notice to All Residents via Resend</span>
                            <form id="god-broadcast-form" class="space-y-3">
                                <div>
                                    <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Subject Header</label>
                                    <input id="broad-subject" required value="[CHE-MADURA HS-1 MGMT] Urgent Resident Announcement" class="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium" />
                                </div>
                                <div>
                                    <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Message Body</label>
                                    <textarea id="broad-body" rows="4" required class="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium" placeholder="Write your announcement to all 5 flats..."></textarea>
                                </div>
                                <div class="flex justify-end">
                                    <button type="submit" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl cursor-pointer">Dispatch Broadcast</button>
                                </div>
                            </form>
                        </div>
                    ` : `
                        <div class="space-y-4">
                            <div class="flex items-center justify-between">
                                <span class="text-xs font-bold text-slate-700 uppercase tracking-wider">Live System Database JSON Inspector</span>
                                <button type="button" id="god-copy-json-btn" class="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg cursor-pointer">Copy JSON</button>
                            </div>
                            <pre class="p-4 bg-slate-900 text-emerald-400 font-mono text-[11px] rounded-xl overflow-auto max-h-96">${JSON.stringify({ house, users, records, invoices }, null, 2)}</pre>
                        </div>
                    `}
                </div>
            </div>
        `;

        document.body.appendChild(overlay);
        if (window.lucide) window.lucide.createIcons();

        // Close handlers
        const close = () => overlay.remove();
        document.getElementById('close-god-btn')?.addEventListener('click', close);
        overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

        // Tab switches
        overlay.querySelectorAll('[data-tab]').forEach(btn => {
            btn.addEventListener('click', () => {
                activeGodTab = btn.dataset.tab;
                renderGodModeModal();
            });
        });

        // Form: Property Master
        document.getElementById('god-property-form')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const updated = {
                ...house,
                name: document.getElementById('god-prop-name').value.trim(),
                totalUnits: parseInt(document.getElementById('god-prop-units').value) || 5,
                address: document.getElementById('god-prop-address').value.trim(),
                city: document.getElementById('god-prop-city').value.trim(),
                postalCode: document.getElementById('god-prop-postal').value.trim(),
                settings: {
                    currency: document.getElementById('god-prop-currency').value.trim() || 'INR',
                    upiId: document.getElementById('god-prop-upi').value.trim(),
                    upiName: document.getElementById('god-prop-upiname').value.trim()
                }
            };
            localStorage.setItem('madura_house_property_v1', JSON.stringify(updated));
            if (window.supabase) {
                await window.supabase.from('houses').update({
                    name: updated.name,
                    total_units: updated.totalUnits,
                    address: updated.address,
                    city: updated.city,
                    postal_code: updated.postalCode,
                    settings: updated.settings
                }).eq('id', house.id);
            }
            if (window.appStore) window.appStore.setState({ house: updated });
            if (window.audioUtils) window.audioUtils.playSuccessChime();
            alert('Property Master rules committed successfully!');
            close();
        });

        // Form: Ledger Master
        document.getElementById('god-ledger-form')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const m = parseInt(document.getElementById('god-ledger-month').value) || 9;
            const y = parseInt(document.getElementById('god-ledger-year').value) || 2026;
            const total = parseFloat(document.getElementById('god-ledger-total').value) || 0;
            const units = parseInt(document.getElementById('god-ledger-tenants').value) || 5;
            const notes = document.getElementById('god-ledger-notes').value.trim();
            const share = (total / (units || 1));

            const updatedRec = {
                ...currentRecord,
                month: m,
                year: y,
                grand_total: total,
                grandTotal: total,
                active_tenants_count: units,
                activeTenantsCount: units,
                individual_contribution: share,
                individualContribution: share,
                notes
            };

            if (window.supabase && currentRecord.id) {
                await window.supabase.from('maintenance_records').update({
                    month: m,
                    year: y,
                    grand_total: total,
                    active_tenants_count: units,
                    individual_contribution: share,
                    notes
                }).eq('id', currentRecord.id);
            }

            if (typeof window.loadGlobalData === 'function') await window.loadGlobalData();
            if (window.audioUtils) window.audioUtils.playSuccessChime();
            alert('Ledger rules updated and shares recomputed!');
            close();
        });

        // Delete user in God Mode
        overlay.querySelectorAll('.god-del-user-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                if (confirm('Delete resident record in God Mode?')) {
                    const id = btn.dataset.id;
                    await window.supabase.from('users').delete().eq('id', id);
                    if (typeof window.loadGlobalData === 'function') await window.loadGlobalData();
                    renderGodModeModal();
                }
            });
        });

        // Delete expense in God Mode
        overlay.querySelectorAll('.god-del-exp-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                if (confirm('Delete expense line item in God Mode?')) {
                    const id = btn.dataset.id;
                    await window.supabase.from('expenses').delete().eq('id', id);
                    if (typeof window.loadGlobalData === 'function') await window.loadGlobalData();
                    renderGodModeModal();
                }
            });
        });

        // Copy JSON
        document.getElementById('god-copy-json-btn')?.addEventListener('click', () => {
            navigator.clipboard.writeText(JSON.stringify({ house, users, records, invoices }, null, 2));
            alert('JSON copied to clipboard!');
        });
    }

    function openGodModeModal(tab = 'property') {
        activeGodTab = tab;
        renderGodModeModal();
    }

    function closeGodModeModal() {
        const existing = document.getElementById('god-mode-modal-overlay');
        if (existing) existing.remove();
    }

    window.openGodModeModal = openGodModeModal;
    window.closeGodModeModal = closeGodModeModal;
    window.godModeModal = {
        open: openGodModeModal,
        close: closeGodModeModal
    };
})();
