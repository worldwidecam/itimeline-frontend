import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Tabs,
  Tab,
  Divider,
  TextField,
  FormControlLabel,
  Switch,
  Button,
  Alert,
  Snackbar,
  Skeleton,
  useTheme,
  Chip,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormHelperText,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Stack,
  Fab,
  Slider,
  ToggleButton,
  ToggleButtonGroup,
  Portal
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import SecurityIcon from '@mui/icons-material/Security';
import PeopleIcon from '@mui/icons-material/People';
import SettingsIcon from '@mui/icons-material/Settings';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import BlockIcon from '@mui/icons-material/Block';
import PersonRemoveIcon from '@mui/icons-material/PersonRemove';
import ForumIcon from '@mui/icons-material/Forum';
import FlagIcon from '@mui/icons-material/Flag';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import ShieldIcon from '@mui/icons-material/Shield';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import ModeratorIcon from '@mui/icons-material/VerifiedUser';
import SaveIcon from '@mui/icons-material/Save';
import RefreshIcon from '@mui/icons-material/Refresh';
import CommentIcon from '@mui/icons-material/Comment';
import MovieIcon from '@mui/icons-material/Movie';
import ImageIcon from '@mui/icons-material/Image';
import VideocamIcon from '@mui/icons-material/Videocam';
import AudiotrackIcon from '@mui/icons-material/Audiotrack';
import NewspaperIcon from '@mui/icons-material/Newspaper';
import LockIcon from '@mui/icons-material/Lock';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import InfoIcon from '@mui/icons-material/Info';
import VolunteerActivismRoundedIcon from '@mui/icons-material/VolunteerActivismRounded';
import ThumbDownAltRoundedIcon from '@mui/icons-material/ThumbDownAltRounded';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Link as RouterLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import NavFab from './NavFab';
import api from '../../../utils/api';
import { getTimelineDetails, getTimelineMemberCount, getTimelineMembers, getBlockedMembers, getPendingMembers, updateTimelineVisibility, updateTimelineDetails, removeMember, updateMemberRole, blockMember, unblockMember, approvePendingMember, denyPendingMember, getTimelineActions, saveTimelineActions, getTimelineActionByType, getTimelineQuote, updateTimelineQuote, checkMembershipStatus, listReports, acceptReport, resolveReport, escalateReport, getTimelineStatusMessage, updateTimelineStatusMessage } from '../../../utils/api';
import UserAvatar from '../../common/UserAvatar';
import CommunityLockView from './CommunityLockView';
import EventPopup from '../events/EventPopup';
import EventDialog from '../events/EventDialog';
import ErrorBoundary from '../../ErrorBoundary';
import InfoCardsTab from './InfoCardsTab';
import { getTimelineSurfaceTheme } from '../timelineSurfaceTheme';
import { displayUsername } from '../../../utils/usernameDisplay';

// ----- Shared helpers (module scope) -----
// Normalize role string
const normalizeRole = (r) => (r || '').toLowerCase();

// Client-side check to determine if current user can remove target member
export const canRemoveMember = (currentRoleRaw, currentId, target, tlData) => {
  const currentRole = normalizeRole(currentRoleRaw);
  const targetRole = normalizeRole(target?.role);
  const targetId = target?.userId || target?.user_id || target?.id;
  const creatorId = tlData?.createdBy;
  // Fallback: read current user id directly from localStorage if state not yet set
  let effectiveCurrentId = currentId;
  if (!effectiveCurrentId) {
    try {
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      if (storedUser && storedUser.id) effectiveCurrentId = storedUser.id;
    } catch (_) {}
  }

  // No role or ids -> deny
  if (!currentRole || !targetId) return false;

  // Cannot remove self
  if (effectiveCurrentId && Number(effectiveCurrentId) === Number(targetId)) return false;

  // Cannot remove SiteOwner or user_id 1
  if (targetRole === 'siteowner' || Number(targetId) === 1) return false;

  // Protect timeline creator except SiteOwner can
  if (creatorId && Number(targetId) === Number(creatorId) && currentRole !== 'siteowner') return false;

  // Members cannot remove anyone
  if (currentRole === 'member' || currentRole === '') return false;

  // Moderators can remove only members
  if (currentRole === 'moderator') {
    return targetRole === 'member' || targetRole === '' || !targetRole;
  }

  // Admin, Creator, SiteOwner can remove member/moderator/admin (backend enforces last-admin etc.)
  if (['admin', 'creator', 'siteowner'].includes(currentRole)) {
    return ['member', 'moderator', 'admin', ''].includes(targetRole);
  }

  return false;
};

