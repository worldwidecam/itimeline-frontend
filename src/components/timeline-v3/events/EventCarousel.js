import React, { useState, useCallback } from 'react';
import { Box, IconButton, useTheme, Paper, Fade, Popper, Typography, Tooltip } from '@mui/material';
import { darken, lighten } from '@mui/material/styles';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { EVENT_TYPE_COLORS } from './EventTypes';
import EventTooltip from './EventTooltip';
import EventPopup from './EventPopup';

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
  compact = false,
  showEventInfo = false
}) => {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState(null);
  const [isHovered, setIsHovered] = useState(false);
  const [popperPlacement, setPopperPlacement] = useState('bottom');
  const [popupOpen, setPopupOpen] = useState(false);
  const [popupEvent, setPopupEvent] = useState(null);
  
  // Ensure currentIndex is within bounds
  const safeCurrentIndex = Math.min(Math.max(0, currentIndex), events.length - 1);
  const currentEvent = events[safeCurrentIndex];

  const getMediaSubtype = useCallback(() => {
    const subtype = (currentEvent?.media_subtype || '').toLowerCase();
    const mediaTypeHint = (currentEvent?.media_type || '').toLowerCase();
    const mediaUrl = (currentEvent?.media_url || currentEvent?.url || '').toLowerCase();
    const ext = mediaUrl.split('.').pop();

    const isVideo =
      subtype === 'video' ||
      mediaTypeHint.includes('video') ||
      (ext && ['mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv', 'wmv', 'flv'].includes(ext));
    const isAudio =
      subtype === 'audio' ||
      mediaTypeHint.includes('audio') ||
      (ext && ['mp3', 'wav', 'ogg', 'aac', 'm4a'].includes(ext));
    const isImage =
      subtype === 'image' ||
      mediaTypeHint.includes('image') ||
      (ext && ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext));

    if (isImage) return 'image';
    if (isAudio) return 'audio';
    if (isVideo) return 'video';
    return null;
  }, [currentEvent]);

  const getMediaSubtypeColors = useCallback(() => {
    const subtype = getMediaSubtype();
    let baseColor = EVENT_TYPE_COLORS.media?.light || theme.palette.primary.main;

    if (subtype === 'image') baseColor = '#009688';
    if (subtype === 'audio') baseColor = '#e65100';
    if (subtype === 'video') baseColor = '#4a148c';

    const hoverColor = theme.palette.mode === 'dark'
      ? lighten(baseColor, 0.2)
      : darken(baseColor, 0.2);

    return { base: baseColor, hover: hoverColor };
  }, [getMediaSubtype, theme.palette.mode, theme.palette.primary.main]);

  const getEventTypeColors = useCallback(() => {
    if (!currentEvent?.type) {
      return { base: theme.palette.primary.main, hover: theme.palette.primary.dark };
    }

    if (currentEvent.type === 'media') {
      return getMediaSubtypeColors();
    }

    const colors = EVENT_TYPE_COLORS[currentEvent.type];
    return {
      base: theme.palette.mode === 'dark' ? colors?.dark : colors?.light,
      hover: theme.palette.mode === 'dark' ? colors?.hover?.dark : colors?.hover?.light,
    };
  }, [currentEvent, getMediaSubtypeColors, theme.palette.mode, theme.palette.primary.dark, theme.palette.primary.main]);

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
    if (currentEvent) {
      setPopupEvent(currentEvent);
      setPopupOpen(true);
    }
  }, [currentEvent]);

  const handlePopupClose = useCallback(() => {
    setPopupOpen(false);
  }, []);

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

  const { base: eventColor, hover: eventHoverColor } = getEventTypeColors();
  
  // Format event title for display
  const getEventTitle = () => {
    if (!currentEvent?.title) return "Untitled Event";
    return currentEvent.title.length > 20 
      ? `${currentEvent.title.substring(0, 20)}...` 
      : currentEvent.title;
  };

  return (
    <>
      {popupEvent && (
        <EventPopup
          open={popupOpen}
          onClose={handlePopupClose}
          event={popupEvent}
        />
      )}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: compact ? 0.5 : 1,
          mt: compact ? 0 : 1
        }}
      >
      <Tooltip title="Previous event" arrow placement="top">
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
      </Tooltip>

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
      
      {/* Event info (title) - only shown when showEventInfo is true */}
      {showEventInfo && (
        <Typography 
          variant="caption" 
          color="text.secondary"
          sx={{ 
            maxWidth: '120px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            fontSize: '0.7rem',
            cursor: 'pointer',
            '&:hover': { color: 'text.primary' }
          }}
          onClick={handleDotClick}
        >
          {getEventTitle()}
        </Typography>
      )}

      <Tooltip title="Next event" arrow placement="top">
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
      </Tooltip>

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
    </>
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
