import { displayUsername } from './usernameDisplay';

/**
 * Resolves the user-facing display title for a timeline.
 * 
 * If the current logged-in user owns or matches the timeline named after their username:
 * - Personal timeline matching username -> "Private Posts"
 * - Hashtag timeline matching username -> "My Public Posts"
 * Otherwise, returns the timeline's standard name.
 * 
 * @param {Object|string} timeline - Timeline object or raw name string
 * @param {string} [type] - Optional timeline type if timeline is just a name string
 * @param {Object} [currentUser] - The currently authenticated user from useAuth()
 * @returns {string} The customized display title
 */
export function getTimelineDisplayTitle(timeline, type = null, currentUser = null) {
  if (!timeline) return 'Timeline';

  let rawName = '';
  let timelineType = '';
  let createdById = null;

  if (typeof timeline === 'object') {
    rawName = timeline.name || timeline.title || '';
    timelineType = timeline.timeline_type || timeline.type || type || '';
    createdById = timeline.created_by ?? timeline.createdById ?? null;
  } else {
    rawName = String(timeline || '');
    timelineType = type || '';
  }

  // Strip existing prefix if passed with one (e.g. 'i - ', 'i-', 'My-', '#')
  let cleanName = rawName.trim();
  if (cleanName.startsWith('i - ')) {
    cleanName = cleanName.slice(4).trim();
    if (!timelineType) timelineType = 'community';
  } else if (cleanName.startsWith('i-')) {
    cleanName = cleanName.slice(2).trim();
    if (!timelineType) timelineType = 'community';
  } else if (cleanName.startsWith('My-')) {
    cleanName = cleanName.slice(3).trim();
    if (!timelineType) timelineType = 'personal';
  } else if (cleanName.startsWith('#')) {
    cleanName = cleanName.slice(1).trim();
    if (!timelineType) timelineType = 'hashtag';
  }

  if (!currentUser || !currentUser.username) {
    return cleanName || 'Timeline';
  }

  const currentUsername = String(currentUser.username || '').trim().toLowerCase().replace(/_/g, ' ');
  const normalizedClean = cleanName.toLowerCase().replace(/_/g, ' ');
  const nameMatchesUsername = Boolean(currentUsername && normalizedClean === currentUsername);
  const isOwner = createdById != null && Number(createdById) === Number(currentUser.id);
  const normType = String(timelineType || '').toLowerCase();

  // If this is the user's personal timeline matching their username:
  if (normType === 'personal' && (nameMatchesUsername || (isOwner && nameMatchesUsername))) {
    return 'Private Posts';
  }

  // If this is the user's hashtag timeline matching their username:
  if (normType === 'hashtag' && nameMatchesUsername) {
    return 'My Public Posts';
  }

  return cleanName || 'Timeline';
}
