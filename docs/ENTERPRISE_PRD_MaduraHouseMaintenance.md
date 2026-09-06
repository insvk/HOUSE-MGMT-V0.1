# ENTERPRISE PRODUCT REQUIREMENTS DOCUMENT
## Madura House Maintenance Management Platform (HMMP)
### Next-Generation Cloud-Native Property Lifecycle Management System

**Official Product Name:** Madura House Maintenance  
**Document Version:** 1.0  
**Last Updated:** September 2026  
**Classification:** Enterprise  
**Status:** Ready for Development / Production

---

## 📋 EXECUTIVE SUMMARY

The **Madura House Maintenance Management Platform (HMMP)** is an enterprise-grade, cloud-native platform designed to manage property lifecycle operations, monthly maintenance tracking, expense distribution, invoice archiving, and tenant communications for **Madura House**.

**Key Highlights:**
- Zero-cost deployment using free-tier cloud infrastructure (Supabase, Vercel, Resend, GitHub).
- Dark-mode glassmorphic UI design system engineered for visual excellence.
- Multi-role access control (House Owner, Admin Tenant, Regular Tenant).
- Automated expense distribution calculating exact per-tenant contributions.
- Integrated invoice storage with OCR bill parsing capabilities.

---

## 🎯 BUSINESS OBJECTIVES

1. **Automate Expense Tracking:** Record monthly line items for Madura House and auto-calculate tenant shares.
2. **Financial Transparency:** Real-time visibility into property maintenance expenses, category breakdowns, and audit trails.
3. **Streamlined Notifications:** Instant transactional email alerts to active tenants upon monthly record creation.
4. **Audit Compliance:** Immutable audit logs recording all data mutations and administrator actions.

---

## 🏗️ SYSTEM ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────┐
│             MADURA HOUSE PRESENTATION LAYER                 │
├──────────────────────┬──────────────────────┬────────────────┤
│   Web Client         │  Desktop Client      │  Mobile Web    │
│   (React / Next.js)  │  (Electron)          │  (PWA/Mobile)  │
└──────────────────────┴──────────────────────┴────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────┐
│                 API & MIDDLEWARE LAYER                      │
├─────────────────────────────────────────────────────────────┤
│  - Authentication (JWT + Supabase Auth)                      │
│  - Maintenance & Expense Calculations                       │
│  - Resend Email Service Trigger                             │
│  - Analytics & Audit Logging                                │
└─────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────┐
│           BACKEND SERVICES (Supabase Ecosystem)             │
├──────────────────────┬──────────────────────┬────────────────┤
│  PostgreSQL DB       │  Supabase Auth       │  Storage       │
│  - 9 Schema Tables   │  - User Sessions     │  - Invoices    │
│  - RLS Policies      │  - Role Validation   │  - Exports     │
└──────────────────────┴──────────────────────┴────────────────┘
```

---

## 📊 DATA MODEL & SCHEMA

### Tables Overview
1. `users`: Identity management (`email`, `full_name`, `phone`, `flat_number`, `occupancy_status`).
2. `roles`: Role mapping (`OWNER`, `ADMIN_TENANT`, `TENANT`).
3. `houses`: Property master table ("Madura House").
4. `maintenance_records`: Monthly maintenance header (`month`, `year`, `grand_total`, `individual_contribution`).
5. `expenses`: Line item details (`particular`, `amount`, `category`, `gst_applicable`, `gst_amount`).
6. `invoices`: Document records linked to expenses (`file_name`, `storage_path`, `ocr_data`).
7. `notifications`: Sent notification logs.
8. `audit_logs`: Immutable security audit trail.
9. `analytics_cache`: Cached aggregated metrics.

---

## 🔐 SECURITY ARCHITECTURE & RLS

```sql
-- Security Policy Example: House Members View Expenses
CREATE POLICY "madura_house_expenses_read" ON expenses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM maintenance_records mr
      JOIN houses h ON mr.house_id = h.id
      JOIN roles r ON h.id = r.house_id
      WHERE mr.id = maintenance_record_id 
      AND r.user_id = auth.uid()
    )
  );
```

---

## 🎨 UI/UX DESIGN SYSTEM

- **Theme:** Dark Mode First (`#0b0f19` canvas, `#111827` surface cards).
- **Glassmorphism:** `backdrop-filter: blur(12px)` with subtle border highlights (`rgba(255, 255, 255, 0.08)`).
- **Primary Color:** Indigo (`#6366f1`) with Emerald accents (`#10b981`) for success/paid states.
- **Typography:** Inter sans-serif font family.

---

## 👥 USER ROLES & DEFAULT CREDENTIALS

- **House Owner:** `sampathkumar@chemadur.com` (Full Admin Privileges)
- **Admin Tenant:** `admin.tenant@madurahouse.local` (Expense Entry & Invoices)
- **Regular Tenant:** `tenant@madurahouse.local` (Read-only View & Downloads)

---

**Product Requirements Document Version:** 1.0  
**Product:** Madura House Maintenance Management Platform
