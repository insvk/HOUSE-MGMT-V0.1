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

        const users = usersRes.status === 'fulfilled' && !usersRes.value.error ? (usersRes.value.data || []) : [];
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
        
    } catch (e) {
        console.error("Failed to load global data", e);
    }
}

window.loadGlobalData = loadGlobalData;
