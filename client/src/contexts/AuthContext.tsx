import React, { createContext, useContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import apiService, { authAPI } from '../services/api';

// Get the API base URL from environment or use default
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

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

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  login: (identifier: string, password: string, rememberMe: boolean) => Promise<void>;
  register: (name: string, username: string, email: string, password: string) => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<User>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  deleteAccount: (password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  setUser: () => {},
  login: async () => {},
  register: async () => {},
  updateProfile: async () => ({} as User),
  changePassword: async () => {},
  deleteAccount: async () => {},
  logout: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // On mount, check if there's a token and try to get the user
  useEffect(() => {
    const checkAuthStatus = async () => {
      const token = localStorage.getItem('token');
      
      if (token) {
        // Set token in API service
        apiService.setToken(token);
        
        try {
          // Check if token is valid by getting user data
          const userData = await authAPI.getCurrentUser();
          console.log('User authenticated successfully:', userData);
          setUser(userData);
          setIsAuthenticated(true);
        } catch (error: any) {
          console.error('Token validation failed:', error);
          
          // Only log out for specific 401 unauthorized errors
          if (error.response && error.response.status === 401 && 
              error.response.data && 
              error.response.data.message === 'Invalid token') {
            
            console.log('Invalid token detected - logging out');
            localStorage.removeItem('token');
            apiService.setToken(null);
            setUser(null);
            setIsAuthenticated(false);
            toast.error('Session expired. Please log in again.');
          } else {
            // For network errors or other server issues, keep the user logged in
            console.log('Error checking auth status, but keeping user logged in');
            
            // If we have cached user data, use it instead of forcing logout
            const cachedUser = localStorage.getItem('cachedUser');
            if (cachedUser) {
              try {
                setUser(JSON.parse(cachedUser));
                console.log('Using cached user data during server unavailability');
              } catch (e) {
                console.error('Failed to parse cached user data', e);
              }
            }
          }
        }
      } else {
        console.log('No authentication token found');
        setUser(null);
        setIsAuthenticated(false);
      }
      
      setIsLoading(false);
    };
    
    checkAuthStatus();
  }, []);

  // Cache user data when it changes
  useEffect(() => {
    if (user) {
      localStorage.setItem('cachedUser', JSON.stringify(user));
    }
  }, [user]);

  const login = async (identifier: string, password: string, rememberMe: boolean = false) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: identifier,
          password,
        }),
        credentials: 'include',
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setUser(data.user);
        setIsAuthenticated(true);
        localStorage.setItem('isAuthenticated', 'true');
        
        if (rememberMe) {
          localStorage.setItem('rememberMe', 'true');
        } else {
          localStorage.removeItem('rememberMe');
        }
        
        return { success: true };
      } else {
        // Handle specific error cases
        if (data.error === 'Email not verified') {
          return { 
            success: false, 
            needsVerification: true, 
            email: identifier,
            message: data.message || 'Please verify your email before logging in'
          };
        }
        
        setError(data.message || 'Login failed');
        return { 
          success: false, 
          message: data.message || 'Login failed'
        };
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Connection error. Please try again.');
      return { 
        success: false, 
        message: 'Connection error. Please try again.'
      };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, username: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await authAPI.register(name, username, email, password);
      toast.success('Registration successful! Please check your email for verification.');
      return response;
    } catch (error: any) {
      console.error('Registration failed:', error);
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Registration failed. Please try again later.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (data: Partial<User>) => {
    setIsLoading(true);
    try {
      const updatedUser = await authAPI.updateProfile(data);
      setUser(prev => prev ? { ...prev, ...updatedUser } : null);
      toast.success('Profile updated successfully');
      return updatedUser;
    } catch (error: any) {
      console.error('Profile update failed:', error);
      toast.error(error.response?.data?.message || 'Failed to update profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    setIsLoading(true);
    try {
      const response = await authAPI.changePassword(currentPassword, newPassword);
      toast.success('Password changed successfully');
      return response;
    } catch (error: any) {
      console.error('Password change failed:', error);
      toast.error(error.response?.data?.message || 'Failed to change password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteAccount = async (password: string) => {
    setIsLoading(true);
    try {
      const response = await authAPI.deleteAccount(password);
      setUser(null);
      localStorage.removeItem('token');
      apiService.setToken(null);
      toast.success('Account deleted successfully');
      return response;
    } catch (error: any) {
      console.error('Account deletion failed:', error);
      toast.error(error.response?.data?.message || 'Failed to delete account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('token');
    apiService.setToken(null);
    toast.success('Logged out successfully');
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoading,
      setUser,
      login,
      register,
      updateProfile,
      changePassword,
      deleteAccount,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
