import pool from './src/config/db';

async function updateZenGardenTheme() {
  try {
    // Using a different hosting service for the image
    const result = await pool.query(
      `UPDATE themes 
       SET image_url = 'https://i.imgur.com/BpxT1KY.jpg', 
           description = 'Tranquil Japanese zen garden with raked sand patterns, stone lantern, and bonsai tree' 
       WHERE name = 'Zen Garden'`
    );
    
    console.log('Zen Garden theme updated successfully');
    console.log(`Rows affected: ${result.rowCount}`);
  } catch (err) {
    console.error('Error updating theme:', err);
  } finally {
    // Close pool to end process
    pool.end();
  }
}

updateZenGardenTheme(); 