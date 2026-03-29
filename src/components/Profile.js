import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api, { submitUserReport } from '../utils/api';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  Divider,
  Fade,
  CircularProgress,
  Fab,
  Stack,
  Tooltip,
  ClickAwayListener,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Button,
  Card,
  CardContent,
  Snackbar,
  Alert,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import ReportProblemOutlinedIcon from '@mui/icons-material/ReportProblemOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import AddIcon from '@mui/icons-material/Add';
import { useAuth } from '../contexts/AuthContext';
import { useEmailBlur } from '../contexts/EmailBlurContext';
import MusicPlayer from './MusicPlayer';
import UserAvatar from './common/UserAvatar';
import TradingCard from './common/TradingCard';
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

const PROFILE_MODULE_TYPE_INFO_CARD = 'info_card';
const PROFILE_MODULE_TYPE_TEXTS = 'texts';
const PROFILE_MODULE_TYPE_MAILBOX = 'mailbox';
const PROFILE_MODULE_TYPE_CONSPIRACY_BOARD = 'conspiracy_board';

const PROFILE_MODULE_TYPE_META = {
  [PROFILE_MODULE_TYPE_TEXTS]: { label: 'Texts' },
  [PROFILE_MODULE_TYPE_MAILBOX]: { label: 'Mailbox' },
  [PROFILE_MODULE_TYPE_CONSPIRACY_BOARD]: { label: 'Conspiracy Board' },
};

const normalizeProfileModuleType = (type) => {
  const rawType = String(type || '').trim().toLowerCase();
  if (rawType === PROFILE_MODULE_TYPE_INFO_CARD || rawType === PROFILE_MODULE_TYPE_TEXTS) {
    return PROFILE_MODULE_TYPE_TEXTS;
  }
  if (rawType === PROFILE_MODULE_TYPE_MAILBOX) return PROFILE_MODULE_TYPE_MAILBOX;
  if (rawType === PROFILE_MODULE_TYPE_CONSPIRACY_BOARD) return PROFILE_MODULE_TYPE_CONSPIRACY_BOARD;
  return PROFILE_MODULE_TYPE_TEXTS;
};

const getProfileModuleTypeLabel = (type) => (
  PROFILE_MODULE_TYPE_META[normalizeProfileModuleType(type)]?.label || 'Texts'
);

const safeParseJson = (rawValue, fallback) => {
  if (!rawValue || typeof rawValue !== 'string') return fallback;
  try {
    const parsed = JSON.parse(rawValue);
    return parsed ?? fallback;
  } catch (_) {
    return fallback;
  }
};

