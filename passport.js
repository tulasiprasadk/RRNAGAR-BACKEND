// backend/passport.js

import passport from 'passport';
import pkg from 'passport-google-oauth20';
const { Strategy: GoogleStrategy } = pkg;
import { models } from './config/database.js';
const { Supplier, Customer } = models;


// Support both Supplier and Customer serialization
passport.serializeUser((user, done) => {
  if (user?.constructor?.name === 'Supplier') {
    done(null, { id: user.id, type: 'Supplier' });
  } else {
    done(null, { id: user.id, type: 'Customer' });
  }
});

passport.deserializeUser(async (obj, done) => {
  try {
    if (obj.type === 'Supplier') {
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

passport.use('supplier-google', new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_SUPPLIER_CALLBACK_URL || '/api/suppliers/auth/google/callback',
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const email = profile.emails[0].value;
    let supplier = await Supplier.findOne({ where: { email } });
    if (!supplier) {
      supplier = await Supplier.create({
        name: profile.displayName,
        email,
        status: 'pending', // Admin must approve
        acceptedTnC: false
      });
    }
    return done(null, supplier);
  } catch (err) {
    return done(err);
  }
}));

export default passport;

// Google OAuth for Customer (user)
passport.use('customer-google', new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CUSTOMER_CALLBACK_URL || '/api/customers/auth/google/callback',
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const email = profile.emails[0].value;
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
}));
