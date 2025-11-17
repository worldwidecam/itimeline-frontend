import React from 'react';
import { Box, Typography, Tooltip } from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';

/**
 * Component to display timeline names with proper formatting
 * For community timelines, adds the "i-" prefix in Lobster font
 * 
 * @param {Object} props
 * @param {string} props.name - The timeline name
 * @param {string} props.type - The timeline type ('hashtag' or 'community')
 * @param {string} props.visibility - The visibility of the timeline ('public' or 'private'), only applicable for community timelines
 * @param {Object} props.sx - Additional styling for the container
 * @param {Object} props.typographyProps - Additional props for the Typography component
 */
const TimelineNameDisplay = ({ name, type, visibility = 'public', sx = {}, typographyProps = {} }) => {
  // For personal timelines, use "My-" prefix similar to community style
  if (type === 'personal') {
    return (
      <Box 
        sx={{ display: 'flex', alignItems: 'center', ...sx }}
        aria-label={`Personal timeline: ${name}`}
      >
        <Tooltip title="Personal Timeline" arrow placement="top">
          <Typography 
            {...typographyProps}
            component="div"
            sx={{
              ...typographyProps.sx,
              display: 'flex',
              alignItems: 'center',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            <span 
              style={{ 
                fontFamily: 'Lobster, cursive',
                marginRight: '4px',
                color: 'inherit',
                flexShrink: 0,
              }}
              aria-hidden="true"
            >
              My-
            </span>
            {name}
          </Typography>
        </Tooltip>
      </Box>
    );
  }

  // For hashtag timelines, show the name with # prefix
  if (type !== 'community') {
    return (
      <Box 
        sx={{ display: 'flex', alignItems: 'center', ...sx }}
        aria-label={`Hashtag timeline: ${name}`}
      >
        <Tooltip title="Hashtag Timeline" arrow placement="top">
          <Typography 
            {...typographyProps}
            component="div"
            sx={{
              ...typographyProps.sx,
              display: 'flex',
              alignItems: 'center',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            <span 
              style={{ 
                marginRight: '4px',
                color: 'inherit', // Use the same color as the parent Typography
                flexShrink: 0,
              }}
              aria-hidden="true"
            >
              #
            </span>
            {name}
          </Typography>
        </Tooltip>
      </Box>
    );
  }

  // For community timelines, add the "i-" prefix with Lobster font
  const tooltipTitle = visibility === 'private' ? 'Private Community Timeline' : 'Community Timeline';
  const ariaLabel = visibility === 'private' ? `Private community timeline: ${name}` : `Community timeline: ${name}`;
  
  // Create a combined component that includes both the prefix and name
  // This matches how hashtag timelines display the "#" symbol
  return (
    <Box 
      sx={{ display: 'flex', alignItems: 'center', pl: '10px', ...sx }}
      aria-label={ariaLabel}
    >
      <Tooltip title={tooltipTitle} arrow placement="top">
        <Typography 
          {...typographyProps}
          component="div"
          sx={{
            ...typographyProps.sx,
            display: 'flex',
            alignItems: 'center',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          <span 
            style={{ 
              fontFamily: 'Lobster, cursive',
              marginRight: '4px',
              color: 'inherit', // Use the same color as the parent Typography
              flexShrink: 0,
            }}
            aria-hidden="true"
          >
            i -
          </span>
          {name}
          
          {/* Show lock icon for private community timelines */}
          {visibility === 'private' && (
            <Tooltip title="Private timeline" arrow placement="top">
              <LockIcon 
                sx={{ 
                  ml: 0.5, 
                  fontSize: '0.8rem', 
                  color: 'text.secondary',
                  flexShrink: 0,
                }} 
                aria-hidden="true" // Already included in the parent aria-label
              />
            </Tooltip>
          )}
        </Typography>
      </Tooltip>
    </Box>
  );
};

export default TimelineNameDisplay;
