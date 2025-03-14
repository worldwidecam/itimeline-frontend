import React from 'react';
import { Box, Typography, keyframes } from '@mui/material';

// Define animations
const pulseAnimation = keyframes`
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.1); opacity: 0.8; }
  100% { transform: scale(1); opacity: 1; }
`;

const bounceAnimation = keyframes`
  0%, 100% { transform: translateY(0) translateX(-50%); }
  50% { transform: translateY(-3px) translateX(-50%); }
`;

const fadeInAnimation = keyframes`
  from { opacity: 0; transform: translateY(-10px) translateX(-50%); }
  to { opacity: 1; transform: translateY(0) translateX(-50%); }
`;

const PresentTimeMarker = ({ 
  position,
  label = "You are here",
  color = '#000'
}) => {
  return (
    <Box
      sx={{
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        pointerEvents: 'none'
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          left: `${position}px`,
          top: '-35px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          animation: `${fadeInAnimation} 0.3s ease-out`,
          transform: 'translateX(-50%)',
          zIndex: 1000
        }}
      >
        <Typography
          sx={{
            color,
            fontSize: '0.75rem',
            fontWeight: 'bold',
            marginBottom: '4px',
            whiteSpace: 'nowrap',
            animation: `${bounceAnimation} 2s ease-in-out infinite`,
            '&:hover': {
              animation: `${pulseAnimation} 1s ease-in-out infinite`
            }
          }}
        >
          {label}
        </Typography>
        <Box
          sx={{
            width: 0,
            height: 0,
            borderLeft: '6px solid transparent',
            borderRight: '6px solid transparent',
            borderTop: `6px solid ${color}`,
            animation: `${bounceAnimation} 2s ease-in-out infinite`,
            '&:hover': {
              animation: `${pulseAnimation} 1s ease-in-out infinite`
            }
          }}
        />
      </Box>
    </Box>
  );
};

export default PresentTimeMarker;
