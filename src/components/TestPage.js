import React, { useState } from 'react';
import { Container, Typography, Box, Button, CircularProgress, Paper } from '@mui/material';
import axios from 'axios';
import config from '../config';

/**
 * A simple test page to diagnose media upload issues
 */
const TestPage = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [error, setError] = useState(null);
  const [logs, setLogs] = useState([]);

  const addLog = (message) => {
    console.log(message);
    setLogs(prev => [...prev, `${new Date().toISOString().split('T')[1].split('.')[0]} - ${message}`]);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      addLog(`File selected: ${selectedFile.name} (${selectedFile.type}, ${(selectedFile.size / 1024).toFixed(2)} KB)`);
    }
  };

  const handleUpload = async (endpoint) => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    setLoading(true);
    setError(null);
    setUploadResult(null);

    const formData = new FormData();
    formData.append('file', file);

    addLog(`Starting upload to ${endpoint}...`);
    addLog(`API URL: ${config.API_URL}`);

    try {
      const response = await axios.post(`${config.API_URL}${endpoint}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        timeout: 30000
      });

      addLog(`Upload successful! Status: ${response.status}`);
      addLog(`Response data: ${JSON.stringify(response.data)}`);

      setUploadResult(response.data);
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

  const renderMediaPreview = () => {
    if (!uploadResult || !uploadResult.url) return null;

    const url = uploadResult.url.startsWith('http') 
      ? uploadResult.url 
      : `${config.API_URL}${uploadResult.url}`;

    addLog(`Rendering preview for URL: ${url}`);

    const isImage = /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(url) || 
                   (uploadResult.type && uploadResult.type.startsWith('image/'));
    
    const isVideo = /\.(mp4|webm|ogg|mov|avi|wmv|flv|mkv)$/i.test(url) || 
                   (uploadResult.type && uploadResult.type.startsWith('video/'));
    
    const isAudio = /\.(mp3|wav|ogg|aac|flac|m4a)$/i.test(url) || 
                   (uploadResult.type && uploadResult.type.startsWith('audio/'));

    if (isImage) {
      return (
        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Typography variant="subtitle1" gutterBottom>Image Preview:</Typography>
          <img 
            src={url} 
            alt="Uploaded file" 
            style={{ maxWidth: '100%', maxHeight: 300 }} 
          />
        </Box>
      );
    } else if (isVideo) {
      return (
        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Typography variant="subtitle1" gutterBottom>Video Preview:</Typography>
          <video 
            controls 
            style={{ maxWidth: '100%', maxHeight: 300 }}
          >
            <source src={url} type={uploadResult.type || 'video/mp4'} />
            Your browser does not support the video tag.
          </video>
        </Box>
      );
    } else if (isAudio) {
      return (
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle1" gutterBottom>Audio Preview:</Typography>
          <audio 
            controls 
            style={{ width: '100%' }}
          >
            <source src={url} type={uploadResult.type || 'audio/mpeg'} />
            Your browser does not support the audio element.
          </audio>
        </Box>
      );
    }

    return (
      <Box sx={{ mt: 2 }}>
        <Typography variant="subtitle1">
          File uploaded: <a href={url} target="_blank" rel="noopener noreferrer">{uploadResult.filename || 'View file'}</a>
        </Typography>
      </Box>
    );
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Media Upload Test Page
      </Typography>
      <Typography variant="body1" paragraph>
        This page helps diagnose issues with media uploads in the iTimeline application.
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Step 1: Select a media file
        </Typography>
        <input
          type="file"
          accept="image/*,video/*,audio/*"
          onChange={handleFileChange}
          style={{ marginBottom: 16 }}
        />
        {file && (
          <Typography variant="body2">
            Selected: {file.name} ({file.type}, {(file.size / 1024).toFixed(2)} KB)
          </Typography>
        )}
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Step 2: Test upload endpoints
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            color="primary"
            disabled={loading || !file}
            onClick={() => handleUpload('/api/upload')}
          >
            {loading ? <CircularProgress size={24} /> : 'Test /api/upload endpoint'}
          </Button>
          <Button
            variant="contained"
            color="secondary"
            disabled={loading || !file}
            onClick={() => handleUpload('/api/upload-media')}
          >
            {loading ? <CircularProgress size={24} /> : 'Test /api/upload-media endpoint'}
          </Button>
        </Box>
      </Paper>

      {error && (
        <Paper sx={{ p: 2, mb: 3, bgcolor: '#ffebee' }}>
          <Typography color="error">{error}</Typography>
        </Paper>
      )}

      {uploadResult && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Upload Result
          </Typography>
          <Box component="pre" sx={{ 
            p: 2, 
            bgcolor: '#f5f5f5', 
            borderRadius: 1,
            overflow: 'auto',
            maxHeight: 200
          }}>
            {JSON.stringify(uploadResult, null, 2)}
          </Box>
          {renderMediaPreview()}
        </Paper>
      )}

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Logs
        </Typography>
        <Box sx={{ 
          p: 2, 
          bgcolor: '#f5f5f5', 
          borderRadius: 1,
          fontFamily: 'monospace',
          fontSize: '0.8rem',
          maxHeight: 300,
          overflow: 'auto'
        }}>
          {logs.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No logs yet. Select a file and try uploading.
            </Typography>
          ) : (
            logs.map((log, index) => (
              <div key={index}>{log}</div>
            ))
          )}
        </Box>
      </Paper>
    </Container>
  );
};

export default TestPage;
