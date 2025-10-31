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
      preferences: {
        description: user.preferences.description,
        yearRange: user.preferences.yearRange,
        runtimeRange: user.preferences.runtimeRange,
        ratingRange: user.preferences.ratingRange,
        ageRating: user.preferences.ageRating,
        moodIntensity: user.preferences.moodIntensity,
        humorLevel: user.preferences.humorLevel,
        violenceLevel: user.preferences.violenceLevel,
        romanceLevel: user.preferences.romanceLevel,
        complexityLevel: user.preferences.complexityLevel,
        genres: Object.fromEntries(user.preferences.genres || new Map()),
        language: user.preferences.language
      },
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

    console.log('PUT /api/user/preferences - Request body:', JSON.stringify(req.body, null, 2));

    const { 
      description,
      yearRange, 
      runtimeRange,
      ratingRange, 
      ageRating,
      moodIntensity,
      humorLevel,
      violenceLevel,
      romanceLevel,
      complexityLevel,
      genres,
      language
    } = req.body;
    
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update all preferences if provided
    if (description !== undefined) user.preferences.description = description;
    if (yearRange) user.preferences.yearRange = yearRange;
    if (runtimeRange) user.preferences.runtimeRange = runtimeRange;
    if (ratingRange) user.preferences.ratingRange = ratingRange;
    if (ageRating !== undefined) user.preferences.ageRating = ageRating;
    if (moodIntensity !== undefined) user.preferences.moodIntensity = moodIntensity;
    if (humorLevel !== undefined) user.preferences.humorLevel = humorLevel;
    if (violenceLevel !== undefined) user.preferences.violenceLevel = violenceLevel;
    if (romanceLevel !== undefined) user.preferences.romanceLevel = romanceLevel;
    if (complexityLevel !== undefined) user.preferences.complexityLevel = complexityLevel;
    if (language !== undefined) user.preferences.language = language;
    
    // Handle genres as a Map
    if (genres !== undefined) {
      if (typeof genres === 'object') {
        user.preferences.genres = new Map(Object.entries(genres));
      }
    }

    await user.save();

    res.json({
      message: 'Preferences updated successfully',
      preferences: {
        description: user.preferences.description,
        yearRange: user.preferences.yearRange,
        runtimeRange: user.preferences.runtimeRange,
        ratingRange: user.preferences.ratingRange,
        ageRating: user.preferences.ageRating,
        moodIntensity: user.preferences.moodIntensity,
        humorLevel: user.preferences.humorLevel,
        violenceLevel: user.preferences.violenceLevel,
        romanceLevel: user.preferences.romanceLevel,
        complexityLevel: user.preferences.complexityLevel,
        genres: Object.fromEntries(user.preferences.genres),
        language: user.preferences.language
      }
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

    const { movieId } = req.body;
    
    if (!movieId) {
      return res.status(400).json({ error: 'movieId is required' });
    }

    // Validate movieId is a valid number
    const parsedId = parseInt(movieId);
    if (isNaN(parsedId) || !isFinite(parsedId) || movieId === 'NaN') {
      return res.status(400).json({ error: 'Invalid movieId: must be a valid number' });
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
        movieId
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

    const { movieId } = req.body;
    
    if (!movieId) {
      return res.status(400).json({ error: 'movieId is required' });
    }

    // Validate movieId is a valid number
    const parsedId = parseInt(movieId);
    if (isNaN(parsedId) || !isFinite(parsedId) || movieId === 'NaN') {
      return res.status(400).json({ error: 'Invalid movieId: must be a valid number' });
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
        movieId
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

    // Fetch full movie details from Movie collection
    const Movie = require('../models/Movie');
    
    // Filter out NaN movieIds and convert to integers
    const validMovieIds = user.likedMovies
      .map(m => parseInt(m.movieId))
      .filter(id => !isNaN(id) && isFinite(id));
    
    const moviesWithDetails = validMovieIds.length > 0
      ? await Movie.find({ tmdbId: { $in: validMovieIds } })
      : [];
    
    console.log('=== GET LIKED MOVIES DEBUG ===');
    console.log('Number of liked movies:', user.likedMovies.length);
    console.log('Number of movies fetched from DB:', moviesWithDetails.length);
    if (moviesWithDetails.length > 0) {
      const firstMovie = moviesWithDetails[0];
      console.log('Sample movie data:', {
        title: firstMovie.title,
        hasKeywords: !!firstMovie.keywords && firstMovie.keywords.length > 0,
        keywordsCount: firstMovie.keywords?.length || 0,
        hasLanguage: !!firstMovie.language,
        language: firstMovie.language,
        hasDirector: !!firstMovie.director,
        director: firstMovie.director,
        hasCast: !!firstMovie.cast && firstMovie.cast.length > 0,
        castCount: firstMovie.cast?.length || 0
      });
    }
    
    // Create a map for quick lookup
    const movieDetailsMap = new Map(moviesWithDetails.map(m => [m.tmdbId, m]));
    
    // Combine user data with full movie details, filtering out NaN IDs
    const likedMoviesWithDetails = user.likedMovies
      .filter(userMovie => {
        const id = parseInt(userMovie.movieId);
        return !isNaN(id) && isFinite(id);
      })
      .map(userMovie => {
        const movieDetails = movieDetailsMap.get(parseInt(userMovie.movieId));
      if (movieDetails) {
        // Calculate average rating
        const averageRating = movieDetails.ratingCount > 0 
          ? Math.round((movieDetails.totalRating / movieDetails.ratingCount) * 2) / 2 
          : 0;
        
        return {
          tmdbId: movieDetails.tmdbId,
          title: movieDetails.title,
          posterPath: movieDetails.posterPath,
          overview: movieDetails.overview,
          releaseDate: movieDetails.releaseDate,
          genres: movieDetails.genres,
          voteAverage: movieDetails.voteAverage,
          ageRating: movieDetails.ageRating,
          runtime: movieDetails.runtime,
          keywords: movieDetails.keywords,
          language: movieDetails.language,
          director: movieDetails.director,
          cast: movieDetails.cast,
          averageRating: averageRating,
          ratingCount: movieDetails.ratingCount,
          likedAt: userMovie.likedAt
        };
      }
      // Fallback to user data if movie not found in database
      return {
        tmdbId: parseInt(userMovie.movieId),
        title: userMovie.title,
        posterPath: userMovie.posterPath,
        likedAt: userMovie.likedAt
      };
    }).filter(m => m !== null);

    res.json({
      likedMovies: likedMoviesWithDetails
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

    // Fetch full movie details from Movie collection
    const Movie = require('../models/Movie');
    
    // Filter out NaN movieIds and convert to integers
    const validMovieIds = user.dislikedMovies
      .map(m => parseInt(m.movieId))
      .filter(id => !isNaN(id) && isFinite(id));
    
    const moviesWithDetails = validMovieIds.length > 0
      ? await Movie.find({ tmdbId: { $in: validMovieIds } })
      : [];
    
    // Create a map for quick lookup
    const movieDetailsMap = new Map(moviesWithDetails.map(m => [m.tmdbId, m]));
    
    // Combine user data with full movie details, filtering out NaN IDs
    const dislikedMoviesWithDetails = user.dislikedMovies
      .filter(userMovie => {
        const id = parseInt(userMovie.movieId);
        return !isNaN(id) && isFinite(id);
      })
      .map(userMovie => {
        const movieDetails = movieDetailsMap.get(parseInt(userMovie.movieId));
      if (movieDetails) {
        // Calculate average rating
        const averageRating = movieDetails.ratingCount > 0 
          ? Math.round((movieDetails.totalRating / movieDetails.ratingCount) * 2) / 2 
          : 0;
        
        return {
          tmdbId: movieDetails.tmdbId,
          title: movieDetails.title,
          posterPath: movieDetails.posterPath,
          overview: movieDetails.overview,
          releaseDate: movieDetails.releaseDate,
          genres: movieDetails.genres,
          voteAverage: movieDetails.voteAverage,
          ageRating: movieDetails.ageRating,
          runtime: movieDetails.runtime,
          keywords: movieDetails.keywords,
          language: movieDetails.language,
          director: movieDetails.director,
          cast: movieDetails.cast,
          averageRating: averageRating,
          ratingCount: movieDetails.ratingCount,
          dislikedAt: userMovie.dislikedAt
        };
      }
      // Fallback to user data if movie not found in database
      return {
        tmdbId: parseInt(userMovie.movieId),
        title: userMovie.title,
        posterPath: userMovie.posterPath,
        dislikedAt: userMovie.dislikedAt
      };
    }).filter(m => m !== null);

    res.json({
      dislikedMovies: dislikedMoviesWithDetails
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

// Add movie to favorites
exports.addToFavorites = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { movieId } = req.body;
    
    if (!movieId) {
      return res.status(400).json({ error: 'movieId is required' });
    }

    // Validate movieId is a valid number
    const parsedId = parseInt(movieId);
    if (isNaN(parsedId) || !isFinite(parsedId) || movieId === 'NaN') {
      return res.status(400).json({ error: 'Invalid movieId: must be a valid number' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if already in favorites
    const alreadyFavorited = user.favoriteMovies.some(
      movie => movie.movieId === movieId
    );

    if (!alreadyFavorited) {
      user.favoriteMovies.push({
        movieId
      });
    }

    await user.save();

    res.json({
      message: 'Movie added to favorites successfully',
      favoriteMovies: user.favoriteMovies
    });
  } catch (error) {
    console.error('Error adding to favorites:', error);
    res.status(500).json({ error: 'Failed to add to favorites' });
  }
};

// Get favorite movies
exports.getFavoriteMovies = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Fetch full movie details from Movie collection
    const Movie = require('../models/Movie');
    
    // Filter out NaN movieIds and convert to integers
    const validMovieIds = user.favoriteMovies
      .map(m => parseInt(m.movieId))
      .filter(id => !isNaN(id) && isFinite(id));
    
    console.log('=== GET FAVORITE MOVIES DEBUG ===');
    console.log('Total favorite movies:', user.favoriteMovies.length);
    console.log('Valid movie IDs:', validMovieIds.length);
    
    const moviesWithDetails = validMovieIds.length > 0 
      ? await Movie.find({ tmdbId: { $in: validMovieIds } })
      : [];
    
    // Create a map for quick lookup
    const movieDetailsMap = new Map(moviesWithDetails.map(m => [m.tmdbId, m]));
    
    // Combine user data with full movie details, filtering out NaN IDs
    const favoriteMoviesWithDetails = user.favoriteMovies
      .filter(userMovie => {
        const id = parseInt(userMovie.movieId);
        return !isNaN(id) && isFinite(id);
      })
      .map(userMovie => {
        const movieDetails = movieDetailsMap.get(parseInt(userMovie.movieId));
      if (movieDetails) {
        // Calculate average rating
        const averageRating = movieDetails.ratingCount > 0 
          ? Math.round((movieDetails.totalRating / movieDetails.ratingCount) * 2) / 2 
          : 0;
        
        return {
          tmdbId: movieDetails.tmdbId,
          title: movieDetails.title,
          posterPath: movieDetails.posterPath,
          overview: movieDetails.overview,
          releaseDate: movieDetails.releaseDate,
          genres: movieDetails.genres,
          voteAverage: movieDetails.voteAverage,
          ageRating: movieDetails.ageRating,
          runtime: movieDetails.runtime,
          keywords: movieDetails.keywords,
          language: movieDetails.language,
          director: movieDetails.director,
          cast: movieDetails.cast,
          averageRating: averageRating,
          ratingCount: movieDetails.ratingCount,
          favoritedAt: userMovie.favoritedAt
        };
      }
      // Fallback to user data if movie not found in database
      return {
        tmdbId: parseInt(userMovie.movieId),
        title: userMovie.title,
        posterPath: userMovie.posterPath,
        favoritedAt: userMovie.favoritedAt
      };
    }).filter(m => m !== null);

    res.json({
      favoriteMovies: favoriteMoviesWithDetails
    });
  } catch (error) {
    console.error('Error getting favorite movies:', error);
    res.status(500).json({ error: 'Failed to get favorite movies' });
  }
};

// Remove a movie from favorites
exports.removeFavoriteMovie = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { movieId } = req.params;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.favoriteMovies = user.favoriteMovies.filter(
      movie => movie.movieId !== movieId
    );

    await user.save();

    res.json({
      message: 'Movie removed from favorites',
      favoriteMovies: user.favoriteMovies
    });
  } catch (error) {
    console.error('Error removing favorite movie:', error);
    res.status(500).json({ error: 'Failed to remove favorite movie' });
  }
};

// Move a movie from liked to disliked
exports.moveToDisliked = async (req, res) => {
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

    // Remove from liked movies
    user.likedMovies = user.likedMovies.filter(
      movie => movie.movieId !== movieId
    );

    // Remove from favorites if it exists
    user.favoriteMovies = user.favoriteMovies.filter(
      movie => movie.movieId !== movieId
    );

    // Check if already in disliked
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
      message: 'Movie moved to disliked successfully',
      likedMovies: user.likedMovies,
      dislikedMovies: user.dislikedMovies,
      favoriteMovies: user.favoriteMovies
    });
  } catch (error) {
    console.error('Error moving to disliked:', error);
    res.status(500).json({ error: 'Failed to move to disliked' });
  }
};

// Move a movie from disliked to liked
exports.moveToLiked = async (req, res) => {
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

    // Remove from disliked movies
    user.dislikedMovies = user.dislikedMovies.filter(
      movie => movie.movieId !== movieId
    );

    // Check if already in liked
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
      message: 'Movie moved to liked successfully',
      likedMovies: user.likedMovies,
      dislikedMovies: user.dislikedMovies
    });
  } catch (error) {
    console.error('Error moving to liked:', error);
    res.status(500).json({ error: 'Failed to move to liked' });
  }
};

