const express = require('express');
const router = express.Router();
const GameRating = require('../models/GameRating');

// Submit game rating
router.post('/submit', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { overallRating, movieFeedback, gameMovies } = req.body;

    if (!overallRating || overallRating < 1 || overallRating > 5) {
      return res.status(400).json({ error: 'Invalid overall rating' });
    }

    if (!movieFeedback || !Array.isArray(movieFeedback)) {
      return res.status(400).json({ error: 'Invalid movie feedback' });
    }

    // Convert movieFeedback object to array format
    const feedbackArray = Object.entries(movieFeedback).map(([movieId, feedback]) => ({
      movieId: parseInt(movieId),
      feedback
    }));

    const gameRating = new GameRating({
      userId: req.user._id,
      overallRating,
      movieFeedback: feedbackArray,
      gameMovies: gameMovies || []
    });

    await gameRating.save();

    res.json({ 
      success: true,
      message: 'Game rating submitted successfully'
    });
  } catch (error) {
    console.error('Error submitting game rating:', error);
    res.status(500).json({ error: 'Failed to submit game rating' });
  }
});

// Get user's game ratings
router.get('/my-ratings', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const ratings = await GameRating.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({ ratings });
  } catch (error) {
    console.error('Error fetching game ratings:', error);
    res.status(500).json({ error: 'Failed to fetch game ratings' });
  }
});

// Get analytics (admin/stats endpoint)
router.get('/analytics', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const userRatings = await GameRating.find({ userId: req.user._id });
    
    const averageRating = userRatings.length > 0
      ? userRatings.reduce((sum, r) => sum + r.overallRating, 0) / userRatings.length
      : 0;

    const totalGamesRated = userRatings.length;

    res.json({
      averageRating: averageRating.toFixed(2),
      totalGamesRated
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

module.exports = router;
