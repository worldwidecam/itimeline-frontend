import React from 'react';
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
  Divider,
  Snackbar,
  Alert,
  TextField,
  Autocomplete,
  Button,
  CircularProgress,
  Avatar,
  Chip,
} from '@mui/material';
import {
  Close as CloseIcon,
  Newspaper as NewsIcon,
  Person as PersonIcon,
  Event as EventIcon,
  AccessTime as AccessTimeIcon,
  Add as AddIcon,
  ExpandMore as ExpandMoreIcon,
  OpenInNew as OpenInNewIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import { Link as RouterLink } from 'react-router-dom';
import { EVENT_TYPES, EVENT_TYPE_COLORS } from './EventTypes';
import TagList from './cards/TagList';

/**
 * NewsEventPopup - A specialized popup for news events
 * Features a two-container layout similar to media popups:
 * - Left container (60%): Featured URL preview with newspaper-style layout
 * - Right container (40%): Event details and metadata
 */
const NewsEventPopup = ({ 
  event, 
  open, 
  onClose, 
  formatDate,
  formatEventDate,
  color,
  TypeIcon,
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
  const [tagSectionExpanded, setTagSectionExpanded] = React.useState(false);
  const [localEventData, setLocalEventData] = React.useState(event);
  
  // Fetch timelines when the tag section is expanded
  React.useEffect(() => {
    if (tagSectionExpanded && existingTimelines.length === 0) {
      if (typeof fetchExistingTimelines === 'function') {
        fetchExistingTimelines();
      }
    }
  }, [tagSectionExpanded, existingTimelines.length, fetchExistingTimelines]);

  const handleClose = (event, reason) => {
    if (typeof onClose === 'function') {
      onClose();
    }
  };
  
  const handleCloseButtonClick = () => {
    if (typeof onClose === 'function') {
      onClose();
    }
  };

  if (!event) return null;

  // Determine if we have URL data to display
  const hasUrlData = event.url && (event.url_title || event.url_description || event.url_image);
  const urlDomain = event.url ? new URL(event.url).hostname.replace('www.', '') : '';
  
  // News theme color
  const newsColor = '#d32f2f'; // Red color for news theme
  
  // Handle URL click to open in new tab
  const handleUrlClick = (e) => {
    e.preventDefault();
    if (event.url) {
      window.open(event.url, '_blank', 'noopener,noreferrer');
    }
  };
  
  /**
   * Creator Chip Component
   * A reusable component that displays creator information with avatar and profile link
   * 
   * @param {Object} user - User object containing id, username, and avatar
   * @param {string} color - Accent color for the chip
   * @returns {JSX.Element} Rendered creator chip
   */
  const CreatorChip = ({ user, color = newsColor }) => {
    if (!user || !user.username) return null;
    
    return (
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        mb: 3, 
        p: 2, 
        bgcolor: theme.palette.mode === 'dark' 
          ? `${color}15`  // 15% opacity in dark mode
          : `${color}08`,  // 8% opacity in light mode
        borderRadius: 2, 
        borderLeft: `3px solid ${color}`,
        transition: 'all 0.2s ease',
        '&:hover': {
          transform: 'translateX(2px)',
          boxShadow: theme.shadows[1]
        }
      }}>
        <Avatar 
          src={user.avatar} 
          alt={user.username}
          sx={{ 
            width: 44, 
            height: 44, 
            mr: 2,
            border: `2px solid ${color}`,
            bgcolor: theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.9)',
            color: color,
            fontWeight: 600,
          }}
        >
          {user.username.charAt(0).toUpperCase()}
        </Avatar>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
            <PersonIcon sx={{ fontSize: 16, mr: 0.75, color: color, opacity: 0.8 }} />
            <Typography 
              variant="caption" 
              sx={{ 
                color: theme.palette.mode === 'dark' 
                  ? 'rgba(255,255,255,0.8)' 
                  : 'rgba(0,0,0,0.8)',
                fontWeight: 500,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                fontSize: '0.7rem',
              }}
            >
              Created By
            </Typography>
          </Box>
          <Link 
            component={RouterLink}
            to={`/profile/${user.id}`}
            sx={{
              fontWeight: 600,
              color: theme.palette.mode === 'dark' ? 'white' : 'rgba(0,0,0,0.9)',
              textDecoration: 'none',
              display: 'block',
              fontSize: '1.1rem',
              '&:hover': {
                color: color,
              },
            }}
          >
            {user.username}
          </Link>
        </Box>
      </Box>
    );
  };

  // Get user data with fallbacks
  const getUserData = () => {
    // First try to get from created_by object (nested)
    if (event.created_by && typeof event.created_by === 'object') {
      return {
        id: event.created_by.id || event.created_by_id || event.created_by,
        username: event.created_by.username || event.created_by_username || 'Unknown User',
        avatar: event.created_by.avatar_url || event.created_by_avatar || null
      };
    }
    // Then try direct properties (flattened)
    return {
      id: event.created_by || event.created_by_id || 'unknown',
      username: event.created_by_username || 'Unknown User',
      avatar: event.created_by_avatar || null
    };
  };
  
  const userData = getUserData();

  return (
    <AnimatePresence>
      {open && (
        <Dialog
          open={open}
          onClose={handleClose}
          maxWidth="lg" // Larger dialog for the two-container layout
          fullWidth
          closeAfterTransition
          TransitionComponent={motion.div}
          TransitionProps={{
            initial: { opacity: 0, y: 20, scale: 0.98 },
            animate: { opacity: 1, y: 0, scale: 1 },
            exit: { opacity: 0, y: 20, scale: 0.98 },
            transition: { duration: 0.3 }
          }}
          PaperProps={{
            component: motion.div,
            initial: { opacity: 0, y: 20, scale: 0.98 },
            animate: { opacity: 1, y: 0, scale: 1 },
            exit: { opacity: 0, y: 20, scale: 0.98 },
            transition: { duration: 0.3 },
            sx: {
              borderRadius: 3,
              overflow: 'hidden',
              backgroundColor: theme.palette.mode === 'dark' 
                ? 'rgba(10,10,20,0.95)' 
                : 'rgba(255,255,255,0.95)',
              backdropFilter: 'blur(20px)',
              boxShadow: theme.palette.mode === 'dark'
                ? '0 10px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)'
                : '0 10px 40px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.05)',
              border: 'none',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
            },
          }}
        >
          <DialogTitle sx={{ 
            p: 3, 
            pb: 2,
            borderBottom: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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
                      : 'rgba(0,0,0,0.95)',
                  }}
                >
                  {event.title || "News Article"}
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
            </Box>
          </DialogTitle>
          
          <DialogContent 
            sx={{ 
              p: 0,
              display: 'flex',
              flex: 1,
              overflow: 'hidden',
            }}
          >
            {/* Left Container - URL Preview */}
            {hasUrlData && (
              <Box 
                sx={{
                  flex: '0 0 60%',
                  maxWidth: '60%',
                  height: '100%',
                  overflowY: 'auto',
                  p: 3,
                  borderRight: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
                  backgroundColor: theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.02)',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <Paper 
                  elevation={0}
                  onClick={handleUrlClick}
                  sx={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    borderRadius: 2,
                    border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 0, 0, 0.1)' : 'rgba(211, 47, 47, 0.2)'}`,
                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.3)' : 'white',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: `0 6px 16px ${theme.palette.mode === 'dark' ? 'rgba(211, 47, 47, 0.2)' : 'rgba(211, 47, 47, 0.15)'}`,
                      borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 0, 0, 0.3)' : 'rgba(211, 47, 47, 0.4)'
                    },
                  }}
                >
                  {/* URL Image - Larger container */}
                  {event.url_image && (
                    <Box
                      sx={{
                        height: '60vh', // Increased height for better visibility
                        minHeight: '300px',
                        backgroundImage: `url(${event.url_image})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        borderTopLeftRadius: 8,
                        borderTopRightRadius: 8,
                        position: 'relative',
                        overflow: 'hidden',
                      }}
                    >
                      <Box
                        sx={{
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          right: 0,
                          height: '40%',
                          background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.4) 70%, rgba(0,0,0,0) 100%)',
                        }}
                      >
                        <Box sx={{ 
                          position: 'absolute', 
                          bottom: 0, 
                          left: 0, 
                          right: 0,
                          p: 3,
                          pb: 2,
                        }}>
                          <Typography 
                            variant="h5" 
                            component="h2"
                            sx={{ 
                              color: 'white',
                              fontWeight: 700,
                              lineHeight: 1.3,
                              mb: 1.5,
                              textShadow: '0 1px 3px rgba(0,0,0,0.5)',
                            }}
                          >
                            {event.url_title || 'Read the full article'}
                          </Typography>
                          <Box sx={{ 
                            display: 'flex', 
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            borderTop: '1px solid rgba(255,255,255,0.1)',
                            pt: 1.5
                          }}>
                            <Typography 
                              variant="caption" 
                              sx={{ 
                                color: 'rgba(255,255,255,0.9)',
                                display: 'flex',
                                alignItems: 'center',
                                fontWeight: 500,
                              }}
                            >
                              <OpenInNewIcon sx={{ fontSize: 14, mr: 0.75, opacity: 0.8 }} />
                              {urlDomain}
                            </Typography>
                            <Typography 
                              variant="caption" 
                              sx={{ 
                                color: 'rgba(255,255,255,0.7)',
                                display: 'flex',
                                alignItems: 'center',
                              }}
                            >
                              <AccessTimeIcon sx={{ fontSize: 14, mr: 0.5, opacity: 0.7 }} />
                              {formatDate(event.created_at || event.createdAt).replace('Published on ', '')}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    </Box>
                  )}
                  
                  {/* URL Content - Removed duplicate content */}
                  <Box sx={{ p: 3, flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <Box sx={{ flex: 1 }}>
                      {/* Removed duplicate title and description */}
                    </Box>
                    
                    <Box sx={{ mt: 'auto' }}>
                      <Button
                        component="a"
                        href={event.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        variant="outlined"
                        size="small"
                        endIcon={<OpenInNewIcon />}
                        sx={{
                          mt: 2,
                          alignSelf: 'flex-start',
                          color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.8)',
                          borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
                          '&:hover': {
                            borderColor: color,
                            color: color,
                            backgroundColor: theme.palette.mode === 'dark' 
                              ? 'rgba(255,255,255,0.05)' 
                              : 'rgba(0,0,0,0.05)',
                          },
                        }}
                      >
                        Read Full Article
                      </Button>
                    </Box>
                  </Box>
                </Paper>
              </Box>
            )}
            
            {/* Right Container - Event Details */}
            <Box 
              sx={{
                flex: hasUrlData ? '0 0 40%' : '1 1 100%',
                maxWidth: hasUrlData ? '40%' : '100%',
                height: '100%',
                overflowY: 'auto',
                p: 3,
                position: 'relative',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 4,
                  background: `linear-gradient(90deg, ${newsColor} 0%, ${theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.2)' : 'rgba(211, 47, 47, 0.2)'} 100%)`,
                }
              }}
            >
              {/* Event Metadata */}
              <Box sx={{ mb: 3 }}>
                {/* Creator Chip */}
                <CreatorChip user={userData} color={newsColor} />
                
                {/* Timeline Date */}
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1.5 }}>
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
                      color: newsColor,
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
                          : 'rgba(0,0,0,0.5)',
                      }}
                    >
                      Timeline Date
                    </Typography>
                    <Typography 
                      variant="body2"
                      sx={{ 
                        color: theme.palette.mode === 'dark'
                          ? 'rgba(255,255,255,0.9)'
                          : 'rgba(0,0,0,0.9)',
                      }}
                    >
                      {formatEventDate(event.event_date)}
                    </Typography>
                  </Box>
                </Box>
                
                {/* Published Date */}
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1.5 }}>
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
                      color: newsColor,
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
                          : 'rgba(0,0,0,0.5)',
                      }}
                    >
                      Published
                    </Typography>
                    <Typography 
                      variant="body2"
                      sx={{ 
                        color: theme.palette.mode === 'dark'
                          ? 'rgba(255,255,255,0.9)'
                          : 'rgba(0,0,0,0.9)',
                      }}
                    >
                      {formatDate(event.created_at || event.createdAt).replace('Published on ', '')}
                    </Typography>
                  </Box>
                </Box>
                
                {/* Source URL */}
                {event.url && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 3 }}>
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
                        color: newsColor,
                      }}
                    >
                      <OpenInNewIcon fontSize="small" />
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          display: 'block',
                          color: theme.palette.mode === 'dark'
                            ? 'rgba(255,255,255,0.5)'
                            : 'rgba(0,0,0,0.5)',
                        }}
                      >
                        Source
                      </Typography>
                      <Link 
                        href={event.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        sx={{
                          display: 'block',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          color: newsColor,
                          '&:hover': {
                            textDecoration: 'none',
                            opacity: 0.8,
                          },
                        }}
                      >
                        {urlDomain}
                      </Link>
                    </Box>
                  </Box>
                )}
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              {/* Event Description */}
              {event.description && (
                <Box sx={{ mb: 3 }}>
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      whiteSpace: 'pre-wrap',
                      lineHeight: 1.7,
                      color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.85)',
                    }}
                  >
                    {event.description}
                  </Typography>
                </Box>
              )}
              
              {/* Tags */}
              {(event.tags && event.tags.length > 0) && (
                <Box sx={{ mb: 3 }}>
                  <TagList tags={localEventData?.tags || event.tags} />
                </Box>
              )}
              
              {/* Timeline Tagging System */}
              <Box sx={{ mt: 'auto', pt: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
                <Box 
                  onClick={() => setTagSectionExpanded(!tagSectionExpanded)}
                  sx={{ 
                    display: 'flex',
                    alignItems: 'center',
                    color: theme.palette.text.secondary,
                    cursor: 'pointer',
                    mb: tagSectionExpanded ? 2 : 0,
                    '&:hover': {
                      color: theme.palette.primary.main,
                    },
                  }}
                >
                  <Typography variant="subtitle2">Add to Timeline</Typography>
                  <ExpandMoreIcon 
                    sx={{ 
                      transform: tagSectionExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s',
                      ml: 0.5,
                    }} 
                  />
                </Box>
                
                {tagSectionExpanded && (
                  <Box>
                    <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                      <Autocomplete
                        size="small"
                        options={existingTimelines}
                        getOptionLabel={(option) => option.name}
                        value={selectedTimeline}
                        onChange={(event, newValue) => setSelectedTimeline(newValue)}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Select Timeline"
                            variant="outlined"
                            size="small"
                            fullWidth
                          />
                        )}
                        loading={loadingTimelines}
                        sx={{ flex: 1 }}
                      />
                      <Button
                        variant="contained"
                        size="small"
                        onClick={handleAddToTimeline}
                        disabled={!selectedTimeline || addingToTimeline}
                        startIcon={addingToTimeline ? <CircularProgress size={16} /> : <AddIcon />}
                        sx={{
                          backgroundColor: newsColor,
                          '&:hover': {
                            backgroundColor: `${newsColor}E6`,
                          },
                        }}
                      >
                        {addingToTimeline ? 'Adding...' : 'Add'}
                      </Button>
                    </Box>
                    
                    {error && (
                      <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                      </Alert>
                    )}
                    
                    {success && (
                      <Alert severity="success" sx={{ mb: 2 }}>
                        {success}
                      </Alert>
                    )}
                  </Box>
                )}
              </Box>
            </Box>
          </DialogContent>
          
          {/* Snackbar for notifications */}
          <Snackbar
            open={snackbarOpen}
            autoHideDuration={6000}
            onClose={handleSnackbarClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          >
            <Alert onClose={handleSnackbarClose} severity={error ? 'error' : 'success'} sx={{ width: '100%' }}>
              {error || success}
            </Alert>
          </Snackbar>
        </Dialog>
      )}
    </AnimatePresence>
  );
};

export default NewsEventPopup;
