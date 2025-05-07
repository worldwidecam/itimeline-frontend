import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import CssBaseline from '@mui/material/CssBaseline';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { Close as CloseIcon } from '@mui/icons-material';
import Navbar from './components/Navbar';
import TimelineV3 from './components/timeline-v3/TimelineV3';
import Login from './components/Login';
import Register from './components/Register';
import Profile from './components/Profile';
import ProfileSettings from './components/ProfileSettings';
import UserProfileView from './components/UserProfileView';
import LandingPage from './components/LandingPage';
import MediaUploader from './components/MediaUploader';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CustomThemeProvider } from './contexts/ThemeContext';
import { 
  CircularProgress, 
  Box, 
  Button, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogContentText,
  DialogActions,
  TextField,
  Stack,
  Card,
  CardContent,
  CardActions,
  Typography,
  Grid,
  Divider,
  useTheme,
  IconButton,
  Paper
} from '@mui/material';
import PageTransition from './components/PageTransition';
import api from './utils/api';
import setupKeepAlive from './utils/keepAlive';

// Protected Route component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return children;
};

// Auth Route component - Shows Homepage for authenticated users, LandingPage for non-authenticated
const AuthRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return children;
  }

  return <Navigate to="/home" />;
};

// Homepage component
const Homepage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const theme = useTheme();
  const [loading, setLoading] = React.useState(false);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [timelineToDelete, setTimelineToDelete] = React.useState(null);
  const [timelines, setTimelines] = React.useState([]);
  const [loadingTimelines, setLoadingTimelines] = React.useState(true);
  const [formData, setFormData] = React.useState({
    name: '',
    description: ''
  });

  // Fetch timelines when component mounts
  React.useEffect(() => {
    const fetchTimelines = async () => {
      if (!user) return;
      
      try {
        setLoadingTimelines(true);
        const response = await api.get('/api/timeline-v3');
        setTimelines(response.data);
      } catch (error) {
        console.error('Error fetching timelines:', error);
      } finally {
        setLoadingTimelines(false);
      }
    };

    fetchTimelines();
  }, [user]);

  const handleDemoClick = () => {
    navigate('/timeline-v3/new');
  };

  const handleCreateClick = () => {
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setFormData({ name: '', description: '' });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCreateTimeline = async () => {
    if (!formData.name.trim()) {
      alert('Please enter a timeline name');
      return;
    }

    try {
      setLoading(true);
      // Convert timeline name to uppercase for consistency with other parts of the app
      const response = await api.post('/api/timeline-v3', {
        name: formData.name.trim().toUpperCase(),
        description: formData.description.trim()
      });
      
      // Add the new timeline to the list
      setTimelines(prev => [response.data, ...prev]);
      
      handleDialogClose();
      // Navigate to the new timeline
      navigate(`/timeline-v3/${response.data.id}`);
    } catch (error) {
      console.error('Error creating timeline:', error);
      const errorMessage = error.response?.data?.error || 'Failed to create timeline. Please try again.';
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (timeline) => {
    setTimelineToDelete(timeline);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!timelineToDelete) return;

    try {
      await api.delete(`/api/timeline-v3/${timelineToDelete.id}`);
      
      // Remove the timeline from the list
      setTimelines(timelines.filter(t => t.id !== timelineToDelete.id));
      setDeleteDialogOpen(false);
      setTimelineToDelete(null);
    } catch (error) {
      console.error('Error deleting timeline:', error);
      alert(error.response?.data?.error || 'Error deleting timeline');
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setTimelineToDelete(null);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <>
      {/* Fixed background that covers the entire viewport */}
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 0,
          background: theme.palette.mode === 'dark'
            ? 'linear-gradient(180deg, #000000 0%, #0a1128 50%, #1a2456 100%)'
            : 'linear-gradient(180deg, #ffd5c8 0%, #ffeae0 40%, #f7f4ea 75%, #f5f1e4 90%, #ffffff 100%)'
        }}
      />
      {/* Scrollable content container */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          minHeight: 'calc(100vh - 64px)',
          pt: 4,
          px: 4,
          position: 'relative',
          zIndex: 1,
          backgroundColor: 'transparent'
        }}
      >
      <Box sx={{ textAlign: 'center', mb: 6 }}>
        <h1>Welcome to Timeline Forum</h1>
        <p>Create and explore timelines with our new V3 interface.</p>
        {user && (
          <Stack spacing={2} direction="row" justifyContent="center" sx={{ mt: 2 }}>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={handleDemoClick}
            >
              Try Timeline V3 Beta
            </Button>
            <Button 
              variant="outlined" 
              color="primary" 
              onClick={handleCreateClick}
            >
              Create Your Timeline
            </Button>
          </Stack>
        )}
      </Box>

      {user && (
        <>
          <Divider sx={{ my: 4 }} />
          <Typography variant="h5" sx={{ mb: 3 }}>
            Your Timelines
          </Typography>
          {loadingTimelines ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
              <CircularProgress />
            </Box>
          ) : timelines.length > 0 ? (
            <Grid container spacing={3}>
              {timelines.map(timeline => (
                <Grid item xs={12} sm={6} md={4} key={timeline.id}>
                  <Card sx={{ 
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column',
                    backgroundColor: theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.9)',
                    backdropFilter: 'blur(10px)',
                    boxShadow: theme.palette.mode === 'dark' 
                      ? '0 8px 32px rgba(0, 0, 0, 0.3)' 
                      : '0 8px 32px rgba(0, 0, 0, 0.1)'
                  }}>
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Typography variant="h6" gutterBottom>
                        {timeline.name}
                      </Typography>
                      {timeline.description && (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          {timeline.description}
                        </Typography>
                      )}
                      <Typography variant="caption" color="text.secondary">
                        Created: {formatDate(timeline.created_at)}
                      </Typography>
                    </CardContent>
                    <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
                      <Button 
                        size="small"
                        variant="contained"
                        color="primary"
                        onClick={() => navigate(`/timeline-v3/${timeline.id}`)}
                      >
                        Open Timeline
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Box sx={{ textAlign: 'center', my: 4 }}>
              <Typography color="text.secondary">
                You haven't created any timelines yet.
              </Typography>
            </Box>
          )}
          
          {/* Media Uploader Section */}
          <Divider sx={{ my: 4 }} />
          <Typography variant="h5" sx={{ mb: 3 }}>
            Media Uploader Test
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Use this tool to test media uploads without creating an event. This helps diagnose any issues with the upload functionality.
          </Typography>
          <MediaUploader />
        </>
      )}

      <Dialog 
        open={dialogOpen} 
        onClose={handleDialogClose} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            overflow: 'hidden',
            backgroundColor: theme.palette.mode === 'dark' 
              ? 'rgba(10,10,20,0.85)' 
              : 'rgba(255,255,255,0.85)',
            backdropFilter: 'blur(20px)',
            boxShadow: theme.palette.mode === 'dark'
              ? '0 10px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)'
              : '0 10px 40px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.05)',
            border: theme.palette.mode === 'dark'
              ? '1px solid rgba(255,255,255,0.05)'
              : '1px solid rgba(0,0,0,0.05)',
          }
        }}
      >
        {/* Header with colored accent bar */}
        <Box
          sx={{
            position: 'relative',
            height: 8,
            bgcolor: theme.palette.primary.main, // Use theme's primary color
            mb: -1,
          }}
        />
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          p: 3,
          pb: 2,
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: theme.palette.mode === 'dark'
                  ? 'rgba(255,255,255,0.05)'
                  : 'rgba(0,0,0,0.03)',
                color: theme.palette.primary.main, // Use theme's primary color
              }}
            >
              <Typography variant="h6" component="span" sx={{ fontWeight: 'bold' }}>T</Typography>
            </Box>
            <Typography 
              variant="h5" 
              component="div"
              sx={{ 
                fontWeight: 600,
                color: theme.palette.mode === 'dark'
                  ? 'rgba(255,255,255,0.95)'
                  : 'rgba(0,0,0,0.85)',
              }}
            >
              Create New Timeline
            </Typography>
          </Box>
          <IconButton 
            onClick={handleDialogClose} 
            size="medium"
            aria-label="close"
            sx={{
              color: theme.palette.mode === 'dark' ? 'white' : 'rgba(0,0,0,0.6)',
              bgcolor: theme.palette.mode === 'dark'
                ? 'rgba(255,255,255,0.05)'
                : 'rgba(0,0,0,0.03)',
              '&:hover': {
                bgcolor: theme.palette.mode === 'dark'
                  ? 'rgba(255,255,255,0.1)'
                  : 'rgba(0,0,0,0.05)',
              },
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 3, pt: 2 }}>
          <Paper 
            elevation={0} 
            sx={{ 
              p: 3, 
              mb: 3, 
              borderRadius: 2,
              bgcolor: theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.02)' 
            }}
          >
            <Typography variant="subtitle2" sx={{ mb: 2, color: theme.palette.text.secondary }}>
              Timeline Details
            </Typography>
            <TextField
              autoFocus
              name="name"
              label="Timeline Name"
              placeholder="Enter a name for your timeline"
              type="text"
              fullWidth
              value={formData.name}
              onChange={handleInputChange}
              required
              variant="outlined"
              sx={{ 
                mb: 3,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.5)',
                }
              }}
            />
            <TextField
              name="description"
              label="Description"
              placeholder="Describe what this timeline is about"
              type="text"
              fullWidth
              multiline
              rows={3}
              value={formData.description}
              onChange={handleInputChange}
              variant="outlined"
              sx={{ 
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.5)',
                }
              }}
            />
          </Paper>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Your timeline will be created with a unique URL that you can share with others.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, pt: 0 }}>
          <Button 
            onClick={handleDialogClose} 
            disabled={loading}
            sx={{ 
              borderRadius: 2,
              px: 3,
              color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)',
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleCreateTimeline} 
            variant="contained" 
            disabled={loading}
            sx={{ 
              borderRadius: 2,
              px: 3,
              bgcolor: theme.palette.primary.main,
              '&:hover': {
                bgcolor: theme.palette.primary.dark,
              }
            }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Create Timeline'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel}>
        <DialogTitle>Delete Timeline</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete "{timelineToDelete?.name}"? This action cannot be undone.
            Events that are only in this timeline will be deleted. Events that are referenced in other timelines will be preserved.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
    </>
  );
};

