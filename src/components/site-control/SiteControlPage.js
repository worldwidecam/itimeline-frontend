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
  alpha,
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
import { getTimelineSurfaceTheme } from '../timeline-v3/timelineSurfaceTheme';
import api, {
  addSiteAdmin,
  listSiteAdmins,
  removeSiteAdmin,
  listSiteReports,
  acceptSiteReport,
  resolveSiteReport,
  getEventPlacements,
  unbanTimelineFromReport,
  liftTimelineWarningFromReport,
  liftUserRestrictionFromReport,
  liftUserUnbanFromReport,
  getLandingRotatorSettings,
  updateLandingRotatorSettings,
  listBrokenEventQueue,
  addBrokenEventQueueItem,
  deleteBrokenEventById,
  listBanList,
  listWebsiteUsers,
} from '../../utils/api';
import UserAvatar from '../common/UserAvatar';
import EventPopup from '../timeline-v3/events/EventPopup';
import EventDialog from '../timeline-v3/events/EventDialog';
import TimelineListTab from './TimelineListTab';
import SiteControlLockView from './SiteControlLockView';
import { displayUsername } from '../../utils/usernameDisplay';
import {
  getGlassDialogPaperSx,
  getGlassInputSx,
  getGlassSquareActionButtonSx,
  getGlassPillActionButtonSx,
} from '../../utils/formStyleGuide';

const getReportTypeLabel = (reportType) => {
  const type = (reportType || '').toLowerCase();
  if (type === 'timeline') return 'Timeline';
  if (type === 'user') return 'User';
  if (type === 'post') return 'Post';
  return reportType || 'Post';
};

const SITE_SETTINGS_SECTIONS = [
  { key: 'home-hero', label: 'Home Hero Banner' },
  { key: 'landing-badge', label: 'Landing Badge' },
  { key: 'landing-rotator', label: 'Landing Rotator Text' },
  { key: 'toolbar-led', label: 'Toolbar LED Banner' },
];

const HOME_HERO_TEMPLATE_OPTIONS = [
  { type: 'welcome', label: 'Welcome Banner' },
  { type: 'timeline_spotlight', label: 'Random Timeline' },
  { type: 'trending_community', label: 'Trending Community' },
  { type: 'event_spotlight', label: 'Event Spotlight' },
  { type: 'advertisement', label: 'Advertisement' },
];

const HOME_HERO_DEFAULT_INTERVAL_MS = 75000;

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
  const theme = useTheme();
  const timelineSurfaces = getTimelineSurfaceTheme(theme);
  const { user: currentUser } = useAuth();
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
      const sorted = (Array.isArray(data?.items) ? data.items : []).sort((a, b) => {
        if (a.role === 'SiteOwner' && b.role !== 'SiteOwner') return -1;
        if (a.role !== 'SiteOwner' && b.role === 'SiteOwner') return 1;
        return Number(a.user_id) - Number(b.user_id);
      });
      setAdmins(sorted);
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

  const getRoleChipProps = (role) => {
    if (role === 'SiteOwner') {
      return {
        label: 'SITE OWNER',
        sx: { 
          bgcolor: '#2e7d32', 
          color: '#fff', 
          fontWeight: 800,
          px: 1,
          boxShadow: '0 2px 10px rgba(46, 125, 50, 0.3)',
          letterSpacing: '0.5px'
        }
      };
    }
    return {
      label: 'SITE ADMIN',
      sx: { 
        bgcolor: '#1565c0', 
        color: '#fff', 
        fontWeight: 700,
        px: 1,
        boxShadow: '0 2px 10px rgba(21, 101, 192, 0.3)',
        letterSpacing: '0.5px'
      }
    };
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Paper 
        sx={{ 
          p: 4, 
          borderRadius: 4,
          background: timelineSurfaces.panel,
          backdropFilter: timelineSurfaces.panelBlur,
          border: `1px solid ${timelineSurfaces.panelBorder}`,
        }} 
        elevation={0}
      >
        <Typography variant="h5" sx={{ mb: 1, fontWeight: 800 }}>Site Authority</Typography>
        <Typography variant="body2" sx={{ mb: 4, opacity: 0.7 }}>
          Managed hierarchy of system administrators with global platform access.
        </Typography>

        {canManage && (
          <Box sx={{ mb: 5, p: 3, bgcolor: 'rgba(0,0,0,0.1)', borderRadius: 3, border: '1px solid rgba(255,255,255,0.05)' }}>
            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.8 }}>
              Elevate User to Admin
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
              <TextField
                label="Identifier"
                placeholder="Username, Email, or User ID"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                variant="outlined"
                fullWidth
                size="medium"
                sx={getGlassInputSx(theme)}
              />
              <Button
                variant="contained"
                onClick={handleAddAdmin}
                disabled={actionLoading}
                sx={{ 
                  ...getGlassSquareActionButtonSx(theme),
                  minWidth: 160, 
                  py: 1.5,
                }}
              >
                {actionLoading ? <CircularProgress size={24} color="inherit" /> : 'Grant Access'}
              </Button>
            </Stack>
          </Box>
        )}

        {loading && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 8, gap: 2 }}>
            <CircularProgress size={40} thickness={4} sx={{ color: '#1565c0' }} />
            <Typography variant="body2" sx={{ opacity: 0.6 }}>Loading authority list...</Typography>
          </Box>
        )}

        {!loading && error && (
          <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>
        )}

        {!loading && !error && admins.length === 0 && (
          <Box sx={{ py: 6, textAlign: 'center', opacity: 0.5 }}>
            <Typography variant="h6">No system admins found.</Typography>
          </Box>
        )}

        {!loading && !error && admins.length > 0 && (
          <Stack spacing={2}>
            <AnimatePresence mode="popLayout">
              {admins.map((admin) => {
                const isYou = Number(admin.user_id) === Number(currentUser?.id);
                const chipProps = getRoleChipProps(admin.role);

                return (
                  <motion.div
                    key={admin.user_id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    layout
                  >
                    <Paper
                      variant="outlined"
                      sx={{ 
                        p: 2.5, 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between', 
                        gap: 2,
                        borderRadius: 3,
                        background: timelineSurfaces.panel,
                        border: `1px solid ${timelineSurfaces.panelBorder}`,
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          background: alpha(timelineSurfaces.panel, 0.8),
                          transform: 'translateY(-2px)',
                          boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                        }
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
                        <UserAvatar
                          name={admin.username || 'Admin'}
                          avatarUrl={admin.avatar_url}
                          id={admin.user_id}
                          size={44}
                          userColor={admin.user_color}
                          isRestricted={admin.is_restricted || admin.isRestricted}
                          isSuspended={admin.is_suspended || admin.isSuspended}
                          isAvatarBlurred={admin.is_avatar_blurred || admin.isAvatarBlurred}
                        />
                        <Box>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                              {displayUsername(admin.username) || `User ${admin.user_id}`}
                            </Typography>
                            {isYou && (
                              <Chip 
                                label="YOU" 
                                size="small" 
                                sx={{ 
                                  height: 18, 
                                  fontSize: '0.65rem', 
                                  fontWeight: 900,
                                  bgcolor: 'rgba(255,255,255,0.1)',
                                  color: 'rgba(255,255,255,0.8)',
                                  border: '1px solid rgba(255,255,255,0.2)'
                                }} 
                              />
                            )}
                          </Stack>
                          <Typography variant="body2" sx={{ opacity: 0.6, fontSize: '0.85rem' }}>
                            ID: {admin.user_id} • {admin.email || 'No email provided'}
                          </Typography>
                        </Box>
                      </Box>
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Chip {...chipProps} />
                        {canManage && admin.role !== 'SiteOwner' && (
                          <Button
                            variant="outlined"
                            color="error"
                            size="small"
                            onClick={() => setRemoveTarget(admin)}
                            sx={{ 
                              borderRadius: '8px', 
                              fontWeight: 700,
                              borderWidth: '2px',
                              '&:hover': { borderWidth: '2px' }
                            }}
                          >
                            Revoke
                          </Button>
                        )}
                      </Stack>
                    </Paper>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </Stack>
        )}
      </Paper>
      <Dialog open={Boolean(removeTarget)} onClose={() => setRemoveTarget(null)}>
        <DialogTitle>Remove Site Admin?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Remove {displayUsername(removeTarget?.username) || `User ${removeTarget?.user_id}`} from site admins?
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

const LOGS_SECTIONS = [
  { key: 'broken-events', label: 'Broken Events' },
  { key: 'ban-list', label: 'Ban List' },
  { key: 'user-list', label: 'User List' },
  { key: 'timeline-list', label: 'Timeline List' },
];

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

const UserListTab = () => {
  const theme = useTheme();
  const timelineSurfaces = getTimelineSurfaceTheme(theme);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const fetchUsers = useCallback(async (pageNum = 1) => {
    try {
      setLoading(true);
      setError('');
      const response = await listWebsiteUsers(pageNum, 50);
      
      if (pageNum === 1) {
        setUsers(response?.data || []);
      } else {
        setUsers(prev => [...prev, ...(response?.data || [])]);
      }
      
      setHasMore(Boolean(response?.next_cursor));
      setPage(pageNum);
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to load user list');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers(1);
  }, [fetchUsers]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" sx={{ fontWeight: 800 }}>Website Users</Typography>
        <Button 
          variant="outlined" 
          startIcon={<RefreshIcon />}
          onClick={() => fetchUsers(1)}
          disabled={loading}
          size="small"
          sx={getGlassSquareActionButtonSx(theme)}
        >
          Refresh
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>
      )}

      <Paper 
        sx={{ 
          borderRadius: 3, 
          overflow: 'hidden',
          background: timelineSurfaces.panel,
          border: `1px solid ${timelineSurfaces.panelBorder}`,
          backdropFilter: timelineSurfaces.panelBlur,
        }} 
        elevation={0}
      >
        <Box sx={{ overflowX: 'auto' }}>
          <Table size="medium">
            <TableHead>
              <TableRow sx={{ bgcolor: 'rgba(0,0,0,0.1)' }}>
                <TableCell sx={{ fontWeight: 800, width: '10%' }}>User ID</TableCell>
                <TableCell sx={{ fontWeight: 800, width: '40%' }}>User Info</TableCell>
                <TableCell sx={{ fontWeight: 800, width: '25%' }}>Email</TableCell>
                <TableCell sx={{ fontWeight: 800, width: '25%', textAlign: 'right' }}>Storage Usage</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id} hover sx={{ '&:last-child td': { border: 0 } }}>
                  <TableCell sx={{ fontFamily: 'monospace', fontWeight: 600, opacity: 0.7 }}>
                    #{u.id}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <UserAvatar
                        name={u.username}
                        avatarUrl={u.avatar_url}
                        id={u.id}
                        size={36}
                        userColor={u.user_color}
                      />
                      <Box>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            fontWeight: 700,
                            cursor: 'pointer',
                            '&:hover': { color: 'primary.main', textDecoration: 'underline' }
                          }}
                          onClick={() => window.open(`/profile/${u.id}`, '_blank')}
                        >
                          {displayUsername(u.username)}
                        </Typography>
                        {u.display_username && u.display_username !== u.username && (
                          <Typography variant="caption" sx={{ opacity: 0.6 }}>
                            @{u.username}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ opacity: 0.8 }}>
                      {u.email}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ textAlign: 'right' }}>
                    <Chip 
                      label={formatBytes(u.total_storage_bytes)} 
                      size="small"
                      color={u.total_storage_bytes > 50 * 1024 * 1024 ? "warning" : "default"}
                      variant={u.total_storage_bytes > 0 ? "filled" : "outlined"}
                      sx={{ 
                        fontWeight: 700, 
                        fontFamily: 'monospace',
                        letterSpacing: '0.5px'
                      }}
                    />
                  </TableCell>
                </TableRow>
              ))}
              
              {!loading && users.length === 0 && !error && (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 6, opacity: 0.5 }}>
                    <Typography variant="body1">No users found.</Typography>
                  </TableCell>
                </TableRow>
              )}
              
              {loading && users.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 6 }}>
                    <CircularProgress size={32} />
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Box>
      </Paper>
      
      {hasMore && (
        <Box sx={{ display: 'flex', justifyContent: 'center', pt: 2, pb: 4 }}>
          <Button 
            variant="outlined" 
            onClick={() => fetchUsers(page + 1)}
            disabled={loading}
            sx={{ ...getGlassSquareActionButtonSx(theme), borderRadius: 8, px: 4 }}
          >
            {loading ? 'Loading...' : 'Load More'}
          </Button>
        </Box>
      )}
    </Box>
  );
};

