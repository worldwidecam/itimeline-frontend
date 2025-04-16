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
  CircularProgress,
  Paper,
  Divider,
  Card,
  CardMedia,
  Chip,
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DateTimePicker } from '@mui/x-date-pickers';
import {
  Close as CloseIcon,
  CloudUpload as UploadIcon,
  CloudUpload as CloudUploadIcon,
  Image as ImageIcon,
  Audiotrack as AudioIcon,
  Videocam as VideoIcon,
} from '@mui/icons-material';
import api from '../../../utils/api';
import axios from 'axios';
import { EVENT_TYPES } from './EventTypes';

const MediaEventDialog = ({ open, onClose, onSave }) => {
  const theme = useTheme();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventDate, setEventDate] = useState(new Date());
  const [file, setFile] = useState(null);
  const [mediaType, setMediaType] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [error, setError] = useState(null);
  const [logs, setLogs] = useState([]);
  const [mediaPreview, setMediaPreview] = useState('');
  const [tags, setTags] = useState([]);
  const [currentTag, setCurrentTag] = useState('');

  // Add a log entry with timestamp
  const addLog = (message) => {
    console.log(`MediaEventDialog: ${message}`);
    setLogs(prev => [...prev, `${new Date().toISOString().split('T')[1].split('.')[0]} - ${message}`]);
  };

  // Clear logs
  const clearLogs = () => {
    setLogs([]);
  };

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
    setFile(null);
    setMediaType('');
    setUploadResult(null);
    setError(null);
    clearLogs();
    setMediaPreview('');
    setTags([]);
    setCurrentTag('');
  };

  // Handle file selection
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      
      // Determine media type from file
      if (selectedFile.type.startsWith('image/')) {
        setMediaType('image');
      } else if (selectedFile.type.startsWith('video/')) {
        setMediaType('video');
      } else if (selectedFile.type.startsWith('audio/')) {
        setMediaType('audio');
      } else {
        setMediaType('other');
      }
      
      // Create a preview URL
      const previewUrl = URL.createObjectURL(selectedFile);
      setMediaPreview(previewUrl);
      
      addLog(`File selected: ${selectedFile.name} (${selectedFile.type}, ${(selectedFile.size / 1024).toFixed(2)} KB)`);
    }
  };

  // Upload the file to Cloudinary
  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    setLoading(true);
    setError(null);
    setUploadResult(null);
    
    addLog(`Starting upload for ${file.name}...`);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('media_type', mediaType);

    try {
      addLog('Sending request to /api/upload endpoint...');
      
      // Log the FormData contents for debugging
      addLog(`FormData contains file: ${formData.has('file')}`);
      addLog(`File size: ${file.size} bytes`);
      addLog(`File type: ${file.type}`);
      
      // Use the /api/upload endpoint which is working instead of /api/upload-media
      const response = await axios.post('/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      addLog(`Upload successful! Response: ${JSON.stringify(response.data)}`);
      setUploadResult(response.data);
      
      // Release the object URL to avoid memory leaks
      if (mediaPreview) {
        URL.revokeObjectURL(mediaPreview);
      }
      
      // Set the media preview to the Cloudinary URL or the returned URL
      if (response.data.secure_url) {
        setMediaPreview(response.data.secure_url);
      } else if (response.data.url) {
        setMediaPreview(response.data.url);
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.response?.data?.error || 'Upload failed. Please try again.');
      addLog(`Error during upload: ${err.message}`);
      if (err.response) {
        addLog(`Error response: ${JSON.stringify(err.response.data)}`);
        addLog(`Error status: ${err.response.status}`);
      }
    } finally {
      setLoading(false);
    }
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
    if (!uploadResult) {
      setError('Please upload a media file first');
      return;
    }

    try {
      addLog('Preparing event data for submission...');
      
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
      
      // Get the media URL from the upload result
      const mediaUrl = uploadResult.secure_url || uploadResult.url;
      const cloudinaryId = uploadResult.public_id || '';
      
      addLog(`Using media URL: ${mediaUrl}`);
      addLog(`Using cloudinary ID: ${cloudinaryId}`);
      
      const eventData = {
        title: title,
        description: description,
        event_date: originalDate.toISOString(),
        raw_event_date: rawDateString,
        is_exact_user_time: true,
        type: EVENT_TYPES.MEDIA,
        media_url: mediaUrl,
        media_type: mediaType,
        cloudinary_id: cloudinaryId,
        tags: tags
      };
      
      addLog(`Submitting event data: ${JSON.stringify(eventData)}`);
      onSave(eventData);
      
      // Reset form and close dialog
      resetForm();
      onClose();
    } catch (err) {
      console.error('Submission error:', err);
      setError(err.response?.data?.error || 'Submission failed. Please try again.');
      addLog(`Error during submission: ${err.message}`);
      if (err.response) {
        addLog(`Error response: ${JSON.stringify(err.response.data)}`);
      }
    }
  };

  const renderMediaPreview = () => {
    if (!mediaPreview) return null;

    if (mediaType === 'image') {
      return (
        <Card sx={{ mt: 2, overflow: 'hidden', borderRadius: 2 }}>
          <CardMedia
            component="img"
            image={mediaPreview}
            alt="Media preview"
            sx={{ 
              width: '100%',
              height: 200,
              objectFit: 'cover',
            }}
          />
        </Card>
      );
    } else if (mediaType === 'video') {
      return (
        <Box sx={{ mt: 2 }}>
          <video
            src={mediaPreview}
            controls
            style={{ width: '100%', borderRadius: 8 }}
          />
        </Box>
      );
    } else if (mediaType === 'audio') {
      return (
        <Box sx={{ mt: 2 }}>
          <audio
            src={mediaPreview}
            controls
            style={{ width: '100%' }}
          />
        </Box>
      );
    }
    return null;
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
          
          <Divider sx={{ my: 2 }} />
          
          <Typography variant="subtitle1" gutterBottom>
            Media Upload
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <Button
              variant="outlined"
              component="label"
              startIcon={<UploadIcon />}
              sx={{ flex: 1 }}
            >
              Select File
              <input
                type="file"
                hidden
                accept="image/*,video/*,audio/*"
                onChange={handleFileChange}
              />
            </Button>
            
            <Button
              variant="contained"
              color="primary"
              onClick={handleUpload}
              disabled={!file || loading}
              startIcon={loading ? <CircularProgress size={20} /> : <CloudUploadIcon />}
              sx={{ flex: 1 }}
            >
              {loading ? 'Uploading...' : 'Upload'}
            </Button>
          </Box>
          
          {file && (
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
            </Typography>
          )}
          
          {renderMediaPreview()}
          
          {error && (
            <Typography variant="body2" color="error" sx={{ mt: 2 }}>
              {error}
            </Typography>
          )}
          
          {uploadResult && (
            <Paper variant="outlined" sx={{ p: 2, mt: 2, bgcolor: 'success.light', color: 'success.contrastText' }}>
              <Typography variant="subtitle2">
                Upload Successful!
              </Typography>
              <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                URL: {uploadResult.secure_url}
              </Typography>
            </Paper>
          )}
          
          {logs.length > 0 && (
            <Paper variant="outlined" sx={{ p: 2, mt: 2, maxHeight: 150, overflow: 'auto' }}>
              <Typography variant="caption" component="div" sx={{ fontFamily: 'monospace' }}>
                {logs.map((log, index) => (
                  <div key={index}>{log}</div>
                ))}
              </Typography>
            </Paper>
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
          disabled={!uploadResult || loading}
        >
          Create Media Event
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MediaEventDialog;
