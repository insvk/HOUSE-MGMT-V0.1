// Smart Payment Modal & UPI QR Engine for CHE-MADURA HS-1 MGMT
// Provides instant NPCI-compliant dynamic UPI QR generation, 1-Click WhatsApp dues reminder, and quick reconciliation.

(function() {
    function closeSmartPaymentModal() {
        const existing = document.getElementById('smart-payment-modal-overlay');
        if (existing) {
            existing.classList.add('fade-out');
            setTimeout(() => existing.remove(), 100);
        }
    }

    function openSmartPaymentModal(opts = {}) {
        let { residentId, name, flat, phone, rentAmount, maintAmount, amount, status } = opts;
        let existing = document.getElementById('smart-payment-modal-overlay');
        if (existing) existing.remove();

        name = name || 'Resident';
        flat = flat || 'HS-1';
        phone = phone || '';
        maintAmount = maintAmount !== undefined ? maintAmount : (amount !== undefined ? amount : 1450);
        rentAmount = rentAmount !== undefined ? rentAmount : 0;

        const state = window.appStore ? window.appStore.getState() : {};
        const house = state.house || {};
        const records = state.records || [];
        const currentRecord = records.length > 0 ? records[0] : null;
        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        const billingCycle = currentRecord ? `${monthNames[currentRecord.month - 1]} ${currentRecord.year}` : 'Current Month';

        const rent = parseFloat(rentAmount) || 0;
        const maint = parseFloat(maintAmount) || 0;
        const totalDues = (rent + maint).toFixed(2);
        const upiId = 'sampathkumar@chemadura';
        const payeeName = 'CHE-MADURA HS-1 MGMT';
        const note = `Flat ${flat} ${billingCycle} Dues`;
        const upiUrl = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(payeeName)}&am=${totalDues}&cu=INR&tn=${encodeURIComponent(note)}`;
        const cleanPhone = (phone || '').replace(/[^0-9]/g, '');
        const targetPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

        const overlay = document.createElement('div');
        overlay.id = 'smart-payment-modal-overlay';
        overlay.className = 'fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-2.5 sm:p-4 animate-in fade-in duration-100 backdrop-blur-xs';
        overlay.innerHTML = `
            <div id="smart-payment-modal" class="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col p-4 sm:p-6 max-h-[92dvh] overflow-y-auto animate-in zoom-in-95 duration-150">
                <!-- Header -->
                <div class="flex items-center justify-between pb-3 sm:pb-4 border-b border-slate-100">
                    <div class="flex items-center gap-2.5">
                        <div class="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shrink-0">
                            <i data-lucide="qr-code" class="w-5 h-5"></i>
                        </div>
                        <div>
                            <h2 class="text-sm sm:text-base font-bold text-slate-900">Smart UPI Collection & QR</h2>
                            <p class="text-[11px] sm:text-xs text-slate-500">${name} • Flat ${flat}</p>
                        </div>
                    </div>
                    <button type="button" id="close-smart-pay-modal" class="smart-qr-close-btn p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer">
                        <i data-lucide="x" class="w-5 h-5"></i>
                    </button>
                </div>

                <!-- Breakdown Cards -->
                <div class="my-3 sm:my-4 space-y-3">
                    <div class="grid grid-cols-2 gap-2 text-xs">
                        <div class="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                            <span class="text-[10px] uppercase font-bold text-slate-400">Maintenance Split</span>
                            <p class="text-xs sm:text-sm font-bold text-slate-800 mt-0.5">₹${maint.toLocaleString('en-IN')}</p>
                        </div>
                        <div class="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                            <span class="text-[10px] uppercase font-bold text-slate-400">Monthly Rent</span>
                            <p class="text-xs sm:text-sm font-bold text-slate-800 mt-0.5">₹${rent.toLocaleString('en-IN')}</p>
                        </div>
                    </div>

                    <div class="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                        <div>
                            <span class="text-[10px] uppercase font-extrabold text-emerald-700 tracking-wider">Total Payable Amount</span>
                            <p class="text-lg sm:text-xl font-extrabold text-emerald-900 font-mono">₹${parseFloat(totalDues).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                        </div>
                        <span class="px-2 py-0.5 rounded-md bg-emerald-600 text-white font-bold text-[10px] uppercase tracking-wider">Dynamic UPI</span>
                    </div>

                    <!-- Dynamic QR Code Container -->
                    <div class="flex flex-col items-center justify-center p-3 sm:p-4 bg-white border border-slate-200 rounded-xl shadow-2xs">
                        <div id="smart-qr-target" class="w-40 h-40 sm:w-48 sm:h-48 flex items-center justify-center bg-white p-2 rounded-lg border border-slate-100 shadow-inner">
                            <!-- QR image fallback -->
                            <img 
                                src="https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(upiUrl)}" 
                                alt="UPI QR Code" 
                                class="w-full h-full object-contain rounded"
                            />
                        </div>
                        <p class="text-[11px] text-slate-500 font-medium mt-2 flex items-center gap-1">
                            <i data-lucide="scan-line" class="w-3.5 h-3.5 text-emerald-600"></i>
                            <span>Scan with GPay, PhonePe, Paytm, Cred or BHIM</span>
                        </p>
                        <div class="flex items-center gap-1.5 mt-1 text-[10px] font-mono text-slate-400 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100">
                            <span>UPI ID:</span>
                            <span class="text-slate-800 font-bold">${upiId}</span>
                        </div>
                    </div>
                </div>

                <!-- Action Buttons -->
                <div class="space-y-2 pt-2 border-t border-slate-100">
                    <div class="grid grid-cols-2 gap-2">
                        <!-- WhatsApp Reminder Button -->
                        <button 
                            type="button" 
                            id="smart-whatsapp-remind-btn" 
                            class="w-full px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer"
                        >
                            <i data-lucide="message-square" class="w-3.5 h-3.5"></i>
                            <span>WhatsApp Remind</span>
                        </button>

                        <!-- Copy UPI Intent Link -->
                        <button 
                            type="button" 
                            id="smart-copy-upi-btn" 
                            class="w-full px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                        >
                            <i data-lucide="copy" class="w-3.5 h-3.5"></i>
                            <span>Copy UPI Info</span>
                        </button>
                    </div>

                    <!-- Mark as Paid Instantly -->
                    <button 
                        type="button" 
                        id="smart-mark-paid-instant-btn" 
                        class="w-full px-4 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer"
                    >
                        <i data-lucide="check-circle" class="w-3.5 h-3.5 text-emerald-400"></i>
                        <span>Mark Full Balance as Paid & Clear</span>
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        if (window.lucide && typeof window.lucide.createIcons === 'function') {
            try { window.lucide.createIcons(); } catch (e) {}
        }

        // Close
        const close = () => {
            overlay.classList.add('fade-out');
            setTimeout(() => overlay.remove(), 100);
        };
        document.getElementById('close-smart-pay-modal')?.addEventListener('click', close);
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) close();
        });

        // WhatsApp Reminder Click
        document.getElementById('smart-whatsapp-remind-btn')?.addEventListener('click', () => {
            const waMsg = encodeURIComponent(
                `*CHE-MADURA HS-1 MGMT PAYMENT NOTICE*\n\n` +
                `Hello *${name}*,\n` +
                `This is a friendly statement regarding dues for *Flat ${flat}* (${billingCycle}):\n\n` +
                `• *Maintenance Split:* ₹${maint.toLocaleString('en-IN')}\n` +
                `• *Monthly Rent:* ₹${rent.toLocaleString('en-IN')}\n` +
                `• *Total Due:* *₹${parseFloat(totalDues).toLocaleString('en-IN', { minimumFractionDigits: 2 })}*\n\n` +
                `Please pay via UPI to: *${upiId}*\n` +
                `Or scan the QR code via your mobile banking app.\n\n` +
                `Thank you!\n_Madura House Management_`
            );
            const waUrl = targetPhone ? `https://wa.me/${targetPhone}?text=${waMsg}` : `https://wa.me/?text=${waMsg}`;
            window.open(waUrl, '_blank');
            if (window.audioUtils) window.audioUtils.playSuccessChime();
        });

        // Copy UPI Info Click
        document.getElementById('smart-copy-upi-btn')?.addEventListener('click', (e) => {
            const copyText = `CHE-MADURA HS-1 MGMT Payment Details:
UPI ID: ${upiId}
Payee: ${payeeName}
Amount Due: ₹${totalDues}
Note: Flat ${flat} ${billingCycle} Dues`;
            navigator.clipboard.writeText(copyText).then(() => {
                const btn = document.getElementById('smart-copy-upi-btn');
                if (btn) {
                    btn.innerHTML = `<i data-lucide="check" class="w-3.5 h-3.5 text-emerald-600"></i><span>Copied!</span>`;
                    if (window.lucide) window.lucide.createIcons();
                    setTimeout(() => {
                        btn.innerHTML = `<i data-lucide="copy" class="w-3.5 h-3.5"></i><span>Copy UPI Info</span>`;
                        if (window.lucide) window.lucide.createIcons();
                    }, 2000);
                }
                if (window.audioUtils) window.audioUtils.playSuccessChime();
            });
        });

        // Mark Full Balance as Paid Instantly
        document.getElementById('smart-mark-paid-instant-btn')?.addEventListener('click', async () => {
            if (!residentId) return;
            const btn = document.getElementById('smart-mark-paid-instant-btn');
            if (btn) btn.innerHTML = `<span class="animate-spin">⏳</span> Clearing dues...`;

            try {
                // Update Supabase
                if (window.supabase) {
                    await window.supabase.from('users').update({
                        payment_status: 'paid',
                        paymentStatus: 'paid',
                        maintenance_status: 'paid'
                    }).eq('id', residentId);
                }

                // Update appStore
                if (window.appStore) {
                    const storeUsers = window.appStore.getState().users || [];
                    const updatedUsers = storeUsers.map(u => u.id === residentId ? {
                        ...u,
                        payment_status: 'paid',
                        paymentStatus: 'paid',
                        maintenance_status: 'paid',
                        maintenanceStatus: 'paid'
                    } : u);
                    window.appStore.setState({ users: updatedUsers });
                }

                // Update local storage
                try {
                    const cached = localStorage.getItem('madura_house_users_v2');
                    if (cached) {
                        const parsed = JSON.parse(cached);
                        const updated = parsed.map(u => u.id === residentId ? {
                            ...u,
                            payment_status: 'paid',
                            paymentStatus: 'paid',
                            maintenance_status: 'paid',
                            maintenanceStatus: 'paid'
                        } : u);
                        localStorage.setItem('madura_house_users_v2', JSON.stringify(updated));
                    }
                } catch(e) {}

                if (window.audioUtils) window.audioUtils.playSuccessChime();
                close();

                if (typeof window.refreshCurrentView === 'function') {
                    window.refreshCurrentView();
                } else if (typeof window.loadGlobalData === 'function') {
                    await window.loadGlobalData();
                }
            } catch (err) {
                console.error("Mark paid error:", err);
                alert("Failed to update status: " + err.message);
            }
        });
    }

    window.openSmartPaymentModal = openSmartPaymentModal;
    window.closeSmartPaymentModal = closeSmartPaymentModal;
    window.smartPaymentModal = {
        open: openSmartPaymentModal,
        close: closeSmartPaymentModal
    };
})();
