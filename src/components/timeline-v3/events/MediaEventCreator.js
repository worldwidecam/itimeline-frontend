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
  Divider,
  Paper,
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DateTimePicker } from '@mui/x-date-pickers';
import {
  Close as CloseIcon,
  PermMedia as MediaIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import api from '../../../utils/api';
import EventMediaUploader from './EventMediaUploader';
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
      PaperComponent={motion.div}
      PaperProps={{
        initial: { opacity: 0, y: 20, scale: 0.98 },
        animate: { opacity: 1, y: 0, scale: 1 },
        transition: { duration: 0.3 },
        sx: {
          borderRadius: 3,
          overflow: 'hidden',
          backgroundColor: theme.palette.mode === 'dark' 
            ? 'rgba(10,10,20,0.85)' 
            : 'rgba(255,255,255,0.85)',
          backdropFilter: 'blur(20px)',
          boxShadow: theme.palette.mode === 'dark'
            ? '0 10px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)'
            : '0 10px 40px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.05)',
          border: theme.palette.mode === 'dark'
            ? '1px solid rgba(255,255,255,0.05)'
            : '1px solid rgba(0,0,0,0.05)',
        }
      }}
    >
      {/* Header with colored accent bar */}
      <Box
        sx={{
          position: 'relative',
          height: 8,
          bgcolor: theme.palette.mode === 'dark' ? '#A78BFA' : '#8B5CF6', // Purple color for Media events
          mb: -1,
        }}
      />
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        p: 3,
        pb: 2,
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: theme.palette.mode === 'dark'
                ? 'rgba(255,255,255,0.05)'
                : 'rgba(0,0,0,0.03)',
              color: theme.palette.mode === 'dark' ? '#A78BFA' : '#8B5CF6', // Purple color for Media events
            }}
          >
            <MediaIcon fontSize="medium" />
          </Box>
          <Typography 
            variant="h5" 
            component="div"
            sx={{ 
              fontWeight: 600,
              color: theme.palette.mode === 'dark'
                ? 'rgba(255,255,255,0.95)'
                : 'rgba(0,0,0,0.85)',
            }}
          >
            Create Media Event
          </Typography>
        </Box>
        <IconButton 
          onClick={onClose} 
          size="medium"
          aria-label="close"
          sx={{
            color: theme.palette.mode === 'dark' ? 'white' : 'rgba(0,0,0,0.6)',
            bgcolor: theme.palette.mode === 'dark'
              ? 'rgba(255,255,255,0.05)'
              : 'rgba(0,0,0,0.03)',
            '&:hover': {
              bgcolor: theme.palette.mode === 'dark'
                ? 'rgba(255,255,255,0.1)'
                : 'rgba(0,0,0,0.05)',
            },
            transition: 'all 0.2s ease',
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <Divider sx={{ opacity: 0.5 }} />

      <DialogContent sx={{ px: 3, pt: 3.5, pb: 2.5 }}>
        <Stack spacing={2.5} sx={{ mt: 2 }}>
          <TextField
            autoFocus
            label="Title"
            fullWidth
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            variant="outlined"
            InputLabelProps={{
              sx: { 
                fontSize: '0.9rem',
                transform: 'translate(14px, 12px)',
                '&.MuiInputLabel-shrink': {
                  transform: 'translate(14px, -6px) scale(0.75)'
                },
                '&.Mui-focused': {
                  color: 'primary.main'
                }
              }
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 1.5,
                '& fieldset': {
                  borderColor: 'divider'
                },
                '&:hover fieldset': {
                  borderColor: 'primary.light'
                },
                '&.Mui-focused fieldset': {
                  borderColor: 'primary.main',
                  borderWidth: 2
                }
              },
              '& .MuiInputBase-input': {
                padding: '14px 16px',
                fontSize: '0.95rem'
              }
            }}
          />
          
          <TextField
            label="Description"
            fullWidth
            multiline
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            variant="outlined"
            InputLabelProps={{
              sx: { 
                fontSize: '0.9rem',
                transform: 'translate(14px, 12px)',
                '&.MuiInputLabel-shrink': {
                  transform: 'translate(14px, -6px) scale(0.75)'
                },
                '&.Mui-focused': {
                  color: 'primary.main'
                }
              }
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 1.5,
                '& fieldset': {
                  borderColor: 'divider'
                },
                '&:hover fieldset': {
                  borderColor: 'primary.light'
                },
                '&.Mui-focused fieldset': {
                  borderColor: 'primary.main',
                  borderWidth: 2
                }
              },
              '& .MuiInputBase-input': {
                padding: '14px 16px',
                fontSize: '0.95rem'
              }
            }}
          />
          
          <Box sx={{ mb: 0.5 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: 'text.primary' }}>
              Event Date & Time
            </Typography>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DateTimePicker
                label="Event Date & Time"
                value={eventDate}
                onChange={setEventDate}
                renderInput={(params) => 
                  <TextField 
                    {...params} 
                    fullWidth 
                    InputLabelProps={{
                      sx: { 
                        fontSize: '0.95rem',
                        transform: 'translate(14px, -9px) scale(0.75)',
                        '&.MuiInputLabel-shrink': {
                          transform: 'translate(14px, -9px) scale(0.75)'
                        },
                        '&.Mui-focused': {
                          color: 'primary.main'
                        }
                      }
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 1.5,
                        '& fieldset': {
                          borderColor: 'divider'
                        },
                        '&:hover fieldset': {
                          borderColor: 'primary.light'
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: 'primary.main',
                          borderWidth: 2
                        }
                      },
                      '& .MuiInputBase-input': {
                        padding: '14px 16px',
                        fontSize: '0.95rem'
                      }
                    }}
                  />
                }
              />
            </LocalizationProvider>
          </Box>
          
          <Box sx={{ mt: 0.5 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: 'text.primary' }}>
              Tags
            </Typography>
            <TextField
              label="Add tags (press Enter after each tag)"
              fullWidth
              value={currentTag}
              onChange={handleTagInputChange}
              onKeyDown={handleTagInputKeyDown}
              variant="outlined"
              size="small"
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 1.5,
                  '& fieldset': {
                    borderColor: 'divider'
                  },
                  '&:hover fieldset': {
                    borderColor: 'primary.light'
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: 'primary.main',
                    borderWidth: 2
                  }
                },
                '& .MuiInputBase-input': {
                  padding: '10px 14px',
                  fontSize: '0.95rem'
                }
              }}
              InputLabelProps={{
                sx: { 
                  fontSize: '0.95rem',
                  transform: 'translate(14px, -9px) scale(0.75)',
                  '&.MuiInputLabel-shrink': {
                    transform: 'translate(14px, -9px) scale(0.75)'
                  },
                  '&.Mui-focused': {
                    color: 'primary.main'
                  }
                }
              }}
            />
          
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, minHeight: '32px' }}>
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
          </Box>
          
          <Box sx={{ mt: 1 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: 'text.primary' }}>
              Media Upload
            </Typography>
            
            {/* Use the existing MediaUploader component */}
            <Box sx={{ 
              border: '1px solid', 
              borderColor: 'divider', 
              borderRadius: 1.5, 
              p: 2,
              bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.01)',
              boxShadow: 1
            }}>
              <EventMediaUploader onUploadComplete={handleUploadComplete} />
            </Box>
          </Box>
          
          <Box sx={{ p: 2, mt: 1, bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.01)', borderRadius: 1.5 }}>
            <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600, color: 'text.primary' }}>
              Upload Instructions
            </Typography>
            <Box sx={{ mb: 1 }}>
              <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', mb: 0.75 }}>
                <Box component="span" sx={{ mr: 1, fontWeight: 600 }}>1.</Box> Select a file to upload
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', mb: 0.75 }}>
                <Box component="span" sx={{ mr: 1, fontWeight: 600 }}>2.</Box> Wait for the upload to complete
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                <Box component="span" sx={{ mr: 1, fontWeight: 600 }}>3.</Box> Fill in the event details above
              </Typography>
            </Box>
          </Box>
          
          {error && (
            <Typography variant="body2" color="error" sx={{ mt: 2 }}>
              {error}
            </Typography>
          )}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ 
        px: 3, 
        py: 2.5,
        bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
        borderTop: `1px solid ${theme.palette.divider}`
      }}>
        <Button 
          onClick={onClose} 
          color="inherit"
          sx={{ 
            fontWeight: 600, 
            textTransform: 'none', 
            px: 3, 
            py: 1.25, 
            borderRadius: 1.5 
          }}
        >
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          sx={{ 
            fontWeight: 600, 
            textTransform: 'none', 
            px: 3, 
            py: 1.25, 
            borderRadius: 1.5,
            boxShadow: 2,
            bgcolor: theme.palette.mode === 'dark' ? '#A78BFA' : '#8B5CF6', // Purple color for Media events
            '&:hover': {
              bgcolor: theme.palette.mode === 'dark' ? '#C4B5FD' : '#7C3AED',
            }
          }}
        >
          Create Media Event
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MediaEventCreator;
