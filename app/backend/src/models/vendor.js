const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const vendorSchema = new mongoose.Schema({
    id: {
        type: String,
        default: uuidv4,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    type: {
        type: String,
        required: true,
        enum: ['barang', 'jasa', 'customer'], // Based on Python code, 'barang' is default there but it seemed to allow others. The Pydantic model had 'barang' default.
        default: 'barang'
    },
    contact_person: {
        type: String,
        default: null
    },
    email: {
        type: String,
        default: null
    },
    phone: {
        type: String,
        default: null
    },
    address: {
        type: String,
        default: null
    },
    created_at: {
        type: String,
        default: () => new Date().toISOString()
    }
}, {
    versionKey: false
});

module.exports = mongoose.model('Vendor', vendorSchema);
