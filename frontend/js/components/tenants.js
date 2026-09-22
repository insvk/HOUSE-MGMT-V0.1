// Tenant Directory & CRM Component with CosmoLex Styling
function renderTenants() {
    const state = window.appStore ? window.appStore.getState() : {};
    const users = state.users || [];
    const activeCount = users.filter(u => u.occupancy_status === 'active' || u.occupancyStatus === 'active').length;
    const paidRentCount = users.filter(u => u.payment_status === 'paid' || u.paymentStatus === 'paid').length;

    const actionsHtml = `
        <button id="export-tenants-btn" class="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-black text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer">
            <i data-lucide="file-spreadsheet" class="w-3.5 h-3.5"></i>
            <span>Export Roster</span>
        </button>
        <button id="add-tenant-btn" class="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer">
            <i data-lucide="user-plus" class="w-3.5 h-3.5"></i>
            <span>Add Tenant</span>
        </button>
    `;

    const bodyHtml = `
        <!-- KPI Metrics -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                <div>
                    <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Registered Residents</span>
                    <p class="text-2xl font-bold text-slate-900 mt-1">${users.length} Occupants</p>
                </div>
                <div class="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <i data-lucide="users" class="w-5 h-5"></i>
                </div>
            </div>
            <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                <div>
                    <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Occupancy</span>
                    <p class="text-2xl font-bold text-slate-900 mt-1">${activeCount} Active Units</p>
                </div>
                <div class="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <i data-lucide="home" class="w-5 h-5"></i>
                </div>
            </div>
            <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                <div>
                    <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Rent Status Cleared</span>
                    <p class="text-2xl font-bold text-slate-900 mt-1">${paidRentCount} of ${users.length} Paid</p>
                </div>
                <div class="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                    <i data-lucide="shield-check" class="w-5 h-5"></i>
                </div>
            </div>
        </div>

        <!-- Tenant Roster Table -->
        <div class="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                    <h2 class="text-base font-bold text-slate-900">Resident Directory & Occupant Profiles</h2>
                    <p class="text-xs text-slate-500">Contact details, assigned flats, and payment status</p>
                </div>
                <span class="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">${users.length} profiles</span>
            </div>

            <div class="overflow-x-auto">
                <table class="w-full text-left text-sm">
                    <thead class="bg-[#fafbfc] border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        <tr>
                            <th class="px-6 py-3.5">Resident</th>
                            <th class="px-6 py-3.5">Flat / Unit</th>
                            <th class="px-6 py-3.5">Contact Details</th>
                            <th class="px-6 py-3.5">Role</th>
                            <th class="px-6 py-3.5">Occupancy</th>
                            <th class="px-6 py-3.5">Rent Status</th>
                            <th class="px-6 py-3.5 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100 font-normal">
                        ${users.length === 0 ? `
                            <tr>
                                <td colspan="7" class="py-12 text-center text-slate-400">
                                    <div class="flex flex-col items-center justify-center">
                                        <i data-lucide="users" class="w-8 h-8 text-slate-300 mb-2"></i>
                                        <p class="font-medium text-slate-600">No residents registered yet</p>
                                        <p class="text-xs text-slate-400 mt-1">Click "Add Tenant" to create your first resident profile</p>
                                    </div>
                                </td>
                            </tr>
                        ` : ''}
                        ${users.map(u => {
                            const isPaid = (u.payment_status === 'paid' || u.paymentStatus === 'paid');
                            const isActive = (u.occupancy_status === 'active' || u.occupancyStatus === 'active');
                            const avatar = u.avatar_url || u.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100';
                            return `
                            <tr class="hover:bg-slate-50/80 transition-colors">
                                <td class="px-6 py-4">
                                    <div class="flex items-center gap-3">
                                        <img src="${avatar}" alt="Avatar" class="w-9 h-9 rounded-full object-cover border border-slate-200 shadow-2xs shrink-0" />
                                        <div>
                                            <div class="font-semibold text-slate-900">${u.full_name || u.fullName || 'Resident'}</div>
                                            <div class="text-xs text-slate-400">${u.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td class="px-6 py-4 font-mono font-semibold text-slate-900">
                                    ${u.flat_number || u.flatNumber || 'GF'}
                                </td>
                                <td class="px-6 py-4 text-xs text-slate-600">
                                    ${u.phone || '+91 98421 00000'}
                                </td>
                                <td class="px-6 py-4">
                                    <span class="px-2.5 py-1 text-[11px] font-semibold rounded-full ${
                                        u.role === 'OWNER' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                                        u.role === 'ADMIN_TENANT' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                                        'bg-slate-100 text-slate-700'
                                    }">
                                        ${u.role || 'TENANT'}
                                    </span>
                                </td>
                                <td class="px-6 py-4">
                                    <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                        isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                                    }">
                                        <span class="w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-rose-500'}"></span>
                                        ${isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td class="px-6 py-4">
                                    <button class="toggle-rent-btn inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold cursor-pointer transition-colors ${
                                        isPaid ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200' : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
                                    }" data-id="${u.id}" data-email="${u.email}" title="Click to toggle payment status">
                                        <i data-lucide="${isPaid ? 'check-circle-2' : 'clock'}" class="w-3.5 h-3.5"></i>
                                        <span>${isPaid ? 'PAID' : 'PENDING'}</span>
                                    </button>
                                </td>
                                <td class="px-6 py-4 text-right">
                                    <button class="text-slate-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors delete-tenant-btn cursor-pointer" data-id="${u.id}" title="Remove tenant">
                                        <i data-lucide="trash-2" class="w-4 h-4 pointer-events-none"></i>
                                    </button>
                                </td>
                            </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Add Tenant Modal -->
        <div id="add-tenant-modal" class="fixed inset-0 bg-black/50 hidden items-center justify-center z-50 p-4 animate-in fade-in duration-150">
            <div class="bg-white rounded-2xl p-6 shadow-2xl w-full max-w-md border border-slate-100">
                <div class="flex items-center justify-between mb-5">
                    <div class="flex items-center gap-2.5">
                        <div class="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                            <i data-lucide="user-plus" class="w-5 h-5"></i>
                        </div>
                        <div>
                            <h2 class="text-base font-bold text-slate-900">Add Resident Profile</h2>
                            <p class="text-xs text-slate-500">Register new occupant in directory</p>
                        </div>
                    </div>
                    <button type="button" id="close-tenant-modal-btn" class="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer">
                        <i data-lucide="x" class="w-5 h-5"></i>
                    </button>
                </div>

                <form id="add-tenant-form" class="space-y-4">
                    <div>
                        <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Full Name</label>
                        <input id="tenant-name" required placeholder="e.g. Anand Kumar" class="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-black" type="text" />
                    </div>
                    <div>
                        <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Email Address</label>
                        <input id="tenant-email" required placeholder="e.g. anand@chemadura.com" class="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-black" type="email" />
                    </div>
                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Flat Number</label>
                            <select id="tenant-flat" class="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-black">
                                <option value="GF">GF</option>
                                <option value="F01 - FRONT">F01 - FRONT</option>
                                <option value="F01 - BACK">F01 - BACK</option>
                                <option value="F02 - FRONT">F02 - FRONT</option>
                                <option value="F02 - BACK">F02 - BACK</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Role</label>
                            <select id="tenant-role" class="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-black">
                                <option value="TENANT">TENANT</option>
                                <option value="ADMIN_TENANT">ADMIN_TENANT</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Phone Number</label>
                        <input id="tenant-phone" placeholder="+91 98421 00000" class="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-black" type="tel" />
                    </div>
                    <div class="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
                        <button type="button" id="cancel-tenant-modal-btn" class="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer">Cancel</button>
                        <button type="submit" class="px-5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-black rounded-xl transition-colors cursor-pointer shadow-sm">Add Resident</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    renderAppLayout({
        activeTab: 'tenants',
        title: 'Tenant Directory & CRM',
        subtitle: 'Resident occupancy roster, contact records, and payment reconciliation',
        actionsHtml: actionsHtml,
        bodyHtml: bodyHtml
    });

    // Attach modal events
    const addBtn = document.getElementById('add-tenant-btn');
    const modal = document.getElementById('add-tenant-modal');
    const closeBtn = document.getElementById('close-tenant-modal-btn');
    const cancelBtn = document.getElementById('cancel-tenant-modal-btn');
    const form = document.getElementById('add-tenant-form');

    if (addBtn && modal) {
        addBtn.addEventListener('click', () => {
            modal.classList.remove('hidden');
            modal.classList.add('flex');
        });
    }

    const closeModal = () => {
        if (modal) {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        }
    };
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const fullName = document.getElementById('tenant-name').value.trim();
            const email = document.getElementById('tenant-email').value.trim().toLowerCase();
            const flat = document.getElementById('tenant-flat').value;
            const role = document.getElementById('tenant-role').value;
            const phone = document.getElementById('tenant-phone').value.trim();

            const newUser = {
                id: crypto.randomUUID(),
                full_name: fullName,
                email: email,
                flat_number: flat,
                role: role,
                phone: phone || '+91 98421 00000',
                occupancy_status: 'active',
                payment_status: 'paid'
            };

            const { error } = await supabase.from('users').insert(newUser);
            if (!error) {
                closeModal();
                form.reset();
                if (typeof window.loadGlobalData === 'function') await window.loadGlobalData();
                renderTenants();
            } else {
                alert('Database Error: ' + error.message);
            }
        });
    }

    // Toggle rent status
    document.querySelectorAll('.toggle-rent-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = btn.dataset.id;
            const user = users.find(u => u.id === id);
            if (user) {
                const current = (user.payment_status || user.paymentStatus);
                const nextStatus = current === 'paid' ? 'pending' : 'paid';
                await supabase.from('users').update({ payment_status: nextStatus }).eq('id', id);
                if (typeof window.loadGlobalData === 'function') await window.loadGlobalData();
                renderTenants();
            }
        });
    });

    // Delete tenant
    document.querySelectorAll('.delete-tenant-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            if (confirm("Remove resident from directory?")) {
                const id = btn.dataset.id;
                await supabase.from('users').delete().eq('id', id);
                if (typeof window.loadGlobalData === 'function') await window.loadGlobalData();
                renderTenants();
            }
        });
    });

    // Export tenants handler
    const expBtn = document.getElementById('export-tenants-btn');
    if (expBtn) {
        expBtn.addEventListener('click', () => {
            if (window.exportUtils) window.exportUtils.exportExcel(state.records || []);
        });
    }
}

window.renderTenants = renderTenants;
