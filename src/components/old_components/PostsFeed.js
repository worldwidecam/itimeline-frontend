import React
import api from '../utils/api';
, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  Chip,
  Avatar,
  Stack,
  Divider,
  Menu,
  MenuItem,
  Select,
  FormControl,
  InputLabel
} from '@mui/material';
import {
  ThumbUp as ThumbUpIcon,
  Comment as CommentIcon,
  MoreVert as MoreVertIcon,
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

function PostsFeed() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState('newest');
  const [loading, setLoading] = useState(false);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/posts?page=${page}&sort=${sortBy}`);
      setPosts(response.data.posts);
      setTotalPages(response.data.pages);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [page, sortBy]);

  const handleSortChange = (event) => {
    setSortBy(event.target.value);
    setPage(1);
  };

  const handleUpvote = async (postId) => {
    if (!user) return;
    try {
      await api.post(`/api/post/${postId}/upvote`);
      fetchPosts();
    } catch (error) {
      console.error('Error upvoting post:', error);
    }
  };

  const handlePromoteVote = async (postId) => {
    if (!user) return;
    try {
      await api.post(`/api/post/${postId}/promote-vote`);
      fetchPosts();
    } catch (error) {
      console.error('Error voting for promotion:', error);
    }
  };

  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto', py: 4 }}>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography 
          variant="h3" 
          component="h1" 
          sx={{ 
            fontFamily: 'Playfair Display, serif',
            fontWeight: 'bold',
            borderBottom: '3px double #000',
            position: 'relative',
            '&::after': {
              content: '""',
              position: 'absolute',
              bottom: '-10px',
              left: '0',
              width: '100%',
              height: '1px',
              backgroundColor: '#000',
            }
          }}
        >
          Today's Headlines
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Sort By</InputLabel>
            <Select value={sortBy} onChange={handleSortChange} label="Sort By">
              <MenuItem value="newest">Latest Edition</MenuItem>
              <MenuItem value="popular">Most Read</MenuItem>
              <MenuItem value="promoted">Breaking News</MenuItem>
            </Select>
          </FormControl>
          {user && (
            <Button
              component={Link}
              to="/create-post"
              variant="contained"
              color="primary"
              sx={{
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                '&:hover': {
                  bgcolor: 'primary.dark'
                }
              }}
            >
              Write Article
            </Button>
          )}
        </Box>
      </Box>

      {loading ? (
        <Typography>Loading latest stories...</Typography>
      ) : (
        <Stack spacing={4}>
          {posts.map((post) => (
            <Card 
              key={post.id} 
              sx={{ 
                borderRadius: 2,
                boxShadow: 3,
                transition: 'all 0.3s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 6,
                },
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <CardContent sx={{ p: 0 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                  {(post.image || post.url_image) && (
                    <Box 
                      sx={{ 
                        width: '100%',
                        height: 300,
                        overflow: 'hidden',
                        position: 'relative',
                        '&::after': {
                          content: '""',
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          right: 0,
                          height: '30%',
                          background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0) 100%)',
                        }
                      }}
                    >
                      <img
                        src={post.image ? `${post.image}` : post.url_image}
                        alt={post.title}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          transition: 'transform 0.3s ease-in-out',
                        }}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://via.placeholder.com/800x400?text=No+Image+Available';
                        }}
                      />
                    </Box>
                  )}
                  
                  <Box sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Typography 
                        variant="overline" 
                        sx={{ 
                          color: 'text.secondary',
                          fontFamily: 'Playfair Display, serif',
                          letterSpacing: 1
                        }}
                      >
                        {format(new Date(post.created_at), 'MMMM dd, yyyy')}
                      </Typography>
                      <Stack direction="row" spacing={1}>
                        {post.tags && post.tags.map((tag) => (
                          <Chip
                            key={tag}
                            label={tag}
                            size="small"
                            sx={{
                              bgcolor: 'primary.main',
                              color: 'white',
                              fontFamily: 'Playfair Display, serif',
                              '&:hover': {
                                bgcolor: 'primary.dark',
                              }
                            }}
                          />
                        ))}
                      </Stack>
                    </Box>

                    <Typography 
                      variant="h4" 
                      component={Link}
                      to={`/post/${post.id}`}
                      sx={{ 
                        fontFamily: 'Playfair Display, serif',
                        fontWeight: 'bold',
                        lineHeight: 1.2,
                        color: 'text.primary',
                        textDecoration: 'none',
                        display: 'block',
                        mb: 2,
                        '&:hover': {
                          color: 'primary.main',
                        }
                      }}
                    >
                      {post.title}
                    </Typography>

                    <Typography 
                      variant="body1" 
                      color="text.secondary"
                      sx={{ 
                        mb: 2,
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        fontFamily: 'Georgia, serif'
                      }}
                    >
                      {post.content}
                    </Typography>

                    <Divider sx={{ my: 2 }} />

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar src={post.author.avatar_url} alt={post.author.username} />
                        <Typography 
                          variant="subtitle2"
                          sx={{ fontFamily: 'Playfair Display, serif' }}
                        >
                          By {post.author.username}
                        </Typography>
                      </Box>

                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <IconButton onClick={() => handleUpvote(post.id)} color={post.upvoted ? "primary" : "default"}>
                          <ThumbUpIcon />
                          <Typography variant="caption" sx={{ ml: 0.5 }}>
                            {post.upvotes}
                          </Typography>
                        </IconButton>
                        <IconButton>
                          <CommentIcon />
                          <Typography variant="caption" sx={{ ml: 0.5 }}>
                            {post.comment_count}
                          </Typography>
                        </IconButton>
                        <IconButton 
                          onClick={() => handlePromoteVote(post.id)}
                          color={post.promoted ? "secondary" : "default"}
                        >
                          <TrendingUpIcon />
                          <Typography variant="caption" sx={{ ml: 0.5 }}>
                            {post.promoted}
                          </Typography>
                        </IconButton>
                      </Box>
                    </Box>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}
      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 4 }}>
        <Button
          disabled={page === 1}
          onClick={() => setPage(p => p - 1)}
        >
          Previous
        </Button>
        <Button
          disabled={page === totalPages}
          onClick={() => setPage(p => p + 1)}
        >
          Next
        </Button>
      </Box>
    </Box>
  );
}

export default PostsFeed;