// Clear all liked movies
exports.clearLikedMovies = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Clear both liked movies and favorites
    user.likedMovies = [];
    user.favoriteMovies = [];
    await user.save();

    res.json({
      message: 'All liked movies and favorites cleared successfully',
      likedMovies: [],
      favoriteMovies: []
    });
  } catch (error) {
    console.error('Error clearing liked movies:', error);
    res.status(500).json({ error: 'Failed to clear liked movies' });
  }
};

// Clear all disliked movies
exports.clearDislikedMovies = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.dislikedMovies = [];
    await user.save();

    res.json({
      message: 'All disliked movies cleared successfully',
      dislikedMovies: []
    });
  } catch (error) {
    console.error('Error clearing disliked movies:', error);
    res.status(500).json({ error: 'Failed to clear disliked movies' });
  }
};

// Watch a movie (add to watched list with rating)
exports.watchMovie = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { movieId, rating } = req.body;
    
    if (!movieId) {
      return res.status(400).json({ error: 'movieId is required' });
    }

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    // Validate rating is in increments of 0.5
    if (rating * 2 !== Math.floor(rating * 2)) {
      return res.status(400).json({ error: 'Rating must be in increments of 0.5' });
    }

    // Validate movieId is a valid number
    const parsedId = parseInt(movieId);
    if (isNaN(parsedId) || !isFinite(parsedId) || movieId === 'NaN') {
      return res.status(400).json({ error: 'Invalid movieId: must be a valid number' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if already watched
    const existingWatch = user.watchedMovies.find(m => m.movieId === movieId);
    
    if (existingWatch) {
      return res.status(400).json({ error: 'Movie already watched. Use update endpoint to change rating.' });
    }

    // Add to user's watched movies
    user.watchedMovies.push({
      movieId,
      rating
    });

    await user.save();

    // Update movie's rating statistics
    const Movie = require('../models/Movie');
    const movie = await Movie.findOne({ tmdbId: parsedId });
    
    if (movie) {
      movie.totalRating = (movie.totalRating || 0) + rating;
      movie.ratingCount = (movie.ratingCount || 0) + 1;
      await movie.save();
    }

    res.json({
      message: 'Movie marked as watched successfully',
      watchedMovies: user.watchedMovies
    });
  } catch (error) {
    console.error('Error watching movie:', error);
    res.status(500).json({ error: 'Failed to watch movie' });
  }
};

// Unwatch a movie (remove from watched list)
exports.unwatchMovie = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { movieId } = req.params;

    if (!movieId) {
      return res.status(400).json({ error: 'movieId is required' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Find the watched movie to get the rating
    const watchedMovie = user.watchedMovies.find(m => m.movieId === movieId);
    
    if (!watchedMovie) {
      return res.status(404).json({ error: 'Movie not found in watched list' });
    }

    const userRating = watchedMovie.rating;

    // Remove from user's watched movies
    user.watchedMovies = user.watchedMovies.filter(m => m.movieId !== movieId);
    await user.save();

    // Update movie's rating statistics
    const Movie = require('../models/Movie');
    const parsedId = parseInt(movieId);
    
    if (!isNaN(parsedId) && isFinite(parsedId)) {
      const movie = await Movie.findOne({ tmdbId: parsedId });
      
      if (movie && movie.ratingCount > 0) {
        movie.totalRating = Math.max(0, (movie.totalRating || 0) - userRating);
        movie.ratingCount = Math.max(0, (movie.ratingCount || 0) - 1);
        await movie.save();
      }
    }

    res.json({
      message: 'Movie removed from watched list',
      watchedMovies: user.watchedMovies
    });
  } catch (error) {
    console.error('Error unwatching movie:', error);
    res.status(500).json({ error: 'Failed to unwatch movie' });
  }
};

// Update a watched movie's rating
exports.updateWatchedRating = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { movieId } = req.params;
    const { rating } = req.body;

    if (!movieId) {
      return res.status(400).json({ error: 'movieId is required' });
    }

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    // Validate rating is in increments of 0.5
    if (rating * 2 !== Math.floor(rating * 2)) {
      return res.status(400).json({ error: 'Rating must be in increments of 0.5' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Find the watched movie
    const watchedMovie = user.watchedMovies.find(m => m.movieId === movieId);
    
    if (!watchedMovie) {
      return res.status(404).json({ error: 'Movie not found in watched list' });
    }

    const oldRating = watchedMovie.rating;

    // Update the rating
    watchedMovie.rating = rating;
    await user.save();

    // Update movie's rating statistics
    const Movie = require('../models/Movie');
    const parsedId = parseInt(movieId);
    
    if (!isNaN(parsedId) && isFinite(parsedId)) {
      const movie = await Movie.findOne({ tmdbId: parsedId });
      
      if (movie) {
        // Remove old rating and add new rating
        movie.totalRating = (movie.totalRating || 0) - oldRating + rating;
        await movie.save();
      }
    }

    res.json({
      message: 'Rating updated successfully',
      watchedMovies: user.watchedMovies
    });
  } catch (error) {
    console.error('Error updating watched rating:', error);
    res.status(500).json({ error: 'Failed to update rating' });
  }
};

// Get watched movies
exports.getWatchedMovies = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Fetch full movie details from Movie collection
    const Movie = require('../models/Movie');
    
    // Filter out NaN movieIds and convert to integers
    const validMovieIds = user.watchedMovies
      .map(m => parseInt(m.movieId))
      .filter(id => !isNaN(id) && isFinite(id));
    
    const moviesWithDetails = validMovieIds.length > 0
      ? await Movie.find({ tmdbId: { $in: validMovieIds } })
      : [];
    
    // Create a map for quick lookup
    const movieDetailsMap = new Map(moviesWithDetails.map(m => [m.tmdbId, m]));
    
    // Combine user data with full movie details
    const watchedMoviesWithDetails = user.watchedMovies
      .filter(userMovie => {
        const id = parseInt(userMovie.movieId);
        return !isNaN(id) && isFinite(id);
      })
      .map(userMovie => {
        const movieDetails = movieDetailsMap.get(parseInt(userMovie.movieId));
        
        if (movieDetails) {
          // Calculate average rating
          const averageRating = movieDetails.ratingCount > 0 
            ? movieDetails.totalRating / movieDetails.ratingCount 
            : 0;
          
          return {
            tmdbId: movieDetails.tmdbId,
            title: movieDetails.title,
            posterPath: movieDetails.posterPath,
            overview: movieDetails.overview,
            releaseDate: movieDetails.releaseDate,
            genres: movieDetails.genres,
            voteAverage: movieDetails.voteAverage,
            ageRating: movieDetails.ageRating,
            runtime: movieDetails.runtime,
            keywords: movieDetails.keywords,
            language: movieDetails.language,
            director: movieDetails.director,
            cast: movieDetails.cast,
            userRating: userMovie.rating,
            averageRating: Math.round(averageRating * 2) / 2, // Round to nearest 0.5
            ratingCount: movieDetails.ratingCount,
            watchedAt: userMovie.watchedAt
          };
        }
        
        // Fallback to user data if movie not found in database
        return {
          tmdbId: parseInt(userMovie.movieId),
          userRating: userMovie.rating,
          watchedAt: userMovie.watchedAt
        };
      })
      .filter(m => m !== null);

    res.json({
      watchedMovies: watchedMoviesWithDetails
    });
  } catch (error) {
    console.error('Error getting watched movies:', error);
    res.status(500).json({ error: 'Failed to get watched movies' });
  }
};

