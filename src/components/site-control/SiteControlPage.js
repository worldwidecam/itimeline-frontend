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
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Portal,
  Switch,
  useTheme,
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
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
import TagIcon from '@mui/icons-material/Tag';
import RefreshIcon from '@mui/icons-material/Refresh';
import SaveIcon from '@mui/icons-material/Save';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AddIcon from '@mui/icons-material/Add';
import { useAuth } from '../../contexts/AuthContext';
import api, { addSiteAdmin, listSiteAdmins, removeSiteAdmin, listSiteReports, acceptSiteReport, resolveSiteReport, unbanTimelineFromReport, liftTimelineWarningFromReport, getLandingRotatorSettings, updateLandingRotatorSettings } from '../../utils/api';
import UserAvatar from '../common/UserAvatar';
import EventPopup from '../timeline-v3/events/EventPopup';
import EventDialog from '../timeline-v3/events/EventDialog';
import SiteControlLockView from './SiteControlLockView';

const getReportTypeLabel = (reportType) => {
  const type = (reportType || '').toLowerCase();
  if (type === 'timeline') return 'Timeline';
  if (type === 'user') return 'User';
  if (type === 'post') return 'Post';
  return reportType || 'Post';
};

const formatResolutionLabel = (resolution) => {
  const value = String(resolution || '').trim();
  if (!value) return 'Unknown';
  return value
    .replace(/_/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
};

const parseVerdictDetails = (verdictRaw) => {
  const verdictText = String(verdictRaw || '').trim();
  if (!verdictText) {
    return { verdictText: '', reportedUsernameAtActionTime: '' };
  }

  const snapshotRegex = /(?:^|\n)Reported username at action time:\s*(.+)\s*$/i;
  const match = verdictText.match(snapshotRegex);
  const reportedUsernameAtActionTime = match?.[1]?.trim() || '';
  const cleanedVerdict = verdictText.replace(snapshotRegex, '').trim();

  return {
    verdictText: cleanedVerdict,
    reportedUsernameAtActionTime,
  };
};

const AdminListTab = ({ canManage }) => {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [removeTarget, setRemoveTarget] = useState(null);

  const fetchAdmins = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await listSiteAdmins();
      setAdmins(Array.isArray(data?.items) ? data.items : []);
    } catch (e) {
      setAdmins([]);
      setError(e?.response?.data?.error || 'Failed to load site admins');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAdmins();
  }, [fetchAdmins]);

  const handleAddAdmin = async () => {
    const trimmed = identifier.trim();
    if (!trimmed) {
      setSnackbarMessage('Enter a username, email, or user ID');
      setSnackbarSeverity('warning');
      setSnackbarOpen(true);
      return;
    }

    try {
      setActionLoading(true);
      await addSiteAdmin(trimmed);
      setIdentifier('');
      setSnackbarMessage('Site admin added');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      await fetchAdmins();
    } catch (e) {
      setSnackbarMessage(e?.response?.data?.error || 'Failed to add site admin');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveAdmin = async () => {
    if (!removeTarget?.user_id) return;
    try {
      setActionLoading(true);
      await removeSiteAdmin(removeTarget.user_id);
      setSnackbarMessage('Site admin removed');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      setRemoveTarget(null);
      await fetchAdmins();
    } catch (e) {
      setSnackbarMessage(e?.response?.data?.error || 'Failed to remove site admin');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Paper sx={{ p: 3 }} elevation={2}>
        <Typography variant="h6" sx={{ mb: 2 }}>Site Administration</Typography>
        {canManage && (
          <Stack spacing={2} sx={{ mb: 3 }}>
            <Typography variant="body2" color="text.secondary">
              Add SiteAdmin by username, email, or user ID.
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'stretch', sm: 'center' }}>
              <TextField
                label="Add SiteAdmin"
                placeholder="username / email / user ID"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                fullWidth
              />
              <Button
                variant="contained"
                onClick={handleAddAdmin}
                disabled={actionLoading}
                sx={{ minWidth: 160 }}
              >
                Add Admin
              </Button>
            </Stack>
          </Stack>
        )}
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
                    {admin.email && (
                      <Typography variant="body2" color="text.secondary">
                        {admin.email}
                      </Typography>
                    )}
                  </Box>
                </Box>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Chip
                    label={admin.role || 'SiteAdmin'}
                    color={admin.role === 'SiteOwner' ? 'primary' : 'default'}
                    sx={{ fontWeight: 600 }}
                  />
                  {canManage && admin.role !== 'SiteOwner' && (
                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      onClick={() => setRemoveTarget(admin)}
                    >
                      Remove
                    </Button>
                  )}
                </Stack>
              </Paper>
            ))}
          </Stack>
        )}
      </Paper>
      <Dialog open={Boolean(removeTarget)} onClose={() => setRemoveTarget(null)}>
        <DialogTitle>Remove Site Admin?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Remove {removeTarget?.username || `User ${removeTarget?.user_id}`} from site admins?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRemoveTarget(null)}>Cancel</Button>
          <Button onClick={handleRemoveAdmin} color="error" variant="contained" disabled={actionLoading}>
            Remove
          </Button>
        </DialogActions>
      </Dialog>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={5000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnackbarOpen(false)} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
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

const getTimelineTypeLabel = (timelineType) => {
  const type = (timelineType || '').toLowerCase();
  if (type === 'community') return 'Community';
  if (type === 'personal') return 'Personal';
  if (type === 'hashtag') return 'Hashtag';
  return 'Timeline';
};

const getTimelineDisplayName = (name, timelineType) => {
  const safeName = (name || 'Unknown Timeline').trim();
  const type = (timelineType || '').toLowerCase();
  if (type === 'community') return `i-${safeName}`;
  if (type === 'personal') return `My-${safeName}`;
  if (type === 'hashtag') return `#${safeName}`;
  return safeName;
};

const getEventTypeDisplay = (eventType, reportType, timelineType) => {
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
      if ((timelineType || '').toLowerCase() === 'hashtag') {
        return { icon: TagIcon, color: '#2e7d32', label: 'Hashtag Timeline' };
      }
      if ((timelineType || '').toLowerCase() === 'personal') {
        return { icon: PersonIcon, color: '#2e7d32', label: 'Personal Timeline' };
      }
      return { icon: ForumIcon, color: '#2e7d32', label: 'Community Timeline' };
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
  if (item?.report_type) return String(item.report_type).toLowerCase();
  if (item?.event_id) return 'post';
  if (item?.reported_user_id || item?.user_id) return 'user';
  if (item?.reported_timeline_id) return 'timeline';
  if (item?.timeline_id && Number(item.timeline_id) > 0) return 'timeline';
  return 'post';
};

