import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { db } from '../db';

interface UserData {
  name: string;
  email: string;
  password: string;
  username: string;
}

interface LoginData {
  email: string;
  password: string;
}

/**
 * Register a new user
 */
export const register = async (userData: UserData) => {
  try {
    // Check if email already exists
    const existingUser = await db('users').where({ email: userData.email }).first();
    
    if (existingUser) {
      throw new Error('Email already exists');
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(userData.password, salt);
    
    // Create user
    const [userId] = await db('users').insert({
      name: userData.name,
      email: userData.email,
      username: userData.username,
      password: hashedPassword
    }).returning('id');
    
    return { 
      id: userId, 
      name: userData.name, 
      email: userData.email,
      username: userData.username 
    };
  } catch (error) {
    console.error('Error registering user:', error);
    throw error;
  }
};

/**
 * Authenticate a user login
 */
export const login = async (loginData: LoginData) => {
  try {
    // Find user by email
    const user = await db('users').where({ email: loginData.email }).first();
    
    if (!user) {
      throw new Error('Invalid credentials');
    }
    
    // Check password
    const isPasswordValid = await bcrypt.compare(loginData.password, user.password);
    
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '7d' }
    );
    
    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        username: user.username,
        bio: user.bio,
        avatar_url: user.avatar_url,
        created_at: user.created_at,
        updated_at: user.updated_at
      }
    };
  } catch (error) {
    console.error('Error authenticating user:', error);
    throw error;
  }
};

/**
 * Get the current user by ID
 */
export const getCurrentUser = async (userId: number) => {
  try {
    const user = await db('users')
      .where({ id: userId })
      .select('id', 'name', 'username', 'email', 'bio', 'avatar_url', 'created_at', 'updated_at')
      .first();
    
    if (!user) {
      throw new Error('User not found');
    }
    
    return user;
  } catch (error) {
    console.error('Error getting current user:', error);
    throw error;
  }
}; 