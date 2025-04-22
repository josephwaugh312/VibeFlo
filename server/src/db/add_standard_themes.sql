-- Add standard themes
INSERT INTO themes (
  id, 
  name, 
  description, 
  background_url, 
  is_default, 
  is_public, 
  status
) VALUES
  (
    'f47ac10b-58cc-4372-a567-0e02b2c3d479', 
    'Nature', 
    'A calming nature background with lush greens', 
    'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05',
    false, 
    true, 
    'approved'
  ),
  (
    'af672c59-aed1-4b40-a967-42d6f8d2272a', 
    'Ocean', 
    'Peaceful ocean waves', 
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e',
    false, 
    true, 
    'approved'
  ),
  (
    'b9a4b262-64e8-4dbf-bf30-96d4d7543939', 
    'Mountains', 
    'Majestic mountain views', 
    'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b',
    false, 
    true, 
    'approved'
  ),
  (
    'c1f6cff5-5e18-4b85-838f-017201b6c220', 
    'Stars', 
    'Night sky with brilliant stars', 
    'https://images.unsplash.com/photo-1475274047050-1d0c0975c63e',
    false, 
    true, 
    'approved'
  ),
  (
    'd8a7c463-e2a0-4b15-9c1b-cb1d4e59d933', 
    'Abstract', 
    'Colorful abstract patterns', 
    'https://images.unsplash.com/photo-1550859492-d5da9d8e45f3',
    false, 
    true, 
    'approved'
  ),
  (
    'e4b0c7d2-267a-4c46-860a-e6c48cc0d4e0', 
    'Minimalist', 
    'Simple, clean, and uncluttered', 
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe',
    false, 
    true, 
    'approved'
  ),
  (
    'fd8b7d61-fec0-48e6-a2da-52a1b5c9887c', 
    'Cityscape', 
    'Urban city views', 
    'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df',
    false, 
    true, 
    'approved'
  ),
  (
    'a3e0f1d8-5c22-4b23-9c5a-b1d1c1a9b7a2', 
    'Forest', 
    'Dense forest with sunlight breaking through', 
    'https://images.unsplash.com/photo-1448375240586-882707db888b',
    false, 
    true, 
    'approved'
  ); 