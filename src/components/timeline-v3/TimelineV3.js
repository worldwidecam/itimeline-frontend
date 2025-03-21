import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Container, useTheme, Button, Fade, Stack, Typography, Fab, Tooltip } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';
import { differenceInMilliseconds } from 'date-fns';
import TimelineBackground from './TimelineBackground';
import TimelineBar from './TimelineBar';
import TimeMarkers from './TimeMarkers';
import HoverMarker from './HoverMarker';
import EventMarker from './events/EventMarker';
import EventCounter from './events/EventCounter';
import EventList from './events/EventList';
import EventDialog from './events/EventDialog';
import AddIcon from '@mui/icons-material/Add';
import { subDays, addDays, subMonths, addMonths, subYears, addYears } from 'date-fns';

const API_BASE_URL = '/api';

function TimelineV3() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const theme = useTheme();
  const [timelineId, setTimelineId] = useState(id);
  const [timelineName, setTimelineName] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Fetch timeline details when component mounts or timelineId changes
  useEffect(() => {
    const fetchTimelineDetails = async () => {
      if (!timelineId || timelineId === 'new') return;
      
      try {
        setIsLoading(true);
        const response = await api.get(`/api/timeline-v3/${timelineId}`);
        if (response.data && response.data.name) {
          setTimelineName(response.data.name);
        }
      } catch (error) {
        console.error('Error fetching timeline details:', error);
      } finally {
        setIsLoading(false);
        window.scrollTo(0, 0);  // Scroll to the top of the page
      }
    };

    // First try to get name from URL params (for newly created timelines)
    const params = new URLSearchParams(window.location.search);
    const nameFromUrl = params.get('name');
    if (nameFromUrl) {
      setTimelineName(nameFromUrl);
      setIsLoading(false);
    } else {
      // If no name in URL, fetch from backend
      fetchTimelineDetails();
    }
  }, [timelineId]);

  const getCurrentDateTime = () => {
    // Return the current date and time
    return new Date();
  };

  const getInitialMarkers = () => {
    const markerSpacing = 100; // pixels between each marker
    const screenWidth = window.innerWidth;
    const markersNeeded = Math.ceil(screenWidth / markerSpacing);
    // We want equal numbers on each side of zero, so we'll make it odd
    const totalMarkers = markersNeeded + (markersNeeded % 2 === 0 ? 1 : 0);
    const sideCount = Math.floor(totalMarkers / 2);
    
    return Array.from(
      { length: totalMarkers }, 
      (_, i) => i - sideCount
    );
  };

  const getDayProgress = () => {
    const now = getCurrentDateTime();
    const minutes = now.getHours() * 60 + now.getMinutes();
    return minutes / (24 * 60); // Returns a value between 0 and 1
  };

  const getMonthProgress = () => {
    const now = getCurrentDateTime();
    const currentDay = now.getDate();
    const totalDays = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    return (currentDay - 1) / totalDays; // Returns a value between 0 and 1
  };

  const getYearProgress = () => {
    const now = getCurrentDateTime();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const diff = now - startOfYear;
    const oneYear = 1000 * 60 * 60 * 24 * 365; // milliseconds in a year
    return diff / oneYear; // Returns a value between 0 and 1
  };

  const getExactTimePosition = () => {
    const now = getCurrentDateTime();
    
    if (viewMode === 'year') {
      return getYearProgress();
    }
    
    if (viewMode === 'month') {
      return getMonthProgress();
    }
    
    if (viewMode === 'week') {
      return getDayProgress();
    }
    
    // Day view - Calculate position relative to current hour
    const currentMinute = now.getMinutes();
    return currentMinute / 60; // Returns a value between 0 and 1
  };

  const getFormattedDate = () => {
    const now = getCurrentDateTime();
    return now.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getViewDescription = () => {
    if (viewMode === 'day') {
      return (
        <>
          <Typography variant="subtitle1" color="text.secondary" component="span" sx={{ mr: 1 }}>
            Day View
          </Typography>
          <Typography variant="subtitle1" color="text.secondary" component="span">
            {getFormattedDate()}
          </Typography>
        </>
      );
    }
    if (viewMode === 'week') {
      return (
        <>
          <Typography variant="subtitle1" color="text.secondary" component="span" sx={{ mr: 1 }}>
            Week View
          </Typography>
          <Typography variant="subtitle1" color="text.secondary" component="span">
            {getFormattedDate()}
          </Typography>
        </>
      );
    }
    if (viewMode === 'month') {
      return (
        <>
          <Typography variant="subtitle1" color="text.secondary" component="span" sx={{ mr: 1 }}>
            Month View
          </Typography>
          <Typography variant="subtitle1" color="text.secondary" component="span">
            {getFormattedDate()}
          </Typography>
        </>
      );
    }
    if (viewMode === 'year') {
      return (
        <>
          <Typography variant="subtitle1" color="text.secondary" component="span" sx={{ mr: 1 }}>
            Year View
          </Typography>
          <Typography variant="subtitle1" color="text.secondary" component="span">
            {getFormattedDate()}
          </Typography>
        </>
      );
    }
    return (
      <>
        <Typography variant="subtitle1" color="text.secondary" component="span" sx={{ mr: 1 }}>
          Coordinate View
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" component="span">
          Reference point is position 0
        </Typography>
      </>
    );
  };

  // Core state
  const [timelineOffset, setTimelineOffset] = useState(0);
  const [markers, setMarkers] = useState(getInitialMarkers());
  const [viewMode, setViewMode] = useState(() => {
    // Get view mode from URL or default to 'day'
    const params = new URLSearchParams(window.location.search);
    return params.get('view') || 'day';
  });
  const [hoverPosition, setHoverPosition] = useState(getExactTimePosition());
  const [currentEventIndex, setCurrentEventIndex] = useState(0);
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [shouldScrollToEvent, setShouldScrollToEvent] = useState(true);
  const [isNavigating, setIsNavigating] = useState(false);

  // Add new state for events and event form
  const [events, setEvents] = useState([]);
  const [isEventFormOpen, setIsEventFormOpen] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Get sort order from localStorage
  const [sortOrder, setSortOrder] = useState(() => {
    return localStorage.getItem('timeline_sort_preference') || 'newest';
  });

  // Get selected filter type from localStorage
  const [selectedType, setSelectedType] = useState(() => {
    return localStorage.getItem('timeline_filter_type') || null;
  });

  // Update sortOrder when localStorage changes
  useEffect(() => {
    const handleStorageChange = () => {
      setSortOrder(localStorage.getItem('timeline_sort_preference') || 'newest');
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Update selectedType when filter changes
  useEffect(() => {
    const handleFilterChange = () => {
      setSelectedType(localStorage.getItem('timeline_filter_type') || null);
    };
    
    window.addEventListener('timeline_filter_change', handleFilterChange);
    return () => window.removeEventListener('timeline_filter_change', handleFilterChange);
  }, []);

  const [isRecentering, setIsRecentering] = useState(false);
  const [isFullyFaded, setIsFullyFaded] = useState(false);

  // Add new state to track visible markers
  const [visibleMarkers, setVisibleMarkers] = useState([]);

  // Update visible markers when timeline offset or markers change
  useEffect(() => {
    // Calculate which markers are currently visible on screen
    const screenWidth = window.innerWidth;
    const markerWidth = 100;
    const visibleMarkerCount = Math.ceil(screenWidth / markerWidth);
    
    // Calculate the center marker based on the timeline offset
    const centerMarkerPosition = -timelineOffset / markerWidth;
    
    // Calculate the range of visible markers
    const halfVisibleCount = Math.floor(visibleMarkerCount / 2);
    
    // Add a small buffer to ensure we capture all visible markers
    // This helps account for any rounding or calculation discrepancies
    const buffer = 0; // Reduced buffer to show only exactly visible markers
    
    const minVisibleMarker = Math.floor(centerMarkerPosition - halfVisibleCount - buffer);
    const maxVisibleMarker = Math.ceil(centerMarkerPosition + halfVisibleCount + buffer);
    
    console.log('Visible markers calculation:', {
      screenWidth,
      markerWidth,
      visibleMarkerCount,
      centerMarkerPosition,
      halfVisibleCount,
      minVisibleMarker,
      maxVisibleMarker
    });
    
    // Filter markers to only include those in the visible range
    const currentVisibleMarkers = markers.filter(
      marker => marker >= minVisibleMarker && marker <= maxVisibleMarker
    );
    
    console.log('Current visible markers:', currentVisibleMarkers);
    
    setVisibleMarkers(currentVisibleMarkers);
  }, [timelineOffset, markers]);

  // Add state to track filtered events count
  const [filteredEventsCount, setFilteredEventsCount] = useState(0);

  const handleEventSelect = (event) => {
    setSelectedEventId(event.id);
    setShouldScrollToEvent(true);
    
    // Also update the currentEventIndex to keep carousel in sync
    const eventIndex = events.findIndex(e => e.id === event.id);
    if (eventIndex !== -1) {
      setCurrentEventIndex(eventIndex);
    }
  };

  const handleDotClick = (event) => {
    console.log('Dot clicked for event:', event); // Debug log
    
    // Find the index of the clicked event in the events array
    const eventIndex = events.findIndex(e => e.id === event.id);
    
    if (viewMode !== 'position') {
      // In filter views (day, week, month, year), focus on the event marker
      setCurrentEventIndex(eventIndex);
      // Still set the selectedEventId so the event is highlighted in the list
      // but don't scroll to it
      setShouldScrollToEvent(false);
      setSelectedEventId(event.id);
      
      // Navigate to the marker using sequential button presses
      navigateToEvent(event);
    } else {
      // In coordinate view, focus on the event in the list and scroll to it
      setShouldScrollToEvent(true);
      setSelectedEventId(event.id);
      setCurrentEventIndex(eventIndex);
    }
  };

  const handleMarkerClick = (event, index) => {
    console.log('Marker clicked for event:', event, 'at index:', index);
    
    // Set the selected event ID to highlight it in the list
    setSelectedEventId(event.id);
    
    // Don't scroll to the event in the list
    setShouldScrollToEvent(false);
    
    // Get the filtered events array that's used by the EventCounter
    const filteredEvents = events.filter(e => {
      // Apply the same filtering logic as in EventCounter
      if (viewMode === 'position') return true;
      
      if (!e.event_date) return false;
      
      const currentDate = new Date();
      let startDate, endDate;
      
      switch (viewMode) {
        case 'day': {
          startDate = new Date(currentDate);
          startDate.setHours(startDate.getHours() + Math.min(...visibleMarkers));
          
          endDate = new Date(currentDate);
          endDate.setHours(endDate.getHours() + Math.max(...visibleMarkers));
          break;
        }
        case 'week': {
          startDate = subDays(currentDate, Math.abs(Math.min(...visibleMarkers)));
          endDate = addDays(currentDate, Math.max(...visibleMarkers));
          break;
        }
        case 'month': {
          startDate = subMonths(currentDate, Math.abs(Math.min(...visibleMarkers)));
          endDate = addMonths(currentDate, Math.max(...visibleMarkers));
          break;
        }
        case 'year': {
          startDate = subYears(currentDate, Math.abs(Math.min(...visibleMarkers)));
          endDate = addYears(currentDate, Math.max(...visibleMarkers));
          break;
        }
        default:
          return true;
      }
      
      const eventDate = new Date(e.event_date);
      return eventDate >= startDate && eventDate <= endDate;
    });
    
    // Find the index of the clicked event in the filtered events array
    const filteredIndex = filteredEvents.findIndex(e => e.id === event.id);
    
    // Update the current event index to keep the carousel in sync
    if (filteredIndex !== -1) {
      console.log('Setting currentEventIndex to filtered index:', filteredIndex);
      setCurrentEventIndex(filteredIndex);
    } else {
      // If the event isn't in the filtered array, keep the original index
      console.log('Event not found in filtered array, using original index:', index);
      setCurrentEventIndex(index);
    }
  };

  // Fetch events when timeline ID changes
  useEffect(() => {
    const fetchEvents = async () => {
      if (!timelineId || timelineId === 'new') return;
      
      try {
        setIsLoadingEvents(true);
        console.log('Fetching events for timeline:', timelineId);
        const response = await api.get(`/api/timeline-v3/${timelineId}/events`);
        console.log('Events response:', response.data);
        setEvents(response.data);
      } catch (error) {
        console.error('Error fetching events:', error);
      } finally {
        setIsLoadingEvents(false);
      }
    };

    fetchEvents();
  }, [timelineId]);

  // Create timeline when component mounts
  useEffect(() => {
    const createTimeline = async () => {
      try {
        // Get timeline name from URL parameters
        const params = new URLSearchParams(window.location.search);
        const timelineName = params.get('name') || 'Timeline V3';
        
        const response = await api.post('/api/timeline-v3', {
          name: timelineName,
          description: `A new timeline created: ${timelineName}`
        });
        setTimelineId(response.data.id);
        console.log('Timeline created:', response.data);
      } catch (error) {
        console.error('Error creating timeline:', error);
      }
    };
    
    if (!timelineId) {
      createTimeline();
    }
  }, [timelineId]);

  const handleEventSubmit = async (eventData) => {
    let mediaUrl = null; // Define mediaUrl here
    try {
      console.log('Sending event creation request to:', `/api/timeline-v3/${timelineId}/events`);
      
      // Create a new date object from the event_date
      const originalDate = new Date(eventData.event_date);
      console.log('Original date before adjustment:', originalDate);
      
      // Extract date components for raw date string
      const year = originalDate.getFullYear();
      const month = originalDate.getMonth() + 1; // Month is 0-indexed in JS
      const day = originalDate.getDate();
      const hours = originalDate.getHours();
      const minutes = String(originalDate.getMinutes()).padStart(2, '0');
      
      // Determine AM/PM
      const ampm = hours >= 12 ? 'PM' : 'AM';
      
      // Convert to 12-hour format for display
      const displayHours = hours % 12;
      const displayHoursFormatted = displayHours ? displayHours : 12; // Convert 0 to 12
      
      // Create the raw date string in the format: MM.DD.YYYY.HH.MM.AMPM
      const rawDateString = `${month}.${day}.${year}.${displayHoursFormatted}.${minutes}.${ampm}`;
      
      console.log('===== EVENT SUBMISSION DEBUG =====');
      console.log('Original date object:', originalDate);
      console.log('Created raw date string:', rawDateString);
      console.log('=================================');
      
      // Use the original date in the request along with the raw date string
      const response = await api.post(`/api/timeline-v3/${timelineId}/events`, {
        title: eventData.title,
        description: eventData.description,
        event_date: originalDate.toISOString(), // Use original date
        raw_event_date: rawDateString, // Add raw date string
        is_exact_user_time: true, // Flag to indicate this is a user-selected time
        type: eventData.type,
        url: eventData.url || '',
        url_title: eventData.url_title || '',
        url_description: eventData.url_description || '',
        url_image: eventData.url_image || '',
        url_source: eventData.url_source || '',
        media_url: mediaUrl || '',
        media_type: eventData.media ? eventData.media.type.split('/')[0] : '',
        tags: eventData.tags || []
      });
      console.log('Event creation response:', response.data);

      // Add the new event to state and close form
      const newEvent = response.data;
      
      // Add the new event to the events array
      const updatedEvents = [...events, newEvent];
      setEvents(updatedEvents);
      
      // Select the new event
      setSelectedEventId(newEvent.id);
      
      // Update the current event index to point to the new event
      setCurrentEventIndex(updatedEvents.length - 1);
      
      // Ensure the timeline is refreshed to show the new event marker
      // This forces a re-render of the event markers
      window.timelineEventPositions = window.timelineEventPositions || [];
      
      // Close the dialog
      setDialogOpen(false);
      setEditingEvent(null);
      
      // After a short delay, navigate to the new event to ensure it's visible
      setTimeout(() => {
        navigateToEvent(newEvent);
      }, 300);
    } catch (error) {
      console.error('Error creating event:', error);
      console.error('Error response:', error.response);
      console.error('Error request:', error.request);
      setSubmitError(error.response?.data?.error || 'Failed to create event');
      throw error;
    }
  };

  const handleEventEdit = (event) => {
    setEditingEvent(event);
    setDialogOpen(true);
  };

  const handleEventDelete = async (event) => {
    try {
      await api.delete(`/api/timeline-v3/${timelineId}/events/${event.id}`);
      setEvents(events.filter(e => e.id !== event.id));
      if (selectedEventId === event.id) {
        setSelectedEventId(null);
      }
    } catch (error) {
      console.error('Error deleting event:', error);
      // Keep the event in the UI if deletion fails
    }
  };

  // Update hover position when view mode changes
  useEffect(() => {
    setHoverPosition(getExactTimePosition());
  }, [viewMode]);

  // Update hover position every minute
  useEffect(() => {
    if (viewMode === 'day') {
      const interval = setInterval(() => {
        setHoverPosition(getExactTimePosition());
      }, 60000); // Update every minute
      return () => clearInterval(interval);
    }
  }, [viewMode]);

  // Update markers on window resize
  useEffect(() => {
    const handleResize = () => {
      // Only update if we're centered (timelineOffset === 0)
      if (timelineOffset === 0) {
        setMarkers(getInitialMarkers());
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [timelineOffset]);

  // Store the previous view mode to detect first load
  const prevViewModeRef = useRef(null);

  // Reset current event index when switching views
  useEffect(() => {
    if (viewMode !== 'position') {
      // Only reset selection on first load, not when switching between views
      if (prevViewModeRef.current === null) {
        setCurrentEventIndex(0);
        setSelectedEventId(null);
      }
      
      // Update the ref with current view mode
      prevViewModeRef.current = viewMode;
      
      // Clear event positions when view mode changes
      window.timelineEventPositions = [];
    }
  }, [viewMode]);

  // Reset current event index if it's out of bounds after events change
  useEffect(() => {
    if (currentEventIndex >= events.length && currentEventIndex !== -1) {
      setCurrentEventIndex(Math.max(0, events.length - 1));
    }
  }, [events.length, currentEventIndex]);

  const handleLeft = () => {
    console.log('Executing LEFT button press');
    const minMarker = Math.min(...markers);
    setMarkers(prevMarkers => [...prevMarkers, minMarker - 1]);
    setTimelineOffset(prevOffset => prevOffset + 100);
  };

  const handleRight = () => {
    console.log('Executing RIGHT button press');
    const maxMarker = Math.max(...markers);
    setMarkers(prevMarkers => [...prevMarkers, maxMarker + 1]);
    setTimelineOffset(prevOffset => prevOffset - 100);
  };

  // Navigate to an event using sequential button presses
  const navigateToEvent = (event) => {
    if (!event || !event.event_date || viewMode === 'position' || isNavigating) return;
    
    // Calculate the temporal distance between the event and current reference point
    const distance = calculateTemporalDistance(event.event_date);
    
    // Calculate how many steps (button presses) we need
    // Each button press moves by 1 marker, which is 100px
    // For day view, each marker represents an hour
    let stepsNeeded;
    
    if (viewMode === 'day') {
      // In day view, each marker represents an hour
      stepsNeeded = Math.round(distance);
    } else if (viewMode === 'week') {
      // In week view, each marker represents a day
      stepsNeeded = Math.round(distance);
    } else if (viewMode === 'month') {
      // In month view, each marker represents a month
      stepsNeeded = Math.round(distance);
    } else if (viewMode === 'year') {
      // In year view, each marker represents a year
      stepsNeeded = Math.round(distance);
    } else {
      stepsNeeded = Math.round(distance);
    }
    
    // Don't navigate if the event is already centered or very close
    if (Math.abs(stepsNeeded) === 0) return;
    
    console.log(`Navigating to event: ${event.title}`);
    console.log(`Event date: ${new Date(event.event_date).toLocaleString()}`);
    console.log(`Current date: ${new Date().toLocaleString()}`);
    console.log(`Calculated distance: ${distance}`);
    console.log(`Steps needed: ${stepsNeeded}`);
    
    // Determine which button to press (left or right)
    // IMPORTANT: Past events (negative distance) need LEFT button
    // Future events (positive distance) need RIGHT button
    const direction = stepsNeeded > 0 ? 'right' : 'left';
    const numberOfPresses = Math.abs(stepsNeeded);
    
    console.log(`Direction: ${direction}`);
    console.log(`Number of presses: ${numberOfPresses}`);
    
    // Start the navigation process
    setIsNavigating(true);
    
    // Preload markers before starting navigation
    preloadMarkersForNavigation(direction, numberOfPresses).then(() => {
      // After preloading, execute the button presses
      executeButtonPresses(direction, numberOfPresses);
    });
  };
  
  // Preload markers in the direction we're going to navigate
  const preloadMarkersForNavigation = (direction, numberOfPresses) => {
    console.log(`Preloading ${numberOfPresses} markers in ${direction} direction`);
    
    return new Promise((resolve) => {
      // Calculate buffer based on screen width (more buffer for wider screens)
      const screenWidth = window.innerWidth;
      const bufferMultiplier = 1.5; // Add 50% more markers than needed
      const bufferSize = Math.ceil(numberOfPresses * bufferMultiplier);
      
      console.log(`Buffer size: ${bufferSize} markers`);
      
      // Create new markers to preload
      if (direction === 'left') {
        const minMarker = Math.min(...markers);
        const newMarkers = Array.from(
          { length: bufferSize },
          (_, i) => minMarker - (i + 1)
        );
        console.log(`Preloading left markers: ${minMarker} to ${minMarker - bufferSize}`);
        setMarkers(prevMarkers => [...prevMarkers, ...newMarkers]);
      } else {
        const maxMarker = Math.max(...markers);
        const newMarkers = Array.from(
          { length: bufferSize },
          (_, i) => maxMarker + (i + 1)
        );
        console.log(`Preloading right markers: ${maxMarker} to ${maxMarker + bufferSize}`);
        setMarkers(prevMarkers => [...prevMarkers, ...newMarkers]);
      }
      
      // Give a short delay for the markers to render before starting navigation
      setTimeout(resolve, 100);
    });
  };
  
  // Create a function to handle a single button press
  const performButtonPress = (direction) => {
    if (direction === 'left') {
      const minMarker = Math.min(...markers);
      setMarkers(prevMarkers => [...prevMarkers, minMarker - 1]);
      setTimelineOffset(prevOffset => prevOffset + 100);
    } else {
      const maxMarker = Math.max(...markers);
      setMarkers(prevMarkers => [...prevMarkers, maxMarker + 1]);
      setTimelineOffset(prevOffset => prevOffset - 100);
    }
  };
  
  // Function to execute button presses with delay
  const executeButtonPresses = (direction, totalPresses, pressCount = 0) => {
    // Add debug log to track progress
    console.log(`Press ${pressCount + 1}/${totalPresses}, Remaining: ${totalPresses - pressCount}`);
    
    if (pressCount >= totalPresses) {
      console.log('Navigation complete');
      setIsNavigating(false);
      return;
    }
    
    // For smoother animation, use smooth scrolling for longer distances
    if (totalPresses > 3) {
      // Use smooth animation for longer distances
      smoothScrollTimeline(direction, totalPresses);
      return;
    } else {
      // For short distances, use the original button press method
      // Press the button using our direct function instead of the handler
      performButtonPress(direction);
      
      // Schedule the next button press after delay
      setTimeout(() => {
        executeButtonPresses(direction, totalPresses, pressCount + 1);
      }, 300); // 300ms delay between presses
    }
  };

  // Smooth scrolling animation for the timeline
  const smoothScrollTimeline = (direction, distance) => {
    console.log(`Starting smooth scroll: ${direction}, distance: ${distance}`);
    
    // Calculate the target offset
    const targetOffset = direction === 'left' 
      ? timelineOffset + (distance * 100) 
      : timelineOffset - (distance * 100);
    
    // Preload markers in the direction we're scrolling
    if (direction === 'left') {
      const minMarker = Math.min(...markers);
      const newMarkers = Array.from(
        { length: distance + 2 }, // Add a couple extra for buffer
        (_, i) => minMarker - (i + 1)
      );
      console.log(`Preloading left markers: ${minMarker} to ${minMarker - distance - 2}`);
      setMarkers(prevMarkers => [...prevMarkers, ...newMarkers]);
    } else {
      const maxMarker = Math.max(...markers);
      const newMarkers = Array.from(
        { length: distance + 2 }, // Add a couple extra for buffer
        (_, i) => maxMarker + (i + 1)
      );
      console.log(`Preloading right markers: ${maxMarker} to ${maxMarker + distance + 2}`);
      setMarkers(prevMarkers => [...prevMarkers, ...newMarkers]);
    }
    
    // Set up animation variables
    const startTime = performance.now();
    const startOffset = timelineOffset;
    const totalDistance = Math.abs(targetOffset - startOffset);
    
    // Animation duration based on distance (longer for greater distances, but with a cap)
    const baseDuration = 500; // Base duration in ms
    const maxDuration = 1500; // Maximum duration in ms
    const durationPerMarker = 100; // Additional ms per marker
    const duration = Math.min(baseDuration + (distance * durationPerMarker), maxDuration);
    
    // Use easeInOutCubic for a natural feel
    const easeInOutCubic = t => t < 0.5 
      ? 4 * t * t * t 
      : 1 - Math.pow(-2 * t + 2, 3) / 2;
    
    // Animation frame function
    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeInOutCubic(progress);
      
      // Calculate the new offset
      const newOffset = startOffset + ((targetOffset - startOffset) * easedProgress);
      
      // Update the timeline offset
      setTimelineOffset(newOffset);
      
      // Continue animation if not complete
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        // Ensure we end exactly at the target offset
        setTimelineOffset(targetOffset);
        console.log('Smooth scroll complete');
        setIsNavigating(false);
      }
    };
    
    // Start the animation
    requestAnimationFrame(animate);
  };

  const markerStyles = {
    reference: {
      '& .marker-line': {
        height: '20px',
        width: '2px',
        backgroundColor: theme.palette.primary.main
      }
    },
    regular: {
      '& .marker-line': {
        height: '10px',
        width: '1px',
        backgroundColor: theme.palette.text.secondary
      }
    }
  };

  const timelineTransitionStyles = {
    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    opacity: isRecentering ? 0 : 1,
    transform: `
      translate3d(0, 0, 0)
      scale(${isRecentering ? '0.98' : '1'})
      ${isFullyFaded ? 'translateY(-10px)' : 'translateY(0)'}
    `,
    pointerEvents: isRecentering ? 'none' : 'auto',
    willChange: 'transform, opacity'
  };

  const handleBackgroundClick = () => {
    setCurrentEventIndex(-1);
    setSelectedEventId(null);
  };

  // Calculate the temporal distance between an event and the current reference point
  const calculateTemporalDistance = (eventDate) => {
    if (!eventDate) return 0;
    
    const currentDate = new Date();
    const eventDateObj = new Date(eventDate);
    
    // Add debug logs to see the dates we're comparing
    console.log('Calculating temporal distance:');
    console.log(`Event date: ${eventDateObj.toLocaleString()}`);
    console.log(`Current date: ${currentDate.toLocaleString()}`);
    console.log(`Current timeline offset: ${timelineOffset}`);
    console.log(`Current view mode: ${viewMode}`);
    
    // Calculate the current position on the timeline based on the offset
    // A negative offset means we've moved right (into the future)
    // A positive offset means we've moved left (into the past)
    const currentPosition = -timelineOffset / 100; // Each marker is 100px
    console.log(`Current position (in markers): ${currentPosition}`);
    
    let distance = 0;
    
    switch (viewMode) {
      case 'day': {
        // Calculate day difference and hour/minute position
        const dayDiffMs = differenceInMilliseconds(
          new Date(eventDateObj.getFullYear(), eventDateObj.getMonth(), eventDateObj.getDate()),
          new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate())
        );
        
        const dayDiff = dayDiffMs / (1000 * 60 * 60 * 24);
        const currentHour = currentDate.getHours();
        const eventHour = eventDateObj.getHours();
        const eventMinute = eventDateObj.getMinutes();
        
        // Position calculation (same as in EventMarker)
        const absoluteDistance = (dayDiff * 24) + eventHour - currentHour + (eventMinute / 60);
        
        // Adjust for current timeline position
        distance = absoluteDistance - currentPosition;
        
        console.log(`Day diff: ${dayDiff}`);
        console.log(`Current hour: ${currentHour}`);
        console.log(`Event hour: ${eventHour}`);
        console.log(`Event minute: ${eventMinute}`);
        console.log(`Absolute distance: ${absoluteDistance}`);
        console.log(`Adjusted distance: ${distance}`);
        break;
      }
      
      case 'week': {
        const dayDiffMs = differenceInMilliseconds(
          new Date(eventDateObj.getFullYear(), eventDateObj.getMonth(), eventDateObj.getDate()),
          new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate())
        );
        
        const dayDiff = dayDiffMs / (1000 * 60 * 60 * 24);
        
        let absoluteDistance;
        if (dayDiff === 0) {
          const totalMinutesInDay = 24 * 60;
          const eventMinutesIntoDay = eventDateObj.getHours() * 60 + eventDateObj.getMinutes();
          absoluteDistance = eventMinutesIntoDay / totalMinutesInDay;
        } else {
          const eventHour = eventDateObj.getHours();
          const eventMinute = eventDateObj.getMinutes();
          
          const totalMinutesInDay = 24 * 60;
          const eventMinutesIntoDay = eventHour * 60 + eventMinute;
          const eventFractionOfDay = eventMinutesIntoDay / totalMinutesInDay;
          
          absoluteDistance = Math.floor(dayDiff) + eventFractionOfDay;
        }
        
        // Adjust for current timeline position
        distance = absoluteDistance - currentPosition;
        
        console.log(`Absolute distance: ${absoluteDistance}`);
        console.log(`Adjusted distance: ${distance}`);
        break;
      }
      
      case 'month': {
        const eventYear = eventDateObj.getFullYear();
        const currentYear = currentDate.getFullYear();
        const eventMonth = eventDateObj.getMonth();
        const currentMonth = currentDate.getMonth();
        const eventDay = eventDateObj.getDate();
        const daysInMonth = new Date(eventYear, eventMonth + 1, 0).getDate();
        
        const monthYearDiff = eventYear - currentYear;
        const monthDiff = eventMonth - currentMonth + (monthYearDiff * 12);
        
        const monthDayFraction = (eventDay - 1) / daysInMonth;
        
        const absoluteDistance = monthDiff + monthDayFraction;
        
        // Adjust for current timeline position
        distance = absoluteDistance - currentPosition;
        
        console.log(`Absolute distance: ${absoluteDistance}`);
        console.log(`Adjusted distance: ${distance}`);
        break;
      }
      
      case 'year': {
        const yearDiff = eventDateObj.getFullYear() - currentDate.getFullYear();
        
        const yearMonthContribution = eventDateObj.getMonth() / 12;
        const yearDayFraction = (eventDateObj.getDate() - 1) / new Date(eventDateObj.getFullYear(), eventDateObj.getMonth() + 1, 0).getDate();
        const yearDayContribution = yearDayFraction / 12;
        
        const absoluteDistance = yearDiff + yearMonthContribution + yearDayContribution;
        
        // Adjust for current timeline position
        distance = absoluteDistance - currentPosition;
        
        console.log(`Absolute distance: ${absoluteDistance}`);
        console.log(`Adjusted distance: ${distance}`);
        break;
      }
      
      default:
        distance = 0;
    }
    
    console.log(`Final calculated distance: ${distance}`);
    return distance;
  };
  
  const handleRecenter = () => {
    setIsRecentering(true);

    // Wait for fade out to complete
    setTimeout(() => {
      setIsFullyFaded(true);
      
      // Reset timeline offset and markers
      setTimelineOffset(0);
      setMarkers(getInitialMarkers());
      
      // Update URL without page reload
      const searchParams = new URLSearchParams(window.location.search);
      searchParams.set('view', viewMode);
      navigate(`/timeline-v3/${timelineId}?${searchParams.toString()}`, { replace: true });

      // Start fade in animation after a short delay
      setTimeout(() => {
        setIsFullyFaded(false);
        setTimeout(() => {
          setIsRecentering(false);
        }, 50);
      }, 100);
    }, 400); // Match the transition duration
  };

  const handleFilteredEventsCount = (count) => {
    setFilteredEventsCount(count);
  };

  return (
    <Box sx={{ 
      display: 'flex',
      flexDirection: 'column',
      minHeight: '400px',
      bgcolor: theme.palette.mode === 'light' ? 'background.default' : '#000',
      overflowX: 'hidden',
      borderRadius: '8px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
      position: 'relative',
      mb: 3
    }}>
      <Container maxWidth={false}>
        <Stack direction="row" spacing={2} sx={{ mb: 2, alignItems: 'center', justifyContent: 'space-between' }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="h4" component="div" sx={{ color: theme.palette.primary.main, minWidth: '200px' }}>
              {!isLoading && `# ${timelineName}`}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {getViewDescription()}
            </Box>
            <Button
              onClick={() => {
                setEditingEvent(null);
                setDialogOpen(true);
              }}
              variant="contained"
              startIcon={<AddIcon />}
              sx={{
                bgcolor: theme.palette.success.main,
                color: 'white',
                '&:hover': {
                  bgcolor: theme.palette.success.dark,
                },
                boxShadow: 2
              }}
            >
              Add Event
            </Button>
            <Fade in={timelineOffset !== 0}>
              <Button
                onClick={handleRecenter}
                variant="contained"
                sx={{
                  bgcolor: theme.palette.primary.main,
                  color: 'white',
                  '&:hover': {
                    bgcolor: theme.palette.primary.dark,
                  },
                  boxShadow: 2
                }}
              >
                Back to Present
              </Button>
            </Fade>
          </Stack>

          <Stack direction="row" spacing={2} alignItems="center">
            {/* Event Counter - Now shows filtered events count */}
            <EventCounter
              count={filteredEventsCount}
              events={events.filter(event => {
                // Apply the same filtering logic as in EventList
                if (viewMode === 'position') return true;
                
                if (!event.event_date) return false;
                
                const currentDate = new Date();
                let startDate, endDate;
                
                // Use only the visible markers without any buffer
                // This ensures we only show events that are actually visible on screen
                
                switch (viewMode) {
                  case 'day': {
                    startDate = new Date(currentDate);
                    startDate.setHours(startDate.getHours() + Math.min(...visibleMarkers));
                    
                    endDate = new Date(currentDate);
                    endDate.setHours(endDate.getHours() + Math.max(...visibleMarkers));
                    break;
                  }
                  case 'week': {
                    startDate = subDays(currentDate, Math.abs(Math.min(...visibleMarkers)));
                    endDate = addDays(currentDate, Math.max(...visibleMarkers));
                    break;
                  }
                  case 'month': {
                    startDate = subMonths(currentDate, Math.abs(Math.min(...visibleMarkers)));
                    endDate = addMonths(currentDate, Math.max(...visibleMarkers));
                    break;
                  }
                  case 'year': {
                    startDate = subYears(currentDate, Math.abs(Math.min(...visibleMarkers)));
                    endDate = addYears(currentDate, Math.max(...visibleMarkers));
                    break;
                  }
                  default:
                    return true;
                }
                
                const eventDate = new Date(event.event_date);
                return eventDate >= startDate && eventDate <= endDate;
              })}
              currentIndex={currentEventIndex}
              onChangeIndex={setCurrentEventIndex}
              onDotClick={handleDotClick}
              viewMode={viewMode}
              timelineOffset={timelineOffset}
              markerSpacing={100}
              sortOrder={sortOrder}
              selectedType={selectedType}
            />
            <Stack direction="row" spacing={1}>
              <Button
                variant={viewMode === 'day' ? "contained" : "outlined"}
                size="small"
                onClick={() => setViewMode(viewMode === 'day' ? 'position' : 'day')}
              >
                Day
              </Button>
              <Button
                variant={viewMode === 'week' ? "contained" : "outlined"}
                size="small"
                onClick={() => setViewMode(viewMode === 'week' ? 'position' : 'week')}
              >
                Week
              </Button>
              <Button
                variant={viewMode === 'month' ? "contained" : "outlined"}
                size="small"
                onClick={() => setViewMode(viewMode === 'month' ? 'position' : 'month')}
              >
                Month
              </Button>
              <Button
                variant={viewMode === 'year' ? "contained" : "outlined"}
                size="small"
                onClick={() => setViewMode(viewMode === 'year' ? 'position' : 'year')}
              >
                Year
              </Button>
            </Stack>
          </Stack>
        </Stack>
        
        <Box 
          sx={{
            width: '100%',
            height: '300px',
            bgcolor: theme.palette.mode === 'light' ? 'background.paper' : '#2c1b47',
            borderRadius: 2,
            boxShadow: 1,
            position: 'relative',
            overflow: 'hidden',
            ...timelineTransitionStyles
          }}
        >
          <TimelineBackground onBackgroundClick={handleBackgroundClick} />
          <TimelineBar
            timelineOffset={timelineOffset}
            markerSpacing={100}
            minMarker={Math.min(...markers)}
            maxMarker={Math.max(...markers)}
            theme={theme}
            style={timelineTransitionStyles}
          />
          {/* Event Markers - only show in time-based views */}
          {viewMode !== 'position' && events.map((event, index) => (
            <EventMarker
              key={event.id}
              event={event}
              timelineOffset={timelineOffset}
              markerSpacing={100}
              viewMode={viewMode}
              index={index}
              totalEvents={events.length}
              currentIndex={currentEventIndex}
              onChangeIndex={setCurrentEventIndex}
              minMarker={Math.min(...markers)}
              maxMarker={Math.max(...markers)}
              onClick={handleMarkerClick}
              style={timelineTransitionStyles}
            />
          ))}
          <TimeMarkers 
            timelineOffset={timelineOffset}
            markerSpacing={100}
            markerStyles={markerStyles}
            markers={markers}
            viewMode={viewMode}
            theme={theme}
            style={timelineTransitionStyles}
          />
          <HoverMarker 
            position={hoverPosition} 
            timelineOffset={timelineOffset}
            markerSpacing={100}
            viewMode={viewMode}
            markers={markers}
            theme={theme}
            style={timelineTransitionStyles}
          />
          <Button
            onClick={handleLeft}
            sx={{
              position: 'absolute',
              left: 20,
              top: '50%',
              transform: 'translateY(-50%)',
              minWidth: 100,
              bgcolor: 'background.paper',
              zIndex: 1050, // Increased z-index to be above marker popups
              boxShadow: 3, // Add shadow to make it stand out
              '&:hover': {
                bgcolor: 'background.paper',
                boxShadow: 4, // Enhanced shadow on hover
              }
            }}
          >
            LEFT
          </Button>
          <Button
            onClick={handleRight}
            sx={{
              position: 'absolute',
              right: 20,
              top: '50%',
              transform: 'translateY(-50%)',
              minWidth: 100,
              bgcolor: 'background.paper',
              zIndex: 1050, // Increased z-index to be above marker popups
              boxShadow: 3, // Add shadow to make it stand out
              '&:hover': {
                bgcolor: 'background.paper',
                boxShadow: 4, // Enhanced shadow on hover
              }
            }}
          >
            RIGHT
          </Button>
        </Box>
      </Container>

      {/* Event List */}
      <Box sx={{ mt: 4 }}>
        <EventList 
          events={events}
          onEventEdit={handleEventEdit}
          onEventDelete={handleEventDelete}
          selectedEventId={selectedEventId}
          onEventSelect={handleEventSelect}
          shouldScrollToEvent={shouldScrollToEvent}
          viewMode={viewMode}
          minMarker={visibleMarkers.length > 0 ? Math.min(...visibleMarkers) : Math.min(...markers)}
          maxMarker={visibleMarkers.length > 0 ? Math.max(...visibleMarkers) : Math.max(...markers)}
          onFilteredEventsCount={handleFilteredEventsCount}
        />
      </Box>

      {/* Event Dialog */}
      <EventDialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setEditingEvent(null);
        }}
        onSave={handleEventSubmit}
        initialEvent={editingEvent}
      />

      {/* Floating Action Button */}
      <Tooltip title="Create New Event">
        <Fab
          color="primary"
          onClick={() => {
            setEditingEvent(null);
            setDialogOpen(true);
          }}
          sx={{
            position: 'fixed',
            right: 32,
            bottom: 32,
            bgcolor: theme.palette.primary.main,
            '&:hover': {
              bgcolor: theme.palette.primary.dark,
            }
          }}
        >
          <AddIcon />
        </Fab>
      </Tooltip>
    </Box>
  );
}

export default TimelineV3;
