import React from 'react';
import { Paper, Typography, Box, IconButton, Chip, Link, Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { formatDistanceToNow, format } from 'date-fns';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PersonIcon from '@mui/icons-material/Person';
import AudiotrackIcon from '@mui/icons-material/Audiotrack';
import LinkIcon from '@mui/icons-material/Link';
import DeleteIcon from '@mui/icons-material/Delete';
import EventIcon from '@mui/icons-material/Event';

const TimelineEvent = ({ event, position = 'left', onDelete }) => {
  const theme = useTheme();
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);

  // Return a placeholder if event is undefined or null
  if (!event) {
    return (
      <Paper
        elevation={3}
        sx={{
          p: 2,
          mb: 3,
          maxWidth: '600px',
          width: '100%',
          backgroundColor: theme.palette.background.paper,
          borderRadius: '12px',
          textAlign: 'center'
        }}
      >
        <Typography variant="body2" color="text.secondary">
          No event data available
        </Typography>
      </Paper>
    );
  }

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    onDelete(event);
    setDeleteDialogOpen(false);
  };

  const formatEventDate = (date) => {
    try {
      console.log('===== EVENT DATE FORMATTING DEBUG =====');
      console.log('Original date string:', date);
      console.log('is_exact_user_time flag:', event.is_exact_user_time);
      console.log('Raw event date:', event.raw_event_date);
      
      // NEW APPROACH: If we have a raw date string, use it directly
      if (event.raw_event_date && event.is_exact_user_time === true) {
        try {
          // Parse the raw date string format: MM.DD.YYYY.HH.MM.AMPM
          const parts = event.raw_event_date.split('.');
          if (parts.length >= 6) {
            const month = parseInt(parts[0]);
            const day = parseInt(parts[1]);
            const year = parseInt(parts[2]);
            const hour = parseInt(parts[3]);
            const minute = parts[4].padStart(2, '0');
            const ampm = parts[5].toUpperCase();
            
            // Format the date in a user-friendly way
            const monthNames = [
              'January', 'February', 'March', 'April', 'May', 'June',
              'July', 'August', 'September', 'October', 'November', 'December'
            ];
            
            const formattedDate = `${monthNames[month-1]} ${day}, ${year} at ${hour}:${minute} ${ampm}`;
            console.log('Formatted date from raw string:', formattedDate);
            console.log('=======================================');
            return formattedDate;
          }
        } catch (error) {
          console.error('Error parsing raw date string:', error);
          // Fall back to the next method
        }
      }
      
      // Check if this event has the exact user time flag (fallback to old method)
      if (event.is_exact_user_time === true) {
        // For user-selected times, parse the date components directly
        // This ensures we display exactly what the user selected
        const dateObj = new Date(date);
        
        // Check if it's a valid date
        if (isNaN(dateObj.getTime())) {
          console.error('Invalid date:', date);
          return 'Date unknown';
        }
        
        // Format the date using date-fns
        const formattedDate = format(dateObj, 'PPP p'); // e.g., "April 29, 1945 at 3:30 PM"
        console.log('Formatted date with exact user time:', formattedDate);
        console.log('=======================================');
        return formattedDate;
      } else {
        // For non-exact times, use the server's time
        const formattedDate = format(new Date(date), 'PPP p');
        console.log('Formatted date with server time:', formattedDate);
        console.log('=======================================');
        return formattedDate;
      }
    } catch (e) {
      console.error('Error formatting event date:', e, date);
      return 'Date unknown';
    }
  };

  const formatCreatedDate = (date) => {
    try {
      return format(new Date(date), 'PPP p'); // Use the same format as event date
    } catch (e) {
      return 'Date unknown';
    }
  };

  return (
    <>
      <Paper
        elevation={3}
        sx={{
          p: 0,
          mb: 3,
          maxWidth: '600px',
          width: '100%',
          backgroundColor: theme.palette.background.paper,
          borderRadius: '12px',
          overflow: 'hidden',
          position: 'relative',
          transition: 'transform 0.2s, box-shadow 0.2s',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: theme.shadows[6],
          },
          [theme.breakpoints.up('md')]: {
            ml: position === 'left' ? 0 : 'auto',
            mr: position === 'right' ? 0 : 'auto',
          },
        }}
      >
        {/* Delete Button */}
        <IconButton
          onClick={handleDeleteClick}
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            zIndex: 2,
            color: 'error.main',
            backgroundColor: 'background.paper',
            '&:hover': {
              backgroundColor: 'error.light',
              color: 'common.white',
            },
          }}
        >
          <DeleteIcon />
        </IconButton>

        {/* Media Section */}
        {event.media_url && (
          <Box sx={{ width: '100%', position: 'relative' }}>
            {event.media_type === 'image' ? (
              <Box
                component="img"
                src={event.media_url}
                alt={event.title}
                sx={{
                  width: '100%',
                  height: '200px',
                  objectFit: 'cover',
                  borderTopLeftRadius: '12px',
                  borderTopRightRadius: '12px',
                }}
              />
            ) : event.media_type === 'audio' ? (
              <Box
                sx={{
                  p: 2,
                  backgroundColor: theme.palette.grey[100],
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                }}
              >
                <AudiotrackIcon color="primary" />
                <audio controls style={{ width: '100%' }}>
                  <source src={event.media_url} type="audio/mpeg" />
                  Your browser does not support the audio element.
                </audio>
              </Box>
            ) : null}
          </Box>
        )}

        {/* Content Section */}
        <Box sx={{ p: 3 }}>
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column',
            mb: 2
          }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                color: theme.palette.text.primary,
                lineHeight: 1.3,
                mb: 1
              }}
            >
              {event.title}
            </Typography>
            
            {/* Event Date Chip - Moved next to title */}
            <Chip
              icon={<EventIcon />}
              label={formatEventDate(event.event_date)}
              size="small"
              color="primary"
              sx={{ alignSelf: 'flex-start', mb: 1 }}
            />
          </Box>

          <Box
            sx={{
              display: 'flex',
              gap: 2,
              mb: 2,
              flexWrap: 'wrap',
              alignItems: 'center',
            }}
          >
            <Chip
              icon={<PersonIcon />}
              label={`Created by User ${event.created_by}`}
              size="small"
              variant="outlined"
            />
            {event.created_at && (
              <Chip
                icon={<AccessTimeIcon />}
                label={`Published On ${formatCreatedDate(event.created_at)}`}
                size="small"
                variant="outlined"
                color="secondary"
              />
            )}
          </Box>

          <Typography
            variant="body1"
            sx={{
              color: theme.palette.text.secondary,
              lineHeight: 1.6,
              mb: 2,
            }}
          >
            {event.description}
          </Typography>

          {/* URL Preview Section */}
          {event.url && (
            <Box
              sx={{
                mt: 2,
                p: 2,
                bgcolor: theme.palette.grey[50],
                borderRadius: 1,
                border: `1px solid ${theme.palette.grey[200]}`,
              }}
            >
              <Link
                href={event.url}
                target="_blank"
                rel="noopener noreferrer"
                underline="none"
                sx={{ display: 'block' }}
              >
                <Box sx={{ display: 'flex', gap: 2 }}>
                  {event.url_image && (
                    <Box
                      component="img"
                      src={event.url_image}
                      alt={event.url_title || 'Link preview'}
                      sx={{
                        width: 120,
                        height: 80,
                        objectFit: 'cover',
                        borderRadius: 1,
                      }}
                    />
                  )}
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <LinkIcon fontSize="small" color="action" />
                      <Typography
                        variant="subtitle2"
                        sx={{
                          color: theme.palette.primary.main,
                          fontWeight: 600,
                        }}
                      >
                        {event.url_title || 'Visit Link'}
                      </Typography>
                    </Box>
                    {event.url_description && (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {event.url_description}
                      </Typography>
                    )}
                  </Box>
                </Box>
              </Link>
            </Box>
          )}
        </Box>
      </Paper>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete Event</DialogTitle>
        <DialogContent>
          Are you sure you want to delete "{event.title}"?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error">Delete</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default TimelineEvent;
