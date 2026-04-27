const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
require('dotenv').config({ path: path.join(__dirname, '../.env') }); // Load .env from backend root

const authRoutes = require('./routes/authRoutes');
const vendorRoutes = require('./routes/vendorRoutes');
const agreementRoutes = require('./routes/agreementRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const adminRoutes = require('./routes/adminRoutes');
const departmentRoutes = require('./routes/departmentRoutes');
const departmentSettingsRoutes = require('./routes/departmentSettingsRoutes');

const app = express();

// Middleware
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" } // Allow images/resources if needed across same site
}));

app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000', // Restrict to frontend origin
    credentials: true, 
}));

// Sanitize data to prevent NoSQL injection
app.use(mongoSanitize());

app.use(express.json());
app.use(morgan('dev')); // Always log requests for debugging

// Static folder for uploads
// Matches UPLOADS_DIR = ROOT_DIR / 'uploads' in Python
// ROOT_DIR was where server.py was (backend root)
// Here we are in src/app.js, so backend root is one level up
const uploadsPath = path.join(__dirname, '../uploads'); 
// REMOVED static folder access for security. Files are now only served through authenticated API endpoints.
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
app.use('/api/department-settings', departmentSettingsRoutes);

app.get('/', (req, res) => {
    res.send('API is running...');
});

module.exports = app;
