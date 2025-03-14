import React, { useState } from 'react';
import {
  Typography,
  IconButton,
  Link,
  useTheme,
  Box,
  Chip,
  Card,
  CardMedia,
  CardContent,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Article as NewsIcon,
  Event as EventIcon,
  AccessTime as AccessTimeIcon,
  Language as LanguageIcon,
  MoreVert as MoreVertIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import { EVENT_TYPES, EVENT_TYPE_COLORS } from '../EventTypes';
import TagList from './TagList';
import EventPopup from '../EventPopup';
import PageCornerButton from '../PageCornerButton';

const NewsCard = ({ event, onEdit, onDelete }) => {
  const theme = useTheme();
  const [popupOpen, setPopupOpen] = useState(false);
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const typeColors = EVENT_TYPE_COLORS[EVENT_TYPES.NEWS];
  const color = theme.palette.mode === 'dark' ? typeColors.dark : typeColors.light;

  const handleMenuOpen = (event) => {
    setMenuAnchorEl(event.currentTarget);
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

  // Function to limit description to 15 words
  const limitDescription = (text) => {
    if (!text) return '';
    const words = text.split(/\s+/);
    if (words.length <= 15) return text;
    return words.slice(0, 15).join(' ') + '...';
  };

  // Extract domain from URL and format it nicely
  const getSourceName = (url) => {
    if (!url) return '';
    try {
      const domain = new URL(url).hostname;
      // Remove www. and .com/.org/etc to get a cleaner name
      let sourceName = domain.replace(/^www\./i, '');
      // Split by dots and take the first part (e.g., "nytimes" from "nytimes.com")
      sourceName = sourceName.split('.')[0];
      // Capitalize first letter of each word
      return sourceName
        .split(/[-_]/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    } catch (error) {
      console.error('Error extracting domain:', error);
      return '';
    }
  };

  // Check if we have URL preview data
  const hasUrlPreview = event.url_image || event.url_title || event.url_description;

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
          
          {/* Menu for edit and delete options */}
          <Box 
            sx={{ 
              position: 'absolute', 
              top: 8, 
              right: 45, 
              zIndex: 10 
            }}
          >
            <IconButton 
              size="small" 
              onClick={handleMenuOpen}
              sx={{ 
                backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                '&:hover': {
                  backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)',
                }
              }}
            >
              <MoreVertIcon fontSize="small" />
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
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 2, pr: 8 }}>
            <NewsIcon sx={{ color, mt: 0.5 }} />
            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography 
                  variant="h6" 
                  component="div" 
                  sx={{ 
                    fontWeight: 'bold',
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
                  />
                )}
              </Box>
            </Box>
          </Box>

          {/* URL Preview Card */}
          {event.url && (
            <Link 
              href={event.url} 
              target="_blank" 
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              sx={{ 
                textDecoration: 'none',
                display: 'block',
                mb: 2,
                maxWidth: '100%',
              }}
            >
              {hasUrlPreview ? (
                <Card 
                  sx={{ 
                    display: 'flex', 
                    flexDirection: { xs: 'column', sm: event.url_image ? 'column' : 'row' },
                    overflow: 'hidden',
                    maxWidth: '100%',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      boxShadow: theme.shadows[4],
                      transform: 'translateY(-2px)'
                    }
                  }}
                >
                  {event.url_image && (
                    <CardMedia
                      component="img"
                      height="140"
                      image={event.url_image}
                      alt={event.url_title || "Link preview image"}
                      sx={{ 
                        objectFit: 'cover',
                        width: '100%',
                        maxHeight: '140px',
                      }}
                    />
                  )}
                  <CardContent sx={{ flex: '1 0 auto', p: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                      <Chip 
                        icon={<LanguageIcon />} 
                        label={getSourceName(event.url)}
                        size="small"
                        color="primary"
                        variant="outlined"
                        sx={{ 
                          height: 24,
                          '& .MuiChip-label': { px: 1 },
                          '& .MuiChip-icon': { fontSize: 16 }
                        }}
                      />
                    </Box>
                    {event.url_title && (
                      <Typography 
                        variant="subtitle1" 
                        component="div" 
                        sx={{ 
                          fontWeight: 'medium', 
                          mb: 0.5,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                        }}
                      >
                        {event.url_title}
                      </Typography>
                    )}
                    {event.url_description && (
                      <Typography 
                        variant="body2" 
                        color="text.secondary" 
                        sx={{ 
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {event.url_description}
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  p: 1, 
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: 1,
                  maxWidth: '100%',
                  '&:hover': {
                    backgroundColor: theme.palette.action.hover
                  }
                }}>
                  <Chip 
                    icon={<LanguageIcon />} 
                    label={getSourceName(event.url)}
                    size="small"
                    color="primary"
                    variant="outlined"
                    sx={{ 
                      height: 24,
                      '& .MuiChip-label': { px: 1 },
                      '& .MuiChip-icon': { fontSize: 16 }
                    }}
                  />
                </Box>
              )}
            </Link>
          )}

          <Box sx={{ mt: 'auto' }}>
            <TagList tags={event.tags} />
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', mt: 1 }}>
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

export default NewsCard;
