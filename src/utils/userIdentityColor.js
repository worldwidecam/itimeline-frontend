export const isValidHexIdentityColor = (value) => /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(String(value || '').trim());

export const normalizeIdentityColor = (value) => {
  const candidate = String(value || '').trim().toLowerCase();
  return isValidHexIdentityColor(candidate) ? candidate : null;
};

export const resolveUserIdentityColor = (profileUser) => {
  if (!profileUser) return null;

  const candidate = (
    profileUser?.user_color
    || profileUser?.primary_color
    || profileUser?.profile_primary_color
    || profileUser?.accent_color
    || profileUser?.preferences?.user_color
    || ''
  );

  return normalizeIdentityColor(candidate);
};

export const getCachedUserIdentityColor = (userId) => {
  const numericUserId = Number(userId || 0);
  if (numericUserId <= 0) return null;
  try {
    return normalizeIdentityColor(window.localStorage.getItem(`user_color_pref_user_${numericUserId}`));
  } catch (_) {
    return null;
  }
};
