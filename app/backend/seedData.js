/**
 * Seed Script - Data Dummy untuk HR & GA Agreement System
 * Jalankan dengan: node seedData.js
 *
 * Isi data:
 * - 6 Customer (Sales)
 * - 6 Vendor (Purchasing)
 * - 4 Barang, 3 Jasa, 3 Forwarder (PPIC)
 * - 3 Agreement per divisi (total 9 agreement)
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017';
const DB_NAME = process.env.DB_NAME || 'test_database';

// ─── MODELS ─────────────────────────────────────────────────────────────────
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

const Vendor = mongoose.model('Vendor', vendorSchema);
const Agreement = mongoose.model('Agreement', agreementSchema);

// ─── DUMMY MASTER DATA ───────────────────────────────────────────────────────

const customers = [
    {
        name: 'PT Mitra Utama Sejahtera',
        type: 'customer',
        email: 'contact@mitrautama.co.id',
        phone: '021-55012345',
        address: 'Jl. Gatot Subroto No. 12, Jakarta Selatan'
    },
    {
        name: 'CV Berkah Mandiri',
        type: 'customer',
        email: 'info@berkahmandiri.com',
        phone: '022-76543210',
        address: 'Jl. Soekarno Hatta No. 88, Bandung'
    },
    {
        name: 'PT Surya Abadi Teknik',
        type: 'customer',
        email: 'admin@suryaabadi.co.id',
        phone: '031-45678900',
        address: 'Rungkut Industri Blok A No. 5, Surabaya'
    },
    {
        name: 'PT Nusantara Makmur',
        type: 'customer',
        email: 'sales@nusantaramakmur.com',
        phone: '0274-889900',
        address: 'Jl. Malioboro No. 45, Yogyakarta'
    },
    {
        name: 'CV Jaya Sentosa',
        type: 'customer',
        email: 'info@jayasentosa.co.id',
        phone: '024-76500123',
        address: 'Jl. Pemuda No. 77, Semarang'
    },
    {
        name: 'PT Dinamika Karya Indonesia',
        type: 'customer',
        email: 'hrd@dinamikakarya.co.id',
        phone: '021-66789012',
        address: 'Kawasan Industri MM2100, Bekasi'
    },
];

const vendors = [
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
    {
        name: 'PT Maju Bersama Industri',
        type: 'vendor',
        contact_person: 'Rudi Hermawan',
        email: 'rudi@majubersama.co.id',
        phone: '024-66778899',
        address: 'Kawasan Industri Terboyo, Semarang'
    },
];

const ppicData = [
    // Barang
    {
        name: 'Bahan Baku Aluminium Plate',
        type: 'barang',
        contact_person: 'Eko Prasetyo',
        email: 'eko@aluminiumindo.co.id',
        phone: '021-33445566',
        address: 'Jl. Industri Besar III No. 7, Pulo Gadung, Jakarta'
    },
    {
        name: 'Komponen PCB Assembly',
        type: 'barang',
        contact_person: 'Linda Kusuma',
        email: 'linda@pcbsupply.co.id',
        phone: '022-89012345',
        address: 'Jl. Raya Padalarang No. 120, Bandung Barat'
    },
    {
        name: 'Kabel & Wiring Harness',
        type: 'barang',
        contact_person: 'Agus Triyanto',
        email: 'agus@kabelindo.co.id',
        phone: '031-66778899',
        address: 'Kawasan Industri Rungkut, Surabaya'
    },
    {
        name: 'Pelumas Industri Mesin',
        type: 'barang',
        contact_person: 'Yuni Astuti',
        email: 'yuni@lumasindo.co.id',
        phone: '021-99887766',
        address: 'Jl. Cilincing Raya No. 88, Jakarta Utara'
    },
    // Jasa
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
        name: 'PT Mitra Sertifikasi Mutu',
        type: 'jasa',
        contact_person: 'Rina Marlina',
        email: 'rina@sertifikasimutu.co.id',
        phone: '021-44332211',
        address: 'Jl. TB Simatupang No. 10, Jakarta Selatan'
    },
    // Forwarder
    {
        name: 'PT Ekspres Logistik Indonesia',
        type: 'forwarder',
        contact_person: 'Bagas Wicaksono',
        email: 'bagas@ekspreslogistik.co.id',
        phone: '021-77665544',
        address: 'Jl. Raya Pluit No. 5, Penjaringan, Jakarta Utara'
    },
    {
        name: 'CV Angkut Cepat Nusantara',
        type: 'forwarder',
        contact_person: 'Cahyo Nugroho',
        email: 'cahyo@angkutcepat.id',
        phone: '031-44332211',
        address: 'Jl. Tanjung Perak Barat No. 200, Surabaya'
    },
    {
        name: 'PT Global Freight Forwarding',
        type: 'forwarder',
        contact_person: 'Maya Savitri',
        email: 'maya@globalfreight.co.id',
        phone: '021-55443300',
        address: 'Gedung ITC Mangga Dua Lt. 3, Jakarta Utara'
    },
];

// ─── MAIN SEED FUNCTION ──────────────────────────────────────────────────────

const seed = async () => {
    try {
        await mongoose.connect(MONGO_URL, { dbName: DB_NAME });
        console.log('✅ Connected to MongoDB\n');

        // ── Insert Master Data ──
        console.log('📦 Inserting Master Data...');

        // Delete existing seed data to avoid duplicates
        await Vendor.deleteMany({ name: { $in: [...customers.map(c => c.name), ...vendors.map(v => v.name), ...ppicData.map(p => p.name)] } });

        const allMasterData = [...customers, ...vendors, ...ppicData].map(item => ({
            ...item,
            id: uuidv4(),
            created_at: new Date().toISOString()
        }));

        const insertedVendors = await Vendor.insertMany(allMasterData);
        console.log(`   ✅ ${customers.length} Customers (Sales)`);
        console.log(`   ✅ ${vendors.length} Vendors (Purchasing)`);
        console.log(`   ✅ ${ppicData.filter(p => p.type === 'barang').length} Barang, ${ppicData.filter(p => p.type === 'jasa').length} Jasa, ${ppicData.filter(p => p.type === 'forwarder').length} Forwarder (PPIC)\n`);

        // Get IDs by type for agreements
        const getByType = (type) => insertedVendors.filter(v => v.type === type);
        const customerList = getByType('customer');
        const vendorList = getByType('vendor');
        const barangList = getByType('barang');
        const jasaList = getByType('jasa');
        const forwarderList = getByType('forwarder');

        const now = new Date();
        const future = (months) => new Date(now.getFullYear(), now.getMonth() + months, now.getDate()).toISOString();
        const past = (months) => new Date(now.getFullYear(), now.getMonth() - months, now.getDate()).toISOString();

        // ── Insert Agreements ──
        console.log('📄 Inserting Agreements...');

        const agreements = [
            // === SALES ===
            {
                id: uuidv4(),
                title: 'Kontrak Penjualan Tahunan PT Mitra Utama Sejahtera',
                vendor_id: customerList[0]?.id,
                vendor_name: customerList[0]?.name,
                category: 'Service Agreement',
                start_date: past(2),
                expiry_date: future(10),
                cycle_year: now.getFullYear(),
                description: 'Perjanjian kerjasama penjualan produk listrik selama 1 tahun dengan PT Mitra Utama Sejahtera.',
                status: 'active',
                approval_status: 'approved',
                approved_by: 'Admin',
                approved_at: past(1),
                department: 'HR',            // approved → pindah ke HR
                origin_department: 'Sales',
            },
            {
                id: uuidv4(),
                title: 'NDA dengan CV Berkah Mandiri',
                vendor_id: customerList[1]?.id,
                vendor_name: customerList[1]?.name,
                category: 'NDA',
                start_date: past(1),
                expiry_date: future(1),
                cycle_year: now.getFullYear(),
                description: 'Perjanjian kerahasiaan data antara perusahaan dan CV Berkah Mandiri.',
                status: 'expiring_soon',
                approval_status: 'pending',
                department: 'Sales',
                origin_department: 'Sales',
            },
            {
                id: uuidv4(),
                title: 'Partnership Agreement PT Surya Abadi Teknik',
                vendor_id: customerList[2]?.id,
                vendor_name: customerList[2]?.name,
                category: 'Partnership',
                start_date: past(14),
                expiry_date: past(2),
                cycle_year: now.getFullYear() - 1,
                description: 'Perjanjian distribusi produk yang telah berakhir, sedang dalam proses renewal.',
                status: 'expired',
                approval_status: 'approved',
                approved_by: 'Admin',
                approved_at: past(6),
                department: 'HR',            // approved → pindah ke HR
                origin_department: 'Sales',
            },

            // === PURCHASING ===
            {
                id: uuidv4(),
                title: 'Kontrak Pengadaan Material PT Sumber Makmur Logistik',
                vendor_id: vendorList[0]?.id,
                vendor_name: vendorList[0]?.name,
                category: 'Vendor Contract',
                start_date: past(3),
                expiry_date: future(9),
                cycle_year: now.getFullYear(),
                description: 'Kontrak pengadaan material dan bahan baku industri selama 1 tahun.',
                status: 'active',
                approval_status: 'approved',
                approved_by: 'Admin',
                approved_at: past(2),
                department: 'HR',            // approved → pindah ke HR
                origin_department: 'Purchasing',
            },
            {
                id: uuidv4(),
                title: 'Perjanjian Pembelian Komponen CV Teknik Jaya Persada',
                vendor_id: vendorList[1]?.id,
                vendor_name: vendorList[1]?.name,
                category: 'Vendor Contract',
                start_date: past(1),
                expiry_date: future(2),
                cycle_year: now.getFullYear(),
                description: 'Pembelian komponen mesin dan suku cadang secara berkala.',
                status: 'expiring_soon',
                approval_status: 'pending',
                department: 'Purchasing',
                origin_department: 'Purchasing',
            },
            {
                id: uuidv4(),
                title: 'Kontrak Suplai Komponen PT Prima Daya Elektrindo',
                vendor_id: vendorList[2]?.id,
                vendor_name: vendorList[2]?.name,
                category: 'Vendor Contract',
                start_date: past(18),
                expiry_date: past(6),
                cycle_year: now.getFullYear() - 1,
                description: 'Kontrak suplai komponen listrik yang telah berakhir.',
                status: 'expired',
                approval_status: 'approved',
                approved_by: 'Admin',
                approved_at: past(12),
                department: 'HR',            // approved → pindah ke HR
                origin_department: 'Purchasing',
            },

            // === PPIC ===
            {
                id: uuidv4(),
                title: 'Kontrak Pengadaan Aluminium Plate 2026',
                vendor_id: barangList[0]?.id,
                vendor_name: barangList[0]?.name,
                category: 'Vendor Contract',
                start_date: past(1),
                expiry_date: future(11),
                cycle_year: now.getFullYear(),
                description: 'Pengadaan bahan baku aluminium plate untuk kebutuhan produksi tahun 2026.',
                status: 'active',
                approval_status: 'approved',
                approved_by: 'Admin',
                approved_at: past(1),
                department: 'HR',            // approved → pindah ke HR
                origin_department: 'PPIC',
            },
            {
                id: uuidv4(),
                title: 'Kontrak Jasa Kalibrasi Mesin Produksi',
                vendor_id: jasaList[0]?.id,
                vendor_name: jasaList[0]?.name,
                category: 'Service Agreement',
                start_date: past(2),
                expiry_date: future(1),
                cycle_year: now.getFullYear(),
                description: 'Layanan kalibrasi dan maintenance mesin produksi secara berkala.',
                status: 'expiring_soon',
                approval_status: 'pending',
                department: 'PPIC',
                origin_department: 'PPIC',
            },
            {
                id: uuidv4(),
                title: 'Kontrak Pengiriman PT Ekspres Logistik Indonesia',
                vendor_id: forwarderList[0]?.id,
                vendor_name: forwarderList[0]?.name,
                category: 'Service Agreement',
                start_date: past(4),
                expiry_date: future(8),
                cycle_year: now.getFullYear(),
                description: 'Perjanjian layanan pengiriman dan freight forwarding untuk distribusi produk jadi.',
                status: 'active',
                approval_status: 'approved',
                approved_by: 'Admin',
                approved_at: past(3),
                department: 'HR',            // approved → pindah ke HR
                origin_department: 'PPIC',
            },
        ];

        // Delete old seed agreements by title
        await Agreement.deleteMany({ title: { $in: agreements.map(a => a.title) } });

        await Agreement.insertMany(agreements.map(a => ({
            ...a,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            created_by: 'seed-script'
        })));

        console.log(`   ✅ 3 Agreements (Sales)`);
        console.log(`   ✅ 3 Agreements (Purchasing)`);
        console.log(`   ✅ 3 Agreements (PPIC)\n`);

        console.log('🎉 Seed selesai! Total yang dimasukkan:');
        console.log(`   Master Data : ${allMasterData.length} records`);
        console.log(`   Agreements  : ${agreements.length} records`);

        await mongoose.disconnect();
        process.exit(0);
    } catch (err) {
        console.error('❌ Error saat seed:', err.message);
        await mongoose.disconnect();
        process.exit(1);
    }
};

seed();
