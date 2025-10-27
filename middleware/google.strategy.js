// CommonJS
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

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
      const user = {
        id: profile.id,
        displayName: profile.displayName,
        email: profile.emails?.[0]?.value || null,
        photo: profile.photos?.[0]?.value || null
      };
      return done(null, user);
    }
  ));
}

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

module.exports = passport;
