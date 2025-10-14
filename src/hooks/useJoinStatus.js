import { useEffect, useState } from 'react';
import {
  getTimelineDetails,
  checkMembershipStatus,
  getBlockedMembers,
  fetchUserPassport,
  requestTimelineAccess,
} from '../utils/api';

/**
 * Headless hook that encapsulates Join/blocked membership logic for community timelines.
 * - No UI changes; purely provides state + actions
 * - Mirrors existing logic from TimelineV3 (SiteOwner/creator short-circuit, fallbacks, cache writes)
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

  // Persist to localStorage in the same format as existing code
  const persistMembershipStatus = (timelineIdArg, membership) => {
    try {
      const membershipKey = `timeline_membership_${timelineIdArg}`;
      const payload = {
        is_member: !!membership.is_member,
        is_active_member: membership.is_active_member !== false,
        role: membership.role || 'member',
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
      const hasPendingRequest = resp.role === 'pending';
      
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
      const result = await requestTimelineAccess(timelineId);
      // After join, force refresh to reconcile with server
      await refresh();
      return result;
    } catch (e) {
      console.error('[useJoinStatus] join failed:', e);
      return { success: false };
    }
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!timelineId) return;
      setLoading(true);

      try {
        // Fetch timeline details for visibility/creator
        const t = await getTimelineDetails(timelineId);
        if (!mounted) return;
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
        const hasPendingRequest = resp?.role === 'pending';
        console.log('[useJoinStatus] hasPendingRequest:', hasPendingRequest, 'role:', resp?.role);
        
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
