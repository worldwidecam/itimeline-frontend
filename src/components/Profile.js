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
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import MusicPlayer from './MusicPlayer';

const Profile = () => {
  const { userId } = useParams();
  const { user } = useAuth();
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
          setProfileUser(user);
          
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
      <Container maxWidth="md">
        <Paper sx={{ p: 4, mt: 4 }}>
          <Typography variant="h5">Please log in to view your profile</Typography>
        </Paper>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ display: 'flex', justifyContent: 'center', pt: 8 }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error || !profileUser) {
    return (
      <Container maxWidth="md">
        <Paper sx={{ p: 4, mt: 4 }}>
          <Typography variant="h5" color="error">{error || 'User not found'}</Typography>
        </Paper>
      </Container>
    );
  }

  return (
    <>
      {/* Music Player - only show for own profile */}
      {isOwnProfile && (
        <Fade in={showMusic} timeout={800}>
          <Box 
            sx={{ 
              position: 'fixed', 
              top: '80px', 
              left: '20px', 
              zIndex: 1000,
              width: '300px',
              backgroundColor: 'background.paper',
              borderRadius: 1,
              boxShadow: 3,
              p: 2,
              opacity: showMusic ? 1 : 0,
              transition: 'opacity 0.8s ease-in-out'
            }}
          >
            <Typography variant="h6" gutterBottom>
              My Music
            </Typography>
            <MusicPlayer url={musicData?.music_url} platform={musicData?.music_platform} />
          </Box>
        </Fade>
      )}
      
      <Container maxWidth="md">
        <Paper sx={{ p: 4, mt: 4 }}>
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
                    {profileUser.email}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Joined {new Date(profileUser.created_at).toLocaleDateString()}
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
    </>
  );
};

export default Profile;
