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

    // Determine how many movies to fetch based on whether we're using AI
    const hasSubjectivePrefs = 
      (preferences.description && preferences.description.trim().length > 0) ||
      preferences.moodIntensity !== 5 ||
      preferences.humorLevel !== 5 ||
      preferences.violenceLevel !== 5 ||
      preferences.romanceLevel !== 5 ||
      preferences.complexityLevel !== 5;

    // If using AI, fetch fewer movies to reduce tokens (50-75 movies is enough for good variety)
    // If no AI, fetch more for better selection
    const fetchLimit = hasSubjectivePrefs ? 200 : 300;
    const aiLimit = hasSubjectivePrefs ? 60 : 100;

    console.log(`🎯 Strategy: ${hasSubjectivePrefs ? 'Using AI analysis' : 'No AI (default sort)'}`);
    console.log(`📊 Fetching ${fetchLimit} movies, ${hasSubjectivePrefs ? `analyzing ${aiLimit} with AI` : 'sorting by popularity'}`);

    // Fetch filtered movies with some randomization to avoid always getting the same results
    const allMovies = await Movie.find(query)
      .sort({ popularity: -1, voteAverage: -1 }) // Sort by popularity and rating
      .limit(fetchLimit)
      .lean();

    // Shuffle the array to add randomization while keeping quality movies
    const shuffled = allMovies.sort(() => Math.random() - 0.5);
    
    // Take only what we need for AI processing (fewer = less tokens)
    const movies = shuffled.slice(0, aiLimit);

    console.log(`✅ Returning ${movies.length} movies for ${hasSubjectivePrefs ? 'AI analysis' : 'direct use'}`);

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
   * Build AI prompt for movie analysis (optimized for token efficiency)
   */
  buildAIPrompt(movies, preferences) {
    // Only send essential data for subjective analysis - minimize tokens
    const movieSummaries = movies.map(m => ({
      id: m.tmdbId,
      title: m.title,
      year: m.releaseDate ? new Date(m.releaseDate).getFullYear() : 'N/A',
      // Truncate overview to first 200 chars to save tokens (enough for AI to understand)
      overview: (m.overview || 'No description').substring(0, 200),
      genres: m.genres?.map(g => g.name).join(', ') || 'Unknown',
      // Limit keywords to top 6 most relevant
      keywords: m.keywords?.slice(0, 6).join(', ') || 'None',
      rating: m.voteAverage || 0
    }));

    // Build a concise prompt focusing only on subjective criteria
    const subjectivePrefs = [];
    
    if (preferences.description && preferences.description.trim()) {
      subjectivePrefs.push(`User wants: "${preferences.description}"`);
    }
    
    // Only include preferences that deviate from neutral (5)
    if (preferences.moodIntensity !== 5) {
      const mood = preferences.moodIntensity > 5 ? 'intense/dramatic' : 'calm/peaceful';
      subjectivePrefs.push(`Mood: ${mood} (${preferences.moodIntensity}/10)`);
    }
    
    if (preferences.humorLevel !== 5) {
      const humor = preferences.humorLevel > 5 ? 'comedic/funny' : 'serious/dramatic';
      subjectivePrefs.push(`Humor: ${humor} (${preferences.humorLevel}/10)`);
    }
    
    if (preferences.violenceLevel !== 5) {
      const violence = preferences.violenceLevel > 5 ? 'action-heavy' : 'minimal violence';
      subjectivePrefs.push(`Violence: ${violence} (${preferences.violenceLevel}/10)`);
    }
    
    if (preferences.romanceLevel !== 5) {
      const romance = preferences.romanceLevel > 5 ? 'romantic focus' : 'minimal romance';
      subjectivePrefs.push(`Romance: ${romance} (${preferences.romanceLevel}/10)`);
    }
    
    if (preferences.complexityLevel !== 5) {
      const complexity = preferences.complexityLevel > 5 ? 'complex/layered' : 'simple/straightforward';
      subjectivePrefs.push(`Plot: ${complexity} (${preferences.complexityLevel}/10)`);
    }

    // Build concise prompt
    return `Rank these ${movies.length} movies by match score (0.0-1.0). 

User wants: ${subjectivePrefs.length > 0 ? subjectivePrefs.join('; ') : 'General recommendations'}

Movies (already filtered by year, rating, runtime, language):
${JSON.stringify(movieSummaries, null, 2)}

Return JSON only (no markdown):
[{"tmdbId": 123, "score": 0.95, "reason": "Brief explanation"}]

Rules: score >= 0.4, top 30 max, sort by score desc.`;
  }

  /**
   * Main search function
   */
  async searchMovies(preferences, user = null) {
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

    // Filter out already rated movies if user provided
    let moviesToProcess = filteredMovies;
    if (user) {
      const ratedMovieIds = new Set([
        ...user.likedMovies.map(m => m.movieId),
        ...user.dislikedMovies.map(m => m.movieId)
      ]);
      
      moviesToProcess = filteredMovies.filter(movie => 
        !ratedMovieIds.has(movie.tmdbId.toString())
      );
      
      const removedCount = filteredMovies.length - moviesToProcess.length;
      if (removedCount > 0) {
        console.log(`🚫 Filtered out ${removedCount} already-rated movies`);
        console.log(`✅ ${moviesToProcess.length} unrated movies remaining\n`);
      }
    }

    if (moviesToProcess.length === 0) {
      console.log('❌ No unrated movies found\n');
      return [];
    }

    console.log('📦 Sample of filtered movies:');
    console.table(
      moviesToProcess.slice(0, 5).map(m => ({
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
      const rankedMovies = await this.analyzeMoviesWithAI(moviesToProcess, preferences);
      console.log(`✅ AI ranked ${rankedMovies.length} movies\n`);
      
      console.log('='.repeat(80));
      console.log('🎬 SEARCH COMPLETE');
      console.log('='.repeat(80) + '\n');
      
      return rankedMovies;
    }

    // No subjective preferences - return filtered movies sorted by popularity
    console.log('⚡ Skipping AI analysis (using default preferences)\n');
    const results = moviesToProcess.map(m => ({ 
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
