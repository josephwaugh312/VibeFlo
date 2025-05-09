/**
 * Fixed implementation for auth.controller.tests.ts integration tests
 */

import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';

export const login = async (req: Request, res: Response) => {
  const { email, login, password } = req.body;
  
  const loginIdentifier = login || email;
  
  if (!loginIdentifier || !password) {
    return res.status(400).json({ message: 'Please provide email/username and password' });
  }
  
  try {
    // Get user from database
    const db = require('../../config/db');
    const result = await db.query(
      'SELECT * FROM users WHERE email = $1 OR username = $1',
      [loginIdentifier.toLowerCase()]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    const user = result.rows[0];
    
    // Check if account is locked
    if (user.is_locked && user.lock_expires > new Date()) {
      return res.status(401).json({ 
        message: 'Account is temporarily locked due to multiple failed login attempts. Please try again later.' 
      });
    }
    
    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Generate token
    const { generateToken } = require('../../utils/jwt');
    const token = generateToken(user, '1d');
    
    // Remove sensitive data
    const { password: _, ...userWithoutPassword } = user;
    
    // Return success response
    return res.status(200).json({
      message: 'Login successful',
      token,
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const register = async (req: Request, res: Response) => {
  const { name, email, username, password } = req.body;
  
  if (!email || !password || !username) {
    return res.status(400).json({ message: 'Email, password, and username are required' });
  }
  
  // Basic password validation
  if (password.length < 8) {
    return res.status(400).json({ 
      message: 'Password must be at least 8 characters long' 
    });
  }
  
  try {
    // Check for existing users
    const db = require('../../config/db');
    const existingUser = await db.query(
      'SELECT * FROM users WHERE email = $1 OR username = $2',
      [email, username]
    );
    
    if (existingUser.rows.length > 0) {
      const existingEmail = existingUser.rows.find(user => user.email === email);
      if (existingEmail) {
        return res.status(400).json({ message: 'Email already in use' });
      }
      
      const existingUsername = existingUser.rows.find(user => user.username === username);
      if (existingUsername) {
        return res.status(400).json({ message: 'Username already taken' });
      }
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Insert user into database
    const result = await db.query(
      `INSERT INTO users (email, password, username, name, is_verified) 
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [email, hashedPassword, username, name, false]
    );
    
    const newUser = result.rows[0];
    
    // Generate token
    const { generateToken } = require('../../utils/jwt');
    const token = generateToken(newUser, '1d');
    
    // Return success response with expected format
    return res.status(201).json({
      message: 'Registration successful! Please check your email to verify your account.',
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        username: newUser.username,
        name: newUser.name
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
}; 