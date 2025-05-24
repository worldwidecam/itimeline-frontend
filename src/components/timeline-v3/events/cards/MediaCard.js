import React, { useState, forwardRef, useImperativeHandle, useEffect, useRef } from 'react';
import {
  Typography,
  IconButton,
  Link,
  useTheme,
  Box,
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
  Event as EventIcon,
  AccessTime as AccessTimeIcon,
  MoreVert as MoreVertIcon,
  MusicNote as MusicIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import { Link as RouterLink } from 'react-router-dom';
import { EVENT_TYPES, EVENT_TYPE_COLORS } from '../EventTypes';
import TagList from './TagList';
import EventPopup from '../EventPopup';
import PageCornerButton from '../PageCornerButton';
import VideoDetailsButton from './VideoDetailsButton';
import AudioWaveformVisualizer from '../../../AudioWaveformVisualizer';
import config from '../../../../config';

const MediaCard = forwardRef(({ event, onEdit, onDelete, isSelected }, ref) => {
  const theme = useTheme();
  const [popupOpen, setPopupOpen] = useState(false);
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef(null);
  const typeColors = EVENT_TYPE_COLORS[EVENT_TYPES.MEDIA];
  const color = theme.palette.mode === 'dark' ? typeColors.dark : typeColors.light;
  
  // Expose methods to parent component via ref
  useImperativeHandle(ref, () => ({
    setPopupOpen: (open) => {
      console.log('MediaCard: External call to setPopupOpen', open);
      setPopupOpen(open);
    },
    pauseVideo: () => {
      if (videoRef.current && !videoRef.current.paused) {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  }));
  
  // Effect to pause video when card is deselected
  useEffect(() => {
    if (!isSelected && videoRef.current && !videoRef.current.paused) {
      console.log('MediaCard: Pausing video because card was deselected');
      videoRef.current.pause();
      setIsPlaying(false);
    }
  }, [isSelected]);

  const handleMenuOpen = (e) => {
    e.stopPropagation();
    
    if (!isSelected && onEdit && typeof onEdit === 'function') {
      onEdit({ type: 'select', event });
      
      setTimeout(() => {
        setMenuAnchorEl(e.currentTarget);
      }, 300);
    } else {
      setMenuAnchorEl(e.currentTarget);
    }
  };

  const handleMenuClose = (e) => {
    if (e) e.stopPropagation();
    setMenuAnchorEl(null);
  };

  const handleEdit = (e) => {
    if (e) e.stopPropagation(); // Prevent event bubbling
    handleMenuClose();
    
    // Check if this is a special action
    if (typeof e === 'object' && e !== null && e.type === 'openPopup') {
      console.log('MediaCard: Opening popup from handleEdit');
      setPopupOpen(true);
      return; // Exit early to prevent edit form from opening
    } else {
      onEdit(event);
    }
  };

  const handleDelete = (e) => {
    if (e) e.stopPropagation();
    handleMenuClose();
    onDelete(event);
  };

  const handleDetailsClick = (e) => {
    if (e) e.stopPropagation();
    
    // Pause the video if it's playing
    if (videoRef.current && !videoRef.current.paused) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
    
    setPopupOpen(true);
  };

  // Function to determine if this is a video media card
  const isVideoMediaCard = () => {
    // Check multiple indicators to determine if this is a video
    // 1. Check media_subtype field (new approach)
    if (event.media_subtype === 'video') {
      console.log('Video detected via media_subtype');
      return true;
    }
    
    // 2. Check media_url for video extensions
    if (event.media_url && /\.(mp4|webm|ogg|mov|avi|wmv|flv|mkv)$/i.test(event.media_url)) {
      console.log('Video detected via file extension');
      return true;
    }
    
    // 3. Check media_type field for video MIME types
    if (event.media_type && event.media_type.includes('video')) {
      console.log('Video detected via media_type');
      return true;
    }
    
    // 4. Check if there's a video element in the DOM for this card
    const cardElement = document.getElementById(`media-card-${event.id}`);
    if (cardElement && cardElement.querySelector('video')) {
      console.log('Video detected via DOM element');
      return true;
    }
    
    return false;
  };

  const handleCardClick = () => {
    // Check if this is a video media card using our comprehensive detection function
    const isVideoMedia = isVideoMediaCard();
    console.log(`Media card clicked, isVideoMedia: ${isVideoMedia}`);
    
    if (onEdit && typeof onEdit === 'function') {
      // For video media cards, we'll handle clicks differently
      if (isVideoMedia) {
        if (!isSelected) {
          // First click selects the card
          console.log('Video card: selecting');
          onEdit({ type: 'select', event });
        } else {
          // When already selected, toggle play/pause
          console.log('Video card already selected: toggling play/pause');
          if (videoRef.current) {
            if (videoRef.current.paused) {
              videoRef.current.play()
                .then(() => setIsPlaying(true))
                .catch(err => console.error('Error playing video:', err));
            } else {
              videoRef.current.pause();
              setIsPlaying(false);
            }
          }
        }
        // For videos, we'll rely on the Details button to open the popup
      } else {
        // For non-video media, use the standard behavior
        if (isSelected) {
          // If already selected, open the popup
          console.log('MediaCard: Opening popup for already selected card');
          setPopupOpen(true);
        } else {
          // Otherwise, select it
          onEdit({ type: 'select', event });
        }
      }
    }
  };
  
  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    openPopup: () => setPopupOpen(true)
  }));
  
  // We no longer need to listen for custom events
  // The popup will be opened directly by the handleEdit function

  const formatDate = (dateStr) => {
    try {
      if (!dateStr) return 'Invalid date';
      const date = parseISO(dateStr);
      return `Published on ${format(date, 'MMM d, yyyy, h:mm a')}`;
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  const formatEventDate = (dateStr) => {
    try {
      if (!dateStr) return 'Invalid date';
      const date = parseISO(dateStr);
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

  // Helper function to prepare media sources
  const prepareMediaSources = (mediaSource) => {
    let mediaSources = [];
    
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
    else if (mediaSource.startsWith('/')) {
      fullUrl = `${config.API_URL}${mediaSource}`;
    }
    
    // Add all possible URLs to try
    mediaSources.push(fullUrl);
    
    if (mediaSource.startsWith('/uploads/')) {
      mediaSources.push(`${config.API_URL}${mediaSource}`);
    }
    
    if (event.cloudinary_id) {
      const cloudName = 'dnjwvuxn7';
      mediaSources.push(`https://res.cloudinary.com/${cloudName}/image/upload/${event.cloudinary_id}`);
    }
    
    return { mediaSources, fullUrl };
  };

  // Render image media
  const renderImageMedia = (mediaSource) => {
    const { mediaSources } = prepareMediaSources(mediaSource);
    
    return (
      <Box 
        sx={{ 
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          overflow: 'hidden',
          zIndex: 1
        }}
      >
        <img
          src={mediaSources[0]}
          alt={event.title || "Media"}
          onError={(e) => {
            const currentSrc = e.target.src;
            const currentIndex = mediaSources.indexOf(currentSrc);
            
            if (currentIndex >= 0 && currentIndex < mediaSources.length - 1) {
              e.target.src = mediaSources[currentIndex + 1];
            } else {
              if (event.cloudinary_id) {
                const cloudName = 'dnjwvuxn7';
                const cloudinaryUrl = `https://res.cloudinary.com/${cloudName}/image/upload/${event.cloudinary_id}`;
                e.target.src = cloudinaryUrl;
                return;
              }
              
              e.target.style.display = 'none';
              e.target.parentNode.innerHTML += `
                <div style="display: flex; align-items: center; justify-content: center; height: 100%; width: 100%;">
                  <span style="color: #999;">Image not available</span>
                </div>
              `;
            }
          }}
          sx={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
        <Box 
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.4) 100%)',
            zIndex: 2
          }}
        />
        <PageCornerButton 
          position="top-right" 
          onClick={handleDetailsClick}
          icon={<MediaIcon />}
          color={color}
        />
      </Box>
    );
  };

  // Render video media
  const renderVideoMedia = (mediaSource) => {
    try {
      const { mediaSources = [], fullUrl = '' } = prepareMediaSources(mediaSource) || {};
      const fileExt = fullUrl?.split('.').pop()?.toLowerCase() || 'mp4';
      const hasValidSource = mediaSources?.length > 0 && mediaSources[0];
      
      return (
        <Box 
          sx={{ 
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            overflow: 'hidden',
            zIndex: 1,
            backgroundColor: 'rgba(0,0,0,0.05)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {hasValidSource ? (
            <>
              <video
                ref={videoRef}
                controls={isSelected}
                width="100%"
                height="100%"
                style={{ 
                  objectFit: 'cover',
                  opacity: isSelected ? 0.99 : 1,
                  maxWidth: '100%',
                  maxHeight: '100%'
                }}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onEnded={() => setIsPlaying(false)}
                onError={(e) => {
                  try {
                    const currentSrc = e.target.src;
                    const currentIndex = mediaSources?.indexOf?.(currentSrc) ?? -1;
                    setIsPlaying(false);
                    
                    if (currentIndex >= 0 && currentIndex < mediaSources.length - 1) {
                      e.target.src = mediaSources[currentIndex + 1];
                    } else {
                      e.target.style.display = 'none';
                    }
                  } catch (error) {
                    console.error('Error handling video error:', error);
                    e.target.style.display = 'none';
                  }
                }}
                preload="metadata"
              >
                <source src={mediaSources[0]} type={`video/${fileExt}`} />
                Your browser does not support the video tag.
              </video>
              <Box 
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.4) 100%)',
                  zIndex: 2,
                  pointerEvents: 'none'
                }}
              />
              <VideoDetailsButton
                onClick={handleDetailsClick}
                tooltip="View Full Video"
                color={color}
                isSelected={isSelected}
              />
            </>
          ) : (
            <Box sx={{ 
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: theme.palette.text.secondary,
              textAlign: 'center',
              p: 2
            }}>
              <MovieIcon sx={{ fontSize: 48, mb: 1, opacity: 0.5 }} />
              <Typography variant="caption">Video not available</Typography>
            </Box>
          )}
        </Box>
      );
    } catch (error) {
      console.error('Error rendering video media:', error);
      return (
        <Box sx={{ 
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(0,0,0,0.05)'
        }}>
          <Typography variant="caption" color="error">Error loading video</Typography>
        </Box>
      );
    }
  };

  // Reference to the audio visualizer component for controlling playback
  const audioVisualizerRef = useRef(null);
  
  // Render audio media with AudioWaveformVisualizer in preview mode
  const renderAudioMedia = (mediaSource) => {
    const { mediaSources, fullUrl } = prepareMediaSources(mediaSource);
    const fileExt = fullUrl.split('.').pop()?.toLowerCase();
    
    // Handle details click for audio media - pause audio when opening popup
    const handleAudioDetailsClick = () => {
      // If we have a reference to the visualizer, pause it before opening popup
      if (audioVisualizerRef.current) {
        // We don't actually need to pause it here since the popup will create a new instance
        // But we could add a method to the AudioWaveformVisualizer to expose the current playback time
        // and pass that to the popup to continue from the same position
      }
      
      // Open the event popup
      handleDetailsClick();
    };
    
    return (
      <Box 
        sx={{ 
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          overflow: 'hidden',
          bgcolor: theme.palette.mode === 'dark' ? 'rgba(18, 18, 18, 0.9)' : 'rgba(245, 245, 245, 0.9)'
        }}
      >
        <AudioWaveformVisualizer 
          ref={audioVisualizerRef}
          audioUrl={mediaSources[0]} 
          previewMode={true}
        />
        
        <PageCornerButton 
          position="top-right" 
          onClick={handleAudioDetailsClick}
          icon={<MusicIcon />}
          color={color}
        />
        
        {/* Fallback audio element (hidden) for compatibility */}
        <audio
          style={{ display: 'none' }}
          onError={(e) => {
            const currentSrc = e.target.src;
            const currentIndex = mediaSources.indexOf(currentSrc);
            
            if (currentIndex < mediaSources.length - 1) {
              e.target.src = mediaSources[currentIndex + 1];
            }
          }}
        >
          <source src={mediaSources[0]} type={`audio/${fileExt || 'mp3'}`} />
        </audio>
      </Box>
    );
  };

  // Render default media
  const renderDefaultMedia = (mediaSource) => {
    return (
      <Box 
        sx={{ 
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          bgcolor: 'background.paper',
          color: 'text.secondary',
          zIndex: 1
        }}
        onClick={handleCardClick}
      >
        <Typography variant="body1">
          {event.title || "Media File"}
        </Typography>
        <PageCornerButton 
          position="top-right" 
          onClick={handleDetailsClick}
          icon={<MediaIcon />}
          color={color}
        />
      </Box>
    );
  };

  // Main render media function
  const renderMedia = () => {
    const mediaSource = event.media_url || event.url;
    
    if (!mediaSource) {
      return (
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          height: '100%', 
          width: '100%',
          bgcolor: 'background.paper',
          color: 'text.secondary'
        }}>
          <Typography variant="body2" color="inherit">
            No media available
          </Typography>
        </Box>
      );
    }
    
    // Check for media subtype first (new approach)
    if (event && event.media_subtype) {
      console.log('MediaCard - Using media_subtype:', event.media_subtype);
      // Use the subtype to determine rendering
      switch(event.media_subtype) {
        case 'image':
          return renderImageMedia(mediaSource);
        case 'video':
          return renderVideoMedia(mediaSource);
        case 'audio':
          return renderAudioMedia(mediaSource);
        default:
          // Fall back to detection logic if subtype is unknown
          console.log('MediaCard - Unknown media_subtype:', event.media_subtype);
          break;
      }
    }
    
    // If no subtype or unknown subtype, fall back to detection logic
    const { fullUrl } = prepareMediaSources(mediaSource);
    
    // Determine media type from URL or event.media_type
    const fileExt = fullUrl.split('.').pop()?.toLowerCase();
    const isImage = 
      (fileExt && ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(fileExt)) ||
      (event.media_type && event.media_type.includes('image'));
    
    const isVideo = 
      (fileExt && ['mp4', 'webm', 'ogg', 'mov'].includes(fileExt)) ||
      (event.media_type && event.media_type.includes('video'));
    
    const isAudio = 
      (fileExt && ['mp3', 'wav', 'ogg', 'aac'].includes(fileExt)) ||
      (event.media_type && event.media_type.includes('audio'));
    
    if (isImage) {
      return renderImageMedia(mediaSource);
    } else if (isVideo) {
      return renderVideoMedia(mediaSource);
    } else if (isAudio) {
      return renderAudioMedia(mediaSource);
    } else {
      return renderDefaultMedia(mediaSource);
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        whileHover={{ y: -5 }}
        whileTap={{ scale: 0.98 }}
        onClick={(e) => {
          e.stopPropagation(); // Prevent event bubbling
          console.log('MediaCard motion.div clicked');
          handleCardClick();
        }}
      >
        <Box
          id={`media-card-${event.id}`}
          sx={{
            position: 'relative',
            borderRadius: 2,
            overflow: 'hidden',
            boxShadow: isSelected 
              ? `0 0 0 2px ${color}, 0 4px 8px rgba(0,0,0,0.4)` 
              : '0 2px 4px rgba(0,0,0,0.1)',
            transition: 'box-shadow 0.3s ease, transform 0.3s ease',
            cursor: 'pointer',
            bgcolor: 'background.paper',
            '&:hover': {
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              '& .event-actions': {
                opacity: 1,
              },
            },
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            minHeight: '300px',
          }}
        >
          {/* Media Content - Full card background */}
          {renderMedia()}
          
          {/* Info Content - Overlaid with reduced opacity */}
          <Box 
            sx={{ 
              p: 2, 
              mt: 'auto',
              display: 'flex', 
              flexDirection: 'column',
              position: 'relative',
              zIndex: 3,
              bgcolor: theme.palette.mode === 'dark' 
                ? 'rgba(18, 18, 18, 0.75)' 
                : 'rgba(255, 255, 255, 0.75)',
              backdropFilter: 'blur(3px)',
              borderRadius: '0 0 8px 8px',
            }}
          >
            <Box sx={{ mb: 1, display: 'flex', alignItems: 'flex-start', gap: 1 }}>
              <MediaIcon sx={{ color, mt: 0.5 }} />
              <Box sx={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Typography variant="h6" component="h3" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                  {event.title}
                </Typography>
              
                {/* QUARANTINED: Vertical ellipsis menu removed
                    The edit and delete functionality was incomplete and caused issues
                    Pending impact review for possible deletion
                */}
              </Box>
            </Box>
            
            {/* Event description */}
            {event.description && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                {limitDescription(event.description)}
              </Typography>
            )}
            
            {/* Tags */}
            {event.tags && event.tags.length > 0 && (
              <Box sx={{ mb: 1.5 }}>
                <TagList tags={event.tags} size="small" />
              </Box>
            )}
            
            {/* Event metadata */}
            <Box sx={{ mt: 'auto', pt: 1 }}>
              {/* Event date */}
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                <EventIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary', fontSize: '0.875rem' }} />
                <Typography variant="caption" color="text.secondary">
                  {formatEventDate(event.event_date)}
                </Typography>
              </Box>
              
              {/* Created date */}
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                <AccessTimeIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary', fontSize: '0.875rem' }} />
                <Typography variant="caption" color="text.secondary">
                  {formatDate(event.created_at)}
                </Typography>
              </Box>
              
              {/* Author */}
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
            </Box>
          </Box>
        </Box>
      </motion.div>
      
      {/* QUARANTINED: Event menu removed
          The edit and delete functionality was incomplete and caused issues
          Pending impact review for possible deletion
      */}
      
      {/* Event popup */}
      <EventPopup
        open={popupOpen}
        onClose={() => {
          console.log('MediaCard: Closing popup');
          setPopupOpen(false);
        }}
        event={event}
      />
    </>
  );
});

export default MediaCard;
