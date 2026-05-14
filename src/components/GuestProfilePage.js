import React, { useState, useMemo } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  Divider,
  Switch,
  Snackbar,
  Alert,
} from '@mui/material';
import { useTheme as useMuiTheme, alpha } from '@mui/material/styles';
import { useAuth } from '../contexts/AuthContext';
import { useTheme as useAppTheme } from '../contexts/ThemeContext';
import UserAvatar from './common/UserAvatar';
import NavFab from './timeline-v3/community/NavFab';
import { getTimelineSurfaceTheme } from './timeline-v3/timelineSurfaceTheme';
import { displayUsername } from '../utils/usernameDisplay';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
// Report dialog imports removed - guest profile has no actual user to report

// ── Hardcoded guest identity — no DB row, no API call ──────────────────────
const GUEST_PROFILE_USER = {
  id: null,
  username: 'Goblin',
  bio: 'You are a Common Goblin. Only Lurking allowed for you Little Goblin. Log-in if you want more.',
  email: null,
  created_at: null,
  avatar_url: '/images/GUEST_img.png',
};


const GOBLIN_NEON_GREEN = '#39ff14';

const GuestProfilePage = () => {
  const { user } = useAuth();
  const theme = useMuiTheme();
  const { isDarkMode, toggleTheme } = useAppTheme();
  const appCanvasBackground = getTimelineSurfaceTheme(theme).canvas;

  const [fabOpen, setFabOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const containerGlow =
    theme.palette.mode === 'dark'
      ? `
          0 0 0 1.5px ${alpha(GOBLIN_NEON_GREEN, 0.95)},
          0 0 10px ${alpha(GOBLIN_NEON_GREEN, 0.55)},
          0 0 24px ${alpha(GOBLIN_NEON_GREEN, 0.4)},
          0 12px 34px rgba(0, 0, 0, 0.42)
        `
      : `
          0 0 0 1.5px ${alpha(GOBLIN_NEON_GREEN, 0.95)},
          0 0 10px ${alpha(GOBLIN_NEON_GREEN, 0.55)},
          0 0 24px ${alpha(GOBLIN_NEON_GREEN, 0.4)},
          0 12px 26px rgba(15, 23, 42, 0.16)
        `;

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
            position: 'relative',
            p: 4,
            backgroundColor:
              theme.palette.mode === 'dark'
                ? 'rgba(0, 0, 0, 0.7)'
                : 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(10px)',
            borderRadius: 2,
            border: '1px solid',
            borderColor: alpha(GOBLIN_NEON_GREEN, 0.9),
            boxShadow: containerGlow,
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              top: 14,
              right: 16,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              px: 1.5,
              py: 0.75,
              borderRadius: 999,
              backgroundColor:
                theme.palette.mode === 'dark'
                  ? 'rgba(255, 255, 255, 0.05)'
                  : 'rgba(0, 0, 0, 0.03)',
              backdropFilter: 'blur(6px)',
              transition: 'background-color 0.3s ease',
            }}
          >
            <Switch
              size="medium"
              checked={isDarkMode}
              onChange={toggleTheme}
              sx={{
                mr: 0.25,
                '& .MuiSwitch-switchBase': {
                  '&.Mui-checked': {
                    color: '#90caf9',
                    '& + .MuiSwitch-track': {
                      backgroundColor: '#90caf9',
                    },
                  },
                },
                '& .MuiSwitch-thumb': {
                  backgroundColor: isDarkMode ? '#90caf9' : '#f4b942',
                },
                '& .MuiSwitch-track': {
                  backgroundColor: isDarkMode
                    ? 'rgba(144, 202, 249, 0.5)'
                    : 'rgba(244, 185, 66, 0.5)',
                },
              }}
              inputProps={{ 'aria-label': 'Toggle light and dark theme' }}
            />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              {isDarkMode ? (
                <DarkModeIcon
                  sx={{
                    fontSize: 20,
                    color: '#90caf9',
                    animation: 'fadeIn 0.3s ease-in',
                    '@keyframes fadeIn': {
                      '0%': { opacity: 0, transform: 'scale(0.8)' },
                      '100%': { opacity: 1, transform: 'scale(1)' },
                    },
                  }}
                />
              ) : (
                <LightModeIcon
                  sx={{
                    fontSize: 20,
                    color: '#f4b942',
                    animation: 'fadeIn 0.3s ease-in',
                    '@keyframes fadeIn': {
                      '0%': { opacity: 0, transform: 'scale(0.8)' },
                      '100%': { opacity: 1, transform: 'scale(1)' },
                    },
                  }}
                />
              )}
              <Typography
                variant="body2"
                sx={{
                  color: isDarkMode ? '#90caf9' : '#f4b942',
                  fontWeight: 700,
                  lineHeight: 1,
                }}
              >
                {isDarkMode ? 'Dark' : 'Light'} Mode
              </Typography>
            </Box>
          </Box>

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
                    {displayUsername(GUEST_PROFILE_USER.username)}
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
        actions={[]}
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
          isRestricted: false,
        }}
      />

      {/* Report dialog removed - guest profile has no actual user to report */}

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
