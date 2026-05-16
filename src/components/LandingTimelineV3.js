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
  
  // DAY VIEW EVENTS - Modern, relatable daily life examples
  const dayViewEvents = [
    {
      id: 101,
      title: "Morning Brew & Planning",
      description: "Starting the day with a flat white and mapping out the new timeline features.",
      type: "remark",
      position: -10,
      event_date: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 8, 30, 0).toISOString(),
      tags: ["daily", "coffee", "productive"]
    },
    {
      id: 102,
      title: "New AI Model Alpha Test",
      description: "Testing the latest LLM integration for auto-tagging timeline events. Results are promising!",
      type: "media",
      position: -4,
      event_date: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 11, 0, 0).toISOString(),
      tags: ["tech", "AI", "devlog"]
    },
    {
      id: 103,
      title: "Lunch Break in the Park",
      description: "Catching some sun while browsing the community timelines. Found some great history boards today.",
      type: "remark",
      position: 1,
      event_date: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 13, 15, 0).toISOString(),
      tags: ["social", "nature", "break"]
    },
    {
      id: 104,
      title: "Global Tech Summit 2026",
      description: "The keynote on decentralized identity just finished. Huge implications for iTimeline's future.",
      type: "news",
      position: 6,
      event_date: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 16, 45, 0).toISOString(),
      tags: ["summit", "future", "tech"]
    },
    {
      id: 105,
      title: "Evening Wind Down",
      description: "Reflecting on a productive day. Organizing the 'Project Launch' timeline before bed.",
      type: "remark",
      position: 11,
      event_date: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 21, 0, 0).toISOString(),
      tags: ["night", "planning", "mindful"]
    }
  ];

  // WEEK VIEW EVENTS - Community and milestone focused
  const weekViewEvents = [
    {
      id: 201,
      title: "Community Milestone: 50k Timelines!",
      description: "Our community just surpassed 50,000 public timelines. Thank you for sharing your stories!",
      type: "news",
      position: -12,
      event_date: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6, 10, 0, 0).toISOString(),
      tags: ["community", "milestone", "celebration"]
    },
    {
      id: 202,
      title: "Weekend Hiking Trip",
      description: "Captured some incredible 4K footage of the summit. Uploading to the 'Nature Walks' board soon.",
      type: "media",
      position: -6,
      event_date: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 3, 14, 0, 0).toISOString(),
      tags: ["adventure", "outdoors", "video"]
    },
    {
      id: 203,
      title: "v3 Beta Feature: Rich Media Preview",
      description: "Successfully implemented live URL previews for all event cards. Check it out!",
      type: "news",
      position: 0,
      event_date: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0).toISOString(),
      tags: ["update", "beta", "feature"]
    },
    {
      id: 204,
      title: "Neighborhood Block Party",
      description: "Great turnout this year. Created a shared community timeline for everyone to upload photos.",
      type: "media",
      position: 5,
      event_date: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2, 18, 30, 0).toISOString(),
      tags: ["local", "social", "community"]
    },
    {
      id: 205,
      title: "Major Infrastructure Upgrade",
      description: "Switching to the new Cloudflare Workers backend for 2x faster load times.",
      type: "news",
      position: 11,
      event_date: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 5, 0, 0, 0).toISOString(),
      tags: ["dev", "speed", "backend"]
    }
  ];

  // MONTH VIEW EVENTS - Global and long-term milestones
  const monthViewEvents = [
    {
      id: 301,
      title: "First Mars Colony Anniversary",
      description: "Celebrating 5 years since the first permanent settlement was established.",
      type: "news",
      position: -10,
      event_date: new Date(now.getFullYear(), now.getMonth() - 5, 10, 9, 0, 0).toISOString(),
      tags: ["history", "space", "science"]
    },
    {
      id: 302,
      title: "iTimeline Mobile App v1.0 Launch",
      description: "The wait is over! iTimeline is now available on iOS and Android.",
      type: "media",
      position: -4,
      event_date: new Date(now.getFullYear(), now.getMonth() - 2, 15, 10, 0, 0).toISOString(),
      tags: ["launch", "mobile", "ios", "android"]
    },
    {
      id: 303,
      title: "Summer Solstice Festival",
      description: "The largest digital-physical hybrid festival starts today.",
      type: "media",
      position: 1,
      event_date: new Date(now.getFullYear(), now.getMonth(), 21, 12, 0, 0).toISOString(),
      tags: ["festival", "culture", "summer"]
    },
    {
      id: 304,
      title: "Quarterly Community Town Hall",
      description: "Joining the founders to discuss the Q4 roadmap and user-requested features.",
      type: "remark",
      position: 7,
      event_date: new Date(now.getFullYear(), now.getMonth() + 2, 5, 15, 0, 0).toISOString(),
      tags: ["roadmap", "transparency", "feedback"]
    },
    {
      id: 305,
      title: "The Great Ocean Cleanup Completion",
      description: "Ocean Foundation announces 90% of surface plastics removed. A win for the planet!",
      type: "news",
      position: 12,
      event_date: new Date(now.getFullYear(), now.getMonth() + 4, 18, 9, 0, 0).toISOString(),
      tags: ["environment", "goodnews", "ocean"]
    }
  ];

  // YEAR VIEW EVENTS - Historic and future visions
  const yearViewEvents = [
    {
      id: 401,
      title: "The Genesis of iTimeline",
      description: "The first commit that started it all. A vision for organized digital memory.",
      type: "remark",
      position: -12,
      event_date: new Date(now.getFullYear() - 4, 3, 12, 0, 0, 0).toISOString(),
      tags: ["genesis", "history", "milestone"]
    },
    {
      id: 402,
      title: "Global Transition to Clean Energy",
      description: "Renewables officially surpass fossil fuels as the world's primary energy source.",
      type: "news",
      position: -7,
      event_date: new Date(now.getFullYear() - 2, 8, 22, 0, 0, 0).toISOString(),
      tags: ["earth", "energy", "progress"]
    },
    {
      id: 403,
      title: "The Year of Expansion",
      description: "iTimeline scales to 1 million active users and introduces Community Timelines.",
      type: "remark",
      position: 0,
      event_date: new Date(now.getFullYear(), 5, 1, 0, 0, 0).toISOString(),
      tags: ["growth", "v3", "current"]
    },
    {
      id: 404,
      title: "First Interstellar Probe Launch",
      description: "Humanity's first mission to Alpha Centauri begins its journey.",
      type: "media",
      position: 6,
      event_date: new Date(now.getFullYear() + 2, 10, 15, 0, 0, 0).toISOString(),
      tags: ["future", "voyage", "space"]
    },
    {
      id: 405,
      title: "The Decadal Vision",
      description: "Planning for the 2030s: Connecting every shared memory across the globe.",
      type: "media",
      position: 12,
      event_date: new Date(now.getFullYear() + 5, 0, 1, 0, 0, 0).toISOString(),
      tags: ["vision", "2030", "longterm"]
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

  // Handle touch interactions for mobile
  const handleTouchStart = (e) => {
    if (!timelineBarRef.current) return;
    setIsDragging(true);
    setStartDragX(e.touches[0].clientX);
    setStartOffset(timelineOffset);
  };

  const handleTouchMove = (e) => {
    if (!isDragging || !timelineBarRef.current) return;
    const deltaX = e.touches[0].clientX - startDragX;
    const newOffset = startOffset + deltaX / 100;
    setTimelineOffset(newOffset);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

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
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
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
