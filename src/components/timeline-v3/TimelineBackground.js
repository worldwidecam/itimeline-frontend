import React from 'react';
import { Box, useTheme } from '@mui/material';

const TimelineBackground = ({ 
  onBackgroundClick,
  onWheel,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  onMouseLeave
}) => {
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
      onWheel={onWheel}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseLeave}
      sx={{ 
        flex: 1,
        background: theme.palette.mode === 'light' 
          ? 'linear-gradient(180deg, #ffb199 0%, #ffd5c8 20%, #ffeae0 45%, #f7f4ea 75%, #f5f1e4 90%, #ffffff 100%)' 
          : 'linear-gradient(180deg, #000000 0%, #0a1128 50%, #1a2456 100%)',
        width: '100%',
        minHeight: '50vh',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 0, // Lowest z-index
        pointerEvents: 'auto', // Ensure it can receive clicks
        cursor: 'grab', // Show grab cursor
        '&:active': {
          cursor: 'grabbing' // Show grabbing cursor when dragging
        }
      }} 
    />
  );
};

export default TimelineBackground;
