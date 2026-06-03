# Dokumentasi Fitur User Management

## 📋 Overview

Fitur User Management memungkinkan Admin untuk mengelola pengguna sistem HRGA, termasuk:
- ✅ Membuat user baru
- ✅ Mengedit informasi user
- ✅ Menghapus user
- ✅ Assign user ke department
- ✅ Set role user (Admin/Staff)

---

## 🎯 Fitur yang Telah Ditambahkan

### Backend (API)

#### 1. **Create User** 
**Endpoint:** `POST /api/admin/users`  
**Access:** Admin only

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@company.com",
  "password": "password123",
  "role": "staff",
  "department": "Purchasing"
}
```

**Response (Success):**
```json
{
  "message": "User created successfully",
  "user": {
    "id": "uuid-generated",
    "email": "john@company.com",
    "name": "John Doe",
    "role": "staff",
    "department": "Purchasing",
    "created_at": "2026-06-03T10:00:00.000Z"
  }
}
```

**Validasi:**
- Email dan name wajib diisi
- Email harus format valid
- Email tidak boleh duplikat
- Password minimal 6 karakter
- Role harus "staff" atau "admin"
- Department harus valid dari list yang ada

---

#### 2. **Update User**
**Endpoint:** `PUT /api/admin/users/:id`  
**Access:** Admin only

**Request Body:**
```json
{
  "name": "John Doe Updated",
  "email": "john.new@company.com",
  "password": "newpassword123",
  "role": "admin",
  "department": "Sales"
}
```

**Response (Success):**
```json
{
  "message": "User updated successfully",
  "user": {
    "id": "uuid",
    "email": "john.new@company.com",
    "name": "John Doe Updated",
    "role": "admin",
    "department": "Sales",
    "created_at": "2026-06-03T10:00:00.000Z"
  }
}
```

**Catatan:**
- Semua field optional (hanya update yang dikirim)
- Password optional (leave blank to keep current)
- Email baru akan dicek duplikasi

---

#### 3. **Get All Users** (Already exists, no changes)
**Endpoint:** `GET /api/admin/users`  
**Access:** Admin only

---

#### 4. **Delete User** (Already exists, no changes)
**Endpoint:** `DELETE /api/admin/users/:id`  
**Access:** Admin only

---

### Frontend (UI)

#### 1. **Button "Add New User"**
- Lokasi: Header di halaman User Management
- Warna: Teal (#134E4A) sesuai theme Admin
- Icon: Plus icon
- Action: Membuka dialog create user

#### 2. **Button "Edit User"** 
- Lokasi: Kolom Actions di setiap row user
- Icon: Edit icon (pensil)
- Warna: Blue on hover
- Action: Membuka dialog edit user dengan data pre-filled

#### 3. **Dialog Form Create/Edit User**

**Fields yang ada:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| **Full Name** | Text Input | Yes | Nama lengkap user |
| **Email** | Email Input | Yes | Email unik untuk login |
| **Password** | Password Input | Yes (create) / Optional (edit) | Min 6 karakter |
| **Role** | Select Dropdown | Yes | Staff atau Admin |
| **Department** | Select Dropdown | Optional | Assign ke department |

**Dialog Features:**
- ✅ Form validation
- ✅ Loading state saat submit
- ✅ Toast notification untuk success/error
- ✅ Auto-close setelah berhasil
- ✅ Cancel button untuk menutup

**Department Dropdown:**
- Menampilkan semua department dengan icon warna
- Option "No Department" untuk user yang tidak di-assign
- Visual: Color indicator untuk setiap department

---

## 🎨 UI/UX Design

### Colors & Theme
- Primary: `#134E4A` (Teal - Admin theme)
- Hover: `#0F766E` 
- Edit button: Blue (#3B82F6)
- Delete button: Red (#DC2626)

### Icons
- Add User: `Plus` icon
- Edit User: `Edit` (pencil) icon  
- Delete User: `Trash2` icon
- Name field: `UserCircle` icon
- Email field: `Mail` icon
- Password field: `Shield` icon
- Role field: `UserCog` icon
- Department field: `Building2` icon

---

## 🔒 Security & Validation

### Backend Validation
1. **Email validation**: Format regex check
2. **Password strength**: Minimum 6 characters
3. **Role validation**: Only "staff" or "admin"
4. **Department validation**: Must be in allowed departments list
5. **Duplicate check**: Email must be unique
6. **Auth check**: Only admin can access

### Frontend Validation
1. Required field validation
2. Email format validation
3. Password length check (min 6 chars)
4. Disable submit while processing
5. Confirm before delete

---

## 📝 Usage Guide

### Untuk Admin: Cara Membuat User Baru

1. **Login sebagai Admin**
   - Pastikan role Anda "admin"

2. **Navigasi ke User Management**
   - Dari Admin Dashboard, klik "Manage Users"
   - Atau langsung ke `/admin/users`

3. **Klik "Add New User"**
   - Button hijau di header kanan atas

4. **Isi Form:**
   - **Full Name**: Nama lengkap karyawan
   - **Email**: Email untuk login (harus unik)
   - **Password**: Password awal (min 6 karakter)
   - **Role**: 
     - Pilih "Staff" untuk user biasa
     - Pilih "Admin" untuk user dengan akses penuh
   - **Department**: 
     - Pilih department sesuai divisi karyawan
     - Atau biarkan "No Department" jika belum ditentukan

5. **Klik "Create User"**
   - Tunggu hingga muncul notifikasi success
   - User baru akan muncul di tabel

### Untuk Admin: Cara Edit User

1. **Cari user di tabel**
   - Gunakan search box jika perlu

2. **Klik icon Edit (pensil)** di kolom Actions

3. **Update informasi yang diperlukan:**
   - Semua field bisa diubah
   - Password: Biarkan kosong jika tidak ingin mengubah password
   - Password: Isi jika ingin reset password user

4. **Klik "Update User"**

### Untuk Admin: Cara Hapus User

1. **Klik icon Trash** di kolom Actions
2. **Confirm** di dialog konfirmasi
3. User akan dihapus permanent

**Catatan:** Anda tidak bisa menghapus akun Anda sendiri.

---

## 🔧 Technical Details

### File yang Dimodifikasi

#### Backend:
1. **`app/backend/src/controllers/adminController.js`**
   - Added `createUser()` function
   - Added `updateUser()` function
   - Added bcrypt import for password hashing

2. **`app/backend/src/routes/adminRoutes.js`**
   - Added POST `/users` route
   - Added PUT `/users/:id` route

#### Frontend:
3. **`app/frontend/src/pages/UserManagement.js`**
   - Added state management for dialog
   - Added form state for create/edit
   - Added `handleOpenDialog()` function
   - Added `handleCloseDialog()` function
   - Added `handleSubmit()` function
   - Added "Add New User" button
   - Added "Edit" button in each row
   - Added Dialog component with form
   - Added department dropdown with color indicators

---

## 🧪 Testing

### Test Cases

#### Create User
```bash
# Test 1: Create user dengan semua field
POST /api/admin/users
{
  "name": "Test User",
  "email": "test@company.com",
  "password": "test123",
  "role": "staff",
  "department": "Purchasing"
}
Expected: Status 201, user created

# Test 2: Create tanpa password
POST /api/admin/users
{
  "name": "Test User",
  "email": "test@company.com"
}
Expected: Status 400, "password required"

# Test 3: Email duplikat
POST /api/admin/users
{
  "name": "Test User",
  "email": "existing@company.com",
  "password": "test123"
}
Expected: Status 400, "Email already registered"

# Test 4: Password terlalu pendek
POST /api/admin/users
{
  "name": "Test User",
  "email": "test@company.com",
  "password": "12345"
}
Expected: Status 400, "Password must be at least 6 characters"

# Test 5: Invalid department
POST /api/admin/users
{
  "name": "Test User",
  "email": "test@company.com",
  "password": "test123",
  "department": "InvalidDept"
}
Expected: Status 400, "Invalid department"
```

#### Update User
```bash
# Test 1: Update name dan department
PUT /api/admin/users/:id
{
  "name": "Updated Name",
  "department": "Sales"
}
Expected: Status 200, user updated

# Test 2: Update password
PUT /api/admin/users/:id
{
  "password": "newpassword123"
}
Expected: Status 200, password changed

# Test 3: Update ke email yang sudah ada
PUT /api/admin/users/:id
{
  "email": "existing@company.com"
}
Expected: Status 400, "Email already registered"
```

---

## 🚀 Deployment Notes

Setelah fitur ini di-deploy, pastikan:

1. ✅ Database schema User sudah support field `department` (already exists)
2. ✅ Admin user sudah ada di database
3. ✅ ALLOWED_DEPARTMENTS sudah sesuai di `authController.js`
4. ✅ Frontend environment variable `REACT_APP_API_URL` sudah benar

### Migration (jika diperlukan)

Jika ada user lama yang belum punya department field:
```javascript
// MongoDB query untuk set department = null untuk user lama
db.users.updateMany(
  { department: { $exists: false } },
  { $set: { department: null } }
);
```

---

## 📊 API Response Examples

### Success Responses

**Create User Success:**
```json
{
  "message": "User created successfully",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "john@company.com",
    "name": "John Doe",
    "role": "staff",
    "department": "Purchasing",
    "created_at": "2026-06-03T10:30:00.000Z"
  }
}
```

**Update User Success:**
```json
{
  "message": "User updated successfully",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "john@company.com",
    "name": "John Doe Updated",
    "role": "admin",
    "department": "Sales",
    "created_at": "2026-06-03T10:30:00.000Z"
  }
}
```

### Error Responses

**Validation Error:**
```json
{
  "detail": "Email, password, and name are required"
}
```

**Duplicate Email:**
```json
{
  "detail": "Email already registered"
}
```

**Invalid Department:**
```json
{
  "detail": "Invalid department"
}
```

**User Not Found:**
```json
{
  "detail": "User not found"
}
```

---

## 📸 Screenshots Reference

### 1. User Management Page
- Header dengan button "Add New User"
- Search bar untuk filter
- Tabel dengan kolom: User, Email, Department, Role, Created, Actions
- Edit dan Delete button di setiap row

### 2. Create User Dialog
- Title: "Create New User"
- Form dengan 5 fields
- Department dropdown dengan color indicators
- Cancel dan Create User buttons

### 3. Edit User Dialog
- Title: "Edit User"
- Form dengan data pre-filled
- Password field optional
- Cancel dan Update User buttons

---

## 🎓 Department List

Departments yang tersedia untuk assign:

1. **Purchasing** - Blue (#2563EB)
2. **Sales** - Green (#059669)
3. **PPIC** - Violet (#7C3AED)
4. **Engineering** - Orange (#EA580C)
5. **Accounting** - Cyan (#0891B2)
6. **Quality** - Red (#DC2626)
7. **Produksi** - Yellow (#CA8A04)
8. **HR** - Pink (#DB2777)

**Catatan:** "Admin" tidak ada di dropdown karena admin punya akses ke semua department.

---

## 🔄 Future Enhancements

Fitur yang bisa ditambahkan di masa depan:

1. **Bulk User Import** - Upload CSV/Excel untuk create multiple users
2. **User Activity Log** - Track login history dan activities
3. **Email Verification** - Send verification email saat create user
4. **Password Reset** - Self-service password reset
5. **User Permissions** - Fine-grained permissions per feature
6. **Profile Picture** - Upload avatar untuk user
7. **Department Head** - Special role antara staff dan admin
8. **User Status** - Active/Inactive/Suspended status

---

## 📞 Support

Jika ada masalah atau pertanyaan:
1. Check logs di browser console (F12)
2. Check backend logs: `pm2 logs hrga-backend`
3. Verify JWT token valid
4. Pastikan role = "admin"

---

**Version:** 1.0  
**Last Updated:** 3 Juni 2026  
**Author:** Development Team