const LogsTab = () => {
  const theme = useTheme();
  const timelineSurfaces = getTimelineSurfaceTheme(theme);
  const [logsSection, setLogsSection] = useState('broken-events');

  return (
    <Box sx={{ mt: 1.5 }}>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '240px minmax(0, 1fr)' },
          gap: 2,
          alignItems: 'start',
        }}
      >
        <Paper 
          sx={{ 
            p: 1.5, 
            height: 'fit-content',
            borderRadius: 3,
            background: timelineSurfaces.panel,
            border: `1px solid ${timelineSurfaces.panelBorder}`,
            backdropFilter: timelineSurfaces.panelBlur,
          }} 
          elevation={0}
        >
          <Tabs
            value={logsSection}
            onChange={(_event, nextValue) => setLogsSection(nextValue)}
            orientation="vertical"
            variant="scrollable"
            sx={{
              '& .MuiTabs-indicator': {
                left: 0,
                right: 'auto',
                width: 4,
                borderRadius: 2,
                bgcolor: 'primary.main',
              },
              '& .MuiTab-root': {
                borderRadius: 1.5,
                mb: 0.5,
                transition: 'all 0.2s ease',
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 0.05)',
                },
                '&.Mui-selected': {
                  bgcolor: 'rgba(33, 150, 243, 0.1)',
                }
              }
            }}
          >
            {LOGS_SECTIONS.map((section) => (
              <Tab
                key={section.key}
                value={section.key}
                label={section.label}
                sx={{
                  alignItems: 'flex-start',
                  textAlign: 'left',
                  textTransform: 'none',
                  fontSize: '0.9rem',
                  fontWeight: logsSection === section.key ? 800 : 500,
                  minHeight: 44,
                  py: 1,
                  px: 2,
                }}
              />
            ))}
          </Tabs>
        </Paper>

        <Box>
          {logsSection === 'broken-events' ? <BrokenEventsTab /> : null}
          {logsSection === 'ban-list' ? <BanListTab /> : null}
          {logsSection === 'user-list' ? <UserListTab /> : null}
          {logsSection === 'timeline-list' ? <TimelineListTab /> : null}
        </Box>
      </Box>
    </Box>
  );
};

