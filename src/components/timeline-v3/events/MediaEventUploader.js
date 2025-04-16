import React, { useState } from 'react';
import { 
  Box, 
  Button, 
  Typography, 
  Paper, 
  CircularProgress, 
  IconButton
} from '@mui/material';
import { 
  CloudUpload as CloudUploadIcon, 
  Delete as DeleteIcon
} from '@mui/icons-material';
import axios from 'axios';
import config from '../../../config';

/**
 * A simplified media uploader component for EventForm
 * Based on the working MediaUploader component
 */
const MediaEventUploader = ({ onUploadSuccess }) => {
  const [file, setFile] = useState(null);
  const [mediaType, setMediaType] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [uploadResult, setUploadResult] = useState(null);
  const [logs, setLogs] = useState([]);

  // Add a log entry with timestamp
  const addLog = (message) => {
    console.log(`MediaEventUploader: ${message}`);
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
      
      // Auto-upload the file when selected
      uploadFile(selectedFile);
    }
  };

  // Upload the file to Cloudinary
  const uploadFile = async (fileToUpload) => {
    if (!fileToUpload) {
      setError('No file selected');
      return;
    }

    setLoading(true);
    setError(null);
    setUploadResult(null);
    clearLogs();

    const formData = new FormData();
    formData.append('file', fileToUpload);
    formData.append('media_type', mediaType); // Add media type to the form data

    addLog(`Starting upload to /api/upload-media...`);
    addLog(`File: ${fileToUpload.name} (${fileToUpload.type}, ${(fileToUpload.size / 1024).toFixed(2)} KB)`);
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
      
      // Process the upload result
      if (response.data && response.data.url) {
        const mediaUrl = response.data.url;
        
        // Determine if this is a Cloudinary URL
        const isCloudinaryUrl = mediaUrl.includes('cloudinary.com') || 
                               mediaUrl.includes('res.cloudinary') ||
                               (response.data.storage === 'cloudinary');
        
        // Ensure we have the complete URL
        let finalMediaUrl = mediaUrl;
        if (!finalMediaUrl.startsWith('http') && isCloudinaryUrl) {
          const cloudName = 'dnjwvuxn7';
          finalMediaUrl = `https://res.cloudinary.com/${cloudName}/image/upload/${finalMediaUrl}`;
          addLog(`Fixed Cloudinary URL: ${finalMediaUrl}`);
        }
        
        // Store the Cloudinary ID if available
        const cloudinaryId = response.data.cloudinary_id || response.data.public_id || '';
        
        // Create the result object
        const uploadResult = {
          url: finalMediaUrl,
          type: fileToUpload.type,
          name: fileToUpload.name,
          size: fileToUpload.size,
          cloudinary_id: cloudinaryId
        };
        
        addLog(`Upload complete: ${uploadResult.url}`);
        
        // Call the callback with the result
        if (onUploadSuccess && typeof onUploadSuccess === 'function') {
          onUploadSuccess(uploadResult);
        }
      }
      
      // Clear the file input
      setFile(null);
      document.getElementById('media-event-file-input').value = '';
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

  // Render a preview of the media based on its type
  const renderMediaPreview = (mediaUrl, mediaType) => {
    if (!mediaUrl) return null;
    
    const url = mediaUrl.startsWith('http') 
      ? mediaUrl 
      : `${config.API_URL}${mediaUrl}`;
    
    const isImage = mediaType.startsWith('image/') || 
                   /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(url);
    
    const isVideo = mediaType.startsWith('video/') || 
                   /\.(mp4|webm|ogg|mov|avi|wmv|flv|mkv)$/i.test(url);
    
    const isAudio = mediaType.startsWith('audio/') || 
                   /\.(mp3|wav|ogg|aac|flac|m4a)$/i.test(url);

    if (isImage) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <img 
            src={url} 
            alt="Media preview" 
            style={{ 
              maxWidth: '100%', 
              maxHeight: '200px',
              objectFit: 'contain',
              borderRadius: 4
            }} 
          />
        </Box>
      );
    } else if (isVideo) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <video
            controls
            style={{ 
              maxWidth: '100%', 
              maxHeight: '200px',
              borderRadius: 4
            }}
          >
            <source src={url} type={mediaType || "video/mp4"} />
            Your browser does not support the video tag.
          </video>
        </Box>
      );
    } else if (isAudio) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <audio
            controls
            style={{ width: '100%' }}
          >
            <source src={url} type={mediaType || "audio/mpeg"} />
            Your browser does not support the audio element.
          </audio>
        </Box>
      );
    }

    // Default preview for other file types
    return (
      <Box sx={{ textAlign: 'center', my: 2 }}>
        <Typography variant="body2" color="text.secondary">
          File uploaded: {url}
        </Typography>
      </Box>
    );
  };

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Typography variant="subtitle2" gutterBottom>
        Upload Media File
      </Typography>
      
      {/* File Input */}
      <Box sx={{ mb: 3 }}>
        <input
          id="media-event-file-input"
          type="file"
          accept="image/*,video/*,audio/*"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
        <Button
          variant="outlined"
          component="label"
          htmlFor="media-event-file-input"
          startIcon={loading ? <CircularProgress size={24} /> : <CloudUploadIcon />}
          fullWidth
          sx={{ mb: 2 }}
          disabled={loading}
        >
          {loading ? 'Uploading...' : 'Select Media File'}
        </Button>
      </Box>
      
      {/* Error Message */}
      {error && (
        <Typography color="error" sx={{ mt: 2 }}>
          {error}
        </Typography>
      )}
      
      {/* Upload Result */}
      {uploadResult && uploadResult.url && (
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
              onClick={() => {
                setUploadResult(null);
                if (onUploadSuccess) {
                  onUploadSuccess(null);
                }
              }}
            >
              <DeleteIcon />
            </IconButton>
          </Box>
          
          {renderMediaPreview(uploadResult.url, uploadResult.type || file?.type)}
          
          <Typography variant="body2" sx={{ mt: 2 }}>
            File URL: {uploadResult.url}
          </Typography>
          {uploadResult.cloudinary_id && (
            <Typography variant="body2" color="text.secondary">
              Cloudinary ID: {uploadResult.cloudinary_id}
            </Typography>
          )}
        </Box>
      )}
      
      {/* Upload Logs */}
      <Paper variant="outlined" sx={{ p: 2, mt: 2, maxHeight: 150, overflow: 'auto' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="caption">
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
              No logs yet. Select a file to see upload logs.
            </Typography>
          ) : (
            logs.map((log, index) => (
              <div key={index}>{log}</div>
            ))
          )}
        </Box>
      </Paper>
    </Paper>
  );
};

export default MediaEventUploader;
