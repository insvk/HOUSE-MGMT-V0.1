# 🏢 MADURA HOUSE MAINTENANCE MGMT V0.1

> **Enterprise-Grade Residential Maintenance, Expense Allocation & Tenant CRM Platform**  
> Designed with Velzon Enterprise aesthetics, dual-engine data storage (Cloud PostgreSQL + Offline Local Vault), interactive command palette, and official document generation engines.

---

## 🌟 Key Enterprise Features

- **📊 Dynamic Expense Management & Fair Share Allocation**:
  - Itemized tracking of maintenance, utilities (EB, Water), repair, and cleaning expenses.
  - Automatic, live per-flat mathematical division across active occupancy units.
  - Zero hardcoded placeholder figures; 100% computed from active records.

- **📄 Official Document Generation Engines**:
  - **Excel Statement (.xlsx)**: Formatted workbook with property headers, line-item details, auto-adjusted columns, and audit summaries powered by SheetJS.
  - **Audited PDF Statement (.pdf)**: High-resolution vector PDF with branded navy & teal header bars, metric cards, zebra-striped tables, payment terms, and official verification seal powered by jsPDF & autoTable.
  - **Tenant Directory & Lease Ledger (.xlsx & .pdf)**: Instant export of resident contacts, lease terms, and security deposit ledgers.

- **⚡ Global Command Palette (`Ctrl+K` / `Cmd+K`)**:
  - Keyboard-driven omni-search across residents, flat numbers, expenses, categories, and actions.
  - Instant navigation shortcuts and one-click operational commands.

- **🔐 Dual-Engine Data Architecture (Cloud + Offline Vault)**:
  - **Live Cloud Database Mode**: Deep integration with Supabase / PostgreSQL including Row-Level Security (RLS) policies.
  - **Encrypted Local Vault**: Resilient browser-side persistence and offline operation when network drops.
  - **Live Sync Status**: Real-time connection badge with latency telemetry and manual sync triggers.

- **🛡️ Security & Enterprise Compliance**:
  - Role-based privilege matrix (*House Owner*, *Admin Tenant*, *Regular Resident*).
  - Secure resident sign-up with default `TENANT` role assignment and validation.
  - Immutable Security Audit Trail with action filtering and CSV compliance exports.
  - React Error Boundary for isolated error handling and diagnostic telemetry.

- **📱 Progressive Web App (PWA) & Audio Engine**:
  - Native SVG vector favicon, web app manifest, and mobile home-screen installability.
  - Synthesized Web Audio API chimes for tactile user feedback (toggleable in Settings).
  - One-click formatted WhatsApp maintenance notice generator for resident groups.

---

## 🚀 Quick Start (Local Development)

### 1. Prerequisites
- **Node.js** v18+ and **npm**

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/insvk/HOUSE-MGMT-V0.1.git
cd HOUSE-MGMT-V0.1

# Install dependencies
npm install

# Start Vite Development Server
npm run dev
```

The application will start on `http://localhost:5173`.

---

## 🔑 Pre-Seeded Default Accounts

| Role | Email | Password | Access Scope |
|---|---|---|---|
| **House Owner** (Super Admin) | `sampathkumar@chemadur.com` | `Sampath@123` | Full administrative control, settings & financial ledger |
| **Admin Tenant** | `admin.tenant@madurahouse.local` | `Admin@123` | Expense additions, bill uploads & resident notifications |

---

## 📦 Production Build & Deployment

```bash
# Verify TypeScript & compile production bundle
npm run build

# Preview production build locally
npm run preview
```

### Supported Cloud Hosting:
- **Vercel**: Edge network with automatic rewrites via [`vercel.json`](./vercel.json).
- **Netlify**: Pre-configured via [`netlify.toml`](./netlify.toml).
- **Docker / Cloud Run**: Multi-stage Nginx container via [`Dockerfile`](./Dockerfile) & [`nginx.conf`](./nginx.conf).

For step-by-step database setup and cloud deployment instructions, consult the [Deployment Guide](./docs/DEPLOYMENT_GUIDE_CLOUD_DB.md).

---

## 📄 License
Internal Property Management Platform • Madura House, Bypass Road, Ellis Nagar, Madurai - 625001.
