import React from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Divider,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import VoteControls from './timeline-v3/events/VoteControls';
import api from '../utils/api';
import { castVote, getVoteStats, removeVote } from '../api/voteApi';
import { uiToBackend, backendToUi } from '../api/voteTypeConverter';
import { getCookie } from '../utils/cookies';

const DEFAULT_VISIBLE_COUNT = 10;

const VoteTestPage = () => {
  const [timelines, setTimelines] = React.useState([]);
  const [selectedTimelineId, setSelectedTimelineId] = React.useState('');
  const [events, setEvents] = React.useState([]);
  const [visibleCount, setVisibleCount] = React.useState(DEFAULT_VISIBLE_COUNT);
  const [loadingTimelines, setLoadingTimelines] = React.useState(false);
  const [loadingEvents, setLoadingEvents] = React.useState(false);
  const [voteStateById, setVoteStateById] = React.useState({});
  const [pageError, setPageError] = React.useState('');
  const [museumPromoteCount, setMuseumPromoteCount] = React.useState(6);
  const [museumDemoteCount, setMuseumDemoteCount] = React.useState(4);
  const [museumUserVote, setMuseumUserVote] = React.useState('up');
  const [museumLoading, setMuseumLoading] = React.useState(false);
  const [museumError, setMuseumError] = React.useState(false);

  const visibleEvents = React.useMemo(
    () => events.slice(0, visibleCount),
    [events, visibleCount]
  );

  const museumTotals = React.useMemo(() => {
    const promote = Math.max(0, Number(museumPromoteCount) || 0);
    const demote = Math.max(0, Number(museumDemoteCount) || 0);
    const total = promote + demote;
    const ratio = total > 0 ? promote / total : 0.5;
    return {
      promote,
      demote,
      total,
      ratio,
      percent: Math.round(ratio * 100),
    };
  }, [museumPromoteCount, museumDemoteCount]);

  const loadTimelines = React.useCallback(async () => {
    try {
      setLoadingTimelines(true);
      setPageError('');
      const response = await api.get('/api/timeline-v3');
      const items = response.data || [];
      setTimelines(items);
      if (items.length > 0) {
        setSelectedTimelineId(String(items[0].id));
      }
    } catch (error) {
      console.error('VoteTestPage: Failed to load timelines', error);
      setPageError('Failed to load timelines');
    } finally {
      setLoadingTimelines(false);
    }
  }, []);

  const hydrateVoteStateForEvents = React.useCallback((nextEvents) => {
    setVoteStateById((prev) => {
      const nextState = { ...prev };
      nextEvents.forEach((event) => {
        if (!nextState[event.id]) {
          nextState[event.id] = {
            value: null,
            stats: null,
            loading: false,
            error: null,
          };
        }
      });
      Object.keys(nextState).forEach((key) => {
        if (!nextEvents.find((event) => String(event.id) === String(key))) {
          delete nextState[key];
        }
      });
      return nextState;
    });
  }, []);

  const loadEvents = React.useCallback(async (timelineId) => {
    if (!timelineId) return;
    try {
      setLoadingEvents(true);
      setPageError('');
      const response = await api.get(`/api/timeline-v3/${timelineId}/events`);
      const items = response.data || [];
      setEvents(items);
      setVisibleCount(DEFAULT_VISIBLE_COUNT);
      hydrateVoteStateForEvents(items);
    } catch (error) {
      console.error('VoteTestPage: Failed to load events', error);
      setPageError('Failed to load events for this timeline');
    } finally {
      setLoadingEvents(false);
    }
  }, [hydrateVoteStateForEvents]);

  const loadVoteStatsForEvent = React.useCallback(async (eventId) => {
    if (!eventId) return;
    setVoteStateById((prev) => ({
      ...prev,
      [eventId]: {
        ...(prev[eventId] || {}),
        loading: true,
        error: null,
      },
    }));

    try {
      const token = getCookie('access_token') || localStorage.getItem('access_token');
      if (!token) {
        setVoteStateById((prev) => ({
          ...prev,
          [eventId]: {
            ...(prev[eventId] || {}),
            loading: false,
            error: 'Not authenticated',
          },
        }));
        return;
      }

      const stats = await getVoteStats(eventId, token);
      setVoteStateById((prev) => ({
        ...prev,
        [eventId]: {
          ...(prev[eventId] || {}),
          stats,
          value: backendToUi(stats.user_vote),
          loading: false,
          error: null,
        },
      }));
    } catch (error) {
      console.error('VoteTestPage: Failed to load vote stats', error);
      setVoteStateById((prev) => ({
        ...prev,
        [eventId]: {
          ...(prev[eventId] || {}),
          loading: false,
          error: error.message || 'Failed to load votes',
        },
      }));
    }
  }, []);

  const loadVotesForVisibleEvents = React.useCallback(() => {
    visibleEvents.forEach((event) => {
      if (event?.id) {
        loadVoteStatsForEvent(event.id);
      }
    });
  }, [loadVoteStatsForEvent, visibleEvents]);

  const handleVoteChange = React.useCallback(
    (eventId) => async (uiVoteType) => {
      const previousValue = voteStateById[eventId]?.value ?? null;

      setVoteStateById((prev) => ({
        ...prev,
        [eventId]: {
          ...(prev[eventId] || {}),
          value: uiVoteType,
          loading: true,
          error: null,
        },
      }));

      try {
        const token = getCookie('access_token') || localStorage.getItem('access_token');
        if (!token) {
          throw new Error('Not authenticated');
        }
        const backendVoteType = uiToBackend(uiVoteType);
        const stats = backendVoteType === null
          ? await removeVote(eventId, token)
          : await castVote(eventId, backendVoteType, token);
        setVoteStateById((prev) => ({
          ...prev,
          [eventId]: {
            ...(prev[eventId] || {}),
            stats,
            value: backendToUi(stats.user_vote),
            loading: false,
            error: null,
          },
        }));
      } catch (error) {
        console.error('VoteTestPage: Failed to cast vote', error);
        setVoteStateById((prev) => ({
          ...prev,
          [eventId]: {
            ...(prev[eventId] || {}),
            value: previousValue,
            loading: false,
            error: error.message || 'Failed to cast vote',
          },
        }));
      }
    },
    [voteStateById]
  );

  React.useEffect(() => {
    loadTimelines();
  }, [loadTimelines]);

  React.useEffect(() => {
    if (selectedTimelineId) {
      loadEvents(selectedTimelineId);
    }
  }, [selectedTimelineId, loadEvents]);

  React.useEffect(() => {
    if (visibleEvents.length > 0) {
      loadVotesForVisibleEvents();
    }
  }, [visibleEvents, loadVotesForVisibleEvents]);

  return (
    <Box sx={{ px: 4, pb: 6 }}>
      <Typography variant="h4" sx={{ mb: 1, fontWeight: 700 }}>
        Vote Test Bench
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Temporary page to validate vote behavior with real backend data. No mock data is used here.
      </Typography>

      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          Components under test
        </Typography>
        <Stack spacing={0.5} sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>
          <span>VoteControls — src/components/timeline-v3/events/VoteControls.js</span>
          <span>EventPopup (Remark) — src/components/timeline-v3/events/EventPopup.js</span>
          <span>NewsEventPopup — src/components/timeline-v3/events/NewsEventPopup.js</span>
          <span>AudioMediaPopup — src/components/timeline-v3/events/AudioMediaPopup.js</span>
          <span>VideoEventPopup — src/components/timeline-v3/events/VideoEventPopup.js</span>
          <span>ImageEventPopup — src/components/timeline-v3/events/ImageEventPopup.js</span>
        </Stack>
      </Box>

      <Divider sx={{ mb: 3 }} />

      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" sx={{ mb: 1, fontWeight: 700 }}>
          Vote Control Museum
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Adjust the numbers to stress-test the pill fill animation and state changes.
        </Typography>

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} sx={{ mb: 2 }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Anatomy checklist
            </Typography>
            <Stack spacing={0.5} sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>
              <span>Outer container: rounded pill border.</span>
              <span>Green fill: promote share of total votes.</span>
              <span>Red fill: demote share of total votes.</span>
              <span>Center divider: marks the split between green/red.</span>
              <span>Percentage label: currently rendered beside the pill.</span>
            </Stack>
          </Box>

          <Box sx={{ flex: 1, minWidth: 260 }}>
            <Stack spacing={2}>
              <TextField
                label="Promote count"
                type="number"
                size="small"
                value={museumPromoteCount}
                onChange={(event) => setMuseumPromoteCount(event.target.value)}
                inputProps={{ min: 0 }}
              />
              <TextField
                label="Demote count"
                type="number"
                size="small"
                value={museumDemoteCount}
                onChange={(event) => setMuseumDemoteCount(event.target.value)}
                inputProps={{ min: 0 }}
              />
              <FormControl size="small">
                <InputLabel id="museum-vote-state">User vote</InputLabel>
                <Select
                  labelId="museum-vote-state"
                  label="User vote"
                  value={museumUserVote}
                  onChange={(event) => setMuseumUserVote(event.target.value)}
                >
                  <MenuItem value="up">Upvote</MenuItem>
                  <MenuItem value="down">Downvote</MenuItem>
                  <MenuItem value="neutral">Neutral</MenuItem>
                </Select>
              </FormControl>
              <Stack direction="row" spacing={2}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={museumLoading}
                      onChange={(event) => setMuseumLoading(event.target.checked)}
                    />
                  }
                  label="Loading"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={museumError}
                      onChange={(event) => setMuseumError(event.target.checked)}
                    />
                  }
                  label="Error"
                />
              </Stack>
            </Stack>
          </Box>
        </Stack>

        <Box
          sx={{
            p: 2,
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            alignItems: { xs: 'flex-start', md: 'center' },
            justifyContent: 'space-between',
            gap: 2,
          }}
        >
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              Museum Preview
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Promote: {museumTotals.promote} · Demote: {museumTotals.demote} · Total: {museumTotals.total}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Positive share: {museumTotals.percent}%
            </Typography>
          </Box>

          <VoteControls
            value={museumUserVote === 'neutral' ? null : museumUserVote}
            onChange={() => {}}
            positiveRatio={museumTotals.ratio}
            totalVotes={museumTotals.total}
            isLoading={museumLoading}
            hasError={museumError}
          />
        </Box>
      </Box>

      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" sx={{ mb: 1, fontWeight: 700 }}>
          State Exhibits
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Static previews of key states. These do not send API requests.
        </Typography>

        <Stack spacing={2}>
          {[
            {
              title: 'Neutral / No vote',
              value: null,
              ratio: 0.5,
            },
            {
              title: 'Hover up (preview)',
              value: null,
              ratio: 0.5,
              hoverDirection: 'up',
            },
            {
              title: 'Hover down (preview)',
              value: null,
              ratio: 0.5,
              hoverDirection: 'down',
            },
            {
              title: 'Upvote active (80/20)',
              value: 'up',
              ratio: 0.8,
            },
            {
              title: 'Downvote active (20/80)',
              value: 'down',
              ratio: 0.2,
            },
            {
              title: 'Loading state',
              value: 'up',
              ratio: 0.6,
              isLoading: true,
            },
            {
              title: 'Error pulse',
              value: 'down',
              ratio: 0.4,
              hasError: true,
            },
          ].map((exhibit) => (
            <Box
              key={exhibit.title}
              sx={{
                p: 2,
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 2,
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {exhibit.title}
              </Typography>
              <VoteControls
                value={exhibit.value}
                onChange={() => {}}
                positiveRatio={exhibit.ratio}
                isLoading={!!exhibit.isLoading}
                hasError={!!exhibit.hasError}
                hoverDirection={exhibit.hoverDirection || null}
              />
            </Box>
          ))}
        </Stack>
      </Box>

      <Divider sx={{ mb: 3 }} />

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3, alignItems: 'center' }}>
        <FormControl size="small" sx={{ minWidth: 220 }} disabled={loadingTimelines}>
          <InputLabel id="vote-test-timeline">Timeline</InputLabel>
          <Select
            labelId="vote-test-timeline"
            label="Timeline"
            value={selectedTimelineId}
            onChange={(event) => setSelectedTimelineId(event.target.value)}
          >
            {timelines.map((timeline) => (
              <MenuItem key={timeline.id} value={String(timeline.id)}>
                {timeline.name || `Timeline ${timeline.id}`}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Button
          variant="outlined"
          onClick={loadVotesForVisibleEvents}
          disabled={loadingEvents || visibleEvents.length === 0}
        >
          Refresh Vote Stats
        </Button>

        {(loadingTimelines || loadingEvents) && <CircularProgress size={20} />}
      </Stack>

      {pageError && (
        <Typography variant="body2" color="error" sx={{ mb: 2 }}>
          {pageError}
        </Typography>
      )}

      <Stack spacing={2}>
        {visibleEvents.map((event) => {
          const voteState = voteStateById[event.id] || {};
          const stats = voteState.stats || { promote_count: 0, demote_count: 0, user_vote: null };
          const totalVotes = (stats.promote_count || 0) + (stats.demote_count || 0);
          const positiveRatio = totalVotes > 0
            ? (stats.promote_count || 0) / totalVotes
            : 0.5;

          return (
            <Box
              key={event.id}
              sx={{
                p: 2,
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider',
                display: 'flex',
                flexDirection: { xs: 'column', md: 'row' },
                alignItems: { xs: 'flex-start', md: 'center' },
                justifyContent: 'space-between',
                gap: 2,
              }}
            >
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  {event.title || 'Untitled event'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  ID: {event.id} · Type: {event.type || 'unknown'}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  Promote: {stats.promote_count || 0} · Demote: {stats.demote_count || 0}
                </Typography>
                {voteState.error && (
                  <Typography variant="body2" color="error" sx={{ mt: 0.5 }}>
                    {voteState.error}
                  </Typography>
                )}
              </Box>

              <VoteControls
                value={voteState.value ?? null}
                onChange={handleVoteChange(event.id)}
                positiveRatio={positiveRatio}
                totalVotes={(stats.promote_count || 0) + (stats.demote_count || 0)}
                isLoading={voteState.loading}
                hasError={!!voteState.error}
              />
            </Box>
          );
        })}
      </Stack>

      {events.length > visibleCount && (
        <Button
          sx={{ mt: 3 }}
          variant="text"
          onClick={() => setVisibleCount((count) => count + DEFAULT_VISIBLE_COUNT)}
        >
          Load more events
        </Button>
      )}
    </Box>
  );
};

export default VoteTestPage;
