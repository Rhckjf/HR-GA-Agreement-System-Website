# QUICK REFERENCE TABLES

## Tabel-tabel penting yang bisa langsung di-copy ke Word Form 4

---

## 1. ROLE COMPARISON TABLE

| Aspek | Staff (Department User) | Admin |
|-------|------------------------|-------|
| **Access Level** | Own department only | Full system (all departments) |
| **Create Agreement** | ✅ Yes | ❌ No |
| **Edit Agreement** | ✅ Yes (own dept, pending only) | ❌ No |
| **Delete Agreement** | ✅ Yes (own dept, pending only) | ❌ No |
| **View Agreements** | ✅ Own department + created agreements | ✅ All departments |
| **Approve/Reject** | ❌ No | ✅ Yes |
| **Manage Vendors** | ❌ No | ✅ Yes |
| **Manage Users** | ❌ No | ✅ Yes |
| **Configure Dept Settings** | ❌ No | ✅ Yes |
| **Export Reports** | ❌ No | ✅ Yes |

---

## 2. APPROVAL WORKFLOW TABLE

| Step | Actor | Action | Result |
|------|-------|--------|--------|
| 1 | Staff | Create agreement | Status: **pending** |
| 2 | Admin | Review agreement | View details & document |
| 3a | Admin | Approve | Status: **approved** + Clone to HR dept + Notification sent |
| 3b | Admin | Reject | Status: **rejected** + Reason recorded + Notification sent |
| 4 | Staff | View notification | See approval/rejection result |

---

## 3. AGREEMENT STATUS TABLE

| Status | Condition | Color Badge | Description |
|--------|-----------|-------------|-------------|
| **active** | Expiry date > 30 days | 🟢 Green | Agreement is currently active |
| **expiring_soon** | Expiry date ≤ 30 days | 🟡 Yellow | Agreement expiring within 30 days |
| **expired** | Expiry date < today | 🔴 Red | Agreement has expired |

---

## 4. APPROVAL STATUS TABLE

| Approval Status | Description | Who Can See | Actions Available |
|----------------|-------------|-------------|-------------------|
| **pending** | Waiting for Admin approval | Staff (creator), Admin | Staff: Edit, Delete<br>Admin: Approve, Reject |
| **approved** | Approved by Admin | Staff (creator), Admin, HR | All: View only |
| **rejected** | Rejected by Admin | Staff (creator), Admin | Staff: View, Edit (resubmit) |

---

## 5. NOTIFICATION TYPES TABLE

| Type | Trigger | Recipient | Message Example |
|------|---------|-----------|-----------------|
| **approval** | Admin approves agreement | Agreement creator (Staff) | "Agreement '[Title]' was approved and a copy was sent to HR." |
| **rejection** | Admin rejects agreement | Agreement creator (Staff) | "Agreement '[Title]' was rejected: [Reason]" |
| **expiry_warning** | Agreement created with expiry ≤ 30 days | Agreement creator (Staff) | "Agreement '[Title]' is expiring soon (Expiry Date: [Date])." |
| **expired** | Agreement expiry date passed | Dept staff + Admin (via email) | "Agreement '[Title]' has expired! (Expiry Date: [Date])." |

---

## 6. EMAIL NOTIFICATION SCHEDULE TABLE

| Milestone | Days Before Expiry | Email Sent | Flag Set |
|-----------|-------------------|------------|----------|
| 3 Months | ≤ 90 days | ✅ Yes | notified_3m = true |
| 2 Months | ≤ 60 days | ✅ Yes | notified_2m = true |
| 1 Month | ≤ 30 days | ✅ Yes | notified_1m = true |
| Expired | ≤ 0 days (past) | ✅ Yes | notified_expired = true |

**Schedule:** Daily at **01:00 AM**  
**Format:** Consolidated digest per department (one email with all agreements)

---

## 7. DATABASE COLLECTIONS TABLE

| Collection | Key Fields | Description |
|-----------|-----------|-------------|
| **users** | id, email, password_hash, name, role (staff/admin), department, created_at | User accounts with role-based access |
| **vendors** | id, name, type (barang/jasa/customer/vendor/forwarder/mitra), contact_person, email, phone, address | External parties master data |
| **agreements** | id, title, vendor_id, vendor_name, category, department, origin_department, start_date, expiry_date, cycle_year, description, file_path, status, approval_status, approved_by, approved_at, rejection_reason, notified_3m, notified_2m, notified_1m, notified_expired, created_by, created_at, updated_at | Core agreement data with approval tracking |
| **notifications** | id, user_id, agreement_id, agreement_title, message, type, is_read, created_at | In-system notifications |
| **departmentsettings** | id, department, emails (array), created_at, updated_at | Email recipients per department |

---

## 8. SECURITY FEATURES TABLE

