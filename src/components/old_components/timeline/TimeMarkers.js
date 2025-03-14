import React from 'react';
import { Box, Typography } from '@mui/material';
import PresentTimeMarker from './PresentTimeMarker';

const TimeMarkers = ({ 
  timeMarkers,
  timelineOffset,
  MARKER_SPACING,
  markerStyles,
  theme,
  calculateExactTimePosition,
  currentTime
}) => {
  return (
    <Box sx={{
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      transform: `translateX(${timelineOffset}px)`,
      transition: 'transform 0.1s ease-out',
      width: `${timeMarkers.length * MARKER_SPACING}px`,
      display: 'flex',
      alignItems: 'center'
    }}>
      {/* Time markers */}
      {timeMarkers.map((marker, index) => (
        <Box
          key={index}
          sx={{
            position: 'absolute',
            left: `${marker.position}px`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            transform: 'translateX(-50%)',
            ...(marker.isDay ? {
              bottom: '15px',
              height: '45px',
              justifyContent: 'flex-end'
            } : {
              top: '20%'
            }),
            ...(marker.isDay ? markerStyles.day : 
               marker.isPresent ? markerStyles.currentHour : 
               markerStyles.regular)
          }}
        >
          <Typography 
            className="marker-label"
            variant="caption" 
            sx={{ mb: 1 }}
          >
            {marker.label}
          </Typography>
          <Box className="marker-line" />
        </Box>
      ))}

      {/* Present Time Marker */}
      <PresentTimeMarker position={calculateExactTimePosition(currentTime)} />
    </Box>
  );
};

export default TimeMarkers;