const toRichContentPayload = (description) => {
  const raw = String(description || '');
  if (!raw.trim()) return null;

  const pattern = /(@[a-zA-Z0-9_]+)|(#[a-zA-Z0-9_]+)|(i-[a-zA-Z0-9_]+)|(~[0-9]+)|(www\.[^\s]+)|(https?:\/\/[^\s]+)/g;
  const contentItems = [];
  let lastEnd = 0;

  raw.replace(pattern, (matched, _u, _h, _c, _e, _www, _http, offset) => {
    if (offset > lastEnd) {
      const textBefore = raw.slice(lastEnd, offset);
      if (textBefore) {
        contentItems.push({ type: 'text', value: textBefore });
      }
    }

    if (matched.startsWith('@')) {
      contentItems.push({ type: 'user_mention', username: matched.slice(1), text: matched });
    } else if (matched.startsWith('#')) {
      contentItems.push({ type: 'hashtag_mention', name: matched.slice(1), text: matched });
    } else if (matched.startsWith('i-')) {
      contentItems.push({ type: 'community_mention', name: matched.slice(2), text: matched });
    } else if (matched.startsWith('~')) {
      const eventId = Number(matched.slice(1));
      if (Number.isFinite(eventId) && eventId > 0) {
        contentItems.push({ type: 'event_reference', event_id: eventId, text: matched });
      } else {
        contentItems.push({ type: 'text', value: matched });
      }
    } else if (matched.startsWith('www.')) {
      contentItems.push({ type: 'link', url: `https://${matched}`, text: matched });
    } else if (matched.startsWith('http')) {
      contentItems.push({ type: 'link', url: matched, text: matched });
    }

    lastEnd = offset + matched.length;
    return matched;
  });

  if (lastEnd < raw.length) {
    contentItems.push({ type: 'text', value: raw.slice(lastEnd) });
  }

  if (contentItems.length === 0) {
    return { content: [{ type: 'text', value: raw }] };
  }
  return { content: contentItems };
};

const normalizeProfileModules = (rawModules) => {
  if (!Array.isArray(rawModules)) return [];

  return rawModules
    .map((module, index) => {
      const title = String(module?.title || '').trim().slice(0, 120);
      const description = String(module?.description || '').trim().slice(0, 1200);
      if (!title && !description) return null;

      const moduleType = normalizeProfileModuleType(module?.type);
      const moduleId = String(module?.id || `profile-module-${index + 1}`);
      const moduleOrder = Number.isFinite(Number(module?.order)) ? Number(module.order) : index;

      return {
        id: moduleId,
        type: moduleType,
        title,
        description,
        order: moduleOrder,
        is_visible: module?.is_visible !== false,
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.order - b.order)
    .map((module, index) => ({
      ...module,
      order: index,
    }));
};

const Profile = () => {
  const navigate = useNavigate();
  const { userId } = useParams();
  const { user } = useAuth();
  const { getBlurredEmail } = useEmailBlur();
  const theme = useTheme();
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
  const [profileModulePopupEvent, setProfileModulePopupEvent] = useState(null);
  const [profilePortraitMeta, setProfilePortraitMeta] = useState({
    imageUrl: '',
    x: 50,
    y: 50,
    zoom: 1,
  });
  
  const isOwnProfile = !userId || (user && userId === user.id.toString());
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
  const canReportProfile = Boolean(profileUser?.id) && !isOwnProfile && canCreateOrReport;
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
  const groupedProfileModules = useMemo(() => {
    const grouped = new Map();
    visibleProfileModules.forEach((module) => {
      const type = normalizeProfileModuleType(module?.type);
      if (!grouped.has(type)) grouped.set(type, []);
      grouped.get(type).push(module);
    });
    return Array.from(grouped.entries()).map(([type, modules]) => ({ type, modules }));
  }, [visibleProfileModules]);
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
      const response = await api.get(`/api/timeline-v3/${resolvedTimelineId}/events/${normalizedEventId}`);
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
  const profileFallbackGradient = useMemo(() => (
    theme.palette.mode === 'dark'
      ? 'linear-gradient(135deg, rgba(13,36,63,0.86) 0%, rgba(20,48,92,0.9) 40%, rgba(65,34,106,0.86) 100%)'
      : 'linear-gradient(135deg, rgba(250,232,242,0.94) 0%, rgba(246,232,220,0.96) 68%, rgba(252,238,224,0.98) 100%)'
  ), [theme.palette.mode]);
  const profileShareImageUrl = String(profilePortraitMeta.imageUrl || profileUser?.avatar_url || '').trim();

  const reportCategoryOptions = [
    { value: 'website_policy', label: 'Website policy violation' },
    { value: 'government_policy', label: 'Government policy / legal concern' },
    { value: 'unethical_boundary', label: 'Unethical or harmful boundary' },
  ];

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        
        if (isOwnProfile) {
          // If viewing own profile, always fetch fresh data from API
          // This ensures all fields (including bio) are loaded from database
          if (user) {
            try {
              const userResponse = await api.get(`/api/users/${user.id}`);
              setProfileUser(userResponse.data);
            } catch (userError) {
              console.error('Error fetching own profile data:', userError);
              // Fallback to AuthContext user data if API call fails
              const formattedUser = {
                ...user,
                created_at: user.created_at && typeof user.created_at === 'string' ? user.created_at : null
              };
              setProfileUser(formattedUser);
            }
          }
          
          // Fetch music preferences for own profile
          try {
            const musicResponse = await api.get('/api/profile/music');
            if (musicResponse.data.music_url) {
              setMusicData(musicResponse.data);
              // Slight delay before showing music player for a smoother experience
              setTimeout(() => setShowMusic(true), 100);
            }
          } catch (musicError) {
            console.error('Error fetching music preferences:', musicError);
          }
        } else {
          // If viewing someone else's profile
          try {
            const userResponse = await api.get(`/api/users/${userId}`);
            setProfileUser(userResponse.data);
            
            // Optionally fetch music for other users if the API supports it
            try {
              const musicResponse = await api.get(`/api/users/${userId}/music`);
              if (musicResponse.data.music_url) {
                setMusicData(musicResponse.data);
                setTimeout(() => setShowMusic(true), 100);
              }
            } catch (musicError) {
              // It's okay if we can't get music data for other users
              console.log('No music data available for this user');
            }
          } catch (userError) {
            console.error('Error fetching user profile:', userError);
            setError('User profile not found');
          }
        }
      } catch (error) {
        console.error('Error in profile loading:', error);
        setError('Error loading profile');
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();

    return () => {
      setShowMusic(false);
    };
  }, [userId, user, isOwnProfile]);

  useEffect(() => {
    setFabOpen(false);
    setReportDialogOpen(false);
  }, [userId]);

  useEffect(() => {
    if (!profileUser?.id) return;

    const storageUserId = Number(profileUser.id);
    const localPortraitUrl = String(localStorage.getItem(`profile_portrait_url_user_${storageUserId}`) || '').trim();
    const localPortraitX = clampPortraitFrameValue(localStorage.getItem(`profile_portrait_x_user_${storageUserId}`), 50);
    const localPortraitY = clampPortraitFrameValue(localStorage.getItem(`profile_portrait_y_user_${storageUserId}`), 50);
    const localPortraitZoom = clampPortraitZoom(localStorage.getItem(`profile_portrait_zoom_user_${storageUserId}`), 1);

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

    if (!isOwnProfile) return;

    let canceled = false;
    const hydrateOwnPortraitFromPassport = async () => {
      try {
        const passportResponse = await api.get('/api/v1/user/passport');
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

        const normalizedProfileModules = normalizeProfileModules(prefs?.profile_modules);
        setProfileModules(normalizedProfileModules);

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
  }, [profileUser?.id, profileUser?.avatar_url, isOwnProfile, profileModulesStorageKey]);

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
      const msg = e?.response?.data?.error || e?.message || 'Failed to submit report';
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
          background: theme.palette.mode === 'dark'
            ? 'linear-gradient(180deg, #000000 0%, #0a1128 50%, #1a2456 100%)'
            : 'linear-gradient(180deg, #ffb199 0%, #ffd5c8 20%, #ffeae0 45%, #f7f4ea 75%, #f5f1e4 90%, #ffffff 100%)',
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
          background: theme.palette.mode === 'dark'
            ? 'linear-gradient(180deg, #000000 0%, #0a1128 50%, #1a2456 100%)'
            : 'linear-gradient(180deg, #ffb199 0%, #ffd5c8 20%, #ffeae0 45%, #f7f4ea 75%, #f5f1e4 90%, #ffffff 100%)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}
      >
        <CircularProgress />
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
          background: theme.palette.mode === 'dark'
            ? 'linear-gradient(180deg, #000000 0%, #0a1128 50%, #1a2456 100%)'
            : 'linear-gradient(180deg, #ffb199 0%, #ffd5c8 20%, #ffeae0 45%, #f7f4ea 75%, #f5f1e4 90%, #ffffff 100%)',
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
        background: theme.palette.mode === 'dark'
          ? 'linear-gradient(180deg, #000000 0%, #0a1128 50%, #1a2456 100%)'
          : 'linear-gradient(180deg, #ffb199 0%, #ffd5c8 20%, #ffeae0 45%, #f7f4ea 75%, #f5f1e4 90%, #ffffff 100%)',
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
            sx={{ 
              position: 'fixed', 
              top: '80px', 
              left: '20px', 
              zIndex: 1000,
              width: '300px',
              backgroundColor: theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(10px)',
              borderRadius: 2,
              boxShadow: theme.palette.mode === 'dark' 
                ? '0 8px 32px rgba(0, 0, 0, 0.3)' 
                : '0 8px 32px rgba(0, 0, 0, 0.1)',
              p: 2,
              opacity: showMusic ? 1 : 0,
              transition: 'opacity 0.8s ease-in-out'
            }}
          >
            <Typography variant="h6" gutterBottom>
              {isOwnProfile ? 'My Music' : `${profileUser?.username}'s Music`}
            </Typography>
            <MusicPlayer url={musicData?.music_url} platform={musicData?.music_platform} />
          </Box>
        </Fade>
      )}
      
      <Container maxWidth="md">
        <Paper sx={{ 
          p: 4, 
          backgroundColor: theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(10px)',
          borderRadius: 2,
          border: '1px solid',
          borderColor: profileIdentityColor ? alpha(profileIdentityColor, 0.9) : (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.16)' : 'rgba(15,23,42,0.18)'),
          boxShadow: profileContainerGlow,
        }}>
          <Grid container spacing={4}>
            {/* Profile Header */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <UserAvatar
                  name={profileUser.username}
                  avatarUrl={profileUser.avatar_url}
                  id={profileUser.id}
                  size={120}
                />
                <Box>
                  <Typography variant="h4" gutterBottom>
                    {profileUser.username}
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    {getBlurredEmail(profileUser.email)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {profileUser.created_at ? 
                      `Joined ${new Date(profileUser.created_at).toLocaleDateString()}` : 
                      'Join date unavailable'}
                  </Typography>
                </Box>
              </Box>
            </Grid>

            <Grid item xs={12}>
              <Divider />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Bio
              </Typography>
              <Typography variant="body1">
                {profileUser.bio || 'No bio available.'}
              </Typography>
            </Grid>

          </Grid>
        </Paper>
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
                  <Typography variant="h6" sx={{ mb: 1.5 }}>
                    {getProfileModuleTypeLabel(group.type)}
                  </Typography>
                  <Box
                    sx={{
                      borderRadius: 2.5,
                      p: 1.25,
                      bgcolor: theme.palette.mode === 'dark' ? 'rgba(8, 16, 44, 0.58)' : 'rgba(240, 244, 255, 0.75)',
                      border: '1px solid',
                      borderColor: theme.palette.mode === 'dark' ? 'rgba(130, 177, 255, 0.22)' : 'rgba(25, 118, 210, 0.2)',
                    }}
                  >
                    <Stack spacing={1.1}>
                      {group.modules.map((module, index) => {
                        const isLeftBubble = index % 2 === 0;
                        const isTextModule = normalizeProfileModuleType(group.type) === PROFILE_MODULE_TYPE_TEXTS;
                        const textModuleLightBackground = isLeftBubble
                          ? (theme.palette.mode === 'dark'
                            ? 'linear-gradient(145deg, rgba(52, 91, 168, 0.7) 0%, rgba(40, 76, 148, 0.62) 100%)'
                            : 'linear-gradient(145deg, rgba(255, 255, 255, 0.96) 0%, rgba(244, 248, 255, 0.94) 100%)')
                          : (theme.palette.mode === 'dark'
                            ? 'linear-gradient(145deg, rgba(69, 116, 202, 0.82) 0%, rgba(58, 101, 188, 0.72) 100%)'
                            : 'linear-gradient(145deg, rgba(236, 245, 255, 0.98) 0%, rgba(223, 238, 255, 0.95) 100%)');

                        return (
                          <Card
                            key={module.id}
                            sx={{
                              position: 'relative',
                              alignSelf: isLeftBubble ? 'flex-start' : 'flex-end',
                              width: { xs: '96%', sm: '85%' },
                              borderRadius: isLeftBubble ? '18px 18px 18px 6px' : '18px 18px 6px 18px',
                              background: isTextModule
                                ? textModuleLightBackground
                                : (theme.palette.mode === 'dark'
                                  ? 'linear-gradient(145deg, #162a63 0%, #0f1f49 100%)'
                                  : 'linear-gradient(145deg, #ffffff 0%, #eef4ff 100%)'),
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
                  </Box>
                </Paper>
              ))}
            </Stack>
          )}
        </Container>
      )}

      {canShowMainProfileActions && (
        <ClickAwayListener onClickAway={() => setFabOpen(false)}>
          <Box
            sx={{
              position: 'fixed',
              right: { xs: 16, sm: 24 },
              bottom: { xs: 16, sm: 24 },
              zIndex: 1100,
            }}
          >
            <Box sx={{ position: 'relative' }}>
              <TradingCard
              onActivate={handleCopyProfileLink}
              frameSx={{
                position: 'absolute',
                right: { xs: 70, sm: 82 },
                bottom: 0,
                boxShadow: fabOpen
                  ? '0 18px 40px rgba(15,23,42,0.35), 0 0 0 1px rgba(148,163,184,0.45)'
                  : '0 10px 24px rgba(15,23,42,0.18)',
                transform: fabOpen
                  ? 'translateX(0) translateY(-6px) scale(1)'
                  : 'translateX(26px) translateY(6px) scale(0.92)',
                opacity: fabOpen ? 1 : 0,
                pointerEvents: fabOpen ? 'auto' : 'none',
                transition: 'transform 0.5s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.25s ease',
                transitionDelay: fabOpen ? '0.24s' : '0s',
                zIndex: 1090,
                '&:hover .profile-share-card-overlay': {
                  opacity: 1,
                },
                '&:hover .profile-share-card-image': {
                  filter: 'brightness(0.88) saturate(1.02)',
                },
              }}
              imageUrl={profileShareImageUrl}
              imageAlt={`${profileUser?.username || 'User'} profile portrait`}
              imageClassName="profile-share-card-image"
              imageSx={{
                objectFit: 'contain',
                filter: 'brightness(1.08) saturate(1.08)',
                transform: profileShareCardTransform,
              }}
              fallbackSx={{
                background: profileFallbackGradient,
              }}
              label="PROFILE"
              title={String(profileUser?.username || '').toUpperCase()}
              qrUrl={profileShareQrUrl}
              overlayClassName="profile-share-card-overlay"
              overlayText="Tap to Share"
              overlaySx={{ fontSize: '0.72rem' }}
            />

              <Stack direction="column" spacing={1.25} alignItems="flex-end">
              {canOpenProfileSettings && (
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: fabOpen ? (canReportProfile ? 132 : 72) : 0,
                    right: 0,
                    opacity: fabOpen ? 1 : 0,
                    pointerEvents: fabOpen ? 'auto' : 'none',
                    transition: 'bottom 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease-in-out',
                    transitionDelay: fabOpen ? '0.12s' : '0s',
                    zIndex: 1135,
                  }}
                >
                  <Tooltip title="Profile settings" placement="left">
                    <Fab
                      size="small"
                      color="secondary"
                      onClick={handleOpenProfileSettings}
                      aria-label="Open profile settings"
                    >
                      <SettingsOutlinedIcon fontSize="small" />
                    </Fab>
                  </Tooltip>
                </Box>
              )}

              {canReportProfile && (
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: fabOpen ? 72 : 0,
                    right: 0,
                    opacity: fabOpen ? 1 : 0,
                    pointerEvents: fabOpen ? 'auto' : 'none',
                    transition: 'bottom 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease-in-out',
                    transitionDelay: fabOpen ? '0.08s' : '0s',
                    zIndex: 1130,
                  }}
                >
                  <Tooltip title="Report user" placement="left">
                    <Fab
                      size="small"
                      color="error"
                      onClick={handleOpenReportDialog}
                      aria-label="Report user"
                    >
                      <ReportProblemOutlinedIcon fontSize="small" />
                    </Fab>
                  </Tooltip>
                </Box>
              )}

              <Tooltip title={fabOpen ? 'Close actions' : 'Profile actions'} placement="left">
                <Fab
                  color="primary"
                  onClick={() => setFabOpen((prev) => !prev)}
                  aria-label="Profile actions"
                  sx={{
                    boxShadow: '0 10px 28px rgba(0,0,0,0.22)',
                    transform: fabOpen ? 'rotate(45deg)' : 'rotate(0deg)',
                    transition: 'transform 0.3s ease, background-color 0.2s ease',
                    zIndex: 1140,
                  }}
                >
                  {fabOpen ? <ExpandLessIcon /> : <AddIcon />}
                </Fab>
              </Tooltip>
              </Stack>
            </Box>
          </Box>
        </ClickAwayListener>
      )}

      {profileModulePopupEvent ? (
        <EventPopup
          event={profileModulePopupEvent}
          open
          onClose={() => setProfileModulePopupEvent(null)}
          onDelete={() => {}}
          onEdit={() => {}}
          setIsPopupOpen={() => {}}
        />
      ) : null}

      <Dialog
        open={reportDialogOpen}
        onClose={handleCloseReportDialog}
        fullWidth
        maxWidth="sm"
        PaperProps={{ sx: getGlassDialogPaperSx(theme) }}
      >
        <DialogTitle>Report {profileUser?.username || 'User'}</DialogTitle>
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
