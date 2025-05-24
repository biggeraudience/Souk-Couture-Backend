const jwt = require('jsonwebtoken');

const generateToken = (id, role) => {
    return jwt.sign({ id, role }, process.env.JWT_SECRET, {
        expiresIn: '1h', // e.g., 1 hour, or 1d for 1 day
    });
};

module.exports = generateToken;
