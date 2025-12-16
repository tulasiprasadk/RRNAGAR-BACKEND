/**
 * backend/index.js
 * RR Nagar Backend – FINAL STABLE FILE
 */

require("dotenv").config();

const express = require("express");
const session = require("express-session");
const cors = require("cors");
const bodyParser = require("body-parser");
const { sequelize } = require("./models");

const customerAuthRoutes = require("./routes/customer/auth");
const customerProfileRoutes = require("./routes/customer/profile");

const app = express();

// Detect production
const isProd = process.env.NODE_ENV === "production";

// Trust proxy on Render
if (isProd) {
  app.set("trust proxy", 1);
}

/* =============================
   CORS CONFIG (STABLE)
============================= */
const allowedOrigins = (
  process.env.CORS_ORIGINS ||
  [
    // Local
    "http://localhost:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
    "http://localhost:4173",

    // GitHub Pages
    "https://tulasiprasadk.github.io",

    // Vercel
    "https://rrnagar-coming-soon.vercel.app",

    // Custom domains
    "https://rrnagar.com",
    "https://www.rrnagar.com",
  ].join(",")
)
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.warn("❌ Blocked by CORS:", origin);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  })
);

/* =============================
   BODY PARSERS
============================= */
app.use(bodyParser.json({ charset: "utf-8" }));
app.use(bodyParser.urlencoded({ extended: true, charset: "utf-8" }));

/* =============================
   SESSION SETUP
============================= */
app.use(
  session({
    secret: process.env.SESSION_SECRET || "rrnagar-secret-key",
    resave: false,
    saveUninitialized: false,
    name: "rrnagar.sid",
    cookie: {
      maxAge: 24 * 60 * 60 * 1000,
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "none" : "lax",
      path: "/",
    },
  })
);

/* =============================
   DEBUG LOG
============================= */
app.use((req, res, next) => {
  console.log(
    `📨 ${req.method} ${req.path} | Session: ${req.sessionID || "none"}`
  );
  next();
});

/* =============================
   ROUTES
============================= */

app.get("/", (req, res) => {
  res.send("RR Nagar Backend Running");
});

// CUSTOMER
app.use("/api/auth", customerAuthRoutes);
app.use("/api/customer/profile", customerProfileRoutes);
app.use("/api/customer/address", require("./routes/customer/address"));
app.use("/api/customer/dashboard-stats", require("./routes/customer/dashboard-stats"));
app.use("/api/customer/payment", require("./routes/customer/payment"));
app.use("/api/customer/saved-suppliers", require("./routes/customer/saved-suppliers"));

// ADMIN
app.use("/api/admin/auth", require("./routes/admin/auth"));
app.use("/api/admin", require("./routes/admin"));
app.use("/api/admin/orders", require("./routes/admin/orders"));
app.use("/api/admin/notifications", require("./routes/admin/notifications"));
app.use("/api/admin/payments", require("./routes/admin-payments"));

// SUPPLIER
app.use("/api/supplier/auth", require("./routes/supplier/auth"));
app.use("/api/supplier/orders", require("./routes/supplier/orders"));
app.use("/api/suppliers", require("./routes/suppliers"));

// GENERAL
app.use("/api/products", require("./routes/products"));
app.use("/api/categories", require("./routes/categories"));
app.use("/api/orders", require("./routes/orders"));
app.use("/api/shops", require("./routes/shops"));
app.use("/api/stock", require("./routes/stock"));
app.use("/api/ads", require("./routes/ads"));
app.use("/api/analytics", require("./routes/analytics"));
app.use("/api/upload", require("./routes/upload"));
app.use("/api", require("./routes/partner"));

app.use("/uploads", express.static("uploads"));

/* =============================
   ERROR HANDLER
============================= */
app.use((err, req, res, next) => {
  console.error("❌ Server error:", err);
  res.status(500).json({ error: err.message });
});

/* =============================
   START SERVER
============================= */
const PORT = process.env.PORT || 4000;

sequelize
  .sync()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 RR Nagar backend running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ Database error:", err);
    process.exit(1);
  });
