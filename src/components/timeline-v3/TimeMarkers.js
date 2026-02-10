import React from 'react';
import { Box, Typography } from '@mui/material';

const TimeMarkers = ({ 
  timelineOffset,
  markerSpacing,
  markerStyles,
  markers,
  viewMode = 'position',
  theme,
  onMarkerClick, // New prop for handling marker clicks
  pointB_active = false, // Whether Point B is active
  pointB_reference_markerValue = 0, // Point B reference marker (integer)
  pointB_reference_timestamp = null, // Point B timestamp (for labels)
  workspaceWidth = null
}) => {
  // Always compute labels from Point A (current time)
  const getCurrentDateTime = () => {
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

  const centerX = (workspaceWidth || window.innerWidth) / 2;

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
      zIndex: 1200 // Higher than workspace/markers for clickable rungs
    }}>
      {markers.map((value) => {
        const midnight = is12AM(value);
        const sunday = isSunday(value);
        const january = isJanuary(value);
        const isSpecialMarker = midnight || sunday || january;
        
        // Check if this is the Point B reference marker
        const isPointBReference = pointB_active && value === pointB_reference_markerValue;
        
        // Don't apply special styling to markers that were just navigated to
        const isDestination = isDestinationMarker(value);
        
        return (
          <Box
            key={value}
            onMouseDown={(event) => event.stopPropagation()}
            onTouchStart={(event) => event.stopPropagation()}
            onClick={() => {
              // TIMELINE V4: Calculate precise timestamp including current minutes
              // This makes timeline marker clicks as accurate as hover marker
              const currentDate = new Date();
              let timestamp = new Date(currentDate);
              
              switch (viewMode) {
                case 'day':
                  // Keep current minutes for precision (e.g., 5:37 PM, not just 5:00 PM)
                  timestamp.setHours(currentDate.getHours() + value);
                  // Minutes and seconds stay at current time
                  break;
                case 'week':
                  // Keep current time of day for precision (e.g., Friday 5:37 PM)
                  timestamp.setDate(currentDate.getDate() + value);
                  // Hours, minutes, seconds stay at current time
                  break;
                case 'month':
                  // Keep current day and time for precision (e.g., Oct 17, 5:37 PM)
                  timestamp.setMonth(currentDate.getMonth() + value);
                  // Day, hours, minutes stay at current time
                  break;
                case 'year':
                  // Keep current month, day, and time for precision (e.g., 2025 Oct 17, 5:37 PM)
                  timestamp.setFullYear(currentDate.getFullYear() + value);
                  // Month, day, hours, minutes stay at current time
                  break;
              }
              
              // Call the click handler if provided
              if (onMarkerClick) {
                onMarkerClick(value, timestamp, viewMode);
              }
            }}
            sx={{
              position: 'absolute',
              left: `${centerX + (value * markerSpacing)}px`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              transform: 'translateX(-50%)',
              top: '75%',
              pointerEvents: 'auto',
              cursor: 'pointer', // Show pointer cursor on hover
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
                // Point B reference: light red/orange, Point A (0): primary, others: default
                backgroundColor: isPointBReference 
                  ? theme.palette.mode === 'dark' ? '#ff6b6b' : '#ff8787'
                  : isDestination 
                    ? theme.palette.text.secondary 
                    : undefined
              }}
            />
            <Typography 
              className="marker-label"
              variant="caption" 
              sx={{ 
                mt: 2,
                // Point B reference: light red/orange, Point A (0): primary blue, others: secondary
                color: isPointBReference
                  ? theme.palette.mode === 'dark' ? '#ff6b6b' : '#ff8787'
                  : value === 0 
                    ? theme.palette.primary.main 
                    : theme.palette.text.secondary,
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
