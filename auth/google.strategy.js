// CommonJS
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

passport.use(new GoogleStrategy(
  {
  clientID: process.env.AUTH_GOOGLE_ID,
  clientSecret: process.env.AUTH_GOOGLE_SECRET,
    callbackURL: '/auth/google/callback' // same shape as the doc
  },
  async (_accessToken, _refreshToken, profile, done) => {
    // Doc uses User.findOrCreate(...) — we’ll stub a user object for now
    const user = {
      id: profile.id,
      displayName: profile.displayName,
      email: profile.emails?.[0]?.value || null,
      photo: profile.photos?.[0]?.value || null
    };
    return done(null, user);
  }
));

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

module.exports = passport;
