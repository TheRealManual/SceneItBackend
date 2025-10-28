// CommonJS
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');
const mongoose = require('mongoose');

// Check if Google OAuth credentials are configured
if (!process.env.AUTH_GOOGLE_ID || !process.env.AUTH_GOOGLE_SECRET) {
  console.warn('WARNING: Google OAuth credentials not configured!');
  console.warn('Please set AUTH_GOOGLE_ID and AUTH_GOOGLE_SECRET environment variables');
  console.warn('Authentication will not work until these are configured');
} else {
  passport.use(new GoogleStrategy(
    {
      clientID: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL || '/auth/google/callback'
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        // Check if MongoDB is connected
        if (mongoose.connection.readyState !== 1) {
          console.error('MongoDB not connected - cannot authenticate user');
          return done(new Error('Database connection not available'), null);
        }

        // Find or create user in database with timeout
        const findUserPromise = User.findOne({ googleId: profile.id });
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Database query timeout')), 5000)
        );
        
        let user = await Promise.race([findUserPromise, timeoutPromise]);
        
        if (user) {
          // Update existing user info
          user.displayName = profile.displayName;
          user.email = profile.emails?.[0]?.value || user.email;
          user.photo = profile.photos?.[0]?.value || user.photo;
          
          const savePromise = user.save();
          const saveTimeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Database save timeout')), 5000)
          );
          await Promise.race([savePromise, saveTimeoutPromise]);
        } else {
          // Create new user
          const createPromise = User.create({
            googleId: profile.id,
            displayName: profile.displayName,
            email: profile.emails?.[0]?.value || '',
            photo: profile.photos?.[0]?.value || null
          });
          const createTimeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Database create timeout')), 5000)
          );
          user = await Promise.race([createPromise, createTimeoutPromise]);
        }
        
        return done(null, user);
      } catch (error) {
        console.error('Error in Google Strategy:', error.message);
        return done(error, null);
      }
    }
  ));
}

passport.serializeUser((user, done) => {
  // Store only the MongoDB _id in the session
  done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
  try {
    // Check if MongoDB is connected
    if (mongoose.connection.readyState !== 1) {
      console.error('MongoDB not connected - cannot deserialize user');
      return done(new Error('Database connection not available'), null);
    }

    // Retrieve the full user object from database with timeout
    const findPromise = User.findById(id);
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Database query timeout')), 5000)
    );
    
    const user = await Promise.race([findPromise, timeoutPromise]);
    done(null, user);
  } catch (error) {
    console.error('Error deserializing user:', error.message);
    done(error, null);
  }
});

module.exports = passport;
