import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import api, { 
  submitUserReport, 
  createModerationAction, 
  updateModerationAction, 
  listModerationActions,
  getFollowedUsers,
  followUser,
  unfollowUser
} from '../utils/api';
import { formatDistanceToNow } from 'date-fns';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  Divider,
  Fade,
  CircularProgress,
  Stack,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  useMediaQuery,
  useTheme as useMuiTheme,
  Button,
  Card,
  CardContent,
  IconButton,
  Snackbar,
  Alert,
  Switch,
  FormControlLabel,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import SettingsIcon from '@mui/icons-material/Settings';
import OutlinedFlagIcon from '@mui/icons-material/OutlinedFlag';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import LockIcon from '@mui/icons-material/Lock';
import HomeIcon from '@mui/icons-material/Home';
import LoginIcon from '@mui/icons-material/Login';
import InfoIcon from '@mui/icons-material/Info';
import KeyboardDoubleArrowDownRoundedIcon from '@mui/icons-material/KeyboardDoubleArrowDownRounded';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PersonRemoveIcon from '@mui/icons-material/PersonRemove';
import { useAuth } from '../contexts/AuthContext';
import { useEmailBlur } from '../contexts/EmailBlurContext';
import MusicPlayer from './MusicPlayer';
import UserAvatar from './common/UserAvatar';
import NavFab from './timeline-v3/community/NavFab';
import { getTimelineSurfaceTheme } from './timeline-v3/timelineSurfaceTheme';
import TheoryBoardModule from './theory-board/TheoryBoardModule';
import RichContentRenderer from './timeline-v3/events/RichContentRenderer';
import EventPopup from './timeline-v3/events/EventPopup';
import config from '../config';
import {
  getGlassDialogPaperSx,
  getGlassInputSx,
  getGlassSquareActionButtonSx,
  getGlassPillActionButtonSx,
} from '../utils/formStyleGuide';
import { getCachedUserIdentityColor, resolveUserIdentityColor } from '../utils/userIdentityColor';
import { countries, getFlagUrl } from '../utils/countries';
import { displayUsername } from '../utils/usernameDisplay';
import { toRichContentPayload } from '../utils/richContent';

const safeParseJson = (rawValue, fallback) => {
  if (!rawValue || typeof rawValue !== 'string') return fallback;
  try {
    const parsed = JSON.parse(rawValue);
    return parsed !== null && parsed !== undefined ? parsed : fallback;
  } catch {
    return fallback;
  }
};

const PROFILE_MODULE_TYPE_INFO_CARD = 'info_card';
const PROFILE_MODULE_TYPE_TEXTS = 'texts';
const PROFILE_MODULE_TYPE_MAILBOX = 'mailbox';
const PROFILE_MODULE_TYPE_THEORY_BOARD = 'theory_board';
const PROFILE_MODULE_TYPE_CONSPIRACY_BOARD = 'conspiracy_board';
const TEXTS_MODULE_MAX_ITEMS = 50;

const PROFILE_MODULE_TYPE_META = {
  [PROFILE_MODULE_TYPE_TEXTS]: { label: 'Texts' },
  [PROFILE_MODULE_TYPE_MAILBOX]: { label: 'Mailbox' },
  [PROFILE_MODULE_TYPE_THEORY_BOARD]: { label: 'Theory Board' },
};

const normalizeProfileModuleType = (type) => {
  const rawType = String(type || '').trim().toLowerCase();
  if (rawType === PROFILE_MODULE_TYPE_INFO_CARD || rawType === PROFILE_MODULE_TYPE_TEXTS) {
    return PROFILE_MODULE_TYPE_TEXTS;
  }
  if (rawType === PROFILE_MODULE_TYPE_MAILBOX) return PROFILE_MODULE_TYPE_MAILBOX;
  if (rawType === PROFILE_MODULE_TYPE_CONSPIRACY_BOARD || rawType === PROFILE_MODULE_TYPE_THEORY_BOARD) {
    return PROFILE_MODULE_TYPE_THEORY_BOARD;
  }
  return PROFILE_MODULE_TYPE_TEXTS;
};

const getProfileModuleTypeLabel = (type) => (
  PROFILE_MODULE_TYPE_META[normalizeProfileModuleType(type)]?.label || 'Texts'
);

const normalizeOverflowMode = (value) => {
  const normalized = String(value || '').trim().toLowerCase();
  return normalized === 'fifo' ? 'fifo' : 'manual';
};

const normalizeTheoryBoardTitleBase = (value) => {
  const compact = String(value || '').replace(/\s+/g, ' ').trim();
  const withoutSuffix = compact.replace(/\s*board$/i, '').trim();
  return withoutSuffix || 'Theory';
};

const formatTheoryBoardTitle = (value) => `${normalizeTheoryBoardTitleBase(value)} Board`;

const normalizeProfileTextEntries = (entries, fallbackAuthor = 'User') => {
  if (!Array.isArray(entries)) return [];
  return entries
    .map((entry, index) => {
      const text = String(entry?.text || '').trim().slice(0, 1200);
      if (!text) return null;
      const authorId = Number(entry?.author_id);
      return {
        id: String(entry?.id || `profile-text-${index + 1}`),
        text,
        author_id: Number.isInteger(authorId) && authorId > 0 ? authorId : null,
        author_username: String(entry?.author_username || fallbackAuthor).trim().slice(0, 80),
        author_avatar_url: entry?.author_avatar_url || null,
        author_is_restricted: Boolean(entry?.author_is_restricted || entry?.is_restricted),
        author_is_suspended: Boolean(entry?.author_is_suspended || entry?.is_suspended),
        author_is_avatar_blurred: Boolean(entry?.author_is_avatar_blurred || entry?.is_avatar_blurred),
        created_at: String(entry?.created_at || '').trim() || null,
      };
    })
    .filter(Boolean);
};

