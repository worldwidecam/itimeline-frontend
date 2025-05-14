import React from 'react';
import { Box } from '@mui/material';
import ImageMediaPopup from './ImageMediaPopup';
import VideoMediaPopup from './VideoMediaPopup';

/**
 * MediaPopupManager - Determines which media popup component to render based on media type
 * This component centralizes the media type detection logic and renders the appropriate
 * specialized component for each media subtype.
 */
const MediaPopupManager = ({ event, mediaSource, children }) => {
  // Debug log to verify media source is being passed correctly
  console.log('MediaPopupManager received:', { mediaSource, event });
  // Determine media type
  // Ensure we have a valid media source
  if (!mediaSource) {
    console.error('MediaPopupManager: No media source provided');
    return children;
  }
  
  const detectMediaType = () => {
    const mimeType = event.media_type || '';
    
    // First check if we have the media_subtype field
    if (event.media_subtype) {
      return event.media_subtype; // 'image', 'video', or 'audio'
    }
    
    // Fallback to extension or MIME type check
    if (/\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(mediaSource) || 
        (mimeType && mimeType.startsWith('image/'))) {
      return 'image';
    }
    
    if (/\.(mp4|webm|ogg|mov|avi|wmv|flv|mkv)$/i.test(mediaSource) || 
        (mimeType && mimeType.startsWith('video/'))) {
      return 'video';
    }
    
    if (/\.(mp3|wav|ogg|aac|flac|m4a)$/i.test(mediaSource) || 
        (mimeType && mimeType.startsWith('audio/'))) {
      return 'audio';
    }
    
    return 'unknown';
  };
  
  const mediaType = detectMediaType();
  
  // Render the appropriate component based on media type
  switch (mediaType) {
    case 'image':
      return (
        <ImageMediaPopup 
          event={event} 
          mediaSource={mediaSource}
        >
          {children}
        </ImageMediaPopup>
      );
      
    case 'video':
      return (
        <VideoMediaPopup 
          event={event} 
          mediaSource={mediaSource}
        >
          {children}
        </VideoMediaPopup>
      );
      
    case 'audio':
      // For now, we'll use the default layout for audio
      // In the future, we can create an AudioMediaPopup component
      return children;
      
    default:
      // Use default layout for unknown media types
      return children;
  }
};

export default MediaPopupManager;
