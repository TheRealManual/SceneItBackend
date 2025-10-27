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

// Search movies (authenticated users only)
router.post('/search', isAuthenticated, movieController.searchMovies);

// Get movie by ID
router.get('/:id', movieController.getMovieById);

module.exports = router;
