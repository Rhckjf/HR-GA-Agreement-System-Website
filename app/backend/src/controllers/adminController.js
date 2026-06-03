const User = require('../models/user');
const bcrypt = require('bcryptjs');
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

// @desc    Create new user
// @route   POST /api/admin/users
// @access  Admin
const createUser = async (req, res) => {
    try {
        const { email, password, name, role, department } = req.body;

        // Validation
        if (!email || !password || !name) {
            return res.status(400).json({ 
                detail: 'Email, password, and name are required' 
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ 
                detail: 'Invalid email format' 
            });
        }

        // Validate password length
        if (password.length < 6) {
            return res.status(400).json({ 
                detail: 'Password must be at least 6 characters long' 
            });
        }

        // Validate role
        const validRoles = ['staff', 'admin'];
        if (role && !validRoles.includes(role)) {
            return res.status(400).json({ 
                detail: 'Invalid role. Must be either "staff" or "admin"' 
            });
        }

        // Validate department
        if (department && !ALLOWED_DEPARTMENTS.includes(department)) {
            return res.status(400).json({ 
                detail: 'Invalid department' 
            });
        }

        // Check if email already exists
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({ 
                detail: 'Email already registered' 
            });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new user
        const user = new User({
            email: email.toLowerCase(),
            password_hash: hashedPassword,
            name,
            role: role || 'staff',
            department: department || null
        });

        await user.save();

        // Return user without password
        const userResponse = {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            department: user.department,
            created_at: user.created_at
        };

        res.status(201).json({
            message: 'User created successfully',
            user: userResponse
        });
    } catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update user
// @route   PUT /api/admin/users/:id
// @access  Admin
const updateUser = async (req, res) => {
    try {
        const { email, name, role, department, password } = req.body;

        // Find user
        const user = await User.findOne({ id: req.params.id });
        if (!user) {
            return res.status(404).json({ detail: 'User not found' });
        }

        // Validate role if provided
        if (role && !['staff', 'admin'].includes(role)) {
            return res.status(400).json({ 
                detail: 'Invalid role. Must be either "staff" or "admin"' 
            });
        }

        // Validate department if provided
        if (department && !ALLOWED_DEPARTMENTS.includes(department)) {
            return res.status(400).json({ 
                detail: 'Invalid department' 
            });
        }

        // Check if email is being changed and if it's already taken
        if (email && email !== user.email) {
            const existingUser = await User.findOne({ email: email.toLowerCase() });
            if (existingUser) {
                return res.status(400).json({ 
                    detail: 'Email already registered' 
                });
            }
            user.email = email.toLowerCase();
        }

        // Update fields
        if (name) user.name = name;
        if (role) user.role = role;
        if (department !== undefined) user.department = department || null;

        // Update password if provided
        if (password) {
            if (password.length < 6) {
                return res.status(400).json({ 
                    detail: 'Password must be at least 6 characters long' 
                });
            }
            const salt = await bcrypt.genSalt(10);
            user.password_hash = await bcrypt.hash(password, salt);
        }

        await user.save();

        // Return updated user without password
        const userResponse = {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            department: user.department,
            created_at: user.created_at
        };

        res.json({
            message: 'User updated successfully',
            user: userResponse
        });
    } catch (error) {
        console.error('Update user error:', error);
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
    createUser,
    updateUser,
    deleteUser,
    getDepartments
};
