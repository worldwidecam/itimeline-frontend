import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  Fab
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
import { useParams } from 'react-router-dom';
import { Link as RouterLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import CommunityDotTabs from './CommunityDotTabs';
import api from '../../../utils/api';
import { getTimelineDetails, getTimelineMembers, getBlockedMembers, updateTimelineVisibility, updateTimelineDetails, removeMember, updateMemberRole, blockMember, unblockMember, getTimelineActions, saveTimelineActions, getTimelineActionByType, getTimelineQuote, updateTimelineQuote, checkMembershipStatus, syncUserPassport, listReports, acceptReport, resolveReport } from '../../../utils/api';
import UserAvatar from '../../common/UserAvatar';
import CommunityLockView from './CommunityLockView';
import EventPopup from '../events/EventPopup';
import ErrorBoundary from '../../ErrorBoundary';

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

const AdminPanel = () => {
  const { id } = useParams();
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
  const theme = useTheme();

  // Load data from backend API with access check
  useEffect(() => {
    // Load timeline details
    const loadTimelineData = async () => {
      try {
        setIsLoading(true);
        console.log('Fetching timeline details for ID:', id);
        const response = await getTimelineDetails(id);
        console.log('Timeline details response:', response);
        
        // Format the timeline data
        setTimelineData({
          name: response.name,
          description: response.description || '',
          visibility: response.visibility || 'public',
          createdAt: new Date(response.created_at).toISOString().split('T')[0],
          memberCount: response.member_count || 0,
          createdBy: response.created_by || response.createdBy || null
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
          createdBy: null
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
    
    // Test direct API call
    console.log('[AdminPanel] Testing direct getBlockedMembers call...');
    getBlockedMembers(id).then(result => {
      console.log('[AdminPanel] Direct API test result:', result);
    }).catch(err => {
      console.error('[AdminPanel] Direct API test failed:', err);
    });

    checkAccess();
    
    // Force load blocked members directly
    console.log('[AdminPanel] Force loading blocked members...');
    reloadBlockedMembers();
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
      try {
        await syncUserPassport();
      } catch (e) {
        console.warn('[AdminPanel] Passport sync failed after role change (continuing):', e);
      }
      await reloadMembers();
      setSnackbarMessage(`Updated role to ${newRole} for ${member?.name || 'member'}`);
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
      // 1.1 Sync passport to persist changes across sessions
      try {
        await syncUserPassport();
        console.log('[AdminPanel] Synced user passport after removal');
      } catch (syncErr) {
        console.warn('[AdminPanel] Passport sync failed after removal (continuing):', syncErr);
      }
      
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
      setSnackbarMessage(`${selectedMember.name} has been removed from the community`);
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
      // Sync passport to persist changes
      try {
        await syncUserPassport();
        console.log('[AdminPanel] Synced user passport after block');
      } catch (syncErr) {
        console.warn('[AdminPanel] Passport sync failed after block (continuing):', syncErr);
      }
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
      setSnackbarMessage(`${selectedMember.name} has been blocked from the community`);
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
      // Sync passport to persist changes
      try {
        await syncUserPassport();
        console.log('[AdminPanel] Synced user passport after unblock');
      } catch (syncErr) {
        console.warn('[AdminPanel] Passport sync failed after unblock (continuing):', syncErr);
      }
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
    switch(role) {
      case 'admin':
        return { bg: theme.palette.error.main, text: '#fff' };
      case 'moderator':
        return { bg: theme.palette.warning.main, text: '#000' };
      default:
        return { bg: theme.palette.primary.main, text: '#fff' };
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
                      label={<Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <DeleteOutlineIcon sx={{ mr: 1, fontSize: '1.1rem' }} />
                        <Typography variant="button" sx={{ fontWeight: memberTabValue === 1 ? 'bold' : 'normal' }}>
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
                                sx={{ mr: 2 }}
                              />
                              <Box>
                                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                  {member.username || member.name || 'Unknown User'}
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
                              {(() => {
                                const uid = member.userId ?? member.user_id ?? member.id;
                                const isSelf = currentUserId && Number(currentUserId) === Number(uid);
                                const isSiteOwner = Number(uid) === 1 || (member.role || '').toLowerCase() === 'siteowner';
                                const nextRole = getNextRole(member.role);
                                const prevRole = getPrevRole(member.role);
                                return (
                                  <>
                                    {!isSelf && !isSiteOwner && nextRole && (
                                      <IconButton
                                        size="small"
                                        onClick={() => performRoleChange(member, 'promote')}
                                        sx={{ color: 'info.main' }}
                                        title={`Promote to ${nextRole.charAt(0).toUpperCase() + nextRole.slice(1)}`}
                                      >
                                        <ModeratorIcon fontSize="small" />
                                      </IconButton>
                                    )}
                                    {!isSelf && !isSiteOwner && prevRole && (
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

                                  {/* Block button: hide for self; use red crossed circle icon */}
                                  {!(currentUserId && Number(currentUserId) === Number(member.userId ?? member.user_id ?? member.id)) && (
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
                
                {/* Blocked Members Tab */}
                {memberTabValue === 1 && (
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

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', px: 2, pb: 4 }}>
      {/* Timeline Name Display - Centered */}
      {timelineData && (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 3, mt: 2 }}>
          <Typography variant="h5" component="h1" sx={{ fontWeight: 'medium' }}>
            <Box component="span" sx={{ fontFamily: 'Lobster, cursive', mr: 0.5, color: 'primary.main' }}>i-</Box>
            {timelineData.name}
          </Typography>
        </Box>
      )}
      
      {/* Community Dot Tabs - Always visible at the top */}
      <CommunityDotTabs 
        timelineId={id} 
      />
      
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
            Remove {selectedMember?.name} from community?
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
            Block {selectedMember?.name} from community?
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
            Unblock {selectedMember?.name}?
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
            bgcolor: 'background.paper',
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
              {tabValue === 2 && <SettingsTab key="settings" id={id} />}
            </AnimatePresence>
          </Box>
        </Paper>
      </motion.div>
    </Box>
  );
};

// Manage Posts Tab Component
const ManagePostsTab = ({ timelineId }) => {
  const theme = useTheme();
  const [postTabValue, setPostTabValue] = useState(0); // 0 = All, 1 = Pending, 2 = Reviewing, 3 = Resolved
  const [selectedPost, setSelectedPost] = useState(null);
  const [confirmPostActionDialogOpen, setConfirmPostActionDialogOpen] = useState(false);
  const [postActionType, setPostActionType] = useState(''); // 'delete' or 'safeguard'
  const [eventPopupOpen, setEventPopupOpen] = useState(false);
  const [popupEvent, setPopupEvent] = useState(null);
  
  // Real data for reported posts (wired to /api/v1/timelines/:id/reports)
  const [reportedPosts, setReportedPosts] = useState([]);
  const [isLoadingReports, setIsLoadingReports] = useState(true);
  const [counts, setCounts] = useState({ all: 0, pending: 0, reviewing: 0, resolved: 0 });
  const [pageInfo, setPageInfo] = useState({ page: 1, page_size: 20, total: 0 });
  
  // Handle post tab change
  const handlePostTabChange = (event, newValue) => {
    setPostTabValue(newValue);
  };
  
  // Handle opening the confirmation dialog for different post actions
  const handleOpenPostActionDialog = (post, action) => {
    setSelectedPost(post);
    setPostActionType(action);
    setConfirmPostActionDialogOpen(true);
  };
  
  // Handle closing the confirmation dialog
  const handleClosePostActionDialog = () => {
    setConfirmPostActionDialogOpen(false);
    setSelectedPost(null);
    setPostActionType('');
  };

  // Open EventPopup overlay for investigation
  const handleViewEvent = async (post) => {
    try {
      if (!post?.eventId || !timelineId) return;
      // Fetch only the relevant event (optimization)
      const res = await api.get(`/api/timeline-v3/${timelineId}/events/${post.eventId}`);
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
  
  // Load reports from backend
  useEffect(() => {
    const fetchReports = async () => {
      if (!timelineId) return;
      try {
        setIsLoadingReports(true);
        const status = postTabValue === 1 ? 'pending' : postTabValue === 2 ? 'reviewing' : postTabValue === 3 ? 'resolved' : 'all';
        const data = await listReports(timelineId, { status, page: 1, page_size: 20 });
        // Normalize items into the structure used below
        const items = Array.isArray(data?.items) ? data.items : [];
        const mapped = items.map((it) => ({
          id: it.id || it.report_id || String(Math.random()),
          eventType: it.event_type || it.type || 'Event',
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
          reportId: it.id || it.report_id
        }));
        setReportedPosts(mapped);
        setCounts(data?.counts || { all: mapped.length, pending: mapped.filter(p=>p.status==='pending').length, reviewing: mapped.filter(p=>p.status==='reviewing').length, resolved: mapped.filter(p=>p.status==='resolved').length });
        setPageInfo({ page: data?.page || 1, page_size: data?.page_size || 20, total: data?.total || mapped.length });
      } catch (e) {
        console.warn('[ManagePostsTab] listReports failed (showing empty):', e);
        setReportedPosts([]);
        setCounts({ all: 0, pending: 0, reviewing: 0, resolved: 0 });
        setPageInfo({ page: 1, page_size: 20, total: 0 });
      } finally {
        setIsLoadingReports(false);
      }
    };
    fetchReports();
  }, [timelineId, postTabValue]);

  // Handle accepting a report for review
  const handleAcceptReport = async (post) => {
    try {
      await acceptReport(timelineId, post.reportId || post.id);
      // refresh current tab
      const status = postTabValue; // trigger useEffect by toggling
      setPostTabValue(status);
    } catch (e) {
      console.warn('[ManagePostsTab] acceptReport failed:', e);
    }
  };
  
  // Handle deleting a reported post
  const handleDeletePost = async () => {
    try {
      await resolveReport(timelineId, selectedPost?.reportId || selectedPost?.id, 'delete');
      setConfirmPostActionDialogOpen(false);
      const status = postTabValue; setPostTabValue(status);
    } catch (e) {
      console.warn('[ManagePostsTab] resolveReport(delete) failed:', e);
      setConfirmPostActionDialogOpen(false);
    }
  };
  
  // Handle safeguarding a post
  const handleSafeguardPost = async () => {
    try {
      await resolveReport(timelineId, selectedPost?.reportId || selectedPost?.id, 'safeguard');
      setConfirmPostActionDialogOpen(false);
      const status = postTabValue; setPostTabValue(status);
    } catch (e) {
      console.warn('[ManagePostsTab] resolveReport(safeguard) failed:', e);
      setConfirmPostActionDialogOpen(false);
    }
  };
  
  // Filter posts based on selected tab
  const filteredPosts = reportedPosts.filter(post => {
    if (postTabValue === 0) return true; // All posts
    if (postTabValue === 1) return post.status === 'pending'; // Pending posts
    if (postTabValue === 2) return post.status === 'reviewing'; // Reviewing posts
    if (postTabValue === 3) return post.status === 'resolved'; // Resolved posts
    return true;
  });
  
  // Count posts by status for tab badges
  const pendingCount = counts.pending;
  const reviewingCount = counts.reviewing;
  const resolvedCount = counts.resolved;
  
  // Helper to parse category from reason like "[website_policy] text" and return { chipLabel, chipColor, cleaned }
  const parseReasonCategory = (reasonRaw) => {
    const out = { chipLabel: null, chipColor: null, cleaned: reasonRaw || '' };
    if (!reasonRaw || typeof reasonRaw !== 'string') return out;
    const m = reasonRaw.match(/^\s*\[([^\]]+)\]\s*(.*)$/);
    if (!m) return out;
    const key = (m[1] || '').toLowerCase();
    out.cleaned = m[2] || '';
    if (key === 'website_policy') {
      out.chipLabel = 'Website Policy';
      out.chipColor = 'default';
    } else if (key === 'government_policy') {
      out.chipLabel = 'Government Policy';
      out.chipColor = 'warning';
    } else if (key === 'unethical_boundary') {
      out.chipLabel = 'Unethical Boundary';
      out.chipColor = 'error';
    }
    return out;
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
        sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab label={`All (${counts.all})`} />
        <Tab 
          label={`Pending (${pendingCount})`} 
          sx={{ 
            color: 'warning.main',
            fontWeight: 'bold'
          }} 
        />
        <Tab 
          label={`Reviewing (${reviewingCount})`} 
          sx={{ 
            color: 'info.main',
            fontWeight: 'bold'
          }} 
        />
        <Tab 
          label={`Resolved (${resolvedCount})`} 
          sx={{ 
            color: 'success.main',
            fontWeight: 'bold'
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
              const { chipLabel, chipColor, cleaned } = parseReasonCategory(post.reason);
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
                  elevation={1}
                  sx={{
                    p: 2,
                    mb: 2,
                    borderLeft: '4px solid',
                    borderColor: post.status === 'pending' ? 'warning.main' : 
                                post.status === 'reviewing' ? 'info.main' : 'success.main',
                    transition: 'transform 0.2s ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: 3
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="subtitle1" component="div" sx={{ fontWeight: 500 }}>
                        {post.eventType} Event
                      </Typography>
                      <Chip 
                        label={post.status.charAt(0).toUpperCase() + post.status.slice(1)}
                        size="small"
                        icon={statusColor.icon}
                        sx={{ 
                          ml: 2,
                          bgcolor: statusColor.bg,
                          color: statusColor.text,
                          fontWeight: 500
                        }}
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      Reported {post.reportDate}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Typography variant="body2">
                        <strong>Reporter:</strong>
                      </Typography>
                      {post.reporter?.avatar && (
                        <UserAvatar
                          name={post.reporter?.name || 'Reporter'}
                          avatarUrl={post.reporter?.avatar}
                          id={post.reporter?.id}
                          size={24}
                          sx={{ ml: 1 }}
                        />
                      )}
                      <Typography variant="body2">{post.reporter?.name || 'Reporter'}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Typography variant="body2">
                        <strong>Reason:</strong>
                      </Typography>
                      {chipLabel && (
                        <Chip label={chipLabel} size="small" color={chipColor} variant="outlined" />
                      )}
                      <Typography variant="body2">{cleaned}</Typography>
                    </Box>
                    {(post.status === 'reviewing' || post.status === 'resolved') && post.assignedModerator && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2">
                          <strong>Accepted by:</strong>
                        </Typography>
                        {post.assignedModerator.avatar && (
                          <UserAvatar
                            name={post.assignedModerator.name || 'Moderator'}
                            avatarUrl={post.assignedModerator.avatar}
                            id={post.assignedModerator.id}
                            size={22}
                          />
                        )}
                        <Typography variant="body2">{post.assignedModerator.name}</Typography>
                      </Box>
                    )}
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
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
                          color="error"
                          startIcon={<CancelIcon />}
                          onClick={() => handleOpenPostActionDialog(post, 'delete')}
                          sx={{ mr: 1 }}
                        >
                          Delete Post
                        </Button>
                        <Button
                          variant="outlined"
                          size="small"
                          color="success"
                          startIcon={<CheckCircleIcon />}
                          onClick={() => handleOpenPostActionDialog(post, 'safeguard')}
                        >
                          Safeguard Post
                        </Button>
                      </>
                    )}

                    {/* View Event button to jump to the event for investigation */}
                    {post.eventId && (
                      <Button
                        onClick={() => handleViewEvent(post)}
                        variant="text"
                        size="small"
                        sx={{ ml: 1 }}
                      >
                        View Event
                      </Button>
                    )}
                    
                    {post.status === 'resolved' && (
                      <Typography variant="body2" color="text.secondary">
                        Resolution: <strong>{post.resolution || 'Unknown'}</strong>
                      </Typography>
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
          {postActionType === 'delete' ? 'Delete Reported Post?' : 'Safeguard Post?'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="post-action-dialog-description">
            {postActionType === 'delete' ? 
              'This action will permanently remove this post from the timeline. This action cannot be undone.' : 
              'This action will mark the post as reviewed and safe, dismissing the report. The post will remain visible on the timeline.'}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePostActionDialog} color="primary">
            Cancel
          </Button>
          <Button 
            onClick={postActionType === 'delete' ? handleDeletePost : handleSafeguardPost} 
            color={postActionType === 'delete' ? 'error' : 'success'} 
            variant="contained"
            startIcon={postActionType === 'delete' ? <CancelIcon /> : <CheckCircleIcon />}
          >
            {postActionType === 'delete' ? 'Delete Post' : 'Safeguard Post'}
          </Button>
        </DialogActions>
      </Dialog>
      {/* In-place Event Popup overlay */}
      {eventPopupOpen && popupEvent && (
        <EventPopup
          event={popupEvent}
          open={eventPopupOpen}
          onClose={() => setEventPopupOpen(false)}
        />
      )}
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
  const [blockedMembers, setBlockedMembers] = useState([]);
  
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
  
  // Load members on component mount and when timelineId changes
  useEffect(() => {
    loadMembers();
  }, [loadMembers]);
  
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
      try { await syncUserPassport(); } catch (_) {}
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
          setMemberTabValue(1);
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
    if (role === 'admin') {
      return {
        text: '#D97706',
        bg: '#FEF3C7'
      };
    } else if (role === 'moderator') {
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
                // Determine role color
                let roleColor = {
                  text: '#6B7280',
                  bg: '#F3F4F6'
                };
                
                const roleLower = (member.role || '').toLowerCase();
                if (roleLower === 'admin') {
                  roleColor = {
                    text: '#B91C1C',
                    bg: '#FEE2E2'
                  };
                } else if (roleLower === 'moderator') {
                  roleColor = {
                    text: '#2563EB',
                    bg: '#DBEAFE'
                  };
                }
                
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
                      sx={{ 
                        mr: 2,
                        boxShadow: '0 0 0 2px ' + roleColor.bg,
                        cursor: 'pointer',
                        transition: 'transform 0.2s ease',
                        '&:hover': { transform: 'scale(1.05)' }
                      }}
                    />
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="subtitle1" component="div">
                        {member.name}
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
                        return (
                          <>
                            {!isSelf && !isSiteOwner && nextRole && (
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
                            {!isSelf && !isSiteOwner && prevRole && (
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
                            {!(currentUserId && Number(currentUserId) === Number(uid)) && (
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
      
      {/* Blocked Members Tab */}
      {memberTabValue === 1 && (
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
                    sx={{ 
                      mr: 2,
                      filter: 'grayscale(100%)',
                      opacity: 0.7
                    }}
                  />
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="subtitle1" component="div" sx={{ opacity: 0.7 }}>
                      {member.name}
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
           actionType === 'block' ? 'Block Member?' : 'Unblock Member?'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="member-action-dialog-description">
            {actionType === 'remove' && 'This will remove the member from the community. They can rejoin later if the community is public.'}
            {actionType === 'block' && 'This will block the member from the community. They will not be able to view or participate in this community.'}
            {actionType === 'unblock' && 'This will unblock the member. They will be able to rejoin the community if it is public.'}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseConfirmDialog} color="primary">
            Cancel
          </Button>
          <Button 
            onClick={handleMemberAction}
            color={actionType === 'unblock' ? 'primary' : 'error'} 
            variant="contained"
          >
          {actionType === 'remove' ? 'Remove' : 
           actionType === 'block' ? 'Block' : 'Unblock'}
          </Button>
        </DialogActions>
      </Dialog>
    </motion.div>
  );
};

// Settings Tab Component
const SettingsTab = ({ id }) => {
  const theme = useTheme();
  const [isPrivate, setIsPrivate] = useState(false);
  const [requireMembershipApproval, setRequireMembershipApproval] = useState(false);
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
  const [communityQuote, setCommunityQuote] = useState({
    text: "Those who make Peaceful Revolution impossible, will make violent Revolution inevitable.",
    author: "John F. Kennedy"
  });
  const [isRefreshingQuote, setIsRefreshingQuote] = useState(false);
  
  // Mock data for timeline
  const [timelineData, setTimelineData] = useState({
    id: '123',
    name: 'Community Timeline',
    description: 'A community timeline for sharing events and media related to our community.',
    memberCount: 42,
    createdDate: 'January 15, 2025',
    visibility: 'public',
    owner: {
      id: '1',
      name: 'John Doe'
    }
  });
  
  // Load saved settings from backend API
  useEffect(() => {
    const loadActionCards = async () => {
      try {
        console.log(`[AdminPanel] Loading action cards for timeline ${id}`);
        
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
        
        // Load legacy localStorage settings for backward compatibility
        try {
          const savedSettings = localStorage.getItem('communitySettings');
          if (savedSettings) {
            const settings = JSON.parse(savedSettings);
            
            // Load visibility settings (these aren't in action cards)
            if (settings.isPrivate !== undefined) {
              setIsPrivate(settings.isPrivate);
            }
            
            if (settings.requireMembershipApproval !== undefined) {
              setRequireMembershipApproval(settings.requireMembershipApproval);
            }
            
            // Load community quote from localStorage (fallback)
            if (settings.communityQuote) {
              setCommunityQuote(settings.communityQuote);
            }
          }
        } catch (legacyError) {
          console.warn('Error loading legacy localStorage settings:', legacyError);
        }
        
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
        
      } catch (error) {
        console.error('[AdminPanel] Error loading action cards:', error);
        // Set default values on error
        setGoldThresholdValue(25);
        setSilverThresholdValue(10);
        setBronzeThresholdValue(5);
      }
    };
    
    if (id) {
      loadActionCards();
    }
  }, [id]);
  
  // Handle visibility change
  const handleVisibilityChange = (event) => {
    const newValue = event.target.checked;
    setIsPrivate(newValue);
    setHasUnsavedChanges(true);
    
    // Show warning when switching to private
    if (newValue) {
      setShowWarning(true);
    } else {
      setShowWarning(false);
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
  
  // Handle save changes
  const handleSaveChanges = async () => {
    try {
      setIsSaving(true);
      setShowSavedState(false);
      console.log(`[AdminPanel] Saving action cards for timeline ${id}...`);
      
      // Create action objects for saving
      const actionsToSave = {};
      
      // Always send all three action types to handle both active and cleared states
      actionsToSave.gold = goldActionTitle ? {
        title: goldActionTitle,
        description: goldActionDescription,
        due_date: formatDateForAPI(goldActionDate),
        threshold_type: goldThresholdType,
        threshold_value: goldThresholdValue,
        is_active: true
      } : {
        title: '', // Empty title to indicate cleared state
        description: '',
        due_date: null,
        threshold_type: 'members',
        threshold_value: 15,
        is_active: false
      };
      
      actionsToSave.silver = silverActionTitle ? {
        title: silverActionTitle,
        description: silverActionDescription,
        due_date: formatDateForAPI(silverActionDate),
        threshold_type: silverThresholdType,
        threshold_value: silverThresholdValue,
        is_active: true
      } : {
        title: '', // Empty title to indicate cleared state
        description: '',
        due_date: null,
        threshold_type: 'members',
        threshold_value: 10,
        is_active: false
      };
      
      actionsToSave.bronze = bronzeActionTitle ? {
        title: bronzeActionTitle,
        description: bronzeActionDescription,
        due_date: formatDateForAPI(bronzeActionDate),
        threshold_type: bronzeThresholdType,
        threshold_value: bronzeThresholdValue,
        is_active: true
      } : {
        title: '', // Empty title to indicate cleared state
        description: '',
        due_date: null,
        threshold_type: bronzeThresholdType || 'members',
        threshold_value: bronzeThresholdValue || 5,
        is_active: false
      };
      
      // Save action cards to backend
      const saveResult = await saveTimelineActions(id, actionsToSave);
      
      if (saveResult.success) {
        console.log(`[AdminPanel] Successfully saved ${saveResult.saved.length} action cards`);
        
        // Show success message
        setSnackbarMessage('Settings Saved Successfully!');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
        
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
        
        // Save non-quote settings to localStorage (until we have backend endpoints for these)
        try {
          const communitySettings = {
            isPrivate,
            requireMembershipApproval,
            lastUpdated: new Date().toISOString()
          };
          localStorage.setItem('communitySettings', JSON.stringify(communitySettings));
        } catch (legacyError) {
          console.warn('Error saving legacy settings to localStorage:', legacyError);
        }
        
      } else {
        console.error('[AdminPanel] Error saving action cards:', saveResult.errors);
        
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
      console.error('[AdminPanel] Error in handleSaveChanges:', error);
      
      // Reset saving state
      setIsSaving(false);
      setShowSavedState(false);
      
      // Show error message
      setSnackbarMessage('Failed to save settings. Please try again.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Timeline Settings */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <SettingsIcon sx={{ mr: 1, color: 'primary.main' }} />
        <Typography variant="h6" component="h2">
          Timeline Settings
        </Typography>
      </Box>
      
      {/* Timeline Info */}
      {timelineData && (
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
                  value={timelineData.description || ''}
                  sx={{ mb: 3 }}
                />
                
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="body1">
                    Member Count: <strong>{timelineData.memberCount}</strong>
                  </Typography>
                  <Typography variant="body1">
                    Created: <strong>{timelineData.createdDate}</strong>
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
                <FormControlLabel
                  control={
                    <Switch
                      checked={isPrivate}
                      onChange={handleVisibilityChange}
                      color="primary"
                    />
                  }
                  label="Private Timeline"
                />
                
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {isPrivate ? 
                    "Only approved members can view and contribute to this timeline." : 
                    "Anyone can view this timeline, but only members can contribute."}
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
                  Community Action Settings
                </Typography>
              </Box>
              
              <Paper 
                elevation={0} 
                sx={{ 
                  p: 3, 
                  mb: 4, 
                  borderRadius: 2,
                  bgcolor: 'background.paper',
                  border: '1px solid',
                  borderColor: 'divider',
                  backdropFilter: 'blur(10px)',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
                }}
              >
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                  Configure how community members can contribute to this timeline.
                </Typography>
              
                {/* Quote Field */}
                <Box sx={{ mb: 4, p: 3, borderRadius: 2, bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)' }}>
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
                    onClick={() => {
                      setGoldActionTitle('');
                      setGoldActionDescription('');
                      setGoldActionDate(null);
                      setGoldThresholdValue(25);
                      setHasUnsavedChanges(true);
                    }}
                    sx={{ 
                      color: '#FFD700',
                      '&:hover': { bgcolor: 'rgba(255, 215, 0, 0.1)' }
                    }}
                    title="Clear Gold Action (will show quote instead)"
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
                  bgcolor: 'background.paper', 
                  borderRadius: 1,
                  position: 'relative',
                  border: '1px solid rgba(0, 0, 0, 0.12)',
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
                    onClick={() => {
                      setSilverActionTitle('');
                      setSilverActionDescription('');
                      setSilverActionDate(null);
                      setSilverThresholdValue(10);
                      setHasUnsavedChanges(true);
                    }}
                    sx={{ 
                      color: '#C0C0C0',
                      '&:hover': { bgcolor: 'rgba(192, 192, 192, 0.1)' }
                    }}
                    title="Clear Silver Action (will show quote instead)"
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
                  bgcolor: 'background.paper', 
                  borderRadius: 1,
                  position: 'relative',
                  border: '1px solid rgba(0, 0, 0, 0.12)',
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
                    onClick={() => {
                      setBronzeActionTitle('');
                      setBronzeActionDescription('');
                      setBronzeActionDate(null);
                      setBronzeThresholdValue(5);
                      setHasUnsavedChanges(true);
                    }}
                    sx={{ 
                      color: '#CD7F32',
                      '&:hover': { bgcolor: 'rgba(205, 127, 50, 0.1)' }
                    }}
                    title="Clear Bronze Action (will show quote instead)"
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
            </Box>
          </motion.div>

          {/* Floating Action Button for Save Changes */}
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
