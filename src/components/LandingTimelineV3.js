import React, { useState, useEffect, useRef } from 'react';
import { Box, useTheme, Button, Typography, Stack } from '@mui/material';
import TimelineBackground from './timeline-v3/TimelineBackground';
import TimelineBar from './timeline-v3/TimelineBar';
import TimeMarkers from './timeline-v3/TimeMarkers';
import EventMarker from './timeline-v3/events/EventMarker';
import EventCounter from './timeline-v3/events/EventCounter';
import { subDays, addDays, subMonths, addMonths, subYears, addYears } from 'date-fns';

// Sample demo events - organized by view type
const DAY_VIEW_EVENTS = [
  {
    id: 101,
    title: "Take kids to school",
    description: "Drop off Tommy and Emma at Westside Elementary",
    type: "remark",
    position: -5,
    event_date: "2025-03-31T07:00:00",
    tags: ["daily", "kids", "morning"]
  },
  {
    id: 102,
    title: "Team standup meeting",
    description: "Daily scrum with the development team",
    type: "remark",
    position: -3,
    event_date: "2025-03-31T09:30:00",
    tags: ["work", "meeting", "daily"]
  },
  {
    id: 103,
    title: "Lunch with friends",
    description: "Meeting Sarah and Mike at Riverfront Café",
    type: "media",
    position: 0,
    event_date: "2025-03-31T12:30:00",
    tags: ["social", "food", "friends"]
  },
  {
    id: 104,
    title: "Dentist appointment",
    description: "Regular checkup with Dr. Johnson",
    type: "remark",
    position: 2,
    event_date: "2025-03-31T15:00:00",
    tags: ["health", "appointment"]
  },
  {
    id: 105,
    title: "Pick up groceries",
    description: "Get ingredients for dinner at Whole Foods",
    type: "news",
    position: 4,
    event_date: "2025-03-31T17:30:00",
    tags: ["errands", "shopping", "food"]
  }
];

const WEEK_VIEW_EVENTS = [
  {
    id: 201,
    title: "Tommy's Birthday",
    description: "Tommy turns 8! Party at Jumping Jungle",
    type: "media",
    position: -3,
    event_date: "2025-03-23T14:00:00",
    tags: ["birthday", "family", "celebration"]
  },
  {
    id: 202,
    title: "Saint Patrick's Day",
    description: "Wear green and celebrate Irish culture",
    type: "news",
    position: -2,
    event_date: "2025-03-17T00:00:00",
    tags: ["holiday", "cultural", "celebration"]
  },
  {
    id: 203,
    title: "Tax filing deadline",
    description: "Last day to submit tax returns",
    type: "remark",
    position: 0,
    event_date: "2025-04-15T00:00:00",
    tags: ["finance", "deadline", "important"]
  },
  {
    id: 204,
    title: "Weekend getaway",
    description: "Short trip to the mountains with family",
    type: "media",
    position: 2,
    event_date: "2025-04-05T08:00:00",
    tags: ["travel", "family", "vacation"]
  },
  {
    id: 205,
    title: "Quarterly review",
    description: "Performance review with manager",
    type: "news",
    position: 3,
    event_date: "2025-04-10T10:00:00",
    tags: ["work", "meeting", "important"]
  }
];

const MONTH_VIEW_EVENTS = [
  {
    id: 301,
    title: "Family reunion",
    description: "Annual Johnson family gathering at Lake Tahoe",
    type: "media",
    position: -3,
    event_date: "2024-07-15T00:00:00",
    tags: ["family", "annual", "tradition"]
  },
  {
    id: 302,
    title: "We got married!",
    description: "Our beautiful wedding day at Sunset Gardens",
    type: "media",
    position: -1,
    event_date: "2024-06-12T00:00:00",
    tags: ["wedding", "milestone", "celebration"]
  },
  {
    id: 303,
    title: "House renovation",
    description: "Kitchen and bathroom remodeling project",
    type: "remark",
    position: 0,
    event_date: "2025-02-01T00:00:00",
    tags: ["home", "project", "improvement"]
  },
  {
    id: 304,
    title: "Summer vacation",
    description: "Two-week trip to Europe: Paris, Rome, Barcelona",
    type: "media",
    position: 2,
    event_date: "2025-08-05T00:00:00",
    tags: ["travel", "vacation", "international"]
  },
  {
    id: 305,
    title: "Working class revolution",
    description: "The people unite for economic justice",
    type: "news",
    position: 4,
    event_date: "2025-05-01T00:00:00",
    tags: ["political", "social", "movement"]
  }
];

