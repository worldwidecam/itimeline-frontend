import React, { useState, forwardRef, useImperativeHandle, useEffect } from 'react';
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
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import { Link as RouterLink } from 'react-router-dom';
import { EVENT_TYPES, EVENT_TYPE_COLORS } from '../EventTypes';
import TagList from './TagList';
import EventPopup from '../EventPopup';
import PageCornerButton from '../PageCornerButton';
import config from '../../../../config';

const MediaCard = forwardRef(({ event, onEdit, onDelete, isSelected }, ref) => {
  const theme = useTheme();
  const [popupOpen, setPopupOpen] = useState(false);
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const typeColors = EVENT_TYPE_COLORS[EVENT_TYPES.MEDIA];
  const color = theme.palette.mode === 'dark' ? typeColors.dark : typeColors.light;

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
    setPopupOpen(true);
  };

  const handleCardClick = () => {
    if (onEdit && typeof onEdit === 'function') {
      if (isSelected) {
        // If already selected, open the popup
        console.log('MediaCard: Opening popup for already selected card');
        setPopupOpen(true);
      } else {
        // Otherwise, select it
        onEdit({ type: 'select', event });
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
    } else if (isVideo) {
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
          <video
            controls
            width="100%"
            height="100%"
            style={{ objectFit: 'cover' }}
            onError={(e) => {
              const currentSrc = e.target.src;
              const currentIndex = mediaSources.indexOf(currentSrc);
              
              if (currentIndex < mediaSources.length - 1) {
                e.target.src = mediaSources[currentIndex + 1];
              } else {
                e.target.style.display = 'none';
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
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            bgcolor: theme.palette.mode === 'dark' ? 'rgba(18, 18, 18, 0.9)' : 'rgba(245, 245, 245, 0.9)',
            zIndex: 1,
            padding: 2
          }}
        >
          <Typography variant="h6" gutterBottom align="center">
            {event.title || "Audio File"}
          </Typography>
          <Box sx={{ width: '100%', mt: 2 }}>
            <audio
              controls
              style={{ width: '100%' }}
              onError={(e) => {
                const currentSrc = e.target.src;
                const currentIndex = mediaSources.indexOf(currentSrc);
                
                if (currentIndex < mediaSources.length - 1) {
                  e.target.src = mediaSources[currentIndex + 1];
                } else {
                  e.target.style.display = 'none';
                  e.target.parentNode.innerHTML += `
                    <div style="display: flex; align-items: center; justify-content: center; width: 100%;">
                      <span style="color: #999;">Audio not available</span>
                    </div>
                  `;
                }
              }}
            >
              <source src={mediaSources[0]} type={`audio/${fileExt || 'mp3'}`} />
              Your browser does not support the audio element.
            </audio>
          </Box>
          <PageCornerButton 
            position="top-right" 
            onClick={handleDetailsClick}
            icon={<MediaIcon />}
            color={color}
          />
        </Box>
      );
    } else {
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
