const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Complaint = require('../models/complaint');

// Protect routes - require authentication
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

        // Update last activity
        req.user.lastLogin = new Date();
        await req.user.save();

        next();
    } catch (error) {
        res.status(401).json({ message: 'Not authorized - Invalid token' });
    }
};

// Middleware to check if user is admin
exports.admin = async (req, res, next) => {
    try {
        if (req.user && req.user.role === 'admin') {
            next();
        } else {
            res.status(403).json({ message: 'Access denied - Admin privileges required' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// Middleware to check if user is agency official
exports.agencyOfficial = async (req, res, next) => {
    try {
        if (req.user && (req.user.role === 'agency_official' || req.user.role === 'admin')) {
            next();
        } else {
            res.status(403).json({ message: 'Access denied - Agency official privileges required' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// Middleware to check if user has access to department
exports.departmentAuth = async (req, res, next) => {
    try {
        const complaint = await Complaint.findById(req.params.id);
        if (!complaint) {
            return res.status(404).json({ message: 'Complaint not found' });
        }

        if (req.user.department !== 'all' && req.user.department !== complaint.category) {
            return res.status(403).json({ message: 'Access denied - Wrong department' });
        }
        
        next();
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
}; 