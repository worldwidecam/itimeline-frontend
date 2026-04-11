import React, { useState, useMemo } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  Divider,
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
import { useTheme } from '@mui/material/styles';
import { useAuth } from '../contexts/AuthContext';
import UserAvatar from './common/UserAvatar';
import NavFab from './timeline-v3/community/NavFab';
import { getTimelineSurfaceTheme } from './timeline-v3/timelineSurfaceTheme';
import { submitUserReport } from '../utils/api';
import OutlinedFlagIcon from '@mui/icons-material/OutlinedFlag';
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

  // Logged-in real users can report; guests cannot report themselves
  const canReportProfile = Boolean(user) && !user?.role?.includes('guest');

  const containerGlow =
    theme.palette.mode === 'dark'
      ? '0 8px 32px rgba(0, 0, 0, 0.3)'
      : '0 8px 32px rgba(0, 0, 0, 0.1)';

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

      {/* ── NavFAB — uses shared NavFab component ─────────────────────────── */}
      <NavFab
        expanded={fabOpen}
        onToggleExpanded={() => setFabOpen((prev) => !prev)}
        onCollapse={() => setFabOpen(false)}
        bottom={{ xs: 16, sm: 24 }}
        right={{ xs: 16, sm: 24 }}
        containerZIndex={1100}
        mainTooltipClosed="Profile actions"
        mainTooltipOpen="Close actions"
        showCreate={false}
        showMembersNav={false}
        showAdminNav={false}
        showReport={false}
        actions={[
          ...(canReportProfile ? [{
            key: 'report-guest',
            tooltip: 'Report',
            icon: <OutlinedFlagIcon fontSize="small" />,
            onClick: handleOpenReportDialog,
            step: 58,
            accent: { dark: '#EF5350', light: '#D32F2F' },
          }] : []),
        ]}
        tradingCard={{
          onActivate: handleCopyProfileLink,
          imageUrl: GUEST_PROFILE_USER.avatar_url,
          imageAlt: 'Goblin guest profile',
          imageClassName: 'guest-share-card-image',
          overlayClassName: 'guest-share-card-overlay',
          imageSx: {
            objectFit: 'cover',
            filter: 'brightness(1.08) saturate(1.08)',
          },
          fallbackSx: profileFallbackSx,
          label: 'PROFILE',
          title: 'GOBLIN',
          qrUrl: profileShareQrUrl,
          overlayText: 'Tap to Share',
          overlaySx: { fontSize: '0.72rem' },
        }}
      />

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
