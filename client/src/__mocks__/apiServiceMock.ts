// Mock API service
const apiServiceMock = {
  setToken: jest.fn(),
};

// Mock auth API
export const authAPIMock = {
  login: jest.fn().mockImplementation(() => 
    Promise.resolve({ 
      user: { id: '1', name: 'Test User', username: 'testuser', email: 'test@example.com' },
      token: 'fake-token'
    })
  ),
  register: jest.fn(),
  getCurrentUser: jest.fn().mockImplementation(() => 
    Promise.resolve({ id: '1', name: 'Test User', username: 'testuser', email: 'test@example.com' })
  ),
  updateProfile: jest.fn(),
  changePassword: jest.fn(),
  deleteAccount: jest.fn(),
};

// Default export for the full API service
export default apiServiceMock; 