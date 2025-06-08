import React, { useState, useEffect } from 'react';
import { Box, Tooltip, keyframes } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';

/**
 * A minimalist dot-style tab component for community timelines
 * Displays as a row of dots with the active tab highlighted
 * Used for navigation between Timeline, Members, and Admin views
 */

// Define the pulse animation keyframe
const pulseAnimation = keyframes`
  0% {
    transform: scale(1);
    opacity: 0.6;
  }
  50% {
    transform: scale(1.5);
    opacity: 0.3;
  }
  100% {
    transform: scale(1.8);
    opacity: 0;
  }
`;
const CommunityDotTabs = ({ timelineId, userRole }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(0);
  
  // Define the available tabs - always include admin tab for now
  // Later we can add proper role checking
  const tabs = [
    { name: 'Timeline', path: `/timeline-v3/${timelineId}`, tooltip: 'Timeline View' },
    { name: 'Members', path: `/timeline-v3/${timelineId}/members`, tooltip: 'Community Members' },
    { name: 'Admin', path: `/timeline-v3/${timelineId}/admin`, tooltip: 'Admin Panel' },
  ];
  
  // Determine active tab based on current path
  useEffect(() => {
    const currentPath = location.pathname;
    if (currentPath.includes('/members')) {
      setActiveTab(1);
    } else if (currentPath.includes('/admin')) {
      setActiveTab(2);
    } else {
      setActiveTab(0);
    }
  }, [location.pathname]);
  
  const handleDotClick = (index) => {
    setActiveTab(index);
    navigate(tabs[index].path);
  };

  return (
    <Box 
      sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        my: 1.5,
        position: 'relative',
        zIndex: 10
      }}
    >
      <Box
        sx={{
          display: 'flex',
          gap: 2,
          alignItems: 'center',
          bgcolor: 'background.paper',
          borderRadius: 10,
          py: 0.75,
          px: 2,
          boxShadow: 1,
          '&:hover': {
            boxShadow: 2,
          },
          transition: 'box-shadow 0.3s ease'
        }}
      >
        {tabs.map((tab, index) => (
          <Tooltip key={index} title={tab.tooltip} arrow>
            <Box
              onClick={() => handleDotClick(index)}
              sx={{
                width: index === activeTab ? 10 : 8,
                height: index === activeTab ? 10 : 8,
                borderRadius: '50%',
                bgcolor: index === activeTab ? 'primary.main' : 'action.disabled',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  transform: 'scale(1.2)',
                  bgcolor: index === activeTab ? 'primary.main' : 'action.active'
                },
                position: 'relative',
                '&::after': index === activeTab ? {
                  content: '""',
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  borderRadius: '50%',
                  bgcolor: 'primary.main',
                  opacity: 0.4,
                  animation: `${pulseAnimation} 1.5s infinite`,
                  top: 0,
                  left: 0,
                  zIndex: -1
                } : {}
              }}
            />
          </Tooltip>
        ))}
      </Box>
    </Box>
  );
};

export default CommunityDotTabs;
