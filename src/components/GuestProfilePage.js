import React, { useState, useMemo } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  Divider,
  Fab,
  Stack,
  Tooltip,
  ClickAwayListener,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Button,
  Snackbar,
  Alert,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import ReportProblemOutlinedIcon from '@mui/icons-material/ReportProblemOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import AddIcon from '@mui/icons-material/Add';
import { useAuth } from '../contexts/AuthContext';
import UserAvatar from './common/UserAvatar';
import TradingCard from './common/TradingCard';
import { getTimelineSurfaceTheme } from './timeline-v3/timelineSurfaceTheme';
import { submitUserReport } from '../utils/api';
import {
  getGlassDialogPaperSx,
  getGlassInputSx,
  getGlassSquareActionButtonSx,
  getGlassPillActionButtonSx,
} from '../utils/formStyleGuide';

// ── Hardcoded guest identity — no DB row, no API call ──────────────────────
const GUEST_PROFILE_USER = {
  id: null,
  username: 'Goblin',
  bio: 'You are a Common Goblin. Only Lurking allowed for you Little Goblin. Log-in if you want more.',
  email: null,
  created_at: null,
  avatar_url: '/images/GUEST_img.png',
};

const reportCategoryOptions = [
  { value: 'website_policy', label: 'Website policy violation' },
  { value: 'government_policy', label: 'Government policy / legal concern' },
  { value: 'unethical_boundary', label: 'Unethical or harmful boundary' },
];

