import React, { useState, useEffect, useRef } from 'react';
import { Box, useTheme, Button, Typography, Stack } from '@mui/material';
import TimelineBackground from './timeline-v3/TimelineBackground';
import TimelineBar from './timeline-v3/TimelineBar';
import TimeMarkers from './timeline-v3/TimeMarkers';
import LandingEventMarker from './timeline-v3/events/LandingEventMarker';
import EventCounter from './timeline-v3/events/EventCounter';
import { subDays, addDays, subMonths, addMonths, subYears, addYears } from 'date-fns';

// Function to generate dynamic events based on current date
const generateDemoEvents = () => {
  const now = new Date();
  
  // DAY VIEW EVENTS - Events within the current day, spanning from -12 to +12 hours with better spacing
  const dayViewEvents = [
    {
      id: 101,
      title: "Take kids to school",
      description: "Drop off Tommy and Emma at Westside Elementary",
      type: "remark",
      position: -10,
      event_date: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 7, 0, 0).toISOString(),
      tags: ["daily", "kids", "morning"]
    },
    {
      id: 102,
      title: "Team standup meeting",
      description: "Daily scrum with the development team",
      type: "remark",
      position: -5,
      event_date: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 30, 0).toISOString(),
      tags: ["work", "meeting", "daily"]
    },
    {
      id: 103,
      title: "Lunch with friends",
      description: "Meeting Sarah and Mike at Riverfront Café",
      type: "media",
      position: 0,
      event_date: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 30, 0).toISOString(),
      tags: ["social", "food", "friends"]
    },
    {
      id: 104,
      title: "Dentist appointment",
      description: "Regular checkup with Dr. Johnson",
      type: "remark",
      position: 5,
      event_date: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 15, 0, 0).toISOString(),
      tags: ["health", "appointment"]
    },
    {
      id: 105,
      title: "Pick up groceries",
      description: "Get ingredients for dinner at Whole Foods",
      type: "news",
      position: 10,
      event_date: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 17, 30, 0).toISOString(),
      tags: ["errands", "shopping", "food"]
    }
  ];

  // WEEK VIEW EVENTS - Events within -14 to +14 days from current date with better spacing
  const weekViewEvents = [
    {
      id: 201,
      title: "Weekend brunch",
      description: "Brunch with family at Sunrise Cafe",
      type: "media",
      position: -10,
      event_date: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7, 10, 0, 0).toISOString(),
      tags: ["family", "weekend", "food"]
    },
    {
      id: 202,
      title: "Team building event",
      description: "Company team building at Adventure Park",
      type: "news",
      position: -5,
      event_date: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 3, 13, 0, 0).toISOString(),
      tags: ["work", "team", "activity"]
    },
    {
      id: 203,
      title: "Project deadline",
      description: "Final submission for the client project",
      type: "remark",
      position: 0,
      event_date: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 17, 0, 0).toISOString(),
      tags: ["work", "deadline", "important"]
    },
    {
      id: 204,
      title: "Weekend getaway",
      description: "Short trip to the mountains with family",
      type: "media",
      position: 5,
      event_date: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 4, 8, 0, 0).toISOString(),
      tags: ["travel", "family", "vacation"]
    },
    {
      id: 205,
      title: "Quarterly review",
      description: "Performance review with manager",
      type: "news",
      position: 10,
      event_date: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7, 13, 0, 0).toISOString(),
      tags: ["work", "meeting", "review"]
    }
  ];

  // MONTH VIEW EVENTS - Events within -6 to +6 months from current date with better spacing
  const monthViewEvents = [
    {
      id: 301,
      title: "Annual Developer Conference",
      description: "Three-day tech conference with workshops",
      type: "media",
      position: -10,
      event_date: new Date(now.getFullYear(), now.getMonth() - 4, 15, 9, 0, 0).toISOString(),
      tags: ["tech", "conference", "networking"]
    },
    {
      id: 302,
      title: "Product Launch",
      description: "Official launch of our new mobile app",
      type: "news",
      position: -5,
      event_date: new Date(now.getFullYear(), now.getMonth() - 2, 20, 10, 0, 0).toISOString(),
      tags: ["product", "launch", "marketing"]
    },
    {
      id: 303,
      title: "Company Retreat",
      description: "Team building activities at Mountain Lodge",
      type: "media",
      position: 0,
      event_date: new Date(now.getFullYear(), now.getMonth(), 15, 8, 0, 0).toISOString(),
      tags: ["team", "retreat", "company"]
    },
    {
      id: 304,
      title: "Investor Meeting",
      description: "Quarterly update with major stakeholders",
      type: "remark",
      position: 5,
      event_date: new Date(now.getFullYear(), now.getMonth() + 2, 15, 14, 0, 0).toISOString(),
      tags: ["finance", "investors", "meeting"]
    },
    {
      id: 305,
      title: "Summer Marketing Campaign",
      description: "Launch of seasonal promotion strategy",
      type: "news",
      position: 10,
      event_date: new Date(now.getFullYear(), now.getMonth() + 4, 1, 9, 0, 0).toISOString(),
      tags: ["marketing", "campaign", "seasonal"]
    }
  ];

  // YEAR VIEW EVENTS - Events within -5 to +5 years from current date with better spacing
  const yearViewEvents = [
    {
      id: 401,
      title: "Company Founded",
      description: "Our company was established",
      type: "news",
      position: -10,
      event_date: new Date(now.getFullYear() - 3, 0, 6, 0, 0, 0).toISOString(),
      tags: ["company", "history", "milestone"]
    },
    {
      id: 402,
      title: "First Major Product Release",
      description: "Launch of our flagship product",
      type: "news",
      position: -5,
      event_date: new Date(now.getFullYear() - 1, 5, 14, 0, 0, 0).toISOString(),
      tags: ["product", "launch", "milestone"]
    },
    {
      id: 403,
      title: "Current Year Milestone",
      description: "Major achievement for this year",
      type: "remark",
      position: 0,
      event_date: new Date(now.getFullYear(), 5, 5, 0, 0, 0).toISOString(),
      tags: ["milestone", "achievement", "current"]
    },
    {
      id: 404,
      title: "Next Year's Conference",
      description: "Planned attendance at major industry event",
      type: "media",
      position: 5,
      event_date: new Date(now.getFullYear() + 1, 6, 26, 0, 0, 0).toISOString(),
      tags: ["future", "conference", "planning"]
    },
    {
      id: 405,
      title: "Five-Year Company Goal",
      description: "Target milestone for company growth",
      type: "media",
      position: 10,
      event_date: new Date(now.getFullYear() + 3, 1, 18, 0, 0, 0).toISOString(),
      tags: ["goals", "future", "planning"]
    }
  ];

  return {
    dayViewEvents,
    weekViewEvents,
    monthViewEvents,
    yearViewEvents
  };
};

