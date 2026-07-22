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
  GlobalStyles,
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
  StarBorder as StarBorderIcon,
  Refresh as RefreshIcon,
  HowToVote as HowToVoteIcon,
  Add as AddIcon,
  FlagOutlined as FlagOutlinedIcon,
  Settings as GearIcon,
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
  followTimeline,
  unfollowTimeline,
} from '../utils/api';
import config from '../config';
import { EVENT_TYPES } from './timeline-v3/events/EventTypes';
import EventCard from './timeline-v3/events/cards/EventCard';
import QuoteDisplay from './timeline-v3/community/QuoteDisplay';
import { STATUS_ACTION_TYPE_MAP, STATUS_VARIANT_MAP, formatActionSchedule, getActionProgressMeta, canVoteForAction } from './timeline-v3/community/timelineStatusActionUtils';
import TradingCard from './common/TradingCard';
import TimelineCard from './common/TimelineCard';
import EventDialog from './timeline-v3/events/EventDialog';
import ActionCard from './timeline-v3/community/ActionCard';
import EventPopup from './timeline-v3/events/EventPopup';
import UserCard from './common/UserCard';
import UserAvatar from './common/UserAvatar';
import RichContentRenderer from './timeline-v3/events/RichContentRenderer';
import NavFab, { TimelineMarkerIcon } from './timeline-v3/community/NavFab';
import EventIcon from '@mui/icons-material/Event';
import { getTimelineSurfaceTheme } from './timeline-v3/timelineSurfaceTheme';
import { TimelineHeroBanner } from './timeline-v3/TimelineHeroBanner';
import {
  getGlassDialogPaperSx,
  getGlassInputSx,
  getGlassPillActionButtonSx,
  getGlassSquareActionButtonSx,
} from '../utils/formStyleGuide';

