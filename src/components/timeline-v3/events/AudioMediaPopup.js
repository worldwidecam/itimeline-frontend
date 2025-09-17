import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import CreatorChip from './CreatorChip';
import {
  Dialog,
  DialogTitle,
  DialogContent,
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
  VolumeUp as VolumeUpIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import { Link as RouterLink } from 'react-router-dom';
import { EVENT_TYPES, EVENT_TYPE_COLORS } from './EventTypes';
import TagList from './cards/TagList';
import AudioWaveformVisualizer from '../../../components/AudioWaveformVisualizer';
import { submitReport } from '../../../utils/api';

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
  fetchExistingTimelines
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
  // Local snackbar for report submission feedback
  const [reportSnackOpen, setReportSnackOpen] = useState(false);
  
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
          border: theme.palette.mode === 'dark'
            ? '1px solid rgba(255,255,255,0.05)'
            : '1px solid rgba(0,0,0,0.05)',
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
          {/* Header with colored accent bar and gradient */}
          <Box
            sx={{
              height: 8,
              background: `linear-gradient(90deg, ${audioColor} 0%, ${audioColor}99 50%, ${audioColor}44 100%)`,
            }}
          />
          
          <Box sx={{ p: 3 }}>
          {/* Event Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
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
              <TypeIcon fontSize="medium" />
            </Box>
            <Box>
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
          </Box>

          {/* Creator Chip - Moved outside description box */}
          <CreatorChip user={userData} color={audioColor} sx={{ mb: 3 }} />
          
          {/* Event Content */}
          {eventData.description && (
            <Paper
              elevation={0}
              sx={{
                p: 3,
                mb: 3,
                borderRadius: 2,
                bgcolor: theme.palette.mode === 'dark'
                  ? 'rgba(0,0,0,0.2)'
                  : 'rgba(0,0,0,0.02)',
                border: '1px solid',
                borderColor: theme.palette.mode === 'dark'
                  ? 'rgba(255,255,255,0.05)'
                  : 'rgba(0,0,0,0.05)',
              }}
            >
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
            </Paper>
          )}
          
          {/* Tags section */}
          <Box sx={{ mb: 3 }}>
            {(eventData.tags && eventData.tags.length > 0) && (
              <Box sx={{ mb: 2 }}>
                <Typography 
                  variant="subtitle2" 
                  sx={{ 
                    mb: 1.5,
                    color: theme.palette.mode === 'dark'
                      ? 'rgba(255,255,255,0.7)'
                      : 'rgba(0,0,0,0.6)',
                    fontWeight: 500,
                  }}
                >
                  Tags
                </Typography>
                <TagList tags={localEventData?.tags || eventData.tags} />
              </Box>
            )}
            
            {/* Timeline tagging system */}
            <Box sx={{ mb: 3 }}>
              <Box 
                onClick={() => {
                  setTagSectionExpanded(!tagSectionExpanded);
                  if (!tagSectionExpanded) {
                    fetchExistingTimelines();
                  }
                }}
                sx={{ 
                  display: 'flex',
                  alignItems: 'center',
                  fontSize: '0.9rem',
                  mb: tagSectionExpanded ? 2 : 0,
                  color: theme.palette.mode === 'dark'
                    ? 'rgba(255,255,255,0.7)'
                    : 'rgba(0,0,0,0.6)',
                  cursor: 'pointer',
                  '&:hover': {
                    color: theme.palette.primary.main,
                  },
                  transition: 'color 0.2s ease',
                }}
              >
                <span style={{ 
                  color: theme.palette.primary.main,
                  fontSize: '0.9rem',
                  marginRight: '4px',
                }}>#</span>
                Tag a Timeline
                <ExpandMoreIcon 
                  fontSize="small" 
                  sx={{ 
                    fontSize: '0.9rem',
                    ml: 0.5,
                    transform: tagSectionExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s ease',
                  }} 
                />
              </Box>
              
              {tagSectionExpanded && (
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    bgcolor: theme.palette.mode === 'dark'
                      ? 'rgba(0,0,0,0.2)'
                      : 'rgba(0,0,0,0.02)',
                    border: '1px solid',
                    borderColor: theme.palette.mode === 'dark'
                      ? 'rgba(255,255,255,0.05)'
                      : 'rgba(0,0,0,0.05)',
                  }}
                >
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    sx={{ mb: 2 }}
                  >
                    Add this event to an existing timeline:
                  </Typography>
                  
                  <Autocomplete
                    id="timeline-select"
                    options={existingTimelines}
                    loading={loadingTimelines}
                    getOptionLabel={(option) => option.name}
                    isOptionEqualToValue={(option, value) => option.id === value.id}
                    value={selectedTimeline}
                    onChange={(event, newValue) => {
                      setSelectedTimeline(newValue);
                      setError('');
                    }}
                    filterOptions={(options, state) => {
                      if (!state.inputValue) return [];
                      return options.filter(option => 
                        option.name.toLowerCase().startsWith(state.inputValue.toLowerCase())
                      );
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Search timelines"
                        variant="outlined"
                        size="small"
                        fullWidth
                        InputProps={{
                          ...params.InputProps,
                          endAdornment: (
                            <>
                              {loadingTimelines ? <CircularProgress color="inherit" size={20} /> : null}
                              {params.InputProps.endAdornment}
                            </>
                          ),
                        }}
                      />
                    )}
                    sx={{ mb: 2 }}
                  />
                  
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<AddIcon />}
                    onClick={handleAddToTimeline}
                    disabled={!selectedTimeline || addingToTimeline}
                    fullWidth
                    size="small"
                  >
                    {addingToTimeline ? (
                      <>
                        <CircularProgress size={16} color="inherit" sx={{ mr: 1 }} />
                        Adding...
                      </>
                    ) : (
                      'Add to Timeline'
                    )}
                  </Button>
                </Paper>
              )}
            </Box>
          </Box>
          
          {/* Event Metadata */}
          <Box sx={{ mt: 'auto' }}>
            <Divider sx={{ mb: 2 }} />
            
            {/* Creator Info - Removed as we're using CreatorChip */}
            
            {/* Event Date - Moved to first position */}
            {eventData.event_date && (
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
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
                    mr: 1.5
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
                        : 'rgba(0,0,0,0.4)',
                    }}
                  >
                    Timeline Date
                  </Typography>
                  <Typography 
                    variant="body2"
                    sx={{ 
                      color: theme.palette.mode === 'dark'
                        ? 'rgba(255,255,255,0.9)'
                        : 'rgba(0,0,0,0.8)',
                    }}
                  >
                    {formatEventDate(eventData.event_date)}
                  </Typography>
                </Box>
              </Box>
            )}
            
            {/* Published Date - Moved to second position */}
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
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
                  mr: 1.5
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
                      : 'rgba(0,0,0,0.4)',
                  }}
                >
                  Published
                </Typography>
                <Typography 
                  variant="body2"
                  sx={{ 
                    color: theme.palette.mode === 'dark'
                      ? 'rgba(255,255,255,0.9)'
                      : 'rgba(0,0,0,0.8)',
                  }}
                >
                  {formatDate(eventData.created_at || eventData.createdAt).replace('Published on ', '')}
                </Typography>
              </Box>
            </Box>
            {/* Report action - Level 1 */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1, pr: 2, pb: 2 }}>
              <Button
                variant="contained"
                size="small"
                onClick={handleOpenReport}
                disabled={reportedOnce}
                sx={{ 
                  textTransform: 'none',
                  bgcolor: audioColor,
                  color: 'white',
                  boxShadow: 'none',
                  '&:hover': {
                    bgcolor: `${audioColor}E6`,
                    boxShadow: 'none'
                  },
                  borderRadius: 1.5,
                  px: 2.25,
                }}
              >
                {reportedOnce ? 'Reported' : 'Report'}
              </Button>
            </Box>
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
