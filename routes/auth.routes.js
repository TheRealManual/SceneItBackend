const router = require('express').Router();
const passport = require('../middleware/google.strategy');
const { ensureAuthenticated, loginSuccess, loginFailure, logout, me } = require('../controllers/auth.controller');

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
