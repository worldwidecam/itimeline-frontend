import React
import api from '../utils/api';
, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Avatar,
  Divider,
  Link
} from '@mui/material';
import { ThumbUp, Comment, Close } from '@mui/icons-material';
import { formatDistanceToNow, format } from 'date-fns';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const TimelinePosts = ({ timelineId }) => {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newPost, setNewPost] = useState({
    title: '',
    content: '',
    event_date: '',
    url: ''
  });
  const [error, setError] = useState('');

  const fetchPosts = async () => {
    try {
      const response = await api.get(`/api/timeline/${timelineId}/posts`);
      setPosts(response.data);
    } catch (error) {
      console.error('Error fetching posts:', error);
      setError('Failed to load posts');
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [timelineId]);

  const handleCreatePost = async () => {
    try {
      // Temporarily skip token check for testing
      // const token = localStorage.getItem('token');
      // if (!token) {
      //   setError('Please log in to create a post');
      //   return;
      // }

      const response = await api.post(
        `/api/timeline/${timelineId}/posts`,
        newPost,
        {
          // headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      setIsCreateDialogOpen(false);
      setNewPost({ title: '', content: '', event_date: '', url: '' });
      setError('');
      fetchPosts();
    } catch (error) {
      console.error('Error creating post:', error);
      setError(error.response?.data?.error || 'Failed to create post');
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography 
          variant="h5" 
          component="h2" 
          sx={{ 
            color: (theme) => theme.palette.mode === 'light' ? 'text.primary' : 'white'
          }}
        >
          Discussion Posts
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => setIsCreateDialogOpen(true)}
        >
          Create Post
        </Button>
      </Box>

      {posts.map((post) => (
        <Card 
          key={post.id} 
          sx={{ 
            mb: 2, 
            bgcolor: (theme) => theme.palette.mode === 'light' 
              ? 'background.paper' 
              : 'rgba(255, 255, 255, 0.05)',
            color: (theme) => theme.palette.mode === 'light' 
              ? 'text.primary' 
              : 'white'
          }}
        >
          <CardContent>
            <Box display="flex" alignItems="center" mb={1}>
              <Avatar sx={{ mr: 1, bgcolor: 'primary.main' }}>
                {post.username[0].toUpperCase()}
              </Avatar>
              <Box>
                <Typography variant="h6" sx={{ color: (theme) => theme.palette.mode === 'light' ? 'text.primary' : 'white' }}>{post.title}</Typography>
                <Typography variant="caption" sx={{ color: (theme) => theme.palette.mode === 'light' ? 'text.secondary' : 'rgba(255, 255, 255, 0.7)' }}>
                  Posted by {post.username} {formatDistanceToNow(new Date(post.created_at))} ago
                </Typography>
              </Box>
            </Box>
            <Typography variant="body2" sx={{ color: (theme) => theme.palette.mode === 'light' ? 'text.secondary' : 'rgba(255, 255, 255, 0.7)', mt: 1 }}>
              Event Date: {format(new Date(post.event_date), 'MMMM d, yyyy')}
            </Typography>
            <Typography variant="body1" sx={{ mt: 2, color: (theme) => theme.palette.mode === 'light' ? 'text.primary' : 'rgba(255, 255, 255, 0.9)' }}>
              {post.content}
            </Typography>
            {post.url && (
              <Box
                sx={{
                  mt: 2,
                  border: 1,
                  borderColor: (theme) => theme.palette.mode === 'light' ? 'divider' : 'rgba(255, 255, 255, 0.1)',
                  borderRadius: 1,
                  overflow: 'hidden',
                  '&:hover': {
                    borderColor: 'primary.main',
                  },
                }}
              >
                <Link
                  href={post.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    textDecoration: 'none',
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    alignItems: 'flex-start',
                    color: 'inherit',
                  }}
                >
                  {post.url_image && (
                    <Box
                      sx={{
                        width: { xs: '100%', sm: 200 },
                        height: { xs: 200, sm: 150 },
                        flexShrink: 0,
                        bgcolor: 'rgba(0, 0, 0, 0.1)',
                        backgroundImage: `url(${post.url_image})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                      }}
                    />
                  )}
                  <Box sx={{ p: 2, flexGrow: 1 }}>
                    {post.url_title && (
                      <Typography variant="subtitle1" sx={{ color: (theme) => theme.palette.mode === 'light' ? 'text.primary' : 'white', fontWeight: 'medium' }}>
                        {post.url_title}
                      </Typography>
                    )}
                    {post.url_description && (
                      <Typography
                        variant="body2"
                        sx={{
                          color: (theme) => theme.palette.mode === 'light' ? 'text.secondary' : 'rgba(255, 255, 255, 0.7)',
                          mt: 0.5,
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {post.url_description}
                      </Typography>
                    )}
                    <Typography
                      variant="caption"
                      sx={{ color: (theme) => theme.palette.mode === 'light' ? 'text.secondary' : 'rgba(255, 255, 255, 0.5)', mt: 1, display: 'block' }}
                    >
                      {new URL(post.url).hostname}
                    </Typography>
                  </Box>
                </Link>
              </Box>
            )}
          </CardContent>
          <Divider sx={{ bgcolor: (theme) => theme.palette.mode === 'light' ? 'divider' : 'rgba(255, 255, 255, 0.1)' }} />
          <CardActions>
            <Button
              size="small"
              startIcon={<ThumbUp />}
              onClick={() => {/* TODO: Implement upvoting */}}
              sx={{ color: (theme) => theme.palette.mode === 'light' ? 'text.secondary' : 'rgba(255, 255, 255, 0.7)' }}
            >
              {post.upvotes}
            </Button>
            <Button
              size="small"
              startIcon={<Comment />}
              onClick={() => {/* TODO: Implement comments */}}
              sx={{ color: (theme) => theme.palette.mode === 'light' ? 'text.secondary' : 'rgba(255, 255, 255, 0.7)' }}
            >
              Comments
            </Button>
          </CardActions>
        </Card>
      ))}

      <Dialog
        open={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ m: 0, p: 2, position: 'relative' }}>
          Create New Post
          <IconButton
            aria-label="close"
            onClick={() => setIsCreateDialogOpen(false)}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: 'primary.main',
              '&:hover': {
                color: 'primary.light',
              },
            }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {error && (
            <Typography color="error" sx={{ mb: 2 }}>
              {error}
            </Typography>
          )}
          <TextField
            fullWidth
            label="Title"
            value={newPost.title}
            onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Content"
            value={newPost.content}
            onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
            margin="normal"
            multiline
            rows={4}
            required
          />
          <TextField
            fullWidth
            label="Event Date"
            type="datetime-local"
            value={newPost.event_date}
            onChange={(e) => setNewPost({ ...newPost, event_date: e.target.value })}
            margin="normal"
            required
            InputLabelProps={{
              shrink: true,
            }}
            inputProps={{
              style: { color: (theme) => theme.palette.mode === 'light' ? 'text.primary' : 'white' }
            }}
            sx={{
              '& input::-webkit-calendar-picker-indicator': {
                filter: 'invert(1)',
              }
            }}
          />
          <TextField
            fullWidth
            label="URL (optional)"
            value={newPost.url}
            onChange={(e) => setNewPost({ ...newPost, url: e.target.value })}
            margin="normal"
            type="url"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleCreatePost}
            variant="contained"
            color="primary"
            disabled={!newPost.title || !newPost.content || !newPost.event_date}
          >
            Create Post
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TimelinePosts;
