import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  Typography,
  IconButton,
  Avatar,
  CircularProgress,
  Alert,
  Snackbar,
} from '@mui/material';
import { Delete, Edit } from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import axios from 'axios';

const CommentSection = ({ eventId }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [editingComment, setEditingComment] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const fetchCurrentUser = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        return;
      }
      const response = await axios.get('http://localhost:5000/api/user/current', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setCurrentUser(response.data);
    } catch (error) {
      console.error('Error fetching current user:', error);
    }
  };

  const fetchComments = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`http://localhost:5000/api/event/${eventId}/comments`);
      setComments(response.data);
    } catch (error) {
      setError('Failed to load comments. Please try again later.');
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
    fetchComments();
  }, [eventId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    if (!currentUser) {
      showSnackbar('Please log in to comment', 'error');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `http://localhost:5000/api/event/${eventId}/comments`,
        { content: newComment },
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      setNewComment('');
      showSnackbar('Comment posted successfully');
      fetchComments();
    } catch (error) {
      showSnackbar('Failed to post comment. Please try again.', 'error');
      console.error('Error creating comment:', error);
    }
  };

  const handleEdit = async (commentId) => {
    if (!editContent.trim()) return;

    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `http://localhost:5000/api/comments/${commentId}`,
        { content: editContent },
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      setEditingComment(null);
      setEditContent('');
      showSnackbar('Comment updated successfully');
      fetchComments();
    } catch (error) {
      showSnackbar('Failed to update comment. Please try again.', 'error');
      console.error('Error updating comment:', error);
    }
  };

  const handleDelete = async (commentId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `http://localhost:5000/api/comments/${commentId}`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      showSnackbar('Comment deleted successfully');
      fetchComments();
    } catch (error) {
      showSnackbar('Failed to delete comment. Please try again.', 'error');
      console.error('Error deleting comment:', error);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="h6" gutterBottom>
        Comments
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {currentUser ? (
        <Box component="form" onSubmit={handleSubmit} sx={{ mb: 2 }}>
          <TextField
            fullWidth
            multiline
            rows={2}
            variant="outlined"
            placeholder="Write a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            sx={{ mb: 1 }}
          />
          <Button type="submit" variant="contained" color="primary">
            Post Comment
          </Button>
        </Box>
      ) : (
        <Alert severity="info" sx={{ mb: 2 }}>
          Please log in to comment
        </Alert>
      )}

      <List>
        {comments.map((comment) => (
          <ListItem
            key={comment.id}
            alignItems="flex-start"
            sx={{
              bgcolor: 'background.paper',
              mb: 1,
              borderRadius: 1,
              boxShadow: 1,
            }}
          >
            <Box sx={{ display: 'flex', width: '100%' }}>
              <Avatar sx={{ mr: 2 }}>
                {comment.username ? comment.username[0].toUpperCase() : '?'}
              </Avatar>
              <Box sx={{ flex: 1 }}>
                {editingComment === comment.id ? (
                  <Box sx={{ width: '100%' }}>
                    <TextField
                      fullWidth
                      multiline
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      sx={{ mb: 1 }}
                    />
                    <Button
                      onClick={() => handleEdit(comment.id)}
                      variant="contained"
                      size="small"
                      sx={{ mr: 1 }}
                    >
                      Save
                    </Button>
                    <Button
                      onClick={() => setEditingComment(null)}
                      variant="outlined"
                      size="small"
                    >
                      Cancel
                    </Button>
                  </Box>
                ) : (
                  <>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        {comment.username}
                      </Typography>
                      <Typography variant="caption" sx={{ ml: 1, color: 'text.secondary' }}>
                        {formatDistanceToNow(new Date(comment.created_at))} ago
                      </Typography>
                    </Box>
                    <Typography variant="body1">{comment.content}</Typography>
                    {currentUser && currentUser.id === comment.user_id && (
                      <Box sx={{ mt: 1 }}>
                        <IconButton
                          size="small"
                          onClick={() => {
                            setEditingComment(comment.id);
                            setEditContent(comment.content);
                          }}
                        >
                          <Edit fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(comment.id)}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Box>
                    )}
                  </>
                )}
              </Box>
            </Box>
          </ListItem>
        ))}
      </List>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CommentSection;
