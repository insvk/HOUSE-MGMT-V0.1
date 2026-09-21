// Supabase client singleton

class SupabaseService {
    constructor() {
        const createClientFn = (window.supabase && typeof window.supabase.createClient === 'function')
            ? window.supabase.createClient
            : (window.supabaseClient && typeof window.supabaseClient.createClient === 'function')
            ? window.supabaseClient.createClient
            : null;

        if (!createClientFn) {
            console.error("Supabase CDN createClient not found.");
            return;
        }
        
        const url = (window.CONFIG && window.CONFIG.SUPABASE_URL) || "https://kbvjnshgyuwkcvicwefh.supabase.co";
        const key = (window.CONFIG && window.CONFIG.SUPABASE_ANON_KEY) || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtidmpuc2hneXV3a2N2aWN3ZWZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg2NjQ0NTIsImV4cCI6MjEwNDI0MDQ1Mn0.ysi0SnVJfD5L2M_r2twp06oBRbMq7U-K8vRGcqU_XJg";

        this.client = createClientFn(url, key);
    }

    getClient() {
        return this.client;
    }
}

var supabaseService = new SupabaseService();
var activeSupabaseClient = supabaseService.getClient();
window.appSupabase = activeSupabaseClient;
window.supabase = activeSupabaseClient;
var supabase = activeSupabaseClient;
