import { useCallback, useEffect, useMemo, useState } from 'react';
import { castVote, getVoteStats, removeVote } from '../api/voteApi';
import { uiToBackend, backendToUi } from '../api/voteTypeConverter';
import { getCookie } from '../utils/cookies';

const baseStats = () => ({ promote_count: 0, demote_count: 0, user_vote: null });
const baseState = () => ({
  value: null,
  stats: baseStats(),
  loading: false,
  error: null,
  loaded: false,
});

const normalizeStats = (stats = {}) => {
  const resolved = {
    promote_count: stats.promote_count ?? stats.promoteCount ?? stats.promote ?? 0,
    demote_count: stats.demote_count ?? stats.demoteCount ?? stats.demote ?? 0,
    user_vote: stats.user_vote ?? stats.userVote ?? stats.vote ?? null,
  };
  return {
    ...stats,
    promote_count: Number(resolved.promote_count || 0),
    demote_count: Number(resolved.demote_count || 0),
    user_vote: resolved.user_vote ?? null,
  };
};

export const getVoteState = (eventId) => getState(eventId);

export const subscribeVoteState = (eventId, listener) => subscribe(eventId, listener);

export const loadVoteStatsForEvent = async (eventId, tokenOverride = null) => {
  if (!eventId) return;
  const current = getState(eventId);
  if (current.loading || current.loaded) return;

  setState(eventId, { loading: true, error: null });

  try {
    const token = tokenOverride || getCookie('access_token') || localStorage.getItem('access_token');
    if (!token) {
      throw new Error('Not authenticated');
    }
    const stats = normalizeStats(await getVoteStats(eventId, token));
    setState(eventId, {
      stats,
      value: backendToUi(stats.user_vote),
      loading: false,
      error: null,
      loaded: true,
    });
  } catch (error) {
    setState(eventId, {
      loading: false,
      error: error.message || 'Failed to load votes',
      loaded: true,
    });
  }
};

const voteStateById = new Map();
const listenersById = new Map();

export const clearVoteStateCache = () => {
  voteStateById.clear();
  listenersById.clear();
};

const getState = (eventId) => {
  if (!eventId) return baseState();
  return voteStateById.get(eventId) || baseState();
};

const notify = (eventId) => {
  const listeners = listenersById.get(eventId);
  if (!listeners) return;
  const state = getState(eventId);
  listeners.forEach((listener) => listener(state));
};

const setState = (eventId, updater) => {
  if (!eventId) return;
  const prev = getState(eventId);
  const next = typeof updater === 'function' ? updater(prev) : updater;
  const resolved = {
    ...prev,
    ...next,
    value: Object.prototype.hasOwnProperty.call(next, 'value') ? next.value : prev.value,
    stats: next.stats || prev.stats || baseStats(),
    loaded: Object.prototype.hasOwnProperty.call(next, 'loaded') ? next.loaded : prev.loaded,
  };
  voteStateById.set(eventId, resolved);
  notify(eventId);
};

const subscribe = (eventId, listener) => {
  if (!eventId) return () => {};
  let listeners = listenersById.get(eventId);
  if (!listeners) {
    listeners = new Set();
    listenersById.set(eventId, listeners);
  }
  listeners.add(listener);
  return () => {
    const current = listenersById.get(eventId);
    if (!current) return;
    current.delete(listener);
    if (current.size === 0) {
      listenersById.delete(eventId);
    }
  };
};

export const useEventVote = (eventId, options = {}) => {
  const { enabled = true } = options;
  const [state, setLocalState] = useState(() => getState(eventId));

  useEffect(() => {
    if (!eventId) return undefined;
    setLocalState(getState(eventId));
    return subscribe(eventId, setLocalState);
  }, [eventId]);

  const loadVoteStats = useCallback(async () => {
    if (!eventId) return;
    const current = getState(eventId);
    if (current.loading) return;

    setState(eventId, { loading: true, error: null });

    try {
      const token = getCookie('access_token') || localStorage.getItem('access_token');
      if (!token) {
        throw new Error('Not authenticated');
      }
      const stats = normalizeStats(await getVoteStats(eventId, token));
      setState(eventId, {
        stats,
        value: backendToUi(stats.user_vote),
        loading: false,
        error: null,
        loaded: true,
      });
    } catch (error) {
      setState(eventId, {
        loading: false,
        error: error.message || 'Failed to load votes',
        loaded: true,
      });
    }
  }, [eventId]);

  const refresh = useCallback(() => {
    if (!eventId) return;
    setState(eventId, { loaded: false });
    loadVoteStats();
  }, [eventId, loadVoteStats]);

  const handleVoteChange = useCallback(
    async (uiVoteType) => {
      if (!eventId) return;
      const previousValue = getState(eventId).value ?? null;

      setState(eventId, {
        value: uiVoteType,
        loading: true,
        error: null,
      });

      try {
        const token = getCookie('access_token') || localStorage.getItem('access_token');
        if (!token) {
          throw new Error('Not authenticated');
        }
        const backendVoteType = uiToBackend(uiVoteType);
        const stats = normalizeStats(
          backendVoteType === null
            ? await removeVote(eventId, token)
            : await castVote(eventId, backendVoteType, token)
        );
        setState(eventId, {
          stats,
          value: backendToUi(stats.user_vote),
          loading: false,
          error: null,
          loaded: true,
        });
      } catch (error) {
        setState(eventId, {
          value: previousValue,
          loading: false,
          error: error.message || 'Failed to cast vote',
        });
      }
    },
    [eventId]
  );

  useEffect(() => {
    if (!enabled || !eventId) return;
    const current = getState(eventId);
    if (!current.loaded && !current.loading) {
      loadVoteStats();
    }
  }, [enabled, eventId, loadVoteStats]);

  const totalVotes = useMemo(() => {
    const stats = state.stats || baseStats();
    return (stats.promote_count || 0) + (stats.demote_count || 0);
  }, [state.stats]);

  const positiveRatio = useMemo(() => {
    return totalVotes > 0
      ? (state.stats?.promote_count || 0) / totalVotes
      : 0.5;
  }, [state.stats, totalVotes]);

  return {
    value: state.value ?? null,
    stats: state.stats || baseStats(),
    totalVotes,
    positiveRatio,
    isLoading: !!state.loading,
    error: state.error,
    handleVoteChange,
    refresh,
  };
};
