import pool from '../config/db';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

const email = 'joseph.waugh312@gmail.com';
const username = 'josephwaugh';
const password = 'testPassword123'; // Change this to your desired password
const name = 'Joseph Waugh';

async function createTestUser() {
  try {
    console.log('Checking if user already exists:', email);
    
    // First check if the user already exists
    const existingUser = await pool.query(
      'SELECT * FROM users WHERE email = $1 OR username = $2',
      [email, username]
    );
    
    if (existingUser.rows.length > 0) {
      console.log('User already exists, updating password instead');
      
      // Hash the new password
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Update the user's password
      await pool.query(
        'UPDATE users SET password = $1, is_verified = true WHERE email = $2',
        [hashedPassword, email]
      );
      
      console.log('Password updated successfully');
      console.log('User can now login with:');
      console.log('Email:', email);
      console.log('Password:', password);
      return;
    }
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('Password hash created');
    
    // Create a new user
    const result = await pool.query(
      `INSERT INTO users (email, username, password, name, is_verified) 
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [email, username, hashedPassword, name, true]
    );
    
    const newUser = result.rows[0];
    console.log('Test user created successfully:', { 
      id: newUser.id,
      email: newUser.email,
      username: newUser.username,
      is_verified: newUser.is_verified
    });
    console.log('User can now login with:');
    console.log('Email:', email);
    console.log('Password:', password);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit();
  }
}

createTestUser(); 