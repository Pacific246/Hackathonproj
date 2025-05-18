const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.protect = async (req, res, next) => {
    try {
        let token;

        // Check for token in headers
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({ message: 'Not authorized - No token' });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Get user from token
        req.user = await User.findById(decoded.id).select('-password');
        if (!req.user) {
            return res.status(401).json({ message: 'Not authorized - User not found' });
        }

        next();
    } catch (error) {
        res.status(401).json({ message: 'Not authorized - Invalid token' });
    }
};

// Middleware to check if user is admin
exports.admin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ message: 'Not authorized - Admin access required' });
    }
};

// Middleware to check if user is agency official
exports.agencyOfficial = (req, res, next) => {
    if (req.user && req.user.role === 'agency_official') {
        next();
    } else {
        res.status(403).json({ message: 'Not authorized - Agency official access required' });
    }
}; 