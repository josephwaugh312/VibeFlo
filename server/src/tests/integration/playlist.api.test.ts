import request from 'supertest';
import pool from '../../config/db';
import { app } from '../../app';
import { generateTestToken, setupDbMock } from '../setupApiTests';

describe('Playlist API Endpoints', () => {
  // Mock data
  const testPlaylist = {
    id: 1,
    name: 'Test Playlist',
    description: 'A test playlist',
    user_id: 1,
    created_at: '2023-01-01T00:00:00.000Z',
    updated_at: '2023-01-01T00:00:00.000Z'
  };
  
  const testSong = {
    id: 1,
    title: 'Test Song',
    artist: 'Test Artist',
    album: 'Test Album',
    duration: 180,
    image_url: 'https://example.com/image.jpg',
    url: 'https://example.com/song.mp3',
    youtube_id: 'abcd1234',
    source: 'youtube',
    created_at: '2023-01-01T00:00:00.000Z',
    updated_at: '2023-01-01T00:00:00.000Z'
  };

  beforeEach(() => {
    // Reset query mock to avoid interference between tests
    (pool.query as jest.Mock).mockReset();
  });

  describe('GET /api/playlists', () => {
    it('should return all playlists for the authenticated user', async () => {
      // Set up database mock response
      setupDbMock(pool, [
        {
          rows: [testPlaylist, {...testPlaylist, id: 2, name: 'Another Playlist'}],
          rowCount: 2
        }
      ]);
      
      const token = generateTestToken();
      
      // Test request
      const response = await request(app)
        .get('/api/playlists')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      
      // Verify response
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2);
      expect(response.body[0]).toEqual(testPlaylist);
      
      // Verify database query
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM playlists WHERE user_id'),
        [1]
      );
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .get('/api/playlists')
        .expect(401);
      
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('GET /api/playlists/:id', () => {
    it('should return a specific playlist with its tracks', async () => {
      // Set up database mock responses
      setupDbMock(pool, [
        // Playlist query response
        {
          rows: [testPlaylist],
          rowCount: 1
        },
        // Songs query response
        {
          rows: [testSong, {...testSong, id: 2, title: 'Another Song'}],
          rowCount: 2
        }
      ]);
      
      const token = generateTestToken();
      
      // Test request
      const response = await request(app)
        .get(`/api/playlists/${testPlaylist.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      
      // Verify response
      expect(response.body).toHaveProperty('id', testPlaylist.id);
      expect(response.body).toHaveProperty('name', testPlaylist.name);
      expect(response.body).toHaveProperty('tracks');
      expect(Array.isArray(response.body.tracks)).toBe(true);
      expect(response.body.tracks.length).toBe(2);
    });

    it('should return 404 when playlist does not exist', async () => {
      // Set up database mock response for empty playlist query
      setupDbMock(pool, [
        {
          rows: [],
          rowCount: 0
        }
      ]);
      
      const token = generateTestToken();
      
      const response = await request(app)
        .get('/api/playlists/999')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
      
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('not found');
    });
  });

  describe('POST /api/playlists', () => {
    it('should create a new playlist without tracks', async () => {
      // Set up database mock for transaction client
      const mockClient = {
        query: jest.fn(),
        release: jest.fn()
      };
      
      mockClient.query.mockImplementation((query, params) => {
        if (query === 'BEGIN' || query === 'COMMIT') {
          return Promise.resolve();
        }
        if (query.includes('INSERT INTO playlists')) {
          return Promise.resolve({
            rows: [testPlaylist],
            rowCount: 1
          });
        }
        return Promise.resolve({ rows: [], rowCount: 0 });
      });
      
      (pool.connect as jest.Mock).mockResolvedValueOnce(mockClient);
      
      const token = generateTestToken();
      const newPlaylistData = {
        name: 'Test Playlist',
        description: 'A test playlist'
      };
      
      // Test request
      const response = await request(app)
        .post('/api/playlists')
        .set('Authorization', `Bearer ${token}`)
        .send(newPlaylistData)
        .expect(201);
      
      // Verify response
      expect(response.body).toHaveProperty('id', testPlaylist.id);
      expect(response.body).toHaveProperty('name', testPlaylist.name);
      
      // Verify transaction was committed
      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should create a new playlist with tracks', async () => {
      // Set up database mock for transaction client
      const mockClient = {
        query: jest.fn(),
        release: jest.fn()
      };
      
      mockClient.query.mockImplementation((query, params) => {
        if (query === 'BEGIN' || query === 'COMMIT') {
          return Promise.resolve();
        }
        if (query.includes('INSERT INTO playlists')) {
          return Promise.resolve({
            rows: [testPlaylist],
            rowCount: 1
          });
        }
        if (query.includes('INSERT INTO songs')) {
          return Promise.resolve({
            rows: [testSong],
            rowCount: 1
          });
        }
        if (query.includes('SELECT s.* FROM songs')) {
          return Promise.resolve({
            rows: [testSong],
            rowCount: 1
          });
        }
        return Promise.resolve({ rows: [], rowCount: 0 });
      });
      
      (pool.connect as jest.Mock).mockResolvedValueOnce(mockClient);
      
      const token = generateTestToken();
      const newPlaylistData = {
        name: 'Test Playlist',
        description: 'A test playlist',
        tracks: [{
          title: 'Test Song',
          artist: 'Test Artist',
          album: 'Test Album',
          duration: 180,
          artwork: 'https://example.com/image.jpg',
          url: 'https://example.com/song.mp3',
          youtube_id: 'abcd1234',
          source: 'youtube'
        }]
      };
      
      // Test request
      const response = await request(app)
        .post('/api/playlists')
        .set('Authorization', `Bearer ${token}`)
        .send(newPlaylistData)
        .expect(201);
      
      // Verify response
      expect(response.body).toHaveProperty('id', testPlaylist.id);
      expect(response.body).toHaveProperty('name', testPlaylist.name);
      expect(response.body).toHaveProperty('tracks');
      
      // Verify transaction was committed
      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO songs'),
        expect.arrayContaining(['Test Song', 'Test Artist'])
      );
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should return 400 when name is missing', async () => {
      const token = generateTestToken();
      
      const response = await request(app)
        .post('/api/playlists')
        .set('Authorization', `Bearer ${token}`)
        .send({ description: 'A test playlist without name' })
        .expect(400);
      
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('name is required');
    });
  });

  describe('PUT /api/playlists/:id', () => {
    it('should update an existing playlist', async () => {
      // Set up database mock responses
      setupDbMock(pool, [
        // Playlist check
        {
          rows: [testPlaylist],
          rowCount: 1
        },
        // Update result
        {
          rows: [{...testPlaylist, name: 'Updated Playlist'}],
          rowCount: 1
        }
      ]);
      
      const token = generateTestToken();
      const updateData = {
        name: 'Updated Playlist',
        description: 'Updated description'
      };
      
      // Test request
      const response = await request(app)
        .put(`/api/playlists/${testPlaylist.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updateData)
        .expect(200);
      
      // Verify response
      expect(response.body).toHaveProperty('name', 'Updated Playlist');
      
      // Verify database queries
      expect(pool.query).toHaveBeenCalledTimes(2);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE playlists'),
        expect.arrayContaining(['Updated Playlist', 'Updated description', testPlaylist.id, 1])
      );
    });

    it('should return 404 when playlist does not exist', async () => {
      // Set up database mock response for empty playlist check
      setupDbMock(pool, [
        {
          rows: [],
          rowCount: 0
        }
      ]);
      
      const token = generateTestToken();
      
      const response = await request(app)
        .put('/api/playlists/999')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Updated Playlist' })
        .expect(404);
      
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('not found');
    });
  });

  describe('DELETE /api/playlists/:id', () => {
    it('should delete a playlist and its associations', async () => {
      // Set up database mock responses
      setupDbMock(pool, [
        // Playlist check
        {
          rows: [testPlaylist],
          rowCount: 1
        },
        // Delete operations (2 more queries)
        { rowCount: 1 },
        { rowCount: 1 }
      ]);
      
      const token = generateTestToken();
      
      // Test request
      const response = await request(app)
        .delete(`/api/playlists/${testPlaylist.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      
      // Verify response
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('deleted successfully');
      
      // Verify database queries
      expect(pool.query).toHaveBeenCalledTimes(3);
    });

    it('should return 404 when playlist does not exist', async () => {
      // Set up database mock response for empty playlist check
      setupDbMock(pool, [
        {
          rows: [],
          rowCount: 0
        }
      ]);
      
      const token = generateTestToken();
      
      const response = await request(app)
        .delete('/api/playlists/999')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
      
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('not found');
    });
  });

  describe('GET /api/playlists/:playlistId/songs', () => {
    it('should return all songs in a playlist', async () => {
      // Set up database mock responses
      setupDbMock(pool, [
        // Playlist check
        {
          rows: [testPlaylist],
          rowCount: 1
        },
        // Songs query
        {
          rows: [testSong, {...testSong, id: 2, title: 'Another Song'}],
          rowCount: 2
        }
      ]);
      
      const token = generateTestToken();
      
      // Test request
      const response = await request(app)
        .get(`/api/playlists/${testPlaylist.id}/songs`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      
      // Verify response
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2);
      expect(response.body[0]).toEqual(testSong);
      
      // Verify database queries
      expect(pool.query).toHaveBeenCalledTimes(2);
    });
  });

  describe('POST /api/playlists/:playlistId/songs', () => {
    it('should add a song to a playlist', async () => {
      // Set up database mock responses
      setupDbMock(pool, [
        // Playlist check
        {
          rows: [testPlaylist],
          rowCount: 1
        },
        // Song creation
        {
          rows: [testSong],
          rowCount: 1
        },
        // Position query
        {
          rows: [{ max: 1 }],
          rowCount: 1
        },
        // Playlist_songs insertion
        {
          rows: [{ playlist_id: 1, song_id: 1, position: 2 }],
          rowCount: 1
        }
      ]);
      
      const token = generateTestToken();
      const songData = {
        title: 'Test Song',
        artist: 'Test Artist',
        album: 'Test Album',
        duration: 180,
        image_url: 'https://example.com/image.jpg',
        url: 'https://example.com/song.mp3',
        youtube_id: 'abcd1234',
        source: 'youtube'
      };
      
      // Test request
      const response = await request(app)
        .post(`/api/playlists/${testPlaylist.id}/songs`)
        .set('Authorization', `Bearer ${token}`)
        .send(songData)
        .expect(201);
      
      // Verify response
      expect(response.body).toHaveProperty('id', testSong.id);
      expect(response.body).toHaveProperty('title', testSong.title);
      
      // Verify database queries
      expect(pool.query).toHaveBeenCalledTimes(4);
    });
  });

  describe('DELETE /api/playlists/:playlistId/songs/:songId', () => {
    it('should remove a song from a playlist', async () => {
      // Set up database mock responses
      setupDbMock(pool, [
        // Playlist check
        {
          rows: [testPlaylist],
          rowCount: 1
        },
        // Playlist_song check
        {
          rows: [{ playlist_id: 1, song_id: 1, position: 1 }],
          rowCount: 1
        },
        // Playlist_songs deletion
        {
          rowCount: 1
        },
        // Reordering
        { rows: [], rowCount: 0 }
      ]);
      
      const token = generateTestToken();
      
      // Test request
      const response = await request(app)
        .delete(`/api/playlists/${testPlaylist.id}/songs/${testSong.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      
      // Verify response
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('removed successfully');
      
      // Verify database queries
      expect(pool.query).toHaveBeenCalledTimes(4);
    });

    it('should return 404 when song is not in playlist', async () => {
      // Set up database mock responses
      setupDbMock(pool, [
        // Playlist check
        {
          rows: [testPlaylist],
          rowCount: 1
        },
        // Empty playlist_song check
        {
          rows: [],
          rowCount: 0
        }
      ]);
      
      const token = generateTestToken();
      
      const response = await request(app)
        .delete(`/api/playlists/${testPlaylist.id}/songs/999`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
      
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('not found');
    });
  });
}); 