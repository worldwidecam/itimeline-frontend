import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Container, useTheme, Button, Fade, Stack, Typography, Fab, Tooltip, Menu, MenuItem, ListItemIcon, ListItemText, Divider, Snackbar, Alert, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions, TextField, IconButton, Chip, Avatar } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import api, { checkMembershipStatus, checkMembershipFromUserData, fetchUserMemberships, requestTimelineAccess, getBlockedMembers, fetchUserPassport, debugTimelineMembers, listReports, getUserByUsername, getPersonalTimelineViewers, addPersonalTimelineViewer, removePersonalTimelineViewer } from '../../utils/api';
import UserAvatar from '../common/UserAvatar';
import config from '../../config';
import { differenceInMilliseconds, subDays, addDays, subMonths, addMonths, subYears, addYears } from 'date-fns';
import TimelineBackground from './TimelineBackground';
import TimelineBar from './TimelineBar';
import TimeMarkers from './TimeMarkers';
import HoverMarker from './HoverMarker';
import PointBIndicator from './PointBIndicator';
import EventMarker from './events/EventMarker';
import EventMarkerCanvasV2 from './events/EventMarkerCanvasV2';
import TimelineNameDisplay from './TimelineNameDisplay';
import PersonalTimelineLock from './PersonalTimelineLock';
import EventCounter from './events/EventCounter';
import EventList from './events/EventList';
import EventDialog from './events/EventDialog';
import MediaEventCreator from './events/MediaEventCreator';
import RemarkEventCreator from './events/RemarkEventCreator';
import NewsEventCreator from './events/NewsEventCreator';
import CommunityDotTabs from './community/CommunityDotTabs';
import CommunityMembershipControl from './community/CommunityMembershipControl.js';
import useJoinStatus from '../../hooks/useJoinStatus';
import { getVoteStats } from '../../api/voteApi';
import { getCookie } from '../../utils/cookies';

// Material UI Icons - importing each icon separately to ensure they're properly loaded
import Add from '@mui/icons-material/Add';
import Comment from '@mui/icons-material/Comment';
import Newspaper from '@mui/icons-material/Newspaper';
import PermMedia from '@mui/icons-material/PermMedia';
import Event from '@mui/icons-material/Event';
import ArrowDropDown from '@mui/icons-material/ArrowDropDown';
import PersonAdd from '@mui/icons-material/PersonAdd';
import CheckCircle from '@mui/icons-material/CheckCircle';
import Block from '@mui/icons-material/Block';
import Check from '@mui/icons-material/Check';
import Settings from '@mui/icons-material/Settings';
import Visibility from '@mui/icons-material/Visibility';
import Security from '@mui/icons-material/Security';

// Define icon components to match the names used in the component
const AddIcon = Add;
const CommentIcon = Comment;
const EventIcon = Event;
const NewspaperIcon = Newspaper;
const PermMediaIcon = PermMedia;
const ArrowDropDownIcon = ArrowDropDown;
const SettingsIcon = Settings;
const PersonAddIcon = PersonAdd;
const CheckIcon = Check;
const CheckCircleIcon = CheckCircle;
const VisibilityIcon = Visibility;
const SecurityIcon = Security;

// API prefixes are handled by the api utility

