const { body, validationResult } = require('express-validator');

const validateRegistration = [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Please enter a valid email'),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long'),
    body('phone').optional().isMobilePhone().withMessage('Please enter a valid phone number'),
    body('address').optional().isObject().withMessage('Address must be an object'),
];

const validateComplaint = [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('description').trim().notEmpty().withMessage('Description is required'),
    body('category')
        .isIn(['water_supply', 'electricity', 'roads', 'waste_management', 'public_health', 'education', 'transportation', 'safety', 'other'])
        .withMessage('Invalid category'),
    body('location').optional().isObject().withMessage('Location must be an object'),
];

const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

module.exports = {
    validateRegistration,
    validateComplaint,
    validate
}; 