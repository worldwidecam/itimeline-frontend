import React
import api from '../utils/api';
, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  IconButton,
  Link,
  Divider,
  Paper,
} from '@mui/material';
import { Edit, Delete, ThumbUp } from '@mui/icons-material';
import { format } from 'date-fns';
import CommentSection from './CommentSection';
import axios from 'axios';

const EventDisplay = ({ event, onEdit, onDelete, currentUserId }) => {
  const [upvotes, setUpvotes] = useState(event.upvotes || 0);
  const [linkPreview, setLinkPreview] = useState(null);

  useEffect(() => {
    const fetchLinkPreview = async () => {
      if (event.url) {
        console.log('Fetching preview for URL:', event.url);  // Debug log
        try {
          const response = await api.post('/api/link-preview', {
            url: event.url
          });
          console.log('Link preview response:', response.data);  // Debug log
          setLinkPreview(response.data);
        } catch (error) {
          console.error('Error fetching link preview:', error);
        }
      }
    };

    fetchLinkPreview();
  }, [event.url]);

  const handleUpvote = async () => {
    try {
      // TODO: Implement upvote API endpoint
      setUpvotes(prev => prev + 1);
    } catch (error) {
      console.error('Error upvoting event:', error);
    }
  };

  return (
    <Card sx={{ mb: 2, position: 'relative' }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6" component="div">
            {event.title}
          </Typography>
          <Box>
            {currentUserId === event.created_by && (
              <>
                <IconButton size="small" onClick={() => onEdit(event)}>
                  <Edit />
                </IconButton>
                <IconButton size="small" onClick={() => onDelete(event.id)}>
                  <Delete />
                </IconButton>
              </>
            )}
            <IconButton size="small" onClick={handleUpvote}>
              <ThumbUp />
            </IconButton>
            <Typography variant="body2" component="span" sx={{ ml: 1 }}>
              {upvotes}
            </Typography>
          </Box>
        </Box>

        <Typography color="text.secondary" gutterBottom>
          {format(new Date(event.event_date), 'MMMM d, yyyy')}
        </Typography>

        <Typography variant="body1" sx={{ mt: 2 }}>
          {event.content}
        </Typography>

        {event.url && (
          <>
            {linkPreview ? (
              <Link 
                href={event.url}
                target="_blank"
                rel="noopener noreferrer"
                underline="none"
                sx={{ display: 'block', mt: 2 }}
              >
                <Paper 
                  elevation={3}
                  sx={{
                    p: 2,
                    display: 'flex',
                    gap: 2,
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    }
                  }}
                >
                  {linkPreview.image && (
                    <Box
                      component="img"
                      src={linkPreview.image}
                      alt={linkPreview.title || 'Link preview'}
                      sx={{
                        width: 120,
                        height: 120,
                        objectFit: 'cover',
                        borderRadius: 1
                      }}
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  )}
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="subtitle1" noWrap>
                      {linkPreview.title || event.url}
                    </Typography>
                    {linkPreview.description && (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          mt: 1,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}
                      >
                        {linkPreview.description}
                      </Typography>
                    )}
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                      {new URL(event.url).hostname}
                    </Typography>
                  </Box>
                </Paper>
              </Link>
            ) : (
              // Fallback to simple link while preview loads or if preview fails
              <Link
                href={event.url}
                target="_blank"
                rel="noopener noreferrer"
                sx={{ display: 'block', mt: 1 }}
              >
                {event.url}
              </Link>
            )}
          </>
        )}

        <Divider sx={{ my: 2 }} />

        <CommentSection eventId={event.id} currentUserId={currentUserId} />
      </CardContent>
    </Card>
  );
};

export default EventDisplay;
