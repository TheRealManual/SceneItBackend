const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const User = require('../models/User');
const Movie = require('../models/Movie');
require('dotenv').config();

// Email configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Helper function to get random items from array
const getRandomItems = (array, count) => {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

// Helper function to filter valid movie IDs
const filterValidMovieIds = (movies) => {
  return movies
    .map(m => parseInt(m.movieId))
    .filter(id => !isNaN(id) && isFinite(id) && id > 0);
};

// Generate HTML email template
const generateEmailHTML = (userName, userEmail, newFavorites, newLiked, rewatchMovies) => {
  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
      background: #000000;
      margin: 0;
      padding: 50px 20px;
    }
    .container {
      max-width: 680px;
      margin: 0 auto;
      background: #181818;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 25px 50px rgba(0, 0, 0, 0.8);
    }
    .header {
      background: linear-gradient(to right, #e50914, #831010);
      color: white;
      padding: 50px 40px;
      text-align: center;
      position: relative;
      overflow: hidden;
    }
    .header::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: url('data:image/svg+xml,<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg"><defs><pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="1"/></pattern></defs><rect width="100" height="100" fill="url(%23grid)"/></svg>');
      opacity: 0.3;
    }
    .header h1 {
      margin: 0;
      font-size: 36px;
      font-weight: 800;
      letter-spacing: -1px;
      position: relative;
      z-index: 1;
      text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
    }
    .header p {
      margin: 15px 0 0 0;
      font-size: 16px;
      font-weight: 400;
      opacity: 0.95;
      position: relative;
      z-index: 1;
    }
    .content {
      padding: 45px 40px;
      background: #181818;
    }
    .greeting {
      font-size: 22px;
      color: #ffffff;
      margin-bottom: 12px;
      font-weight: 600;
    }
    .content > p {
      color: #b3b3b3;
      line-height: 1.8;
      margin-bottom: 40px;
      font-size: 15px;
    }
    .section {
      margin-bottom: 45px;
    }
    .section-title {
      font-size: 20px;
      color: #ffffff;
      margin-bottom: 28px;
      display: flex;
      align-items: center;
      gap: 16px;
      font-weight: 700;
      padding-bottom: 16px;
      border-bottom: 3px solid #e50914;
      letter-spacing: 0.5px;
    }
    .section-icon {
      margin-right: 10px;
    }
    .section-title span:first-child {
      font-size: 28px;
      line-height: 1;
    }
    .movie-card {
      background: #282828;
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 18px;
      display: flex;
      align-items: flex-start;
      gap: 28px;
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      border: 2px solid transparent;
    }
    .movie-card:hover {
      background: #333333;
      border-color: #e50914;
      transform: translateX(6px);
      box-shadow: 0 10px 30px rgba(229, 9, 20, 0.2);
    }
    .movie-poster {
      width: 80px;
      height: 120px;
      border-radius: 8px;
      object-fit: cover;
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.6);
      flex-shrink: 0;
      margin-right: 15px;
    }
    .movie-info {
      flex: 1;
      padding-top: 2px;
    }
    .movie-title {
      font-weight: 700;
      color: #ffffff;
      margin: 0 0 12px 0;
      font-size: 18px;
      line-height: 1.4;
      letter-spacing: -0.2px;
    }
    .movie-meta {
      color: #b3b3b3;
      font-size: 14px;
      line-height: 1.8;
      font-weight: 400;
    }
    .section > p {
      color: #808080;
      font-size: 13px;
      margin-top: 16px;
      font-style: italic;
      line-height: 1.6;
    }
    .footer {
      background: #141414;
      padding: 35px 40px;
      text-align: center;
      color: #808080;
      font-size: 14px;
      border-top: 1px solid #333333;
    }
    .footer p:first-child {
      color: #ffffff;
      font-size: 18px;
      margin-bottom: 18px;
      font-weight: 600;
    }
    .footer p:last-child {
      font-size: 12px;
      opacity: 0.7;
      margin-top: 12px;
    }
    .cta-button {
      display: inline-block;
      background: #e50914;
      color: white;
      padding: 16px 40px;
      border-radius: 6px;
      text-decoration: none;
      font-weight: 700;
      margin-top: 30px;
      box-shadow: 0 4px 14px rgba(229, 9, 20, 0.4);
      transition: all 0.25s ease;
      font-size: 15px;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }
    .cta-button:hover {
      background: #f40612;
      box-shadow: 0 6px 20px rgba(229, 9, 20, 0.6);
      transform: translateY(-2px);
    }
    .divider {
      border: none;
      border-top: 1px solid #333333;
      margin: 40px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎬 Your Daily Movie Picks</h1>
      <p>Personalized recommendations just for you</p>
    </div>
    
    <div class="content">
      <p class="greeting">Hi ${userName}! 👋</p>
      <p style="color: #666; line-height: 1.6;">
        Ready for movie night? We've handpicked some films from your collection that we think you'll love watching ${newFavorites.length > 0 ? 'or rewatching ' : ''}tonight!
      </p>
      
      ${newFavorites.length > 0 ? `
      <div class="section">
        <div class="section-title">
          <span class="section-icon">⭐</span>
          <span>New Favorites to Watch</span>
        </div>
        ${newFavorites.map(movie => `
          <div class="movie-card">
            <img src="https://image.tmdb.org/t/p/w200${movie.posterPath}" alt="${movie.title}" class="movie-poster">
            <div class="movie-info">
              <h3 class="movie-title">${movie.title}</h3>
              <p class="movie-meta">
                ${movie.releaseDate ? new Date(movie.releaseDate).getFullYear() : 'N/A'} • 
                ${movie.runtime ? movie.runtime + ' min' : ''} • 
                ⭐ ${movie.voteAverage ? movie.voteAverage.toFixed(1) : 'N/A'}
              </p>
            </div>
          </div>
        `).join('')}
        <p style="color: #666; font-size: 14px; margin-top: 10px;">
          These are from your favorites list that you haven't watched yet!
        </p>
      </div>
      ` : ''}
      
      ${newLiked.length > 0 ? `
      <div class="section">
        <div class="section-title">
          <span class="section-icon">❤️</span>
          <span>Movies You'll Love</span>
        </div>
        ${newLiked.map(movie => `
          <div class="movie-card">
            <img src="https://image.tmdb.org/t/p/w200${movie.posterPath}" alt="${movie.title}" class="movie-poster">
            <div class="movie-info">
              <h3 class="movie-title">${movie.title}</h3>
              <p class="movie-meta">
                ${movie.releaseDate ? new Date(movie.releaseDate).getFullYear() : 'N/A'} • 
                ${movie.runtime ? movie.runtime + ' min' : ''} • 
                ⭐ ${movie.voteAverage ? movie.voteAverage.toFixed(1) : 'N/A'}
              </p>
            </div>
          </div>
        `).join('')}
        <p style="color: #666; font-size: 14px; margin-top: 10px;">
          These are from your liked movies that you haven't seen yet!
        </p>
      </div>
      ` : ''}
      
      ${rewatchMovies.length > 0 ? `
      <hr class="divider">
      <div class="section">
        <div class="section-title">
          <span class="section-icon">🔄</span>
          <span>Worth Rewatching</span>
        </div>
        ${rewatchMovies.map(movie => `
          <div class="movie-card">
            <img src="https://image.tmdb.org/t/p/w200${movie.posterPath}" alt="${movie.title}" class="movie-poster">
            <div class="movie-info">
              <h3 class="movie-title">${movie.title}</h3>
              <p class="movie-meta">
                ${movie.releaseDate ? new Date(movie.releaseDate).getFullYear() : 'N/A'} • 
                You rated it: ${'⭐'.repeat(movie.userRating || 0)}
              </p>
            </div>
          </div>
        `).join('')}
        <p style="color: #666; font-size: 14px; margin-top: 10px;">
          Sometimes the best movies are worth watching again!
        </p>
      </div>
      ` : ''}
      
      <div style="text-align: center; margin-top: 30px;">
        <a href="https://main.d1ur5bc2o4pggx.amplifyapp.com/liked" class="cta-button">View Your Collection</a>
      </div>
    </div>
    
    <div class="footer">
      <p>Happy watching! 🍿</p>
      <p style="margin-top: 10px; font-size: 12px;">
        You're receiving this because you have an account with SceneIt.
      </p>
      <p style="margin-top: 15px;">
        <a href="https://sceneit-backend-api.onrender.com/unsubscribe.html?email=${encodeURIComponent(userEmail)}" 
           style="color: #808080; text-decoration: underline; font-size: 12px;">
          Unsubscribe from daily recommendations
        </a>
      </p>
    </div>
  </div>
</body>
</html>
  `;
};

// Main function
const sendDailyRecommendations = async () => {
  try {
    console.log('🚀 Starting daily movie recommendations...');
    
    // Check for test email argument
    const testEmail = process.argv[2];
    if (testEmail) {
      console.log(`🧪 TEST MODE: Sending only to ${testEmail}`);
    }
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');
    
    // Get all users with email addresses, or just the test user
    let users;
    if (testEmail) {
      const testUser = await User.findOne({ email: testEmail });
      if (!testUser) {
        console.error(`❌ No user found with email: ${testEmail}`);
        process.exit(1);
      }
      users = [testUser];
      console.log(`✅ Found test user: ${testUser.displayName || testUser.email}`);
    } else {
      // Get all users with emails who haven't unsubscribed
      // Users without emailPreferences field or with unsubscribedFromRecommendations !== true
      users = await User.find({ 
        email: { $exists: true, $ne: null },
        $or: [
          { emailPreferences: { $exists: false } },
          { 'emailPreferences.unsubscribedFromRecommendations': { $ne: true } }
        ]
      });
      console.log(`📧 Found ${users.length} users with email addresses (excluding unsubscribed)`);
    }
    
    let emailsSent = 0;
    let emailsFailed = 0;
    
    for (const user of users) {
      try {
        console.log(`\n👤 Processing user: ${user.displayName || user.email}`);
        
        // Filter valid movie IDs
        const watchedIds = filterValidMovieIds(user.watchedMovies || []);
        const favoriteIds = filterValidMovieIds(user.favoriteMovies || []);
        const likedIds = filterValidMovieIds(user.likedMovies || []);
        
        console.log(`  📊 User stats: ${favoriteIds.length} favorites, ${likedIds.length} liked, ${watchedIds.length} watched`);
        
        // Find unwatched favorites
        const unwatchedFavoriteIds = favoriteIds.filter(id => !watchedIds.includes(id));
        const unwatchedFavorites = unwatchedFavoriteIds.length > 0
          ? await Movie.find({ tmdbId: { $in: unwatchedFavoriteIds } })
          : [];
        
        // Find unwatched liked movies
        const unwatchedLikedIds = likedIds.filter(id => !watchedIds.includes(id));
        const unwatchedLiked = unwatchedLikedIds.length > 0
          ? await Movie.find({ tmdbId: { $in: unwatchedLikedIds } })
          : [];
        
        // Find watched movies from favorites or liked
        const watchedFromCollectionIds = watchedIds.filter(id => 
          favoriteIds.includes(id) || likedIds.includes(id)
        );
        const watchedMovies = watchedFromCollectionIds.length > 0
          ? await Movie.find({ tmdbId: { $in: watchedFromCollectionIds } })
          : [];
        
        // Add user ratings to watched movies
        const watchedMoviesWithRatings = watchedMovies.map(movie => {
          const watchedEntry = user.watchedMovies.find(w => parseInt(w.movieId) === movie.tmdbId);
          return {
            ...movie.toObject(),
            userRating: watchedEntry?.rating || 0
          };
        });
        
        // Select random movies
        const newFavorites = getRandomItems(unwatchedFavorites, 2);
        const newLiked = getRandomItems(unwatchedLiked, 2);
        const rewatchMovies = getRandomItems(watchedMoviesWithRatings, 2);
        
        console.log(`  🎬 Selected: ${newFavorites.length} new favorites, ${newLiked.length} new liked, ${rewatchMovies.length} rewatch`);
        
        // Skip if no movies to recommend
        if (newFavorites.length === 0 && newLiked.length === 0 && rewatchMovies.length === 0) {
          console.log(`  ⏭️  Skipping ${user.email} - no movies to recommend`);
          continue;
        }
        
        // Generate email HTML
        const emailHTML = generateEmailHTML(
          user.displayName || 'Movie Lover',
          user.email,
          newFavorites,
          newLiked,
          rewatchMovies
        );
        
        // Send email
        const info = await transporter.sendMail({
          from: `"SceneIt 🎬" <${process.env.EMAIL_USER}>`,
          to: user.email,
          subject: '🎬 Your Daily Movie Picks Are Ready!',
          html: emailHTML
        });
        
        console.log(`  ✅ Email sent to ${user.email}`);
        emailsSent++;
        
      } catch (userError) {
        console.error(`  ❌ Error processing user ${user.email}:`, userError.message);
        emailsFailed++;
      }
    }
    
    console.log(`\n📊 Summary:`);
    console.log(`  ✅ Emails sent: ${emailsSent}`);
    console.log(`  ❌ Emails failed: ${emailsFailed}`);
    console.log(`  📧 Total users processed: ${users.length}`);
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
};

// Run the script
sendDailyRecommendations()
  .then(() => {
    console.log('✨ Daily recommendations complete!');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });
