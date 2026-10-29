import React, { useState, useEffect, useRef } from 'react';
import { Box, ClickAwayListener, Fab, Tooltip, Typography, useTheme } from '@mui/material';
import SvgIcon from '@mui/material/SvgIcon';
import AddIcon from '@mui/icons-material/Add';
import YouTubeIcon from '@mui/icons-material/YouTube';

// TikTok logo — inline SVG (FontAwesome path, viewBox 0 0 448 512)
const TikTokIcon = (props) => (
  <SvgIcon {...props} viewBox="0 0 448 512">
    <path d="M448,209.91a210.06,210.06,0,0,1-122.77-39.25V349.38A162.55,162.55,0,1,1,185,188.31V278.2a74.62,74.62,0,1,0,52.23,71.18V0l88,0a121.18,121.18,0,0,0,1.86,22.17h0A122.18,122.18,0,0,0,381,102.39a121.43,121.43,0,0,0,67,20.14Z" />
  </SvgIcon>
);


// Sub-button definitions — add or remove entries here to change the menu
const SUB_BUTTONS = [
  {
    key: 'cashapp',
    tooltip: 'Donate via CashApp',
    label: '$',
    url: 'https://cash.app/pools/POOL_2a1c9bb2-d3ed-49da-8484-d9b6286921e3',
    accent: { dark: '#00D639', light: '#00b330' },
    step: 58,
    delay: 0.05,
  },
  {
    key: 'patreon',
    tooltip: 'Support on Patreon',
    label: 'P',
    url: '#',
    accent: { dark: '#FF424D', light: '#e5252f' },
    step: 58,
    delay: 0.08,
  },
  {
    key: 'youtube',
    tooltip: 'Follow on YouTube',
    url: 'https://www.youtube.com/@Brahdyssey',
    accent: { dark: '#FF0000', light: '#cc0000' },
    step: 58,
    delay: 0.11,
  },
  {
    key: 'tiktok',
    tooltip: 'Follow on TikTok',
    url: 'https://www.tiktok.com/@brahdyssey?_r=1&_t=ZT-99mvXU8IyD7',
    accent: { dark: '#EE1D52', light: '#c4143f' },
    step: 58,
    delay: 0.14,
  },
];

// Speech bubble — defined outside DonationButtons to prevent re-mounting on every render
const SpeechBubble = ({ visible }) => {
  const [shouldRender, setShouldRender] = useState(visible);
  const [opacity, setOpacity] = useState(0);
  const fadeIntervalRef = useRef(null);

  const clearFade = () => {
    if (fadeIntervalRef.current) {
      clearInterval(fadeIntervalRef.current);
      fadeIntervalRef.current = null;
    }
  };

  // Fade-in
  useEffect(() => {
    clearFade();
    if (visible) {
      setShouldRender(true);
      setOpacity(0);
      setTimeout(() => {
        let current = 0;
        fadeIntervalRef.current = setInterval(() => {
          current += 0.1;
          setOpacity(Math.min(current, 1));
          if (current >= 1) clearFade();
        }, 50);
      }, 10);
    }
    return clearFade;
  }, [visible]);

  // Fade-out
  useEffect(() => {
    if (!visible && shouldRender) {
      clearFade();
      let current = 1;
      setOpacity(1);
      fadeIntervalRef.current = setInterval(() => {
        current -= 0.02;
        if (current <= 0) {
          setOpacity(0);
          clearFade();
          setShouldRender(false);
        } else {
          setOpacity(current);
        }
      }, 60);
    }
    return clearFade;
  }, [visible, shouldRender]);

  if (!shouldRender) return null;

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: '120px',
        right: '20px',
        background: 'rgba(255, 255, 255, 0.92)',
        backdropFilter: 'blur(10px)',
        color: '#1f1f1f',
        padding: '12px 16px',
        borderRadius: '18px',
        border: '3px solid #1f1f1f',
        boxShadow: '6px 6px 0 #1f1f1f',
        fontSize: '16px',
        fontWeight: 700,
        letterSpacing: '0.02em',
        whiteSpace: 'nowrap',
        zIndex: 99999,
        opacity,
        // Tail border (behind)
        '&::after': {
          content: '""',
          position: 'absolute',
          bottom: '-23px',
          right: '22px',
          width: 0,
          height: 0,
          borderLeft: '13px solid transparent',
          borderRight: '13px solid transparent',
          borderTop: '23px solid #1f1f1f',
          zIndex: 99999,
        },
        // Tail fill (front)
        '&::before': {
          content: '""',
          position: 'absolute',
          bottom: '-20px',
          right: '25px',
          width: 0,
          height: 0,
          borderLeft: '10px solid transparent',
          borderRight: '10px solid transparent',
          borderTop: '20px solid rgba(255, 255, 255, 0.92)',
          zIndex: 100000,
        },
      }}
    >
      Support &amp; Follow Us!
    </Box>
  );
};

