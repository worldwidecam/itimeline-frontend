import React from 'react';
import { useNavigate } from 'react-router-dom';
import { alpha, useTheme } from '@mui/material/styles';
import {
  CircularProgress,
  LinearProgress,
  Box,
  Button,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  FormControlLabel,
  FormLabel,
  Radio,
  RadioGroup,
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
  Snackbar,
  Alert,
  Tooltip,
} from '@mui/material';
import {
  Close as CloseIcon,
  Search as SearchIcon,
  ArrowForward as ArrowForwardIcon,
  FavoriteBorder as HeartIcon,
  Lock as LockIcon,
  North as NorthIcon,
  ExpandMore as ExpandMoreIcon,
  LocalFireDepartment as LocalFireDepartmentIcon,
  Tag as TagIcon,
  Groups as GroupsIcon,
  Person as PersonIcon,
  AutoStories as AutoStoriesIcon,
  Cottage as CottageIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import api, {
  getFollowedUsers,
  getFollowerUsers,
  followUser,
  unfollowUser,
  fetchUserMemberships,
  getFollowedHashtagTimelines,
  syncUserPassport,
  getLandingRotatorSettings,
  addBrokenEventQueueItem,
  updateUserPreferences,
  getTimelineDetails,
  getTimelineQuote,
  getTimelineActions,
  getTimelineStatusMessage,
  getTimelineWarningState,
  voteTimelineAction,
} from '../utils/api';
import config from '../config';
import { EVENT_TYPES } from './timeline-v3/events/EventTypes';
import RemarkCard from './timeline-v3/events/cards/RemarkCard';
import NewsCard from './timeline-v3/events/cards/NewsCard';
import MediaCard from './timeline-v3/events/cards/MediaCard';
import QuoteDisplay from './timeline-v3/community/QuoteDisplay';
import { STATUS_ACTION_TYPE_MAP, STATUS_VARIANT_MAP, formatActionSchedule, getActionProgressMeta, canVoteForAction } from './timeline-v3/community/timelineStatusActionUtils';
import TradingCard from './common/TradingCard';
import EventDialog from './timeline-v3/events/EventDialog';
import EventPopup from './timeline-v3/events/EventPopup';
import { getTimelineSurfaceTheme } from './timeline-v3/timelineSurfaceTheme';
import {
  getGlassDialogPaperSx,
  getGlassInputSx,
  getGlassPillActionButtonSx,
  getGlassSquareActionButtonSx,
} from '../utils/formStyleGuide';
import { resolveUserIdentityColor } from '../utils/userIdentityColor';
import GuestHubFiller from './shared/GuestHubFiller';

const HOME_HERO_DEFAULT_ROTATE_MS = 75000;
const HOME_HERO_DEFAULT_SLIDES = [
  { type: 'welcome', enabled: true },
  { type: 'timeline_spotlight', enabled: true },
];
const HERO_CONTENT_FADE_MS = 280;
const HOME_NAVBAR_OFFSET_PX = 78;
const SEARCH_SUBMIT_DELAY_MS = 340;
const SEARCH_RESULT_HANDOFF_MS = 140;
const HOME_LIST_BATCH_SIZE = 100;
const POPULAR_LIST_BATCH_SIZE = 50;
const POPULAR_SCROLL_TOP_SHOW_THRESHOLD_PX = 140;
const POPULAR_SCROLL_TOP_HIDE_THRESHOLD_PX = 72;
const POPULAR_SCROLL_IDLE_MS = 140;
const ACTIVE_HUB_LOAD_MORE_TRIGGER_PX = 120;
const ACTIVE_HUB_LOAD_MORE_HIDE_PX = 260;
const HUB_PHASE_ONE_MS = 170;
const POPULAR_HOME_CACHE_KEY_PREFIX = 'home_popular_cache_v3';
const YOUR_PAGE_HOME_CACHE_KEY_PREFIX = 'home_your_page_cache_v3';
const FAVORITE_TIMELINE_KEY_PREFIX = 'home_favorite_timeline_v1';
const HOME_HERO_SETTINGS_CACHE_KEY = 'home_hero_settings_cache_v1';
const HOME_TIMELINES_FETCH_LIMIT = 120;
const HOME_PER_TIMELINE_EVENTS_FETCH_LIMIT = 50;
const HOME_POPULAR_TIMELINE_SOURCE_LIMIT = 50;
const HOME_POPULAR_EVENTS_RANKING_LIMIT = 400;
const HOME_SEARCH_TIMELINE_SOURCE_LIMIT = 50;
const HOME_SEARCH_EVENTS_RESULT_LIMIT = 300;
const HOME_YOUR_PAGE_TIMELINE_SOURCE_LIMIT = 50;
const HOME_YOUR_PAGE_EVENTS_RESULT_LIMIT = 400;
const HOME_MY_CREATIONS_TIMELINE_SOURCE_LIMIT = 50;
const HOME_MY_CREATIONS_EVENTS_RESULT_LIMIT = 300;
const HOME_FOLLOWED_USERS_SOURCE_LIMIT = 25;
const HOME_FAVORITE_EVENTS_FETCH_LIMIT = 50;
const HOME_SEARCH_USERS_RESULT_LIMIT = 50;
const EMPTY_REVIEWING_EVENT_IDS = new Set();
const DEFAULT_FAVORITE_QUOTE = {
  text: 'Those who make Peaceful Revolution impossible, will make violent Revolution inevitable.',
  author: 'John F. Kennedy',
};
const ACTION_CARD_DEFAULT_TITLE_BY_TYPE = {
  gold: 'Gold Community Action',
  silver: 'Silver Community Action',
  bronze: 'Bronze Community Action',
};
const ACTION_CARD_DEFAULT_DESCRIPTION_BY_TYPE = {
  gold: 'Complete this action to unlock gold benefits.',
  silver: 'Complete this action to unlock silver benefits.',
  bronze: 'Complete this action to unlock bronze benefits.',
};

const CREATE_TIMELINE_TYPE_OPTIONS = [
  {
    key: 'community',
    label: 'Community Timeline',
    prefix: 'i-',
    tag: 'COMMUNITY',
    description: 'Public space where a community can collaborate and map events they care about together.',
    helper: 'Great for causes, fandoms, local groups, and shared historical tracking.',
    icon: GroupsIcon,
  },
  {
    key: 'personal',
    label: 'Personal Timeline',
    prefix: 'My-',
    tag: 'PERSONAL',
    description: 'Private-leaning timeline space for moments that are for you and loved ones.',
    helper: 'Privacy depends on you and the choices you set for your timeline.',
    icon: null,
  },
];

const PersonalTimelineChoiceIcon = () => (
  <Box sx={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
    <HeartIcon sx={{ fontSize: 20 }} />
    <LockIcon
      sx={{
        fontSize: 11,
        position: 'absolute',
        bottom: -2,
        right: -2,
      }}
    />
  </Box>
);

const getTimelinePrefixByType = (timelineType) => {
  const type = String(timelineType || '').toLowerCase();
  if (type === 'community') return 'i-';
  if (type === 'personal') return 'My-';
  return '#';
};

const stripTimelinePrefix = (name, timelineType) => {
  const raw = String(name || '').trim();
  const type = String(timelineType || '').toLowerCase();
  if (!raw) return '';
  if (type === 'community') return raw.replace(/^i-/i, '');
  if (type === 'personal') return raw.replace(/^my-/i, '');
  return raw.replace(/^#+/, '');
};

const resolveHeroCtaTarget = (rawHref) => {
  const href = String(rawHref || '').trim();
  if (!href) return null;

  if (/^(https?:|mailto:|tel:)/i.test(href)) {
    return { external: true, href };
  }

  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/i.test(href)) {
    return { external: true, href };
  }

  if (href.startsWith('/')) {
    return { external: false, href };
  }

  if (/^[\w.-]+\.[a-z]{2,}(?:[/:?#]|$)/i.test(href)) {
    return { external: true, href: `https://${href}` };
  }

  return { external: false, href: `/${href.replace(/^\/+/, '')}` };
};

const getTimelineHeroLandscapeImageUrl = (timeline) => String(
  timeline?.cover_landscape_image_url
  || timeline?.cover_landscape_url
  || timeline?.landscape_image_url
  || timeline?.banner_url
  || timeline?.cover_image_url
  || timeline?.cover_url
  || timeline?.background_image_url
  || timeline?.image_url
  || timeline?.thumbnail_url
  || '',
).trim();

const hasMeaningfulActionCardContent = (action) => {
  if (!action) return false;
  const actionType = String(action?.action_type || '').toLowerCase();
  const title = String(action?.title || '').trim();
  const description = String(action?.description || '').trim();
  const hasCustomTitle = Boolean(title) && title !== (ACTION_CARD_DEFAULT_TITLE_BY_TYPE[actionType] || '');
  const hasCustomDescription = Boolean(description) && description !== (ACTION_CARD_DEFAULT_DESCRIPTION_BY_TYPE[actionType] || '');
  return hasCustomTitle || hasCustomDescription;
};

const LEFT_HUB_TABS = [
  { key: 'timeline-search', label: 'SEARCH', icon: SearchIcon },
  { key: 'popular', label: 'POPULAR', icon: LocalFireDepartmentIcon },
  { key: 'your-page', label: 'YOUR HOME PAGE', icon: CottageIcon },
  { key: 'favorite', label: 'FAVORITE', icon: StarBorderIcon },
  { key: 'my-creations', label: 'MY CREATIONS', icon: AutoStoriesIcon },
  { key: 'friends-list', label: 'FRIENDS LIST', icon: GroupsIcon },
];

const SEARCH_SUB_FILTERS = [
  { key: 'all', label: 'All', mode: 'mixed' },
  { key: 'timelines', label: 'TIMELINES', mode: 'timeline' },
  { key: 'posts', label: 'POSTS', mode: 'post' },
  { key: 'users', label: 'USERS', mode: 'user' },
];

const FRIENDS_LIST_FILTERS = [
  { key: 'following', label: 'Following' },
  { key: 'followers', label: 'Followers' },
];

const MY_CREATIONS_FILTERS = [
  { key: 'timelines', label: 'Timelines' },
  { key: 'posts', label: 'Posts' },
];

const YOUR_PAGE_FILTERS = [
  { key: 'posts', label: 'Posts' },
  { key: 'timelines', label: 'Timelines' },
];

const POPULAR_FILTERS = [
  { key: 'posts', label: 'Posts' },
  { key: 'timelines', label: 'Timelines' },
];

const HomePage = () => {
  const navigate = useNavigate();
  const { user, isGuest } = useAuth();
  const theme = useTheme();
  const appCanvasBackground = getTimelineSurfaceTheme(theme).canvas;
  const resultsScrollRef = React.useRef(null);
  const popularScrollRef = React.useRef(null);
  const myCreationsScrollRef = React.useRef(null);
  const yourPageScrollRef = React.useRef(null);
  const favoriteScrollRef = React.useRef(null);
  const friendsListScrollRef = React.useRef(null);
  const heroTransitionTimeoutRef = React.useRef(null);
  const heroTransitionRequestRef = React.useRef(0);
  const topVotesTodayFetchPromiseRef = React.useRef(null);
  const topVotesTodayFetchDayRef = React.useRef('');
  const topVotesTodayFetchAtRef = React.useRef(0);
  const hubTransitionTimeoutRef = React.useRef(null);
  const myCreationsFetchTimeoutRef = React.useRef(null);
  const myCreationsFilterTransitionTimeoutRef = React.useRef(null);
  const searchSubmitTimeoutRef = React.useRef(null);
  const searchRevealTimeoutRef = React.useRef(null);
  const popularArrowRafRef = React.useRef(null);
  const popularArrowVisibleRef = React.useRef(false);
  const popularScrollIdleTimeoutRef = React.useRef(null);
  const brokenEventReportDedupRef = React.useRef(new Map());

  const getPopularCacheKey = React.useCallback(
    (userId) => `${POPULAR_HOME_CACHE_KEY_PREFIX}:${Number(userId || 0)}`,
    [],
  );

  const clearPopularCache = React.useCallback((targetUserId) => {
    try {
      if (targetUserId) {
        window.sessionStorage.removeItem(getPopularCacheKey(targetUserId));
        return;
      }

      Object.keys(window.sessionStorage).forEach((key) => {
        if (key.startsWith(`${POPULAR_HOME_CACHE_KEY_PREFIX}:`)) {
          window.sessionStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error('Error clearing Popular cache:', error);
    }
  }, [getPopularCacheKey]);

  const getYourPageCacheKey = React.useCallback(
    (userId) => `${YOUR_PAGE_HOME_CACHE_KEY_PREFIX}:${Number(userId || 0)}`,
    [],
  );

  const clearYourPageCache = React.useCallback((targetUserId) => {
    try {
      if (targetUserId) {
        window.sessionStorage.removeItem(getYourPageCacheKey(targetUserId));
        return;
      }

      Object.keys(window.sessionStorage).forEach((key) => {
        if (key.startsWith(`${YOUR_PAGE_HOME_CACHE_KEY_PREFIX}:`)) {
          window.sessionStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error('Error clearing Your Page cache:', error);
    }
  }, [getYourPageCacheKey]);

  const [loading, setLoading] = React.useState(false);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [timelines, setTimelines] = React.useState([]);
  const [searchEvents, setSearchEvents] = React.useState([]);
  const [searchUsers, setSearchUsers] = React.useState([]);
  const [followedUsers, setFollowedUsers] = React.useState([]);
  const [followerUsers, setFollowerUsers] = React.useState([]);
  const [myCreationEvents, setMyCreationEvents] = React.useState([]);
  const [loadingSearchEvents, setLoadingSearchEvents] = React.useState(false);
  const [loadingSearchUsers, setLoadingSearchUsers] = React.useState(false);
  const [loadingFollowedUsers, setLoadingFollowedUsers] = React.useState(false);
  const [loadingFollowerUsers, setLoadingFollowerUsers] = React.useState(false);
  const [loadingMyCreationEvents, setLoadingMyCreationEvents] = React.useState(false);
  const [followActionByUserId, setFollowActionByUserId] = React.useState({});
  const [userActionMenu, setUserActionMenu] = React.useState({ anchorEl: null, userId: null });
  const [hasLoadedSearchEvents, setHasLoadedSearchEvents] = React.useState(false);
  const [hasLoadedMyCreationEvents, setHasLoadedMyCreationEvents] = React.useState(false);
  const [loadingTimelines, setLoadingTimelines] = React.useState(true);
  const [heroIndex, setHeroIndex] = React.useState(0);
  const [heroTransitionPending, setHeroTransitionPending] = React.useState(false);
  const [heroRotateMs, setHeroRotateMs] = React.useState(HOME_HERO_DEFAULT_ROTATE_MS);
  const [heroSlides, setHeroSlides] = React.useState(HOME_HERO_DEFAULT_SLIDES);
  const [isHeroContentVisible, setIsHeroContentVisible] = React.useState(true);
  const [activeHubTab, setActiveHubTab] = React.useState('popular');
  const [isHubContentVisible, setIsHubContentVisible] = React.useState(true);
  const [isHubPhaseOneLoading, setIsHubPhaseOneLoading] = React.useState(false);
  const [showActiveHubScrollTop, setShowActiveHubScrollTop] = React.useState(false);
  const [showActiveHubLoadMore, setShowActiveHubLoadMore] = React.useState(false);
  const [isMyCreationsSubTabPhaseOneLoading, setIsMyCreationsSubTabPhaseOneLoading] = React.useState(false);
  const [searchSubFilter, setSearchSubFilter] = React.useState('all');
  const [popularFilter, setPopularFilter] = React.useState('posts');
  const [myCreationsFilter, setMyCreationsFilter] = React.useState('posts');
  const [yourPageFilter, setYourPageFilter] = React.useState('posts');
  const [friendsListFilter, setFriendsListFilter] = React.useState('following');
  const [timelineSearchInput, setTimelineSearchInput] = React.useState('');
  const [timelineSearch, setTimelineSearch] = React.useState('');
  const [isSearchSubmitting, setIsSearchSubmitting] = React.useState(false);
  const [isSearchResultsVisible, setIsSearchResultsVisible] = React.useState(true);
  const [userFollowSnackbarOpen, setUserFollowSnackbarOpen] = React.useState(false);
  const [userFollowSnackbarMessage, setUserFollowSnackbarMessage] = React.useState('');
  const [userFollowSnackbarSeverity, setUserFollowSnackbarSeverity] = React.useState('success');
  const [visibleTimelineCount, setVisibleTimelineCount] = React.useState(HOME_LIST_BATCH_SIZE);
  const [visiblePopularTimelineCount, setVisiblePopularTimelineCount] = React.useState(POPULAR_LIST_BATCH_SIZE);
  const [visiblePopularPostCount, setVisiblePopularPostCount] = React.useState(POPULAR_LIST_BATCH_SIZE);
  const [visibleMyCreationsTimelineCount, setVisibleMyCreationsTimelineCount] = React.useState(HOME_LIST_BATCH_SIZE);
  const [visibleMyCreationsPostCount, setVisibleMyCreationsPostCount] = React.useState(HOME_LIST_BATCH_SIZE);
  const [visibleYourPageTimelineCount, setVisibleYourPageTimelineCount] = React.useState(HOME_LIST_BATCH_SIZE);
  const [visibleYourPagePostCount, setVisibleYourPagePostCount] = React.useState(HOME_LIST_BATCH_SIZE);
  const [visibleFavoritePostCount, setVisibleFavoritePostCount] = React.useState(HOME_LIST_BATCH_SIZE);
  const [popularTimelines, setPopularTimelines] = React.useState([]);
  const [popularEvents, setPopularEvents] = React.useState([]);
  const [loadingPopular, setLoadingPopular] = React.useState(false);
  const [hasLoadedPopular, setHasLoadedPopular] = React.useState(false);
  const [hasBootstrappedPopularCache, setHasBootstrappedPopularCache] = React.useState(false);
  const [yourPageTimelines, setYourPageTimelines] = React.useState([]);
  const [yourPageEvents, setYourPageEvents] = React.useState([]);
  const [loadingYourPage, setLoadingYourPage] = React.useState(false);
  const [hasLoadedYourPage, setHasLoadedYourPage] = React.useState(false);
  const [hasBootstrappedYourPageCache, setHasBootstrappedYourPageCache] = React.useState(false);
  const [favoriteTimelineId, setFavoriteTimelineId] = React.useState(null);
  const lastSyncedFavoriteTimelineIdRef = React.useRef(undefined);
  const [favoriteTimelineDetails, setFavoriteTimelineDetails] = React.useState(null);
  const [loadingFavoriteTimelineDetails, setLoadingFavoriteTimelineDetails] = React.useState(false);
  const [favoriteTimelineEvents, setFavoriteTimelineEvents] = React.useState([]);
  const [loadingFavoriteTimelineEvents, setLoadingFavoriteTimelineEvents] = React.useState(false);
  const [favoriteTimelineQuote, setFavoriteTimelineQuote] = React.useState(DEFAULT_FAVORITE_QUOTE);
  const [favoriteTimelineActions, setFavoriteTimelineActions] = React.useState([]);
  const [favoriteTimelineStatusMessage, setFavoriteTimelineStatusMessage] = React.useState({ active: false, status_type: null, title: '', body: '' });
  const [favoriteTimelineWarningState, setFavoriteTimelineWarningState] = React.useState({ active: false, warning_scope: null, title: '', body: '' });
  const [loadingFavoriteTimelineContext, setLoadingFavoriteTimelineContext] = React.useState(false);
  const [favoriteVoteLoadingByType, setFavoriteVoteLoadingByType] = React.useState({ bronze: false, silver: false, gold: false });
  const [heroEventPopupEvent, setHeroEventPopupEvent] = React.useState(null);
  const [heroEventPopupLoading, setHeroEventPopupLoading] = React.useState(false);
  const [topVotesTodayEvent, setTopVotesTodayEvent] = React.useState(null);
  const [topVotesTodayLoading, setTopVotesTodayLoading] = React.useState(false);
  const [prefetchedSpotlightEvent, setPrefetchedSpotlightEvent] = React.useState(null);
  const [postTypeDialogOpen, setPostTypeDialogOpen] = React.useState(false);
  const [postEventDialogOpen, setPostEventDialogOpen] = React.useState(false);
  const [postFlowLoading, setPostFlowLoading] = React.useState(false);
  const [postSubmitLoading, setPostSubmitLoading] = React.useState(false);
  const [postTargetTimeline, setPostTargetTimeline] = React.useState(null);
  const [postAdvancedOpen, setPostAdvancedOpen] = React.useState(false);
  const [postTimelineSearchInput, setPostTimelineSearchInput] = React.useState('');
  const [hasSelectedTimelineType, setHasSelectedTimelineType] = React.useState(false);
  const [formData, setFormData] = React.useState({
    name: '',
    description: '',
    timeline_type: 'community',
    visibility: 'public',
    timeline_mode: 'community',
  });

  const getFavoriteTimelineKey = React.useCallback(
    (userId) => `${FAVORITE_TIMELINE_KEY_PREFIX}:${Number(userId || 0)}`,
    [],
  );

  React.useEffect(() => {
    if (!user?.id) {
      setFavoriteTimelineId(null);
      lastSyncedFavoriteTimelineIdRef.current = null;
      return;
    }
    let isCancelled = false;

    const hydrateFavoriteTimeline = async () => {
      let resolvedFavoriteTimelineId = null;

      try {
        const passportResponse = await api.get('/api/v1/user/passport');
        const preferenceCandidate = passportResponse?.data?.preferences?.favorite_timeline_id;
        const parsedPreference = Number(preferenceCandidate || 0);
        if (parsedPreference > 0) {
          resolvedFavoriteTimelineId = parsedPreference;
        }
      } catch (error) {
        console.warn('[HomePage] Failed to hydrate favorite timeline from passport:', error?.response?.data || error?.message || error);
      }

      if (!(resolvedFavoriteTimelineId > 0)) {
        try {
          const passportCacheRaw = window.localStorage.getItem(`user_passport_${Number(user.id || 0)}`);
          if (passportCacheRaw) {
            const parsedPassportCache = JSON.parse(passportCacheRaw);
            const passportFavorite = Number(parsedPassportCache?.preferences?.favorite_timeline_id || 0);
            if (passportFavorite > 0) {
              resolvedFavoriteTimelineId = passportFavorite;
            }
          }
        } catch (error) {
          console.warn('[HomePage] Failed to parse cached passport favorite:', error);
        }
      }

      if (!(resolvedFavoriteTimelineId > 0)) {
        try {
          const raw = window.localStorage.getItem(getFavoriteTimelineKey(user.id));
          const parsed = Number(raw || 0);
          resolvedFavoriteTimelineId = parsed > 0 ? parsed : null;
        } catch (error) {
          console.error('Error reading favorite timeline from localStorage:', error);
          resolvedFavoriteTimelineId = null;
        }
      }

      if (isCancelled) return;
      setFavoriteTimelineId(resolvedFavoriteTimelineId);
      lastSyncedFavoriteTimelineIdRef.current = resolvedFavoriteTimelineId;
    };

    hydrateFavoriteTimeline();

    return () => {
      isCancelled = true;
    };
  }, [user?.id, getFavoriteTimelineKey]);

  React.useEffect(() => {
    if (!user?.id) return;
    try {
      const key = getFavoriteTimelineKey(user.id);
      if (favoriteTimelineId && favoriteTimelineId > 0) {
        window.localStorage.setItem(key, String(favoriteTimelineId));
      } else {
        window.localStorage.removeItem(key);
      }
    } catch (error) {
      console.error('Error writing favorite timeline to localStorage:', error);
    }
  }, [user?.id, favoriteTimelineId, getFavoriteTimelineKey]);

  React.useEffect(() => {
    setHasBootstrappedPopularCache(false);
    setHasBootstrappedYourPageCache(false);
  }, [user?.id]);

  React.useEffect(() => {
    const fetchTimelines = async () => {
      if (!user) return;
      try {
        setLoadingTimelines(true);
        const response = await api.get('/api/timeline-v3', {
          params: { limit: HOME_TIMELINES_FETCH_LIMIT },
        });
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
    let active = true;

    try {
      const cachedRaw = window.localStorage.getItem(HOME_HERO_SETTINGS_CACHE_KEY);
      if (cachedRaw) {
        const cached = JSON.parse(cachedRaw);
        const cachedSlides = Array.isArray(cached?.slides)
          ? cached.slides.filter((slide) => slide && typeof slide === 'object')
          : [];
        const cachedInterval = Number(cached?.rotation_interval_ms) || HOME_HERO_DEFAULT_ROTATE_MS;
        if (cachedSlides.length > 0) {
          setHeroRotateMs(cachedInterval);
          setHeroSlides(cachedSlides);
        }
      }
    } catch (error) {
      console.warn('[HomePage] Failed to hydrate cached hero settings:', error);
    }

    const loadHomeHeroSettings = async () => {
      try {
        const data = await getLandingRotatorSettings();
        if (!active) return;

        const homeHero = data?.landing_rotator?.home_hero || {};
        const configuredSlides = Array.isArray(homeHero?.slides)
          ? homeHero.slides.filter((slide) => slide && typeof slide === 'object')
          : [];

        setHeroRotateMs(Number(homeHero?.rotation_interval_ms) || HOME_HERO_DEFAULT_ROTATE_MS);
        setHeroSlides(configuredSlides.length ? configuredSlides : HOME_HERO_DEFAULT_SLIDES);

        try {
          window.localStorage.setItem(HOME_HERO_SETTINGS_CACHE_KEY, JSON.stringify({
            rotation_interval_ms: Number(homeHero?.rotation_interval_ms) || HOME_HERO_DEFAULT_ROTATE_MS,
            slides: configuredSlides.length ? configuredSlides : HOME_HERO_DEFAULT_SLIDES,
          }));
        } catch (error) {
          console.warn('[HomePage] Failed to cache hero settings:', error);
        }
      } catch (error) {
        if (!active) return;
        setHeroRotateMs(HOME_HERO_DEFAULT_ROTATE_MS);
        setHeroSlides(HOME_HERO_DEFAULT_SLIDES);
      }
    };

    loadHomeHeroSettings();

    return () => {
      active = false;
    };
  }, []);

  const enabledHeroSlides = React.useMemo(() => {
    const allowed = new Set(['welcome', 'timeline_spotlight', 'trending_community', 'event_spotlight', 'advertisement']);
    const unique = [];
    const seen = new Set();

    heroSlides.forEach((slide) => {
      const type = String(slide?.type || '').toLowerCase();
      if (!allowed.has(type) || seen.has(type)) return;
      if (slide?.enabled === false) return;
      seen.add(type);
      unique.push({ ...slide, type });
    });

    return unique.length ? unique : HOME_HERO_DEFAULT_SLIDES;
  }, [heroSlides]);

  const getTodayKey = React.useCallback(() => {
    const now = new Date();
    return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
  }, []);

  const fetchAndHydrateTopVotesTodayEvent = React.useCallback(async ({ force = false } = {}) => {
    const nowMs = Date.now();
    const todayKey = getTodayKey();
    const hasFreshTodaySnapshot = !force
      && topVotesTodayFetchDayRef.current === todayKey
      && nowMs - topVotesTodayFetchAtRef.current < 120000;

    if (hasFreshTodaySnapshot) {
      const prefetchedId = Number(prefetchedSpotlightEvent?.id || 0);
      if (prefetchedId > 0) return prefetchedSpotlightEvent;
      return topVotesTodayEvent;
    }

    if (topVotesTodayFetchPromiseRef.current) {
      return topVotesTodayFetchPromiseRef.current;
    }

    const requestPromise = (async () => {
      setTopVotesTodayLoading(true);
      try {
        const response = await api.get('/api/v1/events/spotlight/top-voted-today');
        const rawEvent = response?.data?.event;
        const baseEvent = rawEvent && typeof rawEvent === 'object' ? rawEvent : null;
        setTopVotesTodayEvent(baseEvent);

        let hydratedEvent = baseEvent;
        const hydratedEventId = Number(baseEvent?.id || 0);
        const hydratedTimelineId = Number(baseEvent?.timeline_id || 0);

        if (hydratedEventId > 0 && hydratedTimelineId > 0) {
          try {
            const detailResponse = await api.get(`/api/timeline-v3/${hydratedTimelineId}/events/${hydratedEventId}`);
            const detailEvent = detailResponse?.data;
            if (detailEvent?.id) {
              hydratedEvent = { ...detailEvent, ...baseEvent };
            }
          } catch (detailError) {
            console.warn('[HomePage] Failed to hydrate top-voted spotlight event details:', detailError?.response?.data || detailError?.message || detailError);
          }
        }

        setPrefetchedSpotlightEvent(hydratedEvent && typeof hydratedEvent === 'object' ? hydratedEvent : null);
        topVotesTodayFetchDayRef.current = todayKey;
        topVotesTodayFetchAtRef.current = Date.now();
        return hydratedEvent;
      } catch (error) {
        setTopVotesTodayEvent(null);
        setPrefetchedSpotlightEvent(null);
        console.warn('[HomePage] Failed to fetch top-voted event for today:', error?.response?.data || error?.message || error);
        return null;
      } finally {
        setTopVotesTodayLoading(false);
        topVotesTodayFetchPromiseRef.current = null;
      }
    })();

    topVotesTodayFetchPromiseRef.current = requestPromise;
    return requestPromise;
  }, [getTodayKey, prefetchedSpotlightEvent, topVotesTodayEvent]);

  const transitionToHeroSlide = React.useCallback(
    async (nextIndex) => {
      if (nextIndex === heroIndex || heroTransitionPending) return;

      try {
        const nextSlide = enabledHeroSlides[nextIndex] || null;
        const transitionRequestId = heroTransitionRequestRef.current + 1;
        heroTransitionRequestRef.current = transitionRequestId;

        setHeroTransitionPending(true);

        if (
          nextSlide?.type === 'event_spotlight'
          && String(nextSlide?.selection_mode || 'manual').toLowerCase() === 'top_votes_today'
        ) {
          await fetchAndHydrateTopVotesTodayEvent();
        }

        if (transitionRequestId !== heroTransitionRequestRef.current) {
          setHeroTransitionPending(false);
          return;
        }

        if (heroTransitionTimeoutRef.current) {
          window.clearTimeout(heroTransitionTimeoutRef.current);
        }

        setIsHeroContentVisible(false);
        heroTransitionTimeoutRef.current = window.setTimeout(() => {
          if (transitionRequestId !== heroTransitionRequestRef.current) {
            setHeroTransitionPending(false);
            return;
          }
          setHeroIndex(nextIndex);
          setIsHeroContentVisible(true);
          setHeroTransitionPending(false);
        }, HERO_CONTENT_FADE_MS);
      } catch (error) {
        setHeroTransitionPending(false);
        console.warn('[HomePage] Hero transition prep failed:', error?.response?.data || error?.message || error);
      }
    },
    [enabledHeroSlides, fetchAndHydrateTopVotesTodayEvent, heroIndex, heroTransitionPending],
  );

  React.useEffect(() => {
    if (enabledHeroSlides.length <= 1) return undefined;

    const timer = window.setTimeout(() => {
      transitionToHeroSlide((heroIndex + 1) % enabledHeroSlides.length);
    }, heroRotateMs || HOME_HERO_DEFAULT_ROTATE_MS);

    return () => {
      window.clearTimeout(timer);
    };
  }, [heroIndex, heroRotateMs, transitionToHeroSlide, enabledHeroSlides.length]);

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
      if (popularArrowRafRef.current) {
        window.cancelAnimationFrame(popularArrowRafRef.current);
      }
      if (popularScrollIdleTimeoutRef.current) {
        window.clearTimeout(popularScrollIdleTimeoutRef.current);
      }
    },
    [],
  );

  React.useEffect(() => {
    popularArrowVisibleRef.current = showActiveHubScrollTop;
  }, [showActiveHubScrollTop]);

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
      setShowActiveHubScrollTop(false);
      setShowActiveHubLoadMore(false);
      setActiveHubTab(nextTab);
      hubTransitionTimeoutRef.current = window.setTimeout(() => {
        setIsHubContentVisible(true);
        setIsHubPhaseOneLoading(false);
      }, HUB_PHASE_ONE_MS);
    },
    [activeHubTab],
  );

  const getActiveHubScrollElement = React.useCallback(() => {
    if (activeHubTab === 'timeline-search') return resultsScrollRef.current;
    if (activeHubTab === 'popular') return popularScrollRef.current;
    if (activeHubTab === 'my-creations') return myCreationsScrollRef.current;
    if (activeHubTab === 'your-page') return yourPageScrollRef.current;
    if (activeHubTab === 'favorite') return favoriteScrollRef.current;
    if (activeHubTab === 'friends-list') return friendsListScrollRef.current;
    return null;
  }, [activeHubTab]);

  const refreshActiveHubScrollTop = React.useCallback(() => {
    const el = getActiveHubScrollElement();
    if (!el) {
      setShowActiveHubScrollTop(false);
      setShowActiveHubLoadMore(false);
      return;
    }

    const canScroll = el.scrollHeight > el.clientHeight + 2;
    const distanceFromBottom = el.scrollHeight - (el.scrollTop + el.clientHeight);
    setShowActiveHubScrollTop(canScroll && el.scrollTop > 24);
    setShowActiveHubLoadMore((prev) => {
      if (distanceFromBottom <= ACTIVE_HUB_LOAD_MORE_TRIGGER_PX) return true;
      if (distanceFromBottom >= ACTIVE_HUB_LOAD_MORE_HIDE_PX) return false;
      return prev;
    });
  }, [getActiveHubScrollElement]);

  React.useEffect(() => {
    const id = window.requestAnimationFrame(() => {
      refreshActiveHubScrollTop();
    });

    return () => {
      window.cancelAnimationFrame(id);
    };
  }, [
    activeHubTab,
    isHubPhaseOneLoading,
    isHubContentVisible,
    loadingPopular,
    loadingYourPage,
    loadingFavoriteTimelineEvents,
    loadingFollowedUsers,
    popularFilter,
    yourPageFilter,
    myCreationsFilter,
    visibleFavoritePostCount,
    favoriteTimelineEvents.length,
    refreshActiveHubScrollTop,
  ]);

  const hasSearchQuery = timelineSearch.trim().length > 0;
  const hasSearchDraft = timelineSearchInput.trim().length > 0;
  const isTimelineSearchScope = searchSubFilter === 'all' || searchSubFilter === 'timelines';
  const isPostSearchScope = searchSubFilter === 'all' || searchSubFilter === 'posts';
  const isUserSearchScope = searchSubFilter === 'all' || searchSubFilter === 'users';
  const isFollowersFriendsListFilter = friendsListFilter === 'followers';
  const currentUserId = Number(user?.id || 0);
  const followedUserIdSet = React.useMemo(() => {
    return new Set(
      followedUsers
        .map((profileUser) => Number(profileUser?.id || 0))
        .filter((id) => id > 0),
    );
  }, [followedUsers]);
  const activeFriendsUsers = isFollowersFriendsListFilter ? followerUsers : followedUsers;
  const activeFriendsLoading = isFollowersFriendsListFilter ? loadingFollowerUsers : loadingFollowedUsers;

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

  React.useEffect(() => {
    if (!enabledHeroSlides.length) {
      setHeroIndex(0);
      return;
    }
    if (heroIndex >= enabledHeroSlides.length) {
      setHeroIndex(0);
    }
  }, [heroIndex, enabledHeroSlides.length]);

  const spotlightTimeline = React.useMemo(() => {
    const eligibleTimelines = normalizedTimelines.filter((timeline) => {
      const timelineType = String(timeline?.timeline_type || '').toLowerCase();
      const visibility = String(timeline?.visibility || 'public').toLowerCase();
      return timelineType !== 'personal' && visibility !== 'private';
    });

    if (!eligibleTimelines.length) return null;
    const dayBucket = Math.floor(Date.now() / (24 * 60 * 60 * 1000));
    return eligibleTimelines[dayBucket % eligibleTimelines.length];
  }, [normalizedTimelines]);

  const eventLookupPool = React.useMemo(() => {
    const byId = new Map();
    [...popularEvents, ...yourPageEvents, ...searchEvents, ...myCreationEvents, ...favoriteTimelineEvents].forEach((event) => {
      const eventId = Number(event?.id || 0);
      if (eventId > 0 && !byId.has(eventId)) {
        byId.set(eventId, event);
      }
    });
    return byId;
  }, [popularEvents, yourPageEvents, searchEvents, myCreationEvents, favoriteTimelineEvents]);

  const activeHeroSlide = enabledHeroSlides[heroIndex] || enabledHeroSlides[0] || null;
  const isEventSpotlightTopVotesMode = activeHeroSlide?.type === 'event_spotlight'
    && String(activeHeroSlide?.selection_mode || 'manual').toLowerCase() === 'top_votes_today';
  const isEventPublishedToday = React.useCallback((event) => {
    const rawDate = event?.created_at || event?.published_at || event?.publishedAt || event?.event_date;
    if (!rawDate) return false;

    const parsed = new Date(rawDate);
    if (Number.isNaN(parsed.getTime())) return false;

    const now = new Date();
    return parsed.getFullYear() === now.getFullYear()
      && parsed.getMonth() === now.getMonth()
      && parsed.getDate() === now.getDate();
  }, []);
  const getEventVoteTotal = React.useCallback((event) => {
    const totalCount = Number(event?.total_count ?? event?.totalCount ?? event?.popularity_votes ?? 0) || 0;
    if (totalCount > 0) return totalCount;
    const promoteCount = Number(event?.promote_count ?? event?.promoteCount ?? event?.promote ?? 0) || 0;
    const demoteCount = Number(event?.demote_count ?? event?.demoteCount ?? event?.demote ?? 0) || 0;
    return promoteCount + demoteCount;
  }, []);
  const trendingCommunityTimeline = React.useMemo(() => {
    if (activeHeroSlide?.type !== 'trending_community') return null;

    const selectionMode = String(activeHeroSlide?.selection_mode || 'manual').toLowerCase();

    if (selectionMode === 'top_members_followers') {
      const eligibleCommunities = normalizedTimelines.filter((entry) => {
        const timelineType = String(entry?.timeline_type || entry?.type || '').toLowerCase();
        const visibility = String(entry?.visibility || 'public').toLowerCase();
        return timelineType === 'community' && visibility !== 'private';
      });

      if (!eligibleCommunities.length) return null;

      const getAudienceScore = (entry) => {
        const memberCount = Number(entry?.member_count ?? entry?.memberCount ?? 0) || 0;
        const followerCount = Number(
          entry?.follow_count
          ?? entry?.followers_count
          ?? entry?.follower_count
          ?? entry?.followersCount
          ?? 0,
        ) || 0;
        const popularityCount = Number(entry?.popularity_count ?? 0) || 0;
        return memberCount || followerCount || popularityCount;
      };

      return [...eligibleCommunities]
        .sort((a, b) => {
          const scoreDelta = getAudienceScore(b) - getAudienceScore(a);
          if (scoreDelta !== 0) return scoreDelta;
          return Number(b?.id || 0) - Number(a?.id || 0);
        })[0] || null;
    }

    const targetId = Number(activeHeroSlide?.timeline_id || 0);
    if (!(targetId > 0)) return null;

    const timeline = normalizedTimelines.find((entry) => Number(entry?.id || entry?.timeline_id || 0) === targetId);
    if (!timeline) return null;

    const timelineType = String(timeline?.timeline_type || timeline?.type || '').toLowerCase();
    const visibility = String(timeline?.visibility || 'public').toLowerCase();
    if (timelineType !== 'community' || visibility === 'private') return null;

    return timeline;
  }, [activeHeroSlide?.type, activeHeroSlide?.timeline_id, activeHeroSlide?.selection_mode, normalizedTimelines]);

  React.useEffect(() => {
    if (!isEventSpotlightTopVotesMode) {
      return undefined;
    }

    const loadTopVotesTodayEvent = async () => {
      await fetchAndHydrateTopVotesTodayEvent();
    };

    loadTopVotesTodayEvent();
  }, [fetchAndHydrateTopVotesTodayEvent, isEventSpotlightTopVotesMode]);

  const spotlightEvent = React.useMemo(() => {
    if (activeHeroSlide?.type !== 'event_spotlight') return null;

    const selectionMode = String(activeHeroSlide?.selection_mode || 'manual').toLowerCase();
    if (selectionMode === 'top_votes_today') {
      const fetchedEventId = Number(topVotesTodayEvent?.id || 0);
      if (fetchedEventId > 0) {
        const prefetchedEventId = Number(prefetchedSpotlightEvent?.id || 0);
        const fromLoadedFeeds = eventLookupPool.get(fetchedEventId) || null;
        if (prefetchedEventId === fetchedEventId) {
          return {
            ...(fromLoadedFeeds || {}),
            ...prefetchedSpotlightEvent,
            ...topVotesTodayEvent,
          };
        }
        return fromLoadedFeeds
          ? { ...fromLoadedFeeds, ...topVotesTodayEvent }
          : topVotesTodayEvent;
      }

      const candidates = Array.from(eventLookupPool.values()).filter((event) => {
        const timelineType = String(event?.timeline_type || '').toLowerCase();
        const timelineVisibility = String(event?.timeline_visibility || event?.visibility || 'public').toLowerCase();
        if (timelineType === 'personal' || timelineVisibility === 'private') return false;
        return isEventPublishedToday(event);
      });

      if (!candidates.length) return null;

      return [...candidates].sort((a, b) => {
        const voteDelta = getEventVoteTotal(b) - getEventVoteTotal(a);
        if (voteDelta !== 0) return voteDelta;
        const dateDelta = new Date(b?.event_date || b?.created_at || 0) - new Date(a?.event_date || a?.created_at || 0);
        if (dateDelta !== 0) return dateDelta;
        return Number(b?.id || 0) - Number(a?.id || 0);
      })[0] || null;
    }

    const targetId = Number(activeHeroSlide?.event_id || 0);
    if (!(targetId > 0)) return null;
    return eventLookupPool.get(targetId) || null;
  }, [
    activeHeroSlide?.type,
    activeHeroSlide?.event_id,
    activeHeroSlide?.selection_mode,
    eventLookupPool,
    getEventVoteTotal,
    isEventPublishedToday,
    prefetchedSpotlightEvent,
    topVotesTodayEvent,
  ]);
  const handleOpenHeroEventPopup = React.useCallback(async () => {
    const eventId = Number(spotlightEvent?.id || 0);
    if (!(eventId > 0)) return;

    const timelineId = Number(spotlightEvent?.timeline_id || 0);

    if (!(timelineId > 0)) {
      setHeroEventPopupEvent(spotlightEvent);
      return;
    }

    try {
      setHeroEventPopupLoading(true);
      const response = await api.get(`/api/timeline-v3/${timelineId}/events/${eventId}`);
      const fetchedEvent = response?.data;
      if (fetchedEvent?.id) {
        setHeroEventPopupEvent(fetchedEvent);
        return;
      }
    } catch (error) {
      console.warn('[HomePage] Failed to fetch full hero spotlight event payload:', error?.response?.data || error?.message || error);
    } finally {
      setHeroEventPopupLoading(false);
    }

    setHeroEventPopupEvent(spotlightEvent);
  }, [spotlightEvent]);

  const spotlightTimelineType = String(spotlightTimeline?.timeline_type || '').toLowerCase();
  const SpotlightTimelineIcon = spotlightTimelineType === 'community'
    ? GroupsIcon
    : (spotlightTimelineType === 'personal' ? PersonIcon : TagIcon);
  const spotlightTimelineTypeLabel = spotlightTimelineType === 'community'
    ? 'Community Timeline'
    : (spotlightTimelineType === 'personal' ? 'Personal Timeline' : 'Hashtag Timeline');
  const getTimelineAudienceMeta = React.useCallback((timeline) => {
    const type = String(timeline?.timeline_type || timeline?.type || 'hashtag').toLowerCase();
    const isCommunity = type === 'community';
    const memberCount = Number(timeline?.member_count ?? timeline?.memberCount ?? 0) || 0;
    const followerCount = Number(
      timeline?.follow_count
      ?? timeline?.followers_count
      ?? timeline?.follower_count
      ?? timeline?.followersCount
      ?? 0,
    ) || 0;
    const popularityCount = Number(timeline?.popularity_count ?? 0) || 0;
    return {
      label: isCommunity ? 'Members' : 'Followers',
      count: isCommunity
        ? (memberCount || followerCount || popularityCount)
        : (followerCount || memberCount || popularityCount),
    };
  }, []);
  const spotlightTimelineAudience = React.useMemo(
    () => getTimelineAudienceMeta(spotlightTimeline),
    [getTimelineAudienceMeta, spotlightTimeline],
  );
  const spotlightTimelineImageUrl = getTimelineHeroLandscapeImageUrl(spotlightTimeline);
  const spotlightTimelineImagePrivilegeEnabled = spotlightTimeline?.cover_upload_enabled !== false;
  const trendingCommunityAudience = React.useMemo(
    () => getTimelineAudienceMeta(trendingCommunityTimeline),
    [getTimelineAudienceMeta, trendingCommunityTimeline],
  );
  const trendingCommunityImageUrl = getTimelineHeroLandscapeImageUrl(trendingCommunityTimeline);
  const trendingCommunityImagePrivilegeEnabled = trendingCommunityTimeline?.cover_upload_enabled !== false;
  const trendingCommunityLabel = trendingCommunityTimeline
    ? `i-${stripTimelinePrefix(trendingCommunityTimeline?.name, 'community') || String(trendingCommunityTimeline?.name || '').trim()}`
    : '';
  const spotlightEventImageUrl = React.useMemo(() => {
    if (!spotlightEvent || typeof spotlightEvent !== 'object') return '';

    const parsedContent = (() => {
      const rawContent = spotlightEvent?.content;
      if (!rawContent || typeof rawContent !== 'string') return null;
      const trimmed = rawContent.trim();
      if (!trimmed.startsWith('{') || !trimmed.endsWith('}')) return null;
      try {
        const parsed = JSON.parse(trimmed);
        return parsed && typeof parsed === 'object' ? parsed : null;
      } catch (_error) {
        return null;
      }
    })();

    const metadata = spotlightEvent?.metadata && typeof spotlightEvent.metadata === 'object'
      ? spotlightEvent.metadata
      : null;

    const linkPreview = spotlightEvent?.link_preview && typeof spotlightEvent.link_preview === 'object'
      ? spotlightEvent.link_preview
      : null;

    const candidateImageValues = [
      spotlightEvent?.media_url,
      spotlightEvent?.image_url,
      spotlightEvent?.url_image,
      spotlightEvent?.thumbnail_url,
      spotlightEvent?.cover_url,
      spotlightEvent?.preview_image,
      spotlightEvent?.image,
      metadata?.url_image,
      metadata?.image,
      linkPreview?.image,
      parsedContent?.url_image,
      parsedContent?.image,
      parsedContent?.preview_image,
    ];

    for (let index = 0; index < candidateImageValues.length; index += 1) {
      const value = String(candidateImageValues[index] || '').trim();
      if (value) return value;
    }

    return '';
  }, [spotlightEvent]);
  const advertisementMediaUrl = String(activeHeroSlide?.media_url || '').trim();
  const advertisementMetadataImageUrl = React.useMemo(() => {
    if (activeHeroSlide?.type !== 'advertisement') return '';

    const parsedContent = (() => {
      const rawContent = activeHeroSlide?.content;
      if (!rawContent || typeof rawContent !== 'string') return null;
      const trimmed = rawContent.trim();
      if (!trimmed.startsWith('{') || !trimmed.endsWith('}')) return null;
      try {
        const parsed = JSON.parse(trimmed);
        return parsed && typeof parsed === 'object' ? parsed : null;
      } catch (_error) {
        return null;
      }
    })();

    const metadata = activeHeroSlide?.metadata && typeof activeHeroSlide.metadata === 'object'
      ? activeHeroSlide.metadata
      : null;

    const linkPreview = activeHeroSlide?.link_preview && typeof activeHeroSlide.link_preview === 'object'
      ? activeHeroSlide.link_preview
      : null;

    const urlPreview = activeHeroSlide?.url_preview && typeof activeHeroSlide.url_preview === 'object'
      ? activeHeroSlide.url_preview
      : null;

    const ctaMetadata = activeHeroSlide?.cta_metadata && typeof activeHeroSlide.cta_metadata === 'object'
      ? activeHeroSlide.cta_metadata
      : null;

    const candidateImageValues = [
      activeHeroSlide?.image_url,
      activeHeroSlide?.url_image,
      activeHeroSlide?.preview_image,
      activeHeroSlide?.thumbnail_url,
      activeHeroSlide?.cover_url,
      activeHeroSlide?.image,
      metadata?.url_image,
      metadata?.image,
      metadata?.preview_image,
      linkPreview?.image,
      urlPreview?.image,
      ctaMetadata?.url_image,
      ctaMetadata?.image,
      parsedContent?.url_image,
      parsedContent?.image,
      parsedContent?.preview_image,
    ];

    for (let index = 0; index < candidateImageValues.length; index += 1) {
      const value = String(candidateImageValues[index] || '').trim();
      if (value) return value;
    }

    return '';
  }, [activeHeroSlide]);
  const advertisementHeroImageUrl = advertisementMediaUrl || advertisementMetadataImageUrl;

  const heroVisualStyles = React.useMemo(() => {
    if (activeHeroSlide?.type === 'timeline_spotlight' && spotlightTimelineImageUrl) {
      return {
        backgroundImage: `url(${spotlightTimelineImageUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        fogOverlay: theme.palette.mode === 'dark'
          ? 'linear-gradient(135deg, rgba(7,14,32,0.58) 0%, rgba(21,34,54,0.54) 38%, rgba(53,22,72,0.48) 100%)'
          : 'linear-gradient(135deg, rgba(236,244,255,0.78) 0%, rgba(232,238,250,0.68) 45%, rgba(250,232,238,0.64) 100%)',
        blurOverlay: spotlightTimelineImagePrivilegeEnabled
          ? 'transparent'
          : 'rgba(6, 9, 16, 0.22)',
        applyHardBlur: !spotlightTimelineImagePrivilegeEnabled,
      };
    }

    if (activeHeroSlide?.type === 'trending_community' && trendingCommunityImageUrl) {
      return {
        backgroundImage: `url(${trendingCommunityImageUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        fogOverlay: theme.palette.mode === 'dark'
          ? 'linear-gradient(135deg, rgba(6,18,30,0.6) 0%, rgba(12,40,46,0.56) 45%, rgba(27,70,61,0.5) 100%)'
          : 'linear-gradient(135deg, rgba(234,251,244,0.8) 0%, rgba(229,247,241,0.72) 48%, rgba(232,250,246,0.68) 100%)',
        blurOverlay: trendingCommunityImagePrivilegeEnabled
          ? 'transparent'
          : 'rgba(6, 9, 16, 0.22)',
        applyHardBlur: !trendingCommunityImagePrivilegeEnabled,
      };
    }

    if (activeHeroSlide?.type === 'trending_community') {
      return {
        backgroundImage: theme.palette.mode === 'dark'
          ? 'linear-gradient(135deg, rgba(7,33,31,0.88) 0%, rgba(9,56,61,0.86) 42%, rgba(25,86,69,0.84) 100%)'
          : 'linear-gradient(135deg, rgba(228,252,242,0.95) 0%, rgba(228,247,236,0.96) 58%, rgba(236,251,243,0.98) 100%)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        fogOverlay: theme.palette.mode === 'dark'
          ? 'linear-gradient(135deg, rgba(8,22,25,0.52) 0%, rgba(11,29,28,0.48) 100%)'
          : 'linear-gradient(135deg, rgba(240,255,248,0.62) 0%, rgba(235,248,239,0.68) 100%)',
        blurOverlay: 'transparent',
        applyHardBlur: false,
      };
    }

    if (activeHeroSlide?.type === 'timeline_spotlight') {
      return {
        backgroundImage: theme.palette.mode === 'dark'
          ? 'linear-gradient(135deg, rgba(13,36,63,0.86) 0%, rgba(20,48,92,0.9) 40%, rgba(65,34,106,0.86) 100%)'
          : 'linear-gradient(135deg, rgba(250,232,242,0.94) 0%, rgba(246,232,220,0.96) 68%, rgba(252,238,224,0.98) 100%)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        fogOverlay: theme.palette.mode === 'dark'
          ? 'linear-gradient(135deg, rgba(8,14,28,0.52) 0%, rgba(16,24,43,0.48) 100%)'
          : 'linear-gradient(135deg, rgba(255,240,248,0.6) 0%, rgba(246,236,226,0.66) 55%, rgba(250,242,234,0.72) 100%)',
        blurOverlay: 'transparent',
        applyHardBlur: false,
      };
    }

    if (activeHeroSlide?.type === 'event_spotlight' && spotlightEventImageUrl) {
      return {
        backgroundImage: `url(${spotlightEventImageUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        fogOverlay: theme.palette.mode === 'dark'
          ? 'linear-gradient(140deg, rgba(12,20,38,0.62) 0%, rgba(31,36,68,0.58) 55%, rgba(78,30,94,0.52) 100%)'
          : 'linear-gradient(140deg, rgba(236,244,255,0.78) 0%, rgba(227,236,252,0.7) 55%, rgba(249,230,244,0.64) 100%)',
        blurOverlay: 'transparent',
        applyHardBlur: false,
      };
    }

    if (activeHeroSlide?.type === 'event_spotlight') {
      return {
        backgroundImage: theme.palette.mode === 'dark'
          ? 'linear-gradient(132deg, rgba(22,34,66,0.9) 0%, rgba(42,31,80,0.9) 45%, rgba(9,56,92,0.88) 100%)'
          : 'linear-gradient(132deg, rgba(255,236,240,0.94) 0%, rgba(246,232,224,0.96) 66%, rgba(252,238,224,0.98) 100%)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        fogOverlay: theme.palette.mode === 'dark'
          ? 'linear-gradient(132deg, rgba(11,17,33,0.52) 0%, rgba(15,19,37,0.5) 100%)'
          : 'linear-gradient(132deg, rgba(255,240,246,0.58) 0%, rgba(248,236,226,0.62) 58%, rgba(250,242,234,0.7) 100%)',
        blurOverlay: 'transparent',
        applyHardBlur: false,
      };
    }

    if (activeHeroSlide?.type === 'advertisement') {
      if (advertisementHeroImageUrl) {
        return {
          backgroundImage: `url(${advertisementHeroImageUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          fogOverlay: theme.palette.mode === 'dark'
            ? 'linear-gradient(120deg, rgba(23,14,8,0.52) 0%, rgba(24,10,17,0.48) 100%)'
            : 'linear-gradient(120deg, rgba(255,240,246,0.62) 0%, rgba(250,242,234,0.68) 100%)',
          blurOverlay: 'transparent',
          applyHardBlur: false,
        };
      }

      return {
        backgroundImage: theme.palette.mode === 'dark'
          ? 'linear-gradient(120deg, rgba(62,35,8,0.84) 0%, rgba(120,52,18,0.86) 38%, rgba(153,45,88,0.82) 100%)'
          : 'linear-gradient(120deg, rgba(255,232,246,0.92) 0%, rgba(246,228,214,0.96) 68%, rgba(252,236,216,0.98) 100%)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        fogOverlay: theme.palette.mode === 'dark'
          ? 'linear-gradient(120deg, rgba(23,14,8,0.44) 0%, rgba(24,10,17,0.42) 100%)'
          : 'linear-gradient(120deg, rgba(255,240,246,0.6) 0%, rgba(250,242,234,0.66) 100%)',
        blurOverlay: 'transparent',
        applyHardBlur: false,
      };
    }

    if (activeHeroSlide?.type === 'welcome') {
      return {
        backgroundImage: theme.palette.mode === 'dark'
          ? 'linear-gradient(135deg, rgba(12,26,54,0.92) 0%, rgba(20,38,78,0.88) 42%, rgba(60,28,86,0.86) 100%)'
          : 'linear-gradient(135deg, rgba(255,236,242,0.94) 0%, rgba(246,232,224,0.96) 68%, rgba(252,238,224,0.98) 100%)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        fogOverlay: theme.palette.mode === 'dark'
          ? 'linear-gradient(135deg, rgba(10,16,30,0.48) 0%, rgba(16,22,40,0.44) 100%)'
          : 'linear-gradient(135deg, rgba(255,240,246,0.62) 0%, rgba(248,236,226,0.66) 55%, rgba(250,242,234,0.72) 100%)',
        blurOverlay: 'transparent',
        applyHardBlur: false,
      };
    }

    return {
      backgroundImage: theme.palette.mode === 'dark'
        ? 'linear-gradient(135deg, rgba(20,30,60,0.82) 0%, rgba(12,18,35,0.86) 65%, rgba(42,22,64,0.84) 100%)'
        : 'linear-gradient(135deg, rgba(255,236,240,0.92) 0%, rgba(248,234,230,0.94) 64%, rgba(252,238,224,0.96) 100%)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      fogOverlay: 'transparent',
      blurOverlay: 'transparent',
      applyHardBlur: false,
    };
  }, [
    activeHeroSlide?.type,
    spotlightTimelineImageUrl,
    spotlightTimelineImagePrivilegeEnabled,
    trendingCommunityImageUrl,
    trendingCommunityImagePrivilegeEnabled,
    spotlightEventImageUrl,
    advertisementHeroImageUrl,
    theme.palette.mode,
  ]);

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

  const visiblePopularTimelines = React.useMemo(() => {
    return popularTimelines.slice(0, visiblePopularTimelineCount);
  }, [popularTimelines, visiblePopularTimelineCount]);

  const visiblePopularPosts = React.useMemo(() => {
    return popularEvents.slice(0, visiblePopularPostCount);
  }, [popularEvents, visiblePopularPostCount]);

  const visibleUsers = React.useMemo(() => {
    return filteredUsers.slice(0, visibleTimelineCount);
  }, [filteredUsers, visibleTimelineCount]);

  const visibleOwnedTimelines = React.useMemo(() => {
    return ownedTimelines.slice(0, visibleMyCreationsTimelineCount);
  }, [ownedTimelines, visibleMyCreationsTimelineCount]);

  const visibleMyCreationPosts = React.useMemo(() => {
    return myCreationEvents.slice(0, visibleMyCreationsPostCount);
  }, [myCreationEvents, visibleMyCreationsPostCount]);

  const visibleYourPageTimelines = React.useMemo(() => {
    return yourPageTimelines.slice(0, visibleYourPageTimelineCount);
  }, [yourPageTimelines, visibleYourPageTimelineCount]);

  const isPostAllowedOnTimeline = React.useCallback((timeline) => {
    const explicitPostAllowed = timeline?.post_allowed;
    if (typeof explicitPostAllowed === 'boolean') return explicitPostAllowed;

    const explicitCanPost = timeline?.can_post;
    if (typeof explicitCanPost === 'boolean') return explicitCanPost;

    const explicitCanAddEvents = timeline?.can_add_events;
    if (typeof explicitCanAddEvents === 'boolean') return explicitCanAddEvents;

    const timelineType = String(timeline?.timeline_type || 'hashtag').toLowerCase();
    if (timelineType === 'hashtag') return true;

    if (timelineType === 'personal') {
      const ownerId = Number(
        timeline?.created_by
        || timeline?.creator_id
        || timeline?.owner_id
        || timeline?.user_id
        || 0,
      );
      return ownerId > 0 && ownerId === currentUserId;
    }

    const role = String(timeline?.role || '').toLowerCase();
    if (role === 'pending' || role === 'blocked' || role === 'banned') return false;

    return timeline?.is_active_member !== false;
  }, [currentUserId]);

  const advancedPostTimelineOptions = React.useMemo(() => {
    const query = postTimelineSearchInput.trim().toLowerCase();
    const getTimelineTypeLabel = (timelineType) => {
      const type = String(timelineType || '').toLowerCase();
      if (type === 'community') return 'Community';
      if (type === 'personal') return 'Personal';
      return 'Hashtag';
    };

    return (Array.isArray(yourPageTimelines) ? yourPageTimelines : [])
      .filter((timeline) => isPostAllowedOnTimeline(timeline))
      .map((timeline) => {
        const id = Number(timeline?.id || timeline?.timeline_id || 0);
        const timelineType = String(timeline?.timeline_type || 'hashtag').toLowerCase();
        if (!(id > 0)) return null;

        const baseName = stripTimelinePrefix(timeline?.name, timelineType);
        const prefix = getTimelinePrefixByType(timelineType);
        const searchable = `${prefix}${baseName} ${timeline?.name || ''}`.toLowerCase();

        return {
          id,
          baseName: baseName || String(timeline?.name || `Timeline ${id}`),
          prefix,
          timeline_type: timelineType,
          timeline_type_label: getTimelineTypeLabel(timelineType),
          visibility: timeline?.visibility || 'public',
          searchable,
        };
      })
      .filter((timeline) => Boolean(timeline))
      .filter((timeline) => (query ? timeline.searchable.includes(query) : true))
      .sort((a, b) => a.baseName.localeCompare(b.baseName));
  }, [isPostAllowedOnTimeline, postTimelineSearchInput, yourPageTimelines]);

  const visibleYourPagePosts = React.useMemo(() => {
    return yourPageEvents.slice(0, visibleYourPagePostCount);
  }, [yourPageEvents, visibleYourPagePostCount]);

  const visibleFavoritePosts = React.useMemo(() => {
    return favoriteTimelineEvents.slice(0, visibleFavoritePostCount);
  }, [favoriteTimelineEvents, visibleFavoritePostCount]);

  const searchVisibleMaxCount = React.useMemo(() => {
    return Math.max(
      isTimelineSearchScope ? filteredTimelines.length : 0,
      isPostSearchScope ? filteredPosts.length : 0,
      isUserSearchScope ? filteredUsers.length : 0,
    );
  }, [isTimelineSearchScope, isPostSearchScope, isUserSearchScope, filteredTimelines.length, filteredPosts.length, filteredUsers.length]);

  const activeHubCanLoadMore = React.useMemo(() => {
    if (activeHubTab === 'timeline-search') {
      if (!hasSearchQuery || loadingTimelines || loadingSearchEvents || loadingSearchUsers) return false;
      return visibleTimelineCount < searchVisibleMaxCount;
    }

    if (activeHubTab === 'popular') {
      return popularFilter === 'timelines'
        ? visiblePopularTimelines.length < popularTimelines.length
        : visiblePopularPosts.length < popularEvents.length;
    }

    if (activeHubTab === 'my-creations') {
      return myCreationsFilter === 'timelines'
        ? visibleOwnedTimelines.length < ownedTimelines.length
        : visibleMyCreationPosts.length < myCreationEvents.length;
    }

    if (activeHubTab === 'your-page') {
      return yourPageFilter === 'timelines'
        ? visibleYourPageTimelines.length < yourPageTimelines.length
        : visibleYourPagePosts.length < yourPageEvents.length;
    }

    if (activeHubTab === 'favorite') {
      if (loadingFavoriteTimelineEvents) return false;
      return visibleFavoritePosts.length < favoriteTimelineEvents.length;
    }

    return false;
  }, [
    activeHubTab,
    hasSearchQuery,
    loadingTimelines,
    loadingSearchEvents,
    loadingSearchUsers,
    visibleTimelineCount,
    searchVisibleMaxCount,
    popularFilter,
    visiblePopularTimelines.length,
    popularTimelines.length,
    visiblePopularPosts.length,
    popularEvents.length,
    myCreationsFilter,
    visibleOwnedTimelines.length,
    ownedTimelines.length,
    visibleMyCreationPosts.length,
    myCreationEvents.length,
    yourPageFilter,
    visibleYourPageTimelines.length,
    yourPageTimelines.length,
    visibleYourPagePosts.length,
    yourPageEvents.length,
    loadingFavoriteTimelineEvents,
    visibleFavoritePosts.length,
    favoriteTimelineEvents.length,
  ]);

  const allKnownTimelines = React.useMemo(() => {
    const merged = [
      ...(Array.isArray(ownedTimelines) ? ownedTimelines : []),
      ...(Array.isArray(yourPageTimelines) ? yourPageTimelines : []),
      ...(Array.isArray(popularTimelines) ? popularTimelines : []),
      ...(Array.isArray(timelines) ? timelines : []),
    ];

    const deduped = [];
    const seen = new Set();
    merged.forEach((timeline) => {
      const id = Number(timeline?.id || 0);
      if (!(id > 0) || seen.has(id)) return;
      seen.add(id);
      deduped.push(timeline);
    });
    return deduped;
  }, [ownedTimelines, yourPageTimelines, popularTimelines, timelines]);

  const selectedFavoriteTimeline = React.useMemo(() => {
    const id = Number(favoriteTimelineId || 0);
    if (!(id > 0)) return null;

    const known = allKnownTimelines.find((timeline) => Number(timeline?.id || 0) === id);
    if (known) return known;

    if (Number(favoriteTimelineDetails?.id || 0) === id) {
      return favoriteTimelineDetails;
    }

    return null;
  }, [favoriteTimelineId, allKnownTimelines, favoriteTimelineDetails]);

  React.useEffect(() => {
    const numericFavoriteId = Number(favoriteTimelineId || 0);
    if (!(numericFavoriteId > 0)) {
      setFavoriteTimelineDetails(null);
      return;
    }

    const knownFavoriteTimeline = allKnownTimelines.find((timeline) => Number(timeline?.id || 0) === numericFavoriteId) || null;
    const knownFavoriteDescription = String(knownFavoriteTimeline?.description || '').trim();
    const shouldFetchDetails = !knownFavoriteTimeline || !knownFavoriteDescription;

    if (!shouldFetchDetails) {
      setFavoriteTimelineDetails(null);
      return;
    }

    let isCancelled = false;
    const loadFavoriteTimelineDetails = async () => {
      try {
        setLoadingFavoriteTimelineDetails(true);
        const details = await getTimelineDetails(numericFavoriteId);
        if (isCancelled) return;
        setFavoriteTimelineDetails(details || null);
      } catch (error) {
        if (!isCancelled) {
          console.warn('[HomePage] Failed to fetch favorite timeline details:', error?.response?.data || error?.message || error);
          setFavoriteTimelineDetails(null);
        }
      } finally {
        if (!isCancelled) {
          setLoadingFavoriteTimelineDetails(false);
        }
      }
    };

    loadFavoriteTimelineDetails();
    return () => {
      isCancelled = true;
    };
  }, [favoriteTimelineId, allKnownTimelines]);

  React.useEffect(() => {
    const numericFavoriteId = Number(favoriteTimelineId || 0);
    if (!(numericFavoriteId > 0) || activeHubTab !== 'favorite') {
      setFavoriteTimelineEvents([]);
      setLoadingFavoriteTimelineEvents(false);
      return;
    }

    let isCancelled = false;
    const loadFavoriteTimelineEvents = async () => {
      try {
        setLoadingFavoriteTimelineEvents(true);
        const response = await api.get(`/api/timeline-v3/${numericFavoriteId}/events`, {
          params: { limit: HOME_FAVORITE_EVENTS_FETCH_LIMIT },
        });
        if (isCancelled) return;

        const payload = response?.data;
        const events = Array.isArray(payload?.events)
          ? payload.events
          : (Array.isArray(payload) ? payload : []);

        const timelineName = selectedFavoriteTimeline?.name || payload?.timeline_name || '';
        const timelineType = selectedFavoriteTimeline?.timeline_type || payload?.timeline_type || 'hashtag';
        const timelineCreator = selectedFavoriteTimeline?.created_by
          || selectedFavoriteTimeline?.creator_id
          || selectedFavoriteTimeline?.owner_id
          || selectedFavoriteTimeline?.user_id
          || null;

        setFavoriteTimelineEvents(
          events
            .map((event) => ({
              ...event,
              timeline_id: Number(event?.timeline_id || numericFavoriteId),
              timeline_name: event?.timeline_name || timelineName,
              timeline_type: event?.timeline_type || timelineType,
              timeline_created_by: event?.timeline_created_by || timelineCreator,
            }))
            .sort((a, b) => new Date(b?.created_at || 0) - new Date(a?.created_at || 0)),
        );
      } catch (error) {
        if (!isCancelled) {
          console.warn('[HomePage] Failed to fetch favorite timeline events:', error?.response?.data || error?.message || error);
          setFavoriteTimelineEvents([]);
        }
      } finally {
        if (!isCancelled) {
          setLoadingFavoriteTimelineEvents(false);
        }
      }
    };

    loadFavoriteTimelineEvents();
    return () => {
      isCancelled = true;
    };
  }, [favoriteTimelineId, activeHubTab, selectedFavoriteTimeline]);

  React.useEffect(() => {
    const numericFavoriteId = Number(favoriteTimelineId || 0);
    if (!(numericFavoriteId > 0) || activeHubTab !== 'favorite') {
      setFavoriteTimelineQuote(DEFAULT_FAVORITE_QUOTE);
      setFavoriteTimelineActions([]);
      setFavoriteTimelineStatusMessage({ active: false, status_type: null, title: '', body: '' });
      setFavoriteTimelineWarningState({ active: false, warning_scope: null, title: '', body: '' });
      setLoadingFavoriteTimelineContext(false);
      return;
    }

    let isCancelled = false;
    const loadFavoriteTimelineContext = async () => {
      try {
        setLoadingFavoriteTimelineContext(true);

        const [quoteResponse, actionsResponse, statusResponse, warningResponse] = await Promise.all([
          getTimelineQuote(numericFavoriteId),
          getTimelineActions(numericFavoriteId),
          getTimelineStatusMessage(numericFavoriteId),
          getTimelineWarningState(numericFavoriteId),
        ]);

        if (isCancelled) return;

        const quoteText = String(quoteResponse?.quote?.text || '').trim();
        const quoteAuthor = String(quoteResponse?.quote?.author || '').trim();
        const isCustomQuote = Boolean(quoteResponse?.quote?.is_custom);
        const favoriteType = String(
          selectedFavoriteTimeline?.timeline_type
          || favoriteTimelineDetails?.timeline_type
          || '',
        ).toLowerCase();
        const fallbackDescription = String(
          selectedFavoriteTimeline?.description
          || favoriteTimelineDetails?.description
          || '',
        ).trim();

        if (!isCustomQuote && favoriteType !== 'community' && fallbackDescription) {
          setFavoriteTimelineQuote({
            text: fallbackDescription,
            author: 'Timeline Description',
          });
        } else {
          setFavoriteTimelineQuote({
            text: quoteText || DEFAULT_FAVORITE_QUOTE.text,
            author: quoteAuthor || DEFAULT_FAVORITE_QUOTE.author,
          });
        }

        const nextActions = Array.isArray(actionsResponse?.actions)
          ? actionsResponse.actions
              .filter((action) => action && action.action_type)
              .filter((action) => hasMeaningfulActionCardContent(action))
              .sort((a, b) => {
                const order = { gold: 0, silver: 1, bronze: 2 };
                return (order[a.action_type] ?? 99) - (order[b.action_type] ?? 99);
              })
          : [];
        setFavoriteTimelineActions(nextActions);

        setFavoriteTimelineStatusMessage({
          active: !!statusResponse?.active,
          status_type: String(statusResponse?.status_type || statusResponse?.message_type || '').toLowerCase() || null,
          title: String(statusResponse?.status_header || statusResponse?.title || '').trim(),
          body: String(statusResponse?.status_body || statusResponse?.body || statusResponse?.message || '').trim(),
        });

        setFavoriteTimelineWarningState({
          active: !!warningResponse?.active,
          warning_scope: warningResponse?.warning_scope || null,
          title: String(warningResponse?.title || '').trim(),
          body: String(warningResponse?.body || warningResponse?.message || '').trim(),
        });
      } catch (error) {
        if (!isCancelled) {
          console.warn('[HomePage] Failed to load favorite timeline context:', error?.response?.data || error?.message || error);
          setFavoriteTimelineQuote(DEFAULT_FAVORITE_QUOTE);
          setFavoriteTimelineActions([]);
          setFavoriteTimelineStatusMessage({ active: false, status_type: null, title: '', body: '' });
          setFavoriteTimelineWarningState({ active: false, warning_scope: null, title: '', body: '' });
        }
      } finally {
        if (!isCancelled) {
          setLoadingFavoriteTimelineContext(false);
        }
      }
    };

    loadFavoriteTimelineContext();
    return () => {
      isCancelled = true;
    };
  }, [favoriteTimelineId, activeHubTab, selectedFavoriteTimeline?.id, selectedFavoriteTimeline?.created_by, selectedFavoriteTimeline?.user_id]);

  React.useEffect(() => {
    setVisibleFavoritePostCount(HOME_LIST_BATCH_SIZE);
    if (favoriteScrollRef.current) {
      favoriteScrollRef.current.scrollTop = 0;
    }
  }, [favoriteTimelineId]);

  const handleFavoriteActionVote = React.useCallback(async (actionType) => {
    const timelineId = Number(favoriteTimelineId || 0);
    if (!(timelineId > 0)) return;

    const normalizedType = String(actionType || '').toLowerCase();
    if (!['bronze', 'silver', 'gold'].includes(normalizedType)) return;

    try {
      setFavoriteVoteLoadingByType((prev) => ({ ...prev, [normalizedType]: true }));
      const result = await voteTimelineAction(timelineId, normalizedType);
      if (!result?.success || !result?.progress) {
        throw new Error(result?.error || 'Vote could not be recorded');
      }

      setFavoriteTimelineActions((prev) => prev.map((action) => {
        if (String(action?.action_type || '').toLowerCase() !== normalizedType) return action;
        return {
          ...action,
          progress: result.progress,
        };
      }));

      setUserFollowSnackbarMessage('Vote counted!');
      setUserFollowSnackbarSeverity('success');
      setUserFollowSnackbarOpen(true);
    } catch (error) {
      setUserFollowSnackbarMessage(error?.response?.data?.error || error?.message || 'Failed to submit vote');
      setUserFollowSnackbarSeverity('error');
      setUserFollowSnackbarOpen(true);
    } finally {
      setFavoriteVoteLoadingByType((prev) => ({ ...prev, [normalizedType]: false }));
    }
  }, [favoriteTimelineId]);

  const fetchSearchEvents = React.useCallback(async () => {
    if (loadingSearchEvents || hasLoadedSearchEvents || !searchableTimelines.length) return;

    try {
      setLoadingSearchEvents(true);

      const targetTimelines = searchableTimelines.slice(0, HOME_SEARCH_TIMELINE_SOURCE_LIMIT);

      const requests = targetTimelines.map((timeline) =>
        api.get(`/api/timeline-v3/${timeline.id}/events`, {
          params: { limit: HOME_PER_TIMELINE_EVENTS_FETCH_LIMIT },
        }),
      );
      const results = await Promise.allSettled(requests);

      const merged = [];
      for (let i = 0; i < results.length; i += 1) {
        const result = results[i];
        const timeline = targetTimelines[i];

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

      setSearchEvents(dedupedById.slice(0, HOME_SEARCH_EVENTS_RESULT_LIMIT));
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

      setSearchUsers(users.slice(0, HOME_SEARCH_USERS_RESULT_LIMIT));
    } catch (error) {
      if (error?.response?.status !== 404) {
        console.error('Error fetching search users:', error);
      }
      setSearchUsers([]);
    } finally {
      setLoadingSearchUsers(false);
    }
  }, []);

  const fetchFollowedUsers = React.useCallback(async () => {
    if (!user || isGuest) {
      setFollowedUsers([]);
      return;
    }

    try {
      setLoadingFollowedUsers(true);
      const users = await getFollowedUsers();
      setFollowedUsers(Array.isArray(users) ? users.slice(0, HOME_FOLLOWED_USERS_SOURCE_LIMIT) : []);
    } catch (error) {
      console.error('Error fetching followed users:', error);
      setFollowedUsers([]);
    } finally {
      setLoadingFollowedUsers(false);
    }
  }, [user]);

  const fetchFollowerUsers = React.useCallback(async () => {
    if (!user || isGuest) {
      setFollowerUsers([]);
      return;
    }

    try {
      setLoadingFollowerUsers(true);
      const users = await getFollowerUsers();
      setFollowerUsers(Array.isArray(users) ? users.slice(0, HOME_FOLLOWED_USERS_SOURCE_LIMIT) : []);
    } catch (error) {
      console.error('Error fetching follower users:', error);
      setFollowerUsers([]);
    } finally {
      setLoadingFollowerUsers(false);
    }
  }, [user]);

  React.useEffect(() => {
    fetchFollowedUsers();
  }, [fetchFollowedUsers]);

  React.useEffect(() => {
    fetchFollowerUsers();
  }, [fetchFollowerUsers]);

  React.useEffect(() => {
    if (!user?.id) {
      clearPopularCache();
      setHasLoadedPopular(false);
      setPopularTimelines([]);
      setPopularEvents([]);
      setVisiblePopularTimelineCount(POPULAR_LIST_BATCH_SIZE);
      setVisiblePopularPostCount(POPULAR_LIST_BATCH_SIZE);
      setHasBootstrappedPopularCache(true);
      return;
    }

    setVisiblePopularTimelineCount(POPULAR_LIST_BATCH_SIZE);
    setVisiblePopularPostCount(POPULAR_LIST_BATCH_SIZE);

    try {
      const raw = window.sessionStorage.getItem(getPopularCacheKey(user.id));
      if (!raw) {
        setHasLoadedPopular(false);
        setPopularTimelines([]);
        setPopularEvents([]);
        setHasBootstrappedPopularCache(true);
        return;
      }

      const parsed = JSON.parse(raw);
      const sourceTimelineCount = Number(parsed?.source_timeline_count || 0);
      if (sourceTimelineCount <= 0) {
        setHasLoadedPopular(false);
        setPopularTimelines([]);
        setPopularEvents([]);
        setHasBootstrappedPopularCache(true);
        return;
      }
      const cachedTimelines = Array.isArray(parsed?.timelines) ? parsed.timelines : [];
      const cachedEvents = Array.isArray(parsed?.events) ? parsed.events : [];

      setPopularTimelines(cachedTimelines);
      setPopularEvents(cachedEvents);
      setHasLoadedPopular(true);
      setHasBootstrappedPopularCache(true);
    } catch (error) {
      console.error('Error reading Popular cache:', error);
      setHasLoadedPopular(false);
      setPopularTimelines([]);
      setPopularEvents([]);
      setHasBootstrappedPopularCache(true);
    }
  }, [user?.id, getPopularCacheKey, clearPopularCache]);

  const fetchPopularData = React.useCallback(async () => {
    if (!normalizedTimelines.length) {
      setHasLoadedPopular(false);
      return;
    }

    try {
      setLoadingPopular(true);

      const baseTimelineMap = new Map();
      normalizedTimelines.forEach((timeline) => {
        const id = Number(timeline?.id || 0);
        if (id > 0) baseTimelineMap.set(id, timeline);
      });

      const candidateIds = normalizedTimelines
        .filter((timeline) => String(timeline?.timeline_type || '').toLowerCase() !== 'personal')
        .map((timeline) => Number(timeline?.id || 0))
        .filter((id) => id > 0);

      const uniqueCandidateIds = Array.from(new Set(candidateIds)).slice(0, HOME_POPULAR_TIMELINE_SOURCE_LIMIT);
      if (!uniqueCandidateIds.length) {
        setPopularTimelines([]);
        setPopularEvents([]);
        setHasLoadedPopular(true);
        return;
      }

      const rankedTimelines = [];

      uniqueCandidateIds.forEach((timelineId) => {
        const base = baseTimelineMap.get(timelineId) || null;
        const timelineType = String(base?.timeline_type || '').toLowerCase();
        const visibility = String(base?.visibility || 'public').toLowerCase();

        if (timelineType === 'personal') return;
        if (visibility === 'private') return;

        const memberCount = Number(base?.member_count || 0) || 0;

        const followCount = Number(
          base?.follow_count
          || base?.followers_count
          || 0,
        ) || 0;

        rankedTimelines.push({
          ...(base || {}),
          id: timelineId,
          timeline_type: timelineType || 'hashtag',
          visibility,
          member_count: memberCount,
          follow_count: followCount,
          popularity_count: Math.max(memberCount, followCount),
        });
      });

      rankedTimelines.sort((a, b) => {
        if ((b.popularity_count || 0) !== (a.popularity_count || 0)) {
          return (b.popularity_count || 0) - (a.popularity_count || 0);
        }
        return new Date(b?.created_at || 0) - new Date(a?.created_at || 0);
      });

      setPopularTimelines(rankedTimelines);
      const rankedTimelineMap = new Map(
        rankedTimelines.map((timeline) => [Number(timeline?.id || 0), timeline]),
      );

      const publicTimelineIds = rankedTimelines.map((timeline) => Number(timeline?.id || 0)).filter((id) => id > 0);
      const timelineEventsResults = await Promise.allSettled(
        publicTimelineIds.map((timelineId) => api.get(`/api/timeline-v3/${timelineId}/events`, {
          params: { limit: HOME_PER_TIMELINE_EVENTS_FETCH_LIMIT },
        })),
      );

      const eventById = new Map();

      timelineEventsResults.forEach((result, index) => {
        if (result.status !== 'fulfilled') return;

        const timelineId = publicTimelineIds[index];
        const timelineMeta = rankedTimelineMap.get(timelineId) || null;
        const payload = result.value?.data;
        const events = Array.isArray(payload?.events)
          ? payload.events
          : (Array.isArray(payload) ? payload : []);

        events.forEach((event) => {
          const eventId = Number(event?.id || 0);
          if (!(eventId > 0)) return;

          const timelineType = String(event?.timeline_type || timelineMeta?.timeline_type || '').toLowerCase();
          const timelineVisibility = String(event?.timeline_visibility || event?.visibility || timelineMeta?.visibility || 'public').toLowerCase();

          if (timelineType === 'personal') return;
          if (timelineVisibility === 'private') return;

          if (!eventById.has(eventId)) {
            eventById.set(eventId, {
              ...event,
              timeline_id: event?.timeline_id || timelineId,
              timeline_name: event?.timeline_name || timelineMeta?.name || '',
              timeline_type: timelineType || 'hashtag',
              timeline_visibility: timelineVisibility,
            });
          }
        });
      });

      const events = Array.from(eventById.values())
        .sort((a, b) => new Date(b?.created_at || 0) - new Date(a?.created_at || 0))
        .slice(0, HOME_POPULAR_EVENTS_RANKING_LIMIT);
      const rankingWithKnownVotes = [];
      const eventsNeedingVoteFetch = [];

      events.forEach((event) => {
        const promoteRaw = event?.promote_count ?? event?.promoteCount ?? event?.promote ?? null;
        const demoteRaw = event?.demote_count ?? event?.demoteCount ?? event?.demote ?? null;

        const hasInlineVoteStats = promoteRaw !== null || demoteRaw !== null;

        if (hasInlineVoteStats) {
          const promote = Number(promoteRaw || 0) || 0;
          const demote = Number(demoteRaw || 0) || 0;
          rankingWithKnownVotes.push({
            ...event,
            popularity_votes: promote + demote,
          });
          return;
        }

        eventsNeedingVoteFetch.push(event);
      });

      const voteResults = await Promise.allSettled(
        eventsNeedingVoteFetch.map((event) => api.get(`/api/v1/events/${event.id}/votes`)),
      );

      const fetchedVoteRanked = eventsNeedingVoteFetch.map((event, index) => {
        const votePayload = voteResults[index]?.status === 'fulfilled'
          ? voteResults[index].value?.data
          : null;
        const promote = Number(votePayload?.promote_count || votePayload?.promoteCount || 0) || 0;
        const demote = Number(votePayload?.demote_count || votePayload?.demoteCount || 0) || 0;
        return {
          ...event,
          popularity_votes: promote + demote,
        };
      });

      const rankedEvents = [...rankingWithKnownVotes, ...fetchedVoteRanked];

      rankedEvents.sort((a, b) => {
        if ((b.popularity_votes || 0) !== (a.popularity_votes || 0)) {
          return (b.popularity_votes || 0) - (a.popularity_votes || 0);
        }
        return new Date(b?.created_at || 0) - new Date(a?.created_at || 0);
      });

      setPopularEvents(rankedEvents);
      setHasLoadedPopular(true);
    } catch (error) {
      console.error('Error loading Popular data:', error);
      setPopularTimelines([]);
      setPopularEvents([]);
      setHasLoadedPopular(true);
    } finally {
      setLoadingPopular(false);
    }
  }, [normalizedTimelines]);

  React.useEffect(() => {
    if (!hasBootstrappedPopularCache) return;
    if (activeHubTab !== 'popular') return;
    if (isHubPhaseOneLoading) return;
    if (hasLoadedPopular || loadingPopular) return;

    fetchPopularData();
  }, [activeHubTab, isHubPhaseOneLoading, hasLoadedPopular, loadingPopular, fetchPopularData, hasBootstrappedPopularCache]);

  React.useEffect(() => {
    if (!user?.id) return;
    if (!hasLoadedPopular) return;
    if (!normalizedTimelines.length) return;

    try {
      window.sessionStorage.setItem(getPopularCacheKey(user.id), JSON.stringify({
        timelines: popularTimelines,
        events: popularEvents,
        source_timeline_count: normalizedTimelines.length,
        cached_at: Date.now(),
      }));
    } catch (error) {
      console.error('Error writing Popular cache:', error);
    }
  }, [user?.id, hasLoadedPopular, popularTimelines, popularEvents, normalizedTimelines.length, getPopularCacheKey]);

  const handleRefreshPopular = React.useCallback(() => {
    if (!user?.id || loadingPopular) return;
    clearPopularCache(user.id);
    setHasLoadedPopular(false);
    setPopularTimelines([]);
    setPopularEvents([]);
    setVisiblePopularTimelineCount(POPULAR_LIST_BATCH_SIZE);
    setVisiblePopularPostCount(POPULAR_LIST_BATCH_SIZE);
    fetchPopularData();
  }, [user?.id, loadingPopular, clearPopularCache, fetchPopularData]);

  React.useEffect(() => {
    if (!user?.id) {
      clearYourPageCache();
      setHasLoadedYourPage(false);
      setYourPageTimelines([]);
      setYourPageEvents([]);
      setVisibleYourPageTimelineCount(HOME_LIST_BATCH_SIZE);
      setVisibleYourPagePostCount(HOME_LIST_BATCH_SIZE);
      setHasBootstrappedYourPageCache(true);
      return;
    }

    setVisibleYourPageTimelineCount(HOME_LIST_BATCH_SIZE);
    setVisibleYourPagePostCount(HOME_LIST_BATCH_SIZE);

    try {
      const raw = window.sessionStorage.getItem(getYourPageCacheKey(user.id));
      if (!raw) {
        setHasLoadedYourPage(false);
        setYourPageTimelines([]);
        setYourPageEvents([]);
        setHasBootstrappedYourPageCache(true);
        return;
      }

      const parsed = JSON.parse(raw);
      const sourceTimelineCount = Number(parsed?.source_timeline_count || 0);
      if (sourceTimelineCount <= 0) {
        setHasLoadedYourPage(false);
        setYourPageTimelines([]);
        setYourPageEvents([]);
        setHasBootstrappedYourPageCache(true);
        return;
      }

      setYourPageTimelines(Array.isArray(parsed?.timelines) ? parsed.timelines : []);
      setYourPageEvents(Array.isArray(parsed?.events) ? parsed.events : []);
      setHasLoadedYourPage(true);
      setHasBootstrappedYourPageCache(true);
    } catch (error) {
      console.error('Error reading Your Page cache:', error);
      setHasLoadedYourPage(false);
      setYourPageTimelines([]);
      setYourPageEvents([]);
      setHasBootstrappedYourPageCache(true);
    }
  }, [user?.id, getYourPageCacheKey, clearYourPageCache]);

  const fetchYourPageData = React.useCallback(async () => {
    if (!user) {
      setYourPageTimelines([]);
      setYourPageEvents([]);
      setHasLoadedYourPage(true);
      return;
    }

    if (!normalizedTimelines.length) {
      setHasLoadedYourPage(false);
      return;
    }

    try {
      setLoadingYourPage(true);

      const [syncedMembershipsResult, followedHashtagsResult] = await Promise.allSettled([
        syncUserPassport(),
        getFollowedHashtagTimelines(),
      ]);

      const syncedMemberships = syncedMembershipsResult.status === 'fulfilled' && Array.isArray(syncedMembershipsResult.value)
        ? syncedMembershipsResult.value
        : [];
      let memberships = syncedMemberships;
      if (!memberships.length) {
        try {
          const fetchedMemberships = await fetchUserMemberships();
          memberships = Array.isArray(fetchedMemberships) ? fetchedMemberships : [];
        } catch (membershipError) {
          console.warn('[HomePage] Membership fallback fetch failed:', membershipError);
          memberships = [];
        }
      }

      const followedHashtags = followedHashtagsResult.status === 'fulfilled' && Array.isArray(followedHashtagsResult.value)
        ? followedHashtagsResult.value
        : [];

      const timelineById = new Map();
      normalizedTimelines.forEach((timeline) => {
        const id = Number(timeline?.id || 0);
        if (id > 0) timelineById.set(id, timeline);
      });

      const activeMemberships = memberships.filter((membership) => {
        const timelineId = Number(membership?.timeline_id || 0);
        return timelineId > 0 && membership?.is_active_member !== false;
      });

      const yourTimelineMap = new Map();

      activeMemberships.forEach((membership) => {
        const timelineId = Number(membership?.timeline_id || 0);
        if (!(timelineId > 0)) return;

        const type = String(membership?.timeline_type || '').toLowerCase();
        if (type !== 'community' && type !== 'personal') return;

        const known = timelineById.get(timelineId);
        yourTimelineMap.set(timelineId, {
          ...(known || {}),
          ...(membership || {}),
          id: timelineId,
          name: known?.name || membership?.timeline_name || `Timeline ${timelineId}`,
          description: known?.description || membership?.description || '',
          timeline_type: known?.timeline_type || type,
          visibility: known?.visibility || membership?.visibility || 'public',
          created_by: known?.created_by || null,
          created_at: known?.created_at || membership?.joined_at || null,
        });
      });

      followedHashtags.forEach((timeline) => {
        const timelineId = Number(timeline?.id || timeline?.timeline_id || 0);
        if (!(timelineId > 0)) return;

        const known = timelineById.get(timelineId);

        yourTimelineMap.set(timelineId, {
          ...(known || {}),
          ...(timeline || {}),
          id: timelineId,
          name: known?.name || timeline?.name || `Timeline ${timelineId}`,
          description: known?.description || timeline?.description || '',
          timeline_type: 'hashtag',
          visibility: known?.visibility || timeline?.visibility || 'public',
          created_by: known?.created_by || timeline?.created_by || null,
          created_at: known?.created_at || timeline?.created_at || timeline?.followed_at || null,
        });
      });

      const mergedTimelines = Array.from(yourTimelineMap.values()).sort((a, b) => {
        return new Date(b?.created_at || 0) - new Date(a?.created_at || 0);
      });

      setYourPageTimelines(mergedTimelines);

      const membershipTimelineIds = activeMemberships
        .filter((membership) => {
          const type = String(membership?.timeline_type || '').toLowerCase();
          return type === 'community' || type === 'personal';
        })
        .map((membership) => Number(membership?.timeline_id || 0))
        .filter((id) => id > 0);

      const followedHashtagTimelineIds = followedHashtags
        .map((timeline) => Number(timeline?.id || timeline?.timeline_id || 0))
        .filter((id) => id > 0);

      const targetTimelineIds = Array.from(new Set([...membershipTimelineIds, ...followedHashtagTimelineIds]))
        .slice(0, HOME_YOUR_PAGE_TIMELINE_SOURCE_LIMIT);

      const followedUserIds = followedUsers
        .map((profileUser) => Number(profileUser?.id || 0))
        .filter((id) => id > 0 && id !== currentUserId)
        .slice(0, HOME_FOLLOWED_USERS_SOURCE_LIMIT);

      const [timelineEventResults, followedUserEventResults] = await Promise.all([
        Promise.allSettled(
          targetTimelineIds.map((timelineId) => api.get(`/api/timeline-v3/${timelineId}/events`, {
            params: { limit: HOME_PER_TIMELINE_EVENTS_FETCH_LIMIT },
          })),
        ),
        Promise.allSettled(
          followedUserIds.map((followedId) => api.get(`/api/users/${followedId}/events`, {
            params: { limit: HOME_PER_TIMELINE_EVENTS_FETCH_LIMIT },
          })),
        ),
      ]);

      const timelineEvents = [];
      timelineEventResults.forEach((result, index) => {
        if (result.status !== 'fulfilled') return;

        const timelineId = targetTimelineIds[index];
        const timelineMeta = yourTimelineMap.get(timelineId) || timelineById.get(timelineId) || null;
        const payload = result.value?.data;
        const events = Array.isArray(payload?.events)
          ? payload.events
          : (Array.isArray(payload) ? payload : []);

        events.forEach((event) => {
          timelineEvents.push({
            ...event,
            timeline_id: event?.timeline_id || timelineId,
            timeline_name: event?.timeline_name || timelineMeta?.name || '',
            timeline_type: event?.timeline_type || timelineMeta?.timeline_type || 'hashtag',
          });
        });
      });

      const followedUserEvents = [];
      followedUserEventResults.forEach((result) => {
        if (result.status !== 'fulfilled') return;

        const payload = result.value?.data;
        const events = Array.isArray(payload?.events)
          ? payload.events
          : (Array.isArray(payload) ? payload : []);

        events.forEach((event) => {
          const timelineId = Number(event?.timeline_id || 0);
          const knownTimeline = timelineById.get(timelineId) || yourTimelineMap.get(timelineId) || null;
          const timelineType = String(event?.timeline_type || knownTimeline?.timeline_type || '').toLowerCase();
          if (timelineType === 'personal') return;

          followedUserEvents.push({
            ...event,
            timeline_id: event?.timeline_id || knownTimeline?.id || null,
            timeline_name: event?.timeline_name || knownTimeline?.name || '',
            timeline_type: timelineType || 'hashtag',
          });
        });
      });

      const dedupedById = [];
      const seen = new Set();
      [...timelineEvents, ...followedUserEvents].forEach((event) => {
        const eventId = Number(event?.id || 0);
        if (!(eventId > 0) || seen.has(eventId)) return;
        seen.add(eventId);
        dedupedById.push(event);
      });

      dedupedById.sort((a, b) => new Date(b?.created_at || 0) - new Date(a?.created_at || 0));

      setYourPageEvents(dedupedById.slice(0, HOME_YOUR_PAGE_EVENTS_RESULT_LIMIT));
      setHasLoadedYourPage(true);
    } catch (error) {
      console.error('Error loading Your Page data:', error);
      setYourPageTimelines([]);
      setYourPageEvents([]);
      setHasLoadedYourPage(true);
    } finally {
      setLoadingYourPage(false);
    }
  }, [user, normalizedTimelines, followedUsers, currentUserId]);

  React.useEffect(() => {
    if (!hasBootstrappedYourPageCache) return;
    if (activeHubTab !== 'your-page') return;
    if (isHubPhaseOneLoading) return;
    if (hasLoadedYourPage || loadingYourPage) return;

    fetchYourPageData();
  }, [activeHubTab, isHubPhaseOneLoading, hasLoadedYourPage, loadingYourPage, fetchYourPageData, hasBootstrappedYourPageCache]);

  React.useEffect(() => {
    if (!user?.id) return;
    if (!hasLoadedYourPage) return;
    if (!normalizedTimelines.length) return;

    try {
      window.sessionStorage.setItem(getYourPageCacheKey(user.id), JSON.stringify({
        timelines: yourPageTimelines,
        events: yourPageEvents,
        source_timeline_count: normalizedTimelines.length,
        cached_at: Date.now(),
      }));
    } catch (error) {
      console.error('Error writing Your Page cache:', error);
    }
  }, [user?.id, hasLoadedYourPage, yourPageTimelines, yourPageEvents, normalizedTimelines.length, getYourPageCacheKey]);

  const handleRefreshYourPage = React.useCallback(() => {
    if (!user?.id || loadingYourPage) return;
    clearYourPageCache(user.id);
    setHasLoadedYourPage(false);
    setYourPageTimelines([]);
    setYourPageEvents([]);
    setVisibleYourPageTimelineCount(HOME_LIST_BATCH_SIZE);
    setVisibleYourPagePostCount(HOME_LIST_BATCH_SIZE);
    fetchYourPageData();
  }, [user?.id, loadingYourPage, fetchYourPageData, clearYourPageCache]);

  const handleToggleUserFollow = React.useCallback(async (profileUser) => {
    const targetId = Number(profileUser?.id || 0);
    if (!(targetId > 0) || (currentUserId > 0 && targetId === currentUserId)) return;
    if (followActionByUserId[targetId]) return;

    const currentlyFollowing = followedUserIdSet.has(targetId);
    const targetLabel = profileUser?.username ? `@${profileUser.username}` : 'this user';

    try {
      setFollowActionByUserId((prev) => ({ ...prev, [targetId]: true }));
      if (currentlyFollowing) {
        await unfollowUser(targetId);
        setUserFollowSnackbarMessage(`Unfollowed ${targetLabel}`);
      } else {
        await followUser(targetId);
        setUserFollowSnackbarMessage(`Following ${targetLabel}`);
      }
      await fetchFollowedUsers();
      await fetchFollowerUsers();
      setUserFollowSnackbarSeverity('success');
      setUserFollowSnackbarOpen(true);
    } catch (error) {
      console.error('Error toggling user follow:', error);
      const message = error?.response?.data?.error || `Could not update follow status for ${targetLabel}`;
      setUserFollowSnackbarMessage(message);
      setUserFollowSnackbarSeverity('error');
      setUserFollowSnackbarOpen(true);
    } finally {
      setFollowActionByUserId((prev) => ({ ...prev, [targetId]: false }));
    }
  }, [currentUserId, fetchFollowedUsers, fetchFollowerUsers, followActionByUserId, followedUserIdSet]);

  const handleOpenUserActionMenu = React.useCallback((event, profileUser) => {
    event.stopPropagation();
    const targetId = Number(profileUser?.id || 0);
    if (!(targetId > 0)) return;
    setUserActionMenu({ anchorEl: event.currentTarget, userId: targetId });
  }, []);

  const handleCloseUserActionMenu = React.useCallback(() => {
    setUserActionMenu({ anchorEl: null, userId: null });
  }, []);

  const fetchMyCreationEvents = React.useCallback(async () => {
    if (loadingMyCreationEvents || hasLoadedMyCreationEvents || !ownedTimelines.length) return;
    if (!(currentUserId > 0)) {
      setMyCreationEvents([]);
      setHasLoadedMyCreationEvents(true);
      return;
    }

    try {
      setLoadingMyCreationEvents(true);

      const sourceTimelines = ownedTimelines.slice(0, HOME_MY_CREATIONS_TIMELINE_SOURCE_LIMIT);

      const sourceTimelineMap = new Map(
        sourceTimelines.map((timeline) => [Number(timeline?.id || 0), timeline]),
      );
      const sourceTimelineIds = new Set(
        sourceTimelines.map((timeline) => Number(timeline?.id || 0)).filter((id) => id > 0),
      );

      let merged = [];
      try {
        const response = await api.get(`/api/users/${currentUserId}/events`, {
          params: { limit: HOME_MY_CREATIONS_EVENTS_RESULT_LIMIT * 2 },
        });
        const payload = response?.data;
        const events = Array.isArray(payload?.events)
          ? payload.events
          : (Array.isArray(payload) ? payload : []);

        merged = events
          .filter((event) => {
            const timelineId = Number(event?.timeline_id || 0);
            return timelineId > 0 && sourceTimelineIds.has(timelineId);
          })
          .map((event) => {
            const timelineId = Number(event?.timeline_id || 0);
            const timelineMeta = sourceTimelineMap.get(timelineId) || null;
            return {
              ...event,
              timeline_id: timelineId,
              timeline_name: event?.timeline_name || timelineMeta?.name || '',
              timeline_type: event?.timeline_type || timelineMeta?.timeline_type || 'hashtag',
            };
          });
      } catch (userEventsError) {
        console.warn('[HomePage] Falling back to per-timeline fetch for My Creations events:', userEventsError);
        const requests = sourceTimelines.map((timeline) => api.get(`/api/timeline-v3/${timeline.id}/events`, {
          params: { limit: HOME_PER_TIMELINE_EVENTS_FETCH_LIMIT },
        }));
        const results = await Promise.allSettled(requests);

        for (let i = 0; i < results.length; i += 1) {
          const result = results[i];
          const timeline = sourceTimelines[i];
          if (result.status !== 'fulfilled') continue;

          const payload = result.value?.data;
          const events = Array.isArray(payload?.events)
            ? payload.events
            : (Array.isArray(payload) ? payload : []);

          events.forEach((event) => {
            const authorId = Number(event?.created_by || event?.creator_id || event?.user_id || 0);
            if (!(authorId > 0 && authorId === currentUserId)) return;

            merged.push({
              ...event,
              timeline_id: event?.timeline_id || timeline?.id,
              timeline_name: timeline?.name || event?.timeline_name || '',
              timeline_type: timeline?.timeline_type || event?.timeline_type || 'hashtag',
            });
          });
        }
      }

      const dedupedById = [];
      const seen = new Set();
      merged.forEach((event) => {
        if (!event?.id || seen.has(event.id)) return;
        seen.add(event.id);
        dedupedById.push(event);
      });

      dedupedById.sort((a, b) => new Date(b?.created_at || 0) - new Date(a?.created_at || 0));

      setMyCreationEvents(dedupedById.slice(0, HOME_MY_CREATIONS_EVENTS_RESULT_LIMIT));
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

  const handleToggleFavoriteTimeline = React.useCallback(async (timelineId) => {
    const numericTimelineId = Number(timelineId || 0);
    if (!(numericTimelineId > 0)) return;

    const nextFavoriteTimelineId = favoriteTimelineId === numericTimelineId ? null : numericTimelineId;
    setFavoriteTimelineId(nextFavoriteTimelineId);
    lastSyncedFavoriteTimelineIdRef.current = nextFavoriteTimelineId;

    try {
      const response = await updateUserPreferences({ favorite_timeline_id: nextFavoriteTimelineId || null });
      const serverFavorite = Number(response?.preferences?.favorite_timeline_id || 0);
      const canonicalFavorite = serverFavorite > 0 ? serverFavorite : null;

      if (canonicalFavorite !== nextFavoriteTimelineId) {
        setFavoriteTimelineId(canonicalFavorite);
        lastSyncedFavoriteTimelineIdRef.current = canonicalFavorite;
      }
    } catch (error) {
      console.warn('[HomePage] Failed to persist favorite timeline preference:', error?.response?.data || error?.message || error);
    }
  }, [favoriteTimelineId]);

  const renderTimelineCard = React.useCallback((timeline, options = {}) => {
    const { allowFavoriteToggle = false } = options;
    const type = String(timeline?.timeline_type || 'hashtag').toLowerCase();
    const isCommunity = type === 'community';
    const isPersonal = type === 'personal';
    const isHashtag = type === 'hashtag';
    const timelineId = Number(timeline?.id || 0);
    const isFavoriteTimeline = timelineId > 0 && favoriteTimelineId === timelineId;
    const typeLabel = isCommunity ? 'Community Timeline' : isPersonal ? 'Personal Timeline' : 'Hashtag Timeline';
    const TypeIcon = isCommunity ? GroupsIcon : isPersonal ? PersonIcon : TagIcon;
    const memberCount = Number(timeline?.member_count ?? timeline?.memberCount ?? 0) || 0;
    const followerCount = Number(
      timeline?.follow_count
      ?? timeline?.followers_count
      ?? timeline?.follower_count
      ?? timeline?.followersCount
      ?? 0,
    ) || 0;
    const popularityCount = Number(timeline?.popularity_count ?? 0) || 0;
    const audienceCount = isCommunity
      ? (memberCount || followerCount || popularityCount)
      : (followerCount || memberCount || popularityCount);
    const audienceLabel = isCommunity ? 'Members' : 'Followers';
    const typeChipGradient = isCommunity
      ? 'linear-gradient(135deg, rgba(30,136,229,0.95) 0%, rgba(13,71,161,0.95) 100%)'
      : isPersonal
        ? 'linear-gradient(135deg, rgba(0,150,136,0.95) 0%, rgba(0,105,92,0.95) 100%)'
        : 'linear-gradient(135deg, rgba(217,119,6,0.95) 0%, rgba(180,83,9,0.95) 100%)';
    const portraitCoverUrl = String(timeline?.cover_portrait_image_url || '').trim();
    const portraitCoverPosition = {
      x: Number(timeline?.cover_portrait_x ?? 50),
      y: Number(timeline?.cover_portrait_y ?? 50),
    };
    const portraitCoverZoom = Number(timeline?.cover_portrait_zoom ?? 1);
    const fallbackCoverUrl = String(
      timeline?.cover_image_url
      || timeline?.banner_url
      || timeline?.cover_url
      || timeline?.background_image_url
      || '',
    ).trim();
    const hasPortraitCover = Boolean(portraitCoverUrl);
    const coverImageUrl = isCommunity
      ? portraitCoverUrl
      : ((isPersonal || isHashtag) ? (portraitCoverUrl || fallbackCoverUrl) : fallbackCoverUrl);
    const isImagePrivilegeEnabled = timeline?.cover_upload_enabled !== false;
    const clampFramePosition = (value, defaultValue = 50) => {
      const numeric = Number(value);
      const safe = Number.isFinite(numeric) ? numeric : Number(defaultValue);
      return Math.max(-40, Math.min(140, safe));
    };
    const clampZoom = (value) => Math.max(1, Math.min(4.875, Number(value) || 1));
    const buildCoverTransform = (position, zoomValue, isPrivilegeEnabled) => {
      const tx = (clampFramePosition(position?.x, 50) - 50) * 0.9;
      const ty = (clampFramePosition(position?.y, 50) - 50) * 0.9;
      const safeZoom = clampZoom(zoomValue);
      const finalZoom = isPrivilegeEnabled ? safeZoom : (safeZoom + 0.08);
      return `translate(${tx}%, ${ty}%) scale(${finalZoom})`;
    };

    return (
      <Card
        key={timeline.id}
        sx={{
          width: '100%',
          display: 'flex',
          flexDirection: { xs: 'column', lg: 'row' },
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
            width: { xs: '100%', lg: 240 },
            minWidth: { xs: '100%', lg: 240 },
            height: { xs: 76, lg: 'auto' },
            px: 1.5,
            display: 'flex',
            alignItems: 'flex-end',
            position: 'relative',
            overflow: 'hidden',
            pb: 1.25,
            background: isCommunity
              ? 'linear-gradient(140deg, rgba(30,136,229,0.85) 0%, rgba(13,71,161,0.85) 100%)'
              : isPersonal
                ? 'linear-gradient(140deg, rgba(0,150,136,0.82) 0%, rgba(0,105,92,0.85) 100%)'
                : 'linear-gradient(140deg, rgba(217,119,6,0.82) 0%, rgba(180,83,9,0.86) 100%)',
          }}
        >
          {coverImageUrl ? (
            <>
              <Box
                component="img"
                src={coverImageUrl}
                alt={`${timeline?.name || 'Timeline'} cover`}
                sx={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  objectPosition: (isCommunity || ((isPersonal || isHashtag) && hasPortraitCover)) ? '50% 28%' : '50% 50%',
                  filter: isImagePrivilegeEnabled ? 'brightness(1.06) saturate(1.04)' : 'blur(18px) saturate(0.45)',
                  transform: (isPersonal || isHashtag) && hasPortraitCover
                    ? buildCoverTransform(portraitCoverPosition, portraitCoverZoom, isImagePrivilegeEnabled)
                    : (isImagePrivilegeEnabled ? 'none' : 'scale(1.08)'),
                }}
              />
              <Box
                sx={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(180deg, rgba(6,10,19,0.04) 0%, rgba(6,10,19,0.22) 100%)',
                }}
              />
              {!isImagePrivilegeEnabled ? (
                <Chip
                  size="small"
                  label="Image Privilege Off"
                  sx={{
                    position: 'relative',
                    zIndex: 1,
                    color: '#fff',
                    borderColor: 'rgba(255,255,255,0.45)',
                    background: 'rgba(9,14,28,0.66)',
                    fontWeight: 700,
                  }}
                  variant="outlined"
                />
              ) : null}
            </>
          ) : (
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.92)', letterSpacing: 0.4 }}>
              Timeline banner placeholder (future image slot)
            </Typography>
          )}
        </Box>

        <CardContent sx={{ flexGrow: 1, minWidth: 0 }}>
          <Box
            sx={{
              minHeight: 'auto',
              mb: 1.1,
            }}
          >
            <Chip
              size="small"
              icon={<TypeIcon fontSize="small" />}
              label={typeLabel}
              sx={{
                position: 'relative',
                mb: 0.85,
                px: 0.35,
                height: 24,
                borderRadius: 1.6,
                color: '#fff',
                fontWeight: 700,
                fontSize: '0.66rem',
                letterSpacing: 0.28,
                textTransform: 'uppercase',
                background: typeChipGradient,
                border: '1px solid rgba(255,255,255,0.24)',
                boxShadow: '0 8px 18px rgba(0,0,0,0.22)',
                '& .MuiChip-label': {
                  px: 0.85,
                },
                '& .MuiChip-icon': {
                  color: 'rgba(255,255,255,0.94)',
                  fontSize: 14,
                },
              }}
            />
            <Box
              sx={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: { xs: 'flex-start', lg: 'center' },
                gap: 0.9,
                flexWrap: 'wrap',
                width: '100%',
              }}
            >
              <Typography
                variant="h5"
                sx={{
                  position: 'relative',
                  display: 'inline-flex',
                  lineHeight: 1.15,
                  fontSize: { xs: '1.12rem', sm: '1.24rem', md: '1.34rem' },
                  fontWeight: 900,
                  letterSpacing: 0.25,
                  pr: 0.5,
                  pb: 0.45,
                  mb: 0,
                  maxWidth: '100%',
                  overflowWrap: 'anywhere',
                  wordBreak: 'break-word',
                  textAlign: { xs: 'left', lg: 'center' },
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    left: 0,
                    bottom: 0,
                    width: '100%',
                    height: 8,
                    borderRadius: 12,
                    background: isCommunity
                      ? 'linear-gradient(90deg, rgba(30,136,229,0.78), rgba(13,71,161,0.42))'
                      : isPersonal
                        ? 'linear-gradient(90deg, rgba(0,150,136,0.78), rgba(0,105,92,0.42))'
                        : 'linear-gradient(90deg, rgba(217,119,6,0.8), rgba(180,83,9,0.44))',
                  },
                }}
              >
                {timeline.name}
              </Typography>
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 0.8,
                  px: 1.15,
                  py: 0.6,
                  borderRadius: 999,
                  border: '1px solid',
                  borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.16)' : 'rgba(30,41,59,0.2)',
                  background: theme.palette.mode === 'dark'
                    ? 'linear-gradient(120deg, rgba(255,255,255,0.07), rgba(255,255,255,0.03))'
                    : 'linear-gradient(120deg, rgba(255,255,255,0.88), rgba(255,244,227,0.82))',
                }}
              >
                <LocalFireDepartmentIcon sx={{ fontSize: 17, color: '#d97706' }} />
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 900,
                    letterSpacing: 0.35,
                    color: theme.palette.text.primary,
                  }}
                >
                  {audienceCount.toLocaleString()} {audienceLabel}
                </Typography>
              </Box>
            </Box>
          </Box>
          {timeline.description ? (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
              {timeline.description}
            </Typography>
          ) : null}
          <Typography variant="caption" color="text.secondary">
            Created: {formatDate(timeline.created_at)}
          </Typography>
        </CardContent>
        <Box
          sx={{
            px: 2,
            pt: { xs: 0, lg: 2 },
            pb: 2,
            alignSelf: 'stretch',
            display: 'flex',
            flexDirection: { xs: 'row', lg: 'column' },
            alignItems: { xs: 'center', lg: 'center' },
            justifyContent: { xs: 'space-between', lg: 'space-between' },
            gap: { xs: 1, lg: 0 },
          }}
        >
          {allowFavoriteToggle ? (
            <IconButton
              size="small"
              aria-label={isFavoriteTimeline ? 'Remove favorite timeline' : 'Set as favorite timeline'}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                handleToggleFavoriteTimeline(timelineId);
              }}
              sx={{
                border: '1px solid',
                borderColor: isFavoriteTimeline
                  ? (theme.palette.mode === 'dark' ? 'rgba(250,204,21,0.72)' : 'rgba(202,138,4,0.75)')
                  : (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(15,23,42,0.2)'),
                color: isFavoriteTimeline
                  ? (theme.palette.mode === 'dark' ? '#facc15' : '#ca8a04')
                  : 'text.secondary',
                background: isFavoriteTimeline
                  ? (theme.palette.mode === 'dark'
                    ? 'linear-gradient(135deg, rgba(146,64,14,0.2), rgba(250,204,21,0.2))'
                    : 'linear-gradient(135deg, rgba(254,249,195,0.9), rgba(253,230,138,0.9))')
                  : 'transparent',
                '&:hover': {
                  background: isFavoriteTimeline
                    ? (theme.palette.mode === 'dark'
                      ? 'linear-gradient(135deg, rgba(146,64,14,0.28), rgba(250,204,21,0.28))'
                      : 'linear-gradient(135deg, rgba(254,240,138,0.94), rgba(252,211,77,0.94))')
                    : (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.06)'),
                },
              }}
            >
              {isFavoriteTimeline ? <StarIcon fontSize="small" /> : <StarBorderIcon fontSize="small" />}
            </IconButton>
          ) : null}
          <Button
            size="small"
            variant="contained"
            component="a"
            href={`/timeline-v3/${timelineId}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Open Timeline
          </Button>
        </Box>
      </Card>
    );
  }, [theme.palette.mode, favoriteTimelineId, handleToggleFavoriteTimeline]);

  const renderSearchEventCard = React.useCallback((event) => {
    const handleMediaLoadError = async (errorPayload) => {
      try {
        const sourceEvent = errorPayload?.event || event;
        const eventId = Number(sourceEvent?.id || 0);
        if (!(eventId > 0)) return;

        const now = Date.now();
        const dedupWindowMs = 5 * 60 * 1000;
        const lastReportedAt = Number(brokenEventReportDedupRef.current.get(eventId) || 0);
        if (now - lastReportedAt < dedupWindowMs) return;
        brokenEventReportDedupRef.current.set(eventId, now);

        const timelineId = Number(
          sourceEvent?.timeline_id
          || sourceEvent?.timelineId
          || sourceEvent?.timeline?.id
          || 0,
        );
        const mediaKind = String(errorPayload?.mediaKind || 'media').trim().toLowerCase();
        const stage = String(errorPayload?.stage || 'load_error').trim().toLowerCase();
        const mediaUrl = String(
          errorPayload?.mediaUrl
          || errorPayload?.audioUrl
          || sourceEvent?.media_url
          || sourceEvent?.url
          || '',
        ).trim();
        const browserMessage = String(errorPayload?.browserMessage || '').trim();

        const noteParts = [
          `source=home_auto`,
          `kind=${mediaKind}`,
          `stage=${stage}`,
        ];
        if (timelineId > 0) noteParts.push(`timeline_id=${timelineId}`);
        if (mediaUrl) noteParts.push(`media_url=${mediaUrl.slice(0, 260)}`);
        if (browserMessage) noteParts.push(`browser=${browserMessage.slice(0, 180)}`);
        const note = noteParts.join(' | ').slice(0, 900);

        await addBrokenEventQueueItem(eventId, note);
      } catch (reportError) {
        console.warn('[Home] Failed to auto-queue broken event from media error:', reportError);
      }
    };

    const eventType = String(event?.type || EVENT_TYPES.REMARK).toLowerCase();
    const sharedProps = {
      event,
      onEdit: () => {},
      onDelete: () => {},
      isSelected: true,
      setIsPopupOpen: () => {},
      reviewingEventIds: EMPTY_REVIEWING_EVENT_IDS,
      showInlineVoteControls: true,
      showVoteOverlay: false,
      onMediaLoadError: handleMediaLoadError,
    };

    if (eventType === EVENT_TYPES.NEWS) {
      return <NewsCard {...sharedProps} />;
    }
    if (eventType === EVENT_TYPES.MEDIA) {
      return <MediaCard {...sharedProps} />;
    }
    return <RemarkCard {...sharedProps} />;
  }, []);

  const renderUserProfileCard = React.useCallback((profileUser) => {
    const userPrimaryColor = resolveUserIdentityColor(profileUser);
    const fallbackStartTone = theme.palette.mode === 'dark' ? '#1a2a3f' : '#fff4ea';
    const fallbackEndTone = theme.palette.mode === 'dark' ? '#395574' : '#dcecff';
    const userCardBackground = userPrimaryColor
      ? `linear-gradient(90deg, ${alpha(fallbackStartTone, 0.97)} 0%, ${alpha(fallbackEndTone, 0.9)} 46%, ${alpha(userPrimaryColor, 0.9)} 100%)`
      : `linear-gradient(90deg, ${alpha(fallbackStartTone, 0.97)} 0%, ${alpha(fallbackEndTone, 0.93)} 100%)`;

    const profileUserId = Number(profileUser?.id || 0);
    const isFollowing = followedUserIdSet.has(profileUserId);
    const isSelf = currentUserId > 0 && profileUserId === currentUserId;
    const followBusy = !!followActionByUserId[profileUserId];
    const isActionMenuOpen = userActionMenu.userId === profileUserId && Boolean(userActionMenu.anchorEl);

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

          <Stack spacing={0.75} sx={{ alignSelf: 'flex-end' }}>
            <Button
              size="small"
              variant="contained"
              onClick={(e) => {
                handleOpenUserActionMenu(e, profileUser);
              }}
              endIcon={<ExpandMoreIcon fontSize="small" />}
              sx={{
                textTransform: 'none',
                fontWeight: 700,
                borderRadius: 1.75,
                px: 1.4,
                background: 'linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)',
                boxShadow: '0 8px 16px rgba(37,99,235,0.24)',
              }}
            >
              Actions
            </Button>

            <Menu
              anchorEl={userActionMenu.anchorEl}
              open={isActionMenuOpen}
              onClose={handleCloseUserActionMenu}
              onClick={(event) => event.stopPropagation()}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              PaperProps={{
                sx: {
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.14)' : 'rgba(15,23,42,0.15)',
                  boxShadow: theme.palette.mode === 'dark'
                    ? '0 14px 24px rgba(0,0,0,0.42)'
                    : '0 12px 20px rgba(15,23,42,0.18)',
                },
              }}
            >
              <MenuItem
                onClick={(event) => {
                  event.stopPropagation();
                  handleCloseUserActionMenu();
                  navigate(`/profile/${profileUser.id}`);
                }}
              >
                View Profile
              </MenuItem>

              {!isSelf ? (
                <MenuItem
                  disabled={followBusy}
                  onClick={(event) => {
                    event.stopPropagation();
                    handleCloseUserActionMenu();
                    handleToggleUserFollow(profileUser);
                  }}
                  sx={{
                    color: isFollowing
                      ? (theme.palette.mode === 'dark' ? 'rgb(252,165,165)' : 'rgb(185,28,28)')
                      : (theme.palette.mode === 'dark' ? 'rgb(147,197,253)' : 'rgb(30,64,175)'),
                    fontWeight: 700,
                  }}
                >
                  {followBusy ? 'Saving...' : isFollowing ? 'Unfollow' : 'Follow'}
                </MenuItem>
              ) : null}
            </Menu>
          </Stack>
        </CardContent>
      </Card>
    );
  }, [
    theme.palette.mode,
    currentUserId,
    followedUserIdSet,
    followActionByUserId,
    userActionMenu,
    handleOpenUserActionMenu,
    handleCloseUserActionMenu,
    handleToggleUserFollow,
    navigate,
  ]);

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return 'Unknown';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleLoadMoreFromLeftHub = React.useCallback((event) => {
    event.stopPropagation();
    let attemptedManualLoad = false;
    let revealedMore = false;

    if (activeHubTab === 'timeline-search') {
      attemptedManualLoad = hasSearchQuery && !loadingTimelines && !loadingSearchEvents && !loadingSearchUsers;
      if (attemptedManualLoad) {
        const nextCount = Math.min(visibleTimelineCount + HOME_LIST_BATCH_SIZE, searchVisibleMaxCount);
        revealedMore = nextCount > visibleTimelineCount;
        setVisibleTimelineCount(nextCount);
      }
    }

    if (activeHubTab === 'favorite') {
      attemptedManualLoad = !loadingFavoriteTimelineEvents;
      if (attemptedManualLoad) {
        const nextCount = Math.min(visibleFavoritePostCount + HOME_LIST_BATCH_SIZE, favoriteTimelineEvents.length);
        revealedMore = nextCount > visibleFavoritePostCount;
        setVisibleFavoritePostCount(nextCount);
      }
    }

    if (activeHubTab === 'popular') {
      attemptedManualLoad = !loadingPopular;
      if (attemptedManualLoad) {
        if (popularFilter === 'timelines') {
          const nextCount = Math.min(visiblePopularTimelineCount + POPULAR_LIST_BATCH_SIZE, popularTimelines.length);
          revealedMore = nextCount > visiblePopularTimelineCount;
          setVisiblePopularTimelineCount(nextCount);
        } else {
          const nextCount = Math.min(visiblePopularPostCount + POPULAR_LIST_BATCH_SIZE, popularEvents.length);
          revealedMore = nextCount > visiblePopularPostCount;
          setVisiblePopularPostCount(nextCount);
        }
      }
    }

    if (activeHubTab === 'my-creations') {
      attemptedManualLoad = myCreationsFilter === 'timelines' ? !loadingTimelines : !loadingMyCreationEvents;
      if (attemptedManualLoad) {
        if (myCreationsFilter === 'timelines') {
          const nextCount = Math.min(visibleMyCreationsTimelineCount + HOME_LIST_BATCH_SIZE, ownedTimelines.length);
          revealedMore = nextCount > visibleMyCreationsTimelineCount;
          setVisibleMyCreationsTimelineCount(nextCount);
        } else {
          const nextCount = Math.min(visibleMyCreationsPostCount + HOME_LIST_BATCH_SIZE, myCreationEvents.length);
          revealedMore = nextCount > visibleMyCreationsPostCount;
          setVisibleMyCreationsPostCount(nextCount);
        }
      }
    }

    if (activeHubTab === 'your-page') {
      attemptedManualLoad = !loadingYourPage;
      if (attemptedManualLoad) {
        if (yourPageFilter === 'timelines') {
          const nextCount = Math.min(visibleYourPageTimelineCount + HOME_LIST_BATCH_SIZE, yourPageTimelines.length);
          revealedMore = nextCount > visibleYourPageTimelineCount;
          setVisibleYourPageTimelineCount(nextCount);
        } else {
          const nextCount = Math.min(visibleYourPagePostCount + HOME_LIST_BATCH_SIZE, yourPageEvents.length);
          revealedMore = nextCount > visibleYourPagePostCount;
          setVisibleYourPagePostCount(nextCount);
        }
      }
    }

    if (attemptedManualLoad && !revealedMore) {
      setUserFollowSnackbarMessage('No additional items are available to load.');
      setUserFollowSnackbarSeverity('info');
      setUserFollowSnackbarOpen(true);
    }
  }, [
    activeHubTab,
    hasSearchQuery,
    loadingTimelines,
    loadingSearchEvents,
    loadingSearchUsers,
    searchVisibleMaxCount,
    visibleTimelineCount,
    loadingPopular,
    popularFilter,
    visiblePopularTimelineCount,
    popularTimelines.length,
    visiblePopularPostCount,
    popularEvents.length,
    myCreationsFilter,
    loadingMyCreationEvents,
    visibleMyCreationsTimelineCount,
    ownedTimelines.length,
    visibleMyCreationsPostCount,
    myCreationEvents.length,
    loadingYourPage,
    yourPageFilter,
    visibleYourPageTimelineCount,
    yourPageTimelines.length,
    visibleYourPagePostCount,
    yourPageEvents.length,
    loadingFavoriteTimelineEvents,
    visibleFavoritePostCount,
    favoriteTimelineEvents.length,
  ]);

  const handleHubScroll = (e) => {
    const el = e.currentTarget;
    setShowActiveHubScrollTop(el.scrollTop > 24);
    const reachedBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - ACTIVE_HUB_LOAD_MORE_TRIGGER_PX;
    const distanceFromBottom = el.scrollHeight - (el.scrollTop + el.clientHeight);
    setShowActiveHubLoadMore((prev) => {
      if (distanceFromBottom <= ACTIVE_HUB_LOAD_MORE_TRIGGER_PX) return true;
      if (distanceFromBottom >= ACTIVE_HUB_LOAD_MORE_HIDE_PX) return false;
      return prev;
    });
    if (reachedBottom && visibleTimelineCount < searchVisibleMaxCount) {
      setVisibleTimelineCount((prev) => Math.min(prev + HOME_LIST_BATCH_SIZE, searchVisibleMaxCount));
    }
  };

  const handleOpenMakePostDialog = React.useCallback(() => {
    setPostAdvancedOpen(false);
    setPostTimelineSearchInput('');
    setPostTypeDialogOpen(true);

    if (user?.id && !loadingYourPage) {
      fetchYourPageData();
    }
  }, [fetchYourPageData, loadingYourPage, user?.id]);

  const handleCloseMakePostDialog = React.useCallback(() => {
    if (postFlowLoading) return;
    setPostTypeDialogOpen(false);
    setPostAdvancedOpen(false);
    setPostTimelineSearchInput('');
  }, [postFlowLoading]);

  const handleSelectAdvancedTimeline = React.useCallback((timeline) => {
    if (!timeline?.id) return;

    setPostTargetTimeline({
      id: timeline.id,
      name: timeline.baseName,
      timeline_type: timeline.timeline_type || 'hashtag',
      visibility: timeline.visibility || 'public',
    });
    setPostTypeDialogOpen(false);
    setPostAdvancedOpen(false);
    setPostTimelineSearchInput('');
    setPostEventDialogOpen(true);
  }, []);

  const resolveOrCreatePostTimeline = React.useCallback(async (postVisibility) => {
    const usernameBase = String(user?.username || '').trim();
    if (!usernameBase) {
      throw new Error('Missing username. Please sign in again and retry.');
    }

    const normalizedName = usernameBase.toUpperCase();
    const desiredType = postVisibility === 'private' ? 'personal' : 'hashtag';

    let existingTimeline = null;
    if (desiredType === 'personal') {
      existingTimeline = timelines.find((timeline) =>
        (timeline.timeline_type || 'hashtag') === 'personal'
        && Number(timeline.created_by || 0) === Number(user?.id || 0)
        && (timeline.name || '').toUpperCase() === normalizedName,
      );
    } else {
      existingTimeline = timelines.find((timeline) =>
        (timeline.timeline_type || 'hashtag') === 'hashtag'
        && (timeline.name || '').toUpperCase() === normalizedName,
      );
    }

    if (existingTimeline?.id) {
      return existingTimeline;
    }

    const response = await api.post('/api/timeline-v3', {
      name: normalizedName,
      description: desiredType === 'personal'
        ? `${usernameBase}'s personal timeline`
        : `${usernameBase}'s public posting timeline`,
      timeline_type: desiredType,
      visibility: 'public',
    });

    const createdTimeline = response?.data || null;
    if (createdTimeline?.id) {
      setTimelines((prev) => [createdTimeline, ...prev]);
      return createdTimeline;
    }

    throw new Error('Timeline setup failed. Please retry.');
  }, [timelines, user?.id, user?.username]);

  const handleSelectPostVisibility = React.useCallback(async (postVisibility) => {
    try {
      setPostFlowLoading(true);
      const timeline = await resolveOrCreatePostTimeline(postVisibility);
      setPostTargetTimeline({
        id: timeline.id,
        name: timeline.name,
        timeline_type: timeline.timeline_type || (postVisibility === 'private' ? 'personal' : 'hashtag'),
        visibility: timeline.visibility || 'public',
      });
      setPostTypeDialogOpen(false);
      setPostEventDialogOpen(true);
    } catch (error) {
      const message = error?.response?.data?.error || error?.message || 'Could not prepare posting timeline.';
      setUserFollowSnackbarMessage(message);
      setUserFollowSnackbarSeverity('error');
      setUserFollowSnackbarOpen(true);
    } finally {
      setPostFlowLoading(false);
    }
  }, [resolveOrCreatePostTimeline]);

  const handleClosePostEventDialog = React.useCallback(() => {
    if (postSubmitLoading) return;
    setPostEventDialogOpen(false);
    setPostTargetTimeline(null);
  }, [postSubmitLoading]);

  const handleOpenFavoritePostDialog = React.useCallback(() => {
    const targetTimelineId = Number(selectedFavoriteTimeline?.id || 0);
    if (!(targetTimelineId > 0)) {
      setUserFollowSnackbarMessage('Select a favorite timeline first.');
      setUserFollowSnackbarSeverity('info');
      setUserFollowSnackbarOpen(true);
      return;
    }

    setPostTargetTimeline({
      id: targetTimelineId,
      name: String(selectedFavoriteTimeline?.name || 'Favorite Timeline').trim() || 'Favorite Timeline',
      timeline_type: selectedFavoriteTimeline?.timeline_type || 'hashtag',
      visibility: selectedFavoriteTimeline?.visibility || 'public',
    });
    setPostTypeDialogOpen(false);
    setPostAdvancedOpen(false);
    setPostTimelineSearchInput('');
    setPostEventDialogOpen(true);
  }, [selectedFavoriteTimeline]);

  const handleSubmitHomeEvent = React.useCallback(async (eventData) => {
    if (!postTargetTimeline?.id) {
      setUserFollowSnackbarMessage('No timeline selected for posting.');
      setUserFollowSnackbarSeverity('error');
      setUserFollowSnackbarOpen(true);
      return;
    }

    try {
      setPostSubmitLoading(true);
      const targetTimelineId = Number(postTargetTimeline.id);
      const submitStartedAt = Date.now();

      await api.post(`/api/timeline-v3/${targetTimelineId}/events`, {
        title: eventData?.title || '',
        description: eventData?.description || '',
        type: eventData?.type,
        event_date: eventData?.event_date,
        raw_event_date: eventData?.raw_event_date,
        is_exact_user_time: eventData?.is_exact_user_time !== false,
        url: eventData?.url || '',
        url_title: eventData?.url_title || '',
        url_description: eventData?.url_description || '',
        url_image: eventData?.url_image || '',
        url_source: eventData?.url_source || '',
        media_url: eventData?.media_url || '',
        media_type: eventData?.media_type || '',
        media_subtype: eventData?.media_subtype || '',
        cloudinary_id: eventData?.cloudinary_id || undefined,
        tags: Array.isArray(eventData?.tags) ? eventData.tags : [],
      });

      setUserFollowSnackbarMessage('Post created. Opening timeline...');
      setUserFollowSnackbarSeverity('success');
      setUserFollowSnackbarOpen(true);

      const elapsedMs = Date.now() - submitStartedAt;
      const remainingLoadingMs = Math.max(1200 - elapsedMs, 0);

      window.setTimeout(() => {
        setPostSubmitLoading(false);
        setPostEventDialogOpen(false);
        setPostTargetTimeline(null);
        navigate(`/timeline-v3/${targetTimelineId}`);
      }, remainingLoadingMs);
    } catch (error) {
      const message = error?.response?.data?.error || error?.message || 'Failed to create post.';
      setUserFollowSnackbarMessage(message);
      setUserFollowSnackbarSeverity('error');
      setUserFollowSnackbarOpen(true);
      setPostSubmitLoading(false);
    }
  }, [navigate, postTargetTimeline?.id]);

  const handlePopularFilterChange = (nextFilter) => {
    if (nextFilter === popularFilter) return;
    setPopularFilter(nextFilter);

    if (nextFilter === 'timelines') {
      setVisiblePopularTimelineCount(POPULAR_LIST_BATCH_SIZE);
    } else {
      setVisiblePopularPostCount(POPULAR_LIST_BATCH_SIZE);
    }

    if (popularScrollRef.current) {
      popularScrollRef.current.scrollTop = 0;
      if (popularArrowRafRef.current) {
        window.cancelAnimationFrame(popularArrowRafRef.current);
        popularArrowRafRef.current = null;
      }
      if (popularScrollIdleTimeoutRef.current) {
        window.clearTimeout(popularScrollIdleTimeoutRef.current);
        popularScrollIdleTimeoutRef.current = null;
      }
      popularArrowVisibleRef.current = false;
      setShowActiveHubScrollTop(false);
      setShowActiveHubLoadMore(false);
    }
  };

  const schedulePopularScrollTopVisibility = React.useCallback((nextVisible) => {
    if (popularArrowVisibleRef.current === nextVisible) return;

    popularArrowVisibleRef.current = nextVisible;
    if (popularArrowRafRef.current) {
      window.cancelAnimationFrame(popularArrowRafRef.current);
    }

    popularArrowRafRef.current = window.requestAnimationFrame(() => {
      setShowActiveHubScrollTop(nextVisible);
      popularArrowRafRef.current = null;
    });
  }, []);

  const handlePopularScroll = (e) => {
    const el = e.currentTarget;
    const scrollTop = el.scrollTop;

    if (popularScrollIdleTimeoutRef.current) {
      window.clearTimeout(popularScrollIdleTimeoutRef.current);
    }

    popularScrollIdleTimeoutRef.current = window.setTimeout(() => {
      const shouldShowArrow = scrollTop >= POPULAR_SCROLL_TOP_SHOW_THRESHOLD_PX
        ? true
        : (scrollTop <= POPULAR_SCROLL_TOP_HIDE_THRESHOLD_PX ? false : popularArrowVisibleRef.current);
      schedulePopularScrollTopVisibility(shouldShowArrow);
      popularScrollIdleTimeoutRef.current = null;
    }, POPULAR_SCROLL_IDLE_MS);

    const reachedBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - ACTIVE_HUB_LOAD_MORE_TRIGGER_PX;
    const distanceFromBottom = el.scrollHeight - (el.scrollTop + el.clientHeight);
    setShowActiveHubLoadMore((prev) => {
      if (distanceFromBottom <= ACTIVE_HUB_LOAD_MORE_TRIGGER_PX) return true;
      if (distanceFromBottom >= ACTIVE_HUB_LOAD_MORE_HIDE_PX) return false;
      return prev;
    });
    if (!reachedBottom) return;

    if (popularFilter === 'timelines' && visiblePopularTimelines.length < popularTimelines.length) {
      setVisiblePopularTimelineCount((prev) => Math.min(prev + POPULAR_LIST_BATCH_SIZE, popularTimelines.length));
      return;
    }

    if (popularFilter === 'posts' && visiblePopularPosts.length < popularEvents.length) {
      setVisiblePopularPostCount((prev) => Math.min(prev + POPULAR_LIST_BATCH_SIZE, popularEvents.length));
    }
  };

  const handleFriendsListScroll = React.useCallback((e) => {
    const el = e.currentTarget;
    setShowActiveHubScrollTop(el.scrollTop > 24);
    setShowActiveHubLoadMore(false);
  }, []);

  const handleScrollActiveHubToTop = React.useCallback((event) => {
    event.stopPropagation();
    const el = getActiveHubScrollElement();
    if (!el) return;

    el.scrollTo({ top: 0, behavior: 'smooth' });
    setShowActiveHubScrollTop(false);
    setShowActiveHubLoadMore(false);
  }, [getActiveHubScrollElement]);

  const handleMyCreationsScroll = (e) => {
    const el = e.currentTarget;
    setShowActiveHubScrollTop(el.scrollTop > 24);
    const reachedBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - ACTIVE_HUB_LOAD_MORE_TRIGGER_PX;
    const distanceFromBottom = el.scrollHeight - (el.scrollTop + el.clientHeight);
    setShowActiveHubLoadMore((prev) => {
      if (distanceFromBottom <= ACTIVE_HUB_LOAD_MORE_TRIGGER_PX) return true;
      if (distanceFromBottom >= ACTIVE_HUB_LOAD_MORE_HIDE_PX) return false;
      return prev;
    });
    if (!reachedBottom) return;

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
      setShowActiveHubScrollTop(false);
      setShowActiveHubLoadMore(false);
    }
  };

  const handleSearchChange = (e) => {
    setTimelineSearchInput(e.target.value);
    setVisibleTimelineCount(HOME_LIST_BATCH_SIZE);
    if (resultsScrollRef.current) {
      resultsScrollRef.current.scrollTop = 0;
      setShowActiveHubScrollTop(false);
      setShowActiveHubLoadMore(false);
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
      setShowActiveHubScrollTop(false);
      setShowActiveHubLoadMore(false);
    }

    myCreationsFilterTransitionTimeoutRef.current = window.setTimeout(() => {
      setIsMyCreationsSubTabPhaseOneLoading(false);
    }, HUB_PHASE_ONE_MS);
  };

  const handleYourPageFilterChange = (nextFilter) => {
    if (nextFilter === yourPageFilter) return;
    setYourPageFilter(nextFilter);

    if (nextFilter === 'timelines') {
      setVisibleYourPageTimelineCount(HOME_LIST_BATCH_SIZE);
    } else {
      setVisibleYourPagePostCount(HOME_LIST_BATCH_SIZE);
    }

    if (yourPageScrollRef.current) {
      yourPageScrollRef.current.scrollTop = 0;
      setShowActiveHubScrollTop(false);
      setShowActiveHubLoadMore(false);
    }
  };

  const handleYourPageScroll = (e) => {
    const el = e.currentTarget;
    setShowActiveHubScrollTop(el.scrollTop > 24);
    const reachedBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - ACTIVE_HUB_LOAD_MORE_TRIGGER_PX;
    const distanceFromBottom = el.scrollHeight - (el.scrollTop + el.clientHeight);
    setShowActiveHubLoadMore((prev) => {
      if (distanceFromBottom <= ACTIVE_HUB_LOAD_MORE_TRIGGER_PX) return true;
      if (distanceFromBottom >= ACTIVE_HUB_LOAD_MORE_HIDE_PX) return false;
      return prev;
    });
    if (!reachedBottom) return;

    if (yourPageFilter === 'timelines' && visibleYourPageTimelines.length < yourPageTimelines.length) {
      setVisibleYourPageTimelineCount((prev) => Math.min(prev + HOME_LIST_BATCH_SIZE, yourPageTimelines.length));
      return;
    }

    if (yourPageFilter === 'posts' && visibleYourPagePosts.length < yourPageEvents.length) {
      setVisibleYourPagePostCount((prev) => Math.min(prev + HOME_LIST_BATCH_SIZE, yourPageEvents.length));
    }
  };

  const handleFavoriteScroll = (e) => {
    const el = e.currentTarget;
    setShowActiveHubScrollTop(el.scrollTop > 24);
    const reachedBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - ACTIVE_HUB_LOAD_MORE_TRIGGER_PX;
    const distanceFromBottom = el.scrollHeight - (el.scrollTop + el.clientHeight);
    setShowActiveHubLoadMore((prev) => {
      if (distanceFromBottom <= ACTIVE_HUB_LOAD_MORE_TRIGGER_PX) return true;
      if (distanceFromBottom >= ACTIVE_HUB_LOAD_MORE_HIDE_PX) return false;
      return prev;
    });
    if (!reachedBottom || loadingFavoriteTimelineEvents) return;

    if (visibleFavoritePosts.length < favoriteTimelineEvents.length) {
      setVisibleFavoritePostCount((prev) => Math.min(prev + HOME_LIST_BATCH_SIZE, favoriteTimelineEvents.length));
    }
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
    setHasSelectedTimelineType(false);
    setFormData({
      name: '',
      description: '',
      timeline_type: 'community',
      visibility: 'public',
      timeline_mode: 'community',
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === 'timeline_type') {
      setHasSelectedTimelineType(true);

      if (value === 'community') {
        setFormData((prev) => ({
          ...prev,
          timeline_type: 'community',
          visibility: 'public',
          timeline_mode: 'community',
        }));
        return;
      }

      if (value === 'personal') {
        setFormData((prev) => ({
          ...prev,
          timeline_type: 'personal',
          visibility: 'public',
          timeline_mode: 'personal',
        }));
        return;
      }
    }

    setFormData((prev) => ({
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

      const normalizedName = rawName.toUpperCase();
      const type = formData.timeline_type;

      let existingTimeline = null;

      if (type === 'personal') {
        existingTimeline = timelines.find((timeline) =>
          (timeline.timeline_type || 'hashtag') === 'personal'
          && timeline.created_by === (user ? user.id : undefined)
          && (timeline.name || '').toUpperCase() === normalizedName,
        );
      } else {
        existingTimeline = timelines.find((timeline) =>
          (timeline.timeline_type || 'hashtag') === type
          && (timeline.name || '').toUpperCase() === normalizedName,
        );
      }

      if (existingTimeline) {
        handleDialogClose();
        navigate(`/timeline-v3/${existingTimeline.id}`);
        return;
      }

      const response = await api.post('/api/timeline-v3', {
        name: normalizedName,
        description: formData.description.trim(),
        timeline_type: type,
        visibility: formData.visibility,
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
          background: appCanvasBackground,
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
            position: 'relative',
            overflow: 'hidden',
            border: '1px solid',
            borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
            backgroundImage: heroVisualStyles.backgroundImage,
            backgroundSize: heroVisualStyles.backgroundSize,
            backgroundPosition: heroVisualStyles.backgroundPosition,
            '&::before': {
              content: '""',
              position: 'absolute',
              inset: 0,
              background: heroVisualStyles.fogOverlay,
              zIndex: 0,
              pointerEvents: 'none',
            },
            '&::after': {
              content: '""',
              position: 'absolute',
              inset: 0,
              zIndex: 0,
              pointerEvents: 'none',
              background: heroVisualStyles.blurOverlay,
              backdropFilter: heroVisualStyles.applyHardBlur ? 'blur(18px) saturate(0.45)' : 'none',
            },
          }}
        >
          <Box
            sx={{
              position: 'relative',
              zIndex: 1,
              opacity: isHeroContentVisible ? 1 : 0,
              transform: isHeroContentVisible ? 'translateY(0px)' : 'translateY(10px)',
              transition: 'opacity 320ms cubic-bezier(0.22, 1, 0.36, 1), transform 320ms cubic-bezier(0.22, 1, 0.36, 1)',
              minHeight: { xs: 150, md: 165 },
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              px: { xs: 1.1, md: 2 },
              py: { xs: 1.1, md: 1.4 },
              borderRadius: 2.2,
              border: activeHeroSlide?.type === 'welcome' ? 'none' : '1px solid',
              borderColor: activeHeroSlide?.type === 'welcome'
                ? 'transparent'
                : (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.16)' : 'rgba(30,41,59,0.15)'),
              background: activeHeroSlide?.type === 'welcome'
                ? 'transparent'
                : (theme.palette.mode === 'dark' ? 'rgba(10,16,28,0.28)' : 'rgba(255,255,255,0.36)'),
              backdropFilter: activeHeroSlide?.type === 'welcome' ? 'none' : 'blur(7px)',
            }}
          >
            {activeHeroSlide?.type === 'welcome' ? (
              <>
                <Typography variant="h3" sx={{ fontWeight: 800, fontSize: { xs: '1.8rem', md: '2.8rem' } }}>
                  {user?.username ? `Welcome Back ${user.username}!` : 'Welcome to Timeline Forum'}
                </Typography>
                <Typography variant="body1" sx={{ mt: 1, opacity: 0.88 }}>
                  Create and explore timelines with the V3 interface.
                </Typography>
              </>
            ) : null}

            {activeHeroSlide?.type === 'timeline_spotlight' ? (
              <>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.2 }}>
                  <SpotlightTimelineIcon sx={{ fontSize: 22, opacity: 0.92 }} />
                  <Typography variant="h3" sx={{ fontWeight: 800, fontSize: { xs: '1.55rem', md: '2.35rem' }, lineHeight: 1.1 }}>
                    {spotlightTimeline?.name || 'Timeline not available'}
                  </Typography>
                </Stack>
                <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 0.8, mt: 0.4 }}>
                  Random Timeline
                </Typography>
              </>
            ) : null}

            {activeHeroSlide?.type === 'trending_community' ? (
              <>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.2 }}>
                  <GroupsIcon sx={{ fontSize: 22, opacity: 0.92 }} />
                  <Typography variant="h3" sx={{ fontWeight: 800, fontSize: { xs: '1.55rem', md: '2.35rem' }, lineHeight: 1.1 }}>
                    {trendingCommunityLabel || 'Trending community unavailable'}
                  </Typography>
                </Stack>
                <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 0.8, mt: 0.4 }}>
                  Trending Community
                </Typography>
                <Typography variant="body1" sx={{ mt: 0.65, opacity: 0.88 }}>
                  {trendingCommunityTimeline?.description || 'Set a community timeline ID in Site Control to feature it here.'}
                </Typography>
              </>
            ) : null}

            {activeHeroSlide?.type === 'event_spotlight' ? (
              <>
                <Typography variant="h3" sx={{ fontWeight: 800, fontSize: { xs: '1.55rem', md: '2.25rem' }, lineHeight: 1.15 }}>
                  {spotlightEvent?.title || (isEventSpotlightTopVotesMode
                    ? (topVotesTodayLoading ? 'Loading Event Spotlight...' : 'Event Spotlight')
                    : `Event Spotlight #${Number(activeHeroSlide?.event_id || 0) || ''}`)}
                </Typography>
                <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 0.8, mt: 0.4 }}>
                  Event Spotlight of the Day
                </Typography>
                <Typography variant="body1" sx={{ mt: 0.65, opacity: 0.88 }}>
                  {spotlightEvent?.description || (isEventSpotlightTopVotesMode
                    ? 'No top-voted event published today is available yet.'
                    : 'Selected event is not available in loaded home feeds yet.')}
                </Typography>
              </>
            ) : null}

            {activeHeroSlide?.type === 'advertisement' ? (
              <>
                <Typography variant="h3" sx={{ fontWeight: 800, fontSize: { xs: '1.55rem', md: '2.2rem' }, lineHeight: 1.15 }}>
                  {activeHeroSlide?.headline || 'Advertisement'}
                </Typography>
                <Typography variant="body1" sx={{ mt: 0.7, opacity: 0.9 }}>
                  {activeHeroSlide?.subtext || 'Promotional banner slot available.'}
                </Typography>
              </>
            ) : null}

            {activeHeroSlide?.type === 'welcome' && user ? (
              <Stack spacing={1.5} direction={{ xs: 'column', sm: 'row' }} sx={{ mt: 2, justifyContent: 'center' }}>
                <Button variant="contained" onClick={handleOpenMakePostDialog}>MAKE A POST</Button>
                <Button
                  variant="outlined"
                  endIcon={<ArrowForwardIcon sx={{ fontSize: 18 }} />}
                  onClick={() => setDialogOpen(true)}
                  sx={getGlassPillActionButtonSx(theme)}
                >
                  Create Your Timeline
                </Button>
              </Stack>
            ) : null}

            {activeHeroSlide?.type === 'timeline_spotlight' && spotlightTimeline ? (
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mt: 2, justifyContent: 'center' }}>
                <Chip label={spotlightTimelineTypeLabel} variant="outlined" />
                <Chip
                  icon={<LocalFireDepartmentIcon sx={{ color: '#d97706 !important' }} />}
                  label={`${spotlightTimelineAudience.count.toLocaleString()} ${spotlightTimelineAudience.label}`}
                  variant="outlined"
                />
                <Chip label={`Created ${formatDate(spotlightTimeline.created_at)}`} variant="outlined" />
                <Button variant="contained" onClick={() => navigate(`/timeline-v3/${spotlightTimeline.id}`)}>Open Random Timeline</Button>
              </Stack>
            ) : null}

            {activeHeroSlide?.type === 'trending_community' && trendingCommunityTimeline ? (
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mt: 2, justifyContent: 'center' }}>
                <Chip label="Community Timeline" variant="outlined" />
                <Chip
                  icon={<LocalFireDepartmentIcon sx={{ color: '#d97706 !important' }} />}
                  label={`${trendingCommunityAudience.count.toLocaleString()} ${trendingCommunityAudience.label}`}
                  variant="outlined"
                />
                <Chip label={`Created ${formatDate(trendingCommunityTimeline.created_at)}`} variant="outlined" />
                <Button variant="contained" onClick={() => navigate(`/timeline-v3/${trendingCommunityTimeline.id}`)}>Open Trending Community</Button>
              </Stack>
            ) : null}

            {activeHeroSlide?.type === 'event_spotlight' && spotlightEvent ? (
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mt: 2, justifyContent: 'center' }}>
                <Button
                  variant="contained"
                  onClick={handleOpenHeroEventPopup}
                  disabled={heroEventPopupLoading}
                >
                  {heroEventPopupLoading ? 'Opening Event...' : 'Open Event Popup'}
                </Button>
                {spotlightEvent?.timeline_id ? (
                  <Button variant="outlined" onClick={() => navigate(`/timeline-v3/${spotlightEvent.timeline_id}`)}>
                    Open Timeline
                  </Button>
                ) : null}
              </Stack>
            ) : null}

            {activeHeroSlide?.type === 'advertisement' && activeHeroSlide?.cta_label ? (
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mt: 2, justifyContent: 'center' }}>
                <Button
                  variant="outlined"
                  onClick={() => {
                    const target = resolveHeroCtaTarget(activeHeroSlide?.cta_href);
                    if (!target) return;

                    if (target.external) {
                      const shouldOpenInNewTab = activeHeroSlide?.open_in_new_tab !== false;
                      if (shouldOpenInNewTab) {
                        window.open(target.href, '_blank', 'noopener,noreferrer');
                      } else {
                        window.location.assign(target.href);
                      }
                      return;
                    }

                    navigate(target.href);
                  }}
                  sx={getGlassPillActionButtonSx(theme)}
                >
                  {activeHeroSlide?.cta_label}
                </Button>
              </Stack>
            ) : null}
          </Box>

          {activeHeroSlide?.type === 'advertisement' ? (
            <Chip
              size="small"
              label="Advertisement"
              sx={{
                position: 'absolute',
                right: 14,
                bottom: 14,
                zIndex: 2,
                fontWeight: 800,
                letterSpacing: 0.2,
                border: '1px solid',
                borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(15,23,42,0.3)',
                bgcolor: theme.palette.mode === 'dark' ? 'rgba(8,12,20,0.58)' : 'rgba(255,255,255,0.7)',
                color: theme.palette.mode === 'dark' ? '#f8fafc' : '#0f172a',
                backdropFilter: 'blur(6px)',
              }}
            />
          ) : null}

          <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 2, position: 'relative', zIndex: 1 }}>
            {enabledHeroSlides.map((_slide, dotIndex) => {
              const isActive = dotIndex === heroIndex;
              return (
                <Box
                  key={dotIndex}
                  component="button"
                  type="button"
                  onClick={() => transitionToHeroSlide(dotIndex)}
                  disabled={heroTransitionPending}
                  aria-label={`Hero slide ${dotIndex + 1}`}
                  aria-disabled={heroTransitionPending}
                  sx={{
                    width: isActive ? 30 : 10,
                    height: 10,
                    borderRadius: 99,
                    border: 'none',
                    cursor: heroTransitionPending ? 'wait' : 'pointer',
                    p: 0,
                    transform: isActive ? 'scale(1.03)' : 'scale(0.97)',
                    bgcolor: isActive ? 'primary.main' : 'text.disabled',
                    opacity: heroTransitionPending ? 0.5 : (isActive ? 1 : 0.75),
                    transition: 'width 320ms cubic-bezier(0.22, 1, 0.36, 1), background-color 260ms ease, opacity 260ms ease, transform 280ms ease',
                  }}
                />
              );
            })}
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
              display: 'flex',
              flexDirection: 'column',
              border: '1px solid',
              borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(28,39,60,0.24)',
              background: theme.palette.mode === 'dark'
                ? 'rgba(10,12,20,0.72)'
                : 'linear-gradient(170deg, rgba(255,215,190,0.86) 0%, rgba(255,238,214,0.92) 40%, rgba(242,231,214,0.95) 100%)',
              boxShadow: theme.palette.mode === 'dark' ? 'none' : '0 14px 28px rgba(88, 58, 38, 0.12)',
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
                      borderColor: isActive
                        ? 'transparent'
                        : (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.68)'),
                      bgcolor: isActive
                        ? 'primary.main'
                        : (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.56)'),
                      overflow: 'hidden',
                      transformOrigin: 'right center',
                      transform: isActive ? 'scaleX(1)' : 'scaleX(0.92)',
                      transition:
                        'width 420ms cubic-bezier(0.34, 1.56, 0.64, 1), min-width 420ms cubic-bezier(0.34, 1.56, 0.64, 1), transform 420ms cubic-bezier(0.34, 1.56, 0.64, 1), padding 240ms ease',
                      '&:hover': {
                        bgcolor: isActive
                          ? 'primary.dark'
                          : (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.74)'),
                      },
                    }}
                  >
                    {isActive ? (
                      <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', gap: 0.75 }}>
                        <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}>
                          <Typography component="span" sx={{ fontWeight: 700, fontSize: '0.82rem' }}>
                            {tab.label}
                          </Typography>
                          {tab.soon ? (
                            <Typography component="span" variant="caption" sx={{ opacity: 0.72 }}>
                              soon
                            </Typography>
                          ) : null}
                        </Box>

                        <Box
                          onClick={handleScrollActiveHubToTop}
                          sx={{
                            ml: 'auto',
                            width: 26,
                            height: 26,
                            borderRadius: 99,
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'common.white',
                            background: 'rgba(255,255,255,0.16)',
                            border: '1px solid rgba(255,255,255,0.28)',
                            boxShadow: '0 5px 11px rgba(2, 6, 23, 0.28)',
                            opacity: showActiveHubScrollTop ? 1 : 0,
                            transform: showActiveHubScrollTop ? 'translateY(0px) scale(1)' : 'translateY(4px) scale(0.86)',
                            pointerEvents: showActiveHubScrollTop ? 'auto' : 'none',
                            transition: 'opacity 220ms ease, transform 220ms ease, background 200ms ease',
                            '&:hover': {
                              background: 'rgba(255,255,255,0.24)',
                            },
                          }}
                        >
                          <NorthIcon sx={{ fontSize: 17, fontWeight: 900 }} />
                        </Box>
                      </Box>
                    ) : null}
                  </Button>
                );
              })}
            </Stack>

            <Box sx={{ mt: 'auto', pt: 1 }}>
              <Button
                aria-label="LOAD MORE"
                startIcon={<ExpandMoreIcon fontSize="small" />}
                variant="contained"
                onClick={handleLoadMoreFromLeftHub}
                sx={{
                  justifyContent: 'flex-start',
                  borderRadius: 2,
                  width: '100%',
                  height: 42,
                  px: 1.5,
                  color: 'common.white',
                  textTransform: 'none',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  background: 'linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)',
                  boxShadow: '0 8px 16px rgba(37,99,235,0.25)',
                  opacity: showActiveHubLoadMore ? 1 : 0,
                  transform: showActiveHubLoadMore ? 'translateY(0px) scale(1)' : 'translateY(4px) scale(0.9)',
                  pointerEvents: showActiveHubLoadMore ? 'auto' : 'none',
                  transition: 'opacity 220ms ease, transform 220ms ease, background 200ms ease',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #0284c7 0%, #1d4ed8 100%)',
                  },
                }}
              >
                LOAD MORE
              </Button>
            </Box>
          </Paper>

          <Paper
            elevation={0}
            sx={{
              borderRadius: 3,
              border: '1px solid',
              borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(30, 41, 59, 0.26)',
              background: theme.palette.mode === 'dark'
                ? 'rgba(9,11,18,0.72)'
                : 'linear-gradient(168deg, rgba(255,224,198,0.92) 0%, rgba(249,236,216,0.95) 45%, rgba(239,229,213,0.96) 100%)',
              boxShadow: theme.palette.mode === 'dark' ? 'none' : '0 16px 34px rgba(82, 55, 35, 0.14)',
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
              ) : (isGuest && ['my-creations', 'your-page', 'favorite', 'friends-list'].includes(activeHubTab)) ? (
                <GuestHubFiller tabLabel={LEFT_HUB_TABS.find(t => t.key === activeHubTab)?.label} />
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
                              : (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.62)'),
                            boxShadow: isActive ? '0 8px 16px rgba(37,99,235,0.24)' : 'none',
                            transform: isActive ? 'translateY(-0.5px)' : 'translateY(0px)',
                            transition: 'background 260ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 260ms cubic-bezier(0.22, 1, 0.36, 1), color 220ms ease, transform 220ms ease',
                            '&:hover': {
                              background: isActive
                                ? 'linear-gradient(135deg, #0891b2 0%, #1d4ed8 100%)'
                                : theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.82)',
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
                              {visibleOwnedTimelines.map((timeline) => renderTimelineCard(timeline, { allowFavoriteToggle: true }))}
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

                      {showActiveHubLoadMore && !activeHubCanLoadMore && !loadingTimelines && !loadingMyCreationEvents ? (
                        <Box sx={{ py: 2.25, textAlign: 'center' }}>
                          <Typography color="text.secondary">You have reached the end</Typography>
                        </Box>
                      ) : null}

                    </Stack>
                  </Box>
                </Box>
              ) : activeHubTab === 'popular' ? (
                <Box
                  ref={popularScrollRef}
                  onScroll={handlePopularScroll}
                  sx={{ p: { xs: 2, md: 2.5 }, overflowY: 'auto', flex: 1, minHeight: 0 }}
                >
                  <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 0.45 }}>
                    <Typography variant="h6" sx={{ fontWeight: 800 }}>
                      Popular
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={handleRefreshPopular}
                      disabled={loadingPopular}
                      aria-label="Refresh popular feed"
                      sx={{
                        border: '1px solid',
                        borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.22)' : 'rgba(15,23,42,0.2)',
                        bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.62)',
                        '&:hover': {
                          bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.11)' : 'rgba(255,255,255,0.82)',
                        },
                      }}
                    >
                      <RefreshIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                  <Typography color="text.secondary" sx={{ mb: 2.25 }}>
                    Discovery feed ranked by popularity. Personal timelines and private content are excluded.
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
                    {POPULAR_FILTERS.map((filter) => {
                      const isActive = popularFilter === filter.key;
                      return (
                        <Button
                          key={filter.key}
                          size="small"
                          onClick={() => handlePopularFilterChange(filter.key)}
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
                              : (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.62)'),
                            boxShadow: isActive ? '0 8px 16px rgba(37,99,235,0.24)' : 'none',
                            transform: isActive ? 'translateY(-0.5px)' : 'translateY(0px)',
                            transition: 'background 260ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 260ms cubic-bezier(0.22, 1, 0.36, 1), color 220ms ease, transform 220ms ease',
                            '&:hover': {
                              background: isActive
                                ? 'linear-gradient(135deg, #0891b2 0%, #1d4ed8 100%)'
                                : theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.82)',
                              transform: isActive ? 'translateY(-0.5px)' : 'translateY(-1px)',
                            },
                          }}
                        >
                          {filter.label}
                        </Button>
                      );
                    })}
                  </Box>

                  {loadingPopular ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                      <CircularProgress />
                    </Box>
                  ) : popularFilter === 'timelines' ? (
                    <Box>
                      <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 0.8 }}>
                        Popular Timelines ({popularTimelines.length})
                      </Typography>
                      {popularTimelines.length > 0 ? (
                        <Stack spacing={1.5} sx={{ mt: 0.75 }}>
                          {visiblePopularTimelines.map((timeline) => renderTimelineCard(timeline))}
                        </Stack>
                      ) : (
                        <Typography color="text.secondary" sx={{ mt: 0.75 }}>
                          No public timelines with popularity data available yet.
                        </Typography>
                      )}
                    </Box>
                  ) : (
                    <Box>
                      <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 0.8 }}>
                        Popular Posts ({popularEvents.length})
                      </Typography>
                      {popularEvents.length > 0 ? (
                        <Stack spacing={1.5} sx={{ mt: 0.75 }}>
                          {visiblePopularPosts.map((event) => (
                            <Box key={`popular-event-${event.id}`}>
                              {renderSearchEventCard(event)}
                            </Box>
                          ))}
                        </Stack>
                      ) : (
                        <Typography color="text.secondary" sx={{ mt: 0.75 }}>
                          No public posts with votes available yet.
                        </Typography>
                      )}
                    </Box>
                  )}

                  {showActiveHubLoadMore && !activeHubCanLoadMore && !loadingPopular ? (
                    <Box sx={{ py: 2.25, textAlign: 'center' }}>
                      <Typography color="text.secondary">You have reached the end</Typography>
                    </Box>
                  ) : null}
                </Box>
              ) : activeHubTab === 'your-page' ? (
                <Box
                  ref={yourPageScrollRef}
                  onScroll={handleYourPageScroll}
                  sx={{ p: { xs: 2, md: 2.5 }, overflowY: 'auto', flex: 1, minHeight: 0 }}
                >
                  <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 0.45 }}>
                    <Typography variant="h6" sx={{ fontWeight: 800 }}>
                      Your Home Page
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={handleRefreshYourPage}
                      disabled={loadingYourPage}
                      aria-label="Refresh your page feed"
                      sx={{
                        border: '1px solid',
                        borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.22)' : 'rgba(15,23,42,0.2)',
                        bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.62)',
                        '&:hover': {
                          bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.11)' : 'rgba(255,255,255,0.82)',
                        },
                      }}
                    >
                      <RefreshIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                  <Typography color="text.secondary" sx={{ mb: 2.25 }}>
                    Your personalized feed: community posts from memberships, followed-user posts (excluding personal timelines), and followed hashtag posts.
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
                    {YOUR_PAGE_FILTERS.map((filter) => {
                      const isActive = yourPageFilter === filter.key;
                      return (
                        <Button
                          key={filter.key}
                          size="small"
                          onClick={() => handleYourPageFilterChange(filter.key)}
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
                              : (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.62)'),
                            boxShadow: isActive ? '0 8px 16px rgba(37,99,235,0.24)' : 'none',
                            transform: isActive ? 'translateY(-0.5px)' : 'translateY(0px)',
                            transition: 'background 260ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 260ms cubic-bezier(0.22, 1, 0.36, 1), color 220ms ease, transform 220ms ease',
                            '&:hover': {
                              background: isActive
                                ? 'linear-gradient(135deg, #0891b2 0%, #1d4ed8 100%)'
                                : theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.82)',
                              transform: isActive ? 'translateY(-0.5px)' : 'translateY(-1px)',
                            },
                          }}
                        >
                          {filter.label}
                        </Button>
                      );
                    })}
                  </Box>

                  {loadingYourPage ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                      <CircularProgress />
                    </Box>
                  ) : yourPageFilter === 'timelines' ? (
                    <Box>
                      <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 0.8 }}>
                        Your Timelines ({yourPageTimelines.length})
                      </Typography>
                      {yourPageTimelines.length > 0 ? (
                        <Stack spacing={1.5} sx={{ mt: 0.75 }}>
                          {visibleYourPageTimelines.map((timeline) => renderTimelineCard(timeline, { allowFavoriteToggle: true }))}
                        </Stack>
                      ) : (
                        <Typography color="text.secondary" sx={{ mt: 0.75 }}>
                          No timelines found yet. Watch hashtags or join communities to populate this list.
                        </Typography>
                      )}
                    </Box>
                  ) : (
                    <Box>
                      <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 0.8 }}>
                        Your Feed Posts ({yourPageEvents.length})
                      </Typography>
                      {yourPageEvents.length > 0 ? (
                        <Stack spacing={1.5} sx={{ mt: 0.75 }}>
                          {visibleYourPagePosts.map((event) => (
                            <Box key={`your-page-event-${event.id}`}>
                              {renderSearchEventCard(event)}
                            </Box>
                          ))}
                        </Stack>
                      ) : (
                        <Typography color="text.secondary" sx={{ mt: 0.75 }}>
                          No posts available yet. Follow hashtags and users or join communities to build your feed.
                        </Typography>
                      )}
                    </Box>
                  )}

                  {showActiveHubLoadMore && !activeHubCanLoadMore && !loadingYourPage ? (
                    <Box sx={{ py: 2.25, textAlign: 'center' }}>
                      <Typography color="text.secondary">You have reached the end</Typography>
                    </Box>
                  ) : null}
                </Box>
              ) : activeHubTab === 'favorite' ? (
                <Box
                  ref={favoriteScrollRef}
                  onScroll={handleFavoriteScroll}
                  sx={{ p: { xs: 2, md: 2.5 }, overflowY: 'auto', flex: 1, minHeight: 0 }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1.5, mb: 2.1, flexWrap: 'wrap' }}>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 800, mb: 0.45 }}>
                        Favorite Timeline
                      </Typography>
                      <Typography color="text.secondary">
                        This tab is bound to your one selected favorite timeline and its recent posts.
                      </Typography>
                    </Box>
                    {selectedFavoriteTimeline?.id ? (
                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                        <Button
                          variant="contained"
                          onClick={handleOpenFavoritePostDialog}
                          sx={{ whiteSpace: 'nowrap' }}
                        >
                          Create Post
                        </Button>
                        <Button
                          variant="outlined"
                          component="a"
                          href={`/timeline-v3/${selectedFavoriteTimeline.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          sx={{
                            whiteSpace: 'nowrap',
                            borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(15,23,42,0.24)',
                            color: theme.palette.mode === 'dark' ? 'inherit' : 'rgba(15,23,42,0.86)',
                            backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.66)',
                            '&:hover': {
                              borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.42)' : 'rgba(15,23,42,0.3)',
                              backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.86)',
                            },
                          }}
                        >
                          Open Timeline
                        </Button>
                      </Stack>
                    ) : null}
                  </Box>

                  {!favoriteTimelineId ? (
                    <Box sx={{ py: 6, textAlign: 'center' }}>
                      <Typography sx={{ fontWeight: 700, mb: 0.6 }}>
                        No favorite selected yet
                      </Typography>
                      <Typography color="text.secondary">
                        Star a timeline card in My Creations or Your Home Page to populate this tab.
                      </Typography>
                    </Box>
                  ) : (
                    (() => {
                      const timelineType = String(selectedFavoriteTimeline?.timeline_type || 'hashtag').toLowerCase();
                      const timelineName = String(selectedFavoriteTimeline?.name || 'Timeline').trim() || 'Timeline';
                      const titlePrefix = timelineType === 'community'
                        ? 'i-'
                        : (timelineType === 'personal' ? 'My-' : (timelineType === 'hashtag' ? '#' : ''));
                      const prefixedTitle = `${titlePrefix}${timelineName}`;
                      const shareCardLabel = timelineType === 'community'
                        ? 'COMMUNITY'
                        : (timelineType === 'personal' ? 'PERSONAL' : 'HASHTAG');
                      const shareCardImageObjectFit = timelineType === 'community' ? 'cover' : 'contain';
                      const bannerImageUrl = String(
                        selectedFavoriteTimeline?.cover_landscape_image_url
                        || selectedFavoriteTimeline?.coverLandscapeImageUrl
                        || selectedFavoriteTimeline?.cover_image_url
                        || selectedFavoriteTimeline?.banner_url
                        || selectedFavoriteTimeline?.cover_url
                        || selectedFavoriteTimeline?.cover_portrait_image_url
                        || '',
                      ).trim();
                      const tradingCardImageUrl = String(
                        selectedFavoriteTimeline?.cover_portrait_image_url
                        || selectedFavoriteTimeline?.cover_image_url
                        || selectedFavoriteTimeline?.cover_landscape_image_url
                        || '',
                      ).trim();
                      const coverPortraitPosition = {
                        x: Number(selectedFavoriteTimeline?.cover_portrait_x ?? 50),
                        y: Number(selectedFavoriteTimeline?.cover_portrait_y ?? 50),
                      };
                      const coverPortraitZoom = Number(selectedFavoriteTimeline?.cover_portrait_zoom ?? 1);
                      const coverUploadEnabled = selectedFavoriteTimeline?.cover_upload_enabled !== false;
                      const clampFramePosition = (value, fallback = 50) => {
                        const numeric = Number(value);
                        const safe = Number.isFinite(numeric) ? numeric : Number(fallback);
                        return Math.max(-40, Math.min(140, safe));
                      };
                      const clampZoom = (value) => Math.max(1, Math.min(4.875, Number(value) || 1));
                      const getCoverTranslate = (value) => (clampFramePosition(value, 50) - 50) * 0.9;
                      const coverPortraitTransform = `translate(${getCoverTranslate(coverPortraitPosition?.x)}%, ${getCoverTranslate(coverPortraitPosition?.y)}%) scale(${coverUploadEnabled ? clampZoom(coverPortraitZoom) : (clampZoom(coverPortraitZoom) + 0.08)})`;
                      const fallbackGradient = theme.palette.mode === 'dark'
                        ? 'linear-gradient(135deg, rgba(13,36,63,0.86) 0%, rgba(20,48,92,0.9) 40%, rgba(65,34,106,0.86) 100%)'
                        : 'linear-gradient(135deg, rgba(250,232,242,0.94) 0%, rgba(246,232,220,0.96) 68%, rgba(252,238,224,0.98) 100%)';
                      const shareLink = selectedFavoriteTimeline?.id
                        ? `${config.API_URL}/share/timeline/${selectedFavoriteTimeline.id}`
                        : window.location.href;
                      const shareQrUrl = shareLink
                        ? `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(shareLink)}`
                        : '';
                      const statusTitle = String(
                        favoriteTimelineStatusMessage?.title
                        || favoriteTimelineStatusMessage?.header
                        || favoriteTimelineStatusMessage?.status_type
                        || 'Timeline Status',
                      ).trim();
                      const statusBody = favoriteTimelineStatusMessage?.body || '';
                      const statusType = String(favoriteTimelineStatusMessage?.status_type || '').toLowerCase();
                      const statusTone = {
                        ...(STATUS_VARIANT_MAP[statusType] || STATUS_VARIANT_MAP.good),
                        iconNode: ({
                          good: '💚',
                          bad: '⚠️',
                          bronze_action: '🥉',
                          silver_action: '🥈',
                          gold_action: '🥇',
                        })[statusType] || '💚',
                      };
                      const statusActionType = STATUS_ACTION_TYPE_MAP[statusType] || null;
                      const statusActionCard = statusActionType
                        ? (favoriteTimelineActions.find((item) => item?.action_type === statusActionType) || null)
                        : null;
                      const statusActionSchedule = formatActionSchedule(statusActionCard?.due_date);
                      const statusActionProgress = getActionProgressMeta(statusActionCard);

                      return (
                        <Box>
                          <Box
                            sx={{
                              borderRadius: 2,
                              border: '1px solid',
                              borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.16)' : 'rgba(15,23,42,0.12)',
                              overflow: 'hidden',
                              position: 'relative',
                              aspectRatio: { xs: '5 / 1', md: '8 / 1' },
                              mb: 2,
                              background: bannerImageUrl
                                ? 'transparent'
                                : (theme.palette.mode === 'dark'
                                  ? 'linear-gradient(135deg, rgba(13,36,63,0.86) 0%, rgba(20,48,92,0.9) 40%, rgba(65,34,106,0.86) 100%)'
                                  : 'linear-gradient(135deg, rgba(250,232,242,0.94) 0%, rgba(246,232,220,0.96) 68%, rgba(252,238,224,0.98) 100%)'),
                            }}
                          >
                            {bannerImageUrl ? (
                              <Box
                                component="img"
                                src={bannerImageUrl}
                                alt={`${prefixedTitle} banner`}
                                sx={{
                                  position: 'absolute',
                                  inset: 0,
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'cover',
                                }}
                              />
                            ) : null}
                            <Box sx={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(2,6,23,0.06) 0%, rgba(2,6,23,0.42) 100%)' }} />
                            <Box sx={{ position: 'absolute', left: 14, bottom: 10, zIndex: 1 }}>
                              <Typography variant="caption" sx={{ fontWeight: 700, letterSpacing: 0.8 }}>
                                <Box component="span" sx={{ color: '#ffe082' }}>{titlePrefix || ''}</Box>
                                <Box component="span" sx={{ color: '#f8fafc' }}>{timelineName.toUpperCase()}</Box>
                              </Typography>
                            </Box>
                          </Box>

                          <Box sx={{ mb: 2 }}>
                            <QuoteDisplay
                              quote={favoriteTimelineQuote.text}
                              author={favoriteTimelineQuote.author}
                              variant="gold"
                            />
                          </Box>

                          <Box
                            sx={{
                              display: 'grid',
                              gap: 2,
                              gridTemplateColumns: { xs: '1fr', lg: 'minmax(260px, 33%) minmax(0, 1fr)' },
                              alignItems: 'start',
                            }}
                          >
                            <Stack spacing={1.5}>
                              <Box>
                                <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 0.8 }}>
                                  Trading Card
                                </Typography>
                                <TradingCard
                                  onActivate={async () => {
                                    if (!shareLink) return;
                                    try {
                                      if (navigator.clipboard?.writeText) {
                                        await navigator.clipboard.writeText(shareLink);
                                      } else {
                                        throw new Error('Clipboard unavailable');
                                      }
                                      setUserFollowSnackbarMessage('Link Copied!');
                                      setUserFollowSnackbarSeverity('success');
                                      setUserFollowSnackbarOpen(true);
                                    } catch (error) {
                                      setUserFollowSnackbarMessage('Failed to copy link');
                                      setUserFollowSnackbarSeverity('error');
                                      setUserFollowSnackbarOpen(true);
                                    }
                                  }}
                                  frameSx={{
                                    mt: 0.8,
                                    '&:hover .favorite-share-card-overlay': {
                                      opacity: 1,
                                    },
                                  }}
                                  imageUrl={tradingCardImageUrl}
                                  imageAlt={`${prefixedTitle} portrait cover`}
                                  imageSx={{
                                    objectFit: shareCardImageObjectFit,
                                    filter: coverUploadEnabled
                                      ? 'brightness(1.08) saturate(1.08)'
                                      : 'blur(18px) saturate(0.45)',
                                    transform: coverPortraitTransform,
                                  }}
                                  fallbackSx={{ background: fallbackGradient }}
                                  label={shareCardLabel}
                                  title={prefixedTitle}
                                  qrUrl={shareQrUrl}
                                  overlayClassName="favorite-share-card-overlay"
                                  overlayText="Tap to Share"
                                  overlaySx={{ fontSize: '0.72rem' }}
                                />
                              </Box>

                              <Box>
                                <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 0.8 }}>
                                  Status Card
                                </Typography>
                                {loadingFavoriteTimelineContext ? (
                                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 1.8 }}>
                                    <CircularProgress size={20} />
                                  </Box>
                                ) : favoriteTimelineWarningState?.active ? (
                                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.9 }}>
                                    Status card is hidden while warning state is active.
                                  </Typography>
                                ) : favoriteTimelineStatusMessage?.active ? (
                                  <Box
                                    sx={{
                                      mt: 0.8,
                                      borderRadius: 2.4,
                                      overflow: 'hidden',
                                      border: '1px solid',
                                      borderColor: 'rgba(148,163,184,0.4)',
                                      background: statusTone.body,
                                      color: statusTone.text,
                                      boxShadow: '0 10px 24px rgba(15,23,42,0.15)',
                                    }}
                                  >
                                    <Box sx={{ px: 1.6, py: 1.2, background: statusTone.header, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                                        <Typography component="span" sx={{ fontSize: '1rem', lineHeight: 1 }}>
                                          {statusTone.iconNode}
                                        </Typography>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 800, letterSpacing: 0.6 }}>
                                          {statusTone.label}
                                        </Typography>
                                      </Box>
                                      <Typography variant="caption" sx={{ opacity: 0.92 }}>
                                        Timeline Status
                                      </Typography>
                                    </Box>
                                    <Box sx={{ px: 1.6, py: 1.2 }}>
                                      <Typography sx={{ fontWeight: 800, mb: 0.5 }}>
                                        {statusTitle || 'Timeline Status'}
                                      </Typography>
                                      <Typography variant="body2" sx={{ opacity: 0.88 }}>
                                        {statusBody || 'Status card is active, but no body text was provided yet.'}
                                      </Typography>

                                      {statusTone.layout === 'landscape' && statusActionCard ? (
                                        <Box sx={{ mt: 1.1, p: 1, borderRadius: 1.5, border: '1px solid rgba(15,23,42,0.18)', bgcolor: 'rgba(255,255,255,0.45)' }}>
                                          {statusActionSchedule ? (
                                            <Typography variant="caption" sx={{ display: 'block', mb: 0.4, fontWeight: 700 }}>
                                              {statusActionSchedule.dateLabel} · {statusActionSchedule.timeLabel}
                                            </Typography>
                                          ) : null}
                                          {statusActionProgress.label ? (
                                            <>
                                              <Typography variant="caption" sx={{ display: 'block', mb: 0.4, opacity: 0.9 }}>
                                                Progress: {statusActionProgress.label}
                                              </Typography>
                                              <LinearProgress
                                                variant="determinate"
                                                value={Math.round((statusActionProgress.ratio || 0) * 100)}
                                                sx={{
                                                  height: 6,
                                                  borderRadius: 999,
                                                  bgcolor: 'rgba(255,255,255,0.35)',
                                                  '& .MuiLinearProgress-bar': {
                                                    bgcolor: statusTone.text,
                                                  },
                                                }}
                                              />
                                            </>
                                          ) : null}
                                        </Box>
                                      ) : null}
                                    </Box>
                                  </Box>
                                ) : (
                                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.9 }}>
                                    No active timeline status card.
                                  </Typography>
                                )}
                              </Box>

                              <Box>
                                <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 0.8 }}>
                                  Action Cards ({favoriteTimelineActions.length})
                                </Typography>
                                {loadingFavoriteTimelineContext ? (
                                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 1.8 }}>
                                    <CircularProgress size={20} />
                                  </Box>
                                ) : favoriteTimelineActions.length > 0 ? (
                                  <Stack spacing={1.05} sx={{ mt: 0.8 }}>
                                    {favoriteTimelineActions.map((action) => {
                                      const actionType = String(action?.action_type || '').toLowerCase();
                                      const actionSchedule = formatActionSchedule(action?.due_date);
                                      const actionProgress = getActionProgressMeta(action);
                                      const actionLocked = actionProgress.isUnlocked === false;
                                      const actionVoteLoading = favoriteVoteLoadingByType[actionType] === true;
                                      const actionStyles = {
                                        bronze: {
                                          strip: 'linear-gradient(90deg, #cd7f32, #e1a66b, #cd7f32)',
                                          bg: theme.palette.mode === 'dark' ? 'linear-gradient(145deg, #2d2520, #1a1512)' : 'linear-gradient(145deg, #f8f0e8, #e6d0c0)',
                                          edge: theme.palette.mode === 'dark' ? 'rgba(205,127,50,0.22)' : 'rgba(205,127,50,0.35)',
                                          accent: '#cd7f32',
                                          title: 'BRONZE ACTION',
                                        },
                                        silver: {
                                          strip: 'linear-gradient(90deg, #c0c0c0, #e6e6e6, #c0c0c0)',
                                          bg: theme.palette.mode === 'dark' ? 'linear-gradient(145deg, #2d2d32, #1a1a1f)' : 'linear-gradient(145deg, #f8f8fa, #e6e6e9)',
                                          edge: theme.palette.mode === 'dark' ? 'rgba(192,192,192,0.2)' : 'rgba(192,192,192,0.34)',
                                          accent: '#c0c0c0',
                                          title: 'SILVER ACTION',
                                        },
                                        gold: {
                                          strip: 'linear-gradient(90deg, #d4af37, #f5d970, #d4af37)',
                                          bg: theme.palette.mode === 'dark' ? 'linear-gradient(145deg, #2d2a20, #19160f)' : 'linear-gradient(145deg, #f8f3e6, #eadcb0)',
                                          edge: theme.palette.mode === 'dark' ? 'rgba(212,175,55,0.24)' : 'rgba(212,175,55,0.38)',
                                          accent: '#d4af37',
                                          title: 'GOLD ACTION',
                                        },
                                      }[actionType] || {
                                        strip: 'linear-gradient(90deg, #64748b, #94a3b8, #64748b)',
                                        bg: theme.palette.mode === 'dark' ? 'linear-gradient(145deg, #1f2937, #111827)' : 'linear-gradient(145deg, #f1f5f9, #e2e8f0)',
                                        edge: theme.palette.mode === 'dark' ? 'rgba(148,163,184,0.22)' : 'rgba(100,116,139,0.3)',
                                        accent: '#64748b',
                                        title: String(actionType || 'ACTION').toUpperCase(),
                                      };

                                      return (
                                        <Box
                                          key={`favorite-action-${action.id || action.action_type}`}
                                          sx={{
                                            position: 'relative',
                                            borderRadius: 2,
                                            background: actionStyles.bg,
                                            boxShadow: theme.palette.mode === 'dark'
                                              ? `0 8px 16px rgba(0,0,0,0.35), 0 0 0 1px ${actionStyles.edge}`
                                              : `0 8px 16px rgba(0,0,0,0.1), 0 0 0 1px ${actionStyles.edge}`,
                                            overflow: 'hidden',
                                            '&::before': {
                                              content: '""',
                                              position: 'absolute',
                                              top: 0,
                                              left: 0,
                                              right: 0,
                                              height: '3px',
                                              background: actionStyles.strip,
                                            },
                                          }}
                                        >
                                          <Box sx={{ p: 1.15, pt: 1.35 }}>
                                            {actionLocked ? (
                                              <Box
                                                sx={{
                                                  position: 'absolute',
                                                  top: 0,
                                                  left: 0,
                                                  right: 0,
                                                  bottom: 0,
                                                  backgroundColor: 'rgba(0, 0, 0, 0.72)',
                                                  backdropFilter: 'blur(10px)',
                                                  display: 'flex',
                                                  flexDirection: 'column',
                                                  justifyContent: 'center',
                                                  alignItems: 'center',
                                                  zIndex: 10,
                                                  p: 2,
                                                  textAlign: 'center',
                                                }}
                                              >
                                                <Typography variant="body2" sx={{ color: '#fff', mb: 0.8, fontWeight: 700 }}>
                                                  {actionStyles.title} Locked
                                                </Typography>
                                                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.85)', mb: 1 }}>
                                                  {actionProgress.label || 'Help unlock this action by contributing progress.'}
                                                </Typography>
                                                <Box sx={{ width: '100%', maxWidth: 220, mb: 1.5 }}>
                                                  <LinearProgress
                                                    variant="determinate"
                                                    value={Math.round((actionProgress.ratio || 0) * 100)}
                                                    sx={{
                                                      height: 7,
                                                      borderRadius: 999,
                                                      bgcolor: 'rgba(255,255,255,0.2)',
                                                      '& .MuiLinearProgress-bar': {
                                                        bgcolor: actionStyles.accent,
                                                      },
                                                    }}
                                                  />
                                                </Box>
                                                {canVoteForAction(action) ? (
                                                  <Button
                                                    size="small"
                                                    variant={action?.progress?.user_voted ? 'outlined' : 'contained'}
                                                    onClick={() => handleFavoriteActionVote(actionType)}
                                                    disabled={actionVoteLoading || !!action?.progress?.user_voted}
                                                    sx={{
                                                      color: '#fff',
                                                      borderColor: alpha(actionStyles.accent, 0.8),
                                                      bgcolor: action?.progress?.user_voted
                                                        ? 'transparent'
                                                        : alpha(actionStyles.accent, 0.25),
                                                    }}
                                                  >
                                                    {action?.progress?.user_voted
                                                      ? 'Vote Counted'
                                                      : (actionVoteLoading ? 'Voting...' : 'Count me in!')}
                                                  </Button>
                                                ) : null}
                                              </Box>
                                            ) : null}
                                            <Typography variant="caption" sx={{ textTransform: 'uppercase', fontWeight: 800, letterSpacing: 0.6, color: actionStyles.accent }}>
                                              {actionStyles.title}
                                            </Typography>
                                            <Typography sx={{ fontWeight: 700, lineHeight: 1.25, mt: 0.3 }}>
                                              {action.title || 'Untitled action'}
                                            </Typography>
                                            {action.description ? (
                                              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.45 }}>
                                                {action.description}
                                              </Typography>
                                            ) : null}
                                            {actionSchedule ? (
                                              <Typography variant="caption" sx={{ display: 'block', mt: 0.6, opacity: 0.8 }}>
                                                Day of Action: {actionSchedule.dateLabel} · {actionSchedule.timeLabel}
                                              </Typography>
                                            ) : null}
                                            {actionProgress.label ? (
                                              <Box sx={{ mt: 0.6 }}>
                                                <Typography variant="caption" sx={{ display: 'block', mb: 0.4, opacity: 0.85 }}>
                                                  Progress: {actionProgress.label}
                                                </Typography>
                                                <LinearProgress
                                                  variant="determinate"
                                                  value={Math.round((actionProgress.ratio || 0) * 100)}
                                                  sx={{
                                                    height: 6,
                                                    borderRadius: 999,
                                                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.16)' : 'rgba(0,0,0,0.1)',
                                                    '& .MuiLinearProgress-bar': {
                                                      bgcolor: actionStyles.accent,
                                                    },
                                                  }}
                                                />
                                              </Box>
                                            ) : null}
                                          </Box>
                                        </Box>
                                      );
                                    })}
                                  </Stack>
                                ) : (
                                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.9 }}>
                                    No action cards configured for this timeline.
                                  </Typography>
                                )}
                              </Box>

                              {favoriteTimelineWarningState?.active ? (
                                <Alert severity="warning">
                                  {favoriteTimelineWarningState.title || favoriteTimelineWarningState.body || 'Warning state is active for this timeline.'}
                                </Alert>
                              ) : null}
                            </Stack>

                            <Box>
                              <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 0.8 }}>
                                Favorite Timeline Feed ({favoriteTimelineEvents.length})
                              </Typography>
                              {loadingFavoriteTimelineEvents ? (
                                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                                  <CircularProgress size={22} />
                                </Box>
                              ) : favoriteTimelineEvents.length > 0 ? (
                                <Stack spacing={1.5} sx={{ mt: 0.75 }}>
                                  {visibleFavoritePosts.map((event) => (
                                    <Box key={`favorite-event-${event.id}`}>
                                      {renderSearchEventCard(event)}
                                    </Box>
                                  ))}
                                </Stack>
                              ) : (
                                <Typography color="text.secondary" sx={{ mt: 0.75 }}>
                                  No posts found yet for this timeline.
                                </Typography>
                              )}

                              {showActiveHubLoadMore && !activeHubCanLoadMore && !loadingFavoriteTimelineEvents && favoriteTimelineEvents.length > 0 ? (
                                <Box sx={{ py: 2.25, textAlign: 'center' }}>
                                  <Typography color="text.secondary">You have reached the end</Typography>
                                </Box>
                              ) : null}
                            </Box>
                          </Box>
                        </Box>
                      );
                    })()
                  )}
                </Box>
              ) : activeHubTab === 'friends-list' ? (
                <Box
                  ref={friendsListScrollRef}
                  onScroll={handleFriendsListScroll}
                  sx={{ p: { xs: 2, md: 2.5 }, overflowY: 'auto', flex: 1, minHeight: 0 }}
                >
                  <Typography variant="h6" sx={{ fontWeight: 800, mb: 0.75 }}>
                    Friends List
                  </Typography>
                  <Typography color="text.secondary" sx={{ mb: 2.25 }}>
                    View both sides of your current follow graph.
                  </Typography>

                  <Alert severity="info" sx={{ mb: 1.6 }}>
                    Privacy note: when your profile is set to Private, users you follow are allowed to view it.
                  </Alert>

                  <Stack direction="row" spacing={0.75} sx={{ flexWrap: 'wrap', mb: 2.1 }}>
                    {FRIENDS_LIST_FILTERS.map((filter) => {
                      const isActive = friendsListFilter === filter.key;
                      const tally = filter.key === 'followers' ? followerUsers.length : followedUsers.length;
                      return (
                        <Button
                          key={filter.key}
                          size="small"
                          onClick={() => setFriendsListFilter(filter.key)}
                          sx={{
                            textTransform: 'none',
                            borderRadius: 1.5,
                            fontWeight: 700,
                            px: 1.25,
                            border: '1px solid',
                            borderColor: isActive
                              ? 'primary.main'
                              : (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(17,24,39,0.2)'),
                            backgroundColor: isActive
                              ? (theme.palette.mode === 'dark' ? 'rgba(30,64,175,0.32)' : 'rgba(59,130,246,0.16)')
                              : 'transparent',
                            color: isActive ? 'primary.main' : 'text.secondary',
                          }}
                        >
                          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.7 }}>
                            <span>{filter.label}</span>
                            <Chip
                              size="small"
                              label={`🔥 ${tally}`}
                              sx={{
                                height: 22,
                                fontWeight: 700,
                                borderRadius: 999,
                                backgroundColor: theme.palette.mode === 'dark' ? 'rgba(244, 114, 34, 0.26)' : 'rgba(251, 146, 60, 0.2)',
                              }}
                            />
                          </Box>
                        </Button>
                      );
                    })}
                  </Stack>

                  {activeFriendsLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                      <CircularProgress />
                    </Box>
                  ) : activeFriendsUsers.length > 0 ? (
                    <Stack spacing={1.25} sx={{ pl: { xs: 3, sm: 4 }, pt: { xs: 1.6, sm: 2.1 } }}>
                      {activeFriendsUsers.map((profileUser) => renderUserProfileCard(profileUser))}
                    </Stack>
                  ) : (
                    <Box sx={{ py: 6, textAlign: 'center' }}>
                      <Typography color="text.secondary">
                        {isFollowersFriendsListFilter
                          ? 'No one follows you yet.'
                          : 'You are not following anyone yet. Use Search → Users and tap Follow.'}
                      </Typography>
                    </Box>
                  )}
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
                                  {visibleUsers.map((profileUser) => renderUserProfileCard(profileUser))}
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

                        {showActiveHubLoadMore && !activeHubCanLoadMore && !loadingTimelines && !loadingSearchEvents && !loadingSearchUsers && hasSearchQuery ? (
                          <Box sx={{ py: 2.25, textAlign: 'center' }}>
                            <Typography color="text.secondary">You have reached the end</Typography>
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

        <Dialog
          open={postTypeDialogOpen}
          onClose={handleCloseMakePostDialog}
          maxWidth="xs"
          fullWidth
          PaperProps={{ sx: getGlassDialogPaperSx(theme) }}
        >
          <DialogTitle sx={{ pb: 1 }}>Make a Post</DialogTitle>
          <DialogContent sx={{ pt: '10px !important' }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
              Choose where this post should be created.
            </Typography>

            <Stack spacing={1.15}>
              <Button
                variant="contained"
                onClick={() => handleSelectPostVisibility('public')}
                disabled={postFlowLoading}
                sx={{ justifyContent: 'space-between', px: 1.5, py: 1.1 }}
              >
                <Box sx={{ textAlign: 'left' }}>
                  <Typography variant="button" sx={{ display: 'block', lineHeight: 1.1 }}>Public Post</Typography>
                  <Typography variant="caption" sx={{ opacity: 0.86 }}>
                    Uses your #{String(user?.username || '').trim().toUpperCase()} timeline.
                  </Typography>
                </Box>
              </Button>

              <Button
                variant="outlined"
                onClick={() => handleSelectPostVisibility('private')}
                disabled={postFlowLoading}
                sx={{ justifyContent: 'space-between', px: 1.5, py: 1.1 }}
              >
                <Box sx={{ textAlign: 'left' }}>
                  <Typography variant="button" sx={{ display: 'block', lineHeight: 1.1 }}>Private Post</Typography>
                  <Typography variant="caption" sx={{ opacity: 0.86 }}>
                    Uses your My-{String(user?.username || '').trim().toUpperCase()} personal timeline.
                  </Typography>
                </Box>
              </Button>

              <Button
                variant="text"
                onClick={() => setPostAdvancedOpen((prev) => !prev)}
                disabled={postFlowLoading}
                endIcon={<ExpandMoreIcon sx={{ transform: postAdvancedOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 180ms ease' }} />}
                sx={{ mt: 0.2, justifyContent: 'space-between', textTransform: 'none', fontWeight: 700 }}
              >
                Advanced Search
              </Button>

              {postAdvancedOpen ? (
                <Paper
                  variant="outlined"
                  sx={{
                    p: 1.2,
                    borderRadius: 2,
                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(11,16,27,0.7)' : 'rgba(255,250,241,0.86)',
                    borderColor: theme.palette.mode === 'dark' ? alpha('#cbd5e1', 0.2) : alpha('#0f172a', 0.16),
                    backdropFilter: 'blur(6px)',
                  }}
                >
                  <TextField
                    size="small"
                    fullWidth
                    placeholder="Search followed timelines..."
                    value={postTimelineSearchInput}
                    onChange={(event) => setPostTimelineSearchInput(event.target.value)}
                    sx={{ mb: 1, ...getGlassInputSx(theme) }}
                  />

                  <Box sx={{ maxHeight: 210, overflowY: 'auto', pr: 0.2 }}>
                    {loadingYourPage ? (
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ py: 1.5, px: 0.6 }}>
                        <CircularProgress size={16} />
                        <Typography variant="body2" color="text.secondary">Loading followed timelines...</Typography>
                      </Stack>
                    ) : advancedPostTimelineOptions.length ? (
                      <Stack spacing={0.6}>
                        <Box
                          sx={{
                            display: 'grid',
                            gridTemplateColumns: '52px minmax(0, 1fr) 90px',
                            alignItems: 'center',
                            px: 0.8,
                            pb: 0.3,
                          }}
                        >
                          <Typography variant="caption" sx={{ fontWeight: 800, letterSpacing: 0.4, opacity: 0.75 }}>
                            Prefix
                          </Typography>
                          <Typography variant="caption" sx={{ fontWeight: 800, letterSpacing: 0.4, opacity: 0.75 }}>
                            Timeline
                          </Typography>
                          <Typography variant="caption" sx={{ fontWeight: 800, letterSpacing: 0.4, opacity: 0.75, textAlign: 'right' }}>
                            Type
                          </Typography>
                        </Box>
                        {advancedPostTimelineOptions.map((timeline) => (
                          <Button
                            key={`advanced-post-${timeline.id}`}
                            variant="text"
                            onClick={() => handleSelectAdvancedTimeline(timeline)}
                            sx={{
                              justifyContent: 'flex-start',
                              textTransform: 'none',
                              py: 0.7,
                              px: 0.7,
                              borderRadius: 1.3,
                              border: '1px solid',
                              borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(30,41,59,0.16)',
                              '&:hover': {
                                bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(251,241,223,0.72)',
                              },
                            }}
                          >
                            <Box sx={{ width: 52, fontFamily: 'monospace', fontWeight: 800, opacity: 0.86, textAlign: 'left' }}>
                              {timeline.prefix}
                            </Box>
                            <Typography variant="body2" sx={{ flex: 1, minWidth: 0, fontWeight: 700, textAlign: 'left' }}>
                              {timeline.baseName}
                            </Typography>
                            <Typography variant="caption" sx={{ ml: 1, fontWeight: 700, opacity: 0.8, textAlign: 'right' }}>
                              {timeline.timeline_type_label}
                            </Typography>
                          </Button>
                        ))}
                      </Stack>
                    ) : (
                      <Typography variant="body2" color="text.secondary" sx={{ py: 1.2, px: 0.6 }}>
                        No followed timelines available for posting.
                      </Typography>
                    )}
                  </Box>
                </Paper>
              ) : null}
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.4, pt: 0.4 }}>
            <Button onClick={handleCloseMakePostDialog} disabled={postFlowLoading}>Cancel</Button>
          </DialogActions>
        </Dialog>

        <EventDialog
          open={postEventDialogOpen}
          onClose={handleClosePostEventDialog}
          onSave={handleSubmitHomeEvent}
          timelineName={postTargetTimeline?.name || ''}
          timelineType={postTargetTimeline?.timeline_type || 'hashtag'}
          timelineVisibility={postTargetTimeline?.visibility || 'public'}
          submitLabel="Post"
          submitLoading={postSubmitLoading}
          submitDisabled={postSubmitLoading}
        />

        {heroEventPopupEvent ? (
          <EventPopup
            event={heroEventPopupEvent}
            open
            onClose={() => setHeroEventPopupEvent(null)}
            onDelete={() => {}}
            onEdit={() => {}}
            setIsPopupOpen={() => {}}
            reviewingEventIds={EMPTY_REVIEWING_EVENT_IDS}
          />
        ) : null}

        <Dialog
          open={dialogOpen}
          onClose={handleDialogClose}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: getGlassDialogPaperSx(theme),
          }}
        >
          <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1.1 }}>
            Create New Timeline
            <IconButton onClick={handleDialogClose} size="small"><CloseIcon /></IconButton>
          </DialogTitle>
          <DialogContent sx={{ pt: 0.4 }}>
            <FormControl component="fieldset">
              <FormLabel component="legend" sx={{ mb: 0.8, color: theme.palette.text.secondary }}>
                Timeline Type
              </FormLabel>
              <RadioGroup
                row
                name="timeline_type"
                value={formData.timeline_type}
                onChange={handleInputChange}
                sx={{ display: 'none' }}
              >
                <FormControlLabel value="community" control={<Radio />} label="Community Timeline" />
                <FormControlLabel value="personal" control={<Radio />} label="Personal Timeline" />
              </RadioGroup>

              <Stack spacing={1.2} sx={{ mt: 0.8 }}>
                {CREATE_TIMELINE_TYPE_OPTIONS.map((option) => {
                  const isSelected = formData.timeline_type === option.key;
                  const isCondensed = hasSelectedTimelineType && !isSelected;

                  return (
                    <Box
                      key={option.key}
                      onClick={() => {
                        handleInputChange({ target: { name: 'timeline_type', value: option.key } });
                      }}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          handleInputChange({ target: { name: 'timeline_type', value: option.key } });
                        }
                      }}
                      sx={{
                        borderRadius: 2.2,
                        p: isCondensed ? 1 : 1.4,
                        border: '1px solid',
                        borderColor: isSelected
                          ? (theme.palette.mode === 'dark' ? alpha('#7dd3fc', 0.7) : alpha('#0369a1', 0.5))
                          : (theme.palette.mode === 'dark' ? alpha('#ffffff', 0.16) : alpha('#0f172a', 0.14)),
                        background: isSelected
                          ? (theme.palette.mode === 'dark'
                            ? `linear-gradient(135deg, ${alpha('#0ea5e9', 0.28)} 0%, ${alpha('#0369a1', 0.12)} 100%)`
                            : `linear-gradient(135deg, ${alpha('#e0f2fe', 0.92)} 0%, ${alpha('#f0f9ff', 0.95)} 100%)`)
                          : (theme.palette.mode === 'dark'
                            ? `linear-gradient(135deg, ${alpha('#0b1220', 0.72)} 0%, ${alpha('#111827', 0.56)} 100%)`
                            : `linear-gradient(135deg, ${alpha('#ffffff', 0.95)} 0%, ${alpha('#f8fafc', 0.9)} 100%)`),
                        boxShadow: isSelected
                          ? (theme.palette.mode === 'dark'
                            ? '0 10px 24px rgba(14, 165, 233, 0.24)'
                            : '0 10px 24px rgba(14, 116, 144, 0.14)')
                          : 'none',
                        cursor: 'pointer',
                        transform: isCondensed ? 'scale(0.98)' : 'scale(1)',
                        transition: 'border-color 200ms ease, background 220ms ease, box-shadow 220ms ease, transform 180ms ease',
                        '&:hover': {
                          transform: 'translateY(-1px)',
                          borderColor: theme.palette.mode === 'dark' ? alpha('#bae6fd', 0.62) : alpha('#0284c7', 0.4),
                        },
                      }}
                    >
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.8 }}>
                        <Avatar
                          sx={{
                            width: 34,
                            height: 34,
                            bgcolor: isSelected
                              ? (theme.palette.mode === 'dark' ? alpha('#0284c7', 0.48) : alpha('#0ea5e9', 0.22))
                              : (theme.palette.mode === 'dark' ? alpha('#1f2937', 0.8) : alpha('#e2e8f0', 0.9)),
                            color: theme.palette.mode === 'dark' ? '#e2e8f0' : '#0f172a',
                          }}
                        >
                          {option.key === 'personal'
                            ? <PersonalTimelineChoiceIcon />
                            : <GroupsIcon sx={{ fontSize: 20 }} />}
                        </Avatar>
                        <Box sx={{ minWidth: 0, flex: 1 }}>
                          <Typography sx={{ fontWeight: 800, lineHeight: 1.1 }}>{option.label}</Typography>
                          {!isCondensed && (
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.15 }}>
                              {option.helper}
                            </Typography>
                          )}
                          {isCondensed && (
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.15 }}>
                              Tap to switch
                            </Typography>
                          )}
                        </Box>
                        <Chip
                          size="small"
                          label={option.tag}
                          sx={{
                            fontWeight: 800,
                            letterSpacing: '0.04em',
                            borderRadius: '999px',
                            bgcolor: isSelected
                              ? (theme.palette.mode === 'dark' ? alpha('#7dd3fc', 0.22) : alpha('#bae6fd', 0.86))
                              : (theme.palette.mode === 'dark' ? alpha('#334155', 0.66) : alpha('#e2e8f0', 0.9)),
                            color: theme.palette.mode === 'dark' ? '#e2e8f0' : '#0f172a',
                          }}
                        />
                      </Stack>

                      {!isCondensed && (
                        <>
                          <Typography variant="body2" sx={{ mb: 0.85, color: theme.palette.text.secondary }}>
                            {option.description}
                          </Typography>

                          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                            <Chip
                              size="small"
                              icon={<TagIcon sx={{ fontSize: '0.95rem !important' }} />}
                              label={`Prefix ${option.prefix}`}
                              sx={{ borderRadius: '999px' }}
                            />
                            <Chip
                              size="small"
                              label={`${option.prefix}YourTimelineName`}
                              sx={{ borderRadius: '999px', fontFamily: 'monospace' }}
                            />
                          </Stack>
                        </>
                      )}
                    </Box>
                  );
                })}
              </Stack>
            </FormControl>

            {hasSelectedTimelineType && (
              <Box sx={{ mt: 2.2 }}>
                <TextField
                  autoFocus
                  name="name"
                  label="Timeline Name"
                  placeholder="Enter a name for your timeline"
                  fullWidth
                  value={formData.name}
                  onChange={handleInputChange}
                  sx={{ mb: 2.2, ...getGlassInputSx(theme) }}
                />
                <TextField
                  name="description"
                  label="Description"
                  placeholder="Describe what this timeline is about"
                  fullWidth
                  multiline
                  rows={3}
                  value={formData.description}
                  onChange={handleInputChange}
                  sx={getGlassInputSx(theme)}
                />
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.4, pt: 1 }}>
            <Button
              onClick={handleDialogClose}
              disabled={loading}
              variant="contained"
              sx={getGlassSquareActionButtonSx(theme)}
            >
              <CloseIcon fontSize="small" />
            </Button>
            <Button
              onClick={handleCreateTimeline}
              variant="outlined"
              endIcon={<ArrowForwardIcon sx={{ fontSize: 18 }} />}
              disabled={loading || !hasSelectedTimelineType}
              sx={getGlassPillActionButtonSx(theme)}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Create Timeline'}
            </Button>
          </DialogActions>
        </Dialog>

        <Snackbar
          open={userFollowSnackbarOpen}
          autoHideDuration={2800}
          onClose={() => setUserFollowSnackbarOpen(false)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert
            onClose={() => setUserFollowSnackbarOpen(false)}
            severity={userFollowSnackbarSeverity}
            sx={{ width: '100%' }}
          >
            {userFollowSnackbarMessage}
          </Alert>
        </Snackbar>
      </Box>
    </>
  );
};

export default HomePage;
