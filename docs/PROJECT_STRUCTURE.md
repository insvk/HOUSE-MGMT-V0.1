# Madura House Maintenance Management Platform - Project Structure

**Product:** Madura House Maintenance  
**Architecture:** Monorepo / React Web + Desktop + Supabase Backend

---

## 📁 Complete Directory Tree

```
house-maintenance-platform/
├── docs/                                # Documentation Package
│   ├── 00_START_HERE.md
│   ├── DELIVERABLES_SUMMARY.md
│   ├── ENTERPRISE_PRD_MaduraHouseMaintenance.md
│   ├── PROJECT_STRUCTURE.md
│   ├── SETUP_AND_DEPLOYMENT_GUIDE.md
│   └── API_DOCUMENTATION.md
│
├── database/                            # Database DDL & Seed Scripts
│   ├── schema.sql                       # Full PostgreSQL schema with 9 tables & RLS
│   └── seed-data.sql                    # Initial seed data for Madura House
│
├── supabase/                            # Backend Configurations
│   └── migrations/
│       └── 001_init.sql                 # Migration script
│
├── src/                                 # Web Application Source
│   ├── components/                      # UI Components
│   │   ├── Dashboard.tsx                # Main overview dashboard
│   │   ├── MaintenanceModule.tsx        # Monthly maintenance & expense entry
│   │   ├── TenantDirectory.tsx          # Multi-role tenant management
│   │   ├── AnalyticsDashboard.tsx       # Recharts analytics visualizations
│   │   ├── InvoiceGallery.tsx           # Invoice upload & OCR preview
│   │   ├── NotificationCenter.tsx       # Resend email triggers & delivery log
│   │   ├── AuditLogViewer.tsx           # Security audit trail viewer
│   │   └── SettingsModal.tsx            # User settings & property config
│   │
│   ├── types/                           # TypeScript Types
│   │   └── index.ts                     # Core interfaces (User, Expense, Record, Invoice)
│   │
│   ├── data/                            # Mock Data Store
│   │   └── initialData.ts               # Default seed state for Madura House
│   │
│   ├── App.tsx                          # Main application layout & role switcher
│   ├── index.css                        # Design system & dark glassmorphic styling
│   └── main.tsx                         # Entry point
│
├── index.html                           # Root HTML
├── package.json                         # Dependencies & npm scripts
├── vite.config.ts                       # Vite configuration
├── tailwind.config.js                   # Tailwind styling tokens
├── postcss.config.js                    # PostCSS configuration
├── tsconfig.json                        # TypeScript configuration
└── README.md                            # Master repository index
```

---

## 📄 Key File Specifications

- **`database/schema.sql`**: Full PostgreSQL DDL defining `users`, `roles`, `houses`, `maintenance_records`, `expenses`, `invoices`, `notifications`, `audit_logs`, and `analytics_cache`. Includes Row-Level Security policies.
- **`src/App.tsx`**: Main application shell with tab navigation, role switcher (Owner `sampathkumar@chemadur.com`, Admin Tenant, Regular Tenant), and state handlers.
- **`src/components/MaintenanceModule.tsx`**: Interactive expense entry modal and auto-calculating monthly maintenance summary.
- **`src/components/AnalyticsDashboard.tsx`**: Visualized expense trends and category pie charts using Recharts.
