import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { alpha, useTheme } from '@mui/material/styles';
import {
  Box,
  Button,
  Card,
  CardContent,
  Avatar,
  Typography,
  Stack,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';
import { displayUsername } from '../../utils/usernameDisplay';
import { normalizeUserCardData, resolveUserCardGradient } from './userCardModel';

/**
 * Standardized User Card component.
 * Displays a user profile preview with color identity integration.
 */
export default function UserCard({
  user,
  currentUserId,
  followedUserIdSet = new Set(),
  followActionByUserId = {},
  onToggleFollow,
  sx = {},
}) {
  const theme = useTheme();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);

  if (!user) return null;

  const cardData = normalizeUserCardData(user);
  const {
    id: profileUserId,
    username,
    bio,
    avatarUrl,
    identityColor,
  } = cardData;

  const isFollowing = followedUserIdSet.has(profileUserId);
  const isSelf = currentUserId > 0 && profileUserId === currentUserId;
  const followBusy = !!followActionByUserId[profileUserId];
  const isActionMenuOpen = Boolean(anchorEl);

  const handleOpenMenu = (event) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  const handleAction = (event, callback) => {
    event.stopPropagation();
    handleCloseMenu();
    if (callback) callback();
  };

  const userCardBackground = resolveUserCardGradient(identityColor, theme);

  return (
    <Card
      onClick={() => navigate(`/profile/${profileUserId}`)}
      aria-label={`Open profile for ${displayUsername(username)}`}
      sx={{
        position: 'relative',
        borderRadius: 3,
        border: '2px solid',
        borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(35, 24, 24, 0.55)',
        background: userCardBackground,
        boxShadow: theme.palette.mode === 'dark'
          ? '0 12px 26px rgba(0,0,0,0.4)'
          : '0 14px 24px rgba(80, 34, 39, 0.24)',
        overflow: 'visible',
        pl: { xs: 12.9, sm: 16.6 },
        minHeight: { xs: 125, sm: 133 },
        cursor: 'pointer',
        transition: 'transform 240ms ease, box-shadow 240ms ease',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: theme.palette.mode === 'dark'
            ? '0 16px 32px rgba(0,0,0,0.5)'
            : '0 16px 30px rgba(80, 34, 39, 0.3)',
        },
        '&:focus-within': {
          outline: `2px solid ${identityColor || 'rgba(56,189,248,0.55)'}`,
          outlineOffset: 2,
        },
        ...sx,
      }}
    >
      {/* Avatar Container */}
      <Box
        sx={{
          position: 'absolute',
          left: { xs: -24, sm: -32 },
          top: '50%',
          transform: 'translateY(-50%)',
          width: { xs: 120, sm: 140 },
          height: { xs: 148, sm: 172 },
          borderRadius: '50px',
          border: '3px solid',
          borderColor: theme.palette.mode === 'dark' ? 'rgba(22,18,18,0.94)' : 'rgba(18, 14, 14, 0.92)',
          background: theme.palette.mode === 'dark'
            ? 'linear-gradient(145deg, rgba(32,30,30,0.96) 0%, rgba(15,12,12,0.96) 100%)'
            : 'linear-gradient(145deg, rgba(38,30,30,0.94) 0%, rgba(18,12,12,0.94) 100%)',
          p: 0.55,
          zIndex: 3,
          boxShadow: theme.palette.mode === 'dark'
            ? '0 10px 22px rgba(0,0,0,0.48)'
            : '0 10px 20px rgba(42,20,20,0.35)',
        }}
      >
        <Avatar
          src={avatarUrl}
          alt={displayUsername(username) || 'User'}
          sx={{
            width: '100%',
            height: '100%',
            borderRadius: '46px',
            bgcolor: identityColor ? alpha(identityColor, 0.25) : 'rgba(255,255,255,0.2)',
            color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.95)',
            fontWeight: 800,
            fontSize: '1.4rem',
            border: identityColor ? `2px solid ${alpha(identityColor, 0.5)}` : 'none',
          }}
        >
          {String(username || '?').charAt(0).toUpperCase()}
        </Avatar>
        
        {/* Restricted Overlay */}
        {(cardData.isRestricted || cardData.isSuspended) && (
          <Box
            sx={{
              position: 'absolute',
              top: '3px',
              left: '3px',
              right: '3px',
              bottom: '3px',
              backgroundImage: 'url(/images/RESTRICTED_img.png)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              zIndex: 10,
              borderRadius: '46px',
              pointerEvents: 'none',
            }}
          />
        )}
      </Box>

      <CardContent
        sx={{
          px: { xs: 1.75, sm: 2.2 },
          py: { xs: 1.4, sm: 1.55 },
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1.5,
        }}
      >
        <Box
          sx={{
            minWidth: 0,
            color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.94)' : 'rgba(15,23,42,0.94)',
          }}
        >
          {/* Identity Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.15, mb: 0.45 }}>
            <Box
              sx={{
                width: 16,
                height: 2,
                bgcolor: identityColor || (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.9)' : 'rgba(15,23,42,0.92)'),
                position: 'relative',
                transition: 'background-color 0.3s ease',
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  right: -6,
                  top: -3,
                  width: 0,
                  height: 0,
                  borderTop: '4px solid transparent',
                  borderBottom: '4px solid transparent',
                  borderLeft: `6px solid ${identityColor || (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.9)' : 'rgba(15,23,42,0.92)')}`,
                },
              }}
            />
            <Typography
              sx={{
                fontFamily: 'Lobster, cursive',
                fontSize: { xs: '1.05rem', sm: '1.22rem' },
                lineHeight: 1.1,
                textDecoration: identityColor ? 'none' : 'underline',
                textUnderlineOffset: '4px',
                textDecorationThickness: '2px',
                color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.95)' : 'rgba(15,23,42,0.95)',
                fontWeight: 700,
                textShadow: 'none',
              }}
            >
              @{displayUsername(username).charAt(0).toUpperCase() + displayUsername(username).slice(1)}
            </Typography>
          </Box>

          <Typography
            sx={{
              fontFamily: 'Playfair Display, Georgia, serif',
              fontStyle: 'italic',
              fontWeight: 700,
              fontSize: { xs: '0.95rem', sm: '1.05rem' },
              color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.85)' : 'rgba(15,23,42,0.85)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {bio ? `"${bio}"` : '"No bio added yet."'}
          </Typography>
        </Box>

        {/* Actions Menu */}
        <Stack spacing={0.75} sx={{ alignSelf: 'flex-end', zIndex: 5 }}>
          <Button
            size="small"
            variant="contained"
            onClick={handleOpenMenu}
            endIcon={<ExpandMoreIcon fontSize="small" />}
            sx={{
              fontWeight: 700,
              fontSize: '0.8rem',
              borderRadius: 1.75,
              px: 1.4,
              color: '#fff',
              textShadow: '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000',
              background: identityColor
                ? `linear-gradient(135deg, ${identityColor} 0%, ${alpha(identityColor, 0.8)} 100%)`
                : 'linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)',
              boxShadow: identityColor
                ? `0 8px 16px ${alpha(identityColor, 0.2)}`
                : '0 8px 16px rgba(37,99,235,0.24)',
              '&:hover': {
                background: identityColor
                  ? `linear-gradient(135deg, ${alpha(identityColor, 0.9)} 0%, ${identityColor} 100%)`
                  : undefined,
              }
            }}
          >
            Actions
          </Button>

          <Menu
            anchorEl={anchorEl}
            open={isActionMenuOpen}
            onClose={handleCloseMenu}
            onClick={(event) => event.stopPropagation()}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            PaperProps={{
              sx: {
                borderRadius: 2,
                border: '1px solid',
                borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.14)' : 'rgba(15,23,42,0.15)',
                boxShadow: theme.palette.mode === 'dark'
                  ? '0 14px 24px rgba(0,0,0,0.42)'
                  : '0 12px 20px rgba(15,23,42,0.18)',
              },
            }}
          >
            <MenuItem
              onClick={(event) => handleAction(event, () => navigate(`/profile/${profileUserId}`))}
            >
              View Profile
            </MenuItem>

            {!isSelf && (
              <MenuItem
                disabled={followBusy}
                onClick={(event) => handleAction(event, () => onToggleFollow && onToggleFollow(cardData.raw))}
                sx={{
                  color: isFollowing
                    ? (theme.palette.mode === 'dark' ? 'rgb(252,165,165)' : 'rgb(185,28,28)')
                    : identityColor || (theme.palette.mode === 'dark' ? 'rgb(147,197,253)' : 'rgb(30,64,175)'),
                  fontWeight: 700,
                }}
              >
                {followBusy ? 'Saving...' : isFollowing ? 'Unfollow' : 'Follow'}
              </MenuItem>
            )}
          </Menu>
        </Stack>
      </CardContent>
    </Card>
  );
}
