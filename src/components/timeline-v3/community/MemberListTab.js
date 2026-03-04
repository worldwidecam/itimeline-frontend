import React, { useState, useEffect, useRef } from 'react';
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
  ListItemText
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import SortIcon from '@mui/icons-material/Sort';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PersonIcon from '@mui/icons-material/Person';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import { useParams } from 'react-router-dom';
import { getTimelineMembers, getTimelineMemberCount, checkMembershipStatus, getTimelineActions, getTimelineQuote, getTimelineWarningState, voteTimelineAction } from '../../../utils/api';
import { motion } from 'framer-motion';
import CommunityDotTabs from './CommunityDotTabs';
import FlagIcon from '@mui/icons-material/Flag';
import LockIcon from '@mui/icons-material/Lock';
import QuoteDisplay from './QuoteDisplay';
import UserAvatar from '../../common/UserAvatar';
import CommunityLockView from './CommunityLockView';
import CommunityInfoCardsDisplay from './CommunityInfoCardsDisplay';

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
  const theme = useTheme();
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
  const [timelineWarningState, setTimelineWarningState] = useState({ active: false });
  const [voteLoadingByType, setVoteLoadingByType] = useState({ bronze: false, silver: false, gold: false });
  const [snackbarState, setSnackbarState] = useState({ open: false, severity: 'info', message: '' });
  const [progressRevealByType, setProgressRevealByType] = useState({ bronze: 1, silver: 1, gold: 1 });
  const hasAnimatedInitialProgressRef = useRef(false);

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
    const term = (searchTerm || '').trim().toLowerCase();
    if (term) {
      list = list.filter(m => (m.name || '').toLowerCase().includes(term));
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
        if (isMounted) {
          setIsMember(allowed);
          console.log(`[MemberListTab] Membership status for timeline ${id}:`, allowed);
        }
      } catch (e) {
        console.error('[MemberListTab] Access check failed:', e);
        if (isMounted) setIsMember(false);
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
          text: response.quote.text,
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

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', px: 2, pb: 4, overflowX: 'hidden' }}>
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
            <Card
              sx={{
              position: 'relative',
              mb: 3,
              mt: 1,
              borderRadius: 2,
              background: `linear-gradient(145deg, 
                ${theme.palette.mode === 'dark' ? '#2d2a20' : '#f8f3e2'}, 
                ${theme.palette.mode === 'dark' ? '#1a1712' : '#e6d7b0'})`,
              boxShadow: theme.palette.mode === 'dark' 
                ? '0 10px 20px rgba(0,0,0,0.4), inset 0 0 10px rgba(255,215,0,0.1), 0 0 0 1px rgba(255,215,0,0.2)'
                : '0 10px 20px rgba(0,0,0,0.1), inset 0 0 10px rgba(255,215,0,0.2), 0 0 0 1px rgba(255,215,0,0.3)',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '4px',
                background: 'linear-gradient(90deg, #ffd700, #ffec99, #ffd700)',
                boxShadow: '0 0 10px rgba(255,215,0,0.5)'
              }
            }}
          >
            <CardContent
              sx={{
                p: 3,
                position: 'relative',
                pr: goldActionSchedule ? { xs: 3, md: '200px' } : 3,
                minHeight: goldActionSchedule ? { xs: 'auto', md: 220 } : 'auto',
              }}
            >
              {isGoldActionLoading ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Skeleton variant="circular" width={24} height={24} />
                    <Skeleton variant="text" width={180} height={32} />
                  </Box>
                  <Skeleton variant="text" width="90%" height={24} />
                  <Skeleton variant="text" width="60%" height={24} />
                </Box>
              ) : goldAction ? (
                <>
                  {goldActionSchedule && (
                    <Box
                      sx={{
                        position: { xs: 'relative', md: 'absolute' },
                        top: { md: 20 },
                        right: { md: 20 },
                        width: { xs: '100%', md: 160 },
                        minHeight: { xs: 112, md: 148 },
                        mb: { xs: 1.75, md: 0 },
                        borderRadius: 2,
                        overflow: 'hidden',
                        border: '1px solid',
                        borderColor: theme.palette.mode === 'dark' ? 'rgba(255,215,0,0.5)' : 'rgba(139,111,31,0.4)',
                        boxShadow: theme.palette.mode === 'dark'
                          ? '0 8px 16px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,215,0,0.15)'
                          : '0 8px 16px rgba(139,111,31,0.2), 0 0 0 1px rgba(255,215,0,0.2)',
                        zIndex: 2,
                      }}
                    >
                      <Box
                        sx={{
                          px: 1,
                          py: 0.5,
                          textAlign: 'center',
                          bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,215,0,0.24)' : 'rgba(255,215,0,0.32)',
                          borderBottom: '1px solid',
                          borderColor: theme.palette.mode === 'dark' ? 'rgba(255,215,0,0.45)' : 'rgba(139,111,31,0.35)',
                        }}
                      >
                        <Typography sx={{ fontSize: '0.68rem', letterSpacing: '0.65px', fontWeight: 800, textTransform: 'uppercase' }}>
                          Day of Action
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          minHeight: { xs: 80, md: 112 },
                          px: 1.25,
                          py: 1,
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'center',
                          alignItems: 'center',
                          textAlign: 'center',
                          bgcolor: theme.palette.mode === 'dark' ? 'rgba(12,10,6,0.55)' : 'rgba(255,250,235,0.82)',
                        }}
                      >
                        <Typography sx={{ fontWeight: 700, fontSize: '0.92rem', lineHeight: 1.2 }}>
                          {goldActionSchedule.dateLabel}
                        </Typography>
                        <Typography sx={{ mt: 0.45, opacity: 0.85, fontSize: '0.8rem', fontWeight: 600 }}>
                          {goldActionSchedule.timeLabel}
                        </Typography>
                        {goldActionDayLabel && (
                          <Typography sx={{ mt: 0.6, opacity: 0.72, fontSize: '0.68rem' }}>
                            {goldActionDayLabel}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  )}

                  {/* Locked overlay - only shown when goldActionLocked is true */}
                  {goldActionLocked && (
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
                        p: 3,
                        borderRadius: 2
                      }}
                    >
                      <LockIcon 
                        sx={{ 
                          fontSize: 40, 
                          color: '#ffd700',
                          mb: 2,
                          filter: 'drop-shadow(0 0 5px rgba(255,215,0,0.5))'
                        }} 
                      />
                      <Typography 
                        variant="h6" 
                        align="center"
                        sx={{ 
                          color: '#fff',
                          textShadow: '0 0 5px rgba(0,0,0,0.5)',
                          mb: 1
                        }}
                      >
                        Gold Action Locked
                      </Typography>
                      <Typography 
                        variant="body2" 
                        align="center"
                        sx={{ 
                          color: 'rgba(255,255,255,0.8)',
                          maxWidth: '80%',
                          mb: 1,
                        }}
                      >
                        {goldProgress.label || 'Help unlock this action by contributing progress.'}
                      </Typography>
                      <Box sx={{ width: '100%', maxWidth: 280, mb: 2 }}>
                        <LinearProgress
                          variant="determinate"
                          value={Math.round((goldProgress.ratio || 0) * 100)}
                          sx={{
                            height: 8,
                            borderRadius: 999,
                            bgcolor: 'rgba(255,255,255,0.2)',
                            '& .MuiLinearProgress-bar': {
                              bgcolor: '#ffd700',
                            },
                          }}
                        />
                      </Box>
                      {canVoteForAction(goldAction) && (
                        <Button
                          size="small"
                          variant={goldAction?.progress?.user_voted ? 'outlined' : 'contained'}
                          onClick={() => handleVoteAction('gold')}
                          disabled={voteLoadingByType.gold || !!goldAction?.progress?.user_voted}
                          sx={{
                            color: '#fff',
                            borderColor: 'rgba(255,215,0,0.8)',
                            bgcolor: goldAction?.progress?.user_voted ? 'transparent' : 'rgba(255,215,0,0.25)',
                            '&:hover': {
                              bgcolor: 'rgba(255,215,0,0.35)',
                              borderColor: '#ffd700',
                            },
                          }}
                        >
                          {goldAction?.progress?.user_voted ? 'Vote Counted' : (voteLoadingByType.gold ? 'Voting...' : 'Count me in!')}
                        </Button>
                      )}
                    </Box>
                  )}
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                    <FlagIcon 
                      sx={{ 
                        mr: 1.5, 
                        color: '#ffd700',
                        filter: 'drop-shadow(0 0 2px rgba(255,215,0,0.5))'
                      }} 
                    />
                    <Typography 
                      variant="h6" 
                      component="h2"
                      sx={{ 
                        fontFamily: '"Playfair Display", serif',
                        fontWeight: 700,
                        letterSpacing: '0.5px',
                        color: theme.palette.mode === 'dark' ? '#ffd700' : '#8B6F1F',
                        textShadow: theme.palette.mode === 'dark' 
                          ? '0 0 5px rgba(255,215,0,0.3)' 
                          : '0 0 2px rgba(139,111,31,0.2)'
                      }}
                    >
                      GOLD ACTION
                    </Typography>
                  </Box>
                  
                  <Typography 
                    variant="h5" 
                    gutterBottom
                    sx={{ 
                      fontWeight: 600,
                      color: theme.palette.mode === 'dark' ? '#fff' : '#000',
                      textAlign: 'center'
                    }}
                  >
                    {goldAction.title}
                  </Typography>
                  
                  <Typography 
                    variant="body1"
                    sx={{ 
                      mb: 1.5,
                      color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)',
                      textAlign: 'center'
                    }}
                  >
                    {goldAction.description}
                  </Typography>

                  {goldProgress.label && (
                    <Box sx={{ mb: 1.5 }}>
                      <Typography variant="caption" sx={{ display: 'block', mb: 0.5, opacity: 0.85 }}>
                        Progress: {goldProgress.label}
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={Math.round((goldProgress.ratio || 0) * 100)}
                        sx={{
                          height: 7,
                          borderRadius: 999,
                          bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.16)' : 'rgba(0,0,0,0.1)',
                          '& .MuiLinearProgress-bar': {
                            bgcolor: '#d4af37',
                          },
                        }}
                      />
                    </Box>
                  )}
                  
                </>
              ) : null}
            </CardContent>
          </Card>
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
          {!isBronzeActionLoading && !hasActionContent(bronzeAction) ? (
            <QuoteDisplay 
              quote={customQuote.text}
              author={customQuote.author}
              variant="bronze"
            />
          ) : (
            <Card
              sx={{
                flex: 1,
                position: 'relative',
                borderRadius: 2,
                background: `linear-gradient(145deg, 
                  ${theme.palette.mode === 'dark' ? '#2d2520' : '#f8f0e8'}, 
                  ${theme.palette.mode === 'dark' ? '#1a1512' : '#e6d0c0'})`,
                boxShadow: theme.palette.mode === 'dark' 
                  ? '0 8px 16px rgba(0,0,0,0.4), inset 0 0 8px rgba(205,127,50,0.1), 0 0 0 1px rgba(205,127,50,0.2)'
                  : '0 8px 16px rgba(0,0,0,0.1), inset 0 0 8px rgba(205,127,50,0.2), 0 0 0 1px rgba(205,127,50,0.3)',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '3px',
                  background: 'linear-gradient(90deg, #cd7f32, #e1a66b, #cd7f32)',
                  boxShadow: '0 0 8px rgba(205,127,50,0.5)'
                }
              }}
            >
              <CardContent
                sx={{
                  p: 2,
                  position: 'relative',
                  pr: bronzeActionSchedule ? { xs: 2, md: '170px' } : 2,
                  minHeight: bronzeActionSchedule ? { xs: 'auto', md: 180 } : 'auto',
                }}
              >
                {isBronzeActionLoading ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Skeleton variant="circular" width={20} height={20} />
                      <Skeleton variant="text" width={140} height={24} />
                    </Box>
                    <Skeleton variant="text" width="90%" height={20} />
                  </Box>
                ) : bronzeAction ? (
                  <>
                    {bronzeActionSchedule && (
                      <Box
                        sx={{
                          position: { xs: 'relative', md: 'absolute' },
                          top: { md: 14 },
                          right: { md: 14 },
                          width: { xs: '100%', md: 136 },
                          minHeight: { xs: 96, md: 132 },
                          mb: { xs: 1.5, md: 0 },
                          borderRadius: 1.75,
                          overflow: 'hidden',
                          border: '1px solid',
                          borderColor: theme.palette.mode === 'dark' ? 'rgba(205,127,50,0.5)' : 'rgba(139,90,43,0.45)',
                          boxShadow: theme.palette.mode === 'dark'
                            ? '0 6px 14px rgba(0,0,0,0.35), 0 0 0 1px rgba(205,127,50,0.14)'
                            : '0 6px 14px rgba(139,90,43,0.22), 0 0 0 1px rgba(205,127,50,0.2)',
                          zIndex: 2,
                        }}
                      >
                        <Box
                          sx={{
                            px: 1,
                            py: 0.45,
                            textAlign: 'center',
                            bgcolor: theme.palette.mode === 'dark' ? 'rgba(205,127,50,0.24)' : 'rgba(205,127,50,0.30)',
                            borderBottom: '1px solid',
                            borderColor: theme.palette.mode === 'dark' ? 'rgba(205,127,50,0.45)' : 'rgba(139,90,43,0.38)',
                          }}
                        >
                          <Typography sx={{ fontSize: '0.66rem', letterSpacing: '0.58px', fontWeight: 800, textTransform: 'uppercase' }}>
                            Day of Action
                          </Typography>
                        </Box>
                        <Box
                          sx={{
                            minHeight: { xs: 68, md: 95 },
                            px: 1,
                            py: 0.8,
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            alignItems: 'center',
                            textAlign: 'center',
                            bgcolor: theme.palette.mode === 'dark' ? 'rgba(16,9,4,0.55)' : 'rgba(255,247,240,0.86)',
                          }}
                        >
                          <Typography sx={{ fontWeight: 700, fontSize: '0.84rem', lineHeight: 1.2 }}>
                            {bronzeActionSchedule.dateLabel}
                          </Typography>
                          <Typography sx={{ mt: 0.35, opacity: 0.85, fontSize: '0.76rem', fontWeight: 600 }}>
                            {bronzeActionSchedule.timeLabel}
                          </Typography>
                          {bronzeActionDayLabel && (
                            <Typography sx={{ mt: 0.45, opacity: 0.72, fontSize: '0.62rem' }}>
                              {bronzeActionDayLabel}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    )}

                    {bronzeActionLocked && (
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
                        }}
                      >
                        <LockIcon sx={{ color: '#cd7f32', mb: 1 }} />
                        <Typography variant="body2" align="center" sx={{ color: '#fff', mb: 1 }}>
                          Bronze Action Locked
                        </Typography>
                        <Typography variant="caption" align="center" sx={{ color: 'rgba(255,255,255,0.85)', mb: 1 }}>
                          {bronzeProgress.label || 'Help unlock this action by contributing progress.'}
                        </Typography>
                        <Box sx={{ width: '100%', maxWidth: 220, mb: 1.5 }}>
                          <LinearProgress
                            variant="determinate"
                            value={Math.round((bronzeProgress.ratio || 0) * 100)}
                            sx={{
                              height: 7,
                              borderRadius: 999,
                              bgcolor: 'rgba(255,255,255,0.2)',
                              '& .MuiLinearProgress-bar': {
                                bgcolor: '#cd7f32',
                              },
                            }}
                          />
                        </Box>
                        {canVoteForAction(bronzeAction) && (
                          <Button
                            size="small"
                            variant={bronzeAction?.progress?.user_voted ? 'outlined' : 'contained'}
                            onClick={() => handleVoteAction('bronze')}
                            disabled={voteLoadingByType.bronze || !!bronzeAction?.progress?.user_voted}
                            sx={{
                              color: '#fff',
                              borderColor: 'rgba(205,127,50,0.8)',
                              bgcolor: bronzeAction?.progress?.user_voted ? 'transparent' : 'rgba(205,127,50,0.25)',
                            }}
                          >
                            {bronzeAction?.progress?.user_voted ? 'Vote Counted' : (voteLoadingByType.bronze ? 'Voting...' : 'Count me in!')}
                          </Button>
                        )}
                      </Box>
                    )}

                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <FlagIcon 
                        sx={{ 
                          mr: 1, 
                          color: '#cd7f32',
                          fontSize: '1.1rem',
                          filter: 'drop-shadow(0 0 2px rgba(205,127,50,0.5))'
                        }} 
                      />
                      <Typography 
                        variant="subtitle1" 
                        component="h3"
                        sx={{ 
                          fontFamily: '"Playfair Display", serif',
                          fontWeight: 700,
                          fontSize: '0.9rem',
                          letterSpacing: '0.5px',
                          color: theme.palette.mode === 'dark' ? '#cd7f32' : '#8B5A2B',
                          textShadow: theme.palette.mode === 'dark' 
                            ? '0 0 4px rgba(205,127,50,0.3)' 
                            : '0 0 2px rgba(139,90,43,0.2)'
                        }}
                      >
                        BRONZE ACTION
                      </Typography>
                    </Box>
                    
                    <Typography 
                      variant="h6" 
                      gutterBottom
                      sx={{ 
                        fontWeight: 600,
                        fontSize: '1rem',
                        color: theme.palette.mode === 'dark' ? '#fff' : '#000'
                      }}
                    >
                      {bronzeAction.title}
                    </Typography>
                    
                    <Typography 
                      variant="body2"
                      sx={{ 
                        mb: 1,
                        fontSize: '0.8rem',
                        color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)'
                      }}
                    >
                      {bronzeAction.description}
                    </Typography>

                    {bronzeProgress.label && (
                      <Box sx={{ mb: 1 }}>
                        <Typography variant="caption" sx={{ display: 'block', mb: 0.5, opacity: 0.85 }}>
                          Progress: {bronzeProgress.label}
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={Math.round((bronzeProgress.ratio || 0) * 100)}
                          sx={{
                            height: 6,
                            borderRadius: 999,
                            bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.16)' : 'rgba(0,0,0,0.1)',
                            '& .MuiLinearProgress-bar': {
                              bgcolor: '#cd7f32',
                            },
                          }}
                        />
                      </Box>
                    )}
                    
                  </>
                ) : null}
              </CardContent>
            </Card>
          )}
          
          {/* Silver Action - Always show quote fallback if no content, show conditional lock if has content but threshold not met */}
          {(!hasActionContent(silverAction) || showSilverAction || silverAction) ? (
            !isSilverActionLoading && !hasActionContent(silverAction) ? (
              <Box sx={{
                flex: 1,
                ml: { xs: 0, sm: 2 },
                mt: { xs: 2, sm: 0 },
              }}>
                <QuoteDisplay 
                  quote={customQuote.text}
                  author={customQuote.author}
                  variant="silver"
                />
              </Box>
            ) : (
              <Card
                sx={{
                  flex: 1,
                  position: 'relative',
                  borderRadius: 2,
                  ml: { xs: 0, sm: 2 },
                  mt: { xs: 2, sm: 0 },
                  background: `linear-gradient(145deg, 
                    ${theme.palette.mode === 'dark' ? '#2d2d32' : '#f8f8fa'}, 
                    ${theme.palette.mode === 'dark' ? '#1a1a1f' : '#e6e6e9'})`,
                  boxShadow: theme.palette.mode === 'dark' 
                    ? '0 8px 16px rgba(0,0,0,0.4), inset 0 0 8px rgba(192,192,192,0.1), 0 0 0 1px rgba(192,192,192,0.2)'
                    : '0 8px 16px rgba(0,0,0,0.1), inset 0 0 8px rgba(192,192,192,0.2), 0 0 0 1px rgba(192,192,192,0.3)',
                  overflow: 'hidden',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '3px',
                    background: 'linear-gradient(90deg, #c0c0c0, #e6e6e6, #c0c0c0)',
                    boxShadow: '0 0 8px rgba(192,192,192,0.5)'
                  }
                }}
              >
                <CardContent
                  sx={{
                    p: 2,
                    position: 'relative',
                    pl: silverActionSchedule ? { xs: 2, md: '170px' } : 2,
                    minHeight: silverActionSchedule ? { xs: 'auto', md: 180 } : 'auto',
                  }}
                >
                  {isSilverActionLoading ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Skeleton variant="circular" width={20} height={20} />
                        <Skeleton variant="text" width={140} height={24} />
                      </Box>
                      <Skeleton variant="text" width="90%" height={20} />
                    </Box>
                  ) : silverAction ? (
                    <>
                      {silverActionSchedule && (
                        <Box
                          sx={{
                            position: { xs: 'relative', md: 'absolute' },
                            top: { md: 14 },
                            left: { md: 14 },
                            width: { xs: '100%', md: 136 },
                            minHeight: { xs: 96, md: 132 },
                            mb: { xs: 1.5, md: 0 },
                            borderRadius: 1.75,
                            overflow: 'hidden',
                            border: '1px solid',
                            borderColor: theme.palette.mode === 'dark' ? 'rgba(192,192,192,0.52)' : 'rgba(112,112,112,0.42)',
                            boxShadow: theme.palette.mode === 'dark'
                              ? '0 6px 14px rgba(0,0,0,0.35), 0 0 0 1px rgba(192,192,192,0.12)'
                              : '0 6px 14px rgba(112,112,112,0.18), 0 0 0 1px rgba(192,192,192,0.2)',
                            zIndex: 2,
                          }}
                        >
                          <Box
                            sx={{
                              px: 1,
                              py: 0.45,
                              textAlign: 'center',
                              bgcolor: theme.palette.mode === 'dark' ? 'rgba(192,192,192,0.22)' : 'rgba(192,192,192,0.30)',
                              borderBottom: '1px solid',
                              borderColor: theme.palette.mode === 'dark' ? 'rgba(192,192,192,0.44)' : 'rgba(112,112,112,0.35)',
                            }}
                          >
                            <Typography sx={{ fontSize: '0.66rem', letterSpacing: '0.58px', fontWeight: 800, textTransform: 'uppercase' }}>
                              Day of Action
                            </Typography>
                          </Box>
                          <Box
                            sx={{
                              minHeight: { xs: 68, md: 95 },
                              px: 1,
                              py: 0.8,
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'center',
                              alignItems: 'center',
                              textAlign: 'center',
                              bgcolor: theme.palette.mode === 'dark' ? 'rgba(12,12,14,0.55)' : 'rgba(252,252,253,0.9)',
                            }}
                          >
                            <Typography sx={{ fontWeight: 700, fontSize: '0.84rem', lineHeight: 1.2 }}>
                              {silverActionSchedule.dateLabel}
                            </Typography>
                            <Typography sx={{ mt: 0.35, opacity: 0.85, fontSize: '0.76rem', fontWeight: 600 }}>
                              {silverActionSchedule.timeLabel}
                            </Typography>
                            {silverActionDayLabel && (
                              <Typography sx={{ mt: 0.45, opacity: 0.72, fontSize: '0.62rem' }}>
                                {silverActionDayLabel}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      )}

                      {silverActionLocked && (
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
                          }}
                        >
                          <LockIcon sx={{ color: '#c0c0c0', mb: 1 }} />
                          <Typography variant="body2" align="center" sx={{ color: '#fff', mb: 1 }}>
                            Silver Action Locked
                          </Typography>
                          <Typography variant="caption" align="center" sx={{ color: 'rgba(255,255,255,0.85)', mb: 1 }}>
                            {silverProgress.label || 'Help unlock this action by contributing progress.'}
                          </Typography>
                          <Box sx={{ width: '100%', maxWidth: 220, mb: 1.5 }}>
                            <LinearProgress
                              variant="determinate"
                              value={Math.round((silverProgress.ratio || 0) * 100)}
                              sx={{
                                height: 7,
                                borderRadius: 999,
                                bgcolor: 'rgba(255,255,255,0.2)',
                                '& .MuiLinearProgress-bar': {
                                  bgcolor: '#c0c0c0',
                                },
                              }}
                            />
                          </Box>
                          {canVoteForAction(silverAction) && (
                            <Button
                              size="small"
                              variant={silverAction?.progress?.user_voted ? 'outlined' : 'contained'}
                              onClick={() => handleVoteAction('silver')}
                              disabled={voteLoadingByType.silver || !!silverAction?.progress?.user_voted}
                              sx={{
                                color: '#fff',
                                borderColor: 'rgba(192,192,192,0.8)',
                                bgcolor: silverAction?.progress?.user_voted ? 'transparent' : 'rgba(192,192,192,0.25)',
                              }}
                            >
                              {silverAction?.progress?.user_voted ? 'Vote Counted' : (voteLoadingByType.silver ? 'Voting...' : 'Count me in!')}
                            </Button>
                          )}
                        </Box>
                      )}

                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', mb: 1 }}>
                        <FlagIcon 
                          sx={{ 
                            mr: 1,
                            color: '#c0c0c0',
                            fontSize: '1.1rem',
                            filter: 'drop-shadow(0 0 2px rgba(192,192,192,0.5))'
                          }} 
                        />
                        <Typography 
                          variant="subtitle1" 
                          component="h3"
                          sx={{ 
                            fontFamily: '"Playfair Display", serif',
                            fontWeight: 700,
                            fontSize: '0.9rem',
                            letterSpacing: '0.5px',
                            color: theme.palette.mode === 'dark' ? '#c0c0c0' : '#707070',
                            textShadow: theme.palette.mode === 'dark' 
                              ? '0 0 4px rgba(192,192,192,0.3)' 
                              : '0 0 2px rgba(112,112,112,0.2)'
                          }}
                        >
                          SILVER ACTION
                        </Typography>
                      </Box>
                      
                      <Typography 
                        variant="h6" 
                        gutterBottom
                        sx={{ 
                          fontWeight: 600,
                          fontSize: '1rem',
                          color: theme.palette.mode === 'dark' ? '#fff' : '#000',
                          textAlign: 'right'
                        }}
                      >
                        {silverAction.title}
                      </Typography>
                      
                      <Typography 
                        variant="body2"
                        sx={{ 
                          mb: 1,
                          fontSize: '0.8rem',
                          color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)',
                          textAlign: 'right'
                        }}
                      >
                        {silverAction.description}
                      </Typography>

                      {silverProgress.label && (
                        <Box sx={{ mb: 1 }}>
                          <Typography variant="caption" sx={{ display: 'block', mb: 0.5, opacity: 0.85, textAlign: 'right' }}>
                            Progress: {silverProgress.label}
                          </Typography>
                          <LinearProgress
                            variant="determinate"
                            value={Math.round((silverProgress.ratio || 0) * 100)}
                            sx={{
                              height: 6,
                              borderRadius: 999,
                              bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.16)' : 'rgba(0,0,0,0.1)',
                              '& .MuiLinearProgress-bar': {
                                bgcolor: '#c0c0c0',
                              },
                            }}
                          />
                        </Box>
                      )}
                      
                    </>
                  ) : null}
                </CardContent>
              </Card>
            )
          ) : (
            <Card
              sx={{
                flex: 1,
                position: 'relative',
                borderRadius: 2,
                ml: { xs: 0, sm: 2 },
                mt: { xs: 2, sm: 0 },
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
          )}
        </Box>
      </motion.div>
      
      {/* Community Dot Tabs */}
      <CommunityDotTabs 
        timelineId={id} 
      />
      
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
              bgcolor: 'background.paper',
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
                      sx={{ 
                        mr: 2,
                        boxShadow: '0 0 0 2px ' + roleColor.bg,
                        cursor: 'pointer',
                        transition: 'transform 0.2s ease',
                        '&:hover': { transform: 'scale(1.05)' }
                      }}
                      onClick={() => window.open(`/profile/${member.id}`, '_blank')}
                    />
                    <Box sx={{ flexGrow: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="subtitle1">{member.name}</Typography>
                        
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
                bgcolor: 'background.paper',
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