const GuestProfilePage = () => {
  const { user } = useAuth();
  const theme = useTheme();
  const appCanvasBackground = getTimelineSurfaceTheme(theme).canvas;

  const [fabOpen, setFabOpen] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportCategory, setReportCategory] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Guest profile is never "own" and has no real id — FAB is always shown
  // but sub-actions are gated below
  const isOwnProfile = false;
  const canShowMainProfileActions = true; // always show FAB on guest profile
  const canReportProfile = Boolean(user) && !isOwnProfile && user?.can_post_or_report !== false;
  const canOpenProfileSettings = false; // no settings for guest profile

  const containerGlow =
    theme.palette.mode === 'dark'
      ? '0 8px 32px rgba(0, 0, 0, 0.3)'
      : '0 8px 32px rgba(0, 0, 0, 0.1)';

  // Share link — frontend URL (no backend share endpoint for guest)
  const profileShareLink = useMemo(() => `${window.location.origin}/profile/guest`, []);

  const profileShareQrUrl = useMemo(
    () =>
      `https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(profileShareLink)}`,
    [profileShareLink]
  );

  const profileFallbackSx = useMemo(
    () =>
      theme.palette.mode === 'dark'
        ? {
            backgroundImage: [
              'radial-gradient(circle at 22% 18%, rgba(125,211,252,0.34) 0%, rgba(125,211,252,0) 36%)',
              'radial-gradient(circle at 78% 84%, rgba(251,191,36,0.26) 0%, rgba(251,191,36,0) 34%)',
              'linear-gradient(145deg, rgba(13,36,63,0.96) 0%, rgba(20,48,92,0.94) 44%, rgba(65,34,106,0.9) 100%)',
            ].join(', '),
          }
        : {
            backgroundImage: [
              'radial-gradient(circle at 20% 20%, rgba(56,189,248,0.28) 0%, rgba(56,189,248,0) 36%)',
              'radial-gradient(circle at 82% 80%, rgba(251,146,60,0.2) 0%, rgba(251,146,60,0) 34%)',
              'linear-gradient(145deg, rgba(250,232,242,0.94) 0%, rgba(246,232,220,0.96) 68%, rgba(252,238,224,0.98) 100%)',
            ].join(', '),
          },
    [theme.palette.mode]
  );

  const handleCopyProfileLink = async () => {
    try {
      await navigator.clipboard.writeText(profileShareLink);
      setSnackbar({ open: true, message: 'Profile link copied', severity: 'success' });
    } catch (_) {
      setSnackbar({ open: true, message: `Copy failed. Link: ${profileShareLink}`, severity: 'info' });
    }
    setFabOpen(false);
  };

  const handleOpenReportDialog = () => {
    setReportCategory('');
    setReportReason('');
    setReportDialogOpen(true);
    setFabOpen(false);
  };

  const handleCloseReportDialog = () => {
    if (reportSubmitting) return;
    setReportDialogOpen(false);
  };

  // Guest profile has no real user ID — report submits a generic site report
  const handleSubmitUserReport = async () => {
    if (!reportCategory) {
      setSnackbar({ open: true, message: 'Please choose a report category', severity: 'warning' });
      return;
    }
    try {
      setReportSubmitting(true);
      await submitUserReport(null, null, reportReason || '', reportCategory);
      setReportDialogOpen(false);
      setSnackbar({ open: true, message: 'Report submitted', severity: 'success' });
    } catch (e) {
      const msg = e?.response?.data?.error || e?.message || 'Failed to submit report';
      setSnackbar({ open: true, message: msg, severity: 'error' });
    } finally {
      setReportSubmitting(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: 'calc(100vh - 64px)',
        width: '100%',
        position: 'relative',
        background: appCanvasBackground,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-start',
        alignItems: 'flex-start',
        pt: 4,
        pb: 4,
      }}
    >
      {/* ── Main profile card ──────────────────────────────────────────────── */}
      <Container maxWidth="md">
        <Paper
          sx={{
            p: 4,
            backgroundColor:
              theme.palette.mode === 'dark'
                ? 'rgba(0, 0, 0, 0.7)'
                : 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(10px)',
            borderRadius: 2,
            border: '1px solid',
            borderColor:
              theme.palette.mode === 'dark'
                ? 'rgba(255,255,255,0.16)'
                : 'rgba(15,23,42,0.18)',
            boxShadow: containerGlow,
          }}
        >
          <Grid container spacing={4}>
            {/* Profile header */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <UserAvatar
                  name={GUEST_PROFILE_USER.username}
                  avatarUrl={GUEST_PROFILE_USER.avatar_url}
                  id={GUEST_PROFILE_USER.id}
                  size={120}
                />
                <Box>
                  <Typography variant="h4" gutterBottom>
                    {GUEST_PROFILE_USER.username}
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Guest Account
                  </Typography>
                </Box>
              </Box>
            </Grid>

            <Grid item xs={12}>
              <Divider />
            </Grid>

            {/* Bio */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Bio
              </Typography>
              <Typography variant="body1">{GUEST_PROFILE_USER.bio}</Typography>
            </Grid>
          </Grid>
        </Paper>
      </Container>

      {/* ── NavFAB — mirrors Profile.js structure ──────────────────────────── */}
      {canShowMainProfileActions && (
        <ClickAwayListener onClickAway={() => setFabOpen(false)}>
          <Box
            sx={{
              position: 'fixed',
              right: { xs: 16, sm: 24 },
              bottom: { xs: 16, sm: 24 },
              zIndex: 1100,
            }}
          >
            <Box sx={{ position: 'relative' }}>
              {/* TradingCard share panel — slides in when FAB is open */}
              <TradingCard
                onActivate={handleCopyProfileLink}
                frameSx={{
                  position: 'absolute',
                  right: { xs: 70, sm: 82 },
                  bottom: 0,
                  boxShadow: fabOpen
                    ? '0 18px 40px rgba(15,23,42,0.35), 0 0 0 1px rgba(148,163,184,0.45)'
                    : '0 10px 24px rgba(15,23,42,0.18)',
                  transform: fabOpen
                    ? 'translateX(0) translateY(-6px) scale(1)'
                    : 'translateX(26px) translateY(6px) scale(0.92)',
                  opacity: fabOpen ? 1 : 0,
                  pointerEvents: fabOpen ? 'auto' : 'none',
                  transition: 'transform 0.5s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.25s ease',
                  transitionDelay: fabOpen ? '0.24s' : '0s',
                  zIndex: 1090,
                  '&:hover .guest-share-card-overlay': { opacity: 1 },
                  '&:hover .guest-share-card-image': {
                    filter: 'brightness(0.88) saturate(1.02)',
                  },
                }}
                imageUrl={GUEST_PROFILE_USER.avatar_url}
                imageAlt="Goblin guest profile"
                imageClassName="guest-share-card-image"
                imageSx={{
                  objectFit: 'contain',
                  filter: 'brightness(1.08) saturate(1.08)',
                }}
                fallbackSx={profileFallbackSx}
                label="PROFILE"
                title="GOBLIN"
                qrUrl={profileShareQrUrl}
                overlayClassName="guest-share-card-overlay"
                overlayText="Tap to Share"
                overlaySx={{ fontSize: '0.72rem' }}
              />

              <Stack direction="column" spacing={1.25} alignItems="flex-end">
                {/* Settings sub-action — omitted for guest (canOpenProfileSettings = false) */}
                {canOpenProfileSettings && (
                  <Box
                    sx={{
                      position: 'absolute',
                      bottom: fabOpen ? (canReportProfile ? 132 : 72) : 0,
                      right: 0,
                      opacity: fabOpen ? 1 : 0,
                      pointerEvents: fabOpen ? 'auto' : 'none',
                      transition:
                        'bottom 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease-in-out',
                      transitionDelay: fabOpen ? '0.12s' : '0s',
                      zIndex: 1135,
                    }}
                  >
                    <Tooltip title="Profile settings" placement="left">
                      <Fab size="small" color="secondary" aria-label="Open profile settings">
                        <SettingsOutlinedIcon fontSize="small" />
                      </Fab>
                    </Tooltip>
                  </Box>
                )}

                {/* Report sub-action */}
                {canReportProfile && (
                  <Box
                    sx={{
                      position: 'absolute',
                      bottom: fabOpen ? 72 : 0,
                      right: 0,
                      opacity: fabOpen ? 1 : 0,
                      pointerEvents: fabOpen ? 'auto' : 'none',
                      transition:
                        'bottom 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease-in-out',
                      transitionDelay: fabOpen ? '0.08s' : '0s',
                      zIndex: 1130,
                    }}
                  >
                    <Tooltip title="Report" placement="left">
                      <Fab
                        size="small"
                        color="error"
                        onClick={handleOpenReportDialog}
                        aria-label="Report guest profile"
                      >
                        <ReportProblemOutlinedIcon fontSize="small" />
                      </Fab>
                    </Tooltip>
                  </Box>
                )}

                {/* Main FAB toggle */}
                <Tooltip
                  title={fabOpen ? 'Close actions' : 'Profile actions'}
                  placement="left"
                >
                  <Fab
                    color="primary"
                    onClick={() => setFabOpen((prev) => !prev)}
                    aria-label="Profile actions"
                    sx={{
                      boxShadow: '0 10px 28px rgba(0,0,0,0.22)',
                      transform: fabOpen ? 'rotate(45deg)' : 'rotate(0deg)',
                      transition: 'transform 0.3s ease, background-color 0.2s ease',
                      zIndex: 1140,
                    }}
                  >
                    {fabOpen ? <ExpandLessIcon /> : <AddIcon />}
                  </Fab>
                </Tooltip>
              </Stack>
            </Box>
          </Box>
        </ClickAwayListener>
      )}

      {/* ── Report dialog ─────────────────────────────────────────────────── */}
      <Dialog
        open={reportDialogOpen}
        onClose={handleCloseReportDialog}
        fullWidth
        maxWidth="sm"
        PaperProps={{ sx: getGlassDialogPaperSx(theme) }}
      >
        <DialogTitle>Report Guest Profile</DialogTitle>
        <DialogContent sx={{ '& .MuiTextField-root': getGlassInputSx(theme) }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            This report creates a moderation ticket for Site Control.
          </Typography>
          <TextField
            select
            fullWidth
            margin="dense"
            label="Category"
            value={reportCategory}
            onChange={(e) => setReportCategory(e.target.value)}
          >
            {reportCategoryOptions.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            fullWidth
            margin="dense"
            multiline
            minRows={3}
            label="Reason (optional details)"
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
            placeholder="Add context for moderators"
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={handleCloseReportDialog}
            disabled={reportSubmitting}
            variant="contained"
            sx={{
              ...getGlassSquareActionButtonSx(theme),
              width: 'auto',
              minWidth: 84,
              px: 2,
              borderRadius: 1.4,
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmitUserReport}
            variant="contained"
            disabled={reportSubmitting}
            sx={{
              ...getGlassPillActionButtonSx(theme),
              bgcolor: theme.palette.error.main,
              color: '#fff',
              border: '1px solid',
              borderColor:
                theme.palette.mode === 'dark'
                  ? 'rgba(248,113,113,0.65)'
                  : 'rgba(220,38,38,0.55)',
              '&:hover': {
                bgcolor: theme.palette.error.dark,
                color: '#fff',
              },
            }}
          >
            {reportSubmitting ? 'Submitting...' : 'Submit Report'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Snackbar ──────────────────────────────────────────────────────── */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3500}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default GuestProfilePage;
