import React from 'react';
import { Box, Typography, Chip, useTheme } from '@mui/material';
import { format, parseISO } from 'date-fns';
import { EVENT_TYPE_COLORS, EVENT_TYPES } from './EventTypes';
import EventIcon from '@mui/icons-material/Event';

const EventTooltip = ({ event }) => {
  const theme = useTheme();

  if (!event) {
    return (
      <Box sx={{ p: 1 }}>
        <Typography variant="caption" color="text.secondary">
          No event data available
        </Typography>
      </Box>
    );
  }

  // Get event type color
  const getEventTypeColor = () => {
    if (!event?.type) return theme.palette.primary.main;
    const colors = EVENT_TYPE_COLORS[event.type];
    return theme.palette.mode === 'dark' ? colors?.dark : colors?.light;
  };

  const formatEventDate = (dateStr) => {
    try {
      if (!dateStr) return 'No date';
      
      // Parse the ISO string into a Date object
      const date = parseISO(dateStr);
      
      // Format event date
      return format(date, 'MMM d, yyyy');
    } catch (error) {
      return 'Invalid date';
    }
  };

  const color = getEventTypeColor();

  return (
    <Box sx={{ width: '220px', p: 1 }}>
      {/* Title with colored accent */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'flex-start', 
        mb: 1,
        borderLeft: `3px solid ${color}`,
        pl: 1
      }}>
        <Typography 
          variant="subtitle2" 
          sx={{ 
            fontWeight: 'bold',
            color: theme.palette.text.primary,
            lineHeight: 1.3
          }}
        >
          {event.title}
        </Typography>
      </Box>

      {/* Event date if available */}
      {event.event_date && (
        <Box sx={{ mb: 1 }}>
          <Chip
            icon={<EventIcon fontSize="small" />}
            label={formatEventDate(event.event_date)}
            size="small"
            sx={{ 
              height: '22px',
              '& .MuiChip-label': {
                fontSize: '0.7rem',
                px: 1
              },
              '& .MuiChip-icon': {
                fontSize: '0.9rem'
              }
            }}
          />
        </Box>
      )}

      {/* Brief description if available */}
      {event.description && (
        <Typography 
          variant="caption" 
          sx={{ 
            color: theme.palette.text.secondary,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
        >
          {event.description}
        </Typography>
      )}
    </Box>
  );
};

export default EventTooltip;
