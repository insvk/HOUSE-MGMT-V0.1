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

function renderLogin() {
    const root = document.getElementById('app-root');
    root.innerHTML = `
        <div class="flex min-h-screen items-center justify-center bg-[#f3f3f9] relative overflow-hidden">
            <!-- Decorative background elements -->
            <div class="absolute top-0 left-0 w-full h-96 bg-blue-600 rounded-b-[4rem] z-0"></div>
            
            <div class="bg-white p-10 rounded-2xl shadow-xl w-full max-w-md z-10 relative">
                <div class="text-center mb-8">
                    <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 text-blue-600 mb-4">
                        <i data-lucide="building-2" class="w-8 h-8"></i>
                    </div>
                    <h2 class="text-2xl font-bold text-gray-800">MADURA HOUSE</h2>
                    <p class="text-sm text-gray-500 mt-1">Maintenance Management System</p>
                </div>
                
                <form id="login-form" class="space-y-5">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Email, Username or Flat</label>
                        <div class="relative">
                            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <i data-lucide="user" class="h-5 w-5 text-gray-400"></i>
                            </div>
                            <input id="login-id" type="text" placeholder="e.g. F01 - FRONT" class="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" required />
                        </div>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Password</label>
                        <div class="relative">
                            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <i data-lucide="lock" class="h-5 w-5 text-gray-400"></i>
                            </div>
                            <input id="login-pass" type="password" placeholder="••••••••" class="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" required />
                        </div>
                    </div>
                    
                    <button type="submit" id="login-btn" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg shadow transition-colors flex justify-center items-center gap-2">
                        <span>Sign In</span>
                        <i data-lucide="arrow-right" class="w-4 h-4"></i>
                    </button>
                    
                    <div id="login-error" class="text-red-500 text-sm mt-2 hidden text-center bg-red-50 p-2 rounded border border-red-100"></div>
                </form>
                
                <div class="mt-6 text-center text-xs text-gray-500">
                    Version V0.1 • Enterprise Migration Build
                </div>
            </div>
        </div>
    `;

    lucide.createIcons();

    document.getElementById('login-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('login-id').value;
        const pass = document.getElementById('login-pass').value;
        const errDiv = document.getElementById('login-error');
        const btn = document.getElementById('login-btn');
        
        errDiv.classList.add('hidden');
        btn.innerHTML = '<i data-lucide="loader-2" class="w-5 h-5 animate-spin"></i><span>Authenticating...</span>';
        lucide.createIcons();
        btn.disabled = true;
        
        const res = await window.authService.login(id, pass);
        if (res.success) {
            await loadGlobalData();
            window.location.hash = '#/';
        } else {
            errDiv.innerHTML = `<i data-lucide="alert-circle" class="w-4 h-4 inline mr-1"></i>${res.error}`;
            errDiv.classList.remove('hidden');
            btn.innerHTML = '<span>Sign In</span><i data-lucide="arrow-right" class="w-4 h-4"></i>';
            lucide.createIcons();
            btn.disabled = false;
        }
    });
}

function renderMaintenance() {
    const root = document.getElementById('app-root');
    root.innerHTML = \`<div class="flex h-screen w-full bg-gray-50">
        <!-- Add Sidebar via JS template injection if building a real SPA, but for now duplicate or wrap -->
        <div class="p-8 w-full">
            <div class="flex items-center gap-4 mb-6">
                <button onclick="window.location.hash='#/'" class="p-2 hover:bg-gray-200 rounded-full bg-gray-100 transition-colors">
                    <i data-lucide="arrow-left" class="w-5 h-5 text-gray-600"></i>
                </button>
                <h1 class="text-2xl font-bold">Maintenance Module</h1>
            </div>
            <div class="bg-white p-12 rounded-xl border border-gray-200 text-center text-gray-500 shadow-sm">
                <i data-lucide="hammer" class="w-12 h-12 mx-auto text-gray-300 mb-4"></i>
                <h2 class="text-xl font-medium mb-2">Under Construction</h2>
                <p>The Maintenance Ledger is currently being ported to Vanilla JS.</p>
            </div>
        </div>
    </div>\`;
    lucide.createIcons();
}

function renderTenants() {
    const root = document.getElementById('app-root');
    root.innerHTML = \`<div class="flex h-screen w-full bg-gray-50">
        <div class="p-8 w-full">
            <div class="flex items-center gap-4 mb-6">
                <button onclick="window.location.hash='#/'" class="p-2 hover:bg-gray-200 rounded-full bg-gray-100 transition-colors">
                    <i data-lucide="arrow-left" class="w-5 h-5 text-gray-600"></i>
                </button>
                <h1 class="text-2xl font-bold">Tenant Directory</h1>
            </div>
            <div class="bg-white p-12 rounded-xl border border-gray-200 text-center text-gray-500 shadow-sm">
                <i data-lucide="users" class="w-12 h-12 mx-auto text-gray-300 mb-4"></i>
                <h2 class="text-xl font-medium mb-2">Under Construction</h2>
                <p>The Tenant Directory is currently being ported to Vanilla JS.</p>
            </div>
        </div>
    </div>\`;
    lucide.createIcons();
}

function renderInvoices() {
    const root = document.getElementById('app-root');
    root.innerHTML = \`<div class="flex h-screen w-full bg-gray-50">
        <div class="p-8 w-full">
            <div class="flex items-center gap-4 mb-6">
                <button onclick="window.location.hash='#/'" class="p-2 hover:bg-gray-200 rounded-full bg-gray-100 transition-colors">
                    <i data-lucide="arrow-left" class="w-5 h-5 text-gray-600"></i>
                </button>
                <h1 class="text-2xl font-bold">Invoice Gallery</h1>
            </div>
            <div class="bg-white p-12 rounded-xl border border-gray-200 text-center text-gray-500 shadow-sm">
                <i data-lucide="file-text" class="w-12 h-12 mx-auto text-gray-300 mb-4"></i>
                <h2 class="text-xl font-medium mb-2">Under Construction</h2>
                <p>The Invoice Gallery is currently being ported to Vanilla JS.</p>
            </div>
        </div>
    </div>\`;
    lucide.createIcons();
}
