import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { EVENT_TYPE_COLORS, EVENT_TYPES } from '../EventTypes';

/**
 * Component for rendering News event markers in the timeline
 */
const NewsEventMarker = ({ event }) => {
  const theme = useTheme();
  
  return (
    <Paper
      elevation={3}
      sx={{
        maxWidth: 250, 
        cursor: 'pointer',
        overflow: 'hidden',
        borderRadius: '12px',
        // Type-specific background and border colors
        bgcolor: theme.palette.mode === 'dark' 
          ? 'rgba(40,20,20,0.95)' // Darker red for dark mode
          : 'rgba(255,245,245,0.97)', // Light red for light mode
        border: `1px solid ${theme.palette.mode === 'dark' 
          ? 'rgba(220,160,160,0.2)' // Red border for dark mode
          : 'rgba(220,100,100,0.15)'}`, // Red border for light mode
        boxShadow: theme.palette.mode === 'dark' 
          ? '0 8px 20px rgba(0,0,0,0.6), 0 2px 8px rgba(150,50,50,0.3)' 
          : '0 8px 20px rgba(0,0,0,0.15), 0 2px 8px rgba(150,50,50,0.15)'
      }}
    >
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
    </Paper>
  );
};

export default NewsEventMarker;
