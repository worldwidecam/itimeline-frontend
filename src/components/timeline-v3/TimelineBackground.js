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
        background: theme.palette.mode === 'light' 
          ? 'linear-gradient(180deg, #ffd5c8 0%, #ffeae0 40%, #f7f4ea 75%, #f5f1e4 90%, #ffffff 100%)' 
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