function TimelineV3({ timelineId: timelineIdProp }) {
  const { id: routeId, username: routeUsername, slug: routeSlug } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const theme = useTheme();
  const effectiveId = timelineIdProp || routeId;
  const [timelineId, setTimelineId] = useState(effectiveId);
  const [timelineName, setTimelineName] = useState('');
  const [timeline_type, setTimelineType] = useState('hashtag');
  const [visibility, setVisibility] = useState('public');
  const [createdBy, setCreatedBy] = useState(null);
  const [requiresApproval, setRequiresApproval] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [joinRequestSent, setJoinRequestSent] = useState(false);
  const [joinRequestStatus, setJoinRequestStatus] = useState(null); // 'success', 'error', or null
  const [joinSnackbarOpen, setJoinSnackbarOpen] = useState(false);
  const [isMember, setIsMember] = useState(null); // Track if user is a member of the community timeline (null = loading)
  const [isBlocked, setIsBlocked] = useState(false); // Track if user is blocked on this timeline
  const [isPendingApproval, setIsPendingApproval] = useState(false); // Track if user has a pending membership request
  const [reviewingEventIds, setReviewingEventIds] = useState(new Set()); // Track event IDs that are "in review" on this timeline
  const timelineWorkspaceRef = useRef(null);
  const [timelineWorkspaceBounds, setTimelineWorkspaceBounds] = useState({
    left: 0,
    width: window.innerWidth,
    height: 300,
  });

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


  // Sync internal timelineId state when the source (prop or route param) changes
  useEffect(() => {
    if (effectiveId && effectiveId !== timelineId) {
      setTimelineId(effectiveId);
    }
  }, [effectiveId, timelineId]);

  // Fetch timeline details when component mounts or timelineId changes (membership handled by useJoinStatus)
  useEffect(() => {
    const fetchTimelineDetails = async () => {
      if (!timelineId || timelineId === 'new') return;
      
      try {
        setIsLoading(true);
        // Use the getTimelineDetails utility function instead of direct API call
        // Import the getTimelineDetails function from api.js
        const { getTimelineDetails } = await import('../../utils/api');
        const timelineData = await getTimelineDetails(timelineId);

        if (timelineData && timelineData.error && timelineData.statusCode === 403) {
          // Mark this timeline as locked for the current user and clear any stale name
          setAccessDenied(true);
          setTimelineName('');
          return;
        }
        
        if (timelineData && timelineData.name) {
          setTimelineName(timelineData.name);
          setTimelineType(timelineData.timeline_type || 'hashtag');
          setVisibility(timelineData.visibility || 'public');
          if (typeof timelineData.created_by !== 'undefined' && timelineData.created_by !== null) {
            setCreatedBy(timelineData.created_by);
          }
          setRequiresApproval(timelineData.requires_approval || false);
        } else {
          console.error('Timeline data is missing or incomplete:', response.data);
        }
      } catch (error) {
        if (error?.response?.status === 403) {
          // Locked timeline from backend; treat as expected state and clear name without noisy logs
          setAccessDenied(true);
          setTimelineName('');
        } else {
          console.error('Error fetching timeline details:', error);
          console.error('Error response:', error.response);
          console.error('Error request:', error.request);
          console.error('Error config:', error.config);
        }
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

  const handleCarouselPopupOpen = (event) => {
    if (!event) return;

    let cardRef;
    if (event.type?.toLowerCase() === 'news') {
      cardRef = eventRefs.current[`news-card-${event.id}`];
    } else if (event.type?.toLowerCase() === 'media') {
      cardRef = eventRefs.current[`media-card-${event.id}`];
    } else {
      cardRef = eventRefs.current[`remark-card-${event.id}`];
    }

    if (cardRef?.current?.setPopupOpen) {
      cardRef.current.setPopupOpen(true);
    } else {
      console.warn('WARNING: Could not find card reference for event:', event.id);
      console.warn('The event popup cannot be shown. This is a known issue.');
    }
  };

  const getCurrentDateTime = () => {
    // Return the current date and time
    return new Date();
  };

  /**
   * TIMELINE V4: "Who's in Charge?" Time Reference Function
   * Point B (Dad) takes priority when active, otherwise Point A (Mom) handles baseline
   * This is the CORE function that enables complete Point B system takeover
   * 
   * When Point B is active, ALL coordinate calculations, event filtering, and rendering
   * should use Point B's timestamp instead of current time (Point A)
   */
  const getCurrentTimeReference = () => {
    if (pointB_active && pointB_reference_timestamp) {
      return new Date(pointB_reference_timestamp);
    }
    return new Date(); // Point A (current time)
  };


  const getDayProgress = () => {
    const now = getCurrentDateTime();
    const minutes = now.getHours() * 60 + now.getMinutes();
    return minutes / (24 * 60); // Returns a value between 0 and 1
  };

  const getMonthProgress = () => {
    const now = getCurrentDateTime();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const minutes = now.getHours() * 60 + now.getMinutes();
    const dayProgress = minutes / (24 * 60);
    return (now.getDate() - 1 + dayProgress) / daysInMonth; // Returns a value between 0 and 1
  };

  const getYearProgress = () => {
    const now = getCurrentDateTime();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const endOfYear = new Date(now.getFullYear() + 1, 0, 1);
    const diff = now - startOfYear;
    const yearDuration = endOfYear - startOfYear;
    return diff / yearDuration; // Returns a value between 0 and 1
  };

  /**
   * TIMELINE V4: Progress functions based on specific timestamp (for Point B)
   * These allow Point B to calculate progress from its frozen timestamp instead of current time
   */
  const getDayProgressFromTimestamp = (timestamp) => {
    const minutes = timestamp.getHours() * 60 + timestamp.getMinutes();
    return minutes / (24 * 60); // Returns a value between 0 and 1
  };

  const getMonthProgressFromTimestamp = (timestamp) => {
    const daysInMonth = new Date(timestamp.getFullYear(), timestamp.getMonth() + 1, 0).getDate();
    const minutes = timestamp.getHours() * 60 + timestamp.getMinutes();
    const dayProgress = minutes / (24 * 60);
    return (timestamp.getDate() - 1 + dayProgress) / daysInMonth; // Returns a value between 0 and 1
  };

  const getYearProgressFromTimestamp = (timestamp) => {
    const startOfYear = new Date(timestamp.getFullYear(), 0, 1);
    const endOfYear = new Date(timestamp.getFullYear() + 1, 0, 1);
    const diff = timestamp - startOfYear;
    const yearDuration = endOfYear - startOfYear;
    return diff / yearDuration; // Returns a value between 0 and 1
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
  // Quarantine mode: keep Point B limited to pointer arrow + label only
  const B_POINTER_MINIMAL = true;
  const [pointB_active, setPointB_active] = useState(false);
  
  // Arrow position (visual, fractional) - shows exact click location
  const [pointB_arrow_markerValue, setPointB_arrow_markerValue] = useState(0);
  const [pointB_arrow_pixelOffset, setPointB_arrow_pixelOffset] = useState(0);
  
  // Reference position (calculation, integer) - what EventMarkers calculate from
  const [pointB_reference_markerValue, setPointB_reference_markerValue] = useState(0);
  const [pointB_reference_timestamp, setPointB_reference_timestamp] = useState(null);
  
  const [pointB_viewMode, setPointB_viewMode] = useState('day');
  const [pointB_eventId, setPointB_eventId] = useState(null); // Optional: track which event Point B is focused on
  
  // TIMELINE V4: Cache Point B's view interpretations (closest LEFT integer marker for each view)
  // This allows instant view switching without recalculating from timestamp
  const [pointB_cached_interpretations, setPointB_cached_interpretations] = useState({
    year: null,   // e.g., 2025 (marker value in year view)
    month: null,  // e.g., 9 for October (marker value in month view)
    week: null,   // e.g., 3 for Wednesday (marker value in week view)
    day: null     // e.g., 9 for 9 AM (marker value in day view)
  });

  const activatePointB = (
    markerValue,
    timestamp,
    viewModeValue = viewMode,
    eventId = null,
    recenter = false,
    pixelOffset = 0
  ) => {
    const referenceValue = Math.floor(markerValue);
    setPointB_active(true);
    setPointB_arrow_markerValue(markerValue);
    setPointB_arrow_pixelOffset(pixelOffset || 0);
    setPointB_reference_markerValue(referenceValue);
    setPointB_reference_timestamp(timestamp || null);
    setPointB_viewMode(viewModeValue);
    setPointB_eventId(eventId);
    setPointB_cached_interpretations((prev) => ({
      ...prev,
      [viewModeValue]: referenceValue,
    }));

    if (recenter) {
      setTimelineOffset(-(markerValue * 100));
    }
  };

  const deactivatePointB = () => {
    setPointB_active(false);
    setPointB_eventId(null);
    setPointB_reference_timestamp(null);
  };

  // Prevent auto-selection overrides right after a user click/select
  const userSelectionLockUntilRef = useRef(0);
  const lockUserSelection = (ms = 1200) => {
    userSelectionLockUntilRef.current = Date.now() + ms;
  };

  // Margin configuration: Viewport + buffer (HYBRID APPROACH)
  // Golden rule: Always match viewport + reasonable buffer, scaled per view mode
  // Prevents absurd margins in year view while maintaining smooth scrolling
  const calculatePointBMargin = (currentViewMode = viewMode) => {
    const viewportWidth = timelineWorkspaceBounds?.width || window.innerWidth;
    const markerSpacing = 100;
    const visibleMarkers = Math.ceil(viewportWidth / markerSpacing);
    const baseMargin = Math.ceil(visibleMarkers / 2); // Half viewport
    
    // View-specific buffer scaling to prevent year view from loading decades
    const bufferMultipliers = {
      'day': 1.5,    // ±1.5x viewport (e.g., ~27 hours if viewport shows 18 hours)
      'week': 1.5,   // ±1.5x viewport (e.g., ~27 days if viewport shows 18 days)
      'month': 1.2,  // ±1.2x viewport (smaller buffer for larger time scales)
      'year': 0.3,   // placeholder, overridden below for strict per-year margin
      'position': 1.5 // Default for coordinate view
    };
    
    // STRICT year margin: remain within the selected year's single marker band
    if (currentViewMode === 'year') {
      return 0.49; // Less than one marker so crossing into next year updates reference
    }
    // Tight month margin: ~3 months span
    if (currentViewMode === 'month') {
      return 3;
    }

    const multiplier = bufferMultipliers[currentViewMode] || 1.5;
    const margin = Math.ceil(baseMargin * multiplier);
    return margin;
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
  
  // Touch/drag handling refs
  const touchStartX = useRef(null);
  const touchStartOffset = useRef(null);
  const isDragging = useRef(false);
  const settleTimer = useRef(null);
  const MOTION_SETTLE_DELAY = 450;
  const [isSettled, setIsSettled] = useState(true); // Timeline is settled (not moving)
  
  /**
   * Touch/Drag event handlers for smooth timeline scrolling
   * Provides real-time feedback as user drags the timeline
   */
  const handleTouchStart = (event) => {
    const touch = event.touches ? event.touches[0] : event;
    touchStartX.current = touch.clientX;
    touchStartOffset.current = timelineOffset;
    isDragging.current = true;
    
    // Mark as not settled ONCE when drag starts (not on every move!)
    setIsSettled(false);
    
    // Set cursor to grabbing
    if (event.currentTarget) {
      event.currentTarget.style.cursor = 'grabbing';
    }
  };
  
  const handleTouchMove = (event) => {
    if (!isDragging.current || touchStartX.current === null) return;
    
    // Prevent default for both touch and mouse
    if (event.preventDefault) {
      event.preventDefault();
    }
    
    // NO setIsSettled here! It's already set in handleTouchStart
    // Calling it here causes hundreds of re-renders = choppy drag
    
    const touch = event.touches ? event.touches[0] : event;
    const deltaX = touch.clientX - touchStartX.current;
    const newOffset = touchStartOffset.current + deltaX;
    
    // Update offset in real-time (no debounce for immediate feedback)
    setTimelineOffset(newOffset);
    
  };
  
  const handleTouchEnd = (event) => {
    if (!isDragging.current) return;
    
    isDragging.current = false;
    touchStartX.current = null;
    touchStartOffset.current = null;
    
    // Reset cursor to grab
    if (event.currentTarget) {
      event.currentTarget.style.cursor = 'grab';
    }
    
    // Detect when timeline has settled after drag
    clearTimeout(settleTimer.current);
    settleTimer.current = setTimeout(() => {
      setIsSettled(true); // Triggers event marker fade in
    }, MOTION_SETTLE_DELAY);
    
    // Optional: Snap to nearest marker for cleaner positioning
    // Uncomment if you want snapping behavior
    // const nearestMarker = Math.round(timelineOffset / 100) * 100;
    // setTimelineOffset(nearestMarker);
  };
  
  const [hoverPosition, setHoverPosition] = useState(getExactTimePosition());

  useEffect(() => {
    setHoverPosition(getExactTimePosition());
    const hoverTimer = setInterval(() => {
      setHoverPosition(getExactTimePosition());
    }, 60 * 1000);
    return () => clearInterval(hoverTimer);
  }, [viewMode]);
  const [currentEventIndex, setCurrentEventIndex] = useState(0);
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [shouldScrollToEvent, setShouldScrollToEvent] = useState(true);
  const [isNavigating, setIsNavigating] = useState(false);
  const [isMoving, setIsMoving] = useState(false); // New state to track timeline movement
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  
  // Refs for event cards to access their methods
  const eventRefs = useRef({});

  // Add new state for events and event form
  const [events, setEvents] = useState([]);
  const [isEventFormOpen, setIsEventFormOpen] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [voteStatsById, setVoteStatsById] = useState({});
  const [voteDotsLoading, setVoteDotsLoading] = useState(true);
  const [editingEvent, setEditingEvent] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [mediaDialogOpen, setMediaDialogOpen] = useState(false);
  const [remarkDialogOpen, setRemarkDialogOpen] = useState(false);
  const [newsDialogOpen, setNewsDialogOpen] = useState(false);
  const [addEventAnchorEl, setAddEventAnchorEl] = useState(null);
  const [quickAddMenuAnchorEl, setQuickAddMenuAnchorEl] = useState(null);
  const [floatingButtonsExpanded, setFloatingButtonsExpanded] = useState(false);
  const [accessPanelOpen, setAccessPanelOpen] = useState(false);
  const [allowedViewers, setAllowedViewers] = useState([]);
  const [newViewerUsername, setNewViewerUsername] = useState('');
  const [viewerError, setViewerError] = useState('');
  
  const handleAddEventClick = (event) => {
    setAddEventAnchorEl(event.currentTarget);
  };
  
  const handleAddEventMenuClose = () => {
    setAddEventAnchorEl(null);
  };

  const handleOpenAccessPanel = () => {
    setViewerError('');
    setAccessPanelOpen(true);
  };

  const handleCloseAccessPanel = () => {
    setAccessPanelOpen(false);
  };

  const handleAddViewer = async () => {
    const username = newViewerUsername.trim();
    if (!username) {
      setViewerError('Please enter a username.');
      return;
    }

    // Prevent duplicates (case-insensitive)
    if (
      allowedViewers.some(
        (v) => v.username && v.username.toLowerCase() === username.toLowerCase()
      )
    ) {
      setViewerError('This user is already in the access list.');
      return;
    }

    try {
      setViewerError('');

      const userData = await getUserByUsername(username);

      if (!userData || !userData.id || !userData.username) {
        setViewerError('User lookup returned invalid data.');
        return;
      }

      const backendViewers = await addPersonalTimelineViewer(timelineId, userData.id);
      const mapped = Array.isArray(backendViewers)
        ? backendViewers.map((v) => ({
            id: v.id,
            username: v.username,
            avatarUrl: v.avatar_url || null,
          }))
        : [];

      setAllowedViewers(mapped);
      setNewViewerUsername('');
    } catch (e) {
      console.error('[AccessPanel] Failed to add viewer:', e);
      setViewerError(e.message || 'User not found.');
    }
  };

  const handleRemoveViewer = async (viewerId) => {
    try {
      const backendViewers = await removePersonalTimelineViewer(timelineId, viewerId);
      const mapped = Array.isArray(backendViewers)
        ? backendViewers.map((v) => ({
            id: v.id,
            username: v.username,
            avatarUrl: v.avatar_url || null,
          }))
        : [];

      setAllowedViewers(mapped);
    } catch (e) {
      console.error('[AccessPanel] Failed to remove viewer:', e);
      setViewerError(e.message || 'Failed to remove viewer.');
    }
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

  // Sync filter type, and reset Point B/selection on filter changes
  useEffect(() => {
    const handleFilterChange = (e) => {
      const FADE_OUT_DELAY_MS = 650;
      const nextType = (e && e.detail && typeof e.detail.selectedType !== 'undefined')
        ? e.detail.selectedType
        : (localStorage.getItem('timeline_filter_type') || null);

      if (nextType === selectedType) return;

      setIsFullyFaded(true);
      setTimeout(() => {
        setSelectedType(nextType);
        setIsFullyFaded(false);

        // Reset Point B system on filter change to avoid selection jumps
        if (pointB_active) {
          deactivatePointB();
        }
        // Clear selection (do not auto-select another)
        if (selectedEventId) {
          setSelectedEventId(null);
          setCurrentEventIndex(-1);
        }
      }, FADE_OUT_DELAY_MS);
    };

    // Initial load from localStorage
    const initialType = localStorage.getItem('timeline_filter_type') || null;
    if (initialType !== selectedType) {
      setSelectedType(initialType);
    }

    window.addEventListener('timeline_filter_change', handleFilterChange);
    return () => window.removeEventListener('timeline_filter_change', handleFilterChange);
  }, [selectedType, pointB_active, selectedEventId]);

  const [isRecentering, setIsRecentering] = useState(false);
  const [isFullyFaded, setIsFullyFaded] = useState(false);

  // Add state to track visible markers
  const [visibleMarkers, setVisibleMarkers] = useState([]);

  // Add state to track marker loading status
  const [markersLoading, setMarkersLoading] = useState(false);

  // Add state to track timeline element loading stages
  const [timelineElementsLoading, setTimelineElementsLoading] = useState(false);
  const [timelineMarkersLoading, setTimelineMarkersLoading] = useState(false);

  // Update visible markers when timeline offset changes (odd count for perfect center)
  useEffect(() => {
    const screenWidth = timelineWorkspaceBounds?.width || window.innerWidth;
    const markerWidth = 100;
    const visibleMarkerCount = Math.ceil(screenWidth / markerWidth);
    const totalMarkers = visibleMarkerCount + 1;
    const oddCount = totalMarkers % 2 === 0 ? totalMarkers + 1 : totalMarkers;
    const halfVisibleCount = Math.floor(oddCount / 2);
    const centerMarkerPosition = -timelineOffset / markerWidth;
    const minVisibleMarker = Math.floor(centerMarkerPosition - halfVisibleCount);
    const maxVisibleMarker = Math.ceil(centerMarkerPosition + halfVisibleCount);

    setVisibleMarkers(
      Array.from({ length: oddCount }, (_, i) => minVisibleMarker + i)
    );
  }, [timelineOffset, viewMode, timelineWorkspaceBounds?.width]);

  // Auto-reselect after view switch: moved below progressiveLoadingState declaration
  const lastAutoReselectRef = useRef(0);
  const phaseTimeoutsRef = useRef([]);
  const filterSortPhaseRef = useRef(true);
  const voteDotTimeoutRef = useRef(null);

  // Add state to track filtered events count
  const [filteredEventsCount, setFilteredEventsCount] = useState(0);

  const isPersonalTimeline = timeline_type === 'personal';
  const isCreator = user && createdBy !== null && Number(user.id) === Number(createdBy);
  const isSiteOwner = user && Number(user.id) === 1;
  const [creatorProfile, setCreatorProfile] = useState(null);
  const viewerCount = 1 + allowedViewers.length;
  const viewerLabel = `${viewerCount} viewer${viewerCount !== 1 ? 's' : ''}`;
  const createSlugFromName = (name) => {
    if (!name) return '';
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const personalShareUrl =
    typeof window !== 'undefined' && isPersonalTimeline && user
      ? `${window.location.origin}/timeline-v3/${user.username}/${createSlugFromName(
          timelineName
        )}/${timelineId}`
      : typeof window !== 'undefined'
      ? window.location.href
      : '';

  useEffect(() => {
    const loadCreatorProfile = async () => {
      if (!isPersonalTimeline) return;
      if (!createdBy) return;
      if (!user) return;
      if (isCreator || isSiteOwner) return;

      try {
        const { getUserProfile } = await import('../../utils/api');
        const profile = await getUserProfile(createdBy);
        setCreatorProfile(profile);
      } catch (e) {
        console.error('[TimelineV3] Failed to load creator profile for viewer chip:', e);
      }
    };

    loadCreatorProfile();
  }, [isPersonalTimeline, createdBy, user, isCreator, isSiteOwner]);

  useEffect(() => {
    const loadViewers = async () => {
      if (!timelineId || timelineId === 'new') return;
      if (!isPersonalTimeline) return;
      if (!user) return;
      if (!isCreator && !isSiteOwner) return;

      try {
        const viewers = await getPersonalTimelineViewers(timelineId);
        const mapped = Array.isArray(viewers)
          ? viewers.map((v) => ({
              id: v.id,
              username: v.username,
              avatarUrl: v.avatar_url || null,
            }))
          : [];
        setAllowedViewers(mapped);
      } catch (e) {
        console.error('[AccessPanel] Failed to load viewers:', e);
      }
    };

    loadViewers();
  }, [timelineId, isPersonalTimeline, isCreator, isSiteOwner, user, getPersonalTimelineViewers]);

  const handleEventSelect = (event) => {
    setSelectedEventId(event.id);
    setShouldScrollToEvent(true);
    // Lock selection so auto-sync (carousel or others) doesn't override right away
    lockUserSelection(1500);
    
    // Also update the currentEventIndex to keep carousel in sync
    const eventIndex = events.findIndex(e => e.id === event.id);
    if (eventIndex !== -1) {
      setCurrentEventIndex(eventIndex);
    }
  };

  /**
   * TIMELINE V4: Calculate exact marker position for an event
   * Uses EXACT same logic as EventMarker.js for precision (includes minutes!)
   * @param {Object} event - Event object with event_date
   * @param {string} currentViewMode - Current view mode (day/week/month/year)
   * @returns {number} Exact marker position (fractional)
   */
  const calculateEventMarkerPosition = (event, currentViewMode) => {
    if (!event.event_date || currentViewMode === 'position') {
      return 0;
    }
    
    const eventDate = new Date(event.event_date);
    // Use current time as the base reference; positioning is handled via timelineOffset
    const currentDate = new Date();
    let markerValue;
    
    switch (currentViewMode) {
      case 'day': {
        const dayDiffMs = differenceInMilliseconds(
          new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate()),
          new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate())
        );
        const dayDiff = dayDiffMs / (1000 * 60 * 60 * 24);
        const currentHour = currentDate.getHours();
        const eventHour = eventDate.getHours();
        const eventMinute = eventDate.getMinutes();
        markerValue = (dayDiff * 24) + eventHour - currentHour + (eventMinute / 60);
        break;
      }
      case 'week': {
        const dayDiffMs = differenceInMilliseconds(
          new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate()),
          new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate())
        );
        const dayDiff = dayDiffMs / (1000 * 60 * 60 * 24);
        if (dayDiff === 0) {
          const totalMinutesInDay = 24 * 60;
          const eventMinutesIntoDay = eventDate.getHours() * 60 + eventDate.getMinutes();
          markerValue = eventMinutesIntoDay / totalMinutesInDay;
        } else {
          const eventHour = eventDate.getHours();
          const eventMinute = eventDate.getMinutes();
          const totalMinutesInDay = 24 * 60;
          const eventMinutesIntoDay = eventHour * 60 + eventMinute;
          const eventFractionOfDay = eventMinutesIntoDay / totalMinutesInDay;
          markerValue = Math.floor(dayDiff) + eventFractionOfDay;
        }
        break;
      }
      case 'month': {
        const monthEventYear = eventDate.getFullYear();
        const monthCurrentYear = currentDate.getFullYear();
        const monthEventMonth = eventDate.getMonth();
        const currentMonth = currentDate.getMonth();
        const monthEventDay = eventDate.getDate();
        const monthDaysInMonth = new Date(monthEventYear, monthEventMonth + 1, 0).getDate();
        const monthYearDiff = monthEventYear - monthCurrentYear;
        const monthDiff = monthEventMonth - currentMonth + (monthYearDiff * 12);
        const monthDayFraction = (monthEventDay - 1) / monthDaysInMonth;
        markerValue = monthDiff + monthDayFraction;
        break;
      }
      case 'year': {
        const yearEventYear = eventDate.getFullYear();
        const yearCurrentYear = currentDate.getFullYear();
        const yearDiff = yearEventYear - yearCurrentYear;
        const yearEventMonth = eventDate.getMonth();
        const yearMonthFraction = yearEventMonth / 12;
        const yearEventDay = eventDate.getDate();
        const yearDaysInMonth = new Date(yearEventYear, yearEventMonth + 1, 0).getDate();
        const yearDayFraction = (yearEventDay - 1) / yearDaysInMonth / 12;
        markerValue = yearDiff + yearMonthFraction + yearDayFraction;
        break;
      }
      default:
        markerValue = 0;
    }
    
    return markerValue;
  };

  const handleDotClick = (event) => {
    // ============================================================================
    // TIMELINE V4: Activate Point B when clicking event in EventCounter
    // ============================================================================
    if (event.event_date && viewMode !== 'position') {
      const eventDate = new Date(event.event_date);
      
      // Calculate exact marker position using helper function
      const markerValue = calculateEventMarkerPosition(event, viewMode);
      // Treat dot click as an explicit user selection; lock to prevent overrides
      lockUserSelection(1500);
      
      // Activate Point B at this position
      activatePointB(markerValue, eventDate, viewMode, event.id, false, 0);
    }
    
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
    if (cardRef?.current?.setPopupOpen) {
      cardRef.current.setPopupOpen(true);
    } else {
      // QUARANTINED: No fallback to event edit as it's problematic
      console.warn('WARNING: Could not find card reference for event:', event.id);
      console.warn('The event popup cannot be shown. This is a known issue.');
      // No fallback action - better to do nothing than crash the application
    }
  };

  const getFilteredEventsForCounter = () => {
    return events.filter(event => {
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
      
      const currentDate = getCurrentTimeReference();
      let startDate, endDate;
      
      // Determine visible marker range with a safe fallback when visibleMarkers isn't ready
      let rangeMin, rangeMax;
      if (visibleMarkers && visibleMarkers.length > 0) {
        rangeMin = Math.min(...visibleMarkers);
        rangeMax = Math.max(...visibleMarkers);
      } else {
        const screenWidth = timelineWorkspaceBounds?.width || window.innerWidth;
        const markerWidth = 100;
        const visibleMarkerCount = Math.ceil(screenWidth / markerWidth);
        const centerMarkerPosition = -timelineOffset / markerWidth;
        const halfVisibleCount = Math.floor(visibleMarkerCount / 2);
        rangeMin = Math.floor(centerMarkerPosition - halfVisibleCount);
        rangeMax = Math.ceil(centerMarkerPosition + halfVisibleCount);
      }
      
      // Use only the visible markers without any buffer
      // This ensures we only show events that are actually visible on screen
      
      switch (viewMode) {
        case 'day': {
          startDate = new Date(currentDate);
          startDate.setHours(startDate.getHours() + rangeMin);
          
          endDate = new Date(currentDate);
          endDate.setHours(endDate.getHours() + rangeMax);
          break;
        }
        case 'week': {
          startDate = subDays(currentDate, Math.abs(rangeMin));
          endDate = addDays(currentDate, rangeMax);
          break;
        }
        case 'month': {
          startDate = subMonths(currentDate, Math.abs(rangeMin));
          endDate = addMonths(currentDate, rangeMax);
          break;
        }
        case 'year': {
          startDate = subYears(currentDate, Math.abs(rangeMin));
          endDate = addYears(currentDate, rangeMax);
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
  };

  const handleMarkerClick = (event, index, clickEvent, exactMarkerValue, markerPixelOffset = 0) => {
    // Always activate Point B at this event's position when clicking event marker
    // Use the exact marker value from EventMarker's calculation (includes fractional positions)
    // Note: exactMarkerValue can be 0 (valid), so check for undefined/null specifically
    if (event.event_date && viewMode !== 'position' && exactMarkerValue != null) {
      const eventDate = new Date(event.event_date);
      
      // Activate Point B at this event's EXACT position (not rounded)
      activatePointB(exactMarkerValue, eventDate, viewMode, event.id, false, markerPixelOffset);
    } else {
      console.warn('[Point B] Skipped activation - exactMarkerValue:', exactMarkerValue, 'event_date:', event.event_date, 'viewMode:', viewMode);
    }
    
    // IMPORTANT: Disable auto-scroll BEFORE updating selectedEventId
    setShouldScrollToEvent(false);
    // Prevent immediate auto-selection overrides (EventCounter sync)
    lockUserSelection(1500);
    
    // Set the selected event ID to highlight it in the list (shows hover card)
    setSelectedEventId(event.id);
    
    // Get the filtered events array that's used by the EventCounter
    const filteredEvents = getFilteredEventsForCounter();
    
    // Find the index of the clicked event in the filtered events array
    const filteredIndex = filteredEvents.findIndex(e => e.id === event.id);
    
    // Update the current event index to keep the carousel in sync
    if (filteredIndex !== -1) {
      setCurrentEventIndex(filteredIndex);
    } else {
      // If the event isn't in the filtered array, keep the original index
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
  const [debouncedVisibleEvents, setDebouncedVisibleEvents] = useState([]);
  const lastVisibleEventsRef = useRef([]);
  const lastFilteredEventsCountRef = useRef(0);
  const voteDotUpdateTimeoutRef = useRef(null);


  const clearPhaseTimeouts = () => {
    phaseTimeoutsRef.current.forEach((timeoutId) => clearTimeout(timeoutId));
    phaseTimeoutsRef.current = [];
    if (voteDotTimeoutRef.current) {
      clearTimeout(voteDotTimeoutRef.current);
      voteDotTimeoutRef.current = null;
    }
  };

  const beginPhaseTransition = () => {
    if (progressiveLoadingState !== 'complete') return;
    clearPhaseTimeouts();
    setVoteDotsLoading(true);
    setTimelineMarkersLoading(true);
    setMarkersLoading(true);
    setIsMoving(true);
  };

  const finishPhaseTransition = () => {
    if (progressiveLoadingState !== 'complete') return;
    clearPhaseTimeouts();
    setTimelineElementsLoading(false);
    phaseTimeoutsRef.current.push(setTimeout(() => setTimelineMarkersLoading(false), 600));
    phaseTimeoutsRef.current.push(setTimeout(() => setMarkersLoading(false), 1200));
    phaseTimeoutsRef.current.push(setTimeout(() => setIsMoving(false), 1400));
    voteDotTimeoutRef.current = setTimeout(() => setVoteDotsLoading(false), 1700);
  };

  useEffect(() => {
    if (filterSortPhaseRef.current) {
      filterSortPhaseRef.current = false;
      return;
    }
    if (isViewTransitioning) return;
    beginPhaseTransition();
    finishPhaseTransition();
  }, [selectedType, sortOrder, isViewTransitioning]);

  useEffect(() => () => clearPhaseTimeouts(), []);

  useEffect(() => {
    if (progressiveLoadingState !== 'complete') {
      setVoteDotsLoading(true);
      return undefined;
    }
    if (voteDotTimeoutRef.current) {
      clearTimeout(voteDotTimeoutRef.current);
    }
    setVoteDotsLoading(true);
    voteDotTimeoutRef.current = setTimeout(() => setVoteDotsLoading(false), 700);
    return () => {
      if (voteDotTimeoutRef.current) {
        clearTimeout(voteDotTimeoutRef.current);
        voteDotTimeoutRef.current = null;
      }
    };
  }, [progressiveLoadingState]);

  const visibleEvents = useMemo(() => {
    if (!isSettled) return lastVisibleEventsRef.current;
    if (viewMode === 'position') return [];
    if (progressiveLoadingState !== 'complete') return [];
    if (!events || events.length === 0) return [];

    const screenWidth = timelineWorkspaceBounds?.width || window.innerWidth;
    const markerWidth = 100;
    const visibleMarkerCount = Math.ceil(screenWidth / markerWidth);
    const centerMarkerPosition = -timelineOffset / markerWidth;
    const halfVisibleCount = Math.floor(visibleMarkerCount / 2);
    const rangeMin = Math.floor(centerMarkerPosition - halfVisibleCount);
    const rangeMax = Math.ceil(centerMarkerPosition + halfVisibleCount);

    const filtered = events
      .map((event) => {
        if (!event?.event_date) return null;
        const markerValue = calculateEventMarkerPosition(event, viewMode);
        return { event, markerValue };
      })
      .filter(Boolean)
      .filter(({ event, markerValue }) => {
        if (markerValue < rangeMin || markerValue > rangeMax) return false;
        if (selectedType) {
          const eventType = (event.type || '').toLowerCase();
          return eventType === selectedType.toLowerCase();
        }
        return true;
      })
      .sort((a, b) => a.markerValue - b.markerValue);

    return filtered.map(({ event }) => event);
  }, [
    events,
    isSettled,
    progressiveLoadingState,
    selectedType,
    timelineOffset,
    viewMode,
  ]);

  useEffect(() => {
    if (isSettled) {
      lastVisibleEventsRef.current = visibleEvents;
    }
  }, [isSettled, visibleEvents]);

  useEffect(() => {
    if (!isSettled) {
      setFilteredEventsCount(0);
      lastFilteredEventsCountRef.current = 0;
    }
  }, [isSettled]);

  const handleFilteredEventsCount = useCallback((count) => {
    if (!isSettled) return;
    lastFilteredEventsCountRef.current = count;
    setFilteredEventsCount(count);
  }, [isSettled]);

  const selectedVisibleIndex = useMemo(
    () => visibleEvents.findIndex((event) => event?.id === selectedEventId),
    [visibleEvents, selectedEventId]
  );
  const selectedVisibleEvent = useMemo(
    () => (selectedVisibleIndex >= 0 ? visibleEvents[selectedVisibleIndex] : null),
    [selectedVisibleIndex, visibleEvents]
  );

  const visibleEventIds = useMemo(
    () => visibleEvents.map((event) => event?.id).filter(Boolean),
    [visibleEvents]
  );
  const visibleEventIdsKey = useMemo(() => visibleEventIds.join('|'), [visibleEventIds]);

  useEffect(() => {
    if (progressiveLoadingState !== 'complete' || viewMode === 'position') {
      setDebouncedVisibleEvents([]);
      return undefined;
    }
    if (!isSettled) return undefined;
    if (voteDotUpdateTimeoutRef.current) {
      clearTimeout(voteDotUpdateTimeoutRef.current);
    }
    if (!visibleEvents.length) {
      setDebouncedVisibleEvents([]);
      return undefined;
    }
    voteDotUpdateTimeoutRef.current = setTimeout(() => {
      setDebouncedVisibleEvents(visibleEvents);
    }, MOTION_SETTLE_DELAY);
    return () => {
      if (voteDotUpdateTimeoutRef.current) {
        clearTimeout(voteDotUpdateTimeoutRef.current);
        voteDotUpdateTimeoutRef.current = null;
      }
    };
  }, [visibleEventIdsKey, progressiveLoadingState, viewMode, visibleEvents, isSettled, MOTION_SETTLE_DELAY]);

  useEffect(() => {
    if (progressiveLoadingState !== 'complete') return;
    if (viewMode === 'position') return;
    if (!visibleEventIds.length) return;

    const token =
      getCookie('access_token') || localStorage.getItem('access_token');
    if (!token) {
      console.warn('[VoteDots] Missing auth token; skipping vote stats fetch.');
      return;
    }

    let isCancelled = false;

    const fetchVoteStats = async () => {
      const statsPromises = visibleEventIds.map(async (eventId) => {
        if (!eventId) return null;
        try {
          const stats = await getVoteStats(eventId, token);
          return {
            eventId,
            stats: {
              promote_count: stats.promote_count || 0,
              demote_count: stats.demote_count || 0,
              user_vote: stats.user_vote || null,
            },
          };
        } catch (error) {
          console.error(`Failed to fetch vote stats for event ${eventId}:`, error);
          return null;
        }
      });

      const results = await Promise.all(statsPromises);
      if (isCancelled) return;

      setVoteStatsById((prev) => {
        const next = { ...prev };
        results.forEach((result) => {
          if (result) {
            next[result.eventId] = result.stats;
          }
        });
        return next;
      });

      if (viewMode === 'month' || viewMode === 'year') {
        setVoteDotsLoading(false);
      }
    };

    fetchVoteStats();

    return () => {
      isCancelled = true;
    };
  }, [progressiveLoadingState, viewMode, visibleEventIdsKey]);

  const voteDotsById = useMemo(() => {
    if (!debouncedVisibleEvents.length) return {};

    const dotSize = 6;
    const minOffset = 3;
    const maxOffset = 16;
    const downGamma = 1.35;
    const upGamma = 1.85;
    const extremeRatioThreshold = 60;
    const extremeBoost = 2;
    const extremeBoostCap = 3;

    const totals = debouncedVisibleEvents.map((event) => {
      const stats = voteStatsById[event.id] || null;
      const promote = stats?.promote_count || 0;
      const demote = stats?.demote_count || 0;
      const totalVotes = promote + demote;
      const netVotes = promote - demote;
      return {
        event,
        totalVotes,
        netVotes,
      };
    });

    const withVotes = totals.filter((item) => item.totalVotes > 0);
    const summary = {
      viewMode,
      visibleEvents: totals.length,
      withVotes: withVotes.length,
      positive: withVotes.filter((item) => item.netVotes > 0).length,
      negative: withVotes.filter((item) => item.netVotes < 0).length,
      neutral: withVotes.filter((item) => item.netVotes === 0).length,
      sample: withVotes.slice(0, 10).map((item) => ({
        eventId: item.event.id,
        totalVotes: item.totalVotes,
        netVotes: item.netVotes,
      })),
    };

    const globalMax = Math.max(1, ...totals.map((item) => item.totalVotes));
    const sortedTotals = withVotes
      .map((item) => item.totalVotes)
      .sort((a, b) => a - b);
    const medianVotes = sortedTotals.length
      ? (sortedTotals.length % 2 === 1
        ? sortedTotals[Math.floor(sortedTotals.length / 2)]
        : (sortedTotals[(sortedTotals.length / 2) - 1] + sortedTotals[sortedTotals.length / 2]) / 2)
      : 1;
    const medianAnchor = Math.max(1, medianVotes);
    const extremeRatio = globalMax / medianAnchor;
    const dotMap = {};

    totals.forEach((item, index) => {
      let adjustedScale = 0;
      if (item.totalVotes <= medianAnchor) {
        const ratio = medianAnchor === 0 ? 0 : (item.totalVotes / medianAnchor);
        adjustedScale = 0.5 * Math.pow(ratio, downGamma);
      } else {
        const denom = Math.max(1, globalMax - medianAnchor);
        const ratio = (item.totalVotes - medianAnchor) / denom;
        adjustedScale = 0.5 + 0.5 * Math.pow(Math.min(1, ratio), upGamma);
      }

      let offset = minOffset + adjustedScale * (maxOffset - minOffset);
      if (extremeRatio > extremeRatioThreshold && item.totalVotes > medianAnchor) {
        const boostScale = Math.min(2, extremeRatio / extremeRatioThreshold);
        const boostAmount = Math.min(extremeBoostCap, extremeBoost * boostScale);
        const denom = Math.max(1, globalMax - medianAnchor);
        const intensity = Math.min(1, (item.totalVotes - medianAnchor) / denom);
        offset += boostAmount * intensity;
      }
      offset = Math.round(Math.min(maxOffset + extremeBoostCap, Math.max(minOffset, offset)));

      dotMap[item.event.id] = {
        size: dotSize,
        offset,
        totalVotes: item.totalVotes,
        netVotes: item.netVotes,
        isNeutral: item.netVotes === 0,
        isVisible: item.totalVotes > 0,
      };
    });

    return dotMap;
  }, [debouncedVisibleEvents, voteStatsById]);

  const updateTimelineWorkspaceBounds = useCallback(() => {
    if (!timelineWorkspaceRef.current) return;
    const rect = timelineWorkspaceRef.current.getBoundingClientRect();
    setTimelineWorkspaceBounds({ left: rect.left, width: rect.width, height: rect.height });
  }, []);

  useEffect(() => {
    updateTimelineWorkspaceBounds();
    window.addEventListener('resize', updateTimelineWorkspaceBounds);
    return () => window.removeEventListener('resize', updateTimelineWorkspaceBounds);
  }, [updateTimelineWorkspaceBounds]);

  useEffect(() => {
    if (viewMode === 'position') return;
    if (!visibleEvents.length) return;
    const rafId = window.requestAnimationFrame(() => {
      updateTimelineWorkspaceBounds();
    });
    return () => window.cancelAnimationFrame(rafId);
  }, [viewMode, visibleEvents.length, updateTimelineWorkspaceBounds]);

  // Scan line system removed (vote-dot glow now handled by Canvas V2).
  
  // Function to navigate to the next event in the carousel and update the selected marker
  const navigateToNextEvent = () => {
    if (!events.length) return;
    
    // Get the filtered events based on current view mode
    const filteredEvents = events.filter(e => {
      // Apply the same filtering logic as in EventList
      if (viewMode === 'position') return true;
      
      if (!e.event_date) return false;
      
      const currentDate = getCurrentTimeReference();
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
      
      const currentDate = getCurrentTimeReference();
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

  const FADE_OUT_DELAY_MS = 650;
  
  // Store the currently selected event ID and index to restore after transition
  const currentlySelectedEventId = selectedEventId;
  const currentlySelectedEventIndex = currentEventIndex;
    
  // TIMELINE V4: Store Point B state before transition
  const pointBWasActive = pointB_active;
  const pointBTimestamp = pointB_reference_timestamp;
  const pointBEventId = pointB_eventId;

  // Quarantine: forcibly deactivate Point B before switching views
  if (pointB_active) {
    deactivatePointB();
  }
  
  // Mark that user has interacted to bypass progressive loading delays
  setUserInteracted(true);
  
  // Phase 1: Fade out rungs before starting the transition
  setIsFullyFaded(true);

  setTimeout(() => {
    // Start the transition process
    setIsViewTransitioning(true);
    setPendingViewMode(newViewMode);
    setViewTransitionPhase('fadeOut');
    beginPhaseTransition();
    
    // Phase 2: Timeline structure transition (200ms after transition starts)
    setTimeout(() => {
      // Actually change the view mode to update the timeline structure
      setViewMode(newViewMode);
      setViewTransitionPhase('structureTransition');
      
      // Quarantine: skip all Point B conversions/recentering during view switch
      if (!B_POINTER_MINIMAL && pointBWasActive && pointBTimestamp) {
        const converted = convertPointBToViewMode(newViewMode);
        if (converted) {
          const { arrowPosition, referencePosition } = converted;
          setPointB_arrow_markerValue(arrowPosition);
          setPointB_reference_markerValue(referencePosition);
          setPointB_viewMode(newViewMode);
          const targetOffset = -(arrowPosition * 100);
          setTimelineOffset(targetOffset);
        }
      }
      
      // Phase 3: Data processing (200ms after structure transition)
      setTimeout(() => {
        setViewTransitionPhase('dataProcessing');
        
        // Phase 4: Progressive content rendering (300ms after data processing)
        setTimeout(() => {
          setViewTransitionPhase('fadeIn');
          setIsFullyFaded(false); // Start fading in the content
          finishPhaseTransition();
          
          // Restore the selected event if it exists in the new view
          if (currentlySelectedEventId) {
            // Check if the event is visible in the new view mode
            const isEventVisibleInNewView = events.some(event => {
              if (event.id !== currentlySelectedEventId) return false;
              
              // For position view, all events are visible
              if (newViewMode === 'position') return true;
              
              // For other views, check if the event is within the visible range
              if (!event.event_date) return false;
              
              const currentDate = getCurrentTimeReference();
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
  }, FADE_OUT_DELAY_MS);
};

  useEffect(() => {
    if (hookStatus === 'locked') return; // Respect locked timelines from membership hook

    const fetchEvents = async () => {
      try {
        setIsLoadingEvents(true);
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
        const eventLoadDelay = userInteracted ? 0 : 2000;
        const markerLoadDelay = userInteracted ? 0 : 1500;
        const loadEventsTimer = setTimeout(async () => {
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
          try {
            const response = await api.get(`/api/timeline-v3/${timelineId}/events`);
            setEvents(response.data);
          } catch (error) {
            if (error?.response?.status === 403) {
              // Respect personal timeline ACL in this delayed path as well
              setAccessDenied(true);
              return;
            }
            throw error;
          }
          
          // Update the loading state to events loaded
          setProgressiveLoadingState('events');
          clearInterval(eventLoadingInterval);
          setLoadingProgress(75); // Jump to 75% when events are loaded
          
          // Set another timer to load markers
          const loadMarkersTimer = setTimeout(() => {
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
          }, markerLoadDelay); // Longer delay between events and markers
          
          return () => {
            clearTimeout(loadMarkersTimer);
            clearInterval(eventLoadingInterval);
          };
        }, eventLoadDelay); // Delay before loading events
        
        return () => {
          clearTimeout(loadEventsTimer);
          clearInterval(structureLoadingInterval);
        };
      } catch (error) {
        if (error?.response?.status === 403) {
          // Respect personal timeline ACL: mark access denied and stop treating as an error
          setAccessDenied(true);
        } else {
          console.error('Error fetching events:', error);
          setProgressiveLoadingState('error');
        }
      } finally {
        setIsLoadingEvents(false);
      }
    };

    fetchEvents();
  }, [timelineId, userInteracted, accessDenied, hookStatus]);

  // Fetch reviewing reports to show "In Review" icon on event popups
  useEffect(() => {
    const fetchReviewingReports = async () => {
      if (!timelineId || timelineId === 'new' || !isAuthenticated) return;
      
      try {
        const response = await listReports(timelineId, { status: 'reviewing' });
        // Extract event IDs from the reports
        const eventIds = new Set(
          (response.items || []).map(report => {
            return report.event_id;
          }).filter(Boolean)
        );
        setReviewingEventIds(eventIds);
      } catch (error) {
        // Silently fail - user might not have permission to view reports (non-moderator)
        console.error('[TimelineV3] Could not fetch reviewing reports:', error);
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
      } catch (error) {
        console.error('Error creating timeline:', error);
      }
    };
    
    if (!timelineId) {
      createTimeline();
    }
  }, [timelineId]);

  const handleEventSubmit = async (eventData) => {
    try {
      // =============================
      // V2 Auto-tagging based on timeline type
      // =============================
      // We normalize and augment tags according to the hosting timeline:
      // - Hashtag timelines: always ensure a #NAME tag matching the timeline
      // - Community timelines (i-Name): ensure a #NAME tag (base name), while the i- chip
      //   continues to come from the timeline association itself
      // - Personal timelines (My-Name): do NOT auto-add any # tag; only the personal
      //   association should be reflected via My- chips
      let normalizedTags = [];

      const ensureTagPresent = (rawTag) => {
        if (!rawTag || typeof rawTag !== 'string') return;
        let normalized = rawTag.trim();
        if (!normalized) return;

        // Prevent i- / my- style names from being treated as hashtags
        const lower = normalized.toLowerCase();
        if (lower.startsWith('i-') || lower.startsWith('my-')) {
          return;
        }

        // Normalize to canonical tag/timeline name:
        // - Strip any leading # (visual prefix is handled in the chip UI)
        // - Collapse spaces to dashes
        normalized = normalized.replace(/^#+/, '');
        normalized = normalized.replace(/\s+/g, '-');

        if (!normalizedTags.includes(normalized)) {
          normalizedTags.push(normalized);
        }
      };

      // First, normalize any tags coming from the EventDialog (including visual # prefixes)
      if (Array.isArray(eventData.tags)) {
        eventData.tags.forEach((rawTag) => {
          ensureTagPresent(rawTag);
        });
      }

      if (timelineName && typeof timelineName === 'string') {
        const nameTrimmed = timelineName.trim();

        if (timeline_type === 'hashtag') {
          // Example: timelineName = "#FITNESS" or "FITNESS" -> ensure FITNESS tag
          ensureTagPresent(nameTrimmed);
        } else if (timeline_type === 'community') {
          // Example: timelineName = "i-FITNESS" -> ensure #FITNESS
          let baseName = nameTrimmed;
          const lower = baseName.toLowerCase();
          if (lower.startsWith('i-')) {
            baseName = baseName.slice(2);
          }
          ensureTagPresent(baseName);
        } else if (timeline_type === 'personal') {
          // Explicit V2 rule: personal timelines should not auto-create/attach # tags
          // Leave normalizedTags as-is; rely solely on the personal association.
        }
      }

      // Replace eventData.tags with the normalized/augmented list
      eventData.tags = normalizedTags;

      // Normalize media fields from various legacy/new shapes
      // Prefer explicit fields from the creator (new EventForm path),
      // but still support legacy MediaEventCreator "media" object.
      let mediaUrl = eventData.media_url ||
        (eventData.media && (eventData.media.url || eventData.media.media_url)) ||
        eventData.url ||
        null;

      let mediaType = eventData.media_type ||
        (eventData.media && eventData.media.type) ||
        '';

      let mediaSubtype = eventData.media_subtype ||
        (eventData.media && eventData.media.media_subtype) ||
        '';

      const cloudinaryId = eventData.cloudinary_id ||
        (eventData.media && (eventData.media.cloudinary_id || eventData.media.public_id)) ||
        null;

      // Create a new date object from the event_date
      const originalDate = new Date(eventData.event_date);
      
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
        // Media fields – only meaningful when type === 'media'.
        // We forward what we have without forcing empty strings so the backend
        // can enforce invariants and derive subtypes.
        media_url: mediaUrl || '',
        media_type: mediaType || '',
        media_subtype: mediaSubtype || '',
        cloudinary_id: cloudinaryId || undefined,
        tags: eventData.tags || []
      });

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
      } catch (e) {
        console.warn('Failed to clear localStorage cache:', e);
      }
      
      // Force refresh user memberships from server
      await fetchUserMemberships();
      
      // Check membership from refreshed user data
      const membershipStatus = await checkMembershipFromUserData(timelineId);
      
      // Also do a direct API check as a backup
      const apiMembershipStatus = await checkMembershipStatus(timelineId, 0, true);
      
      // Use the API response if it's valid and differs from user data
      if (apiMembershipStatus && typeof apiMembershipStatus.is_member !== 'undefined' && 
          apiMembershipStatus.is_member !== membershipStatus.is_member) {
        Object.assign(membershipStatus, apiMembershipStatus);
      }
      
      // Update state based on membership status
      if (membershipStatus && typeof membershipStatus.is_member !== 'undefined') {
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
      const members = await debugTimelineMembers(timelineId);

      // Show results in a snackbar
      setSnackbarMessage(`Found ${members.length} members. Membership refreshed: ${refreshedStatus?.is_member ? 'You are a member' : 'You are not a member'}. Check console for details.`);
      setSnackbarSeverity('info');
      setSnackbarOpen(true);
      
      // Check if current user is a member
      const currentUserMember = members.find(m => m.user_id === user?.id);
      void currentUserMember;
      
      // Check localStorage
      try {
        const membershipKey = `timeline_membership_${timelineId}`;
        const storedData = localStorage.getItem(membershipKey);
        if (storedData) {
          JSON.parse(storedData);
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
          isRejoin = true;
        }
      }
    } catch (checkError) {
      console.warn('Error checking previous membership status:', checkError);
    }
    
    // Show loading state while request is being processed
    setJoinRequestSent(true);
    
    try {
      // Call API to request access to the timeline using our updated function
      const response = await requestTimelineAccess(timelineId);
      
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
      
      // Update pending state
      if (isPending) {
        setIsPendingApproval(true);
        setIsMember(false); // Not a full member yet
      } else {
        setIsPendingApproval(false);
        setIsMember(true); // Full member
      }
      
      // IMPORTANT: Store in the direct timeline membership key format
      // This ensures the checkMembershipFromUserData function finds it immediately
      try {
        const directMembershipKey = `timeline_membership_${timelineId}`;
        const membershipData = {
          is_member: isPending ? false : true,
          is_pending: isPending,
          role: memberRole,
          timeline_visibility: visibility
        };
        
        localStorage.setItem(directMembershipKey, JSON.stringify(membershipData));
      } catch (e) {
        console.warn('Error storing direct membership data after join:', e);
      }
      
      // Note: Passport sync endpoint not implemented yet
      // The membership data is already stored in localStorage above
      
      // Force refresh membership status from server after a short delay
      // This ensures backend and frontend are in sync
      setTimeout(() => {
        checkMembershipStatus(timelineId, 0, true)
          .then(status => {
          })
          .catch(err => {
            console.error('Failed to refresh membership status:', err);
          });
      }, 1000);
      
      // Force log the current state for debugging
    } catch (error) {
      // This catch block should rarely be hit now that our API utility handles errors
      console.error('Unexpected error joining community:', error);
      setJoinRequestStatus('error');
      setJoinSnackbarOpen(true);
    }
  };
  
  const smoothScroll = (direction, amount = 100) => {
    // 1. Mark timeline as moving (triggers event marker fade out)
    setIsSettled(false);

    // 2. Update timeline offset (CSS transition handles the animation)
    setTimelineOffset((prevOffset) => {
      const newOffset = direction === 'left'
        ? prevOffset + amount
        : prevOffset - amount;
      return newOffset;
    });

    // 3. Detect when timeline has settled (stopped moving)
    clearTimeout(settleTimer.current);
    settleTimer.current = setTimeout(() => {
      setIsSettled(true); // Triggers event marker fade in
    }, MOTION_SETTLE_DELAY);
  };

  const handleLeft = () => {
    if (selectedEventId) {
      setSelectedEventId(null);
      setCurrentEventIndex(-1);
    }
    smoothScroll('left', 100);
  };

  const handleRight = () => {
    if (selectedEventId) {
      setSelectedEventId(null);
      setCurrentEventIndex(-1);
    }
    smoothScroll('right', 100);
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
    // Deactivate Point B when clicking off an event marker
    if (pointB_active) {
      deactivatePointB();
    }
  };

  // Calculate the temporal distance between an event and the current reference point
  const calculateTemporalDistance = (eventDate) => {
    if (!eventDate || viewMode === 'position') return 0;
    
    const currentDate = getCurrentTimeReference();
    const eventDateObj = new Date(eventDate);
    
    // Calculate the current position on the timeline based on the offset
    // A negative offset means we've moved right (into the future)
    // A positive offset means we've moved left (into the past)
    const currentPosition = -timelineOffset / 100; // Each marker is 100px
    
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
        break;
      }
      
      default:
        distance = 0;
    }
    return distance;
};

// State declarations for timeline elements were moved to the top of the component

const handleRecenter = () => {
  const FADE_OUT_DELAY_MS = 650;

  // TIMELINE V4: Deactivate Point B when returning to present
  if (pointB_active) {
    deactivatePointB();
  }
  
  // First, fade out rungs before starting recenter work
  setIsFullyFaded(true);

  setTimeout(() => {
    // First, hide all elements with a fade
    setIsRecentering(true);
    setIsMoving(true); // Hide event markers
    setMarkersLoading(true); // Prevent markers from showing during transition
    setTimelineElementsLoading(true); // Hide timeline elements (bars, labels, etc.)
    
    // If an event is selected, close its popup during recentering
    if (selectedEventId) {
      setSelectedEventId(null);
    }

    // Reset timeline offset
    setTimelineOffset(0);
    
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
  }, FADE_OUT_DELAY_MS);
};

  const isPersonalRoute = !!(routeUsername && routeSlug);

  // For personal timeline URLs, don't render the main UI while membership/lock is still loading.
  // This prevents a brief flash of the timeline header/Add Event button before we know if the
  // user is allowed or locked.
  if (isPersonalRoute && joinLoading) {
    return <Box sx={{ minHeight: '100vh' }} />;
  }

  // Personal timeline lock behavior should mirror the community lock pattern.
  // useJoinStatus marks locked timelines with status === 'locked' when getTimelineDetails
  // returns a 403 for the current user. Treat that as the single source of truth.
  if (!joinLoading && hookStatus === 'locked') {
    return <PersonalTimelineLock username={routeUsername} slug={routeSlug} />;
  }

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
                <TimelineNameDisplay 
                  name={timelineName} 
                  type={timeline_type} 
                  visibility={visibility}
                  typographyProps={{
                    variant: "h4",
                    component: "div"
                  }}
                />
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
                    // Refresh membership status
                    refreshMembership();
                  }}
                  onLeaveSuccess={() => {
                    // Refresh membership status
                    refreshMembership();
                  }}
                />
              ) : isPersonalTimeline ? (
                isCreator ? (
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Button
                      onClick={handleOpenAccessPanel}
                      variant="contained"
                      sx={{
                        bgcolor: theme.palette.info.main,
                        color: 'white',
                        boxShadow: 2,
                        '&:hover': {
                          bgcolor: theme.palette.info.dark,
                        },
                      }}
                    >
                      Access Panel
                    </Button>
                    <Button
                      disabled
                      startIcon={<VisibilityIcon sx={{ fontSize: '1.4rem' }} />}
                      sx={{
                        bgcolor: theme.palette.mode === 'dark'
                          ? 'rgba(255, 255, 255, 0.08)'
                          : 'rgba(25, 118, 210, 0.08)',
                        color: theme.palette.mode === 'dark'
                          ? theme.palette.primary.light
                          : theme.palette.primary.main,
                        fontSize: '0.9rem',
                        fontWeight: 700,
                        px: 2,
                        py: 0.75,
                        borderRadius: 2,
                        border: `2px solid ${theme.palette.mode === 'dark'
                          ? 'rgba(255, 255, 255, 0.12)'
                          : theme.palette.primary.main}`,
                        '&.Mui-disabled': {
                          color: theme.palette.mode === 'dark'
                            ? theme.palette.primary.light
                            : theme.palette.primary.main,
                        },
                      }}
                    >
                      {viewerLabel}
                    </Button>
                  </Stack>
                ) : isSiteOwner ? (
                  <Button
                    disabled
                    startIcon={<SecurityIcon />}
                    sx={{
                      bgcolor: theme.palette.error.main,
                      color: theme.palette.error.contrastText,
                      fontWeight: 700,
                      px: 2,
                      py: 0.75,
                      borderRadius: 2,
                    }}
                  >
                    System Access
                  </Button>
                ) : (
                  creatorProfile && (
                    <Chip
                      clickable
                      onClick={() => navigate(`/profile/${creatorProfile.id}`)}
                      avatar={
                        <Avatar
                          src={creatorProfile.avatar_url || undefined}
                          alt={creatorProfile.username}
                        />
                      }
                      label={`@${creatorProfile.username}`}
                      sx={{
                        ml: 1.5,
                        px: 1.5,
                        py: 0.25,
                        borderRadius: 999,
                        fontWeight: 600,
                        fontSize: '0.85rem',
                        background:
                          theme.palette.mode === 'dark'
                            ? 'linear-gradient(135deg, rgba(144, 202, 249, 0.16), rgba(206, 147, 216, 0.18))'
                            : 'linear-gradient(135deg, rgba(129, 212, 250, 0.18), rgba(244, 143, 177, 0.22))',
                        color: theme.palette.mode === 'dark'
                          ? theme.palette.primary.light
                          : theme.palette.primary.main,
                        boxShadow:
                          theme.palette.mode === 'dark'
                            ? '0 4px 12px rgba(0, 0, 0, 0.45)'
                            : '0 4px 12px rgba(0, 0, 0, 0.18)',
                        '& .MuiChip-avatar': {
                          width: 28,
                          height: 28,
                        },
                        '&:hover': {
                          boxShadow:
                            theme.palette.mode === 'dark'
                              ? '0 6px 18px rgba(0, 0, 0, 0.55)'
                              : '0 6px 18px rgba(0, 0, 0, 0.24)',
                          transform: 'translateY(-1px)',
                        },
                        transition: 'box-shadow 0.2s ease, transform 0.2s ease',
                      }}
                    />
                  )
                )
              ) : (
                // Only show Add Event for non-personal, non-community timelines
                // and only after we've finished loading the basic timeline metadata.
                (!isLoading && !isPersonalTimeline && timeline_type !== 'community') ? (
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
                ) : (
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
          {/* Personal Access Panel dialog (creator-only, controlled by accessPanelOpen) */}
          <Dialog
            open={accessPanelOpen}
            onClose={handleCloseAccessPanel}
            maxWidth="sm"
            fullWidth
          >
            <DialogTitle>Access Panel</DialogTitle>
            <DialogContent>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Control who can see this personal timeline.
              </Typography>

              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={3}
                alignItems="flex-start"
              >
                {/* Left column: viewers list */}
                <Box
                  sx={{
                    flex: 1,
                    minWidth: 0,
                    maxHeight: 320,
                    overflowY: 'auto',
                    pr: { xs: 0, sm: 1 },
                  }}
                >
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Allowed viewers
                  </Typography>
                  <Stack spacing={1.5} sx={{ mb: 2 }}>
                    {/* Creator row with avatar + fun arrow label */}
                    <Stack
                      direction="row"
                      spacing={1.5}
                      alignItems="center"
                      sx={{
                        p: 1,
                        borderRadius: 2,
                        bgcolor:
                          theme.palette.mode === 'dark'
                            ? 'rgba(255,255,255,0.04)'
                            : 'rgba(0,0,0,0.02)',
                      }}
                    >
                      {/* Avatar placeholder – later we can replace with real avatar */}
                      <UserAvatar
                        name={user?.username || 'You'}
                        avatarUrl={user?.avatar_url}
                        id={user?.id}
                        size={32}
                        sx={{
                          bgcolor:
                            theme.palette.mode === 'dark'
                              ? 'rgba(255,255,255,0.12)'
                              : 'rgba(0,0,0,0.06)',
                        }}
                      />
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          @{user?.username || 'you'}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}
                        >
                          <span style={{ transform: 'rotate(-20deg)', display: 'inline-block' }}>
                            ↪
                          </span>
                          You (creator)
                        </Typography>
                      </Box>
                    </Stack>

                    {/* Other allowed viewers */}
                    {allowedViewers.map((viewer) => (
                      <Stack
                        key={viewer.id || viewer.username}
                        direction="row"
                        spacing={1.5}
                        alignItems="center"
                        sx={{
                          p: 1,
                          borderRadius: 2,
                          bgcolor:
                            theme.palette.mode === 'dark'
                              ? 'rgba(255,255,255,0.02)'
                              : 'rgba(0,0,0,0.01)',
                        }}
                      >
                        <UserAvatar
                          name={viewer.username || 'User'}
                          avatarUrl={viewer.avatarUrl}
                          id={viewer.id}
                          size={28}
                          sx={{
                            bgcolor:
                              theme.palette.mode === 'dark'
                                ? 'rgba(255,255,255,0.08)'
                                : 'rgba(0,0,0,0.04)',
                          }}
                        />
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="body2">@{viewer.username}</Typography>
                        </Box>
                        <IconButton
                          size="small"
                          onClick={() => handleRemoveViewer(viewer.id)}
                        >
                          ×
                        </IconButton>
                      </Stack>
                    ))}

                    {allowedViewers.length === 0 && (
                      <Typography variant="body2" color="text.secondary">
                        Only you can currently see this personal timeline.
                      </Typography>
                    )}
                  </Stack>
                </Box>

                {/* Right column: add viewer + share link */}
                <Box
                  sx={{
                    flexBasis: { xs: '100%', sm: 260 },
                    flexShrink: 0,
                  }}
                >
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Grant access by username
                  </Typography>
                  <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="Type a username"
                      value={newViewerUsername}
                      onChange={(e) => setNewViewerUsername(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddViewer();
                        }
                      }}
                    />
                    <Button
                      variant="contained"
                      onClick={handleAddViewer}
                    >
                      Add
                    </Button>
                  </Stack>
                  {viewerError && (
                    <Typography variant="body2" color="error" sx={{ mb: 2 }}>
                      {viewerError}
                    </Typography>
                  )}

                  <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
                    Share personal link
                  </Typography>
                  <Stack spacing={1}>
                    <TextField
                      fullWidth
                      size="small"
                      value={personalShareUrl}
                      InputProps={{
                        readOnly: true,
                      }}
                    />
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={async () => {
                        try {
                          if (navigator.clipboard && navigator.clipboard.writeText) {
                            await navigator.clipboard.writeText(personalShareUrl);
                          }
                        } catch (e) {
                          console.error('Failed to copy link:', e);
                        }
                      }}
                      sx={{
                        alignSelf: 'flex-start',
                        borderRadius: 2,
                      }}
                    >
                      Copy link
                    </Button>
                  </Stack>
                </Box>
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseAccessPanel}>Close</Button>
            </DialogActions>
          </Dialog>
          <Stack direction="row" spacing={2} alignItems="center">
            {/* Event Counter - Now shows filtered events count */}
            {(() => {
              // Compute filtered events for EventCounter (memoized inline)
              const filteredEventsForCounter = isSettled ? events.filter(event => {
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
                
                const currentDate = getCurrentTimeReference();
                let startDate, endDate;
                
                // Determine visible marker range with a safe fallback when visibleMarkers isn't ready
                let rangeMin, rangeMax;
                if (visibleMarkers && visibleMarkers.length > 0) {
                  rangeMin = Math.min(...visibleMarkers);
                  rangeMax = Math.max(...visibleMarkers);
                } else {
                  const screenWidth = timelineWorkspaceBounds?.width || window.innerWidth;
                  const markerWidth = 100;
                  const visibleMarkerCount = Math.ceil(screenWidth / markerWidth);
                  const centerMarkerPosition = -timelineOffset / markerWidth;
                  const halfVisibleCount = Math.floor(visibleMarkerCount / 2);
                  rangeMin = Math.floor(centerMarkerPosition - halfVisibleCount);
                  rangeMax = Math.ceil(centerMarkerPosition + halfVisibleCount);
                }
                
                // Use only the visible markers without any buffer
                // This ensures we only show events that are actually visible on screen
                
                switch (viewMode) {
                  case 'day': {
                    startDate = new Date(currentDate);
                    startDate.setHours(startDate.getHours() + rangeMin);
                    
                    endDate = new Date(currentDate);
                    endDate.setHours(endDate.getHours() + rangeMax);
                    break;
                  }
                  case 'week': {
                    startDate = subDays(currentDate, Math.abs(rangeMin));
                    endDate = addDays(currentDate, rangeMax);
                    break;
                  }
                  case 'month': {
                    startDate = subMonths(currentDate, Math.abs(rangeMin));
                    endDate = addMonths(currentDate, rangeMax);
                    break;
                  }
                  case 'year': {
                    startDate = subYears(currentDate, Math.abs(rangeMin));
                    endDate = addYears(currentDate, rangeMax);
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
              }) : [];
              
              return (
                <EventCounter
                  count={isSettled ? filteredEventsCount : 0}
                  events={filteredEventsForCounter}
                  currentIndex={currentEventIndex}
                  onChangeIndex={(index) => {
                    // If user just clicked/selected, do not override their choice
                    if (Date.now() < userSelectionLockUntilRef.current) {
                      return;
                    }
                    
                    // Get the event at this index
                    const event = filteredEventsForCounter[index];
                    if (!event) return;
                    
                    // Update index
                    setCurrentEventIndex(index);
                    
                    // Select the event
                    setSelectedEventId(event.id);
                    setShouldScrollToEvent(false); // Don't auto-scroll EventList
                    
                    // Activate Point B if in a time-based view
                    if (event.event_date && viewMode !== 'position') {
                      const markerValue = calculateEventMarkerPosition(event, viewMode);
                      activatePointB(markerValue, new Date(event.event_date), viewMode, event.id, false, 0);
                    }
                  }}
                  onDotClick={handleCarouselPopupOpen}
                  timelineOffset={timelineOffset}
                  goToPrevious={navigateToPrevEvent}
                  goToNext={navigateToNextEvent}
                  markerSpacing={100}
                  sortOrder={sortOrder}
                  selectedType={selectedType}
                  motionDissipate={!isSettled}
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
          ref={timelineWorkspaceRef}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleTouchStart}
          onMouseMove={handleTouchMove}
          onMouseUp={handleTouchEnd}
          onMouseLeave={handleTouchEnd}
          sx={{
            width: '100%',
            height: '300px',
            bgcolor: theme.palette.mode === 'light' ? 'background.paper' : '#2c1b47',
            borderRadius: 2,
            boxShadow: 1,
            position: 'relative',
            overflow: 'hidden',
            touchAction: 'none',
            cursor: 'grab',
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
          {/* Track background clicks only (input handled on workspace container) */}
          <TimelineBackground 
            onBackgroundClick={handleBackgroundClick}
          />
          <TimelineBar
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
              
              <EventMarkerCanvasV2
                key={`canvas-rungs-${viewMode}`}
                events={visibleEvents}
                viewMode={viewMode}
                timelineOffset={timelineOffset}
                markerSpacing={100}
                selectedEventId={selectedEventId}
                onMarkerClick={handleMarkerClick}
                onBackgroundClick={handleBackgroundClick}
                voteDotsById={voteDotsById}
                voteDotsLoading={voteDotsLoading}
                calculateEventMarkerPosition={calculateEventMarkerPosition}
                isFullyFaded={isFullyFaded}
                markersLoading={markersLoading}
                timelineMarkersLoading={timelineMarkersLoading}
                progressiveLoadingState={progressiveLoadingState}
                motionDissipate={!isSettled}
              />
              {selectedVisibleEvent && (
                <Fade
                  key={`marker-selected-${selectedVisibleEvent.id}`}
                  in={!isMoving && isSettled}
                  timeout={{ enter: 500, exit: 200 }}
                >
                  <div>
                    <EventMarker
                      event={selectedVisibleEvent}
                      viewMode={viewMode}
                      timelineOffset={timelineOffset}
                      markerSpacing={100}
                      index={selectedVisibleIndex}
                      totalEvents={visibleEvents.length}
                      currentIndex={currentEventIndex ?? -1}
                      minMarker={visibleMarkers.length > 0 ? Math.min(...visibleMarkers) : -10}
                      maxMarker={visibleMarkers.length > 0 ? Math.max(...visibleMarkers) : 10}
                      onClick={handleMarkerClick}
                      selectedType={selectedType}
                      isSelected
                      isMoving={isMoving}
                      disableHover
                      disableSelectedPulse
                      showMarkerLine={false}
                      showVoteDot={false}
                      voteDot={voteDotsById[selectedVisibleEvent.id] || null}
                      voteDotsLoading={voteDotsLoading}
                    />
                  </div>
                </Fade>
              )}
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
                markers={visibleMarkers}
                viewMode={viewMode}
                theme={theme}
                workspaceWidth={timelineWorkspaceBounds?.width}
                style={timelineTransitionStyles}
                pointB_active={B_POINTER_MINIMAL ? false : pointB_active}
                pointB_reference_markerValue={B_POINTER_MINIMAL ? 0 : pointB_reference_markerValue}
                pointB_reference_timestamp={pointB_reference_timestamp}
                onMarkerClick={(markerValue, timestamp, viewMode) => {
                  // Deselect any previously selected event when clicking a non-event marker
                  if (selectedEventId) {
                    setSelectedEventId(null);
                    setCurrentEventIndex(-1);
                  }
                  activatePointB(markerValue, timestamp, viewMode, null, false, 0);
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
                workspaceWidth={timelineWorkspaceBounds?.width}
                theme={theme}
                style={timelineTransitionStyles}
              />
            </div>
          </Fade>
          
          {/* Point B Indicator - Shows where user focus is locked */}
          <PointBIndicator
            active={pointB_active}
            markerValue={pointB_arrow_markerValue}
            pixelOffset={pointB_arrow_pixelOffset}
            timelineOffset={timelineOffset}
            workspaceWidth={timelineWorkspaceBounds?.width}
            label={pointB_active && pointB_reference_timestamp ? new Date(pointB_reference_timestamp).toLocaleString() : undefined}
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
            events={isSettled ? events : []}
            onEventEdit={handleEventEdit}
            onEventDelete={handleEventDelete}
            selectedEventId={selectedEventId}
            onEventSelect={handleEventSelect}
            shouldScrollToEvent={shouldScrollToEvent}
            viewMode={viewMode}
            minMarker={visibleMarkers.length > 0 ? Math.min(...visibleMarkers) : -10}
            maxMarker={visibleMarkers.length > 0 ? Math.max(...visibleMarkers) : 10}
            onFilteredEventsCount={handleFilteredEventsCount}
            isLoadingMarkers={progressiveLoadingState !== 'complete'}
            goToPrevious={navigateToPrevEvent}
            goToNext={navigateToNextEvent}
            currentEventIndex={currentEventIndex}
            setIsPopupOpen={setIsPopupOpen}
            eventRefs={eventRefs}
            reviewingEventIds={reviewingEventIds}
            motionDissipate={!isSettled}
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
        timelineName={timelineName}
        timelineType={timeline_type}
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
        {/* Consolidated Event Button - Animates in and out */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, position: 'relative' }}>
          <Box sx={{
            position: 'absolute',
            bottom: floatingButtonsExpanded ? 56 : 0,
            right: 0,
            opacity: floatingButtonsExpanded ? 1 : 0,
            pointerEvents: floatingButtonsExpanded ? 'auto' : 'none',
            transition: `bottom 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), 
                        opacity 0.3s ease-in-out`,
            transitionDelay: floatingButtonsExpanded ? '0.05s' : '0s',
            zIndex: 1530,
          }}>
            <Tooltip title="Create Event" placement="left">
              <Fab
                onClick={() => {
                  setEditingEvent(null);
                  setDialogOpen(true);
                  setFloatingButtonsExpanded(false);
                }}
                size="medium"
                sx={{
                  bgcolor: theme.palette.mode === 'dark' ? '#263238' : '#ffffff',
                  border: theme.palette.mode === 'dark' ? '2px solid #69F0AE' : '2px solid #00CFA1',
                  '&:hover': {
                    bgcolor: theme.palette.mode === 'dark' ? '#1c2326' : '#f5fffb',
                    boxShadow: theme.palette.mode === 'dark'
                      ? '0 0 18px rgba(105, 240, 174, 0.45)'
                      : '0 0 18px rgba(0, 207, 161, 0.35)'
                  },
                  color: theme.palette.mode === 'dark' ? '#69F0AE' : '#00CFA1',
                  boxShadow: theme.palette.mode === 'dark'
                    ? '0 0 12px rgba(105, 240, 174, 0.35)'
                    : '0 0 12px rgba(0, 207, 161, 0.25)',
                  transform: floatingButtonsExpanded ? 'scale(1)' : 'scale(0.5)',
                  transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  transitionDelay: floatingButtonsExpanded ? '0.05s' : '0s'
                }}
              >
                <EventIcon />
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
