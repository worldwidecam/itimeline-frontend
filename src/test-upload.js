import React, { useState } from 'react';
import axios from 'axios';
import { Box, Button, Typography, CircularProgress, Paper } from '@mui/material';

/**
 * Simple component to test file uploads to the backend
 */
const TestUpload = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [logs, setLogs] = useState([]);

  const addLog = (message) => {
    setLogs(prev => [...prev, `${new Date().toISOString().split('T')[1].split('.')[0]} - ${message}`]);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      addLog(`Selected file: ${e.target.files[0].name} (${e.target.files[0].type})`);
    }
  };

  const handleUpload = async (endpoint) => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    
    const formData = new FormData();
    formData.append('file', file);
    
    addLog(`Starting upload to ${endpoint}...`);
    
    try {
      // Get the API URL from the environment or use a default
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const url = `${apiUrl}${endpoint}`;
      
      addLog(`Full URL: ${url}`);
      
      const response = await axios.post(url, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        timeout: 30000
      });
      
      addLog(`Upload successful! Status: ${response.status}`);
      addLog(`Response data: ${JSON.stringify(response.data)}`);
      
      setResult(response.data);
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

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      <Typography variant="h4" gutterBottom>
        File Upload Test
      </Typography>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          1. Select a file
        </Typography>
        
        <input
          type="file"
          onChange={handleFileChange}
          style={{ marginBottom: 16 }}
        />
        
        {file && (
          <Typography variant="body2" sx={{ mb: 2 }}>
            Selected file: {file.name} ({file.type}, {(file.size / 1024).toFixed(2)} KB)
          </Typography>
        )}
        
        <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
          2. Choose upload endpoint
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <Button 
            variant="contained" 
            color="primary"
            onClick={() => handleUpload('/api/upload')}
            disabled={loading || !file}
          >
            {loading ? <CircularProgress size={24} /> : 'Upload to /api/upload'}
          </Button>
          
          <Button 
            variant="contained" 
            color="secondary"
            onClick={() => handleUpload('/api/upload-media')}
            disabled={loading || !file}
          >
            {loading ? <CircularProgress size={24} /> : 'Upload to /api/upload-media'}
          </Button>
        </Box>
      </Paper>
      
      {error && (
        <Paper sx={{ p: 2, mb: 3, bgcolor: '#ffebee' }}>
          <Typography color="error">{error}</Typography>
        </Paper>
      )}
      
      {result && (
        <Paper sx={{ p: 2, mb: 3 }}>
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
            {JSON.stringify(result, null, 2)}
          </Box>
          
          {result.url && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                URL: {result.url}
              </Typography>
              
              {result.url.match(/\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i) && (
                <Box sx={{ mt: 1, textAlign: 'center' }}>
                  <img 
                    src={result.url.startsWith('http') ? result.url : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${result.url}`} 
                    alt="Uploaded file" 
                    style={{ maxWidth: '100%', maxHeight: 300 }} 
                  />
                </Box>
              )}
            </Box>
          )}
        </Paper>
      )}
      
      <Paper sx={{ p: 2 }}>
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
    </Box>
  );
};

export default TestUpload;
