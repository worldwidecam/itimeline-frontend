import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link as RouterLink, useNavigate, useLocation, useParams } from 'react-router-dom';
import TimelineNameDisplay from './timeline-v3/TimelineNameDisplay';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  LinearProgress,
  Avatar,
  Tooltip,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Menu,
  MenuItem,
  Popper,
  Paper,
  ClickAwayListener,
  Grow,
  useTheme,
  Switch,
} from '@mui/material';
import UserAvatar from './common/UserAvatar';
import { useAuth } from '../contexts/AuthContext';
import { useEmailBlur } from '../contexts/EmailBlurContext';
import { useTheme as useAppTheme } from '../contexts/ThemeContext';
import MenuIcon from '@mui/icons-material/Menu';
import SettingsIcon from '@mui/icons-material/Settings';
import PersonIcon from '@mui/icons-material/Person';
import TagIcon from '@mui/icons-material/Tag';
import HistoryIcon from '@mui/icons-material/History';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CloseIcon from '@mui/icons-material/Close';
import VolunteerActivismRoundedIcon from '@mui/icons-material/VolunteerActivismRounded';
import ThumbDownAltRoundedIcon from '@mui/icons-material/ThumbDownAltRounded';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import ToolbarSpacer from './ToolbarSpacer';
import api, { checkMembershipStatus, getTimelineWarningState, getTimelineStatusMessage, getTimelineActions, getLandingRotatorSettings } from '../utils/api';
import { STATUS_ACTION_TYPE_MAP, STATUS_VARIANT_MAP, formatActionSchedule, getActionProgressMeta } from './timeline-v3/community/timelineStatusActionUtils';
import { displayUsername } from '../utils/usernameDisplay';
import RichContentRenderer from './timeline-v3/events/RichContentRenderer';
const EventPopup = React.lazy(() => import('./timeline-v3/events/EventPopup'));

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const theme = useTheme();
  const { user, logout, isGuest } = useAuth();
  const { getBlurredEmail } = useEmailBlur();
  const { isDarkMode, toggleTheme } = useAppTheme();
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [currentTimelineName, setCurrentTimelineName] = React.useState('');
  const [lastVisitedTimeline, setLastVisitedTimeline] = React.useState(null);
  const [lastVisitedTimelines, setLastVisitedTimelines] = React.useState([]);
  const [siteRole, setSiteRole] = React.useState(null);
  const [isSiteAdmin, setIsSiteAdmin] = React.useState(false);
  const [timelineWarningState, setTimelineWarningState] = useState({ active: false });
  const [warningAnchorEl, setWarningAnchorEl] = useState(null);
  const [timelineStatusMessage, setTimelineStatusMessage] = useState({ active: false });
  const [statusAnchorEl, setStatusAnchorEl] = useState(null);
  const [showStatusAttention, setShowStatusAttention] = useState(false);
  const [showWarningAttention, setShowWarningAttention] = useState(false);
  const [statusActionCard, setStatusActionCard] = useState(null);
  const [isStatusViewerMember, setIsStatusViewerMember] = useState(true);
  const [statusEventPopup, setStatusEventPopup] = useState(null);
  const [statusEventPopupOpen, setStatusEventPopupOpen] = useState(false);
  const [toolbarLedMessage, setToolbarLedMessage] = useState('');
  const [toolbarLedEnabled, setToolbarLedEnabled] = useState(false);
  const [toolbarLedRandomStart, setToolbarLedRandomStart] = useState(true);
  const [toolbarLedStartDelaySeconds, setToolbarLedStartDelaySeconds] = useState(45);
  const [showToolbarLed, setShowToolbarLed] = useState(false);
  const [showToolbarLedLane, setShowToolbarLedLane] = useState(false);
  const [toolbarLedLaneExpanding, setToolbarLedLaneExpanding] = useState(false);
  const [toolbarLedLaneWidth, setToolbarLedLaneWidth] = useState(0);
  const [toolbarLedDurationMs, setToolbarLedDurationMs] = useState(12000);
  const toolbarLedLaneIntroMs = 520;
  const toolbarLedContainerRef = useRef(null);
  const toolbarLedTextRef = useRef(null);
  const toolbarLedMeasureRef = useRef(null);
  const toolbarLedStartTimeoutRef = useRef(null);
  const toolbarLedIntroTimeoutRef = useRef(null);
  const currentPath = location.pathname;

  const clearToolbarLedStartTimer = useCallback(() => {
    if (toolbarLedStartTimeoutRef.current) {
      clearTimeout(toolbarLedStartTimeoutRef.current);
      toolbarLedStartTimeoutRef.current = null;
    }
  }, []);

  const clearToolbarLedIntroTimer = useCallback(() => {
    if (toolbarLedIntroTimeoutRef.current) {
      clearTimeout(toolbarLedIntroTimeoutRef.current);
      toolbarLedIntroTimeoutRef.current = null;
    }
  }, []);

  const getToolbarLedDelayMs = useCallback(() => {
    if (toolbarLedRandomStart) {
      const minSeconds = 5 * 60;
      const maxSeconds = 30 * 60;
      return (Math.floor(Math.random() * (maxSeconds - minSeconds + 1)) + minSeconds) * 1000;
    }

    return Math.max(5, Number(toolbarLedStartDelaySeconds) || 45) * 1000;
  }, [toolbarLedRandomStart, toolbarLedStartDelaySeconds]);

  const runToolbarLedCycle = useCallback(() => {
    if (!toolbarLedEnabled || !toolbarLedMessage.trim()) {
      setShowToolbarLed(false);
      setShowToolbarLedLane(false);
      setToolbarLedLaneExpanding(false);
      return;
    }

    const laneWidth = toolbarLedContainerRef.current?.offsetWidth || 0;
    const textWidth = toolbarLedMeasureRef.current?.scrollWidth || toolbarLedTextRef.current?.scrollWidth || 0;
    const pxPerSecond = 96;
    const travelDistance = laneWidth + textWidth + 48;
    const nextDurationMs = Math.max(7000, Math.round((travelDistance / pxPerSecond) * 1000));

    clearToolbarLedIntroTimer();
    setToolbarLedLaneWidth(laneWidth);
    setToolbarLedDurationMs(nextDurationMs);
    setShowToolbarLed(false);
    setShowToolbarLedLane(true);
    setToolbarLedLaneExpanding(true);

    toolbarLedIntroTimeoutRef.current = setTimeout(() => {
      setToolbarLedLaneExpanding(false);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setShowToolbarLed(true);
        });
      });
    }, toolbarLedLaneIntroMs);
  }, [clearToolbarLedIntroTimer, toolbarLedEnabled, toolbarLedMessage, toolbarLedLaneIntroMs]);
  
  // Function to handle navigation with refresh capability
  const handleNavigation = (path) => {
    // If we're already on this page, refresh the content
    if (path === currentPath) {
      // Close the drawer first
      setDrawerOpen(false);
      
      // For home page or timeline pages, force a refresh
      if (path === '/home' || path.startsWith('/timeline-v3/')) {
        // Force a refresh by navigating away and back
        // This is a simple way to trigger a re-render of the component
        navigate('/refresh-redirect', { replace: true });
        setTimeout(() => navigate(path, { replace: true }), 10);
      }
    } else {
      // Navigate to the new page
      navigate(path);
      setDrawerOpen(false);
    }
  };
  
  const isProfilePage = location.pathname.startsWith('/profile');
  const isTimelinePage = location.pathname.startsWith('/timeline-v3/');
  // Extract numeric timelineId even when on nested routes like /timeline-v3/:id/admin
  const timelineId = (() => {
    if (!isTimelinePage) return null;
    const match = location.pathname.match(/^\/timeline-v3\/(\d+)/);
    return match ? match[1] : null;
  })();

  const isMembersPage = currentPath.includes('/members') && isTimelinePage;
  const isAdminPage = currentPath.includes('/admin') && isTimelinePage;
  const shouldNavigateToTimeline = (isMembersPage || isAdminPage) && timelineId;

  const warningPanelOpen = Boolean(warningAnchorEl);
  const statusPanelOpen = Boolean(statusAnchorEl);
  const warningScopeLabel = timelineWarningState?.warning_scope === 'action_cards'
    ? 'Action Card Warning'
    : 'General Warning';
  const warningUntilLabel = timelineWarningState?.is_indef
    ? 'INDEF'
    : (timelineWarningState?.warning_until
      ? new Date(timelineWarningState.warning_until).toLocaleDateString()
      : null);
  const statusType = (timelineStatusMessage?.status_type || '').toLowerCase();
  const statusVariantMap = {
    good: {
      ...STATUS_VARIANT_MAP.good,
      iconNode: <VolunteerActivismRoundedIcon sx={{ fontSize: '1.32rem' }} />,
    },
    bad: {
      ...STATUS_VARIANT_MAP.bad,
      iconNode: <ThumbDownAltRoundedIcon sx={{ fontSize: '1.32rem' }} />,
    },
    bronze_action: {
      ...STATUS_VARIANT_MAP.bronze_action,
      iconNode: <Box component="span" sx={{ fontSize: '1.42rem', lineHeight: 1 }}>🥉</Box>,
    },
    silver_action: {
      ...STATUS_VARIANT_MAP.silver_action,
      iconNode: <Box component="span" sx={{ fontSize: '1.42rem', lineHeight: 1 }}>🥈</Box>,
    },
    gold_action: {
      ...STATUS_VARIANT_MAP.gold_action,
      iconNode: <Box component="span" sx={{ fontSize: '1.42rem', lineHeight: 1 }}>🥇</Box>,
    },
  };
  const statusTone = statusVariantMap[statusType] || null;
  const statusIcon = statusTone?.iconNode || null;
  const statusActionType = STATUS_ACTION_TYPE_MAP[statusType] || null;
  const statusActionSchedule = formatActionSchedule(statusActionCard?.due_date, { includeDayLabel: true });
  const statusActionProgress = getActionProgressMeta(statusActionCard);
  const shouldBlurStatusCard = statusTone?.layout === 'landscape' && !isStatusViewerMember;

  const getStatusInspectionKey = useCallback(() => {
    if (!timelineId || !timelineStatusMessage?.active || !statusType) return null;
    const updatedAt = timelineStatusMessage?.updated_at || 'no-updated-at';
    return `timeline-status-inspected:${timelineId}:${statusType}:${updatedAt}`;
  }, [timelineId, timelineStatusMessage?.active, timelineStatusMessage?.updated_at, statusType]);

  const markStatusInspected = useCallback(() => {
    const key = getStatusInspectionKey();
    if (!key) return;
    localStorage.setItem(key, '1');
    setShowStatusAttention(false);
  }, [getStatusInspectionKey]);

  const getWarningInspectionKey = useCallback(() => {
    if (!timelineId || !timelineWarningState?.active) return null;
    return `timeline-warning-inspected:${timelineId}`;
  }, [timelineId, timelineWarningState?.active]);

  const markWarningInspected = useCallback(() => {
    const key = getWarningInspectionKey();
    if (!key) return;
    localStorage.setItem(key, '1');
    setShowWarningAttention(false);
  }, [getWarningInspectionKey]);

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    await logout();
    handleClose();
    navigate('/');
  };

  const toggleDrawer = (open) => (event) => {
    if (event && event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) {
      return;
    }
    setDrawerOpen(open);
  };
  
  // Function to toggle the drawer state when hamburger icon is clicked
  const handleHamburgerClick = () => {
    setDrawerOpen(!drawerOpen);
  };

  const handleWarningToggle = (event) => {
    if (warningPanelOpen) {
      setWarningAnchorEl(null);
      return;
    }
    markWarningInspected();
    setWarningAnchorEl(event.currentTarget);
  };

  const handleWarningClose = () => {
    setWarningAnchorEl(null);
  };

  const handleStatusToggle = (event) => {
    if (statusPanelOpen) {
      setStatusAnchorEl(null);
      return;
    }
    markStatusInspected();
    setStatusAnchorEl(event.currentTarget);
  };

  const handleStatusClose = () => {
    setStatusAnchorEl(null);
  };

  const handleStatusEventPopupOpen = ({ eventId, resolvedEvent }) => {
    setStatusEventPopup(resolvedEvent);
    setStatusEventPopupOpen(true);
    handleStatusClose(); // Close the dropdown so it doesn't block the popup
  };

  const handleStatusEventPopupClose = () => {
    setStatusEventPopupOpen(false);
    setStatusEventPopup(null);
  };
  
  // Load last visited timeline list from localStorage on component mount
  useEffect(() => {
    const savedTimelines = localStorage.getItem('lastVisitedTimelines');
    if (savedTimelines) {
      try {
        setLastVisitedTimelines(JSON.parse(savedTimelines) || []);
      } catch (error) {
        console.error('Error parsing saved timelines:', error);
        localStorage.removeItem('lastVisitedTimelines');
      }
    } else {
      // Fallback/migration from old single lastVisitedTimeline
      const savedTimeline = localStorage.getItem('lastVisitedTimeline');
      if (savedTimeline) {
        try {
          const parsed = JSON.parse(savedTimeline);
          if (parsed && parsed.id) {
            setLastVisitedTimelines([parsed]);
            localStorage.setItem('lastVisitedTimelines', JSON.stringify([parsed]));
          }
        } catch (_) {}
      }
    }

    const savedTimeline = localStorage.getItem('lastVisitedTimeline');
    if (savedTimeline) {
      try {
        setLastVisitedTimeline(JSON.parse(savedTimeline));
      } catch (_) {}
    }
  }, []);

  useEffect(() => {
    if (!user?.id) {
      setSiteRole(null);
      setIsSiteAdmin(false);
      return;
    }
    try {
      const storageKey = `user_passport_${user.id}`;
      const passport = JSON.parse(localStorage.getItem(storageKey) || '{}');
      setSiteRole(passport.site_role || user.site_admin_role || null);
      setIsSiteAdmin(Boolean(user.is_site_admin) || Boolean(passport.is_site_admin) || Number(user.id) === 1);
    } catch (e) {
      console.warn('[Navbar] Unable to parse passport data:', e);
      setSiteRole(null);
      setIsSiteAdmin(Number(user.id) === 1);
    }
  }, [user]);

  useEffect(() => {
    let active = true;
    const fetchWarningState = async () => {
      if (!isTimelinePage || !timelineId) {
        if (active) setTimelineWarningState({ active: false });
        return;
      }
      const warningState = await getTimelineWarningState(timelineId);
      if (active) {
        setTimelineWarningState(warningState || { active: false });
      }
    };
    fetchWarningState();
    return () => {
      active = false;
    };
  }, [isTimelinePage, timelineId, currentPath]);

  useEffect(() => {
    let active = true;
    const fetchStatusActionCard = async () => {
      if (!isTimelinePage || !timelineId || !statusActionType) {
        if (active) setStatusActionCard(null);
        return;
      }

      const actionResponse = await getTimelineActions(timelineId);
      const action = actionResponse?.success
        ? (actionResponse.actions || []).find((item) => item?.action_type === statusActionType) || null
        : null;

      if (active) {
        setStatusActionCard(action);
      }
    };

    fetchStatusActionCard();
    return () => {
      active = false;
    };
  }, [isTimelinePage, timelineId, statusActionType, currentPath]);

  useEffect(() => {
    let active = true;

    const fetchStatusViewerMembership = async () => {
      if (!isTimelinePage || !timelineId) {
        if (active) setIsStatusViewerMember(true);
        return;
      }

      if (!user?.id) {
        if (active) setIsStatusViewerMember(false);
        return;
      }

      try {
        const membership = await checkMembershipStatus(timelineId);
        const isMember = Boolean(
          membership?.is_member ||
          membership?.is_active_member ||
          membership?.is_creator ||
          String(membership?.role || '').toLowerCase() === 'siteowner'
        );
        if (active) setIsStatusViewerMember(isMember);
      } catch (_error) {
        if (active) setIsStatusViewerMember(false);
      }
    };

    fetchStatusViewerMembership();

    return () => {
      active = false;
    };
  }, [isTimelinePage, timelineId, user?.id, currentPath]);

  useEffect(() => {
    if (!isTimelinePage || !timelineId || !timelineStatusMessage?.active || !statusType || timelineWarningState?.active) {
      setShowStatusAttention(false);
      return;
    }

    const key = getStatusInspectionKey();
    if (!key) {
      setShowStatusAttention(false);
      return;
    }

    setShowStatusAttention(localStorage.getItem(key) !== '1');
  }, [
    isTimelinePage,
    timelineId,
    timelineStatusMessage?.active,
    timelineStatusMessage?.updated_at,
    statusType,
    timelineWarningState?.active,
    getStatusInspectionKey,
  ]);

  useEffect(() => {
    if (!isTimelinePage || !timelineId || !timelineWarningState?.active) {
      setShowWarningAttention(false);
      return;
    }

    const key = getWarningInspectionKey();
    if (!key) {
      setShowWarningAttention(false);
      return;
    }

    setShowWarningAttention(localStorage.getItem(key) !== '1');
  }, [
    isTimelinePage,
    timelineId,
    timelineWarningState?.active,
    getWarningInspectionKey,
  ]);

  useEffect(() => {
    let active = true;
    const loadToolbarLedSettings = async () => {
      try {
        const data = await getLandingRotatorSettings();
        if (!active) return;
        const settings = data?.landing_rotator || {};
        setToolbarLedMessage(settings.toolbar_led_message || '');
        setToolbarLedEnabled(Boolean(settings.toolbar_led_enabled));
        setToolbarLedRandomStart(Boolean(settings.toolbar_led_random_start));
        setToolbarLedStartDelaySeconds(Number(settings.toolbar_led_start_delay_seconds) || 45);
      } catch (_e) {
        if (!active) return;
        setToolbarLedMessage('');
        setToolbarLedEnabled(false);
        setToolbarLedRandomStart(true);
        setToolbarLedStartDelaySeconds(45);
      }
    };

    loadToolbarLedSettings();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    clearToolbarLedStartTimer();
    clearToolbarLedIntroTimer();
    setShowToolbarLed(false);
    setShowToolbarLedLane(false);
    setToolbarLedLaneExpanding(false);

    if (!toolbarLedEnabled || !toolbarLedMessage.trim()) {
      return undefined;
    }

    toolbarLedStartTimeoutRef.current = setTimeout(() => {
      runToolbarLedCycle();
    }, getToolbarLedDelayMs());

    return () => {
      clearToolbarLedStartTimer();
      clearToolbarLedIntroTimer();
    };
  }, [
    currentPath,
    toolbarLedEnabled,
    toolbarLedMessage,
    toolbarLedRandomStart,
    toolbarLedStartDelaySeconds,
    clearToolbarLedStartTimer,
    clearToolbarLedIntroTimer,
    getToolbarLedDelayMs,
    runToolbarLedCycle,
  ]);

  const handleToolbarLedAnimationEnd = () => {
    setShowToolbarLed(false);
    setShowToolbarLedLane(false);
    setToolbarLedLaneExpanding(false);
    clearToolbarLedStartTimer();
    clearToolbarLedIntroTimer();

    if (!toolbarLedEnabled || !toolbarLedMessage.trim()) {
      return;
    }

    toolbarLedStartTimeoutRef.current = setTimeout(() => {
      runToolbarLedCycle();
    }, getToolbarLedDelayMs());
  };

  useEffect(() => {
    let active = true;
    const fetchStatusMessage = async () => {
      if (!isTimelinePage || !timelineId) {
        if (active) setTimelineStatusMessage({ active: false });
        return;
      }
      const statusMessage = await getTimelineStatusMessage(timelineId);
      if (active) {
        setTimelineStatusMessage(statusMessage || { active: false });
      }
    };
    fetchStatusMessage();
    return () => {
      active = false;
    };
  }, [isTimelinePage, timelineId, currentPath]);

  // Fetch timeline name when on a timeline page
  useEffect(() => {
    const fetchTimelineName = async () => {
      if (isTimelinePage && timelineId) {
        try {
          const response = await api.get(`/api/v1/timelines/${timelineId}`);
          if (response.data && response.data.name) {
            const timelineName = response.data.name;
            setCurrentTimelineName(timelineName);
            
            // Save this timeline as the last visited timeline
            const timelineData = {
              id: timelineId,
              name: timelineName,
              path: currentPath,
              timeline_type: response.data.timeline_type || 'hashtag' // Include timeline_type with fallback
            };
            localStorage.setItem('lastVisitedTimeline', JSON.stringify(timelineData));
            setLastVisitedTimeline(timelineData);

            // Save in the history list of last visited timelines (up to 5 recent)
            const savedListString = localStorage.getItem('lastVisitedTimelines');
            let currentList = [];
            if (savedListString) {
              try {
                currentList = JSON.parse(savedListString) || [];
              } catch (_) {}
            }
            if (!Array.isArray(currentList)) {
              currentList = [];
            }
            // Remove existing duplicate to move this to the front
            currentList = currentList.filter(t => String(t.id) !== String(timelineId));
            currentList.unshift(timelineData);
            const nextList = currentList.slice(0, 5);
            localStorage.setItem('lastVisitedTimelines', JSON.stringify(nextList));
            setLastVisitedTimelines(nextList);
          }
        } catch (error) {
          // For locked personal timelines, a 403 here is expected; avoid noisy logging
          if (error?.response?.status === 403) {
            setCurrentTimelineName('');
            return;
          }
          console.error('Error fetching timeline name:', error);
        }
      } else {
        setCurrentTimelineName('');
      }
    };
    
    fetchTimelineName();
  }, [isTimelinePage, timelineId, currentPath]);

  const profileTabs = (
    <Box
      sx={{ 
        width: 280,
        height: '100%',
        backgroundColor: theme => theme.palette.mode === 'dark' 
          ? 'rgba(10, 17, 40, 0.95)' 
          : 'rgba(255, 234, 224, 0.95)', // Light peach color to match the theme gradient
        backdropFilter: 'blur(8px)',
        borderLeft: theme => theme.palette.mode === 'dark'
          ? '1px solid rgba(144, 202, 249, 0.15)'
          : '1px solid rgba(255, 213, 200, 0.5)', // Light border for light mode
      }}
      role="presentation"
      onClick={toggleDrawer(false)}
      onKeyDown={toggleDrawer(false)}
    >
      <List>
        {user && (
          <ListItem sx={{ pt: 3, pb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
              <UserAvatar
                name={displayUsername(user.username)}
                avatarUrl={user.avatar_url}
                id={user.id}
                size={60}
                sx={{ mr: 2 }}
                userColor={user.user_color}
                isRestricted={user?.is_restricted || user?.is_suspended}
              />
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  {displayUsername(user.username)}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  {isGuest ? 'Goblin Mode (View-Only)' : getBlurredEmail(user.email)}
                </Typography>
              </Box>
            </Box>
          </ListItem>
        )}
        <Divider />
        <ListItem 
          button 
          onClick={() => handleNavigation('/home')}
          sx={{
            position: 'relative',
            backgroundColor: currentPath === '/home' ? theme => 
              theme.palette.mode === 'dark' 
                ? 'rgba(144, 202, 249, 0.15)' 
                : 'rgba(255, 213, 200, 0.5)' // Peach color for light mode
              : 'transparent',
            '&::before': currentPath === '/home' ? {
              content: '""',
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: '4px',
              backgroundColor: theme => theme.palette.primary.main,
              borderTopRightRadius: '4px',
              borderBottomRightRadius: '4px',
            } : {}
          }}
        >
          <ListItemIcon>
            <Box component="span" sx={{ display: 'flex', color: currentPath === '/home' ? 'primary.main' : 'inherit' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M9 22V12h6v10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Box>
          </ListItemIcon>
          <ListItemText 
            primary="Home" 
            primaryTypographyProps={{
              fontWeight: currentPath === '/home' ? 'bold' : 'normal',
              color: currentPath === '/home' ? 'primary.main' : 'inherit'
            }}
          />
        </ListItem>
        
        {/* Current Timeline Item - Only shown when on a timeline page */}
        {isTimelinePage && currentTimelineName && (
          <ListItem 
            button 
            onClick={() => handleNavigation(currentPath)} // Refresh current timeline
            sx={{
              position: 'relative',
              backgroundColor: theme => 
                theme.palette.mode === 'dark' 
                  ? 'rgba(144, 202, 249, 0.15)' 
                  : 'rgba(255, 213, 200, 0.5)', // Always highlighted since we're on this page
              '&::before': {
                content: '""',
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                width: '4px',
                backgroundColor: theme => theme.palette.primary.main,
                borderTopRightRadius: '4px',
                borderBottomRightRadius: '4px',
              }
            }}
          >
            <ListItemIcon>
              {lastVisitedTimeline?.timeline_type === 'community' ? (
                <span style={{ 
                  fontFamily: 'Lobster, cursive', 
                  color: 'inherit', // Use the theme's color
                  fontSize: '1.3em',
                  marginLeft: '10px' // Align with other icons
                }}>
                  i
                </span>
              ) : lastVisitedTimeline?.timeline_type === 'personal' ? (
                <span
                  aria-hidden="true"
                  style={{
                    fontFamily: 'Lobster, cursive',
                    marginLeft: '8px',
                    fontSize: '1.1em',
                    color: theme.palette.primary.main,
                    flexShrink: 0,
                  }}
                >
                  My-
                </span>
              ) : (
                <span
                  aria-hidden="true"
                  style={{
                    marginLeft: '10px',
                    fontSize: '1.1em',
                    color: theme.palette.primary.main,
                    flexShrink: 0,
                  }}
                >
                  #
                </span>
              )}
            </ListItemIcon>
            {/* For the hamburger menu, we're showing the icon separately, so we always pass 'hashtag' as type to avoid showing the prefix */}
            <Typography
              fontWeight="bold"
              color="primary.main"
              noWrap
              sx={{ maxWidth: '180px' }} // Prevent very long timeline names from breaking layout
            >
              {currentTimelineName}
            </Typography>
          </ListItem>
        )}
        
        <ListItem 
          button 
          onClick={() => handleNavigation('/profile')}
          sx={{
            position: 'relative',
            backgroundColor: currentPath === '/profile' ? theme => 
              theme.palette.mode === 'dark' 
                ? 'rgba(144, 202, 249, 0.15)' 
                : 'rgba(255, 213, 200, 0.5)' // Peach color for light mode
              : 'transparent',
            '&::before': currentPath === '/profile' ? {
              content: '""',
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: '4px',
              backgroundColor: theme => theme.palette.primary.main,
              borderTopRightRadius: '4px',
              borderBottomRightRadius: '4px',
            } : {}
          }}
        >
          <ListItemIcon>
            <PersonIcon sx={{ color: currentPath === '/profile' ? 'primary.main' : 'inherit' }} />
          </ListItemIcon>
          <ListItemText 
            primary="My Profile" 
            primaryTypographyProps={{
              fontWeight: currentPath === '/profile' ? 'bold' : 'normal',
              color: currentPath === '/profile' ? 'primary.main' : 'inherit'
            }}
          />
        </ListItem>
        <ListItem 
          button 
          onClick={() => handleNavigation('/profile/settings')}
          sx={{
            position: 'relative',
            backgroundColor: currentPath === '/profile/settings' ? theme => 
              theme.palette.mode === 'dark' 
                ? 'rgba(144, 202, 249, 0.15)' 
                : 'rgba(255, 213, 200, 0.5)' // Peach color for light mode
              : 'transparent',
            '&::before': currentPath === '/profile/settings' ? {
              content: '""',
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: '4px',
              backgroundColor: theme => theme.palette.primary.main,
              borderTopRightRadius: '4px',
              borderBottomRightRadius: '4px',
            } : {}
          }}
        >
          <ListItemIcon>
            <SettingsIcon sx={{ color: currentPath === '/profile/settings' ? 'primary.main' : 'inherit' }} />
          </ListItemIcon>
          <ListItemText 
            primary="Profile Settings" 
            primaryTypographyProps={{
              fontWeight: currentPath === '/profile/settings' ? 'bold' : 'normal',
              color: currentPath === '/profile/settings' ? 'primary.main' : 'inherit'
            }}
          />
        </ListItem>
        {(isSiteAdmin || siteRole === 'SiteOwner') && (
          <ListItem
            button
            onClick={() => handleNavigation('/site-control')}
            sx={{
              position: 'relative',
              backgroundColor: currentPath === '/site-control' ? theme =>
                theme.palette.mode === 'dark'
                  ? 'rgba(144, 202, 249, 0.15)'
                  : 'rgba(255, 213, 200, 0.5)'
                : 'transparent',
              '&::before': currentPath === '/site-control' ? {
                content: '""',
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                width: '4px',
                backgroundColor: theme => theme.palette.primary.main,
                borderTopRightRadius: '4px',
                borderBottomRightRadius: '4px',
              } : {}
            }}
          >
            <ListItemIcon>
              <AdminPanelSettingsIcon sx={{ color: currentPath === '/site-control' ? 'primary.main' : 'inherit' }} />
            </ListItemIcon>
            <ListItemText
              primary="Site Control"
              primaryTypographyProps={{
                fontWeight: currentPath === '/site-control' ? 'bold' : 'normal',
                color: currentPath === '/site-control' ? 'primary.main' : 'inherit'
              }}
            />
          </ListItem>
        )}
        <Divider sx={{ my: 1.5 }} />
        <ListItem 
          button 
          onClick={toggleTheme}
          sx={{ py: 1 }}
        >
          <ListItemIcon>
            {isDarkMode ? (
              <DarkModeIcon sx={{ color: 'primary.main' }} />
            ) : (
              <LightModeIcon sx={{ color: '#f4b942' }} />
            )}
          </ListItemIcon>
          <ListItemText 
            primary={isDarkMode ? "Dark Theme" : "Light Theme"} 
            primaryTypographyProps={{ fontWeight: 500 }}
          />
          <Switch 
            checked={isDarkMode}
            onChange={(e) => {
              e.stopPropagation();
              toggleTheme();
            }}
            color="primary"
            sx={{
              '& .MuiSwitch-switchBase': {
                '&.Mui-checked': {
                  color: '#90caf9',
                  '& + .MuiSwitch-track': {
                    backgroundColor: '#90caf9',
                  },
                },
              },
              '& .MuiSwitch-thumb': {
                backgroundColor: isDarkMode ? '#90caf9' : '#f4b942',
              },
              '& .MuiSwitch-track': {
                backgroundColor: isDarkMode ? 'rgba(144, 202, 249, 0.5)' : 'rgba(244, 185, 66, 0.5)',
              },
            }}
          />
        </ListItem>
        <Divider sx={{ my: 1.5 }} />
        
        {/* Last Visited Timelines section */}
        {(() => {
          const filteredVisited = lastVisitedTimelines.filter(
            t => t && t.id && (!isTimelinePage || String(t.id) !== String(timelineId))
          );
          if (filteredVisited.length === 0) return null;
          return (
            <>
              <Typography 
                variant="subtitle2" 
                color="text.secondary" 
                sx={{ px: 2, py: 1, fontSize: '0.75rem', fontWeight: 'bold' }}
              >
                {filteredVisited.length > 1 ? "RECENT TIMELINES" : "LAST VISITED TIMELINE"}
              </Typography>
              {filteredVisited.map((t, idx) => (
                <ListItem 
                  key={t.id || idx}
                  button 
                  onClick={() => handleNavigation(t.path)}
                  sx={{
                    position: 'relative',
                    '&:hover': {
                      backgroundColor: theme => 
                        theme.palette.mode === 'dark' 
                          ? 'rgba(144, 202, 249, 0.08)' 
                          : 'rgba(255, 213, 200, 0.3)',
                    }
                  }}
                >
                  <ListItemIcon>
                    {t.timeline_type === 'community' ? (
                      <span style={{ 
                        fontFamily: 'Lobster, cursive', 
                        color: 'inherit', // Use the theme's color
                        fontSize: '1.3em',
                        marginLeft: '10px' // Match the positioning of the current timeline
                      }}>
                        i
                      </span>
                    ) : t.timeline_type === 'personal' ? (
                      <span
                        aria-hidden="true"
                        style={{
                          fontFamily: 'Lobster, cursive',
                          marginLeft: '8px',
                          fontSize: '1.1em',
                          color: theme.palette.primary.main,
                          flexShrink: 0,
                        }}
                      >
                        My-
                      </span>
                    ) : (
                      <span
                        aria-hidden="true"
                        style={{
                          marginLeft: '10px',
                          fontSize: '1.1em',
                          color: theme.palette.primary.main,
                          flexShrink: 0,
                        }}
                      >
                        #
                      </span>
                    )}
                  </ListItemIcon>
                  {/* For the last visited timeline, we're showing the icon separately, so we show just the name */}
                  <Typography
                    noWrap
                    sx={{ maxWidth: '180px' }} // Prevent very long timeline names from breaking layout
                  >
                    {displayUsername(t.name)}
                  </Typography>
                </ListItem>
              ))}
              <Divider sx={{ my: 1 }} />
            </>
          );
        })()}
        
        <ListItem button onClick={handleLogout}>
          <ListItemIcon>
            <Box component="span" sx={{ display: 'flex' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Box>
          </ListItemIcon>
          <ListItemText primary="Logout" />
        </ListItem>
      </List>
    </Box>
  );

  return (
    <>
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <Typography
            variant="h5"
            component={RouterLink}
            to={
              currentPath === '/profile/settings'
                ? '/profile'
                : (shouldNavigateToTimeline ? `/timeline-v3/${timelineId}` : (user && !['/login', '/register'].includes(currentPath) ? '/home' : '/'))
            }
            onClick={(e) => {
              if (currentPath === '/profile/settings') {
                e.preventDefault();
                navigate(-1);
                return;
              }
              // If already on the destination page, force a reload
              const target = shouldNavigateToTimeline ? `/timeline-v3/${timelineId}` : (user && !['/login', '/register'].includes(currentPath) ? '/home' : '/');
              if (currentPath === target) {
                e.preventDefault();
                window.location.reload();
              }
            }}
            sx={{ 
              textDecoration: 'none', 
              color: 'inherit', 
              mr: 2, 
              flexShrink: 0,
              fontFamily: "'Lobster', cursive",
              fontSize: '1.75rem',
              transform: 'translateY(-2px)'
            }}
          >
            iTimeline
          </Typography>

          <Box
            ref={toolbarLedContainerRef}
            sx={{
              position: 'relative',
              flexGrow: 1,
              height: 30,
              mx: 1,
              overflow: 'hidden',
              borderRadius: 999,
              transformOrigin: 'right center',
              border: showToolbarLedLane
                ? (theme.palette.mode === 'dark'
                  ? '1px solid rgba(255, 255, 255, 0.14)'
                  : '1px solid rgba(0, 0, 0, 0.1)')
                : '1px solid transparent',
              background: showToolbarLedLane
                ? (theme.palette.mode === 'dark'
                  ? 'linear-gradient(180deg, rgba(12, 20, 33, 0.78) 0%, rgba(8, 12, 21, 0.65) 100%)'
                  : 'linear-gradient(180deg, rgba(245, 247, 252, 0.95) 0%, rgba(232, 237, 248, 0.95) 100%)')
                : 'transparent',
              boxShadow: showToolbarLedLane
                ? (theme.palette.mode === 'dark'
                  ? 'inset 0 0 12px rgba(50, 120, 255, 0.12)'
                  : 'inset 0 0 10px rgba(0, 76, 153, 0.08)')
                : 'none',
              transition: 'background 220ms ease, border-color 220ms ease, box-shadow 220ms ease',
              animation: toolbarLedLaneExpanding ? `toolbar-led-lane-grow ${toolbarLedLaneIntroMs}ms ease-out forwards` : 'none',
              '@keyframes toolbar-led-lane-grow': {
                '0%': {
                  transform: 'scaleX(0)',
                  opacity: 0.3
                },
                '100%': {
                  transform: 'scaleX(1)',
                  opacity: 1
                }
              }
            }}
          >
            <Typography
              ref={toolbarLedMeasureRef}
              sx={{
                position: 'absolute',
                visibility: 'hidden',
                whiteSpace: 'nowrap',
                pointerEvents: 'none',
                px: 1,
                fontSize: '0.84rem',
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase'
              }}
            >
              {toolbarLedMessage}
            </Typography>
            {showToolbarLed && toolbarLedEnabled && toolbarLedMessage.trim() && (
              <Typography
                ref={toolbarLedTextRef}
                onAnimationEnd={handleToolbarLedAnimationEnd}
                sx={{
                  position: 'absolute',
                  left: 0,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  whiteSpace: 'nowrap',
                  px: 1,
                  fontSize: '0.84rem',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: theme.palette.mode === 'dark' ? '#9ad8ff' : '#0f2c50',
                  textShadow: theme.palette.mode === 'dark'
                    ? '0 0 8px rgba(122, 205, 255, 0.5)'
                    : '0 0 6px rgba(71, 153, 255, 0.35)',
                  willChange: 'transform',
                  '--toolbar-led-lane-width': `${toolbarLedLaneWidth || 0}px`,
                  animation: `toolbar-led-marquee ${toolbarLedDurationMs}ms linear forwards`,
                  '@keyframes toolbar-led-marquee': {
                    '0%': {
                      transform: 'translate(calc(var(--toolbar-led-lane-width) + 24px), -50%)'
                    },
                    '100%': {
                      transform: 'translate(calc(-100% - 24px), -50%)'
                    }
                  }
                }}
              >
                {toolbarLedMessage}
              </Typography>
            )}
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {user && !['/login', '/register'].includes(currentPath) ? (
              <>
                {isTimelinePage && !timelineWarningState?.active && timelineStatusMessage?.active && statusTone && statusIcon && (
                  <>
                    <Tooltip title={statusTone.tooltip}>
                      <IconButton
                        color="inherit"
                        onClick={handleStatusToggle}
                        sx={{
                          mr: 1,
                          color: statusTone.icon,
                          position: 'relative',
                          width: 42,
                          height: 42,
                          '&:hover': { color: statusTone.hover },
                          ...(showStatusAttention ? {
                            '&::before': {
                              content: '""',
                              position: 'absolute',
                              inset: -4,
                              borderRadius: '50%',
                              border: '1px solid rgba(244, 206, 90, 0.7)',
                              boxShadow: '0 0 16px rgba(244, 206, 90, 0.45)',
                              animation: 'status-icon-pulse-ring 2.1s ease-out infinite',
                              pointerEvents: 'none',
                            },
                            '&::after': {
                              content: '""',
                              position: 'absolute',
                              width: 6,
                              height: 6,
                              borderRadius: '50%',
                              top: -1,
                              left: '50%',
                              transform: 'translateX(-50%)',
                              background: 'radial-gradient(circle, rgba(255,231,155,0.95) 0%, rgba(255,231,155,0.3) 68%, rgba(255,231,155,0) 100%)',
                              boxShadow: '0 0 9px rgba(255,215,120,0.8)',
                              animation: 'status-icon-particle-orbit 2.6s linear infinite',
                              pointerEvents: 'none',
                            },
                            '@keyframes status-icon-pulse-ring': {
                              '0%': { transform: 'scale(0.94)', opacity: 0.8 },
                              '70%': { transform: 'scale(1.18)', opacity: 0.25 },
                              '100%': { transform: 'scale(1.22)', opacity: 0 },
                            },
                            '@keyframes status-icon-particle-orbit': {
                              '0%': { transform: 'translate(-50%, 0) rotate(0deg) translateX(12px)' },
                              '100%': { transform: 'translate(-50%, 0) rotate(360deg) translateX(12px)' },
                            },
                          } : {}),
                        }}
                        aria-label="timeline status message"
                      >
                        {statusIcon}
                      </IconButton>
                    </Tooltip>
                    <Popper
                      open={statusPanelOpen}
                      anchorEl={statusAnchorEl}
                      placement="bottom-start"
                      transition
                      modifiers={[{ name: 'offset', options: { offset: [0, 10] } }]}
                      sx={{ zIndex: 1700 }}
                    >
                      {({ TransitionProps }) => (
                        <Grow
                          {...TransitionProps}
                          timeout={260}
                          style={{ transformOrigin: 'right top' }}
                        >
                          <Paper
                            elevation={10}
                            sx={{
                              width: statusTone.layout === 'landscape' ? { xs: 320, sm: 430 } : 260,
                              minHeight: statusTone.layout === 'landscape' ? 220 : 340,
                              maxWidth: 'calc(100vw - 24px)',
                              borderRadius: 4,
                              overflow: 'hidden',
                              background: statusTone.body,
                              color: statusTone.text,
                            }}
                          >
                            <ClickAwayListener onClickAway={handleStatusClose}>
                              <Box sx={{ position: 'relative' }}>
                                <Box sx={shouldBlurStatusCard ? { filter: 'blur(10px)', pointerEvents: 'none', userSelect: 'none' } : undefined}>
                                  <Box
                                    sx={{
                                      px: 2.5,
                                      py: 2,
                                      background: statusTone.header,
                                      color: '#fff',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'space-between',
                                    }}
                                  >
                                    <Box>
                                      <Typography variant="subtitle1" sx={{ fontWeight: 800, letterSpacing: 0.6 }}>
                                        {statusTone.label}
                                      </Typography>
                                      <Typography variant="caption" sx={{ opacity: 0.9 }}>
                                        Timeline Status
                                      </Typography>
                                    </Box>
                                    <IconButton
                                      size="small"
                                      onClick={handleStatusClose}
                                      sx={{ color: '#fff', bgcolor: 'rgba(255,255,255,0.18)' }}
                                    >
                                      <CloseIcon fontSize="small" />
                                    </IconButton>
                                  </Box>
                                  <Box sx={{ px: 2.5, pt: 2, pb: statusTone.layout === 'landscape' ? 2 : 3 }}>
                                    {statusTone.layout === 'landscape' ? (
                                      <>
                                        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'stretch' }}>
                                          {statusActionSchedule && (
                                            <Box
                                              sx={{
                                                width: { xs: 112, sm: 126 },
                                                minWidth: { xs: 112, sm: 126 },
                                                borderRadius: 1.5,
                                                overflow: 'hidden',
                                                border: '1px solid rgba(255,255,255,0.4)',
                                                boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
                                              }}
                                            >
                                              <Box
                                                sx={{
                                                  px: 1,
                                                  py: 0.45,
                                                  bgcolor: 'rgba(255,255,255,0.35)',
                                                  borderBottom: '1px solid rgba(255,255,255,0.4)',
                                                  textAlign: 'center',
                                                }}
                                              >
                                                <Typography sx={{ fontSize: '0.63rem', letterSpacing: 0.45, fontWeight: 800, textTransform: 'uppercase' }}>
                                                  Day of Action
                                                </Typography>
                                              </Box>
                                              <Box
                                                sx={{
                                                  px: 1,
                                                  py: 0.7,
                                                  minHeight: 82,
                                                  display: 'flex',
                                                  flexDirection: 'column',
                                                  justifyContent: 'center',
                                                  alignItems: 'center',
                                                  textAlign: 'center',
                                                  bgcolor: 'rgba(255,255,255,0.2)',
                                                }}
                                              >
                                                <Typography sx={{ fontWeight: 700, fontSize: '0.78rem', lineHeight: 1.2 }}>
                                                  {statusActionSchedule.dateLabel}
                                                </Typography>
                                                <Typography sx={{ mt: 0.35, opacity: 0.88, fontSize: '0.71rem', fontWeight: 600 }}>
                                                  {statusActionSchedule.timeLabel}
                                                </Typography>
                                                <Typography sx={{ mt: 0.4, opacity: 0.74, fontSize: '0.61rem' }}>
                                                  {statusActionSchedule.dayLabel}
                                                </Typography>
                                              </Box>
                                            </Box>
                                          )}

                                          <Box sx={{ flex: 1, minWidth: 0 }}>
                                            {timelineStatusMessage?.status_header && (
                                              <Typography
                                                variant="caption"
                                                sx={{
                                                  fontWeight: 700,
                                                  letterSpacing: 0.3,
                                                  textTransform: 'uppercase',
                                                  display: 'block',
                                                  mt: 0.5,
                                                }}
                                              >
                                                {timelineStatusMessage.status_header}
                                              </Typography>
                                            )}
                                            <Box sx={{ mt: 1, lineHeight: 1.6 }}>
                                              <RichContentRenderer
                                                content={timelineStatusMessage?.status_body || ''}
                                                theme={theme}
                                                inheritTextColor
                                              />
                                            </Box>
                                          </Box>
                                        </Box>

                                        {statusActionCard?.progress && (
                                          <Box
                                            sx={{
                                              mt: 1.7,
                                              p: 1.2,
                                              borderRadius: 1.5,
                                              bgcolor: statusActionProgress.isUnlocked ? 'rgba(26, 128, 67, 0.20)' : 'rgba(0, 0, 0, 0.11)',
                                              border: '1px solid',
                                              borderColor: statusActionProgress.isUnlocked ? 'rgba(26, 128, 67, 0.35)' : 'rgba(255,255,255,0.32)',
                                            }}
                                          >
                                            <Typography variant="caption" sx={{ display: 'block', fontWeight: 800, letterSpacing: 0.25, textAlign: 'center' }}>
                                              {statusActionProgress.isUnlocked ? 'Threshold Achieved' : 'Current Tally'}
                                            </Typography>
                                            <LinearProgress
                                              variant="determinate"
                                              value={Math.round((statusActionProgress.ratio || 0) * 100)}
                                              sx={{
                                                mt: 0.8,
                                                height: 6,
                                                borderRadius: 999,
                                                bgcolor: 'rgba(255,255,255,0.35)',
                                                '& .MuiLinearProgress-bar': {
                                                  bgcolor: statusTone.icon,
                                                },
                                              }}
                                            />
                                            {statusActionProgress.label && (
                                              <Typography variant="caption" sx={{ display: 'block', mt: 0.5, opacity: 0.9, textAlign: 'center' }}>
                                                {statusActionProgress.label}
                                              </Typography>
                                            )}
                                          </Box>
                                        )}
                                      </>
                                    ) : (
                                      <>
                                        {timelineStatusMessage?.status_header && (
                                          <Typography
                                            variant="caption"
                                            sx={{
                                              fontWeight: 700,
                                              letterSpacing: 0.3,
                                              textTransform: 'uppercase',
                                              display: 'block',
                                              mt: 0.5
                                            }}
                                          >
                                            {timelineStatusMessage.status_header}
                                          </Typography>
                                        )}
                                        <Box sx={{ mt: 1, lineHeight: 1.6 }}>
                                          <RichContentRenderer
                                            content={timelineStatusMessage?.status_body || ''}
                                            theme={theme}
                                            inheritTextColor
                                            onChipClick={handleStatusClose}
                                            onOpenEventReference={handleStatusEventPopupOpen}
                                          />
                                        </Box>
                                      </>
                                    )}
                                  </Box>
                                </Box>

                                {shouldBlurStatusCard && (
                                  <Box
                                    sx={{
                                      position: 'absolute',
                                      inset: 0,
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      textAlign: 'center',
                                      pointerEvents: 'none',
                                      px: 2,
                                    }}
                                  >
                                    <Typography
                                      variant="subtitle1"
                                      sx={{
                                        fontWeight: 700,
                                        letterSpacing: 0.2,
                                        color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.95)' : 'rgba(0,0,0,0.84)',
                                        textShadow: theme.palette.mode === 'dark'
                                          ? '0 1px 10px rgba(0,0,0,0.8)'
                                          : '0 1px 10px rgba(255,255,255,0.8)',
                                      }}
                                    >
                                      Oops! you&apos;re not a member
                                    </Typography>
                                  </Box>
                                )}
                              </Box>
                            </ClickAwayListener>
                          </Paper>
                        </Grow>
                      )}
                    </Popper>
                  </>
                )}
                {isTimelinePage && timelineWarningState?.active && (
                  <>
                    <Tooltip title="View warning status">
                      <IconButton
                        color="inherit"
                        onClick={handleWarningToggle}
                        sx={{
                          mr: 1,
                          color: 'warning.main',
                          '&:hover': { color: 'warning.dark' },
                          position: 'relative',
                          width: 42,
                          height: 42,
                          ...(showWarningAttention ? {
                            '&::before': {
                              content: '""',
                              position: 'absolute',
                              inset: -4,
                              borderRadius: '50%',
                              border: '1px solid rgba(244, 206, 90, 0.7)',
                              boxShadow: '0 0 16px rgba(244, 206, 90, 0.45)',
                              animation: 'status-icon-pulse-ring 2.1s ease-out infinite',
                              pointerEvents: 'none',
                            },
                            '&::after': {
                              content: '""',
                              position: 'absolute',
                              width: 6,
                              height: 6,
                              borderRadius: '50%',
                              top: -1,
                              left: '50%',
                              transform: 'translateX(-50%)',
                              background: 'radial-gradient(circle, rgba(255,231,155,0.95) 0%, rgba(255,231,155,0.3) 68%, rgba(255,231,155,0) 100%)',
                              boxShadow: '0 0 9px rgba(255,215,120,0.8)',
                              animation: 'status-icon-particle-orbit 2.6s linear infinite',
                              pointerEvents: 'none',
                            },
                            '@keyframes status-icon-pulse-ring': {
                              '0%': { transform: 'scale(0.94)', opacity: 0.8 },
                              '70%': { transform: 'scale(1.18)', opacity: 0.25 },
                              '100%': { transform: 'scale(1.22)', opacity: 0 },
                            },
                            '@keyframes status-icon-particle-orbit': {
                              '0%': { transform: 'translate(-50%, 0) rotate(0deg) translateX(12px)' },
                              '100%': { transform: 'translate(-50%, 0) rotate(360deg) translateX(12px)' },
                            },
                          } : {}),
                        }}
                        aria-label="warning status"
                      >
                        <WarningAmberIcon />
                      </IconButton>
                    </Tooltip>
                    <Popper
                      open={warningPanelOpen}
                      anchorEl={warningAnchorEl}
                      placement="bottom-start"
                      transition
                      modifiers={[{ name: 'offset', options: { offset: [0, 10] } }]}
                      sx={{ zIndex: 1700 }}
                    >
                      {({ TransitionProps }) => (
                        <Grow
                          {...TransitionProps}
                          timeout={280}
                          style={{ transformOrigin: 'right top' }}
                        >
                          <Paper
                            elevation={10}
                            sx={{
                              width: 260,
                              minHeight: 340,
                              borderRadius: 4,
                              overflow: 'hidden',
                              background: 'linear-gradient(180deg, #ffb76b 0%, #ffe6a6 100%)',
                              color: '#4e2b00',
                            }}
                          >
                            <ClickAwayListener onClickAway={handleWarningClose}>
                              <Box>
                                <Box
                                  sx={{
                                    px: 2.5,
                                    py: 2,
                                    background: 'linear-gradient(180deg, #f57c00 0%, #ff9800 100%)',
                                    color: '#fff',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                  }}
                                >
                                  <Box>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 800, letterSpacing: 0.6 }}>
                                      WARNING
                                    </Typography>
                                    <Typography variant="caption" sx={{ opacity: 0.9 }}>
                                      {warningScopeLabel}
                                    </Typography>
                                  </Box>
                                  <IconButton
                                    size="small"
                                    onClick={handleWarningClose}
                                    sx={{ color: '#fff', bgcolor: 'rgba(255,255,255,0.18)' }}
                                  >
                                    <CloseIcon fontSize="small" />
                                  </IconButton>
                                </Box>
                                <Box sx={{ px: 2.5, pt: 2, pb: 3, display: 'flex', flexDirection: 'column', minHeight: 200 }}>
                                  {timelineWarningState?.warning_reason_public ? (
                                    <Typography variant="body2" sx={{ lineHeight: 1.6, flex: 1 }}>
                                      {timelineWarningState.warning_reason_public}
                                    </Typography>
                                  ) : (
                                    <Typography variant="body2" sx={{ opacity: 0.6, fontStyle: 'italic', flex: 1 }}>
                                      No details provided.
                                    </Typography>
                                  )}
                                  <Typography variant="caption" sx={{ mt: 2, display: 'block', opacity: 0.75, fontWeight: 600 }}>
                                    {warningUntilLabel ? `Active until ${warningUntilLabel}` : 'Active warning'}
                                  </Typography>
                                </Box>
                              </Box>
                            </ClickAwayListener>
                          </Paper>
                        </Grow>
                      )}
                    </Popper>
                  </>
                )}
                {/* Hamburger menu — hidden in guest mode; replaced with CTA */}
                {isGuest && !['/login', '/register'].includes(currentPath) ? (
                  <Tooltip title="Create a full account to start posting and organizing timelines!">
                    <Button
                      variant="contained"
                      size="small"
                      onClick={async () => {
                        await logout();
                        navigate('/register');
                      }}
                      sx={{
                        mr: 1.5,
                        borderRadius: 99,
                        background: theme.palette.mode === 'dark' 
                          ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' 
                          : 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                        color: '#fff',
                        fontWeight: 800,
                        fontSize: '0.75rem',
                        letterSpacing: 0.8,
                        textTransform: 'none',
                        px: 2,
                        py: 0.75,
                        boxShadow: theme.palette.mode === 'dark'
                          ? '0 4px 14px rgba(34, 197, 94, 0.35)'
                          : '0 4px 14px rgba(22, 101, 52, 0.2)',
                        '&:hover': {
                          background: theme.palette.mode === 'dark' 
                            ? 'linear-gradient(135deg, #4ade80 0%, #22c55e 100%)' 
                            : 'linear-gradient(135deg, #15803d 0%, #166534 100%)',
                          boxShadow: theme.palette.mode === 'dark'
                            ? '0 6px 20px rgba(34, 197, 94, 0.45)'
                            : '0 6px 20px rgba(22, 101, 52, 0.3)',
                          transform: 'translateY(-1px)',
                        },
                        transition: 'all 0.2s ease-in-out',
                      }}
                    >
                      Join iTimeline
                    </Button>
                  </Tooltip>
                ) : (
                  <IconButton
                    color="inherit"
                    onClick={handleHamburgerClick}
                    sx={{ mr: 2 }}
                    aria-label="profile menu"
                  >
                    <MenuIcon />
                  </IconButton>
                )}
                <Drawer
                  anchor="right"
                  open={drawerOpen}
                  onClose={toggleDrawer(false)}
                  variant="temporary"
                  sx={{
                    '& .MuiDrawer-paper': {
                      marginTop: '64px', // Height of AppBar
                      height: 'calc(100% - 64px)',
                      boxSizing: 'border-box',
                      zIndex: 1600, // Higher than timeline floating buttons (which go up to 1530)
                    },
                    zIndex: 1600, // Apply to the Drawer component itself
                  }}
                  ModalProps={{
                    keepMounted: true, // Better mobile performance
                  }}
                >
                  {profileTabs}
                </Drawer>
                <IconButton onClick={handleMenu} sx={{ p: 0 }}>
                  <UserAvatar
                    name={displayUsername(user.username)}
                    avatarUrl={user.avatar_url}
                    id={user.id}
                    size={40}
                    isRestricted={user?.is_restricted || user?.is_suspended}
                    isAvatarBlurred={user?.is_avatar_blurred}
                    sx={{
                      transition: 'transform 0.2s ease-in-out',
                      '&:hover': { transform: 'scale(1.1)' }
                    }}
                    userColor={user.user_color}
                  />
                </IconButton>
                <Menu
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={handleClose}
                  PaperProps={{
                    sx: {
                      mt: 1.5,
                      boxShadow: theme => theme.palette.mode === 'dark' 
                        ? '0 4px 20px rgba(0,0,0,0.5)' 
                        : '0 4px 20px rgba(0,0,0,0.15)',
                      borderRadius: 2,
                    }
                  }}
                  transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                  anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                >
                  <MenuItem
                    onClick={() => {
                      navigate(isGuest ? '/profile/guest' : '/profile');
                      handleClose();
                    }}
                    sx={{
                      minWidth: '150px',
                      py: 1.5,
                    }}
                  >
                    <ListItemIcon>
                      <PersonIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary="Profile" />
                  </MenuItem>
                  <MenuItem onClick={handleLogout} sx={{ 
                    minWidth: '150px',
                    py: 1.5,
                  }}>
                    <ListItemIcon>
                      <Box component="svg" sx={{ width: 20, height: 20 }} viewBox="0 0 24 24" fill="none">
                        <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </Box>
                    </ListItemIcon>
                    <ListItemText primary="Logout" />
                  </MenuItem>
                </Menu>
              </>
            ) : (
              <>
                <Button color="inherit" component={RouterLink} to="/login">
                  Login
                </Button>
                <Button color="inherit" component={RouterLink} to="/register">
                  Register
                </Button>
              </>
            )}
          </Box>
        </Toolbar>
      </AppBar>
      <ToolbarSpacer />

      {/* Event popup from status dropdown - rendered here so it persists after dropdown closes */}
      <React.Suspense fallback={null}>
        {statusEventPopup && (
          <EventPopup
            open={statusEventPopupOpen}
            onClose={handleStatusEventPopupClose}
            event={statusEventPopup}
            theme={theme}
          />
        )}
      </React.Suspense>
    </>
  );
}

export default Navbar;
