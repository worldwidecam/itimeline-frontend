import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import {
  CircularProgress,
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Stack,
  Card,
  CardContent,
  Chip,
  Typography,
  Grid,
  IconButton,
  Paper,
} from '@mui/material';
import { Close as CloseIcon, Search as SearchIcon } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';

const HERO_ROTATE_MS = 120000;
const HUB_MODE = {
  TIMELINE_SEARCH: 'TIMELINE_SEARCH',
};

const HomePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const theme = useTheme();
  const [loading, setLoading] = React.useState(false);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [timelines, setTimelines] = React.useState([]);
  const [loadingTimelines, setLoadingTimelines] = React.useState(true);
  const [heroIndex, setHeroIndex] = React.useState(0);
  const [activeHubMode, setActiveHubMode] = React.useState(HUB_MODE.TIMELINE_SEARCH);
  const [timelineSearch, setTimelineSearch] = React.useState('');
  const [visibleTimelineCount, setVisibleTimelineCount] = React.useState(18);
  const [formData, setFormData] = React.useState({
    name: '',
    description: '',
  });

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

  React.useEffect(() => {
    const timer = window.setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % 2);
    }, HERO_ROTATE_MS);

    return () => window.clearInterval(timer);
  }, []);

  const handleDemoClick = () => {
    navigate('/timeline-v3/new');
  };

  const handleCreateClick = () => {
    setDialogOpen(true);
  };

  const handleHeroDotClick = (index) => {
    setHeroIndex(index);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setFormData({ name: '', description: '' });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
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
        name: formData.name.trim().toUpperCase(),
        description: formData.description.trim(),
      });

      setTimelines((prev) => [response.data, ...prev]);

      handleDialogClose();
      navigate(`/timeline-v3/${response.data.id}`);
    } catch (error) {
      console.error('Error creating timeline:', error);
      const errorMessage = error.response?.data?.error || 'Failed to create timeline. Please try again.';
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleHubModeChange = (mode) => {
    setActiveHubMode(mode);
    setVisibleTimelineCount(18);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const normalizeTimelines = React.useMemo(
    () => [...timelines].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)),
    [timelines],
  );

  const spotlightTimeline = React.useMemo(() => {
    if (!normalizeTimelines.length) return null;
    const now = new Date();
    const dayBucket = Math.floor(now.getTime() / (24 * 60 * 60 * 1000));
    return normalizeTimelines[dayBucket % normalizeTimelines.length];
  }, [normalizeTimelines]);

  const filteredTimelines = React.useMemo(() => {
    const query = timelineSearch.trim().toLowerCase();
    if (!query) return normalizeTimelines;

    return normalizeTimelines.filter((timeline) => {
      const name = String(timeline?.name || '').toLowerCase();
      const description = String(timeline?.description || '').toLowerCase();
      return name.includes(query) || description.includes(query);
    });
  }, [normalizeTimelines, timelineSearch]);

  const visibleTimelines = React.useMemo(
    () => filteredTimelines.slice(0, visibleTimelineCount),
    [filteredTimelines, visibleTimelineCount],
  );

  const handleHubScroll = (e) => {
    const el = e.currentTarget;
    const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 120;
    if (nearBottom && visibleTimelineCount < filteredTimelines.length) {
      setVisibleTimelineCount((prev) => Math.min(prev + 12, filteredTimelines.length));
    }
  };

  return (
    <>
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
            : 'linear-gradient(180deg, #ffd5c8 0%, #ffeae0 40%, #f7f4ea 75%, #f5f1e4 90%, #ffffff 100%)',
        }}
      />
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          height: { xs: 'auto', md: 'calc(100vh - 78px)' },
          pt: 4,
          px: { xs: 1.5, md: 4 },
          pb: { xs: 2, md: 3 },
          position: 'relative',
          zIndex: 1,
          backgroundColor: 'transparent',
          gap: 2.5,
          minHeight: 'calc(100vh - 78px)',
        }}
      >
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2, md: 3.5 },
            borderRadius: 3,
            border: '1px solid',
            borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
            background: theme.palette.mode === 'dark'
              ? 'linear-gradient(135deg, rgba(25,35,70,0.7) 0%, rgba(15,20,35,0.75) 70%)'
              : 'linear-gradient(135deg, rgba(255,255,255,0.83) 0%, rgba(255,246,238,0.92) 70%)',
            boxShadow: theme.palette.mode === 'dark'
              ? '0 16px 45px rgba(0,0,0,0.35)'
              : '0 16px 45px rgba(140, 95, 75, 0.17)',
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          <Box>
            <Typography variant="h3" sx={{ fontWeight: 800, fontSize: { xs: '1.8rem', md: '2.8rem' } }}>
              {heroIndex === 0 ? 'Welcome to Timeline Forum' : 'Timeline Spotlight of the Day'}
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.88, maxWidth: 760 }}>
              {heroIndex === 0
                ? 'Create and explore timelines with the V3 interface.'
                : spotlightTimeline?.description || 'No timelines are available yet.'}
            </Typography>
            {heroIndex === 0 && user ? (
              <Stack spacing={1.5} direction={{ xs: 'column', sm: 'row' }} sx={{ mt: 0.5 }}>
                <Button variant="contained" color="primary" onClick={handleDemoClick}>
                  Try Timeline V3 Beta
                </Button>
                <Button variant="outlined" color="primary" onClick={handleCreateClick}>
                  Create Your Timeline
                </Button>
              </Stack>
            ) : null}
            {heroIndex === 1 && spotlightTimeline ? (
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mt: 1 }}>
                <Chip label={`Created ${formatDate(spotlightTimeline.created_at)}`} color="default" variant="outlined" />
                <Button variant="contained" onClick={() => navigate(`/timeline-v3/${spotlightTimeline.id}`)}>
                  Open Spotlight Timeline
                </Button>
              </Stack>
            ) : null}
          </Box>

          <Stack direction="row" spacing={1} alignItems="center" sx={{ pt: 0.5 }}>
            {[0, 1].map((dotIndex) => (
              <Box
                key={dotIndex}
                component="button"
                type="button"
                aria-label={`Hero slide ${dotIndex + 1}`}
                onClick={() => handleHeroDotClick(dotIndex)}
                sx={{
                  width: dotIndex === heroIndex ? 26 : 10,
                  height: 10,
                  borderRadius: 99,
                  border: 'none',
                  p: 0,
                  cursor: 'pointer',
                  bgcolor: dotIndex === heroIndex ? 'primary.main' : 'text.disabled',
                  transition: 'all 0.24s ease',
                }}
              />
            ))}
            <Typography variant="caption" color="text.secondary" sx={{ ml: 0.75 }}>
              Auto-rotates every 2 minutes
            </Typography>
          </Stack>
        </Paper>

        <Box
          sx={{
            flex: 1,
            minHeight: { xs: 0, md: 0 },
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '280px minmax(0, 1fr)' },
            gap: 2,
            overflow: 'hidden',
          }}
        >
          <Paper
            elevation={0}
            sx={{
              borderRadius: 3,
              p: 1.25,
              border: '1px solid',
              borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
              backgroundColor: theme.palette.mode === 'dark' ? 'rgba(10,12,20,0.72)' : 'rgba(255,255,255,0.78)',
              display: 'flex',
              flexDirection: { xs: 'row', md: 'column' },
              alignItems: 'stretch',
              gap: 1,
              overflowX: { xs: 'auto', md: 'hidden' },
            }}
          >
            <Button
              onClick={() => handleHubModeChange(HUB_MODE.TIMELINE_SEARCH)}
              variant={activeHubMode === HUB_MODE.TIMELINE_SEARCH ? 'contained' : 'text'}
              startIcon={<SearchIcon />}
              sx={{
                justifyContent: 'flex-start',
                borderRadius: 2,
                whiteSpace: 'nowrap',
                minWidth: { xs: '220px', md: 0 },
              }}
            >
              TIMELINE SEARCH
            </Button>
          </Paper>

          <Paper
            elevation={0}
            sx={{
              borderRadius: 3,
              border: '1px solid',
              borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
              backgroundColor: theme.palette.mode === 'dark' ? 'rgba(9,11,18,0.72)' : 'rgba(255,255,255,0.82)',
              display: 'flex',
              flexDirection: 'column',
              minHeight: 0,
              overflow: 'hidden',
            }}
          >
            <Box sx={{ p: 2, borderBottom: '1px solid', borderBottomColor: 'divider' }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5 }}>
                Timeline Search Hub
              </Typography>
              <TextField
                fullWidth
                size="small"
                value={timelineSearch}
                onChange={(e) => {
                  setTimelineSearch(e.target.value);
                  setVisibleTimelineCount(18);
                }}
                placeholder="Search timelines by name or description"
                InputProps={{
                  startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1, opacity: 0.65 }} />,
                }}
              />
            </Box>

            <Box sx={{ p: 2, overflowY: 'auto', flex: 1, minHeight: 0 }} onScroll={handleHubScroll}>
              {loadingTimelines ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                  <CircularProgress />
                </Box>
              ) : visibleTimelines.length > 0 ? (
                <Grid container spacing={2}>
                  {visibleTimelines.map((timeline) => (
                    <Grid item xs={12} sm={6} xl={4} key={timeline.id}>
                      <Card
                        sx={{
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          backgroundColor: theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.6)' : 'rgba(255, 255, 255, 0.9)',
                          backdropFilter: 'blur(8px)',
                          boxShadow: theme.palette.mode === 'dark'
                            ? '0 8px 25px rgba(0, 0, 0, 0.3)'
                            : '0 8px 25px rgba(0, 0, 0, 0.08)',
                        }}
                      >
                        <CardContent sx={{ flexGrow: 1 }}>
                          <Typography variant="h6" gutterBottom>
                            {timeline.name}
                          </Typography>
                          {timeline.description ? (
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                              {timeline.description}
                            </Typography>
                          ) : null}
                          <Typography variant="caption" color="text.secondary">
                            Created: {formatDate(timeline.created_at)}
                          </Typography>
                        </CardContent>
                        <Box sx={{ px: 2, pb: 2 }}>
                          <Button
                            size="small"
                            variant="contained"
                            color="primary"
                            onClick={() => navigate(`/timeline-v3/${timeline.id}`)}
                          >
                            Open Timeline
                          </Button>
                        </Box>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Box sx={{ py: 6, textAlign: 'center' }}>
                  <Typography color="text.secondary">
                    No timelines matched your search.
                  </Typography>
                </Box>
              )}

              {!loadingTimelines && visibleTimelineCount < filteredTimelines.length ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                  <Button
                    variant="outlined"
                    onClick={() => setVisibleTimelineCount((prev) => Math.min(prev + 12, filteredTimelines.length))}
                  >
                    Load More
                  </Button>
                </Box>
              ) : null}
            </Box>
          </Paper>
        </Box>

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
            },
          }}
        >
          <Box
            sx={{
              position: 'relative',
              height: 8,
              bgcolor: theme.palette.primary.main,
              mb: -1,
            }}
          />
          <DialogTitle
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              p: 3,
              pb: 2,
            }}
          >
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
                  color: theme.palette.primary.main,
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
                bgcolor: theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.02)',
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
                  },
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
                  },
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
                },
              }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Create Timeline'}
            </Button>
          </DialogActions>
        </Dialog>

      </Box>
    </>
  );
};

export default HomePage;
