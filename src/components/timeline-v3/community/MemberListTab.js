import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Box, 
  Typography, 
  Paper,
  Divider,
  Chip,
  Skeleton,
  useTheme,
  Card,
  CardContent,
  Button,
  LinearProgress,
  Snackbar,
  Alert,
  Grow,
  IconButton,
  TextField,
  InputAdornment,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  alpha,
  Tooltip
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import SortIcon from '@mui/icons-material/Sort';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PersonIcon from '@mui/icons-material/Person';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { getTimelineDetails, getTimelineMembers, getTimelineMemberCount, checkMembershipStatus, getTimelineActions, getTimelineQuote, getTimelineWarningState, voteTimelineAction, submitTimelineReport } from '../../../utils/api';
import { displayUsername, usernameMatchesQuery } from '../../../utils/usernameDisplay';
import { countries, getFlagUrl } from '../../../utils/countries';
import { motion } from 'framer-motion';
import NavFab from './NavFab';
import FlagIcon from '@mui/icons-material/Flag';
import LockIcon from '@mui/icons-material/Lock';
import GroupsIcon from '@mui/icons-material/Groups';
import TagIcon from '@mui/icons-material/Tag';
import QuoteDisplay from './QuoteDisplay';
import ActionCard from './ActionCard';
import UserAvatar from '../../common/UserAvatar';
import CommunityLockView from './CommunityLockView';
import CommunityInfoCardsDisplay from './CommunityInfoCardsDisplay';
import { getTimelineSurfaceTheme } from '../timelineSurfaceTheme';
import { TimelineHeroBanner } from '../TimelineHeroBanner';
import {
  getGlassDialogPaperSx,
  getGlassInputSx,
  getGlassSquareActionButtonSx,
  getGlassPillActionButtonSx,
} from '../../../utils/formStyleGuide';

// Helper function to safely format dates
const formatActionDate = (dateValue) => {
  if (!dateValue) return null;
  
  try {
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) {
      return null;
    }
    return date.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch (error) {
    console.warn('Date parsing error:', error, 'for value:', dateValue);
    return null;
  }
};

const getActionScheduleDetails = (dateValue) => {
  if (!dateValue) return null;

  try {
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) return null;

    return {
      dateLabel: date.toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      }),
      timeLabel: date.toLocaleTimeString(undefined, {
        hour: 'numeric',
        minute: '2-digit',
      }),
    };
  } catch (error) {
    console.warn('Date parsing error:', error, 'for value:', dateValue);
    return null;
  }
};

const canVoteForAction = (action) => action?.progress?.threshold_type === 'votes';

// Helper function to check if an action card has meaningful content
const hasActionContent = (action) => {
  if (!action) return false;
  
  // Check if the action has custom content (not just fallback values)
  const hasCustomTitle = action.title && 
    action.title !== 'Gold Community Action' && 
    action.title !== 'Silver Community Action' && 
    action.title !== 'Bronze Community Action';
    
  const hasCustomDescription = action.description && 
    action.description !== 'Complete this action to unlock gold benefits.' &&
    action.description !== 'Complete this action to unlock silver benefits.' &&
    action.description !== 'Complete this action to unlock bronze benefits.';
    
  return hasCustomTitle || hasCustomDescription;
};

