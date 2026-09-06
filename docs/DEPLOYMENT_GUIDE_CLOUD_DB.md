# 🚀 Cloud Database Integration & Web Deployment Guide

**Product**: `MADURA HOUSE MAINTENANCE MGMT V0.1`  
**Architecture**: React 18 + TypeScript + Vite + PostgreSQL (Supabase/Cloud SQL) + Nginx/Vercel/Netlify

---

## 📑 Table of Contents
1. [Overview](#1-overview)
2. [Step 1: Cloud Database Setup (Supabase / PostgreSQL)](#2-step-1-cloud-database-setup-supabase--postgresql)
3. [Step 2: Environment Variables Configuration](#3-step-2-environment-variables-configuration)
4. [Step 3: Web Deployment Options](#4-step-3-web-deployment-options)
   - [Option A: Deploy to Vercel (Recommended)](#option-a-deploy-to-vercel-recommended)
   - [Option B: Deploy to Netlify](#option-b-deploy-to-netlify)
   - [Option C: Deploy to Google Cloud Run (Docker Container)](#option-c-deploy-to-google-cloud-run-docker)
5. [Step 4: Verification & Live Health Check](#5-step-4-verification--live-health-check)

---

## 1. Overview

The platform is designed with a **Dual-Mode Data Architecture**:
- **Offline / Local Dev Mode**: Uses persistent browser storage when cloud environment variables are absent.
- **Cloud Database Mode**: When `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are provided, the application connects to a cloud-hosted PostgreSQL database with Row-Level Security (RLS).

---

## 2. Step 1: Cloud Database Setup (Supabase / PostgreSQL)

### 1. Create a Supabase Project
1. Go to [https://supabase.com](https://supabase.com) and click **"New Project"**.
2. Name your project: `madura-house-maintenance`.
3. Choose your database password and select region (e.g. `ap-south-1` for Mumbai / India).

### 2. Execute the Database Schema
1. Open the **SQL Editor** in the Supabase Dashboard.
2. Copy and paste the complete content of [`database/schema.sql`](file:///s:/vs%20code/HOUSE%20MAINTENEANCE%20MGMT/database/schema.sql).
3. Click **"Run"**.
   - This creates all 9 tables (`houses`, `users`, `roles`, `maintenance_records`, `expenses`, `invoices`, `notification_logs`, `audit_logs`) with foreign keys, constraints, and Row Level Security policies.

### 3. (Optional) Run the Initial Clean Seed Script
1. In the SQL Editor, run [`database/seed-data.sql`](file:///s:/vs%20code/HOUSE%20MAINTENEANCE%20MGMT/database/seed-data.sql).
   - This registers the property record and seeds the Owner (`sampathkumar@chemadur.com`) and Admin Tenant (`admin.tenant@madurahouse.local`).

### 4. Create Storage Bucket for Invoices
1. Go to **Storage** in the Supabase Dashboard.
2. Click **"New Bucket"** → Name it `invoices` → Check **"Public bucket"** → Save.

### 5. Obtain Project API Keys
1. Go to **Project Settings** → **API**.
2. Copy:
   - **Project URL**: `https://xxxxxxxxxxxx.supabase.co`
   - **Anon / Public Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

---

## 3. Step 2: Environment Variables Configuration

In your project root (or within your hosting provider's dashboard), set the following environment variables:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your-key-here
VITE_APP_NAME="MADURA HOUSE MAINTENANCE MGMT V0.1"
```

---

## 4. Step 3: Web Deployment Options

### Option A: Deploy to Vercel (Recommended - 2 Minutes)

Vercel provides native Vite support, edge network performance, and automatic SSL.

1. Push your project to GitHub or GitLab.
2. Go to [https://vercel.com](https://vercel.com) and click **"Add New"** → **"Project"**.
3. Import your `HOUSE MAINTENEANCE MGMT` repository.
4. Framework Preset will auto-detect as **Vite**.
5. Under **Environment Variables**, add:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
6. Click **"Deploy"**.

Your application will be live at `https://your-project.vercel.app` with configured SPA routing rules (`vercel.json`).

---

### Option B: Deploy to Netlify

1. Push your project to GitHub.
2. Go to [https://netlify.com](https://netlify.com) and click **"Add new site"** → **"Import an existing project"**.
3. Build Settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
4. Under **Site configuration** → **Environment variables**, add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
5. Click **"Deploy Site"**.

The pre-configured [`netlify.toml`](file:///s:/vs%20code/HOUSE%20MAINTENEANCE%20MGMT/netlify.toml) ensures asset caching and SPA 200 redirect rules.

---

### Option C: Deploy to Google Cloud Run (Docker)

For enterprise containerized hosting on Google Cloud Platform:

```bash
# 1. Authenticate with Google Cloud
gcloud auth login
gcloud config set project YOUR_GCP_PROJECT_ID

# 2. Build and push container to Google Artifact Registry
gcloud builds submit --tag gcr.io/YOUR_GCP_PROJECT_ID/madura-house-mgmt:v1 .

# 3. Deploy to Cloud Run with HTTPS and Autoscaling
gcloud run deploy madura-house-mgmt \
  --image gcr.io/YOUR_GCP_PROJECT_ID/madura-house-mgmt:v1 \
  --platform managed \
  --region asia-south1 \
  --allow-unauthenticated \
  --set-env-vars VITE_SUPABASE_URL="https://your-project.supabase.co",VITE_SUPABASE_ANON_KEY="your-anon-key"
```

---

## 5. Step 4: Verification & Live Health Check

1. Open your deployed URL (e.g., `https://madurahouse.vercel.app`).
2. Verify that the landing page renders with title **`MADURA HOUSE MAINTENANCE MGMT V0.1`**.
3. Log in with the pre-seeded credentials:
   - **House Owner**: `sampathkumar@chemadur.com` / `Sampath@123`
   - **Admin Tenant**: `admin.tenant@madurahouse.local` / `Admin@123`
4. Test adding an expense line item to verify real-time split calculation across units.
5. Test uploading an invoice PDF and verifying the preview popup.
