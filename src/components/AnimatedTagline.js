import React, { useState, useEffect } from 'react';
import { Typography, Box, useTheme } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { getLandingRotatorSettings } from '../utils/api';

const AnimatedTagline = () => {
  const theme = useTheme();
  
  const defaultLeadSentence = 'Create personal timelines or entire communities to keep track of...';
  const defaultEndings = [
    'your marriage',
    'family memories',
    'an upcoming video game',
    'Survivor',
    'YouTube drama',
    'Cold Cases',
    'The Epstein Files',
    'your next vacation',
    'a historical event',
    'your career journey',
    'a personal project',
    'your fitness goals',
    'a book series',
    'a TV show marathon',
    'your education path',
    'a business venture',
    'your home renovation',
    'a music album',
    'a scientific discovery',
    'a political campaign',
    'Fascism',
    'ICE Raids',
    'Science Breakthroughs',
    'Your Weightloss Journey',
    'Your Local Karen'
  ];
  const defaultIntervalMs = 3000;

  const [leadSentence, setLeadSentence] = useState(defaultLeadSentence);
  const [endings, setEndings] = useState(defaultEndings);
  const [rotationIntervalMs, setRotationIntervalMs] = useState(defaultIntervalMs);
  const [randomizeEndings, setRandomizeEndings] = useState(false);
  
  const [currentIndex, setCurrentIndex] = useState(0);
  
  useEffect(() => {
    let active = true;
    const loadSettings = async () => {
      try {
        const data = await getLandingRotatorSettings();
        if (!active) return;
        const settings = data?.landing_rotator || {};
        setLeadSentence(settings.lead_sentence || defaultLeadSentence);
        setEndings(Array.isArray(settings.endings) ? settings.endings : defaultEndings);
        setRotationIntervalMs(Number(settings.rotation_interval_ms) || defaultIntervalMs);
        setRandomizeEndings(Boolean(settings.randomize));
      } catch (error) {
        if (!active) return;
        setLeadSentence(defaultLeadSentence);
        setEndings(defaultEndings);
        setRotationIntervalMs(defaultIntervalMs);
        setRandomizeEndings(false);
      }
    };

    loadSettings();

    return () => {
      active = false;
    };
  }, []);

  // Cycle through endings
  useEffect(() => {
    if (!endings.length) return undefined;
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => {
        if (randomizeEndings && endings.length > 1) {
          let nextIndex = prevIndex;
          while (nextIndex === prevIndex) {
            nextIndex = Math.floor(Math.random() * endings.length);
          }
          return nextIndex;
        }
        return (prevIndex + 1) % endings.length;
      });
    }, rotationIntervalMs || defaultIntervalMs);

    return () => clearInterval(interval);
  }, [endings.length, rotationIntervalMs, randomizeEndings]);

  useEffect(() => {
    setCurrentIndex(0);
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
        {leadSentence}
      </Typography>
      
      {/* Animated finishing sentence */}
      {endings.length > 0 && (
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
      )}
    </Box>
  );
};

export default AnimatedTagline;
