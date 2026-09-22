// Invoices & OCR Gallery Component with CosmoLex Styling
function renderInvoices() {
    const state = window.appStore ? window.appStore.getState() : {};
    const invoices = state.invoices || [];

    const actionsHtml = `
        <button id="upload-invoice-btn" class="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer">
            <i data-lucide="upload-cloud" class="w-3.5 h-3.5"></i>
            <span>Upload Invoice</span>
        </button>
    `;

    const bodyHtml = `
        <!-- Stats Summary -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                <div>
                    <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Archived Documents</span>
                    <p class="text-2xl font-bold text-slate-900 mt-1">${invoices.length} Invoices</p>
                </div>
                <div class="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <i data-lucide="receipt" class="w-5 h-5"></i>
                </div>
            </div>
            <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                <div>
                    <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider">OCR Verified Bills</span>
                    <p class="text-2xl font-bold text-slate-900 mt-1">${invoices.length} Cleared</p>
                </div>
                <div class="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <i data-lucide="file-check" class="w-5 h-5"></i>
                </div>
            </div>
            <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                <div>
                    <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Storage Engine</span>
                    <p class="text-2xl font-bold text-slate-900 mt-1">Supabase Bucket</p>
                </div>
                <div class="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                    <i data-lucide="database" class="w-5 h-5"></i>
                </div>
            </div>
        </div>

        <!-- Invoices Grid -->
        <div class="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
            <div class="flex items-center justify-between mb-6">
                <div>
                    <h2 class="text-base font-bold text-slate-900">Document Repository & OCR Receipts</h2>
                    <p class="text-xs text-slate-500">Verified electricity bills, repair receipts, and supplier invoices</p>
                </div>
                <span class="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">${invoices.length} documents</span>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                ${invoices.length === 0 ? `
                    <div class="col-span-full py-16 text-center text-slate-400">
                        <div class="flex flex-col items-center justify-center">
                            <i data-lucide="receipt" class="w-12 h-12 text-slate-300 mb-3"></i>
                            <p class="font-medium text-slate-600 text-base">No invoices uploaded yet</p>
                            <p class="text-xs text-slate-400 mt-1 max-w-sm">Upload electricity bills or repair receipts to link verified documentation directly to maintenance ledger line items.</p>
                            <button id="upload-first-btn" class="mt-4 px-4 py-2 bg-slate-900 hover:bg-black text-white text-xs font-semibold rounded-xl cursor-pointer shadow-sm transition-all">Upload First Bill</button>
                        </div>
                    </div>
                ` : ''}
                ${invoices.map(inv => `
                    <div class="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all overflow-hidden flex flex-col group">
                        <div class="h-44 bg-slate-50 flex items-center justify-center p-4 relative border-b border-slate-100">
                            ${inv.file_type === 'application/pdf' ? `
                                <div class="flex flex-col items-center text-rose-500">
                                    <i data-lucide="file-text" class="w-12 h-12"></i>
                                    <span class="text-[11px] font-bold mt-1 text-slate-600 uppercase tracking-wider">PDF Document</span>
                                </div>
                            ` : `
                                <img src="${inv.file_url}" class="max-h-full max-w-full object-contain rounded" alt="Bill Preview" onerror="this.style.display='none'">
                            `}
                            <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-3 transition-opacity">
                                <a href="${inv.file_url}" target="_blank" class="w-9 h-9 bg-white text-slate-900 rounded-full flex items-center justify-center hover:bg-blue-50 transition-colors shadow-md">
                                    <i data-lucide="external-link" class="w-4 h-4"></i>
                                </a>
                            </div>
                        </div>
                        <div class="p-4 flex-1 flex flex-col justify-between">
                            <div>
                                <h3 class="font-semibold text-slate-900 text-sm truncate" title="${inv.file_name}">${inv.file_name}</h3>
                                <p class="text-xs text-slate-400 mt-0.5">${inv.particular || 'Verified Receipt'}</p>
                            </div>
                            <div class="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500 font-medium">
                                <span>${(inv.file_size ? (inv.file_size / 1024).toFixed(1) + ' KB' : 'PDF')}</span>
                                <span>${new Date(inv.uploaded_at || inv.created_at || Date.now()).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>

        <!-- Upload Invoice Modal -->
        <div id="upload-modal" class="fixed inset-0 bg-black/50 hidden items-center justify-center z-50 p-4 animate-in fade-in duration-150">
            <div class="bg-white rounded-2xl p-6 shadow-2xl w-full max-w-md border border-slate-100">
                <div class="flex items-center justify-between mb-5">
                    <div class="flex items-center gap-2.5">
                        <div class="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                            <i data-lucide="upload-cloud" class="w-5 h-5"></i>
                        </div>
                        <div>
                            <h2 class="text-base font-bold text-slate-900">Upload Receipt / Invoice</h2>
                            <p class="text-xs text-slate-500">Attach document to maintenance records</p>
                        </div>
                    </div>
                    <button type="button" id="close-upload-modal-btn" class="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer">
                        <i data-lucide="x" class="w-5 h-5"></i>
                    </button>
                </div>

                <form id="upload-invoice-form" class="space-y-4">
                    <div>
                        <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Description / Bill Name</label>
                        <input id="inv-desc" required placeholder="e.g. EB Bill Voucher 2026-09" class="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-black" type="text" />
                    </div>
                    <div>
                        <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">File Document (Image or PDF)</label>
                        <input id="inv-file" required type="file" accept="image/*,application/pdf" class="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-700 focus:outline-none" />
                    </div>
                    <div class="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
                        <button type="button" id="cancel-upload-modal-btn" class="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer">Cancel</button>
                        <button type="submit" class="px-5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-black rounded-xl transition-colors cursor-pointer shadow-sm">Upload Document</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    renderAppLayout({
        activeTab: 'invoices',
        title: 'Invoices & OCR Documents',
        subtitle: 'Digital vouchers, proof of expenditures, and scanned electricity bills',
        actionsHtml: actionsHtml,
        bodyHtml: bodyHtml
    });

    // Event listeners
    const uploadBtn = document.getElementById('upload-invoice-btn');
    const firstUploadBtn = document.getElementById('upload-first-btn');
    const modal = document.getElementById('upload-modal');
    const closeBtn = document.getElementById('close-upload-modal-btn');
    const cancelBtn = document.getElementById('cancel-upload-modal-btn');
    const form = document.getElementById('upload-invoice-form');

    const openModal = () => {
        if (modal) {
            modal.classList.remove('hidden');
            modal.classList.add('flex');
        }
    };
    const closeModal = () => {
        if (modal) {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        }
    };

    if (uploadBtn) uploadBtn.addEventListener('click', openModal);
    if (firstUploadBtn) firstUploadBtn.addEventListener('click', openModal);
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const desc = document.getElementById('inv-desc').value.trim();
            const fileInput = document.getElementById('inv-file');
            const file = fileInput.files?.[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = async () => {
                const newInv = {
                    id: crypto.randomUUID(),
                    file_name: file.name,
                    file_url: reader.result,
                    file_type: file.type,
                    file_size: file.size,
                    particular: desc,
                    uploaded_by: state.user?.id,
                    created_at: new Date().toISOString()
                };

                const { error } = await supabase.from('invoices').insert(newInv);
                if (!error) {
                    closeModal();
                    form.reset();
                    if (typeof window.loadGlobalData === 'function') await window.loadGlobalData();
                    renderInvoices();
                } else {
                    alert('Upload Error: ' + error.message);
                }
            };
            reader.readAsDataURL(file);
        });
    }
}

window.renderInvoices = renderInvoices;
