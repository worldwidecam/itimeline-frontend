import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../utils/api';
import {
  Container,
  Paper,
  Typography,
  Avatar,
  Box,
  Grid,
  Divider,
  Fade,
  CircularProgress,
  useTheme,
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { useEmailBlur } from '../contexts/EmailBlurContext';
import MusicPlayer from './MusicPlayer';

const Profile = () => {
  const { userId } = useParams();
  const { user } = useAuth();
  const { getBlurredEmail } = useEmailBlur();
  const theme = useTheme();
  const [profileUser, setProfileUser] = useState(null);
  const [musicData, setMusicData] = useState(null);
  const [showMusic, setShowMusic] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const isOwnProfile = !userId || (user && userId === user.id.toString());

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        
        if (isOwnProfile) {
          // If viewing own profile
          if (user) {
            // Make a copy of the user object with properly formatted created_at date
            // This ensures consistent date formatting between own profile and other profiles
            const formattedUser = {
              ...user,
              // If created_at is already an ISO string, use it; otherwise fetch from API
              created_at: user.created_at && typeof user.created_at === 'string' ? user.created_at : null
            };
            setProfileUser(formattedUser);
            
            // If created_at is missing or not properly formatted, fetch it from the API
            if (!formattedUser.created_at) {
              try {
                const userResponse = await api.get(`/api/users/${user.id}`);
                setProfileUser(prev => ({
                  ...prev,
                  created_at: userResponse.data.created_at
                }));
              } catch (userError) {
                console.error('Error fetching user created_at:', userError);
              }
            }
          }
          
          // Fetch music preferences for own profile
          try {
            const musicResponse = await api.get('/api/profile/music');
            if (musicResponse.data.music_url) {
              setMusicData(musicResponse.data);
              // Slight delay before showing music player for a smoother experience
              setTimeout(() => setShowMusic(true), 100);
            }
          } catch (musicError) {
            console.error('Error fetching music preferences:', musicError);
          }
        } else {
          // If viewing someone else's profile
          try {
            const userResponse = await api.get(`/api/users/${userId}`);
            setProfileUser(userResponse.data);
            
            // Optionally fetch music for other users if the API supports it
            try {
              const musicResponse = await api.get(`/api/users/${userId}/music`);
              if (musicResponse.data.music_url) {
                setMusicData(musicResponse.data);
                setTimeout(() => setShowMusic(true), 100);
              }
            } catch (musicError) {
              // It's okay if we can't get music data for other users
              console.log('No music data available for this user');
            }
          } catch (userError) {
            console.error('Error fetching user profile:', userError);
            setError('User profile not found');
          }
        }
      } catch (error) {
        console.error('Error in profile loading:', error);
        setError('Error loading profile');
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();

    return () => {
      setShowMusic(false);
    };
  }, [userId, user, isOwnProfile]);

  if (!user && !userId) {
    return (
      <Box
        sx={{
          minHeight: 'calc(100vh - 64px)',
          width: '100%',
          position: 'relative',
          background: theme.palette.mode === 'dark'
            ? 'linear-gradient(180deg, #000000 0%, #0a1128 50%, #1a2456 100%)'
            : 'linear-gradient(180deg, #ffb199 0%, #ffd5c8 20%, #ffeae0 45%, #f7f4ea 75%, #f5f1e4 90%, #ffffff 100%)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-start',
          pt: 8
        }}
      >
        <Container maxWidth="md">
          <Paper sx={{ 
            p: 4, 
            backgroundColor: theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(10px)',
            borderRadius: 2,
            boxShadow: theme.palette.mode === 'dark' 
              ? '0 8px 32px rgba(0, 0, 0, 0.3)' 
              : '0 8px 32px rgba(0, 0, 0, 0.1)'
          }}>
            <Typography variant="h5">Please log in to view your profile</Typography>
          </Paper>
        </Container>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: 'calc(100vh - 64px)',
          width: '100%',
          position: 'relative',
          background: theme.palette.mode === 'dark'
            ? 'linear-gradient(180deg, #000000 0%, #0a1128 50%, #1a2456 100%)'
            : 'linear-gradient(180deg, #ffb199 0%, #ffd5c8 20%, #ffeae0 45%, #f7f4ea 75%, #f5f1e4 90%, #ffffff 100%)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error || !profileUser) {
    return (
      <Box
        sx={{
          minHeight: 'calc(100vh - 64px)',
          width: '100%',
          position: 'relative',
          background: theme.palette.mode === 'dark'
            ? 'linear-gradient(180deg, #000000 0%, #0a1128 50%, #1a2456 100%)'
            : 'linear-gradient(180deg, #ffb199 0%, #ffd5c8 20%, #ffeae0 45%, #f7f4ea 75%, #f5f1e4 90%, #ffffff 100%)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-start',
          pt: 8
        }}
      >
        <Container maxWidth="md">
          <Paper sx={{ 
            p: 4, 
            backgroundColor: theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(10px)',
            borderRadius: 2,
            boxShadow: theme.palette.mode === 'dark' 
              ? '0 8px 32px rgba(0, 0, 0, 0.3)' 
              : '0 8px 32px rgba(0, 0, 0, 0.1)'
          }}>
            <Typography variant="h5" color="error">{error || 'User not found'}</Typography>
          </Paper>
        </Container>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: 'calc(100vh - 64px)',
        width: '100%',
        position: 'relative',
        background: theme.palette.mode === 'dark'
          ? 'linear-gradient(180deg, #000000 0%, #0a1128 50%, #1a2456 100%)'
          : 'linear-gradient(180deg, #ffb199 0%, #ffd5c8 20%, #ffeae0 45%, #f7f4ea 75%, #f5f1e4 90%, #ffffff 100%)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        pt: 4,
        pb: 4
      }}
    >
      {/* Music Player - show for any profile that has music data */}
      {showMusic && musicData && (
        <Fade in={showMusic} timeout={800}>
          <Box 
            sx={{ 
              position: 'fixed', 
              top: '80px', 
              left: '20px', 
              zIndex: 1000,
              width: '300px',
              backgroundColor: theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(10px)',
              borderRadius: 2,
              boxShadow: theme.palette.mode === 'dark' 
                ? '0 8px 32px rgba(0, 0, 0, 0.3)' 
                : '0 8px 32px rgba(0, 0, 0, 0.1)',
              p: 2,
              opacity: showMusic ? 1 : 0,
              transition: 'opacity 0.8s ease-in-out'
            }}
          >
            <Typography variant="h6" gutterBottom>
              {isOwnProfile ? 'My Music' : `${profileUser?.username}'s Music`}
            </Typography>
            <MusicPlayer url={musicData?.music_url} platform={musicData?.music_platform} />
          </Box>
        </Fade>
      )}
      
      <Container maxWidth="md">
        <Paper sx={{ 
          p: 4, 
          backgroundColor: theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(10px)',
          borderRadius: 2,
          boxShadow: theme.palette.mode === 'dark' 
            ? '0 8px 32px rgba(0, 0, 0, 0.3)' 
            : '0 8px 32px rgba(0, 0, 0, 0.1)'
        }}>
          <Grid container spacing={4}>
            {/* Profile Header */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <Avatar
                  src={profileUser.avatar_url}
                  sx={{ width: 120, height: 120 }}
                  alt={profileUser.username}
                />
                <Box>
                  <Typography variant="h4" gutterBottom>
                    {profileUser.username}
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    {getBlurredEmail(profileUser.email)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {profileUser.created_at ? 
                      `Joined ${new Date(profileUser.created_at).toLocaleDateString()}` : 
                      'Join date unavailable'}
                  </Typography>
                </Box>
              </Box>
            </Grid>

            <Grid item xs={12}>
              <Divider />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Bio
              </Typography>
              <Typography variant="body1">
                {profileUser.bio || 'No bio available.'}
              </Typography>
            </Grid>
          </Grid>
        </Paper>
      </Container>
    </Box>
  );
};

export default Profile;
