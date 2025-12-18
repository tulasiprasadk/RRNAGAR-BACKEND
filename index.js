/**
 * backend/index.js
 * RR Nagar Backend – FINAL CLEAN (NODE 22 + RENDER + VERCEL)
 */

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const session = require("express-session");
const { sequelize } = require("./models");

const app = express();

/* =============================
   ENV + PROXY
============================= */
const isProd = process.env.NODE_ENV === "production";

if (isProd) {
  app.set("trust proxy", 1);
}

/* =============================
   CORS (SINGLE, FINAL)
============================= */
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
  "https://rrnagar-coming-soon.vercel.app",
  "https://rrnagar.com",
  "https://www.rrnagar.com",
  "https://rrnagar-coming-soon.vercel.app/"
];

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      console.error("❌ CORS BLOCKED:", origin);
      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

/* =============================
   BODY PARSERS
============================= */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* =============================
   SESSION
============================= */
app.use(
  session({
    name: "rrnagar.sid",
    secret: process.env.SESSION_SECRET || "rrnagar-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000,
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "none" : "lax",
    },
  })
);

/* =============================
   REQUEST LOGGER
============================= */
app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.originalUrl}`);
  next();
});

/* =============================
   ROUTES
============================= */
app.get("/", (req, res) => {
  res.send("RR Nagar Backend Running");
});

// CUSTOMER
app.use("/api/auth", require("./routes/customer/auth"));
app.use("/api/customer/profile", require("./routes/customer/profile"));
app.use("/api/customer/address", require("./routes/customer/address"));

// ADMIN
app.use("/api/admin/auth", require("./routes/admin/auth"));
app.use("/api/admin", require("./routes/admin"));

// GENERAL
app.use("/api/products", require("./routes/products"));
app.use("/api/categories", require("./routes/categories"));
app.use("/api/orders", require("./routes/orders"));

app.use("/uploads", express.static("uploads"));

/* =============================
   404 HANDLER (CRITICAL)
============================= */
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

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
    app.listen(PORT, () =>
      console.log(`🚀 RR Nagar backend running on port ${PORT}`)
    );
  })
  .catch((err) => {
    console.error("❌ Database error:", err);
    process.exit(1);
  });
