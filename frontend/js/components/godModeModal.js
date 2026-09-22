// God Mode Master Modal Component - Enterprise Superadmin Controller
// Full immediate two-way synchronization with Supabase, localStorage, and instant DOM view refreshing.

(function() {
    let activeGodTab = 'property'; // 'property' | 'ledger' | 'residents' | 'expenses' | 'invoices' | 'announcements' | 'raw'
    let selectedResidentId = null;
    let isAddingResident = false;
    let isAddingExpense = false;
    let editingExpenseId = null;

    const AVAILABLE_FLATS = [
        'GF',
        'F01 - FRONT',
        'F01 - BACK',
        'F02 - FRONT',
        'F02 - BACK'
    ];

    const DEFAULT_AVATARS = [
        { id: '1', name: 'Executive Blue', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' },
        { id: '2', name: 'Professional Grey', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80' },
        { id: '3', name: 'Modern Indigo', url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80' },
        { id: '4', name: 'Classic Charcoal', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80' },
        { id: '5', name: 'Vibrant Teal', url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80' }
    ];

    function showGodToast(message, isError = false) {
        let toast = document.getElementById('god-mode-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'god-mode-toast';
            toast.className = 'fixed top-5 right-5 z-[9999] px-4 py-2.5 rounded-xl text-xs font-semibold shadow-2xl flex items-center gap-2 transition-all transform animate-in slide-in-from-top-3 duration-200';
            document.body.appendChild(toast);
        }

        toast.className = `fixed top-5 right-5 z-[9999] px-4 py-2.5 rounded-xl text-xs font-semibold shadow-2xl flex items-center gap-2 transition-all transform animate-in slide-in-from-top-3 duration-200 ${
            isError ? 'bg-rose-600 text-white' : 'bg-slate-900 text-emerald-300 border border-emerald-500/40'
        }`;
        toast.innerHTML = `<i data-lucide="${isError ? 'alert-circle' : 'check-circle-2'}" class="w-4 h-4 text-${isError ? 'white' : 'emerald-400'}"></i> <span>${message}</span>`;
        if (window.lucide) window.lucide.createIcons();

        setTimeout(() => {
            if (toast) toast.remove();
        }, 3500);
    }

    async function syncAndRefresh() {
        if (typeof window.loadGlobalData === 'function') {
            await window.loadGlobalData();
        }
        if (typeof window.refreshCurrentView === 'function') {
            window.refreshCurrentView();
        }
        renderGodModeModal();
    }

    function renderGodModeModal() {
        let existing = document.getElementById('god-mode-modal-overlay');
        if (existing) existing.remove();

        const state = window.appStore ? window.appStore.getState() : {};
        const house = state.house || {
            id: '11111111-2222-3333-4444-555555555555',
            name: 'CHE-MADURA HS-1 MGMT',
            address: '91/16, Kovilpatti Gopalakrishnan Street, Karthikeyan Nagar, Maduravoyal',
            city: 'Chennai',
            postal_code: '600095',
            total_units: 5,
            settings: { currency: 'INR', upiId: '7338716690@ybl', upiName: 'Sampath Kumar' }
        };
        const users = state.users || [];
        const records = state.records || [];
        const currentRecord = records.length > 0 ? records[0] : {
            id: '22222222-3333-4444-5555-666666666666',
            month: 9,
            year: 2026,
            grand_total: 0,
            active_tenants_count: 5,
            individual_contribution: 0,
            expenses: []
        };
        const expenses = currentRecord.expenses || [];
        const invoices = state.invoices || [];

        const activeResident = isAddingResident 
            ? null 
            : (users.find(u => u.id === selectedResidentId) || users[0] || null);

        const overlay = document.createElement('div');
        overlay.id = 'god-mode-modal-overlay';
        overlay.className = 'fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-100 backdrop-blur-xs';
        overlay.innerHTML = `
            <div class="w-full max-w-5xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[94vh]">
                <!-- Header Banner -->
                <div class="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center shadow-sm shrink-0">
                            <i data-lucide="sparkles" class="w-5 h-5"></i>
                        </div>
                        <div>
                            <div class="flex items-center gap-2">
                                <h2 class="text-base font-bold text-white tracking-tight">God Maxx Master Property Editor</h2>
                                <span class="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30">Direct Supabase Sync</span>
                            </div>
                            <p class="text-xs text-slate-400">Authoritative direct editor for database records, rules, and property configurations</p>
                        </div>
                    </div>
                    <div class="flex items-center gap-2">
                        <button type="button" id="god-sync-now-btn" class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors" title="Force refresh from Supabase">
                            <i data-lucide="refresh-cw" class="w-3.5 h-3.5"></i>
                            <span class="hidden sm:inline">Sync Cloud</span>
                        </button>
                        <button type="button" id="close-god-btn" class="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer">
                            <i data-lucide="x" class="w-5 h-5"></i>
                        </button>
                    </div>
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
                        { id: 'raw', label: '7. Raw JSON & Push', icon: 'code' }
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
                        <!-- TAB 1: PROPERTY MASTER -->
                        <form id="god-property-form" class="space-y-4">
                            <div class="p-3 bg-blue-50/60 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-center gap-2.5">
                                <i data-lucide="shield-check" class="w-4 h-4 text-[#405189] shrink-0"></i>
                                <span>Changes saved here are committed permanently to the Supabase <code>houses</code> table and instantly reflected across all app headers and reports.</span>
                            </div>

                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Property Brand Name *</label>
                                    <input id="god-prop-name" required value="${house.name || 'CHE-MADURA HS-1 MGMT'}" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-medium focus:ring-2 focus:ring-black focus:outline-none text-sm" />
                                </div>
                                <div>
                                    <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Total Flats / Paying Units *</label>
                                    <input id="god-prop-units" type="number" min="1" max="50" required value="${house.total_units || house.totalUnits || 5}" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-medium focus:ring-2 focus:ring-black focus:outline-none text-sm" />
                                </div>
                            </div>
                            <div>
                                <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Street Address *</label>
                                <input id="god-prop-address" required value="${house.address || '91/16, Kovilpatti Gopalakrishnan Street, Karthikeyan Nagar, Maduravoyal'}" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-medium focus:ring-2 focus:ring-black focus:outline-none text-sm" />
                            </div>
                            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div>
                                    <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">City *</label>
                                    <input id="god-prop-city" required value="${house.city || 'Chennai'}" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-medium focus:ring-2 focus:ring-black focus:outline-none text-sm" />
                                </div>
                                <div>
                                    <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Postal Code *</label>
                                    <input id="god-prop-postal" required value="${house.postal_code || house.postalCode || '600095'}" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-medium focus:ring-2 focus:ring-black focus:outline-none text-sm" />
                                </div>
                                <div>
                                    <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Currency *</label>
                                    <input id="god-prop-currency" required value="${house.settings?.currency || 'INR'}" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-medium focus:ring-2 focus:ring-black focus:outline-none text-sm" />
                                </div>
                            </div>
                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                                <div>
                                    <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">UPI ID for Rent / Maintenance</label>
                                    <input id="god-prop-upi" value="${house.settings?.upiId || house.settings?.upi_id || '7338716690@ybl'}" placeholder="e.g. 7338716690@ybl" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-medium focus:ring-2 focus:ring-black focus:outline-none text-sm" />
                                </div>
                                <div>
                                    <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">UPI Payee Full Name</label>
                                    <input id="god-prop-upiname" value="${house.settings?.upiName || house.settings?.upi_name || 'Sampath Kumar'}" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-medium focus:ring-2 focus:ring-black focus:outline-none text-sm" />
                                </div>
                            </div>
                            <div class="flex justify-end pt-4 border-t border-slate-100">
                                <button type="submit" id="save-prop-btn" class="px-6 py-2.5 bg-slate-900 hover:bg-black text-white text-xs font-semibold rounded-xl cursor-pointer shadow-sm flex items-center gap-2 transition-all active:scale-95">
                                    <i data-lucide="save" class="w-4 h-4"></i>
                                    <span>Push Changes to Supabase</span>
                                </button>
                            </div>
                        </form>
                    ` : activeGodTab === 'ledger' ? `
                        <!-- TAB 2: BILLING & SPLIT RULES -->
                        <form id="god-ledger-form" class="space-y-4">
                            <div class="p-3 bg-amber-50/60 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center gap-2.5">
                                <i data-lucide="sliders-horizontal" class="w-4 h-4 text-amber-600 shrink-0"></i>
                                <span>Adjust billing month, year, or manual total override. Click "Recalculate Split" to automatically re-distribute costs across units.</span>
                            </div>

                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Billing Month (1 - 12)</label>
                                    <input id="god-ledger-month" type="number" min="1" max="12" value="${currentRecord.month || 9}" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-medium focus:ring-2 focus:ring-black focus:outline-none text-sm" />
                                </div>
                                <div>
                                    <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Billing Year</label>
                                    <input id="god-ledger-year" type="number" value="${currentRecord.year || 2026}" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-medium focus:ring-2 focus:ring-black focus:outline-none text-sm" />
                                </div>
                            </div>
                            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div>
                                    <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Grand Total Expenditure (₹)</label>
                                    <input id="god-ledger-total" type="number" step="0.01" value="${currentRecord.grand_total || currentRecord.grandTotal || 0}" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-medium focus:ring-2 focus:ring-black focus:outline-none text-sm font-mono" />
                                </div>
                                <div>
                                    <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Active Units for Split</label>
                                    <input id="god-ledger-tenants" type="number" min="1" value="${currentRecord.active_tenants_count || currentRecord.activeTenantsCount || currentRecord.number_of_active_tenants || 5}" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-medium focus:ring-2 focus:ring-black focus:outline-none text-sm" />
                                </div>
                                <div>
                                    <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Individual Share (₹ / Flat)</label>
                                    <div class="flex items-center gap-2">
                                        <input id="god-ledger-share" type="number" step="0.01" value="${(currentRecord.individual_contribution || currentRecord.individualContribution || ((currentRecord.grand_total || currentRecord.grandTotal || 0) / 5)).toFixed(2)}" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-medium focus:ring-2 focus:ring-black focus:outline-none text-sm font-mono text-emerald-700 bg-emerald-50/40" />
                                        <button type="button" id="god-recalc-split-btn" class="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-semibold text-slate-700 cursor-pointer shrink-0 transition-colors" title="Calculate Total / Units">
                                            Recalc
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Audited Billing Notes / Remarks</label>
                                <textarea id="god-ledger-notes" rows="2" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-medium focus:ring-2 focus:ring-black focus:outline-none text-sm">${currentRecord.notes || 'September 2026 Active Maintenance Period'}</textarea>
                            </div>
                            <div class="flex justify-end pt-4 border-t border-slate-100">
                                <button type="submit" class="px-6 py-2.5 bg-slate-900 hover:bg-black text-white text-xs font-semibold rounded-xl cursor-pointer shadow-sm flex items-center gap-2 transition-all active:scale-95">
                                    <i data-lucide="save" class="w-4 h-4"></i>
                                    <span>Commit Ledger Rules to Supabase</span>
                                </button>
                            </div>
                        </form>
                    ` : activeGodTab === 'residents' ? `
                        <!-- TAB 3: RESIDENTS & CREDENTIALS -->
                        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
                            <!-- Left Sidebar: Resident Picker -->
                            <div class="lg:col-span-4 border border-slate-200 rounded-2xl overflow-hidden flex flex-col max-h-[500px]">
                                <div class="p-3 border-b border-slate-100 bg-[#fafbfc] flex items-center justify-between">
                                    <span class="text-xs font-bold text-slate-700 uppercase tracking-wider">Residents (${users.length})</span>
                                    <button type="button" id="god-new-resident-btn" class="px-2.5 py-1 bg-[#405189] hover:bg-[#364473] text-white text-[11px] font-semibold rounded-lg flex items-center gap-1 cursor-pointer">
                                        <i data-lucide="user-plus" class="w-3 h-3"></i>
                                        <span>New</span>
                                    </button>
                                </div>
                                <div class="divide-y divide-slate-100 overflow-y-auto flex-1">
                                    ${users.map(u => `
                                        <div class="p-3 flex items-center justify-between hover:bg-slate-50 cursor-pointer transition-colors resident-select-item ${activeResident?.id === u.id && !isAddingResident ? 'bg-blue-50/70 border-l-4 border-[#405189]' : ''}" data-res-id="${u.id}">
                                            <div class="flex items-center gap-2.5 min-w-0">
                                                <img src="${u.avatar_url || u.avatarUrl || DEFAULT_AVATARS[0].url}" class="w-8 h-8 rounded-full object-cover shrink-0" />
                                                <div class="truncate">
                                                    <div class="font-bold text-slate-900 text-xs truncate">${u.full_name || u.fullName || 'Resident'}</div>
                                                    <div class="text-[11px] text-slate-400 truncate">${u.flat_number || u.flatNumber || 'Unit'} • ${u.email}</div>
                                                </div>
                                            </div>
                                            <span class="text-[10px] px-1.5 py-0.5 rounded font-bold uppercase shrink-0 ${(u.payment_status || u.paymentStatus) === 'paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}">
                                                ${(u.payment_status || u.paymentStatus || 'paid').toUpperCase()}
                                            </span>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>

                            <!-- Right Side: Edit / Add Form -->
                            <div class="lg:col-span-8 border border-slate-200 rounded-2xl p-5">
                                <div class="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
                                    <div>
                                        <h3 class="text-sm font-bold text-slate-900">
                                            ${isAddingResident ? 'Add New Resident Profile' : `Edit Resident: ${activeResident?.full_name || activeResident?.fullName || 'Resident'}`}
                                        </h3>
                                        <p class="text-xs text-slate-400">Configure credentials, privileges, and assigned flat</p>
                                    </div>
                                    ${!isAddingResident && activeResident ? `
                                        <button type="button" id="god-delete-resident-btn" class="px-3 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors" data-id="${activeResident.id}">
                                            <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                                            <span>Delete Profile</span>
                                        </button>
                                    ` : ''}
                                </div>

                                <form id="god-resident-editor-form" class="space-y-3.5">
                                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div>
                                            <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Full Name *</label>
                                            <input id="god-res-name" required value="${isAddingResident ? '' : (activeResident?.full_name || activeResident?.fullName || '')}" placeholder="e.g. Anand Kumar" class="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-black focus:outline-none" />
                                        </div>
                                        <div>
                                            <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Email Address *</label>
                                            <input id="god-res-email" type="email" required value="${isAddingResident ? '' : (activeResident?.email || '')}" placeholder="e.g. anand@chemadura.com" class="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-black focus:outline-none" />
                                        </div>
                                    </div>

                                    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        <div>
                                            <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Password *</label>
                                            <input id="god-res-password" required value="${isAddingResident ? 'Tenant@123' : (activeResident?.password || 'Tenant@123')}" class="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-medium focus:ring-2 focus:ring-black focus:outline-none" />
                                        </div>
                                        <div>
                                            <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Assigned Flat *</label>
                                            <select id="god-res-flat" class="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-black focus:outline-none">
                                                ${AVAILABLE_FLATS.map(f => `<option value="${f}" ${!isAddingResident && (activeResident?.flat_number || activeResident?.flatNumber) === f ? 'selected' : ''}>${f}</option>`).join('')}
                                            </select>
                                        </div>
                                        <div>
                                            <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Portal Role *</label>
                                            <select id="god-res-role" class="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-black focus:outline-none">
                                                <option value="TENANT" ${!isAddingResident && activeResident?.role === 'TENANT' ? 'selected' : ''}>TENANT</option>
                                                <option value="ADMIN_TENANT" ${!isAddingResident && activeResident?.role === 'ADMIN_TENANT' ? 'selected' : ''}>ADMIN_TENANT</option>
                                                <option value="OWNER" ${!isAddingResident && activeResident?.role === 'OWNER' ? 'selected' : ''}>OWNER</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        <div>
                                            <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Phone Number</label>
                                            <input id="god-res-phone" value="${isAddingResident ? '+91 98421 00000' : (activeResident?.phone || '')}" class="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-black focus:outline-none" />
                                        </div>
                                        <div>
                                            <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Monthly Rent (₹)</label>
                                            <input id="god-res-rent" type="number" value="${isAddingResident ? 14000 : (activeResident?.rent_amount || activeResident?.rentAmount || 14000)}" class="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-black focus:outline-none" />
                                        </div>
                                        <div>
                                            <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Security Deposit (₹)</label>
                                            <input id="god-res-deposit" type="number" value="${isAddingResident ? 70000 : (activeResident?.deposit_amount || activeResident?.depositAmount || 70000)}" class="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-black focus:outline-none" />
                                        </div>
                                    </div>

                                    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        <div>
                                            <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Occupancy</label>
                                            <select id="god-res-occupancy" class="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-black focus:outline-none">
                                                <option value="active" ${!isAddingResident && (activeResident?.occupancy_status || activeResident?.occupancyStatus) === 'active' ? 'selected' : ''}>Active</option>
                                                <option value="inactive" ${!isAddingResident && (activeResident?.occupancy_status || activeResident?.occupancyStatus) === 'inactive' ? 'selected' : ''}>Inactive</option>
                                                <option value="evicted" ${!isAddingResident && (activeResident?.occupancy_status || activeResident?.occupancyStatus) === 'evicted' ? 'selected' : ''}>Evicted</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Rent Status</label>
                                            <select id="god-res-payment" class="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-black focus:outline-none">
                                                <option value="paid" ${!isAddingResident && (activeResident?.payment_status || activeResident?.paymentStatus) === 'paid' ? 'selected' : ''}>Paid</option>
                                                <option value="pending" ${!isAddingResident && (activeResident?.payment_status || activeResident?.paymentStatus) === 'pending' ? 'selected' : ''}>Pending</option>
                                                <option value="unpaid" ${!isAddingResident && (activeResident?.payment_status || activeResident?.paymentStatus) === 'unpaid' ? 'selected' : ''}>Unpaid</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Maintenance Status</label>
                                            <select id="god-res-maint" class="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-black focus:outline-none">
                                                <option value="paid" ${!isAddingResident && (activeResident?.maintenance_status || activeResident?.maintenanceStatus) === 'paid' ? 'selected' : ''}>Paid</option>
                                                <option value="pending" ${!isAddingResident && (activeResident?.maintenance_status || activeResident?.maintenanceStatus) === 'pending' ? 'selected' : ''}>Pending</option>
                                                <option value="unpaid" ${!isAddingResident && (activeResident?.maintenance_status || activeResident?.maintenanceStatus) === 'unpaid' ? 'selected' : ''}>Unpaid</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Avatar Image URL</label>
                                        <input id="god-res-avatar" value="${isAddingResident ? DEFAULT_AVATARS[0].url : (activeResident?.avatar_url || activeResident?.avatarUrl || DEFAULT_AVATARS[0].url)}" class="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-black focus:outline-none" />
                                    </div>

                                    <div class="flex justify-end gap-2 pt-3 border-t border-slate-100">
                                        <button type="submit" class="px-5 py-2 bg-slate-900 hover:bg-black text-white text-xs font-semibold rounded-xl cursor-pointer shadow-sm flex items-center gap-1.5 transition-all active:scale-95">
                                            <i data-lucide="save" class="w-4 h-4"></i>
                                            <span>${isAddingResident ? 'Create & Sync to Supabase' : 'Update & Sync to Supabase'}</span>
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    ` : activeGodTab === 'expenses' ? `
                        <!-- TAB 4: EXPENSES LEDGER -->
                        <div class="space-y-4">
                            <div class="flex items-center justify-between pb-3 border-b border-slate-100">
                                <div>
                                    <span class="text-xs font-bold text-slate-700 uppercase tracking-wider">Itemized Expenses (${expenses.length})</span>
                                    <p class="text-xs text-slate-400">Add or edit expenses; automatically recalculates the total split</p>
                                </div>
                                <button type="button" id="god-toggle-exp-form-btn" class="px-3 py-1.5 bg-[#405189] hover:bg-[#364473] text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer">
                                    <i data-lucide="${isAddingExpense ? 'x' : 'plus'}" class="w-3.5 h-3.5"></i>
                                    <span>${isAddingExpense ? 'Cancel' : 'Add Line Item'}</span>
                                </button>
                            </div>

                            ${isAddingExpense ? `
                                <form id="god-expense-form" class="p-4 border border-slate-200 rounded-2xl bg-slate-50/50 space-y-3">
                                    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        <div class="sm:col-span-2">
                                            <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Particular / Description *</label>
                                            <input id="god-exp-particular" required placeholder="e.g. EB Bill Common Motor" class="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-black focus:outline-none" />
                                        </div>
                                        <div>
                                            <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Amount (₹) *</label>
                                            <input id="god-exp-amount" type="number" step="0.01" required placeholder="0.00" class="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-medium font-mono focus:ring-2 focus:ring-black focus:outline-none" />
                                        </div>
                                    </div>
                                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div>
                                            <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Category *</label>
                                            <select id="god-exp-category" class="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-black focus:outline-none">
                                                <option value="utilities">Utilities (EB / Water)</option>
                                                <option value="cleaning">Cleaning & Hygiene</option>
                                                <option value="repairs">Repairs & Hardware</option>
                                                <option value="maintenance">Maintenance</option>
                                                <option value="other">Other</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Expense Date</label>
                                            <input id="god-exp-date" type="date" value="${new Date().toISOString().split('T')[0]}" class="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-black focus:outline-none" />
                                        </div>
                                    </div>
                                    <div>
                                        <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Audit Notes (Optional)</label>
                                        <input id="god-exp-notes" placeholder="Invoice details or technician notes..." class="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-black focus:outline-none" />
                                    </div>
                                    <div class="flex justify-end pt-2">
                                        <button type="submit" class="px-5 py-2 bg-slate-900 hover:bg-black text-white text-xs font-semibold rounded-xl cursor-pointer shadow-sm flex items-center gap-1.5 transition-all active:scale-95">
                                            <i data-lucide="check" class="w-4 h-4"></i>
                                            <span>Save Expense & Recompute Grand Total</span>
                                        </button>
                                    </div>
                                </form>
                            ` : ''}

                            <div class="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100 max-h-96 overflow-y-auto">
                                ${expenses.length === 0 ? '<div class="p-8 text-center text-slate-400 text-xs">No expense items logged for this period</div>' : ''}
                                ${expenses.map(e => `
                                    <div class="p-3.5 flex items-center justify-between text-xs hover:bg-slate-50 transition-colors">
                                        <div>
                                            <div class="font-bold text-slate-900">${e.particular}</div>
                                            <div class="text-slate-400 text-[11px] mt-0.5">
                                                <span class="font-semibold uppercase text-slate-600">${e.category || 'maintenance'}</span> • Date: ${e.date || '2026-09'}
                                                ${e.notes ? ` • <em>${e.notes}</em>` : ''}
                                            </div>
                                        </div>
                                        <div class="flex items-center gap-3">
                                            <span class="font-bold text-slate-900 font-mono text-sm">₹${parseFloat(e.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                            <button type="button" class="god-del-exp-btn p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer transition-colors" data-id="${e.id}" data-desc="${e.particular}" title="Delete line item">
                                                <i data-lucide="trash-2" class="w-4 h-4"></i>
                                            </button>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : activeGodTab === 'invoices' ? `
                        <!-- TAB 5: INVOICES & OCR -->
                        <div class="space-y-4">
                            <div class="flex items-center justify-between pb-3 border-b border-slate-100">
                                <div>
                                    <span class="text-xs font-bold text-slate-700 uppercase tracking-wider">Document Vouchers & Invoices (${invoices.length})</span>
                                    <p class="text-xs text-slate-400">Attached bills, receipts, and proof of expenditure</p>
                                </div>
                                <button type="button" id="god-upload-inv-trigger" class="px-3 py-1.5 bg-[#405189] hover:bg-[#364473] text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer">
                                    <i data-lucide="upload" class="w-3.5 h-3.5"></i>
                                    <span>Upload Document</span>
                                </button>
                                <input type="file" id="god-inv-file-hidden" accept=".pdf,image/*" class="hidden" />
                            </div>

                            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
                                ${invoices.length === 0 ? '<div class="col-span-full p-8 text-center text-slate-400 text-xs">No documents uploaded</div>' : ''}
                                ${invoices.map(inv => `
                                    <div class="p-3.5 rounded-xl border border-slate-200 flex flex-col justify-between text-xs bg-slate-50/50 hover:bg-white transition-colors">
                                        <div>
                                            <div class="font-bold text-slate-900 truncate" title="${inv.file_name || inv.fileName}">${inv.file_name || inv.fileName}</div>
                                            <div class="text-[11px] text-slate-400 mt-1 truncate">${inv.particular || 'Maintenance Bill'}</div>
                                            <div class="text-[10px] text-slate-400 font-mono mt-0.5">${((inv.file_size || inv.fileSize || 450000) / 1024).toFixed(0)} KB</div>
                                        </div>
                                        <div class="flex items-center justify-between mt-3 pt-2 border-t border-slate-100">
                                            <a href="${inv.file_url || inv.fileUrl}" target="_blank" class="text-blue-600 font-semibold hover:underline flex items-center gap-1">
                                                <span>View</span>
                                                <i data-lucide="external-link" class="w-3 h-3"></i>
                                            </a>
                                            <button type="button" class="god-del-inv-btn text-slate-400 hover:text-rose-600 p-1 cursor-pointer" data-id="${inv.id}">
                                                <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                                            </button>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : activeGodTab === 'announcements' ? `
                        <!-- TAB 6: EMAIL BROADCAST & COMMUNICATIONS -->
                        <div class="space-y-4">
                            <div class="p-3 bg-blue-50/60 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-center gap-2.5">
                                <i data-lucide="mail" class="w-4 h-4 text-blue-600 shrink-0"></i>
                                <span>Dispatches an instant email blast via Resend API and records an entry in the announcements table.</span>
                            </div>

                            <form id="god-broadcast-form" class="space-y-3.5">
                                <div>
                                    <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Email Subject Header *</label>
                                    <input id="god-broad-subject" required value="[CHE-MADURA HS-1 MGMT] Urgent Maintenance Notice - September 2026" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-black focus:outline-none" />
                                </div>
                                <div>
                                    <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Message Body *</label>
                                    <textarea id="god-broad-body" rows="4" required class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-black focus:outline-none leading-relaxed" placeholder="Write your announcement to all residents..."></textarea>
                                </div>
                                <div class="flex justify-end pt-2">
                                    <button type="submit" id="god-broad-btn" class="px-6 py-2.5 bg-slate-900 hover:bg-black text-white text-xs font-semibold rounded-xl cursor-pointer shadow-sm flex items-center gap-2 transition-all active:scale-95">
                                        <i data-lucide="send" class="w-4 h-4"></i>
                                        <span>Dispatch Broadcast to All Residents</span>
                                    </button>
                                </div>
                            </form>
                        </div>
                    ` : `
                        <!-- TAB 7: RAW JSON & MASTER CLOUD PUSH -->
                        <div class="space-y-4">
                            <div class="flex items-center justify-between">
                                <div>
                                    <span class="text-xs font-bold text-slate-700 uppercase tracking-wider">Live System Database JSON Inspector</span>
                                    <p class="text-xs text-slate-400">Direct snapshot of memory state synced with Supabase</p>
                                </div>
                                <div class="flex items-center gap-2">
                                    <button type="button" id="god-copy-json-btn" class="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg cursor-pointer transition-colors flex items-center gap-1.5">
                                        <i data-lucide="copy" class="w-3.5 h-3.5"></i>
                                        <span>Copy JSON</span>
                                    </button>
                                    <button type="button" id="god-force-cloud-push-btn" class="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg cursor-pointer transition-all active:scale-95 shadow-xs flex items-center gap-1.5">
                                        <i data-lucide="cloud-upload" class="w-3.5 h-3.5"></i>
                                        <span>Force Push All State to Supabase Now</span>
                                    </button>
                                </div>
                            </div>
                            <pre class="p-4 bg-slate-900 text-emerald-400 font-mono text-[11px] rounded-2xl overflow-auto max-h-[460px] leading-relaxed">${JSON.stringify({ house, currentRecord, users, expenses, invoices }, null, 2)}</pre>
                        </div>
                    `}
                </div>
            </div>
        `;

        document.body.appendChild(overlay);
        if (window.lucide) window.lucide.createIcons();

        // Close handlers
        const close = () => {
            overlay.remove();
            isAddingResident = false;
            isAddingExpense = false;
        };
        document.getElementById('close-god-btn')?.addEventListener('click', close);
        overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

        // Tab Navigation
        overlay.querySelectorAll('[data-tab]').forEach(btn => {
            btn.addEventListener('click', () => {
                activeGodTab = btn.dataset.tab;
                isAddingResident = false;
                isAddingExpense = false;
                renderGodModeModal();
            });
        });

        // Top Cloud Sync Button
        document.getElementById('god-sync-now-btn')?.addEventListener('click', async () => {
            showGodToast('Syncing with Supabase Cloud...');
            await syncAndRefresh();
            if (window.audioUtils) window.audioUtils.playSuccessChime();
            showGodToast('Supabase state synced successfully!');
        });

        // =====================================================================
        // TAB 1: PROPERTY MASTER SUBMIT
        // =====================================================================
        document.getElementById('god-property-form')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const saveBtn = document.getElementById('save-prop-btn');
            if (saveBtn) saveBtn.disabled = true;

            const houseId = house.id || '11111111-2222-3333-4444-555555555555';
            const updatedPayload = {
                id: houseId,
                name: document.getElementById('god-prop-name').value.trim(),
                total_units: parseInt(document.getElementById('god-prop-units').value) || 5,
                address: document.getElementById('god-prop-address').value.trim(),
                city: document.getElementById('god-prop-city').value.trim(),
                postal_code: document.getElementById('god-prop-postal').value.trim(),
                settings: {
                    currency: document.getElementById('god-prop-currency').value.trim() || 'INR',
                    upiId: document.getElementById('god-prop-upi').value.trim(),
                    upiName: document.getElementById('god-prop-upiname').value.trim()
                }
            };

            try {
                // 1. Permanent Local Storage Backup
                localStorage.setItem('madura_house_property_v1', JSON.stringify(updatedPayload));
                
                // 2. Direct Supabase Upsert
                if (window.supabase) {
                    const { error } = await window.supabase.from('houses').upsert(updatedPayload, { onConflict: 'id' });
                    if (error) throw error;
                }

                // 3. Update Store & Refresh Views Everywhere
                if (window.appStore) window.appStore.setState({ house: updatedPayload });
                await syncAndRefresh();
                
                if (window.audioUtils) window.audioUtils.playSuccessChime();
                showGodToast('Property master rules saved to Supabase & refreshed!');
            } catch (err) {
                console.error('Save house error:', err);
                showGodToast('Save error: ' + err.message, true);
                if (window.audioUtils) window.audioUtils.playWarningChime();
            } finally {
                if (saveBtn) saveBtn.disabled = false;
            }
        });

        // =====================================================================
        // TAB 2: LEDGER RULES SUBMIT & RECALCULATE
        // =====================================================================
        document.getElementById('god-recalc-split-btn')?.addEventListener('click', () => {
            const total = parseFloat(document.getElementById('god-ledger-total').value) || 0;
            const units = parseInt(document.getElementById('god-ledger-tenants').value) || 5;
            const share = units > 0 ? (total / units).toFixed(2) : '0.00';
            const shareInput = document.getElementById('god-ledger-share');
            if (shareInput) shareInput.value = share;
            if (window.audioUtils) window.audioUtils.playToggleChime();
        });

        document.getElementById('god-ledger-form')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const m = parseInt(document.getElementById('god-ledger-month').value) || 9;
            const y = parseInt(document.getElementById('god-ledger-year').value) || 2026;
            const total = parseFloat(document.getElementById('god-ledger-total').value) || 0;
            const units = parseInt(document.getElementById('god-ledger-tenants').value) || 5;
            const share = parseFloat(document.getElementById('god-ledger-share').value) || (total / (units || 1));
            const notes = document.getElementById('god-ledger-notes').value.trim();
            const recId = currentRecord.id || '22222222-3333-4444-5555-666666666666';
            const houseId = house.id || '11111111-2222-3333-4444-555555555555';

            const recordPayload = {
                id: recId,
                house_id: houseId,
                month: m,
                year: y,
                grand_total: total,
                active_tenants_count: units,
                number_of_active_tenants: units,
                individual_contribution: share,
                notes: notes
            };

            try {
                // 1. Direct Supabase Upsert
                if (window.supabase) {
                    const { error } = await window.supabase.from('maintenance_records').upsert(recordPayload, { onConflict: 'id' });
                    if (error) throw error;
                }

                localStorage.setItem('madura_house_records_v1', JSON.stringify([recordPayload]));
                await syncAndRefresh();

                if (window.audioUtils) window.audioUtils.playSuccessChime();
                showGodToast('Ledger rules committed and recomputed across all views!');
            } catch (err) {
                console.error('Ledger commit error:', err);
                showGodToast('Ledger error: ' + err.message, true);
                if (window.audioUtils) window.audioUtils.playWarningChime();
            }
        });

        // =====================================================================
        // TAB 3: RESIDENTS SELECTION & SUBMIT
        // =====================================================================
        overlay.querySelectorAll('.resident-select-item').forEach(el => {
            el.addEventListener('click', () => {
                selectedResidentId = el.dataset.resId;
                isAddingResident = false;
                renderGodModeModal();
            });
        });

        document.getElementById('god-new-resident-btn')?.addEventListener('click', () => {
            isAddingResident = true;
            renderGodModeModal();
        });

        document.getElementById('god-resident-editor-form')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('god-res-name').value.trim();
            const email = document.getElementById('god-res-email').value.trim().toLowerCase();
            const password = document.getElementById('god-res-password').value.trim();
            const flat = document.getElementById('god-res-flat').value;
            const role = document.getElementById('god-res-role').value;
            const phone = document.getElementById('god-res-phone').value.trim();
            const rent = parseFloat(document.getElementById('god-res-rent').value) || 0;
            const deposit = parseFloat(document.getElementById('god-res-deposit').value) || 0;
            const occ = document.getElementById('god-res-occupancy').value;
            const pay = document.getElementById('god-res-payment').value;
            const maint = document.getElementById('god-res-maint').value;
            const avatar = document.getElementById('god-res-avatar').value.trim() || DEFAULT_AVATARS[0].url;

            const resId = isAddingResident ? crypto.randomUUID() : (activeResident?.id || crypto.randomUUID());
            const userPayload = {
                id: resId,
                full_name: name,
                email: email,
                password: password,
                flat_number: flat,
                role: role,
                phone: phone,
                rent_amount: rent,
                deposit_amount: deposit,
                occupancy_status: occ,
                payment_status: pay,
                maintenance_status: maint,
                avatar_url: avatar
            };

            try {
                if (window.supabase) {
                    const { error } = await window.supabase.from('users').upsert(userPayload, { onConflict: 'id' });
                    if (error) throw error;
                }

                selectedResidentId = resId;
                isAddingResident = false;
                await syncAndRefresh();

                if (window.audioUtils) window.audioUtils.playSuccessChime();
                showGodToast(`Resident ${name} pushed to Supabase & refreshed!`);
            } catch (err) {
                console.error('Resident save error:', err);
                showGodToast('Error saving resident: ' + err.message, true);
                if (window.audioUtils) window.audioUtils.playWarningChime();
            }
        });

        document.getElementById('god-delete-resident-btn')?.addEventListener('click', async (e) => {
            const id = e.currentTarget.dataset.id;
            const target = users.find(u => u.id === id);
            if (!target) return;
            if (id === 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' || target.email === 'sampathkumar@chemadura.com') {
                alert('Protected Account: Superadmin account cannot be removed.');
                return;
            }
            if (confirm(`Permanently delete resident ${target.full_name || target.fullName} (${target.email}) from Supabase?`)) {
                await window.supabase.from('users').update({
                    occupancy_status: 'evicted',
                    occupancyStatus: 'evicted',
                    is_active: false,
                    deleted_at: new Date().toISOString()
                }).eq('id', id);
                await window.supabase.from('users').delete().eq('id', id);
                selectedResidentId = null;
                await syncAndRefresh();
                if (window.audioUtils) window.audioUtils.playSuccessChime();
                showGodToast('Resident removed permanently.');
            }
        });

        // =====================================================================
        // TAB 4: EXPENSES SUBMIT & DELETE
        // =====================================================================
        document.getElementById('god-toggle-exp-form-btn')?.addEventListener('click', () => {
            isAddingExpense = !isAddingExpense;
            renderGodModeModal();
        });

        document.getElementById('god-expense-form')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const part = document.getElementById('god-exp-particular').value.trim();
            const amt = parseFloat(document.getElementById('god-exp-amount').value) || 0;
            const cat = document.getElementById('god-exp-category').value;
            const date = document.getElementById('god-exp-date').value;
            const notes = document.getElementById('god-exp-notes').value.trim();
            const recId = currentRecord.id || '22222222-3333-4444-5555-666666666666';

            const newExp = {
                id: crypto.randomUUID(),
                maintenance_record_id: recId,
                particular: part,
                category: cat,
                amount: amt,
                date: date,
                notes: notes,
                created_at: new Date().toISOString()
            };

            try {
                // 1. Insert expense into Supabase
                const { error: expErr } = await window.supabase.from('expenses').insert(newExp);
                if (expErr) throw expErr;

                // 2. Fetch fresh expense sum and auto-update maintenance_record
                const { data: allExp } = await window.supabase.from('expenses').select('amount').eq('maintenance_record_id', recId);
                const newTotal = (allExp || []).reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);
                const units = currentRecord.active_tenants_count || 5;
                const newShare = units > 0 ? (newTotal / units) : 0;

                await window.supabase.from('maintenance_records').update({
                    grand_total: newTotal,
                    individual_contribution: newShare
                }).eq('id', recId);

                isAddingExpense = false;
                await syncAndRefresh();

                if (window.audioUtils) window.audioUtils.playSuccessChime();
                showGodToast('Expense logged & total recomputed in Supabase!');
            } catch (err) {
                console.error('Add expense error:', err);
                showGodToast('Expense error: ' + err.message, true);
                if (window.audioUtils) window.audioUtils.playWarningChime();
            }
        });

        overlay.querySelectorAll('.god-del-exp-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = btn.dataset.id;
                const desc = btn.dataset.desc;
                if (confirm(`Delete expense "${desc}" from Supabase?`)) {
                    const recId = currentRecord.id || '22222222-3333-4444-5555-666666666666';
                    await window.supabase.from('expenses').delete().eq('id', id);

                    // Recompute total
                    const { data: allExp } = await window.supabase.from('expenses').select('amount').eq('maintenance_record_id', recId);
                    const newTotal = (allExp || []).reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);
                    const units = currentRecord.active_tenants_count || 5;
                    const newShare = units > 0 ? (newTotal / units) : 0;

                    await window.supabase.from('maintenance_records').update({
                        grand_total: newTotal,
                        individual_contribution: newShare
                    }).eq('id', recId);

                    await syncAndRefresh();
                    if (window.audioUtils) window.audioUtils.playSuccessChime();
                    showGodToast('Expense removed & ledger updated.');
                }
            });
        });

        // =====================================================================
        // TAB 5: INVOICE UPLOAD & DELETE
        // =====================================================================
        const invFileInput = document.getElementById('god-inv-file-hidden');
        document.getElementById('god-upload-inv-trigger')?.addEventListener('click', () => {
            invFileInput?.click();
        });

        invFileInput?.addEventListener('change', async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = async () => {
                const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
                const newInv = {
                    id: crypto.randomUUID(),
                    file_name: file.name,
                    file_url: reader.result,
                    file_type: isPdf ? 'application/pdf' : file.type || 'image/jpeg',
                    file_size: file.size,
                    particular: file.name.replace(/\.[^/.]+$/, ""),
                    ocr_text: `Verified God Mode voucher: ${file.name}`,
                    uploaded_by: state.user?.email || 'admin@chemadura.com',
                    created_at: new Date().toISOString()
                };

                const { error } = await window.supabase.from('invoices').insert(newInv);
                if (!error) {
                    await syncAndRefresh();
                    if (window.audioUtils) window.audioUtils.playSuccessChime();
                    showGodToast('Invoice voucher committed to Supabase!');
                } else {
                    showGodToast('Upload error: ' + error.message, true);
                }
            };
            reader.readAsDataURL(file);
        });

        overlay.querySelectorAll('.god-del-inv-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                if (confirm('Delete this invoice document from Supabase?')) {
                    await window.supabase.from('invoices').delete().eq('id', btn.dataset.id);
                    await syncAndRefresh();
                    if (window.audioUtils) window.audioUtils.playSuccessChime();
                    showGodToast('Invoice deleted.');
                }
            });
        });

        // =====================================================================
        // TAB 6: BROADCAST SUBMIT
        // =====================================================================
        document.getElementById('god-broadcast-form')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const subject = document.getElementById('god-broad-subject').value.trim();
            const body = document.getElementById('god-broad-body').value.trim();
            const broadBtn = document.getElementById('god-broad-btn');
            if (broadBtn) broadBtn.disabled = true;

            try {
                showGodToast('Dispatching broadcast to all resident inboxes...');

                // 1. Send via Resend client
                if (window.resendClient && typeof window.resendClient.sendBulkMaintenanceEmails === 'function') {
                    await window.resendClient.sendBulkMaintenanceEmails({
                        recipients: users.filter(u => u.email),
                        record: currentRecord,
                        house: house,
                        senderName: 'Sampath Kumar'
                    });
                }

                // 2. Save announcement to Supabase
                await window.supabase.from('announcements').insert({
                    id: crypto.randomUUID(),
                    title: subject,
                    message: body,
                    sender_name: 'Sampath Kumar (Owner)',
                    created_at: new Date().toISOString()
                });

                if (window.audioUtils) window.audioUtils.playSuccessChime();
                showGodToast('Broadcast successfully dispatched and logged in Supabase!');
                document.getElementById('god-broadcast-form')?.reset();
            } catch (err) {
                console.error('Broadcast error:', err);
                showGodToast('Broadcast error: ' + err.message, true);
            } finally {
                if (broadBtn) broadBtn.disabled = false;
            }
        });

        // =====================================================================
        // TAB 7: RAW JSON & MASTER FORCE CLOUD PUSH
        // =====================================================================
        document.getElementById('god-copy-json-btn')?.addEventListener('click', () => {
            navigator.clipboard.writeText(JSON.stringify({ house, currentRecord, users, expenses, invoices }, null, 2));
            if (window.audioUtils) window.audioUtils.playSuccessChime();
            showGodToast('Database JSON copied to clipboard!');
        });

        document.getElementById('god-force-cloud-push-btn')?.addEventListener('click', async (e) => {
            const btn = e.currentTarget;
            btn.disabled = true;
            showGodToast('Executing Master Push to Supabase Cloud...');

            try {
                const startTime = performance.now();

                // 1. Push House
                const housePayload = {
                    id: house.id || '11111111-2222-3333-4444-555555555555',
                    name: house.name,
                    total_units: house.total_units || house.totalUnits || 5,
                    address: house.address,
                    city: house.city,
                    postal_code: house.postal_code || house.postalCode,
                    settings: house.settings
                };
                await window.supabase.from('houses').upsert(housePayload, { onConflict: 'id' });

                // 2. Push Maintenance Record
                const recPayload = {
                    id: currentRecord.id || '22222222-3333-4444-5555-666666666666',
                    house_id: housePayload.id,
                    month: currentRecord.month || 9,
                    year: currentRecord.year || 2026,
                    grand_total: currentRecord.grand_total || currentRecord.grandTotal || 0,
                    active_tenants_count: currentRecord.active_tenants_count || 5,
                    individual_contribution: currentRecord.individual_contribution || 0,
                    notes: currentRecord.notes || ''
                };
                await window.supabase.from('maintenance_records').upsert(recPayload, { onConflict: 'id' });

                // 3. Push Users
                for (const u of users) {
                    const uPayload = {
                        id: u.id,
                        full_name: u.full_name || u.fullName,
                        email: u.email,
                        password: u.password || 'Tenant@123',
                        flat_number: u.flat_number || u.flatNumber,
                        role: u.role,
                        phone: u.phone,
                        payment_status: u.payment_status || u.paymentStatus || 'paid',
                        maintenance_status: u.maintenance_status || u.maintenanceStatus || 'unpaid',
                        occupancy_status: u.occupancy_status || u.occupancyStatus || 'active',
                        rent_amount: u.rent_amount || u.rentAmount || 14000,
                        deposit_amount: u.deposit_amount || u.depositAmount || 70000,
                        avatar_url: u.avatar_url || u.avatarUrl
                    };
                    await window.supabase.from('users').upsert(uPayload, { onConflict: 'id' });
                }

                // 4. Push Expenses
                for (const exp of expenses) {
                    const expPayload = {
                        id: exp.id,
                        maintenance_record_id: recPayload.id,
                        particular: exp.particular,
                        category: exp.category || 'maintenance',
                        amount: parseFloat(exp.amount || 0),
                        date: exp.date || '2026-09-01',
                        notes: exp.notes || ''
                    };
                    await window.supabase.from('expenses').upsert(expPayload, { onConflict: 'id' });
                }

                const elapsed = Math.round(performance.now() - startTime);
                await syncAndRefresh();

                if (window.audioUtils) window.audioUtils.playSuccessChime();
                showGodToast(`Master Cloud Push Complete (${elapsed}ms)! All tables synchronized.`);
            } catch (err) {
                console.error('Master push error:', err);
                showGodToast('Master push failed: ' + err.message, true);
                if (window.audioUtils) window.audioUtils.playWarningChime();
            } finally {
                btn.disabled = false;
            }
        });
    }

    function openGodModeModal(tab = 'property') {
        activeGodTab = tab;
        renderGodModeModal();
    }

    function closeGodModeModal() {
        const existing = document.getElementById('god-mode-modal-overlay');
        if (existing) existing.remove();
        isAddingResident = false;
        isAddingExpense = false;
    }

    window.openGodModeModal = openGodModeModal;
    window.closeGodModeModal = closeGodModeModal;
    window.godModeModal = {
        open: openGodModeModal,
        close: closeGodModeModal
    };
})();
