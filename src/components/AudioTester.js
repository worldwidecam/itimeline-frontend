import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Button, 
  CircularProgress,
  Divider,
  Grid,
  Card,
  CardContent
} from '@mui/material';
import { 
  CloudUpload as CloudUploadIcon, 
  Audiotrack as AudioIcon
} from '@mui/icons-material';
import axios from 'axios';
import config from '../config';
import AudioWaveformVisualizer from './AudioWaveformVisualizer';

/**
 * A component for testing audio uploads and visualization
 * This is a simplified version of MediaUploader focused only on audio
 */
const AudioTester = () => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [error, setError] = useState(null);
  const [cloudinaryFiles, setCloudinaryFiles] = useState([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [selectedCloudinaryFile, setSelectedCloudinaryFile] = useState(null);
  const [logs, setLogs] = useState([]);

  // Fetch audio files from Cloudinary when component mounts
  useEffect(() => {
    fetchCloudinaryAudioFiles();
  }, []);

  // Fetch audio files from Cloudinary
  const fetchCloudinaryAudioFiles = async () => {
    setLoadingFiles(true);
    addLog('Fetching audio files from Cloudinary...');
    
    try {
      const response = await axios.get(`${config.API_URL}/api/cloudinary/audio-files`);
      
      if (response.data.success) {
        setCloudinaryFiles(response.data.files);
        addLog(`Successfully loaded ${response.data.files.length} audio files from Cloudinary`);
      } else {
        addLog(`Error fetching audio files: ${response.data.error}`);
      }
    } catch (err) {
      addLog(`Error fetching audio files: ${err.message}`);
      console.error('Error fetching Cloudinary audio files:', err);
    } finally {
      setLoadingFiles(false);
    }
  };

  // Select a Cloudinary file to play
  const handleSelectCloudinaryFile = (file) => {
    setSelectedCloudinaryFile(file);
    setUploadResult(null); // Clear any uploaded file result
    addLog(`Selected existing file: ${file.filename}`);
  };

  // Add a log entry with timestamp
  const addLog = (message) => {
    console.log(`AudioTester: ${message}`);
    setLogs(prev => [...prev, `${new Date().toISOString().split('T')[1].split('.')[0]} - ${message}`]);
  };

  // Handle file selection
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      
      // Check if it's an audio file
      if (!selectedFile.type.startsWith('audio/')) {
        setError('Please select an audio file');
        return;
      }
      
      setFile(selectedFile);
      setError(null);
      addLog(`Audio file selected: ${selectedFile.name} (${selectedFile.type}, ${(selectedFile.size / 1024).toFixed(2)} KB)`);
    }
  };

  // Upload the file to Cloudinary
  const handleUpload = async () => {
    if (!file) {
      setError('Please select an audio file first');
      return;
    }

    setUploading(true);
    setError(null);
    setUploadResult(null);
    setSelectedCloudinaryFile(null); // Clear any selected Cloudinary file

    const formData = new FormData();
    formData.append('file', file);
    formData.append('media_type', 'audio'); // Explicitly set media type to audio

    addLog(`Starting upload to /api/upload-media...`);
    addLog(`File: ${file.name} (${file.type}, ${(file.size / 1024).toFixed(2)} KB)`);
    addLog(`Media type: audio`);

    try {
      // Add detailed metadata to help with audio file processing
      formData.append('media_subtype', 'audio');
      formData.append('preserve_audio_metadata', 'true');
      
      const response = await axios.post(`${config.API_URL}/api/upload-media`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        timeout: 30000
      });

      addLog(`Upload successful! Status: ${response.status}`);
      addLog(`Response data: ${JSON.stringify(response.data)}`);

      setUploadResult(response.data);
      
      // Clear the file input
      document.getElementById('audio-file-input').value = '';
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
      setUploading(false);
    }
  };

  return (
    <Paper sx={{ p: 3, mb: 4 }}>
      <Typography variant="h5" gutterBottom>
        Audio Tester
      </Typography>
      <Typography variant="body2" paragraph color="text.secondary">
        Test audio file uploads and visualization
      </Typography>
      
      <Divider sx={{ my: 2 }} />
      
      <Grid container spacing={3}>
        {/* Upload Section */}
        <Grid item xs={12} md={6}>
          <Paper variant="outlined" sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Upload Audio File
            </Typography>
            
            <Box sx={{ mb: 3 }}>
              <input
                id="audio-file-input"
                type="file"
                accept="audio/*"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
              <Button
                variant="outlined"
                component="label"
                htmlFor="audio-file-input"
                startIcon={<CloudUploadIcon />}
                fullWidth
                sx={{ mb: 2 }}
              >
                Select Audio File
              </Button>
              
              {file && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Selected: {file.name} ({file.type}, {(file.size / 1024).toFixed(2)} KB)
                </Typography>
              )}
            </Box>
            
            <Button
              variant="contained"
              color="primary"
              startIcon={uploading ? <CircularProgress size={24} color="inherit" /> : <CloudUploadIcon />}
              disabled={uploading || !file}
              onClick={handleUpload}
              fullWidth
            >
              {uploading ? 'Uploading...' : 'Upload Audio'}
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
          
          {/* Logs */}
          <Paper variant="outlined" sx={{ p: 2, mt: 2, maxHeight: 200, overflow: 'auto' }}>
            <Typography variant="subtitle2" gutterBottom>
              Upload Logs
            </Typography>
            {logs.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No logs yet
              </Typography>
            ) : (
              logs.map((log, index) => (
                <Typography key={index} variant="body2" sx={{ fontSize: '0.8rem', mb: 0.5 }}>
                  {log}
                </Typography>
              ))
            )}
          </Paper>
        </Grid>
        
        {/* Visualizer Section */}
        <Grid item xs={12} md={6}>
          {uploadResult ? (
            <AudioWaveformVisualizer 
              audioUrl={uploadResult.url} 
              title={file ? file.name : 'Uploaded Audio'}
            />
          ) : selectedCloudinaryFile ? (
            <AudioWaveformVisualizer 
              audioUrl={selectedCloudinaryFile.url} 
              title={selectedCloudinaryFile.filename}
            />
          ) : (
            <Card sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <AudioIcon sx={{ fontSize: 60, color: 'primary.main', opacity: 0.6, mb: 2 }} />
                <Typography variant="body1">
                  Upload an audio file to see the visualizer
                </Typography>
              </CardContent>
            </Card>
          )}
        </Grid>
        
        {/* Cloudinary Files Section */}
        <Grid item xs={12} md={6}>
          <Paper variant="outlined" sx={{ p: 2, mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Existing Audio Files
              <Button 
                size="small" 
                onClick={fetchCloudinaryAudioFiles} 
                disabled={loadingFiles}
                sx={{ ml: 2 }}
              >
                {loadingFiles ? 'Refreshing...' : 'Refresh'}
              </Button>
            </Typography>
            
            {loadingFiles ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                <CircularProgress size={24} />
              </Box>
            ) : cloudinaryFiles.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No audio files found in Cloudinary
              </Typography>
            ) : (
              <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                {cloudinaryFiles.map((cloudFile) => (
                  <Box 
                    key={cloudFile.public_id}
                    sx={{
                      p: 1,
                      mb: 1,
                      border: '1px solid',
                      borderColor: selectedCloudinaryFile?.public_id === cloudFile.public_id ? 'primary.main' : 'divider',
                      borderRadius: 1,
                      cursor: 'pointer',
                      '&:hover': { bgcolor: 'action.hover' },
                      bgcolor: selectedCloudinaryFile?.public_id === cloudFile.public_id ? 'action.selected' : 'background.paper'
                    }}
                    onClick={() => handleSelectCloudinaryFile(cloudFile)}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <AudioIcon sx={{ mr: 1, color: 'primary.main' }} />
                      <Box>
                        <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                          {cloudFile.filename || 'Unnamed Audio'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {cloudFile.format} • {(cloudFile.bytes / 1024).toFixed(2)} KB
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                ))}
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default AudioTester;
