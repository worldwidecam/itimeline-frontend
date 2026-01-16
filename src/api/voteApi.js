/**
 * Vote API utilities for managing event votes
 */

const API_BASE = 'http://localhost:5000/api/v1';

/**
 * Cast or update a vote on an event
 * @param {number} eventId - The event ID to vote on
 * @param {string} voteType - 'promote' or 'demote'
 * @param {string} token - JWT token for authentication
 * @returns {Promise} Vote stats response
 */
export const castVote = async (eventId, voteType, token) => {
  try {
    const response = await fetch(`${API_BASE}/events/${eventId}/vote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ vote_type: voteType })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to cast vote');
    }

    return await response.json();
  } catch (error) {
    console.error('Error casting vote:', error);
    throw error;
  }
};

/**
 * Get vote statistics for an event
 * @param {number} eventId - The event ID
 * @param {string} token - JWT token for authentication (optional)
 * @returns {Promise} Vote stats response
 */
export const getVoteStats = async (eventId, token = null) => {
  try {
    const headers = {
      'Content-Type': 'application/json'
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}/events/${eventId}/votes`, {
      method: 'GET',
      headers
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get vote stats');
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting vote stats:', error);
    throw error;
  }
};

/**
 * Remove a user's vote from an event
 * @param {number} eventId - The event ID
 * @param {string} token - JWT token for authentication
 * @returns {Promise} Vote stats response
 */
export const removeVote = async (eventId, token) => {
  try {
    const response = await fetch(`${API_BASE}/events/${eventId}/vote`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to remove vote');
    }

    return await response.json();
  } catch (error) {
    console.error('Error removing vote:', error);
    throw error;
  }
};
