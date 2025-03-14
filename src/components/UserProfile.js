import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Avatar,
  Divider
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

const UserProfile = () => {
  const { user } = useAuth();
  const location = useLocation();
  const isSettingsPage = location.pathname.includes('/settings');

  return (
    <Container maxWidth="md">
      <Paper sx={{ p: 4, mt: 4 }}>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          mb: 4
        }}>
          <Avatar
            src={user?.avatar_url}
            sx={{
              width: 150,
              height: 150,
              mb: 2,
              fontSize: '4rem'
            }}
          >
            {user?.username?.[0]?.toUpperCase()}
          </Avatar>
          <Typography variant="h4" gutterBottom>
            {user?.username}'s Profile
          </Typography>
        </Box>
        
        <Divider sx={{ my: 3 }} />
        
        {/* Render either the main profile content or the settings page */}
        {!isSettingsPage ? (
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              Profile Information
            </Typography>
            <Box sx={{ pl: 2 }}>
              <Typography variant="body1" sx={{ mb: 1 }}>
                <strong>Email:</strong> {user?.email}
              </Typography>
              <Typography variant="body1">
                <strong>Bio:</strong> {user?.bio || 'No bio added yet'}
              </Typography>
            </Box>
          </Box>
        ) : (
          <Outlet />
        )}
      </Paper>
    </Container>
  );
};

export default UserProfile;
