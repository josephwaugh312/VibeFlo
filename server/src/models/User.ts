import pool from '../config/db';

interface User {
  id?: number;
  username: string;
  email: string;
  password_hash: string;
  created_at?: Date;
}

export const createUser = async (user: User) => {
  const { username, email, password_hash } = user;
  const query = 'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING *';
  const values = [username, email, password_hash];
  
  try {
    const result = await pool.query(query, values);
    return result.rows[0];
  } catch (error) {
    throw error;
  }
};

export const getUserByEmail = async (email: string) => {
  const query = 'SELECT * FROM users WHERE email = $1';
  
  try {
    const result = await pool.query(query, [email]);
    return result.rows[0];
  } catch (error) {
    throw error;
  }
};

export const getUserById = async (id: number) => {
  const query = 'SELECT * FROM users WHERE id = $1';
  
  try {
    const result = await pool.query(query, [id]);
    return result.rows[0];
  } catch (error) {
    throw error;
  }
};

export const getUserByUsername = async (username: string) => {
  const query = 'SELECT * FROM users WHERE username = $1';
  
  try {
    const result = await pool.query(query, [username]);
    return result.rows[0];
  } catch (error) {
    throw error;
  }
};

export default {
  createUser,
  getUserByEmail,
  getUserById,
  getUserByUsername
}; 