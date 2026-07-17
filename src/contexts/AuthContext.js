import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import api, { fetchUserMemberships, fetchUserPassport, syncUserPassport } from '../utils/api';
import { setCookie, getCookie, deleteCookie } from '../utils/cookies';
import { clearVoteStateCache } from '../hooks/useEventVote';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const cachedUser = localStorage.getItem('user');
      return cachedUser ? JSON.parse(cachedUser) : null;
    } catch {
      return null;
    }
  });
  const [isGuest, setIsGuest] = useState(() => {
    return localStorage.getItem('guest_session') === 'true';
  });
  const [loading, setLoading] = useState(() => {
    try {
      const cachedUser = localStorage.getItem('user');
      return !cachedUser;
    } catch {
      return true;
    }
  });
  const previousUserIdRef = useRef(null);

  // Function to refresh the access token
  const refreshAccessToken = async () => {
    try {
      const refreshToken = getCookie('it_refresh') || getCookie('refresh_token') || localStorage.getItem('refresh_token');
      console.log('Attempting to refresh token...');
      
      // Create a direct axios instance to avoid interceptor loops
      const axios = (await import('axios')).default;
      const instance = axios.create({
        // Use relative URL in development to work with Vite proxy
        // In production, use the configured API URL
        baseURL: import.meta.env.MODE === 'production' 
          ? (import.meta.env.VITE_API_URL || 'https://api.i-timeline.com')
          : '',
        withCredentials: true,
        headers: { 'Content-Type': 'application/json' }
      });

      const refreshHeaders = {
        'Content-Type': 'application/json'
      };
      if (refreshToken) {
        refreshHeaders.Authorization = `Bearer ${refreshToken}`;
      }

      const response = await instance.post('/api/v1/auth/refresh', {}, {
        headers: refreshHeaders
      });

      // Check for valid response
      if (!response.data?.ok) {
        throw new Error('Invalid response from refresh endpoint');
      }

      // Store new access token from response
      if (response.data.access_token) {
        localStorage.setItem('access_token', response.data.access_token);
        console.log('Stored refreshed access token');
      }

      // Store rotated refresh token from response in localStorage
      if (response.data.refresh_token) {
        localStorage.setItem('refresh_token', response.data.refresh_token);
        console.log('Stored refreshed refresh token');
      }

      console.log('Successfully refreshed access token');
      
      return true;
    } catch (error) {
      console.error('Failed to refresh token:', error);
      return false;
    }
  };

  // Set up periodic token refresh (every 3.5 hours) — skipped for guest sessions
  useEffect(() => {
    if (user && !isGuest) {
      const refreshInterval = setInterval(async () => {
        const success = await refreshAccessToken();
        if (!success) {
          // If refresh fails, log out the user
          await logout();
        }
      }, 3.5 * 60 * 60 * 1000); // 3.5 hours in milliseconds

      return () => clearInterval(refreshInterval);
    }
  }, [user, isGuest]);

  // Listen for the custom auth-session-expired event to cleanly logout without redirects
  useEffect(() => {
    const handleSessionExpired = async () => {
      console.warn('[AuthContext] Session expired event detected, executing logout...');
      await logout();
    };

    window.addEventListener('auth-session-expired', handleSessionExpired);
    return () => {
      window.removeEventListener('auth-session-expired', handleSessionExpired);
    };
  }, []);

  const login = async (email, password) => {
    try {
      console.log('Attempting login for email:', email);
      const response = await api.post('/api/v1/auth/login', {
        email,
        password
      });

      if (!response?.data?.ok) {
        throw new Error('Login failed');
      }

      // Store access token from response for Bearer auth
      if (response.data.access_token) {
        localStorage.setItem('access_token', response.data.access_token);
        console.log('Stored access token from login response');
      }
      
      if (response.data.refresh_token) {
        localStorage.setItem('refresh_token', response.data.refresh_token);
        console.log('Stored refresh token from login response');
      }

      const meResponse = await api.get('/api/v1/auth/me');
      const userDataRaw = meResponse?.data?.user || null;
      if (!userDataRaw) {
        throw new Error('Login succeeded but no user session payload was returned');
      }
      
      const userData = {
        ...userDataRaw,
        is_site_admin: !!meResponse.data.is_site_admin,
        site_admin_role: meResponse.data.site_admin_role || null,
      };
      
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
      setIsGuest(Boolean(meResponse?.data?.is_guest));
      localStorage.removeItem('guest_session');
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
      // Re-throw the original error if it has a response (so Login.js can check codes)
      if (error.response) {
        throw error;
      }
      
      if (error.response?.data?.error) {
        throw new Error(typeof error.response.data.error === 'string' ? error.response.data.error : (error.response.data.error.message || 'Login failed'));
      } else if (error.response?.status === 401) {
        throw new Error('Invalid email or password');
      } else if (error.response?.status === 400) {
        throw new Error('Please provide both email and password');
      } else {
        throw new Error(error.message || 'Failed to login. Please try again.');
      }
    }
  };

  const register = async (username, email, password, turnstileToken) => {
    try {
      const response = await api.post('/api/v1/auth/register', {
        username,
        email,
        password,
        turnstile_token: turnstileToken,
      });

      if (!response?.data?.ok) {
        throw new Error('Registration failed');
      }

      // Store access token from response for Bearer auth
      if (response.data.access_token) {
        localStorage.setItem('access_token', response.data.access_token);
        console.log('Stored access token from register response');
      }
      
      if (response.data.refresh_token) {
        localStorage.setItem('refresh_token', response.data.refresh_token);
        console.log('Stored refresh token from register response');
      }

      // Backend already set HTTP-only cookies - just fetch user data
      const meResponse = await api.get('/api/v1/auth/me');
      const userDataRaw = meResponse?.data?.user || null;
      if (!userDataRaw) {
        throw new Error('Registration succeeded but no user session payload was returned');
      }

      const userData = {
        ...userDataRaw,
        is_site_admin: !!meResponse.data.is_site_admin,
        site_admin_role: meResponse.data.site_admin_role || null,
      };

      // Clear any existing membership data from localStorage
      Object.keys(localStorage).forEach(key => {
        if (key.includes('timeline_membership_')) {
          console.log(`Clearing previous membership data: ${key}`);
          localStorage.removeItem(key);
        }
      });

      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      setIsGuest(Boolean(meResponse?.data?.is_guest));
      localStorage.removeItem('guest_session');
      clearVoteStateCache();
      console.log('Registration successful');

      // Fetch and store user passport
      console.log('Fetching user passport after registration');
      try {
        await fetchUserPassport();
        await syncUserPassport();
      } catch (err) {
        console.error('Error fetching passport after registration:', err);
      }

      return userData;
    } catch (error) {
      console.error('Registration error in AuthContext:', error);
      if (error.response?.data?.error) {
        const errorMsg = typeof error.response.data.error === 'string'
          ? error.response.data.error
          : JSON.stringify(error.response.data.error);
        throw new Error(errorMsg);
      } else if (error.response?.status === 429) {
        throw new Error('Too many registration attempts. Please wait a moment and try again.');
      } else if (error.response?.status === 400) {
        throw new Error('Invalid registration data. Please check your inputs.');
      } else if (error.response?.status === 409) {
        throw new Error('Username or email already taken.');
      } else if (error.response?.status === 500) {
        throw new Error('Server error. Please try again later.');
      } else {
        throw new Error('Failed to register. Please try again.');
      }
    }
  };

  const logout = async () => {
    clearVoteStateCache();

    // Check if there's actually a session to logout from
    const hasAccessToken = localStorage.getItem('access_token') || getCookie('it_access');
    const hasRefreshToken = localStorage.getItem('refresh_token') || getCookie('it_refresh');

    // Call backend logout to clear HTTP-only cookies (only if we had a session)
    // This is critical - JS cannot delete HttpOnly cookies directly
    if (hasAccessToken || hasRefreshToken) {
      try {
        await api.post('/api/v1/auth/logout');
        console.log('[Auth] Backend logout successful, HTTP-only cookies cleared');
      } catch (error) {
        // 401 is expected if tokens already expired/invalid - still proceed with local cleanup
        if (error?.response?.status !== 401) {
          console.warn('[Auth] Backend logout failed:', error?.message);
        }
      }
    } else {
      console.log('[Auth] No session to logout from, skipping backend call');
    }

    // Clear tokens from localStorage
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    // Clear cookies (these are non-HttpOnly fallbacks, if any)
    deleteCookie('it_access');
    deleteCookie('it_refresh');
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

    // Clear guest session marker
    localStorage.removeItem('guest_session');

    // Clear user data from state
    setUser(null);
    setIsGuest(false);
  };

  const loginAsGuest = async () => {
    try {
      console.log('[Auth] Fetching guest session from backend...');
      const response = await api.post('/api/v1/auth/guest');
      if (!response?.data?.ok) {
        throw new Error('Guest session creation failed');
      }

      const meResponse = await api.get('/api/v1/auth/me');
      const guestUser = meResponse?.data?.user || {
        id: null,
        username: 'Goblin',
        avatar_url: '/images/GUEST_img.png',
        email: null,
        role: 'guest',
      };

      setUser(guestUser);
      setIsGuest(true);
      
      // Persist so a page refresh restores the guest session
      localStorage.setItem('guest_session', 'true');
      console.log('[Auth] Guest session started with token');
      return guestUser;
    } catch (error) {
      console.error('[Auth] Failed to create guest session:', error);
      // Fallback to local guest if backend fails
      const fallbackGuest = {
        id: null,
        username: 'Goblin',
        avatar_url: '/images/GUEST_img.png',
        email: null,
        role: 'guest',
      };
      setUser(fallbackGuest);
      setIsGuest(true);
      localStorage.setItem('guest_session', 'true');
      return fallbackGuest;
    }
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
      
      // Create a direct axios instance to avoid potential interceptor issues
      const axios = (await import('axios')).default;
      const baseURL = import.meta.env.MODE === 'production' 
        ? (import.meta.env.VITE_API_URL || 'https://api.i-timeline.com')
        : ''; // Use relative URL in development
      
      const response = await axios.get(`${baseURL}/api/v1/auth/me`, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data) {
        const isValidatedGuest = response.data?.is_guest === true 
          || response.data?.user?.role === 'guest'
          || response.data?.user?.is_guest === true
          || !(Number(response.data?.user?.id) > 0);

        const validatedUser = response.data.user ? {
          ...response.data.user,
          is_site_admin: !!response.data.is_site_admin,
          site_admin_role: response.data.site_admin_role || null,
        } : (isValidatedGuest ? {
          id: null,
          username: 'Goblin',
          display_username: 'Goblin',
          avatar_url: '/images/GUEST_img.png',
          email: null,
          role: 'guest',
          is_guest: true,
        } : null);

        if (!validatedUser && !isValidatedGuest) {
          setUser(null);
          setIsGuest(false);
          return false;
        }

        console.log('User validation successful:', validatedUser);
        localStorage.setItem('user', JSON.stringify(validatedUser));
        setUser(validatedUser);
        setIsGuest(isValidatedGuest);

        if (isValidatedGuest) {
          // If we have a stored access token, the user was previously logged in.
          // Try refreshing before accepting the guest fallback.
          const storedToken = localStorage.getItem('access_token');
          if (storedToken) {
            const refreshed = await refreshAccessToken();
            if (refreshed) {
              // Retry session validation with the fresh token (once only)
              try {
                const retryResponse = await axios.get(`${baseURL}/api/v1/auth/me`, {
                  withCredentials: true,
                  headers: { 'Content-Type': 'application/json' }
                });
                if (retryResponse.data?.user && Number(retryResponse.data.user?.id) > 0) {
                  const retryUser = {
                    ...retryResponse.data.user,
                    is_site_admin: !!retryResponse.data.is_site_admin,
                    site_admin_role: retryResponse.data.site_admin_role || null,
                  };
                  localStorage.setItem('user', JSON.stringify(retryUser));
                  setUser(retryUser);
                  setIsGuest(false);
                  localStorage.removeItem('guest_session');
                  return true;
                }
              } catch (_retryErr) {
                // refresh succeeded but /me still failed — fall through to guest
              }
            }
            // Refresh failed — clear stale token so we don't retry forever
            localStorage.removeItem('access_token');
          }
          localStorage.setItem('guest_session', 'true');
          return true;
        }

        localStorage.removeItem('guest_session');
        
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
          const axios = (await import('axios')).default;
          const baseURL = import.meta.env.MODE === 'production' 
            ? (import.meta.env.VITE_API_URL || 'https://api.i-timeline.com')
            : ''; // Use relative URL in development
          
          const finalResponse = await axios.get(`${baseURL}/api/v1/auth/me`, {
            withCredentials: true,
            headers: {
              'Content-Type': 'application/json'
            }
          });
          
          if (finalResponse.data?.user) {
            const userData = {
              ...finalResponse.data.user,
              avatar_url: finalResponse.data.user.avatar_url || finalResponse.data.user.avatar,
              is_site_admin: !!finalResponse.data.is_site_admin,
              site_admin_role: finalResponse.data.site_admin_role || null,
            };
            
            // Store user data in localStorage for API functions to access
            localStorage.setItem('user', JSON.stringify(userData));
            
            setUser(prevUser => ({
              ...prevUser,
              ...userData
            }));
            setIsGuest(false);
            localStorage.removeItem('guest_session');
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
      await logout();
      return false;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Function to check and restore session
    const checkAndRestoreSession = async () => {
      try {
        const hasSession = await fetchCurrentUser();
        if (hasSession) {
          return;
        }

        // No valid real tokens — check for a persisted guest session
        // Skip guest rehydration if we're on the login or register pages to avoid confusion
        const guestSession = localStorage.getItem('guest_session');
        const isAuthPage = ['/login', '/register'].includes(window.location.pathname);
        
        if (guestSession === 'true' && !isAuthPage) {
          console.log('[Auth] Rehydrating guest session with fresh token');
          await loginAsGuest();
          return;
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

    // Safety net: if auth init is still pending after 4 seconds (e.g. browser
    // throttled timers while the tab was backgrounded), force loading=false so
    // the UI is never permanently stuck in a non-interactive state.
    const safetyTimeout = setTimeout(() => {
      setLoading((prev) => {
        if (prev) {
          console.warn('[Auth] Safety timeout reached — forcing loading=false to unblock UI');
        }
        return false;
      });
    }, 4000);
    
    return () => {
      clearTimeout(initializeAuth);
      clearTimeout(safetyTimeout);
    };
  }, []);

  // Re-validate session when the tab comes back into focus after being
  // backgrounded (e.g. phone screen locked/unlocked). This is the general
  // fix for the "idle page" login failure — the auth state may have become
  // stale while the browser throttled timers and network activity.
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState !== 'visible') return;
      // Only re-validate for real (non-guest) logged-in users
      const storedUser = (() => {
        try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; }
      })();
      const isGuestStored = localStorage.getItem('guest_session') === 'true';
      if (!storedUser || isGuestStored) return;

      try {
        console.log('[Auth] Tab became visible — silently re-validating session');
        await fetchCurrentUser();
      } catch (err) {
        console.warn('[Auth] Silent re-validation on visibility change failed:', err);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
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
    isGuest,
    login,
    logout,
    loginAsGuest,
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
