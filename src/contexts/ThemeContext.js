import React, { createContext, useContext, useState, useEffect } from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const CustomThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(true);

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
    setIsDarkMode(prev => !prev);
    localStorage.setItem('darkMode', (!isDarkMode).toString());
  };

  useEffect(() => {
    const savedMode = localStorage.getItem('darkMode');
    if (savedMode !== null) {
      setIsDarkMode(savedMode === 'true');
    }
  }, []);

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

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
      <ThemeProvider theme={isDarkMode ? darkTheme : lightTheme}>
        {children}
      </ThemeProvider>
    </ThemeContext.Provider>
  );
};
