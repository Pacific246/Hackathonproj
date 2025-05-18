const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true,
        enum: [
            'water_supply',
            'electricity',
            'roads',
            'waste_management',
            'public_health',
            'education',
            'transportation',
            'safety',
            'other'
        ]
    },
    subCategory: {
        type: String,
        trim: true
    },
    location: {
        address: String,
        city: String,
        state: String,
        zipCode: String,
        coordinates: {
            type: {
                type: String,
                enum: ['Point'],
                default: 'Point'
            },
            coordinates: {
                type: [Number],
                default: [0, 0]
            }
        }
    },
    status: {
        type: String,
        enum: ['pending', 'in_progress', 'resolved', 'rejected'],
        default: 'pending'
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium'
    },
    submittedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    assignedDepartment: {
        type: String
    },
    attachments: [{
        type: String // URLs to uploaded files
    }],
    updates: [{
        message: String,
        status: String,
        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        timestamp: {
            type: Date,
            default: Date.now
        }
    }],
    resolutionDetails: {
        resolvedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        resolution: String,
        resolvedAt: Date
    }
}, {
    timestamps: true
});

// Index for geospatial queries
complaintSchema.index({ "location.coordinates": "2dsphere" });

// Check if model exists before creating
module.exports = mongoose.models.Complaint || mongoose.model('Complaint', complaintSchema); 