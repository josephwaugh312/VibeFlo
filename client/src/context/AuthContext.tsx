import React, { createContext, useContext, useState, useEffect } from 'react';
import apiService from '../services/api';

// Define the shape of our auth context
interface AuthContextType {
  isAuthenticated: boolean;
  loading: boolean;
  user: any | null;
  login: (loginIdentifier: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  error: string | null;
  clearError: () => void;
}

// Create a context with a default value
const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  loading: true,
  user: null,
  login: async () => {},
  register: async () => {},
  logout: () => {},
  error: null,
  clearError: () => {},
});

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext);

// Provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Check if the user is already logged in on component mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');
      
      if (token) {
        try {
          // Set the token in the API service
          apiService.setToken(token);
          
          // Try to use saved user data first if available
          if (savedUser) {
            try {
              const parsedUser = JSON.parse(savedUser);
              setUser(parsedUser);
              setIsAuthenticated(true);
              console.log('Using saved user data:', parsedUser.username || parsedUser.name);
            } catch (parseErr) {
              console.error('Error parsing saved user:', parseErr);
              // Continue with API fetch if parsing fails
            }
          }
          
          // Fetch the user profile (even if we have saved data, to ensure it's fresh)
          try {
            const userData = await apiService.auth.getCurrentUser();
            // Save the user data to localStorage
            localStorage.setItem('user', JSON.stringify(userData));
            setUser(userData);
            setIsAuthenticated(true);
          } catch (err: any) {
            console.error('Error validating token:', err);
            
            // Handle 404 errors differently - the endpoint might not exist but we still want to keep
            // the token for other functioning endpoints (like playlists)
            if (err.response?.status === 404) {
              console.log('Auth endpoint not found, but keeping token for other API endpoints');
              // Keep the token and consider the user authenticated
              setIsAuthenticated(true);
              
              // Only set a minimal user object if we don't already have one
              if (!user && !savedUser) {
                setUser({ id: 'unknown', username: 'User' });
              }
            } else if (!savedUser) {
              // For other errors without saved user data, clear the token
              localStorage.removeItem('token');
              apiService.setToken(null);
              setIsAuthenticated(false);
              setUser(null);
            }
          }
        } catch (err: any) {
          console.error('Error in auth check:', err);
          
          if (!savedUser) {
            // Only clear auth if we don't have saved user data
            localStorage.removeItem('token');
            apiService.setToken(null);
            setIsAuthenticated(false);
            setUser(null);
          }
        }
      }
      
      setLoading(false);
    };
    
    checkAuth();
  }, []);

  // Login function
  const login = async (loginIdentifier: string, password: string) => {
    try {
      setLoading(true);
      const { token, user } = await apiService.auth.login(loginIdentifier, password);
      
      // Save token to local storage
      localStorage.setItem('token', token);
      
      // Save user data to local storage for persistence
      localStorage.setItem('user', JSON.stringify(user));
      
      // Set the token in the API service
      apiService.setToken(token);
      
      setUser(user);
      setIsAuthenticated(true);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Register function
  const register = async (username: string, email: string, password: string) => {
    try {
      setLoading(true);
      // Use a default name value if needed or modify the signature to match the API
      const name = username; // Use username as name by default
      const { token, user } = await apiService.auth.register(name, username, email, password);
      
      // Save token to local storage
      localStorage.setItem('token', token);
      
      // Save user data to local storage for persistence
      localStorage.setItem('user', JSON.stringify(user));
      
      // Set the token in the API service
      apiService.setToken(token);
      
      setUser(user);
      setIsAuthenticated(true);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    // Remove token and user data from local storage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Clear the token in the API service
    apiService.setToken(null);
    
    setUser(null);
    setIsAuthenticated(false);
  };

  // Clear error
  const clearError = () => {
    setError(null);
  };

  // Create the context value object
  const value = {
    isAuthenticated,
    loading,
    user,
    login,
    register,
    logout,
    error,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}; 