const BrokenEventsTab = () => {
  const theme = useTheme();
  const timelineSurfaces = getTimelineSurfaceTheme(theme);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingByKey, setActionLoadingByKey] = useState({});
  const [eventIdInput, setEventIdInput] = useState('');
  const [noteInput, setNoteInput] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [eventPopupOpen, setEventPopupOpen] = useState(false);
  const [popupEvent, setPopupEvent] = useState(null);

  const showSnackbar = useCallback((severity, message) => {
    setSnackbarSeverity(severity);
    setSnackbarMessage(message);
    setSnackbarOpen(true);
  }, []);

  const fetchQueue = useCallback(async () => {
    try {
      setLoading(true);
      const data = await listBrokenEventQueue();
      setItems(Array.isArray(data?.items) ? data.items : []);
    } catch (error) {
      setItems([]);
      showSnackbar('error', error?.response?.data?.error || 'Failed to load broken event queue');
    } finally {
      setLoading(false);
    }
  }, [showSnackbar]);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  const setBusy = (key, busy) => {
    setActionLoadingByKey((prev) => ({ ...prev, [key]: busy }));
  };

  const formatTimestamp = (value) => {
    if (!value) return 'Unknown';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Unknown';
    return date.toLocaleString();
  };

  const handleAddQueueItem = async () => {
    const parsed = Number(eventIdInput);
    if (!(Number.isInteger(parsed) && parsed > 0)) {
      showSnackbar('warning', 'Enter a valid positive event ID');
      return;
    }

    try {
      setBusy('add', true);
      await addBrokenEventQueueItem(parsed, noteInput);
      setEventIdInput('');
      setNoteInput('');
      showSnackbar('success', `Queued event #${parsed}`);
      await fetchQueue();
    } catch (error) {
      showSnackbar('error', error?.response?.data?.error || 'Failed to queue event');
    } finally {
      setBusy('add', false);
    }
  };

  const handleRemoveQueueItem = async (queueId) => {
    try {
      setBusy(`remove-${queueId}`, true);
      await removeBrokenEventQueueItem(queueId);
      showSnackbar('success', 'Queue item removed');
      await fetchQueue();
    } catch (error) {
      showSnackbar('error', error?.response?.data?.error || 'Failed to remove queue item');
    } finally {
      setBusy(`remove-${queueId}`, false);
    }
  };

  const handleDeleteEvent = async (eventId) => {
    try {
      setBusy(`delete-${eventId}`, true);
      await deleteBrokenEventById(eventId, false);
      showSnackbar('success', `Deleted event #${eventId} and kept a historical log entry`);
      await fetchQueue();
    } catch (error) {
      showSnackbar('error', error?.response?.data?.error || 'Failed to delete event');
    } finally {
      setBusy(`delete-${eventId}`, false);
    }
  };

  const handleOpenEvent = async (timelineId, eventId) => {
    if (!(timelineId > 0) || !(eventId > 0)) {
      showSnackbar('warning', 'Missing timeline or event identifier');
      return;
    }

    try {
      setBusy(`open-${eventId}`, true);
      const response = await api.get(`/api/v1/events/${eventId}`);
      const fetchedEvent = response?.data;
      if (!fetchedEvent?.id) {
        showSnackbar('error', 'Event payload is missing or invalid');
        return;
      }

      setPopupEvent(fetchedEvent);
      setEventPopupOpen(true);
    } catch (error) {
      showSnackbar('error', error?.response?.data?.error || 'Failed to open event');
    } finally {
      setBusy(`open-${eventId}`, false);
    }
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Paper 
        sx={{ 
          p: 4, 
          borderRadius: 4,
          background: timelineSurfaces.panel,
          border: `1px solid ${timelineSurfaces.panelBorder}`,
          backdropFilter: timelineSurfaces.panelBlur,
        }} 
        elevation={0}
      >
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} justifyContent="space-between" alignItems={{ xs: 'stretch', md: 'center' }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800 }}>Broken Events Queue</Typography>
            <Typography variant="body2" sx={{ mt: 0.5, opacity: 0.7 }}>
              Queue suspicious/broken event IDs. Open their timeline, delete if needed, or remove from queue.
            </Typography>
          </Box>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={fetchQueue} disabled={loading || !!actionLoadingByKey.add} sx={getGlassSquareActionButtonSx(theme)}>
            Refresh
          </Button>
        </Stack>

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mt: 4, p: 2.5, bgcolor: 'rgba(0,0,0,0.1)', borderRadius: 3, border: '1px solid rgba(255,255,255,0.05)' }}>
          <TextField
            label="Event ID"
            value={eventIdInput}
            onChange={(event) => setEventIdInput(event.target.value.replace(/[^0-9]/g, ''))}
            placeholder="e.g. 12345"
            sx={{ 
              maxWidth: { xs: '100%', md: 180 },
              ...getGlassInputSx(theme)
            }}
          />
          <TextField
            label="Note (optional)"
            value={noteInput}
            onChange={(event) => setNoteInput(event.target.value)}
            placeholder="Reason this event is suspected broken"
            fullWidth
            sx={getGlassInputSx(theme)}
          />
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddQueueItem}
            disabled={!!actionLoadingByKey.add}
            sx={{ 
              ...getGlassSquareActionButtonSx(theme),
              minWidth: 160, 
            }}
          >
            Queue Event
          </Button>
        </Stack>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={24} />
          </Box>
        ) : items.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2.5 }}>
            No queued broken events yet.
          </Typography>
        ) : (
          <Table size="small" sx={{ mt: 2 }}>
            <TableHead>
              <TableRow>
                <TableCell>Event</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Event Date/Time</TableCell>
                <TableCell>Timeline</TableCell>
                <TableCell>Note</TableCell>
                <TableCell>Reported</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((item) => {
                const queueId = Number(item?.id || 0);
                const eventId = Number(item?.event_id || 0);
                const timelineId = Number(item?.timeline_id || 0);
                const openingEvent = !!actionLoadingByKey[`open-${eventId}`];
                const deleting = !!actionLoadingByKey[`delete-${eventId}`];
                const removing = !!actionLoadingByKey[`remove-${queueId}`];
                const eventExists = Boolean(item?.event_exists);
                const noteText = String(item?.note || '');
                const deletedByAdmin = /resolution=deleted_by_admin/i.test(noteText);
                const statusLabel = deletedByAdmin ? 'Deleted' : (eventExists ? 'Found' : 'Missing');
                const statusColor = deletedByAdmin ? 'warning' : (eventExists ? 'success' : 'error');
                return (
                  <TableRow key={queueId}>
                    <TableCell>
                      <Typography variant="subtitle2">#{eventId}</Typography>
                      {item?.event_title ? (
                        <Typography variant="body2" color="text.secondary">
                          {item.event_title}
                        </Typography>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={statusLabel}
                        color={statusColor}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">
                        {formatTimestamp(item?.event_created_at)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {timelineId > 0 ? (
                        <Typography
                          component="a"
                          href={`/timeline-v3/${timelineId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          variant="body2"
                          sx={{ textDecoration: 'none' }}
                        >
                          {item?.timeline_name || `Timeline ${timelineId}`}
                        </Typography>
                      ) : (
                        <Typography variant="body2" color="text.secondary">Unknown</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {item?.note || '—'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">
                        {formatTimestamp(item?.created_at)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        <Button
                          size="small"
                          variant="outlined"
                          disabled={!eventExists || !(timelineId > 0) || openingEvent}
                          onClick={() => handleOpenEvent(timelineId, eventId)}
                        >
                          Open Event
                        </Button>
                        {timelineId > 0 ? (
                          <Button
                            size="small"
                            component="a"
                            href={`/timeline-v3/${timelineId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            variant="outlined"
                          >
                            Open Timeline
                          </Button>
                        ) : null}
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          startIcon={<DeleteOutlineIcon />}
                          disabled={!eventExists || deleting}
                          onClick={() => handleDeleteEvent(eventId)}
                        >
                          Delete Event
                        </Button>
                        <Button
                          size="small"
                          variant="text"
                          disabled={removing}
                          onClick={() => handleRemoveQueueItem(queueId)}
                        >
                          Remove Queue
                        </Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Paper>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4500}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnackbarOpen(false)} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>

      {eventPopupOpen && popupEvent ? (
        <EventPopup
          event={popupEvent}
          open={eventPopupOpen}
          onClose={() => {
            setEventPopupOpen(false);
            setPopupEvent(null);
          }}
          reviewingEventIds={new Set()}
          hideActionMenu={true}
        />
      ) : null}
    </Box>
  );
};

const BanListTab = () => {
  const theme = useTheme();
  const timelineSurfaces = getTimelineSurfaceTheme(theme);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addInput, setAddInput] = useState('');
  const [addReason, setAddReason] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('info');
  const [hasError, setHasError] = useState(false);

  const showSnack = (msg, severity = 'info') => {
    setSnackbarMessage(msg);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const fetchBanList = useCallback(async () => {
    try {
      setLoading(true);
      const [usernameData, timelineData] = await Promise.allSettled([
        api.get('/api/v1/moderation', { params: { subject_type: 'username', is_active: true, limit: 500 } }),
        api.get('/api/v1/moderation', { params: { subject_type: 'timeline_name', is_active: true, limit: 500 } }),
      ]);
      const usernameRows = usernameData.status === 'fulfilled' ? (usernameData.value?.data?.data || []) : [];
      const timelineRows = timelineData.status === 'fulfilled' ? (timelineData.value?.data?.data || []) : [];
      const allRows = [...usernameRows, ...timelineRows].filter((r) => r.action === 'block_name');
      allRows.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setItems(allRows);
    } catch (e) {
      showSnack('Failed to load ban list', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBanList();
  }, [fetchBanList]);

  const handleAddBan = async () => {
    const name = addInput.trim().toLowerCase();
    if (!name) return;
    try {
      setAddLoading(true);
      await api.post('/api/v1/moderation', {
        subject_type: 'username',
        subject_id: null,
        subject_value: name,
        action: 'block_name',
        reason_public: addReason.trim() || null,
      });
      setAddInput('');
      setAddReason('');
      showSnack(`"${name}" added to ban list`, 'success');
      fetchBanList();
    } catch (e) {
      setHasError(true);
      setTimeout(() => setHasError(false), 1000);
      showSnack(e?.response?.data?.error || 'Failed to add ban', 'error');
    } finally {
      setAddLoading(false);
    }
  };

  const handleRemoveBan = async (id) => {
    try {
      await api.patch(`/api/v1/moderation/${id}`, { is_active: false });
      showSnack('Ban removed', 'success');
      fetchBanList();
    } catch (e) {
      showSnack('Failed to remove ban', 'error');
    }
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Paper 
        sx={{ 
          p: 4, 
          borderRadius: 4,
          background: timelineSurfaces.panel,
          border: `1px solid ${timelineSurfaces.panelBorder}`,
          backdropFilter: timelineSurfaces.panelBlur,
        }} 
        elevation={0}
      >
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} justifyContent="space-between" alignItems={{ xs: 'stretch', md: 'center' }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800 }}>Ban List</Typography>
            <Typography variant="body2" sx={{ mt: 0.5, opacity: 0.7 }}>
              Blocked names. These cannot be used as usernames or community timeline names.
            </Typography>
          </Box>
          <Button variant="outlined" onClick={fetchBanList} disabled={loading} sx={getGlassSquareActionButtonSx(theme)}>
            Refresh
          </Button>
        </Stack>

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mt: 4, p: 2.5, bgcolor: 'rgba(0,0,0,0.1)', borderRadius: 3, border: '1px solid rgba(255,255,255,0.05)' }}>
          <TextField
            label="Name to ban"
            value={addInput}
            onChange={(e) => setAddInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleAddBan(); }}
            placeholder="e.g. badusername"
            className={hasError ? 'animate-shake' : ''}
            sx={{ 
              maxWidth: { xs: '100%', md: 240 },
              ...getGlassInputSx(theme),
            }}
            size="medium"
          />
          <TextField
            label="Reason (optional)"
            value={addReason}
            onChange={(e) => setAddReason(e.target.value)}
            placeholder="Why is this name banned?"
            fullWidth
            size="medium"
            sx={getGlassInputSx(theme)}
          />
          <Button
            variant="contained"
            onClick={handleAddBan}
            disabled={addLoading || !addInput.trim()}
            sx={{ 
              ...getGlassSquareActionButtonSx(theme),
              minWidth: 140,
            }}
          >
            Add Ban
          </Button>
        </Stack>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={24} />
          </Box>
        ) : items.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2.5 }}>
            No banned names in the list.
          </Typography>
        ) : (
          <Table size="small" sx={{ mt: 2 }}>
            <TableHead>
              <TableRow>
                <TableCell>Banned Name</TableCell>
                <TableCell>Reason</TableCell>
                <TableCell>Date Added</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>
                      {item.subject_value}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {item.reason_public || '—'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(item.created_at).toLocaleDateString()}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Button
                      size="small"
                      variant="text"
                      color="error"
                      onClick={() => handleRemoveBan(item.id)}
                    >
                      Remove
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Paper>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3500}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbarSeverity} onClose={() => setSnackbarOpen(false)}>
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

