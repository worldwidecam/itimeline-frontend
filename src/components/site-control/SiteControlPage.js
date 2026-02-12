import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Paper,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  FormControl,
  FormControlLabel,
  InputLabel,
  Checkbox,
  MenuItem,
  Select,
  Stack,
  CircularProgress,
  Snackbar,
  Alert,
  useTheme,
} from '@mui/material';
import { motion } from 'framer-motion';
import FlagIcon from '@mui/icons-material/Flag';
import ShieldIcon from '@mui/icons-material/Shield';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import PersonRemoveIcon from '@mui/icons-material/PersonRemove';
import CommentIcon from '@mui/icons-material/Comment';
import MovieIcon from '@mui/icons-material/Movie';
import ImageIcon from '@mui/icons-material/Image';
import VideocamIcon from '@mui/icons-material/Videocam';
import AudiotrackIcon from '@mui/icons-material/Audiotrack';
import NewspaperIcon from '@mui/icons-material/Newspaper';
import ForumIcon from '@mui/icons-material/Forum';
import PersonIcon from '@mui/icons-material/Person';
import LockIcon from '@mui/icons-material/Lock';
import { useAuth } from '../../contexts/AuthContext';
import api, { listSiteAdmins, listSiteReports, acceptSiteReport, resolveSiteReport } from '../../utils/api';
import UserAvatar from '../common/UserAvatar';
import EventPopup from '../timeline-v3/events/EventPopup';
import SiteControlLockView from './SiteControlLockView';

const getReportTypeLabel = (reportType) => {
  const type = (reportType || '').toLowerCase();
  if (type === 'timeline') return 'Timeline';
  if (type === 'user') return 'User';
  if (type === 'post') return 'Post';
  return reportType || 'Post';
};

const AdminListTab = () => {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const fetchAdmins = async () => {
      try {
        setLoading(true);
        setError('');
        const data = await listSiteAdmins();
        if (!active) return;
        setAdmins(Array.isArray(data?.items) ? data.items : []);
      } catch (e) {
        if (!active) return;
        setAdmins([]);
        setError(e?.response?.data?.error || 'Failed to load site admins');
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchAdmins();
    return () => { active = false; };
  }, []);

  return (
    <Box sx={{ mt: 2 }}>
      <Paper sx={{ p: 3 }} elevation={2}>
        <Typography variant="h6" sx={{ mb: 2 }}>Site Administration</Typography>
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <CircularProgress size={24} />
          </Box>
        )}
        {!loading && error && (
          <Alert severity="error">{error}</Alert>
        )}
        {!loading && !error && admins.length === 0 && (
          <Typography variant="body2" color="text.secondary">
            No site admins found.
          </Typography>
        )}
        {!loading && !error && admins.length > 0 && (
          <Stack spacing={2}>
            {admins.map((admin) => (
              <Paper
                key={admin.user_id}
                variant="outlined"
                sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <UserAvatar
                    name={admin.username || 'Admin'}
                    avatarUrl={admin.avatar_url}
                    id={admin.user_id}
                    size={36}
                  />
                  <Box>
                    <Typography variant="subtitle1">{admin.username || `User ${admin.user_id}`}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      User ID: {admin.user_id}
                    </Typography>
                  </Box>
                </Box>
                <Chip
                  label={admin.role || 'SiteAdmin'}
                  color={admin.role === 'SiteOwner' ? 'primary' : 'default'}
                  sx={{ fontWeight: 600 }}
                />
              </Paper>
            ))}
          </Stack>
        )}
      </Paper>
    </Box>
  );
};

const getReportTypeChipStyle = (reportType) => {
  const type = (reportType || '').toLowerCase();
  if (type === 'timeline') return { bgcolor: '#2e7d32', color: '#fff' };
  if (type === 'user') return { bgcolor: '#1565c0', color: '#fff' };
  if (type === 'post') return { bgcolor: '#6d4c41', color: '#fff' };
  return { bgcolor: '#607d8b', color: '#fff' };
};