// Helper function to format dates as YYYY-MM-DD without timezone issues
const formatDateForAPI = (date) => {
  if (!date) return null;
  
  // Get the date in local timezone and format as YYYY-MM-DD
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}T12:00:00`; // Use noon to avoid timezone edge cases
};

// Helper to extract storage key from R2/Cloudinary URL for backend
const extractKeyFromUrl = (url) => {
  if (!url || typeof url !== 'string') return null;
  
  // If already a key (no protocol), return as-is
  if (!url.startsWith('http')) {
    return url;
  }
  
  try {
    const urlObj = new URL(url);
    const path = urlObj.pathname;
    
    // R2 path format: /timelines/{id}/{filename}
    // Extract the part after the bucket domain
    const match = path.match(/\/timelines\/[^/]+\/(.+)$/);
    if (match) {
      return `timelines/${match[1]}`;
    }
    
    // Fallback: return full path without leading slash
    return path.startsWith('/') ? path.slice(1) : path;
  } catch (e) {
    // If URL parsing fails, return original
    return url;
  }
};

const AdminPanel = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [tabValue, setTabValue] = useState(0);
  const [memberTabValue, setMemberTabValue] = useState(0); // 0 = Active Members, 1 = Blocked Members
  const [isLoading, setIsLoading] = useState(true);
  const [timelineData, setTimelineData] = useState(null);
  const [isPrivate, setIsPrivate] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [members, setMembers] = useState([]);
  const [blockedMembers, setBlockedMembers] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmUnblockDialogOpen, setConfirmUnblockDialogOpen] = useState(false);
  const [confirmBlockDialogOpen, setConfirmBlockDialogOpen] = useState(false);
  const [actionType, setActionType] = useState('');  // 'remove', 'block', or 'unblock'
  // Access control state
  const [accessLoading, setAccessLoading] = useState(true);
  const [isMember, setIsMember] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  
  // State for reported posts
  const [reportedPosts, setReportedPosts] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);
  const [confirmPostActionDialogOpen, setConfirmPostActionDialogOpen] = useState(false);
  const [postActionType, setPostActionType] = useState(''); // 'delete' or 'safeguard'
  const [isPostLoading, setIsPostLoading] = useState(true);
  const [communityFabExpanded, setCommunityFabExpanded] = useState(false);
  const [settingsSaveFabVisible, setSettingsSaveFabVisible] = useState(false);
  const theme = useTheme();
  const timelineSurfaces = useMemo(() => getTimelineSurfaceTheme(theme), [theme]);

  const communityFabBottom = settingsSaveFabVisible ? 'calc(2rem + 56px + 30px)' : '2rem';

  const handleCommunityNavigate = (targetPath) => {
    if (!targetPath || location.pathname === targetPath) {
      setCommunityFabExpanded(false);
      return;
    }
    setCommunityFabExpanded(false);
    navigate(targetPath);
  };

  const handleTimelineUpdated = useCallback((updatedTimeline) => {
    if (!updatedTimeline) return;
    setTimelineData((prev) => ({
      ...(prev || {}),
      id: updatedTimeline.id ?? prev?.id,
      name: updatedTimeline.name ?? prev?.name,
      description: updatedTimeline.description ?? prev?.description,
      coverImageUrl: String(updatedTimeline.cover_image_url || prev?.coverImageUrl || '').trim(),
      coverPortraitImageUrl: String(updatedTimeline.cover_portrait_image_url || prev?.coverPortraitImageUrl || '').trim(),
      coverLandscapeImageUrl: String(updatedTimeline.cover_landscape_image_url || prev?.coverLandscapeImageUrl || '').trim(),
      coverUploadEnabled: updatedTimeline.cover_upload_enabled !== false,
      coverLandscapeX: Number(updatedTimeline.cover_landscape_x ?? prev?.coverLandscapeX ?? 50),
      coverLandscapeY: Number(updatedTimeline.cover_landscape_y ?? prev?.coverLandscapeY ?? 50),
      coverZoom: Number(updatedTimeline.cover_landscape_zoom ?? updatedTimeline.cover_zoom ?? prev?.coverZoom ?? 1),
    }));
  }, []);

  // Load data from backend API with access check
  useEffect(() => {
    // Load timeline details
    const loadTimelineData = async () => {
      try {
        setIsLoading(true);
        console.log('Fetching timeline details for ID:', id);
        const response = await getTimelineDetails(id);
        console.log('Timeline details response:', response);
        
        const countResponse = await getTimelineMemberCount(id);
        const totalCount = countResponse?.count ?? response.member_count ?? 0;

        // Format the timeline data
        setTimelineData({
          name: response.name,
          description: response.description || '',
          visibility: response.visibility || 'public',
          createdAt: new Date(response.created_at).toISOString().split('T')[0],
          memberCount: totalCount,
          createdBy: response.created_by || response.createdBy || null,
          coverImageUrl: String(response.cover_image_url || '').trim(),
          coverPortraitImageUrl: String(response.cover_portrait_image_url || '').trim(),
          coverLandscapeImageUrl: String(response.cover_landscape_image_url || '').trim(),
          coverUploadEnabled: response.cover_upload_enabled !== false,
          coverLandscapeX: Number(response.cover_landscape_x ?? 50),
          coverLandscapeY: Number(response.cover_landscape_y ?? 50),
          coverZoom: Number(response.cover_landscape_zoom ?? response.cover_zoom ?? 1),
        });
        
        // Set visibility state based on timeline data
        setIsPrivate(response.visibility === 'private');
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching timeline details:', error);
        setIsLoading(false);
        
        // Don't use mock data, show error state instead
        console.log('Unable to load timeline details - API error');
        // Keep previous state if any, otherwise initialize with empty values
        setTimelineData(prev => prev || {
          name: '',
          description: '',
          visibility: 'public',
          createdAt: '',
          memberCount: 0,
          createdBy: null,
          coverImageUrl: '',
          coverPortraitImageUrl: '',
          coverLandscapeImageUrl: '',
          coverUploadEnabled: true,
          coverLandscapeX: 50,
          coverLandscapeY: 50,
          coverZoom: 1,
        });
      }
    };
  // Reload helpers (component scope) to avoid useEffect scoping issues
  const reloadMembers = async () => {
    try {
      const response = await getTimelineMembers(id);
      const membersData = Array.isArray(response) ? response : response.data || [];
      const formatted = membersData.map(member => {
        const userData = member.user || {};
        let joinDate = 'Unknown';
        try {
          if (member.joined_at) {
            const date = new Date(member.joined_at);
            if (!isNaN(date.getTime())) joinDate = date.toISOString().split('T')[0];
          }
        } catch (_) {}
        return {
          id: member.user_id,
          name: userData.username || member.username || `User ${member.user_id}`,
          role: member.role,
          joinDate,
          avatar: userData.avatar_url || member.avatar_url || `https://i.pravatar.cc/150?img=${(member.user_id % 70) + 1}`
        };
      });
      setMembers(formatted);
    } catch (e) {
      console.error('[AdminPanel] reloadMembers failed:', e);
      setMembers([]);
    }
  };

  const reloadBlockedMembers = async () => {
    try {
      console.log('[AdminPanel] reloadBlockedMembers called for timeline:', id);
      const response = await getBlockedMembers(id);
      console.log('[AdminPanel] reloadBlockedMembers response:', response);
      const list = Array.isArray(response) ? response : response?.data || [];
      const formatted = list.map((item) => {
        const user = item.user || {};
        const avatar = user.avatar_url || item.avatar_url || null;
        const user_color = user.user_color || item.user_color || null;
        const blockedAt = item.blocked_at || item.blockedDate;
        let blockedDate = 'Unknown';
        try {
          if (blockedAt) {
            const d = new Date(blockedAt);
            if (!isNaN(d.getTime())) blockedDate = d.toISOString().split('T')[0];
          }
        } catch (_) {}
        return {
          id: item.user_id || item.id,
          name: user.username || item.username || `User ${item.user_id || item.id}`,
          avatar,
          user_color,
          blockedDate,
          reason: item.blocked_reason || item.reason || ''
        };
      });
      console.log('[AdminPanel] reloadBlockedMembers formatted:', formatted);
      setBlockedMembers(formatted);
    } catch (e) {
      console.error('[AdminPanel] reloadBlockedMembers failed:', e);
      setBlockedMembers([]);
    }
  };

    // Load members data
    const loadMembers = async () => {
      try {
        console.log('Fetching members for timeline ID:', id);
        const response = await getTimelineMembers(id);
        console.log('Members API response:', response);
        
        // Format the member data
        const membersData = Array.isArray(response) ? response : response.data || [];
        
        const formattedMembers = membersData.map(member => {
          // Extract user data - it might be nested in different ways depending on API response
          const userData = member.user || {};
          
          // Safe date parsing
          let joinDate = 'Unknown';
          try {
            if (member.joined_at) {
              const date = new Date(member.joined_at);
              if (!isNaN(date.getTime())) {
                joinDate = date.toISOString().split('T')[0];
              }
            }
          } catch (dateError) {
            console.warn('Invalid date for member:', member.user_id, member.joined_at);
          }
          
          return {
            id: member.user_id,
            name: userData.username || member.username || `User ${member.user_id}`,
            role: member.role,
            joinDate,
            avatar: userData.avatar_url || member.avatar_url || `https://i.pravatar.cc/150?img=${(member.user_id % 70) + 1}`
          };
        });
        
        setMembers(formattedMembers);
      } catch (error) {
        console.error('Error fetching members:', error);
        
        // Don't use mock data, show empty members list instead
        console.log('Unable to load members - API error');
        setMembers([]);
        // Display an error message to the user (could be implemented with a toast notification)
        // For now, we'll just log to console
      }
    };
    
    // Blocked members loader using backend
    const loadBlockedMembers = async () => {
      try {
        console.log('Fetching blocked members for timeline ID:', id);
        const response = await getBlockedMembers(id);
        const list = Array.isArray(response) ? response : response?.data || [];
        const formatted = list.map((item) => {
          const user = item.user || {};
          // prefer backend-provided fields; no mock fallback
          const avatar = user.avatar_url || item.avatar_url || null;
          const user_color = user.user_color || item.user_color || null;
          const blockedAt = item.blocked_at || item.blockedDate;
          let blockedDate = 'Unknown';
          try {
            if (blockedAt) {
              const d = new Date(blockedAt);
              if (!isNaN(d.getTime())) blockedDate = d.toISOString().split('T')[0];
            }
          } catch (_) {}
          return {
            id: item.user_id || item.id,
            name: user.username || item.username || `User ${item.user_id || item.id}`,
            avatar,
            user_color,
            blockedDate,
            reason: item.blocked_reason || item.reason || ''
          };
        });
        setBlockedMembers(formatted);
      } catch (err) {
        console.error('Error fetching blocked members:', err);
        setBlockedMembers([]);
      }
    };
    
    // Note: Manage Posts now exclusively loads real data via listReports in ManagePostsTab

    // First, check access
    const checkAccess = async () => {
      try {
        console.log('[AdminPanel] Starting access check for timeline:', id);
        setAccessLoading(true);
        const status = await checkMembershipStatus(id, 0, true);
        console.log('[AdminPanel] Membership status:', status);
        const role = (status?.role || '').toLowerCase();
        const allowed = status?.is_member && ['moderator', 'admin', 'creator', 'siteowner'].includes(role);
        console.log('[AdminPanel] Role:', role, 'Allowed:', allowed);
        setIsMember(!!status?.is_member);
        setUserRole(status?.role || null);
        // Capture current user id from passport cache if available
        try {
          const userData = JSON.parse(localStorage.getItem('user') || '{}');
          if (userData && userData.id) setCurrentUserId(userData.id);
        } catch (e) {
          console.warn('Unable to parse current user from localStorage', e);
        }
        if (!allowed) {
          // Not authorized to view Admin Panel
          console.log('[AdminPanel] Access denied - not authorized');
          setIsLoading(false);
          return;
        }
        // Authorized, proceed to load data
        console.log('[AdminPanel] Starting data load...');
        loadTimelineData();
        loadMembers();
        console.log('[AdminPanel] About to call loadBlockedMembers...');
        await loadBlockedMembers();
        console.log('[AdminPanel] loadBlockedMembers completed');
        // Manage Posts data will be loaded by ManagePostsTab via listReports
      } catch (e) {
        console.error('[AdminPanel] Access check failed:', e);
        setIsMember(false);
        setUserRole(null);
        setIsLoading(false);
      } finally {
        setAccessLoading(false);
      }
    };

    console.log('[AdminPanel] useEffect triggered for timeline:', id);
    checkAccess();
  }, [id]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  const handleMemberTabChange = (event, newValue) => {
    setMemberTabValue(newValue);
  };
  
  const handleVisibilityChange = (event) => {
    const newValue = event.target.checked;
    setIsPrivate(newValue);
    
    // Show warning when switching to private
    if (newValue) {
      setShowWarning(true);
    } else {
      setShowWarning(false);
    }
  };
  
  // Handle opening the confirmation dialog for different actions
  const handleOpenConfirmDialog = (member, action) => {
    setSelectedMember(member);
    setActionType(action);
    
    if (action === 'remove') {
      // Guard: if not allowed to remove, show feedback and do nothing
      if (!canRemoveMember(userRole, currentUserId, member, timelineData)) {
        setSnackbarMessage("You don't have permission to remove this member.");
        setSnackbarSeverity('warning');
        setSnackbarOpen(true);
        return;
      }
      setConfirmDialogOpen(true);
    } else if (action === 'block') {
      setConfirmBlockDialogOpen(true);
    } else if (action === 'unblock') {
      setConfirmUnblockDialogOpen(true);
    } else if (['promote_admin','promote_moderator','demote_member'].includes(action)) {
      // Execute role change immediately (no modal)
      const direction = action.startsWith('promote') ? 'promote' : 'demote';
      performRoleChange(member, direction);
    }
  };
  
  // Handle closing the confirmation dialogs
  const handleCloseConfirmDialog = () => {
    setConfirmDialogOpen(false);
    setConfirmBlockDialogOpen(false);
    setConfirmUnblockDialogOpen(false);
    setSelectedMember(null);
  };

  // Centralized confirm handler to avoid any scope confusion in JSX
  const handleConfirmAction = async () => {
    try {
      if (actionType === 'remove') {
        await handleRemoveMember();
      } else if (actionType === 'block') {
        await handleBlockMember();
      } else if (actionType === 'unblock') {
        await handleUnblockMember();
      }
    } catch (e) {
      console.error('[AdminPanel] Error in handleConfirmAction:', e);
    }
  };

  // ----- Role change helpers (no rank jumping) -----
  const getNextRole = (role) => {
    const r = (role || '').toLowerCase();
    if (r === 'member') return 'moderator';
    if (r === 'moderator') return 'admin';
    return null;
  };

  const getPrevRole = (role) => {
    const r = (role || '').toLowerCase();
    if (r === 'admin') return 'moderator';
    if (r === 'moderator') return 'member';
    return null;
  };

  const performRoleChange = async (member, direction) => {
    try {
      const targetId = member?.userId || member?.user_id || member?.id;
      if (!targetId) return;
      // Guard: no self and no SiteOwner
      if (Number(targetId) === Number(currentUserId)) {
        setSnackbarMessage('You cannot change your own role');
        setSnackbarSeverity('warning');
        setSnackbarOpen(true);
        return;
      }
      if (Number(targetId) === 1 || (member?.role || '').toLowerCase() === 'siteowner') {
        setSnackbarMessage('Cannot change SiteOwner role');
        setSnackbarSeverity('warning');
        setSnackbarOpen(true);
        return;
      }

      const currentRole = member?.role;
      const newRole = direction === 'promote' ? getNextRole(currentRole) : getPrevRole(currentRole);
      if (!newRole) {
        // Already at bounds; no action
        setSnackbarMessage('No further role change available');
        setSnackbarSeverity('info');
        setSnackbarOpen(true);
        return;
      }

      setIsLoading(true);
      await updateMemberRole(id, targetId, newRole);
      // Note: Passport sync endpoint not implemented
      // try {
      //   await syncUserPassport();
      // } catch (e) {
      //   console.warn('[AdminPanel] Passport sync failed after role change (continuing):', e);
      // }
      await reloadMembers();
      setSnackbarMessage(`Updated role to ${newRole} for ${displayUsername(member?.username || member?.name) || 'member'}`);
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (e) {
      const serverMsg = e?.response?.data?.error || e?.response?.data?.message;
      setSnackbarMessage(`Failed to update role: ${serverMsg || e.message || 'Unknown error'}`);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle removing a member
  const handleRemoveMember = async () => {
    console.log('handleRemoveMember called with selectedMember:', selectedMember);
    try {
      // Show loading state
      setIsLoading(true);
      
      // Prevent self-removal at UI level
      const selfId = currentUserId;
      const targetId = selectedMember?.userId || selectedMember?.user_id || selectedMember?.id;
      if (selfId && targetId && Number(selfId) === Number(targetId)) {
        setSnackbarMessage('Cannot remove yourself. Use the Leave timeline feature instead.');
        setSnackbarSeverity('warning');
        setSnackbarOpen(true);
        setIsLoading(false);
        return;
      }

      // 1. Call the API to remove the member
      // The API expects the actual user_id, not the membership record ID
      // Log the selected member object to verify we have the right ID
      console.log('Selected member for removal:', selectedMember);
      
      // Make sure we're using the correct ID for the API call
      const userIdForApi = targetId;
      console.log(`Attempting to remove member with timeline ID: ${id} and user ID: ${userIdForApi}`);
      await removeMember(id, userIdForApi);
      // Note: Passport sync endpoint not implemented
      // try {
      //   await syncUserPassport();
      //   console.log('[AdminPanel] Synced user passport after removal');
      // } catch (syncErr) {
      //   console.warn('[AdminPanel] Passport sync failed after removal (continuing):', syncErr);
      // }
      
      // 2. Update local state to remove the member
      setMembers(members.filter(m => m.id !== selectedMember.id));
      
      // 2.5. Fetch updated blocked members list to show the removed user
      try {
        await reloadBlockedMembers();
        console.log(`Updated blocked members list after removal`);
      } catch (blockedError) {
        console.warn('Failed to fetch blocked members after removal:', blockedError);
      }
      
      // 3. Update the member count in timeline data
      if (timelineData) {
        setTimelineData({
          ...timelineData,
          memberCount: Math.max(0, timelineData.memberCount - 1)
        });
      }
      
      // 4. Clear ALL relevant localStorage caches to ensure persistence
      try {
        // Clear timeline member count cache
        const memberCountKey = `timeline_${id}_memberCount`;
        localStorage.removeItem(memberCountKey);
        
        // Clear timeline members list cache
        const membersListKey = `timeline_${id}_members`;
        localStorage.removeItem(membersListKey);
        
        // Clear user passport data to force refresh on next load
        localStorage.removeItem('userPassport');
        
        // Clear user-specific passport cache
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        if (userData.id) {
          const userPassportKey = `user_passport_${userData.id}`;
          localStorage.removeItem(userPassportKey);
        }
        
        // Clear direct timeline membership status
        const membershipKey = `timeline_membership_${id}`;
        localStorage.removeItem(membershipKey);
        
        // Update timestamp to force refresh of related components
        localStorage.setItem('membershipLastUpdated', Date.now().toString());
        
        console.log('Successfully cleared all membership caches after member removal');
      } catch (cacheError) {
        console.warn('Error clearing caches after member removal:', cacheError);
      }
      
      // 5. Close the dialog
      handleCloseConfirmDialog();
      
      // 6. Show success message
      setSnackbarMessage(`${displayUsername(selectedMember?.username || selectedMember?.name)} has been removed from the community`);
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      
      // End loading state
      setIsLoading(false);
    } catch (error) {
      console.error('Error removing member:', error);
      
      // Show error message
      const serverMsg = error?.response?.data?.error || error?.response?.data?.message;
      setSnackbarMessage(`Failed to remove member: ${serverMsg || error.message || 'Unknown error'}`);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      
      // End loading state
      setIsLoading(false);
    }
  };
  
  // Handle blocking a member
  const handleBlockMember = async () => {
    try {
      // Show loading state
      setIsLoading(true);
      
      // 1. Call the API to block the member
      const reason = 'Blocked by administrator';
      console.log('Selected member for blocking:', selectedMember);
      
      // Make sure we're using the correct ID for the API call
      const userIdForApi = selectedMember.userId ?? selectedMember.id;
      console.log(`Attempting to block member with timeline ID: ${id} and user ID: ${userIdForApi}`);
      await blockMember(id, userIdForApi, reason);
      // Note: Passport sync endpoint not implemented
      // try {
      //   await syncUserPassport();
      //   console.log('[AdminPanel] Synced user passport after block');
      // } catch (syncErr) {
      //   console.warn('[AdminPanel] Passport sync failed after block (continuing):', syncErr);
      // }
      // Re-fetch lists from backend for accuracy
      await Promise.all([reloadMembers(), reloadBlockedMembers()]);
      setConfirmBlockDialogOpen(false);
      // Switch to Blocked tab so the result is visible
      setMemberTabValue(1);
      
      // 4. Update the member count in timeline data
      if (timelineData) {
        setTimelineData({
          ...timelineData,
          memberCount: Math.max(0, timelineData.memberCount - 1)
        });
      }
      
      // 5. Clear ALL relevant localStorage caches to ensure persistence
      try {
        // Clear timeline member count cache
        const memberCountKey = `timeline_${id}_memberCount`;
        localStorage.removeItem(memberCountKey);
        
        // Clear timeline members list cache
        const membersListKey = `timeline_${id}_members`;
        localStorage.removeItem(membersListKey);
        
        // Clear blocked members list cache
        const blockedMembersKey = `timeline_${id}_blockedMembers`;
        localStorage.removeItem(blockedMembersKey);
        
        // Clear user passport data to force refresh on next load
        localStorage.removeItem('userPassport');
        
        // Clear user-specific passport cache
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        if (userData.id) {
          const userPassportKey = `user_passport_${userData.id}`;
          localStorage.removeItem(userPassportKey);
        }
        
        // Update timestamp to force refresh of related components
        localStorage.setItem('membershipLastUpdated', Date.now().toString());
        
        console.log('Successfully cleared all membership caches after blocking member');
      } catch (cacheError) {
        console.warn('Error clearing caches after blocking member:', cacheError);
      }
      
      // 6. Show success message
      setSnackbarMessage(`${displayUsername(selectedMember?.username || selectedMember?.name)} has been blocked from the community`);
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      
      // End loading state
      setIsLoading(false);
    } catch (error) {
      console.error('Error blocking member:', error);
      
      // Show error message
      setSnackbarMessage(`Failed to block member: ${error.message || 'Unknown error'}`);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      
      // End loading state
      setIsLoading(false);
    }
  };
  
  // Handle unblocking a member
  const handleUnblockMember = async () => {
    try {
      // Show loading state
      setIsLoading(true);
      
      // 1. Call the API to unblock the member
      console.log('Selected member for unblocking:', selectedMember);
      
      // Make sure we're using the correct ID for the API call
      const userIdForApi = selectedMember.userId ?? selectedMember.id;
      console.log(`Attempting to unblock member with timeline ID: ${id} and user ID: ${userIdForApi}`);
      await unblockMember(id, userIdForApi);
      // Note: Passport sync endpoint not implemented
      // try {
      //   await syncUserPassport();
      //   console.log('[AdminPanel] Synced user passport after unblock');
      // } catch (syncErr) {
      //   console.warn('[AdminPanel] Passport sync failed after unblock (continuing):', syncErr);
      // }
      // Re-fetch lists from backend for accuracy
      await Promise.all([reloadMembers(), reloadBlockedMembers()]);
      setConfirmUnblockDialogOpen(false);
      // Switch back to Active Members tab
      setMemberTabValue(0);
      
      // 4. Update the member count in timeline data
      if (timelineData) {
        setTimelineData({
          ...timelineData,
          memberCount: timelineData.memberCount + 1
        });
      }
      
      // 5. Clear ALL relevant localStorage caches to ensure persistence
      try {
        // Clear timeline member count cache
        const memberCountKey = `timeline_${id}_memberCount`;
        localStorage.removeItem(memberCountKey);
        
        // Clear timeline members list cache
        const membersListKey = `timeline_${id}_members`;
        localStorage.removeItem(membersListKey);
        
        // Clear blocked members list cache
        const blockedMembersKey = `timeline_${id}_blockedMembers`;
        localStorage.removeItem(blockedMembersKey);
        
        // Clear user passport data to force refresh on next load
        localStorage.removeItem('userPassport');
        
        // Clear user-specific passport cache
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        if (userData.id) {
          const userPassportKey = `user_passport_${userData.id}`;
          localStorage.removeItem(userPassportKey);
        }
        
        // Update timestamp to force refresh of related components
        localStorage.setItem('membershipLastUpdated', Date.now().toString());
        
        console.log('Successfully cleared all membership caches after unblocking member');
      } catch (cacheError) {
        console.warn('Error clearing caches after unblocking member:', cacheError);
      }
      
      // 6. Show success message
      setSnackbarMessage(`${selectedMember.name} has been unblocked`);
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      
      // End loading state
      setIsLoading(false);
    } catch (error) {
      console.error('Error unblocking member:', error);
      
      // Show error message
      setSnackbarMessage(`Failed to unblock member: ${error.message || 'Unknown error'}`);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      
      // End loading state
      setIsLoading(false);
    }
  };
  
  // Get role color styling
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

  // Normalize role string
  const normalizeRole = (r) => (r || '').toLowerCase();

  // Client-side check to determine if current user can remove target member
  const canRemoveMember = (currentRoleRaw, currentId, target, tlData) => {
    const currentRole = normalizeRole(currentRoleRaw);
    const targetRole = normalizeRole(target?.role);
    const targetId = target?.userId || target?.user_id || target?.id;
    const creatorId = tlData?.createdBy;
    // Fallback: read current user id directly from localStorage if state not yet set
    let effectiveCurrentId = currentId;
    if (!effectiveCurrentId) {
      try {
        const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
        if (storedUser && storedUser.id) effectiveCurrentId = storedUser.id;
      } catch (_) {}
    }

    // No role or ids -> deny
    if (!currentRole || !targetId) return false;

    // Cannot remove self
    if (effectiveCurrentId && Number(effectiveCurrentId) === Number(targetId)) return false;

    // Cannot remove SiteOwner or user_id 1
    if (targetRole === 'siteowner' || Number(targetId) === 1) return false;

    // Protect timeline creator except SiteOwner can
    if (creatorId && Number(targetId) === Number(creatorId) && currentRole !== 'siteowner') return false;

    // Members cannot remove anyone
    if (currentRole === 'member' || currentRole === '') return false;

    // Moderators: can remove members only
    if (currentRole === 'moderator') return targetRole === 'member';

    // Admins and creator and siteowner: can remove moderators and members, and admins (subject to server last-admin rule)
    if (['admin', 'creator', 'siteowner'].includes(currentRole)) {
      return ['member', 'moderator', 'admin'].includes(targetRole);
    }

    return false;
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

  // Tab content components with animations
  const MemberManagementTab = () => (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit={{ opacity: 0, y: 20 }}
    >
      {isLoading ? (
        // Loading skeleton
        <Box sx={{ mt: 2 }}>
          {[1, 2, 3].map((item) => (
            <Box key={item} sx={{ mb: 3 }}>
              <Skeleton variant="text" width="60%" height={28} sx={{ mb: 1 }} />
              <Skeleton variant="text" width="40%" height={20} />
              <Skeleton variant="rectangular" width="100%" height={60} sx={{ mt: 2, borderRadius: 1 }} />
            </Box>
          ))}
        </Box>
      ) : (
        // Member management content
        <>
          <motion.div variants={itemVariants}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>Member Roles</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Assign roles to members to grant them different permissions
              </Typography>
              
              <Box sx={{ 
                p: 2, 
                bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                borderRadius: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <PeopleIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
                  <Typography>{timelineData?.memberCount || 0} Members</Typography>
                </Box>
                <Button variant="outlined" size="small">Manage Roles</Button>
              </Box>
            </Box>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>Pending Requests</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Review and approve membership requests
              </Typography>
              
              <Box sx={{ 
                p: 2, 
                bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                borderRadius: 1,
                textAlign: 'center'
              }}>
                <Typography variant="body2" color="text.secondary">
                  No pending membership requests
                </Typography>
              </Box>
            </Box>
          </motion.div>
          
          <motion.div variants={itemVariants}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>Community Members</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Manage community members and their roles
              </Typography>
              
              <Paper 
                elevation={0} 
                sx={{ 
                  bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                  borderRadius: 2,
                  overflow: 'hidden'
                }}
              >
                {/* Member management tabs */}
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                  <Tabs 
                    value={memberTabValue} 
                    onChange={handleMemberTabChange}
                    variant="fullWidth"
                    sx={{ 
                      minHeight: 48,
                      '& .MuiTab-root': {
                        minHeight: 48,
                        py: 1.5
                      }
                    }}
                  >
                    <Tab 
                      label={<Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <PeopleIcon sx={{ mr: 1, fontSize: '1.1rem' }} />
                        <Typography variant="button" sx={{ fontWeight: memberTabValue === 0 ? 'bold' : 'normal' }}>
                          Active Members ({members.length})
                        </Typography>
                      </Box>} 
                      sx={{ textTransform: 'none' }}
                    />
                    <Tab 
                      label={<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <HourglassEmptyIcon sx={{ fontSize: '1.1rem' }} />
                        <Typography variant="button" sx={{ fontWeight: memberTabValue === 1 ? 'bold' : 'normal' }}>
                          Pending Requests
                        </Typography>
                        {pendingMembers.length > 0 && (
                          <Chip 
                            label={pendingMembers.length} 
                            size="small" 
                            sx={{ 
                              height: 20,
                              minWidth: 20,
                              fontSize: '0.7rem',
                              fontWeight: 'bold',
                              bgcolor: 'warning.main',
                              color: 'white',
                              '& .MuiChip-label': { px: 0.75 }
                            }} 
                          />
                        )}
                      </Box>} 
                      sx={{ textTransform: 'none' }}
                    />
                    <Tab 
                      label={<Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <DeleteOutlineIcon sx={{ mr: 1, fontSize: '1.1rem' }} />
                        <Typography variant="button" sx={{ fontWeight: memberTabValue === 2 ? 'bold' : 'normal' }}>
                          Blocked Users ({blockedMembers.length})
                        </Typography>
                      </Box>} 
                      sx={{ textTransform: 'none' }}
                    />
                  </Tabs>
                </Box>
                
                {/* Active Members Tab */}
                {memberTabValue === 0 && (
                  <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
                    {loading ? (
                      // Loading skeleton
                      Array.from({ length: 3 }).map((_, index) => (
                        <Box key={index} sx={{ mb: 1 }}>
                          <Skeleton variant="rectangular" height={80} sx={{ borderRadius: 2 }} />
                        </Box>
                      ))
                    ) : members.length === 0 ? (
                      <Box sx={{ textAlign: 'center', py: 4 }}>
                        <Typography variant="body1" color="text.secondary">
                          No active members found
                        </Typography>
                      </Box>
                    ) : (
                      members.map((member, index) => (
                        <motion.div
                          key={member.id || member.user_id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              p: 2,
                              borderRadius: 2,
                              backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
                              border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
                              mb: 1,
                              '&:hover': {
                                backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'
                              }
                            }}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                              <UserAvatar
                                name={member.username || member.name}
                                avatarUrl={member.avatar_url || member.avatar}
                                id={member.user_id || member.userId}
                                size={48}
                                userColor={member.user_color}
                                sx={{ mr: 2 }}
                              />
                              <Box>
                                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                  {displayUsername(member.username || member.name) || 'Unknown User'}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  Joined {member.joined_at ? new Date(member.joined_at).toLocaleDateString() : 'Unknown'}
                                </Typography>
                              </Box>
                            </Box>
                            

                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Chip
                                label={member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                                size="small"
                                sx={{
                                  backgroundColor: getRoleColor(member.role).bg,
                                  color: getRoleColor(member.role).text,
                                  fontWeight: 600,
                                  border: 'none'
                                }}
                              />
                              

                              {/* Role management buttons: Promote / Demote (one-step, no jumping) */}
                              {/* Only Admins (and above) can promote/demote; Moderators cannot */}
                              {(() => {
                                const uid = member.userId ?? member.user_id ?? member.id;
                                const isSelf = currentUserId && Number(currentUserId) === Number(uid);
                                const isSiteOwner = Number(uid) === 1 || (member.role || '').toLowerCase() === 'siteowner';
                                const nextRole = getNextRole(member.role);
                                const prevRole = getPrevRole(member.role);
                                const normalizedUserRole = (userRole || '').toLowerCase();
                                const canChangeRoles = ['admin', 'creator', 'siteowner'].includes(normalizedUserRole);
                                return (
                                  <>
                                    {canChangeRoles && !isSelf && !isSiteOwner && nextRole && (
                                      <IconButton
                                        size="small"
                                        onClick={() => performRoleChange(member, 'promote')}
                                        sx={{ color: 'info.main' }}
                                        title={`Promote to ${nextRole.charAt(0).toUpperCase() + nextRole.slice(1)}`}
                                      >
                                        <ModeratorIcon fontSize="small" />
                                      </IconButton>
                                    )}
                                    {canChangeRoles && !isSelf && !isSiteOwner && prevRole && (
                                      <IconButton
                                        size="small"
                                        onClick={() => performRoleChange(member, 'demote')}
                                        sx={{ color: 'warning.main' }}
                                        title={`Demote to ${prevRole.charAt(0).toUpperCase() + prevRole.slice(1)}`}
                                      >
                                        <PersonRemoveIcon fontSize="small" />
                                      </IconButton>
                                    )}
                                  </>
                                );
                              })()}

                              {member.role !== 'SiteOwner' && (
                                <>
                                  {canRemoveMember(userRole, currentUserId, member, timelineData) && (
                                    <IconButton
                                      size="small"
                                      onClick={() => handleOpenConfirmDialog(member, 'remove')}
                                      sx={{ color: 'error.main' }}
                                      title="Remove Member"
                                    >
                                      <PersonRemoveIcon fontSize="small" />
                                    </IconButton>
                                  )}

                                  {/* Block button: hide for self and SiteOwner; use red crossed circle icon */}
                                  {(() => {
                                    const uid = member.userId ?? member.user_id ?? member.id;
                                    const isSelf = currentUserId && Number(currentUserId) === Number(uid);
                                    const isSiteOwner = Number(uid) === 1 || (member.role || '').toLowerCase() === 'siteowner';
                                    return !isSelf && !isSiteOwner;
                                  })() && (
                                    <IconButton
                                      size="small"
                                      onClick={() => handleOpenConfirmDialog(member, 'block')}
                                      sx={{ color: 'warning.main' }}
                                      title="Block Member"
                                    >
                                      <BlockIcon fontSize="small" />
                                    </IconButton>
                                  )}
                                </>
                              )}
                            </Box>
                          </Box>
                        </motion.div>
                      ))
                    )
                  }
                  </Box>
                )}
                
                {/* Pending Requests Tab */}
                {memberTabValue === 1 && (
                  <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
                    {pendingMembers.length === 0 ? (
                      <Box sx={{ p: 3, textAlign: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                          No pending membership requests
                        </Typography>
                      </Box>
                    ) : (
                      <>
                        {/* Accept All Button */}
                        <Box sx={{ 
                          p: 2, 
                          borderBottom: '1px solid',
                          borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                          display: 'flex',
                          justifyContent: 'flex-end'
                        }}>
                          <Button
                            variant="contained"
                            color="success"
                            size="small"
                            startIcon={<CheckCircleIcon />}
                            onClick={async () => {
                              try {
                                // Approve all pending members
                                await Promise.all(
                                  pendingMembers.map(member => 
                                    approvePendingMember(timelineId, member.user_id || member.id)
                                  )
                                );
                                showSnackbar(`Approved ${pendingMembers.length} member${pendingMembers.length > 1 ? 's' : ''}`, 'success');
                                // Reload both pending and active members
                                await Promise.all([loadPendingMembers(), loadMembers()]);
                                // Switch to Active Members tab
                                setMemberTabValue(0);
                              } catch (error) {
                                console.error('Error approving all members:', error);
                                showSnackbar('Failed to approve all members', 'error');
                              }
                            }}
                            sx={{ fontWeight: 'bold' }}
                          >
                            Accept All ({pendingMembers.length})
                          </Button>
                        </Box>
                        
                        {pendingMembers.map((member) => (
                          <Box 
                            key={member.id}
                            sx={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'space-between',
                              p: 2,
                              borderBottom: '1px solid',
                              borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                              '&:last-child': {
                                borderBottom: 'none'
                              },
                              '&:hover': {
                                bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)'
                              },
                              transition: 'background-color 0.2s ease'
                            }}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                              <UserAvatar
                                name={member.name}
                                avatarUrl={member.avatar}
                                id={member.userId || member.id}
                                size={48}
                                userColor={member.user_color}
                                sx={{ mr: 2 }}
                              />
                              <Box>
                                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                  {displayUsername(member.name)}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  Requested {new Date(member.requestDate).toLocaleDateString()}
                                </Typography>
                              </Box>
                            </Box>
                            
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <IconButton 
                                size="small" 
                                color="success"
                                onClick={() => handleOpenConfirmDialog(member, 'approve')}
                                title="Approve request"
                                sx={{ 
                                  '&:hover': {
                                    bgcolor: 'rgba(46, 125, 50, 0.1)'
                                  }
                                }}
                              >
                                <CheckCircleIcon />
                              </IconButton>
                              <IconButton 
                                size="small" 
                                color="error"
                                onClick={() => handleOpenConfirmDialog(member, 'deny')}
                                title="Deny request"
                                sx={{ 
                                  '&:hover': {
                                    bgcolor: 'rgba(211, 47, 47, 0.1)'
                                  }
                                }}
                              >
                                <CancelIcon />
                              </IconButton>
                            </Box>
                          </Box>
                        ))}
                      </>
                    )}
                  </Box>
                )}
                
                {/* Blocked Members Tab */}
                {memberTabValue === 2 && (
                  <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
                    {blockedMembers.length === 0 ? (
                      <Box sx={{ p: 3, textAlign: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                          No blocked users
                        </Typography>
                      </Box>
                    ) : (
                      blockedMembers.map((member) => (
                        <Box 
                          key={member.id}
                          sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            p: 2,
                            borderBottom: '1px solid',
                            borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                            '&:last-child': {
                              borderBottom: 'none'
                            },
                            '&:hover': {
                              bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)'
                            },
                            transition: 'background-color 0.2s ease'
                          }}
                        >
                          <UserAvatar
                            name={member.name}
                            avatarUrl={member.avatar}
                            id={member.userId || member.id}
                            size={48}
                            userColor={member.user_color}
                            sx={{
                              mr: 2,
                              filter: 'grayscale(100%)',
                              opacity: 0.7,
                              border: '2px solid',
                              borderColor: theme.palette.mode === 'dark' ? 'rgba(255,0,0,0.3)' : 'rgba(211,47,47,0.3)'
                            }}
                          />
                          <Box sx={{ flexGrow: 1 }}>
                            <Typography variant="subtitle1" sx={{ 
                              display: 'flex',
                              alignItems: 'center',
                              color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)'
                            }}>
                              {member.name}
                              <Chip 
                                label="Blocked"
                                size="small"
                                sx={{ 
                                  ml: 1,
                                  bgcolor: theme.palette.mode === 'dark' ? 'rgba(211,47,47,0.2)' : 'rgba(211,47,47,0.1)',
                                  color: theme.palette.error.main,
                                  fontSize: '0.7rem',
                                  height: 20
                                }}
                              />
                            </Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', mt: 0.5 }}>
                              <Typography variant="caption" color="text.secondary">
                                Blocked on {new Date(member.blockedDate).toLocaleDateString()}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                Reason: {member.reason}
                              </Typography>
                            </Box>
                          </Box>
                          
                          <IconButton 
                            size="small" 
                            color="primary"
                            onClick={() => handleOpenConfirmDialog(member, 'unblock')}
                            title="Unblock user"
                            sx={{ 
                              ml: 1,
                              '&:hover': {
                                bgcolor: 'rgba(25, 118, 210, 0.1)'
                              }
                            }}
                          >
                            <Typography variant="button" sx={{ fontSize: '0.7rem', fontWeight: 'bold' }}>
                              UNBLOCK
                            </Typography>
                          </IconButton>
                        </Box>
                      ))
                    )}
                  </Box>
                )}
              </Paper>
            </Box>
          </motion.div>
        </>
      )}
    </motion.div>
  );

  // SettingsTab is defined as a standalone component at the bottom of this file

  // While access is loading, show a modern skeleton to avoid flashing admin UI
  if (accessLoading) {
    return (
      <Box sx={{ maxWidth: 1200, mx: 'auto', px: 2, py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 3 }}>
          <Skeleton variant="text" width={260} height={36} />
        </Box>
        <Box sx={{ mb: 2 }}>
          <Skeleton variant="rectangular" height={40} sx={{ borderRadius: 2 }} />
        </Box>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
          {[1,2,3,4].map((i) => (
            <Box key={i}>
              <Skeleton variant="text" width="60%" height={28} sx={{ mb: 1 }} />
              <Skeleton variant="text" width="40%" height={20} />
              <Skeleton variant="rectangular" height={120} sx={{ mt: 1.5, borderRadius: 2 }} />
            </Box>
          ))}
        </Box>
      </Box>
    );
  }

  // Early guard: show lock view to non-members/non-privileged roles
  if (!accessLoading && (!isMember || !['moderator','admin','creator','siteowner'].includes((userRole || '').toLowerCase()))) {
    return (
      <CommunityLockView 
        title="Admin tools restricted"
        description="You're not a moderator or admin of this community. Please go to the timeline page to join or request access."
        timelineId={id}
      />
    );
  }

  const adminCoverImageUrl = String(timelineData?.coverLandscapeImageUrl || '').trim();
  const adminCoverEnabled = timelineData?.coverUploadEnabled !== false;
  const adminFallbackGradient = theme.palette.mode === 'dark'
    ? 'linear-gradient(135deg, rgba(13,36,63,0.86) 0%, rgba(20,48,92,0.9) 40%, rgba(65,34,106,0.86) 100%)'
    : 'linear-gradient(135deg, rgba(250,232,242,0.94) 0%, rgba(246,232,220,0.96) 68%, rgba(252,238,224,0.98) 100%)';

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', px: 2, pb: 4 }}>
      {/* Timeline hero banner */}
      {timelineData && (
        <Box
          sx={{
            mb: 3,
            mt: 2,
            minHeight: { xs: 96, md: 120 },
            aspectRatio: '8 / 1',
            borderRadius: 2.25,
            border: '1px solid',
            borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.18)' : 'rgba(15,23,42,0.14)',
            boxShadow: theme.palette.mode === 'dark'
              ? '0 12px 24px rgba(2,6,23,0.45), 0 0 0 1px rgba(255,255,255,0.06)'
              : '0 12px 24px rgba(15,23,42,0.16), 0 0 0 1px rgba(15,23,42,0.08)',
            overflow: 'hidden',
            position: 'relative',
            display: 'flex',
            alignItems: 'flex-end',
            px: { xs: 2, md: 3 },
            pb: { xs: 1.5, md: 2 },
            background: adminCoverImageUrl
              ? 'transparent'
              : adminFallbackGradient,
          }}
        >
          {adminCoverImageUrl ? (
            <Box
              component="img"
              src={adminCoverImageUrl}
              alt={`${timelineData.name} cover`}
              sx={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                objectPosition: '50% 50%',
                filter: adminCoverEnabled
                  ? 'brightness(1.05) saturate(1.04)'
                  : 'blur(18px) saturate(0.42)',
                transform: `translate(${(Number(timelineData?.coverLandscapeX ?? 50) - 50) * 0.9}%, ${(Number(timelineData?.coverLandscapeY ?? 50) - 50) * 0.9}%) scale(${adminCoverEnabled ? (Number(timelineData?.coverZoom ?? 1) || 1) : ((Number(timelineData?.coverZoom ?? 1) || 1) + 0.08)})`,
              }}
            />
          ) : null}
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(180deg, rgba(2,6,23,0.08) 0%, rgba(2,6,23,0.42) 100%)',
            }}
          />
          <Typography
            variant="h5"
            component="h1"
            sx={{
              position: 'relative',
              zIndex: 1,
              fontWeight: 700,
              color: '#fff',
              textShadow: '0 2px 10px rgba(0,0,0,0.32)',
            }}
          >
            <Box component="span" sx={{ fontFamily: 'Lobster, cursive', color: '#ffe082' }}>i</Box>
            <Box component="span" sx={{ color: '#ffe082', ml: '0.16em', mr: 0.5 }}>-</Box>
            {timelineData.name}
          </Typography>
        </Box>
      )}
      
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        {/* Remove Member Confirmation Dialog */}
        <Dialog
          open={confirmDialogOpen}
          onClose={handleCloseConfirmDialog}
          aria-labelledby="remove-member-dialog-title"
          aria-describedby="remove-member-dialog-description"
        >
          <DialogTitle id="remove-member-dialog-title">
            Remove {displayUsername(selectedMember?.username || selectedMember?.name)} from community?
          </DialogTitle>
          <DialogContent>
            <DialogContentText id="remove-member-dialog-description">
              This action will remove {selectedMember?.name} from this community timeline. 
              They will no longer have access to community content or be able to participate 
              in community activities. This action cannot be undone.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseConfirmDialog} color="primary">
              Cancel
            </Button>
            <Button 
              onClick={handleRemoveMember} 
              color="error" 
              variant="contained"
              startIcon={<DeleteOutlineIcon />}
            >
              Remove Member
            </Button>
          </DialogActions>
        </Dialog>
        
        {/* Block Member Confirmation Dialog */}
        <Dialog
          open={confirmBlockDialogOpen}
          onClose={handleCloseConfirmDialog}
          aria-labelledby="block-member-dialog-title"
          aria-describedby="block-member-dialog-description"
        >
          <DialogTitle id="block-member-dialog-title">
            Block {displayUsername(selectedMember?.username || selectedMember?.name)} from community?
          </DialogTitle>
          <DialogContent>
            <DialogContentText id="block-member-dialog-description">
              This action will remove {selectedMember?.name} from this community timeline and add them to the blocked list. 
              They will no longer have access to community content and will not be able to rejoin without admin approval.
              You can unblock them later if needed.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseConfirmDialog} color="primary">
              Cancel
            </Button>
            <Button 
              onClick={handleBlockMember} 
              color="error" 
              variant="contained"
              startIcon={<PersonRemoveIcon />}
            >
              Block Member
            </Button>
          </DialogActions>
        </Dialog>
        
        {/* Unblock Member Confirmation Dialog */}
        <Dialog
          open={confirmUnblockDialogOpen}
          onClose={handleCloseConfirmDialog}
          aria-labelledby="unblock-member-dialog-title"
          aria-describedby="unblock-member-dialog-description"
        >
          <DialogTitle id="unblock-member-dialog-title">
            Unblock {displayUsername(selectedMember?.username || selectedMember?.name)}?
          </DialogTitle>
          <DialogContent>
            <DialogContentText id="unblock-member-dialog-description">
              This action will unblock {selectedMember?.name} and add them back to the community as a regular member. 
              They will regain access to community content and be able to participate in community activities.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseConfirmDialog} color="primary">
              Cancel
            </Button>
            <Button 
              onClick={handleUnblockMember} 
              color="primary" 
              variant="contained"
            >
              Unblock Member
            </Button>
          </DialogActions>
        </Dialog>
        
        <Paper 
          elevation={2} 
          sx={{ 
            p: 3, 
            mt: 2, 
            borderRadius: 2,
            background: timelineSurfaces.panel,
            border: `1px solid ${timelineSurfaces.panelBorder}`,
            backdropFilter: timelineSurfaces.panelBlur,
            overflow: 'hidden'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <SecurityIcon sx={{ mr: 1, color: 'error.main' }} />
            <Typography variant="h5" component="h1">
              Admin Panel
            </Typography>
          </Box>
          <Divider sx={{ my: 2 }} />
          
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            sx={{ mb: 3 }}
            TabIndicatorProps={{
              style: {
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
              }
            }}
          >
            <Tab 
              label="Manage Members" 
              icon={<PeopleIcon />} 
              iconPosition="start"
              sx={{ 
                transition: 'all 0.3s ease',
                minHeight: 48,
                '&.Mui-selected': {
                  fontWeight: 'bold'
                }
              }}
            />
            <Tab 
              label="Manage Posts" 
              icon={<ForumIcon />} 
              iconPosition="start"
              sx={{ 
                transition: 'all 0.3s ease',
                minHeight: 48,
                '&.Mui-selected': {
                  fontWeight: 'bold'
                }
              }}
            />
            <Tab 
              label="Cards" 
              icon={<InfoIcon />} 
              iconPosition="start"
              sx={{ 
                transition: 'all 0.3s ease',
                minHeight: 48,
                '&.Mui-selected': {
                  fontWeight: 'bold'
                }
              }}
            />
            {/* Settings tab: Admin-only access */}
            {['admin', 'creator', 'siteowner'].includes((userRole || '').toLowerCase()) && (
              <Tab
                label="Settings"
                icon={<SettingsIcon />}
                iconPosition="start"
                sx={{
                  transition: 'all 0.3s ease',
                  minHeight: 48,
                  '&.Mui-selected': {
                    fontWeight: 'bold'
                  }
                }}
              />
            )}
          </Tabs>
          
          <Box sx={{ p: 1 }}>
            <AnimatePresence mode="wait">
              {tabValue === 0 && (
                <StandaloneMemberManagementTab 
                  key="members" 
                  timelineId={id} 
                  userRole={userRole} 
                  currentUserId={currentUserId} 
                  timelineData={timelineData}
                />
              )}
              {tabValue === 1 && <ManagePostsTab key="posts" timelineId={id} />}
              {tabValue === 2 && (
                <CardsTab
                  key="cards"
                  id={id}
                  onTimelineUpdated={handleTimelineUpdated}
                  onSettingsSaveFabVisibilityChange={setSettingsSaveFabVisible}
                />
              )}
              {tabValue === 3 && ['admin', 'creator', 'siteowner'].includes((userRole || '').toLowerCase()) && (
                <SettingsTab
                  key="settings"
                  id={id}
                  mode="timeline"
                  onTimelineUpdated={handleTimelineUpdated}
                  onSaveFabVisibilityChange={setSettingsSaveFabVisible}
                />
              )}
              {tabValue === 3 && !['admin', 'creator', 'siteowner'].includes((userRole || '').toLowerCase()) && (
                <Box sx={{ p: 4, textAlign: 'center' }}>
                  <SecurityIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    Admin Access Required
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Only timeline administrators can access Settings.
                  </Typography>
                </Box>
              )}
            </AnimatePresence>
          </Box>
        </Paper>
      </motion.div>

      <NavFab
        timelineId={id}
        pathname={location.pathname}
        expanded={communityFabExpanded}
        onToggleExpanded={() => setCommunityFabExpanded((prev) => !prev)}
        onCollapse={() => setCommunityFabExpanded(false)}
        onNavigate={handleCommunityNavigate}
        bottom={communityFabBottom}
        right={32}
        showReport={false}
        showCreate={false}
        showMembersNav={isMember === true}
        showAdminNav={['moderator', 'admin', 'creator', 'siteowner'].includes(String(userRole || '').toLowerCase())}
        mainTooltipClosed="Show Event Options"
        mainTooltipOpen="Hide Options"
      />
    </Box>
  );
};

