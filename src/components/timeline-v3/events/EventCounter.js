import React, { useState, useEffect } from 'react';
import { Box, Badge, Typography } from '@mui/material';
import EventIcon from '@mui/icons-material/Event';
import EventCarousel from './EventCarousel';
import { EVENT_TYPE_COLORS } from './EventTypes';

const EventCounter = ({ 
  count, 
  events = [], 
  currentIndex = 0, 
  onChangeIndex,
  onDotClick,
  viewMode,
  timelineOffset = 0,
  markerSpacing = 100,
  sortOrder,
  selectedType,
  style
}) => {
  // State to track day view current event index
  const [dayViewIndex, setDayViewIndex] = useState(0);
  
  // Reset day view index when view mode changes or filtering changes
  useEffect(() => {
    setDayViewIndex(0);
  }, [viewMode, selectedType]);
  
  // Reset day view index when sort order changes
  useEffect(() => {
    setDayViewIndex(0);
  }, [sortOrder]);

  // Get color based on event type
  const getEventColor = (event) => {
    if (!event?.type) return 'primary.main';
    const colors = EVENT_TYPE_COLORS[event.type];
    return colors ? colors.light : 'primary.main';
  };

  // Handle day view navigation
  const handleDayViewChange = (newIndex) => {
    setDayViewIndex(newIndex);
    // Also update the main index to ensure event markers are highlighted
    onChangeIndex(newIndex);
  };

  // Handle day view dot click
  const handleDayViewDotClick = (event) => {
    if (onDotClick) {
      onDotClick(event);
    }
  };

  // Get filtered events for day view (events with valid dates)
  const getDayViewEvents = () => {
    return events.filter(event => 
      event.event_date && 
      (!selectedType || event.type === selectedType)
    );
  };

  // Get filtered events for position view
  const getPositionViewEvents = () => {
    return events.filter(event => 
      !selectedType || event.type === selectedType
    );
  };

  const dayViewEvents = getDayViewEvents();
  const positionViewEvents = getPositionViewEvents();
  
  // Reset index if it's out of bounds after filtering
  useEffect(() => {
    if (viewMode === 'day' && dayViewEvents.length > 0 && dayViewIndex >= dayViewEvents.length) {
      setDayViewIndex(0);
    }
    if (viewMode !== 'day' && positionViewEvents.length > 0 && currentIndex >= positionViewEvents.length) {
      onChangeIndex(0);
    }
  }, [selectedType, dayViewEvents.length, positionViewEvents.length, dayViewIndex, currentIndex, viewMode, onChangeIndex]);

  // Position view cycling functions
  const goToPreviousPosition = () => {
    if (!positionViewEvents || positionViewEvents.length === 0) return;
    
    // Make sure currentIndex is valid
    if (currentIndex < 0 || currentIndex >= positionViewEvents.length) {
      // Reset to a valid index if current is invalid
      onChangeIndex(0);
      return;
    }
    
    // Always navigate to chronologically older event (left on timeline)
    const currentEvent = positionViewEvents[currentIndex];
    if (!currentEvent || !currentEvent.event_date) {
      console.error('Current event or event date is undefined', { currentIndex, currentEvent });
      return;
    }
    
    const currentDate = new Date(currentEvent.event_date);
    
    // Find the next older event
    let olderEvents = positionViewEvents.filter(event => 
      event && event.event_date && new Date(event.event_date) < currentDate
    );
    
    if (olderEvents.length > 0) {
      // Sort by date descending to get the closest older event
      olderEvents.sort((a, b) => new Date(b.event_date) - new Date(a.event_date));
      const closestOlderEvent = olderEvents[0];
      const newIndex = positionViewEvents.findIndex(e => e && e.id === closestOlderEvent.id);
      if (newIndex !== -1) {
        onChangeIndex(newIndex);
      }
    } else {
      // If no older events, wrap around to the NEWEST event (far right)
      const validEvents = positionViewEvents.filter(event => event && event.event_date);
      if (validEvents.length === 0) return;
      
      // Sort by date ascending to get the newest event
      const sortedByDate = [...validEvents].sort((a, b) => 
        new Date(a.event_date) - new Date(b.event_date)
      );
      const newestEvent = sortedByDate[sortedByDate.length - 1]; // Get the newest event
      const newIndex = positionViewEvents.findIndex(e => e && e.id === newestEvent.id);
      if (newIndex !== -1) {
        onChangeIndex(newIndex);
      }
    }
  };

  const goToNextPosition = () => {
    if (!positionViewEvents || positionViewEvents.length === 0) return;
    
    // Make sure currentIndex is valid
    if (currentIndex < 0 || currentIndex >= positionViewEvents.length) {
      // Reset to a valid index if current is invalid
      onChangeIndex(0);
      return;
    }
    
    // Always navigate to chronologically newer event (right on timeline)
    const currentEvent = positionViewEvents[currentIndex];
    if (!currentEvent || !currentEvent.event_date) {
      console.error('Current event or event date is undefined', { currentIndex, currentEvent });
      return;
    }
    
    const currentDate = new Date(currentEvent.event_date);
    
    // Find the next newer event
    let newerEvents = positionViewEvents.filter(event => 
      event && event.event_date && new Date(event.event_date) > currentDate
    );
    
    if (newerEvents.length > 0) {
      // Sort by date ascending to get the closest newer event
      newerEvents.sort((a, b) => new Date(a.event_date) - new Date(b.event_date));
      const closestNewerEvent = newerEvents[0];
      const newIndex = positionViewEvents.findIndex(e => e && e.id === closestNewerEvent.id);
      if (newIndex !== -1) {
        onChangeIndex(newIndex);
      }
    } else {
      // If no newer events, wrap around to the oldest event (far left)
      const validEvents = positionViewEvents.filter(event => event && event.event_date);
      if (validEvents.length === 0) return;
      
      // Sort by date ascending to get the oldest event
      const sortedByDate = [...validEvents].sort((a, b) => 
        new Date(a.event_date) - new Date(b.event_date)
      );
      const oldestEvent = sortedByDate[0]; // Get the oldest event
      const newIndex = positionViewEvents.findIndex(e => e && e.id === oldestEvent.id);
      if (newIndex !== -1) {
        onChangeIndex(newIndex);
      }
    }
  };

  // Day view cycling functions
  const goToPrevious = () => {
    if (!dayViewEvents || dayViewEvents.length === 0) return;
    
    // Make sure dayViewIndex is valid
    if (dayViewIndex < 0 || dayViewIndex >= dayViewEvents.length) {
      // Reset to a valid index if current is invalid
      setDayViewIndex(0);
      onChangeIndex(0);
      return;
    }
    
    // Always navigate to chronologically older event (left on timeline)
    const currentEvent = dayViewEvents[dayViewIndex];
    if (!currentEvent || !currentEvent.event_date) {
      console.error('Current event or event date is undefined', { dayViewIndex, currentEvent });
      return;
    }
    
    const currentDate = new Date(currentEvent.event_date);
    
    // Find the next older event
    let olderEvents = dayViewEvents.filter(event => 
      event && event.event_date && new Date(event.event_date) < currentDate
    );
    
    if (olderEvents.length > 0) {
      // Sort by date descending to get the closest older event
      olderEvents.sort((a, b) => new Date(b.event_date) - new Date(a.event_date));
      const closestOlderEvent = olderEvents[0];
      const newIndex = dayViewEvents.findIndex(e => e && e.id === closestOlderEvent.id);
      if (newIndex !== -1) {
        setDayViewIndex(newIndex);
        onChangeIndex(newIndex);
      }
    } else {
      // If no older events, wrap around to the NEWEST event (far right)
      const validEvents = dayViewEvents.filter(event => event && event.event_date);
      if (validEvents.length === 0) return;
      
      // Sort by date ascending to get the newest event
      const sortedByDate = [...validEvents].sort((a, b) => 
        new Date(a.event_date) - new Date(b.event_date)
      );
      const newestEvent = sortedByDate[sortedByDate.length - 1]; // Get the newest event
      const newIndex = dayViewEvents.findIndex(e => e && e.id === newestEvent.id);
      if (newIndex !== -1) {
        setDayViewIndex(newIndex);
        onChangeIndex(newIndex);
      }
    }
  };

  const goToNext = () => {
    if (!dayViewEvents || dayViewEvents.length === 0) return;
    
    // Make sure dayViewIndex is valid
    if (dayViewIndex < 0 || dayViewIndex >= dayViewEvents.length) {
      // Reset to a valid index if current is invalid
      setDayViewIndex(0);
      onChangeIndex(0);
      return;
    }
    
    // Always navigate to chronologically newer event (right on timeline)
    const currentEvent = dayViewEvents[dayViewIndex];
    if (!currentEvent || !currentEvent.event_date) {
      console.error('Current event or event date is undefined', { dayViewIndex, currentEvent });
      return;
    }
    
    const currentDate = new Date(currentEvent.event_date);
    
    // Find the next newer event
    let newerEvents = dayViewEvents.filter(event => 
      event && event.event_date && new Date(event.event_date) > currentDate
    );
    
    if (newerEvents.length > 0) {
      // Sort by date ascending to get the closest newer event
      newerEvents.sort((a, b) => new Date(a.event_date) - new Date(b.event_date));
      const closestNewerEvent = newerEvents[0];
      const newIndex = dayViewEvents.findIndex(e => e && e.id === closestNewerEvent.id);
      if (newIndex !== -1) {
        setDayViewIndex(newIndex);
        onChangeIndex(newIndex);
      }
    } else {
      // If no newer events, wrap around to the OLDEST event (far left)
      const validEvents = dayViewEvents.filter(event => event && event.event_date);
      if (validEvents.length === 0) return;
      
      // Sort by date ascending to get the oldest event
      const sortedByDate = [...validEvents].sort((a, b) => 
        new Date(a.event_date) - new Date(b.event_date)
      );
      const oldestEvent = sortedByDate[0]; // Get the oldest event
      const newIndex = dayViewEvents.findIndex(e => e && e.id === oldestEvent.id);
      if (newIndex !== -1) {
        setDayViewIndex(newIndex);
        onChangeIndex(newIndex);
      }
    }
  };

  return (
    <Box 
      sx={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
        bgcolor: 'background.paper',
        borderRadius: 2,
        p: 1,
        boxShadow: 1,
        border: '1px solid',
        borderColor: 'divider',
        height: '40px',
        ...style
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography variant="subtitle2" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
          Events
        </Typography>
        <Badge
          badgeContent={count}
          color="primary"
          sx={{
            '& .MuiBadge-badge': {
              fontSize: '0.8rem',
              height: '20px',
              minWidth: '20px',
              borderRadius: '10px'
            }
          }}
        >
          <EventIcon color="action" fontSize="small" />
        </Badge>
      </Box>
      
      {/* Day View Event Counter */}
      {viewMode === 'day' && (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {dayViewEvents.length > 0 ? (
            <EventCarousel 
              events={dayViewEvents} 
              currentIndex={dayViewIndex} 
              onChangeIndex={handleDayViewChange}
              onDotClick={handleDayViewDotClick}
              goToPrevious={goToPrevious}
              goToNext={goToNext}
              compact={true}
              showEventInfo={false}
            />
          ) : (
            <Typography variant="caption" color="text.secondary">
              No events
            </Typography>
          )}
        </Box>
      )}

      {/* Position View Event Counter */}
      {viewMode !== 'day' && (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {positionViewEvents.length > 0 ? (
            <EventCarousel 
              events={positionViewEvents} 
              currentIndex={currentIndex} 
              onChangeIndex={onChangeIndex}
              onDotClick={onDotClick}
              goToPrevious={goToPreviousPosition}
              goToNext={goToNextPosition}
              compact={true}
              showEventInfo={false}
            />
          ) : (
            <Typography variant="caption" color="text.secondary">
              No events
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
};

export default EventCounter;
