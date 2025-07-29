import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, CircularProgress, Alert } from '@mui/material';
import { checkMembershipStatus } from '../../../utils/api';

/**
 * MembershipGuard component that protects routes requiring community membership
 * Redirects non-members back to the timeline page and shows an appropriate message
 */
const MembershipGuard = ({ children, requiredRole = null }) => {
  const { id: timelineId } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isMember, setIsMember] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const checkAccess = async () => {
      if (!timelineId) {
        setError('Timeline ID not found');
        setIsLoading(false);
        return;
      }

      try {
        console.log(`[MembershipGuard] Checking membership for timeline ${timelineId}`);
        const membershipStatus = await checkMembershipStatus(timelineId, 0, true);
        
        console.log('[MembershipGuard] Membership status:', membershipStatus);
        
        if (membershipStatus && membershipStatus.is_member) {
          setIsMember(true);
          setUserRole(membershipStatus.role);
          
          // Check if user has required role (if specified)
          if (requiredRole) {
            const roleHierarchy = { 'member': 1, 'moderator': 2, 'admin': 3, 'SiteOwner': 4 };
            const userRoleLevel = roleHierarchy[membershipStatus.role] || 0;
            const requiredRoleLevel = roleHierarchy[requiredRole] || 0;
            
            if (userRoleLevel < requiredRoleLevel) {
              console.log(`[MembershipGuard] User role ${membershipStatus.role} insufficient for required role ${requiredRole}`);
              setError(`This page requires ${requiredRole} privileges or higher.`);
              setIsLoading(false);
              
              // Redirect to timeline after a short delay
              setTimeout(() => {
                navigate(`/timeline-v3/${timelineId}`);
              }, 3000);
              return;
            }
          }
          
          console.log('[MembershipGuard] Access granted');
        } else {
          console.log('[MembershipGuard] User is not a member, redirecting to timeline');
          setIsMember(false);
          setError('You must be a member of this community to access this page.');
          
          // Redirect to timeline after a short delay
          setTimeout(() => {
            navigate(`/timeline-v3/${timelineId}`);
          }, 3000);
        }
      } catch (error) {
        console.error('[MembershipGuard] Error checking membership:', error);
        setError('Unable to verify membership status. Redirecting to timeline...');
        
        // Redirect to timeline after a short delay
        setTimeout(() => {
          navigate(`/timeline-v3/${timelineId}`);
        }, 3000);
      } finally {
        setIsLoading(false);
      }
    };

    checkAccess();
  }, [timelineId, navigate, requiredRole]);

  // Show loading state
  if (isLoading) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center', 
          justifyContent: 'center', 
          minHeight: '400px',
          gap: 2
        }}
      >
        <CircularProgress />
        <Typography variant="body1" color="text.secondary">
          Verifying access permissions...
        </Typography>
      </Box>
    );
  }

  // Show error state (will redirect after delay)
  if (error || !isMember) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center', 
          justifyContent: 'center', 
          minHeight: '400px',
          gap: 2,
          px: 3
        }}
      >
        <Alert severity="warning" sx={{ maxWidth: 600 }}>
          <Typography variant="body1">
            {error || 'Access denied'}
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            Redirecting to timeline...
          </Typography>
        </Alert>
      </Box>
    );
  }

  // Render children if user has access
  return children;
};

export default MembershipGuard;
