import os
from dotenv import load_dotenv

# Load environment variables from .env or .env.local
load_dotenv()

SUPABASE_URL = os.getenv("VITE_SUPABASE_URL", "")
SUPABASE_ANON_KEY = os.getenv("VITE_SUPABASE_ANON_KEY", "")
# In a real environment, you'd use a service role key for admin tasks
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

RESEND_API_KEY = os.getenv("VITE_RESEND_API_KEY", "")
RESEND_FROM_EMAIL = os.getenv("VITE_RESEND_FROM_EMAIL", "onboarding@resend.dev")

APP_NAME = os.getenv("VITE_APP_NAME", "MADURA HOUSE MAINTENANCE MGMT V0.1")
