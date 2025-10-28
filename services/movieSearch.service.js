const { GoogleGenerativeAI } = require('@google/generative-ai');
const Movie = require('../models/Movie');

class MovieSearchService {
  constructor(geminiApiKey) {
    this.genAI = new GoogleGenerativeAI(geminiApiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
  }

  /**
   * Step 1: Filter movies using database fields
   */
  async filterMoviesByBasicCriteria(preferences) {
    const query = {};

    // Release year filter
    if (preferences.yearRange) {
      query.releaseDate = {
        $gte: new Date(`${preferences.yearRange[0]}-01-01`),
        $lte: new Date(`${preferences.yearRange[1]}-12-31`)
      };
    }

    // Runtime filter
    if (preferences.runtimeRange) {
      query.runtime = {
        $gte: preferences.runtimeRange[0],
        $lte: preferences.runtimeRange[1]
      };
    }

    // IMDB rating filter (voteAverage in TMDB is 0-10 scale)
    if (preferences.ratingRange) {
      query.voteAverage = {
        $gte: preferences.ratingRange[0],
        $lte: preferences.ratingRange[1]
      };
    }

    // Age rating filter
    if (preferences.ageRating && preferences.ageRating !== 'Any') {
      query.ageRating = preferences.ageRating;
    }

    // Language filter
    if (preferences.language && preferences.language !== 'Any') {
      const languageCodes = {
        'English': 'en',
        'Spanish': 'es',
        'French': 'fr',
        'German': 'de',
        'Italian': 'it',
        'Japanese': 'ja',
        'Korean': 'ko',
        'Mandarin': 'zh',
        'Hindi': 'hi'
      };
      query.language = languageCodes[preferences.language] || 'en';
    }

    // Genre filter - match movies that have ANY of the user's preferred genres (rated 6+)
    if (preferences.genres && Object.keys(preferences.genres).length > 0) {
      const preferredGenres = Object.entries(preferences.genres)
        .filter(([_, rating]) => rating >= 6) // Only include genres rated 6+
        .map(([genre, _]) => genre);

      if (preferredGenres.length > 0) {
        query['genres.name'] = { $in: preferredGenres };
      }
    }

    console.log('📊 Database query:', JSON.stringify(query, null, 2));

    // Fetch filtered movies with some randomization to avoid always getting the same results
    // We fetch more than we need and shuffle them for variety
    const allMovies = await Movie.find(query)
      .sort({ popularity: -1, voteAverage: -1 }) // Sort by popularity and rating
      .limit(300) // Fetch more movies
      .lean();

    // Shuffle the array to add randomization while keeping quality movies
    const shuffled = allMovies.sort(() => Math.random() - 0.5);
    
    // Take the first 100 for AI processing
    const movies = shuffled.slice(0, 100);

    return movies;
  }

  /**
   * Step 2: Use Gemini AI to analyze and rank movies based on subjective criteria
   */
  async analyzeMoviesWithAI(movies, preferences) {
    if (movies.length === 0) {
      return [];
    }

    const prompt = this.buildAIPrompt(movies, preferences);
    
    console.log('\n' + '='.repeat(80));
    console.log('🤖 GEMINI AI PROMPT');
    console.log('='.repeat(80));
    console.log(prompt);
    console.log('='.repeat(80) + '\n');
    
    try {
      console.log('📤 Sending request to Gemini AI...');
      const startTime = Date.now();
      
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      const endTime = Date.now();
      const duration = ((endTime - startTime) / 1000).toFixed(2);
      
      console.log('\n' + '='.repeat(80));
      console.log(`✅ GEMINI AI RESPONSE (took ${duration}s)`);
      console.log('='.repeat(80));
      console.log(text);
      console.log('='.repeat(80) + '\n');
      
      // Parse AI response (expecting JSON array)
      // Remove markdown code blocks if present
      const jsonText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const rankedMovies = JSON.parse(jsonText);
      
      console.log(`📊 AI ranked ${rankedMovies.length} movies`);
      
      // Map ranked movies back to full movie objects
      const movieMap = new Map(movies.map(m => [m.tmdbId, m]));
      return rankedMovies
        .map(item => {
          const movie = movieMap.get(item.tmdbId);
          if (movie) {
            return {
              ...movie,
              matchScore: item.score,
              matchReason: item.reason
            };
          }
          return null;
        })
        .filter(m => m !== null);

    } catch (error) {
      console.error('\n' + '='.repeat(80));
      console.error('❌ AI ANALYSIS ERROR');
      console.error('='.repeat(80));
      console.error(error);
      console.error('='.repeat(80) + '\n');
      
      // Fallback: return movies sorted by popularity
      return movies.map(m => ({ 
        ...m, 
        matchScore: m.popularity / 1000,
        matchReason: 'Sorted by popularity (AI analysis failed)'
      }));
    }
  }

  /**
   * Build AI prompt for movie analysis
   */
  buildAIPrompt(movies, preferences) {
    const movieSummaries = movies.map(m => ({
      id: m.tmdbId,
      title: m.title,
      year: m.releaseDate ? new Date(m.releaseDate).getFullYear() : 'N/A',
      overview: m.overview || 'No description available',
      genres: m.genres?.map(g => g.name).join(', ') || 'Unknown',
      keywords: m.keywords?.slice(0, 10).join(', ') || 'None',
      rating: m.voteAverage || 0,
      director: m.director || 'Unknown'
    }));

    return `You are an expert movie recommendation AI. Analyze these ${movies.length} movies and rank them based on how well they match the user's detailed preferences.

**User Preferences:**
${preferences.description ? `- **Description**: "${preferences.description}"` : ''}
- **Mood Intensity**: ${preferences.moodIntensity}/10 (1=calm/peaceful, 10=intense/dramatic)
- **Humor Level**: ${preferences.humorLevel}/10 (1=very serious, 10=hilarious/comedic)
- **Violence Level**: ${preferences.violenceLevel}/10 (1=no violence, 10=graphic/action-heavy)
- **Romance Level**: ${preferences.romanceLevel}/10 (1=no romance, 10=heavy romantic focus)
- **Complexity Level**: ${preferences.complexityLevel}/10 (1=simple/straightforward, 10=complex/layered plot)

**Genre Preferences** (1-10 scale):
${Object.entries(preferences.genres || {}).map(([genre, rating]) => `- ${genre}: ${rating}/10`).join('\n')}

**Movies to Analyze:**
${JSON.stringify(movieSummaries, null, 2)}

**Task:**
1. Analyze each movie's overview, genres, keywords, and director style
2. Match against the user's subjective preferences (mood, humor, violence, romance, complexity)
3. Consider the user's description to understand their intent
4. Assign a score from 0.0 to 1.0 based on how well the movie matches ALL preferences
5. Provide a brief reason explaining why the movie is a good/poor match

**Output Format (JSON only, no markdown):**
[
  {
    "tmdbId": 12345,
    "score": 0.95,
    "reason": "Perfect match: high intensity action with complex plot and minimal romance"
  },
  {
    "tmdbId": 67890,
    "score": 0.87,
    "reason": "Strong match: romantic comedy with light mood and simple storyline"
  }
]

**Rules:**
- Only include movies with score >= 0.4
- Sort by score (highest first)
- Be honest - don't inflate scores
- Consider ALL preference dimensions
- Limit to top 30 movies maximum
- Return ONLY valid JSON, no explanations`;
  }

  /**
   * Main search function
   */
  async searchMovies(preferences) {
    console.log('\n' + '='.repeat(80));
    console.log('🔍 MOVIE SEARCH STARTED');
    console.log('='.repeat(80));
    console.log('📋 Preferences received:');
    console.log(JSON.stringify(preferences, null, 2));
    console.log('='.repeat(80) + '\n');
    
    // Step 1: Database filtering
    console.log('📊 Step 1: Filtering movies by basic criteria...');
    const filteredMovies = await this.filterMoviesByBasicCriteria(preferences);
    console.log(`✅ Found ${filteredMovies.length} movies matching basic criteria\n`);

    if (filteredMovies.length === 0) {
      console.log('❌ No movies found matching basic criteria\n');
      return [];
    }

    console.log('📦 Sample of filtered movies:');
    console.table(
      filteredMovies.slice(0, 5).map(m => ({
        'Title': m.title,
        'Year': m.releaseDate ? new Date(m.releaseDate).getFullYear() : 'N/A',
        'Rating': m.voteAverage,
        'Popularity': m.popularity.toFixed(0),
        'Genres': m.genres?.map(g => g.name).join(', ').substring(0, 30)
      }))
    );
    console.log('');

    // Step 2: AI analysis (if user provided subjective preferences or description)
    const hasSubjectivePrefs = 
      (preferences.description && preferences.description.trim().length > 0) ||
      preferences.moodIntensity !== 5 ||
      preferences.humorLevel !== 5 ||
      preferences.violenceLevel !== 5 ||
      preferences.romanceLevel !== 5 ||
      preferences.complexityLevel !== 5;

    if (hasSubjectivePrefs) {
      console.log('🤖 Step 2: Analyzing movies with Gemini AI...\n');
      const rankedMovies = await this.analyzeMoviesWithAI(filteredMovies, preferences);
      console.log(`✅ AI ranked ${rankedMovies.length} movies\n`);
      
      console.log('='.repeat(80));
      console.log('🎬 SEARCH COMPLETE');
      console.log('='.repeat(80) + '\n');
      
      return rankedMovies;
    }

    // No subjective preferences - return filtered movies sorted by popularity
    console.log('⚡ Skipping AI analysis (using default preferences)\n');
    const results = filteredMovies.map(m => ({ 
      ...m, 
      matchScore: (m.popularity / 1000) + (m.voteAverage / 100),
      matchReason: 'Sorted by popularity and rating'
    }));
    
    console.log('='.repeat(80));
    console.log('🎬 SEARCH COMPLETE');
    console.log('='.repeat(80) + '\n');
    
    return results;
  }
}

module.exports = MovieSearchService;
