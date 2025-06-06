import React from 'react';
import { Box, Typography } from '@mui/material';

/**
 * Component to display timeline names with proper formatting
 * For community timelines, adds the "i-" prefix in Lobster font
 * 
 * @param {Object} props
 * @param {string} props.name - The timeline name
 * @param {string} props.type - The timeline type ('hashtag' or 'community')
 * @param {Object} props.sx - Additional styling for the container
 * @param {Object} props.typographyProps - Additional props for the Typography component
 */
const TimelineNameDisplay = ({ name, type, sx = {}, typographyProps = {} }) => {
  // For hashtag timelines, show the name with # prefix
  if (type !== 'community') {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', ...sx }}>
        <Typography 
          component="span" 
          sx={{ 
            mr: 0.5,
            color: '#1976d2', // Blue color like the community prefix
          }}
        >
          #
        </Typography>
        <Typography {...typographyProps} component="span">
          {name}
        </Typography>
      </Box>
    );
  }

  // For community timelines, add the "i-" prefix with Lobster font
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', ...sx }}>
      <Typography 
        component="span" 
        sx={{ 
          fontFamily: 'Lobster, cursive',
          mr: 0.5,
          color: '#1976d2', // Blue color like the hashtag symbol
          fontSize: 'calc(1.3em)' // 30% larger than the parent font size
        }}
      >
        i -
      </Typography>
      <Typography {...typographyProps} component="span">
        {name}
      </Typography>
    </Box>
  );
};

export default TimelineNameDisplay;
