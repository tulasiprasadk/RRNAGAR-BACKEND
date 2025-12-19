// backend/routes/admin/settings.js
// Admin settings management (margin, delivery, discount)

const express = require("express");
const router = express.Router();
const { AdminSettings } = require("../../models");

// Middleware: Require admin session
router.use((req, res, next) => {
  if (!req.session || !req.session.adminId) {
    return res.status(401).json({ error: "Admin login required" });
  }
  next();
});

// GET current settings
router.get("/", async (req, res) => {
  let settings = await AdminSettings.findOne();
  if (!settings) settings = await AdminSettings.create({});
  res.json(settings);
});

// UPDATE settings
router.put("/", async (req, res) => {
  let settings = await AdminSettings.findOne();
  if (!settings) settings = await AdminSettings.create({});
  Object.assign(settings, req.body);
  await settings.save();
  res.json(settings);
});

module.exports = router;
