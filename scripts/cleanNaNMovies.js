const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const cleanNaNMovies = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sceneit', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('Connected to MongoDB');
    
    // Find all users
    const users = await User.find({});
    console.log(`Found ${users.length} users`);
    
    let totalCleaned = 0;
    
    for (const user of users) {
      let userModified = false;
      
      // Count NaN entries before cleaning
      const nanLiked = user.likedMovies.filter(m => m.movieId === 'NaN' || isNaN(parseInt(m.movieId))).length;
      const nanDisliked = user.dislikedMovies.filter(m => m.movieId === 'NaN' || isNaN(parseInt(m.movieId))).length;
      const nanFavorites = user.favoriteMovies.filter(m => m.movieId === 'NaN' || isNaN(parseInt(m.movieId))).length;
      
      if (nanLiked > 0 || nanDisliked > 0 || nanFavorites > 0) {
        console.log(`\nUser ${user.email || user.googleId}:`);
        console.log(`  - Liked: ${nanLiked} NaN entries`);
        console.log(`  - Disliked: ${nanDisliked} NaN entries`);
        console.log(`  - Favorites: ${nanFavorites} NaN entries`);
        
        // Remove NaN entries
        user.likedMovies = user.likedMovies.filter(m => {
          const id = parseInt(m.movieId);
          return m.movieId !== 'NaN' && !isNaN(id) && isFinite(id);
        });
        
        user.dislikedMovies = user.dislikedMovies.filter(m => {
          const id = parseInt(m.movieId);
          return m.movieId !== 'NaN' && !isNaN(id) && isFinite(id);
        });
        
        user.favoriteMovies = user.favoriteMovies.filter(m => {
          const id = parseInt(m.movieId);
          return m.movieId !== 'NaN' && !isNaN(id) && isFinite(id);
        });
        
        await user.save();
        userModified = true;
        totalCleaned += nanLiked + nanDisliked + nanFavorites;
        
        console.log(`  ✓ Cleaned user's movie lists`);
      }
    }
    
    console.log(`\n✅ Cleanup complete! Removed ${totalCleaned} NaN entries total.`);
    
  } catch (error) {
    console.error('Error cleaning NaN movies:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
};

cleanNaNMovies();
