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
  Typography,
  Grid,
  IconButton,
  Paper,
  Chip,
  InputAdornment,
} from '@mui/material';
import { Close as CloseIcon, Search as SearchIcon } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';

const HERO_ROTATE_MS = 120000;

const HomePageRuntime = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const theme = useTheme();

  const [loading, setLoading] = React.useState(false);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [timelines, setTimelines] = React.useState([]);
  const [loadingTimelines, setLoadingTimelines] = React.useState(true);
  const [heroIndex, setHeroIndex] = React.useState(0);
  const [timelineSearch, setTimelineSearch] = React.useState('');
  const [visibleTimelineCount, setVisibleTimelineCount] = React.useState(18);
  const [formData, setFormData] = React.useState({ name: '', description: '' });

  React.useEffect(() => {
    const fetchTimelines = async () => {
      if (!user) return;
      try {
        setLoadingTimelines(true);
        const response = await api.get('/api/timeline-v3');
        setTimelines(response.data || []);
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

  const normalizedTimelines = React.useMemo(() => {
    return [...timelines].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
  }, [timelines]);

  const spotlightTimeline = React.useMemo(() => {
    if (!normalizedTimelines.length) return null;
    const dayBucket = Math.floor(Date.now() / (24 * 60 * 60 * 1000));
    return normalizedTimelines[dayBucket % normalizedTimelines.length];
  }, [normalizedTimelines]);

  const filteredTimelines = React.useMemo(() => {
    const q = timelineSearch.trim().toLowerCase();
    if (!q) return normalizedTimelines;
    return normalizedTimelines.filter((t) => {
      const name = String(t?.name || '').toLowerCase();
      const desc = String(t?.description || '').toLowerCase();
      return name.includes(q) || desc.includes(q);
    });
  }, [normalizedTimelines, timelineSearch]);

  const visibleTimelines = React.useMemo(() => filteredTimelines.slice(0, visibleTimelineCount), [filteredTimelines, visibleTimelineCount]);

  const handleHubScroll = (e) => {
    const el = e.currentTarget;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 120 && visibleTimelineCount < filteredTimelines.length) {
      setVisibleTimelineCount((prev) => Math.min(prev + 12, filteredTimelines.length));
    }
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setFormData({ name: '', description: '' });
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
      alert(error.response?.data?.error || 'Failed to create timeline. Please try again.');
    } finally {
      setLoading(false);
    }
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
          background:
            theme.palette.mode === 'dark'
              ? 'linear-gradient(180deg, #000000 0%, #0a1128 50%, #1a2456 100%)'
              : 'linear-gradient(180deg, #ffd5c8 0%, #ffeae0 40%, #f7f4ea 75%, #f5f1e4 90%, #ffffff 100%)',
        }}
      />

      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          minHeight: 'calc(100vh - 78px)',
          height: { xs: 'auto', md: 'calc(100vh - 78px)' },
          pt: 4,
          px: { xs: 1.5, md: 4 },
          pb: { xs: 2, md: 3 },
          position: 'relative',
          zIndex: 1,
          gap: 2,
        }}
      >
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2, md: 3 },
            borderRadius: 3,
            border: '1px solid',
            borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
            background: theme.palette.mode === 'dark'
              ? 'linear-gradient(135deg, rgba(25,35,70,0.7) 0%, rgba(15,20,35,0.75) 70%)'
              : 'linear-gradient(135deg, rgba(255,255,255,0.83) 0%, rgba(255,246,238,0.92) 70%)',
          }}
        >
          <Typography variant="h3" sx={{ fontWeight: 800, fontSize: { xs: '1.8rem', md: '2.8rem' } }}>
            {heroIndex === 0 ? 'Welcome to Timeline Forum' : 'Timeline Spotlight of the Day'}
          </Typography>
          <Typography variant="body1" sx={{ mt: 1, opacity: 0.88 }}>
            {heroIndex === 0
              ? 'Create and explore timelines with the V3 interface.'
              : spotlightTimeline?.description || 'No timelines are available yet.'}
          </Typography>

          {heroIndex === 0 && user ? (
            <Stack spacing={1.5} direction={{ xs: 'column', sm: 'row' }} sx={{ mt: 2 }}>
              <Button variant="contained" onClick={() => navigate('/timeline-v3/new')}>Try Timeline V3 Beta</Button>
              <Button variant="outlined" onClick={() => setDialogOpen(true)}>Create Your Timeline</Button>
            </Stack>
          ) : null}

          {heroIndex === 1 && spotlightTimeline ? (
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mt: 2 }}>
              <Chip label={`Created ${formatDate(spotlightTimeline.created_at)}`} variant="outlined" />
              <Button variant="contained" onClick={() => navigate(`/timeline-v3/${spotlightTimeline.id}`)}>Open Spotlight Timeline</Button>
            </Stack>
          ) : null}

          <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 2 }}>
            {[0, 1].map((dotIndex) => (
              <Box
                key={dotIndex}
                component="button"
                type="button"
                onClick={() => setHeroIndex(dotIndex)}
                aria-label={`Hero slide ${dotIndex + 1}`}
                sx={{
                  width: dotIndex === heroIndex ? 26 : 10,
                  height: 10,
                  borderRadius: 99,
                  border: 'none',
                  cursor: 'pointer',
                  bgcolor: dotIndex === heroIndex ? 'primary.main' : 'text.disabled',
                }}
              />
            ))}
            <Typography variant="caption" color="text.secondary">Auto-rotates every 2 minutes</Typography>
          </Stack>
        </Paper>

        <Box sx={{ flex: 1, minHeight: 0, display: 'grid', gridTemplateColumns: { xs: '1fr', md: '280px minmax(0, 1fr)' }, gap: 2, overflow: 'hidden' }}>
          <Paper
            elevation={0}
            sx={{
              borderRadius: 3,
              p: 1.25,
              border: '1px solid',
              borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
              backgroundColor: theme.palette.mode === 'dark' ? 'rgba(10,12,20,0.72)' : 'rgba(255,255,255,0.78)',
            }}
          >
            <Button startIcon={<SearchIcon />} variant="contained" sx={{ justifyContent: 'flex-start', borderRadius: 2, minWidth: { xs: '220px', md: 0 } }}>
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
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5 }}>Timeline Search Hub</Typography>
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
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" sx={{ opacity: 0.65 }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>

            <Box sx={{ p: 2, overflowY: 'auto', flex: 1, minHeight: 0 }} onScroll={handleHubScroll}>
              {loadingTimelines ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
              ) : visibleTimelines.length > 0 ? (
                <Grid container spacing={2}>
                  {visibleTimelines.map((timeline) => (
                    <Grid item xs={12} sm={6} xl={4} key={timeline.id}>
                      <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <CardContent sx={{ flexGrow: 1 }}>
                          <Typography variant="h6" gutterBottom>{timeline.name}</Typography>
                          {timeline.description ? (
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>{timeline.description}</Typography>
                          ) : null}
                          <Typography variant="caption" color="text.secondary">Created: {formatDate(timeline.created_at)}</Typography>
                        </CardContent>
                        <Box sx={{ px: 2, pb: 2 }}>
                          <Button size="small" variant="contained" onClick={() => navigate(`/timeline-v3/${timeline.id}`)}>Open Timeline</Button>
                        </Box>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Box sx={{ py: 6, textAlign: 'center' }}><Typography color="text.secondary">No timelines matched your search.</Typography></Box>
              )}

              {!loadingTimelines && visibleTimelineCount < filteredTimelines.length ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                  <Button variant="outlined" onClick={() => setVisibleTimelineCount((prev) => Math.min(prev + 12, filteredTimelines.length))}>Load More</Button>
                </Box>
              ) : null}
            </Box>
          </Paper>
        </Box>

        <Dialog open={dialogOpen} onClose={handleDialogClose} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            Create New Timeline
            <IconButton onClick={handleDialogClose} size="small"><CloseIcon /></IconButton>
          </DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              name="name"
              label="Timeline Name"
              fullWidth
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              sx={{ mb: 2 }}
            />
            <TextField
              name="description"
              label="Description"
              fullWidth
              multiline
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleDialogClose} disabled={loading}>Cancel</Button>
            <Button onClick={handleCreateTimeline} variant="contained" disabled={loading}>
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Create Timeline'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </>
  );
};

export default HomePageRuntime;
