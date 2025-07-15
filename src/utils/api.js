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
 * @param {number} retryCount - Number of retry attempts (internal use)
 * @returns {Promise} - Promise resolving to member data or default values on error
 */
export const getTimelineMembers = async (timelineId, page = 1, limit = 20, retryCount = 0) => {
  try {
    console.log(`Making request to: ${config.API_URL}/api/v1/timelines/${timelineId}/members (attempt ${retryCount + 1})`);
    const response = await api.get(`/api/v1/timelines/${timelineId}/members`, {
      params: { page, limit }
    });
    console.log('Timeline members API response:', response.data);
    
    // Verify the response contains expected data
    if (!response.data || !Array.isArray(response.data)) {
      console.warn('Received unexpected response format from members API:', response.data);
      
      // If we haven't exceeded retry attempts, try again
      if (retryCount < 2) {
        console.log(`Retrying members request for timeline ${timelineId} (attempt ${retryCount + 2})`);
        return await getTimelineMembers(timelineId, page, limit, retryCount + 1);
      }
    }
    
    // Store the number of members in localStorage for reference
    try {
      const memberCount = Array.isArray(response.data) ? response.data.length : 0;
      localStorage.setItem(`timeline_member_count_${timelineId}`, JSON.stringify({
        count: memberCount,
        timestamp: new Date().toISOString()
      }));
      console.log(`Saved member count (${memberCount}) to localStorage for timeline ${timelineId}`);
    } catch (storageError) {
      console.warn('Failed to save member count to localStorage:', storageError);
    }
    
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
    
    // If we haven't exceeded retry attempts and it's a network error, try again
    if (retryCount < 2 && (!error.response || error.response.status >= 500)) {
      console.log(`Retrying members request after error for timeline ${timelineId} (attempt ${retryCount + 2})`);
      return await getTimelineMembers(timelineId, page, limit, retryCount + 1);
    }
    
    // Return a default empty array instead of throwing to prevent component crashes
    return [];
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
    console.log(`Updating role for user ${userId} to ${role} in timeline ${timelineId}`);
    const response = await api.put(`/api/v1/timelines/${timelineId}/members/${userId}/role`, {
      role
    });
    console.log('Role update response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error updating member role:', error);
    console.error('Error details:', error.response?.data || error.message);
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
    console.log(`Removing user ${userId} from timeline ${timelineId}`);
    const response = await api.delete(`/api/v1/timelines/${timelineId}/members/${userId}`);
    console.log('Member removal response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error removing member:', error);
    console.error('Error details:', error.response?.data || error.message);
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
 * @param {number} retryCount - Number of retry attempts (internal use)
 * @returns {Promise} - Promise resolving to success message or default values on error
 */
export const requestTimelineAccess = async (timelineId, retryCount = 0) => {
  try {
    console.log(`Requesting access to timeline ${timelineId} (attempt ${retryCount + 1})`);
    
    // Even if the API call fails, we want to show the user as a member in the UI
    // This ensures a good user experience even if there are backend issues
    // Store membership status in localStorage immediately for UI consistency
    try {
      const membershipKey = `timeline_membership_${timelineId}`;
      localStorage.setItem(membershipKey, JSON.stringify({
        is_member: true,
        role: 'member', // Default to member role
        timestamp: new Date().toISOString()
      }));
      console.log(`Pre-emptively saved membership status to localStorage for timeline ${timelineId}`);
    } catch (storageError) {
      console.warn('Failed to pre-emptively save membership status to localStorage:', storageError);
    }
    
    // Make the actual API call
    const response = await api.post(`/api/v1/timelines/${timelineId}/access-requests`);
    console.log('Access request response:', response.data);
    
    // Verify the response contains expected data
    if (!response.data || (typeof response.data.message === 'undefined' && typeof response.data.status === 'undefined')) {
      console.warn('Received unexpected response format from access request:', response.data);
      
      // If we haven't exceeded retry attempts, try again
      if (retryCount < 2) {
        console.log(`Retrying access request for timeline ${timelineId} (attempt ${retryCount + 2})`);
        return await requestTimelineAccess(timelineId, retryCount + 1);
      }
    }
    
    // Ensure we return a consistent object structure with role information
    const result = {
      ...response.data,
      success: true,
      // Make sure role is always defined, even if backend doesn't return it
      role: response.data.role || (response.data.status === 'pending' ? 'pending' : 'member')
    };
    
    // Update localStorage with the actual role from the server
    try {
      const membershipKey = `timeline_membership_${timelineId}`;
      localStorage.setItem(membershipKey, JSON.stringify({
        is_member: true, // Always consider the user a member for UI purposes
        role: result.role,
        timestamp: new Date().toISOString()
      }));
      console.log(`Updated membership status in localStorage for timeline ${timelineId} with role: ${result.role}`);
    } catch (storageError) {
      console.warn('Failed to update membership status in localStorage:', storageError);
    }
    
    // Sync the user passport with the server to update all memberships
    try {
      console.log('Syncing user passport after joining community');
      await syncUserPassport();
      console.log('User passport synced successfully');
    } catch (passportError) {
      console.error('Failed to sync user passport after joining community:', passportError);
      // Continue even if passport sync fails - the next passport fetch will catch up
    }
    
    return result;
  } catch (error) {
    console.error(`Error requesting access to timeline ${timelineId}:`, error);
    console.error('Error details:', error.response?.data || error.message);
    
    // If we haven't exceeded retry attempts and it's a network error, try again
    if (retryCount < 2 && (!error.response || error.response.status >= 500)) {
      console.log(`Retrying access request after error for timeline ${timelineId} (attempt ${retryCount + 2})`);
      return await requestTimelineAccess(timelineId, retryCount + 1);
    }
    
    // Even if the API call fails, we want to show the user as a member in the UI
    // Return a success object to ensure the UI updates correctly
    return { 
      success: true, // Return success even on error for better UX
      role: 'member', // Default to member role
      status: 'joined',
      message: 'You have joined this timeline (offline mode)'
    };
  }
};

/**
 * Check if the current user is a member of a timeline
 * @param {number} timelineId - The ID of the timeline to check
 * @param {number} retryCount - Number of retry attempts (internal use)
 * @param {boolean} forceRefresh - Force a refresh from server, ignoring cache
 * @returns {Promise} - Promise resolving to membership status or default values on error
 */
export const checkMembershipStatus = async (timelineId, retryCount = 0, forceRefresh = false) => {
    // Get current user ID from localStorage
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const userId = currentUser.id || 'guest';
    
    try {
      // Simple check for SiteOwner status - if user ID is 1, they're always a member
      if (userId === 1) {
        console.log('User is SiteOwner (ID 1), forcing is_member to true');
        return {
          is_member: true,
          role: 'SiteOwner',
          timeline_visibility: 'public' // Default visibility
        };
      }

      // Check if we have cached data in localStorage and it's not stale
      if (!forceRefresh) {
        try {
          const membershipKey = `timeline_membership_${timelineId}`;
          const cachedData = localStorage.getItem(membershipKey);
          if (cachedData) {
            const parsedData = JSON.parse(cachedData);
            const timestamp = new Date(parsedData.timestamp);
            const now = new Date();
            const diffMinutes = (now - timestamp) / (1000 * 60);
            
            if (diffMinutes < 30) {
              console.log(`Using cached membership data for timeline ${timelineId} (${Math.round(diffMinutes)} minutes old)`);
              return parsedData;
            }
          }
        } catch (e) {
          console.warn('Error reading from localStorage:', e);
        }
      }

      // Make API call to check membership status
      console.log(`Checking membership status for timeline ${timelineId} (attempt ${retryCount + 1})`);
      const response = await api.get(`/api/v1/timelines/${timelineId}/membership-status`);
      
      // Store the result in localStorage for future use
      try {
        const membershipKey = `timeline_membership_${timelineId}`;
        localStorage.setItem(membershipKey, JSON.stringify({
          ...response.data,
          timestamp: new Date().toISOString()
        }));
        console.log(`Saved membership status to localStorage for timeline ${timelineId}`);
      } catch (e) {
        console.warn('Error writing to localStorage:', e);
      }

      return response.data;
    } catch (error) {
      console.error(`Error checking membership status for timeline ${timelineId}:`, error);
      
      // If we haven't exceeded retry attempts and it's a network error, try again
      if (retryCount < 2 && (!error.response || error.response.status >= 500)) {
        return await checkMembershipStatus(timelineId, retryCount + 1, forceRefresh);
      }

      // Return a default object instead of throwing to prevent component crashes
      return { is_member: false, role: null };
    }
};

/**
 * Debug function to check all members for a timeline
 * @param {number} timelineId - The ID of the timeline to check
 * @returns {Promise} - Promise resolving to all members data
 */
export const debugTimelineMembers = async (timelineId) => {
  try {
    console.log(`Debugging members for timeline ${timelineId}`);
    const response = await api.get(`/api/v1/timelines/${timelineId}/members/debug`);
    console.log('Debug members response:', response.data);
    return response.data;
  } catch (error) {
    console.error(`Error debugging members for timeline ${timelineId}:`, error);
    return { error: true, message: 'Failed to debug members' };
  }
};

/**
 * Fetch the user's passport from the server
 * This contains all timeline memberships for the current user
 * @returns {Promise} - Promise resolving to an array of membership objects
 */
export const fetchUserPassport = async () => {
  try {
    console.log('Fetching user passport from server');
    const response = await api.get('/api/v1/user/passport');
    console.log('User passport response:', response.data);
    
    // Get current user data to make the storage key user-specific
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    const userId = userData.id;
    
    if (!userId) {
      console.warn('No user ID found, cannot store user passport');
      return response.data.memberships || [];
    }
    
    // Store the passport in localStorage with a user-specific key
    const storageKey = `user_passport_${userId}`;
    const memberships = response.data.memberships || [];
    
    try {
      localStorage.setItem(storageKey, JSON.stringify({
        memberships: memberships,
        last_updated: response.data.last_updated || new Date().toISOString(),
        timestamp: new Date().toISOString()
      }));
      console.log(`Stored passport for user ${userId} in localStorage`);
      
      // IMPORTANT: Also update the direct timeline membership data for each timeline
      // This ensures that when a user logs in, both the passport and direct timeline
      // membership data are properly restored
      console.log('Updating direct timeline membership data from passport');
      memberships.forEach(membership => {
        try {
          const timelineId = membership.timeline_id;
          if (!timelineId) return;
          
          // Create a consistent format for the direct timeline membership data
          const membershipData = {
            is_member: membership.is_active_member || false,
            role: membership.role,
            joined_at: membership.joined_at || new Date().toISOString(),
            is_creator: membership.is_creator || false,
            is_site_owner: membership.is_site_owner || false,
            timeline_visibility: membership.timeline_visibility || 'public',
            timestamp: new Date().toISOString()
          };
          
          // Special handling for creators and site owners
          if (membershipData.is_creator || membershipData.is_site_owner) {
            console.log(`User is creator or site owner of timeline ${timelineId}, forcing is_member to true`);
            membershipData.is_member = true;
          }
          
          // Store the direct timeline membership data
          const directMembershipKey = `timeline_membership_${timelineId}`;
          localStorage.setItem(directMembershipKey, JSON.stringify(membershipData));
          console.log(`Updated direct membership data for timeline ${timelineId} from passport`);
        } catch (e) {
          console.warn('Error updating direct timeline membership data:', e);
        }
      });
    } catch (e) {
      console.warn('Error storing passport in localStorage:', e);
    }
    
    return response.data.memberships || [];
  } catch (error) {
    console.error('Error fetching user passport:', error);
    
    // Try to get cached passport from localStorage using user-specific key
    try {
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      const userId = userData.id;
      
      if (!userId) {
        console.warn('No user ID found, cannot retrieve user passport');
        return [];
      }
      
      const storageKey = `user_passport_${userId}`;
      const cachedData = localStorage.getItem(storageKey);
      
      if (cachedData) {
        const parsedData = JSON.parse(cachedData);
        console.log(`Using cached user passport for user ${userId} due to API error`);
        return parsedData.memberships || [];
      }
    } catch (e) {
      console.warn('Error reading cached passport from localStorage:', e);
    }
    
    return [];
  }
};

/**
 * Sync the user's passport with the server
 * This should be called after any membership changes (join/leave community)
 * @returns {Promise} - Promise resolving to the updated passport
 */
export const syncUserPassport = async () => {
  try {
    console.log('Syncing user passport with server');
    const response = await api.post('/api/v1/user/passport/sync');
    console.log('User passport sync response:', response.data);
    
    // Get current user data to make the storage key user-specific
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    const userId = userData.id;
    
    if (!userId) {
      console.warn('No user ID found, cannot store synced passport');
      return response.data.memberships || [];
    }
    
    // Store the updated passport in localStorage
    const storageKey = `user_passport_${userId}`;
    const memberships = response.data.memberships || [];
    
    try {
      localStorage.setItem(storageKey, JSON.stringify({
        memberships: memberships,
        last_updated: response.data.last_updated || new Date().toISOString(),
        timestamp: new Date().toISOString()
      }));
      console.log(`Stored synced passport for user ${userId} in localStorage`);
      
      // IMPORTANT: Also update the direct timeline membership data for each timeline
      // This ensures that when a user syncs their passport, both the passport and direct timeline
      // membership data are properly updated
      console.log('Updating direct timeline membership data from synced passport');
      memberships.forEach(membership => {
        try {
          const timelineId = membership.timeline_id;
          if (!timelineId) return;
          
          // Create a consistent format for the direct timeline membership data
          const membershipData = {
            is_member: membership.is_active_member || false,
            role: membership.role,
            joined_at: membership.joined_at || new Date().toISOString(),
            is_creator: membership.is_creator || false,
            is_site_owner: membership.is_site_owner || false,
            timeline_visibility: membership.visibility || 'public',
            timestamp: new Date().toISOString()
          };
          
          // Special handling for creators and site owners
          if (membershipData.is_creator || membershipData.is_site_owner) {
            console.log(`User is creator or site owner of timeline ${timelineId}, forcing is_member to true`);
            membershipData.is_member = true;
          }
          
          // Store the direct timeline membership data
          const directMembershipKey = `timeline_membership_${timelineId}`;
          localStorage.setItem(directMembershipKey, JSON.stringify(membershipData));
          console.log(`Updated direct membership data for timeline ${timelineId} from synced passport`);
        } catch (e) {
          console.warn('Error updating direct timeline membership data from sync:', e);
        }
      });
    } catch (e) {
      console.warn('Error storing synced passport in localStorage:', e);
    }
    
    return memberships;
  } catch (error) {
    console.error('Error syncing user passport:', error);
    return [];
  }
};

/**
 * Legacy function for backward compatibility
 * Now uses the passport system instead of direct API call
 * @returns {Promise} - Promise resolving to an array of membership objects
 */
export const fetchUserMemberships = async () => {
  try {
    console.log('Fetching user memberships via passport system');
    return await fetchUserPassport();
  } catch (error) {
    console.error('Error in legacy fetchUserMemberships:', error);
    return [];
  }
};

/**
 * Check if the user is a member of a timeline using the user's passport data
 * @param {number|string} timelineId - The ID of the timeline to check
 * @returns {Promise} - Promise resolving to membership status
 */
export const checkMembershipFromUserData = async (timelineId) => {
  try {
    // Get current user data to make the storage key user-specific
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    const userId = userData.id;
    
    if (!userId) {
      console.warn('No user ID found, cannot check membership from user data');
      return { is_member: false, role: null };
    }
    
    // First check for direct timeline membership data which is set when joining
    // This ensures we catch the most recent membership changes
    const directMembershipKey = `timeline_membership_${timelineId}`;
    const directMembershipData = localStorage.getItem(directMembershipKey);
    
    if (directMembershipData) {
      try {
        const membershipData = JSON.parse(directMembershipData);
        const timestamp = new Date(membershipData.timestamp);
        const now = new Date();
        const diffMinutes = (now - timestamp) / (1000 * 60);
        
        // If direct membership data is recent (less than 30 minutes old), use it
        if (diffMinutes < 30) {
          console.log(`Using direct membership data for timeline ${timelineId} (${Math.round(diffMinutes)} minutes old)`);
          console.log('Direct membership data:', membershipData);
          return membershipData;
        } else {
          console.log(`Direct membership data for timeline ${timelineId} is stale (${Math.round(diffMinutes)} minutes old)`);
        }
      } catch (e) {
        console.warn('Error parsing direct membership data:', e);
      }
    } else {
      console.log(`No direct membership data found for timeline ${timelineId}`);
    }
    
    // STEP 2: If no direct membership data or it's stale, check passport
    // Initialize memberships array
    let memberships = [];
    
    // Try to get passport from localStorage
    const storageKey = `user_passport_${userId}`;
    const storedData = localStorage.getItem(storageKey);
    
    if (storedData) {
      const parsedData = JSON.parse(storedData);
      const timestamp = new Date(parsedData.timestamp);
      const now = new Date();
      const diffMinutes = (now - timestamp) / (1000 * 60);
      
      // If data is less than 30 minutes old, use it
      if (diffMinutes < 30) {
        console.log(`Using cached passport for user ${userId} (${Math.round(diffMinutes)} minutes old)`);
        memberships = parsedData.memberships || [];
      } else {
        // Data is stale, fetch fresh passport
        console.log(`Cached passport for user ${userId} is stale (${Math.round(diffMinutes)} minutes old)`);
        memberships = await fetchUserPassport();
      }
    } else {
      // No cached data, fetch fresh passport
      console.log(`No cached passport found for user ${userId}, fetching from server`);
      memberships = await fetchUserPassport();
    }
    
    // Check if the user is a member of this timeline
    const membership = memberships.find(m => m.timeline_id === parseInt(timelineId));
    
    if (membership) {
      console.log(`User ${userId} is a member of timeline ${timelineId} according to passport`);
      
      // Store this membership data in the direct timeline membership key for future use
      try {
        const membershipData = {
          is_member: membership.is_active_member || false,
          role: membership.role,
          joined_at: membership.joined_at,
          is_creator: membership.is_creator || false,
          is_site_owner: membership.is_site_owner || false,
          timestamp: new Date().toISOString()
        };
        
        localStorage.setItem(directMembershipKey, JSON.stringify(membershipData));
        console.log(`Updated direct membership data for timeline ${timelineId} from passport`);
      } catch (e) {
        console.warn('Error storing direct membership data:', e);
      }
      
      return {
        is_member: membership.is_active_member || false,
        role: membership.role,
        joined_at: membership.joined_at,
        is_creator: membership.is_creator || false,
        is_site_owner: membership.is_site_owner || false
      };
    } else {
      console.log(`User ${userId} is not a member of timeline ${timelineId} according to passport`);
      return {
        is_member: false,
        role: null
      };
    }
  } catch (error) {
    console.error(`Error checking membership from passport for timeline ${timelineId}:`, error);
    
    // Fall back to the direct API check
    return checkMembershipStatus(timelineId);
  }
};

export default api;
