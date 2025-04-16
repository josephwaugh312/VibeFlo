import { Pool } from 'pg';
import request from 'supertest';
import { app } from '../../app';
import pool from '../../config/db';
import jwt from 'jsonwebtoken';

describe('Theme Integration Tests', () => {
  let testUser: { id: number; email: string };
  let authToken: string;

  beforeAll(async () => {
    // Create a test user
    const result = await pool.query(
      `INSERT INTO users (username, email, password_hash) 
       VALUES ($1, $2, $3) 
       RETURNING id, email`,
      ['testuser', 'test@example.com', 'hashedpassword']
    );
    testUser = result.rows[0];
    
    // Create auth token
    authToken = jwt.sign(
      { id: testUser.id, email: testUser.email },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );
  });

  afterAll(async () => {
    // Clean up test data
    await pool.query('DELETE FROM users WHERE id = $1', [testUser.id]);
    await pool.end();
  });

  describe('GET /api/themes', () => {
    it('should return all available themes', async () => {
      const response = await request(app)
        .get('/api/themes')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      
      // Check theme object structure
      const theme = response.body[0];
      expect(theme).toHaveProperty('id');
      expect(theme).toHaveProperty('name');
      expect(theme).toHaveProperty('image_url');
    });
  });

  describe('POST /api/themes/custom', () => {
    it('should create a new custom theme', async () => {
      const newTheme = {
        name: 'Test Theme',
        description: 'A test theme',
        image_url: 'https://example.com/image.jpg',
        is_public: false
      };

      const response = await request(app)
        .post('/api/themes/custom')
        .set('Authorization', `Bearer ${authToken}`)
        .send(newTheme);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe(newTheme.name);
      expect(response.body.description).toBe(newTheme.description);
      expect(response.body.image_url).toBe(newTheme.image_url);
      
      // Clean up
      await pool.query('DELETE FROM custom_themes WHERE id = $1', [response.body.id]);
    });

    it('should validate required fields', async () => {
      const invalidTheme = {
        description: 'Missing required fields'
      };

      const response = await request(app)
        .post('/api/themes/custom')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidTheme);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('PUT /api/themes/custom/:id', () => {
    let testThemeId: number;

    beforeEach(async () => {
      // Create a theme to update
      const result = await pool.query(
        `INSERT INTO custom_themes (user_id, name, image_url) 
         VALUES ($1, $2, $3) 
         RETURNING id`,
        [testUser.id, 'Theme to Update', 'https://example.com/old.jpg']
      );
      testThemeId = result.rows[0].id;
    });

    afterEach(async () => {
      // Clean up test theme
      await pool.query('DELETE FROM custom_themes WHERE id = $1', [testThemeId]);
    });

    it('should update an existing theme', async () => {
      const updates = {
        name: 'Updated Theme',
        description: 'Updated description',
        image_url: 'https://example.com/new.jpg'
      };

      const response = await request(app)
        .put(`/api/themes/custom/${testThemeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updates);

      expect(response.status).toBe(200);
      expect(response.body.name).toBe(updates.name);
      expect(response.body.description).toBe(updates.description);
      expect(response.body.image_url).toBe(updates.image_url);
    });

    it('should not update themes owned by other users', async () => {
      // Create another user's theme
      const otherResult = await pool.query(
        `INSERT INTO users (username, email, password_hash) 
         VALUES ($1, $2, $3) 
         RETURNING id`,
        ['otheruser', 'other@example.com', 'hashedpassword']
      );
      const otherId = otherResult.rows[0].id;

      const otherThemeResult = await pool.query(
        `INSERT INTO custom_themes (user_id, name, image_url) 
         VALUES ($1, $2, $3) 
         RETURNING id`,
        [otherId, 'Other User Theme', 'https://example.com/other.jpg']
      );
      const otherThemeId = otherThemeResult.rows[0].id;

      const response = await request(app)
        .put(`/api/themes/custom/${otherThemeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Try to update' });

      expect(response.status).toBe(404);
      
      // Clean up
      await pool.query('DELETE FROM custom_themes WHERE id = $1', [otherThemeId]);
      await pool.query('DELETE FROM users WHERE id = $1', [otherId]);
    });
  });

  describe('PUT /api/themes/set', () => {
    it('should set user\'s active theme', async () => {
      const themeId = 1; // Using the first default theme

      const response = await request(app)
        .put('/api/themes/set')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ theme_id: themeId });

      expect(response.status).toBe(200);
      
      // Verify the theme was set
      const settingResult = await pool.query(
        'SELECT theme_id FROM user_settings WHERE user_id = $1',
        [testUser.id]
      );
      expect(settingResult.rows[0].theme_id).toBe(themeId);
    });

    it('should handle invalid theme IDs', async () => {
      const response = await request(app)
        .put('/api/themes/set')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ theme_id: 999999 }); // Non-existent theme ID

      expect(response.status).toBe(404);
    });
  });
}); 