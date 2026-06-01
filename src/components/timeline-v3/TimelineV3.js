import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Box, Container, useTheme, alpha, Button, Fade, Stack, Typography, Fab, Tooltip, Menu, MenuItem, ListItemIcon, ListItemText, Divider, Snackbar, Alert, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions, TextField, IconButton, Chip, Avatar, Skeleton } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import api, { checkMembershipStatus, checkMembershipFromUserData, fetchUserMemberships, requestTimelineAccess, getBlockedMembers, fetchUserPassport, debugTimelineMembers, listReports, getUserByUsername, getPersonalTimelineViewers, addPersonalTimelineViewer, removePersonalTimelineViewer, submitTimelineReport, getTimelineWarningState, getTimelineFollowStatus, followTimeline, unfollowTimeline } from '../../utils/api';
import UserAvatar from '../common/UserAvatar';
import { displayUsername } from '../../utils/usernameDisplay';
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
import PersonalAccessPanel from './PersonalAccessPanel';
import HashtagSettingsDialog from './HashtagSettingsDialog';
import EventCounter from './events/EventCounter';
import EventList from './events/EventList';
import EventDialog from './events/EventDialog';
import MediaEventCreator from './events/MediaEventCreator';
import RemarkEventCreator from './events/RemarkEventCreator';
import NewsEventCreator from './events/NewsEventCreator';
import NavFab from './community/NavFab';
import { getTimelineSurfaceTheme } from './timelineSurfaceTheme';
import CommunityMembershipControl from './community/CommunityMembershipControl.js';
import useJoinStatus from '../../hooks/useJoinStatus';
import { TimelineHeroBanner } from './TimelineHeroBanner';
import {
  getGlassDialogPaperSx,
  getGlassInputSx,
  getGlassSquareActionButtonSx,
  getGlassPillActionButtonSx,
} from '../../utils/formStyleGuide';
import { getVoteStats } from '../../api/voteApi';
import { getCookie } from '../../utils/cookies';
import TradingCard from '../common/TradingCard';

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
import OutlinedFlag from '@mui/icons-material/OutlinedFlag';
import Groups from '@mui/icons-material/Groups';
import Tag from '@mui/icons-material/Tag';
import Person from '@mui/icons-material/Person';
import MyLocation from '@mui/icons-material/MyLocation';

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
const OutlinedFlagIcon = OutlinedFlag;
const GroupsIcon = Groups;
const TagIcon = Tag;
const PersonIcon = Person;
const MyLocationIcon = MyLocation;
const BannedTimelineLock = React.lazy(() => import('./community/BannedTimelineLock'));
const PrivateTimelineLock = React.lazy(() => import('./community/PrivateTimelineLock'));
const BlockedFromCommunity = React.lazy(() => import('./community/BlockedFromCommunity'));

// API prefixes are handled by the api utility

