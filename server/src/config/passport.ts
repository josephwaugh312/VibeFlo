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
import { verifyToken } from '../utils/jwt';

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
  passReqToCallback: true as true,
};

// Update JWT Strategy to use custom JWT verification
passport.use(
  new JwtStrategy(jwtOptions, async (req, payload, done) => {
    try {
      console.log('JWT Payload:', JSON.stringify(payload, null, 2));
      
      // Ensure payload has the expected structure
      if (!payload || !payload.id) {
        console.error('Invalid JWT payload structure:', payload);
        const error: any = new Error('Invalid token payload structure');
        error.statusCode = 401;
        error.code = 'INVALID_PAYLOAD';
        return done(error, false);
      }
      
      // Check if user exists in database
      const userResult = await db('users').where({ id: payload.id }).first();
      
      if (!userResult) {
        console.log(`User with ID ${payload.id} from token not found in database`);
        const error: any = new Error('User not found');
        error.statusCode = 401;
        error.code = 'USER_NOT_FOUND';
        return done(error, false);
      }
      
      // Add JWT payload to user object for debugging
      userResult._jwtPayload = payload;
      
      return done(null, userResult);
    } catch (error) {
      console.error('JWT strategy error:', error);
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
    callbackURL: process.env.GOOGLE_CALLBACK_URL || '/api/auth/google/callback',
    scope: ['profile', 'email']
  }, async (accessToken: string, refreshToken: string, profile: GoogleProfile, done: (error: any, user?: any) => void) => {
    try {
      const email = profile.emails?.[0]?.value;
      if (!email) {
        return done(new Error('No email provided from Google'), undefined);
      }

      // First check if user already exists with Google ID
      let user = await db('users').where({ google_id: profile.id }).first();
      
      // If not found by Google ID, try to find by email
      if (!user) {
        user = await db('users').where({ email }).first();
        
        if (user) {
          // User exists with this email but no Google ID - update the user
          console.log(`Updating existing user ${user.email} with Google credentials`);
          [user] = await db('users')
            .where({ id: user.id })
            .update({
              google_id: profile.id,
              avatar_url: user.avatar_url || profile.photos?.[0]?.value,
              is_verified: true
            })
            .returning('*');
        } else {
          // No user found - create a new one
          console.log(`Creating new user for ${email} from Google auth`);
          [user] = await db('users').insert({
            email,
            name: profile.displayName,
            username: email.split('@')[0] || profile.id,
            google_id: profile.id,
            avatar_url: profile.photos?.[0]?.value,
            is_verified: true
          }).returning('*');
        }
      }
      
      return done(null, user);
    } catch (error) {
      console.error('Error in Google auth strategy:', error);
      return done(error as Error, undefined);
    }
  }));
}

// GitHub Strategy
if (GITHUB_CLIENT_ID && GITHUB_CLIENT_SECRET) {
  passport.use(new GitHubStrategy({
    clientID: GITHUB_CLIENT_ID,
    clientSecret: GITHUB_CLIENT_SECRET,
    callbackURL: process.env.GITHUB_CALLBACK_URL || '/api/auth/github/callback',
    scope: ['user:email']
  }, async (accessToken: string, refreshToken: string, profile: GitHubProfile, done: (error: any, user?: any) => void) => {
    try {
      const email = profile.emails?.[0]?.value;
      if (!email) {
        return done(new Error('No email provided from GitHub'), undefined);
      }

      // First check if user already exists with GitHub ID
      let user = await db('users').where({ github_id: profile.id }).first();
      
      // If not found by GitHub ID, try to find by email
      if (!user) {
        user = await db('users').where({ email }).first();
        
        if (user) {
          // User exists with this email but no GitHub ID - update the user
          console.log(`Updating existing user ${user.email} with GitHub credentials`);
          [user] = await db('users')
            .where({ id: user.id })
            .update({
              github_id: profile.id,
              avatar_url: user.avatar_url || profile.photos?.[0]?.value,
              is_verified: true
            })
            .returning('*');
        } else {
          // No user found - create a new one
          console.log(`Creating new user for ${email} from GitHub auth`);
          [user] = await db('users').insert({
            email,
            name: profile.displayName || profile.username || email.split('@')[0],
            username: profile.username || email.split('@')[0] || profile.id,
            github_id: profile.id,
            avatar_url: profile.photos?.[0]?.value,
            is_verified: true
          }).returning('*');
        }
      }
      
      return done(null, user);
    } catch (error) {
      console.error('Error in GitHub auth strategy:', error);
      return done(error as Error, undefined);
    }
  }));
}

// Facebook Strategy
if (FACEBOOK_APP_ID && FACEBOOK_APP_SECRET) {
  passport.use(new FacebookStrategy({
    clientID: FACEBOOK_APP_ID,
    clientSecret: FACEBOOK_APP_SECRET,
    callbackURL: process.env.FACEBOOK_CALLBACK_URL || '/api/auth/facebook/callback',
    profileFields: ['id', 'emails', 'name', 'picture.type(large)']
  }, async (accessToken: string, refreshToken: string, profile: FacebookProfile, done: (error: any, user?: any) => void) => {
    try {
      const email = profile.emails?.[0]?.value;
      if (!email) {
        return done(new Error('No email provided from Facebook'), undefined);
      }

      // First check if user already exists with Facebook ID
      let user = await db('users').where({ facebook_id: profile.id }).first();
      
      // If not found by Facebook ID, try to find by email
      if (!user) {
        user = await db('users').where({ email }).first();
        
        if (user) {
          // User exists with this email but no Facebook ID - update the user
          console.log(`Updating existing user ${user.email} with Facebook credentials`);
          [user] = await db('users')
            .where({ id: user.id })
            .update({
              facebook_id: profile.id,
              avatar_url: user.avatar_url || profile.photos?.[0]?.value,
              is_verified: true
            })
            .returning('*');
        } else {
          // No user found - create a new one
          console.log(`Creating new user for ${email} from Facebook auth`);
          [user] = await db('users').insert({
            email,
            name: `${profile.name?.givenName} ${profile.name?.familyName}`,
            username: email.split('@')[0] || profile.id,
            facebook_id: profile.id,
            avatar_url: profile.photos?.[0]?.value,
            is_verified: true
          }).returning('*');
        }
      }
      
      return done(null, user);
    } catch (error) {
      console.error('Error in Facebook auth strategy:', error);
      return done(error as Error, undefined);
    }
  }));
}

export default passport; 