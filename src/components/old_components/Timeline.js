import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Avatar,
  IconButton,
  Button,
  Tooltip,
  Chip,
  Skeleton,
  Collapse,
  Card,
  CardContent,
  CardActions,
  CardHeader,
} from '@mui/material';
import {
  Comment as CommentIcon,
  Favorite as FavoriteIcon,
  Share as ShareIcon,
  MoreVert as MoreVertIcon,
  AccountTree as BranchIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

// Styled components
const TimelineContainer = styled(Box)(({ theme }) => ({
  position: 'relative',
  padding: theme.spacing(2),
  '&::before': {
    content: '""',
    position: 'absolute',
    left: '50%',
    transform: 'translateX(-50%)',
    width: 2,
    height: '100%',
    backgroundColor: theme.palette.divider,
    zIndex: 0,
  },
}));

const TimelineItem = styled(motion.div)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'flex-start',
  alignItems: 'flex-start',
  position: 'relative',
  marginBottom: theme.spacing(4),
  width: '100%',
  '&:nth-of-type(even)': {
    flexDirection: 'row-reverse',
    '& .timeline-content': {
      marginLeft: 0,
      marginRight: theme.spacing(4),
    },
    '& .timeline-dot': {
      left: 'auto',
      right: '50%',
      transform: 'translate(50%, -50%)',
    },
  },
}));

const TimelineDot = styled(Box)(({ theme }) => ({
  width: 16,
  height: 16,
  borderRadius: '50%',
  backgroundColor: theme.palette.primary.main,
  position: 'absolute',
  left: '50%',
  top: '50%',
  transform: 'translate(-50%, -50%)',
  zIndex: 1,
}));

const TimelineContent = styled(Card)(({ theme }) => ({
  flex: '0 1 45%',
  marginLeft: theme.spacing(4),
  position: 'relative',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: '50%',
    right: '100%',
    width: theme.spacing(4),
    height: 2,
    backgroundColor: theme.palette.divider,
    transform: 'translateY(-50%)',
  },
}));

const Timeline = ({ timelineId }) => {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedPost, setExpandedPost] = useState(null);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/timelines/${timelineId}/posts`);
        setPosts(response.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to load timeline posts');
        setLoading(false);
      }
    };

    fetchPosts();
  }, [timelineId]);

  const handleLike = async (postId) => {
    try {
      await axios.post(`http://localhost:5000/api/posts/${postId}/like`);
      // Update posts state to reflect the new like
      setPosts(posts.map(post => 
        post.id === postId 
          ? { ...post, likes: post.likes + 1, liked_by_user: true }
          : post
      ));
    } catch (err) {
      setError('Failed to like post');
    }
  };

  const handleComment = (postId) => {
    setExpandedPost(expandedPost === postId ? null : postId);
  };

  if (loading) {
    return (
      <TimelineContainer>
        {[1, 2, 3].map((i) => (
          <TimelineItem key={i}>
            <TimelineDot />
            <TimelineContent className="timeline-content">
              <Skeleton variant="rectangular" height={200} />
            </TimelineContent>
          </TimelineItem>
        ))}
      </TimelineContainer>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <TimelineContainer>
      <AnimatePresence>
        {posts.map((post, index) => (
          <TimelineItem
            key={post.id}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <TimelineDot className="timeline-dot" />
            <TimelineContent className="timeline-content">
              <CardHeader
                avatar={
                  <Avatar src={post.author.avatar_url} alt={post.author.username}>
                    {post.author.username[0]}
                  </Avatar>
                }
                action={
                  <IconButton>
                    <MoreVertIcon />
                  </IconButton>
                }
                title={post.author.username}
                subheader={new Date(post.created_at).toLocaleString()}
              />
              {post.image_url && (
                <Box
                  component="img"
                  src={post.image_url}
                  alt="Post image"
                  sx={{
                    width: '100%',
                    height: 'auto',
                    objectFit: 'cover',
                    maxHeight: 300,
                  }}
                />
              )}
              <CardContent>
                <Typography variant="body1">{post.content}</Typography>
                {post.branch_name && (
                  <Chip
                    icon={<BranchIcon />}
                    label={post.branch_name}
                    size="small"
                    sx={{ mt: 1 }}
                  />
                )}
              </CardContent>
              <CardActions disableSpacing>
                <Tooltip title="Like">
                  <IconButton
                    onClick={() => handleLike(post.id)}
                    color={post.liked_by_user ? 'primary' : 'default'}
                  >
                    <FavoriteIcon />
                  </IconButton>
                </Tooltip>
                <Typography variant="body2" color="text.secondary">
                  {post.likes}
                </Typography>
                <Tooltip title="Comment">
                  <IconButton onClick={() => handleComment(post.id)}>
                    <CommentIcon />
                  </IconButton>
                </Tooltip>
                <Typography variant="body2" color="text.secondary">
                  {post.comments?.length || 0}
                </Typography>
                <Tooltip title="Share">
                  <IconButton>
                    <ShareIcon />
                  </IconButton>
                </Tooltip>
              </CardActions>
              <Collapse in={expandedPost === post.id} timeout="auto" unmountOnExit>
                <CardContent>
                  {/* Comments section - to be implemented */}
                  <Typography paragraph>Comments coming soon...</Typography>
                </CardContent>
              </Collapse>
            </TimelineContent>
          </TimelineItem>
        ))}
      </AnimatePresence>
    </TimelineContainer>
  );
};

export default Timeline;
