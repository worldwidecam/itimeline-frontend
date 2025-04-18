import React, { useState } from 'react';
import { 
  Box, 
  Button, 
  Typography, 
  Paper, 
  CircularProgress, 
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Card,
  CardMedia,
  CardContent,
} from '@mui/material';
import { 
  CloudUpload as CloudUploadIcon, 
  AudioIcon as AudioIcon, 
  Videocam as VideoIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import axios from 'axios';
import config from '../../../config';

/**
 * A simplified version of MediaUploader specifically for the MediaEventCreator
 * that only shows the currently uploaded file for this event
 */
const EventMediaUploader = ({ onUploadComplete }) => {
  const [file, setFile] = useState(null);
  const [mediaType, setMediaType] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [error, setError] = useState(null);
  const [currentUpload, setCurrentUpload] = useState(null);
  const [logs, setLogs] = useState([]);

  // Add a log entry with timestamp
  const addLog = (message) => {
    console.log(`EventMediaUploader: ${message}`);
    setLogs(prev => [...prev, `${new Date().toISOString().split('T')[1].split('.')[0]} - ${message}`]);
  };

  // Clear logs
  const clearLogs = () => {
    setLogs([]);
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
      
      addLog(`File selected: ${selectedFile.name} (${selectedFile.type}, ${(selectedFile.size / 1024).toFixed(2)} KB)`);
    }
  };

  // Handle media type selection
  const handleMediaTypeChange = (e) => {
    setMediaType(e.target.value);
    addLog(`Media type set to: ${e.target.value}`);
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
    clearLogs();

    const formData = new FormData();
    formData.append('file', file);
    formData.append('media_type', mediaType); // Add media type to the form data

    addLog(`Starting file upload...`);
    addLog(`File: ${file.name} (${file.type}, ${(file.size / 1024).toFixed(2)} KB)`);
    addLog(`Media type: ${mediaType}`);

    try {
      const response = await axios.post(`${config.API_URL}/api/upload-media`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        timeout: 30000
      });

      addLog(`Upload successful! Status: ${response.status}`);
      
      setUploadResult(response.data);
      
      // Set the current upload
      if (response.data && response.data.url) {
        const newFile = {
          id: Date.now(), // Use timestamp as a simple ID
          name: file.name,
          url: response.data.url,
          type: mediaType || (response.data.type || 'unknown'),
          size: file.size,
          uploadedAt: new Date().toISOString(),
          cloudinaryId: response.data.cloudinary_id || response.data.public_id
        };
        
        setCurrentUpload(newFile);
        addLog(`File uploaded successfully: ${newFile.name}`);
        
        // Call the callback to notify parent component
        if (onUploadComplete) {
          onUploadComplete(response.data);
        }
      }
      
      // Clear the file input
      setFile(null);
      document.getElementById('event-file-input').value = '';
    } catch (err) {
      addLog(`ERROR: ${err.message}`);
      
      if (err.response) {
        addLog(`Response status: ${err.response.status}`);
        setError(`Upload failed: ${err.response.data.error || err.message}`);
      } else {
        setError(`Upload failed: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // Render a preview of the media based on its type
  const renderMediaPreview = (mediaItem) => {
    const url = mediaItem.url.startsWith('http') 
      ? mediaItem.url 
      : `${config.API_URL}${mediaItem.url}`;
    
    const isImage = mediaItem.type === 'image' || 
                   /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(url);
    
    const isVideo = mediaItem.type === 'video' || 
                   /\.(mp4|webm|ogg|mov|avi|wmv|flv|mkv)$/i.test(url);
    
    const isAudio = mediaItem.type === 'audio' || 
                   /\.(mp3|wav|ogg|aac|flac|m4a)$/i.test(url);

    if (isImage) {
      return (
        <CardMedia
          component="img"
          height="140"
          image={url}
          alt={mediaItem.name}
          sx={{ objectFit: 'contain', bgcolor: '#f5f5f5' }}
        />
      );
    } else if (isVideo) {
      return (
        <Box sx={{ height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#f5f5f5' }}>
          <video 
            controls 
            width="100%" 
            height="100%"
            style={{ maxHeight: '140px' }}
          >
            <source src={url} type={`video/${url.split('.').pop()}`} />
            Your browser does not support the video tag.
          </video>
        </Box>
      );
    } else if (isAudio) {
      return (
        <Box sx={{ height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#f5f5f5', p: 2 }}>
          <audio 
            controls 
            style={{ width: '100%' }}
          >
            <source src={url} type={`audio/${url.split('.').pop()}`} />
            Your browser does not support the audio element.
          </audio>
        </Box>
      );
    }

    // Default preview for other file types
    return (
      <Box 
        sx={{ 
          height: 140, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          bgcolor: '#f5f5f5'
        }}
      >
        <Typography variant="body2" color="text.secondary">
          File: {mediaItem.name}
        </Typography>
      </Box>
    );
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Media Uploader
      </Typography>
      <Typography variant="body2" paragraph color="text.secondary">
        Upload images, videos, and audio files for this event
      </Typography>
      
      <Divider sx={{ my: 2 }} />
      
      <Grid container spacing={3}>
        {/* Upload Section */}
        <Grid item xs={12} md={6}>
          <Paper variant="outlined" sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Upload New Media
            </Typography>
            
            <Box sx={{ mb: 3 }}>
              <input
                id="event-file-input"
                type="file"
                accept="image/*,video/*,audio/*"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
              <Button
                variant="outlined"
                component="label"
                htmlFor="event-file-input"
                startIcon={<CloudUploadIcon />}
                fullWidth
                sx={{ mb: 2 }}
              >
                Select File
              </Button>
              
              {file && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Selected: {file.name} ({file.type}, {(file.size / 1024).toFixed(2)} KB)
                </Typography>
              )}
            </Box>
            
            {file && (
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel id="media-type-label">Media Type</InputLabel>
                <Select
                  labelId="media-type-label"
                  value={mediaType}
                  label="Media Type"
                  onChange={handleMediaTypeChange}
                >
                  <MenuItem value="image">Image</MenuItem>
                  <MenuItem value="video">Video</MenuItem>
                  <MenuItem value="audio">Audio</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>
            )}
            
            <Button
              variant="contained"
              color="primary"
              startIcon={loading ? <CircularProgress size={24} color="inherit" /> : <CloudUploadIcon />}
              disabled={loading || !file}
              onClick={handleUpload}
              fullWidth
            >
              {loading ? 'Uploading...' : 'Tap to Upload'}
            </Button>
            
            {error && (
              <Typography color="error" sx={{ mt: 2 }}>
                {error}
              </Typography>
            )}
            
            {uploadResult && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Upload Successful!
                </Typography>
                <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                  URL: {uploadResult.url}
                </Typography>
              </Box>
            )}
          </Paper>
          
          {/* Logs Section */}
          <Paper variant="outlined" sx={{ p: 2, mt: 2, maxHeight: 150, overflow: 'auto' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="subtitle2">
                Upload Logs
              </Typography>
              <Button 
                size="small" 
                onClick={clearLogs} 
                disabled={logs.length === 0}
              >
                Clear
              </Button>
            </Box>
            <Box sx={{ 
              fontFamily: 'monospace', 
              fontSize: '0.75rem', 
              whiteSpace: 'pre-wrap',
              color: 'text.secondary'
            }}>
              {logs.length === 0 ? (
                <Typography variant="body2" color="text.disabled">
                  No logs yet. Select a file and upload to see logs.
                </Typography>
              ) : (
                logs.map((log, index) => (
                  <div key={index}>{log}</div>
                ))
              )}
            </Box>
          </Paper>
        </Grid>
        
        {/* Current Upload Section */}
        <Grid item xs={12} md={6}>
          <Paper variant="outlined" sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Uploaded Media File
              </Typography>
            </Box>
            
            {currentUpload ? (
              <Card variant="outlined">
                {renderMediaPreview(currentUpload)}
                <CardContent sx={{ py: 1 }}>
                  <Typography variant="subtitle2" noWrap title={currentUpload.name}>
                    {currentUpload.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {currentUpload.type} • {(currentUpload.size / 1024).toFixed(2)} KB
                  </Typography>
                </CardContent>
              </Card>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
                No media file uploaded yet for this event
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default EventMediaUploader;
