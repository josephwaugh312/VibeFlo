import express from 'express';

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
    interface Request {
      user?: User;
    }
  }
} 