import { getGlassDialogPaperSx, getGlassInputSx, getGlassSquareActionButtonSx, getGlassPillActionButtonSx } from '../../../utils/formStyleGuide';
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import CreatorChip from './CreatorChip';
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
  Link,
  Avatar,
  Chip,
  Divider,
  Snackbar,
  Alert,
  TextField,
  Autocomplete,
  Button,
  CircularProgress,
  Menu,
  ListItemIcon,
  ListItemText,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
} from '@mui/material';
import {
  Close as CloseIcon,
  PermMedia as MediaIcon,
  Person as PersonIcon,
  Event as EventIcon,
  AccessTime as AccessTimeIcon,
  Add as AddIcon,
  Fullscreen as FullscreenIcon,
  VolumeUp as VolumeUpIcon,
  Settings as SettingsIcon,
  RateReview as RateReviewIcon,
  CheckCircle as CheckCircleIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  MoreHoriz as MoreHorizIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import { Link as RouterLink } from 'react-router-dom';
import { EVENT_TYPES, EVENT_TYPE_COLORS } from './EventTypes';
import { useAuth } from '../../../contexts/AuthContext';
import PopupTimelineLanes from './PopupTimelineLanes';
import UserAvatar from '../../common/UserAvatar';
import VoteControls from './VoteControls';
import { submitReport } from '../../../utils/api';
import { useEventVote } from '../../../hooks/useEventVote';
import RichContentRenderer from './RichContentRenderer';
import config from '../../../config';
import EventCommentDrawer from './EventCommentDrawer';
import HashtagIcon from '../../common/HashtagIcon';
import CommentIcon from '@mui/icons-material/Comment';

/**
 * VideoEventPopup - A specialized popup for video media events
 * Features a two-container layout:
 * - Left container (60%): Fixed video display with black background and enhanced controls
 * - Right container (40%): Scrollable content area for event details
 * 
 * When open, it signals to TimelineV3 to pause its refresh interval to prevent
 * disruptions to media playback.
 */
const VideoEventPopup = ({ 
  event, 
  open, 
  onClose, 
  onDelete,
  onEdit,
  mediaSource,
  formatDate,
  setIsPopupOpen,
  formatEventDate,
  color,
  TypeIcon,
  snackbarOpen,
  handleSnackbarClose,
  error,
  success,
  existingTimelines,
  selectedTimeline,
  setSelectedTimeline,
  loadingTimelines,
  addingToTimeline,
  setError,
  handleAddToTimeline,
  fetchExistingTimelines,
  isInReview = false,
  isSafeguarded = false,
  laneProps,
  commentsOpen,
  setCommentsOpen,
  isVotingMode,
  setIsVotingMode,
  myTagVote,
  handleClearHashtagVote,
  votingInProgress,
}) => {
  const theme = useTheme();
  const location = useLocation();
  const { isGuest } = useAuth();
  const [tagSectionExpanded, setTagSectionExpanded] = useState(false);
  const [localEventData, setLocalEventData] = useState(event);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [videoElement, setVideoElement] = useState(null);
  const [videoFailed, setVideoFailed] = useState(false);
  // Prefer Cloudinary Player when a Cloudinary public_id is available
  const [useCloudinaryPlayer, setUseCloudinaryPlayer] = useState(!!(event && event.cloudinary_id));
  // Level 1 report overlay state
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportedOnce, setReportedOnce] = useState(false);
  const [reportCategory, setReportCategory] = useState(''); // required
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [actionAnchorEl, setActionAnchorEl] = useState(null);
  // Local snackbar for report submission feedback
  const [reportSnackOpen, setReportSnackOpen] = useState(false);
  const {
    value: voteValue,
    totalVotes,
    positiveRatio,
    isLoading: voteLoading,
    error: voteError,
    handleVoteChange,
  } = useEventVote(event?.id, { enabled: open });
  
  // Video theme color
  const videoColor = '#4a148c'; // Deep purple for video theme
  
  // Get user data with fallbacks
  // Helper function to prepare video sources (similar to MediaCard)
  const prepareVideoSources = (mediaSource) => {
    let videoSources = [];
    
    const isCloudinaryUrl = (
      (mediaSource && (
        mediaSource.includes('cloudinary.com') || 
        mediaSource.includes('res.cloudinary')
      )) ||
      (event.media_type && event.media_type.includes('cloudinary'))
    );
    
    // Check if it's an R2 URL
    const isR2Url = mediaSource && (
      mediaSource.includes('r2.dev') || 
      mediaSource.includes('itimeline-media')
    );
    
    let fullUrl = mediaSource;
    
    if (isCloudinaryUrl || isR2Url) {
      fullUrl = mediaSource;
    }
    else if (mediaSource && mediaSource.startsWith('/')) {
      fullUrl = `${config.API_URL}${mediaSource}`;
    }
    
    // Add all possible URLs to try
    if (fullUrl) {
      videoSources.push(fullUrl);
    }
    
    if (mediaSource && mediaSource.startsWith('/uploads/')) {
      videoSources.push(`${config.API_URL}${mediaSource}`);
    }
    
    // Only try Cloudinary fallback if it's likely a Cloudinary ID
    // (Cloudinary IDs in this project are typically 20 chars without slashes)
    const looksLikeCloudinaryId = event.cloudinary_id && 
                                !event.cloudinary_id.includes('/') && 
                                !event.cloudinary_id.includes('.');

    if (looksLikeCloudinaryId && !isCloudinaryUrl && !isR2Url) {
      const cloudName = 'dnjwvuxn7';
      const baseUrl = `https://res.cloudinary.com/${cloudName}/video/upload/${event.cloudinary_id}`;
      videoSources.push(`${baseUrl}.mp4`);
      videoSources.push(`${baseUrl}.webm`);
      videoSources.push(`${baseUrl}.mov`);
      videoSources.push(baseUrl);
    }
    
    return videoSources.filter(Boolean);
  };

  // Derive Cloudinary public_id from a Cloudinary URL if cloudinary_id is missing
  const getCloudinaryPublicIdFromUrl = (url) => {
    try {
      if (!url || typeof url !== 'string') return '';
      if (!url.includes('res.cloudinary.com') && !url.includes('cloudinary.com')) return '';
      const parts = url.split('/');
      const uploadIdx = parts.findIndex(p => p === 'upload');
      if (uploadIdx === -1 || uploadIdx >= parts.length - 1) return '';
      const afterUpload = parts.slice(uploadIdx + 1).join('/');
      const afterNoVersion = afterUpload.replace(/^v\d+\//, '');
      const publicId = afterNoVersion.replace(/\.[^\.\/?]+(\?.*)?$/, '');
      return publicId;
    } catch (_) {
      return '';
    }
  };

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

  // Current user (from localStorage) for personal ownership checks
  let currentUserId = null;
  let isSiteAdmin = false;
  let currentTimelineRole = null;

  const pathMatch = location.pathname.match(/timeline(?:-v3)?\/(\d+)/);
  const currentTimelineIdFromUrl = pathMatch ? pathMatch[1] : null;

  try {
    const userDataStore = JSON.parse(localStorage.getItem('user') || '{}');
    currentUserId = userDataStore?.id || null;

    const passportKey = currentUserId ? `user_passport_${currentUserId}` : null;
    if (passportKey) {
      const passport = JSON.parse(localStorage.getItem(passportKey) || '{}');
      isSiteAdmin = Boolean(passport?.is_site_admin);

      if (currentTimelineIdFromUrl) {
        const membership = (passport?.memberships || []).find((m) => Number(m?.timeline_id) === Number(currentTimelineIdFromUrl));
        currentTimelineRole = String(membership?.member_role || membership?.role || '').toLowerCase();
      }
    }
  } catch (_) {}

  const isSiteOwner = String(currentUserId) === '1';
  const isEventCreator = currentUserId && String(currentUserId) === String(userData?.id);
  const isCommunityModerator = currentTimelineRole === 'admin' || currentTimelineRole === 'moderator';
  const isEditLocked = Boolean(event?.edit_locked || localEventData?.edit_locked);
  
  // Community moderators can only delete events that were CREATED on this timeline, not just tagged
  const isEventCreatedOnCurrentTimeline = Number(event?.timeline_id) === Number(currentTimelineIdFromUrl);
  const canDeleteAsModerator = isCommunityModerator && isEventCreatedOnCurrentTimeline;
  
  const canDelete = Boolean(onDelete && (isSiteOwner || isSiteAdmin || isEventCreator || canDeleteAsModerator));
  const canEdit = Boolean(onEdit && (isSiteOwner || isSiteAdmin || (isEventCreator && !isEditLocked)));
  const canOpenActionMenu = canEdit || canDelete || (!isSafeguarded && !isInReview);
  
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
  
  // Auto-play video when popup opens
  useEffect(() => {
    if (open && videoElement) {
      // Small delay to ensure the video is fully loaded
      const timer = setTimeout(() => {
        // We start unmuted as requested
        videoElement.muted = false;
        videoElement.play().catch(err => {
          console.log('Auto-play prevented by browser:', err);
        });
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [open, videoElement]);
  
  // Fetch timelines when the tag section is expanded
  useEffect(() => {
    if (tagSectionExpanded && existingTimelines.length === 0) {
      // If we have a function to fetch timelines, call it
      if (typeof fetchExistingTimelines === 'function') {
        fetchExistingTimelines();
      }
    }
  }, [tagSectionExpanded, existingTimelines.length, fetchExistingTimelines]);

  // Ensure we have a valid onClose handler
  const handleClose = (event, reason) => {
    // Pause video when closing the popup
    if (videoElement && !videoElement.paused) {
      videoElement.pause();
    }
    
    if (typeof onClose === 'function') {
      onClose();
    }
  };
  
  // Direct close function for the X button
  const handleCloseButtonClick = () => {
    // Pause video when closing the popup
    if (videoElement && !videoElement.paused) {
      videoElement.pause();
    }
    
    if (typeof onClose === 'function') {
      onClose();
    }
  };

  const toggleFullscreen = () => {
    if (!videoElement) return;
    
    if (!isFullscreen) {
      if (videoElement.requestFullscreen) {
        videoElement.requestFullscreen();
      } else if (videoElement.webkitRequestFullscreen) {
        videoElement.webkitRequestFullscreen();
      } else if (videoElement.mozRequestFullScreen) {
        videoElement.mozRequestFullScreen();
      } else if (videoElement.msRequestFullscreen) {
        videoElement.msRequestFullscreen();
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
      setIsFullscreen(false);
    }
  };

  // Handle fullscreen change events
  React.useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(
        document.fullscreenElement || 
        document.webkitFullscreenElement || 
        document.msFullscreenElement
      );
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
    };
  }, []);

  if (!event) return null;

  const deriveTimelineId = () => {
    try {
      const match = location?.pathname?.match(/timeline-v3\/(\d+)/);
      if (match && match[1]) return Number(match[1]);
    } catch (_) {}
    return event?.timeline_id || event?.timelineId || null;
  };

  const handleOpenReport = () => {
    setReportReason('');
    setReportOpen(true);
  };

  const handleOpenDelete = () => {
    setDeleteDialogOpen(true);
  };

  const handleCloseDelete = () => {
    setDeleteDialogOpen(false);
  };

  const handleActionMenuOpen = (event) => {
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
      if (typeof setError === 'function') {
        setError('Unable to submit report: missing timeline or event id');
      }
      return;
    }
    if (!reportCategory) {
      // require selection
      return;
    }
    try {
      setReportSubmitting(true);
      if (typeof setError === 'function') setError('');
      await submitReport(timelineId, event.id, reportReason || '', reportCategory);
      setReportedOnce(true);
      setReportOpen(false);
      // Show local snackbar confirmation
      setReportSnackOpen(true);
    } catch (e) {
      const msg = e?.response?.data?.error || e.message || 'Failed to submit report';
      if (typeof setError === 'function') setError(msg);
    } finally {
      setReportSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
        {/* Local snackbar for report submission */}
        <Snackbar
          open={reportSnackOpen}
          autoHideDuration={3000}
          onClose={() => setReportSnackOpen(false)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert onClose={() => setReportSnackOpen(false)} severity="success" sx={{ width: '100%' }}>
            Report submitted
          </Alert>
        </Snackbar>
        <Dialog
          open={open}
          onClose={handleClose}
          maxWidth="lg" // Larger dialog for the two-container layout
          fullWidth
          container={typeof document !== 'undefined' ? (document.fullscreenElement || document.webkitFullscreenElement || undefined) : undefined}
          onTouchStart={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
          onTouchEnd={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onMouseMove={(e) => e.stopPropagation()}
          onMouseUp={(e) => e.stopPropagation()}
          onWheel={(e) => e.stopPropagation()}
          sx={{
            '& .MuiDialog-container': {
              overscrollBehavior: 'none',
            },
            '& .MuiBackdrop-root': {
              touchAction: 'none',
              overscrollBehavior: 'none',
            }
          }}
          closeAfterTransition
          disableEscapeKeyDown={false}
          PaperComponent={motion.div}
          PaperProps={{
            initial: { opacity: 0, y: 20, scale: 0.98 },
            animate: { opacity: 1, y: 0, scale: 1 },
            exit: { opacity: 0, y: 20, scale: 0.98 },
            transition: { duration: 0.3 },
            sx: {
              borderRadius: { xs: 2, sm: 3 },
              overflow: 'hidden',
              backgroundColor: theme.palette.mode === 'dark' 
                ? 'rgba(10,10,20,0.92)' 
                : 'rgba(255,255,255,0.92)',
              backdropFilter: 'blur(20px)',
              boxShadow: theme.palette.mode === 'dark'
                ? '0 10px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)'
                : '0 10px 40px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.05)',
              border: 'none',
              // Responsive layout
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              height: { xs: 'auto', md: '90vh' },
              maxHeight: { xs: 'calc(100% - 16px)', md: '90vh' },
              width: { xs: 'calc(100% - 16px)', sm: 'calc(100% - 32px)', md: '90vw' },
              maxWidth: { md: '1200px' },
              margin: { xs: 1, sm: 2, md: 'auto' },
              overflowY: { xs: 'auto', md: 'hidden' }
            },
            component: motion.div,
            drag: "x", // Left/Right swipe to close
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
          {/* Left container - Fixed video display */}
          <Box
            sx={{
              width: { xs: '100%', md: '60%' },
              height: { xs: '250px', sm: '350px', md: '100%' },
              position: 'relative',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              bgcolor: 'black',
              overflow: 'hidden',
              borderRight: { xs: 'none', md: '1px solid' },
              borderBottom: { xs: '1px solid', md: 'none' },
              borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
            }}
          >
            {/* The video itself - centered and fixed */}
            <Box
              sx={{
                width: '100%',
                height: '100%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                position: 'relative',
              }}
            >
              {(() => {
                const derivedPublicId = getCloudinaryPublicIdFromUrl(mediaSource || event?.media_url || event?.url);
                const cloudinaryPublicId = (event && event.cloudinary_id) || derivedPublicId;
                const shouldUsePlayer = (useCloudinaryPlayer || !!cloudinaryPublicId) && !!cloudinaryPublicId;
                
                if (shouldUsePlayer) {
                  // Render Cloudinary player
                  return (
                    <Box sx={{ width: '100%', height: '100%' }}>
                      <iframe
                        title="cloudinary-player"
                        src={`https://player.cloudinary.com/embed/?cloud_name=dnjwvuxn7&public_id=${encodeURIComponent(cloudinaryPublicId)}&profile=cld-default&autoplay=true&muted=false&controls=true`}
                        allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                        allowFullScreen
                        style={{
                          width: '100%',
                          height: '100%',
                          border: 0,
                          borderRadius: 8,
                          background: 'black'
                        }}
                      />
                    </Box>
                  );
                }
                
                // Render native video player as fallback
                const videoSources = prepareVideoSources(mediaSource);
                return (
                  <video
                    ref={el => setVideoElement(el)}
                    controls
                    autoPlay={false}
                    muted={false}
                    playsInline
                    webkit-allowsfullscreen="true"
                    mozallowsfullscreen="true"
                    allowFullScreen={true}
                    onDoubleClick={toggleFullscreen}
                    style={{ 
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                      backgroundColor: 'black',
                      borderRadius: 8,
                      display: 'block',
                    }}
                    onError={(e) => {
                      console.error('Error loading video:', e);
                      const currentSrc = e.target.src;
                      const currentIndex = videoSources.indexOf(currentSrc);
                      
                      if (currentIndex >= 0 && currentIndex < videoSources.length - 1) {
                        console.log(`Trying next video source: ${videoSources[currentIndex + 1]}`);
                        e.target.src = videoSources[currentIndex + 1];
                      } else {
                        console.error('All video sources failed to load.');
                        setVideoFailed(true);
                      }
                    }}
                  >
                    {videoSources.map((src, index) => {
                      const ext = (typeof src === 'string' && src.includes('.')) 
                        ? src.split('.').pop().toLowerCase() 
                        : '';
                      const typeMap = {
                        mp4: 'video/mp4',
                        webm: 'video/webm',
                        mov: 'video/quicktime',
                        m4v: 'video/x-m4v',
                        ogg: 'video/ogg'
                      };
                      const mime = typeMap[ext] || (event.media_type === 'video' ? 'video/mp4' : undefined);
                      
                      return (
                        <source 
                          key={index} 
                          src={src} 
                          {...(mime ? { type: mime } : {})} 
                        />
                      );
                    })}
                    Your browser does not support the video tag.
                  </video>
                );
              })()}
              
              {/* Fallback Overlay for when video fails */}
              {(videoFailed || useCloudinaryPlayer) && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: 'rgba(0,0,0,0.8)',
                    zIndex: 2,
                    p: 3,
                    textAlign: 'center',
                  }}
                >
                  <Typography variant="body1" sx={{ color: 'white', mb: 2 }}>
                    Unable to preview video in this window
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<OpenInNewIcon />}
                    onClick={() => window.open(mediaSource, '_blank')}
                    sx={{
                      bgcolor: videoColor,
                      '&:hover': { bgcolor: `${videoColor}dd` }
                    }}
                  >
                    Open in New Window
                  </Button>
                </Box>
              )}
              
              {/* Fullscreen button removed - Cloudinary Player provides its own fullscreen control */}
            </Box>
          </Box>
          
          {/* Right container - Scrollable content */}
            <Box
              sx={{
                width: { xs: '100%', md: '40%' },
                height: { xs: 'auto', md: '100%' },
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                minHeight: { xs: '400px', md: 'auto' }
              }}
            >
            {/* Title area */}
            <DialogTitle 
              sx={{ 
                p: { xs: 2, sm: 3 },
                pb: 2,
              }}
            >
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
                      color: videoColor,
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
                    {event.title || "Untitled Video"}
                  </Typography>
                </Box>
                <IconButton 
                  edge="end" 
                  color="inherit" 
                  onClick={handleCloseButtonClick} 
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
            
            <Divider sx={{ opacity: 0.5 }} />
            
            {/* Scrollable content area */}
            <DialogContent
              sx={{
                height: { xs: 'auto', md: '100%' },
                p: 4,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'auto',
                position: 'relative',
                touchAction: 'pan-y',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 4,
                  background: `linear-gradient(90deg, ${videoColor} 0%, ${theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.2)' : 'rgba(74, 20, 140, 0.2)'} 100%)`,
                }
              }}
            >
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
                  <CreatorChip user={getUserData()} color={videoColor} />
                  
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
                          color: videoColor,
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
                          color: videoColor,
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
                          {formatDate(event.created_at || event.createdAt).replace('Published on ', '')}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                </Box>
              </Paper>
              
              <Divider sx={{ my: 2 }} />
              
              {/* Event Description */}
              {(event.content || event.description) && (
                <Box sx={{ mb: 3 }}>
                  {event.content ? (
                    <RichContentRenderer content={event.content} theme={theme} />
                  ) : (
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
                  )}
                </Box>
              )}
              
              <Divider sx={{ my: 2 }} />
              
              {/* Timelines Lanes Section */}
              <Box sx={{ mb: 3 }}>
                  <PopupTimelineLanes {...laneProps} />
                </Box>
                </DialogContent>
                
                <Divider sx={{ opacity: 0.3 }} />
                
                {/* Standardized Footer */}
                <Box sx={{ px: 3, py: 2, mt: 'auto', bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, pt: 1 }}>
                <CreatorChip user={getUserData()} color={videoColor} />
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
                 {myTagVote ? (
                  <Chip
                    icon={<HashtagIcon sx={{ fontSize: '14px !important', color: `${videoColor} !important` }} />}
                    label={myTagVote.replace(/^#+/, '')}
                    onClick={handleClearHashtagVote}
                    onDelete={handleClearHashtagVote}
                    disabled={votingInProgress}
                    size="small"
                    sx={{
                      height: 32,
                      borderRadius: '10px',
                      bgcolor: `${videoColor}22`,
                      color: videoColor,
                      border: `1px solid ${videoColor}40`,
                      fontWeight: 600,
                      fontSize: '0.75rem',
                      cursor: votingInProgress ? 'not-allowed' : 'pointer',
                      opacity: votingInProgress ? 0.6 : 1,
                    }}
                  />
                ) : (
                  <IconButton
                    size="small"
                    onClick={() => setIsVotingMode(!isVotingMode)}
                    disabled={votingInProgress}
                    sx={{
                      bgcolor: isVotingMode ? videoColor : `${videoColor}18`,
                      color: isVotingMode ? '#fff' : videoColor,
                      border: `1px solid ${videoColor}40`,
                      borderRadius: '10px',
                      width: 32,
                      height: 32,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: votingInProgress ? 'not-allowed' : 'pointer',
                      opacity: votingInProgress ? 0.6 : 1,
                      '&:hover': {
                        bgcolor: isVotingMode ? videoColor : `${videoColor}28`,
                      }
                    }}
                  >
                    <Typography sx={{ fontSize: '0.9rem', fontWeight: 800 }}>#</Typography>
                  </IconButton>
                )}
                <IconButton
                  size="small"
                  onClick={() => setCommentsOpen(true)}
                  sx={{
                    bgcolor: `${videoColor}18`,
                    color: videoColor,
                    border: `1px solid ${videoColor}40`,
                    borderRadius: '10px',
                    px: 1.5,
                    height: 32,
                    display: 'flex',
                    gap: 0.5,
                    alignItems: 'center',
                    '&:hover': {
                      bgcolor: `${videoColor}28`,
                    }
                  }}
                >
                  <CommentIcon sx={{ fontSize: 16 }} />
                  <Typography sx={{ fontSize: '0.75rem', fontWeight: 600 }}>Comment</Typography>
                </IconButton>
                {canOpenActionMenu && (
                  <>
                    <IconButton
                      size="small"
                      onClick={handleActionMenuOpen}
                      sx={{
                        bgcolor: `${videoColor}18`,
                        color: videoColor,
                        border: `1px solid ${videoColor}40`,
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
          </Box>
          
          {/* Success/Error Snackbar - Positioned inside the Dialog */}
          <Snackbar
            open={snackbarOpen}
            autoHideDuration={6000}
            onClose={handleSnackbarClose}
            anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            sx={{
              position: 'absolute',
              top: '16px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: 'calc(100% - 48px)',
              maxWidth: '400px',
              zIndex: 9999
            }}
          >
            <Alert 
              onClose={handleSnackbarClose} 
              severity={error ? "error" : "success"} 
              sx={{ width: '100%' }}
            >
              {error || success}
            </Alert>
          </Snackbar>
            {/* Comments Drawer */}
            <EventCommentDrawer
              eventId={event.id}
              open={commentsOpen}
              onClose={() => setCommentsOpen(false)}
              eventCreatorId={event.created_by_id}
              eventColor={videoColor}
            />
        </Dialog>
        <Dialog
          open={deleteDialogOpen}
          onClose={handleCloseDelete}
          container={typeof document !== 'undefined' ? (document.fullscreenElement || document.webkitFullscreenElement || undefined) : undefined}
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
        {/* Level 1 Report Overlay */}
        <Dialog
          open={reportOpen}
          onClose={handleCloseReport}
          maxWidth="xs"
          fullWidth
          container={typeof document !== 'undefined' ? (document.fullscreenElement || document.webkitFullscreenElement || undefined) : undefined}
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
        </>
      )}
    </AnimatePresence>
  );
};

export default VideoEventPopup;
