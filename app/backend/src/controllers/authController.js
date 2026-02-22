const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const User = require('../models/user');
const generateToken = require('../utils/generateToken');

const ALLOWED_DEPARTMENTS = [
    "Purchasing", "Sales", "PPIC", "Engineering",
    "Accounting", "Quality", "Produksi", "HR"
];

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
    const { email, password, name, department } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ email });

    if (userExists) {
        return res.status(400).json({ detail: 'Email already registered' });
    }

    // Validate department
    if (department && !ALLOWED_DEPARTMENTS.includes(department)) {
        return res.status(400).json({ detail: `Invalid department. Allowed: ${ALLOWED_DEPARTMENTS.join(', ')}` });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const user = await User.create({
        id: uuidv4(),
        email,
        password_hash,
        name,
        role: 'staff',
        department,
        created_at: new Date().toISOString()
    });

    if (user) {
        res.status(200).json({ // Python returned 200, typically 201 for create but sticking to parity
            token: generateToken(user.id),
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                department: user.department,
                created_at: user.created_at
            }
        });
    } else {
        res.status(400).json({ detail: 'Invalid user data' });
    }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
    console.log('[LOGIN] Request received:', req.body?.email);
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (user) {
        // Verify password
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (isMatch) {
            return res.json({
                token: generateToken(user.id),
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                    department: user.department,
                    created_at: user.created_at
                }
            });
        }
    }

    res.status(401).json({ detail: 'Invalid email or password' });
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
    const user = {
        id: req.user.id,
        email: req.user.email,
        name: req.user.name,
        role: req.user.role,
        department: req.user.department,
        created_at: req.user.created_at
    };

    res.json(user);
};

module.exports = {
    register,
    login,
    getMe,
    ALLOWED_DEPARTMENTS
};
