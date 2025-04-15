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
  Link,
} from '@mui/material';
import { 
  Close as CloseIcon, 
  Image as ImageIcon, 
  Comment as RemarkIcon,
  Newspaper as NewsIcon,
  Movie as MediaIcon,
  Link as LinkIcon,
  CloudUpload as CloudUploadIcon,
  Delete as DeleteIcon,
  AudioFile as AudioFileIcon,
  VideoFile as VideoFileIcon,
} from '@mui/icons-material';
import { useState, useEffect, useRef, useMemo } from 'react';
import { useDropzone } from 'react-dropzone';
import api from '../../../utils/api';
import { EVENT_TYPES, EVENT_TYPE_METADATA } from './EventTypes';
import CloudinaryTest from './CloudinaryTest';

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
      
      // Reset all form state
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
      
      // Reset all URL-related state
      setActiveTab(0);
      setError('');
      setUrlData(null);
      setUrlPreviewFetched(false);
      previousUrl.current = '';
      
      // Clear any pending URL fetch
      if (urlDebounceTimer.current) {
        clearTimeout(urlDebounceTimer.current);
        urlDebounceTimer.current = null;
      }
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
      console.log('Media URL:', eventData.media_url);
      console.log('Media Type:', eventData.media_type);
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
      
      // For Media type events, ensure media_url is used correctly
      if (eventData.type === EVENT_TYPES.MEDIA) {
        // If we have a media_url from file upload, make sure it's properly included
        console.log('Media event detected with media_url:', eventData.media_url);
        
        // CRITICAL: Make sure media_url is properly set and not empty
        if (eventData.media_url) {
          console.log('Using media_url from file upload:', eventData.media_url);
          
          // Ensure the URL is properly formatted
          if (!eventData.media_url.startsWith('http') && !eventData.media_url.startsWith('/')) {
            // If it's not an absolute URL or a path starting with /, prepend /
            eventData.media_url = `/${eventData.media_url}`;
            console.log('Formatted media_url:', eventData.media_url);
          }
          
          // Set url field to match media_url for backward compatibility
          eventData.url = eventData.media_url;
          console.log('Set url to match media_url:', eventData.url);
        } else {
          console.warn('Media event has no media_url!');
        }
        
        // Make sure media_type is set properly
        if (!eventData.media_type && eventData.media_url) {
          // Try to determine media type from URL
          const fileExt = eventData.media_url.split('.').pop()?.toLowerCase();
          
          if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(fileExt)) {
            eventData.media_type = 'image/' + fileExt;
          } else if (['mp4', 'webm', 'ogg', 'mov', 'avi'].includes(fileExt)) {
            eventData.media_type = 'video/' + fileExt;
          } else if (['mp3', 'wav', 'ogg', 'aac', 'flac'].includes(fileExt)) {
            eventData.media_type = 'audio/' + fileExt;
          } else if (eventData.media_url.includes('cloudinary')) {
            eventData.media_type = 'cloudinary:image';
          }
          
          console.log('Determined media_type:', eventData.media_type);
        }
      }
      
      // CRITICAL: Make sure cloudinary_id is included in the event data if available
      if (formData.cloudinary_id && !eventData.cloudinary_id) {
        eventData.cloudinary_id = formData.cloudinary_id;
        console.log('Added cloudinary_id to event data:', eventData.cloudinary_id);
      }
      
      console.log('===== FORM SUBMISSION DEBUG =====');
      console.log('Form data before submission:', formData);
      console.log('Event date from form:', formData.event_date);
      console.log('Event time from form:', formData.event_time);
      console.log('Raw date string:', eventData.raw_event_date);
      console.log('Media URL:', eventData.media_url);
      console.log('Media Type:', eventData.media_type);
      console.log('Cloudinary ID:', eventData.cloudinary_id);
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
      
      // Pass the created event back to the parent component
      onEventCreated(response.data);
      
      // Reset form state before closing
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      
      const localDate = `${year}-${month}-${day}`;
      const localTime = `${hours}:${minutes}`;
      
      // Reset all form state
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
      
      // Reset all URL-related state
      setActiveTab(0);
      setError('');
      setUrlData(null);
      setUrlPreviewFetched(false);
      previousUrl.current = '';
      
      // Clear any pending URL fetch
      if (urlDebounceTimer.current) {
        clearTimeout(urlDebounceTimer.current);
        urlDebounceTimer.current = null;
      }
      
      // Close the form
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

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: async (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0];
        console.log('===== FILE UPLOAD PROCESS STARTED =====');
        console.log('File selected for upload:', {
          name: file.name,
          type: file.type,
          size: `${(file.size / 1024).toFixed(2)} KB`,
          lastModified: new Date(file.lastModified).toISOString()
        });
        
        // Create a form data object to send the file
        const formData = new FormData();
        formData.append('file', file);
        
        try {
          setLoading(true);
          setError('');
          console.log('===== MEDIA UPLOAD PROCESS STARTED =====');
          console.log('Starting media upload to Cloudinary');
          console.log('API base URL:', api.defaults.baseURL);
          
          // Add media type to the form data
          const fileType = file.type;
          let mediaCategory = 'other';
          
          if (fileType.startsWith('image/')) {
            mediaCategory = 'image';
          } else if (fileType.startsWith('video/')) {
            mediaCategory = 'video';
          } else if (fileType.startsWith('audio/')) {
            mediaCategory = 'audio';
          }
          
          formData.append('media_type', mediaCategory);
          console.log(`File type: ${fileType}, Media category: ${mediaCategory}`);
          
          // Log the request details for debugging
          console.log('Request URL:', `${api.defaults.baseURL}/api/upload-media`);
          console.log('Request method: POST');
          console.log('Request headers: Content-Type: multipart/form-data');
          
          const response = await api.post('/api/upload-media', formData, {
            headers: {
              'Content-Type': 'multipart/form-data'
            },
            timeout: 30000,
            onUploadProgress: (progressEvent) => {
              const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              console.log(`Upload progress: ${percentCompleted}%`);
            }
          });

          console.log('===== UPLOAD RESPONSE =====');
          console.log('Status:', response.status);
          console.log('Response data:', response.data);
          
          if (!response.data || !response.data.url) {
            throw new Error('Invalid response from server: Missing URL in response data');
          }

          // Get the media URL from the response
          const mediaUrl = response.data.url;
          console.log('Media URL from response:', mediaUrl);

          // Determine if this is a Cloudinary URL
          const isCloudinaryUrl = mediaUrl.includes('cloudinary.com') || 
                                 mediaUrl.includes('res.cloudinary') ||
                                 (response.data.storage === 'cloudinary');

          console.log('Upload successful!');
          console.log('Media URL:', mediaUrl);
          console.log('Is Cloudinary URL:', isCloudinaryUrl);
          console.log('Storage type:', response.data.storage);
          console.log('Cloudinary ID:', response.data.cloudinary_id || response.data.public_id);

          // CRITICAL: Ensure we have the complete URL for Cloudinary
          let finalMediaUrl = mediaUrl;
          
          // Make sure the URL is properly formatted
          if (!finalMediaUrl.startsWith('http') && isCloudinaryUrl) {
            // This might be just a public ID - construct a proper Cloudinary URL
            const cloudName = 'dnjwvuxn7';
            finalMediaUrl = `https://res.cloudinary.com/${cloudName}/image/upload/${finalMediaUrl}`;
            console.log('Fixed Cloudinary URL:', finalMediaUrl);
          }
          
          // Store the Cloudinary ID if available
          const cloudinaryId = response.data.cloudinary_id || response.data.public_id || '';
          
          // Update form data with the media URL and type information
          setFormData(prev => ({
            ...prev,
            media_url: finalMediaUrl,
            media_type: isCloudinaryUrl ? `cloudinary:${file.type}` : file.type,
            url: finalMediaUrl, // Also set the url field for backward compatibility
            cloudinary_id: cloudinaryId // Store the Cloudinary ID
          }));
          
          console.log('Updated form data with media information:', {
            media_url: finalMediaUrl,
            media_type: isCloudinaryUrl ? `cloudinary:${file.type}` : file.type,
            cloudinary_id: cloudinaryId
          });

          // Log the updated form data
          console.log('Updated form data with media URL:', mediaUrl);

          setLoading(false);
          setError(null);

          // Show success message
          // setSnackbar({
          //   open: true,
          //   message: 'File uploaded successfully',
          //   severity: 'success'
          // });

          return mediaUrl;
        } catch (error) {
          console.error('Error uploading file:', error);

          // More detailed error logging
          if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
            console.error('No response received. Request details:', error.request);
          } else {
            // Something happened in setting up the request that triggered an Error
            console.error('Error setting up request:', error.message);
          }
          
          setError(`Failed to upload media file: ${error.message}. Please try again.`);
          setLoading(false);
        }
      }
    },
    accept: {
      'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg'],
      'video/*': ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.wmv', '.flv', '.mkv'],
      'audio/*': ['.mp3', '.wav', '.ogg', '.aac', '.flac', '.m4a']
    },
    maxSize: 20 * 1024 * 1024, // 20MB max size
    multiple: false
  });

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

            {formData.type === EVENT_TYPES.MEDIA && (
              <>
                {/* Add the CloudinaryTest component */}
                <Box sx={{ mt: 3, mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Upload Media with Cloudinary (Recommended)
                  </Typography>
                  <CloudinaryTest 
                    onUploadSuccess={(uploadResult) => {
                      console.log('CloudinaryTest upload success:', uploadResult);
                      // Update form data with the Cloudinary URL
                      setFormData(prev => ({
                        ...prev,
                        media_url: uploadResult.url,
                        media_type: `cloudinary:${uploadResult.type}`,
                        url: uploadResult.url // Also set URL for backward compatibility
                      }));
                    }}
                  />
                </Box>
                
                {/* Original upload component */}
                <Box sx={{ mt: 3, mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Alternative Upload Method (Legacy)
                  </Typography>
                </Box>
                
                {formData.media_url ? (
                  <Box sx={{ 
                    mt: 2, 
                    p: 2, 
                    borderRadius: 1,
                    backgroundColor: 'background.paper',
                    border: '1px solid',
                    borderColor: 'divider',
                  }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="subtitle1">Media Preview</Typography>
                      <IconButton 
                        size="small" 
                        color="error" 
                        onClick={() => setFormData(prev => ({ ...prev, media_url: '', media_type: '' }))}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                    
                    {/* Media preview based on type */}
                    {formData.media_type?.startsWith('image/') || formData.media_type?.includes('cloudinary:image/') || /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(formData.media_url) ? (
                      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                        <img 
                          src={formData.media_url} 
                          alt="Media preview" 
                          style={{ 
                            maxWidth: '100%', 
                            maxHeight: '200px',
                            objectFit: 'contain',
                            borderRadius: 4
                          }} 
                        />
                      </Box>
                    ) : formData.media_type?.startsWith('video/') || formData.media_type?.includes('cloudinary:video/') || /\.(mp4|webm|ogg|mov|avi|wmv|flv|mkv)$/i.test(formData.media_url) ? (
                      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                        <video
                          controls
                          style={{ 
                            maxWidth: '100%', 
                            maxHeight: '200px',
                            borderRadius: 4
                          }}
                        >
                          <source src={formData.media_url} type={formData.media_type?.replace('cloudinary:', '') || "video/mp4"} />
                          Your browser does not support the video tag.
                        </video>
                      </Box>
                    ) : formData.media_type?.startsWith('audio/') || formData.media_type?.includes('cloudinary:audio/') || /\.(mp3|wav|ogg|aac|flac|m4a)$/i.test(formData.media_url) ? (
                      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                        <audio
                          controls
                          style={{ width: '100%' }}
                        >
                          <source src={formData.media_url} type={formData.media_type?.replace('cloudinary:', '') || "audio/mpeg"} />
                          Your browser does not support the audio element.
                        </audio>
                      </Box>
                    ) : (
                      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                        <Link 
                          href={formData.media_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                        >
                          <MediaIcon />
                          View Media
                        </Link>
                      </Box>
                    )}
                  </Box>
                ) : (
                  <Box {...getRootProps()} sx={{ 
                    p: 2, 
                    mt: 2, 
                    borderRadius: 1,
                    backgroundColor: 'background.paper',
                    border: '1px dashed',
                    borderColor: 'divider',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    flexDirection: 'column'
                  }}>
                    <input {...getInputProps()} />
                    {
                      isDragActive ? <p>Drop the media here ...</p> : <p>Drag 'n' drop or click to upload media</p>
                    }
                    <CloudUploadIcon sx={{ fontSize: 48, mb: 1 }} />
                  </Box>
                )}
              </>
            )}
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
