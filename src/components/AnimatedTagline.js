import React, { useState, useEffect } from 'react';
import { Typography, Box, useTheme } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';

const AnimatedTagline = () => {
  const theme = useTheme();
  
  // Array of finishing sentence endings
  const endings = [
    "your marriage",
    "family memories",
    "an upcoming video game",
    "Survivor",
    "YouTube drama",
    "Cold Cases",
    "The Epstein Files",
    "your next vacation",
    "a historical event",
    "your career journey",
    "a personal project",
    "your fitness goals",
    "a book series",
    "a TV show marathon",
    "your education path",
    "a business venture",
    "your home renovation",
    "a music album",
    "a scientific discovery",
    "a political campaign",
    "Fascism",
    "ICE Raids",
    "Science Breakthroughs",
    "Your Weightloss Journey",
    "Your Local Karen"
  ];
  
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Cycle through endings
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex(prevIndex => (prevIndex + 1) % endings.length);
    }, 3000); // Change every 3 seconds
    
    return () => clearInterval(interval);
  }, [endings.length]);
  
  // Animation variants
  const textVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.3, // Fast fade-in
        ease: "easeOut" 
      } 
    },
    exit: { 
      opacity: 0, 
      y: -20,
      transition: { 
        duration: 0.3, // Fast fade-out
        ease: "easeIn" 
      } 
    }
  };
  
  // Generate random color for each ending
  const getRandomColor = () => {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', 
      '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
      '#F8C471', '#82E0AA', '#F1948A', '#85C1E9', '#FAD7A0'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };
  
  return (
    <Box sx={{ textAlign: 'center', mb: 4 }}>
      {/* Leading sentence */}
      <Typography 
        variant="h5" 
        component="h2"
        sx={{ 
          mb: 1,
          maxWidth: 700,
          mx: 'auto',
          color: theme.palette.text.primary,
          fontWeight: 500
        }}
      >
        Create personal timelines or entire communities to keep track of...
      </Typography>
      
      {/* Animated finishing sentence */}
      <Box sx={{ height: '2.5rem', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            variants={textVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            style={{
              display: 'inline-block',
              width: '100%',
              maxWidth: 400
            }}
          >
            <Typography 
              variant="h5" 
              component="span"
              sx={{ 
                color: getRandomColor(),
                fontWeight: 600,
                textShadow: '0 0 8px rgba(255, 255, 255, 0.3)',
                display: 'inline-block'
              }}
            >
              {endings[currentIndex]}
            </Typography>
          </motion.div>
        </AnimatePresence>
      </Box>
    </Box>
  );
};

export default AnimatedTagline;
