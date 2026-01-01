/**
 * backend/routes/customer/auth.js
 * Customer Authentication Routes – FINAL CLEAN
 */

const express = require("express");
const router = express.Router();
const { Customer } = require("../../models");
const { sendOTP } = require("../../services/emailService");
const passport = require("passport");
const isProd = process.env.NODE_ENV === "production";

/* =====================================================
   REQUEST EMAIL OTP
   POST /api/auth/request-email-otp
===================================================== */
router.post("/request-email-otp", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email required" });
  }

  try {
    let customer;

    if (email.includes("@")) {
      customer = await Customer.findOne({ where: { email } });
      if (!customer) {
        customer = await Customer.create({ email });
      }
    } else {
      customer = await Customer.findOne({ where: { username: email } });
    }

    // Always return success to avoid user enumeration
    if (!customer?.email) {
      return res.json({ success: true });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await customer.update({
      otpCode: otp,
      otpExpiresAt: expiresAt
    });

    await sendOTP(customer.email, otp);

    if (!isProd) {
      console.log("📧 OTP SENT (DEV):", customer.email, otp);
    }

    res.json({ success: true, message: "OTP sent" });
  } catch (err) {
    console.error("❌ OTP Send Error:", err);
    res.status(500).json({ error: "Failed to send OTP" });
  }
});

/* =====================================================
   VERIFY EMAIL OTP
   POST /api/auth/verify-email-otp
===================================================== */
// OTP bypass: only require email for login
router.post("/verify-email-otp", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email required" });
  }

  try {
    let customer;
    if (email.includes("@")) {
      customer = await Customer.findOne({ where: { email } });
      if (!customer) {
        customer = await Customer.create({ email });
      }
    } else {
      customer = await Customer.findOne({ where: { username: email } });
      if (!customer) {
        customer = await Customer.create({ username: email });
      }
    }

    req.session.customerId = customer.id;

    req.session.save(() => {
      res.json({
        success: true,
        customerId: customer.id
      });
    });
  } catch (err) {
    console.error("❌ OTP Verify Error:", err);
    res.status(500).json({ error: "Failed to verify OTP" });
  }
});

/* =====================================================
   CHECK LOGIN STATUS
   GET /api/auth/me
===================================================== */
router.get("/me", (req, res) => {
  if (!req.session?.customerId) {
    return res.status(401).json({ loggedIn: false });
  }

  res.json({
    loggedIn: true,
    customerId: req.session.customerId
  });
});

/* =====================================================
   LOGOUT
   POST /api/auth/logout
===================================================== */
router.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("rrnagar.sid", {
      path: "/",
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "none" : "lax"
    });
    res.json({ success: true });
  });
});

/* =====================================================
   GOOGLE OAUTH (CUSTOMER)
   GET /api/auth/google
   GET /api/auth/google/callback
===================================================== */

router.get(
  "/google",
  passport.authenticate("customer-google", {
    scope: ["profile", "email"]
  })
);

router.get(
  "/google/callback",
  passport.authenticate("customer-google", {
    failureRedirect: "/login",
  }),
  (req, res) => {
    // Attach customer session (same pattern as OTP)
    req.session.customerId = req.user.id;

    req.session.save(() => {
      res.redirect("/"); // frontend will handle logged-in state
    });
  }
);


module.exports = router;
