const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const Suggestion = require('../models/Suggestion');

// Get all suggestions
router.get('/', protect, async (req, res) => {
    try {
        const suggestions = await Suggestion.find()
            .populate('submittedBy', 'name email')
            .sort('-createdAt');
        res.json(suggestions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create suggestion
router.post('/', protect, async (req, res) => {
    try {
        const { title, description, category } = req.body;
        const suggestion = await Suggestion.create({
            title,
            description,
            category,
            submittedBy: req.user.id
        });
        res.status(201).json(suggestion);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Vote on suggestion
router.post('/:id/vote', protect, async (req, res) => {
    try {
        const suggestion = await Suggestion.findById(req.params.id);
        if (!suggestion) {
            return res.status(404).json({ message: 'Suggestion not found' });
        }
        suggestion.votes += 1;
        await suggestion.save();
        res.json(suggestion);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Update suggestion status (admin only)
router.put('/:id/status', protect, admin, async (req, res) => {
    try {
        const { status } = req.body;
        const suggestion = await Suggestion.findById(req.params.id);
        if (!suggestion) {
            return res.status(404).json({ message: 'Suggestion not found' });
        }
        suggestion.status = status;
        await suggestion.save();
        res.json(suggestion);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Add comment to suggestion
router.post('/:id/comments', protect, async (req, res) => {
    try {
        const { text } = req.body;
        const suggestion = await Suggestion.findById(req.params.id);
        if (!suggestion) {
            return res.status(404).json({ message: 'Suggestion not found' });
        }
        suggestion.comments.push({
            text,
            createdBy: req.user.id
        });
        await suggestion.save();
        res.json(suggestion);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

module.exports = router; 