const toSafeNumber = (value, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const shouldAnimateActionProgress = (action) => {
  const progress = action?.progress;
  if (!progress || progress.is_unlocked) return false;

  if (progress.threshold_type === 'members') {
    return toSafeNumber(progress.goal_additional_members, 0) > 0;
  }

  if (progress.threshold_type === 'votes') {
    return toSafeNumber(progress.goal_votes, 0) > 0;
  }

  return false;
};

const isActionLockedByProgress = (action) => Boolean(action?.progress && action.progress.is_unlocked === false);

const getActionProgressDetails = (action, revealFactor = 1) => {
  const progress = action?.progress || null;
  if (!progress) return { label: null, ratio: 0 };
  const factor = Math.min(1, Math.max(0, toSafeNumber(revealFactor, 1)));

  if (progress.threshold_type === 'members') {
    const currentRaw = toSafeNumber(progress.current_additional_members, 0);
    const current = Math.round(currentRaw * factor);
    const goal = toSafeNumber(progress.goal_additional_members, toSafeNumber(action?.thresholdValue, 0));
    const ratio = goal <= 0 ? 1 : Math.min(1, Math.max(0, current / goal));
    return {
      label: `${current}/${goal} additional members`,
      ratio,
    };
  }

  if (progress.threshold_type === 'votes') {
    const currentRaw = toSafeNumber(progress.current_votes, 0);
    const current = Math.round(currentRaw * factor);
    const goal = toSafeNumber(progress.goal_votes, toSafeNumber(action?.thresholdValue, 0));
    const ratio = goal <= 0 ? 1 : Math.min(1, Math.max(0, current / goal));
    return {
      label: `${current}/${goal} votes`,
      ratio,
    };
  }

  return { label: null, ratio: 0 };
};

const MemberListTab = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const timelineSurfaces = useMemo(() => getTimelineSurfaceTheme(theme), [theme]);
  const [timelineHeader, setTimelineHeader] = useState({
    name: '',
    coverImageUrl: '',
    coverUploadEnabled: true,
    coverLandscapeX: 50,
    coverLandscapeY: 50,
    coverZoom: 1,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [members, setMembers] = useState([]);
  const [error, setError] = useState(null);
  const [memberCount, setMemberCount] = useState(0);
  const [goldAction, setGoldAction] = useState(null);
  const [bronzeAction, setBronzeAction] = useState(null);
  const [silverAction, setSilverAction] = useState(null);
  const [isGoldActionLoading, setIsGoldActionLoading] = useState(true);
  const [isBronzeActionLoading, setIsBronzeActionLoading] = useState(true);
  const [isSilverActionLoading, setIsSilverActionLoading] = useState(true);
  
  // Custom quote for fallback display
  const [customQuote, setCustomQuote] = useState({
    text: "Those who make Peaceful Revolution impossible, will make violent Revolution inevitable.",
    author: "John F. Kennedy"
  });
  
  // Action requirement states
  const [goldActionLocked, setGoldActionLocked] = useState(false);
  const [silverActionLocked, setSilverActionLocked] = useState(false);
  const [bronzeActionLocked, setBronzeActionLocked] = useState(false);
  
  // Community membership thresholds for displaying tiered actions
  const [memberThresholds, setMemberThresholds] = useState({
    silver: 10, // Show silver action when community has at least 10 members
    gold: 25    // Show gold action when community has at least 25 members
  });
  
  // Determine which actions to display based on membership count
  const [showSilverAction, setShowSilverAction] = useState(false);
  const [showGoldAction, setShowGoldAction] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  // Access control state
  const [accessLoading, setAccessLoading] = useState(true);
  const [isMember, setIsMember] = useState(false);
  const [communityRole, setCommunityRole] = useState('');
  const [timelineWarningState, setTimelineWarningState] = useState({ active: false });
  const [voteLoadingByType, setVoteLoadingByType] = useState({ bronze: false, silver: false, gold: false });
  const [snackbarState, setSnackbarState] = useState({ open: false, severity: 'info', message: '' });
  const [progressRevealByType, setProgressRevealByType] = useState({ bronze: 1, silver: 1, gold: 1 });
  const hasAnimatedInitialProgressRef = useRef(false);
  const [communityFabExpanded, setCommunityFabExpanded] = useState(false);
  const [timelineReportDialogOpen, setTimelineReportDialogOpen] = useState(false);
  const [timelineReportCategory, setTimelineReportCategory] = useState('');
  const [timelineReportReason, setTimelineReportReason] = useState('');
  const [timelineReportSubmitting, setTimelineReportSubmitting] = useState(false);

  // Search / Filter / Sort state and menu anchors
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all'); // all | admin | moderator | member
  const [sortBy, setSortBy] = useState('name-asc'); // name-asc | name-desc | date-asc | date-desc
  const [filterAnchorEl, setFilterAnchorEl] = useState(null);
  const [sortAnchorEl, setSortAnchorEl] = useState(null);

  // List helpers
  const lastMemberElementRef = useRef(null);

  // Handlers (no UI changes; functional defaults)
  const handleSearchChange = (e) => setSearchTerm(e.target.value);
  const handleFilterClick = (e) => setFilterAnchorEl(e.currentTarget);
  const handleFilterClose = () => setFilterAnchorEl(null);
  const handleFilterSelect = (filter) => { setActiveFilter(filter); handleFilterClose(); };
  const handleSortClick = (e) => setSortAnchorEl(e.currentTarget);
  const handleSortClose = () => setSortAnchorEl(null);
  const handleSortSelect = (sort) => { setSortBy(sort); handleSortClose(); };

  const handleSnackbarClose = () => {
    setSnackbarState((prev) => ({ ...prev, open: false }));
  };

  const handleCommunityNavigate = (targetPath) => {
    if (!targetPath || location.pathname === targetPath) {
      setCommunityFabExpanded(false);
      return;
    }
    setCommunityFabExpanded(false);
    navigate(targetPath);
  };

  const handleOpenTimelineReportDialog = () => {
    setTimelineReportCategory('');
    setTimelineReportReason('');
    setTimelineReportDialogOpen(true);
    setCommunityFabExpanded(false);
  };

  const handleCloseTimelineReportDialog = () => {
    if (timelineReportSubmitting) return;
    setTimelineReportDialogOpen(false);
  };

  const handleSubmitTimelineReport = async () => {
    if (!id) return;
    if (!timelineReportCategory) {
      setSnackbarState({
        open: true,
        severity: 'warning',
        message: 'Please choose a report category',
      });
      return;
    }
    try {
      setTimelineReportSubmitting(true);
      await submitTimelineReport(id, timelineReportReason || '', timelineReportCategory);
      setTimelineReportDialogOpen(false);
      setSnackbarState({
        open: true,
        severity: 'success',
        message: 'Timeline report submitted',
      });
    } catch (error) {
      const message = error?.response?.data?.error || error?.message || 'Failed to submit timeline report';
      setSnackbarState({
        open: true,
        severity: 'error',
        message,
      });
    } finally {
      setTimelineReportSubmitting(false);
    }
  };

  const setVoteLoading = (actionType, isLoading) => {
    setVoteLoadingByType((prev) => ({ ...prev, [actionType]: isLoading }));
  };

  const applyVoteProgressToAction = (actionType, progress) => {
    if (!progress) return;

    if (actionType === 'gold') {
      setGoldAction((prev) => (prev ? { ...prev, progress } : prev));
      setGoldActionLocked(progress.is_unlocked === false);
      return;
    }

    if (actionType === 'silver') {
      setSilverAction((prev) => (prev ? { ...prev, progress } : prev));
      setSilverActionLocked(progress.is_unlocked === false);
      return;
    }

    if (actionType === 'bronze') {
      setBronzeAction((prev) => (prev ? { ...prev, progress } : prev));
      setBronzeActionLocked(progress.is_unlocked === false);
    }
  };

  const handleVoteAction = async (actionType) => {
    if (!id || voteLoadingByType[actionType]) return;

    setVoteLoading(actionType, true);
    const result = await voteTimelineAction(id, actionType);
    setVoteLoading(actionType, false);

    if (!result?.success) {
      setSnackbarState({
        open: true,
        severity: 'error',
        message: result?.error || 'Failed to cast vote.',
      });
      return;
    }

    applyVoteProgressToAction(actionType, result.progress);
    setSnackbarState({
      open: true,
      severity: 'success',
      message: result.already_voted ? 'Your vote was already counted.' : 'Vote recorded successfully.',
    });
  };

  // Safely filter and sort members based on current UI state
  const getFilteredAndSortedMembers = () => {
    let list = Array.isArray(members) ? [...members] : [];

    // filter by role
    if (activeFilter !== 'all') {
      list = list.filter(m => (m.role || 'member').toLowerCase() === activeFilter);
    }

    // search by name
    const term = (searchTerm || '').trim();
    if (term) {
      list = list.filter(m => usernameMatchesQuery(m.name, term));
    }

    // sort
    const byNameAsc = (a, b) => (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' });
    const byDateAsc = (a, b) => new Date(a.joinDate || 0) - new Date(b.joinDate || 0);
    switch (sortBy) {
      case 'name-desc':
        list.sort((a, b) => -byNameAsc(a, b));
        break;
      case 'date-asc':
        list.sort(byDateAsc);
        break;
      case 'date-desc':
        list.sort((a, b) => -byDateAsc(a, b));
        break;
      case 'name-asc':
      default:
        list.sort(byNameAsc);
        break;
    }

    return list;
  };

  // Legacy management actions were removed. MemberListTab is now read-only.
  
  // Check membership and fetch members when component mounts or ID changes
  useEffect(() => {
    let isMounted = true;
    
    const checkAccess = async () => {
      try {
        setAccessLoading(true);
        const status = await checkMembershipStatus(id, 0, true);
        const allowed = !!status?.is_member;
        const resolvedRole = String(status?.role || '').toLowerCase();
        if (isMounted) {
          setIsMember(allowed);
          setCommunityRole(resolvedRole);
          console.log(`[MemberListTab] Membership status for timeline ${id}:`, allowed);
        }
      } catch (e) {
        console.error('[MemberListTab] Access check failed:', e);
        if (isMounted) {
          setIsMember(false);
          setCommunityRole('');
        }
      } finally {
        if (isMounted) setAccessLoading(false);
      }
    };
    
    const fetchMembers = async () => {
      try {
        console.log(`[MemberListTab] Fetching members for timeline ID: ${id}`);
        setIsLoading(true);
        setError(null);
        
        const response = await getTimelineMembers(id);
        const countResponse = await getTimelineMemberCount(id);
        console.log('[MemberListTab] API Response:', response);
        
        if (isMounted) {
          // The API returns { success: true, members: [...] } or direct array
          const membersData = Array.isArray(response) ? response : (response?.members || []);
          console.log('[MemberListTab] Raw members data:', membersData);
          
          // Don't filter out inactive members for now - show all members
          // This helps debug if the issue is with filtering or with the API response
          const activeMembers = membersData;
          
          console.log(`[MemberListTab] Using ${activeMembers.length} members out of ${membersData.length} total`);
          console.log('[MemberListTab] First few members:', activeMembers.slice(0, 3));
          
          const totalCount = countResponse?.count ?? activeMembers.length;
          setMembers(activeMembers);
          setMemberCount(totalCount);
          
          // Update action thresholds based on member count
          setShowSilverAction(totalCount >= memberThresholds.silver);
          setShowGoldAction(totalCount >= memberThresholds.gold);
        }
      } catch (err) {
        console.error('Error fetching members:', err);
        if (isMounted) {
          setError('Failed to load members. Please try again later.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    // Always check access
    checkAccess();
    
    // Always fetch members regardless of membership status
    // This helps debug if the issue is with the membership check
    fetchMembers();
    
    return () => {
      isMounted = false;
    };
  }, [id]); // Remove isMember dependency to ensure members are always fetched

  useEffect(() => {
    hasAnimatedInitialProgressRef.current = false;
    setProgressRevealByType({ bronze: 1, silver: 1, gold: 1 });
  }, [id]);

  useEffect(() => {
    let active = true;

    const fetchTimelineHeader = async () => {
      if (!id) return;
      try {
        const timeline = await getTimelineDetails(id);
        if (!active || !timeline) return;
        setTimelineHeader({
          name: String(timeline.name || ''),
          coverImageUrl: String(timeline.cover_landscape_image_url || '').trim(),
          coverUploadEnabled: timeline.cover_upload_enabled !== false,
          coverLandscapeX: Number(timeline.cover_landscape_x ?? 50),
          coverLandscapeY: Number(timeline.cover_landscape_y ?? 50),
          coverZoom: Number(timeline.cover_landscape_zoom ?? timeline.cover_zoom ?? 1),
        });
      } catch (err) {
        if (!active) return;
        console.warn('[MemberListTab] Failed to load timeline cover header:', err);
      }
    };

    fetchTimelineHeader();

    return () => {
      active = false;
    };
  }, [id]);

  // Fetch action cards when component mounts or ID changes
  useEffect(() => {
    let isMounted = true;
    
    const fetchActionCards = async () => {
      try {
        setIsGoldActionLoading(true);
        setIsSilverActionLoading(true);
        setIsBronzeActionLoading(true);
        setGoldAction(null);
        setSilverAction(null);
        setBronzeAction(null);
        console.log(`[MemberListTab] Fetching action cards for timeline ID: ${id}`);
        
        const response = await getTimelineActions(id);
        console.log('[MemberListTab] Action cards response:', response);
        
        // Debug: Log each action's due_date value
        const actions = Array.isArray(response.actions) ? response.actions : [];
        if (actions.length) {
          actions.forEach(action => {
            console.log(`[DEBUG] Action ${action.action_type} due_date:`, action.due_date, typeof action.due_date);
          });
        }
        
        if (isMounted && response.success) {
          // Process action cards and update thresholds
          const newThresholds = { silver: 10, gold: 25 }; // Default values
          const foundActions = { gold: false, silver: false, bronze: false };
          
          actions.forEach(action => {
            if (action.action_type === 'silver') {
              foundActions.silver = true;
              newThresholds.silver = action.threshold_value || 10;
              const silverActionData = {
                id: action.id,
                action_type: 'silver',
                title: action.title || 'Silver Community Action',
                description: action.description || 'Complete this action to unlock silver benefits.',
                dueDate: action.due_date,  // Convert to camelCase
                thresholdType: action.threshold_type || 'members',
                thresholdValue: action.threshold_value || 10,
                progress: action.progress || null,
              };
              console.log('[DEBUG] Setting silverAction with dueDate:', silverActionData.dueDate);
              setSilverAction(silverActionData);
              setSilverActionLocked(isActionLockedByProgress(silverActionData));
              setIsSilverActionLoading(false);
            } else if (action.action_type === 'gold') {
              foundActions.gold = true;
              newThresholds.gold = action.threshold_value || 25;
              const goldActionData = {
                id: action.id,
                action_type: 'gold',
                title: action.title || 'Gold Community Action',
                description: action.description || 'Complete this action to unlock gold benefits.',
                dueDate: action.due_date,  // Convert to camelCase
                thresholdType: action.threshold_type || 'members',
                thresholdValue: action.threshold_value || 25,
                progress: action.progress || null,
              };
              console.log('[DEBUG] Setting goldAction with dueDate:', goldActionData.dueDate);
              setGoldAction(goldActionData);
              setGoldActionLocked(isActionLockedByProgress(goldActionData));
              setIsGoldActionLoading(false);
            } else if (action.action_type === 'bronze') {
              foundActions.bronze = true;
              const bronzeActionData = {
                id: action.id,
                action_type: 'bronze',
                title: action.title || 'Bronze Community Action',
                description: action.description || 'Complete this action to unlock bronze benefits.',
                dueDate: action.due_date,  // Convert to camelCase
                thresholdType: action.threshold_type || 'members',
                thresholdValue: action.threshold_value || 5,
                progress: action.progress || null,
              };
              console.log('[DEBUG] Setting bronzeAction with dueDate:', bronzeActionData.dueDate);
              setBronzeAction(bronzeActionData);
              setBronzeActionLocked(isActionLockedByProgress(bronzeActionData));
              setIsBronzeActionLoading(false);
            }
          });

          if (!foundActions.gold) {
            setIsGoldActionLoading(false);
            setGoldAction(null);
          }
          if (!foundActions.silver) {
            setIsSilverActionLoading(false);
            setSilverAction(null);
          }
          if (!foundActions.bronze) {
            setIsBronzeActionLoading(false);
            setBronzeAction(null);
          }
          
          // Update thresholds
          setMemberThresholds(newThresholds);
          console.log(`[MemberListTab] Updated thresholds:`, newThresholds);
          
          // Update action visibility based on current member count
          setShowSilverAction(memberCount >= newThresholds.silver);
          setShowGoldAction(memberCount >= newThresholds.gold);
        } else {
          console.log('[MemberListTab] No action cards found, using defaults');
          // Set loading states to false if no actions found
          setIsGoldActionLoading(false);
          setIsSilverActionLoading(false);
          setIsBronzeActionLoading(false);
          setGoldAction(null);
          setSilverAction(null);
          setBronzeAction(null);
        }
      } catch (err) {
        console.error('[MemberListTab] Error fetching action cards:', err);
        if (isMounted) {
          // Set loading states to false on error
          setIsGoldActionLoading(false);
          setIsSilverActionLoading(false);
          setIsBronzeActionLoading(false);
        }
      }
    };

    if (id && isMember) {
      fetchActionCards();
    }
    
    return () => {
      isMounted = false;
    };
  }, [id, isMember]);

  useEffect(() => {
    setShowSilverAction(memberCount >= memberThresholds.silver);
    setShowGoldAction(memberCount >= memberThresholds.gold);
  }, [memberCount, memberThresholds]);

  useEffect(() => {
    if (!id || !isMember) return undefined;
    if (isGoldActionLoading || isSilverActionLoading || isBronzeActionLoading) return undefined;
    if (hasAnimatedInitialProgressRef.current) return undefined;

    const animateByType = {
      gold: shouldAnimateActionProgress(goldAction),
      silver: shouldAnimateActionProgress(silverAction),
      bronze: shouldAnimateActionProgress(bronzeAction),
    };
    const hasProgressToAnimate = Object.values(animateByType).some(Boolean);
    if (!hasProgressToAnimate) {
      setProgressRevealByType({ bronze: 1, silver: 1, gold: 1 });
      hasAnimatedInitialProgressRef.current = true;
      return undefined;
    }

    setProgressRevealByType({
      bronze: animateByType.bronze ? 0 : 1,
      silver: animateByType.silver ? 0 : 1,
      gold: animateByType.gold ? 0 : 1,
    });

    let frameId = null;
    const startDelayMs = 300;
    const durationMs = 850;
    const delayId = window.setTimeout(() => {
      setSnackbarState({ open: true, severity: 'info', message: 'Syncing locked action progress...' });
      const startTime = performance.now();
      const animate = (now) => {
        const elapsed = now - startTime;
        const t = Math.min(1, elapsed / durationMs);
        const eased = 1 - Math.pow(1 - t, 3);
        setProgressRevealByType({
          bronze: animateByType.bronze ? eased : 1,
          silver: animateByType.silver ? eased : 1,
          gold: animateByType.gold ? eased : 1,
        });

        if (t < 1) {
          frameId = window.requestAnimationFrame(animate);
        } else {
          hasAnimatedInitialProgressRef.current = true;
        }
      };

      frameId = window.requestAnimationFrame(animate);
    }, startDelayMs);

    return () => {
      window.clearTimeout(delayId);
      if (frameId) {
        window.cancelAnimationFrame(frameId);
      }
    };
  }, [
    id,
    isMember,
    isGoldActionLoading,
    isSilverActionLoading,
    isBronzeActionLoading,
    goldAction,
    silverAction,
    bronzeAction,
  ]);

  useEffect(() => {
    let active = true;

    const fetchQuote = async () => {
      if (!id) return;
      const response = await getTimelineQuote(id);
      if (!active) return;
      if (response?.quote?.text) {
        setCustomQuote({
          text: response.quote.text || '',
          author: response.quote.author || 'Unknown'
        });
      } else {
        setCustomQuote({
          text: "Those who make Peaceful Revolution impossible, will make violent Revolution inevitable.",
          author: "John F. Kennedy"
        });
      }
    };

    fetchQuote();

    return () => {
      active = false;
    };
  }, [id]);

  useEffect(() => {
    let active = true;
    const fetchWarningState = async () => {
      if (!id) return;
      const warningState = await getTimelineWarningState(id);
      if (active) {
        setTimelineWarningState(warningState || { active: false });
      }
    };
    fetchWarningState();
    return () => {
      active = false;
    };
  }, [id]);
  
  // Early guard: strictly block non-members
  if (!accessLoading && !isMember) {
    return (
      <CommunityLockView 
        title="Members area restricted"
        description="You're not a member of this community yet. Please request to join from the timeline page."
        timelineId={id}
      />
    );
  }

  // Role chip styling
  const getRoleColor = (role) => {
    switch ((role || '').toLowerCase()) {
      case 'siteowner':
        return { bg: theme.palette.mode === 'dark' ? '#2e7d32' : '#4caf50', text: '#fff' }; // Forest green for site owner
      case 'siteadmin':
        return { bg: '#1565c0', text: '#fff' }; // Deep blue for SiteAdmin
      case 'admin':
        return { bg: theme.palette.error.main, text: '#fff' }; // Red for admin
      case 'moderator':
        return { bg: theme.palette.warning.main, text: '#000' }; // Yellow/orange for moderator
      case 'member':
        return { bg: theme.palette.primary.main, text: '#fff' }; // Blue for regular member
      case 'pending':
        return { bg: theme.palette.grey[500], text: '#fff' }; // Grey for pending members
      default: // fallback for any other role
        return { bg: theme.palette.primary.main, text: '#fff' }; // Blue for any other role
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 100,
        damping: 12
      }
    }
  };

  const isActionCardWarningActive = Boolean(
    timelineWarningState?.active
    && timelineWarningState?.warning_scope === 'action_cards'
    && timelineWarningState?.mask_content
  );

  const actionWarningBlurSx = isActionCardWarningActive
    ? {
        filter: 'blur(10px)',
        pointerEvents: 'none',
        userSelect: 'none',
      }
    : {};

  const goldProgress = getActionProgressDetails(goldAction, progressRevealByType.gold);
  const silverProgress = getActionProgressDetails(silverAction, progressRevealByType.silver);
  const bronzeProgress = getActionProgressDetails(bronzeAction, progressRevealByType.bronze);
  const goldActionDayLabel = formatActionDate(goldAction?.dueDate);
  const silverActionDayLabel = formatActionDate(silverAction?.dueDate);
  const bronzeActionDayLabel = formatActionDate(bronzeAction?.dueDate);
  const goldActionSchedule = getActionScheduleDetails(goldAction?.dueDate);
  const silverActionSchedule = getActionScheduleDetails(silverAction?.dueDate);
  const bronzeActionSchedule = getActionScheduleDetails(bronzeAction?.dueDate);

  const membersFallbackGradient = theme.palette.mode === 'dark'
    ? 'linear-gradient(135deg, rgba(13,36,63,0.86) 0%, rgba(20,48,92,0.9) 40%, rgba(65,34,106,0.86) 100%)'
    : 'linear-gradient(135deg, rgba(250,232,242,0.94) 0%, rgba(246,232,220,0.96) 68%, rgba(252,238,224,0.98) 100%)';

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', px: 2, pb: 4, overflowX: 'hidden' }}>
      <TimelineHeroBanner
        timelineName={timelineHeader.name}
        timelineType="community"
        coverImageUrl={timelineHeader.coverImageUrl}
        coverLandscapeX={timelineHeader.coverLandscapeX}
        coverLandscapeY={timelineHeader.coverLandscapeY}
        coverZoom={timelineHeader.coverZoom}
        coverUploadEnabled={timelineHeader.coverUploadEnabled}
        isLoading={isLoading}
      />

      {isActionCardWarningActive && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Action Card Warning is active for this timeline. Action/quote cards are temporarily blurred.
        </Alert>
      )}

      {/* Gold Action Section - Always show quote fallback if no content, show conditional lock if has content but threshold not met */}
      <Box sx={actionWarningBlurSx}>
      {(!hasActionContent(goldAction) || showGoldAction || goldAction) ? (
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          {!isGoldActionLoading && !hasActionContent(goldAction) ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <QuoteDisplay 
                quote={customQuote.text}
                author={customQuote.author}
                variant="gold"
              />
            </motion.div>
          ) : (
            <ActionCard
              action={goldAction}
              onVote={() => handleVoteAction('gold')}
              voteLoading={voteLoadingByType.gold}
              displayMode="list"
            />
          )}
        </motion.div>
      ) : (
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <Card
            sx={{
              position: 'relative',
              mb: 3,
              mt: 1,
              borderRadius: 2,
              background: theme.palette.mode === 'dark' ? 'rgba(45,42,32,0.6)' : 'rgba(248,243,226,0.6)',
              boxShadow: theme.palette.mode === 'dark' 
                ? '0 8px 16px rgba(0,0,0,0.3)'
                : '0 8px 16px rgba(0,0,0,0.1)',
              p: 3,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: 180
            }}
          >
            <Typography variant="h6" color="text.secondary" sx={{ textAlign: 'center', mb: 1.5 }}>
              Gold actions unlock when the community reaches {memberThresholds.gold} members
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mb: 1 }}>
              Grow your community to unlock premium community features and gold actions
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center', fontStyle: 'italic' }}>
              Currently {members.length} member{members.length !== 1 ? 's' : ''}
            </Typography>
          </Card>
        </motion.div>
      )}
      </Box>
      
      {/* Bronze and Silver Actions Row */}
      <motion.div
        initial={{ y: -15, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
      >
        <Box sx={{ 
          display: 'flex', 
          gap: 2, 
          mb: 3,
          flexDirection: { xs: 'column', sm: 'row' },
          ...actionWarningBlurSx,
        }}>
          {/* Bronze Action or Quote Fallback */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            {!isBronzeActionLoading && !hasActionContent(bronzeAction) ? (
              <QuoteDisplay 
                quote={customQuote.text}
                author={customQuote.author}
                variant="bronze"
              />
            ) : (
              <ActionCard
                action={bronzeAction}
                onVote={() => handleVoteAction('bronze')}
                voteLoading={voteLoadingByType.bronze}
                displayMode="list"
              />
            )}
          </Box>
          
          {/* Silver Action - Always show quote fallback if no content, show conditional lock if has content but threshold not met */}
          {(!hasActionContent(silverAction) || showSilverAction || silverAction) ? (
            <Box sx={{ flex: 1, minWidth: 0 }}>
              {!isSilverActionLoading && !hasActionContent(silverAction) ? (
                <QuoteDisplay 
                  quote={customQuote.text}
                  author={customQuote.author}
                  variant="silver"
                />
              ) : (
                <ActionCard
                  action={silverAction}
                  onVote={() => handleVoteAction('silver')}
                  voteLoading={voteLoadingByType.silver}
                  displayMode="list"
                />
              )}
            </Box>
          ) : (
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Card
                sx={{
                  position: 'relative',
                  borderRadius: 2,
                  background: theme.palette.mode === 'dark' ? 'rgba(45,45,50,0.6)' : 'rgba(248,248,250,0.6)',
                  boxShadow: theme.palette.mode === 'dark' 
                    ? '0 8px 16px rgba(0,0,0,0.3)'
                    : '0 8px 16px rgba(0,0,0,0.1)',
                  p: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  minHeight: 150
                }}
              >
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mb: 1 }}>
                  Silver actions unlock when the community reaches {memberThresholds.silver} members
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center', fontStyle: 'italic' }}>
                  Currently {members.length} member{members.length !== 1 ? 's' : ''}
                </Typography>
              </Card>
            </Box>
          )}
        </Box>
      </motion.div>
      
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 2fr' }, gap: 3, mt: 2 }}>
          {/* Left Column: Members List (1/3 width on large screens) */}
          <Paper 
            elevation={2} 
            sx={{ 
              p: 3, 
              borderRadius: 2,
              background: timelineSurfaces.panel,
              border: `1px solid ${timelineSurfaces.panelBorder}`,
              backdropFilter: timelineSurfaces.panelBlur,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.4 }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Typography variant="h6" component="h2">
                  Members
                </Typography>
                <Box 
                  component="span"
                  sx={{ 
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    ml: 1.5,
                    px: 1,
                    py: 0.25,
                    borderRadius: 10,
                    fontSize: '0.75rem',
                    fontWeight: 'medium',
                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
                    color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.7)'
                  }}
                >
                  {isLoading ? (
                    <Skeleton width={25} height={20} sx={{ borderRadius: 1 }} />
                  ) : (
                    `${members.length}`
                  )}
                </Box>
              </Box>
              
              <Typography variant="caption" color="text.secondary" gutterBottom>
                Community members
              </Typography>
            </motion.div>
            
            <Divider sx={{ my: 1.5 }} />
          
          {/* Search, Filter, and Sort Controls */}
          <Box sx={{ mb: 3, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, alignItems: { xs: 'stretch', sm: 'center' } }}>
            <TextField
              placeholder="Search members..."
              variant="outlined"
              size="small"
              fullWidth
              value={searchTerm}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
              sx={{ flexGrow: 1 }}
            />
            
            <Box sx={{ display: 'flex', gap: 1 }}>
              <IconButton 
                size="small" 
                onClick={handleFilterClick}
                color={activeFilter !== 'all' ? 'primary' : 'default'}
                sx={{ border: 1, borderColor: 'divider', borderRadius: 1 }}
                aria-label="Filter members"
                aria-controls="filter-menu"
                aria-haspopup="true"
              >
                <FilterListIcon fontSize="small" />
              </IconButton>
              
              <IconButton 
                size="small" 
                onClick={handleSortClick}
                color={sortBy !== 'name-asc' ? 'primary' : 'default'}
                sx={{ border: 1, borderColor: 'divider', borderRadius: 1 }}
                aria-label="Sort members"
                aria-controls="sort-menu"
                aria-haspopup="true"
              >
                <SortIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>
          
          {/* Filter Menu */}
          <Menu
            id="filter-menu"
            anchorEl={filterAnchorEl}
            open={Boolean(filterAnchorEl)}
            onClose={handleFilterClose}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
          >
            <MenuItem onClick={() => handleFilterSelect('all')} selected={activeFilter === 'all'}>
              <ListItemText primary="All Members" />
            </MenuItem>
            <MenuItem onClick={() => handleFilterSelect('admin')} selected={activeFilter === 'admin'}>
              <ListItemIcon>
                <AdminPanelSettingsIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Admins" />
            </MenuItem>
            <MenuItem onClick={() => handleFilterSelect('moderator')} selected={activeFilter === 'moderator'}>
              <ListItemIcon>
                <PersonIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Moderators" />
            </MenuItem>
            <MenuItem onClick={() => handleFilterSelect('member')} selected={activeFilter === 'member'}>
              <ListItemIcon>
                <PersonIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Members" />
            </MenuItem>
          </Menu>
          
          {/* Sort Menu */}
          <Menu
            id="sort-menu"
            anchorEl={sortAnchorEl}
            open={Boolean(sortAnchorEl)}
            onClose={handleSortClose}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
          >
            <MenuItem onClick={() => handleSortSelect('name-asc')} selected={sortBy === 'name-asc'}>
              <ListItemIcon>
                <ArrowUpwardIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Name (A-Z)" />
            </MenuItem>
            <MenuItem onClick={() => handleSortSelect('name-desc')} selected={sortBy === 'name-desc'}>
              <ListItemIcon>
                <ArrowDownwardIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Name (Z-A)" />
            </MenuItem>
            <MenuItem onClick={() => handleSortSelect('date-asc')} selected={sortBy === 'date-asc'}>
              <ListItemIcon>
                <CalendarTodayIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Join Date (Oldest)" />
            </MenuItem>
            <MenuItem onClick={() => handleSortSelect('date-desc')} selected={sortBy === 'date-desc'}>
              <ListItemIcon>
                <CalendarTodayIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Join Date (Newest)" />
            </MenuItem>
          </Menu>
          
          {(isLoading && page === 1) && (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
              <Typography>Loading members...</Typography>
            </Box>
          )}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {getFilteredAndSortedMembers().map((member, index) => {
              const safeRole = (member.role || 'member');
              const roleLower = safeRole.toLowerCase();
              const roleColor = getRoleColor(safeRole);
              
              return (
                <motion.div 
                  key={member.userId} 
                  variants={itemVariants}
                  className="member-item"
                  ref={index === getFilteredAndSortedMembers().length - 1 ? lastMemberElementRef : null}
                >
                  <Box 
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      p: 1.5,
                      borderRadius: 1,
                      mb: 1.5,
                      '&:hover': {
                        bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)'
                      },
                      transition: 'background-color 0.2s ease'
                    }}
                  >
                    <UserAvatar
                      name={member.name}
                      avatarUrl={member.avatar}
                      id={member.userId}
                      size={48}
                      userColor={member.user_color}
                      isRestricted={member.isRestricted}
                      isSuspended={member.isSuspended}
                      isAvatarBlurred={member.isAvatarBlurred}
                      sx={{
                        mr: 2,
                        boxShadow: '0 0 0 2px ' + roleColor.bg,
                        cursor: 'pointer',
                        transition: 'transform 0.2s ease',
                        '&:hover': { transform: 'scale(1.05)' }
                      }}
                       onClick={(e) => {
                         e.stopPropagation();
                         const route = `/profile/${member.id}`;
                         if (e.ctrlKey || e.metaKey || e.shiftKey || e.button === 1) {
                           window.open(route, '_blank');
                         } else {
                           navigate(route);
                         }
                       }}
                    />
                    <Box sx={{ flexGrow: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="subtitle1">{displayUsername(member.name)}</Typography>
                          {member.country && (
                            <Tooltip title={countries.find(c => c.code === member.country)?.label || ''} arrow>
                              <Box 
                                component="img"
                                loading="lazy"
                                src={getFlagUrl(member.country)}
                                alt=""
                                sx={{ 
                                  width: 24, 
                                  height: 'auto', 
                                  borderRadius: '2px', 
                                  boxShadow: '0 0 2px rgba(0,0,0,0.2)', 
                                  cursor: 'help',
                                  flexShrink: 0
                                }}
                              />
                            </Tooltip>
                          )}
                        </Box>
                        
                        {/* Management actions removed: MemberListTab is read-only. */}
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                        <Chip 
                          label={safeRole.charAt(0).toUpperCase() + safeRole.slice(1)}
                          size="small"
                          sx={{ 
                            bgcolor: roleColor.bg, 
                            color: roleColor.text,
                            mr: 1,
                            fontSize: '0.7rem',
                            height: 20
                          }}
                        />
                        <Typography variant="caption" color="text.secondary">
                          Joined {new Date(member.joinDate).toLocaleDateString()}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </motion.div>
              );
            })}
          </motion.div>
          {/* End of list message */}
          {!hasMore && members.length > 0 && !isLoading && !isLoadingMore && (
            <Box sx={{ py: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                You've reached the end of the member list
              </Typography>
            </Box>
          )}
          </Paper>

          {/* Right Column: Info Cards (2/3 width on large screens) */}
          <motion.div
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            <Paper 
              elevation={2} 
              sx={{ 
                p: 3, 
                borderRadius: 2,
                background: timelineSurfaces.panel,
                border: `1px solid ${timelineSurfaces.panelBorder}`,
                backdropFilter: timelineSurfaces.panelBlur,
                overflow: 'hidden'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" component="h2">
                  Community Info
                </Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />
              <CommunityInfoCardsDisplay timelineId={id} />
            </Paper>
          </motion.div>
        </Box>
      </motion.div>

      <NavFab
        timelineId={id}
        pathname={location.pathname}
        expanded={communityFabExpanded}
        onToggleExpanded={() => setCommunityFabExpanded((prev) => !prev)}
        onCollapse={() => setCommunityFabExpanded(false)}
        onNavigate={handleCommunityNavigate}
        showReport
        onReport={handleOpenTimelineReportDialog}
        showMembersNav={isMember}
        showAdminNav={['moderator', 'admin', 'creator', 'siteowner'].includes(communityRole)}
        mainTooltipClosed="Show Event Options"
        mainTooltipOpen="Hide Options"
      />

      <Dialog
        open={timelineReportDialogOpen}
        onClose={handleCloseTimelineReportDialog}
        fullWidth
        maxWidth="sm"
        PaperProps={{ sx: getGlassDialogPaperSx(theme) }}
      >
        <DialogTitle>Report Timeline</DialogTitle>
        <DialogContent sx={{ '& .MuiTextField-root': getGlassInputSx(theme) }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Help us understand the issue with this timeline.
          </Typography>
          <TextField
            select
            fullWidth
            margin="dense"
            label="Category"
            value={timelineReportCategory}
            onChange={(e) => setTimelineReportCategory(e.target.value)}
          >
            <MenuItem value="">Select a category</MenuItem>
            <MenuItem value="spam">Spam</MenuItem>
            <MenuItem value="harassment">Harassment</MenuItem>
            <MenuItem value="hate">Hate speech</MenuItem>
            <MenuItem value="violence">Violence or threats</MenuItem>
            <MenuItem value="other">Other</MenuItem>
          </TextField>
          <TextField
            fullWidth
            margin="dense"
            multiline
            minRows={4}
            label="Reason"
            value={timelineReportReason}
            onChange={(e) => setTimelineReportReason(e.target.value)}
            placeholder="Add optional details"
            sx={{ mt: 1.5 }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button
            onClick={handleCloseTimelineReportDialog}
            disabled={timelineReportSubmitting}
            variant="contained"
            sx={{
              ...getGlassSquareActionButtonSx(theme),
              width: 'auto',
              minWidth: 84,
              px: 2,
              borderRadius: 1.4,
              bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(15,23,42,0.06)',
              color: theme.palette.text.primary,
              '&:hover': {
                bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(15,23,42,0.12)',
              }
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmitTimelineReport}
            variant="outlined"
            disabled={timelineReportSubmitting || !timelineReportCategory}
            sx={{
              ...getGlassPillActionButtonSx(theme),
              borderColor: 'error.main',
              color: 'error.main',
              '&:hover': {
                borderColor: 'error.dark',
                bgcolor: alpha('#ef4444', 0.1),
              }
            }}
          >
            {timelineReportSubmitting ? 'Submitting...' : 'Submit Report'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbarState.open}
        autoHideDuration={3500}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        TransitionComponent={Grow}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbarState.severity} sx={{ width: '100%' }}>
          {snackbarState.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default MemberListTab;
