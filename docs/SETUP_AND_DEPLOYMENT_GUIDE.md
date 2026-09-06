# Madura House Maintenance Management Platform - Setup & Deployment Guide

**Product:** Madura House Maintenance  
**Target Environment:** Local Development / Supabase Cloud / Vercel Edge

---

## 🚀 Quick Setup Instructions

### 1. Prerequisites
- **Node.js**: v20.x or higher
- **npm**: v10.x or higher
- **Supabase Account**: (Free tier)
- **Vercel Account**: (Free tier)
- **Resend API Key**: (Free tier - 100 emails/day)

---

## 🛠️ Step-by-Step Implementation

### Phase 1: Local Development Run
```bash
# 1. Clone or navigate to the repository
cd "s:/vs code/HOUSE MAINTENEANCE MGMT"

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev

# 4. Open browser
# Navigate to http://localhost:5173
```

### Phase 2: Database Initialization (Supabase)
1. Log in to [Supabase Console](https://app.supabase.com).
2. Create a new project named `madura-house-maintenance`.
3. Open **SQL Editor**.
4. Run the SQL DDL script from `database/schema.sql`.
5. Run the seed script from `database/seed-data.sql`.
6. Copy `Project URL` and `anon key` to your `.env` file.

### Phase 3: Vercel Web Deployment
1. Connect your GitHub repository to Vercel.
2. Set Environment Variables:
   - `VITE_SUPABASE_URL`: Your Supabase URL
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase Anon Key
   - `RESEND_API_KEY`: Your Resend API Key
3. Deploy! Auto-deploys on push to `main`.

---

## 🔐 Environment Variables (.env)

```env
VITE_APP_NAME="Madura House Maintenance"
VITE_ADMIN_EMAIL="sampathkumar@chemadur.com"
VITE_SUPABASE_URL="https://your-supabase-id.supabase.co"
VITE_SUPABASE_ANON_KEY="your-anon-key"
RESEND_API_KEY="re_123456789"
```

---

## ❓ Troubleshooting

- **Chart not rendering?** Ensure Recharts and responsive containers have explicit heights.
- **Email send failed?** Verify `RESEND_API_KEY` is valid and domain DNS records (SPF/DKIM) are verified in Resend console.
- **Permission Denied in RLS?** Verify the active user role in `roles` table matches `OWNER` or `ADMIN_TENANT`.
