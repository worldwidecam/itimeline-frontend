import React from 'react';
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Avatar,
  Box,
  IconButton,
} from '@mui/material';
import { MoreVert as MoreVertIcon } from '@mui/icons-material';

const TimelinePost = ({ post }) => {
  return (
    <Card sx={{ mb: 2, borderRadius: '12px' }}>
      <CardContent>
        <Box display="flex" alignItems="center" mb={2}>
          <Avatar src={post.author.avatar} alt={post.author.username} />
          <Box ml={2} flex={1}>
            <Typography variant="subtitle1" component="div">
              {post.author.username}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {new Date(post.timestamp).toLocaleString()}
            </Typography>
          </Box>
          <IconButton size="small">
            <MoreVertIcon />
          </IconButton>
        </Box>
        <Typography variant="body1" component="div" mb={2}>
          {post.content}
        </Typography>
        {post.media && (
          <CardMedia
            component={post.media.type === 'image' ? 'img' : 'audio'}
            src={post.media.url}
            alt={post.media.type === 'image' ? 'Post image' : undefined}
            controls={post.media.type === 'audio'}
            sx={{
              borderRadius: '8px',
              maxHeight: post.media.type === 'image' ? '400px' : 'auto',
              objectFit: 'contain',
            }}
          />
        )}
      </CardContent>
    </Card>
  );
};

export default TimelinePost;
