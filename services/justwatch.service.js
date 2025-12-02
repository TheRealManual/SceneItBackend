const axios = require('axios');

class JustWatchService {
  constructor() {
    this.baseUrl = 'https://apis.justwatch.com/content';
  }

  /**
   * Search for a movie/show on JustWatch and get streaming links
   * @param {string} title - Movie title
   * @param {number} year - Release year (optional but recommended for accuracy)
   * @returns {Object} Streaming offers with direct URLs
   */
  async getStreamingLinks(title, year = null) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/titles/en_US/popular`,
        {
          query: title,
          content_types: ['movie']
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        }
      );

      const items = response.data.items || [];
      
      // Find the best match - prioritize exact title and year match
      let bestMatch = null;
      
      if (year) {
        // Try to find exact year match first
        bestMatch = items.find(item => 
          item.title?.toLowerCase() === title.toLowerCase() && 
          item.original_release_year === year
        );
      }
      
      // Fallback to title-only match
      if (!bestMatch) {
        bestMatch = items.find(item => 
          item.title?.toLowerCase() === title.toLowerCase()
        );
      }
      
      // Fallback to first result if no exact match
      if (!bestMatch && items.length > 0) {
        bestMatch = items[0];
      }

      if (!bestMatch) {
        console.log(`No JustWatch results found for: ${title}`);
        return null;
      }

      // Extract offers (streaming providers)
      const offers = bestMatch.offers || [];
      
      // Map provider IDs to their streaming URLs
      const streamingLinks = {};
      
      offers.forEach(offer => {
        const providerId = offer.provider_id;
        const url = offer.urls?.standard_web;
        
        if (url && providerId) {
          // Map JustWatch provider IDs to TMDB provider IDs (common ones)
          // This mapping ensures consistency between TMDB logos and JustWatch links
          streamingLinks[providerId] = {
            url,
            monetizationType: offer.monetization_type, // flatrate, rent, buy, free
            presentationType: offer.presentation_type  // hd, sd, 4k
          };
        }
      });

      return {
        jwId: bestMatch.id,
        title: bestMatch.title,
        year: bestMatch.original_release_year,
        streamingLinks
      };

    } catch (error) {
      console.error(`Error fetching JustWatch links for "${title}":`, error.message);
      return null;
    }
  }

  /**
   * Map TMDB provider ID to JustWatch provider ID
   * This is a common mapping for major providers
   */
  getTMDBtoJWMapping() {
    return {
      8: 337,    // Netflix
      9: 119,    // Amazon Prime Video  
      337: 384,  // Disney+
      384: 15,   // Hulu
      15: 2,     // Apple TV
      2: 3,      // Google Play
      3: 68      // Microsoft Store
      // Add more mappings as needed
    };
  }
}

module.exports = new JustWatchService();
