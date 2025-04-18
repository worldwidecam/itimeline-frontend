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
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DateTimePicker } from '@mui/x-date-pickers';
import {
  Close as CloseIcon,
} from '@mui/icons-material';
import { EVENT_TYPES } from './EventTypes';

/**
 * A dialog component for creating remark events
 */
const RemarkEventCreator = ({ open, onClose, onSave }) => {
  const theme = useTheme();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventDate, setEventDate] = useState(new Date());
  const [tags, setTags] = useState([]);
  const [currentTag, setCurrentTag] = useState('');
  const [error, setError] = useState(null);

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
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: 24,
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
        borderBottom: `1px solid ${theme.palette.divider}`,
        px: 3,
        py: 2.5
      }}>
        <Typography variant="h6" component="div">
          Create Remark Event
        </Typography>
        <IconButton edge="end" color="inherit" onClick={onClose} aria-label="close">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
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
              label="Add tags (press Enter after each tag)"
              fullWidth
              value={currentTag}
              onChange={handleTagInputChange}
              onKeyDown={handleTagInputKeyDown}
              variant="outlined"
              size="small"
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
          color="primary"
          sx={{ 
            fontWeight: 600, 
            textTransform: 'none', 
            px: 3, 
            py: 1.25, 
            borderRadius: 1.5,
            boxShadow: 2
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
