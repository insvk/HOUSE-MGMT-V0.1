// Tenant Component Logic
function renderTenants() {
    const root = document.getElementById('app-root');
    const state = window.appStore.getState();
    const users = state.users || [];
    
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
                    <a href="#/tenants" class="flex items-center gap-2 p-3 rounded bg-blue-600 text-white">
                        <i data-lucide="users" class="w-5 h-5"></i> Tenants
                    </a>
                    <a href="#/invoices" class="flex items-center gap-2 p-3 rounded hover:bg-gray-800 text-gray-300">
                        <i data-lucide="receipt" class="w-5 h-5"></i> Invoices
                    </a>
                </nav>
            </aside>
            
            <main class="flex-1 overflow-y-auto p-8 bg-gray-50 relative">
                <div class="flex justify-between items-center mb-6">
                    <h1 class="text-3xl font-bold">Tenant Directory</h1>
                    <button id="add-tenant-btn" class="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 flex items-center gap-2">
                        <i data-lucide="plus" class="w-4 h-4"></i> Add Tenant
                    </button>
                </div>
                
                <div class="bg-white rounded shadow-sm border border-gray-200 overflow-hidden">
                    <table class="w-full text-left">
                        <thead class="bg-gray-50 border-b">
                            <tr>
                                <th class="px-6 py-4">Name & Email</th>
                                <th class="px-6 py-4">Flat</th>
                                <th class="px-6 py-4">Status</th>
                                <th class="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-100">
                            ${users.map(u => `
                            <tr class="hover:bg-gray-50">
                                <td class="px-6 py-4">
                                    <div class="font-medium">${u.full_name}</div>
                                    <div class="text-xs text-gray-500">${u.email}</div>
                                </td>
                                <td class="px-6 py-4">${u.flat_number || '-'}</td>
                                <td class="px-6 py-4">
                                    <span class="px-2 py-1 text-xs rounded-full ${u.occupancy_status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                                        ${u.occupancy_status}
                                    </span>
                                </td>
                                <td class="px-6 py-4 text-right">
                                     <button class="text-red-500 hover:text-red-700 p-2 delete-usr-btn" data-id="${u.id}">
                                        <i data-lucide="trash-2" class="w-4 h-4 pointer-events-none"></i>
                                    </button>
                                </td>
                            </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </main>
        </div>
    `;
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
        try { window.lucide.createIcons(); } catch (e) { console.warn('Lucide icon error:', e); }
    }

    // Event Listeners for Tenant interactions
    document.querySelectorAll('.delete-usr-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            if (confirm("Deactivate tenant? (Soft delete)")) {
                const id = e.target.closest('button').dataset.id;
                await supabase.from('users').update({ occupancy_status: 'inactive' }).eq('id', id);
            }
        });
    });
}

window.renderTenants = renderTenants;
