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
  ToggleButtonGroup,
  ToggleButton,
  IconButton,
  useTheme,
  InputAdornment,
  Chip,
  Tooltip,
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DateTimePicker } from '@mui/x-date-pickers';
import {
  Comment as RemarkIcon,
  Newspaper as NewsIcon,
  PermMedia as MediaIcon,
  Link as LinkIcon,
  Close as CloseIcon,
  Add as AddIcon,
  CloudUpload as UploadIcon,
} from '@mui/icons-material';
import api from '../../../utils/api';
import { EVENT_TYPES, EVENT_TYPE_COLORS } from './EventTypes';

const EventDialog = ({ open, onClose, onSave, initialEvent = null }) => {
  const theme = useTheme();
  const [eventType, setEventType] = useState(EVENT_TYPES.REMARK);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventDate, setEventDate] = useState(new Date());
  const [url, setUrl] = useState('');
  const [urlPreview, setUrlPreview] = useState(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState('');
  const [tags, setTags] = useState([]);
  const [currentTag, setCurrentTag] = useState('');

  useEffect(() => {
    if (initialEvent) {
      setEventType(initialEvent.type || EVENT_TYPES.REMARK);
      setTitle(initialEvent.title || '');
      setDescription(initialEvent.description || '');
      setEventDate(initialEvent.event_date ? new Date(initialEvent.event_date) : new Date());
      setUrl(initialEvent.url || '');
      setTags(initialEvent.tags || []);
      if (initialEvent.media_url) {
        setMediaPreview(initialEvent.media_url);
      }
    } else {
      resetForm();
    }
  }, [initialEvent]);

  useEffect(() => {
    const fetchUrlPreview = async () => {
      if (!url || eventType !== EVENT_TYPES.NEWS) return;
      
      try {
        setIsLoadingPreview(true);
        const response = await api.post('/api/url-preview', { url });
        setUrlPreview(response.data);
        
        // Auto-fill title if empty and URL preview has a title
        if (!title && response.data.title) {
          setTitle(response.data.title);
        }
      } catch (error) {
        console.error('Error fetching URL preview:', error);
      } finally {
        setIsLoadingPreview(false);
      }
    };
    
    // Add a small delay to prevent excessive API calls while typing
    const timeoutId = setTimeout(() => {
      fetchUrlPreview();
    }, 500);
    
    return () => clearTimeout(timeoutId);
  }, [url, eventType, title]);

  const resetForm = () => {
    setEventType(EVENT_TYPES.REMARK);
    setTitle('');
    setDescription('');
    setEventDate(new Date());
    setUrl('');
    setMediaFile(null);
    setMediaPreview('');
    setTags([]);
    setCurrentTag('');
    setUrlPreview(null);
  };

  const handleTypeChange = (event, newType) => {
    if (newType !== null) {
      setEventType(newType);
    }
  };

  const handleMediaChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setMediaFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setMediaPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddTag = () => {
    if (currentTag && !tags.includes(currentTag)) {
      setTags([...tags, currentTag]);
      setCurrentTag('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSave = () => {
    if (!title.trim()) {
      // Show error or validation message
      return;
    }

    // Format the date directly from the components
    const year = eventDate.getFullYear();
    const month = eventDate.getMonth() + 1; // Month is 0-indexed in JS
    const day = eventDate.getDate();
    const hours = eventDate.getHours();
    const minutes = eventDate.getMinutes();
    
    // Determine AM/PM
    const ampm = hours >= 12 ? 'PM' : 'AM';
    
    // Convert to 12-hour format for display
    const displayHours = hours % 12;
    const displayHoursFormatted = displayHours ? displayHours : 12; // Convert 0 to 12
    
    // Create the raw date string in the format: MM.DD.YYYY.HH.MM.AMPM
    const rawDateString = `${month}.${day}.${year}.${displayHoursFormatted}.${String(minutes).padStart(2, '0')}.${ampm}`;
    
    console.log('===== EVENT SAVE DEBUG =====');
    console.log('Event date object:', eventDate);
    console.log('Created raw date string:', rawDateString);
    console.log('============================');

    const eventData = {
      title,
      description,
      type: eventType,
      event_date: eventDate.toISOString(),
      raw_event_date: rawDateString,
      is_exact_user_time: true
    };

    if (eventType === EVENT_TYPES.NEWS && urlPreview) {
      eventData.url = url;
      eventData.url_title = urlPreview.title || '';
      eventData.url_description = urlPreview.description || '';
      eventData.url_image = urlPreview.image || '';
    }

    if (eventType === EVENT_TYPES.MEDIA && mediaFile) {
      eventData.media_url = mediaPreview;
      eventData.media_type = mediaFile.type;
    }

    if (tags.length > 0) {
      eventData.tags = tags;
    }

    onSave(eventData);
  };

  const getTypeColor = () => {
    // Make sure we have a valid event type
    const safeEventType = eventType && Object.values(EVENT_TYPES).includes(eventType) 
      ? eventType 
      : EVENT_TYPES.REMARK;
    
    // Get colors with fallback
    const colors = EVENT_TYPE_COLORS[safeEventType] || EVENT_TYPE_COLORS[EVENT_TYPES.REMARK];
    return theme.palette.mode === 'dark' ? colors.dark : colors.light;
  };
  
  // Safely get hover color
  const getHoverColor = () => {
    // Make sure we have a valid event type
    const safeEventType = eventType && Object.values(EVENT_TYPES).includes(eventType) 
      ? eventType 
      : EVENT_TYPES.REMARK;
    
    // Get colors with fallback
    const colors = EVENT_TYPE_COLORS[safeEventType] || EVENT_TYPE_COLORS[EVENT_TYPES.REMARK];
    const hoverColors = colors.hover || { light: colors.light, dark: colors.dark };
    
    return theme.palette.mode === 'dark' ? hoverColors.dark : hoverColors.light;
  };

  const renderTypeSpecificFields = () => {
    switch (eventType) {
      case EVENT_TYPES.NEWS:
        return (
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Article URL"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LinkIcon />
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 2 }}
            />
            {isLoadingPreview ? (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Loading preview...
              </Typography>
            ) : urlPreview && (
              <Box 
                sx={{ 
                  border: 1, 
                  borderColor: 'divider',
                  borderRadius: 1,
                  overflow: 'hidden',
                }}
              >
                {urlPreview.image && (
                  <Box 
                    component="img"
                    src={urlPreview.image}
                    alt={urlPreview.title}
                    sx={{
                      width: '100%',
                      height: 200,
                      objectFit: 'cover',
                    }}
                  />
                )}
                <Box sx={{ p: 2 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    {urlPreview.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {urlPreview.description}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {urlPreview.source}
                  </Typography>
                </Box>
              </Box>
            )}
          </Box>
        );

      case EVENT_TYPES.MEDIA:
        return (
          <Box sx={{ mt: 2 }}>
            <input
              type="file"
              accept="image/*,video/*,audio/*"
              style={{ display: 'none' }}
              id="media-upload"
              onChange={handleMediaChange}
            />
            <label htmlFor="media-upload">
              <Button
                component="span"
                variant="outlined"
                startIcon={<UploadIcon />}
                sx={{ 
                  width: '100%',
                  height: 100,
                  borderStyle: 'dashed',
                  borderColor: getTypeColor(),
                  color: getTypeColor(),
                }}
              >
                Upload Media
              </Button>
            </label>
            {mediaPreview && (
              <Box sx={{ mt: 2, position: 'relative' }}>
                {mediaFile?.type?.startsWith('image/') ? (
                  <img
                    src={mediaPreview}
                    alt="Preview"
                    style={{ 
                      width: '100%',
                      maxHeight: 200,
                      objectFit: 'cover',
                      borderRadius: 8,
                    }}
                  />
                ) : mediaFile?.type?.startsWith('video/') ? (
                  <video
                    src={mediaPreview}
                    controls
                    style={{ 
                      width: '100%',
                      maxHeight: 200,
                      borderRadius: 8,
                    }}
                  />
                ) : (
                  <audio
                    src={mediaPreview}
                    controls
                    style={{ width: '100%' }}
                  />
                )}
                <IconButton
                  size="small"
                  onClick={() => {
                    setMediaFile(null);
                    setMediaPreview('');
                  }}
                  sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    bgcolor: 'background.paper',
                  }}
                >
                  <CloseIcon />
                </IconButton>
              </Box>
            )}
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
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
            {initialEvent ? 'Edit Event' : 'Create New Event'}
          </Typography>
          <IconButton size="small" onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ pb: 0 }}>
        <ToggleButtonGroup
          value={eventType}
          exclusive
          onChange={handleTypeChange}
          aria-label="event type"
          sx={{ 
            width: '100%',
            mb: 3,
            '& .MuiToggleButton-root': {
              flex: 1,
              py: 2,
              borderRadius: '12px !important',
              mx: 0.5,
              borderColor: 'transparent',
              '&.Mui-selected': {
                bgcolor: `${getTypeColor()}20 !important`,
                color: getTypeColor(),
                borderColor: getTypeColor(),
              }
            }
          }}
        >
          <ToggleButton value={EVENT_TYPES.REMARK}>
            <Stack alignItems="center" spacing={1}>
              <RemarkIcon />
              <Typography variant="caption">Remark</Typography>
            </Stack>
          </ToggleButton>
          <ToggleButton value={EVENT_TYPES.NEWS}>
            <Stack alignItems="center" spacing={1}>
              <NewsIcon />
              <Typography variant="caption">News</Typography>
            </Stack>
          </ToggleButton>
          <ToggleButton value={EVENT_TYPES.MEDIA}>
            <Stack alignItems="center" spacing={1}>
              <MediaIcon />
              <Typography variant="caption">Media</Typography>
            </Stack>
          </ToggleButton>
        </ToggleButtonGroup>

        <Stack spacing={2}>
          <TextField
            fullWidth
            label="Event Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DateTimePicker
              label="Event Date & Time"
              value={eventDate}
              onChange={setEventDate}
              renderInput={(params) => <TextField {...params} />}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: getTypeColor(),
                  },
                  '&:hover fieldset': {
                    borderColor: getTypeColor(),
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: getTypeColor(),
                  },
                },
              }}
            />
          </LocalizationProvider>

          {renderTypeSpecificFields()}

          <TextField
            fullWidth
            multiline
            rows={3}
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <Box>
            <Stack direction="row" spacing={1} alignItems="center">
              <TextField
                label="Add Tags"
                size="small"
                value={currentTag}
                onChange={(e) => setCurrentTag(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                sx={{ flexGrow: 1 }}
              />
              <Tooltip title="Add Tag">
                <IconButton 
                  onClick={handleAddTag}
                  sx={{ 
                    color: getTypeColor(),
                    '&:hover': { bgcolor: `${getTypeColor()}20` }
                  }}
                >
                  <AddIcon />
                </IconButton>
              </Tooltip>
            </Stack>
            {tags.length > 0 && (
              <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {tags.map((tag) => (
                  <Chip
                    key={tag}
                    label={tag}
                    onDelete={() => handleRemoveTag(tag)}
                    sx={{
                      bgcolor: `${getTypeColor()}20`,
                      color: getTypeColor(),
                      '& .MuiChip-deleteIcon': {
                        color: getTypeColor(),
                        '&:hover': { color: getTypeColor() }
                      }
                    }}
                  />
                ))}
              </Box>
            )}
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={!title || !eventDate}
          sx={{
            bgcolor: getTypeColor(),
            '&:hover': {
              bgcolor: getHoverColor()
            }
          }}
        >
          {initialEvent ? 'Save Changes' : 'Create Event'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EventDialog;
