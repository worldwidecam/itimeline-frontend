import React, { useState, useEffect } from 'react';
import { Button, Stack, CircularProgress, Snackbar, Alert, useTheme } from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import BlockIcon from '@mui/icons-material/Block';
import PeopleIcon from '@mui/icons-material/People';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import useJoinStatus from '../../../hooks/useJoinStatus';
import { requestTimelineAccess, getTimelineMembers } from '../../../utils/api';

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
  
  // Use the centralized membership hook
  const {
    isMember: hookIsMember,
    isBlocked: hookIsBlocked,
    isPending: hookIsPending,
    role: hookRole,
    loading: joinLoading,
    refresh: refreshMembership,
  } = useJoinStatus(timelineId, { user });

  // Local state for UI feedback
  const [joinRequestSent, setJoinRequestSent] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [memberCount, setMemberCount] = useState(0);
  const [loadingMemberCount, setLoadingMemberCount] = useState(true);

  // Sync hook state to local state
  const [isMember, setIsMember] = useState(null);
  const [isBlocked, setIsBlocked] = useState(false);
  const [isPending, setIsPending] = useState(false);

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
        const response = await getTimelineMembers(timelineId);
        const members = Array.isArray(response) ? response : response?.data || [];
        setMemberCount(members.length);
      } catch (error) {
        console.error('[CommunityMembershipControl] Error fetching member count:', error);
        setMemberCount(0);
      } finally {
        setLoadingMemberCount(false);
      }
    };

    fetchMemberCount();
  }, [timelineId, isMember]);

  // Handle join community button click
  const handleJoinCommunity = async () => {
    if (!user) {
      setSnackbarMessage('Please log in to join this community');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }

    setJoinRequestSent(true);

    try {
      const response = await requestTimelineAccess(timelineId);
      console.log('[CommunityMembershipControl] Join request response:', response);

      if (response.error) {
        console.warn('[CommunityMembershipControl] Join request returned an error:', response);
        setSnackbarMessage('Failed to join community. Please try again.');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
        setJoinRequestSent(false);
        return;
      }

      // Success
      const memberRole = response.role || 'member';
      const isPendingApproval = memberRole === 'pending';

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

      // Refresh membership status
      await refreshMembership();

      // Notify parent component
      if (onJoinSuccess) {
        onJoinSuccess({ role: memberRole, isPending: isPendingApproval });
      }

    } catch (error) {
      console.error('[CommunityMembershipControl] Error joining community:', error);
      setSnackbarMessage('Failed to join community. Please try again.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      setJoinRequestSent(false);
    }
  };

  // Handle leave community button click
  const handleLeaveCommunity = () => {
    // TODO: Implement leave community logic
    // This will require a new backend endpoint
    console.log('[CommunityMembershipControl] Leave community clicked');
    setSnackbarMessage('Leave community feature coming soon');
    setSnackbarSeverity('info');
    setSnackbarOpen(true);
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
        startIcon={<CircularProgress size={16} />}
        sx={{
          bgcolor: 'rgba(0, 0, 0, 0.12)',
          color: theme.palette.text.secondary,
          '&.Mui-disabled': {
            color: theme.palette.text.secondary
          }
        }}
      >
        Checking membership...
      </Button>
    );
  }

  // Render blocked state
  if (isBlocked) {
    return (
      <Button
        disabled
        startIcon={<BlockIcon />}
        sx={{
          bgcolor: theme.palette.error.light,
          color: theme.palette.error.contrastText,
          fontWeight: 700,
          '&.Mui-disabled': { 
            color: theme.palette.error.contrastText 
          }
        }}
      >
        Blocked from this community
      </Button>
    );
  }

  // Render pending approval state
  if (isPending) {
    return (
      <>
        <Button
          disabled
          startIcon={<CheckCircleIcon />}
          sx={{
            bgcolor: theme.palette.warning.light,
            color: theme.palette.warning.contrastText,
            fontWeight: 700,
            '&.Mui-disabled': { 
              color: theme.palette.warning.contrastText,
              bgcolor: theme.palette.warning.light
            }
          }}
        >
          Request Sent!
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
          startIcon={<PersonAddIcon />}
          sx={{
            bgcolor: theme.palette.info.main,
            color: 'white',
            boxShadow: 2,
            '&:hover': { 
              bgcolor: theme.palette.info.dark 
            },
            '&.Mui-disabled': {
              bgcolor: 'rgba(0, 0, 0, 0.12)',
              color: 'rgba(0, 0, 0, 0.26)'
            }
          }}
        >
          {requiresApproval || visibility === 'private' ? 'Request to Join' : 'Join Community'}
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

  // Render member UI (member count + leave button)
  return (
    <>
      <Stack direction="row" spacing={1} alignItems="center">
        {/* Member Count Display */}
        <Button
          disabled
          startIcon={<PeopleIcon sx={{ fontSize: '1.5rem' }} />}
          sx={{
            bgcolor: theme.palette.mode === 'dark' 
              ? 'rgba(255, 255, 255, 0.08)' 
              : 'rgba(25, 118, 210, 0.08)',
            color: theme.palette.mode === 'dark'
              ? theme.palette.primary.light
              : theme.palette.primary.main,
            fontSize: '1rem',
            fontWeight: 700,
            px: 2,
            py: 1,
            borderRadius: 2,
            border: `2px solid ${theme.palette.mode === 'dark' 
              ? 'rgba(255, 255, 255, 0.12)' 
              : theme.palette.primary.main}`,
            '&.Mui-disabled': {
              color: theme.palette.mode === 'dark'
                ? theme.palette.primary.light
                : theme.palette.primary.main
            }
          }}
        >
          {loadingMemberCount ? '...' : `${formatMemberCount(memberCount)} Member${memberCount !== 1 ? 's' : ''}`}
        </Button>

        {/* Leave Community Button */}
        <Button
          onClick={handleLeaveCommunity}
          variant="outlined"
          size="small"
          startIcon={<ExitToAppIcon />}
          sx={{
            fontSize: '0.8rem',
            py: 0.5,
            px: 1.5,
            borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)',
            color: theme.palette.text.secondary,
            '&:hover': {
              borderColor: theme.palette.error.main,
              color: theme.palette.error.main,
              bgcolor: theme.palette.mode === 'dark' ? 'rgba(211,47,47,0.1)' : 'rgba(211,47,47,0.05)'
            }
          }}
        >
          Leave
        </Button>
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
    </>
  );
};

export default CommunityMembershipControl;
