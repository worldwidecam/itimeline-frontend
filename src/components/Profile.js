import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api, { submitUserReport } from '../utils/api';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  Divider,
  Fade,
  CircularProgress,
  useTheme,
  Fab,
  Stack,
  Tooltip,
  Zoom,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Button,
  Snackbar,
  Alert,
} from '@mui/material';
import ReportProblemOutlinedIcon from '@mui/icons-material/ReportProblemOutlined';
import LinkOutlinedIcon from '@mui/icons-material/LinkOutlined';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import AddIcon from '@mui/icons-material/Add';
import { useAuth } from '../contexts/AuthContext';
import { useEmailBlur } from '../contexts/EmailBlurContext';
import MusicPlayer from './MusicPlayer';
import UserAvatar from './common/UserAvatar';

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
  const [fabOpen, setFabOpen] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportCategory, setReportCategory] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  
  const isOwnProfile = !userId || (user && userId === user.id.toString());
  const canCreateOrReport = Boolean(user) && user?.can_post_or_report !== false;
  const canShowMainProfileActions = Boolean(profileUser?.id);
  const canReportProfile = Boolean(profileUser?.id) && !isOwnProfile && canCreateOrReport;

  const reportCategoryOptions = [
    { value: 'website_policy', label: 'Website policy violation' },
    { value: 'government_policy', label: 'Government policy / legal concern' },
    { value: 'unethical_boundary', label: 'Unethical or harmful boundary' },
  ];

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        
        if (isOwnProfile) {
          // If viewing own profile, always fetch fresh data from API
          // This ensures all fields (including bio) are loaded from database
          if (user) {
            try {
              const userResponse = await api.get(`/api/users/${user.id}`);
              setProfileUser(userResponse.data);
            } catch (userError) {
              console.error('Error fetching own profile data:', userError);
              // Fallback to AuthContext user data if API call fails
              const formattedUser = {
                ...user,
                created_at: user.created_at && typeof user.created_at === 'string' ? user.created_at : null
              };
              setProfileUser(formattedUser);
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

  useEffect(() => {
    setFabOpen(false);
    setReportDialogOpen(false);
  }, [userId]);

  const handleCopyProfileLink = async () => {
    const link = `${window.location.origin}/profile/${profileUser?.id}`;
    try {
      await navigator.clipboard.writeText(link);
      setSnackbar({ open: true, message: 'Profile link copied', severity: 'success' });
    } catch (_) {
      setSnackbar({ open: true, message: `Copy failed. Link: ${link}`, severity: 'info' });
    }
    setFabOpen(false);
  };

  const handleOpenReportDialog = () => {
    setReportCategory('');
    setReportReason('');
    setReportDialogOpen(true);
    setFabOpen(false);
  };

  const handleCloseReportDialog = () => {
    if (reportSubmitting) return;
    setReportDialogOpen(false);
  };

  const handleSubmitUserReport = async () => {
    if (!profileUser?.id) return;
    if (!reportCategory) {
      setSnackbar({ open: true, message: 'Please choose a report category', severity: 'warning' });
      return;
    }

    try {
      setReportSubmitting(true);
      await submitUserReport(profileUser.id, null, reportReason || '', reportCategory);
      setReportDialogOpen(false);
      setSnackbar({ open: true, message: 'User report submitted', severity: 'success' });
    } catch (e) {
      const msg = e?.response?.data?.error || e?.message || 'Failed to submit report';
      setSnackbar({ open: true, message: msg, severity: 'error' });
    } finally {
      setReportSubmitting(false);
    }
  };

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
                <UserAvatar
                  name={profileUser.username}
                  avatarUrl={profileUser.avatar_url}
                  id={profileUser.id}
                  size={120}
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

      {canShowMainProfileActions && (
        <Box
          sx={{
            position: 'fixed',
            right: { xs: 16, sm: 24 },
            bottom: { xs: 16, sm: 24 },
            zIndex: 1100,
          }}
        >
          <Stack direction="column" spacing={1.25} alignItems="flex-end">
            <Zoom in={fabOpen}>
              <Box>
                <Tooltip title="Copy profile link" placement="left">
                  <Fab
                    size="small"
                    color="default"
                    onClick={handleCopyProfileLink}
                    aria-label="Copy profile link"
                  >
                    <LinkOutlinedIcon fontSize="small" />
                  </Fab>
                </Tooltip>
              </Box>
            </Zoom>
            {canReportProfile && (
              <Zoom in={fabOpen}>
                <Box>
                  <Tooltip title="Report user" placement="left">
                    <Fab
                      size="small"
                      color="error"
                      onClick={handleOpenReportDialog}
                      aria-label="Report user"
                    >
                      <ReportProblemOutlinedIcon fontSize="small" />
                    </Fab>
                  </Tooltip>
                </Box>
              </Zoom>
            )}

            <Tooltip title={fabOpen ? 'Close actions' : 'Profile actions'} placement="left">
              <Fab
                color="primary"
                onClick={() => setFabOpen((prev) => !prev)}
                aria-label="Profile actions"
                sx={{ boxShadow: '0 10px 28px rgba(0,0,0,0.22)' }}
              >
                {fabOpen ? <ExpandLessIcon /> : <AddIcon />}
              </Fab>
            </Tooltip>
          </Stack>
        </Box>
      )}

      <Dialog open={reportDialogOpen} onClose={handleCloseReportDialog} fullWidth maxWidth="sm">
        <DialogTitle>Report {profileUser?.username || 'User'}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            This report creates a moderation ticket for Site Control.
          </Typography>
          <TextField
            select
            fullWidth
            margin="dense"
            label="Category"
            value={reportCategory}
            onChange={(e) => setReportCategory(e.target.value)}
          >
            {reportCategoryOptions.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
            ))}
          </TextField>
          <TextField
            fullWidth
            margin="dense"
            multiline
            minRows={3}
            label="Reason (optional details)"
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
            placeholder="Add context for moderators"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseReportDialog} disabled={reportSubmitting}>Cancel</Button>
          <Button onClick={handleSubmitUserReport} variant="contained" color="error" disabled={reportSubmitting}>
            {reportSubmitting ? 'Submitting...' : 'Submit Report'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3500}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Profile;
