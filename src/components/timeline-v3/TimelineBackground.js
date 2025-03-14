import React from 'react';
import { Box, useTheme } from '@mui/material';

const TimelineBackground = ({ onBackgroundClick }) => {
  const theme = useTheme();

  const handleClick = (e) => {
    // Only trigger if clicking directly on the background
    if (e.target === e.currentTarget && onBackgroundClick) {
      onBackgroundClick();
    }
  };

  return (
    <Box 
      onClick={handleClick}
      sx={{ 
        flex: 1,
        backgroundColor: theme.palette.mode === 'light' 
          ? 'background.default' 
          : '#000',
        width: '100%',
        minHeight: '50vh',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 0, // Lowest z-index
        pointerEvents: 'auto' // Ensure it can receive clicks
      }} 
    />
  );
};

export default TimelineBackground;
