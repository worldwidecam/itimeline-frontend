import React, { useState, useEffect } from 'react';
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
  TextField,
  Autocomplete,
  Button,
  CircularProgress,
  Alert,
  Snackbar,
} from '@mui/material';
import {
  Close as CloseIcon,
  Comment as RemarkIcon,
  Newspaper as NewsIcon,
  PermMedia as MediaIcon,
  Person as PersonIcon,
  Event as EventIcon,
  AccessTime as AccessTimeIcon,
  Add as AddIcon,
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import { Link as RouterLink } from 'react-router-dom';
import { EVENT_TYPES, EVENT_TYPE_COLORS } from './EventTypes';
import TagList from './cards/TagList';
import api from '../../../utils/api';  // Import API utility
import config from '../../../config';  // Import config to get API_URL

const EventPopup = ({ event, open, onClose }) => {
  const theme = useTheme();
  
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
  
  // Ensure we have a valid onClose handler
  const handleClose = (event, reason) => {
    console.log('EventPopup handleClose called', { event, reason });
    // Always close the dialog, even if onClose is not provided
    if (typeof onClose === 'function') {
      console.log('Calling onClose function');
      onClose();
    } else {
      console.warn('onClose is not a function:', onClose);
    }
  };
  
  // Direct close function for the X button
  const handleCloseButtonClick = () => {
    console.log('Close button clicked directly');
    // Force close the dialog
    if (typeof onClose === 'function') {
      console.log('Calling onClose from close button');
      onClose();
    } else {
      console.warn('onClose is not a function (from button):', onClose);
    }
  };

  const formatDate = (dateStr) => {
    try {
      if (!dateStr) return 'Invalid date';
      
      // Parse the ISO string into a Date object
      const date = parseISO(dateStr);
      
      // Format with "Published on" prefix, without seconds
      // Use explicit formatting to ensure consistency
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
      // Use explicit formatting to ensure consistency
      return format(date, 'MMM d, yyyy, h:mm a');
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

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

  const renderMedia = () => {
    console.log('EventPopup - Event data:', event);
    
    // Check all possible media source fields
    let mediaSource = event.media_url || event.mediaUrl || event.url;
    console.log('EventPopup - Selected media source:', mediaSource);
    
    if (!mediaSource) return null;
    
    // Handle relative URLs by prepending the API_URL
    if (mediaSource && !mediaSource.startsWith('http')) {
      // Remove any duplicate slashes that might occur when joining URLs
      const baseUrl = config.API_URL.endsWith('/') 
        ? config.API_URL.slice(0, -1) 
        : config.API_URL;
      
      mediaSource = mediaSource.startsWith('/') 
        ? `${baseUrl}${mediaSource}`
        : `${baseUrl}/${mediaSource}`;
      console.log('EventPopup - Converted to absolute URL:', mediaSource);
    }
    
    // Force reload the image to bypass cache (add timestamp)
    const timestamp = new Date().getTime();
    mediaSource = mediaSource.includes('?') 
      ? `${mediaSource}&t=${timestamp}` 
      : `${mediaSource}?t=${timestamp}`;
    console.log('EventPopup - Added timestamp to URL to bypass cache:', mediaSource);
    
    const mimeType = event.media_type || '';
    
    // First check if we have the new media_subtype field
    let isImage = false;
    let isVideo = false;
    let isAudio = false;
    
    // Make sure event is defined before accessing properties
    if (event && event.media_subtype) {
      // Use the new media_subtype field when available
      console.log('EventPopup - Using media_subtype:', event.media_subtype);
      isImage = event.media_subtype === 'image';
      isVideo = event.media_subtype === 'video';
      isAudio = event.media_subtype === 'audio';
    } else {
      // Fall back to the old detection method for backward compatibility
      // Enhanced media type detection based on file extension or MIME type
      isImage = mediaSource && (/\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(mediaSource) || (mimeType && mimeType.startsWith('image/')));
      isVideo = mediaSource && (/\.(mp4|webm|ogg|mov|avi|wmv|flv|mkv)$/i.test(mediaSource) || (mimeType && mimeType.startsWith('video/')));
      isAudio = mediaSource && (/\.(mp3|wav|ogg|aac|flac|m4a)$/i.test(mediaSource) || (mimeType && mimeType.startsWith('audio/')));
    }
    
    if (isImage) {
      return (
        <Box
          sx={{
            position: 'relative',
            width: '100%',
            borderRadius: theme.shape.borderRadius,
            overflow: 'hidden',
            mb: 3,
            boxShadow: theme.palette.mode === 'dark' 
              ? '0 8px 24px rgba(0,0,0,0.4)' 
              : '0 8px 24px rgba(0,0,0,0.1)',
          }}
        >
          <motion.img 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            src={mediaSource} 
            alt={event.title}
            style={{ 
              width: '100%', 
              maxHeight: '60vh',
              objectFit: 'contain',
              borderRadius: theme.shape.borderRadius,
              display: 'block',
            }} 
            onError={(e) => {
              console.error('Error loading image:', e);
              e.target.onerror = null;
              e.target.src = 'https://via.placeholder.com/400x300?text=Image+Not+Available';
            }}
          />
        </Box>
      );
    }
    
    if (isVideo) {
      return (
        <Box
          sx={{
            position: 'relative',
            width: '100%',
            borderRadius: theme.shape.borderRadius,
            overflow: 'hidden',
            mb: 3,
            boxShadow: theme.palette.mode === 'dark' 
              ? '0 8px 24px rgba(0,0,0,0.4)' 
              : '0 8px 24px rgba(0,0,0,0.1)',
          }}
        >
          <motion.video
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            controls
            style={{ 
              width: '100%', 
              maxHeight: '60vh',
              borderRadius: theme.shape.borderRadius,
              display: 'block',
            }}
          >
            <source src={mediaSource} type={mimeType || "video/mp4"} />
            Your browser does not support the video tag.
          </motion.video>
        </Box>
      );
    }
    
    if (isAudio) {
      return (
        <Box
          sx={{
            position: 'relative',
            width: '100%',
            borderRadius: theme.shape.borderRadius,
            p: 3,
            mb: 3,
            bgcolor: theme.palette.mode === 'dark' 
              ? 'rgba(0,0,0,0.2)' 
              : 'rgba(0,0,0,0.03)',
            boxShadow: theme.palette.mode === 'dark' 
              ? '0 4px 12px rgba(0,0,0,0.2)' 
              : '0 4px 12px rgba(0,0,0,0.05)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <MediaIcon 
            sx={{ 
              fontSize: 48, 
              mb: 2, 
              color: color,
              opacity: 0.8,
            }} 
          />
          <motion.audio
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            controls
            style={{ 
              width: '100%',
              maxWidth: '500px',
            }}
          >
            <source src={mediaSource} type={mimeType || "audio/mpeg"} />
            Your browser does not support the audio element.
          </motion.audio>
        </Box>
      );
    }
    
    // Fallback for unknown media types
    return (
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          borderRadius: theme.shape.borderRadius,
          p: 3,
          mb: 3,
          bgcolor: theme.palette.mode === 'dark' 
            ? 'rgba(0,0,0,0.2)' 
            : 'rgba(0,0,0,0.03)',
          boxShadow: theme.palette.mode === 'dark' 
            ? '0 4px 12px rgba(0,0,0,0.2)' 
            : '0 4px 12px rgba(0,0,0,0.05)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <MediaIcon 
          sx={{ 
            fontSize: 48, 
            mb: 2, 
            color: color,
            opacity: 0.8,
          }} 
        />
        <Link 
          href={mediaSource} 
          target="_blank" 
          rel="noopener noreferrer"
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1,
            color: color,
            p: 2,
            border: '1px dashed',
            borderColor: 'divider',
            borderRadius: 1,
            width: '100%',
            maxWidth: '500px',
            textDecoration: 'none',
            '&:hover': {
              bgcolor: theme.palette.mode === 'dark' 
                ? 'rgba(255,255,255,0.05)' 
                : 'rgba(0,0,0,0.03)',
            },
            transition: 'all 0.2s ease',
          }}
        >
          <MediaIcon />
          View Media
        </Link>
      </Box>
    );
  };

  // Initialize localEventData with event data
  useEffect(() => {
    if (event && !localEventData) {
      setLocalEventData(event);
    }
  }, [event]);

  // Fetch existing timelines when the popup opens
  useEffect(() => {
    if (open && event) {
      fetchExistingTimelines();
    }
  }, [open, event]);

  // Function to fetch existing timelines
  const fetchExistingTimelines = async () => {
    try {
      setLoadingTimelines(true);
      setError('');
      
      // Call the API to get all existing timelines
      const response = await api.get('/api/timeline-v3');
      
      // Filter out timelines that already contain this event
      // We'll need to check if the event is already in the timeline
      // This might require additional API calls or backend support
      setExistingTimelines(response.data || []);
    } catch (error) {
      console.error('Error fetching timelines:', error);
      setError('Failed to load timelines. Please try again.');
    } finally {
      setLoadingTimelines(false);
    }
  };

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

  // Handle snackbar close
  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') return;
    setSnackbarOpen(false);
  };

  if (!event) return null;

  return (
    <>
      <AnimatePresence>
        {open && (
          <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="md"
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
              border: theme.palette.mode === 'dark'
                ? '1px solid rgba(255,255,255,0.05)'
                : '1px solid rgba(0,0,0,0.05)',
            },
          }}
        >
          {/* Header with colored accent bar */}
          <Box
            sx={{
              position: 'relative',
              height: 8,
              bgcolor: color,
              mb: -1,
            }}
          />
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
                {event.title}
              </Typography>
            </Box>
            <IconButton 
              onClick={handleCloseButtonClick} 
              size="medium"
              aria-label="close"
              sx={{
                color: theme.palette.mode === 'dark' ? 'white' : 'rgba(0,0,0,0.6)',
                bgcolor: theme.palette.mode === 'dark'
                  ? 'rgba(255,255,255,0.05)'
                  : 'rgba(0,0,0,0.03)',
                '&:hover': {
                  bgcolor: theme.palette.mode === 'dark'
                    ? 'rgba(255,255,255,0.1)'
                    : 'rgba(0,0,0,0.05)',
                },
                transition: 'all 0.2s ease',
              }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>

          <Divider sx={{ opacity: 0.5 }} />

          <DialogContent 
            sx={{ 
              p: 3,
              pt: 3,
              pb: 3,
              display: 'flex',
              flexDirection: 'column',
              gap: 3,
            }}
          >
            {/* Main Content Area - varies by type but maintains consistent layout */}
            <Box>
              {/* Remark content */}
              {event && event.description && safeEventType === EVENT_TYPES.REMARK && (
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
              
              {/* News content */}
              {event && safeEventType === EVENT_TYPES.NEWS && (
                <Box>
                  {event.url && (
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
                        variant="subtitle1" 
                        sx={{ 
                          fontWeight: 600, 
                          mb: 1,
                          color: theme.palette.mode === 'dark'
                            ? 'rgba(255,255,255,0.9)'
                            : 'rgba(0,0,0,0.8)',
                        }}
                      >
                        Source URL
                      </Typography>
                      <Link 
                        href={event.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        sx={{
                          color: color,
                          textDecoration: 'none',
                          wordBreak: 'break-all',
                          display: 'inline-flex',
                          alignItems: 'center',
                          '&:hover': {
                            textDecoration: 'underline',
                          },
                        }}
                      >
                        <NewsIcon sx={{ mr: 1, fontSize: 18 }} />
                        {event.url}
                      </Link>
                    </Paper>
                  )}
                  
                  {event.description && (
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
                </Box>
              )}

              {/* Media content */}
              {event && safeEventType === EVENT_TYPES.MEDIA && (
                <Box>
                  {renderMedia()}
                  {event.description && (
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
                </Box>
              )}
            </Box>

            {/* Event metadata */}
            <Box>
              {/* Tags with Tag a Timeline button */}
              <Box sx={{ mb: 3, position: 'relative' }}>
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
                
                {(localEventData?.tags || event.tags) && (localEventData?.tags || event.tags).length > 0 && (
                  <TagList tags={localEventData?.tags || event.tags} />
                )}
                
                {/* Tag a Timeline button - smaller and positioned at bottom left */}
                <Box 
                  onClick={() => setTagSectionExpanded(!tagSectionExpanded)}
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    fontSize: '0.75rem',
                    mt: event.tags && event.tags.length > 0 ? 1 : 0,
                    color: theme.palette.mode === 'dark'
                      ? 'rgba(255,255,255,0.6)'
                      : 'rgba(0,0,0,0.5)',
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
                    renderOption={(props, option) => (
                      <li {...props}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <span style={{ 
                            color: theme.palette.primary.main,
                            fontSize: '1rem',
                            marginRight: '4px'
                          }}>#</span>
                          {option.name}
                        </Box>
                      </li>
                    )}
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
              
              {/* Event details card */}
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
                  {/* Timeline date */}
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
                          color: theme.palette.mode === 'dark'
                            ? 'rgba(255,255,255,0.7)'
                            : 'rgba(0,0,0,0.6)',
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
                          {formatEventDate(event.event_date)}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                  
                  {/* Created date */}
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
                        color: theme.palette.mode === 'dark'
                          ? 'rgba(255,255,255,0.7)'
                          : 'rgba(0,0,0,0.6)',
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
                          {formatDate(event.created_at).replace('Published on ', '')}
                        </Typography>
                    </Box>
                  </Box>
                  
                  {/* Created by */}
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
                        to={`/profile/${event.created_by}`}
                        sx={{ 
                          color: color,
                          textDecoration: 'none',
                          '&:hover': {
                            textDecoration: 'underline'
                          }
                        }}
                      >
                        {event.created_by_username || "Unknown"}
                      </Link>
                    </Box>
                  </Box>
                </Box>
              </Paper>
            </Box>
          </DialogContent>
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
              variant="filled"
              sx={{ width: '100%' }}
            >
              {error || success}
            </Alert>
          </Snackbar>
        </Dialog>
        )}
      </AnimatePresence>
    </>
  );
};

export default EventPopup;