const getEventTypeDisplay = (eventType, reportType) => {
  const type = (eventType || reportType || '').toLowerCase();
  switch (type) {
    case 'remark':
      return { icon: CommentIcon, color: '#2196f3', label: 'Remark' };
    case 'media':
      return { icon: MovieIcon, color: '#7b1fa2', label: 'Media' };
    case 'image':
      return { icon: ImageIcon, color: '#009688', label: 'Image' };
    case 'video':
      return { icon: VideocamIcon, color: '#4a148c', label: 'Video' };
    case 'audio':
      return { icon: AudiotrackIcon, color: '#e65100', label: 'Audio' };
    case 'news':
      return { icon: NewspaperIcon, color: '#e53935', label: 'News' };
    case 'timeline':
      return { icon: ForumIcon, color: '#2e7d32', label: 'Timeline' };
    case 'user':
      return { icon: PersonIcon, color: '#1565c0', label: 'User' };
    case 'post':
      return { icon: CommentIcon, color: '#6d4c41', label: 'Post' };
    default:
      return { icon: CommentIcon, color: '#757575', label: eventType || 'Event' };
  }
};

const parseReasonCategory = (reasonRaw) => {
  const out = { chipLabel: null, chipStyle: {}, cleaned: reasonRaw || '' };
  if (!reasonRaw || typeof reasonRaw !== 'string') return out;
  const match = reasonRaw.match(/^\s*\[([^\]]+)\]\s*(.*)$/);
  if (!match) return out;
  const key = (match[1] || '').toLowerCase();
  out.cleaned = match[2] || '';
  if (key === 'website_policy') {
    out.chipLabel = 'Website Policy';
    out.chipStyle = { bgcolor: '#1976d2', color: '#fff' };
  } else if (key === 'government_policy') {
    out.chipLabel = 'Government Policy';
    out.chipStyle = { bgcolor: '#ed6c02', color: '#fff' };
  } else if (key === 'unethical_boundary') {
    out.chipLabel = 'Unethical Boundary';
    out.chipStyle = { bgcolor: '#d32f2f', color: '#fff' };
  }
  return out;
};

const inferReportType = (item) => {
  if (item?.report_type) return item.report_type;
  if (item?.event_id) return 'post';
  if (item?.timeline_id) return 'timeline';
  if (item?.reported_user_id || item?.user_id) return 'user';
  return 'post';
};

