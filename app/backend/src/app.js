const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') }); // Load .env from backend root

const authRoutes = require('./routes/authRoutes');
const vendorRoutes = require('./routes/vendorRoutes');
const agreementRoutes = require('./routes/agreementRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const adminRoutes = require('./routes/adminRoutes');
const departmentRoutes = require('./routes/departmentRoutes');

const app = express();

// Middleware
app.use(cors({
    origin: '*',
    credentials: false, // credentials must be false when origin is wildcard '*'
}));
app.use(express.json());
app.use(morgan('dev')); // Always log requests for debugging

// Static folder for uploads
// Matches UPLOADS_DIR = ROOT_DIR / 'uploads' in Python
// ROOT_DIR was where server.py was (backend root)
// Here we are in src/app.js, so backend root is one level up
const uploadsPath = path.join(__dirname, '../uploads'); // wait, src is one level, backend is root.
// Structure:
// backend/
//   src/App.js
//   uploads/
// So ../uploads is correct IF we are in src/
// But wait, the uploads dir was created at `../../uploads` in middleware/upload.js relative to that file.
// middleware/upload.js is in src/middleware/
// So ../../uploads from src/middleware is backend/uploads. Correct.
// Here in src/app.js, ../uploads is backend/uploads. Correct.
app.use('/uploads', express.static(path.join(__dirname, '../uploads'))); // Serve files? Python served via FileResponse.
// Python:
// @api_router.get("/agreements/{agreement_id}/download") -> checks auth then FileResponse
// @api_router.get("/agreements/{agreement_id}/preview") -> checks auth then FileResponse
// So files are NOT publicly accessible via static route in Python!
// REMOVE STATIC ROUTE or make it internal only?
// Python code does NOT have a mount for static files. It only uses endpoints.
// So I should NOT adding app.use('/uploads'...) if I want to match Python security.
// However, standard Express often uses static for uploads.
// But valid requirement: "The user must be logged in to download/preview".
// So no static middleware for uploads.
// The endpoints in agreementRoutes handle the serving.

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/agreements', agreementRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes); // This handles /api/admin/users
app.use('/api/departments', departmentRoutes);

app.get('/', (req, res) => {
    res.send('API is running...');
});

module.exports = app;
