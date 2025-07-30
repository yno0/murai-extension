import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import session from 'express-session';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import UserInfo from './models/userInfoModel.js';
import User from './models/userModel.js';
// Import routes
import { findOrCreateGoogleUser } from './controller/authController.js';
import routes from './routes/index.js';
const app = express();
const PORT = process.env.PORT || 3000;
// Load environment variables
dotenv.config();

const MONGO_URI = process.env.MONGO_URI;
const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY;

app.use(cors());
app.use(express.json());
app.use('/api', routes);

app.use(session({ secret: 'your_secret', resave: false, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());


passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: 'http://localhost:3000/api/auth/google/callback'
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const user = await findOrCreateGoogleUser(profile);
    return done(null, user);
  } catch (err) {
    return done(err, null);
  }
}));

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  const user = await User.findById(id);
  done(null, user);
});

// Routes
app.get('/api/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
app.get('/api/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/auth/google/failure' }),
  async (req, res) => {
    console.log('Google callback hit, authentication successful');
    try {
      const user = req.user;
      
      // Check if user has complete profile (has phone number)
      const userInfo = await UserInfo.findOne({ userId: user._id });
      
      if (userInfo && userInfo.phoneNumber) {
        // User has complete profile, redirect to client dashboard
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET_KEY, { expiresIn: '1h' });
        const params = new URLSearchParams({
          token,
          email: user.email,
          name: user.name
        }).toString();
        res.redirect(`http://localhost:5173/client/dashboard?${params}`);
      } else {
        // User needs to complete profile
        const email = user.email;
        const firstName = user.firstName || '';
        const lastName = user.lastName || '';
        const params = new URLSearchParams({
          email,
          firstName,
          lastName
        }).toString();
        res.redirect(`http://localhost:5173/complete-profile?${params}`);
      }
    } catch (error) {
      console.error('Error in Google callback:', error);
      res.redirect('http://localhost:5173/login?error=authentication_failed');
    }
  }
);

app.get('/auth/google/failure', (req, res) => {
  res.status(401).send('Google authentication failed. Please try again or contact support.');
});

async function connectDB() {
  try {
    await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1);
  }
}

connectDB();

app.get('/', (req, res) => {
  res.send('Murai Server is running');
}
);

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});