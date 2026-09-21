// Supabase client singleton

class SupabaseService {
    constructor() {
        if (!window.supabase) {
            console.error("Supabase CDN not loaded.");
            return;
        }
        
        this.client = window.supabase.createClient(
            CONFIG.SUPABASE_URL,
            CONFIG.SUPABASE_ANON_KEY
        );
    }

    getClient() {
        return this.client;
    }
}

const supabaseService = new SupabaseService();
const supabase = supabaseService.getClient();
window.appSupabase = supabase; // Expose globally for convenience if needed
