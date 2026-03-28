const jwt = require('jsonwebtoken');
const User = require('../models/user');

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            
            if (!process.env.JWT_SECRET) {
                console.error('FATAL ERROR: JWT_SECRET is not defined in environment variables.');
                return res.status(500).json({ detail: 'Internal server error: Authentication configuration missing' });
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // In the Python code, it fetches user by ID from the payload
            // Python: user_id = payload.get('user_id')
            req.user = await User.findOne({ id: decoded.user_id }).select('-password_hash');

            if (!req.user) {
                return res.status(401).json({ detail: 'User not found' });
            }

            next();
        } catch (error) {
            console.error(error);
            // Python code distinguishes between ExpiredSignatureError and InvalidTokenError
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({ detail: 'Token expired' });
            }
            return res.status(401).json({ detail: 'Invalid token' });
        }
    }

    if (!token) {
        return res.status(401).json({ detail: 'Not authorized, no token' });
    }
};

const adminOnly = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ detail: 'Not authorized as an admin' });
    }
};

module.exports = { protect, adminOnly };
