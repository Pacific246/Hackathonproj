const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    code: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    categories: [{
        type: String,
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
    }],
    head: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    contactEmail: {
        type: String,
        required: true
    },
    contactPhone: {
        type: String,
        required: true
    },
    address: {
        street: String,
        city: String,
        state: String,
        zipCode: String
    },
    jurisdiction: {
        type: String,
        required: true
    },
    active: {
        type: Boolean,
        default: true
    },
    serviceAreas: [{
        type: String
    }],
    responseTimeTarget: {
        type: Number, // in hours
        default: 48
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Department', departmentSchema); 