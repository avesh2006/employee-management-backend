const express = require('express');
const router = express.Router();

// Import controller functions
const { register, login, getProfile } = require('../controllers/authController');

// Import middleware
const { protect } = require('../middleware/authMiddleware');

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected route
router.get('/profile', protect, getProfile);

// Export router
module.exports = router;