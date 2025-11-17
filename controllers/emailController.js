const emailService = require('../services/emailService');
const UserPreferences = require('../models/UserPreferences');

const sendRecommendationEmail = async (req, res) => {
  try {
    const { userId, movies } = req.body;

    // Find user preferences
    const userPrefs = await UserPreferences.findOne({ userId });
    if (!userPrefs) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!userPrefs.emailOptIn) {
      return res.status(400).json({ error: 'User has opted out of emails' });
    }

    // Send email
    const result = await emailService.sendMovieEmail(
      userPrefs.email, 
      userPrefs.name, 
      movies
    );

    if (result.success) {
      res.json({ 
        message: 'Email sent successfully', 
        messageId: result.messageId 
      });
    } else {
      res.status(500).json({ error: result.error });
    }

  } catch (error) {
    console.error('Error in sendRecommendationEmail:', error);
    res.status(500).json({ error: error.message });
  }
};

const saveUserPreferences = async (req, res) => {
  try {
    const { userId, email, name, favoriteGenres, likedMovies, emailOptIn } = req.body;

    const userPrefs = await UserPreferences.findOneAndUpdate(
      { userId },
      {
        userId,
        email,
        name,
        favoriteGenres: favoriteGenres || [],
        likedMovies: likedMovies || [],
        emailOptIn: emailOptIn !== undefined ? emailOptIn : true
      },
      { upsert: true, new: true }
    );

    res.json({ message: 'User preferences saved', userPrefs });

  } catch (error) {
    console.error('Error in saveUserPreferences:', error);
    res.status(500).json({ error: error.message });
  }
};

const getUserPreferences = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const userPrefs = await UserPreferences.findOne({ userId });
    if (!userPrefs) {
      return res.status(404).json({ error: 'User preferences not found' });
    }

    res.json(userPrefs);

  } catch (error) {
    console.error('Error in getUserPreferences:', error);
    res.status(500).json({ error: error.message });
  }
};

const sendLikedMoviesEmail = async (req, res) => {
  try {
    console.log('📧 Sending liked movies email...');
    
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const User = require('../models/User');
    const user = await User.findById(req.user._id).populate('likedMovies');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.likedMovies || user.likedMovies.length === 0) {
      return res.status(400).json({ error: 'No liked movies found' });
    }

    // Format movies for email
    const formattedMovies = user.likedMovies.map(movie => ({
      title: movie.title || 'Unknown Title',
      genre: movie.genres?.[0]?.name || movie.genre || 'Various',
      rating: movie.vote_average || movie.rating || 'N/A',
      overview: movie.overview || 'No description available'
    }));

    // Send email using the email service
    const result = await emailService.sendEmail(
      user.email || user.googleId + '@gmail.com',
      `🎬 Your SceneIt Movie Collection (${formattedMovies.length} movies)`,
      generateMoviesEmailHTML(formattedMovies, user.displayName || user.name),
      generateMoviesEmailText(formattedMovies, user.displayName || user.name)
    );

    if (result.success) {
      console.log('📧 Email sent successfully');
      res.json({ 
        message: 'Email sent successfully!',
        previewURL: result.previewURL 
      });
    } else {
      console.error('📧 Failed to send email:', result.error);
      res.status(500).json({ error: 'Failed to send email' });
    }

  } catch (error) {
    console.error('Error in sendLikedMoviesEmail:', error);
    res.status(500).json({ error: error.message });
  }
};

