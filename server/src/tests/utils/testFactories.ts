/**
 * Test factory functions to create consistent test data across test files
 */

// User type
interface TestUser {
  id: number;
  name: string;
  username: string;
  email: string;
  bio?: string;
  avatar_url?: string;
  is_verified?: boolean;
  failed_login_attempts?: number;
  is_locked?: boolean;
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
}

// Playlist type
interface TestPlaylist {
  id: number;
  name: string;
  description?: string;
  user_id: number;
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
}

// Song type
interface TestSong {
  id: number;
  title: string;
  artist: string;
  album?: string;
  duration: number;
  image_url?: string;
  url?: string;
  youtube_id?: string;
  source?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
}

// Theme type
interface TestTheme {
  id: number;
  name: string;
  user_id: number;
  colors: string;
  is_public?: boolean;
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
}

// Pomodoro session type
interface TestPomodoroSession {
  id: number;
  user_id: number;
  duration: number;
  task?: string;
  completed: boolean;
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
}

// Database response object
interface DbResponse {
  rows: any[];
  rowCount: number;
}

// Database responses object
interface DbResponses {
  [key: string]: DbResponse | Function;
}

/**
 * Create a test user object with optional overrides
 */
export const createTestUser = (overrides = {}): TestUser => {
  return {
    id: 1,
    name: 'Test User',
    username: 'testuser',
    email: 'test@example.com',
    bio: 'Test bio',
    avatar_url: 'https://example.com/avatar.jpg',
    is_verified: true,
    failed_login_attempts: 0,
    is_locked: false,
    created_at: '2023-01-01T00:00:00.000Z',
    updated_at: '2023-01-01T00:00:00.000Z',
    ...overrides
  };
};

/**
 * Create a test playlist object with optional overrides
 */
export const createTestPlaylist = (overrides = {}): TestPlaylist => {
  return {
    id: 1,
    name: 'Test Playlist',
    description: 'A test playlist',
    user_id: 1,
    created_at: '2023-01-01T00:00:00.000Z',
    updated_at: '2023-01-01T00:00:00.000Z',
    ...overrides
  };
};

/**
 * Create a test song object with optional overrides
 */
export const createTestSong = (overrides = {}): TestSong => {
  return {
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
    updated_at: '2023-01-01T00:00:00.000Z',
    ...overrides
  };
};

/**
 * Create a test theme object with optional overrides
 */
export const createTestTheme = (overrides = {}): TestTheme => {
  return {
    id: 1,
    name: 'Test Theme',
    user_id: 1,
    colors: JSON.stringify({
      primary: '#3498db',
      secondary: '#2ecc71',
      background: '#f5f5f5',
      text: '#333333'
    }),
    is_public: true,
    created_at: '2023-01-01T00:00:00.000Z',
    updated_at: '2023-01-01T00:00:00.000Z',
    ...overrides
  };
};

/**
 * Create a test pomodoro session with optional overrides
 */
export const createTestPomodoroSession = (overrides = {}): TestPomodoroSession => {
  return {
    id: 1,
    user_id: 1,
    duration: 25,
    task: 'Test Task',
    completed: true,
    created_at: '2023-01-01T00:00:00.000Z',
    updated_at: '2023-01-01T00:00:00.000Z',
    ...overrides
  };
};

/**
 * Create a test database mock function with predefined responses
 */
export const createDbMock = (responses: DbResponses) => {
  return (pool: { query: jest.Mock }) => {
    // Reset the mock
    (pool.query).mockReset();
    
    // Create a query handler that returns appropriate responses based on the query
    (pool.query).mockImplementation((query: string, params: any[]) => {
      // Return for BEGIN/COMMIT/ROLLBACK queries in transactions
      if (query === 'BEGIN' || query === 'COMMIT' || query === 'ROLLBACK') {
        return Promise.resolve({ rows: [], rowCount: 0 });
      }
      
      // Check for specific query handlers
      for (const key in responses) {
        if (query.includes(key)) {
          // If the response is a function, call it with query and params
          if (typeof responses[key] === 'function') {
            return Promise.resolve((responses[key] as Function)(query, params));
          }
          
          // Otherwise return the fixed response
          return Promise.resolve(responses[key]);
        }
      }
      
      // Default empty response
      return Promise.resolve({ rows: [], rowCount: 0 });
    });
  };
};

/**
 * Standard database responses for common queries
 */
export const standardDbResponses = {
  user: {
    findById: (id = 1): DbResponse => ({
      rows: [createTestUser({ id })],
      rowCount: 1
    }),
    notFound: {
      rows: [],
      rowCount: 0
    },
    invalidCredentials: {
      rows: [],
      rowCount: 0
    }
  },
  playlist: {
    findAll: (userId = 1, count = 2): DbResponse => ({
      rows: Array(count).fill(0).map((_, i) => createTestPlaylist({ id: i + 1, name: `Playlist ${i + 1}`, user_id: userId })),
      rowCount: count
    }),
    findById: (id = 1): DbResponse => ({
      rows: [createTestPlaylist({ id })],
      rowCount: 1
    }),
    notFound: {
      rows: [],
      rowCount: 0
    }
  },
  song: {
    findByPlaylistId: (playlistId = 1, count = 3): DbResponse => ({
      rows: Array(count).fill(0).map((_, i) => createTestSong({ id: i + 1, title: `Song ${i + 1}` })),
      rowCount: count
    })
  }
}; 