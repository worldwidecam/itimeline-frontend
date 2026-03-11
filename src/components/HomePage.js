import React from 'react';
import { useNavigate } from 'react-router-dom';
import { alpha, useTheme } from '@mui/material/styles';
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
  Avatar,
  InputAdornment,
} from '@mui/material';
import {
  Close as CloseIcon,
  Search as SearchIcon,
  ArrowForward as ArrowForwardIcon,
  LocalFireDepartment as LocalFireDepartmentIcon,
  Tag as TagIcon,
  Groups as GroupsIcon,
  Person as PersonIcon,
  AutoStories as AutoStoriesIcon,
  Article as ArticleIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import { EVENT_TYPES } from './timeline-v3/events/EventTypes';
import RemarkCard from './timeline-v3/events/cards/RemarkCard';
import NewsCard from './timeline-v3/events/cards/NewsCard';
import MediaCard from './timeline-v3/events/cards/MediaCard';

const HERO_ROTATE_MS = 90000;
const HERO_SLIDE_COUNT = 2;
const HERO_CONTENT_FADE_MS = 180;
const HOME_NAVBAR_OFFSET_PX = 78;
const SEARCH_SUBMIT_DELAY_MS = 340;
const SEARCH_RESULT_HANDOFF_MS = 140;
const HOME_LIST_BATCH_SIZE = 100;
const HUB_PHASE_ONE_MS = 170;
const EMPTY_REVIEWING_EVENT_IDS = new Set();

const normalizeUserPrimaryColor = (profileUser) => {
  const candidate = String(
    profileUser?.primary_color
      || profileUser?.profile_primary_color
      || profileUser?.accent_color
      || '',
  ).trim();

  return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(candidate) ? candidate : null;
};

const LEFT_HUB_TABS = [
  { key: 'timeline-search', label: 'SEARCH', icon: SearchIcon },
  { key: 'popular', label: 'POPULAR', icon: LocalFireDepartmentIcon, soon: true },
  { key: 'your-page', label: 'YOUR PAGE', icon: ArticleIcon, soon: true },
  { key: 'my-creations', label: 'MY CREATIONS', icon: AutoStoriesIcon },
  { key: 'friends-list', label: 'FRIENDS LIST', icon: GroupsIcon, soon: true },
];

const SEARCH_SUB_FILTERS = [
  { key: 'all', label: 'All', mode: 'mixed' },
  { key: 'timelines', label: 'TIMELINES', mode: 'timeline' },
  { key: 'posts', label: 'POSTS', mode: 'post' },
  { key: 'users', label: 'USERS', mode: 'user' },
];

const MY_CREATIONS_FILTERS = [
  { key: 'timelines', label: 'Timelines' },
  { key: 'posts', label: 'Posts' },
];

const HomePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const theme = useTheme();
  const resultsScrollRef = React.useRef(null);
  const myCreationsScrollRef = React.useRef(null);
  const heroTransitionTimeoutRef = React.useRef(null);
  const hubTransitionTimeoutRef = React.useRef(null);
  const myCreationsFetchTimeoutRef = React.useRef(null);
  const myCreationsFilterTransitionTimeoutRef = React.useRef(null);
  const searchSubmitTimeoutRef = React.useRef(null);
  const searchRevealTimeoutRef = React.useRef(null);

  const [loading, setLoading] = React.useState(false);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [timelines, setTimelines] = React.useState([]);
  const [searchEvents, setSearchEvents] = React.useState([]);
  const [searchUsers, setSearchUsers] = React.useState([]);
  const [myCreationEvents, setMyCreationEvents] = React.useState([]);
  const [loadingSearchEvents, setLoadingSearchEvents] = React.useState(false);
  const [loadingSearchUsers, setLoadingSearchUsers] = React.useState(false);
  const [loadingMyCreationEvents, setLoadingMyCreationEvents] = React.useState(false);
  const [hasLoadedSearchEvents, setHasLoadedSearchEvents] = React.useState(false);
  const [hasLoadedMyCreationEvents, setHasLoadedMyCreationEvents] = React.useState(false);
  const [loadingTimelines, setLoadingTimelines] = React.useState(true);
  const [heroIndex, setHeroIndex] = React.useState(0);
  const [isHeroContentVisible, setIsHeroContentVisible] = React.useState(true);
  const [activeHubTab, setActiveHubTab] = React.useState('timeline-search');
  const [isHubContentVisible, setIsHubContentVisible] = React.useState(true);
  const [isHubPhaseOneLoading, setIsHubPhaseOneLoading] = React.useState(false);
  const [isMyCreationsSubTabPhaseOneLoading, setIsMyCreationsSubTabPhaseOneLoading] = React.useState(false);
  const [searchSubFilter, setSearchSubFilter] = React.useState('all');
  const [myCreationsFilter, setMyCreationsFilter] = React.useState('timelines');
  const [timelineSearchInput, setTimelineSearchInput] = React.useState('');
  const [timelineSearch, setTimelineSearch] = React.useState('');
  const [isSearchSubmitting, setIsSearchSubmitting] = React.useState(false);
  const [isSearchResultsVisible, setIsSearchResultsVisible] = React.useState(true);
  const [visibleTimelineCount, setVisibleTimelineCount] = React.useState(HOME_LIST_BATCH_SIZE);
  const [visibleMyCreationsTimelineCount, setVisibleMyCreationsTimelineCount] = React.useState(HOME_LIST_BATCH_SIZE);
  const [visibleMyCreationsPostCount, setVisibleMyCreationsPostCount] = React.useState(HOME_LIST_BATCH_SIZE);
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
      if (myCreationsFetchTimeoutRef.current) {
        window.clearTimeout(myCreationsFetchTimeoutRef.current);
      }
      if (myCreationsFilterTransitionTimeoutRef.current) {
        window.clearTimeout(myCreationsFilterTransitionTimeoutRef.current);
      }
      if (searchSubmitTimeoutRef.current) {
        window.clearTimeout(searchSubmitTimeoutRef.current);
      }
      if (searchRevealTimeoutRef.current) {
        window.clearTimeout(searchRevealTimeoutRef.current);
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
      if (myCreationsFetchTimeoutRef.current) {
        window.clearTimeout(myCreationsFetchTimeoutRef.current);
      }

      setIsHubPhaseOneLoading(true);
      setIsHubContentVisible(false);
      setActiveHubTab(nextTab);
      hubTransitionTimeoutRef.current = window.setTimeout(() => {
        setIsHubContentVisible(true);
        setIsHubPhaseOneLoading(false);
      }, HUB_PHASE_ONE_MS);
    },
    [activeHubTab],
  );

  const hasSearchQuery = timelineSearch.trim().length > 0;
  const hasSearchDraft = timelineSearchInput.trim().length > 0;
  const isTimelineSearchScope = searchSubFilter === 'all' || searchSubFilter === 'timelines';
  const isPostSearchScope = searchSubFilter === 'all' || searchSubFilter === 'posts';
  const isUserSearchScope = searchSubFilter === 'all' || searchSubFilter === 'users';
  const currentUserId = Number(user?.id || 0);

  const normalizedTimelines = React.useMemo(() => {
    return [...timelines].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
  }, [timelines]);

  const canAccessTimelineInHomeSearch = React.useCallback((timeline) => {
    const timelineType = String(timeline?.timeline_type || '').toLowerCase();
    if (timelineType !== 'personal') return true;

    const ownerId = Number(
      timeline?.created_by
      || timeline?.creator_id
      || timeline?.owner_id
      || timeline?.user_id
      || 0,
    );

    return ownerId > 0 && currentUserId > 0 && ownerId === currentUserId;
  }, [currentUserId]);

  const searchableTimelines = React.useMemo(() => {
    return normalizedTimelines.filter(canAccessTimelineInHomeSearch);
  }, [normalizedTimelines, canAccessTimelineInHomeSearch]);

  const ownedTimelines = React.useMemo(() => {
    return normalizedTimelines.filter((timeline) => {
      const ownerId = Number(
        timeline?.created_by
        || timeline?.creator_id
        || timeline?.owner_id
        || timeline?.user_id
        || 0,
      );
      return ownerId > 0 && currentUserId > 0 && ownerId === currentUserId;
    });
  }, [normalizedTimelines, currentUserId]);

  React.useEffect(() => {
    setHasLoadedSearchEvents(false);
    setSearchEvents([]);
  }, [normalizedTimelines.length]);

  const matchingPreviewCount = React.useMemo(() => {
    const previewQuery = timelineSearchInput.trim().toLowerCase();
    if (!previewQuery) return 0;

    let count = 0;

    if (isTimelineSearchScope) {
      count += searchableTimelines.filter((timeline) => {
        const name = String(timeline?.name || '').toLowerCase();
        const description = String(timeline?.description || '').toLowerCase();
        return name.includes(previewQuery) || description.includes(previewQuery);
      }).length;
    }

    if (isPostSearchScope) {
      count += searchEvents.filter((event) => {
        const title = String(event?.title || '').toLowerCase();
        const description = String(event?.description || '').toLowerCase();
        return title.includes(previewQuery) || description.includes(previewQuery);
      }).length;
    }

    if (isUserSearchScope) {
      count += searchUsers.filter((profileUser) => {
        const username = String(profileUser?.username || '').toLowerCase();
        const bio = String(profileUser?.bio || '').toLowerCase();
        return username.includes(previewQuery) || bio.includes(previewQuery);
      }).length;
    }

    return count;
  }, [timelineSearchInput, isTimelineSearchScope, isPostSearchScope, isUserSearchScope, searchableTimelines, searchEvents, searchUsers]);

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

    return searchableTimelines
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
  }, [searchableTimelines, timelineSearch, isTimelineSearchScope, hasSearchQuery]);

  const filteredPosts = React.useMemo(() => {
    if (!isPostSearchScope) return [];
    if (!hasSearchQuery) return [];

    const q = timelineSearch.trim().toLowerCase();
    const rankEvent = (event) => {
      const title = String(event?.title || '').toLowerCase();
      const description = String(event?.description || '').toLowerCase();

      if (title === q) return 0;
      if (title.startsWith(q)) return 1;
      if (title.includes(q)) return 2;
      if (description.includes(q)) return 3;
      return 999;
    };

    return searchEvents
      .map((event) => ({
        event,
        rank: rankEvent(event),
      }))
      .filter((entry) => entry.rank < 999)
      .sort((a, b) => {
        if (a.rank !== b.rank) return a.rank - b.rank;
        const aTitleLength = String(a.event?.title || '').length;
        const bTitleLength = String(b.event?.title || '').length;
        if (aTitleLength !== bTitleLength) return aTitleLength - bTitleLength;
        return new Date(b.event?.created_at || 0) - new Date(a.event?.created_at || 0);
      })
      .map((entry) => entry.event);
  }, [searchEvents, timelineSearch, isPostSearchScope, hasSearchQuery]);

  const filteredUsers = React.useMemo(() => {
    if (!isUserSearchScope) return [];
    if (!hasSearchQuery) return [];

    const q = timelineSearch.trim().toLowerCase();
    const rankUser = (profileUser) => {
      const username = String(profileUser?.username || '').toLowerCase();
      const bio = String(profileUser?.bio || '').toLowerCase();

      if (username === q) return 0;
      if (username.startsWith(q)) return 1;
      if (username.includes(q)) return 2;
      if (bio.includes(q)) return 3;
      return 999;
    };

    return searchUsers
      .map((profileUser) => ({
        profileUser,
        rank: rankUser(profileUser),
      }))
      .filter((entry) => entry.rank < 999)
      .sort((a, b) => {
        if (a.rank !== b.rank) return a.rank - b.rank;
        const aNameLength = String(a.profileUser?.username || '').length;
        const bNameLength = String(b.profileUser?.username || '').length;
        if (aNameLength !== bNameLength) return aNameLength - bNameLength;
        return Number(a.profileUser?.id || 0) - Number(b.profileUser?.id || 0);
      })
      .map((entry) => entry.profileUser);
  }, [searchUsers, timelineSearch, isUserSearchScope, hasSearchQuery]);

  const visibleTimelines = React.useMemo(() => {
    return filteredTimelines.slice(0, visibleTimelineCount);
  }, [filteredTimelines, visibleTimelineCount]);

  const visiblePosts = React.useMemo(() => {
    return filteredPosts.slice(0, visibleTimelineCount);
  }, [filteredPosts, visibleTimelineCount]);

  const visibleUsers = React.useMemo(() => {
    return filteredUsers.slice(0, visibleTimelineCount);
  }, [filteredUsers, visibleTimelineCount]);

  const visibleOwnedTimelines = React.useMemo(() => {
    return ownedTimelines.slice(0, visibleMyCreationsTimelineCount);
  }, [ownedTimelines, visibleMyCreationsTimelineCount]);

  const visibleMyCreationPosts = React.useMemo(() => {
    return myCreationEvents.slice(0, visibleMyCreationsPostCount);
  }, [myCreationEvents, visibleMyCreationsPostCount]);

  const fetchSearchEvents = React.useCallback(async () => {
    if (loadingSearchEvents || hasLoadedSearchEvents || !searchableTimelines.length) return;

    try {
      setLoadingSearchEvents(true);

      const requests = searchableTimelines.map((timeline) =>
        api.get(`/api/timeline-v3/${timeline.id}/events`),
      );
      const results = await Promise.allSettled(requests);

      const merged = [];
      for (let i = 0; i < results.length; i += 1) {
        const result = results[i];
        const timeline = searchableTimelines[i];

        if (result.status !== 'fulfilled') continue;

        const payload = result.value?.data;
        const events = Array.isArray(payload?.events)
          ? payload.events
          : (Array.isArray(payload) ? payload : []);

        events.forEach((event) => {
          merged.push({
            ...event,
            timeline_id: event?.timeline_id || timeline?.id,
            timeline_name: timeline?.name || event?.timeline_name || '',
            timeline_type: timeline?.timeline_type || event?.timeline_type || 'hashtag',
            timeline_created_by: timeline?.created_by || timeline?.creator_id || timeline?.owner_id || timeline?.user_id || null,
          });
        });
      }

      const dedupedById = [];
      const seen = new Set();
      merged.forEach((event) => {
        if (!event?.id || seen.has(event.id)) return;
        seen.add(event.id);
        dedupedById.push(event);
      });

      setSearchEvents(dedupedById);
      setHasLoadedSearchEvents(true);
    } catch (error) {
      console.error('Error fetching search events:', error);
      setSearchEvents([]);
    } finally {
      setLoadingSearchEvents(false);
    }
  }, [loadingSearchEvents, hasLoadedSearchEvents, searchableTimelines]);

  const fetchSearchUsers = React.useCallback(async (rawQuery) => {
    const nextQuery = String(rawQuery || '').trim().replace(/^@+/, '');
    if (!nextQuery) {
      setSearchUsers([]);
      return;
    }

    try {
      setLoadingSearchUsers(true);

      const response = await api.get('/api/users/lookup', {
        params: { username: nextQuery },
      });
      const payload = response?.data;

      const users = Array.isArray(payload)
        ? payload
        : (payload && payload.id ? [payload] : []);

      setSearchUsers(users);
    } catch (error) {
      if (error?.response?.status !== 404) {
        console.error('Error fetching search users:', error);
      }
      setSearchUsers([]);
    } finally {
      setLoadingSearchUsers(false);
    }
  }, []);

  const fetchMyCreationEvents = React.useCallback(async () => {
    if (loadingMyCreationEvents || hasLoadedMyCreationEvents || !ownedTimelines.length) return;

    try {
      setLoadingMyCreationEvents(true);

      const requests = ownedTimelines.map((timeline) => api.get(`/api/timeline-v3/${timeline.id}/events`));
      const results = await Promise.allSettled(requests);

      const merged = [];
      for (let i = 0; i < results.length; i += 1) {
        const result = results[i];
        const timeline = ownedTimelines[i];
        if (result.status !== 'fulfilled') continue;

        const payload = result.value?.data;
        const events = Array.isArray(payload?.events)
          ? payload.events
          : (Array.isArray(payload) ? payload : []);

        events.forEach((event) => {
          const authorId = Number(event?.created_by || event?.creator_id || event?.user_id || 0);
          if (!(authorId > 0 && currentUserId > 0 && authorId === currentUserId)) return;

          merged.push({
            ...event,
            timeline_id: event?.timeline_id || timeline?.id,
            timeline_name: timeline?.name || event?.timeline_name || '',
            timeline_type: timeline?.timeline_type || event?.timeline_type || 'hashtag',
          });
        });
      }

      const dedupedById = [];
      const seen = new Set();
      merged.forEach((event) => {
        if (!event?.id || seen.has(event.id)) return;
        seen.add(event.id);
        dedupedById.push(event);
      });

      setMyCreationEvents(dedupedById);
      setHasLoadedMyCreationEvents(true);
    } catch (error) {
      console.error('Error fetching my creation events:', error);
      setMyCreationEvents([]);
    } finally {
      setLoadingMyCreationEvents(false);
    }
  }, [loadingMyCreationEvents, hasLoadedMyCreationEvents, ownedTimelines, currentUserId]);

  React.useEffect(() => {
    if (activeHubTab !== 'my-creations') return;
    if (isHubPhaseOneLoading) return;

    if (!ownedTimelines.length) {
      setHasLoadedMyCreationEvents(true);
      setMyCreationEvents([]);
      return;
    }

    if (hasLoadedMyCreationEvents || loadingMyCreationEvents) return;

    if (myCreationsFetchTimeoutRef.current) {
      window.clearTimeout(myCreationsFetchTimeoutRef.current);
    }

    myCreationsFetchTimeoutRef.current = window.setTimeout(() => {
      fetchMyCreationEvents();
    }, 0);

    return () => {
      if (myCreationsFetchTimeoutRef.current) {
        window.clearTimeout(myCreationsFetchTimeoutRef.current);
      }
    };
  }, [
    activeHubTab,
    isHubPhaseOneLoading,
    ownedTimelines.length,
    hasLoadedMyCreationEvents,
    loadingMyCreationEvents,
    fetchMyCreationEvents,
  ]);

  const renderTimelineCard = React.useCallback((timeline) => {
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
  }, [theme.palette.mode, navigate]);

  const renderSearchEventCard = React.useCallback((event) => {
    const eventType = String(event?.type || EVENT_TYPES.REMARK).toLowerCase();
    const sharedProps = {
      event,
      onEdit: () => {},
      onDelete: () => {},
      isSelected: true,
      setIsPopupOpen: () => {},
      reviewingEventIds: EMPTY_REVIEWING_EVENT_IDS,
      showInlineVoteControls: false,
      showVoteOverlay: true,
    };

    if (eventType === EVENT_TYPES.NEWS) {
      return <NewsCard {...sharedProps} />;
    }
    if (eventType === EVENT_TYPES.MEDIA) {
      return <MediaCard {...sharedProps} />;
    }
    return <RemarkCard {...sharedProps} />;
  }, []);

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
    const maxCount = Math.max(
      isTimelineSearchScope ? filteredTimelines.length : 0,
      isPostSearchScope ? filteredPosts.length : 0,
      isUserSearchScope ? filteredUsers.length : 0,
    );
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 120 && visibleTimelineCount < maxCount) {
      setVisibleTimelineCount((prev) => Math.min(prev + HOME_LIST_BATCH_SIZE, maxCount));
    }
  };

  const handleMyCreationsScroll = (e) => {
    const el = e.currentTarget;
    if (el.scrollTop + el.clientHeight < el.scrollHeight - 120) return;

    if (myCreationsFilter === 'timelines' && visibleOwnedTimelines.length < ownedTimelines.length) {
      setVisibleMyCreationsTimelineCount((prev) => Math.min(prev + HOME_LIST_BATCH_SIZE, ownedTimelines.length));
      return;
    }

    if (myCreationsFilter === 'posts' && visibleMyCreationPosts.length < myCreationEvents.length) {
      setVisibleMyCreationsPostCount((prev) => Math.min(prev + HOME_LIST_BATCH_SIZE, myCreationEvents.length));
    }
  };

  const handleSearchSubFilterChange = (nextFilter) => {
    setSearchSubFilter(nextFilter);
    setVisibleTimelineCount(HOME_LIST_BATCH_SIZE);
    if (resultsScrollRef.current) {
      resultsScrollRef.current.scrollTop = 0;
    }
  };

  const handleSearchChange = (e) => {
    setTimelineSearchInput(e.target.value);
    setVisibleTimelineCount(HOME_LIST_BATCH_SIZE);
    if (resultsScrollRef.current) {
      resultsScrollRef.current.scrollTop = 0;
    }
  };

  const handleMyCreationsFilterChange = (nextFilter) => {
    if (nextFilter === myCreationsFilter) return;

    if (myCreationsFilterTransitionTimeoutRef.current) {
      window.clearTimeout(myCreationsFilterTransitionTimeoutRef.current);
    }

    setIsMyCreationsSubTabPhaseOneLoading(true);
    setMyCreationsFilter(nextFilter);

    if (nextFilter === 'timelines') {
      setVisibleMyCreationsTimelineCount(HOME_LIST_BATCH_SIZE);
    } else {
      setVisibleMyCreationsPostCount(HOME_LIST_BATCH_SIZE);
    }

    if (myCreationsScrollRef.current) {
      myCreationsScrollRef.current.scrollTop = 0;
    }

    myCreationsFilterTransitionTimeoutRef.current = window.setTimeout(() => {
      setIsMyCreationsSubTabPhaseOneLoading(false);
    }, HUB_PHASE_ONE_MS);
  };

  const handleSearchSubmit = React.useCallback((forcedQuery = null) => {
    const nextQuery = typeof forcedQuery === 'string' ? forcedQuery.trim() : timelineSearchInput.trim();
    const shouldLoadPostScope = nextQuery.length > 0 && isPostSearchScope;
    const shouldLoadUserScope = nextQuery.length > 0 && isUserSearchScope;
    setIsSearchSubmitting(true);
    setIsSearchResultsVisible(false);

    if (searchSubmitTimeoutRef.current) {
      window.clearTimeout(searchSubmitTimeoutRef.current);
    }
    if (searchRevealTimeoutRef.current) {
      window.clearTimeout(searchRevealTimeoutRef.current);
    }

    searchSubmitTimeoutRef.current = window.setTimeout(async () => {
      if (shouldLoadPostScope) {
        await fetchSearchEvents();
      }
      if (shouldLoadUserScope) {
        await fetchSearchUsers(nextQuery);
      } else {
        setSearchUsers([]);
      }

      setTimelineSearch(nextQuery);
      setVisibleTimelineCount(HOME_LIST_BATCH_SIZE);
      if (resultsScrollRef.current) {
        resultsScrollRef.current.scrollTop = 0;
      }
      setIsSearchResultsVisible(true);

      searchRevealTimeoutRef.current = window.setTimeout(() => {
        setIsSearchSubmitting(false);
      }, SEARCH_RESULT_HANDOFF_MS);
    }, SEARCH_SUBMIT_DELAY_MS);
  }, [timelineSearchInput, isPostSearchScope, isUserSearchScope, fetchSearchEvents, fetchSearchUsers]);

  const handleClearSearch = React.useCallback(() => {
    setTimelineSearchInput('');
    setVisibleTimelineCount(HOME_LIST_BATCH_SIZE);
    if (resultsScrollRef.current) {
      resultsScrollRef.current.scrollTop = 0;
    }
    handleSearchSubmit('');
  }, [handleSearchSubmit]);

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
              {isHubPhaseOneLoading ? (
                <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', p: 3 }}>
                  <Stack spacing={1.25} alignItems="center">
                    <CircularProgress size={28} />
                    <Typography color="text.secondary">Loading section...</Typography>
                  </Stack>
                </Box>
              ) : activeHubTab === 'my-creations' ? (
                <Box
                  ref={myCreationsScrollRef}
                  onScroll={handleMyCreationsScroll}
                  sx={{ p: { xs: 2, md: 2.5 }, overflowY: 'auto', flex: 1, minHeight: 0 }}
                >
                  <Typography variant="h6" sx={{ fontWeight: 800, mb: 0.75 }}>
                    My Creations
                  </Typography>
                  <Typography color="text.secondary" sx={{ mb: 2.25 }}>
                    Your created timelines and your authored posts. No search and no ALL-filter mode here.
                  </Typography>

                  <Box
                    sx={{
                      mb: 2,
                      p: 0.5,
                      borderRadius: 99,
                      display: 'inline-flex',
                      gap: 0.6,
                      border: '1px solid',
                      borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.14)' : 'rgba(15,23,42,0.15)',
                      background: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(15,23,42,0.05)',
                    }}
                  >
                    {MY_CREATIONS_FILTERS.map((filter) => {
                      const isActive = myCreationsFilter === filter.key;
                      return (
                        <Button
                          key={filter.key}
                          size="small"
                          onClick={() => handleMyCreationsFilterChange(filter.key)}
                          sx={{
                            minWidth: 0,
                            px: 1.25,
                            py: 0.45,
                            borderRadius: 99,
                            textTransform: 'none',
                            fontWeight: isActive ? 700 : 600,
                            fontSize: '0.78rem',
                            color: isActive ? 'common.white' : 'text.secondary',
                            background: isActive
                              ? 'linear-gradient(135deg, #06b6d4 0%, #2563eb 100%)'
                              : 'transparent',
                            boxShadow: isActive ? '0 8px 16px rgba(37,99,235,0.24)' : 'none',
                            transform: isActive ? 'translateY(-0.5px)' : 'translateY(0px)',
                            transition: 'background 260ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 260ms cubic-bezier(0.22, 1, 0.36, 1), color 220ms ease, transform 220ms ease',
                            '&:hover': {
                              background: isActive
                                ? 'linear-gradient(135deg, #0891b2 0%, #1d4ed8 100%)'
                                : theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)',
                              transform: isActive ? 'translateY(-0.5px)' : 'translateY(-1px)',
                            },
                          }}
                        >
                          {filter.label}
                        </Button>
                      );
                    })}
                  </Box>

                  <Box
                    sx={{
                      '@keyframes myCreationsFilterIn': {
                        from: { opacity: 0, transform: 'translateY(5px)' },
                        to: { opacity: 1, transform: 'translateY(0px)' },
                      },
                      animation: 'myCreationsFilterIn 200ms ease',
                    }}
                    key={`my-creations-content-${myCreationsFilter}`}
                  >
                    <Stack spacing={2.2}>
                      {isMyCreationsSubTabPhaseOneLoading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                          <CircularProgress />
                        </Box>
                      ) : myCreationsFilter === 'timelines' ? (
                        loadingTimelines ? (
                          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                            <CircularProgress />
                          </Box>
                        ) : (
                          <Box>
                          <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 0.8 }}>
                            Created Timelines ({ownedTimelines.length})
                          </Typography>
                          {ownedTimelines.length > 0 ? (
                            <Stack spacing={1.5} sx={{ mt: 0.75 }}>
                              {visibleOwnedTimelines.map((timeline) => renderTimelineCard(timeline))}
                            </Stack>
                          ) : (
                            <Typography color="text.secondary" sx={{ mt: 0.75 }}>
                              No created timelines found yet.
                            </Typography>
                          )}
                          </Box>
                        )
                      ) : (
                        loadingMyCreationEvents ? (
                          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                            <CircularProgress />
                          </Box>
                        ) : (
                          <Box>
                          <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 0.8 }}>
                            Created Posts ({myCreationEvents.length})
                          </Typography>
                          {myCreationEvents.length > 0 ? (
                            <Stack spacing={1.5} sx={{ mt: 0.75 }}>
                              {visibleMyCreationPosts.map((event) => (
                                <Box key={`my-event-${event.id}`}>
                                  {renderSearchEventCard(event)}
                                </Box>
                              ))}
                            </Stack>
                          ) : (
                            <Typography color="text.secondary" sx={{ mt: 0.75 }}>
                              No authored posts found in your created timelines yet.
                            </Typography>
                          )}
                          </Box>
                        )
                      )}

                      {myCreationsFilter === 'timelines' && visibleOwnedTimelines.length < ownedTimelines.length ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', pt: 0.5 }}>
                          <Button
                            variant="outlined"
                            onClick={() => setVisibleMyCreationsTimelineCount((prev) => Math.min(prev + HOME_LIST_BATCH_SIZE, ownedTimelines.length))}
                          >
                            Load Next 100
                          </Button>
                        </Box>
                      ) : null}

                      {myCreationsFilter === 'posts' && visibleMyCreationPosts.length < myCreationEvents.length ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', pt: 0.5 }}>
                          <Button
                            variant="outlined"
                            onClick={() => setVisibleMyCreationsPostCount((prev) => Math.min(prev + HOME_LIST_BATCH_SIZE, myCreationEvents.length))}
                          >
                            Load Next 100
                          </Button>
                        </Box>
                      ) : null}
                    </Stack>
                  </Box>
                </Box>
              ) : activeHubTab !== 'timeline-search' ? (
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
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: theme.palette.mode === 'dark' ? 'rgba(18,24,36,0.78)' : 'rgba(255,255,255,0.9)',
                        },
                        '& .MuiInputBase-input:-webkit-autofill, & .MuiInputBase-input:-webkit-autofill:hover, & .MuiInputBase-input:-webkit-autofill:focus': {
                          WebkitTextFillColor: theme.palette.text.primary,
                          WebkitBoxShadow: `0 0 0 1000px ${theme.palette.mode === 'dark' ? 'rgba(18,24,36,0.78)' : 'rgba(255,255,255,0.9)'} inset`,
                          transition: 'background-color 99999s ease-out 0s',
                          caretColor: theme.palette.text.primary,
                        },
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleSearchSubmit();
                        }
                      }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <IconButton
                              size="small"
                              onClick={hasSearchDraft ? handleClearSearch : undefined}
                              edge="start"
                              aria-label={hasSearchDraft ? 'Clear search and refresh' : 'Search icon'}
                              sx={{
                                p: 0.35,
                                cursor: hasSearchDraft ? 'pointer' : 'default',
                              }}
                            >
                              <Box sx={{ position: 'relative', width: 18, height: 18 }}>
                                <SearchIcon
                                  fontSize="small"
                                  sx={{
                                    position: 'absolute',
                                    inset: 0,
                                    opacity: hasSearchDraft ? 0 : 0.65,
                                    transform: hasSearchDraft ? 'scale(0.7) rotate(-50deg)' : 'scale(1) rotate(0deg)',
                                    transition: 'opacity 180ms ease, transform 220ms ease',
                                  }}
                                />
                                <CloseIcon
                                  fontSize="small"
                                  sx={{
                                    position: 'absolute',
                                    inset: 0,
                                    opacity: hasSearchDraft ? 0.88 : 0,
                                    transform: hasSearchDraft ? 'scale(1) rotate(0deg)' : 'scale(0.6) rotate(45deg)',
                                    transition: 'opacity 180ms ease, transform 220ms ease',
                                  }}
                                />
                              </Box>
                            </IconButton>
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
                    <Box
                      sx={{
                        mt: 1.5,
                        p: 0.75,
                        borderRadius: 2,
                        border: '1px solid',
                        borderColor: 'divider',
                        bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(15,23,42,0.04)',
                        display: 'grid',
                        gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(4, minmax(0, 1fr))' },
                        gap: 0.75,
                      }}
                    >
                      {SEARCH_SUB_FILTERS.map((filter) => {
                        const isActive = searchSubFilter === filter.key;
                        return (
                          <Button
                            key={filter.key}
                            size="small"
                            onClick={() => handleSearchSubFilterChange(filter.key)}
                            sx={{
                              textTransform: 'none',
                              borderRadius: 1.5,
                              py: 0.65,
                              fontWeight: isActive ? 700 : 600,
                              letterSpacing: isActive ? 0.25 : 0,
                              color: isActive ? 'common.white' : 'text.secondary',
                              background: isActive
                                ? 'linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)'
                                : 'transparent',
                              border: '1px solid',
                              borderColor: isActive
                                ? 'rgba(14,165,233,0.65)'
                                : theme.palette.mode === 'dark'
                                  ? 'rgba(255,255,255,0.1)'
                                  : 'rgba(15,23,42,0.12)',
                              boxShadow: isActive ? '0 8px 16px rgba(37,99,235,0.28)' : 'none',
                              transition: 'all 220ms ease',
                              '&:hover': {
                                background: isActive
                                  ? 'linear-gradient(135deg, #0284c7 0%, #1d4ed8 100%)'
                                  : theme.palette.mode === 'dark'
                                    ? 'rgba(255,255,255,0.05)'
                                    : 'rgba(15,23,42,0.06)',
                              },
                            }}
                          >
                            {filter.label}
                          </Button>
                        );
                      })}
                    </Box>
                  </Box>

                  <Box ref={resultsScrollRef} sx={{ p: 2, overflowY: 'auto', flex: 1, minHeight: 0 }} onScroll={handleHubScroll}>
                    <Box sx={{ position: 'relative', minHeight: 120 }}>
                      <Box
                        sx={{
                          opacity: isSearchResultsVisible ? (isSearchSubmitting ? 0.38 : 1) : 0,
                          transform: isSearchResultsVisible ? 'translateY(0px)' : 'translateY(7px)',
                          filter: isSearchSubmitting ? 'blur(1px)' : 'blur(0px)',
                          transition: 'opacity 320ms ease, transform 320ms ease, filter 220ms ease',
                          pointerEvents: isSearchSubmitting ? 'none' : 'auto',
                        }}
                      >
                        {timelineSearchInput.trim().length > 0 && timelineSearchInput.trim() !== timelineSearch ? (
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
                        ) : loadingTimelines || loadingSearchEvents || loadingSearchUsers ? (
                          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
                        ) : visibleTimelines.length > 0 || visiblePosts.length > 0 || visibleUsers.length > 0 ? (
                          <Stack spacing={2}>
                            {isTimelineSearchScope && visibleTimelines.length > 0 ? (
                              <>
                                {searchSubFilter === 'all' ? (
                                  <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 0.8 }}>
                                    Timelines
                                  </Typography>
                                ) : null}
                                <Stack spacing={1.5}>
                                  {visibleTimelines.map((timeline) => renderTimelineCard(timeline))}
                                </Stack>
                              </>
                            ) : null}

                            {isPostSearchScope && visiblePosts.length > 0 ? (
                              <>
                                {searchSubFilter === 'all' ? (
                                  <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 0.8 }}>
                                    Posts / Events
                                  </Typography>
                                ) : null}
                                <Stack spacing={1.5}>
                                  {visiblePosts.map((event) => (
                                    <Box key={`event-${event.id}`}>
                                      {renderSearchEventCard(event)}
                                    </Box>
                                  ))}
                                </Stack>
                              </>
                            ) : null}

                            {isUserSearchScope && visibleUsers.length > 0 ? (
                              <>
                                {searchSubFilter === 'all' ? (
                                  <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 0.8 }}>
                                    Users
                                  </Typography>
                                ) : null}
                                <Stack spacing={1.25} sx={{ pl: { xs: 3, sm: 4 }, pt: { xs: 2.4, sm: 2.9 } }}>
                                  {visibleUsers.map((profileUser) => {
                                    const userPrimaryColor = normalizeUserPrimaryColor(profileUser);
                                    const fallbackStartTone = theme.palette.mode === 'dark' ? '#1a2a3f' : '#fff4ea';
                                    const fallbackEndTone = theme.palette.mode === 'dark' ? '#395574' : '#dcecff';
                                    const userCardBackground = userPrimaryColor
                                      ? `linear-gradient(90deg, ${alpha(fallbackStartTone, 0.97)} 0%, ${alpha(fallbackEndTone, 0.9)} 46%, ${alpha(userPrimaryColor, 0.9)} 100%)`
                                      : `linear-gradient(90deg, ${alpha(fallbackStartTone, 0.97)} 0%, ${alpha(fallbackEndTone, 0.93)} 100%)`;

                                    return (
                                    <Card
                                      key={`user-${profileUser.id}`}
                                      onClick={() => navigate(`/profile/${profileUser.id}`)}
                                      aria-label={`Open profile for ${profileUser.username}`}
                                      sx={{
                                        position: 'relative',
                                        borderRadius: 3,
                                        border: '2px solid',
                                        borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(35, 24, 24, 0.55)',
                                        background: userCardBackground,
                                        boxShadow: theme.palette.mode === 'dark'
                                          ? '0 12px 26px rgba(0,0,0,0.4)'
                                          : '0 14px 24px rgba(80, 34, 39, 0.24)',
                                        overflow: 'visible',
                                        pl: { xs: 12.9, sm: 16.6 },
                                        minHeight: { xs: 125, sm: 133 },
                                        cursor: 'pointer',
                                        transition: 'transform 240ms ease, box-shadow 240ms ease',
                                        '&:hover': {
                                          transform: 'translateY(-2px)',
                                          boxShadow: theme.palette.mode === 'dark'
                                            ? '0 16px 32px rgba(0,0,0,0.5)'
                                            : '0 16px 30px rgba(80, 34, 39, 0.3)',
                                        },
                                        '&:focus-within': {
                                          outline: '2px solid rgba(56,189,248,0.55)',
                                          outlineOffset: 2,
                                        },
                                      }}
                                    >
                                      <Box
                                        sx={{
                                          position: 'absolute',
                                          left: { xs: -24, sm: -32 },
                                          top: '50%',
                                          transform: 'translateY(-50%)',
                                          width: { xs: 120, sm: 140 },
                                          height: { xs: 148, sm: 172 },
                                          borderRadius: '50px',
                                          border: '3px solid',
                                          borderColor: theme.palette.mode === 'dark' ? 'rgba(22,18,18,0.94)' : 'rgba(18, 14, 14, 0.92)',
                                          background: theme.palette.mode === 'dark'
                                            ? 'linear-gradient(145deg, rgba(32,30,30,0.96) 0%, rgba(15,12,12,0.96) 100%)'
                                            : 'linear-gradient(145deg, rgba(38,30,30,0.94) 0%, rgba(18,12,12,0.94) 100%)',
                                          p: 0.55,
                                          zIndex: 3,
                                          boxShadow: theme.palette.mode === 'dark'
                                            ? '0 10px 22px rgba(0,0,0,0.48)'
                                            : '0 10px 20px rgba(42,20,20,0.35)',
                                        }}
                                      >
                                        <Avatar
                                          src={profileUser.avatar_url || ''}
                                          alt={profileUser.username || 'User'}
                                          sx={{
                                            width: '100%',
                                            height: '100%',
                                            borderRadius: '46px',
                                            bgcolor: 'rgba(255,255,255,0.2)',
                                            color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.95)',
                                            fontWeight: 800,
                                            fontSize: '1.4rem',
                                          }}
                                        >
                                          {String(profileUser?.username || '?').charAt(0).toUpperCase()}
                                        </Avatar>
                                      </Box>

                                      <CardContent
                                        sx={{
                                          px: { xs: 1.75, sm: 2.2 },
                                          py: { xs: 1.4, sm: 1.55 },
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'space-between',
                                          gap: 1.5,
                                        }}
                                      >
                                        <Box
                                          sx={{
                                            minWidth: 0,
                                            color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.94)' : 'rgba(15,23,42,0.94)',
                                          }}
                                        >
                                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.15, mb: 0.45 }}>
                                            <Box
                                              sx={{
                                                width: 16,
                                                height: 2,
                                                bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.9)' : 'rgba(15,23,42,0.92)',
                                                position: 'relative',
                                                '&::after': {
                                                  content: '""',
                                                  position: 'absolute',
                                                  right: -3,
                                                  top: -3,
                                                  width: 0,
                                                  height: 0,
                                                  borderTop: '4px solid transparent',
                                                  borderBottom: '4px solid transparent',
                                                  borderRight: theme.palette.mode === 'dark' ? '6px solid rgba(255,255,255,0.9)' : '6px solid rgba(15,23,42,0.92)',
                                                },
                                              }}
                                            />
                                            <Typography
                                              sx={{
                                                fontFamily: 'Lobster, cursive',
                                                fontSize: { xs: '1.05rem', sm: '1.22rem' },
                                                lineHeight: 1.1,
                                                textDecoration: 'underline',
                                                textUnderlineOffset: '4px',
                                                textDecorationThickness: '2px',
                                              }}
                                            >
                                              @{profileUser.username}
                                            </Typography>
                                          </Box>

                                          <Typography
                                            sx={{
                                              fontFamily: 'Playfair Display, Georgia, serif',
                                              fontStyle: 'italic',
                                              fontWeight: 700,
                                              fontSize: { xs: '0.95rem', sm: '1.05rem' },
                                              color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.92)' : 'rgba(15,23,42,0.9)',
                                              overflow: 'hidden',
                                              textOverflow: 'ellipsis',
                                              display: '-webkit-box',
                                              WebkitLineClamp: 2,
                                              WebkitBoxOrient: 'vertical',
                                            }}
                                          >
                                            {profileUser.bio ? `"${profileUser.bio}"` : '"No bio added yet."'}
                                          </Typography>
                                        </Box>

                                        <Button
                                          size="small"
                                          variant="contained"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            navigate(`/profile/${profileUser.id}`);
                                          }}
                                          sx={{
                                            textTransform: 'none',
                                            fontWeight: 700,
                                            borderRadius: 1.75,
                                            px: 1.4,
                                            alignSelf: 'flex-end',
                                            background: 'linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)',
                                            boxShadow: '0 8px 16px rgba(37,99,235,0.24)',
                                          }}
                                        >
                                          View Profile
                                        </Button>
                                      </CardContent>
                                    </Card>
                                  );})}
                                </Stack>
                              </>
                            ) : null}
                          </Stack>
                        ) : (
                          <Box sx={{ py: 6, textAlign: 'center' }}>
                            <Typography color="text.secondary">
                              {searchSubFilter === 'posts'
                                ? 'No posts/events matched your search.'
                                : searchSubFilter === 'users'
                                  ? 'No user profiles matched your search. Try exact username (without @) for now.'
                                  : 'No search results matched your query.'}
                            </Typography>
                          </Box>
                        )}

                        {!loadingTimelines && !loadingSearchEvents && !loadingSearchUsers && hasSearchQuery &&
                        visibleTimelineCount < Math.max(
                          isTimelineSearchScope ? filteredTimelines.length : 0,
                          isPostSearchScope ? filteredPosts.length : 0,
                          isUserSearchScope ? filteredUsers.length : 0,
                        ) ? (
                          <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                            <Button
                              variant="outlined"
                              onClick={() => setVisibleTimelineCount((prev) => Math.min(
                                prev + HOME_LIST_BATCH_SIZE,
                                Math.max(
                                  isTimelineSearchScope ? filteredTimelines.length : 0,
                                  isPostSearchScope ? filteredPosts.length : 0,
                                  isUserSearchScope ? filteredUsers.length : 0,
                                ),
                              ))}
                            >
                              Load Next 100
                            </Button>
                          </Box>
                        ) : null}
                      </Box>
                      <Box
                        sx={{
                          position: 'absolute',
                          inset: 0,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 1.5,
                          opacity: isSearchSubmitting ? 1 : 0,
                          pointerEvents: 'none',
                          transition: 'opacity 180ms ease',
                        }}
                      >
                        <CircularProgress size={30} />
                        <Typography color="text.secondary">Searching...</Typography>
                      </Box>
                    </Box>
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
