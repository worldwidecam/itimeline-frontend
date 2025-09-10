import React from 'react';
import Box from '@mui/material/Box';
import { keyframes } from '@emotion/react';

const pulse = keyframes`
  0% { transform: scale(0.85); opacity: 0.6; }
  50% { transform: scale(1); opacity: 1; }
  100% { transform: scale(0.85); opacity: 0.6; }
`;

const ThemeTransitionOverlay = () => {
  const positions = [-18, 0, 18];
  return (
    <Box
      aria-live="polite"
      aria-busy="true"
      role="status"
      sx={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.15)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
        pointerEvents: 'none',
        transition: 'opacity 300ms ease',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2,
          p: 2,
          borderRadius: 2,
          background: 'rgba(255,255,255,0.25)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          boxShadow: '0 10px 30px rgba(0,0,0,0.15)'
        }}
      >
        <Box sx={{ fontWeight: 600, letterSpacing: '0.2px', color: 'text.primary' }}>
          Loading your theme...
        </Box>
        <Box sx={{ position: 'relative', width: 64, height: 64 }}>
          {positions.map((dx, i) => (
            <Box
              key={i}
              sx={{
                position: 'absolute',
                borderRadius: '50%',
                width: 18,
                height: 18,
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%) translateX(' + dx + 'px)',
                bgcolor: 'primary.main',
                opacity: 0.8,
                animationName: pulse,
                animationDuration: '1200ms',
                animationTimingFunction: 'ease-in-out',
                animationIterationCount: 'infinite',
                animationDelay: (i * 200) + 'ms',
                '@media (prefers-reduced-motion: reduce)': {
                  animation: 'none',
                },
              }}
            />
          ))}
        </Box>
      </Box>
    </Box>
  );
};

export default ThemeTransitionOverlay;
