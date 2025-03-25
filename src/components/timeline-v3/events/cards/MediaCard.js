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
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Movie as MediaIcon,
  Link as LinkIcon,
  Event as EventIcon,
  AccessTime as AccessTimeIcon,
  MoreVert as MoreVertIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import { EVENT_TYPES, EVENT_TYPE_COLORS } from '../EventTypes';
import TagList from './TagList';
import EventPopup from '../EventPopup';
import PageCornerButton from '../PageCornerButton';

const MediaCard = ({ event, onEdit, onDelete, isSelected }) => {
  const theme = useTheme();
  const [popupOpen, setPopupOpen] = useState(false);
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const typeColors = EVENT_TYPE_COLORS[EVENT_TYPES.MEDIA];
  const color = theme.palette.mode === 'dark' ? typeColors.dark : typeColors.light;

  const handleMenuOpen = (e) => {
    // Prevent the click event from bubbling up to the card
    e.stopPropagation();
    
    // Only open the menu if the card is already selected
    if (isSelected) {
      setMenuAnchorEl(e.currentTarget);
    } else {
      // If not selected, we need to select it first
      // The parent component will handle the selection
    }
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };

  const handleEdit = () => {
    handleMenuClose();
    onEdit(event);
  };

  const handleDelete = () => {
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
    if (!event.url) return null;

    const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(event.url);
    const isVideo = /\.(mp4|webm|ogg)$/i.test(event.url);
    const isAudio = /\.(mp3|wav|ogg)$/i.test(event.url);

    if (isImage) {
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
            src={event.url}
            alt={event.title}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        </Box>
      );
    }

    if (isVideo) {
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
            <source src={event.url} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </Box>
      );
    }

    if (isAudio) {
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
            <source src={event.url} type="audio/mpeg" />
            Your browser does not support the audio element.
          </audio>
        </Box>
      );
    }

    return null;
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
              {event.event_date && (
                <Chip
                  icon={<EventIcon />}
                  label={formatEventDate(event.event_date)}
                  size="small"
                  color="primary"
                  sx={{ mb: 1 }}
                />
              )}
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
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', mt: 1 }}>
              <IconButton 
                size="small" 
                onClick={handleMenuOpen}
                sx={{ 
                  mr: 1,
                  p: 0.5,
                  backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                  '&:hover': {
                    backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)',
                  }
                }}
              >
                <MoreVertIcon fontSize="small" sx={{ fontSize: '1rem' }} />
              </IconButton>
              <Menu
                anchorEl={menuAnchorEl}
                open={Boolean(menuAnchorEl)}
                onClose={handleMenuClose}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
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
              <AccessTimeIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary', fontSize: '0.75rem' }} />
              <Typography 
                variant="caption" 
                color="text.secondary"
              >
                {formatDate(event.created_at)}
              </Typography>
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
