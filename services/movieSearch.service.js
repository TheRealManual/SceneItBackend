const { GoogleGenerativeAI } = require('@google/generative-ai');
const MovieDatabaseService = require('./movieDatabase.service');

class MovieSearchService {
  constructor(geminiApiKey, tmdbAccessToken) {
    this.genAI = new GoogleGenerativeAI(geminiApiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    this.movieDb = new MovieDatabaseService(tmdbAccessToken);
  }

  /**
   * Step 1: Filter movies using TMDB API (ONLY hard criteria - let AI handle subjective preferences)
   */
  async filterMoviesByBasicCriteria(preferences, user = null) {
    const params = {
      sort_by: 'popularity.desc',
      page: 1
    };

    // HARD FILTERS (objective criteria that TMDB can filter efficiently)
    
    // Release year filter
    if (preferences.yearRange) {
      params['primary_release_date.gte'] = `${preferences.yearRange[0]}-01-01`;
      params['primary_release_date.lte'] = `${preferences.yearRange[1]}-12-31`;
    }

    // IMDB rating filter (voteAverage in TMDB is 0-10 scale)
    if (preferences.ratingRange) {
      params['vote_average.gte'] = preferences.ratingRange[0];
      params['vote_average.lte'] = preferences.ratingRange[1];
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
      params.with_original_language = languageCodes[preferences.language] || 'en';
    }

    // NOTE: Genre preferences are NO LONGER filtered here - AI will handle genre matching
    // This gives AI access to ALL movies in the year/rating/language range for intelligent ranking

    console.log('📊 TMDB discover params (hard filters only):', JSON.stringify(params, null, 2));

    try {
      // Fetch multiple pages from TMDB to get a diverse pool of movies (pages 1-10 = ~200 movies)
      console.log('📥 Fetching movies from TMDB (10 pages for maximum diversity)...');
      const allMovies = [];
      
      for (let page = 1; page <= 10; page++) {
        const pageParams = { ...params, page };
        const response = await this.movieDb.discoverMovies(pageParams);
        allMovies.push(...(response.results || []));
      }
      
      console.log(`✅ TMDB returned ${allMovies.length} movies from 10 pages`);

      // Fetch full details for all movies including certifications
      console.log('📥 Fetching full details for all movies...');
      const moviesWithDetails = await Promise.all(
        allMovies.map(async (movie) => {
          try {
            const details = await this.movieDb.getMovieById(movie.id);
            return details;
          } catch (error) {
            console.error(`Failed to fetch details for movie ${movie.id}:`, error.message);
            return null;
          }
        })
      );

      // Filter out null results and apply age rating filter
      let filteredMovies = moviesWithDetails.filter(m => m !== null);

      // Age rating filter (applied after fetching certifications)
      if (preferences.ageRating && preferences.ageRating !== 'Any') {
        const beforeCount = filteredMovies.length;
        filteredMovies = filteredMovies.filter(m => m.ageRating === preferences.ageRating);
        console.log(`🔒 Age rating filter (${preferences.ageRating}): ${beforeCount} → ${filteredMovies.length} movies`);
      }

      // Runtime filter (TMDB discover API doesn't support runtime filter well, so we filter client-side)
      if (preferences.runtimeRange) {
        const beforeCount = filteredMovies.length;
        filteredMovies = filteredMovies.filter(m => 
          m.runtime >= preferences.runtimeRange[0] && m.runtime <= preferences.runtimeRange[1]
        );
        console.log(`⏱️ Runtime filter (${preferences.runtimeRange[0]}-${preferences.runtimeRange[1]} min): ${beforeCount} → ${filteredMovies.length} movies`);
      }

      // Filter out already rated movies BEFORE limiting to top 100
      // This ensures AI always gets a good pool of unrated movies to analyze
      if (user) {
        const beforeCount = filteredMovies.length;
        const ratedMovieIds = new Set([
          ...user.likedMovies.map(m => m.movieId),
          ...user.dislikedMovies.map(m => m.movieId)
        ]);
        
        filteredMovies = filteredMovies.filter(movie => 
          !ratedMovieIds.has(movie.tmdbId.toString())
        );
        
        const removedCount = beforeCount - filteredMovies.length;
        if (removedCount > 0) {
          console.log(`🚫 Filtered out ${removedCount} already-rated movies: ${beforeCount} → ${filteredMovies.length}`);
        }
      }

      // Take top 150 by popularity (after filtering out rated movies)
      // Give AI more movies to choose from for better matching
      const top150 = filteredMovies
        .sort((a, b) => b.popularity - a.popularity)
        .slice(0, 150);

      console.log(`✅ Returning ${top150.length} movies for AI analysis`);
      
      return top150;
    } catch (error) {
      console.error('TMDB API Error:', error.message);
      throw error;
    }
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
      
      // If AI returned empty array (no good matches), return empty array
      if (!rankedMovies || rankedMovies.length === 0) {
        console.log('⚠️ AI found no good matches (all scores < 0.6), returning empty results');
        return [];
      }
      
      // Map ranked movies back to full movie objects, filtering out invalid IDs
      const movieMap = new Map(movies.map(m => [m.tmdbId, m]));
      const validMovies = rankedMovies
        .filter(item => item.tmdbId && item.tmdbId > 0 && movieMap.has(item.tmdbId))
        .map(item => {
          const movie = movieMap.get(item.tmdbId);
          return {
            ...movie,
            matchScore: item.score,
            matchReason: item.reason
          };
        });
      
      // If all returned IDs were invalid (placeholders), return empty array
      if (validMovies.length === 0) {
        console.log('⚠️ AI returned invalid movie IDs, returning empty results');
        return [];
      }
      
      return validMovies;

    } catch (error) {
      console.error('\n' + '='.repeat(80));
      console.error('❌ AI ANALYSIS ERROR');
      console.error('='.repeat(80));
      console.error(error);
      console.error('='.repeat(80) + '\n');
      
      // Check if it's a network/API error that should be shown to user
      if (error.message?.includes('fetch') || 
          error.message?.includes('network') || 
          error.code === 'ECONNREFUSED' || 
          error.code === 'ETIMEDOUT' ||
          error.status >= 500) {
        // Throw error to be handled by controller
        const geminiError = new Error('AI service temporarily unavailable');
        geminiError.code = 'GEMINI_UNAVAILABLE';
        throw geminiError;
      }
      
      // For parsing errors or other non-critical errors, return empty array
      console.log('⚠️  Returning empty results (AI analysis failed)');
      return [];
    }
  }

