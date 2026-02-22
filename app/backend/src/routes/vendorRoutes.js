const express = require('express');
const router = express.Router();
const {
    getVendors,
    createVendor,
    updateVendor,
    deleteVendor
} = require('../controllers/vendorController');
const { protect } = require('../middleware/auth');

router.route('/')
    .get(protect, getVendors)
    .post(protect, createVendor);

router.route('/:id')
    .put(protect, updateVendor)
    .delete(protect, deleteVendor);

module.exports = router;
