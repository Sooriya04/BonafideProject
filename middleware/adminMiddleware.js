// middleware/adminMiddleware.js

// check if logged in at all
function ensureLoggedIn(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  }
  return res.redirect('/auth/login');
}

// check if logged in AND is admin
function ensureAdmin(req, res, next) {
  if (req.session?.user?.role === 'admin') {
    return next();
  }
  return res.status(403).send('Forbidden: Admins only');
}

function ensureUser(req, res, next) {
  if (req.session?.user?.role === 'user') {
    return next();
  }
  return res.status(403).send('Forbidden: Users only');
}

module.exports = {
  ensureLoggedIn,
  ensureAdmin,
  ensureUser,
};
