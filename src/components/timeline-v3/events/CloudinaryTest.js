import React, { useState } from 'react';
import { Box, Button, Typography, CircularProgress, Paper, Alert } from '@mui/material';
import { useDropzone } from 'react-dropzone';
import api from '../../../utils/api';

/**
 * A dedicated component for testing Cloudinary uploads
 * This component can be embedded in the EventForm to test media uploads
 */
const CloudinaryTest = ({ onUploadSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [logs, setLogs] = useState([]);

  const addLog = (message) => {
    setLogs(prev => [...prev, `${new Date().toISOString().split('T')[1].split('.')[0]} - ${message}`]);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: async (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0];
        addLog(`File selected: ${file.name} (${file.type}, ${(file.size / 1024).toFixed(2)} KB)`);
        
        const formData = new FormData();
        formData.append('file', file);
        
        try {
          setLoading(true);
          setError('');
          addLog('Starting upload to Cloudinary...');
          
          // Direct upload to Cloudinary via the backend
          const response = await api.post('/api/upload', formData, {
            headers: {
              'Content-Type': 'multipart/form-data'
            },
            timeout: 30000
          });
          
          addLog(`Upload successful! Response status: ${response.status}`);
          addLog(`URL: ${response.data.url}`);
          
          const uploadResult = {
            url: response.data.url,
            type: response.data.type || file.type,
            name: file.name,
            publicId: response.data.public_id
          };
          
          setUploadedFile(uploadResult);
          setLoading(false);
          
          // Call the callback with the upload result
          if (onUploadSuccess) {
            onUploadSuccess(uploadResult);
          }
        } catch (error) {
          addLog(`ERROR: ${error.message}`);
          if (error.response) {
            addLog(`Response status: ${error.response.status}`);
            addLog(`Response data: ${JSON.stringify(error.response.data)}`);
          }
          setError(`Upload failed: ${error.message}`);
          setLoading(false);
        }
      }
    },
    accept: {
      'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg'],
      'video/*': ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.wmv', '.flv', '.mkv'],
      'audio/*': ['.mp3', '.wav', '.ogg', '.aac', '.flac', '.m4a']
    },
    maxSize: 20 * 1024 * 1024,
    multiple: false
  });

  const renderMedia = () => {
    if (!uploadedFile) return null;
    
    if (uploadedFile.type.startsWith('image/')) {
      return (
        <img 
          src={uploadedFile.url} 
          alt={uploadedFile.name}
          style={{ maxWidth: '100%', maxHeight: '200px' }}
        />
      );
    } else if (uploadedFile.type.startsWith('video/')) {
      return (
        <video controls style={{ maxWidth: '100%', maxHeight: '200px' }}>
          <source src={uploadedFile.url} type={uploadedFile.type} />
          Your browser does not support video playback.
        </video>
      );
    } else if (uploadedFile.type.startsWith('audio/')) {
      return (
        <audio controls style={{ width: '100%' }}>
          <source src={uploadedFile.url} type={uploadedFile.type} />
          Your browser does not support audio playback.
        </audio>
      );
    }
    
    return (
      <Typography>
        File uploaded: <a href={uploadedFile.url} target="_blank" rel="noopener noreferrer">{uploadedFile.name}</a>
      </Typography>
    );
  };

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Typography variant="h6" gutterBottom>
        Cloudinary Upload Test
      </Typography>
      
      <Box
        {...getRootProps()}
        sx={{
          border: '2px dashed #ccc',
          borderRadius: 2,
          p: 3,
          mb: 2,
          textAlign: 'center',
          cursor: 'pointer',
          bgcolor: isDragActive ? 'rgba(0, 0, 0, 0.05)' : 'transparent',
          '&:hover': {
            bgcolor: 'rgba(0, 0, 0, 0.05)'
          }
        }}
      >
        <input {...getInputProps()} />
        {loading ? (
          <CircularProgress size={24} />
        ) : (
          <Typography>
            Drag and drop a file here, or click to select a file
          </Typography>
        )}
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {uploadedFile && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Uploaded File
          </Typography>
          {renderMedia()}
          <Typography variant="body2" sx={{ mt: 1 }}>
            URL: {uploadedFile.url}
          </Typography>
        </Box>
      )}
      
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          Logs
        </Typography>
        <Box 
          sx={{ 
            bgcolor: '#f5f5f5', 
            p: 2, 
            borderRadius: 1,
            maxHeight: '150px',
            overflow: 'auto',
            fontFamily: 'monospace',
            fontSize: '0.8rem'
          }}
        >
          {logs.map((log, index) => (
            <div key={index}>{log}</div>
          ))}
        </Box>
      </Box>
    </Paper>
  );
};

export default CloudinaryTest;
