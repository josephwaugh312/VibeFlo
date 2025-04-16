// Mocking axios with inline function
jest.mock('axios', () => {
  // Create a mock axios instance
  const mockAxiosInstance = {
    interceptors: {
      request: { use: jest.fn(), eject: jest.fn() },
      response: { use: jest.fn(), eject: jest.fn() }
    },
    defaults: {
      headers: {
        common: {}
      }
    },
    get: jest.fn().mockResolvedValue({ data: {} }),
    post: jest.fn().mockResolvedValue({ data: {} }),
    put: jest.fn().mockResolvedValue({ data: {} }),
    delete: jest.fn().mockResolvedValue({ data: {} })
  };
  
  // Return the mock axios implementation
  return {
    create: jest.fn().mockReturnValue(mockAxiosInstance)
  };
});

import apiService from '../../services/api';

// Mock localStorage
const mockLocalStorage = (() => {
  let store: { [key: string]: string } = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    })
  };
})();

Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

describe('API Service Token Management', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.clear();
  });

  it('should set token in localStorage', () => {
    apiService.setToken('test-token');
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('token', 'test-token');
  });

  it('should remove token when null is passed', () => {
    apiService.setToken(null);
    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('token');
  });
}); 