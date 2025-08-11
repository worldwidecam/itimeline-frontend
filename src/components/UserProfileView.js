import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Typography,
  Box,
  Container,
  Paper,
  Divider,
  CircularProgress,
  Button,
  Grid,
  Card,
  CardContent,
  CardMedia,
  useTheme
} from '@mui/material';
import { 
  Person as PersonIcon,
  Event as EventIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import UserAvatar from './common/UserAvatar';

const UserProfileView = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const { user } = useAuth();
  const [profileUser, setProfileUser] = useState(null);
  const [userEvents, setUserEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Check if viewing own profile
  const isOwnProfile = user && userId === user.id.toString();

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        // Fetch user profile data
        const userResponse = await api.get(`/api/users/${userId}`);
        setProfileUser(userResponse.data);
        
        // Fetch user's events
        const eventsResponse = await api.get(`/api/users/${userId}/events`);
        setUserEvents(eventsResponse.data);
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching user profile:', err);
        setError(err.response?.data?.error || 'Failed to load user profile');
        setLoading(false);
      }
    };

    if (userId) {
      fetchUserProfile();
    }
  }, [userId]);

  const handleBack = () => {
    navigate(-1);
  };

  // If viewing own profile, redirect to the main profile page
  useEffect(() => {
    if (isOwnProfile) {
      navigate('/profile');
    }
  }, [isOwnProfile, navigate]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h5" color="error" gutterBottom>
            {error}
          </Typography>
          <Button 
            startIcon={<ArrowBackIcon />} 
            variant="contained" 
            onClick={handleBack}
            sx={{ mt: 2 }}
          >
            Go Back
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Button 
        startIcon={<ArrowBackIcon />} 
        variant="outlined" 
        onClick={handleBack}
        sx={{ mb: 2 }}
      >
        Back
      </Button>
      
      {profileUser && (
        <>
          <Paper 
            elevation={2} 
            sx={{ 
              p: 3, 
              mb: 3, 
              borderRadius: 2,
              background: theme.palette.mode === 'dark' 
                ? 'linear-gradient(to right, rgba(30,30,30,1), rgba(50,50,50,1))' 
                : 'linear-gradient(to right, rgba(240,240,240,1), rgba(250,250,250,1))'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <UserAvatar 
                name={profileUser.username}
                avatarUrl={profileUser.avatar_url}
                id={profileUser.id}
                size={80}
                sx={{ mr: 2 }}
              />
              <Box>
                <Typography variant="h4" component="h1">
                  {profileUser.username}
                </Typography>
                {profileUser.bio && (
                  <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
                    {profileUser.bio}
                  </Typography>
                )}
              </Box>
            </Box>
            
            <Divider sx={{ my: 2 }} />
            
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6" gutterBottom>
                User Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Member since: {new Date(profileUser.created_at).toLocaleDateString()}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Events created: {userEvents.length}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          </Paper>
          
          <Typography variant="h5" component="h2" sx={{ mb: 2 }}>
            Recent Activity
          </Typography>
          
          {userEvents.length > 0 ? (
            <Grid container spacing={2}>
              {userEvents.slice(0, 6).map((event) => (
                <Grid item xs={12} sm={6} md={4} key={event.id}>
                  <Card 
                    sx={{ 
                      height: '100%', 
                      display: 'flex', 
                      flexDirection: 'column',
                      cursor: 'pointer',
                      '&:hover': {
                        boxShadow: 6
                      }
                    }}
                    onClick={() => navigate(`/timeline-v3/${event.timeline_id}?event=${event.id}`)}
                  >
                    {event.type === 'MEDIA' && event.media_url && (
                      <CardMedia
                        component="img"
                        height="140"
                        image={event.media_url}
                        alt={event.title}
                        sx={{ objectFit: 'cover' }}
                      />
                    )}
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <EventIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">
                          {event.type}
                        </Typography>
                      </Box>
                      <Typography variant="h6" component="h3" gutterBottom>
                        {event.title || 'Untitled Event'}
                      </Typography>
                      {event.description && (
                        <Typography variant="body2" color="text.secondary" sx={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                        }}>
                          {event.description}
                        </Typography>
                      )}
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                        {new Date(event.created_at).toLocaleDateString()}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body1" color="text.secondary">
                This user hasn't created any events yet.
              </Typography>
            </Paper>
          )}
        </>
      )}
    </Container>
  );
};

export default UserProfileView;
