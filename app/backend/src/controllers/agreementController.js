const Agreement = require('../models/agreement');
const Vendor = require('../models/vendor');
const Notification = require('../models/notification');
const { calculateAgreementStatus } = require('../utils/status');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');

// @desc    Get all agreements
// @route   GET /api/agreements
// @access  Private
const getAgreements = async (req, res) => {
    try {
        const { category, status, search, cycle_year } = req.query;
        let query = {};

        // Department Scoping
        if (req.user.role !== 'admin' && req.user.department) {
            query.department = req.user.department;
        }

        if (category) query.category = category;
        if (cycle_year) query.cycle_year = parseInt(cycle_year);

        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { vendor_name: { $regex: search, $options: 'i' } }
            ];
        }

        let agreements = await Agreement.find(query).limit(1000).lean();

        // Update status and filter
        const now = new Date();
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
        const agreement = await Agreement.findOne({ id: req.params.id }).lean();

        if (!agreement) {
            return res.status(404).json({ detail: 'Agreement not found' });
        }

        // Check permission if not admin
        if (req.user.role !== 'admin' && agreement.department && agreement.department !== req.user.department) {
            // Or maybe allow read if it's tailored? Python code allows if dept matches or if user is admin.
            // Wait, Python: if current_user['role'] != 'admin' and agreement.get('department') and agreement.get('department') != current_user.get('department'): raise 403
            // BUT only for download/preview. For generic get, it uses filtered query in list, but explicit get might need check.
            // Python implementation for single get:
            // checks ID.
            // Doesn't seem to explicitly check department for GET /agreements/:id.
            // But let's be safe and replicate specific download checks later.
            // Actually, for get_agreement (list), it filters. For get_agreement (single), it only checks ID. 
            // Wait, let's check `server.py` line 331. It just finds one. No auth check on department there?
            // Ah, `get_agreements` (list) has scoping. `get_agreement` (single) does NOT have scoping in Python code provided!
            // That might be a bug in Python code or intended. I will stick to Python behavior: no check.
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

        const vendor = await Vendor.findOne({ id: vendor_id });
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

        res.status(200).json(agreement);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update agreement
// @route   PUT /api/agreements/:id
// @access  Private
const updateAgreement = async (req, res) => {
    try {
        let agreement = await Agreement.findOne({ id: req.params.id });
        if (!agreement) {
            return res.status(404).json({ detail: 'Agreement not found' });
        } // Check permission? matching Python: no check.

        const updateData = req.body;

        // If vendor_id passes, update vendor_name
        if (updateData.vendor_id) {
            const vendor = await Vendor.findOne({ id: updateData.vendor_id });
            if (vendor) {
                updateData.vendor_name = vendor.name;
            }
        }

        updateData.updated_at = new Date().toISOString();

        agreement = await Agreement.findOneAndUpdate(
            { id: req.params.id },
            { $set: updateData },
            { new: true }
        ).lean();

        agreement.status = calculateAgreementStatus(agreement.expiry_date);
        res.json(agreement);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete agreement
// @route   DELETE /api/agreements/:id
// @access  Private
const deleteAgreement = async (req, res) => {
    try {
        const result = await Agreement.findOneAndDelete({ id: req.params.id });
        if (!result) {
            return res.status(404).json({ detail: 'Agreement not found' });
        }
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
        const agreement = await Agreement.findOne({ id: req.params.id });
        if (!agreement) {
            return res.status(404).json({ detail: 'Agreement not found' });
        }

        if (!req.file) {
            return res.status(400).json({ detail: 'No file uploaded' });
        }

        // Multer handles saving, we just update DB
        const filePath = req.file.path;

        await Agreement.updateOne(
            { id: req.params.id },
            { $set: { file_path: filePath } }
        );

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
        const agreement = await Agreement.findOne({ id: req.params.id });
        if (!agreement) {
            return res.status(404).json({ detail: 'Agreement not found' });
        }

        if (req.user.role !== 'admin' && agreement.department && agreement.department !== req.user.department) {
            return res.status(403).json({ detail: 'Access denied' });
        }

        if (!agreement.file_path) {
            return res.status(404).json({ detail: 'No file uploaded' });
        }

        const filePath = path.resolve(agreement.file_path);
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
        const agreement = await Agreement.findOne({ id: req.params.id });
        if (!agreement) {
            return res.status(404).json({ detail: 'Agreement not found' });
        }

        if (req.user.role !== 'admin' && agreement.department && agreement.department !== req.user.department) {
            return res.status(403).json({ detail: 'Access denied' });
        }

        if (!agreement.file_path) {
            return res.status(404).json({ detail: 'No file uploaded' });
        }

        const filePath = path.resolve(agreement.file_path);
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

        const agreement = await Agreement.findOneAndUpdate(
            { id: req.params.id },
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

        if (!agreement) {
            return res.status(404).json({ detail: 'Agreement not found' });
        }

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
            { id: req.params.id },
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

        agreement.status = calculateAgreementStatus(agreement.expiry_date);
        res.json(agreement);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getAgreements,
    getAgreement,
    createAgreement,
    updateAgreement,
    deleteAgreement,
    uploadAgreementFile,
    downloadAgreement,
    previewAgreement,
    approveAgreement,
    rejectAgreement
};
