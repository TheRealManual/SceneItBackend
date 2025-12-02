// ===================================================================
// DEPRECATED: This script is no longer used
// ===================================================================
// As of December 2025, SceneIt now uses TMDB API directly instead of
// caching movies in MongoDB. This script was used to pre-populate
// the MongoDB Movie collection with data from TMDB.
//
// The new architecture:
// - movieDatabase.service.js fetches movies directly from TMDB API
// - movieSearch.service.js uses TMDB /discover/movie for filtering
// - Movie details are cached in-memory using node-cache
// - MongoDB only stores user data (preferences, liked/disliked movies, etc.)
//
// This file is kept for historical reference only.
// ===================================================================

require('dotenv').config();
const mongoose = require('mongoose');
const MovieDatabaseService = require('../services/movieDatabase.service');
const Movie = require('../models/Movie');

const TMDB_ACCESS_TOKEN = process.env.TMDB_ACCESS_TOKEN;
const BATCH_SIZE = 20; // Movies per batch
const MAX_PAGES = 500; // Max pages to fetch (500 pages × 20 movies = 10,000 movies)
const DELAY_MS = 250; // Delay between API calls (4 requests per second)

// Map TMDB age ratings to standard ratings
const mapAgeRating = (releaseDates) => {
  if (!releaseDates || !releaseDates.results) return 'NR';
  
  const usCert = releaseDates.results.find(c => c.iso_3166_1 === 'US');
  if (usCert && usCert.release_dates && usCert.release_dates.length > 0) {
    const cert = usCert.release_dates[0].certification;
    return cert || 'NR';
  }
  return 'NR';
};

// Transform TMDB data to our schema
const transformMovieData = (tmdbMovie, details) => {
  return {
    tmdbId: tmdbMovie.id,
    title: tmdbMovie.title,
    overview: tmdbMovie.overview,
    releaseDate: tmdbMovie.release_date ? new Date(tmdbMovie.release_date) : null,
    runtime: details.runtime || 0,
    voteAverage: tmdbMovie.vote_average || 0,
    voteCount: tmdbMovie.vote_count || 0,
    popularity: tmdbMovie.popularity || 0,
    posterPath: tmdbMovie.poster_path,
    backdropPath: tmdbMovie.backdrop_path,
    genres: details.genres || [],
    ageRating: mapAgeRating(details.release_dates),
    language: tmdbMovie.original_language || 'en',
    budget: details.budget || 0,
    revenue: details.revenue || 0,
    tagline: details.tagline || '',
    cast: details.credits?.cast?.slice(0, 10).map(c => ({
      name: c.name,
      character: c.character,
      profilePath: c.profile_path
    })) || [],
    director: details.credits?.crew?.find(c => c.job === 'Director')?.name || '',
    keywords: details.keywords?.keywords?.map(k => k.name) || [],
    lastUpdated: new Date()
  };
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function populateMovies() {
  try {
    console.log('🎬 Starting TMDB movie database population...');
    console.log(`📊 Target: ${MAX_PAGES} pages × 20 movies = ${MAX_PAGES * 20} max movies\n`);
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const movieService = new MovieDatabaseService(TMDB_ACCESS_TOKEN);
    
    // Fetch and display available genres
    console.log('\n📋 Fetching genre list...');
    const genres = await movieService.getGenres();
    console.log('Available genres:', genres.map(g => g.name).join(', '));
    
    let totalProcessed = 0;
    let successCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    // Fetch movies page by page
    for (let page = 1; page <= MAX_PAGES; page++) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`📄 Processing page ${page}/${MAX_PAGES}...`);
      console.log(`${'='.repeat(60)}`);
      
      try {
        const moviesData = await movieService.fetchMovies(page);
        const movies = moviesData.results;
        
        if (!movies || movies.length === 0) {
          console.log('⚠️  No more movies found. Stopping...');
          break;
        }
        
        console.log(`Found ${movies.length} movies on page ${page}`);
        
        // Process each movie
        for (const movie of movies) {
          totalProcessed++;
          
          try {
            // Check if movie already exists
            const exists = await Movie.findOne({ tmdbId: movie.id });
            if (exists) {
              skippedCount++;
              console.log(`⏭️  [${totalProcessed}] "${movie.title}" already exists, skipping...`);
              continue;
            }

            // Fetch detailed information
            console.log(`📥 [${totalProcessed}] Fetching details: ${movie.title} (${movie.release_date?.substring(0, 4) || 'N/A'}) [${movie.original_language?.toUpperCase()}]`);
            const details = await movieService.fetchMovieDetails(movie.id);
            await sleep(DELAY_MS); // Rate limiting

            // Transform and save
            const movieData = transformMovieData(movie, details);
            await Movie.create(movieData);
            
            successCount++;
            console.log(`✅ [${totalProcessed}] Saved: ${movie.title}`);
            console.log(`   ⭐ Rating: ${movieData.voteAverage}/10 | 🎭 Genres: ${movieData.genres.map(g => g.name).join(', ')} | 🌍 Language: ${movieData.language}`);

          } catch (error) {
            errorCount++;
            console.error(`❌ [${totalProcessed}] Error processing "${movie.title}":`, error.message);
          }
        }

        console.log(`\n📊 Page ${page} Summary:`);
        console.log(`   ✅ Saved: ${successCount}`);
        console.log(`   ⏭️  Skipped: ${skippedCount}`);
        console.log(`   ❌ Errors: ${errorCount}`);
        
        // Add delay between pages
        await sleep(DELAY_MS * 2);

      } catch (error) {
        console.error(`❌ Error fetching page ${page}:`, error.message);
        errorCount++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('🎉 Movie population complete!');
    console.log('='.repeat(60));
    console.log(`📊 Final Statistics:`);
    console.log(`   📝 Total processed: ${totalProcessed}`);
    console.log(`   ✅ Successfully saved: ${successCount}`);
    console.log(`   ⏭️  Skipped (duplicates): ${skippedCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Fatal error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed');
  }
}

// Run the population script
if (require.main === module) {
  populateMovies();
}

module.exports = populateMovies;
