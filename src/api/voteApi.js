/**
 * Vote API utilities for managing event votes
 */

import api from '../utils/api';

const normalizeVoteStats = (payload = {}) => {
  const totals = payload?.vote_totals || payload || {};
  return {
    promote_count: Number(totals?.promote_count ?? totals?.promote ?? 0) || 0,
    demote_count: Number(totals?.demote_count ?? totals?.demote ?? 0) || 0,
    user_vote: totals?.user_vote ?? totals?.my_vote ?? null,
  };
};

/**
 * Cast or update a vote on an event
 * @param {number} eventId - The event ID to vote on
 * @param {string} voteType - 'promote' or 'demote'
 * @param {string} token - JWT token for authentication
 * @returns {Promise} Vote stats response
 */
export const castVote = async (eventId, voteType, token) => {
  try {
    await api.post(`/api/v1/events/${eventId}/votes`, {
      vote_type: voteType,
    }, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return await getVoteStats(eventId, token);
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
    const response = await api.get(`/api/v1/events/${eventId}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return normalizeVoteStats(response?.data || {});
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
    await api.delete(`/api/v1/events/${eventId}/votes`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return await getVoteStats(eventId, token);
  } catch (error) {
    console.error('Error removing vote:', error);
    throw error;
  }
};
