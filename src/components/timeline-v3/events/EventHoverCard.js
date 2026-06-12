import React, { useState, useEffect } from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import { EVENT_TYPES, getHoverCardStyles } from './EventTypes';
import { AudioFile as AudioIcon } from '@mui/icons-material';

export const EventHoverCard = ({ event, position }) => {
  const theme = useTheme();
  const styles = getHoverCardStyles(event, theme);

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

  const renderContent = () => {
    switch (event.type) {
      case EVENT_TYPES.REMARK:
        return (
          <>
            <Typography className="title" variant="subtitle1">
              {event.title}
            </Typography>
            <Typography className="author" variant="body2">
              by {event.author}
            </Typography>
          </>
        );

      case EVENT_TYPES.NEWS:
        return (
          <>
            {!imageFailed && imageSrc && (
              <img 
                src={imageSrc} 
                alt={event.title}
                onError={handleImageError}
                className="image"
                style={{
                  objectFit: imageSrc === fallbackImage ? 'contain' : 'cover',
                  padding: imageSrc === fallbackImage ? '6px' : '0',
                  backgroundColor: imageSrc === fallbackImage ? 'rgba(0,0,0,0.03)' : 'transparent'
                }}
              />
            )}
            <Box className="content">
              <Typography className="title" variant="subtitle1">
                {event.title}
              </Typography>
              {event.url_source && (
                <Typography variant="caption" color="text.secondary">
                  {event.url_source}
                </Typography>
              )}
            </Box>
          </>
        );

      case EVENT_TYPES.MEDIA:
        return (
          <>
            {event.media_type === 'audio' ? (
              <Box 
                className="media-preview"
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                }}
              >
                <AudioIcon sx={{ fontSize: 48, opacity: 0.7 }} />
              </Box>
            ) : (
              <img 
                src={event.media_url} 
                alt={event.title}
                className="media-preview"
              />
            )}
            <Typography className="title" variant="subtitle2">
              {event.title}
            </Typography>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <Box
      sx={{
        ...styles,
        left: position.x,
        top: position.y,
      }}
    >
      {renderContent()}
    </Box>
  );
};
