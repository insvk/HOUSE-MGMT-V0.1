// Maintenance Component Logic
function renderMaintenance() {
    const root = document.getElementById('app-root');
    const state = window.appStore.getState();
    const records = state.records || [];
    const currentRecord = records.length > 0 ? records[0] : null;
    const expenses = currentRecord ? currentRecord.expenses || [] : [];
    
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
                    <a href="#/maintenance" class="flex items-center gap-2 p-3 rounded bg-blue-600 text-white">
                        <i data-lucide="wallet" class="w-5 h-5"></i> Maintenance
                    </a>
                    <a href="#/tenants" class="flex items-center gap-2 p-3 rounded hover:bg-gray-800 text-gray-300">
                        <i data-lucide="users" class="w-5 h-5"></i> Tenants
                    </a>
                    <a href="#/invoices" class="flex items-center gap-2 p-3 rounded hover:bg-gray-800 text-gray-300">
                        <i data-lucide="receipt" class="w-5 h-5"></i> Invoices
                    </a>
                </nav>
            </aside>
            
            <main class="flex-1 overflow-y-auto p-8 bg-gray-50 relative">
                <div class="flex justify-between items-center mb-6">
                    <h1 class="text-3xl font-bold">Maintenance Ledger</h1>
                    <div class="flex gap-2">
                        <button id="export-excel-btn" class="bg-indigo-600 text-white px-4 py-2 rounded shadow hover:bg-indigo-700 flex items-center gap-2">
                            <i data-lucide="file-spreadsheet" class="w-4 h-4"></i> Export Excel
                        </button>
                        <button id="export-pdf-btn" class="bg-green-600 text-white px-4 py-2 rounded shadow hover:bg-green-700 flex items-center gap-2">
                            <i data-lucide="download" class="w-4 h-4"></i> Export PDF
                        </button>
                        <button id="add-expense-btn" class="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 flex items-center gap-2">
                            <i data-lucide="plus" class="w-4 h-4"></i> Add Expense
                        </button>
                    </div>
                </div>
                
                <div class="bg-white rounded shadow-sm border border-gray-200 overflow-hidden mb-6">
                    <table class="w-full text-left">
                        <thead class="bg-gray-50 border-b">
                            <tr>
                                <th class="px-6 py-4">Particulars</th>
                                <th class="px-6 py-4">Amount</th>
                                <th class="px-6 py-4">Category</th>
                                <th class="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-100">
                            ${expenses.length === 0 ? '<tr><td colspan="4" class="p-4 text-center text-gray-500">No expenses this month</td></tr>' : ''}
                            ${expenses.map(e => `
                            <tr class="hover:bg-gray-50">
                                <td class="px-6 py-4 font-medium">${e.particular}</td>
                                <td class="px-6 py-4 text-blue-600 font-bold">₹${parseFloat(e.amount).toLocaleString('en-IN')}</td>
                                <td class="px-6 py-4">
                                    <span class="px-2 py-1 text-xs rounded-full bg-gray-100 border text-gray-600">
                                        ${e.category || 'Maintenance'}
                                    </span>
                                </td>
                                <td class="px-6 py-4 text-right">
                                    <button class="text-red-500 hover:text-red-700 p-2 delete-exp-btn" data-id="${e.id}">
                                        <i data-lucide="trash-2" class="w-4 h-4 pointer-events-none"></i>
                                    </button>
                                </td>
                            </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>

                <!-- Add Modal -->
                <div id="add-modal" class="fixed inset-0 bg-black/50 hidden items-center justify-center z-50">
                    <div class="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
                        <h2 class="text-xl font-bold mb-4">Add Expense</h2>
                        <form id="add-expense-form" class="space-y-4">
                            <div>
                                <label class="block text-sm font-medium mb-1">Particulars</label>
                                <input id="exp-name" required class="w-full border rounded p-2" type="text" />
                            </div>
                            <div>
                                <label class="block text-sm font-medium mb-1">Amount (₹)</label>
                                <input id="exp-amount" required class="w-full border rounded p-2" type="number" step="0.01" />
                            </div>
                            <div>
                                <label class="block text-sm font-medium mb-1">Category</label>
                                <select id="exp-cat" class="w-full border rounded p-2">
                                    <option value="maintenance">Maintenance</option>
                                    <option value="utilities">Utilities</option>
                                    <option value="repairs">Repairs</option>
                                    <option value="cleaning">Cleaning</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                            <div class="flex justify-end gap-2 mt-6">
                                <button type="button" id="close-modal-btn" class="px-4 py-2 border rounded">Cancel</button>
                                <button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Save</button>
                            </div>
                        </form>
                    </div>
                </div>
            </main>
        </div>
    `;
    lucide.createIcons();

    // Event Listeners
    const addBtn = document.getElementById('add-expense-btn');
    const modal = document.getElementById('add-modal');
    const closeBtn = document.getElementById('close-modal-btn');
    const form = document.getElementById('add-expense-form');

    addBtn.addEventListener('click', () => {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    });

    closeBtn.addEventListener('click', () => {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const particular = document.getElementById('exp-name').value;
        const amount = document.getElementById('exp-amount').value;
        const cat = document.getElementById('exp-cat').value;
        const recordId = currentRecord ? currentRecord.id : null;

        if (!recordId) {
            alert("No active record found!"); return;
        }

        const newExp = {
            id: crypto.randomUUID(),
            maintenance_record_id: recordId,
            particular: particular,
            amount: parseFloat(amount),
            category: cat,
            added_by: state.user?.id
        };

        const { error } = await supabase.from('expenses').insert(newExp);
        
        if (!error) {
            // Update Grand Total
            const newTotal = (parseFloat(currentRecord.grand_total) || 0) + parseFloat(amount);
            await supabase.from('maintenance_records').update({ grand_total: newTotal }).eq('id', recordId);
            
            modal.classList.add('hidden');
            modal.classList.remove('flex');
            form.reset();
            // Data will reload via realtime
        } else {
            alert(error.message);
        }
    });

    // Delete handlers
    document.querySelectorAll('.delete-exp-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            if (confirm("Delete expense?")) {
                const id = e.target.closest('button').dataset.id;
                const expense = expenses.find(x => x.id === id);
                if (expense) {
                    await supabase.from('expenses').delete().eq('id', id);
                    const newTotal = (parseFloat(currentRecord.grand_total) || 0) - parseFloat(expense.amount);
                    await supabase.from('maintenance_records').update({ grand_total: Math.max(0, newTotal) }).eq('id', currentRecord.id);
                }
            }
        });
    });

    // Document Export handlers
    document.getElementById('export-pdf-btn').addEventListener('click', () => {
        window.exportUtils.exportPDF(records, state.house);
    });
    document.getElementById('export-excel-btn').addEventListener('click', () => {
        window.exportUtils.exportExcel(records);
    });
}

window.renderMaintenance = renderMaintenance;
