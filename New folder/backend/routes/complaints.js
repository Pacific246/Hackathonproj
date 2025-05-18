const express = require('express');
const router = express.Router();
const {
    createComplaint,
    getComplaints,
    getComplaint,
    updateStatus,
    assignComplaint,
    addUpdate
} = require('../controllers/complaintController');
const { protect, admin, agencyOfficial } = require('../middleware/authMiddleware');
const { validateComplaint, validate } = require('../middleware/validationMiddleware');
const upload = require('../middleware/uploadMiddleware');
const Complaint = require('../models/complaint');
const auth = require('../middleware/auth');

// Public routes
router.get('/public', getComplaints); // For public viewing of resolved complaints

// Protected routes - require authentication
router.use(protect);
router.post('/', upload.array('images', 5), validateComplaint, validate, createComplaint);
router.get('/', getComplaints);
router.get('/:id', getComplaint);
router.post('/:id/updates', addUpdate);

// Agency official routes
router.put('/:id/status', agencyOfficial, updateStatus);

// Admin only routes
router.put('/:id/assign', admin, assignComplaint);

// Get all complaints
router.get('/all', auth, async (req, res) => {
    try {
        const complaints = await Complaint.find(
            req.user.role === 'admin' 
                ? req.user.department === 'all' 
                    ? {} 
                    : { category: req.user.department }
                : { email: req.user.email }
        );
        res.json(complaints);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Create new complaint
router.post('/all', auth, async (req, res) => {
    const complaint = new Complaint({
        ...req.body,
        email: req.user.email,
        status: 'Submitted'
    });

    try {
        const newComplaint = await complaint.save();
        
        // Get io instance
        const io = req.app.get('io');
        
        // Emit to admin room
        io.to('admin').emit('new_complaint', newComplaint);
        
        // Emit to user's personal room
        io.to(req.user.email).emit('complaint_update', newComplaint);
        
        res.status(201).json(newComplaint);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Update complaint status
router.patch('/:id/status', auth, async (req, res) => {
    try {
        const complaint = await Complaint.findById(req.params.id);
        
        if (!complaint) {
            return res.status(404).json({ message: 'Complaint not found' });
        }

        // Only admins can update status
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized' });
        }

        complaint.status = req.body.status;
        complaint.updatedAt = Date.now();
        
        const updatedComplaint = await complaint.save();
        
        // Get io instance
        const io = req.app.get('io');
        
        // Emit to admin room
        io.to('admin').emit('complaint_update', updatedComplaint);
        
        // Emit to complaint owner's room
        io.to(complaint.email).emit('complaint_update', updatedComplaint);
        
        res.json(updatedComplaint);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

module.exports = router; 