const crypto = require('crypto');

// Dependency-free signed token (HMAC-SHA256). Not a full JWT, but the same
// shape: base64url(payload).base64url(signature). Single-user, gates writes.

const THIRTY_DAYS_SEC = 30 * 24 * 60 * 60;

function base64url(buf) {
  return Buffer.from(buf).toString('base64url');
}

function getSecret() {
  // Sign with JWT_SECRET if set, else derive from AUTH_PASSWORD so a token is
  // invalidated when the password changes. One of them must exist for auth to
  // be enabled (see middleware/login, which short-circuit when AUTH_PASSWORD
  // is unset).
  return process.env.JWT_SECRET || process.env.AUTH_PASSWORD || '';
}

function sign(payload, { expiresInSec = THIRTY_DAYS_SEC } = {}) {
  const body = { ...payload, exp: Math.floor(Date.now() / 1000) + expiresInSec };
  const encoded = base64url(JSON.stringify(body));
  const sig = crypto.createHmac('sha256', getSecret()).update(encoded).digest();
  return `${encoded}.${base64url(sig)}`;
}

function verify(token) {
  if (typeof token !== 'string' || !token.includes('.')) return null;
  const [encoded, providedSig] = token.split('.');
  if (!encoded || !providedSig) return null;

  const expectedSig = crypto.createHmac('sha256', getSecret()).update(encoded).digest();
  let provided;
  try {
    provided = Buffer.from(providedSig, 'base64url');
  } catch {
    return null;
  }
  // Constant-time compare; lengths must match for timingSafeEqual.
  if (provided.length !== expectedSig.length) return null;
  if (!crypto.timingSafeEqual(provided, expectedSig)) return null;

  let payload;
  try {
    payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
  if (!payload || typeof payload.exp !== 'number') return null;
  if (payload.exp < Math.floor(Date.now() / 1000)) return null;

  return payload;
}

function parseCookies(req) {
  const header = req.headers.cookie;
  if (!header) return {};
  return Object.fromEntries(
    header.split(';').map((c) => {
      const idx = c.indexOf('=');
      const k = c.slice(0, idx).trim();
      const v = c.slice(idx + 1).trim();
      return [k, decodeURIComponent(v)];
    })
  );
}

const COOKIE_NAME = 'token';

function setTokenCookie(res, token) {
  const parts = [
    `${COOKIE_NAME}=${token}`,
    'HttpOnly',
    'Path=/',
    'SameSite=Lax',
    `Max-Age=${THIRTY_DAYS_SEC}`,
  ];
  if (process.env.NODE_ENV === 'production') parts.push('Secure');
  res.append('Set-Cookie', parts.join('; '));
}

function clearTokenCookie(res) {
  const parts = [`${COOKIE_NAME}=`, 'HttpOnly', 'Path=/', 'SameSite=Lax', 'Max-Age=0'];
  if (process.env.NODE_ENV === 'production') parts.push('Secure');
  res.append('Set-Cookie', parts.join('; '));
}

module.exports = { sign, verify, parseCookies, setTokenCookie, clearTokenCookie, COOKIE_NAME, THIRTY_DAYS_SEC };
