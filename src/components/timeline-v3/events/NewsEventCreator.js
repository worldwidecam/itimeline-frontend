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
  CircularProgress,
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DateTimePicker } from '@mui/x-date-pickers';
import {
  Close as CloseIcon,
  Link as LinkIcon,
} from '@mui/icons-material';
import api from '../../../utils/api';
import { EVENT_TYPES } from './EventTypes';

/**
 * A dialog component for creating news events with URL preview
 */
const NewsEventCreator = ({ open, onClose, onSave }) => {
  const theme = useTheme();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventDate, setEventDate] = useState(new Date());
  const [url, setUrl] = useState('');
  const [urlPreview, setUrlPreview] = useState(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
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
    setUrl('');
    setUrlPreview(null);
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

  // Fetch URL preview when URL changes
  const fetchUrlPreview = async () => {
    if (!url.trim()) return;
    
    try {
      setIsLoadingPreview(true);
      const response = await api.post('/api/url-preview', { url });
      setUrlPreview(response.data);
      
      // Auto-populate title and description if they're empty
      if (!title.trim() && response.data.title) {
        setTitle(response.data.title);
      }
      if (!description.trim() && response.data.description) {
        setDescription(response.data.description);
      }
    } catch (error) {
      console.error('Error fetching URL preview:', error);
      setError('Failed to fetch URL preview');
    } finally {
      setIsLoadingPreview(false);
    }
  };

  // Debounce URL preview fetching
  useEffect(() => {
    const timer = setTimeout(() => {
      if (url.trim()) {
        fetchUrlPreview();
      }
    }, 800);
    
    return () => clearTimeout(timer);
  }, [url]);

  // Handle form submission
  const handleSubmit = async () => {
    try {
      // Validate form
      if (!title.trim()) {
        setError('Title is required');
        return;
      }

      if (!url.trim()) {
        setError('URL is required for news events');
        return;
      }

      // Create event data
      const eventData = {
        title,
        description,
        event_date: eventDate,
        type: EVENT_TYPES.NEWS,
        url,
        tags
      };

      // Add URL preview data if available
      if (urlPreview) {
        eventData.url_title = urlPreview.title || '';
        eventData.url_description = urlPreview.description || '';
        eventData.url_image = urlPreview.image || '';
        eventData.url_source = urlPreview.source || '';
      }

      // Call the onSave callback with the event data
      await onSave(eventData);
      
      // Close the dialog and reset the form
      onClose();
      resetForm();
    } catch (error) {
      console.error('Error creating news event:', error);
      setError(error.message || 'Failed to create news event');
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
        borderBottom: `1px solid ${theme.palette.divider}`
      }}>
        <Typography variant="h6" component="div">
          Create News Event
        </Typography>
        <IconButton edge="end" color="inherit" onClick={onClose} aria-label="close">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent sx={{ pt: 3 }}>
        <Stack spacing={3}>
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
          />
          
          <TextField
            label="Description"
            fullWidth
            multiline
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            variant="outlined"
          />
          
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DateTimePicker
              label="Event Date & Time"
              value={eventDate}
              onChange={(newValue) => setEventDate(newValue)}
              renderInput={(params) => <TextField {...params} fullWidth />}
            />
          </LocalizationProvider>
          
          <Box>
            <TextField
              label="URL"
              fullWidth
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
              variant="outlined"
              InputProps={{
                startAdornment: <LinkIcon color="action" sx={{ mr: 1 }} />,
                endAdornment: isLoadingPreview && <CircularProgress size={20} sx={{ mr: 1 }} />
              }}
            />
            
            {urlPreview && (
              <Box 
                sx={{ 
                  mt: 2, 
                  p: 2, 
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: 1,
                  bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
                }}
              >
                <Typography variant="subtitle2" gutterBottom>
                  URL Preview
                </Typography>
                {urlPreview.image && (
                  <Box 
                    component="img" 
                    src={urlPreview.image} 
                    alt={urlPreview.title || 'URL preview'} 
                    sx={{ 
                      width: '100%', 
                      height: 160, 
                      objectFit: 'cover',
                      borderRadius: 1,
                      mb: 1
                    }}
                  />
                )}
                <Typography variant="subtitle1" gutterBottom>
                  {urlPreview.title || 'No title available'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {urlPreview.description || 'No description available'}
                </Typography>
                {urlPreview.source && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                    Source: {urlPreview.source}
                  </Typography>
                )}
              </Box>
            )}
          </Box>
          
          <Box>
            <Typography variant="subtitle2" gutterBottom>
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
              sx={{ mb: 2 }}
            />
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
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
        py: 2,
        bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
        borderTop: `1px solid ${theme.palette.divider}`
      }}>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          color="primary"
          disabled={!title.trim() || !url.trim()}
        >
          Create News Event
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default NewsEventCreator;
