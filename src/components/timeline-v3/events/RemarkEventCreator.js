import React, { useState, useEffect } from 'react';
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
  Comment as RemarkIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { EVENT_TYPES } from './EventTypes';

/**
 * A dialog component for creating remark events
 * @param {Object} props - Component props
 * @param {boolean} props.open - Whether the dialog is open
 * @param {Function} props.onClose - Function to close the dialog
 * @param {Function} props.onSave - Function to save the event
 * @param {string} props.timelineName - Name of the current timeline to add as a default hashtag
 */
const RemarkEventCreator = ({ open, onClose, onSave, timelineName }) => {
  const theme = useTheme();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventDate, setEventDate] = useState(new Date());
  const [tags, setTags] = useState([]);
  const [currentTag, setCurrentTag] = useState('');
  const [error, setError] = useState(null);
  const [isPersonalTimeline, setIsPersonalTimeline] = useState(false);

  // Reset form when dialog closes or update personal timeline flag when opened
  useEffect(() => {
    if (!open) {
      resetForm();
    } else if (open && timelineName) {
      // Treat timelines whose formatted name starts with "My-" as personal
      const isPersonal = typeof timelineName === 'string' && timelineName.startsWith('My-');
      setIsPersonalTimeline(isPersonal);
    }
  }, [open, timelineName]); // Removed tags from dependencies to prevent infinite loop

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

  // Handle form submission
  const handleSubmit = async () => {
    try {
      // Validate form
      if (!title.trim()) {
        setError('Title is required');
        return;
      }

      // Create event data
      const eventData = {
        title,
        description,
        event_date: eventDate,
        type: EVENT_TYPES.REMARK,
        tags
      };

      // Call the onSave callback with the event data
      await onSave(eventData);
      
      // Close the dialog and reset the form
      onClose();
      resetForm();
    } catch (error) {
      console.error('Error creating remark event:', error);
      setError(error.message || 'Failed to create remark event');
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      fullWidth
      maxWidth="sm"
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
          bgcolor: theme.palette.mode === 'dark' ? '#60A5FA' : '#3B82F6', // Blue color for Remark events
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
              color: theme.palette.mode === 'dark' ? '#60A5FA' : '#3B82F6', // Blue color for Remark events
            }}
          >
            <RemarkIcon fontSize="medium" />
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
            Create Remark Event
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
          {error && (
            <Typography color="error" variant="body2">
              {error}
            </Typography>
          )}
          
          <TextField
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
                onChange={(newValue) => setEventDate(newValue)}
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
              sx={{ mb: 2,
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
            bgcolor: theme.palette.mode === 'dark' ? '#60A5FA' : '#3B82F6', // Blue color for Remark events
            '&:hover': {
              bgcolor: theme.palette.mode === 'dark' ? '#93C5FD' : '#2563EB',
            }
          }}
          disabled={!title.trim()}
        >
          Create Remark
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RemarkEventCreator;
