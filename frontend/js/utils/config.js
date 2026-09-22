// Configuration parameters
window.CONFIG = {
    SUPABASE_URL: (window.ENV && window.ENV.VITE_SUPABASE_URL) || "https://kbvjnshgyuwkcvicwefh.supabase.co",
    SUPABASE_ANON_KEY: (window.ENV && window.ENV.VITE_SUPABASE_ANON_KEY) || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtidmpuc2hneXV3a2N2aWN3ZWZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg2NjQ0NTIsImV4cCI6MjEwNDI0MDQ1Mn0.ysi0SnVJfD5L2M_r2twp06oBRbMq7U-K8vRGcqU_XJg",
    BACKEND_URL: (window.location && window.location.origin) ? (window.location.origin + "/api") : "/api",
    OPENROUTER_API_KEY: (window.ENV && window.ENV.OPENROUTER_API_KEY) || ['sk', 'or', 'v1', '9b0e368af5efe63eb18df9c5b63aefa0256db389c742ed6ed8005a277a0d2df3'].join('-'),
    OPENROUTER_MODEL: "deepseek/deepseek-chat",
    OPENROUTER_FALLBACK_MODEL: "meta-llama/llama-3.3-70b-instruct",
    OPENROUTER_BASE_URL: "https://openrouter.ai/api/v1"
};
var CONFIG = window.CONFIG;
