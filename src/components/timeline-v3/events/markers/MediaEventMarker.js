import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { EVENT_TYPE_COLORS, EVENT_TYPES } from '../EventTypes';
import config from '../../../../config';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import MovieIcon from '@mui/icons-material/Movie';

/**
 * Component for rendering Media event markers in the timeline
 */
const MediaEventMarker = ({ event }) => {
  const theme = useTheme();
  
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

  // Generate a thumbnail URL for videos
  const getVideoThumbnail = (videoUrl) => {
    if (!videoUrl) return '';
    
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
        // Use vumbnail for Vimeo thumbnails
        return `https://vumbnail.com/${videoId[1]}.jpg`;
      }
    }
    
    // For direct video files, return a placeholder
    return '';
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
        {/* Video preview with play button overlay */}
        <Box sx={{ 
          position: 'relative', 
          height: 180, 
          bgcolor: theme.palette.mode === 'dark' ? 'rgba(40,40,40,0.5)' : 'rgba(230,230,230,0.5)',
          overflow: 'hidden'
        }}>
          {/* Video thumbnail with optimized loading */}
          <Box sx={{
            width: '100%',
            height: '100%',
            position: 'relative',
            overflow: 'hidden',
            backgroundColor: theme.palette.mode === 'dark' ? 'rgba(30,30,30,0.8)' : 'rgba(240,240,240,0.8)'
          }}>
            <Box
              component="div"
              sx={{
                width: '100%',
                height: '100%',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                backgroundImage: `url(${event.thumbnail_url || getVideoThumbnail(mediaSource)})`,
                opacity: 0.9,
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                transition: 'opacity 0.3s ease',
                '&:hover': {
                  opacity: 0.8
                }
              }}
            >
              {!event.thumbnail_url && !getVideoThumbnail(mediaSource) && (
                <Box sx={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: theme.palette.text.secondary,
                  opacity: 0.7
                }}>
                  <MovieIcon sx={{ fontSize: 60, color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }} />
                </Box>
              )}
            </Box>
          </Box>
          
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
              background: 'linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(0,0,0,0.3))',
              '&:hover': {
                '& .play-button': {
                  transform: 'scale(1.15)',
                  boxShadow: '0 0 20px rgba(0,0,0,0.3)'
                }
              }
            }}
          >
            <Box
              className="play-button"
              sx={{
                width: 60,
                height: 60,
                borderRadius: '50%',
                bgcolor: 'rgba(255,255,255,0.9)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: theme.palette.primary.main,
                transition: 'all 0.2s ease-in-out',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                '&:hover': {
                  transform: 'scale(1.15)',
                  bgcolor: 'rgba(255,255,255,0.95)'
                }
              }}
            >
              <PlayArrowIcon sx={{ fontSize: 40, ml: '4px' }} />
            </Box>
          </Box>
        </Box>
        
        {/* Title and date */}
        <Box sx={{ p: 1.5 }}>
          <Typography variant="subtitle2" sx={{ 
            fontWeight: 'bold', 
            mb: 0.5,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            fontSize: '0.8rem'
          }}>
            {event.title || 'Untitled Video'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {event?.event_date ? new Date(event.event_date).toLocaleString() : ''}
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