  /**
   * Build AI prompt for movie analysis (optimized for token efficiency)
   */
  buildAIPrompt(movies, preferences) {
    // Only send essential data for subjective analysis - minimize tokens
    const movieSummaries = movies.map(m => ({
      tmdbId: m.tmdbId,
      title: m.title,
      year: m.releaseDate ? new Date(m.releaseDate).getFullYear() : 'N/A',
      // Truncate overview to first 200 chars to save tokens (enough for AI to understand)
      overview: (m.overview || 'No description').substring(0, 200),
      genres: m.genres?.map(g => g.name).join(', ') || 'Unknown',
      // Limit keywords to top 6 most relevant
      keywords: m.keywords?.slice(0, 6).join(', ') || 'None',
      rating: m.voteAverage || 0
    }));

    // Build a comprehensive prompt with ALL subjective preferences
    const userPreferences = [];
    
    // User description (highest priority)
    if (preferences.description && preferences.description.trim()) {
      userPreferences.push(`Description: "${preferences.description}"`);
    }
    
    // Genre preferences (all of them, not just neutral ones)
    if (preferences.genres && Object.keys(preferences.genres).length > 0) {
      const genrePrefs = Object.entries(preferences.genres)
        .filter(([_, rating]) => rating !== 5) // Include any non-neutral preference
        .sort(([_, a], [__, b]) => b - a) // Sort by preference strength
        .map(([genre, rating]) => {
          if (rating > 5) return `${genre} (prefer ${rating}/10)`;
          if (rating < 5) return `${genre} (avoid ${rating}/10)`;
        })
        .filter(Boolean);
      
      if (genrePrefs.length > 0) {
        userPreferences.push(`Genres: ${genrePrefs.join(', ')}`);
      }
    }
    
    // Mood/style sliders
    if (preferences.moodIntensity !== 5) {
      const mood = preferences.moodIntensity > 5 ? 'intense/dramatic' : 'calm/peaceful';
      userPreferences.push(`Mood: ${mood} (${preferences.moodIntensity}/10)`);
    }
    
    if (preferences.humorLevel !== 5) {
      const humor = preferences.humorLevel > 5 ? 'comedic/funny' : 'serious/dramatic';
      userPreferences.push(`Humor: ${humor} (${preferences.humorLevel}/10)`);
    }
    
    if (preferences.violenceLevel !== 5) {
      const violence = preferences.violenceLevel > 5 ? 'action-heavy' : 'minimal violence';
      userPreferences.push(`Violence: ${violence} (${preferences.violenceLevel}/10)`);
    }
    
    if (preferences.romanceLevel !== 5) {
      const romance = preferences.romanceLevel > 5 ? 'romantic focus' : 'minimal romance';
      userPreferences.push(`Romance: ${romance} (${preferences.romanceLevel}/10)`);
    }
    
    if (preferences.complexityLevel !== 5) {
      const complexity = preferences.complexityLevel > 5 ? 'complex/layered' : 'simple/straightforward';
      userPreferences.push(`Plot complexity: ${complexity} (${preferences.complexityLevel}/10)`);
    }

    // Build concise prompt
    // Extract valid tmdbIds to make them explicit
    const validIds = movies.map(m => m.tmdbId);
    
    return `You are a movie recommendation AI. Analyze these ${movies.length} movies and rank the best matches for the user's preferences.

USER PREFERENCES:
${userPreferences.length > 0 ? userPreferences.join('\n') : 'General recommendations - return most popular movies'}

VALID MOVIE IDS (ONLY use these):
${validIds.join(', ')}

MOVIES TO ANALYZE:
${JSON.stringify(movieSummaries, null, 2)}

INSTRUCTIONS:
1. Read the user's preferences carefully
2. For each movie, compare its genres, keywords, and overview against the preferences
3. Assign a match score from 0.0 to 1.0 based on how well it matches
4. IMPORTANT: Match based on actual data - if user wants "Animation", the movie MUST have "Animation" in its genres field
5. Visual effects or CGI in live-action movies do NOT make them animations
6. Only include movies with score >= 0.6 (good matches)
7. Return UP TO 10 best matches, sorted by score (highest first)
8. If no movies score >= 0.6, return an empty array: []

Return JSON only (no markdown):
[{"tmdbId": 123, "score": 0.95, "reason": "Brief explanation"}]`;
  }

