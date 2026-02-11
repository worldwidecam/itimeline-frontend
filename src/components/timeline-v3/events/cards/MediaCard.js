import React, { useState, forwardRef, useImperativeHandle, useEffect, useRef } from 'react';
import {
  Typography,
  IconButton,
  Link,
  Box,
  Tooltip,
  useTheme,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Chip,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Movie as MediaIcon,
  Event as EventIcon,
  AccessTime as AccessTimeIcon,
  MoreVert as MoreVertIcon,
  MusicNote as MusicIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import MovieIcon from '@mui/icons-material/Movie';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { motion } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import { Link as RouterLink } from 'react-router-dom';
import { EVENT_TYPES, EVENT_TYPE_COLORS } from '../EventTypes';
import EventCardChipsRow from './EventCardChipsRow';
import EventPopup from '../EventPopup';
import PageCornerButton from '../PageCornerButton';
import VoteControls from '../VoteControls';
import VoteOverlay from '../VoteOverlay';
import VideoDetailsButton from './VideoDetailsButton';
import AudioWaveformVisualizer from '../../../../components/AudioWaveformVisualizer';
import config from '../../../../config';
import UserAvatar from '../../../common/UserAvatar';
import { useEventVote } from '../../../../hooks/useEventVote';

const MediaCard = forwardRef(({
  event,
  onEdit,
  onDelete,
  isSelected,
  setIsPopupOpen,
  reviewingEventIds = new Set(),
  showInlineVoteControls = true,
  showVoteOverlay = false,
}, ref) => {
  // Add error boundary state
  const [hasError, setHasError] = useState(false);
  
  // Reset error state when event changes
  useEffect(() => {
    setHasError(false);
  }, [event]);
  
  // If there's an error, show a fallback UI
  if (hasError) {
    return (
      <Box sx={{ 
        p: 2, 
        border: '1px solid', 
        borderColor: 'error.main',
        borderRadius: 1,
        bgcolor: 'background.paper',
        color: 'error.main'
      }}>
        <Typography variant="body2">Error loading media card</Typography>
      </Box>
    );
  }
  const theme = useTheme();
  const [popupOpen, setPopupOpen] = useState(false);
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const {
    value: voteValue,
    totalVotes,
    positiveRatio,
    isLoading: voteLoading,
    error: voteError,
    handleVoteChange,
  } = useEventVote(event?.id);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef(null);
  
  // Determine media subtype and apply specific colors
  const getMediaTypeAndColor = () => {
    // Check for media subtype first
    if (event && event.media_subtype) {
      switch(event.media_subtype) {
        case 'image':
          return { type: 'image', color: '#009688', icon: MediaIcon }; // Teal
        case 'video':
          return { type: 'video', color: '#4a148c', icon: MovieIcon }; // Deep Purple
        case 'audio':
          return { type: 'audio', color: '#e65100', icon: MusicNoteIcon }; // Orange
        default:
          break;
      }
    }
    
    // Fall back to detection logic
    const mediaSource = event.media_url || event.url;
    if (mediaSource) {
      const fileExt = mediaSource.split('.').pop()?.toLowerCase();
      const isImage = 
        (fileExt && ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(fileExt)) ||
        (event.media_type && event.media_type.includes('image'));
      const isVideo = 
        (fileExt && ['mp4', 'webm', 'ogg', 'mov'].includes(fileExt)) ||
        (event.media_type && event.media_type.includes('video'));
      const isAudio = 
        (fileExt && ['mp3', 'wav', 'ogg', 'aac'].includes(fileExt)) ||
        (event.media_type && event.media_type.includes('audio'));
      
      if (isImage) return { type: 'image', color: '#009688', icon: MediaIcon };
      if (isVideo) return { type: 'video', color: '#4a148c', icon: MovieIcon };
      if (isAudio) return { type: 'audio', color: '#e65100', icon: MusicNoteIcon };
    }
    
    // Default fallback to purple media color
    const typeColors = EVENT_TYPE_COLORS[EVENT_TYPES.MEDIA];
    return { 
      type: 'unknown', 
      color: theme.palette.mode === 'dark' ? typeColors.dark : typeColors.light,
      icon: MediaIcon 
    };
  };
  
  const { type: mediaType, color, icon: TypeIcon } = getMediaTypeAndColor();
  
  // Expose methods to parent component via ref
  useImperativeHandle(ref, () => ({
    setPopupOpen: (open) => {
      try {
        console.log('MediaCard: External call to setPopupOpen', open);
        setPopupOpen(open);
        // Also notify TimelineV3 about popup state change
        if (setIsPopupOpen && typeof setIsPopupOpen === 'function') {
          setIsPopupOpen(open);
        }
      } catch (error) {
        console.error('Error in setPopupOpen:', error);
      }
    },
    pauseVideo: () => {
      try {
        if (videoRef.current && !videoRef.current.paused) {
          videoRef.current.pause();
          setIsPlaying(false);
        }
      } catch (error) {
        console.error('Error pausing video:', error);
      }
    }
  }), [videoRef]); // Add videoRef to dependency array
  
  // Effect to pause video when card is deselected
  useEffect(() => {
    if (!isSelected && videoRef.current && !videoRef.current.paused) {
      console.log('MediaCard: Pausing video because card was deselected');
      videoRef.current.pause();
      setIsPlaying(false);
    }
  }, [isSelected]);

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
    
    // Pause the video if it's playing
    if (videoRef.current && !videoRef.current.paused) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
    
    setPopupOpen(true);
  };

  // Function to determine if this is a video media card
  const isVideoMediaCard = () => {
    // Check multiple indicators to determine if this is a video
    // 1. Check media_subtype field (new approach)
    if (event.media_subtype === 'video') {
      console.log('Video detected via media_subtype');
      return true;
    }
    
    // 2. Check media_url for video extensions
    if (event.media_url && /\.(mp4|webm|ogg|mov|avi|wmv|flv|mkv)$/i.test(event.media_url)) {
      console.log('Video detected via file extension');
      return true;
    }
    
    // 3. Check media_type field for video MIME types
    if (event.media_type && event.media_type.includes('video')) {
      console.log('Video detected via media_type');
      return true;
    }
    
    // 4. Check if there's a video element in the DOM for this card
    const cardElement = document.getElementById(`media-card-${event.id}`);
    if (cardElement && cardElement.querySelector('video')) {
      console.log('Video detected via DOM element');
      return true;
    }
    
    return false;
  };

  const handleCardClick = () => {
    console.log('MediaCard clicked');
    
    if (onEdit && typeof onEdit === 'function') {
      if (isSelected) {
        // If already selected, open the popup (consistent behavior for all media types)
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

  // Helper function to prepare media sources
  const prepareMediaSources = (mediaSource) => {
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
    
    // If media_url is already a complete Cloudinary URL, use it directly
    if (isCloudinaryUrl && fullUrl) {
      mediaSources.push(fullUrl);
    }
    
    // Only try to construct URLs from cloudinary_id if we don't already have a valid Cloudinary URL
    if (event.cloudinary_id && !isCloudinaryUrl) {
      const cloudName = 'dnjwvuxn7';
      const isVideo = (event.media_subtype === 'video') || (event.media_type && event.media_type.includes('video'));
      const isAudio = (event.media_subtype === 'audio') || (event.media_type && event.media_type.includes('audio'));
      const resourcePath = (isVideo || isAudio) ? 'video/upload' : 'image/upload';
      const base = `https://res.cloudinary.com/${cloudName}/${resourcePath}/${event.cloudinary_id}`;
      if (isVideo) {
        mediaSources.push(`${base}.mp4`);
        mediaSources.push(`${base}.webm`);
        mediaSources.push(`${base}`);
      } else if (isAudio) {
        mediaSources.push(`${base}.mp3`);
        mediaSources.push(`${base}.m4a`);
        mediaSources.push(`${base}`);
      } else {
        mediaSources.push(`${base}.jpg`);
        mediaSources.push(`${base}`);
      }
    }

    // Add fallback URL if not already added
    if (!isCloudinaryUrl && fullUrl) {
      mediaSources.push(fullUrl);
    }
    
    if (mediaSource && mediaSource.startsWith('/uploads/')) {
      mediaSources.push(`${config.API_URL}${mediaSource}`);
    }
    
    // De-duplicate while preserving order
    const deduped = Array.from(new Set(mediaSources));
    return { mediaSources: deduped, fullUrl };
  };

  // Derive Cloudinary public_id from a Cloudinary URL if cloudinary_id is missing
  const getCloudinaryPublicIdFromUrl = (url) => {
    try {
      if (!url || typeof url !== 'string') return '';
      if (!url.includes('res.cloudinary.com') && !url.includes('cloudinary.com')) return '';
      // Expect pattern: .../upload/v<ver>/<public_id>.<ext>
      const parts = url.split('/');
      const uploadIdx = parts.findIndex(p => p === 'upload');
      if (uploadIdx === -1 || uploadIdx >= parts.length - 1) return '';
      const afterUpload = parts.slice(uploadIdx + 1).join('/');
      // Remove version (e.g., v1757609015/) if present
      const afterNoVersion = afterUpload.replace(/^v\d+\//, '');
      // Strip extension and query params
      const publicId = afterNoVersion.replace(/\.[^\.\/?]+(\?.*)?$/, '');
      return publicId;
    } catch (_) {
      return '';
    }
  };

  // Simple error boundary component for video rendering
  class VideoErrorBoundary extends React.Component {
    constructor(props) {
      super(props);
      this.state = { hasError: false };
    }

    static getDerivedStateFromError() {
      return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
      console.error('Video rendering error:', error, errorInfo);
    }

    render() {
      if (this.state.hasError) {
        return (
          <Box sx={{ 
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: theme.palette.error.main,
            textAlign: 'center',
            p: 2,
            height: '100%',
            width: '100%'
          }}>
            <ErrorOutlineIcon sx={{ fontSize: 48, mb: 1 }} />
            <Typography variant="caption">Failed to load video</Typography>
          </Box>
        );
      }
      return this.props.children;
    }
  }

  // Render image media
  const renderImageMedia = (mediaSource) => {
    const { mediaSources } = prepareMediaSources(mediaSource);
    
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
          icon={<TypeIcon />}
          color={color}
        />
      </Box>
    );
  };



  // Render video media
  const renderVideoMedia = (mediaSource) => {
    try {
      // Check for valid media source
      if (!mediaSource) {
        return (
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center',
            height: '100%',
            color: theme.palette.text.secondary,
            textAlign: 'center',
            p: 2
          }}>
            <MovieIcon sx={{ fontSize: 48, mb: 1, opacity: 0.5 }} />
            <Typography variant="caption">No video source</Typography>
          </Box>
        );
      }

      // If we have a Cloudinary public_id (direct or derived), prefer Cloudinary Player for consistent playback
      const derivedPublicId = getCloudinaryPublicIdFromUrl(mediaSource || event?.media_url || event?.url);
      const cloudinaryPublicId = (event && event.cloudinary_id) || derivedPublicId;
      if (cloudinaryPublicId) {
        const base = `https://res.cloudinary.com/dnjwvuxn7/video/upload/${cloudinaryPublicId}`;
        const poster = `${base}.jpg`;
        const srcFillAuto = `https://res.cloudinary.com/dnjwvuxn7/video/upload/c_fill,g_auto,f_auto,vc_auto/${cloudinaryPublicId}`;
        const srcAuto = `https://res.cloudinary.com/dnjwvuxn7/video/upload/f_auto,vc_auto/${cloudinaryPublicId}`;
        const srcMp4 = `${base}.mp4`;
        const srcWebm = `${base}.webm`;
        return (
          <Box 
            sx={{ 
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              overflow: 'hidden',
              zIndex: 1,
              backgroundColor: theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.05)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Box sx={{ width: '100%', height: '100%' }}>
              <video
                ref={videoRef}
                controls={isSelected}
                playsInline
                preload="metadata"
                muted={!isSelected}
                poster={poster}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  objectPosition: 'center',
                  background: 'black',
                  display: 'block'
                }}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onEnded={() => setIsPlaying(false)}
                onError={(e) => {
                  // Try a sequence of fallbacks
                  const current = e.target.currentSrc || e.target.src;
                  const candidates = [srcFillAuto, srcAuto, srcMp4, srcWebm, base, mediaSource].filter(Boolean);
                  const idx = candidates.findIndex(u => current && current.startsWith(u));
                  const next = idx >= 0 && idx < candidates.length - 1 ? candidates[idx + 1] : null;
                  if (next) {
                    e.target.src = next;
                  }
                }}
              >
                {[srcFillAuto, srcAuto, srcMp4, srcWebm, base].filter(Boolean).map((src, i) => {
                  const ext = src.split('.').pop();
                  const type = ext === 'mp4' ? 'video/mp4' : ext === 'webm' ? 'video/webm' : undefined;
                  return (
                    <source key={i} src={src} {...(type ? { type } : {})} />
                  );
                })}
              </video>
            </Box>
            <PageCornerButton 
              position="top-right" 
              onClick={handleDetailsClick}
              tooltip="View Details"
              icon={<TypeIcon />}
              color={color}
            />
          </Box>
        );
      }

      // Safely prepare media sources
      const preparedMedia = prepareMediaSources(mediaSource);
      if (!preparedMedia) {
        throw new Error('Failed to prepare media sources');
      }

      // Ensure we have valid media sources
      const { mediaSources = [], fullUrl = '' } = preparedMedia;
      const validMediaSources = Array.isArray(mediaSources) ? mediaSources.filter(Boolean) : [];
      const hasValidSource = validMediaSources.length > 0;
      const fileExt = (() => {
        if (typeof fullUrl === 'string') {
          const ext = fullUrl.split('.').pop()?.toLowerCase();
          return ext || 'mp4';
        }
        return 'mp4';
      })();
      
      return (
        <VideoErrorBoundary>
          <Box 
            sx={{ 
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              overflow: 'hidden',
              zIndex: 1,
              backgroundColor: theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.05)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {hasValidSource ? (
              <>
                <video
                  ref={videoRef}
                  controls={isSelected}
                  width="100%"
                  height="100%"
                  style={{ 
                    objectFit: 'cover',
                    opacity: isSelected ? 0.99 : 1,
                    maxWidth: '100%',
                    maxHeight: '100%',
                    backgroundColor: 'transparent'
                  }}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onEnded={() => setIsPlaying(false)}
                  onError={(e) => {
                    try {
                      const currentSrc = e.target.src;
                      const currentIndex = validMediaSources.indexOf(currentSrc);
                      setIsPlaying(false);
                      
                      if (currentIndex >= 0 && currentIndex < validMediaSources.length - 1) {
                        // Try the next source
                        e.target.src = validMediaSources[currentIndex + 1];
                      } else {
                        // No more sources to try, show error state
                        throw new Error('Failed to load video from all sources');
                      }
                    } catch (error) {
                      console.error('Error handling video error:', error);
                      throw error; // Let the error boundary handle it
                    }
                  }}
                  preload="metadata"
                  playsInline
                  muted={!isSelected}
                >
                  {validMediaSources.map((src, index) => {
                    const ext = (typeof src === 'string' && src.includes('.')) ? src.split('.').pop().toLowerCase() : '';
                    const typeMap = {
                      mp4: 'video/mp4',
                      webm: 'video/webm',
                      mov: 'video/quicktime',
                      m4v: 'video/x-m4v',
                      ogg: 'video/ogg'
                    };
                    const mime = typeMap[ext];
                    return (
                      <source key={index} src={src} {...(mime ? { type: mime } : {})} />
                    );
                  })}
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
                  tooltip="View Details"
                  icon={<TypeIcon />}
                  color={color}
                />
              </>
            ) : (
              <Box sx={{ 
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: theme.palette.error.main,
                textAlign: 'center',
                p: 2,
                height: '100%',
                width: '100%'
              }}>
                <ErrorOutlineIcon sx={{ fontSize: 48, mb: 1 }} />
                <Typography variant="caption">No video source available</Typography>
              </Box>
            )}
          </Box>
        </VideoErrorBoundary>
      );
    } catch (error) {
      console.error('Error rendering video media:', error);
      return (
        <Box sx={{ 
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: theme.palette.error.main,
          textAlign: 'center',
          p: 2,
          height: '100%',
          width: '100%'
        }}>
          <ErrorOutlineIcon sx={{ fontSize: 48, mb: 1 }} />
          <Typography variant="caption">Error loading video</Typography>
        </Box>
      );
    }
  };

  // Reference to the audio visualizer component for controlling playback
  const audioVisualizerRef = useRef(null);
  
  // Render audio media with AudioWaveformVisualizer in preview mode
  const renderAudioMedia = (mediaSource) => {
    try {
      const { mediaSources, fullUrl } = prepareMediaSources(mediaSource);
      
      // If no valid media sources, show error state
      if (!mediaSources || !mediaSources.length) {
        return (
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
              bgcolor: theme.palette.mode === 'dark' ? 'rgba(18, 18, 18, 0.9)' : 'rgba(245, 245, 245, 0.9)',
              color: theme.palette.text.secondary,
              p: 2,
              textAlign: 'center'
            }}
          >
            <ErrorOutlineIcon sx={{ mr: 1 }} />
            <Typography variant="caption">Audio not available</Typography>
          </Box>
        );
      }
      
      // Handle details click for audio media - pause audio when opening popup
      const handleAudioDetailsClick = (e) => {
        e.stopPropagation();
        handleDetailsClick();
      };
      
      // Create a click handler for the entire card to toggle audio playback
      const handleCardClick = (e) => {
        e.stopPropagation(); // Prevent event bubbling
        
        // The visualizer will handle the audio playback internally
        // We just need to make sure the card is selected
        if (!isSelected && onEdit && typeof onEdit === 'function') {
          onEdit({ type: 'select', event });
        }
      };
      
      return (
        <Box 
          sx={{ 
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            overflow: 'hidden',
            bgcolor: theme.palette.mode === 'dark' ? 'rgba(18, 18, 18, 0.9)' : 'rgba(245, 245, 245, 0.9)',
            cursor: 'pointer'
          }}
          onClick={handleCardClick}
        >
          {/* The AudioWaveformVisualizer handles audio playback internally */}
          <AudioWaveformVisualizer 
            ref={audioVisualizerRef}
            audioUrl={mediaSources[0]} 
            title={event.title || "Audio"}
            previewMode={false} // Set to false to enable full functionality
            showTitle={false} // Hide the title in the card view to avoid duplication
          />
          
          <PageCornerButton 
            position="top-right" 
            onClick={handleAudioDetailsClick}
            icon={<TypeIcon />}
            color={color}
          />
        </Box>
      );
    } catch (error) {
      console.error('Error rendering audio media:', error);
      // Fallback UI for audio rendering errors
      return (
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
            bgcolor: theme.palette.mode === 'dark' ? 'rgba(18, 18, 18, 0.9)' : 'rgba(245, 245, 245, 0.9)',
            color: theme.palette.text.secondary,
            p: 2,
            textAlign: 'center'
          }}
        >
          <ErrorOutlineIcon sx={{ mr: 1 }} />
          <Typography variant="caption">Could not load audio</Typography>
        </Box>
      );
    }
  };

  // Render default media
  const renderDefaultMedia = (mediaSource) => {
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
          icon={<TypeIcon />}
          color={color}
        />
      </Box>
    );
  };

  // Main render media function
  const renderMedia = () => {
    try {
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
      
      // Check for media subtype first (new approach)
      if (event && event.media_subtype) {
        console.log('MediaCard - Using media_subtype:', event.media_subtype);
        // Use the subtype to determine rendering
        switch(event.media_subtype) {
          case 'image':
            return renderImageMedia(mediaSource);
          case 'video':
            return renderVideoMedia(mediaSource);
          case 'audio':
            return renderAudioMedia(mediaSource);
          default:
            // Fall back to detection logic if subtype is unknown
            console.log('MediaCard - Unknown media_subtype:', event.media_subtype);
            break;
        }
      }
      
      // If no subtype or unknown subtype, fall back to detection logic
      const { fullUrl } = prepareMediaSources(mediaSource);
      
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
        return renderImageMedia(mediaSource);
      } else if (isVideo) {
        return renderVideoMedia(mediaSource);
      } else if (isAudio) {
        return renderAudioMedia(mediaSource);
      } else {
        return renderDefaultMedia(mediaSource);
      }
    } catch (error) {
      console.error('Error in renderMedia:', error);
      return (
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          height: '100%', 
          width: '100%',
          bgcolor: 'background.paper',
          color: 'error.main',
          p: 2,
          textAlign: 'center'
        }}>
          <Typography variant="body2">
            Error loading media
          </Typography>
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
          id={`media-card-${event.id}`}
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
          {/* Vote overlay for EventList cards */}
          {showVoteOverlay && (
            <VoteOverlay
              value={voteValue}
              positiveRatio={positiveRatio}
              totalVotes={totalVotes}
              isLoading={voteLoading}
              hasError={!!voteError}
            />
          )}
          
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
            <Box sx={{ mb: 1, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, flex: 1, minWidth: 0 }}>
                <TypeIcon sx={{ color, mt: 0.5 }} />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6" component="h3" sx={{ fontWeight: 'bold', mb: 1 }}>
                    {event.title}
                  </Typography>
                  
                  {/* Event date chip */}
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
              {showInlineVoteControls && (
                <Box sx={{ mt: 0.25, flexShrink: 0 }}>
                  <VoteControls
                    value={voteValue}
                    onChange={handleVoteChange}
                    positiveRatio={positiveRatio}
                    totalVotes={totalVotes}
                    isLoading={voteLoading}
                    hasError={!!voteError}
                  />
                </Box>
              )}
              
              {/* QUARANTINED: Vertical ellipsis menu removed
                  The edit and delete functionality was incomplete and caused issues
                  Pending impact review for possible deletion
              */}
            </Box>
            
            {/* Event description */}
            {event.description && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                {limitDescription(event.description)}
              </Typography>
            )}
            
            {/* Tags row (EventCard V2) */}
            <Box sx={{ mb: 1.5 }}>
              <EventCardChipsRow 
                tags={event.tags} 
                associatedTimelines={event.associated_timelines || []}
                removedTimelineIds={event.removed_timeline_ids || []}
              />
            </Box>
            
            {/* Event metadata */}
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              mt: 'auto',
              pt: 1,
              borderTop: `1px solid ${theme.palette.divider}`
            }}>
              {/* Author with avatar */}
              {event.created_by_username && (
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <UserAvatar
                    name={event.created_by_username}
                    avatarUrl={event.created_by_avatar}
                    id={event.created_by}
                    size={24}
                    sx={{ mr: 0.5, fontSize: '0.75rem' }}
                  />
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
              
              {/* Created date */}
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <AccessTimeIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary', fontSize: '0.75rem' }} />
                <Typography variant="caption" color="text.secondary">
                  {formatDate(event.created_at)}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      </motion.div>
      
      {/* QUARANTINED: Event menu removed
          The edit and delete functionality was incomplete and caused issues
          Pending impact review for possible deletion
      */}
      
      {/* Event popup */}
      <EventPopup
        open={popupOpen}
        onClose={() => {
          console.log('MediaCard: Closing popup');
          setPopupOpen(false);
          // Also notify TimelineV3 about popup state change
          if (setIsPopupOpen && typeof setIsPopupOpen === 'function') {
            setIsPopupOpen(false);
          }
        }}
        event={event}
        onDelete={onDelete}
        onEdit={onEdit}
        setIsPopupOpen={setIsPopupOpen}
        reviewingEventIds={reviewingEventIds}
      />
    </>
  );
});

export default MediaCard;
