require('./db');

const express = require('express');
const path = require('path');
const fs = require('fs');
const { sign, verify, parseCookies, setTokenCookie, clearTokenCookie, COOKIE_NAME } = require('./auth');

// Fail closed in production: auth is disabled when AUTH_PASSWORD is unset (fine
// for local dev, dangerous on a public host — a missing env var would silently
// make the app world-writable). Refuse to mount rather than serve open. The
// host's try/catch around the mount keeps the rest of the site running.
if (process.env.NODE_ENV === 'production' && !process.env.AUTH_PASSWORD) {
  throw new Error('AUTH_PASSWORD must be set in production (refusing to run with auth disabled)');
}

const ROOT = path.join(__dirname, '..');

// The app's routes as a mountable Router. The host (dev entry point below, or
// monogon) mounts this under a prefix and is responsible for parsing JSON
// bodies — monogon already applies a global express.json(), so the router does
// not add its own to avoid double-parsing. Only the CSV import route brings its
// own body parser, since the host's JSON parser won't touch text/csv.
const router = express.Router();

// Rate-limit login attempts. This is a single-user gate with no dependency on an
// external store, so a small in-memory sliding window per client IP is enough: it
// throttles brute-force against /api/login without adding a package. State lives
// in one process (monogon runs a single node instance); it resets on restart,
// which is fine for this purpose. A successful login clears the offender's count.
const LOGIN_WINDOW_MS = 15 * 60 * 1000; // 15 min
const LOGIN_MAX_ATTEMPTS = 10;          // failed attempts per window per IP
const loginAttempts = new Map();        // ip -> { count, first }

function clientIp(req) {
  // Behind nginx-proxy, the real client IP is the first entry of X-Forwarded-For.
  const xff = req.headers['x-forwarded-for'];
  if (xff) return xff.split(',')[0].trim();
  return req.socket?.remoteAddress || 'unknown';
}

function loginRateLimit(req, res, next) {
  const ip = clientIp(req);
  const now = Date.now();
  const rec = loginAttempts.get(ip);
  if (rec && now - rec.first < LOGIN_WINDOW_MS) {
    if (rec.count >= LOGIN_MAX_ATTEMPTS) {
      const retryMs = LOGIN_WINDOW_MS - (now - rec.first);
      res.setHeader('Retry-After', Math.ceil(retryMs / 1000));
      return res.status(429).json({ error: 'too many attempts, try again later' });
    }
  } else {
    loginAttempts.set(ip, { count: 0, first: now });
  }
  next();
}

// Occasionally drop expired records so the map can't grow unbounded.
setInterval(() => {
  const now = Date.now();
  for (const [ip, rec] of loginAttempts) {
    if (now - rec.first >= LOGIN_WINDOW_MS) loginAttempts.delete(ip);
  }
}, LOGIN_WINDOW_MS).unref();

router.post('/api/login', loginRateLimit, (req, res) => {
  const password = process.env.AUTH_PASSWORD;
  if (!password) return res.json({ ok: true, authed: true });
  const ip = clientIp(req);
  if (req.body?.password === password) {
    loginAttempts.delete(ip); // clear on success so a legit user is never locked out
    const token = sign({ sub: 'owner' });
    setTokenCookie(res, token);
    return res.json({ ok: true, authed: true });
  }
  const rec = loginAttempts.get(ip);
  if (rec) rec.count += 1;
  res.status(401).json({ error: 'wrong password' });
});

router.post('/api/logout', (req, res) => {
  clearTokenCookie(res);
  res.json({ ok: true });
});

// Lets the client learn its auth state — it can't read the HttpOnly cookie.
router.get('/api/me', (req, res) => {
  if (!process.env.AUTH_PASSWORD) return res.json({ authed: true, authRequired: false });
  const token = parseCookies(req)[COOKIE_NAME];
  res.json({ authed: !!(token && verify(token)), authRequired: true });
});

router.use('/media', express.static(path.join(ROOT, 'media')));
router.use('/data', express.static(path.join(ROOT, 'data')));

router.use('/api/decks', require('./routes/decks'));
router.use('/api/study', require('./routes/study'));
router.use('/api/cards', require('./routes/cards'));
router.use('/api/import', express.text({ type: 'text/csv' }), require('./routes/import'));
router.use('/api/stats', require('./routes/stats'));

router.get('/api/glosses', (req, res) => {
  const dir = path.join(ROOT, 'data', 'glosses');
  if (!fs.existsSync(dir)) return res.json([]);
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));
  const passages = files.map(f => {
    try { return JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')); }
    catch { return null; }
  }).filter(Boolean);
  res.json(passages);
});

module.exports = router;