| Security Feature | Library / Method | Implementation Detail |
|-----------------|------------------|----------------------|
| **NoSQL Injection Prevention** | express-mongo-sanitize | Sanitizes req.body, req.query, req.params — removes MongoDB operators $ and . |
| **HTTP Security Hardening** | Helmet.js | Secures HTTP headers: X-Frame-Options, Content-Security-Policy, X-Content-Type-Options, etc. |
| **Strict CORS Policy** | cors middleware | Only allows requests from FRONTEND_URL defined in .env |
| **Secure File Upload** | Multer | Only PDF, DOC, DOCX accepted; max 10 MB; stored in protected /uploads directory |
| **Protected File Access** | JWT authMiddleware | Files served only via authenticated API endpoints (not publicly accessible) |
| **Password Security** | bcrypt | Passwords hashed with salt rounds: 10 before storage |
| **JWT Authentication** | jsonwebtoken | Token contains user ID, role, department; secret stored in .env |

---

## 9. FILE UPLOAD VALIDATION TABLE

| Validation | Rule | Error Message |
|-----------|------|---------------|
| **File Format** | Only PDF, DOC, DOCX | "Only PDF, DOC, DOCX allowed" |
| **File Size** | Max 10 MB | "File size exceeds 10 MB limit" |
| **File Required** | Must upload file | "No file uploaded" |
| **File Path Security** | Path traversal prevention | Uses path.basename() to prevent ../ attacks |

---

## 10. FRONTEND ROUTES TABLE

| Route | Page Name | Accessible By | Description |
|-------|-----------|---------------|-------------|
| `/login` | Login Page | All (public) | Email and password authentication |
| `/admin` | Admin Dashboard | Admin only | Company-wide statistics and charts |
| `/department/:dept` | Department Dashboard | Staff (own dept) | Department-specific summary |
| `/agreements` | Agreement List | All (filtered by role) | Searchable, filterable agreement table |
| `/agreements/new` | Create Agreement | Staff only | Multi-field form to create new agreement |
| `/agreements/edit/:id` | Edit Agreement | Staff (own dept) | Edit existing agreement (pending only) |
| `/agreements/:id` | Agreement Detail | All (with access control) | Full agreement details with actions |
| `/vendors` | Vendors Management | Admin only | Manage vendors, customers, forwarders |
| `/admin/users` | User Management | Admin only | Add, edit, deactivate users |
| `/admin/departments` | Department Settings | Admin only | Configure email recipients per department |

---

## 11. ALLOWED DEPARTMENTS TABLE

| No. | Department Name | Code |
|-----|----------------|------|
| 1 | Purchasing | Purchasing |
| 2 | Sales | Sales |
| 3 | PPIC | PPIC |
| 4 | Engineering | Engineering |
| 5 | Accounting | Accounting |
| 6 | Quality | Quality |
| 7 | Produksi | Produksi |
| 8 | HR | HR |

---

## 12. VENDOR TYPES TABLE

| No. | Type | Description | Example |
|-----|------|-------------|---------|
| 1 | barang | Supplier of goods | PT. Supplier Material |
| 2 | jasa | Service provider | PT. Cleaning Service |
| 3 | customer | Customer/client | PT. Customer ABC |
| 4 | vendor | General vendor | PT. Vendor XYZ |
| 5 | forwarder | Logistics/shipping | PT. Forwarder Logistik |
| 6 | mitra | Business partner | PT. Mitra Bisnis |

---

## 13. AGREEMENT CATEGORIES TABLE

| No. | Category | Description |
|-----|----------|-------------|
| 1 | Service Agreement | Agreement for services |
| 2 | Vendor Contract | Contract with vendors |
| 3 | NDA | Non-Disclosure Agreement |
| 4 | Partnership | Partnership agreement |
| 5 | Lease Agreement | Rental/lease agreement |
| 6 | Other | Other types of agreements |

---

## 14. TECHNOLOGY STACK TABLE

| Layer | Technology | Version | License |
|-------|-----------|---------|---------|
| **Frontend** | React.js | 19.0.0 | MIT |
| **Frontend Router** | React Router | 7.5.1 | MIT |
| **Frontend UI** | shadcn/ui + Tailwind CSS | Latest | MIT |
| **Backend** | Node.js | 18+ | MIT |
| **Backend Framework** | Express.js | 4.18.2 | MIT |
| **Database** | MongoDB | 6.0+ | SSPL |
| **ODM** | Mongoose | 8.0.3 | MIT |
| **Authentication** | JWT + bcryptjs | Latest | MIT |
| **File Upload** | Multer | 1.4.5 | MIT |
| **Security** | Helmet.js | 8.1.0 | MIT |
| **Security** | express-mongo-sanitize | 2.2.0 | MIT |
| **Email** | Nodemailer | 8.0.5 | MIT |
| **Cron Jobs** | node-cron | 4.2.1 | ISC |

