const express = require('express');
const { requireAdmin, adminLimiter } = require('../middleware/auth');

const router = express.Router();

// POST /api/admin/login
// The client sends the password in the x-admin-password header.
// 200 = correct, 401 = wrong.
router.post('/login', adminLimiter, requireAdmin, (req, res) => {
  res.json({ ok: true });
});

module.exports = router;