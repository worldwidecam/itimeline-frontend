import { alpha } from '@mui/material/styles';
import { resolveUserIdentityColor } from '../../utils/userIdentityColor';

/**
 * Normalizes user data specifically for the UserCard component.
 * This ensures field names are consistent regardless of the backend source.
 */
export function normalizeUserCardData(user) {
  if (!user) return null;

  const id = Number(user.id || user.userId || 0);
  const username = String(user.username || user.name || 'User');
  const bio = String(user.bio || '');
  const avatarUrl = user.avatar_url || user.avatar || '';
  const identityColor = resolveUserIdentityColor(user);
  const isRestricted = !!user.is_restricted;
  const isSuspended = !!user.is_suspended;
  const isAvatarBlurred = !!user.is_avatar_blurred;

  return {
    id,
    username,
    bio,
    avatarUrl,
    identityColor,
    isRestricted,
    isSuspended,
    isAvatarBlurred,
    raw: user,
  };
}

/**
 * Generates a premium background gradient based on the user's color identity.
 */
export function resolveUserCardGradient(identityColor, theme) {
  const isDark = theme.palette.mode === 'dark';
  
  // Base tones for the gradient start
  // Dark: Deep charcoal/slate
  // Light: Soft parchment/neutral
  const startTone = isDark ? '#1a1818' : '#fafafa';
  
  if (!identityColor) {
    // Default fallback gradient when no identity color is set
    const fallbackEnd = isDark ? '#2d3748' : '#f1f5f9';
    return `linear-gradient(135deg, ${startTone} 0%, ${fallbackEnd} 100%)`;
  }

  // When we have an identity color, we want a lush transition.
  // We use alpha transparency to ensure it doesn't overpower the text.
  
  if (isDark) {
    // For Dark Mode: [Deep Start] -> [Identity Color Low Alpha] -> [Identity Color]
    return `linear-gradient(135deg, 
      ${alpha(startTone, 0.98)} 0%, 
      ${alpha(identityColor, 0.15)} 45%, 
      ${alpha(identityColor, 0.28)} 100%
    )`;
  } else {
    // For Light Mode: [Soft Start] -> [Identity Color Very Low Alpha] -> [Identity Color Low Alpha]
    // Avoiding the "jarring blue middle" by keeping it neutral until it hits the identity color tint.
    return `linear-gradient(135deg, 
      ${alpha(startTone, 0.99)} 0%, 
      ${alpha(identityColor, 0.04)} 40%, 
      ${alpha(identityColor, 0.12)} 100%
    )`;
  }
}
