const MovieSearchService = require('../services/movieSearch.service');

const movieController = {
  // Search movies based on user preferences
  async searchMovies(req, res) {
    try {
      const preferences = req.body;
      
      console.log('🎬 Movie search request received');
      console.log('User:', req.user?.displayName || 'Guest');
      
      const searchService = new MovieSearchService(process.env.GEMINI_API_KEY);
      const movies = await searchService.searchMovies(preferences);
      
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
      
      // Use MongoDB aggregation to get random movies
      const movies = await Movie.aggregate([
        { $sample: { size: count } }
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
