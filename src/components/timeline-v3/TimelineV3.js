import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Container, useTheme, Button, Fade, Stack, Typography, Fab, Tooltip, Menu, MenuItem, ListItemIcon, ListItemText, Divider, Snackbar, Alert, CircularProgress } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import api, { checkMembershipStatus, checkMembershipFromUserData, fetchUserMemberships, requestTimelineAccess, getBlockedMembers, fetchUserPassport, debugTimelineMembers, listReports } from '../../utils/api';
import config from '../../config';
import { differenceInMilliseconds, subDays, addDays, subMonths, addMonths, subYears, addYears } from 'date-fns';
import TimelineBackground from './TimelineBackground';
import TimelineBar from './TimelineBar';
import TimeMarkers from './TimeMarkers';
import HoverMarker from './HoverMarker';
import PointBIndicator from './PointBIndicator';
import EventMarker from './events/EventMarker';
import TimelineNameDisplay from './TimelineNameDisplay';
import EventCounter from './events/EventCounter';
import EventList from './events/EventList';
import EventDialog from './events/EventDialog';
import MediaEventCreator from './events/MediaEventCreator';
import RemarkEventCreator from './events/RemarkEventCreator';
import NewsEventCreator from './events/NewsEventCreator';
import CommunityDotTabs from './community/CommunityDotTabs';
import CommunityMembershipControl from './community/CommunityMembershipControl.js';
import useJoinStatus from '../../hooks/useJoinStatus';

// Material UI Icons - importing each icon separately to ensure they're properly loaded
import Add from '@mui/icons-material/Add';
import Comment from '@mui/icons-material/Comment';
import Newspaper from '@mui/icons-material/Newspaper';
import PermMedia from '@mui/icons-material/PermMedia';
import ArrowDropDown from '@mui/icons-material/ArrowDropDown';
import PersonAdd from '@mui/icons-material/PersonAdd';
import CheckCircle from '@mui/icons-material/CheckCircle';
import Block from '@mui/icons-material/Block';
import Check from '@mui/icons-material/Check';
import Settings from '@mui/icons-material/Settings';

// Define icon components to match the names used in the component
const AddIcon = Add;
const CommentIcon = Comment;
const NewspaperIcon = Newspaper;
const PermMediaIcon = PermMedia;
const ArrowDropDownIcon = ArrowDropDown;
const SettingsIcon = Settings;
const PersonAddIcon = PersonAdd;
const CheckIcon = Check;
const CheckCircleIcon = CheckCircle;

// API prefixes are handled by the api utility

