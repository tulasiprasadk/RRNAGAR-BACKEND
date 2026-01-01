/**
 * backend/passport.js
 * Google OAuth – Customer (Version-1 compatible)
 */

const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const { Customer, Supplier } = require("./models");

/* =========================
   SERIALIZATION
========================= */

passport.serializeUser((user, done) => {
  if (user instanceof Supplier) {
    done(null, { id: user.id, type: "Supplier" });
  } else {
    done(null, { id: user.id, type: "Customer" });
  }
});

passport.deserializeUser(async (obj, done) => {
  try {
    if (obj.type === "Supplier") {
      const supplier = await Supplier.findByPk(obj.id);
      return done(null, supplier);
    } else {
      const customer = await Customer.findByPk(obj.id);
      return done(null, customer);
    }
  } catch (err) {
    done(err);
  }
});

/* =========================
   CUSTOMER GOOGLE STRATEGY
========================= */

passport.use(
  "customer-google",
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL:
        process.env.GOOGLE_CUSTOMER_CALLBACK_URL ||
        "/api/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        if (!email) return done(null, false);

        let customer = await Customer.findOne({ where: { email } });

        if (!customer) {
          customer = await Customer.create({
            name: profile.displayName,
            email,
            username: email,
          });
        }

        return done(null, customer);
      } catch (err) {
        return done(err);
      }
    }
  )
);

module.exports = passport;
