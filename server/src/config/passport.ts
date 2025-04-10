import passport from 'passport';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as GitHubStrategy } from 'passport-github2';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import { Profile as GoogleProfile } from 'passport-google-oauth20';
import { Profile as GitHubProfile } from 'passport-github2';
import { Profile as FacebookProfile } from 'passport-facebook';
import dotenv from 'dotenv';
import { db } from '../db';
import { User } from '../models/user.model';

dotenv.config();

// Ensure required environment variables are present
const {
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GITHUB_CLIENT_ID,
  GITHUB_CLIENT_SECRET,
  FACEBOOK_APP_ID,
  FACEBOOK_APP_SECRET
} = process.env;

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
  console.warn('Google OAuth credentials not configured');
}

if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET) {
  console.warn('GitHub OAuth credentials not configured');
}

if (!FACEBOOK_APP_ID || !FACEBOOK_APP_SECRET) {
  console.warn('Facebook OAuth credentials not configured');
}

// JWT Strategy
const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET || 'fallback_jwt_secret',
};

passport.use(
  new JwtStrategy(jwtOptions, async (payload, done) => {
    try {
      // Check if user exists in database
      const userResult = await db('users').where({ id: payload.id }).first();
      
      if (userResult) {
        return done(null, userResult);
      }
      
      return done(null, false);
    } catch (error) {
      return done(error, false);
    }
  })
);

passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: number, done) => {
  try {
    const user = await db('users').where({ id }).first();
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Google Strategy
if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
    clientID: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5001/api/auth/google/callback',
    scope: ['profile', 'email']
  }, async (accessToken: string, refreshToken: string, profile: GoogleProfile, done: (error: any, user?: any) => void) => {
    try {
      let user = await db('users').where({ google_id: profile.id }).first();
      
      if (!user) {
        // Create new user
        const [newUser] = await db('users').insert({
          email: profile.emails?.[0]?.value,
          name: profile.displayName,
          username: profile.emails?.[0]?.value?.split('@')[0] || profile.id,
          google_id: profile.id,
          avatar_url: profile.photos?.[0]?.value,
          is_verified: true
        }).returning('*');
        
        user = newUser;
      }
      
      return done(null, user);
    } catch (error) {
      return done(error as Error, undefined);
    }
  }));
}

// GitHub Strategy
if (GITHUB_CLIENT_ID && GITHUB_CLIENT_SECRET) {
  passport.use(new GitHubStrategy({
    clientID: GITHUB_CLIENT_ID,
    clientSecret: GITHUB_CLIENT_SECRET,
    callbackURL: process.env.GITHUB_CALLBACK_URL || 'http://localhost:5001/api/auth/github/callback',
    scope: ['user:email']
  }, async (accessToken: string, refreshToken: string, profile: GitHubProfile, done: (error: any, user?: any) => void) => {
    try {
      let user = await db('users').where({ github_id: profile.id }).first();
      
      if (!user) {
        // Create new user
        const [newUser] = await db('users').insert({
          email: profile.emails?.[0]?.value,
          name: profile.displayName,
          username: profile.username || profile.id,
          github_id: profile.id,
          avatar_url: profile.photos?.[0]?.value,
          is_verified: true
        }).returning('*');
        
        user = newUser;
      }
      
      return done(null, user);
    } catch (error) {
      return done(error as Error, undefined);
    }
  }));
}

// Facebook Strategy
if (FACEBOOK_APP_ID && FACEBOOK_APP_SECRET) {
  passport.use(new FacebookStrategy({
    clientID: FACEBOOK_APP_ID,
    clientSecret: FACEBOOK_APP_SECRET,
    callbackURL: process.env.FACEBOOK_CALLBACK_URL || 'http://localhost:5001/api/auth/facebook/callback',
    profileFields: ['id', 'emails', 'name', 'picture.type(large)']
  }, async (accessToken: string, refreshToken: string, profile: FacebookProfile, done: (error: any, user?: any) => void) => {
    try {
      let user = await db('users').where({ facebook_id: profile.id }).first();
      
      if (!user) {
        // Create new user
        const [newUser] = await db('users').insert({
          email: profile.emails?.[0]?.value,
          name: `${profile.name?.givenName} ${profile.name?.familyName}`,
          username: profile.emails?.[0]?.value?.split('@')[0] || profile.id,
          facebook_id: profile.id,
          avatar_url: profile.photos?.[0]?.value,
          is_verified: true
        }).returning('*');
        
        user = newUser;
      }
      
      return done(null, user);
    } catch (error) {
      return done(error as Error, undefined);
    }
  }));
}

export default passport; 