const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const userSchema = new mongoose.Schema({
    id: {
        type: String,
        default: uuidv4,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password_hash: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    role: {
        type: String,
        default: 'staff',
        enum: ['staff', 'admin']
    },
    department: {
        type: String,
        default: null
    },
    created_at: {
        type: String,
        default: () => new Date().toISOString()
    }
}, {
    timestamps: false, // We're managing created_at manually to match Python format if needed, but Mongoose timestamps are better. Ideally we keep consistent with Python.
    versionKey: false
});

module.exports = mongoose.model('User', userSchema);