const GlobalReportsTab = () => {
  const [postTabValue, setPostTabValue] = useState(0);
  const [typeFilter, setTypeFilter] = useState('all');
  const [reportedPosts, setReportedPosts] = useState([]);
  const [isLoadingReports, setIsLoadingReports] = useState(true);
  const [counts, setCounts] = useState({ all: 0, pending: 0, reviewing: 0, resolved: 0 });
  const [pageInfo, setPageInfo] = useState({ page: 1, page_size: 20, total: 0 });
  const [reviewingEventIds, setReviewingEventIds] = useState(new Set());
  const [selectedPost, setSelectedPost] = useState(null);
  const [confirmPostActionDialogOpen, setConfirmPostActionDialogOpen] = useState(false);
  const [postActionType, setPostActionType] = useState('');
  const [actionVerdict, setActionVerdict] = useState('');
  const [lockEditOnResolve, setLockEditOnResolve] = useState(false);
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [removeVerdict, setRemoveVerdict] = useState('');
  const [removeSubmitting, setRemoveSubmitting] = useState(false);
  const [lockEditOnRemove, setLockEditOnRemove] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [eventPopupOpen, setEventPopupOpen] = useState(false);
  const [popupEvent, setPopupEvent] = useState(null);

  const handlePostTabChange = (event, newValue) => {
    setPostTabValue(newValue);
  };

  const handleOpenPostActionDialog = (post, action) => {
    setSelectedPost(post);
    setPostActionType(action);
    setActionVerdict('');
    setLockEditOnResolve(false);
    setConfirmPostActionDialogOpen(true);
  };

  const handleClosePostActionDialog = () => {
    setConfirmPostActionDialogOpen(false);
    setSelectedPost(null);
    setPostActionType('');
    setActionVerdict('');
    setLockEditOnResolve(false);
  };

  const handleOpenRemoveDialog = (post) => {
    setSelectedPost(post);
    setRemoveVerdict('');
    setLockEditOnRemove(false);
    setRemoveDialogOpen(true);
  };

  const handleCloseRemoveDialog = () => {
    setRemoveDialogOpen(false);
    setSelectedPost(null);
    setRemoveVerdict('');
    setRemoveSubmitting(false);
    setLockEditOnRemove(false);
  };

  const handleViewEvent = async (post) => {
    try {
      if (!post?.eventId || !post?.timelineId) return;
      const res = await api.get(`/api/timeline-v3/${post.timelineId}/events/${post.eventId}`);
      const event = res?.data;
      if (event && event.id) {
        setPopupEvent(event);
        setEventPopupOpen(true);
      }
    } catch (e) {
      console.warn('[SiteControl] Failed to load event for popup:', e);
    }
  };

  const fetchReports = useCallback(async () => {
    try {
      setIsLoadingReports(true);
      const status = postTabValue === 1 ? 'pending' : postTabValue === 2 ? 'reviewing' : postTabValue === 3 ? 'resolved' : 'all';
      const data = await listSiteReports({ status, page: 1, page_size: 20 });
      const items = Array.isArray(data?.items) ? data.items : [];

      const mappedPromises = items.map(async (it) => {
        let displayType = 'Post';
        if (it.event_id && it.timeline_id) {
          try {
            const eventRes = await api.get(`/api/timeline-v3/${it.timeline_id}/events/${it.event_id}`);
            const event = eventRes?.data;
            if (event) {
              if (event.media_subtype) {
                displayType = event.media_subtype.charAt(0).toUpperCase() + event.media_subtype.slice(1);
              } else if (event.type) {
                const type = String(event.type).toLowerCase();
                if (type === 'remark') displayType = 'Remark';
                else if (type === 'news') displayType = 'News';
                else if (type === 'media') displayType = 'Media';
                else displayType = event.type.charAt(0).toUpperCase() + event.type.slice(1);
              }
            }
          } catch (err) {
            console.warn('[SiteControl] Failed to fetch event type for event', it.event_id, err);
          }
        }

        const reportType = inferReportType(it);
        const statusRaw = (it.status || 'pending').toLowerCase();
        const normalizedStatus = statusRaw === 'escalated' ? 'pending' : statusRaw;
        return {
          id: it.id || it.report_id || String(Math.random()),
          eventType: displayType,
          status: normalizedStatus,
          reportDate: it.reported_at || it.created_at || '',
          eventId: it.event_id,
          timelineId: it.timeline_id,
          timelineName: it.timeline_name || 'Unknown Timeline',
          timelineType: it.timeline_type || null,
          reportType,
          reporter: it.reporter || {
            id: it.reporter_id,
            name: it.reporter_username || 'Reporter',
            avatar: it.reporter_avatar_url || null,
          },
          reason: it.reason || '',
          escalationType: it.escalation_type || null,
          escalationSummary: it.escalation_summary || '',
          assignedModerator: it.assigned_to ? {
            id: it.assigned_to,
            name: it.assigned_to_username || it.assigned_to_name || 'Moderator',
            avatar: it.assigned_to_avatar_url || null,
          } : null,
          resolution: it.resolution || null,
          verdict: it.verdict || '',
          reportId: it.id || it.report_id,
        };
      });

      const mapped = await Promise.all(mappedPromises);
      setReportedPosts(mapped);
      setCounts(data?.counts || { all: mapped.length, pending: mapped.filter(p => p.status === 'pending').length, reviewing: mapped.filter(p => p.status === 'reviewing').length, resolved: mapped.filter(p => p.status === 'resolved').length });
      setPageInfo({ page: data?.page || 1, page_size: data?.page_size || 20, total: data?.total || mapped.length });

      const reviewingIds = new Set(items.filter(it => it.status === 'reviewing').map(it => it.event_id).filter(Boolean));
      setReviewingEventIds(reviewingIds);
    } catch (e) {
      console.warn('[SiteControl] listSiteReports failed:', e);
      setReportedPosts([]);
      setCounts({ all: 0, pending: 0, reviewing: 0, resolved: 0 });
      setPageInfo({ page: 1, page_size: 20, total: 0 });
      setReviewingEventIds(new Set());
    } finally {
      setIsLoadingReports(false);
    }
  }, [postTabValue]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleAcceptReport = async (post) => {
    try {
      await acceptSiteReport(post.reportId || post.id);
      await fetchReports();
      setSnackbarMessage('Report accepted for review');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (e) {
      setSnackbarMessage(e?.response?.data?.error || 'Failed to accept report');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  const handleDeletePost = async () => {
    try {
      if (!actionVerdict.trim()) return;
      await resolveSiteReport(selectedPost?.reportId || selectedPost?.id, 'delete', actionVerdict.trim(), false);
      setConfirmPostActionDialogOpen(false);
      await fetchReports();
      setSnackbarMessage('Resolved: action=delete');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (e) {
      setConfirmPostActionDialogOpen(false);
      setSnackbarMessage(e?.response?.data?.error || 'Failed to resolve (delete)');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  const handleSafeguardPost = async () => {
    try {
      if (!actionVerdict.trim()) return;
      await resolveSiteReport(selectedPost?.reportId || selectedPost?.id, 'safeguard', actionVerdict.trim(), lockEditOnResolve);
      setConfirmPostActionDialogOpen(false);
      await fetchReports();
      setSnackbarMessage('Resolved: action=safeguard');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (e) {
      setConfirmPostActionDialogOpen(false);
      setSnackbarMessage(e?.response?.data?.error || 'Failed to resolve (safeguard)');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  const handleConfirmRemoveFromTimeline = async () => {
    try {
      if (!removeVerdict || !String(removeVerdict).trim()) return;
      setRemoveSubmitting(true);
      await resolveSiteReport(selectedPost?.reportId || selectedPost?.id, 'remove', removeVerdict.trim(), lockEditOnRemove);
      setRemoveDialogOpen(false);
      await fetchReports();
      setSnackbarMessage('Resolved: action=remove');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (e) {
      setRemoveDialogOpen(false);
      const msg = e?.response?.status === 409
        ? (e?.response?.data?.message || 'Remove blocked: event exists only on this timeline. Use Escalate instead.')
        : (e?.response?.data?.error || 'Failed to resolve (remove)');
      setSnackbarMessage(msg);
      setSnackbarSeverity('warning');
      setSnackbarOpen(true);
    } finally {
      setRemoveSubmitting(false);
    }
  };

  const filteredPosts = useMemo(() => {
    return reportedPosts.filter((post) => {
      if (typeFilter === 'all') return true;
      return (post.reportType || 'post') === typeFilter;
    });
  }, [reportedPosts, typeFilter]);

  const pendingCount = counts.pending;
  const reviewingCount = counts.reviewing;
  const resolvedCount = counts.resolved;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, gap: 2, flexWrap: 'wrap' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <FlagIcon sx={{ mr: 1, color: 'warning.main' }} />
          <Typography variant="h6" component="h2">
            Global Reports
          </Typography>
        </Box>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel id="site-control-type-filter">Type Filter</InputLabel>
          <Select
            labelId="site-control-type-filter"
            label="Type Filter"
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value)}
          >
            <MenuItem value="all">All Types</MenuItem>
            <MenuItem value="post">Posts</MenuItem>
            <MenuItem value="timeline">Timelines</MenuItem>
            <MenuItem value="user">Users</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Tabs value={postTabValue} onChange={handlePostTabChange} sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}>
        <Tab label={`All (${counts.all})`} />
        <Tab label={`Pending (${pendingCount})`} sx={{ color: 'warning.main', fontWeight: 'bold' }} />
        <Tab label={`Reviewing (${reviewingCount})`} sx={{ color: 'info.main', fontWeight: 'bold' }} />
        <Tab label={`Resolved (${resolvedCount})`} sx={{ color: 'success.main', fontWeight: 'bold' }} />
      </Tabs>

      {isLoadingReports ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Box sx={{ maxHeight: 520, overflow: 'auto' }}>
          {filteredPosts.length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                No reports in this category
              </Typography>
            </Box>
          ) : (
            <Box>
              {filteredPosts.map((post) => {
                const { chipLabel, chipStyle, cleaned } = parseReasonCategory(post.reason);
                const eventTypeDisplay = getEventTypeDisplay(post.eventType, post.reportType);
                const EventTypeIcon = eventTypeDisplay.icon;
                const reportTypeLabel = getReportTypeLabel(post.reportType);

                let statusColor = {
                  text: '#6B7280',
                  bg: '#F3F4F6',
                  icon: null,
                };

                if (post.status === 'pending') {
                  statusColor = { text: '#D97706', bg: '#FEF3C7', icon: <FlagIcon fontSize="small" /> };
                } else if (post.status === 'reviewing') {
                  statusColor = { text: '#2563EB', bg: '#DBEAFE', icon: <ShieldIcon fontSize="small" /> };
                } else if (post.status === 'resolved') {
                  statusColor = { text: '#059669', bg: '#D1FAE5', icon: <CheckCircleIcon fontSize="small" /> };
                }

                return (
                  <Paper
                    key={post.id}
                    elevation={2}
                    sx={{
                      p: 2,
                      mb: 2,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      borderLeft: `4px solid ${statusColor.text}`,
                      '&:hover': { transform: 'translateY(-2px)', boxShadow: 3 },
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, gap: 2, flexWrap: 'wrap' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                        <EventTypeIcon sx={{ color: eventTypeDisplay.color, fontSize: 20 }} />
                        <Typography variant="subtitle1" component="div" sx={{ fontWeight: 500 }}>
                          {eventTypeDisplay.label}
                        </Typography>
                        <Chip
                          label={reportTypeLabel}
                          size="small"
                          sx={{ ...getReportTypeChipStyle(post.reportType), ml: 1 }}
                        />
                        <Chip
                          label={post.status.charAt(0).toUpperCase() + post.status.slice(1)}
                          size="small"
                          icon={statusColor.icon}
                          sx={{ ml: 1, bgcolor: statusColor.bg, color: statusColor.text, fontWeight: 500 }}
                        />
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        Reported {post.reportDate}
                      </Typography>
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Stack spacing={1}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2"><strong>Timeline:</strong></Typography>
                          <Typography variant="body2">{post.timelineName}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2"><strong>Reporter:</strong></Typography>
                          {post.reporter?.avatar && (
                            <UserAvatar
                              name={post.reporter?.name || 'Reporter'}
                              avatarUrl={post.reporter?.avatar}
                              id={post.reporter?.id}
                              size={22}
                            />
                          )}
                          <Typography variant="body2">{post.reporter?.name || 'Reporter'}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                          <Typography variant="body2"><strong>Reason:</strong></Typography>
                          {chipLabel && <Chip label={chipLabel} size="small" sx={chipStyle} />}
                          <Typography variant="body2">{cleaned}</Typography>
                        </Box>
                        {(post.escalationType || post.escalationSummary) && (
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                            {post.escalationType && (
                              <Typography variant="body2" color="text.secondary">
                                Escalation: <strong>{post.escalationType === 'edit' ? 'Request Edit' : 'Request Delete'}</strong>
                              </Typography>
                            )}
                            {post.escalationSummary && (
                              <Typography variant="body2" color="text.secondary">
                                Summary: {post.escalationSummary}
                              </Typography>
                            )}
                          </Box>
                        )}
                        {(post.status === 'reviewing' || post.status === 'resolved') && post.assignedModerator && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2"><strong>Accepted by:</strong></Typography>
                            {post.assignedModerator.avatar && (
                              <UserAvatar
                                name={post.assignedModerator.name || 'Moderator'}
                                avatarUrl={post.assignedModerator.avatar}
                                id={post.assignedModerator.id}
                                size={22}
                              />
                            )}
                            <Typography variant="body2">{post.assignedModerator.name}</Typography>
                          </Box>
                        )}
                      </Stack>
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2, flexWrap: 'wrap' }}>
                      {post.status === 'pending' && (
                        <Button
                          variant="outlined"
                          size="small"
                          color="primary"
                          startIcon={<ShieldIcon />}
                          onClick={() => handleAcceptReport(post)}
                          sx={{ mr: 1, mb: 1 }}
                        >
                          Accept for Review
                        </Button>
                      )}

                      {post.status === 'reviewing' && (
                        <>
                          <Button
                            variant="outlined"
                            size="small"
                            color="warning"
                            startIcon={<PersonRemoveIcon />}
                            onClick={() => handleOpenRemoveDialog(post)}
                            sx={{ mr: 1, mb: 1 }}
                          >
                            Remove from Timeline
                          </Button>
                          <Button
                            variant="outlined"
                            size="small"
                            color="error"
                            startIcon={<CancelIcon />}
                            onClick={() => handleOpenPostActionDialog(post, 'delete')}
                            sx={{ mr: 1, mb: 1 }}
                          >
                            Escalate
                          </Button>
                          <Button
                            variant="outlined"
                            size="small"
                            color="success"
                            startIcon={<CheckCircleIcon />}
                            onClick={() => handleOpenPostActionDialog(post, 'safeguard')}
                            sx={{ mb: 1 }}
                          >
                            Safeguard Post
                          </Button>
                        </>
                      )}

                      {post.eventId && post.timelineId && (
                        <Button
                          onClick={() => handleViewEvent(post)}
                          variant="text"
                          size="small"
                          sx={{ ml: 1, mb: 1 }}
                        >
                          View Event
                        </Button>
                      )}

                      {post.status === 'resolved' && (
                        <Box sx={{ mt: 1, width: '100%' }}>
                          <Typography variant="body2" color="text.secondary">
                            Resolution: <strong>{post.resolution || 'Unknown'}</strong>
                          </Typography>
                          {post.verdict && (
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                              Verdict: {post.verdict}
                            </Typography>
                          )}
                        </Box>
                      )}
                    </Box>
                  </Paper>
                );
              })}
            </Box>
          )}
        </Box>
      )}

      <Dialog
        open={confirmPostActionDialogOpen}
        onClose={handleClosePostActionDialog}
        aria-labelledby="post-action-dialog-title"
        aria-describedby="post-action-dialog-description"
      >
        <DialogTitle id="post-action-dialog-title">
          {postActionType === 'delete' ? 'Delete Reported Post?' : 'Safeguard Post?'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="post-action-dialog-description">
            {postActionType === 'delete'
              ? 'This action deletes the post across the site. This action cannot be undone.'
              : 'This action will mark the post as reviewed and safe, dismissing the report. The post will remain visible on the timeline.'}
          </DialogContentText>
          <TextField
            autoFocus
            fullWidth
            multiline
            minRows={3}
            label="Verdict (required)"
            placeholder="Write your findings and rationale"
            value={actionVerdict}
            onChange={(e) => setActionVerdict(e.target.value)}
            sx={{ mt: 2 }}
          />
          {postActionType === 'safeguard' && (
            <FormControlLabel
              sx={{ mt: 1 }}
              control={(
                <Checkbox
                  checked={lockEditOnResolve}
                  onChange={(e) => setLockEditOnResolve(e.target.checked)}
                />
              )}
              label="Lock creator editing after resolve"
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePostActionDialog} color="primary">
            Cancel
          </Button>
          <Button
            onClick={postActionType === 'delete' ? handleDeletePost : handleSafeguardPost}
            color={postActionType === 'delete' ? 'error' : 'success'}
            variant="contained"
            startIcon={postActionType === 'delete' ? <CancelIcon /> : <CheckCircleIcon />}
            disabled={!actionVerdict.trim()}
          >
            {postActionType === 'delete' ? 'Delete Post' : 'Safeguard Post'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={removeDialogOpen}
        onClose={handleCloseRemoveDialog}
        aria-labelledby="remove-dialog-title"
      >
        <DialogTitle id="remove-dialog-title">Remove from Timeline</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            This will remove the event from the timeline. Please enter your moderation verdict. This verdict will be saved on the ticket.
          </DialogContentText>
          <TextField
            autoFocus
            fullWidth
            multiline
            minRows={3}
            label="Verdict (required)"
            placeholder="Write your findings and rationale"
            value={removeVerdict}
            onChange={(e) => setRemoveVerdict(e.target.value)}
          />
          <FormControlLabel
            sx={{ mt: 1 }}
            control={(
              <Checkbox
                checked={lockEditOnRemove}
                onChange={(e) => setLockEditOnRemove(e.target.checked)}
              />
            )}
            label="Lock creator editing after resolve"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseRemoveDialog}>Cancel</Button>
          <Button
            onClick={handleConfirmRemoveFromTimeline}
            variant="contained"
            color="warning"
            disabled={!removeVerdict.trim() || removeSubmitting}
            startIcon={<PersonRemoveIcon />}
          >
            {removeSubmitting ? 'Removing…' : 'Remove from Timeline'}
          </Button>
        </DialogActions>
      </Dialog>

      {eventPopupOpen && popupEvent && (
        <EventPopup
          event={popupEvent}
          open={eventPopupOpen}
          onClose={() => setEventPopupOpen(false)}
          reviewingEventIds={reviewingEventIds}
        />
      )}

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnackbarOpen(false)} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </motion.div>
  );
};

const SiteSettingsTab = ({ canManageSettings }) => {
  return (
    <Box sx={{ mt: 2 }}>
      {!canManageSettings ? (
        <Paper sx={{ p: 4, textAlign: 'center' }} elevation={2}>
          <LockIcon sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
          <Typography variant="h6">Site Settings Locked</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Site settings are only available to the Site Owner.
          </Typography>
        </Paper>
      ) : (
        <Stack spacing={3}>
          <Paper sx={{ p: 3 }} elevation={2}>
            <Typography variant="h6" sx={{ mb: 1 }}>Landing Page Text Rotator</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Configure the rotating hero text shown on the landing page.
            </Typography>
            <Stack spacing={2}>
              <TextField label="Headline A" placeholder="Enter first headline" fullWidth />
              <TextField label="Headline B" placeholder="Enter second headline" fullWidth />
              <TextField label="Headline C" placeholder="Enter third headline" fullWidth />
              <TextField label="Rotation Interval (seconds)" placeholder="e.g. 6" type="number" fullWidth />
            </Stack>
          </Paper>

          <Paper sx={{ p: 3 }} elevation={2}>
            <Typography variant="h6" sx={{ mb: 1 }}>Toolbar LED Banner</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Configure the LED banner message shown across the top toolbar.
            </Typography>
            <Stack spacing={2}>
              <TextField label="Banner Message" placeholder="Enter LED banner message" fullWidth />
              <TextField label="Scroll Speed (seconds)" placeholder="e.g. 12" type="number" fullWidth />
              <TextField label="Display Duration (seconds)" placeholder="e.g. 20" type="number" fullWidth />
            </Stack>
          </Paper>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button variant="contained" color="primary" disabled>
              Save Settings (coming soon)
            </Button>
          </Box>
        </Stack>
      )}
    </Box>
  );
};

const SiteControlPage = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [accessLoading, setAccessLoading] = useState(true);
  const [siteRole, setSiteRole] = useState(null);
  const [isSiteAdmin, setIsSiteAdmin] = useState(false);

  useEffect(() => {
    if (!user?.id) {
      setAccessLoading(false);
      setSiteRole(null);
      setIsSiteAdmin(false);
      return;
    }

    setAccessLoading(true);
    try {
      const storageKey = `user_passport_${user.id}`;
      const passport = JSON.parse(localStorage.getItem(storageKey) || '{}');
      setSiteRole(passport.site_role || null);
      setIsSiteAdmin(Boolean(passport.is_site_admin) || Number(user.id) === 1);
    } catch (e) {
      console.warn('[SiteControl] Unable to parse passport data:', e);
      setSiteRole(null);
      setIsSiteAdmin(Number(user.id) === 1);
    } finally {
      setAccessLoading(false);
    }
  }, [user]);

  const isSiteOwner = Number(user?.id) === 1 || siteRole === 'SiteOwner';
  const hasAccess = Boolean(isSiteAdmin || isSiteOwner);
  const canManageSettings = isSiteOwner;

  if (accessLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '70vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!hasAccess) {
    return (
      <SiteControlLockView
        title="Site Control Locked"
        description="You do not have access to this page."
        backLabel="Back"
      />
    );
  }

  return (
    <>
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 0,
          background: theme.palette.mode === 'dark'
            ? 'linear-gradient(180deg, #050505 0%, #0b1d2a 55%, #152f48 100%)'
            : 'linear-gradient(180deg, #f6f4ef 0%, #fbe7da 40%, #ffe7f1 100%)',
        }}
      />
      <Box
        sx={{
          position: 'relative',
          zIndex: 1,
          minHeight: 'calc(100vh - 64px)',
          pt: 4,
          px: { xs: 2, md: 4 },
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 3,
            mb: 3,
            backgroundColor: theme.palette.mode === 'dark'
              ? 'rgba(10, 17, 40, 0.75)'
              : 'rgba(255, 255, 255, 0.75)',
            backdropFilter: 'blur(10px)',
            borderRadius: 3,
          }}
        >
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
            Site Control
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Global moderation tools and site-level configuration.
          </Typography>
        </Paper>

        <Paper
          elevation={3}
          sx={{
            p: 2,
            backgroundColor: theme.palette.mode === 'dark'
              ? 'rgba(10, 17, 40, 0.8)'
              : 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(8px)',
            borderRadius: 3,
          }}
        >
          <Tabs
            value={tabValue}
            onChange={(event, newValue) => setTabValue(newValue)}
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab label="Global Reports" />
            <Tab label="Admin List" />
            <Tab label="Site Settings" disabled={!canManageSettings} />
          </Tabs>

          <Box sx={{ mt: 3 }}>
            {tabValue === 0 && <GlobalReportsTab />}
            {tabValue === 1 && <AdminListTab />}
            {tabValue === 2 && <SiteSettingsTab canManageSettings={canManageSettings} />}
          </Box>
        </Paper>
      </Box>
    </>
  );
};

export default SiteControlPage;
