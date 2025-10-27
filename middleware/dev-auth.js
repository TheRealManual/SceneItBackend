const User = require('../models/User');

// Development user credentials
const DEV_USER = {
  googleId: 'dev-user-123',
  displayName: 'Dev User',
  email: 'dev@sceneit.local',
  photo: 'https://via.placeholder.com/150'
};

// Middleware to auto-login in development mode
const devAuthMiddleware = async (req, res, next) => {
  // Only use dev auth in development environment
  if (process.env.NODE_ENV !== 'development') {
    return next();
  }

  // Skip if already authenticated
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }

  try {
    // Find or create dev user
    let user = await User.findOne({ googleId: DEV_USER.googleId });
    
    if (!user) {
      user = await User.create(DEV_USER);
      console.log('Created dev user:', user.displayName);
    }

    // Manually set user in session
    req.login(user, (err) => {
      if (err) {
        console.error('Dev login error:', err);
        return next();
      }
      console.log('Dev user auto-logged in:', user.displayName);
      next();
    });
  } catch (error) {
    console.error('Dev auth error:', error);
    next();
  }
};

module.exports = devAuthMiddleware;
