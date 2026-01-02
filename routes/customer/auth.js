/**
 * backend/routes/customer/auth.js
 * Customer Authentication Routes
 * OTP stored in DB (no in-memory store)
 */


import express from "express";
import { getModels } from "../../config/database.js";
import { sendOTP } from "../../services/emailService.js";
import passport from "../../passport.js";

const router = express.Router();
const { Customer } = getModels();

// Google OAuth Customer Login
router.get("/google", passport.authenticate("customer-google", { scope: ["profile", "email"] }));

// Google OAuth Customer Callback
router.get(
  "/google/callback",
  passport.authenticate("customer-google", {
    failureRedirect: "/login?error=google",
    session: true,
  }),
  (req, res) => {
    // Redirect to customer dashboard or send a success response
    res.redirect("/customer/dashboard");
  }
);

/* =====================================================
   REQUEST EMAIL OTP
   POST /api/auth/request-email-otp
===================================================== */
router.post("/request-email-otp", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email or username is required" });
  }

  try {
    let customer;

    // Email OR username login
    if (email.includes("@")) {
      customer = await Customer.findOne({ where: { email } });

      // Auto-create customer if not exists (email flow)
      if (!customer) {
        customer = await Customer.create({ email });
      }
    } else {
      customer = await Customer.findOne({ where: { username: email } });
    }

    if (!customer || !customer.email) {
      return res.status(404).json({ error: "User not found" });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Save OTP in DB
    await customer.update({
      otpCode: otp,
      otpExpiresAt: expiresAt,
    });

    // Send OTP
    await sendOTP(customer.email, otp);

    console.log("📧 CUSTOMER OTP SENT:", customer.email, otp);

    res.json({
      success: true,
      message: "OTP sent to email",
    });
  } catch (err) {
    console.error("Customer OTP Send Error:", err);
    res.status(500).json({ error: "Failed to send OTP" });
  }
});

/* =====================================================
   VERIFY EMAIL OTP
   POST /api/auth/verify-email-otp
===================================================== */
router.post("/verify-email-otp", async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ error: "Email and OTP required" });
  }

  try {
    let customer;

    if (email.includes("@")) {
      customer = await Customer.findOne({ where: { email } });
    } else {
      customer = await Customer.findOne({ where: { username: email } });
    }

    if (!customer || !customer.otpCode) {
      return res.status(401).json({ error: "Invalid OTP" });
    }

    if (
      customer.otpCode !== otp ||
      new Date() > customer.otpExpiresAt
    ) {
      return res.status(401).json({ error: "Invalid or expired OTP" });
    }

    // Clear OTP after success
    await customer.update({
      otpCode: null,
      otpExpiresAt: null,
    });

    // Save session
    req.session.customerId = customer.id;

    res.json({
      success: true,
      message: "OTP verified, logged in",
      customerId: customer.id,
    });
  } catch (err) {
    console.error("Customer Verify OTP Error:", err);
    res.status(500).json({ error: "Verification failed" });
  }
});

/* =====================================================
   CHECK LOGIN STATUS
   GET /api/auth/me
===================================================== */
router.get("/me", async (req, res) => {
  if (!req.session?.customerId) {
    return res.status(401).json({ loggedIn: false });
  }

  try {
    const customer = await Customer.findByPk(req.session.customerId, {
      attributes: { exclude: ["otpCode", "otpExpiresAt", "password"] },
    });

    if (!customer) {
      return res.status(401).json({ loggedIn: false });
    }

    res.json({
      loggedIn: true,
      user: customer,
    });
  } catch (err) {
    console.error("Customer Auth Check Error:", err);
    res.status(500).json({ loggedIn: false });
  }
});

/* =====================================================
   LOGOUT
   POST /api/auth/logout
===================================================== */
router.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("rrnagar.sid");
    res.json({ success: true });
  });
});

export default router;
