import React from 'react';
import {
  Dialog,
  DialogContent,
  IconButton,
  Typography,
  Box,
  Card,
  CardMedia,
  Link,
  Stack,
  Chip,
  Divider,
  useTheme,
} from '@mui/material';
import {
  Close as CloseIcon,
  ThumbUp as LikeIcon,
  Comment as CommentIcon,
  Share as ShareIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { EVENT_TYPES } from './EventTypes';

const EventModal = ({ event, open, onClose }) => {
  const theme = useTheme();

  const renderContent = () => {
    switch (event?.type) {
      case EVENT_TYPES.NEWS:
        return (
          <>
            {event.url_image && (
              <CardMedia
                component="img"
                height="300"
                image={event.url_image}
                alt={event.title}
                sx={{ 
                  borderRadius: 2,
                  mb: 2,
                  objectFit: 'cover'
                }}
              />
            )}
            <Typography variant="h4" gutterBottom sx={{ 
              fontFamily: '"Merriweather", serif',
              fontWeight: 700,
              color: theme.palette.text.primary,
            }}>
              {event.title}
            </Typography>
            {event.url && (
              <Link 
                href={event.url}
                target="_blank"
                rel="noopener noreferrer"
                underline="none"
                sx={{ 
                  display: 'block',
                  mb: 3,
                  color: theme.palette.text.secondary,
                  '&:hover': { color: theme.palette.primary.main }
                }}
              >
                {event.url_source || new URL(event.url).hostname}
              </Link>
            )}
            <Typography variant="body1" sx={{ mb: 3, whiteSpace: 'pre-wrap' }}>
              {event.description}
            </Typography>
          </>
        );

      case EVENT_TYPES.MEDIA:
        return (
          <>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
              {event.title}
            </Typography>
            <Box sx={{ 
              my: 3,
              borderRadius: 2,
              overflow: 'hidden',
              bgcolor: theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.05)',
            }}>
              {event.media_type === 'video' ? (
                <video
                  src={event.media_url}
                  controls
                  style={{ width: '100%', maxHeight: 600, objectFit: 'contain' }}
                />
              ) : event.media_type === 'audio' ? (
                <Box sx={{ p: 3 }}>
                  <audio
                    src={event.media_url}
                    controls
                    style={{ width: '100%' }}
                  />
                </Box>
              ) : (
                <img
                  src={event.media_url}
                  alt={event.title}
                  style={{ width: '100%', maxHeight: 600, objectFit: 'contain' }}
                />
              )}
            </Box>
            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
              {event.description}
            </Typography>
          </>
        );

      case EVENT_TYPES.REMARK:
      default:
        return (
          <>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
              {event.title}
            </Typography>
            <Typography 
              variant="body1" 
              sx={{ 
                mb: 3,
                whiteSpace: 'pre-wrap',
                fontSize: '1.1rem',
                lineHeight: 1.7,
              }}
            >
              {event.description}
            </Typography>
          </>
        );
    }
  };

  if (!event) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          background: theme.palette.mode === 'dark' 
            ? 'linear-gradient(145deg, rgba(0, 0, 0, 0.8), rgba(0, 0, 0, 0.9))'
            : 'linear-gradient(145deg, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.85))',
          backdropFilter: 'blur(10px)',
        }
      }}
    >
      <Box sx={{ position: 'relative', p: 3 }}>
        {/* Close Button */}
        <IconButton
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: theme.palette.text.secondary,
          }}
        >
          <CloseIcon />
        </IconButton>

        {/* Event Metadata */}
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 3 }}>
          <Typography variant="caption" color="text.secondary">
            {format(new Date(event.event_date), 'MMM d, yyyy h:mm a')}
          </Typography>
          <Typography variant="caption" color="text.secondary">•</Typography>
          <Typography variant="caption" color="text.secondary">
            by {event.author}
          </Typography>
        </Stack>

        {/* Main Content */}
        <DialogContent sx={{ px: 0, pb: 0 }}>
          {renderContent()}

          {/* Tags */}
          {event.tags && event.tags.length > 0 && (
            <Box sx={{ mt: 3 }}>
              <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                {event.tags.map((tag) => (
                  <Chip
                    key={tag}
                    label={tag}
                    size="small"
                    sx={{
                      bgcolor: theme.palette.mode === 'dark' 
                        ? 'rgba(255, 255, 255, 0.1)'
                        : 'rgba(0, 0, 0, 0.05)',
                    }}
                  />
                ))}
              </Stack>
            </Box>
          )}

          {/* Interaction Bar */}
          <Divider sx={{ my: 3 }} />
          <Stack 
            direction="row" 
            spacing={3} 
            sx={{ 
              pb: 2,
              color: theme.palette.text.secondary,
            }}
          >
            <Stack direction="row" spacing={1} alignItems="center">
              <IconButton size="small">
                <LikeIcon fontSize="small" />
              </IconButton>
              <Typography variant="body2">24 Likes</Typography>
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center">
              <IconButton size="small">
                <CommentIcon fontSize="small" />
              </IconButton>
              <Typography variant="body2">12 Comments</Typography>
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center">
              <IconButton size="small">
                <ShareIcon fontSize="small" />
              </IconButton>
              <Typography variant="body2">Share</Typography>
            </Stack>
          </Stack>
        </DialogContent>
      </Box>
    </Dialog>
  );
};

export default EventModal;
