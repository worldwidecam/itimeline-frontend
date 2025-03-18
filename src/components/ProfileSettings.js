import React, { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Avatar,
  Divider,
  Alert,
  Snackbar,
  Switch,
  FormControlLabel,
  LinearProgress,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import PhotoCamera from '@mui/icons-material/PhotoCamera';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import AudioFileIcon from '@mui/icons-material/AudioFile';
import InfoIcon from '@mui/icons-material/Info';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import MusicPlayer from './MusicPlayer';
import { useDropzone } from 'react-dropzone';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_AUDIO_SIZE = 10 * 1024 * 1024; // 10MB

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const ProfileSettings = () => {
  const { user, updateProfile } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const [formData, setFormData] = useState({
    email: user?.email || '',
    username: user?.username || '',
    bio: user?.bio || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(user?.avatar_url || '');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [musicData, setMusicData] = useState({
    music_url: '',
    music_platform: 'youtube'
  });
  const [musicFile, setMusicFile] = useState(null);
  const [musicPreview, setMusicPreview] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [dragState, setDragState] = useState({ avatar: false, music: false });
  const [fileInfo, setFileInfo] = useState({ avatar: null, music: null });

  useEffect(() => {
    const fetchMusicPreferences = async () => {
      try {
        const response = await api.get('/api/profile/music');
        if (response.data.music_url) {
          setMusicData(response.data);
        }
      } catch (error) {
        console.error('Error fetching music preferences:', error);
      }
    };

    if (user) {
      fetchMusicPreferences();
    }
  }, [user]);

  const handleThemeChange = (event) => {
    toggleTheme();
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const onDrop = useCallback((acceptedFiles, type) => {
    const file = acceptedFiles[0];
    if (!file) return;

    const fileSize = file.size;
    const maxSize = type === 'avatar' ? MAX_FILE_SIZE : MAX_AUDIO_SIZE;
    
    setFileInfo(prev => ({
      ...prev,
      [type]: {
        name: file.name,
        size: formatFileSize(fileSize),
        type: file.type
      }
    }));

    if (fileSize > maxSize) {
      setError(`File size exceeds ${formatFileSize(maxSize)}`);
      return;
    }

    if (type === 'avatar') {
      if (!file.type.startsWith('image/')) {
        setError('Please upload an image file (PNG, JPG, JPEG, GIF)');
        return;
      }
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    } else if (type === 'music') {
      if (!file.type.startsWith('audio/')) {
        setError('Please upload an audio file (MP3, WAV, or OGG)');
        return;
      }
      setMusicFile(file);
      setMusicPreview(URL.createObjectURL(file));
    }
  }, []);

  const { getRootProps: getAvatarRootProps, getInputProps: getAvatarInputProps } = useDropzone({
    onDrop: (files) => onDrop(files, 'avatar'),
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif']
    },
    multiple: false,
    onDragEnter: () => setDragState(prev => ({ ...prev, avatar: true })),
    onDragLeave: () => setDragState(prev => ({ ...prev, avatar: false })),
    onDropAccepted: () => setDragState(prev => ({ ...prev, avatar: false })),
  });

  const { getRootProps: getMusicRootProps, getInputProps: getMusicInputProps } = useDropzone({
    onDrop: (files) => onDrop(files, 'music'),
    accept: {
      'audio/*': ['.mp3', '.wav', '.ogg']
    },
    multiple: false,
    onDragEnter: () => setDragState(prev => ({ ...prev, music: true })),
    onDragLeave: () => setDragState(prev => ({ ...prev, music: false })),
    onDropAccepted: () => setDragState(prev => ({ ...prev, music: false })),
  });

  const handleMusicChange = (e) => {
    const { name, value } = e.target;
    setMusicData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsUploading(true);
    setUploadProgress(0);

    try {
      const submitData = new FormData();
      submitData.append('username', formData.username);
      submitData.append('email', formData.email);
      submitData.append('bio', formData.bio);
      
      if (selectedFile) {
        submitData.append('avatar', selectedFile);
      }

      if (formData.currentPassword && formData.newPassword) {
        if (formData.newPassword !== formData.confirmPassword) {
          setError('New passwords do not match');
          setIsUploading(false);
          return;
        }
        submitData.append('current_password', formData.currentPassword);
        submitData.append('new_password', formData.newPassword);
      }

      console.log('Submitting profile update with data:', submitData);
      console.log('Current user:', user);

      const response = await api.post(
        '/api/profile/update',
        submitData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          },
          onUploadProgress: (progressEvent) => {
            const progress = (progressEvent.loaded / progressEvent.total) * 100;
            setUploadProgress(progress);
          }
        }
      );
      console.log('Profile update response:', response.data);

      if (updateProfile) {
        try {
          // Update the user data in the auth context
          await updateProfile(response.data);
          setSuccess('Profile updated successfully');
          
          // Don't reload the page, just update the UI
          // This prevents the token refresh issues that cause logout
          setPreviewUrl(response.data.avatar_url);
        } catch (updateError) {
          console.error('Error updating profile in context:', updateError);
          // Even if context update fails, we still have the updated data from the API
          setSuccess('Profile updated successfully, but there was an issue refreshing the page data');
        }
      } else {
        setSuccess('Profile updated successfully');
        setPreviewUrl(response.data.avatar_url);
      }
    } catch (err) {
      console.error('Profile update error:', err);
      setError(err.response?.data?.error || err.message || 'Failed to update profile');
    } finally {
      setIsUploading(false);
    }
  };

  const handleMusicSubmit = async (e) => {
    if (e) e.preventDefault();
    
    if (!musicFile) {
      setError('Please select a music file to upload');
      return;
    }
    
    setError('');
    setSuccess('');
    setIsUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('music', musicFile);

      const response = await api.post(
        '/api/profile/music',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          },
          onUploadProgress: (progressEvent) => {
            const progress = (progressEvent.loaded / progressEvent.total) * 100;
            setUploadProgress(progress);
          }
        }
      );
      console.log('Music update response:', response.data);
      setSuccess('Music updated successfully');
      setMusicData(response.data);
      // Clear the file input
      setMusicFile(null);
      setFileInfo(prev => ({ ...prev, music: null }));
    } catch (error) {
      console.error('Music update error:', error);
      setError(error.response?.data?.error || 'Failed to update music');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Container maxWidth="md">
      <Paper sx={{ p: 4, mt: 4 }}>
        <Typography variant="h4" gutterBottom>
          Profile Settings
        </Typography>

        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1,
          mb: 3,
          p: 2,
          bgcolor: theme => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
          borderRadius: 2,
          transition: 'background-color 0.3s ease'
        }}>
          <FormControlLabel
            control={
              <Switch
                checked={isDarkMode}
                onChange={toggleTheme}
                sx={{
                  '& .MuiSwitch-switchBase': {
                    '&.Mui-checked': {
                      color: '#90caf9',
                      '& + .MuiSwitch-track': {
                        backgroundColor: '#90caf9',
                      },
                    },
                  },
                  '& .MuiSwitch-thumb': {
                    backgroundColor: isDarkMode ? '#90caf9' : '#f4b942',
                  },
                  '& .MuiSwitch-track': {
                    backgroundColor: isDarkMode ? 'rgba(144, 202, 249, 0.5)' : 'rgba(244, 185, 66, 0.5)',
                  },
                }}
              />
            }
            label={
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1,
              }}>
                {isDarkMode ? (
                  <DarkModeIcon sx={{ 
                    color: '#90caf9',
                    animation: 'fadeIn 0.3s ease-in',
                    '@keyframes fadeIn': {
                      '0%': { opacity: 0, transform: 'scale(0.8)' },
                      '100%': { opacity: 1, transform: 'scale(1)' },
                    },
                  }} />
                ) : (
                  <LightModeIcon sx={{ 
                    color: '#f4b942',
                    animation: 'fadeIn 0.3s ease-in',
                    '@keyframes fadeIn': {
                      '0%': { opacity: 0, transform: 'scale(0.8)' },
                      '100%': { opacity: 1, transform: 'scale(1)' },
                    },
                  }} />
                )}
                <Typography 
                  variant="body1" 
                  sx={{ 
                    color: theme => theme.palette.mode === 'dark' ? '#90caf9' : '#f4b942',
                    fontWeight: 500,
                  }}
                >
                  {isDarkMode ? 'Dark' : 'Light'} Mode
                </Typography>
              </Box>
            }
          />
        </Box>
        
        {error && !error.includes('music') && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <Box sx={{ mb: 3 }}>
          <Divider sx={{ my: 3 }} />
        </Box>
        
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={4} md={3}>
              <Tooltip title={`Max size: ${formatFileSize(MAX_FILE_SIZE)}`} placement="top">
                <Box {...getAvatarRootProps()} 
                  sx={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    gap: 2,
                    border: '2px dashed',
                    borderColor: dragState.avatar ? 'primary.main' : 'grey.300',
                    borderRadius: 2,
                    p: 2,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    transform: dragState.avatar ? 'scale(1.02)' : 'scale(1)',
                    bgcolor: dragState.avatar ? 'action.hover' : 'transparent',
                    '&:hover': {
                      borderColor: 'primary.main',
                      bgcolor: 'action.hover'
                    }
                  }}>
                  <input {...getAvatarInputProps()} />
                  <Avatar
                    src={previewUrl || user?.avatar_url || ''}
                    sx={{ 
                      width: 100, 
                      height: 100,
                      transition: 'transform 0.2s ease',
                      '&:hover': {
                        transform: 'scale(1.05)'
                      }
                    }}
                    alt={formData.username}
                  />
                  <Box sx={{ textAlign: 'center' }}>
                    <CloudUploadIcon color="primary" sx={{ mb: 1 }} />
                    <Typography variant="body2" color="textSecondary">
                      Drag & drop or click to upload avatar
                    </Typography>
                    {fileInfo.avatar && (
                      <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                        {fileInfo.avatar.name} ({fileInfo.avatar.size})
                      </Typography>
                    )}
                  </Box>
                </Box>
              </Tooltip>
            </Grid>

            <Grid item xs={12} sm={8} md={9}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Profile Information
                  </Typography>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Username"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Bio"
                    name="bio"
                    multiline
                    rows={4}
                    value={formData.bio}
                    onChange={handleInputChange}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Change Password
                  </Typography>
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Current Password"
                    name="currentPassword"
                    type="password"
                    value={formData.currentPassword}
                    onChange={handleInputChange}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="New Password"
                    name="newPassword"
                    type="password"
                    value={formData.newPassword}
                    onChange={handleInputChange}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Confirm New Password"
                    name="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    disabled={isUploading}
                    startIcon={isUploading ? <CircularProgress size={20} /> : null}
                    sx={{
                      position: 'relative',
                      transition: 'all 0.2s ease',
                      '&:not(:disabled):hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: 2
                      }
                    }}
                  >
                    {isUploading ? 'Saving...' : 'Save Changes'}
                  </Button>
                </Grid>
              </Grid>
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                Profile Music
                <Tooltip title={`Max size: ${formatFileSize(MAX_AUDIO_SIZE)}`} placement="top">
                  <InfoIcon color="action" sx={{ fontSize: 20 }} />
                </Tooltip>
              </Typography>
              
              {/* Music upload error message */}
              {error && error.includes('music') && (
                <Alert 
                  severity="error" 
                  sx={{ mb: 2 }}
                  onClose={() => setError('')}
                >
                  {error}
                </Alert>
              )}
              
              <Box {...getMusicRootProps()}
                sx={{ 
                  border: '2px dashed',
                  borderColor: dragState.music ? 'primary.main' : 'grey.300',
                  borderRadius: 2,
                  p: 3,
                  mb: 2,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  transform: dragState.music ? 'scale(1.02)' : 'scale(1)',
                  bgcolor: dragState.music ? 'action.hover' : 'transparent',
                  '&:hover': {
                    borderColor: 'primary.main',
                    bgcolor: 'action.hover'
                  }
                }}>
                <input {...getMusicInputProps()} />
                <Box sx={{ textAlign: 'center' }}>
                  {musicFile ? (
                    <AudioFileIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                  ) : (
                    <CloudUploadIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                  )}
                  <Typography variant="body1" gutterBottom>
                    {musicFile ? 'Change audio file' : 'Drag & drop or click to upload music'}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Supports MP3, WAV, and OGG formats
                  </Typography>
                  {fileInfo.music && (
                    <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                      {fileInfo.music.name} ({fileInfo.music.size})
                    </Typography>
                  )}
                </Box>
              </Box>
              
              {(musicPreview || musicData?.music_url) && (
                <Box sx={{ mt: 2 }}>
                  <MusicPlayer url={musicPreview || musicData?.music_url} />
                </Box>
              )}
              
              {/* Music-specific success message */}
              {success && success.includes('Music') && (
                <Alert 
                  severity="success" 
                  sx={{ mt: 2, mb: 2 }}
                  onClose={() => setSuccess('')}
                >
                  {success}
                </Alert>
              )}
            </Grid>

            {isUploading && (
              <Grid item xs={12}>
                <Box sx={{ width: '100%', mb: 2 }}>
                  <LinearProgress 
                    variant="determinate" 
                    value={uploadProgress} 
                    sx={{ 
                      height: 8,
                      borderRadius: 4,
                      '& .MuiLinearProgress-bar': {
                        borderRadius: 4
                      }
                    }} 
                  />
                  <Typography variant="body2" color="textSecondary" align="center" sx={{ mt: 1 }}>
                    Uploading... {Math.round(uploadProgress)}%
                  </Typography>
                </Box>
              </Grid>
            )}

            <Grid item xs={12}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleMusicSubmit}
                disabled={!musicFile}
              >
                Update Music
              </Button>
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
            </Grid>
          </Grid>
        </Box>
        
        <Snackbar
          open={Boolean(success) && !success.includes('Music')}
          autoHideDuration={6000}
          onClose={() => setSuccess('')}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert 
            severity="success" 
            onClose={() => setSuccess('')}
            sx={{ width: '100%' }}
            elevation={6}
          >
            {success}
          </Alert>
        </Snackbar>
      </Paper>
    </Container>
  );
};

export default ProfileSettings;
