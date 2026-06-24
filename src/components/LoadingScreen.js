import React from 'react';
import { Box, CircularProgress, Typography, useTheme, alpha } from '@mui/material';
import { motion } from 'framer-motion';
import TimelineIcon from '@mui/icons-material/Event';

const ConfettiParticle = ({ delay, angle, color }) => {
  const rad = (angle * Math.PI) / 180;
  // Spawn from the mouth of the 🎉 emoji (top-right corner)
  const spawnX = 14;
  const spawnY = -14;

  // Travel distance
  const travelDistance = 60 + Math.random() * 80;
  const endX = spawnX + Math.cos(rad) * travelDistance;
  // Add a gravity drop (+35px) to the final Y position
  const endY = spawnY + Math.sin(rad) * travelDistance + 35;

  const size = Math.random() > 0.4 ? 8 : 6;

  return (
    <Box
      style={{
        '--startX': `${spawnX}px`,
        '--startY': `${spawnY}px`,
        '--midX': `${spawnX + (endX - spawnX) * 0.7}px`,
        '--midY': `${spawnY + (endY - 35 - spawnY) * 0.7 + 10}px`,
        '--endX': `${endX}px`,
        '--endY': `${endY}px`,
      }}
      sx={{
        position: 'absolute',
        width: size,
        height: size,
        top: -size / 2,
        left: -size / 2,
        borderRadius: Math.random() > 0.5 ? '50%' : '2px',
        backgroundColor: color,
        transform: `translate(var(--startX), var(--startY)) scale(0)`,
        animation: `explode 1.8s cubic-bezier(0.1, 0.8, 0.25, 1) forwards`,
        animationDelay: `${delay}s`,
        '@keyframes explode': {
          '0%': {
            transform: `translate(var(--startX), var(--startY)) scale(0) rotate(0deg)`,
            opacity: 1,
          },
          '30%': {
            transform: `translate(var(--midX), var(--midY)) scale(1.3) rotate(180deg)`,
            opacity: 1,
          },
          '100%': {
            transform: `translate(var(--endX), var(--endY)) scale(0) rotate(540deg)`,
            opacity: 0,
          }
        }
      }}
    />
  );
};

