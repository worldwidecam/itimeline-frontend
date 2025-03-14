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
  selectedType 
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
    if (positionViewEvents.length === 0) return;
    
    if (sortOrder === 'newest') {
      onChangeIndex(currentIndex < positionViewEvents.length - 1 ? currentIndex + 1 : 0);
    } else {
      onChangeIndex(currentIndex > 0 ? currentIndex - 1 : positionViewEvents.length - 1);
    }
  };

  const goToNextPosition = () => {
    if (positionViewEvents.length === 0) return;
    
    if (sortOrder === 'newest') {
      onChangeIndex(currentIndex > 0 ? currentIndex - 1 : positionViewEvents.length - 1);
    } else {
      onChangeIndex(currentIndex < positionViewEvents.length - 1 ? currentIndex + 1 : 0);
    }
  };

  // Day view cycling functions
  const goToPrevious = () => {
    if (dayViewEvents.length === 0) return;
    
    let newIndex;
    if (sortOrder === 'newest') {
      newIndex = dayViewIndex < dayViewEvents.length - 1 ? dayViewIndex + 1 : 0;
    } else {
      newIndex = dayViewIndex > 0 ? dayViewIndex - 1 : dayViewEvents.length - 1;
    }
    
    setDayViewIndex(newIndex);
    // Also update the main index to ensure event markers are highlighted
    onChangeIndex(newIndex);
  };

  const goToNext = () => {
    if (dayViewEvents.length === 0) return;
    
    let newIndex;
    if (sortOrder === 'newest') {
      newIndex = dayViewIndex > 0 ? dayViewIndex - 1 : dayViewEvents.length - 1;
    } else {
      newIndex = dayViewIndex < dayViewEvents.length - 1 ? dayViewIndex + 1 : 0;
    }
    
    setDayViewIndex(newIndex);
    // Also update the main index to ensure event markers are highlighted
    onChangeIndex(newIndex);
  };

  return (
    <Box 
      sx={{
        position: 'absolute',
        top: 16,
        left: 16,
        zIndex: 2,
        bgcolor: 'background.paper',
        borderRadius: 2,
        p: 1.5,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 0.5,
        boxShadow: 2,
        border: '1px solid',
        borderColor: 'divider'
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography variant="subtitle2" color="text.secondary">
          Event Counter
        </Typography>
        <Badge
          badgeContent={count}
          color="primary"
          sx={{
            '& .MuiBadge-badge': {
              fontSize: '0.9rem',
              height: '24px',
              minWidth: '24px',
              borderRadius: '12px'
            }
          }}
        >
          <EventIcon color="action" />
        </Badge>
      </Box>
      
      {/* Day View Event Counter */}
      {viewMode === 'day' && (
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          {dayViewEvents.length > 0 ? (
            <>
              <EventCarousel 
                events={dayViewEvents} 
                currentIndex={dayViewIndex} 
                onChangeIndex={handleDayViewChange}
                onDotClick={handleDayViewDotClick}
                goToPrevious={goToPrevious}
                goToNext={goToNext}
              />
            </>
          ) : (
            <Typography variant="caption" color="text.secondary">
              No events match the current filter
            </Typography>
          )}
        </Box>
      )}

      {/* Position View Event Counter */}
      {viewMode !== 'day' && (
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          {positionViewEvents.length > 0 ? (
            <>
              <EventCarousel 
                events={positionViewEvents} 
                currentIndex={currentIndex} 
                onChangeIndex={onChangeIndex}
                onDotClick={onDotClick}
                goToPrevious={goToPreviousPosition}
                goToNext={goToNextPosition}
              />
            </>
          ) : (
            <Typography variant="caption" color="text.secondary">
              No events match the current filter
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
};

export default EventCounter;
