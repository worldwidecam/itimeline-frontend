import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Typography,
  TextField,
  InputAdornment,
  Paper,
  Stack,
  useTheme,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Fade
} from '@mui/material';
import {
  Search as SearchIcon,
  Comment as RemarkIcon,
  Newspaper as NewsIcon,
  PermMedia as MediaIcon,
  Delete as DeleteIcon,
  Sort as SortIcon,
  ExpandMore as ExpandMoreIcon,
  KeyboardArrowUp as KeyboardArrowUpIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { EVENT_TYPES, EVENT_TYPE_COLORS } from './EventTypes';
import RemarkCard from './cards/RemarkCard';
import NewsCard from './cards/NewsCard';
import MediaCard from './cards/MediaCard';
import EventCounter from './EventCounter';
import { 
  isSameDay, 
  isSameMonth, 
  isSameYear, 
  startOfWeek, 
  endOfWeek, 
  isWithinInterval,
  addDays,
  addMonths,
  addYears,
  subDays,
  subMonths,
  subYears
} from 'date-fns';

const EventList = ({ 
  events, 
  onEventEdit, 
  onEventDelete, 
  selectedEventId, 
  onEventSelect,
  shouldScrollToEvent = true,
  viewMode = 'position', // Add viewMode prop with default value
  minMarker = -10, // Default visible marker range
  maxMarker = 10, // Default visible marker range
  onFilteredEventsCount, // Callback to report filtered events count
  isLoadingMarkers = false // Flag to indicate if markers are still loading
}) => {
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState(null);
  const [sortOrder, setSortOrder] = useState(() => {
    // Load saved preference or default to 'newest'
    return localStorage.getItem('timeline_sort_preference') || 'newest';
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState(null);
  const [previousSelectedId, setPreviousSelectedId] = useState(null);
  const eventRefs = useRef({});

  // Pagination state
  const [displayLimit, setDisplayLimit] = useState(20);
  const [showAll, setShowAll] = useState(false);
  
  // Scroll tracking for To Top button
  const [showToTop, setShowToTop] = useState(false);

  // Save sort preference whenever it changes
  useEffect(() => {
    localStorage.setItem('timeline_sort_preference', sortOrder);
    
    // Dispatch a storage event to notify other components
    window.dispatchEvent(new Event('storage'));
  }, [sortOrder]);

  // Notify other components when filter type changes
  useEffect(() => {
    // Store the selected type in localStorage
    if (selectedType) {
      localStorage.setItem('timeline_filter_type', selectedType);
    } else {
      localStorage.removeItem('timeline_filter_type');
    }
    
    // Dispatch a custom event to notify other components
    window.dispatchEvent(new Event('timeline_filter_change'));
  }, [selectedType]);

  const handleDeleteClick = (event) => {
    setEventToDelete(event);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (eventToDelete) {
      onEventDelete(eventToDelete);
    }
    setDeleteDialogOpen(false);
    setEventToDelete(null);
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setEventToDelete(null);
  };

  const scrollToEvent = (eventId) => {
    const eventElement = eventRefs.current[eventId];
    console.log('Scrolling to event:', eventId, 'Element:', eventElement); // Debug log
    if (eventElement) {
      // Use a small timeout to ensure the DOM has updated
      setTimeout(() => {
        const { top, height } = eventElement.getBoundingClientRect();
        const centerOffset = (window.innerHeight / 2) - (height / 2);
        window.scrollTo({
          top: top + window.scrollY - centerOffset,
          behavior: 'smooth'
        });
      }, 100);
    } else {
      console.error('Event element not found:', eventId); // Debug log
    }
  };

  const handleEventDotClick = (eventId) => {
    scrollToEvent(eventId);
  };

  // Handle selection changes and scrolling
  useEffect(() => {
    if (selectedEventId !== previousSelectedId && shouldScrollToEvent) {
      // Set a timeout to allow the fade-out animation of the previous selection
      const timeoutId = setTimeout(() => {
        if (selectedEventId && eventRefs.current[selectedEventId]) {
          eventRefs.current[selectedEventId].scrollIntoView({
            behavior: 'smooth',
            block: 'nearest'
          });
        }
      }, 200);

      setPreviousSelectedId(selectedEventId);
      return () => clearTimeout(timeoutId);
    } else if (selectedEventId !== previousSelectedId) {
      // Still update previousSelectedId even if we don't scroll
      setPreviousSelectedId(selectedEventId);
    }
  }, [selectedEventId, previousSelectedId, shouldScrollToEvent]);

  // Centering the focused card
  useEffect(() => {
    if (selectedEventId && eventRefs.current[selectedEventId] && shouldScrollToEvent) {
      const cardElement = eventRefs.current[selectedEventId];
      const { top, height } = cardElement.getBoundingClientRect();
      const centerOffset = (window.innerHeight / 2) - (height / 2);
      window.scrollTo({
        top: top + window.scrollY - centerOffset,
        behavior: 'smooth'
      });
    }
  }, [selectedEventId, shouldScrollToEvent]);

  const renderEventCard = (event) => {
    const isSelected = event.id === selectedEventId;
    const wasSelected = event.id === previousSelectedId && event.id !== selectedEventId;
    console.log('Rendering event:', event.type, 'Selected:', isSelected); // Debug log

    const commonProps = {
      key: event.id,
      event,
      onEdit: onEventEdit,
      onDelete: handleDeleteClick,
      isSelected: isSelected,
    };

    // Create refs for each card type to access their methods
    const cardRef = React.createRef();
    
    const card = (() => {
      switch (event.type?.toLowerCase()) {
        case EVENT_TYPES.NEWS:
          // Store the ref in the eventRefs object with a type-specific key
          eventRefs.current[`news-card-${event.id}`] = cardRef;
          return <NewsCard ref={cardRef} {...commonProps} />;
        case EVENT_TYPES.MEDIA:
          eventRefs.current[`media-card-${event.id}`] = cardRef;
          return <MediaCard ref={cardRef} {...commonProps} />;
        default:
          eventRefs.current[`remark-card-${event.id}`] = cardRef;
          return <RemarkCard ref={cardRef} {...commonProps} />;
      }
    })();

    // Get the appropriate color based on event type
    const getEventColor = () => {
      if (!event.type) return theme.palette.primary.main;
      const colors = EVENT_TYPE_COLORS[event.type];
      return theme.palette.mode === 'dark' ? colors.dark : colors.light;
    };

    return (
      <motion.div
        animate={isSelected ? {
          scale: [1, 1.02, 1],
          boxShadow: [
            "0px 0px 0px 0px rgba(0,0,0,0)",
            `0px 0px 8px 2px ${getEventColor()}`,
            `0px 0px 0px 2px ${getEventColor()}`
          ],
          border: `2px solid ${getEventColor()}`
        } : {
          scale: 1,
          boxShadow: "0px 0px 0px 0px rgba(0,0,0,0)",
          border: "2px solid transparent"
        }}
        transition={{
          duration: 0.5,
          ease: "easeInOut",
          times: [0, 0.6, 1]
        }}
        style={{
          borderRadius: '8px',
          marginBottom: '16px',
          opacity: wasSelected ? 0.7 : 1,
          transition: 'opacity 0.3s ease-out'
        }}
        onClick={() => {
          console.log('Clicked event ID:', event.id);
          if (selectedEventId !== event.id) {
            // If not already selected, just select it
            console.log('Selecting event:', event.id);
            onEventSelect(event);
            
            // Scroll to center the card
            const cardElement = eventRefs.current[event.id];
            if (cardElement) {
              const { top, height } = cardElement.getBoundingClientRect();
              const centerOffset = (window.innerHeight / 2) - (height / 2);
              window.scrollTo({
                top: top + window.scrollY - centerOffset,
                behavior: 'smooth'
              });
            } else {
              console.warn('No reference found for event ID:', event.id);
            }
          } else {
            // If already selected, directly edit the event with a special action type
            console.log('Opening popup for already selected event:', event.id);
            // Use the standard onEventEdit function with a special flag
            if (onEventEdit && typeof onEventEdit === 'function') {
              onEventEdit({ type: 'openPopup', event });
            }
          }
        }}
        ref={el => eventRefs.current[event.id] = el}
      >
        {card}
      </motion.div>
    );
  };

  // Filter events based on the current view mode and visible marker range
  const filterEventsByViewMode = (events) => {
    if (!events || events.length === 0) return [];
    
    // In base coordinate view, show all events
    if (viewMode === 'position') return events;
    
    const currentDate = new Date();
    
    // Calculate the date range based on visible markers
    let startDate, endDate;
    
    switch (viewMode) {
      case 'day': {
        // In day view, each marker represents an hour
        // minMarker is hours before current time, maxMarker is hours after
        startDate = new Date(currentDate);
        startDate.setHours(startDate.getHours() + minMarker);
        
        endDate = new Date(currentDate);
        endDate.setHours(endDate.getHours() + maxMarker);
        break;
      }
      
      case 'week': {
        // In week view, each marker represents a day
        startDate = subDays(currentDate, Math.abs(minMarker));
        endDate = addDays(currentDate, maxMarker);
        break;
      }
      
      case 'month': {
        // In month view, each marker represents a month
        startDate = subMonths(currentDate, Math.abs(minMarker));
        endDate = addMonths(currentDate, maxMarker);
        break;
      }
      
      case 'year': {
        // In year view, each marker represents a year
        startDate = subYears(currentDate, Math.abs(minMarker));
        endDate = addYears(currentDate, maxMarker);
        break;
      }
      
      default:
        return events;
    }
    
    console.log(`Filtering events between ${startDate.toISOString()} and ${endDate.toISOString()}`);
    
    // Filter events to only include those within the visible date range
    return events.filter(event => {
      if (!event.event_date) return false;
      
      const eventDate = new Date(event.event_date);
      return eventDate >= startDate && eventDate <= endDate;
    });
  };

  // Filter and sort events
  const filteredAndSortedEvents = useMemo(() => {
    return filterEventsByViewMode(events)
      .filter(event => {
        const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          event.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = !selectedType || event.type.toLowerCase() === selectedType.toLowerCase();
        return matchesSearch && matchesType;
      })
      .sort((a, b) => {
        const dateA = new Date(a.event_date);
        const dateB = new Date(b.event_date);
        return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
      });
  }, [events, searchQuery, selectedType, sortOrder, viewMode, minMarker, maxMarker]);
  
  // Determine which events to display based on pagination settings
  const eventsToDisplay = useMemo(() => {
    return showAll ? filteredAndSortedEvents : filteredAndSortedEvents.slice(0, displayLimit);
  }, [filteredAndSortedEvents, displayLimit, showAll]);

  // Report the filtered events count to the parent component
  useEffect(() => {
    if (onFilteredEventsCount) {
      onFilteredEventsCount(filteredAndSortedEvents.length);
    }
  }, [filteredAndSortedEvents.length, onFilteredEventsCount]);
  
  // Ensure selected event is always visible
  useEffect(() => {
    if (selectedEventId) {
      const selectedEventIndex = filteredAndSortedEvents.findIndex(e => e.id === selectedEventId);
      if (selectedEventIndex >= 0 && selectedEventIndex >= displayLimit) {
        // Either increase displayLimit or show all events
        setDisplayLimit(selectedEventIndex + 1);
      }
    }
  }, [selectedEventId, filteredAndSortedEvents, displayLimit]);
  
  // Reset display limit when filter criteria change
  useEffect(() => {
    setDisplayLimit(20);
    setShowAll(false);
  }, [searchQuery, selectedType, viewMode]);
  
  // Add scroll event listener for To Top button
  useEffect(() => {
    const handleScroll = () => {
      // Show To Top button when scrolled down 500px or more
      setShowToTop(window.scrollY > 500);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  // Function to scroll back to top
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <Stack spacing={2} sx={{ px: 3 }}>
      {/* We've removed the loading indicator here to prevent flickering */}
      {/* The loading state is now handled by the fixed position indicator in TimelineV3.js */}
      
      {/* Search and Sort Controls */}
      <Stack direction="row" spacing={2} alignItems="center">
        <TextField
          size="small"
          placeholder="Search events..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ flexGrow: 1 }}
        />
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Sort By</InputLabel>
          <Select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            label="Sort By"
            startAdornment={
              <InputAdornment position="start">
                <SortIcon />
              </InputAdornment>
            }
          >
            <MenuItem value="newest">Newest First</MenuItem>
            <MenuItem value="oldest">Oldest First</MenuItem>
          </Select>
        </FormControl>
      </Stack>

      {/* Filter Options */}
      <Paper 
        sx={{ 
          p: 1,
          bgcolor: theme => theme.palette.mode === 'light' 
            ? 'rgba(255, 255, 255, 0.6)' 
            : 'rgba(0, 0, 0, 0.2)',
          backdropFilter: 'blur(8px)'
        }}
        elevation={0}
      >
        <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
          <Button
            variant={selectedType === null ? "contained" : "outlined"}
            size="small"
            onClick={() => setSelectedType(null)}
            sx={{
              minWidth: '80px',
              bgcolor: selectedType === null ? theme.palette.primary.main : 'transparent',
              '&:hover': {
                bgcolor: selectedType === null 
                  ? theme.palette.primary.dark 
                  : theme.palette.action.hover
              }
            }}
          >
            All
          </Button>
          {Object.entries(EVENT_TYPES).map(([key, type]) => (
            <Button
              key={type}
              variant={selectedType === type ? "contained" : "outlined"}
              size="small"
              onClick={() => setSelectedType(selectedType === type ? null : type)}
              startIcon={
                type === EVENT_TYPES.REMARK ? <RemarkIcon /> :
                type === EVENT_TYPES.NEWS ? <NewsIcon /> :
                <MediaIcon />
              }
              sx={{
                minWidth: '100px',
                bgcolor: selectedType === type ? EVENT_TYPE_COLORS[type].light : 'transparent',
                color: selectedType === type ? 'white' : EVENT_TYPE_COLORS[type].light,
                borderColor: EVENT_TYPE_COLORS[type].light,
                '&:hover': {
                  bgcolor: selectedType === type 
                    ? EVENT_TYPE_COLORS[type].light
                    : `${EVENT_TYPE_COLORS[type].light}22`,
                  borderColor: EVENT_TYPE_COLORS[type].light
                }
              }}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </Button>
          ))}
        </Stack>
      </Paper>

      {/* Event Count Summary */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="caption" color="text.secondary">
          Showing {eventsToDisplay.length} of {filteredAndSortedEvents.length} events
        </Typography>
        {showAll && filteredAndSortedEvents.length > 20 && (
          <Button 
            size="small" 
            variant="text" 
            onClick={() => {
              setShowAll(false);
              setDisplayLimit(20);
            }}
          >
            Show Less
          </Button>
        )}
      </Box>
      
      {/* Event List */}
      <AnimatePresence mode="sync">
        {eventsToDisplay.map((event) => (
          <motion.div
            key={event.id}
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            ref={el => {
              eventRefs.current[event.id] = el;
            }}
          >
            {renderEventCard(event)}
          </motion.div>
        ))}
      </AnimatePresence>
      
      {/* Load More Button and To Top Button */}
      <Fade in={true}>
        <Box sx={{ textAlign: 'center', py: 2, mt: 1, display: 'flex', justifyContent: 'center', gap: 2 }}>
          {!showAll && filteredAndSortedEvents.length > displayLimit && (
            <Button 
              variant="outlined" 
              onClick={() => setDisplayLimit(prev => prev + 20)}
              endIcon={<ExpandMoreIcon />}
              sx={{ 
                px: 3,
                py: 1,
                borderRadius: '20px',
                boxShadow: 1
              }}
            >
              Load More Events
            </Button>
          )}
          
          {showToTop && (
            <Button
              variant="contained"
              color="primary"
              onClick={scrollToTop}
              startIcon={<KeyboardArrowUpIcon />}
              sx={{ 
                px: 3,
                py: 1,
                borderRadius: '20px',
                boxShadow: 1
              }}
            >
              Back to Top
            </Button>
          )}
        </Box>
      </Fade>

      {/* The To Top button has been moved next to the Load More button */}
      
      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
      >
        <DialogTitle>Delete Event</DialogTitle>
        <DialogContent>
          Are you sure you want to delete "{eventToDelete?.title}"?
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error">Delete</Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
};

export default EventList;
