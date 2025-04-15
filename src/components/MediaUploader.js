import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Button, 
  Typography, 
  Paper, 
  CircularProgress, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemAvatar, 
  Avatar, 
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Card,
  CardMedia,
  CardContent,
  IconButton
} from '@mui/material';
import { 
  CloudUpload as CloudUploadIcon, 
  Image as ImageIcon, 
  Audiotrack as AudioIcon, 
  Videocam as VideoIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import axios from 'axios';
import config from '../config';

/**
 * A standalone component for uploading media files to Cloudinary
 * and displaying the uploaded files
 */
const MediaUploader = () => {
  const [file, setFile] = useState(null);
  const [mediaType, setMediaType] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [error, setError] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [fetchingFiles, setFetchingFiles] = useState(false);
  const [logs, setLogs] = useState([]);

  // Add a log entry with timestamp
  const addLog = (message) => {
    console.log(`MediaUploader: ${message}`);
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

    addLog(`Starting upload to /api/upload-media...`);
    addLog(`File: ${file.name} (${file.type}, ${(file.size / 1024).toFixed(2)} KB)`);
    addLog(`Media type: ${mediaType}`);
    addLog(`API URL: ${config.API_URL}`);

    try {
      // Log all request details for debugging
      addLog(`Request URL: ${config.API_URL}/api/upload-media`);
      addLog(`Request method: POST`);
      addLog(`Request headers: Content-Type: multipart/form-data`);
      
      const response = await axios.post(`${config.API_URL}/api/upload-media`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        timeout: 30000
      });

      addLog(`Upload successful! Status: ${response.status}`);
      addLog(`Response data: ${JSON.stringify(response.data)}`);

      setUploadResult(response.data);
      
      // Add to uploaded files list
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
        
        setUploadedFiles(prev => [newFile, ...prev]);
        addLog(`Added to uploaded files list: ${newFile.name}`);
      }
      
      // Clear the file input
      setFile(null);
      document.getElementById('file-input').value = '';
    } catch (err) {
      addLog(`ERROR: ${err.message}`);
      
      if (err.response) {
        addLog(`Response status: ${err.response.status}`);
        addLog(`Response data: ${JSON.stringify(err.response.data)}`);
        setError(`Upload failed: ${err.response.data.error || err.message}`);
      } else {
        setError(`Upload failed: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch uploaded files from the server
  const fetchUploadedFiles = async () => {
    setFetchingFiles(true);
    addLog('Fetching uploaded files...');
    
    try {
      // This endpoint doesn't exist yet - we'll need to create it
      const response = await axios.get(`${config.API_URL}/api/media-files`);
      
      if (response.data && Array.isArray(response.data)) {
        setUploadedFiles(response.data);
        addLog(`Fetched ${response.data.length} files`);
      } else {
        addLog('No files found or invalid response format');
        setUploadedFiles([]);
      }
    } catch (err) {
      addLog(`Error fetching files: ${err.message}`);
      // If the endpoint doesn't exist yet, we'll just use our local state
      addLog('Using local state for uploaded files');
    } finally {
      setFetchingFiles(false);
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
          <AudioIcon sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
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

  // Load uploaded files when component mounts
  useEffect(() => {
    fetchUploadedFiles();
  }, []);

  return (
    <Paper sx={{ p: 3, mb: 4 }}>
      <Typography variant="h5" gutterBottom>
        Media Uploader
      </Typography>
      <Typography variant="body2" paragraph color="text.secondary">
        Upload images, videos, and audio files to the timeline media library
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
                id="file-input"
                type="file"
                accept="image/*,video/*,audio/*"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
              <Button
                variant="outlined"
                component="label"
                htmlFor="file-input"
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
              {loading ? 'Uploading...' : 'Upload to Cloudinary'}
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
          <Paper variant="outlined" sx={{ p: 2, mt: 2, maxHeight: 200, overflow: 'auto' }}>
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
        
        {/* Uploaded Files Section */}
        <Grid item xs={12} md={6}>
          <Paper variant="outlined" sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Uploaded Media Files
              </Typography>
              <Button 
                startIcon={<RefreshIcon />}
                size="small"
                onClick={fetchUploadedFiles}
                disabled={fetchingFiles}
              >
                Refresh
              </Button>
            </Box>
            
            {fetchingFiles ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress size={40} />
              </Box>
            ) : uploadedFiles.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
                No media files uploaded yet
              </Typography>
            ) : (
              <Grid container spacing={2}>
                {uploadedFiles.map((item) => (
                  <Grid item xs={12} sm={6} key={item.id || item.url}>
                    <Card variant="outlined">
                      {renderMediaPreview(item)}
                      <CardContent sx={{ py: 1 }}>
                        <Typography variant="subtitle2" noWrap title={item.name}>
                          {item.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {item.type} • {(item.size / 1024).toFixed(2)} KB
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default MediaUploader;
