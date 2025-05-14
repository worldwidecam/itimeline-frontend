import React from 'react';
import { Box, IconButton, Tooltip, useTheme } from '@mui/material';
import { styled } from '@mui/material/styles';
import { motion } from 'framer-motion';
import { Movie as MediaIcon } from '@mui/icons-material';

// Styled component for the video details button
const VideoCorner = styled(Box)(({ theme, color, isSelected }) => ({
  position: 'absolute',
  top: 0,
  right: 0,
  width: '60px',
  height: '60px',
  background: 'transparent',
  overflow: 'hidden',
  cursor: 'pointer',
  zIndex: 10,
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    right: 0,
    width: '60px',
    height: '60px',
    background: color || theme.palette.primary.main,
    transformOrigin: '100% 0',
    transition: 'all 0.3s ease',
    clipPath: 'polygon(100% 0, 0 0, 100% 100%)',
    boxShadow: isSelected ? '0 0 10px rgba(255, 255, 255, 0.5)' : 'none',
  },
  '&:hover::before': {
    width: '65px',
    height: '65px',
    transform: 'translateZ(5px)',
  },
  '&:active::before': {
    width: '55px',
    height: '55px',
  }
}));

// Styled component for the invisible larger clickable area
const ClickableOverlay = styled(Box)({
  position: 'absolute',
  top: 0,
  right: 0,
  width: '80px',  // Larger than the visible corner
  height: '80px', // Larger than the visible corner
  background: 'transparent',
  cursor: 'pointer',
  zIndex: 9, // Lower than the visual corner but still above other elements
});

const VideoDetailsButton = ({ onClick, tooltip = "View Full Video", color, isSelected }) => {
  const theme = useTheme();
  
  const handleClick = (e) => {
    e.stopPropagation();
    if (onClick) onClick(e);
  };
  
  return (
    <Tooltip title={tooltip} placement="left">
      <Box sx={{ position: 'absolute', top: 0, right: 0 }}>
        {/* Invisible larger clickable area */}
        <ClickableOverlay onClick={handleClick} />
        
        {/* Visual corner element */}
        <VideoCorner 
          color={color}
          isSelected={isSelected}
          onClick={handleClick}
        >
          <motion.div
            initial={{ scale: 1 }}
            animate={isSelected ? { 
              scale: [1, 1.2, 1],
              transition: { 
                repeat: Infinity, 
                repeatType: "loop", 
                duration: 2 
              }
            } : {}}
            whileTap={{ scale: 0.9 }}
            style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              zIndex: 11,
              color: theme.palette.mode === 'dark' ? '#fff' : '#fff',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <MediaIcon fontSize="medium" />
          </motion.div>
        </VideoCorner>
      </Box>
    </Tooltip>
  );
};

export default VideoDetailsButton;
