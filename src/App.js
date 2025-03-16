import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import CssBaseline from '@mui/material/CssBaseline';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import Navbar from './components/Navbar';
import TimelineV3 from './components/timeline-v3/TimelineV3';
import Login from './components/Login';
import Register from './components/Register';
import Profile from './components/Profile';
import ProfileSettings from './components/ProfileSettings';
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
  Divider
} from '@mui/material';
import PageTransition from './components/PageTransition';
import api from './utils/api';

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

// Homepage component
const Homepage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
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
      const response = await api.post('/api/timeline-v3', {
        name: formData.name.trim(),
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
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 64px)', pt: 4, px: 4 }}>
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
                  <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
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
        </>
      )}

      <Dialog open={dialogOpen} onClose={handleDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Timeline</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            name="name"
            label="Timeline Name"
            type="text"
            fullWidth
            value={formData.name}
            onChange={handleInputChange}
            required
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            name="description"
            label="Description"
            type="text"
            fullWidth
            multiline
            rows={3}
            value={formData.description}
            onChange={handleInputChange}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose} disabled={loading}>Cancel</Button>
          <Button 
            onClick={handleCreateTimeline} 
            variant="contained" 
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Create'}
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
  );
};

function App() {
  return (
    <CustomThemeProvider>
      <AuthProvider>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <CssBaseline />
          <PageTransition>
            <Router>
              <Navbar />
              <Box sx={{ display: 'flex', minHeight: '100vh' }}>
                <Box sx={{ flex: 1, pt: 8 }}>
                  <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/" element={<Homepage />} />
                    <Route path="/timeline-v3/:id" element={
                      <ProtectedRoute>
                        <TimelineV3 />
                      </ProtectedRoute>
                    } />
                    <Route path="/profile" element={
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
                </Box>
              </Box>
            </Router>
          </PageTransition>
        </LocalizationProvider>
      </AuthProvider>
    </CustomThemeProvider>
  );
}

export default App;
