import { useEffect, useState, useCallback, useRef } from 'react';
import {
  getTimelineDetails,
  checkMembershipStatus,
  getBlockedMembers,
  fetchUserPassport,
  requestTimelineAccess,
} from '../utils/api';

// Global broadcast channel for cross-component membership sync
const getBroadcastChannel = () => {
  if (typeof BroadcastChannel !== 'undefined') {
    return new BroadcastChannel('membership_sync');
  }
  return null;
};

/**
 * Headless hook that encapsulates Join/blocked membership logic for community timelines.
 * - No UI changes; purely provides state + actions
 * - Mirrors existing logic from TimelineV3 (SiteOwner/creator short-circuit, fallbacks, cache writes)
 * - Syncs state across component instances via BroadcastChannel
 */
export default function useJoinStatus(timelineId, { user } = {}) {
  // Initialize as null so consumers can distinguish "unknown/loading" from a real boolean
  const [isMember, setIsMember] = useState(null);
  const [isBlocked, setIsBlocked] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [role, setRole] = useState(null);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [visibility, setVisibility] = useState('public');
  const [creatorId, setCreatorId] = useState(null);
  const [timelineType, setTimelineType] = useState(null);
  const broadcastRef = useRef(null);

  // Persist to localStorage in the same format as existing code
  const persistMembershipStatus = (timelineIdArg, membership) => {
    try {
      const membershipKey = `timeline_membership_${timelineIdArg}`;
      const payload = {
        is_member: !!membership.is_member,
        is_active_member: membership.is_active_member !== false,
        is_pending: membership.status === 'pending' || membership.is_pending === true,
        role: membership.role || 'member',
        status: membership.status || null,
        timeline_visibility: membership.timeline_visibility || visibility,
        joined_at: membership.joined_at || new Date().toISOString(),
        is_blocked: membership.is_blocked === true,
        timestamp: new Date().toISOString(),
      };
      localStorage.setItem(membershipKey, JSON.stringify(payload));
    } catch (e) {
      console.warn('[useJoinStatus] Failed to persist membership:', e);
    }
  };

  const refresh = async () => {
    if (!timelineId) return;
    try {
      const resp = await checkMembershipStatus(timelineId, 0, true);
      const processed = {
        ...resp,
        is_blocked: resp.is_blocked === true,
      };
      
      // Check if user has a pending request
      const hasPendingRequest = resp.status === 'pending';
      
      processed.is_member = (resp.is_active_member !== false) && (resp.is_member === true) && (processed.is_blocked !== true);
      setIsMember(!!processed.is_member);
      setIsBlocked(!!processed.is_blocked);
      setIsPending(hasPendingRequest);
      setRole(processed.role || null);
      setStatus(hasPendingRequest ? 'pending' : (processed.status || null));
      persistMembershipStatus(timelineId, processed);
      return processed;
    } catch (e) {
      console.warn('[useJoinStatus] refresh failed:', e);
      return { is_member: false, is_blocked: false, role: null };
    }
  };

  const join = async () => {
    if (!timelineId) return { success: false };
    try {
      // Set optimistic pending state immediately for instant UI feedback
      setIsPending(true);
      setIsMember(false);
      setStatus('pending');
      
      // Broadcast optimistic state immediately so other components sync right away
      broadcastStateChange(timelineId, {
        is_member: false,
        is_pending: true,
        status: 'pending',
        role: role,
        is_blocked: false,
      });
      
      const result = await requestTimelineAccess(timelineId);
      // After join, force refresh to reconcile with server
      const refreshed = await refresh();
      // Broadcast confirmed state after refresh
      broadcastStateChange(timelineId, refreshed);
      return result;
    } catch (e) {
      console.error('[useJoinStatus] join failed:', e);
      // Revert optimistic state on error
      setIsPending(false);
      setStatus(null);
      broadcastStateChange(timelineId, {
        is_member: false,
        is_pending: false,
        status: null,
        role: null,
        is_blocked: false,
      });
      return { success: false };
    }
  };

  // Broadcast state change to other component instances
  const broadcastStateChange = useCallback((tid, state) => {
    try {
      const bc = getBroadcastChannel();
      if (bc && tid) {
        bc.postMessage({
          type: 'MEMBERSHIP_UPDATE',
          timelineId: tid,
          state: {
            is_member: state?.is_member,
            is_pending: state?.status === 'pending' || state?.is_pending,
            status: state?.status,
            role: state?.role,
            is_blocked: state?.is_blocked,
            timestamp: new Date().toISOString(),
          },
        });
        bc.close();
      }
    } catch (e) {
      // BroadcastChannel not supported or error - silently fail
    }
  }, []);

  // Listen for state changes from other components
  useEffect(() => {
    if (!timelineId) return;
    
    try {
      const bc = getBroadcastChannel();
      if (!bc) return;
      
      broadcastRef.current = bc;
      
      bc.onmessage = (event) => {
        const { type, timelineId: msgTimelineId, state } = event.data || {};
        if (type === 'MEMBERSHIP_UPDATE' && msgTimelineId === timelineId) {
          console.log('[useJoinStatus] Received broadcast update:', state);
          // Update local state to match broadcast
          if (state.is_member !== undefined) setIsMember(!!state.is_member);
          if (state.is_pending !== undefined) setIsPending(!!state.is_pending);
          if (state.status !== undefined) setStatus(state.status);
          if (state.role !== undefined) setRole(state.role);
          if (state.is_blocked !== undefined) setIsBlocked(!!state.is_blocked);
        }
      };
      
      return () => {
        bc.close();
        broadcastRef.current = null;
      };
    } catch (e) {
      // BroadcastChannel not supported - silently fail
    }
  }, [timelineId]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!timelineId || timelineId === 'new') {
        if (!mounted) return;
        setIsMember(false);
        setIsBlocked(false);
        setIsPending(false);
        setRole(null);
        setStatus(null);
        setLoading(false);
        return;
      }
      setLoading(true);

      try {
        // Fetch timeline details for visibility/creator
        const t = await getTimelineDetails(timelineId);
        if (!mounted) return;
        // If this timeline is locked for the current user, treat 403 as an expected state
        if (t && t.error && t.statusCode === 403) {
          const isBannedTimeline = String(t?.errorCode || '').toLowerCase() === 'timeline_banned';
          setVisibility(t?.visibility || 'public');
          setTimelineType(t?.timeline_type || null);
          setCreatorId(t?.created_by ?? null);
          setIsMember(false);
          setIsBlocked(false);
          setIsPending(false);
          setRole(null);
          setStatus(isBannedTimeline ? 'banned' : 'locked');
          setLoading(false);
          return;
        }

        setVisibility(t?.visibility || 'public');
        setTimelineType(t?.timeline_type || null);
        setCreatorId(t?.created_by ?? null);

        // SiteOwner short-circuit
        if (user?.id === 1) {
          if (!mounted) return;
          setIsMember(true);
          setIsBlocked(false);
          setRole('SiteOwner');
          setStatus('joined');
          persistMembershipStatus(timelineId, { is_member: true, is_active_member: true, role: 'SiteOwner', timeline_visibility: t?.visibility });
          return;
        }

        // Creator short-circuit
        if (t?.created_by && user?.id && Number(t.created_by) === Number(user.id)) {
          if (!mounted) return;
          setIsMember(true);
          setIsBlocked(false);
          setRole('admin');
          setStatus('joined');
          persistMembershipStatus(timelineId, { is_member: true, is_active_member: true, role: 'admin', timeline_visibility: t?.visibility });
          return;
        }

        // Regular users — membership status primary call (force fresh read to avoid stale cache)
        const resp = await checkMembershipStatus(timelineId, 0, true);
        console.log('[useJoinStatus] Membership status response:', resp);
        if (!mounted) return;
        let processed = {
          ...resp,
          is_blocked: resp?.is_blocked === true,
        };
        
        // Check if user has a pending request
        const hasPendingRequest = resp?.status === 'pending';
        console.log('[useJoinStatus] hasPendingRequest:', hasPendingRequest, 'status:', resp?.status);
        
        processed.is_member = (resp?.is_active_member !== false) && (resp?.is_member === true) && (processed.is_blocked !== true);

        // If API didn't include is_blocked and user is not a member, run fallbacks
        if (!('is_blocked' in resp) && processed.is_member === false) {
          let resolved = false;
          // Fallback A: blocked members listing (may 403)
          try {
            const blocked = await getBlockedMembers(timelineId);
            const list = Array.isArray(blocked) ? blocked : blocked?.data || [];
            const found = !!list.find((m) => Number(m.user_id || m.id) === Number(user?.id));
            processed.is_blocked = found;
            resolved = true;
          } catch (e) {
            // Expected 403 for non-privileged users
          }
          // Fallback B: user passport
          if (!resolved) {
            try {
              const memberships = await fetchUserPassport();
              const m = memberships.find((mm) => Number(mm.timeline_id) === Number(timelineId));
              processed.is_blocked = !!m?.is_blocked;
            } catch (e2) {
              // ignore
            }
          }
          // Final: force-refresh once
          try {
            const fresh = await checkMembershipStatus(timelineId, 0, true);
            if (Object.prototype.hasOwnProperty.call(fresh, 'is_blocked')) {
              processed.is_blocked = !!fresh.is_blocked;
            }
            processed.is_member = (fresh?.is_active_member !== false) && (fresh?.is_member === true) && (processed.is_blocked !== true);
          } catch (e3) {
            // ignore
          }
        }

        if (!mounted) return;
        console.log('[useJoinStatus] Setting states - isMember:', !!processed.is_member, 'isPending:', hasPendingRequest, 'role:', processed.role);
        setIsMember(!!processed.is_member);
        setIsBlocked(!!processed.is_blocked);
        setIsPending(hasPendingRequest);
        setRole(processed.role || null);
        setStatus(hasPendingRequest ? 'pending' : (processed.status || null));
        persistMembershipStatus(timelineId, { ...processed, timeline_visibility: t?.visibility });
      } catch (e) {
        if (!mounted) return;
        // Default to non-member on error
        setIsMember(false);
        setIsBlocked(false);
        setIsPending(false);
        setRole(null);
        setStatus(null);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timelineId, user?.id]);

  return {
    isMember,
    isBlocked,
    isPending,
    role,
    status,
    loading,
    visibility,
    creatorId,
    timelineType,
    join,
    refresh,
  };
}
