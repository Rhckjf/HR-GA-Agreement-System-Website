const AuditLog = require('../models/auditLog');
const Agreement = require('../models/agreement');
const { v4: uuidv4 } = require('uuid');

const escapeRegex = (string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

// @desc    Ambil semua audit log (dengan paginasi dan filter)
// @route   GET /api/audit-logs
// @access  Admin Only
const getAuditLogs = async (req, res) => {
    try {
        const { action, entity_type, search, date_from, date_to, page = 1, limit = 50 } = req.query;
        let query = {};

        // Jika bukan admin, kunci query hanya ke departemen user yang sedang login
        if (req.user.role !== 'admin' && req.user.department) {
            query.department = req.user.department;
        }

        if (action) query.action = action;
        if (entity_type) query.entity_type = entity_type;

        if (search) {
            const safeSearch = escapeRegex(search);
            const searchRegex = { $regex: safeSearch, $options: 'i' };
            query.$or = [
                { entity_title: searchRegex },
                { performed_by_name: searchRegex },
                { department: searchRegex },
                { details: searchRegex }
            ];
        }

        if (date_from || date_to) {
            const dateFilter = {};
            if (date_from && !isNaN(new Date(date_from).getTime())) {
                dateFilter.$gte = new Date(date_from).toISOString();
            }
            if (date_to && !isNaN(new Date(date_to).getTime())) {
                const endDate = new Date(date_to);
                endDate.setHours(23, 59, 59, 999);
                dateFilter.$lte = endDate.toISOString();
            }
            if (Object.keys(dateFilter).length > 0) {
                query.created_at = dateFilter;
            }
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const total = await AuditLog.countDocuments(query);
        const logs = await AuditLog.find(query)
            .sort({ created_at: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .lean();

        res.json({
            logs,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Error fetching audit logs:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Ambil audit log berdasarkan entity ID
// @route   GET /api/audit-logs/entity/:entityId
// @access  Private
const getAuditLogsByEntity = async (req, res) => {
    try {
        const logs = await AuditLog.find({ entity_id: req.params.entityId })
            .sort({ created_at: -1 })
            .lean();

        res.json(logs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Pulihkan agreement yang sudah dihapus
// @route   POST /api/audit-logs/:id/restore
// @access  Admin Only
const restoreAgreement = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ detail: 'Hanya admin yang bisa memulihkan data' });
        }

        const auditLog = await AuditLog.findOne({ id: req.params.id, action: 'delete' });
        if (!auditLog) {
            return res.status(404).json({ detail: 'Audit log tidak ditemukan atau bukan aksi delete' });
        }

        if (!auditLog.snapshot) {
            return res.status(400).json({ detail: 'Snapshot tidak tersedia untuk pemulihan' });
        }

        // Cek apakah agreement sudah ada (mungkin sudah di-restore sebelumnya)
        const existing = await Agreement.findOne({ id: auditLog.entity_id });
        if (existing && !existing.is_deleted) {
            return res.status(400).json({ detail: 'Agreement sudah ada dan tidak dalam status terhapus' });
        }

        if (existing && existing.is_deleted) {
            // Agreement masih ada tapi di-soft-delete, cukup un-delete
            await Agreement.updateOne(
                { id: auditLog.entity_id },
                {
                    $set: {
                        is_deleted: false,
                        deleted_at: null,
                        deleted_by: null,
                        updated_at: new Date().toISOString()
                    }
                }
            );
        } else {
            // Agreement sudah benar-benar tidak ada, buat ulang dari snapshot
            const snapshotData = { ...auditLog.snapshot };
            delete snapshotData._id; // Hapus MongoDB internal ID
            snapshotData.is_deleted = false;
            snapshotData.deleted_at = null;
            snapshotData.deleted_by = null;
            snapshotData.updated_at = new Date().toISOString();
            await Agreement.create(snapshotData);
        }

        // Catat aksi restore di audit log
        await AuditLog.create({
            id: uuidv4(),
            action: 'restore',
            entity_type: 'agreement',
            entity_id: auditLog.entity_id,
            entity_title: auditLog.entity_title,
            performed_by: req.user.id,
            performed_by_name: req.user.name,
            department: req.user.department || 'Admin',
            details: `Agreement "${auditLog.entity_title}" dipulihkan oleh ${req.user.name}`,
            created_at: new Date().toISOString()
        });

        res.json({ message: `Agreement "${auditLog.entity_title}" berhasil dipulihkan` });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * Helper function untuk membuat entri audit log.
 * Bisa dipanggil dari controller lain.
 */
const createAuditEntry = async ({ action, entity_type = 'agreement', entity_id, entity_title, performed_by, performed_by_name, department, details, snapshot = null }) => {
    try {
        await AuditLog.create({
            id: uuidv4(),
            action,
            entity_type,
            entity_id,
            entity_title,
            performed_by,
            performed_by_name,
            department,
            details,
            snapshot,
            created_at: new Date().toISOString()
        });
    } catch (error) {
        console.error('Gagal membuat audit log:', error.message);
    }
};

module.exports = {
    getAuditLogs,
    getAuditLogsByEntity,
    restoreAgreement,
    createAuditEntry
};
