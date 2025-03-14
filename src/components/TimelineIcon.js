import React from 'react';
import { Box, useTheme } from '@mui/material';

function TimelineIcon({ timelineName }) {
  const theme = useTheme();
  const isUserCreated = !timelineName.startsWith('#');

  return isUserCreated ? (
    <Box
      component="div"
      sx={{
        width: '0.9em',
        height: '0.9em',
        borderRadius: '50%',
        backgroundColor: theme.palette.primary.main,
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        alignSelf: 'center',
        marginTop: '1px',
        '&::after': {
          content: '""',
          position: 'absolute',
          top: '22%',
          left: '50%',
          transform: 'translate(-50%, 0)',
          width: '40%',
          height: '40%',
          borderRadius: '50%',
          backgroundColor: 'white'
        },
        '&::before': {
          content: '""',
          position: 'absolute',
          bottom: '-15%',
          left: '50%',
          transform: 'translate(-50%, 0)',
          width: '80%',
          height: '40%',
          borderRadius: '40% 40% 0 0',
          backgroundColor: 'white'
        },
        filter: 'drop-shadow(2px 2px 1px rgba(0,0,0,0.5))'
      }}
    />
  ) : (
    <span style={{ 
      color: theme.palette.primary.main,
      alignSelf: 'center',
      marginTop: '1px'
    }}>#</span>
  );
}

export default TimelineIcon;
