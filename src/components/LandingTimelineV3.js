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
  
  // DAY VIEW EVENTS - Sleuth discovery
  const dayViewEvents = [
    {
      id: 101,
      title: "Hike on Whispering Pines Trail",
      description: "Went hiking with Sarah on the old trail. Took some photos of the beautiful forest path.",
      type: "media",
      position: -10,
      media_url: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=600",
      event_date: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 4, 15, 0).toISOString(),
      tags: ["hiking", "trail", "forest"]
    },
    {
      id: 102,
      title: "Breaking: Evidence Found Near Trail",
      description: "Local news reports a hiker found a buried container with items linked to the 1994 cold case.",
      type: "news",
      position: -4,
      event_date: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 7, 0, 0).toISOString(),
      tags: ["breakingnews", "coldcase", "localnews"]
    },
    {
      id: 103,
      title: "The Trail Connection",
      description: "Wait! Sarah and I walked right past that exact hollow oak tree this morning. I'm starting this timeline to track it.",
      type: "remark",
      position: 1,
      event_date: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 30, 0).toISOString(),
      tags: ["investigation", "clues"]
    },
    {
      id: 104,
      title: "Rusted Key in the Mud",
      description: "Went back to the trail. Found this old rusted iron key half-buried in the mud near the oak tree.",
      type: "media",
      position: 6,
      media_url: "https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=600",
      event_date: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 18, 0, 0).toISOString(),
      tags: ["evidence", "trail"]
    },
    {
      id: 105,
      title: "Recording Podcast Episode 1",
      description: "Setting up my microphone to record the first episode of 'The Pines Mystery'. It's time to share what we found.",
      type: "remark",
      position: 11,
      event_date: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 22, 30, 0).toISOString(),
      tags: ["podcast", "recording"]
    }
  ];

  // WEEK VIEW EVENTS - Investigation grows
  const weekViewEvents = [
    {
      id: 201,
      title: "Police Report: No New Leads",
      description: "Sheriff's department statement claims trail evidence is inconclusive. The case remains cold.",
      type: "news",
      position: -12,
      event_date: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6, 9, 0, 0).toISOString(),
      tags: ["police", "update"]
    },
    {
      id: 202,
      title: "Episode 1 Goes Live",
      description: "Published 'Episode 1: The Trail Key'. Shared our trail coordinates and key photos. The town deserves answers.",
      type: "remark",
      position: -6,
      event_date: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 4, 11, 15, 0).toISOString(),
      tags: ["podcast", "viral"]
    },
    {
      id: 203,
      title: "The Abandoned Cabin",
      description: "A listener sent a tip about an abandoned cabin deep in the woods. Fits the timeline perfectly.",
      type: "media",
      position: 0,
      media_url: "https://images.unsplash.com/photo-1722532850960-5ed0751d80fd?w=600",
      event_date: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 15, 0, 0).toISOString(),
      tags: ["leads", "cabin"]
    },
    {
      id: 204,
      title: "Retired Sheriff Interview",
      description: "Met with a retired deputy who worked the case in '94. He confirmed the key we found matches the cabin lock!",
      type: "remark",
      position: 5,
      event_date: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2, 20, 45, 0).toISOString(),
      tags: ["interview", "cabin"]
    },
    {
      id: 205,
      title: "Breaking: Police Search Cabin",
      description: "Following tips from the podcast, investigators obtain a warrant and enter the Whispering Pines cabin.",
      type: "news",
      position: 11,
      event_date: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 5, 10, 0, 0).toISOString(),
      tags: ["police", "warrant"]
    }
  ];

  // MONTH VIEW EVENTS - Timeline reconstruction
  const monthViewEvents = [
    {
      id: 301,
      title: "1994 Logbook Discovered",
      description: "Search teams at the cabin uncover a hidden compartment containing a visitor logbook from 1994.",
      type: "news",
      position: -10,
      event_date: new Date(now.getFullYear(), now.getMonth() - 1, 5, 9, 0, 0).toISOString(),
      tags: ["evidence", "cabin"]
    },
    {
      id: 302,
      title: "Town Archival Blueprints",
      description: "Spent days in the town archives. Found the original 1990 blueprints of the estate showing secret crawlspaces.",
      type: "media",
      position: -4,
      media_url: "https://images.unsplash.com/photo-1712696779652-dfca8766c5f8?w=600",
      event_date: new Date(now.getFullYear(), now.getMonth() - 1, 15, 14, 0, 0).toISOString(),
      tags: ["archives", "blueprints"]
    },
    {
      id: 303,
      title: "Timeline Matches Logbook",
      description: "The suspect's logbook visits align exactly with the dates of the blueprint changes and the victim's disappearance.",
      type: "remark",
      position: 1,
      event_date: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0).toISOString(),
      tags: ["breakthrough", "timeline"]
    },
    {
      id: 304,
      title: "Antique Lockbox Uncovered",
      description: "Found the suspect's lockbox hidden behind the chimney. It contained letters that tie everything together.",
      type: "media",
      position: 7,
      media_url: "https://images.unsplash.com/photo-1641359255145-9af4ff37a4f5?w=600",
      event_date: new Date(now.getFullYear(), now.getMonth() + 1, 5, 16, 0, 0).toISOString(),
      tags: ["evidence", "lockbox"]
    },
    {
      id: 305,
      title: "Suspect Identified & Charged",
      description: "District Attorney formally charges the prime suspect with kidnapping and conspiracy, ending a 32-year hunt.",
      type: "news",
      position: 12,
      event_date: new Date(now.getFullYear(), now.getMonth() + 1, 20, 9, 0, 0).toISOString(),
      tags: ["suspect", "justice"]
    }
  ];

  // YEAR VIEW EVENTS - The full arc
  const yearViewEvents = [
    {
      id: 401,
      title: "Launching the Podcast",
      description: "Started 'The Pines Mystery' with zero listeners, a basic microphone, and a desire to find the truth.",
      type: "remark",
      position: -12,
      event_date: new Date(now.getFullYear() - 1, 4, 12, 0, 0, 0).toISOString(),
      tags: ["podcast", "genesis"]
    },
    {
      id: 402,
      title: "Podcast Impact: Case Re-opened",
      description: "With over 100k listeners sharing tips, the State Attorney formally re-opens the cold case investigation.",
      type: "news",
      position: -7,
      event_date: new Date(now.getFullYear() - 1, 9, 22, 0, 0, 0).toISOString(),
      tags: ["impact", "stateoffice"]
    },
    {
      id: 403,
      title: "Current Day: The Trial Begins",
      description: "The Whispering Pines cold case trial finally begins. The courtroom is packed with listeners and locals.",
      type: "remark",
      position: 0,
      event_date: new Date(now.getFullYear(), 5, 1, 0, 0, 0).toISOString(),
      tags: ["trial", "courtroom"]
    },
    {
      id: 404,
      title: "Inside the Courthouse",
      description: "Documenting the historic courtroom trial. Showing the gavel that will decide the final verdict.",
      type: "media",
      position: 6,
      media_url: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600",
      event_date: new Date(now.getFullYear() + 1, 10, 15, 0, 0, 0).toISOString(),
      tags: ["courthouse", "gavel"]
    },
    {
      id: 405,
      title: "Verdict: Guilty on All Counts",
      description: "Jury reaches a unanimous verdict. Justice is served, bringing peace to Whispering Pines at last.",
      type: "news",
      position: 12,
      event_date: new Date(now.getFullYear() + 2, 0, 1, 0, 0, 0).toISOString(),
      tags: ["verdict", "justice"]
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
