// Invoices Component Logic
function renderInvoices() {
    const root = document.getElementById('app-root');
    const state = window.appStore.getState();
    const invoices = state.invoices || [];
    
    root.innerHTML = `
        <div class="flex h-screen w-full bg-gray-50 overflow-hidden">
            <aside class="w-64 bg-gray-900 text-white flex flex-col flex-shrink-0 z-20">
                <div class="p-4 font-bold text-xl border-b border-gray-700 flex items-center gap-2">
                    <i data-lucide="building-2" class="w-6 h-6 text-blue-400"></i>
                    MADURA HOUSE
                </div>
                <nav class="flex-1 p-4 flex flex-col gap-2">
                    <a href="#/" class="flex items-center gap-2 p-3 rounded hover:bg-gray-800 text-gray-300">
                        <i data-lucide="home" class="w-5 h-5"></i> Dashboard
                    </a>
                    <a href="#/maintenance" class="flex items-center gap-2 p-3 rounded hover:bg-gray-800 text-gray-300">
                        <i data-lucide="wallet" class="w-5 h-5"></i> Maintenance
                    </a>
                    <a href="#/tenants" class="flex items-center gap-2 p-3 rounded hover:bg-gray-800 text-gray-300">
                        <i data-lucide="users" class="w-5 h-5"></i> Tenants
                    </a>
                    <a href="#/invoices" class="flex items-center gap-2 p-3 rounded bg-blue-600 text-white">
                        <i data-lucide="receipt" class="w-5 h-5"></i> Invoices
                    </a>
                </nav>
            </aside>
            
            <main class="flex-1 overflow-y-auto p-8 bg-gray-50 relative">
                <div class="flex justify-between items-center mb-6">
                    <h1 class="text-3xl font-bold">Invoice Gallery</h1>
                    <button class="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 flex items-center gap-2">
                        <i data-lucide="upload-cloud" class="w-4 h-4"></i> Upload Invoice
                    </button>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    ${invoices.length === 0 ? '<div class="col-span-full p-8 text-center text-gray-500 bg-white rounded border">No invoices uploaded yet</div>' : ''}
                    ${invoices.map(inv => `
                    <div class="bg-white rounded shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                        <div class="h-48 bg-gray-100 flex items-center justify-center p-4 relative group">
                            ${inv.file_type === 'application/pdf' ? `
                            <i data-lucide="file-text" class="w-16 h-16 text-red-500"></i>
                            ` : `
                            <img src="${inv.file_url}" class="max-h-full object-contain" alt="Invoice Preview" onerror="this.style.display='none'">
                            `}
                            <div class="absolute inset-0 bg-black/50 hidden group-hover:flex items-center justify-center gap-2 transition-opacity">
                                <a href="${inv.file_url}" target="_blank" class="bg-white text-gray-900 p-2 rounded-full hover:bg-blue-50 transition-colors">
                                    <i data-lucide="external-link" class="w-5 h-5"></i>
                                </a>
                            </div>
                        </div>
                        <div class="p-4 border-t border-gray-100 flex-1 flex flex-col">
                            <h3 class="font-medium text-gray-900 truncate" title="${inv.file_name}">${inv.file_name}</h3>
                            <div class="flex items-center justify-between mt-2 text-sm text-gray-500">
                                <span>${(inv.file_size / 1024).toFixed(1)} KB</span>
                                <span>${new Date(inv.uploaded_at || inv.created_at).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>
                    `).join('')}
                </div>
            </main>
        </div>
    `;
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
        try { window.lucide.createIcons(); } catch (e) { console.warn('Lucide icon error:', e); }
    }
}

window.renderInvoices = renderInvoices;