function TimelineV3() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const theme = useTheme();
  const [timelineId, setTimelineId] = useState(id);
  const [timelineName, setTimelineName] = useState('');
  const [timeline_type, setTimelineType] = useState('hashtag');
  const [visibility, setVisibility] = useState('public');
  const [requiresApproval, setRequiresApproval] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [joinRequestSent, setJoinRequestSent] = useState(false);
  const [joinRequestStatus, setJoinRequestStatus] = useState(null); // 'success', 'error', or null
  const [joinSnackbarOpen, setJoinSnackbarOpen] = useState(false);
  const [isMember, setIsMember] = useState(null); // Track if user is a member of the community timeline (null = loading)
  const [isBlocked, setIsBlocked] = useState(false); // Track if user is blocked on this timeline
  const [isPendingApproval, setIsPendingApproval] = useState(false); // Track if user has a pending membership request
  const [reviewingEventIds, setReviewingEventIds] = useState(new Set()); // Track event IDs that are "in review" on this timeline

  // Centralized, headless membership logic (no UI changes)
  const {
    isMember: hookIsMember,
    isBlocked: hookIsBlocked,
    isPending: hookIsPending,
    role: hookRole,
    status: hookStatus,
    loading: joinLoading,
    join: joinFromHook,
    refresh: refreshMembership,
  } = useJoinStatus(timelineId, { user });

  // Make the hook authoritative for membership/blocked state while preserving existing UI
  useEffect(() => {
    // Only sync when the hook has produced a value
    if (typeof hookIsMember !== 'undefined' && hookIsMember !== null) {
      setIsMember(!!hookIsMember);
    }
    if (typeof hookIsBlocked !== 'undefined') {
      setIsBlocked(!!hookIsBlocked);
    }
    if (typeof hookIsPending !== 'undefined') {
      setIsPendingApproval(!!hookIsPending);
    }
    // Maintain existing joinRequestSent semantics
    if ((hookIsMember === true) || (hookStatus === 'pending') || (hookIsPending === true)) {
      setJoinRequestSent(true);
    }
  }, [hookIsMember, hookIsBlocked, hookIsPending, hookStatus]);


  // Fetch timeline details when component mounts or timelineId changes (membership handled by useJoinStatus)
  useEffect(() => {
    const fetchTimelineDetails = async () => {
      if (!timelineId || timelineId === 'new') return;
      
      try {
        setIsLoading(true);
        console.log(`Attempting to fetch timeline details for ID: ${timelineId}`);
        console.log(`API base URL from config: ${config.API_URL}`);
        
        // Use the getTimelineDetails utility function instead of direct API call
        console.log(`Making API request for timeline: ${timelineId}`);
        
        // Import the getTimelineDetails function from api.js
        const { getTimelineDetails } = await import('../../utils/api');
        const timelineData = await getTimelineDetails(timelineId);
        
        console.log('Timeline API response:', timelineData);
        
        if (timelineData && timelineData.name) {
          console.log(`Successfully fetched timeline: ${timelineData.name}`);
          setTimelineName(timelineData.name);
          setTimelineType(timelineData.timeline_type || 'hashtag');
          setVisibility(timelineData.visibility || 'public');
          setRequiresApproval(timelineData.requires_approval || false);
        } else {
          console.error('Timeline data is missing or incomplete:', response.data);
        }
      } catch (error) {
        console.error('Error fetching timeline details:', error);
        console.error('Error response:', error.response);
        console.error('Error request:', error.request);
        console.error('Error config:', error.config);
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

  // Action: Manual sync passport when blocked banner is shown
  const handleSyncPassport = async () => {
    try {
      const { syncUserPassport } = await import('../../utils/api');
      await syncUserPassport();
      // Let the hook refresh and update state
      await refreshMembership();
    } catch (e) {
      console.error('Failed to sync passport:', e);
    }
  };

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
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    return now.getDate() / daysInMonth; // Returns a value between 0 and 1
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
  
  // ============================================================================
  // POINT B STATE - Dual Reference System (Decoupled Arrow + Reference)
  // ============================================================================
  
  /**
   * Point B represents a user-selected focus point on the timeline.
   * When active, the timeline UI follows Point B instead of Point A (current time).
   * This solves the "moving ruler" problem where current time updates shift everything.
   * 
   * ARCHITECTURE:
   * - Arrow: Visual indicator at exact click position (fractional)
   * - Reference: Calculation anchor at integer coordinate (stable)
   * - Margin: Viewport + buffer zone where arrow can move without updating reference
   */
  const [pointB_active, setPointB_active] = useState(false);
  
  // Arrow position (visual, fractional) - shows exact click location
  const [pointB_arrow_markerValue, setPointB_arrow_markerValue] = useState(0);
  
  // Reference position (calculation, integer) - what EventMarkers calculate from
  const [pointB_reference_markerValue, setPointB_reference_markerValue] = useState(0);
  const [pointB_reference_timestamp, setPointB_reference_timestamp] = useState(null);
  
  const [pointB_viewMode, setPointB_viewMode] = useState('day');
  const [pointB_eventId, setPointB_eventId] = useState(null); // Optional: track which event Point B is focused on
  
  // Margin configuration: Viewport + buffer
  // User's viewport shows ~18 markers (-9 to +9), +10 buffer on each side = 38 total
  const calculatePointBMargin = () => {
    const viewportWidth = window.innerWidth;
    const markerSpacing = 100;
    const visibleMarkers = Math.ceil(viewportWidth / markerSpacing);
    const bufferMarkers = 10; // +10 on each side
    return Math.ceil(visibleMarkers / 2) + bufferMarkers; // Half viewport + buffer
  };

  // Point A state (current time tracking)
  const [pointA_currentTime, setPointA_currentTime] = useState(new Date());
  const [pointA_markerValue, setPointA_markerValue] = useState(0); // Always 0 in current implementation
  
  // Pre-load buffer for smooth scrolling (especially important for touch gestures)
  const PRELOAD_MARGIN_MULTIPLIER = 2.5; // Pre-load 2.5x viewport width on each side
  
  // ============================================================================
  
  // Track debounce timers with refs for wheel event handling
  const wheelTimer = useRef(null);
  const wheelDebounceTimer = useRef(null);
  const wheelEvents = useRef([]);
  
  // Handle wheel events with debouncing for better performance
  const handleWheelEvent = (event) => {
    event.preventDefault();
    
    // Performance optimization: Collect wheel events and process them in batches
    // This significantly reduces the number of state updates and re-renders
    const now = Date.now();
    wheelEvents.current.push({
      delta: event.deltaY || event.deltaX,
      timestamp: now
    });
    
    // If we're already in moving state, just collect the event
    if (isMoving) {
      return;
    }
    
    // Set moving state to hide markers during scrolling
    setIsMoving(true);
    
    // If an event is selected, close its popup during scrolling
    if (selectedEventId) {
      setSelectedEventId(null);
    }
    
    // Performance optimization: Debounce the actual timeline movement
    // Only process wheel events after a short delay of no wheel activity
    clearTimeout(wheelDebounceTimer.current);
    wheelDebounceTimer.current = setTimeout(() => {
      // Calculate the total scroll amount from all collected events
      const totalDelta = wheelEvents.current.reduce((sum, evt) => sum + evt.delta, 0);
      const scrollAmount = Math.sign(totalDelta) * Math.min(Math.abs(totalDelta) / 2, 300); // Limit max scroll amount
      
      // Update timeline offset
      setTimelineOffset(prevOffset => prevOffset - scrollAmount);
      
      // Add new markers if needed
      if (scrollAmount > 0) {
        // Scrolling right (negative delta) - add markers to the right
        const maxMarker = Math.max(...markers);
        setMarkers(prevMarkers => [...prevMarkers, maxMarker + 1]);
      } else {
        // Scrolling left (positive delta) - add markers to the left
        const minMarker = Math.min(...markers);
        setMarkers(prevMarkers => [...prevMarkers, minMarker - 1]);
      }
      
      // Clear the collected events
      wheelEvents.current = [];
      
      // Wait for timeline to settle before showing markers again
      clearTimeout(wheelTimer.current);
      wheelTimer.current = setTimeout(() => {
        setIsMoving(false);
      }, 200); // Delay after scrolling stops
    }, 50); // Short debounce delay for responsive feel while still batching updates
  };
  const [hoverPosition, setHoverPosition] = useState(getExactTimePosition());
  const [currentEventIndex, setCurrentEventIndex] = useState(0);
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [shouldScrollToEvent, setShouldScrollToEvent] = useState(true);
  const [isNavigating, setIsNavigating] = useState(false);
  const [isMoving, setIsMoving] = useState(false); // New state to track timeline movement
  
  // Refs for event cards to access their methods
  const eventRefs = useRef({});

  // Add new state for events and event form
  const [events, setEvents] = useState([]);
  const [isEventFormOpen, setIsEventFormOpen] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [mediaDialogOpen, setMediaDialogOpen] = useState(false);
  const [remarkDialogOpen, setRemarkDialogOpen] = useState(false);
  const [newsDialogOpen, setNewsDialogOpen] = useState(false);
  const [addEventAnchorEl, setAddEventAnchorEl] = useState(null);
  const [quickAddMenuAnchorEl, setQuickAddMenuAnchorEl] = useState(null);
  const [floatingButtonsExpanded, setFloatingButtonsExpanded] = useState(false);
  
  const handleAddEventClick = (event) => {
    setAddEventAnchorEl(event.currentTarget);
  };
  
  const handleAddEventMenuClose = () => {
    setAddEventAnchorEl(null);
  };

  // Get sort order from localStorage
  const [sortOrder, setSortOrder] = useState(() => {
    return localStorage.getItem('timeline_sort_preference') || 'newest';
  });

  // Get selected filter type from localStorage
  const [selectedType, setSelectedType] = useState(() => {
    return localStorage.getItem('timeline_filter_type') || null;
  });

  // Update sortOrder when localStorage changes or when custom event is triggered
  useEffect(() => {
    const handleStorageChange = () => {
      setSortOrder(localStorage.getItem('timeline_sort_preference') || 'newest');
    };
    
    const handleSortChange = (event) => {
      console.log('Sort change event received:', event.detail);
      setSortOrder(event.detail.sortOrder);
    };
    
    // Listen for both the storage event and our custom sort change event
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('timeline_sort_change', handleSortChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('timeline_sort_change', handleSortChange);
    };
  }, []);

  // Update selectedType when filter changes
  useEffect(() => {
    const handleFilterChange = (event) => {
      // Use the detail from the custom event if available
      if (event.detail && event.detail.selectedType !== undefined) {
        console.log('Filter change event received with detail:', event.detail);
        // Ensure we're setting the exact value from the event
        const newType = event.detail.selectedType;
        
        // Update state only if it's different to avoid unnecessary re-renders
        if (newType !== selectedType) {
          setSelectedType(newType);
          console.log(`TimelineV3: Updated selectedType to ${newType}`);
        }
      } else {
        // Fallback to localStorage if the event doesn't have detail
        console.log('Filter change event received, using localStorage');
        const storedType = localStorage.getItem('timeline_filter_type') || null;
        
        // Update state only if it's different
        if (storedType !== selectedType) {
          setSelectedType(storedType);
          console.log(`TimelineV3: Updated selectedType from localStorage to ${storedType}`);
        }
      }
    };
    
    // Initial load from localStorage
    const initialType = localStorage.getItem('timeline_filter_type') || null;
    if (initialType !== selectedType) {
      setSelectedType(initialType);
      console.log(`TimelineV3: Initial selectedType set to ${initialType}`);
    }
    
    window.addEventListener('timeline_filter_change', handleFilterChange);
    return () => window.removeEventListener('timeline_filter_change', handleFilterChange);
  }, [selectedType]); // Add selectedType as a dependency to properly handle updates

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
    
    // IMPORTANT: Disable auto-scroll BEFORE updating selectedEventId
    setShouldScrollToEvent(false);
    
    // Select the event to highlight it in the list
    setSelectedEventId(event.id);
    setCurrentEventIndex(eventIndex);
    
    // Find the card reference for this event
    let cardRef;
    if (event.type?.toLowerCase() === 'news') {
      cardRef = eventRefs.current[`news-card-${event.id}`];
    } else if (event.type?.toLowerCase() === 'media') {
      cardRef = eventRefs.current[`media-card-${event.id}`];
    } else {
      cardRef = eventRefs.current[`remark-card-${event.id}`];
    }
    
    // If we have a reference to the card, directly call its setPopupOpen method
    if (cardRef && cardRef.setPopupOpen) {
      console.log('Directly opening popup for event:', event.id);
      cardRef.setPopupOpen(true);
    } else {
      // QUARANTINED: No fallback to event edit as it's problematic
      console.warn('WARNING: Could not find card reference for event:', event.id);
      console.warn('The event popup cannot be shown. This is a known issue.');
      // No fallback action - better to do nothing than crash the application
    }
  };

  const handleMarkerClick = (event, index, clickEvent, exactMarkerValue) => {
    console.log('[TimelineV3] Marker clicked for event:', event.id, 'exactMarkerValue:', exactMarkerValue, 'type:', typeof exactMarkerValue);
    
    // Always activate Point B at this event's position when clicking event marker
    // Use the exact marker value from EventMarker's calculation (includes fractional positions)
    // Note: exactMarkerValue can be 0 (valid), so check for undefined/null specifically
    if (event.event_date && viewMode !== 'position' && exactMarkerValue != null) {
      const eventDate = new Date(event.event_date);
      
      // Activate Point B at this event's EXACT position (not rounded)
      console.log('[Point B] Event marker clicked - Activating Point B at exact position:', exactMarkerValue);
      activatePointB(exactMarkerValue, eventDate, viewMode, event.id, false); // shouldCenter = false
    } else {
      console.log('[Point B] Skipped activation - exactMarkerValue:', exactMarkerValue, 'event_date:', event.event_date, 'viewMode:', viewMode);
    }
    
    // IMPORTANT: Disable auto-scroll BEFORE updating selectedEventId
    setShouldScrollToEvent(false);
    
    // Set the selected event ID to highlight it in the list (shows hover card)
    setSelectedEventId(event.id);
    
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
      console.log('Event not found in filtered events, using original index');
      setCurrentEventIndex(index);
    }
  };

  // Progressive loading states
  const [progressiveLoadingState, setProgressiveLoadingState] = useState('timeline');
  const [userInteracted, setUserInteracted] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0); // Track loading progress for visual feedback
  const [showLoadingBar, setShowLoadingBar] = useState(false); // Control loading bar visibility with delay
  
  // Add a delay before showing the loading bar to prevent flashing
  useEffect(() => {
    let showBarTimeout;
    let hideBarTimeout;
    
    if (progressiveLoadingState !== 'complete') {
      // Only show loading bar after a delay to prevent flashing for quick loads
      showBarTimeout = setTimeout(() => {
        setShowLoadingBar(true);
      }, 300); // 300ms delay before showing loading bar
    } else {
      // When loading is complete, hide the bar after a short delay
      hideBarTimeout = setTimeout(() => {
        setShowLoadingBar(false);
      }, 100);
    }
    
    return () => {
      clearTimeout(showBarTimeout);
      clearTimeout(hideBarTimeout);
    };
  }, [progressiveLoadingState]);
  
  // Scoped blur flag: only for community timelines, while membership is loading or when blocked
  const shouldBlur = (timeline_type === 'community') && (isMember === null || isBlocked === true);
  
  // View transition states
  const [isViewTransitioning, setIsViewTransitioning] = useState(false);
  const [pendingViewMode, setPendingViewMode] = useState(null);
  const [viewTransitionPhase, setViewTransitionPhase] = useState('idle'); // 'idle', 'fadeOut', 'structureTransition', 'dataProcessing', 'fadeIn'
  
  // Function to navigate to the next event in the carousel and update the selected marker
  const navigateToNextEvent = () => {
    if (!events.length) return;
    
    // Get the filtered events based on current view mode
    const filteredEvents = events.filter(e => {
      // Apply the same filtering logic as in EventList
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
    
    if (!filteredEvents.length) return;
    
    // Find the current index in the filtered events
    const currentFilteredIndex = filteredEvents.findIndex(e => e.id === selectedEventId);
    
    // Calculate the next index (with wraparound)
    const nextFilteredIndex = currentFilteredIndex === -1 || currentFilteredIndex === filteredEvents.length - 1 
      ? 0 
      : currentFilteredIndex + 1;
    
    // Get the next event
    const nextEvent = filteredEvents[nextFilteredIndex];
    
    // IMPORTANT: Disable auto-scroll BEFORE updating selectedEventId
    // to prevent EventList from scrolling when the ID changes
    setShouldScrollToEvent(false);
    
    // Update the selected event ID and current event index
    setSelectedEventId(nextEvent.id);
    
    // Find the index in the full events array
    const fullEventsIndex = events.findIndex(e => e.id === nextEvent.id);
    if (fullEventsIndex !== -1) {
      setCurrentEventIndex(fullEventsIndex);
    }
  };
  
  // Function to navigate to the previous event in the carousel and update the selected marker
  const navigateToPrevEvent = () => {
    if (!events.length) return;
    
    // Get the filtered events based on current view mode
    const filteredEvents = events.filter(e => {
      // Apply the same filtering logic as in EventList
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
    
    if (!filteredEvents.length) return;
    
    // Find the current index in the filtered events
    const currentFilteredIndex = filteredEvents.findIndex(e => e.id === selectedEventId);
    
    // Calculate the previous index (with wraparound)
    const prevFilteredIndex = currentFilteredIndex === -1 || currentFilteredIndex === 0 
      ? filteredEvents.length - 1 
      : currentFilteredIndex - 1;
    
    // Get the previous event
    const prevEvent = filteredEvents[prevFilteredIndex];
    
    // IMPORTANT: Disable auto-scroll BEFORE updating selectedEventId
    // to prevent EventList from scrolling when the ID changes
    setShouldScrollToEvent(false);
    
    // Update the selected event ID and current event index
    setSelectedEventId(prevEvent.id);
    
    // Find the index in the full events array
    const fullEventsIndex = events.findIndex(e => e.id === prevEvent.id);
    if (fullEventsIndex !== -1) {
      setCurrentEventIndex(fullEventsIndex);
    }
  };
  
  // Handle view mode transitions with a multi-phase approach
  const handleViewModeTransition = (newViewMode) => {
    // Don't do anything if we're already transitioning or if it's the same mode
    if (isViewTransitioning || newViewMode === viewMode) return;
    
    // Store the currently selected event ID and index to restore after transition
    const currentlySelectedEventId = selectedEventId;
    const currentlySelectedEventIndex = currentEventIndex;
    
    // Mark that user has interacted to bypass progressive loading delays
    setUserInteracted(true);
    
    // Start the transition process
    setIsViewTransitioning(true);
    setPendingViewMode(newViewMode);
    setViewTransitionPhase('fadeOut');
    
    // Phase 1: Immediate visual feedback - fade out events and markers (200ms)
    setIsFullyFaded(true); // This will fade out the current events and markers
    
    // Phase 2: Timeline structure transition (300ms after fadeOut starts)
    setTimeout(() => {
      // Actually change the view mode to update the timeline structure
      setViewMode(newViewMode);
      setViewTransitionPhase('structureTransition');
      
      // Phase 3: Data processing (200ms after structure transition)
      setTimeout(() => {
        setViewTransitionPhase('dataProcessing');
        
        // Phase 4: Progressive content rendering (300ms after data processing)
        setTimeout(() => {
          setViewTransitionPhase('fadeIn');
          setIsFullyFaded(false); // Start fading in the content
          
          // Restore the selected event if it exists in the new view
          if (currentlySelectedEventId) {
            // Check if the event is visible in the new view mode
            const isEventVisibleInNewView = events.some(event => {
              if (event.id !== currentlySelectedEventId) return false;
              
              // For position view, all events are visible
              if (newViewMode === 'position') return true;
              
              // For other views, check if the event is within the visible range
              if (!event.event_date) return false;
              
              const currentDate = new Date();
              let startDate, endDate;
              
              switch (newViewMode) {
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
            });
            
            // If the event is visible in the new view, keep it selected
            if (isEventVisibleInNewView) {
              setSelectedEventId(currentlySelectedEventId);
              setCurrentEventIndex(currentlySelectedEventIndex);
            } else {
              // If not visible, clear the selection
              setSelectedEventId(null);
              setCurrentEventIndex(-1);
            }
          }
          
          // Complete the transition after the fade-in animation
          setTimeout(() => {
            setIsViewTransitioning(false);
            setViewTransitionPhase('idle');
            setPendingViewMode(null);
          }, 300); // Fade-in duration
          
        }, 300); // Data processing duration
        
      }, 200); // Structure transition duration
      
    }, 200); // Fade-out duration
  };
  
  // Fetch events when timeline ID changes with progressive loading
  useEffect(() => {
    const fetchEvents = async () => {
      if (!timelineId || timelineId === 'new') return;
      
      try {
        setIsLoadingEvents(true);
        console.log('Fetching events for timeline:', timelineId);
        
        // First set the loading state to timeline structure only
        setProgressiveLoadingState('timeline');
        setLoadingProgress(0);
        
        // Simulate timeline structure loading completion with a progress indicator
        const structureLoadingInterval = setInterval(() => {
          setLoadingProgress(prev => {
            const newProgress = prev + 5;
            if (newProgress >= 30) {
              clearInterval(structureLoadingInterval);
            }
            return Math.min(newProgress, 30); // Cap at 30% for structure loading
          });
        }, 100);
        
        // Set a longer timer to load events if the user hasn't interacted with filter views
        const loadEventsTimer = setTimeout(async () => {
          if (!userInteracted) {
            console.log('Loading events after delay');
            clearInterval(structureLoadingInterval);
            setLoadingProgress(40); // Jump to 40% when starting event loading
            
            // Simulate event loading progress
            const eventLoadingInterval = setInterval(() => {
              setLoadingProgress(prev => {
                const newProgress = prev + 3;
                if (newProgress >= 70) {
                  clearInterval(eventLoadingInterval);
                }
                return Math.min(newProgress, 70); // Cap at 70% for events loading
              });
            }, 150);
            
            // Actually fetch the events - use api utility which handles prefixes correctly
            const response = await api.get(`/api/timeline-v3/${timelineId}/events`);
            console.log('Events response:', response.data);
            setEvents(response.data);
            
            // Update the loading state to events loaded
            setProgressiveLoadingState('events');
            clearInterval(eventLoadingInterval);
            setLoadingProgress(75); // Jump to 75% when events are loaded
            
            // Set another timer to load markers if the user still hasn't interacted
            const loadMarkersTimer = setTimeout(() => {
              if (!userInteracted) {
                console.log('Loading markers after delay');
                
                // Simulate marker loading progress
                const markerLoadingInterval = setInterval(() => {
                  setLoadingProgress(prev => {
                    const newProgress = prev + 5;
                    if (newProgress >= 100) {
                      clearInterval(markerLoadingInterval);
                    }
                    return Math.min(newProgress, 100);
                  });
                }, 100);
                
                // Complete the loading after a delay
                setTimeout(() => {
                  clearInterval(markerLoadingInterval);
                  setLoadingProgress(100);
                  setProgressiveLoadingState('complete');
                }, 1000); // Longer delay for markers to be visually distinct
              }
            }, 1500); // Longer delay between events and markers
            
            return () => {
              clearTimeout(loadMarkersTimer);
              clearInterval(eventLoadingInterval);
            };
          }
        }, 2000); // 2 second delay before loading events
        
        return () => {
          clearTimeout(loadEventsTimer);
          clearInterval(structureLoadingInterval);
        };
      } catch (error) {
        console.error('Error fetching events:', error);
        setProgressiveLoadingState('error');
      } finally {
        setIsLoadingEvents(false);
      }
    };

    fetchEvents();
  }, [timelineId, userInteracted]);

  // Fetch reviewing reports to show "In Review" icon on event popups
  useEffect(() => {
    const fetchReviewingReports = async () => {
      if (!timelineId || timelineId === 'new' || !isAuthenticated) return;
      
      try {
        console.log('[TimelineV3] Fetching reviewing reports for timeline:', timelineId);
        const response = await listReports(timelineId, { status: 'reviewing' });
        
        console.log('[TimelineV3] Full response from listReports:', response);
        
        // Extract event IDs from the reports
        const eventIds = new Set(
          (response.items || []).map(report => {
            console.log('[TimelineV3] Processing report:', report);
            return report.event_id;
          }).filter(Boolean)
        );
        
        console.log('[TimelineV3] Reviewing event IDs (Set):', Array.from(eventIds));
        console.log('[TimelineV3] Total reviewing reports:', response.items?.length || 0);
        setReviewingEventIds(eventIds);
      } catch (error) {
        // Silently fail - user might not have permission to view reports (non-moderator)
        console.error('[TimelineV3] Could not fetch reviewing reports:', error);
        console.log('[TimelineV3] Error details:', error.response?.data || error.message);
        setReviewingEventIds(new Set());
      }
    };

    fetchReviewingReports();
    
    // Also set up an interval to refresh every 10 seconds
    const interval = setInterval(fetchReviewingReports, 10000);
    
    return () => clearInterval(interval);
  }, [timelineId, isAuthenticated]);

  // Create timeline when component mounts
  useEffect(() => {
    const createTimeline = async () => {
      try {
        // Get timeline name from URL parameters
        const params = new URLSearchParams(window.location.search);
        const timelineName = params.get('name') || 'Timeline V3';
        
        // Use api utility which handles prefixes correctly
        const response = await api.post('/api/timeline-v3', {
          name: timelineName,
          description: `A new timeline created: ${timelineName}`,
          timeline_type: 'hashtag' // Default to hashtag type
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
      // Use api utility which handles prefixes correctly
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
      
      // Force a component re-render using the same technique as the hamburger menu
      // This ensures all markers are properly displayed without a full page reload
      const currentPath = window.location.pathname;
      navigate('/refresh-redirect', { replace: true });
      
      // Then navigate back to the timeline
      // This will trigger a complete re-render and show the new event marker
      setTimeout(() => {
        navigate(currentPath, { replace: true });
      }, 10);
    } catch (error) {
      console.error('Error creating event:', error);
      console.error('Error response:', error.response);
      console.error('Error request:', error.request);
      setSubmitError(error.response?.data?.error || 'Failed to create event');
      throw error;
    }
  };

  const handleEventEdit = (event) => {
    // Check if this is a selection action from the menu click
    if (event && event.type === 'select' && event.event) {
      // This is a selection action, so just select the event
      setSelectedEventId(event.event.id);
      return;
    }
    
    // Check if this is an openPopup action
    if (event && event.type === 'openPopup' && event.event) {
      // This is an openPopup action, don't open the edit dialog
      // The card component will handle opening its own popup
      return;
    }
    
    // Normal edit behavior
    setEditingEvent(event);
    setDialogOpen(true);
  };
  
  // Add the missing handleEventDelete function
  const handleEventDelete = async (eventId) => {
    try {
      console.log(`Deleting event with ID: ${eventId}`);
      
      // Use api utility which handles prefixes correctly
      await api.delete(`/api/timeline-v3/${timelineId}/events/${eventId}`);
      
      // Remove the deleted event from state
      const updatedEvents = events.filter(event => event.id !== eventId);
      setEvents(updatedEvents);
      
      // Clear selection if the deleted event was selected
      if (selectedEventId === eventId) {
        setSelectedEventId(null);
        setCurrentEventIndex(null);
      }
      
      // Show success message
      setSnackbarMessage('Event deleted successfully');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      
    } catch (error) {
      console.error('Error deleting event:', error);
      
      // Show error message
      setSnackbarMessage('Failed to delete event');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };
  
  // Function to force refresh membership status
  const refreshMembershipStatus = async () => {
    try {
      // Clear localStorage cache for this timeline
      try {
        localStorage.removeItem(`timeline_member_${timelineId}`);
        console.log(`DEBUG: Cleared cached membership data for timeline ${timelineId}`);
      } catch (e) {
        console.warn('Failed to clear localStorage cache:', e);
      }
      
      // Force refresh user memberships from server
      console.log('DEBUG: Fetching fresh user memberships data');
      await fetchUserMemberships();
      
      // Check membership from refreshed user data
      console.log(`DEBUG: Checking membership status from refreshed user data for timeline ${timelineId}`);
      const membershipStatus = await checkMembershipFromUserData(timelineId);
      console.log('DEBUG: Membership status from user data:', membershipStatus);
      
      // Also do a direct API check as a backup
      console.log(`DEBUG: Also checking membership status directly from API`);
      const apiMembershipStatus = await checkMembershipStatus(timelineId, 0, true);
      console.log('DEBUG: Membership status from direct API call:', apiMembershipStatus);
      
      // Use the API response if it's valid and differs from user data
      if (apiMembershipStatus && typeof apiMembershipStatus.is_member !== 'undefined' && 
          apiMembershipStatus.is_member !== membershipStatus.is_member) {
        console.log('DEBUG: API membership status differs from user data, using API response');
        Object.assign(membershipStatus, apiMembershipStatus);
      }
      
      // Update state based on membership status
      if (membershipStatus && typeof membershipStatus.is_member !== 'undefined') {
        console.log(`DEBUG: Updating isMember to ${membershipStatus.is_member}`);
        console.log(`DEBUG: Member role: ${membershipStatus.role}`);
        
        // Check if user has a pending request
        const hasPendingRequest = membershipStatus.role === 'pending';
        setIsPendingApproval(hasPendingRequest);
        
        // Set isMember based on active membership (not pending)
        setIsMember(membershipStatus.is_member && !hasPendingRequest);
        
        if (membershipStatus.is_member || hasPendingRequest) {
          setJoinRequestSent(true);
        } else {
          setJoinRequestSent(false);
        }
        
        // Show success message
        const statusMsg = hasPendingRequest 
          ? 'Request pending approval' 
          : membershipStatus.is_member 
            ? 'You are a member' 
            : 'You are not a member';
        setSnackbarMessage(`Membership status refreshed: ${statusMsg}`);
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
        
        return membershipStatus;
      }
    } catch (error) {
      console.error('Error refreshing membership status:', error);
      setSnackbarMessage('Error refreshing membership status');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
    return null;
  };
  
  // Debug function to check timeline members
  const debugTimelineMembers = async () => {
    try {
      // First refresh membership status
      const refreshedStatus = await refreshMembershipStatus();
      
      // Then get all members for debugging
      const { debugTimelineMembers } = await import('../../utils/api');
      console.log(`Debugging members for timeline ${timelineId}`);
      const members = await debugTimelineMembers(timelineId);
      
      // Log the results
      console.log(`Found ${members.length} members for timeline ${timelineId}:`, members);
      
      // Show results in a snackbar
      setSnackbarMessage(`Found ${members.length} members. Membership refreshed: ${refreshedStatus?.is_member ? 'You are a member' : 'You are not a member'}. Check console for details.`);
      setSnackbarSeverity('info');
      setSnackbarOpen(true);
      
      // Check if current user is a member
      const currentUserMember = members.find(m => m.user_id === user?.id);
      if (currentUserMember) {
        console.log(`Current user IS a member with role: ${currentUserMember.role}`);
        console.log(`But isMember state is: ${isMember}`);
      } else {
        console.log('Current user is NOT a member in the database');
        console.log(`But isMember state is: ${isMember}`);
      }
      
      // Check localStorage
      try {
        const membershipKey = `timeline_membership_${timelineId}`;
        const storedData = localStorage.getItem(membershipKey);
        if (storedData) {
          const localData = JSON.parse(storedData);
          console.log(`Found cached membership data in localStorage:`, localData);
        } else {
          console.log('No membership data found in localStorage');
        }
      } catch (e) {
        console.error('Error reading from localStorage:', e);
      }
    } catch (error) {
      console.error('Error debugging timeline members:', error);
      setSnackbarMessage('Error debugging members');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };
  
  // Handle join community button click
  const handleJoinCommunity = async () => {
    if (!user) {
      // If user is not logged in, show a snackbar instead of trying to open a login dialog
      setJoinRequestStatus('error');
      setJoinSnackbarOpen(true);
      return;
    }
    
    // Check if the user was previously a member but was removed (inactive)
    // This helps us determine if this is a rejoin scenario
    let isRejoin = false;
    try {
      const membershipKey = `timeline_membership_${timelineId}`;
      const existingData = localStorage.getItem(membershipKey);
      if (existingData) {
        const parsedData = JSON.parse(existingData);
        if (parsedData.is_active_member === false) {
          console.log(`DEBUG: User was previously removed from timeline ${timelineId}, this is a rejoin scenario`);
          isRejoin = true;
        }
      }
    } catch (checkError) {
      console.warn('Error checking previous membership status:', checkError);
    }
    
    // Show loading state while request is being processed
    console.log(`DEBUG: Sending join request${isRejoin ? ' (rejoin scenario)' : ''}`);
    setJoinRequestSent(true);
    
    try {
      // Call API to request access to the timeline using our updated function
      const response = await requestTimelineAccess(timelineId);
      console.log('Join request response:', response);
      
      // Check if we got an error response (our API utility now returns objects with error:true instead of throwing)
      if (response.error) {
        console.warn('Join request returned an error response:', response);
        setJoinRequestStatus('error');
        setJoinSnackbarOpen(true);
        
        // Revert UI state on error
        setIsMember(false);
        setJoinRequestSent(false);
        setIsPendingApproval(false);
        return;
      }
      
      // Update UI state for success
      setJoinRequestStatus('success');
      setJoinSnackbarOpen(true);
      
      // Get the role from the response or default to 'member'
      const memberRole = response.role || 'member';
      const isPending = memberRole === 'pending';
      console.log(`DEBUG: Join response role: ${memberRole}, visibility: ${visibility}, isPending: ${isPending}`);
      
      // Update pending state
      if (isPending) {
        setIsPendingApproval(true);
        setIsMember(false); // Not a full member yet
        console.log('DEBUG: User has pending membership request');
      } else {
        setIsPendingApproval(false);
        setIsMember(true); // Full member
        console.log('DEBUG: User is now an active member');
      }
      
      // IMPORTANT: Store in the direct timeline membership key format
      // This ensures the checkMembershipFromUserData function finds it immediately
      try {
        const directMembershipKey = `timeline_membership_${timelineId}`;
        const membershipData = {
          is_member: !isPending, // Only true if not pending
          is_active_member: !isPending, // Pending members are not active
          role: memberRole,
          joined_at: new Date().toISOString(),
          timeline_visibility: visibility,
          timestamp: new Date().toISOString()
        };
        
        localStorage.setItem(directMembershipKey, JSON.stringify(membershipData));
        console.log(`Stored direct membership data for timeline ${timelineId} after join${isRejoin ? ' (rejoin)' : ''}, pending: ${isPending}`);
      } catch (e) {
        console.warn('Error storing direct membership data after join:', e);
      }
      
      // Note: Passport sync endpoint not implemented yet
      // The membership data is already stored in localStorage above
      console.log('DEBUG: Membership data stored successfully');
      
      // Force refresh membership status from server after a short delay
      // This ensures backend and frontend are in sync
      setTimeout(() => {
        checkMembershipStatus(timelineId, 0, true)
          .then(status => {
            console.log('Refreshed membership status after join:', status);
          })
          .catch(err => {
            console.error('Failed to refresh membership status:', err);
          });
      }, 1000);
      
      // Force log the current state for debugging
      console.log('DEBUG: Current state after join:', {
        isMember: true, // We've forced this to true
        joinRequestSent: true,
        isRejoin,
        timelineId,
        timelineType: timeline_type,
        visibility
      });

    } catch (error) {
      // This catch block should rarely be hit now that our API utility handles errors
      console.error('Unexpected error joining community:', error);
      setJoinRequestStatus('error');
      setJoinSnackbarOpen(true);
    }
  };
  
  // ============================================================================
  // POINT B ACTIVATION & DEACTIVATION FUNCTIONS
  // ============================================================================
  
  /**
   * Activate Point B at a specific marker position
   * This "locks" the user's focus to a specific point on the timeline
   * 
   * DECOUPLED ARCHITECTURE:
   * - Arrow always moves to exact click position (fractional)
   * - Reference only updates if arrow moves outside margin zone
   * - This prevents constant re-renders when scrolling within viewport
   * 
   * @param {number} markerValue - The exact marker position clicked (fractional, e.g., -4.41)
   * @param {Date} timestamp - The actual date/time this marker represents
   * @param {string} currentViewMode - The current view mode when Point B was set
   * @param {string} eventId - Optional: ID of event that Point B is focused on
   * @param {boolean} shouldCenter - Whether to center Point B on screen
   */
  const activatePointB = (markerValue, timestamp, currentViewMode, eventId = null, shouldCenter = false) => {
    console.log('[Point B] Activating at marker:', markerValue, 'timestamp:', timestamp, 'viewMode:', currentViewMode);
    
    setPointB_active(true);
    setPointB_viewMode(currentViewMode);
    setPointB_eventId(eventId);
    
    // ALWAYS update arrow to exact click position (fractional)
    setPointB_arrow_markerValue(markerValue);
    
    // Calculate margin zone (viewport + buffer)
    const margin = calculatePointBMargin();
    
    // Check if we need to update reference (integer anchor for calculations)
    const isFirstActivation = !pointB_active;
    const isOutsideMargin = Math.abs(markerValue - pointB_reference_markerValue) > margin;
    
    if (isFirstActivation || isOutsideMargin) {
      // Update reference to nearest integer
      const newReference = Math.round(markerValue);
      setPointB_reference_markerValue(newReference);
      
      // Calculate timestamp at integer marker position
      const currentDate = new Date();
      let referenceTimestamp = new Date(currentDate);
      
      switch (currentViewMode) {
        case 'day':
          referenceTimestamp.setHours(currentDate.getHours() + newReference);
          break;
        case 'week':
          referenceTimestamp.setDate(currentDate.getDate() + newReference);
          break;
        case 'month':
          referenceTimestamp.setMonth(currentDate.getMonth() + newReference);
          break;
        case 'year':
          referenceTimestamp.setFullYear(currentDate.getFullYear() + newReference);
          break;
      }
      
      setPointB_reference_timestamp(referenceTimestamp);
      
      console.log('[Point B] Reference updated to integer:', newReference, 'margin:', margin);
      console.log('[Point B] Reference timestamp:', referenceTimestamp);
    } else {
      console.log('[Point B] Arrow moved within margin zone, reference unchanged');
      console.log('[Point B] Arrow:', markerValue, 'Reference:', pointB_reference_markerValue, 'Margin:', margin);
    }
    
    // Pre-load markers in both directions for smooth scrolling
    // Use reference value (integer) for pre-loading, not arrow value (fractional)
    const referenceForPreload = isFirstActivation || isOutsideMargin 
      ? Math.round(markerValue)
      : pointB_reference_markerValue;
    
    const viewportWidth = window.innerWidth;
    const preloadDistance = viewportWidth * PRELOAD_MARGIN_MULTIPLIER;
    const markersToPreload = Math.ceil(preloadDistance / 100); // 100 = markerSpacing
    
    const currentMinMarker = Math.min(...markers);
    const currentMaxMarker = Math.max(...markers);
    
    // Calculate how many markers we need to add (using integer reference)
    const targetMinMarker = Math.floor(referenceForPreload - markersToPreload);
    const targetMaxMarker = Math.ceil(referenceForPreload + markersToPreload);
    
    const newMarkers = [];
    
    // Add markers to the left if needed
    if (targetMinMarker < currentMinMarker) {
      for (let i = targetMinMarker; i < currentMinMarker; i++) {
        newMarkers.push(i);
      }
    }
    
    // Add markers to the right if needed
    if (targetMaxMarker > currentMaxMarker) {
      for (let i = currentMaxMarker + 1; i <= targetMaxMarker; i++) {
        newMarkers.push(i);
      }
    }
    
    if (newMarkers.length > 0) {
      console.log('[Point B] Pre-loading', newMarkers.length, 'markers for smooth scrolling');
      setMarkers(prevMarkers => [...prevMarkers, ...newMarkers].sort((a, b) => a - b));
    }
    
    // NEVER center when clicking markers - Point B should stay where clicked
    // Only center when explicitly requested (e.g., 'B' key press)
    if (shouldCenter) {
      console.log('[Point B] Centering Point B on screen (B key pressed)');
      const currentPosition = window.innerWidth / 2 + (markerValue * 100) + timelineOffset;
      const screenCenter = window.innerWidth / 2;
      const offsetAdjustment = screenCenter - currentPosition;
      
      setTimelineOffset(prevOffset => prevOffset + offsetAdjustment);
    } else {
      console.log('[Point B] Point B activated at clicked position (timeline stays put)');
    }
    
    console.log('[Point B] Activated successfully. Pre-loaded buffer:', markersToPreload, 'markers on each side');
  };
  
  /**
   * Deactivate Point B and return to Point A (current time) reference
   */
  const deactivatePointB = () => {
    console.log('[Point B] Deactivating');
    
    setPointB_active(false);
    setPointB_arrow_markerValue(0);
    setPointB_reference_markerValue(0);
    setPointB_reference_timestamp(null);
    setPointB_viewMode(null);
    setPointB_eventId(null);
    
    // Note: We don't reset timelineOffset here to maintain visual continuity
    // The user can use "Back to Present" button to recenter to Point A if desired
  };
  
  /**
   * Convert Point B to a new view mode
   * This preserves the semantic meaning of Point B when switching views
   * For example: "5:00 PM Tuesday" in day view becomes "Tuesday" in week view
   */
  const convertPointBToViewMode = (newViewMode) => {
    if (!pointB_active || !pointB_timestamp) return null;
    
    const currentDate = new Date();
    const pointBDate = new Date(pointB_timestamp);
    
    console.log('[Point B] Converting from', pointB_viewMode, 'to', newViewMode);
    console.log('[Point B] Timestamp:', pointBDate.toLocaleString());
    
    let newMarkerValue = 0;
    
    switch (newViewMode) {
      case 'day': {
        // Calculate hours from current time
        const dayDiff = Math.floor((pointBDate - currentDate) / (1000 * 60 * 60 * 24));
        const hourDiff = Math.floor((pointBDate - currentDate) / (1000 * 60 * 60)) - (dayDiff * 24);
        newMarkerValue = (dayDiff * 24) + hourDiff;
        break;
      }
      case 'week': {
        // Calculate days from current date
        const dayDiff = Math.floor((pointBDate - currentDate) / (1000 * 60 * 60 * 24));
        newMarkerValue = dayDiff;
        break;
      }
      case 'month': {
        // Calculate months from current month
        const monthDiff = (pointBDate.getFullYear() - currentDate.getFullYear()) * 12 
                        + (pointBDate.getMonth() - currentDate.getMonth());
        newMarkerValue = monthDiff;
        break;
      }
      case 'year': {
        // Calculate years from current year
        const yearDiff = pointBDate.getFullYear() - currentDate.getFullYear();
        newMarkerValue = yearDiff;
        break;
      }
      default:
        newMarkerValue = 0;
    }
    
    console.log('[Point B] Converted marker value:', newMarkerValue);
    
    // Update Point B with new marker value and view mode
    setPointB_markerValue(newMarkerValue);
    setPointB_viewMode(newViewMode);
    
    return newMarkerValue;
  };
  
  // ============================================================================
  
  // Keyboard shortcut: Press 'B' to toggle Point B at current center position
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Only activate if 'B' key is pressed (not in an input field)
      if (e.key === 'b' || e.key === 'B') {
        // Check if we're in an input field
        const activeElement = document.activeElement;
        const isInputField = activeElement && (
          activeElement.tagName === 'INPUT' ||
          activeElement.tagName === 'TEXTAREA' ||
          activeElement.isContentEditable
        );
        
        if (isInputField) return; // Don't trigger if typing in an input
        
        if (pointB_active) {
          // Deactivate Point B if already active
          console.log('[Point B] Keyboard shortcut: Deactivating Point B');
          deactivatePointB();
        } else {
          // Activate Point B at current center position (marker 0 relative to current offset)
          console.log('[Point B] Keyboard shortcut: Activating Point B at center');
          
          // Calculate the marker value at screen center
          const centerMarkerValue = Math.round(-timelineOffset / 100);
          
          // Calculate the timestamp for this marker
          const currentDate = new Date();
          let timestamp = new Date(currentDate);
          
          switch (viewMode) {
            case 'day':
              timestamp.setHours(currentDate.getHours() + centerMarkerValue);
              break;
            case 'week':
              timestamp.setDate(currentDate.getDate() + centerMarkerValue);
              break;
            case 'month':
              timestamp.setMonth(currentDate.getMonth() + centerMarkerValue);
              break;
            case 'year':
              timestamp.setFullYear(currentDate.getFullYear() + centerMarkerValue);
              break;
          }
          
          activatePointB(centerMarkerValue, timestamp, viewMode, null, true); // shouldCenter = true for 'B' key
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [pointB_active, timelineOffset, viewMode]);
  
  // ============================================================================
  
  // Update hover position when view mode changes
  useEffect(() => {
    setHoverPosition(getExactTimePosition());
  }, [viewMode]);

  // Add state to track if any popup is currently open
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  // Update hover position every minute, but pause when popup is open
  useEffect(() => {
    if (viewMode === 'day') {
      const interval = setInterval(() => {
        // Only update if no popup is currently open
        if (!isPopupOpen) {
          setHoverPosition(getExactTimePosition());
        }
      }, 60000); // Update every minute
      return () => clearInterval(interval);
    }
  }, [viewMode, isPopupOpen]);

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
    // Mark that the user has interacted with filter views
    setUserInteracted(true);
    
    // If we're in a loading state, immediately load all content
    if (progressiveLoadingState !== 'complete') {
      const loadContent = async () => {
        // If events aren't loaded yet, load them
        if (progressiveLoadingState === 'timeline') {
          console.log('User interacted with filter views, loading events immediately');
          try {
            const response = await api.get(`/api/timeline-v3/${timelineId}/events`);
            
            // Performance optimization: Pre-process events to improve rendering performance
            const processedEvents = response.data.map(event => {
              // Pre-calculate dates to avoid repeated Date object creation
              const eventDate = event.event_date ? new Date(event.event_date) : null;
              
              return {
                ...event,
                // Cache date objects and other frequently accessed properties
                _cachedDate: eventDate,
                _cachedYear: eventDate ? eventDate.getFullYear() : null,
                _cachedMonth: eventDate ? eventDate.getMonth() : null,
                _cachedDay: eventDate ? eventDate.getDate() : null,
                _cachedTime: eventDate ? eventDate.getTime() : null,
                // Pre-calculate lowercase values for case-insensitive comparisons
                _cachedLowerTitle: (event.title || '').toLowerCase(),
                _cachedLowerDesc: (event.description || '').toLowerCase(),
                _cachedLowerType: (event.type || '').toLowerCase()
              };
            });
            
            // Update the events state with pre-processed events
            setEvents(processedEvents);
            
            // Performance optimization: Clear any cached positions when loading new events
            window.timelineEventPositions = [];
            window.timelineEventPositionsMap = null;
          } catch (error) {
            console.error('Error fetching events after user interaction:', error);
          }
        }
        
        // Set the loading state to complete
        setProgressiveLoadingState('complete');
      };
      
      loadContent();
    }
    
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
  }, [viewMode, progressiveLoadingState, timelineId]);

  // Reset current event index if it's out of bounds after events change
  useEffect(() => {
    if (currentEventIndex >= events.length && currentEventIndex !== -1) {
      setCurrentEventIndex(Math.max(0, events.length - 1));
    }
  }, [events.length, currentEventIndex]);

  // Add a state to track marker loading status
  const [markersLoading, setMarkersLoading] = useState(false);
  
  // Add state to track timeline element loading stages
  const [timelineElementsLoading, setTimelineElementsLoading] = useState(false);
  const [timelineMarkersLoading, setTimelineMarkersLoading] = useState(false);
  
  const handleLeft = () => {
    console.log('Executing LEFT button press');
    // Set moving state to hide markers during movement
    setIsMoving(true);
    // Set markers as loading
    setMarkersLoading(true);
    
    // If an event is selected, close its popup during movement
    if (selectedEventId) {
      setSelectedEventId(null);
    }
    
    // Wait for markers to completely disappear before moving the timeline
    setTimeout(() => {
      const minMarker = Math.min(...markers);
      setMarkers(prevMarkers => [...prevMarkers, minMarker - 1]);
      setTimelineOffset(prevOffset => prevOffset + 100);
      
      // Wait for timeline to fully render and settle before starting to show markers
      setTimeout(() => {
        // First allow the timeline to finish rendering
        requestAnimationFrame(() => {
          // Then start loading markers
          setMarkersLoading(false);
          // Finally, after markers have started loading, remove the moving state
          setTimeout(() => {
            setIsMoving(false);
          }, 100);
        });
      }, 400); // Longer delay to ensure timeline is fully rendered
    }, 200); // Add a small delay for the fade-out animation
  };
  
  const handleRight = () => {
    console.log('Executing RIGHT button press');
    // Set moving state to hide markers during movement
    setIsMoving(true);
    // Set markers as loading
    setMarkersLoading(true);
    
    // If an event is selected, close its popup during movement
    if (selectedEventId) {
      setSelectedEventId(null);
    }
    
    // Wait for markers to completely disappear before moving the timeline
    setTimeout(() => {
      const maxMarker = Math.max(...markers);
      setMarkers(prevMarkers => [...prevMarkers, maxMarker + 1]);
      setTimelineOffset(prevOffset => prevOffset - 100);
      
      // Wait for timeline to fully render and settle before starting to show markers
      setTimeout(() => {
        // First allow the timeline to finish rendering
        requestAnimationFrame(() => {
          // Then start loading markers
          setMarkersLoading(false);
          // Finally, after markers have started loading, remove the moving state
          setTimeout(() => {
            setIsMoving(false);
          }, 100);
        });
      }, 400); // Longer delay to ensure timeline is fully rendered
    }, 200); // Add a small delay for the fade-out animation
  };
  
  // Process wheel events with debouncing (using the implementation from line 221)

  // Track debounce timers with refs (declared at the top level)
  // These refs are already declared above
  
  // This section was removed to fix duplicate function declaration
  
  // Navigate to an event using sequential button presses
  const navigateToEvent = (event) => {
    if (!event || !event.event_date || viewMode === 'position' || isNavigating) return;
    
    // Set moving state to hide markers during navigation
    setIsMoving(true);
    
    // Wait for markers to completely disappear before calculating and starting navigation
    setTimeout(() => {
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
    }, 250); // Wait for fade-out animation to complete
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
    
    // We're already in isMoving state at this point, markers are hidden
    
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
        
        // Reset moving state to restore markers
        setTimeout(() => setIsMoving(false), 150);
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
    opacity: isRecentering || timelineElementsLoading ? 0 : 1,
    transform: `
      translate3d(0, 0, 0)
      scale(${isRecentering ? '0.98' : '1'})
      ${isFullyFaded ? 'translateY(-10px)' : 'translateY(0)'}
    `,
    pointerEvents: isRecentering || timelineElementsLoading ? 'none' : 'auto',
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

// State declarations for timeline elements were moved to the top of the component

const handleRecenter = () => {
  console.log('Executing Return to Present');
  
  // First, hide all elements with a fade
  setIsRecentering(true);
  setIsMoving(true); // Hide event markers
  setMarkersLoading(true); // Prevent markers from showing during transition
  setTimelineElementsLoading(true); // Hide timeline elements (bars, labels, etc.)
  
  // If an event is selected, close its popup during recentering
  if (selectedEventId) {
    setSelectedEventId(null);
  }

  // Wait for fade out to complete
  setTimeout(() => {
    // Apply full fade effect
    setIsFullyFaded(true);
    
    // Reset timeline offset and markers
    setTimelineOffset(0);
    setMarkers(getInitialMarkers());
    
    // Update URL without page reload
    const searchParams = new URLSearchParams(window.location.search);
    searchParams.set('view', viewMode);
    navigate(`/timeline-v3/${timelineId}?${searchParams.toString()}`, { replace: true });

    // Start staged fade-in sequence
    setTimeout(() => {
      // Phase 1: Show the timeline structure (bars, labels, etc.)
      setIsFullyFaded(false);
      
      // Use requestAnimationFrame to ensure the browser has completed rendering
      requestAnimationFrame(() => {
        // Phase 2: After a short delay, show the timeline elements
        setTimeout(() => {
          setTimelineElementsLoading(false);
          setIsRecentering(false);
          
          // Phase 3: After timeline elements are visible, start loading markers
          setTimeout(() => {
            setTimelineMarkersLoading(false);
            
            // Phase 4: Finally, make markers visible with staggered animation
            setTimeout(() => {
              setMarkersLoading(false);
              
              // Complete the transition by removing the moving state
              setTimeout(() => {
                setIsMoving(false);
              }, 100);
            }, 150);
          }, 200);
        }, 150);
      });
    }, 300);
  }, 400); // Match the transition duration
};

  const handleFilteredEventsCount = (count) => {
    setFilteredEventsCount(count);
  };

  // Check if this is a private community timeline and user is not a member
  if (timeline_type === 'community' && visibility === 'private' && isMember === false && !isLoading) {
    const PrivateTimelineLock = React.lazy(() => import('./community/PrivateTimelineLock'));
    return (
      <React.Suspense fallback={<Box sx={{ minHeight: '100vh' }} />}>
        <PrivateTimelineLock timelineName={timelineName} />
      </React.Suspense>
    );
  }

  // Check if user is blocked from this community timeline
  if (timeline_type === 'community' && isBlocked === true && !isLoading) {
    const BlockedFromCommunity = React.lazy(() => import('./community/BlockedFromCommunity'));
    return (
      <React.Suspense fallback={<Box sx={{ minHeight: '100vh' }} />}>
        <BlockedFromCommunity timelineName={timelineName} />
      </React.Suspense>
    );
  }

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
            <Box sx={{ color: theme.palette.primary.main, minWidth: '200px' }}>
              {!isLoading && (
                timeline_type === 'community' ? (
                  <TimelineNameDisplay 
                    name={timelineName} 
                    type={timeline_type} 
                    visibility={visibility}
                    typographyProps={{
                      variant: "h4",
                      component: "div"
                    }}
                  />
                ) : (
                  <Typography variant="h4" component="div">
                    {`# ${timelineName}`}
                  </Typography>
                )
              )}
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {getViewDescription()}
            </Box>
            <Box sx={{ position: 'relative' }}>
              {/* Button section */}
              {timeline_type === 'community' ? (
                // Community timeline membership control
                <CommunityMembershipControl
                  timelineId={timelineId}
                  user={user}
                  visibility={visibility}
                  requiresApproval={requiresApproval}
                  onJoinSuccess={(data) => {
                    console.log('[TimelineV3] Join success:', data);
                    // Refresh membership status
                    refreshMembership();
                  }}
                  onLeaveSuccess={() => {
                    console.log('[TimelineV3] Leave success');
                    // Refresh membership status
                    refreshMembership();
                  }}
                />
              ) : (
                // Non-community timeline button (delay until details loaded to avoid flicker)
                isLoading ? (
                  <Button
                    disabled
                    sx={{
                      bgcolor: 'rgba(0, 0, 0, 0.12)',
                      color: theme.palette.text.secondary,
                      '&.Mui-disabled': { color: theme.palette.text.secondary }
                    }}
                  >
                    Loading...
                  </Button>
                ) : (
                  <Button
                    onClick={handleAddEventClick}
                    variant="contained"
                    startIcon={<AddIcon />}
                    endIcon={<ArrowDropDownIcon />}
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
                )
              )}
              {/* Only show the menu for non-community timelines */}
              {timeline_type !== 'community' && (
                <Menu
                  anchorEl={addEventAnchorEl}
                  open={Boolean(addEventAnchorEl)}
                  onClose={handleAddEventMenuClose}
                  sx={{ mt: 1 }}
                >

                <MenuItem onClick={() => {
                  handleAddEventMenuClose();
                  setRemarkDialogOpen(true);
                }}>
                  <ListItemIcon>
                    <CommentIcon fontSize="small" sx={{ color: theme.palette.mode === 'dark' ? '#42a5f5' : '#1976d2' }} />
                  </ListItemIcon>
                  <ListItemText>Add Remark</ListItemText>
                </MenuItem>
                <MenuItem onClick={() => {
                  handleAddEventMenuClose();
                  setNewsDialogOpen(true);
                }}>
                  <ListItemIcon>
                    <NewspaperIcon fontSize="small" sx={{ color: theme.palette.mode === 'dark' ? '#ef5350' : '#e53935' }} />
                  </ListItemIcon>
                  <ListItemText>Add News</ListItemText>
                </MenuItem>
                <MenuItem onClick={() => {
                  handleAddEventMenuClose();
                  setMediaDialogOpen(true);
                }}>
                  <ListItemIcon>
                    <PermMediaIcon fontSize="small" sx={{ color: theme.palette.mode === 'dark' ? '#ce93d8' : '#9c27b0' }} />
                  </ListItemIcon>
                  <ListItemText>Add Media</ListItemText>
                </MenuItem>
              </Menu>
              )}
            </Box>
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
            {(() => {
              // Compute filtered events for EventCounter (memoized inline)
              const filteredEventsForCounter = events.filter(event => {
                // Apply the same filtering logic as in EventList
                if (viewMode === 'position') {
                  // In position mode, still apply type filter if selected
                  if (selectedType) {
                    const eventType = (event.type || '').toLowerCase();
                    return eventType === selectedType.toLowerCase();
                  }
                  return true;
                }
                
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
                const passesDateFilter = eventDate >= startDate && eventDate <= endDate;
                
                // Apply type filter if selected
                if (selectedType) {
                  const eventType = (event.type || '').toLowerCase();
                  return passesDateFilter && eventType === selectedType.toLowerCase();
                }
                
                return passesDateFilter;
              });
              
              return (
                <EventCounter
                  count={filteredEventsCount}
                  events={filteredEventsForCounter}
                  currentIndex={currentEventIndex}
                  onChangeIndex={(index) => {
                    // Disable auto-scroll before updating selection
                    setShouldScrollToEvent(false);
                    setCurrentEventIndex(index);
                    // Use the filtered events array to get the correct event
                    if (filteredEventsForCounter[index]) {
                      setSelectedEventId(filteredEventsForCounter[index].id);
                    }
                  }}
                  onDotClick={(event) => {
                    handleDotClick(event);
                    // Ensure the marker is highlighted
                    setSelectedEventId(event.id);
                  }}
                  viewMode={viewMode}
                  timelineOffset={timelineOffset}
                  goToPrevious={navigateToPrevEvent}
                  goToNext={navigateToNextEvent}
                  markerSpacing={100}
                  sortOrder={sortOrder}
                  selectedType={selectedType}
                />
              );
            })()}
            <Stack direction="row" spacing={1}>
              <Button
                variant={viewMode === 'day' ? "contained" : "outlined"}
                size="small"
                onClick={() => handleViewModeTransition(viewMode === 'day' ? 'position' : 'day')}
                disabled={isViewTransitioning}
              >
                Day
              </Button>
              <Button
                variant={viewMode === 'week' ? "contained" : "outlined"}
                size="small"
                onClick={() => handleViewModeTransition(viewMode === 'week' ? 'position' : 'week')}
                disabled={isViewTransitioning}
              >
                Week
              </Button>
              <Button
                variant={viewMode === 'month' ? "contained" : "outlined"}
                size="small"
                onClick={() => handleViewModeTransition(viewMode === 'month' ? 'position' : 'month')}
                disabled={isViewTransitioning}
              >
                Month
              </Button>
              <Button
                variant={viewMode === 'year' ? "contained" : "outlined"}
                size="small"
                onClick={() => handleViewModeTransition(viewMode === 'year' ? 'position' : 'year')}
                disabled={isViewTransitioning}
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
            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            opacity: isViewTransitioning ? (viewTransitionPhase === 'fadeOut' ? 0.5 : 0.8) : 1,
            transform: `
              translate3d(0, 0, 0)
              scale(${isViewTransitioning && viewTransitionPhase === 'structureTransition' ? '0.98' : '1'})
              ${isFullyFaded ? 'translateY(-10px)' : 'translateY(0)'}
            `,
            pointerEvents: isViewTransitioning ? 'none' : 'auto',
            willChange: 'transform, opacity',
            filter: isViewTransitioning && viewTransitionPhase === 'dataProcessing' ? 'blur(1px)' : 'none'
          }}
        >
          {shouldBlur && (
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                zIndex: 2000,
                backdropFilter: 'blur(12px)',
                backgroundColor: 'rgba(0,0,0,0.30)',
                pointerEvents: 'auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Box sx={{
                px: 2,
                py: 1,
                borderRadius: 2,
                bgcolor: theme.palette.background.paper,
                boxShadow: 2,
                fontSize: '0.85rem',
                color: theme.palette.text.secondary
              }}>
                {isMember === null ? 'Checking access…' : 'Access blocked'}
              </Box>
            </Box>
          )}
          {/* View Transition Indicator */}
          {isViewTransitioning && (
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 1500, // Increased to be above all timeline elements including hover marker (900) and selected markers (1000)
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(0,0,0,0.05)',
                backdropFilter: 'blur(2px)',
                pointerEvents: 'none'
              }}
            >
              <Box
                sx={{
                  px: 3,
                  py: 1.5,
                  borderRadius: 2,
                  backgroundColor: theme.palette.background.paper,
                  boxShadow: 3,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 1
                }}
              >
                <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                  {viewTransitionPhase === 'fadeOut' && 'Preparing view...'}
                  {viewTransitionPhase === 'structureTransition' && 'Updating timeline...'}
                  {viewTransitionPhase === 'dataProcessing' && 'Processing events...'}
                  {viewTransitionPhase === 'fadeIn' && 'Loading content...'}
                </Typography>
                <Box sx={{ width: '100%', height: 4, bgcolor: 'rgba(0,0,0,0.1)', borderRadius: 2, overflow: 'hidden' }}>
                  <Box 
                    sx={{ 
                      height: '100%', 
                      width: viewTransitionPhase === 'fadeOut' ? '25%' : 
                             viewTransitionPhase === 'structureTransition' ? '50%' : 
                             viewTransitionPhase === 'dataProcessing' ? '75%' : '95%',
                      bgcolor: theme.palette.primary.main,
                      transition: 'width 0.3s ease-out',
                      borderRadius: 2
                    }} 
                  />
                </Box>
              </Box>
            </Box>
          )}
          {/* Track wheel events for debounced scrolling */}
          <TimelineBackground 
            onBackgroundClick={handleBackgroundClick}
            onWheel={handleWheelEvent}
          />
          <TimelineBar
            timelineOffset={timelineOffset}
            markerSpacing={100}
            minMarker={Math.min(...markers)}
            maxMarker={Math.max(...markers)}
            theme={theme}
            style={timelineTransitionStyles}
          />
          {/* Event Markers - only show in time-based views and when loading is complete */}
          {viewMode !== 'position' && progressiveLoadingState === 'complete' && (
            <>
              {/* Initialize the global event positions array for overlapping detection */}
              {(() => {
                window.timelineEventPositions = [];
                return null;
              })()}
              
              {/* Render event markers with performance optimizations */}
              {(() => {
                // Performance optimization: Calculate date boundaries once
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
                    return null;
                }
                
                // Convert dates to timestamps for faster comparison
                const startTime = startDate.getTime();
                const endTime = endDate.getTime();
                
                // Performance optimization: Limit the number of markers in month and year views
                // This prevents rendering too many markers which can cause performance issues
                const isLargeEventSet = events.length > 50;
                const maxMarkersToRender = isLargeEventSet && (viewMode === 'month' || viewMode === 'year') ? 40 : events.length;
                
                // Filter events to only include those in the visible date range,
                // apply type filtering, and limit the number of markers rendered
                const visibleEvents = events
                  .filter(event => {
                    // Date range filter
                    if (!event.event_date) return false;
                    const eventTime = new Date(event.event_date).getTime();
                    const passesDateFilter = eventTime >= startTime && eventTime <= endTime;
                    if (!passesDateFilter) return false;
                    
                    // Type filter - only apply if a type is selected
                    if (selectedType) {
                      const eventType = (event.type || '').toLowerCase();
                      return eventType === selectedType.toLowerCase();
                    }
                    
                    // If no type filter is applied, include all events
                    return true;
                  })
                  .slice(0, maxMarkersToRender);
                
                console.log(`Rendering ${visibleEvents.length} markers out of ${events.length} total events`);
                
                // Add error boundary for the entire event rendering process
                try {
                  // Make sure visibleEvents is valid before mapping
                  if (!visibleEvents || !Array.isArray(visibleEvents)) {
                    console.error('visibleEvents is not a valid array:', visibleEvents);
                    return null;
                  }
                  
                  // Render only the visible events with additional error handling
                  return visibleEvents.map((event, index) => {
                    // Skip rendering if event is invalid
                    if (!event || typeof event !== 'object' || !event.id) {
                      console.error('Invalid event object:', event);
                      return null;
                    }
                    
                    try {
                      const originalIndex = events.findIndex(e => e && e.id === event.id);
                      
                      // Calculate distance from center for staggered animation
                      const eventDate = new Date(event.event_date);
                      const currentDate = new Date();
                      let distanceFromCenter;
                      
                      // Calculate distance based on view mode
                      switch(viewMode) {
                        case 'day':
                          // Distance in hours
                          distanceFromCenter = Math.abs(eventDate.getHours() - currentDate.getHours());
                          break;
                        case 'week':
                          // Distance in days
                          distanceFromCenter = Math.abs(Math.floor((eventDate - currentDate) / (1000 * 60 * 60 * 24)));
                          break;
                        case 'month':
                          // Distance in days within month
                          distanceFromCenter = Math.abs(eventDate.getDate() - currentDate.getDate());
                          break;
                        case 'year':
                          // Distance in months
                          distanceFromCenter = Math.abs(
                            (eventDate.getMonth() - currentDate.getMonth()) + 
                            (eventDate.getFullYear() - currentDate.getFullYear()) * 12
                          );
                          break;
                        default:
                          // Default to index-based delay for position view
                          distanceFromCenter = index;
                      }
                      
                      // Cap the maximum delay to prevent extremely long waits
                      const maxDelay = 1000; // 1 second max delay
                      const baseDelay = 30; // Base delay in ms
                      const delayMultiplier = 15; // ms per unit of distance
                      
                      // Calculate delay with distance-based staggering
                      // Events closer to center appear first
                      const delay = Math.min(baseDelay + distanceFromCenter * delayMultiplier, maxDelay);
                      
                      return (
                        <Fade
                          key={`marker-${event.id}`}
                          in={!isMoving && !markersLoading}
                          timeout={{ enter: 600, exit: 150 }}
                          style={{
                            transitionDelay: `${delay}ms`,
                          }}
                        >
                          <div>
                            <EventMarker
                              event={event}
                              viewMode={viewMode}
                              timelineOffset={timelineOffset}
                              markerSpacing={100}
                              isSelected={event.id === selectedEventId}
                              onClick={handleMarkerClick}
                            />
                          </div>
                        </Fade>
                      );
                    } catch (error) {
                      console.error(`Error rendering event marker for event ${event.id}:`, error);
                      return null; // Return null for this event if there's an error
                    }
                  });
                } catch (error) {
                  console.error('Error rendering event markers:', error);
                  return null; // Return null if the entire rendering process fails
                }
              })()}
            </>
          )}
          {/* Wrap TimeMarkers in Fade component for smoother transitions */}
          <Fade
            in={!timelineElementsLoading}
            timeout={{ enter: 500, exit: 200 }}
          >
            <div>
              <TimeMarkers 
                timelineOffset={timelineOffset}
                markerSpacing={100}
                markerStyles={markerStyles}
                markers={markers}
                viewMode={viewMode}
                theme={theme}
                style={timelineTransitionStyles}
                pointB_active={pointB_active}
                pointB_reference_markerValue={pointB_reference_markerValue}
                onMarkerClick={(markerValue, timestamp, viewMode) => {
                  console.log('[Point B] Timeline marker clicked - Activating Point B');
                  activatePointB(markerValue, timestamp, viewMode, null, false);
                }}
              />
            </div>
          </Fade>
          
          {/* Wrap HoverMarker in Fade component for smoother transitions */}
          <Fade
            in={!timelineElementsLoading}
            timeout={{ enter: 600, exit: 150 }}
            style={{ transitionDelay: '100ms' }} // Slight delay for staggered appearance
          >
            <div>
              <HoverMarker 
                position={hoverPosition} 
                timelineOffset={timelineOffset}
                markerSpacing={100}
                viewMode={viewMode}
                markers={markers}
                theme={theme}
                style={timelineTransitionStyles}
              />
            </div>
          </Fade>
          
          {/* Point B Indicator - Shows where user focus is locked */}
          <PointBIndicator
            active={pointB_active}
            markerValue={pointB_arrow_markerValue}
            timelineOffset={timelineOffset}
            markerSpacing={100}
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

      {/* Visual Separator */}
      <Box sx={{ height: 24 }} />
      
      {/* Community Dot Tabs - Only shown for community timelines */}
      {timeline_type === 'community' && (
        <CommunityDotTabs 
          timelineId={timelineId} 
          userRole={user?.role || 'user'} 
        />
      )}
      
      {/* Event List Workspace - Enhanced smooth fade-in transition */}
      <Box sx={{
        opacity: progressiveLoadingState === 'complete' ? 1 : 0.6,
        transform: progressiveLoadingState === 'complete' ? 'translateY(0)' : 'translateY(8px)',
        transition: 'opacity 1.2s cubic-bezier(0.4, 0, 0.2, 1), transform 1.2s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative',
        filter: progressiveLoadingState === 'complete' ? 'blur(0)' : 'blur(1px)',
        willChange: 'opacity, transform, filter'
      }}>
        {shouldBlur && (
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              zIndex: 2000,
              backdropFilter: 'blur(12px)',
              backgroundColor: 'rgba(0,0,0,0.30)',
              pointerEvents: 'auto',
              // Visual-only: no status text here to avoid duplicates
            }}
          />
        )}
        {/* Loading Indicator - Fixed to bottom left corner as overlay */}
        {progressiveLoadingState !== 'complete' && (
          <Box sx={{
            position: 'fixed',
            bottom: 16,
            left: 16,
            zIndex: 1200,
            display: 'flex',
            alignItems: 'center',
            p: 1,
            px: 2,
            bgcolor: theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.75)' : 'rgba(255,255,255,0.9)',
            borderRadius: 20,
            boxShadow: 2,
            backdropFilter: 'blur(8px)',
            border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}`,
            maxWidth: '90%',
            opacity: 0.9,
            transition: 'opacity 0.3s ease',
            '&:hover': {
              opacity: 1
            }
          }}>
            <Box sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              bgcolor: progressiveLoadingState === 'timeline' 
                ? theme.palette.info.main 
                : theme.palette.success.main,
              boxShadow: `0 0 10px ${progressiveLoadingState === 'timeline' ? theme.palette.info.main : theme.palette.success.main}`,
              animation: 'pulse 1.5s infinite'
            }} />
            <Typography variant="caption" sx={{ 
              fontWeight: 'medium',
              ml: 1.5,
              fontSize: '0.75rem',
              color: theme.palette.text.secondary
            }}>
              {progressiveLoadingState === 'timeline' 
                ? 'Loading timeline...' 
                : viewMode !== 'position' 
                  ? `Loading events for ${viewMode} view...` 
                  : 'Loading events...'}
            </Typography>
          </Box>
        )}
        
        {/* Event List - Only show when not in timeline loading state */}
        {progressiveLoadingState !== 'timeline' && (
          <EventList
            events={events}
            onEventEdit={handleEventEdit}
            onEventDelete={handleEventDelete}
            selectedEventId={selectedEventId}
            onEventSelect={handleEventSelect}
            shouldScrollToEvent={shouldScrollToEvent}
            viewMode={viewMode}
            minMarker={visibleMarkers.length > 0 ? Math.min(...visibleMarkers) : -10}
            maxMarker={visibleMarkers.length > 0 ? Math.max(...visibleMarkers) : 10}
            onFilteredEventsCount={setFilteredEventsCount}
            isLoadingMarkers={progressiveLoadingState !== 'complete'}
            goToPrevious={navigateToPrevEvent}
            goToNext={navigateToNextEvent}
            currentEventIndex={currentEventIndex}
            setIsPopupOpen={setIsPopupOpen}
            reviewingEventIds={reviewingEventIds}
          />
        )}
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
      
      {/* Media Event Creator */}
      <MediaEventCreator
        open={mediaDialogOpen}
        onClose={() => {
          setMediaDialogOpen(false);
        }}
        onSave={handleEventSubmit}
        timelineName={timelineName}
      />
      
      {/* Remark Event Creator */}
      <RemarkEventCreator
        open={remarkDialogOpen}
        onClose={() => {
          setRemarkDialogOpen(false);
        }}
        onSave={handleEventSubmit}
        timelineName={timelineName}
      />
      
      {/* News Event Creator */}
      <NewsEventCreator
        open={newsDialogOpen}
        onClose={() => {
          setNewsDialogOpen(false);
        }}
        onSave={handleEventSubmit}
        timelineName={timelineName}
      />

      {/* Animated Floating Action Buttons */}
      {!shouldBlur && (
      <Box sx={{ position: 'fixed', right: 32, bottom: 32, display: 'flex', flexDirection: 'column', gap: 2, zIndex: 1500 }}>
        {/* Specialized Event Buttons - These animate in and out */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, position: 'relative' }}>
          {/* Media Button - Animates from main button position */}
          <Box sx={{
            position: 'absolute',
            bottom: floatingButtonsExpanded ? 168 : 0,
            right: 0,
            opacity: floatingButtonsExpanded ? 1 : 0,
            pointerEvents: floatingButtonsExpanded ? 'auto' : 'none',
            transition: `bottom 0.5s cubic-bezier(0.34, 1.56, 0.64, 1), 
                        opacity 0.3s ease-in-out`,
            transitionDelay: floatingButtonsExpanded ? '0.05s' : '0s',
            zIndex: 1510
          }}>
            <Tooltip title="Create Media Event" placement="left">
              <Fab
                onClick={() => {
                  setMediaDialogOpen(true);
                  setFloatingButtonsExpanded(false);
                }}
                size="medium"
                sx={{
                  bgcolor: theme.palette.mode === 'dark' ? '#ce93d8' : '#9c27b0', // Purple color for media
                  '&:hover': {
                    bgcolor: theme.palette.mode === 'dark' ? '#ba68c8' : '#7b1fa2',
                  },
                  color: 'white',
                  boxShadow: 3,
                  transform: floatingButtonsExpanded ? 'scale(1)' : 'scale(0.5)',
                  transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  transitionDelay: floatingButtonsExpanded ? '0.05s' : '0s'
                }}
              >
                <PermMediaIcon />
              </Fab>
            </Tooltip>
          </Box>
          
          {/* News Button - Animates from main button position with delay */}
          <Box sx={{
            position: 'absolute',
            bottom: floatingButtonsExpanded ? 112 : 0,
            right: 0,
            opacity: floatingButtonsExpanded ? 1 : 0,
            pointerEvents: floatingButtonsExpanded ? 'auto' : 'none',
            transition: `bottom 0.45s cubic-bezier(0.34, 1.56, 0.64, 1), 
                        opacity 0.3s ease-in-out`,
            transitionDelay: floatingButtonsExpanded ? '0.1s' : '0s',
            zIndex: 1520
          }}>
            <Tooltip title="Create News Event" placement="left">
              <Fab
                onClick={() => {
                  setNewsDialogOpen(true);
                  setFloatingButtonsExpanded(false);
                }}
                size="medium"
                sx={{
                  bgcolor: theme.palette.mode === 'dark' ? '#ef5350' : '#e53935', // Red color for news
                  '&:hover': {
                    bgcolor: theme.palette.mode === 'dark' ? '#e57373' : '#c62828',
                  },
                  color: 'white',
                  boxShadow: 3,
                  transform: floatingButtonsExpanded ? 'scale(1)' : 'scale(0.5)',
                  transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  transitionDelay: floatingButtonsExpanded ? '0.1s' : '0s'
                }}
              >
                <NewspaperIcon />
              </Fab>
            </Tooltip>
          </Box>
          
          {/* Remark Button - Animates from main button position with more delay */}
          <Box sx={{
            position: 'absolute',
            bottom: floatingButtonsExpanded ? 56 : 0,
            right: 0,
            opacity: floatingButtonsExpanded ? 1 : 0,
            pointerEvents: floatingButtonsExpanded ? 'auto' : 'none',
            transition: `bottom 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), 
                        opacity 0.3s ease-in-out`,
            transitionDelay: floatingButtonsExpanded ? '0.15s' : '0s',
            zIndex: 1530,
          }}>
            <Tooltip title="Create Remark Event" placement="left">
              <Fab
                onClick={() => {
                  setRemarkDialogOpen(true);
                  setFloatingButtonsExpanded(false);
                }}
                size="medium"
                sx={{
                  bgcolor: theme.palette.mode === 'dark' ? '#42a5f5' : '#1976d2', // Blue color for remarks
                  '&:hover': {
                    bgcolor: theme.palette.mode === 'dark' ? '#64b5f6' : '#1565c0',
                  },
                  color: 'white',
                  boxShadow: 3,
                  transform: floatingButtonsExpanded ? 'scale(1)' : 'scale(0.5)',
                  transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  transitionDelay: floatingButtonsExpanded ? '0.15s' : '0s'
                }}
              >
                <CommentIcon />
              </Fab>
            </Tooltip>
          </Box>
        </Box>
        
        {/* Conditional rendering based on timeline type and membership status */}
        {timeline_type === 'community'
          ? (
              isPendingApproval ? (
                // Show "Request Sent!" FAB for pending members
                <Tooltip title="Request Pending Approval">
                  <Fab
                    disabled
                    sx={{
                      bgcolor: theme.palette.warning.light,
                      color: theme.palette.warning.contrastText,
                      '&.Mui-disabled': {
                        bgcolor: theme.palette.warning.light,
                        color: theme.palette.warning.contrastText,
                      },
                      boxShadow: 3,
                      zIndex: 1540
                    }}
                  >
                    <CheckCircleIcon />
                  </Fab>
                </Tooltip>
              ) : (!isMember && !joinRequestSent && !joinLoading && !isBlocked) 
                ? (
                    // Show Join only when verdict is "not a member" and not blocked/loading/pending
                    <Tooltip title={visibility === 'private' ? "Request to Join Community" : "Join Community"}>
                      <Fab
                        onClick={handleJoinCommunity}
                        sx={{
                          bgcolor: theme.palette.mode === 'dark' ? theme.palette.info.dark : theme.palette.info.main,
                          color: 'white',
                          '&:hover': {
                            bgcolor: theme.palette.mode === 'dark' ? theme.palette.info.main : theme.palette.info.dark,
                          },
                          boxShadow: 3,
                          zIndex: 1540
                        }}
                      >
                        <PersonAddIcon />
                      </Fab>
                    </Tooltip>
                  )
                : (
                    // For community: only members get the Add button
                    isMember === true && (
                      <Tooltip title={floatingButtonsExpanded ? "Hide Options" : "Show Event Options"}>
                        <Fab
                          onClick={() => setFloatingButtonsExpanded(!floatingButtonsExpanded)}
                          sx={{
                            bgcolor: theme.palette.mode === 'dark' ? theme.palette.primary.dark : theme.palette.success.light,
                            color: 'white',
                            '&:hover': {
                              bgcolor: theme.palette.mode === 'dark' ? theme.palette.primary.main : theme.palette.success.main,
                            },
                            boxShadow: 3,
                            transform: floatingButtonsExpanded ? 'rotate(45deg)' : 'rotate(0deg)',
                            transition: 'transform 0.3s ease, background-color 0.2s ease',
                            zIndex: 1540
                          }}
                        >
                          <AddIcon />
                        </Fab>
                      </Tooltip>
                    )
                  )
            )
          : (
              // Non-community timelines always get Add button (when not blurred)
              <Tooltip title={floatingButtonsExpanded ? "Hide Options" : "Show Event Options"}>
                <Fab
                  onClick={() => setFloatingButtonsExpanded(!floatingButtonsExpanded)}
                  sx={{
                    bgcolor: theme.palette.mode === 'dark' ? theme.palette.primary.dark : theme.palette.success.light,
                    color: 'white',
                    '&:hover': {
                      bgcolor: theme.palette.mode === 'dark' ? theme.palette.primary.main : theme.palette.success.main,
                    },
                    boxShadow: 3,
                    transform: floatingButtonsExpanded ? 'rotate(45deg)' : 'rotate(0deg)',
                    transition: 'transform 0.3s ease, background-color 0.2s ease',
                    zIndex: 1540
                  }}
                >
                  <AddIcon />
                </Fab>
              </Tooltip>
            )}
      </Box>
      )}
      
      {/* Snackbar for join request status */}
      <Snackbar
        open={joinSnackbarOpen}
        autoHideDuration={6000}
        onClose={() => setJoinSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setJoinSnackbarOpen(false)} 
          severity={joinRequestStatus} 
          sx={{ width: '100%' }}
        >
          {joinRequestStatus === 'success' 
            ? isPendingApproval
              ? 'Request Sent! An admin will review your request.' 
              : 'You have successfully joined this community timeline!'
            : !user 
              ? 'Please log in to join this community timeline.' 
              : 'There was an error processing your request. Please try again.'}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default TimelineV3;
