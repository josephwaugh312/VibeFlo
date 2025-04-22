const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const schemaPath = path.resolve(__dirname, './fix-songs-table.sql');
console.log('Reading schema from:', schemaPath);

// Read the schema SQL
const schema = fs.readFileSync(schemaPath, 'utf8');

// Create a new client with the connection string from .env
const client = new Client({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/vibeflo'
});

console.log('Using database connection:', process.env.DATABASE_URL);

async function applyFix() {
  try {
    // Connect to the database
    console.log('Connecting to database...');
    await client.connect();
    
    // Execute the schema SQL
    console.log('Applying fix...');
    await client.query(schema);
    
    console.log('Fix applied successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error applying fix:', error);
    process.exit(1);
  } finally {
    // Close the connection
    await client.end();
  }
}

// Run the function
applyFix(); 