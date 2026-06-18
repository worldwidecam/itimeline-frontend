import React from 'react';
import { Avatar, Tooltip, Box } from '@mui/material';
import { resolveAvatarColor, getInitial } from '../../utils/avatar';
import { displayUsername } from '../../utils/usernameDisplay';
import { getCachedUserIdentityColor } from '../../utils/userIdentityColor';

export default function UserAvatar({
  name,
  avatarUrl,
  id,
  alt,
  size = 48,
  sx = {},
  onClick,
  userColor,
  isRestricted,
  isSuspended,
  isAvatarBlurred,
}) {
  const displayName = displayUsername(name || 'User');
  const initial = getInitial(displayName);
  const userForColor = { userId: id, name: displayName };
  // Use provided userColor if available, then check localStorage cache, then calculate from user id/name
  const cachedColor = getCachedUserIdentityColor(id);
  const bg = userColor || cachedColor || resolveAvatarColor(userForColor);

  let resolvedAvatarUrl = avatarUrl;
  if (resolvedAvatarUrl) {
    if (resolvedAvatarUrl.includes('/images/GUEST_img.png')) {
      resolvedAvatarUrl = '/images/GUEST_img.png';
    } else if (resolvedAvatarUrl.includes('localhost:3000')) {
      try {
        resolvedAvatarUrl = new URL(resolvedAvatarUrl).pathname;
      } catch (e) {
        // fallback
      }
    }
  }

  const commonProps = {
    alt: alt || displayName,
    sx: {
      width: '100%',
      height: '100%',
      // Scale initials proportionally to avatar size
      fontSize: Math.max(12, Math.round(size * 0.42)),
      fontWeight: 600,
      bgcolor: bg,
      color: '#111',
      filter: isAvatarBlurred ? 'blur(18px) saturate(0.45)' : 'none',
    }
  };

  const overlay = (isRestricted || isSuspended) ? (
    <Box
      sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundImage: 'url(/images/RESTRICTED_img.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        zIndex: 1,
        borderRadius: '50%',
        pointerEvents: 'none',
      }}
    />
  ) : null;

  const avatar = (
    <Box 
      onClick={onClick} 
      sx={{ 
        position: 'relative', 
        display: 'inline-flex', 
        width: size, 
        height: size, 
        borderRadius: '50%', 
        flexShrink: 0, 
        cursor: onClick ? 'pointer' : 'inherit',
        ...sx 
      }}
    >
      <Avatar src={resolvedAvatarUrl || undefined} {...commonProps}>
        {initial}
      </Avatar>
      {overlay}
    </Box>
  );

  // Wrap in tooltip for better UX
  return (
    <Tooltip title={displayName} disableInteractive>
      {avatar}
    </Tooltip>
  );
}
