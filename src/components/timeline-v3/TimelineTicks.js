import React from 'react';
import { Box, useTheme } from '@mui/material';

const TimelineTicks = ({
  timelineOffset = 0,
  markerSpacing = 100,
  buffer = 1,
  baselineTop = '75%',
  tickHeight = 14
}) => {
  const theme = useTheme();
  const viewportWidth = window.innerWidth || 1;
  const visibleCount = Math.ceil(viewportWidth / markerSpacing) + buffer;
  const totalTicks = visibleCount % 2 === 0 ? visibleCount + 1 : visibleCount;
  const half = Math.floor(totalTicks / 2);
  const shift = timelineOffset % markerSpacing;

  return (
    <Box sx={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 2 }}>
      {Array.from({ length: totalTicks }, (_, index) => {
        const value = index - half;
        return (
          <Box
            key={value}
            sx={{
              position: 'absolute',
              left: `${(viewportWidth / 2) + (value * markerSpacing) + shift}px`,
              top: baselineTop,
              width: '2px',
              height: tickHeight,
              backgroundColor: theme.palette.text.secondary,
              transform: 'translate(-50%, -50%)',
              opacity: 0.85
            }}
          />
        );
      })}
    </Box>
  );
};

export default TimelineTicks;
