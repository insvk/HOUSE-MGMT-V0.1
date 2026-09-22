// Authentication Service Module
// Faithful reproduction of React lib/authService.ts

var DEFAULT_CREDENTIALS = {
  'sampathkumar@chemadura.com': 'Sampath@123',
  'production.chemadura26@gmail.com': 'Sampath@123',
  'rsivanaresh@gmail.com': 'Sivakalai#83',
};

class AuthService {
    getSb() {
        return window.supabase || window.appSupabase;
    }

    getStore() {
        return window.appStore || window.store;
    }

    async initializeSession() {
        const sb = this.getSb();
        if (!sb || !sb.auth) return false;
        try {
            const { data: { session } } = await sb.auth.getSession();
            if (session && session.user) {
                await this.handleSessionUser(session.user);
                return true;
            }
        } catch (e) {
            console.warn("Session check error:", e);
        }
        return false;
    }

    async handleSessionUser(authUser) {
        const sb = this.getSb();
        const storeInstance = this.getStore();
        if (!sb) return;

        try {
            // Find public user
            let { data: publicUser } = await sb
                .from('users')
                .select('*')
                .eq('auth_id', authUser.id)
                .single();

            if (!publicUser && authUser.email) {
                let { data: emailUser } = await sb
                    .from('users')
                    .select('*')
                    .eq('email', authUser.email)
                    .single();

                if (emailUser) {
                    await sb.from('users').update({ auth_id: authUser.id }).eq('id', emailUser.id);
                    publicUser = { ...emailUser, auth_id: authUser.id };
                }
            }

            if (!publicUser) {
                const role = (authUser.email === 'sampathkumar@chemadura.com' || authUser.email === 'production.chemadura26@gmail.com') ? 'OWNER' : 'TENANT';
                publicUser = {
                    id: authUser.id,
                    auth_id: authUser.id,
                    email: authUser.email,
                    full_name: authUser.user_metadata?.full_name || authUser.email.split('@')[0],
                    flat_number: authUser.user_metadata?.flat_number || (role === 'OWNER' ? 'Owner Suite' : 'GF'),
                    role: role,
                    occupancy_status: 'active',
                    payment_status: 'paid'
                };
            }

            if (storeInstance) {
                storeInstance.setState({ isLoggedIn: true, user: publicUser });
            }
        } catch (err) {
            console.error("handleSessionUser error:", err);
        }
    }

    async login(identifier, password) {
        const sb = this.getSb();
        const storeInstance = this.getStore();
        if (!sb) return { success: false, error: 'Database service not ready' };

        const cleanId = (identifier || '').trim();
        const cleanIdLower = cleanId.toLowerCase();
        const cleanPassword = (password || '').trim();

        // 1. Resolve target email
        let targetEmail = cleanIdLower;
        if (cleanIdLower === 'sampath' || cleanIdLower === 'owner' || cleanIdLower === 'sampath kumar' || cleanIdLower === 'owner suite') {
            targetEmail = 'sampathkumar@chemadura.com';
        } else if (cleanIdLower === 'siva' || cleanIdLower === 'admin' || cleanIdLower === 'admin suite') {
            targetEmail = 'rsivanaresh@gmail.com';
        }

        // 2. PATH A: Direct Supabase GoTrue Auth
        try {
            const { data, error } = await sb.auth.signInWithPassword({
                email: targetEmail,
                password: cleanPassword
            });

            if (!error && data?.session && data?.user) {
                await this.handleSessionUser(data.user);
                const user = storeInstance ? storeInstance.getState().user : null;
                return { success: true, user: user || data.user };
            }
        } catch (authErr) {
            console.warn("GoTrue sign-in attempt notice:", authErr);
        }

        // 3. PATH B: Match against DEFAULT_CREDENTIALS
        const expected = DEFAULT_CREDENTIALS[targetEmail] || DEFAULT_CREDENTIALS[cleanIdLower];
        if (expected && expected === cleanPassword) {
            const role = (targetEmail === 'sampathkumar@chemadura.com' || targetEmail === 'production.chemadura26@gmail.com') ? 'OWNER' : (targetEmail === 'rsivanaresh@gmail.com' ? 'ADMIN_TENANT' : 'TENANT');
            const fallbackUser = {
                id: 'b2341592-d7e9-4104-b298-fb2d10a37cb2',
                email: targetEmail,
                full_name: targetEmail === 'sampathkumar@chemadura.com' ? 'Sampath Kumar' : (targetEmail === 'rsivanaresh@gmail.com' ? 'SIVA R' : targetEmail.split('@')[0]),
                flat_number: role === 'OWNER' ? 'Owner Suite' : 'Admin Suite',
                role: role,
                occupancy_status: 'active',
                payment_status: 'paid'
            };

            if (storeInstance) {
                storeInstance.setState({ isLoggedIn: true, user: fallbackUser });
            }
            return { success: true, user: fallbackUser };
        }

        // 4. PATH C: Check local cached accounts (offline / sync fallback)
        try {
            const saved = localStorage.getItem('madura_house_users_v2');
            if (saved) {
                const localList = JSON.parse(saved);
                if (Array.isArray(localList)) {
                    const strippedUsername = cleanIdLower.replace(/^@/, '');
                    const matched = localList.find((u) => {
                        if (!u || u.occupancyStatus === 'evicted') return false;
                        const uEmail = (u.email || '').toLowerCase().trim();
                        const uUser = (u.username || '').toLowerCase().replace(/^@/, '').trim();
                        const uFlat = (u.flatNumber || u.flat_number || '').toLowerCase().trim();
                        return uEmail === cleanIdLower || uUser === strippedUsername || uFlat === cleanIdLower;
                    });
                    if (matched && (matched.password === cleanPassword || !matched.password || cleanPassword.length >= 6)) {
                        const localUser = {
                            id: matched.id || 'usr_' + Date.now(),
                            email: matched.email || targetEmail,
                            full_name: matched.fullName || matched.full_name || 'Resident',
                            flat_number: matched.flatNumber || matched.flat_number || 'GF',
                            role: matched.role || 'TENANT',
                            occupancy_status: 'active',
                            payment_status: 'paid'
                        };
                        if (storeInstance) {
                            storeInstance.setState({ isLoggedIn: true, user: localUser });
                        }
                        return { success: true, user: localUser };
                    }
                }
            }
        } catch (e) {}

        return { success: false, error: 'Invalid credentials. Please check your email and password.' };
    }

    async logout() {
        const sb = this.getSb();
        const storeInstance = this.getStore();
        try {
            if (sb && sb.auth) await sb.auth.signOut();
        } catch (e) {}
        if (storeInstance) storeInstance.setState({ isLoggedIn: false, user: null });
    }

    async signUp(email, password, metadata = {}) {
        const sb = this.getSb();
        if (!sb || !sb.auth) return { success: false, error: 'Auth client not available' };
        try {
            const { data, error } = await sb.auth.signUp({
                email,
                password,
                options: { data: metadata }
            });
            if (error) {
                return { success: false, error: error.message };
            }
            return { success: true, user: data.user, session: data.session };
        } catch (err) {
            return { success: false, error: err.message };
        }
    }

    async refreshSession() {
        const sb = this.getSb();
        if (!sb || !sb.auth) return { success: false, error: 'Auth client not available' };
        try {
            const { data, error } = await sb.auth.refreshSession();
            if (error) {
                return { success: false, error: error.message };
            }
            if (data?.session?.user) {
                await this.handleSessionUser(data.session.user);
            }
            return { success: true, session: data.session };
        } catch (err) {
            return { success: false, error: err.message };
        }
    }
}

var authService = new AuthService();
window.authService = authService;
