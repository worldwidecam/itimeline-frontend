import React from 'react';
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
} from '@mui/material';
import {
  Close as CloseIcon,
  Comment as RemarkIcon,
  Newspaper as NewsIcon,
  PermMedia as MediaIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import { Link as RouterLink } from 'react-router-dom';
import { EVENT_TYPES, EVENT_TYPE_COLORS } from './EventTypes';
import TagList from './cards/TagList';
import config from '../../../config';  // Import config to get API_URL

const EventPopup = ({ event, open, onClose }) => {
  const theme = useTheme();
  
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
    
    // Enhanced media type detection
    const isImage = /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(mediaSource) || mimeType.startsWith('image/');
    const isVideo = /\.(mp4|webm|ogg|mov|avi|wmv|flv|mkv)$/i.test(mediaSource) || mimeType.startsWith('video/');
    const isAudio = /\.(mp3|wav|ogg|aac|flac|m4a)$/i.test(mediaSource) || mimeType.startsWith('audio/');
    
    if (isImage) {
      return (
        <img 
          src={mediaSource} 
          alt={event.title}
          style={{ 
            maxWidth: '100%', 
            maxHeight: '500px',
            objectFit: 'contain',
            borderRadius: theme.shape.borderRadius,
          }} 
          onError={(e) => {
            console.error('Error loading image:', e);
            e.target.onerror = null;
            e.target.src = 'https://via.placeholder.com/400x300?text=Image+Not+Available';
          }}
        />
      );
    }
    
    if (isVideo) {
      return (
        <video
          controls
          style={{ 
            maxWidth: '100%', 
            maxHeight: '500px',
            borderRadius: theme.shape.borderRadius,
          }}
        >
          <source src={mediaSource} type={mimeType || "video/mp4"} />
          Your browser does not support the video tag.
        </video>
      );
    }
    
    if (isAudio) {
      return (
        <audio
          controls
          style={{ 
            width: '100%',
            maxWidth: '500px',
          }}
        >
          <source src={mediaSource} type={mimeType || "audio/mpeg"} />
          Your browser does not support the audio element.
        </audio>
      );
    }
    
    // Fallback for unknown media types
    return (
      <Link 
        href={mediaSource} 
        target="_blank" 
        rel="noopener noreferrer"
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          color: color,
          p: 2,
          border: '1px dashed',
          borderColor: 'divider',
          borderRadius: 1,
        }}
      >
        <MediaIcon />
        View Media
      </Link>
    );
  };

  if (!event) return null;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      closeAfterTransition
      disableEscapeKeyDown={false}
      PaperComponent={motion.div}
      PaperProps={{
        sx: {
          borderRadius: 2,
          overflow: 'visible',
          backgroundColor: theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.9)' : 'rgba(255,255,255,0.9)',
          backdropFilter: 'blur(10px)',
        },
      }}
    >
      <DialogTitle 
        sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          borderBottom: 1,
          borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TypeIcon sx={{ color }} />
          <Typography variant="h6" component="div">
            {event.title}
          </Typography>
        </Box>
        <IconButton 
          onClick={handleCloseButtonClick} 
          size="small"
          aria-label="close"
          sx={{
            color: 'white',
            bgcolor: 'rgba(255, 255, 255, 0.1)',
            '&:hover': {
              bgcolor: 'rgba(255, 255, 255, 0.2)',
            }
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ mt: 2 }}>
        <Box sx={{ mb: 3 }}>
          {/* Main Content Area - varies by type but maintains consistent layout */}
          {event && event.description && safeEventType === EVENT_TYPES.REMARK && (
            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
              {event.description}
            </Typography>
          )}
          
          {event && safeEventType === EVENT_TYPES.NEWS && (
            <>
              {event.url && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                    Source URL:
                  </Typography>
                  <Link href={event.url} target="_blank" rel="noopener noreferrer">
                    {event.url}
                  </Link>
                </Box>
              )}
              {event.description && (
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                  {event.description}
                </Typography>
              )}
            </>
          )}

          {event && safeEventType === EVENT_TYPES.MEDIA && (
            <>
              {renderMedia()}
              {event.description && (
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                  {event.description}
                </Typography>
              )}
            </>
          )}
        </Box>

        <Box sx={{ mt: 'auto' }}>
          <TagList tags={event.tags} />
          {event.event_date && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'right', mt: 1 }}>
              Timeline Date: {formatEventDate(event.event_date)}
            </Typography>
          )}
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'right', mt: 0.5 }}>
            <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center' }}>
              {event.created_by_avatar ? (
                <Avatar 
                  src={event.created_by_avatar} 
                  alt={event.created_by_username || "User"} 
                  sx={{ 
                    width: 16, 
                    height: 16, 
                    mr: 0.5, 
                    fontSize: '0.75rem' 
                  }} 
                />
              ) : (
                <PersonIcon fontSize="small" sx={{ mr: 0.5, fontSize: '0.75rem' }} />
              )}
              Created by:{' '}
              <Link
                component={RouterLink}
                to={`/profile/${event.created_by}`}
                color="text.secondary"
                sx={{ 
                  ml: 0.5,
                  textDecoration: 'none',
                  '&:hover': {
                    textDecoration: 'underline'
                  }
                }}
              >
                {event.created_by_username || "Unknown"}
              </Link>
            </Box>
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'right', mt: 0.5 }}>
            {formatDate(event.created_at)}
          </Typography>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default EventPopup;
