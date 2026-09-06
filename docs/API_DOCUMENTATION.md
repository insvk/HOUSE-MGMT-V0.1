# Madura House Maintenance Management Platform - API Documentation

**Product:** Madura House Maintenance  
**Base Path:** `/api/v1`

---

## 🔐 Authentication & Headers

```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
X-House-ID: madura-house-uuid
```

---

## 🔗 Endpoint Reference Summary

### 1. User & Tenant Endpoints
- `POST /auth/login` - User authentication (Email/Password or OTP)
- `GET /tenants` - List active tenants for Madura House
- `POST /tenants` - Add new tenant (Owner only)
- `PUT /tenants/:id` - Update tenant details
- `DELETE /tenants/:id` - Soft-delete tenant (Mark inactive/evicted)

### 2. Maintenance & Expense Endpoints
- `GET /maintenance` - Retrieve monthly maintenance headers
- `POST /maintenance` - Create new monthly record
- `POST /expenses` - Add line-item expense (Auto-calculates grand total & tenant share)
- `DELETE /expenses/:id` - Delete line-item expense

### 3. Invoices & OCR Endpoints
- `POST /invoices/upload` - Upload PDF/image invoice
- `GET /invoices/:id/ocr` - Run OCR extraction on invoice image

### 4. Notifications & Exports
- `POST /notifications/send` - Trigger Resend email to active tenants
- `GET /notifications/history` - Retrieve sent notification logs
- `POST /export/pdf` - Generate PDF report for monthly maintenance

---

## 📝 Example Payload: Add Expense

**`POST /api/v1/expenses`**
```json
{
  "maintenance_record_id": "mr-sep-2026-uuid",
  "particular": "Water Meter & Pump Repairs",
  "amount": 2500.00,
  "category": "repairs",
  "gst_applicable": true,
  "gst_amount": 450.00,
  "notes": "Emergency pump capacitor replacement"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "expense": {
    "id": "exp-102",
    "particular": "Water Meter & Pump Repairs",
    "total_amount": 2950.00,
    "added_by": "sampathkumar@chemadur.com"
  },
  "updated_maintenance": {
    "grand_total": 8450.00,
    "active_tenants": 6,
    "individual_contribution": 1408.33
  }
}
```

---

**API Documentation Version:** 1.0  
**Product:** Madura House Maintenance Management Platform
