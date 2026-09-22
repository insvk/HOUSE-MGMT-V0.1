// Tenant Directory & CRM Component with CosmoLex Styling
// Full line-by-line parity port from TenantDirectory.tsx

(function() {
    let searchTerm = '';
    let statusFilter = 'all';
    let showPasswordMap = {};
    let copiedKeyMap = {};
    let editingUser = null;

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
        { id: '5', name: 'Vibrant Teal', url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80' },
        { id: '6', name: 'Warm Amber', url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80' }
    ];

    function copyToClipboard(text, key, btnEl) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text);
        } else {
            const ta = document.createElement('textarea');
            ta.value = text;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
        }

        if (window.audioUtils && typeof window.audioUtils.playSuccessChime === 'function') {
            window.audioUtils.playSuccessChime();
        }

        copiedKeyMap[key] = true;
        if (btnEl) {
            const origHtml = btnEl.innerHTML;
            btnEl.innerHTML = '<i data-lucide="check" class="w-3.5 h-3.5 text-emerald-600 inline"></i>';
            if (window.lucide) window.lucide.createIcons();
            setTimeout(() => {
                btnEl.innerHTML = origHtml;
                if (window.lucide) window.lucide.createIcons();
                delete copiedKeyMap[key];
            }, 2000);
        }
    }

    function renderTenants() {
        const state = window.appStore ? window.appStore.getState() : {};
        const users = state.users || [];
        const house = state.house || null;
        const currentUserRole = state.user?.role || 'TENANT';
        const canManage = currentUserRole === 'OWNER' || currentUserRole === 'ADMIN_TENANT';

        // Filter and deduplicate - completely exclude evicted, soft-deleted, Rajesh Kumar, and test_resident_
        const uniqueUsersMap = new Map();
        users.forEach(u => {
            if (!u) return;
            if (u.deleted_at || u.is_active === false) return;
            const occ = (u.occupancy_status || u.occupancyStatus || '').toLowerCase();
            if (occ === 'evicted') return;
            const name = (u.full_name || u.fullName || '').trim();
            if (name === 'Rajesh Kumar' || name === '[DELETED_RESIDENT]' || name.includes('test_resident')) return;
            const email = (u.email || '').toLowerCase().trim();
            if (email.includes('test_resident_') || email.includes('@chemadura.deleted') || email.includes('admin.tenant@madurahouse.local')) return;

            if (!uniqueUsersMap.has(email) || u.id === 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11') {
                uniqueUsersMap.set(email, u);
            }
        });
        const uniqueUsers = Array.from(uniqueUsersMap.values());

        const filteredUsers = uniqueUsers.filter(u => {
            const matchesSearch = 
                (u.full_name || u.fullName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (u.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (u.flat_number || u.flatNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (u.phone || '').toLowerCase().includes(searchTerm.toLowerCase());

            const status = (u.occupancy_status || u.occupancyStatus || 'active').toLowerCase();
            const matchesStatus = statusFilter === 'all' || status === statusFilter.toLowerCase();

            return matchesSearch && matchesStatus;
        });

        const activeCount = uniqueUsers.filter(u => (u.occupancy_status || u.occupancyStatus || '').toLowerCase() === 'active').length;
        const paidRentCount = uniqueUsers.filter(u => (u.payment_status || u.paymentStatus || '').toLowerCase() === 'paid').length;
        const paidMaintCount = uniqueUsers.filter(u => (u.maintenance_status || u.maintenanceStatus || '').toLowerCase() === 'paid').length;

        const actionsHtml = `
            <div class="flex items-center gap-2">
                <button id="export-tenants-excel-btn" class="px-3 py-1.5 rounded-lg bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200 hover:border-emerald-300 text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-all active:scale-95 cursor-pointer" title="Export roster to Excel">
                    <i data-lucide="file-spreadsheet" class="w-3.5 h-3.5 text-emerald-600"></i>
                    <span>Excel</span>
                </button>
                <button id="export-tenants-pdf-btn" class="px-3 py-1.5 rounded-lg bg-white hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-200 hover:border-rose-300 text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-all active:scale-95 cursor-pointer" title="Export roster to PDF">
                    <i data-lucide="file-text" class="w-3.5 h-3.5 text-rose-600"></i>
                    <span>PDF</span>
                </button>
                ${canManage ? `
                    <button id="add-tenant-btn" class="px-3.5 py-1.5 rounded-lg bg-[#405189] hover:bg-[#364473] text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer">
                        <i data-lucide="user-plus" class="w-3.5 h-3.5"></i>
                        <span>Add Occupant</span>
                    </button>
                ` : ''}
            </div>
        `;

        const bodyHtml = `
            <!-- KPI Metrics -->
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
                    <div>
                        <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Residents</span>
                        <p class="text-xl font-bold text-slate-900 mt-0.5">${uniqueUsers.length} Occupants</p>
                    </div>
                    <div class="w-10 h-10 rounded-xl bg-blue-50 text-[#405189] flex items-center justify-center">
                        <i data-lucide="users" class="w-5 h-5"></i>
                    </div>
                </div>
                <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
                    <div>
                        <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Active Units</span>
                        <p class="text-xl font-bold text-slate-900 mt-0.5">${activeCount} of ${AVAILABLE_FLATS.length} Flats</p>
                    </div>
                    <div class="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <i data-lucide="home" class="w-5 h-5"></i>
                    </div>
                </div>
                <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
                    <div>
                        <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Rent Cleared</span>
                        <p class="text-xl font-bold text-emerald-600 mt-0.5">${paidRentCount} / ${uniqueUsers.length} Paid</p>
                    </div>
                    <div class="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <i data-lucide="indian-rupee" class="w-5 h-5"></i>
                    </div>
                </div>
                <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
                    <div>
                        <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Maintenance Cleared</span>
                        <p class="text-xl font-bold text-purple-600 mt-0.5">${paidMaintCount} / ${uniqueUsers.length} Paid</p>
                    </div>
                    <div class="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                        <i data-lucide="shield-check" class="w-5 h-5"></i>
                    </div>
                </div>
            </div>

            <!-- Controls & Filters Bar -->
            <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
                <div class="flex items-center gap-3 w-full sm:w-auto flex-1">
                    <div class="relative flex-1 sm:max-w-xs">
                        <i data-lucide="search" class="w-4 h-4 text-slate-400 absolute left-3 top-2.5"></i>
                        <input
                            type="text"
                            id="tenant-search-input"
                            value="${searchTerm}"
                            placeholder="Search by name, email, flat..."
                            class="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#405189] transition-all"
                        />
                    </div>
                    <div class="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs shrink-0">
                        <i data-lucide="filter" class="w-3.5 h-3.5 text-slate-400"></i>
                        <select id="tenant-status-filter" class="bg-transparent text-xs font-medium text-slate-700 focus:outline-none cursor-pointer">
                            <option value="all" ${statusFilter === 'all' ? 'selected' : ''}>All Status</option>
                            <option value="active" ${statusFilter === 'active' ? 'selected' : ''}>Active Occupants</option>
                            <option value="inactive" ${statusFilter === 'inactive' ? 'selected' : ''}>Inactive</option>
                            <option value="evicted" ${statusFilter === 'evicted' ? 'selected' : ''}>Evicted</option>
                        </select>
                    </div>
                </div>

                <div class="text-xs text-slate-500 font-medium self-end sm:self-center">
                    Showing <span class="font-bold text-slate-800">${filteredUsers.length}</span> of <span class="font-bold text-slate-800">${uniqueUsers.length}</span> residents
                </div>
            </div>

            <!-- Quick Credentials Notice Banner -->
            <div class="bg-gradient-to-r from-blue-50/90 to-indigo-50/90 border border-blue-200 rounded-xl p-3.5 text-xs text-blue-900 flex items-start gap-3 shadow-2xs">
                <div class="w-7 h-7 rounded-lg bg-blue-100/80 text-[#405189] flex items-center justify-center shrink-0 mt-0.5">
                    <i data-lucide="shield" class="w-4 h-4"></i>
                </div>
                <div class="flex-1 leading-relaxed">
                    <span class="font-bold text-[#405189]">Occupant Self-Service Authentication Enabled:</span>
                    <span class="text-slate-700 ml-1">
                        Residents can log into this portal using either their <strong>Flat Number</strong>, <strong>Email</strong>, or <strong>Tenant ID</strong> alongside their password. Click the 
                        <span class="inline-flex items-center px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-semibold text-slate-700 mx-0.5">👁️</span> icon to view passwords, or 
                        <span class="inline-flex items-center px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-semibold text-slate-700 mx-0.5">📋</span> to copy complete login credentials package to share on WhatsApp or Email.
                    </span>
                </div>
            </div>

            <!-- Tenants Grid -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                ${filteredUsers.length === 0 ? `
                    <div class="col-span-full py-16 text-center text-slate-400 bg-white rounded-xl border border-slate-200 shadow-xs">
                        <div class="flex flex-col items-center justify-center">
                            <i data-lucide="users" class="w-10 h-10 text-slate-300 mb-2"></i>
                            <p class="font-bold text-slate-700 text-sm">No residents found</p>
                            <p class="text-xs text-slate-400 mt-1 max-w-sm">No occupant profiles match your active search and filter conditions.</p>
                        </div>
                    </div>
                ` : ''}

                ${filteredUsers.map(user => {
                    const rentStatus = (user.payment_status || user.paymentStatus || 'unpaid').toLowerCase();
                    const isPaid = rentStatus === 'paid';
                    const isPending = rentStatus === 'pending';
                    const maintStatus = (user.maintenance_status || user.maintenanceStatus || 'unpaid').toLowerCase();
                    const isMaintPaid = maintStatus === 'paid';
                    const isMaintPending = maintStatus === 'pending';
                    const isOccupantActive = (user.occupancy_status || user.occupancyStatus || 'active').toLowerCase() === 'active';
                    const avatar = user.avatar_url || user.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';
                    const isPwdVisible = !!showPasswordMap[user.id];
                    const pwd = user.password || 'Tenant@123';
                    const userRole = user.role || 'TENANT';
                    const fullName = user.full_name || user.fullName || 'Resident';
                    const flatNum = user.flat_number || user.flatNumber || 'GF';
                    const rentVal = user.rent_amount || user.rentAmount || 14000;
                    const depositVal = user.deposit_amount || user.depositAmount || 70000;

                    return `
                        <div class="bg-white rounded-xl border border-slate-200 shadow-xs hover:border-[#405189]/40 hover:shadow-md transition-all flex flex-col justify-between p-4" data-user-id="${user.id}">
                            <div>
                                <!-- Card Header -->
                                <div class="flex items-start justify-between gap-3">
                                    <div class="flex items-center gap-3">
                                        <div class="relative group/avatar shrink-0">
                                            <img
                                                src="${avatar}"
                                                alt="${fullName}"
                                                class="w-12 h-12 rounded-full object-cover border-2 border-slate-100 shadow-2xs cursor-pointer"
                                                onclick="window.modals && window.modals.openAvatarUploadModal ? window.modals.openAvatarUploadModal('${user.id}') : null"
                                                title="Click to change photo"
                                            />
                                            ${canManage ? `
                                                <button
                                                    type="button"
                                                    class="absolute -bottom-1 -right-1 p-1 bg-[#405189] text-white rounded-full shadow hover:bg-[#364473] transition-transform hover:scale-110 cursor-pointer"
                                                    onclick="window.modals && window.modals.openAvatarUploadModal ? window.modals.openAvatarUploadModal('${user.id}') : null"
                                                    title="Change Photo"
                                                >
                                                    <i data-lucide="camera" class="w-2.5 h-2.5"></i>
                                                </button>
                                            ` : ''}
                                        </div>
                                        <div>
                                            <h3 class="text-sm font-bold text-slate-800 leading-tight">${fullName}</h3>
                                            <div class="text-[11px] text-[#405189] font-bold flex items-center gap-1 mt-0.5">
                                                <i data-lucide="home" class="w-3 h-3"></i>
                                                <span>${flatNum}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div class="flex flex-col items-end gap-1.5 shrink-0">
                                        <span class="text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                                            userRole === 'OWNER' ? 'bg-[#405189]/10 text-[#405189] border border-[#405189]/20' :
                                            userRole === 'ADMIN_TENANT' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                                            'bg-slate-100 text-slate-600 border border-slate-200'
                                        }">
                                            ${userRole}
                                        </span>

                                        <div class="flex items-center gap-1">
                                            <!-- Rent Status Toggle -->
                                            <button
                                                type="button"
                                                class="toggle-rent-btn text-[9px] px-2 py-0.5 rounded font-bold uppercase transition-all flex items-center gap-1 cursor-pointer hover:shadow-2xs active:scale-95 ${
                                                    isPaid ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100' :
                                                    isPending ? 'bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100' :
                                                    'bg-rose-50 text-rose-700 border border-rose-300 hover:bg-rose-100'
                                                }"
                                                data-id="${user.id}"
                                                data-curr="${rentStatus}"
                                                title="Click to toggle Rent status (Paid → Pending → Unpaid)"
                                            >
                                                <span class="font-semibold opacity-70">Rent:</span>
                                                <span class="status-val">${rentStatus}</span>
                                            </button>

                                            <!-- Maintenance Status Toggle -->
                                            <button
                                                type="button"
                                                class="toggle-maint-btn text-[9px] px-2 py-0.5 rounded font-bold uppercase transition-all flex items-center gap-1 cursor-pointer hover:shadow-2xs active:scale-95 ${
                                                    isMaintPaid ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100' :
                                                    isMaintPending ? 'bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100' :
                                                    'bg-rose-50 text-rose-800 border border-rose-300 hover:bg-rose-100'
                                                }"
                                                data-id="${user.id}"
                                                data-curr="${maintStatus}"
                                                title="Click to toggle Maintenance status (Paid → Pending → Unpaid)"
                                            >
                                                <span class="font-semibold opacity-70">Maint:</span>
                                                <span class="status-val">${maintStatus}</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <!-- Details Body -->
                                <div class="mt-3.5 pt-3 border-t border-slate-100 space-y-1.5 text-xs">
                                    <!-- Tenant ID -->
                                    <div class="flex items-center justify-between text-slate-600">
                                        <span class="text-slate-400 flex items-center gap-1.5"><i data-lucide="key" class="w-3.5 h-3.5"></i> Tenant ID:</span>
                                        <div class="flex items-center gap-1">
                                            <span class="font-mono text-[10px] text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200" title="${user.id}">
                                                ${user.id.length > 14 ? user.id.substring(0, 8) + '...' : user.id}
                                            </span>
                                            <button
                                                type="button"
                                                class="copy-btn p-1 hover:bg-slate-200 text-slate-500 hover:text-slate-800 rounded transition-colors cursor-pointer"
                                                data-text="${user.id}"
                                                data-key="id_${user.id}"
                                                title="Copy full Tenant ID"
                                            >
                                                <i data-lucide="copy" class="w-3 h-3"></i>
                                            </button>
                                        </div>
                                    </div>

                                    ${user.username ? `
                                        <div class="flex items-center justify-between text-slate-600">
                                            <span class="text-slate-400 flex items-center gap-1.5"><i data-lucide="shield" class="w-3.5 h-3.5"></i> Username:</span>
                                            <span class="font-mono text-[11px] font-bold text-[#405189]">@${user.username.replace(/^@/, '')}</span>
                                        </div>
                                    ` : ''}

                                    <!-- Email -->
                                    <div class="flex items-center justify-between text-slate-600">
                                        <span class="text-slate-400 flex items-center gap-1.5"><i data-lucide="mail" class="w-3.5 h-3.5"></i> Email:</span>
                                        <span class="font-medium text-slate-800 truncate max-w-[170px]" title="${user.email}">${user.email}</span>
                                    </div>

                                    <!-- Phone -->
                                    <div class="flex items-center justify-between text-slate-600">
                                        <span class="text-slate-400 flex items-center gap-1.5"><i data-lucide="phone" class="w-3.5 h-3.5"></i> Phone:</span>
                                        <span class="font-medium text-slate-800">${user.phone || '+91 98421 00000'}</span>
                                    </div>

                                    <!-- Password & Credentials Package -->
                                    <div class="flex items-center justify-between text-slate-600">
                                        <span class="text-slate-400 flex items-center gap-1.5"><i data-lucide="lock" class="w-3.5 h-3.5"></i> Password:</span>
                                        <div class="flex items-center gap-1.5">
                                            <span class="font-mono text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                                ${isPwdVisible ? pwd : '••••••••'}
                                            </span>
                                            <button
                                                type="button"
                                                class="toggle-pwd-btn p-1 hover:bg-slate-200 text-slate-500 hover:text-slate-800 rounded transition-colors cursor-pointer"
                                                data-id="${user.id}"
                                                title="${isPwdVisible ? 'Hide Password' : 'Show Password'}"
                                            >
                                                <i data-lucide="${isPwdVisible ? 'eye-off' : 'eye'}" class="w-3 h-3"></i>
                                            </button>
                                            <button
                                                type="button"
                                                class="copy-credentials-btn p-1 hover:bg-slate-200 text-slate-500 hover:text-[#405189] rounded transition-colors cursor-pointer"
                                                data-id="${user.id}"
                                                title="Copy complete login credentials package for resident"
                                            >
                                                <i data-lucide="copy" class="w-3 h-3"></i>
                                            </button>
                                        </div>
                                    </div>

                                    <!-- Rent Amount -->
                                    <div class="flex items-center justify-between text-slate-600">
                                        <span class="text-slate-400 flex items-center gap-1.5"><i data-lucide="wallet" class="w-3.5 h-3.5"></i> Rent / Month:</span>
                                        <span class="font-bold text-[#0ab39c]">₹${Number(rentVal).toLocaleString('en-IN')}</span>
                                    </div>

                                    ${user.emergency_contact || user.emergencyContact ? `
                                        <div class="flex items-center justify-between text-slate-600">
                                            <span class="text-slate-400 flex items-center gap-1.5"><i data-lucide="phone-call" class="w-3.5 h-3.5"></i> Emergency:</span>
                                            <span class="text-slate-700">${user.emergency_contact || user.emergencyContact}</span>
                                        </div>
                                    ` : ''}

                                    ${user.notes ? `
                                        <div class="p-2 rounded bg-slate-50 border border-slate-100 text-[11px] text-slate-600 mt-2">
                                            <strong class="text-slate-700">Notes:</strong> ${user.notes}
                                        </div>
                                    ` : ''}
                                </div>
                            </div>

                            <!-- Actions -->
                            ${canManage ? `
                                <div class="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                                    <button
                                        type="button"
                                        class="edit-tenant-btn flex-1 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                                        data-id="${user.id}"
                                    >
                                        <i data-lucide="edit-3" class="w-3.5 h-3.5 text-[#405189]"></i>
                                        <span>Edit Profile</span>
                                    </button>
                                    <button
                                        type="button"
                                        class="delete-tenant-btn p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs transition-colors cursor-pointer"
                                        data-id="${user.id}"
                                        data-name="${fullName}"
                                        title="Delete Tenant Profile"
                                    >
                                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                                    </button>
                                </div>
                            ` : ''}
                        </div>
                    `;
                }).join('')}
            </div>

            <!-- Add/Edit Tenant Modal -->
            <div id="tenant-form-modal" class="fixed inset-0 bg-black/60 backdrop-blur-xs hidden items-center justify-center z-50 p-4 animate-in fade-in duration-150">
                <div class="bg-white rounded-2xl max-w-lg w-full border border-slate-100 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
                    <div class="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                        <div class="flex items-center gap-2.5">
                            <div class="w-9 h-9 rounded-xl bg-blue-50 text-[#405189] flex items-center justify-center">
                                <i data-lucide="user-cog" class="w-5 h-5"></i>
                            </div>
                            <div>
                                <h3 id="modal-tenant-title" class="text-base font-bold text-slate-900">Add Resident Profile</h3>
                                <p class="text-xs text-slate-500">Configure credentials, assigned flat & rent terms</p>
                            </div>
                        </div>
                        <button type="button" id="close-tenant-modal-x" class="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer">
                            <i data-lucide="x" class="w-5 h-5"></i>
                        </button>
                    </div>

                    <form id="tenant-modal-form" class="p-6 space-y-4 overflow-y-auto flex-1">
                        <!-- Avatar Selection -->
                        <div class="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                            <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Resident Avatar Picture</label>
                            <div class="flex items-center gap-3">
                                <img id="modal-avatar-preview" src="${DEFAULT_AVATARS[0].url}" class="w-12 h-12 rounded-full object-cover border border-slate-300 shadow-xs shrink-0" />
                                <div class="flex-1">
                                    <input type="text" id="modal-avatar-url" placeholder="https://..." class="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#405189]" />
                                    <div class="flex items-center gap-1.5 mt-2 overflow-x-auto pb-1">
                                        ${DEFAULT_AVATARS.map(av => `
                                            <button type="button" class="select-avatar-preset-btn shrink-0 w-6 h-6 rounded-full border border-slate-300 overflow-hidden hover:scale-110 transition-transform cursor-pointer" data-url="${av.url}">
                                                <img src="${av.url}" class="w-full h-full object-cover" />
                                            </button>
                                        `).join('')}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Name & Email -->
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Full Name *</label>
                                <input type="text" id="modal-tenant-name" required placeholder="e.g. Anand Kumar" class="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#405189]" />
                            </div>
                            <div>
                                <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Email Address *</label>
                                <input type="email" id="modal-tenant-email" required placeholder="e.g. anand@chemadura.com" class="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#405189]" />
                            </div>
                        </div>

                        <!-- Username & Password -->
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Username (Optional)</label>
                                <input type="text" id="modal-tenant-username" placeholder="e.g. anand" class="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#405189]" />
                            </div>
                            <div>
                                <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Portal Password *</label>
                                <input type="text" id="modal-tenant-password" required value="Tenant@123" class="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#405189]" />
                            </div>
                        </div>

                        <!-- Flat & Role -->
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Assigned Flat *</label>
                                <select id="modal-tenant-flat" class="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#405189]">
                                    ${AVAILABLE_FLATS.map(f => `<option value="${f}">${f}</option>`).join('')}
                                </select>
                            </div>
                            <div>
                                <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Portal Role *</label>
                                <select id="modal-tenant-role" class="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#405189]">
                                    <option value="TENANT">TENANT</option>
                                    <option value="ADMIN_TENANT">ADMIN_TENANT</option>
                                    <option value="OWNER">OWNER</option>
                                </select>
                            </div>
                        </div>

                        <!-- Phone & Emergency Contact -->
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Phone Number</label>
                                <input type="tel" id="modal-tenant-phone" placeholder="+91 98421 00000" class="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#405189]" />
                            </div>
                            <div>
                                <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Emergency Contact</label>
                                <input type="text" id="modal-tenant-emergency" placeholder="Name & Phone" class="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#405189]" />
                            </div>
                        </div>

                        <!-- Rent & Deposit Amounts -->
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Monthly Rent (₹)</label>
                                <input type="number" id="modal-tenant-rent" value="14000" class="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#405189]" />
                            </div>
                            <div>
                                <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Security Deposit (₹)</label>
                                <input type="number" id="modal-tenant-deposit" value="70000" class="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#405189]" />
                            </div>
                        </div>

                        <!-- Statuses -->
                        <div class="grid grid-cols-3 gap-3">
                            <div>
                                <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Occupancy</label>
                                <select id="modal-tenant-occupancy" class="w-full px-2.5 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#405189]">
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                    <option value="evicted">Evicted</option>
                                </select>
                            </div>
                            <div>
                                <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Rent Status</label>
                                <select id="modal-tenant-payment-status" class="w-full px-2.5 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#405189]">
                                    <option value="paid">Paid</option>
                                    <option value="pending">Pending</option>
                                    <option value="unpaid">Unpaid</option>
                                </select>
                            </div>
                            <div>
                                <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Maintenance</label>
                                <select id="modal-tenant-maint-status" class="w-full px-2.5 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#405189]">
                                    <option value="unpaid">Unpaid</option>
                                    <option value="pending">Pending</option>
                                    <option value="paid">Paid</option>
                                </select>
                            </div>
                        </div>

                        <!-- Notes -->
                        <div>
                            <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Notes & Lease Details</label>
                            <textarea id="modal-tenant-notes" rows="2" placeholder="Lease duration, meter numbers, special agreements..." class="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#405189]"></textarea>
                        </div>

                        <div class="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
                            <button type="button" id="cancel-tenant-modal-btn" class="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer">Cancel</button>
                            <button type="submit" class="px-5 py-2 text-xs font-semibold text-white bg-[#405189] hover:bg-[#364473] rounded-xl transition-all shadow-xs cursor-pointer">Save Resident</button>
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

        // Attach event handlers
        attachTenantEvents(uniqueUsers, house);
    }

    function attachTenantEvents(users, house) {
        // Search Input
        const searchInput = document.getElementById('tenant-search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                searchTerm = e.target.value;
                renderTenants();
                // Restore focus
                const newInput = document.getElementById('tenant-search-input');
                if (newInput) {
                    newInput.focus();
                    newInput.setSelectionRange(searchTerm.length, searchTerm.length);
                }
            });
        }

        // Status Filter
        const statusSelect = document.getElementById('tenant-status-filter');
        if (statusSelect) {
            statusSelect.addEventListener('change', (e) => {
                statusFilter = e.target.value;
                renderTenants();
            });
        }

        // Export Excel
        const excelBtn = document.getElementById('export-tenants-excel-btn');
        if (excelBtn) {
            excelBtn.addEventListener('click', () => {
                if (window.exportUtils && typeof window.exportUtils.exportTenantsToExcel === 'function') {
                    window.exportUtils.exportTenantsToExcel(users, house);
                } else if (window.exportUtils && typeof window.exportUtils.exportExcel === 'function') {
                    window.exportUtils.exportExcel(users);
                }
                if (window.audioUtils) window.audioUtils.playSuccessChime();
            });
        }

        // Export PDF
        const pdfBtn = document.getElementById('export-tenants-pdf-btn');
        if (pdfBtn) {
            pdfBtn.addEventListener('click', () => {
                if (window.exportUtils && typeof window.exportUtils.exportTenantsToPDF === 'function') {
                    window.exportUtils.exportTenantsToPDF(users, house);
                }
                if (window.audioUtils) window.audioUtils.playSuccessChime();
            });
        }

        // Password Show/Hide Toggles
        document.querySelectorAll('.toggle-pwd-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const userId = btn.dataset.id;
                showPasswordMap[userId] = !showPasswordMap[userId];
                renderTenants();
            });
        });

        // Copy generic text buttons
        document.querySelectorAll('.copy-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                copyToClipboard(btn.dataset.text, btn.dataset.key, btn);
            });
        });

        // Copy complete credentials package
        document.querySelectorAll('.copy-credentials-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const userId = btn.dataset.id;
                const u = users.find(x => x.id === userId);
                if (u) {
                    const text = `CHE-MADURA HS-1 MGMT Resident Portal Credentials:
Portal URL: ${window.location.origin}
Resident: ${u.full_name || u.fullName || 'Resident'}
Assigned Flat: ${u.flat_number || u.flatNumber || 'GF'}
Email / Login: ${u.email}
Tenant ID: ${u.id}
${u.username ? `Username: @${u.username}\n` : ''}Password: ${u.password || 'Tenant@123'}

Please keep your login credentials secure.`;
                    copyToClipboard(text, `cred_${userId}`, btn);
                }
            });
        });

        // Toggle Rent Status
        document.querySelectorAll('.toggle-rent-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                e.preventDefault();
                const userId = btn.dataset.id;
                const currentStoreUsers = (window.appStore ? window.appStore.getState().users : []) || [];
                const u = currentStoreUsers.find(x => x.id === userId) || users.find(x => x.id === userId);
                if (!u) return;

                const curr = (btn.dataset.curr || u.payment_status || u.paymentStatus || 'unpaid').toLowerCase();
                const next = curr === 'paid' ? 'pending' : curr === 'pending' ? 'unpaid' : 'paid';

                // Optimistic button update
                btn.dataset.curr = next;
                const valSpan = btn.querySelector('.status-val');
                if (valSpan) valSpan.textContent = next;
                btn.className = `toggle-rent-btn text-[9px] px-2 py-0.5 rounded font-bold uppercase transition-all flex items-center gap-1 cursor-pointer hover:shadow-2xs active:scale-95 ${
                    next === 'paid' ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100' :
                    next === 'pending' ? 'bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100' :
                    'bg-rose-50 text-rose-700 border border-rose-300 hover:bg-rose-100'
                }`;

                // Immediate store update
                const updatedUsers = currentStoreUsers.map(x => x.id === userId ? { ...x, payment_status: next, paymentStatus: next } : x);
                if (window.appStore) window.appStore.setState({ users: updatedUsers });

                // Update local storage cache
                try {
                    const cached = localStorage.getItem('madura_house_users_v2');
                    if (cached) {
                        const parsed = JSON.parse(cached);
                        const updatedCache = parsed.map(x => x.id === userId ? { ...x, payment_status: next, paymentStatus: next } : x);
                        localStorage.setItem('madura_house_users_v2', JSON.stringify(updatedCache));
                    }
                } catch (err) {}

                if (window.audioUtils && typeof window.audioUtils.playToggleChime === 'function') {
                    window.audioUtils.playToggleChime();
                }

                // Supabase permanent sync
                const { error } = await supabase.from('users').update({ payment_status: next, paymentStatus: next }).eq('id', userId);
                if (error) {
                    console.error('Failed to sync rent status to Supabase:', error);
                    alert('Failed to update rent status in database: ' + error.message);
                    if (typeof window.loadGlobalData === 'function') await window.loadGlobalData();
                }
                renderTenants();
            });
        });

        // Toggle Maintenance Status
        document.querySelectorAll('.toggle-maint-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                e.preventDefault();
                const userId = btn.dataset.id;
                const currentStoreUsers = (window.appStore ? window.appStore.getState().users : []) || [];
                const u = currentStoreUsers.find(x => x.id === userId) || users.find(x => x.id === userId);
                if (!u) return;

                const curr = (btn.dataset.curr || u.maintenance_status || u.maintenanceStatus || 'unpaid').toLowerCase();
                const next = curr === 'paid' ? 'pending' : curr === 'pending' ? 'unpaid' : 'paid';

                // Optimistic button update
                btn.dataset.curr = next;
                const valSpan = btn.querySelector('.status-val');
                if (valSpan) valSpan.textContent = next;
                btn.className = `toggle-maint-btn text-[9px] px-2 py-0.5 rounded font-bold uppercase transition-all flex items-center gap-1 cursor-pointer hover:shadow-2xs active:scale-95 ${
                    next === 'paid' ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100' :
                    next === 'pending' ? 'bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100' :
                    'bg-rose-50 text-rose-800 border border-rose-300 hover:bg-rose-100'
                }`;

                // Immediate store update
                const updatedUsers = currentStoreUsers.map(x => x.id === userId ? { ...x, maintenance_status: next, maintenanceStatus: next } : x);
                if (window.appStore) window.appStore.setState({ users: updatedUsers });

                // Update local storage cache
                try {
                    const cached = localStorage.getItem('madura_house_users_v2');
                    if (cached) {
                        const parsed = JSON.parse(cached);
                        const updatedCache = parsed.map(x => x.id === userId ? { ...x, maintenance_status: next, maintenanceStatus: next } : x);
                        localStorage.setItem('madura_house_users_v2', JSON.stringify(updatedCache));
                    }
                } catch (err) {}

                if (window.audioUtils && typeof window.audioUtils.playToggleChime === 'function') {
                    window.audioUtils.playToggleChime();
                }

                // Supabase permanent sync (DO NOT send maintenanceStatus column)
                const { error } = await supabase.from('users').update({ maintenance_status: next }).eq('id', userId);
                if (error) {
                    console.error('Failed to sync maintenance status to Supabase:', error);
                    alert('Failed to update maintenance status in database: ' + error.message);
                    if (typeof window.loadGlobalData === 'function') await window.loadGlobalData();
                }
                renderTenants();
            });
        });

        // Modal Elements
        const modal = document.getElementById('tenant-form-modal');
        const modalForm = document.getElementById('tenant-modal-form');
        const modalTitle = document.getElementById('modal-tenant-title');
        const closeBtn = document.getElementById('close-tenant-modal-x');
        const cancelBtn = document.getElementById('cancel-tenant-modal-btn');
        const avatarPreview = document.getElementById('modal-avatar-preview');
        const avatarInput = document.getElementById('modal-avatar-url');

        const openModal = (userToEdit = null) => {
            editingUser = userToEdit;
            if (modalTitle) {
                modalTitle.textContent = userToEdit ? `Edit Profile - ${userToEdit.full_name || userToEdit.fullName}` : 'Add Resident Profile';
            }

            const nameEl = document.getElementById('modal-tenant-name');
            const emailEl = document.getElementById('modal-tenant-email');
            const userEl = document.getElementById('modal-tenant-username');
            const pwdEl = document.getElementById('modal-tenant-password');
            const flatEl = document.getElementById('modal-tenant-flat');
            const roleEl = document.getElementById('modal-tenant-role');
            const phoneEl = document.getElementById('modal-tenant-phone');
            const emergEl = document.getElementById('modal-tenant-emergency');
            const rentEl = document.getElementById('modal-tenant-rent');
            const depEl = document.getElementById('modal-tenant-deposit');
            const occEl = document.getElementById('modal-tenant-occupancy');
            const payEl = document.getElementById('modal-tenant-payment-status');
            const maintEl = document.getElementById('modal-tenant-maint-status');
            const notesEl = document.getElementById('modal-tenant-notes');

            if (userToEdit) {
                if (nameEl) nameEl.value = userToEdit.full_name || userToEdit.fullName || '';
                if (emailEl) emailEl.value = userToEdit.email || '';
                if (userEl) userEl.value = userToEdit.username || '';
                if (pwdEl) pwdEl.value = userToEdit.password || 'Tenant@123';
                if (flatEl) flatEl.value = userToEdit.flat_number || userToEdit.flatNumber || 'GF';
                if (roleEl) roleEl.value = userToEdit.role || 'TENANT';
                if (phoneEl) phoneEl.value = userToEdit.phone || '';
                if (emergEl) emergEl.value = userToEdit.emergency_contact || userToEdit.emergencyContact || '';
                if (rentEl) rentEl.value = userToEdit.rent_amount || userToEdit.rentAmount || 14000;
                if (depEl) depEl.value = userToEdit.deposit_amount || userToEdit.depositAmount || 70000;
                if (occEl) occEl.value = (userToEdit.occupancy_status || userToEdit.occupancyStatus || 'active').toLowerCase();
                if (payEl) payEl.value = (userToEdit.payment_status || userToEdit.paymentStatus || 'paid').toLowerCase();
                if (maintEl) maintEl.value = (userToEdit.maintenance_status || userToEdit.maintenanceStatus || 'unpaid').toLowerCase();
                if (notesEl) notesEl.value = userToEdit.notes || '';
                if (avatarInput) avatarInput.value = userToEdit.avatar_url || userToEdit.avatarUrl || DEFAULT_AVATARS[0].url;
                if (avatarPreview) avatarPreview.src = userToEdit.avatar_url || userToEdit.avatarUrl || DEFAULT_AVATARS[0].url;
            } else {
                modalForm.reset();
                if (pwdEl) pwdEl.value = 'Tenant@123';
                if (rentEl) rentEl.value = '14000';
                if (depEl) depEl.value = '70000';
                if (avatarInput) avatarInput.value = DEFAULT_AVATARS[0].url;
                if (avatarPreview) avatarPreview.src = DEFAULT_AVATARS[0].url;
            }

            modal.classList.remove('hidden');
            modal.classList.add('flex');
            if (window.lucide) window.lucide.createIcons();
        };

        const closeModal = () => {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
            editingUser = null;
        };

        const addBtn = document.getElementById('add-tenant-btn');
        if (addBtn) addBtn.addEventListener('click', () => openModal(null));
        if (closeBtn) closeBtn.addEventListener('click', closeModal);
        if (cancelBtn) cancelBtn.addEventListener('click', closeModal);

        // Preset avatar buttons
        document.querySelectorAll('.select-avatar-preset-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const url = btn.dataset.url;
                if (avatarInput) avatarInput.value = url;
                if (avatarPreview) avatarPreview.src = url;
            });
        });

        if (avatarInput) {
            avatarInput.addEventListener('input', () => {
                if (avatarPreview) avatarPreview.src = avatarInput.value;
            });
        }

        // Edit tenant buttons
        document.querySelectorAll('.edit-tenant-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const u = users.find(x => x.id === btn.dataset.id);
                if (u) openModal(u);
            });
        });

        // Delete tenant buttons
        document.querySelectorAll('.delete-tenant-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.dataset.id;
                const name = btn.dataset.name;
                if (id === 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11') {
                    alert('Protected Resident: Superadmin account cannot be removed.');
                    return;
                }
                if (confirm(`Are you sure you want to permanently remove resident ${name}?`)) {
                    btn.disabled = true;
                    // Persist eviction and soft-delete in Supabase
                    await supabase.from('users').update({
                        occupancy_status: 'evicted',
                        occupancyStatus: 'evicted',
                        is_active: false,
                        deleted_at: new Date().toISOString()
                    }).eq('id', id);
                    await supabase.from('users').delete().eq('id', id);

                    // Update local appStore immediately
                    const storeUsers = (window.appStore ? window.appStore.getState().users : []) || [];
                    const updatedUsers = storeUsers.filter(u => u.id !== id);
                    if (window.appStore) window.appStore.setState({ users: updatedUsers });

                    if (window.audioUtils) window.audioUtils.playSuccessChime();
                    if (typeof window.loadGlobalData === 'function') await window.loadGlobalData();
                    renderTenants();
                }
            });
        });

        // Submit Form
        if (modalForm) {
            modalForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const name = document.getElementById('modal-tenant-name').value.trim();
                const email = document.getElementById('modal-tenant-email').value.trim().toLowerCase();
                const username = (document.getElementById('modal-tenant-username').value || '').trim().replace(/^@/, '');
                const password = document.getElementById('modal-tenant-password').value.trim();
                const flat = document.getElementById('modal-tenant-flat').value;
                const role = document.getElementById('modal-tenant-role').value;
                const phone = document.getElementById('modal-tenant-phone').value.trim();
                const emergency = document.getElementById('modal-tenant-emergency').value.trim();
                const rent = parseFloat(document.getElementById('modal-tenant-rent').value) || 0;
                const deposit = parseFloat(document.getElementById('modal-tenant-deposit').value) || 0;
                const occ = document.getElementById('modal-tenant-occupancy').value;
                const pay = document.getElementById('modal-tenant-payment-status').value;
                const maint = document.getElementById('modal-tenant-maint-status').value;
                const notes = document.getElementById('modal-tenant-notes').value.trim();
                const avatar = document.getElementById('modal-avatar-url').value || DEFAULT_AVATARS[0].url;

                if (editingUser) {
                    const updatedPayload = {
                        full_name: name,
                        fullName: name,
                        email: email,
                        username: username,
                        password: password,
                        flat_number: flat,
                        flatNumber: flat,
                        role: role,
                        phone: phone,
                        emergency_contact: emergency,
                        emergencyContact: emergency,
                        rent_amount: rent,
                        rentAmount: rent,
                        deposit_amount: deposit,
                        depositAmount: deposit,
                        occupancy_status: occ,
                        occupancyStatus: occ,
                        payment_status: pay,
                        paymentStatus: pay,
                        maintenance_status: maint,
                        notes: notes,
                        avatar_url: avatar,
                        avatarUrl: avatar
                    };
                    const { error } = await supabase.from('users').update({
                        full_name: name,
                        email: email,
                        username: username,
                        password: password,
                        flat_number: flat,
                        role: role,
                        phone: phone,
                        emergency_contact: emergency,
                        rent_amount: rent,
                        deposit_amount: deposit,
                        occupancy_status: occ,
                        payment_status: pay,
                        paymentStatus: pay,
                        maintenance_status: maint,
                        notes: notes,
                        avatar_url: avatar
                    }).eq('id', editingUser.id);
                    if (error) {
                        alert('Update failed: ' + error.message);
                        return;
                    }

                    // Update local appStore immediately
                    const storeUsers = (window.appStore ? window.appStore.getState().users : []) || [];
                    const updatedUsers = storeUsers.map(x => x.id === editingUser.id ? { ...x, ...updatedPayload } : x);
                    if (window.appStore) window.appStore.setState({ users: updatedUsers });
                } else {
                    const newPayload = {
                        id: crypto.randomUUID(),
                        full_name: name,
                        fullName: name,
                        email: email,
                        username: username,
                        password: password || 'Tenant@123',
                        flat_number: flat,
                        flatNumber: flat,
                        role: role,
                        phone: phone || '+91 98421 00000',
                        emergency_contact: emergency,
                        emergencyContact: emergency,
                        rent_amount: rent,
                        rentAmount: rent,
                        deposit_amount: deposit,
                        depositAmount: deposit,
                        occupancy_status: occ,
                        occupancyStatus: occ,
                        payment_status: pay,
                        paymentStatus: pay,
                        maintenance_status: maint,
                        notes: notes,
                        avatar_url: avatar,
                        avatarUrl: avatar
                    };
                    const { error } = await supabase.from('users').insert({
                        id: newPayload.id,
                        full_name: name,
                        email: email,
                        username: username,
                        password: password || 'Tenant@123',
                        flat_number: flat,
                        role: role,
                        phone: phone || '+91 98421 00000',
                        emergency_contact: emergency,
                        rent_amount: rent,
                        deposit_amount: deposit,
                        occupancy_status: occ,
                        payment_status: pay,
                        paymentStatus: pay,
                        maintenance_status: maint,
                        notes: notes,
                        avatar_url: avatar
                    });
                    if (error) {
                        alert('Create failed: ' + error.message);
                        return;
                    }

                    // Update local appStore immediately
                    const storeUsers = (window.appStore ? window.appStore.getState().users : []) || [];
                    if (window.appStore) window.appStore.setState({ users: [...storeUsers, newPayload] });
                }

                if (window.audioUtils) window.audioUtils.playSuccessChime();
                closeModal();
                if (typeof window.loadGlobalData === 'function') await window.loadGlobalData();
                renderTenants();
            });
        }
    }

    window.renderTenants = renderTenants;
})();
