const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const agreementSchema = new mongoose.Schema({
    id: {
        type: String,
        default: uuidv4,
        unique: true
    },
    title: {
        type: String,
        required: true
    },
    vendor_id: {
        type: String,
        required: true
    },
    vendor_name: {
        type: String,
        default: null
    },
    category: {
        type: String,
        required: true
    },
    start_date: {
        type: String, // Keeping as String to match Python ISO format usage
        required: true
    },
    expiry_date: {
        type: String,
        required: true
    },
    cycle_year: {
        type: Number,
        default: null
    },
    description: {
        type: String,
        default: null
    },
    file_path: {
        type: String,
        default: null
    },
    status: {
        type: String,
        required: true
    },
    approval_status: {
        type: String,
        default: 'pending',
        enum: ['pending', 'approved', 'rejected']
    },
    approved_by: {
        type: String,
        default: null
    },
    approved_at: {
        type: String,
        default: null
    },
    rejection_reason: {
        type: String,
        default: null
    },
    department: {
        type: String,
        default: null
    },
    origin_department: {
        type: String,
        default: null
    },
    created_by: {
        type: String,
        required: true
    },
    created_at: {
        type: String,
        default: () => new Date().toISOString()
    },
    updated_at: {
        type: String,
        default: () => new Date().toISOString()
    }
}, {
    versionKey: false
});

module.exports = mongoose.model('Agreement', agreementSchema);
