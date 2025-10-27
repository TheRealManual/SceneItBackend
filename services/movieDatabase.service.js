const axios = require('axios');

class MovieDatabaseService {
  constructor(accessToken) {
    this.accessToken = accessToken;
    this.baseUrl = 'https://api.themoviedb.org/3';
    this.headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    };
  }

  async fetchMovies(page = 1) {
    try {
      const response = await axios.get(`${this.baseUrl}/discover/movie`, {
        headers: this.headers,
        params: {
          page: page,
          language: 'en-US',
          sort_by: 'popularity.desc',
          include_adult: false,
          include_video: false
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching movies:', error.message);
      throw error;
    }
  }

  async fetchMovieDetails(movieId) {
    try {
      const response = await axios.get(`${this.baseUrl}/movie/${movieId}`, {
        headers: this.headers,
        params: {
          append_to_response: 'credits,keywords,release_dates'
        }
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching movie ${movieId}:`, error.message);
      throw error;
    }
  }

  async searchMovies(query, page = 1) {
    try {
      const response = await axios.get(`${this.baseUrl}/search/movie`, {
        headers: this.headers,
        params: {
          query: query,
          page: page,
          language: 'en-US',
          include_adult: false
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error searching movies:', error.message);
      throw error;
    }
  }

  async getGenres() {
    try {
      const response = await axios.get(`${this.baseUrl}/genre/movie/list`, {
        headers: this.headers,
        params: {
          language: 'en-US'
        }
      });
      return response.data.genres;
    } catch (error) {
      console.error('Error fetching genres:', error.message);
      throw error;
    }
  }
}

module.exports = MovieDatabaseService;