const YEAR_VIEW_EVENTS = [
  {
    id: 401,
    title: "Capitol Insurrection",
    description: "Rioters stormed the U.S. Capitol building",
    type: "news",
    position: -4,
    event_date: "2021-01-06T00:00:00",
    tags: ["history", "politics", "usa"]
  },
  {
    id: 402,
    title: "MLK's 'I Have a Dream' Speech",
    description: "Historic civil rights speech at the Lincoln Memorial",
    type: "media",
    position: -2,
    event_date: "1963-08-28T00:00:00",
    tags: ["history", "civil rights", "speech"]
  },
  {
    id: 403,
    title: "First Moon Landing",
    description: "Neil Armstrong becomes first human to walk on the moon",
    type: "media",
    position: 0,
    event_date: "1969-07-20T00:00:00",
    tags: ["history", "space", "achievement"]
  },
  {
    id: 404,
    title: "Fall of the Berlin Wall",
    description: "Symbol of Cold War division comes down",
    type: "news",
    position: 2,
    event_date: "1989-11-09T00:00:00",
    tags: ["history", "politics", "germany"]
  },
  {
    id: 405,
    title: "Palestinian Struggle for Freedom",
    description: "Ongoing fight for Palestinian rights and sovereignty",
    type: "news",
    position: 4,
    event_date: "2023-10-07T00:00:00",
    tags: ["current events", "human rights", "middle east"]
  }
];

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

  // Handle event selection
  const handleEventClick = (eventId) => {
    setSelectedEventId(eventId === selectedEventId ? null : eventId);
    
    // Find the index of the clicked event
    const eventIndex = events.findIndex(e => e.id === eventId);
    if (eventIndex !== -1) {
      setCurrentEventIndex(eventIndex);
    }
  };

  // Navigation controls
  const handleLeft = () => {
    const minMarker = Math.min(...markers);
    setMarkers(prevMarkers => [...prevMarkers, minMarker - 1]);
    setTimelineOffset(prevOffset => prevOffset + 100);
  };

  const handleRight = () => {
    const maxMarker = Math.max(...markers);
    setMarkers(prevMarkers => [...prevMarkers, maxMarker + 1]);
    setTimelineOffset(prevOffset => prevOffset - 100);
  };

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
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}>
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
      <Button
        variant="contained"
        size="small"
        onClick={handleLeft}
        sx={{
          position: 'absolute',
          left: 0,
          top: '50%',
          transform: 'translateY(-50%)',
          backgroundColor: 'rgba(0,0,0,0.7)',
          color: 'white',
          minWidth: 'auto',
          borderRadius: 0,
          height: '40px',
          zIndex: 5,
          '&:hover': {
            backgroundColor: 'rgba(0,0,0,0.9)'
          }
        }}
      >
        LEFT
      </Button>
      
      <Button
        variant="contained"
        size="small"
        onClick={handleRight}
        sx={{
          position: 'absolute',
          right: 0,
          top: '50%',
          transform: 'translateY(-50%)',
          backgroundColor: 'rgba(0,0,0,0.7)',
          color: 'white',
          minWidth: 'auto',
          borderRadius: 0,
          height: '40px',
          zIndex: 5,
          '&:hover': {
            backgroundColor: 'rgba(0,0,0,0.9)'
          }
        }}
      >
        RIGHT
      </Button>
      
      {/* Timeline Bar */}
      <Box 
        ref={timelineBarRef}
        sx={{ 
          position: 'relative',
          height: 220, 
          cursor: isDragging ? 'grabbing' : 'grab',
          mt: 'auto',
          mb: 4
        }}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        <TimelineBar 
          timelineOffset={timelineOffset * 100}
          markerSpacing={100}
          minMarker={markers.length > 0 ? Math.min(...markers) : -5}
          maxMarker={markers.length > 0 ? Math.max(...markers) : 5}
          theme={theme}
        />
        
        {/* Time Markers */}
        <TimeMarkers 
          timelineOffset={timelineOffset * 100}
          markerSpacing={100}
          markers={markers}
          viewMode={viewMode}
          theme={theme}
          markerStyles={markerStyles}
        />
        
        {/* Event Markers */}
        {events.map(event => (
          <EventMarker
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
      
      {/* Selected Event Details */}
      {selectedEventId && (
        <Box 
          sx={{ 
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '80%',
            maxWidth: '500px',
            backgroundColor: 'white',
            borderRadius: '4px',
            padding: '16px',
            boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
            zIndex: 20
          }}
        >
          {events.filter(e => e.id === selectedEventId).map(event => (
            <Box key={event.id}>
              <Typography variant="h6">{event.title}</Typography>
              <Typography variant="body2" sx={{ mb: 1, color: 'text.secondary' }}>
                {formatDate(event.event_date)}
              </Typography>
              <Typography variant="body1">{event.description}</Typography>
              <Box sx={{ mt: 1 }}>
                {event.tags.map(tag => (
                  <Box 
                    key={tag} 
                    component="span" 
                    sx={{ 
                      mr: 1, 
                      px: 1, 
                      py: 0.5, 
                      borderRadius: 1, 
                      backgroundColor: 'rgba(0,0,0,0.1)',
                      fontSize: '0.75rem'
                    }}
                  >
                    #{tag}
                  </Box>
                ))}
              </Box>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}

export default LandingTimelineV3;
