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
    const url = `${config.API_URL}/api/v1/timelines/${timelineId}/members`;
    console.log(`[API] Fetching members for timeline ${timelineId} (page ${page}, limit ${limit})`);
    console.log(`[API] Making request to: ${url}`);
    console.log('[API] Current JWT token:', getCookie('access_token') || localStorage.getItem('access_token')); // Log the token for debugging
    
    const response = await api.get(`/api/v1/timelines/${timelineId}/members`, {
      params: { page, limit },
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
    console.log(`[API] Response status: ${response.status}`);
    console.log('[API] Response data type:', typeof response.data);
    console.log('[API] Response data structure:', Array.isArray(response.data) ? 'array' : 'object');
    
    // Log raw response for debugging
    console.log('[API] Raw response data:', JSON.stringify(response.data, null, 2));
    
    // Handle different response structures
    let membersData = [];
    if (response.data && response.data.success !== false && Array.isArray(response.data.members)) {
      // Handle { success: true, members: [...] } format
      membersData = response.data.members;
      console.log(`[API] Found ${membersData.length} members in response.data.members`);
    } else if (Array.isArray(response.data)) {
      // Handle direct array response
      membersData = response.data;
      console.log(`[API] Found ${membersData.length} members in array response`);
    } else if (response.data && Array.isArray(response.data.data)) {
      // Handle { data: [...] } format
      membersData = response.data.data;
      console.log(`[API] Found ${membersData.length} members in response.data.data`);
    } else if (response.data && typeof response.data === 'object') {
      // Try to extract any array we can find in the response
      const possibleArrays = Object.values(response.data).filter(val => Array.isArray(val));
      if (possibleArrays.length > 0) {
        // Use the first array found
        membersData = possibleArrays[0];
        console.log(`[API] Found ${membersData.length} members in response object array property`);
      } else {
        console.warn('[API] No arrays found in response data:', response.data);
      }
    } else {
      console.warn('[API] Unexpected response format or error:', response.data);
      if (retryCount < 2) {
        console.log(`[API] Retrying members request (attempt ${retryCount + 2})`);
        return await getTimelineMembers(timelineId, page, limit, retryCount + 1);
      }
    }
    
    // Log detailed member data for debugging
    if (membersData.length > 0) {
      console.log('[API] First member data sample (before transformation):', membersData[0]);
    } else {
      console.log('[API] No members found in response');
      // Return empty array early if no members found
      return [];
    }
    
    // Transform backend data structure to match frontend expectations
    const transformedMembers = membersData.map(member => {
      // Handle case where member might be null or undefined
      if (!member) {
        console.warn('[API] Skipping null/undefined member in data');
        return null;
      }
      
      // Extract user data from nested user object or use member directly
      const userData = member.user || {};
      
      // Log the member structure for debugging
      console.log('[API] Member structure:', {
        id: member.id,
        user_id: member.user_id,
        userData_id: userData.id,
        role: member.role,
        is_active_member: member.is_active_member
      });
      
      // Determine the best user ID to use
      const userId = member.user_id || userData.id || member.id;
      
      // Determine the best username to use
      const name = userData.username || member.username || member.name || `User ${userId}`;
      
      // Determine avatar URL
      const avatar = userData.avatar_url || member.avatar_url || member.avatar || null;
      
      // Format join date
      let joinDate = 'Unknown';
      const joinedAt = member.joined_at || member.joinDate;
      if (joinedAt) {
        try {
          const date = new Date(joinedAt);
          if (!isNaN(date.getTime())) {
            joinDate = date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
          }
        } catch (e) {
          console.warn('[API] Error parsing join date:', joinedAt, e);
        }
      }
      
      const transformed = {
        userId: userId,
        id: userId,
        memberId: member.id || userId,
        name: name,
        avatar: avatar,
        role: member.role || 'member',
        joinDate: joinDate,
        is_active_member: member.is_active_member !== false // Default to true unless explicitly false
      };
      
      return transformed;
    }).filter(Boolean); // Remove any null entries
    
    // Log transformed data for debugging
    console.log(`[API] Transformed ${transformedMembers.length} members`);
    if (transformedMembers.length > 0) {
      console.log('[API] First transformed member:', transformedMembers[0]);
    }
    
    // Cache the member count in localStorage
    try {
      localStorage.setItem(`timeline_member_count_${timelineId}`, JSON.stringify({
        count: transformedMembers.length,
        timestamp: new Date().toISOString(),
        page,
        limit
      }));
    } catch (storageError) {
      console.warn('[API] Failed to cache member count:', storageError);
    }
    
    return transformedMembers;
    
  } catch (error) {
    console.error('[API] Error fetching timeline members:', error);
    
    if (error.response) {
      // The request was made and the server responded with a status code
      console.error('[API] Error response data:', error.response.data);
      console.error('[API] Error status:', error.response.status);
      console.error('[API] Error headers:', error.response.headers);
      
      // If it's a 401 (Unauthorized), we might need to refresh the token
      if (error.response.status === 401) {
        console.log('[API] Unauthorized - attempting token refresh...');
        try {
          await refreshToken();
          if (retryCount < 2) {
            console.log(`[API] Retrying after token refresh (attempt ${retryCount + 2})`);
            return await getTimelineMembers(timelineId, page, limit, retryCount + 1);
          }
        } catch (refreshError) {
          console.error('[API] Token refresh failed:', refreshError);
        }
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.error('[API] No response received:', error.request);
    } else {
      // Something happened in setting up the request
      console.error('[API] Request setup error:', error.message);
    }
    
    // If we haven't exceeded retry attempts, try again
    if (retryCount < 2 && (!error.response || error.response.status >= 500)) {
      console.log(`[API] Retrying after error (attempt ${retryCount + 2})`);
      return await getTimelineMembers(timelineId, page, limit, retryCount + 1);
    }
    
    // Return empty array instead of throwing to prevent component crashes
    console.warn('[API] Returning empty members array after all retry attempts');
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
    console.log(`[API] Removing user ${userId} from timeline ${timelineId}`);
    console.log(`[API] Making DELETE request to: ${config.API_URL}/api/v1/timelines/${timelineId}/members/${userId}`);
    console.log('[API] Current JWT token:', getCookie('access_token') || localStorage.getItem('access_token'));
    
    const response = await api.delete(`/api/v1/timelines/${timelineId}/members/${userId}`);
    console.log(`[API] Remove member response:`, response.data);
    return response.data;
  } catch (error) {
    console.error('[API] Error in removeMember:', error.response || error);
    console.error('Error details:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Get blocked members for a community timeline
 * @param {number} timelineId - The ID of the timeline
 * @returns {Promise} - Promise resolving to blocked members data
 */
export const getBlockedMembers = async (timelineId) => {
  try {
    console.log(`Fetching blocked members for timeline ${timelineId}`);
    const response = await api.get(`/api/v1/timelines/${timelineId}/blocked-members`);
    console.log('Blocked members response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching blocked members:', error);
    console.error('Error details:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Get pending membership requests for a community timeline
 * @param {number} timelineId - The ID of the timeline
 * @returns {Promise} - Promise resolving to pending members data
 */
export const getPendingMembers = async (timelineId) => {
  try {
    console.log(`Fetching pending members for timeline ${timelineId}`);
    const response = await api.get(`/api/v1/timelines/${timelineId}/pending-members`);
    console.log('Pending members response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching pending members:', error);
    console.error('Error details:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Get reported posts for a community timeline
 * @param {number} timelineId - The ID of the timeline
 * @returns {Promise} - Promise resolving to reported posts data
 */
export const getReportedPosts = async (timelineId) => {
  try {
    console.log(`Fetching reported posts for timeline ${timelineId}`);
    const response = await api.get(`/api/v1/timelines/${timelineId}/reported-posts`);
    console.log('Reported posts response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching reported posts:', error);
    console.error('Error details:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * PHASE 0 standardization: Reports endpoints (frontend utilities only)
 * Target canonical paths (per GOALPLAN):
 *  - GET    /api/v1/timelines/{timeline_id}/reports?status=&page=&page_size=
 *  - POST   /api/v1/timelines/{timeline_id}/reports/{report_id}/accept
 *  - POST   /api/v1/timelines/{timeline_id}/reports/{report_id}/resolve  body: { action: 'delete' | 'safeguard' }
 *  - POST   /api/v1/timelines/{timeline_id}/reports/{report_id}/assign   body: { moderator_id }
 * Notes:
 *  - These utilities intentionally do not change any UI behavior yet.
 *  - Backend may initially return no-op/placeholder responses until wired.
 *  - getReportedPosts above is legacy (reported-posts); callers should migrate to listReports.
 */

/**
 * List reported posts for a timeline with optional filters/paging
 * @param {number} timelineId
 * @param {{status?: 'pending'|'reviewing'|'resolved'|'all', page?: number, page_size?: number}} params
 */
export const listReports = async (timelineId, params = {}) => {
  try {
    const query = {
      ...(params.status && params.status !== 'all' ? { status: params.status } : {}),
      ...(typeof params.page === 'number' ? { page: params.page } : {}),
      ...(typeof params.page_size === 'number' ? { page_size: params.page_size } : {}),
    };
    console.log(`[API] Listing reports for timeline ${timelineId}`, query);
    const response = await api.get(`/api/v1/timelines/${timelineId}/reports`, { params: query });
    console.log('[API] listReports response:', response.data);
    return response.data;
  } catch (error) {
    console.error('[API] Error listing reports:', error);
    throw error;
  }
};

/**
 * Accept a report for review (transitions status -> reviewing and assigns current user server-side)
 * @param {number} timelineId
 * @param {number|string} reportId
 */
export const acceptReport = async (timelineId, reportId) => {
  try {
    console.log(`[API] Accepting report ${reportId} on timeline ${timelineId}`);
    const response = await api.post(`/api/v1/timelines/${timelineId}/reports/${reportId}/accept`);
    console.log('[API] acceptReport response:', response.data);
    return response.data;
  } catch (error) {
    console.error('[API] Error accepting report:', error);
    throw error;
  }
};

/**
 * Resolve a report by taking an action.
 * Supports:
 *  - action 'delete' | 'safeguard' (no verdict required)
 *  - action 'remove' (timeline-only removal) requires a non-empty verdict string
 * Backwards compatible with previous signature resolveReport(timelineId, reportId, action).
 * @param {number} timelineId
 * @param {number|string} reportId
 * @param {'delete'|'safeguard'|'remove'} action
 * @param {string} [verdict] - required when action === 'remove'
 */
export const resolveReport = async (timelineId, reportId, action, verdict = '') => {
  try {
    const allowed = ['delete', 'safeguard', 'remove'];
    if (!allowed.includes(action)) {
      throw new Error(`Invalid resolve action: ${action}`);
    }
    // Verdict is required for all resolve actions (delete, safeguard, remove)
    if (!verdict || !String(verdict).trim()) {
      throw new Error('A non-empty verdict is required');
    }
    const payload = { 
      action,
      verdict: verdict.trim()
    };
    console.log(`[API] Resolving report ${reportId} on timeline ${timelineId} with action '${action}'`);
    const response = await api.post(`/api/v1/timelines/${timelineId}/reports/${reportId}/resolve`, payload);
    console.log('[API] resolveReport response:', response.data);
    return response.data;
  } catch (error) {
    console.error('[API] Error resolving report:', error);
    throw error;
  }
};

/**
 * Assign a report to a moderator (optional flow)
 * @param {number} timelineId
 * @param {number|string} reportId
 * @param {number} moderatorId
 */
export const assignReport = async (timelineId, reportId, moderatorId) => {
  try {
    console.log(`[API] Assigning report ${reportId} on timeline ${timelineId} to moderator ${moderatorId}`);
    const response = await api.post(`/api/v1/timelines/${timelineId}/reports/${reportId}/assign`, { moderator_id: moderatorId });
    console.log('[API] assignReport response:', response.data);
    return response.data;
  } catch (error) {
    console.error('[API] Error assigning report:', error);
    throw error;
  }
};

/**
 * Submit a report for an event/post (Level 1 placeholder-ready)
 * Authentication optional: backend accepts anonymous or authenticated reporters
 * @param {number} timelineId
 * @param {number|string} eventId
 * @param {string} reason
 */
export const submitReport = async (timelineId, eventId, reason = '', category) => {
  try {
    console.log(`[API] Submitting report for event ${eventId} on timeline ${timelineId}`);
    const payload = { event_id: eventId, reason: reason || '' };
    if (category) payload.category = category;
    const response = await api.post(`/api/v1/timelines/${timelineId}/reports`, payload);
    console.log('[API] submitReport response:', response.data);
    return response.data;
  } catch (error) {
    console.error('[API] Error submitting report:', error);
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
 * Look up a user by username.
 * Backend is expected to expose a small lookup endpoint that returns
 * a single user object with at least: { id, username, avatar_url }.
 *
 * NOTE: The exact path `/api/users/lookup` can be adjusted later to
 * match backend implementation without changing callers.
 */
export const getUserByUsername = async (username) => {
  const trimmed = (username || '').trim();
  if (!trimmed) {
    throw new Error('Username is required');
  }

  try {
    console.log(`[API] Looking up user by username: ${trimmed}`);
    const response = await api.get('/api/users/lookup', {
      params: { username: trimmed }
    });

    const data = response?.data;
    if (!data || !data.id || !data.username) {
      console.warn('[API] Username lookup returned unexpected payload:', data);
      throw new Error('User lookup returned invalid data');
    }

    return data;
  } catch (error) {
    if (error?.response?.status === 404) {
      console.warn('[API] Username not found:', trimmed, error?.response?.data);
      throw new Error('User not found');
    }

    console.error('[API] Error looking up user by username:', error);
    const message =
      error?.response?.data?.error ||
      error?.response?.data?.message ||
      error.message ||
      'Failed to look up user';
    throw new Error(message);
  }
};

export const resolvePersonalTimeline = async (username, slug) => {
  const trimmedUsername = (username || '').trim();
  const trimmedSlug = (slug || '').trim();

  if (!trimmedUsername || !trimmedSlug) {
    throw new Error('Username and slug are required');
  }

  try {
    const response = await api.get('/api/v1/personal-timelines/resolve', {
      params: { username: trimmedUsername, slug: trimmedSlug }
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getPersonalTimelineViewers = async (timelineId) => {
  if (!timelineId) {
    throw new Error('timelineId is required');
  }

  try {
    const response = await api.get(`/api/v1/timelines/${timelineId}/viewers`);
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    throw error;
  }
};

export const addPersonalTimelineViewer = async (timelineId, userId) => {
  if (!timelineId || !userId) {
    throw new Error('timelineId and userId are required');
  }

  try {
    const response = await api.post(`/api/v1/timelines/${timelineId}/viewers`, {
      user_id: userId
    });
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    throw error;
  }
};

export const removePersonalTimelineViewer = async (timelineId, userId) => {
  if (!timelineId || !userId) {
    throw new Error('timelineId and userId are required');
  }

  try {
    const response = await api.delete(`/api/v1/timelines/${timelineId}/viewers/${userId}`);
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    throw error;
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
    console.log(`[API] Blocking user ${userId} on timeline ${timelineId}`);
    const response = await api.post(`/api/v1/timelines/${timelineId}/members/${userId}/block`, { reason });
    console.log('[API] Block member response:', response.data);
    return response.data;
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
    console.log(`[API] Unblocking user ${userId} on timeline ${timelineId}`);
    const response = await api.post(`/api/v1/timelines/${timelineId}/members/${userId}/unblock`);
    console.log('[API] Unblock member response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error unblocking member:', error);
    throw error;
  }
};

/**
 * Approve a pending membership request
 * @param {number} timelineId - The ID of the timeline
 * @param {number} userId - The ID of the user to approve
 * @returns {Promise} - Promise resolving to success message
 */
export const approvePendingMember = async (timelineId, userId) => {
  try {
    console.log(`[API] Approving pending member ${userId} for timeline ${timelineId}`);
    const response = await api.post(`/api/v1/timelines/${timelineId}/members/${userId}/approve`);
    console.log('[API] Approve member response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error approving member:', error);
    throw error;
  }
};

/**
 * Deny a pending membership request
 * @param {number} timelineId - The ID of the timeline
 * @param {number} userId - The ID of the user to deny
 * @returns {Promise} - Promise resolving to success message
 */
export const denyPendingMember = async (timelineId, userId) => {
  try {
    console.log(`[API] Denying pending member ${userId} for timeline ${timelineId}`);
    const response = await api.post(`/api/v1/timelines/${timelineId}/members/${userId}/deny`);
    console.log('[API] Deny member response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error denying member:', error);
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
    
    // Check if the user was previously a member but was removed (inactive)
    // This helps us determine if this is a rejoin scenario
    let isRejoin = false;
    try {
      const membershipKey = `timeline_membership_${timelineId}`;
      const existingData = localStorage.getItem(membershipKey);
      if (existingData) {
        const parsedData = JSON.parse(existingData);
        if (parsedData.is_active_member === false) {
          console.log(`User was previously removed from timeline ${timelineId}, this is a rejoin`);
          isRejoin = true;
        }
      }
    } catch (checkError) {
      console.warn('Error checking previous membership status:', checkError);
    }
    
    // Make the actual API call using the access-requests endpoint
    // This endpoint properly checks requires_approval toggle and handles pending status
    // If this is a rejoin, log that information for debugging
    console.log(`Making API call to join timeline ${timelineId}${isRejoin ? ' (rejoin scenario)' : ''}`);
    const response = await api.post(`/api/v1/timelines/${timelineId}/access-requests`);
    console.log('Join timeline response:', response.data);
    
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
      const isPending = result.role === 'pending' || result.status === 'pending';
      
      localStorage.setItem(membershipKey, JSON.stringify({
        is_member: !isPending, // Only true if not pending
        is_active_member: !isPending, // Pending members are not active
        role: result.role,
        timestamp: new Date().toISOString()
      }));
      console.log(`Updated membership status in localStorage for timeline ${timelineId} with role: ${result.role}, pending: ${isPending}`);
    } catch (storageError) {
      console.warn('Failed to update membership status in localStorage:', storageError);
    }
    
    // Note: Passport sync endpoint not implemented yet
    // Membership data is already stored in localStorage above
    console.log('Membership data stored successfully');
    
    return result;
  } catch (error) {
    console.error(`Error requesting access to timeline ${timelineId}:`, error);
    console.error('Error details:', error.response?.data || error.message);
    
    // If we haven't exceeded retry attempts and it's a network error, try again
    if (retryCount < 2 && (!error.response || error.response.status >= 500)) {
      console.log(`Retrying access request after error for timeline ${timelineId} (attempt ${retryCount + 2})`);
      return await requestTimelineAccess(timelineId, retryCount + 1);
    }
    
    // Return error object so the UI can handle it properly
    return { 
      error: true,
      message: error.response?.data?.message || error.message || 'Failed to join timeline',
      status: 'error'
    };
  }
};

/**
 * Leave a community timeline (self-removal)
 * @param {number} timelineId - The ID of the timeline to leave
 * @returns {Promise} - Promise resolving to success message
 */
export const leaveCommunity = async (timelineId) => {
  try {
    console.log(`Leaving community timeline ${timelineId}`);
    const response = await api.delete(`/api/v1/timelines/${timelineId}/leave`);
    console.log('Leave community response:', response.data);
    
    // Clear membership cache
    try {
      const membershipKey = `timeline_membership_${timelineId}`;
      localStorage.removeItem(membershipKey);
      console.log(`Cleared membership cache for timeline ${timelineId}`);
    } catch (storageError) {
      console.warn('Failed to clear membership cache:', storageError);
    }
    
    return response.data;
  } catch (error) {
    console.error(`Error leaving community timeline ${timelineId}:`, error);
    
    // Return error details for UI handling
    if (error.response?.data?.error) {
      throw new Error(error.response.data.error);
    }
    
    throw new Error('Failed to leave community. Please try again.');
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
          is_active_member: true,
          role: 'SiteOwner',
          timeline_visibility: 'public' // Default visibility
        };
      }

      // Check if user is the creator of this timeline
      const timelineData = await getTimelineDetails(timelineId);
      if (timelineData && timelineData.created_by === userId) {
        console.log(`User ${userId} is creator of timeline ${timelineId}, forcing is_member to true`);
        return {
          is_member: true,
          is_active_member: true,
          role: 'admin',
          timeline_visibility: timelineData.visibility || 'public',
          is_creator: true
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
              // Ensure is_blocked is present in cached returns (backward compatible)
              const cached = { ...parsedData, is_blocked: !!parsedData.is_blocked };
              // If blocked is true, do not consider them a member
              if (cached.is_blocked === true) {
                cached.is_member = false;
                cached.is_active_member = false;
              }
              return cached;
            }
          }
        } catch (e) {
          console.warn('Error reading from localStorage:', e);
        }
      }

      // Make API call to check membership status using NEW CLEAN ENDPOINT
      console.log(`Checking membership status for timeline ${timelineId} (attempt ${retryCount + 1})`);
      const response = await api.get(`/api/v1/membership/timelines/${timelineId}/status`);
      
      // Process the response to ensure is_member reflects is_active_member status
      const processedResponse = {
        ...response.data,
        // Preserve explicit blocked flag if provided by API
        is_blocked: response.data.is_blocked === true,
      };
      // Only consider the user a member if active and not blocked
      processedResponse.is_member = (response.data.is_active_member !== false) && (response.data.is_member === true) && (processedResponse.is_blocked !== true);
      
      console.log(`Membership status response for timeline ${timelineId}:`, processedResponse);
      
      // Store the result in localStorage for future use
      try {
        const membershipKey = `timeline_membership_${timelineId}`;
        localStorage.setItem(membershipKey, JSON.stringify({
          ...processedResponse,
          // Ensure is_blocked is stored for future cached reads
          is_blocked: processedResponse.is_blocked === true,
          timestamp: new Date().toISOString()
        }));
        console.log(`Saved membership status to localStorage for timeline ${timelineId}`);
      } catch (e) {
        console.warn('Error writing to localStorage:', e);
      }

      return processedResponse;
    } catch (error) {
      console.error(`Error checking membership status for timeline ${timelineId}:`, error);
      
      // If we haven't exceeded retry attempts and it's a network error, try again
      if (retryCount < 2 && (!error.response || error.response.status >= 500)) {
        return await checkMembershipStatus(timelineId, retryCount + 1, forceRefresh);
      }

      // Return a default object instead of throwing to prevent component crashes
      return { is_member: false, is_active_member: false, role: null };
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
    const preferences = response.data.preferences || {};
    
    try {
      localStorage.setItem(storageKey, JSON.stringify({
        memberships: memberships,
        preferences: preferences,
        last_updated: response.data.last_updated || new Date().toISOString(),
        timestamp: new Date().toISOString()
      }));
      console.log(`Stored passport for user ${userId} in localStorage`);

      // If server sent preferences, hydrate localStorage for clients that read directly
      try {
        if (preferences && typeof preferences === 'object') {
          if (preferences.theme === 'dark' || preferences.theme === 'light') {
            const isDark = preferences.theme === 'dark';
            localStorage.setItem(`theme_pref_user_${userId}`, isDark ? 'true' : 'false');
            // Legacy global for compatibility
            localStorage.setItem('darkMode', isDark ? 'true' : 'false');
          }
          if (typeof preferences.email_blur === 'boolean') {
            // Current EmailBlurContext uses a non-user-scoped key
            localStorage.setItem('emailBlurPreference', preferences.email_blur.toString());
          }
        }
      } catch (e) {
        console.warn('[API] Failed to hydrate local preferences from passport:', e);
      }
      
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
      return { is_member: false, is_active_member: false, role: null };
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
          
          // Ensure is_member reflects is_active_member status
          if (membershipData.is_active_member === false) {
            membershipData.is_member = false;
          }
          
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
      console.log(`Membership active status: ${membership.is_active_member}`);
      
      // Only consider the user a member if they are an active member
      const isMember = membership.is_active_member !== false && membership.is_active_member !== 'false';
      
      // Store this membership data in the direct timeline membership key for future use
      try {
        const membershipData = {
          is_member: isMember,
          is_active_member: membership.is_active_member !== false && membership.is_active_member !== 'false',
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
        is_member: isMember,
        is_active_member: membership.is_active_member !== false && membership.is_active_member !== 'false',
        role: membership.role,
        joined_at: membership.joined_at,
        is_creator: membership.is_creator || false,
        is_site_owner: membership.is_site_owner || false
      };
    } else {
      console.log(`User ${userId} is not a member of timeline ${timelineId} according to passport`);
      return {
        is_member: false,
        is_active_member: false,
        role: null
      };
    }
  } catch (error) {
    console.error(`Error checking membership from passport for timeline ${timelineId}:`, error);
    
    // Fall back to the direct API check
    return checkMembershipStatus(timelineId);
  }
};

// =============================================================================
// TIMELINE QUOTE API FUNCTIONS
// =============================================================================

/**
 * Get the custom quote for a timeline
 * @param {string|number} timelineId - Timeline ID
 * @returns {Promise<Object>} - Promise resolving to quote data
 */
export const getTimelineQuote = async (timelineId) => {
  try {
    const response = await api.get(`/api/v1/timelines/${timelineId}/quote`);
    return {
      success: true,
      quote: response.data.quote
    };
  } catch (error) {
    console.error('Error fetching timeline quote:', error);
    // Return default quote on error
    return {
      success: false,
      quote: {
        text: "Those who make Peaceful Revolution impossible, will make violent Revolution inevitable.",
        author: "John F. Kennedy",
        is_custom: false
      },
      error: error.response?.data?.error || 'Failed to fetch quote'
    };
  }
};

/**
 * Update the custom quote for a timeline
 * @param {string|number} timelineId - Timeline ID
 * @param {Object} quoteData - Quote data {text, author}
 * @returns {Promise<Object>} - Promise resolving to updated quote data
 */
export const updateTimelineQuote = async (timelineId, quoteData) => {
  try {
    const response = await api.put(`/api/v1/timelines/${timelineId}/quote`, {
      text: quoteData.text || '',
      author: quoteData.author || ''
    });
    return {
      success: true,
      quote: response.data.quote,
      message: response.data.message
    };
  } catch (error) {
    console.error('Error updating timeline quote:', error);
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to update quote'
    };
  }
};

// =============================================================================
// TIMELINE ACTION CARDS API FUNCTIONS
// =============================================================================

/**
 * Get all action cards for a timeline
 * @param {string|number} timelineId - Timeline ID
 * @returns {Promise<Object>} - Promise resolving to action cards data
 */
export const getTimelineActions = async (timelineId) => {
  try {
    const response = await api.get(`/api/v1/timelines/${timelineId}/actions`);
    
    if (response.data) {
      return {
        success: true,
        actions: response.data.actions || [],
        total: response.data.total || 0,
        timeline_id: response.data.timeline_id
      };
    }
    
    return { success: false, actions: [], total: 0 };
  } catch (error) {
    console.error(`[API] Error getting timeline actions for ${timelineId}:`, error);
    return { success: false, actions: [], total: 0, error: error.message };
  }
};

/**
 * Get a specific action card by type (bronze/silver/gold)
 * @param {string|number} timelineId - Timeline ID
 * @param {string} actionType - Action type ('bronze', 'silver', 'gold')
 * @returns {Promise<Object>} - Promise resolving to action card data
 */
export const getTimelineActionByType = async (timelineId, actionType) => {
  try {
    console.log(`[API] Getting ${actionType} action for timeline ${timelineId}`);
    
    const response = await api.get(`/api/v1/timelines/${timelineId}/actions/${actionType}`);
    
    if (response.data) {
      return {
        success: true,
        action: response.data.action,
        message: response.data.message
      };
    }
    
    return { success: false, action: null };
  } catch (error) {
    console.error(`[API] Error getting ${actionType} action for timeline ${timelineId}:`, error);
    return { success: false, action: null, error: error.message };
  }
};

/**
 * Create or update an action card for a timeline
 * @param {string|number} timelineId - Timeline ID
 * @param {Object} actionData - Action card data
 * @returns {Promise<Object>} - Promise resolving to created/updated action
 */
export const createTimelineAction = async (timelineId, actionData) => {
  try {
    console.log(`[API] Creating/updating ${actionData.action_type} action for timeline ${timelineId}`);
    
    const response = await api.post(`/api/v1/timelines/${timelineId}/actions`, actionData);
    
    if (response.data) {
      console.log(`[API] Successfully created/updated action: ${response.data.message}`);
      return {
        success: true,
        action: response.data.action,
        message: response.data.message
      };
    }
    
    return { success: false, error: 'No response data' };
  } catch (error) {
    console.error(`[API] Error creating timeline action:`, error);
    return { 
      success: false, 
      error: error.response?.data?.error || error.message 
    };
  }
};

/**
 * Update a specific action card
 * @param {string|number} timelineId - Timeline ID
 * @param {string|number} actionId - Action ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} - Promise resolving to updated action
 */
export const updateTimelineAction = async (timelineId, actionId, updateData) => {
  try {
    console.log(`[API] Updating action ${actionId} for timeline ${timelineId}`);
    
    const response = await api.put(`/api/v1/timelines/${timelineId}/actions/${actionId}`, updateData);
    
    if (response.data) {
      console.log(`[API] Successfully updated action: ${response.data.message}`);
      return {
        success: true,
        action: response.data.action,
        message: response.data.message
      };
    }
    
    return { success: false, error: 'No response data' };
  } catch (error) {
    console.error(`[API] Error updating timeline action:`, error);
    return { 
      success: false, 
      error: error.response?.data?.error || error.message 
    };
  }
};

/**
 * Delete an action card
 * @param {string|number} timelineId - Timeline ID
 * @param {string|number} actionId - Action ID
 * @returns {Promise<Object>} - Promise resolving to deletion result
 */
export const deleteTimelineAction = async (timelineId, actionId) => {
  try {
    console.log(`[API] Deleting action ${actionId} for timeline ${timelineId}`);
    
    const response = await api.delete(`/api/v1/timelines/${timelineId}/actions/${actionId}`);
    
    if (response.data) {
      console.log(`[API] Successfully deleted action: ${response.data.message}`);
      return {
        success: true,
        message: response.data.message
      };
    }
    
    return { success: false, error: 'No response data' };
  } catch (error) {
    console.error(`[API] Error deleting timeline action:`, error);
    return { 
      success: false, 
      error: error.response?.data?.error || error.message 
    };
  }
};

/**
 * Save all action cards for a timeline (batch operation)
 * @param {string|number} timelineId - Timeline ID
 * @param {Object} actionsData - Object containing bronze, silver, gold action data
 * @returns {Promise<Object>} - Promise resolving to save results
 */
export const saveTimelineActions = async (timelineId, actionsData) => {
  try {
    console.log(`[API] Saving all action cards for timeline ${timelineId}`);
    
    const results = {
      success: true,
      saved: [],
      errors: []
    };
    
    // Save each action type if provided (including cleared/inactive ones)
    for (const actionType of ['bronze', 'silver', 'gold']) {
      if (actionsData[actionType]) {
        const actionData = {
          action_type: actionType,
          title: actionsData[actionType].title || '',
          description: actionsData[actionType].description || '',
          due_date: actionsData[actionType].due_date || null,
          threshold_type: actionsData[actionType].threshold_type || 'members',
          threshold_value: actionsData[actionType].threshold_value || 0,
          is_active: actionsData[actionType].is_active !== false
        };
        
        const result = await createTimelineAction(timelineId, actionData);
        
        if (result.success) {
          results.saved.push({ type: actionType, action: result.action });
        } else {
          results.errors.push({ type: actionType, error: result.error });
          results.success = false;
        }
      }
    }
    
    console.log(`[API] Batch save completed: ${results.saved.length} saved, ${results.errors.length} errors`);
    return results;
  } catch (error) {
    console.error(`[API] Error in batch save timeline actions:`, error);
    return { 
      success: false, 
      saved: [],
      errors: [{ error: error.message }]
    };
  }
};

/**
 * Update user preferences on the server via Passport
 * Allowed fields: { theme: 'dark'|'light', email_blur: boolean }
 * @param {object} prefs
 * @returns {Promise<object>} Server response with merged preferences
 */
export const updateUserPreferences = async (prefs = {}) => {
  try {
    const payload = {};
    if (prefs.theme === 'dark' || prefs.theme === 'light') {
      payload.theme = prefs.theme;
    }
    if (typeof prefs.email_blur === 'boolean') {
      payload.email_blur = prefs.email_blur;
    }
    if (Object.keys(payload).length === 0) {
      return { message: 'No valid preference fields provided' };
    }
    const response = await api.put('/api/v1/user/preferences', payload);
    return response.data;
  } catch (error) {
    console.error('[API] Failed to update user preferences:', error.response?.data || error.message);
    throw error;
  }
};

export default api;
