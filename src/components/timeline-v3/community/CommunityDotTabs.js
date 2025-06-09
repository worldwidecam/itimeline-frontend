import React, { useState, useEffect } from 'react';
import { Box, Tooltip, useTheme } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import TimelineIcon from '@mui/icons-material/Timeline';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';

/**
 * A minimalist dot-style tab component for community timelines
 * Displays as a row of dots with the active tab highlighted
 * Used for navigation between Timeline, Members, and Admin views
 */

// Clean, simplified component without animations
const CommunityDotTabs = ({ timelineId, userRole }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  const [previousTab, setPreviousTab] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);
  
  // Define the available tabs - always include admin tab for now
  // Later we can add proper role checking
  const tabs = [
    { 
      name: 'Timeline', 
      path: `/timeline-v3/${timelineId}`, 
      tooltip: 'View and interact with the community timeline', 
      icon: <TimelineIcon fontSize="small" />
    },
    { 
      name: 'Members', 
      path: `/timeline-v3/${timelineId}/members`, 
      tooltip: 'Browse and manage community members', 
      icon: <PeopleAltIcon fontSize="small" />
    },
    { 
      name: 'Admin', 
      path: `/timeline-v3/${timelineId}/admin`, 
      tooltip: 'Access admin controls and settings', 
      icon: <AdminPanelSettingsIcon fontSize="small" />
    },
  ];
  
  // Determine active tab based on current path
  useEffect(() => {
    const currentPath = location.pathname;
    let newActiveTab = 0;
    
    if (currentPath.includes('/members')) {
      newActiveTab = 1;
    } else if (currentPath.includes('/admin')) {
      newActiveTab = 2;
    }
    
    if (newActiveTab !== activeTab) {
      setPreviousTab(activeTab);
      setActiveTab(newActiveTab);
      setIsAnimating(true);
      
      // Reset animation state after animation completes
      const timer = setTimeout(() => setIsAnimating(false), 600);
      return () => clearTimeout(timer);
    }
  }, [location.pathname, activeTab]);
  
  const handleDotClick = (index) => {
    if (index === activeTab) return;
    
    setPreviousTab(activeTab);
    setActiveTab(index);
    setIsAnimating(true);
    navigate(tabs[index].path);
    
    // Reset animation state after animation completes
    setTimeout(() => setIsAnimating(false), 600);
  };

  // Get the direction of the animation (left to right or right to left)
  const getAnimationDirection = () => {
    if (previousTab === null) return 0;
    return previousTab < activeTab ? 1 : -1; // 1 for right, -1 for left
  };

  return (
    <Box 
      sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        my: 2,
        position: 'relative',
        zIndex: 10,
        overflow: 'visible',
        height: 40 // Fixed height to prevent layout shifts
      }}
    >
      <motion.div
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <Box
          sx={{
            display: 'flex',
            gap: 2,
            alignItems: 'center',
            bgcolor: 'background.paper',
            borderRadius: 10,
            py: 0.75,
            px: 2.5,
            boxShadow: theme.palette.mode === 'dark' ? '0 2px 8px rgba(0,0,0,0.4)' : '0 2px 8px rgba(0,0,0,0.1)',
            '&:hover': {
              boxShadow: theme.palette.mode === 'dark' ? '0 4px 12px rgba(0,0,0,0.5)' : '0 4px 12px rgba(0,0,0,0.15)',
              transform: 'translateY(-1px)'
            },
            transition: 'box-shadow 0.3s ease, transform 0.3s ease',
            position: 'relative'
          }}
        >
          {/* No background aura - removed as requested */}

          {tabs.map((tab, index) => (
            <Tooltip 
              key={index} 
              title={
                <Box sx={{ p: 0.8, maxWidth: 200 }}>
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    mb: 0.5,
                    pb: 0.5,
                    borderBottom: '1px solid rgba(255,255,255,0.1)'
                  }}>
                    <Box sx={{ 
                      mr: 1,
                      display: 'flex',
                      alignItems: 'center',
                      color: theme.palette.primary.main,
                      opacity: 0.9
                    }}>
                      {tab.icon}
                    </Box>
                    <span style={{ 
                      fontWeight: 600,
                      letterSpacing: '0.3px'
                    }}>{tab.name}</span>
                  </Box>
                  <Box sx={{ 
                    fontSize: '0.8rem', 
                    opacity: 0.9,
                    mt: 0.5,
                    lineHeight: 1.4
                  }}>{tab.tooltip}</Box>
                </Box>
              } 
              arrow
              placement="top"
              enterDelay={700}
              leaveDelay={200}
              sx={{
                '& .MuiTooltip-tooltip': {
                  bgcolor: 'rgba(0,0,0,0.85)',
                  boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
                  borderRadius: 1.5
                },
                '& .MuiTooltip-arrow': {
                  color: 'rgba(0,0,0,0.85)'
                }
              }}
            >
              <Box
                component={motion.div}
                onClick={() => handleDotClick(index)}
                whileHover={{ 
                  scale: 1.3,
                  boxShadow: `0 0 8px ${theme.palette.primary.main}80`
                }}
                whileTap={{ scale: 0.9 }}
                animate={{
                  scale: index === activeTab ? 1.2 : 1,
                  backgroundColor: index === activeTab 
                    ? theme.palette.primary.main 
                    : theme.palette.mode === 'dark' 
                      ? 'rgba(255,255,255,0.3)' 
                      : 'rgba(0,0,0,0.3)',
                  boxShadow: index === activeTab 
                    ? `0 0 10px ${theme.palette.primary.main}, inset 0 0 0 2px ${theme.palette.background.paper}` 
                    : 'none'
                }}
                transition={{ 
                  type: 'spring', 
                  stiffness: 400, 
                  damping: 17,
                  duration: 0.3
                }}
                sx={{
                  width: index === activeTab ? 14 : 8,
                  height: index === activeTab ? 14 : 8,
                  borderRadius: '50%',
                  cursor: 'pointer',
                  zIndex: 1,
                  position: 'relative',
                  transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)' // Bouncy transition
                }}
              />
            </Tooltip>
          ))}
        </Box>
      </motion.div>
    </Box>
  );
};

export default CommunityDotTabs;
