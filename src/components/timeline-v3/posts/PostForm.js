import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  IconButton,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import FileUpload from '../shared/FileUpload';

const PostForm = ({ open, onClose, onSubmit }) => {
  const [content, setContent] = useState('');
  const [media, setMedia] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ content, media });
    setContent('');
    setMedia(null);
    onClose();
  };

  const handleFileSelect = (file) => {
    setMedia(file);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          Create Post
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={4}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's on your mind?"
            variant="outlined"
            margin="normal"
            required
          />
          <Box mt={2}>
            <FileUpload onFileSelect={handleFileSelect} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={!content.trim()}
          >
            Post
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default PostForm;
