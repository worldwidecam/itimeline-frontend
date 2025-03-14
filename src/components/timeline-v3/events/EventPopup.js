import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Typography,
  Box,
  useTheme,
  Paper,
  Link,
} from '@mui/material';
import {
  Close as CloseIcon,
  Comment as RemarkIcon,
  Newspaper as NewsIcon,
  PermMedia as MediaIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import { EVENT_TYPES, EVENT_TYPE_COLORS } from './EventTypes';
import TagList from './cards/TagList';

const EventPopup = ({ event, open, onClose }) => {
  const theme = useTheme();
  const typeColors = EVENT_TYPE_COLORS[event?.type] || EVENT_TYPE_COLORS[EVENT_TYPES.REMARK];
  const color = theme.palette.mode === 'dark' ? typeColors.dark : typeColors.light;

  const formatDate = (dateStr) => {
    try {
      if (!dateStr) return 'Invalid date';
      
      // Parse the ISO string into a Date object
      const date = parseISO(dateStr);
      
      // Format with "Published on" prefix, without seconds
      // Use explicit formatting to ensure consistency
      return `Published on ${format(date, 'MMM d, yyyy, h:mm a')}`;
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  const formatEventDate = (dateStr) => {
    try {
      if (!dateStr) return 'Invalid date';
      
      // Parse the ISO string into a Date object
      const date = parseISO(dateStr);
      
      // Format event date without "Published on" prefix
      // Use explicit formatting to ensure consistency
      return format(date, 'MMM d, yyyy, h:mm a');
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  const TypeIcon = {
    [EVENT_TYPES.REMARK]: RemarkIcon,
    [EVENT_TYPES.NEWS]: NewsIcon,
    [EVENT_TYPES.MEDIA]: MediaIcon,
  }[event?.type] || RemarkIcon;

  if (!event) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperComponent={motion.div}
      PaperProps={{
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -20 },
        style: {
          overflow: 'visible',
          backgroundColor: theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.9)' : 'rgba(255,255,255,0.9)',
          backdropFilter: 'blur(10px)',
        },
      }}
    >
      <DialogTitle 
        sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          borderBottom: 1,
          borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TypeIcon sx={{ color }} />
          <Typography variant="h6" component="div">
            {event.title}
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ mt: 2 }}>
        <Box sx={{ mb: 3 }}>
          {/* Main Content Area - varies by type but maintains consistent layout */}
          {event.type === EVENT_TYPES.REMARK && (
            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
              {event.description}
            </Typography>
          )}
          
          {event.type === EVENT_TYPES.NEWS && (
            <>
              {event.url && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                    Source URL:
                  </Typography>
                  <Link href={event.url} target="_blank" rel="noopener noreferrer">
                    {event.url}
                  </Link>
                </Box>
              )}
              {event.description && (
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                  {event.description}
                </Typography>
              )}
            </>
          )}

          {event.type === EVENT_TYPES.MEDIA && (
            <>
              {event.mediaUrl && (
                <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center' }}>
                  <img 
                    src={event.mediaUrl} 
                    alt={event.title}
                    style={{ 
                      maxWidth: '100%', 
                      maxHeight: '500px',
                      objectFit: 'contain',
                      borderRadius: theme.shape.borderRadius,
                    }} 
                  />
                </Box>
              )}
              {event.description && (
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                  {event.description}
                </Typography>
              )}
            </>
          )}
        </Box>

        <Box sx={{ mt: 'auto' }}>
          <TagList tags={event.tags} />
          {event.event_date && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'right', mt: 1 }}>
              Timeline Date: {formatEventDate(event.event_date)}
            </Typography>
          )}
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'right', mt: 0.5 }}>
            {formatDate(event.created_at)}
          </Typography>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default EventPopup;
