import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Function to refresh the access token
  const refreshAccessToken = async () => {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await api.post('/api/auth/refresh', {}, {
        headers: {
          'X-Refresh-Token': refreshToken
        }
      });

      const { access_token } = response.data;
      if (!access_token) {
        throw new Error('No access token received');
      }

      localStorage.setItem('access_token', access_token);
      return true;
    } catch (error) {
      console.error('Failed to refresh token:', error);
      return false;
    }
  };

  // Set up periodic token refresh (every 3.5 hours)
  useEffect(() => {
    if (user) {
      const refreshInterval = setInterval(async () => {
        const success = await refreshAccessToken();
        if (!success) {
          // If refresh fails, log out the user
          logout();
        }
      }, 3.5 * 60 * 60 * 1000); // 3.5 hours in milliseconds

      return () => clearInterval(refreshInterval);
    }
  }, [user]);

  const login = async (email, password) => {
    try {
      console.log('Attempting login for email:', email);
      const response = await api.post('/api/auth/login', {
        email,
        password
      });

      const { access_token, refresh_token, ...userData } = response.data;
      
      // Store tokens
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('refresh_token', refresh_token);
      
      // Update user state
      setUser(userData);
      console.log('Login successful');
      
      return userData;
    } catch (error) {
      console.error('Login error:', error);
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      } else if (error.response?.status === 401) {
        throw new Error('Invalid email or password');
      } else if (error.response?.status === 400) {
        throw new Error('Please provide both email and password');
      } else {
        throw new Error('Failed to login. Please try again.');
      }
    }
  };

  const register = async (username, email, password) => {
    try {
      const response = await api.post('/api/auth/register', {
        username,
        email,
        password
      });
      
      // If registration is successful, automatically log the user in
      const { token } = response.data;
      if (token) {
        localStorage.setItem('access_token', token);
        setUser(response.data);
      }
      
      return response.data;
    } catch (error) {
      console.error('Registration error in AuthContext:', error);
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      } else if (error.response?.status === 400) {
        throw new Error('Invalid registration data. Please check your inputs.');
      } else if (error.response?.status === 500) {
        throw new Error('Server error. Please try again later.');
      } else {
        throw new Error('Failed to register. Please try again.');
      }
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
  };

  const fetchCurrentUser = async () => {
    try {
      const response = await api.get('/api/auth/validate');
      setUser(response.data.user);
    } catch (error) {
      console.error('Error fetching user:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      fetchCurrentUser();
    } else {
      setLoading(false);
    }
  }, []);

  const updateProfile = async (updatedData) => {
    try {
      const response = await api.put('/api/auth/profile', updatedData);
      setUser(response.data);
    } catch (error) {
      console.error('Error updating profile:', error);
      throw new Error(error.response?.data?.error || 'Failed to update profile');
    }
  };

  const value = {
    user,
    login,
    logout,
    register,
    updateProfile,
    loading,
    refreshAccessToken
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
