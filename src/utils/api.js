import axios from 'axios';
import config from '../config';
import { setCookie, getCookie, deleteCookie } from './cookies';

// For debugging purposes
console.log('API Config:', {
  baseURL: config.API_URL,
  environment: import.meta.env.MODE
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

// Community timeline API functions

/**
 * Fetch members of a community timeline
 * @param {number} timelineId - The ID of the timeline
 * @param {number} page - Page number for pagination (optional)
 * @param {number} limit - Number of members per page (optional)
 * @returns {Promise} - Promise resolving to member data
 */
export const getTimelineMembers = async (timelineId, page = 1, limit = 20) => {
  try {
    console.log(`Making request to: ${config.API_URL}/api/v1/timelines/${timelineId}/members`);
    const response = await api.get(`/api/v1/timelines/${timelineId}/members`, {
      params: { page, limit }
    });
    console.log('Timeline members API response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching timeline members:', error);
    if (error.response) {
      console.error('Error response data:', error.response.data);
      console.error('Error response status:', error.response.status);
      console.error('Error response headers:', error.response.headers);
    } else if (error.request) {
      console.error('No response received:', error.request);
    } else {
      console.error('Error setting up request:', error.message);
    }
    throw error;
  }
};

/**
 * Update a member's role in a community timeline
 * @param {number} timelineId - The ID of the timeline
 * @param {number} userId - The ID of the user to update
 * @param {string} role - The new role (admin, moderator, member)
 * @returns {Promise} - Promise resolving to updated member data
 */
export const updateMemberRole = async (timelineId, userId, role) => {
  try {
    const response = await api.put(`/api/v1/timelines/${timelineId}/members/${userId}`, {
      role
    });
    return response.data;
  } catch (error) {
    console.error('Error updating member role:', error);
    throw error;
  }
};

/**
 * Remove a member from a community timeline
 * @param {number} timelineId - The ID of the timeline
 * @param {number} userId - The ID of the user to remove
 * @returns {Promise} - Promise resolving to success message
 */
export const removeMember = async (timelineId, userId) => {
  try {
    const response = await api.delete(`/api/v1/timelines/${timelineId}/members/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Error removing member:', error);
    throw error;
  }
};

/**
 * Get timeline details including name, description, visibility, etc.
 * @param {number} timelineId - The ID of the timeline
 * @returns {Promise} - Promise resolving to timeline data
 */
export const getTimelineDetails = async (timelineId) => {
  try {
    console.log(`[getTimelineDetails] Fetching timeline ${timelineId} from ${api.defaults.baseURL}/api/timeline-v3/${timelineId}`);
    const response = await api.get(`/api/timeline-v3/${timelineId}`);
    console.log(`[getTimelineDetails] Success! Timeline data:`, response.data);
    return response.data;
  } catch (error) {
    console.error(`[getTimelineDetails] Error fetching timeline ${timelineId}:`, error);
    console.error(`[getTimelineDetails] Error response:`, error.response);
    console.error(`[getTimelineDetails] Error request:`, error.request);
    
    // Return a safe default object instead of throwing
    // This prevents the UI from crashing completely
    return {
      id: timelineId,
      name: `Timeline ${timelineId}`,
      description: 'Could not load timeline details',
      timeline_type: 'hashtag',
      visibility: 'public',
      error: true,
      errorMessage: error.message
    };
  }
};

/**
 * Update timeline visibility (public/private)
 * @param {number} timelineId - The ID of the timeline
 * @param {string} visibility - New visibility setting ('public' or 'private')
 * @returns {Promise} - Promise resolving to updated timeline data
 */
export const updateTimelineVisibility = async (timelineId, visibility) => {
  try {
    const response = await api.put(`/api/v1/timelines/${timelineId}/visibility`, { visibility });
    return response.data;
  } catch (error) {
    console.error('Error updating timeline visibility:', error);
    throw error;
  }
};

/**
 * Block a member from a community timeline
 * @param {number} timelineId - The ID of the timeline
 * @param {number} userId - The ID of the user to block
 * @param {string} reason - Optional reason for blocking
 * @returns {Promise} - Promise resolving to success message
 */
export const blockMember = async (timelineId, userId, reason = '') => {
  try {
    // For now, we'll use the remove member endpoint and handle blocking in the frontend
    // In a future update, a dedicated block endpoint should be added to the backend
    const response = await removeMember(timelineId, userId);
    return response;
  } catch (error) {
    console.error('Error blocking member:', error);
    throw error;
  }
};

/**
 * Unblock a member from a community timeline
 * @param {number} timelineId - The ID of the timeline
 * @param {number} userId - The ID of the user to unblock
 * @returns {Promise} - Promise resolving to success message
 */
export const unblockMember = async (timelineId, userId) => {
  try {
    // For now, we'll simulate unblocking by returning a success response
    // In a future update, a dedicated unblock endpoint should be added to the backend
    return { success: true, message: 'Member unblocked successfully' };
  } catch (error) {
    console.error('Error unblocking member:', error);
    throw error;
  }
};

/**
 * Update timeline details (name, description)
 * @param {number} timelineId - The ID of the timeline
 * @param {object} data - Object containing fields to update
 * @returns {Promise} - Promise resolving to updated timeline data
 */
export const updateTimelineDetails = async (timelineId, data) => {
  try {
    const response = await api.put(`/api/timeline-v3/${timelineId}`, data);
    return response.data;
  } catch (error) {
    console.error('Error updating timeline details:', error);
    throw error;
  }
};

/**
 * Request access to join a community timeline (works for both public and private)
 * @param {number} timelineId - The ID of the timeline to request access to
 * @returns {Promise} - Promise resolving to success message or default values on error
 */
export const requestTimelineAccess = async (timelineId) => {
  try {
    console.log(`Requesting access to timeline ${timelineId}`);
    const response = await api.post(`/api/v1/timelines/${timelineId}/access-requests`);
    console.log('Access request response:', response.data);
    return response.data;
  } catch (error) {
    console.error(`Error requesting access to timeline ${timelineId}:`, error);
    // Return a default object instead of throwing to prevent component crashes
    return { success: false, role: null, error: true, message: 'Failed to request access' };
  }
};

/**
 * Check if the current user is a member of a timeline
 * @param {number} timelineId - The ID of the timeline to check
 * @returns {Promise} - Promise resolving to membership status or default values on error
 */
export const checkMembershipStatus = async (timelineId) => {
  try {
    console.log(`Checking membership status for timeline ${timelineId}`);
    const response = await api.get(`/api/v1/timelines/${timelineId}/membership-status`);
    console.log('Membership status response:', response.data);
    return response.data;
  } catch (error) {
    console.error(`Error checking membership status for timeline ${timelineId}:`, error);
    // Return a default object instead of throwing to prevent component crashes
    return { is_member: false, role: null, error: true };
  }
};

export default api;
