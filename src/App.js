import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import CssBaseline from '@mui/material/CssBaseline';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { Close as CloseIcon } from '@mui/icons-material';
import Navbar from './components/Navbar';
import TimelineV3 from './components/timeline-v3/TimelineV3';
import PersonalTimelineWrapper from './components/timeline-v3/PersonalTimelineWrapper';
import Login from './components/Login';
import Register from './components/Register';
import Profile from './components/Profile';
import ProfileSettings from './components/ProfileSettings';
import UserProfileView from './components/UserProfileView';
import LandingPage from './components/LandingPage';
import AudioTester from './components/AudioTester';
import MemberListTab from './components/timeline-v3/community/MemberListTab';
import AdminPanel from './components/timeline-v3/community/AdminPanel';
import ErrorBoundary from './components/ErrorBoundary';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CustomThemeProvider } from './contexts/ThemeContext';
import { EmailBlurProvider } from './contexts/EmailBlurContext';
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
  Paper,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Tooltip
} from '@mui/material';
import PageTransition from './components/PageTransition';
import api from './utils/api';
import setupKeepAlive from './utils/keepAlive';
import TimelineNameDisplay from './components/timeline-v3/TimelineNameDisplay';

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
  const timelineListRef = React.useRef(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [timelineToDelete, setTimelineToDelete] = React.useState(null);
  const [timelines, setTimelines] = React.useState([]);
  const [filteredTimelines, setFilteredTimelines] = React.useState([]);
  const [loadingTimelines, setLoadingTimelines] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isSearching, setIsSearching] = React.useState(false);
  const [formData, setFormData] = React.useState({
    name: '',
    description: '',
    timeline_type: 'hashtag',
    visibility: 'public',
    timeline_mode: 'standard', // 'standard' | 'community' | 'personal' (frontend-only for now)
  });

  // Fetch timelines when component mounts
  React.useEffect(() => {
    const fetchTimelines = async () => {
      if (!user) return;
      
      try {
        setLoadingTimelines(true);
        const response = await api.get('/api/timeline-v3');
        // Sort timelines by creation date (newest first)
        const sortedTimelines = [...response.data].sort((a, b) => 
          new Date(b.created_at) - new Date(a.created_at)
        );
        setTimelines(sortedTimelines);
        setFilteredTimelines(sortedTimelines);
      } catch (error) {
        console.error('Error fetching timelines:', error);
      } finally {
        setLoadingTimelines(false);
      }
    };

    fetchTimelines();
  }, [user]);
  
  // Reset filtered timelines when search query is cleared
  React.useEffect(() => {
    if (searchQuery === '') {
      setFilteredTimelines(timelines);
      setIsSearching(false);
    }
  }, [searchQuery, timelines]);

  const handleDemoClick = () => {
    navigate('/timeline-v3/new');
  };

  const handleCreateClick = () => {
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setFormData({
      name: '',
      description: '',
      timeline_type: 'hashtag',
      visibility: 'public',
      timeline_mode: 'standard',
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    // Special handling: when changing timeline_type, keep visibility locked to 'public'
    // and only adjust frontend-only timeline_mode when needed.
    if (name === 'timeline_type') {
      // Map radio choice to backend-safe type and a frontend-only mode
      if (value === 'hashtag') {
        setFormData(prev => ({
          ...prev,
          timeline_type: 'hashtag',
          visibility: 'public',
          timeline_mode: 'standard',
        }));
        return;
      }

      if (value === 'community') {
        setFormData(prev => ({
          ...prev,
          timeline_type: 'community',
          visibility: 'public',
          timeline_mode: 'community',
        }));
        return;
      }

      if (value === 'personal') {
        setFormData(prev => ({
          ...prev,
          timeline_type: 'personal',
          visibility: 'public',
          timeline_mode: 'personal',
        }));
        return;
      }
    }

    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCreateTimeline = async () => {
    const rawName = formData.name.trim();
    if (!rawName) {
      alert('Please enter a timeline name');
      return;
    }

    try {
      setLoading(true);

      // Normalize to upper-case to match backend V2 uniqueness rules
      const normalizedName = rawName.toUpperCase();
      const type = formData.timeline_type;

      let existingTimeline = null;

      if (type === 'personal') {
        // Personal: unique per owner by (UPPER(name), type, created_by)
        existingTimeline = timelines.find(t =>
          (t.timeline_type || 'hashtag') === 'personal' &&
          t.created_by === (user ? user.id : undefined) &&
          (t.name || '').toUpperCase() === normalizedName
        );
      } else {
        // Hashtag & community: globally unique per type by (UPPER(name), type)
        existingTimeline = timelines.find(t =>
          (t.timeline_type || 'hashtag') === type &&
          (t.name || '').toUpperCase() === normalizedName
        );
      }

      if (existingTimeline) {
        if (type === 'personal') {
          throw new Error('You already have a personal timeline with this name.');
        } else {
          throw new Error('A timeline with this name already exists for this type.');
        }
      }

      // Convert timeline name to uppercase for consistency with backend normalization
      const response = await api.post('/api/timeline-v3', {
        name: normalizedName,
        description: formData.description.trim(),
        timeline_type: type,
        visibility: formData.visibility
      });

      // Add the new timeline to the list and update filtered timelines
      const newTimeline = response.data;
      const updatedTimelines = [newTimeline, ...timelines].sort((a, b) => 
        new Date(b.created_at) - new Date(a.created_at)
      );

      setTimelines(updatedTimelines);
      setFilteredTimelines(updatedTimelines);

      handleDialogClose();
      // Navigate to the new timeline
      navigate(`/timeline-v3/${newTimeline.id}`);
    } catch (error) {
      console.error('Error creating timeline:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to create timeline. Please try again.';
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
      
      // Remove the timeline from both lists
      const updatedTimelines = timelines.filter(t => t.id !== timelineToDelete.id);
      setTimelines(updatedTimelines);
      setFilteredTimelines(filteredTimelines.filter(t => t.id !== timelineToDelete.id));
      
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
  
  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };
  
  // Handle search submission (on Enter or button click)
  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault(); // Prevent form submission if called from form
    
    if (!searchQuery.trim()) {
      // If search is empty, show all timelines
      setFilteredTimelines(timelines);
      setIsSearching(false);
      return;
    }
    
    setIsSearching(true);
    
    // Filter timelines based on search query
    // Search in name and description, case insensitive
    const query = searchQuery.trim().toLowerCase();
    const results = timelines.filter(timeline => {
      const nameMatch = timeline.name.toLowerCase().includes(query);
      const descMatch = timeline.description && timeline.description.toLowerCase().includes(query);
      return nameMatch || descMatch;
    });
    
    // Sort results to prioritize exact matches in name, then by date
    const sortedResults = [...results].sort((a, b) => {
      // Check for exact match in name (case insensitive)
      const aExactMatch = a.name.toLowerCase() === query;
      const bExactMatch = b.name.toLowerCase() === query;
      
      // Check for starts with match
      const aStartsWithMatch = a.name.toLowerCase().startsWith(query);
      const bStartsWithMatch = b.name.toLowerCase().startsWith(query);
      
      // Prioritize exact matches first
      if (aExactMatch && !bExactMatch) return -1;
      if (!aExactMatch && bExactMatch) return 1;
      
      // Then prioritize 'starts with' matches
      if (aStartsWithMatch && !bStartsWithMatch) return -1;
      if (!aStartsWithMatch && bStartsWithMatch) return 1;
      
      // Finally sort by date (newest first) as a tiebreaker
      return new Date(b.created_at) - new Date(a.created_at);
    });
    
    // Limit results to top 10 (or whatever number is appropriate)
    const limitedResults = sortedResults.slice(0, 10);
    setFilteredTimelines(limitedResults);
    
    // Reset scroll position to top when search results update
    if (timelineListRef.current) {
      timelineListRef.current.scrollTop = 0;
    }
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
            : 'linear-gradient(180deg, #ffb199 0%, #ffd5c8 20%, #ffeae0 45%, #f7f4ea 75%, #f5f1e4 90%, #ffffff 100%)'
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
      <Box sx={{ 
        textAlign: 'center', 
        mb: 6,
        backgroundColor: theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.4)' : 'rgba(255, 255, 255, 0.7)',
        backdropFilter: 'blur(10px)',
        borderRadius: 3,
        p: 4,
        boxShadow: theme.palette.mode === 'dark' 
          ? '0 8px 32px rgba(0, 0, 0, 0.3)' 
          : '0 8px 32px rgba(0, 0, 0, 0.1)'
      }}>
        {user ? (
          <>
            <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
              Welcome back, {user.username}!
            </Typography>
            <Typography variant="h6" sx={{ mb: 3, color: 'text.secondary' }}>
              Track, organize, and share your important moments with iTimeline
            </Typography>
            <Stack spacing={3} direction={{ xs: 'column', sm: 'row' }} justifyContent="center" sx={{ mt: 4 }}>
              <Button 
                variant="contained" 
                color="primary" 
                size="large"
                onClick={handleCreateClick}
                sx={{
                  px: 4,
                  py: 1.5,
                  borderRadius: 2,
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'translateY(-3px)',
                    boxShadow: 4
                  }
                }}
              >
                Create New Timeline
              </Button>
              <Button 
                variant="outlined" 
                color="primary" 
                size="large"
                onClick={handleDemoClick}
                sx={{
                  px: 4,
                  py: 1.5,
                  borderRadius: 2,
                  fontSize: '1.1rem',
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'translateY(-3px)',
                    boxShadow: 2
                  }
                }}
              >
                Try Timeline V3 Beta
              </Button>
            </Stack>
          </>
        ) : (
          <>
            <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
              Welcome to iTimeline
            </Typography>
            <Typography variant="h6" sx={{ mb: 3, color: 'text.secondary' }}>
              Create and explore timelines with our intuitive interface
            </Typography>
          </>
        )}
      </Box>

      {user && (
        <>
          <Box sx={{ 
            mt: 6, 
            mb: 4, 
            display: 'flex',
            flexDirection: 'column',
            width: '400px', // Fixed width for the timeline panel
            maxWidth: '100%', // Ensures it doesn't overflow on small screens
            backgroundColor: theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.4)' : 'rgba(255, 255, 255, 0.7)',
            backdropFilter: 'blur(10px)',
            borderRadius: 3,
            p: 3,
            boxShadow: theme.palette.mode === 'dark' 
              ? '0 8px 32px rgba(0, 0, 0, 0.3)' 
              : '0 8px 32px rgba(0, 0, 0, 0.1)'
          }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h4" sx={{ fontWeight: 'medium' }}>
                Timelines
              </Typography>
              <Button 
                variant="outlined" 
                color="primary"
                onClick={handleCreateClick}
                startIcon={<Box component="span" sx={{ fontSize: '1.5rem' }}>+</Box>}
                sx={{ borderRadius: 2 }}
              >
                New
              </Button>
            </Box>
            
            {/* Search bar with submit button */}
            <Box 
              component="form" 
              onSubmit={handleSearchSubmit}
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                mb: 3,
                position: 'relative'
              }}
            >
              <TextField
                placeholder="Search timelines..."
                variant="outlined"
                fullWidth
                size="small"
                value={searchQuery}
                onChange={handleSearchChange}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSearchSubmit(e);
                  }
                }}
                sx={{ 
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    backgroundColor: theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.7)',
                    pr: 5, // Add padding for the button
                  }
                }}
              />
              <IconButton 
                type="submit"
                aria-label="search"
                onClick={handleSearchSubmit}
                sx={{ 
                  position: 'absolute',
                  right: 8,
                  color: theme.palette.primary.main,
                  '&:hover': {
                    backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                  }
                }}
              >
                {/* Search/Arrow icon */}
                <Box 
                  component="span" 
                  sx={{ 
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M15 10L20 15L15 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M4 4V10C4 12.2091 5.79086 14 8 14H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </Box>
              </IconButton>
            </Box>
            
            {/* Search results indicator */}
            {isSearching && (
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                  {filteredTimelines.length === 0 
                    ? 'No results found' 
                    : filteredTimelines.length === 1
                      ? '1 result found'
                      : `${filteredTimelines.length} results found`}
                  {filteredTimelines.length === 10 && ' (showing top 10)'}
                </Typography>
                {filteredTimelines.length > 0 && (
                  <Button 
                    size="small" 
                    variant="text" 
                    onClick={() => {
                      setSearchQuery('');
                      setFilteredTimelines(timelines);
                      setIsSearching(false);
                    }}
                    sx={{ ml: 1, minWidth: 'auto', p: 0.5 }}
                  >
                    Clear
                  </Button>
                )}
              </Box>
            )}
            
            {loadingTimelines ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 4, py: 2 }}>
                <CircularProgress size={40} />
              </Box>
            ) : filteredTimelines.length > 0 ? (
              <Box 
                ref={timelineListRef}
                sx={{ 
                  overflowY: 'auto', 
                  maxHeight: '500px',
                  pr: 1,
                  // Custom scrollbar styling
                  '&::-webkit-scrollbar': {
                    width: '8px',
                  },
                  '&::-webkit-scrollbar-track': {
                    backgroundColor: 'transparent',
                  },
                  '&::-webkit-scrollbar-thumb': {
                    backgroundColor: theme.palette.mode === 'dark' 
                      ? 'rgba(255, 255, 255, 0.2)' 
                      : 'rgba(0, 0, 0, 0.2)',
                    borderRadius: '4px',
                  },
                }}
              >
                <Stack spacing={2}>
                  {filteredTimelines.map(timeline => (
                    <Card 
                      key={timeline.id}
                      sx={{ 
                        display: 'flex', 
                        flexDirection: 'column',
                        backgroundColor: theme.palette.mode === 'dark' ? 'rgba(10, 17, 40, 0.6)' : 'rgba(255, 255, 255, 0.8)',
                        backdropFilter: 'blur(10px)',
                        borderRadius: 2,
                        overflow: 'hidden',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                        '&:hover': {
                          transform: 'translateY(-3px)',
                          boxShadow: theme.palette.mode === 'dark' 
                            ? '0 8px 25px rgba(0, 0, 0, 0.4)' 
                            : '0 8px 25px rgba(0, 0, 0, 0.1)'
                        }
                      }}
                    >
                      {/* Colored accent bar at top of card */}
                      <Box sx={{ height: 4, bgcolor: 'primary.main' }} />
                      
                      <CardContent sx={{ p: 2, pb: 1 }}>
                        <TimelineNameDisplay
                          name={timeline.name}
                          type={timeline.timeline_type || 'hashtag'}
                          visibility={timeline.visibility || 'public'}
                          typographyProps={{
                            variant: "h6",
                            fontWeight: 'bold',
                            fontSize: '1rem'
                          }}
                        />
                        {timeline.description && (
                          <Typography variant="body2" color="text.secondary" sx={{ 
                            mt: 1,
                            // Limit to 2 lines with ellipsis
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}>
                            {timeline.description}
                          </Typography>
                        )}
                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, mb: 1 }}>
                          <Box 
                            component="span" 
                            sx={{ 
                              width: 6, 
                              height: 6, 
                              borderRadius: '50%', 
                              bgcolor: 'primary.main',
                              display: 'inline-block',
                              mr: 1
                            }} 
                          />
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                            Created: {formatDate(timeline.created_at)}
                          </Typography>
                        </Box>
                      </CardContent>
                      
                      <CardActions sx={{ p: 2, pt: 0, justifyContent: 'flex-end' }}>
                        <Button 
                          variant="contained"
                          color="primary"
                          size="small"
                          onClick={() => navigate(`/timeline-v3/${timeline.id}`)}
                          sx={{ 
                            borderRadius: 2,
                            px: 2,
                            py: 0.5,
                            fontSize: '0.8rem',
                            fontWeight: 'medium',
                          }}
                        >
                          Open
                        </Button>
                      </CardActions>
                    </Card>
                  ))}
                </Stack>
              </Box>
            ) : (
              <Box sx={{ 
                textAlign: 'center', 
                my: 4, 
                py: 4,
                backgroundColor: theme.palette.mode === 'dark' ? 'rgba(10, 17, 40, 0.3)' : 'rgba(255, 255, 255, 0.5)',
                borderRadius: 2,
                border: '1px dashed',
                borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
              }}>
                <Box sx={{ mb: 2 }}>
                  <Box 
                    component="span"
                    sx={{ 
                      fontSize: '2rem', 
                      color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.2)',
                      display: 'block',
                      mb: 1
                    }}
                  >
                    📅
                  </Box>
                </Box>
                <Typography variant="h6" sx={{ mb: 1, fontSize: '1rem' }}>
                  No Timelines Yet
                </Typography>
                <Typography color="text.secondary" sx={{ mb: 2, fontSize: '0.9rem' }}>
                  Create your first timeline to start organizing events.
                </Typography>
                <Button 
                  variant="contained" 
                  color="primary" 
                  size="small"
                  onClick={handleCreateClick}
                  startIcon={<Box component="span" sx={{ fontSize: '1rem' }}>+</Box>}
                  sx={{ 
                    mt: 1,
                    borderRadius: 2,
                    px: 2
                  }}
                >
                  Create Timeline
                </Button>
              </Box>
            )}
          </Box>
          
          <Divider sx={{ my: 4 }} />
          <Typography variant="h5" sx={{ mb: 3 }}>
            Audio Visualizer Test
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Use this tool to test audio uploads and visualization. This helps develop and diagnose the audio media handling functionality.
          </Typography>
          <AudioTester />
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
                mb: 3,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.5)',
                }
              }}
            />
            
            <FormControl component="fieldset" sx={{ mb: 2 }}>
              <FormLabel component="legend" sx={{ mb: 1, color: theme.palette.text.secondary }}>
                Timeline Type
              </FormLabel>
              <RadioGroup
                row
                name="timeline_type"
                value={formData.timeline_mode === 'personal' ? 'personal' : formData.timeline_type}
                onChange={handleInputChange}
              >
                <Tooltip title="Standard timeline with hashtag-based organization">
                  <FormControlLabel 
                    value="hashtag" 
                    control={<Radio />} 
                    label="Hashtag Timeline" 
                  />
                </Tooltip>
                <Tooltip title="Community timeline with member management and post sharing">
                  <FormControlLabel 
                    value="community" 
                    control={<Radio />} 
                    label="Community Timeline" 
                  />
                </Tooltip>
                <Tooltip title="Coming soon: personal space for your own posts" disableHoverListener={false}>
                  <FormControlLabel 
                    value="personal" 
                    control={<Radio />} 
                    label="Personal Timeline" 
                  />
                </Tooltip>
              </RadioGroup>
            </FormControl>
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
    <AuthProvider>
      <CustomThemeProvider>
        <EmailBlurProvider>
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
                  <AuthRoute>
                    <Box sx={{ pt: 8 }}>
                      <Login />
                    </Box>
                  </AuthRoute>
                } />
                <Route path="/register" element={
                  <AuthRoute>
                    <Box sx={{ pt: 8 }}>
                      <Register />
                    </Box>
                  </AuthRoute>
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
                      <ErrorBoundary onReset={() => window.location.reload()}>
                        <TimelineV3 />
                      </ErrorBoundary>
                    </ProtectedRoute>
                  </Box>
                } />
                <Route path="/timeline-v3/:username/:slug" element={
                  <Box sx={{ pt: 8 }}>
                    <ProtectedRoute>
                      <PersonalTimelineWrapper />
                    </ProtectedRoute>
                  </Box>
                } />
                <Route path="/timeline-v3/:username/:slug/:id" element={
                  <Box sx={{ pt: 8 }}>
                    <ProtectedRoute>
                      <ErrorBoundary onReset={() => window.location.reload()}>
                        <TimelineV3 />
                      </ErrorBoundary>
                    </ProtectedRoute>
                  </Box>
                } />
                <Route path="/timeline-v3/:id/members" element={
                  <Box sx={{ pt: 8 }}>
                    <ProtectedRoute>
                      <MemberListTab />
                    </ProtectedRoute>
                  </Box>
                } />
                <Route path="/timeline-v3/:id/admin" element={
                  <Box sx={{ pt: 8 }}>
                    <ProtectedRoute>
                      <AdminPanel />
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
        </EmailBlurProvider>
      </CustomThemeProvider>
    </AuthProvider>
  );
}

export default App;