const GlobalReportsTab = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const isSiteOwner = Number(user?.id) === 1;
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
  const [safeguardDays, setSafeguardDays] = useState('7');
  const [safeguardUseCustomUntil, setSafeguardUseCustomUntil] = useState(false);
  const [safeguardCustomUntil, setSafeguardCustomUntil] = useState('');
  const [warningScope, setWarningScope] = useState('general');
  const [warningDays, setWarningDays] = useState('7');
  const [warningIndef, setWarningIndef] = useState(false);
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [removeVerdict, setRemoveVerdict] = useState('');
  const [removeSubmitting, setRemoveSubmitting] = useState(false);
  const [lockEditOnRemove, setLockEditOnRemove] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editDialogEvent, setEditDialogEvent] = useState(null);
  const [editDialogVerdict, setEditDialogVerdict] = useState('');
  const [editDialogSubmitting, setEditDialogSubmitting] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [eventPopupOpen, setEventPopupOpen] = useState(false);
  const [popupEvent, setPopupEvent] = useState(null);
  const [userModerationDialogOpen, setUserModerationDialogOpen] = useState(false);
  const [userModerationAction, setUserModerationAction] = useState('require_username_change');
  const [userModerationVerdict, setUserModerationVerdict] = useState('');
  const [restrictionUntil, setRestrictionUntil] = useState('');
  const [suspendType, setSuspendType] = useState('permanent');
  const [suspendUntil, setSuspendUntil] = useState('');
  const [blockCurrentUsername, setBlockCurrentUsername] = useState(true);
  const [userModerationSubmitting, setUserModerationSubmitting] = useState(false);

  const handlePostTabChange = (event, newValue) => {
    setPostTabValue(newValue);
  };

  const handleOpenPostActionDialog = (post, action) => {
    setSelectedPost(post);
    setPostActionType(action);
    setActionVerdict('');
    setLockEditOnResolve(false);
    setSafeguardDays('7');
    setSafeguardUseCustomUntil(false);
    setSafeguardCustomUntil('');
    setWarningScope('general');
    setWarningDays('7');
    setWarningIndef(false);
    setConfirmPostActionDialogOpen(true);
  };

  const handleClosePostActionDialog = () => {
    setConfirmPostActionDialogOpen(false);
    setSelectedPost(null);
    setPostActionType('');
    setActionVerdict('');
    setLockEditOnResolve(false);
    setSafeguardDays('7');
    setSafeguardUseCustomUntil(false);
    setSafeguardCustomUntil('');
    setWarningScope('general');
    setWarningDays('7');
    setWarningIndef(false);
  };

  const handleSubmitPostAction = async () => {
    try {
      if (!actionVerdict.trim()) return;
      const payload = {};
      if (postActionType === 'safeguard') {
        payload.safeguard_days = Number(safeguardDays || 7);
        if (isSiteOwner && safeguardUseCustomUntil && safeguardCustomUntil) {
          payload.safe_until = new Date(safeguardCustomUntil).toISOString();
        }
      }
      if (postActionType === 'issue_warning') {
        payload.warning_scope = warningScope;
        payload.warning_days = Number(warningDays || 7);
        if (warningIndef) {
          payload.warning_indef = true;
        }
      }

      await resolveSiteReport(
        selectedPost?.reportId || selectedPost?.id,
        postActionType,
        actionVerdict.trim(),
        postActionType === 'safeguard' ? lockEditOnResolve : false,
        payload,
      );

      setConfirmPostActionDialogOpen(false);
      await fetchReports();
      setSnackbarMessage(`Resolved: action=${postActionType}`);
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (e) {
      setConfirmPostActionDialogOpen(false);
      setSnackbarMessage(e?.response?.data?.error || `Failed to resolve (${postActionType})`);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  const handleUnbanTimeline = async (post) => {
    try {
      await unbanTimelineFromReport(post?.reportId || post?.id);
      await fetchReports();
      setSnackbarMessage('Timeline unbanned and ticket archived');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (e) {
      setSnackbarMessage(e?.response?.data?.error || 'Failed to unban timeline');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  const handleLiftTimelineWarning = async (post) => {
    try {
      await liftTimelineWarningFromReport(post?.reportId || post?.id);
      await fetchReports();
      setSnackbarMessage('Timeline warning lifted');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (e) {
      setSnackbarMessage(e?.response?.data?.error || 'Failed to lift timeline warning');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  const handleOpenUserModerationDialog = (post, action) => {
    setSelectedPost(post);
    setUserModerationAction(action);
    setUserModerationVerdict('');
    setRestrictionUntil('');
    setSuspendType('permanent');
    setSuspendUntil('');
    setBlockCurrentUsername(true);
    setUserModerationDialogOpen(true);
  };

  const handleCloseUserModerationDialog = () => {
    setUserModerationDialogOpen(false);
    setSelectedPost(null);
    setUserModerationAction('require_username_change');
    setUserModerationVerdict('');
    setRestrictionUntil('');
    setSuspendType('permanent');
    setSuspendUntil('');
    setBlockCurrentUsername(true);
    setUserModerationSubmitting(false);
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

  const handleOpenResolveEdit = async (post) => {
    try {
      if (!post?.eventId || !post?.timelineId) return;
      const res = await api.get(`/api/timeline-v3/${post.timelineId}/events/${post.eventId}`);
      const event = res?.data;
      if (event && event.id) {
        setSelectedPost(post);
        setEditDialogEvent(event);
        setEditDialogVerdict('');
        setEditDialogOpen(true);
      }
    } catch (e) {
      console.warn('[SiteControl] Failed to load event for resolve-edit:', e);
      setSnackbarMessage('Failed to load event for editing');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  const handleResolveEditSubmit = async (eventData) => {
    try {
      if (!selectedPost?.timelineId || !selectedPost?.eventId) return;
      if (!editDialogVerdict.trim()) return;
      setEditDialogSubmitting(true);
      await api.patch(`/api/v1/timeline-v3/${selectedPost.timelineId}/events/${selectedPost.eventId}`, {
        ...eventData,
        tags: Array.isArray(eventData.tags) ? eventData.tags : [],
      });
      await resolveSiteReport(selectedPost?.reportId || selectedPost?.id, 'edit', editDialogVerdict.trim(), true);
      handleCloseResolveEdit();
      await fetchReports();
      setSnackbarMessage('Resolved: action=edit');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (e) {
      setEditDialogSubmitting(false);
      setSnackbarMessage(e?.response?.data?.error || 'Failed to resolve (edit)');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  const handleCloseResolveEdit = () => {
    setEditDialogOpen(false);
    setEditDialogEvent(null);
    setEditDialogVerdict('');
    setEditDialogSubmitting(false);
  };

  const selectedReportType = (selectedPost?.reportType || 'post').toLowerCase();
  const selectedTypeLabel = selectedReportType === 'user'
    ? 'User'
    : selectedReportType === 'timeline'
      ? 'Timeline'
      : 'Post';
  const isSelectedPostTicket = selectedReportType === 'post';
  const actionDialogTitle = postActionType === 'delete'
    ? 'Resolve by Deleting Post?'
    : postActionType === 'issue_warning'
      ? `Issue Warning for ${selectedTypeLabel}?`
      : postActionType === 'ban_timeline'
        ? 'Ban Timeline?'
        : `Safeguard ${selectedTypeLabel}?`;
  const actionDialogDescription = postActionType === 'delete'
    ? 'This action deletes the post across the site and resolves the ticket. This action cannot be undone.'
    : postActionType === 'issue_warning'
      ? 'This action resolves the ticket and puts the timeline on warning status for 7 days with public reason visibility.'
      : postActionType === 'ban_timeline'
        ? 'This action resolves the ticket by banning the timeline (not deleting it), and shadow-hides it from normal discovery paths.'
        : `This action will mark the ${selectedTypeLabel.toLowerCase()} ticket as reviewed and safe, dismissing the report.`;

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
      const status = postTabValue === 0 ? 'pending' : postTabValue === 1 ? 'reviewing' : 'resolved';
      const reportType = typeFilter === 'all' ? undefined : typeFilter;
      const data = await listSiteReports({ status, report_type: reportType, page: 1, page_size: 20 });
      const items = Array.isArray(data?.items) ? data.items : [];

      const mappedPromises = items.map(async (it) => {
        const reportType = inferReportType(it);
        let displayType = reportType === 'user' ? 'User' : (reportType === 'timeline' ? 'Timeline' : 'Post');
        if (reportType === 'post' && it.event_id && it.timeline_id) {
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
          reportedUser: {
            id: it.reported_user_id,
            name: it.reported_user_username || (it.reported_user_id ? `User ${it.reported_user_id}` : 'Unknown User'),
            avatar: it.reported_user_avatar_url || null,
          },
          reportedTimeline: {
            id: it.reported_timeline_id || null,
            name: it.reported_timeline_name || null,
            type: it.reported_timeline_type || null,
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
          safeguardSafeUntil: it.safeguard_safe_until || null,
          warningScope: it.warning_scope || null,
          warningUntil: it.warning_until || null,
          warningIsActive: typeof it.warning_is_active === 'boolean' ? it.warning_is_active : null,
          reportId: it.id || it.report_id,
        };
      });

      const mapped = await Promise.all(mappedPromises);
      setReportedPosts(mapped);
      setCounts(data?.counts || { all: mapped.length, pending: 0, reviewing: 0, resolved: 0 });
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
  }, [postTabValue, typeFilter]);

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
        ? (e?.response?.data?.message || 'Remove blocked: this event only exists on this timeline. Use Delete Ticket if you need full removal.')
        : (e?.response?.data?.error || 'Failed to resolve (remove)');
      setSnackbarMessage(msg);
      setSnackbarSeverity('warning');
      setSnackbarOpen(true);
    } finally {
      setRemoveSubmitting(false);
    }
  };

  const handleSubmitUserModeration = async () => {
    try {
      if (!userModerationVerdict.trim()) return;

      const payload = {};
      let finalVerdict = userModerationVerdict.trim();
      if (userModerationAction === 'require_username_change') {
        payload.block_current_username = Boolean(blockCurrentUsername);
        const reportedUsernameSnapshot = String(selectedPost?.reportedUser?.name || '').trim();
        if (reportedUsernameSnapshot && !/Reported username at action time:/i.test(finalVerdict)) {
          finalVerdict = `${finalVerdict}\nReported username at action time: ${reportedUsernameSnapshot}`;
        }
      }
      if (userModerationAction === 'restrict_user') {
        if (!restrictionUntil) return;
        payload.restriction_until = new Date(restrictionUntil).toISOString();
      }
      if (userModerationAction === 'suspend_user') {
        payload.suspend_type = suspendType;
        if (suspendType === 'temporary') {
          if (!suspendUntil) return;
          payload.suspend_until = new Date(suspendUntil).toISOString();
        }
      }

      setUserModerationSubmitting(true);
      await resolveSiteReport(
        selectedPost?.reportId || selectedPost?.id,
        userModerationAction,
        finalVerdict,
        false,
        payload,
      );
      handleCloseUserModerationDialog();
      await fetchReports();
      const actionLabel = userModerationAction === 'require_username_change'
        ? 'require_username_change'
        : userModerationAction === 'restrict_user'
          ? 'restrict_user'
          : 'suspend_user';
      setSnackbarMessage(`Resolved: action=${actionLabel}`);
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (e) {
      setUserModerationSubmitting(false);
      setSnackbarMessage(e?.response?.data?.error || 'Failed to resolve user moderation action');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  const filteredPosts = useMemo(() => {
    return reportedPosts.filter((post) => {
      if (typeFilter === 'all') return true;
      return String(post.reportType || 'post').toLowerCase() === String(typeFilter).toLowerCase();
    });
  }, [reportedPosts, typeFilter]);

  const pendingCount = counts.pending;
  const reviewingCount = counts.reviewing;
  const resolvedCount = counts.resolved;
  const selectedTabColor = postTabValue === 0 ? 'warning.main' : postTabValue === 1 ? 'info.main' : 'success.main';

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

      <Tabs
        value={postTabValue}
        onChange={handlePostTabChange}
        sx={{
          mb: 3,
          borderBottom: 1,
          borderColor: 'divider',
          '& .MuiTabs-indicator': {
            backgroundColor: selectedTabColor,
            height: 3,
          },
        }}
      >
        <Tab
          label={`Pending (${pendingCount})`}
          sx={{
            fontWeight: 600,
            color: 'warning.main',
            '&.Mui-selected': { color: 'warning.main' },
          }}
        />
        <Tab
          label={`Reviewing (${reviewingCount})`}
          sx={{
            fontWeight: 600,
            color: 'info.main',
            '&.Mui-selected': { color: 'info.main' },
          }}
        />
        <Tab
          label={`Resolved (${resolvedCount})`}
          sx={{
            fontWeight: 600,
            color: 'success.main',
            '&.Mui-selected': { color: 'success.main' },
          }}
        />
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
                const { verdictText, reportedUsernameAtActionTime } = parseVerdictDetails(post.verdict);
                const eventTypeDisplay = getEventTypeDisplay(post.eventType, post.reportType, post.reportedTimeline?.type || post.timelineType);
                const EventTypeIcon = eventTypeDisplay.icon;
                const reportTypeLabel = getReportTypeLabel(post.reportType);
                const isPostTicket = (post.reportType || 'post') === 'post';
                const isUserTicket = post.reportType === 'user';
                const isTimelineTicket = post.reportType === 'timeline';
                const timelineTargetId = post.reportedTimeline?.id || post.timelineId;
                const timelineTargetName = getTimelineDisplayName(
                  post.reportedTimeline?.name || post.timelineName,
                  post.reportedTimeline?.type || post.timelineType,
                );
                const timelineTargetType = getTimelineTypeLabel(post.reportedTimeline?.type || post.timelineType);

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
                      borderTop: `3px solid ${eventTypeDisplay.color}`,
                      borderRight: `2px solid ${eventTypeDisplay.color}`,
                      borderBottom: `2px solid ${eventTypeDisplay.color}`,
                      background: isUserTicket
                        ? 'linear-gradient(180deg, rgba(21,101,192,0.09) 0%, rgba(21,101,192,0.03) 42%, rgba(255,255,255,0) 100%)'
                        : 'transparent',
                      '&:hover': { transform: 'translateY(-2px)', boxShadow: 3 },
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, gap: 2, flexWrap: 'wrap' }}>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          width: '100%',
                          gap: 2,
                          flexWrap: 'wrap',
                          p: isUserTicket ? 1.2 : 0,
                          borderRadius: isUserTicket ? 1.5 : 0,
                          backgroundColor: isUserTicket
                            ? (theme.palette.mode === 'dark' ? 'rgba(120, 110, 90, 0.26)' : '#f5eee1')
                            : 'transparent',
                          border: isUserTicket
                            ? (theme.palette.mode === 'dark' ? '1px solid rgba(214, 196, 159, 0.28)' : '1px solid #e6d8bc')
                            : 'none',
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                          <EventTypeIcon sx={{ color: eventTypeDisplay.color, fontSize: 20 }} />
                          <Chip
                            label={reportTypeLabel}
                            size="small"
                            sx={getReportTypeChipStyle(post.reportType)}
                          />
                          <Typography variant="subtitle1" component="div" sx={{ fontWeight: 700 }}>
                            Ticket
                          </Typography>
                          <Chip
                            label={post.status.charAt(0).toUpperCase() + post.status.slice(1)}
                            size="small"
                            icon={statusColor.icon}
                            sx={{ bgcolor: statusColor.bg, color: statusColor.text, fontWeight: 500 }}
                          />
                        </Box>
                        <Stack spacing={0.4} alignItems={{ xs: 'flex-start', sm: 'flex-end' }}>
                          <Typography variant="body2" color="text.secondary">
                            Reported {post.reportDate}
                          </Typography>
                          {post.status === 'resolved' && (
                            <>
                              <Typography variant="body2" color="text.secondary" sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
                                Resolution: <strong>{formatResolutionLabel(post.resolution)}</strong>
                              </Typography>
                              {post.resolution === 'safeguard' && post.safeguardSafeUntil && (
                                <Typography
                                  variant="body2"
                                  sx={{
                                    textAlign: { xs: 'left', sm: 'right' },
                                    color: '#0B8A4A',
                                    fontWeight: 700,
                                  }}
                                >
                                  Safe Until: {new Date(post.safeguardSafeUntil).toLocaleString()}
                                </Typography>
                              )}
                              {post.resolution === 'issue_warning' && post.warningUntil && (
                                <Typography
                                  variant="body2"
                                  sx={{
                                    textAlign: { xs: 'left', sm: 'right' },
                                    color: '#B45309',
                                    fontWeight: 700,
                                  }}
                                >
                                  Warning Until: {new Date(post.warningUntil).toLocaleString()}
                                </Typography>
                              )}
                              {post.resolution === 'issue_warning' && post.warningIsActive === false && (
                                <Typography
                                  variant="body2"
                                  sx={{
                                    textAlign: { xs: 'left', sm: 'right' },
                                    color: '#0B8A4A',
                                    fontWeight: 700,
                                  }}
                                >
                                  Warning Lifted
                                </Typography>
                              )}

                              {reportedUsernameAtActionTime && post.resolution === 'require_username_change' && (
                                <Typography variant="body2" color="text.secondary" sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
                                  Reported username: <strong>{reportedUsernameAtActionTime}</strong>
                                </Typography>
                              )}
                            </>
                          )}
                        </Stack>
                      </Box>
                    </Box>

                    <Box
                      sx={{
                        mb: 2,
                        display: 'grid',
                        gridTemplateColumns: {
                          xs: '1fr',
                          md: post.status === 'resolved' && verdictText ? 'minmax(0, 1fr) minmax(0, 2fr)' : '1fr',
                        },
                        gap: 2,
                        alignItems: 'start',
                      }}
                    >
                      <Box sx={{ minWidth: 0 }}>
                        <Stack spacing={1.2}>
                        {isUserTicket ? (
                          <>
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 2,
                                p: 1.5,
                                borderRadius: 2,
                                border: '1px solid rgba(21,101,192,0.35)',
                                bgcolor: 'rgba(21,101,192,0.08)',
                              }}
                            >
                              <UserAvatar
                                name={post.reportedUser?.name || 'Unknown User'}
                                avatarUrl={post.reportedUser?.avatar}
                                id={post.reportedUser?.id}
                                size={54}
                              />
                              <Box sx={{ minWidth: 0 }}>
                                <Typography variant="overline" sx={{ color: '#0D47A1', fontWeight: 700, letterSpacing: 0.8 }}>
                                  USER REPORT TARGET
                                </Typography>
                                {post.reportedUser?.id ? (
                                  <Typography
                                    component="a"
                                    href={`/profile/${post.reportedUser.id}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    variant="h6"
                                    sx={{
                                      display: 'inline-block',
                                      color: 'primary.main',
                                      textDecoration: 'none',
                                      fontWeight: 700,
                                      '&:hover': { textDecoration: 'underline' },
                                    }}
                                  >
                                    {post.reportedUser?.name || `User ${post.reportedUser.id}`}
                                  </Typography>
                                ) : (
                                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                                    {post.reportedUser?.name || 'Unknown User'}
                                  </Typography>
                                )}
                                {post.reportedUser?.id && (
                                  <Typography variant="body2" color="text.secondary">
                                    Profile: /profile/{post.reportedUser.id}
                                  </Typography>
                                )}
                              </Box>
                            </Box>

                            <Box
                              sx={{
                                p: 1.5,
                                borderRadius: 2,
                                bgcolor: 'transparent',
                                border: '1px solid rgba(13,71,161,0.28)',
                              }}
                            >
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 0.75 }}>
                                <Typography variant="body2"><strong>Reason Reported</strong></Typography>
                                {chipLabel && <Chip label={chipLabel} size="small" sx={chipStyle} />}
                              </Box>
                              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                {cleaned || 'No reason provided.'}
                              </Typography>
                            </Box>
                          </>
                        ) : (
                          <>
                            {isPostTicket ? (
                              <>
                                <Box
                                  sx={{
                                    p: 1.5,
                                    borderRadius: 2,
                                    border: '1px solid rgba(245,124,0,0.35)',
                                    bgcolor: 'rgba(245,124,0,0.08)',
                                  }}
                                >
                                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, flexWrap: 'wrap', mb: 0.5 }}>
                                    <Typography variant="overline" sx={{ color: '#E65100', fontWeight: 700, letterSpacing: 0.8 }}>
                                      POST REPORT TARGET
                                    </Typography>
                                    {post.eventId && post.timelineId && !(post.status === 'resolved' && post.resolution === 'delete') && (
                                      <Button
                                        variant="outlined"
                                        size="small"
                                        onClick={() => handleViewEvent(post)}
                                        sx={{
                                          borderRadius: '999px',
                                          px: 1.5,
                                          py: 0.25,
                                          minHeight: 28,
                                          textTransform: 'none',
                                          fontWeight: 600,
                                          borderColor: 'rgba(230,81,0,0.45)',
                                          color: '#BF360C',
                                          '&:hover': {
                                            borderColor: '#E65100',
                                            backgroundColor: 'rgba(230,81,0,0.08)',
                                          },
                                        }}
                                      >
                                        View Event
                                      </Button>
                                    )}
                                  </Box>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                    <Typography variant="body2"><strong>Timeline:</strong></Typography>
                                    {post.timelineId ? (
                                      <Typography
                                        component="a"
                                        href={`/timeline-v3/${post.timelineId}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        variant="body2"
                                        sx={{
                                          color: 'primary.main',
                                          textDecoration: 'none',
                                          fontWeight: 500,
                                          '&:hover': { textDecoration: 'underline' },
                                        }}
                                      >
                                        {getTimelineDisplayName(post.timelineName, post.timelineType)}
                                      </Typography>
                                    ) : (
                                      <Typography variant="body2">{getTimelineDisplayName(post.timelineName, post.timelineType)}</Typography>
                                    )}
                                    <Chip
                                      label={getTimelineTypeLabel(post.timelineType)}
                                      size="small"
                                      sx={{
                                        bgcolor: '#E8F1FF',
                                        color: '#1E40AF',
                                        fontWeight: 600,
                                        height: 22,
                                      }}
                                    />
                                    <Chip
                                      label={eventTypeDisplay.label}
                                      size="small"
                                      sx={{
                                        bgcolor: '#FFF3E0',
                                        color: '#E65100',
                                        fontWeight: 600,
                                        height: 22,
                                      }}
                                    />
                                  </Box>
                                </Box>

                                <Box
                                  sx={{
                                    p: 1.5,
                                    borderRadius: 2,
                                    bgcolor: 'transparent',
                                    border: '1px solid rgba(230,81,0,0.3)',
                                  }}
                                >
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 0.75 }}>
                                    <Typography variant="body2"><strong>Reason Reported</strong></Typography>
                                    {chipLabel && <Chip label={chipLabel} size="small" sx={chipStyle} />}
                                  </Box>
                                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                    {cleaned || 'No reason provided.'}
                                  </Typography>
                                </Box>
                              </>
                            ) : isTimelineTicket ? (
                              <>
                                <Box
                                  sx={{
                                    p: 1.5,
                                    borderRadius: 2,
                                    border: '1px solid rgba(46,125,50,0.35)',
                                    bgcolor: 'rgba(46,125,50,0.08)',
                                  }}
                                >
                                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, flexWrap: 'wrap', mb: 0.5 }}>
                                    <Typography variant="overline" sx={{ color: '#1B5E20', fontWeight: 700, letterSpacing: 0.8 }}>
                                      TIMELINE REPORT TARGET
                                    </Typography>
                                    {timelineTargetId && (
                                      <Button
                                        component="a"
                                        href={`/timeline-v3/${timelineTargetId}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        variant="outlined"
                                        size="small"
                                        sx={{
                                          borderRadius: '999px',
                                          px: 1.5,
                                          py: 0.25,
                                          minHeight: 28,
                                          textTransform: 'none',
                                          fontWeight: 600,
                                          borderColor: 'rgba(27,94,32,0.45)',
                                          color: '#1B5E20',
                                          '&:hover': {
                                            borderColor: '#2E7D32',
                                            backgroundColor: 'rgba(46,125,50,0.08)',
                                          },
                                        }}
                                      >
                                        View Timeline
                                      </Button>
                                    )}
                                  </Box>

                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                    <Typography variant="body2"><strong>Timeline:</strong></Typography>
                                    {timelineTargetId ? (
                                      <Typography
                                        component="a"
                                        href={`/timeline-v3/${timelineTargetId}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        variant="body2"
                                        sx={{
                                          color: 'primary.main',
                                          textDecoration: 'none',
                                          fontWeight: 500,
                                          '&:hover': { textDecoration: 'underline' },
                                        }}
                                      >
                                        {timelineTargetName}
                                      </Typography>
                                    ) : (
                                      <Typography variant="body2">{timelineTargetName}</Typography>
                                    )}
                                    <Chip
                                      label={timelineTargetType}
                                      size="small"
                                      sx={{
                                        bgcolor: '#E8F5E9',
                                        color: '#1B5E20',
                                        fontWeight: 600,
                                        height: 22,
                                      }}
                                    />
                                  </Box>
                                </Box>

                                <Box
                                  sx={{
                                    p: 1.5,
                                    borderRadius: 2,
                                    bgcolor: 'transparent',
                                    border: '1px solid rgba(27,94,32,0.3)',
                                  }}
                                >
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 0.75 }}>
                                    <Typography variant="body2"><strong>Reason Reported</strong></Typography>
                                    {chipLabel && <Chip label={chipLabel} size="small" sx={chipStyle} />}
                                  </Box>
                                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                    {cleaned || 'No reason provided.'}
                                  </Typography>
                                </Box>
                              </>
                            ) : (
                              <>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Typography variant="body2"><strong>Timeline:</strong></Typography>
                                  {post.timelineId ? (
                                    <Typography
                                      component="a"
                                      href={`/timeline-v3/${post.timelineId}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      variant="body2"
                                      sx={{
                                        color: 'primary.main',
                                        textDecoration: 'none',
                                        fontWeight: 500,
                                        '&:hover': { textDecoration: 'underline' },
                                      }}
                                    >
                                      {getTimelineDisplayName(post.timelineName, post.timelineType)}
                                    </Typography>
                                  ) : (
                                    <Typography variant="body2">{getTimelineDisplayName(post.timelineName, post.timelineType)}</Typography>
                                  )}
                                  <Chip
                                    label={getTimelineTypeLabel(post.timelineType)}
                                    size="small"
                                    sx={{
                                      bgcolor: '#E8F1FF',
                                      color: '#1E40AF',
                                      fontWeight: 600,
                                      height: 22,
                                    }}
                                  />
                                </Box>

                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                  <Typography variant="body2"><strong>Reason:</strong></Typography>
                                  {chipLabel && <Chip label={chipLabel} size="small" sx={chipStyle} />}
                                  <Typography variant="body2">{cleaned}</Typography>
                                </Box>
                              </>
                            )}
                          </>
                        )}
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
                        </Stack>
                      </Box>

                      {post.status === 'resolved' && verdictText && (
                        <Box
                          sx={{
                            p: 1.4,
                            borderRadius: 1.5,
                            border: '1px solid',
                            borderColor: 'divider',
                            backgroundColor: theme.palette.mode === 'dark'
                              ? 'rgba(255,255,255,0.02)'
                              : 'rgba(15,23,42,0.02)',
                            minHeight: '100%',
                          }}
                        >
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.35, fontWeight: 600 }}>
                            Verdict
                          </Typography>
                          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
                            {verdictText}
                          </Typography>
                        </Box>
                      )}
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minHeight: 24 }}>
                        <Typography variant="body2"><strong>Reporter:</strong></Typography>
                        {post.reporter?.avatar && (
                          <UserAvatar
                            name={post.reporter?.name || 'Reporter'}
                            avatarUrl={post.reporter?.avatar}
                            id={post.reporter?.id}
                            size={22}
                          />
                        )}
                        {post.reporter?.id ? (
                          <Typography
                            component="a"
                            href={`/profile/${post.reporter.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            variant="body2"
                            sx={{
                              color: 'primary.main',
                              textDecoration: 'none',
                              fontWeight: 500,
                              '&:hover': { textDecoration: 'underline' },
                            }}
                          >
                            {post.reporter?.name || 'Reporter'}
                          </Typography>
                        ) : (
                          <Typography variant="body2">{post.reporter?.name || 'Reporter'}</Typography>
                        )}
                      </Box>

                      {(post.status === 'reviewing' || post.status === 'resolved') && post.assignedModerator && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minHeight: 24 }}>
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

                      {post.status === 'resolved' && post.reportType === 'timeline' && post.resolution === 'issue_warning' && (post.warningIsActive !== false) && (
                        <Button
                          variant="outlined"
                          size="small"
                          color="warning"
                          onClick={() => handleLiftTimelineWarning(post)}
                          sx={{ ml: 1, mb: 1 }}
                        >
                          Lift Warning
                        </Button>
                      )}

                      {post.status === 'reviewing' && isPostTicket && (
                        <>
                          <Button
                            variant="outlined"
                            size="small"
                            color="primary"
                            startIcon={<CheckCircleIcon />}
                            onClick={() => handleOpenResolveEdit(post)}
                            sx={{ mr: 1, mb: 1 }}
                          >
                            Edit Ticket
                          </Button>
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
                            Delete Ticket
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

                      {post.status === 'reviewing' && post.reportType === 'timeline' && (
                        <>
                          <Button
                            variant="outlined"
                            size="small"
                            color="warning"
                            startIcon={<ShieldIcon />}
                            onClick={() => handleOpenPostActionDialog(post, 'issue_warning')}
                            sx={{ mr: 1, mb: 1 }}
                          >
                            Issue Warning
                          </Button>
                          <Button
                            variant="outlined"
                            size="small"
                            color="error"
                            startIcon={<CancelIcon />}
                            onClick={() => handleOpenPostActionDialog(post, 'ban_timeline')}
                            sx={{ mr: 1, mb: 1 }}
                          >
                            Ban Timeline
                          </Button>
                          <Button
                            variant="outlined"
                            size="small"
                            color="success"
                            startIcon={<CheckCircleIcon />}
                            onClick={() => handleOpenPostActionDialog(post, 'safeguard')}
                            sx={{ mb: 1 }}
                          >
                            Safeguard Timeline
                          </Button>
                        </>
                      )}

                      {post.status === 'reviewing' && post.reportType === 'user' && (
                        <>
                          <Button
                            variant="outlined"
                            size="small"
                            color="success"
                            startIcon={<CheckCircleIcon />}
                            onClick={() => handleOpenPostActionDialog(post, 'safeguard')}
                            sx={{ mr: 1, mb: 1 }}
                          >
                            Safeguard User
                          </Button>
                          <Button
                            variant="outlined"
                            size="small"
                            color="warning"
                            onClick={() => handleOpenUserModerationDialog(post, 'require_username_change')}
                            sx={{ mr: 1, mb: 1 }}
                          >
                            Require Username Change
                          </Button>
                          <Button
                            variant="outlined"
                            size="small"
                            color="info"
                            onClick={() => handleOpenUserModerationDialog(post, 'restrict_user')}
                            sx={{ mr: 1, mb: 1 }}
                          >
                            Temporary Restriction
                          </Button>
                          <Button
                            variant="outlined"
                            size="small"
                            color="error"
                            onClick={() => handleOpenUserModerationDialog(post, 'suspend_user')}
                            sx={{ mb: 1 }}
                          >
                            Suspend User
                          </Button>
                        </>
                      )}

                      {post.status === 'reviewing' && !isPostTicket && post.reportType !== 'user' && post.reportType !== 'timeline' && (
                        <Button
                          variant="outlined"
                          size="small"
                          color="success"
                          startIcon={<CheckCircleIcon />}
                          onClick={() => handleOpenPostActionDialog(post, 'safeguard')}
                          sx={{ mb: 1 }}
                        >
                          Safeguard Ticket
                        </Button>
                      )}

                      {post.status === 'resolved' && post.reportType === 'timeline' && post.resolution === 'ban_timeline' && isSiteOwner && (
                        <Button
                          variant="outlined"
                          size="small"
                          color="info"
                          onClick={() => handleUnbanTimeline(post)}
                          sx={{ ml: 1, mb: 1 }}
                        >
                          Unban Timeline (SiteOwner)
                        </Button>
                      )}

                      {!isPostTicket && post.eventId && post.timelineId && !(post.status === 'resolved' && post.resolution === 'delete') && (
                        <Button
                          onClick={() => handleViewEvent(post)}
                          variant="text"
                          size="small"
                          sx={{ ml: 1, mb: 1 }}
                        >
                          View Event
                        </Button>
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
          {actionDialogTitle}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="post-action-dialog-description">
            {actionDialogDescription}
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
            <>
              <FormControl fullWidth sx={{ mt: 2 }}>
                <InputLabel id="site-safeguard-days-label">Cooldown Duration</InputLabel>
                <Select
                  labelId="site-safeguard-days-label"
                  label="Cooldown Duration"
                  value={safeguardDays}
                  onChange={(e) => setSafeguardDays(String(e.target.value))}
                >
                  <MenuItem value="3">3 Days</MenuItem>
                  <MenuItem value="7">7 Days</MenuItem>
                  <MenuItem value="10">10 Days</MenuItem>
                </Select>
              </FormControl>
              {isSiteOwner && (
                <>
                  <FormControlLabel
                    sx={{ mt: 1 }}
                    control={(
                      <Checkbox
                        checked={safeguardUseCustomUntil}
                        onChange={(e) => setSafeguardUseCustomUntil(e.target.checked)}
                      />
                    )}
                    label="Use custom safe-until datetime (SiteOwner only)"
                  />
                  {safeguardUseCustomUntil && (
                    <TextField
                      fullWidth
                      type="datetime-local"
                      label="Safe Until (UTC)"
                      value={safeguardCustomUntil}
                      onChange={(e) => setSafeguardCustomUntil(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                      sx={{ mt: 1 }}
                    />
                  )}
                </>
              )}
              {isSelectedPostTicket && (
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
            </>
          )}

          {postActionType === 'issue_warning' && (
            <>
              <FormControl fullWidth sx={{ mt: 2 }}>
                <InputLabel id="site-warning-scope-label">Warning Scope</InputLabel>
                <Select
                  labelId="site-warning-scope-label"
                  label="Warning Scope"
                  value={warningScope}
                  onChange={(e) => setWarningScope(String(e.target.value))}
                >
                  <MenuItem value="general">General Warning</MenuItem>
                  <MenuItem value="action_cards">Action Cards</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth sx={{ mt: 2 }}>
                <InputLabel id="site-warning-days-label">Warning Duration</InputLabel>
                <Select
                  labelId="site-warning-days-label"
                  label="Warning Duration"
                  value={warningDays}
                  onChange={(e) => setWarningDays(String(e.target.value))}
                >
                  <MenuItem value="3">3 Days</MenuItem>
                  <MenuItem value="7">7 Days</MenuItem>
                  <MenuItem value="10">10 Days</MenuItem>
                </Select>
              </FormControl>
              <FormControlLabel
                sx={{ mt: 1 }}
                control={(
                  <Checkbox
                    checked={warningIndef}
                    onChange={(e) => {
                      setWarningIndef(e.target.checked);
                    }}
                  />
                )}
                label="INDEF (indefinite warning)"
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePostActionDialog} color="primary">
            Cancel
          </Button>
          <Button
            onClick={postActionType === 'delete' ? handleDeletePost : handleSubmitPostAction}
            color={postActionType === 'delete' || postActionType === 'ban_timeline' ? 'error' : postActionType === 'issue_warning' ? 'warning' : 'success'}
            variant="contained"
            startIcon={postActionType === 'delete' || postActionType === 'ban_timeline' ? <CancelIcon /> : <CheckCircleIcon />}
            disabled={
              !actionVerdict.trim()
              || (postActionType === 'safeguard' && isSiteOwner && safeguardUseCustomUntil && !safeguardCustomUntil)
            }
          >
            {postActionType === 'delete'
              ? 'Delete Post'
              : postActionType === 'issue_warning'
                ? 'Issue Warning'
                : postActionType === 'ban_timeline'
                  ? 'Ban Timeline'
                  : `Safeguard ${selectedTypeLabel}`}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={userModerationDialogOpen}
        onClose={handleCloseUserModerationDialog}
        aria-labelledby="user-moderation-dialog-title"
      >
        <DialogTitle id="user-moderation-dialog-title">
          {userModerationAction === 'require_username_change'
            ? 'Require Username Change?'
            : userModerationAction === 'restrict_user'
              ? 'Apply Temporary Restriction?'
              : 'Suspend User?'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            {userModerationAction === 'require_username_change'
              ? 'This resolves the ticket and requires the user to change their username before they can continue normal usage.'
              : userModerationAction === 'restrict_user'
                ? 'This resolves the ticket and blocks posting/reporting until the specified UTC datetime.'
                : 'This resolves the ticket and suspends the account. Temporary suspension requires an end datetime.'}
          </DialogContentText>

          {userModerationAction === 'require_username_change' && (
            <FormControlLabel
              sx={{ mb: 1 }}
              control={(
                <Checkbox
                  checked={blockCurrentUsername}
                  onChange={(e) => setBlockCurrentUsername(e.target.checked)}
                />
              )}
              label="Add current username to blocklist"
            />
          )}

          {userModerationAction === 'restrict_user' && (
            <TextField
              fullWidth
              type="datetime-local"
              label="Restriction End (UTC)"
              value={restrictionUntil}
              onChange={(e) => setRestrictionUntil(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ mb: 2 }}
            />
          )}

          {userModerationAction === 'suspend_user' && (
            <>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel id="suspend-type-label">Suspend Type</InputLabel>
                <Select
                  labelId="suspend-type-label"
                  label="Suspend Type"
                  value={suspendType}
                  onChange={(e) => setSuspendType(e.target.value)}
                >
                  <MenuItem value="permanent">Permanent</MenuItem>
                  <MenuItem value="temporary">Temporary</MenuItem>
                </Select>
              </FormControl>
              {suspendType === 'temporary' && (
                <TextField
                  fullWidth
                  type="datetime-local"
                  label="Suspension End (UTC)"
                  value={suspendUntil}
                  onChange={(e) => setSuspendUntil(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  sx={{ mb: 2 }}
                />
              )}
            </>
          )}

          <TextField
            fullWidth
            multiline
            minRows={3}
            label="Verdict (required)"
            placeholder="Write your findings and rationale"
            value={userModerationVerdict}
            onChange={(e) => setUserModerationVerdict(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseUserModerationDialog}>Cancel</Button>
          <Button
            onClick={handleSubmitUserModeration}
            variant="contained"
            color={userModerationAction === 'suspend_user' ? 'error' : 'primary'}
            disabled={
              !userModerationVerdict.trim()
              || userModerationSubmitting
              || (userModerationAction === 'restrict_user' && !restrictionUntil)
              || (userModerationAction === 'suspend_user' && suspendType === 'temporary' && !suspendUntil)
            }
          >
            {userModerationSubmitting ? 'Applying…' : 'Resolve Ticket'}
          </Button>
        </DialogActions>
      </Dialog>

      <EventDialog
        open={editDialogOpen}
        onClose={handleCloseResolveEdit}
        onSave={handleResolveEditSubmit}
        initialEvent={editDialogEvent}
        timelineName={editDialogEvent?.timeline_name || editDialogEvent?.timelineName}
        timelineType={editDialogEvent?.timeline_type || editDialogEvent?.timelineType}
        submitLabel="Resolve Ticket"
        showVerdictField
        verdict={editDialogVerdict}
        onVerdictChange={setEditDialogVerdict}
        submitDisabled={editDialogSubmitting}
      />

      <Dialog
        open={removeDialogOpen}
        onClose={handleCloseRemoveDialog}
        aria-labelledby="remove-dialog-title"
      >
        <DialogTitle id="remove-dialog-title">Remove from Timeline</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            This removes the event from the current timeline only. It is allowed only when the event still has another placement (another timeline or qualifying tag context). If this is the only remaining placement, removal is blocked and you should use Delete Ticket for full removal.
          </DialogContentText>
          <DialogContentText sx={{ mb: 2 }}>
            Please enter your moderation verdict. This verdict will be saved on the ticket.
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
  const theme = useTheme();
  const [leadSentence, setLeadSentence] = useState('');
  const [rotatorItems, setRotatorItems] = useState([]);
  const [rotationIntervalMs, setRotationIntervalMs] = useState(3000);
  const [randomizeEndings, setRandomizeEndings] = useState(false);
  const [badgeText, setBadgeText] = useState('');
  const [badgeEnabled, setBadgeEnabled] = useState(true);
  const [toolbarLedMessage, setToolbarLedMessage] = useState('');
  const [toolbarLedEnabled, setToolbarLedEnabled] = useState(false);
  const [toolbarLedRandomStart, setToolbarLedRandomStart] = useState(true);
  const [toolbarLedStartDelaySeconds, setToolbarLedStartDelaySeconds] = useState(45);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [loadingBadgeSettings, setLoadingBadgeSettings] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSavedState, setShowSavedState] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');

  const loadLandingSettings = useCallback(async () => {
    try {
      setLoadingSettings(true);
      const data = await getLandingRotatorSettings();
      const settings = data?.landing_rotator || {};
      setLeadSentence(settings.lead_sentence || '');
      setRotatorItems(Array.isArray(settings.endings) ? settings.endings : []);
      setRotationIntervalMs(Number(settings.rotation_interval_ms) || 3000);
      setRandomizeEndings(Boolean(settings.randomize));
      setBadgeText(settings.badge_text || '');
      setBadgeEnabled(Boolean(settings.badge_enabled));
      setToolbarLedMessage(settings.toolbar_led_message || '');
      setToolbarLedEnabled(Boolean(settings.toolbar_led_enabled));
      setToolbarLedRandomStart(Boolean(settings.toolbar_led_random_start));
      setToolbarLedStartDelaySeconds(Number(settings.toolbar_led_start_delay_seconds) || 45);
      setHasUnsavedChanges(false);
    } catch (error) {
      setSnackbarMessage(error?.response?.data?.error || 'Failed to load landing rotator settings');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setLoadingSettings(false);
    }
  }, []);

  useEffect(() => {
    if (canManageSettings) {
      loadLandingSettings();
    }
  }, [canManageSettings, loadLandingSettings]);

  const refreshLandingBadgeSettings = useCallback(async () => {
    try {
      setLoadingBadgeSettings(true);
      const data = await getLandingRotatorSettings();
      const settings = data?.landing_rotator || {};
      setBadgeText(settings.badge_text || '');
      setBadgeEnabled(Boolean(settings.badge_enabled));
      setSnackbarMessage('Landing badge settings refreshed');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (error) {
      // Requested fallback: if badge refresh fails, reset to disabled/empty so owner can explicitly save this safe state.
      setBadgeText('');
      setBadgeEnabled(false);
      setHasUnsavedChanges(true);
      setSnackbarMessage('Landing badge refresh failed. Fallback applied: badge disabled and text cleared. Save to persist.');
      setSnackbarSeverity('warning');
      setSnackbarOpen(true);
    } finally {
      setLoadingBadgeSettings(false);
    }
  }, []);

  const handleRotatorItemChange = (index, value) => {
    setRotatorItems((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
    setHasUnsavedChanges(true);
  };

  const handleAddRotatorItem = () => {
    setRotatorItems((prev) => [...prev, '']);
    setHasUnsavedChanges(true);
  };

  const handleRemoveRotatorItem = (index) => {
    setRotatorItems((prev) => prev.filter((_item, idx) => idx !== index));
    setHasUnsavedChanges(true);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setShowSavedState(false);
      const payload = {
        lead_sentence: leadSentence,
        endings: rotatorItems,
        rotation_interval_ms: rotationIntervalMs,
        randomize: randomizeEndings,
        badge_text: badgeText,
        badge_enabled: badgeEnabled,
        toolbar_led_message: toolbarLedMessage,
        toolbar_led_enabled: toolbarLedEnabled,
        toolbar_led_random_start: toolbarLedRandomStart,
        toolbar_led_start_delay_seconds: toolbarLedStartDelaySeconds,
      };
      const response = await updateLandingRotatorSettings(payload);
      const settings = response?.landing_rotator || {};
      setLeadSentence(settings.lead_sentence || '');
      setRotatorItems(Array.isArray(settings.endings) ? settings.endings : []);
      setRotationIntervalMs(Number(settings.rotation_interval_ms) || 3000);
      setRandomizeEndings(Boolean(settings.randomize));
      setBadgeText(settings.badge_text || '');
      setBadgeEnabled(Boolean(settings.badge_enabled));
      setToolbarLedMessage(settings.toolbar_led_message || '');
      setToolbarLedEnabled(Boolean(settings.toolbar_led_enabled));
      setToolbarLedRandomStart(Boolean(settings.toolbar_led_random_start));
      setToolbarLedStartDelaySeconds(Number(settings.toolbar_led_start_delay_seconds) || 45);
      setHasUnsavedChanges(false);
      setShowSavedState(true);
      setSnackbarMessage('Landing rotator settings saved');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      setTimeout(() => setShowSavedState(false), 2000);
    } catch (error) {
      setSnackbarMessage(error?.response?.data?.error || 'Failed to save landing rotator settings');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setIsSaving(false);
    }
  };

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
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="h6">Landing Badge</Typography>
              <IconButton
                size="small"
                onClick={refreshLandingBadgeSettings}
                disabled={loadingSettings || loadingBadgeSettings}
                sx={{
                  color: 'primary.main',
                  '&:hover': { bgcolor: 'primary.main', color: 'white' }
                }}
              >
                {loadingBadgeSettings ? <CircularProgress size={18} color="inherit" /> : <RefreshIcon sx={{ fontSize: 18 }} />}
              </IconButton>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Controls the comic badge message attached to the landing page title.
            </Typography>
            <Stack spacing={1.5}>
              <TextField
                label="Badge Text"
                placeholder="Not Yet Available, Seeking Funding!"
                fullWidth
                value={badgeText}
                onChange={(e) => {
                  setBadgeText(e.target.value);
                  setHasUnsavedChanges(true);
                }}
                disabled={loadingSettings || loadingBadgeSettings}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={badgeEnabled}
                    onChange={(e) => {
                      setBadgeEnabled(e.target.checked);
                      setHasUnsavedChanges(true);
                    }}
                    color="primary"
                    disabled={loadingSettings || loadingBadgeSettings}
                  />
                }
                label="Show landing badge"
              />
            </Stack>
          </Paper>
          <Paper sx={{ p: 3 }} elevation={2}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="h6">Landing Page Text Rotator</Typography>
              <IconButton
                size="small"
                onClick={loadLandingSettings}
                disabled={loadingSettings}
                sx={{
                  color: 'primary.main',
                  '&:hover': { bgcolor: 'primary.main', color: 'white' }
                }}
              >
                <RefreshIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Configure the rotating hero text shown on the landing page. Leave the rotator list empty to display only the lead sentence.
            </Typography>
            <Stack spacing={2}>
              <TextField
                label="Lead Sentence"
                placeholder="Create personal timelines or entire communities to keep track of..."
                fullWidth
                value={leadSentence}
                onChange={(e) => {
                  setLeadSentence(e.target.value);
                  setHasUnsavedChanges(true);
                }}
                disabled={loadingSettings}
              />
              <TextField
                label="Rotation Interval (ms)"
                placeholder="3000"
                type="number"
                fullWidth
                value={rotationIntervalMs}
                onChange={(e) => {
                  setRotationIntervalMs(Number(e.target.value) || 0);
                  setHasUnsavedChanges(true);
                }}
                helperText="Default is 3000ms. Leave as-is if you like the current pacing."
                disabled={loadingSettings}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={randomizeEndings}
                    onChange={(e) => {
                      setRandomizeEndings(e.target.checked);
                      setHasUnsavedChanges(true);
                    }}
                    color="primary"
                    disabled={loadingSettings}
                  />
                }
                label="Randomize ending order"
              />
              <Typography variant="caption" color="text.secondary" sx={{ mt: -1 }}>
                When enabled, endings appear in random order instead of sequential rotation.
              </Typography>
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="subtitle1">Rotating Endings</Typography>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={handleAddRotatorItem}
                    disabled={loadingSettings}
                  >
                    Add Row
                  </Button>
                </Box>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ width: '70%' }}>Text</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rotatorItems.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={2} sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
                          No rotating endings yet. Add a row to start rotating phrases.
                        </TableCell>
                      </TableRow>
                    ) : (
                      rotatorItems.map((item, index) => (
                        <TableRow key={`rotator-row-${index}`}>
                          <TableCell>
                            <TextField
                              fullWidth
                              placeholder="Enter rotator text"
                              value={item}
                              onChange={(e) => handleRotatorItemChange(index, e.target.value)}
                              disabled={loadingSettings}
                              variant="standard"
                            />
                          </TableCell>
                          <TableCell align="right">
                            <IconButton
                              size="small"
                              onClick={() => handleRemoveRotatorItem(index)}
                              disabled={loadingSettings}
                              sx={{ color: theme.palette.error.main }}
                            >
                              <DeleteOutlineIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </Box>
            </Stack>
          </Paper>

          <Paper sx={{ p: 3 }} elevation={2}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="h6">Toolbar LED Banner</Typography>
              <FormControlLabel
                sx={{ mr: 0 }}
                control={
                  <Switch
                    checked={toolbarLedEnabled}
                    onChange={(e) => {
                      setToolbarLedEnabled(e.target.checked);
                      setHasUnsavedChanges(true);
                    }}
                    color="primary"
                    disabled={loadingSettings}
                  />
                }
                label="Enabled"
              />
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Configure the surprise LED message that scrolls right-to-left across the top toolbar.
            </Typography>
            <Stack spacing={2}>
              <TextField
                label="Banner Message"
                placeholder="Enter LED banner message"
                fullWidth
                value={toolbarLedMessage}
                onChange={(e) => {
                  setToolbarLedMessage(e.target.value);
                  setHasUnsavedChanges(true);
                }}
                disabled={loadingSettings}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={toolbarLedRandomStart}
                    onChange={(e) => {
                      setToolbarLedRandomStart(e.target.checked);
                      setHasUnsavedChanges(true);
                    }}
                    color="primary"
                    disabled={loadingSettings || !toolbarLedEnabled}
                  />
                }
                label="Random start (between 5 and 30 minutes)"
              />
              {!toolbarLedRandomStart && (
                <TextField
                  label="Manual Start Delay (seconds)"
                  placeholder="e.g. 45"
                  type="number"
                  fullWidth
                  value={toolbarLedStartDelaySeconds}
                  onChange={(e) => {
                    setToolbarLedStartDelaySeconds(Number(e.target.value) || 0);
                    setHasUnsavedChanges(true);
                  }}
                  helperText="Example: 240 = 4 minutes"
                  disabled={loadingSettings || !toolbarLedEnabled}
                />
              )}
            </Stack>
          </Paper>
        </Stack>
      )}

      <Portal>
        <AnimatePresence>
          {canManageSettings && (hasUnsavedChanges || showSavedState) && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{
                opacity: 1,
                scale: 1,
                y: showSavedState ? 10 : 0,
                transition: { type: 'spring', stiffness: 300, damping: 25 }
              }}
              exit={{
                opacity: 0,
                scale: 0.8,
                y: 40,
                transition: { duration: 0.3 }
              }}
              style={{
                position: 'fixed',
                bottom: '2rem',
                right: '2rem',
                zIndex: 1400,
              }}
            >
              <Button
                variant="contained"
                color={showSavedState ? 'success' : 'primary'}
                onClick={handleSave}
                disabled={isSaving || showSavedState}
                startIcon={showSavedState ? <CheckCircleIcon /> : isSaving ? null : <SaveIcon />}
                sx={{
                  borderRadius: '28px',
                  padding: '12px 24px',
                  boxShadow: showSavedState
                    ? '0 8px 16px rgba(76, 175, 80, 0.3)'
                    : '0 8px 16px rgba(0,0,0,0.2)',
                  '&:hover': {
                    boxShadow: showSavedState
                      ? '0 8px 16px rgba(76, 175, 80, 0.3)'
                      : '0 12px 20px rgba(0,0,0,0.3)',
                  },
                  '&.Mui-disabled': {
                    color: 'white',
                    opacity: showSavedState ? 1 : 0.7
                  },
                  transition: 'all 0.3s ease'
                }}
              >
                {showSavedState ? 'SAVED!' : isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </Portal>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert onClose={() => setSnackbarOpen(false)} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
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
            {tabValue === 1 && <AdminListTab canManage={canManageSettings} />}
            {tabValue === 2 && <SiteSettingsTab canManageSettings={canManageSettings} />}
          </Box>
        </Paper>
      </Box>
    </>
  );
};

export default SiteControlPage;
