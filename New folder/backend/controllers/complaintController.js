const Complaint = require('../models/Complaint');
const Department = require('../models/Department');

// Create new complaint
exports.createComplaint = async (req, res) => {
    try {
        const { title, description, category, location } = req.body;
        
        // Handle file uploads
        const attachments = req.files ? req.files.map(file => `/uploads/${file.filename}`) : [];

        const complaint = await Complaint.create({
            title,
            description,
            category,
            location,
            submittedBy: req.user.id,
            attachments
        });

        // Find appropriate department based on category
        const department = await Department.findOne({ 
            categories: category,
            active: true 
        });

        if (department) {
            complaint.assignedDepartment = department._id;
            await complaint.save();
        }

        res.status(201).json(complaint);
    } catch (error) {
        res.status(500);
        throw new Error('Error creating complaint: ' + error.message);
    }
};

// Get all complaints (with filters)
exports.getComplaints = async (req, res) => {
    try {
        const { category, status, priority } = req.query;
        const filter = {};

        // Add filters if provided
        if (category) filter.category = category;
        if (status) filter.status = status;
        if (priority) filter.priority = priority;

        // If user is not admin, only show their complaints
        if (req.user.role !== 'admin') {
            filter.submittedBy = req.user.id;
        }

        const complaints = await Complaint.find(filter)
            .populate('submittedBy', 'name email')
            .populate('assignedTo', 'name email')
            .sort('-createdAt');

        res.json(complaints);
    } catch (error) {
        res.status(500);
        throw new Error('Error fetching complaints: ' + error.message);
    }
};

// Get single complaint
exports.getComplaint = async (req, res) => {
    try {
        const complaint = await Complaint.findById(req.params.id)
            .populate('submittedBy', 'name email')
            .populate('assignedTo', 'name email')
            .populate('updates.updatedBy', 'name email');

        if (!complaint) {
            res.status(404);
            throw new Error('Complaint not found');
        }

        res.json(complaint);
    } catch (error) {
        res.status(error.status || 500);
        throw new Error('Error fetching complaint: ' + error.message);
    }
};

// Update complaint status
exports.updateStatus = async (req, res) => {
    try {
        const { status, message } = req.body;
        const complaint = await Complaint.findById(req.params.id);

        if (!complaint) {
            res.status(404);
            throw new Error('Complaint not found');
        }

        complaint.status = status;
        complaint.updates.push({
            message,
            status,
            updatedBy: req.user.id
        });

        if (status === 'resolved') {
            complaint.resolutionDetails = {
                resolvedBy: req.user.id,
                resolution: message,
                resolvedAt: Date.now()
            };
        }

        await complaint.save();
        res.json(complaint);
    } catch (error) {
        res.status(error.status || 500);
        throw new Error('Error updating complaint status: ' + error.message);
    }
};

// Assign complaint to official
exports.assignComplaint = async (req, res) => {
    try {
        const { assignedTo, assignedDepartment } = req.body;
        const complaint = await Complaint.findById(req.params.id);

        if (!complaint) {
            res.status(404);
            throw new Error('Complaint not found');
        }

        complaint.assignedTo = assignedTo;
        complaint.assignedDepartment = assignedDepartment;
        complaint.updates.push({
            message: `Complaint assigned to ${assignedDepartment}`,
            status: complaint.status,
            updatedBy: req.user.id
        });

        await complaint.save();
        res.json(complaint);
    } catch (error) {
        res.status(error.status || 500);
        throw new Error('Error assigning complaint: ' + error.message);
    }
};

// Add comment/update to complaint
exports.addUpdate = async (req, res) => {
    try {
        const { message } = req.body;
        const complaint = await Complaint.findById(req.params.id);

        if (!complaint) {
            res.status(404);
            throw new Error('Complaint not found');
        }

        complaint.updates.push({
            message,
            status: complaint.status,
            updatedBy: req.user.id
        });

        await complaint.save();
        res.json(complaint);
    } catch (error) {
        res.status(error.status || 500);
        throw new Error('Error adding update: ' + error.message);
    }
};

// Get complaint statistics
exports.getStatistics = async (req, res) => {
    try {
        let query = {};
        if (req.user.department !== 'all') {
            query.category = req.user.department;
        }

        const stats = await Complaint.aggregate([
            { $match: query },
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 },
                    new: {
                        $sum: {
                            $cond: [{ $eq: ['$status', 'Submitted'] }, 1, 0]
                        }
                    },
                    inProgress: {
                        $sum: {
                            $cond: [{ $eq: ['$status', 'In Progress'] }, 1, 0]
                        }
                    },
                    resolved: {
                        $sum: {
                            $cond: [{ $eq: ['$status', 'Resolved'] }, 1, 0]
                        }
                    },
                    avgResolutionTime: {
                        $avg: {
                            $cond: [
                                { $eq: ['$status', 'Resolved'] },
                                { $subtract: ['$resolvedAt', '$createdAt'] },
                                0
                            ]
                        }
                    }
                }
            }
        ]);

        // Get department-wise statistics
        const departmentStats = await Complaint.aggregate([
            { $match: query },
            {
                $group: {
                    _id: '$category',
                    count: { $sum: 1 },
                    resolved: {
                        $sum: {
                            $cond: [{ $eq: ['$status', 'Resolved'] }, 1, 0]
                        }
                    }
                }
            }
        ]);

        res.json({
            overall: stats[0] || {
                total: 0,
                new: 0,
                inProgress: 0,
                resolved: 0,
                avgResolutionTime: 0
            },
            departmentWise: departmentStats
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch statistics', error: error.message });
    }
};

// Export complaints data
exports.exportComplaints = async (req, res) => {
    try {
        const { format } = req.query;
        let query = {};

        if (req.user.department !== 'all') {
            query.category = req.user.department;
        }

        const complaints = await Complaint.find(query)
            .populate('assignedTo', 'firstName lastName')
            .sort({ createdAt: -1 });

        if (format === 'csv') {
            // Convert to CSV
            const fields = ['id', 'category', 'description', 'location', 'status', 'submittedBy.name', 'createdAt'];
            const csv = complaints.map(complaint => {
                return {
                    id: complaint._id,
                    category: complaint.category,
                    description: complaint.description,
                    location: complaint.location,
                    status: complaint.status,
                    submittedBy: complaint.submittedBy.name,
                    createdAt: complaint.createdAt
                };
            });

            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename=complaints.csv');
            res.csv(csv, { fields });
        } else {
            // Default to JSON
            res.json(complaints);
        }
    } catch (error) {
        res.status(500).json({ message: 'Failed to export complaints', error: error.message });
    }
}; 