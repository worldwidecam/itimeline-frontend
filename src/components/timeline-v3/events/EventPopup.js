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
  const typeColors = EVENT_TYPE_COLORS[event?.type] || EVENT_TYPE_COLORS[EVENT_TYPES.REMARK];
  const color = theme.palette.mode === 'dark' ? typeColors.dark : typeColors.light;

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

  const TypeIcon = {
    [EVENT_TYPES.REMARK]: RemarkIcon,
    [EVENT_TYPES.NEWS]: NewsIcon,
    [EVENT_TYPES.MEDIA]: MediaIcon,
  }[event?.type] || RemarkIcon;

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
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperComponent={motion.div}
      PaperProps={{
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -20 },
        style: {
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
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ mt: 2 }}>
        <Box sx={{ mb: 3 }}>
          {/* Main Content Area - varies by type but maintains consistent layout */}
          {event.type === EVENT_TYPES.REMARK && (
            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
              {event.description}
            </Typography>
          )}
          
          {event.type === EVENT_TYPES.NEWS && (
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

          {event.type === EVENT_TYPES.MEDIA && (
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
