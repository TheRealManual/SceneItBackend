const express = require('express');
const router = express.Router();
const movieController = require('../controllers/movie.controller');

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: 'Not authenticated' });
};

// Optional authentication middleware (doesn't fail if not authenticated)
const optionalAuth = (req, res, next) => {
  // Just continue - req.user will be set if authenticated, undefined otherwise
  next();
};

// Search movies (authenticated users only)
router.post('/search', isAuthenticated, movieController.searchMovies);

// Get random movies for carousel (optional auth for filtering)
router.get('/random', optionalAuth, movieController.getRandomMovies);

// Get movie by ID
router.get('/:id', movieController.getMovieById);

// Share movie via email (authenticated users only)
router.post('/:id/share', isAuthenticated, movieController.shareMovie);

module.exports = router;
