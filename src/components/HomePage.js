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
  IconButton,
  Paper,
  Chip,
  InputAdornment,
} from '@mui/material';
import {
  Close as CloseIcon,
  Search as SearchIcon,
  ArrowForward as ArrowForwardIcon,
  Tag as TagIcon,
  Groups as GroupsIcon,
  Person as PersonIcon,
  Article as ArticleIcon,
  Newspaper as NewspaperIcon,
  PermMedia as PermMediaIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';

const HERO_ROTATE_MS = 90000;
const HERO_SLIDE_COUNT = 2;
const HERO_CONTENT_FADE_MS = 180;
const HOME_NAVBAR_OFFSET_PX = 78;

const LEFT_HUB_TABS = [
  { key: 'timeline-search', label: 'SEARCH', icon: SearchIcon },
  { key: 'post-search', label: 'POST SEARCH', icon: ArticleIcon, soon: true },
  { key: 'news-search', label: 'NEWS SEARCH', icon: NewspaperIcon, soon: true },
  { key: 'media-search', label: 'MEDIA SEARCH', icon: PermMediaIcon, soon: true },
];

const SEARCH_SUB_FILTERS = [
  { key: 'all', label: 'All', mode: 'mixed' },
  { key: 'timelines', label: 'TIMELINES', mode: 'timeline' },
  { key: 'posts', label: 'POSTS', mode: 'post' },
  { key: 'users', label: 'USERS', mode: 'user' },
];

const HomePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const theme = useTheme();
  const resultsScrollRef = React.useRef(null);
  const heroTransitionTimeoutRef = React.useRef(null);
  const hubTransitionTimeoutRef = React.useRef(null);

  const [loading, setLoading] = React.useState(false);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [timelines, setTimelines] = React.useState([]);
  const [loadingTimelines, setLoadingTimelines] = React.useState(true);
  const [heroIndex, setHeroIndex] = React.useState(0);
  const [isHeroContentVisible, setIsHeroContentVisible] = React.useState(true);
  const [activeHubTab, setActiveHubTab] = React.useState('timeline-search');
  const [isHubContentVisible, setIsHubContentVisible] = React.useState(true);
  const [searchSubFilter, setSearchSubFilter] = React.useState('all');
  const [timelineSearchInput, setTimelineSearchInput] = React.useState('');
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

  const transitionToHeroSlide = React.useCallback(
    (nextIndex) => {
      if (nextIndex === heroIndex) return;

      if (heroTransitionTimeoutRef.current) {
        window.clearTimeout(heroTransitionTimeoutRef.current);
      }

      setIsHeroContentVisible(false);
      heroTransitionTimeoutRef.current = window.setTimeout(() => {
        setHeroIndex(nextIndex);
        setIsHeroContentVisible(true);
      }, HERO_CONTENT_FADE_MS);
    },
    [heroIndex],
  );

  React.useEffect(() => {
    const timer = window.setTimeout(() => {
      transitionToHeroSlide((heroIndex + 1) % HERO_SLIDE_COUNT);
    }, HERO_ROTATE_MS);

    return () => {
      window.clearTimeout(timer);
    };
  }, [heroIndex, transitionToHeroSlide]);

  React.useEffect(
    () => () => {
      if (heroTransitionTimeoutRef.current) {
        window.clearTimeout(heroTransitionTimeoutRef.current);
      }
      if (hubTransitionTimeoutRef.current) {
        window.clearTimeout(hubTransitionTimeoutRef.current);
      }
    },
    [],
  );

  const transitionToHubTab = React.useCallback(
    (nextTab) => {
      if (nextTab === activeHubTab) return;

      if (hubTransitionTimeoutRef.current) {
        window.clearTimeout(hubTransitionTimeoutRef.current);
      }

      setIsHubContentVisible(false);
      hubTransitionTimeoutRef.current = window.setTimeout(() => {
        setActiveHubTab(nextTab);
        setIsHubContentVisible(true);
      }, 170);
    },
    [activeHubTab],
  );

  const hasSearchQuery = timelineSearch.trim().length > 0;
  const isTimelineSearchScope = searchSubFilter === 'all' || searchSubFilter === 'timelines';

  const normalizedTimelines = React.useMemo(() => {
    return [...timelines].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
  }, [timelines]);

  const matchingPreviewCount = React.useMemo(() => {
    const previewQuery = timelineSearchInput.trim().toLowerCase();
    if (!previewQuery) return 0;
    if (!isTimelineSearchScope) return 0;

    return normalizedTimelines.filter((timeline) => {
      const name = String(timeline?.name || '').toLowerCase();
      const description = String(timeline?.description || '').toLowerCase();
      return name.includes(previewQuery) || description.includes(previewQuery);
    }).length;
  }, [timelineSearchInput, isTimelineSearchScope, normalizedTimelines]);

  const spotlightTimeline = React.useMemo(() => {
    if (!normalizedTimelines.length) return null;
    const dayBucket = Math.floor(Date.now() / (24 * 60 * 60 * 1000));
    return normalizedTimelines[dayBucket % normalizedTimelines.length];
  }, [normalizedTimelines]);

  const filteredTimelines = React.useMemo(() => {
    if (!isTimelineSearchScope) return [];

    if (!hasSearchQuery) return [];

    const q = timelineSearch.trim().toLowerCase();
    const rankTimeline = (timeline) => {
      const name = String(timeline?.name || '').toLowerCase();
      const description = String(timeline?.description || '').toLowerCase();

      if (name === q) return 0;
      if (name.startsWith(q)) return 1;
      if (name.includes(q)) return 2;
      if (description.includes(q)) return 3;
      return 999;
    };

    return normalizedTimelines
      .map((timeline) => ({
        timeline,
        rank: rankTimeline(timeline),
      }))
      .filter((entry) => entry.rank < 999)
      .sort((a, b) => {
        if (a.rank !== b.rank) return a.rank - b.rank;
        const aNameLength = String(a.timeline?.name || '').length;
        const bNameLength = String(b.timeline?.name || '').length;
        if (aNameLength !== bNameLength) return aNameLength - bNameLength;
        return new Date(b.timeline?.created_at || 0) - new Date(a.timeline?.created_at || 0);
      })
      .map((entry) => entry.timeline);
  }, [normalizedTimelines, timelineSearch, isTimelineSearchScope, hasSearchQuery]);

  const visibleTimelines = React.useMemo(() => {
    return filteredTimelines.slice(0, visibleTimelineCount);
  }, [filteredTimelines, visibleTimelineCount]);

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

  const handleHubScroll = (e) => {
    const el = e.currentTarget;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 120 && visibleTimelineCount < filteredTimelines.length) {
      setVisibleTimelineCount((prev) => Math.min(prev + 12, filteredTimelines.length));
    }
  };

  const handleSearchSubFilterChange = (nextFilter) => {
    setSearchSubFilter(nextFilter);
    setVisibleTimelineCount(18);
    if (resultsScrollRef.current) {
      resultsScrollRef.current.scrollTop = 0;
    }
  };

  const handleSearchChange = (e) => {
    setTimelineSearchInput(e.target.value);
    setVisibleTimelineCount(18);
    if (resultsScrollRef.current) {
      resultsScrollRef.current.scrollTop = 0;
    }
  };

  const handleSearchSubmit = React.useCallback(() => {
    const nextQuery = timelineSearchInput.trim();
    setTimelineSearch(nextQuery);
    setVisibleTimelineCount(18);
    if (resultsScrollRef.current) {
      resultsScrollRef.current.scrollTop = 0;
    }
  }, [timelineSearchInput]);

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
          <Box
            sx={{
              opacity: isHeroContentVisible ? 1 : 0,
              transform: isHeroContentVisible ? 'translateY(0px)' : 'translateY(6px)',
              transition: 'opacity 220ms ease, transform 220ms ease',
              minHeight: { xs: 150, md: 165 },
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
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
              <Stack spacing={1.5} direction={{ xs: 'column', sm: 'row' }} sx={{ mt: 2, justifyContent: 'center' }}>
                <Button variant="contained" onClick={() => navigate('/timeline-v3/new')}>Try Timeline V3 Beta</Button>
                <Button variant="outlined" onClick={() => setDialogOpen(true)}>Create Your Timeline</Button>
              </Stack>
            ) : null}

            {heroIndex === 1 && spotlightTimeline ? (
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mt: 2, justifyContent: 'center' }}>
                <Chip label={`Created ${formatDate(spotlightTimeline.created_at)}`} variant="outlined" />
                <Button variant="contained" onClick={() => navigate(`/timeline-v3/${spotlightTimeline.id}`)}>Open Spotlight Timeline</Button>
              </Stack>
            ) : null}
          </Box>

          <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 2 }}>
            {[0, 1].map((dotIndex) => {
              const isActive = dotIndex === heroIndex;
              return (
                <Box
                  key={dotIndex}
                  component="button"
                  type="button"
                  onClick={() => transitionToHeroSlide(dotIndex)}
                  aria-label={`Hero slide ${dotIndex + 1}`}
                  sx={{
                    width: isActive ? 30 : 10,
                    height: 10,
                    borderRadius: 99,
                    border: 'none',
                    cursor: 'pointer',
                    p: 0,
                    transform: isActive ? 'scale(1.03)' : 'scale(0.97)',
                    bgcolor: isActive ? 'primary.main' : 'text.disabled',
                    opacity: isActive ? 1 : 0.75,
                    transition: 'width 320ms cubic-bezier(0.22, 1, 0.36, 1), background-color 260ms ease, opacity 260ms ease, transform 280ms ease',
                  }}
                />
              );
            })}
            <Typography variant="caption" color="text.secondary">Auto-rotates every 1 minute 30 seconds</Typography>
          </Stack>
        </Paper>

        <Box
          sx={{
            position: 'sticky',
            top: `${HOME_NAVBAR_OFFSET_PX}px`,
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '280px minmax(0, 1fr)' },
            gap: 2,
            overflow: 'hidden',
            minHeight: { xs: 'calc(100vh - 120px)', md: `calc(100vh - ${HOME_NAVBAR_OFFSET_PX + 20}px)` },
            height: { xs: 'calc(100vh - 120px)', md: `calc(100vh - ${HOME_NAVBAR_OFFSET_PX + 20}px)` },
            alignItems: 'stretch',
            zIndex: 1,
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
            }}
          >
            <Stack spacing={1}>
              {LEFT_HUB_TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeHubTab === tab.key;
                return (
                  <Button
                    key={tab.key}
                    aria-label={tab.label}
                    startIcon={<Icon fontSize="small" />}
                    variant={isActive ? 'contained' : 'text'}
                    onClick={() => transitionToHubTab(tab.key)}
                    sx={{
                      justifyContent: isActive ? 'flex-start' : 'center',
                      alignSelf: 'flex-end',
                      borderRadius: 2,
                      minWidth: isActive ? { xs: '220px', md: '100%' } : 54,
                      width: isActive ? { xs: '220px', md: '100%' } : 54,
                      height: 42,
                      px: isActive ? 1.5 : 0,
                      '& .MuiButton-startIcon': {
                        mr: isActive ? 1 : 0,
                        ml: isActive ? 0 : 0.2,
                      },
                      color: isActive ? 'common.white' : 'text.primary',
                      border: isActive ? 'none' : '1px solid',
                      borderColor: 'divider',
                      overflow: 'hidden',
                      transformOrigin: 'right center',
                      transform: isActive ? 'scaleX(1)' : 'scaleX(0.92)',
                      transition:
                        'width 420ms cubic-bezier(0.34, 1.56, 0.64, 1), min-width 420ms cubic-bezier(0.34, 1.56, 0.64, 1), transform 420ms cubic-bezier(0.34, 1.56, 0.64, 1), padding 240ms ease',
                    }}
                  >
                    {isActive ? tab.label : null}
                    {isActive && tab.soon ? (
                      <Typography component="span" variant="caption" sx={{ ml: 0.75, opacity: 0.7 }}>
                        soon
                      </Typography>
                    ) : null}
                  </Button>
                );
              })}
            </Stack>
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
            <Box
              sx={{
                opacity: isHubContentVisible ? 1 : 0,
                transform: isHubContentVisible ? 'translateY(0px)' : 'translateY(6px)',
                transition: 'opacity 220ms ease, transform 220ms ease',
                display: 'flex',
                flexDirection: 'column',
                minHeight: 0,
                flex: 1,
              }}
            >
              {activeHubTab !== 'timeline-search' ? (
                <Box sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                    {LEFT_HUB_TABS.find((tab) => tab.key === activeHubTab)?.label}
                  </Typography>
                  <Typography color="text.secondary">
                    This hub is queued next. We can wire its dedicated result feed once you confirm the exact API scope.
                  </Typography>
                </Box>
              ) : (
                <>
                  <Box sx={{ p: 2, borderBottom: '1px solid', borderBottomColor: 'divider' }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5 }}>Search</Typography>
                    <TextField
                      fullWidth
                      size="small"
                      value={timelineSearchInput}
                      onChange={handleSearchChange}
                      placeholder="Search timelines by name or description"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleSearchSubmit();
                        }
                      }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchIcon fontSize="small" sx={{ opacity: 0.65 }} />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton size="small" onClick={handleSearchSubmit} edge="end" aria-label="Submit search">
                              <ArrowForwardIcon fontSize="small" />
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                    <Stack direction="row" spacing={1} sx={{ mt: 1.5, flexWrap: 'wrap', rowGap: 1 }}>
                      {SEARCH_SUB_FILTERS.map((filter) => {
                        const isActive = searchSubFilter === filter.key;
                        return (
                          <Button
                            key={filter.key}
                            size="small"
                            variant={isActive ? 'contained' : 'outlined'}
                            onClick={() => handleSearchSubFilterChange(filter.key)}
                            sx={{ justifyContent: 'flex-start', textTransform: 'none', borderRadius: 99 }}
                          >
                            {filter.label}
                          </Button>
                        );
                      })}
                    </Stack>
                  </Box>

                  <Box ref={resultsScrollRef} sx={{ p: 2, overflowY: 'auto', flex: 1, minHeight: 0 }} onScroll={handleHubScroll}>
                    {!isTimelineSearchScope ? (
                      <Box sx={{ py: 6, textAlign: 'center' }}>
                        <Typography sx={{ fontWeight: 700, mb: 1 }}>
                          {`${SEARCH_SUB_FILTERS.find((filter) => filter.key === searchSubFilter)?.label} search is next`}
                        </Typography>
                        <Typography color="text.secondary">
                          {`"${SEARCH_SUB_FILTERS.find((filter) => filter.key === searchSubFilter)?.label}" will populate once this scope is connected to dedicated endpoints.`}
                        </Typography>
                      </Box>
                    ) : timelineSearchInput.trim().length > 0 && timelineSearchInput.trim() !== timelineSearch ? (
                      <Box sx={{ py: 6, textAlign: 'center' }}>
                        <Typography sx={{ fontWeight: 700, mb: 1 }}>{`${matchingPreviewCount} results matching so far`}</Typography>
                        <Typography color="text.secondary">
                          Press Enter or click the arrow to run this search.
                        </Typography>
                      </Box>
                    ) : !hasSearchQuery ? (
                      <Box sx={{ py: 6, textAlign: 'center' }}>
                        <Typography sx={{ fontWeight: 700, mb: 1 }}>Start searching</Typography>
                        <Typography color="text.secondary">
                          Enter a search term to explore timelines. This keeps SEARCH focused instead of showing a default list.
                        </Typography>
                      </Box>
                    ) : loadingTimelines ? (
                      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
                    ) : visibleTimelines.length > 0 ? (
                      <Stack spacing={1.5}>
                        {visibleTimelines.map((timeline) => {
                          const type = String(timeline?.timeline_type || 'hashtag').toLowerCase();
                          const isCommunity = type === 'community';
                          const isPersonal = type === 'personal';
                          const typeLabel = isCommunity ? 'Community' : isPersonal ? 'Personal' : 'Hashtag';
                          const TypeIcon = isCommunity ? GroupsIcon : isPersonal ? PersonIcon : TagIcon;

                          return (
                            <Card
                              key={timeline.id}
                              sx={{
                                display: 'flex',
                                flexDirection: { xs: 'column', md: 'row' },
                                borderRadius: 2.5,
                                border: '1px solid',
                                borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(30, 41, 59, 0.18)',
                                background: theme.palette.mode === 'dark'
                                  ? 'linear-gradient(165deg, rgba(17,23,39,0.96) 0%, rgba(10,14,24,0.96) 100%)'
                                  : 'linear-gradient(165deg, rgba(250,244,236,0.98) 0%, rgba(245,239,230,0.98) 100%)',
                                boxShadow: theme.palette.mode === 'dark'
                                  ? '0 10px 24px rgba(0,0,0,0.35)'
                                  : '0 10px 20px rgba(120, 100, 80, 0.12)',
                                overflow: 'hidden',
                              }}
                            >
                              <Box
                                sx={{
                                  width: { xs: '100%', md: 240 },
                                  minWidth: { xs: '100%', md: 240 },
                                  height: { xs: 76, md: 'auto' },
                                  px: 1.5,
                                  display: 'flex',
                                  alignItems: 'flex-end',
                                  pb: 1.25,
                                  background: isCommunity
                                    ? 'linear-gradient(140deg, rgba(30,136,229,0.85) 0%, rgba(13,71,161,0.85) 100%)'
                                    : isPersonal
                                      ? 'linear-gradient(140deg, rgba(0,150,136,0.82) 0%, rgba(0,105,92,0.85) 100%)'
                                      : 'linear-gradient(140deg, rgba(217,119,6,0.82) 0%, rgba(180,83,9,0.86) 100%)',
                                }}
                              >
                                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.92)', letterSpacing: 0.4 }}>
                                  Timeline banner placeholder (future image slot)
                                </Typography>
                              </Box>

                              <CardContent sx={{ flexGrow: 1 }}>
                                <Chip
                                  size="small"
                                  icon={<TypeIcon fontSize="small" />}
                                  label={typeLabel}
                                  sx={{ mb: 1, fontWeight: 600 }}
                                />
                                <Typography variant="h6" gutterBottom sx={{ lineHeight: 1.2 }}>{timeline.name}</Typography>
                                {timeline.description ? (
                                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                                    {timeline.description}
                                  </Typography>
                                ) : null}
                                <Typography variant="caption" color="text.secondary">
                                  Created: {formatDate(timeline.created_at)}
                                </Typography>
                              </CardContent>
                              <Box sx={{ px: 2, pb: 2, alignSelf: { xs: 'stretch', md: 'flex-end' } }}>
                                <Button size="small" variant="contained" onClick={() => navigate(`/timeline-v3/${timeline.id}`)}>
                                  Open Timeline
                                </Button>
                              </Box>
                            </Card>
                          );
                        })}
                      </Stack>
                    ) : (
                      <Box sx={{ py: 6, textAlign: 'center' }}><Typography color="text.secondary">No timelines matched your search.</Typography></Box>
                    )}

                    {!loadingTimelines && hasSearchQuery && visibleTimelineCount < filteredTimelines.length ? (
                      <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                        <Button variant="outlined" onClick={() => setVisibleTimelineCount((prev) => Math.min(prev + 12, filteredTimelines.length))}>Load More</Button>
                      </Box>
                    ) : null}
                  </Box>
                </>
              )}
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

export default HomePage;