function TimelineV3({ timelineId: timelineIdProp }) {
  const { id: routeId, username: routeUsername, slug: routeSlug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();
  const theme = useTheme();
  const timelineSurfaces = useMemo(() => getTimelineSurfaceTheme(theme), [theme]);
  const effectiveId = timelineIdProp || routeId;
  const [timelineId, setTimelineId] = useState(effectiveId);
  const [timelineName, setTimelineName] = useState('');
  const [timelineDescription, setTimelineDescription] = useState('');
  const [coverPortraitUrl, setCoverPortraitUrl] = useState('');
  const [coverPortraitPosition, setCoverPortraitPosition] = useState({ x: 50, y: 50 });
  const [coverPortraitZoom, setCoverPortraitZoom] = useState(1);
  const [coverLandscapeUrl, setCoverLandscapeUrl] = useState('');
  const [coverLandscapePosition, setCoverLandscapePosition] = useState({ x: 50, y: 50 });
  const [coverLandscapeZoom, setCoverLandscapeZoom] = useState(1);
  const [coverUploadEnabled, setCoverUploadEnabled] = useState(true);
  const [timeline_type, setTimelineType] = useState('hashtag');
  const [visibility, setVisibility] = useState('public');
  const [createdBy, setCreatedBy] = useState(null);
  const [requiresApproval, setRequiresApproval] = useState(false);
  const [postingRestrictionEnabled, setPostingRestrictionEnabled] = useState(false);
  const [postingMinRole, setPostingMinRole] = useState('moderator');
  const [accessDenied, setAccessDenied] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [joinRequestSent, setJoinRequestSent] = useState(false);
  const [joinRequestStatus, setJoinRequestStatus] = useState(null); // 'success', 'error', or null
  const [joinSnackbarOpen, setJoinSnackbarOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
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
  const shareLink = useMemo(() => {
    if (!timelineId || timelineId === 'new') {
      return window.location.href;
    }
    return `${config.API_URL}/share/timeline/${timelineId}`;
  }, [timelineId]);
  const shareQrUrl = useMemo(() => (
    shareLink
      ? `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(shareLink)}`
      : ''
  ), [shareLink]);

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
      if (hookStatus === 'locked' || hookStatus === 'banned' || !timelineId || timelineId === 'new') {
        setIsLoading(false);
        return;
      }
      
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
          setTimelineDescription(String(timelineData.description || ''));
          setTimelineType(timelineData.timeline_type || 'hashtag');
          setVisibility(timelineData.visibility || 'public');
          setPostingRestrictionEnabled(Boolean(timelineData.posting_restriction_enabled));
          setPostingMinRole(
            String(timelineData.posting_min_role || 'moderator').toLowerCase() === 'admin'
              ? 'admin'
              : 'moderator'
          );
          if (typeof timelineData.created_by !== 'undefined' && timelineData.created_by !== null) {
            setCreatedBy(timelineData.created_by);
          }
          if (timelineData.creator_username) {
            setCreatorProfile({
              id: timelineData.created_by_id || timelineData.created_by,
              username: timelineData.creator_username,
              avatar_url: timelineData.creator_avatar_url,
              user_color: timelineData.creator_user_color,
              is_restricted: timelineData.creator_is_restricted,
              is_suspended: timelineData.creator_is_suspended,
            });
          }
          setRequiresApproval(timelineData.requires_approval || false);
          setCoverPortraitUrl(String(timelineData.cover_portrait_image_url || '').trim());
          setCoverPortraitPosition({
            x: Number(timelineData.cover_portrait_x ?? 50),
            y: Number(timelineData.cover_portrait_y ?? 50),
          });
          setCoverPortraitZoom(Number(timelineData.cover_portrait_zoom ?? 1));
          setCoverLandscapeUrl(String(timelineData.cover_landscape_image_url || '').trim());
          setCoverLandscapePosition({
            x: Number(timelineData.cover_landscape_x ?? 50),
            y: Number(timelineData.cover_landscape_y ?? 50),
          });
          setCoverLandscapeZoom(Number(timelineData.cover_landscape_zoom ?? 1));
          setCoverUploadEnabled(timelineData.cover_upload_enabled !== false);
          setTimelineIsSafeguarded(Boolean(timelineData.is_safeguarded));
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
  }, [timelineId, hookStatus]);

  useEffect(() => {
    let active = true;
    const fetchWarningState = async () => {
      if (!timelineId || timelineId === 'new') return;
      const warningState = await getTimelineWarningState(timelineId);
      if (active) {
        setTimelineWarningState(warningState || { active: false });
      }
    };
    fetchWarningState();
    return () => {
      active = false;
    };
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

  const handleShareCardClick = async () => {
    if (!shareLink) return;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareLink);
      } else {
        throw new Error('Clipboard unavailable');
      }
      setSnackbarMessage('Link Copied!');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Failed to copy share link:', error);
      setSnackbarMessage('Failed to copy link');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
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
    
    // Only prevent default for mouse events to avoid console warnings (touchAction: 'none' handles touches naturally)
    if (event.type === 'mousemove' && event.preventDefault) {
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
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const handleRefresh = () => {
      setRefreshTrigger(prev => prev + 1);
    };
    window.addEventListener('refresh-timeline-events', handleRefresh);
    return () => {
      window.removeEventListener('refresh-timeline-events', handleRefresh);
    };
  }, []);
  const [voteStatsById, setVoteStatsById] = useState({});
  const [voteDotsLoading, setVoteDotsLoading] = useState(true);
  const [editingEvent, setEditingEvent] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [mediaDialogOpen, setMediaDialogOpen] = useState(false);
  const [remarkDialogOpen, setRemarkDialogOpen] = useState(false);
  const [newsDialogOpen, setNewsDialogOpen] = useState(false);
  const [timelineReportDialogOpen, setTimelineReportDialogOpen] = useState(false);
  const [timelineReportReason, setTimelineReportReason] = useState('');
  const [timelineReportCategory, setTimelineReportCategory] = useState('');
  const [timelineReportSubmitting, setTimelineReportSubmitting] = useState(false);
  const [timelineWarningState, setTimelineWarningState] = useState({ active: false });
  const [timelineIsSafeguarded, setTimelineIsSafeguarded] = useState(false);
  const [addEventAnchorEl, setAddEventAnchorEl] = useState(null);
  const [quickAddMenuAnchorEl, setQuickAddMenuAnchorEl] = useState(null);
  const [floatingButtonsExpanded, setFloatingButtonsExpanded] = useState(false);
  const [hashtagSettingsOpen, setHashtagSettingsOpen] = useState(false);
  const [siteRole, setSiteRole] = useState(null);
  const [isSiteAdmin, setIsSiteAdmin] = useState(false);
  const [accessPanelOpen, setAccessPanelOpen] = useState(false);
  const [allowedViewers, setAllowedViewers] = useState([]);
  const [newViewerUsername, setNewViewerUsername] = useState('');
  const [viewerError, setViewerError] = useState('');

  useEffect(() => {
    if (!timelineId || timelineId === 'new' || !events.length) return;

    const params = new URLSearchParams(location.search || '');
    const queryEventId = Number(params.get('openEvent'));
    const pendingEventId = Number(localStorage.getItem('timeline_pending_open_event_id') || 0);
    const targetEventId = Number.isFinite(queryEventId) && queryEventId > 0 ? queryEventId : pendingEventId;
    if (!Number.isFinite(targetEventId) || targetEventId <= 0) return;

    const targetIndex = events.findIndex((event) => Number(event?.id) === targetEventId);
    if (targetIndex < 0) return;

    const targetEvent = events[targetIndex];
    const targetType = String(targetEvent?.type || '').toLowerCase();
    const cardRefKey = `${targetType}-card-${targetEventId}`;

    const tryOpenPopup = (attempt = 0) => {
      const cardRef = eventRefs.current[cardRefKey];
      if (cardRef?.current?.openPopup) {
        cardRef.current.openPopup();
        return;
      }
      if (attempt >= 12) return;
      setTimeout(() => tryOpenPopup(attempt + 1), 100);
    };

    setSelectedEventId(targetEventId);
    setCurrentEventIndex(targetIndex);
    setShouldScrollToEvent(true);
    setTimeout(() => tryOpenPopup(), 0);

    localStorage.removeItem('timeline_pending_open_event_id');
    if (params.has('openEvent')) {
      params.delete('openEvent');
      const nextSearch = params.toString();
      navigate(`${location.pathname}${nextSearch ? `?${nextSearch}` : ''}`, { replace: true });
    }
  }, [timelineId, events, location.pathname, location.search, navigate]);
  
  const handleAddEventClick = (event) => {
    setAddEventAnchorEl(event.currentTarget);
  };
  
  const handleAddEventMenuClose = () => {
    setAddEventAnchorEl(null);
  };

  const handleCommunityNavigate = (targetPath) => {
    if (!targetPath || location.pathname === targetPath) {
      setFloatingButtonsExpanded(false);
      return;
    }
    setFloatingButtonsExpanded(false);
    navigate(targetPath);
  };

  const handleOpenTimelineReportDialog = () => {
    setTimelineReportCategory('');
    setTimelineReportReason('');
    setTimelineReportDialogOpen(true);
    setFloatingButtonsExpanded(false);
  };

  const handleCloseTimelineReportDialog = () => {
    if (timelineReportSubmitting) return;
    setTimelineReportDialogOpen(false);
  };

  const handleSubmitTimelineReport = async () => {
    if (!timelineId || timelineId === 'new') return;
    if (!timelineReportCategory) {
      setSnackbarMessage('Please choose a report category');
      setSnackbarSeverity('warning');
      setSnackbarOpen(true);
      return;
    }
    try {
      setTimelineReportSubmitting(true);
      await submitTimelineReport(timelineId, timelineReportReason || '', timelineReportCategory);
      setTimelineReportDialogOpen(false);
      setSnackbarMessage('Timeline report submitted');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (e) {
      const msg = e?.response?.data?.error?.message || e?.response?.data?.error || e?.message || 'Failed to submit timeline report';
      setSnackbarMessage(msg);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setTimelineReportSubmitting(false);
    }
  };

  const handleOpenAccessPanel = () => {
    setViewerError('');
    setAccessPanelOpen(true);
    setFloatingButtonsExpanded(false);
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

  const communityFallbackGradient = useMemo(() => (
    theme.palette.mode === 'dark'
      ? 'linear-gradient(135deg, rgba(13,36,63,0.86) 0%, rgba(20,48,92,0.9) 40%, rgba(65,34,106,0.86) 100%)'
      : 'linear-gradient(135deg, rgba(250,232,242,0.94) 0%, rgba(246,232,220,0.96) 68%, rgba(252,238,224,0.98) 100%)'
  ), [theme.palette.mode]);

  const clampCoverFramePosition = useCallback((value, defaultValue = 50) => {
    const numeric = Number(value);
    const safe = Number.isFinite(numeric) ? numeric : Number(defaultValue);
    return Math.max(-300, Math.min(300, safe));
  }, []);
  const clampCoverZoom = useCallback((value) => Math.max(1, Math.min(4.875, Number(value) || 1)), []);

  const getCoverTranslate = useCallback((value) => {
    const centered = clampCoverFramePosition(value, 50) - 50;
    return centered * 0.9;
  }, [clampCoverFramePosition]);

  const buildCoverPortraitTransform = useCallback((position, zoomValue, isPrivilegeEnabled = true) => {
    const tx = getCoverTranslate(position?.x);
    const ty = getCoverTranslate(position?.y);
    const safeZoom = clampCoverZoom(zoomValue);
    const finalZoom = isPrivilegeEnabled ? safeZoom : (safeZoom + 0.08);
    return `translate(${tx}%, ${ty}%) scale(${finalZoom})`;
  }, [getCoverTranslate, clampCoverZoom]);

  const buildCoverLandscapeTransform = useCallback((position, zoomValue, isPrivilegeEnabled = true) => {
    const tx = getCoverTranslate(position?.x);
    const ty = getCoverTranslate(position?.y);
    const safeZoom = clampCoverZoom(zoomValue);
    const finalZoom = isPrivilegeEnabled ? safeZoom : (safeZoom + 0.08);
    return `translate(${tx}%, ${ty}%) scale(${finalZoom})`;
  }, [getCoverTranslate, clampCoverZoom]);

  const showShareTradingCard = timeline_type === 'community' || timeline_type === 'personal' || timeline_type === 'hashtag';

  const shareCardLabel = timeline_type === 'community'
    ? 'COMMUNITY'
    : (timeline_type === 'personal' ? 'PERSONAL' : 'HASHTAG');
  const shareCardTitle = timeline_type === 'community'
    ? `i-${timelineName || 'Community'}`
    : (timeline_type === 'hashtag' ? `#${timelineName || 'Hashtag'}` : (timelineName || 'Personal'));
  const shareCardImageObjectFit = timeline_type === 'community' ? 'cover' : 'contain';

  const handleAccessPanelNotice = useCallback(({ message, severity }) => {
    if (!message) return;
    setSnackbarMessage(message);
    setSnackbarSeverity(severity || 'info');
    setSnackbarOpen(true);
  }, []);

  const handleOpenHashtagSettings = useCallback(() => {
    setHashtagSettingsOpen(true);
    setFloatingButtonsExpanded(false);
  }, []);

  const handleCloseHashtagSettings = useCallback(() => {
    setHashtagSettingsOpen(false);
  }, []);

  const handleHashtagSettingsSaved = useCallback((nextSettings) => {
    setTimelineDescription(String(nextSettings?.description || ''));
    setCoverPortraitUrl(String(nextSettings?.coverPortraitUrl || '').trim());
    setCoverPortraitPosition({
      x: Number(nextSettings?.coverPortraitPosition?.x ?? 50),
      y: Number(nextSettings?.coverPortraitPosition?.y ?? 50),
    });
    setCoverPortraitZoom(Number(nextSettings?.coverPortraitZoom ?? 1) || 1);
    setCoverLandscapeUrl(String(nextSettings?.coverLandscapeUrl || '').trim());
    setCoverLandscapePosition({
      x: Number(nextSettings?.coverLandscapePosition?.x ?? 50),
      y: Number(nextSettings?.coverLandscapePosition?.y ?? 50),
    });
    setCoverLandscapeZoom(Number(nextSettings?.coverLandscapeZoom ?? 1) || 1);
  }, []);

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
  const isCommunityTimeline = timeline_type === 'community';
  const isHashtagTimeline = timeline_type === 'hashtag';
  const isGuestUser = Boolean(user) && (user?.role === 'guest' || !(Number(user?.id) > 0));
  const canCreateOrReport = Boolean(user) && !isGuestUser && user?.can_post_or_report !== false && !user?.must_change_username && !user?.is_restricted;
  const isCreator = user && createdBy !== null && Number(user.id) === Number(createdBy);
  const isSiteOwner = (Number(user?.id) === 1) || siteRole === 'SiteOwner';
  const canCreateTimelineEvents = canCreateOrReport && (!isPersonalTimeline || isCreator || isSiteOwner);
  const normalizedCommunityRole = String(hookRole || '').toLowerCase();
  const communityPostingMinRole = postingMinRole === 'admin' ? 'admin' : 'moderator';
  const meetsCommunityRoleRestriction =
    !postingRestrictionEnabled
    || isCreator
    || isSiteOwner
    || (communityPostingMinRole === 'admin'
      ? normalizedCommunityRole === 'admin' || normalizedCommunityRole === 'siteowner'
      : ['moderator', 'admin', 'siteowner'].includes(normalizedCommunityRole));
  const canCreateCommunityEvents =
    isMember === true
    && canCreateOrReport
    && (!isCommunityTimeline || meetsCommunityRoleRestriction);
  const canOpenCommunityActionFab = isMember === true && canCreateOrReport;
  const canCreateEventAction =
    canCreateTimelineEvents
    && (!isCommunityTimeline || canCreateCommunityEvents);
  const canManageHashtagSettings = isHashtagTimeline && (isSiteOwner || isSiteAdmin);
  const canManagePersonalAccessPanel = isPersonalTimeline && isCreator;
  const nonCommunityFabActions = useMemo(() => {
    const actions = [];

    if (canCreateEventAction) {
      actions.push({
        key: 'create',
        tooltip: 'Create Event',
        icon: <EventIcon />,
        onClick: () => {
          setEditingEvent(null);
          setDialogOpen(true);
          setFloatingButtonsExpanded(false);
        },
        size: 'medium',
        step: 56,
        accent: {
          dark: '#69F0AE',
          light: '#00CFA1',
        },
      });
    }

    if (canCreateOrReport && !timelineIsSafeguarded) {
      actions.push({
        key: 'report',
        tooltip: 'Report Timeline',
        icon: <OutlinedFlagIcon />,
        onClick: handleOpenTimelineReportDialog,
        size: 'medium',
        step: 56,
        accent: {
          dark: '#EF5350',
          light: '#D32F2F',
        },
      });
    }

    if (canManageHashtagSettings) {
      actions.push({
        key: 'hashtag-settings',
        tooltip: 'Hashtag Settings',
        icon: <SettingsIcon />,
        onClick: handleOpenHashtagSettings,
        size: 'medium',
        step: 56,
        accent: {
          dark: '#A5B4FC',
          light: '#4338CA',
        },
      });
    }

    if (canManagePersonalAccessPanel) {
      actions.push({
        key: 'personal-access-settings',
        tooltip: 'Personal Timeline Settings',
        icon: <SettingsIcon />,
        onClick: handleOpenAccessPanel,
        size: 'medium',
        step: 56,
        accent: {
          dark: '#A5B4FC',
          light: '#4338CA',
        },
      });
    }

    return actions;
  }, [
    canCreateEventAction,
    canCreateOrReport,
    canManageHashtagSettings,
    canManagePersonalAccessPanel,
    handleOpenAccessPanel,
    handleOpenHashtagSettings,
    handleOpenTimelineReportDialog,
    timelineIsSafeguarded,
  ]);
  const [isFollowingHashtag, setIsFollowingHashtag] = useState(false);
  const [hashtagFollowKind, setHashtagFollowKind] = useState('watch');
  const [isHashtagFollowLoading, setIsHashtagFollowLoading] = useState(false);
  const [isHashtagFollowUpdating, setIsHashtagFollowUpdating] = useState(false);
  const [creatorProfile, setCreatorProfile] = useState(null);
  const viewerCount = 1 + allowedViewers.length;
  const viewerLabel = `${viewerCount} viewer${viewerCount !== 1 ? 's' : ''}`;

  useEffect(() => {
    if (!user?.id) {
      setSiteRole(null);
      setIsSiteAdmin(false);
      return;
    }
    try {
      const passportKey = `user_passport_${user.id}`;
      const passport = JSON.parse(localStorage.getItem(passportKey) || '{}');
      setSiteRole(passport?.site_role || null);
      setIsSiteAdmin(Boolean(passport?.is_site_admin) || Number(user.id) === 1);
    } catch (error) {
      console.warn('[TimelineV3] Failed to parse passport data for site role checks:', error);
      setSiteRole(null);
      setIsSiteAdmin(Number(user.id) === 1);
    }
  }, [user]);

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
    const loadHashtagFollowStatus = async () => {
      if (!timelineId || timelineId === 'new') return;
      if (!isHashtagTimeline) {
        setIsFollowingHashtag(false);
        setHashtagFollowKind('watch');
        return;
      }
      if (!user) {
        setIsFollowingHashtag(false);
        setHashtagFollowKind('watch');
        return;
      }

      try {
        setIsHashtagFollowLoading(true);
        const status = await getTimelineFollowStatus(timelineId);
        setIsFollowingHashtag(Boolean(status?.is_following));
        setHashtagFollowKind(status?.follow_kind || 'watch');
      } catch (e) {
        console.error('[TimelineV3] Failed to load hashtag follow status:', e);
        setIsFollowingHashtag(false);
        setHashtagFollowKind('watch');
      } finally {
        setIsHashtagFollowLoading(false);
      }
    };

    loadHashtagFollowStatus();
  }, [timelineId, isHashtagTimeline, user]);

  useEffect(() => {
    if (isHashtagTimeline) {
      setAddEventAnchorEl(null);
    }
  }, [isHashtagTimeline]);

  const handleToggleHashtagFollow = useCallback(async () => {
    if (!timelineId || timelineId === 'new') return;
    if (!user) {
      setSnackbarMessage('Please log in to watch this hashtag timeline.');
      setSnackbarSeverity('info');
      setSnackbarOpen(true);
      return;
    }
    if (isHashtagFollowLoading || isHashtagFollowUpdating) return;

    try {
      setIsHashtagFollowUpdating(true);
      if (isFollowingHashtag) {
        await unfollowTimeline(timelineId);
        setIsFollowingHashtag(false);
        setHashtagFollowKind('watch');
        setSnackbarMessage('Removed from your watched hashtags.');
      } else {
        const response = await followTimeline(timelineId, 'watch');
        setIsFollowingHashtag(true);
        setHashtagFollowKind(response?.follow_kind || 'watch');
        setSnackbarMessage('Added to your watched hashtags.');
      }
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (e) {
      const message = e?.response?.data?.error || 'Failed to update hashtag watch status.';
      setSnackbarMessage(message);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setIsHashtagFollowUpdating(false);
    }
  }, [timelineId, user, isHashtagFollowLoading, isHashtagFollowUpdating, isFollowingHashtag]);

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
    const currentDate = pointA_currentTime || new Date();
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
      getCookie('it_access') || getCookie('access_token') || localStorage.getItem('access_token');
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
    if ((hookStatus === 'locked' || hookStatus === 'banned') || !timelineId || timelineId === 'new') return; // Respect locked/banned timelines and skip placeholder

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
            const response = await api.get(`/api/v1/events/by-timeline/${timelineId}`);
            setEvents(response.data?.data || []);
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
            
            // Complete the loading after a longer delay to ensure the UI settles
            setTimeout(() => {
              clearInterval(markerLoadingInterval);
              setLoadingProgress(100);
              setProgressiveLoadingState('complete');
            }, 2500); // Increased delay for markers and list to settle visually
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
  }, [timelineId, userInteracted, accessDenied, hookStatus, refreshTrigger]);

  // Fetch pending and reviewing reports to show "In Review" icon on event popups
  useEffect(() => {
    const fetchReviewingReports = async () => {
      if (!timelineId || timelineId === 'new' || !isAuthenticated) return;
      
      try {
        // Fetch both pending and reviewing statuses
        const [pendingResponse, reviewingResponse] = await Promise.all([
          listReports(timelineId, { status: 'pending' }),
          listReports(timelineId, { status: 'reviewing' })
        ]);
        // Extract event IDs from both pending and reviewing reports
        const pendingIds = (pendingResponse.items || []).map(report => report.event_id).filter(Boolean);
        const reviewingIds = (reviewingResponse.items || []).map(report => report.event_id).filter(Boolean);
        const eventIds = new Set([...pendingIds, ...reviewingIds]);
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
      // Only run if we're on the 'new' route
      if (routeId !== 'new') return;
      
      try {
        // Get timeline name from URL parameters
        const params = new URLSearchParams(window.location.search);
        const timelineName = params.get('name') || 'Timeline V3';
        
        // Use api utility which handles prefixes correctly
        const response = await api.post('/api/v1/timelines', {
          name: timelineName,
          description: `A new timeline created: ${timelineName}`,
          type: 'hashtag' // Default to hashtag type
        });
        const newTimelineId = response.data.id;
        setTimelineId(newTimelineId);
        
        // Navigate to the new timeline URL (replace history to avoid back button going to 'new')
        navigate(`/timeline-v3/${newTimelineId}`, { replace: true });
      } catch (error) {
        console.error('Error creating timeline:', error);
      }
    };
    
    createTimeline();
  }, [routeId, navigate]);

  const handleEventSubmit = async (eventData) => {
    try {
      if (editingEvent?.id) {
        // Filter to only fields accepted by backend patchSchema
        const allowedFields = [
          'title', 'description', 'content_json', 'event_date', 'raw_event_date',
          'url', 'url_title', 'url_description', 'url_image',
          'media_key', 'media_type', 'media_subtype', 'media_size', 'is_exact_user_time', 'edit_locked',
          // Allow description_append for tier B/C append-only edits
          'description_append',
          // Allow tags for tier C edits
          'tags', 'remove_association_ids'
        ];
        const patchPayload = {};
        for (const key of allowedFields) {
          if (Object.prototype.hasOwnProperty.call(eventData, key)) {
            patchPayload[key] = eventData[key];
          }
        }

        const response = await api.patch(`/api/v1/events/${editingEvent.id}`, patchPayload);

        const updatedEvent = response.data?.event || response.data;
        setEvents((prev) => {
          const updatedEvents = prev.map((evt) => (evt.id === updatedEvent.id ? updatedEvent : evt));
          const updatedIndex = updatedEvents.findIndex((evt) => evt.id === updatedEvent.id);
          setCurrentEventIndex(updatedIndex >= 0 ? updatedIndex : 0);
          return updatedEvents;
        });
        setSelectedEventId(updatedEvent.id);
        setDialogOpen(false);
        setEditingEvent(null);
        setSnackbarMessage('Event updated successfully');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
        return;
      }
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
      const normalizedTagKeys = new Set();

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
        // - Preserve spaces (do NOT auto-convert spaces to dashes)
        normalized = normalized.replace(/^#+/, '');
        normalized = normalized.replace(/_/g, ' ');
        normalized = normalized.replace(/\s+/g, ' ').trim();
        const key = normalized.toLowerCase();

        if (!normalizedTagKeys.has(key)) {
          normalizedTagKeys.add(key);
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
      const response = await api.post('/api/v1/events', {
        title: eventData.title,
        description: eventData.description,
        event_date: originalDate.toISOString(), // Use original date
        raw_event_date: rawDateString, // Add raw date string
        is_exact_user_time: true, // Flag to indicate this is a user-selected time
        type: eventData.type,
        url: eventData.url || null,
        url_title: eventData.url_title || null,
        url_description: eventData.url_description || null,
        url_image: eventData.url_image || null,
        // Media fields – only meaningful when type === 'media'.
        media_key: cloudinaryId || null,
        media_type: mediaType || null,
        media_subtype: mediaSubtype || null,
        media_size: eventData.media_size || 0,
        timeline_id: timelineId,
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
      console.error(editingEvent?.id ? 'Error updating event:' : 'Error creating event:', error);
      console.error('Error response:', error.response);
      console.error('Error request:', error.request);
      if (editingEvent?.id) {
        const responseData = error.response?.data || {};
        const violationMessage = Array.isArray(responseData.violations) && responseData.violations.length > 0
          ? `Edit blocked: ${responseData.violations.map((v) => v?.field).filter(Boolean).join(', ')}`
          : null;
        setSnackbarMessage(violationMessage || responseData.message || 'Failed to update event');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
        return;
      }
      setSubmitError(error.response?.data?.error || 'Failed to create event');
      throw error;
    }
  };

  const handleEventEdit = async (event) => {
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

    const eventId = event?.id;
    if (!eventId) {
      return;
    }

    try {
      // Use direct event endpoint (not timeline-scoped) to support editing tagged events from foreign timelines
      const response = await api.get(`/api/v1/events/${eventId}`);
      const canonicalEvent = response?.data;
      if (!canonicalEvent?.id) {
        setSnackbarMessage('Unable to open editor for this event');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
        return;
      }

      if (canonicalEvent?.edit_permissions && canonicalEvent.edit_permissions.can_edit === false) {
        setSnackbarMessage('You do not have permission to edit this event');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
        return;
      }

      setEditingEvent(canonicalEvent);
      setDialogOpen(true);
    } catch (editFetchError) {
      console.error('Error loading event for edit:', editFetchError);
      setSnackbarMessage('Failed to load event editor');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };
  
  // Add the missing handleEventDelete function
  const handleEventDelete = async (eventOrId) => {
    try {
      const resolvedEventId = typeof eventOrId === 'object' ? eventOrId?.id : eventOrId;
      if (!resolvedEventId) {
        throw new Error('Missing event id for deletion');
      }

      // Use api utility which handles prefixes correctly
      await api.delete(`/api/v1/timeline-v3/${timelineId}/events/${resolvedEventId}`);
      
      // Remove the deleted event from state
      const updatedEvents = events.filter(event => event.id !== resolvedEventId);
      setEvents(updatedEvents);
      
      // Clear selection if the deleted event was selected
      if (selectedEventId === resolvedEventId) {
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
        const hasPendingRequest = membershipStatus.status === 'pending';
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
    if (!user || isGuestUser) {
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
    
    // Use the hook's join function which has optimistic updates and BroadcastChannel sync
    const result = await joinFromHook();
    
    if (!result || result.success === false) {
      console.warn('Join request failed:', result);
      setJoinRequestStatus('error');
      setJoinSnackbarOpen(true);
      return;
    }
    
    // Update UI state for success
    setJoinRequestStatus('success');
    setJoinSnackbarOpen(true);
    
    // The hook's join function already refreshed and broadcast state
    // Just update local snackbar/message state based on the result
    const memberStatus = result.status || 'active';
    const isPending = memberStatus === 'pending';
    
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
        role: result.role || 'member',
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

  // Banned/locked checks take priority over loading skeleton — once useJoinStatus has
  // resolved with a definitive status, show the lock page immediately.
  if (!joinLoading && hookStatus === 'banned') {
    return (
      <React.Suspense fallback={<Box sx={{ minHeight: '100vh' }} />}>
        <BannedTimelineLock timelineName={timelineName || 'This Timeline'} />
      </React.Suspense>
    );
  }

  // Personal timeline lock behavior should mirror the community lock pattern.
  // useJoinStatus marks locked timelines with status === 'locked' when getTimelineDetails
  // returns a 403 for the current user. Treat that as the single source of truth.
  if (!joinLoading && hookStatus === 'locked') {
    return <PersonalTimelineLock username={routeUsername} slug={routeSlug} />;
  }

  const shouldShowInitialTimelineShell = Boolean(timelineId && timelineId !== 'new') && (joinLoading || isLoading);
  const shouldShowEventListShell = progressiveLoadingState === 'timeline' || progressiveLoadingState === 'events';

  // Prevent a brief flash of privileged timeline UI while access/membership is still resolving.
  // Mirrors the skeleton-first behavior used in members/admin surfaces.
  if (shouldShowInitialTimelineShell) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          px: { xs: 1.5, sm: 2 },
          py: 2,
        }}
      >
        <Box
          sx={{
            maxWidth: '100%',
            borderRadius: 2,
            border: `1px solid ${timelineSurfaces.shellBorder}`,
            background: timelineSurfaces.shell,
            ...(timelineSurfaces.shellBlur !== 'none' ? { backdropFilter: timelineSurfaces.shellBlur } : {}),
            boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
            p: { xs: 1.5, sm: 2 },
          }}
        >
          <Box
            sx={{
              height: 40,
              width: { xs: '72%', sm: 360 },
              borderRadius: 1,
              mb: 2,
              background: theme.palette.mode === 'dark'
                ? 'linear-gradient(90deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.16) 45%, rgba(255,255,255,0.06) 100%)'
                : 'linear-gradient(90deg, rgba(15,23,42,0.06) 0%, rgba(15,23,42,0.14) 45%, rgba(15,23,42,0.06) 100%)',
              backgroundSize: '200% 100%',
              animation: 'timeline-shell-shimmer 1.25s linear infinite',
              '@keyframes timeline-shell-shimmer': {
                '0%': { backgroundPosition: '200% 0' },
                '100%': { backgroundPosition: '-200% 0' },
              },
            }}
          />
          <Box
            sx={{
              minHeight: { xs: 300, sm: 360 },
              borderRadius: 1.5,
              border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(15,23,42,0.1)'}`,
              background: theme.palette.mode === 'dark'
                ? 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.07) 100%)'
                : 'linear-gradient(180deg, rgba(15,23,42,0.03) 0%, rgba(15,23,42,0.06) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CircularProgress size={28} />
          </Box>
        </Box>
      </Box>
    );
  }

  // Check if this is a private community timeline and user is not a member
  if (timeline_type === 'community' && visibility === 'private' && isMember === false && !isLoading) {
    return (
      <React.Suspense fallback={<Box sx={{ minHeight: '100vh' }} />}>
        <PrivateTimelineLock timelineName={timelineName} />
      </React.Suspense>
    );
  }

  // Check if user is blocked from this community timeline
  if (timeline_type === 'community' && isBlocked === true && !isLoading) {
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
      background: timelineSurfaces.shell,
      overflowX: 'hidden',
      borderRadius: '8px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
      border: `1px solid ${timelineSurfaces.shellBorder}`,
      ...(timelineSurfaces.shellBlur !== 'none' ? { backdropFilter: timelineSurfaces.shellBlur } : {}),
      position: 'relative',
      mb: 3
    }}>
      <Container maxWidth={false}>

        <Stack 
          direction="row" 
          spacing={2} 
          sx={{ 
            mb: 2, 
            alignItems: 'center', 
            justifyContent: 'space-between',
            width: '100%',
            flexWrap: 'nowrap',
            minWidth: 0
          }}
        >
          <Stack 
            direction="row" 
            spacing={1} 
            alignItems="center"
            sx={{ width: 'auto', flexWrap: 'nowrap', minWidth: 0, flexShrink: 1, flexGrow: 1 }}
          >
            <Box sx={{ color: theme.palette.primary.main, minWidth: 0, flexShrink: 1, flexGrow: 1, overflow: 'hidden' }}>
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
            <Box sx={{ position: 'relative', flexShrink: 0 }}>
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
                          alt={displayUsername(creatorProfile.username)}
                          sx={{
                            bgcolor: creatorProfile.avatar_url ? undefined : (creatorProfile.user_color || '#888'),
                            color: creatorProfile.avatar_url ? undefined : '#111',
                            fontWeight: 600,
                            fontSize: '0.8rem',
                          }}
                        >
                          {!creatorProfile.avatar_url ? displayUsername(creatorProfile.username || 'U')[0]?.toUpperCase() : null}
                        </Avatar>
                      }
                      label={`@${displayUsername(creatorProfile.username)}`}
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
              ) : (isHashtagTimeline && !isGuestUser) ? (
                <Button
                  onClick={handleToggleHashtagFollow}
                  variant={isFollowingHashtag ? 'outlined' : 'contained'}
                  disabled={isLoading || isHashtagFollowLoading || isHashtagFollowUpdating}
                  startIcon={
                    isHashtagFollowLoading || isHashtagFollowUpdating ? (
                      <CircularProgress size={16} color="inherit" />
                    ) : (
                      <VisibilityIcon />
                    )
                  }
                  sx={{
                    borderRadius: 2,
                    px: 2,
                    fontWeight: 700,
                    textTransform: 'none',
                    ...(isFollowingHashtag
                      ? {
                          borderColor: theme.palette.info.main,
                          color: theme.palette.info.main,
                          '&:hover': {
                            borderColor: theme.palette.info.dark,
                            backgroundColor:
                              theme.palette.mode === 'dark'
                                ? 'rgba(3, 169, 244, 0.12)'
                                : 'rgba(3, 169, 244, 0.08)',
                          },
                        }
                      : {
                          bgcolor: theme.palette.info.main,
                          color: '#fff',
                          '&:hover': {
                            bgcolor: theme.palette.info.dark,
                          },
                          boxShadow: 2,
                        }),
                  }}
                >
                  {isHashtagFollowLoading
                    ? 'Loading...'
                    : isFollowingHashtag
                    ? `Watching${hashtagFollowKind && hashtagFollowKind !== 'watch' ? ` (${hashtagFollowKind})` : ''}`
                    : 'Watch'}
                </Button>
              ) : (
                // Only show Add Event for non-personal, non-community timelines
                // and only after we've finished loading the basic timeline metadata.
                (!isLoading && !isPersonalTimeline && timeline_type !== 'community' && canCreateOrReport) ? (
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
                    {!isLoading && !canCreateOrReport ? 'Posting Restricted' : 'Loading...'}
                  </Button>
                )
              )}
              {/* Only show the add-event menu when event creation is allowed on this timeline */}
              {!isHashtagTimeline && timeline_type !== 'community' && canCreateTimelineEvents && (
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
                  background: theme.palette.mode === 'dark' 
                    ? 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)'
                    : 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                  color: 'white',
                  border: theme.palette.mode === 'dark' ? '1px solid rgba(147, 197, 253, 0.4)' : '1px solid rgba(255, 255, 255, 0.25)',
                  borderRadius: 2.25,
                  px: { xs: 0, sm: 2.5 },
                  py: 0.75,
                  width: { xs: '36px', sm: 'auto' },
                  height: { xs: '36px', sm: 'auto' },
                  minWidth: { xs: '36px', sm: 'auto' },
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: theme.palette.mode === 'dark' ? '0 4px 14px rgba(59, 130, 246, 0.25)' : '0 4px 12px rgba(37, 99, 235, 0.15)',
                  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: theme.palette.mode === 'dark' ? '0 8px 24px rgba(59, 130, 246, 0.45)' : '0 8px 20px rgba(37, 99, 235, 0.3)',
                    filter: 'brightness(1.08)'
                  }
                }}
              >
                <MyLocationIcon sx={{ fontSize: '0.9rem', mr: { xs: 0, sm: 1 } }} />
                <Box component="span" sx={{ display: { xs: 'none', sm: 'none', md: 'inline' } }}>
                  Back to Present
                </Box>
                <Box component="span" sx={{ display: { xs: 'none', sm: 'inline', md: 'none' } }}>
                  Present
                </Box>
              </Button>
            </Fade>
          </Stack>
          <PersonalAccessPanel
            open={accessPanelOpen}
            onClose={handleCloseAccessPanel}
            user={user}
            allowedViewers={allowedViewers}
            newViewerUsername={newViewerUsername}
            setNewViewerUsername={setNewViewerUsername}
            viewerError={viewerError}
            onAddViewer={handleAddViewer}
            onRemoveViewer={handleRemoveViewer}
            timelineId={timelineId}
            timelineType={timeline_type}
            timelineDescription={timelineDescription}
            setTimelineDescription={setTimelineDescription}
            coverPortraitUrl={coverPortraitUrl}
            setCoverPortraitUrl={setCoverPortraitUrl}
            coverPortraitPosition={coverPortraitPosition}
            setCoverPortraitPosition={setCoverPortraitPosition}
            coverPortraitZoom={coverPortraitZoom}
            setCoverPortraitZoom={setCoverPortraitZoom}
            coverLandscapeUrl={coverLandscapeUrl}
            setCoverLandscapeUrl={setCoverLandscapeUrl}
            coverLandscapePosition={coverLandscapePosition}
            setCoverLandscapePosition={setCoverLandscapePosition}
            coverLandscapeZoom={coverLandscapeZoom}
            setCoverLandscapeZoom={setCoverLandscapeZoom}
            onNotify={handleAccessPanelNotice}
          />

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
            background: timelineSurfaces.tool,
            borderRadius: 2,
            boxShadow: 1,
            border: `1px solid ${timelineSurfaces.toolBorder}`,
            backdropFilter: timelineSurfaces.toolBlur,
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
                background: timelineSurfaces.glass,
                border: `1px solid ${timelineSurfaces.glassBorder}`,
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
                  background: timelineSurfaces.panel,
                  border: `1px solid ${timelineSurfaces.panelBorder}`,
                  backdropFilter: timelineSurfaces.panelBlur,
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
                referenceDate={pointA_currentTime}
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
                      disableSelectedPulse={false}
                      showMarkerLine={true}
                      showVoteDot={true}
                      onDelete={handleEventDelete}
                      onEdit={handleEventEdit}
                      voteDot={voteDotsById[selectedVisibleEvent.id] || null}
                      voteDotsLoading={voteDotsLoading}
                      workspaceWidth={timelineWorkspaceBounds?.width}
                      referenceDate={pointA_currentTime}
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
          
        </Box>

        {/* Unified Timeline Navigation & View Controls Row */}
        {/* Unified Timeline Navigation & View Controls Row */}
        <Stack
          direction="row"
          spacing={2}
          alignItems="center"
          justifyContent="center"
          sx={{ mt: 2, mb: 2, width: '100%' }}
        >
          {/* Left Hooked - Tiny navigation button for desktop */}
          <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
            <Button
              size="small"
              onClick={handleLeft}
              sx={{
                minWidth: 'auto',
                px: 1.5,
                py: 0.5,
                background: timelineSurfaces.tool,
                border: `1px solid ${timelineSurfaces.toolBorder}`,
                color: theme.palette.text.secondary,
                fontWeight: 'bold',
                fontSize: '0.75rem',
                '&:hover': {
                  background: timelineSurfaces.glassHover,
                }
              }}
            >
              ◀ LEFT
            </Button>
          </Box>

          {/* Center Group: EventCounter + View Mode Buttons (always on the same row, never stack!) */}
          <Stack 
            direction="row"
            spacing={{ xs: 1.5, sm: 3 }}
            alignItems="center"
            justifyContent="center"
            sx={{ flexGrow: 1, width: 'auto', flexWrap: 'nowrap' }}
          >
            {/* Event Counter */}
            {(() => {
              // Compute filtered events for EventCounter (memoized inline)
              const filteredEventsForCounter = isSettled ? events.filter(event => {
                // Apply the same filtering logic as in EventList
                if (viewMode === 'position') {
                  if (selectedType) {
                    const eventType = (event.type || '').toLowerCase();
                    return eventType === selectedType.toLowerCase();
                  }
                  return true;
                }
                
                if (!event.event_date) return false;
                
                const currentDate = getCurrentTimeReference();
                let startDate, endDate;
                
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
                    if (Date.now() < userSelectionLockUntilRef.current) {
                      return;
                    }
                    
                    const event = filteredEventsForCounter[index];
                    if (!event) return;
                    
                    setCurrentEventIndex(index);
                    setSelectedEventId(event.id);
                    setShouldScrollToEvent(false);
                    
                    if (event.event_date && viewMode !== 'position') {
                      const markerValue = calculateEventMarkerPosition(event, viewMode);
                      activatePointB(markerValue, new Date(event.event_date), viewMode, event.id, false, 0);
                    }
                  }}
                  onDotClick={handleCarouselPopupOpen}
                  onEdit={handleEventEdit}
                  onDelete={handleEventDelete}
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

            {/* View Mode Buttons */}
            <Stack 
              direction="row" 
              spacing={{ xs: 0.5, sm: 1 }} 
              alignItems="center"
              justifyContent="center"
            >
              <Button
                variant={viewMode === 'day' ? "contained" : "outlined"}
                size="small"
                onClick={() => handleViewModeTransition(viewMode === 'day' ? 'position' : 'day')}
                disabled={isViewTransitioning}
                sx={{ fontSize: { xs: '0.75rem', sm: '0.8125rem' }, minWidth: { xs: '45px', sm: '64px' } }}
              >
                Day
              </Button>
              <Button
                variant={viewMode === 'week' ? "contained" : "outlined"}
                size="small"
                onClick={() => handleViewModeTransition(viewMode === 'week' ? 'position' : 'week')}
                disabled={isViewTransitioning}
                sx={{ fontSize: { xs: '0.75rem', sm: '0.8125rem' }, minWidth: { xs: '45px', sm: '64px' } }}
              >
                Week
              </Button>
              <Button
                variant={viewMode === 'month' ? "contained" : "outlined"}
                size="small"
                onClick={() => handleViewModeTransition(viewMode === 'month' ? 'position' : 'month')}
                disabled={isViewTransitioning}
                sx={{ fontSize: { xs: '0.75rem', sm: '0.8125rem' }, minWidth: { xs: '45px', sm: '64px' } }}
              >
                Month
              </Button>
              <Button
                variant={viewMode === 'year' ? "contained" : "outlined"}
                size="small"
                onClick={() => handleViewModeTransition(viewMode === 'year' ? 'position' : 'year')}
                disabled={isViewTransitioning}
                sx={{ fontSize: { xs: '0.75rem', sm: '0.8125rem' }, minWidth: { xs: '45px', sm: '64px' } }}
              >
                Year
              </Button>
            </Stack>
          </Stack>

          {/* Right Hooked - Tiny navigation button for desktop */}
          <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
            <Button
              size="small"
              onClick={handleRight}
              sx={{
                minWidth: 'auto',
                px: 1.5,
                py: 0.5,
                background: timelineSurfaces.tool,
                border: `1px solid ${timelineSurfaces.toolBorder}`,
                color: theme.palette.text.secondary,
                fontWeight: 'bold',
                fontSize: '0.75rem',
                '&:hover': {
                  background: timelineSurfaces.glassHover,
                }
              }}
            >
              RIGHT ▶
            </Button>
          </Box>
        </Stack>
      </Container>

      {/* Timeline Hero Banner - Positioned below visualization and above EventList */}
      {(timeline_type === 'community' || ((timeline_type === 'personal' || timeline_type === 'hashtag') && coverLandscapeUrl)) && (
        <Container maxWidth={false}>
          <TimelineHeroBanner
            timelineName={timelineName}
            timelineType={timeline_type}
            coverImageUrl={coverLandscapeUrl}
            coverLandscapeX={coverLandscapePosition.x}
            coverLandscapeY={coverLandscapePosition.y}
            coverZoom={coverLandscapeZoom}
            coverUploadEnabled={coverUploadEnabled}
            isLoading={isLoading}
          />
        </Container>
      )}

      {/* Visual Separator */}
      <Box sx={{ height: 24 }} />
      
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
        
        {/* Event List shell for initial timeline stage to avoid abrupt list pop-in */}
        {shouldShowEventListShell ? (
          <Box
            sx={{
              px: { xs: 1, sm: 0.5 },
              pb: 1,
              transform: 'scale(0.995)',
              transformOrigin: 'top center',
              transition: 'transform 320ms ease, opacity 320ms ease',
              opacity: 0.92,
            }}
          >
            <Box
              sx={{
                mb: 1.5,
                borderRadius: 2,
                border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(15,23,42,0.1)'}`,
                background: theme.palette.mode === 'dark'
                  ? 'linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.06) 100%)'
                  : 'linear-gradient(180deg, rgba(15,23,42,0.03) 0%, rgba(15,23,42,0.05) 100%)',
                p: 1.5,
              }}
            >
              <Skeleton variant="text" width="34%" height={26} sx={{ mb: 0.5 }} />
              <Skeleton variant="text" width="22%" height={20} />
            </Box>
            {Array.from({ length: 4 }).map((_, idx) => (
              <Box
                key={`event-list-shell-row-${idx}`}
                sx={{
                  mb: 1.2,
                  borderRadius: 2,
                  border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(15,23,42,0.08)'}`,
                  background: theme.palette.mode === 'dark'
                    ? 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.06) 100%)'
                    : 'linear-gradient(180deg, rgba(15,23,42,0.025) 0%, rgba(15,23,42,0.045) 100%)',
                  p: 1.5,
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1.5, alignItems: 'center' }}>
                  <Skeleton variant="text" width="56%" height={24} />
                  <Skeleton variant="rounded" width={86} height={22} />
                </Box>
                <Skeleton variant="text" width="76%" height={20} />
                <Skeleton variant="text" width="68%" height={20} />
              </Box>
            ))}
          </Box>
        ) : (
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
            timelineType={timeline_type}
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

      <Dialog
        open={timelineReportDialogOpen}
        onClose={handleCloseTimelineReportDialog}
        fullWidth
        maxWidth="sm"
        PaperProps={{ sx: getGlassDialogPaperSx(theme) }}
      >
        <DialogTitle>Report Timeline</DialogTitle>
        <DialogContent sx={{ '& .MuiTextField-root': getGlassInputSx(theme) }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            This report creates a moderation ticket for Site Control.
          </Typography>
          <TextField
            select
            fullWidth
            margin="dense"
            label="Category"
            value={timelineReportCategory}
            onChange={(e) => setTimelineReportCategory(e.target.value)}
          >
            <MenuItem value="">Select a category</MenuItem>
            <MenuItem value="website_policy">Website Policy</MenuItem>
            <MenuItem value="government_policy">Government Policy</MenuItem>
            <MenuItem value="unethical_boundary">Unethical Boundary</MenuItem>
          </TextField>
          <TextField
            fullWidth
            margin="dense"
            multiline
            minRows={3}
            label="Reason (optional details)"
            value={timelineReportReason}
            onChange={(e) => setTimelineReportReason(e.target.value)}
            placeholder="Add context for moderators"
            sx={{ mt: 1.5 }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button
            onClick={handleCloseTimelineReportDialog}
            disabled={timelineReportSubmitting}
            variant="contained"
            sx={{
              ...getGlassSquareActionButtonSx(theme),
              width: 'auto',
              minWidth: 84,
              px: 2,
              borderRadius: 1.4,
              bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(15,23,42,0.06)',
              color: theme.palette.text.primary,
              '&:hover': {
                bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(15,23,42,0.12)',
              }
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmitTimelineReport}
            variant="outlined"
            disabled={timelineReportSubmitting || !timelineReportCategory}
            sx={{
              ...getGlassPillActionButtonSx(theme),
              borderColor: 'error.main',
              color: 'error.main',
              '&:hover': {
                borderColor: 'error.dark',
                bgcolor: alpha('#ef4444', 0.1),
              }
            }}
          >
            {timelineReportSubmitting ? 'Submitting...' : 'Submit Report'}
          </Button>
        </DialogActions>
      </Dialog>

      <HashtagSettingsDialog
        open={hashtagSettingsOpen}
        onClose={handleCloseHashtagSettings}
        timelineId={timelineId}
        timelineName={timelineName}
        timelineType={timeline_type}
        initialDescription={timelineDescription}
        initialCoverPortraitUrl={coverPortraitUrl}
        initialCoverPortraitPosition={coverPortraitPosition}
        initialCoverPortraitZoom={coverPortraitZoom}
        initialCoverLandscapeUrl={coverLandscapeUrl}
        initialCoverLandscapePosition={coverLandscapePosition}
        initialCoverLandscapeZoom={coverLandscapeZoom}
        onSaved={handleHashtagSettingsSaved}
        onNotify={handleAccessPanelNotice}
      />

      {/* Animated Floating Action Buttons */}
      {!shouldBlur && (
        <Box sx={{ position: 'fixed', right: 32, bottom: 32, display: 'flex', flexDirection: 'column', gap: 2, zIndex: 1500 }}>
        {timeline_type === 'community' && canOpenCommunityActionFab ? (
          <NavFab
            timelineId={timelineId}
            pathname={location.pathname}
            expanded={floatingButtonsExpanded}
            onToggleExpanded={() => setFloatingButtonsExpanded((prev) => !prev)}
            onCollapse={() => setFloatingButtonsExpanded(false)}
            onNavigate={handleCommunityNavigate}
            showReport={!isGuestUser && !timelineIsSafeguarded}
            onReport={handleOpenTimelineReportDialog}
            showCreate={canCreateEventAction}
            showMembersNav={isMember === true}
            showAdminNav={['moderator', 'admin', 'creator', 'siteowner'].includes(normalizedCommunityRole)}
            onCreate={() => {
              setEditingEvent(null);
              setDialogOpen(true);
              setFloatingButtonsExpanded(false);
            }}
            createEmphasis
          />
        ) : null}
        {showShareTradingCard ? (
          <TradingCard
            onActivate={handleShareCardClick}
            frameSx={{
              position: 'absolute',
              right: { xs: 70, sm: 82 },
              bottom: 0,
              boxShadow: floatingButtonsExpanded
                ? '0 18px 40px rgba(15,23,42,0.35), 0 0 0 1px rgba(148,163,184,0.45)'
                : '0 10px 24px rgba(15,23,42,0.18)',
              transform: floatingButtonsExpanded
                ? 'translateX(0) translateY(-6px) scale(1)'
                : 'translateX(26px) translateY(6px) scale(0.92)',
              opacity: floatingButtonsExpanded ? 1 : 0,
              pointerEvents: floatingButtonsExpanded ? 'auto' : 'none',
              transition: 'transform 0.5s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.25s ease',
              transitionDelay: floatingButtonsExpanded ? '0.24s' : '0s',
              zIndex: 1490,
              '&:hover .share-card-overlay': {
                opacity: 1,
              },
              '&:hover .share-card-image': {
                filter: coverUploadEnabled
                  ? 'brightness(0.88) saturate(1.02)'
                  : 'blur(18px) saturate(0.45)',
              },
            }}
            imageUrl={coverPortraitUrl}
            imageAlt={`${shareCardTitle} portrait cover`}
            imageClassName="share-card-image"
            imageSx={{
              objectFit: shareCardImageObjectFit,
              filter: coverUploadEnabled
                ? 'brightness(1.08) saturate(1.08)'
                : 'blur(18px) saturate(0.45)',
              transform: buildCoverPortraitTransform(
                coverPortraitPosition,
                coverPortraitZoom,
                coverUploadEnabled
              ),
            }}
            fallbackClassName="share-card-image"
            fallbackSx={{ background: communityFallbackGradient }}
            label={shareCardLabel}
            title={shareCardTitle}
            qrUrl={shareQrUrl}
            overlayClassName="share-card-overlay"
            overlayText="Tap to Share"
            isRestricted={timeline_type === 'personal' && (creatorProfile?.is_restricted || creatorProfile?.is_suspended)}
          />
        ) : null}
        {timeline_type !== 'community' && !isGuestUser ? (
          <NavFab
            pathname={location.pathname}
            expanded={floatingButtonsExpanded}
            onToggleExpanded={() => setFloatingButtonsExpanded((prev) => !prev)}
            onCollapse={() => setFloatingButtonsExpanded(false)}
            actions={nonCommunityFabActions}
            showMainFab
            mainFabDisabled={!canCreateOrReport && !canManageHashtagSettings && !canManagePersonalAccessPanel}
            mainTooltipClosed="Show Options"
            mainTooltipOpen="Hide Options"
            mainTooltipDisabled="Posting Restricted"
            enableClickAway={false}
          />
        ) : null}
        
        {/* Conditional rendering based on timeline type and membership status */}
        {timeline_type === 'community'
          ? (
              isPendingApproval ? (
                // Show "Request Sent!" FAB for pending members
                <Tooltip title="Request Pending Approval">
                  <span>
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
                  </span>
                </Tooltip>
              ) : (!isGuestUser && !isMember && !joinRequestSent && !joinLoading && !isBlocked) 
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
                : null
            )
          : null}
        </Box>
      )}
      
      {/* Snackbar for event actions */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity={snackbarSeverity}
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>

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
