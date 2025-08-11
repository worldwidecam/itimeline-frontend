import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Divider
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import UserAvatar from './common/UserAvatar';

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
          <UserAvatar
            name={user?.username}
            avatarUrl={user?.avatar_url}
            id={user?.id}
            size={150}
            sx={{ mb: 2, fontSize: '4rem' }}
          />
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
