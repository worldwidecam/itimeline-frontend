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
    // Get the media URL from the event - CRITICAL: Check both media_url and url fields
    const mediaSource = event.media_url || event.url;
    
    // Enhanced logging to debug media source issues
    console.log('MediaCard renderMedia - Event data:', {
      id: event.id,
      title: event.title,
      media_url: event.media_url,
      url: event.url,
      media_type: event.media_type,
      final_media_source: mediaSource
    });
    
    // If no media source, show a placeholder
    if (!mediaSource) {
      console.log('No media source found for event:', event.id);
      return (
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          height: 200, 
          bgcolor: 'background.paper',
          color: 'text.secondary'
        }}>
          <Typography variant="body2" color="inherit">
            No media available
          </Typography>
        </Box>
      );
    }
    
    // Create an array of possible media URLs to try
    let mediaSources = [];
    
    // ENHANCED MEDIA URL DETECTION
    // Log all possible information about the media source for debugging
    console.log('Media URL details:', {
      event_id: event.id,
      title: event.title,
      url: mediaSource,
      media_type: event.media_type,
      starts_with_http: mediaSource?.startsWith('http'),
      starts_with_slash: mediaSource?.startsWith('/'),
      includes_cloudinary: mediaSource?.includes('cloudinary'),
      includes_uploads: mediaSource?.includes('/uploads/'),
      includes_static: mediaSource?.includes('/static/')
    });
    
    // Check if this is a Cloudinary URL using multiple detection methods
    const isCloudinaryUrl = (
      // Check URL patterns
      (mediaSource && (
        mediaSource.includes('cloudinary.com') || 
        mediaSource.includes('res.cloudinary')
      )) ||
      // Check media_type for cloudinary prefix
      (event.media_type && event.media_type.includes('cloudinary'))
    );
    
    console.log('Is Cloudinary URL:', isCloudinaryUrl);
    
    // Determine the full URL to use
    let fullUrl = mediaSource;
    
    // If it's a Cloudinary URL, use it directly
    if (isCloudinaryUrl) {
      // Cloudinary URLs are already absolute
      fullUrl = mediaSource;
      console.log('Using Cloudinary URL directly:', fullUrl);
    }
    // If it's a relative URL (starts with /), prepend the API URL
    else if (mediaSource.startsWith('/')) {
      fullUrl = `${config.API_URL}${mediaSource}`;
      console.log('Using relative URL with API base:', fullUrl);
    }
    // If it's not an absolute URL, prepend the API URL
    else if (!mediaSource.startsWith('http')) {
      fullUrl = `${config.API_URL}/${mediaSource}`;
      console.log('Using non-absolute URL with API base:', fullUrl);
    }
    
    // CRITICAL: Ensure Cloudinary URLs are properly formatted
    if (isCloudinaryUrl && !fullUrl.startsWith('http')) {
      // This might be just a public ID - construct a proper Cloudinary URL
      const cloudName = 'dnjwvuxn7';
      fullUrl = `https://res.cloudinary.com/${cloudName}/image/upload/${fullUrl}`;
      console.log('Fixed Cloudinary URL:', fullUrl);
    }
    
    // Add the resolved URL to the sources array
    mediaSources.push(fullUrl);
    
    // For backward compatibility, also try alternative URL formats
    if (!isCloudinaryUrl && !mediaSource.startsWith('http')) {
      // Try with /static/ prefix if not already present
      if (!mediaSource.includes('/static/')) {
        mediaSources.push(`${config.API_URL}/static/${mediaSource}`);
      }
      
      // Try with /uploads/ prefix if not already present
      if (!mediaSource.includes('/uploads/')) {
        mediaSources.push(`${config.API_URL}/static/uploads/${mediaSource}`);
      }
      
      // Try Cloudinary URL construction as a fallback
      const cloudName = 'dnjwvuxn7';
      if (mediaSource.includes('/')) {
        // If it has slashes, it might be a path within Cloudinary
        const fullCloudinaryUrl = `https://res.cloudinary.com/${cloudName}/image/upload/${mediaSource}`;
        mediaSources.push(fullCloudinaryUrl);
        console.log('Constructed Cloudinary URL:', fullCloudinaryUrl);
      } else {
        // If it's just a public_id without slashes
        mediaSources.push(`https://res.cloudinary.com/${cloudName}/image/upload/${mediaSource}`);
        mediaSources.push(`https://res.cloudinary.com/${cloudName}/auto/upload/${mediaSource}`);
        console.log('Constructed Cloudinary URLs from public_id:', mediaSources);
      }
    }
    
    // Log all URLs we're going to try
    console.log('Trying media sources in order:', mediaSources);
    
    // Determine media type from file extension or media_type field
    const mediaType = event.media_type || '';
    const fileExt = mediaSource.split('.').pop()?.toLowerCase();
    
    // Enhanced media type detection
    console.log('Media type detection - Raw data:', { 
      media_type: mediaType, 
      file_ext: fileExt,
      cloudinary_id: event.cloudinary_id,
      includes_cloudinary: mediaType.includes('cloudinary') || mediaSource.includes('cloudinary')
    });
    
    // Check if it's an image
    const isImage = 
      mediaType.includes('image') || 
      ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(fileExt) ||
      (isCloudinaryUrl && !mediaType.includes('video') && !mediaType.includes('audio'));
    
    // Check if it's a video
    const isVideo = 
      mediaType.includes('video') || 
      ['mp4', 'webm', 'ogg', 'mov', 'avi', 'wmv', 'flv', 'mkv'].includes(fileExt);
    
    // Check if it's audio
    const isAudio = 
      mediaType.includes('audio') || 
      ['mp3', 'wav', 'ogg', 'aac', 'flac', 'm4a'].includes(fileExt);
    
    console.log('Media type detection results:', { isImage, isVideo, isAudio, mediaType, fileExt });
    
    // Render based on media type
    if (isImage) {
      return (
        <Box 
          sx={{ 
            height: 200, 
            position: 'relative',
            overflow: 'hidden',
            bgcolor: 'background.paper',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}
          onClick={handleDetailsClick}
        >
          <Box
            component="img"
            src={mediaSources[0]} // Use the primary URL
            alt={event.title || "Media"}
            onError={(e) => {
              // If the primary URL fails, try the next one
              const currentSrc = e.target.src;
              const currentIndex = mediaSources.indexOf(currentSrc);
              
              console.log(`Image load failed for ${currentSrc}, trying next source if available`);
              console.log(`Current index: ${currentIndex}, total sources: ${mediaSources.length}`);
              
              if (currentIndex >= 0 && currentIndex < mediaSources.length - 1) {
                console.log(`Trying next source: ${mediaSources[currentIndex + 1]}`);
                e.target.src = mediaSources[currentIndex + 1];
              } else {
                console.log(`All image sources failed for ${event.title}`);
                console.log('Trying direct Cloudinary URL construction as last resort');
                
                // Last resort: Try to construct a Cloudinary URL directly
                if (event.cloudinary_id) {
                  const cloudName = 'dnjwvuxn7';
                  const cloudinaryUrl = `https://res.cloudinary.com/${cloudName}/image/upload/${event.cloudinary_id}`;
                  console.log(`Trying Cloudinary ID direct URL: ${cloudinaryUrl}`);
                  e.target.src = cloudinaryUrl;
                  return;
                }
                
                // If all else fails, show placeholder
                e.target.style.display = 'none';
                // Show a fallback placeholder
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
              transition: 'transform 0.3s ease',
              '&:hover': {
                transform: 'scale(1.05)',
              },
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
    } else if (isVideo) {
      return (
        <Box 
          sx={{ 
            height: 200, 
            position: 'relative',
            overflow: 'hidden',
            bgcolor: 'background.paper',
          }}
          onClick={handleDetailsClick}
        >
          <video
            controls
            width="100%"
            height="100%"
            style={{ objectFit: 'cover' }}
            onError={(e) => {
              // If the primary URL fails, try the next one
              const currentSrc = e.target.src;
              const currentIndex = mediaSources.indexOf(currentSrc);
              
              if (currentIndex < mediaSources.length - 1) {
                console.log(`Video load failed for ${currentSrc}, trying next source`);
                e.target.src = mediaSources[currentIndex + 1];
              } else {
                console.log(`All video sources failed for ${event.title}`);
                e.target.style.display = 'none';
                // Show a fallback placeholder
                e.target.parentNode.innerHTML += `
                  <div style="display: flex; align-items: center; justify-content: center; height: 100%; width: 100%;">
                    <span style="color: #999;">Video not available</span>
                  </div>
                `;
              }
            }}
          >
            <source src={mediaSources[0]} type={`video/${fileExt || 'mp4'}`} />
            Your browser does not support the video tag.
          </video>
          <PageCornerButton 
            position="top-right" 
            onClick={handleDetailsClick}
            icon={<MediaIcon />}
            color={color}
          />
        </Box>
      );
    } else if (isAudio) {
      return (
        <Box 
          sx={{ 
            height: 200, 
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            p: 2,
            bgcolor: 'background.paper',
          }}
          onClick={handleDetailsClick}
        >
          <Typography variant="subtitle1" gutterBottom>
            Audio: {event.title || "Audio File"}
          </Typography>
          <audio
            controls
            style={{ width: '100%', marginTop: '16px' }}
            onError={(e) => {
              // If the primary URL fails, try the next one
              const currentSrc = e.target.src;
              const currentIndex = mediaSources.indexOf(currentSrc);
              
              if (currentIndex < mediaSources.length - 1) {
                console.log(`Audio load failed for ${currentSrc}, trying next source`);
                e.target.src = mediaSources[currentIndex + 1];
              } else {
                console.log(`All audio sources failed for ${event.title}`);
                e.target.style.display = 'none';
                // Show a fallback message
                e.target.parentNode.innerHTML += `
                  <div style="text-align: center; margin-top: 16px;">
                    <span style="color: #999;">Audio not available</span>
                  </div>
                `;
              }
            }}
          >
            <source src={mediaSources[0]} type={`audio/${fileExt || 'mpeg'}`} />
            Your browser does not support the audio element.
          </audio>
          <PageCornerButton 
            position="top-right" 
            onClick={handleDetailsClick}
            icon={<MediaIcon />}
            color={color}
          />
        </Box>
      );
    } else {
      // Default case for unknown media types
      return (
        <Box 
          sx={{ 
            height: 200, 
            position: 'relative',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            bgcolor: 'background.paper',
            color: 'text.secondary',
          }}
          onClick={handleDetailsClick}
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
    }
  };

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        style={{ width: '100%' }}
      >
        <Box
          sx={{
            position: 'relative',
            borderRadius: 2,
            overflow: 'hidden',
            boxShadow: isSelected ? 4 : 1,
            border: isSelected ? `2px solid ${color}` : 'none',
            transition: 'all 0.3s ease',
            bgcolor: 'background.paper',
            '&:hover': {
              boxShadow: 3,
              '& .event-actions': {
                opacity: 1,
              },
            },
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Media Section */}
          {renderMedia()}
          
          {/* Content Section */}
          <Box sx={{ p: 2, flex: 1, display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ mb: 1, display: 'flex', alignItems: 'flex-start', gap: 1 }}>
              <MediaIcon sx={{ color, mt: 0.5 }} />
              <Box sx={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Typography variant="h6" component="h3" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                  {event.title}
                </Typography>
              
                <IconButton 
                  size="small" 
                  onClick={handleMenuOpen}
                  className="event-actions"
                  sx={{ 
                    opacity: isSelected ? 1 : 0.5,
                    transition: 'opacity 0.2s',
                    ml: 1,
                  }}
                >
                  <MoreVertIcon fontSize="small" />
                </IconButton>
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
      
      {/* Event menu */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
        onClick={(e) => e.stopPropagation()}
      >
        <MenuItem onClick={handleEdit}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleDelete}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>
      
      {/* Event popup */}
      <EventPopup
        open={popupOpen}
        onClose={() => setPopupOpen(false)}
        event={event}
      />
    </>
  );
};

export default MediaCard;
