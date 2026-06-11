/**
 * Rich Content Utilities
 * Shared functions for parsing and rendering rich text content
 * 
 * Supports:
 * - @username (user mentions)
 * - #hashtag (hashtag mentions)
 * - i-community (community mentions)
 * - ~123 (event references)
 * - www.url and https://url (links)
 */

/**
 * Parse plain text description into rich content structure
 * @param {string} description - Raw text to parse
 * @returns {{ content: Array<{type: string, value?: string, username?: string, name?: string, event_id?: number, url?: string, text?: string}> } | null}
 */
export const toRichContentPayload = (description) => {
  const raw = String(description || '');
  if (!raw.trim()) return null;

  // Pattern matches all mention and link types
  // Order matters: URLs must match before i- to avoid matching i- inside URLs like www.i-timeline.com
  // Pattern breakdown:
  // (@[a-zA-Z0-9_]+) - user mentions @username
  // (#[a-zA-Z0-9_]+) - hashtag mentions #tag
  // (~[0-9]+) - event references ~123
  // (https?:\/\/[^\s]+) - full URLs https://... or http://...
  // (www\.[^\s]+) - www URLs (must come before i- to avoid partial matches)
  // (i-[a-zA-Z0-9_-]+) - community mentions i-community (must come after www to avoid matching in URLs)
  //   Note: hyphens are included to support slugified timeline names like i-my-community
  const pattern = /(@[a-zA-Z0-9_]+)|(#[a-zA-Z0-9_]+)|(~[0-9]+)|(https?:\/\/[^\s]+)|(www\.[^\s]+)|(i-[a-zA-Z0-9_-]+)/g;
  
  const contentItems = [];
  let lastEnd = 0;

  raw.replace(pattern, (matched, _at, _hash, _event, _http, _www, _community, offset) => {
    // Add text before this match
    if (offset > lastEnd) {
      const textBefore = raw.slice(lastEnd, offset);
      if (textBefore) {
        contentItems.push({ type: 'text', value: textBefore });
      }
    }

    // Determine match type and create appropriate content item
    if (matched.startsWith('@')) {
      contentItems.push({ type: 'user_mention', username: matched.slice(1), text: matched });
    } else if (matched.startsWith('#')) {
      contentItems.push({ type: 'hashtag_mention', name: matched.slice(1), text: matched });
    } else if (matched.startsWith('~')) {
      const eventId = Number(matched.slice(1));
      if (Number.isFinite(eventId) && eventId > 0) {
        contentItems.push({ type: 'event_reference', event_id: eventId, text: matched });
      } else {
        contentItems.push({ type: 'text', value: matched });
      }
    } else if (matched.startsWith('http')) {
      contentItems.push({ type: 'link', url: matched, text: matched });
    } else if (matched.startsWith('www.')) {
      contentItems.push({ type: 'link', url: `https://${matched}`, text: matched });
    } else if (matched.startsWith('i-')) {
      contentItems.push({ type: 'community_mention', name: matched.slice(2), text: matched });
    }

    lastEnd = offset + matched.length;
    return matched;
  });

  // Add remaining text after last match
  if (lastEnd < raw.length) {
    contentItems.push({ type: 'text', value: raw.slice(lastEnd) });
  }

  // If no matches found, return entire text as single text item
  if (contentItems.length === 0) {
    return { content: [{ type: 'text', value: raw }] };
  }

  return { content: contentItems };
};

/**
 * Safely parse content that might be a string, JSON string, or already an object
 * @param {string|object} content - Content to parse
 * @returns {object|null} Parsed content object or null
 */
export const parseRichContent = (content) => {
  if (!content) return null;

  try {
    const contentData = typeof content === 'string' ? JSON.parse(content) : content;
    
    // If it's already a valid content object, return it
    if (contentData && contentData.content && Array.isArray(contentData.content)) {
      return contentData;
    }
    
    // If it's just a string (description), parse it
    if (typeof content === 'string') {
      return toRichContentPayload(content);
    }
    
    return null;
  } catch (e) {
    // If JSON parse fails, treat as raw description
    return toRichContentPayload(String(content));
  }
};
