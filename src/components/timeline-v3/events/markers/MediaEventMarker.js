import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Skeleton, keyframes } from '@mui/material';
import { useTheme, styled } from '@mui/material/styles';
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
        return prepareMediaSource(event.thumbnail_url);
      }
      
      // If it's a YouTube URL, get the thumbnail
      if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
        const videoId = videoUrl.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
        if (videoId && videoId[1]) {
          return `https://img.youtube.com/vi/${videoId[1]}/maxresdefault.jpg`; // Using maxresdefault for higher quality
        }
      }
      
      // If it's a Vimeo URL, get the thumbnail
      if (videoUrl.includes('vimeo.com')) {
        const videoId = videoUrl.match(/(?:vimeo\.com\/|player\.vimeo\.com\/video\/)(\d+)/);
        if (videoId && videoId[1]) {
          // First try the vumbnail service
          const vumbnailUrl = `https://vumbnail.com/${videoId[1]}.jpg`;
          // Fallback to Vimeo's own thumbnail API if needed
          return vumbnailUrl || `https://vimeo.com/api/v2/video/${videoId[1]}.json`;
        }
      }
      
      // For direct video files, check if there's a corresponding image file
      if (['mp4', 'webm', 'mov'].some(ext => videoUrl.toLowerCase().endsWith(ext))) {
        // Try to find a corresponding image file with the same name but different extension
        const baseUrl = videoUrl.split('.').slice(0, -1).join('.');
        const possibleExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
        
        for (const ext of possibleExtensions) {
          const potentialThumbnail = `${baseUrl}${ext}`;
          // In a real app, you would check if this URL exists
          // For now, we'll just return the first potential URL
          return potentialThumbnail;
        }
      }
      
      return '';
    } catch (error) {
      console.error('Error generating thumbnail URL:', error);
      return '';
    }
  };
  
  // Handle thumbnail load
  const handleThumbnailLoad = (e) => {
    // Only proceed if the image loaded successfully
    if (e.target.complete && e.target.naturalWidth !== 0) {
      setThumbnailLoaded(true);
      setThumbnailError(false);
      
      // Detect aspect ratio if we have the image
      const { naturalWidth, naturalHeight } = e.target;
      if (naturalWidth && naturalHeight) {
        const ratio = naturalWidth / naturalHeight;
        // More precise aspect ratio detection
        if (ratio > 1.7) {
          setAspectRatio('16/9'); // Wide landscape
        } else if (ratio < 0.7) {
          setAspectRatio('9/16'); // Portrait
        } else {
          setAspectRatio('1/1'); // Square
        }
      }
    } else {
      handleThumbnailError();
    }
  };
  
  const handleThumbnailError = () => {
    console.log('Thumbnail failed to load, showing fallback');
    setThumbnailError(true);
    setThumbnailLoaded(false);
  };
  
  // Get the media source and thumbnail URL
  const mediaSource = getMediaSource();
  const preparedMediaSource = prepareMediaSource(mediaSource);
  const thumbnailUrl = getVideoThumbnail(mediaSource);
  const showFallback = !thumbnailUrl || thumbnailError;

  // Determine media type
  const getMediaType = () => {
    const source = mediaSource.toLowerCase();
    if (source.match(/\.(mp4|webm|mov|avi|wmv|flv|mkv|m4v)$/i)) {
      return 'video';
    } else if (source.match(/\.(mp3|wav|ogg|m4a|aac|flac)$/i)) {
      return 'audio';
    } else if (source.match(/\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i)) {
      return 'image';
    } else if (source.includes('youtube.com') || source.includes('youtu.be') || source.includes('vimeo.com')) {
      return 'video';
    }
    return 'unknown';
  };

  const mediaType = getMediaType();
  
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
    
    // Animation for the REC indicator pulse
  const pulse = keyframes`
    0% { opacity: 0.5; transform: scale(1); }
    50% { opacity: 1; transform: scale(1.1); }
    100% { opacity: 0.5; transform: scale(1); }
  `;

  // Styled components for the camcorder effect
  const CamcorderBorder = styled(Box)({
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 3,
    pointerEvents: 'none',
    '&::before, &::after, & > div::before, & > div::after': {
      content: '""',
      position: 'absolute',
      width: '16px',
      height: '16px',
      border: '2px solid #b0b0b0',
      zIndex: 4,
      opacity: 0.9,
    },
    '&::before': {
      top: '6px',
      left: '6px',
      borderRight: 'none',
      borderBottom: 'none',
    },
    '&::after': {
      top: '6px',
      right: '6px',
      borderLeft: 'none',
      borderBottom: 'none',
    },
    '& > div::before': {
      bottom: '6px',
      left: '6px',
      borderRight: 'none',
      borderTop: 'none',
    },
    '& > div::after': {
      bottom: '6px',
      right: '6px',
      borderLeft: 'none',
      borderTop: 'none',
    },
  });

  // Red circle component
  const RedCircle = styled(Box)({
    position: 'absolute',
    top: '10px',
    right: '10px',
    width: '8px',
    height: '8px',
    backgroundColor: '#ff3d3d',
    borderRadius: '50%',
    animation: `${pulse} 1.5s infinite`,
    zIndex: 5,
  });

  // REC text component
  const RecText = styled(Box)({
    position: 'absolute',
    top: '22px', // Positioned below the red circle
    right: '6px', // Centered under the red circle
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    color: 'white',
    fontSize: '9px',
    fontWeight: 'bold',
    padding: '2px 6px',
    borderRadius: '10px',
    backdropFilter: 'blur(2px)',
    zIndex: 4,
  });

  return (
      <Paper
        elevation={3}
        sx={{
          maxWidth: 270, // 250 * 1.05 (5% larger)
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
          boxShadow: theme.palette.mode === 'dark' 
            ? '0 8px 20px rgba(0,0,0,0.6), 0 2px 8px rgba(100,50,150,0.3)' 
            : '0 8px 20px rgba(0,0,0,0.15), 0 2px 8px rgba(100,50,150,0.15)',
          position: 'relative',
          transform: 'scale(1.05)',
          transformOrigin: 'top center',
          transition: 'all 0.3s ease-in-out'
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
              <PlayArrowIcon sx={{ 
                fontSize: 48, 
                mb: 1,
                color: theme.palette.mode === 'dark' 
                  ? 'rgba(255,255,255,0.8)' 
                  : 'rgba(0,0,0,0.6)',
                backgroundColor: 'rgba(0, 0, 0, 0.3)',
                borderRadius: '25%',
                padding: '8px',
                boxSizing: 'content-box'
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
          
          {/* Camcorder border overlay */}
          <CamcorderBorder className="camcorder-border">
            <div />
          </CamcorderBorder>
          {/* REC indicator */}
          <RedCircle className="red-circle" />
          <RecText className="rec-text">REC</RecText>
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
