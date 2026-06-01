import { getGlassDialogPaperSx, getGlassInputSx, getGlassSquareActionButtonSx, getGlassPillActionButtonSx } from '../../../utils/formStyleGuide';
import React from 'react';
import { useLocation } from 'react-router-dom';
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
  Divider,
  Snackbar,
  Alert,
  TextField,
  Autocomplete,
  Button,
  CircularProgress,
  Chip,
  Menu,
  ListItemIcon,
  ListItemText,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
} from '@mui/material';
import {
  Close as CloseIcon,
  Newspaper as NewsIcon,
  Person as PersonIcon,
  Event as EventIcon,
  AccessTime as AccessTimeIcon,
  Add as AddIcon,
  OpenInNew as OpenInNewIcon,
  RateReview as RateReviewIcon,
  CheckCircle as CheckCircleIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  MoreHoriz as MoreHorizIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import { Link as RouterLink } from 'react-router-dom';
import { EVENT_TYPES, EVENT_TYPE_COLORS } from './EventTypes';
import { useAuth } from '../../../contexts/AuthContext';
import PopupTimelineLanes from './PopupTimelineLanes';
import UserAvatar from '../../common/UserAvatar';
import VoteControls from './VoteControls';
import { submitReport } from '../../../utils/api';
import { useEventVote } from '../../../hooks/useEventVote';
import RichContentRenderer from './RichContentRenderer';

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
  onDelete,
  onEdit,
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
  fetchExistingTimelines,
  isInReview = false,
  isSafeguarded = false,
  laneProps
}) => {
  const theme = useTheme();
  const location = useLocation();
  const { isGuest } = useAuth();
  const [reportOpen, setReportOpen] = React.useState(false);
  const [reportReason, setReportReason] = React.useState('');
  const [reportSubmitting, setReportSubmitting] = React.useState(false);
  const [reportedOnce, setReportedOnce] = React.useState(false);
  const [reportCategory, setReportCategory] = React.useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [actionAnchorEl, setActionAnchorEl] = React.useState(null);
  const [tagSectionExpanded, setTagSectionExpanded] = React.useState(false);
  const [localEventData, setLocalEventData] = React.useState(event);
  const [reportSnackOpen, setReportSnackOpen] = React.useState(false);
  
  const {
    value: voteValue,
    totalVotes,
    positiveRatio,
    isLoading: voteLoading,
    error: voteError,
    handleVoteChange,
  } = useEventVote(event?.id, { enabled: open });
  
  React.useEffect(() => {
    if (setIsPopupOpen && typeof setIsPopupOpen === 'function') {
      setIsPopupOpen(open);
    }
    return () => {
      if (setIsPopupOpen && typeof setIsPopupOpen === 'function') {
        setIsPopupOpen(false);
      }
    };
  }, [open, setIsPopupOpen]);
  
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

  const getUserData = () => {
    if (event.created_by && typeof event.created_by === 'object') {
      return {
        id: event.created_by.id || event.created_by_id || event.created_by,
        username: event.created_by.username || event.created_by_username || 'Unknown User',
        avatar: event.created_by.avatar_url || event.created_by_avatar || null,
        user_color: event.created_by.user_color || event.created_by_user_color || null,
        is_restricted: event.created_by.is_restricted || event.created_by_is_restricted || false,
        is_avatar_blurred: event.created_by.is_avatar_blurred || event.created_by_is_avatar_blurred || false
      };
    }
    return {
      id: event.created_by || event.created_by_id || 'unknown',
      username: event.created_by_username || 'Unknown User',
      avatar: event.created_by_avatar || null,
      user_color: event.created_by_user_color || null,
      is_restricted: event.created_by_is_restricted || false,
      is_avatar_blurred: event.is_avatar_blurred || event.created_by_is_avatar_blurred || false
    };
  };

  const userData = getUserData();
  let currentUserId = null;
  try {
    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
    currentUserId = storedUser?.id || null;
  } catch (_) {}

  const isSiteOwner = String(currentUserId) === '1';
  const isEventCreator = currentUserId && String(currentUserId) === String(userData?.id);
  const isEditLocked = Boolean(event?.edit_locked || localEventData?.edit_locked);
  const canDelete = Boolean(onDelete && (isSiteOwner || isEventCreator));
  const canEdit = Boolean(onEdit && (isSiteOwner || (isEventCreator && !isEditLocked)));
  
  const handleCloseButtonClick = () => {
    if (typeof onClose === 'function') {
      onClose();
    }
  };

  if (!event) return null;

  const normalizeExternalUrl = (value) => {
    const raw = String(value || '').trim();
    if (!raw) return '';
    try {
      return new URL(raw).toString();
    } catch (_) {
      try {
        return new URL(`https://${raw.replace(/^\/+/, '')}`).toString();
      } catch (_) {
        return '';
      }
    }
  };

  const normalizedEventUrl = normalizeExternalUrl(event.url || event.media_source);
  const mediaSource = event.url_image || (event.media_source && event.media_source.match(/\.(jpeg|jpg|gif|png)$/) ? event.media_source : null);
  const newsColor = '#d32f2f';

  const handleUrlClick = (e) => {
    e.preventDefault();
    if (normalizedEventUrl) {
      window.open(normalizedEventUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const deriveTimelineId = () => {
    try {
      const match = location?.pathname?.match(/timeline-v3\/(\d+)/);
      if (match && match[1]) return Number(match[1]);
    } catch (_) {}
    return event?.timeline_id || event?.timelineId || null;
  };

  const handleOpenReport = () => {
    setReportReason('');
    setReportCategory('');
    setReportOpen(true);
  };

  const handleOpenDelete = () => {
    setDeleteDialogOpen(true);
  };

  const handleCloseDelete = () => {
    setDeleteDialogOpen(false);
  };

  const handleActionMenuOpen = (event) => {
    event.stopPropagation();
    setActionAnchorEl(event.currentTarget);
  };

  const handleActionMenuClose = () => {
    setActionAnchorEl(null);
  };

  const handleEdit = () => {
    if (typeof onEdit !== 'function' || !event) return;
    onEdit(event);
    handleActionMenuClose();
    if (typeof onClose === 'function') {
      onClose();
    }
  };

  const handleConfirmDelete = async () => {
    if (!onDelete || !event) return;
    await onDelete(event);
    setDeleteDialogOpen(false);
    if (typeof onClose === 'function') {
      onClose();
    }
  };

  const handleCloseReport = () => {
    if (reportSubmitting) return;
    setReportOpen(false);
  };

  const handleSubmitReport = async () => {
    const timelineId = deriveTimelineId();
    if (!timelineId || !event?.id) {
      if (typeof setError === 'function') setError('Unable to submit report: missing timeline or event id');
      return;
    }
    if (!reportCategory) return;
    try {
      setReportSubmitting(true);
      if (typeof setError === 'function') setError('');
      await submitReport(timelineId, event.id, reportReason || '', reportCategory);
      setReportedOnce(true);
      setReportOpen(false);
      setReportSnackOpen(true);
    } catch (e) {
      const msg = e?.response?.data?.error || e.message || 'Failed to submit report';
      if (typeof setError === 'function') setError(msg);
    } finally {
      setReportSubmitting(false);
    }
  };

  const CreatorChip = ({ user, color = newsColor }) => {
    if (!user || !user.username) return null;
    return (
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        p: 1.5, 
        bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
        borderRadius: 2, 
        borderLeft: `3px solid ${color}`,
      }}>
        <UserAvatar
          name={user.username}
          avatarUrl={user.avatar}
          id={user.id}
          size={32}
          userColor={user.user_color}
          isRestricted={user.is_restricted}
          isAvatarBlurred={user.is_avatar_blurred}
          sx={{ mr: 1.5, border: `1px solid ${color}` }}
        />
        <Box>
          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', fontSize: '0.65rem', textTransform: 'uppercase' }}>
            Created By
          </Typography>
          <Link 
            component={RouterLink}
            to={`/profile/${user.id}`}
            sx={{ fontWeight: 600, color: 'text.primary', textDecoration: 'none', fontSize: '0.9rem', '&:hover': { color: color } }}
          >
            {user.username}
          </Link>
        </Box>
      </Box>
    );
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="lg"
            fullWidth
            container={typeof document !== 'undefined' ? (document.fullscreenElement || document.webkitFullscreenElement || undefined) : undefined}
            onTouchStart={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onMouseMove={(e) => e.stopPropagation()}
            onMouseUp={(e) => e.stopPropagation()}
            onWheel={(e) => e.stopPropagation()}
            sx={{
              '& .MuiDialog-container': {
                overscrollBehavior: 'none',
              },
              '& .MuiBackdrop-root': {
                touchAction: 'none',
                overscrollBehavior: 'none',
              }
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
                backgroundColor: theme.palette.mode === 'dark' ? 'rgba(10,10,20,0.95)' : 'rgba(255,255,255,0.95)',
                backdropFilter: 'blur(20px)',
                boxShadow: theme.palette.mode === 'dark'
                  ? '0 10px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)'
                  : '0 10px 40px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.05)',
                border: 'none',
                maxHeight: { xs: 'calc(100% - 16px)', md: '90vh' },
                height: { xs: 'auto', md: '90vh' },
                width: { xs: 'calc(100% - 16px)', sm: 'calc(100% - 32px)', md: '90vw' },
                maxWidth: { md: '1200px' },
                margin: { xs: 1, sm: 2, md: 'auto' },
                display: 'flex',
                flexDirection: 'column',
                overflowY: { xs: 'auto', md: 'hidden' }
              },
              drag: "x",
              dragConstraints: { left: 0, right: 0 },
              dragElastic: { left: 0.5, right: 0.5 },
              onDragEnd: (event, info) => {
                if (Math.abs(info.offset.x) > 100) {
                  handleCloseButtonClick();
                }
              },
            }}
            slotProps={{
              backdrop: {
                sx: { touchAction: 'none' }
              }
            }}
          >
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, flex: 1, height: '100%', overflow: 'hidden' }}>
              {/* Left Container - Preview */}
              {mediaSource && (
                <Box
                  sx={{
                    flex: { xs: '0 0 auto', md: '0 0 60%' },
                    width: { xs: '100%', md: '60%' },
                    height: { xs: '250px', sm: '350px', md: '100%' },
                    position: 'relative',
                    bgcolor: 'black',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    borderRight: { xs: 'none', md: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}` },
                    borderBottom: { xs: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`, md: 'none' },
                  }}
                  onClick={handleUrlClick}
                >
                  <Box
                    component="img"
                    src={mediaSource}
                    alt={event.title}
                    sx={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      transition: 'transform 0.5s ease',
                      '&:hover': { transform: 'scale(1.05)' }
                    }}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/images/fallbacks/news-link-fallback.jpg';
                    }}
                  />
                  <Box sx={{ position: 'absolute', top: 16, right: 16, bgcolor: 'rgba(0,0,0,0.6)', color: 'white', p: 1, borderRadius: '50%', display: 'flex', backdropFilter: 'blur(4px)' }}>
                    <OpenInNewIcon sx={{ fontSize: 20 }} />
                  </Box>
                </Box>
              )}

              {/* Right Container - Details */}
              <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', minWidth: 0 }}>
                <DialogTitle sx={{ p: { xs: 2, sm: 3 }, pb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1, minWidth: 0 }}>
                      <Box sx={{ width: { xs: 32, sm: 40 }, height: { xs: 32, sm: 40 }, flexShrink: 0, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', color: newsColor }}>
                        <TypeIcon fontSize={theme.breakpoints.down('sm') ? "small" : "medium"} />
                      </Box>
                      <Typography variant="h5" component="div" sx={{ fontWeight: 600, fontSize: { xs: '1.1rem', sm: '1.25rem', md: '1.5rem' }, lineHeight: 1.2, wordBreak: 'break-word', color: 'text.primary' }}>
                        {event.title || "News Article"}
                      </Typography>
                    </Box>
                    <IconButton edge="end" color="inherit" onClick={handleCloseButtonClick} aria-label="close" sx={{ color: 'text.secondary', mt: -0.5, mr: -0.5 }}>
                      <CloseIcon />
                    </IconButton>
                  </Box>
                </DialogTitle>
                
                <Divider sx={{ opacity: 0.5 }} />
                
                <DialogContent sx={{ flex: 1, p: { xs: 2, sm: 4 }, overflowY: 'auto', WebkitOverflowScrolling: 'touch', position: 'relative', touchAction: 'pan-y' }}>
                  <Paper elevation={0} onClick={handleUrlClick} sx={{ mb: 3, p: 2, bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', borderRadius: 2, border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`, cursor: 'pointer', '&:hover': { bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)', borderColor: newsColor } }}>
                    <Typography variant="caption" sx={{ color: newsColor, fontWeight: 600, textTransform: 'uppercase', display: 'block', mb: 0.5 }}>Article Source</Typography>
                    <Typography variant="body2" sx={{ wordBreak: 'break-all', opacity: 0.8 }}>{event.media_source}</Typography>
                  </Paper>

                  {(event.content || event.description) && (
                    <Box sx={{ mb: 3 }}>
                      {event.content ? <RichContentRenderer content={event.content} theme={theme} /> : <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.7, color: 'text.primary' }}>{event.description}</Typography>}
                    </Box>
                  )}
                  
                  <Divider sx={{ my: 2 }} />
                  <Box sx={{ mb: 3 }}><PopupTimelineLanes {...laneProps} /></Box>
                </DialogContent>
                
                <Divider sx={{ opacity: 0.3 }} />
                
                {/* Standardized Footer */}
                <Box sx={{ px: 3, py: 2, mt: 'auto', bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, pt: 1 }}>
                    <CreatorChip user={userData} color={newsColor} />
                    <VoteControls value={voteValue} onChange={handleVoteChange} positiveRatio={positiveRatio} totalVotes={totalVotes} isLoading={voteLoading} hasError={!!voteError} layout="stacked" sizeScale={0.8} pillScale={1.05} badgeScale={0.75} />
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: 0.7 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>ID: {event?.id ?? '--'}</Typography>
                    {event.created_at && <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>{formatDate(event.created_at)}</Typography>}
                  </Box>
                  
                  <Box sx={{ mt: 1, display: 'flex', justifyContent: 'flex-end', gap: 1, alignItems: 'center' }}>
                    {(isInReview && !isSafeguarded) && (
                      <Chip icon={<RateReviewIcon sx={{ fontSize: '14px !important' }} />} label="In Review" size="small" sx={{ height: 20, fontSize: '0.65rem', bgcolor: 'warning.main', color: 'white', fontWeight: 600 }} />
                    )}
                    {isSafeguarded && (
                      <Chip icon={<CheckCircleIcon sx={{ fontSize: '14px !important' }} />} label="Safeguarded" size="small" sx={{ height: 20, fontSize: '0.65rem', bgcolor: 'success.main', color: 'white' }} />
                    )}
                    {canEdit || canDelete || (!isSafeguarded && !isInReview) ? (
                      <>
                        <IconButton size="small" onClick={handleActionMenuOpen} sx={{ bgcolor: `${newsColor}18`, color: newsColor, border: `1px solid ${newsColor}40`, borderRadius: '10px', width: 32, height: 32 }}>
                          <MoreHorizIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                        <Menu
                          anchorEl={actionAnchorEl}
                          open={Boolean(actionAnchorEl)}
                          onClose={handleActionMenuClose}
                          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                          transformOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                          PaperProps={{
                            sx: {
                              ...getGlassDialogPaperSx(theme),
                              minWidth: 160,
                              '& .MuiMenuItem-root': {
                                borderRadius: 1,
                                mx: 1,
                                my: 0.5,
                                transition: 'all 0.2s',
                                '&:hover': {
                                  bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                                  transform: 'translateX(4px)',
                                }
                              }
                            }
                          }}
                        >
                          {canEdit && (
                            <MenuItem onClick={handleEdit}><ListItemIcon><EditIcon fontSize="small" /></ListItemIcon><ListItemText primary="Edit" /></MenuItem>
                          )}
                          {canDelete && (
                            <MenuItem onClick={() => { handleActionMenuClose(); handleOpenDelete(); }}><ListItemIcon><DeleteIcon fontSize="small" /></ListItemIcon><ListItemText primary="Delete" /></MenuItem>
                          )}
                          {!isSafeguarded && !isInReview && (
                            <MenuItem onClick={() => { handleActionMenuClose(); handleOpenReport(); }} disabled={reportedOnce}><ListItemIcon><RateReviewIcon fontSize="small" /></ListItemIcon><ListItemText primary={reportedOnce ? 'Reported' : 'Report'} /></MenuItem>
                          )}
                        </Menu>
                      </>
                    ) : null}
                  </Box>
                </Box>
              </Box>
            </Box>
            
            <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleSnackbarClose} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
              <Alert onClose={handleSnackbarClose} severity={error ? 'error' : 'success'} sx={{ width: '100%' }}>{error || success}</Alert>
            </Snackbar>
            <Dialog open={deleteDialogOpen} onClose={handleCloseDelete} container={typeof document !== 'undefined' ? (document.fullscreenElement || document.webkitFullscreenElement || undefined) : undefined}>
              <DialogTitle>Delete Event</DialogTitle>
              <DialogContent>Are you sure you want to delete "{event?.title || 'this event'}"?</DialogContent>
              <DialogActions><Button onClick={handleCloseDelete}>Cancel</Button><Button onClick={handleConfirmDelete} color="error">Delete</Button></DialogActions>
            </Dialog>
            <Snackbar open={reportSnackOpen} autoHideDuration={3000} onClose={() => setReportSnackOpen(false)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
              <Alert onClose={() => setReportSnackOpen(false)} severity="success" sx={{ width: '100%' }}>Report submitted</Alert>
            </Snackbar>
          </Dialog>
          
          <Dialog open={reportOpen} onClose={handleCloseReport} maxWidth="xs" fullWidth closeAfterTransition container={typeof document !== 'undefined' ? (document.fullscreenElement || document.webkitFullscreenElement || undefined) : undefined} PaperProps={{ sx: getGlassDialogPaperSx(theme) }}>
            <DialogTitle sx={{ pb: 1 }}>Report Post</DialogTitle>
            <DialogContent sx={{ pt: 1, overflow: 'visible', '& .MuiTextField-root': getGlassInputSx(theme) }}>
              <TextField select fullWidth required margin="dense" label="Violation Type" value={reportCategory} onChange={(e) => setReportCategory(e.target.value)} error={!reportCategory} helperText={!reportCategory ? "Required" : ""} sx={{ mb: 2 }}>
                <MenuItem value={''} disabled>Select a category</MenuItem>
                <MenuItem value={'website_policy'}>Website Policy</MenuItem>
                <MenuItem value={'government_policy'}>Government Policy</MenuItem>
                <MenuItem value={'unethical_boundary'}>Unethical Boundary</MenuItem>
              </TextField>
              <TextField fullWidth margin="dense" label="Reason (optional)" value={reportReason} onChange={(e) => setReportReason(e.target.value)} multiline minRows={3} />
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 3 }}>
                <Button onClick={handleCloseReport} disabled={reportSubmitting} variant="contained" sx={{ ...getGlassSquareActionButtonSx(theme), width: 'auto', minWidth: 84, px: 2, borderRadius: 1.4 }}>Cancel</Button>
                <Button variant="contained" onClick={handleSubmitReport} disabled={reportSubmitting || !reportCategory} sx={{ ...getGlassPillActionButtonSx(theme), bgcolor: theme.palette.error.main, color: '#fff', border: '1px solid ' + theme.palette.error.main + '88', '&:hover': { bgcolor: theme.palette.error.dark } }}>{reportSubmitting ? <CircularProgress size={18} color="inherit" /> : 'Submit'}</Button>
              </Box>
            </DialogContent>
          </Dialog>
        </>
      )}
    </AnimatePresence>
  );
};

export default NewsEventPopup;
