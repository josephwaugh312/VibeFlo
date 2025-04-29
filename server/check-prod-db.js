// Script to check users in the production database
const postgres = require('postgres');

// Render production PostgreSQL connection string
const connectionString = 'postgresql://vibeflo_user:dwLiDcETMwGVIC7uQH2shnYNuculcrBr@dpg-d023atbe5dus73bcuhmg-a.oregon-postgres.render.com/vibeflo';

// Create SQL client
const sql = postgres(connectionString, {
  ssl: { rejectUnauthorized: false }
});

async function checkUsers() {
  try {
    console.log('Connecting to production database...');
    
    // Query all users
    const allUsers = await sql`SELECT id, username, email, is_verified FROM users`;
    console.log('\nAll users in database:');
    console.table(allUsers);
    
    // Search for specific user by email pattern
    const josephUsers = await sql`SELECT id, username, email, is_verified FROM users WHERE email LIKE ${'%joseph%'}`;
    console.log('\nUsers with "joseph" in email:');
    console.table(josephUsers);
    
    // Count total users
    const [countResult] = await sql`SELECT COUNT(*) FROM users`;
    console.log(`\nTotal users in database: ${countResult.count}`);
    
  } catch (error) {
    console.error('Database error:', error);
  } finally {
    // Close connection
    await sql.end();
    console.log('Database connection closed');
  }
}

// Run the check
checkUsers();
