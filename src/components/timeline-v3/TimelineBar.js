import React from 'react';
import { Box } from '@mui/material';

const TimelineBar = ({ 
  theme,
  style
}) => {
  return (
    <Box sx={{
      position: 'absolute',
      left: 0,
      right: 0,
      top: '75%',
      height: '2px',
      backgroundColor: theme.palette.primary.main,
      zIndex: 2, // Higher than background
      ...style
    }} />
  );
};

export default TimelineBar;
