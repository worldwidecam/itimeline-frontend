import React, { useState, useEffect } from 'react';
import { Box, Fade } from '@mui/material';

const PageTransition = ({ children }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    
    // Handle page unload
    const handleBeforeUnload = () => {
      setIsVisible(false);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  return (
    <Fade in={isVisible} timeout={600}>
      <Box sx={{
        minHeight: '100vh',
        backgroundColor: theme => theme.palette.mode === 'light' 
          ? theme.palette.background.default 
          : '#000',
        transition: 'background-color 0.6s ease-in-out'
      }}>
        {children}
      </Box>
    </Fade>
  );
};

export default PageTransition;