function App() {
  // Set up keep-alive ping to prevent backend from spinning down
  React.useEffect(() => {
    setupKeepAlive();
  }, []);

  return (
    <CustomThemeProvider>
      <AuthProvider>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <CssBaseline />
          <PageTransition>
            <Router>
              {/* Conditional Navbar - only show on non-landing pages */}
              <Routes>
                <Route path="/" element={null} />
                <Route path="*" element={<Navbar />} />
              </Routes>
              
              <Routes>
                {/* Landing page route without navbar */}
                <Route path="/" element={
                  <AuthRoute>
                    <LandingPage />
                  </AuthRoute>
                } />
                
                {/* Login/Register routes */}
                <Route path="/login" element={
                  <Box sx={{ pt: 8 }}>
                    <Login />
                  </Box>
                } />
                <Route path="/register" element={
                  <Box sx={{ pt: 8 }}>
                    <Register />
                  </Box>
                } />
                
                {/* Protected routes */}
                <Route path="/home" element={
                  <Box sx={{ height: '100vh', overflow: 'auto' }}>
                    <ProtectedRoute>
                      <Homepage />
                    </ProtectedRoute>
                  </Box>
                } />
                <Route path="/timeline-v3/:id" element={
                  <Box sx={{ pt: 8 }}>
                    <ProtectedRoute>
                      <TimelineV3 />
                    </ProtectedRoute>
                  </Box>
                } />
                <Route path="/profile" element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                } />
                <Route path="/profile/:userId" element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                } />
                <Route path="/profile/settings" element={
                  <ProtectedRoute>
                    <ProfileSettings />
                  </ProtectedRoute>
                } />
              </Routes>
            </Router>
          </PageTransition>
        </LocalizationProvider>
      </AuthProvider>
    </CustomThemeProvider>
  );
}

export default App;
