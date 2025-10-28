const MovieSearchService = require('../services/movieSearch.service');

const movieController = {
  // Search movies based on user preferences
  async searchMovies(req, res) {
    try {
      const preferences = req.body;
      
      console.log('🎬 Movie search request received');
      console.log('User:', req.user?.displayName || 'Guest');
      
      const searchService = new MovieSearchService(process.env.GEMINI_API_KEY);
      const movies = await searchService.searchMovies(preferences, req.user);
      
      res.json({
        success: true,
        count: movies.length,
        movies: movies
      });
      
    } catch (error) {
      console.error('Movie search error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to search movies',
        message: error.message 
      });
    }
  },

  // Get movie by ID
  async getMovieById(req, res) {
    try {
      const { id } = req.params;
      const Movie = require('../models/Movie');
      
      const movie = await Movie.findOne({ tmdbId: parseInt(id) });
      
      if (!movie) {
        return res.status(404).json({
          success: false,
          error: 'Movie not found'
        });
      }
      
      res.json({
        success: true,
        movie: movie
      });
      
    } catch (error) {
      console.error('Get movie error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get movie',
        message: error.message
      });
    }
  },

  // Get random movies for carousel
  async getRandomMovies(req, res) {
    try {
      const count = parseInt(req.query.count) || 20;
      const Movie = require('../models/Movie');
      
      console.log(`🎲 Fetching ${count} random movies for carousel`);
      
      // Build match query
      const matchQuery = { 
        posterPath: { $exists: true, $ne: null },
        voteAverage: { $gte: 5.0 } // Only decent rated movies
      };

      // If user is authenticated, exclude already-rated movies
      if (req.user) {
        const ratedMovieIds = [
          ...req.user.likedMovies.map(m => m.movieId),
          ...req.user.dislikedMovies.map(m => m.movieId)
        ];
        
        if (ratedMovieIds.length > 0) {
          matchQuery.tmdbId = { $nin: ratedMovieIds.map(id => parseInt(id)) };
          console.log(`🚫 Filtering out ${ratedMovieIds.length} already-rated movies`);
        }
      }
      
      // Use MongoDB aggregation to get random movies with better distribution
      const movies = await Movie.aggregate([
        { $match: matchQuery },
        { $sample: { size: count * 2 } }, // Get more than needed
        { $limit: count } // Then limit to requested amount
      ]);
      
      console.log(`✅ Found ${movies.length} random movies`);
      
      res.json({
        success: true,
        count: movies.length,
        movies: movies
      });
      
    } catch (error) {
      console.error('Get random movies error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get random movies',
        message: error.message
      });
    }
  }
};

module.exports = movieController;
