import pool from '../config/db';

/**
 * Execute a SQL query on the database
 * @param text The SQL query text
 * @param params The parameters for the query
 * @returns The query result
 */
export const query = async (text: string, params?: any[]) => {
  try {
    const result = await pool.query(text, params);
    return result;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

/**
 * Execute a transaction with multiple queries
 * @param callback Function that executes queries within a transaction
 * @returns The result of the callback function
 */
export const transaction = async <T>(callback: (client: any) => Promise<T>): Promise<T> => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Transaction error:', error);
    throw error;
  } finally {
    client.release();
  }
};

export default {
  query,
  transaction
}; 