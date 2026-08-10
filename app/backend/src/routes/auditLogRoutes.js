const express = require('express');
const router = express.Router();
const {
    getAuditLogs,
    getAuditLogsByEntity,
    restoreAgreement
} = require('../controllers/auditLogController');
const { protect } = require('../middleware/auth');

// GET /api/audit-logs — daftar semua audit log (admin only)
router.get('/', protect, getAuditLogs);

// GET /api/audit-logs/entity/:entityId — audit log untuk entitas tertentu
router.get('/entity/:entityId', protect, getAuditLogsByEntity);

// POST /api/audit-logs/:id/restore — pulihkan item yang dihapus (admin only)
router.post('/:id/restore', protect, restoreAgreement);

module.exports = router;
