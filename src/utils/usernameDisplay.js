/**
 * Username Display Utilities
 *
 * Golden rule:
 *   - Storage:  spaces are stored as underscores  ("testing_cam")
 *   - Display:  underscores are shown as spaces    ("testing cam")
 *   - Search:   both spaces and underscores match  ("testing cam" === "testing_cam")
 *
 * These utilities should be used everywhere a username is rendered to the user.
 */

/**
 * Convert a stored username (with underscores) into a display-friendly version
 * (with spaces). Use this everywhere a username is rendered visually.
 *
 * @param {string} username - The raw username from the database (e.g. "testing_cam")
 * @returns {string} Display-friendly username (e.g. "testing cam")
 */
export const displayUsername = (username) => {
  const spaced = String(username || '').replace(/_/g, ' ');
  if (!spaced) return '';
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
};

/**
 * Convert a user-typed input (which may contain spaces) into the storage
 * format (underscores). Use this before sending usernames to the backend.
 *
 * @param {string} input - User-typed text (e.g. "testing cam")
 * @returns {string} Storage-formatted username (e.g. "testing_cam")
 */
export const normalizeUsernameForStorage = (input) => {
  let normalized = String(input || '').trim();
  normalized = normalized.replace(/\s+/g, '_');              // spaces → underscores
  normalized = normalized.replace(/_{2,}/g, '_');             // collapse multiple underscores
  normalized = normalized.replace(/^_+|_+$/g, '');            // trim leading/trailing underscores
  return normalized;
};

/**
 * Normalize a search query so it can match usernames stored with underscores.
 * The query is compared against both the underscore and space versions.
 *
 * @param {string} query - The search input (e.g. "testing cam")
 * @returns {string} Normalized query for matching (e.g. "testing_cam")
 */
export const normalizeUsernameForSearch = (query) => {
  return String(query || '').trim().replace(/\s+/g, '_').toLowerCase();
};

/**
 * Check if a username matches a search query, accounting for the
 * space/underscore equivalence.
 *
 * @param {string} username - The stored username
 * @param {string} query - The user's search query
 * @returns {boolean} Whether the username matches the query
 */
export const usernameMatchesQuery = (username, query) => {
  const normalizedUsername = String(username || '').replace(/_/g, ' ').toLowerCase();
  const normalizedQuery = String(query || '').replace(/_/g, ' ').toLowerCase().trim();
  return normalizedUsername.includes(normalizedQuery);
};
