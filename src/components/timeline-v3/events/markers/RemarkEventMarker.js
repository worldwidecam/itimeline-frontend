import React, { useState, useCallback } from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { EVENT_TYPE_COLORS, EVENT_TYPES } from '../EventTypes';
import EventPopup from '../EventPopup';

/**
 * Component for rendering Remark event markers in the timeline
 */
const RemarkEventMarker = ({ event, onDelete, onEdit }) => {
  const theme = useTheme();
  const [popupOpen, setPopupOpen] = useState(false);
  
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
          maxWidth: 250, 
          cursor: 'pointer',
          overflow: 'hidden',
          borderRadius: '12px',
          // Type-specific background and border colors
          bgcolor: theme.palette.mode === 'dark' 
            ? 'rgba(15,15,35,0.95)' // Darker blue for dark mode
            : 'rgba(245,250,255,0.97)', // Light blue for light mode
          border: `1px solid ${theme.palette.mode === 'dark' 
            ? 'rgba(160,180,220,0.2)' // Blue border for dark mode
            : 'rgba(100,140,220,0.15)'}`, // Blue border for light mode
          boxShadow: theme.palette.mode === 'dark' 
            ? '0 8px 20px rgba(0,0,0,0.6), 0 2px 8px rgba(60,100,160,0.3)' 
            : '0 8px 20px rgba(0,0,0,0.15), 0 2px 8px rgba(60,100,160,0.15)'
        }}
      >
        <Box sx={{ p: 1.5 }}>
          {/* Title with quote styling */}
          <Box sx={{ 
            position: 'relative',
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
      </Paper>
    </>
  );
};

export default RemarkEventMarker;
