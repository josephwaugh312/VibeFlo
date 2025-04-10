-- Add themes tables and update user_settings table

-- Add theme_id column to user_settings if it doesn't exist
ALTER TABLE user_settings 
ADD COLUMN IF NOT EXISTS theme_id INTEGER;

-- Create themes table
CREATE TABLE IF NOT EXISTS themes (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  is_premium BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create custom_themes table for user-generated themes
CREATE TABLE IF NOT EXISTS custom_themes (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  is_public BOOLEAN DEFAULT FALSE,
  prompt TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_themes_is_default ON themes(is_default);
CREATE INDEX IF NOT EXISTS idx_custom_themes_user_id ON custom_themes(user_id);
CREATE INDEX IF NOT EXISTS idx_custom_themes_is_public ON custom_themes(is_public);

-- Insert default themes
INSERT INTO themes (name, description, image_url, is_default, is_premium) VALUES
('Forest', 'Peaceful forest scene with soft sunlight filtering through the trees', 'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8Zm9yZXN0JTIwYmFja2dyb3VuZHxlbnwwfHwwfHx8MA%3D%3D&w=1000&q=80', TRUE, FALSE),
('Ocean', 'Calming blue ocean waves with a clear horizon', 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8b2NlYW58ZW58MHx8MHx8fDA%3D&w=1000&q=80', FALSE, FALSE),
('Mountains', 'Majestic mountain landscape with snow-capped peaks', 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTB8fG1vdW50YWlufGVufDB8fDB8fHww&w=1000&q=80', FALSE, FALSE),
('Minimalist', 'Clean, minimalist background with subtle geometric patterns', 'https://images.unsplash.com/photo-1557683316-973673baf926?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8Z3JhZGllbnQlMjBiYWNrZ3JvdW5kfGVufDB8fDB8fHww&w=1000&q=80', FALSE, FALSE),
('Cafe', 'Cozy coffee shop ambiance with warm lighting', 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8Y2FmZXxlbnwwfHwwfHx8MA%3D%3D&w=1000&q=80', FALSE, FALSE),
('Library', 'Quiet library with books and soft natural light', 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8bGlicmFyeXxlbnwwfHwwfHx8MA%3D%3D&w=1000&q=80', FALSE, FALSE),
('Night Sky', 'Starry night sky with a sense of vastness and wonder', 'https://images.unsplash.com/photo-1475274047050-1d0c0975c63e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8bmlnaHQlMjBza3l8ZW58MHx8MHx8fDA%3D&w=1000&q=80', FALSE, FALSE),
('Rainy Day', 'Raindrops on window with a blurred cityscape background', 'https://images.unsplash.com/photo-1501691223387-dd0500403074?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8cmFpbnklMjBkYXl8ZW58MHx8MHx8fDA%3D&w=1000&q=80', FALSE, FALSE),
('Sunrise', 'Inspiring sunrise with golden hues illuminating the landscape', 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8c3VucmlzZXxlbnwwfHwwfHx8MA%3D%3D&w=1000&q=80', FALSE, TRUE)
ON CONFLICT (id) DO NOTHING; 