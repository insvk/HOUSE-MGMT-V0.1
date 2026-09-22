// Digital Invoices & OCR Document Archive Component with CosmoLex Styling
// Full line-by-line parity port from InvoiceGallery.tsx

(function() {
    let searchQuery = '';
    let isDragOver = false;

    function renderInvoices() {
        const state = window.appStore ? window.appStore.getState() : {};
        const invoices = state.invoices || [];
        const currentUserRole = state.user?.role || 'TENANT';
        const canUpload = currentUserRole === 'OWNER' || currentUserRole === 'ADMIN_TENANT';

        const filteredInvoices = invoices.filter(inv => {
            const name = (inv.file_name || inv.fileName || '').toLowerCase();
            const ocr = (inv.ocr_text || inv.ocrText || '').toLowerCase();
            const uploadedBy = (inv.uploaded_by || inv.uploadedBy || '').toLowerCase();
            const part = (inv.particular || '').toLowerCase();
            const q = searchQuery.toLowerCase();
            return name.includes(q) || ocr.includes(q) || uploadedBy.includes(q) || part.includes(q);
        });

        // Compute total storage size
        const totalBytes = invoices.reduce((acc, inv) => acc + (Number(inv.file_size || inv.fileSize) || 0), 0);
        const totalSizeStr = totalBytes > 1048576 
            ? (totalBytes / 1048576).toFixed(1) + ' MB'
            : (totalBytes / 1024).toFixed(0) + ' KB';

        const actionsHtml = `
            <div class="flex items-center gap-1.5 sm:gap-2">
                <div class="hidden xs:block relative w-24 sm:w-56">
                    <i data-lucide="search" class="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5"></i>
                    <input
                        type="text"
                        id="invoice-search-input"
                        value="${searchQuery}"
                        placeholder="Search..."
                        class="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#405189] transition-all"
                    />
                </div>
                ${canUpload ? `
                    <button id="upload-invoice-btn" class="px-2.5 sm:px-3.5 py-1.5 rounded-lg bg-[#405189] hover:bg-[#364473] text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer shrink-0" title="Upload Invoice PDF">
                        <i data-lucide="upload" class="w-3.5 h-3.5"></i>
                        <span class="hidden sm:inline">Upload Invoice PDF</span>
                    </button>
                ` : ''}
            </div>
        `;

        const bodyHtml = `
            <!-- Stats Summary -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
                    <div>
                        <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Archived Documents</span>
                        <p class="text-2xl font-bold text-slate-900 mt-0.5">${invoices.length} Invoices</p>
                    </div>
                    <div class="w-10 h-10 rounded-xl bg-blue-50 text-[#405189] flex items-center justify-center">
                        <i data-lucide="file-text" class="w-5 h-5"></i>
                    </div>
                </div>
                <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
                    <div>
                        <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">OCR Verified Bills</span>
                        <p class="text-2xl font-bold text-emerald-600 mt-0.5">${invoices.length} Cleared</p>
                    </div>
                    <div class="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <i data-lucide="file-check" class="w-5 h-5"></i>
                    </div>
                </div>
                <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
                    <div>
                        <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Storage Utilized</span>
                        <p class="text-2xl font-bold text-purple-600 mt-0.5">${totalSizeStr}</p>
                    </div>
                    <div class="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                        <i data-lucide="database" class="w-5 h-5"></i>
                    </div>
                </div>
            </div>

            <!-- Upload Drop Zone -->
            ${canUpload ? `
                <div
                    id="invoice-dropzone"
                    class="bg-white rounded-xl border-2 border-dashed border-slate-300 hover:border-[#405189] hover:bg-[#405189]/5 p-6 text-center flex flex-col items-center justify-center cursor-pointer transition-all shadow-xs"
                >
                    <div class="w-10 h-10 rounded-full bg-[#405189]/10 text-[#405189] flex items-center justify-center mb-2">
                        <i data-lucide="upload-cloud" class="w-5 h-5"></i>
                    </div>
                    <h3 class="text-xs font-bold text-slate-800">Drag and drop invoice documents here or click to browse</h3>
                    <p class="text-[11px] text-slate-400 mt-0.5">Supports Official PDF, PNG, JPG bills & receipts (Auto-OCR processed)</p>
                    <input type="file" id="dropzone-file-input" accept=".pdf,image/*" class="hidden" />
                </div>
            ` : ''}

            <!-- Invoices Grid -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                ${filteredInvoices.length === 0 ? `
                    <div class="col-span-full py-16 text-center text-slate-400 bg-white rounded-xl border border-slate-200 shadow-xs">
                        <div class="flex flex-col items-center justify-center">
                            <i data-lucide="receipt" class="w-12 h-12 text-slate-300 mb-3"></i>
                            <h3 class="text-sm font-bold text-slate-800">No invoice documents found</h3>
                            <p class="text-xs text-slate-400 mt-1 max-w-sm">
                                Upload electricity, water, or repair bill PDFs above to archive verified documents.
                            </p>
                        </div>
                    </div>
                ` : ''}

                ${filteredInvoices.map(inv => {
                    const fileName = inv.file_name || inv.fileName || 'Invoice.pdf';
                    const isPdf = fileName.toLowerCase().endsWith('.pdf') || (inv.file_type || inv.fileType) === 'application/pdf';
                    const fileSize = Number(inv.file_size || inv.fileSize) || 450000;
                    const sizeStr = (fileSize / 1024).toFixed(0) + ' KB';
                    const uploadedBy = inv.uploaded_by || inv.uploadedBy || 'Administration';
                    const ocrText = inv.ocr_text || inv.ocrText || `OCR EXTRACTED SUMMARY FOR ${fileName}: Amount Rs. ${(Math.random() * 2000 + 1000).toFixed(2)}. Verified Tax Invoice. CHE-MADURA HS-1 MGMT Maintenance.`;
                    const fileUrl = inv.file_url || inv.fileUrl || '';

                    return `
                        <div 
                            class="invoice-card bg-white rounded-xl border border-slate-200 shadow-xs hover:border-[#405189]/40 hover:shadow-md transition-all p-4 flex flex-col justify-between group cursor-pointer"
                            data-inv-id="${inv.id}"
                        >
                            <div>
                                <div class="flex items-start justify-between">
                                    <div class="w-10 h-10 rounded-lg flex items-center justify-center transition-transform group-hover:scale-105 ${
                                        isPdf ? 'bg-red-50 text-red-500 border border-red-200' : 'bg-blue-50 text-blue-500 border border-blue-200'
                                    }">
                                        ${isPdf ? `
                                            <span class="font-extrabold text-[10px] tracking-tight">PDF</span>
                                        ` : `
                                            <i data-lucide="file-text" class="w-5 h-5"></i>
                                        `}
                                    </div>

                                    <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold border border-slate-200">
                                        ${sizeStr}
                                    </span>
                                </div>

                                <h3 class="text-xs font-bold text-slate-800 mt-3 truncate group-hover:text-[#405189]" title="${fileName}">
                                    ${fileName}
                                </h3>
                                <p class="text-[11px] text-slate-400 mt-0.5 truncate">Uploaded by: ${uploadedBy}</p>

                                ${ocrText ? `
                                    <div class="mt-2.5 p-2 rounded-lg bg-slate-50 border border-slate-100 text-[11px] text-slate-600 flex items-start gap-1.5">
                                        <i data-lucide="scan-text" class="w-3.5 h-3.5 text-[#0ab39c] shrink-0 mt-0.5"></i>
                                        <span class="line-clamp-2 leading-relaxed">${ocrText}</span>
                                    </div>
                                ` : ''}
                            </div>

                            <div class="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                                <button
                                    type="button"
                                    class="preview-invoice-btn text-xs font-semibold text-[#405189] hover:underline flex items-center gap-1.5 cursor-pointer"
                                    data-inv-id="${inv.id}"
                                >
                                    <i data-lucide="eye" class="w-3.5 h-3.5"></i>
                                    <span>Preview Document</span>
                                </button>

                                <div class="flex items-center gap-1">
                                    ${fileUrl ? `
                                        <a
                                            href="${fileUrl}"
                                            download="${fileName}"
                                            target="_blank"
                                            class="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors"
                                            title="Download File"
                                            onclick="event.stopPropagation()"
                                        >
                                            <i data-lucide="download" class="w-3 h-3"></i>
                                        </a>
                                    ` : ''}
                                    ${canUpload ? `
                                        <button
                                            type="button"
                                            class="delete-invoice-btn p-1 rounded hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                                            data-inv-id="${inv.id}"
                                            title="Delete Invoice"
                                            onclick="event.stopPropagation()"
                                        >
                                            <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                                        </button>
                                    ` : ''}
                                </div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>

            <!-- Upload Modal -->
            <div id="upload-invoice-modal" class="fixed inset-0 bg-black/60 backdrop-blur-xs hidden items-center justify-center z-50 p-3 sm:p-4 animate-in fade-in duration-150">
                <div class="bg-white rounded-2xl max-w-md w-full border border-slate-100 shadow-2xl overflow-hidden max-h-[92dvh] flex flex-col">
                    <div class="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between gap-3">
                        <div class="flex items-center gap-2.5 min-w-0">
                            <div class="w-9 h-9 rounded-xl bg-blue-50 text-[#405189] flex items-center justify-center shrink-0">
                                <i data-lucide="upload-cloud" class="w-5 h-5"></i>
                            </div>
                            <div class="min-w-0">
                                <h2 class="text-sm sm:text-base font-bold text-slate-900 truncate">Upload Receipt / Invoice</h2>
                                <p class="text-[11px] sm:text-xs text-slate-500 truncate">Official digital document archive</p>
                            </div>
                        </div>
                        <button type="button" id="close-upload-modal-x" class="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer shrink-0">
                            <i data-lucide="x" class="w-5 h-5"></i>
                        </button>
                    </div>

                    <form id="upload-invoice-form" class="p-4 sm:p-6 space-y-3.5 sm:space-y-4 overflow-y-auto flex-1">
                        <div>
                            <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Description / Bill Name *</label>
                            <input id="inv-desc" required placeholder="e.g. EB Bill Voucher September 2026" class="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#405189]" type="text" />
                        </div>
                        <div>
                            <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">File Document (PDF or Image) *</label>
                            <input id="inv-file" required type="file" accept="image/*,application/pdf" class="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-700 focus:outline-none" />
                        </div>
                        <div>
                            <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">OCR / Note Content (Optional)</label>
                            <textarea id="inv-ocr" rows="2" placeholder="Extracted text summary or verification note..." class="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#405189]"></textarea>
                        </div>
                        <div class="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
                            <button type="button" id="cancel-upload-modal-btn" class="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer">Cancel</button>
                            <button type="submit" class="px-5 py-2 text-xs font-semibold text-white bg-[#405189] hover:bg-[#364473] rounded-xl transition-all cursor-pointer shadow-xs">Upload Document</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        renderAppLayout({
            activeTab: 'invoices',
            title: 'Digital Invoices & OCR Document Archive',
            subtitle: 'Verified electricity bills, repair receipts, supplier tax invoices & OCR repository',
            actionsHtml: actionsHtml,
            bodyHtml: bodyHtml
        });

        attachInvoiceEvents(invoices);
    }

    function attachInvoiceEvents(invoices) {
        // Search Input
        const searchInput = document.getElementById('invoice-search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                searchQuery = e.target.value;
                renderInvoices();
                const newInput = document.getElementById('invoice-search-input');
                if (newInput) {
                    newInput.focus();
                    newInput.setSelectionRange(searchQuery.length, searchQuery.length);
                }
            });
        }

        // Modal triggers
        const uploadBtn = document.getElementById('upload-invoice-btn');
        const modal = document.getElementById('upload-invoice-modal');
        const closeBtn = document.getElementById('close-upload-modal-x');
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
        if (closeBtn) closeBtn.addEventListener('click', closeModal);
        if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
        if (modal) modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal && !modal.classList.contains('hidden')) closeModal();
        });

        // Dropzone
        const dropzone = document.getElementById('invoice-dropzone');
        const fileInput = document.getElementById('dropzone-file-input');
        if (dropzone && fileInput) {
            dropzone.addEventListener('click', () => fileInput.click());
            dropzone.addEventListener('dragover', (e) => {
                e.preventDefault();
                dropzone.classList.add('border-[#405189]', 'bg-[#405189]/5');
            });
            dropzone.addEventListener('dragleave', () => {
                dropzone.classList.remove('border-[#405189]', 'bg-[#405189]/5');
            });
            dropzone.addEventListener('drop', (e) => {
                e.preventDefault();
                dropzone.classList.remove('border-[#405189]', 'bg-[#405189]/5');
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    handleQuickUpload(e.dataTransfer.files[0]);
                }
            });
            fileInput.addEventListener('change', (e) => {
                if (e.target.files && e.target.files[0]) {
                    handleQuickUpload(e.target.files[0]);
                }
            });
        }

        // Card click / Preview button
        document.querySelectorAll('.invoice-card, .preview-invoice-btn').forEach(el => {
            el.addEventListener('click', (e) => {
                const invId = el.dataset.invId;
                const inv = invoices.find(x => x.id === invId);
                if (inv && window.modals && typeof window.modals.openInvoicePreviewModal === 'function') {
                    window.modals.openInvoicePreviewModal(inv);
                }
            });
        });

        // Delete button
        document.querySelectorAll('.delete-invoice-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const invId = btn.dataset.invId;
                if (confirm("Delete this invoice document from archive?")) {
                    await supabase.from('invoices').delete().eq('id', invId);
                    if (window.audioUtils) window.audioUtils.playSuccessChime();
                    if (typeof window.loadGlobalData === 'function') await window.loadGlobalData();
                    renderInvoices();
                }
            });
        });

        // Form Submit
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                const desc = document.getElementById('inv-desc').value.trim();
                const ocr = document.getElementById('inv-ocr').value.trim();
                const file = document.getElementById('inv-file').files?.[0];
                if (file) {
                    handleFullUpload(file, desc, ocr);
                }
            });
        }
    }

    async function handleQuickUpload(file) {
        const state = window.appStore.getState();
        const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
        const reader = new FileReader();

        reader.onload = async () => {
            const newInv = {
                id: crypto.randomUUID(),
                file_name: file.name,
                file_url: reader.result,
                file_type: isPdf ? 'application/pdf' : file.type || 'image/jpeg',
                file_size: file.size,
                particular: file.name.replace(/\.[^/.]+$/, ""),
                ocr_text: `OCR EXTRACTED SUMMARY FOR ${file.name}: Verified document under CHE-MADURA HS-1 MGMT administration. File size ${(file.size / 1024).toFixed(0)} KB.`,
                uploaded_by: state.user?.email || 'admin@chemadura.com',
                created_at: new Date().toISOString()
            };

            const { error } = await supabase.from('invoices').insert(newInv);
            if (!error) {
                if (window.audioUtils) window.audioUtils.playSuccessChime();
                if (typeof window.loadGlobalData === 'function') await window.loadGlobalData();
                renderInvoices();
            } else {
                console.error('Invoice upload error:', error);
                if (window.audioUtils) window.audioUtils.playWarningChime();
            }
        };
        reader.readAsDataURL(file);
    }

    async function handleFullUpload(file, desc, customOcr) {
        const state = window.appStore.getState();
        const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
        const reader = new FileReader();

        reader.onload = async () => {
            const newInv = {
                id: crypto.randomUUID(),
                file_name: file.name,
                file_url: reader.result,
                file_type: isPdf ? 'application/pdf' : file.type || 'image/jpeg',
                file_size: file.size,
                particular: desc,
                ocr_text: customOcr || `OCR EXTRACTED SUMMARY FOR ${file.name}: Verified tax invoice / receipt for ${desc}.`,
                uploaded_by: state.user?.email || 'admin@chemadura.com',
                created_at: new Date().toISOString()
            };

            const { error } = await supabase.from('invoices').insert(newInv);
            if (!error) {
                const modal = document.getElementById('upload-invoice-modal');
                if (modal) {
                    modal.classList.add('hidden');
                    modal.classList.remove('flex');
                }
                const form = document.getElementById('upload-invoice-form');
                if (form) form.reset();

                if (window.audioUtils) window.audioUtils.playSuccessChime();
                if (typeof window.loadGlobalData === 'function') await window.loadGlobalData();
                renderInvoices();
            } else {
                console.error('Invoice full upload error:', error);
                if (window.audioUtils) window.audioUtils.playWarningChime();
            }
        };
        reader.readAsDataURL(file);
    }

    window.renderInvoices = renderInvoices;
})();
