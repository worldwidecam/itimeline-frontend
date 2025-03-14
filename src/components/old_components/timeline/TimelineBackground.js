import React from 'react';
import { Box, useTheme } from '@mui/material';

const TimelineBackground = () => {
  const theme = useTheme();

  return (
    <Box 
      sx={{ 
        flex: 1,
        backgroundColor: theme.palette.mode === 'light' 
          ? 'background.default' 
          : '#000',
        width: '100%',
        minHeight: '50vh' 
      }} 
    />
  );
};

export default TimelineBackground;
