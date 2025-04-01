import React, { useState, useRef, useEffect } from 'react';
import { Box, Container, useTheme, Button, Stack, Typography, Paper, IconButton, ToggleButtonGroup, ToggleButton, Tooltip } from '@mui/material';
import { 
  ChevronLeft, 
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Info as InfoIcon,
  CalendarToday,
  DateRange,
  ViewWeek,
  ViewDay,
  Timeline as TimelineIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';

// Sample demo events with more personal content
const DEMO_EVENTS = [
  {
    id: 1,
    title: "Tommy's 3rd Birthday",
    description: "Tommy had a dinosaur-themed party with all his friends from daycare.",
    type: "remark",
    position: -5,
    date: "2023-04-15",
    tags: ["family", "birthday", "milestone"]
  },
  {
    id: 2,
    title: "Family Reunion",
    description: "Annual Johnson family reunion at Lake Tahoe with over 30 family members.",
    type: "media",
    position: -3,
    date: "2023-07-22",
    tags: ["family", "vacation", "annual"]
  },
  {
    id: 3,
    title: "First Day of School",
    description: "Emma started kindergarten today. She was so excited to meet her new teacher!",
    type: "news",
    position: 0,
    date: "2023-09-05",
    tags: ["family", "school", "milestone"]
  },
  {
    id: 4,
    title: "House Purchase",
    description: "Finally closed on our dream home after 6 months of searching.",
    type: "media",
    position: 3,
    date: "2024-01-15",
    tags: ["milestone", "home", "finance"]
  },
  {
    id: 5,
    title: "Marathon Completed",
    description: "Finished my first full marathon in 4 hours and 12 minutes!",
    type: "remark",
    position: 5,
    date: "2024-03-10",
    tags: ["achievement", "fitness", "personal"]
  }
];

// Historical events for the year view
const HISTORICAL_EVENTS = [
  {
    id: 6,
    title: "Moon Landing",
    description: "Neil Armstrong became the first human to step on the moon.",
    type: "news",
    position: -40,
    date: "1969-07-20",
    tags: ["history", "space", "achievement"]
  },
  {
    id: 7,
    title: "World Wide Web",
    description: "Tim Berners-Lee invented the World Wide Web, transforming global communication.",
    type: "media",
    position: -20,
    date: "1989-03-12",
    tags: ["history", "technology", "internet"]
  },
  {
    id: 8,
    title: "First Smartphone",
    description: "Apple released the first iPhone, revolutionizing mobile technology.",
    type: "media",
    position: -10,
    date: "2007-06-29",
    tags: ["history", "technology", "mobile"]
  }
];

function LandingPageTimeline() {
  const theme = useTheme();
  const timelineRef = useRef(null);
  const [position, setPosition] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [viewMode, setViewMode] = useState('position');
  const [events, setEvents] = useState(DEMO_EVENTS);
  
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
    
    // Update position based on scroll
    const newPosition = Math.round((timelineRef.current.scrollLeft / timelineRef.current.scrollWidth) * 10) - 5;
    setPosition(newPosition);
  };

  // Handle scroll buttons
  const handleScroll = (direction) => {
    const scrollAmount = direction === 'left' ? -300 : 300;
    if (timelineRef.current) {
      timelineRef.current.scrollBy({
        left: scrollAmount,
        behavior: 'smooth'
      });
    }
  };
  
  // Handle zoom controls
  const handleZoom = (direction) => {
    if (direction === 'in') {
      setZoomLevel(prev => Math.min(prev * 1.2, 2));
    } else {
      setZoomLevel(prev => Math.max(prev / 1.2, 0.5));
    }
  };
  
  // Handle event selection
  const handleEventClick = (event) => {
    setSelectedEvent(selectedEvent && selectedEvent.id === event.id ? null : event);
  };
  
  // Handle view mode change
  const handleViewModeChange = (event, newMode) => {
    if (newMode !== null) {
      setViewMode(newMode);
      
      // Change events based on view mode
      if (newMode === 'year') {
        setEvents([...DEMO_EVENTS, ...HISTORICAL_EVENTS]);
      } else {
        setEvents(DEMO_EVENTS);
      }
      
      // Reset selection when changing view mode
      setSelectedEvent(null);
    }
  };
  
  // Get marker label based on view mode
  const getMarkerLabel = (index) => {
    const value = index - 5;
    
    if (viewMode === 'day') {
      const now = new Date();
      const hour = now.getHours() + value;
      return `${hour % 12 || 12}${hour < 12 || hour >= 24 ? 'AM' : 'PM'}`;
    }
    
    if (viewMode === 'week') {
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const now = new Date();
      const day = new Date(now);
      day.setDate(now.getDate() + value);
      return days[day.getDay()];
    }
    
    if (viewMode === 'month') {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const now = new Date();
      const month = new Date(now);
      month.setMonth(now.getMonth() + value);
      return months[month.getMonth()];
    }
    
    if (viewMode === 'year') {
      const now = new Date();
      return (now.getFullYear() + value).toString();
    }
    
    return value.toString();
  };
  
  // Center the timeline initially
  useEffect(() => {
    if (timelineRef.current) {
      // Center the timeline
      timelineRef.current.scrollLeft = (timelineRef.current.scrollWidth - timelineRef.current.clientWidth) / 2;
    }
  }, [viewMode]);

  return (
    <Box 
      sx={{ 
        position: 'relative',
        height: 400,
        overflow: 'hidden',
        borderRadius: 2,
        boxShadow: 3,
        backgroundColor: theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.8)',
      }}
    >
      {/* Timeline Controls */}
      <Box 
        sx={{ 
          position: 'absolute',
          top: 16,
          left: 16,
          right: 16,
          zIndex: 10,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <Typography variant="h6" sx={{ 
          textShadow: theme.palette.mode === 'dark' ? '0 0 10px rgba(255,255,255,0.3)' : '0 0 10px rgba(0,0,0,0.3)',
          fontWeight: 'bold'
        }}>
          Interactive Timeline Demo
        </Typography>
        
        <Stack direction="row" spacing={1}>
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={handleViewModeChange}
            aria-label="timeline view mode"
            size="small"
            sx={{ 
              backgroundColor: theme.palette.background.paper,
              borderRadius: 1,
              mr: 2
            }}
          >
            <ToggleButton value="position" aria-label="coordinate view">
              <Tooltip title="Coordinate View">
                <TimelineIcon fontSize="small" />
              </Tooltip>
            </ToggleButton>
            <ToggleButton value="day" aria-label="day view">
              <Tooltip title="Day View">
                <ViewDay fontSize="small" />
              </Tooltip>
            </ToggleButton>
            <ToggleButton value="week" aria-label="week view">
              <Tooltip title="Week View">
                <ViewWeek fontSize="small" />
              </Tooltip>
            </ToggleButton>
            <ToggleButton value="month" aria-label="month view">
              <Tooltip title="Month View">
                <DateRange fontSize="small" />
              </Tooltip>
            </ToggleButton>
            <ToggleButton value="year" aria-label="year view">
              <Tooltip title="Year View">
                <CalendarToday fontSize="small" />
              </Tooltip>
            </ToggleButton>
          </ToggleButtonGroup>
          
          <IconButton 
            size="small"
            onClick={() => handleScroll('left')}
            sx={{ 
              backgroundColor: theme.palette.background.paper,
              '&:hover': { backgroundColor: theme.palette.action.hover }
            }}
          >
            <ChevronLeft />
          </IconButton>
          <IconButton 
            size="small"
            onClick={() => handleZoom('out')}
            sx={{ 
              backgroundColor: theme.palette.background.paper,
              '&:hover': { backgroundColor: theme.palette.action.hover }
            }}
          >
            <ZoomOut />
          </IconButton>
          <IconButton 
            size="small"
            onClick={() => handleZoom('in')}
            sx={{ 
              backgroundColor: theme.palette.background.paper,
              '&:hover': { backgroundColor: theme.palette.action.hover }
            }}
          >
            <ZoomIn />
          </IconButton>
          <IconButton 
            size="small"
            onClick={() => handleScroll('right')}
            sx={{ 
              backgroundColor: theme.palette.background.paper,
              '&:hover': { backgroundColor: theme.palette.action.hover }
            }}
          >
            <ChevronRight />
          </IconButton>
        </Stack>
      </Box>
      
      {/* View Mode Description */}
      <Box
        sx={{
          position: 'absolute',
          top: 60,
          left: 0,
          right: 0,
          textAlign: 'center',
          zIndex: 5
        }}
      >
        <Typography variant="subtitle2" color="text.secondary">
          {viewMode === 'position' && 'Coordinate View - Reference point is position 0'}
          {viewMode === 'day' && 'Day View - Hours of the current day'}
          {viewMode === 'week' && 'Week View - Days of the current week'}
          {viewMode === 'month' && 'Month View - Months of the current year'}
          {viewMode === 'year' && 'Year View - Years relative to present'}
        </Typography>
      </Box>
      
      {/* Timeline Track */}
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
          '&::after': {
            content: '""',
            position: 'absolute',
            top: '50%',
            left: 0,
            right: 0,
            height: 4,
            backgroundColor: theme.palette.divider,
            transform: 'translateY(-50%)'
          }
        }}
        onMouseDown={handleMouseDown}
        onMouseLeave={handleMouseLeave}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
      >
        {/* Timeline markers */}
        <Box sx={{ 
          display: 'flex', 
          minWidth: '300%', // Extended width for more scrolling space
          position: 'relative', 
          px: 4,
          transform: `scale(${zoomLevel})`,
          transition: 'transform 0.3s ease'
        }}>
          {/* Center line */}
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
                  backgroundColor: index === 5 ? theme.palette.primary.main : theme.palette.divider,
                  mb: 1
                }}
              />
              <Typography variant="caption" color={index === 5 ? "primary" : "text.secondary"}>
                {getMarkerLabel(index)}
              </Typography>
            </Box>
          ))}

          {/* Event cards */}
          {events.map((event) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ 
                opacity: 1, 
                y: 0,
                scale: selectedEvent && selectedEvent.id === event.id ? 1.05 : 1,
                zIndex: selectedEvent && selectedEvent.id === event.id ? 10 : 5
              }}
              transition={{ duration: 0.5, delay: event.id * 0.1 }}
              onClick={() => handleEventClick(event)}
              style={{
                position: 'absolute',
                left: `${((event.position + 5) / 10) * 100}%`,
                top: event.id % 2 === 0 ? '65%' : '25%',
                transform: 'translate(-50%, -50%)',
                cursor: 'pointer'
              }}
            >
              <Paper
                elevation={selectedEvent && selectedEvent.id === event.id ? 8 : 3}
                sx={{
                  p: 2,
                  width: 200,
                  borderRadius: 2,
                  borderLeft: `4px solid ${eventColors[event.type]}`,
                  backgroundColor: theme.palette.mode === 'dark' ? 'rgba(40, 40, 40, 0.9)' : 'rgba(255, 255, 255, 0.9)',
                  transition: 'all 0.3s ease-in-out',
                  '&:hover': {
                    boxShadow: `0 0 10px ${eventColors[event.type]}`,
                    transform: 'scale(1.02)',
                  }
                }}
              >
                <Typography variant="subtitle1" gutterBottom>
                  {event.title}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                  {new Date(event.date).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </Typography>
                <Typography variant="body2">
                  {event.description}
                </Typography>
                
                {selectedEvent && selectedEvent.id === event.id && (
                  <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {event.tags.map(tag => (
                      <Box 
                        key={tag} 
                        component="span" 
                        sx={{ 
                          px: 1, 
                          py: 0.5, 
                          borderRadius: 1, 
                          backgroundColor: 'rgba(0, 0, 0, 0.1)',
                          fontSize: '0.75rem'
                        }}
                      >
                        #{tag}
                      </Box>
                    ))}
                  </Box>
                )}
              </Paper>
            </motion.div>
          ))}
        </Box>
      </Box>
      
      {/* Instructions */}
      <Paper
        sx={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          p: 2,
          backgroundColor: 'rgba(0,0,0,0.7)',
          color: 'white',
          borderRadius: 0,
          display: 'flex',
          alignItems: 'center'
        }}
      >
        <InfoIcon sx={{ mr: 1 }} />
        <Typography variant="body2">
          Try different view modes, click on events to view details, and drag the timeline to explore.
        </Typography>
      </Paper>
    </Box>
  );
}

export default LandingPageTimeline;
