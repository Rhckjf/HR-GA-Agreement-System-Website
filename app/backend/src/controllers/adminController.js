const User = require('../models/user');
const { ALLOWED_DEPARTMENTS } = require('./authController');

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Admin
const getUsers = async (req, res) => {
    try {
        const users = await User.find({}).select('-password_hash').limit(1000);
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Admin
const deleteUser = async (req, res) => {
    try {
        if (req.params.id === req.user.id) {
            return res.status(400).json({ detail: 'Cannot delete yourself' });
        }

        const user = await User.findOneAndDelete({ id: req.params.id });

        if (!user) {
            return res.status(404).json({ detail: 'User not found' });
        }

        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get departments
// @route   GET /api/departments
// @access  Public (or Private?) Python server had it under admin/users routes area but endpoint was /api/departments
const getDepartments = async (req, res) => {
    res.json({ departments: ALLOWED_DEPARTMENTS });
};

module.exports = {
    getUsers,
    deleteUser,
    getDepartments
};
