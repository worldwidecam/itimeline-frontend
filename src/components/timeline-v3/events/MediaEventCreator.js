import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
  Box,
  Typography,
  IconButton,
  useTheme,
  Chip,
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DateTimePicker } from '@mui/x-date-pickers';
import {
  Close as CloseIcon,
} from '@mui/icons-material';
import api from '../../../utils/api';
import MediaUploader from '../../MediaUploader';
import { EVENT_TYPES } from './EventTypes';

/**
 * A dialog component that uses the existing MediaUploader component
 * to create media events
 */
const MediaEventCreator = ({ open, onClose, onSave, timelineId, zeroPoint, position }) => {
  const theme = useTheme();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventDate, setEventDate] = useState(new Date());
  const [tags, setTags] = useState([]);
  const [currentTag, setCurrentTag] = useState('');
  const [error, setError] = useState(null);
  const [uploadResult, setUploadResult] = useState(null);

  // Reference to the MediaUploader component
  const mediaUploaderRef = useRef(null);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      resetForm();
    }
  }, [open]);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setEventDate(new Date());
    setTags([]);
    setCurrentTag('');
    setError(null);
  };

  // Handle tag input
  const handleTagInputChange = (e) => {
    setCurrentTag(e.target.value);
  };

  const handleTagInputKeyDown = (e) => {
    if (e.key === 'Enter' && currentTag.trim()) {
      e.preventDefault();
      if (!tags.includes(currentTag.trim())) {
        setTags([...tags, currentTag.trim()]);
      }
      setCurrentTag('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  // Function to capture upload result from MediaUploader
  const handleUploadComplete = (result) => {
    console.log('MediaEventCreator: Upload complete with result:', result);
    setUploadResult(result);
  };

  // Handle form submission
  const handleSubmit = async () => {
    // Look for upload result in the DOM
    let fileUrl = '';
    let fileType = 'image';
    let cloudinaryId = '';
    
    // First, try to get the URL from the upload result displayed in the UI
    const uploadResultElement = document.querySelector('body');
    const uploadResultText = uploadResultElement?.innerText || '';
    
    // Look for the URL in the text content of the page
    const urlMatch = uploadResultText.match(/URL:\s*(https?:\/\/[^\s]+)/i);
    if (urlMatch && urlMatch[1]) {
      console.log('Found URL in upload result text:', urlMatch[1]);
      fileUrl = urlMatch[1];
      
      // Try to determine the file type from the URL
      if (fileUrl.match(/\.(mp4|webm|mov)($|\?)/i)) {
        fileType = 'video';
      } else if (fileUrl.match(/\.(mp3|wav|ogg)($|\?)/i)) {
        fileType = 'audio';
      }
      
      // Try to extract cloudinary ID from the URL
      if (fileUrl.includes('cloudinary.com')) {
        const parts = fileUrl.split('/');
        const uploadIndex = parts.findIndex(part => part === 'upload');
        if (uploadIndex !== -1 && uploadIndex < parts.length - 1) {
          cloudinaryId = parts.slice(uploadIndex + 1).join('/');
          // Remove file extension and query parameters
          cloudinaryId = cloudinaryId.replace(/\.[^\.]+($|\?).*/, '');
        }
      }
    }
    
    // If we couldn't find the URL in the text, try to find it in the media elements
    if (!fileUrl) {
      const uploadedImages = document.querySelectorAll('.uploaded-media-container img');
      const uploadedVideos = document.querySelectorAll('.uploaded-media-container video');
      const uploadedAudios = document.querySelectorAll('.uploaded-media-container audio');
      
      if (uploadedImages.length > 0) {
        fileUrl = uploadedImages[0].src;
        fileType = 'image';
      } else if (uploadedVideos.length > 0) {
        fileUrl = uploadedVideos[0].src;
        fileType = 'video';
      } else if (uploadedAudios.length > 0) {
        fileUrl = uploadedAudios[0].src;
        fileType = 'audio';
      }
    }
    
    // If we still don't have a URL, check for success messages
    if (!fileUrl) {
      const uploadSuccessMessage = document.querySelector('.upload-success-message');
      const uploadResult = document.querySelector('.upload-result');
      
      if (uploadSuccessMessage || uploadResult) {
        // Look for the upload result data in the page
        const resultText = document.querySelector('.upload-result-text');
        if (resultText && resultText.textContent) {
          try {
            // Try to parse the JSON from the result text
            const resultData = JSON.parse(resultText.textContent);
            if (resultData.url) {
              fileUrl = resultData.url;
              cloudinaryId = resultData.cloudinary_id || resultData.public_id || '';
              fileType = resultData.type || 'image';
            }
          } catch (e) {
            console.error('Error parsing upload result:', e);
          }
        }
      }
    }
    
    // If we still don't have a URL, use a placeholder
    if (!fileUrl) {
      console.warn('No media URL found, using placeholder');
      fileUrl = 'https://res.cloudinary.com/dnjwvuxn7/image/upload/v1744827085/timeline_media/placeholder.jpg';
    }

    try {
      console.log('Preparing event data for submission...');
      
      // Create a new date object from the event_date
      const originalDate = new Date(eventDate);
      
      // Extract date components for raw date string
      const year = originalDate.getFullYear();
      const month = originalDate.getMonth() + 1; // Month is 0-indexed in JS
      const day = originalDate.getDate();
      const hours = originalDate.getHours();
      const minutes = String(originalDate.getMinutes()).padStart(2, '0');
      
      // Determine AM/PM
      const ampm = hours >= 12 ? 'PM' : 'AM';
      
      // Convert to 12-hour format for display
      const displayHours = hours % 12;
      const displayHoursFormatted = displayHours ? displayHours : 12; // Convert 0 to 12
      
      // Create the raw date string in the format: MM.DD.YYYY.HH.MM.AMPM
      const rawDateString = `${month}.${day}.${year}.${displayHoursFormatted}.${minutes}.${ampm}`;
      
      // Create the event data to match the format expected by handleEventSubmit in TimelineV3.js
      const eventData = {
        title: title.trim(),
        description: description.trim(),
        event_date: eventDate.toISOString(),
        raw_event_date: rawDateString,
        is_exact_user_time: true,
        type: EVENT_TYPES.MEDIA, // Use 'type' instead of 'event_type'
        url: fileUrl,
        media_url: fileUrl,
        // Set media object to match what handleEventSubmit expects
        media: {
          type: fileType,
          url: fileUrl
        },
        tags: tags
      };
      
      // Log the final event data for debugging
      console.log('Final event data being submitted:', eventData);
      
      console.log('Submitting event data:', eventData);
      onSave(eventData);
      
      // Reset form and close dialog
      resetForm();
      onClose();
    } catch (err) {
      console.error('Submission error:', err);
      setError(err.response?.data?.error || 'Submission failed. Please try again.');
    }
  };

  useEffect(() => {
    // Function to handle DOM mutations
    const handleMutation = (mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList') {
          // Look for upload result elements
          const uploadResult = document.querySelector('.upload-result');
          if (uploadResult) {
            const resultText = uploadResult.querySelector('.upload-result-text');
            if (resultText && resultText.textContent) {
              try {
                // Try to parse the JSON from the result text
                const resultData = JSON.parse(resultText.textContent);
                handleUploadComplete(resultData);
              } catch (e) {
                console.error('Error parsing upload result:', e);
              }
            }
          }
        }
      }
    };

    // Create a mutation observer
    const observer = new MutationObserver(handleMutation);
    
    // Start observing the MediaUploader container
    if (mediaUploaderRef.current) {
      observer.observe(document.body, { childList: true, subtree: true });
    }

    // Cleanup
    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          bgcolor: theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(10px)',
        }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Create Media Event
          </Typography>
          <IconButton size="small" onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <TextField
            autoFocus
            margin="dense"
            id="title"
            label="Title"
            fullWidth
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            sx={{ mb: 2 }}
          />
          
          <TextField
            margin="dense"
            id="description"
            label="Description"
            fullWidth
            multiline
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            sx={{ mb: 2 }}
          />
          
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DateTimePicker
              label="Event Date & Time"
              value={eventDate}
              onChange={setEventDate}
              renderInput={(params) => (
                <TextField 
                  {...params} 
                  fullWidth 
                  margin="dense"
                  sx={{ mb: 2 }}
                />
              )}
            />
          </LocalizationProvider>
          
          <TextField
            margin="dense"
            id="tags"
            label="Tags (press Enter to add)"
            fullWidth
            value={currentTag}
            onChange={handleTagInputChange}
            onKeyDown={handleTagInputKeyDown}
            sx={{ mb: 2 }}
          />
          
          {tags.length > 0 && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
              {tags.map((tag, index) => (
                <Chip
                  key={index}
                  label={tag}
                  onDelete={() => handleRemoveTag(tag)}
                  color="primary"
                  variant="outlined"
                  size="small"
                />
              ))}
            </Box>
          )}
          
          <Typography variant="subtitle1" gutterBottom sx={{ mt: 3, mb: 2 }}>
            Media Upload
          </Typography>
          
          {/* Use the existing MediaUploader component */}
          <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 2 }}>
            <MediaUploader ref={mediaUploaderRef} />
          </Box>
          
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Upload Media
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                1. Select a file and upload it to Cloudinary
              </Typography>
              <Typography variant="body2" color="text.secondary">
                2. Wait for the upload to complete
              </Typography>
              <Typography variant="body2" color="text.secondary">
                3. Fill in the event details below
              </Typography>
            </Box>
          </Box>
          
          {error && (
            <Typography variant="body2" color="error" sx={{ mt: 2 }}>
              {error}
            </Typography>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          color="primary"
        >
          Create Media Event
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MediaEventCreator;
