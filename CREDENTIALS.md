# 🔐 Madura House Maintenance Management System
## Official Credentials & Access Specification Document

> **CONFIDENTIAL** — For Authorized Management & Operational Personnel Only.  
> **Word Document Available**: [`Madura_House_System_Credentials.docx`](file:///s:/vs%20code/HOUSE%20MAINTENEANCE%20MGMT/Madura_House_System_Credentials.docx)

---

### 🏢 1. System Overview & Metadata

| Parameter | Details |
|---|---|
| **Platform Name** | Madura House Maintenance Management (`V0.1`) |
| **Property Address** | No. 42, Bypass Road, Ellis Nagar, Maduravoyal, Tamil Nadu - 625001 |
| **Total Managed Units** | 5 Units (`GF`, `F01 - FRONT`, `F01 - BACK`, `F02 - FRONT`, `F02 - BACK`) |
| **Local Access URL** | [http://localhost:5173](http://localhost:5173) |
| **GitHub Repository** | [https://github.com/insvk/HOUSE-MGMT-V0.1](https://github.com/insvk/HOUSE-MGMT-V0.1) (`main` branch) |
| **Cloud Database** | Supabase Managed Cloud PostgreSQL |

---

### 👑 2. Property Owner Account (Superadmin)

The Property Owner has unrestricted authority over all financial ledgers, tenant rosters, system parameters, data exports, and backups.

| Field | Credentials / Value |
|---|---|
| **Full Name** | Sampath Kumar |
| **Email Address** | `sampathkumar@chemadur.com` |
| **Password** | `Sampath@123` |
| **Role** | `OWNER` (Primary Administrative Authority) |
| **Flat / Unit** | `Owner Suite` |
| **Contact Phone** | `+91 98421 00000` |
| **Emergency Contact** | `+91 98421 99999` |
| **Permissions** | • Full read/write access to monthly expense ledgers<br>• Add, edit, and delete maintenance expense items<br>• Add, edit, and archive tenant profiles<br>• Update profile photos (PFP) for self and all residents<br>• Promote/demote tenants to `ADMIN_TENANT`<br>• Generate and download official PDF & Excel reports<br>• Trigger Cloud DB sync & export/restore encrypted JSON backups<br>• Review security audit trails |

---

### 🛡️ 3. Admin Tenant Account (Onsite Property Co-Admin)

The Admin Tenant assists with day-to-day coordination with contractors, electricians, and plumbers, as well as tracking resident payments.

| Field | Credentials / Value |
|---|---|
| **Full Name** | Rajesh Kumar |
| **Email Address** | `admin.tenant@madurahouse.local` |
| **Password** | `Admin@123` |
| **Role** | `ADMIN_TENANT` (Operations & Coordination) |
| **Flat / Unit** | `F01 - FRONT` |
| **Monthly Rent** | ₹14,000 / month |
| **Security Deposit** | ₹70,000 |
| **Contact Phone** | `+91 98421 11111` |
| **Emergency Contact** | `+91 98421 88888` |
| **Permissions** | • Log maintenance requests and record contractor receipts<br>• Coordinate utility repairs and enter maintenance costs<br>• Verify monthly tenant payment status<br>• Upload contractor invoices and payment proofs |

---

### 👥 4. Residential Occupants & Self-Registration

| Policy / Item | Specification |
|---|---|
| **Self-Registration** | Residents can register via portal login screen (`Create Account` tab) |
| **Default Assigned Role** | `TENANT` (Standard Resident Occupant) |
| **Password Requirement** | Minimum 6 alphanumeric characters |
| **Role Privileges** | Standard tenant without administrative rights |
| **Unit Assignment** | Must select one of the 5 standardized building units (`GF`, `F01 - FRONT`, `F01 - BACK`, `F02 - FRONT`, `F02 - BACK`) |
| **Profile Photo (PFP)** | Can upload custom photo, select from avatar presets, or generate initials |
| **Portal Access** | View monthly maintenance share, download payment receipts, view digital bills, track payment history |

---

### ☁️ 5. Cloud Database Infrastructure (Supabase)

| Variable | Value |
|---|---|
| **Engine** | PostgreSQL 15 (Supabase Cloud Hosted) |
| **`VITE_SUPABASE_URL`** | `https://kbvjnshgyuwkcvicwefh.supabase.co` |
| **`VITE_SUPABASE_ANON_KEY`** | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtidmpuc2hneXV3a2N2aWN3ZWZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg2NjQ0NTIsImV4cCI6MjEwNDI0MDQ1Mn0.ysi0SnVJfD5L2M_r2twp06oBRbMq7U-K8vRGcqU_XJg` |
| **Sync Model** | Dual-Tier (Encrypted Local Storage Vault + Live PostgreSQL DB) |
| **Status Indicator** | Live header telemetry badge (`Cloud DB Live` / `Local Vault`) |

---

### 📁 6. Document File Information

- **Word Document File Path**: [Madura_House_System_Credentials.docx](file:///s:/vs%20code/HOUSE%20MAINTENEANCE%20MGMT/Madura_House_System_Credentials.docx)
- **Format**: Microsoft Word Document (.docx / Office Open XML)
- **Location**: Project Root Directory (`s:\vs code\HOUSE MAINTENEANCE MGMT\`)
