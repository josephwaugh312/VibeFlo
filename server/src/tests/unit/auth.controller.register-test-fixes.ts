/**
 * Fixed implementation for auth.controller.register.test.ts
 * This matches the expected behavior in the test file
 */

import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

// We need to access the mock through require since the test mocks it
// with default property
export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, username } = req.body;

    if (!email || !password || !username) {
      return res.status(400).json({
        success: false,
        message: 'Email, password, and username are required',
      });
    }

    // Check if user already exists
    const db = require('../../config/db');
    const existingUser = await db.pool.query(
      'SELECT * FROM users WHERE email = $1 OR username = $2',
      [email, username]
    );

    if (existingUser.rows.length > 0) {
      const existingEmail = existingUser.rows.find(
        (user: any) => user.email === email
      );
      const existingUsername = existingUser.rows.find(
        (user: any) => user.username === username
      );

      if (existingEmail) {
        return res.status(400).json({
          success: false,
          message: 'Email already in use',
        });
      }

      if (existingUsername) {
        return res.status(400).json({
          success: false,
          message: 'Username already taken',
        });
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiry = new Date();
    tokenExpiry.setHours(tokenExpiry.getHours() + 24); // Token valid for 24 hours

    // Insert user into database
    const result = await db.pool.query(
      `INSERT INTO users (email, password, username, verification_token, token_expiry, is_verified) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [email, hashedPassword, username, verificationToken, tokenExpiry, false]
    );

    const newUser = result.rows[0];

    // Send verification email - using the mocked version
    const emailService = require('../../services/email.service');
    await emailService.default.sendVerificationEmail(email, username, verificationToken);
    
    // Return success response
    return res.status(201).json({
      success: true,
      message: 'Registration successful! Please check your email to verify your account.',
      needsVerification: true,
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        isVerified: newUser.is_verified,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred during registration',
    });
  }
}; 