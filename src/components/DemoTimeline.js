import React, { useState, useEffect, useRef } from 'react';
import { Box, Paper, Typography, useTheme, IconButton } from '@mui/material';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from '@mui/icons-material';

// Sample timeline events for the demo
const DEMO_EVENTS = [
  {
    id: 1,
    title: "First Computer",
    description: "The first electronic computer, ENIAC, is completed.",
    type: "news",
    position: -5,
    year: 1946
  },
  {
    id: 2,
    title: "Internet Begins",
    description: "ARPANET, the precursor to the internet, sends its first message.",
    type: "news",
    position: -3,
    year: 1969
  },
  {
    id: 3,
    title: "World Wide Web",
    description: "Tim Berners-Lee invents the World Wide Web.",
    type: "media",
    position: 0,
    year: 1989
  },
  {
    id: 4,
    title: "First Smartphone",
    description: "The first iPhone is released, revolutionizing mobile technology.",
    type: "media",
    position: 3,
    year: 2007
  },
  {
    id: 5,
    title: "AI Revolution",
    description: "Large language models transform how we interact with technology.",
    type: "remark",
    position: 5,
    year: 2023
  }
];

const DemoTimeline = () => {
  const theme = useTheme();
  const timelineRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [selectedEventId, setSelectedEventId] = useState(null);
  
  // Colors for different event types
  const eventColors = {
    news: theme.palette.mode === 'dark' ? '#5c6bc0' : '#3f51b5',
    media: theme.palette.mode === 'dark' ? '#26a69a' : '#009688',
    remark: theme.palette.mode === 'dark' ? '#ef5350' : '#f44336'
  };

  // Handle mouse down event for dragging
  const handleMouseDown = (e) => {
    setIsDragging(true);
    setStartX(e.pageX - timelineRef.current.offsetLeft);
    setScrollLeft(timelineRef.current.scrollLeft);
  };

  // Handle mouse leave event
  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  // Handle mouse up event
  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Handle mouse move event for dragging
  const handleMouseMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - timelineRef.current.offsetLeft;
    const walk = (x - startX) * 2; // Adjust scrolling speed
    timelineRef.current.scrollLeft = scrollLeft - walk;
  };

  // Handle event selection
  const handleEventSelect = (eventId) => {
    setSelectedEventId(eventId === selectedEventId ? null : eventId);
  };

  // Handle scroll buttons
  const handleScroll = (direction) => {
    const scrollAmount = direction === 'left' ? -200 : 200;
    if (timelineRef.current) {
      timelineRef.current.scrollBy({
        left: scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  // Center the timeline initially
  useEffect(() => {
    if (timelineRef.current) {
      // Center the timeline on position 0
      const centerPosition = (timelineRef.current.scrollWidth / 2) - (timelineRef.current.clientWidth / 2);
      timelineRef.current.scrollLeft = centerPosition;
    }
  }, []);

  return (
    <Box sx={{ position: 'relative', my: 4, height: 400 }}>
      {/* Timeline container */}
      <Paper
        elevation={3}
        sx={{
          overflow: 'hidden',
          position: 'relative',
          height: '100%',
          borderRadius: 2,
          background: theme.palette.mode === 'dark' ? 'rgba(30, 30, 30, 0.9)' : 'rgba(255, 255, 255, 0.9)',
        }}
      >
        {/* Scroll buttons */}
        <IconButton
          sx={{
            position: 'absolute',
            left: 10,
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 10,
            backgroundColor: theme.palette.background.paper,
            '&:hover': { backgroundColor: theme.palette.action.hover }
          }}
          onClick={() => handleScroll('left')}
        >
          <ChevronLeft />
        </IconButton>
        
        <IconButton
          sx={{
            position: 'absolute',
            right: 10,
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 10,
            backgroundColor: theme.palette.background.paper,
            '&:hover': { backgroundColor: theme.palette.action.hover }
          }}
          onClick={() => handleScroll('right')}
        >
          <ChevronRight />
        </IconButton>

        {/* Timeline track */}
        <Box
          ref={timelineRef}
          sx={{
            display: 'flex',
            alignItems: 'center',
            height: '100%',
            width: '100%',
            overflowX: 'auto',
            position: 'relative',
            cursor: isDragging ? 'grabbing' : 'grab',
            scrollbarWidth: 'none', // Hide scrollbar for Firefox
            '&::-webkit-scrollbar': { display: 'none' }, // Hide scrollbar for Chrome
          }}
          onMouseDown={handleMouseDown}
          onMouseLeave={handleMouseLeave}
          onMouseUp={handleMouseUp}
          onMouseMove={handleMouseMove}
        >
          {/* Timeline markers */}
          <Box sx={{ display: 'flex', minWidth: '200%', position: 'relative', px: 4 }}>
            {/* Timeline line */}
            <Box
              sx={{
                position: 'absolute',
                top: '50%',
                left: 0,
                right: 0,
                height: 4,
                backgroundColor: theme.palette.divider,
                transform: 'translateY(-50%)'
              }}
            />
            
            {/* Marker points */}
            {Array.from({ length: 11 }).map((_, index) => (
              <Box
                key={index}
                sx={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  position: 'relative',
                  pt: 2
                }}
              >
                <Box
                  sx={{
                    width: 2,
                    height: 20,
                    backgroundColor: theme.palette.divider,
                    mb: 1
                  }}
                />
                <Typography variant="caption" color="text.secondary">
                  {index - 5}
                </Typography>
              </Box>
            ))}

            {/* Event cards */}
            {DEMO_EVENTS.map((event) => {
              const isSelected = event.id === selectedEventId;
              
              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ 
                    opacity: 1, 
                    y: 0,
                    scale: isSelected ? 1.05 : 1,
                    boxShadow: isSelected ? `0 0 10px ${eventColors[event.type]}` : 'none'
                  }}
                  transition={{ duration: 0.5, delay: event.id * 0.1 }}
                  onClick={() => handleEventSelect(event.id)}
                  style={{
                    position: 'absolute',
                    left: `${((event.position + 5) / 10) * 100}%`,
                    top: event.id % 2 === 0 ? '65%' : '25%',
                    transform: 'translate(-50%, -50%)',
                    zIndex: isSelected ? 6 : 5,
                    cursor: 'pointer'
                  }}
                >
                  <Paper
                    elevation={isSelected ? 8 : 3}
                    sx={{
                      p: 2,
                      width: 200,
                      borderRadius: 2,
                      borderLeft: `4px solid ${eventColors[event.type]}`,
                      backgroundColor: theme.palette.mode === 'dark' ? 'rgba(40, 40, 40, 0.9)' : 'rgba(255, 255, 255, 0.9)',
                      transition: 'all 0.3s ease-in-out'
                    }}
                  >
                    <Typography variant="subtitle1" gutterBottom>
                      {event.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                      {event.year}
                    </Typography>
                    <Typography variant="body2">
                      {event.description}
                    </Typography>
                  </Paper>
                </motion.div>
              );
            })}
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default DemoTimeline;
