const ensureAuthenticated = (req, res, next) => {
  if (req.isAuthenticated?.()) return next();
  res.status(401).json({ error: 'Not authenticated' });
};

const loginSuccess = (req, res) => {
  res.json({ status: 'ok', user: req.user });
};

const loginFailure = (_req, res) => {
  res.status(401).json({ status: 'error', message: 'Google authentication failed' });
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
