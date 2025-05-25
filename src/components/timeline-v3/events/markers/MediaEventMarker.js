import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Skeleton } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { EVENT_TYPE_COLORS, EVENT_TYPES } from '../EventTypes';
import config from '../../../../config';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import MovieIcon from '@mui/icons-material/Movie';
import VideocamIcon from '@mui/icons-material/Videocam';

/**
 * Component for rendering Media event markers in the timeline
 */
const MediaEventMarker = ({ event }) => {
  const theme = useTheme();
  const [thumbnailLoaded, setThumbnailLoaded] = useState(false);
  const [thumbnailError, setThumbnailError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [aspectRatio, setAspectRatio] = useState('16/9'); // Default to landscape
  
  // Helper function to prepare media source URL
  const prepareMediaSource = (mediaSource) => {
    if (!mediaSource) return '';
    
    const isCloudinaryUrl = (
      mediaSource.includes('cloudinary.com') || 
      mediaSource.includes('res.cloudinary')
    );
    
    if (isCloudinaryUrl) {
      return mediaSource;
    }
    
    if (mediaSource.startsWith('/')) {
      return `${config.API_URL}${mediaSource}`;
    }
    
    return mediaSource;
  };

  // Get media source with fallbacks
  const getMediaSource = () => {
    return event.media_url || event.mediaUrl || event.url || '';
  };

  // Generate a thumbnail URL for videos with better error handling
  const getVideoThumbnail = (videoUrl) => {
    if (!videoUrl) return '';
    
    try {
      // If there's already a thumbnail URL, use it
      if (event.thumbnail_url) {
        return event.thumbnail_url;
      }
      
      // If it's a YouTube URL, get the thumbnail
      if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
        const videoId = videoUrl.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
        if (videoId && videoId[1]) {
          return `https://img.youtube.com/vi/${videoId[1]}/hqdefault.jpg`;
        }
      }
      
      // If it's a Vimeo URL, get the thumbnail
      if (videoUrl.includes('vimeo.com')) {
        const videoId = videoUrl.match(/(?:vimeo\.com\/|player\.vimeo\.com\/video\/)(\d+)/);
        if (videoId && videoId[1]) {
          return `https://vumbnail.com/${videoId[1]}.jpg`;
        }
      }
      
      // For direct video files, try to get a thumbnail if it's a video
      if (['mp4', 'webm', 'mov'].some(ext => videoUrl.toLowerCase().endsWith(ext))) {
        // Return a placeholder for now - in a real app, you might want to generate a thumbnail
        return '';
      }
      
      return '';
    } catch (error) {
      console.error('Error generating thumbnail URL:', error);
      return '';
    }
  };
  
  // Handle thumbnail load
  const handleThumbnailLoad = (e) => {
    setThumbnailLoaded(true);
    setThumbnailError(false);
    
    // Detect aspect ratio if we have the image
    if (e.target.naturalWidth && e.target.naturalHeight) {
      const ratio = e.target.naturalWidth / e.target.naturalHeight;
      setAspectRatio(ratio > 1 ? '16/9' : '9/16'); // Simple classification as landscape or portrait
    }
  };
  
  const handleThumbnailError = () => {
    setThumbnailError(true);
    setThumbnailLoaded(false);
  };

  // Determine media type
  const getMediaType = () => {
    if (event.media_subtype) {
      return event.media_subtype;
    }
    
    const mediaSource = getMediaSource();
    const fileExt = mediaSource.split('.').pop()?.toLowerCase() || '';
    
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(fileExt)) {
      return 'image';
    } else if (['mp4', 'webm', 'ogg', 'mov', 'avi', 'wmv', 'flv', 'mkv'].includes(fileExt)) {
      return 'video';
    } else if (['mp3', 'wav', 'ogg', 'aac', 'flac', 'm4a', 'wma'].includes(fileExt)) {
      return 'audio';
    }
    
    return event.media_type || 'image'; // Default to image if unknown
  };

  const mediaType = getMediaType();
  const mediaSource = prepareMediaSource(getMediaSource());
  
  // Handle different media types
  if (mediaType === 'image') {
    return (
      <Paper
        elevation={3}
        sx={{
          maxWidth: 250, 
          cursor: 'pointer',
          overflow: 'hidden',
          borderRadius: '12px',
          bgcolor: theme.palette.mode === 'dark' 
            ? 'rgba(30,20,40,0.95)'
            : 'rgba(245,240,255,0.97)',
          border: `1px solid ${theme.palette.mode === 'dark' 
            ? 'rgba(180,160,220,0.2)'
            : 'rgba(140,100,220,0.15)'}`,
          boxShadow: theme.palette.mode === 'dark' 
            ? '0 8px 20px rgba(0,0,0,0.6), 0 2px 8px rgba(100,50,150,0.3)' 
            : '0 8px 20px rgba(0,0,0,0.15), 0 2px 8px rgba(100,50,150,0.15)'
        }}
      >
        <Box sx={{ position: 'relative' }}>
          {/* Image */}
          <Box 
            component="img"
            src={mediaSource}
            alt={event.title || 'Media'}
            onError={(e) => {
              // Fallback to a placeholder if image fails to load
              e.target.onerror = null;
              e.target.src = 'https://via.placeholder.com/300x150?text=Image+Not+Available';
            }}
            sx={{
              width: '100%',
              height: 150,
              objectFit: 'cover',
              borderRadius: '4px',
            }}
          />
          
          {/* Title overlay at bottom */}
          <Box sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: 'rgba(0,0,0,0.7)',
            color: 'white',
            p: 1,
            borderRadius: '0 0 4px 4px'
          }}>
            <Typography variant="subtitle2" sx={{ 
              fontWeight: 'bold',
              lineHeight: 1.2,
              textAlign: 'center',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              fontSize: '0.8rem'
            }}>
              {event.title}
            </Typography>
            
            {/* Date in small text */}
            <Typography variant="caption" sx={{ 
              display: 'block',
              textAlign: 'center',
              mt: 0.5,
              opacity: 0.8
            }}>
              {event && event.event_date ? new Date(event.event_date).toLocaleString() : ''}
            </Typography>
          </Box>
        </Box>
      </Paper>
    );
  } else if (mediaType === 'video') {
    const thumbnailUrl = event.thumbnail_url || getVideoThumbnail(mediaSource);
    const hasThumbnail = !!thumbnailUrl;
    const showFallback = !hasThumbnail || thumbnailError;
    
    return (
      <Paper
        elevation={isHovered ? 6 : 3}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        sx={{
          maxWidth: 250,
          width: '100%',
          cursor: 'pointer',
          overflow: 'hidden',
          borderRadius: '12px',
          bgcolor: theme.palette.mode === 'dark' 
            ? 'rgba(30,20,40,0.95)'
            : 'rgba(245,240,255,0.97)',
          border: `1px solid ${theme.palette.mode === 'dark' 
            ? 'rgba(180,160,220,0.2)'
            : 'rgba(140,100,220,0.15)'}`,
          boxShadow: isHovered 
            ? theme.palette.mode === 'dark' 
              ? '0 8px 25px rgba(0,0,0,0.7), 0 4px 12px rgba(100,50,150,0.4)'
              : '0 8px 25px rgba(0,0,0,0.2), 0 4px 12px rgba(100,50,150,0.2)'
            : theme.palette.mode === 'dark' 
              ? '0 8px 20px rgba(0,0,0,0.6), 0 2px 8px rgba(100,50,150,0.3)' 
              : '0 8px 20px rgba(0,0,0,0.15), 0 2px 8px rgba(100,50,150,0.15)',
          transition: 'all 0.3s ease-in-out',
          transform: isHovered ? 'translateY(-4px)' : 'none'
        }}
      >
        {/* Video preview with play button overlay */}
        <Box sx={{ 
          position: 'relative',
          width: '100%',
          paddingTop: aspectRatio === '9/16' ? '177.78%' : '56.25%', // 16:9 or 9:16 aspect ratio
          bgcolor: theme.palette.mode === 'dark' ? 'rgba(30,30,40,0.8)' : 'rgba(230,230,240,0.8)',
          overflow: 'hidden'
        }}>
          {/* Loading skeleton */}
          {!thumbnailLoaded && !showFallback && (
            <Skeleton 
              variant="rectangular" 
              width="100%" 
              height="100%" 
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'
              }} 
            />
          )}
          
          {/* Video thumbnail */}
          {!showFallback && (
            <Box
              component="img"
              src={thumbnailUrl}
              alt="Video thumbnail"
              loading="lazy"
              onLoad={handleThumbnailLoad}
              onError={handleThumbnailError}
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                opacity: thumbnailLoaded ? 0.9 : 0,
                transition: 'opacity 0.3s ease',
                '&:hover': {
                  opacity: thumbnailLoaded ? 0.8 : 0
                }
              }}
            />
          )}
          
          {/* Fallback content when no thumbnail is available */}
          {showFallback && (
            <Box sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: theme.palette.mode === 'dark' ? 'rgba(40,30,60,0.7)' : 'rgba(230,220,250,0.7)',
              color: theme.palette.text.secondary,
              p: 2,
              textAlign: 'center'
            }}>
              <VideocamIcon sx={{ 
                fontSize: 48, 
                mb: 1,
                color: theme.palette.mode === 'dark' 
                  ? 'rgba(255,255,255,0.6)' 
                  : 'rgba(0,0,0,0.4)' 
              }} />
              <Typography variant="caption" sx={{ 
                fontSize: '0.7rem',
                color: theme.palette.mode === 'dark' 
                  ? 'rgba(255,255,255,0.7)' 
                  : 'rgba(0,0,0,0.6)'
              }}>
                Video Content
              </Typography>
            </Box>
          )}
          
          {/* Play button overlay */}
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(0,0,0,0.4))',
              backdropFilter: 'blur(1px)',
              transition: 'all 0.3s ease',
              '&:hover': {
                background: 'linear-gradient(to bottom, rgba(0,0,0,0.2), rgba(0,0,0,0.5))',
                '& .play-button': {
                  transform: 'scale(1.2)',
                  boxShadow: `0 0 0 4px ${theme.palette.primary.main}40, 0 0 25px rgba(0,0,0,0.4)`,
                  '& svg': {
                    color: theme.palette.primary.main
                  }
                }
              }
            }}
          >
            <Box
              className="play-button"
              sx={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                bgcolor: 'rgba(255,255,255,0.95)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: theme.palette.primary.main,
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: `0 4px 16px rgba(0,0,0,0.2)`,
                border: `2px solid ${theme.palette.primary.main}20`,
                '&:hover': {
                  transform: 'scale(1.2)',
                  bgcolor: 'rgba(255,255,255,1)',
                  boxShadow: `0 0 0 4px ${theme.palette.primary.main}40, 0 0 25px rgba(0,0,0,0.4)`
                },
                '&:active': {
                  transform: 'scale(1.1)'
                }
              }}
            >
              <PlayArrowIcon sx={{ 
                fontSize: 36, 
                ml: '3px',
                transition: 'all 0.3s ease',
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
              }} />
            </Box>
          </Box>
        </Box>
        
        {/* Title and date */}
        <Box sx={{ 
          p: 1.5,
          borderTop: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`
        }}>
          <Typography 
            variant="subtitle2" 
            sx={{ 
              fontWeight: 600, 
              mb: 0.5,
              textTransform: 'none',
              letterSpacing: '0.3px',
              fontSize: '0.82rem',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              lineHeight: 1.3,
              color: theme.palette.text.primary
            }}
          >
            {event.title || 'Untitled Video'}
          </Typography>
          <Typography 
            variant="caption" 
            sx={{ 
              display: 'block',
              fontSize: '0.7rem',
              color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)'
            }}
          >
            {event?.event_date ? new Date(event.event_date).toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            }) : ''}
          </Typography>
        </Box>
      </Paper>
    );
  } else if (mediaType === 'audio') {
    return (
      <Paper
        elevation={3}
        sx={{
          maxWidth: 250, 
          cursor: 'pointer',
          overflow: 'hidden',
          borderRadius: '12px',
          bgcolor: theme.palette.mode === 'dark' 
            ? 'rgba(30,20,40,0.95)'
            : 'rgba(245,240,255,0.97)',
          border: `1px solid ${theme.palette.mode === 'dark' 
            ? 'rgba(180,160,220,0.2)'
            : 'rgba(140,100,220,0.15)'}`,
          boxShadow: theme.palette.mode === 'dark' 
            ? '0 8px 20px rgba(0,0,0,0.6), 0 2px 8px rgba(100,50,150,0.3)' 
            : '0 8px 20px rgba(0,0,0,0.15), 0 2px 8px rgba(100,50,150,0.15)'
        }}
      >
        <Box sx={{ p: 2, textAlign: 'center' }}>
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              bgcolor: theme.palette.primary.light,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              color: 'white'
            }}
          >
            <MusicNoteIcon fontSize="large" />
          </Box>
          
          {/* Audio info */}
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="subtitle2" sx={{ 
              fontWeight: 'bold', 
              mb: 0.5,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              fontSize: '0.8rem'
            }}>
              {event.title || 'Untitled Audio'}
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
              Audio File
            </Typography>
            
            {/* Audio visualization */}
            <Box sx={{
              height: 40,
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'center',
              gap: '3px',
              mb: 1,
              opacity: 0.7
            }}>
              {Array.from({ length: 15 }).map((_, i) => (
                <Box 
                  key={i}
                  sx={{
                    width: 3,
                    height: `${5 + Math.sin(i * 0.7) * 15}px`,
                    bgcolor: theme.palette.primary.main,
                    borderRadius: '1px',
                    transition: 'height 0.2s ease-in-out'
                  }}
                />
              ))}
            </Box>
            
            <Typography variant="caption" color="text.secondary">
              {event?.event_date ? new Date(event.event_date).toLocaleString() : ''}
            </Typography>
          </Box>
        </Box>
        

      </Paper>
    );
  }
  
  // Default fallback
  return null;
};

export default MediaEventMarker;