const CardsTab = ({ id, onTimelineUpdated, onSettingsSaveFabVisibilityChange }) => {
  const [cardsTabValue, setCardsTabValue] = useState(0);

  return (
    <Box sx={{ py: 1 }}>
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
        <Tabs
          orientation="vertical"
          value={cardsTabValue}
          onChange={(_event, newValue) => setCardsTabValue(newValue)}
          sx={{
            minWidth: 220,
            borderRight: '1px solid',
            borderColor: 'divider',
            '& .MuiTab-root': {
              alignItems: 'flex-start',
              textAlign: 'left',
              minHeight: 44,
            },
          }}
        >
          <Tab label="Info Cards" icon={<InfoIcon />} iconPosition="start" />
          <Tab label="Status Cards" icon={<CommentIcon />} iconPosition="start" />
          <Tab label="Quote Card" icon={<NewspaperIcon />} iconPosition="start" />
          <Tab label="Action Cards" icon={<VolunteerActivismRoundedIcon />} iconPosition="start" />
        </Tabs>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <AnimatePresence mode="wait">
            {cardsTabValue === 0 && <InfoCardsTab key="cards-info" timelineId={id} />}
            {cardsTabValue === 1 && (
              <SettingsTab
                key="cards-status"
                id={id}
                mode="status"
                onTimelineUpdated={onTimelineUpdated}
                onSaveFabVisibilityChange={onSettingsSaveFabVisibilityChange}
              />
            )}
            {cardsTabValue === 2 && (
              <SettingsTab
                key="cards-quote"
                id={id}
                mode="quote"
                onTimelineUpdated={onTimelineUpdated}
                onSaveFabVisibilityChange={onSettingsSaveFabVisibilityChange}
              />
            )}
            {cardsTabValue === 3 && (
              <SettingsTab
                key="cards-actions"
                id={id}
                mode="actions"
                onTimelineUpdated={onTimelineUpdated}
                onSaveFabVisibilityChange={onSettingsSaveFabVisibilityChange}
              />
            )}
          </AnimatePresence>
        </Box>
      </Box>
    </Box>
  );
};

