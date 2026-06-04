const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/auth/google/callback`,
      proxy: true,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user already exists with this email
        const email = profile.emails[0].value;
        let user = await User.findOne({ email });
        
        if (user) {
          // If user exists but hasn't linked Google, update their googleId and avatar
          if (!user.googleId) {
            user.googleId = profile.id;
            user.avatar = profile.photos[0]?.value;
            await user.save();
          }
          return done(null, user);
        }
        
        // Check if user exists with this googleId (in case email changed)
        user = await User.findOne({ googleId: profile.id });
        if (user) {
          return done(null, user);
        }
        
        // Create new user
        const newUser = await User.create({
          name: profile.displayName,
          email: email,
          googleId: profile.id,
          avatar: profile.photos[0]?.value,
          password: require('crypto').randomBytes(20).toString('hex'), // Random password
          role: (await User.countDocuments()) === 0 ? 'admin' : 'user',
        });
        
        done(null, newUser);
      } catch (err) {
        console.error('Google OAuth error:', err);
        done(err, null);
      }
    }
  )
);

module.exports = passport;