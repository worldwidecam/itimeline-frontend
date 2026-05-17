import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import { Box, Typography, Button, CircularProgress, Paper, useTheme } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ExploreIcon from '@mui/icons-material/Explore';
import LockIcon from '@mui/icons-material/Lock';
import api from '../../../utils/api';
import EventPopup from './EventPopup';
import { getGlassDialogPaperSx } from '../../../utils/formStyleGuide';

function EventSharePage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();

  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState(null);
  const [error, setError] = useState('');
  const [popupOpen, setPopupOpen] = useState(false);
  const [showExploreCard, setShowExploreCard] = useState(false);

  useEffect(() => {
    let active = true;

    const fetchEvent = async () => {
      if (!eventId) return;
      try {
        setLoading(true);
        setError('');
        const response = await api.get(`/api/v1/events/${eventId}`);
        if (active) {
          setEvent(response.data);
          setPopupOpen(true);
          setShowExploreCard(false);
        }
      } catch (err) {
        console.error('[EventSharePage] Error fetching shared event:', err);
        if (active) {
          const status = err?.response?.status;
          if (status === 403) {
            setError('This event belongs to a private timeline and is only visible to authorized members.');
          } else if (status === 404) {
            setError('The requested event could not be found. It may have been deleted.');
          } else {
            setError('This event is currently unavailable or undergoing moderation review.');
          }
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchEvent();

    return () => {
      active = false;
    };
  }, [eventId]);

  const handlePopupClose = () => {
    setPopupOpen(false);
    setShowExploreCard(true);
  };

  const isDark = theme.palette.mode === 'dark';

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 3,
        background: isDark
          ? 'radial-gradient(circle at 50% 50%, #0a1128 0%, #040814 100%)'
          : 'radial-gradient(circle at 50% 50%, #fff0e8 0%, #ffe0d3 100%)',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: '-20%',
          left: '-20%',
          width: '60%',
          height: '60%',
          borderRadius: '50%',
          filter: 'blur(120px)',
          background: isDark ? 'rgba(50, 100, 255, 0.08)' : 'rgba(255, 107, 107, 0.06)',
          pointerEvents: 'none',
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          bottom: '-20%',
          right: '-20%',
          width: '60%',
          height: '60%',
          borderRadius: '50%',
          filter: 'blur(120px)',
          background: isDark ? 'rgba(144, 202, 249, 0.06)' : 'rgba(255, 179, 137, 0.08)',
          pointerEvents: 'none',
        }
      }}
    >
      {/* Loading State */}
      {loading && (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <CircularProgress color="primary" size={50} />
          <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
            Verifying secure share link...
          </Typography>
        </Box>
      )}

      {/* Error / Locked State */}
      {!loading && error && (
        <Paper
          elevation={0}
          sx={{
            ...getGlassDialogPaperSx(theme),
            maxWidth: 500,
            width: '100%',
            p: 4,
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 3,
            border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.08)',
            boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.15)',
          }}
        >
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              backgroundColor: isDark ? 'rgba(239, 83, 80, 0.1)' : 'rgba(239, 83, 80, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'error.main',
            }}
          >
            <LockIcon sx={{ fontSize: 32 }} />
          </Box>

          <Box>
            <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1.5 }}>
              Event Unavailable
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.6 }}>
              {error}
            </Typography>
          </Box>

          <Button
            component={RouterLink}
            to="/home"
            variant="contained"
            color="primary"
            startIcon={<ArrowBackIcon />}
            sx={{
              borderRadius: '999px',
              px: 4,
              py: 1.2,
              fontWeight: 'bold',
              textTransform: 'none',
              boxShadow: '0 4px 14px 0 rgba(0,0,0,0.1)',
            }}
          >
            Return to Home
          </Button>
        </Paper>
      )}

      {/* Landing Explore Card (Shown after closing EventPopup) */}
      {!loading && !error && showExploreCard && (
        <Paper
          elevation={0}
          sx={{
            ...getGlassDialogPaperSx(theme),
            maxWidth: 520,
            width: '100%',
            p: 4,
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 3,
            border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.08)',
            boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.15)',
          }}
        >
          <Box
            sx={{
              fontFamily: "'Lobster', cursive",
              fontSize: '3rem',
              color: 'primary.main',
              transform: 'rotate(-2deg)',
              mb: 1,
            }}
          >
            iTimeline
          </Box>

          <Box>
            <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1.5 }}>
              Discover More Stories
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.6, px: 2 }}>
              You viewed a shared event from iTimeline. Explore the full parent timeline to see the context, chronological flow, and related stories.
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%', mt: 1 }}>
            {event?.timeline_id && (
              <Button
                component={RouterLink}
                to={`/timeline-v3/${event.timeline_id}`}
                variant="contained"
                color="primary"
                startIcon={<ExploreIcon />}
                sx={{
                  borderRadius: '999px',
                  py: 1.3,
                  fontWeight: 'bold',
                  textTransform: 'none',
                  boxShadow: '0 4px 14px 0 rgba(0,0,0,0.1)',
                }}
              >
                Explore Parent Timeline
              </Button>
            )}

            <Button
              component={RouterLink}
              to="/home"
              variant="outlined"
              color="primary"
              sx={{
                borderRadius: '999px',
                py: 1.3,
                fontWeight: 'bold',
                textTransform: 'none',
                borderWidth: '2px',
                '&:hover': {
                  borderWidth: '2px',
                }
              }}
            >
              Go to Home Page
            </Button>
          </Box>
        </Paper>
      )}

      {/* Render the core EventPopup */}
      {event && (
        <EventPopup
          event={event}
          open={popupOpen}
          onClose={handlePopupClose}
          hideActionMenu={true}
        />
      )}
    </Box>
  );
}

export default EventSharePage;
