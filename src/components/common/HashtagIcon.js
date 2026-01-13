import React from 'react';
import { Box } from '@mui/material';

/**
 * HashtagIcon - A custom tic-tac-toe board icon for hashtag mentions
 * Displays as a grid pattern with thicker, rounded lines
 * Used for hashtag mentions in info cards and other components
 */
const HashtagIcon = ({ fontSize = 'medium', sx = {} }) => {
  // Map fontSize to pixel size
  const sizeMap = {
    small: 20,
    medium: 28,
    large: 32,
    inherit: 'inherit'
  };
  
  const size = typeof fontSize === 'string' ? sizeMap[fontSize] : fontSize;
  const numericSize = typeof size === 'number' ? size : 28;

  return (
    <svg
      width={numericSize * 0.8}
      height={numericSize * 0.8}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{
        display: 'inline-flex',
        flexShrink: 0,
        color: '#4f4646ff',
        marginLeft: '4px',
        ...sx
      }}
    >
      {/* Vertical lines */}
      <line x1="8" y1="3" x2="8" y2="21" />
      <line x1="16" y1="3" x2="16" y2="21" />
      {/* Horizontal lines */}
      <line x1="3" y1="8" x2="21" y2="8" />
      <line x1="3" y1="16" x2="21" y2="16" />
    </svg>
  );
};

export default HashtagIcon;
