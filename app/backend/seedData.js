/**
 * Seed Script - Data Dummy untuk HR & GA Agreement System
 * Jalankan dengan: node seedData.js
 *
 * Data yang di-seed:
 * - Vendor/Partner untuk semua department
 * - 5 Agreement per department:
 *   Purchasing, Sales, PPIC, Engineering, Accounting, Quality, Produksi, HR
 * - Total: 40 Agreements
 *
 * Distribusi Status (per dept):
 *   1 - expired       (expiry_date di masa lalu > 30 hari)
 *   1 - expiring_soon (expiry_date dalam 7-25 hari)
 *   1 - active        (expiry_date > 30 hari dari sekarang)
 *   1 - approved/active (di HR dept setelah approved)
 *   1 - pending approval (approval_status: pending)
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017';
const DB_NAME = process.env.DB_NAME || 'test_database';

// ─── INLINE MODELS ────────────────────────────────────────────────────────────

const vendorSchema = new mongoose.Schema({
    id: { type: String, default: uuidv4, unique: true },
    name: { type: String, required: true },
    type: { type: String, required: true, enum: ['barang', 'jasa', 'customer', 'vendor', 'forwarder'] },
    contact_person: { type: String, default: null },
    email: { type: String, default: null },
    phone: { type: String, default: null },
    address: { type: String, default: null },
    created_at: { type: String, default: () => new Date().toISOString() }
}, { versionKey: false });

const agreementSchema = new mongoose.Schema({
    id: { type: String, default: uuidv4, unique: true },
    title: { type: String, required: true },
    vendor_id: { type: String, required: true },
    vendor_name: { type: String, default: null },
    category: { type: String, required: true },
    start_date: { type: String, required: true },
    expiry_date: { type: String, required: true },
    cycle_year: { type: Number, default: null },
    description: { type: String, default: null },
    file_path: { type: String, default: null },
    status: { type: String, required: true },
    approval_status: { type: String, default: 'pending', enum: ['pending', 'approved', 'rejected'] },
    approved_by: { type: String, default: null },
    approved_at: { type: String, default: null },
    rejection_reason: { type: String, default: null },
    department: { type: String, default: null },
    origin_department: { type: String, default: null },
    created_by: { type: String, default: 'seed' },
    created_at: { type: String, default: () => new Date().toISOString() },
    updated_at: { type: String, default: () => new Date().toISOString() }
}, { versionKey: false });

const userSchema = new mongoose.Schema({
    id: { type: String, default: uuidv4, unique: true },
    email: { type: String, required: true, unique: true },
    password_hash: { type: String, required: true },
    name: { type: String, required: true },
    role: { type: String, default: 'staff', enum: ['staff', 'admin'] },
    department: { type: String, default: null },
    created_at: { type: String, default: () => new Date().toISOString() }
}, { versionKey: false });

const notificationSchema = new mongoose.Schema({
    id: { type: String, default: uuidv4, unique: true },
    user_id: { type: String, required: true },
    agreement_id: { type: String, required: true },
    agreement_title: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, required: true },
    is_read: { type: Boolean, default: false },
    created_at: { type: String, default: () => new Date().toISOString() }
}, { versionKey: false });

// Register models (handle "already compiled" when re-running)
const Vendor = mongoose.models.Vendor || mongoose.model('Vendor', vendorSchema);
const Agreement = mongoose.models.Agreement || mongoose.model('Agreement', agreementSchema);
const User = mongoose.models.User || mongoose.model('User', userSchema);
const Notification = mongoose.models.Notification || mongoose.model('Notification', notificationSchema);

// ─── DATE HELPERS ─────────────────────────────────────────────────────────────

const now = new Date();
const d = (offsetDays) => {
    const dt = new Date(now);
    dt.setDate(dt.getDate() + offsetDays);
    return dt.toISOString();
};
// "m" = months version
const m = (offsetMonths) => {
    const dt = new Date(now);
    dt.setMonth(dt.getMonth() + offsetMonths);
    return dt.toISOString();
};

// Status date mapping:
// expired      -> expiry in past   (d(-60) to d(-365))
// expiring_soon-> expiry d(7-25)   (d(7) to d(25))
// active       -> expiry > d(30)   (d(60) to d(365))

// ─── MASTER VENDOR DATA ───────────────────────────────────────────────────────

const allVendors = [
    // ── Purchasing – Suppliers / Vendors ──
    {
        name: 'PT Sumber Makmur Logistik',
        type: 'vendor',
        contact_person: 'Budi Santoso',
        email: 'budi@sumbermakmur.co.id',
        phone: '021-44556677',
        address: 'Jl. Raya Bogor KM 18, Ciracas, Jakarta Timur'
    },
    {
        name: 'CV Teknik Jaya Persada',
        type: 'vendor',
        contact_person: 'Hendra Wijaya',
        email: 'hendra@teknikjaya.com',
        phone: '022-78901234',
        address: 'Jl. Industri No. 23, Cimahi, Bandung'
    },
    {
        name: 'PT Prima Daya Elektrindo',
        type: 'vendor',
        contact_person: 'Siti Rahayu',
        email: 'siti@primadaya.co.id',
        phone: '031-55667788',
        address: 'SIER Blok B No. 12, Surabaya'
    },
    {
        name: 'PT Global Supply Asia',
        type: 'vendor',
        contact_person: 'Ahmad Fauzi',
        email: 'ahmad@globalsupply.id',
        phone: '021-77889900',
        address: 'Jl. Hayam Wuruk No. 35, Jakarta Barat'
    },
    {
        name: 'CV Karya Mitra Sentosa',
        type: 'vendor',
        contact_person: 'Dewi Lestari',
        email: 'dewi@karyamitra.co.id',
        phone: '0274-772233',
        address: 'Jl. Ring Road No. 55, Sleman, Yogyakarta'
    },

    // ── Sales – Customers ──
    {
        name: 'PT Mitra Utama Sejahtera',
        type: 'customer',
        contact_person: 'Rizky Aditya',
        email: 'contact@mitrautama.co.id',
        phone: '021-55012345',
        address: 'Jl. Gatot Subroto No. 12, Jakarta Selatan'
    },
    {
        name: 'CV Berkah Mandiri',
        type: 'customer',
        contact_person: 'Yanti Susilo',
        email: 'info@berkahmandiri.com',
        phone: '022-76543210',
        address: 'Jl. Soekarno Hatta No. 88, Bandung'
    },
    {
        name: 'PT Surya Abadi Teknik',
        type: 'customer',
        contact_person: 'Firmansyah',
        email: 'admin@suryaabadi.co.id',
        phone: '031-45678900',
        address: 'Rungkut Industri Blok A No. 5, Surabaya'
    },
    {
        name: 'PT Nusantara Makmur',
        type: 'customer',
        contact_person: 'Sri Wahyuni',
        email: 'sales@nusantaramakmur.com',
        phone: '0274-889900',
        address: 'Jl. Malioboro No. 45, Yogyakarta'
    },
    {
        name: 'PT Dinamika Karya Indonesia',
        type: 'customer',
        contact_person: 'Antonius Halim',
        email: 'hrd@dinamikakarya.co.id',
        phone: '021-66789012',
        address: 'Kawasan Industri MM2100, Bekasi'
    },

    // ── PPIC – Barang / Jasa / Forwarder ──
    {
        name: 'Bahan Baku Aluminium Plate – PT Aluma Indo',
        type: 'barang',
        contact_person: 'Eko Prasetyo',
        email: 'eko@alumaindo.co.id',
        phone: '021-33445566',
        address: 'Jl. Industri Besar III No. 7, Pulo Gadung, Jakarta'
    },
    {
        name: 'Komponen PCB Assembly – PT PCB Supply',
        type: 'barang',
        contact_person: 'Linda Kusuma',
        email: 'linda@pcbsupply.co.id',
        phone: '022-89012345',
        address: 'Jl. Raya Padalarang No. 120, Bandung Barat'
    },
    {
        name: 'PT Solusi Teknik Nusantara',
        type: 'jasa',
        contact_person: 'Doni Setiawan',
        email: 'doni@solusitek.co.id',
        phone: '021-88776655',
        address: 'Gedung Cyber 2, Jl. HR Rasuna Said, Jakarta Selatan'
    },
    {
        name: 'CV Jasa Kalibrasi Indonesia',
        type: 'jasa',
        contact_person: 'Farhan Maulana',
        email: 'farhan@jasakalibrasi.com',
        phone: '022-55443322',
        address: 'Jl. Asia Afrika No. 65, Bandung'
    },
    {
        name: 'PT Ekspres Logistik Indonesia',
        type: 'forwarder',
        contact_person: 'Bagas Wicaksono',
        email: 'bagas@ekspreslogistik.co.id',
        phone: '021-77665544',
        address: 'Jl. Raya Pluit No. 5, Penjaringan, Jakarta Utara'
    },

    // ── Engineering – Technical Service Partners ──
    {
        name: 'PT Mekanik Jaya Persada',
        type: 'jasa',
        contact_person: 'Gunawan Hakim',
        email: 'gunawan@mekanikindustrindo.co.id',
        phone: '021-88990011',
        address: 'Kawasan Industri Pulogadung, Jakarta Timur'
    },
    {
        name: 'CV Instalasi Prima Teknik',
        type: 'jasa',
        contact_person: 'Wahyu Pradipta',
        email: 'wahyu@instalasitekhnik.co.id',
        phone: '022-33441122',
        address: 'Jl. Moh. Toha No. 101, Bandung'
    },
    {
        name: 'PT Automasi Industri Utama',
        type: 'jasa',
        contact_person: 'Reza Arifin',
        email: 'reza@automasiindustri.co.id',
        phone: '031-77885522',
        address: 'Jl. Rungkut Industri II No. 20, Surabaya'
    },

    // ── Accounting – Finance / Audit Partners ──
    {
        name: 'KAP Soetanto & Rekan',
        type: 'jasa',
        contact_person: 'Dr. Budi Soetanto',
        email: 'info@kapsoetanto.co.id',
        phone: '021-57901234',
        address: 'Gedung BRI II Lt. 12, Jl. Jend. Sudirman, Jakarta Pusat'
    },
    {
        name: 'PT Solusi Keuangan Andalan',
        type: 'jasa',
        contact_person: 'Melinda Wijayanti',
        email: 'melinda@solusifinance.co.id',
        phone: '021-66443388',
        address: 'Jl. Kemang Raya No. 30, Jakarta Selatan'
    },
    {
        name: 'PT Manfaat Pajak Indonesia',
        type: 'jasa',
        contact_person: 'Hendro Kurniawan',
        email: 'hendro@manfaatpajak.co.id',
        phone: '021-77334455',
        address: 'Menara Imperium Lt. 15, Jl. HR Rasuna Said, Jakarta Selatan'
    },

    // ── Quality – QA / Inspection Partners ──
    {
        name: 'PT Bureau Veritas Indonesia',
        type: 'jasa',
        contact_person: 'David Santoso',
        email: 'david.s@bureauveritas.co.id',
        phone: '021-5262020',
        address: 'World Trade Centre 5, Jl. Jend. Sudirman Kav 29-31, Jakarta'
    },
    {
        name: 'PT SGS Indonesia',
        type: 'jasa',
        contact_person: 'Ayu Rahma',
        email: 'ayu.rahma@sgs.com',
        phone: '021-8378888',
        address: 'Graha SGS, Jl. Raya Pasar Minggu, Jakarta Selatan'
    },
    {
        name: 'CV Inspeksi Mutu Mandiri',
        type: 'jasa',
        contact_person: 'Tono Wibowo',
        email: 'tono@inspeksimutu.co.id',
        phone: '022-87665544',
        address: 'Jl. Diponegoro No. 23, Bandung'
    },

    // ── Produksi – Manufacturing Outsourcing Partners ──
    {
        name: 'PT Manufaktur Andalan Nusantara',
        type: 'vendor',
        contact_person: 'Slamet Riyadi',
        email: 'slamet@manufakturandalan.co.id',
        phone: '021-89905555',
        address: 'Kawasan Industri KIIC, Karawang'
    },
    {
        name: 'CV Karya Produksi Bersama',
        type: 'vendor',
        contact_person: 'Nunik Hartati',
        email: 'nunik@karyaproduksi.co.id',
        phone: '022-44332211',
        address: 'Jl. Raya Cimahi No. 88, Cimahi, Bandung'
    },
    {
        name: 'PT Solusi Operasional Industri',
        type: 'jasa',
        contact_person: 'Arif Budiman',
        email: 'arif@solusioperasional.co.id',
        phone: '031-88774422',
        address: 'Jl. Margomulyo Permai No. 10, Surabaya'
    },

    // ── HR – Agency / Training Partners ──
    {
        name: 'PT Manpower Indonesia',
        type: 'jasa',
        contact_person: 'Monica Patricia',
        email: 'monica.p@manpowergroup.co.id',
        phone: '021-29962700',
        address: 'Panin Tower 18th Floor, Jl. Jend. Sudirman, Jakarta'
    },
    {
        name: 'PT Prasetiya Mulya Training Center',
        type: 'jasa',
        contact_person: 'Dr. Haryono Tjahja',
        email: 'training@prasmul-eli.ac.id',
        phone: '021-7540555',
        address: 'Jl. Prasetya Mulya, BSD, Tangerang Selatan'
    },
    {
        name: 'PT Outsourcing Indonesia Raya',
        type: 'jasa',
        contact_person: 'Fauzi Rahman',
        email: 'fauzi@oir.co.id',
        phone: '021-55667788',
        address: 'Jl. M.T. Haryono No. 10, Jakarta Selatan'
    },

    // ── Admin / GA – Office / IT Partners ──
    {
        name: 'PT Graha Properti Jaya',
        type: 'jasa',
        contact_person: 'Bambang Suprapto',
        email: 'bsuprapto@grahaproperi.co.id',
        phone: '021-30099999',
        address: 'Jl. Abdul Muis No. 66, Jakarta Pusat'
    },
    {
        name: 'PT IBM Indonesia',
        type: 'jasa',
        contact_person: 'Christine Lee',
        email: 'christine.lee@ibm.com',
        phone: '021-5296000',
        address: 'Indonesia Stock Exchange Tower 2, Jl. Jend. Sudirman, Jakarta'
    },
    {
        name: 'PT Indosat Ooredoo Hutchison',
        type: 'vendor',
        contact_person: 'Ahmad Wahyu',
        email: 'enterprise@indosatooredoo.com',
        phone: '021-30003000',
        address: 'Jl. Medan Merdeka Barat No. 21, Jakarta Pusat'
    },
];

// ─── MAIN SEED FUNCTION ───────────────────────────────────────────────────────

const seed = async () => {
    try {
        await mongoose.connect(MONGO_URL, { dbName: DB_NAME });
        console.log('✅ Connected to MongoDB\n');

        // ── 1. Insert Vendors ────────────────────────────────────────────────
        console.log('📦 Inserting Vendor / Partner Master Data...');
        await Vendor.deleteMany({ name: { $in: allVendors.map(v => v.name) } });

        const vendorDocs = await Vendor.insertMany(
            allVendors.map(v => ({ ...v, id: uuidv4(), created_at: new Date().toISOString() }))
        );
        console.log(`   ✅ ${vendorDocs.length} vendor/partner records inserted\n`);

        // Helper: get vendor id by name
        const vid = (name) => vendorDocs.find(v => v.name === name)?.id || 'unknown';

        // ── 2. Get User IDs ──────────────────────────────────────────────────
        console.log('👤 Loading user IDs...');
        const users = await User.find({}).lean();
        const userId = (dept) => {
            if (dept === 'admin') {
                const admin = users.find(u => u.role === 'admin');
                return admin?.id || 'seed-admin';
            }
            const u = users.find(u => u.department === dept);
            return u?.id || `seed-${dept.toLowerCase()}`;
        };

        console.log(`   ✅ Found ${users.length} users in DB\n`);

        // ── 3. Build Agreements ──────────────────────────────────────────────
        console.log('📄 Building Agreement data...');

        const mkAgreement = (opts) => ({
            id: uuidv4(),
            title: opts.title,
            vendor_id: opts.vendorId,
            vendor_name: opts.vendorName,
            category: opts.category,
            start_date: opts.startDate,
            expiry_date: opts.expiryDate,
            cycle_year: opts.cycleYear || now.getFullYear(),
            description: opts.description || '',
            file_path: opts.filePath || `uploads/mock/${opts.title.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 30)}.pdf`,
            status: opts.status || 'active',           // will be recalculated by API
            approval_status: opts.approvalStatus || 'pending',
            approved_by: opts.approvedBy || null,
            approved_at: opts.approvedAt || null,
            rejection_reason: opts.rejectionReason || null,
            department: opts.department,               // current owning dept
            origin_department: opts.originDept,        // dept who created it
            created_by: userId(opts.originDept.toLowerCase()) || 'seed-script',
            created_at: opts.createdAt || d(-60),
            updated_at: opts.updatedAt || d(-5),
        });

        // After admin approves → department moves to HR
        const approved = (approvedMonthsAgo = 2) => ({
            approvalStatus: 'approved',
            approvedBy: 'Admin User',
            approvedAt: m(-approvedMonthsAgo),
            department: 'HR',  // approved agreements live in HR
        });

        const pending = () => ({ approvalStatus: 'pending' });
        const rejected = (reason) => ({ approvalStatus: 'rejected', rejectionReason: reason });

        // ────────────────────────────────────────────────────────────────────
        // PURCHASING (5 agreements)
        // ────────────────────────────────────────────────────────────────────
        const purchasingAgreements = [
            // 1. Active – approved → in HR
            mkAgreement({
                title: 'Kontrak Pengadaan Material Industri – PT Sumber Makmur Logistik',
                vendorId: vid('PT Sumber Makmur Logistik'),
                vendorName: 'PT Sumber Makmur Logistik',
                category: 'Vendor Contract',
                startDate: m(-6),
                expiryDate: m(6),
                description: 'Kontrak pengadaan material dan bahan baku industri selama 1 tahun. Mencakup aluminium, besi, dan komponen mekanis.',
                originDept: 'Purchasing',
                createdAt: d(-180),
                ...approved(5),
            }),
            // 2. Pending Approval – still in Purchasing
            mkAgreement({
                title: 'Perjanjian Pembelian Komponen – CV Teknik Jaya Persada',
                vendorId: vid('CV Teknik Jaya Persada'),
                vendorName: 'CV Teknik Jaya Persada',
                category: 'Purchase Order Frame',
                startDate: d(-10),
                expiryDate: d(120),
                description: 'Framework pembelian komponen mesin dan suku cadang secara berkala. Harga terkunci 12 bulan.',
                originDept: 'Purchasing',
                department: 'Purchasing',
                createdAt: d(-10),
                ...pending(),
            }),
            // 3. Expiring Soon – approved → in HR
            mkAgreement({
                title: 'Kontrak Suplai Komponen Elektrik – PT Prima Daya Elektrindo',
                vendorId: vid('PT Prima Daya Elektrindo'),
                vendorName: 'PT Prima Daya Elektrindo',
                category: 'Vendor Contract',
                startDate: m(-11),
                expiryDate: d(20),   // expiring in 20 days → expiring_soon
                description: 'Kontrak suplai komponen listrik meliputi kabel, panel, dan MCB. Perlu segera renewal.',
                originDept: 'Purchasing',
                createdAt: d(-330),
                ...approved(10),
            }),
            // 4. Expired – approved → in HR
            mkAgreement({
                title: 'Master Supplier Agreement – PT Global Supply Asia',
                vendorId: vid('PT Global Supply Asia'),
                vendorName: 'PT Global Supply Asia',
                category: 'Master Agreement',
                startDate: m(-24),
                expiryDate: m(-3),   // expired 3 months ago
                cycleYear: now.getFullYear() - 1,
                description: 'Master agreement pengadaan multi-kategori dengan PT Global Supply Asia. Sudah berakhir, menunggu proses renewal.',
                originDept: 'Purchasing',
                createdAt: d(-720),
                ...approved(20),
            }),
            // 5. Rejected – back in Purchasing
            mkAgreement({
                title: 'Perjanjian Kerjasama Pengadaan Bahan Habis Pakai – CV Karya Mitra Sentosa',
                vendorId: vid('CV Karya Mitra Sentosa'),
                vendorName: 'CV Karya Mitra Sentosa',
                category: 'Purchase Order Frame',
                startDate: d(-30),
                expiryDate: d(180),
                description: 'Pengadaan bahan habis pakai (consumables) pabrik. Kontrak ditolak karena harga tidak kompetitif, akan direvisi.',
                originDept: 'Purchasing',
                department: 'Purchasing',
                createdAt: d(-30),
                ...rejected('Harga penawaran melebihi budget yang ditetapkan. Diminta revisi proposal.'),
            }),
        ];

        // ────────────────────────────────────────────────────────────────────
        // SALES (5 agreements)
        // ────────────────────────────────────────────────────────────────────
        const salesAgreements = [
            // 1. Active – approved → in HR
            mkAgreement({
                title: 'Kontrak Penjualan Tahunan – PT Mitra Utama Sejahtera',
                vendorId: vid('PT Mitra Utama Sejahtera'),
                vendorName: 'PT Mitra Utama Sejahtera',
                category: 'Sales Contract',
                startDate: m(-3),
                expiryDate: m(9),
                description: 'Perjanjian kerjasama penjualan produk listrik selama 1 tahun. Target penjualan Rp 2,5 miliar. Termasuk SLA pengiriman 3 hari kerja.',
                originDept: 'Sales',
                createdAt: d(-90),
                ...approved(2),
            }),
            // 2. Pending Approval – in Sales
            mkAgreement({
                title: 'NDA dan Perjanjian Kerjasama Distribusi – CV Berkah Mandiri',
                vendorId: vid('CV Berkah Mandiri'),
                vendorName: 'CV Berkah Mandiri',
                category: 'NDA',
                startDate: d(-5),
                expiryDate: d(90),
                description: 'Non-Disclosure Agreement dan perjanjian awal kerjasama distribusi wilayah Jawa Barat. Sedang dalam review legal.',
                originDept: 'Sales',
                department: 'Sales',
                createdAt: d(-5),
                ...pending(),
            }),
            // 3. Expiring Soon – approved → in HR
            mkAgreement({
                title: 'Distributor Agreement – PT Surya Abadi Teknik',
                vendorId: vid('PT Surya Abadi Teknik'),
                vendorName: 'PT Surya Abadi Teknik',
                category: 'Distributor Agreement',
                startDate: m(-11),
                expiryDate: d(15),   // 15 days left
                description: 'Perjanjian distribusi eksklusif wilayah Jawa Timur dan Bali. Perlu renewal untuk melanjutkan kerjasama.',
                originDept: 'Sales',
                createdAt: d(-330),
                ...approved(10),
            }),
            // 4. Expired – approved → in HR
            mkAgreement({
                title: 'Partnership Agreement Produk Industrial – PT Nusantara Makmur',
                vendorId: vid('PT Nusantara Makmur'),
                vendorName: 'PT Nusantara Makmur',
                category: 'Partnership',
                startDate: m(-18),
                expiryDate: m(-6),   // expired 6 months ago
                cycleYear: now.getFullYear() - 1,
                description: 'Perjanjian distribusi produk industrial wilayah Yogyakarta dan sekitarnya. Sedang dalam proses renewal contract.',
                originDept: 'Sales',
                createdAt: d(-540),
                ...approved(15),
            }),
            // 5. Active (recently approved) → in HR
            mkAgreement({
                title: 'Service & Maintenance Sales Agreement – PT Dinamika Karya Indonesia',
                vendorId: vid('PT Dinamika Karya Indonesia'),
                vendorName: 'PT Dinamika Karya Indonesia',
                category: 'Service Agreement',
                startDate: m(-1),
                expiryDate: m(11),
                description: 'Perjanjian purna jual dan layanan maintenance untuk produk yang terjual ke PT Dinamika Karya. Termasuk garansi 12 bulan.',
                originDept: 'Sales',
                createdAt: d(-45),
                ...approved(1),
            }),
        ];

        // ────────────────────────────────────────────────────────────────────
        // PPIC (5 agreements)
        // ────────────────────────────────────────────────────────────────────
        const ppicAgreements = [
            // 1. Active – approved → in HR
            mkAgreement({
                title: 'Kontrak Pengadaan Bahan Baku Aluminium Plate 2026',
                vendorId: vid('Bahan Baku Aluminium Plate – PT Aluma Indo'),
                vendorName: 'PT Aluma Indo',
                category: 'Material Supply Contract',
                startDate: m(-2),
                expiryDate: m(10),
                description: 'Pengadaan bahan baku aluminium plate grade 5052 untuk kebutuhan produksi tahun 2026. Volume 50 ton per bulan.',
                originDept: 'PPIC',
                createdAt: d(-60),
                ...approved(1),
            }),
            // 2. Pending Approval – in PPIC
            mkAgreement({
                title: 'Perjanjian Pengadaan Komponen PCB Assembly',
                vendorId: vid('Komponen PCB Assembly – PT PCB Supply'),
                vendorName: 'PT PCB Supply',
                category: 'Material Supply Contract',
                startDate: d(-7),
                expiryDate: d(150),
                description: 'Pengadaan komponen PCB SMD dan through-hole untuk lini produksi elektronik. MOQ 10.000 pcs/bulan.',
                originDept: 'PPIC',
                department: 'PPIC',
                createdAt: d(-7),
                ...pending(),
            }),
            // 3. Expiring Soon – approved → in HR
            mkAgreement({
                title: 'Kontrak Jasa Kalibrasi Mesin Produksi – CV Jasa Kalibrasi Indonesia',
                vendorId: vid('CV Jasa Kalibrasi Indonesia'),
                vendorName: 'CV Jasa Kalibrasi Indonesia',
                category: 'Service Agreement',
                startDate: m(-11),
                expiryDate: d(12),   // 12 days left
                description: 'Layanan kalibrasi tahunan untuk 45 unit mesin produksi sesuai standar ISO 9001. Perlu renewal segera.',
                originDept: 'PPIC',
                createdAt: d(-330),
                ...approved(10),
            }),
            // 4. Expired – approved → in HR
            mkAgreement({
                title: 'Perjanjian Layanan Teknis Mesin – PT Solusi Teknik Nusantara',
                vendorId: vid('PT Solusi Teknik Nusantara'),
                vendorName: 'PT Solusi Teknik Nusantara',
                category: 'Technical Service',
                startDate: m(-24),
                expiryDate: m(-4),
                cycleYear: now.getFullYear() - 1,
                description: 'Kontrak layanan teknis dan troubleshooting mesin CNC dan press. Sudah berakhir, evaluasi vendor sedang berjalan.',
                originDept: 'PPIC',
                createdAt: d(-720),
                ...approved(22),
            }),
            // 5. Active (logistik/forwarder) – approved → in HR
            mkAgreement({
                title: 'Kontrak Layanan Ekspedisi – PT Ekspres Logistik Indonesia',
                vendorId: vid('PT Ekspres Logistik Indonesia'),
                vendorName: 'PT Ekspres Logistik Indonesia',
                category: 'Freight & Logistics',
                startDate: m(-4),
                expiryDate: m(8),
                description: 'Perjanjian layanan freight forwarding untuk distribusi produk jadi ke seluruh Indonesia dan ekspor ASEAN.',
                originDept: 'PPIC',
                createdAt: d(-120),
                ...approved(3),
            }),
        ];

        // ────────────────────────────────────────────────────────────────────
        // ENGINEERING (5 agreements)
        // ────────────────────────────────────────────────────────────────────
        const engineeringAgreements = [
            // 1. Active – approved → in HR
            mkAgreement({
                title: 'Kontrak Maintenance Mesin Produksi – PT Mekanik Jaya Persada',
                vendorId: vid('PT Mekanik Jaya Persada'),
                vendorName: 'PT Mekanik Jaya Persada',
                category: 'Maintenance Contract',
                startDate: m(-5),
                expiryDate: m(7),
                description: 'Kontrak preventive dan corrective maintenance untuk 30 unit mesin press, lathe, dan milling. Response time 4 jam.',
                originDept: 'Engineering',
                createdAt: d(-150),
                ...approved(4),
            }),
            // 2. Pending Approval – in Engineering
            mkAgreement({
                title: 'Perjanjian Instalasi Sistem Automation – CV Instalasi Prima Teknik',
                vendorId: vid('CV Instalasi Prima Teknik'),
                vendorName: 'CV Instalasi Prima Teknik',
                category: 'Installation Contract',
                startDate: d(-3),
                expiryDate: d(200),
                description: 'Instalasi sistem PLC dan SCADA untuk otomasi lini produksi baru. Termasuk commissioning dan training operator.',
                originDept: 'Engineering',
                department: 'Engineering',
                createdAt: d(-3),
                ...pending(),
            }),
            // 3. Expiring Soon – approved → in HR
            mkAgreement({
                title: 'Technical Service Agreement – PT Automasi Industri Utama',
                vendorId: vid('PT Automasi Industri Utama'),
                vendorName: 'PT Automasi Industri Utama',
                category: 'Technical Service',
                startDate: m(-11),
                expiryDate: d(10),   // 10 days left
                description: 'Layanan teknis dan support untuk sistem robotik dan conveyor otomatis. Termasuk pembaruan software PLC.',
                originDept: 'Engineering',
                createdAt: d(-330),
                ...approved(10),
            }),
            // 4. Expired – approved → in HR
            mkAgreement({
                title: 'Kontrak Overhaul Mesin Tahunan – PT Mekanik Jaya Persada',
                vendorId: vid('PT Mekanik Jaya Persada'),
                vendorName: 'PT Mekanik Jaya Persada',
                category: 'Overhaul Contract',
                startDate: m(-18),
                expiryDate: m(-6),
                cycleYear: now.getFullYear() - 1,
                description: 'Kontrak overhaul tahunan mesin produksi utama. Sudah selesai dilaksanakan, sedang dalam evaluasi vendor.',
                originDept: 'Engineering',
                createdAt: d(-540),
                ...approved(16),
            }),
            // 5. Active (second vendor) – approved → in HR
            mkAgreement({
                title: 'Perjanjian Kalibrasi & Sertifikasi Alat Ukur – CV Instalasi Prima Teknik',
                vendorId: vid('CV Instalasi Prima Teknik'),
                vendorName: 'CV Instalasi Prima Teknik',
                category: 'Calibration Service',
                startDate: m(-3),
                expiryDate: m(9),
                description: 'Kalibrasi dan sertifikasi alat ukur dan instrumen presisi sesuai standar nasional (BSN). Meliputi 80 unit alat ukur.',
                originDept: 'Engineering',
                createdAt: d(-90),
                ...approved(2),
            }),
        ];

        // ────────────────────────────────────────────────────────────────────
        // ACCOUNTING (5 agreements)
        // ────────────────────────────────────────────────────────────────────
        const accountingAgreements = [
            // 1. Active – approved → in HR
            mkAgreement({
                title: 'Perjanjian Jasa Audit Laporan Keuangan – KAP Soetanto & Rekan',
                vendorId: vid('KAP Soetanto & Rekan'),
                vendorName: 'KAP Soetanto & Rekan',
                category: 'Audit Agreement',
                startDate: m(-2),
                expiryDate: m(10),
                description: 'Jasa audit laporan keuangan tahunan sesuai PSAK dan standar IAPI. Termasuk audit internal dan review interim.',
                originDept: 'Accounting',
                createdAt: d(-60),
                ...approved(1),
            }),
            // 2. Pending Approval – in Accounting
            mkAgreement({
                title: 'Perjanjian Layanan Konsultasi Keuangan – PT Solusi Keuangan Andalan',
                vendorId: vid('PT Solusi Keuangan Andalan'),
                vendorName: 'PT Solusi Keuangan Andalan',
                category: 'Consulting Agreement',
                startDate: d(-15),
                expiryDate: d(180),
                description: 'Konsultasi manajemen keuangan, cash flow optimization, dan perencanaan anggaran tahunan. Termasuk laporan bulanan.',
                originDept: 'Accounting',
                department: 'Accounting',
                createdAt: d(-15),
                ...pending(),
            }),
            // 3. Expiring Soon – approved → in HR
            mkAgreement({
                title: 'Perjanjian Jasa Konsultasi Perpajakan – PT Manfaat Pajak Indonesia',
                vendorId: vid('PT Manfaat Pajak Indonesia'),
                vendorName: 'PT Manfaat Pajak Indonesia',
                category: 'Tax Consulting',
                startDate: m(-11),
                expiryDate: d(22),   // 22 days left
                description: 'Konsultasi dan pendampingan perpajakan SPT tahunan, rekonsiliasi pajak, dan tax planning. Perlu renewal.',
                originDept: 'Accounting',
                createdAt: d(-330),
                ...approved(10),
            }),
            // 4. Expired – approved → in HR
            mkAgreement({
                title: 'Perjanjian Jasa Pembukuan & Pelaporan – PT Solusi Keuangan Andalan',
                vendorId: vid('PT Solusi Keuangan Andalan'),
                vendorName: 'PT Solusi Keuangan Andalan',
                category: 'Bookkeeping Service',
                startDate: m(-24),
                expiryDate: m(-3),
                cycleYear: now.getFullYear() - 1,
                description: 'Jasa pembukuan bulanan dan penyusunan laporan keuangan manajemen. Kontrak selesai, sedang dalam evaluasi perpanjangan.',
                originDept: 'Accounting',
                createdAt: d(-720),
                ...approved(21),
            }),
            // 5. Active – approved → in HR
            mkAgreement({
                title: 'Finance System Integration Agreement – KAP Soetanto & Rekan',
                vendorId: vid('KAP Soetanto & Rekan'),
                vendorName: 'KAP Soetanto & Rekan',
                category: 'Service Agreement',
                startDate: m(-1),
                expiryDate: m(11),
                description: 'Perjanjian integrasi dan validasi sistem ERP keuangan. Termasuk review chart of accounts dan mapping akun PSAK.',
                originDept: 'Accounting',
                createdAt: d(-45),
                ...approved(1),
            }),
        ];

        // ────────────────────────────────────────────────────────────────────
        // QUALITY (5 agreements)
        // ────────────────────────────────────────────────────────────────────
        const qualityAgreements = [
            // 1. Active – approved → in HR
            mkAgreement({
                title: 'Perjanjian Jasa Inspeksi Kualitas Produk – PT Bureau Veritas Indonesia',
                vendorId: vid('PT Bureau Veritas Indonesia'),
                vendorName: 'PT Bureau Veritas Indonesia',
                category: 'Quality Inspection',
                startDate: m(-4),
                expiryDate: m(8),
                description: 'Inspeksi kualitas produk jadi sebelum pengiriman sesuai standar internasional. Termasuk penerbitan certificate of conformance.',
                originDept: 'Quality',
                createdAt: d(-120),
                ...approved(3),
            }),
            // 2. Pending Approval – in Quality
            mkAgreement({
                title: 'Perjanjian Audit Sistem Manajemen Mutu – PT SGS Indonesia',
                vendorId: vid('PT SGS Indonesia'),
                vendorName: 'PT SGS Indonesia',
                category: 'QMS Audit',
                startDate: d(-8),
                expiryDate: d(170),
                description: 'Audit sistem manajemen mutu ISO 9001:2015 dan ISO 14001. Termasuk surveillance audit dan gap analysis.',
                originDept: 'Quality',
                department: 'Quality',
                createdAt: d(-8),
                ...pending(),
            }),
            // 3. Expiring Soon – approved → in HR
            mkAgreement({
                title: 'Perjanjian Jasa Pengujian Material – CV Inspeksi Mutu Mandiri',
                vendorId: vid('CV Inspeksi Mutu Mandiri'),
                vendorName: 'CV Inspeksi Mutu Mandiri',
                category: 'Testing Service',
                startDate: m(-11),
                expiryDate: d(18),   // 18 days left
                description: 'Pengujian material bahan baku meliputi uji tarik, kekerasan, dan komposisi kimia. Laporan hasil uji terstandar.',
                originDept: 'Quality',
                createdAt: d(-330),
                ...approved(10),
            }),
            // 4. Expired – approved → in HR
            mkAgreement({
                title: 'QA Support Agreement – PT Bureau Veritas Indonesia',
                vendorId: vid('PT Bureau Veritas Indonesia'),
                vendorName: 'PT Bureau Veritas Indonesia',
                category: 'QA Support',
                startDate: m(-24),
                expiryDate: m(-5),
                cycleYear: now.getFullYear() - 1,
                description: 'Dukungan QA bulanan meliputi PPAP, FMEA review, dan corrective action. Kontrak expired, perlu re-tender.',
                originDept: 'Quality',
                createdAt: d(-720),
                ...approved(22),
            }),
            // 5. Active – approved → in HR
            mkAgreement({
                title: 'Sertifikasi dan Compliance Agreement – PT SGS Indonesia',
                vendorId: vid('PT SGS Indonesia'),
                vendorName: 'PT SGS Indonesia',
                category: 'Certification Service',
                startDate: m(-2),
                expiryDate: m(10),
                description: 'Layanan sertifikasi produk untuk pasar ekspor (CE Marking, UL, RoHS). Termasuk pengurusan dokumen teknis.',
                originDept: 'Quality',
                createdAt: d(-60),
                ...approved(1),
            }),
        ];

        // ────────────────────────────────────────────────────────────────────
        // PRODUKSI (5 agreements)
        // ────────────────────────────────────────────────────────────────────
        const produksiAgreements = [
            // 1. Active – approved → in HR
            mkAgreement({
                title: 'Kontrak Manufaktur Outsourcing – PT Manufaktur Andalan Nusantara',
                vendorId: vid('PT Manufaktur Andalan Nusantara'),
                vendorName: 'PT Manufaktur Andalan Nusantara',
                category: 'Manufacturing Agreement',
                startDate: m(-3),
                expiryDate: m(9),
                description: 'Kontrak outsourcing proses stamping dan welding untuk sub-assembly produk. Kapasitas 5.000 unit per bulan.',
                originDept: 'Produksi',
                createdAt: d(-90),
                ...approved(2),
            }),
            // 2. Pending Approval – in Produksi
            mkAgreement({
                title: 'Perjanjian Jasa Operasional Produksi – PT Solusi Operasional Industri',
                vendorId: vid('PT Solusi Operasional Industri'),
                vendorName: 'PT Solusi Operasional Industri',
                category: 'Operational Support',
                startDate: d(-12),
                expiryDate: d(120),
                description: 'Penyediaan tenaga operator produksi terlatih untuk lini assembly. Termasuk team leader dan QC inline.',
                originDept: 'Produksi',
                department: 'Produksi',
                createdAt: d(-12),
                ...pending(),
            }),
            // 3. Expiring Soon – approved → in HR
            mkAgreement({
                title: 'Kontrak Produksi Subkontrak – CV Karya Produksi Bersama',
                vendorId: vid('CV Karya Produksi Bersama'),
                vendorName: 'CV Karya Produksi Bersama',
                category: 'Subcontract Manufacturing',
                startDate: m(-11),
                expiryDate: d(8),   // 8 days left!
                description: 'Subkontrak proses machining komponen presisi. SLA permintaan darurat 48 jam. Urgen untuk renewal.',
                originDept: 'Produksi',
                createdAt: d(-330),
                ...approved(10),
            }),
            // 4. Expired – approved → in HR
            mkAgreement({
                title: 'Outsourcing Produksi Annual Contract – PT Manufaktur Andalan Nusantara',
                vendorId: vid('PT Manufaktur Andalan Nusantara'),
                vendorName: 'PT Manufaktur Andalan Nusantara',
                category: 'Manufacturing Agreement',
                startDate: m(-24),
                expiryDate: m(-2),
                cycleYear: now.getFullYear() - 1,
                description: 'Kontrak tahunan outsourcing produksi tahun sebelumnya. Sudah berakhir, sedang proses renegotiasi harga.',
                originDept: 'Produksi',
                createdAt: d(-720),
                ...approved(20),
            }),
            // 5. Active – approved → in HR
            mkAgreement({
                title: 'Perjanjian Operational Support Lini Packing – PT Solusi Operasional Industri',
                vendorId: vid('PT Solusi Operasional Industri'),
                vendorName: 'PT Solusi Operasional Industri',
                category: 'Operational Support',
                startDate: m(-1),
                expiryDate: m(11),
                description: 'Penyediaan jasa pengemasan dan packaging untuk produk jadi siap ekspor. Standar ISTA 2A untuk export packaging.',
                originDept: 'Produksi',
                createdAt: d(-45),
                ...approved(1),
            }),
        ];

        // ────────────────────────────────────────────────────────────────────
        // HR (5 agreements)
        // ────────────────────────────────────────────────────────────────────
        const hrAgreements = [
            // 1. Active – approved → stays in HR
            mkAgreement({
                title: 'Perjanjian Rekrutmen Tenaga Kerja – PT Manpower Indonesia',
                vendorId: vid('PT Manpower Indonesia'),
                vendorName: 'PT Manpower Indonesia',
                category: 'Recruitment Agreement',
                startDate: m(-4),
                expiryDate: m(8),
                description: 'Layanan rekrutmen karyawan tetap level staff hingga supervisor. Fee based on annual salary. Garansi replacement 3 bulan.',
                originDept: 'HR',
                department: 'HR',  // HR dept creates → after approval still in HR
                createdAt: d(-120),
                ...approved(3),
            }),
            // 2. Pending Approval – in HR
            mkAgreement({
                title: 'Perjanjian Pelatihan & Pengembangan SDM – PT Prasetiya Mulya Training Center',
                vendorId: vid('PT Prasetiya Mulya Training Center'),
                vendorName: 'PT Prasetiya Mulya Training Center',
                category: 'Training Agreement',
                startDate: d(-5),
                expiryDate: d(200),
                description: 'Program training leadership, komunikasi, dan teknis untuk 150 karyawan. Termasuk e-learning platform access 1 tahun.',
                originDept: 'HR',
                department: 'HR',
                createdAt: d(-5),
                ...pending(),
            }),
            // 3. Expiring Soon – approved → in HR
            mkAgreement({
                title: 'Perjanjian HR Outsourcing – PT Outsourcing Indonesia Raya',
                vendorId: vid('PT Outsourcing Indonesia Raya'),
                vendorName: 'PT Outsourcing Indonesia Raya',
                category: 'HR Outsourcing',
                startDate: m(-11),
                expiryDate: d(14),   // 14 days left
                description: 'Penyediaan tenaga kerja alih daya untuk posisi satpam, cleaning service, dan resepsionis. Perlu renewal segera.',
                originDept: 'HR',
                department: 'HR',
                createdAt: d(-330),
                ...approved(10),
            }),
            // 4. Expired – approved → in HR
            mkAgreement({
                title: 'Employee Welfare & Benefits Agreement – PT Manpower Indonesia',
                vendorId: vid('PT Manpower Indonesia'),
                vendorName: 'PT Manpower Indonesia',
                category: 'Benefits Agreement',
                startDate: m(-24),
                expiryDate: m(-4),
                cycleYear: now.getFullYear() - 1,
                description: 'Program benefit karyawan termasuk asuransi jiwa, asuransi kesehatan tambahan, dan program reward karyawan. Expired, perlu renewal.',
                originDept: 'HR',
                department: 'HR',
                createdAt: d(-720),
                ...approved(22),
            }),
            // 5. Active – approved → in HR
            mkAgreement({
                title: 'Perjanjian Jasa Assessment & Evaluasi Karyawan – PT Prasetiya Mulya Training Center',
                vendorId: vid('PT Prasetiya Mulya Training Center'),
                vendorName: 'PT Prasetiya Mulya Training Center',
                category: 'HR Consulting',
                startDate: m(-2),
                expiryDate: m(10),
                description: 'Assessment center dan evaluasi kompetensi untuk program talent management dan succession planning 2026.',
                originDept: 'HR',
                department: 'HR',
                createdAt: d(-60),
                ...approved(1),
            }),
        ];

        // ────────────────────────────────────────────────────────────────────
        // ADMIN / GA (5 agreements)
        // Note: Admin creates via admin panel directly → department: 'HR' (master)
        // These are company-wide agreements managed by GA/Admin
        // ────────────────────────────────────────────────────────────────────
        // For admin-created agreements, we use HR as department (company-wide)
        const adminAgreements = [
            // 1. Active – master office lease
            mkAgreement({
                title: 'Perjanjian Sewa Gedung Kantor Pusat – PT Graha Properti Jaya',
                vendorId: vid('PT Graha Properti Jaya'),
                vendorName: 'PT Graha Properti Jaya',
                category: 'Office Lease',
                startDate: m(-18),
                expiryDate: m(6),
                description: 'Sewa gedung kantor pusat lantai 5 dan 6 seluas 2.000 m². Termasuk fasilitas parkir, lobby, dan keamanan gedung.',
                originDept: 'HR',
                department: 'HR',
                createdAt: d(-540),
                ...approved(17),
            }),
            // 2. Pending Approval
            mkAgreement({
                title: 'IT Infrastructure Support Agreement – PT IBM Indonesia',
                vendorId: vid('PT IBM Indonesia'),
                vendorName: 'PT IBM Indonesia',
                category: 'IT Service Agreement',
                startDate: d(-20),
                expiryDate: d(160),
                description: 'Support infrastruktur IT termasuk server, storage, dan network. SLA uptime 99,5%. Termasuk disaster recovery.',
                originDept: 'HR',
                department: 'HR',
                createdAt: d(-20),
                ...pending(),
            }),
            // 3. Expiring Soon
            mkAgreement({
                title: 'Corporate Internet & Komunikasi Data – PT Indosat Ooredoo Hutchison',
                vendorId: vid('PT Indosat Ooredoo Hutchison'),
                vendorName: 'PT Indosat Ooredoo Hutchison',
                category: 'Telecommunications',
                startDate: m(-11),
                expiryDate: d(25),   // 25 days left
                description: 'Layanan internet dedicated 1 Gbps, VPN inter-site, dan komunikasi data perusahaan. Perlu renewal dan renegotiasi harga.',
                originDept: 'HR',
                department: 'HR',
                createdAt: d(-330),
                ...approved(10),
            }),
            // 4. Expired
            mkAgreement({
                title: 'Master Vendor Agreement – PT Manpower Indonesia (Fasilities)',
                vendorId: vid('PT Manpower Indonesia'),
                vendorName: 'PT Manpower Indonesia',
                category: 'Master Agreement',
                startDate: m(-24),
                expiryDate: m(-6),
                cycleYear: now.getFullYear() - 1,
                description: 'Master agreement layanan fasilitas dan general affairs termasuk catering, cleaning, dan security. Sudah habis masa berlakunya.',
                originDept: 'HR',
                department: 'HR',
                createdAt: d(-720),
                ...approved(22),
            }),
            // 5. Active – IT support
            mkAgreement({
                title: 'End-User Computing & Software License – PT IBM Indonesia',
                vendorId: vid('PT IBM Indonesia'),
                vendorName: 'PT IBM Indonesia',
                category: 'Software License',
                startDate: m(-1),
                expiryDate: m(11),
                description: 'Lisensi enterprise software ERP dan collaboration tools untuk 250 user. Termasuk support L1-L3 dan upgrade.',
                originDept: 'HR',
                department: 'HR',
                createdAt: d(-30),
                ...approved(1),
            }),
        ];

        // ── 4. Insert all Agreements ─────────────────────────────────────────
        const allAgreementTitles = [
            ...purchasingAgreements,
            ...salesAgreements,
            ...ppicAgreements,
            ...engineeringAgreements,
            ...accountingAgreements,
            ...qualityAgreements,
            ...produksiAgreements,
            ...hrAgreements,
            ...adminAgreements,
        ].map(a => a.title);

        // Remove old seeded agreements with matching titles
        await Agreement.deleteMany({ title: { $in: allAgreementTitles } });

        const allAgreements = [
            ...purchasingAgreements,
            ...salesAgreements,
            ...ppicAgreements,
            ...engineeringAgreements,
            ...accountingAgreements,
            ...qualityAgreements,
            ...produksiAgreements,
            ...hrAgreements,
            ...adminAgreements,
        ];

        await Agreement.insertMany(allAgreements);

        // ── 5. Insert Notifications for expiring_soon agreements ──────────────
        console.log('🔔 Creating notifications for expiring agreements...');

        const expiringSoon = allAgreements.filter(a => {
            const expiry = new Date(a.expiry_date);
            const diffDays = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
            return diffDays > 0 && diffDays <= 30;
        });

        // Remove old expiry notifications
        const expiringIds = expiringSoon.map(a => a.id);
        await Notification.deleteMany({ agreement_id: { $in: expiringIds } });

        const notifications = expiringSoon.flatMap(agreement => {
            const expiry = new Date(agreement.expiry_date);
            const daysLeft = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));

            // Notify the creator (origin department user)
            const creatorId = agreement.created_by;

            // Also notify admin
            const adminUser = users.find(u => u.role === 'admin');
            const adminId = adminUser?.id || 'seed-admin';

            const notifs = [
                {
                    id: uuidv4(),
                    user_id: creatorId,
                    agreement_id: agreement.id,
                    agreement_title: agreement.title,
                    message: `Agreement "${agreement.title}" akan berakhir dalam ${daysLeft} hari (${new Date(agreement.expiry_date).toLocaleDateString('id-ID')})`,
                    type: 'expiry_warning',
                    is_read: false,
                    created_at: d(-1),
                }
            ];

            if (adminId && adminId !== creatorId) {
                notifs.push({
                    id: uuidv4(),
                    user_id: adminId,
                    agreement_id: agreement.id,
                    agreement_title: agreement.title,
                    message: `[Admin] Agreement "${agreement.title}" (${agreement.origin_department}) akan berakhir dalam ${daysLeft} hari`,
                    type: 'expiry_warning',
                    is_read: false,
                    created_at: d(-1),
                });
            }

            return notifs;
        });

        if (notifications.length > 0) {
            await Notification.insertMany(notifications);
        }

        // ── 6. Summary ───────────────────────────────────────────────────────
        console.log('\n🎉 Seed berhasil! Summary:');
        console.log('─'.repeat(50));
        console.log(`   Vendors/Partners : ${vendorDocs.length} records`);
        console.log(`   Agreements       : ${allAgreements.length} records`);

        const deptSummary = {
            Purchasing : purchasingAgreements.length,
            Sales      : salesAgreements.length,
            PPIC       : ppicAgreements.length,
            Engineering: engineeringAgreements.length,
            Accounting : accountingAgreements.length,
            Quality    : qualityAgreements.length,
            Produksi   : produksiAgreements.length,
            HR         : hrAgreements.length,
            'Admin/GA' : adminAgreements.length,
        };

        Object.entries(deptSummary).forEach(([dept, count]) => {
            console.log(`   • ${dept.padEnd(12)}: ${count} agreements`);
        });

        const expiredCount = allAgreements.filter(a => new Date(a.expiry_date) < now).length;
        const expiringSoonCount = allAgreements.filter(a => {
            const diff = Math.ceil((new Date(a.expiry_date) - now) / 86400000);
            return diff > 0 && diff <= 30;
        }).length;
        const activeCount = allAgreements.length - expiredCount - expiringSoonCount;

        console.log('\n   Status Distribution:');
        console.log(`   • Active         : ${activeCount}`);
        console.log(`   • Expiring Soon  : ${expiringSoonCount}`);
        console.log(`   • Expired        : ${expiredCount}`);
        console.log(`   Notifications    : ${notifications.length} created`);
        console.log('─'.repeat(50));

        await mongoose.disconnect();
        process.exit(0);
    } catch (err) {
        console.error('\n❌ Error saat seed:', err);
        await mongoose.disconnect();
        process.exit(1);
    }
};

seed();
