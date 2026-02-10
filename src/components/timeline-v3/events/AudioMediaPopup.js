import React, { useState, useEffect, useRef } from 'react';
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
  MusicNote as MusicNoteIcon,
  Person as PersonIcon,
  Event as EventIcon,
  AccessTime as AccessTimeIcon,
  Add as AddIcon,
  ExpandMore as ExpandMoreIcon,
  VolumeUp as VolumeUpIcon,
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
import AudioWaveformVisualizer from '../../../components/AudioWaveformVisualizer';

/**
 * AudioMediaPopup - A specialized popup for audio media events
 * Features a two-container layout:
 * - Left container (60%): Fixed audio visualization with black background
 * - Right container (40%): Scrollable content area for event details
 * 
 * When open, it signals to TimelineV3 to pause its refresh interval to prevent
 * disruptions to media playback.
 */
const AudioMediaPopup = ({ 
  event, 
  open, 
  onClose, 
  onDelete,
  mediaSource,
  formatDate,
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
  const [localEventData, setLocalEventData] = useState(null);
  const audioVisualizerRef = useRef(null);
  // Level 1 report overlay state
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportedOnce, setReportedOnce] = useState(false);
  const [reportCategory, setReportCategory] = useState('');
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
  
  // Audio theme color
  const audioColor = '#e65100'; // Orange for audio theme
  
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

  // Current user (from localStorage) for delete permissions
  let currentUserId = null;
  try {
    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
    currentUserId = storedUser?.id || null;
  } catch (_) {}

  const isSiteOwner = String(currentUserId) === '1';
  const isEventCreator = currentUserId && String(currentUserId) === String(userData?.id);
  const canDelete = Boolean(onDelete && (isSiteOwner || isEventCreator));

  // Set local event data when the event prop changes
  useEffect(() => {
    if (event) {
      setLocalEventData(event);
    }
  }, [event]);

  // Safely get the event data with fallbacks
  const eventData = localEventData || event || {};
  
  // Handle close button click
  const handleCloseButtonClick = () => {
    if (typeof onClose === 'function') {
      onClose();
    }
  };

  const deriveTimelineId = () => {
    try {
      const match = location?.pathname?.match(/timeline-v3\/(\d+)/);
      if (match && match[1]) return Number(match[1]);
    } catch (_) {}
    return (localEventData || event)?.timeline_id || (localEventData || event)?.timelineId || null;
  };

  const handleOpenReport = () => {
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
    const ev = localEventData || event;
    if (!timelineId || !ev?.id) {
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
      await submitReport(timelineId, ev.id, reportReason || '', reportCategory);
      setReportedOnce(true);
      setReportOpen(false);
      setReportSnackOpen(true);
    } catch (e) {
      // surface error via Snackbar upstream props if desired
    } finally {
      setReportSubmitting(false);
    }
  };

  return (
    <>
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      closeAfterTransition
      TransitionComponent={motion.div}
      TransitionProps={{
        initial: { opacity: 0, y: 20, scale: 0.98 },
        animate: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, y: 20, scale: 0.98 },
        transition: { duration: 0.3 }
      }}
      PaperProps={{
        component: motion.div,
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
        },
      }}
    >
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', md: 'row' },
        height: { xs: 'auto', md: '80vh' },
        maxHeight: '80vh'
      }}>
        {/* Left Container - Audio Visualization */}
        <Box sx={{ 
          flex: { xs: '1', md: '3' },
          position: 'relative',
          bgcolor: 'black',
          height: { xs: '300px', md: 'auto' }
        }}>
          {/* Close button */}
          <IconButton
            aria-label="close"
            onClick={handleCloseButtonClick}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: 'white',
              bgcolor: 'rgba(0, 0, 0, 0.5)',
              zIndex: 10,
              '&:hover': {
                bgcolor: 'rgba(0, 0, 0, 0.7)',
              }
            }}
          >
            <CloseIcon />
          </IconButton>

          {/* Audio Visualizer */}
          <Box sx={{ 
            width: '100%', 
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <AudioWaveformVisualizer 
              ref={audioVisualizerRef}
              audioUrl={mediaSource} 
              title={eventData.title || "Audio"}
              previewMode={false}
              showTitle={false}
              compactMode={true}
            />
          </Box>
        </Box>

        {/* Right Container - Event Details */}
        <Box sx={{ 
          flex: { xs: '1', md: '2' },
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          bgcolor: theme.palette.background.paper,
          position: 'relative'
        }}>
          {/* Event Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 3, pb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
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
                  color: audioColor,
                  mr: 2
                }}
              >
                <MusicNoteIcon fontSize="medium" />
              </Box>
              <Typography 
                variant="h6" 
                component="div"
                sx={{ 
                  fontWeight: 600,
                  color: theme.palette.mode === 'dark'
                    ? 'rgba(255,255,255,0.95)'
                    : 'rgba(0,0,0,0.85)',
                }}
              >
                {eventData.title || "Untitled Event"}
              </Typography>
            </Box>
            <IconButton
              onClick={onClose}
              sx={{
                color: theme.palette.mode === 'dark'
                  ? 'rgba(255,255,255,0.7)'
                  : 'rgba(0,0,0,0.54)',
              }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
          
          <Divider sx={{ opacity: 0.5 }} />
          
          {/* Scrollable content area */}
          <Box sx={{ 
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
              background: `linear-gradient(90deg, ${audioColor} 0%, ${theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.2)' : 'rgba(230, 81, 0, 0.2)'} 100%)`,
            }
          }}>
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
                <CreatorChip user={userData} color={audioColor} />
                
                {/* Timeline Date with icon */}
                {eventData.event_date && (
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
                        color: audioColor,
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
                        {formatEventDate(eventData.event_date)}
                      </Typography>
                    </Box>
                  </Box>
                )}
                
                {/* Published Date with icon */}
                {eventData.created_at && (
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
                        color: audioColor,
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
                        {formatDate(eventData.created_at || eventData.createdAt).replace('Published on ', '')}
                      </Typography>
                    </Box>
                  </Box>
                )}
              </Box>
            </Paper>
            
            <Divider sx={{ my: 2 }} />
            
            {/* Event Description */}
            {eventData.description && (
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
                  {eventData.description}
                </Typography>
              </Box>
            )}
            
            <Divider sx={{ my: 2 }} />
            
            {/* Tags & Timelines Section */}
            <Box sx={{ mb: 3 }}>
              <PopupTimelineLanes {...laneProps} />
            </Box>
          </Box>

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
                    backgroundColor: audioColor,
                    color: '#fff',
                    '&:hover': {
                      backgroundColor: theme.palette.mode === 'dark'
                        ? 'rgba(230, 81, 0, 0.9)'
                        : 'rgba(230, 81, 0, 0.85)',
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
      </Box>
          
      {/* Snackbar for notifications */}
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
  );
};

export default AudioMediaPopup;
