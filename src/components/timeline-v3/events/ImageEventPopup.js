import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Typography,
  Box,
  useTheme,
  Paper,
  Link,
  Avatar,
  Chip,
  Divider,
  Snackbar,
  Alert,
  TextField,
  Autocomplete,
  Button,
  CircularProgress,
} from '@mui/material';
import {
  Close as CloseIcon,
  PermMedia as MediaIcon,
  Person as PersonIcon,
  Event as EventIcon,
  AccessTime as AccessTimeIcon,
  Add as AddIcon,
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import { Link as RouterLink } from 'react-router-dom';
import { EVENT_TYPES, EVENT_TYPE_COLORS } from './EventTypes';
import TagList from './cards/TagList';

/**
 * ImageEventPopup - A specialized popup for image media events
 * Features a two-container layout:
 * - Left container (60%): Fixed image display with black background
 * - Right container (40%): Scrollable content area for event details
 * 
 * When open, it signals to TimelineV3 to pause its refresh interval to prevent
 * disruptions to media playback.
 */
const ImageEventPopup = ({ 
  event, 
  open, 
  onClose, 
  mediaSource,
  formatDate,
  formatEventDate,
  color,
  TypeIcon,
  setIsPopupOpen,
  snackbarOpen,
  handleSnackbarClose,
  error,
  success,
  existingTimelines,
  selectedTimeline,
  setSelectedTimeline,
  loadingTimelines,
  addingToTimeline,
  setError,
  handleAddToTimeline,
  fetchExistingTimelines
}) => {
  const theme = useTheme();
  const [tagSectionExpanded, setTagSectionExpanded] = useState(false);
  const [localEventData, setLocalEventData] = useState(event);
  
  // Notify TimelineV3 when the popup opens or closes to pause/resume refresh
  useEffect(() => {
    // Only update if setIsPopupOpen function is provided
    if (setIsPopupOpen && typeof setIsPopupOpen === 'function') {
      setIsPopupOpen(open);
    }
    
    // Cleanup when component unmounts
    return () => {
      if (setIsPopupOpen && typeof setIsPopupOpen === 'function') {
        setIsPopupOpen(false);
      }
    };
  }, [open, setIsPopupOpen]);
  
  // Fetch timelines when the tag section is expanded
  useEffect(() => {
    if (tagSectionExpanded && existingTimelines.length === 0) {
      // If we have a function to fetch timelines, call it
      if (typeof fetchExistingTimelines === 'function') {
        fetchExistingTimelines();
      }
    }
  }, [tagSectionExpanded, existingTimelines.length, fetchExistingTimelines]);

  // Ensure we have a valid onClose handler
  const handleClose = (event, reason) => {
    if (typeof onClose === 'function') {
      onClose();
    }
  };
  
  // Direct close function for the X button
  const handleCloseButtonClick = () => {
    if (typeof onClose === 'function') {
      onClose();
    }
  };

  if (!event) return null;

  return (
    <AnimatePresence>
      {open && (
        <Dialog
          open={open}
          onClose={handleClose}
          maxWidth="lg" // Larger dialog for the two-container layout
          fullWidth
          closeAfterTransition
          disableEscapeKeyDown={false}
          PaperComponent={motion.div}
          PaperProps={{
            initial: { opacity: 0, y: 20, scale: 0.98 },
            animate: { opacity: 1, y: 0, scale: 1 },
            exit: { opacity: 0, y: 20, scale: 0.98 },
            transition: { duration: 0.3 },
            sx: {
              borderRadius: 3,
              overflow: 'hidden',
              backgroundColor: theme.palette.mode === 'dark' 
                ? 'rgba(10,10,20,0.85)' 
                : 'rgba(255,255,255,0.85)',
              backdropFilter: 'blur(20px)',
              boxShadow: theme.palette.mode === 'dark'
                ? '0 10px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)'
                : '0 10px 40px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.05)',
              border: theme.palette.mode === 'dark'
                ? '1px solid rgba(255,255,255,0.05)'
                : '1px solid rgba(0,0,0,0.05)',
              // Two-container layout
              display: 'flex',
              flexDirection: 'row',
              height: '90vh',
              maxHeight: '90vh',
              overflow: 'hidden'
            },
          }}
        >
          {/* Left container - Fixed image display */}
          <Box
            sx={{
              width: '60%',
              height: '100%',
              position: 'relative',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              bgcolor: 'black',
              overflow: 'hidden',
              borderRight: '1px solid',
              borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
            }}
          >
            {/* The image itself - centered and fixed */}
            <motion.img 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              src={mediaSource} 
              alt={event.title || "Image Media"}
              style={{ 
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain',
                display: 'block',
                cursor: 'pointer',
              }} 
              onClick={(e) => {
                // Open image in new tab for full resolution view
                window.open(mediaSource, '_blank');
              }}
              onError={(e) => {
                console.error('Error loading image:', e);
                e.target.onerror = null;
                e.target.src = 'https://via.placeholder.com/400x300?text=Image+Not+Available';
              }}
            />
            
            {/* Fullscreen button overlay */}
            <Box
              sx={{
                position: 'absolute',
                bottom: 16,
                right: 16,
                bgcolor: 'rgba(0,0,0,0.5)',
                color: 'white',
                borderRadius: '50%',
                width: 40,
                height: 40,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                opacity: 0.7,
                transition: 'all 0.2s ease',
                '&:hover': {
                  opacity: 1,
                  transform: 'scale(1.1)'
                },
                zIndex: 5,
              }}
              onClick={() => window.open(mediaSource, '_blank')}
              title="View full size"
            >
              <Box component="span" sx={{ fontSize: 20 }}>⤢</Box>
            </Box>
          </Box>
          
          {/* Right container - Scrollable content */}
          <Box
            sx={{
              width: '40%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
            }}
          >
            {/* Header with colored accent bar */}
            <Box
              sx={{
                position: 'relative',
                height: 8,
                bgcolor: color,
              }}
            />
            
            {/* Title area */}
            <DialogTitle 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                p: 3,
                pb: 2,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: theme.palette.mode === 'dark'
                      ? 'rgba(255,255,255,0.05)'
                      : 'rgba(0,0,0,0.03)',
                    color: color,
                  }}
                >
                  <TypeIcon fontSize="medium" />
                </Box>
                <Typography 
                  variant="h5" 
                  component="div"
                  sx={{ 
                    fontWeight: 600,
                    color: theme.palette.mode === 'dark'
                      ? 'rgba(255,255,255,0.95)'
                      : 'rgba(0,0,0,0.85)',
                  }}
                >
                  {event.title || "Untitled Event"}
                </Typography>
              </Box>
              <IconButton 
                edge="end" 
                color="inherit" 
                onClick={handleCloseButtonClick} 
                aria-label="close"
                sx={{ 
                  color: theme.palette.mode === 'dark' 
                    ? 'rgba(255,255,255,0.7)' 
                    : 'rgba(0,0,0,0.5)',
                }}
              >
                <CloseIcon />
              </IconButton>
            </DialogTitle>
            
            <Divider sx={{ opacity: 0.5 }} />
            
            {/* Scrollable content area */}
            <DialogContent
              sx={{
                height: '100%',
                p: 3,
                pt: 3,
                pb: 3,
                display: 'flex',
                flexDirection: 'column',
                gap: 3,
                overflow: 'auto',
              }}
            >
              {/* Description section */}
              {event.description && (
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    borderRadius: 2,
                    bgcolor: theme.palette.mode === 'dark'
                      ? 'rgba(0,0,0,0.2)'
                      : 'rgba(0,0,0,0.02)',
                    border: '1px solid',
                    borderColor: theme.palette.mode === 'dark'
                      ? 'rgba(255,255,255,0.05)'
                      : 'rgba(0,0,0,0.05)',
                  }}
                >
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      whiteSpace: 'pre-wrap',
                      lineHeight: 1.7,
                      color: theme.palette.mode === 'dark'
                        ? 'rgba(255,255,255,0.85)'
                        : 'rgba(0,0,0,0.75)',
                    }}
                  >
                    {event.description}
                  </Typography>
                </Paper>
              )}
              
              {/* Tags with Tag a Timeline button */}
              <Box sx={{ mb: 3, position: 'relative' }}>
                <Typography 
                  variant="subtitle2" 
                  sx={{ 
                    mb: 1.5,
                    color: theme.palette.mode === 'dark'
                      ? 'rgba(255,255,255,0.7)'
                      : 'rgba(0,0,0,0.6)',
                    fontWeight: 500,
                  }}
                >
                  Tags
                </Typography>
                
                {(localEventData?.tags || event.tags) && (localEventData?.tags || event.tags).length > 0 && (
                  <TagList tags={localEventData?.tags || event.tags} />
                )}
                
                {/* Tag a Timeline button - smaller and positioned at bottom left */}
                <Box 
                  onClick={() => setTagSectionExpanded(!tagSectionExpanded)}
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    fontSize: '0.75rem',
                    mt: event.tags && event.tags.length > 0 ? 1 : 0,
                    color: theme.palette.mode === 'dark'
                      ? 'rgba(255,255,255,0.6)'
                      : 'rgba(0,0,0,0.5)',
                    cursor: 'pointer',
                    '&:hover': {
                      color: theme.palette.primary.main,
                    },
                    transition: 'color 0.2s ease',
                  }}
                >
                  <span style={{ 
                    color: theme.palette.primary.main,
                    fontSize: '0.9rem',
                    marginRight: '4px',
                  }}>#</span>
                  Tag a Timeline
                  <ExpandMoreIcon 
                    fontSize="small" 
                    sx={{ 
                      fontSize: '0.9rem',
                      ml: 0.5,
                      transform: tagSectionExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s ease',
                    }} 
                  />
                </Box>
                
                {tagSectionExpanded && (
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      bgcolor: theme.palette.mode === 'dark'
                        ? 'rgba(0,0,0,0.2)'
                        : 'rgba(0,0,0,0.02)',
                      border: '1px solid',
                      borderColor: theme.palette.mode === 'dark'
                        ? 'rgba(255,255,255,0.05)'
                        : 'rgba(0,0,0,0.05)',
                    }}
                  >
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    sx={{ mb: 2 }}
                  >
                    Add this event to an existing timeline:
                  </Typography>
                  
                  <Autocomplete
                    id="timeline-select"
                    options={existingTimelines}
                    loading={loadingTimelines}
                    getOptionLabel={(option) => option.name}
                    isOptionEqualToValue={(option, value) => option.id === value.id}
                    value={selectedTimeline}
                    onChange={(event, newValue) => {
                      setSelectedTimeline(newValue);
                      setError('');
                    }}
                    // Only show options that start with the input text
                    filterOptions={(options, state) => {
                      // Don't show any options if the input is empty
                      if (!state.inputValue) return [];
                      
                      // Filter options that start with the input text (case insensitive)
                      return options.filter(option => 
                        option.name.toLowerCase().startsWith(state.inputValue.toLowerCase())
                      );
                    }}
                    renderInput={(params) => (
                      <TextField 
                        {...params} 
                        label="Search Timeline" 
                        variant="outlined"
                        helperText="Type to search for a timeline"
                        InputProps={{
                          ...params.InputProps,
                          endAdornment: (
                            <React.Fragment>
                              {loadingTimelines ? <CircularProgress color="inherit" size={20} /> : null}
                              {params.InputProps.endAdornment}
                            </React.Fragment>
                          ),
                        }}
                      />
                    )}
                    renderOption={(props, option) => (
                      <li {...props}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <span style={{ 
                            color: theme.palette.primary.main,
                            fontSize: '1rem',
                            marginRight: '4px'
                          }}>#</span>
                          {option.name}
                        </Box>
                      </li>
                    )}
                    noOptionsText="Type to search for timelines"
                  />
                  
                  {error && (
                    <Alert severity="error" sx={{ mt: 2 }}>
                      {error}
                    </Alert>
                  )}
                  
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<AddIcon />}
                      disabled={!selectedTimeline || addingToTimeline}
                      onClick={handleAddToTimeline}
                      sx={{ 
                        borderRadius: 2,
                        textTransform: 'none',
                        px: 2,
                      }}
                    >
                      {addingToTimeline ? (
                        <CircularProgress size={24} color="inherit" />
                      ) : (
                        'Tag Timeline'
                      )}
                    </Button>
                  </Box>
                  </Paper>
                )}
              </Box>
              
              {/* Event details card */}
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: 2,
                  bgcolor: theme.palette.mode === 'dark'
                    ? 'rgba(0,0,0,0.2)'
                    : 'rgba(0,0,0,0.02)',
                  border: '1px solid',
                  borderColor: theme.palette.mode === 'dark'
                    ? 'rgba(255,255,255,0.05)'
                    : 'rgba(0,0,0,0.05)',
                }}
              >
                <Typography 
                  variant="subtitle2" 
                  sx={{ 
                    mb: 2,
                    color: theme.palette.mode === 'dark'
                      ? 'rgba(255,255,255,0.7)'
                      : 'rgba(0,0,0,0.6)',
                    fontWeight: 500,
                  }}
                >
                  Event Details
                </Typography>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {/* Timeline date */}
                  {event.event_date && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Box
                        sx={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          bgcolor: theme.palette.mode === 'dark'
                            ? 'rgba(255,255,255,0.05)'
                            : 'rgba(0,0,0,0.03)',
                          color: theme.palette.mode === 'dark'
                            ? 'rgba(255,255,255,0.7)'
                            : 'rgba(0,0,0,0.6)',
                        }}
                      >
                        <EventIcon fontSize="small" />
                      </Box>
                      <Box>
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            display: 'block',
                            color: theme.palette.mode === 'dark'
                              ? 'rgba(255,255,255,0.5)'
                              : 'rgba(0,0,0,0.4)',
                          }}
                        >
                          Timeline Date
                        </Typography>
                        <Typography 
                          variant="body2"
                          sx={{ 
                            color: theme.palette.mode === 'dark'
                              ? 'rgba(255,255,255,0.9)'
                              : 'rgba(0,0,0,0.8)',
                          }}
                        >
                          {formatEventDate(event.event_date)}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                  
                  {/* Created date */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: theme.palette.mode === 'dark'
                          ? 'rgba(255,255,255,0.05)'
                          : 'rgba(0,0,0,0.03)',
                        color: theme.palette.mode === 'dark'
                          ? 'rgba(255,255,255,0.7)'
                          : 'rgba(0,0,0,0.6)',
                      }}
                    >
                      <AccessTimeIcon fontSize="small" />
                    </Box>
                    <Box>
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          display: 'block',
                          color: theme.palette.mode === 'dark'
                            ? 'rgba(255,255,255,0.5)'
                            : 'rgba(0,0,0,0.4)',
                        }}
                      >
                        Published
                      </Typography>
                      <Typography 
                        variant="body2"
                        sx={{ 
                          color: theme.palette.mode === 'dark'
                            ? 'rgba(255,255,255,0.9)'
                            : 'rgba(0,0,0,0.8)',
                        }}
                      >
                        {formatDate(event.created_at || event.createdAt).replace('Published on ', '')}
                      </Typography>
                    </Box>
                  </Box>
                  
                  {/* Created by */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar 
                      src={event.created_by_avatar} 
                      alt={event.created_by_username || "User"} 
                      sx={{ 
                        width: 32, 
                        height: 32,
                        fontSize: '0.875rem',
                        bgcolor: theme.palette.mode === 'dark'
                          ? 'rgba(255,255,255,0.1)'
                          : 'rgba(0,0,0,0.1)',
                      }} 
                    >
                      {event.created_by_username ? event.created_by_username.charAt(0).toUpperCase() : <PersonIcon fontSize="small" />}
                    </Avatar>
                    <Box>
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          display: 'block',
                          color: theme.palette.mode === 'dark'
                            ? 'rgba(255,255,255,0.5)'
                            : 'rgba(0,0,0,0.4)',
                        }}
                      >
                        Created by
                      </Typography>
                      <Link
                        component={RouterLink}
                        to={`/profile/${event.created_by || event.createdBy}`}
                        sx={{ 
                          color: color,
                          textDecoration: 'none',
                          '&:hover': {
                            textDecoration: 'underline'
                          }
                        }}
                      >
                        {event.created_by_username || event.createdByUsername || "Unknown"}
                      </Link>
                    </Box>
                  </Box>
                </Box>
              </Paper>
            </DialogContent>
          </Box>
          
          {/* Success/Error Snackbar - Positioned inside the Dialog */}
          <Snackbar
            open={snackbarOpen}
            autoHideDuration={6000}
            onClose={handleSnackbarClose}
            anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            sx={{
              position: 'absolute',
              top: '16px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: 'calc(100% - 48px)',
              maxWidth: '400px',
              zIndex: 9999
            }}
          >
            <Alert 
              onClose={handleSnackbarClose} 
              severity={error ? "error" : "success"} 
              sx={{ width: '100%' }}
            >
              {error || success}
            </Alert>
          </Snackbar>
        </Dialog>
      )}
    </AnimatePresence>
  );
};

export default ImageEventPopup;
