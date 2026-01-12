import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link as RouterLink } from 'react-router-dom';
import ImageEventPopup from './ImageEventPopup';
import VideoEventPopup from './VideoEventPopup';
import NewsEventPopup from './NewsEventPopup';
import CreatorChip from './CreatorChip';
import AudioMediaPopup from './AudioMediaPopup';
import AudioWaveformVisualizer from '../../../components/AudioWaveformVisualizer';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Typography,
  Box,
  useTheme,
  Paper,
  Divider,
  Snackbar,
  Alert,
  TextField,
  Autocomplete,
  Button,
  CircularProgress,
  Link,
  Avatar,
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
  PermMedia as MediaIcon,
  ExpandMore as ExpandMoreIcon,
  Add as AddIcon,
  Event as EventIcon,
  Person as PersonIcon,
  AccessTime as AccessTimeIcon,
  RateReview as RateReviewIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import { EVENT_TYPES, EVENT_TYPE_COLORS } from './EventTypes';
import api from '../../../utils/api';
import PopupTimelineLanes from './PopupTimelineLanes';
import { submitReport } from '../../../utils/api';
import config from '../../../config';

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

const EventPopup = ({ event, open, onClose, setIsPopupOpen, reviewingEventIds = new Set() }) => {
  const theme = useTheme();
  const location = useLocation();
  const [isInReview, setIsInReview] = useState(false);
  const [isSafeguarded, setIsSafeguarded] = useState(false);
  
  // Fetch reviewing and safeguarded status when popup opens
  useEffect(() => {
    const checkReportStatus = async () => {
      if (!open || !event?.id) {
        setIsInReview(false);
        setIsSafeguarded(false);
        return;
      }
      
      // First check if reviewingEventIds prop is provided (from AdminPanel)
      if (reviewingEventIds.size > 0) {
        setIsInReview(reviewingEventIds.has(event.id));
        // AdminPanel doesn't provide safeguarded IDs yet, so fetch separately
      }
      
      // Fetch from API (for timeline page or to get safeguarded status)
      // We need to get the current timeline ID from the URL, not from the event
      try {
        // Extract timeline ID from current URL path
        const pathMatch = location.pathname.match(/timeline(?:-v3)?\/(\d+)/);
        const currentTimelineId = pathMatch ? pathMatch[1] : null;
        
        if (!currentTimelineId) {
          setIsInReview(false);
          setIsSafeguarded(false);
          return;
        }
        
        // Fetch reviewing reports
        if (reviewingEventIds.size === 0) {
          const reviewingResponse = await api.get(`/api/v1/timelines/${currentTimelineId}/reports`, {
            params: { status: 'reviewing' }
          });
          
          const reviewingIds = (reviewingResponse.data?.items || [])
            .map(report => report.event_id)
            .filter(Boolean);
          
          setIsInReview(reviewingIds.includes(event.id));
        }
        
        // Fetch resolved reports with safeguard resolution
        const resolvedResponse = await api.get(`/api/v1/timelines/${currentTimelineId}/reports`, {
          params: { status: 'resolved' }
        });
        
        const safeguardedIds = (resolvedResponse.data?.items || [])
          .filter(report => report.resolution === 'safeguard')
          .map(report => report.event_id)
          .filter(Boolean);
        
        setIsSafeguarded(safeguardedIds.includes(event.id));
      } catch (error) {
        // Silently fail - user might not have permission
        setIsInReview(false);
        setIsSafeguarded(false);
      }
    };
    
    checkReportStatus();
  }, [open, event?.id, location.pathname, reviewingEventIds]);
  
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
  // Passport memberships for filtering lane options
  const [passportMemberships, setPassportMemberships] = useState([]);
  // Store the updated event data after adding a tag
  const [localEventData, setLocalEventData] = useState(null);
  // Level 1 report overlay state
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportedOnce, setReportedOnce] = useState(false);
  const [reportCategory, setReportCategory] = useState('');
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
        avatar: event.created_by.avatar_url || event.created_by_avatar || null
      };
    }
    // Then try direct properties (flattened)
    return {
      id: event.created_by || event.created_by_id || 'unknown',
      username: event.created_by_username || 'Unknown User',
      avatar: event.created_by_avatar || null
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
    setReportReason('');
    setReportCategory('');
    setReportOpen(true);
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
      const response = await api.get('/api/timeline-v3');
      setExistingTimelines(response.data || []);
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
    if (open && passportMemberships.length === 0) {
      loadPassport();
    }
  }, [open, passportMemberships.length]);

  // Function to add the event to the selected timeline (per-lane)
  const handleAddToTimeline = async (selectedTimeline) => {
    if (!selectedTimeline || !event) return;

    try {
      setAddingToTimeline(true);
      setError('');
      
      // Check if the event is already in the timeline
      const checkResponse = await api.get(`/api/timeline-v3/${selectedTimeline.id}/events`);
      const timelineEvents = checkResponse.data || [];
      
      // Check if this event already exists in the selected timeline
      const eventExists = timelineEvents.some(timelineEvent => timelineEvent.id === event.id);
      
      if (eventExists) {
        setError(`This event is already in the "${selectedTimeline.name}" timeline.`);
        setAddingToTimeline(false);
        return;
      }
      
      // Add the event to the timeline
      const addResponse = await api.post(`/api/timeline-v3/${selectedTimeline.id}/add-event/${event.id}`);
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
  const hashtagTags = ((localEventData?.tags || event.tags) || []).map((t) => {
    if (typeof t === 'string') return t;
    return t?.name || t?.tag_name || '';
  }).filter(Boolean);

  // Current user (from localStorage) for personal ownership checks
  let currentUserId = null;
  try {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    currentUserId = userData?.id || null;
  } catch (_) {}

  // Option sources per lane
  const hashtagOptions = existingTimelines.filter((tl) => (tl.timeline_type || tl.type) === 'hashtag');

  // Communities: from passport memberships where active + community
  const communityOptions = passportMemberships
    .filter((m) => String(m.timeline_type || m.type || '').toLowerCase() === 'community' && m.is_active_member)
    .map((m) => ({
      id: m.timeline_id,
      name: m.timeline_name || m.name,
      type: 'community',
    }))
    // fallback to any loaded community timelines not yet included
    .concat(
      existingTimelines
        .filter((tl) => (tl.timeline_type || tl.type) === 'community')
        .map((tl) => ({ id: tl.id, name: tl.name, type: 'community' }))
    )
    // dedupe by id
    .reduce((acc, item) => {
      if (!item || !item.id) return acc;
      if (acc.find((x) => Number(x.id) === Number(item.id))) return acc;
      acc.push(item);
      return acc;
    }, []);

  // Personals: from passport where personal and owned by current user (creator/site-owner)
  const personalOptions = passportMemberships
    .filter((m) => {
      const isPersonal = String(m.timeline_type || m.type || '').toLowerCase() === 'personal';
      const isActive = m.is_active_member;
      const isOwner = m.is_creator || m.is_site_owner || (!m.owner_id || Number(m.owner_id) === Number(currentUserId));
      console.log('[EventPopup] Personal filter:', { 
        membership: m, 
        isPersonal, 
        isActive, 
        isOwner,
        currentUserId 
      });
      return isPersonal && isActive && isOwner;
    })
    .map((m) => ({
      id: m.timeline_id,
      name: m.timeline_name || m.name,
      type: 'personal',
    }))
    .reduce((acc, item) => {
      if (!item || !item.id) return acc;
      if (acc.find((x) => Number(x.id) === Number(item.id))) return acc;
      acc.push(item);
      return acc;
    }, []);
  
  console.log('[EventPopup] Personal options computed:', personalOptions);

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
  
  // Add a separate audio element for playback to avoid Web Audio API conflicts
  const [audioElement] = useState(() => {
    if (isAudioMedia() && typeof window !== 'undefined') {
      const audio = new Audio();
      audio.src = event.media_url || event.mediaUrl || event.url;
      audio.volume = 0.75;
      return audio;
    }
    return null;
  });
  
  // Handle audio playback separately from the visualizer
  const toggleAudio = () => {
    if (!audioElement) return;
    
    if (audioElement.paused) {
      audioElement.play().catch(err => {
        console.error('Error playing audio:', err);
      });
    } else {
      audioElement.pause();
    }
  };
  
  // Get the media source URL
  const getMediaSource = () => {
    let mediaSource = event.media_url || event.mediaUrl || event.url;
    if (!mediaSource) return '';
    
    // Handle relative URLs by prepending the API_URL
    if (mediaSource && !mediaSource.startsWith('http')) {
      // Remove any duplicate slashes that might occur when joining URLs
      const baseUrl = config.API_URL.endsWith('/') 
        ? config.API_URL.slice(0, -1) 
        : config.API_URL;
      
      mediaSource = mediaSource.startsWith('/') 
        ? `${baseUrl}${mediaSource}`
        : `${baseUrl}/${mediaSource}`;
    }
    
    // Force reload the media to bypass cache (add timestamp)
    const timestamp = new Date().getTime();
    mediaSource = mediaSource.includes('?') 
      ? `${mediaSource}&t=${timestamp}` 
      : `${mediaSource}?t=${timestamp}`;
    
    return mediaSource;
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
  };

  if (isNews) {
    return (<>
      <NewsEventPopup
        event={event}
        open={open}
        onClose={onClose}
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
      PaperProps={{
        sx: {
          borderRadius: 3,
          overflow: 'hidden',
          backgroundColor: theme.palette.mode === 'dark' 
            ? 'rgba(10,10,20,0.85)' 
            : 'rgba(255,255,255,0.85)',
          backdropFilter: 'blur(20px)',
          boxShadow: theme.palette.mode === 'dark'
            ? '0 10px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)'
            : '0 10px 40px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.05)',
          border: 'none',
        },
      }}
    >
          <DialogTitle sx={{ p: 3, pb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: theme.palette.mode === 'dark'
                      ? 'rgba(255,255,255,0.05)'
                      : 'rgba(0,0,0,0.03)',
                    color: remarkColor, // Use the specific remark color for the icon
                  }}
                >
                  <TypeIcon fontSize="medium" />
                </Box>
                <Typography 
                  variant="h5" 
                  component="div"
                  sx={{ 
                    fontWeight: 600,
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
          
          <DialogContent sx={{ p: 4 }}>
            {/* Event Description */}
            {event.description && (
              <Box sx={{ mb: 3 }}>
                <Typography 
                  variant="body1" 
                  sx={{ 
                    whiteSpace: 'pre-wrap',
                    lineHeight: 1.7,
                    color: theme.palette.mode === 'dark'
                      ? 'rgba(255,255,255,0.85)'
                      : 'rgba(0,0,0,0.75)',
                  }}
                >
                  {event.description}
                </Typography>
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
                {/* Creator Chip */}
                <CreatorChip user={getUserData()} color={remarkColor} />
                
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
                
                {/* Published Date with icon */}
                {event.created_at && (
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
                      <AccessTimeIcon fontSize="small" />
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
                        Published
                      </Typography>
                      <Typography 
                        variant="body2"
                        sx={{ 
                          color: theme.palette.mode === 'dark'
                            ? 'rgba(255,255,255,0.9)'
                            : 'rgba(0,0,0,0.9)',
                        }}
                      >
                        {formatDate(event.created_at).replace('Published on ', '')}
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
          
          {/* Report Button & Status Indicators - Bottom Right */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 1.5, px: 3, pb: 2, position: 'relative' }}>
            {isInReview && (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  px: 1.5,
                  py: 0.25,
                  borderRadius: '12px',
                  backgroundColor: theme.palette.mode === 'dark' 
                    ? 'rgba(255, 152, 0, 0.2)' 
                    : 'rgba(255, 152, 0, 0.15)',
                  transform: 'rotate(-2deg)',
                  boxShadow: theme.palette.mode === 'dark'
                    ? '0 2px 4px rgba(0,0,0,0.3)'
                    : '0 2px 4px rgba(0,0,0,0.1)',
                }}
              >
                <RateReviewIcon 
                  sx={{ 
                    fontSize: 14,
                    color: theme.palette.mode === 'dark' 
                      ? 'rgba(255, 152, 0, 1)' 
                      : 'rgba(255, 152, 0, 1)',
                  }} 
                />
                <Typography
                  variant="caption"
                  sx={{
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    color: theme.palette.mode === 'dark' 
                      ? 'rgba(255, 152, 0, 1)' 
                      : 'rgba(255, 152, 0, 1)',
                  }}
                >
                  In Review
                </Typography>
              </Box>
            )}
            {isSafeguarded ? (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  px: 1.5,
                  py: 0.25,
                  borderRadius: '12px',
                  backgroundColor: theme.palette.mode === 'dark' 
                    ? 'rgba(76, 175, 80, 0.2)' 
                    : 'rgba(76, 175, 80, 0.15)',
                  transform: 'rotate(-2deg)',
                  boxShadow: theme.palette.mode === 'dark'
                    ? '0 2px 4px rgba(0,0,0,0.3)'
                    : '0 2px 4px rgba(0,0,0,0.1)',
                }}
              >
                <CheckCircleIcon 
                  sx={{ 
                    fontSize: 14,
                    color: theme.palette.mode === 'dark' 
                      ? 'rgba(76, 175, 80, 1)' 
                      : 'rgba(56, 142, 60, 1)',
                  }} 
                />
                <Typography
                  variant="caption"
                  sx={{
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    color: theme.palette.mode === 'dark' 
                      ? 'rgba(76, 175, 80, 1)' 
                      : 'rgba(56, 142, 60, 1)',
                  }}
                >
                  Safeguarded
                </Typography>
              </Box>
            ) : (
              <Button
                variant="contained"
                size="small"
                onClick={handleOpenReport}
                disabled={reportedOnce}
                sx={{ 
                  textTransform: 'none',
                  backgroundColor: remarkColor,
                  color: '#fff',
                  '&:hover': {
                    backgroundColor: theme.palette.mode === 'dark' 
                      ? 'rgba(33, 150, 243, 0.9)' 
                      : 'rgba(33, 150, 243, 0.85)',
                  },
                  px: 2.25,
                }}
              >
                {reportedOnce ? 'Reported' : 'Report'}
              </Button>
            )}
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
          PaperProps={{
            sx: {
              borderRadius: 3,
              backgroundColor: theme.palette.mode === 'dark' ? 'rgba(10,10,20,0.9)' : 'rgba(255,255,255,0.95)',
              backdropFilter: 'blur(20px)'
            }
          }}
        >
          <DialogTitle sx={{ pb: 1 }}>Report Post</DialogTitle>
          <DialogContent sx={{ pt: 1, overflow: 'visible' }}>
            <FormControl fullWidth required sx={{ mb: 2 }}>
              <InputLabel id="report-category-label">Violation Type</InputLabel>
              <Select
                labelId="report-category-label"
                id="report-category"
                label="Violation Type"
                value={reportCategory}
                onChange={(e) => setReportCategory(e.target.value)}
              >
                <MenuItem value={''} disabled>Select a category</MenuItem>
                <MenuItem value={'website_policy'}>Website Policy</MenuItem>
                <MenuItem value={'government_policy'}>Government Policy</MenuItem>
                <MenuItem value={'unethical_boundary'}>Unethical Boundary</MenuItem>
              </Select>
              {!reportCategory && (
                <FormHelperText error>Required</FormHelperText>
              )}
            </FormControl>
            <TextField
              autoFocus
              fullWidth
              label="Reason (optional)"
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              multiline
              minRows={3}
            />
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 2 }}>
              <Button onClick={handleCloseReport} disabled={reportSubmitting}>Cancel</Button>
              <Button variant="contained" onClick={handleSubmitReport} disabled={reportSubmitting || !reportCategory}>
                {reportSubmitting ? <CircularProgress size={18} color="inherit" /> : 'Submit'}
              </Button>
            </Box>
          </DialogContent>
        </Dialog>
  </>);
};

export default EventPopup;
