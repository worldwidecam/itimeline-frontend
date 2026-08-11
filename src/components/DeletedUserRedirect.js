import React from 'react';
import { useNavigate } from 'react-router-dom';
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
  Home as HomeIcon,
  ArrowBack as ArrowBackIcon,
  AccountCircle as AccountCircleIcon,
} from '@mui/icons-material';
import { getTimelineSurfaceTheme } from './timeline-v3/timelineSurfaceTheme';
import { getGlassDialogPaperSx } from '../utils/formStyleGuide';

const DeletedUserRedirect = ({ username }) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const appCanvasBackground = getTimelineSurfaceTheme(theme).canvas;

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
          mt: '-64px',
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
              ? 'rgba(148, 163, 184, 0.2)'
              : 'rgba(71, 85, 105, 0.15)',
            boxShadow: theme.palette.mode === 'dark'
              ? '0 24px 48px rgba(0,0,0,0.4), inset 0 0 0 1px rgba(148, 163, 184, 0.08)'
              : '0 24px 48px rgba(0,0,0,0.08), inset 0 0 0 1px rgba(71, 85, 105, 0.05)',
          }}
        >
          <Box sx={{ position: 'relative' }}>
            <Avatar
              src="/images/GUEST_img.png"
              alt="Deleted user"
              sx={{
                width: 120,
                height: 120,
                border: '3px solid',
                borderColor: theme.palette.mode === 'dark' ? 'rgba(148,163,184,0.4)' : 'rgba(71,85,105,0.3)',
                boxShadow: theme.palette.mode === 'dark'
                  ? '0 0 20px rgba(148, 163, 184, 0.15)'
                  : '0 0 20px rgba(71, 85, 105, 0.1)',
                opacity: 0.75,
                filter: 'grayscale(0.3)',
              }}
            />
            <Box
              sx={{
                position: 'absolute',
                bottom: -5,
                right: -5,
                bgcolor: theme.palette.mode === 'dark' ? '#334155' : '#94a3b8',
                color: 'white',
                borderRadius: '50%',
                p: 0.5,
                display: 'flex',
                border: '3px solid',
                borderColor: theme.palette.mode === 'dark' ? '#1e293b' : '#fff',
              }}
            >
              <AccountCircleIcon sx={{ fontSize: 20 }} />
            </Box>
          </Box>

          <Box>
            <Typography
              variant="h5"
              component="h1"
              sx={{
                fontWeight: 700,
                color: theme.palette.mode === 'dark' ? '#94a3b8' : '#475569',
                mb: 1.5,
              }}
            >
              This account no longer exists.
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
              {username
                ? <>The user <strong>@{username}</strong> has deleted their account.</>
                : 'The user who owned this profile has deleted their account.'}
            </Typography>
            <Typography
              variant="body2"
              sx={{
                fontStyle: 'italic',
                opacity: 0.65,
                bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                p: 1,
                borderRadius: 1,
                display: 'inline-block',
              }}
            >
              Their content on public timelines remains attributed to their username.
            </Typography>
          </Box>

          <Divider sx={{ width: '100%', opacity: 0.1 }} />

          <Stack direction="row" spacing={2} sx={{ width: '100%' }}>
            <Button
              variant="outlined"
              fullWidth
              startIcon={<ArrowBackIcon />}
              onClick={handleGoBack}
              sx={{ borderRadius: 99, py: 1.25, borderColor: 'divider' }}
            >
              Go Back
            </Button>
            <Button
              variant="outlined"
              fullWidth
              startIcon={<HomeIcon />}
              onClick={() => navigate('/home')}
              sx={{ borderRadius: 99, py: 1.25, borderColor: 'divider' }}
            >
              Home
            </Button>
          </Stack>
        </Paper>
      </Box>
    </>
  );
};

export default DeletedUserRedirect;
