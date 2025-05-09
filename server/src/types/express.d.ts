import express from 'express';
import { User as AppUser, TestUser } from '.';

// Define a user type that matches your database schema
interface User {
  id: number;
  name: string;
  email: string;
  password?: string;
  profile_picture?: string;
  google_id?: string;
  facebook_id?: string;
  created_at?: Date;
  updated_at?: Date;
}

declare global {
  namespace Express {
    // Extend Express.User interface to be compatible with our app's User type
    interface User {
      id?: number;
      name?: string;
      username?: string;
      email?: string;
      is_admin?: boolean;
      is_verified?: boolean;
      role?: string;
      password?: string;
      profile_picture?: string;
      avatar_url?: string;
      google_id?: string;
      facebook_id?: string;
      github_id?: string;
      bio?: string;
      created_at?: Date;
      updated_at?: Date;
    }
    
    interface Request {
      user?: User | TestUser | AppUser;
      // Add app.locals typing for tests
      app?: {
        locals?: {
          db?: any;
        }
      } & Express.Application;
    }
  }
} 