import React, { useState, useEffect } from 'react';
import { Button, Box, Stack, CircularProgress, Snackbar, Alert, useTheme, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Tooltip } from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import BlockIcon from '@mui/icons-material/Block';
import PeopleIcon from '@mui/icons-material/People';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import useJoinStatus from '../../../hooks/useJoinStatus';
import { requestTimelineAccess, getTimelineMemberCount, leaveCommunity, getTimelineMembers } from '../../../utils/api';

/**
 * Format large numbers with K/M suffixes
 * Examples: 1234 -> "1.2K", 1500000 -> "1.5M"
 */
const formatMemberCount = (count) => {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toString();
};

/**
 * CommunityMembershipControl
 * 
 * Handles all community timeline membership UI and logic:
 * - Join/Request to Join button for non-members
 * - Pending approval state
 * - Blocked state
 * - Member count display
 * - Leave community button
 * 
 * Extracted from TimelineV3.js for better separation of concerns.
 */
const CommunityMembershipControl = ({ 
  timelineId, 
  user, 
  visibility = 'public',
  requiresApproval = false,
  onJoinSuccess,
  onLeaveSuccess
}) => {
  const theme = useTheme();
  const isGuestUser = Boolean(user) && (user?.role === 'guest' || !(Number(user?.id) > 0));
  
  // Use the centralized membership hook
  const {
    isMember: hookIsMember,
    isBlocked: hookIsBlocked,
    isPending: hookIsPending,
    role: hookRole,
    loading: joinLoading,
    join: joinFromHook,
    refresh: refreshMembership,
  } = useJoinStatus(timelineId, { user });

  // Local state for UI feedback
  const [joinRequestSent, setJoinRequestSent] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [memberCount, setMemberCount] = useState(0);
  const [loadingMemberCount, setLoadingMemberCount] = useState(true);
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const [infoDialogOpen, setInfoDialogOpen] = useState(false);
  const [infoDialogTitle, setInfoDialogTitle] = useState('');
  const [infoDialogText, setInfoDialogText] = useState('');
  const [adminCount, setAdminCount] = useState(0);

  // Sync hook state to local state
  const [isMember, setIsMember] = useState(null);
  const [isBlocked, setIsBlocked] = useState(false);
  const [isPending, setIsPending] = useState(false);

  // Check if user can leave (not SiteOwner, not only admin)
  const isSiteOwner = user?.id === 1 || hookRole === 'siteowner';
  const isOnlyAdmin = hookRole === 'admin' && adminCount <= 1;
  const canLeave = isMember && !isSiteOwner && !isOnlyAdmin;

  useEffect(() => {
    if (typeof hookIsMember !== 'undefined' && hookIsMember !== null) {
      setIsMember(!!hookIsMember);
    }
    if (typeof hookIsBlocked !== 'undefined') {
      setIsBlocked(!!hookIsBlocked);
    }
    if (typeof hookIsPending !== 'undefined') {
      setIsPending(!!hookIsPending);
    }
    if (hookIsMember === true || hookIsPending === true) {
      setJoinRequestSent(true);
    }
  }, [hookIsMember, hookIsBlocked, hookIsPending]);

  // Fetch member count when component mounts or when membership changes
  useEffect(() => {
    const fetchMemberCount = async () => {
      if (!timelineId) return;
      
      try {
        setLoadingMemberCount(true);
        const response = await getTimelineMemberCount(timelineId);
        setMemberCount(response?.count ?? 0);
      } catch (error) {
        console.error('[CommunityMembershipControl] Error fetching member count:', error);
        setMemberCount(0);
      } finally {
        setLoadingMemberCount(false);
      }
    };

    fetchMemberCount();
  }, [timelineId, isMember]);

  // Fetch admin count to check if user is the only admin
  useEffect(() => {
    const fetchAdminCount = async () => {
      if (!timelineId || !isMember) return;
      
      try {
        // Fetch members and count admins
        const response = await getTimelineMembers(timelineId, 1, 100);
        const members = Array.isArray(response) ? response : (response?.data || []);
        const admins = members.filter(m => m.role === 'admin');
        setAdminCount(admins.length);
      } catch (error) {
        console.error('[CommunityMembershipControl] Error fetching admin count:', error);
        setAdminCount(0);
      }
    };

    fetchAdminCount();
  }, [timelineId, isMember]);

  // Handle join community button click
  const handleJoinCommunity = async () => {
    if (!user || isGuestUser) {
      setSnackbarMessage('Please log in to join this community');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }

    // Use the hook's join function which has optimistic updates and BroadcastChannel sync
    const result = await joinFromHook();

    if (!result || result.success === false) {
      console.warn('[CommunityMembershipControl] Join request failed:', result);
      setSnackbarMessage('Failed to join community. Please try again.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      setJoinRequestSent(false);
      return;
    }

    // The hook's join function already set optimistic state and broadcast to other components
    // Just update local snackbar/message state based on the result
    const memberRole = result.role || 'member';
    const memberStatus = result.status || 'active';
    const isPendingApproval = memberStatus === 'pending';

    if (isPendingApproval) {
      setSnackbarMessage('Your request has been submitted for approval');
      setIsPending(true);
      setIsMember(false);
    } else {
      setSnackbarMessage('Successfully joined the community!');
      setIsPending(false);
      setIsMember(true);
    }
    
    setSnackbarSeverity('success');
    setSnackbarOpen(true);

    // Notify parent component
    if (onJoinSuccess) {
      onJoinSuccess({ role: memberRole, isPending: isPendingApproval });
    }
  };

  // Handle leave community button click
  const handleLeaveCommunity = () => {
    if (canLeave) {
      setLeaveDialogOpen(true);
    } else {
      if (isSiteOwner) {
        setInfoDialogTitle('Creator / Owner Status');
        setInfoDialogText('As the creator and owner of this community, you cannot leave it. If you need to hand over ownership, please promote another member first.');
        setInfoDialogOpen(true);
      } else if (isOnlyAdmin) {
        setInfoDialogTitle('Admin Access Required');
        setInfoDialogText('You are currently the only Administrator of this community. Please promote another member to Admin before leaving so the community remains managed.');
        setInfoDialogOpen(true);
      }
    }
  };

  // Handle leave confirmation
  const handleLeaveConfirm = async () => {
    setLeaveDialogOpen(false);
    
    try {
      await leaveCommunity(timelineId);
      setSnackbarMessage('Successfully left the community');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      
      // Update local state
      setIsMember(false);
      
      // Refresh membership status
      await refreshMembership();
      
      // Notify parent component
      if (onLeaveSuccess) {
        onLeaveSuccess();
      }
    } catch (error) {
      console.error('[CommunityMembershipControl] Error leaving community:', error);
      setSnackbarMessage(error.message || 'Failed to leave community. Please try again.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  // Handle leave cancellation
  const handleLeaveCancel = () => {
    setLeaveDialogOpen(false);
  };

  // Close snackbar
  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  // Render loading state
  if (isMember === null || joinLoading) {
    return (
      <Button
        disabled
        sx={{
          background: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.03)' : 'rgba(15, 23, 42, 0.03)',
          border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(15, 23, 42, 0.08)'}`,
          borderRadius: 2.25,
          px: { xs: 0, sm: 2 },
          py: 0.75,
          width: { xs: '36px', sm: 'auto' },
          height: { xs: '36px', sm: 'auto' },
          minWidth: { xs: '36px', sm: 'auto' },
          fontSize: '0.8125rem',
          fontWeight: 600,
          color: theme.palette.text.secondary,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          '&.Mui-disabled': {
            color: theme.palette.text.secondary
          }
        }}
      >
        <CircularProgress size={14} sx={{ color: theme.palette.mode === 'dark' ? '#93c5fd' : '#2563eb', mr: { xs: 0, sm: 1 } }} />
        <Box component="span" sx={{ display: { xs: 'none', sm: 'none', md: 'inline' } }}>
          Checking membership...
        </Box>
        <Box component="span" sx={{ display: { xs: 'none', sm: 'inline', md: 'none' } }}>
          Checking...
        </Box>
      </Button>
    );
  }

  // Render blocked state
  if (isBlocked) {
    return (
      <Button
        disabled
        sx={{
          background: theme.palette.mode === 'dark' ? 'rgba(239, 68, 68, 0.12)' : 'rgba(239, 68, 68, 0.08)',
          border: '1px solid rgba(239, 68, 68, 0.28)',
          borderRadius: 2.25,
          px: { xs: 0, sm: 2 },
          py: 0.75,
          width: { xs: '36px', sm: 'auto' },
          height: { xs: '36px', sm: 'auto' },
          minWidth: { xs: '36px', sm: 'auto' },
          fontSize: '0.8125rem',
          fontWeight: 700,
          color: theme.palette.mode === 'dark' ? '#fca5a5' : '#b91c1c',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          '&.Mui-disabled': { 
            color: theme.palette.mode === 'dark' ? '#fca5a5' : '#b91c1c'
          }
        }}
      >
        <BlockIcon sx={{ color: '#f87171', fontSize: '1.1rem', mr: { xs: 0, sm: 1 } }} />
        <Box component="span" sx={{ display: { xs: 'none', sm: 'none', md: 'inline' } }}>
          Blocked from this community
        </Box>
        <Box component="span" sx={{ display: { xs: 'none', sm: 'inline', md: 'none' } }}>
          Blocked
        </Box>
      </Button>
    );
  }

  // Render pending approval state
  if (isPending) {
    return (
      <>
        <Button
          disabled
          sx={{
            background: theme.palette.mode === 'dark' ? 'rgba(245, 158, 11, 0.12)' : 'rgba(245, 158, 11, 0.08)',
            border: '1px solid rgba(245, 158, 11, 0.32)',
            borderRadius: 2.25,
            px: { xs: 0, sm: 2 },
            py: 0.75,
            width: { xs: '36px', sm: 'auto' },
            height: { xs: '36px', sm: 'auto' },
            minWidth: { xs: '36px', sm: 'auto' },
            fontSize: '0.8125rem',
            fontWeight: 700,
            color: theme.palette.mode === 'dark' ? '#fde68a' : '#b45309',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            '&.Mui-disabled': { 
              color: theme.palette.mode === 'dark' ? '#fde68a' : '#b45309',
              background: theme.palette.mode === 'dark' ? 'rgba(245, 158, 11, 0.12)' : 'rgba(245, 158, 11, 0.08)'
            }
          }}
        >
          <CheckCircleIcon sx={{ color: theme.palette.mode === 'dark' ? '#fbbf24' : '#d97706', fontSize: '1.1rem', mr: { xs: 0, sm: 1 } }} />
          <Box component="span" sx={{ display: { xs: 'none', sm: 'none', md: 'inline' } }}>
            Request Sent!
          </Box>
          <Box component="span" sx={{ display: { xs: 'none', sm: 'inline', md: 'none' } }}>
            Pending
          </Box>
        </Button>
        <Snackbar 
          open={snackbarOpen} 
          autoHideDuration={6000} 
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity} sx={{ width: '100%' }}>
            {snackbarMessage}
          </Alert>
        </Snackbar>
      </>
    );
  }

  // Render join button for non-members
  if (!isMember) {
    return (
      <>
        <Button
          onClick={handleJoinCommunity}
          disabled={joinRequestSent}
          sx={{
            background: theme.palette.mode === 'dark' 
              ? 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)'
              : 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
            color: 'white',
            border: theme.palette.mode === 'dark' ? '1px solid rgba(14, 165, 233, 0.4)' : '1px solid rgba(3, 105, 161, 0.2)',
            borderRadius: 2.25,
            px: { xs: 0, sm: 2.5 },
            py: 0.75,
            width: { xs: '36px', sm: 'auto' },
            height: { xs: '36px', sm: 'auto' },
            minWidth: { xs: '36px', sm: 'auto' },
            fontSize: '0.75rem',
            fontWeight: 800,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: theme.palette.mode === 'dark' ? '0 4px 14px rgba(2, 132, 199, 0.25)' : '0 4px 12px rgba(3, 105, 161, 0.15)',
            transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: theme.palette.mode === 'dark' ? '0 8px 24px rgba(2, 132, 199, 0.45)' : '0 8px 20px rgba(3, 105, 161, 0.3)',
              filter: 'brightness(1.08)'
            },
            '&.Mui-disabled': {
              bgcolor: 'rgba(0, 0, 0, 0.12)',
              color: 'rgba(0, 0, 0, 0.26)'
            }
          }}
        >
          <PersonAddIcon sx={{ fontSize: '1.1rem', mr: { xs: 0, sm: 1 } }} />
          <Box component="span" sx={{ display: { xs: 'none', sm: 'none', md: 'inline' } }}>
            {isGuestUser
              ? 'Log in to Join'
              : (requiresApproval || visibility === 'private' ? 'Request to Join' : 'Join Community')}
          </Box>
          <Box component="span" sx={{ display: { xs: 'none', sm: 'inline', md: 'none' } }}>
            {isGuestUser
              ? 'Log In'
              : (requiresApproval || visibility === 'private' ? 'Request' : 'Join')}
          </Box>
        </Button>
        <Snackbar 
          open={snackbarOpen} 
          autoHideDuration={6000} 
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity} sx={{ width: '100%' }}>
            {snackbarMessage}
          </Alert>
        </Snackbar>
      </>
    );
  }

  // Render member UI (member count & click actions)
  return (
    <>
      <Stack direction="row" spacing={1} alignItems="center">
        {/* Member Count Display & Leave Toggle */}
        <Tooltip title={canLeave ? "Click to leave community" : (isSiteOwner ? "Creator / Owner (Click to manage)" : "Sole Admin (Click to manage)")} arrow>
          <Button
            onClick={handleLeaveCommunity}
            sx={{
              bgcolor: theme.palette.mode === 'dark' 
                ? 'rgba(255, 255, 255, 0.04)' 
                : 'rgba(25, 118, 210, 0.05)',
              color: theme.palette.mode === 'dark'
                ? theme.palette.primary.light
                : theme.palette.primary.main,
              fontSize: '0.8125rem',
              fontWeight: 800,
              letterSpacing: '0.03em',
              textTransform: 'uppercase',
              px: { xs: 0, sm: 2.25 },
              py: 0.75,
              width: { xs: '36px', sm: 'auto' },
              height: { xs: '36px', sm: 'auto' },
              minWidth: { xs: '36px', sm: 'auto' },
              borderRadius: 2.25,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: `1px solid ${theme.palette.mode === 'dark' 
                ? 'rgba(255, 255, 255, 0.1)' 
                : 'rgba(25, 118, 210, 0.15)'}`,
              transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                borderColor: canLeave ? 'rgba(239, 68, 68, 0.45)' : (theme.palette.mode === 'dark' ? 'rgba(59, 130, 246, 0.45)' : 'rgba(37, 99, 235, 0.35)'),
                color: canLeave 
                  ? (theme.palette.mode === 'dark' ? '#fca5a5' : '#dc2626') 
                  : (theme.palette.mode === 'dark' ? '#93c5fd' : '#1d4ed8'),
                bgcolor: canLeave 
                  ? (theme.palette.mode === 'dark' ? 'rgba(239, 68, 68, 0.12)' : 'rgba(239, 68, 68, 0.08)')
                  : (theme.palette.mode === 'dark' ? 'rgba(59, 130, 246, 0.12)' : 'rgba(37, 99, 235, 0.08)'),
                transform: 'translateY(-2px)',
                boxShadow: theme.palette.mode === 'dark' 
                  ? (canLeave ? '0 4px 14px rgba(239, 68, 68, 0.2)' : '0 4px 14px rgba(59, 130, 246, 0.2)')
                  : (canLeave ? '0 4px 12px rgba(239, 68, 68, 0.15)' : '0 4px 12px rgba(37, 99, 235, 0.15)')
              }
            }}
          >
            <PeopleIcon sx={{ fontSize: '1.2rem', mr: { xs: 0, sm: 1 } }} />
            <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
              {loadingMemberCount ? '...' : `${formatMemberCount(memberCount)} Member${memberCount !== 1 ? 's' : ''}`}
            </Box>
            <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>
              {loadingMemberCount ? '...' : formatMemberCount(memberCount)}
            </Box>
          </Button>
        </Tooltip>
      </Stack>

      <Snackbar 
        open={snackbarOpen} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>

      {/* Leave Community Confirmation Dialog */}
      <Dialog
        open={leaveDialogOpen}
        onClose={handleLeaveCancel}
        aria-labelledby="leave-dialog-title"
        aria-describedby="leave-dialog-description"
      >
        <DialogTitle id="leave-dialog-title">
          Leave Community?
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="leave-dialog-description">
            Are you sure you want to leave this community? You will lose access to member-only content and will need to rejoin to regain access.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleLeaveCancel} color="primary">
            Cancel
          </Button>
          <Button onClick={handleLeaveConfirm} color="error" variant="contained" autoFocus>
            Leave Community
          </Button>
        </DialogActions>
      </Dialog>

      {/* Info / Restriction Dialog */}
      <Dialog
        open={infoDialogOpen}
        onClose={() => setInfoDialogOpen(false)}
        aria-labelledby="info-dialog-title"
        aria-describedby="info-dialog-description"
      >
        <DialogTitle id="info-dialog-title">
          {infoDialogTitle}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="info-dialog-description">
            {infoDialogText}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInfoDialogOpen(false)} color="primary" variant="contained" autoFocus>
            Okay
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default CommunityMembershipControl;