const normalizeProfileModules = (rawModules) => {
  if (!Array.isArray(rawModules)) return [];

  return rawModules
    .map((module, index) => {
      // Handle both new backend format (module_key) and legacy format (type/id)
      const moduleKey = module?.module_key || module?.type || module?.id || '';
      const moduleType = normalizeProfileModuleType(moduleKey);

      // Handle new backend format (config object) or flat legacy format
      const config = module?.config || {};
      const title = String(module?.title || config?.title || '').trim().slice(0, 120);
      const description = String(module?.description || config?.description || '').trim().slice(0, 1200);
      const texts = normalizeProfileTextEntries(module?.texts || config?.texts, title || 'User');

      const hasTheoryBoardPayload = moduleType === PROFILE_MODULE_TYPE_THEORY_BOARD;
      // Never hide the texts module if it's empty, so the owner/visitor can always see the input
      if (!hasTheoryBoardPayload && !title && !description && texts.length === 0 && moduleType !== PROFILE_MODULE_TYPE_TEXTS) return null;

      const moduleOrder = Number.isFinite(Number(module?.position))
        ? Number(module.position)
        : (Number.isFinite(Number(module?.order)) ? Number(module.order) : index);

      const isVisible = module?.enabled !== undefined
        ? Boolean(module.enabled)
        : (module?.is_visible !== undefined ? Boolean(module.is_visible) : true);

      const maxItems = Math.max(1, Math.min(TEXTS_MODULE_MAX_ITEMS, Number(module?.max_items || config?.max_items) || TEXTS_MODULE_MAX_ITEMS));
      const overflowMode = normalizeOverflowMode(module?.overflow_mode || config?.overflow_mode);

      return {
        id: moduleKey,
        module_key: moduleKey,
        type: moduleType,
        title,
        description,
        order: moduleOrder,
        position: moduleOrder,
        is_visible: isVisible,
        enabled: isVisible,
        max_items: maxItems,
        overflow_mode: overflowMode,
        texts,
        config: config
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.order - b.order)
    .map((module, index) => ({
      ...module,
      order: index,
      position: index,
    }));
};

const mergeProfileModules = (newModules, existingModules) => {
  const normalizedNew = normalizeProfileModules(newModules);
  const normalizedExisting = normalizeProfileModules(existingModules);

  if (normalizedNew.length === 0) return normalizedExisting;

  return normalizedNew.map(newMod => {
    const existing = normalizedExisting.find(p => p.module_key === newMod.module_key);

    // Reconciliation: If the new module has no texts but the existing one does, 
    // we preserve the existing texts to avoid a "flash" of empty content.
    const newTexts = newMod.texts || [];
    const existingTexts = existing?.texts || [];

    if (existingTexts.length > 0 && newTexts.length === 0) {
      return { ...newMod, texts: existingTexts };
    }

    return newMod;
  });
};

const Profile = () => {
  const { user, isGuest, loading: authLoading } = useAuth();
  const { userId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const muiTheme = useMuiTheme();
  const isNarrowViewport = useMediaQuery(muiTheme.breakpoints.down('md'));
  const appCanvasBackground = getTimelineSurfaceTheme(theme).canvas;
  const { blurEmail, getBlurredEmail, getPrivacyEmail } = useEmailBlur();
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
  const [profileModules, setProfileModules] = useState([]);
  const [profileTextDraft, setProfileTextDraft] = useState('');
  const [profileTextSubmitting, setProfileTextSubmitting] = useState(false);
  const [profileTextDeletingId, setProfileTextDeletingId] = useState('');
  const [textsEntries, setTextsEntries] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [visibleTextsCount, setVisibleTextsCount] = useState(10);
  const textsContainerRef = React.useRef(null);
  const [isTextsScrolledUp, setIsTextsScrolledUp] = useState(false);
  const [hasNewTexts, setHasNewTexts] = useState(false);
  const [profileModulePopupEvent, setProfileModulePopupEvent] = useState(null);
  const [profileAccessLocked, setProfileAccessLocked] = useState(false);
  const [profileAccessVisibility, setProfileAccessVisibility] = useState('public');
  const [profileAccessMessage, setProfileAccessMessage] = useState('');
  const [showProfileAccessInput, setShowProfileAccessInput] = useState(false);
  const [profileAccessKeyDraft, setProfileAccessKeyDraft] = useState('');
  const [profileAccessSubmitting, setProfileAccessSubmitting] = useState(false);
  const [profileAccessRefreshNonce, setProfileAccessRefreshNonce] = useState(0);
  const [profilePortraitMeta, setProfilePortraitMeta] = useState({
    imageUrl: '',
    x: 50,
    y: 50,
    zoom: 1,
  });
  const [resolvedTargetUserId, setResolvedTargetUserId] = useState(null);
  const [followedUserIdSet, setFollowedUserIdSet] = useState(new Set());
  const [followActionLoading, setFollowActionLoading] = useState(false);

  const normalizedUserIdParam = String(userId || '').trim().toLowerCase();
  const isGuestProfileRoute = normalizedUserIdParam === 'guest';
  const isOwnProfile = isGuestProfileRoute || !userId || (Number(user?.id) > 0 && (userId === user.id.toString() || normalizedUserIdParam === String(user?.username || '').trim().toLowerCase()));
  const queryAccessKey = useMemo(() => {
    const params = new URLSearchParams(location.search || '');
    return String(params.get('access_key') || '').trim();
  }, [location.search]);
  const profileAccessStorageKey = useMemo(() => {
    const currentUserId = Number(user?.id || 0);
    const targetUserId = resolvedTargetUserId || Number(userId || user?.id || 0);
    if (!(currentUserId > 0) || !(targetUserId > 0) || currentUserId === targetUserId) return '';
    return `profile_private_access_${currentUserId}_${targetUserId}`;
  }, [user?.id, userId, resolvedTargetUserId]);
  const cachedOwnUserColor = React.useMemo(() => {
    return isOwnProfile ? getCachedUserIdentityColor(user?.id) : null;
  }, [isOwnProfile, user?.id]);
  const profileIdentityColor = resolveUserIdentityColor(profileUser) || cachedOwnUserColor;
  const profileContainerGlow = profileIdentityColor
    ? `
      0 0 0 1.5px ${alpha(profileIdentityColor, 0.95)},
      0 0 10px ${alpha(profileIdentityColor, 0.55)},
      0 0 24px ${alpha(profileIdentityColor, 0.4)},
      ${theme.palette.mode === 'dark' ? '0 12px 34px rgba(0, 0, 0, 0.42)' : '0 12px 26px rgba(15, 23, 42, 0.16)'}
    `
    : (theme.palette.mode === 'dark'
      ? '0 8px 32px rgba(0, 0, 0, 0.3)'
      : '0 8px 32px rgba(0, 0, 0, 0.1)');
  const canCreateOrReport = Boolean(user) && user?.can_post_or_report !== false;
  const canShowMainProfileActions = Boolean(profileUser?.id);
  const canReportProfile = Boolean(profileUser?.id) && !isOwnProfile && canCreateOrReport && !isGuest && !profileUser?.is_safeguarded;
  const canOpenProfileSettings = Boolean(profileUser?.id) && isOwnProfile;
  const profileModulesStorageKey = useMemo(() => {
    if (!profileUser?.id) return '';
    return `profile_modules_user_${profileUser.id}`;
  }, [profileUser?.id]);
  const profileShareLink = useMemo(() => {
    if (!profileUser?.id) return '';
    return `${config.API_URL}/share/profile/${profileUser.id}`;
  }, [profileUser?.id]);
  const profileShareQrUrl = useMemo(() => {
    if (!profileShareLink) return '';
    return `https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(profileShareLink)}`;
  }, [profileShareLink]);
  const visibleProfileModules = useMemo(
    () => profileModules.filter((module) => module.is_visible !== false),
    [profileModules]
  );
  const textsModule = useMemo(
    () => profileModules.find((module) => normalizeProfileModuleType(module?.type) === PROFILE_MODULE_TYPE_TEXTS) || null,
    [profileModules]
  );
  const visibleTextsModule = useMemo(
    () => (textsModule && textsModule.is_visible !== false ? textsModule : null),
    [textsModule]
  );
  const textsOverflowMode = normalizeOverflowMode(visibleTextsModule?.overflow_mode);
  const textsMaxItems = Math.max(1, Math.min(TEXTS_MODULE_MAX_ITEMS, Number(visibleTextsModule?.max_items) || TEXTS_MODULE_MAX_ITEMS));
  const canWriteToTexts = Boolean(user?.id) && Boolean(visibleTextsModule);
  const canDeleteTexts = Boolean(user?.id) && Number(user?.id) === Number(profileUser?.id);
  const isManualModeAtCap = textsOverflowMode === 'manual' && textsEntries.length >= textsMaxItems;
  const groupedProfileModules = useMemo(() => {
    const grouped = new Map();
    visibleProfileModules.forEach((module) => {
      const type = normalizeProfileModuleType(module?.type);
      if (!grouped.has(type)) grouped.set(type, []);
      grouped.get(type).push(module);
    });
    const moduleTypePriority = {
      [PROFILE_MODULE_TYPE_TEXTS]: 0,
      [PROFILE_MODULE_TYPE_THEORY_BOARD]: 1,
    };
    return Array.from(grouped.entries())
      .map(([type, modules]) => ({ type, modules }))
      .sort((a, b) => {
        const left = Number.isFinite(moduleTypePriority[a.type]) ? moduleTypePriority[a.type] : 99;
        const right = Number.isFinite(moduleTypePriority[b.type]) ? moduleTypePriority[b.type] : 99;
        return left - right;
      });
  }, [visibleProfileModules]);
  const applyTextsModuleUpdate = useCallback((modulePayload) => {
    setProfileModules((previousModules) => {
      const normalizedPrevious = normalizeProfileModules(previousModules);
      const withoutTexts = normalizedPrevious.filter(
        (module) => normalizeProfileModuleType(module?.type) !== PROFILE_MODULE_TYPE_TEXTS
      );
      const nextModules = normalizeProfileModules(
        modulePayload ? [modulePayload, ...withoutTexts] : withoutTexts
      );
      if (profileModulesStorageKey) {
        localStorage.setItem(profileModulesStorageKey, JSON.stringify(nextModules));
      }
      return nextModules;
    });
  }, [profileModulesStorageKey]);
  const fetchProfileTextsModule = useCallback(async (targetUserId) => {
    if (!targetUserId) return;
    try {
      const response = await api.get(`/api/v1/users/${targetUserId}/profile-texts`);
      if (response?.data?.module?.texts) {
        setTextsEntries(normalizeProfileTextEntries(response.data.module.texts, displayUsername(profileUser?.username) || 'User'));
      }
      applyTextsModuleUpdate(response?.data?.module || null);
    } catch (fetchError) {
      console.warn('[Profile] Failed to fetch profile texts module:', fetchError?.response?.data || fetchError?.message || fetchError);
    }
  }, [applyTextsModuleUpdate, profileUser?.username]);
  const handleSubmitProfileText = useCallback(async () => {
    const targetUserId = Number(profileUser?.id || 0);
    const textValue = String(profileTextDraft || '').trim();
    if (!targetUserId || !textValue || !canWriteToTexts || profileTextSubmitting) return;

    try {
      setProfileTextSubmitting(true);
      const response = await api.post(`/api/v1/users/${targetUserId}/profile-texts`, { text: textValue });
      if (response?.data?.module?.texts) {
        setTextsEntries(normalizeProfileTextEntries(response.data.module.texts, displayUsername(profileUser?.username) || 'User'));
      }
      applyTextsModuleUpdate(response?.data?.module || null);
      setProfileTextDraft('');
      setSnackbar({ open: true, message: 'Text sent', severity: 'success' });
    } catch (submitError) {
      const errorCode = submitError?.response?.data?.code;
      const message = errorCode === 'TEXTS_FULL_MANUAL'
        ? 'Texts module is full. Wait for the owner to delete one.'
        : (submitError?.response?.data?.error || submitError?.message || 'Failed to send text');
      setSnackbar({ open: true, message, severity: 'error' });
    } finally {
      setProfileTextSubmitting(false);
    }
  }, [applyTextsModuleUpdate, canWriteToTexts, profileTextDraft, profileTextSubmitting, profileUser?.id]);
  const handleDeleteProfileText = useCallback(async (textId) => {
    const targetUserId = Number(profileUser?.id || 0);
    if (!targetUserId || !textId || !canDeleteTexts || profileTextDeletingId) return;

    try {
      setProfileTextDeletingId(String(textId));
      const response = await api.delete(`/api/v1/users/${targetUserId}/profile-texts/${encodeURIComponent(String(textId))}`);
      if (response?.data?.module?.texts) {
        setTextsEntries(normalizeProfileTextEntries(response.data.module.texts, displayUsername(profileUser?.username) || 'User'));
      }
      applyTextsModuleUpdate(response?.data?.module || null);
      setSnackbar({ open: true, message: 'Text deleted', severity: 'success' });
    } catch (deleteError) {
      const message = deleteError?.response?.data?.error || deleteError?.message || 'Failed to delete text';
      setSnackbar({ open: true, message, severity: 'error' });
    } finally {
      setProfileTextDeletingId('');
    }
  }, [applyTextsModuleUpdate, canDeleteTexts, profileTextDeletingId, profileUser?.id, profileUser?.username]);

  const fetchFollowedUsers = useCallback(async () => {
    if (!user?.id || isGuest) return;
    try {
      const followed = await getFollowedUsers();
      setFollowedUserIdSet(new Set(followed.map(u => u.id)));
    } catch (err) {
      console.error('[Profile] Failed to fetch followed users:', err);
    }
  }, [user?.id, isGuest]);

  useEffect(() => {
    fetchFollowedUsers();
  }, [fetchFollowedUsers]);

  const handleToggleFollow = useCallback(async () => {
    const profileId = Number(profileUser?.id || 0);
    if (!profileId || !user?.id || isGuest || followActionLoading) return;

    try {
      setFollowActionLoading(true);
      const currentlyFollowing = followedUserIdSet.has(profileId);
      
      if (currentlyFollowing) {
        await unfollowUser(profileId);
        setSnackbar({ 
          open: true, 
          message: `Unfollowed ${displayUsername(profileUser.username)}`, 
          severity: 'success' 
        });
      } else {
        await followUser(profileId);
        setSnackbar({ 
          open: true, 
          message: `Following ${displayUsername(profileUser.username)}`, 
          severity: 'success' 
        });
      }
      
      // Refresh followed list
      await fetchFollowedUsers();
    } catch (err) {
      console.error('[Profile] Follow toggle error:', err);
      setSnackbar({ 
        open: true, 
        message: 'Failed to update follow status', 
        severity: 'error' 
      });
    } finally {
      setFollowActionLoading(false);
    }
  }, [profileUser, user?.id, isGuest, followedUserIdSet, followActionLoading, fetchFollowedUsers]);

  const handleTextsScroll = useCallback(() => {
    if (!textsContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = textsContainerRef.current;
    const isScrolledUp = scrollHeight - scrollTop - clientHeight > 50;
    setIsTextsScrolledUp(isScrolledUp);
    if (!isScrolledUp) {
      setHasNewTexts(false);
    }
  }, []);

  const scrollToTextsBottom = useCallback(() => {
    if (textsContainerRef.current) {
      textsContainerRef.current.scrollTo({
        top: textsContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
      setHasNewTexts(false);
    }
  }, []);

  // Auto-scroll to bottom or notify when texts arrive
  useEffect(() => {
    if (textsContainerRef.current) {
      if (!isTextsScrolledUp) {
        textsContainerRef.current.scrollTop = textsContainerRef.current.scrollHeight;
      } else {
        setHasNewTexts(true);
      }
    }
  }, [textsEntries.length, isTextsScrolledUp]);

  const handleOpenProfileModuleEventReference = React.useCallback(async ({ eventId, resolvedEvent }) => {
    const normalizedEventId = Number(eventId || resolvedEvent?.id);
    if (!Number.isFinite(normalizedEventId) || normalizedEventId <= 0) return;

    const fallbackEvent = resolvedEvent?.id ? resolvedEvent : null;
    const resolvedTimelineId = Number(resolvedEvent?.timeline_id || 0);

    if (!(resolvedTimelineId > 0)) {
      if (fallbackEvent) {
        setProfileModulePopupEvent(fallbackEvent);
      }
      return;
    }

    try {
      const response = await api.get(`/api/v1/events/${normalizedEventId}`);
      const fetchedEvent = response?.data;
      if (fetchedEvent?.id) {
        setProfileModulePopupEvent(fetchedEvent);
        return;
      }
    } catch (fetchError) {
      console.warn('[Profile] Failed to fetch full event payload for profile module chip:', fetchError?.response?.data || fetchError?.message || fetchError);
    }

    if (fallbackEvent) {
      setProfileModulePopupEvent(fallbackEvent);
    }
  }, []);
  const clampPortraitFrameValue = (value, fallback = 50) => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return fallback;
    return Math.min(140, Math.max(-40, parsed));
  };
  const clampPortraitZoom = (value, fallback = 1) => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return fallback;
    return Math.min(4.875, Math.max(1, parsed));
  };
  const getPortraitTranslate = (value) => {
    const centered = clampPortraitFrameValue(value, 50) - 50;
    return centered * 0.9;
  };
  const profileShareCardTransform = useMemo(() => {
    const tx = getPortraitTranslate(profilePortraitMeta.x);
    const ty = getPortraitTranslate(profilePortraitMeta.y);
    const safeZoom = clampPortraitZoom(profilePortraitMeta.zoom, 1);
    return `translate(${tx}%, ${ty}%) scale(${safeZoom})`;
  }, [profilePortraitMeta.x, profilePortraitMeta.y, profilePortraitMeta.zoom]);
  const profileFallbackSx = useMemo(() => (
    theme.palette.mode === 'dark'
      ? {
        backgroundImage: [
          'radial-gradient(circle at 22% 18%, rgba(125,211,252,0.34) 0%, rgba(125,211,252,0) 36%)',
          'radial-gradient(circle at 78% 84%, rgba(251,191,36,0.26) 0%, rgba(251,191,36,0) 34%)',
          'linear-gradient(145deg, rgba(13,36,63,0.96) 0%, rgba(20,48,92,0.94) 44%, rgba(65,34,106,0.9) 100%)',
        ].join(', '),
      }
      : {
        backgroundImage: [
          'radial-gradient(circle at 20% 20%, rgba(56,189,248,0.28) 0%, rgba(56,189,248,0) 36%)',
          'radial-gradient(circle at 82% 80%, rgba(251,146,60,0.2) 0%, rgba(251,146,60,0) 34%)',
          'linear-gradient(145deg, rgba(250,232,242,0.94) 0%, rgba(246,232,220,0.96) 68%, rgba(252,238,224,0.98) 100%)',
        ].join(', '),
      }
  ), [theme.palette.mode]);
  const isProfileRestricted = Boolean(profileUser?.is_restricted || profileUser?.is_suspended);
  const profileShareImageUrl = isProfileRestricted
    ? '/images/RESTRICTED_img.png'
    : String(profilePortraitMeta.imageUrl || profileUser?.avatar_url || '').trim();

  const reportCategoryOptions = [
    { value: 'website_policy', label: 'Website policy violation' },
    { value: 'government_policy', label: 'Government policy / legal concern' },
    { value: 'unethical_boundary', label: 'Unethical or harmful boundary' },
  ];

  useEffect(() => {
    if (authLoading) return;
    let active = true;
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        setProfileAccessLocked(false);

        if (isOwnProfile) {
          setProfileAccessMessage('');
          const hasNumericUserId = Number(user?.id) > 0;
          const ownStoredVisibility = hasNumericUserId
            ? String(localStorage.getItem(`profile_visibility_user_${user.id}`) || 'public').trim().toLowerCase()
            : 'public';
          setProfileAccessVisibility(['private', 'key-gated'].includes(ownStoredVisibility) ? 'private' : 'public');

          if (isGuestProfileRoute || isGuest || !hasNumericUserId) {
            if (!active) return;
            setProfileUser({
              id: null,
              username: user?.username || 'Goblin',
              avatar_url: user?.avatar_url || '/images/GUEST_img.png',
              email: null,
              bio: '',
              created_at: null,
              role: 'guest',
            });
            setMusicData({});
            setShowMusic(false);
            return;
          }

          // If viewing own profile, always fetch fresh data from API
          if (user && hasNumericUserId) {
            try {
              const userResponse = await api.get(`/api/v1/users/${user.id}`, {
                params: { access_key: queryAccessKey }
              });
              if (!active) return;
              setProfileUser(userResponse.data);
              const ownApiVisibility = String(userResponse?.data?.profile_visibility || ownStoredVisibility || 'public').trim().toLowerCase();
              const normalizedOwnVisibility = ['private', 'key-gated'].includes(ownApiVisibility) ? 'private' : 'public';
              setProfileAccessVisibility(normalizedOwnVisibility);
              localStorage.setItem(`profile_visibility_user_${user.id}`, normalizedOwnVisibility);
            } catch (userError) {
              if (!active) return;
              console.error('Error fetching own profile data:', userError);
              const formattedUser = {
                ...user,
                created_at: user.created_at && typeof user.created_at === 'string' ? user.created_at : null
              };
              setProfileUser(formattedUser);
            }
          }

          if (hasNumericUserId) {
            try {
              const musicResponse = await api.get('/api/v1/profile/music');
              if (!active) return;
              if (musicResponse.data.music_url || musicResponse.data.music_media_url) {
                setMusicData(musicResponse.data);
                setTimeout(() => {
                  if (active) setShowMusic(true);
                }, 100);
              }
            } catch (musicError) {
              console.error('Error fetching music preferences:', musicError);
            }
          }
        } else {
          let targetUserId = Number(userId || 0);
          if (!(targetUserId > 0)) {
            try {
              const usernameResponse = await api.get(`/api/v1/users/search`, { params: { username: userId } });
              if (!active) return;
              const users = Array.isArray(usernameResponse?.data) ? usernameResponse.data : [];
              if (users.length > 0 && users[0].id) {
                targetUserId = users[0].id;
              } else {
                setError('User profile not found');
                setLoading(false);
                return;
              }
            } catch (err) {
              if (!active) return;
              console.error('Error finding user by username:', err);
              const errMsg = err.response?.data?.error || err.response?.data?.message || 'User profile not found';
              setError(errMsg);
              setLoading(false);
              return;
            }
          }
          if (!active) return;
          setResolvedTargetUserId(targetUserId);

          let accessDecision = null;
          try {
            const accessResponse = await api.get(`/api/v1/users/${targetUserId}/profile-access`);
            if (!active) return;
            accessDecision = accessResponse?.data || null;
          } catch (accessError) {
            if (!active) return;
            console.error('Error fetching profile access state:', accessError);
            setError('Failed to resolve profile access');
            return;
          }

          if (!active) return;
          const visibility = String(accessDecision?.visibility || 'public').toLowerCase();
          setProfileAccessVisibility(['private', 'key-gated'].includes(visibility) ? 'private' : 'public');

          if (!accessDecision?.allowed) {
            let candidateKey = queryAccessKey;
            if (!candidateKey && profileAccessStorageKey) {
              candidateKey = String(localStorage.getItem(profileAccessStorageKey) || '').trim();
            }

            if (candidateKey) {
              try {
                const verifyResponse = await api.post(`/api/v1/users/${targetUserId}/profile-access`, {
                  access_key: candidateKey,
                });
                if (!active) return;
                const verifyDecision = verifyResponse?.data || {};
                if (!verifyDecision?.allowed) {
                  throw new Error('Access denied');
                }
                if (profileAccessStorageKey) {
                  localStorage.setItem(profileAccessStorageKey, candidateKey);
                }
              } catch (verifyError) {
                if (!active) return;
                if (profileAccessStorageKey) {
                  localStorage.removeItem(profileAccessStorageKey);
                }
                setProfileAccessLocked(true);
                setProfileAccessMessage('Access denied. Enter a valid access key.');
                setShowProfileAccessInput(false);
                return;
              }
            } else {
              if (!active) return;
              setProfileAccessLocked(true);
              setProfileAccessMessage('This profile is private. Enter access key to continue.');
              setShowProfileAccessInput(false);
              return;
            }
          }

          if (!active) return;
          setProfileAccessLocked(false);
          setProfileAccessMessage('');

          try {
            const userResponse = await api.get(`/api/v1/users/${targetUserId}`, {
              params: { access_key: queryAccessKey }
            });
            if (!active) return;
            setProfileUser(userResponse.data);

            try {
              const musicResponse = await api.get(`/api/v1/users/${targetUserId}/music`);
              if (!active) return;
              if (musicResponse.data.music_url || musicResponse.data.music_media_url) {
                setMusicData(musicResponse.data);
                setTimeout(() => {
                  if (active) setShowMusic(true);
                }, 100);
              }
            } catch (musicError) {
              console.log('No music data available for this user');
            }
          } catch (userError) {
            if (!active) return;
            console.error('Error fetching user profile:', userError);
            const userErrMsg = userError.response?.data?.error || userError.response?.data?.message || 'User profile not found';
            setError(userErrMsg);
          }
        }
      } catch (error) {
        if (!active) return;
        console.error('Error in profile loading:', error);
        setError('Error loading profile');
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchUserProfile();

    return () => {
      active = false;
      setShowMusic(false);
    };
  }, [userId, user, isOwnProfile, profileAccessRefreshNonce, profileAccessStorageKey, queryAccessKey, authLoading]);

  // Live polling for profile texts
  useEffect(() => {
    if (profileUser?.id) {
      fetchProfileTextsModule(profileUser.id);
      const pollInterval = setInterval(() => {
        fetchProfileTextsModule(profileUser.id);
      }, 15000);
      return () => clearInterval(pollInterval);
    }
  }, [profileUser?.id, fetchProfileTextsModule]);

  // Redirect owner to canonical /profile if they land on /profile/:id
  useEffect(() => {
    if (authLoading) return;
    if (userId && isOwnProfile && !isGuestProfileRoute) {
      console.log(`[Profile] Redirecting owner from /profile/${userId} to canonical /profile`);
      navigate({
        pathname: '/profile',
        search: location.search
      }, { replace: true });
    }
  }, [userId, isOwnProfile, isGuestProfileRoute, navigate, location.search, authLoading]);

  const handleSubmitProfileAccessKey = useCallback(async () => {
    const targetUserId = resolvedTargetUserId || Number(userId || 0);
    const accessKey = String(profileAccessKeyDraft || '').trim();
    if (!(targetUserId > 0) || !accessKey || profileAccessSubmitting) return;

    try {
      setProfileAccessSubmitting(true);
      const response = await api.post(`/api/v1/users/${targetUserId}/profile-access`, {
        access_key: accessKey,
      });
      const decision = response?.data || {};
      if (!decision?.allowed) {
        throw new Error('Access denied');
      }
      if (profileAccessStorageKey) {
        localStorage.setItem(profileAccessStorageKey, accessKey);
      }
      setProfileAccessLocked(false);
      setProfileAccessMessage('');
      setShowProfileAccessInput(false);
      setProfileAccessRefreshNonce((prev) => prev + 1);
    } catch (accessError) {
      setProfileAccessMessage('Access denied. Enter a valid access key.');
    } finally {
      setProfileAccessSubmitting(false);
    }
  }, [profileAccessKeyDraft, profileAccessStorageKey, profileAccessSubmitting, userId]);

  useEffect(() => {
    setFabOpen(false);
    setReportDialogOpen(false);
  }, [userId]);

  useEffect(() => {
    if (!profileUser?.id) return;

    const storageUserId = Number(profileUser.id);
    const apiPortraitX = profileUser.profile_portrait_x;
    const apiPortraitY = profileUser.profile_portrait_y;
    const apiPortraitZoom = profileUser.profile_portrait_zoom;

    const localPortraitUrl = String(localStorage.getItem(`profile_portrait_url_user_${storageUserId}`) || '').trim();
    const localPortraitX = clampPortraitFrameValue(apiPortraitX ?? localStorage.getItem(`profile_portrait_x_user_${storageUserId}`), 50);
    const localPortraitY = clampPortraitFrameValue(apiPortraitY ?? localStorage.getItem(`profile_portrait_y_user_${storageUserId}`), 50);
    const localPortraitZoom = clampPortraitZoom(apiPortraitZoom ?? localStorage.getItem(`profile_portrait_zoom_user_${storageUserId}`), 1);

    setProfilePortraitMeta({
      imageUrl: localPortraitUrl || String(profileUser?.avatar_url || '').trim(),
      x: localPortraitX,
      y: localPortraitY,
      zoom: localPortraitZoom,
    });

    if (profileModulesStorageKey) {
      const cachedModules = normalizeProfileModules(
        safeParseJson(localStorage.getItem(profileModulesStorageKey), [])
      );
      setProfileModules(cachedModules);
    }

    const fetchProfileModulesFromServer = async (tid) => {
      try {
        const response = await api.get(`/api/v1/users/${tid}/profile-modules`, {
          params: { access_key: queryAccessKey }
        });

        // Use functional update to avoid wiping out data from parallel fetchProfileTextsModule
        setProfileModules((prev) => mergeProfileModules(response.data?.modules, prev));

        if (profileModulesStorageKey) {
          localStorage.setItem(profileModulesStorageKey, JSON.stringify(normalizeProfileModules(response.data?.modules)));
        }
      } catch (err) {
        console.warn('[Profile] Failed to fetch profile modules:', err.message);
      }
    };

    fetchProfileModulesFromServer(storageUserId);
    fetchProfileTextsModule(storageUserId);

    if (!isOwnProfile) return;

    let canceled = false;
    const hydrateOwnPortraitFromPassport = async () => {
      try {
        const passportResponse = await api.get('/api/v1/profile/hydrate');
        const prefs = passportResponse?.data?.preferences || {};
        const passportPortraitUrl = String(prefs?.profile_portrait_image_url || '').trim();
        const nextPortrait = {
          imageUrl: passportPortraitUrl || localPortraitUrl || String(profileUser?.avatar_url || '').trim(),
          x: clampPortraitFrameValue(prefs?.profile_portrait_x, localPortraitX),
          y: clampPortraitFrameValue(prefs?.profile_portrait_y, localPortraitY),
          zoom: clampPortraitZoom(prefs?.profile_portrait_zoom, localPortraitZoom),
        };

        if (canceled) return;
        setProfilePortraitMeta(nextPortrait);

        setProfileModules((prev) => mergeProfileModules(passportResponse?.data?.profile_modules, prev));

        localStorage.setItem(`profile_portrait_url_user_${storageUserId}`, nextPortrait.imageUrl);
        localStorage.setItem(`profile_portrait_x_user_${storageUserId}`, String(nextPortrait.x));
        localStorage.setItem(`profile_portrait_y_user_${storageUserId}`, String(nextPortrait.y));
        localStorage.setItem(`profile_portrait_zoom_user_${storageUserId}`, String(nextPortrait.zoom));
        localStorage.setItem(`profile_modules_user_${storageUserId}`, JSON.stringify(normalizedProfileModules));
      } catch (passportError) {
        console.warn('Failed to hydrate profile portrait metadata from passport:', passportError?.response?.data || passportError?.message || passportError);
      }
    };

    hydrateOwnPortraitFromPassport();
    return () => {
      canceled = true;
    };
  }, [profileUser?.id, profileUser?.avatar_url, isOwnProfile, profileModulesStorageKey, fetchProfileTextsModule]);

  const handleCopyProfileLink = async () => {
    if (!profileShareLink) return;
    try {
      await navigator.clipboard.writeText(profileShareLink);
      setSnackbar({ open: true, message: 'Profile link copied', severity: 'success' });
    } catch (_) {
      setSnackbar({ open: true, message: `Copy failed. Link: ${profileShareLink}`, severity: 'info' });
    }
    setFabOpen(false);
  };

  const handleOpenReportDialog = () => {
    setReportCategory('');
    setReportReason('');
    setReportDialogOpen(true);
    setFabOpen(false);
  };

  const handleOpenProfileSettings = () => {
    setFabOpen(false);
    navigate('/profile/settings');
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
      const data = e?.response?.data;
      let msg = data?.error || e?.message || 'Failed to submit report';
      if (e?.response?.status === 409 && data?.source_report_id) {
        msg = `${msg} (Report #${data.source_report_id})`;
      }
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
          background: appCanvasBackground,
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
          background: appCanvasBackground,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (profileAccessLocked && !isOwnProfile) {
    if (isGuest) {
      return (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 9999,
            overflow: 'auto',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '100vh',
              background: theme.palette.mode === 'dark'
                ? 'linear-gradient(135deg, #2a1a1a 0%, #1d2336 52%, #12212f 100%)'
                : 'linear-gradient(135deg, #f97373 0%, #f59e0b 46%, #fb7185 100%)',
              position: 'relative',
              overflow: 'hidden',
              px: 3,
            }}
          >
            <Box
              sx={{
                position: 'absolute',
                top: '-12%',
                right: '-8%',
                width: '42%',
                height: '42%',
                borderRadius: '50%',
                background: theme.palette.mode === 'dark'
                  ? 'rgba(248, 113, 113, 0.16)'
                  : 'rgba(255, 255, 255, 0.25)',
                filter: 'blur(70px)',
              }}
            />
            <Box
              sx={{
                position: 'absolute',
                bottom: '-14%',
                left: '-10%',
                width: '46%',
                height: '46%',
                borderRadius: '50%',
                background: theme.palette.mode === 'dark'
                  ? 'rgba(56, 189, 248, 0.12)'
                  : 'rgba(255, 255, 255, 0.2)',
                filter: 'blur(76px)',
              }}
            />

            <Stack spacing={3} sx={{ alignItems: 'center', textAlign: 'center', zIndex: 1, maxWidth: 640 }}>
              <Box
                sx={{
                  width: 120,
                  height: 120,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.3)',
                  backdropFilter: 'blur(10px)',
                  boxShadow: theme.palette.mode === 'dark'
                    ? '0 8px 32px rgba(0,0,0,0.35)'
                    : '0 8px 32px rgba(0,0,0,0.14)',
                }}
              >
                <LockIcon sx={{ fontSize: 64, color: '#fff' }} />
              </Box>

              <Typography
                variant="h3"
                sx={{
                  color: '#fff',
                  fontWeight: 800,
                  textShadow: '0 2px 14px rgba(0,0,0,0.3)',
                }}
              >
                Private Profile
              </Typography>

              <Typography
                variant="h6"
                sx={{
                  color: 'rgba(255,255,255,0.95)',
                  maxWidth: 560,
                  lineHeight: 1.5,
                }}
              >
                This profile is private. In Goblin Mode, private profiles require a real account login.
              </Typography>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ pt: 0.5 }}>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<HomeIcon />}
                  onClick={() => navigate('/home')}
                  sx={{
                    px: 3.5,
                    py: 1.2,
                    borderRadius: '50px',
                    fontWeight: 700,
                    textTransform: 'none',
                    color: '#fff',
                    bgcolor: 'rgba(255,255,255,0.2)',
                    border: '2px solid rgba(255,255,255,0.35)',
                    backdropFilter: 'blur(10px)',
                    '&:hover': {
                      bgcolor: 'rgba(255,255,255,0.32)',
                    },
                  }}
                >
                  Go to Home
                </Button>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<LoginIcon />}
                  onClick={() => navigate('/login', { replace: true })}
                  sx={{
                    px: 3.5,
                    py: 1.2,
                    borderRadius: '50px',
                    fontWeight: 700,
                    textTransform: 'none',
                    color: '#fff',
                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(239,68,68,0.72)' : 'rgba(220,38,38,0.78)',
                    border: '2px solid rgba(255,255,255,0.35)',
                    '&:hover': {
                      bgcolor: theme.palette.mode === 'dark' ? 'rgba(248,113,113,0.78)' : 'rgba(239,68,68,0.84)',
                    },
                  }}
                >
                  Login
                </Button>
              </Stack>
            </Stack>
          </Box>
        </Box>
      );
    }

    return (
      <Box
        sx={{
          minHeight: 'calc(100vh - 64px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          px: 2,
          background: appCanvasBackground,
        }}
      >
        <Paper sx={{ p: 3, width: '100%', maxWidth: 520, ...getGlassDialogPaperSx(theme) }}>
          <Typography variant="h5" sx={{ fontWeight: 800, mb: 0.8 }}>
            Private Profile
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            {profileAccessVisibility === 'private'
              ? 'Only the owner and users they follow can view this profile without a key.'
              : 'This profile requires access.'}
          </Typography>

          {!showProfileAccessInput ? (
            <Button
              variant="contained"
              onClick={() => setShowProfileAccessInput(true)}
              sx={getGlassPillActionButtonSx(theme)}
            >
              Enter Access Key
            </Button>
          ) : (
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.1}>
              <TextField
                fullWidth
                size="small"
                type="password"
                placeholder="Enter access key"
                value={profileAccessKeyDraft}
                onChange={(event) => setProfileAccessKeyDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    handleSubmitProfileAccessKey();
                  }
                }}
                sx={getGlassInputSx(theme)}
              />
              <Button
                variant="contained"
                onClick={handleSubmitProfileAccessKey}
                disabled={profileAccessSubmitting || !String(profileAccessKeyDraft || '').trim()}
                sx={getGlassPillActionButtonSx(theme)}
              >
                {profileAccessSubmitting ? 'Checking...' : 'Submit'}
              </Button>
            </Stack>
          )}

          {profileAccessMessage ? (
            <Typography color="error" sx={{ mt: 1.2, fontWeight: 700 }}>
              {profileAccessMessage}
            </Typography>
          ) : null}
        </Paper>
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
          background: appCanvasBackground,
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
        background: appCanvasBackground,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-start',
        alignItems: 'flex-start',
        pt: 4,
        pb: 4
      }}
    >
      {/* Music Player - show for any profile that has music data */}
      {showMusic && musicData && (
        <Fade in={showMusic} timeout={800}>
          <Box
            className="profile-music-player"
            sx={{
              position: 'fixed',
              top: '80px',
              left: '20px',
              maxWidth: 'min(400px, calc(100vw - 40px))',
              zIndex: 1000,
              ...getGlassDialogPaperSx(theme),
              p: 2,
              opacity: showMusic ? 1 : 0,
              transition: 'all 0.3s ease-in-out',
              boxSizing: 'border-box',
              '@media (max-width: 1100px)': {
                top: 'auto',
                bottom: '20px',
                left: '10px',
                right: '10px',
                maxWidth: 'none',
                p: 1.5,
              },
            }}
          >
            <Typography
              variant="h6"
              sx={{
                fontSize: '1.1rem',
                fontWeight: 800,
                mb: 1.5,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                '@media (max-width: 1100px)': { fontSize: '0.875rem' }
              }}
            >
              <InfoIcon color="primary" sx={{ fontSize: 20 }} />
              {isOwnProfile ? 'My Music' : `${displayUsername(profileUser?.username)}'s Music`}
            </Typography>
            <Box sx={{
              display: 'block',
              '@media (max-width: 1100px)': {
                '& > div': {
                  flexDirection: 'column !important',
                  alignItems: 'center !important',
                  gap: '8px !important',
                  padding: '12px !important',
                },
              },
            }}>
              <MusicPlayer
                url={musicData?.music_url || musicData?.music_media_url}
                platform={musicData?.music_platform}
                compact={isNarrowViewport}
              />
            </Box>
          </Box>
        </Fade>
      )}

      <Container maxWidth="md">
        <Box sx={{
          position: 'relative',
          p: { xs: 3, sm: 4 },
          ...getGlassDialogPaperSx(theme),
          borderRadius: 4,
          boxShadow: profileContainerGlow,
        }}>
          {profileAccessVisibility === 'private' ? (
            <LockIcon
              sx={{
                position: 'absolute',
                top: { xs: 16, sm: 20 },
                right: { xs: 16, sm: 20 },
                fontSize: { xs: 60, sm: 80 },
                color: theme.palette.primary.main,
                opacity: 0.08,
                filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.16))',
                pointerEvents: 'none',
                zIndex: 0,
              }}
            />
          ) : null}

          <Grid container spacing={4}>
            {/* Profile Header */}
            <Grid item xs={12}>
              <Box sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                alignItems: { xs: 'center', sm: 'flex-start' },
                gap: 4,
                textAlign: { xs: 'center', sm: 'left' }
              }}>
                <Box sx={{ position: 'relative' }}>
                  <UserAvatar
                    name={displayUsername(profileUser.username)}
                    avatarUrl={profileUser.avatar_url}
                    id={profileUser.id}
                    size={isNarrowViewport ? 100 : 140}
                    userColor={profileUser.user_color}
                    isRestricted={profileUser.is_restricted}
                    isSuspended={profileUser.is_suspended}
                    isAvatarBlurred={profileUser.is_avatar_blurred}
                  />
                  {profileAccessVisibility === 'private' && (
                    <Box sx={{
                      position: 'absolute',
                      bottom: -4,
                      right: -4,
                      bgcolor: theme.palette.primary.main,
                      color: '#fff',
                      borderRadius: '50%',
                      p: 0.5,
                      display: 'flex',
                      border: `3px solid ${theme.palette.background.paper}`
                    }}>
                      <LockIcon sx={{ fontSize: 16 }} />
                    </Box>
                  )}
                </Box>

                <Box sx={{ flex: 1, pt: { sm: 1.5 } }}>
                  <Typography variant={isNarrowViewport ? "h4" : "h3"} sx={{
                    fontWeight: 900,
                    mb: 1,
                    letterSpacing: '-0.02em',
                    color: '#fff',
                    textShadow: profileIdentityColor
                      ? `0 0 20px ${alpha(profileIdentityColor, 0.8)}, 0 2px 4px rgba(0,0,0,0.5)`
                      : '0 2px 4px rgba(0,0,0,0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                  }}>
                    {displayUsername(profileUser.username)}
                    {profileUser?.country && (
                      <Tooltip title={countries.find(c => c.code === profileUser.country)?.label || ''} arrow>
                        <Box 
                          component="img"
                          loading="lazy"
                          src={getFlagUrl(profileUser.country)}
                          alt=""
                          sx={{ width: 32, height: 'auto', borderRadius: '4px', boxShadow: '0 2px 8px rgba(0,0,0,0.3)', cursor: 'help' }}
                        />
                      </Tooltip>
                    )}
                  </Typography>

                  {/* Site Admin Controls */}
                  {user?.site_admin_role && !isGuestProfileRoute && (
                    <Box sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={Boolean(profileUser.is_avatar_blurred)}
                            onChange={async (e) => {
                              const checked = e.target.checked;
                              try {
                                if (checked) {
                                  await createModerationAction({
                                    subject_type: 'user',
                                    subject_id: profileUser.id,
                                    action: 'blur_avatar',
                                    reason_public: 'Avatar contains inappropriate content.',
                                  });
                                } else {
                                  // Deactivate all active blur actions for this user
                                  const responseActions = await listModerationActions({
                                    subject_type: 'user',
                                    subject_id: profileUser.id,
                                    is_active: true
                                  });
                                  const actionsArray = Array.isArray(responseActions.data) 
                                    ? responseActions.data 
                                    : (responseActions.data?.data || []);
                                  const blurActions = actionsArray.filter(a => a.action === 'blur_avatar');
                                  for (const action of blurActions) {
                                    await updateModerationAction(action.id, { is_active: false });
                                  }
                                }
                                // Refresh profile data
                                const response = await api.get(`/api/v1/users/${profileUser.id}`);
                                setProfileUser(response.data);
                                setSnackbar({
                                  open: true,
                                  message: checked ? 'Avatar blurred site-wide' : 'Avatar blur removed',
                                  severity: 'success'
                                });
                              } catch (err) {
                                console.error('Failed to toggle avatar blur:', err);
                                setSnackbar({
                                  open: true,
                                  message: 'Failed to update avatar blur status',
                                  severity: 'error'
                                });
                              }
                            }}
                            size="small"
                            color="warning"
                          />
                        }
                        label={
                          <Typography variant="caption" sx={{ fontWeight: 800, color: 'warning.main', letterSpacing: '0.05em' }}>
                            SITE-WIDE AVATAR BLUR
                          </Typography>
                        }
                      />
                    </Box>
                  )}

                  <Stack direction="row" spacing={2} sx={{ mb: 2, justifyContent: { xs: 'center', sm: 'flex-start' } }}>
                    <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <LoginIcon sx={{ fontSize: 16, opacity: 0.6 }} />
                      {profileUser.created_at ?
                        `Joined ${new Date(profileUser.created_at).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}` :
                        'Join date unavailable'}
                    </Typography>
                    {profileUser.email && (
                      <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        {getBlurredEmail(profileUser.email)}
                      </Typography>
                    )}
                  </Stack>
                </Box>
              </Box>
            </Grid>

            <Grid item xs={12}>
              <Box sx={{
                p: 3,
                borderRadius: 3,
                bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                border: '1px solid rgba(255,255,255,0.05)',
              }}>
                <Typography variant="subtitle2" sx={{
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  mb: 1.5,
                  color: theme.palette.primary.main,
                  opacity: 0.8
                }}>
                  Biography
                </Typography>
                <Typography variant="body1" sx={{
                  lineHeight: 1.7,
                  color: theme.palette.text.primary,
                  opacity: 0.9,
                  whiteSpace: 'pre-wrap'
                }}>
                  {profileUser.bio || 'This user hasn\'t shared their story yet.'}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Container>

      {(visibleProfileModules.length > 0 || isOwnProfile) && (
        <Container maxWidth="md" sx={{ mt: '30px', pb: 2 }}>
          {visibleProfileModules.length === 0 ? (
            <Paper
              sx={{
                ...getGlassDialogPaperSx(theme),
                p: { xs: 2, sm: 2.5 },
                borderRadius: 3,
                boxShadow: profileContainerGlow,
              }}
            >
              <Typography variant="h6" sx={{ mb: 1.5 }}>
                Texts
              </Typography>
              <Typography variant="body2" color="text.secondary">
                No modules yet. Manage modules from Profile Settings.
              </Typography>
            </Paper>
          ) : (
            <Stack spacing={2.2}>
              {groupedProfileModules.map((group) => (
                <Paper
                  key={group.type}
                  sx={{
                    ...getGlassDialogPaperSx(theme),
                    p: { xs: 2, sm: 2.5 },
                    borderRadius: 3,
                    boxShadow: profileContainerGlow,
                  }}
                >
                  {(() => {
                    const normalizedGroupType = normalizeProfileModuleType(group.type);
                    const primaryModule = Array.isArray(group.modules) ? group.modules[0] : null;
                    const moduleHeading = normalizedGroupType === PROFILE_MODULE_TYPE_THEORY_BOARD
                      ? formatTheoryBoardTitle(primaryModule?.title)
                      : getProfileModuleTypeLabel(group.type);
                    return (
                      <Typography variant="h6" sx={{ mb: 1.5 }}>
                        {moduleHeading}
                      </Typography>
                    );
                  })()}
                  <Box
                    sx={{
                      borderRadius: 3.5,
                      p: 1.5,
                      bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
                      border: '1px solid rgba(255,255,255,0.05)',
                    }}
                  >
                    {normalizeProfileModuleType(group.type) === PROFILE_MODULE_TYPE_TEXTS ? (
                      <Box>
                        {textsEntries.length > visibleTextsCount && (
                          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center' }}>
                            <Button
                              onClick={() => setVisibleTextsCount(prev => prev + 10)}
                              sx={getGlassPillActionButtonSx(theme)}
                              size="small"
                            >
                              Load Older History
                            </Button>
                          </Box>
                        )}

                        <Box
                          ref={textsContainerRef}
                          onScroll={handleTextsScroll}
                          sx={{
                            maxHeight: 500,
                            overflowY: 'auto',
                            pr: 1,
                            mr: -0.5,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 1.2,
                            // Standard glass scrollbar
                            '&::-webkit-scrollbar': {
                              width: '5px',
                            },
                            '&::-webkit-scrollbar-track': {
                              background: 'transparent',
                            },
                            '&::-webkit-scrollbar-thumb': {
                              background: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                              borderRadius: '10px',
                            },
                          }}
                        >
                          {textsEntries.length === 0 ? (
                            <Typography variant="body2" color="text.secondary">
                              No texts yet.
                            </Typography>
                          ) : (
                            textsEntries.slice(-visibleTextsCount).map((entry) => {
                              const isOwnerEntry = Number(entry.author_id) === Number(profileUser?.id);
                              const isLeftBubble = isOwnerEntry;
                              const textModuleBackground = isLeftBubble
                                ? (theme.palette.mode === 'dark'
                                  ? 'linear-gradient(145deg, rgba(246, 244, 236, 0.94) 0%, rgba(232, 228, 216, 0.92) 100%)'
                                  : 'linear-gradient(145deg, rgba(255, 255, 255, 0.96) 0%, rgba(244, 248, 255, 0.94) 100%)')
                                : (theme.palette.mode === 'dark'
                                  ? 'linear-gradient(145deg, rgba(69, 116, 202, 0.82) 0%, rgba(58, 101, 188, 0.72) 100%)'
                                  : 'linear-gradient(145deg, rgba(236, 245, 255, 0.98) 0%, rgba(223, 238, 255, 0.95) 100%)');
                              const textModuleBodyColor = isLeftBubble
                                ? (theme.palette.mode === 'dark' ? 'rgba(28, 24, 18, 0.96)' : 'text.secondary')
                                : 'text.secondary';

                              return (
                                <Box
                                  key={entry.id}
                                  sx={{
                                    display: 'flex',
                                    flexDirection: isLeftBubble ? 'row' : 'row-reverse',
                                    alignItems: 'flex-end',
                                    gap: 1.5,
                                    alignSelf: isLeftBubble ? 'flex-start' : 'flex-end',
                                    width: { xs: '98%', sm: '90%' },
                                  }}
                                >
                                  <UserAvatar
                                    id={entry.author_id}
                                    name={entry.author_username}
                                    avatarUrl={entry.author_avatar_url}
                                    size={32}
                                    isRestricted={entry.author_is_restricted}
                                    isSuspended={entry.author_is_suspended}
                                    isAvatarBlurred={entry.author_is_avatar_blurred}
                                    sx={{ mb: 0.5, flexShrink: 0 }}
                                  />
                                  <Card
                                    sx={{
                                      position: 'relative',
                                      flex: 1,
                                      borderRadius: isLeftBubble ? '18px 18px 18px 6px' : '18px 18px 6px 18px',
                                      background: textModuleBackground,
                                      border: '1px solid',
                                      borderColor: isLeftBubble
                                        ? (theme.palette.mode === 'dark' ? 'rgba(78, 60, 36, 0.42)' : 'rgba(33, 150, 243, 0.28)')
                                        : (theme.palette.mode === 'dark' ? 'rgba(188, 218, 255, 0.45)' : 'rgba(13, 71, 161, 0.18)'),
                                      boxShadow: '0 8px 20px rgba(9, 18, 40, 0.22)',
                                    }}
                                  >
                                    <CardContent sx={{ pb: 1.4 }}>
                                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                                          <Typography
                                            variant="subtitle2"
                                            sx={{
                                              fontWeight: 800,
                                              mb: 0.45,
                                              letterSpacing: 0.15,
                                              textTransform: 'capitalize',
                                              color: isLeftBubble && theme.palette.mode === 'dark' ? 'rgba(18, 14, 11, 0.96)' : undefined,
                                              textShadow: isLeftBubble && theme.palette.mode === 'dark' ? '0 0 0.45px rgba(0, 0, 0, 0.72)' : 'none',
                                            }}
                                          >
                                            {displayUsername(entry.author_username)}
                                          </Typography>
                                          {entry.created_at && (
                                            <Typography
                                              variant="caption"
                                              sx={{
                                                opacity: 0.5,
                                                fontSize: '0.65rem',
                                                color: isLeftBubble && theme.palette.mode === 'dark' ? 'rgba(18, 14, 11, 0.6)' : 'text.secondary'
                                              }}
                                            >
                                              {formatDistanceToNow(new Date(entry.created_at), { addSuffix: true })}
                                            </Typography>
                                          )}
                                        </Box>
                                        {canDeleteTexts && (
                                          <Tooltip title="Delete text">
                                            <span>
                                              <IconButton
                                                size="small"
                                                color="error"
                                                onClick={() => handleDeleteProfileText(entry.id)}
                                                disabled={Boolean(profileTextDeletingId) || profileTextSubmitting}
                                              >
                                                <DeleteOutlineIcon fontSize="small" />
                                              </IconButton>
                                            </span>
                                          </Tooltip>
                                        )}
                                      </Box>
                                      <Box
                                        sx={{
                                          color: textModuleBodyColor,
                                          lineHeight: 1.45,
                                          textShadow: isLeftBubble && theme.palette.mode === 'dark'
                                            ? '0 0 0.42px rgba(0, 0, 0, 0.74)'
                                            : 'none',
                                        }}
                                      >
                                        <RichContentRenderer
                                          content={toRichContentPayload(entry.text)}
                                          theme={theme}
                                          onOpenEventReference={handleOpenProfileModuleEventReference}
                                          inheritTextColor
                                        />
                                      </Box>
                                    </CardContent>
                                  </Card>
                                </Box>
                              );
                            })
                          )}
                          {isTyping && (
                            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', ml: 1, mt: 1 }}>
                              <Box
                                sx={{
                                  p: '10px 18px',
                                  borderRadius: '20px 20px 20px 4px',
                                  background: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 0.6,
                                  boxShadow: '0 4px 10px rgba(0,0,0,0.03)',
                                }}
                              >
                                <Box
                                  sx={{
                                    display: 'flex',
                                    gap: 0.5,
                                    '& > div': {
                                      width: 5,
                                      height: 5,
                                      borderRadius: '50%',
                                      background: theme.palette.text.secondary,
                                      animation: 'typingDot 1.4s infinite ease-in-out',
                                      '&:nth-of-type(2)': { animationDelay: '0.2s' },
                                      '&:nth-of-type(3)': { animationDelay: '0.4s' },
                                    },
                                    '@keyframes typingDot': {
                                      '0%, 80%, 100%': { transform: 'translateY(0)', opacity: 0.3 },
                                      '40%': { transform: 'translateY(-4px)', opacity: 1 },
                                    },
                                  }}
                                >
                                  <div />
                                  <div />
                                  <div />
                                </Box>
                              </Box>
                            </Box>
                          )}
                        </Box>

                        {canWriteToTexts && !isManualModeAtCap && (
                          <Box sx={{ mt: 0.5 }}>
                            <TextField
                              fullWidth
                              multiline
                              minRows={2}
                              maxRows={4}
                              value={profileTextDraft}
                              onChange={(event) => setProfileTextDraft(event.target.value)}
                              placeholder={isOwnProfile ? 'Write a text to your profile...' : `Write a text for ${displayUsername(profileUser?.username) || 'this user'}...`}
                              inputProps={{ maxLength: 1200 }}
                              onKeyDown={(event) => {
                                if (event.key === 'Enter' && !event.shiftKey) {
                                  event.preventDefault();
                                  handleSubmitProfileText();
                                }
                              }}
                              sx={{ mb: 1.1, '& .MuiInputBase-root': { borderRadius: 2 } }}
                            />
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
                              <Typography variant="caption" color="text.secondary">
                                {textsOverflowMode === 'fifo'
                                  ? `Auto-rollover enabled (${textsEntries.length}/${textsMaxItems})`
                                  : `Manual mode (${textsEntries.length}/${textsMaxItems})`}
                              </Typography>
                              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                {(isTextsScrolledUp || hasNewTexts) && (
                                  <Button
                                    onClick={scrollToTextsBottom}
                                    sx={{
                                      ...getGlassSquareActionButtonSx(theme),
                                      minWidth: '38px',
                                      width: '38px',
                                      height: '38px',
                                      p: 0,
                                      borderRadius: '12px',
                                      boxShadow: theme.palette.mode === 'dark' ? '0 4px 12px rgba(0,0,0,0.5)' : '0 4px 12px rgba(0,0,0,0.1)',
                                      animation: hasNewTexts ? 'jiggleBounce 0.7s cubic-bezier(0.68, -0.55, 0.265, 1.55) infinite alternate' : 'none',
                                      '@keyframes jiggleBounce': {
                                        '0%': { transform: 'translateY(0) scale(1)' },
                                        '100%': { transform: 'translateY(5px) scale(1.05)' },
                                      }
                                    }}
                                  >
                                    <KeyboardDoubleArrowDownRoundedIcon 
                                      sx={{ 
                                        fontSize: '1.35rem',
                                        color: hasNewTexts ? (theme.palette.mode === 'dark' ? '#90caf9' : '#1976d2') : theme.palette.text.secondary,
                                        filter: hasNewTexts ? `drop-shadow(0px 2px 4px rgba(25, 118, 210, 0.4))` : 'none'
                                      }} 
                                    />
                                  </Button>
                                )}
                                <Button
                                  variant="contained"
                                  onClick={() => {
                                    handleSubmitProfileText();
                                    setTimeout(scrollToTextsBottom, 100);
                                  }}
                                  disabled={profileTextSubmitting || !String(profileTextDraft || '').trim()}
                                  sx={getGlassPillActionButtonSx(theme)}
                                >
                                  {profileTextSubmitting ? 'Sending...' : 'Send'}
                                </Button>
                              </Box>
                            </Box>
                          </Box>
                        )}

                        {canWriteToTexts && isManualModeAtCap && (
                          <Typography variant="caption" color="text.secondary">
                            Texts module is full (manual mode). Owner must delete one before new texts can be sent.
                          </Typography>
                        )}
                      </Box>
                    ) : normalizeProfileModuleType(group.type) === PROFILE_MODULE_TYPE_THEORY_BOARD ? (
                      <TheoryBoardModule
                        profileUserId={Number(profileUser?.id || 0)}
                        isOwner={isOwnProfile}
                        onOpenEventReference={handleOpenProfileModuleEventReference}
                      />
                    ) : (
                      <Stack spacing={1.1}>
                        {group.modules.map((module, index) => {
                          const isLeftBubble = index % 2 === 0;
                          const cardBackground = isLeftBubble
                            ? (theme.palette.mode === 'dark' ? 'linear-gradient(145deg, #162a63 0%, #0f1f49 100%)' : 'linear-gradient(145deg, #ffffff 0%, #eef4ff 100%)')
                            : (theme.palette.mode === 'dark' ? 'linear-gradient(145deg, #254b97 0%, #1a3874 100%)' : 'linear-gradient(145deg, #d9e9ff 0%, #c7defd 100%)');
                          return (
                            <Card
                              key={module.id}
                              sx={{
                                position: 'relative',
                                alignSelf: isLeftBubble ? 'flex-start' : 'flex-end',
                                width: { xs: '96%', sm: '85%' },
                                borderRadius: isLeftBubble ? '18px 18px 18px 6px' : '18px 18px 6px 18px',
                                background: cardBackground,
                                border: '1px solid',
                                borderColor: isLeftBubble
                                  ? (theme.palette.mode === 'dark' ? 'rgba(130, 177, 255, 0.34)' : 'rgba(33, 150, 243, 0.28)')
                                  : (theme.palette.mode === 'dark' ? 'rgba(188, 218, 255, 0.45)' : 'rgba(13, 71, 161, 0.18)'),
                                boxShadow: '0 8px 20px rgba(9, 18, 40, 0.22)',
                              }}
                            >
                              <CardContent sx={{ pb: 1.6 }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 0.45, letterSpacing: 0.15 }}>
                                  {module.title}
                                </Typography>
                                <Box sx={{ color: 'text.secondary', lineHeight: 1.45 }}>
                                  <RichContentRenderer
                                    content={toRichContentPayload(module.description)}
                                    theme={theme}
                                    onOpenEventReference={handleOpenProfileModuleEventReference}
                                  />
                                </Box>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </Stack>
                    )}
                  </Box>
                </Paper>
              ))}
            </Stack>
          )}
        </Container>
      )}

      {canShowMainProfileActions && (
        <NavFab
          expanded={fabOpen}
          onToggleExpanded={() => setFabOpen((prev) => !prev)}
          onCollapse={() => setFabOpen(false)}
          bottom={{ xs: 16, sm: 24 }}
          right={{ xs: 16, sm: 24 }}
          containerZIndex={1100}
          mainTooltipClosed="Profile actions"
          mainTooltipOpen="Close actions"
          showCreate={false}
          showMembersNav={false}
          showAdminNav={false}
          showReport={false}
          actions={[
            ...(canOpenProfileSettings ? [{
              key: 'profile-settings',
              tooltip: 'Profile settings',
              icon: <SettingsIcon fontSize="small" />,
              onClick: handleOpenProfileSettings,
              step: 58,
              accent: { dark: '#CE93D8', light: '#AB47BC' },
            }] : []),
            ...(canReportProfile ? [{
              key: 'report-user',
              tooltip: 'Report user',
              icon: <OutlinedFlagIcon fontSize="small" />,
              onClick: handleOpenReportDialog,
              step: 58,
              accent: { dark: '#EF5350', light: '#D32F2F' },
            }] : []),
            ...(!isOwnProfile && !isGuest && profileUser?.id ? [{
              key: 'follow-user',
              tooltip: followedUserIdSet.has(Number(profileUser.id)) ? 'Unfollow user' : 'Follow user',
              icon: followedUserIdSet.has(Number(profileUser.id)) ? <PersonRemoveIcon fontSize="small" /> : <PersonAddIcon fontSize="small" />,
              onClick: handleToggleFollow,
              step: 58,
              accent: followedUserIdSet.has(Number(profileUser.id)) 
                ? { dark: '#EF5350', light: '#D32F2F' } 
                : { dark: '#4FC3F7', light: '#039BE5' },
            }] : []),
          ]}
          tradingCard={{
            onActivate: handleCopyProfileLink,
            imageUrl: profileShareImageUrl,
            imageAlt: `${displayUsername(profileUser?.username) || 'User'} profile portrait`,
            imageClassName: 'profile-share-card-image',
            overlayClassName: 'profile-share-card-overlay',
            imageSx: {
              objectFit: 'cover',
              filter: 'brightness(1.08) saturate(1.08)',
              transform: profileShareCardTransform,
            },
            fallbackSx: profileFallbackSx,
            label: 'PROFILE',
            title: String(displayUsername(profileUser?.username) || '').toUpperCase(),
            qrUrl: profileShareQrUrl,
            overlayText: 'Tap to Share',
            overlaySx: { fontSize: '0.72rem' },
            isRestricted: Boolean(profileUser?.is_restricted || profileUser?.is_suspended),
          }}
        />
      )}

      {profileModulePopupEvent ? (
        <EventPopup
          event={profileModulePopupEvent}
          open
          onClose={() => setProfileModulePopupEvent(null)}
          onDelete={undefined}
          onEdit={undefined}
          setIsPopupOpen={() => { }}
        />
      ) : null}

      <Dialog
        open={reportDialogOpen}
        onClose={handleCloseReportDialog}
        fullWidth
        maxWidth="sm"
        PaperProps={{ sx: getGlassDialogPaperSx(theme) }}
      >
        <DialogTitle>Report {displayUsername(profileUser?.username) || 'User'}</DialogTitle>
        <DialogContent sx={{ '& .MuiTextField-root': getGlassInputSx(theme) }}>
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
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={handleCloseReportDialog}
            disabled={reportSubmitting}
            variant="contained"
            sx={{
              ...getGlassSquareActionButtonSx(theme),
              width: 'auto',
              minWidth: 84,
              px: 2,
              borderRadius: 1.4,
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmitUserReport}
            variant="contained"
            disabled={reportSubmitting}
            sx={{
              ...getGlassPillActionButtonSx(theme),
              bgcolor: theme.palette.error.main,
              color: '#fff',
              border: '1px solid',
              borderColor: theme.palette.mode === 'dark' ? 'rgba(248,113,113,0.65)' : 'rgba(220,38,38,0.55)',
              '&:hover': {
                bgcolor: theme.palette.error.dark,
                color: '#fff',
              },
            }}
          >
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
