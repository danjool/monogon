const { verify, parseCookies, COOKIE_NAME } = require('./auth');

function requireAuth(req, res, next) {
  // Auth disabled when no password is configured (frictionless local dev).
  if (!process.env.AUTH_PASSWORD) return next();

  const token = parseCookies(req)[COOKIE_NAME];
  if (!token || !verify(token)) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  next();
}

module.exports = { requireAuth };
