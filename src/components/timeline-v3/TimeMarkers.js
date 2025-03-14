import React from 'react';
import { Box, Typography } from '@mui/material';

const TimeMarkers = ({ 
  timelineOffset,
  markerSpacing,
  markerStyles,
  markers,
  viewMode = 'position',
  theme 
}) => {
  const getCurrentDateTime = () => {
    // This will be updated with the latest timestamp from the system
    return new Date();
  };

  const getCurrentHour = () => {
    return getCurrentDateTime().getHours();
  };

  const formatHour = (hour, position) => {
    if (hour === 0) { // 12 AM case
      const currentDate = getCurrentDateTime();
      const currentHour = getCurrentHour();
      
      // Calculate exact hours offset from current time
      const hoursOffset = position;
      
      // Create new date by adding/subtracting hours
      const targetDate = new Date(currentDate);
      targetDate.setHours(targetDate.getHours() + hoursOffset);
      
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      return `${days[targetDate.getDay()]} 12AM`;
    }
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}${ampm}`;
  };

  const formatDay = (dayOffset) => {
    const currentDate = getCurrentDateTime();
    const targetDate = new Date(currentDate);
    targetDate.setDate(targetDate.getDate() + dayOffset);
    
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const month = targetDate.toLocaleString('default', { month: 'short' });
    const date = targetDate.getDate();
    
    if (targetDate.getDay() === 0) {
      return `${month} ${date}`; // More compact Sunday format
    }
    return days[targetDate.getDay()]; // Just day name for other days
  };

  const formatMonth = (monthOffset) => {
    const currentDate = getCurrentDateTime();
    const targetDate = new Date(currentDate);
    targetDate.setMonth(targetDate.getMonth() + monthOffset);
    
    const monthName = targetDate.toLocaleString('default', { month: 'long' });
    
    // If it's January, show the year too
    if (targetDate.getMonth() === 0) {
      return `${monthName} ${targetDate.getFullYear()}`;
    }
    
    return monthName;
  };

  const formatYear = (yearOffset) => {
    const currentDate = getCurrentDateTime();
    const targetDate = new Date(currentDate);
    targetDate.setFullYear(targetDate.getFullYear() + yearOffset);
    return targetDate.getFullYear().toString();
  };

  const getMarkerLabel = (value) => {
    if (viewMode === 'day') {
      const currentHour = getCurrentHour();
      // Handle negative numbers correctly with modulo
      const hourOffset = ((currentHour + value) % 24 + 24) % 24;
      return formatHour(hourOffset, value);
    }
    if (viewMode === 'week') {
      return formatDay(value);
    }
    if (viewMode === 'month') {
      return formatMonth(value);
    }
    if (viewMode === 'year') {
      return formatYear(value);
    }
    return value;
  };

  const is12AM = (value) => {
    if (viewMode !== 'day') return false;
    const currentHour = getCurrentHour();
    const hourOffset = ((currentHour + value) % 24 + 24) % 24;
    return hourOffset === 0;
  };

  const isDestinationMarker = (value) => {
    // We don't want to highlight the destination marker differently
    // This ensures all markers have consistent styling
    return false;
  };

  const isSunday = (value) => {
    if (viewMode !== 'week') return false;
    const currentDate = getCurrentDateTime();
    const targetDate = new Date(currentDate);
    targetDate.setDate(targetDate.getDate() + value);
    return targetDate.getDay() === 0;
  };

  const isJanuary = (value) => {
    if (viewMode !== 'month') return false;
    const currentDate = getCurrentDateTime();
    const targetDate = new Date(currentDate);
    targetDate.setMonth(targetDate.getMonth() + value);
    return targetDate.getMonth() === 0;
  };

  return (
    <Box sx={{
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      transform: `translateX(${timelineOffset}px)`,
      transition: 'transform 0.1s ease-out',
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      pointerEvents: 'none',
      zIndex: 2 // Higher than background
    }}>
      {markers.map((value) => {
        const midnight = is12AM(value);
        const sunday = isSunday(value);
        const january = isJanuary(value);
        const isSpecialMarker = midnight || sunday || january;
        
        // Don't apply special styling to markers that were just navigated to
        const isDestination = isDestinationMarker(value);
        
        return (
          <Box
            key={value}
            sx={{
              position: 'absolute',
              left: `${window.innerWidth/2 + (value * markerSpacing)}px`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              transform: 'translateX(-50%)',
              top: '75%',
              pointerEvents: 'auto',
              ...(value === 0 ? markerStyles.reference : markerStyles.regular),
              '&:hover': {
                '& .marker-line': {
                  backgroundColor: theme.palette.primary.main,
                  height: '20px'
                },
                '& .marker-label': {
                  color: theme.palette.primary.main
                }
              }
            }}
          >
            <Box 
              className="marker-line"
              sx={{
                transition: 'all 0.2s ease-out',
                transform: 'translateY(-50%)',
                height: isSpecialMarker ? '25px' : '15px',
                width: isSpecialMarker ? '3px' : '2px',
                backgroundColor: isDestination ? theme.palette.text.secondary : undefined
              }}
            />
            <Typography 
              className="marker-label"
              variant="caption" 
              sx={{ 
                mt: 2,
                color: value === 0 ? theme.palette.primary.main : theme.palette.text.secondary,
                transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)', // Bouncy transition
                transform: 'scale(1)',
                opacity: 1,
                '@keyframes bubbleIn': {
                  '0%': {
                    opacity: 0,
                    transform: 'scale(0.8)'
                  },
                  '70%': {
                    transform: 'scale(1.1)'
                  },
                  '100%': {
                    opacity: 1,
                    transform: 'scale(1)'
                  }
                },
                animation: 'bubbleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                ...(isSpecialMarker && {
                  fontSize: '0.85rem',
                  fontWeight: 500,
                  padding: '2px 8px',
                  borderRadius: '8px',
                  backgroundColor: theme.palette.mode === 'dark' 
                    ? 'rgba(255, 255, 255, 0.05)'
                    : 'rgba(0, 0, 0, 0.05)',
                  border: `1px solid ${theme.palette.divider}`,
                  marginTop: '8px'
                })
              }}
            >
              {getMarkerLabel(value)}
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
};

export default TimeMarkers;
