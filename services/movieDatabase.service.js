const axios = require('axios');
const NodeCache = require('node-cache');
const justwatchService = require('./justwatch.service');

// Cache configuration
// - Genre list: 24 hours (rarely changes)
// - Movie details: 1 hour (balances freshness with API efficiency)
const cache = new NodeCache({ 
  stdTTL: 3600, // Default 1 hour
  checkperiod: 600 // Check for expired keys every 10 minutes
});

class MovieDatabaseService {
  constructor(accessToken) {
    this.accessToken = accessToken;
    this.baseUrl = 'https://api.themoviedb.org/3';
    this.headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    };
  }

  /**
   * Map TMDB US certification to standard age rating
   */
  mapCertificationToAgeRating(releaseDates) {
    if (!releaseDates || !releaseDates.results) return 'NR';
    
    const usCert = releaseDates.results.find(c => c.iso_3166_1 === 'US');
    if (usCert && usCert.release_dates && usCert.release_dates.length > 0) {
      const cert = usCert.release_dates[0].certification;
      return cert || 'NR';
    }
    return 'NR';
  }

  /**
   * Get movie by TMDB ID with full details (credits, keywords, certifications)
   * Results are cached for 1 hour
   */
  async getMovieById(tmdbId, retryWithoutLanguage = false) {
    try {
      // Check cache first
      const cacheKey = `movie_${tmdbId}`;
      const cached = cache.get(cacheKey);
      if (cached) {
        return cached;
      }

      const params = {
        append_to_response: 'credits,keywords,release_dates,videos,watch/providers'
      };
      
      // Only add language parameter if not retrying
      if (!retryWithoutLanguage) {
        params.language = 'en-US';
      }
      
      const response = await axios.get(`${this.baseUrl}/movie/${tmdbId}`, {
        headers: this.headers,
        params: params
      });

      const movieData = response.data;

      // Transform to consistent format
      const movie = {
        tmdbId: movieData.id,
        title: movieData.title,
        overview: movieData.overview,
        releaseDate: movieData.release_date ? new Date(movieData.release_date) : null,
        runtime: movieData.runtime || 0,
        voteAverage: movieData.vote_average || 0,
        voteCount: movieData.vote_count || 0,
        popularity: movieData.popularity || 0,
        posterPath: movieData.poster_path,
        backdropPath: movieData.backdrop_path,
        genres: movieData.genres || [],
        ageRating: this.mapCertificationToAgeRating(movieData.release_dates),
        language: movieData.original_language || 'en',
        budget: movieData.budget || 0,
        revenue: movieData.revenue || 0,
        tagline: movieData.tagline || '',
        cast: movieData.credits?.cast?.slice(0, 10).map(c => ({
          name: c.name,
          character: c.character,
          profilePath: c.profile_path
        })) || [],
        director: movieData.credits?.crew?.find(c => c.job === 'Director')?.name || '',
        keywords: movieData.keywords?.keywords?.map(k => k.name) || [],
        // Videos (trailers, teasers, etc.)
        videos: movieData.videos?.results?.map(v => ({
          key: v.key,
          name: v.name,
          site: v.site,
          type: v.type,
          official: v.official
        })) || [],
        // Watch providers (streaming services by region)
        watchProviders: {
          US: {
            link: movieData['watch/providers']?.results?.US?.link || null,
            flatrate: movieData['watch/providers']?.results?.US?.flatrate?.map(p => ({
              providerId: p.provider_id,
              providerName: p.provider_name,
              logoPath: p.logo_path
            })) || [],
            rent: movieData['watch/providers']?.results?.US?.rent?.map(p => ({
              providerId: p.provider_id,
              providerName: p.provider_name,
              logoPath: p.logo_path
            })) || [],
            buy: movieData['watch/providers']?.results?.US?.buy?.map(p => ({
              providerId: p.provider_id,
              providerName: p.provider_name,
              logoPath: p.logo_path
            })) || []
          }
        }
      };

      // Fetch JustWatch streaming links in parallel (non-blocking)
      try {
        const releaseYear = movieData.release_date ? new Date(movieData.release_date).getFullYear() : null;
        const jwData = await justwatchService.getStreamingLinks(movieData.title, releaseYear);
        
        if (jwData && jwData.streamingLinks) {
          // Add JustWatch URLs to providers
          ['flatrate', 'rent', 'buy'].forEach(type => {
            if (movie.watchProviders.US[type]) {
              movie.watchProviders.US[type] = movie.watchProviders.US[type].map(provider => {
                // Try to find matching JustWatch link by provider ID
                const jwLink = jwData.streamingLinks[provider.providerId];
                return {
                  ...provider,
                  directUrl: jwLink?.url || null
                };
              });
            }
          });
        }
      } catch (jwError) {
        // JustWatch fetch failed - continue without direct links
        console.log(`   ⚠️  JustWatch fetch failed for ${movieData.title}, using TMDB links only`);
      }

      // Cache the result
      cache.set(cacheKey, movie);

      return movie;
    } catch (error) {
      // If language override error, retry without language parameter
      if (error.response?.data?.status_message?.includes('language override') && !retryWithoutLanguage) {
        console.log(`   ⚠️  Language override error for movie ${tmdbId}, retrying without language filter...`);
        return this.getMovieById(tmdbId, true);
      }
      
      // If 404, return null instead of throwing
      if (error.response?.status === 404) {
        console.log(`   ⚠️  Movie ${tmdbId} not found in TMDB`);
        return null;
      }
      
      console.error(`Error fetching movie ${tmdbId}:`, error.message);
      throw error;
    }
  }

  /**
   * Get random/popular movies for carousel
   */
  async getRandomMovies(count = 20) {
    try {
      // Fetch from popular movies endpoint (page 1-3 for variety)
      const randomPage = Math.floor(Math.random() * 3) + 1;
      
      const response = await axios.get(`${this.baseUrl}/movie/popular`, {
        headers: this.headers,
        params: {
          page: randomPage,
          language: 'en-US'
        }
      });

      const movies = response.data.results || [];
      
      // Shuffle and take requested count
      const shuffled = movies.sort(() => Math.random() - 0.5);
      const selected = shuffled.slice(0, count);

      // Transform to consistent format (basic info, no full details for performance)
      return selected.map(m => ({
        tmdbId: m.id,
        title: m.title,
        overview: m.overview,
        posterPath: m.poster_path,
        backdropPath: m.backdrop_path,
        voteAverage: m.vote_average || 0,
        releaseDate: m.release_date ? new Date(m.release_date) : null,
        popularity: m.popularity || 0
      }));
    } catch (error) {
      console.error('Error fetching random movies:', error.message);
      throw error;
    }
  }

  /**
   * Get genre list
   * Results are cached for 24 hours
   */
  async getGenres() {
    try {
      // Check cache first
      const cacheKey = 'genres';
      const cached = cache.get(cacheKey);
      if (cached) {
        return cached;
      }

      const response = await axios.get(`${this.baseUrl}/genre/movie/list`, {
        headers: this.headers,
        params: {
          language: 'en-US'
        }
      });

      const genres = response.data.genres;

      // Cache for 24 hours (86400 seconds)
      cache.set(cacheKey, genres, 86400);

      return genres;
    } catch (error) {
      console.error('Error fetching genres:', error.message);
      throw error;
    }
  }

  /**
   * Discover/filter movies by criteria
   * Used by search service
   */
  async discoverMovies(params) {
    try {
      const response = await axios.get(`${this.baseUrl}/discover/movie`, {
        headers: this.headers,
        params: {
          ...params,
          include_adult: false,
          include_video: false
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error discovering movies:', error.message);
      throw error;
    }
  }

  /**
   * Search movies by title
   */
  async searchMovies(query, page = 1) {
    try {
      const response = await axios.get(`${this.baseUrl}/search/movie`, {
        headers: this.headers,
        params: {
          query: query,
          page: page,
          include_adult: false
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error searching movies:', error.message);
      throw error;
    }
  }
}

module.exports = MovieDatabaseService;