const generateMoviesEmailHTML = (movies, userName) => {
  const currentDate = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Your SceneIt Movie Collection</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh;">
      <div style="max-width: 700px; margin: 0 auto; background: white; box-shadow: 0 10px 30px rgba(0,0,0,0.2);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 2.2em; font-weight: 700; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">
            🎬 SceneIt
          </h1>
          <p style="margin: 10px 0 0 0; font-size: 1.1em; opacity: 0.9;">Your Personal Movie Collection</p>
          <div style="width: 60px; height: 3px; background: rgba(255,255,255,0.8); margin: 20px auto; border-radius: 2px;"></div>
        </div>

        <!-- Welcome Message -->
        <div style="padding: 30px;">
          <h2 style="color: #333; font-size: 1.4em; margin: 0 0 15px 0;">Hello ${userName || 'Movie Lover'}! 👋</h2>
          <p style="color: #666; font-size: 16px; line-height: 1.6; margin: 0 0 25px 0;">
            Here's your curated collection of <strong>${movies.length} amazing movies</strong> you've loved on SceneIt. 
            Perfect for your next movie night! 🍿
          </p>
        </div>

        <!-- Movies Grid -->
        <div style="padding: 0 30px 30px;">
          ${movies.map((movie, index) => {
            const posterUrl = movie.posterPath ? 
              `https://image.tmdb.org/t/p/w300${movie.posterPath}` : 
              'https://via.placeholder.com/200x300/667eea/white?text=No+Poster';
            
            const genres = movie.genres && movie.genres.length > 0 ? 
              movie.genres.slice(0, 3).map(g => g.name).join(', ') : 
              movie.genre || 'Various';
            
            const year = movie.releaseDate ? 
              new Date(movie.releaseDate).getFullYear() : 
              'Unknown';
            
            const rating = movie.voteAverage || movie.rating || 'N/A';
            
            return `
              <div style="display: flex; margin-bottom: 25px; padding: 20px; border: 1px solid #e9ecef; border-radius: 12px; background: linear-gradient(135deg, #f8f9ff 0%, #ffffff 100%); box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                
                <!-- Movie Poster -->
                <div style="flex-shrink: 0; margin-right: 20px;">
                  <img src="${posterUrl}" 
                       alt="${movie.title} poster" 
                       style="width: 80px; height: 120px; border-radius: 8px; object-fit: cover; box-shadow: 0 4px 12px rgba(0,0,0,0.2);" />
                </div>

                <!-- Movie Details -->
                <div style="flex: 1;">
                  <h3 style="margin: 0 0 8px 0; font-size: 1.2em; color: #2d3748; font-weight: 600;">
                    ${movie.title} ${year !== 'Unknown' ? `(${year})` : ''}
                  </h3>
                  
                  <div style="margin-bottom: 10px;">
                    <span style="background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 4px 12px; border-radius: 15px; font-size: 12px; font-weight: 600; text-transform: uppercase;">
                      ${genres}
                    </span>
                  </div>

                  ${rating !== 'N/A' ? `
                    <div style="margin-bottom: 12px;">
                      <span style="color: #f59e0b; font-weight: 600; font-size: 14px;">
                        ⭐ ${typeof rating === 'number' ? rating.toFixed(1) : rating}/10
                      </span>
                    </div>
                  ` : ''}

                  ${movie.overview ? `
                    <p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 1.5;">
                      ${movie.overview.length > 180 ? movie.overview.substring(0, 180) + '...' : movie.overview}
                    </p>
                  ` : ''}
                </div>
              </div>
            `;
          }).join('')}
        </div>

        <!-- Stats Section -->
        <div style="background: #f8f9ff; padding: 25px 30px; margin: 0 30px 30px; border-radius: 12px; text-align: center;">
          <h3 style="margin: 0 0 15px 0; color: #4c51bf; font-size: 1.1em;">📊 Your Collection Stats</h3>
          <div style="display: flex; justify-content: space-around; flex-wrap: wrap;">
            <div style="margin: 5px;">
              <div style="font-size: 1.5em; font-weight: bold; color: #667eea;">${movies.length}</div>
              <div style="font-size: 12px; color: #666; text-transform: uppercase;">Total Movies</div>
            </div>
            <div style="margin: 5px;">
              <div style="font-size: 1.5em; font-weight: bold; color: #667eea;">
                ${movies.filter(m => (m.voteAverage || m.rating || 0) >= 7).length}
              </div>
              <div style="font-size: 12px; color: #666; text-transform: uppercase;">High Rated</div>
            </div>
            <div style="margin: 5px;">
              <div style="font-size: 1.5em; font-weight: bold; color: #667eea;">
                ${[...new Set(movies.flatMap(m => 
                  m.genres ? m.genres.map(g => g.name) : [m.genre]
                ).filter(Boolean))].length}
              </div>
              <div style="font-size: 12px; color: #666; text-transform: uppercase;">Genres</div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div style="background: #2d3748; color: white; padding: 25px 30px; text-align: center;">
          <p style="margin: 0 0 10px 0; font-size: 16px;">
            🍿 <strong>Happy watching!</strong>
          </p>
          <p style="margin: 0 0 15px 0; font-size: 14px; opacity: 0.8;">
            Generated on ${currentDate} by SceneIt
          </p>
          <div style="border-top: 1px solid rgba(255,255,255,0.2); padding-top: 15px; margin-top: 15px;">
            <p style="margin: 0; font-size: 12px; opacity: 0.7;">
              This email was sent because you requested your movie collection from SceneIt.<br>
              Keep discovering amazing movies! 🎭
            </p>
          </div>
        </div>

      </div>
    </body>
    </html>
  `;
};

const generateMoviesEmailText = (movies, userName) => {
  const currentDate = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  const moviesList = movies.map((movie, index) => {
    const genres = movie.genres && movie.genres.length > 0 ? 
      movie.genres.slice(0, 3).map(g => g.name).join(', ') : 
      movie.genre || 'Various';
    
    const year = movie.releaseDate ? 
      new Date(movie.releaseDate).getFullYear() : 
      '';
    
    const rating = movie.voteAverage || movie.rating || 'N/A';
    
    const overview = movie.overview ? 
      (movie.overview.length > 100 ? movie.overview.substring(0, 100) + '...' : movie.overview) : 
      '';

    return `${index + 1}. ${movie.title}${year ? ` (${year})` : ''}
   Genre: ${genres}
   Rating: ${rating}/10
   ${overview ? `Description: ${overview}` : ''}
   `;
  }).join('\n');

  const stats = {
    total: movies.length,
    highRated: movies.filter(m => (m.voteAverage || m.rating || 0) >= 7).length,
    genres: [...new Set(movies.flatMap(m => 
      m.genres ? m.genres.map(g => g.name) : [m.genre]
    ).filter(Boolean))].length
  };

  return `🎬 SCENEIT - YOUR MOVIE COLLECTION
========================================

Hello ${userName || 'Movie Lover'}!

Here's your curated collection of ${movies.length} amazing movies you've loved on SceneIt:

${moviesList}

📊 COLLECTION STATS
===================
Total Movies: ${stats.total}
High Rated (7+): ${stats.highRated}
Different Genres: ${stats.genres}

🍿 Happy watching!

Generated on ${currentDate}
- The SceneIt Team

This email was sent because you requested your movie collection from SceneIt.
Keep discovering amazing movies!`;
};

module.exports = {
  sendRecommendationEmail,
  saveUserPreferences,
  getUserPreferences,
  sendLikedMoviesEmail
};
