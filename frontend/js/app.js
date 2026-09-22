// App Initialization and Routing Updates

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
            handler: () => renderDashboard()
        },
        {
            path: '#/maintenance',
            guard: () => window.appStore.getState().isLoggedIn,
            handler: () => renderMaintenance()
        },
        {
            path: '#/tenants',
            guard: () => window.appStore.getState().isLoggedIn,
            handler: () => renderTenants()
        },
        {
            path: '#/invoices',
            guard: () => window.appStore.getState().isLoggedIn,
            handler: () => renderInvoices()
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
        // Optional: Re-render logic could hook in here if implementing a VDOM-like wrapper,
        // but for now we manually trigger re-renders where necessary or rely on route changes.
    });
});

async function loadGlobalData() {
    try {
        // Fetch baseline data just like the React App.tsx did
        const [usersRes, recordsRes, houseRes] = await Promise.all([
            supabase.from('users').select('*'),
            supabase.from('maintenance_records').select('*, expenses(*)').order('year', { ascending: false }).order('month', { ascending: false }),
            supabase.from('houses').select('*').limit(1).single()
        ]);

        window.appStore.setState({
            users: usersRes.data || [],
            records: recordsRes.data || [],
            house: houseRes.data || null
        });
        
    } catch (e) {
        console.error("Failed to load global data", e);
    }
}



