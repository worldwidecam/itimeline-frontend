import React
import api from '../utils/api';
, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  Alert
} from '@mui/material';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import TimelineIcon from './TimelineIcon';

function TimelineList() {
  const [timelines, setTimelines] = useState([]);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTimelines = async () => {
      try {
        const response = await api.get('/api/timelines');
        setTimelines(response.data);
      } catch (error) {
        console.error('Error fetching timelines:', error);
      }
    };
    fetchTimelines();
  }, []);

  const handleCreateTimeline = () => {
    navigate('/timeline/create');
  };

  return (
    <Box
      sx={{
        position: 'fixed',
        right: 0,
        top: 64, // Height of the navbar
        width: '300px',
        height: 'calc(100vh - 64px)',
        backgroundColor: 'background.paper',
        borderLeft: 1,
        borderColor: 'divider',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Button
          variant="contained"
          color="primary"
          onClick={() => navigate('/create-timeline')}
          sx={{ mb: 2 }}
        >
          Create Timeline
        </Button>
        <Button
          component={Link}
          to="/timeline-v3/1"
          variant="outlined"
          color="primary"
          fullWidth
          sx={{
            mb: 2,
            borderStyle: 'dashed',
            '&:hover': {
              borderStyle: 'dashed',
              backgroundColor: 'rgba(25, 118, 210, 0.04)'
            }
          }}
        >
          Try Timeline V3 Beta
        </Button>
      </Box>

      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        {timelines.length === 0 ? (
          <Alert severity="info" sx={{ mt: 2 }}>
            No timelines yet. Be the first to create one!
          </Alert>
        ) : (
          <Grid container spacing={2} direction="column">
            {timelines.map((timeline) => (
              <Grid item key={timeline.id}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" component="h2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <TimelineIcon timelineName={timeline.name} />
                      <Link
                        to={`/timeline/${timeline.id}`}
                        style={{
                          textDecoration: 'none',
                          color: 'inherit'
                        }}
                      >
                        {timeline.name}
                      </Link>
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {timeline.description}
                    </Typography>
                    <Button
                      component={Link}
                      to={`/timeline/${timeline.id}`}
                      variant="outlined"
                      size="small"
                      fullWidth
                    >
                      View Timeline
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </Box>
  );
}

export default TimelineList;
