import React, { useState, useCallback, useEffect } from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { EVENT_TYPE_COLORS, EVENT_TYPES } from '../EventTypes';
import EventPopup from '../EventPopup';

/**
 * Component for rendering News event markers in the timeline
 */
const NewsEventMarker = ({ event, onDelete, onEdit }) => {
  const theme = useTheme();
  const [popupOpen, setPopupOpen] = useState(false);
  
  const getBannerText = (url) => {
    if (!url) return 'News';
    try {
      const host = new URL(url.startsWith('http') ? url : `https://${url}`).hostname.toLowerCase();
      if (host.includes('instagram.com')) return 'Instagram';
      if (host.includes('tiktok.com')) return 'TikTok';
      if (host.includes('youtube.com') || host.includes('youtu.be')) return 'YouTube';
      if (host.includes('twitter.com') || host.includes('x.com')) return 'X / Twitter';
      if (host.includes('facebook.com')) return 'Facebook';
      if (host.includes('bsky.app')) return 'Bluesky';
      return 'News';
    } catch {
      return 'News';
    }
  };

  const getFallbackImage = (url) => {
    if (!url) return '';
    try {
      const host = new URL(url.startsWith('http') ? url : `https://${url}`).hostname.toLowerCase();
      if (host.includes('instagram.com')) return '/images/instagram-logo.png';
      if (host.includes('tiktok.com')) return '/images/tiktok-logo.svg';
      if (host.includes('youtube.com') || host.includes('youtu.be')) return '/images/youtube-logo.svg';
      if (host.includes('twitter.com') || host.includes('x.com')) return '/images/twitter-logo.svg';
      if (host.includes('facebook.com')) return '/images/facebook-logo.svg';
      if (host.includes('bsky.app')) return '/images/bluesky-logo.svg';
      return '';
    } catch {
      return '';
    }
  };

  const fallbackImage = getFallbackImage(event?.url);
  const [imageSrc, setImageSrc] = useState(event?.url_image || fallbackImage);
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    const fallback = getFallbackImage(event?.url);
    setImageSrc(event?.url_image || fallback);
    setImageFailed(false);
  }, [event?.id, event?.url, event?.url_image]);

  const handleImageError = () => {
    if (imageSrc && imageSrc !== fallbackImage) {
      setImageSrc(fallbackImage);
    } else {
      setImageFailed(true);
    }
  };

  const handleMarkerClick = useCallback((e) => {
    e.stopPropagation();
    setPopupOpen(true);
  }, []);

  const handlePopupClose = useCallback(() => {
    setPopupOpen(false);
  }, []);
  
  return (
    <>
      <EventPopup
        open={popupOpen}
        onClose={handlePopupClose}
        event={event}
        onDelete={onDelete}
        onEdit={onEdit}
      />
    <Paper
      elevation={3}
      onClick={handleMarkerClick}
      sx={{
        width: '100%',
        maxWidth: 280, // Increased max width
        cursor: 'pointer',
        overflow: 'hidden',
        borderRadius: '12px',
        // Type-specific background and border colors
        bgcolor: theme.palette.mode === 'dark' 
          ? 'rgba(40,20,20,0.95)' 
          : 'rgba(255,245,245,0.97)',
        border: `1px solid ${theme.palette.mode === 'dark' 
          ? 'rgba(220,160,160,0.2)' 
          : 'rgba(220,100,100,0.15)'}`,
        boxShadow: theme.palette.mode === 'dark' 
          ? '0 8px 20px rgba(0,0,0,0.6), 0 2px 8px rgba(150,50,50,0.3)' 
          : '0 8px 20px rgba(0,0,0,0.15), 0 2px 8px rgba(150,50,50,0.15)'
      }}
    >
      {/* Image container with overlay */}
      <Box sx={{ position: 'relative', width: '100%' }}>
        {/* News banner */}
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: EVENT_TYPE_COLORS[EVENT_TYPES.NEWS][theme.palette.mode === 'dark' ? 'dark' : 'light'],
          color: theme.palette.mode === 'dark' ? '#000' : '#fff',
          py: 0.3,
          fontFamily: '"Georgia", "Times New Roman", serif',
          fontWeight: 'bold',
          fontSize: '0.7rem',
          textTransform: 'uppercase',
          letterSpacing: '1px',
          position: 'relative',
          zIndex: 2 // Ensure banner stays above image
        }}>
          {getBannerText(event.url)}
        </Box>
        
        {/* Image with title overlay */}
        {!imageFailed && imageSrc ? (
          <Box sx={{
            width: '100%',
            aspectRatio: '16/9',
            overflow: 'hidden',
            position: 'relative',
            bgcolor: 'rgba(0,0,0,0.03)'
          }}>
            <Box 
              component="img"
              src={imageSrc}
              alt={event.title}
              onError={handleImageError}
              sx={{
                width: '100%',
                height: '100%',
                objectFit: imageSrc === fallbackImage ? 'contain' : 'cover',
                display: 'block',
                p: imageSrc === fallbackImage ? 1.5 : 0,
                bgcolor: imageSrc === fallbackImage ? 'rgba(0,0,0,0.03)' : 'transparent'
              }}
            />
            
            {/* Title overlay */}
            <Box sx={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 100%)',
              p: 1.5,
              color: '#fff',
              zIndex: 1,
              pt: 2.5
            }}>
              <Typography 
                variant="subtitle1" 
                sx={{ 
                  fontWeight: 'bold',
                  fontFamily: '"Georgia", "Times New Roman", serif',
                  textShadow: '0 1px 3px rgba(0,0,0,0.8)',
                  fontSize: '0.95rem',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  lineHeight: 1.3
                }}
              >
                {event.title}
              </Typography>
            </Box>
          </Box>
        ) : (
          /* Plain text fallback when no image */
          <Box sx={{ p: 1.5, color: 'text.primary' }}>
            <Typography 
              variant="subtitle1" 
              sx={{ 
                fontWeight: 'bold',
                fontFamily: '"Georgia", "Times New Roman", serif',
                fontSize: '0.95rem',
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                lineHeight: 1.3
              }}
            >
              {event.title}
            </Typography>
          </Box>
        )}
      </Box>
      
      {/* Date and time */}
      <Box sx={{ 
        p: '12px 16px',
        pt: 0.75,
        borderTop: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`
      }}>
        <Typography 
          variant="caption" 
          color="text.secondary" 
          sx={{ 
            display: 'block',
            fontFamily: 'Arial, sans-serif',
            fontSize: '0.7rem'
          }}
        >
          {event && event.event_date ? new Date(event.event_date).toLocaleString() : ''}
        </Typography>
      </Box>
      </Paper>
    </>
  );
};

export default NewsEventMarker;
