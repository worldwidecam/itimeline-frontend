import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Paper,
  Stack,
  useTheme,
  GlobalStyles,
  Divider,
} from '@mui/material';
import {
  Home as HomeIcon,
  ArrowBack as ArrowBackIcon,
  Timeline as TimelineIcon,
} from '@mui/icons-material';
import { getTimelineSurfaceTheme } from './timeline-v3/timelineSurfaceTheme';
import { getGlassDialogPaperSx } from '../utils/formStyleGuide';

const DeletedTimelineRedirect = ({ timelineName }) => {
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
          {/* -- Timeline Icon ------------------------------------------------- */}
          <Box
            sx={{
              width: 100,
              height: 100,
              borderRadius: '50%',
              bgcolor: theme.palette.mode === 'dark' ? 'rgba(148,163,184,0.1)' : 'rgba(71,85,105,0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid',
              borderColor: theme.palette.mode === 'dark' ? 'rgba(148,163,184,0.3)' : 'rgba(71,85,105,0.2)',
            }}
          >
            <TimelineIcon sx={{ fontSize: 48, color: theme.palette.mode === 'dark' ? '#94a3b8' : '#64748b' }} />
          </Box>

          {/* -- Text Content ------------------------------------------------ */}
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
              This timeline no longer exists.
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
              {timelineName
                ? <>The timeline <strong>{timelineName}</strong> was deleted by its owner.</>
                : 'This timeline has been deleted by its owner.'}
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
              Any posts shared across other timelines remain intact.
            </Typography>
          </Box>

          <Divider sx={{ width: '100%', opacity: 0.1 }} />

          {/* -- Action Buttons ---------------------------------------------- */}
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

export default DeletedTimelineRedirect;
