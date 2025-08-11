import React from 'react';
import { Avatar, Tooltip } from '@mui/material';
import { resolveAvatarColor, getInitial } from '../../utils/avatar';

export default function UserAvatar({
  name,
  avatarUrl,
  id,
  alt,
  size = 48,
  sx = {},
  onClick
}) {
  const displayName = name || 'User';
  const initial = getInitial(displayName);
  const userForColor = { userId: id, name: displayName };
  const bg = resolveAvatarColor(userForColor);

  const commonProps = {
    alt: alt || displayName,
    sx: {
      width: size,
      height: size,
      // Scale initials proportionally to avatar size
      fontSize: Math.max(12, Math.round(size * 0.42)),
      fontWeight: 600,
      bgcolor: avatarUrl ? undefined : bg,
      color: avatarUrl ? undefined : '#111',
      ...sx
    },
    onClick
  };

  const avatar = (
    <Avatar src={avatarUrl || undefined} {...commonProps}>
      {!avatarUrl ? initial : null}
    </Avatar>
  );

  // Wrap in tooltip for better UX
  return (
    <Tooltip title={displayName} disableInteractive>
      {avatar}
    </Tooltip>
  );
}
