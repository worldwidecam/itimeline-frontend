import React from 'react';
import { Box, Typography, IconButton } from '@mui/material';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';

const TimelineNavigation = ({ 
  position = 'left', 
  onNavigate,
  label,
  theme
}) => {
  return (
    <Box sx={{
      position: 'absolute',
      [position]: position === 'left' ? '20px' : '20px',
      top: '50%',
      transform: 'translateY(-50%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      zIndex: 2,
      backgroundColor: theme.palette.mode === 'light' ? 'white' : theme.palette.background.paper,
      borderRadius: '20px',
      padding: '4px',
      boxShadow: theme.shadows[1]
    }}>
      <Typography 
        variant="caption" 
        sx={{ 
          mb: 1,
          color: theme.palette.text.secondary
        }}
      >
        {label}
      </Typography>
      <IconButton 
        onClick={() => onNavigate(position === 'left' ? -1 : 1)} 
        size="small"
        sx={{
          pointerEvents: 'auto',
          color: theme.palette.text.primary,
          '&:hover': {
            backgroundColor: theme.palette.action.hover
          }
        }}
      >
        {position === 'left' ? <NavigateBeforeIcon /> : <NavigateNextIcon />}
      </IconButton>
    </Box>
  );
};

export default TimelineNavigation;
