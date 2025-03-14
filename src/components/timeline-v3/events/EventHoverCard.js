import React from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import { EVENT_TYPES, getHoverCardStyles } from './EventTypes';
import { AudioFile as AudioIcon } from '@mui/icons-material';

export const EventHoverCard = ({ event, position }) => {
  const theme = useTheme();
  const styles = getHoverCardStyles(event.type, theme);

  const renderContent = () => {
    switch (event.type) {
      case EVENT_TYPES.REMARK:
        return (
          <>
            <Typography className="title" variant="subtitle1">
              {event.title}
            </Typography>
            <Typography className="author" variant="body2">
              by {event.author}
            </Typography>
          </>
        );

      case EVENT_TYPES.NEWS:
        return (
          <>
            {event.url_image && (
              <img 
                src={event.url_image} 
                alt={event.title}
                className="image"
              />
            )}
            <Box className="content">
              <Typography className="title" variant="subtitle1">
                {event.title}
              </Typography>
              {event.url_source && (
                <Typography variant="caption" color="text.secondary">
                  {event.url_source}
                </Typography>
              )}
            </Box>
          </>
        );

      case EVENT_TYPES.MEDIA:
        return (
          <>
            {event.media_type === 'audio' ? (
              <Box 
                className="media-preview"
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                }}
              >
                <AudioIcon sx={{ fontSize: 48, opacity: 0.7 }} />
              </Box>
            ) : (
              <img 
                src={event.media_url} 
                alt={event.title}
                className="media-preview"
              />
            )}
            <Typography className="title" variant="subtitle2">
              {event.title}
            </Typography>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <Box
      sx={{
        ...styles,
        left: position.x,
        top: position.y,
      }}
    >
      {renderContent()}
    </Box>
  );
};
