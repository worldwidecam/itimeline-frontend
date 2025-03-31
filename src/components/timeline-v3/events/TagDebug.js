import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper } from '@mui/material';
import api from '../../../utils/api';

const TagDebug = ({ timelineId }) => {
  const [eventData, setEventData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/api/timeline-v3/${timelineId}/events`);
        console.log('API Response:', response.data);
        setEventData(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching events:', err);
        setError(err.message || 'Failed to fetch events');
        setLoading(false);
      }
    };

    if (timelineId) {
      fetchEvents();
    }
  }, [timelineId]);

  if (loading) return <Typography>Loading event data...</Typography>;
  if (error) return <Typography color="error">Error: {error}</Typography>;
  if (!eventData || eventData.length === 0) return <Typography>No events found</Typography>;

  return (
    <Paper sx={{ p: 2, m: 2 }}>
      <Typography variant="h6">Event Data Debug</Typography>
      {eventData.map(event => (
        <Box key={event.id} sx={{ mb: 2, p: 2, border: '1px solid #ccc' }}>
          <Typography variant="subtitle1">Event: {event.title}</Typography>
          <Typography variant="body2">ID: {event.id}</Typography>
          <Typography variant="body2">Type: {event.type}</Typography>
          <Typography variant="body2">Tags: {event.tags ? 
            (event.tags.length > 0 ? 
              event.tags.map(tag => tag.name).join(', ') : 
              'No tags') : 
            'Tags property missing'}
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>Raw event data:</Typography>
          <Box 
            component="pre" 
            sx={{ 
              p: 1, 
              bgcolor: 'background.paper', 
              border: '1px solid #ddd',
              borderRadius: 1,
              overflow: 'auto',
              fontSize: '0.75rem'
            }}
          >
            {JSON.stringify(event, null, 2)}
          </Box>
        </Box>
      ))}
    </Paper>
  );
};

export default TagDebug;
