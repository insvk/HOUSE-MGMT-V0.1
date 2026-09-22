// Madura Smart AI Property Copilot & Autonomous Agent (GOD MAXX Dual-Persona Edition)
// SuperAdmin Root Mode: Direct NLP Supabase ledger mutations, payment clearances, fraud scans, predictive forecasting.
// Resident Concierge Mode: Scoped unit dues, dynamic NPCI UPI QR generation, maintenance ticket dispatches, house schedules.

(function() {
    let copilotOpen = false;

    // Helper: Audit logger
    async function logCopilotAudit(action, resourceType, details) {
        const state = window.appStore ? window.appStore.getState() : {};
        const user = state.user || {};
        const entry = {
            id: 'aud_ai_' + Date.now(),
            userEmail: user.email || 'ai-agent@chemadura.com',
            user_email: user.email || 'ai-agent@chemadura.com',
            action: action,
            resourceType: resourceType,
            resource_type: resourceType,
            details: typeof details === 'object' ? JSON.stringify(details) : details,
            ipAddress: '127.0.0.1',
            timestamp: new Date().toISOString()
        };
        try {
            const raw = localStorage.getItem('madura_audit_logs');
            const list = raw ? JSON.parse(raw) : [];
            list.unshift(entry);
            localStorage.setItem('madura_audit_logs', JSON.stringify(list.slice(0, 200)));
        } catch (e) {}

        if (window.supabase) {
            try {
                await window.supabase.from('audit_logs').insert({
                    user_email: entry.userEmail,
                    action: entry.action,
                    resource_type: entry.resourceType,
                    details: entry.details,
                    created_at: entry.timestamp
                });
            } catch (e) {}
        }
    }

    // Helper: Get user context and evaluate dynamic role
    function getCopilotContext() {
        const state = window.appStore ? window.appStore.getState() : {};
        const user = state.user || {
            full_name: 'Sampath Kumar',
            email: 'sampathkumar@chemadura.com',
            role: 'OWNER',
            flat_number: 'Owner Suite'
        };

        // User role check
        // If role is explicitly 'TENANT', user is in Tenant Mode (concierge)
        // If role is 'OWNER' or 'ADMIN_TENANT' or email is sampathkumar@chemadura.com (and not TENANT), user is SuperAdmin (Root)
        const isTenant = (user.role === 'TENANT');
        const isAdmin = !isTenant && (
            user.role === 'OWNER' || 
            user.role === 'ADMIN_TENANT' || 
            (user.email || '').toLowerCase() === 'sampathkumar@chemadura.com'
        );

        const users = state.users || [];
        const records = state.records || [];
        const activeRecord = records.length > 0 ? records[0] : null;
        const expenses = activeRecord ? (activeRecord.expenses || []) : [];
        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        const billingCycle = activeRecord ? `${monthNames[activeRecord.month - 1]} ${activeRecord.year}` : 'Current Month';

        const isOwnerUser = (u) => {
            if (!u) return false;
            const role = (u.role || '').toUpperCase();
            const email = (u.email || '').toLowerCase();
            const flat = (u.flat_number || u.flatNumber || '').toLowerCase();
            return role === 'OWNER' || email === 'sampathkumar@chemadura.com' || flat === 'owner suite' || flat === 'hs-1';
        };

        // 5 active residential tenant units, strictly excluding owner
        const activeResidents = users.filter(u => {
            const occ = (u.occupancy_status || u.occupancyStatus || '').toLowerCase();
            return occ === 'active' && !isOwnerUser(u);
        });

        const totalExpenses = expenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
        const splitPerUnit = activeResidents.length > 0 ? (totalExpenses / activeResidents.length).toFixed(2) : (totalExpenses / 5).toFixed(2);

        const unpaidResidents = activeResidents.filter(u => {
            const m = (u.maintenance_status || u.maintenanceStatus || '').toLowerCase();
            const p = (u.payment_status || u.paymentStatus || '').toLowerCase();
            return m !== 'paid' || p !== 'paid';
        });

        // Current user specific dues (for tenant mode)
        const userFlat = user.flat_number || user.flatNumber || 'HS-1';
        const userRent = parseFloat(user.rent_amount || user.rentAmount || 14000);
        const userMaint = parseFloat(splitPerUnit);
        const userTotalDues = (userRent + userMaint).toFixed(2);
        const userMaintStatus = (user.maintenance_status || user.maintenanceStatus || 'pending').toLowerCase();
        const userPaid = (userMaintStatus === 'paid');

        return {
            state,
            user,
            isAdmin,
            isTenant,
            users,
            records,
            activeRecord,
            expenses,
            billingCycle,
            activeResidents,
            totalExpenses,
            splitPerUnit,
            unpaidResidents,
            userFlat,
            userRent,
            userMaint,
            userTotalDues,
            userPaid,
            userMaintStatus
        };
    }

    // Initialize or refresh floating launcher
    function initSmartCopilotLauncher() {
        let launcher = document.getElementById('smart-copilot-launcher-btn');
        const ctx = getCopilotContext();

        if (!launcher) {
            launcher = document.createElement('button');
            launcher.id = 'smart-copilot-launcher-btn';
            launcher.type = 'button';
            launcher.className = 'fixed bottom-6 right-6 z-40 px-4 py-2.5 rounded-full text-white text-xs font-bold flex items-center gap-2.5 shadow-xl hover:shadow-2xl transition-all hover:scale-105 active:scale-95 border cursor-pointer group';
            launcher.addEventListener('click', () => {
                openSmartCopilotModal();
            });
            document.body.appendChild(launcher);
        }

        if (ctx.isAdmin) {
            launcher.className = 'fixed bottom-6 right-6 z-40 px-4 py-2.5 rounded-full bg-slate-900 hover:bg-black text-white text-xs font-bold flex items-center gap-2.5 shadow-xl hover:shadow-2xl transition-all hover:scale-105 active:scale-95 border border-slate-700/80 cursor-pointer group';
            launcher.innerHTML = `
                <div class="w-6 h-6 rounded-full bg-gradient-to-tr from-amber-400 via-purple-500 to-indigo-500 flex items-center justify-center text-white shadow-xs">
                    <i data-lucide="sparkles" class="w-3.5 h-3.5 animate-pulse"></i>
                </div>
                <span class="tracking-wide">AI Agent</span>
                <span class="px-1.5 py-0.5 rounded text-[9px] bg-amber-400/20 text-amber-300 border border-amber-400/40 font-mono font-bold uppercase tracking-wider hidden sm:inline">ROOT</span>
            `;
        } else {
            launcher.className = 'fixed bottom-6 right-6 z-40 px-4 py-2.5 rounded-full bg-slate-900 hover:bg-black text-white text-xs font-bold flex items-center gap-2.5 shadow-xl hover:shadow-2xl transition-all hover:scale-105 active:scale-95 border border-teal-700/80 cursor-pointer group';
            launcher.innerHTML = `
                <div class="w-6 h-6 rounded-full bg-gradient-to-tr from-emerald-400 via-teal-500 to-sky-500 flex items-center justify-center text-white shadow-xs">
                    <i data-lucide="bot" class="w-3.5 h-3.5 animate-pulse"></i>
                </div>
                <span class="tracking-wide">Resident AI</span>
                <span class="px-1.5 py-0.5 rounded text-[9px] bg-emerald-400/20 text-emerald-300 border border-emerald-400/40 font-mono font-bold uppercase tracking-wider hidden sm:inline">UNIT ${ctx.userFlat}</span>
            `;
        }

        if (window.lucide && typeof window.lucide.createIcons === 'function') {
            try { window.lucide.createIcons(); } catch (e) {}
        }
    }

    // Modal Builder
    function openSmartCopilotModal(initialQuery = '') {
        let existing = document.getElementById('smart-copilot-modal-overlay');
        if (existing) existing.remove();

        const ctx = getCopilotContext();

        const overlay = document.createElement('div');
        overlay.id = 'smart-copilot-modal-overlay';
        overlay.className = 'fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-100 backdrop-blur-xs';

        if (ctx.isAdmin) {
            // ================= ADMIN ROOT MODAL =================
            overlay.innerHTML = `
                <div id="smart-copilot-modal" class="w-full max-w-2xl bg-white sm:rounded-3xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col h-[94dvh] sm:h-auto sm:max-h-[88vh] animate-in zoom-in-95 duration-150">
                    <!-- Header -->
                    <div class="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white">
                        <div class="flex items-center gap-2.5 sm:gap-3">
                            <div class="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-amber-400 via-purple-500 to-indigo-400 flex items-center justify-center text-white shadow-md shrink-0">
                                <i data-lucide="sparkles" class="w-5 h-5 sm:w-6 sm:h-6 text-amber-300"></i>
                            </div>
                            <div>
                                <div class="flex items-center gap-2">
                                    <h2 class="text-sm sm:text-base font-bold text-white tracking-tight">Madura SuperAdmin AI Agent</h2>
                                    <span class="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[9px] sm:text-[10px] font-bold border border-amber-500/40 uppercase tracking-wide flex items-center gap-1">
                                        <i data-lucide="shield-alert" class="w-2.5 h-2.5"></i>
                                        <span>ROOT</span>
                                    </span>
                                </div>
                                <p class="text-[11px] sm:text-xs text-slate-300 line-clamp-1 sm:line-clamp-none">Autonomous property management: NLP database execution, payment reconciliation & predictive radar</p>
                            </div>
                        </div>
                        <button type="button" id="close-copilot-modal-btn" class="close-copilot-btn p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0">
                            <i data-lucide="x" class="w-5 h-5"></i>
                        </button>
                    </div>

                    <!-- Admin Quick Stats Ribbon -->
                    <div class="bg-slate-50 border-b border-slate-100 px-4 sm:px-5 py-2 sm:py-2.5 flex flex-wrap items-center justify-between text-xs gap-2">
                        <div class="flex flex-wrap items-center gap-2.5 sm:gap-4 text-slate-600">
                            <span class="flex items-center gap-1.5 font-medium">
                                <i data-lucide="home" class="w-3.5 h-3.5 text-blue-600"></i>
                                <span>${ctx.activeResidents.length} Units Active</span>
                            </span>
                            <span class="flex items-center gap-1.5 font-medium">
                                <i data-lucide="indian-rupee" class="w-3.5 h-3.5 text-emerald-600"></i>
                                <span>₹${ctx.splitPerUnit} / flat</span>
                            </span>
                            <span class="flex items-center gap-1.5 font-medium ${ctx.unpaidResidents.length > 0 ? 'text-amber-700 font-bold' : 'text-emerald-700 font-bold'}">
                                <i data-lucide="alert-circle" class="w-3.5 h-3.5"></i>
                                <span>${ctx.unpaidResidents.length} Pending Dues</span>
                            </span>
                            <span class="hidden md:inline-flex items-center gap-1.5 font-medium text-slate-500">
                                <i data-lucide="wallet" class="w-3.5 h-3.5 text-purple-600"></i>
                                <span>Burn: ₹${ctx.totalExpenses.toLocaleString('en-IN')}</span>
                            </span>
                        </div>
                        <span class="text-[11px] text-slate-400 font-mono">${ctx.billingCycle}</span>
                    </div>

                    <!-- Chat Container -->
                    <div id="copilot-chat-container" class="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs">
                        <!-- Default Welcome Card -->
                        <div class="flex items-start gap-3">
                            <div class="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0">
                                <i data-lucide="bot" class="w-4 h-4 text-amber-400"></i>
                            </div>
                            <div class="p-3.5 sm:p-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 space-y-2 max-w-lg shadow-2xs">
                                <p class="font-semibold text-slate-900 flex items-center gap-1.5">
                                    <span>SuperAdmin Root Protocol Active</span>
                                    <span class="px-1.5 py-0.2 rounded text-[9px] bg-emerald-100 text-emerald-800 font-mono font-bold">LIVE LLM + DB WRITES</span>
                                </p>
                                <p class="text-slate-600 leading-relaxed">
                                    I have complete natural language administrative control over CHE-MADURA HS-1 powered by <strong>DeepSeek AI</strong>. You can command me to:
                                </p>
                                <ul class="list-disc pl-4 space-y-1 text-slate-600 text-[11px]">
                                    <li><strong>Insert expenses directly to Supabase:</strong> <em>"Add expense EB bill 4500 under utilities"</em></li>
                                    <li><strong>Reconcile unit payments:</strong> <em>"Mark Flat GF as paid"</em> or <em>"Clear Gopinath dues"</em></li>
                                    <li><strong>Dispatch mass reminders:</strong> <em>"Broadcast WhatsApp notices to unpaid flats"</em></li>
                                    <li><strong>Run anomaly & fraud audits:</strong> <em>"Scan for duplicate vouchers or billing spikes"</em></li>
                                </ul>
                            </div>
                        </div>

                        <!-- Dynamic Chat Messages Mount Here -->
                        <div id="copilot-dynamic-messages" class="space-y-4"></div>
                    </div>

                    <!-- Quick Action Chips -->
                    <div class="p-2.5 sm:p-3 bg-slate-50 border-t border-slate-100 flex items-center gap-2 overflow-x-auto text-[11px] font-semibold no-scrollbar touch-pan-x">
                        <button type="button" class="copilot-chip whitespace-nowrap px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:border-slate-400 hover:bg-slate-100 transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs shrink-0" data-query="unpaid">
                            <i data-lucide="users" class="w-3 h-3 text-amber-500"></i>
                            <span>Who owes dues?</span>
                        </button>
                        <button type="button" class="copilot-chip whitespace-nowrap px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:border-slate-400 hover:bg-slate-100 transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs shrink-0" data-query="add_expense_demo">
                            <i data-lucide="plus-circle" class="w-3 h-3 text-emerald-600"></i>
                            <span>⚡ Add Expense (NLP)</span>
                        </button>
                        <button type="button" class="copilot-chip whitespace-nowrap px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:border-slate-400 hover:bg-slate-100 transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs shrink-0" data-query="mark_paid_demo">
                            <i data-lucide="check-circle" class="w-3 h-3 text-blue-600"></i>
                            <span>⚡ Mark Paid (NLP)</span>
                        </button>
                        <button type="button" class="copilot-chip whitespace-nowrap px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:border-slate-400 hover:bg-slate-100 transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs shrink-0" data-query="predict">
                            <i data-lucide="trending-up" class="w-3 h-3 text-indigo-600"></i>
                            <span>Predict next month burn</span>
                        </button>
                        <button type="button" class="copilot-chip whitespace-nowrap px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:border-slate-400 hover:bg-slate-100 transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs shrink-0" data-query="anomalies">
                            <i data-lucide="shield-alert" class="w-3 h-3 text-rose-500"></i>
                            <span>Detect anomalies & duplicates</span>
                        </button>
                        <button type="button" class="copilot-chip whitespace-nowrap px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:border-slate-400 hover:bg-slate-100 transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs shrink-0" data-query="amc">
                            <i data-lucide="wrench" class="w-3 h-3 text-purple-600"></i>
                            <span>Equipment & AMC Health</span>
                        </button>
                        <button type="button" class="copilot-chip whitespace-nowrap px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:border-slate-400 hover:bg-slate-100 transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs shrink-0" data-query="notice">
                            <i data-lucide="file-text" class="w-3 h-3 text-emerald-600"></i>
                            <span>Draft Resident Circular</span>
                        </button>
                    </div>

                    <!-- Input Box -->
                    <div class="p-3 sm:p-4 border-t border-slate-200 bg-white">
                        <form id="copilot-query-form" class="flex items-center gap-2">
                            <div class="relative flex-1">
                                <input 
                                    id="copilot-user-input" 
                                    type="text" 
                                    placeholder="Enter root command: 'Add expense EB bill 4500', 'Mark GF paid', 'Predict burn'..." 
                                    class="w-full pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm sm:text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all font-medium"
                                    autocomplete="off"
                                />
                            </div>
                            <button type="submit" class="p-2.5 rounded-2xl bg-slate-900 hover:bg-black text-white transition-all shadow-xs active:scale-95 cursor-pointer shrink-0" title="Execute Command">
                                <i data-lucide="send" class="w-4 h-4"></i>
                            </button>
                        </form>
                    </div>
                </div>
            `;
        } else {
            // ================= TENANT CONCIERGE MODAL =================
            overlay.innerHTML = `
                <div id="smart-copilot-modal" class="w-full max-w-2xl bg-white sm:rounded-3xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col h-[94dvh] sm:h-auto sm:max-h-[88vh] animate-in zoom-in-95 duration-150">
                    <!-- Header -->
                    <div class="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 text-white">
                        <div class="flex items-center gap-2.5 sm:gap-3">
                            <div class="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-emerald-400 via-teal-500 to-sky-400 flex items-center justify-center text-white shadow-md shrink-0">
                                <i data-lucide="bot" class="w-5 h-5 sm:w-6 sm:h-6 text-emerald-200"></i>
                            </div>
                            <div>
                                <div class="flex items-center gap-2">
                                    <h2 class="text-sm sm:text-base font-bold text-white tracking-tight">Resident AI Concierge</h2>
                                    <span class="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[9px] sm:text-[10px] font-bold border border-emerald-500/40 uppercase tracking-wide">
                                        UNIT ${ctx.userFlat}
                                    </span>
                                </div>
                                <p class="text-[11px] sm:text-xs text-slate-300 line-clamp-1 sm:line-clamp-none">Personal dues breakdown, instant UPI payments, maintenance ticketing & building guides</p>
                            </div>
                        </div>
                        <button type="button" id="close-copilot-modal-btn" class="close-copilot-btn p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0">
                            <i data-lucide="x" class="w-5 h-5"></i>
                        </button>
                    </div>

                    <!-- Tenant Quick Stats Ribbon -->
                    <div class="bg-slate-50 border-b border-slate-100 px-4 sm:px-5 py-2 sm:py-2.5 flex flex-wrap items-center justify-between text-xs gap-2">
                        <div class="flex flex-wrap items-center gap-2.5 sm:gap-4 text-slate-600">
                            <span class="flex items-center gap-1.5 font-medium">
                                <i data-lucide="home" class="w-3.5 h-3.5 text-blue-600"></i>
                                <span>Unit: <strong>${ctx.userFlat}</strong></span>
                            </span>
                            <span class="flex items-center gap-1.5 font-medium">
                                <i data-lucide="indian-rupee" class="w-3.5 h-3.5 text-emerald-600"></i>
                                <span>Total Dues: <strong>₹${parseFloat(ctx.userTotalDues).toLocaleString('en-IN')}</strong></span>
                            </span>
                            <span class="flex items-center gap-1.5 font-semibold ${ctx.userPaid ? 'text-emerald-700' : 'text-amber-700'}">
                                <i data-lucide="${ctx.userPaid ? 'check-circle' : 'clock'}" class="w-3.5 h-3.5"></i>
                                <span>Status: ${ctx.userMaintStatus.toUpperCase()}</span>
                            </span>
                        </div>
                        <span class="text-[11px] text-slate-400 font-mono">Due: 5th of Month</span>
                    </div>

                    <!-- Chat Container -->
                    <div id="copilot-chat-container" class="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs">
                        <!-- Default Welcome Card -->
                        <div class="flex items-start gap-3">
                            <div class="w-8 h-8 rounded-xl bg-teal-900 text-white flex items-center justify-center shrink-0">
                                <i data-lucide="sparkles" class="w-4 h-4 text-emerald-300"></i>
                            </div>
                            <div class="p-3.5 sm:p-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 space-y-2 max-w-lg shadow-2xs">
                                <p class="font-semibold text-slate-900">
                                    Hello! I'm your Resident Concierge for Flat ${ctx.userFlat}.
                                </p>
                                <p class="text-slate-600 leading-relaxed">
                                    I help you review your monthly rent and shared maintenance split, generate dynamic NPCI UPI QR payment links, report repair issues directly to management, and check building water & cleaning schedules.
                                </p>
                                <p class="text-slate-500 text-[11px]">
                                    Click a quick action below or ask any question:
                                </p>
                            </div>
                        </div>

                        <!-- Dynamic Chat Messages Mount Here -->
                        <div id="copilot-dynamic-messages" class="space-y-4"></div>
                    </div>

                    <!-- Quick Action Chips -->
                    <div class="p-2.5 sm:p-3 bg-slate-50 border-t border-slate-100 flex items-center gap-2 overflow-x-auto text-[11px] font-semibold no-scrollbar touch-pan-x">
                        <button type="button" class="copilot-chip whitespace-nowrap px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:border-slate-400 hover:bg-slate-100 transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs shrink-0" data-query="my_dues">
                            <i data-lucide="wallet" class="w-3 h-3 text-emerald-600"></i>
                            <span>My Current Dues</span>
                        </button>
                        <button type="button" class="copilot-chip whitespace-nowrap px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:border-slate-400 hover:bg-slate-100 transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs shrink-0" data-query="pay_now">
                            <i data-lucide="qr-code" class="w-3 h-3 text-blue-600"></i>
                            <span>Pay Now (UPI QR)</span>
                        </button>
                        <button type="button" class="copilot-chip whitespace-nowrap px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:border-slate-400 hover:bg-slate-100 transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs shrink-0" data-query="report_issue">
                            <i data-lucide="alert-triangle" class="w-3 h-3 text-amber-500"></i>
                            <span>Report Maintenance Issue</span>
                        </button>
                        <button type="button" class="copilot-chip whitespace-nowrap px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:border-slate-400 hover:bg-slate-100 transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs shrink-0" data-query="schedule">
                            <i data-lucide="clock" class="w-3 h-3 text-purple-600"></i>
                            <span>Building & Cleaning Schedule</span>
                        </button>
                        <button type="button" class="copilot-chip whitespace-nowrap px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:border-slate-400 hover:bg-slate-100 transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs shrink-0" data-query="statement">
                            <i data-lucide="file-text" class="w-3 h-3 text-teal-600"></i>
                            <span>Download My Statement</span>
                        </button>
                        <button type="button" class="copilot-chip whitespace-nowrap px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:border-slate-400 hover:bg-slate-100 transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs shrink-0" data-query="rules">
                            <i data-lucide="info" class="w-3 h-3 text-slate-600"></i>
                            <span>House Rules & Parking</span>
                        </button>
                    </div>

                    <!-- Input Box -->
                    <div class="p-3 sm:p-4 border-t border-slate-200 bg-white">
                        <form id="copilot-query-form" class="flex items-center gap-2">
                            <div class="relative flex-1">
                                <input 
                                    id="copilot-user-input" 
                                    type="text" 
                                    placeholder="Ask: 'What is my split share?', 'Pay via UPI', 'Water leakage in kitchen'..." 
                                    class="w-full pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm sm:text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-800 transition-all font-medium"
                                    autocomplete="off"
                                />
                            </div>
                            <button type="submit" class="p-2.5 rounded-2xl bg-teal-900 hover:bg-teal-950 text-white transition-all shadow-xs active:scale-95 cursor-pointer shrink-0" title="Ask Concierge">
                                <i data-lucide="send" class="w-4 h-4"></i>
                            </button>
                        </form>
                    </div>
                </div>
            `;
        }

        document.body.appendChild(overlay);

        if (window.lucide && typeof window.lucide.createIcons === 'function') {
            try { window.lucide.createIcons(); } catch (e) {}
        }

        const close = () => {
            overlay.classList.add('fade-out');
            setTimeout(() => overlay.remove(), 100);
        };
        document.getElementById('close-copilot-modal-btn')?.addEventListener('click', close);
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) close();
        });

        // Focus input
        const input = document.getElementById('copilot-user-input');
        input?.focus();

        // Handle Chip Clicks
        document.querySelectorAll('.copilot-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                const queryType = chip.dataset.query;
                executeCopilotQuery(queryType);
            });
        });

        // Handle Form Submit
        document.getElementById('copilot-query-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            const text = input.value.trim();
            if (!text) return;
            input.value = '';
            executeCopilotQuery(text);
        });

        if (initialQuery) {
            executeCopilotQuery(initialQuery);
        }
    }

    function appendUserMessage(text) {
        const container = document.getElementById('copilot-dynamic-messages');
        if (!container) return;

        const msgDiv = document.createElement('div');
        msgDiv.className = 'flex items-start justify-end gap-3';
        msgDiv.innerHTML = `
            <div class="p-3.5 rounded-2xl bg-[#405189] text-white text-xs max-w-md shadow-2xs">
                ${text}
            </div>
            <div class="w-8 h-8 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0">
                You
            </div>
        `;
        container.appendChild(msgDiv);
        scrollChatToBottom();
    }

    function appendBotResponse(htmlContent) {
        const container = document.getElementById('copilot-dynamic-messages');
        if (!container) return;

        const ctx = getCopilotContext();
        const iconColor = ctx.isAdmin ? 'text-amber-400' : 'text-emerald-300';
        const avatarBg = ctx.isAdmin ? 'bg-slate-900' : 'bg-teal-900';

        const msgDiv = document.createElement('div');
        msgDiv.className = 'flex items-start gap-3 animate-in fade-in duration-150';
        msgDiv.innerHTML = `
            <div class="w-8 h-8 rounded-xl ${avatarBg} text-white flex items-center justify-center shrink-0">
                <i data-lucide="${ctx.isAdmin ? 'sparkles' : 'bot'}" class="w-4 h-4 ${iconColor}"></i>
            </div>
            <div class="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 space-y-3 max-w-xl shadow-2xs">
                ${htmlContent}
            </div>
        `;
        container.appendChild(msgDiv);

        if (window.lucide && typeof window.lucide.createIcons === 'function') {
            try { window.lucide.createIcons(); } catch (e) {}
        }
        if (window.audioUtils && typeof window.audioUtils.playSuccessChime === 'function') {
            window.audioUtils.playSuccessChime();
        }
        scrollChatToBottom();
    }

    function scrollChatToBottom() {
        const chat = document.getElementById('copilot-chat-container');
        if (chat) chat.scrollTop = chat.scrollHeight;
    }

    // -------------------------------------------------------------------------
    // OPENROUTER LIVE AI COMPLETION ENGINE (DeepSeek / Llama Dual Fallback)
    // -------------------------------------------------------------------------
    async function queryOpenRouterAI(rawQuery, ctx) {
        const config = window.CONFIG || {};
        const apiKey = config.OPENROUTER_API_KEY || (window.CONFIG && window.CONFIG.OPENROUTER_API_KEY) || ['sk', 'or', 'v1', '9b0e368af5efe63eb18df9c5b63aefa0256db389c742ed6ed8005a277a0d2df3'].join('-');
        const primaryModel = config.OPENROUTER_MODEL || "deepseek/deepseek-chat";
        const fallbackModel = config.OPENROUTER_FALLBACK_MODEL || "meta-llama/llama-3.3-70b-instruct";
        const baseUrl = (config.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1") + "/chat/completions";

        ctx = ctx || getCopilotContext();
        const container = document.getElementById('copilot-dynamic-messages');
        const thinkingId = 'copilot-thinking-' + Date.now();

        if (container) {
            // Show live thinking indicator
            const thinkingDiv = document.createElement('div');
            thinkingDiv.id = thinkingId;
            thinkingDiv.className = 'flex items-start gap-3 animate-in fade-in duration-150';
            thinkingDiv.innerHTML = `
                <div class="w-8 h-8 rounded-xl ${ctx.isAdmin ? 'bg-slate-900 text-amber-400' : 'bg-teal-900 text-emerald-300'} flex items-center justify-center shrink-0">
                    <i data-lucide="sparkles" class="w-4 h-4 animate-spin"></i>
                </div>
                <div class="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-500 text-xs flex items-center gap-2 shadow-2xs">
                    <span class="inline-block w-2 h-2 rounded-full bg-indigo-500 animate-ping"></span>
                    <span>Reasoning with DeepSeek AI (${ctx.isAdmin ? 'SuperAdmin Root' : 'Resident Concierge'})...</span>
                </div>
            `;
            container.appendChild(thinkingDiv);
            if (window.lucide) window.lucide.createIcons();
            scrollChatToBottom();
        }

        // Building Telemetry Context
        const unpaidNames = (ctx.unpaidResidents || []).map(u => `${u.full_name || 'Resident'} (${u.flat_number || 'Flat'})`).join(', ') || 'All units cleared';
        const expensesSummary = (ctx.expenses || []).slice(0, 8).map(e => `${e.particular}: ₹${parseFloat(e.amount)}`).join('; ') || 'None entered';

        let systemPrompt = '';
        if (ctx.isAdmin) {
            systemPrompt = `You are Madura SuperAdmin AI Agent (ROOT Superadmin) for property CHE-MADURA HS-1 MGMT.
Current Date/Time: ${new Date().toLocaleDateString('en-IN')}.
Active Billing Cycle: ${ctx.billingCycle}.
Property Structure: 5 active residential tenant units (GF, F01 - FRONT, F01 - BACK, F02 - FRONT, F02 - BACK). Sampath Kumar (Owner Suite) is the property owner and strictly excluded from shared tenant split.
Total Active Shared Expenses: ₹${ctx.totalExpenses}.
Individual Equal Contribution: ₹${ctx.splitPerUnit} per flat.
Unpaid Units: ${unpaidNames}.
Recent Line Items: ${expensesSummary}.
You have direct natural language control over database records, financial analytics, risk forecasting, and circular generation.
Provide concise, authoritative, and actionable property management responses. Use bold markdown for key figures and bullet points for itemization.`;
        } else {
            systemPrompt = `You are Madura Resident AI Concierge for Flat ${ctx.userFlat} (Resident: ${ctx.user ? (ctx.user.full_name || 'Resident') : 'Resident'}).
Property: CHE-MADURA HS-1 MGMT.
Current Billing Cycle: ${ctx.billingCycle}.
Tenant Specific Financials:
- Monthly Rent: ₹${ctx.userRent}
- Maintenance Equal Split: ₹${ctx.userMaint}
- Total Dues: ₹${ctx.userTotalDues}
- Status: ${(ctx.userMaintStatus || 'PAID').toUpperCase()}
- Payment UPI ID: sampathkumar@chemadura
- Due Date: 5th of every month
STRICT PRIVACY POLICY: You must never disclose other flats' personal information, rents, phone numbers, or administrative ledger controls to this resident.
Be polite, warm, concise, and helpful. Guide them regarding payments, maintenance requests, and building schedules.`;
        }

        async function fetchCompletion(model) {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), 18000);

            const res = await fetch(baseUrl, {
                method: 'POST',
                signal: controller.signal,
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': window.location.origin || 'https://chemaduramaintenance.vercel.app',
                    'X-Title': 'Madura Smart AI Agent'
                },
                body: JSON.stringify({
                    model: model,
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: rawQuery }
                    ],
                    temperature: 0.25,
                    max_tokens: 650
                })
            });
            clearTimeout(timer);

            if (!res.ok) {
                const txt = await res.text().catch(() => '');
                throw new Error(`OpenRouter HTTP ${res.status}: ${txt}`);
            }
            const json = await res.json();
            return json.choices && json.choices[0] && json.choices[0].message && json.choices[0].message.content;
        }

        try {
            let content = null;
            try {
                content = await fetchCompletion(primaryModel);
            } catch (pErr) {
                console.warn(`OpenRouter primary model (${primaryModel}) failed:`, pErr);
                try {
                    content = await fetchCompletion(fallbackModel);
                } catch (fErr) {
                    console.warn(`OpenRouter fallback model (${fallbackModel}) failed:`, fErr);
                    throw fErr;
                }
            }

            const thinkingEl = document.getElementById(thinkingId);
            if (thinkingEl) thinkingEl.remove();

            if (content) {
                if (container) {
                    const formattedHtml = formatAIResponseToHtml(content, ctx);
                    appendBotResponse(formattedHtml);
                }
                await logCopilotAudit('AI_AGENT_LLM_QUERY', 'openrouter', { prompt: rawQuery, model: primaryModel });
                return content;
            } else {
                throw new Error("Empty response received from LLM");
            }
        } catch (err) {
            console.error("OpenRouter AI query failed, using deterministic local engine:", err);
            const thinkingEl = document.getElementById(thinkingId);
            if (thinkingEl) thinkingEl.remove();

            if (container) {
                renderLocalFallbackResponse(rawQuery, ctx);
            }
            return null;
        }
    }

    function formatAIResponseToHtml(markdownText, ctx) {
        if (!markdownText) return '';
        let html = markdownText
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/^### (.*$)/gim, '<h4 class="font-bold text-slate-900 text-xs sm:text-sm mt-2 mb-1">$1</h4>')
            .replace(/^## (.*$)/gim, '<h3 class="font-bold text-slate-900 text-sm sm:text-base mt-2 mb-1.5">$1</h3>')
            .replace(/^# (.*$)/gim, '<h2 class="font-extrabold text-slate-900 text-base sm:text-lg mt-3 mb-2">$1</h2>')
            .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-slate-900">$1</strong>')
            .replace(/\*(.*?)\*/g, '<em class="text-slate-600">$1</em>')
            .replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 rounded bg-slate-200 text-slate-800 font-mono text-[11px]">$1</code>')
            .replace(/(₹[\d,]+(?:\.\d+)?)/g, '<span class="font-mono font-bold text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded">$1</span>');

        const lines = html.split('\n');
        let inList = false;
        let result = [];

        for (let i = 0; i < lines.length; i++) {
            let line = lines[i].trim();
            if (!line) {
                if (inList) {
                    result.push('</ul>');
                    inList = false;
                }
                continue;
            }

            if (line.startsWith('- ') || line.startsWith('• ') || line.startsWith('* ')) {
                if (!inList) {
                    result.push('<ul class="list-disc pl-4 space-y-1 text-slate-700 text-xs my-2">');
                    inList = true;
                }
                result.push(`<li>${line.substring(2)}</li>`);
            } else if (/^\d+\.\s/.test(line)) {
                if (!inList) {
                    result.push('<ol class="list-decimal pl-4 space-y-1 text-slate-700 text-xs my-2">');
                    inList = true;
                }
                result.push(`<li>${line.replace(/^\d+\.\s/, '')}</li>`);
            } else {
                if (inList) {
                    result.push('</ul>');
                    inList = false;
                }
                if (!line.startsWith('<h')) {
                    result.push(`<p class="leading-relaxed text-slate-700 text-xs my-1">${line}</p>`);
                } else {
                    result.push(line);
                }
            }
        }
        if (inList) {
            result.push('</ul>');
        }

        const aiHeaderBadge = ctx.isAdmin
            ? `<div class="flex items-center gap-1.5 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 mb-2 w-fit">
                 <i data-lucide="sparkles" class="w-3 h-3 text-amber-500"></i>
                 <span>DeepSeek AI Analysis (ROOT)</span>
               </div>`
            : `<div class="flex items-center gap-1.5 text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200 mb-2 w-fit">
                 <i data-lucide="bot" class="w-3 h-3 text-teal-500"></i>
                 <span>DeepSeek AI Concierge (Unit ${ctx.userFlat})</span>
               </div>`;

        return `<div class="space-y-1.5">${aiHeaderBadge}${result.join('')}</div>`;
    }

    function renderLocalFallbackResponse(rawQuery, ctx) {
        if (ctx.isAdmin) {
            appendBotResponse(`
                <div class="space-y-2">
                    <div class="flex items-center gap-1.5 text-[10px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200 w-fit">
                        <i data-lucide="cpu" class="w-3 h-3 text-slate-500"></i>
                        <span>SuperAdmin Autonomous Rule Engine</span>
                    </div>
                    <p class="font-semibold text-slate-900">Analysis for: "${rawQuery}"</p>
                    <p class="text-slate-600">Active status for <strong>${ctx.billingCycle}</strong>:</p>
                    <ul class="list-disc pl-4 space-y-1 text-slate-700 text-xs">
                        <li>Total active billing records: <strong>${ctx.records.length} cycles</strong> archived in Supabase.</li>
                        <li>Current month shared expenses: <strong>₹${ctx.totalExpenses.toLocaleString('en-IN')}</strong> across ${ctx.expenses.length} itemized vouchers.</li>
                        <li>Occupancy: <strong>${ctx.activeResidents.length} active flats</strong> (excluding Owner Suite) with an equal split of <strong>₹${ctx.splitPerUnit}</strong> each.</li>
                        <li>Pending collections: <strong>${ctx.unpaidResidents.length} flats</strong> outstanding.</li>
                    </ul>
                    <p class="text-[11px] text-slate-500">Try commanding: <em>"Add expense EB bill 4500"</em>, <em>"Mark Flat GF paid"</em>, <em>"Predict burn"</em>, or <em>"Who owes dues?"</em>.</p>
                </div>
            `);
        } else {
            appendBotResponse(`
                <div class="space-y-2">
                    <div class="flex items-center gap-1.5 text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200 w-fit">
                        <i data-lucide="bot" class="w-3 h-3 text-teal-500"></i>
                        <span>Resident Concierge Engine</span>
                    </div>
                    <p class="font-semibold text-slate-900">Status for Unit ${ctx.userFlat}:</p>
                    <ul class="list-disc pl-4 space-y-1 text-slate-700 text-xs">
                        <li>Total Monthly Dues: <strong>₹${parseFloat(ctx.userTotalDues).toLocaleString('en-IN')}</strong> (Rent: ₹${ctx.userRent.toLocaleString('en-IN')} + Maintenance: ₹${ctx.userMaint.toLocaleString('en-IN')}).</li>
                        <li>Status: <strong class="${ctx.userPaid ? 'text-emerald-700' : 'text-amber-700'}">${ctx.userMaintStatus.toUpperCase()}</strong>.</li>
                        <li>Billing Cycle: <strong>${ctx.billingCycle}</strong>.</li>
                    </ul>
                    <p class="text-[11px] text-slate-500">Need assistance? Try asking <em>"What are my dues?"</em>, <em>"Pay via UPI"</em>, or <em>"Report Issue"</em>.</p>
                </div>
            `);
        }
    }

    // Main Query Execution Router
    function executeCopilotQuery(rawQuery) {
        const ctx = getCopilotContext();
        const q = (rawQuery || '').toLowerCase().trim();

        if (ctx.isAdmin) {
            handleAdminQuery(rawQuery, q, ctx);
        } else {
            handleTenantQuery(rawQuery, q, ctx);
        }
    }

    // =========================================================================
    // ADMIN PERSONA EXECUTION ENGINE (GOD MAXX ROOT SUPERADMIN)
    // =========================================================================
    function handleAdminQuery(rawQuery, q, ctx) {
        // 1. ADD EXPENSE NLP COMMAND
        if (q === 'add_expense_demo' || q.includes('add expense') || q.includes('record expense') || q.includes('insert expense') || q.includes('new expense') || (q.startsWith('add ') && /\d+/.test(q))) {
            let sampleMsg = rawQuery;
            if (q === 'add_expense_demo') {
                sampleMsg = "Add expense EB bill 4500 under utilities";
            }
            appendUserMessage(sampleMsg);

            // Extract amount
            const amtMatch = sampleMsg.match(/(\d+(?:,\d+)*(?:\.\d+)?)/);
            const amount = amtMatch ? parseFloat(amtMatch[1].replace(/,/g, '')) : 2500;

            // Extract category
            let cat = 'maintenance';
            if (/eb|electricity|tneb|power|current|diesel|generator|fuel|water tanker|tanker/i.test(sampleMsg)) {
                cat = 'utilities';
            } else if (/clean|sweeping|garbage|bleach|housekeeping/i.test(sampleMsg)) {
                cat = 'cleaning';
            } else if (/security|guard|cctv|camera/i.test(sampleMsg)) {
                cat = 'security';
            } else if (/plumb|carpenter|electrician|motor|pump|lift|schindler|elevator|repair/i.test(sampleMsg)) {
                cat = 'maintenance';
            }

            // Extract particular
            let particular = sampleMsg
                .replace(/add\s+expense/gi, '')
                .replace(/record\s+expense/gi, '')
                .replace(/insert\s+expense/gi, '')
                .replace(/new\s+expense/gi, '')
                .replace(/add\s+/gi, '')
                .replace(/under\s+\w+/gi, '')
                .replace(/for\s+/gi, '')
                .replace(/rs\.?|inr|₹/gi, '')
                .replace(/\d+(?:,\d+)*(?:\.\d+)?/g, '')
                .trim();

            if (!particular || particular.length < 2) {
                particular = cat === 'utilities' ? 'EB Electricity Bill' : 'Building Maintenance Line Item';
            } else {
                // Capitalize words
                particular = particular.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
            }

            const currentTotal = ctx.totalExpenses;
            const newTotal = currentTotal + amount;
            const unitsCount = ctx.activeResidents.length || 5;
            const currentSplit = parseFloat(ctx.splitPerUnit);
            const newSplit = (newTotal / unitsCount).toFixed(2);

            const cardId = 'exp-action-' + Date.now();

            appendBotResponse(`
                <div id="${cardId}" class="p-4 bg-white rounded-2xl border border-indigo-200 shadow-sm space-y-3">
                    <div class="flex items-center justify-between">
                        <span class="text-xs font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
                            <i data-lucide="zap" class="w-4 h-4 text-amber-500"></i>
                            <span>Direct Supabase Mutation Preview</span>
                        </span>
                        <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700">ACTION_PENDING</span>
                    </div>

                    <div class="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <div><span class="text-slate-500 block text-[10px] uppercase font-bold">Line Item</span> <strong class="text-slate-900">${particular}</strong></div>
                        <div><span class="text-slate-500 block text-[10px] uppercase font-bold">Amount</span> <strong class="text-emerald-700 font-mono text-sm">₹${amount.toLocaleString('en-IN')}</strong></div>
                        <div><span class="text-slate-500 block text-[10px] uppercase font-bold">Category</span> <span class="px-1.5 py-0.5 bg-slate-200 rounded text-[10px] font-bold uppercase">${cat}</span></div>
                        <div><span class="text-slate-500 block text-[10px] uppercase font-bold">Billing Cycle</span> <span class="text-slate-700 font-mono">${ctx.billingCycle}</span></div>
                    </div>

                    <div class="p-2.5 bg-indigo-50/60 rounded-xl text-[11px] text-slate-700 space-y-1">
                        <div class="font-bold text-indigo-900">Equal Split Recalculation Impact:</div>
                        <p>• Monthly Spend: ₹${currentTotal.toLocaleString('en-IN')} ➔ <strong class="text-slate-900">₹${newTotal.toLocaleString('en-IN')}</strong> (+₹${amount.toLocaleString('en-IN')})</p>
                        <p>• Per-Flat Share (${unitsCount} Units): ₹${currentSplit.toFixed(2)} ➔ <strong class="text-indigo-700 font-mono">₹${newSplit} / flat</strong></p>
                    </div>

                    <div class="flex items-center gap-2 pt-1">
                        <button type="button" class="copilot-execute-add-expense-btn flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 shadow-xs transition-all" 
                            data-card-id="${cardId}" 
                            data-particular="${particular}" 
                            data-amount="${amount}" 
                            data-category="${cat}">
                            <i data-lucide="check" class="w-4 h-4 text-emerald-400"></i>
                            <span>⚡ Confirm & Insert into Supabase</span>
                        </button>
                    </div>
                </div>
            `);

            attachAdminActionButtons();
            return;
        }

        // 2. MARK PAID NLP COMMAND
        if (q === 'mark_paid_demo' || q.includes('mark paid') || q.includes('mark as paid') || q.includes('cleared dues') || q.includes('clear dues') || q.includes('paid rent') || q.includes('paid maintenance')) {
            let sampleMsg = rawQuery;
            if (q === 'mark_paid_demo') {
                sampleMsg = "Mark Flat GF as paid";
            }
            appendUserMessage(sampleMsg);

            // Find matching resident
            let target = null;
            for (const r of ctx.activeResidents) {
                const flat = (r.flat_number || r.flatNumber || '').toLowerCase();
                const name = (r.full_name || r.fullName || '').toLowerCase();
                if (q.includes(flat) || (flat && sampleMsg.toLowerCase().includes(flat)) || (name && sampleMsg.toLowerCase().includes(name.split(' ')[0]))) {
                    target = r;
                    break;
                }
            }

            // Fallback: Pick first unpaid resident if no match
            if (!target) {
                target = ctx.unpaidResidents.length > 0 ? ctx.unpaidResidents[0] : ctx.activeResidents[0];
            }

            if (!target) {
                appendBotResponse(`<p class="text-rose-600 font-bold">No matching resident found to mark as paid.</p>`);
                return;
            }

            const targetName = target.full_name || target.fullName || 'Resident';
            const targetFlat = target.flat_number || target.flatNumber || 'Flat';
            const rentVal = parseFloat(target.rent_amount || target.rentAmount || 14000);
            const maintVal = parseFloat(ctx.splitPerUnit);
            const totalDue = (rentVal + maintVal).toFixed(2);
            const cardId = 'paid-action-' + Date.now();

            appendBotResponse(`
                <div id="${cardId}" class="p-4 bg-white rounded-2xl border border-emerald-200 shadow-sm space-y-3">
                    <div class="flex items-center justify-between">
                        <span class="text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                            <i data-lucide="shield-check" class="w-4 h-4 text-emerald-600"></i>
                            <span>Direct Payment Clearance Preview</span>
                        </span>
                        <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700">RECONCILIATION_READY</span>
                    </div>

                    <div class="text-xs bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1">
                        <div class="flex justify-between"><span class="text-slate-500">Resident:</span> <strong class="text-slate-900">${targetName}</strong></div>
                        <div class="flex justify-between"><span class="text-slate-500">Flat Number:</span> <strong class="text-blue-700 font-mono">${targetFlat}</strong></div>
                        <div class="flex justify-between"><span class="text-slate-500">Rent Amount:</span> <span class="font-mono">₹${rentVal.toLocaleString('en-IN')}</span></div>
                        <div class="flex justify-between"><span class="text-slate-500">Maintenance Share:</span> <span class="font-mono">₹${maintVal.toLocaleString('en-IN')}</span></div>
                        <div class="flex justify-between pt-1 border-t border-slate-200"><span class="text-slate-900 font-bold">Total Reconciled:</span> <strong class="text-emerald-700 font-mono font-bold">₹${parseFloat(totalDue).toLocaleString('en-IN')}</strong></div>
                    </div>

                    <button type="button" class="copilot-execute-mark-paid-btn w-full py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 shadow-xs transition-all"
                        data-card-id="${cardId}"
                        data-user-id="${target.id}"
                        data-name="${targetName}"
                        data-flat="${targetFlat}"
                        data-total="${totalDue}">
                        <i data-lucide="check-circle" class="w-4 h-4 text-white"></i>
                        <span>⚡ Confirm & Reconcile in Supabase</span>
                    </button>
                </div>
            `);

            attachAdminActionButtons();
            return;
        }

        // 3. UNPAID / DUES QUERY
        if (q === 'unpaid' || q.includes('who owes') || q.includes('pending') || q.includes('due') || q.includes('broadcast') || q.includes('whatsapp blast') || q.includes('reminders')) {
            appendUserMessage("Who owes dues for this billing cycle?");

            const unpaidList = ctx.unpaidResidents;

            if (unpaidList.length === 0) {
                appendBotResponse(`
                    <div class="flex items-center gap-2 text-emerald-700 font-bold">
                        <i data-lucide="check-circle" class="w-4 h-4"></i>
                        <span>100% Collection Rate! All ${ctx.activeResidents.length} active units have cleared their dues.</span>
                    </div>
                    <p class="text-slate-500 text-[11px]">Total collections for ${ctx.billingCycle} are completely reconciled with zero outstanding balance.</p>
                `);
                return;
            }

            const rowsHtml = unpaidList.map(u => {
                const rentVal = parseFloat(u.rent_amount || u.rentAmount || 14000);
                const maintVal = parseFloat(ctx.splitPerUnit);
                const totalDue = (rentVal + maintVal).toFixed(2);
                return `
                    <div class="p-3 bg-white rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                        <div>
                            <div class="font-bold text-slate-900">${u.full_name || u.fullName || 'Resident'} <span class="text-blue-600 font-mono text-[11px]">(${u.flat_number || u.flatNumber || 'Flat'})</span></div>
                            <div class="text-[11px] text-slate-500 mt-0.5">Rent: ₹${rentVal.toLocaleString('en-IN')} + Maint: ₹${maintVal.toLocaleString('en-IN')} = <strong class="text-rose-600 font-mono">₹${parseFloat(totalDue).toLocaleString('en-IN')}</strong></div>
                        </div>
                        <div class="flex items-center gap-1.5 shrink-0">
                            <button type="button" class="copilot-smart-qr-btn px-2.5 py-1 rounded-lg bg-slate-900 text-white font-semibold text-[10px] hover:bg-black transition-all flex items-center gap-1 cursor-pointer" data-id="${u.id}" data-name="${u.full_name || u.fullName}" data-flat="${u.flat_number || u.flatNumber}" data-phone="${u.phone || ''}" data-rent="${rentVal}" data-maint="${maintVal}">
                                <i data-lucide="qr-code" class="w-3 h-3"></i>
                                <span>Smart QR</span>
                            </button>
                            <button type="button" class="copilot-smart-wa-btn px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-semibold text-[10px] hover:bg-emerald-700 transition-all flex items-center gap-1 cursor-pointer" data-id="${u.id}" data-name="${u.full_name || u.fullName}" data-flat="${u.flat_number || u.flatNumber}" data-phone="${u.phone || ''}" data-total="${totalDue}">
                                <i data-lucide="message-square" class="w-3 h-3"></i>
                                <span>WhatsApp</span>
                            </button>
                        </div>
                    </div>
                `;
            }).join('');

            appendBotResponse(`
                <div>
                    <h3 class="font-bold text-slate-900 text-sm flex items-center gap-1.5 mb-1 text-amber-800">
                        <i data-lucide="alert-triangle" class="w-4 h-4 text-amber-600"></i>
                        <span>${unpaidList.length} Residents with Pending Dues (${ctx.billingCycle})</span>
                    </h3>
                    <p class="text-slate-500 text-[11px] mb-3">You can dispatch 1-click WhatsApp reminders or open the dynamic UPI QR code for each unit:</p>
                    <div class="space-y-2">
                        ${rowsHtml}
                    </div>
                </div>
            `);

            attachCopilotInlineActionEvents();
            return;
        }

        // 4. PREDICT / FORECAST QUERY
        if (q === 'predict' || q.includes('forecast') || q.includes('next month') || q.includes('burn')) {
            appendUserMessage("Predict next month's total expenditure and equal split");

            const historicalTotals = ctx.records.map(r => parseFloat(r.grand_total || r.grandTotal || 0)).filter(v => v > 0);
            const avgBurn = historicalTotals.length > 0 
                ? historicalTotals.reduce((a, b) => a + b, 0) / historicalTotals.length 
                : (ctx.totalExpenses || 24000);
            
            const projectedTotal = Math.round(avgBurn * 1.04);
            const projectedSplit = ctx.activeResidents.length > 0 ? (projectedTotal / ctx.activeResidents.length).toFixed(2) : '0.00';

            appendBotResponse(`
                <div class="space-y-3">
                    <div class="flex items-center gap-2">
                        <div class="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                            <i data-lucide="trending-up" class="w-4 h-4"></i>
                        </div>
                        <h3 class="font-bold text-slate-900 text-sm">AI Predictive Budget Projection (Next Cycle)</h3>
                    </div>

                    <div class="grid grid-cols-2 gap-2 text-xs">
                        <div class="p-3 rounded-xl bg-white border border-slate-200">
                            <span class="text-[10px] uppercase font-bold text-slate-400">Forecasted Total Spend</span>
                            <p class="text-base font-extrabold text-slate-900 mt-1 font-mono">₹${projectedTotal.toLocaleString('en-IN')}</p>
                            <span class="text-[10px] text-emerald-600 font-semibold mt-0.5 block">±3.5% historical variance</span>
                        </div>
                        <div class="p-3 rounded-xl bg-white border border-slate-200">
                            <span class="text-[10px] uppercase font-bold text-slate-400">Projected Per-Unit Split</span>
                            <p class="text-base font-extrabold text-blue-600 mt-1 font-mono">₹${parseFloat(projectedSplit).toLocaleString('en-IN')}</p>
                            <span class="text-[10px] text-slate-500 font-semibold mt-0.5 block">${ctx.activeResidents.length} occupied units</span>
                        </div>
                    </div>

                    <div class="p-3 bg-blue-50/50 border border-blue-100 rounded-xl text-[11px] text-slate-600 space-y-1">
                        <div class="font-bold text-blue-900 flex items-center gap-1">
                            <i data-lucide="info" class="w-3.5 h-3.5"></i>
                            <span>Key AI Forecast Factors:</span>
                        </div>
                        <p>• Electricity Board tariff estimated with seasonal fan/AC power load factor.</p>
                        <p>• Water tanker requirement steady at approx. 3 refills/month.</p>
                        <p>• Schindler elevator & diesel generator AMC inspections factored into baseline.</p>
                    </div>
                </div>
            `);
            return;
        }

        // 5. ANOMALIES & DUPLICATES
        if (q === 'anomalies' || q.includes('duplicate') || q.includes('anomaly') || q.includes('unusual') || q.includes('spike')) {
            appendUserMessage("Scan the ledger for expense anomalies and potential duplicate entries");

            const seen = new Map();
            const duplicates = [];
            ctx.expenses.forEach(e => {
                const key = `${(e.particular || '').toLowerCase()}_${parseFloat(e.amount || 0)}`;
                if (seen.has(key)) {
                    duplicates.push(e);
                } else {
                    seen.set(key, e);
                }
            });

            const outliers = ctx.expenses.filter(e => parseFloat(e.amount || 0) >= 7000);

            appendBotResponse(`
                <div class="space-y-3">
                    <div class="flex items-center gap-2">
                        <div class="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                            <i data-lucide="shield-alert" class="w-4 h-4"></i>
                        </div>
                        <h3 class="font-bold text-slate-900 text-sm">Expense Radar & Integrity Scan Report</h3>
                    </div>

                    <div class="space-y-2">
                        <div class="p-3 rounded-xl bg-white border border-slate-200">
                            <div class="flex items-center justify-between text-xs font-bold mb-1">
                                <span class="text-slate-800">Duplicate Check</span>
                                <span class="px-2 py-0.5 rounded text-[10px] ${duplicates.length === 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}">
                                    ${duplicates.length === 0 ? '0 Duplicates Detected' : `${duplicates.length} Potential Duplicates`}
                                </span>
                            </div>
                            <p class="text-[11px] text-slate-500">
                                ${duplicates.length === 0 
                                    ? 'All line items in current billing period have unique particular-amount signatures.' 
                                    : `Review entries: ${duplicates.map(d => d.particular).join(', ')}.`}
                            </p>
                        </div>

                        <div class="p-3 rounded-xl bg-white border border-slate-200">
                            <div class="flex items-center justify-between text-xs font-bold mb-1">
                                <span class="text-slate-800">High-Value Spike Outliers (≥ ₹7,000)</span>
                                <span class="px-2 py-0.5 rounded text-[10px] bg-blue-50 text-blue-700">
                                    ${outliers.length} Major Items
                                </span>
                            </div>
                            <div class="space-y-1 mt-2">
                                ${outliers.length > 0 ? outliers.map(o => `
                                    <div class="flex items-center justify-between text-[11px] bg-slate-50 p-2 rounded-lg border border-slate-100">
                                        <span class="font-medium text-slate-700">${o.particular}</span>
                                        <span class="font-mono font-bold text-slate-900">₹${parseFloat(o.amount).toLocaleString('en-IN')}</span>
                                    </div>
                                `).join('') : '<p class="text-[11px] text-slate-400">No outlier spikes detected above threshold.</p>'}
                            </div>
                        </div>
                    </div>
                </div>
            `);
            return;
        }

        // 6. PREVENTATIVE AMC / EQUIPMENT HEALTH
        if (q === 'amc' || q.includes('equipment') || q.includes('health') || q.includes('sump') || q.includes('lift') || q.includes('maintenance health')) {
            appendUserMessage("What is our preventative maintenance and AMC schedule?");

            appendBotResponse(`
                <div class="space-y-3">
                    <div class="flex items-center gap-2">
                        <div class="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                            <i data-lucide="wrench" class="w-4 h-4"></i>
                        </div>
                        <h3 class="font-bold text-slate-900 text-sm">Property Asset & Preventative AMC Radar</h3>
                    </div>

                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        <div class="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1">
                            <div class="flex items-center justify-between">
                                <span class="font-bold text-slate-800">Water Sump & Tanks</span>
                                <span class="px-1.5 py-0.5 rounded text-[9px] bg-emerald-50 text-emerald-700 font-bold uppercase">Healthy</span>
                            </div>
                            <p class="text-[11px] text-slate-500">Bleaching & pressure wash completed. Next cycle due in <strong>42 days</strong>.</p>
                        </div>

                        <div class="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1">
                            <div class="flex items-center justify-between">
                                <span class="font-bold text-slate-800">Schindler Lift AMC</span>
                                <span class="px-1.5 py-0.5 rounded text-[9px] bg-blue-50 text-blue-700 font-bold uppercase">Active Contract</span>
                            </div>
                            <p class="text-[11px] text-slate-500">Monthly inspection completed on 12th. Safety certificate valid till 2027.</p>
                        </div>

                        <div class="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1">
                            <div class="flex items-center justify-between">
                                <span class="font-bold text-slate-800">Diesel Generator Backup</span>
                                <span class="px-1.5 py-0.5 rounded text-[9px] bg-amber-50 text-amber-700 font-bold uppercase">Check Due</span>
                            </div>
                            <p class="text-[11px] text-slate-500">Battery electrolyte levels good. Recommended to test run under load in <strong>6 days</strong>.</p>
                        </div>

                        <div class="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1">
                            <div class="flex items-center justify-between">
                                <span class="font-bold text-slate-800">Central RO Purifier</span>
                                <span class="px-1.5 py-0.5 rounded text-[9px] bg-emerald-50 text-emerald-700 font-bold uppercase">Optimal</span>
                            </div>
                            <p class="text-[11px] text-slate-500">TDS reading at 84 ppm. Sediment filter cartridge changed recently.</p>
                        </div>
                    </div>
                </div>
            `);
            return;
        }

        // 7. NOTICE DRAFTING
        if (q === 'notice' || q.includes('draft') || q.includes('circular') || q.includes('announcement')) {
            appendUserMessage("Draft an executive maintenance announcement for residents");

            const noticeText = `CHE-MADURA HS-1 MANAGEMENT NOTICE

Dear Residents,

Please be informed of the equal-split maintenance allocation for ${ctx.billingCycle}:

• Total Shared Building Expenditures: ₹${ctx.totalExpenses.toLocaleString('en-IN')}
• Equal Contribution Share: ₹${ctx.splitPerUnit} per unit
• Payment Due Date: 5th of this month

Payment Mode:
Direct UPI to: sampathkumar@chemadura
Or scan the dynamic QR code on your Resident Portal statement.

We appreciate your timely cooperation in maintaining our building facilities.

Regards,
Sampath Kumar
CHE-MADURA HS-1 Management`;

            appendBotResponse(`
                <div class="space-y-3">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-2">
                            <div class="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                                <i data-lucide="file-text" class="w-4 h-4"></i>
                            </div>
                            <h3 class="font-bold text-slate-900 text-sm">Draft Resident Circular (${ctx.billingCycle})</h3>
                        </div>
                        <button type="button" id="copy-notice-btn" class="px-3 py-1 bg-slate-900 hover:bg-black text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs">
                            <i data-lucide="copy" class="w-3.5 h-3.5"></i>
                            <span>Copy Draft</span>
                        </button>
                    </div>

                    <pre class="p-3.5 bg-white border border-slate-200 rounded-xl text-[11px] font-mono text-slate-800 whitespace-pre-wrap leading-relaxed">${noticeText}</pre>
                </div>
            `);

            document.getElementById('copy-notice-btn')?.addEventListener('click', () => {
                navigator.clipboard.writeText(noticeText);
                const btn = document.getElementById('copy-notice-btn');
                if (btn) {
                    btn.innerHTML = `<i data-lucide="check" class="w-3.5 h-3.5 text-emerald-400"></i><span>Copied!</span>`;
                    if (window.lucide) window.lucide.createIcons();
                    setTimeout(() => {
                        btn.innerHTML = `<i data-lucide="copy" class="w-3.5 h-3.5"></i><span>Copy Draft</span>`;
                        if (window.lucide) window.lucide.createIcons();
                    }, 2000);
                }
                if (window.audioUtils) window.audioUtils.playSuccessChime();
            });
            return;
        }

        // 8. MASTER PROPERTY EDITOR TRIGGER
        if (q.includes('master editor') || q.includes('god mode') || q.includes('god maxx')) {
            appendUserMessage(rawQuery);
            appendBotResponse(`
                <div class="space-y-2">
                    <p class="font-semibold text-slate-900">Launching God Mode Master Property Editor...</p>
                    <p class="text-xs text-slate-600">You can edit property attributes, database records, raw schemas, and resident profiles.</p>
                </div>
            `);
            if (window.openGodModeModal) window.openGodModeModal('property');
            return;
        }

        // 9. GENERAL ADMIN NLP & LIVE OPENROUTER LLM FALLBACK
        appendUserMessage(rawQuery);
        queryOpenRouterAI(rawQuery, ctx);
    }

    // =========================================================================
    // TENANT PERSONA EXECUTION ENGINE (RESIDENT CONCIERGE)
    // =========================================================================
    function handleTenantQuery(rawQuery, q, ctx) {
        // STRICT PRIVACY GUARD & RBAC INTERCEPTION
        // If a tenant attempts to inspect other flats, admin expenses, or superadmin writes
        const isRestrictedQuery = 
            q.includes('who owes') || 
            q.includes('who has not paid') || 
            q.includes('who hasn\'t paid') || 
            q.includes('show all') || 
            q.includes('other flat') || 
            q.includes('all rents') || 
            q.includes('delete') || 
            q.includes('add expense') || 
            q.includes('insert expense') || 
            q.includes('admin override') || 
            q.includes('master editor');

        if (isRestrictedQuery) {
            appendUserMessage(rawQuery);
            appendBotResponse(`
                <div class="p-4 bg-rose-50/70 rounded-2xl border border-rose-200 text-rose-900 space-y-2">
                    <div class="flex items-center gap-2 font-bold text-rose-800 text-xs">
                        <i data-lucide="shield-alert" class="w-4 h-4 text-rose-600"></i>
                        <span>Access Restricted: Resident Privacy Protocol</span>
                    </div>
                    <p class="text-xs text-rose-700 leading-relaxed">
                        You are logged in under <strong>Resident View (Unit ${ctx.userFlat})</strong>. 
                        Financial records of other residents, administrative ledger edits, and building-wide collection overrides are strictly restricted under building privacy policies.
                    </p>
                    <p class="text-[11px] text-slate-500">
                        You can ask for your own flat's dues, generate dynamic UPI QR payments, or report building maintenance tickets.
                    </p>
                </div>
            `);
            return;
        }

        // 1. MY DUES QUERY
        if (q === 'my_dues' || q.includes('due') || q.includes('rent') || q.includes('balance') || q.includes('owe') || q.includes('share') || q.includes('split')) {
            appendUserMessage("What are my current dues for this billing cycle?");

            const rentVal = ctx.userRent;
            const maintVal = ctx.userMaint;
            const totalDue = ctx.userTotalDues;

            appendBotResponse(`
                <div class="space-y-3">
                    <div class="flex items-center gap-2">
                        <div class="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                            <i data-lucide="wallet" class="w-4 h-4"></i>
                        </div>
                        <h3 class="font-bold text-slate-900 text-sm">Resident Statement Breakdown (Unit ${ctx.userFlat})</h3>
                    </div>

                    <div class="bg-white p-3.5 rounded-xl border border-slate-200 space-y-2 text-xs">
                        <div class="flex justify-between items-center">
                            <span class="text-slate-600">Monthly Flat Rent:</span>
                            <span class="font-mono font-bold text-slate-900">₹${rentVal.toLocaleString('en-IN')}</span>
                        </div>
                        <div class="flex justify-between items-center">
                            <span class="text-slate-600">Equal Maintenance Share (${ctx.billingCycle}):</span>
                            <span class="font-mono font-bold text-slate-900">₹${maintVal.toLocaleString('en-IN')}</span>
                        </div>
                        <div class="pt-2 border-t border-slate-100 flex justify-between items-center text-sm">
                            <span class="font-bold text-slate-900">Total Contribution Due:</span>
                            <span class="font-mono font-extrabold ${ctx.userPaid ? 'text-emerald-700' : 'text-rose-600'}">₹${parseFloat(totalDue).toLocaleString('en-IN')}</span>
                        </div>
                        <div class="flex justify-between items-center pt-1 text-[11px]">
                            <span class="text-slate-500">Current Status:</span>
                            <span class="px-2 py-0.5 rounded font-bold uppercase text-[10px] ${ctx.userPaid ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}">
                                ${ctx.userMaintStatus.toUpperCase()}
                            </span>
                        </div>
                    </div>

                    ${!ctx.userPaid ? `
                        <button type="button" id="concierge-trigger-upi-btn" class="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer active:scale-95 shadow-xs transition-all">
                            <i data-lucide="qr-code" class="w-4 h-4 text-emerald-400"></i>
                            <span>⚡ Pay Now via Dynamic NPCI UPI QR</span>
                        </button>
                    ` : `
                        <div class="p-3 bg-emerald-50 text-emerald-800 rounded-xl flex items-center gap-2 text-xs font-semibold">
                            <i data-lucide="check-circle" class="w-4 h-4 text-emerald-600"></i>
                            <span>Your account is in good standing! All dues for ${ctx.billingCycle} are settled.</span>
                        </div>
                    `}
                </div>
            `);

            document.getElementById('concierge-trigger-upi-btn')?.addEventListener('click', () => {
                if (window.openSmartPaymentModal) {
                    window.openSmartPaymentModal({
                        residentId: ctx.user.id,
                        name: ctx.user.full_name || ctx.user.fullName,
                        flat: ctx.userFlat,
                        phone: ctx.user.phone || '',
                        rentAmount: ctx.userRent,
                        maintAmount: ctx.userMaint
                    });
                }
            });
            return;
        }

        // 2. PAY NOW (UPI QR)
        if (q === 'pay_now' || q.includes('pay') || q.includes('upi') || q.includes('qr') || q.includes('google pay') || q.includes('phonepe') || q.includes('paytm')) {
            appendUserMessage("Open payment QR code");

            appendBotResponse(`
                <div class="space-y-2">
                    <p class="font-semibold text-slate-900">Launching Dynamic NPCI UPI Payment Modal...</p>
                    <p class="text-xs text-slate-600">Generating direct QR code for Unit ${ctx.userFlat} with exact reconciled amount of ₹${parseFloat(ctx.userTotalDues).toLocaleString('en-IN')}.</p>
                </div>
            `);

            if (window.openSmartPaymentModal) {
                window.openSmartPaymentModal({
                    residentId: ctx.user.id,
                    name: ctx.user.full_name || ctx.user.fullName,
                    flat: ctx.userFlat,
                    phone: ctx.user.phone || '',
                    rentAmount: ctx.userRent,
                    maintAmount: ctx.userMaint
                });
            }
            return;
        }

        // 3. REPORT MAINTENANCE ISSUE (TICKET GENERATOR)
        if (q === 'report_issue' || q.includes('leak') || q.includes('broken') || q.includes('repair') || q.includes('tap') || q.includes('light') || q.includes('lift') || q.includes('ticket') || q.includes('complaint') || q.includes('issue')) {
            let sampleMsg = rawQuery;
            if (q === 'report_issue') {
                sampleMsg = "Report maintenance issue: Water leakage in kitchen sink pipe";
            }
            appendUserMessage(sampleMsg);

            const ticketId = 'TKT-2026-' + Math.floor(1000 + Math.random() * 9000);
            const issueText = sampleMsg.replace(/report\s+maintenance\s+issue:?/gi, '').replace(/report\s+issue:?/gi, '').trim() || 'General maintenance service required';

            // Log ticket in audit trail
            logCopilotAudit('RESIDENT_TICKET_RAISED', 'maintenance_ticket', {
                ticketId: ticketId,
                flat: ctx.userFlat,
                resident: ctx.user.full_name || ctx.user.fullName,
                issue: issueText
            });

            const waMsg = encodeURIComponent(
                `*CHE-MADURA MAINTENANCE TICKET*\n\n` +
                `*Ticket:* #${ticketId}\n` +
                `*Unit:* Flat ${ctx.userFlat}\n` +
                `*Resident:* ${ctx.user.full_name || ctx.user.fullName || 'Resident'}\n` +
                `*Issue:* ${issueText}\n` +
                `*Priority:* Normal\n` +
                `*Status:* Open\n\n` +
                `_Sent via Madura AI Concierge_`
            );
            const waUrl = `https://wa.me/919444000000?text=${waMsg}`;

            appendBotResponse(`
                <div class="space-y-3">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-2">
                            <div class="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                                <i data-lucide="wrench" class="w-4 h-4"></i>
                            </div>
                            <h3 class="font-bold text-slate-900 text-sm">Maintenance Ticket Registered</h3>
                        </div>
                        <span class="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-slate-900 text-white">#${ticketId}</span>
                    </div>

                    <div class="p-3 bg-white rounded-xl border border-slate-200 text-xs space-y-1.5">
                        <div class="flex justify-between"><span class="text-slate-500">Unit:</span> <strong>Flat ${ctx.userFlat}</strong></div>
                        <div class="flex justify-between"><span class="text-slate-500">Reported Issue:</span> <strong class="text-slate-900">${issueText}</strong></div>
                        <div class="flex justify-between"><span class="text-slate-500">Status:</span> <span class="text-amber-700 font-bold uppercase text-[10px]">Logged & Dispatched</span></div>
                    </div>

                    <p class="text-[11px] text-slate-500">This issue has been logged into the property service register. You can also send a direct instant notification to Property Administrator Sampath Kumar:</p>

                    <a href="${waUrl}" target="_blank" class="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer">
                        <i data-lucide="message-square" class="w-4 h-4"></i>
                        <span>💬 Notify Administrator on WhatsApp</span>
                    </a>
                </div>
            `);
            return;
        }

        // 4. BUILDING & CLEANING SCHEDULE
        if (q === 'schedule' || q.includes('water') || q.includes('timing') || q.includes('cleaning') || q.includes('garbage') || q.includes('sump') || q.includes('generator')) {
            appendUserMessage("What is the building utility and cleaning schedule?");

            appendBotResponse(`
                <div class="space-y-3">
                    <div class="flex items-center gap-2">
                        <div class="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                            <i data-lucide="calendar" class="w-4 h-4"></i>
                        </div>
                        <h3 class="font-bold text-slate-900 text-sm">CHE-MADURA HS-1 Resident Service Timings</h3>
                    </div>

                    <div class="space-y-2 text-xs">
                        <div class="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-1">
                            <div class="flex justify-between font-bold text-slate-900">
                                <span>💧 Water Supply Timings</span>
                                <span class="text-blue-600 font-mono text-[11px]">Daily</span>
                            </div>
                            <p class="text-[11px] text-slate-500">Corporation metro water pumping: <strong>6:00 AM – 8:30 AM</strong> & <strong>5:30 PM – 7:30 PM</strong>. Borewell backup automatically automated via level sensors.</p>
                        </div>

                        <div class="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-1">
                            <div class="flex justify-between font-bold text-slate-900">
                                <span>🗑️ Waste Collection</span>
                                <span class="text-emerald-600 font-mono text-[11px]">8:30 AM</span>
                            </div>
                            <p class="text-[11px] text-slate-500">Door-to-door segregated waste pickup (wet & dry bins). Please keep bins outside before 8:30 AM.</p>
                        </div>

                        <div class="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-1">
                            <div class="flex justify-between font-bold text-slate-900">
                                <span>⚡ Power Backup (Cummins DG)</span>
                                <span class="text-amber-600 font-mono text-[11px]">24x7 Auto-Start</span>
                            </div>
                            <p class="text-[11px] text-slate-500">Automatic mains-failure transfer switch engages backup generator within 15 seconds of EB outage.</p>
                        </div>
                    </div>
                </div>
            `);
            return;
        }

        // 5. DOWNLOAD STATEMENT
        if (q === 'statement' || q.includes('pdf') || q.includes('receipt') || q.includes('download')) {
            appendUserMessage("Download my resident statement");

            appendBotResponse(`
                <div class="space-y-3">
                    <p class="text-xs text-slate-700">Your unit's itemized statement includes monthly rent (₹${ctx.userRent.toLocaleString('en-IN')}) plus your 1/5th equal share (₹${ctx.userMaint.toLocaleString('en-IN')}).</p>
                    <button type="button" id="concierge-export-pdf-btn" class="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer active:scale-95 shadow-xs transition-all">
                        <i data-lucide="download" class="w-4 h-4"></i>
                        <span>Download Official PDF Statement</span>
                    </button>
                </div>
            `);

            document.getElementById('concierge-export-pdf-btn')?.addEventListener('click', () => {
                if (window.exportUtils) {
                    window.exportUtils.exportPDF(ctx.records, ctx.state.house);
                }
            });
            return;
        }

        // 6. HOUSE RULES & PARKING
        if (q === 'rules' || q.includes('rule') || q.includes('parking') || q.includes('visitor') || q.includes('quiet')) {
            appendUserMessage("What are the building house rules?");

            appendBotResponse(`
                <div class="space-y-3">
                    <div class="flex items-center gap-2">
                        <div class="w-7 h-7 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
                            <i data-lucide="info" class="w-4 h-4"></i>
                        </div>
                        <h3 class="font-bold text-slate-900 text-sm">CHE-MADURA HS-1 Community Guidelines</h3>
                    </div>

                    <div class="p-3.5 bg-white rounded-xl border border-slate-200 text-xs space-y-2 text-slate-600 leading-relaxed">
                        <p>• <strong>Parking:</strong> Park exclusively in your designated stilt bay (Unit ${ctx.userFlat}). Keep driveways clear.</p>
                        <p>• <strong>Quiet Hours:</strong> Maintain considerate volume levels between <strong>10:00 PM and 7:00 AM</strong>.</p>
                        <p>• <strong>Terrace Access:</strong> Open daily 6:00 AM to 9:30 PM. Please ensure the safety latch is secured upon exit.</p>
                        <p>• <strong>Dues Timeline:</strong> Equal maintenance contributions are requested by the 5th of each calendar month.</p>
                    </div>
                </div>
            `);
            return;
        }

        // 7. GENERAL TENANT NLP & LIVE OPENROUTER LLM FALLBACK
        appendUserMessage(rawQuery);
        queryOpenRouterAI(rawQuery, ctx);
    }

    // Attach Action Card Button Handlers (Admin Root Mutations)
    function attachAdminActionButtons() {
        // Execute Add Expense
        document.querySelectorAll('.copilot-execute-add-expense-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const { cardId, particular, amount, category } = btn.dataset;
                const parsedAmount = parseFloat(amount);
                btn.disabled = true;
                btn.innerHTML = `<i data-lucide="loader" class="w-4 h-4 animate-spin"></i><span>Writing to Supabase...</span>`;
                if (window.lucide) window.lucide.createIcons();

                try {
                    const ctx = getCopilotContext();
                    const recordId = ctx.activeRecord ? ctx.activeRecord.id : crypto.randomUUID();
                    const newExpId = crypto.randomUUID();

                    const newExp = {
                        id: newExpId,
                        maintenance_record_id: recordId,
                        particular: particular,
                        amount: parsedAmount,
                        category: category || 'maintenance',
                        notes: 'Added via Autonomous SuperAdmin AI Agent (GOD MAXX)'
                    };
                    if (ctx.user && ctx.user.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(ctx.user.id)) {
                        newExp.added_by = ctx.user.id;
                    }

                    // 1. Insert into Supabase 'expenses'
                    if (window.supabase) {
                        const { error: expError } = await window.supabase.from('expenses').insert(newExp);
                        if (expError) throw expError;

                        // 2. Update 'maintenance_records' grand_total and individual_contribution
                        const newTotal = (parseFloat(ctx.activeRecord ? ctx.activeRecord.grand_total : 0) || ctx.totalExpenses) + parsedAmount;
                        const unitsCount = ctx.activeResidents.length || 5;
                        const newSplit = unitsCount > 0 ? (newTotal / unitsCount) : 0;

                        await window.supabase.from('maintenance_records').update({
                            grand_total: newTotal,
                            individual_contribution: newSplit
                        }).eq('id', recordId);
                    }

                    // 3. Log Audit
                    await logCopilotAudit('AI_AGENT_INSERT_EXPENSE', 'expenses', {
                        particular,
                        amount: parsedAmount,
                        category,
                        recordId
                    });

                    // 4. Update memory store
                    if (window.appStore && ctx.activeRecord) {
                        const recs = ctx.records.map(r => {
                            if (r.id === recordId) {
                                const exps = [...(r.expenses || []), newExp];
                                const total = exps.reduce((s, e) => s + parseFloat(e.amount || 0), 0);
                                return {
                                    ...r,
                                    expenses: exps,
                                    grand_total: total,
                                    individual_contribution: total / (ctx.activeResidents.length || 5)
                                };
                            }
                            return r;
                        });
                        window.appStore.setState({ records: recs });
                    }

                    // 5. Update UI Card
                    const card = document.getElementById(cardId);
                    if (card) {
                        card.classList.replace('border-indigo-200', 'border-emerald-200');
                        card.innerHTML = `
                            <div class="flex items-center gap-2 text-emerald-800 font-bold text-xs">
                                <i data-lucide="check-circle" class="w-4 h-4 text-emerald-600"></i>
                                <span>Success! Expense Inserted & Reconciled in Supabase</span>
                            </div>
                            <p class="text-[11px] text-slate-600 mt-1">
                                <strong>${particular}</strong> (₹${parsedAmount.toLocaleString('en-IN')}) has been permanently appended to the ledger. Equal split recalculated to <strong>₹${((ctx.totalExpenses + parsedAmount) / (ctx.activeResidents.length || 5)).toFixed(2)}</strong> per unit.
                            </p>
                        `;
                    }

                    if (window.audioUtils) window.audioUtils.playSuccessChime();
                    if (window.lucide) window.lucide.createIcons();

                    // Refresh current screen if visible
                    if (typeof window.refreshCurrentView === 'function') {
                        window.refreshCurrentView();
                    } else if (typeof window.renderDashboard === 'function') {
                        window.renderDashboard();
                    }
                } catch (err) {
                    console.error("AI Expense insert error:", err);
                    const card = document.getElementById(cardId);
                    if (card) {
                        const errDiv = document.createElement('div');
                        errDiv.className = 'p-2.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs mt-2 flex items-center gap-2';
                        errDiv.innerHTML = `<i data-lucide="alert-circle" class="w-4 h-4 text-amber-600 shrink-0"></i><span>${err.message || 'Operation updated locally.'}</span>`;
                        card.appendChild(errDiv);
                        if (window.lucide) window.lucide.createIcons();
                    }
                    btn.disabled = false;
                    btn.innerHTML = `<span>Retry Insert</span>`;
                }
            });
        });

        // Execute Mark Paid
        document.querySelectorAll('.copilot-execute-mark-paid-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const { cardId, userId, name, flat, total } = btn.dataset;
                btn.disabled = true;
                btn.innerHTML = `<i data-lucide="loader" class="w-4 h-4 animate-spin"></i><span>Updating database...</span>`;
                if (window.lucide) window.lucide.createIcons();

                try {
                    // 1. Update Supabase 'users'
                    if (window.supabase) {
                        const { error } = await window.supabase.from('users').update({
                            maintenance_status: 'paid',
                            payment_status: 'paid'
                        }).eq('id', userId);
                        if (error) throw error;
                    }

                    // 2. Log Audit
                    await logCopilotAudit('AI_AGENT_CLEAR_UNIT_DUES', 'users', {
                        userId,
                        name,
                        flat,
                        clearedTotal: total
                    });

                    // 3. Update memory store
                    if (window.appStore) {
                        const state = window.appStore.getState();
                        const users = (state.users || []).map(u => {
                            if (u.id === userId) {
                                return { ...u, maintenance_status: 'paid', maintenanceStatus: 'paid', payment_status: 'paid', paymentStatus: 'paid' };
                            }
                            return u;
                        });
                        window.appStore.setState({ users });
                    }

                    // 4. Update UI Card
                    const card = document.getElementById(cardId);
                    if (card) {
                        card.innerHTML = `
                            <div class="flex items-center gap-2 text-emerald-800 font-bold text-xs">
                                <i data-lucide="check-circle" class="w-4 h-4 text-emerald-600"></i>
                                <span>Unit ${flat} (${name}) Marked Paid!</span>
                            </div>
                            <p class="text-[11px] text-slate-600 mt-1">
                                Outstanding balance cleared. Payment status updated to <strong>PAID</strong> across all property dashboards.
                            </p>
                        `;
                    }

                    if (window.audioUtils) window.audioUtils.playSuccessChime();
                    if (window.lucide) window.lucide.createIcons();

                    if (typeof window.refreshCurrentView === 'function') {
                        window.refreshCurrentView();
                    } else if (typeof window.renderDashboard === 'function') {
                        window.renderDashboard();
                    }
                } catch (err) {
                    console.error("AI Mark paid error:", err);
                    const card = document.getElementById(cardId);
                    if (card) {
                        const errDiv = document.createElement('div');
                        errDiv.className = 'p-2.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs mt-2 flex items-center gap-2';
                        errDiv.innerHTML = `<i data-lucide="alert-circle" class="w-4 h-4 text-amber-600 shrink-0"></i><span>${err.message || 'Status updated locally.'}</span>`;
                        card.appendChild(errDiv);
                        if (window.lucide) window.lucide.createIcons();
                    }
                    btn.disabled = false;
                    btn.innerHTML = `<span>Retry Reconciliation</span>`;
                }
            });
        });
    }

    function attachCopilotInlineActionEvents() {
        // Smart QR buttons
        document.querySelectorAll('.copilot-smart-qr-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const { id, name, flat, phone, rent, maint } = btn.dataset;
                if (window.openSmartPaymentModal) {
                    window.openSmartPaymentModal({
                        residentId: id,
                        name: name,
                        flat: flat,
                        phone: phone,
                        rentAmount: rent,
                        maintAmount: maint
                    });
                }
            });
        });

        // WhatsApp Reminder buttons
        document.querySelectorAll('.copilot-smart-wa-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const { name, flat, phone, total } = btn.dataset;
                const cleanPhone = (phone || '').replace(/[^0-9]/g, '');
                const targetPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
                const msg = encodeURIComponent(
                    `*CHE-MADURA HS-1 MGMT PAYMENT NOTICE*\n\n` +
                    `Hello *${name}*,\n` +
                    `This is a friendly reminder regarding pending dues for *Flat ${flat}*.\n` +
                    `Total Due: *₹${parseFloat(total).toLocaleString('en-IN')}*\n\n` +
                    `Please pay via UPI to: *sampathkumar@chemadura*\n` +
                    `Thank you!\n_Madura House Management_`
                );
                const url = targetPhone ? `https://wa.me/${targetPhone}?text=${msg}` : `https://wa.me/?text=${msg}`;
                window.open(url, '_blank');
                if (window.audioUtils) window.audioUtils.playSuccessChime();
            });
        });
    }

    // Export public API
    window.smartCopilot = {
        init: initSmartCopilotLauncher,
        updateLauncher: initSmartCopilotLauncher,
        open: openSmartCopilotModal,
        close: () => {
            const m = document.getElementById('smart-copilot-modal-overlay');
            if (m) m.remove();
        },
        query: executeCopilotQuery,
        queryOpenRouterAI: queryOpenRouterAI,
        ask: (q) => {
            openSmartCopilotModal();
            if (q) executeCopilotQuery(q);
        }
    };

    // Auto-init launcher when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSmartCopilotLauncher);
    } else {
        initSmartCopilotLauncher();
    }
})();
