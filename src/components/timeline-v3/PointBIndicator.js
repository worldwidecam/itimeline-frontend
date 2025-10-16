import React, { useState, useEffect } from 'react';
import { Box, Typography, useTheme, Fade } from '@mui/material';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';

/**
 * PointBIndicator - Visual indicator showing where Point B (user focus) is located
 * 
 * Point B is the user's focus reference point on the timeline.
 * When active, the timeline UI follows Point B instead of Point A (current time).
 * This solves the "moving ruler" problem where current time updates shift everything.
 * 
 * Visual Design (Simplified):
 * - Animated up arrow pointing at timeline from below
 * - Arrow tip barely touches timeline bottom during pulse animation
 * - Pulsing glow effect around arrow
 * - Clean, minimal design
 * 
 * Positioning:
 * - Arrow appears at the exact coordinate where Point B is set
 * - Uses markerValue and timelineOffset to calculate screen position
 */
const PointBIndicator = ({ 
  active = false,
  markerValue = 0,
  timelineOffset = 0,
  markerSpacing = 100
}) => {
  const theme = useTheme();
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  // Update window width on resize (handles dev console open/close)
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!active) return null;
  
  // Calculate the arrow's position on screen
  // This matches how EventMarker and TimeMarkers calculate positions
  // Uses reactive windowWidth instead of window.innerWidth
  const arrowPosition = windowWidth / 2 + (markerValue * markerSpacing) + timelineOffset;

  return (
    <Fade in={active} timeout={300}>
      <Box
        sx={{
          position: 'absolute',
          left: `${arrowPosition}px`, // Position at the clicked marker
          bottom: '20px', // Position below timeline
          transform: 'translateX(-50%)',
          zIndex: 1100, // Above event markers (1000) and hover marker (900)
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          pointerEvents: 'auto',
          // Smooth transition when arrow moves to new position
          transition: 'left 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
          // Bounce animation on mount - comes from below
          animation: 'bounceUpFromBelow 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
          '@keyframes bounceUpFromBelow': {
            '0%': {
              opacity: 0,
              transform: 'translateX(-50%) translateY(50px) scale(0.8)',
            },
            '50%': {
              transform: 'translateX(-50%) translateY(-5px) scale(1.1)',
            },
            '100%': {
              opacity: 1,
              transform: 'translateX(-50%) translateY(0) scale(1)',
            },
          },
        }}
      >
        {/* Main arrow icon with glow effect */}
        <Box
          sx={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Pulsing glow background - 10% smaller */}
          <Box
            sx={{
              position: 'absolute',
              width: '72px', // 80px * 0.9 = 72px
              height: '72px',
              borderRadius: '50%',
              background: `radial-gradient(circle, ${theme.palette.secondary.main}40 0%, transparent 70%)`,
              animation: 'glowPulse 2s ease-in-out infinite',
              '@keyframes glowPulse': {
                '0%, 100%': {
                  opacity: 0.4,
                  transform: 'scale(1)',
                },
                '50%': {
                  opacity: 0.8,
                  transform: 'scale(1.2)',
                },
              },
            }}
          />

          {/* Arrow icon - pointing up at timeline - 10% smaller with rounded style */}
          <ArrowUpwardIcon
            sx={{
              fontSize: '50.4px', // 56px * 0.9 = 50.4px
              color: theme.palette.secondary.main,
              filter: `drop-shadow(0 0 10.8px ${theme.palette.secondary.main}80)`, // 12px * 0.9 = 10.8px
              position: 'relative',
              zIndex: 1,
              // Make arrow more rounded/modern (only tip stays sharp)
              '& path': {
                strokeLinejoin: 'round',
                strokeLinecap: 'round',
              },
              // Subtle continuous pulse - arrow moves up to barely touch timeline
              animation: 'arrowPulseUp 2s ease-in-out infinite',
              '@keyframes arrowPulseUp': {
                '0%, 100%': {
                  transform: 'translateY(0) scale(1)',
                },
                '50%': {
                  transform: 'translateY(-7.2px) scale(1.045)', // 8px * 0.9 = 7.2px, 1.05 * 0.99 ≈ 1.045
                },
              },
            }}
          />
        </Box>
      </Box>
    </Fade>
  );
};

export default PointBIndicator;
