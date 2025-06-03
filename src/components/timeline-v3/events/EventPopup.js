import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link as RouterLink } from 'react-router-dom';
import ImageEventPopup from './ImageEventPopup';
import VideoEventPopup from './VideoEventPopup';
import NewsEventPopup from './NewsEventPopup';
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
  Avatar
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
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import { EVENT_TYPES, EVENT_TYPE_COLORS } from './EventTypes';
import TagList from './cards/TagList';
import api from '../../../utils/api';
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
const EventPopup = ({ event, open, onClose, setIsPopupOpen }) => {
  const theme = useTheme();
  
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
  // Store the updated event data after adding a tag
  const [localEventData, setLocalEventData] = useState(null);
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
  
  // Safely get colors with multiple fallbacks
  let color = defaultColor;
  try {
    const typeColorSet = EVENT_TYPE_COLORS[safeEventType];
    if (typeColorSet) {
      color = theme.palette.mode === 'dark' ? 
        (typeColorSet.dark || defaultDarkColor) : 
        (typeColorSet.light || defaultColor);
    }
  } catch (error) {
    console.error('Error getting event color:', error);
    // Use default color as fallback
  }
  
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
  
  // Fetch timelines when the tag section is expanded
  useEffect(() => {
    if (tagSectionExpanded && existingTimelines.length === 0) {
      fetchExistingTimelines();
    }
  }, [tagSectionExpanded]);

  // Function to add the event to the selected timeline
  const handleAddToTimeline = async () => {
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
      await api.post(`/api/timeline-v3/${selectedTimeline.id}/add-event/${event.id}`);
      
      // Create the new tag name based on the timeline name
      const newTagName = selectedTimeline.name.toLowerCase();
      
      // Update the local event data with the new tag
      const updatedEvent = { ...event };
      if (!updatedEvent.tags) {
        updatedEvent.tags = [];
      }
      
      // Only add the tag if it doesn't already exist
      if (!updatedEvent.tags.includes(newTagName)) {
        updatedEvent.tags.push(newTagName);
        setLocalEventData(updatedEvent);
      }
      
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

  // Determine if this is an image media event
  const isImageMedia = () => {
    if (safeEventType !== EVENT_TYPES.MEDIA) return false;
    
    const mediaSource = event.media_url || event.mediaUrl || event.url;
    if (!mediaSource) return false;
    
    const mimeType = event.media_type || '';
    
    // Check if we have the media_subtype field
    if (event.media_subtype) {
      return event.media_subtype === 'image';
    }
    
    // Fallback to extension or MIME type check
    return (/\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(mediaSource) || 
            (mimeType && mimeType.startsWith('image/')));
  };
  
  // Determine if this is a video media event
  const isVideoMedia = () => {
    if (safeEventType !== EVENT_TYPES.MEDIA) return false;
    
    const mediaSource = event.media_url || event.mediaUrl || event.url;
    if (!mediaSource) return false;
    
    const mimeType = event.media_type || '';
    
    // Check if we have the media_subtype field
    if (event.media_subtype) {
      return event.media_subtype === 'video';
    }
    
    // Fallback to extension or MIME type check
    return (/\.(mp4|webm|ogg|mov|avi|wmv|flv|mkv)$/i.test(mediaSource) || 
            (mimeType && mimeType.startsWith('video/')));
  };
  
  // Determine if this is an audio media event
  const isAudioMedia = () => {
    if (safeEventType !== EVENT_TYPES.MEDIA) return false;
    
    const mediaSource = event.media_url || event.mediaUrl || event.url;
    if (!mediaSource) return false;
    
    const mimeType = event.media_type || '';
    
    // Check if we have the media_subtype field
    if (event.media_subtype) {
      return event.media_subtype === 'audio';
    }
    
    // Fallback to extension or MIME type check
    return (/\.(mp3|wav|ogg|aac|flac|m4a|wma)$/i.test(mediaSource) || 
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
  if (isNews) {
    return (
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
      />
    );
  }
  
  // For image media, use the specialized ImageEventPopup component
  if (useImagePopup) {
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
      />
    );
  }

  // For all other event types, use the standard popup
  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
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
                    color: color,
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
          
          <DialogContent sx={{ p: 3, pt: 2 }}>
            {/* Audio Media Player - Only shown for audio media in the standard popup */}
            {/* This section is now handled by the AudioMediaPopup component */}
            <Divider sx={{ mb: 3, opacity: 0.5 }} />
            
            {/* Event content */}
            {event.description && (
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
                  {event.description}
                </Typography>
              </Paper>
            )}
            
            {/* Tags section */}
            <Box sx={{ mb: 3 }}>
              {(event.tags && event.tags.length > 0) && (
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
                  <TagList tags={localEventData?.tags || event.tags} />
                </Box>
              )}
              
              {/* Timeline tagging system */}
              <Box sx={{ mb: 3 }}>
                <Box 
                  onClick={() => {
                    setTagSectionExpanded(!tagSectionExpanded);
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
                    // Only show options that start with the input text
                    filterOptions={(options, state) => {
                      // Don't show any options if the input is empty
                      if (!state.inputValue) return [];
                      
                      // Filter options that start with the input text (case insensitive)
                      return options.filter(option => 
                        option.name.toLowerCase().startsWith(state.inputValue.toLowerCase())
                      );
                    }}
                    renderInput={(params) => (
                      <TextField 
                        {...params} 
                        label="Search Timeline" 
                        variant="outlined"
                        helperText="Type to search for a timeline"
                        InputProps={{
                          ...params.InputProps,
                          endAdornment: (
                            <React.Fragment>
                              {loadingTimelines ? <CircularProgress color="inherit" size={20} /> : null}
                              {params.InputProps.endAdornment}
                            </React.Fragment>
                          ),
                        }}
                      />
                    )}
                    renderOption={(props, option) => {
                      // Extract key from props to avoid React warning
                      const { key, ...otherProps } = props;
                      return (
                        <li key={option.id || key} {...otherProps}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <span style={{ 
                              color: theme.palette.primary.main,
                              fontSize: '1rem',
                              marginRight: '4px'
                            }}>#</span>
                            {option.name}
                          </Box>
                        </li>
                      );
                    }}
                    noOptionsText="Type to search for timelines"
                  />
                  
                  {error && (
                    <Alert severity="error" sx={{ mt: 2 }}>
                      {error}
                    </Alert>
                  )}
                  
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<AddIcon />}
                      disabled={!selectedTimeline || addingToTimeline}
                      onClick={handleAddToTimeline}
                      sx={{ 
                        borderRadius: 2,
                        textTransform: 'none',
                        px: 2,
                      }}
                    >
                      {addingToTimeline ? (
                        <CircularProgress size={24} color="inherit" />
                      ) : (
                        'Tag Timeline'
                      )}
                    </Button>
                  </Box>
                  </Paper>
                )}
              </Box>
            </Box>
            
            {/* Event metadata */}
            <Paper
              elevation={0}
              sx={{
                p: 3,
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
                variant="subtitle2" 
                sx={{ 
                  mb: 2,
                  color: theme.palette.mode === 'dark'
                    ? 'rgba(255,255,255,0.7)'
                    : 'rgba(0,0,0,0.6)',
                  fontWeight: 500,
                }}
              >
                Event Details
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {/* Creator information */}
                {event.created_by_username && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar 
                      src={event.created_by_avatar} 
                      alt={event.created_by_username || "User"} 
                      sx={{ 
                        width: 32, 
                        height: 32,
                        fontSize: '0.875rem',
                        bgcolor: theme.palette.mode === 'dark'
                          ? 'rgba(255,255,255,0.1)'
                          : 'rgba(0,0,0,0.1)',
                      }} 
                    >
                      {event.created_by_username ? event.created_by_username.charAt(0).toUpperCase() : <PersonIcon fontSize="small" />}
                    </Avatar>
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
                        Created by
                      </Typography>
                      <Link
                        component={RouterLink}
                        to={`/profile/${event.created_by || event.createdBy}`}
                        sx={{ 
                          color: color,
                          textDecoration: 'none',
                          '&:hover': {
                            textDecoration: 'underline'
                          }
                        }}
                      >
                        {event.created_by_username || event.createdByUsername || "Unknown"}
                      </Link>
                    </Box>
                  </Box>
                )}
                {/* Event date */}
                {event.event_date && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Typography 
                      variant="body2" 
                      color="textSecondary"
                      sx={{ minWidth: 100 }}
                    >
                      Timeline Date:
                    </Typography>
                    <Typography variant="body2">
                      {formatEventDate(event.event_date)}
                    </Typography>
                  </Box>
                )}
                
                {/* Published date */}
                {event.created_at && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Typography 
                      variant="body2" 
                      color="textSecondary"
                      sx={{ minWidth: 100 }}
                    >
                      Published:
                    </Typography>
                    <Typography variant="body2">
                      {formatDate(event.created_at)}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Paper>
          </DialogContent>
          
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
  );
};

export default EventPopup;
