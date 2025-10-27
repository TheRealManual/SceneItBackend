const ensureAuthenticated = (req, res, next) => {
  if (req.isAuthenticated?.()) return next();
  res.status(401).json({ error: 'Not authenticated' });
};

const loginSuccess = (req, res) => {
  // Redirect to frontend after successful login
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  res.redirect(frontendUrl);
};

const loginFailure = (_req, res) => {
  // Redirect to frontend with error
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  res.redirect(`${frontendUrl}?error=auth_failed`);
};

const me = (req, res) => {
  res.json({ user: req.user || null });
};

const logout = (req, res, next) => {
  req.logout(err => {
    if (err) return next(err);
    req.session.destroy(() => {
      res.clearCookie('connect.sid');
      res.json({ status: 'ok' });
    });
  });
};

module.exports = {
  ensureAuthenticated,
  loginSuccess,
  loginFailure,
  me,
  logout
};
