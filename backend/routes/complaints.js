const express = require('express');
const router = express.Router();
const {
    createComplaint,
    getComplaints,
    getComplaint,
    updateStatus,
    assignComplaint,
    addUpdate,
    getStatistics
} = require('../controllers/complaintController');
const { protect, admin, agencyOfficial } = require('../middleware/authMiddleware');
const { validateComplaint, validate } = require('../middleware/validationMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Public routes
router.get('/public', getComplaints); // For public viewing of resolved complaints

// Protected routes - require authentication
router.use(protect);

// Create complaint
router.post('/', upload.array('images', 5), validateComplaint, validate, createComplaint);

// Get all complaints
router.get('/', getComplaints);

// Get statistics
router.get('/statistics', admin, getStatistics);

// Get single complaint
router.get('/:id', getComplaint);

// Update complaint status
router.put('/:id/status', agencyOfficial, updateStatus);

// Add update to complaint
router.post('/:id/updates', addUpdate);

// Assign complaint (admin only)
router.put('/:id/assign', admin, assignComplaint);

module.exports = router; 