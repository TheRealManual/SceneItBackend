const User = require('../models/User');

// Get user profile with all data
exports.getProfile = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: user.googleId,
      displayName: user.displayName,
      email: user.email,
      photo: user.photo,
      preferences: user.preferences,
      likedMoviesCount: user.likedMovies.length,
      dislikedMoviesCount: user.dislikedMovies.length,
      lastActive: user.lastActive
    });
  } catch (error) {
    console.error('Error getting profile:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
};

// Update user preferences
exports.updatePreferences = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { yearRange, ratingRange, genres } = req.body;
    
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update preferences
    if (yearRange) user.preferences.yearRange = yearRange;
    if (ratingRange) user.preferences.ratingRange = ratingRange;
    if (genres !== undefined) user.preferences.genres = genres;

    await user.save();

    res.json({
      message: 'Preferences updated successfully',
      preferences: user.preferences
    });
  } catch (error) {
    console.error('Error updating preferences:', error);
    res.status(500).json({ error: 'Failed to update preferences' });
  }
};

// Like a movie
exports.likeMovie = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { movieId, title, posterPath } = req.body;
    
    if (!movieId) {
      return res.status(400).json({ error: 'movieId is required' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Remove from disliked if it exists
    user.dislikedMovies = user.dislikedMovies.filter(
      movie => movie.movieId !== movieId
    );

    // Check if already liked
    const alreadyLiked = user.likedMovies.some(
      movie => movie.movieId === movieId
    );

    if (!alreadyLiked) {
      user.likedMovies.push({
        movieId,
        title: title || '',
        posterPath: posterPath || ''
      });
    }

    await user.save();

    res.json({
      message: 'Movie liked successfully',
      likedMovies: user.likedMovies
    });
  } catch (error) {
    console.error('Error liking movie:', error);
    res.status(500).json({ error: 'Failed to like movie' });
  }
};

// Dislike a movie
exports.dislikeMovie = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { movieId, title, posterPath } = req.body;
    
    if (!movieId) {
      return res.status(400).json({ error: 'movieId is required' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Remove from liked if it exists
    user.likedMovies = user.likedMovies.filter(
      movie => movie.movieId !== movieId
    );

    // Check if already disliked
    const alreadyDisliked = user.dislikedMovies.some(
      movie => movie.movieId === movieId
    );

    if (!alreadyDisliked) {
      user.dislikedMovies.push({
        movieId,
        title: title || '',
        posterPath: posterPath || ''
      });
    }

    await user.save();

    res.json({
      message: 'Movie disliked successfully',
      dislikedMovies: user.dislikedMovies
    });
  } catch (error) {
    console.error('Error disliking movie:', error);
    res.status(500).json({ error: 'Failed to dislike movie' });
  }
};

// Get liked movies
exports.getLikedMovies = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      likedMovies: user.likedMovies
    });
  } catch (error) {
    console.error('Error getting liked movies:', error);
    res.status(500).json({ error: 'Failed to get liked movies' });
  }
};

// Get disliked movies
exports.getDislikedMovies = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      dislikedMovies: user.dislikedMovies
    });
  } catch (error) {
    console.error('Error getting disliked movies:', error);
    res.status(500).json({ error: 'Failed to get disliked movies' });
  }
};

// Remove a movie from liked list
exports.removeLikedMovie = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { movieId } = req.params;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.likedMovies = user.likedMovies.filter(
      movie => movie.movieId !== movieId
    );

    await user.save();

    res.json({
      message: 'Movie removed from liked list',
      likedMovies: user.likedMovies
    });
  } catch (error) {
    console.error('Error removing liked movie:', error);
    res.status(500).json({ error: 'Failed to remove liked movie' });
  }
};
