const crypto = require('crypto');
const rateLimit = require('express-rate-limit');

// Compare hashes so the check takes the same time however many characters match
const safeEqual = (a, b) => {
  const ha = crypto.createHash('sha256').update(String(a)).digest();
  const hb = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(ha, hb);
};

// Counts only FAILED attempts (status 400+), so normal admin use is never throttled
const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { message: 'Too many failed attempts. Try again in 15 minutes.' },
});

function requireAdmin(req, res, next) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) {
    return res.status(500).json({ message: 'Admin password is not configured' });
  }
  const given = req.get('x-admin-password');
  if (!given || !safeEqual(given, expected)) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  next();
}

module.exports = { requireAdmin, adminLimiter };