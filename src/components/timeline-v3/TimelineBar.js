import React from 'react';
import { Box } from '@mui/material';

const TimelineBar = ({ 
  timelineOffset,
  markerSpacing = 100,
  minMarker,
  maxMarker,
  theme,
  style
}) => {
  // Width spans from min to max marker
  const barWidth = (maxMarker - minMarker) * markerSpacing;
  
  return (
    <Box sx={{
      position: 'absolute',
      // Start at the leftmost marker
      left: `${window.innerWidth/2 + (minMarker * markerSpacing)}px`,
      top: '75%',
      height: '2px',
      backgroundColor: theme.palette.primary.main,
      transform: `translateX(${timelineOffset}px)`,
      transition: 'transform 0.1s ease-out',
      width: barWidth,
      zIndex: 2, // Higher than background
      ...style
    }} />
  );
};

export default TimelineBar;
