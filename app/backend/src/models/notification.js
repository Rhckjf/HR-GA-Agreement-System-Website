const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const notificationSchema = new mongoose.Schema({
    id: {
        type: String,
        default: uuidv4,
        unique: true
    },
    user_id: {
        type: String,
        required: true
    },
    agreement_id: {
        type: String,
        required: true
    },
    agreement_title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    type: {
        type: String,
        required: true
    },
    is_read: {
        type: Boolean,
        default: false
    },
    created_at: {
        type: String,
        default: () => new Date().toISOString()
    }
}, {
    versionKey: false
});

module.exports = mongoose.model('Notification', notificationSchema);
