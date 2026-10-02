/**
 * dateUtils.js
 * Shared date formatting utilities for iTimeline.
 */

/**
 * Formats a created_at ISO date string into a human-friendly relative time string.
 * Prefixed with "Published" for use on event cards.
 *
 * Examples:
 *   "Published just now"
 *   "Published 5 mins ago"
 *   "Published 3 hours ago"
 *   "Published 2 days ago"
 *   "Published 3 weeks ago"
 *   "Published 5 months ago"
 *   "Published 3 years ago"
 *
 * @param {string} dateStr - ISO date string (e.g. event.created_at)
 * @returns {string}
 */
export const formatPublishedRelative = (dateStr) => {
  try {
    if (!dateStr) return 'Invalid date';

    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();

    if (isNaN(diffMs)) return 'Invalid date';

    const diffMins   = Math.floor(diffMs / 60000);
    const diffHours  = Math.floor(diffMs / 3600000);
    const diffDays   = Math.floor(diffMs / 86400000);
    const diffWeeks  = Math.floor(diffMs / 604800000);
    const diffMonths = Math.floor(diffMs / 2592000000);
    const diffYears  = Math.floor(diffMs / 31536000000);

    if (diffMins  < 1)  return 'Published just now';
    if (diffMins  < 60) return `Published ${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `Published ${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays  < 7)  return `Published ${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    if (diffWeeks < 4)  return `Published ${diffWeeks} week${diffWeeks > 1 ? 's' : ''} ago`;
    if (diffMonths < 12) return `Published ${diffMonths} month${diffMonths > 1 ? 's' : ''} ago`;
    return `Published ${diffYears} year${diffYears > 1 ? 's' : ''} ago`;
  } catch (err) {
    return 'Invalid date';
  }
};
