import pool from './src/config/db';

async function removeZenGardenTheme() {
  try {
    // Delete the Zen Garden theme
    const result = await pool.query(
      `DELETE FROM themes WHERE name = 'Zen Garden'`
    );
    
    console.log('Zen Garden theme removed successfully');
    console.log(`Rows affected: ${result.rowCount}`);
    
    // Update any users who had this theme selected to use the default theme
    const updateResult = await pool.query(
      `UPDATE user_settings 
       SET theme_id = (SELECT id FROM themes WHERE is_default = true LIMIT 1)
       WHERE theme_id = 10`
    );
    
    console.log('User settings updated successfully');
    console.log(`User settings updated: ${updateResult.rowCount}`);
  } catch (err) {
    console.error('Error removing theme:', err);
  } finally {
    // Close pool to end process
    pool.end();
  }
}

removeZenGardenTheme(); 