function LoadingScreen({ message, cycle = true, isDone = false }) {
  const theme = useTheme();
  const [currentMessage, setCurrentMessage] = React.useState(message || "Loading theme...");

  React.useEffect(() => {
    if (message) {
      setCurrentMessage(message);
      return;
    }
    if (!cycle) return;

    const messages = [
      "Loading theme...",
      "Loading banner...",
      "Loading posts...",
      "Loading timelines..."
    ];
    let index = 0;
    const interval = setInterval(() => {
      index = (index + 1) % messages.length;
      setCurrentMessage(messages[index]);
    }, 700);

    return () => clearInterval(interval);
  }, [message, cycle]);

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        background: theme.palette.mode === 'dark'
          ? 'linear-gradient(135deg, #090e1a 0%, #111827 50%, #1e1b4b 100%)'
          : 'linear-gradient(135deg, #eff6ff 0%, #f3f4f6 50%, #e0e7ff 100%)',
        px: 3,
      }}
    >
      {/* Animated background circles */}
      <Box
        sx={{
          position: 'absolute',
          top: '10%',
          right: '5%',
          width: '35%',
          height: '35%',
          borderRadius: '50%',
          background: theme.palette.mode === 'dark'
            ? 'rgba(99, 102, 241, 0.05)'
            : 'rgba(99, 102, 241, 0.12)',
          filter: 'blur(80px)',
          animation: 'floatCircleOne 12s ease-in-out infinite',
          '@keyframes floatCircleOne': {
            '0%, 100%': { transform: 'translateY(0px) scale(1)' },
            '50%': { transform: 'translateY(-30px) scale(1.05)' },
          },
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: '10%',
          left: '5%',
          width: '30%',
          height: '30%',
          borderRadius: '50%',
          background: theme.palette.mode === 'dark'
            ? 'rgba(14, 165, 233, 0.04)'
            : 'rgba(14, 165, 233, 0.1)',
          filter: 'blur(80px)',
          animation: 'floatCircleTwo 15s ease-in-out infinite reverse',
          '@keyframes floatCircleTwo': {
            '0%, 100%': { transform: 'translateY(0px) scale(1)' },
            '50%': { transform: 'translateY(25px) scale(0.95)' },
          },
        }}
      />

      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        style={{ zIndex: 1 }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            p: { xs: 3.5, sm: 5 },
            borderRadius: 4,
            border: '1px solid',
            borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)',
            background: theme.palette.mode === 'dark'
              ? 'rgba(15, 23, 42, 0.45)'
              : 'rgba(255, 255, 255, 0.7)',
            backdropFilter: 'blur(20px)',
            boxShadow: theme.palette.mode === 'dark'
              ? '0 20px 50px rgba(0, 0, 0, 0.35)'
              : '0 20px 50px rgba(15, 23, 42, 0.06)',
            textAlign: 'center',
            maxWidth: 420,
            width: '100%',
            minHeight: 330,
            justifyContent: 'center',
          }}
        >
          {/* Animated Pulsing Icon */}
          <motion.div
            animate={{
              scale: [1, 1.08, 1],
              opacity: [0.9, 1, 0.9],
            }}
            transition={{
              duration: 2.2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            style={{ marginBottom: 24 }}
          >
            <Box
              sx={{
                width: 76,
                height: 76,
                borderRadius: '50%',
                background: theme.palette.mode === 'dark'
                  ? `linear-gradient(135deg, ${alpha('#3b82f6', 0.2)} 0%, ${alpha('#6366f1', 0.2)} 100%)`
                  : `linear-gradient(135deg, ${alpha('#3b82f6', 0.15)} 0%, ${alpha('#6366f1', 0.15)} 100%)`,
                border: '1px solid',
                borderColor: theme.palette.mode === 'dark' ? 'rgba(99, 102, 241, 0.35)' : 'rgba(99, 102, 241, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: theme.palette.mode === 'dark'
                  ? '0 8px 24px rgba(99, 102, 241, 0.15)'
                  : '0 8px 24px rgba(99, 102, 241, 0.08)',
              }}
            >
              <TimelineIcon
                sx={{
                  fontSize: 36,
                  color: '#6366f1',
                }}
              />
            </Box>
          </motion.div>
 
          {/* App Title */}
          <Typography
            variant="h4"
            sx={{
              fontWeight: 800,
              letterSpacing: 0.5,
              mb: 1.5,
              background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            iTimeline
          </Typography>
 
          {/* Custom Premium Smooth CSS Spinner or Bouncy Celebration */}
          <Box
            sx={{
              width: 80,
              height: 80,
              mb: 3,
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {/* The Spinner (shrinks and fades when done) */}
            <motion.div
              animate={{
                scale: isDone ? 0 : 1,
                opacity: isDone ? 0 : 1,
              }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              style={{
                position: 'absolute',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  border: '3.5px solid',
                  borderColor: theme.palette.mode === 'dark' ? 'rgba(99, 102, 241, 0.15)' : 'rgba(99, 102, 241, 0.08)',
                  borderTopColor: '#6366f1',
                  animation: 'spinSmooth 0.85s linear infinite',
                  '@keyframes spinSmooth': {
                    '0%': { transform: 'rotate(0deg)' },
                    '100%': { transform: 'rotate(360deg)' }
                  }
                }}
              />
            </motion.div>

            {/* Bouncy Celebration Emoji & Confetti (scales up when done) */}
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{
                scale: isDone ? 1.2 : 0,
                opacity: isDone ? 1 : 0,
              }}
              transition={{
                type: 'spring',
                stiffness: 260,
                damping: 15,
              }}
              style={{
                position: 'absolute',
                fontSize: '3rem',
                zIndex: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span style={{ position: 'relative', zIndex: 3 }}>🎉</span>
              {isDone && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    width: 0,
                    height: 0,
                    overflow: 'visible',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    pointerEvents: 'none',
                    zIndex: 1,
                  }}
                >
                  {Array.from({ length: 24 }).map((_, i) => {
                    const angleDeg = -95 + (i * 110) / 23; // spray between -95deg and 15deg (top-right cone)
                    const delay = (i % 4) * 0.08; // smooth staggered start
                    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6', '#eab308'];
                    const color = colors[i % colors.length];
                    return (
                      <ConfettiParticle
                        key={i}
                        angle={angleDeg}
                        delay={delay}
                        color={color}
                      />
                    );
                  })}
                </Box>
              )}
            </motion.div>
          </Box>
 
          {/* Status Message */}
          <Box sx={{ height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography
              variant="body1"
              sx={{
                fontWeight: isDone ? 800 : 600,
                color: isDone ? '#10b981' : theme.palette.text.secondary,
                px: 2,
                whiteSpace: 'nowrap',
                transition: 'all 0.3s ease',
                transform: isDone ? 'scale(1.1)' : 'scale(1)',
              }}
            >
              {isDone ? "DONE!" : currentMessage}
            </Typography>
          </Box>
        </Box>
      </motion.div>
    </Box>
  );
}

export default LoadingScreen;
