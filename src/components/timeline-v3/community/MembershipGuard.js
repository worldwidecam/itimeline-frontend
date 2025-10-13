import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, CircularProgress, Button, useTheme } from '@mui/material';
import WarningIcon from '@mui/icons-material/Warning';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { motion } from 'framer-motion';
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

  // Show error state (will redirect after delay) - Immersive design
  if (error || !isMember) {
    const theme = useTheme();
    
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
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          style={{ width: '100%', height: '100%', minHeight: '100vh' }}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '100vh',
              background: theme.palette.mode === 'dark'
                ? 'linear-gradient(135deg, #2e1a1a 0%, #3e1616 50%, #601010 100%)'
                : 'linear-gradient(135deg, #ea6767 0%, #a24b76 50%, #fb93c0 100%)',
              position: 'relative',
              overflow: 'hidden',
              px: 3,
            }}
          >
            {/* Animated background circles */}
            <Box
              sx={{
                position: 'absolute',
                top: '-10%',
                right: '-5%',
                width: '40%',
                height: '40%',
                borderRadius: '50%',
                background: 'rgba(255, 200, 200, 0.1)',
                filter: 'blur(60px)',
                animation: 'float 8s ease-in-out infinite',
                '@keyframes float': {
                  '0%, 100%': { transform: 'translateY(0px)' },
                  '50%': { transform: 'translateY(-30px)' }
                }
              }}
            />

            {/* Main content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              style={{ zIndex: 1, textAlign: 'center', maxWidth: '600px' }}
            >
              {/* Icon container with glassmorphism */}
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <Box
                  sx={{
                    width: 120,
                    height: 120,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 2rem',
                    background: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(10px)',
                    border: '2px solid rgba(255, 255, 255, 0.2)',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                  }}
                >
                  <WarningIcon sx={{ fontSize: 60, color: '#fff' }} />
                </Box>
              </motion.div>

              {/* Title */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
              >
                <Typography
                  variant="h3"
                  sx={{
                    color: '#fff',
                    fontWeight: 700,
                    mb: 2,
                    textShadow: '0 2px 10px rgba(0, 0, 0, 0.3)',
                  }}
                >
                  Access Denied
                </Typography>
              </motion.div>

              {/* Description */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    color: 'rgba(255, 255, 255, 0.9)',
                    mb: 1,
                    fontWeight: 400,
                    lineHeight: 1.6,
                  }}
                >
                  {error || 'You do not have permission to access this page.'}
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    color: 'rgba(255, 255, 255, 0.7)',
                    mb: 4,
                  }}
                >
                  Redirecting to timeline...
                </Typography>
              </motion.div>

              {/* Button with glassmorphism */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.7 }}
              >
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<ArrowBackIcon />}
                  onClick={() => navigate(`/timeline-v3/${timelineId}`)}
                  sx={{
                    px: 4,
                    py: 1.5,
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    borderRadius: '50px',
                    background: 'rgba(255, 255, 255, 0.2)',
                    backdropFilter: 'blur(10px)',
                    border: '2px solid rgba(255, 255, 255, 0.3)',
                    color: '#fff',
                    textTransform: 'none',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      background: 'rgba(255, 255, 255, 0.3)',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 6px 30px rgba(0, 0, 0, 0.3)',
                      border: '2px solid rgba(255, 255, 255, 0.5)',
                    },
                  }}
                >
                  Go to Timeline Now
                </Button>
              </motion.div>
            </motion.div>
          </Box>
        </motion.div>
      </Box>
    );
  }

  // Render children if user has access
  return children;
};

export default MembershipGuard;
