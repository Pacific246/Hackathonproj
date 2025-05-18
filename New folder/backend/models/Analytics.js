const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema({
    timeframe: {
        start: {
            type: Date,
            required: true
        },
        end: {
            type: Date,
            required: true
        }
    },
    metrics: {
        totalComplaints: {
            type: Number,
            default: 0
        },
        resolvedComplaints: {
            type: Number,
            default: 0
        },
        pendingComplaints: {
            type: Number,
            default: 0
        },
        averageResolutionTime: {
            type: Number, // in hours
            default: 0
        }
    },
    categoryBreakdown: [{
        category: String,
        count: Number,
        percentageResolved: Number
    }],
    departmentPerformance: [{
        department: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Department'
        },
        totalAssigned: Number,
        resolved: Number,
        averageResponseTime: Number,
        satisfactionScore: Number
    }],
    locationHotspots: [{
        location: {
            coordinates: {
                type: [Number],
                default: [0, 0]
            },
            address: String
        },
        complaintCount: Number,
        categories: [{
            category: String,
            count: Number
        }]
    }],
    citizenEngagement: {
        totalUsers: Number,
        activeUsers: Number,
        averageFeedbackScore: Number
    },
    tags: [{
        name: String,
        count: Number
    }]
}, {
    timestamps: true
});

// Index for geospatial queries on hotspots
analyticsSchema.index({ "locationHotspots.coordinates": "2dsphere" });

module.exports = mongoose.model('Analytics', analyticsSchema); 