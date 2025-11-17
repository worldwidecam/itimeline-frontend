import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, CircularProgress, Typography, Button } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';

// Simple, local slug helper for Phase 1 (no backend coupling yet)
const slugify = (name) => {
  if (!name) return '';
  return name
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // remove unsafe chars
    .replace(/\s+/g, '-')          // spaces -> hyphens
    .replace(/-+/g, '-')            // collapse multiple hyphens
    .replace(/^-|-$/g, '');         // trim leading/trailing hyphens
};

function PersonalTimelineWrapper() {
  const { username, slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [status, setStatus] = useState('loading'); // 'loading' | 'resolved' | 'not_found' | 'unsupported' | 'error'
  const [errorMessage, setErrorMessage] = useState('');

  const expectedUsername = useMemo(() => (user ? user.username : null), [user]);

  useEffect(() => {
    // Phase 1 guard: must be logged in and username must match current user
    if (!user) {
      setStatus('unsupported');
      setErrorMessage('You must be logged in to view a personal timeline.');
      return;
    }

    if (!username || !slug) {
      setStatus('error');
      setErrorMessage('Personal timeline URL is missing information.');
      return;
    }

    if (username !== expectedUsername) {
      // Phase 1: only own personal timelines are supported
      setStatus('unsupported');
      setErrorMessage('Viewing other users\' personal timelines is not available yet.');
      return;
    }

    const resolveTimeline = async () => {
      try {
        setStatus('loading');

        // Reuse the same endpoint the Home page uses
        const response = await api.get('/api/timeline-v3');
        const timelines = Array.isArray(response.data) ? response.data : [];

        console.log('[PersonalTimelineWrapper] Resolving personal timeline', {
          username,
          expectedUsername,
          slug,
          totalTimelines: timelines.length,
          userId: user.id,
        });

        // Phase 2: only treat timelines explicitly marked as personal and owned by this user
        const candidates = timelines.filter((t) => {
          const createdBy = Number(t.created_by);
          const currentUserId = Number(user.id);
          const type = (t.timeline_type || '').toLowerCase();
          return createdBy === currentUserId && type === 'personal';
        });

        console.log('[PersonalTimelineWrapper] Personal candidates for user', {
          candidates: candidates.map((t) => ({
            id: t.id,
            name: t.name,
            type: t.timeline_type,
            slug: slugify(t.name),
          })),
        });

        const matching = candidates.find((t) => slugify(t.name) === slug.toLowerCase());

        if (!matching) {
          setStatus('not_found');
          return;
        }

        // On success, redirect to the richer route that includes username, slug, and id
        setStatus('resolved');
        navigate(`/timeline-v3/${username}/${slug}/${matching.id}`, { replace: true });
      } catch (err) {
        console.error('[PersonalTimelineWrapper] Failed to resolve personal timeline:', err);
        setErrorMessage('Could not load personal timeline information.');
        setStatus('error');
      }
    };

    resolveTimeline();
  }, [user, username, slug, expectedUsername, navigate]);

  if (status === 'loading') {
    return (
      <Box
        sx={{
          minHeight: 'calc(100vh - 64px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (status === 'resolved') {
    // We navigated away; render nothing here.
    return null;
  }

  const title =
    status === 'not_found'
      ? 'Personal timeline not set up yet'
      : status === 'unsupported'
      ? 'Personal timeline not available'
      : 'Personal timelines are coming soon';

  return (
    <Box
      sx={{
        minHeight: 'calc(100vh - 64px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        px: 2,
        textAlign: 'center',
      }}
    >
      <Typography variant="h4" gutterBottom>
        {title}
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 600, mb: 3 }}>
        {status === 'not_found' && (
          <>
            We couldn\'t find a personal timeline named <strong>{slug}</strong> for <strong>{username}</strong> yet.
            <br />
            Phase 1 is wiring up the routes and resolver; creation and management flows will be added in a later phase.
          </>
        )}
        {status === 'unsupported' && <>{errorMessage}</>}
        {status === 'error' && <>{errorMessage || 'Something went wrong while loading this personal timeline.'}</>}
        {status !== 'not_found' && status !== 'unsupported' && status !== 'error' && (
          <>
            We\'re preparing a dedicated Personal Timeline experience for <strong>{username}</strong>.
            <br />
            This URL pattern <code>/timeline-v3/{username}/{slug}</code> is reserved and will soon display
            a fully functional personal timeline powered by the same engine as community timelines.
          </>
        )}
      </Typography>
      <Button variant="outlined" onClick={() => navigate('/home')}>
        Back to Home
      </Button>
    </Box>
  );
}

export default PersonalTimelineWrapper;
