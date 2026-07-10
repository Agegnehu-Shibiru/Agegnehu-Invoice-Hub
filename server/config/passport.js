const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const TwitterStrategy = require('passport-twitter').Strategy;
const User = require('../models/User');
const logger = require('../utils/logger');

const BASE_URL = process.env.CLIENT_URL || 'http://localhost:5000';

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

// ── Google ─────────────────────────────────────────────────────────────────────
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${BASE_URL}/api/v1/auth/google/callback`,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ googleId: profile.id }).setOptions({ includeDeleted: false });
        if (!user) {
          user = await User.findOne({ email: profile.emails?.[0]?.value?.toLowerCase() });
          if (user) {
            user.googleId = profile.id;
            if (!user.authProviders.includes('google')) user.authProviders.push('google');
            await user.save({ validateBeforeSave: false });
          } else {
            user = await User.create({
              name: profile.displayName,
              email: profile.emails?.[0]?.value?.toLowerCase(),
              googleId: profile.id,
              avatar: profile.photos?.[0]?.value,
              isEmailVerified: true,
              authProviders: ['google'],
            });
          }
        }
        return done(null, user);
      } catch (err) {
        logger.error('Google OAuth error:', err);
        return done(err);
      }
    }
  )
);

// ── Facebook ───────────────────────────────────────────────────────────────────
passport.use(
  new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_APP_ID,
      clientSecret: process.env.FACEBOOK_APP_SECRET,
      callbackURL: `${BASE_URL}/api/v1/auth/facebook/callback`,
      profileFields: ['id', 'displayName', 'photos', 'email'],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ facebookId: profile.id });
        if (!user) {
          const email = profile.emails?.[0]?.value?.toLowerCase();
          user = email ? await User.findOne({ email }) : null;
          if (user) {
            user.facebookId = profile.id;
            if (!user.authProviders.includes('facebook')) user.authProviders.push('facebook');
            await user.save({ validateBeforeSave: false });
          } else {
            user = await User.create({
              name: profile.displayName,
              email,
              facebookId: profile.id,
              avatar: profile.photos?.[0]?.value,
              isEmailVerified: !!email,
              authProviders: ['facebook'],
            });
          }
        }
        return done(null, user);
      } catch (err) {
        logger.error('Facebook OAuth error:', err);
        return done(err);
      }
    }
  )
);

// ── Twitter / X ────────────────────────────────────────────────────────────────
passport.use(
  new TwitterStrategy(
    {
      consumerKey: process.env.TWITTER_API_KEY,
      consumerSecret: process.env.TWITTER_API_SECRET,
      callbackURL: `${BASE_URL}/api/v1/auth/twitter/callback`,
      includeEmail: true,
    },
    async (token, tokenSecret, profile, done) => {
      try {
        let user = await User.findOne({ twitterId: profile.id });
        if (!user) {
          const email = profile.emails?.[0]?.value?.toLowerCase();
          user = email ? await User.findOne({ email }) : null;
          if (user) {
            user.twitterId = profile.id;
            if (!user.authProviders.includes('twitter')) user.authProviders.push('twitter');
            await user.save({ validateBeforeSave: false });
          } else {
            user = await User.create({
              name: profile.displayName,
              email,
              twitterId: profile.id,
              avatar: profile.photos?.[0]?.value,
              isEmailVerified: !!email,
              authProviders: ['twitter'],
            });
          }
        }
        return done(null, user);
      } catch (err) {
        logger.error('Twitter OAuth error:', err);
        return done(err);
      }
    }
  )
);

module.exports = passport;
