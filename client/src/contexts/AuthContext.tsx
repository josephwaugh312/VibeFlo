import React, { createContext, useContext, useState, useEffect } from 'react';
import axios, { AxiosError } from 'axios';
import apiService, { authAPI } from '../services/api';

// Remove the hardcoded API base URL since we're using the one from apiService
interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  bio?: string;
  avatarUrl?: string;
  created_at?: string;
  updated_at?: string;
  is_admin?: boolean;
  is_verified?: boolean;
  // ... any other existing fields
}

interface LoginResponse {
  success: boolean;
  needsVerification?: boolean;
  email?: string;
  message?: string;
  token?: string;
  user?: User;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setIsAuthenticated: (value: boolean) => void;
  logout: () => void;
  initializeAuth: () => Promise<void>;
  refreshUserData: () => Promise<User | null>;
  login: (identifier: string, password: string, rememberMe?: boolean) => Promise<LoginResponse>;
  register: (email: string, username: string, password: string, confirmPassword: string) => Promise<void>;
  updateProfile: (userData: Partial<User>) => Promise<User>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  deleteAccount: (password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshAttempts, setRefreshAttempts] = useState(0);

  const initializeAuth = async () => {
    try {
      console.log('Auth Context: Starting initializeAuth()');
      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      if (token) {
        // Configure axios and API service with the token
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        apiService.setToken(token);
        console.log('Auth Context: Token found and set in headers (length):', token.length);

        if (storedUser) {
          // If we have stored user data, use it immediately
          try {
            const userData = JSON.parse(storedUser);
            setUser(userData);
            setIsAuthenticated(true);
            console.log('Auth Context: Using stored user data:', userData.username || userData.email);
          } catch (parseError) {
            console.error('Auth Context: Error parsing stored user data:', parseError);
            localStorage.removeItem('user');
          }
        }

        try {
          // Verify token and refresh user data with retry logic
          console.log('Auth Context: Verifying token and refreshing user data');
          
          // Add delay before token verification to ensure any previous requests are complete
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Use the refreshUserData function which now has retry logic
          const userData = await refreshUserData();
          
          if (userData) {
            console.log('Auth Context: User data refreshed successfully with retry logic');
            // The refreshUserData function already updates state and localStorage
            setRefreshAttempts(0); // Reset attempts on success
          } else {
            throw new Error('Failed to refresh user data with retry logic');
          }
        } catch (error: any) {
          console.error('Auth Context: Error refreshing user data:', error);
          console.error('Auth Context: Error message:', error.message);
          
          if (error.response) {
            console.error('Auth Context: Error status:', error.response.status);
            console.error('Auth Context: Error data:', error.response.data);
            console.error('Auth Context: Request URL:', error.response.config?.url);
            console.error('Auth Context: Request headers:', error.response.config?.headers);
          } else if (error.request) {
            console.error('Auth Context: No response received from server');
            console.error('Auth Context: Request details:', error.request);
          }
          
          // Check if the token is invalid
          if (error.response?.status === 401) {
            console.log('Auth Context: Token invalid or expired, clearing auth state');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            apiService.setToken(null);
            setUser(null);
            setIsAuthenticated(false);
            setRefreshAttempts(0);
          } else {
            // For other errors, keep using stored user data but increment attempts
            if (refreshAttempts >= 3) {
              console.log('Auth Context: Max refresh attempts reached, clearing auth state');
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              setUser(null);
              setIsAuthenticated(false);
              setRefreshAttempts(0);
            } else {
              console.log('Auth Context: Keeping stored user data, incrementing attempts');
              setRefreshAttempts(prev => prev + 1);
            }
          }
        }
      } else {
        console.log('Auth Context: No token found, not authenticated');
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Auth Context: Initialization error:', error);
      console.error('Auth Context: Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
      console.log('Auth Context: initializeAuth completed');
    }
  };

  const logout = () => {
    // Before logging out, save the current avatar URL if it exists
    if (user && user.avatarUrl) {
      try {
        console.log('AuthContext: Saving avatar URL before logout:', user.avatarUrl);
        localStorage.setItem('lastAvatarUrl', user.avatarUrl);
        localStorage.setItem('lastUserId', user.id);
      } catch (e) {
        console.error('AuthContext: Error saving avatar URL before logout:', e);
      }
    }

    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
    apiService.setToken(null);
    setUser(null);
    setIsAuthenticated(false);
  };

  const login = async (identifier: string, password: string, rememberMe: boolean = true): Promise<LoginResponse> => {
    try {
      console.log('AuthContext: Attempting login with', { identifier, rememberMe });
      
      // Validate inputs
      if (!identifier || !password) {
        console.error('Login failed: Missing credentials');
        return {
          success: false,
          message: 'Email/username and password are required'
        };
      }

      // Check if there's stored user data with an avatar to preserve
      let storedUserData = null;
      let lastAvatarUrl = null;
      let lastUserId = null;

      try {
        // Check for a previously saved avatar URL from last logout
        lastAvatarUrl = localStorage.getItem('lastAvatarUrl');
        lastUserId = localStorage.getItem('lastUserId');
        if (lastAvatarUrl) {
          console.log('AuthContext: Found last avatar URL from previous session:', lastAvatarUrl);
        }

        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          storedUserData = JSON.parse(storedUser);
          console.log('AuthContext: Found stored user data before login:', storedUserData.username, 'Avatar:', storedUserData.avatarUrl);
        }
      } catch (e) {
        console.error('AuthContext: Error reading stored user data:', e);
      }
      
      const response = await authAPI.login(identifier, password, rememberMe);
      console.log('Login response in auth context:', response);
      
      if (response.success && response.token) {
        // Store the token
        localStorage.setItem('token', response.token);
        apiService.setToken(response.token);
        console.log('Login successful: Token stored and set in headers');
        
        // If we have user data, store it
        if (response.user) {
          console.log('User data received with login response, storing it');
          
          // If the response doesn't have an avatar URL but we have one saved from last logout
          // and it's the same user, use that avatar URL
          if (!response.user.avatarUrl && lastAvatarUrl && lastUserId === response.user.id) {
            console.log('AuthContext: Using avatar URL from previous session:', lastAvatarUrl);
            response.user.avatarUrl = lastAvatarUrl;
          }
          
          // Merge with stored user data if available and the same user
          if (storedUserData && storedUserData.id === response.user.id) {
            // If the response doesn't have an avatar but stored data does, preserve it
            if (!response.user.avatarUrl && storedUserData.avatarUrl) {
              console.log('AuthContext: Preserving avatar URL from stored data:', storedUserData.avatarUrl);
              response.user.avatarUrl = storedUserData.avatarUrl;
            }
          }
          
          // Ensure the user data is complete
          console.log('AuthContext: Final user data being stored:', response.user);
          localStorage.setItem('user', JSON.stringify(response.user));
          setUser(response.user);
          setIsAuthenticated(true);
          
          // Dispatch custom event to notify theme context
          window.dispatchEvent(new Event('vf-login-success'));
          
          return response;
        } else {
          // If no user data, fetch it
          console.log('No user data in login response, fetching it separately');
          try {
            // Add a small delay before fetching user data to ensure token is properly set
            await new Promise(resolve => setTimeout(resolve, 300));
            
            const userData = await apiService.auth.getCurrentUser();
            console.log('User data fetched after login:', userData);
            
            // If no avatar URL but we have one saved from last logout
            if (!userData.avatarUrl && lastAvatarUrl && lastUserId === userData.id) {
              console.log('AuthContext: Using avatar URL from previous session after fetch:', lastAvatarUrl);
              userData.avatarUrl = lastAvatarUrl;
            }
            
            // If we have stored data and it has an avatar but fetched data doesn't, use the stored avatar
            if (storedUserData && storedUserData.id === userData.id && !userData.avatarUrl && storedUserData.avatarUrl) {
              console.log('AuthContext: Adding stored avatar URL to fetched user data');
              userData.avatarUrl = storedUserData.avatarUrl;
            }
            
            console.log('AuthContext: Final user data after fetch:', userData);
            localStorage.setItem('user', JSON.stringify(userData));
            setUser(userData);
            setIsAuthenticated(true);
            
            // Dispatch custom event to notify theme context
            window.dispatchEvent(new Event('vf-login-success'));
            
            return {
              ...response,
              user: userData
            };
          } catch (error: any) {
            console.error('Error fetching user data after login:', error);
            console.log('Status:', error.response?.status);
            console.log('Response data:', error.response?.data);
            
            // If we get a 401, the token is invalid
            if (error.response?.status === 401) {
              console.error('Token validation failed, clearing auth state');
              localStorage.removeItem('token');
              apiService.setToken(null);
              setUser(null);
              setIsAuthenticated(false);
              return {
                success: false,
                message: 'Authentication failed: Invalid token'
              };
            }
            
            // For other errors, we'll still return success but with a warning
            // This allows the user to continue with the login flow, and we'll retry fetching profile later
            console.log('Continuing with login despite profile fetch error');
            setIsAuthenticated(true);
            
            return {
              ...response,
              message: response.message || 'Logged in, but profile information could not be loaded'
            };
          }
        }
      }
      
      return response;
    } catch (error) {
      console.error('Login error:', error);
      if (error instanceof AxiosError) {
        return {
          success: false,
          message: error.response?.data?.message || 'An error occurred during login'
        };
      }
      return {
        success: false,
        message: 'An unexpected error occurred during login'
      };
    }
  };

  const register = async (email: string, username: string, password: string, confirmPassword: string): Promise<void> => {
    try {
      if (password !== confirmPassword) {
        throw new Error('Passwords do not match');
      }
      const response = await authAPI.register(username, username, email, password);
      
      // If registration returns a token, store it for testing purposes
      if (response && response.token) {
        localStorage.setItem('token', response.token);
        apiService.setToken(response.token);
        
        // Store minimal user data
        if (response.user) {
          localStorage.setItem('user', JSON.stringify(response.user));
          setUser(response.user);
          setIsAuthenticated(true);
        }
      }
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const updateProfile = async (userData: Partial<User>): Promise<User> => {
    try {
      const updatedUser = await authAPI.updateProfile(userData);
      
      // Preserve existing user data that might not be returned by the API
      const currentUser = user || {};
      const mergedUser = { ...currentUser, ...updatedUser };
      
      // Make sure avatarUrl is preserved if it exists
      if (userData.avatarUrl && !updatedUser.avatarUrl) {
        mergedUser.avatarUrl = userData.avatarUrl;
      }
      
      // Update state and localStorage with complete user data
      setUser(mergedUser);
      localStorage.setItem('user', JSON.stringify(mergedUser));
      
      return mergedUser;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string): Promise<void> => {
    try {
      await authAPI.changePassword(currentPassword, newPassword);
    } catch (error) {
      console.error('Error changing password:', error);
      throw error;
    }
  };

  const deleteAccount = async (password: string): Promise<void> => {
    try {
      await authAPI.deleteAccount(password);
      logout();
    } catch (error) {
      console.error('Error deleting account:', error);
      throw error;
    }
  };

  const refreshUserData = async (retries = 3, delay = 2000): Promise<User | null> => {
    try {
      console.log('Auth Context: Manually refreshing user data');
      
      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      let storedUserData: User | null = null;
      
      // Parse stored user data if available
      if (storedUser) {
        try {
          storedUserData = JSON.parse(storedUser);
        } catch (e) {
          console.error('Auth Context: Error parsing stored user data:', e);
        }
      }
      
      if (!token) {
        console.log('Auth Context: No token found, cannot refresh user data');
        return null;
      }
      
      // Ensure token is set in API service
      apiService.setToken(token);
      
      // Fetch user data with retry
      let userData = null;
      let lastError: AxiosError | null = null;
      let backoffDelay = delay;
      
      for (let attempt = 0; attempt <= retries; attempt++) {
        try {
          console.log(`Auth Context: Attempt ${attempt + 1} to fetch user data`);
          
          // Implement circuit breaker pattern for resource errors
          if (attempt > 0 && lastError && lastError.message && 
              (lastError.message.includes('ERR_INSUFFICIENT_RESOURCES') || 
               lastError.message.includes('Network Error'))) {
            // Exponential backoff with jitter
            backoffDelay = Math.min(30000, backoffDelay * 1.5 * (1 + Math.random() * 0.2));
            console.log(`Auth Context: Resource error detected, using exponential backoff: ${backoffDelay}ms`);
          }
          
          userData = await apiService.auth.getCurrentUser();
          break; // If successful, exit the loop
        } catch (error) {
          const axiosError = error as AxiosError;
          console.error(`Auth Context: Attempt ${attempt + 1} failed:`, axiosError.message);
          
          // Log additional details
          if (axiosError.response) {
            console.error('Auth Context: Error status:', axiosError.response.status);
            console.error('Auth Context: Error data:', axiosError.response.data);
          } else if (axiosError.request) {
            console.error('Auth Context: No response received:', axiosError.request);
            
            // Handle resource constraint errors
            if (axiosError.message && axiosError.message.includes('ERR_INSUFFICIENT_RESOURCES')) {
              console.error('Auth Context: Insufficient resources error detected');
            }
          }
          
          lastError = axiosError;
          
          // If we get a 401 error, don't retry
          if (axiosError.response?.status === 401) {
            throw axiosError;
          }
          
          if (attempt < retries) {
            console.log(`Auth Context: Waiting ${backoffDelay}ms before next attempt`);
            await new Promise(resolve => setTimeout(resolve, backoffDelay));
          }
        }
      }
      
      if (!userData) {
        // All attempts failed
        throw lastError || new Error('Failed to fetch user data after multiple attempts');
      }
      
      console.log('Auth Context: User data refreshed successfully:', userData);
      
      // Merge with stored user data to preserve any fields that might be missing in the API response
      // This is especially important for the avatarUrl which might not be included in API responses
      if (storedUserData) {
        userData = {
          ...userData,
          // Preserve avatarUrl from stored data if it's not in the API response
          avatarUrl: userData.avatarUrl || storedUserData.avatarUrl
        };
        console.log('Auth Context: Merged with stored user data, final user data:', userData);
      }
      
      // Update state and localStorage
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      setIsAuthenticated(true);
      
      return userData;
    } catch (error) {
      console.error('Auth Context: Error refreshing user data:', error);
      return null;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        setUser,
        setIsAuthenticated,
        logout,
        initializeAuth,
        refreshUserData,
        login,
        register,
        updateProfile,
        changePassword,
        deleteAccount
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
