import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';

// Create a connection pool with proper SSL configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isProduction ? {
    rejectUnauthorized: false // Required for Render PostgreSQL
  } : false
});

async function cleanupInvalidThemes() {
  let client;
  
  try {
    console.log('Starting invalid themes cleanup script...');
    console.log('Environment mode:', isProduction ? 'Production' : 'Development');
    const databaseUrl = process.env.DATABASE_URL;
    console.log('Attempting to connect to database with URL:', databaseUrl ? 
      `${databaseUrl.split('@')[0].split(':').slice(0, -1).join(':')}:***@${databaseUrl.split('@')[1]}` : 
      'DATABASE_URL not set');
    console.log('SSL enabled for database connection:', isProduction ? 'yes' : 'no');
    
    client = await pool.connect();
    console.log('Successfully connected to database!');
    
    // Start transaction
    await client.query('BEGIN');
    
    // Log theme information first
    const countBefore = await client.query('SELECT COUNT(*) FROM themes');
    console.log(`Total themes before cleanup: ${countBefore.rows[0].count}`);
    
    // Count custom themes (non-standard)
    const customCountBefore = await client.query('SELECT COUNT(*) FROM themes WHERE is_standard = FALSE OR is_standard IS NULL');
    console.log(`Custom themes before cleanup: ${customCountBefore.rows[0].count}`);
    
    // Find themes with missing or invalid images
    console.log('Checking for invalid themes...');
    
    // Get all themes with issues (missing image_url or invalid background data)
    const invalidThemes = await client.query(`
      SELECT id, name, created_by, image_url 
      FROM themes 
      WHERE (
        is_standard = FALSE OR is_standard IS NULL
      ) AND (
        image_url IS NULL 
        OR image_url = '' 
        OR (background_url IS NULL AND background_color IS NULL AND gradient_colors IS NULL)
      )
    `);
    
    console.log(`Found ${invalidThemes.rows.length} invalid themes to remove`);
    
    if (invalidThemes.rows.length > 0) {
      // Log specific themes being removed
      invalidThemes.rows.forEach((theme) => {
        console.log(`Removing invalid theme: ID=${theme.id}, Name=${theme.name}, CreatedBy=${theme.created_by}`);
      });
      
      // Create array of theme IDs to remove
      const themeIds = invalidThemes.rows.map(theme => theme.id);
      
      // Remove the invalid themes
      await client.query(`
        DELETE FROM themes 
        WHERE id = ANY($1::uuid[])
      `, [themeIds]);
      
      console.log(`Removed ${themeIds.length} invalid themes`);
    } else {
      console.log('No invalid themes found');
    }
    
    // Log counts after cleanup
    const countAfter = await client.query('SELECT COUNT(*) FROM themes');
    console.log(`Total themes after cleanup: ${countAfter.rows[0].count}`);
    
    const customCountAfter = await client.query('SELECT COUNT(*) FROM themes WHERE is_standard = FALSE OR is_standard IS NULL');
    console.log(`Custom themes after cleanup: ${customCountAfter.rows[0].count}`);
    
    // Commit transaction
    await client.query('COMMIT');
    console.log('Theme cleanup completed successfully');
    
  } catch (error) {
    // Rollback in case of error
    if (client) {
      await client.query('ROLLBACK');
    }
    console.error('Error cleaning up invalid themes:', error);
  } finally {
    if (client) {
      client.release();
      console.log('Released database client back to pool');
    }
    process.exit(0);
  }
}

// Run the function
cleanupInvalidThemes(); 