import React, { useState } from 'react';
import {
  Typography,
  IconButton,
  Link,
  useTheme,
  Box,
  Chip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Avatar,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Movie as MediaIcon,
  Link as LinkIcon,
  Event as EventIcon,
  AccessTime as AccessTimeIcon,
  MoreVert as MoreVertIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import { Link as RouterLink } from 'react-router-dom';
import { EVENT_TYPES, EVENT_TYPE_COLORS } from '../EventTypes';
import TagList from './TagList';
import EventPopup from '../EventPopup';
import PageCornerButton from '../PageCornerButton';
import config from '../../../../config';  // Import config to get API_URL

const MediaCard = ({ event, onEdit, onDelete, isSelected }) => {
  const theme = useTheme();
  const [popupOpen, setPopupOpen] = useState(false);
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const typeColors = EVENT_TYPE_COLORS[EVENT_TYPES.MEDIA];
  const color = theme.palette.mode === 'dark' ? typeColors.dark : typeColors.light;

  // Debug log for event data
  console.log('MediaCard event data:', event);
  console.log('MediaCard tags:', event.tags);

  const handleMenuOpen = (e) => {
    e.stopPropagation(); // Prevent event bubbling to parent (card click)
    
    // If the card is not already selected, select it first
    if (!isSelected && onEdit && typeof onEdit === 'function') {
      // We're using onEdit as a proxy to get to the parent component's onEventSelect
      // This is a bit of a hack, but it works because onEdit is passed from the same parent
      // that would handle selection
      onEdit({ type: 'select', event });
      
      // Delay opening the menu slightly to allow the card to move into position
      setTimeout(() => {
        setMenuAnchorEl(e.currentTarget);
      }, 300);
    } else {
      // If already selected, just open the menu
      setMenuAnchorEl(e.currentTarget);
    }
  };

  const handleMenuClose = (e) => {
    if (e) e.stopPropagation(); // Prevent event bubbling
    setMenuAnchorEl(null);
  };

  const handleEdit = (e) => {
    if (e) e.stopPropagation(); // Prevent event bubbling
    handleMenuClose();
    onEdit(event);
  };

  const handleDelete = (e) => {
    if (e) e.stopPropagation(); // Prevent event bubbling
    handleMenuClose();
    onDelete(event);
  };

  const handleDetailsClick = () => {
    setPopupOpen(true);
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

  const limitDescription = (text) => {
    if (!text) return '';
    const words = text.split(/\s+/);
    if (words.length <= 15) return text;
    return words.slice(0, 15).join(' ') + '...';
  };

  const renderMedia = () => {
    // Debug logs to see what data we're receiving
    console.log('MediaCard event data:', event);
    console.log('Media sources:', {
      mediaUrl: event.mediaUrl,
      media_url: event.media_url,
      url: event.url
    });
    
    // Check all possible media source fields to ensure we find any media content
    let mediaSource = event.media_url || event.mediaUrl || event.url;
    console.log('Selected media source:', mediaSource);
    
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
      console.log('Converted to absolute URL:', mediaSource);
    }

    // Force reload the image to bypass cache (add timestamp)
    const timestamp = new Date().getTime();
    mediaSource = mediaSource.includes('?') 
      ? `${mediaSource}&t=${timestamp}` 
      : `${mediaSource}?t=${timestamp}`;
    console.log('Added timestamp to URL to bypass cache:', mediaSource);

    // Enhanced media type detection with more file extensions
    const isImage = /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(mediaSource);
    const isVideo = /\.(mp4|webm|ogg|mov|avi|wmv|flv|mkv)$/i.test(mediaSource);
    const isAudio = /\.(mp3|wav|ogg|aac|flac|m4a)$/i.test(mediaSource);

    // Also check MIME type if available
    const mimeType = event.media_type || '';
    console.log('Media type:', mimeType);
    const isMimeImage = mimeType.startsWith('image/');
    const isMimeVideo = mimeType.startsWith('video/');
    const isMimeAudio = mimeType.startsWith('audio/');
    console.log('Media type detection:', { isImage, isVideo, isAudio, isMimeImage, isMimeVideo, isMimeAudio });
    
    // Combine extension and MIME checks
    const isMediaImage = isImage || isMimeImage;
    const isMediaVideo = isVideo || isMimeVideo;
    const isMediaAudio = isAudio || isMimeAudio;
    
    console.log('Final media type detection:', { isMediaImage, isMediaVideo, isMediaAudio });

    if (isMediaImage) {
      return (
        <Box 
          sx={{ 
            width: '100%',
            height: '250px',
            borderRadius: 2,
            overflow: 'hidden',
            mb: 2,
          }}
        >
          <img
            src={mediaSource}
            alt={event.title}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
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

    if (isMediaVideo) {
      return (
        <Box 
          sx={{ 
            width: '100%',
            height: '250px',
            borderRadius: 2,
            overflow: 'hidden',
            mb: 2,
          }}
        >
          <video
            controls
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          >
            <source src={mediaSource} type={mimeType || "video/mp4"} />
            Your browser does not support the video tag.
          </video>
        </Box>
      );
    }

    if (isMediaAudio) {
      return (
        <Box 
          sx={{ 
            width: '100%',
            mb: 2,
            p: 2,
            backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
            borderRadius: 2,
          }}
        >
          <audio
            controls
            style={{ width: '100%' }}
          >
            <source src={mediaSource} type={mimeType || "audio/mpeg"} />
            Your browser does not support the audio element.
          </audio>
        </Box>
      );
    }

    // Fallback for unknown media types - show as a link
    return (
      <Box 
        sx={{ 
          width: '100%',
          mb: 2,
          p: 2,
          backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
          borderRadius: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Link 
          href={mediaSource} 
          target="_blank" 
          rel="noopener noreferrer"
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            color: color,
          }}
        >
          <MediaIcon />
          View Media
        </Link>
      </Box>
    );
  };

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        whileHover={{ y: -4 }}
        whileTap={{ scale: 0.98 }}
        className="relative w-full"
        style={{ perspective: '1000px' }}
      >
        <motion.div
          className={`
            relative overflow-hidden rounded-xl p-4
            ${theme.palette.mode === 'dark' ? 'bg-black/40' : 'bg-white/80'}
            backdrop-blur-md border
            ${theme.palette.mode === 'dark' ? 'border-white/5' : 'border-black/5'}
            shadow-lg
          `}
        >
          {/* Page corner button for details */}
          <PageCornerButton 
            onClick={handleDetailsClick} 
            tooltip="View Details"
            color={color}
          />

          {renderMedia()}

          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 2, pr: 8 }}>
            <MediaIcon sx={{ color, mt: 0.5 }} />
            <Box sx={{ flex: 1 }}>
              <Typography 
                variant="h6" 
                component="div" 
                sx={{ 
                  fontWeight: 'bold',
                  mb: 1
                }}
              >
                {event.title}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, flexWrap: 'wrap', gap: 1 }}>
                {event.event_date && (
                  <Chip
                    icon={<EventIcon />}
                    label={formatEventDate(event.event_date)}
                    size="small"
                    color="primary"
                    sx={{ mr: 1 }}
                  />
                )}
              </Box>
            </Box>
          </Box>

          {event.description && (
            <Typography 
              variant="body2" 
              sx={{ 
                mb: 2,
                color: theme.palette.text.secondary,
                whiteSpace: 'pre-wrap',
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {limitDescription(event.description)}
            </Typography>
          )}

          <Box sx={{ mt: 'auto' }}>
            <TagList tags={event.tags} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
              {event.created_by_username && (
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar 
                    src={event.created_by_avatar} 
                    alt={event.created_by_username}
                    sx={{ 
                      width: 24, 
                      height: 24,
                      mr: 0.5,
                      fontSize: '0.75rem'
                    }}
                  >
                    {event.created_by_username.charAt(0).toUpperCase()}
                  </Avatar>
                  <Typography variant="caption" color="text.secondary" sx={{ mr: 0.5 }}>
                    By
                  </Typography>
                  <Link
                    component={RouterLink}
                    to={`/profile/${event.created_by}`}
                    variant="caption"
                    color="primary"
                    sx={{ 
                      textDecoration: 'none',
                      '&:hover': {
                        textDecoration: 'underline'
                      }
                    }}
                  >
                    {event.created_by_username}
                  </Link>
                </Box>
              )}
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <AccessTimeIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary', fontSize: '0.75rem' }} />
                <Typography 
                  variant="caption" 
                  color="text.secondary"
                >
                  {formatDate(event.created_at)}
                </Typography>
              </Box>
            </Box>
          </Box>
        </motion.div>
      </motion.div>

      <EventPopup 
        event={event}
        open={popupOpen}
        onClose={() => setPopupOpen(false)}
      />
    </>
  );
};

export default MediaCard;
