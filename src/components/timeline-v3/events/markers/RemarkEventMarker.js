import React, { useState, useCallback } from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { useTheme, keyframes } from '@mui/material/styles';
import { EVENT_TYPE_COLORS, EVENT_TYPES } from '../EventTypes';
import EventPopup from '../EventPopup';
import UserAvatar from '../../../common/UserAvatar';

/**
 * Component for rendering Remark event markers in the timeline
 */
const bubblePop = keyframes`
  0% {
    transform: scale(0.95) translateY(2px);
    opacity: 0;
  }
  60% {
    transform: scale(1.03) translateY(-1px);
    opacity: 1;
  }
  100% {
    transform: scale(1) translateY(0);
    opacity: 1;
  }
`;

const RemarkEventMarker = ({ event, onDelete, onEdit, avatarSide = 'left' }) => {
  const theme = useTheme();
  const [popupOpen, setPopupOpen] = useState(false);
  const isAvatarRight = avatarSide === 'right';
  
  const handleMarkerClick = useCallback((e) => {
    e.stopPropagation();
    setPopupOpen(true);
  }, []);

  const handlePopupClose = useCallback(() => {
    setPopupOpen(false);
  }, []);
  
  return (
    <>
      <EventPopup
        open={popupOpen}
        onClose={handlePopupClose}
        event={event}
        onDelete={onDelete}
        onEdit={onEdit}
      />
      <Paper
        elevation={3}
        onClick={handleMarkerClick}
        sx={{
          maxWidth: 280,
          cursor: 'pointer',
          overflow: 'visible',
          borderRadius: '16px',
          background: theme.palette.mode === 'dark'
            ? 'linear-gradient(165deg, rgba(34,40,74,0.96) 0%, rgba(20,22,44,0.96) 100%)'
            : 'linear-gradient(165deg, #ffffff 0%, #fff3dd 100%)',
          border: `2px solid ${theme.palette.mode === 'dark'
            ? 'rgba(150,170,220,0.45)'
            : 'rgba(36,42,84,0.78)'}`,
          boxShadow: theme.palette.mode === 'dark' 
            ? '0 12px 24px rgba(0,0,0,0.55), 5px 6px 0 rgba(10,12,30,0.8)'
            : '0 12px 24px rgba(0,0,0,0.18), 5px 6px 0 rgba(31,31,31,0.75)',
          animation: `${bubblePop} 220ms cubic-bezier(0.22, 1, 0.36, 1)`,
          transformOrigin: isAvatarRight ? '100% 100%' : '0% 100%',
        }}
      >
        <Box
          sx={{
            p: 1.25,
            display: 'flex',
            flexDirection: isAvatarRight ? 'row-reverse' : 'row',
            alignItems: 'flex-end',
            gap: 1,
          }}
        >
          <UserAvatar
            name={event?.created_by_username || event?.author || 'User'}
            avatarUrl={event?.created_by_avatar}
            id={event?.created_by}
            size={36}
            sx={{
              flexShrink: 0,
              border: `2px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.24)' : 'rgba(31,31,31,0.25)'}`,
              boxShadow: theme.palette.mode === 'dark'
                ? '0 2px 8px rgba(0,0,0,0.45)'
                : '0 2px 6px rgba(0,0,0,0.2)',
            }}
          />
          <Box
            sx={{
              position: 'relative',
              px: 1.25,
              py: 0.5,
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              '&::before': {
                content: '"\u201C"',
                position: 'absolute',
                left: 0,
                top: -7,
                fontSize: '1.72rem',
                fontFamily: '"Lobster", cursive',
                lineHeight: 1,
                color: EVENT_TYPE_COLORS[EVENT_TYPES.REMARK][theme.palette.mode === 'dark' ? 'dark' : 'light'],
                opacity: 0.7,
              },
              '&::after': {
                content: '"\u201D"',
                position: 'absolute',
                right: 0,
                top: -7,
                fontSize: '1.72rem',
                fontFamily: '"Lobster", cursive',
                lineHeight: 1,
                color: EVENT_TYPE_COLORS[EVENT_TYPES.REMARK][theme.palette.mode === 'dark' ? 'dark' : 'light'],
                opacity: 0.7,
              },
            }}
          >
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 700,
                lineHeight: 1.3,
                px: 1,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                textAlign: 'center',
                fontSize: '0.98rem',
                color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.94)' : 'rgba(20,20,20,0.93)',
              }}
            >
              {event.title}
            </Typography>
          </Box>
        </Box>
      </Paper>
    </>
  );
};

export default RemarkEventMarker;
