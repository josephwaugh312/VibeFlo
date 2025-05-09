import React, { createContext, useContext } from 'react';

// Mock AuthContext
interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  bio?: string;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: any) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => void;
  checkAuthStatus: () => Promise<boolean>;
  setUser: (user: User | null) => void;
  passwordResetToken: string | null;
  sendPasswordResetEmail: (email: string) => Promise<void>;
  resetPassword: (password: string, confirmPassword: string, token: string) => Promise<void>;
}

export const MockAuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  login: async () => {},
  register: async () => {},
  logout: () => {},
  checkAuthStatus: async () => false,
  setUser: () => {},
  passwordResetToken: null,
  sendPasswordResetEmail: async () => {},
  resetPassword: async () => {},
});

export const useMockAuth = () => useContext(MockAuthContext);

// Mock StatsContext
interface PomodoroSession {
  id: number;
  duration: number;
  task: string;
  completed: boolean;
  created_at: string;
  potentiallyUnsaved?: boolean;
}

interface PomodoroStats {
  totalSessions: number;
  completedSessions: number;
  totalFocusTime: number;
  lastWeekActivity: Record<string, { count: number; totalMinutes: number }>;
  last30DaysActivity?: Record<string, { count: number; totalMinutes: number }>;
  allTimeActivity?: Record<string, { count: number; totalMinutes: number }>;
  averageSessionDuration?: number;
  mostProductiveDay?: { day: string; minutes: number } | null;
  averageDailySessions?: string;
  completionTrend?: { currentWeek: number; previousWeek: number; percentChange: number };
  currentStreak?: number;
  activityHeatmap?: Array<{ date: string; count: number; minutes: number }>;
}

interface StatsContextType {
  stats: PomodoroStats | null;
  sessions: PomodoroSession[];
  loading: boolean;
  error: string | null;
  refreshStats: () => Promise<void>;
  addSession: (session: Omit<PomodoroSession, 'id' | 'created_at'>) => Promise<void>;
}

export const MockStatsContext = createContext<StatsContextType>({
  stats: null,
  sessions: [],
  loading: false,
  error: null,
  refreshStats: async () => {},
  addSession: async () => {},
});

export const useMockStats = () => useContext(MockStatsContext);

// Mock MusicPlayerContext
interface Track {
  id: string;
  title: string;
  artist: string;
  url: string;
  artwork: string;
  duration?: number;
  source?: string;
}

interface MusicPlayerContextType {
  currentTrack: Track | null;
  isPlaying: boolean;
  volume: number;
  position: number;
  duration: number;
  playlist: Track[];
  isOpen: boolean;
  searchResults: Track[];
  isSaving: boolean;
  addTrack: (track: Track) => void;
  removeTrack: (id: string) => void;
  loadPlaylist: (tracks: Track[]) => void;
  play: (track?: Track) => void;
  pause: () => void;
  togglePlay: () => void;
  next: () => void;
  previous: () => void;
  setVolume: (volume: number) => void;
  toggleOpen: (forceOpen?: boolean) => void;
  handleSearch: (query: string) => Promise<void>;
  savePlaylistToAccount: (name: string, description?: string) => Promise<any>;
}

export const MockMusicPlayerContext = createContext<MusicPlayerContextType>({
  currentTrack: null,
  isPlaying: false,
  volume: 50,
  position: 0,
  duration: 0,
  playlist: [],
  isOpen: false,
  searchResults: [],
  isSaving: false,
  addTrack: () => {},
  removeTrack: () => {},
  loadPlaylist: () => {},
  play: () => {},
  pause: () => {},
  togglePlay: () => {},
  next: () => {},
  previous: () => {},
  setVolume: () => {},
  toggleOpen: () => {},
  handleSearch: async () => {},
  savePlaylistToAccount: async () => ({}),
});

export const useMockMusicPlayer = () => useContext(MockMusicPlayerContext);

// Provider wrappers for tests
export const MockAuthProvider: React.FC<{
  children: React.ReactNode;
  value?: Partial<AuthContextType>;
  isAuthenticated?: boolean;
}> = ({ children, value = {}, isAuthenticated = true }) => {
  const defaultValue: AuthContextType = {
    user: {
      id: '1',
      username: 'testuser',
      name: 'Test User',
      email: 'test@example.com',
      bio: 'This is a test bio',
      created_at: '2023-01-01T00:00:00.000Z',
    },
    isAuthenticated: isAuthenticated,
    isLoading: false,
    login: jest.fn().mockResolvedValue(undefined),
    register: jest.fn().mockResolvedValue(undefined),
    logout: jest.fn(),
    checkAuthStatus: jest.fn().mockResolvedValue(isAuthenticated),
    setUser: jest.fn(),
    passwordResetToken: null,
    sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
    resetPassword: jest.fn().mockResolvedValue(undefined),
  };

  return (
    <MockAuthContext.Provider value={{ ...defaultValue, ...value }}>
      {children}
    </MockAuthContext.Provider>
  );
};

export const MockStatsProvider: React.FC<{
  children: React.ReactNode;
  value?: Partial<StatsContextType>;
}> = ({ children, value = {} }) => {
  const defaultValue: StatsContextType = {
    stats: {
      totalSessions: 10,
      completedSessions: 8,
      totalFocusTime: 250,
      lastWeekActivity: {
        Monday: { count: 2, totalMinutes: 50 },
        Wednesday: { count: 3, totalMinutes: 75 },
        Friday: { count: 1, totalMinutes: 25 },
      },
    },
    sessions: [
      {
        id: 1,
        duration: 25,
        task: 'Task 1',
        completed: true,
        created_at: '2023-07-01T10:00:00.000Z',
      },
      {
        id: 2,
        duration: 15,
        task: 'Task 2',
        completed: false,
        created_at: '2023-07-02T11:00:00.000Z',
        potentiallyUnsaved: true,
      },
      {
        id: 3,
        duration: 30,
        task: 'Task 3',
        completed: true,
        created_at: '2023-07-03T12:00:00.000Z',
      },
    ],
    loading: false,
    error: null,
    refreshStats: jest.fn().mockResolvedValue(undefined),
    addSession: jest.fn().mockResolvedValue(undefined),
  };

  return (
    <MockStatsContext.Provider value={{ ...defaultValue, ...value }}>
      {children}
    </MockStatsContext.Provider>
  );
};

export const MockMusicPlayerProvider: React.FC<{
  children: React.ReactNode;
  value?: Partial<MusicPlayerContextType>;
}> = ({ children, value = {} }) => {
  const defaultValue: MusicPlayerContextType = {
    currentTrack: null,
    isPlaying: false,
    volume: 50,
    position: 0,
    duration: 0,
    playlist: [],
    isOpen: false,
    searchResults: [],
    isSaving: false,
    addTrack: jest.fn(),
    removeTrack: jest.fn(),
    loadPlaylist: jest.fn(),
    play: jest.fn(),
    pause: jest.fn(),
    togglePlay: jest.fn(),
    next: jest.fn(),
    previous: jest.fn(),
    setVolume: jest.fn(),
    toggleOpen: jest.fn(),
    handleSearch: jest.fn().mockResolvedValue(undefined),
    savePlaylistToAccount: jest.fn().mockResolvedValue({}),
  };

  return (
    <MockMusicPlayerContext.Provider value={{ ...defaultValue, ...value }}>
      {children}
    </MockMusicPlayerContext.Provider>
  );
};

// Simple test to make Jest happy
describe('Mock Contexts', () => {
  it('should pass a dummy test', () => {
    expect(true).toBe(true);
  });
}); 