import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import api, { fetchUserMemberships, fetchUserPassport, syncUserPassport } from '../utils/api';
import { setCookie, getCookie, deleteCookie } from '../utils/cookies';
import { clearVoteStateCache } from '../hooks/useEventVote';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const previousUserIdRef = useRef(null);

  // Function to refresh the access token
  const refreshAccessToken = async () => {
    try {
      // Try to get refresh token from cookies for backward compatibility
      const refreshToken = getCookie('refresh_token');
      if (!refreshToken) {
        console.warn('No refresh token available in cookies');
        return false;
      }

      console.log('Attempting to refresh token with refresh token:', refreshToken.substring(0, 10) + '...');
      
      // Create a direct axios instance to avoid interceptor loops
      const axios = (await import('axios')).default;
      const instance = axios.create({
        // Use relative URL in development to work with Vite proxy
        // In production, use the configured API URL
        baseURL: import.meta.env.MODE === 'production' 
          ? (import.meta.env.VITE_API_URL || 'https://api.i-timeline.com')
          : '',
        headers: { 'Content-Type': 'application/json' }
      });
      
      // Try a simpler approach - send the refresh token in the request body
      // This is often how refresh token endpoints are implemented
      const response = await instance.post('/api/auth/refresh', { refresh_token: refreshToken }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      // Check for valid response
      if (!response.data) {
        throw new Error('Invalid response from refresh endpoint');
      }
      
      const { access_token, refresh_token } = response.data;
      if (!access_token) {
        throw new Error('No access token received');
      }

      console.log('Successfully refreshed access token');
    
    // Store tokens in cookies
    setCookie('access_token', access_token, 7); // 7 days expiry
    if (refresh_token) {
      console.log('Updating refresh token');
      setCookie('refresh_token', refresh_token, 30); // 30 days expiry
    }
      
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
    
      // Store tokens in cookies
      setCookie('access_token', access_token, 7); // 7 days expiry
      setCookie('refresh_token', refresh_token, 30); // 30 days expiry
      
      // Clear any existing membership data from localStorage
      Object.keys(localStorage).forEach(key => {
        if (key.includes('timeline_membership_')) {
          console.log(`Clearing previous membership data: ${key}`);
          localStorage.removeItem(key);
        }
      });
      
      // Store user data in localStorage for API functions to access
      localStorage.setItem('user', JSON.stringify(userData));
      
      // Update user state
      setUser(userData);
      clearVoteStateCache();
      console.log('Login successful');
      
      // Fetch and store user passport
      console.log('Fetching user passport after login');
      try {
        await fetchUserPassport();
        
        // Force a sync with the server to ensure we have the most up-to-date membership data
        console.log('Forcing sync of user passport after login');
        await syncUserPassport();

        try {
          const mergedUserRaw = localStorage.getItem('user');
          const mergedUser = mergedUserRaw ? JSON.parse(mergedUserRaw) : null;
          if (mergedUser) {
            setUser(mergedUser);
          }
        } catch (rehydrateError) {
          console.warn('Failed to rehydrate user from localStorage after passport sync:', rehydrateError);
        }
      } catch (err) {
        console.error('Error fetching/syncing user passport after login:', err);
      }
      
      try {
        const latestUserRaw = localStorage.getItem('user');
        const latestUser = latestUserRaw ? JSON.parse(latestUserRaw) : null;
        if (latestUser) {
          return latestUser;
        }
      } catch (_latestErr) {
        // fall back to login payload
      }

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
        setCookie('access_token', token, 7); // 7 days expiry
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
    clearVoteStateCache();
    // Clear cookies
    deleteCookie('access_token');
    deleteCookie('refresh_token');
    
    // Clear user-specific membership data from localStorage
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const userId = currentUser.id || 'guest';
    
    if (userId) {
      // Find and remove all membership-related items for this user
      Object.keys(localStorage).forEach(key => {
        // Clear old format membership data
        if (key.includes(`timeline_membership_${userId}_`)) {
          console.log(`Clearing old format membership data: ${key}`);
          localStorage.removeItem(key);
        }
        
        // Clear new format timeline membership data (without userId)
        if (key.startsWith('timeline_membership_')) {
          console.log(`Clearing new format timeline membership data: ${key}`);
          localStorage.removeItem(key);
        }
        
        // Clear user-specific memberships
        if (key === `user_memberships_${userId}`) {
          console.log(`Clearing user-specific memberships for user ${userId}`);
          localStorage.removeItem(key);
        }
        
        // Clear user passport
        if (key === `user_passport_${userId}`) {
          console.log(`Clearing user passport for user ${userId}`);
          localStorage.removeItem(key);
        }
      });
    }
    
    // Remove user data from localStorage
    localStorage.removeItem('user');
    
    // Also remove legacy non-user-specific memberships if they exist
    localStorage.removeItem('user_memberships');
    
    // Clear user data from state
    setUser(null);
  };

  useEffect(() => {
    const currentUserId = user?.id ?? null;
    if (previousUserIdRef.current && previousUserIdRef.current !== currentUserId) {
      clearVoteStateCache();
    }
    previousUserIdRef.current = currentUserId;
  }, [user]);

  const fetchCurrentUser = async () => {
    try {
      console.log('Validating current user session...');
      // Try to get token from cookies
      const token = getCookie('access_token');
      
      if (!token) {
        console.warn('No access token found in cookies or localStorage during validation');
        setLoading(false);
        return false;
      }
      
      // Create a direct axios instance to avoid potential interceptor issues
      const axios = (await import('axios')).default;
      const baseURL = import.meta.env.MODE === 'production' 
        ? (import.meta.env.VITE_API_URL || 'https://api.i-timeline.com')
        : ''; // Use relative URL in development
      
      const response = await axios.post(`${baseURL}/api/auth/validate`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data && response.data.user) {
        console.log('User validation successful:', response.data.user);
        // Store user data in localStorage for API functions to access
        localStorage.setItem('user', JSON.stringify(response.data.user));
        setUser(response.data.user);
        
        // Fetch and store user passport
        console.log('Fetching user passport after session validation');
        try {
          await fetchUserPassport();

          try {
            const mergedUserRaw = localStorage.getItem('user');
            const mergedUser = mergedUserRaw ? JSON.parse(mergedUserRaw) : null;
            if (mergedUser) {
              setUser(mergedUser);
            }
          } catch (rehydrateError) {
            console.warn('Failed to rehydrate user from localStorage after passport fetch:', rehydrateError);
          }
        } catch (err) {
          console.error('Error fetching user passport after session validation:', err);
        }
        
        return true;
      } else {
        console.warn('User validation response missing user data');
        throw new Error('Invalid user data in response');
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      
      // Try to refresh the token before logging out
      console.log('Attempting token refresh after validation failure');
      const refreshSuccessful = await refreshAccessToken();
      
      if (refreshSuccessful) {
        // Try to validate again with the new token
        try {
          const token = getCookie('access_token');
          const axios = (await import('axios')).default;
          const baseURL = import.meta.env.MODE === 'production' 
            ? (import.meta.env.VITE_API_URL || 'https://api.i-timeline.com')
            : ''; // Use relative URL in development
          
          const finalResponse = await axios.get(`${baseURL}/api/auth/me`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (finalResponse.data) {
            const userData = {
              ...finalResponse.data,
              avatar_url: finalResponse.data.avatar_url || finalResponse.data.avatar
            };
            
            // Store user data in localStorage for API functions to access
            localStorage.setItem('user', JSON.stringify(userData));
            
            setUser(prevUser => ({
              ...prevUser,
              ...userData
            }));
            console.log('User validation successful after token refresh');
            
            // Fetch and store user passport
            console.log('Fetching user passport after token refresh');
            try {
              await fetchUserPassport();
            } catch (err) {
              console.error('Error fetching user passport after token refresh:', err);
            }
            
            return true;
          }
        } catch (secondError) {
          console.error('Error fetching user after token refresh:', secondError);
        }
      }
      
      console.warn('All authentication attempts failed, logging out');
      logout();
      return false;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Function to check and restore session
    const checkAndRestoreSession = async () => {
      try {
        // First check for access token in both cookies and localStorage
        const token = getCookie('access_token') || localStorage.getItem('access_token');
        console.log('Initial auth check - Access token exists:', !!token);
        
        if (token) {
          // Try to use the existing access token
          await fetchCurrentUser();
          return;
        }
        
        // If no access token, check for refresh token in both cookies and localStorage
        const refreshToken = getCookie('refresh_token') || localStorage.getItem('refresh_token');
        if (refreshToken) {
          console.log('Access token missing but refresh token found, attempting refresh...');
          const success = await refreshAccessToken();
          if (success) {
            await fetchCurrentUser();
            return;
          }
        }
        
        // If we get here, no valid tokens were found
        console.log('No valid authentication tokens found');
        setLoading(false);
      } catch (error) {
        console.error('Error during session restoration:', error);
        setLoading(false);
      }
    };
    
    // Add a small delay to ensure localStorage is fully loaded
    const initializeAuth = setTimeout(() => {
      checkAndRestoreSession();
    }, 100); // Small delay to ensure localStorage is available
    
    return () => clearTimeout(initializeAuth);
  }, []);

  const updateProfile = async (updatedData) => {
    try {
      // Don't make a separate API call here since the profile update
      // was already done in the ProfileSettings component
      setUser(prevUser => {
        const merged = {
          ...prevUser,
          ...updatedData,
        };
        localStorage.setItem('user', JSON.stringify(merged));
        return merged;
      });
      return updatedData;
    } catch (error) {
      console.error('Error updating profile in context:', error);
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
