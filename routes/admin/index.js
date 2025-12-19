const express = require("express");
const router = express.Router();

// Proxy GET /me to /auth/me for admin session check
router.get('/me', (req, res, next) => {
  req.url = '/me';
  require('./auth')(req, res, next);
});

// Proxy POST /login to /auth/verify-email-otp for admin login
router.post('/login', async (req, res, next) => {
  // Forward the request to /auth/verify-email-otp
  req.url = '/verify-email-otp';
  require('./auth')(req, res, next);
});

// Test route to verify admin router is working
router.get('/test', (req, res) => {
  res.json({ success: true, message: 'Admin router is working' });
});

router.use("/notifications", require("./notifications"));
router.use("/orders", require("./orders"));
router.use("/products", require("./products"));
router.use("/categories", require("./categories"));
router.use("/settings", require("./settings"));
router.use("/auth", require("./auth"));
router.use("/charts", require("./charts"));
// /api/admin/stats is handled by /charts.js as /stats
router.use("/stats", require("./charts"));

module.exports = router;