import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  IconButton,
  useTheme,
  CircularProgress,
} from '@mui/material';
import {
  Fullscreen as FullscreenIcon,
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  VolumeUp as VolumeIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';

/**
 * VideoMediaPopup - A specialized component for displaying video media in a two-container layout
 * Left container: Fixed video display with black background and enhanced controls
 * Right container: Scrollable content area for event details
 */
const VideoMediaPopup = ({ event, mediaSource, children }) => {
  // Ensure we have a valid media source and prepare it for use
  const prepareMediaSource = () => {
    if (!mediaSource) {
      console.error('VideoMediaPopup: No media source provided');
      return '';
    }
    
    // If it's already a full URL, use it directly
    if (mediaSource.startsWith('http')) {
      return mediaSource;
    }
    
    // If it's a relative URL, we need to handle it
    // This would typically involve prepending the API URL, similar to what's done in EventPopup
    // For now, we'll just return the original source
    return mediaSource;
  };
  
  const processedMediaSource = prepareMediaSource();
  
  // Video player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const videoRef = useRef(null);
  const theme = useTheme();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [videoElement, setVideoElement] = useState(null);

  // Toggle fullscreen for the video
  const toggleFullscreen = () => {
    if (!videoElement) return;
    
    if (!isFullscreen) {
      if (videoElement.requestFullscreen) {
        videoElement.requestFullscreen();
      } else if (videoElement.webkitRequestFullscreen) {
        videoElement.webkitRequestFullscreen();
      } else if (videoElement.msRequestFullscreen) {
        videoElement.msRequestFullscreen();
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
      setIsFullscreen(false);
    }
  };
  
  // Toggle play/pause
  const togglePlayPause = () => {
    if (!videoElement) return;
    
    if (isPlaying) {
      videoElement.pause();
    } else {
      videoElement.play();
    }
    setIsPlaying(!isPlaying);
  };

  // Handle fullscreen change events and video events
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(
        document.fullscreenElement || 
        document.webkitFullscreenElement || 
        document.msFullscreenElement
      );
    };
    
    // Video event handlers
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleLoadStart = () => setIsLoading(true);
    const handleCanPlay = () => setIsLoading(false);
    const handleError = () => {
      setIsLoading(false);
      setHasError(true);
    };

    // Add event listeners
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);
    
    if (videoElement) {
      videoElement.addEventListener('play', handlePlay);
      videoElement.addEventListener('pause', handlePause);
      videoElement.addEventListener('loadstart', handleLoadStart);
      videoElement.addEventListener('canplay', handleCanPlay);
      videoElement.addEventListener('error', handleError);
    }

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
      
      if (videoElement) {
        videoElement.removeEventListener('play', handlePlay);
        videoElement.removeEventListener('pause', handlePause);
        videoElement.removeEventListener('loadstart', handleLoadStart);
        videoElement.removeEventListener('canplay', handleCanPlay);
        videoElement.removeEventListener('error', handleError);
      }
    };
  }, [videoElement]);

  return (
    <Box
      sx={{
        display: 'flex',
        width: '100%',
        height: '100%',
      }}
    >
      {/* Left container - Fixed video display */}
      <Box
        sx={{
          width: '60%',
          height: '100%',
          position: 'relative',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          bgcolor: 'black',
          overflow: 'hidden',
          borderRight: '1px solid',
          borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
        }}
      >
        {/* The video itself - centered and fixed */}
        <Box
          sx={{
            width: '100%',
            height: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            position: 'relative',
          }}
        >
          {processedMediaSource ? (
            <Box sx={{ width: '100%', height: '100%', position: 'relative' }}>
              <video
                ref={el => {
                  setVideoElement(el);
                  videoRef.current = el;
                }}
                controls
                autoPlay={false}
                style={{ 
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  backgroundColor: 'black',
                  display: 'block',
                }}
                onLoadStart={() => setIsLoading(true)}
                onCanPlay={() => setIsLoading(false)}
                onError={(e) => {
                  console.error('Error loading video:', e);
                  console.error('Failed video source:', processedMediaSource);
                  setIsLoading(false);
                  setHasError(true);
                  e.target.onerror = null;
                }}
              >
                {/* Use both source and src for maximum compatibility */}
                <source src={processedMediaSource} type={event.media_type || 'video/mp4'} />
                Your browser does not support the video tag.
              </video>
              
              {/* Loading overlay */}
              {isLoading && (
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
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    zIndex: 10,
                  }}
                >
                  <CircularProgress color="primary" size={60} />
                </Box>
              )}
              
              {/* Error message */}
              {hasError && (
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
                    backgroundColor: 'rgba(0,0,0,0.7)',
                    color: 'white',
                    textAlign: 'center',
                    padding: '20px',
                    zIndex: 10,
                  }}
                >
                  <Box>
                    <Typography variant="h6" component="p" sx={{ mb: 1 }}>
                      Error loading video
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.7 }}>
                      Source: {processedMediaSource}
                    </Typography>
                  </Box>
                </Box>
              )}
            </Box>
          ) : (
            <div style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              textAlign: 'center',
              padding: '20px'
            }}>
              <div>
                <p>No video source available</p>
                <p style={{ fontSize: '0.8em', opacity: 0.7 }}>Please check the media URL</p>
              </div>
            </div>
          )}
          
          {/* Video control overlays */}
          <Box
            sx={{
              position: 'absolute',
              bottom: 16,
              right: 16,
              display: 'flex',
              gap: 1,
              zIndex: 5,
            }}
          >
            {/* Play/Pause button */}
            <IconButton
              sx={{
                bgcolor: 'rgba(0,0,0,0.5)',
                color: 'white',
                '&:hover': {
                  bgcolor: 'rgba(0,0,0,0.7)',
                },
              }}
              onClick={togglePlayPause}
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <PauseIcon /> : <PlayIcon />}
            </IconButton>
            
            {/* Fullscreen button */}
            <IconButton
              sx={{
                bgcolor: 'rgba(0,0,0,0.5)',
                color: 'white',
                '&:hover': {
                  bgcolor: 'rgba(0,0,0,0.7)',
                },
              }}
              onClick={toggleFullscreen}
              title="Toggle fullscreen"
            >
              <FullscreenIcon />
            </IconButton>
          </Box>
        </Box>
      </Box>
      
      {/* Right container - Scrollable content */}
      <Box
        sx={{
          width: '40%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default VideoMediaPopup;
