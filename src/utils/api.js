import axios from 'axios';
import config from '../config';
import { setCookie, getCookie, deleteCookie } from './cookies';

// For debugging purposes
console.log('API Config:', {
  baseURL: config.API_URL,
  environment: process.env.NODE_ENV
});

const api = axios.create({
  baseURL: config.API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor
api.interceptors.request.use(
  (config) => {
    // For all requests except login and register, add the access token
    if (!config.url.includes('/auth/login') && !config.url.includes('/auth/register')) {
      // Try to get token from both cookie and localStorage for backward compatibility
      const token = getCookie('access_token') || localStorage.getItem('access_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log(`Adding auth token to ${config.url} request`);
      } else {
        console.warn(`No access token available for ${config.url} request`);
      }
    }
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Check if this is an authentication error
    if (error.response?.status === 401 && !originalRequest._retry) {
      console.log('Received 401 error, attempting token refresh...');
      originalRequest._retry = true;

      try {
        // Try to refresh the token - check both cookie and localStorage
        const refreshToken = getCookie('refresh_token') || localStorage.getItem('refresh_token');
        if (!refreshToken) {
          console.error('No refresh token available in cookies or localStorage');
          throw new Error('No refresh token available');
        }

        console.log('Attempting to refresh token...');
        
        // Use the same API instance to avoid circular dependencies
        // But bypass the interceptors to prevent infinite loops
        const instance = axios.create({
          baseURL: config.API_URL,
          headers: { 'Content-Type': 'application/json' }
        });
        
        // Send the refresh token in the request body to match the AuthContext approach
        const response = await instance.post('/api/auth/refresh', { refresh_token: refreshToken }, {
          headers: {
            'Content-Type': 'application/json'
          }
        });

        // Check if we got a valid response with an access token
        if (!response.data || !response.data.access_token) {
          console.error('Invalid response from refresh endpoint:', response.data);
          throw new Error('No access token received from refresh endpoint');
        }
        
        const { access_token, refresh_token } = response.data;
        
        console.log('Token refresh successful, storing new tokens');
        // Store in both cookies and localStorage for maximum compatibility
        setCookie('access_token', access_token, 7); // 7 days expiry
        localStorage.setItem('access_token', access_token);
        
        // If we also got a new refresh token, store it
        if (refresh_token) {
          setCookie('refresh_token', refresh_token, 30); // 30 days expiry
          localStorage.setItem('refresh_token', refresh_token);
        }

        // Retry the original request with the new token
        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        return api(originalRequest);
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        
        // Only clear tokens if there was an actual authentication error
        // Don't clear for network errors which might be temporary
        if (refreshError.response?.status >= 400) {
          console.warn('Clearing auth tokens due to authentication failure');
          // Clear both cookies and localStorage
          deleteCookie('access_token');
          deleteCookie('refresh_token');
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          
          // Only redirect to login for user-initiated requests, not background requests
          const isBackgroundRequest = [
            '/api/health-check',
            '/api/auth/validate'
          ].some(path => originalRequest.url.includes(path));
          
          if (!isBackgroundRequest) {
            console.log('Redirecting to login page due to authentication failure');
            window.location.href = '/login';
          }
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
