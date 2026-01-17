/**
 * Vote Type Converter
 * Bridges between UI vote types ('up'/'down') and backend vote types ('promote'/'demote')
 */

// Vote type constants
export const VOTE_TYPES_UI = {
  UP: 'up',
  DOWN: 'down',
  NEUTRAL: null,
};

export const VOTE_TYPES_BACKEND = {
  PROMOTE: 'promote',
  DEMOTE: 'demote',
  NEUTRAL: null,
};

/**
 * Convert UI vote type to backend vote type
 * @param {string|null} uiVoteType - 'up', 'down', or null
 * @returns {string|null} - 'promote', 'demote', or null
 */
export const uiToBackend = (uiVoteType) => {
  switch (uiVoteType) {
    case VOTE_TYPES_UI.UP:
      return VOTE_TYPES_BACKEND.PROMOTE;
    case VOTE_TYPES_UI.DOWN:
      return VOTE_TYPES_BACKEND.DEMOTE;
    case null:
    case undefined:
      return VOTE_TYPES_BACKEND.NEUTRAL;
    default:
      console.warn(`Unknown UI vote type: ${uiVoteType}`);
      return VOTE_TYPES_BACKEND.NEUTRAL;
  }
};

/**
 * Convert backend vote type to UI vote type
 * @param {string|null} backendVoteType - 'promote', 'demote', or null
 * @returns {string|null} - 'up', 'down', or null
 */
export const backendToUi = (backendVoteType) => {
  switch (backendVoteType) {
    case VOTE_TYPES_BACKEND.PROMOTE:
      return VOTE_TYPES_UI.UP;
    case VOTE_TYPES_BACKEND.DEMOTE:
      return VOTE_TYPES_UI.DOWN;
    case null:
    case undefined:
      return VOTE_TYPES_UI.NEUTRAL;
    default:
      console.warn(`Unknown backend vote type: ${backendVoteType}`);
      return VOTE_TYPES_UI.NEUTRAL;
  }
};

/**
 * Validate if a vote type is valid
 * @param {string|null} voteType - Vote type to validate
 * @param {boolean} isBackend - If true, validates against backend types; otherwise UI types
 * @returns {boolean}
 */
export const isValidVoteType = (voteType, isBackend = false) => {
  if (voteType === null || voteType === undefined) {
    return true;
  }

  if (isBackend) {
    return Object.values(VOTE_TYPES_BACKEND).includes(voteType);
  } else {
    return Object.values(VOTE_TYPES_UI).includes(voteType);
  }
};