// Generate all events dynamically based on current date
const { dayViewEvents: DAY_VIEW_EVENTS, weekViewEvents: WEEK_VIEW_EVENTS, monthViewEvents: MONTH_VIEW_EVENTS, yearViewEvents: YEAR_VIEW_EVENTS } = generateDemoEvents();

function LandingTimelineV3() {
  const theme = useTheme();
  const containerRef = useRef(null);
  const timelineBarRef = useRef(null);

  // Core state for timeline
  const [timelineOffset, setTimelineOffset] = useState(0);
  const [markers, setMarkers] = useState([]);
  const [viewMode, setViewMode] = useState('day');
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [events, setEvents] = useState(DAY_VIEW_EVENTS);
  const [visibleMarkers, setVisibleMarkers] = useState([]);
  const [currentEventIndex, setCurrentEventIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startDragX, setStartDragX] = useState(0);
  const [startOffset, setStartOffset] = useState(0);

  // Define marker styles
  const markerStyles = {
    regular: {
      '& .marker-line': {
        backgroundColor: theme.palette.divider
      },
      '& .marker-label': {
        color: theme.palette.text.secondary
      }
    },
    reference: {
      '& .marker-line': {
        backgroundColor: theme.palette.primary.main,
        height: '25px',
        width: '3px'
      },
      '& .marker-label': {
        color: theme.palette.primary.main,
        fontWeight: 'bold'
      }
    }
  };

  // Initialize markers
  useEffect(() => {
    const getInitialMarkers = () => {
      const markerSpacing = 100; // pixels between each marker
      const screenWidth = window.innerWidth;
      const markersNeeded = Math.ceil(screenWidth / markerSpacing) * 3; // More markers for scrolling
      // We want equal numbers on each side of zero, so we'll make it odd
      const totalMarkers = markersNeeded + (markersNeeded % 2 === 0 ? 1 : 0);
      const sideCount = Math.floor(totalMarkers / 2);
      
      return Array.from(
        { length: totalMarkers }, 
        (_, i) => i - sideCount
      );
    };
    
    setMarkers(getInitialMarkers());
  }, []);

  // Update events when view mode changes
  useEffect(() => {
    switch(viewMode) {
      case 'day':
        setEvents(DAY_VIEW_EVENTS);
        break;
      case 'week':
        setEvents(WEEK_VIEW_EVENTS);
        break;
      case 'month':
        setEvents(MONTH_VIEW_EVENTS);
        break;
      case 'year':
        setEvents(YEAR_VIEW_EVENTS);
        break;
      default:
        setEvents(DAY_VIEW_EVENTS);
    }
    
    // Reset selection when changing view
    setSelectedEventId(null);
    setCurrentEventIndex(0);
  }, [viewMode]);

  // Handle mouse interactions
  const handleMouseMove = (e) => {
    if (!timelineBarRef.current) return;
    
    const rect = timelineBarRef.current.getBoundingClientRect();
    const relativeX = e.clientX - rect.left;
    const position = relativeX / rect.width;
    
    if (isDragging) {
      const deltaX = e.clientX - startDragX;
      const newOffset = startOffset + deltaX / 100; // Adjust sensitivity
      setTimelineOffset(newOffset);
    }
  };

  const handleMouseDown = (e) => {
    if (!timelineBarRef.current) return;
    setIsDragging(true);
    setStartDragX(e.clientX);
    setStartOffset(timelineOffset);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  // Handle event selection - simplified for landing page
  const handleEventClick = (eventId) => {
    // Toggle selection state
    setSelectedEventId(eventId === selectedEventId ? null : eventId);
    
    // Find the index of the clicked event
    const eventIndex = events.findIndex(e => e.id === eventId);
    if (eventIndex !== -1) {
      setCurrentEventIndex(eventIndex);
    }
  };

  // Timeline navigation is handled via drag and drop

  // View mode controls
  const handleViewModeChange = (newMode) => {
    setViewMode(newMode);
    setSelectedEventId(null);
  };

  // Get current date/time
  const getCurrentDateTime = () => {
    return new Date();
  };

  // Format date based on view mode
  const formatDate = (date) => {
    if (!date) return '';
    
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    };
    
    return new Date(date).toLocaleDateString('en-US', options);
  };

  // Get formatted date for display
  const getFormattedDate = () => {
    const now = getCurrentDateTime();
    return now.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <Box 
      sx={{ 
        display: 'flex',
        flexDirection: 'column',
        height: '500px', 
        width: '100%',
        maxWidth: '1400px', 
        margin: '0 auto', 
        overflow: 'hidden',
        backgroundColor: 'black',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
        position: 'relative',
        mb: 3
      }}
      ref={containerRef}
    >
      {/* Timeline Background */}
      <TimelineBackground onBackgroundClick={() => setSelectedEventId(null)} />
      
      {/* Timeline Header */}
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 20 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography variant="h6" component="div" sx={{ color: 'white', fontWeight: 'bold', mr: 1 }}>
            # Timeline Demo
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
            {viewMode.charAt(0).toUpperCase() + viewMode.slice(1)} View
          </Typography>
        </Box>
        
        <Stack direction="row" spacing={1}>
          <Button 
            variant="contained" 
            size="small"
            onClick={() => handleViewModeChange('day')}
            sx={{ 
              backgroundColor: viewMode === 'day' ? theme.palette.primary.main : 'rgba(255,255,255,0.1)',
              color: 'white',
              minWidth: 'auto',
              px: 1
            }}
          >
            Day
          </Button>
          <Button 
            variant="contained" 
            size="small"
            onClick={() => handleViewModeChange('week')}
            sx={{ 
              backgroundColor: viewMode === 'week' ? theme.palette.primary.main : 'rgba(255,255,255,0.1)',
              color: 'white',
              minWidth: 'auto',
              px: 1
            }}
          >
            Week
          </Button>
          <Button 
            variant="contained" 
            size="small"
            onClick={() => handleViewModeChange('month')}
            sx={{ 
              backgroundColor: viewMode === 'month' ? theme.palette.primary.main : 'rgba(255,255,255,0.1)',
              color: 'white',
              minWidth: 'auto',
              px: 1
            }}
          >
            Month
          </Button>
          <Button 
            variant="contained" 
            size="small"
            onClick={() => handleViewModeChange('year')}
            sx={{ 
              backgroundColor: viewMode === 'year' ? theme.palette.primary.main : 'rgba(255,255,255,0.1)',
              color: 'white',
              minWidth: 'auto',
              px: 1
            }}
          >
            Year
          </Button>
        </Stack>
      </Box>
      
      {/* View Description */}
      <Box sx={{ px: 2, mb: 1 }}>
        <Typography variant="subtitle1" sx={{ color: 'rgba(255,255,255,0.7)' }}>
          {getFormattedDate()}
        </Typography>
      </Box>
      
      {/* Navigation Buttons */}
      {/* Navigation buttons removed - timeline uses drag and drop for navigation */}
      
      {/* Timeline Bar */}
      <Box 
        ref={timelineBarRef}
        sx={{ 
          position: 'relative',
          height: 350, // Increased height to extend the draggable area
          cursor: isDragging ? 'grabbing' : 'grab',
          mt: 'auto',
          mb: 4,
          userSelect: 'none', // Prevent text selection
          WebkitUserSelect: 'none',
          MozUserSelect: 'none',
          msUserSelect: 'none'
        }}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        {/* Transparent overlay to capture drag events and prevent text selection */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 15, // Above timeline elements but below filter buttons
            cursor: isDragging ? 'grabbing' : 'grab',
          }}
          onMouseMove={handleMouseMove}
          onMouseDown={(e) => {
            e.preventDefault(); // Prevent text selection
            handleMouseDown(e);
          }}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
        />
        {/* Timeline Bar */}
        <Box sx={{ position: 'relative', top: '200px' }}>
          <TimelineBar 
            timelineOffset={timelineOffset * 100}
            markerSpacing={100}
            minMarker={markers.length > 0 ? Math.min(...markers) : -5}
            maxMarker={markers.length > 0 ? Math.max(...markers) : 5}
            theme={theme}
          />
        </Box>
        
        {/* Time Markers */}
        <Box sx={{ position: 'relative', top: '200px' }}>
          <TimeMarkers 
            timelineOffset={timelineOffset * 100}
            markerSpacing={100}
            markers={markers}
            viewMode={viewMode}
            theme={theme}
            markerStyles={markerStyles}
          />
        </Box>
        
        {/* Event Markers */}
        <Box sx={{ position: 'absolute', top: '270px', width: '100%', zIndex: 16 }}>
          {events.map(event => (
            <LandingEventMarker
              key={event.id}
              event={event}
              timelineOffset={timelineOffset * 100}
              isSelected={event.id === selectedEventId}
              onClick={() => handleEventClick(event.id)}
              viewMode={viewMode}
              markerSpacing={100}
              theme={theme}
            />
          ))}
        </Box>
      </Box>
      
      {/* Instructions */}
      <Box
        sx={{
          position: 'relative',
          bottom: 0,
          left: 0,
          right: 0,
          p: 2,
          backgroundColor: 'rgba(0,0,0,0.7)',
          color: 'white',
          zIndex: 5,
          textAlign: 'center',
          mt: 'auto'
        }}
      >
        <Typography variant="body2">
          Try different view modes, click on events to view details, and drag the timeline to explore.
        </Typography>
      </Box>
      
      {/* Event info is displayed directly on the marker in the landing page version */}
    </Box>
  );
}

export default LandingTimelineV3;
