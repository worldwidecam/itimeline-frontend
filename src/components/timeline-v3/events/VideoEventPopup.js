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
  ExpandMore as ExpandMoreIcon,
  Fullscreen as FullscreenIcon,
  VolumeUp as VolumeUpIcon,
  Settings as SettingsIcon,
  RateReview as RateReviewIcon,
  CheckCircle as CheckCircleIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import { Link as RouterLink } from 'react-router-dom';
import { EVENT_TYPES, EVENT_TYPE_COLORS } from './EventTypes';
import PopupTimelineLanes from './PopupTimelineLanes';
import UserAvatar from '../../common/UserAvatar';
import VoteControls from './VoteControls';
import { submitReport } from '../../../utils/api';
import { useEventVote } from '../../../hooks/useEventVote';
import RichContentRenderer from './RichContentRenderer';

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
  laneProps
}) => {
  const theme = useTheme();
  const location = useLocation();
  const [tagSectionExpanded, setTagSectionExpanded] = useState(false);
  const [localEventData, setLocalEventData] = useState(event);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [videoElement, setVideoElement] = useState(null);
  // Prefer Cloudinary Player when a Cloudinary public_id is available
  const [useCloudinaryPlayer, setUseCloudinaryPlayer] = useState(!!(event && event.cloudinary_id));
  // Level 1 report overlay state
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportedOnce, setReportedOnce] = useState(false);
  const [reportCategory, setReportCategory] = useState(''); // required
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
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
    
    let fullUrl = mediaSource;
    
    if (isCloudinaryUrl) {
      fullUrl = mediaSource;
    }
    else if (mediaSource && mediaSource.startsWith('/')) {
      fullUrl = `http://localhost:5000${mediaSource}`;
    }
    
    // Add all possible URLs to try
    if (fullUrl) {
      videoSources.push(fullUrl);
    }
    
    if (mediaSource && mediaSource.startsWith('/uploads/')) {
      videoSources.push(`http://localhost:5000${mediaSource}`);
    }
    
    if (event.cloudinary_id) {
      const cloudName = 'dnjwvuxn7';
      // For videos, use video/upload path and try common video extensions
      const baseUrl = `https://res.cloudinary.com/${cloudName}/video/upload/${event.cloudinary_id}`;
      videoSources.push(`${baseUrl}.mp4`);
      videoSources.push(`${baseUrl}.webm`);
      videoSources.push(`${baseUrl}.mov`);
      // Also try without extension in case Cloudinary auto-detects
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

  // Current user (from localStorage) for delete permissions
  let currentUserId = null;
  try {
    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
    currentUserId = storedUser?.id || null;
  } catch (_) {}

  const isSiteOwner = String(currentUserId) === '1';
  const isEventCreator = currentUserId && String(currentUserId) === String(userData?.id);
  const canDelete = Boolean(onDelete && (isSiteOwner || isEventCreator));
  
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
        videoElement.play().catch(err => {
          console.log('Auto-play prevented by browser:', err);
          // Modern browsers require user interaction before auto-playing videos with sound
          // We could potentially add a muted attribute and then play
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

  // Toggle fullscreen for the video
  const toggleFullscreen = () => {
    if (!videoElement) return;
    
    if (!isFullscreen) {
      if (videoElement.requestFullscreen) {
        videoElement.requestFullscreen();
      } else if (videoElement.webkitRequestFullscreen) {
        videoElement.webkitRequestFullscreen();
      } else if (videoElement.msRequestFullscreen) {
        videoElement.msRequestFullscreen();
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
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
          closeAfterTransition
          disableEscapeKeyDown={false}
          PaperComponent={motion.div}
          PaperProps={{
            initial: { opacity: 0, y: 20, scale: 0.98 },
            animate: { opacity: 1, y: 0, scale: 1 },
            exit: { opacity: 0, y: 20, scale: 0.98 },
            transition: { duration: 0.3 },
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
              // Two-container layout
              display: 'flex',
              flexDirection: 'row',
              height: '90vh',
              maxHeight: '90vh'
            },
          }}
        >
          {/* Left container - Fixed video display */}
          <Box
            sx={{
              width: '60%',
              height: '100%',
              position: 'relative',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              bgcolor: 'black',
              overflow: 'hidden',
              borderRight: '1px solid',
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
                        src={`https://player.cloudinary.com/embed/?cloud_name=dnjwvuxn7&public_id=${encodeURIComponent(cloudinaryPublicId)}&profile=cld-default&autoplay=true&controls=true`}
                        allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
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
                    autoPlay={true}
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
                        console.error('All video sources failed to load. Falling back to Cloudinary Player.');
                        setUseCloudinaryPlayer(true);
                      }
                    }}
                  >
                    {videoSources.map((src, index) => (
                      <source 
                        key={index} 
                        src={src} 
                        type={event.media_type || 'video/mp4'} 
                      />
                    ))}
                    Your browser does not support the video tag.
                  </video>
                );
              })()}
              
              {/* Fullscreen button removed - Cloudinary Player provides its own fullscreen control */}
            </Box>
          </Box>
          
          {/* Right container - Scrollable content */}
          <Box
            sx={{
              width: '40%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
            }}
          >
            {/* Title area */}
            <DialogTitle 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                p: 3,
                pb: 2,
              }}
            >
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
                    color: videoColor,
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
                }}
              >
                <CloseIcon />
              </IconButton>
            </DialogTitle>
            
            <Divider sx={{ opacity: 0.5 }} />
            
            {/* Scrollable content area */}
            <DialogContent
              sx={{
                height: '100%',
                p: 4,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'auto',
                position: 'relative',
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
            
            {/* Vote Controls (Bottom Left) + Report Button & Status Indicators (Bottom Right) */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1.5, px: 3, pb: 2, position: 'relative' }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
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
              <Box
                sx={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  bottom: 6,
                  textAlign: 'center',
                  pointerEvents: 'none',
                }}
              >
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontSize: '0.7rem', opacity: 0.7 }}
                >
                  ID: {event?.id ?? '--'}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              {canDelete && (
                <Button
                  variant="outlined"
                  size="small"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={handleOpenDelete}
                  sx={{ textTransform: 'none', px: 2 }}
                >
                  Delete
                </Button>
              )}
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
                    backgroundColor: videoColor,
                    color: '#fff',
                    '&:hover': {
                      backgroundColor: theme.palette.mode === 'dark' 
                        ? 'rgba(74, 20, 140, 0.9)' 
                        : 'rgba(74, 20, 140, 0.85)',
                    },
                    px: 2.25,
                  }}
                >
                  {reportedOnce ? 'Reported' : 'Report'}
                </Button>
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
        {/* Level 1 Report Overlay */}
        <Dialog
          open={reportOpen}
          onClose={handleCloseReport}
          maxWidth="xs"
          fullWidth
          closeAfterTransition
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
        </>
      )}
    </AnimatePresence>
  );
};

export default VideoEventPopup;
