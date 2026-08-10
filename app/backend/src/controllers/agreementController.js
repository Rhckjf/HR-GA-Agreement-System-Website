const Agreement = require('../models/agreement');
const Vendor = require('../models/vendor');
const Notification = require('../models/notification');
const { calculateAgreementStatus } = require('../utils/status');
const { createAuditEntry } = require('./auditLogController');
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');

const escapeRegex = (string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

const getIdQuery = (idParam) => {
    return mongoose.Types.ObjectId.isValid(idParam)
        ? { $or: [{ _id: idParam }, { id: idParam }] }
        : { id: idParam };
};

// @desc    Get all agreements
// @route   GET /api/agreements
// @access  Private
const getAgreements = async (req, res) => {
    try {
        const { category, status, approval_status, search, cycle_year, department, date_from, date_to, has_document } = req.query;
        let query = { is_deleted: { $ne: true } }; // Filter out soft-deleted records

        // Department Scoping:
        // Staff can see agreements from THEIR department (current dept) OR
        // agreements they originally created (origin_department) — so they can see
        // approved agreements that moved to HR.
        if (req.user.role !== 'admin' && req.user.department) {
            query.$or = [
                { department: req.user.department },
                { origin_department: req.user.department }
            ];
        } else if (department) {
            // Admin filter by specific department — use $or for both fields
            query.$or = [
                { department: department },
                { origin_department: department }
            ];
        }

        if (category) query.category = category;
        if (cycle_year) query.cycle_year = parseInt(cycle_year);
        if (approval_status) {
            // When combined with $or, we need $and to avoid accidentally overwriting it
            if (query.$or) {
                query = { $and: [{ $or: query.$or }, { approval_status: approval_status }, { is_deleted: { $ne: true } }] };
            } else {
                query.approval_status = approval_status;
            }
        }

        // Filter rentang tanggal
        if (date_from || date_to) {
            const dateFilter = {};
            if (date_from) dateFilter.$gte = new Date(date_from).toISOString();
            if (date_to) {
                const endDate = new Date(date_to);
                endDate.setHours(23, 59, 59, 999);
                dateFilter.$lte = endDate.toISOString();
            }
            if (query.$and) {
                query.$and.push({ expiry_date: dateFilter });
            } else {
                query.expiry_date = dateFilter;
            }
        }

        // Filter dokumen
        if (has_document === 'yes') {
            const docFilter = { file_path: { $ne: null } };
            if (query.$and) {
                query.$and.push(docFilter);
            } else {
                query.file_path = { $ne: null };
            }
        } else if (has_document === 'no') {
            const docFilter = { $or: [{ file_path: null }, { file_path: { $exists: false } }] };
            if (query.$and) {
                query.$and.push(docFilter);
            } else {
                query.file_path = null;
            }
        }

        if (search) {
            const safeSearch = escapeRegex(search);
            const searchRegex = { $regex: safeSearch, $options: 'i' };
            const searchOr = [
                { title: searchRegex },
                { vendor_name: searchRegex },
                { origin_department: searchRegex },
                { description: searchRegex },
                { category: searchRegex },
                { id: searchRegex }
            ];
            if (query.$and) {
                query.$and.push({ $or: searchOr });
            } else if (query.$or) {
                query = { $and: [{ $or: query.$or }, { $or: searchOr }, { is_deleted: { $ne: true } }] };
            } else {
                query.$or = searchOr;
            }
        }

        let agreements = await Agreement.find(query).limit(1000).lean();

        // Recalculate status from expiry_date
        agreements = agreements.map(agreement => {
            const currentStatus = calculateAgreementStatus(agreement.expiry_date);
            return { ...agreement, status: currentStatus };
        });

        if (status) {
            agreements = agreements.filter(a => a.status === status);
        }

        res.json(agreements);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get single agreement
// @route   GET /api/agreements/:id
// @access  Private
const getAgreement = async (req, res) => {
    try {
        const idQuery = getIdQuery(req.params.id);
        idQuery.is_deleted = { $ne: true }; // Filter out soft-deleted
        const agreement = await Agreement.findOne(idQuery).lean();

        if (!agreement) {
            return res.status(404).json({ detail: 'Agreement not found' });
        }

        // Check permission if not admin:
        // Staff can see their own dept's agreements AND agreements they created (via origin_department)
        // This covers case where approved agreement moved to HR — staff can still view it
        if (req.user.role !== 'admin') {
            const isOwnDept = agreement.department && agreement.department === req.user.department;
            const isOrigin = agreement.origin_department && agreement.origin_department === req.user.department;
            if (!isOwnDept && !isOrigin) {
                return res.status(403).json({ detail: 'Access denied' });
            }
        }

        agreement.status = calculateAgreementStatus(agreement.expiry_date);
        res.json(agreement);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create agreement
// @route   POST /api/agreements
// @access  Private
const createAgreement = async (req, res) => {
    if (req.user.role === 'admin') {
        return res.status(403).json({ detail: 'Admin cannot create agreements' });
    }
    try {
        const {
            title,
            vendor_id,
            category,
            start_date,
            expiry_date,
            cycle_year,
            description
        } = req.body;

        const vendor = await Vendor.findOne(getIdQuery(vendor_id));
        if (!vendor) {
            return res.status(404).json({ detail: 'Vendor not found' });
        }

        const status = calculateAgreementStatus(expiry_date);

        const agreement = await Agreement.create({
            id: uuidv4(),
            title,
            vendor_id,
            vendor_name: vendor.name,
            category,
            start_date,
            expiry_date,
            cycle_year,
            description,
            status,
            approval_status: 'pending',
            department: req.user.department,
            origin_department: req.user.department,
            created_by: req.user.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        });

        if (status === 'expiring_soon') {
            await Notification.create({
                id: uuidv4(),
                user_id: req.user.id,
                agreement_id: agreement.id,
                agreement_title: agreement.title,
                message: `Agreement '${agreement.title}' is expiring soon`,
                type: 'expiry_warning',
                is_read: false,
                created_at: new Date().toISOString()
            });
        }

        // Audit log: create
        await createAuditEntry({
            action: 'create',
            entity_id: agreement.id,
            entity_title: agreement.title,
            performed_by: req.user.id,
            performed_by_name: req.user.name,
            department: req.user.department,
            details: `Agreement "${agreement.title}" dibuat oleh ${req.user.name}`
        });

        res.status(200).json(agreement);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update agreement
// @route   PUT /api/agreements/:id
// @access  Private
const updateAgreement = async (req, res) => {
    if (req.user.role === 'admin') {
        return res.status(403).json({ detail: 'Admin cannot update agreements' });
    }
    try {
        let agreement = await Agreement.findOne(getIdQuery(req.params.id));
        if (!agreement) {
            return res.status(404).json({ detail: 'Agreement not found' });
        } // Check permission? matching Python: no check.

        // Only allow safe fields to be updated
        const safeData = {
            title: req.body.title,
            vendor_id: req.body.vendor_id,
            category: req.body.category,
            start_date: req.body.start_date,
            expiry_date: req.body.expiry_date,
            cycle_year: req.body.cycle_year,
            description: req.body.description,
            updated_at: new Date().toISOString()
        };

        // Remove undefined fields
        const updateData = Object.fromEntries(Object.entries(safeData).filter(([_, v]) => v !== undefined));

        // If vendor_id passes, update vendor_name
        if (updateData.vendor_id) {
            const vendor = await Vendor.findOne(getIdQuery(updateData.vendor_id));
            if (vendor) {
                updateData.vendor_name = vendor.name;
            }
        }

        agreement = await Agreement.findOneAndUpdate(
            getIdQuery(req.params.id),
            { $set: updateData },
            { new: true }
        ).lean();

        agreement.status = calculateAgreementStatus(agreement.expiry_date);

        // Audit log: update
        await createAuditEntry({
            action: 'update',
            entity_id: agreement.id,
            entity_title: agreement.title,
            performed_by: req.user.id,
            performed_by_name: req.user.name,
            department: req.user.department,
            details: `Agreement "${agreement.title}" diperbarui oleh ${req.user.name}`
        });

        res.json(agreement);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete agreement
// @route   DELETE /api/agreements/:id
// @access  Private
const deleteAgreement = async (req, res) => {
    if (req.user.role === 'admin') {
        return res.status(403).json({ detail: 'Admin cannot delete agreements' });
    }
    try {
        const agreement = await Agreement.findOne(getIdQuery(req.params.id)).lean();
        if (!agreement) {
            return res.status(404).json({ detail: 'Agreement not found' });
        }

        // Simpan snapshot untuk pemulihan, lalu soft delete
        await createAuditEntry({
            action: 'delete',
            entity_id: agreement.id,
            entity_title: agreement.title,
            performed_by: req.user.id,
            performed_by_name: req.user.name,
            department: req.user.department,
            details: `Agreement "${agreement.title}" dihapus oleh ${req.user.name}`,
            snapshot: agreement
        });

        // Soft delete: tandai sebagai dihapus, jangan hapus permanen
        await Agreement.updateOne(
            getIdQuery(req.params.id),
            {
                $set: {
                    is_deleted: true,
                    deleted_at: new Date().toISOString(),
                    deleted_by: req.user.id
                }
            }
        );

        res.json({ message: 'Agreement deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Upload agreement file
// @route   POST /api/agreements/:id/upload
// @access  Private
const uploadAgreementFile = async (req, res) => {
    try {
        const agreement = await Agreement.findOne(getIdQuery(req.params.id));
        if (!agreement) {
            return res.status(404).json({ detail: 'Agreement not found' });
        }

        if (!req.file) {
            return res.status(400).json({ detail: 'No file uploaded' });
        }

        // Multer handles saving, we just update DB
        const filePath = req.file.path;

        await Agreement.updateOne(
            getIdQuery(req.params.id),
            { $set: { file_path: filePath } }
        );

        // Audit log: upload
        await createAuditEntry({
            action: 'upload',
            entity_id: agreement.id,
            entity_title: agreement.title,
            performed_by: req.user.id,
            performed_by_name: req.user.name,
            department: req.user.department,
            details: `File "${req.file.originalname}" diupload untuk agreement "${agreement.title}"`
        });

        res.json({ message: 'File uploaded successfully', file_path: filePath });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Download agreement file
// @route   GET /api/agreements/:id/download
// @access  Private
const downloadAgreement = async (req, res) => {
    try {
        const agreement = await Agreement.findOne(getIdQuery(req.params.id));
        if (!agreement) {
            return res.status(404).json({ detail: 'Agreement not found' });
        }

        if (req.user.role !== 'admin' && agreement.department && agreement.department !== req.user.department) {
            return res.status(403).json({ detail: 'Access denied' });
        }

        if (!agreement.file_path) {
            return res.status(404).json({ detail: 'No file uploaded' });
        }

        // Secure the file path with path.basename to prevent directory traversal
        const baseDir = path.resolve(__dirname, '../../uploads');
        const fileName = path.basename(agreement.file_path);
        const filePath = path.resolve(baseDir, fileName);
        
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ detail: 'File not found on server' });
        }

        res.download(filePath);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Preview agreement file
// @route   GET /api/agreements/:id/preview
// @access  Private
const previewAgreement = async (req, res) => {
    try {
        const agreement = await Agreement.findOne(getIdQuery(req.params.id));
        if (!agreement) {
            return res.status(404).json({ detail: 'Agreement not found' });
        }

        if (req.user.role !== 'admin' && agreement.department && agreement.department !== req.user.department) {
            return res.status(403).json({ detail: 'Access denied' });
        }

        if (!agreement.file_path) {
            return res.status(404).json({ detail: 'No file uploaded' });
        }

        // Secure the file path with path.basename to prevent directory traversal
        const baseDir = path.resolve(__dirname, '../../uploads');
        const fileName = path.basename(agreement.file_path);
        const filePath = path.resolve(baseDir, fileName);
        
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ detail: 'File not found on server' });
        }

        res.sendFile(filePath);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Approve agreement
// @route   PUT /api/agreements/:id/approve
// @access  Admin
const approveAgreement = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ detail: 'Only admin can approve' });
        }

        const existingAgreement = await Agreement.findOne(getIdQuery(req.params.id)).lean();
        if (!existingAgreement) {
            return res.status(404).json({ detail: 'Agreement not found' });
        }

        // 1. Update the original agreement's approval status without changing its department
        const agreement = await Agreement.findOneAndUpdate(
            getIdQuery(req.params.id),
            {
                $set: {
                    approval_status: 'approved',
                    approved_by: req.user.name,
                    approved_at: new Date().toISOString(),
                    rejection_reason: null
                }
            },
            { new: true }
        ).lean();

        // 2. Clone the agreement specifically for HR department
        const hrAgreementData = { ...existingAgreement };
        delete hrAgreementData._id; // Remove MongoDB internal ID
        hrAgreementData.id = uuidv4(); // Generate new UUID for the clone
        hrAgreementData.department = 'HR';
        hrAgreementData.approval_status = 'approved';
        hrAgreementData.approved_by = req.user.name;
        hrAgreementData.approved_at = new Date().toISOString();
        hrAgreementData.rejection_reason = null;
        hrAgreementData.created_at = new Date().toISOString();
        hrAgreementData.updated_at = new Date().toISOString();

        await Agreement.create(hrAgreementData);

        // Notification
        if (agreement.created_by) {
            await Notification.create({
                id: uuidv4(),
                user_id: agreement.created_by,
                agreement_id: agreement.id,
                agreement_title: agreement.title,
                message: `Agreement '${agreement.title}' was approved and a copy was sent to HR.`,
                type: 'approval',
                is_read: false,
                created_at: new Date().toISOString()
            });
        }

        // Audit log: approve
        await createAuditEntry({
            action: 'approve',
            entity_id: agreement.id,
            entity_title: agreement.title,
            performed_by: req.user.id,
            performed_by_name: req.user.name,
            department: req.user.department || 'Admin',
            details: `Agreement "${agreement.title}" disetujui oleh ${req.user.name}`
        });

        agreement.status = calculateAgreementStatus(agreement.expiry_date);
        res.json(agreement);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Reject agreement
// @route   PUT /api/agreements/:id/reject
// @access  Admin
const rejectAgreement = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ detail: 'Only admin can reject' });
        }

        const { reason } = req.body;

        const agreement = await Agreement.findOneAndUpdate(
            getIdQuery(req.params.id),
            {
                $set: {
                    approval_status: 'rejected',
                    rejection_reason: reason,
                    approved_by: req.user.name,
                    approved_at: new Date().toISOString()
                }
            },
            { new: true }
        ).lean();

        if (!agreement) {
            return res.status(404).json({ detail: 'Agreement not found' });
        }

        // Notification
        if (agreement.created_by) {
            await Notification.create({
                id: uuidv4(),
                user_id: agreement.created_by,
                agreement_id: agreement.id,
                agreement_title: agreement.title,
                message: `Agreement '${agreement.title}' was rejected: ${reason}`,
                type: 'rejection',
                is_read: false,
                created_at: new Date().toISOString()
            });
        }

        // Audit log: reject
        await createAuditEntry({
            action: 'reject',
            entity_id: agreement.id,
            entity_title: agreement.title,
            performed_by: req.user.id,
            performed_by_name: req.user.name,
            department: req.user.department || 'Admin',
            details: `Agreement "${agreement.title}" ditolak oleh ${req.user.name}. Alasan: ${reason}`
        });

        agreement.status = calculateAgreementStatus(agreement.expiry_date);
        res.json(agreement);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all unique categories
// @route   GET /api/agreements/categories
// @access  Private
const getCategories = async (req, res) => {
    try {
        const DEFAULT_CATEGORIES = [
            'Service Agreement',
            'Vendor Contract',
            'NDA',
            'Partnership',
            'Lease Agreement',
            'Other'
        ];

        // Ensure users only see categories created by their own department (unless Admin)
        let query = {};
        if (req.user.role !== 'admin' && req.user.department) {
            query.origin_department = req.user.department;
        }

        // Fetch distinct categories from the database scoped to the department
        const dbCategories = await Agreement.distinct('category', query);

        // Merge default categories with DB categories, remove nulls/empty, deduplicate
        const merged = Array.from(
            new Set([
                ...DEFAULT_CATEGORIES,
                ...dbCategories.filter(c => c && c.trim() !== '')
            ])
        ).sort();

        res.json(merged);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getAgreements,
    getAgreement,
    getCategories,
    createAgreement,
    updateAgreement,
    deleteAgreement,
    uploadAgreementFile,
    downloadAgreement,
    previewAgreement,
    approveAgreement,
    rejectAgreement
};
