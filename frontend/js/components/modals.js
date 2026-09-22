// Modals Layer: Edit Expense, Edit Profile, Avatar Upload, and Invoice Preview
// Faithfully ported from React archive components.

(function() {
    const DEFAULT_AVATARS = [
        { id: 'avatar-1', label: 'Executive Man', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=250&auto=format&fit=crop&q=80' },
        { id: 'avatar-2', label: 'Professional Man', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=250&auto=format&fit=crop&q=80' },
        { id: 'avatar-3', label: 'Modern Woman', url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=250&auto=format&fit=crop&q=80' },
        { id: 'avatar-4', label: 'Classic Gentleman', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=250&auto=format&fit=crop&q=80' },
        { id: 'avatar-5', label: 'Architect / Designer', url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=250&auto=format&fit=crop&q=80' },
        { id: 'avatar-6', label: 'Young Resident', url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=250&auto=format&fit=crop&q=80' },
        { id: 'avatar-7', label: 'Professional Woman', url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=250&auto=format&fit=crop&q=80' },
        { id: 'avatar-8', label: 'Senior Resident', url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=250&auto=format&fit=crop&q=80' }
    ];

    // =========================================================================
    // 1. EDIT EXPENSE MODAL
    // =========================================================================
    function openEditExpenseModal(expense, onSaved) {
        let existing = document.getElementById('edit-expense-modal-overlay');
        if (existing) existing.remove();

        const overlay = document.createElement('div');
        overlay.id = 'edit-expense-modal-overlay';
        overlay.className = 'fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-in fade-in duration-100 backdrop-blur-xs';
        overlay.innerHTML = `
            <div class="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col p-6">
                <div class="flex items-center justify-between mb-5">
                    <div class="flex items-center gap-2.5">
                        <div class="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                            <i data-lucide="edit-3" class="w-5 h-5"></i>
                        </div>
                        <div>
                            <h2 class="text-base font-bold text-slate-900">Edit Maintenance Expense</h2>
                            <p class="text-xs text-slate-500">Update line item details and recalculate totals</p>
                        </div>
                    </div>
                    <button type="button" id="close-edit-exp-btn" class="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer">
                        <i data-lucide="x" class="w-5 h-5"></i>
                    </button>
                </div>

                <form id="edit-expense-form" class="space-y-4 text-sm">
                    <div>
                        <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Particulars / Description</label>
                        <input id="edit-exp-particular" required value="${expense.particular || ''}" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 focus:ring-2 focus:ring-black" />
                    </div>
                    <div>
                        <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Amount (₹)</label>
                        <input id="edit-exp-amount" required type="number" step="0.01" value="${expense.amount || 0}" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 focus:ring-2 focus:ring-black" />
                    </div>
                    <div>
                        <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Category</label>
                        <select id="edit-exp-category" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 focus:ring-2 focus:ring-black">
                            <option value="utilities" ${expense.category === 'utilities' ? 'selected' : ''}>Utilities (EB, Water)</option>
                            <option value="repairs" ${expense.category === 'repairs' ? 'selected' : ''}>Repairs & Motor</option>
                            <option value="cleaning" ${expense.category === 'cleaning' ? 'selected' : ''}>Cleaning & Housekeeping</option>
                            <option value="maintenance" ${expense.category === 'maintenance' ? 'selected' : ''}>General Maintenance</option>
                            <option value="other" ${expense.category === 'other' ? 'selected' : ''}>Other Miscellaneous</option>
                        </select>
                    </div>
                    <div class="flex items-center gap-2 pt-1">
                        <input type="checkbox" id="edit-exp-gst-check" ${(expense.gst_applicable || expense.gstApplicable) ? 'checked' : ''} class="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                        <label for="edit-exp-gst-check" class="text-xs font-semibold text-slate-700">GST Applicable</label>
                    </div>
                    <div>
                        <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Notes / Reference</label>
                        <input id="edit-exp-notes" value="${expense.notes || ''}" placeholder="e.g. Voucher Ref #104" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 focus:ring-2 focus:ring-black" />
                    </div>
                    <div class="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
                        <button type="button" id="cancel-edit-exp-btn" class="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer">Cancel</button>
                        <button type="submit" class="px-5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-black rounded-xl cursor-pointer shadow-sm">Save Changes</button>
                    </div>
                </form>
            </div>
        `;

        document.body.appendChild(overlay);
        if (window.lucide) window.lucide.createIcons();

        const close = () => overlay.remove();
        document.getElementById('close-edit-exp-btn')?.addEventListener('click', close);
        document.getElementById('cancel-edit-exp-btn')?.addEventListener('click', close);
        overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

        document.getElementById('edit-expense-form')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const updated = {
                ...expense,
                particular: document.getElementById('edit-exp-particular').value.trim(),
                amount: parseFloat(document.getElementById('edit-exp-amount').value) || 0,
                category: document.getElementById('edit-exp-category').value,
                gst_applicable: document.getElementById('edit-exp-gst-check').checked,
                gstApplicable: document.getElementById('edit-exp-gst-check').checked,
                notes: document.getElementById('edit-exp-notes').value.trim()
            };

            if (window.supabase) {
                await window.supabase.from('expenses').update({
                    particular: updated.particular,
                    amount: updated.amount,
                    category: updated.category,
                    gst_applicable: updated.gst_applicable,
                    notes: updated.notes
                }).eq('id', expense.id);
            }

            close();
            if (window.audioUtils) window.audioUtils.playSuccessChime();
            if (typeof onSaved === 'function') onSaved(updated);
        });
    }

    // =========================================================================
    // 2. EDIT PROFILE MODAL
    // =========================================================================
    function openEditProfileModal(user, onSaved) {
        let existing = document.getElementById('edit-profile-modal-overlay');
        if (existing) existing.remove();

        const overlay = document.createElement('div');
        overlay.id = 'edit-profile-modal-overlay';
        overlay.className = 'fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-in fade-in duration-100 backdrop-blur-xs';
        overlay.innerHTML = `
            <div class="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col p-6">
                <div class="flex items-center justify-between mb-5">
                    <div class="flex items-center gap-2.5">
                        <div class="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                            <i data-lucide="user-check" class="w-5 h-5"></i>
                        </div>
                        <div>
                            <h2 class="text-base font-bold text-slate-900">Edit Profile & Username</h2>
                            <p class="text-xs text-slate-500">Update personal directory profile</p>
                        </div>
                    </div>
                    <button type="button" id="close-profile-btn" class="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer">
                        <i data-lucide="x" class="w-5 h-5"></i>
                    </button>
                </div>

                <form id="edit-profile-form" class="space-y-4 text-sm">
                    <div>
                        <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Full Name</label>
                        <input id="profile-name" required value="${user.full_name || user.fullName || ''}" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 focus:ring-2 focus:ring-black" />
                    </div>
                    <div>
                        <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Username (@tag)</label>
                        <input id="profile-username" value="${user.username || ''}" placeholder="e.g. sampath_kumar" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 focus:ring-2 focus:ring-black" />
                    </div>
                    <div>
                        <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Phone Number</label>
                        <input id="profile-phone" value="${user.phone || ''}" placeholder="+91 98421 00000" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 focus:ring-2 focus:ring-black" />
                    </div>
                    <div class="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
                        <button type="button" id="cancel-profile-btn" class="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer">Cancel</button>
                        <button type="submit" class="px-5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-black rounded-xl cursor-pointer shadow-sm">Save Profile</button>
                    </div>
                </form>
            </div>
        `;

        document.body.appendChild(overlay);
        if (window.lucide) window.lucide.createIcons();

        const close = () => overlay.remove();
        document.getElementById('close-profile-btn')?.addEventListener('click', close);
        document.getElementById('cancel-profile-btn')?.addEventListener('click', close);
        overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

        document.getElementById('edit-profile-form')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const updated = {
                ...user,
                full_name: document.getElementById('profile-name').value.trim(),
                fullName: document.getElementById('profile-name').value.trim(),
                username: document.getElementById('profile-username').value.trim(),
                phone: document.getElementById('profile-phone').value.trim()
            };

            if (window.supabase && user.id) {
                await window.supabase.from('users').update({
                    full_name: updated.full_name,
                    username: updated.username,
                    phone: updated.phone
                }).eq('id', user.id);
            }

            if (window.appStore) window.appStore.setState({ user: updated });
            close();
            if (window.audioUtils) window.audioUtils.playSuccessChime();
            if (typeof onSaved === 'function') onSaved(updated);
        });
    }

    // =========================================================================
    // 3. AVATAR UPLOAD & PRESET MODAL
    // =========================================================================
    function openAvatarModal(currentUrl, onSelected) {
        let existing = document.getElementById('avatar-modal-overlay');
        if (existing) existing.remove();

        const overlay = document.createElement('div');
        overlay.id = 'avatar-modal-overlay';
        overlay.className = 'fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-in fade-in duration-100 backdrop-blur-xs';
        overlay.innerHTML = `
            <div class="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col p-6">
                <div class="flex items-center justify-between mb-5">
                    <div class="flex items-center gap-2.5">
                        <div class="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                            <i data-lucide="camera" class="w-5 h-5"></i>
                        </div>
                        <div>
                            <h2 class="text-base font-bold text-slate-900">Change Profile Photo</h2>
                            <p class="text-xs text-slate-500">Pick an executive avatar or upload photo</p>
                        </div>
                    </div>
                    <button type="button" id="close-avatar-btn" class="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer">
                        <i data-lucide="x" class="w-5 h-5"></i>
                    </button>
                </div>

                <div class="space-y-4">
                    <div class="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Choose From Executive Presets</div>
                    <div class="grid grid-cols-4 gap-3">
                        ${DEFAULT_AVATARS.map(av => `
                            <button type="button" class="avatar-preset-btn p-1 rounded-2xl border-2 hover:border-black transition-all cursor-pointer ${currentUrl === av.url ? 'border-black ring-2 ring-black/10' : 'border-transparent'}" data-url="${av.url}">
                                <img src="${av.url}" alt="${av.label}" class="w-14 h-14 rounded-xl object-cover" />
                            </button>
                        `).join('')}
                    </div>

                    <div class="pt-4 border-t border-slate-100">
                        <span class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Or Upload Custom Image</span>
                        <input type="file" id="custom-avatar-file" accept="image/*" class="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer" />
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);
        if (window.lucide) window.lucide.createIcons();

        const close = () => overlay.remove();
        document.getElementById('close-avatar-btn')?.addEventListener('click', close);
        overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

        overlay.querySelectorAll('.avatar-preset-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const url = btn.dataset.url;
                close();
                if (typeof onSelected === 'function') onSelected(url);
            });
        });

        document.getElementById('custom-avatar-file')?.addEventListener('change', (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (event) => {
                close();
                if (typeof onSelected === 'function') onSelected(event.target.result);
            };
            reader.readAsDataURL(file);
        });
    }

    // =========================================================================
    // 4. INVOICE PREVIEW MODAL
    // =========================================================================
    function openInvoicePreviewModal(invoice) {
        let existing = document.getElementById('invoice-preview-modal-overlay');
        if (existing) existing.remove();

        let rotation = 0;
        let zoom = 1;

        const overlay = document.createElement('div');
        overlay.id = 'invoice-preview-modal-overlay';
        overlay.className = 'fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 animate-in fade-in duration-150 backdrop-blur-sm';
        overlay.innerHTML = `
            <div class="w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
                <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                    <div>
                        <h2 class="text-sm font-bold text-slate-900 truncate">${invoice.file_name || invoice.fileName || 'Verified Document'}</h2>
                        <p class="text-xs text-slate-500">${invoice.particular || 'Maintenance Receipt Voucher'}</p>
                    </div>
                    <div class="flex items-center gap-2">
                        <button type="button" id="zoom-in-btn" class="p-2 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-semibold cursor-pointer" title="Zoom In">+</button>
                        <button type="button" id="zoom-out-btn" class="p-2 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-semibold cursor-pointer" title="Zoom Out">-</button>
                        <button type="button" id="rotate-btn" class="p-2 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-semibold cursor-pointer" title="Rotate">↻</button>
                        <a href="${invoice.file_url || invoice.fileUrl}" download="${invoice.file_name || 'document'}" class="p-2 rounded-lg bg-slate-900 text-white hover:bg-black text-xs font-semibold cursor-pointer" title="Download Document">↓ Download</a>
                        <button type="button" id="close-preview-btn" class="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer">✕</button>
                    </div>
                </div>

                <div class="flex-1 overflow-auto p-6 flex items-center justify-center bg-slate-100 min-h-[400px]">
                    ${(invoice.file_type === 'application/pdf' || (invoice.file_name && invoice.file_name.endsWith('.pdf'))) ? `
                        <iframe src="${invoice.file_url || invoice.fileUrl}" class="w-full h-[600px] rounded-lg border border-slate-200"></iframe>
                    ` : `
                        <img id="preview-img" src="${invoice.file_url || invoice.fileUrl}" alt="Invoice" class="max-h-[550px] max-w-full object-contain rounded-lg shadow-md transition-transform" />
                    `}
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        const close = () => overlay.remove();
        document.getElementById('close-preview-btn')?.addEventListener('click', close);
        overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

        const img = document.getElementById('preview-img');
        const updateTransform = () => {
            if (img) img.style.transform = `scale(${zoom}) rotate(${rotation}deg)`;
        };

        document.getElementById('zoom-in-btn')?.addEventListener('click', () => { zoom += 0.2; updateTransform(); });
        document.getElementById('zoom-out-btn')?.addEventListener('click', () => { zoom = Math.max(0.4, zoom - 0.2); updateTransform(); });
        document.getElementById('rotate-btn')?.addEventListener('click', () => { rotation = (rotation + 90) % 360; updateTransform(); });
    }

    window.modals = {
        openEditExpenseModal,
        openEditProfileModal,
        openAvatarModal,
        openInvoicePreviewModal
    };
})();
