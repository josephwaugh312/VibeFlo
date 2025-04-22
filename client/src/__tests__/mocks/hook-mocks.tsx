import { PomodoroSession, PomodoroStats } from '../../contexts/StatsContext';

// Mock user data
export const mockUser = {
  id: '1',
  username: 'testuser',
  name: 'Test User',
  email: 'test@example.com',
  bio: 'This is a test bio for the dashboard',
  created_at: '2023-01-01T00:00:00.000Z',
};

// Mock session data
export const mockSessions: PomodoroSession[] = [
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
];

// Mock stats data
export const mockStats: PomodoroStats = {
  totalSessions: 10,
  completedSessions: 8,
  totalFocusTime: 250,
  lastWeekActivity: {
    'Monday': { count: 2, totalMinutes: 50 },
    'Wednesday': { count: 3, totalMinutes: 75 },
    'Friday': { count: 1, totalMinutes: 25 },
  },
  last30DaysActivity: {
    'Monday': { count: 4, totalMinutes: 100 },
    'Wednesday': { count: 6, totalMinutes: 150 },
    'Friday': { count: 2, totalMinutes: 50 },
  },
  allTimeActivity: {
    'Monday': { count: 10, totalMinutes: 250 },
    'Wednesday': { count: 15, totalMinutes: 375 },
    'Friday': { count: 5, totalMinutes: 125 },
  },
  averageSessionDuration: 25,
  mostProductiveDay: {
    day: 'Wednesday',
    minutes: 375,
  },
  averageDailySessions: '2.5',
  completionTrend: {
    currentWeek: 5,
    previousWeek: 3,
    percentChange: 66.67,
  },
  currentStreak: 3,
  activityHeatmap: [
    { date: '2023-07-01', count: 2, minutes: 50 },
    { date: '2023-07-02', count: 0, minutes: 0 },
    { date: '2023-07-03', count: 3, minutes: 75 },
  ],
};

// Mock the useAuth hook
export const mockUseAuth = {
  user: mockUser,
  isAuthenticated: true,
  isLoading: false,
  login: jest.fn().mockResolvedValue(undefined),
  register: jest.fn().mockResolvedValue(undefined),
  logout: jest.fn(),
  checkAuthStatus: jest.fn().mockResolvedValue(true),
  setUser: jest.fn(),
  passwordResetToken: null,
  sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
  resetPassword: jest.fn().mockResolvedValue(undefined),
};

// Mock the useStats hook
export const mockUseStats = {
  stats: mockStats,
  sessions: mockSessions,
  loading: false,
  error: null,
  refreshStats: jest.fn().mockResolvedValue(undefined),
  addSession: jest.fn().mockResolvedValue(undefined),
};

// Helper functions to create customized hooks
export const createMockUseAuth = (overrides = {}) => ({
  ...mockUseAuth,
  ...overrides,
});

export const createMockUseStats = (overrides = {}) => ({
  ...mockUseStats,
  ...overrides,
});

// Simple test to make Jest happy
describe('Hook Mocks', () => {
  it('should pass a dummy test', () => {
    expect(true).toBe(true);
  });
}); 