import React from 'react';
import {
  Box,
  Typography,
  Paper,
  useTheme,
} from '@mui/material';
import { motion } from 'framer-motion';

/**
 * ImageMediaPopup - A specialized component for displaying image media in a two-container layout
 * Left container: Fixed image display with black background
 * Right container: Scrollable content area for event details
 */
const ImageMediaPopup = ({ event, mediaSource }) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        display: 'flex',
        width: '100%',
        height: '100%',
      }}
    >
      {/* Left container - Fixed image display */}
      <Box
        sx={{
          width: '60%',
          height: '100%',
          position: 'relative',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          bgcolor: 'black',
          overflow: 'hidden',
          borderRight: '1px solid',
          borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
        }}
      >
        {/* The image itself - centered and fixed */}
        <motion.img 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          src={mediaSource} 
          alt={event.title || "Image Media"}
          style={{ 
            maxWidth: '100%',
            maxHeight: '100%',
            objectFit: 'contain',
            display: 'block',
            cursor: 'pointer',
          }} 
          onClick={(e) => {
            // Open image in new tab for full resolution view
            window.open(mediaSource, '_blank');
          }}
          onError={(e) => {
            console.error('Error loading image:', e);
            e.target.onerror = null;
            e.target.src = 'https://via.placeholder.com/400x300?text=Image+Not+Available';
          }}
        />
        
        {/* Fullscreen button overlay */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 16,
            right: 16,
            bgcolor: 'rgba(0,0,0,0.5)',
            color: 'white',
            borderRadius: '50%',
            width: 40,
            height: 40,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            opacity: 0.7,
            transition: 'all 0.2s ease',
            '&:hover': {
              opacity: 1,
              transform: 'scale(1.1)'
            },
            zIndex: 5,
          }}
          onClick={() => window.open(mediaSource, '_blank')}
          title="View full size"
        >
          <Box component="span" sx={{ fontSize: 20 }}>⤢</Box>
        </Box>
      </Box>
      
      {/* Right container - Scrollable content */}
      <Box
        sx={{
          width: '40%',
          height: '100%',
          overflow: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 3,
          p: 3,
        }}
      >
        {/* Description section */}
        {event.description && (
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 2,
              bgcolor: theme.palette.mode === 'dark'
                ? 'rgba(0,0,0,0.2)'
                : 'rgba(0,0,0,0.02)',
              border: '1px solid',
              borderColor: theme.palette.mode === 'dark'
                ? 'rgba(255,255,255,0.05)'
                : 'rgba(0,0,0,0.05)',
            }}
          >
            <Typography 
              variant="body1" 
              sx={{ 
                whiteSpace: 'pre-wrap',
                lineHeight: 1.7,
                color: theme.palette.mode === 'dark'
                  ? 'rgba(255,255,255,0.85)'
                  : 'rgba(0,0,0,0.75)',
              }}
            >
              {event.description}
            </Typography>
          </Paper>
        )}
        
        {/* Placeholder for children - allows passing additional content */}
        <Box sx={{ flexGrow: 1 }}>
          {/* This is where additional content will be rendered */}
        </Box>
      </Box>
    </Box>
  );
};

export default ImageMediaPopup;
