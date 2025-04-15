import React
import api from '../utils/api';
, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  MergeType as MergeIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

function TimelineManager() {
  const { user } = useAuth();
  const [timelines, setTimelines] = useState([]);
  const [mergeDialogOpen, setMergeDialogOpen] = useState(false);
  const [selectedTimeline, setSelectedTimeline] = useState(null);
  const [targetTimeline, setTargetTimeline] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchTimelines = async () => {
    try {
      const response = await api.get('/api/timelines');
      setTimelines(response.data);
    } catch (error) {
      setError('Error fetching timelines');
      console.error('Error:', error);
    }
  };

  useEffect(() => {
    fetchTimelines();
  }, []);

  const handleDelete = async (timelineId) => {
    try {
      await api.delete(`/api/timelines/${timelineId}`);
      setSuccess('Timeline deleted successfully');
      fetchTimelines();
    } catch (error) {
      setError(error.response?.data?.error || 'Error deleting timeline');
      console.error('Error:', error);
    }
  };

  const handleMerge = async () => {
    if (!selectedTimeline || !targetTimeline) {
      setError('Please select both timelines');
      return;
    }

    try {
      await api.post('/api/timelines/merge', {
        source_id: selectedTimeline,
        target_id: targetTimeline
      });
      setSuccess('Timelines merged successfully');
      setMergeDialogOpen(false);
      setSelectedTimeline(null);
      setTargetTimeline('');
      fetchTimelines();
    } catch (error) {
      setError(error.response?.data?.error || 'Error merging timelines');
      console.error('Error:', error);
    }
  };

  if (!user || user.id !== 1) {
    return null;
  }

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Timeline Manager
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      <List>
        {timelines.map((timeline) => (
          <ListItem
            key={timeline.id}
            secondaryAction={
              timeline.name !== 'general' && (
                <Box>
                  <IconButton
                    edge="end"
                    aria-label="merge"
                    onClick={() => {
                      setSelectedTimeline(timeline.id);
                      setMergeDialogOpen(true);
                    }}
                    sx={{ mr: 1 }}
                  >
                    <MergeIcon />
                  </IconButton>
                  <IconButton
                    edge="end"
                    aria-label="delete"
                    onClick={() => handleDelete(timeline.id)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              )
            }
          >
            <ListItemText
              primary={timeline.name}
              secondary={`Created: ${new Date(timeline.created_at).toLocaleDateString()}`}
            />
          </ListItem>
        ))}
      </List>

      <Dialog open={mergeDialogOpen} onClose={() => setMergeDialogOpen(false)}>
        <DialogTitle>Merge Timeline</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Merge Into</InputLabel>
            <Select
              value={targetTimeline}
              onChange={(e) => setTargetTimeline(e.target.value)}
              label="Merge Into"
            >
              {timelines
                .filter((t) => t.id !== selectedTimeline && t.name !== 'general')
                .map((timeline) => (
                  <MenuItem key={timeline.id} value={timeline.id}>
                    {timeline.name}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMergeDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleMerge} variant="contained" color="primary">
            Merge
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default TimelineManager;