const parseReasonCategory = (reasonRaw, detailsRaw) => {
  const out = { chipLabel: null, chipStyle: {}, cleaned: reasonRaw || '' };
  
  if (reasonRaw && typeof reasonRaw === 'string') {
    const match = reasonRaw.match(/^\s*\[([^\]]+)\]\s*(.*)$/);
    if (match) {
      const key = (match[1] || '').toLowerCase();
      out.cleaned = match[2] || '';
      
      if (key === 'website_policy') {
        out.chipLabel = 'Website Policy';
        out.chipStyle = { bgcolor: '#1976d2', color: '#fff' };
        return out;
      } else if (key === 'government_policy') {
        out.chipLabel = 'Government Policy';
        out.chipStyle = { bgcolor: '#ed6c02', color: '#fff' };
        return out;
      } else if (key === 'unethical_boundary') {
        out.chipLabel = 'Unethical Boundary';
        out.chipStyle = { bgcolor: '#d32f2f', color: '#fff' };
        return out;
      }
    }
  }

  const categoryKey = (detailsRaw || '').toLowerCase();
  if (categoryKey === 'website_policy') {
    out.chipLabel = 'Website Policy';
    out.chipStyle = { bgcolor: '#1976d2', color: '#fff' };
  } else if (categoryKey === 'government_policy') {
    out.chipLabel = 'Government Policy';
    out.chipStyle = { bgcolor: '#ed6c02', color: '#fff' };
  } else if (categoryKey === 'unethical_boundary') {
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
  const timelineSurfaces = getTimelineSurfaceTheme(theme);
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
  const [removePlacements, setRemovePlacements] = useState([]);
  const [removeLoadingPlacements, setRemoveLoadingPlacements] = useState(false);
  const [removeTargetTimelineId, setRemoveTargetTimelineId] = useState(null);
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
      setSnackbarMessage('Timeline warning lifted successfully');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      await fetchReports();
    } catch (e) {
      setSnackbarMessage(e?.response?.data?.error || 'Failed to lift timeline warning');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  const handleLiftUserRestriction = async (post) => {
    try {
      await liftUserRestrictionFromReport(post?.reportId || post?.id);
      setSnackbarMessage('User restriction lifted successfully');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      await fetchReports();
    } catch (e) {
      setSnackbarMessage(e?.response?.data?.error || 'Failed to lift user restriction');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  const handleLiftUserUnban = async (post) => {
    try {
      await liftUserUnbanFromReport(post?.reportId || post?.id);
      setSnackbarMessage('User ban lifted successfully');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      await fetchReports();
    } catch (e) {
      setSnackbarMessage(e?.response?.data?.error || 'Failed to lift user ban');
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

  const handleOpenRemoveDialog = async (post) => {
    setSelectedPost(post);
    setRemoveVerdict('');
    setLockEditOnRemove(false);
    setRemovePlacements([]);
    setRemoveTargetTimelineId(null);
    setRemoveDialogOpen(true);
    if (post?.eventId) {
      setRemoveLoadingPlacements(true);
      try {
        const data = await getEventPlacements(post.eventId);
        setRemovePlacements(data?.placements ?? []);
        if (data?.placements?.length === 1) {
          setRemoveTargetTimelineId(data.placements[0].id);
        }
      } catch (e) {
        console.warn('[SiteControl] Failed to load placements:', e);
      } finally {
        setRemoveLoadingPlacements(false);
      }
    }
  };

  const handleCloseRemoveDialog = () => {
    setRemoveDialogOpen(false);
    setSelectedPost(null);
    setRemoveVerdict('');
    setRemoveSubmitting(false);
    setLockEditOnRemove(false);
    setRemovePlacements([]);
    setRemoveTargetTimelineId(null);
    setRemoveLoadingPlacements(false);
  };

  const handleOpenResolveEdit = async (post) => {
    try {
      if (!post?.eventId || !post?.timelineId) return;
      const res = await api.get(`/api/v1/events/${post.eventId}`);
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
      const { type: _type, url_source: _url_source, media_url: _media_url, cloudinary_id: _cloudinary_id, ...patchableData } = eventData;
      await api.patch(`/api/v1/events/${selectedPost.eventId}`, {
        ...patchableData,
        tags: Array.isArray(eventData.tags) ? eventData.tags : [],
        edit_locked: true,
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
      const res = await api.get(`/api/v1/events/${post.eventId}`);
      const event = res?.data;
      if (event && event.id) {
        setSelectedPost(post);
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
            const eventRes = await api.get(`/api/v1/events/${it.event_id}`);
            const event = eventRes?.data;
            if (event) {
              if (event.media_type) {
                const mediaType = String(event.media_type).toLowerCase();
                if (mediaType === 'image') displayType = 'Image';
                else if (mediaType === 'video') displayType = 'Video';
                else if (mediaType === 'audio') displayType = 'Audio';
                else displayType = mediaType.charAt(0).toUpperCase() + mediaType.slice(1);
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
        const isEscalated = statusRaw === 'escalated';
        return {
          id: it.id || it.report_id || String(Math.random()),
          eventType: displayType,
          status: normalizedStatus,
          isEscalated,
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
          category: it.details || null,
          escalationType: it.escalation_type || null,
          escalationSummary: it.escalation_summary || '',
          assignedModerator: it.assigned_to ? {
            id: it.assigned_to,
            name: it.assigned_to_username || it.assigned_to_name || 'Moderator',
            avatar: it.assigned_to_avatar_url || null,
          } : null,
          resolution: it.resolution || null,
          verdict: it.verdict || it.resolution_notes || '',
          moderation_action: it.moderation_action || null,
          moderation_actions: it.moderation_actions || [],
          safeguardSafeUntil: it.safeguard_safe_until || null,
          warningScope: it.warning_scope || null,
          warningUntil: it.warning_until || null,
          warningIsActive: typeof it.warning_is_active === 'boolean' ? it.warning_is_active : null,
          banIsActive: typeof it.ban_is_active === 'boolean' ? it.ban_is_active : null,
          restriction_is_active: typeof it.restriction_is_active === 'boolean' ? it.restriction_is_active : null,
          suspension_is_active: typeof it.suspension_is_active === 'boolean' ? it.suspension_is_active : null,
          restriction_until: it.restriction_until || null,
          suspension_until: it.suspension_until || null,
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

  const handleDismissReport = async (post) => {
    try {
      await resolveSiteReport(post.reportId || post.id, 'dismiss', 'Report dismissed - not worthy of review', false);
      await fetchReports();
      setSnackbarMessage('Report dismissed');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (e) {
      setSnackbarMessage(e?.response?.data?.error || 'Failed to dismiss report');
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
      await resolveSiteReport(selectedPost?.reportId || selectedPost?.id, 'remove', removeVerdict.trim(), lockEditOnRemove, removeTargetTimelineId ? { reportingTimelineId: removeTargetTimelineId } : {});
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
                const { chipLabel, chipStyle, cleaned } = parseReasonCategory(post.reason, post.category);
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
                    elevation={0}
                    sx={{
                      p: 2.5,
                      mb: 2,
                      cursor: 'pointer',
                      transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                      borderLeft: `4px solid ${statusColor.text}`,
                      background: timelineSurfaces.panel,
                      border: `1px solid ${timelineSurfaces.panelBorder}`,
                      backdropFilter: timelineSurfaces.panelBlur,
                      borderRadius: 2.5,
                      '&:hover': { 
                        transform: 'translateY(-3px)', 
                        boxShadow: '0 12px 24px -8px rgba(0,0,0,0.15)',
                        background: alpha(timelineSurfaces.panel, 0.95),
                      },
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
                          {post.isEscalated && (
                            <Chip
                              label="Escalated"
                              size="small"
                              color="error"
                              sx={{ fontWeight: 600 }}
                            />
                          )}
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
                              {post.moderation_actions?.filter(a => a.is_active && a.action === 'cooldown' && a.subject_type === 'user' && a.subject_id !== post.reportedUser?.id).map((action, idx) => (
                                <Typography
                                  key={idx}
                                  variant="body2"
                                  sx={{
                                    textAlign: { xs: 'left', sm: 'right' },
                                    color: '#1E40AF',
                                    fontWeight: 600,
                                    fontSize: '0.75rem',
                                  }}
                                >
                                  + Author Safeguarded (ID: {action.subject_id})
                                </Typography>
                              ))}
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
                              {post.resolution === 'restrict_user' && post.restriction_until && (
                                <Typography
                                  variant="body2"
                                  sx={{
                                    textAlign: { xs: 'left', sm: 'right' },
                                    color: '#1E40AF',
                                    fontWeight: 700,
                                  }}
                                >
                                  Restriction Until: {new Date(post.restriction_until).toLocaleString()}
                                </Typography>
                              )}
                              {post.resolution === 'suspend_user' && post.suspension_until && (
                                <Typography
                                  variant="body2"
                                  sx={{
                                    textAlign: { xs: 'left', sm: 'right' },
                                    color: '#991B1B',
                                    fontWeight: 700,
                                  }}
                                >
                                  Suspension Until: {new Date(post.suspension_until).toLocaleString()}
                                </Typography>
                              )}
                              {post.resolution === 'issue_warning' && post.warningIsActive === false && (
                                <Chip
                                  label="Warning Lifted"
                                  size="small"
                                  color="success"
                                  variant="outlined"
                                  sx={{ fontWeight: 700 }}
                                />
                              )}
                              {post.resolution === 'restrict_user' && post.restriction_is_active === false && (
                                <Chip
                                  label="Restriction Lifted"
                                  size="small"
                                  color="success"
                                  variant="outlined"
                                  sx={{ fontWeight: 700 }}
                                />
                              )}
                              {post.resolution === 'suspend_user' && post.suspension_is_active === false && (
                                <Chip
                                  label="Ban is lifted"
                                  size="small"
                                  color="success"
                                  variant="outlined"
                                  sx={{ fontWeight: 700 }}
                                />
                              )}

                              {(reportedUsernameAtActionTime || post.moderation_action?.subject_value) && post.resolution === 'require_username_change' && (
                                <Typography variant="body2" color="text.secondary" sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
                                  Reported username: <strong>{displayUsername(reportedUsernameAtActionTime || post.moderation_action?.subject_value)}</strong>
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
                          md: post.status === 'resolved' ? 'minmax(0, 1fr) minmax(0, 2fr)' : '1fr',
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
                                userColor={post.reportedUser?.user_color}
                                isRestricted={post.reported_user_is_restricted || post.reportedUser?.is_restricted}
                                isAvatarBlurred={post.reported_user_is_avatar_blurred || post.reportedUser?.is_avatar_blurred}
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
                                    {displayUsername(post.reportedUser?.name) || `User ${post.reportedUser.id}`}
                                  </Typography>
                                ) : (
                                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                                    {displayUsername(post.reportedUser?.name) || 'Unknown User'}
                                  </Typography>
                                )}
                                {post.reportedUser?.id && (
                                  <Typography variant="body2" color="text.secondary">
                                    Profile: /profile/{post.reportedUser.id}
                                  </Typography>
                                )}
                                {(reportedUsernameAtActionTime || post.moderation_action?.subject_value) && (
                                  <Typography variant="body2" sx={{ color: '#D32F2F', fontWeight: 600, mt: 0.5 }}>
                                    Reported username: {displayUsername(reportedUsernameAtActionTime || post.moderation_action?.subject_value)}
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
                                      icon={
                                        post.timelineType === 'hashtag' 
                                          ? <TagIcon fontSize="small" style={{ color: '#1E40AF' }} /> 
                                          : (post.timelineType === 'personal'
                                            ? <PersonIcon fontSize="small" style={{ color: '#1E40AF' }} />
                                            : <ForumIcon fontSize="small" style={{ color: '#1E40AF' }} />)
                                      }
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
                                      icon={
                                        (post.reportedTimeline?.type || post.timelineType) === 'hashtag' 
                                          ? <TagIcon fontSize="small" style={{ color: '#1B5E20' }} /> 
                                          : ((post.reportedTimeline?.type || post.timelineType) === 'personal'
                                            ? <PersonIcon fontSize="small" style={{ color: '#1B5E20' }} />
                                            : <ForumIcon fontSize="small" style={{ color: '#1B5E20' }} />)
                                      }
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

                      {post.status === 'resolved' && (
                        <Box
                          sx={{
                            p: 1.4,
                            borderRadius: 1.5,
                            border: '1px solid',
                            borderColor: verdictText ? 'primary.main' : 'divider',
                            backgroundColor: theme.palette.mode === 'dark'
                              ? 'rgba(255,255,255,0.03)'
                              : 'rgba(15,23,42,0.03)',
                            minHeight: '100%',
                          }}
                        >
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.35, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.6 }}>
                            Verdict
                          </Typography>
                          {verdictText ? (
                            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
                              {verdictText}
                            </Typography>
                          ) : (
                            <Typography variant="body2" color="text.disabled" sx={{ fontStyle: 'italic' }}>
                              No verdict recorded
                            </Typography>
                          )}
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
                            userColor={post.reporter?.user_color}
                            isRestricted={post.reporter_is_restricted || post.reporter?.is_restricted}
                            isSuspended={post.reporter_is_suspended || post.reporter?.is_suspended}
                            isAvatarBlurred={post.reporter_is_avatar_blurred || post.reporter?.is_avatar_blurred}
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
                            {displayUsername(post.reporter?.name) || 'Reporter'}
                          </Typography>
                        ) : (
                          <Typography variant="body2">{displayUsername(post.reporter?.name) || 'Reporter'}</Typography>
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
                              userColor={post.assignedModerator.user_color}
                              isRestricted={post.assigned_to_is_restricted || post.assignedModerator.is_restricted}
                              isSuspended={post.assigned_to_is_suspended || post.assignedModerator.is_suspended}
                              isAvatarBlurred={post.assigned_to_is_avatar_blurred || post.assignedModerator.is_avatar_blurred}
                            />
                          )}
                          <Typography variant="body2">{post.assignedModerator.name}</Typography>
                        </Box>
                      )}
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2, flexWrap: 'wrap' }}>
                      {post.status === 'pending' && (
                        <>
                          <Button
                            variant="contained"
                            size="small"
                            startIcon={<ShieldIcon />}
                            onClick={() => handleAcceptReport(post)}
                            sx={{ ...getGlassSquareActionButtonSx(theme), mr: 1, mb: 1, px: 2 }}
                          >
                            Accept for Review
                          </Button>
                          <Button
                            variant="contained"
                            size="small"
                            onClick={() => handleDismissReport(post)}
                            sx={{ 
                              ...getGlassSquareActionButtonSx(theme), 
                              mr: 1, mb: 1, px: 2,
                              color: 'success.main',
                              borderColor: alpha(theme.palette.success.main, 0.2)
                            }}
                          >
                            Dismiss
                          </Button>
                        </>
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

                      {post.status === 'resolved' && post.reportType === 'user' && post.resolution === 'restrict_user' && (post.restriction_is_active !== false) && (
                        <Button
                          variant="outlined"
                          size="small"
                          color="primary"
                          onClick={() => handleLiftUserRestriction(post)}
                          sx={{ ml: 1, mb: 1 }}
                        >
                          Lift Restriction
                        </Button>
                      )}

                      {post.status === 'resolved' && post.reportType === 'user' && post.resolution === 'suspend_user' && (post.suspension_is_active !== false) && (
                        <Button
                          variant="outlined"
                          size="small"
                          color="error"
                          onClick={() => handleLiftUserUnban(post)}
                          sx={{ ml: 1, mb: 1 }}
                        >
                          Lift Ban
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

                      {post.status === 'resolved' && post.reportType === 'timeline' && post.resolution === 'ban_timeline' && (
                        post.banIsActive === false ? (
                          <Chip
                            label="Ban is lifted"
                            size="small"
                            color="success"
                            sx={{ ml: 1, mb: 1, fontWeight: 600 }}
                          />
                        ) : isSiteOwner ? (
                          <Button
                            variant="outlined"
                            size="small"
                            color="info"
                            onClick={() => handleUnbanTimeline(post)}
                            sx={{ ml: 1, mb: 1 }}
                          >
                            Unban Timeline (SiteOwner)
                          </Button>
                        ) : null
                      )}

                      {post.eventId && post.timelineId && !(post.status === 'resolved' && post.resolution === 'delete') && (
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
        PaperProps={{ sx: getGlassDialogPaperSx(theme) }}
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
            sx={{ mt: 2, ...getGlassInputSx(theme) }}
          />
          {postActionType === 'safeguard' && (
            <>
              <FormControl fullWidth sx={{ mt: 2, ...getGlassInputSx(theme), opacity: safeguardUseCustomUntil ? 0.45 : 1 }}>
                <InputLabel id="site-safeguard-days-label">Cooldown Duration</InputLabel>
                <Select
                  labelId="site-safeguard-days-label"
                  label="Cooldown Duration"
                  value={safeguardDays}
                  onChange={(e) => setSafeguardDays(String(e.target.value))}
                  disabled={safeguardUseCustomUntil}
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
                      sx={{ mt: 1, ...getGlassInputSx(theme) }}
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
          <Button
            onClick={handleClosePostActionDialog}
            variant="contained"
            sx={{ ...getGlassSquareActionButtonSx(theme), width: 'auto', minWidth: 84, px: 2 }}
          >
            Cancel
          </Button>
          <Button
            onClick={postActionType === 'delete' ? handleDeletePost : handleSubmitPostAction}
            variant="contained"
            startIcon={postActionType === 'delete' || postActionType === 'ban_timeline' ? <CancelIcon /> : <CheckCircleIcon />}
            disabled={
              !actionVerdict.trim()
              || (postActionType === 'safeguard' && isSiteOwner && safeguardUseCustomUntil && !safeguardCustomUntil)
            }
            sx={(() => {
              const actionColor = postActionType === 'delete' || postActionType === 'ban_timeline'
                ? { base: '#ef4444', hover: '#dc2626' }
                : postActionType === 'issue_warning'
                  ? { base: '#f59e0b', hover: '#d97706' }
                  : { base: '#22c55e', hover: '#16a34a' };
              const pill = getGlassPillActionButtonSx(theme);
              return {
                ...pill,
                color: '#fff',
                background: actionColor.base,
                '&:hover': {
                  ...pill['&:hover'],
                  background: actionColor.hover,
                },
                '&.Mui-disabled': {
                  background: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
                  color: 'rgba(255,255,255,0.35)',
                },
              };
            })()}
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
        PaperProps={{ sx: getGlassDialogPaperSx(theme) }}
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
              sx={{ mb: 2, ...getGlassInputSx(theme) }}
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
                  sx={{ mb: 2, ...getGlassInputSx(theme) }}
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
            sx={getGlassInputSx(theme)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseUserModerationDialog} sx={{ ...getGlassSquareActionButtonSx(theme), width: 'auto', minWidth: 84, px: 2 }}>Cancel</Button>
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
            sx={getGlassPillActionButtonSx(theme)}
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
        PaperProps={{ sx: getGlassDialogPaperSx(theme) }}
      >
        <DialogTitle id="remove-dialog-title">Remove from Timeline</DialogTitle>
        <DialogContent>
          {removeLoadingPlacements ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <CircularProgress size={16} />
              <Typography variant="body2" color="text.secondary">Loading placements…</Typography>
            </Box>
          ) : removePlacements.length === 0 ? (
            <DialogContentText sx={{ mb: 2, color: 'warning.main' }}>
              This event has no removable placements — it only exists on its origin timeline. Use <strong>Delete Ticket</strong> for full removal.
            </DialogContentText>
          ) : (
            <>
              <DialogContentText sx={{ mb: 1 }}>
                Select which timeline to remove this event from:
              </DialogContentText>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel id="remove-target-label">Timeline</InputLabel>
                <Select
                  labelId="remove-target-label"
                  label="Timeline"
                  value={removeTargetTimelineId ?? ''}
                  onChange={(e) => setRemoveTargetTimelineId(e.target.value)}
                  sx={getGlassInputSx(theme)}
                >
                  {removePlacements.map((p) => (
                    <MenuItem key={p.id} value={p.id}>
                      {p.name}{p.type ? ` (${p.type})` : ''}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </>
          )}
          <TextField
            autoFocus
            fullWidth
            multiline
            minRows={3}
            label="Verdict (required)"
            placeholder="Write your findings and rationale"
            value={removeVerdict}
            onChange={(e) => setRemoveVerdict(e.target.value)}
            sx={getGlassInputSx(theme)}
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
          <Button onClick={handleCloseRemoveDialog} sx={{ ...getGlassSquareActionButtonSx(theme), width: 'auto', minWidth: 84, px: 2 }}>Cancel</Button>
          <Button
            onClick={handleConfirmRemoveFromTimeline}
            variant="contained"
            color="warning"
            disabled={!removeVerdict.trim() || removeSubmitting || removePlacements.length === 0 || !removeTargetTimelineId}
            startIcon={<PersonRemoveIcon />}
            sx={getGlassPillActionButtonSx(theme)}
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
          onEdit={() => handleOpenResolveEdit(selectedPost)}
          reviewingEventIds={reviewingEventIds}
          hideActionMenu={true}
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

const SiteSettingsTab = ({ canManageSettings, isSiteAdmin }) => {
  const theme = useTheme();
  const timelineSurfaces = getTimelineSurfaceTheme(theme);
  const [settingsSection, setSettingsSection] = useState('home-hero');
  const [leadSentence, setLeadSentence] = useState('');
  const [rotatorItems, setRotatorItems] = useState([]);
  const [rotationIntervalMs, setRotationIntervalMs] = useState(3000);
  const [randomizeEndings, setRandomizeEndings] = useState(false);
  const [badgeText, setBadgeText] = useState('');
  const [badgeEnabled, setBadgeEnabled] = useState(true);
  const [homeHeroRotationIntervalMs, setHomeHeroRotationIntervalMs] = useState(HOME_HERO_DEFAULT_INTERVAL_MS);
  const [homeHeroSlides, setHomeHeroSlides] = useState([]);
  const [newHomeHeroSlideType, setNewHomeHeroSlideType] = useState('welcome');
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
      const homeHeroSettings = settings.home_hero || {};
      setHomeHeroRotationIntervalMs(Number(homeHeroSettings.rotation_interval_ms) || HOME_HERO_DEFAULT_INTERVAL_MS);
      setHomeHeroSlides(Array.isArray(homeHeroSettings.slides) ? homeHeroSettings.slides : []);
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

  const hasHomeHeroTemplate = useCallback((slideType) => {
    const normalizedType = String(slideType || '').trim().toLowerCase();
    return homeHeroSlides.some((slide) => String(slide?.type || '').toLowerCase() === normalizedType);
  }, [homeHeroSlides]);

  useEffect(() => {
    if (!hasHomeHeroTemplate(newHomeHeroSlideType)) return;

    const firstAvailable = HOME_HERO_TEMPLATE_OPTIONS.find((option) => !hasHomeHeroTemplate(option.type));
    if (firstAvailable?.type) {
      setNewHomeHeroSlideType(firstAvailable.type);
    }
  }, [homeHeroSlides, hasHomeHeroTemplate, newHomeHeroSlideType]);

  const handleAddHomeHeroSlide = () => {
    const slideType = String(newHomeHeroSlideType || '').trim().toLowerCase();
    if (!slideType || hasHomeHeroTemplate(slideType)) return;

    const baseSlide = {
      type: slideType,
      enabled: true,
    };

    if (slideType === 'event_spotlight') {
      baseSlide.selection_mode = 'manual';
      baseSlide.event_id = null;
    }

    if (slideType === 'trending_community') {
      baseSlide.selection_mode = 'manual';
      baseSlide.timeline_id = null;
    }

    if (slideType === 'advertisement') {
      baseSlide.headline = '';
      baseSlide.subtext = '';
      baseSlide.media_url = '';
      baseSlide.cta_label = '';
      baseSlide.cta_href = '';
      baseSlide.open_in_new_tab = false;
    }

    setHomeHeroSlides((prev) => [...prev, baseSlide]);
    setHasUnsavedChanges(true);
  };

  const handleRemoveHomeHeroSlide = (slideType) => {
    const normalizedType = String(slideType || '').trim().toLowerCase();
    setHomeHeroSlides((prev) => prev.filter((slide) => String(slide?.type || '').toLowerCase() !== normalizedType));
    setHasUnsavedChanges(true);
  };

  const handleUpdateHomeHeroSlide = (slideType, updates) => {
    const normalizedType = String(slideType || '').trim().toLowerCase();
    setHomeHeroSlides((prev) => prev.map((slide) => {
      if (String(slide?.type || '').toLowerCase() !== normalizedType) return slide;
      return { ...slide, ...updates };
    }));
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
        home_hero: {
          rotation_interval_ms: homeHeroRotationIntervalMs,
          slides: homeHeroSlides,
        },
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
      const homeHeroSettings = settings.home_hero || {};
      setHomeHeroRotationIntervalMs(Number(homeHeroSettings.rotation_interval_ms) || HOME_HERO_DEFAULT_INTERVAL_MS);
      setHomeHeroSlides(Array.isArray(homeHeroSettings.slides) ? homeHeroSettings.slides : []);
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
        <Paper 
          sx={{ 
            p: 4, 
            textAlign: 'center',
            background: timelineSurfaces.panel,
            border: `1px solid ${timelineSurfaces.panelBorder}`,
            backdropFilter: timelineSurfaces.panelBlur,
            borderRadius: 3.2,
          }} 
          elevation={0}
        >
          <LockIcon sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
          <Typography variant="h6">Site Settings Locked</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Site settings are only available to authorized administrators.
          </Typography>
        </Paper>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '220px minmax(0, 1fr)' },
            gap: 2,
          }}
        >
          <Paper 
            sx={{ 
              p: 1.25, 
              height: 'fit-content',
              background: timelineSurfaces.panel,
              border: `1px solid ${timelineSurfaces.panelBorder}`,
              backdropFilter: timelineSurfaces.panelBlur,
              borderRadius: 2.2,
            }} 
            elevation={0}
          >
            <Tabs
              value={settingsSection}
              onChange={(_event, nextValue) => setSettingsSection(nextValue)}
              orientation="vertical"
              variant="scrollable"
              sx={{
                '& .MuiTab-root': {
                  alignItems: 'flex-start',
                  textAlign: 'left',
                  minHeight: 42,
                  borderRadius: 1.5,
                  mb: 0.5,
                  transition: 'all 0.2s ease',
                  '&.Mui-selected': {
                    bgcolor: theme.palette.mode === 'dark' ? alpha('#38bdf8', 0.12) : alpha('#0ea5e9', 0.08),
                    color: theme.palette.mode === 'dark' ? '#7dd3fc' : '#0369a1',
                  },
                },
                '& .MuiTabs-indicator': {
                  left: 0,
                  width: 3,
                  borderRadius: '0 4px 4px 0',
                }
              }}
            >
              {SITE_SETTINGS_SECTIONS.map((section) => (
                <Tab key={section.key} label={section.label} value={section.key} />
              ))}
            </Tabs>
          </Paper>

          <Stack spacing={2.5}>
            {settingsSection === 'home-hero' ? (
              <Paper 
                sx={{ 
                  p: 3,
                  background: timelineSurfaces.panel,
                  border: `1px solid ${timelineSurfaces.panelBorder}`,
                  backdropFilter: timelineSurfaces.panelBlur,
                  borderRadius: 2.5,
                }} 
                elevation={0}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="h6">Home Hero Banner</Typography>
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
                  Configure Home hero rotation templates. Duplicates are not allowed.
                </Typography>

                <Stack spacing={2}>
                  <TextField
                    label="Auto Alternate Interval (ms)"
                    type="number"
                    fullWidth
                    value={homeHeroRotationIntervalMs}
                    onChange={(e) => {
                      setHomeHeroRotationIntervalMs(Number(e.target.value) || 0);
                      setHasUnsavedChanges(true);
                    }}
                    helperText="Default is 75000ms (1 minute 15 seconds)."
                    disabled={loadingSettings}
                    sx={getGlassInputSx(theme)}
                  />

                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, mb: 1 }}>
                      <Typography variant="subtitle1">Slides in Rotation</Typography>
                    </Box>

                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25} sx={{ mb: 1.5 }}>
                      <FormControl fullWidth size="small" disabled={loadingSettings}>
                        <InputLabel id="home-hero-template-select-label">Template</InputLabel>
                        <Select
                          labelId="home-hero-template-select-label"
                          value={newHomeHeroSlideType}
                          label="Template"
                          onChange={(e) => setNewHomeHeroSlideType(e.target.value)}
                        >
                          {HOME_HERO_TEMPLATE_OPTIONS.map((option) => (
                            <MenuItem
                              key={option.type}
                              value={option.type}
                              disabled={hasHomeHeroTemplate(option.type)}
                            >
                              {option.label}{hasHomeHeroTemplate(option.type) ? ' (already added)' : ''}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={handleAddHomeHeroSlide}
                        disabled={loadingSettings || hasHomeHeroTemplate(newHomeHeroSlideType)}
                        sx={{ ...getGlassSquareActionButtonSx(theme), width: 'auto', minWidth: 120, px: 2 }}
                      >
                        Add Slide
                      </Button>
                    </Stack>

                    <Table size="small" sx={{ 
                      '& .MuiTableCell-root': { 
                        borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                        py: 1.5
                      } 
                    }}>
                      <TableHead>
                        <TableRow sx={{ bgcolor: alpha(theme.palette.text.primary, 0.03) }}>
                          <TableCell sx={{ fontWeight: 800, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Template</TableCell>
                          <TableCell sx={{ fontWeight: 800, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Enabled</TableCell>
                          <TableCell sx={{ fontWeight: 800, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Details</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 800, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {homeHeroSlides.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
                              No hero slides selected yet.
                            </TableCell>
                          </TableRow>
                        ) : homeHeroSlides.map((slide) => {
                          const slideType = String(slide?.type || '').toLowerCase();
                          const templateLabel = HOME_HERO_TEMPLATE_OPTIONS.find((option) => option.type === slideType)?.label || slideType;

                          return (
                            <TableRow 
                              key={`home-hero-slide-${slideType}`}
                              sx={{ 
                                transition: 'all 0.2s ease',
                                '&:hover': { bgcolor: alpha(theme.palette.action.hover, 0.03) }
                              }}
                            >
                              <TableCell>{templateLabel}</TableCell>
                              <TableCell>
                                <Switch
                                  size="small"
                                  checked={Boolean(slide?.enabled)}
                                  onChange={(e) => handleUpdateHomeHeroSlide(slideType, { enabled: e.target.checked })}
                                  disabled={loadingSettings}
                                />
                              </TableCell>
                              <TableCell>
                                {slideType === 'trending_community' ? (
                                  <Stack spacing={1}>
                                    <FormControl size="small" fullWidth disabled={loadingSettings}>
                                      <InputLabel id={`home-hero-trending-mode-${slideType}`}>Selection Mode</InputLabel>
                                      <Select
                                        labelId={`home-hero-trending-mode-${slideType}`}
                                        label="Selection Mode"
                                        value={String(slide?.selection_mode || 'manual').toLowerCase()}
                                        onChange={(e) => handleUpdateHomeHeroSlide(slideType, { selection_mode: e.target.value })}
                                      >
                                        <MenuItem value="manual">Manual Timeline ID</MenuItem>
                                        <MenuItem value="top_members_followers">Top Members/Followers</MenuItem>
                                      </Select>
                                    </FormControl>

                                    {String(slide?.selection_mode || 'manual').toLowerCase() === 'manual' ? (
                                      <TextField
                                        size="small"
                                        type="number"
                                        label="Timeline ID"
                                        value={slide?.timeline_id ?? ''}
                                        onChange={(e) => handleUpdateHomeHeroSlide(slideType, { timeline_id: Number(e.target.value) || null })}
                                        helperText="Community timeline to feature in Trending Community slide"
                                        disabled={loadingSettings}
                                      />
                                    ) : (
                                      <Typography variant="caption" color="text.secondary" sx={{ px: 0.25 }}>
                                        Home Hero will auto-pick the public community with the highest members/followers score.
                                      </Typography>
                                    )}
                                  </Stack>
                                ) : null}

                                {slideType === 'event_spotlight' ? (
                                  <Stack spacing={1}>
                                    <FormControl size="small" fullWidth disabled={loadingSettings}>
                                      <InputLabel id={`home-hero-event-mode-${slideType}`}>Selection Mode</InputLabel>
                                      <Select
                                        labelId={`home-hero-event-mode-${slideType}`}
                                        label="Selection Mode"
                                        value={String(slide?.selection_mode || 'manual').toLowerCase()}
                                        onChange={(e) => handleUpdateHomeHeroSlide(slideType, { selection_mode: e.target.value })}
                                      >
                                        <MenuItem value="manual">Manual Event ID</MenuItem>
                                        <MenuItem value="top_votes_today">Top Votes Today</MenuItem>
                                      </Select>
                                    </FormControl>

                                    {String(slide?.selection_mode || 'manual').toLowerCase() === 'manual' ? (
                                      <TextField
                                        size="small"
                                        type="number"
                                        label="Event ID"
                                        value={slide?.event_id ?? ''}
                                        onChange={(e) => handleUpdateHomeHeroSlide(slideType, { event_id: Number(e.target.value) || null })}
                                        disabled={loadingSettings}
                                      />
                                    ) : (
                                      <Typography variant="caption" color="text.secondary" sx={{ px: 0.25 }}>
                                        Home Hero will auto-pick today's most-voted event from loaded public timeline feeds.
                                      </Typography>
                                    )}
                                  </Stack>
                                ) : null}

                                {slideType === 'advertisement' ? (
                                  <Stack spacing={1}>
                                    <TextField
                                      size="small"
                                      label="Headline"
                                      value={slide?.headline || ''}
                                      onChange={(e) => handleUpdateHomeHeroSlide(slideType, { headline: e.target.value })}
                                      disabled={loadingSettings}
                                    />
                                    <TextField
                                      size="small"
                                      label="Subtext"
                                      value={slide?.subtext || ''}
                                      onChange={(e) => handleUpdateHomeHeroSlide(slideType, { subtext: e.target.value })}
                                      disabled={loadingSettings}
                                    />
                                    <TextField
                                      size="small"
                                      label="Media URL (Landscape Background)"
                                      value={slide?.media_url || ''}
                                      onChange={(e) => handleUpdateHomeHeroSlide(slideType, { media_url: e.target.value })}
                                      helperText="Optional image URL used as the ad slide background"
                                      disabled={loadingSettings}
                                    />
                                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                                      <TextField
                                        size="small"
                                        label="CTA Label"
                                        value={slide?.cta_label || ''}
                                        onChange={(e) => handleUpdateHomeHeroSlide(slideType, { cta_label: e.target.value })}
                                        disabled={loadingSettings}
                                      />
                                      <TextField
                                        size="small"
                                        label="CTA URL/Route"
                                        value={slide?.cta_href || ''}
                                        onChange={(e) => handleUpdateHomeHeroSlide(slideType, { cta_href: e.target.value })}
                                        disabled={loadingSettings}
                                      />
                                    </Stack>
                                    <FormControlLabel
                                      control={(
                                        <Checkbox
                                          checked={Boolean(slide?.open_in_new_tab)}
                                          onChange={(e) => handleUpdateHomeHeroSlide(slideType, { open_in_new_tab: e.target.checked })}
                                          disabled={loadingSettings}
                                        />
                                      )}
                                      label="Open ad link in new tab"
                                    />
                                  </Stack>
                                ) : null}
                              </TableCell>
                              <TableCell align="right">
                                <IconButton
                                  size="small"
                                  onClick={() => handleRemoveHomeHeroSlide(slideType)}
                                  disabled={loadingSettings}
                                  sx={{ color: theme.palette.error.main }}
                                >
                                  <DeleteOutlineIcon fontSize="small" />
                                </IconButton>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </Box>
                </Stack>
              </Paper>
            ) : null}

            {settingsSection === 'landing-badge' ? (
              <Paper 
                sx={{ 
                  p: 3,
                  background: timelineSurfaces.panel,
                  border: `1px solid ${timelineSurfaces.panelBorder}`,
                  backdropFilter: timelineSurfaces.panelBlur,
                  borderRadius: 2.5,
                }} 
                elevation={0}
              >
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
                sx={getGlassInputSx(theme)}
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
            ) : null}

            {settingsSection === 'landing-rotator' ? (
              <Paper 
                sx={{ 
                  p: 3,
                  background: timelineSurfaces.panel,
                  border: `1px solid ${timelineSurfaces.panelBorder}`,
                  backdropFilter: timelineSurfaces.panelBlur,
                  borderRadius: 2.5,
                }} 
                elevation={0}
              >
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
                sx={getGlassInputSx(theme)}
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
                sx={getGlassInputSx(theme)}
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
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleAddRotatorItem}
                    disabled={loadingSettings}
                    sx={{ ...getGlassSquareActionButtonSx(theme), width: 'auto', minWidth: 100, px: 2 }}
                  >
                    Add Row
                  </Button>
                </Box>
                <Table size="small" sx={{ 
                  '& .MuiTableCell-root': { 
                    borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                    py: 1.25
                  } 
                }}>
                  <TableHead>
                    <TableRow sx={{ bgcolor: alpha(theme.palette.text.primary, 0.03) }}>
                      <TableCell sx={{ fontWeight: 800, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1px', width: '70%' }}>Text</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 800, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Actions</TableCell>
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
            ) : null}

            {settingsSection === 'toolbar-led' ? (
              <Paper 
                sx={{ 
                  p: 3,
                  background: timelineSurfaces.panel,
                  border: `1px solid ${timelineSurfaces.panelBorder}`,
                  backdropFilter: timelineSurfaces.panelBlur,
                  borderRadius: 2.5,
                }} 
                elevation={0}
              >
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
                sx={getGlassInputSx(theme)}
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
                  sx={getGlassInputSx(theme)}
                />
              )}
            </Stack>
              </Paper>
            ) : null}
          </Stack>
        </Box>
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
                onClick={handleSave}
                disabled={isSaving || showSavedState}
                startIcon={showSavedState ? <CheckCircleIcon /> : isSaving ? null : <SaveIcon />}
                sx={{
                  ...getGlassPillActionButtonSx(theme),
                  bgcolor: showSavedState ? '#16a34a' : theme.palette.mode === 'dark' ? '#0284c7' : '#0ea5e9',
                  color: '#fff',
                  px: 4,
                  py: 1.5,
                  '&:hover': {
                    ...getGlassPillActionButtonSx(theme)['&:hover'],
                    bgcolor: showSavedState ? '#15803d' : theme.palette.mode === 'dark' ? '#0369a1' : '#0284c7',
                  },
                  '&.Mui-disabled': {
                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
                    color: 'rgba(255,255,255,0.3)',
                    borderColor: 'transparent',
                    opacity: showSavedState ? 1 : 0.7,
                    ...(showSavedState && {
                      bgcolor: '#16a34a',
                      color: '#fff',
                      opacity: 1,
                      boxShadow: '0 4px 20px rgba(22, 163, 74, 0.4)'
                    })
                  },
                  boxShadow: hasUnsavedChanges ? `0 8px 24px ${alpha(theme.palette.primary.main, 0.3)}` : 'none',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
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
  const appCanvasBackground = getTimelineSurfaceTheme(theme).canvas;
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
      
      // Use live user data from AuthContext as primary source of truth,
      // fallback to cached passport data.
      const effectiveRole = user.site_admin_role || passport.site_admin_role || passport.site_role || null;
      const effectiveIsAdmin = Boolean(user.is_site_admin) || Boolean(passport.is_site_admin) || Number(user.id) === 1;
      
      setSiteRole(effectiveRole);
      setIsSiteAdmin(effectiveIsAdmin);
    } catch (e) {
      console.warn('[SiteControl] Unable to parse passport data:', e);
      setSiteRole(user.site_admin_role || null);
      setIsSiteAdmin(Boolean(user.is_site_admin) || Number(user.id) === 1);
    } finally {
      setAccessLoading(false);
    }
  }, [user]);

  const isSiteOwner = Number(user?.id) === 1 || siteRole === 'SiteOwner';
  const hasAccess = Boolean(isSiteAdmin || isSiteOwner);
  const canManageSettings = hasAccess; // SiteAdmins can manage settings too

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
          background: appCanvasBackground,
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
            <Tab label="Global Reports" sx={{ fontWeight: 600 }} />
            <Tab label="Admin List" sx={{ fontWeight: 600 }} />
            <Tab label="Logs" sx={{ fontWeight: 600 }} />
            <Tab 
              label="Site Settings" 
              disabled={!canManageSettings} 
              sx={{ 
                fontWeight: 600,
                '&.Mui-disabled': {
                  opacity: 0.4,
                  cursor: 'not-allowed',
                  pointerEvents: 'auto', // Allow tooltip to work if added
                }
              }} 
            />
          </Tabs>

          <Box sx={{ mt: 3 }}>
            <AnimatePresence mode="wait">
              {tabValue === 0 && (
                <motion.div 
                  key="reports"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <GlobalReportsTab />
                </motion.div>
              )}
              {tabValue === 1 && (
                <motion.div 
                  key="admins"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <AdminListTab canManage={canManageSettings} />
                </motion.div>
              )}
              {tabValue === 2 && (
                <motion.div 
                  key="logs"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <LogsTab />
                </motion.div>
              )}
              {tabValue === 3 && (
                <motion.div 
                  key="settings"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <SiteSettingsTab canManageSettings={canManageSettings} isSiteAdmin={isSiteAdmin} />
                </motion.div>
              )}
            </AnimatePresence>
          </Box>
        </Paper>
      </Box>
    </>
  );
};

export default SiteControlPage;
