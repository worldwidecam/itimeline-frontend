import React, { useState, useEffect } from 'react';
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
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import MusicPlayer from './MusicPlayer';

const Profile = () => {
  const { user } = useAuth();
  const [musicData, setMusicData] = useState(null);
  const [showMusic, setShowMusic] = useState(false);

  useEffect(() => {
    const fetchMusicPreferences = async () => {
      try {
        const response = await api.get('/api/profile/music');
        if (response.data.music_url) {
          setMusicData(response.data);
          // Slight delay before showing music player for a smoother experience
          setTimeout(() => setShowMusic(true), 100);
        }
      } catch (error) {
        console.error('Error fetching music preferences:', error);
      }
    };

    if (user) {
      fetchMusicPreferences();
    }

    return () => {
      setShowMusic(false);
    };
  }, [user]);

  if (!user) {
    return (
      <Container maxWidth="md">
        <Paper sx={{ p: 4, mt: 4 }}>
          <Typography variant="h5">Please log in to view your profile</Typography>
        </Paper>
      </Container>
    );
  }

  return (
    <>
      {/* Music Player */}
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
      
      <Container maxWidth="md">
        <Paper sx={{ p: 4, mt: 4 }}>
          <Grid container spacing={4}>
            {/* Profile Header */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <Avatar
                  src={user.avatar_url}
                  sx={{ width: 120, height: 120 }}
                  alt={user.username}
                />
                <Box>
                  <Typography variant="h4" gutterBottom>
                    {user.username}
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    {user.email}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Joined {new Date(user.created_at).toLocaleDateString()}
                  </Typography>
                </Box>
              </Box>
            </Grid>

            {/* Bio Section */}
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                About Me
              </Typography>
              <Typography variant="body1">
                {user.bio || 'No bio yet'}
              </Typography>
            </Grid>
          </Grid>
        </Paper>
      </Container>
    </>
  );
};

export default Profile;
