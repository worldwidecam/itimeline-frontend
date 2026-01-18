import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
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
  Button,
  CircularProgress,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText
} from '@mui/material';
import { 
  Close as CloseIcon, 
  Comment as RemarkIcon, 
  Event as EventIcon, 
  Person as PersonIcon, 
  AccessTime as AccessTimeIcon, 
  RateReview as RateReviewIcon, 
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import { Link as RouterLink } from 'react-router-dom';
import { EVENT_TYPES, EVENT_TYPE_COLORS } from './EventTypes';
import CreatorChip from './CreatorChip';
import config from '../../../config';
import PopupTimelineLanes from './PopupTimelineLanes';
import UserAvatar from '../../common/UserAvatar';
import VoteControls from './VoteControls';
import { submitReport } from '../../../utils/api';
import { castVote, getVoteStats, removeVote } from '../../../api/voteApi';
import { uiToBackend, backendToUi } from '../../../api/voteTypeConverter';
import { getCookie } from '../../../utils/cookies';

/**
 * ImageEventPopup - A specialized popup for image media events
 * Features a two-container layout:
 * - Left container (60%): Fixed image display with black background
 * - Right container (40%): Scrollable content area for event details
 * 
 * When open, it signals to TimelineV3 to pause its refresh interval to prevent
 * disruptions to media playback.
 */
const ImageEventPopup = ({ 
  event, 
  open, 
  onClose, 
  mediaSource,
  formatDate,
  formatEventDate,
  color,
  TypeIcon,
  setIsPopupOpen,
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
  // Level 1 report overlay state
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportedOnce, setReportedOnce] = useState(false);
  const [reportCategory, setReportCategory] = useState('');
  // Local snackbar for report submission feedback
  const [reportSnackOpen, setReportSnackOpen] = useState(false);
  // Vote pill state
  const [voteValue, setVoteValue] = useState(null);
  const [voteStats, setVoteStats] = useState({ promote_count: 0, demote_count: 0, user_vote: null });
  const totalVotes = (voteStats.promote_count || 0) + (voteStats.demote_count || 0);
  const positiveRatio = totalVotes > 0
    ? (voteStats.promote_count || 0) / totalVotes
    : 0.5;
  const [voteLoading, setVoteLoading] = useState(false);
  const [voteError, setVoteError] = useState(null);

  // Load vote stats when popup opens
  useEffect(() => {
    const loadVoteStats = async () => {
      if (!open || !event?.id) return;
      try {
        const token = getCookie('access_token') || localStorage.getItem('access_token');
        if (!token) {
          setVoteError('Not authenticated');
          return;
        }
        const stats = await getVoteStats(event.id, token);
        setVoteStats(stats);
        setVoteValue(backendToUi(stats.user_vote));
        setVoteError(null);
      } catch (error) {
        console.error('Error loading vote stats:', error);
        setVoteError('Failed to load votes');
      }
    };
    
    loadVoteStats();
  }, [open, event?.id]);

  // Handle vote changes
  const handleVoteChange = async (uiVoteType) => {
    const previousVote = voteValue;
    try {
      const token = getCookie('access_token') || localStorage.getItem('access_token');
      if (!token) {
        console.error('No authentication token found');
        setVoteError('Not authenticated');
        return;
      }

      setVoteLoading(true);
      setVoteError(null);
      setVoteValue(uiVoteType);
      
      const backendVoteType = uiToBackend(uiVoteType);
      const stats = backendVoteType === null
        ? await removeVote(event.id, token)
        : await castVote(event.id, backendVoteType, token);
      setVoteStats(stats);
      setVoteValue(backendToUi(stats.user_vote));
    } catch (error) {
      console.error('Error casting vote:', error);
      setVoteError(error.message || 'Failed to cast vote');
      setVoteValue(previousVote);
    } finally {
      setVoteLoading(false);
    }
  };
  
  // Image theme color
  const imageColor = '#009688'; // Teal for image theme (matching the color in README)
  
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
    if (typeof onClose === 'function') {
      onClose();
    }
  };
  
  // Direct close function for the X button
  const handleCloseButtonClick = () => {
    if (typeof onClose === 'function') {
      onClose();
    }
  };

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
      if (typeof setError === 'function') {
        setError('Unable to submit report: missing timeline or event id');
      }
      return;
    }
    if (!reportCategory) {
      return;
    }
    try {
      setReportSubmitting(true);
      if (typeof setError === 'function') setError('');
      await submitReport(timelineId, event.id, reportReason || '', reportCategory);
      setReportedOnce(true);
      setReportOpen(false);
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
              maxHeight: '90vh',
              overflow: 'hidden'
            },
          }}
        >
          {/* Left container - Fixed image display */}
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
            {/* The image itself - centered and fixed */}
            <motion.img 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              src={mediaSource} 
              alt={event.title || "Image Media"}
              style={{ 
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain',
                display: 'block',
                cursor: 'pointer',
              }} 
              onClick={(e) => {
                // Open image in new tab for full resolution view
                window.open(mediaSource, '_blank');
              }}
              onError={(e) => {
                console.error('Error loading image:', e);
                e.target.onerror = null;
                e.target.src = 'https://via.placeholder.com/400x300?text=Image+Not+Available';
              }}
            />
            
            {/* Fullscreen button overlay */}
            <Box
              sx={{
                position: 'absolute',
                bottom: 16,
                right: 16,
                bgcolor: 'rgba(0,0,0,0.5)',
                color: 'white',
                borderRadius: '50%',
                width: 40,
                height: 40,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                opacity: 0.7,
                transition: 'all 0.2s ease',
                '&:hover': {
                  opacity: 1,
                  transform: 'scale(1.1)'
                },
                zIndex: 5,
              }}
              onClick={() => window.open(mediaSource, '_blank')}
              title="View full size"
            >
              <Box component="span" sx={{ fontSize: 20 }}>⤢</Box>
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
                    color: imageColor, // Use the specific image color for the icon
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
                  background: `linear-gradient(90deg, ${imageColor} 0%, ${theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.2)' : 'rgba(0, 150, 136, 0.2)'} 100%)`,
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
                  <CreatorChip user={getUserData()} color={imageColor} />
                  
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
                          color: imageColor,
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
                          color: imageColor,
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
                    backgroundColor: imageColor,
                    color: '#fff',
                    '&:hover': {
                      backgroundColor: theme.palette.mode === 'dark' 
                        ? 'rgba(0, 150, 136, 0.9)' 
                        : 'rgba(0, 150, 136, 0.85)',
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
          
          {/* Success/Error Snackbar - Parent-driven */}
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
          {/* Local success snackbar for report submission */}
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

export default ImageEventPopup;
