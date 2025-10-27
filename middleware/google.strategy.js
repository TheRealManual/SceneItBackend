// CommonJS
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

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
        // Find or create user in database
        let user = await User.findOne({ googleId: profile.id });
        
        if (user) {
          // Update existing user info
          user.displayName = profile.displayName;
          user.email = profile.emails?.[0]?.value || user.email;
          user.photo = profile.photos?.[0]?.value || user.photo;
          await user.save();
        } else {
          // Create new user
          user = await User.create({
            googleId: profile.id,
            displayName: profile.displayName,
            email: profile.emails?.[0]?.value || '',
            photo: profile.photos?.[0]?.value || null
          });
        }
        
        return done(null, user);
      } catch (error) {
        console.error('Error in Google Strategy:', error);
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
    // Retrieve the full user object from database
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;
