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
  Paper,
} from '@mui/material';
import { 
  Close as CloseIcon, 
  Image as ImageIcon, 
  Comment as RemarkIcon,
  Newspaper as NewsIcon,
  Movie as MediaIcon,
  Link as LinkIcon,
} from '@mui/icons-material';
import { useState, useEffect, useRef, useMemo } from 'react';
import api from '../../../utils/api';
import { EVENT_TYPES, EVENT_TYPE_METADATA } from './EventTypes';

const EventForm = ({ open, onClose, timelineId, onEventCreated }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [formData, setFormData] = useState(() => {
    // Get current date and time components directly without timezone conversions
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0'); // Month is 0-indexed in JS
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    
    const localDate = `${year}-${month}-${day}`; // YYYY-MM-DD format
    const localTime = `${hours}:${minutes}`; // HH:MM format (24-hour)
    
    console.log('===== FORM INITIALIZATION =====');
    console.log('Current date object:', now);
    console.log('Formatted date:', localDate);
    console.log('Formatted time:', localTime);
    console.log('===============================');
    
    return {
      title: '',
      description: '',
      event_date: localDate, // YYYY-MM-DD format
      event_time: localTime, // HH:MM format
      type: EVENT_TYPES.REMARK, // Default to remark
      url: '',
      url_title: '',
      url_description: '',
      url_image: '',
      media_url: '',
      media_type: '',
      tags: []
    };
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [urlLoading, setUrlLoading] = useState(false);
  const [urlData, setUrlData] = useState(null);
  const [urlPreviewFetched, setUrlPreviewFetched] = useState(false);
  const previousUrl = useRef('');
  const urlDebounceTimer = useRef(null);

  // Common sites with known logos
  const domainLogos = {
    'facebook.com': 'https://www.facebook.com/images/fb_icon_325x325.png',
    'instagram.com': 'https://www.instagram.com/static/images/ico/favicon-192.png/68d99ba29cc8.png',
    'twitter.com': 'https://abs.twimg.com/responsive-web/client-web/icon-default.522d363a.png',
    'x.com': 'https://abs.twimg.com/responsive-web/client-web/icon-default.522d363a.png',
    'linkedin.com': 'https://static.licdn.com/sc/h/al2o9zrvru7aqj8e1x2rzsrca',
    'youtube.com': 'https://www.youtube.com/s/desktop/12d6b690/img/favicon_144x144.png',
    'youtu.be': 'https://www.youtube.com/s/desktop/12d6b690/img/favicon_144x144.png',
    'reddit.com': 'https://www.redditstatic.com/desktop2x/img/favicon/android-icon-192x192.png',
    'google.com': 'https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png',
    'spotify.com': 'https://open.scdn.co/cdn/images/favicon.5cb2bd30.ico',
    'open.spotify.com': 'https://open.scdn.co/cdn/images/favicon32.8e66b099.png',
    'github.com': 'https://github.githubassets.com/favicons/favicon.svg',
    'medium.com': 'https://miro.medium.com/v2/1*m-R_BkNf1Qjr1YbyOIJY2w.png',
    'amazon.com': 'https://www.amazon.com/favicon.ico',
    'netflix.com': 'https://assets.nflxext.com/us/ffe/siteui/common/icons/nficon2016.ico',
    'apple.com': 'https://www.apple.com/favicon.ico',
    'microsoft.com': 'https://c.s-microsoft.com/favicon.ico',
    'twitch.tv': 'https://static.twitchcdn.net/assets/favicon-32-e29e246c157142c94346.png'
  };

  useEffect(() => {
    if (open) {
      // Reset form when opened
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0'); // Month is 0-indexed in JS
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      
      const localDate = `${year}-${month}-${day}`; // YYYY-MM-DD format
      const localTime = `${hours}:${minutes}`; // HH:MM format (24-hour)
      
      setFormData({
        title: '',
        description: '',
        event_date: localDate,
        event_time: localTime,
        type: EVENT_TYPES.REMARK,
        url: '',
        url_title: '',
        url_description: '',
        url_image: '',
        media_url: '',
        media_type: '',
        tags: []
      });
      setActiveTab(0);
      setError('');
      setUrlData(null);
    }
  }, [open]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Special handling for URL field
    if (name === 'url') {
      // If URL is being cleared, reset URL-related state
      if (!value) {
        setUrlData(null);
        setUrlPreviewFetched(false);
        previousUrl.current = '';
      }
      
      // If URL is changing, mark it as needing to be fetched again
      if (value !== previousUrl.current) {
        setUrlPreviewFetched(false);
      }
    }
    
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

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleUrlBlur = async () => {
    if (!formData.url) return;
    
    // Don't re-fetch if the URL hasn't changed
    if (formData.url === previousUrl.current && urlPreviewFetched) {
      return;
    }
    
    // Clear any existing debounce timer
    if (urlDebounceTimer.current) {
      clearTimeout(urlDebounceTimer.current);
    }
    
    // Set a new debounce timer
    urlDebounceTimer.current = setTimeout(async () => {
      try {
        setUrlLoading(true);
        previousUrl.current = formData.url;
        
        const response = await api.post('/api/url-preview', { url: formData.url });
        setUrlData(response.data);
        setUrlPreviewFetched(true);
        
        // Auto-fill URL metadata
        setFormData(prev => ({
          ...prev,
          url_title: response.data.title || '',
          url_description: response.data.description || '',
          url_image: response.data.image || ''
        }));
        
        // If title is empty, use URL title as event title
        if (!formData.title && response.data.title) {
          setFormData(prev => ({
            ...prev,
            title: response.data.title
          }));
        }
      } catch (error) {
        console.error('Error fetching URL metadata:', error);
        // Don't show an error to the user, just silently fail
        // The backend will still return basic metadata
      } finally {
        setUrlLoading(false);
      }
    }, 300); // 300ms debounce
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
    if (!formData.event_date || !formData.event_time) {
      setError('Date and time are required');
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
    
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Create a copy of the form data for submission
      const eventData = { ...formData };
      
      // Log the raw input values
      console.log('===== RAW INPUT VALUES =====');
      console.log('Raw event_date:', eventData.event_date);
      console.log('Raw event_time:', eventData.event_time);
      console.log('=============================');
      
      // COMPLETELY NEW APPROACH: Format the date as a simple string
      // Format: MM.DD.YYYY.HH.MM.AMPM
      if (eventData.event_date && eventData.event_time) {
        // Parse date components
        const [year, month, day] = eventData.event_date.split('-');
        
        // Parse time components
        let [hours, minutes] = eventData.event_time.split(':');
        hours = parseInt(hours);
        
        // Determine AM/PM
        const ampm = hours >= 12 ? 'PM' : 'AM';
        
        // Convert to 12-hour format for display
        const displayHours = hours % 12;
        const displayHoursFormatted = displayHours ? displayHours : 12; // Convert 0 to 12
        
        // Create the raw date string in the format: MM.DD.YYYY.HH.MM.AMPM
        const rawDateString = `${parseInt(month)}.${parseInt(day)}.${year}.${displayHoursFormatted}.${minutes}.${ampm}`;
        
        console.log('Created raw date string:', rawDateString);
        
        // Add to event data
        eventData.raw_event_date = rawDateString;
        eventData.is_exact_user_time = true;
        
        // Also create a datetime object for backward compatibility
        // But use the EXACT values from the form without any manipulation
        const userSelectedDate = new Date(
          parseInt(year),
          parseInt(month) - 1, // Month is 0-indexed in JS Date
          parseInt(day),
          hours, // Use the exact hour value (24-hour format)
          parseInt(minutes)
        );
        
        console.log('Created Date object:', userSelectedDate);
        console.log('Date object ISO string:', userSelectedDate.toISOString());
        console.log('Date object local string:', userSelectedDate.toString());
        
        eventData.event_datetime = userSelectedDate.toISOString();
      }
      
      console.log('===== FORM SUBMISSION DEBUG =====');
      console.log('Form data before submission:', formData);
      console.log('Event date from form:', formData.event_date);
      console.log('Event time from form:', formData.event_time);
      console.log('Raw date string:', eventData.raw_event_date);
      console.log('Final event data being sent:', eventData);
      console.log('API endpoint:', `/api/timeline-v3/${timelineId}/events`);
      console.log('================================');
      
      // Create the final event data for submission
      const response = await api.post(`/api/timeline-v3/${timelineId}/events`, eventData);
      
      console.log('===== RESPONSE DEBUG =====');
      console.log('Response from server:', response.data);
      console.log('Event date from response:', response.data.event_date);
      console.log('Raw event date from response:', response.data.raw_event_date);
      console.log('is_exact_user_time in response:', response.data.is_exact_user_time);
      console.log('================================');
      
      onEventCreated(response.data);
      onClose();
    } catch (error) {
      console.error('Error creating event:', error);
      setError(error.response?.data?.error || 'Failed to create event');
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

  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const years = Array.from({ length: 100 }, (_, i) => 2023 - i);
  const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
  const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

  // Determine if the image is from YouTube
  const isYouTubeImage = (url) => {
    if (!url) return false;
    try {
      return url.includes('youtube.com') || 
             url.includes('youtu.be') || 
             url.includes('ytimg.com') || 
             url.includes('yt');
    } catch (error) {
      return false;
    }
  };

  // Determine if the image is a logo (fallback)
  const isLogoImage = (url) => {
    if (!url) return false;
    try {
      // First check if the image URL itself matches any of our known logo URLs
      for (const logoUrl of Object.values(domainLogos)) {
        if (url.includes(logoUrl) || logoUrl.includes(url)) {
          return true;
        }
      }
      
      // Check if the URL contains common logo indicators
      if (url.includes('favicon') || 
          url.includes('logo') || 
          url.includes('icon') || 
          url.includes('brand')) {
        return true;
      }
      
      // Check if the URL is from a known domain with logos
      try {
        const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
        const domain = urlObj.hostname.toLowerCase();
        
        // Check if the domain matches any of our known domains with logos
        for (const [knownDomain] of Object.entries(domainLogos)) {
          if (domain.includes(knownDomain)) {
            return true;
          }
        }
      } catch (error) {
        // If URL parsing fails, just continue with other checks
        console.error('Error parsing URL in isLogoImage:', error);
      }
      
      // Check if the image is likely a small icon/logo based on filename
      const filename = url.split('/').pop().toLowerCase();
      if (filename.includes('favicon') || 
          filename.includes('logo') || 
          filename.includes('icon') || 
          filename.includes('brand')) {
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error checking if logo image:', error);
      return false;
    }
  };

  // Check if the image is an actual content image vs a fallback logo
  const isActualImage = (url) => {
    if (!url) return false;
    try {
      return !isLogoImage(url);
    } catch (error) {
      console.error('Error checking if actual image:', error);
      return false;
    }
  };

  const truncateDescription = (text) => {
    if (!text) return '';
    const words = text.split(/\s+/);
    if (words.length <= 50) return text;
    return words.slice(0, 50).join(' ') + '...';
  };

  const UrlPreviewComponent = useMemo(() => {
    if (!urlData || !formData.url) return null;
    
    return (
      <Paper 
        elevation={1} 
        sx={{ 
          p: 2, 
          mt: 2, 
          borderRadius: 1,
          backgroundColor: 'background.paper'
        }}
      >
        <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <LinkIcon sx={{ fontSize: 14, mr: 0.5 }} />
          URL Preview
        </Typography>
        
        {/* For YouTube and Logo images, use side-by-side layout */}
        {urlData.image && (isYouTubeImage(urlData.image) || isLogoImage(urlData.image)) ? (
          <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2 }}>
            {/* Image on the left */}
            <Box sx={{
              width: isLogoImage(urlData.image) ? '120px' : '180px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: isLogoImage(urlData.image) ? 'background.paper' : 'transparent',
              borderRadius: 1,
              overflow: 'hidden',
              flexShrink: 0,
              padding: isLogoImage(urlData.image) ? 1 : 0,
            }}>
              <img 
                src={urlData.image} 
                alt={urlData.title || "URL preview"} 
                style={{ 
                  objectFit: 'contain',
                  width: 'auto',
                  maxHeight: isLogoImage(urlData.image) ? '100px' : '180px',
                  display: 'block',
                  margin: 'auto',
                  maxWidth: isLogoImage(urlData.image) ? '100px' : '180px'
                }} 
              />
            </Box>
            
            {/* Content on the right */}
            <Box sx={{ flex: 1 }}>
              <Typography variant="body1" fontWeight="medium">
                {truncateDescription(urlData.title || formData.url)}
              </Typography>
              
              {urlData.description && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {truncateDescription(urlData.description)}
                </Typography>
              )}
              
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                {urlData.url || formData.url}
              </Typography>
            </Box>
          </Box>
        ) : (
          /* For news articles, keep the original stacked layout */
          <>
            {urlData.image && (
              <Box sx={{ 
                width: '100%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: 'transparent',
                borderRadius: 1,
                overflow: 'hidden',
                height: 'auto',
                padding: 0,
                mb: 1
              }}>
                <img 
                  src={urlData.image} 
                  alt={urlData.title || "URL preview"} 
                  style={{ 
                    objectFit: 'cover',
                    width: '100%',
                    maxHeight: '240px',
                    display: 'block',
                    margin: '0',
                    maxWidth: '100%'
                  }} 
                />
              </Box>
            )}
            
            <Typography variant="body1" fontWeight="medium">
              {truncateDescription(urlData.title || formData.url)}
            </Typography>
            
            {urlData.description && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {truncateDescription(urlData.description)}
              </Typography>
            )}
            
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
              {urlData.url || formData.url}
            </Typography>
          </>
        )}
      </Paper>
    );
  }, [urlData, formData.url]);

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
            <Stack direction="row" spacing={2}>
              <FormControl fullWidth>
                <InputLabel>Day</InputLabel>
                <Select
                  value={formData.event_date.split('-')[2]}
                  label="Day"
                  onChange={(e) => {
                    const newDate = `${formData.event_date.split('-')[0]}-${formData.event_date.split('-')[1]}-${e.target.value}`;
                    setFormData(prev => ({ ...prev, event_date: newDate }));
                  }}
                >
                  {days.map((day) => (
                    <MenuItem key={day} value={String(day).padStart(2, '0')}>{day}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Month</InputLabel>
                <Select
                  value={formData.event_date.split('-')[1]}
                  label="Month"
                  onChange={(e) => {
                    const newDate = `${formData.event_date.split('-')[0]}-${e.target.value}-${formData.event_date.split('-')[2]}`;
                    setFormData(prev => ({ ...prev, event_date: newDate }));
                  }}
                >
                  {months.map((month) => (
                    <MenuItem key={month} value={String(month).padStart(2, '0')}>{month}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Year</InputLabel>
                <Select
                  value={formData.event_date.split('-')[0]}
                  label="Year"
                  onChange={(e) => {
                    const newDate = `${e.target.value}-${formData.event_date.split('-')[1]}-${formData.event_date.split('-')[2]}`;
                    setFormData(prev => ({ ...prev, event_date: newDate }));
                  }}
                >
                  {years.map((year) => (
                    <MenuItem key={year} value={year}>{year}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
            <Stack direction="row" spacing={2}>
              <FormControl fullWidth>
                <InputLabel>Hour</InputLabel>
                <Select
                  value={formData.event_time.split(':')[0]}
                  label="Hour"
                  onChange={(e) => {
                    const newTime = `${e.target.value}:${formData.event_time.split(':')[1]}`;
                    setFormData(prev => ({ ...prev, event_time: newTime }));
                  }}
                >
                  {hours.map((hour) => (
                    <MenuItem key={hour} value={hour}>{hour}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Minute</InputLabel>
                <Select
                  value={formData.event_time.split(':')[1]}
                  label="Minute"
                  onChange={(e) => {
                    const newTime = `${formData.event_time.split(':')[0]}:${e.target.value}`;
                    setFormData(prev => ({ ...prev, event_time: newTime }));
                  }}
                >
                  {minutes.map((minute) => (
                    <MenuItem key={minute} value={minute}>{minute}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
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
              onKeyUp={(e) => {
                // Trigger URL preview fetch after a short delay when user stops typing
                if (urlDebounceTimer.current) {
                  clearTimeout(urlDebounceTimer.current);
                }
                urlDebounceTimer.current = setTimeout(() => {
                  if (formData.url && formData.url !== previousUrl.current) {
                    handleUrlBlur();
                  }
                }, 500);
              }}
              fullWidth
              InputProps={{
                endAdornment: urlLoading && <CircularProgress size={20} />
              }}
              helperText="Add a reference link to this event"
            />
            
            {UrlPreviewComponent}

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
