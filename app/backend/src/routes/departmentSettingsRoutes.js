const express = require('express');
const router = express.Router();
const controller = require('../controllers/departmentSettingsController');
const { protect, adminOnly } = require('../middleware/auth');

// Get all settings (Admin only)
router.get('/', protect, adminOnly, controller.getAllSettings);

// Get specific department settings (Admin only)
router.get('/:department', protect, adminOnly, controller.getSettingsByDepartment);

// Update department settings (Admin only)
router.put('/:department', protect, adminOnly, controller.updateSettings);

module.exports = router;
