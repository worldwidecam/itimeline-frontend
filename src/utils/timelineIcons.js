import React from 'react';
import TagIcon from '@mui/icons-material/Tag';        // hashtag
import PeopleIcon from '@mui/icons-material/People';  // community
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder'; // personal (heart)
import LockIcon from '@mui/icons-material/Lock';      // personal (lock)
import { Box } from '@mui/material';

/**
 * Returns the appropriate MUI icon component for a timeline type.
 * @param {string} type - One of 'hashtag', 'community', 'personal'.
 * @returns JSX element
 */
export const getTimelineIcon = (type) => {
  switch ((type || '').toLowerCase()) {
    case 'hashtag':
      return <TagIcon fontSize="small" />;
    case 'community':
      return <PeopleIcon fontSize="small" />;
    case 'personal':
      // layered heart + lock (standard platform design)
      return (
        <Box sx={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
          <FavoriteBorderIcon sx={{ fontSize: 18 }} />
          <LockIcon
            sx={{
              fontSize: 10,
              position: 'absolute',
              bottom: -1,
              right: -2,
              bgcolor: 'background.paper',
              borderRadius: '50%',
              p: 0.1,
            }}
          />
        </Box>
      );
    default:
      return <TagIcon fontSize="small" />;
  }
};
