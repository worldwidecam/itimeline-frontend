import React from 'react';
import { Paper, Typography, Box, IconButton, Tooltip } from '@mui/material';
import { formatDistance } from 'date-fns';
import LinkIcon from '@mui/icons-material/Link';
import ImageIcon from '@mui/icons-material/Image';

const TimelinePost = ({ post, position, viewMode }) => {
  const getPostStyle = () => {
    // Calculate position based on viewMode and post date
    const postDate = new Date(post.event_date);
    let left = '50%';
    
    if (viewMode === 'day') {
      const hours = postDate.getHours();
      const minutes = postDate.getMinutes();
      const dayProgress = (hours * 60 + minutes) / (24 * 60);
      left = `${dayProgress * 100}%`;
    } else if (viewMode === 'week') {
      const dayOfWeek = postDate.getDay();
      const timeOfDay = (postDate.getHours() * 60 + postDate.getMinutes()) / (24 * 60);
      left = `${((dayOfWeek + timeOfDay) / 7) * 100}%`;
    } else if (viewMode === 'month') {
      const dayOfMonth = postDate.getDate();
      const daysInMonth = new Date(postDate.getFullYear(), postDate.getMonth() + 1, 0).getDate();
      left = `${((dayOfMonth - 1) / daysInMonth) * 100}%`;
    }

    return {
      position: 'absolute',
      left,
      transform: 'translateX(-50%)',
      maxWidth: '200px',
      zIndex: 3
    };
  };

  return (
    <Box sx={getPostStyle()}>
      <Paper
        elevation={3}
        sx={{
          p: 1,
          mb: 1,
          backgroundColor: 'background.paper',
          borderRadius: '8px',
          cursor: 'pointer',
          transition: 'transform 0.2s',
          '&:hover': {
            transform: 'scale(1.05)',
          }
        }}
      >
        <Typography variant="subtitle2" noWrap>
          {post.title}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
          {post.url && (
            <Tooltip title="Has URL">
              <IconButton size="small">
                <LinkIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {post.image && (
            <Tooltip title="Has Image">
              <IconButton size="small">
                <ImageIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          <Typography variant="caption" color="text.secondary">
            {formatDistance(new Date(post.event_date), new Date(), { addSuffix: true })}
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default TimelinePost;
