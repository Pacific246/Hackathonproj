const express = require('express');
const router = express.Router();
const { register, login, getCurrentUser, updateProfile, requestPasswordReset, forgotPassword, resetPassword } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { validateRegistration, validate } = require('../middleware/validationMiddleware');

// Public routes
router.post('/register', validateRegistration, validate, register);
router.post('/login', login);
router.post('/password-reset-request', requestPasswordReset);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Protected routes
router.get('/me', protect, getCurrentUser);
router.put('/profile', protect, updateProfile);

module.exports = router; 