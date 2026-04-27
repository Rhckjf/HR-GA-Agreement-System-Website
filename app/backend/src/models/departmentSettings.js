const mongoose = require('mongoose');

const departmentSettingsSchema = new mongoose.Schema({
    department: {
        type: String,
        required: true,
        unique: true
    },
    emails: {
        type: [String],
        default: []
    }
}, {
    timestamps: true,
    versionKey: false
});

module.exports = mongoose.model('DepartmentSettings', departmentSettingsSchema);
