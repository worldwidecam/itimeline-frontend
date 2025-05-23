import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { EVENT_TYPE_COLORS, EVENT_TYPES } from '../EventTypes';

/**
 * Component for rendering Media event markers in the timeline
 */
const MediaEventMarker = ({ event }) => {
  const theme = useTheme();
  
  // Handle different media types
  if (!event.media_type || event.media_type === 'image') {
    return (
      <Paper
        elevation={3}
        sx={{
          maxWidth: 250, 
          cursor: 'pointer',
          overflow: 'hidden',
          borderRadius: '12px',
          // Type-specific background and border colors
          bgcolor: theme.palette.mode === 'dark' 
            ? 'rgba(30,20,40,0.95)' // Darker purple for dark mode
            : 'rgba(245,240,255,0.97)', // Light purple for light mode
          border: `1px solid ${theme.palette.mode === 'dark' 
            ? 'rgba(180,160,220,0.2)' // Purple border for dark mode
            : 'rgba(140,100,220,0.15)'}`, // Purple border for light mode
          boxShadow: theme.palette.mode === 'dark' 
            ? '0 8px 20px rgba(0,0,0,0.6), 0 2px 8px rgba(100,50,150,0.3)' 
            : '0 8px 20px rgba(0,0,0,0.15), 0 2px 8px rgba(100,50,150,0.15)'
        }}
      >
        <Box sx={{ position: 'relative' }}>
          {/* Image */}
          <Box 
            component="img"
            src={event.media_url}
            alt={event.title}
            sx={{
              width: '100%',
              height: 150,
              objectFit: 'cover',
              borderRadius: '4px',
            }}
          />
          
          {/* Title overlay at bottom */}
          <Box sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: 'rgba(0,0,0,0.7)',
            color: 'white',
            p: 1,
            borderRadius: '0 0 4px 4px'
          }}>
            <Typography variant="subtitle2" sx={{ 
              fontWeight: 'bold',
              lineHeight: 1.2,
              textAlign: 'center'
            }}>
              {event.title}
            </Typography>
            
            {/* Date in small text */}
            <Typography variant="caption" sx={{ 
              display: 'block',
              textAlign: 'center',
              mt: 0.5,
              opacity: 0.8
            }}>
              {event && event.event_date ? new Date(event.event_date).toLocaleString() : ''}
            </Typography>
          </Box>
        </Box>
      </Paper>
    );
  } else if (event.media_type === 'video') {
    return (
      <Paper
        elevation={3}
        sx={{
          maxWidth: 250, 
          cursor: 'pointer',
          overflow: 'hidden',
          borderRadius: '12px',
          // Type-specific background and border colors
          bgcolor: theme.palette.mode === 'dark' 
            ? 'rgba(30,20,40,0.95)' // Darker purple for dark mode
            : 'rgba(245,240,255,0.97)', // Light purple for light mode
          border: `1px solid ${theme.palette.mode === 'dark' 
            ? 'rgba(180,160,220,0.2)' // Purple border for dark mode
            : 'rgba(140,100,220,0.15)'}`, // Purple border for light mode
          boxShadow: theme.palette.mode === 'dark' 
            ? '0 8px 20px rgba(0,0,0,0.6), 0 2px 8px rgba(100,50,150,0.3)' 
            : '0 8px 20px rgba(0,0,0,0.15), 0 2px 8px rgba(100,50,150,0.15)'
        }}
      >
        {/* Video thumbnail with play button overlay */}
        <Box sx={{ position: 'relative' }}>
          <Box 
            component="img"
            src={event.media_url || event.thumbnail_url}
            alt={event.title}
            sx={{
              width: '100%',
              height: 150,
              objectFit: 'cover',
              borderRadius: '4px',
              filter: 'brightness(0.9)'
            }}
          />
          
          {/* Play button overlay */}
          <Box sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 48,
            height: 48,
            borderRadius: '50%',
            bgcolor: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            '&:hover': { bgcolor: 'rgba(0,0,0,0.85)' }
          }}>
            <Box sx={{
              width: 0,
              height: 0,
              borderTop: '10px solid transparent',
              borderBottom: '10px solid transparent',
              borderLeft: '16px solid white',
              marginLeft: '4px'
            }} />
          </Box>
        </Box>
        
        {/* Title and date */}
        <Box sx={{ p: 1 }}>
          <Typography variant="subtitle2" sx={{ 
            fontWeight: 'bold',
            lineHeight: 1.2
          }}>
            {event.title}
          </Typography>
          
          <Typography variant="caption" color="text.secondary" sx={{ 
            display: 'block',
            mt: 0.5
          }}>
            {event && event.event_date ? new Date(event.event_date).toLocaleString() : ''}
          </Typography>
        </Box>
      </Paper>
    );
  } else if (event.media_type === 'audio') {
    return (
      <Paper
        elevation={3}
        sx={{
          maxWidth: 250, 
          cursor: 'pointer',
          overflow: 'hidden',
          borderRadius: '12px',
          // Type-specific background and border colors
          bgcolor: theme.palette.mode === 'dark' 
            ? 'rgba(30,20,40,0.95)' // Darker purple for dark mode
            : 'rgba(245,240,255,0.97)', // Light purple for light mode
          border: `1px solid ${theme.palette.mode === 'dark' 
            ? 'rgba(180,160,220,0.2)' // Purple border for dark mode
            : 'rgba(140,100,220,0.15)'}`, // Purple border for light mode
          boxShadow: theme.palette.mode === 'dark' 
            ? '0 8px 20px rgba(0,0,0,0.6), 0 2px 8px rgba(100,50,150,0.3)' 
            : '0 8px 20px rgba(0,0,0,0.15), 0 2px 8px rgba(100,50,150,0.15)'
        }}
      >
        {/* Audio visualization */}
        <Box sx={{
          height: 120,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: theme.palette.mode === 'dark' ? 'rgba(30,30,30,0.9)' : 'rgba(245,245,245,0.9)',
          borderRadius: '4px 4px 0 0',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Audio icon */}
          <Box sx={{
            width: 50,
            height: 50,
            borderRadius: '50%',
            bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2
          }}>
            <Box component="span" sx={{
              fontSize: '1.8rem',
              color: EVENT_TYPE_COLORS[EVENT_TYPES.MEDIA][theme.palette.mode === 'dark' ? 'dark' : 'light']
            }}>♫</Box>
          </Box>
          
          {/* Audio waveform visualization in background */}
          <Box sx={{
            position: 'absolute',
            bottom: 10,
            left: 0,
            right: 0,
            height: 40,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            gap: '3px',
            opacity: 0.5
          }}>
            {Array.from({ length: 27 }).map((_, i) => (
              <Box 
                key={i}
                sx={{
                  width: 3,
                  height: `${5 + Math.sin(i * 0.5) * 25}px`,
                  bgcolor: EVENT_TYPE_COLORS[EVENT_TYPES.MEDIA][theme.palette.mode === 'dark' ? 'dark' : 'light'],
                  borderRadius: '1px'
                }}
              />
            ))}
          </Box>
        </Box>
        
        {/* Title and date */}
        <Box sx={{ 
          p: 1,
          bgcolor: theme.palette.mode === 'dark' ? 'rgba(20,20,20,0.9)' : 'rgba(240,240,240,0.9)',
          borderRadius: '0 0 4px 4px'
        }}>
          <Typography variant="subtitle2" sx={{ 
            fontWeight: 'bold',
            lineHeight: 1.2
          }}>
            {event.title}
          </Typography>
          
          <Typography variant="caption" color="text.secondary" sx={{ 
            display: 'block',
            mt: 0.5
          }}>
            {event && event.event_date ? new Date(event.event_date).toLocaleString() : ''}
          </Typography>
        </Box>
      </Paper>
    );
  }
  
  // Default fallback
  return null;
};

export default MediaEventMarker;
