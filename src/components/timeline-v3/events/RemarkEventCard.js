import React from 'react';
import { Box, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { EVENT_TYPE_COLORS, EVENT_TYPES } from './EventTypes';

/**
 * Component for rendering Remark event cards
 */
const RemarkEventCard = ({ event }) => {
  const theme = useTheme();
  
  return (
    <Box sx={{ p: 1.5, maxWidth: 250 }}>
      {/* Title with quote styling */}
      <Box sx={{ 
        position: 'relative',
        mb: 1,
        '&::before': {
          content: '"\u201C"', // Left double quotation mark
          position: 'absolute',
          left: -5,
          top: -12,
          fontSize: '1.8rem',
          color: EVENT_TYPE_COLORS[EVENT_TYPES.REMARK][theme.palette.mode === 'dark' ? 'dark' : 'light'],
          opacity: 0.6
        },
        '&::after': {
          content: '"\u201D"', // Right double quotation mark
          position: 'absolute',
          right: -5,
          bottom: -16,
          fontSize: '1.8rem',
          color: EVENT_TYPE_COLORS[EVENT_TYPES.REMARK][theme.palette.mode === 'dark' ? 'dark' : 'light'],
          opacity: 0.6
        }
      }}>
        <Typography variant="subtitle1" sx={{ 
          fontWeight: 'bold', 
          lineHeight: 1.2,
          px: 1
        }}>
          {event.title}
        </Typography>
      </Box>
      
      {/* First sentence of description */}
      {event.description && (
        <Typography variant="body2" color="text.secondary" sx={{ 
          fontStyle: 'italic',
          display: '-webkit-box',
          WebkitLineClamp: 1,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          lineHeight: 1.4,
          mb: 1,
          pl: 1
        }}>
          {/* Extract first sentence or first 60 characters */}
          {event.description.split('.')[0].substring(0, 60)}{event.description.length > 60 ? '...' : ''}
        </Typography>
      )}
      
      {/* Date and time */}
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
        {event && event.event_date ? new Date(event.event_date).toLocaleString() : ''}
      </Typography>
    </Box>
  );
};

export default RemarkEventCard;
