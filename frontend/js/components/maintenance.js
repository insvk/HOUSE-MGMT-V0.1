// Maintenance Component Logic with CosmoLex Styling, Edit Modal, GST, and Invoice Uploads
// Faithfully ported from React MaintenanceModule.tsx

function renderMaintenance() {
    const state = window.appStore ? window.appStore.getState() : {};
    const records = state.records || [];
    const currentRecord = records.length > 0 ? records[0] : null;
    const expenses = currentRecord ? (currentRecord.expenses || []) : [];
    const totalExpenses = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0);
    const users = state.users || [];
    const activeTenants = users.filter(u => (u.occupancy_status === 'active' || u.occupancyStatus === 'active')).length || 5;
    const individualContribution = (totalExpenses / (activeTenants || 1)).toFixed(2);

    const categoryBadges = {
        utilities: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        repairs: 'bg-amber-50 text-amber-700 border-amber-200',
        cleaning: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        maintenance: 'bg-rose-50 text-rose-700 border-rose-200',
        other: 'bg-blue-50 text-blue-700 border-blue-200'
    };

    const actionsHtml = `
        <button id="export-excel-btn" class="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-black text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer">
            <i data-lucide="file-spreadsheet" class="w-3.5 h-3.5"></i>
            <span>Excel</span>
        </button>
        <button id="export-pdf-btn" class="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer">
            <i data-lucide="download" class="w-3.5 h-3.5"></i>
            <span>PDF Report</span>
        </button>
        <button id="add-expense-btn" class="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer">
            <i data-lucide="plus" class="w-3.5 h-3.5"></i>
            <span>Add Expense</span>
        </button>
    `;

    const bodyHtml = `
        <!-- Summary Stats Card -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                <div>
                    <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Ledger Amount</span>
                    <p class="text-2xl font-bold text-slate-900 mt-1">₹${totalExpenses.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                </div>
                <div class="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <i data-lucide="wallet" class="w-5 h-5"></i>
                </div>
            </div>
            <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                <div>
                    <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Equal Share Due</span>
                    <p class="text-2xl font-bold text-slate-900 mt-1">₹${individualContribution} / Flat</p>
                </div>
                <div class="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <i data-lucide="receipt" class="w-5 h-5"></i>
                </div>
            </div>
            <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                <div>
                    <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Line Items Audited</span>
                    <p class="text-2xl font-bold text-slate-900 mt-1">${expenses.length} Records</p>
                </div>
                <div class="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                    <i data-lucide="calendar" class="w-5 h-5"></i>
                </div>
            </div>
        </div>

        <!-- Ledger Table -->
        <div class="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                    <h2 class="text-base font-bold text-slate-900">Itemized Maintenance Expenses</h2>
                    <p class="text-xs text-slate-500">All registered expenditures for active billing split</p>
                </div>
                <span class="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">${expenses.length} line items</span>
            </div>

            <div class="overflow-x-auto">
                <table class="w-full text-left text-sm">
                    <thead class="bg-[#fafbfc] border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        <tr>
                            <th class="px-6 py-3.5">SL</th>
                            <th class="px-6 py-3.5">Particulars & Description</th>
                            <th class="px-6 py-3.5">Category</th>
                            <th class="px-6 py-3.5">Invoice / Voucher</th>
                            <th class="px-6 py-3.5 text-right">Amount (₹)</th>
                            <th class="px-6 py-3.5 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100 font-normal">
                        ${expenses.length === 0 ? `
                            <tr>
                                <td colspan="6" class="py-12 text-center text-slate-400">
                                    <div class="flex flex-col items-center justify-center">
                                        <i data-lucide="receipt" class="w-8 h-8 text-slate-300 mb-2"></i>
                                        <p class="font-medium text-slate-600">No expenses recorded for this billing cycle</p>
                                        <p class="text-xs text-slate-400 mt-1">Click "Add Expense" to register your first expenditure</p>
                                    </div>
                                </td>
                            </tr>
                        ` : ''}
                        ${expenses.map((e, idx) => `
                            <tr class="hover:bg-slate-50/80 transition-colors">
                                <td class="px-6 py-4 text-xs font-mono text-slate-400">#${idx + 1}</td>
                                <td class="px-6 py-4">
                                    <div class="font-semibold text-slate-900">${e.particular}</div>
                                    ${e.notes ? `<div class="text-xs text-slate-400">${e.notes}</div>` : ''}
                                </td>
                                <td class="px-6 py-4">
                                    <span class="px-2.5 py-1 text-xs font-medium rounded-full border ${categoryBadges[e.category] || 'bg-slate-100 text-slate-700 border-slate-200'}">
                                        ${(e.category || 'maintenance').toUpperCase()}
                                    </span>
                                </td>
                                <td class="px-6 py-4 text-xs text-slate-500">
                                    ${(e.invoice_file_name || e.invoiceFileName) ? `
                                        <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                                            <i data-lucide="paperclip" class="w-3 h-3"></i>
                                            <span>${e.invoice_file_name || e.invoiceFileName}</span>
                                        </span>
                                    ` : '<span class="text-slate-300">—</span>'}
                                </td>
                                <td class="px-6 py-4 text-right font-bold text-slate-900">
                                    ₹${parseFloat(e.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </td>
                                <td class="px-6 py-4 text-right">
                                    <div class="flex items-center justify-end gap-1">
                                        <button class="text-slate-400 hover:text-blue-600 p-1.5 rounded-lg hover:bg-blue-50 transition-colors edit-exp-btn cursor-pointer" data-id="${e.id}" title="Edit expense">
                                            <i data-lucide="edit-3" class="w-4 h-4 pointer-events-none"></i>
                                        </button>
                                        <button class="text-slate-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors delete-exp-btn cursor-pointer" data-id="${e.id}" title="Delete expense">
                                            <i data-lucide="trash-2" class="w-4 h-4 pointer-events-none"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Add Expense Modal -->
        <div id="add-modal" class="fixed inset-0 bg-black/50 hidden items-center justify-center z-50 p-4 animate-in fade-in duration-150 backdrop-blur-xs">
            <div class="bg-white rounded-2xl p-6 shadow-2xl w-full max-w-md border border-slate-100 max-h-[90vh] overflow-y-auto">
                <div class="flex items-center justify-between mb-5">
                    <div class="flex items-center gap-2.5">
                        <div class="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                            <i data-lucide="plus-circle" class="w-5 h-5"></i>
                        </div>
                        <div>
                            <h2 class="text-base font-bold text-slate-900">Add New Expense</h2>
                            <p class="text-xs text-slate-500">Record maintenance or utility payment</p>
                        </div>
                    </div>
                    <button type="button" id="close-modal-btn" class="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer">
                        <i data-lucide="x" class="w-5 h-5"></i>
                    </button>
                </div>

                <form id="add-expense-form" class="space-y-4">
                    <div>
                        <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Particulars / Description</label>
                        <input id="exp-name" required placeholder="e.g. EB Common Area Electricity Bill" class="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-black" type="text" />
                    </div>
                    <div>
                        <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Amount (₹)</label>
                        <input id="exp-amount" required placeholder="e.g. 2400.00" class="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-black" type="number" step="0.01" />
                    </div>
                    <div>
                        <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Category</label>
                        <select id="exp-cat" class="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-black">
                            <option value="utilities">Utilities (EB, Water)</option>
                            <option value="repairs">Repairs & Motor</option>
                            <option value="cleaning">Cleaning & Housekeeping</option>
                            <option value="maintenance">General Maintenance</option>
                            <option value="other">Other Miscellaneous</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Attach Bill / Invoice Document</label>
                        <input id="exp-file-input" type="file" accept="image/*,application/pdf" class="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer" />
                    </div>
                    <div class="flex items-center gap-2 pt-1">
                        <input type="checkbox" id="exp-notify-check" checked class="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer" />
                        <label for="exp-notify-check" class="text-xs font-semibold text-slate-700 cursor-pointer">Notify Residents via Resend Email Alert</label>
                    </div>
                    <div class="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
                        <button type="button" id="cancel-modal-btn" class="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer">Cancel</button>
                        <button type="submit" class="px-5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-black rounded-xl transition-colors cursor-pointer shadow-sm">Save Expense</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    renderAppLayout({
        activeTab: 'maintenance',
        title: 'Maintenance Ledger',
        subtitle: 'Itemized expenditures, split allocation, and financial ledger',
        actionsHtml: actionsHtml,
        bodyHtml: bodyHtml
    });

    // Attach Event Listeners
    const addBtn = document.getElementById('add-expense-btn');
    const modal = document.getElementById('add-modal');
    const closeBtn = document.getElementById('close-modal-btn');
    const cancelBtn = document.getElementById('cancel-modal-btn');
    const form = document.getElementById('add-expense-form');

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
            const particular = document.getElementById('exp-name').value.trim();
            const amount = parseFloat(document.getElementById('exp-amount').value) || 0;
            const cat = document.getElementById('exp-cat').value;
            const fileInput = document.getElementById('exp-file-input');
            const notify = document.getElementById('exp-notify-check')?.checked;
            const recordId = currentRecord ? currentRecord.id : null;

            if (!recordId) {
                alert("No active record found!"); return;
            }

            let invoiceUrl = undefined;
            let invoiceFileName = undefined;
            if (fileInput && fileInput.files?.[0]) {
                const f = fileInput.files[0];
                invoiceFileName = f.name;
                invoiceUrl = await new Promise((res) => {
                    const r = new FileReader();
                    r.onload = () => res(r.result);
                    r.readAsDataURL(f);
                });
            }

            const newExp = {
                id: crypto.randomUUID(),
                maintenance_record_id: recordId,
                particular: particular,
                amount: amount,
                category: cat,
                invoice_file_name: invoiceFileName,
                invoice_url: invoiceUrl,
                added_by: state.user?.full_name || 'Property Administrator'
            };

            const { error } = await supabase.from('expenses').insert(newExp);
            
            if (!error) {
                const newTotal = (parseFloat(currentRecord.grand_total) || 0) + amount;
                await supabase.from('maintenance_records').update({ grand_total: newTotal }).eq('id', recordId);
                closeModal();
                form.reset();

                if (notify && window.resendClient && users.length > 0) {
                    const activeResidents = users.filter(u => u.occupancy_status === 'active' && u.email);
                    window.resendClient.sendBulkMaintenanceEmails({
                        recipients: activeResidents.map(u => ({ email: u.email, fullName: u.full_name, flatNumber: u.flat_number })),
                        record: { ...currentRecord, grand_total: newTotal },
                        house: state.house,
                        senderName: state.user?.full_name || 'Sampath Kumar'
                    });
                }

                if (window.audioUtils) window.audioUtils.playSuccessChime();
                if (typeof window.loadGlobalData === 'function') await window.loadGlobalData();
                renderMaintenance();
            } else {
                alert(error.message);
            }
        });
    }

    // Edit handler
    document.querySelectorAll('.edit-exp-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.dataset.id;
            const exp = expenses.find(x => x.id === id);
            if (exp && window.modals && window.modals.openEditExpenseModal) {
                window.modals.openEditExpenseModal(exp, async () => {
                    if (typeof window.loadGlobalData === 'function') await window.loadGlobalData();
                    renderMaintenance();
                });
            }
        });
    });

    // Delete handlers
    document.querySelectorAll('.delete-exp-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            if (confirm("Are you sure you want to delete this expense?")) {
                const id = btn.dataset.id;
                const expense = expenses.find(x => x.id === id);
                if (expense) {
                    await supabase.from('expenses').delete().eq('id', id);
                    const newTotal = (parseFloat(currentRecord.grand_total) || 0) - parseFloat(expense.amount);
                    await supabase.from('maintenance_records').update({ grand_total: Math.max(0, newTotal) }).eq('id', currentRecord.id);
                    if (window.audioUtils) window.audioUtils.playWarningChime();
                    if (typeof window.loadGlobalData === 'function') await window.loadGlobalData();
                    renderMaintenance();
                }
            }
        });
    });

    // Document Export handlers
    document.getElementById('export-pdf-btn')?.addEventListener('click', () => {
        if (window.exportUtils) window.exportUtils.exportPDF(records, state.house);
    });
    document.getElementById('export-excel-btn')?.addEventListener('click', () => {
        if (window.exportUtils) window.exportUtils.exportExcel(records, state.house);
    });
}

window.renderMaintenance = renderMaintenance;