---

## 15. BROWSER COMPATIBILITY TABLE

| Browser | Minimum Version | Status | Notes |
|---------|----------------|--------|-------|
| Google Chrome | v100+ | ✅ Fully Supported | Recommended |
| Microsoft Edge | v100+ | ✅ Fully Supported | Recommended |
| Mozilla Firefox | v100+ | ✅ Fully Supported | Recommended |
| Safari | v15+ | ⚠️ Supported | Some UI differences |
| Internet Explorer | Any | ❌ Not Supported | Use modern browser |

---

## 16. SYSTEM REQUIREMENTS TABLE (End-User)

| Requirement | Specification |
|-------------|--------------|
| **Device** | Any company laptop or desktop (Windows 10/11, macOS, Linux) |
| **Processor** | Intel Core i3 or equivalent (minimum) |
| **RAM** | 4 GB (minimum), 8 GB (recommended) |
| **Storage** | No local storage required (web-based) |
| **Web Browser** | Chrome v100+, Edge v100+, Firefox v100+ |
| **Network** | Company intranet (LAN) or VPN |
| **Screen Resolution** | 1280 x 720 (minimum), 1920 x 1080 (recommended) |
| **Internet Speed** | 1 Mbps (minimum) |
| **Account** | User account created by Admin |

---

## 17. HARDWARE SPECIFICATIONS TABLE (Development)

| Component | Specification | Quantity | Purpose |
|-----------|--------------|----------|---------|
| **Developer Laptop** | Intel Core i5/i7, 8-16 GB RAM, 256+ GB SSD | 3 units | Development, coding, testing |
| **Application Server** | 4 vCPU, 8 GB RAM, 100 GB SSD, Ubuntu 22.04 LTS | 1 unit | Host backend, frontend, database |
| **Network** | 100 Mbps LAN/intranet | 1 unit | Internal network access |

---

## 18. API ENDPOINTS TABLE (Sample)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | No | Register new user |
| POST | `/api/auth/login` | No | Login and get JWT token |
| GET | `/api/auth/me` | Yes | Get current user profile |
| GET | `/api/agreements` | Yes | Get all agreements (filtered by role) |
| GET | `/api/agreements/:id` | Yes | Get single agreement detail |
| POST | `/api/agreements` | Yes | Create new agreement (Staff only) |
| PUT | `/api/agreements/:id` | Yes | Update agreement (Staff only) |
| DELETE | `/api/agreements/:id` | Yes | Delete agreement (Staff only) |
| PUT | `/api/agreements/:id/approve` | Yes | Approve agreement (Admin only) |
| PUT | `/api/agreements/:id/reject` | Yes | Reject agreement (Admin only) |
| POST | `/api/agreements/:id/upload` | Yes | Upload agreement file |
| GET | `/api/agreements/:id/download` | Yes | Download agreement file |
| GET | `/api/vendors` | Yes | Get all vendors |
| POST | `/api/vendors` | Yes | Create vendor (Admin only) |
| GET | `/api/admin/users` | Yes | Get all users (Admin only) |
| POST | `/api/admin/users` | Yes | Create user (Admin only) |

---

## 19. TESTING SUMMARY TABLE

| Module | Total Tests | Passed | Failed | Pass Rate |
|--------|------------|--------|--------|-----------|
| Login System | 7 | 7 | 0 | 100% |
| Dashboard Monitoring | 5 | 5 | 0 | 100% |
| Agreement Management - Create | 12 | 12 | 0 | 100% |
| Agreement Management - Read & Search | 11 | 11 | 0 | 100% |
| Agreement Management - Update & Delete | 7 | 7 | 0 | 100% |
| Approval Process - Admin | 7 | 7 | 0 | 100% |
| Notification System | 10 | 10 | 0 | 100% |
| File Upload & Download | 8 | 8 | 0 | 100% |
| Vendor Management | 7 | 7 | 0 | 100% |
| User Management | 8 | 8 | 0 | 100% |
| Department Settings | 5 | 5 | 0 | 100% |
| Security Features | 8 | 8 | 0 | 100% |
| **TOTAL** | **95** | **95** | **0** | **100%** |

---

## 20. COST SUMMARY TABLE

| Category | Cost (IDR) |
|----------|-----------|
| Hardware & Infrastructure | 33,750,000 |
| Software & Development Tools | 0 (all open-source) |
| Optional (Production) | 0 - 15,600,000 |
| **TOTAL MINIMUM** | **33,750,000** |
| **TOTAL MAXIMUM** | **49,350,000** |

---

**Cara Menggunakan:**
1. Copy tabel yang dibutuhkan
2. Paste ke Word
3. Format sesuai style guide Form 4
4. Update data jika ada perubahan

**Note:** Semua tabel sudah disesuaikan dengan implementasi aktual project Anda.
