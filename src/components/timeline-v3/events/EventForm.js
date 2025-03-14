import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  IconButton,
  Typography,
  CircularProgress,
  Alert,
  Stack,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import { 
  Close as CloseIcon, 
  Image as ImageIcon, 
  Link as LinkIcon,
  Comment as RemarkIcon,
  Newspaper as NewsIcon,
  Movie as MediaIcon,
} from '@mui/icons-material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import api from '../../../utils/api';
import { EVENT_TYPES, EVENT_TYPE_METADATA } from './EventTypes';

const EventForm = ({ open, onClose, timelineId, onEventCreated }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    event_date: new Date().toISOString(),
    type: EVENT_TYPES.REMARK, // Default to remark
    url: '',
    url_title: '',
    url_description: '',
    url_image: '',
    media_url: '',
    media_type: '',
    tags: []
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [urlLoading, setUrlLoading] = useState(false);
  const [urlData, setUrlData] = useState(null);

  useEffect(() => {
    if (open) {
      // Reset form when opened
      setFormData({
        title: '',
        description: '',
        event_date: new Date().toISOString(),
        type: EVENT_TYPES.REMARK,
        url: '',
        url_title: '',
        url_description: '',
        url_image: '',
        media_url: '',
        media_type: '',
        tags: []
      });
      setError('');
      setActiveTab(0);
      setUrlData(null);
    }
  }, [open]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const handleTypeChange = (e, newType) => {
    if (newType !== null) {
      setFormData(prev => ({
        ...prev,
        type: newType
      }));
    }
  };

  const handleDateChange = (newDate) => {
    if (newDate && !isNaN(newDate)) {
        // Store the date in ISO format
        const isoString = newDate.toISOString();
        
        // Get timezone offset in minutes
        // Note: getTimezoneOffset returns minutes WEST of UTC
        // For PST (UTC-8), it returns +480 minutes
        const tzOffset = newDate.getTimezoneOffset();
        const tzName = Intl.DateTimeFormat().resolvedOptions().timeZone;
        
        console.log('Selected date:', newDate);
        console.log('ISO string:', isoString);
        console.log('Timezone offset (minutes):', tzOffset);
        console.log('Local timezone:', tzName);
        
        // For debugging, show what the date would look like in UTC
        const utcDate = new Date(newDate.valueOf() + tzOffset * 60000);
        console.log('Date in UTC:', utcDate);
        
        setFormData(prev => ({
            ...prev,
            event_date: isoString,
            // Include timezone info for the backend
            timezone_offset: tzOffset,
            timezone_name: tzName
        }));
        setError('');
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleUrlBlur = async () => {
    if (!formData.url) return;
    
    try {
      setUrlLoading(true);
      const response = await api.get(`/api/fetch-url-metadata?url=${encodeURIComponent(formData.url)}`);
      setUrlData(response.data);
      
      // Auto-fill URL metadata
      setFormData(prev => ({
        ...prev,
        url_title: response.data.title || '',
        url_description: response.data.description || '',
        url_image: response.data.image || ''
      }));
    } catch (error) {
      console.error('Error fetching URL metadata:', error);
    } finally {
      setUrlLoading(false);
    }
  };

  const handleTagChange = (event) => {
    setFormData(prev => ({
      ...prev,
      tags: event.target.value
    }));
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      setError('Title is required');
      return false;
    }
    if (!formData.event_date) {
      setError('Date is required');
      return false;
    }
    if (formData.url && !formData.url.startsWith('http')) {
      setError('URL must start with http:// or https://');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      setLoading(true);
      setError('');

      // Use the event_date directly from formData, which is already in ISO format
      // from the DateTimePicker component
      const eventData = {
        ...formData
      };

      const response = await api.post(
        `/api/timeline-v3/${timelineId}/events`,
        eventData,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (onEventCreated) {
        onEventCreated(response.data);
      }

      onClose();
    } catch (error) {
      console.error('Error creating event:', error);
      setError(
        error.response?.data?.error || 
        'Failed to create event. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case EVENT_TYPES.REMARK:
        return <RemarkIcon />;
      case EVENT_TYPES.NEWS:
        return <NewsIcon />;
      case EVENT_TYPES.MEDIA:
        return <MediaIcon />;
      default:
        return null;
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        <Box display="flex" alignItems="center">
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Create New Event
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 2 }}>
          <Tab label="Basic Info" />
          <Tab label="Links & Media" />
          <Tab label="Tags" />
        </Tabs>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {activeTab === 0 && (
          <Stack spacing={2}>
            {/* Event Type Selection */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Event Type
              </Typography>
              <ToggleButtonGroup
                value={formData.type}
                exclusive
                onChange={handleTypeChange}
                aria-label="event type"
                fullWidth
              >
                {Object.values(EVENT_TYPES).map((type) => (
                  <ToggleButton 
                    key={type} 
                    value={type}
                    aria-label={type}
                    sx={{
                      textTransform: 'capitalize',
                      py: 1,
                    }}
                  >
                    {getTypeIcon(type)}
                    <Box component="span" sx={{ ml: 1 }}>
                      {EVENT_TYPE_METADATA[type].label}
                    </Box>
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                {EVENT_TYPE_METADATA[formData.type].description}
              </Typography>
            </Box>

            <TextField
              name="title"
              label="Event Title"
              value={formData.title}
              onChange={handleChange}
              fullWidth
              required
            />
            <TextField
              name="description"
              label="Description"
              value={formData.description}
              onChange={handleChange}
              multiline
              rows={4}
              fullWidth
            />
            <DateTimePicker
              label="Event Date & Time"
              value={new Date(formData.event_date)}
              onChange={handleDateChange}
              renderInput={(params) => <TextField {...params} fullWidth />}
            />
          </Stack>
        )}

        {activeTab === 1 && (
          <Stack spacing={2}>
            <TextField
              name="url"
              label="URL"
              value={formData.url}
              onChange={handleChange}
              onBlur={handleUrlBlur}
              fullWidth
              InputProps={{
                endAdornment: urlLoading && <CircularProgress size={20} />
              }}
              helperText="Add a reference link to this event"
            />
            
            {urlData && (
              <Alert severity="info" sx={{ mb: 2 }}>
                URL preview data loaded successfully
              </Alert>
            )}

            <TextField
              name="url_title"
              label="URL Title"
              value={formData.url_title}
              onChange={handleChange}
              fullWidth
              disabled={!formData.url}
            />

            <TextField
              name="url_description"
              label="URL Description"
              value={formData.url_description}
              onChange={handleChange}
              multiline
              rows={2}
              fullWidth
              disabled={!formData.url}
            />

            <TextField
              name="url_image"
              label="Image URL"
              value={formData.url_image}
              onChange={handleChange}
              fullWidth
              disabled={!formData.url}
              InputProps={{
                endAdornment: formData.url_image && (
                  <IconButton size="small">
                    <ImageIcon />
                  </IconButton>
                )
              }}
            />
          </Stack>
        )}

        {activeTab === 2 && (
          <FormControl fullWidth>
            <InputLabel>Tags</InputLabel>
            <Select
              multiple
              value={formData.tags}
              onChange={handleTagChange}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((value) => (
                    <Chip key={value} label={value} />
                  ))}
                </Box>
              )}
            >
              <MenuItem value="important">Important</MenuItem>
              <MenuItem value="personal">Personal</MenuItem>
              <MenuItem value="work">Work</MenuItem>
              <MenuItem value="news">News</MenuItem>
              <MenuItem value="media">Media</MenuItem>
            </Select>
          </FormControl>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          onClick={handleSubmit}
          variant="contained" 
          disabled={loading}
          startIcon={loading && <CircularProgress size={20} />}
        >
          Create Event
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EventForm;
