const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const auditLogSchema = new mongoose.Schema({
    id: {
        type: String,
        default: uuidv4,
        unique: true
    },
    action: {
        type: String,
        required: true,
        enum: ['create', 'update', 'delete', 'upload', 'download', 'approve', 'reject', 'restore']
    },
    entity_type: {
        type: String,
        required: true,
        default: 'agreement'
    },
    entity_id: {
        type: String,
        required: true
    },
    entity_title: {
        type: String,
        default: null
    },
    performed_by: {
        type: String,
        required: true
    },
    performed_by_name: {
        type: String,
        default: null
    },
    department: {
        type: String,
        default: null
    },
    details: {
        type: String,
        default: null
    },
    // Snapshot lengkap dokumen (untuk restore setelah delete)
    snapshot: {
        type: mongoose.Schema.Types.Mixed,
        default: null
    },
    created_at: {
        type: String,
        default: () => new Date().toISOString()
    }
}, {
    versionKey: false
});

// Index untuk query yang sering digunakan
auditLogSchema.index({ entity_id: 1 });
auditLogSchema.index({ created_at: -1 });
auditLogSchema.index({ action: 1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
