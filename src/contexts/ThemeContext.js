import React, { createContext, useContext, useState, useEffect } from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { useAuth } from './AuthContext';
import { updateUserPreferences } from '../utils/api';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const CustomThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [showTransition, setShowTransition] = useState(false);
  const [overlayFading, setOverlayFading] = useState(false);
  const { user } = useAuth() || {};

  // Inline overlay to avoid separate JSX module parse issues
  const ThemeTransitionOverlay = () => (
    <Box
      aria-live="polite"
      aria-busy="true"
      role="status"
      sx={{
        position: 'fixed',
        inset: 0,
        background: isDarkMode ? '#000' : '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
        pointerEvents: 'auto',
        opacity: overlayFading ? 0 : 1,
        transition: 'opacity 1000ms ease',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2,
          p: 0,
          transform: overlayFading ? 'translateY(-8px) scale(0.98)' : 'translateY(0) scale(1)',
          transition: 'transform 1000ms ease',
        }}
      >
        <Box sx={{ fontWeight: 700, letterSpacing: '0.3px', color: 'text.primary', fontSize: 18, mb: 1 }}>
          Loading your theme...
        </Box>
        <CircularProgress color="primary" size={48} thickness={4} />
      </Box>
    </Box>
  );

  const darkTheme = createTheme({
    palette: {
      mode: 'dark',
      primary: {
        main: '#90caf9',
        light: '#e3f2fd',
        dark: '#42a5f5',
      },
      secondary: {
        main: '#f48fb1',
        light: '#f8bbd0',
        dark: '#f06292',
      },
      background: {
        default: '#121212',
        paper: '#1e1e1e',
      },
      text: {
        primary: '#ffffff',
        secondary: 'rgba(255, 255, 255, 0.7)',
      },
      divider: 'rgba(255, 255, 255, 0.12)',
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          'html, body, #root': {
            transition: 'background-color 200ms ease, color 200ms ease',
          },
          '@media (prefers-reduced-motion: reduce)': {
            'html, body, #root': {
              transition: 'none',
            }
          },
          body: {
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(100, 100, 100, 0.6) transparent',
            '&::-webkit-scrollbar': {
              width: '10px',
            },
            '&::-webkit-scrollbar-track': {
              background: 'transparent',
              borderRadius: '6px',
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: 'rgba(100, 100, 100, 0.6)',
              borderRadius: '6px',
              border: '2px solid transparent',
            },
            '&::-webkit-scrollbar-thumb:hover': {
              backgroundColor: 'rgba(120, 120, 120, 0.8)',
            },
            '& *::-webkit-scrollbar': {
              width: '10px',
            },
            '& *::-webkit-scrollbar-track': {
              background: 'transparent',
              borderRadius: '6px',
            },
            '& *::-webkit-scrollbar-thumb': {
              backgroundColor: 'rgba(100, 100, 100, 0.6)',
              borderRadius: '6px',
              border: '2px solid transparent',
            },
            '& *::-webkit-scrollbar-thumb:hover': {
              backgroundColor: 'rgba(120, 120, 120, 0.8)',
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: '#1e1e1e',
          },
        },
      },
    },
  });

  const lightTheme = createTheme({
    palette: {
      mode: 'light',
      primary: {
        main: '#1976d2',
        light: '#42a5f5',
        dark: '#1565c0',
      },
      secondary: {
        main: '#9c27b0',
        light: '#ba68c8',
        dark: '#7b1fa2',
      },
      background: {
        default: '#f5f5f5',
        paper: '#ffffff',
      },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          'html, body, #root': {
            transition: 'background-color 200ms ease, color 200ms ease',
          },
          '@media (prefers-reduced-motion: reduce)': {
            'html, body, #root': {
              transition: 'none',
            }
          },
          body: {
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(180, 180, 180, 0.8) transparent',
            '&::-webkit-scrollbar': {
              width: '10px',
            },
            '&::-webkit-scrollbar-track': {
              background: 'transparent',
              borderRadius: '6px',
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: 'rgba(180, 180, 180, 0.8)',
              borderRadius: '6px',
              border: '2px solid transparent',
            },
            '&::-webkit-scrollbar-thumb:hover': {
              backgroundColor: 'rgba(150, 150, 150, 0.9)',
            },
            '& *::-webkit-scrollbar': {
              width: '10px',
            },
            '& *::-webkit-scrollbar-track': {
              background: 'transparent',
              borderRadius: '6px',
            },
            '& *::-webkit-scrollbar-thumb': {
              backgroundColor: 'rgba(180, 180, 180, 0.8)',
              borderRadius: '6px',
              border: '2px solid transparent',
            },
            '& *::-webkit-scrollbar-thumb:hover': {
              backgroundColor: 'rgba(150, 150, 150, 0.9)',
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.05)',
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: '#ffffff',
            color: 'rgba(0, 0, 0, 0.87)',
          },
        },
      },
    },
  });

  const toggleTheme = () => {
    const next = !isDarkMode;
    setIsDarkMode(next);
    try {
      if (user && user.id) {
        // Persist per-user preference
        localStorage.setItem(`theme_pref_user_${user.id}`, next ? 'true' : 'false');
        // For backward compatibility, also set global but do not rely on it for logged-in users
        localStorage.setItem('darkMode', next.toString());
        // Persist to server (fire-and-forget)
        try {
          updateUserPreferences({ theme: next ? 'dark' : 'light' });
        } catch (_) {}
      } else {
        // Guest fallback: maintain legacy behavior
        localStorage.setItem('darkMode', next.toString());
      }
    } catch (_) {}
  };

  useEffect(() => {
    // 1) On the Landing Page ('/') while not logged in, re-roll on every mount/refresh
    const currentPath = typeof window !== 'undefined' ? window.location?.pathname : undefined;
    if (!user && currentPath === '/') {
      const randomDark = Math.random() < 0.5;
      setIsDarkMode(randomDark);
      // Do NOT store to sessionStorage here – we want a re-roll on each refresh
      return;
    }

    // 2) If legacy savedMode exists, respect it (guest or otherwise)
    const savedMode = localStorage.getItem('darkMode');
    if (savedMode !== null) {
      setIsDarkMode(savedMode === 'true');
      return;
    }

    // 3) For other pages (or unknown paths), keep prior session behavior to avoid jarring flips
    const sessionApplied = sessionStorage.getItem('rand_theme_applied');
    if (!sessionApplied) {
      const randomDark = Math.random() < 0.5;
      setIsDarkMode(randomDark);
      sessionStorage.setItem('rand_theme_applied', 'true');
      sessionStorage.setItem('rand_theme_value', randomDark ? 'true' : 'false');
    } else {
      const v = sessionStorage.getItem('rand_theme_value');
      if (v === 'true' || v === 'false') setIsDarkMode(v === 'true');
    }
  }, [user]);

  // When the authenticated user changes, apply their per-user preference if present
  useEffect(() => {
    try {
      if (user && user.id) {
        const userPref = localStorage.getItem(`theme_pref_user_${user.id}`);
        if (userPref === 'true' || userPref === 'false') {
          const val = userPref === 'true';
          // If applying a different theme than current, show a short transition overlay
          if (val !== isDarkMode) {
            setShowTransition(true);
          }
          setIsDarkMode(val);
          // Set global for compatibility with any legacy checks
          localStorage.setItem('darkMode', val.toString());
          // Two-phase hide: 3s total visible, fade last 1000ms with slight slide+scale
          if (val !== isDarkMode) {
            setOverlayFading(false);
            const t1 = setTimeout(() => setOverlayFading(true), 2000); // start fade
            const t2 = setTimeout(() => setShowTransition(false), 3000); // unmount
            return () => { clearTimeout(t1); clearTimeout(t2); };
          }
        }
      }
    } catch (_) {}
  }, [user?.id]);

  useEffect(() => {
    // Apply to both HTML and body elements
    const htmlElement = document.documentElement;
    const bodyElement = document.body;
    
    if (isDarkMode) {
      htmlElement.classList.add('dark-mode');
      bodyElement.classList.add('dark-mode');
    } else {
      htmlElement.classList.remove('dark-mode');
      bodyElement.classList.remove('dark-mode');
    }
  }, [isDarkMode]);

  // Optional helper: allow callers to explicitly apply a preferred theme string ('dark'|'light')
  const applyPreferredTheme = (pref) => {
    const val = pref === 'dark' ? true : pref === 'light' ? false : null;
    if (val === null) return;
    setIsDarkMode(val);
    try {
      if (user && user.id) {
        localStorage.setItem(`theme_pref_user_${user.id}`, val ? 'true' : 'false');
      }
      localStorage.setItem('darkMode', val ? 'true' : 'false');
    } catch (_) {}
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme, applyPreferredTheme }}>
      <ThemeProvider theme={isDarkMode ? darkTheme : lightTheme}>
        {children}
        {showTransition && <ThemeTransitionOverlay />}
      </ThemeProvider>
    </ThemeContext.Provider>
  );
};