const ManagePostsTab = ({ timelineId }) => {
  const theme = useTheme();
  const [isPrivate, setIsPrivate] = useState(false);
  const [requireMembershipApproval, setRequireMembershipApproval] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [confirmPostActionDialogOpen, setConfirmPostActionDialogOpen] = useState(false);
  const [postActionType, setPostActionType] = useState(''); // 'escalate' or 'safeguard'
  // Mandatory verdict text for safeguard
  const [actionVerdict, setActionVerdict] = useState('');
  const [safeguardDays, setSafeguardDays] = useState('7');
  const [escalationType, setEscalationType] = useState('edit');
  const [escalationSummary, setEscalationSummary] = useState('');
  const [eventPopupOpen, setEventPopupOpen] = useState(false);
  const [popupEvent, setPopupEvent] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editDialogEvent, setEditDialogEvent] = useState(null);
  const [editDialogSubmitting, setEditDialogSubmitting] = useState(false);
  // Remove-from-community verdict dialog state
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [removeVerdict, setRemoveVerdict] = useState('');
  const [removeSubmitting, setRemoveSubmitting] = useState(false);
  // Snackbars for Manage Posts
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [postTabValue, setPostTabValue] = useState(0);

  // Helper: if EventPopup is open for this event, refresh it from backend so chips reflect latest associations
  const refreshPopupEventIfOpen = async (eventId) => {
    try {
      if (!eventPopupOpen || !eventId || !timelineId) return;
      const res = await api.get(`/api/v1/events/${eventId}`);
      if (res?.data && res.data.id) {
        setPopupEvent(res.data);
      }
    } catch (e) {
      console.warn('[ManagePostsTab] Failed to refresh popup event after action:', e);
    }
  };
  
  // Real data for reported posts (wired to /api/v1/timelines/:id/reports)
  const [reportedPosts, setReportedPosts] = useState([]);
  const [isLoadingReports, setIsLoadingReports] = useState(true);
  const [counts, setCounts] = useState({ all: 0, pending: 0, reviewing: 0, resolved: 0 });
  const [pageInfo, setPageInfo] = useState({ page: 1, page_size: 20, total: 0 });
  
  // Track reviewing event IDs for "In Review" badge in EventPopup
  const [reviewingEventIds, setReviewingEventIds] = useState(new Set());
  
  // Handle post tab change
  const handlePostTabChange = (event, newValue) => {
    setPostTabValue(newValue);
  };
  
  // Handle opening the confirmation dialog for different post actions
  const handleOpenPostActionDialog = (post, action) => {
    setSelectedPost(post);
    setPostActionType(action);
    setActionVerdict('');
    setSafeguardDays('7');
    setEscalationType('edit');
    setEscalationSummary('');
    setConfirmPostActionDialogOpen(true);
  };

  // Open remove-from-community dialog with mandatory verdict
  const handleOpenRemoveDialog = (post) => {
    setSelectedPost(post);
    setRemoveVerdict('');
    setRemoveDialogOpen(true);
  };
  
  // Handle closing the confirmation dialog
  const handleClosePostActionDialog = () => {
    setConfirmPostActionDialogOpen(false);
    setSelectedPost(null);
    setPostActionType('');
    setActionVerdict('');
    setSafeguardDays('7');
    setEscalationType('edit');
    setEscalationSummary('');
  };

  const handleCloseRemoveDialog = () => {
    setRemoveDialogOpen(false);
    setSelectedPost(null);
    setRemoveVerdict('');
    setRemoveSubmitting(false);
  };

  // Open EventPopup overlay for investigation
  const handleViewEvent = async (post) => {
    try {
      if (!post?.eventId || !timelineId) return;
      // Fetch only the relevant event (optimization)
      const res = await api.get(`/api/v1/events/${post.eventId}`);
      const ev = res?.data;
      if (ev && ev.id) {
        setPopupEvent(ev);
        setEventPopupOpen(true);
      } else {
        console.warn('[ManagePostsTab] Event not found for id', post.eventId);
      }
    } catch (e) {
      console.warn('[ManagePostsTab] Failed to load event for popup:', e);
    }
  };

  const handleOpenEventEdit = async (event) => {
    try {
      if (!event?.id) return;
      // Use direct event endpoint (not timeline-scoped) to support editing tagged events from foreign timelines
      const res = await api.get(`/api/v1/events/${event.id}`);
      const canonicalEvent = res?.data;
      if (!canonicalEvent?.id) {
        setSnackbarMessage('Unable to open editor for this event');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
        return;
      }

      if (canonicalEvent?.edit_permissions && canonicalEvent.edit_permissions.can_edit === false) {
        setSnackbarMessage('You do not have permission to edit this event');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
        return;
      }

      setEditDialogEvent(canonicalEvent);
      setEditDialogOpen(true);
    } catch (e) {
      console.warn('[ManagePostsTab] Failed to load event for edit:', e);
      setSnackbarMessage('Failed to load event editor');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  const handleCloseEventEdit = () => {
    setEditDialogOpen(false);
    setEditDialogEvent(null);
    setEditDialogSubmitting(false);
  };

  const handleSubmitEventEdit = async (eventData) => {
    try {
      if (!editDialogEvent?.id || !timelineId) return;
      setEditDialogSubmitting(true);

      // Filter to only fields accepted by backend patchSchema
      const allowedFields = [
        'title', 'description', 'content_json', 'event_date', 'raw_event_date',
        'url', 'url_title', 'url_description', 'url_image',
        'media_key', 'media_type', 'media_subtype', 'is_exact_user_time', 'edit_locked'
      ];
      const patchPayload = {};
      for (const key of allowedFields) {
        if (Object.prototype.hasOwnProperty.call(eventData, key)) {
          patchPayload[key] = eventData[key];
        }
      }

      const response = await api.patch(`/api/v1/events/${editDialogEvent.id}`, patchPayload);
      const updatedEvent = response?.data;
      if (updatedEvent?.id) {
        setPopupEvent(updatedEvent);
      } else {
        await refreshPopupEventIfOpen(editDialogEvent.id);
      }

      handleCloseEventEdit();
      await fetchReports();
      setSnackbarMessage('Event updated successfully');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (e) {
      const violations = Array.isArray(e?.response?.data?.violations)
        ? e.response.data.violations
        : [];
      if (violations.length > 0) {
        const first = violations[0];
        const reason = first?.reason ? String(first.reason).replace(/_/g, ' ') : 'update blocked by policy';
        setSnackbarMessage(`Edit blocked: ${reason}`);
      } else {
        setSnackbarMessage(e?.response?.data?.error || 'Failed to update event');
      }
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      setEditDialogSubmitting(false);
    }
  };
  
  // Fetch counts for all tabs (called on mount to show proper tab badges)
  const fetchReportCounts = React.useCallback(async () => {
    if (!timelineId) return;
    try {
      const data = await listReports(timelineId, { status: 'all', page: 1, page_size: 1 });
      setCounts(data?.counts || { all: 0, pending: 0, reviewing: 0, resolved: 0 });
    } catch (e) {
      console.warn('[ManagePostsTab] fetchReportCounts failed:', e);
    }
  }, [timelineId]);

  // Extracted: Load reports from backend; callable from actions
  const fetchReports = React.useCallback(async () => {
    if (!timelineId) return;
    try {
      setIsLoadingReports(true);
      const status = postTabValue === 0 ? 'pending' : postTabValue === 1 ? 'reviewing' : 'resolved';
      const data = await listReports(timelineId, { status, page: 1, page_size: 20 });
      // Normalize items into the structure used below
      const items = Array.isArray(data?.items) ? data.items : [];
      
      // Fetch event details for each report to get the actual event type
      // Since backend doesn't include event_type in reports response
      const mappedPromises = items.map(async (it) => {
        let displayType = 'Post';
        
        // Try to fetch the event details to get the type
        if (it.event_id) {
          try {
            const eventRes = await api.get(`/api/v1/events/${it.event_id}`);
            const event = eventRes?.data;
            
            if (event) {
              // Check media_type first for image/video/audio icons
              if (event.media_type) {
                const mediaType = String(event.media_type).toLowerCase();
                if (mediaType === 'image') displayType = 'Image';
                else if (mediaType === 'video') displayType = 'Video';
                else if (mediaType === 'audio') displayType = 'Audio';
                else displayType = mediaType.charAt(0).toUpperCase() + mediaType.slice(1);
              } else if (event.type) {
                const type = String(event.type).toLowerCase();
                if (type === 'remark') displayType = 'Remark';
                else if (type === 'news') displayType = 'News';
                else if (type === 'media') displayType = 'Media';
                else displayType = event.type.charAt(0).toUpperCase() + event.type.slice(1);
              }
            }
          } catch (err) {
            console.warn('[ManagePostsTab] Failed to fetch event type for event', it.event_id, err);
          }
        }
        
        return {
          id: it.id || it.report_id || String(Math.random()),
          eventType: displayType,
          status: it.status || 'pending',
          reportDate: it.reported_at || it.created_at || it.reportDate || '',
          eventId: it.event_id,
          reporter: it.reporter || {
            id: it.reporter_id,
            name: it.reporter_username || 'Reporter',
            avatar: it.reporter_avatar_url || null,
          },
          reason: it.reason || '',
          assignedModerator: it.assigned_to ? { 
            id: it.assigned_to, 
            name: it.assigned_to_username || it.assigned_to_name || 'Moderator', 
            avatar: it.assigned_to_avatar_url || null,
          } : null,
          resolution: it.resolution || null,
          verdict: it.verdict || '',
          safeUntil: it.safe_until || null,
          reportId: it.id || it.report_id
        };
      });
      
      const mapped = await Promise.all(mappedPromises);
      setReportedPosts(mapped);
      setCounts(data?.counts || { all: mapped.length, pending: mapped.filter(p=>p.status==='pending').length, reviewing: mapped.filter(p=>p.status==='reviewing').length, resolved: mapped.filter(p=>p.status==='resolved').length });
      setPageInfo({ page: data?.page || 1, page_size: data?.page_size || 20, total: data?.total || mapped.length });
      
      // Extract event IDs that are in "reviewing" status for the "In Review" badge
      const reviewingIds = new Set(
        items.filter(it => it.status === 'reviewing').map(it => it.event_id).filter(Boolean)
      );
      console.log('[ManagePostsTab] Reviewing event IDs:', Array.from(reviewingIds));
      setReviewingEventIds(reviewingIds);
    } catch (e) {
      console.warn('[ManagePostsTab] listReports failed (showing empty):', e);
      setReportedPosts([]);
      setCounts({ all: 0, pending: 0, reviewing: 0, resolved: 0 });
      setPageInfo({ page: 1, page_size: 20, total: 0 });
      setReviewingEventIds(new Set());
    } finally {
      setIsLoadingReports(false);
    }
  }, [timelineId, postTabValue]);

  // Load on mount and when tab changes
  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // Fetch counts for all tabs on mount (for tab badges)
  useEffect(() => {
    fetchReportCounts();
  }, [fetchReportCounts]);

  // Handle accepting a report for review
  const handleAcceptReport = async (post) => {
    try {
      await acceptReport(timelineId, post.reportId || post.id);
      // Re-fetch reports directly for correctness
      await fetchReports();
      await fetchReportCounts();
      setSnackbarMessage('Report accepted for review');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (e) {
      console.warn('[ManagePostsTab] acceptReport failed:', e);
      setSnackbarMessage(e?.response?.data?.error || 'Failed to accept report');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };
  
  // Handle deleting a reported post
  const handleEscalateReport = async () => {
    try {
      const reportId = selectedPost?.reportId || selectedPost?.id;
      if (!reportId) return;
      await escalateReport(timelineId, reportId, escalationType, escalationSummary.trim());
      setConfirmPostActionDialogOpen(false);
      await fetchReports();
      await fetchReportCounts();
      setSnackbarMessage('The report ticket was sent to administration');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (e) {
      console.warn('[ManagePostsTab] escalateReport failed:', e);
      setSnackbarMessage(e?.response?.data?.error || 'Failed to escalate report');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };
  
  // Handle safeguarding a post
  const handleSafeguardPost = async () => {
    try {
      if (!actionVerdict.trim()) return;
      await resolveReport(timelineId, selectedPost?.reportId || selectedPost?.id, 'safeguard', actionVerdict.trim(), { safeguard_days: Number(safeguardDays || 7) });
      setConfirmPostActionDialogOpen(false);
      await fetchReports();
      await fetchReportCounts();
      setSnackbarMessage('Resolved: action=safeguard');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (e) {
      console.warn('[ManagePostsTab] resolveReport(safeguard) failed:', e);
      setConfirmPostActionDialogOpen(false);
      setSnackbarMessage(e?.response?.data?.error || 'Failed to resolve (safeguard)');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  // Handle remove-from-community with mandatory verdict
  const handleConfirmRemoveFromCommunity = async () => {
    try {
      if (!removeVerdict || !String(removeVerdict).trim()) return;
      setRemoveSubmitting(true);
      await resolveReport(timelineId, selectedPost?.reportId || selectedPost?.id, 'remove', removeVerdict.trim());
      setRemoveDialogOpen(false);
      // Refresh the list of reports immediately
      await fetchReports();
      await fetchReportCounts();
      setSnackbarMessage('Resolved: action=remove');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      // Also refresh the popup event if it's currently open so TagList sees updated associated_timelines
      await refreshPopupEventIfOpen(selectedPost?.eventId);
    } catch (e) {
      console.warn('[ManagePostsTab] resolveReport(remove) failed:', e);
      setRemoveDialogOpen(false);
      const msg = e?.response?.status === 409
        ? (e?.response?.data?.error?.message || e?.response?.data?.message || 'This event was created on this community timeline. Use Delete instead of Remove.')
        : (e?.response?.data?.error?.message || e?.response?.data?.error || 'Failed to resolve (remove)');
      setSnackbarMessage(msg);
      setSnackbarSeverity('warning');
      setSnackbarOpen(true);
    } finally {
      setRemoveSubmitting(false);
    }
  };
  
  // Filter posts based on selected tab
  const filteredPosts = reportedPosts.filter(post => {
    if (postTabValue === 0) return post.status === 'pending'; // Pending posts
    if (postTabValue === 1) return post.status === 'reviewing'; // Reviewing posts
    if (postTabValue === 2) return post.status === 'resolved'; // Resolved posts
    return true;
  });
  
  // Count posts by status for tab badges
  const pendingCount = counts.pending;
  const reviewingCount = counts.reviewing;
  const resolvedCount = counts.resolved;
  const selectedTabColor = postTabValue === 0 ? 'warning.main' : postTabValue === 1 ? 'info.main' : 'success.main';
  
  // Helper to get event type icon and color
  const getEventTypeDisplay = (eventType) => {
    const type = (eventType || '').toLowerCase();
    switch (type) {
      case 'remark':
        return { icon: CommentIcon, color: '#2196f3', label: 'Remark' };
      case 'media':
        return { icon: MovieIcon, color: '#7b1fa2', label: 'Media' };
      case 'image':
        return { icon: ImageIcon, color: '#009688', label: 'Image' };
      case 'video':
        return { icon: VideocamIcon, color: '#4a148c', label: 'Video' };
      case 'audio':
        return { icon: AudiotrackIcon, color: '#e65100', label: 'Audio' };
      case 'news':
        return { icon: NewspaperIcon, color: '#e53935', label: 'News' };
      default:
        return { icon: CommentIcon, color: '#757575', label: eventType || 'Event' };
    }
  };

  // Helper to parse category from reason like "[website_policy] text" and return { chipLabel, chipColor, chipStyle, cleaned }
  const parseReasonCategory = (reasonRaw) => {
    const out = { chipLabel: null, chipColor: null, chipStyle: {}, cleaned: reasonRaw || '' };
    if (!reasonRaw || typeof reasonRaw !== 'string') return out;
    const m = reasonRaw.match(/^\s*\[([^\]]+)\]\s*(.*)$/);
    if (!m) return out;
    const key = (m[1] || '').toLowerCase();
    out.cleaned = m[2] || '';
    if (key === 'website_policy') {
      out.chipLabel = 'Website Policy';
      out.chipColor = 'primary';
      out.chipStyle = { bgcolor: '#1976d2', color: '#fff' }; // Blue
    } else if (key === 'government_policy') {
      out.chipLabel = 'Government Policy';
      out.chipColor = 'warning';
      out.chipStyle = { bgcolor: '#ed6c02', color: '#fff' }; // Orange
    } else if (key === 'unethical_boundary') {
      out.chipLabel = 'Unethical Boundary';
      out.chipColor = 'error';
      out.chipStyle = { bgcolor: '#d32f2f', color: '#fff' }; // Red
    }
    return out;
  };

  const formatResolutionLabel = (resolution) => {
    const value = String(resolution || '').trim();
    if (!value) return 'Unknown';
    return value
      .replace(/_/g, ' ')
      .split(' ')
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <FlagIcon sx={{ mr: 1, color: 'warning.main' }} />
        <Typography variant="h6" component="h2">
          Reported Posts
        </Typography>
      </Box>
      
      {/* Post Management Tabs */}
      <Tabs 
        value={postTabValue} 
        onChange={handlePostTabChange}
        sx={{
          mb: 3,
          borderBottom: 1,
          borderColor: 'divider',
          '& .MuiTabs-indicator': {
            backgroundColor: selectedTabColor,
            height: 3,
          },
        }}
      >
        <Tab 
          label={`Pending (${pendingCount})`} 
          sx={{ 
            color: 'warning.main',
            fontWeight: 'bold',
            '&.Mui-selected': { color: 'warning.main' },
          }} 
        />
        <Tab 
          label={`Reviewing (${reviewingCount})`} 
          sx={{ 
            color: 'info.main',
            fontWeight: 'bold',
            '&.Mui-selected': { color: 'info.main' },
          }} 
        />
        <Tab 
          label={`Resolved (${resolvedCount})`} 
          sx={{ 
            color: 'success.main',
            fontWeight: 'bold',
            '&.Mui-selected': { color: 'success.main' },
          }} 
        />
      </Tabs>
      
      {/* Reported Posts List */}
      <Box sx={{ maxHeight: 500, overflow: 'auto' }}>
        {filteredPosts.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              No reported posts in this category
            </Typography>
          </Box>
        ) : (
          <Box>
            {filteredPosts.map((post) => {
              const { chipLabel, chipColor, chipStyle, cleaned } = parseReasonCategory(post.reason);
              const eventTypeDisplay = getEventTypeDisplay(post.eventType);
              const EventTypeIcon = eventTypeDisplay.icon;
              
              // Determine status color
              let statusColor = {
                text: '#6B7280',
                bg: '#F3F4F6',
                icon: null
              };
              
              if (post.status === 'pending') {
                statusColor = {
                  text: '#D97706',
                  bg: '#FEF3C7',
                  icon: <FlagIcon fontSize="small" />
                };
              } else if (post.status === 'reviewing') {
                statusColor = {
                  text: '#2563EB',
                  bg: '#DBEAFE',
                  icon: <ShieldIcon fontSize="small" />
                };
              } else if (post.status === 'resolved') {
                statusColor = {
                  text: '#059669',
                  bg: '#D1FAE5',
                  icon: <CheckCircleIcon fontSize="small" />
                };
              }
              
              return (
                <Paper
                  key={post.id}
                  elevation={2}
                  sx={{
                    p: 2,
                    mb: 2,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    borderLeft: `4px solid ${statusColor.text}`,
                    borderTop: `3px solid ${eventTypeDisplay.color}`,
                    borderRight: `2px solid ${eventTypeDisplay.color}`,
                    borderBottom: `2px solid ${eventTypeDisplay.color}`,
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: 3
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, gap: 2, flexWrap: 'wrap' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                      <EventTypeIcon sx={{ color: eventTypeDisplay.color, fontSize: 20 }} />
                      <Chip
                        label="Post"
                        size="small"
                        sx={{ bgcolor: '#FFF3E0', color: '#BF360C', fontWeight: 700 }}
                      />
                      <Typography variant="subtitle1" component="div" sx={{ fontWeight: 700 }}>
                        Ticket
                      </Typography>
                      <Chip 
                        label={post.status.charAt(0).toUpperCase() + post.status.slice(1)}
                        size="small"
                        icon={statusColor.icon}
                        sx={{ 
                          bgcolor: statusColor.bg,
                          color: statusColor.text,
                          fontWeight: 500
                        }}
                      />
                    </Box>

                    <Stack spacing={0.4} alignItems={{ xs: 'flex-start', sm: 'flex-end' }}>
                      <Typography variant="body2" color="text.secondary">
                        Reported {post.reportDate}
                      </Typography>
                      {post.status === 'resolved' && (
                        <Typography variant="body2" color="text.secondary" sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
                          Resolution: <strong>{formatResolutionLabel(post.resolution)}</strong>
                        </Typography>
                      )}
                    </Stack>
                  </Box>
                  
                  <Box
                    sx={{
                      mb: 2,
                      display: 'grid',
                      gridTemplateColumns: {
                        xs: '1fr',
                        md: post.status === 'resolved' && post.verdict ? 'minmax(0, 1fr) minmax(0, 2fr)' : '1fr',
                      },
                      gap: 2,
                      alignItems: 'start',
                    }}
                  >
                    <Box sx={{ minWidth: 0 }}>
                      <Stack spacing={1.2}>
                        <Box
                          sx={{
                            p: 1.5,
                            borderRadius: 2,
                            border: '1px solid rgba(245,124,0,0.35)',
                            bgcolor: 'rgba(245,124,0,0.08)',
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, flexWrap: 'wrap', mb: 0.5 }}>
                            <Typography variant="overline" sx={{ color: '#E65100', fontWeight: 700, letterSpacing: 0.8 }}>
                              POST REPORT TARGET
                            </Typography>
                            {post.eventId && !(post.status === 'resolved' && post.resolution === 'delete') && (
                              <Button
                                variant="outlined"
                                size="small"
                                onClick={() => handleViewEvent(post)}
                                sx={{
                                  borderRadius: '999px',
                                  px: 1.5,
                                  py: 0.25,
                                  minHeight: 28,
                                  textTransform: 'none',
                                  fontWeight: 600,
                                  borderColor: 'rgba(230,81,0,0.45)',
                                  color: '#BF360C',
                                  '&:hover': {
                                    borderColor: '#E65100',
                                    backgroundColor: 'rgba(230,81,0,0.08)',
                                  },
                                }}
                              >
                                View Event
                              </Button>
                            )}
                          </Box>

                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                            <Typography variant="body2"><strong>Type:</strong></Typography>
                            <Chip
                              label={eventTypeDisplay.label}
                              size="small"
                              sx={{
                                bgcolor: '#FFF3E0',
                                color: '#E65100',
                                fontWeight: 600,
                                height: 22,
                              }}
                            />
                          </Box>
                        </Box>

                        <Box
                          sx={{
                            p: 1.5,
                            borderRadius: 2,
                            bgcolor: 'transparent',
                            border: '1px solid rgba(230,81,0,0.3)',
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 0.75 }}>
                            <Typography variant="body2"><strong>Reason Reported</strong></Typography>
                            {chipLabel && (
                              <Chip
                                label={chipLabel}
                                size="small"
                                sx={chipStyle}
                              />
                            )}
                          </Box>
                          <Typography variant="body1" sx={{ fontWeight: 500 }}>
                            {cleaned || 'No reason provided.'}
                          </Typography>
                        </Box>
                      </Stack>
                    </Box>

                    {post.status === 'resolved' && post.verdict && (
                      <Box
                        sx={{
                          p: 1.4,
                          borderRadius: 1.5,
                          border: '1px solid',
                          borderColor: 'divider',
                          backgroundColor: theme.palette.mode === 'dark'
                            ? 'rgba(255,255,255,0.02)'
                            : 'rgba(15,23,42,0.02)',
                          minHeight: '100%',
                        }}
                      >
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.35, fontWeight: 600 }}>
                          Verdict
                        </Typography>
                        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
                          {post.verdict}
                        </Typography>
                        {post.resolution === 'safeguard' && post.safeUntil && (
                          <Typography variant="body2" sx={{ mt: 0.75, color: '#0B8A4A', fontWeight: 700 }}>
                            Safe Until: {new Date(post.safeUntil).toLocaleString()}
                          </Typography>
                        )}
                      </Box>
                    )}
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minHeight: 24 }}>
                      <Typography variant="body2"><strong>Reporter:</strong></Typography>
                      {post.reporter?.avatar && (
                        <UserAvatar
                          name={post.reporter?.name || 'Reporter'}
                          avatarUrl={post.reporter?.avatar}
                          id={post.reporter?.id}
                          size={22}
                          userColor={post.reporter?.user_color}
                        />
                      )}
                      {post.reporter?.id ? (
                        <Typography
                          component="a"
                          href={`/profile/${post.reporter.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          variant="body2"
                          sx={{
                            color: 'primary.main',
                            textDecoration: 'none',
                            fontWeight: 500,
                            '&:hover': { textDecoration: 'underline' },
                          }}
                        >
                          {displayUsername(post.reporter?.name) || 'Reporter'}
                        </Typography>
                      ) : (
                        <Typography variant="body2">{displayUsername(post.reporter?.name) || 'Reporter'}</Typography>
                      )}
                    </Box>

                    {(post.status === 'reviewing' || post.status === 'resolved') && post.assignedModerator && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minHeight: 24 }}>
                        <Typography variant="body2"><strong>Accepted by:</strong></Typography>
                        {post.assignedModerator.avatar && (
                          <UserAvatar
                            name={post.assignedModerator.name || 'Moderator'}
                            avatarUrl={post.assignedModerator.avatar}
                            id={post.assignedModerator.id}
                            size={22}
                            userColor={post.assignedModerator.user_color}
                          />
                        )}
                        <Typography variant="body2">{displayUsername(post.assignedModerator.name)}</Typography>
                      </Box>
                    )}
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2, flexWrap: 'wrap' }}>
                    {post.status === 'pending' && (
                      <Button
                        variant="outlined"
                        size="small"
                        color="primary"
                        startIcon={<ShieldIcon />}
                        onClick={() => handleAcceptReport(post)}
                        sx={{ mr: 1 }}
                      >
                        Accept for Review
                      </Button>
                    )}
                    
                    {post.status === 'reviewing' && (
                      <>
                        <Button
                          variant="outlined"
                          size="small"
                          color="warning"
                          startIcon={<PersonRemoveIcon />}
                          onClick={() => handleOpenRemoveDialog(post)}
                          sx={{ mr: 1, mb: 1 }}
                        >
                          Remove from Community
                        </Button>
                        <Button
                          variant="outlined"
                          size="small"
                          color="error"
                          startIcon={<CancelIcon />}
                          onClick={() => handleOpenPostActionDialog(post, 'escalate')}
                          sx={{ mr: 1, mb: 1 }}
                        >
                          Escalate
                        </Button>
                        <Button
                          variant="outlined"
                          size="small"
                          color="success"
                          startIcon={<CheckCircleIcon />}
                          onClick={() => handleOpenPostActionDialog(post, 'safeguard')}
                          sx={{ mb: 1 }}
                        >
                          Safeguard Post
                        </Button>
                      </>
                    )}
                  </Box>
                </Paper>
              );
            })}
          </Box>
        )}
      </Box>
      
      {/* Post Action Confirmation Dialog */}
      <Dialog
        open={confirmPostActionDialogOpen}
        onClose={handleClosePostActionDialog}
        aria-labelledby="post-action-dialog-title"
        aria-describedby="post-action-dialog-description"
      >
        <DialogTitle id="post-action-dialog-title">
          {postActionType === 'escalate' ? 'Send Report to Administration?' : 'Safeguard Post?'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="post-action-dialog-description">
            {postActionType === 'escalate'
              ? 'Send this ticket to Site Control for higher-level review. Choose whether you are requesting an edit or a deletion.'
              : 'This action will mark the post as reviewed and safe, dismissing the report. The post will remain visible on the timeline.'}
          </DialogContentText>
          {postActionType === 'escalate' ? (
            <Box sx={{ mt: 2 }}>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel id="escalation-type-label">Escalation Request</InputLabel>
                <Select
                  labelId="escalation-type-label"
                  value={escalationType}
                  label="Escalation Request"
                  onChange={(e) => setEscalationType(e.target.value)}
                >
                  <MenuItem value="edit">Request Edit</MenuItem>
                  <MenuItem value="delete">Request Delete</MenuItem>
                </Select>
              </FormControl>
              <TextField
                fullWidth
                multiline
                minRows={3}
                label="Summary (optional)"
                placeholder="Add any specifics for the site admins"
                value={escalationSummary}
                onChange={(e) => setEscalationSummary(e.target.value)}
              />
            </Box>
          ) : (
            <>
              <TextField
                autoFocus
                fullWidth
                multiline
                minRows={3}
                label="Verdict (required)"
                placeholder="Write your findings and rationale"
                value={actionVerdict}
                onChange={(e) => setActionVerdict(e.target.value)}
                sx={{ mt: 2 }}
              />
              <FormControl fullWidth sx={{ mt: 2 }}>
                <InputLabel id="safeguard-days-label">Cooldown Duration</InputLabel>
                <Select
                  labelId="safeguard-days-label"
                  label="Cooldown Duration"
                  value={safeguardDays}
                  onChange={(e) => setSafeguardDays(String(e.target.value))}
                >
                  <MenuItem value="3">3 Days</MenuItem>
                  <MenuItem value="7">7 Days</MenuItem>
                  <MenuItem value="10">10 Days</MenuItem>
                </Select>
              </FormControl>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePostActionDialog} color="primary">
            Cancel
          </Button>
          <Button 
            onClick={postActionType === 'escalate' ? handleEscalateReport : handleSafeguardPost} 
            color={postActionType === 'escalate' ? 'error' : 'success'} 
            variant="contained"
            startIcon={postActionType === 'escalate' ? <CancelIcon /> : <CheckCircleIcon />}
            disabled={postActionType === 'escalate' ? !escalationType : !actionVerdict.trim()}
          >
            {postActionType === 'escalate' ? 'Send to Administration' : 'Safeguard Post'}
          </Button>
        </DialogActions>
      </Dialog>
      {/* In-place Event Popup overlay */}
      {eventPopupOpen && popupEvent && (
        <EventPopup
          event={popupEvent}
          open={eventPopupOpen}
          onClose={() => setEventPopupOpen(false)}
          onEdit={handleOpenEventEdit}
          reviewingEventIds={reviewingEventIds}
        />
      )}

      <EventDialog
        open={editDialogOpen}
        onClose={handleCloseEventEdit}
        onSave={handleSubmitEventEdit}
        initialEvent={editDialogEvent}
        timelineName={editDialogEvent?.timeline_name || editDialogEvent?.timelineName}
        timelineType={editDialogEvent?.timeline_type || editDialogEvent?.timelineType || 'community'}
        submitLoading={editDialogSubmitting}
        submitDisabled={editDialogSubmitting}
      />

      {/* Remove from Community Verdict Dialog */}
      <Dialog
        open={removeDialogOpen}
        onClose={handleCloseRemoveDialog}
        aria-labelledby="remove-dialog-title"
      >
        <DialogTitle id="remove-dialog-title">Remove from Community</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            This will remove the event from this community timeline. Please enter your moderation verdict. This verdict will be saved on the ticket.
          </DialogContentText>
          <TextField
            autoFocus
            fullWidth
            multiline
            minRows={3}
            label="Verdict (required)"
            placeholder="Write your findings and rationale"
            value={removeVerdict}
            onChange={(e) => setRemoveVerdict(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseRemoveDialog}>Cancel</Button>
          <Button 
            onClick={handleConfirmRemoveFromCommunity}
            variant="contained"
            color="warning"
            disabled={!removeVerdict.trim() || removeSubmitting}
            startIcon={<PersonRemoveIcon />}
          >
            {removeSubmitting ? 'Removing…' : 'Remove from Community'}
          </Button>
        </DialogActions>
      </Dialog>
      {/* Snackbars for Manage Posts tab */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnackbarOpen(false)} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </motion.div>
  );
};

// Member Management Tab Component
const StandaloneMemberManagementTab = ({ timelineId, userRole, currentUserId, timelineData }) => {
  const theme = useTheme();
  const [memberTabValue, setMemberTabValue] = useState(0); // 0 = Active Members, 1 = Blocked Members
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [actionType, setActionType] = useState(''); // 'remove' or 'block' or 'unblock' or 'promote' or 'demote'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  
  // Real data for members
  const [members, setMembers] = useState([]);
  const [pendingMembers, setPendingMembers] = useState([]);
  const [blockedMembers, setBlockedMembers] = useState([]);
  const [timelineMemberCount, setTimelineMemberCount] = useState(0);
  
  // Load members data from API
  const loadMembers = useCallback(async () => {
    if (!timelineId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const membersArr = await getTimelineMembers(timelineId);
      console.log('Members response:', membersArr);
      
      // Our API util returns a transformed array of members
      const activeMembers = Array.isArray(membersArr)
        ? membersArr
        : (Array.isArray(membersArr?.members) ? membersArr.members : []);
      
      setMembers(activeMembers);
      // Load blocked members independently to avoid conflicts
      console.log('[AdminPanel] Loading blocked members after active members...');
      try {
        const blockedResponse = await getBlockedMembers(timelineId);
        console.log('[AdminPanel] Blocked members from API:', blockedResponse);
        const blockedList = Array.isArray(blockedResponse) ? blockedResponse : blockedResponse?.data || [];
        const formattedBlocked = blockedList.map((item) => {
          const user = item.user || {};
          const avatar = user.avatar_url || item.avatar_url || null;
          const user_color = user.user_color || item.user_color || null;
          const blockedAt = item.blocked_at || item.blockedDate;
          let blockedDate = 'Unknown';
          try {
            if (blockedAt) {
              const d = new Date(blockedAt);
              if (!isNaN(d.getTime())) blockedDate = d.toISOString().split('T')[0];
            }
          } catch (_) {}
          return {
            id: item.user_id || item.id,
            name: user.username || item.username || `User ${item.user_id || item.id}`,
            avatar,
            user_color,
            blockedDate,
            reason: item.blocked_reason || item.reason || ''
          };
        });
        console.log('[AdminPanel] Formatted blocked members:', formattedBlocked);
        setBlockedMembers(formattedBlocked);
      } catch (blockedError) {
        console.error('[AdminPanel] Failed to load blocked members:', blockedError);
        setBlockedMembers([]);
      }
    } catch (error) {
      console.error('Error loading members:', error);
      setError('Failed to load members');
      showSnackbar('Failed to load members', 'error');
    } finally {
      setLoading(false);
    }
  }, [timelineId]);
  
  // Load pending members data from API
  const loadPendingMembers = useCallback(async () => {
    if (!timelineId) return;
    
    try {
      console.log('[AdminPanel] Loading pending members...');
      const response = await getPendingMembers(timelineId);
      console.log('[AdminPanel] Pending members response:', response);
      
      // Backend returns { data: [...] }, legacy format was { pending_members: [...] }
      const pendingList = Array.isArray(response?.data) 
        ? response.data 
        : (Array.isArray(response?.pending_members) 
          ? response.pending_members 
          : (Array.isArray(response) ? response : []));
      
      const formattedPending = pendingList.map((member) => ({
        id: member.user_id,
        userId: member.user_id,
        name: member.username || `User ${member.user_id}`,
        role: member.role,
        joinDate: member.requested_at ? new Date(member.requested_at).toISOString().split('T')[0] : 'Unknown',
        avatar: member.avatar_url || null,  // Use null instead of pravatar fallback
        user_color: member.user_color || null
      }));
      
      console.log('[AdminPanel] Formatted pending members:', formattedPending);
      setPendingMembers(formattedPending);
    } catch (error) {
      console.error('[AdminPanel] Error loading pending members:', error);
      setPendingMembers([]);
    }
  }, [timelineId]);
  
  // Load members on component mount and when timelineId changes
  useEffect(() => {
    loadMembers();
  }, [loadMembers]);
  
  // Load pending members when Pending Requests tab is opened
  useEffect(() => {
    if (memberTabValue === 1) {
      loadPendingMembers();
    }
  }, [memberTabValue, loadPendingMembers]);
  
  // Also load pending members on initial mount to show badge count
  useEffect(() => {
    loadPendingMembers();
  }, [loadPendingMembers]);
  
  // Show snackbar notification
  const showSnackbar = (message, severity = 'success') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };
  
  // Role change helpers (one-step, no jumping)
  const getNextRole = (role) => {
    const r = (role || '').toLowerCase();
    if (r === 'member') return 'moderator';
    if (r === 'moderator') return 'admin';
    return null;
  };

  const getPrevRole = (role) => {
    const r = (role || '').toLowerCase();
    if (r === 'admin') return 'moderator';
    if (r === 'moderator') return 'member';
    return null;
  };

  const performRoleChange = async (member, direction) => {
    try {
      const uid = member.user_id ?? member.id ?? member.userId;
      if (!uid) return;
      // Guard: self and SiteOwner
      if (currentUserId && Number(currentUserId) === Number(uid)) {
        showSnackbar('You cannot change your own role', 'warning');
        return;
      }
      if (Number(uid) === 1 || (member.role || '').toLowerCase() === 'siteowner') {
        showSnackbar('Cannot change SiteOwner role', 'warning');
        return;
      }

      const newRole = direction === 'promote' ? getNextRole(member.role) : getPrevRole(member.role);
      if (!newRole) {
        showSnackbar('No further role change available', 'info');
        return;
      }

      await updateMemberRole(timelineId, uid, newRole);
      // Note: Passport sync endpoint not implemented
      // try { await syncUserPassport(); } catch (_) {}
      await loadMembers();
      showSnackbar(`Updated role to ${newRole} for ${member.name || 'member'}`, 'success');
    } catch (e) {
      showSnackbar(e?.response?.data?.error || e?.response?.data?.message || 'Failed to update role', 'error');
    }
  };
  
  // Handle opening the confirmation dialog
  const handleOpenConfirmDialog = (member, action) => {
    // Normalize the selected member shape to ensure id/name/avatar fields exist
    const normalized = {
      id: member.user_id ?? member.id ?? member.userId,
      user_id: member.user_id ?? member.id ?? member.userId,
      userId: member.user_id ?? member.id ?? member.userId,
      username: member.username ?? member.name,
      name: member.name ?? member.username,
      avatar: member.avatar ?? member.avatar_url,
      avatar_url: member.avatar_url ?? member.avatar,
      role: member.role || 'member'
    };
    setSelectedMember({ ...member, ...normalized });
    setActionType(action);
    setConfirmDialogOpen(true);
  };
  
  // Handle closing the confirmation dialog
  const handleCloseConfirmDialog = () => {
    setConfirmDialogOpen(false);
    setSelectedMember(null);
    setActionType('');
  };

  // Handle member actions (remove, block, unblock, role changes)
  const handleMemberAction = async () => {
    if (!selectedMember || !actionType) return;
    
    try {
      console.log('Selected member:', selectedMember);
      console.log('Action type:', actionType);
      
      // Normalize the selected member shape to ensure id/name/avatar fields exist
      const normalizedMember = {
        id: selectedMember.user_id ?? selectedMember.id ?? selectedMember.userId,
        user_id: selectedMember.user_id ?? selectedMember.id ?? selectedMember.userId,
        userId: selectedMember.user_id ?? selectedMember.id ?? selectedMember.userId,
        username: selectedMember.username ?? selectedMember.name,
        name: selectedMember.name ?? selectedMember.username,
        avatar: selectedMember.avatar ?? selectedMember.avatar_url,
        avatar_url: selectedMember.avatar_url ?? selectedMember.avatar,
        role: selectedMember.role || 'member'
      };
      
      console.log('Normalized member:', normalizedMember);
      
      let success = false;
      let message = '';
      
      switch (actionType) {
        case 'remove':
          await removeMember(timelineId, selectedMember.user_id || selectedMember.id);
          message = `${selectedMember.username} has been removed from the timeline`;
          success = true;
          break;
          
        case 'block':
          await blockMember(timelineId, selectedMember.user_id || selectedMember.id, 'Blocked by admin');
          message = `${selectedMember.username} has been blocked`;
          success = true;
          break;
          
        case 'unblock':
          await unblockMember(timelineId, selectedMember.user_id || selectedMember.id);
          message = `${selectedMember.username} has been unblocked`;
          success = true;
          break;
          
        case 'promote_admin':
          await updateMemberRole(timelineId, selectedMember.user_id || selectedMember.id, 'admin');
          message = `${selectedMember.username} has been promoted to Admin`;
          success = true;
          break;
          
        case 'promote_moderator':
          await updateMemberRole(timelineId, selectedMember.user_id || selectedMember.id, 'moderator');
          message = `${selectedMember.username} has been promoted to Moderator`;
          success = true;
          break;
          
        case 'demote_member':
          await updateMemberRole(timelineId, selectedMember.user_id || selectedMember.id, 'member');
          message = `${selectedMember.username} has been demoted to Member`;
          success = true;
          break;
          
        case 'approve':
          await approvePendingMember(timelineId, selectedMember.user_id || selectedMember.id);
          message = `${selectedMember.username} has been approved`;
          success = true;
          break;
          
        case 'deny':
          await denyPendingMember(timelineId, selectedMember.user_id || selectedMember.id);
          message = `${selectedMember.username}'s request has been denied`;
          success = true;
          break;
          
        default:
          throw new Error('Unknown action type');
      }
      
      if (success) {
        showSnackbar(message, 'success');
        const selKey = selectedMember.user_id ?? selectedMember.id ?? selectedMember.userId;
        if (actionType === 'block') {
          // Move from members to blockedMembers
          setMembers(prev => prev.filter(m => (m.user_id ?? m.id ?? m.userId) !== selKey));
          const blocked = {
            id: selectedMember.user_id ?? selectedMember.id ?? selectedMember.userId,
            name: selectedMember.username || selectedMember.name || `User ${selKey}`,
            avatar: selectedMember.avatar_url || selectedMember.avatar,
            role: selectedMember.role || 'member',
            blockedDate: new Date().toISOString().split('T')[0],
            reason: 'Blocked by admin'
          };
          setBlockedMembers(prev => {
            const next = [...prev, blocked];
            console.log('Blocked list updated (size):', next.length, next);
            return next;
          });
          setMemberTabValue(2);
        } else if (actionType === 'unblock') {
          // Move from blockedMembers back to members
          setBlockedMembers(prev => {
            const next = prev.filter(m => (m.user_id ?? m.id ?? m.userId) !== selKey);
            console.log('Blocked list after unblock (size):', next.length, next);
            return next;
          });
          const unblocked = {
            id: selectedMember.user_id ?? selectedMember.id ?? selectedMember.userId,
            name: selectedMember.username || selectedMember.name || `User ${selKey}`,
            avatar: selectedMember.avatar_url || selectedMember.avatar,
            role: 'member',
          };
          setMembers(prev => [...prev, unblocked]);
          setMemberTabValue(0);
        } else if (actionType === 'approve') {
          // Remove from pending list and reload active members
          setPendingMembers(prev => prev.filter(m => (m.user_id ?? m.id ?? m.userId) !== selKey));
          await loadMembers();  // Reload active members to show the newly approved member
          setMemberTabValue(0);  // Switch to Active Members tab
        } else if (actionType === 'deny') {
          // Remove denied member from pending list
          setPendingMembers(prev => prev.filter(m => (m.user_id ?? m.id ?? m.userId) !== selKey));
          // Stay on Pending Requests tab
        } else {
          // For other actions, reload active members to reflect role changes
          await loadMembers();
        }
      }
    } catch (error) {
      console.error('Error performing member action:', error);
      showSnackbar(error.response?.data?.error || 'Action failed', 'error');
    } finally {
      handleCloseConfirmDialog();
    }
  };
  
  // Get color based on role
  const getRoleColor = (role) => {
    const roleLower = (role || '').toLowerCase();
    if (roleLower === 'siteowner') {
      return {
        text: '#fff',
        bg: '#2e7d32' // Forest green for SiteOwner
      };
    } else if (roleLower === 'siteadmin') {
      return {
        text: '#fff',
        bg: '#1565c0' // Deep blue for SiteAdmin
      };
    } else if (roleLower === 'admin') {
      return {
        text: '#D97706',
        bg: '#FEF3C7'
      };
    } else if (roleLower === 'moderator') {
      return {
        text: '#2563EB',
        bg: '#DBEAFE'
      };
    } else {
      return {
        text: '#6B7280',
        bg: '#F3F4F6'
      };
    }
  };
  
  const handleMemberTabChange = (event, newValue) => {
    setMemberTabValue(newValue);
  };
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Member Management Tabs */}
      <Tabs 
        value={memberTabValue} 
        onChange={handleMemberTabChange}
        sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab label="Active Members" />
        <Tab label="Pending Requests" />
        <Tab label="Blocked Members" />
      </Tabs>
      
      {/* Active Members Tab */}
      {memberTabValue === 0 && (
        <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
          {members.length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                No members yet
              </Typography>
            </Box>
          ) : (
            <Box>
              {members.map((member) => {
                const roleLower = (member.role || '').toLowerCase();
                const roleColor = getRoleColor(member.role);
                
                return (
                  <Box 
                    key={member.id}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      p: 2,
                      borderBottom: 1,
                      borderColor: 'divider',
                      '&:last-child': {
                        borderBottom: 'none'
                      },
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
                      sx={{
                        mr: 2,
                        boxShadow: '0 0 0 2px ' + roleColor.bg,
                        cursor: 'pointer',
                        transition: 'transform 0.2s ease',
                        '&:hover': { transform: 'scale(1.05)' }
                      }}
                    />
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        {displayUsername(member.name)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Joined {member.joinDate}
                      </Typography>
                    </Box>
                    {/* Hover-reveal actions container cloned from MemberListTab style (moved after name/join) */}
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      opacity: 0,
                      transition: 'opacity 0.2s ease',
                      '.MuiBox-root:hover > &': { opacity: 1 }
                    }}>
                      {(() => {
                        const uid = member.userId ?? member.user_id ?? member.id;
                        const isSelf = currentUserId && Number(currentUserId) === Number(uid);
                        const roleLower = (member.role || '').toLowerCase();
                        const isSiteOwner = Number(uid) === 1 || roleLower === 'siteowner';
                        const nextRole = getNextRole(member.role);
                        const prevRole = getPrevRole(member.role);
                        const normalizedUserRole = (userRole || '').toLowerCase();
                        const canChangeRoles = ['admin', 'creator', 'siteowner'].includes(normalizedUserRole);
                        return (
                          <>
                            {canChangeRoles && !isSelf && !isSiteOwner && nextRole && (
                              <Chip
                                label="Promote"
                                size="small"
                                color="primary"
                                variant="outlined"
                                onClick={() => performRoleChange(member, 'promote')}
                                sx={{
                                  mr: 1,
                                  fontSize: '0.7rem',
                                  height: 24,
                                  '&:hover': {
                                    bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(25,118,210,0.1)' : 'rgba(25,118,210,0.05)'
                                  }
                                }}
                              />
                            )}
                            {canChangeRoles && !isSelf && !isSiteOwner && prevRole && (
                              <Chip
                                label="Demote"
                                size="small"
                                color="default"
                                variant="outlined"
                                onClick={() => performRoleChange(member, 'demote')}
                                sx={{
                                  mr: 1,
                                  fontSize: '0.7rem',
                                  height: 24,
                                  '&:hover': {
                                    bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'
                                  }
                                }}
                              />
                            )}
                            {canRemoveMember(userRole, currentUserId, member, timelineData) && (
                              <IconButton 
                                size="small" 
                                color="error"
                                onClick={() => handleOpenConfirmDialog(member, 'remove')}
                                title="Remove from community"
                                sx={{ 
                                  mr: 1,
                                  '&:hover': { bgcolor: 'rgba(211, 47, 47, 0.1)' }
                                }}
                              >
                                <PersonRemoveIcon />
                              </IconButton>
                            )}
                            {(() => {
                              const isSelf = currentUserId && Number(currentUserId) === Number(uid);
                              const isTargetSiteOwner = Number(uid) === 1 || roleLower === 'siteowner';
                              return !isSelf && !isTargetSiteOwner;
                            })() && (
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleOpenConfirmDialog(member, 'block')}
                                title="Block from community"
                                sx={{
                                  '&:hover': { bgcolor: 'rgba(211, 47, 47, 0.1)' }
                                }}
                              >
                                <BlockIcon />
                              </IconButton>
                            )}
                          </>
                        );
                      })()}
                    </Box>
                    <Chip 
                      label={(roleLower ? roleLower.charAt(0).toUpperCase() + roleLower.slice(1) : 'Member')}
                      size="small"
                      icon={
                        roleLower === 'admin' ? 
                          <AdminPanelSettingsIcon fontSize="small" /> : 
                        roleLower === 'moderator' ? 
                          <ModeratorIcon fontSize="small" /> : 
                          null
                      }
                      sx={{ 
                        bgcolor: roleColor.bg,
                        color: roleColor.text,
                        fontWeight: 500,
                        mr: 2
                      }}
                    />
                  </Box>
                );
              })}
            </Box>
          )}
        </Box>
      )}
      
      {/* Pending Requests Tab */}
      {memberTabValue === 1 && (
        <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
          {pendingMembers.length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                No pending requests
              </Typography>
            </Box>
          ) : (
            <Box>
              {pendingMembers.map((member) => (
                <Box 
                  key={member.id}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    p: 2,
                    borderBottom: 1,
                    borderColor: 'divider',
                    '&:last-child': {
                      borderBottom: 'none'
                    },
                    '&:hover': {
                      bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)'
                    },
                    transition: 'background-color 0.2s ease'
                  }}
                >
                  <UserAvatar
                    name={member.name}
                    avatarUrl={member.avatar}
                    id={member.userId || member.id}
                    size={48}
                    userColor={member.user_color}
                    sx={{ mr: 2 }}
                  />
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="subtitle1" component="div">
                      {member.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Requested {member.joinDate}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant="contained"
                      color="success"
                      size="small"
                      onClick={() => handleOpenConfirmDialog(member, 'approve')}
                    >
                      Approve
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      onClick={() => handleOpenConfirmDialog(member, 'deny')}
                    >
                      Deny
                    </Button>
                  </Box>
                </Box>
              ))}
            </Box>
          )}
        </Box>
      )}
      
      {/* Blocked Members Tab */}
      {memberTabValue === 2 && (
        <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
          {blockedMembers.length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                No blocked users
              </Typography>
            </Box>
          ) : (
            <Box>
              {blockedMembers.map((member) => (
                <Box 
                  key={member.id}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    p: 2,
                    borderBottom: 1,
                    borderColor: 'divider',
                    '&:last-child': {
                      borderBottom: 'none'
                    },
                    '&:hover': {
                      bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)'
                    },
                    transition: 'background-color 0.2s ease'
                  }}
                >
                  <UserAvatar
                    name={member.name}
                    avatarUrl={member.avatar}
                    id={member.userId || member.id}
                    size={48}
                    userColor={member.user_color}
                    sx={{
                      mr: 2,
                      filter: 'grayscale(100%)',
                      opacity: 0.7
                    }}
                  />
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      {displayUsername(member.name)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Blocked on {member.blockedDate}
                    </Typography>
                    <Typography variant="body2" color="error" sx={{ mt: 0.5 }}>
                      Reason: {member.reason}
                    </Typography>
                  </Box>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => handleOpenConfirmDialog(member, 'unblock')}
                    sx={{ ml: 2 }}
                  >
                    Unblock
                  </Button>
                </Box>
              ))}
            </Box>
          )}
        </Box>
      )}
      
      {/* Member Action Confirmation Dialog */}
      <Dialog
        open={confirmDialogOpen}
        onClose={handleCloseConfirmDialog}
        aria-labelledby="member-action-dialog-title"
        aria-describedby="member-action-dialog-description"
      >
        <DialogTitle id="member-action-dialog-title">
          {actionType === 'remove' ? 'Remove Member?' : 
           actionType === 'block' ? 'Block Member?' : 
           actionType === 'unblock' ? 'Unblock Member?' :
           actionType === 'approve' ? 'Approve Member?' :
           actionType === 'deny' ? 'Deny Request?' : 'Confirm Action'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="member-action-dialog-description">
            {actionType === 'remove' && 'This will remove the member from the community. They can rejoin later if the community is public.'}
            {actionType === 'block' && 'This will block the member from the community. They will not be able to view or participate in this community.'}
            {actionType === 'unblock' && 'This will unblock the member. They will be able to rejoin the community if it is public.'}
            {actionType === 'approve' && 'This will approve the membership request and grant them access to the community.'}
            {actionType === 'deny' && 'This will deny the membership request. The user will not be added to the community.'}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseConfirmDialog} color="primary">
            Cancel
          </Button>
          <Button 
            onClick={handleMemberAction}
            color={actionType === 'unblock' || actionType === 'approve' ? 'success' : 'error'} 
            variant="contained"
          >
          {actionType === 'remove' ? 'Remove' : 
           actionType === 'block' ? 'Block' : 
           actionType === 'unblock' ? 'Unblock' :
           actionType === 'approve' ? 'Approve' :
           actionType === 'deny' ? 'Deny' : 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>
    </motion.div>
  );
};

// Settings Tab Component
const SettingsTab = ({ id, mode = 'all', onTimelineUpdated, onSaveFabVisibilityChange }) => {
  const theme = useTheme();
  const timelineSurfaces = useMemo(() => getTimelineSurfaceTheme(theme), [theme]);
  const showTimelineSettings = mode === 'timeline' || mode === 'all';
  const showStatusCards = mode === 'status' || mode === 'all';
  const showQuoteCard = mode === 'quote' || mode === 'all';
  const showActionCards = mode === 'actions' || mode === 'all';
  const [isPrivate, setIsPrivate] = useState(false);
  const [requireMembershipApproval, setRequireMembershipApproval] = useState(false);
  const [postingRestrictionEnabled, setPostingRestrictionEnabled] = useState(false);
  const [postingMinRole, setPostingMinRole] = useState('moderator');
  const [showWarning, setShowWarning] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSavedState, setShowSavedState] = useState(false);
  
  // Snackbar states
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  
  // Action date states
  const [goldActionDate, setGoldActionDate] = useState(null);
  const [silverActionDate, setSilverActionDate] = useState(null);
  const [bronzeActionDate, setBronzeActionDate] = useState(null);
  
  // Threshold states
  const [goldThresholdType, setGoldThresholdType] = useState('members');
  const [goldThresholdValue, setGoldThresholdValue] = useState(100);
  const [silverThresholdType, setSilverThresholdType] = useState('members');
  const [silverThresholdValue, setSilverThresholdValue] = useState(50);
  const [bronzeThresholdType, setBronzeThresholdType] = useState('members');
  const [bronzeThresholdValue, setBronzeThresholdValue] = useState(5);
  
  // Action content states
  const [goldActionTitle, setGoldActionTitle] = useState('');
  const [goldActionDescription, setGoldActionDescription] = useState('');
  const [silverActionTitle, setSilverActionTitle] = useState('');
  const [silverActionDescription, setSilverActionDescription] = useState('');
  const [bronzeActionTitle, setBronzeActionTitle] = useState('');
  const [bronzeActionDescription, setBronzeActionDescription] = useState('');
  const [pendingActionResetType, setPendingActionResetType] = useState(null);
  const [actionResetDialogOpen, setActionResetDialogOpen] = useState(false);
  const [resetVotesByType, setResetVotesByType] = useState({ bronze: false, silver: false, gold: false });
  const [communityQuote, setCommunityQuote] = useState({
    text: "Those who make Peaceful Revolution impossible, will make violent Revolution inevitable.",
    author: "John F. Kennedy"
  });
  const [isRefreshingQuote, setIsRefreshingQuote] = useState(false);
  const [statusType, setStatusType] = useState('');
  const [statusHeader, setStatusHeader] = useState('');
  const [statusBody, setStatusBody] = useState('');
  
  // Timeline data loaded from backend
  const [timelineData, setTimelineData] = useState(null);
  const [isLoadingTimeline, setIsLoadingTimeline] = useState(true);
  const [privacyChangedAt, setPrivacyChangedAt] = useState(null);
  const [cooldownDaysLeft, setCooldownDaysLeft] = useState(null);
  const [isChangingVisibility, setIsChangingVisibility] = useState(false);
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [coverPortraitImageUrl, setCoverPortraitImageUrl] = useState('');
  const [coverLandscapeImageUrl, setCoverLandscapeImageUrl] = useState('');
  const [coverUploadEnabled, setCoverUploadEnabled] = useState(true);
  const [portraitPosition, setPortraitPosition] = useState({ x: 50, y: 50 });
  const [landscapePosition, setLandscapePosition] = useState({ x: 50, y: 50 });
  const [portraitZoom, setPortraitZoom] = useState(1);
  const [landscapeZoom, setLandscapeZoom] = useState(1);
  const [activeFrameTarget, setActiveFrameTarget] = useState('landscape');
  const joystickRef = useRef(null);
  const joystickDragRef = useRef(null);
  const [pendingCoverPortraitFile, setPendingCoverPortraitFile] = useState(null);
  const [pendingCoverLandscapeFile, setPendingCoverLandscapeFile] = useState(null);
  const [pendingCoverPortraitPreviewUrl, setPendingCoverPortraitPreviewUrl] = useState('');
  const [pendingCoverLandscapePreviewUrl, setPendingCoverLandscapePreviewUrl] = useState('');
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [siteRole, setSiteRole] = useState(null);
  const [isSiteAdmin, setIsSiteAdmin] = useState(false);

  useEffect(() => {
    if (typeof onSaveFabVisibilityChange === 'function') {
      onSaveFabVisibilityChange(hasUnsavedChanges || showSavedState);
    }
    return () => {
      if (typeof onSaveFabVisibilityChange === 'function') {
        onSaveFabVisibilityChange(false);
      }
    };
  }, [hasUnsavedChanges, showSavedState, onSaveFabVisibilityChange]);

  const portraitPreviewUrl = pendingCoverPortraitPreviewUrl || coverPortraitImageUrl;
  const landscapePreviewUrl = pendingCoverLandscapePreviewUrl || coverLandscapeImageUrl;
  const hasPortraitPreview = Boolean(portraitPreviewUrl);
  const hasLandscapePreview = Boolean(landscapePreviewUrl);
  const activeCoverPreviewUrl = activeFrameTarget === 'portrait' ? portraitPreviewUrl : landscapePreviewUrl;
  const hasActivePreview = activeFrameTarget === 'portrait' ? hasPortraitPreview : hasLandscapePreview;

  const FRAME_POSITION_MIN = -40;
  const FRAME_POSITION_MAX = 140;
  const JOYSTICK_SENSITIVITY = 0.42;
  const CAMERA_PAN_MULTIPLIER = 0.9;

  const clampPercent = useCallback((value) => Math.max(0, Math.min(100, Number(value) || 0)), []);
  const clampFramePosition = useCallback((value, defaultValue = 50) => {
    const numeric = Number(value);
    const safe = Number.isFinite(numeric) ? numeric : Number(defaultValue);
    return Math.max(FRAME_POSITION_MIN, Math.min(FRAME_POSITION_MAX, safe));
  }, [FRAME_POSITION_MIN, FRAME_POSITION_MAX]);
  const clampZoom = useCallback((value) => Math.max(1, Math.min(4.875, Number(value) || 1)), []);
  const getFrameTranslate = useCallback((value) => {
    const centered = clampFramePosition(value, 50) - 50;
    return centered * CAMERA_PAN_MULTIPLIER;
  }, [clampFramePosition, CAMERA_PAN_MULTIPLIER]);
  const buildFrameTransform = useCallback((position, zoomValue, isPrivilegeEnabled = true) => {
    const tx = getFrameTranslate(position?.x);
    const ty = getFrameTranslate(position?.y);
    const safeZoom = clampZoom(zoomValue);
    const finalZoom = isPrivilegeEnabled ? safeZoom : (safeZoom + 0.08);
    return `translate(${tx}%, ${ty}%) scale(${finalZoom})`;
  }, [getFrameTranslate, clampZoom]);

  const handleJoystickPointerDown = useCallback((event) => {
    if (!hasActivePreview) return;
    if (event.cancelable) {
      event.preventDefault();
    }
    const targetPosition = activeFrameTarget === 'portrait' ? portraitPosition : landscapePosition;
    joystickDragRef.current = {
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startPositionX: clampFramePosition(targetPosition.x, 50),
      startPositionY: clampFramePosition(targetPosition.y, 50),
    };
    if (event.currentTarget.setPointerCapture) {
      event.currentTarget.setPointerCapture(event.pointerId);
    }
  }, [hasActivePreview, activeFrameTarget, portraitPosition, landscapePosition, clampFramePosition]);

  const handleJoystickPointerMove = useCallback((event) => {
    const drag = joystickDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    if (event.cancelable) {
      event.preventDefault();
    }
    const node = joystickRef.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    const width = Math.max(1, rect.width);
    const height = Math.max(1, rect.height);

    const deltaXPercent = ((event.clientX - drag.startClientX) / width) * 100 * JOYSTICK_SENSITIVITY;
    const deltaYPercent = ((event.clientY - drag.startClientY) / height) * 100 * JOYSTICK_SENSITIVITY;
    const next = {
      x: clampFramePosition(drag.startPositionX + deltaXPercent, 50),
      y: clampFramePosition(drag.startPositionY + deltaYPercent, 50),
    };

    if (activeFrameTarget === 'portrait') {
      setPortraitPosition(next);
    } else {
      setLandscapePosition(next);
    }
    setHasUnsavedChanges(true);
  }, [activeFrameTarget, clampFramePosition, JOYSTICK_SENSITIVITY]);

  const handleJoystickPointerUp = useCallback((event) => {
    if (joystickDragRef.current?.pointerId === event.pointerId) {
      joystickDragRef.current = null;
    }
  }, []);

  const activeJoystickPosition = activeFrameTarget === 'portrait' ? portraitPosition : landscapePosition;
  const joystickKnobPosition = {
    x: clampPercent(((clampFramePosition(activeJoystickPosition.x, 50) - FRAME_POSITION_MIN) / (FRAME_POSITION_MAX - FRAME_POSITION_MIN)) * 100),
    y: clampPercent(((clampFramePosition(activeJoystickPosition.y, 50) - FRAME_POSITION_MIN) / (FRAME_POSITION_MAX - FRAME_POSITION_MIN)) * 100),
  };

  const canManageImagePrivilege = isSiteAdmin || siteRole === 'SiteOwner';

  useEffect(() => {
    try {
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      const userId = Number(storedUser?.id || 0);
      if (!(userId > 0)) {
        setSiteRole(null);
        setIsSiteAdmin(false);
        return;
      }
      const passportKey = `user_passport_${userId}`;
      const passport = JSON.parse(localStorage.getItem(passportKey) || '{}');
      const resolvedSiteRole = passport?.site_role || (userId === 1 ? 'SiteOwner' : null);
      setSiteRole(resolvedSiteRole);
      setIsSiteAdmin(Boolean(passport?.is_site_admin) || userId === 1);
    } catch (error) {
      console.warn('[SettingsTab] Failed to parse local passport for site admin role:', error);
      setSiteRole(null);
      setIsSiteAdmin(false);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (pendingCoverPortraitPreviewUrl && pendingCoverPortraitPreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(pendingCoverPortraitPreviewUrl);
      }
      if (pendingCoverLandscapePreviewUrl && pendingCoverLandscapePreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(pendingCoverLandscapePreviewUrl);
      }
    };
  }, [pendingCoverLandscapePreviewUrl, pendingCoverPortraitPreviewUrl]);

  const validateCoverFile = useCallback((nextFile) => {
    if (!String(nextFile?.type || '').startsWith('image/')) {
      setSnackbarMessage('Please select an image file for the community cover.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return false;
    }

    const maxBytes = 10 * 1024 * 1024;
    if ((Number(nextFile?.size) || 0) > maxBytes) {
      setSnackbarMessage('Cover image must be 10 MB or less.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return false;
    }

    return true;
  }, []);

  const handleSelectPortraitCoverFile = useCallback((event) => {
    const nextFile = event?.target?.files?.[0];
    if (event?.target) {
      event.target.value = '';
    }
    if (!nextFile || !validateCoverFile(nextFile)) return;

    if (pendingCoverPortraitPreviewUrl && pendingCoverPortraitPreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(pendingCoverPortraitPreviewUrl);
    }

    setPendingCoverPortraitFile(nextFile);
    setPendingCoverPortraitPreviewUrl(URL.createObjectURL(nextFile));
  }, [pendingCoverPortraitPreviewUrl, validateCoverFile]);

  const handleSelectLandscapeCoverFile = useCallback((event) => {
    const nextFile = event?.target?.files?.[0];
    if (event?.target) {
      event.target.value = '';
    }
    if (!nextFile || !validateCoverFile(nextFile)) return;

    if (pendingCoverLandscapePreviewUrl && pendingCoverLandscapePreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(pendingCoverLandscapePreviewUrl);
    }

    setPendingCoverLandscapeFile(nextFile);
    setPendingCoverLandscapePreviewUrl(URL.createObjectURL(nextFile));
    setLandscapePosition({ x: 50, y: 50 });
    setLandscapeZoom(1);
  }, [pendingCoverLandscapePreviewUrl, validateCoverFile]);

  const uploadCoverFile = useCallback(async (file, uploadKind) => {
    if (!file) return '';

    const formData = new FormData();
    formData.append('file', file);
    formData.append('purpose', 'covers');

    const response = await api.post('/api/v1/uploads/media', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 30000,
    });

    const uploadedUrl = String(response?.data?.url || '').trim();
    if (!uploadedUrl) {
      throw new Error('No cover URL returned from upload response');
    }

    return uploadedUrl;
  }, [id]);

  const handleUploadPortraitCover = useCallback(async () => {
    if (!pendingCoverPortraitFile) return;

    try {
      setIsUploadingCover(true);
      const uploadedUrl = await uploadCoverFile(pendingCoverPortraitFile, 'timeline_cover_portrait');

      setCoverPortraitImageUrl(uploadedUrl);
      setPortraitPosition({ x: 50, y: 50 });
      setPortraitZoom(1);
      setTimelineData((prev) => ({
        ...(prev || {}),
        coverPortraitImageUrl: uploadedUrl,
        coverPortraitX: 50,
        coverPortraitY: 50,
        coverZoom: prev?.coverZoom ?? 1,
      }));
      setHasUnsavedChanges(true);
      setPendingCoverPortraitFile(null);
      if (pendingCoverPortraitPreviewUrl && pendingCoverPortraitPreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(pendingCoverPortraitPreviewUrl);
      }
      setPendingCoverPortraitPreviewUrl('');

      setSnackbarMessage('Portrait cover uploaded. Save settings to publish.');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (error) {
      console.error('[SettingsTab] Failed to upload portrait cover image:', error);
      const message = error?.response?.data?.error || error?.message || 'Failed to upload portrait cover image';
      setSnackbarMessage(message);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setIsUploadingCover(false);
    }
  }, [pendingCoverPortraitFile, pendingCoverPortraitPreviewUrl, uploadCoverFile]);

  const handleUploadLandscapeCover = useCallback(async () => {
    if (!pendingCoverLandscapeFile) return;

    try {
      setIsUploadingCover(true);
      const uploadedUrl = await uploadCoverFile(pendingCoverLandscapeFile, 'timeline_cover_landscape');

      setCoverLandscapeImageUrl(uploadedUrl);
      setLandscapePosition({ x: 50, y: 50 });
      setLandscapeZoom(1);
      setTimelineData((prev) => ({
        ...(prev || {}),
        coverLandscapeImageUrl: uploadedUrl,
        coverLandscapeX: 50,
        coverLandscapeY: 50,
        coverZoom: 1,
      }));
      setHasUnsavedChanges(true);
      setPendingCoverLandscapeFile(null);
      if (pendingCoverLandscapePreviewUrl && pendingCoverLandscapePreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(pendingCoverLandscapePreviewUrl);
      }
      setPendingCoverLandscapePreviewUrl('');

      setSnackbarMessage('Landscape cover uploaded. Save settings to publish.');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (error) {
      console.error('[SettingsTab] Failed to upload landscape cover image:', error);
      const message = error?.response?.data?.error || error?.message || 'Failed to upload landscape cover image';
      setSnackbarMessage(message);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setIsUploadingCover(false);
    }
  }, [pendingCoverLandscapeFile, pendingCoverLandscapePreviewUrl, uploadCoverFile]);

  const handleClearPortraitCoverImage = useCallback(() => {
    if (pendingCoverPortraitPreviewUrl && pendingCoverPortraitPreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(pendingCoverPortraitPreviewUrl);
    }
    setPendingCoverPortraitFile(null);
    setPendingCoverPortraitPreviewUrl('');
    setCoverPortraitImageUrl('');
    setPortraitPosition({ x: 50, y: 50 });
    setPortraitZoom(1);
    setTimelineData((prev) => ({
      ...(prev || {}),
      coverPortraitImageUrl: '',
      coverPortraitX: 50,
      coverPortraitY: 50,
    }));
    setHasUnsavedChanges(true);
  }, [pendingCoverPortraitPreviewUrl]);

  const handleClearLandscapeCoverImage = useCallback(() => {
    if (pendingCoverLandscapePreviewUrl && pendingCoverLandscapePreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(pendingCoverLandscapePreviewUrl);
    }
    setPendingCoverLandscapeFile(null);
    setPendingCoverLandscapePreviewUrl('');
    setCoverLandscapeImageUrl('');
    setLandscapePosition({ x: 50, y: 50 });
    setLandscapeZoom(1);
    setTimelineData((prev) => ({
      ...(prev || {}),
      coverLandscapeImageUrl: '',
      coverLandscapeX: 50,
      coverLandscapeY: 50,
      coverZoom: 1,
    }));
    setHasUnsavedChanges(true);
  }, [pendingCoverLandscapePreviewUrl]);
  
  // Load saved settings from backend API
  useEffect(() => {
    const loadSettingsData = async () => {
      try {
        console.log(`[SettingsTab] Loading settings for timeline ${id}`);
        
        // Load timeline details first
        setIsLoadingTimeline(true);
        const timelineDetails = await getTimelineDetails(id);
        const countResponse = await getTimelineMemberCount(id);
        const totalCount = countResponse?.count ?? timelineDetails?.member_count ?? 0;
        console.log(`[SettingsTab] Timeline details:`, timelineDetails);
        
        if (timelineDetails) {
          setTimelineData({
            id: timelineDetails.id,
            name: timelineDetails.name,
            description: timelineDetails.description || '',
            memberCount: totalCount,
            createdDate: timelineDetails.created_at ? new Date(timelineDetails.created_at).toLocaleDateString() : 'Unknown',
            visibility: timelineDetails.visibility || 'public',
            createdBy: timelineDetails.created_by,
            privacyChangedAt: timelineDetails.privacy_changed_at,
            coverImageUrl: '',
            coverPortraitImageUrl: String(timelineDetails.cover_portrait_image_url || '').trim(),
            coverLandscapeImageUrl: String(timelineDetails.cover_landscape_image_url || '').trim(),
            coverUploadEnabled: timelineDetails.cover_upload_enabled !== false,
            coverPortraitX: Number(timelineDetails.cover_portrait_x ?? 50),
            coverPortraitY: Number(timelineDetails.cover_portrait_y ?? 50),
            coverLandscapeX: Number(timelineDetails.cover_landscape_x ?? 50),
            coverLandscapeY: Number(timelineDetails.cover_landscape_y ?? 50),
            coverZoom: Number(timelineDetails.cover_landscape_zoom ?? 1),
          });

          setCoverImageUrl('');
          setCoverPortraitImageUrl(String(timelineDetails.cover_portrait_image_url || '').trim());
          setCoverLandscapeImageUrl(String(timelineDetails.cover_landscape_image_url || '').trim());
          setCoverUploadEnabled(timelineDetails.cover_upload_enabled !== false);
          setPortraitPosition({
            x: clampFramePosition(timelineDetails.cover_portrait_x ?? 50),
            y: clampFramePosition(timelineDetails.cover_portrait_y ?? 50),
          });
          setLandscapePosition({
            x: clampFramePosition(timelineDetails.cover_landscape_x ?? 50),
            y: clampFramePosition(timelineDetails.cover_landscape_y ?? 50),
          });
          const loadedPortraitZoom = clampZoom(timelineDetails.cover_portrait_zoom ?? 1);
          const loadedLandscapeZoom = clampZoom(timelineDetails.cover_landscape_zoom ?? 1);
          setPortraitZoom(loadedPortraitZoom);
          setLandscapeZoom(loadedLandscapeZoom);
          
          // Set initial privacy state from backend
          setIsPrivate(timelineDetails.visibility === 'private');
          
          // Set requires_approval state from backend
          setRequireMembershipApproval(timelineDetails.requires_approval || false);
          console.log(`[SettingsTab] Loaded requires_approval: ${timelineDetails.requires_approval}`);

          const loadedPostingRestrictionEnabled = Boolean(timelineDetails.posting_restriction_enabled);
          const loadedPostingMinRole = String(timelineDetails.posting_min_role || 'moderator').toLowerCase() === 'admin'
            ? 'admin'
            : 'moderator';
          setPostingRestrictionEnabled(loadedPostingRestrictionEnabled);
          setPostingMinRole(loadedPostingMinRole);
          
          // Calculate cooldown if privacy was changed
          console.log(`[SettingsTab] privacy_changed_at from backend:`, timelineDetails.privacy_changed_at);
          console.log(`[SettingsTab] Current visibility:`, timelineDetails.visibility);
          
          if (timelineDetails.privacy_changed_at) {
            setPrivacyChangedAt(new Date(timelineDetails.privacy_changed_at));
            const changedDate = new Date(timelineDetails.privacy_changed_at);
            const cooldownEnd = new Date(changedDate);
            cooldownEnd.setDate(cooldownEnd.getDate() + 10);
            const now = new Date();
            const daysLeft = Math.ceil((cooldownEnd - now) / (1000 * 60 * 60 * 24));
            
            console.log(`[SettingsTab] Cooldown calculation:`, {
              changedDate: changedDate.toISOString(),
              cooldownEnd: cooldownEnd.toISOString(),
              now: now.toISOString(),
              daysLeft
            });
            
            // Always set cooldown days left (even if 0 or negative) to show the chip
            setCooldownDaysLeft(daysLeft);
            console.log(`[SettingsTab] Cooldown set to: ${daysLeft} days left`);
          } else {
            console.log(`[SettingsTab] No privacy_changed_at timestamp, cooldown not set`);
          }
        }
        setIsLoadingTimeline(false);
        
        // Load existing action cards from backend
        const actionsResult = await getTimelineActions(id);
        
        if (actionsResult.success && actionsResult.actions) {
          console.log(`[AdminPanel] Loaded ${actionsResult.actions.length} action cards`);
          
          // Process each action card
          actionsResult.actions.forEach(action => {
            const actionType = action.action_type;
            
            if (actionType === 'gold') {
              setGoldActionTitle(action.title || '');
              setGoldActionDescription(action.description || '');
              setGoldActionDate(action.due_date ? new Date(action.due_date) : null);
              setGoldThresholdType(action.threshold_type || 'members');
              setGoldThresholdValue(action.threshold_value || 25);
            } else if (actionType === 'silver') {
              setSilverActionTitle(action.title || '');
              setSilverActionDescription(action.description || '');
              setSilverActionDate(action.due_date ? new Date(action.due_date) : null);
              setSilverThresholdType(action.threshold_type || 'members');
              setSilverThresholdValue(action.threshold_value || 10);
            } else if (actionType === 'bronze') {
              setBronzeActionTitle(action.title || '');
              setBronzeActionDescription(action.description || '');
              setBronzeActionDate(action.due_date ? new Date(action.due_date) : null);
              setBronzeThresholdType(action.threshold_type || 'members');
              setBronzeThresholdValue(action.threshold_value || 5);
            }
          });
        } else {
          console.log('[AdminPanel] No existing action cards found, using defaults');
          // Set default threshold values if no actions exist
          setGoldThresholdValue(25);
          setSilverThresholdValue(10);
          setBronzeThresholdValue(5);
        }
        
        // requires_approval is now loaded from backend (timelineDetails.requires_approval)
        // No need for localStorage fallback
        
        // Load community quote from API (primary source)
        try {
          const quoteResponse = await getTimelineQuote(id);
          if (quoteResponse.success) {
            setCommunityQuote({
              text: quoteResponse.quote.text,
              author: quoteResponse.quote.author
            });
          }
        } catch (quoteError) {
          console.error('[AdminPanel] Error loading quote from API:', quoteError);
          // Keep localStorage fallback or default quote
        }

        // Load status message for timeline
        try {
          const statusResponse = await getTimelineStatusMessage(id);
          if (statusResponse && statusResponse.active) {
            setStatusType(statusResponse.status_type || '');
            setStatusHeader(statusResponse.status_header || '');
            setStatusBody(statusResponse.status_body || '');
          } else {
            setStatusType('');
            setStatusHeader('');
            setStatusBody('');
          }
        } catch (statusError) {
          console.error('[AdminPanel] Error loading status message:', statusError);
        }
        
      } catch (error) {
        console.error('[AdminPanel] Error loading action cards:', error);
        // Set default values on error
        setGoldThresholdValue(25);
        setSilverThresholdValue(10);
        setBronzeThresholdValue(5);
      }
    };
    
    if (id) {
      loadSettingsData();
    }
  }, [id, clampFramePosition, clampZoom]);
  
  // Live countdown timer - updates every minute
  useEffect(() => {
    if (!privacyChangedAt) return;
    
    const updateCooldown = () => {
      const cooldownEnd = new Date(privacyChangedAt);
      cooldownEnd.setDate(cooldownEnd.getDate() + 10);
      const now = new Date();
      const daysLeft = Math.ceil((cooldownEnd - now) / (1000 * 60 * 60 * 24));
      
      setCooldownDaysLeft(daysLeft);
      console.log(`[SettingsTab] Cooldown timer updated: ${daysLeft} days left`);
    };
    
    // Update immediately
    updateCooldown();
    
    // Then update every minute
    const interval = setInterval(updateCooldown, 60000);
    
    return () => clearInterval(interval);
  }, [privacyChangedAt]);
  
  // Handle visibility change locally (persisted on Save Changes)
  const handleVisibilityChange = (event) => {
    const newValue = event.target.checked;
    setIsPrivate(newValue);
    setShowWarning(newValue);
    setHasUnsavedChanges(true);

    // Keep immediate UI feedback for cooldown chip while deferring enforcement to Save.
    if (newValue && cooldownDaysLeft === null) {
      setCooldownDaysLeft(10);
    }
  };
  
  // Handle quote refresh
  const refreshQuote = async () => {
    try {
      setIsRefreshingQuote(true);
      
      // Load the default JFK quote
      setCommunityQuote({
        text: "Those who make Peaceful Revolution impossible, will make violent Revolution inevitable.",
        author: "John F. Kennedy"
      });
      
      // Trigger unsaved changes to show the FAB save button
      setHasUnsavedChanges(true);
      
    } catch (error) {
      console.error('[AdminPanel] Error refreshing quote:', error);
    } finally {
      setIsRefreshingQuote(false);
    }
  };

  const handleStatusReset = () => {
    setStatusType('');
    setStatusHeader('');
    setStatusBody('');
    setHasUnsavedChanges(true);
  };

  const handleOpenActionResetDialog = (actionType) => {
    setPendingActionResetType(actionType);
    setActionResetDialogOpen(true);
  };

  const handleCloseActionResetDialog = () => {
    setActionResetDialogOpen(false);
    setPendingActionResetType(null);
  };

  const handleConfirmActionReset = () => {
    if (!pendingActionResetType) {
      handleCloseActionResetDialog();
      return;
    }

    if (pendingActionResetType === 'gold') {
      setGoldActionTitle('');
      setGoldActionDescription('');
      setGoldActionDate(null);
      setGoldThresholdType('members');
      setGoldThresholdValue(25);
    } else if (pendingActionResetType === 'silver') {
      setSilverActionTitle('');
      setSilverActionDescription('');
      setSilverActionDate(null);
      setSilverThresholdType('members');
      setSilverThresholdValue(10);
    } else if (pendingActionResetType === 'bronze') {
      setBronzeActionTitle('');
      setBronzeActionDescription('');
      setBronzeActionDate(null);
      setBronzeThresholdType('members');
      setBronzeThresholdValue(5);
    }

    setResetVotesByType((prev) => ({ ...prev, [pendingActionResetType]: true }));
    setHasUnsavedChanges(true);
    handleCloseActionResetDialog();
  };
  
  // Handle save changes
  const handleSaveChanges = async () => {
    try {
      setIsSaving(true);
      setShowSavedState(false);
      console.log(`[SettingsTab] Saving settings for timeline ${id}...`);
      let resolvedPortraitUrl = String(coverPortraitImageUrl || '').trim();
      let resolvedLandscapeUrl = String(coverLandscapeImageUrl || '').trim();
      let resolvedCoverUploadEnabled = coverUploadEnabled;

      if (pendingCoverPortraitFile) {
        try {
          const uploadedUrl = await uploadCoverFile(pendingCoverPortraitFile, 'timeline_cover_portrait');
          resolvedPortraitUrl = uploadedUrl;
          setCoverPortraitImageUrl(uploadedUrl);
          setPendingCoverPortraitFile(null);
          if (pendingCoverPortraitPreviewUrl && pendingCoverPortraitPreviewUrl.startsWith('blob:')) {
            URL.revokeObjectURL(pendingCoverPortraitPreviewUrl);
          }
          setPendingCoverPortraitPreviewUrl('');
        } catch (uploadError) {
          console.error('[SettingsTab] Failed to upload portrait cover image during save:', uploadError);
          throw uploadError;
        }
      }

      if (pendingCoverLandscapeFile) {
        try {
          const uploadedUrl = await uploadCoverFile(pendingCoverLandscapeFile, 'timeline_cover_landscape');
          resolvedLandscapeUrl = uploadedUrl;
          setCoverLandscapeImageUrl(uploadedUrl);
          setPendingCoverLandscapeFile(null);
          if (pendingCoverLandscapePreviewUrl && pendingCoverLandscapePreviewUrl.startsWith('blob:')) {
            URL.revokeObjectURL(pendingCoverLandscapePreviewUrl);
          }
          setPendingCoverLandscapePreviewUrl('');
        } catch (uploadError) {
          console.error('[SettingsTab] Failed to upload landscape cover image during save:', uploadError);
          throw uploadError;
        }
      }

      // Persist visibility only when user saves settings.
      const desiredVisibility = isPrivate ? 'private' : 'public';
      const persistedVisibility = String(timelineData?.visibility || 'public').toLowerCase();
      if (desiredVisibility !== persistedVisibility) {
        try {
          setIsChangingVisibility(true);
          const visibilityResult = await updateTimelineVisibility(id, desiredVisibility);
          const changedAtIso = visibilityResult?.privacy_changed_at || null;

          setTimelineData((prev) => ({
            ...(prev || {}),
            visibility: desiredVisibility,
            privacyChangedAt: changedAtIso,
          }));

          if (changedAtIso) {
            const changedDate = new Date(changedAtIso);
            setPrivacyChangedAt(changedDate);
            const cooldownEnd = new Date(changedDate);
            cooldownEnd.setDate(cooldownEnd.getDate() + 10);
            const now = new Date();
            const daysLeft = Math.ceil((cooldownEnd - now) / (1000 * 60 * 60 * 24));
            setCooldownDaysLeft(daysLeft);
          } else if (desiredVisibility === 'public') {
            setPrivacyChangedAt(null);
            setCooldownDaysLeft(null);
          }
        } catch (visibilityError) {
          console.error('[SettingsTab] Error saving visibility:', visibilityError);
          throw visibilityError;
        } finally {
          setIsChangingVisibility(false);
        }
      }
      
      // Save timeline description and requires_approval to backend
      try {
        console.log(`[SettingsTab] Updating timeline settings (description, requires_approval)...`);
        // Build update data matching backend schema (snake_case, _key not _url)
        const updateData = {
          requires_approval: requireMembershipApproval,
          posting_restriction_enabled: postingRestrictionEnabled,
          posting_min_role: postingMinRole,
        };

        // Only include cover fields if they have values (backend uses _key not _url)
        if (resolvedPortraitUrl) {
          updateData.cover_portrait_key = extractKeyFromUrl(resolvedPortraitUrl);
        }
        if (resolvedLandscapeUrl) {
          updateData.cover_landscape_key = extractKeyFromUrl(resolvedLandscapeUrl);
        }
        
        // Position and zoom fields
        if (portraitPosition.x !== undefined) {
          updateData.cover_portrait_x = clampFramePosition(portraitPosition.x);
        }
        if (portraitPosition.y !== undefined) {
          updateData.cover_portrait_y = clampFramePosition(portraitPosition.y);
        }
        if (landscapePosition.x !== undefined) {
          updateData.cover_landscape_x = clampFramePosition(landscapePosition.x);
        }
        if (landscapePosition.y !== undefined) {
          updateData.cover_landscape_y = clampFramePosition(landscapePosition.y);
        }
        if (portraitZoom !== undefined) {
          updateData.cover_portrait_zoom = clampZoom(portraitZoom);
        }
        if (landscapeZoom !== undefined) {
          updateData.cover_landscape_zoom = clampZoom(landscapeZoom);
        }
        
        // Only include description if it exists
        if (timelineData && timelineData.description !== undefined) {
          updateData.description = timelineData.description;
        }
        
        const updatedTimeline = await updateTimelineDetails(id, updateData);
        if (updatedTimeline) {
          const updatedPortraitImageUrl = String(updatedTimeline.cover_portrait_image_url || resolvedPortraitUrl || '').trim();
          const updatedLandscapeImageUrl = String(updatedTimeline.cover_landscape_image_url || resolvedLandscapeUrl || '').trim();
          const updatedCoverUploadEnabled = updatedTimeline.cover_upload_enabled !== false;
          const updatedPortraitX = clampFramePosition(updatedTimeline.cover_portrait_x ?? portraitPosition.x);
          const updatedPortraitY = clampFramePosition(updatedTimeline.cover_portrait_y ?? portraitPosition.y);
          const updatedLandscapeX = clampFramePosition(updatedTimeline.cover_landscape_x ?? landscapePosition.x);
          const updatedLandscapeY = clampFramePosition(updatedTimeline.cover_landscape_y ?? landscapePosition.y);
          const updatedPortraitZoom = clampZoom(updatedTimeline.cover_portrait_zoom ?? portraitZoom);
          const updatedLandscapeZoom = clampZoom(updatedTimeline.cover_landscape_zoom ?? landscapeZoom);

          setTimelineData((prev) => ({
            ...(prev || {}),
            id: updatedTimeline.id ?? prev?.id,
            name: updatedTimeline.name ?? prev?.name,
            description: updatedTimeline.description ?? prev?.description,
            postingRestrictionEnabled: Boolean(updatedTimeline.posting_restriction_enabled),
            postingMinRole: String(updatedTimeline.posting_min_role || 'moderator').toLowerCase() === 'admin' ? 'admin' : 'moderator',
            coverPortraitImageUrl: updatedPortraitImageUrl,
            coverLandscapeImageUrl: updatedLandscapeImageUrl,
            coverUploadEnabled: updatedCoverUploadEnabled,
            coverPortraitX: updatedPortraitX,
            coverPortraitY: updatedPortraitY,
            coverLandscapeX: updatedLandscapeX,
            coverLandscapeY: updatedLandscapeY,
            coverZoom: updatedLandscapeZoom,
          }));

          setCoverImageUrl('');
          setCoverPortraitImageUrl(updatedPortraitImageUrl);
          setCoverLandscapeImageUrl(updatedLandscapeImageUrl);
          setPostingRestrictionEnabled(Boolean(updatedTimeline.posting_restriction_enabled));
          setPostingMinRole(String(updatedTimeline.posting_min_role || 'moderator').toLowerCase() === 'admin' ? 'admin' : 'moderator');
          setCoverUploadEnabled(updatedCoverUploadEnabled);
          setPortraitPosition({ x: updatedPortraitX, y: updatedPortraitY });
          setLandscapePosition({ x: updatedLandscapeX, y: updatedLandscapeY });
          setPortraitZoom(updatedPortraitZoom);
          setLandscapeZoom(updatedLandscapeZoom);
          onTimelineUpdated?.(updatedTimeline);
        }
        console.log(`[SettingsTab] Timeline settings updated successfully. requires_approval: ${requireMembershipApproval}`);
      } catch (descError) {
        console.error('[SettingsTab] Error updating timeline settings:', descError);
        throw descError;
      }

      try {
        // Only save if we have a valid status message (backend requires header min 1 char)
        if (statusHeader && statusHeader.trim()) {
          await updateTimelineStatusMessage(id, {
            status_type: statusType || 'good',
            header: statusHeader.trim(),
            body: statusBody?.trim() || null,
            is_active: true
          });
        }
      } catch (statusError) {
        console.error('[SettingsTab] Error updating status message:', statusError);
        throw statusError;
      }
      
      console.log(`[SettingsTab] Saving action cards for timeline ${id}...`);
      
      // Create action objects for saving
      const actionsToSave = {};
      
      // Always send all three action types to handle both active and cleared states
      actionsToSave.gold = goldActionTitle ? {
        title: goldActionTitle,
        description: goldActionDescription,
        due_date: formatDateForAPI(goldActionDate),
        threshold_type: goldThresholdType,
        threshold_value: goldThresholdValue,
        reset_votes: resetVotesByType.gold,
        is_active: true
      } : {
        title: '', // Empty title to indicate cleared state
        description: '',
        due_date: null,
        threshold_type: 'members',
        threshold_value: 15,
        reset_votes: resetVotesByType.gold,
        is_active: false
      };
      
      actionsToSave.silver = silverActionTitle ? {
        title: silverActionTitle,
        description: silverActionDescription,
        due_date: formatDateForAPI(silverActionDate),
        threshold_type: silverThresholdType,
        threshold_value: silverThresholdValue,
        reset_votes: resetVotesByType.silver,
        is_active: true
      } : {
        title: '', // Empty title to indicate cleared state
        description: '',
        due_date: null,
        threshold_type: 'members',
        threshold_value: 10,
        reset_votes: resetVotesByType.silver,
        is_active: false
      };
      
      actionsToSave.bronze = bronzeActionTitle ? {
        title: bronzeActionTitle,
        description: bronzeActionDescription,
        due_date: formatDateForAPI(bronzeActionDate),
        threshold_type: bronzeThresholdType,
        threshold_value: bronzeThresholdValue,
        reset_votes: resetVotesByType.bronze,
        is_active: true
      } : {
        title: '', // Empty title to indicate cleared state
        description: '',
        due_date: null,
        threshold_type: bronzeThresholdType || 'members',
        threshold_value: bronzeThresholdValue || 5,
        reset_votes: resetVotesByType.bronze,
        is_active: false
      };
      
      // Save action cards to backend
      const saveResult = await saveTimelineActions(id, actionsToSave);
      
      if (saveResult.success) {
        console.log(`[SettingsTab] Successfully saved ${saveResult.saved.length} action cards`);
        
        // Show success message
        setSnackbarMessage('Settings Saved Successfully!');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
        setResetVotesByType({ bronze: false, silver: false, gold: false });
        
        // Reset unsaved changes flag and show saved state
        setHasUnsavedChanges(false);
        setIsSaving(false);
        setShowSavedState(true);
        
        // Auto-hide the saved state after 2 seconds
        setTimeout(() => {
          setShowSavedState(false);
        }, 2000);
        
        // Trigger member list refresh by updating localStorage timestamp
        localStorage.setItem('actionCardsLastUpdated', Date.now().toString());
        
        // Save quote to backend API
        try {
          const quoteResult = await updateTimelineQuote(id, {
            text: communityQuote.text,
            author: communityQuote.author
          });
          
          if (quoteResult.success) {
            console.log('[AdminPanel] Quote saved successfully:', quoteResult.message);
          } else {
            console.warn('[AdminPanel] Error saving quote:', quoteResult.error);
          }
        } catch (quoteError) {
          console.error('[AdminPanel] Error saving quote to API:', quoteError);
        }
        
      } else {
        console.error('[SettingsTab] Error saving action cards:', saveResult.errors);
        
        // Reset saving state
        setIsSaving(false);
        setShowSavedState(false);
        
        // Show error message
        const errorMessages = saveResult.errors.map(err => err.error).join(', ');
        setSnackbarMessage(`Error saving settings: ${errorMessages}`);
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      }
      
    } catch (error) {
      console.error('[SettingsTab] Error in handleSaveChanges:', error);
      
      // Reset saving state
      setIsSaving(false);
      setShowSavedState(false);
      
      // Show error message
      setSnackbarMessage('Failed to save settings. Please try again.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  let cardsSectionTitle = 'Image Cover Select';
  let cardsSectionDescription = 'Configure community timeline cover image selection and preview behavior.';
  if (mode === 'status') {
    cardsSectionTitle = 'Status Card Settings';
    cardsSectionDescription = 'Configure timeline status card messaging.';
  } else if (mode === 'quote') {
    cardsSectionTitle = 'Quote Card Settings';
    cardsSectionDescription = 'Configure the inspiration quote card shown in your community timeline.';
  } else if (mode === 'actions') {
    cardsSectionTitle = 'Action Card Settings';
    cardsSectionDescription = 'Configure how community members can contribute through action cards.';
  }

  const imageCoverSelectPanel = (
    <Paper
      elevation={0}
      sx={{
        mt: 3,
        p: 2.5,
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.01)',
      }}
    >
      <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
        Image Cover Select
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Upload portrait (1200x2100) and landscape (hero ratio 8:1, e.g. 1600x200) images separately.
      </Typography>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.8 }}>
          <Typography variant="caption" sx={{ fontWeight: 700 }}>Portrait Upload</Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.2 }}>
            <Button variant="outlined" component="label" disabled={isUploadingCover}>
              Choose Portrait
              <input hidden accept="image/*" type="file" onChange={handleSelectPortraitCoverFile} />
            </Button>
            <Button
              variant="contained"
              onClick={handleUploadPortraitCover}
              disabled={!pendingCoverPortraitFile || isUploadingCover}
            >
              {isUploadingCover ? 'Uploading...' : 'Upload Portrait'}
            </Button>
            <Button
              variant="text"
              color="error"
              onClick={handleClearPortraitCoverImage}
              disabled={isUploadingCover || !(coverPortraitImageUrl || pendingCoverPortraitPreviewUrl)}
            >
              Clear Portrait
            </Button>
          </Box>
          {pendingCoverPortraitFile ? (
            <Typography variant="caption" color="text.secondary">
              Ready: {pendingCoverPortraitFile.name} ({(pendingCoverPortraitFile.size / (1024 * 1024)).toFixed(2)} MB)
            </Typography>
          ) : null}
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.8 }}>
          <Typography variant="caption" sx={{ fontWeight: 700 }}>Landscape Upload</Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.2 }}>
            <Button variant="outlined" component="label" disabled={isUploadingCover}>
              Choose Landscape
              <input hidden accept="image/*" type="file" onChange={handleSelectLandscapeCoverFile} />
            </Button>
            <Button
              variant="contained"
              onClick={handleUploadLandscapeCover}
              disabled={!pendingCoverLandscapeFile || isUploadingCover}
            >
              {isUploadingCover ? 'Uploading...' : 'Upload Landscape'}
            </Button>
            <Button
              variant="text"
              color="error"
              onClick={handleClearLandscapeCoverImage}
              disabled={isUploadingCover || !(coverLandscapeImageUrl || pendingCoverLandscapePreviewUrl)}
            >
              Clear Landscape
            </Button>
          </Box>
          {pendingCoverLandscapeFile ? (
            <Typography variant="caption" color="text.secondary">
              Ready: {pendingCoverLandscapeFile.name} ({(pendingCoverLandscapeFile.size / (1024 * 1024)).toFixed(2)} MB)
            </Typography>
          ) : null}
        </Box>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'minmax(220px, 260px) minmax(260px, 420px) minmax(180px, 220px)' }, gap: 2 }}>
        <Box>
          <Typography variant="caption" sx={{ display: 'block', mb: 0.7, fontWeight: 700 }}>
            Portrait Preview (1200 x 2100)
          </Typography>
          <Box
            sx={{
              width: '100%',
              aspectRatio: '4 / 7',
              borderRadius: 1.5,
              border: '1px solid',
              borderColor: 'divider',
              overflow: 'hidden',
              position: 'relative',
              bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
            }}
          >
            {portraitPreviewUrl ? (
              <Box
                component="img"
                src={portraitPreviewUrl}
                alt="Portrait cover preview"
                sx={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  objectPosition: '50% 50%',
                  filter: coverUploadEnabled ? 'none' : 'blur(18px) saturate(0.45)',
                  transform: buildFrameTransform(
                    portraitPosition,
                    portraitZoom,
                    coverUploadEnabled
                  ),
                }}
              />
            ) : (
              <Box sx={{ height: '100%', display: 'grid', placeItems: 'center', px: 1.5 }}>
                <Typography variant="caption" color="text.secondary" align="center">
                  No image selected yet
                </Typography>
              </Box>
            )}
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1.1, display: 'block' }}>
            Preview only.
          </Typography>
        </Box>

        <Box>
          <Typography variant="caption" sx={{ display: 'block', mb: 0.7, fontWeight: 700 }}>
            Landscape Preview (Hero Ratio 8:1)
          </Typography>
          <Box
            sx={{
              width: '100%',
              aspectRatio: '8 / 1',
              borderRadius: 1.5,
              border: '1px solid',
              borderColor: 'divider',
              overflow: 'hidden',
              position: 'relative',
              bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
            }}
          >
            {landscapePreviewUrl ? (
              <Box
                component="img"
                src={landscapePreviewUrl}
                alt="Landscape cover preview"
                sx={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  objectPosition: '50% 50%',
                  filter: coverUploadEnabled ? 'none' : 'blur(18px) saturate(0.45)',
                  transform: buildFrameTransform(
                    landscapePosition,
                    landscapeZoom,
                    coverUploadEnabled
                  ),
                }}
              />
            ) : (
              <Box sx={{ height: '100%', display: 'grid', placeItems: 'center', px: 1.5 }}>
                <Typography variant="caption" color="text.secondary" align="center">
                  No image selected yet
                </Typography>
              </Box>
            )}
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1.1, display: 'block' }}>
            Preview only.
          </Typography>
        </Box>

        <Box>
          <Typography variant="caption" sx={{ display: 'block', mb: 0.7, fontWeight: 700 }}>
            Framing Controls
          </Typography>
          <FormControlLabel
            sx={{ mb: 0.8 }}
            control={
              <Switch
                checked={activeFrameTarget === 'portrait'}
                disabled={!activeCoverPreviewUrl}
                onChange={(event) => {
                  setActiveFrameTarget(event.target.checked ? 'portrait' : 'landscape');
                }}
                size="small"
              />
            }
            label={activeFrameTarget === 'portrait' ? 'Editing Portrait' : 'Editing Landscape'}
          />

          <Box
            ref={joystickRef}
            onPointerDown={handleJoystickPointerDown}
            onPointerMove={handleJoystickPointerMove}
            onPointerUp={handleJoystickPointerUp}
            onPointerCancel={handleJoystickPointerUp}
            sx={{
              width: 140,
              height: 140,
              borderRadius: '50%',
              border: '1px solid',
              borderColor: 'divider',
              position: 'relative',
              mx: 'auto',
              mb: 1.2,
              touchAction: 'none',
              cursor: activeCoverPreviewUrl ? 'grab' : 'not-allowed',
              opacity: activeCoverPreviewUrl ? 1 : 0.5,
              background: theme.palette.mode === 'dark'
                ? 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 70%)'
                : 'radial-gradient(circle at 50% 50%, rgba(15,23,42,0.06) 0%, rgba(15,23,42,0.015) 70%)',
            }}
          >
            <Box
              sx={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                width: 12,
                height: 12,
                borderRadius: '50%',
                bgcolor: 'text.secondary',
                transform: 'translate(-50%, -50%)',
              }}
            />
            <Box
              sx={{
                position: 'absolute',
                left: `${joystickKnobPosition.x}%`,
                top: `${joystickKnobPosition.y}%`,
                width: 24,
                height: 24,
                borderRadius: '50%',
                transform: 'translate(-50%, -50%)',
                bgcolor: activeFrameTarget === 'portrait' ? 'warning.main' : 'primary.main',
                border: '2px solid rgba(255,255,255,0.9)',
                boxShadow: '0 2px 10px rgba(0,0,0,0.25)',
              }}
            />
          </Box>

          <Stack spacing={0.5}>
            <Typography variant="caption" color="text.secondary">Zoom</Typography>
            <Slider
              size="small"
              value={activeFrameTarget === 'portrait' ? portraitZoom : landscapeZoom}
              min={1}
              max={4.875}
              step={0.01}
              disabled={!activeCoverPreviewUrl}
              onChange={(_, value) => {
                const zoomValue = Array.isArray(value) ? value[0] : value;
                const clampedZoom = clampZoom(zoomValue);
                if (activeFrameTarget === 'portrait') {
                  setPortraitZoom(clampedZoom);
                } else {
                  setLandscapeZoom(clampedZoom);
                }
                setHasUnsavedChanges(true);
              }}
            />
          </Stack>
        </Box>
      </Box>

      {canManageImagePrivilege ? (
        <Box sx={{ mt: 2.2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={coverUploadEnabled}
                onChange={(event) => {
                  setCoverUploadEnabled(event.target.checked);
                  setTimelineData((prev) => ({
                    ...(prev || {}),
                    coverUploadEnabled: event.target.checked,
                  }));
                  setHasUnsavedChanges(true);
                }}
                color="warning"
              />
            }
            label="Image Privilege"
          />
          <Typography variant="body2" color="text.secondary">
            {coverUploadEnabled
              ? 'Image Privilege is ON: cover image is displayed normally.'
              : 'Image Privilege is OFF: cover image is hard blurred for viewers.'}
          </Typography>
        </Box>
      ) : (
        <Alert severity="info" sx={{ mt: 2.2 }}>
          Image Privilege can be changed only by SiteOwner/SiteAdmin.
        </Alert>
      )}
    </Paper>
  );
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Timeline Settings */}
      <Box
        sx={{
          display: showTimelineSettings ? 'flex' : 'none',
          alignItems: 'center',
          mb: 3,
          pb: 2,
          borderBottom: '2px solid',
          borderColor: 'primary.main',
          width: 'fit-content',
        }}
      >
        <SettingsIcon sx={{ mr: 1, color: 'primary.main' }} />
        <Typography variant="h6" component="h2">
          Timeline Settings
        </Typography>
      </Box>
      
      {/* Timeline Info */}
      {timelineData && (
        <>
          {showTimelineSettings ? (
            <>
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 }
            }}
            initial="hidden"
            animate="visible"
            transition={{ duration: 0.5 }}
          >
            <Box sx={{ mb: 4 }}>
              <Typography variant="subtitle1" gutterBottom>
                Timeline Description
              </Typography>
              
              <Box sx={{ mt: 2 }}>
                
                <TextField
                  fullWidth
                  label="Description"
                  variant="outlined"
                  multiline
                  rows={3}
                  value={timelineData?.description || ''}
                  onChange={(e) => {
                    setTimelineData(prev => ({
                      ...prev,
                      description: e.target.value
                    }));
                    setHasUnsavedChanges(true);
                  }}
                  disabled={isLoadingTimeline}
                  sx={{ mb: 3 }}
                />
                
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="body1">
                    Member Count: <strong>{timelineData?.memberCount || 0}</strong>
                  </Typography>
                  <Typography variant="body1">
                    Created: <strong>{timelineData?.createdDate || 'Unknown'}</strong>
                  </Typography>
                </Box>

              </Box>
            </Box>
          </motion.div>

          <motion.div
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 }
            }}
            initial="hidden"
            animate="visible"
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Box sx={{ mb: 4 }}>
              <Typography variant="subtitle1" gutterBottom>
                Privacy Settings
              </Typography>
              
              <Box sx={{ mt: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={isPrivate}
                        onChange={handleVisibilityChange}
                        color="primary"
                        disabled={isChangingVisibility || isLoadingTimeline || isSaving}
                      />
                    }
                    label="Private Timeline"
                  />
                  
                  {/* Cooldown Countdown Chip - only show if timeline is private */}
                  {isPrivate && cooldownDaysLeft !== null && (
                    cooldownDaysLeft > 0 ? (
                      <Chip
                        icon={<LockIcon />}
                        label={`Cooldown: ${cooldownDaysLeft} day${cooldownDaysLeft !== 1 ? 's' : ''} left`}
                        color="warning"
                        size="small"
                        sx={{
                          fontWeight: 600,
                          animation: 'pulse 2s ease-in-out infinite',
                          '@keyframes pulse': {
                            '0%, 100%': { opacity: 1 },
                            '50%': { opacity: 0.7 }
                          }
                        }}
                      />
                    ) : (
                      <Chip
                        icon={<CheckCircleIcon />}
                        label="You may go Public now!"
                        color="success"
                        size="small"
                        sx={{
                          fontWeight: 600,
                          animation: 'glow 2s ease-in-out infinite',
                          '@keyframes glow': {
                            '0%, 100%': { boxShadow: '0 0 5px rgba(76, 175, 80, 0.5)' },
                            '50%': { boxShadow: '0 0 15px rgba(76, 175, 80, 0.8)' }
                          }
                        }}
                      />
                    )
                  )}
                </Box>
                
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {isPrivate ? 
                    "Only approved members can view this Timeline" : 
                    "Anyone can view this timeline. Posting/tagging access is controlled below."}
                </Typography>
                
                <Box sx={{ mt: 3, mb: 1 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={requireMembershipApproval}
                        onChange={(e) => {
                          setRequireMembershipApproval(e.target.checked);
                          setHasUnsavedChanges(true);
                        }}
                        color="primary"
                      />
                    }
                    label="Require Membership Approval"
                  />
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    {requireMembershipApproval ? 
                      "New members must be approved by an admin or moderator before they can join." : 
                      "Anyone can join this timeline without approval."}
                  </Typography>
                </Box>

                <Box sx={{ mt: 3, mb: 1 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={postingRestrictionEnabled}
                        onChange={(e) => {
                          setPostingRestrictionEnabled(e.target.checked);
                          setHasUnsavedChanges(true);
                        }}
                        color="primary"
                      />
                    }
                    label="Restrict Posting & Tagging"
                  />

                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    {postingRestrictionEnabled
                      ? (postingMinRole === 'admin'
                        ? 'Only admins can post new events or tag this community timeline.'
                        : 'Only moderators and admins can post new events or tag this community timeline.')
                      : (requireMembershipApproval
                        ? 'Posting follows normal membership rules: approved members can post/tag.'
                        : 'Posting follows normal membership rules: any joined member can post/tag.')}
                  </Typography>

                  <FormControl sx={{ mt: 2, minWidth: 260 }} size="small" disabled={!postingRestrictionEnabled}>
                    <InputLabel id="posting-min-role-label">Minimum posting role</InputLabel>
                    <Select
                      labelId="posting-min-role-label"
                      value={postingMinRole}
                      label="Minimum posting role"
                      onChange={(e) => {
                        setPostingMinRole(String(e.target.value || 'moderator'));
                        setHasUnsavedChanges(true);
                      }}
                    >
                      <MenuItem value="moderator">Moderator and above</MenuItem>
                      <MenuItem value="admin">Admin only</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
                
                <AnimatePresence>
                  {showWarning && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Alert severity="warning" sx={{ mt: 2 }}>
                        Switching to private mode has a 10-day cooldown period before you can switch back.
                      </Alert>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Box>
            </Box>
          </motion.div>
            </>
          ) : null}
          
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 }
            }}
            initial="hidden"
            animate="visible"
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Box sx={{ mb: 4, mt: 4 }}>
              <Box 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  mb: 3, 
                  pb: 2, 
                  borderBottom: '2px solid', 
                  borderColor: 'primary.main',
                  width: 'fit-content'
                }}
              >
                <SettingsIcon sx={{ mr: 1, color: 'primary.main', fontSize: 28 }} />
                <Typography variant="h6" component="h2" sx={{ fontWeight: 'bold' }}>
                  {cardsSectionTitle}
                </Typography>
              </Box>

              {showTimelineSettings ? imageCoverSelectPanel : null}

              {showStatusCards ? (
                <Paper 
                  elevation={0} 
                  sx={{ 
                    p: 3, 
                    mb: 4, 
                    borderRadius: 2,
                    background: timelineSurfaces.panel,
                    border: '1px solid',
                    borderColor: timelineSurfaces.panelBorder,
                    backdropFilter: timelineSurfaces.panelBlur,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
                  }}
                >
                  <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                    {cardsSectionDescription}
                  </Typography>

                {/* Status Message */}
                <Box sx={{ mb: 4, p: 3, borderRadius: 2, bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1, flexWrap: 'wrap', gap: 1 }}>
                    <Typography variant="subtitle2">
                      Status Message
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={handleStatusReset}
                      sx={{
                        color: 'primary.main',
                        '&:hover': {
                          bgcolor: 'primary.main',
                          color: 'white'
                        }
                      }}
                      title="Reset Status Message"
                    >
                      <RefreshIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Share a short status message that appears on the timeline. Warning status still overrides this.
                  </Typography>
                  <ToggleButtonGroup
                    value={statusType}
                    exclusive
                    onChange={(_event, newValue) => {
                      setStatusType(newValue || '');
                      setHasUnsavedChanges(true);
                    }}
                    sx={{ mb: 2, flexWrap: 'wrap' }}
                  >
                    <ToggleButton value="good" sx={{ textTransform: 'none', gap: 1 }}>
                      <VolunteerActivismRoundedIcon fontSize="small" />
                      Good News
                    </ToggleButton>
                    <ToggleButton value="bad" sx={{ textTransform: 'none', gap: 1 }}>
                      <ThumbDownAltRoundedIcon fontSize="small" />
                      Bad News
                    </ToggleButton>
                    <ToggleButton value="bronze_action" sx={{ textTransform: 'none', gap: 1 }}>
                      <Box component="span" sx={{ fontSize: '1rem', lineHeight: 1 }}>
                        🥉
                      </Box>
                      Bronze Action
                    </ToggleButton>
                    <ToggleButton value="silver_action" sx={{ textTransform: 'none', gap: 1 }}>
                      <Box component="span" sx={{ fontSize: '1rem', lineHeight: 1 }}>
                        🥈
                      </Box>
                      Silver Action
                    </ToggleButton>
                    <ToggleButton value="gold_action" sx={{ textTransform: 'none', gap: 1 }}>
                      <Box component="span" sx={{ fontSize: '1rem', lineHeight: 1 }}>
                        🥇
                      </Box>
                      Gold Action
                    </ToggleButton>
                  </ToggleButtonGroup>
                  <TextField
                    fullWidth
                    label="Sub-header (max 4 words)"
                    placeholder="E.g., Community Update"
                    variant="outlined"
                    value={statusHeader}
                    onChange={(e) => {
                      setStatusHeader(e.target.value);
                      setHasUnsavedChanges(true);
                    }}
                    helperText={`${(statusHeader.trim() ? statusHeader.trim().split(/\s+/).length : 0)} / 4 words • ${statusHeader.length}/120 chars`}
                    error={(statusHeader.trim() ? statusHeader.trim().split(/\s+/).length : 0) > 4 || statusHeader.length > 120}
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Status message body"
                    placeholder="Write a short update for your community"
                    variant="outlined"
                    value={statusBody}
                    onChange={(e) => {
                      setStatusBody(e.target.value);
                      setHasUnsavedChanges(true);
                    }}
                    helperText={`${statusBody.length}/320 chars`}
                    error={statusBody.length > 320}
                  />
                </Box>
              </Paper>
              ) : null}

              {showQuoteCard ? (
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    mb: 4,
                    borderRadius: 2,
                    background: timelineSurfaces.panel,
                    border: '1px solid',
                    borderColor: timelineSurfaces.panelBorder,
                    backdropFilter: timelineSurfaces.panelBlur,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
                  }}
                >
                  <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                    {cardsSectionDescription}
                  </Typography>
                  <Box sx={{ mb: 1, p: 3, borderRadius: 2, bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="subtitle2">
                        Inspiration Quote
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={refreshQuote}
                        disabled={isRefreshingQuote}
                        sx={{
                          color: 'primary.main',
                          '&:hover': {
                            bgcolor: 'primary.main',
                            color: 'white'
                          }
                        }}
                      >
                        <RefreshIcon
                          sx={{
                            fontSize: 18,
                            transform: isRefreshingQuote ? 'rotate(360deg)' : 'none',
                            transition: 'transform 0.6s ease-in-out'
                          }}
                        />
                      </IconButton>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      Write something inspiring to display to members when no actions are currently set.
                    </Typography>
                    <TextField
                      fullWidth
                      multiline
                      rows={2}
                      placeholder="E.g., 'Join us in building this community timeline! Your contributions make a difference.'"
                      variant="outlined"
                      value={communityQuote.text}
                      onChange={(e) => {
                        setCommunityQuote(prev => ({
                          ...prev,
                          text: e.target.value
                        }));
                        setHasUnsavedChanges(true);
                      }}
                      sx={{ mt: 1 }}
                    />
                    <TextField
                      fullWidth
                      label="Quote Author"
                      placeholder="E.g., 'John F. Kennedy'"
                      variant="outlined"
                      value={communityQuote.author}
                      onChange={(e) => {
                        setCommunityQuote(prev => ({
                          ...prev,
                          author: e.target.value
                        }));
                        setHasUnsavedChanges(true);
                      }}
                      sx={{ mt: 2 }}
                    />
                  </Box>
                </Paper>
              ) : null}
              
              {showActionCards ? (
                <>
              {/* Gold Action Field */}
              <Paper 
                elevation={0} 
                sx={{ 
                  mb: 4, 
                  p: 3, 
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  position: 'relative',
                  overflow: 'hidden',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '4px',
                    bgcolor: '#FFD700',
                    boxShadow: '0 0 8px #FFD700'
                  }
                }}
              >
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box component="span" sx={{ 
                      width: 20, 
                      height: 20, 
                      borderRadius: '50%', 
                      bgcolor: '#FFD700', 
                      mr: 1.5,
                      display: 'inline-block',
                      boxShadow: '0 0 5px rgba(255, 215, 0, 0.7)'
                    }}></Box>
                    Gold Action
                  </Box>
                  <IconButton
                    size="small"
                    onClick={() => handleOpenActionResetDialog('gold')}
                    sx={{ 
                      color: '#FFD700',
                      '&:hover': { bgcolor: 'rgba(255, 215, 0, 0.1)' }
                    }}
                    title="Reset Gold Action and wipe tallies on save"
                  >
                    <RefreshIcon fontSize="small" />
                  </IconButton>
                </Typography>
                <TextField
                  fullWidth
                  label="Action Title"
                  placeholder="E.g., 'Create a comprehensive event'"
                  variant="outlined"
                  value={goldActionTitle}
                  onChange={(e) => {
                    setGoldActionTitle(e.target.value);
                    setHasUnsavedChanges(true);
                  }}
                  sx={{ mb: 2, mt: 1 }}
                />
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Action Description"
                  placeholder="Describe what members need to do to complete this action"
                  variant="outlined"
                  value={goldActionDescription}
                  onChange={(e) => {
                    setGoldActionDescription(e.target.value);
                    setHasUnsavedChanges(true);
                  }}
                  sx={{ mb: 2 }}
                />
                <FormControl fullWidth required sx={{ mt: 2 }}>
                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <DatePicker
                      label="Due Date (Required)"
                      value={goldActionDate}
                      onChange={(newValue) => {
                        setGoldActionDate(newValue);
                        setHasUnsavedChanges(true);
                      }}
                      slotProps={{
                        textField: {
                          required: true,
                          helperText: 'Set a deadline for this action',
                          variant: 'outlined'
                        }
                      }}
                    />
                  </LocalizationProvider>
                </FormControl>
                
                <Typography variant="subtitle2" gutterBottom sx={{ mt: 3 }}>
                  Threshold Requirements (Required)
                </Typography>
                <Box sx={{ 
                  p: 2, 
                  mt: 1, 
                  mb: 2, 
                  background: timelineSurfaces.glass,
                  borderRadius: 1,
                  position: 'relative',
                  border: `1px solid ${timelineSurfaces.glassBorder}`,
                  backdropFilter: 'blur(4px)',
                }}>
                  <Box sx={{ 
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1,
                  }}>
                    <Typography variant="h6" sx={{ 
                      color: 'primary.main', 
                      fontWeight: 'bold',
                      textShadow: '0px 0px 5px rgba(255, 255, 255, 0.8)',
                    }}>
                      {goldThresholdValue}/{goldThresholdType === 'members' ? 'Members' : 'Votes'} Needed to Unlock
                    </Typography>
                  </Box>
                  
                  <Stack spacing={2} sx={{ filter: 'blur(0px)', position: 'relative', zIndex: 2 }}>
                    <FormControl fullWidth required>
                      <InputLabel>Threshold Type</InputLabel>
                      <Select
                        value={goldThresholdType}
                        label="Threshold Type"
                        onChange={(e) => {
                          setGoldThresholdType(e.target.value);
                          setHasUnsavedChanges(true);
                        }}
                        required
                      >
                        <MenuItem value="members">New Members Incentive</MenuItem>
                        <MenuItem value="votes">Group Vote Incentive</MenuItem>
                      </Select>
                      <FormHelperText>
                        {goldThresholdType === 'members' ? 
                          'Requires new members to join before unlocking' : 
                          'Requires member votes/commitments before unlocking'}
                      </FormHelperText>
                    </FormControl>
                    
                    <TextField
                      fullWidth
                      required
                      label="Threshold Value"
                      type="number"
                      value={goldThresholdValue}
                      onChange={(e) => {
                        setGoldThresholdValue(Math.max(1, parseInt(e.target.value) || 0));
                        setHasUnsavedChanges(true);
                      }}
                      InputProps={{
                        endAdornment: <InputAdornment position="end">
                          {goldThresholdType === 'members' ? 'Members' : 'Votes'}
                        </InputAdornment>,
                      }}
                    />
                  </Stack>
                </Box>
              </Paper>
              
              {/* Silver Action Field */}
              <Paper 
                elevation={0} 
                sx={{ 
                  mb: 4, 
                  p: 3, 
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  position: 'relative',
                  overflow: 'hidden',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '4px',
                    bgcolor: '#C0C0C0',
                    boxShadow: '0 0 8px #C0C0C0'
                  }
                }}
              >
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box component="span" sx={{ 
                      width: 20, 
                      height: 20, 
                      borderRadius: '50%', 
                      bgcolor: '#C0C0C0', 
                      mr: 1.5,
                      display: 'inline-block',
                      boxShadow: '0 0 5px rgba(192, 192, 192, 0.7)'
                    }}></Box>
                    Silver Action
                  </Box>
                  <IconButton
                    size="small"
                    onClick={() => handleOpenActionResetDialog('silver')}
                    sx={{ 
                      color: '#C0C0C0',
                      '&:hover': { bgcolor: 'rgba(192, 192, 192, 0.1)' }
                    }}
                    title="Reset Silver Action and wipe tallies on save"
                  >
                    <RefreshIcon fontSize="small" />
                  </IconButton>
                </Typography>
                <TextField
                  fullWidth
                  label="Action Title"
                  placeholder="E.g., 'Add media to an existing event'"
                  variant="outlined"
                  value={silverActionTitle}
                  onChange={(e) => {
                    setSilverActionTitle(e.target.value);
                    setHasUnsavedChanges(true);
                  }}
                  sx={{ mb: 2, mt: 1 }}
                />
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Action Description"
                  placeholder="Describe what members need to do to complete this action"
                  variant="outlined"
                  value={silverActionDescription}
                  onChange={(e) => {
                    setSilverActionDescription(e.target.value);
                    setHasUnsavedChanges(true);
                  }}
                  sx={{ mb: 2 }}
                />
                <FormControl fullWidth sx={{ mt: 2 }}>
                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <DatePicker
                      label="Due Date (Optional)"
                      value={silverActionDate}
                      onChange={(newValue) => {
                        setSilverActionDate(newValue);
                        setHasUnsavedChanges(true);
                      }}
                      slotProps={{
                        textField: {
                          helperText: 'Optional deadline for this action',
                          variant: 'outlined'
                        }
                      }}
                    />
                  </LocalizationProvider>
                </FormControl>
                
                <Typography variant="subtitle2" gutterBottom sx={{ mt: 3 }}>
                  Threshold Requirements (Required)
                </Typography>
                <Box sx={{ 
                  p: 2, 
                  mt: 1, 
                  mb: 2, 
                  background: timelineSurfaces.glass,
                  borderRadius: 1,
                  position: 'relative',
                  border: `1px solid ${timelineSurfaces.glassBorder}`,
                  backdropFilter: 'blur(4px)',
                }}>
                  <Box sx={{ 
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1,
                  }}>
                    <Typography variant="h6" sx={{ 
                      color: 'primary.main', 
                      fontWeight: 'bold',
                      textShadow: '0px 0px 5px rgba(255, 255, 255, 0.8)',
                    }}>
                      {silverThresholdValue}/{silverThresholdType === 'members' ? 'Members' : 'Votes'} Needed to Unlock
                    </Typography>
                  </Box>
                  
                  <Stack spacing={2} sx={{ filter: 'blur(0px)', position: 'relative', zIndex: 2 }}>
                    <FormControl fullWidth required>
                      <InputLabel>Threshold Type</InputLabel>
                      <Select
                        value={silverThresholdType}
                        label="Threshold Type"
                        onChange={(e) => {
                          setSilverThresholdType(e.target.value);
                          setHasUnsavedChanges(true);
                        }}
                        required
                      >
                        <MenuItem value="members">New Members Incentive</MenuItem>
                        <MenuItem value="votes">Group Vote Incentive</MenuItem>
                      </Select>
                      <FormHelperText>
                        {silverThresholdType === 'members' ? 
                          'Requires new members to join before unlocking' : 
                          'Requires member votes/commitments before unlocking'}
                      </FormHelperText>
                    </FormControl>
                    
                    <TextField
                      fullWidth
                      required
                      label="Threshold Value"
                      type="number"
                      value={silverThresholdValue}
                      onChange={(e) => {
                        setSilverThresholdValue(Math.max(1, parseInt(e.target.value) || 0));
                        setHasUnsavedChanges(true);
                      }}
                      InputProps={{
                        endAdornment: <InputAdornment position="end">
                          {silverThresholdType === 'members' ? 'Members' : 'Votes'}
                        </InputAdornment>,
                      }}
                    />
                  </Stack>
                </Box>
              </Paper>
              
              {/* Bronze Action Field */}
              <Paper 
                elevation={0} 
                sx={{ 
                  mb: 4, 
                  p: 3, 
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  position: 'relative',
                  overflow: 'hidden',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '4px',
                    bgcolor: '#CD7F32',
                    boxShadow: '0 0 8px #CD7F32'
                  }
                }}
              >
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box component="span" sx={{ 
                      width: 20, 
                      height: 20, 
                      borderRadius: '50%', 
                      bgcolor: '#CD7F32', 
                      mr: 1.5,
                      display: 'inline-block',
                      boxShadow: '0 0 5px rgba(205, 127, 50, 0.7)'
                    }}></Box>
                    Bronze Action
                  </Box>
                  <IconButton
                    size="small"
                    onClick={() => handleOpenActionResetDialog('bronze')}
                    sx={{ 
                      color: '#CD7F32',
                      '&:hover': { bgcolor: 'rgba(205, 127, 50, 0.1)' }
                    }}
                    title="Reset Bronze Action and wipe tallies on save"
                  >
                    <RefreshIcon fontSize="small" />
                  </IconButton>
                </Typography>
                <TextField
                  fullWidth
                  label="Action Title"
                  placeholder="E.g., 'Comment on an event'"
                  variant="outlined"
                  value={bronzeActionTitle}
                  onChange={(e) => {
                    setBronzeActionTitle(e.target.value);
                    setHasUnsavedChanges(true);
                  }}
                  sx={{ mb: 2, mt: 1 }}
                />
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Action Description"
                  placeholder="Describe what members need to do to complete this action"
                  variant="outlined"
                  value={bronzeActionDescription}
                  onChange={(e) => {
                    setBronzeActionDescription(e.target.value);
                    setHasUnsavedChanges(true);
                  }}
                  sx={{ mb: 2 }}
                />
                <FormControl fullWidth sx={{ mt: 2 }}>
                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <DatePicker
                      label="Due Date (Optional)"
                      value={bronzeActionDate}
                      onChange={(newValue) => {
                        setBronzeActionDate(newValue);
                        setHasUnsavedChanges(true);
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          helperText="Optional deadline for this action"
                          variant="outlined"
                        />
                      )}
                    />
                  </LocalizationProvider>
                </FormControl>
                
                <Typography variant="subtitle1" gutterBottom sx={{ mt: 4, mb: 2, fontWeight: 'medium' }}>
                  Threshold Requirements (Optional)
                </Typography>
                <Box sx={{ 
                  p: 3, 
                  mt: 1, 
                  mb: 2, 
                  bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(205,127,50,0.05)', 
                  borderRadius: 2,
                  position: 'relative',
                  border: '1px solid',
                  borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(205,127,50,0.3)',
                  backdropFilter: 'blur(4px)',
                }}>
                  {bronzeThresholdType ? (
                    <Box sx={{ 
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 1,
                    }}>
                      <Typography variant="h6" sx={{ 
                        color: 'primary.main', 
                        fontWeight: 'bold',
                        textShadow: '0px 0px 5px rgba(255, 255, 255, 0.8)',
                      }}>
                        {bronzeThresholdValue}/{bronzeThresholdType === 'members' ? 'Members' : 'Votes'} Needed to Unlock
                      </Typography>
                    </Box>
                  ) : (
                    <Box sx={{ 
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 1,
                    }}>
                      <Typography variant="body1" sx={{ 
                        color: 'text.secondary', 
                        fontStyle: 'italic',
                        textShadow: '0px 0px 5px rgba(255, 255, 255, 0.8)',
                      }}>
                        No threshold requirements (optional for Bronze level)
                      </Typography>
                    </Box>
                  )}
                  
                  <Stack spacing={2} sx={{ filter: 'blur(0px)', position: 'relative', zIndex: 2 }}>
                    <FormControl fullWidth>
                      <InputLabel>Threshold Type</InputLabel>
                      <Select
                        value={bronzeThresholdType}
                        label="Threshold Type"
                        onChange={(e) => {
                          setBronzeThresholdType(e.target.value);
                          setHasUnsavedChanges(true);
                        }}
                      >
                        <MenuItem value="">No Threshold</MenuItem>
                        <MenuItem value="members">New Members Incentive</MenuItem>
                        <MenuItem value="votes">Group Vote Incentive</MenuItem>
                      </Select>
                      <FormHelperText>
                        {!bronzeThresholdType ? 
                          'No threshold requirements for this action' :
                          bronzeThresholdType === 'members' ? 
                            'Requires new members to join before unlocking' : 
                            'Requires member votes/commitments before unlocking'}
                      </FormHelperText>
                    </FormControl>
                    
                    {bronzeThresholdType && (
                      <TextField
                        fullWidth
                        label="Threshold Value"
                        type="number"
                        value={bronzeThresholdValue}
                        onChange={(e) => {
                          setBronzeThresholdValue(Math.max(1, parseInt(e.target.value) || 0));
                          setHasUnsavedChanges(true);
                        }}
                        InputProps={{
                          endAdornment: <InputAdornment position="end">
                            {bronzeThresholdType === 'members' ? 'Members' : 'Votes'}
                          </InputAdornment>,
                        }}
                      />
                    )}
                  </Stack>
                </Box>
              </Paper>
              
              <Paper 
                elevation={0}
                sx={{ 
                  mt: 4, 
                  p: 3, 
                  bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', 
                  borderRadius: 2,
                  border: '1px dashed',
                  borderColor: 'divider' 
                }}
              >
                <Typography variant="subtitle2" gutterBottom>
                  Coming Soon: Advanced Action Settings
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Additional settings for action requirements, rewards, and expiration dates will be available in a future update.
                </Typography>
              </Paper>
                </>
              ) : null}
            </Box>
          </motion.div>

          <Dialog
            open={actionResetDialogOpen}
            onClose={handleCloseActionResetDialog}
            aria-labelledby="action-reset-dialog-title"
            aria-describedby="action-reset-dialog-description"
          >
            <DialogTitle id="action-reset-dialog-title">Reset this action and wipe tallies?</DialogTitle>
            <DialogContent>
              <DialogContentText id="action-reset-dialog-description">
                This refresh action clears the current action content and marks all recorded votes for this tier in this community timeline for permanent deletion when you click <strong>Save Changes</strong>. This cannot be undone.
              </DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseActionResetDialog}>Cancel</Button>
              <Button variant="contained" color="error" onClick={handleConfirmActionReset}>
                Yes, reset action
              </Button>
            </DialogActions>
          </Dialog>

          {/* Floating Action Button for Save Changes */}
          <Portal>
            <AnimatePresence>
              {(hasUnsavedChanges || showSavedState) && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8, y: 20 }}
                  animate={{ 
                    opacity: 1, 
                    scale: 1, 
                    y: showSavedState ? 10 : 0,
                    transition: { type: 'spring', stiffness: 300, damping: 25 }
                  }}
                  exit={{ 
                    opacity: 0, 
                    scale: 0.8, 
                    y: 40,
                    transition: { duration: 0.3 }
                  }}
                  style={{
                    position: 'fixed',
                    bottom: '2rem',
                    right: '2rem',
                    zIndex: 1000,
                  }}
                >
                  <Button
                    variant="contained"
                    color={showSavedState ? 'success' : 'primary'}
                    onClick={handleSaveChanges}
                    disabled={isSaving || showSavedState}
                    sx={{
                      borderRadius: '28px',
                      padding: '12px 24px',
                      boxShadow: showSavedState 
                        ? '0 8px 16px rgba(76, 175, 80, 0.3)' 
                        : '0 8px 16px rgba(0,0,0,0.2)',
                      '&:hover': {
                        boxShadow: showSavedState 
                          ? '0 8px 16px rgba(76, 175, 80, 0.3)' 
                          : '0 12px 20px rgba(0,0,0,0.3)',
                      },
                      '&.Mui-disabled': {
                        color: 'white',
                        opacity: showSavedState ? 1 : 0.7
                      },
                      transition: 'all 0.3s ease'
                    }}
                    startIcon={
                      showSavedState ? <CheckCircleIcon /> : 
                      isSaving ? null : <SaveIcon />
                    }
                  >
                    {showSavedState ? 'SAVED!' : 
                     isSaving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </Portal>
          
          {/* Snackbar for notifications */}
          <Snackbar
            open={snackbarOpen}
            autoHideDuration={6000}
            onClose={() => setSnackbarOpen(false)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
          >
            <Alert 
              onClose={() => setSnackbarOpen(false)} 
              severity={snackbarSeverity}
              sx={{ width: '100%' }}
            >
              {snackbarMessage}
            </Alert>
          </Snackbar>
        </>
      )}
    </motion.div>
  );
};

const AdminPanelWithBoundary = (props) => (
  <ErrorBoundary>
    <AdminPanel {...props} />
  </ErrorBoundary>
);

export default AdminPanelWithBoundary;
