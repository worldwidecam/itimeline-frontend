import React from 'react';
import { useNavigate, useLocation, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Avatar,
  Paper,
  Stack,
  useTheme,
  GlobalStyles,
  Divider,
} from '@mui/material';
import {
  Lock as LockIcon,
  Home as HomeIcon,
  Login as LoginIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { getTimelineSurfaceTheme } from './timeline-v3/timelineSurfaceTheme';
import { getGlassDialogPaperSx, getGlassPillActionButtonSx } from '../utils/formStyleGuide';

const GoblinRedirect = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const appCanvasBackground = getTimelineSurfaceTheme(theme).canvas;

  // Attempt to get the intended destination from location state or search params
  const destination = new URLSearchParams(location.search).get('returnTo') || 'this destination';

  const handleGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/home');
    }
  };

  return (
    <>
      <GlobalStyles styles={{ 'html, body': { background: appCanvasBackground } }} />
      <Box
        sx={{
          minHeight: '100vh',
          width: '100%',
          background: appCanvasBackground,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          mt: '-64px', // Offset for navbar if present
          px: 3,
          gap: 4,
        }}
      >
        <Paper
          elevation={0}
          sx={{
            ...getGlassDialogPaperSx(theme),
            p: { xs: 4, md: 6 },
            maxWidth: 500,
            width: '100%',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 3,
            border: '1px solid',
            borderColor: theme.palette.mode === 'dark' 
              ? 'rgba(134, 239, 172, 0.2)' 
              : 'rgba(22, 101, 52, 0.15)',
            boxShadow: theme.palette.mode === 'dark'
              ? '0 24px 48px rgba(0,0,0,0.4), inset 0 0 0 1px rgba(134, 239, 172, 0.1)'
              : '0 24px 48px rgba(0,0,0,0.1), inset 0 0 0 1px rgba(22, 101, 52, 0.05)',
          }}
        >
          {/* ── Goblin Icon ────────────────────────────────────────────────── */}
          <Box sx={{ position: 'relative' }}>
            <Avatar
              src="/images/GUEST_img.png"
              alt="Goblin guest"
              sx={{ 
                width: 120, 
                height: 120, 
                border: '3px solid', 
                borderColor: theme.palette.mode === 'dark' ? '#86efac' : '#166534',
                boxShadow: theme.palette.mode === 'dark'
                  ? '0 0 20px rgba(134, 239, 172, 0.3)'
                  : '0 0 20px rgba(22, 101, 52, 0.15)',
              }}
            />
            <Box
              sx={{
                position: 'absolute',
                bottom: -5,
                right: -5,
                bgcolor: theme.palette.error.main,
                color: 'white',
                borderRadius: '50%',
                p: 0.5,
                display: 'flex',
                border: '3px solid',
                borderColor: theme.palette.mode === 'dark' ? '#1e293b' : '#fff',
              }}
            >
              <LockIcon sx={{ fontSize: 20 }} />
            </Box>
          </Box>

          {/* ── Text Content ──────────────────────────────────────────────── */}
          <Box>
            <Typography
              variant="h4"
              component="h1"
              sx={{
                fontWeight: 700,
                color: theme.palette.mode === 'dark' ? '#86efac' : '#166534',
                mb: 1.5,
              }}
            >
              Halt, Goblin!
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
              You've stumbled upon a hidden path reserved for authenticated members.
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                fontStyle: 'italic',
                opacity: 0.8,
                bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                p: 1,
                borderRadius: 1,
                display: 'inline-block'
              }}
            >
              Goblin Mode (view-only) cannot enter here.
            </Typography>
          </Box>

          <Divider sx={{ width: '100%', opacity: 0.1 }} />

          {/* ── Action Buttons ────────────────────────────────────────────── */}
          <Stack spacing={2} sx={{ width: '100%' }}>
            <Button
              variant="contained"
              fullWidth
              startIcon={<LoginIcon />}
              component={RouterLink}
              to="/login"
              sx={{
                ...getGlassPillActionButtonSx(theme),
                py: 1.5,
                bgcolor: theme.palette.mode === 'dark' ? 'primary.dark' : 'primary.main',
                color: 'white',
                '&:hover': {
                  bgcolor: theme.palette.mode === 'dark' ? 'primary.main' : 'primary.dark',
                }
              }}
            >
              Login or Register
            </Button>
            
            <Stack direction="row" spacing={2} sx={{ width: '100%' }}>
              <Button
                variant="outlined"
                fullWidth
                startIcon={<ArrowBackIcon />}
                onClick={handleGoBack}
                sx={{
                  borderRadius: 99,
                  py: 1.25,
                  borderColor: 'divider',
                }}
              >
                Go Back
              </Button>
              <Button
                variant="outlined"
                fullWidth
                startIcon={<HomeIcon />}
                onClick={() => navigate('/home')}
                sx={{
                  borderRadius: 99,
                  py: 1.25,
                  borderColor: 'divider',
                }}
              >
                Home
              </Button>
            </Stack>
          </Stack>
        </Paper>

        <Typography variant="caption" color="text.secondary" sx={{ opacity: 0.5 }}>
          Authorized members can access {destination} after signing in.
        </Typography>
      </Box>
    </>
  );
};

export default GoblinRedirect;
