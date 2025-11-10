import React, { useState, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
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
  markerSpacing = 100,
  label
}) => {
  const theme = useTheme();
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const containerRef = useRef(null);

  // Update window width on resize (handles dev console open/close)
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Calculate the arrow's position on screen (memoized)
  const arrowPosition = useMemo(() => {
    return windowWidth / 2 + (markerValue * markerSpacing) + timelineOffset;
  }, [windowWidth, markerValue, markerSpacing, timelineOffset]);

  // Apply transform updates via rAF and useLayoutEffect to avoid initial flash
  useLayoutEffect(() => {
    let rafId;
    const el = containerRef.current;
    if (!el || !active) return;
    const apply = () => {
      el.style.transform = `translate3d(${arrowPosition}px, 0, 0) translateX(-50%)`;
    };
    rafId = requestAnimationFrame(apply);
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [arrowPosition, active]);

  // Keep hooks order stable; conditionally render after hooks are set up
  if (!active) return null;

  return (
    <Fade in={active} timeout={300}>
      <Box
        ref={containerRef}
        sx={{
          position: 'absolute',
          left: 0,
          bottom: '2px', // Sit directly below the baseline without overlapping
          willChange: 'transform',
          zIndex: 1100, // Above event markers (1000) and hover marker (900)
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          pointerEvents: 'auto',
          // Smooth transition when arrow moves to new position
          transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
        {/* Animation wrapper to avoid overriding container's horizontal transform */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            // Bounce on mount, then subtle float loop (vertical only)
            animation: 'bounceUpFromBelow 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55), floatY 2.4s ease-in-out 0.6s infinite alternate',
            '@keyframes bounceUpFromBelow': {
              '0%': {
                opacity: 0,
                transform: 'translateY(50px) scale(0.8)',
              },
              '50%': {
                transform: 'translateY(-3px) scale(1.06)', // smaller peak to avoid intersecting baseline
              },
              '100%': {
                opacity: 1,
                transform: 'translateY(0) scale(1)',
              },
            },
            '@keyframes floatY': {
              '0%': {
                transform: 'translateY(0)'
              },
              '100%': {
                transform: 'translateY(-4px)'
              }
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
            <ArrowUpwardIcon sx={{ fontSize: 28, color: theme.palette.error.main }} />
          </Box>
        </Box>
        {/* Keep label outside animated wrapper so it doesn't bob */}
        {label && (
          <Typography 
            variant="caption"
            sx={{
              mt: '12px',
              opacity: 0.95,
              fontFamily: 'Lobster Two',
              fontSize: '0.9rem',
              color: theme.palette.error.main,
              padding: '5px 14px',
              borderRadius: '16px',
              backgroundColor: theme.palette.mode === 'dark' 
                ? 'rgba(244, 67, 54, 0.15)'
                : 'rgba(244, 67, 54, 0.08)',
              backdropFilter: 'blur(8px)',
              border: '1px solid',
              borderColor: theme.palette.mode === 'dark'
                ? 'rgba(244, 67, 54, 0.25)'
                : 'rgba(244, 67, 54, 0.18)',
              boxShadow: theme.palette.mode === 'dark'
                ? '0 4px 12px rgba(244, 67, 54, 0.10)'
                : '0 4px 12px rgba(244, 67, 54, 0.06)',
              whiteSpace: 'nowrap',
              letterSpacing: '0.02em',
            }}
          >
            {label}
          </Typography>
        )}
      </Box>
    </Fade>
  );
};

export default PointBIndicator;
