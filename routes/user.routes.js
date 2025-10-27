const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
  console.log(`${req.method} ${req.path} - isAuthenticated check - Auth: ${req.isAuthenticated()}`);
  if (req.isAuthenticated()) {
    return next();
  }
  console.log('Authentication failed - returning 401');
  res.status(401).json({ error: 'Not authenticated' });
};

// Get user profile
router.get('/profile', isAuthenticated, userController.getProfile);

// Update user preferences
router.put('/preferences', isAuthenticated, userController.updatePreferences);

// Like/dislike movies
router.post('/movies/like', isAuthenticated, userController.likeMovie);
router.post('/movies/dislike', isAuthenticated, userController.dislikeMovie);

// Get liked/disliked movies
router.get('/movies/liked', isAuthenticated, userController.getLikedMovies);
router.get('/movies/disliked', isAuthenticated, userController.getDislikedMovies);

// Remove movie from liked list
router.delete('/movies/liked/:movieId', isAuthenticated, userController.removeLikedMovie);

module.exports = router;