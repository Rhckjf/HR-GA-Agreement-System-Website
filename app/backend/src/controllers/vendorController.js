const Vendor = require('../models/vendor');
const { v4: uuidv4 } = require('uuid');

// @desc    Get all vendors
// @route   GET /api/vendors
// @access  Private
const getVendors = async (req, res) => {
    const { type } = req.query;
    let query = {};

    if (type) {
        query.type = type;
    }

    try {
        const vendors = await Vendor.find(query).limit(1000);
        res.json(vendors);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a vendor
// @route   POST /api/vendors
// @access  Private
const createVendor = async (req, res) => {
    const { name, type, contact_person, email, phone, address } = req.body;

    try {
        const vendor = await Vendor.create({
            id: uuidv4(),
            name,
            type: type || 'barang',
            contact_person,
            email,
            phone,
            address,
            created_at: new Date().toISOString()
        });

        res.status(200).json(vendor);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Update a vendor
// @route   PUT /api/vendors/:id
// @access  Private
const updateVendor = async (req, res) => {
    try {
        const vendor = await Vendor.findOneAndUpdate(
            { id: req.params.id },
            req.body,
            { new: true }
        );

        if (!vendor) {
            return res.status(404).json({ detail: 'Vendor not found' });
        }

        res.json(vendor);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Delete a vendor
// @route   DELETE /api/vendors/:id
// @access  Private
const deleteVendor = async (req, res) => {
    try {
        const vendor = await Vendor.findOneAndDelete({ id: req.params.id });

        if (!vendor) {
            return res.status(404).json({ detail: 'Vendor not found' });
        }

        res.json({ message: 'Vendor deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getVendors,
    createVendor,
    updateVendor,
    deleteVendor
};
