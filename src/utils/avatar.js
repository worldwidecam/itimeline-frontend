// Single source of truth for avatar initials and colors
// No backend changes. Optionally reads a locally stored user preference.

// Brand-friendly palette (adjust once here to affect all avatars)
export const AVATAR_PALETTE = [
  '#F59E0B', // amber-500
  '#10B981', // emerald-500
  '#3B82F6', // blue-500
  '#8B5CF6', // violet-500
  '#EC4899', // pink-500
  '#EF4444', // red-500
  '#14B8A6', // teal-500
  '#22C55E', // green-500
  '#06B6D4', // cyan-500
  '#EAB308'  // yellow-500
];

export function getInitial(nameOrEmail) {
  if (!nameOrEmail) return '?';
  const s = String(nameOrEmail).trim();
  if (!s) return '?';
  // If email, use first char of local part
  const first = s.includes('@') ? s.split('@')[0] : s;
  return (first[0] || '?').toUpperCase();
}

export function getAvatarSeed(user) {
  if (!user) return 'unknown';
  // Prefer stable numeric/string id
  return String(user.userId || user.id || user.username || user.name || 'unknown');
}

export function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function getAvatarColorFromSeed(seed, palette = AVATAR_PALETTE) {
  if (!seed) seed = 'unknown';
  const idx = hashString(String(seed)) % palette.length;
  return palette[idx];
}

// Local user preference (no backend). Keyed by userId if available.
export function getLocalAvatarColorPreference(user) {
  try {
    const key = user?.userId || user?.id;
    if (!key) return null;
    const stored = localStorage.getItem(`avatarColor:${key}`);
    return stored || null;
  } catch (_) {
    return null;
  }
}

export function setLocalAvatarColorPreference(user, color) {
  try {
    const key = user?.userId || user?.id;
    if (!key || !color) return;
    localStorage.setItem(`avatarColor:${key}`, color);
  } catch (_) {
    // ignore
  }
}

// Resolve color with preference -> seed fallback
export function resolveAvatarColor(user, palette = AVATAR_PALETTE) {
  const pref = getLocalAvatarColorPreference(user);
  if (pref) return pref;
  const seed = getAvatarSeed(user);
  return getAvatarColorFromSeed(seed, palette);
}