import { displayUsername, usernameMatchesQuery } from '../utils/usernameDisplay';
import GuestHubFiller from './shared/GuestHubFiller';
import { motion, AnimatePresence } from 'framer-motion';
import LoadingScreen from './LoadingScreen';

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
const HOME_CACHE_TTL_MS = 600000; // 10 minutes
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
const HOME_TIMELINE_CARD_SECTIONS = {
  cover: true,
  typeChip: true,
  audience: true,
  description: true,
  createdDate: true,
  favoriteToggle: true,
  openAction: true,
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
  || timeline?.coverLandscapeImageUrl
  || timeline?.cover_landscape_url
  || timeline?.coverLandscapeUrl
  || timeline?.landscape_image_url
  || timeline?.landscapeImageUrl
  || timeline?.banner_url
  || timeline?.bannerUrl
  || timeline?.cover_image_url
  || timeline?.coverImageUrl
  || timeline?.cover_portrait_image_url
  || timeline?.coverPortraitImageUrl
  || timeline?.cover_portrait_url
  || timeline?.coverPortraitUrl
  || timeline?.cover_url
  || timeline?.coverUrl
  || timeline?.background_image_url
  || timeline?.backgroundImageUrl
  || timeline?.image_url
  || timeline?.imageUrl
  || timeline?.thumbnail_url
  || timeline?.thumbnailUrl
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
  { key: 'explore', label: 'EXPLORE', mode: 'explore' },
  { key: 'communities', label: 'COMMUNITIES', mode: 'community' },
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

let isInitialAppLoadComplete = false;

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
  const lastBlurTimeRef = React.useRef(0);
  const hasRefreshedPopularRef = React.useRef(false);
  const hasRefreshedYourPageRef = React.useRef(false);

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
      logError('Error clearing Popular cache', error);
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
      logError('Error clearing Your Page cache', error);
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
  const [hasLoadedSearchEvents, setHasLoadedSearchEvents] = React.useState(false);
  const [hasLoadedMyCreationEvents, setHasLoadedMyCreationEvents] = React.useState(false);
  // Owned timelines — fetched lazily from /me/timelines/created, independent of public list
  const [ownedTimelinesServer, setOwnedTimelinesServer] = React.useState([]);
  const [loadingOwnedTimelines, setLoadingOwnedTimelines] = React.useState(false);
  const [hasLoadedOwnedTimelines, setHasLoadedOwnedTimelines] = React.useState(false);
  const [loadingTimelines, setLoadingTimelines] = React.useState(true);
  const [heroIndex, setHeroIndex] = React.useState(0);
  const [heroTransitionPending, setHeroTransitionPending] = React.useState(false);
  const [heroRotateMs, setHeroRotateMs] = React.useState(HOME_HERO_DEFAULT_ROTATE_MS);
  const [heroSlides, setHeroSlides] = React.useState(HOME_HERO_DEFAULT_SLIDES);
  const [isHeroContentVisible, setIsHeroContentVisible] = React.useState(true);
  const [isHeroMinimized, setIsHeroMinimized] = React.useState(() => {
    try {
      return window.localStorage.getItem('home_hero_minimized_state') === 'true';
    } catch (_) {
      return false;
    }
  });
  const [heroVisualPhase, setHeroVisualPhase] = React.useState(isHeroMinimized ? 'minimized' : 'expanded');

  React.useEffect(() => {
    if (isHeroMinimized) {
      if (heroVisualPhase === 'expanded' || heroVisualPhase === 'opening_curtains') {
        setHeroVisualPhase('closing_curtains');
      } else if (heroVisualPhase === 'expanding') {
        setHeroVisualPhase('shrinking');
      }
    } else {
      if (heroVisualPhase === 'minimized' || heroVisualPhase === 'shrinking') {
        setHeroVisualPhase('expanding');
      } else if (heroVisualPhase === 'closing_curtains') {
        setHeroVisualPhase('opening_curtains');
      }
    }
  }, [isHeroMinimized, heroVisualPhase]);
  const isTransitioningRef = React.useRef(false);
  const [activeHubTab, setActiveHubTab] = React.useState('popular');
  const [isHubLabelVisible, setIsHubLabelVisible] = React.useState(true); // Control visibility of active tab label on mobile
  const hubLabelTimeoutRef = React.useRef(null);
  const [isHubContentVisible, setIsHubContentVisible] = React.useState(true);
  const [isHubPhaseOneLoading, setIsHubPhaseOneLoading] = React.useState(false);
  const [showActiveHubScrollTop, setShowActiveHubScrollTop] = React.useState(false);
  const [showActiveHubLoadMore, setShowActiveHubLoadMore] = React.useState(false);
  const [isMyCreationsSubTabPhaseOneLoading, setIsMyCreationsSubTabPhaseOneLoading] = React.useState(false);
  const [searchSubFilter, setSearchSubFilter] = React.useState('explore');
  const [popularFilter, setPopularFilter] = React.useState('posts');
  const [myCreationsFilter, setMyCreationsFilter] = React.useState('posts');
  const [yourPageFilter, setYourPageFilter] = React.useState('posts');
  const [isFabExpanded, setIsFabExpanded] = React.useState(() => {
    try {
      const saved = window.localStorage.getItem('itimeline_hub_fab_expanded');
      return saved === 'true';
    } catch (e) {
      return false;
    }
  });

  React.useEffect(() => {
    try {
      window.localStorage.setItem('itimeline_hub_fab_expanded', String(isFabExpanded));
    } catch (e) {
      logError('Error saving Fab expansion state', e);
    }
  }, [isFabExpanded]);

  const [friendsListFilter, setFriendsListFilter] = React.useState('following');
  const [timelineSearchInput, setTimelineSearchInput] = React.useState('');
  const [timelineSearch, setTimelineSearch] = React.useState('');
  const [exploreDossier, setExploreDossier] = React.useState(null);
  const [trendingTags, setTrendingTags] = React.useState([]);
  const [loadingExplore, setLoadingExplore] = React.useState(false);
  const [loadingTrending, setLoadingTrending] = React.useState(false);
  const [isSearchSubmitting, setIsSearchSubmitting] = React.useState(false);
  const [isSearchResultsVisible, setIsSearchResultsVisible] = React.useState(true);
  const [isSearchLoadingVisual, setIsSearchLoadingVisual] = React.useState(false);
  const [userFollowSnackbarOpen, setUserFollowSnackbarOpen] = React.useState(false);
  const [userFollowSnackbarMessage, setUserFollowSnackbarMessage] = React.useState('');
  const [userFollowSnackbarSeverity, setUserFollowSnackbarSeverity] = React.useState('success');
  const [timelineCreateError, setTimelineCreateError] = React.useState(false);
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
  const [followedHashtagIds, setFollowedHashtagIds] = React.useState(new Set());

  React.useEffect(() => {
    if (Array.isArray(yourPageTimelines)) {
      const ids = new Set(
        yourPageTimelines
          .filter((t) => String(t?.timeline_type || '').toLowerCase() === 'hashtag')
          .map((t) => Number(t?.id || 0))
          .filter((id) => id > 0)
      );
      setFollowedHashtagIds(ids);
    }
  }, [yourPageTimelines]);

  const [yourPageEvents, setYourPageEvents] = React.useState([]);
  const [loadingYourPage, setLoadingYourPage] = React.useState(false);
  const [hasLoadedYourPage, setHasLoadedYourPage] = React.useState(false);
  const [hasBootstrappedYourPageCache, setHasBootstrappedYourPageCache] = React.useState(false);
  const [favoriteTimelineId, setFavoriteTimelineId] = React.useState(undefined);
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
  const [hasLoadedFavoriteEvents, setHasLoadedFavoriteEvents] = React.useState(false);
  const [hasLoadedFavoriteContext, setHasLoadedFavoriteContext] = React.useState(false);
  const [favoriteVoteLoadingByType, setFavoriteVoteLoadingByType] = React.useState({ bronze: false, silver: false, gold: false });
  const [heroEventPopupEvent, setHeroEventPopupEvent] = React.useState(null);
  const [heroEventPopupLoading, setHeroEventPopupLoading] = React.useState(false);
  const [topVotesTodayEvent, setTopVotesTodayEvent] = React.useState(null);
  const [topVotesTodayLoading, setTopVotesTodayLoading] = React.useState(false);
  const [prefetchedSpotlightEvent, setPrefetchedSpotlightEvent] = React.useState(null);
  const [randomEvent, setRandomEvent] = React.useState(null);
  const [randomEventLoading, setRandomEventLoading] = React.useState(false);
  const [prefetchedRandomEvent, setPrefetchedRandomEvent] = React.useState(null);
  const [postTypeDialogOpen, setPostTypeDialogOpen] = React.useState(false);
  const [postEventDialogOpen, setPostEventDialogOpen] = React.useState(false);
  const [editDialogOpen, setEditDialogOpen] = React.useState(false);
  const [editingEvent, setEditingEvent] = React.useState(null);
  const [editSubmitLoading, setEditSubmitLoading] = React.useState(false);
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

  const [pageLoading, setPageLoading] = React.useState(false);
  const [isRefreshDone, setIsRefreshDone] = React.useState(false);
  const [initialLoading, setInitialLoading] = React.useState(!isInitialAppLoadComplete);
  const [isInitialLoadDone, setIsInitialLoadDone] = React.useState(false);

  const logError = React.useCallback((message, error) => {
    const status = error?.response?.status;
    const isProduction = import.meta.env.MODE === 'production';
    if (isProduction && (status === 400 || status === 403 || status === 404)) {
      console.warn(`[HomePage Warning] ${message}`, error?.message || error);
    } else {
      console.error(`[HomePage Error] ${message}`, error);
    }
  }, []);

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

      if (!isGuest) {
        try {
          const passportResponse = await api.get('/api/v1/user/passport');
          const preferenceCandidate = passportResponse?.data?.preferences?.favorite_timeline_id;
          const parsedPreference = Number(preferenceCandidate || 0);
          if (parsedPreference > 0) {
            resolvedFavoriteTimelineId = parsedPreference;
          }
        } catch (error) {
          logError('Failed to hydrate favorite timeline from passport', error);
        }
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
          logError('Error reading favorite timeline from localStorage', error);
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
  }, [user?.id, getFavoriteTimelineKey, isGuest]);

  React.useEffect(() => {
    if (!user?.id || favoriteTimelineId === undefined) return;
    try {
      const key = getFavoriteTimelineKey(user.id);
      if (favoriteTimelineId && favoriteTimelineId > 0) {
        window.localStorage.setItem(key, String(favoriteTimelineId));
      } else if (favoriteTimelineId === null) {
        window.localStorage.removeItem(key);
      }
    } catch (error) {
      logError('Error writing favorite timeline to localStorage', error);
    }
  }, [user?.id, favoriteTimelineId, getFavoriteTimelineKey]);

  React.useEffect(() => {
    setHasLoadedFavoriteEvents(false);
    setHasLoadedFavoriteContext(false);
  }, [favoriteTimelineId]);

  React.useEffect(() => {
    setHasBootstrappedPopularCache(false);
    setHasBootstrappedYourPageCache(false);
    hasRefreshedPopularRef.current = false;
    hasRefreshedYourPageRef.current = false;
  }, [user?.id]);

  React.useEffect(() => {
    if (!user) {
      setInitialLoading(false);
      return;
    }
    const fetchTimelines = async () => {
      try {
        setLoadingTimelines(true);
        const response = await api.get('/api/v1/timelines', {
          params: { limit: HOME_TIMELINES_FETCH_LIMIT },
        });
        setTimelines(response.data?.data || []);
      } catch (error) {
        logError('Error fetching timelines', error);
      } finally {
        setLoadingTimelines(false);
      }
    };

    fetchTimelines();
  }, [user]);

  React.useEffect(() => {
    if (isInitialAppLoadComplete) return;

    if (initialLoading) {
      const timelinesLoaded = !loadingTimelines;
      const popularLoaded = hasLoadedPopular || (timelinesLoaded && timelines.length === 0);

      if (timelinesLoaded && popularLoaded && !isInitialLoadDone) {
        setIsInitialLoadDone(true);
      }
    }
  }, [loadingTimelines, hasLoadedPopular, initialLoading, isInitialLoadDone, timelines.length]);

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
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
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
        const todayKey = getTodayKey();
        const response = await api.get(`/api/v1/events/spotlight/top-voted-today?date=${todayKey}`);
        const rawEvent = response?.data?.event;
        const baseEvent = rawEvent && typeof rawEvent === 'object' ? rawEvent : null;
        setTopVotesTodayEvent(baseEvent);

        let hydratedEvent = baseEvent;
        const hydratedEventId = Number(baseEvent?.id || 0);
        const hydratedTimelineId = Number(baseEvent?.timeline_id || 0);

        if (hydratedEventId > 0 && hydratedTimelineId > 0) {
          try {
            const detailResponse = await api.get(`/api/v1/events/${hydratedEventId}`);
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

  const fetchAndHydrateRandomEvent = React.useCallback(async ({ force = false } = {}) => {
    if (prefetchedRandomEvent && !force) {
      return prefetchedRandomEvent;
    }
    setRandomEventLoading(true);
    try {
      const response = await api.get('/api/v1/events/spotlight/random');
      const rawEvent = response?.data?.event;
      const baseEvent = rawEvent && typeof rawEvent === 'object' ? rawEvent : null;
      setRandomEvent(baseEvent);

      let hydratedEvent = baseEvent;
      const hydratedEventId = Number(baseEvent?.id || 0);
      const hydratedTimelineId = Number(baseEvent?.timeline_id || 0);

      if (hydratedEventId > 0 && hydratedTimelineId > 0) {
        try {
          const detailResponse = await api.get(`/api/v1/events/${hydratedEventId}`);
          const detailEvent = detailResponse?.data;
          if (detailEvent?.id) {
            hydratedEvent = { ...detailEvent, ...baseEvent };
          }
        } catch (detailError) {
          console.warn('[HomePage] Failed to hydrate random spotlight event details:', detailError);
        }
      }

      setPrefetchedRandomEvent(hydratedEvent && typeof hydratedEvent === 'object' ? hydratedEvent : null);
      return hydratedEvent;
    } catch (error) {
      setRandomEvent(null);
      setPrefetchedRandomEvent(null);
      console.warn('[HomePage] Failed to fetch random event spotlight:', error);
      return null;
    } finally {
      setRandomEventLoading(false);
    }
  }, [prefetchedRandomEvent]);

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
    if (enabledHeroSlides.length <= 1 || isHeroMinimized) return undefined;

    const timer = window.setTimeout(() => {
      transitionToHeroSlide((heroIndex + 1) % enabledHeroSlides.length);
    }, heroRotateMs || HOME_HERO_DEFAULT_ROTATE_MS);

    return () => {
      window.clearTimeout(timer);
    };
  }, [heroIndex, heroRotateMs, transitionToHeroSlide, enabledHeroSlides.length, isHeroMinimized]);

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

  const handleHeroBannerClick = React.useCallback((e) => {
    if (isHeroMinimized) {
      setIsHeroMinimized(false);
      try {
        window.localStorage.setItem('home_hero_minimized_state', 'false');
      } catch (_) { }
      return;
    }

    const target = e.target;
    const isInteractive = target.closest('button') ||
      target.closest('a') ||
      target.closest('.MuiChip-root') ||
      target.closest('[role="button"]') ||
      target.closest('input') ||
      target.closest('svg');

    if (!isInteractive) {
      setIsHeroMinimized(true);
      try {
        window.localStorage.setItem('home_hero_minimized_state', 'true');
      } catch (_) { }
    }
  }, [isHeroMinimized]);

  React.useEffect(() => {
    setIsHubLabelVisible(true);
    hubLabelTimeoutRef.current = window.setTimeout(() => {
      setIsHubLabelVisible(false);
    }, 3000);
  }, []);

  const transitionToHubTab = React.useCallback(
    (nextTab) => {
      if (nextTab === activeHubTab) return;

      // Handle label visibility for mobile
      setIsHubLabelVisible(true);
      if (hubLabelTimeoutRef.current) {
        window.clearTimeout(hubLabelTimeoutRef.current);
      }

      // Auto-collapse label after 3 seconds on mobile
      hubLabelTimeoutRef.current = window.setTimeout(() => {
        setIsHubLabelVisible(false);
      }, 3000);

      const nextPhaseOneLoading = nextTab === 'my-creations' || nextTab === 'friends-list';
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
  const isExploreSearchScope = searchSubFilter === 'explore';
  const isTimelineSearchScope = searchSubFilter === 'communities';
  const isPostSearchScope = searchSubFilter === 'posts';
  const isUserSearchScope = searchSubFilter === 'users';
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
        if (timeline.timeline_type !== 'community') return false;
        const name = String(timeline?.name || '').toLowerCase();
        const description = String(timeline?.description || '').toLowerCase();
        return name.includes(previewQuery) || description.includes(previewQuery);
      }).length;
    }

    if (isExploreSearchScope) {
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
        const bio = String(profileUser?.bio || '').toLowerCase();
        return usernameMatchesQuery(profileUser?.username, previewQuery) || bio.includes(previewQuery);
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
  const isEventSpotlightRandomMode = activeHeroSlide?.type === 'event_spotlight'
    && String(activeHeroSlide?.selection_mode || 'manual').toLowerCase() === 'random';

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
    const promoteCount = Number(event?.vote_totals?.promote ?? event?.promote_count ?? event?.promoteCount ?? event?.promote ?? 0) || 0;
    const demoteCount = Number(event?.vote_totals?.demote ?? event?.demote_count ?? event?.demoteCount ?? event?.demote ?? 0) || 0;
    const totalCount = Number(event?.total_count ?? event?.totalCount ?? event?.popularity_votes ?? 0) || (promoteCount + demoteCount);
    return totalCount;
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

  React.useEffect(() => {
    if (!isEventSpotlightRandomMode) {
      return undefined;
    }

    const loadRandomEvent = async () => {
      await fetchAndHydrateRandomEvent();
    };

    loadRandomEvent();
  }, [fetchAndHydrateRandomEvent, isEventSpotlightRandomMode]);

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

      // Strict "No Top Event Today" fallback rendering: do NOT leak older events
      return null;
    }

    if (selectionMode === 'random') {
      const fetchedEventId = Number(randomEvent?.id || 0);
      if (fetchedEventId > 0) {
        const prefetchedEventId = Number(prefetchedRandomEvent?.id || 0);
        const fromLoadedFeeds = eventLookupPool.get(fetchedEventId) || null;
        if (prefetchedEventId === fetchedEventId) {
          return {
            ...(fromLoadedFeeds || {}),
            ...prefetchedRandomEvent,
            ...randomEvent,
          };
        }
        return fromLoadedFeeds
          ? { ...fromLoadedFeeds, ...randomEvent }
          : randomEvent;
      }

      // Fallback: Pick a random candidate from eventLookupPool if API is loading/empty
      const candidates = Array.from(eventLookupPool.values()).filter((event) => {
        const timelineType = String(event?.timeline_type || '').toLowerCase();
        const timelineVisibility = String(event?.timeline_visibility || event?.visibility || 'public').toLowerCase();
        return timelineType !== 'personal' && timelineVisibility !== 'private';
      });
      if (!candidates.length) return null;
      return candidates[Math.floor(Math.random() * candidates.length)] || null;
    }

    const targetId = Number(activeHeroSlide?.event_id || 0);
    if (!(targetId > 0)) return null;
    return eventLookupPool.get(targetId) || null;
  }, [
    activeHeroSlide?.type,
    activeHeroSlide?.selection_mode,
    activeHeroSlide?.event_id,
    topVotesTodayEvent,
    prefetchedSpotlightEvent,
    randomEvent,
    prefetchedRandomEvent,
    eventLookupPool,
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
      const response = await api.get(`/api/v1/events/${eventId}`);
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
    const qNormalized = q.replace(/\s+/g, '_');
    const rankTimeline = (timeline) => {
      // Focus purely on community timelines, excluding hashtags
      if (timeline?.timeline_type !== 'community') return 999;

      const name = String(timeline?.name || '').toLowerCase();
      const description = String(timeline?.description || '').toLowerCase();

      if (name === qNormalized || name === q) return 0;
      if (name.startsWith(qNormalized) || name.startsWith(q)) return 1;
      if (name.includes(qNormalized) || name.includes(q)) return 2;
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
    return searchEvents;
  }, [searchEvents, isPostSearchScope, hasSearchQuery]);

  const filteredUsers = React.useMemo(() => {
    if (!isUserSearchScope) return [];
    if (!hasSearchQuery) return [];
    return searchUsers;
  }, [searchUsers, isUserSearchScope, hasSearchQuery]);

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

  const trackerItems = React.useMemo(() => {
    if (!hasSearchQuery) return [];
    if (searchSubFilter === 'explore') {
      const items = [];
      if (exploreDossier?.top_user) {
        items.push({ id: `user-${exploreDossier.top_user.id}`, label: "User Found" });
      }
      if (exploreDossier?.top_personal) {
        items.push({ id: `search-timeline-${exploreDossier.top_personal.id}`, label: "Personal" });
      }
      if (exploreDossier?.top_community) {
        items.push({ id: `search-timeline-${exploreDossier.top_community.id}`, label: "     Community" });
      }
      if (exploreDossier?.top_hashtag) {
        items.push({ id: `search-timeline-${exploreDossier.top_hashtag.id}`, label: "#   " });
      }
      if (exploreDossier?.top_news) {
        items.push({ id: `event-${exploreDossier.top_news.id}`, label: "Link" });
      }
      if (exploreDossier?.top_media) {
        items.push({ id: `event-${exploreDossier.top_media.id}`, label: "Post" });
      }
      if (exploreDossier?.top_remark) {
        items.push({ id: `event-${exploreDossier.top_remark.id}`, label: "Post" });
      }
      if (exploreDossier?.top_comment) {
        items.push({ id: `comment-${exploreDossier.top_comment.id}`, label: "Comment" });
      }
      return items.slice(0, 6);
    }
    if (searchSubFilter === 'communities') {
      return visibleTimelines.map((t) => ({ id: `search-timeline-${t.id}`, label: "     Community" }));
    }
    if (searchSubFilter === 'posts') {
      return visiblePosts.map((p) => {
        const isComment = p.searchResultType === 'comment';
        const isLink = p.type === 'news' || p.type === 'link';
        const label = isComment ? "Comment" : (isLink ? "Link" : "Post");
        return {
          id: isComment ? `comment-${p.id}` : `event-${p.id}`,
          label,
        };
      });
    }
    if (searchSubFilter === 'users') {
      return visibleUsers.map((u) => ({ id: `user-${u.id}`, label: "User Found" }));
    }
    return [];
  }, [hasSearchQuery, searchSubFilter, exploreDossier, visibleTimelines, visiblePosts, visibleUsers]);

  const handleTrackerItemClick = (elementId) => {
    const el = document.getElementById(elementId);
    if (el && resultsScrollRef.current) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleOpenEventById = React.useCallback(async (eventId) => {
    const numericEventId = Number(eventId || 0);
    if (!(numericEventId > 0)) return;

    try {
      setHeroEventPopupLoading(true);
      const response = await api.get(`/api/v1/events/${numericEventId}`);
      const fetchedEvent = response?.data;
      if (fetchedEvent?.id) {
        setHeroEventPopupEvent(fetchedEvent);
      }
    } catch (error) {
      console.warn('[HomePage] Failed to fetch event by id:', error);
    } finally {
      setHeroEventPopupLoading(false);
    }
  }, []);

  const renderCommentSearchResultCard = (comment) => {
    const isDarkMode = theme.palette.mode === 'dark';
    const textPrimary = theme.palette.text.primary;
    const textSecondary = theme.palette.text.secondary;
    const charcoalBorder = isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(80, 70, 60, 0.2)';

    const isOp = Number(comment.userId) === Number(comment.eventCreatorId);

    // Dynamic style based on type and OP status (matching discussion popup drawer)
    let bubbleBg = isDarkMode
      ? 'linear-gradient(135deg, rgba(143, 172, 154, 0.06) 0%, rgba(143, 172, 154, 0.18) 100%)'
      : 'rgba(143, 172, 154, 0.15)';
    let bubbleBorder = isDarkMode ? 'rgba(143, 172, 154, 0.25)' : 'rgba(143, 172, 154, 0.3)';
    let bubbleShadow = '0 2px 5px rgba(0,0,0,0.03)';
    let bubbleTransform = 'none';

    if (comment.type === 'system') {
      // Lavender/Plum
      bubbleBg = isDarkMode
        ? 'linear-gradient(135deg, rgba(168, 143, 184, 0.08) 0%, rgba(168, 143, 184, 0.22) 100%)'
        : 'rgba(168, 143, 184, 0.2)';
      bubbleBorder = isDarkMode ? 'rgba(168, 143, 184, 0.25)' : 'rgba(168, 143, 184, 0.35)';
    } else if (isOp) {
      // Sunset Gold
      bubbleBg = isDarkMode
        ? 'linear-gradient(135deg, rgba(224, 175, 104, 0.18) 0%, rgba(212, 163, 89, 0.08) 100%)'
        : 'rgba(212, 163, 89, 0.2)';
      bubbleBorder = isDarkMode ? 'rgba(224, 175, 104, 0.55)' : 'rgba(212, 163, 89, 0.4)';
      bubbleShadow = isDarkMode ? '0 4px 12px rgba(224, 175, 104, 0.22)' : '0 4px 10px rgba(0,0,0,0.08)';
      bubbleTransform = 'translateY(-1px)';
    } else if (comment.parentId) {
      // Warm Coral
      bubbleBg = isDarkMode
        ? 'linear-gradient(135deg, rgba(235, 130, 110, 0.15) 0%, rgba(216, 110, 130, 0.06) 100%)'
        : 'rgba(216, 179, 161, 0.15)';
      bubbleBorder = isDarkMode ? 'rgba(235, 130, 110, 0.25)' : 'rgba(216, 179, 161, 0.3)';
      bubbleShadow = '0 1px 3px rgba(0,0,0,0.02)';
    }

    const displayName = comment.type === 'system'
      ? 'System Generated'
      : (comment.user?.display_username || comment.user?.username || 'Anonymous');

    return (
      <Box
        id={`comment-${comment.id}`}
        sx={{
          display: 'flex',
          gap: 1.5,
          alignItems: 'flex-start',
          p: 2,
          borderRadius: 3,
          border: '1px solid',
          borderColor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(30, 41, 59, 0.08)',
          background: isDarkMode ? 'rgba(15, 23, 42, 0.25)' : 'rgba(255, 255, 255, 0.45)',
          backdropFilter: 'blur(8px)',
          boxShadow: isDarkMode ? 'none' : '0 4px 12px rgba(0,0,0,0.03)',
        }}
      >
        {comment.type === 'system' ? (
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: textSecondary,
              border: '1px solid ' + charcoalBorder,
            }}
          >
            <GearIcon sx={{ fontSize: 16 }} />
          </Box>
        ) : (
          <UserAvatar
            name={displayName}
            avatarUrl={comment.user?.avatar_url}
            id={comment.userId}
            size={32}
          />
        )}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          {/* Username & Metadata */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: textPrimary, fontSize: '0.85rem', textTransform: comment.type === 'system' ? 'none' : 'capitalize' }}>
              {displayName}
            </Typography>
            <Typography variant="caption" sx={{ color: textSecondary, fontSize: '0.7rem' }}>
              {formatDate(comment.created_at)}
            </Typography>
          </Box>

          {/* Comment Bubble */}
          <Box
            sx={{
              p: 1.5,
              borderRadius: '4px 16px 16px 16px',
              background: bubbleBg,
              border: '1px solid',
              borderColor: bubbleBorder,
              color: textPrimary,
              boxShadow: bubbleShadow,
              transform: bubbleTransform,
              width: 'fit-content',
              maxWidth: '100%',
              mb: 1,
            }}
          >
            <RichContentRenderer content={comment.content} theme={theme} inheritTextColor={true} />
          </Box>

          {/* Action Row */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
            <Button
              size="small"
              onClick={() => handleOpenEventById(comment.eventId)}
              sx={{
                textTransform: 'none',
                fontSize: '0.72rem',
                fontWeight: 700,
                color: 'primary.main',
                padding: '4px 10px',
                borderRadius: 1.5,
                border: '1px solid rgba(14, 165, 233, 0.25)',
                bgcolor: 'rgba(14, 165, 233, 0.04)',
                '&:hover': {
                  bgcolor: 'rgba(14, 165, 233, 0.12)',
                },
              }}
            >
              Under post: {comment.eventTitle || 'View Post'}
            </Button>
          </Box>
        </Box>
      </Box>
    );
  };

  const renderExploreDashboard = () => {
    const dossier = exploreDossier;
    if (!dossier) return null;

    const hasAnyTarget =
      dossier.top_community ||
      dossier.top_personal ||
      dossier.top_hashtag ||
      dossier.top_news ||
      dossier.top_media ||
      dossier.top_remark ||
      dossier.top_comment ||
      dossier.top_user;

    if (!hasAnyTarget) {
      return (
        <Box sx={{ py: 6, textAlign: 'center' }}>
          <Typography color="text.secondary">
            No dossier targets match this search term. Try another query!
          </Typography>
        </Box>
      );
    }

    return (
      <Stack spacing={2.5}>
        {/* Top User */}
        {dossier.top_user && (
          <Box id={`user-${dossier.top_user.id}`} sx={{ scrollMarginTop: 16 }}>
            <Typography variant="overline" color="error.main" sx={{ display: 'block', mb: 0.75, letterSpacing: 0.8, fontWeight: 900 }}>
              Top User Profile
            </Typography>
            <Box sx={{ pl: { xs: 3, sm: 4 }, pt: { xs: 2.4, sm: 2.9 } }}>
              <UserCard
                user={dossier.top_user}
                currentUserId={currentUserId}
                followedUserIdSet={followedUserIdSet}
                followActionByUserId={followActionByUserId}
                onToggleFollow={handleToggleUserFollow}
              />
            </Box>
          </Box>
        )}

        {/* Top Personal Timeline */}
        {dossier.top_personal && (
          <Box id={`search-timeline-${dossier.top_personal.id}`} sx={{ scrollMarginTop: 16 }}>
            <Typography variant="overline" color="#c084fc" sx={{ display: 'block', mb: 0.75, letterSpacing: 0.8, fontWeight: 900 }}>
              Top Personal Timeline
            </Typography>
            <TimelineCard
              timeline={dossier.top_personal}
              sections={HOME_TIMELINE_CARD_SECTIONS}
              allowFavoriteToggle
              isFavoriteTimeline={Number(dossier.top_personal?.id || 0) > 0 && favoriteTimelineId === Number(dossier.top_personal?.id || 0)}
              onToggleFavorite={handleToggleFavoriteTimeline}
              onOpenTimeline={handleOpenTimelineCard}
              formatDate={formatDate}
              allowWatchToggle
              isWatched={followedHashtagIds.has(Number(dossier.top_personal?.id || 0))}
              onToggleWatch={handleToggleWatchHashtag}
            />
          </Box>
        )}

        {/* Top Community */}
        {dossier.top_community && (
          <Box id={`search-timeline-${dossier.top_community.id}`} sx={{ scrollMarginTop: 16 }}>
            <Typography variant="overline" color="primary.main" sx={{ display: 'block', mb: 0.75, letterSpacing: 0.8, fontWeight: 900 }}>
              Top Community
            </Typography>
            <TimelineCard
              timeline={dossier.top_community}
              sections={HOME_TIMELINE_CARD_SECTIONS}
              allowFavoriteToggle
              isFavoriteTimeline={Number(dossier.top_community?.id || 0) > 0 && favoriteTimelineId === Number(dossier.top_community?.id || 0)}
              onToggleFavorite={handleToggleFavoriteTimeline}
              onOpenTimeline={handleOpenTimelineCard}
              formatDate={formatDate}
              allowWatchToggle
              isWatched={followedHashtagIds.has(Number(dossier.top_community?.id || 0))}
              onToggleWatch={handleToggleWatchHashtag}
            />
          </Box>
        )}

        {/* Top Hashtag */}
        {dossier.top_hashtag && (
          <Box id={`search-timeline-${dossier.top_hashtag.id}`} sx={{ scrollMarginTop: 16 }}>
            <Typography variant="overline" color="success.main" sx={{ display: 'block', mb: 0.75, letterSpacing: 0.8, fontWeight: 900 }}>
              Top Hashtag
            </Typography>
            <TimelineCard
              timeline={dossier.top_hashtag}
              sections={HOME_TIMELINE_CARD_SECTIONS}
              allowFavoriteToggle
              isFavoriteTimeline={Number(dossier.top_hashtag?.id || 0) > 0 && favoriteTimelineId === Number(dossier.top_hashtag?.id || 0)}
              onToggleFavorite={handleToggleFavoriteTimeline}
              onOpenTimeline={handleOpenTimelineCard}
              formatDate={formatDate}
              allowWatchToggle
              isWatched={followedHashtagIds.has(Number(dossier.top_hashtag?.id || 0))}
              onToggleWatch={handleToggleWatchHashtag}
            />
          </Box>
        )}

        {/* Top News */}
        {dossier.top_news && (
          <Box id={`event-${dossier.top_news.id}`} sx={{ scrollMarginTop: 16 }}>
            <Typography variant="overline" color="warning.main" sx={{ display: 'block', mb: 0.75, letterSpacing: 0.8, fontWeight: 900 }}>
              Top News / Link Event
            </Typography>
            {renderSearchEventCard(dossier.top_news)}
          </Box>
        )}

        {/* Top Media */}
        {dossier.top_media && (
          <Box id={`event-${dossier.top_media.id}`} sx={{ scrollMarginTop: 16 }}>
            <Typography variant="overline" color="secondary.main" sx={{ display: 'block', mb: 0.75, letterSpacing: 0.8, fontWeight: 900 }}>
              Top Media Event
            </Typography>
            {renderSearchEventCard(dossier.top_media)}
          </Box>
        )}

        {/* Top Remark */}
        {dossier.top_remark && (
          <Box id={`event-${dossier.top_remark.id}`} sx={{ scrollMarginTop: 16 }}>
            <Typography variant="overline" color="info.main" sx={{ display: 'block', mb: 0.75, letterSpacing: 0.8, fontWeight: 900 }}>
              Top Remark Event
            </Typography>
            {renderSearchEventCard(dossier.top_remark)}
          </Box>
        )}

        {/* Top Comment */}
        {dossier.top_comment && (
          <Box id={`comment-${dossier.top_comment.id}`} sx={{ scrollMarginTop: 16 }}>
            <Typography variant="overline" color="text.secondary" sx={{ display: 'block', mb: 0.75, letterSpacing: 0.8, fontWeight: 900 }}>
              Top Comment
            </Typography>
            {renderCommentSearchResultCard(dossier.top_comment)}
          </Box>
        )}
      </Stack>
    );
  };

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
    if (!(numericFavoriteId > 0)) {
      // No favorite timeline is set — clear the events list
      setFavoriteTimelineEvents([]);
      setLoadingFavoriteTimelineEvents(false);
      setHasLoadedFavoriteEvents(false);
      return;
    }
    // Load if not loaded yet (background load on mount),
    // OR if active tab is 'favorite' and we want to refresh
    const shouldLoad = !hasLoadedFavoriteEvents || activeHubTab === 'favorite';
    if (!shouldLoad) return;

    let isCancelled = false;
    const loadFavoriteTimelineEvents = async () => {
      try {
        setLoadingFavoriteTimelineEvents(true);
        const response = await api.get(`/api/v1/events/by-timeline/${numericFavoriteId}`, {
          params: { limit: HOME_FAVORITE_EVENTS_FETCH_LIMIT },
        });
        if (isCancelled) return;

        const events = response.data?.data || [];
        const timelineName = selectedFavoriteTimeline?.name || response.data?.timeline_name || '';
        const timelineType = selectedFavoriteTimeline?.timeline_type || response.data?.timeline_type || 'hashtag';
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
        setHasLoadedFavoriteEvents(true);
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
  }, [favoriteTimelineId, activeHubTab, selectedFavoriteTimeline, hasLoadedFavoriteEvents]);

  React.useEffect(() => {
    const numericFavoriteId = Number(favoriteTimelineId || 0);
    if (!(numericFavoriteId > 0)) {
      setFavoriteTimelineQuote(DEFAULT_FAVORITE_QUOTE);
      setFavoriteTimelineActions([]);
      setFavoriteTimelineStatusMessage({ active: false, status_type: null, title: '', body: '' });
      setFavoriteTimelineWarningState({ active: false, warning_scope: null, title: '', body: '' });
      setLoadingFavoriteTimelineContext(false);
      setHasLoadedFavoriteContext(false);
      return;
    }

    const shouldLoad = !hasLoadedFavoriteContext || activeHubTab === 'favorite';
    if (!shouldLoad) return;

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
        setHasLoadedFavoriteContext(true);
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
  }, [favoriteTimelineId, activeHubTab, selectedFavoriteTimeline, hasLoadedFavoriteContext]);

  React.useEffect(() => {
    setVisibleFavoritePostCount(HOME_LIST_BATCH_SIZE);
    if (favoriteScrollRef.current) {
      favoriteScrollRef.current.scrollTop = 0;
    }
  }, [favoriteTimelineId]);

  const handleOpenTimelineCard = React.useCallback((timelineId) => {
    const numericTimelineId = Number(timelineId || 0);
    if (!(numericTimelineId > 0)) return;
    navigate(`/timeline-v3/${numericTimelineId}`);
  }, [navigate]);

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

  const fetchExploreDossier = React.useCallback(async (q) => {
    try {
      setLoadingExplore(true);
      const res = await api.get('/api/v1/search/explore', { params: { q } });
      setExploreDossier(res?.data || null);
    } catch (err) {
      logError('Error fetching explore dossier', err);
      setExploreDossier(null);
    } finally {
      setLoadingExplore(false);
    }
  }, []);

  const fetchSearchPosts = React.useCallback(async (q) => {
    try {
      setLoadingSearchEvents(true);
      const res = await api.get('/api/v1/search/posts', { params: { q } });
      setSearchEvents(res?.data?.data || []);
    } catch (err) {
      logError('Error fetching search posts', err);
      setSearchEvents([]);
    } finally {
      setLoadingSearchEvents(false);
    }
  }, []);

  const fetchSearchUsers = React.useCallback(async (q) => {
    try {
      setLoadingSearchUsers(true);
      const res = await api.get('/api/v1/search/users', { params: { q } });
      setSearchUsers(res?.data?.data || []);
    } catch (err) {
      logError('Error fetching search users', err);
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
      logError('Error fetching followed users', error);
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
      logError('Error fetching follower users', error);
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

  const refreshFeeds = React.useCallback(async (force = false) => {
    if (!force) {
      if (lastBlurTimeRef.current === 0) {
        return;
      }
      const timeAway = Date.now() - lastBlurTimeRef.current;
      if (timeAway <= 180000) { // 3 minutes — avoids reload for brief app switches on mobile
        return;
      }
    }
    // Silent background refresh — no loading screen shown.
    // Data updates quietly while the user sees their current content (like Instagram/Twitter).
    // The full loading screen only appears on the very first page load (initialLoading).
    try {
      // Run auth check and timeline fetch in parallel so neither blocks the other
      const [, response] = await Promise.all([
        api.get('/api/v1/auth/me'),
        api.get('/api/v1/timelines', {
          params: { limit: HOME_TIMELINES_FETCH_LIMIT },
        }),
      ]);
      const freshTimelines = response.data?.data || [];
      setTimelines(freshTimelines);



      // Reset refresh guards so the trigger effects will silently re-fetch when the tabs become active.
      // We deliberately do NOT reset hasLoadedPopular / hasLoadedYourPage here —
      // keeping them true means the UI continues to show the last known data instead of going blank.
      hasRefreshedPopularRef.current = false;
      hasRefreshedYourPageRef.current = false;

      await Promise.allSettled([
        fetchFollowedUsers(),
        fetchFollowerUsers()
      ]);

      if (activeHubTab === 'favorite' && favoriteTimelineId) {
        const numericFavoriteId = Number(favoriteTimelineId);
        const [quoteResponse, actionsResponse, statusResponse, warningResponse, favEventsResponse] = await Promise.allSettled([
          getTimelineQuote(numericFavoriteId),
          getTimelineActions(numericFavoriteId),
          getTimelineStatusMessage(numericFavoriteId),
          getTimelineWarningState(numericFavoriteId),
          api.get(`/api/v1/events/by-timeline/${numericFavoriteId}`, {
            params: { limit: HOME_FAVORITE_EVENTS_FETCH_LIMIT },
          })
        ]);

        if (quoteResponse.status === 'fulfilled') {
          const quoteText = String(quoteResponse.value?.quote?.text || '').trim();
          const quoteAuthor = String(quoteResponse.value?.quote?.author || '').trim();
          setFavoriteTimelineQuote({
            text: quoteText || DEFAULT_FAVORITE_QUOTE.text,
            author: quoteAuthor || DEFAULT_FAVORITE_QUOTE.author,
          });
        }

        if (actionsResponse.status === 'fulfilled') {
          const nextActions = Array.isArray(actionsResponse.value?.actions)
            ? actionsResponse.value.actions
              .filter((action) => action && action.action_type)
              .filter((action) => hasMeaningfulActionCardContent(action))
            : [];
          setFavoriteTimelineActions(nextActions);
        }

        if (statusResponse.status === 'fulfilled') {
          setFavoriteTimelineStatusMessage({
            active: !!statusResponse.value?.active,
            status_type: String(statusResponse.value?.status_type || statusResponse.value?.message_type || '').toLowerCase() || null,
            title: String(statusResponse.value?.status_header || statusResponse.value?.title || '').trim(),
            body: String(statusResponse.value?.status_body || statusResponse.value?.body || statusResponse.value?.message || '').trim(),
          });
        }

        if (warningResponse.status === 'fulfilled') {
          setFavoriteTimelineWarningState({
            active: !!warningResponse.value?.active,
            warning_scope: warningResponse.value?.warning_scope || null,
            title: String(warningResponse.value?.title || '').trim(),
            body: String(warningResponse.value?.body || warningResponse.value?.message || '').trim(),
          });
        }

        if (favEventsResponse.status === 'fulfilled') {
          const events = favEventsResponse.value?.data?.data || [];
          setFavoriteTimelineEvents(
            events.map(event => ({
              ...event,
              timeline_id: Number(event?.timeline_id || numericFavoriteId),
            })).sort((a, b) => new Date(b?.created_at || 0) - new Date(a?.created_at || 0))
          );
        }
      }
    } catch (error) {
      logError('Window focus session validation failed (user might be logged out or offline)', error);
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        window.location.href = '/login';
      }
    }
  }, [user?.id, activeHubTab, favoriteTimelineId, clearPopularCache, clearYourPageCache, fetchFollowedUsers, fetchFollowerUsers, logError]);

  React.useEffect(() => {
    const handleFocus = () => {
      refreshFeeds(false);
    };
    const handleBlur = () => {
      lastBlurTimeRef.current = Date.now();
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);
    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
    };
  }, [refreshFeeds]);

  React.useEffect(() => {
    const handleRefreshEvent = () => {
      refreshFeeds(true);
    };
    window.addEventListener('refresh-homepage-data', handleRefreshEvent);
    return () => {
      window.removeEventListener('refresh-homepage-data', handleRefreshEvent);
    };
  }, [refreshFeeds]);

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

      // Cache expiration check
      const cachedAt = Number(parsed?.cached_at || 0);
      if (Date.now() - cachedAt > HOME_CACHE_TTL_MS) {
        console.log('[HomePage] Popular cache expired, forcing refresh');
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
      logError('Error reading Popular cache', error);
      setHasLoadedPopular(false);
      setPopularTimelines([]);
      setPopularEvents([]);
      setHasBootstrappedPopularCache(true);
    }
  }, [user?.id, getPopularCacheKey, clearPopularCache]);

  const fetchPopularData = React.useCallback(async ({ silent = false } = {}) => {
    // If the timelines list hasn't been fetched yet, don't wipe the loaded
    // state — the triggering effect gates on loadingTimelines, so this
    // callback will be called again once timelines are ready.
    if (!normalizedTimelines.length) {
      return;
    }

    try {
      if (!silent) {
        setLoadingPopular(true);
      }

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
      const rankedTimelines = [];

      if (uniqueCandidateIds.length > 0) {
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
      }

      setPopularTimelines(rankedTimelines);

      // Fetch hot-ranked popular posts directly from the backend in a single call
      const popularEventsResponse = await api.get('/api/v1/events/popular');
      const fetchedEvents = Array.isArray(popularEventsResponse?.data)
        ? popularEventsResponse.data
        : (Array.isArray(popularEventsResponse?.data?.events) ? popularEventsResponse.data.events : []);

      setPopularEvents(fetchedEvents);
      setHasLoadedPopular(true);
      setLoadingPopular(false);
    } catch (error) {
      logError('Error loading Popular data', error);
      if (!silent) {
        setPopularTimelines([]);
        setPopularEvents([]);
      }
      setHasLoadedPopular(true);
      setLoadingPopular(false);
    }
  }, [normalizedTimelines]);

  React.useEffect(() => {
    if (!hasBootstrappedPopularCache) return;
    if (activeHubTab !== 'popular') return;
    if (loadingTimelines) return; // wait for timelines before triggering fetch

    if (!hasLoadedPopular) {
      // Use silent:true so any existing data stays visible while the fresh load happens
      fetchPopularData({ silent: true });
      hasRefreshedPopularRef.current = true;
    } else if (!hasRefreshedPopularRef.current) {
      fetchPopularData({ silent: true });
      hasRefreshedPopularRef.current = true;
    }
  }, [activeHubTab, isHubPhaseOneLoading, hasLoadedPopular, fetchPopularData, hasBootstrappedPopularCache, loadingTimelines]);

  React.useEffect(() => {
    if (!user?.id) return;
    if (!hasLoadedPopular) return;
    if (loadingTimelines) return;

    try {
      window.sessionStorage.setItem(getPopularCacheKey(user.id), JSON.stringify({
        timelines: popularTimelines,
        events: popularEvents,
        source_timeline_count: normalizedTimelines.length,
        cached_at: Date.now(),
      }));
    } catch (error) {
      logError('Error writing Popular cache', error);
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

      // Cache expiration check
      const cachedAt = Number(parsed?.cached_at || 0);
      if (Date.now() - cachedAt > HOME_CACHE_TTL_MS) {
        console.log('[HomePage] Your Page cache expired, forcing refresh');
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
      logError('Error reading Your Page cache', error);
      setHasLoadedYourPage(false);
      setYourPageTimelines([]);
      setYourPageEvents([]);
      setHasBootstrappedYourPageCache(true);
    }
  }, [user?.id, getYourPageCacheKey, clearYourPageCache]);

  const fetchYourPageData = React.useCallback(async ({ silent = false } = {}) => {
    if (!user || isGuest) {
      setYourPageTimelines([]);
      setYourPageEvents([]);
      setHasLoadedYourPage(true);
      return;
    }

    if (!normalizedTimelines.length) {
      // Timelines haven't loaded yet — exit silently and wait. Do NOT mark
      // hasLoadedYourPage=true with empty data; the triggering effect already
      // guards on loadingTimelines and will re-call this once timelines arrive.
      return;
    }

    try {
      if (!silent) {
        setLoadingYourPage(true);
      }

      const [syncedMembershipsResult, followedHashtagsResult] = await Promise.allSettled([
        syncUserPassport(true), // Force refresh to get latest memberships with timeline_type
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
        const typeA = String(a?.timeline_type || 'hashtag').toLowerCase();
        const typeB = String(b?.timeline_type || 'hashtag').toLowerCase();
        
        const weightA = typeA === 'personal' ? 1 : typeA === 'community' ? 2 : 3;
        const weightB = typeB === 'personal' ? 1 : typeB === 'community' ? 2 : 3;
        
        if (weightA !== weightB) {
          return weightA - weightB;
        }
        return new Date(b?.created_at || 0) - new Date(a?.created_at || 0);
      });

      setYourPageTimelines(mergedTimelines);

      // Fetch chronological Home feed posts directly from the backend in a single call
      const homeEventsResponse = await api.get('/api/v1/events/home');
      const fetchedEvents = Array.isArray(homeEventsResponse?.data)
        ? homeEventsResponse.data
        : (Array.isArray(homeEventsResponse?.data?.events) ? homeEventsResponse.data.events : []);

      setYourPageEvents(fetchedEvents.slice(0, HOME_YOUR_PAGE_EVENTS_RESULT_LIMIT));
      setHasLoadedYourPage(true);
    } catch (error) {
      logError('Error loading Your Page data', error);
      if (!silent) {
        setYourPageTimelines([]);
        setYourPageEvents([]);
      }
      setHasLoadedYourPage(true);
    } finally {
      setLoadingYourPage(false);
    }
  }, [user, normalizedTimelines]);

  const fetchYourPageTimelinesOnly = React.useCallback(async () => {
    if (!user || isGuest) {
      setYourPageTimelines([]);
      return;
    }

    try {
      const [syncedMembershipsResult, followedHashtagsResult] = await Promise.allSettled([
        syncUserPassport(true),
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
          console.warn('[HomePage] Membership fallback fetch failed in timelines only:', membershipError);
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
        const typeA = String(a?.timeline_type || 'hashtag').toLowerCase();
        const typeB = String(b?.timeline_type || 'hashtag').toLowerCase();
        
        const weightA = typeA === 'personal' ? 1 : typeA === 'community' ? 2 : 3;
        const weightB = typeB === 'personal' ? 1 : typeB === 'community' ? 2 : 3;
        
        if (weightA !== weightB) {
          return weightA - weightB;
        }
        return new Date(b?.created_at || 0) - new Date(a?.created_at || 0);
      });

      setYourPageTimelines(mergedTimelines);
    } catch (error) {
      logError('Failed to fetch timelines only', error);
    }
  }, [user, isGuest, normalizedTimelines]);

  React.useEffect(() => {
    if (!hasBootstrappedYourPageCache) return;
    if (isHubPhaseOneLoading) return;
    if (isGuest) return;
    if (loadingTimelines) return;

    if (!hasLoadedYourPage) {
      // Use silent:true so initial loading runs quietly in background on mount
      fetchYourPageData({ silent: true });
      hasRefreshedYourPageRef.current = true;
    } else if (activeHubTab === 'your-page' && !hasRefreshedYourPageRef.current) {
      fetchYourPageData({ silent: true });
      hasRefreshedYourPageRef.current = true;
    }
  }, [activeHubTab, isHubPhaseOneLoading, hasLoadedYourPage, fetchYourPageData, hasBootstrappedYourPageCache, isGuest, loadingTimelines]);

  React.useEffect(() => {
    if (!user?.id) return;
    if (!hasLoadedYourPage) return;
    if (loadingTimelines) return;

    try {
      window.sessionStorage.setItem(getYourPageCacheKey(user.id), JSON.stringify({
        timelines: yourPageTimelines,
        events: yourPageEvents,
        source_timeline_count: normalizedTimelines.length,
        cached_at: Date.now(),
      }));
    } catch (error) {
      logError('Error writing Your Page cache', error);
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
    const targetLabel = profileUser?.username ? `@${displayUsername(profileUser.username)}` : 'this user';

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
      logError('Error toggling user follow', error);
      const message = error?.response?.data?.error || `Could not update follow status for ${targetLabel}`;
      setUserFollowSnackbarMessage(message);
      setUserFollowSnackbarSeverity('error');
      setUserFollowSnackbarOpen(true);
    } finally {
      setFollowActionByUserId((prev) => ({ ...prev, [targetId]: false }));
    }
  }, [currentUserId, fetchFollowedUsers, fetchFollowerUsers, followActionByUserId, followedUserIdSet]);



  const fetchMyCreationEvents = React.useCallback(async () => {
    if (loadingMyCreationEvents || hasLoadedMyCreationEvents) return;
    if (!(currentUserId > 0)) {
      setMyCreationEvents([]);
      setHasLoadedMyCreationEvents(true);
      return;
    }

    try {
      setLoadingMyCreationEvents(true);

      let merged = [];
      try {
        const response = await api.get(`/api/v1/users/${currentUserId}/events`, {
          params: { limit: HOME_MY_CREATIONS_EVENTS_RESULT_LIMIT * 2 },
        });
        const payload = response?.data;
        const events = Array.isArray(payload?.events)
          ? payload.events
          : (Array.isArray(payload?.data) ? payload.data : (Array.isArray(payload) ? payload : []));

        merged = events.map((event) => ({
          ...event,
          timeline_id: Number(event?.timeline_id || 0),
          timeline_name: event?.timeline_name || '',
          timeline_type: event?.timeline_type || 'hashtag',
        }));
      } catch (userEventsError) {
        console.warn('[HomePage] /users/:id/events failed for My Creations:', userEventsError);
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
      logError('Error fetching my creation events', error);
      setMyCreationEvents([]);
    } finally {
      setLoadingMyCreationEvents(false);
    }
  }, [loadingMyCreationEvents, hasLoadedMyCreationEvents, currentUserId]);

  React.useEffect(() => {
    if (activeHubTab !== 'my-creations') return;
    if (isHubPhaseOneLoading) return;

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
    hasLoadedMyCreationEvents,
    loadingMyCreationEvents,
    fetchMyCreationEvents,
  ]);

  // Fetch ALL timelines created by the logged-in user from the dedicated endpoint.
  // Lazy: only fires when the user navigates to the My Creations tab.
  const fetchOwnedTimelines = React.useCallback(async () => {
    if (loadingOwnedTimelines || hasLoadedOwnedTimelines) return;
    if (!(currentUserId > 0)) {
      setOwnedTimelinesServer([]);
      setHasLoadedOwnedTimelines(true);
      return;
    }
    try {
      setLoadingOwnedTimelines(true);
      const response = await api.get('/api/v1/users/me/timelines/created', {
        params: { limit: 200 },
      });
      const data = Array.isArray(response?.data?.data) ? response.data.data : [];
      setOwnedTimelinesServer(data);
      setHasLoadedOwnedTimelines(true);
    } catch (error) {
      logError('Error fetching owned timelines', error);
      setOwnedTimelinesServer([]);
    } finally {
      setLoadingOwnedTimelines(false);
    }
  }, [loadingOwnedTimelines, hasLoadedOwnedTimelines, currentUserId]);

  React.useEffect(() => {
    if (activeHubTab !== 'my-creations') return;
    if (isHubPhaseOneLoading) return;
    if (hasLoadedOwnedTimelines || loadingOwnedTimelines) return;
    fetchOwnedTimelines();
  }, [
    activeHubTab,
    isHubPhaseOneLoading,
    hasLoadedOwnedTimelines,
    loadingOwnedTimelines,
    fetchOwnedTimelines,
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

  const handleToggleWatchHashtag = React.useCallback(async (timelineId) => {
    if (!(currentUserId > 0)) {
      setUserFollowSnackbarMessage('Please log in to watch this hashtag timeline.');
      setUserFollowSnackbarSeverity('info');
      setUserFollowSnackbarOpen(true);
      return;
    }
    
    const numericId = Number(timelineId);
    const isCurrentlyFollowing = followedHashtagIds.has(numericId);
    
    try {
      if (isCurrentlyFollowing) {
        await unfollowTimeline(numericId);
        setFollowedHashtagIds((prev) => {
          const next = new Set(prev);
          next.delete(numericId);
          return next;
        });
        setYourPageTimelines((prev) => prev.filter((t) => Number(t.id) !== numericId));
        setUserFollowSnackbarMessage('Removed from your watched hashtags.');
      } else {
        await followTimeline(numericId, 'watch');
        setFollowedHashtagIds((prev) => {
          const next = new Set(prev);
          next.add(numericId);
          return next;
        });
        
        const known = normalizedTimelines.find((t) => Number(t.id) === numericId);
        if (known) {
          setYourPageTimelines((prev) => {
            const exists = prev.some((t) => Number(t.id) === numericId);
            if (exists) return prev;
            return [...prev, { ...known, timeline_type: 'hashtag', followed_at: new Date().toISOString() }].sort((a, b) => {
              const typeA = String(a?.timeline_type || 'hashtag').toLowerCase();
              const typeB = String(b?.timeline_type || 'hashtag').toLowerCase();
              const weightA = typeA === 'personal' ? 1 : typeA === 'community' ? 2 : 3;
              const weightB = typeB === 'personal' ? 1 : typeB === 'community' ? 2 : 3;
              if (weightA !== weightB) return weightA - weightB;
              return new Date(b?.created_at || 0) - new Date(a?.created_at || 0);
            });
          });
        }
        setUserFollowSnackbarMessage('Added to your watched hashtags.');
      }
      setUserFollowSnackbarSeverity('success');
      setUserFollowSnackbarOpen(true);
      window.dispatchEvent(new CustomEvent('refresh-timeline-events'));
    } catch (error) {
      console.error('Error toggling watch status:', error);
      setUserFollowSnackbarMessage('Failed to update watch status.');
      setUserFollowSnackbarSeverity('error');
      setUserFollowSnackbarOpen(true);
    }
  }, [currentUserId, followedHashtagIds, normalizedTimelines]);

  // Edit event handlers (defined early to avoid temporal dead zone in renderSearchEventCard)
  const handleEdit = React.useCallback(async (event) => {
    if (!event?.id) return;
    try {
      const response = await api.get(`/api/v1/events/${event.id}`);
      const canonicalEvent = response?.data;
      if (!canonicalEvent?.id) {
        setUserFollowSnackbarMessage('Unable to load event for editing');
        setUserFollowSnackbarSeverity('error');
        setUserFollowSnackbarOpen(true);
        return;
      }
      if (canonicalEvent?.edit_permissions && canonicalEvent.edit_permissions.can_edit === false) {
        setUserFollowSnackbarMessage('You do not have permission to edit this event');
        setUserFollowSnackbarSeverity('error');
        setUserFollowSnackbarOpen(true);
        return;
      }
      setEditingEvent(canonicalEvent);
      setEditDialogOpen(true);
    } catch (error) {
      console.warn('[HomePage] Failed to load event for edit:', error);
      setUserFollowSnackbarMessage('Failed to load event editor');
      setUserFollowSnackbarSeverity('error');
      setUserFollowSnackbarOpen(true);
    }
  }, []);

  const handleDelete = React.useCallback(async (eventOrId) => {
    try {
      const resolvedEvent = typeof eventOrId === 'object' ? eventOrId : null;
      const resolvedEventId = resolvedEvent ? resolvedEvent.id : eventOrId;
      if (!resolvedEventId) {
        throw new Error('Missing event id for deletion');
      }

      await api.delete(`/api/v1/events/${resolvedEventId}`);

      const filterOutDeleted = (eventsList) =>
        (eventsList || []).filter(e => e.id !== resolvedEventId);

      setPopularEvents(filterOutDeleted);
      setYourPageEvents(filterOutDeleted);
      setFavoriteTimelineEvents(filterOutDeleted);
      setSearchEvents(filterOutDeleted);
      setMyCreationEvents(filterOutDeleted);

      setUserFollowSnackbarMessage('Event deleted successfully');
      setUserFollowSnackbarSeverity('success');
      setUserFollowSnackbarOpen(true);
    } catch (error) {
      logError('Error deleting event', error);
      setUserFollowSnackbarMessage('Failed to delete event');
      setUserFollowSnackbarSeverity('error');
      setUserFollowSnackbarOpen(true);
    }
  }, []);

  const handleCloseEditDialog = React.useCallback(() => {
    if (editSubmitLoading) return;
    setEditDialogOpen(false);
    setEditingEvent(null);
  }, [editSubmitLoading]);

  const handleSubmitEdit = React.useCallback(async (eventData) => {
    if (!editingEvent?.id || !editingEvent?.timeline_id) {
      setUserFollowSnackbarMessage('Missing event data for update');
      setUserFollowSnackbarSeverity('error');
      setUserFollowSnackbarOpen(true);
      return;
    }
    try {
      setEditSubmitLoading(true);
      // Filter to only fields accepted by backend patchSchema
      const allowedFields = [
        'title', 'description', 'content_json', 'event_date', 'raw_event_date',
        'url', 'url_title', 'url_description', 'url_image',
        'media_key', 'media_type', 'media_subtype', 'is_exact_user_time', 'edit_locked',
        'is_blurred', 'tags', 'remove_association_ids'
      ];
      const patchPayload = {};
      for (const key of allowedFields) {
        if (Object.prototype.hasOwnProperty.call(eventData, key)) {
          patchPayload[key] = eventData[key];
        }
      }
      await api.patch(`/api/v1/events/${editingEvent.id}`, patchPayload);
      setUserFollowSnackbarMessage('Event updated successfully');
      setUserFollowSnackbarSeverity('success');
      setUserFollowSnackbarOpen(true);
      setEditDialogOpen(false);
      setEditingEvent(null);
      // Refresh hero popup event if it's the same one
      if (heroEventPopupEvent?.id === editingEvent?.id) {
        const refreshed = await api.get(`/api/v1/events/${editingEvent.id}`);
        if (refreshed?.data?.id) {
          setHeroEventPopupEvent(refreshed.data);
        }
      }
    } catch (error) {
      let message = 'Failed to update event.';
      const responseData = error?.response?.data;
      if (responseData?.error?.message) {
        message = responseData.error.message;
      } else if (typeof responseData?.error === 'string') {
        message = responseData.error;
      } else if (responseData?.message) {
        message = responseData.message;
      } else if (error?.message) {
        message = error.message;
      }
      setUserFollowSnackbarMessage(message);
      setUserFollowSnackbarSeverity('error');
      setUserFollowSnackbarOpen(true);
    } finally {
      setEditSubmitLoading(false);
    }
  }, [editingEvent, heroEventPopupEvent?.id]);

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

    return (
      <EventCard
        event={event}
        variant="home"
        onEdit={handleEdit}
        onDelete={handleDelete}
        onMediaLoadError={handleMediaLoadError}
      />
    );
  }, [handleEdit, handleDelete]);



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

    if (user?.id && yourPageTimelines.length === 0) {
      fetchYourPageTimelinesOnly();
    }
  }, [fetchYourPageTimelinesOnly, yourPageTimelines.length, user?.id]);

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

    let createdTimeline = null;
    try {
      const response = await api.post('/api/v1/timelines', {
        name: normalizedName,
        description: desiredType === 'personal'
          ? `${displayUsername(usernameBase)}'s personal timeline`
          : `${displayUsername(usernameBase)}'s public posting timeline`,
        type: desiredType,
        visibility: postVisibility === 'private' ? 'private' : 'public',
      });
      createdTimeline = response?.data || null;
    } catch (createErr) {
      const errCode = createErr?.response?.data?.error?.code || '';
      const status = createErr?.response?.status;
      if (desiredType === 'hashtag' && (status === 409 || errCode === 'CONFLICT' || errCode === 'NAME_BLOCKED')) {
        const slug = usernameBase.toLowerCase();
        const slugResp = await api.get(`/api/v1/timelines/by-slug/${slug}`);
        const found = slugResp?.data;
        if (found?.id) {
          setTimelines((prev) => prev.some((t) => t.id === found.id) ? prev : [found, ...prev]);
          return found;
        }
      }
      throw createErr;
    }

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

      await api.post('/api/v1/events', {
        title: eventData?.title || '',
        description: eventData?.description || undefined,
        type: eventData?.type || undefined,
        event_date: eventData?.event_date || new Date().toISOString().slice(0, 10),
        raw_event_date: eventData?.raw_event_date || null,
        is_exact_user_time: eventData?.is_exact_user_time !== false,
        url: eventData?.url || null,
        url_title: eventData?.url_title || null,
        url_description: eventData?.url_description || null,
        url_image: eventData?.url_image || null,
        media_key: eventData?.media_key || eventData?.cloudinary_id || null,
        media_type: eventData?.media_type || null,
        media_subtype: eventData?.media_subtype || null,
        timeline_id: targetTimelineId,
        tags: Array.isArray(eventData?.tags) ? eventData.tags : [],
        is_blurred: eventData?.is_blurred || false,
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
      // Handle Zod validation errors from backend (Hono zValidator format)
      let message = 'Failed to create post.';
      const responseData = error?.response?.data;
      const zodError = responseData?.error || responseData;
      if (zodError?.issues && Array.isArray(zodError.issues)) {
        // Zod validation error - extract readable messages
        message = zodError.issues.map(i => i.message || String(i.path?.join('.') || 'Field') + ' is invalid').join('; ');
      } else if (typeof responseData?.error === 'string') {
        message = responseData.error;
      } else if (responseData?.message) {
        message = responseData.message;
      } else if (error?.message) {
        message = error.message;
      }
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

  const handleSearchSubmit = React.useCallback((forcedQuery = null, immediate = false) => {
    const nextQuery = typeof forcedQuery === 'string' ? forcedQuery.trim() : timelineSearchInput.trim();
    setIsSearchSubmitting(true);
    setIsSearchResultsVisible(false);
    setIsSearchLoadingVisual(true);

    if (searchSubmitTimeoutRef.current) {
      window.clearTimeout(searchSubmitTimeoutRef.current);
    }
    if (searchRevealTimeoutRef.current) {
      window.clearTimeout(searchRevealTimeoutRef.current);
    }

    const delay = immediate ? 0 : SEARCH_SUBMIT_DELAY_MS;

    searchSubmitTimeoutRef.current = window.setTimeout(async () => {
      const startTime = Date.now();
      try {
        if (nextQuery.length > 0) {
          const promises = [fetchExploreDossier(nextQuery)];
          if (isPostSearchScope) {
            promises.push(fetchSearchPosts(nextQuery));
          } else if (isUserSearchScope) {
            promises.push(fetchSearchUsers(nextQuery));
          }
          await Promise.all(promises);
        } else {
          setExploreDossier(null);
          setSearchEvents([]);
          setSearchUsers([]);
        }
      } catch (error) {
        logError('Error submitting search', error);
      }

      setTimelineSearch(nextQuery);
      setVisibleTimelineCount(HOME_LIST_BATCH_SIZE);
      if (resultsScrollRef.current) {
        resultsScrollRef.current.scrollTop = 0;
      }

      const elapsed = Date.now() - startTime;
      const minDuration = 550; // enforce 550ms minimum visual loader window to prevent flickering
      const remaining = Math.max(minDuration - elapsed, 0);

      window.setTimeout(() => {
        setIsSearchResultsVisible(true);
        setIsSearchLoadingVisual(false);

        searchRevealTimeoutRef.current = window.setTimeout(() => {
          setIsSearchSubmitting(false);
        }, SEARCH_RESULT_HANDOFF_MS);
      }, remaining);
    }, delay);
  }, [
    timelineSearchInput,
    isExploreSearchScope,
    isPostSearchScope,
    isUserSearchScope,
    fetchExploreDossier,
    fetchSearchPosts,
    fetchSearchUsers,
    logError,
  ]);

  const handleClearSearch = React.useCallback(() => {
    if (searchSubmitTimeoutRef.current) {
      window.clearTimeout(searchSubmitTimeoutRef.current);
    }
    if (searchRevealTimeoutRef.current) {
      window.clearTimeout(searchRevealTimeoutRef.current);
    }
    setTimelineSearchInput('');
    setTimelineSearch('');
    setExploreDossier(null);
    setSearchEvents([]);
    setSearchUsers([]);
    setIsSearchSubmitting(false);
    setIsSearchResultsVisible(true);
    setVisibleTimelineCount(HOME_LIST_BATCH_SIZE);
    if (resultsScrollRef.current) {
      resultsScrollRef.current.scrollTop = 0;
    }
  }, []);

  React.useEffect(() => {
    const fetchTrending = async () => {
      try {
        setLoadingTrending(true);
        const res = await api.get('/api/v1/search/trending-tags');
        setTrendingTags(res?.data?.tags || []);
      } catch (err) {
        logError('Error fetching trending tags', err);
      } finally {
        setLoadingTrending(false);
      }
    };
    fetchTrending();
  }, []);

  React.useEffect(() => {
    if (activeHubTab === 'timeline-search' && timelineSearch.trim().length > 0) {
      handleSearchSubmit(timelineSearch, true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchSubFilter, activeHubTab, timelineSearch]);

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
      setUserFollowSnackbarMessage('Please enter a timeline name');
      setUserFollowSnackbarSeverity('warning');
      setUserFollowSnackbarOpen(true);
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
        setUserFollowSnackbarMessage(`Timeline "${existingTimeline.name || normalizedName}" already exists. Taking you there now.`);
        setUserFollowSnackbarSeverity('info');
        setUserFollowSnackbarOpen(true);
        navigate(`/timeline-v3/${existingTimeline.id}`);
        return;
      }

      const response = await api.post('/api/v1/timelines', {
        name: normalizedName,
        description: formData.description.trim(),
        type,
        visibility: formData.visibility,
      });

      setTimelines((prev) => [response.data, ...prev]);
      handleDialogClose();
      navigate(`/timeline-v3/${response.data.id}`);
    } catch (error) {
      setTimelineCreateError(true);
      setTimeout(() => setTimelineCreateError(false), 1000);
      logError('Error creating timeline', error);
      setLoading(false);
    }
  };

  const hubActions = React.useMemo(() => [
    {
      key: 'feedback',
      tooltip: 'Submit Feedback',
      icon: <HowToVoteIcon />,
      onClick: () => window.open('https://forms.gle/JyKcWfLKy3a7wJgc6', '_blank'),
      accent: { dark: '#94A3B8', light: '#A5B4FC' },
    },
    !isGuest && !user?.is_restricted && {
      key: 'create-timeline',
      tooltip: 'Create Your Timeline',
      icon: <TimelineMarkerIcon />,
      onClick: () => setDialogOpen(true),
      accent: { dark: '#4FC3F7', light: '#039BE5' },
    },
    !isGuest && !user?.is_restricted && {
      key: 'make-post',
      tooltip: 'Make a Post',
      icon: <EventIcon />,
      onClick: handleOpenMakePostDialog,
      accent: { dark: '#69F0AE', light: '#00CFA1' },
    },
  ].filter(Boolean), [isGuest, user?.is_restricted, handleOpenMakePostDialog, setDialogOpen]);

  const isExpandedHeight = (heroVisualPhase === 'expanded' || heroVisualPhase === 'closing_curtains' || heroVisualPhase === 'opening_curtains' || heroVisualPhase === 'expanding');
  const isCurtainClosed = (heroVisualPhase === 'minimized' || heroVisualPhase === 'expanding' || heroVisualPhase === 'closing_curtains' || heroVisualPhase === 'shrinking');

  return (
    <>
      <GlobalStyles styles={{ 'html, body': { background: appCanvasBackground } }} />
      <AnimatePresence>
        {(pageLoading || initialLoading) && (
          <motion.div
            key="homepage-loader-overlay"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 9999,
            }}
          >
            <LoadingScreen
              message={initialLoading ? null : "Refreshing session and feeds..."}
              isDone={initialLoading ? isInitialLoadDone : isRefreshDone}
              onComplete={() => {
                if (initialLoading) {
                  isInitialAppLoadComplete = true;
                  setInitialLoading(false);
                  setIsInitialLoadDone(false);
                } else {
                  setIsRefreshDone(false);
                  setPageLoading(false);
                }
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
      {/* Hide NavFab behind loading overlay — prevents it bleeding through on mobile */}
      {!initialLoading && !pageLoading && (
        <NavFab
          actions={hubActions}
          expanded={isFabExpanded}
          onToggleExpanded={() => setIsFabExpanded(!isFabExpanded)}
          onCollapse={() => setIsFabExpanded(false)}
          position="left"
          left={24}
          bottom={24}
          containerZIndex={1100}
        />
      )}
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 0,
          background: appCanvasBackground,
          // Suppress paint-through on mobile while loading overlay is active
          visibility: (initialLoading || pageLoading) ? 'hidden' : 'visible',
        }}
      />

      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          maxHeight: '100%',
          pt: isExpandedHeight ? 4 : 1.5,
          px: { xs: 1.5, md: 4 },
          pb: isExpandedHeight ? { xs: 2, md: 3 } : 1,
          position: 'relative',
          zIndex: 1,
          gap: isExpandedHeight ? 2 : 1,
          overflow: 'hidden',
          transition: 'padding 850ms cubic-bezier(0.25, 0.8, 0.25, 1), gap 850ms cubic-bezier(0.25, 0.8, 0.25, 1)',
          // Suppress paint-through on mobile while loading overlay is active
          visibility: (initialLoading || pageLoading) ? 'hidden' : 'visible',
        }}
      >
        <motion.div
          animate={{
            height: isExpandedHeight ? 'auto' : 40,
            borderRadius: isExpandedHeight ? '12px' : '9999px'
          }}
          transition={{ duration: 0.85, ease: [0.25, 0.8, 0.25, 1] }}
          onAnimationComplete={() => {
            if (heroVisualPhase === 'shrinking') {
              setHeroVisualPhase('minimized');
            } else if (heroVisualPhase === 'expanding') {
              setHeroVisualPhase('opening_curtains');
            }
          }}
          style={{ overflow: 'hidden', flexShrink: 0 }}
        >
          <Paper
            elevation={0}
            onClick={handleHeroBannerClick}
            sx={{
              p: isExpandedHeight ? { xs: 2, md: 3 } : 0,
              height: '100%',
              cursor: isExpandedHeight ? 'default' : 'pointer',
              borderRadius: isExpandedHeight ? 3 : '9999px',
              position: 'relative',
              overflow: 'hidden',
              border: '1px solid',
              borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
              backgroundImage: heroVisualStyles.backgroundImage,
              backgroundSize: heroVisualStyles.backgroundSize,
              backgroundPosition: heroVisualStyles.backgroundPosition,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'padding 850ms cubic-bezier(0.25, 0.8, 0.25, 1), border-radius 850ms cubic-bezier(0.25, 0.8, 0.25, 1)',
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
            {/* Theater curtains (left) */}
            <motion.div
              initial={false}
              animate={{ x: isCurtainClosed ? '0%' : '-100%' }}
              transition={{ duration: 0.85, ease: [0.25, 0.8, 0.25, 1] }}
              onAnimationComplete={() => {
                if (heroVisualPhase === 'closing_curtains') {
                  setHeroVisualPhase('shrinking');
                } else if (heroVisualPhase === 'opening_curtains') {
                  setHeroVisualPhase('expanded');
                }
              }}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                bottom: 0,
                width: '50%',
                background: `
                      repeating-linear-gradient(
                        90deg,
                        rgba(255, 255, 255, 0.05) 0px,
                        rgba(255, 255, 255, 0.05) 8px,
                        rgba(0, 0, 0, 0.2) 16px,
                        rgba(0, 0, 0, 0.35) 24px,
                        rgba(0, 0, 0, 0.2) 32px,
                        rgba(255, 255, 255, 0.05) 40px
                      ),
                      linear-gradient(90deg, #500707 0%, #7e0c0c 35%, #b81c1c 70%, #440404 100%)
                    `,
                borderRight: '2px solid rgba(0, 0, 0, 0.6)',
                zIndex: 10,
                boxShadow: 'inset 0 0 20px rgba(0,0,0,0.6)',
                pointerEvents: 'none',
              }}
            />
            {/* Theater curtains (right) */}
            <motion.div
              initial={false}
              animate={{ x: isCurtainClosed ? '0%' : '100%' }}
              transition={{ duration: 0.85, ease: [0.25, 0.8, 0.25, 1] }}
              style={{
                position: 'absolute',
                top: 0,
                right: 0,
                bottom: 0,
                width: '50%',
                background: `
                      repeating-linear-gradient(
                        90deg,
                        rgba(255, 255, 255, 0.05) 0px,
                        rgba(255, 255, 255, 0.05) 8px,
                        rgba(0, 0, 0, 0.2) 16px,
                        rgba(0, 0, 0, 0.35) 24px,
                        rgba(0, 0, 0, 0.2) 32px,
                        rgba(255, 255, 255, 0.05) 40px
                      ),
                      linear-gradient(270deg, #500707 0%, #7e0c0c 35%, #b81c1c 70%, #440404 100%)
                    `,
                borderLeft: '2px solid rgba(0, 0, 0, 0.6)',
                zIndex: 10,
                boxShadow: 'inset 0 0 20px rgba(0,0,0,0.6)',
                pointerEvents: 'none',
              }}
            />

            {/* Tap to Open Spotlight Text */}
            <motion.div
              initial={false}
              animate={{ opacity: (heroVisualPhase === 'minimized' || heroVisualPhase === 'shrinking') ? 1 : 0 }}
              transition={{ duration: 0.3 }}
              style={{
                position: 'absolute',
                zIndex: 20,
                pointerEvents: 'none',
                display: (heroVisualPhase === 'expanded' || heroVisualPhase === 'opening_curtains') ? 'none' : 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span style={{
                color: '#ffd700',
                fontSize: '0.85rem',
                fontWeight: 600,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                textShadow: '0 2px 4px rgba(0,0,0,0.8)',
                background: 'rgba(0,0,0,0.4)',
                padding: '4px 12px',
                borderRadius: '20px',
                border: '1px solid rgba(255, 215, 0, 0.3)',
                backdropFilter: 'blur(3px)',
                whiteSpace: 'nowrap',
              }}>
                🎭 Tap to Open Spotlight
              </span>
            </motion.div>

            {/* Expanded Content Wrapper */}
            <motion.div
              initial={false}
              animate={{
                opacity: (heroVisualPhase === 'expanded' || heroVisualPhase === 'opening_curtains') ? 1 : 0,
                y: (heroVisualPhase === 'expanded' || heroVisualPhase === 'opening_curtains') ? 0 : 10
              }}
              transition={{ duration: 0.3 }}
              style={{
                width: '100%',
                display: (heroVisualPhase === 'minimized') ? 'none' : 'block',
                pointerEvents: (heroVisualPhase === 'expanded') ? 'auto' : 'none',
                position: 'relative',
                zIndex: 1,
              }}
            >
              <Box
                sx={{
                  position: 'relative',
                  zIndex: 1,
                  opacity: isHeroContentVisible ? 1 : 0,
                  transform: isHeroContentVisible ? 'translateY(0px)' : 'translateY(10px)',
                  transition: 'opacity 150ms ease-in-out, transform 150ms ease-in-out',
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
                      {user?.username ? `Welcome Back ${displayUsername(user.username)}!` : 'Welcome to Timeline Forum'}
                    </Typography>
                    <Typography variant="body1" sx={{ mt: 1, opacity: 0.88 }}>
                      {isGuest ? (
                        <>
                          <strong>VIEW</strong> as much as you like! <strong>CREATE</strong> when you actually login.
                        </>
                      ) : user?.is_restricted ? (
                        <>
                          Your account is currently <strong>RESTRICTED</strong>. You can still browse, but posting is disabled.
                        </>
                      ) : (
                        <>
                          <strong>MAKE</strong> a post to save a moment.  <strong>CREATE</strong> a timeline to start a movement.
                        </>
                      )}
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

                {activeHeroSlide?.type === 'welcome' && user && !isGuest && !user?.is_restricted ? (
                  <Stack spacing={1.5} direction={{ xs: 'column', sm: 'row' }} sx={{ mt: 2, justifyContent: 'center' }}>
                    <Button variant="contained" onClick={handleOpenMakePostDialog}>MAKE A POST</Button>
                    <Button
                      variant="outlined"
                      size="small"
                      endIcon={<ArrowForwardIcon sx={{ fontSize: 16 }} />}
                      onClick={() => setDialogOpen(true)}
                      sx={{
                        ...getGlassPillActionButtonSx(theme),
                        px: { xs: 2, sm: 3 },
                        py: { xs: 0.75, sm: 1 },
                        fontSize: { xs: '0.75rem', sm: '0.875rem' }
                      }}
                    >
                      Create Your Timeline
                    </Button>
                  </Stack>
                ) : null}

                {activeHeroSlide?.type === 'timeline_spotlight' && spotlightTimeline ? (
                  <Stack direction={{ xs: 'row', sm: 'row' }} spacing={{ xs: 1, sm: 1.5 }} sx={{ mt: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                    <Chip label={spotlightTimelineTypeLabel} variant="outlined" size="small" sx={{ fontSize: '0.7rem' }} />
                    <Chip
                      icon={<LocalFireDepartmentIcon sx={{ color: '#d97706 !important' }} />}
                      label={`${spotlightTimelineAudience.count.toLocaleString()} ${spotlightTimelineAudience.label}`}
                      variant="outlined"
                      size="small"
                      sx={{ fontSize: '0.7rem' }}
                    />
                    <Chip label={`Created ${formatDate(spotlightTimeline.created_at)}`} variant="outlined" size="small" sx={{ fontSize: '0.7rem' }} />
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => navigate(`/timeline-v3/${spotlightTimeline.id}`)}
                      sx={{ borderRadius: 999, textTransform: 'none', px: 2, fontSize: '0.75rem' }}
                    >
                      Open Random Timeline
                    </Button>
                  </Stack>
                ) : null}

                {activeHeroSlide?.type === 'trending_community' && trendingCommunityTimeline ? (
                  <Stack direction={{ xs: 'row', sm: 'row' }} spacing={{ xs: 1, sm: 1.5 }} sx={{ mt: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                    <Chip label="Community Timeline" variant="outlined" size="small" sx={{ fontSize: '0.7rem' }} />
                    <Chip
                      icon={<LocalFireDepartmentIcon sx={{ color: '#d97706 !important' }} />}
                      label={`${trendingCommunityAudience.count.toLocaleString()} ${trendingCommunityAudience.label}`}
                      variant="outlined"
                      size="small"
                      sx={{ fontSize: '0.7rem' }}
                    />
                    <Chip label={`Created ${formatDate(trendingCommunityTimeline.created_at)}`} variant="outlined" size="small" sx={{ fontSize: '0.7rem' }} />
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => navigate(`/timeline-v3/${trendingCommunityTimeline.id}`)}
                      sx={{ borderRadius: 999, textTransform: 'none', px: 2, fontSize: '0.75rem' }}
                    >
                      Open Trending Community
                    </Button>
                  </Stack>
                ) : null}

                {activeHeroSlide?.type === 'event_spotlight' && spotlightEvent ? (
                  <Stack direction={{ xs: 'row', sm: 'row' }} spacing={{ xs: 1, sm: 1.5 }} sx={{ mt: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                    <Button
                      variant="contained"
                      size="small"
                      onClick={handleOpenHeroEventPopup}
                      disabled={heroEventPopupLoading}
                    >
                      {heroEventPopupLoading ? 'Opening...' : 'View Event'}
                    </Button>
                    {spotlightEvent?.timeline_id ? (
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => navigate(`/timeline-v3/${spotlightEvent.timeline_id}`)}
                        sx={{ borderRadius: 999, textTransform: 'none', px: 2, fontSize: '0.75rem' }}
                      >
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
                          window.location.assign(target.href);
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

              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                sx={{
                  mt: 2,
                  position: 'relative',
                  zIndex: 1,
                  opacity: 1,
                  height: 'auto',
                  overflow: 'hidden',
                  pointerEvents: 'auto',
                  transition: 'opacity 150ms ease-in-out, height 150ms ease-in-out, margin 150ms ease-in-out',
                }}
              >
                {enabledHeroSlides.map((_slide, dotIndex) => {
                  const isActive = dotIndex === heroIndex;
                  return (
                    <Box
                      key={dotIndex}
                      component="span"
                      role="button"
                      tabIndex={0}
                      onClick={() => !heroTransitionPending && transitionToHeroSlide(dotIndex)}
                      onKeyDown={(e) => {
                        if (!heroTransitionPending && (e.key === 'Enter' || e.key === ' ')) {
                          e.preventDefault();
                          transitionToHeroSlide(dotIndex);
                        }
                      }}
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
            </motion.div>
          </Paper>
        </motion.div>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '48px minmax(0, 1fr)', md: '68px minmax(0, 1fr)' },
            gap: { xs: 0.5, md: 2 },
            flex: 1,
            minHeight: 0,
            alignItems: 'stretch',
            zIndex: 100,
          }}
        >
          <Paper
            elevation={0}
            sx={{
              borderRadius: 3,
              p: { xs: 0.75, md: 1.25 },
              display: 'flex',
              flexDirection: 'column',
              border: '1px solid',
              borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(28,39,60,0.24)',
              background: theme.palette.mode === 'dark'
                ? 'rgba(10,12,20,0.72)'
                : 'linear-gradient(170deg, rgba(255,215,190,0.86) 0%, rgba(255,238,214,0.92) 40%, rgba(242,231,214,0.95) 100%)',
              boxShadow: theme.palette.mode === 'dark' ? 'none' : '0 14px 28px rgba(88, 58, 38, 0.12)',
              width: { xs: '48px', md: 'auto' },
              transition: 'width 300ms cubic-bezier(0.4, 0, 0.2, 1)',
              scrollbarWidth: 'none',
              '&::-webkit-scrollbar': { display: 'none' },
              overflow: 'visible',
              zIndex: 10,
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
                    startIcon={
                      <Box sx={{ position: 'relative', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <AnimatePresence mode="wait" initial={false}>
                          {(isActive && showActiveHubScrollTop) ? (
                            <motion.div
                              key="scroll-top"
                              initial={{ y: 12, opacity: 0 }}
                              animate={{ y: 0, opacity: 1 }}
                              exit={{ y: 12, opacity: 0 }}
                              transition={{ duration: 0.22, ease: "easeOut" }}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: 24,
                                height: 24,
                                borderRadius: '50%',
                                background: 'rgba(255, 255, 255, 0.2)',
                                border: '1px solid rgba(255, 255, 255, 0.3)',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                              }}
                            >
                              <NorthIcon sx={{ fontSize: 13, fontWeight: 900, color: 'common.white' }} />
                            </motion.div>
                          ) : (
                            <motion.div
                              key="default-icon"
                              initial={{ y: -12, opacity: 0 }}
                              animate={{ y: 0, opacity: 1 }}
                              exit={{ y: -12, opacity: 0 }}
                              transition={{ duration: 0.22, ease: "easeOut" }}
                              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                              <Icon fontSize="small" />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </Box>
                    }
                    variant={isActive ? 'contained' : 'text'}
                    onClick={(e) => {
                      if (isActive && showActiveHubScrollTop) {
                        handleScrollActiveHubToTop(e);
                      } else {
                        transitionToHubTab(tab.key);
                      }
                    }}
                    sx={{
                      justifyContent: (isActive && isHubLabelVisible) ? 'flex-start' : 'center',
                      alignSelf: 'flex-start',
                      borderRadius: 2,
                      minWidth: (isActive && isHubLabelVisible) ? { xs: 210, sm: 200 } : { xs: 32, sm: 50 },
                      width: (isActive && isHubLabelVisible) ? { xs: 210, sm: 200 } : { xs: 32, sm: 50 },
                      height: 42,
                      px: (isActive && isHubLabelVisible) ? 1.5 : 0,
                      '& .MuiButton-startIcon': {
                        mr: (isActive && isHubLabelVisible) ? 1 : 0,
                        ml: (isActive && isHubLabelVisible) ? 0 : 0.2,
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
                      transformOrigin: 'left center',
                      whiteSpace: 'nowrap',
                      transition: 'width 350ms cubic-bezier(0.25, 0.8, 0.25, 1), min-width 350ms cubic-bezier(0.25, 0.8, 0.25, 1), background-color 250ms ease, box-shadow 300ms ease',
                      zIndex: isActive ? 2 : 1,
                      boxShadow: isActive ? '0 6px 16px rgba(37, 99, 235, 0.35)' : 'none',
                    }}
                  >
                    <Box
                      component="span"
                      sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        overflow: 'hidden',
                        whiteSpace: 'nowrap',
                        width: 'auto',
                        maxWidth: (isActive && isHubLabelVisible) ? '180px' : '0px',
                        opacity: (isActive && isHubLabelVisible) ? 1 : 0,
                        ml: (isActive && isHubLabelVisible) ? 1.25 : 0,
                        transition: 'max-width 350ms cubic-bezier(0.25, 0.8, 0.25, 1), opacity 250ms ease, ml 350ms cubic-bezier(0.25, 0.8, 0.25, 1)',
                        fontWeight: 700,
                        fontSize: '0.82rem',
                      }}
                    >
                      {tab.label}
                    </Box>


                  </Button>
                );
              })}

              {/* Load More Button - Integrated into Stack for better positioning */}
              <Box sx={{ pt: 1, display: 'flex', justifyContent: 'center' }}>
                <Button
                  aria-label="LOAD MORE"
                  variant="text"
                  onClick={handleLoadMoreFromLeftHub}
                  sx={{
                    justifyContent: 'center',
                    borderRadius: '50%',
                    minWidth: { xs: 32, sm: 42 },
                    width: { xs: 32, sm: 42 },
                    height: { xs: 32, sm: 42 },
                    px: 0,
                    color: 'text.primary',
                    border: '1px solid',
                    borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.68)',
                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.56)',
                    opacity: showActiveHubLoadMore ? 1 : 0,
                    transform: showActiveHubLoadMore ? 'translateY(0px) scale(1)' : 'translateY(4px) scale(0.9)',
                    pointerEvents: showActiveHubLoadMore ? 'auto' : 'none',
                    transition: 'opacity 220ms ease, transform 220ms ease, background 200ms ease, width 300ms ease',
                    '&:hover': {
                      bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.72)',
                    },
                  }}
                >
                  <NorthIcon sx={{ fontSize: 13, fontWeight: 900, transform: 'rotate(180deg)' }} />
                </Button>
              </Box>
            </Stack>
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
              overflowY: 'hidden',
              minWidth: 0,
              zIndex: 1,
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
                    Your created timelines and your authored posts.
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
                        loadingOwnedTimelines ? (
                          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                            <CircularProgress />
                          </Box>
                        ) : (
                          <Box>
                            <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 0.8 }}>
                              Created Timelines ({ownedTimelinesServer.length})
                            </Typography>
                            {ownedTimelinesServer.length > 0 ? (
                              <Stack spacing={1.5} sx={{ mt: 0.75 }}>
                                {ownedTimelinesServer.map((timeline, index) => (
                                  <TimelineCard
                                    key={`owned-timeline-${timeline?.id || timeline?.name || index}`}
                                    timeline={timeline}
                                    sections={HOME_TIMELINE_CARD_SECTIONS}
                                    allowFavoriteToggle
                                    isFavoriteTimeline={Number(timeline?.id || 0) > 0 && favoriteTimelineId === Number(timeline?.id || 0)}
                                    onToggleFavorite={handleToggleFavoriteTimeline}
                                    onOpenTimeline={handleOpenTimelineCard}
                                    formatDate={formatDate}
                                    allowWatchToggle
                                    isWatched={followedHashtagIds.has(Number(timeline?.id || 0))}
                                    onToggleWatch={handleToggleWatchHashtag}
                                  />
                                ))}
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
                          {visiblePopularTimelines.map((timeline, index) => (
                            <TimelineCard
                              key={`popular-timeline-${timeline?.id || timeline?.name || index}`}
                              timeline={timeline}
                              sections={HOME_TIMELINE_CARD_SECTIONS}
                              allowFavoriteToggle
                              isFavoriteTimeline={Number(timeline?.id || 0) > 0 && favoriteTimelineId === Number(timeline?.id || 0)}
                              onToggleFavorite={handleToggleFavoriteTimeline}
                              onOpenTimeline={handleOpenTimelineCard}
                              formatDate={formatDate}
                              allowWatchToggle
                              isWatched={followedHashtagIds.has(Number(timeline?.id || 0))}
                              onToggleWatch={handleToggleWatchHashtag}
                            />
                          ))}
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

                  {loadingYourPage || !hasLoadedYourPage ? (
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
                          {visibleYourPageTimelines.map((timeline, index) => (
                            <TimelineCard
                              key={`your-page-timeline-${timeline?.id || timeline?.name || index}`}
                              timeline={timeline}
                              sections={HOME_TIMELINE_CARD_SECTIONS}
                              allowFavoriteToggle
                              isFavoriteTimeline={Number(timeline?.id || 0) > 0 && favoriteTimelineId === Number(timeline?.id || 0)}
                              onToggleFavorite={handleToggleFavoriteTimeline}
                              onOpenTimeline={handleOpenTimelineCard}
                              formatDate={formatDate}
                              allowWatchToggle
                              isWatched={followedHashtagIds.has(Number(timeline?.id || 0))}
                              onToggleWatch={handleToggleWatchHashtag}
                            />
                          ))}
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
                        {selectedFavoriteTimeline?.name
                          ? (() => {
                              const _type = String(selectedFavoriteTimeline?.timeline_type || 'hashtag').toLowerCase();
                              const _name = String(selectedFavoriteTimeline?.name || '').trim();
                              const _prefix = _type === 'community' ? 'i-' : _type === 'personal' ? 'My-' : '#';
                              return `${_prefix}${_name}`;
                            })()
                          : 'Favorite Timeline'}
                      </Typography>
                      {!selectedFavoriteTimeline?.name && (
                        <Typography color="text.secondary">
                          This tab is bound to your one selected favorite timeline and its recent posts.
                        </Typography>
                      )}
                    </Box>
                    {selectedFavoriteTimeline?.id ? (
                      <Stack direction="row" spacing={1}>
                        <Button
                          variant="contained"
                          onClick={handleOpenFavoritePostDialog}
                          sx={{ whiteSpace: 'nowrap' }}
                        >
                          Create Post
                        </Button>
                        <Button
                          variant="outlined"
                          onClick={() => navigate(`/timeline-v3/${selectedFavoriteTimeline.id}`)}
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
                      const prefixedTitle = timelineType === 'personal'
                        ? `${titlePrefix}${displayUsername(timelineName)}`
                        : `${titlePrefix}${timelineName}`;
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
                      const coverLandscapePosition = {
                        x: Number(selectedFavoriteTimeline?.cover_landscape_x ?? 50),
                        y: Number(selectedFavoriteTimeline?.cover_landscape_y ?? 50),
                      };
                      const coverPortraitZoom = Number(selectedFavoriteTimeline?.cover_portrait_zoom ?? 1);
                      const coverLandscapeZoom = Number(selectedFavoriteTimeline?.cover_landscape_zoom ?? 1);
                      const coverUploadEnabled = selectedFavoriteTimeline?.cover_upload_enabled !== false;
                      const clampFramePosition = (value, fallback = 50) => {
                        const numeric = Number(value);
                        const safe = Number.isFinite(numeric) ? numeric : Number(fallback);
                        return Math.max(-40, Math.min(140, safe));
                      };
                      const clampZoom = (value) => Math.max(1, Math.min(4.875, Number(value) || 1));
                      const getCoverTranslate = (value) => (clampFramePosition(value, 50) - 50) * 0.9;
                      const coverPortraitTransform = `translate(${getCoverTranslate(coverPortraitPosition?.x)}%, ${getCoverTranslate(coverPortraitPosition?.y)}%) scale(${coverUploadEnabled ? clampZoom(coverPortraitZoom) : (clampZoom(coverPortraitZoom) + 0.08)})`;
                      const coverLandscapeTransform = `translate(${getCoverTranslate(coverLandscapePosition?.x)}%, ${getCoverTranslate(coverLandscapePosition?.y)}%) scale(${coverUploadEnabled ? clampZoom(coverLandscapeZoom) : (clampZoom(coverLandscapeZoom) + 0.08)})`;
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
                          <TimelineHeroBanner
                            timelineName={prefixedTitle}
                            timelineType={timelineType}
                            coverImageUrl={bannerImageUrl}
                            coverLandscapeX={coverLandscapePosition.x}
                            coverLandscapeY={coverLandscapePosition.y}
                            coverZoom={coverLandscapeZoom}
                            coverUploadEnabled={coverUploadEnabled}
                            isLoading={loadingFavoriteTimelineContext}
                            sx={{ mb: 2 }}
                          />

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
                              gap: { xs: 1.25, md: 2 },
                              gridTemplateColumns: { xs: '1fr', md: '300px 1fr', lg: 'minmax(260px, 33%) minmax(0, 1fr)' },
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
                                {loadingFavoriteTimelineContext || !hasLoadedFavoriteContext ? (
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
                                      width: '100%',
                                      ml: 0,
                                      transform: { xs: 'scale(0.90)', sm: 'none' },
                                      transformOrigin: 'top left',
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
                                      const actionVoteLoading = favoriteVoteLoadingByType[actionType] === true;
                                      return (
                                        <ActionCard
                                          key={`favorite-action-${action.id || action.action_type}`}
                                          action={action}
                                          onVote={() => handleFavoriteActionVote(actionType)}
                                          voteLoading={actionVoteLoading}
                                          displayMode="sidebar"
                                        />
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
                              {loadingFavoriteTimelineEvents || !hasLoadedFavoriteEvents ? (
                                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                                  <CircularProgress size={22} />
                                </Box>
                              ) : favoriteTimelineEvents.length > 0 ? (
                                <Stack spacing={1.5} sx={{ mt: 0.75 }}>
                                  {visibleFavoritePosts.map((event) => (
                                    <Box
                                      key={`favorite-event-${event.id}`}
                                      sx={{
                                        width: '100%',
                                        transform: { xs: 'scale(0.90)', sm: 'none' },
                                        transformOrigin: 'top left',
                                        my: { xs: -1.2, sm: 0 },
                                      }}
                                    >
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
                    Make Friends. Grow a Community!
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
                      {activeFriendsUsers.map((profileUser) => (
                        <UserCard
                          key={`user-${profileUser.id}`}
                          user={profileUser}
                          currentUserId={currentUserId}
                          followedUserIdSet={followedUserIdSet}
                          followActionByUserId={followActionByUserId}
                          onToggleFollow={handleToggleUserFollow}
                        />
                      ))}
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
                        height: 132,
                        width: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                      }}
                    >
                      <Box
                        sx={{
                          mt: 2.5,
                          mb: 1.5,
                          px: 0,
                          width: '100%',
                          maxWidth: '100%',
                          overflowX: 'auto',
                          overflowY: 'hidden',
                          '&::-webkit-scrollbar': {
                            height: '4px',
                          },
                          '&::-webkit-scrollbar-track': {
                            background: 'transparent',
                          },
                          '&::-webkit-scrollbar-thumb': {
                            background: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                            borderRadius: '4px',
                          },
                        }}
                      >
                        <Box
                          sx={{
                            position: 'relative',
                            width: '100%',
                            height: 100,
                            minWidth: hasSearchQuery && trackerItems.length > 0 ? Math.max(trackerItems.length * 85, 340) : '100%',
                            borderBottom: '2px solid rgba(14, 165, 233, 0.45)',
                            display: 'flex',
                            alignItems: 'flex-end',
                            justifyContent: 'space-around',
                            pb: 0,
                          }}
                        >
                          {hasSearchQuery && trackerItems.map((item, idx) => {
                            const stemHeight = 45 - idx * 5;
                            return (
                              <Box
                                key={`tracker-item-${searchSubFilter}-${item.id}-${idx}`}
                                onClick={() => handleTrackerItemClick(item.id)}
                                sx={{
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'center',
                                  position: 'relative',
                                  cursor: 'pointer',
                                  transition: 'all 200ms ease',
                                  '&:hover': {
                                    transform: 'translateY(-2px)',
                                    '& .stem': {
                                      backgroundColor: '#0ea5e9',
                                    },
                                    '& .flag': {
                                      background: 'linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)',
                                      color: '#fff',
                                    },
                                  },
                                }}
                              >
                                <Box
                                  className="flag"
                                  sx={{
                                    fontSize: '0.62rem',
                                    fontWeight: 900,
                                    letterSpacing: 0.5,
                                    textTransform: 'uppercase',
                                    padding: '3px 8px',
                                    borderRadius: 1,
                                    background: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.06)',
                                    border: '1px solid',
                                    borderColor: 'divider',
                                    color: 'text.secondary',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    maxWidth: 120,
                                    transform: 'rotate(-8deg)',
                                    boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                                    [`@keyframes flagFadeIn-${idx}`]: {
                                      '0%': { opacity: 0, transform: 'rotate(-8deg) scale(0.9) translateY(5px)' },
                                      '100%': { opacity: 1, transform: 'rotate(-8deg) scale(1) translateY(0px)' }
                                    },
                                    animation: `flagFadeIn-${idx} 450ms cubic-bezier(0.16, 1, 0.3, 1) forwards`,
                                    animationDelay: `${idx * 50 + 150}ms`,
                                    opacity: 0,
                                    transition: 'all 200ms ease',
                                  }}
                                >
                                  {item.label}
                                </Box>
                                <Box
                                  className="stem"
                                  sx={{
                                    width: 2,
                                    height: stemHeight,
                                    backgroundColor: 'rgba(14, 165, 233, 0.22)',
                                    [`@keyframes stemGrow-${stemHeight}`]: {
                                      '0%': { height: 0, opacity: 0 },
                                      '100%': { height: stemHeight, opacity: 1 }
                                    },
                                    animation: `stemGrow-${stemHeight} 350ms cubic-bezier(0.16, 1, 0.3, 1) forwards`,
                                    animationDelay: `${idx * 50}ms`,
                                    opacity: 0,
                                    transition: 'all 200ms ease',
                                    mt: 0.5,
                                  }}
                                />
                              </Box>
                            );
                          })}
                        </Box>
                      </Box>
                    </Box>

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

                  {/* Hacker Terminal Header & taglines fixed above the scrollable viewport */}
                  {hasSearchQuery && (
                    <Box sx={{ px: 2, pt: 2, pb: 1.5, borderBottom: '1px solid', borderBottomColor: 'divider' }}>
                      {/* Hacker Terminal Header */}
                      <Box sx={{ mb: 1.25, display: 'flex', alignItems: 'center' }}>
                        <Typography
                          variant="h4"
                          sx={{
                            fontFamily: '"Courier New", Courier, monospace',
                            fontWeight: 900,
                            letterSpacing: 3,
                            textTransform: 'uppercase',
                            transform: 'scaleX(1.15)',
                            transformOrigin: 'left center',
                            color: theme.palette.text.primary,
                            display: 'inline-flex',
                            alignItems: 'center',
                          }}
                        >
                          {timelineSearch}
                          <Box
                            component="span"
                            sx={{
                              width: 14,
                              height: 24,
                              backgroundColor: 'currentColor',
                              display: 'inline-block',
                              ml: 1,
                              animation: 'blinkingCursor 1.2s infinite steps(1)',
                              '@keyframes blinkingCursor': {
                                '0%, 100%': { opacity: 1 },
                                '50%': { opacity: 0 },
                              },
                            }}
                          />
                        </Typography>
                      </Box>

                      {/* Sub-Tab Custom Taglines */}
                      <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', opacity: 0.85 }}>
                        {searchSubFilter === 'communities' && `Check out all these Communities relating to "${timelineSearch}"`}
                        {searchSubFilter === 'posts' && `Explore events and moments matching "${timelineSearch}" across time`}
                        {searchSubFilter === 'users' && `What I got on "${timelineSearch}"`}
                        {searchSubFilter === 'explore' && `Everything we got on "${timelineSearch}"`}
                      </Typography>
                    </Box>
                  )}

                  <Box ref={resultsScrollRef} sx={{ p: 2, overflowY: 'auto', flex: 1, minHeight: 0 }} onScroll={handleHubScroll}>
                    <Box sx={{ position: 'relative', minHeight: 120, pb: 4 }}>
                      <Box
                        key={searchSubFilter}
                        sx={{
                          opacity: isSearchResultsVisible ? (isSearchSubmitting ? 0.38 : 1) : 0,
                          transform: isSearchResultsVisible ? 'translateY(0px)' : 'translateY(7px)',
                          filter: isSearchSubmitting ? 'blur(1px)' : 'blur(0px)',
                          transition: 'opacity 320ms ease, transform 320ms ease, filter 220ms ease',
                          pointerEvents: isSearchSubmitting ? 'none' : 'auto',
                          '@keyframes resultsFadeIn': {
                            '0%': { opacity: 0, transform: 'translateY(12px)' },
                            '100%': { opacity: 1, transform: 'translateY(0px)' }
                          },
                          animation: 'resultsFadeIn 350ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
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
                          <Box sx={{ py: 4 }}>
                            <Typography variant="overline" color="text.secondary" sx={{ display: 'block', mb: 2, textAlign: 'center', letterSpacing: 0.8, fontWeight: 700 }}>
                              Explore Trending Tags
                            </Typography>
                            {loadingTrending ? (
                              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress size={24} /></Box>
                            ) : trendingTags.length > 0 ? (
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 2, px: 2, py: 2 }}>
                                {trendingTags.map((tag, idx) => (
                                  <Chip
                                    key={`trending-tag-${tag}`}
                                    label={tag}
                                    onClick={() => {
                                      setTimelineSearchInput(tag);
                                      handleSearchSubmit(tag, true);
                                    }}
                                    sx={{
                                      cursor: 'pointer',
                                      fontWeight: 800,
                                      fontSize: '0.95rem',
                                      px: 1.5,
                                      py: 2.2,
                                      borderRadius: '12px',
                                      color: theme.palette.mode === 'dark' ? '#38bdf8' : '#0369a1',
                                      borderColor: theme.palette.mode === 'dark' ? 'rgba(56, 189, 248, 0.35)' : 'rgba(2, 132, 199, 0.25)',
                                      bgcolor: theme.palette.mode === 'dark' ? 'rgba(56, 189, 248, 0.05)' : 'rgba(2, 132, 199, 0.03)',
                                      boxShadow: theme.palette.mode === 'dark'
                                        ? '0 4px 12px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
                                        : '0 4px 12px rgba(0, 0, 0, 0.04)',
                                      '@keyframes tagFloat': {
                                        '0%, 100%': { transform: 'translateY(0px)' },
                                        '50%': { transform: 'translateY(-7px)' }
                                      },
                                      animation: 'tagFloat 5s ease-in-out infinite',
                                      animationDelay: `${idx * 0.25}s`,
                                      '&:hover': {
                                        bgcolor: theme.palette.mode === 'dark' ? 'rgba(56, 189, 248, 0.18)' : 'rgba(2, 132, 199, 0.12)',
                                        borderColor: theme.palette.mode === 'dark' ? '#38bdf8' : '#0284c7',
                                        color: theme.palette.mode === 'dark' ? '#7dd3fc' : '#0284c7',
                                        animationPlayState: 'paused',
                                        transform: 'translateY(-10px) scale(1.1)',
                                        boxShadow: theme.palette.mode === 'dark'
                                          ? '0 12px 28px rgba(56, 189, 248, 0.35), 0 4px 8px rgba(56, 189, 248, 0.15)'
                                          : '0 12px 28px rgba(2, 132, 199, 0.22), 0 4px 8px rgba(2, 132, 199, 0.1)',
                                      },
                                      transition: 'all 280ms cubic-bezier(0.34, 1.56, 0.64, 1)',
                                    }}
                                    variant="outlined"
                                  />
                                ))}
                              </Box>
                            ) : (
                              <Box sx={{ textAlign: 'center', py: 2 }}>
                                <Typography color="text.secondary" variant="body2">
                                  No trending tags found yet. Enter a search term to begin exploring!
                                </Typography>
                              </Box>
                            )}
                          </Box>
                        ) : isSearchLoadingVisual ? (
                          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
                        ) : (
                          <Box>
                            {/* Main Result Swapper */}
                            {searchSubFilter === 'explore' ? (
                              renderExploreDashboard()
                            ) : (
                              <Stack spacing={2}>
                                {isTimelineSearchScope && visibleTimelines.length > 0 ? (
                                  <Stack spacing={1.5}>
                                    {visibleTimelines.map((timeline, index) => (
                                      <TimelineCard
                                        key={`search-timeline-${timeline?.id || timeline?.name || index}`}
                                        timeline={timeline}
                                        sections={HOME_TIMELINE_CARD_SECTIONS}
                                        allowFavoriteToggle
                                        isFavoriteTimeline={Number(timeline?.id || 0) > 0 && favoriteTimelineId === Number(timeline?.id || 0)}
                                        onToggleFavorite={handleToggleFavoriteTimeline}
                                        onOpenTimeline={handleOpenTimelineCard}
                                        formatDate={formatDate}
                                        allowWatchToggle
                                        isWatched={followedHashtagIds.has(Number(timeline?.id || 0))}
                                        onToggleWatch={handleToggleWatchHashtag}
                                      />
                                    ))}
                                  </Stack>
                                ) : isTimelineSearchScope ? (
                                  <Box sx={{ py: 4, textAlign: 'center' }}>
                                    <Typography color="text.secondary">No communities matched your search.</Typography>
                                  </Box>
                                ) : null}

                                {isPostSearchScope && visiblePosts.length > 0 ? (
                                  <Stack spacing={1.5}>
                                    {visiblePosts.map((item, idx) => (
                                      <Box key={item.searchResultType === 'comment' ? `comment-${item.id}` : `event-${item.id}-${idx}`}>
                                        {item.searchResultType === 'comment' ? (
                                          renderCommentSearchResultCard(item)
                                        ) : (
                                          renderSearchEventCard(item)
                                        )}
                                      </Box>
                                    ))}
                                  </Stack>
                                ) : isPostSearchScope ? (
                                  <Box sx={{ py: 4, textAlign: 'center' }}>
                                    <Typography color="text.secondary">No posts matched your search.</Typography>
                                  </Box>
                                ) : null}

                                {isUserSearchScope && visibleUsers.length > 0 ? (
                                  <Stack spacing={1.25} sx={{ pl: { xs: 3, sm: 4 }, pt: { xs: 2.4, sm: 2.9 } }}>
                                    {visibleUsers.map((profileUser) => (
                                      <UserCard
                                        key={`user-${profileUser.id}`}
                                        user={profileUser}
                                        currentUserId={currentUserId}
                                        followedUserIdSet={followedUserIdSet}
                                        followActionByUserId={followActionByUserId}
                                        onToggleFollow={handleToggleUserFollow}
                                      />
                                    ))}
                                  </Stack>
                                ) : isUserSearchScope ? (
                                  <Box sx={{ py: 4, textAlign: 'center' }}>
                                    <Typography color="text.secondary">No user profiles matched your search.</Typography>
                                  </Box>
                                ) : null}
                              </Stack>
                            )}
                          </Box>
                        )}

                        {hasSearchQuery && !loadingTimelines && !loadingSearchEvents && !loadingSearchUsers && !loadingExplore && (
                          <Box sx={{ height: '70vh', pointerEvents: 'none' }} />
                        )}

                        {(!activeHubCanLoadMore || searchSubFilter === 'explore') && !loadingTimelines && !loadingSearchEvents && !loadingSearchUsers && !loadingExplore && hasSearchQuery ? (
                          <Box sx={{ py: 4, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                            <Typography color="text.secondary">You have reached the end</Typography>

                            {/* Related Tags (Dossier compilation bottom chips) */}
                            {exploreDossier?.related_tags && exploreDossier.related_tags.length > 0 && (
                              <Box sx={{ mt: 2, width: '100%', maxWidth: 460, px: 2 }}>
                                <Typography variant="overline" color="text.secondary" sx={{ display: 'block', mb: 1.5, letterSpacing: 1.2, fontWeight: 800 }}>
                                  Closely Related Tags
                                </Typography>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 1.25 }}>
                                  {exploreDossier.related_tags.map((tag) => (
                                    <Chip
                                      key={`related-tag-${tag}`}
                                      label={tag}
                                      onClick={() => {
                                        setTimelineSearchInput(tag);
                                        handleSearchSubmit(tag, true);
                                      }}
                                      sx={{
                                        cursor: 'pointer',
                                        fontWeight: 800,
                                        fontSize: '0.85rem',
                                        borderRadius: '8px',
                                        color: theme.palette.mode === 'dark' ? '#38bdf8' : '#0284c7',
                                        borderColor: theme.palette.mode === 'dark' ? 'rgba(56, 189, 248, 0.3)' : 'rgba(2, 132, 199, 0.2)',
                                        bgcolor: theme.palette.mode === 'dark' ? 'rgba(56, 189, 248, 0.05)' : 'rgba(2, 132, 199, 0.03)',
                                        '&:hover': {
                                          bgcolor: theme.palette.mode === 'dark' ? 'rgba(56, 189, 248, 0.15)' : 'rgba(2, 132, 199, 0.1)',
                                          borderColor: theme.palette.mode === 'dark' ? '#38bdf8' : '#0284c7',
                                        },
                                        transition: 'all 150ms ease',
                                      }}
                                      variant="outlined"
                                    />
                                  ))}
                                </Box>
                              </Box>
                            )}
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
                    Uses your #{displayUsername(String(user?.username || '').trim()).toUpperCase()} timeline.
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
                    Uses your My-{displayUsername(String(user?.username || '').trim()).toUpperCase()} personal timeline.
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
            onDelete={handleDelete}
            onEdit={handleEdit}
            setIsPopupOpen={() => { }}
            reviewingEventIds={EMPTY_REVIEWING_EVENT_IDS}
          />
        ) : null}

        {/* Edit Event Dialog */}
        <EventDialog
          open={editDialogOpen}
          onClose={handleCloseEditDialog}
          onSave={handleSubmitEdit}
          initialEvent={editingEvent}
          timelineName={editingEvent?.timeline_name || ''}
          timelineType={editingEvent?.timeline_type || 'hashtag'}
          timelineVisibility={editingEvent?.visibility || 'public'}
          mode="edit"
          submitLabel="Save Changes"
          submitLoading={editSubmitLoading}
          submitDisabled={editSubmitLoading}
        />

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
                  className={timelineCreateError ? 'animate-shake' : ''}
                  sx={{
                    mb: 2.2,
                    ...getGlassInputSx(theme),
                    '& .MuiOutlinedInput-root': {
                      transition: 'all 0.3s ease',
                      ...(timelineCreateError && {
                        borderColor: '#ff4757',
                        boxShadow: '0 0 15px rgba(255, 71, 87, 0.4)',
                        borderWidth: '2px'
                      })
                    }
                  }}
                />
                <TextField
                  name="description"
                  label="Info & Rules"
                  placeholder="Describe your timeline's info & rules"
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
