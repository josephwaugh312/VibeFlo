import pool from '../config/db';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

const email = 'joseph.waugh312@gmail.com';
const newPassword = 'testPassword123'; // Change this to your desired new password

async function resetPassword() {
  try {
    console.log('Looking up user:', email);
    
    // First check if the user exists
    const userResult = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    
    if (userResult.rows.length === 0) {
      console.log('User not found');
      return;
    }
    
    const user = userResult.rows[0];
    console.log('User found:', { 
      id: user.id, 
      email: user.email, 
      username: user.username,
      is_verified: user.is_verified
    });
    
    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    console.log('New password hash created');
    
    // Update the user's password
    await pool.query(
      'UPDATE users SET password = $1 WHERE id = $2',
      [hashedPassword, user.id]
    );
    
    console.log('Password updated successfully');
    console.log('New password is:', newPassword);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit();
  }
}

resetPassword(); 