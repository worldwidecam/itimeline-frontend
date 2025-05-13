import React from 'react';
import { Box } from '@mui/material';
import ImageMediaPopup from './ImageMediaPopup';

/**
 * MediaPopupManager - Determines which media popup component to render based on media type
 * This component centralizes the media type detection logic and renders the appropriate
 * specialized component for each media subtype.
 */
const MediaPopupManager = ({ event, mediaSource, children }) => {
  // Determine media type
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
      // For now, we'll use the default layout for video
      // In the future, we can create a VideoMediaPopup component
      return children;
      
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
