/**
 * backend/routes/supplier/auth.js
 * Supplier Authentication (Email OTP)
 */

const express = require("express");
const router = express.Router();
const { Supplier } = require("../../models");
const { sendOTP } = require("../../services/emailService");
const passport = require("../../passport").default || require("../../passport");
// Google OAuth Supplier Login
router.get("/google", passport.authenticate("supplier-google", { scope: ["profile", "email"] }));

// Google OAuth Supplier Callback
router.get(
  "/google/callback",
  passport.authenticate("supplier-google", {
    failureRedirect: "/login?error=google",
    session: true,
  }),
  (req, res) => {
    // Redirect to supplier dashboard or send a success response
    res.redirect("/supplier/dashboard");
  }
);

const otpStore = {}; // Format: { email: { otp: "123456", expiresAt: timestamp } }

/* =====================================================
   REQUEST EMAIL OTP (Supplier Login)
   POST /api/supplier/auth/request-email-otp
   ===================================================== */
// OTP bypass: always succeed for email login
router.post("/request-email-otp", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  try {
    // Check if supplier exists
    const supplier = await Supplier.findOne({ where: { email } });

    if (!supplier) {
      return res.status(404).json({ error: "Supplier not found with this email" });
    }

    // Check approval status
    if (supplier.status === 'pending') {
      return res.status(403).json({ 
        error: "Your account is pending admin approval",
        status: 'pending'
      });
    }

    if (supplier.status === 'rejected') {
      return res.status(403).json({ 
        error: "Your account has been rejected",
        status: 'rejected',
        reason: supplier.rejectionReason
      });
    }

    // Bypass OTP: always succeed
    res.json({
      success: true,
      message: "OTP bypassed for development",
    });
  } catch (err) {
    console.error("Supplier OTP Send Error:", err);
    res.status(500).json({ error: "Failed to send OTP" });
  }
});

/* =====================================================
   VERIFY EMAIL OTP (Supplier Login)
   POST /api/supplier/auth/verify-email-otp
   ===================================================== */
// OTP bypass: always succeed for verification
// Require password for supplier login (OTP bypassed)
const bcrypt = require("bcryptjs");
router.post("/verify-email-otp", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    // Find supplier
    const supplier = await Supplier.findOne({ where: { email } });

    if (!supplier || supplier.status !== 'approved') {
      return res.status(403).json({ error: "Access denied" });
    }

    // Check password
    if (!supplier.password || !(await bcrypt.compare(password, supplier.password))) {
      return res.status(401).json({ error: "Invalid password" });
    }

    // Save supplier ID in session
    req.session.supplierId = supplier.id;

    res.json({
      success: true,
      message: "Login successful",
      supplier: {
        id: supplier.id,
        name: supplier.name,
        email: supplier.email,
        businessName: supplier.businessName
      }
    });
  } catch (err) {
    console.error("Supplier Login Error:", err);
    res.status(500).json({ error: "Failed to login" });
  }
});

/* =====================================================
   CHECK LOGIN STATUS
   GET /api/supplier/auth/me
   ===================================================== */
router.get("/me", async (req, res) => {
  if (!req.session || !req.session.supplierId) {
    return res.status(401).json({ loggedIn: false });
  }

  try {
    const supplier = await Supplier.findByPk(req.session.supplierId);
    
    if (!supplier) {
      return res.status(401).json({ loggedIn: false });
    }

    res.json({
      loggedIn: true,
      supplier: {
        id: supplier.id,
        name: supplier.name,
        email: supplier.email,
        businessName: supplier.businessName,
        status: supplier.status
      }
    });
  } catch (err) {
    console.error("Supplier Auth Check Error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/* =====================================================
   LOGOUT
   POST /api/supplier/auth/logout
   ===================================================== */
router.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: "Logout failed" });
    }

    res.clearCookie("rrnagar.sid");
    res.json({ success: true });
  });
});

module.exports = router;
