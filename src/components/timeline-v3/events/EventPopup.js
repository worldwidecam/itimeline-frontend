import { getGlassDialogPaperSx, getGlassInputSx, getGlassSquareActionButtonSx, getGlassPillActionButtonSx } from '../../../utils/formStyleGuide';
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link as RouterLink } from 'react-router-dom';
import ImageEventPopup from './ImageEventPopup';
import VideoEventPopup from './VideoEventPopup';
import NewsEventPopup from './NewsEventPopup';
import CreatorChip from './CreatorChip';
import VoteControls from './VoteControls';
import AudioMediaPopup from './AudioMediaPopup';
import AudioWaveformVisualizer from '../../../components/AudioWaveformVisualizer';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Typography,
  Box,
  useTheme,
  Paper,
  Divider,
  Snackbar,
  Alert,
  Chip,
  TextField,
  Autocomplete,
  Button,
  CircularProgress,
  Link,
  Avatar,
  Menu,
  ListItemIcon,
  ListItemText,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText
} from '@mui/material';
import {
  Close as CloseIcon,
  Comment as RemarkIcon,
  Newspaper as NewsIcon,
  Movie as MediaIcon,
  Person as PersonIcon,
  Event as EventIcon,
  AccessTime as AccessTimeIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  MoreHoriz as MoreHorizIcon,
  RateReview as RateReviewIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import { EVENT_TYPES, EVENT_TYPE_COLORS } from './EventTypes';
import { useAuth } from '../../../contexts/AuthContext';
import api from '../../../utils/api';
import PopupTimelineLanes from './PopupTimelineLanes';
import { submitReport } from '../../../utils/api';
import config from '../../../config';
import { useEventVote } from '../../../hooks/useEventVote';
import RichContentRenderer from './RichContentRenderer';

/**
 * EventPopup - A component that displays event details in a popup dialog
 * Features specialized layouts for different media types:
 * - For image media: Uses ImageEventPopup with two-container layout
 * - For video media: Uses VideoEventPopup with two-container layout
 * - For other types: Uses standard popup layout
 * 
 * When open, it signals to TimelineV3 to pause its refresh interval to prevent
 * disruptions to media playback.
 */

// Centralized media URL normalization helper
const normalizeMediaUrl = (url) => {
  if (!url) return '';
  const trimmed = String(url).trim();
  if (!trimmed) return '';

  // 1. If it's already a full HTTP(S) URL
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    // Specialized handling for R2/Cloudinary if needed, but usually these are fine as-is
    return trimmed;
  }

  // 2. Handle Cloudinary/R2 shorthand or relative paths
  const baseUrl = config.API_URL?.endsWith('/') 
    ? config.API_URL.slice(0, -1) 
    : (config.API_URL || '');

  // If it starts with /uploads, /media, etc., prepend API_URL
  if (trimmed.startsWith('/')) {
    return `${baseUrl}${trimmed}`;
  }

  // Fallback for other relative paths
  return `${baseUrl}/${trimmed}`;
};

// Helper to normalize associated timelines by type
const normalizeAssociatedTimelines = (associatedTimelines = [], removedIds = []) => {
  const removedSet = new Set(removedIds || []);
  const communities = [];
  const personals = [];

  associatedTimelines.forEach((tl) => {
    if (!tl || !tl.id) return;
    if (removedSet.has(tl.id)) return;
    const type = (tl.type || tl.timeline_type || 'hashtag').toLowerCase();
    const name = tl.name || '';
    if (!name) return;
    if (type === 'community') {
      communities.push(tl);
    } else if (type === 'personal') {
      personals.push(tl);
    }
  });

  return { communities, personals };
};

const EMPTY_REVIEWING_EVENT_IDS = new Set();