  /**
   * Main search function
   */
  async searchMovies(preferences, user = null) {
    console.log('\n' + '='.repeat(80));
    console.log('🔍 MOVIE SEARCH STARTED (TMDB API)');
    console.log('='.repeat(80));
    console.log('📋 Preferences received:');
    console.log(JSON.stringify(preferences, null, 2));
    console.log('='.repeat(80) + '\n');
    
    // Step 1: TMDB filtering (with user context to filter out rated movies early)
    console.log('📊 Step 1: Filtering movies via TMDB API...');
    const filteredMovies = await this.filterMoviesByBasicCriteria(preferences, user);
    console.log(`✅ Found ${filteredMovies.length} unrated movies matching basic criteria\n`);

    if (filteredMovies.length === 0) {
      console.log('❌ No unrated movies found matching basic criteria\n');
      return [];
    }

    // Movies are already filtered for unrated content in Step 1
    const moviesToProcess = filteredMovies;

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
      
      // Ensure we return exactly 10 movies (safety check)
      const finalResults = rankedMovies.slice(0, 10);
      console.log(`🎯 Returning ${finalResults.length} movies to user\n`);
      
      console.log('='.repeat(80));
      console.log('🎬 SEARCH COMPLETE');
      console.log('='.repeat(80) + '\n');
      
      return finalResults;
    }

    // No subjective preferences - return filtered movies sorted by popularity
    console.log('⚡ Skipping AI analysis (using default preferences)\n');
    const results = moviesToProcess
      .map(m => ({ 
        ...m, 
        matchScore: (m.popularity / 1000) + (m.voteAverage / 100),
        matchReason: 'Sorted by popularity and rating'
      }))
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 10); // Limit to 10 movies
    
    console.log(`🎯 Returning ${results.length} movies to user\n`);
    
    console.log('='.repeat(80));
    console.log('🎬 SEARCH COMPLETE');
    console.log('='.repeat(80) + '\n');
    
    return results;
  }
}

module.exports = MovieSearchService;
