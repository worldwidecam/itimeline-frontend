import React, { useState, useCallback } from 'react';
import { Box, IconButton, useTheme, Paper, Fade, Popper, Typography } from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { EVENT_TYPE_COLORS } from './EventTypes';
import EventTooltip from './EventTooltip';

// Empty state component (no hooks)
const EmptyEventCarousel = ({ compact }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        mt: compact ? 0 : 1
      }}
    >
      <Typography variant="caption" color="text.secondary">
        No events available
      </Typography>
    </Box>
  );
};

// Component with events (contains all hooks)
const PopulatedEventCarousel = ({
  events,
  currentIndex,
  onChangeIndex,
  onDotClick,
  goToPrevious,
  goToNext,
  compact = false
}) => {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState(null);
  const [isHovered, setIsHovered] = useState(false);
  const [popperPlacement, setPopperPlacement] = useState('bottom');
  
  // Ensure currentIndex is within bounds
  const safeCurrentIndex = Math.min(Math.max(0, currentIndex), events.length - 1);
  const currentEvent = events[safeCurrentIndex];

  const getEventTypeColor = useCallback(() => {
    if (!currentEvent?.type) return theme.palette.primary.main;
    const colors = EVENT_TYPE_COLORS[currentEvent.type];
    return theme.palette.mode === 'dark' ? colors?.dark : colors?.light;
  }, [currentEvent, theme.palette.mode, theme.palette.primary.main]);

  const getEventTypeHoverColor = useCallback(() => {
    if (!currentEvent?.type) return theme.palette.primary.dark;
    const colors = EVENT_TYPE_COLORS[currentEvent.type]?.hover;
    return theme.palette.mode === 'dark' ? colors?.dark : colors?.light;
  }, [currentEvent, theme.palette.mode, theme.palette.primary.dark]);

  const handleMouseEnter = useCallback((event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const spaceAbove = rect.top;
    const spaceBelow = window.innerHeight - rect.bottom;
    
    // Choose placement based on available space
    if (spaceBelow < 200 && spaceAbove > spaceBelow) {
      setPopperPlacement('top');
    } else {
      setPopperPlacement('bottom');
    }
    
    setAnchorEl(event.currentTarget);
    setIsHovered(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setAnchorEl(null);
    setIsHovered(false);
  }, []);

  const handleDotClick = useCallback((e) => {
    e.stopPropagation(); // Prevent event bubbling
    if (onDotClick && currentEvent) {
      onDotClick(currentEvent);
    }
  }, [currentEvent, onDotClick]);

  // Use provided functions if available, otherwise use default behavior
  const handlePrevious = useCallback(() => {
    if (goToPrevious) {
      goToPrevious();
    } else {
      onChangeIndex(safeCurrentIndex > 0 ? safeCurrentIndex - 1 : events.length - 1);
    }
  }, [goToPrevious, onChangeIndex, safeCurrentIndex, events.length]);

  const handleNext = useCallback(() => {
    if (goToNext) {
      goToNext();
    } else {
      onChangeIndex(safeCurrentIndex < events.length - 1 ? safeCurrentIndex + 1 : 0);
    }
  }, [goToNext, onChangeIndex, safeCurrentIndex, events.length]);

  const eventColor = getEventTypeColor();
  const eventHoverColor = getEventTypeHoverColor();

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: compact ? 0.5 : 1,
        mt: compact ? 0 : 1
      }}
    >
      <IconButton 
        size="small"
        onClick={handlePrevious}
        sx={{ 
          color: eventColor,
          padding: compact ? '2px' : '4px'
        }}
      >
        <ChevronLeftIcon fontSize={compact ? 'inherit' : 'small'} />
      </IconButton>

      <Box
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleDotClick}
        sx={{
          width: compact ? '10px' : '12px',
          height: compact ? '10px' : '12px',
          borderRadius: '50%',
          backgroundColor: eventColor,
          cursor: 'pointer',
          transition: 'all 0.2s',
          '&:hover': {
            transform: 'scale(1.2)',
            backgroundColor: eventHoverColor,
            boxShadow: `0 0 0 4px ${eventColor}33`
          }
        }}
      />

      <IconButton 
        size="small"
        onClick={handleNext}
        sx={{ 
          color: eventColor,
          padding: compact ? '2px' : '4px'
        }}
      >
        <ChevronRightIcon fontSize={compact ? 'inherit' : 'small'} />
      </IconButton>

      <Popper
        open={isHovered}
        anchorEl={anchorEl}
        placement={popperPlacement}
        transition
        sx={{ zIndex: 1000 }}
      >
        {({ TransitionProps }) => (
          <Fade {...TransitionProps} timeout={200}>
            <Paper 
              elevation={3}
              sx={{ 
                p: 0.5,
                bgcolor: 'background.paper',
                maxWidth: '250px',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: '8px',
                boxShadow: theme.shadows[3]
              }}
            >
              <EventTooltip event={currentEvent} />
            </Paper>
          </Fade>
        )}
      </Popper>
    </Box>
  );
};

// Main component that decides which version to render
const EventCarousel = (props) => {
  const { events = [], compact = false } = props;
  
  // No conditional hooks here - just conditional rendering
  if (!events || events.length === 0) {
    return <EmptyEventCarousel compact={compact} />;
  }
  
  return <PopulatedEventCarousel {...props} />;
};

export default EventCarousel;
