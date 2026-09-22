// App Initialization and Routing Updates
// Enterprise-Grade CosmoLex SPA Architecture

document.addEventListener("DOMContentLoaded", async () => {
    // 1. Check existing session
    const isSessionActive = await window.authService.initializeSession();

    // 2. Load global state data from Supabase if logged in
    if (isSessionActive) {
        await loadGlobalData();
    }

    // 3. Define routes
    const routes = [
        {
            path: '#/login',
            handler: () => {
                const state = window.appStore.getState();
                if (state.isLoggedIn) {
                    window.location.hash = '#/';
                    return;
                }
                renderLogin();
            }
        },
        {
            path: '#/',
            guard: () => window.appStore.getState().isLoggedIn,
            handler: () => {
                if (typeof window.renderDashboard === 'function') {
                    window.renderDashboard();
                }
            }
        },
        {
            path: '#/maintenance',
            guard: () => window.appStore.getState().isLoggedIn,
            handler: () => {
                if (typeof window.renderMaintenance === 'function') {
                    window.renderMaintenance();
                }
            }
        },
        {
            path: '#/tenants',
            guard: () => window.appStore.getState().isLoggedIn,
            handler: () => {
                if (typeof window.renderTenants === 'function') {
                    window.renderTenants();
                }
            }
        },
        {
            path: '#/invoices',
            guard: () => window.appStore.getState().isLoggedIn,
            handler: () => {
                if (typeof window.renderInvoices === 'function') {
                    window.renderInvoices();
                }
            }
        },
        {
            path: '#/analytics',
            guard: () => window.appStore.getState().isLoggedIn,
            handler: () => {
                if (typeof window.renderAnalytics === 'function') {
                    window.renderAnalytics();
                }
            }
        },
        {
            path: '#/notifications',
            guard: () => window.appStore.getState().isLoggedIn,
            handler: () => {
                if (typeof window.renderNotificationCenter === 'function') {
                    window.renderNotificationCenter();
                }
            }
        },
        {
            path: '#/audit',
            guard: () => window.appStore.getState().isLoggedIn,
            handler: () => {
                if (typeof window.renderAuditLogs === 'function') {
                    window.renderAuditLogs();
                }
            }
        },
        {
            path: '*',
            handler: () => {
                window.location.hash = '#/';
            }
        }
    ];

    // 4. Initialize Router
    window.appRouter = new Router(routes);
    window.appRouter.init();
    
    // Subscribe to state changes to handle global updates
    window.appStore.subscribe((state) => {
        // Reserved for reactive global state notifications
    });
});

async function loadGlobalData() {
    try {
        const [usersRes, recordsRes, houseRes, invoicesRes, auditRes, annRes] = await Promise.allSettled([
            supabase.from('users').select('*'),
            supabase.from('maintenance_records').select('*, expenses(*)').order('year', { ascending: false }).order('month', { ascending: false }),
            supabase.from('houses').select('*').limit(1).single(),
            supabase.from('invoices').select('*').order('created_at', { ascending: false }),
            supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(100),
            supabase.from('announcements').select('*').order('created_at', { ascending: false })
        ]);

        let users = usersRes.status === 'fulfilled' && !usersRes.value.error ? (usersRes.value.data || []) : [];
        
        // Permanent filter: completely exclude all evicted, soft-deleted, Rajesh Kumar, and test_resident_ accounts
        users = users.filter(u => {
            if (!u) return false;
            if (u.deleted_at || u.is_active === false) return false;
            const occ = (u.occupancy_status || u.occupancyStatus || '').toLowerCase();
            if (occ === 'evicted') return false;
            const name = (u.full_name || u.fullName || '').trim();
            if (name === 'Rajesh Kumar' || name === '[DELETED_RESIDENT]' || name.includes('test_resident')) return false;
            const email = (u.email || '').toLowerCase().trim();
            if (email.includes('test_resident_') || email.includes('@chemadura.deleted') || email.includes('admin.tenant@madurahouse.local')) return false;
            return true;
        });

        // Also clean cached users in localStorage
        try {
            const cached = localStorage.getItem('madura_house_users_v2');
            if (cached) {
                const parsed = JSON.parse(cached);
                if (Array.isArray(parsed)) {
                    const cleaned = parsed.filter(u => {
                        if (!u) return false;
                        const name = (u.fullName || u.full_name || '').trim();
                        const email = (u.email || '').toLowerCase().trim();
                        const occ = (u.occupancyStatus || u.occupancy_status || '').toLowerCase();
                        return occ !== 'evicted' && name !== 'Rajesh Kumar' && name !== '[DELETED_RESIDENT]' && !email.includes('test_resident_') && !email.includes('@chemadura.deleted');
                    });
                    localStorage.setItem('madura_house_users_v2', JSON.stringify(cleaned));
                }
            }
        } catch (e) {}

        const records = recordsRes.status === 'fulfilled' && !recordsRes.value.error ? (recordsRes.value.data || []) : [];
        const house = houseRes.status === 'fulfilled' && !houseRes.value.error ? (houseRes.value.data || null) : null;
        const invoices = invoicesRes.status === 'fulfilled' && !invoicesRes.value.error ? (invoicesRes.value.data || []) : [];
        const auditLogs = auditRes.status === 'fulfilled' && !auditRes.value.error ? (auditRes.value.data || []) : [];
        const announcements = annRes.status === 'fulfilled' && !annRes.value.error ? (annRes.value.data || []) : [];

        window.appStore.setState({
            users: users,
            records: records,
            house: house,
            invoices: invoices,
            auditLogs: auditLogs,
            announcements: announcements
        });

        // Automatically update active view to reflect synced Supabase changes
        const hasOpenModal = document.querySelector('#tenant-form-modal:not(.hidden), #add-modal:not(.hidden), #god-mode-modal:not(.hidden), #avatar-upload-modal:not(.hidden)');
        const isTyping = document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA');
        if (!hasOpenModal && !isTyping && typeof refreshCurrentView === 'function') {
            refreshCurrentView();
        }
        
    } catch (e) {
        console.error("Failed to load global data", e);
    }
}

window.loadGlobalData = loadGlobalData;

function refreshCurrentView() {
    const hash = window.location.hash || '#/';
    if (hash === '#/' || hash === '') {
        if (typeof window.renderDashboard === 'function') window.renderDashboard();
    } else if (hash.startsWith('#/maintenance')) {
        if (typeof window.renderMaintenance === 'function') window.renderMaintenance();
    } else if (hash.startsWith('#/tenants')) {
        if (typeof window.renderTenants === 'function') window.renderTenants();
    } else if (hash.startsWith('#/invoices')) {
        if (typeof window.renderInvoices === 'function') window.renderInvoices();
    } else if (hash.startsWith('#/analytics')) {
        if (typeof window.renderAnalytics === 'function') window.renderAnalytics();
    } else if (hash.startsWith('#/notifications')) {
        if (typeof window.renderNotificationCenter === 'function') window.renderNotificationCenter();
    } else if (hash.startsWith('#/audit')) {
        if (typeof window.renderAuditLogs === 'function') window.renderAuditLogs();
    }
}
window.refreshCurrentView = refreshCurrentView;
