// Configuration parameters
const CONFIG = {
    // Read from window variables or defaults
    SUPABASE_URL: "https://kbvjnshgyuwkcvicwefh.supabase.co", // Hardcoded as per context
    // Anon key must be injected or found
    // We will placeholder it, but it should come from environment variables.
    // However, in plain HTML, we must provide it directly or fetch it. 
    // Wait, the anon key is public. We can hardcode it, or fetch it via an API, but it's safe to expose.
    // I need to read the anon key from .env to place it here. 
    SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtidmpuc2hneXV3a2N2aWN3ZWZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg2NjQ0NTIsImV4cCI6MjEwNDI0MDQ1Mn0.ysi0SnVJfD5L2M_r2twp06oBRbMq7U-K8vRGcqU_XJg",
    BACKEND_URL: "http://localhost:8000/api"
};
