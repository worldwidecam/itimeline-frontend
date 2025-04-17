import React, { useState, forwardRef, useImperativeHandle, useEffect } from 'react';
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
  Paper,
  Avatar
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
  Launch as LaunchIcon,
  Link as LinkIcon,
  Person as PersonIcon,
  Label as TagIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import { Link as RouterLink } from 'react-router-dom';
import { EVENT_TYPES, EVENT_TYPE_COLORS } from '../EventTypes';
import TagList from './TagList';
import EventPopup from '../EventPopup';
import PageCornerButton from '../PageCornerButton';
import { alpha } from '@mui/material/styles';

const NewsCard = forwardRef(({ event, onEdit, onDelete, isSelected }, ref) => {
  const theme = useTheme();
  const [popupOpen, setPopupOpen] = useState(false);
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const typeColors = EVENT_TYPE_COLORS[EVENT_TYPES.NEWS];
  const color = theme.palette.mode === 'dark' ? typeColors.dark : typeColors.light;

  // Debug log for event data
  console.log('NewsCard event data:', event);
  console.log('NewsCard tags:', event.tags);

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
    
    // Check if this is a special action
    if (typeof e === 'object' && e !== null && e.type === 'openPopup') {
      console.log('NewsCard: Opening popup from handleEdit');
      setPopupOpen(true);
      return; // Exit early to prevent edit form from opening
    } else {
      onEdit(event);
    }
  };

  const handleDelete = (e) => {
    if (e) e.stopPropagation(); // Prevent event bubbling
    handleMenuClose();
    onDelete(event);
  };

  const handleDetailsClick = () => {
    setPopupOpen(true);
  };
  
  const handleCardClick = () => {
    if (onEdit && typeof onEdit === 'function') {
      if (isSelected) {
        // If already selected, open the popup
        console.log('NewsCard: Opening popup for already selected card');
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

  const truncateDescription = (text) => {
    if (!text) return '';
    const words = text.split(/\s+/);
    if (words.length <= 50) return text;
    return words.slice(0, 50).join(' ') + '...';
  };

  // Common sites with known logos
  const domainLogos = {
    'facebook.com': 'https://www.facebook.com/images/fb_icon_325x325.png',
    'instagram.com': 'https://www.instagram.com/static/images/ico/favicon-192.png/68d99ba29cc8.png',
    'twitter.com': 'https://abs.twimg.com/responsive-web/client-web/icon-default.522d363a.png',
    'x.com': 'https://abs.twimg.com/responsive-web/client-web/icon-default.522d363a.png',
    'linkedin.com': 'https://static.licdn.com/sc/h/al2o9zrvru7aqj8e1x2rzsrca',
    'youtube.com': 'https://www.youtube.com/s/desktop/12d6b690/img/favicon_144x144.png',
    'youtu.be': 'https://www.youtube.com/s/desktop/12d6b690/img/favicon_144x144.png',
    'reddit.com': 'https://www.redditstatic.com/desktop2x/img/favicon/android-icon-192x192.png',
    'google.com': 'https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png',
    'spotify.com': 'https://open.scdn.co/cdn/images/favicon.5cb2bd30.ico',
    'open.spotify.com': 'https://open.scdn.co/cdn/images/favicon32.8e66b099.png',
    'github.com': 'https://github.githubassets.com/favicons/favicon.svg',
    'medium.com': 'https://miro.medium.com/v2/1*m-R_BkNf1Qjr1YbyOIJY2w.png',
    'amazon.com': 'https://www.amazon.com/favicon.ico',
    'netflix.com': 'https://assets.nflxext.com/us/ffe/siteui/common/icons/nficon2016.ico',
    'apple.com': 'https://www.apple.com/favicon.ico',
    'microsoft.com': 'https://c.s-microsoft.com/favicon.ico',
    'twitch.tv': 'https://static.twitchcdn.net/assets/favicon-32-e29e246c157142c94346.png'
  };

  // Extract domain from URL and format it nicely
  const getSourceName = (url) => {
    if (!url) return '';
    try {
      // Add https:// if missing to make the URL valid for parsing
      const urlToProcess = url.startsWith('http') ? url : `https://${url}`;
      const domain = new URL(urlToProcess).hostname;
      
      // Remove www. and extract the domain name
      let sourceName = domain.replace(/^www\./i, '');
      
      // Handle special cases
      if (sourceName.includes('facebook.com')) return 'Facebook';
      if (sourceName.includes('instagram.com')) return 'Instagram';
      if (sourceName.includes('twitter.com') || sourceName.includes('x.com')) return 'Twitter';
      if (sourceName.includes('linkedin.com')) return 'LinkedIn';
      if (sourceName.includes('youtube.com') || sourceName.includes('youtu.be')) return 'YouTube';
      if (sourceName.includes('google.com')) return 'Google';
      
      // Split by dots and take the first part (e.g., "nytimes" from "nytimes.com")
      sourceName = sourceName.split('.')[0];
      
      // Capitalize first letter of each word
      return sourceName
        .split(/[-_]/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    } catch (error) {
      console.error('Error extracting domain:', error);
      // Return a fallback value instead of empty string
      return 'Web Link';
    }
  };

  // Get fallback image for domain if no specific image is provided
  const getFallbackImage = (url) => {
    if (!url) return '';
    try {
      const urlToProcess = url.startsWith('http') ? url : `https://${url}`;
      const domain = new URL(urlToProcess).hostname.toLowerCase();
      
      // Check if the domain or any of its parts match known domains
      for (const [knownDomain, logoUrl] of Object.entries(domainLogos)) {
        if (domain.includes(knownDomain)) {
          return logoUrl;
        }
      }
      
      // Try to construct a favicon URL as fallback
      return `https://${domain}/favicon.ico`;
    } catch (error) {
      console.error('Error getting fallback image:', error);
      return '';
    }
  };

  // Determine if the image is from YouTube
  const isYouTubeImage = (url) => {
    if (!url) return false;
    try {
      return url.includes('youtube.com') || 
             url.includes('youtu.be') || 
             url.includes('ytimg.com') || 
             url.includes('yt');
    } catch (error) {
      return false;
    }
  };

  // Determine if the image is a logo (fallback)
  const isLogoImage = (url) => {
    if (!url) return false;
    try {
      // First check if the image URL itself matches any of our known logo URLs
      for (const logoUrl of Object.values(domainLogos)) {
        if (url.includes(logoUrl) || logoUrl.includes(url)) {
          return true;
        }
      }
      
      // Check if the URL contains common logo indicators
      if (url.includes('favicon') || 
          url.includes('logo') || 
          url.includes('icon') || 
          url.includes('brand')) {
        return true;
      }
      
      // Check if the URL is from a known domain with logos
      try {
        const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
        const domain = urlObj.hostname.toLowerCase();
        
        // Check if the domain matches any of our known domains with logos
        for (const [knownDomain] of Object.entries(domainLogos)) {
          if (domain.includes(knownDomain)) {
            return true;
          }
        }
      } catch (error) {
        // If URL parsing fails, just continue with other checks
        console.error('Error parsing URL in isLogoImage:', error);
      }
      
      // Check if the image is likely a small icon/logo based on filename
      const filename = url.split('/').pop().toLowerCase();
      if (filename.includes('favicon') || 
          filename.includes('logo') || 
          filename.includes('icon') || 
          filename.includes('brand')) {
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error checking if logo image:', error);
      return false;
    }
  };

  // Check if the image is an actual content image vs a fallback logo
  const isActualImage = (url) => {
    if (!url) return false;
    try {
      return !isLogoImage(url);
    } catch (error) {
      console.error('Error checking if actual image:', error);
      return false;
    }
  };

  // Determine if we have enough data to show a URL preview
  const hasUrlPreview = Boolean(
    event.url && (event.url_title || event.url_description || event.url_image)
  );

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
        onClick={(e) => {
          e.stopPropagation(); // Prevent event bubbling
          console.log('NewsCard motion.div clicked');
          handleCardClick();
        }}
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
          
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 2, pr: 8 }}>
            <NewsIcon sx={{ color, mt: 0.5 }} />
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" component="div" sx={{ fontWeight: 'bold', mb: 1 }}>
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

          {/* URL Preview Card */}
          {hasUrlPreview && (
            <Link 
              href={event.url.startsWith('http') ? event.url : `https://${event.url}`} 
              target="_blank" 
              rel="noopener noreferrer"
              underline="none"
              sx={{ 
                display: 'block', 
                mb: 1, 
                color: 'inherit',
                '&:hover': { 
                  textDecoration: 'none',
                  '& .MuiPaper-root': {
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
                  }
                }
              }}
            >
              <Paper 
                elevation={1} 
                sx={{ 
                  overflow: 'hidden',
                  transition: 'box-shadow 0.2s ease-in-out',
                  backgroundColor: 'background.paper'
                }}
              >
                {/* For YouTube and Logo images, use side-by-side layout */}
                {(isYouTubeImage(event.url_image) || isLogoImage(event.url_image)) ? (
                  <Box sx={{ display: 'flex', flexDirection: 'row' }}>
                    {/* Image on the left */}
                    <Box sx={{
                      width: isLogoImage(event.url_image) ? '120px' : '180px',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      backgroundColor: isLogoImage(event.url_image) ? 'background.paper' : 'transparent',
                      borderRadius: 1,
                      overflow: 'hidden',
                      padding: isLogoImage(event.url_image) ? 1 : 0,
                    }}>
                      <CardMedia
                        component="img"
                        height="auto"
                        image={event.url_image || getFallbackImage(event.url)}
                        alt={event.url_title || getSourceName(event.url) || "Link preview image"}
                        sx={{ 
                          objectFit: 'contain',
                          width: 'auto',
                          maxHeight: isLogoImage(event.url_image) ? '100px' : '180px',
                          display: 'block',
                          margin: 'auto',
                          maxWidth: isLogoImage(event.url_image) ? '100px' : '180px'
                        }}
                        onError={(e) => {
                          console.error('Error loading image:', e);
                          if (event.url_image && getFallbackImage(event.url)) {
                            e.target.src = getFallbackImage(event.url);
                            e.target.style.objectFit = 'contain';
                            e.target.style.maxHeight = '100px';
                            e.target.style.maxWidth = '100px';
                            e.target.style.margin = 'auto';
                            e.target.style.width = 'auto';
                            e.target.parentElement.style.width = '120px';
                          } else {
                            e.target.style.display = 'none';
                          }
                        }}
                      />
                    </Box>
                    
                    {/* Content on the right */}
                    <CardContent sx={{ flex: '1 0 auto', p: 2 }}>
                      {event.url_title && (
                        <Typography variant="subtitle1" component="div" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                          {event.url_title}
                        </Typography>
                      )}
                      {event.url_description && (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                          {truncateDescription(event.url_description)}
                        </Typography>
                      )}
                      <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                          <LinkIcon sx={{ fontSize: 14, mr: 0.5 }} />
                          {getSourceName(event.url)}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Box>
                ) : (
                  /* For news articles, keep the original stacked layout */
                  <>
                    {(event.url_image || getFallbackImage(event.url)) && (
                      <Box sx={{
                        width: '100%',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        backgroundColor: 'transparent',
                        borderRadius: 1,
                        overflow: 'hidden',
                        height: 'auto',
                        padding: 0,
                      }}>
                        <CardMedia
                          component="img"
                          height="240"
                          image={event.url_image || getFallbackImage(event.url)}
                          alt={event.url_title || getSourceName(event.url) || "Link preview image"}
                          sx={{ 
                            objectFit: 'cover',
                            width: '100%',
                            maxHeight: '240px',
                            display: 'block',
                            margin: '0',
                            maxWidth: '100%'
                          }}
                          onError={(e) => {
                            console.error('Error loading image:', e);
                            if (event.url_image && getFallbackImage(event.url)) {
                              e.target.src = getFallbackImage(event.url);
                              e.target.style.objectFit = 'contain';
                              e.target.style.maxHeight = '100px';
                              e.target.style.maxWidth = '180px';
                              e.target.style.margin = 'auto';
                              e.target.style.width = 'auto';
                              e.target.parentElement.style.height = '120px';
                              e.target.parentElement.style.backgroundColor = 'var(--background-paper, #f5f5f5)';
                              e.target.parentElement.style.padding = '8px';
                            } else {
                              e.target.style.display = 'none';
                            }
                          }}
                        />
                      </Box>
                    )}
                    <CardContent sx={{ flex: '1 0 auto', p: 2 }}>
                      {event.url_title && (
                        <Typography variant="subtitle1" component="div" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                          {event.url_title}
                        </Typography>
                      )}
                      {event.url_description && (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                          {truncateDescription(event.url_description)}
                        </Typography>
                      )}
                      <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                          <LinkIcon sx={{ fontSize: 14, mr: 0.5 }} />
                          {getSourceName(event.url)}
                        </Typography>
                      </Box>
                    </CardContent>
                  </>
                )}
              </Paper>
            </Link>
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
        onClose={() => {
          console.log('NewsCard: Closing popup');
          setPopupOpen(false);
        }}
      />
    </>
  );
});

export default NewsCard;
