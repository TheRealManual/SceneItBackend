const express = require('express');
const router = express.Router();
const emailController = require('../controllers/emailController');

// Authentication middleware
const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: 'Unauthorized' });
};

// Send movie recommendation email
router.post('/send-recommendations', emailController.sendRecommendationEmail);

// Send liked movies email
router.post('/send-liked-movies', isAuthenticated, emailController.sendLikedMoviesEmail);

// Save user preferences
router.post('/preferences', emailController.saveUserPreferences);

// Get user preferences
router.get('/preferences/:userId', emailController.getUserPreferences);

module.exports = router;
