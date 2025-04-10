import React, { createContext, useContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import apiService, { authAPI } from '../services/api';
import { api } from '../services/api';

interface User {
  id: number;
  email: string;
  username: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  register: (name: string, username: string, email: string, password: string) => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  setUser: () => {},
  login: async () => {},
  register: async () => {},
  updateProfile: async () => {},
  logout: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
          setUser(userData);
          console.log('User authenticated on page load:', userData.username);
        } catch (error: any) {
          console.error('Token validation failed:', error);
          
          // More specific error handling
          if (error.response) {
            if (error.response.status === 401) {
              console.log('Token expired or invalid');
              toast.error('Session expired. Please log in again.');
            } else {
              console.log(`Server error: ${error.response.status}`);
              toast.error('Authentication error. Please log in again.');
            }
          } else if (error.request) {
            console.log('No response from server');
            toast.error('Server not responding. Please try again later.');
          } else {
            console.log('Error:', error.message);
          }
          
          // Clear invalid token
          localStorage.removeItem('token');
          apiService.setToken(null);
          setUser(null);
        }
      } else {
        console.log('No authentication token found');
        setUser(null);
      }
      
      setIsLoading(false);
    };
    
    checkAuthStatus();
  }, []);

  const login = async (email: string, password: string, rememberMe = true) => {
    try {
      setIsLoading(true);
      const response = await authAPI.login(email, password);
      
      if (response.token) {
        if (rememberMe) {
          // Only store token if rememberMe is true
          apiService.setToken(response.token);
        } else {
          // For session-only persistence, we still set the token in API
          // but don't store it in localStorage
          api.defaults.headers.common['Authorization'] = `Bearer ${response.token}`;
        }
        
        setUser(response.user);
        toast.success(`Welcome back, ${response.user.username}!`);
      } else {
        throw new Error('Login successful but no token received');
      }
      
      return response;
    } catch (error: any) {
      console.error('Login error:', error);
      
      if (error.response && error.response.data && error.response.data.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Login failed. Please check your credentials.');
      }
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, username: string, email: string, password: string) => {
    try {
      setIsLoading(true);
      const response = await authAPI.register(name, username, email, password);
      
      if (response.token) {
        apiService.setToken(response.token);
        setUser(response.user);
        toast.success(`Welcome, ${response.user.username}!`);
      } else {
        throw new Error('Registration successful but no token received');
      }
      
      return response;
    } catch (error: any) {
      console.error('Registration error:', error);
      
      if (error.response && error.response.data && error.response.data.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Registration failed. Please try again.');
      }
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (data: Partial<User>) => {
    try {
      setIsLoading(true);
      const updatedUser = await authAPI.updateProfile(data);
      setUser(updatedUser);
      toast.success('Profile updated successfully!');
      return updatedUser;
    } catch (error: any) {
      console.error('Profile update error:', error);
      
      if (error.response && error.response.data && error.response.data.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Failed to update profile. Please try again.');
      }
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  const logout = () => {
    localStorage.removeItem('token');
    apiService.setToken(null);
    setUser(null);
    toast.success('Logged out successfully');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        setUser,
        login,
        register,
        updateProfile,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}; 