const EventPopup = ({
  event,
  open,
  onClose,
  onDelete,
  onEdit,
  setIsPopupOpen,
  reviewingEventIds,
  timelineType = 'hashtag',
  hideActionMenu = false, // Hide ellipsis menu (for admin page view)
}) => {
  const theme = useTheme();
  const location = useLocation();
  const { user, isGuest } = useAuth();
  const effectiveReviewingEventIds = React.useMemo(
    () => (reviewingEventIds instanceof Set ? reviewingEventIds : EMPTY_REVIEWING_EVENT_IDS),
    [reviewingEventIds]
  );
  const [isInReview, setIsInReview] = useState(false);
  const [isSafeguarded, setIsSafeguarded] = useState(Boolean(event?.is_safeguarded));
  const {
    value: voteValue,
    totalVotes,
    positiveRatio,
    isLoading: voteLoading,
    error: voteError,
    handleVoteChange,
  } = useEventVote(event?.id, { enabled: open });
  
  // Fetch reviewing and safeguarded status when popup opens
  useEffect(() => {
    const checkReportStatus = async () => {
      if (!open || !event?.id) {
        setIsInReview(false);
        setIsSafeguarded(false);
        return;
      }

      if (isGuest) {
        setIsInReview(false);
        setIsSafeguarded(false);
        return;
      }
      
      // First check if reviewingEventIds prop is provided (from TimelineV3 for mods)
      if (effectiveReviewingEventIds.size > 0) {
        setIsInReview(effectiveReviewingEventIds.has(event.id));
      }
      
      // Use public endpoint to check report status (works for all authenticated users)
      try {
        const response = await api.get(`/api/v1/events/${event.id}/report-status`);
        const data = response.data;
        
        // Set status from public endpoint
        setIsInReview(data.in_review || false);
        setIsSafeguarded(data.safeguarded || false);
      } catch (error) {
        // Silently fail - endpoint might not exist yet or user not authenticated
        // Keep isInReview from reviewingEventIds prop if available
        if (effectiveReviewingEventIds.size === 0) {
          setIsInReview(false);
        }
        setIsSafeguarded(false);
      }
    };
    
    checkReportStatus();
  }, [open, event?.id, effectiveReviewingEventIds, isGuest]);
  
  // Notify TimelineV3 when the popup opens or closes to pause/resume refresh
  useEffect(() => {
    // Only update if setIsPopupOpen function is provided
    if (setIsPopupOpen && typeof setIsPopupOpen === 'function') {
      setIsPopupOpen(open);
    }
    
    // Cleanup when component unmounts
    return () => {
      if (setIsPopupOpen && typeof setIsPopupOpen === 'function') {
        setIsPopupOpen(false);
      }
    };
  }, [open, setIsPopupOpen]);
  
  // State for timeline addition functionality
  const [existingTimelines, setExistingTimelines] = useState([]);
  const [selectedTimeline, setSelectedTimeline] = useState(null);
  const [loadingTimelines, setLoadingTimelines] = useState(false);
  const [addingToTimeline, setAddingToTimeline] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [tagSectionExpanded, setTagSectionExpanded] = useState(false);
  // Independent selections per lane
  const [selectedHashtag, setSelectedHashtag] = useState(null);
  const [selectedCommunity, setSelectedCommunity] = useState(null);
  const [selectedPersonal, setSelectedPersonal] = useState(null);
  const [hasAcknowledgedPrivacyWarning, setHasAcknowledgedPrivacyWarning] = useState(false);
  // Passport memberships for filtering lane options
  const [passportMemberships, setPassportMemberships] = useState([]);
  // Store the updated event data after adding a tag
  const [localEventData, setLocalEventData] = useState(null);
  // Level 1 report overlay state
  const [reportOpen, setReportOpen] = useState(false);
  const [actionAnchorEl, setActionAnchorEl] = useState(null);
  const [reportReason, setReportReason] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportedOnce, setReportedOnce] = useState(false);
  const [reportCategory, setReportCategory] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  // Reference to the audio visualizer for controlling playback
  const audioVisualizerRef = useRef(null);
  
  // Default fallback values for when event data is incomplete
  const defaultColor = theme.palette.primary.main;
  const defaultDarkColor = theme.palette.primary.dark;
  
  // Safely determine the event type with multiple fallbacks
  let safeEventType = EVENT_TYPES.REMARK; // Default fallback
  
  if (event && typeof event === 'object') {
    // Try to normalize the event type
    const rawType = event.type || '';
    const normalizedType = typeof rawType === 'string' ? rawType.toLowerCase() : '';
    
    // Check if it's one of our known types
    if (Object.values(EVENT_TYPES).includes(normalizedType)) {
      safeEventType = normalizedType;
    }
  }
  
  // Determine the color to use for the event
  const color = event?.color || EVENT_TYPE_COLORS[safeEventType] || defaultColor;
  const darkColor = event?.dark_color || EVENT_TYPE_COLORS[`${safeEventType}_dark`] || defaultDarkColor;
  
  // Specific remark color for the creator chip
  const remarkColor = '#2196f3'; // Blue color for remark events
  
  // Get user data with fallbacks
  const getUserData = () => {
    // First try to get from created_by object (nested)
    if (event.created_by && typeof event.created_by === 'object') {
      return {
        id: event.created_by.id || event.created_by_id || event.created_by,
        username: event.created_by.username || event.created_by_username || 'Unknown User',
        avatar: event.created_by.avatar_url || event.created_by_avatar || null,
        user_color: event.created_by.user_color || event.created_by_user_color || null,
        is_restricted: event.created_by.is_restricted || event.created_by_is_restricted || false,
        is_avatar_blurred: event.created_by.is_avatar_blurred || event.created_by_is_avatar_blurred || false
      };
    }
    // Then try direct properties (flattened)
    return {
      id: event.created_by || event.created_by_id || 'unknown',
      username: event.created_by_username || 'Unknown User',
      avatar: event.created_by_avatar || null,
      user_color: event.created_by_user_color || null,
      is_restricted: event.created_by_is_restricted || false,
      is_avatar_blurred: event.is_avatar_blurred || event.created_by_is_avatar_blurred || false
    };
  };
  
  const userData = getUserData();
  
  // Safely determine the icon with fallback
  let TypeIcon = RemarkIcon; // Default fallback
  try {
    const iconMap = {
      [EVENT_TYPES.REMARK]: RemarkIcon,
      [EVENT_TYPES.NEWS]: NewsIcon,
      [EVENT_TYPES.MEDIA]: MediaIcon,
    };
    TypeIcon = iconMap[safeEventType] || RemarkIcon;
  } catch (error) {
    console.error('Error getting event icon:', error);
    // Use default icon as fallback
  }
  
  // Ensure we have a valid onClose handler
  const handleClose = (event, reason) => {
    // Always close the dialog, even if onClose is not provided
    if (typeof onClose === 'function') {
      onClose();
    }
  };
  
  // Direct close function for the X button
  const handleCloseButtonClick = () => {
    // Force close the dialog
    if (typeof onClose === 'function') {
      onClose();
    }
  };

  const formatDate = (dateStr) => {
    try {
      if (!dateStr) return 'Invalid date';
      
      // Parse the ISO string into a Date object
      const date = parseISO(dateStr);
      
      // Format with "Published on" prefix, without seconds
      return `Published on ${format(date, 'MMM d, yyyy, h:mm a')}`;
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  const formatEventDate = (dateStr) => {
    try {
      if (!dateStr) return 'Invalid date';
      
      // Parse the ISO string into a Date object
      const date = parseISO(dateStr);
      
      // Format event date without "Published on" prefix
      return format(date, 'MMM d, yyyy, h:mm a');
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };
  
  // Handle snackbar close
  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') return;
    setSnackbarOpen(false);
  };

  // Derive timelineId from URL or event payload as fallback
  const deriveTimelineId = () => {
    try {
      // Support both /timeline/123 and /timeline-v3/123
      const matchV3 = location?.pathname?.match(/timeline-v3\/(\d+)/);
      if (matchV3 && matchV3[1]) return Number(matchV3[1]);
      const match = location?.pathname?.match(/timeline\/(\d+)/);
      if (match && match[1]) return Number(match[1]);
    } catch (_) {}
    return event?.timeline_id || event?.timelineId || null;
  };

  const handleOpenReport = () => {
    if (isGuest) return;
    setReportReason('');
    setReportCategory('');
    setReportOpen(true);
  };

  const handleOpenDelete = () => {
    setDeleteDialogOpen(true);
  };

  const handleCloseDelete = () => {
    setDeleteDialogOpen(false);
  };

  const handleActionMenuOpen = (event) => {
    if (isGuest) return;
    event.stopPropagation();
    setActionAnchorEl(event.currentTarget);
  };

  const handleActionMenuClose = () => {
    setActionAnchorEl(null);
  };

  const handleEdit = () => {
    if (typeof onEdit !== 'function' || !event) return;
    onEdit(event);
    handleActionMenuClose();
    if (typeof onClose === 'function') {
      onClose();
    }
  };

  const handleConfirmDelete = async () => {
    if (!onDelete || !event) return;
    await onDelete(event);
    setDeleteDialogOpen(false);
    if (typeof onClose === 'function') {
      onClose();
    }
  };

  const handleCloseReport = () => {
    if (reportSubmitting) return;
    setReportOpen(false);
  };

  const handleSubmitReport = async () => {
    const timelineId = deriveTimelineId();
    if (!timelineId || !event?.id) {
      setSuccess('');
      setError('Unable to submit report: missing timeline or event id');
      setSnackbarOpen(true);
      return;
    }
    if (!reportCategory) {
      return;
    }
    try {
      setReportSubmitting(true);
      setError('');
      const resp = await submitReport(timelineId, event.id, reportReason || '', reportCategory);
      setSuccess('Report submitted');
      setSnackbarOpen(true);
      setReportedOnce(true);
      setReportOpen(false);
    } catch (e) {
      const msg = e?.response?.data?.error || e.message || 'Failed to submit report';
      setError(msg);
      setSuccess('');
      setSnackbarOpen(true);
    } finally {
      setReportSubmitting(false);
    }
  };
  
  // Function to fetch existing timelines
  const fetchExistingTimelines = async () => {
    try {
      setLoadingTimelines(true);
      setError('');
      
      // Call the API to get all existing timelines
      const response = await api.get('/api/v1/timelines');
      setExistingTimelines(response.data?.data || []);
    } catch (error) {
      console.error('Error fetching timelines:', error);
      setError('Failed to load timelines. Please try again.');
    } finally {
      setLoadingTimelines(false);
    }
  };

  // Function to fetch passport memberships for filtering communities and personals
  const fetchPassportMemberships = async () => {
    try {
      const response = await api.get('/api/v1/user/passport');
      console.log('[EventPopup] Passport response:', response.data);
      // The API returns { memberships: [...], last_updated: ... }
      setPassportMemberships(response.data?.memberships || []);
    } catch (error) {
      console.error('Error fetching passport memberships:', error);
      // Don't set error state here as this is a background operation
    }
  };
  
  // Fetch timelines when popup opens
  useEffect(() => {
    if (open && existingTimelines.length === 0) {
      fetchExistingTimelines();
    }
  }, [open]);

  // Load passport memberships when popup opens
  useEffect(() => {
    const loadPassport = async () => {
      try {
        await fetchPassportMemberships();
      } catch (e) {
        console.warn('Failed to load passport memberships for popup lanes', e);
      }
    };
    if (open && !isGuest) {
      loadPassport();
    }
  }, [open, isGuest]);

  // Function to add the event to the selected timeline (per-lane)
  const handleAddToTimeline = async (selectedTimeline) => {
    if (!selectedTimeline || !event) return;

    try {
      setAddingToTimeline(true);
      setError('');
      
      // Check if the event is already in the timeline using modern events endpoint
      const checkResponse = await api.get(`/api/v1/events/by-timeline/${selectedTimeline.id}`);
      const timelineEvents = checkResponse.data?.data || [];
      
      // Check if this event already exists in the selected timeline
      const eventExists = timelineEvents.some(timelineEvent => timelineEvent.id === event.id);
      
      if (eventExists) {
        setError(`This event is already in the "${selectedTimeline.name}" timeline.`);
        setAddingToTimeline(false);
        return;
      }
      
      // Share the event to the timeline using modern shares endpoint
      const addResponse = await api.post(`/api/v1/events/${event.id}/shares`, { timeline_id: selectedTimeline.id });
      console.log('[EventPopup] Add event response:', addResponse.data);
      
      // Update the local event data to reflect new associations under V2 rules
      const updatedEvent = { ...(localEventData || event) };

      const timelineType = (selectedTimeline.timeline_type || selectedTimeline.type || 'hashtag').toLowerCase();

      // Ensure associated_timelines reflects the new listing
      const assoc = (updatedEvent.associated_timelines || event.associated_timelines || []).slice();
      const alreadyAssoc = assoc.some(tl => tl && Number(tl.id) === Number(selectedTimeline.id));
      if (!alreadyAssoc) {
        assoc.push({
          id: selectedTimeline.id,
          name: selectedTimeline.name,
          type: timelineType,
        });
      }
      updatedEvent.associated_timelines = assoc;

      // Manage tags locally only for hashtag/community additions; personal listings do not change tags
      let tags = (updatedEvent.tags || event.tags || []).slice();

      if (timelineType === 'hashtag') {
        const baseName = (selectedTimeline.name || '').toLowerCase();
        if (baseName && !tags.some(t => (t.name || t) === baseName)) {
          // Preserve existing tag object shape when possible
          if (tags.length && typeof tags[0] === 'object') {
            tags.push({ id: null, name: baseName });
          } else {
            tags.push(baseName);
          }
        }
      }

      updatedEvent.tags = tags;
      setLocalEventData(updatedEvent);
      
      // Show success message
      setSuccess(`Event added to "${selectedTimeline.name}" timeline successfully!`);
      setSnackbarOpen(true);
      
      // Reset selection
      setSelectedTimeline(null);
    } catch (error) {
      console.error('Error adding event to timeline:', error);
      setError(error.response?.data?.error || 'Failed to add event to timeline. Please try again.');
    } finally {
      setAddingToTimeline(false);
    }
  };

  // Derive lane data for display
  const removedIds = (localEventData?.removed_timeline_ids || event?.removed_timeline_ids) ||
    ((event && event.removed_from_this_timeline) ? [deriveTimelineId()] : []);
  const associatedTimelines = (localEventData?.associated_timelines || event.associated_timelines) || [];
  const { communities, personals } = normalizeAssociatedTimelines(associatedTimelines, removedIds);
  const currentTimelineId = Number(deriveTimelineId() || 0);
  const currentTimelineFromEvent = associatedTimelines.find((tl) => Number(tl?.id) === currentTimelineId);
  const currentTimelineFromCatalog = existingTimelines.find((tl) => Number(tl?.id) === currentTimelineId);
  const currentTimelineType = String(
    currentTimelineFromEvent?.type
    || currentTimelineFromEvent?.timeline_type
    || currentTimelineFromCatalog?.timeline_type
    || currentTimelineFromCatalog?.type
    || '',
  ).toLowerCase();
  const currentTimelineVisibility = String(
    currentTimelineFromEvent?.visibility
    || currentTimelineFromEvent?.timeline_visibility
    || currentTimelineFromCatalog?.visibility
    || currentTimelineFromCatalog?.timeline_visibility
    || '',
  ).toLowerCase();
  const isCurrentTimelinePersonal = currentTimelineType === 'personal';
  const isCurrentTimelinePrivate = currentTimelineVisibility === 'private';
  const showAssociationPrivacyWarningGate = (isCurrentTimelinePersonal || isCurrentTimelinePrivate) && !hasAcknowledgedPrivacyWarning;
  const hashtagTags = ((localEventData?.tags || event.tags) || []).map((t) => {
    if (typeof t === 'string') return t;
    return t?.name || t?.tag_name || '';
  }).filter(Boolean);

  useEffect(() => {
    if (open) {
      setHasAcknowledgedPrivacyWarning(false);
    }
  }, [open, currentTimelineId]);

  // Current user (from localStorage) for personal ownership checks
  let currentUserId = null;
  let isSiteAdmin = false;
  let currentTimelineRole = null;
  
  const pathMatch = location.pathname.match(/timeline(?:-v3)?\/(\d+)/);
  const currentTimelineIdFromUrl = pathMatch ? pathMatch[1] : null;

  try {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    currentUserId = userData?.id || null;

    const passportKey = currentUserId ? `user_passport_${currentUserId}` : null;
    // Prioritize live user state from AuthContext, fallback to passport
    isSiteAdmin = Boolean(user?.is_site_admin);
    if (!isSiteAdmin && passportKey) {
      const passport = JSON.parse(localStorage.getItem(passportKey) || '{}');
      isSiteAdmin = Boolean(passport?.is_site_admin);
    }
    
    if (currentTimelineIdFromUrl && !isSiteAdmin) {
      try {
        const passport = JSON.parse(localStorage.getItem(passportKey) || '{}');
        const membership = (passport?.memberships || []).find((m) => Number(m?.timeline_id) === Number(currentTimelineIdFromUrl));
        currentTimelineRole = String(membership?.member_role || membership?.role || '').toLowerCase();
      } catch (_) {}
    }
  } catch (_) {}

  const isSiteOwner = String(currentUserId) === '1';
  const isEventCreator = currentUserId && String(currentUserId) === String(userData?.id);
  const isCommunityModerator = currentTimelineRole === 'admin' || currentTimelineRole === 'moderator';
  const isEditLocked = Boolean(event?.edit_locked || localEventData?.edit_locked);
  const editPermissions = (localEventData?.edit_permissions || event?.edit_permissions) || null;
  const canEditByResolvedPermissions = editPermissions ? Boolean(editPermissions.can_edit) : false;
  
  // Community moderators can only delete events that were CREATED on this timeline, not just tagged
  const isEventCreatedOnCurrentTimeline = Number(event?.timeline_id) === Number(currentTimelineIdFromUrl);
  const canDeleteAsModerator = isCommunityModerator && isEventCreatedOnCurrentTimeline;
  
  const canDelete = Boolean(onDelete && (isSiteOwner || isSiteAdmin || isEventCreator || canDeleteAsModerator));
  const canEdit = Boolean(
    onEdit
    && (
      canEditByResolvedPermissions
      || isSiteOwner
      || isSiteAdmin
      || (isEventCreator && !isEditLocked)
    )
  );
  const canOpenActionMenu = !isGuest && !user?.is_restricted && !hideActionMenu && (canEdit || canDelete || !isSafeguarded);

  const getTimelineOwnerId = (timeline) => {
    if (!timeline || typeof timeline !== 'object') return null;
    const directOwnerId = timeline.owner_id ?? timeline.created_by ?? timeline.user_id;
    if (directOwnerId) return Number(directOwnerId) || null;
    const createdBy = timeline.created_by;
    if (createdBy && typeof createdBy === 'object') {
      const nestedOwnerId = createdBy.id ?? createdBy.user_id;
      return nestedOwnerId ? Number(nestedOwnerId) || null : null;
    }
    return null;
  };

  const isOwnedByCurrentUser = (timeline) => {
    const ownerId = getTimelineOwnerId(timeline);
    if (ownerId && currentUserId) return Number(ownerId) === Number(currentUserId);
    const fallbackName = String(timeline?.name || '');
    return fallbackName.startsWith('My-') && Boolean(currentUserId);
  };

  // Get currently associated timeline IDs to filter them out of options
  const currentAssocTimelines = localEventData?.associated_timelines || event?.associated_timelines || [];
  const currentAssocTimelineIds = new Set(currentAssocTimelines.map(t => Number(t.id)));

  // Option sources per lane
  const hashtagOptions = existingTimelines
    .filter((tl) => (tl.timeline_type || tl.type) === 'hashtag')
    .filter((tl) => !currentAssocTimelineIds.has(Number(tl.id)));

  // Helper to determine role rank for checking posting restrictions
  const getRoleRank = (roleStr) => {
    const ranks = { member: 1, moderator: 2, admin: 3, siteadmin: 4, siteowner: 5 };
    return ranks[String(roleStr).toLowerCase()] || 0;
  };

  // Communities: from passport memberships where active + community
  const communityOptions = passportMemberships
    .filter((m) => {
      if (String(m.timeline_type || m.type || '').toLowerCase() !== 'community') return false;
      if (!m.is_active_member) return false;

      // Check posting restrictions based on the timeline data
      const tl = existingTimelines.find((t) => Number(t.id) === Number(m.timeline_id));
      if (tl && tl.posting_restriction_enabled) {
        if (getRoleRank(m.member_role || m.role) < getRoleRank(tl.posting_min_role || 'member')) {
          return false;
        }
      }
      return true;
    })
    .map((m) => ({
      id: m.timeline_id,
      name: m.timeline_name || m.name,
      type: 'community',
    }))
    // Site owners, admins, and timeline creators can bypass the membership requirement
    .concat(
      existingTimelines
        .filter((tl) => {
          if (String(tl.timeline_type || tl.type).toLowerCase() !== 'community') return false;
          const isOwner = tl.created_by_id === currentUserId || tl.created_by === currentUserId;
          return isSiteAdmin || isSiteOwner || isOwner;
        })
        .map((tl) => ({ id: tl.id, name: tl.name, type: 'community' }))
    )
    // dedupe by id
    .reduce((acc, item) => {
      if (!item || !item.id) return acc;
      if (currentAssocTimelineIds.has(Number(item.id))) return acc;
      if (acc.find((x) => Number(x.id) === Number(item.id))) return acc;
      acc.push(item);
      return acc;
    }, []);

  // Personals: from passport where personal and owned by current user (creator/site-owner)
  const personalOptions = passportMemberships
    .filter((m) => {
      const isPersonal = String(m.timeline_type || m.type || '').toLowerCase() === 'personal';
      const isActive = m.is_active_member;
      const ownerId = Number(m.owner_id || m.created_by || 0);
      const isOwner = Boolean(m.is_creator)
        || Boolean(m.is_site_owner)
        || ownerId <= 0
        || Number(ownerId) === Number(currentUserId);
      return isPersonal && isActive && isOwner;
    })
    .map((m) => ({
      id: m.timeline_id,
      name: m.timeline_name || m.name,
      type: 'personal',
    }))
    .concat(
      existingTimelines
        .filter((tl) => String(tl.timeline_type || tl.type || '').toLowerCase() === 'personal')
        .filter((tl) => isOwnedByCurrentUser(tl))
        .map((tl) => ({ id: tl.id, name: tl.name, type: 'personal' }))
    )
    .reduce((acc, item) => {
      if (!item || !item.id) return acc;
      if (currentAssocTimelineIds.has(Number(item.id))) return acc;
      if (acc.find((x) => Number(x.id) === Number(item.id))) return acc;
      acc.push(item);
      return acc;
    }, []);

  // Determine if this is an image media event
  const isImageMedia = () => {
    if (safeEventType !== EVENT_TYPES.MEDIA) return false;

    const subtype = (event.media_subtype || '').toLowerCase();
    if (subtype === 'image') {
      // Honor explicit subtype even if media_url is missing; the popup can
      // render its own "no media available" state.
      return true;
    }

    const mediaSource = event.media_url || event.mediaUrl || event.url;
    const mimeType = event.media_type || '';

    if (!mediaSource && !mimeType) return false;

    // Fallback to extension or MIME type check
    return (/\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(mediaSource || '') ||
            (mimeType && mimeType.startsWith('image/')));
  };
  
  // Determine if this is a video media event
  const isVideoMedia = () => {
    if (safeEventType !== EVENT_TYPES.MEDIA) return false;

    const subtype = (event.media_subtype || '').toLowerCase();
    if (subtype === 'video') {
      return true;
    }
    
    const mediaSource = event.media_url || event.mediaUrl || event.url;
    const mimeType = event.media_type || '';

    if (!mediaSource && !mimeType) return false;
    
    // Fallback to extension or MIME type check
    return (/\.(mp4|webm|ogg|mov|avi|wmv|flv|mkv)$/i.test(mediaSource || '') || 
            (mimeType && mimeType.startsWith('video/')));
  };
  
  // Determine if this is an audio media event
  const isAudioMedia = () => {
    if (safeEventType !== EVENT_TYPES.MEDIA) return false;

    const subtype = (event.media_subtype || '').toLowerCase();
    if (subtype === 'audio') {
      return true;
    }
    
    const mediaSource = event.media_url || event.mediaUrl || event.url;
    const mimeType = event.media_type || '';

    if (!mediaSource && !mimeType) return false;
    
    // Fallback to extension or MIME type check
    return (/\.(mp3|wav|ogg|aac|flac|m4a|wma)$/i.test(mediaSource || '') || 
            (mimeType && mimeType.startsWith('audio/')));
  };
  
  // Get the media source URL
  const getMediaSource = () => {
    const rawUrl = event.media_url || event.mediaUrl || event.url;
    return normalizeMediaUrl(rawUrl);
  };
  
  // Check if we should use the specialized media popups
  const useImagePopup = isImageMedia();
  const useVideoPopup = isVideoMedia();
  const useAudioPopup = isAudioMedia();
  const isNews = safeEventType === EVENT_TYPES.NEWS;
  const mediaSource = getMediaSource();

  if (!event) return null;
  
  // For news events, use the specialized NewsEventPopup component
  const laneProps = {
    hashtagTags,
    communities,
    personals,
    hashtagOptions,
    communityOptions,
    personalOptions,
    selectedHashtag,
    setSelectedHashtag,
    selectedCommunity,
    setSelectedCommunity,
    selectedPersonal,
    setSelectedPersonal,
    onAddToTimeline: handleAddToTimeline,
    addingToTimeline,
    loadingTimelines,
    error,
    success,
    currentUserId,
    isRestricted: user?.is_restricted,
    showPrivacyWarningGate: showAssociationPrivacyWarningGate,
    onAcknowledgePrivacyWarning: () => setHasAcknowledgedPrivacyWarning(true),
  };

  if (isNews) {
    return (<>
      <NewsEventPopup
        event={event}
        open={open}
        onClose={onClose}
        onDelete={onDelete}
        onEdit={onEdit}
        formatDate={formatDate}
        formatEventDate={formatEventDate}
        color={remarkColor}
        TypeIcon={TypeIcon}
        snackbarOpen={snackbarOpen}
        handleSnackbarClose={handleSnackbarClose}
        error={error}
        success={success}
        existingTimelines={existingTimelines}
        selectedTimeline={selectedTimeline}
        setSelectedTimeline={setSelectedTimeline}
        loadingTimelines={loadingTimelines}
        addingToTimeline={addingToTimeline}
        setError={setError}
        handleAddToTimeline={handleAddToTimeline}
        fetchExistingTimelines={fetchExistingTimelines}
        isInReview={isInReview}
        isSafeguarded={isSafeguarded}
        laneProps={laneProps}
      />
    </>);
  }
  
  // For image media, use the specialized ImageEventPopup component.
  // As a final safeguard, any media event that isn't clearly video/audio
  // will still use the image media popup so media events never fall back
  // to the generic remark layout.
  if (useImagePopup || (safeEventType === EVENT_TYPES.MEDIA && !useVideoPopup && !useAudioPopup)) {
    return (
      <ImageEventPopup
        event={event}
        open={open}
        onClose={onClose}
        onDelete={onDelete}
        onEdit={onEdit}
        mediaSource={mediaSource}
        formatDate={formatDate}
        formatEventDate={formatEventDate}
        color={color}
        TypeIcon={TypeIcon}
        snackbarOpen={snackbarOpen}
        handleSnackbarClose={handleSnackbarClose}
        error={error}
        success={success}
        existingTimelines={existingTimelines}
        selectedTimeline={selectedTimeline}
        setSelectedTimeline={setSelectedTimeline}
        loadingTimelines={loadingTimelines}
        addingToTimeline={addingToTimeline}
        setError={setError}
        handleAddToTimeline={handleAddToTimeline}
        fetchExistingTimelines={fetchExistingTimelines}
        isInReview={isInReview}
        isSafeguarded={isSafeguarded}
        laneProps={laneProps}
      />
    );
  }
  
  // For video media, use the specialized VideoEventPopup component
  if (useVideoPopup) {
    return (
      <VideoEventPopup
        event={event}
        open={open}
        onClose={onClose}
        onDelete={onDelete}
        onEdit={onEdit}
        mediaSource={mediaSource}
        formatDate={formatDate}
        formatEventDate={formatEventDate}
        color={color}
        TypeIcon={TypeIcon}
        snackbarOpen={snackbarOpen}
        handleSnackbarClose={handleSnackbarClose}
        error={error}
        success={success}
        existingTimelines={existingTimelines}
        selectedTimeline={selectedTimeline}
        setSelectedTimeline={setSelectedTimeline}
        loadingTimelines={loadingTimelines}
        addingToTimeline={addingToTimeline}
        setError={setError}
        handleAddToTimeline={handleAddToTimeline}
        fetchExistingTimelines={fetchExistingTimelines}
        isInReview={isInReview}
        isSafeguarded={isSafeguarded}
        laneProps={laneProps}
      />
    );
  }
  
  // For audio media, use the specialized AudioMediaPopup component
  if (useAudioPopup) {
    return (
      <AudioMediaPopup
        event={event}
        open={open}
        onClose={onClose}
        onDelete={onDelete}
        onEdit={onEdit}
        mediaSource={mediaSource}
        formatDate={formatDate}
        formatEventDate={formatEventDate}
        color={color}
        TypeIcon={TypeIcon}
        snackbarOpen={snackbarOpen}
        handleSnackbarClose={handleSnackbarClose}
        error={error}
        success={success}
        existingTimelines={existingTimelines}
        selectedTimeline={selectedTimeline}
        setSelectedTimeline={setSelectedTimeline}
        loadingTimelines={loadingTimelines}
        addingToTimeline={addingToTimeline}
        setError={setError}
        handleAddToTimeline={handleAddToTimeline}
        fetchExistingTimelines={fetchExistingTimelines}
        isInReview={isInReview}
        isSafeguarded={isSafeguarded}
        laneProps={laneProps}
      />
    );
  }

  // For all other event types, use the standard popup
  return (<>
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      scroll="paper"
      sx={{
        '& .MuiDialog-container': {
          overscrollBehavior: 'none',
        },
        '& .MuiBackdrop-root': {
          touchAction: 'none',
          overscrollBehavior: 'none',
        }
      }}
      PaperProps={{
        sx: {
          borderRadius: 3,
          overflow: 'hidden',
          backgroundColor: theme.palette.mode === 'dark' 
            ? 'rgba(10,10,20,0.92)' 
            : 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(20px)',
          boxShadow: theme.palette.mode === 'dark'
            ? '0 10px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)'
            : '0 10px 40px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.05)',
          margin: { xs: 1, sm: 2, md: 4 },
          maxHeight: '90vh',
          width: '100%',
          border: 'none',
        },
        component: motion.div,
        drag: "x",
        dragConstraints: { left: 0, right: 0 },
        dragElastic: { left: 0.5, right: 0.5 },
        onDragEnd: (event, info) => {
          if (Math.abs(info.offset.x) > 100) {
            handleClose();
          }
        },
      }}
      slotProps={{
        backdrop: {
          sx: { touchAction: 'none' }
        }
      }}
    >

          <DialogTitle sx={{ p: { xs: 2, sm: 3 }, pb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1, minWidth: 0 }}>
                <Box
                  sx={{
                    width: { xs: 32, sm: 40 },
                    height: { xs: 32, sm: 40 },
                    flexShrink: 0,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: theme.palette.mode === 'dark'
                      ? 'rgba(255,255,255,0.05)'
                      : 'rgba(0,0,0,0.03)',
                    color: remarkColor,
                  }}
                >
                  <TypeIcon fontSize={theme.breakpoints.down('sm') ? "small" : "medium"} />
                </Box>
                <Typography 
                  variant="h5" 
                  component="div"
                  sx={{ 
                    fontWeight: 600,
                    fontSize: { xs: '1.1rem', sm: '1.25rem', md: '1.5rem' },
                    lineHeight: 1.2,
                    wordBreak: 'break-word',
                    color: theme.palette.mode === 'dark'
                      ? 'rgba(255,255,255,0.95)'
                      : 'rgba(0,0,0,0.85)',
                  }}
                >
                  {event.title || "Untitled Event"}
                </Typography>
              </Box>
              <IconButton 
                edge="end" 
                color="inherit" 
                onClick={handleClose} 
                aria-label="close"
                sx={{ 
                  color: theme.palette.mode === 'dark' 
                    ? 'rgba(255,255,255,0.7)' 
                    : 'rgba(0,0,0,0.5)',
                  mt: -0.5,
                  mr: -0.5,
                }}
              >
                <CloseIcon />
              </IconButton>
            </Box>
          </DialogTitle>
          
          {/* Header with colored accent bar and gradient */}
          <Box
            sx={{
              position: 'relative',
              height: 4,
              background: `linear-gradient(90deg, ${remarkColor} 0%, ${theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.2)' : 'rgba(33, 150, 243, 0.2)'} 100%)`,
            }}
          />
          
          <DialogContent 
            sx={{ 
              p: { xs: 2, sm: 4 },
              overflowY: 'auto',
              WebkitOverflowScrolling: 'touch', // Better smooth scrolling on iOS
              touchAction: 'pan-y', // Allow horizontal swipe to bubble up to Paper drag
            }}
          >
            {/* Event Description */}
            {(event.content || event.description) && (
              <Box sx={{ mb: 3 }}>
                <Box
                  sx={event.type === EVENT_TYPES.REMARK ? {
                    '--remark-rule-gap': '1.88rem',
                    '--remark-rule-color': theme.palette.mode === 'dark' ? 'rgba(169,201,255,0.2)' : 'rgba(120,78,35,0.12)',
                    position: 'relative',
                    overflow: 'visible',
                    px: { xs: 2.25, sm: 2.75 },
                    py: { xs: 2.25, sm: 2.6 },
                    borderRadius: '4px',
                    border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(154,191,255,0.34)' : 'rgba(63,43,24,0.24)'}`,
                    background: theme.palette.mode === 'dark'
                      ? 'linear-gradient(180deg, rgba(34,51,82,0.92) 0%, rgba(18,28,46,0.96) 100%)'
                      : 'linear-gradient(180deg, rgba(255,252,245,0.98) 0%, rgba(246,238,224,0.98) 100%)',
                    backgroundImage: theme.palette.mode === 'dark'
                      ? 'linear-gradient(180deg, rgba(34,51,82,0.92) 0%, rgba(18,28,46,0.96) 100%), repeating-linear-gradient(0deg, var(--remark-rule-color) 0px, var(--remark-rule-color) 1px, transparent 1px, transparent var(--remark-rule-gap))'
                      : 'linear-gradient(180deg, rgba(255,252,245,0.98) 0%, rgba(246,238,224,0.98) 100%), repeating-linear-gradient(0deg, var(--remark-rule-color) 0px, var(--remark-rule-color) 1px, transparent 1px, transparent var(--remark-rule-gap))',
                    boxShadow: theme.palette.mode === 'dark'
                      ? '0 16px 30px rgba(3,7,18,0.62), inset 0 1px 0 rgba(203,225,255,0.2), inset 0 0 0 1px rgba(147,197,253,0.12)'
                      : '0 14px 28px rgba(73,46,20,0.15), inset 0 1px 0 rgba(255,255,255,0.82), inset 0 0 0 1px rgba(113,79,46,0.08)',
                    '&::before': {
                      content: '"“"',
                      position: 'absolute',
                      top: -10,
                      left: 10,
                      fontFamily: '"Bodoni Moda", "Times New Roman", serif',
                      fontSize: '4.2rem',
                      lineHeight: 1,
                      color: theme.palette.mode === 'dark' ? 'rgba(191,219,254,0.24)' : 'rgba(107,74,39,0.2)',
                      pointerEvents: 'none',
                    },
                    '&::after': {
                      content: '"”"',
                      position: 'absolute',
                      right: 10,
                      bottom: -16,
                      fontFamily: '"Bodoni Moda", "Times New Roman", serif',
                      fontSize: '4.2rem',
                      lineHeight: 1,
                      color: theme.palette.mode === 'dark' ? 'rgba(191,219,254,0.24)' : 'rgba(107,74,39,0.2)',
                      pointerEvents: 'none',
                    },
                    '& > .remark-letter-content': {
                      position: 'relative',
                      zIndex: 1,
                      borderTop: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(191,219,254,0.2)' : 'rgba(118,80,43,0.18)'}`,
                      borderBottom: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(191,219,254,0.2)' : 'rgba(118,80,43,0.18)'}`,
                      paddingTop: 1.2,
                      paddingBottom: 1.2,
                    },
                  } : {}}
                >
                  {event.content ? (
                    <Box
                      className="remark-letter-content"
                      sx={{
                        position: 'relative',
                        zIndex: 1,
                        lineHeight: 'var(--remark-rule-gap)',
                        fontFamily: '"Cormorant Garamond", "Georgia", serif',
                        fontSize: '1.13rem',
                        letterSpacing: '0.01em',
                        color: theme.palette.mode === 'dark' ? 'rgba(238,246,255,0.96)' : 'rgba(43,28,14,0.86)',
                      }}
                    >
                      <RichContentRenderer
                        content={event.content}
                        theme={theme}
                        ocrMetadataStamps
                        dropcapFirstLetter
                        textSx={{
                          fontFamily: '"Cormorant Garamond", "Georgia", serif',
                          fontSize: '1.13rem',
                          letterSpacing: '0.01em',
                          fontWeight: 500,
                        }}
                      />
                    </Box>
                  ) : (
                    <Typography 
                      variant="body1" 
                      sx={{ 
                        fontFamily: '"Cormorant Garamond", "Georgia", serif',
                        fontSize: '1.13rem',
                        letterSpacing: '0.01em',
                        position: 'relative',
                        zIndex: 1,
                        whiteSpace: 'pre-wrap',
                        lineHeight: 'var(--remark-rule-gap)',
                        color: theme.palette.mode === 'dark'
                          ? 'rgba(238,246,255,0.96)'
                          : 'rgba(43,28,14,0.86)',
                        borderTop: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(191,219,254,0.2)' : 'rgba(118,80,43,0.18)'}`,
                        pt: 1.2,
                        '&::first-letter': {
                          fontFamily: '"Bodoni Moda", "Times New Roman", serif',
                          fontSize: '2.2rem',
                          lineHeight: 0.95,
                          fontWeight: 700,
                          color: theme.palette.mode === 'dark' ? 'rgba(219,234,254,0.95)' : 'rgba(96,61,30,0.92)',
                          paddingRight: '0.08em',
                          float: 'left',
                          marginTop: '-0.11em',
                        },
                      }}
                    >
                      {event.description}
                    </Typography>
                  )}
                </Box>
              </Box>
            )}
            
            <Divider sx={{ my: 2 }} />
            
            {/* Event Metadata - Background colored section */}
            <Paper
              elevation={0}
              sx={{
                mb: 3,
                p: 2.5,
                bgcolor: theme.palette.mode === 'dark'
                  ? 'rgba(255,255,255,0.03)'
                  : 'rgba(0,0,0,0.02)',
                borderRadius: 2,
                border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
              }}
            >
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {/* Timeline Date with icon */}
                {event.event_date && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: theme.palette.mode === 'dark'
                          ? 'rgba(255,255,255,0.05)'
                          : 'rgba(0,0,0,0.03)',
                        color: remarkColor,
                      }}
                    >
                      <EventIcon fontSize="small" />
                    </Box>
                    <Box>
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          display: 'block',
                          color: theme.palette.mode === 'dark'
                            ? 'rgba(255,255,255,0.5)'
                            : 'rgba(0,0,0,0.5)',
                        }}
                      >
                        Timeline Date
                      </Typography>
                      <Typography 
                        variant="body2"
                        sx={{ 
                          color: theme.palette.mode === 'dark'
                            ? 'rgba(255,255,255,0.9)'
                            : 'rgba(0,0,0,0.9)',
                        }}
                      >
                        {formatEventDate(event.event_date)}
                      </Typography>
                    </Box>
                  </Box>
                )}
              </Box>
            </Paper>
            
            <Divider sx={{ my: 2 }} />
            
            {/* Timelines Lanes Section */}
            <Box sx={{ mb: 3 }}>
              <PopupTimelineLanes
                {...laneProps}
              />
            </Box>
          </DialogContent>
          
          <Divider sx={{ opacity: 0.3 }} />
          
          <Box sx={{ px: 3, py: 2, mt: 'auto', bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <CreatorChip user={getUserData()} color={remarkColor} />
              <VoteControls
                value={voteValue}
                onChange={handleVoteChange}
                positiveRatio={positiveRatio}
                totalVotes={totalVotes}
                isLoading={voteLoading}
                hasError={!!voteError}
                layout="stacked"
                sizeScale={0.8}
                pillScale={1.05}
                badgeScale={0.75}
              />
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: 0.7 }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                ID: {event?.id ?? '--'}
              </Typography>
              {event.created_at && (
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                  {formatDate(event.created_at)}
                </Typography>
              )}
            </Box>
            
            <Box sx={{ mt: 1, display: 'flex', justifyContent: 'flex-end', gap: 1, alignItems: 'center' }}>
              {(isInReview && !isSafeguarded) && (
                <Chip
                  icon={<RateReviewIcon sx={{ fontSize: '14px !important' }} />}
                  label="In Review"
                  size="small"
                  sx={{ 
                    height: 20, 
                    fontSize: '0.65rem', 
                    bgcolor: 'warning.main', 
                    color: 'white',
                    fontWeight: 600
                  }}
                />
              )}
              {isSafeguarded && (
                <Chip
                  icon={<CheckCircleIcon sx={{ fontSize: '14px !important' }} />}
                  label="Safeguarded"
                  size="small"
                  sx={{ height: 20, fontSize: '0.65rem', bgcolor: 'success.main', color: 'white' }}
                />
              )}
              {canOpenActionMenu && (
                <>
                  <IconButton
                    size="small"
                    onClick={handleActionMenuOpen}
                    sx={{
                      bgcolor: `${remarkColor}18`,
                      color: remarkColor,
                      border: `1px solid ${remarkColor}40`,
                      borderRadius: '10px',
                      width: 32,
                      height: 32,
                    }}
                  >
                    <MoreHorizIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                    <Menu
                      anchorEl={actionAnchorEl}
                      open={Boolean(actionAnchorEl)}
                      onClose={handleActionMenuClose}
                      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                      transformOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                      PaperProps={{
                        sx: {
                          ...getGlassDialogPaperSx(theme),
                          minWidth: 160,
                          '& .MuiMenuItem-root': {
                            borderRadius: 1,
                            mx: 1,
                            my: 0.5,
                            transition: 'all 0.2s',
                            '&:hover': {
                              bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                              transform: 'translateX(4px)',
                            }
                          }
                        }
                      }}
                    >
                    {canEdit && (
                      <MenuItem onClick={handleEdit}>
                        <ListItemIcon><EditIcon fontSize="small" /></ListItemIcon>
                        <ListItemText primary="Edit" />
                      </MenuItem>
                    )}
                    {canDelete && (
                      <MenuItem onClick={() => { handleActionMenuClose(); handleOpenDelete(); }}>
                        <ListItemIcon><DeleteIcon fontSize="small" /></ListItemIcon>
                        <ListItemText primary="Delete" />
                      </MenuItem>
                    )}
                    {!isSafeguarded && !isInReview && (
                      <MenuItem onClick={() => { handleActionMenuClose(); handleOpenReport(); }} disabled={reportedOnce}>
                        <ListItemIcon><RateReviewIcon fontSize="small" /></ListItemIcon>
                        <ListItemText primary={reportedOnce ? 'Reported' : 'Report'} />
                      </MenuItem>
                    )}
                  </Menu>
                </>
              )}
            </Box>
          </Box>
          
          {/* Success/Error Snackbar */}
          <Snackbar
            open={snackbarOpen}
            autoHideDuration={6000}
            onClose={handleSnackbarClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          >
            <Alert 
              onClose={handleSnackbarClose} 
              severity={error ? "error" : "success"}
              sx={{ width: '100%' }}
            >
              {error || success}
            </Alert>
          </Snackbar>
        </Dialog>

        {/* Level 1 Report Overlay */}
        <Dialog
          open={reportOpen}
          onClose={handleCloseReport}
          maxWidth="xs"
          fullWidth
          
          PaperProps={{ sx: getGlassDialogPaperSx(theme) }}
        >
          <DialogTitle sx={{ pb: 1 }}>Report Post</DialogTitle>
          <DialogContent sx={{ pt: 1, overflow: 'visible', '& .MuiTextField-root': getGlassInputSx(theme) }}>
            <TextField
              select
              fullWidth
              required
              margin="dense"
              label="Violation Type"
              value={reportCategory}
              onChange={(e) => setReportCategory(e.target.value)}
              error={!reportCategory}
              helperText={!reportCategory ? "Required" : ""}
              sx={{ mb: 2 }}
            >
              <MenuItem value={''} disabled>Select a category</MenuItem>
              <MenuItem value={'website_policy'}>Website Policy</MenuItem>
              <MenuItem value={'government_policy'}>Government Policy</MenuItem>
              <MenuItem value={'unethical_boundary'}>Unethical Boundary</MenuItem>
            </TextField>
            <TextField
              fullWidth
              margin="dense"
              label="Reason (optional)"
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              multiline
              minRows={3}
            />
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 3 }}>
              <Button 
                onClick={handleCloseReport} 
                disabled={reportSubmitting}
                variant="contained"
                sx={{
                  ...getGlassSquareActionButtonSx(theme),
                  width: 'auto',
                  minWidth: 84,
                  px: 2,
                  borderRadius: 1.4,
                }}
              >
                Cancel
              </Button>
              <Button 
                variant="contained" 
                onClick={handleSubmitReport} 
                disabled={reportSubmitting || !reportCategory}
                sx={{
                  ...getGlassPillActionButtonSx(theme),
                  bgcolor: theme.palette.error.main,
                  color: '#fff',
                  border: '1px solid ' + theme.palette.error.main + '88',
                  '&:hover': {
                    bgcolor: theme.palette.error.dark,
                  }
                }}
              >
                {reportSubmitting ? <CircularProgress size={18} color="inherit" /> : 'Submit'}
              </Button>
            </Box>
          </DialogContent>
        </Dialog>
        <Dialog
          open={deleteDialogOpen}
          onClose={handleCloseDelete}
          
        >
          <DialogTitle>Delete Event</DialogTitle>
          <DialogContent>
            Are you sure you want to delete "{event?.title || 'this event'}"?
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDelete}>Cancel</Button>
            <Button onClick={handleConfirmDelete} color="error">Delete</Button>
          </DialogActions>
        </Dialog>
  </>);
};

export default EventPopup;
