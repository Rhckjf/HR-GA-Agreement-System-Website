const jwt = require('jsonwebtoken');

const generateToken = (id) => {
    return jwt.sign({ user_id: id }, process.env.JWT_SECRET || 'your-secret-key-change-in-production', {
        expiresIn: '24h', // Matching JWT_EXPIRATION_HOURS = 24
    });
};

module.exports = generateToken;
