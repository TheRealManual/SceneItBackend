const MovieSearchService = require('../services/movieSearch.service');
const MovieDatabaseService = require('../services/movieDatabase.service');

const movieController = {
  // Search movies based on user preferences
  async searchMovies(req, res) {
    try {
      const preferences = req.body;
      
      console.log('🎬 Movie search request received');
      console.log('User:', req.user?.displayName || 'Guest');
      
      const searchService = new MovieSearchService(
        process.env.GEMINI_API_KEY,
        process.env.TMDB_ACCESS_TOKEN
      );
      const movies = await searchService.searchMovies(preferences, req.user);
      
      res.json({
        success: true,
        count: movies.length,
        movies: movies
      });
      
    } catch (error) {
      console.error('Movie search error:', error);
      
      // Check if it's a Gemini AI error
      if (error.code === 'GEMINI_UNAVAILABLE') {
        return res.status(503).json({ 
          success: false,
          error: 'AI service temporarily unavailable. Please try again.',
          code: 'GEMINI_UNAVAILABLE'
        });
      }
      
      // Check if it's a TMDB API error
      if (error.response?.status >= 500 || error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
        return res.status(503).json({ 
          success: false,
          error: 'Movie database temporarily unavailable. Please try again.',
          code: 'TMDB_UNAVAILABLE'
        });
      }
      
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
      const movieDb = new MovieDatabaseService(process.env.TMDB_ACCESS_TOKEN);
      
      const movie = await movieDb.getMovieById(parseInt(id));
      
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
      
      // Check if it's a TMDB API error
      if (error.response?.status >= 500 || error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
        return res.status(503).json({ 
          success: false,
          error: 'Movie database temporarily unavailable. Please try again.',
          code: 'TMDB_UNAVAILABLE'
        });
      }
      
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
      const movieDb = new MovieDatabaseService(process.env.TMDB_ACCESS_TOKEN);
      
      console.log(`🎲 Fetching ${count} random movies for carousel`);
      
      const movies = await movieDb.getRandomMovies(count);
      
      // Filter out already-rated movies if user is authenticated
      let filteredMovies = movies;
      if (req.user) {
        const ratedMovieIds = new Set([
          ...req.user.likedMovies.map(m => m.movieId),
          ...req.user.dislikedMovies.map(m => m.movieId)
        ].map(id => parseInt(id)));
        
        filteredMovies = movies.filter(m => !ratedMovieIds.has(m.tmdbId));
        
        if (filteredMovies.length < count && ratedMovieIds.size > 0) {
          console.log(`🚫 Filtered out ${movies.length - filteredMovies.length} already-rated movies`);
        }
      }
      
      console.log(`✅ Returning ${filteredMovies.length} random movies`);
      
      res.json({
        success: true,
        count: filteredMovies.length,
        movies: filteredMovies
      });
      
    } catch (error) {
      console.error('Get random movies error:', error);
      
      // Check if it's a TMDB API error
      if (error.response?.status >= 500 || error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
        return res.status(503).json({ 
          success: false,
          error: 'Movie database temporarily unavailable. Please try again.',
          code: 'TMDB_UNAVAILABLE'
        });
      }
      
      res.status(500).json({
        success: false,
        error: 'Failed to get random movies',
        message: error.message
      });
    }
  }
};

module.exports = movieController;
