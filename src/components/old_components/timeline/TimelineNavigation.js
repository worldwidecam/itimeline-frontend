import React from 'react';
import { Box, Typography, IconButton } from '@mui/material';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';

const TimelineNavigation = ({ 
  position = 'left', 
  onNavigate,
  label
}) => {
  return (
    <Box sx={{
      position: 'absolute',
      [position]: 0,
      top: '50%',
      transform: 'translateY(-50%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      zIndex: 2,
      backgroundColor: 'white',
      borderRadius: '20px',
      padding: '4px',
      boxShadow: 1
    }}>
      <Typography 
        variant="caption" 
        sx={{ 
          mb: 1,
          color: 'text.secondary'
        }}
      >
        {label}
      </Typography>
      <IconButton 
        onClick={() => onNavigate(position === 'left' ? -1 : 1)} 
        size="small"
        sx={{
          pointerEvents: 'auto',
          '&:hover': {
            backgroundColor: 'grey.100'
          }
        }}
      >
        {position === 'left' ? <NavigateBeforeIcon /> : <NavigateNextIcon />}
      </IconButton>
    </Box>
  );
};

export default TimelineNavigation;
