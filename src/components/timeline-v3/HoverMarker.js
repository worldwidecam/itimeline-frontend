import React from 'react';
import { Box, Typography, useTheme } from '@mui/material';

const HoverMarker = ({ 
  position,
  timelineOffset,
  markerSpacing,
  viewMode
}) => {
  const theme = useTheme();

  const getCurrentTime = () => {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  };

  const getTimeOfDay = () => {
    const now = new Date();
    const hours = now.getHours();
    if (hours < 12) return 'Morning';
    if (hours < 18) return 'Afternoon';
    return 'Evening';
  };

  const getCurrentDayWithTime = () => {
    const now = new Date();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = days[now.getDay()];
    const timeOfDay = getTimeOfDay();
    return `${dayName} ${timeOfDay}`;
  };

  const getCurrentDay = () => {
    return `${getCurrentDayWithTime()}`;
  };

  const getCurrentDayShort = () => {
    const now = new Date();
    const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const date = now.getDate();
    return `${days[now.getDay()]} ${date}${getOrdinalSuffix(date)}`;
  };

  const getCurrentMonthYear = () => {
    const now = new Date();
    return now.toLocaleString('default', { month: 'long', year: 'numeric' });
  };

  const getOrdinalSuffix = (day) => {
    if (day > 3 && day < 21) return 'th';
    switch (day % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  };

  const getLabel = () => {
    if (viewMode === 'day') {
      return getCurrentTime();
    }
    if (viewMode === 'week') {
      return getCurrentDay();
    }
    if (viewMode === 'month') {
      return getCurrentDayShort();
    }
    if (viewMode === 'year') {
      return getCurrentMonthYear();
    }
    return 'You are Here';
  };

  return (
    <Box
      sx={{
        position: 'absolute',
        left: `${window.innerWidth/2 + (position * markerSpacing)}px`,
        top: '50%',
        transform: `translateX(${timelineOffset}px) translateX(-50%)`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        zIndex: 900, // Increased from 2 to 900 (below selected markers at 1000 but above regular markers)
        pointerEvents: 'none'
      }}
    >
      <Typography
        sx={{
          fontFamily: 'Lobster Two',
          fontSize: '1rem',
          color: theme.palette.primary.main,
          marginBottom: '8px',
          padding: '6px 16px',
          borderRadius: '16px',
          backgroundColor: theme.palette.mode === 'dark' 
            ? 'rgba(33, 150, 243, 0.15)'
            : 'rgba(33, 150, 243, 0.08)',
          backdropFilter: 'blur(8px)',
          border: '1px solid',
          borderColor: theme.palette.mode === 'dark'
            ? 'rgba(33, 150, 243, 0.3)'
            : 'rgba(33, 150, 243, 0.2)',
          opacity: 0.95,
          whiteSpace: 'nowrap',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: theme.palette.mode === 'dark'
            ? '0 4px 12px rgba(33, 150, 243, 0.1)'
            : '0 4px 12px rgba(33, 150, 243, 0.05)',
          letterSpacing: '0.02em',
          fontWeight: 500
        }}
      >
        {getLabel()}
      </Typography>
      <Box
        sx={{
          width: '2px',
          height: '40px',
          background: `linear-gradient(180deg, 
            ${theme.palette.primary.main} 0%, 
            ${theme.palette.primary.main}40 100%)`,
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: '-4px',
            left: '-4px',
            right: '-4px',
            height: '8px',
            background: theme.palette.primary.main,
            borderRadius: '4px',
            opacity: 0.8,
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: '-6px',
            right: '-6px',
            bottom: '15px',
            background: theme.palette.primary.main,
            opacity: 0.2,
            filter: 'blur(4px)',
            animation: 'markerPulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
          },
          '@keyframes markerPulse': {
            '0%, 100%': {
              opacity: 0.2,
              transform: 'scaleX(1)',
            },
            '50%': {
              opacity: 0.3,
              transform: 'scaleX(2)',
            },
          }
        }}
      />
    </Box>
  );
};

export default HoverMarker;
