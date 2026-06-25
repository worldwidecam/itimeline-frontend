import React from 'react';
import { Box, CircularProgress, Typography, useTheme, alpha } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
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
        willChange: 'transform, opacity',
        transformStyle: 'preserve-3d',
        backfaceVisibility: 'hidden',
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

function LoadingScreen({ 
  message, 
  cycle = true, 
  isDone = false,
  onComplete,
  minLoadingTime = 2500, // Enforce 2.5s minimum loading duration for consistent pacing
  celebrationTime = 1800 // Enforce 1.8s celebration/confetti animation duration
}) {
  const theme = useTheme();
  const [currentMessage, setCurrentMessage] = React.useState(message || "Loading theme...");
  
  // Phase state: 'loading' | 'celebration' | 'complete'
  const [phase, setPhase] = React.useState('loading');
  const [minTimeElapsed, setMinTimeElapsed] = React.useState(false);
  const [showConfetti, setShowConfetti] = React.useState(false);

  // 1. Min loading duration timer
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setMinTimeElapsed(true);
    }, minLoadingTime);
    return () => clearTimeout(timer);
  }, [minLoadingTime]);

  // 2. Transition from 'loading' to 'celebration' once loaded AND min time passed
  React.useEffect(() => {
    if (phase === 'loading' && isDone && minTimeElapsed) {
      setPhase('celebration');
    }
  }, [phase, isDone, minTimeElapsed]);

  // 2b. Start confetti delay once we enter celebration phase
  React.useEffect(() => {
    if (phase === 'celebration') {
      const timer = setTimeout(() => {
        setShowConfetti(true);
      }, 360); // Trigger confetti exactly when the emoji reaches its maximum size (60% of its 0.6s bounce animation)
      return () => clearTimeout(timer);
    }
  }, [phase]);

  // 3. Transition from 'celebration' to 'complete' and invoke callback
  React.useEffect(() => {
    if (phase === 'celebration') {
      const timer = setTimeout(() => {
        setPhase('complete');
        if (onComplete) {
          onComplete();
        }
      }, celebrationTime);
      return () => clearTimeout(timer);
    }
  }, [phase, celebrationTime, onComplete]);

  const showDone = phase === 'celebration' || phase === 'complete';

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
    }, 1200); // Relaxed cycle to keep updates smooth and legible

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
          <Box
            sx={{
              marginBottom: 3,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              willChange: 'transform, opacity',
              animation: showDone ? 'none' : 'pulseSmooth 2.2s ease-in-out infinite',
              '@keyframes pulseSmooth': {
                '0%, 100%': {
                  transform: 'scale(1)',
                  opacity: 0.9,
                },
                '50%': {
                  transform: 'scale(1.08)',
                  opacity: 1,
                }
              },
              transition: 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.4s ease',
              transform: showDone ? 'scale(1)' : 'none',
              opacity: showDone ? 0.9 : 'initial',
            }}
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
          </Box>
 
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
            <Box
              sx={{
                position: 'absolute',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                willChange: 'transform, opacity',
                transition: 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease',
                transform: showDone ? 'scale(0)' : 'scale(1)',
                opacity: showDone ? 0 : 1,
                pointerEvents: showDone ? 'none' : 'auto',
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
            </Box>

            {/* Bouncy Celebration Emoji & Confetti (scales up when done) */}
            {showDone && (
              <Box
                sx={{
                  position: 'absolute',
                  fontSize: '3rem',
                  zIndex: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  willChange: 'transform, opacity',
                  animation: 'emojiBouncy 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
                  '@keyframes emojiBouncy': {
                    '0%': {
                      transform: 'scale(0)',
                      opacity: 0,
                    },
                    '60%': {
                      transform: 'scale(1.35)',
                      opacity: 1,
                    },
                    '100%': {
                      transform: 'scale(1.2)',
                      opacity: 1,
                    }
                  }
                }}
              >
                <span style={{ position: 'relative', zIndex: 3 }}>🎉</span>
                {showConfetti && (
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
              </Box>
            )}
          </Box>
 
          {/* Status Message */}
          <Box sx={{ height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative', width: '100%' }}>
            {!showDone ? (
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentMessage}
                  initial={{ scale: 0.7, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.7, opacity: 0 }}
                  transition={{
                    type: 'spring',
                    stiffness: 280,
                    damping: 18,
                  }}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Typography
                    variant="body1"
                    sx={{
                      fontWeight: 600,
                      color: theme.palette.text.secondary,
                      px: 2,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {currentMessage}
                  </Typography>
                </motion.div>
              </AnimatePresence>
            ) : (
              <Box
                sx={{
                  willChange: 'transform, opacity',
                  animation: 'doneBouncy 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
                  '@keyframes doneBouncy': {
                    '0%': {
                      transform: 'scale(0.5)',
                      opacity: 0,
                    },
                    '60%': {
                      transform: 'scale(1.2)',
                      opacity: 1,
                    },
                    '100%': {
                      transform: 'scale(1.15)',
                      opacity: 1,
                    }
                  }
                }}
              >
                <Typography
                  variant="body1"
                  sx={{
                    fontWeight: 800,
                    color: '#10b981',
                    px: 2,
                    whiteSpace: 'nowrap',
                  }}
                >
                  DONE!
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      </motion.div>
    </Box>
  );
}

export default LoadingScreen;
