import { 
  mockUser, 
  mockSessions, 
  mockStats, 
  mockUseAuth, 
  mockUseStats,
  createMockUseAuth,
  createMockUseStats
} from './hook-mocks';

describe('Hook Mocks', () => {
  test('mockUser should exist with required properties', () => {
    expect(mockUser).toBeDefined();
    expect(mockUser.id).toBeDefined();
    expect(mockUser.username).toBeDefined();
    expect(mockUser.name).toBeDefined();
    expect(mockUser.email).toBeDefined();
  });

  test('mockSessions should be an array with session data', () => {
    expect(Array.isArray(mockSessions)).toBe(true);
    expect(mockSessions.length).toBeGreaterThan(0);
    
    const firstSession = mockSessions[0];
    expect(firstSession.id).toBeDefined();
    expect(firstSession.duration).toBeDefined();
    expect(firstSession.task).toBeDefined();
    expect(firstSession.completed).toBeDefined();
    expect(firstSession.created_at).toBeDefined();
  });

  test('mockStats should have required properties', () => {
    expect(mockStats).toBeDefined();
    expect(mockStats.totalSessions).toBeDefined();
    expect(mockStats.completedSessions).toBeDefined();
    expect(mockStats.totalFocusTime).toBeDefined();
    expect(mockStats.lastWeekActivity).toBeDefined();
  });

  test('mockUseAuth should provide all required auth functions', () => {
    expect(mockUseAuth.user).toBeDefined();
    expect(mockUseAuth.isAuthenticated).toBeDefined();
    expect(mockUseAuth.login).toBeDefined();
    expect(mockUseAuth.register).toBeDefined();
    expect(mockUseAuth.logout).toBeDefined();
  });

  test('mockUseStats should provide all required stats functions', () => {
    expect(mockUseStats.stats).toBeDefined();
    expect(mockUseStats.sessions).toBeDefined();
    expect(mockUseStats.refreshStats).toBeDefined();
    expect(mockUseStats.addSession).toBeDefined();
  });

  test('createMockUseAuth should override default values', () => {
    const customUser = { id: '2', username: 'custom', name: 'Custom User', email: 'custom@example.com' };
    const customAuth = createMockUseAuth({ user: customUser, isAuthenticated: false });
    
    expect(customAuth.user).toEqual(customUser);
    expect(customAuth.isAuthenticated).toBe(false);
    expect(customAuth.login).toBeDefined(); // Original functions should still be present
  });

  test('createMockUseStats should override default values', () => {
    const customStats = { totalSessions: 20, completedSessions: 15, totalFocusTime: 500 };
    const customStatsHook = createMockUseStats({ stats: customStats, loading: true });
    
    expect(customStatsHook.stats).toEqual(customStats);
    expect(customStatsHook.loading).toBe(true);
    expect(customStatsHook.refreshStats).toBeDefined(); // Original functions should still be present
  });
}); 