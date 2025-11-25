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
 * @param {Object} props - Component props
 * @param {boolean} props.open - Whether the dialog is open
 * @param {Function} props.onClose - Function to close the dialog
 * @param {Function} props.onSave - Function to save the event
 * @param {string} props.timelineName - Name of the current timeline to add as a default hashtag
 * @param {string} props.timelineId - ID of the current timeline
 * @param {Object} props.zeroPoint - Zero point of the timeline
 * @param {Object} props.position - Position on the timeline
 */
const MediaEventCreator = ({ open, onClose, onSave, timelineName, timelineId, zeroPoint, position }) => {
  const theme = useTheme();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventDate, setEventDate] = useState(new Date());
  const [tags, setTags] = useState([]);
  const [currentTag, setCurrentTag] = useState('');
  const [error, setError] = useState(null);
  const [uploadResult, setUploadResult] = useState(null);
  const [isPersonalTimeline, setIsPersonalTimeline] = useState(false);

  // Reference to the MediaUploader component
  const mediaUploaderRef = useRef(null);

  // Reset form when dialog closes or update personal timeline flag when opened
  useEffect(() => {
    if (!open) {
      resetForm();
    } else if (open && timelineName) {
      // Treat timelines whose formatted name starts with "My-" as personal
      const isPersonal = typeof timelineName === 'string' && timelineName.startsWith('My-');
      setIsPersonalTimeline(isPersonal);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, timelineName]); // Removed tags from dependencies and used functional update

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
    // Disable hashtag entry entirely on personal (My-) timelines
    if (isPersonalTimeline) {
      if (e.key === 'Enter') {
        e.preventDefault();
      }
      return;
    }

    if (e.key === 'Enter' && currentTag.trim()) {
      e.preventDefault();
      let raw = currentTag.trim();

      // Prevent i- / My- style inputs from being treated as hashtags
      const lower = raw.toLowerCase();
      if (lower.startsWith('i-') || lower.startsWith('my-')) {
        setCurrentTag('');
        return;
      }

      // Normalize to hashtag form: ensure leading # and collapse spaces to dashes
      if (!raw.startsWith('#')) {
        raw = `#${raw.replace(/^#+/, '')}`;
      }
      const normalized = raw.replace(/\s+/g, '-');

      if (!tags.includes(normalized)) {
        setTags([...tags, normalized]);
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
    // Require an upload result
    if (!uploadResult || !uploadResult.url) {
      setError('Please upload a media file before creating the event');
      return;
    }

    // Prefer values from uploadResult
    const fileUrl = uploadResult.secure_url || uploadResult.url;
    const cloudinaryId = uploadResult.cloudinary_id || uploadResult.public_id || '';
    // Normalize type/subtype
    let fileType = 'image';
    if (uploadResult.category) {
      fileType = uploadResult.category; // 'image' | 'video' | 'audio'
    } else if (uploadResult.type) {
      // If a MIME like 'video/mp4' is returned, map to 'video'
      fileType = uploadResult.type.startsWith('video') ? 'video' : uploadResult.type.startsWith('audio') ? 'audio' : 'image';
    }

    try {
      // Create the raw date string in the format: MM.DD.YYYY.HH.MM.AMPM
      const originalDate = new Date(eventDate);
      const year = originalDate.getFullYear();
      const month = originalDate.getMonth() + 1;
      const day = originalDate.getDate();
      const hours = originalDate.getHours();
      const minutes = String(originalDate.getMinutes()).padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours % 12;
      const displayHoursFormatted = displayHours ? displayHours : 12;
      const rawDateString = `${month}.${day}.${year}.${displayHoursFormatted}.${minutes}.${ampm}`;

      // Build event payload using authoritative uploadResult data
      const eventData = {
        title: title.trim(),
        description: description.trim(),
        event_date: eventDate.toISOString(),
        raw_event_date: rawDateString,
        is_exact_user_time: true,
        type: EVENT_TYPES.MEDIA,
        url: fileUrl,
        media_url: fileUrl,
        media: {
          type: fileType,
          url: fileUrl,
          media_subtype: fileType
        },
        media_subtype: fileType,
        tags: tags
      };

      // Include Cloudinary public_id when available so UI can use the Cloudinary Player
      if (cloudinaryId) {
        eventData.cloudinary_id = cloudinaryId;
      }

      console.log('Final event data being submitted:', eventData);
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
              label="Add hashtag (press Enter after each tag)"
              fullWidth
              value={currentTag}
              onChange={handleTagInputChange}
              onKeyDown={handleTagInputKeyDown}
              variant="outlined"
              size="small"
              disabled={isPersonalTimeline}
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
          disabled={!title.trim() || !uploadResult}
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
