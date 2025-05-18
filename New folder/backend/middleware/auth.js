const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Complaint = require('../models/Complaint');

const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization').replace('Bearer ', '');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findOne({ _id: decoded.id });

        if (!user) {
            throw new Error();
        }

        // Update last activity
        user.lastLogin = new Date();
        await user.save();

        req.token = token;
        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Please authenticate.' });
    }
};

// Middleware to check if user has admin role
const adminAuth = async (req, res, next) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
        }
        next();
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// Middleware to check if user has access to department
const departmentAuth = async (req, res, next) => {
    try {
        const complaint = await Complaint.findById(req.params.id);
        if (!complaint) {
            return res.status(404).json({ message: 'Complaint not found' });
        }

        if (req.user.department !== 'all' && req.user.department !== complaint.category) {
            return res.status(403).json({ message: 'Access denied. Wrong department.' });
        }
        
        next();
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    auth,
    adminAuth,
    departmentAuth
}; 