// Main donation FAB component
const DonationButtons = () => {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const [showBubble, setShowBubble] = useState(false);
  const bubbleTimeoutRef = useRef(null);
  const openRef = useRef(open);

  // Keep ref in sync so speech bubble timeout sees current open state
  useEffect(() => {
    openRef.current = open;
  }, [open]);

  const showSpeechBubble = () => {
    setShowBubble(true);
    bubbleTimeoutRef.current = setTimeout(() => {
      setShowBubble(false);
      // Re-show after 30s only if menu is still closed
      setTimeout(() => {
        if (!openRef.current) showSpeechBubble();
      }, 30000);
    }, 15000);
  };

  // Show bubble on initial load
  useEffect(() => {
    showSpeechBubble();
    return () => {
      if (bubbleTimeoutRef.current) clearTimeout(bubbleTimeoutRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Hide bubble when menu opens
  useEffect(() => {
    if (open) setShowBubble(false);
  }, [open]);

  const handleToggle = () => setOpen((prev) => !prev);
  const handleCollapse = () => setOpen(false);

  // Glassmorphic sub-button style — mirrors NavFab's actionFabSx
  const subButtonSx = (accent, delay) => {
    const accentColor = theme.palette.mode === 'dark' ? accent.dark : accent.light;
    return {
      bgcolor: theme.palette.mode === 'dark'
        ? 'rgba(17, 24, 39, 0.82)'
        : 'rgba(255, 255, 255, 0.88)',
      border: `2px solid ${accentColor}`,
      color: accentColor,
      '&:hover': {
        bgcolor: theme.palette.mode === 'dark'
          ? 'rgba(23, 31, 46, 0.9)'
          : 'rgba(255, 255, 255, 1)',
        boxShadow: `0 0 18px color-mix(in srgb, ${accentColor} 60%, transparent)`,
      },
      boxShadow: `0 0 12px color-mix(in srgb, ${accentColor} 46%, transparent)`,
      transform: open ? 'scale(1)' : 'scale(0.5)',
      transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), background-color 0.2s ease, box-shadow 0.2s ease',
      transitionDelay: open ? `${delay}s` : '0s',
    };
  };

  // Compute cumulative bottom offsets for each sub-button
  let cumulativeBottom = 0;
  const positionedButtons = SUB_BUTTONS.map((btn) => {
    cumulativeBottom += btn.step;
    return { ...btn, bottomOffset: cumulativeBottom };
  });

  const rootContent = (
    <Box
      sx={{
        position: 'fixed',
        bottom: 32,
        right: 32,
        zIndex: 99999,
      }}
    >
      <Box sx={{ position: 'relative' }}>

        {/* Sub-buttons — stack upward when open */}
        {positionedButtons.map((btn) => (
          <Box
            key={btn.key}
            sx={{
              position: 'absolute',
              bottom: open ? btn.bottomOffset : 0,
              right: 0,
              opacity: open ? 1 : 0,
              pointerEvents: open ? 'auto' : 'none',
              transition: 'bottom 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease-in-out',
              transitionDelay: open ? `${btn.delay}s` : '0s',
              zIndex: 99998,
            }}
          >
            <Tooltip title={btn.tooltip} placement="left">
              <Fab
                size="medium"
                onClick={() => window.open(btn.url, '_blank')}
                sx={subButtonSx(btn.accent, btn.delay)}
              >
                {btn.key === 'youtube' ? (
                  <YouTubeIcon />
                ) : btn.key === 'tiktok' ? (
                  <TikTokIcon />
                ) : (
                  <Typography sx={{ fontWeight: 900, fontSize: '1.1rem', lineHeight: 1 }}>
                    {btn.label}
                  </Typography>
                )}
              </Fab>
            </Tooltip>
          </Box>
        ))}

        {/* Main toggle FAB — matches NavFab's AddIcon rotate pattern */}
        <Tooltip title={open ? 'Close' : 'Support & Follow'} placement="left">
          <Fab
            onClick={handleToggle}
            sx={{
              bgcolor: theme.palette.mode === 'dark'
                ? theme.palette.primary.dark
                : theme.palette.success.light,
              color: 'white',
              '&:hover': {
                bgcolor: theme.palette.mode === 'dark'
                  ? theme.palette.primary.main
                  : theme.palette.success.main,
              },
              boxShadow: 3,
              transform: open ? 'rotate(45deg)' : 'rotate(0deg)',
              transition: 'transform 0.3s ease, background-color 0.2s ease',
              zIndex: 99999,
            }}
          >
            <AddIcon />
          </Fab>
        </Tooltip>
      </Box>

      {/* Speech bubble — DOM child so clicks won't trigger ClickAwayListener */}
      <SpeechBubble visible={showBubble && !open} />
    </Box>
  );

  return (
    <ClickAwayListener onClickAway={handleCollapse}>
      {rootContent}
    </ClickAwayListener>
  );
};

export default DonationButtons;
