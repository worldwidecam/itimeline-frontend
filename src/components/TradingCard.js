import React from 'react';
import { Box, useTheme } from '@mui/material';

const TradingCard = React.forwardRef(({
  active,
  onClick,
  front,
  back,
  cardType = 'login', // 'login', 'register', 'recover', 'goblin'
  width = { xs: 'clamp(300px, 85vw, 340px)', md: 'clamp(310px, 22vw, 360px)' },
  height = { xs: 'clamp(465px, 65vh, 535px)', md: 'clamp(480px, 64vh, 580px)' },
  tiltAngle = 0,
  anyCardActive = false,
  fanningY = 0,
  preHovered = false,
  sx = {},
}, ref) => {
  const theme = useTheme();

  const getThemeColors = () => {
    const isDark = theme.palette.mode === 'dark';
    const themes = {
      login: {
        border: isDark ? '#04132b' : '#0e234e', // Much darker blue/navy
        glow: '#3b82f6',
      },
      register: {
        border: isDark ? '#2b1100' : '#4d1d02', // Much darker gold/amber
        glow: '#f59e0b',
      },
      recover: {
        border: isDark ? '#1b0430' : '#320b54', // Much darker purple
        glow: '#c084fc',
      },
      goblin: {
        border: isDark ? '#14532d' : '#166534',
        glow: isDark ? '#39ff14' : '#22c55e',
      }
    };
    return themes[cardType] || themes.login;
  };

  const colors = getThemeColors();
  const isDark = theme.palette.mode === 'dark';
  const innerBg = isDark ? '#0f0f15' : '#f8fafc';

  const cardFaceStyle = {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backfaceVisibility: 'hidden',
    WebkitBackfaceVisibility: 'hidden',
    borderRadius: '18px',
    overflow: 'hidden',
    padding: '8px', // Dynamic 8px beveled border using padding
    backgroundImage: cardType === 'register'
      ? `linear-gradient(135deg, ${colors.glow} 0%, ${colors.border} 100%)`
      : `linear-gradient(135deg, ${colors.border} 0%, ${colors.glow} 100%)`,
    transition: 'box-shadow 0.3s ease-in-out',
    WebkitFontSmoothing: 'antialiased',
    MozOsxFontSmoothing: 'grayscale',
    transform: 'translateZ(0)',
  };

  // Beveled outer neon glows
  const backShadow = isDark
    ? `inset 0 0 0 1.5px ${colors.glow}50, inset 0 0 0 3px rgba(0,0,0,0.5), 0 8px 24px rgba(0, 0, 0, 0.5), 0 0 10px ${colors.glow}30`
    : `inset 0 0 0 1.5px ${colors.glow}40, inset 0 0 0 3px rgba(255,255,255,0.4), 0 8px 24px rgba(0, 0, 0, 0.15), 0 0 8px ${colors.glow}20`;

  const backHoverShadow = isDark
    ? `inset 0 0 0 1.5px ${colors.glow}, inset 0 0 0 3px rgba(0,0,0,0.5), 0 12px 30px rgba(0, 0, 0, 0.6), 0 0 20px ${colors.glow}60`
    : `inset 0 0 0 1.5px ${colors.glow}, inset 0 0 0 3px rgba(255,255,255,0.4), 0 12px 28px rgba(0, 0, 0, 0.25), 0 0 15px ${colors.glow}40`;

  const frontShadow = isDark
    ? `inset 0 0 0 1.5px ${colors.glow}, inset 0 0 0 4px rgba(0,0,0,0.6), 0 0 6px #fff, 0 0 15px ${colors.glow}, 0 0 30px ${colors.glow}80, 0 12px 35px rgba(0, 0, 0, 0.6)`
    : `inset 0 0 0 1.5px ${colors.glow}, inset 0 0 0 4px rgba(255,255,255,0.6), 0 0 5px ${colors.glow}, 0 0 12px ${colors.glow}, 0 12px 30px rgba(0, 0, 0, 0.25)`;

  const getOuterTransform = () => {
    if (active) {
      return {
        xs: 'translateY(0px) scale(1.0) rotate(0deg)',
        md: 'translateY(-28px) scale(1.0) rotate(0deg)',
      };
    }
    if (anyCardActive) {
      return {
        xs: `translateY(24px) scale(0.72) rotate(${tiltAngle}deg)`,
        md: `translateY(24px) scale(0.75) rotate(${tiltAngle}deg)`,
      };
    }
    if (preHovered) {
      return {
        xs: `translateY(0px) scale(0.8) rotate(${tiltAngle}deg)`,
        md: `translateY(${-18 + fanningY}px) scale(0.88) rotate(0deg)`,
      };
    }
    return {
      xs: `translateY(0px) scale(0.8) rotate(${tiltAngle}deg)`,
      md: `translateY(${fanningY}px) scale(0.8) rotate(${tiltAngle}deg)`,
    };
  };

  const getOuterOpacity = () => {
    if (active) return 1;
    if (anyCardActive) return 0.35;
    return 1;
  };

  return (
    <Box
      ref={ref}
      sx={{
        perspective: '1000px',
        width,
        height,
        cursor: active ? 'default' : 'pointer',
        scrollSnapAlign: 'center',
        flexShrink: 0,
        transform: getOuterTransform(),
        opacity: getOuterOpacity(),
        pointerEvents: anyCardActive && !active ? 'none' : 'auto',
        transition: 'transform 0.5s cubic-bezier(0.25, 0.8, 0.25, 1), opacity 0.5s ease',
        zIndex: active ? 20 : 1,
        ...((!active && !anyCardActive) ? {
          '&:hover': {
            transform: {
              xs: `translateY(0px) scale(0.8) rotate(${tiltAngle}deg)`,
              md: `translateY(${-18 + fanningY}px) scale(0.88) rotate(0deg)`,
            },
            zIndex: 10,
            '& .card-back-face': {
              boxShadow: backHoverShadow,
            }
          }
        } : {}),
        ...sx,
      }}
      onClick={(e) => {
        e.stopPropagation(); // Prevent propagation up to page container click-out handler
        if (!active && onClick) {
          onClick(e);
        }
      }}
    >
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          height: '100%',
          transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
          transformStyle: 'preserve-3d',
          transform: active ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}
      >
        {/* Card Back (Inactive Face) */}
        <Box
          className="card-back-face"
          sx={{
            ...cardFaceStyle,
            boxShadow: preHovered ? backHoverShadow : backShadow,
          }}
        >
          <Box
            sx={{
              width: '100%',
              height: '100%',
              borderRadius: '10px',
              overflow: 'hidden',
              background: innerBg,
              '& > *': { borderRadius: '10px', overflow: 'hidden' }, // Forces inner components to round their corners, preventing visual corner leak
            }}
          >
            {back}
          </Box>
        </Box>

        {/* Card Front (Active Face) */}
        <Box
          sx={{
            ...cardFaceStyle,
            transform: 'rotateY(180deg) translateZ(0)',
            boxShadow: frontShadow,
          }}
        >
          <Box
            sx={{
              width: '100%',
              height: '100%',
              borderRadius: '10px',
              overflow: 'hidden',
              background: innerBg,
              WebkitFontSmoothing: 'antialiased',
              MozOsxFontSmoothing: 'grayscale',
              transform: 'translateZ(0)',
              '& > *': { borderRadius: '10px', overflow: 'hidden' }, // Forces inner components to round their corners, preventing visual corner leak
            }}
          >
            {front}
          </Box>
        </Box>
      </Box>
    </Box>
  );
});

export default TradingCard;
