import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
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

interface LoginResponse {
  success: boolean;
  needsVerification?: boolean;
  email?: string;
  message?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setIsAuthenticated: (value: boolean) => void;
  logout: () => void;
  initializeAuth: () => Promise<void>;
  login: (identifier: string, password: string, rememberMe?: boolean) => Promise<LoginResponse>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const initializeAuth = async () => {
    try {
      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      if (token) {
        // Configure axios and API service with the token
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        apiService.setToken(token);

        if (storedUser) {
          // If we have stored user data, use it immediately
          const userData = JSON.parse(storedUser);
          setUser(userData);
          setIsAuthenticated(true);
        }

        try {
          // Verify token and refresh user data
          console.log('Verifying token and refreshing user data');
          const response = await apiService.auth.getCurrentUser();
          console.log('User data refreshed:', response);
          
          localStorage.setItem('user', JSON.stringify(response));
          setUser(response);
          setIsAuthenticated(true);
        } catch (error) {
          console.error('Error refreshing user data:', error);
          // If token verification fails, clear everything
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
          setIsAuthenticated(false);
        }
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (identifier: string, password: string, rememberMe: boolean = true): Promise<LoginResponse> => {
    try {
      const response = await authAPI.login(identifier, password);
      if (response.success) {
        await initializeAuth();
      }
      return response;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
    apiService.setToken(null);
    setUser(null);
    setIsAuthenticated(false);
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
        login
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
