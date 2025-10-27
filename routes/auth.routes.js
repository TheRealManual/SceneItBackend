const router = require('express').Router();
const passport = require('../middleware/google.strategy');
const { ensureAuthenticated, loginSuccess, loginFailure, logout, me } = require('../controllers/auth.controller');
const User = require('../models/User');

// Development mode auto-login route
router.get('/dev-login', async (req, res) => {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return res.status(403).json({ error: 'Dev login only available in development mode' });
  }

  try {
    // Dev user credentials
    const DEV_USER = {
      googleId: 'dev-user-123',
      displayName: 'Dev User',
      email: 'dev@sceneit.local',
      photo: 'https://via.placeholder.com/150'
    };

    // Find or create dev user
    let user = await User.findOne({ googleId: DEV_USER.googleId });
    
    if (!user) {
      user = await User.create(DEV_USER);
      console.log('Created dev user:', user.displayName);
    }

    // Log the user in
    req.login(user, (err) => {
      if (err) {
        console.error('Dev login error:', err);
        return res.status(500).json({ error: 'Failed to login dev user' });
      }
      
      console.log('Dev user logged in:', user.displayName);
      
      // Redirect to frontend
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      res.redirect(frontendUrl);
    });
  } catch (error) {
    console.error('Dev auth error:', error);
    res.status(500).json({ error: 'Dev login failed' });
  }
});

// Step 3 in doc: start Google OAuth
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

// Callback (doc redirects home; we send JSON)
router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/auth/failure', session: true }),
  loginSuccess
);

router.get('/failure', loginFailure);
router.get('/me', ensureAuthenticated, me);
router.post('/logout', logout);

module.exports = router;
