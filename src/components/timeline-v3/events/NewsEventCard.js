import React from 'react';
import { Box, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { EVENT_TYPE_COLORS, EVENT_TYPES } from './EventTypes';

/**
 * Component for rendering News event cards
 */
const NewsEventCard = ({ event }) => {
  const theme = useTheme();
  
  return (
    <Box sx={{ maxWidth: 250, cursor: 'pointer' }}>
      {/* News banner */}
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: EVENT_TYPE_COLORS[EVENT_TYPES.NEWS][theme.palette.mode === 'dark' ? 'dark' : 'light'],
        color: theme.palette.mode === 'dark' ? '#000' : '#fff',
        py: 0.3,
        fontFamily: '"Georgia", "Times New Roman", serif',
        fontWeight: 'bold',
        fontSize: '0.7rem',
        textTransform: 'uppercase',
        letterSpacing: '1px',
        position: 'relative',
        zIndex: 1
      }}>
        News
      </Box>
      
      {/* Image if available */}
      {event.url_image && (
        <Box 
          component="img"
          src={event.url_image}
          alt={event.title}
          sx={{
            width: '100%',
            height: 120,
            objectFit: 'cover',
            display: 'block'
          }}
        />
      )}
      
      {/* Content area */}
      <Box sx={{ p: 1.5 }}>
        {/* Title with newspaper styling */}
        <Typography variant="subtitle1" sx={{ 
          fontWeight: 'bold', 
          mb: 0.5, 
          lineHeight: 1.2,
          fontFamily: '"Georgia", "Times New Roman", serif'
        }}>
          {event.title}
        </Typography>
        
        {/* Date and time */}
        <Typography variant="caption" color="text.secondary" sx={{ 
          display: 'block', 
          mt: 0.5,
          fontFamily: 'Arial, sans-serif'
        }}>
          {event && event.event_date ? new Date(event.event_date).toLocaleString() : ''}
        </Typography>
      </Box>
    </Box>
  );
};

export default NewsEventCard;
