import { Pool } from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config({ path: '.env.test' });

// First connect to default postgres database
const pool = new Pool({
  connectionString: 'postgres://localhost:5432/postgres'
});

async function setupTestDatabase() {
  const client = await pool.connect();
  
  try {
    // Drop test database if it exists
    await client.query(`
      DROP DATABASE IF EXISTS vibeflo_test WITH (FORCE);
    `);

    // Create test database
    await client.query(`
      CREATE DATABASE vibeflo_test;
    `);

    // Close connection to postgres database
    await client.release();
    await pool.end();

    // Connect to test database
    const testPool = new Pool({
      connectionString: process.env.DATABASE_URL
    });
    const testClient = await testPool.connect();

    try {
      // Define the order of schema files
      const schemaFiles = [
        'schema.sql',          // Base schema with users, settings, etc.
        'theme_schema.sql'     // Theme-related schema
      ];

      // Read and execute schema files in order
      for (const file of schemaFiles) {
        const filePath = path.join(__dirname, '..', 'db', file);
        if (fs.existsSync(filePath)) {
          console.log(`Executing ${file}...`);
          const sql = fs.readFileSync(filePath, 'utf8');
          await testClient.query(sql);
          console.log(`${file} executed successfully`);
        }
      }

      console.log('Test database setup completed successfully');
    } catch (error) {
      console.error('Error executing schema files:', error);
      throw error;
    } finally {
      await testClient.release();
      await testPool.end();
    }
  } catch (error) {
    console.error('Error setting up test database:', error);
    throw error;
  }
}

setupTestDatabase()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Setup failed:', error);
    process.exit(1);
  }); 