import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import {
  Box,
  Typography,
  IconButton,
  TextField,
  Button,
  useTheme,
  CircularProgress,
  Divider,
  Tooltip,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  Close as CloseIcon,
  Send as SendIcon,
  ArrowUpward as UpvoteIcon,
  ArrowDownward as DownvoteIcon,
  Reply as ReplyIcon,
  Cancel as CancelIcon,
  Settings as GearIcon,
  KeyboardDoubleArrowDownRounded as KeyboardDoubleArrowDownRoundedIcon,
  Comment as CommentIcon,
  SubdirectoryArrowRight as SubdirectoryArrowRightIcon,
  MoreHoriz as MoreHorizIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence, useDragControls, useMotionValue, animate } from 'framer-motion';
import { useAuth } from '../../../contexts/AuthContext';
import UserAvatar from '../../common/UserAvatar';
import RichContentRenderer from './RichContentRenderer';
import api from '../../../utils/api';
import { useNavigate } from 'react-router-dom';
import { getGlassSquareActionButtonSx } from '../../../utils/formStyleGuide';

// Session cache for comments and scroll states to persist across mount/unmount transitions
const commentsCache = {}; // eventId -> comments array
const scrollPositionsCache = {}; // eventId -> scrollTop
const scrolledUpCache = {}; // eventId -> boolean

// Read-only helper for other components to check cached comment count without importing state
export const getCachedCommentCount = (eventId) => {
  const cached = eventId != null ? commentsCache[eventId] : null;
  return Array.isArray(cached) ? cached.length : null;
};

/**
 * EventCommentDrawer - Slide-up comments section for event popups
 * Renders in custom vellum styling for light mode, slate drafting for dark mode.
 */
const EventCommentDrawer = ({ eventId, open, onClose, eventCreatorId, eventColor }) => {
  const theme = useTheme();
  const dragControls = useDragControls();
  const drawerY = useMotionValue(0);

  // Reset drawer Y position to bottom BEFORE first paint whenever open becomes true.
  // This prevents the MotionValue (which starts at 0) from overriding the enter animation
  // and causing the drawer to flash at the top of the popup.
  useLayoutEffect(() => {
    if (open) {
      drawerY.set(typeof window !== 'undefined' ? window.innerHeight : 800);
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
  const { user, isGuest } = useAuth();
  const navigate = useNavigate();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [replyTo, setReplyTo] = useState(null); // comment object we are replying to
  const [minimizedComments, setMinimizedComments] = useState(new Set()); // Set of comment IDs that are minimized
  const [collapsingParentId, setCollapsingParentId] = useState(null); // Parent comment ID whose replies are currently collapsing
  const [isScrolledUp, setIsScrolledUp] = useState(false);
  const [hasNewComments, setHasNewComments] = useState(false);
  const scrollContainerRef = useRef(null);
  const commentInputRef = useRef(null);
  const [scrollRestored, setScrollRestored] = useState(false);
  const activeEventIdRef = useRef(null);
  const [sortBy, setSortBy] = useState(() => {
    return localStorage.getItem('comment_sort_preference') || 'oldest';
  });

  const handleSortChange = (newSortBy) => {
    if (newSortBy === sortBy) return;
    setSortBy(newSortBy);
    localStorage.setItem('comment_sort_preference', newSortBy);

    setTimeout(() => {
      if (newSortBy === 'top') {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTo({
            top: 0,
            behavior: 'smooth'
          });
        }
      } else {
        scrollToBottom('smooth');
      }
    }, 50);
  };

  // Fetch comments
  const fetchComments = async (isBackground = false) => {
    if (!eventId) return;
    if (!isBackground) setLoading(true);
    const startTime = Date.now();
    try {
      const res = await api.get(`/api/v1/comments/event/${eventId}`);
      const fetched = res.data?.data || [];

      // Update session cache
      commentsCache[eventId] = fetched;

      setComments((prev) => {
        if (isBackground && prev.length > 0 && fetched.length > prev.length) {
          setHasNewComments(true);
        }
        return fetched;
      });

      if (!isBackground) {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, 1200 - elapsed);
        if (remaining > 0) {
          await new Promise((resolve) => setTimeout(resolve, remaining));
        }
      }
    } catch (err) {
      console.error('Error fetching comments:', err);
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      setMinimizedComments(new Set());
      setCollapsingParentId(null);
      const isDifferentEvent = eventId !== activeEventIdRef.current;

      if (isDifferentEvent) {
        activeEventIdRef.current = eventId;
        const cached = commentsCache[eventId];

        if (cached) {
          // Instantly populate drawer with cached comments
          setComments(cached);
          setLoading(false);
          setHasNewComments(false);
          setIsScrolledUp(scrolledUpCache[eventId] || false);
          setScrollRestored(false);

          // Background refresh silently
          const timer = setTimeout(() => {
            fetchComments(true);
          }, 350);
          setReplyTo(null);
          return () => clearTimeout(timer);
        } else {
          // Clean transition: slide up empty, show modern loader, fetch comments
          setComments([]);
          setLoading(true);
          setHasNewComments(false);
          setIsScrolledUp(false);
          setScrollRestored(false);

          const timer = setTimeout(() => {
            fetchComments(false);
          }, 350);
          setReplyTo(null);
          return () => clearTimeout(timer);
        }
      } else {
        // Reopened same event comments: slide up immediately with existing comments
        setScrollRestored(false);
        const timer = setTimeout(() => {
          fetchComments(true);
        }, 350);
        setReplyTo(null);
        return () => clearTimeout(timer);
      }
    } else {
      setScrollRestored(false);
    }
  }, [open, eventId]);

  // Prevent mobile browser pull-to-refresh when open
  useEffect(() => {
    if (open) {
      const prevHtmlOverscroll = document.documentElement.style.overscrollBehaviorY;
      const prevBodyOverscroll = document.body.style.overscrollBehaviorY;

      document.documentElement.style.overscrollBehaviorY = 'contain';
      document.body.style.overscrollBehaviorY = 'contain';

      return () => {
        document.documentElement.style.overscrollBehaviorY = prevHtmlOverscroll;
        document.body.style.overscrollBehaviorY = prevBodyOverscroll;
      };
    }
  }, [open]);

  // Reset scrollRestored state when drawer closes so it triggers scroll restoration on next open
  useEffect(() => {
    if (!open) {
      setScrollRestored(false);
      setMinimizedComments(new Set());
      setCollapsingParentId(null);
    }
  }, [open]);

  // Restore scroll position immediately when DOM mounts comments
  useEffect(() => {
    if (open && !scrollRestored && scrollContainerRef.current && comments.length > 0) {
      const cachedPos = scrollPositionsCache[eventId];
      if (cachedPos !== undefined) {
        scrollContainerRef.current.scrollTop = cachedPos;
      } else {
        if (sortBy === 'top') {
          scrollContainerRef.current.scrollTop = 0;
        } else {
          scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
        }
      }
      setScrollRestored(true);
    }
  }, [open, scrollRestored, comments, eventId, sortBy]);

  // Scroll to bottom helper
  const scrollToBottom = (behavior = 'auto') => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior,
      });
      setIsScrolledUp(false);
      setHasNewComments(false);
      if (eventId) {
        scrollPositionsCache[eventId] = scrollContainerRef.current.scrollTop;
        scrolledUpCache[eventId] = false;
      }
    }
  };

  // Scroll event handler to show/hide "scroll to latest" button and save scroll position
  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
      const isScrolled = scrollHeight - scrollTop - clientHeight > 80;
      setIsScrolledUp(isScrolled);
      if (!isScrolled) {
        setHasNewComments(false);
      }

      // Save scroll position in cache
      if (eventId) {
        scrollPositionsCache[eventId] = scrollTop;
        scrolledUpCache[eventId] = isScrolled;
      }
    }
  };

  // Handle touch swiping down from the top of the comment body to close the drawer
  useEffect(() => {
    const scrollEl = scrollContainerRef.current;
    if (!scrollEl || !open) return;

    let startY = 0;
    let lastClientY = 0;
    let startScrollTop = 0;
    let activeDrag = false;
    let hasDraggedUp = false;

    const handleTouchStart = (e) => {
      if (e.touches.length !== 1) return;
      e.stopPropagation();
      startY = e.touches[0].clientY;
      lastClientY = e.touches[0].clientY;
      startScrollTop = scrollEl.scrollTop;
      activeDrag = false;
      hasDraggedUp = false;
    };

    const handleTouchMove = (e) => {
      if (e.touches.length !== 1) return;
      e.stopPropagation();

      const currentY = e.touches[0].clientY;
      const deltaY = currentY - startY;

      // Track if the user has dragged upward significantly in this gesture
      if (deltaY < -10) {
        hasDraggedUp = true;
      }

      const isScrollAtTop = scrollEl.scrollTop <= 0;
      const isMovingDown = currentY > lastClientY;

      // Only transition to dragging the drawer if the gesture started at the very top,
      // is currently at the top, moving down, and has not dragged upward during this touch sequence.
      if (!activeDrag && startScrollTop <= 0 && isScrollAtTop && isMovingDown && deltaY > 5 && !hasDraggedUp) {
        activeDrag = true;
        startY = currentY; // reset startY to current touch position to start drag from 0
      }

      if (activeDrag) {
        if (e.cancelable) {
          e.preventDefault();
        }
        const dragDistance = currentY - startY;
        drawerY.set(Math.max(0, dragDistance));
      }

      lastClientY = currentY;
    };

    const handleTouchEnd = (e) => {
      if (e && typeof e.stopPropagation === 'function') {
        e.stopPropagation();
      }
      if (activeDrag) {
        activeDrag = false;
        const currentY = drawerY.get();
        if (currentY > 120) {
          onClose();
        } else {
          // Spring snap back to fully open (y = 0)
          animate(drawerY, 0, { type: 'spring', damping: 25, stiffness: 200 });
        }
      }
    };

    scrollEl.addEventListener('touchstart', handleTouchStart, { passive: true });
    scrollEl.addEventListener('touchmove', handleTouchMove, { passive: false });
    scrollEl.addEventListener('touchend', handleTouchEnd);
    scrollEl.addEventListener('touchcancel', handleTouchEnd);

    return () => {
      scrollEl.removeEventListener('touchstart', handleTouchStart);
      scrollEl.removeEventListener('touchmove', handleTouchMove);
      scrollEl.removeEventListener('touchend', handleTouchEnd);
      scrollEl.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [open, onClose, drawerY]);


  // Submit new comment or reply
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputValue.trim() || submitting || isGuest) return;

    const isReply = !!replyTo;
    setSubmitting(true);
    try {
      const payload = {
        eventId,
        content: inputValue.trim(),
        parentId: replyTo ? replyTo.id : null,
      };

      const res = await api.post('/api/v1/comments', payload);
      const newComment = res.data;

      // Add to list and clear input
      setComments((prev) => {
        const next = [...prev, newComment];
        commentsCache[eventId] = next;
        return next;
      });
      setInputValue('');
      setReplyTo(null);

      // Smooth scroll to make sure the comment is fully visible on screen (nearest scroll)
      setTimeout(() => {
        if (isReply) {
          const el = document.getElementById(`comment-row-${newComment.id}`);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }
        } else {
          scrollToBottom('smooth');
        }
      }, 100);
    } catch (err) {
      console.error('Error posting comment:', err);
    } finally {
      setSubmitting(false);
    }
  };

  // Upvote/downvote comment
  const handleVote = async (commentId, type) => {
    if (isGuest) return;

    // Find current comment and check if we are toggling
    const commentIndex = comments.findIndex((c) => c.id === commentId);
    if (commentIndex === -1) return;

    const currentComment = comments[commentIndex];
    const currentVote = currentComment.my_vote;
    let nextVote = type;

    if (currentVote === type) {
      nextVote = 'none';
    }

    // Optimistically update UI
    setComments((prev) => {
      const clone = [...prev];
      const target = clone[commentIndex];
      let upDelta = 0;
      let downDelta = 0;

      // Retract old vote
      if (currentVote === 'up') upDelta = -1;
      if (currentVote === 'down') downDelta = -1;

      // Add new vote
      if (nextVote === 'up') upDelta += 1;
      if (nextVote === 'down') downDelta += 1;

      clone[commentIndex] = {
        ...target,
        my_vote: nextVote === 'none' ? null : nextVote,
        upvotes: target.upvotes + upDelta,
        downvotes: target.downvotes + downDelta,
      };
      commentsCache[eventId] = clone;
      return clone;
    });

    try {
      await api.post(`/api/v1/comments/${commentId}/vote`, { voteType: nextVote });
    } catch (err) {
      console.error('Failed to submit comment vote:', err);
      // Revert in case of failure
      fetchComments();
    }
  };

  // Delete comment
  const handleDeleteComment = async (commentId) => {
    if (isGuest) return;

    try {
      await api.delete(`/api/v1/comments/${commentId}`);
      // Refresh to respect physical/moderated soft deletes
      fetchComments();
    } catch (err) {
      console.error('Error deleting comment:', err);
    }
  };

  // Click Reply: set reply parent and auto-focus typing field
  const handleReplyClick = (comment) => {
    setReplyTo(comment);
    setTimeout(() => {
      if (commentInputRef.current) {
        commentInputRef.current.focus();
      }
    }, 50);
  };

  // Collapse/expand individual comment bubble into a pill
  const handleToggleMinimize = (commentId, hasReplies = false) => {
    const currentlyMinimized = minimizedComments.has(commentId);

    if (currentlyMinimized) {
      // Expand: remove from minimized set
      setMinimizedComments((prev) => {
        const next = new Set(prev);
        next.delete(commentId);
        return next;
      });
    } else {
      // Minimize
      if (hasReplies) {
        // Cascade collapse: set collapsingParentId so replies start exit animation
        setCollapsingParentId(commentId);
        setTimeout(() => {
          setMinimizedComments((prev) => {
            const next = new Set(prev);
            next.add(commentId);
            return next;
          });
          setCollapsingParentId(null);
        }, 300); // Duration matches exit animation (300ms)
      } else {
        // Instant collapse for replies or parent comments without replies
        setMinimizedComments((prev) => {
          const next = new Set(prev);
          next.add(commentId);
          return next;
        });
      }
    }
  };

  // Click L-arrow: collapse intermediate replies and show parent comment
  const handleLArrowClick = (reply) => {
    const parentId = reply.parentId;
    if (!parentId) return;

    // Find the thread replies mapping by building the threads context
    const { repliesMap } = buildThreads();

    // Helper to find root comment ID
    const findRootId = (pId) => {
      let current = comments.find((x) => x.id === pId);
      if (!current) return null;
      if (!current.parentId) return current.id;
      return findRootId(current.parentId);
    };

    const rootId = findRootId(reply.parentId);
    if (!rootId) return;

    const threadReplies = repliesMap[rootId] || [];

    // Find parent and current reply indexes in the list
    const parentIdx = threadReplies.findIndex((x) => x.id === parentId);
    const replyIdx = threadReplies.findIndex((x) => x.id === reply.id);

    if (replyIdx === -1) return;

    // Determine replies in between parent and child reply
    const toCollapse = [];
    threadReplies.forEach((r, idx) => {
      if (idx > parentIdx && idx < replyIdx) {
        toCollapse.push(r.id);
      }
    });

    // Collapse intermediate replies
    if (toCollapse.length > 0) {
      setMinimizedComments((prev) => {
        const next = new Set(prev);
        toCollapse.forEach((id) => next.add(id));
        return next;
      });
    }

    // Ensure the parent, root, and this reply are expanded
    setMinimizedComments((prev) => {
      if (prev.has(parentId) || prev.has(reply.id) || prev.has(rootId)) {
        const next = new Set(prev);
        next.delete(parentId);
        next.delete(reply.id);
        next.delete(rootId);
        return next;
      }
      return prev;
    });

    // Nearest scroll parent, then reply into viewport
    setTimeout(() => {
      const parentEl = document.getElementById(`comment-row-${parentId}`);
      const replyEl = document.getElementById(`comment-row-${reply.id}`);

      if (parentEl) {
        parentEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
      if (replyEl) {
        setTimeout(() => {
          replyEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 150);
      }
    }, 150);
  };

  // Group threads
  const buildThreads = () => {
    const rootComments = [];
    const repliesMap = {};

    comments.forEach((c) => {
      if (!c.parentId) {
        rootComments.push(c);
        repliesMap[c.id] = [];
      }
    });

    // Helper to find root comment parent ID
    const findRootId = (parentId) => {
      let current = comments.find((x) => x.id === parentId);
      if (!current) return null;
      if (!current.parentId) return current.id;
      return findRootId(current.parentId);
    };

    comments.forEach((c) => {
      if (c.parentId) {
        const rootId = findRootId(c.parentId);
        if (rootId && repliesMap[rootId]) {
          repliesMap[rootId].push(c);
        } else {
          // treat as root if parent isn't loaded/found
          rootComments.push(c);
          repliesMap[c.id] = [];
        }
      }
    });

    // Sort root comments by creation time or net score
    if (sortBy === 'top') {
      rootComments.sort((a, b) => {
        const scoreA = (a.upvotes || 0) - (a.downvotes || 0);
        const scoreB = (b.upvotes || 0) - (b.downvotes || 0);
        if (scoreB !== scoreA) {
          return scoreB - scoreA;
        }
        return new Date(a.createdAt) - new Date(b.createdAt);
      });
    } else {
      rootComments.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    }

    // Sort replies within thread by creation time
    Object.keys(repliesMap).forEach((rootId) => {
      repliesMap[rootId].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    });

    return { rootComments, repliesMap };
  };

  const { rootComments, repliesMap } = buildThreads();

  // Helper to format timestamps dynamically: e.g., "just now", "1 hr ago", "3 Days ago"
  const formatCommentTimestamp = (createdAt) => {
    try {
      const date = new Date(createdAt);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);
      const diffWeeks = Math.floor(diffMs / 604800000);
      const diffMonths = Math.floor(diffMs / 2592000000);
      const diffYears = Math.floor(diffMs / 31536000000);

      if (diffMins < 1) return 'just now';
      if (diffMins < 60) return `${diffMins} min ago`;
      if (diffHours < 24) return `${diffHours} hr${diffHours > 1 ? 's' : ''} ago`;
      if (diffDays < 7) return `${diffDays} Day${diffDays > 1 ? 's' : ''} ago`;
      if (diffWeeks < 4) return `${diffWeeks} Week${diffWeeks > 1 ? 's' : ''} ago`;
      if (diffMonths < 12) return `${diffMonths} Month${diffMonths > 1 ? 's' : ''} ago`;
      return `${diffYears} Year${diffYears > 1 ? 's' : ''} ago`;
    } catch (err) {
      return '';
    }
  };

  const isTagLog = (c) => {
    if (c.type !== 'system') return false;
    const content = c.content || '';
    return content.includes('says this is') || content.includes('no longer thinks');
  };

  // Styling helpers matching vellum paper look
  const isDarkMode = theme.palette.mode === 'dark';
  const activeColor = eventColor || '#2196f3';
  const baseBg = isDarkMode ? '#0b1220' : '#f3ede0';

  // Mix background and event colors using color-mix to prevent scroll-through bleed
  const bottomMixColor = isDarkMode
    ? `color-mix(in srgb, #0b1220 85%, ${activeColor})`
    : `color-mix(in srgb, #f3ede0 85%, ${activeColor})`;

  const drawerBg = `linear-gradient(to bottom, ${baseBg} 50%, ${bottomMixColor} 100%)`;
  const textPrimary = isDarkMode ? 'rgba(255, 255, 255, 0.9)' : '#2e2721';
  const textSecondary = isDarkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(46, 39, 33, 0.6)';
  const charcoalBorder = isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(80, 70, 60, 0.2)';
  const inputBg = isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(255, 255, 255, 0.5)';

  // Bubble style picker
  const getBubbleStyle = (c) => {
    const isOp = Number(c.userId) === Number(eventCreatorId);

    if (c.type === 'system') {
      // Lavender/Plum - Mirrored gradient (dim to bright)
      return {
        bg: isDarkMode ? 'linear-gradient(135deg, rgba(168, 143, 184, 0.08) 0%, rgba(168, 143, 184, 0.22) 100%)' : 'rgba(168, 143, 184, 0.2)',
        border: isDarkMode ? 'rgba(168, 143, 184, 0.25)' : 'rgba(168, 143, 184, 0.35)',
        text: textPrimary,
        shadow: '0 2px 5px rgba(0,0,0,0.03)',
        transform: 'none',
        hover: {},
      };
    }
    if (isOp) {
      // Standout Sunset Gold - permanently raised with gold glow
      return {
        bg: isDarkMode ? 'linear-gradient(135deg, rgba(224, 175, 104, 0.18) 0%, rgba(212, 163, 89, 0.08) 100%)' : 'rgba(212, 163, 89, 0.2)',
        border: isDarkMode ? 'rgba(224, 175, 104, 0.55)' : 'rgba(212, 163, 89, 0.4)',
        text: textPrimary,
        shadow: isDarkMode ? '0 4px 12px rgba(224, 175, 104, 0.22)' : '0 4px 10px rgba(0,0,0,0.08)',
        transform: 'translateY(-1px)',
        hover: {},
      };
    }
    if (c.parentId) {
      // Warm Coral / Terracotta gradient
      return {
        bg: isDarkMode ? 'linear-gradient(135deg, rgba(235, 130, 110, 0.15) 0%, rgba(216, 110, 130, 0.06) 100%)' : 'rgba(216, 179, 161, 0.15)',
        border: isDarkMode ? 'rgba(235, 130, 110, 0.25)' : 'rgba(216, 179, 161, 0.3)',
        text: textPrimary,
        shadow: '0 1px 3px rgba(0,0,0,0.02)',
        transform: 'none',
        hover: {},
      };
    }
    // Sage Green - Mirrored gradient (dim to bright)
    return {
      bg: isDarkMode ? 'linear-gradient(135deg, rgba(143, 172, 154, 0.06) 0%, rgba(143, 172, 154, 0.18) 100%)' : 'rgba(143, 172, 154, 0.15)',
      border: isDarkMode ? 'rgba(143, 172, 154, 0.25)' : 'rgba(143, 172, 154, 0.3)',
      text: textPrimary,
      shadow: '0 2px 5px rgba(0,0,0,0.03)',
      transform: 'none',
      hover: {},
    };
  };

  // Check if current user is owner or site admin or timeline moderator to show delete
  const canDeleteComment = (c) => {
    if (c.type === 'system') return false; // System comments / placeholders cannot be deleted
    if (isGuest || !user) return false;
    if (user.is_site_admin || String(user.id) === '1') return true;
    if (user.id === c.userId) return true;
    return false;
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Invisible overlay capturing clicks outside to close drawer */}
          <Box
            onClick={onClose}
            sx={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: 0,
              right: 0,
              backgroundColor: 'transparent',
              zIndex: 1290,
              cursor: 'default',
            }}
          />
          <Box
            component={motion.div}
            style={{ y: drawerY }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            drag="y"
            dragControls={dragControls}
            dragListener={false}
            dragConstraints={{ top: 0 }}
            dragElastic={{ top: 0, bottom: 0.8 }}
            onDragEnd={(event, info) => {
              if (info.offset.y > 100 || (info.velocity.y > 300 && info.offset.y > 20)) {
                onClose();
              }
            }}
            sx={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: { xs: '85%', sm: '80%' },
              background: drawerBg,
              borderTop: `1px solid ${charcoalBorder}`,
              boxShadow: '0 -10px 30px rgba(0,0,0,0.15)',
              zIndex: 1300,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            {/* Grab Handle */}
            <Box
              onPointerDown={(e) => {
                e.stopPropagation();
                dragControls.start(e);
              }}
              onTouchStart={(e) => e.stopPropagation()}
              onTouchMove={(e) => e.stopPropagation()}
              sx={{
                width: '100%',
                pt: 1.5,
                pb: 0.5,
                display: 'flex',
                justifyContent: 'center',
                cursor: 'grab',
                userSelect: 'none',
                touchAction: 'none',
              }}
            >
              <Box
                sx={{
                  width: 36,
                  height: 4,
                  borderRadius: 2,
                  bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(80, 70, 60, 0.2)',
                }}
              />
            </Box>

            {/* Drawer Header */}
            <Box
              onPointerDown={(e) => {
                e.stopPropagation();
                dragControls.start(e);
              }}
              onTouchStart={(e) => e.stopPropagation()}
              onTouchMove={(e) => e.stopPropagation()}
              sx={{
                px: 2,
                pb: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: `1px solid ${charcoalBorder}`,
                cursor: 'grab',
                userSelect: 'none',
                touchAction: 'none',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography variant="h6" sx={{ fontFamily: 'Lobster, cursive', color: textPrimary, fontWeight: 600 }}>
                  Discussion
                </Typography>

                {/* Sort Toggle Segmented Control */}
                <Box
                  onPointerDown={(e) => e.stopPropagation()}
                  sx={{
                    display: 'flex',
                    border: `1px solid ${charcoalBorder}`,
                    borderRadius: '12px',
                    overflow: 'hidden',
                    height: '24px',
                    alignItems: 'center',
                    bgcolor: isDarkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
                  }}
                >
                  <Button
                    onClick={() => handleSortChange('oldest')}
                    size="small"
                    sx={{
                      minWidth: '55px',
                      height: '100%',
                      fontSize: '0.65rem',
                      px: 1.25,
                      py: 0,
                      borderRadius: 0,
                      color: sortBy === 'oldest' ? baseBg : textSecondary,
                      bgcolor: sortBy === 'oldest' ? textPrimary : 'transparent',
                      textTransform: 'none',
                      fontWeight: sortBy === 'oldest' ? 700 : 500,
                      '&:hover': {
                        bgcolor: sortBy === 'oldest' ? textPrimary : (isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'),
                        opacity: sortBy === 'oldest' ? 0.9 : 1,
                      }
                    }}
                  >
                    New
                  </Button>
                  <Button
                    onClick={() => handleSortChange('top')}
                    size="small"
                    sx={{
                      minWidth: '55px',
                      height: '100%',
                      fontSize: '0.65rem',
                      px: 1.25,
                      py: 0,
                      borderRadius: 0,
                      color: sortBy === 'top' ? baseBg : textSecondary,
                      bgcolor: sortBy === 'top' ? textPrimary : 'transparent',
                      textTransform: 'none',
                      fontWeight: sortBy === 'top' ? 700 : 500,
                      '&:hover': {
                        bgcolor: sortBy === 'top' ? textPrimary : (isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'),
                        opacity: sortBy === 'top' ? 0.9 : 1,
                      }
                    }}
                  >
                    Top
                  </Button>
                </Box>
              </Box>
              <IconButton
                onClick={onClose}
                onPointerDown={(e) => e.stopPropagation()}
                size="small"
                sx={{ color: textPrimary }}
              >
                <CloseIcon />
              </IconButton>
            </Box>

            {/* Comments Area Container */}
            <Box sx={{ flex: 1, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              {/* Comments List Section */}
              <Box
                ref={scrollContainerRef}
                onScroll={handleScroll}
                sx={{
                  flex: 1,
                  overflowY: 'auto',
                  p: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2.5,
                  backgroundColor: 'transparent',
                  overscrollBehaviorY: 'contain',
                }}
              >
                <AnimatePresence mode="wait">
                  {loading && comments.length === 0 ? (
                    <Box
                      key="loading"
                      component={motion.div}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 8, gap: 2 }}
                    >
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: "50%",
                          border: `3px solid ${isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(80, 70, 60, 0.15)'}`,
                          borderTopColor: activeColor,
                        }}
                      />
                      <Typography variant="caption" sx={{ color: textSecondary, letterSpacing: 1, textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 600 }}>
                        Loading thoughts...
                      </Typography>
                    </Box>
                  ) : comments.length === 0 ? (
                    <Box
                      key="empty"
                      component={motion.div}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.4 }}
                      sx={{
                        py: 8,
                        px: 3,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        textAlign: 'center',
                        gap: 2,
                      }}
                    >
                      <Box
                        sx={{
                          width: 56,
                          height: 56,
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
                          color: textSecondary,
                          border: `1px solid ${charcoalBorder}`,
                          mb: 1,
                        }}
                      >
                        <CommentIcon sx={{ fontSize: 24, opacity: 0.7 }} />
                      </Box>
                      <Typography
                        variant="subtitle1"
                        sx={{
                          fontFamily: 'Lobster, cursive',
                          color: textPrimary,
                          fontSize: '1.2rem',
                          fontWeight: 500,
                        }}
                      >
                        No comments yet
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          color: textSecondary,
                          maxWidth: 280,
                          lineHeight: 1.5,
                          fontSize: '0.85rem',
                        }}
                      >
                        How about you leave one? Start the discussion below!
                      </Typography>
                    </Box>
                  ) : (
                    <Box
                      key="comments-list"
                      component={motion.div}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.5 }}
                      sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}
                    >
                      {rootComments.map((rootComment) => {
                        const threadReplies = repliesMap[rootComment.id] || [];
                        const isMinimized = minimizedComments.has(rootComment.id);
                        const isRepliesHidden = isMinimized || collapsingParentId === rootComment.id;
                        const bubbleStyle = getBubbleStyle(rootComment);
                        const alignSide = isTagLog(rootComment) ? 'right' : 'left';

                        return (
                          <Box key={rootComment.id} id={`comment-row-${rootComment.id}`} sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            {/* Root Comment Row */}
                            <Box
                              sx={{
                                display: 'flex',
                                gap: 1.5,
                                alignItems: 'flex-start',
                                flexDirection: alignSide === 'right' ? 'row-reverse' : 'row',
                                position: 'relative',
                                pb: rootComment.type !== 'system' ? '4px' : 0,
                              }}
                            >
                              {rootComment.type === 'system' ? (
                                <Box
                                  sx={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: '50%',
                                    bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: textSecondary,
                                    border: '1px solid ' + charcoalBorder,
                                  }}
                                >
                                  <GearIcon sx={{ fontSize: 16 }} />
                                </Box>
                              ) : (
                                <UserAvatar
                                  name={rootComment.user?.displayUsername || rootComment.user?.username}
                                  avatarUrl={rootComment.user?.avatar}
                                  id={rootComment.userId}
                                  userColor={rootComment.user?.userColor}
                                  isRestricted={rootComment.user?.is_restricted || rootComment.user?.is_suspended}
                                  isAvatarBlurred={rootComment.user?.is_avatar_blurred}
                                  onClick={() => navigate(`/profile/${rootComment.userId}`)}
                                  size={32}
                                />
                              )}
                              <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                {/* Bubble + Other Actions Wrapper */}
                                <Box
                                  sx={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: alignSide === 'right' ? 'flex-end' : 'flex-start',
                                    ml: alignSide === 'right' ? 'auto' : 0,
                                    mr: 0,
                                    maxWidth: alignSide === 'right' ? '100%' : 'calc(100% - 96px)',
                                    width: 'fit-content',
                                  }}
                                >
                                  <AnimatePresence mode="wait">
                                    {isMinimized ? (
                                      <motion.div
                                        key="minimized"
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.8 }}
                                        transition={{ type: 'spring', stiffness: 140, damping: 20 }}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleToggleMinimize(rootComment.id, threadReplies.length > 0);
                                        }}
                                        style={{ transformOrigin: alignSide === 'right' ? 'top right' : 'top left', width: 'fit-content' }}
                                      >
                                        <Box
                                          whileHover={{ scale: 1.05 }}
                                          whileTap={{ scale: 0.95 }}
                                          component={motion.div}
                                          sx={{
                                            width: 44,
                                            height: 32,
                                            borderRadius: '16px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            background: bubbleStyle.bg,
                                            border: '1px solid ' + bubbleStyle.border,
                                            color: bubbleStyle.text,
                                            boxShadow: bubbleStyle.shadow,
                                            cursor: 'pointer',
                                            userSelect: 'none',
                                            mt: 0,
                                          }}
                                        >
                                          <IconButton
                                            size="small"
                                            disableRipple
                                            sx={{
                                              color: 'inherit',
                                              p: 0,
                                              '&:hover': { background: 'none' }
                                            }}
                                          >
                                            <MoreHorizIcon sx={{ fontSize: 18 }} />
                                          </IconButton>
                                        </Box>
                                      </motion.div>
                                    ) : (
                                      <motion.div
                                        key="expanded"
                                        initial={{ opacity: 0, scale: 0.92 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.92 }}
                                        transition={{ type: 'spring', stiffness: 140, damping: 20 }}
                                        style={{ transformOrigin: alignSide === 'right' ? 'top right' : 'top left', width: 'fit-content' }}
                                      >
                                        <Box
                                          onClick={() => handleToggleMinimize(rootComment.id, threadReplies.length > 0)}
                                          sx={{
                                            minWidth: '220px',
                                            p: 1.5,
                                            borderRadius: alignSide === 'right' ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
                                            background: bubbleStyle.bg,
                                            border: '1px solid ' + bubbleStyle.border,
                                            color: bubbleStyle.text,
                                            boxShadow: bubbleStyle.shadow,
                                            transform: bubbleStyle.transform || 'none',
                                            transition: 'all 0.2s ease-in-out',
                                            cursor: 'pointer',
                                            '&:hover': bubbleStyle.hover,
                                          }}
                                        >
                                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5, gap: 1 }}>
                                            <Typography sx={{ fontWeight: 700, color: textPrimary, fontSize: '0.85rem', textTransform: rootComment.type === 'system' ? 'none' : 'capitalize' }}>
                                              {rootComment.type === 'system' ? 'System Generated' : (rootComment.user?.displayUsername || rootComment.user?.username)}
                                            </Typography>
                                            {Number(rootComment.userId) === Number(eventCreatorId) && rootComment.type !== 'system' && (
                                              <Typography variant="caption" sx={{ px: 0.75, py: 0.1, borderRadius: 1, bgcolor: 'rgba(212, 163, 89, 0.25)', fontSize: '0.6rem', fontWeight: 800, color: isDarkMode ? '#ffdd77' : '#996600' }}>
                                                OP
                                              </Typography>
                                            )}
                                          </Box>

                                          <RichContentRenderer content={rootComment.content} theme={theme} inheritTextColor={true} />
                                        </Box>

                                        {/* Bubble Footer Row (Actions + Votes) */}
                                        <Box
                                          sx={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            width: '100%',
                                            mt: 0.5,
                                            pl: 0.5,
                                            pr: 0.5,
                                            height: '24px',
                                          }}
                                        >
                                          {/* Left Actions */}
                                          <Box sx={{ display: 'flex', gap: alignSide === 'right' ? 1.25 : 2, alignItems: 'center' }}>
                                            <Typography variant="caption" sx={{ color: textSecondary, fontSize: '0.7rem' }}>
                                              {formatCommentTimestamp(rootComment.createdAt)}
                                            </Typography>
                                            {!isGuest && rootComment.type !== 'system' && (
                                              <Typography
                                                variant="caption"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  handleReplyClick(rootComment);
                                                }}
                                                sx={{ color: textSecondary, cursor: 'pointer', fontWeight: 600, fontSize: '0.7rem', '&:hover': { color: textPrimary } }}
                                              >
                                                Reply
                                              </Typography>
                                            )}
                                            {canDeleteComment(rootComment) && (
                                              <Typography
                                                variant="caption"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  handleDeleteComment(rootComment.id);
                                                }}
                                                sx={{ color: theme.palette.error.main, cursor: 'pointer', fontWeight: 600, fontSize: '0.7rem', '&:hover': { opacity: 0.8 } }}
                                              >
                                                Delete
                                              </Typography>
                                            )}
                                          </Box>

                                          {/* Right Votes */}
                                          {rootComment.type !== 'system' && (
                                            <Box sx={{ display: 'flex', gap: 0.75, alignItems: 'center', justifyContent: 'center', width: 56 }}>
                                              <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleVote(rootComment.id, 'up'); }} sx={{ p: 0.2, color: rootComment.my_vote === 'up' ? theme.palette.success.main : textSecondary }}>
                                                <UpvoteIcon sx={{ fontSize: 13 }} />
                                              </IconButton>
                                              <Typography variant="caption" sx={{ fontSize: '0.68rem', color: textSecondary, fontWeight: 700 }}>
                                                {rootComment.upvotes - rootComment.downvotes}
                                              </Typography>
                                              <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleVote(rootComment.id, 'down'); }} sx={{ p: 0.2, color: rootComment.my_vote === 'down' ? theme.palette.error.main : textSecondary }}>
                                                <DownvoteIcon sx={{ fontSize: 13 }} />
                                              </IconButton>
                                            </Box>
                                          )}
                                        </Box>
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </Box>
                              </Box>
                            </Box>

                            {/* Replies Wrapper */}
                            {threadReplies.length > 0 && (
                              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                <AnimatePresence>
                                  {!isRepliesHidden && (
                                    <motion.div
                                      key={`replies-${rootComment.id}`}
                                      initial={{ opacity: 0, height: 0, scale: 0.95 }}
                                      animate={{ opacity: 1, height: 'auto', scale: 1 }}
                                      exit={{ opacity: 0, height: 0, scale: 0 }}
                                      transition={{ duration: 0.3 }}
                                      style={{ transformOrigin: alignSide === 'right' ? 'top right' : 'top left', overflow: 'hidden' }}
                                    >
                                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, pt: 1 }}>
                                        {threadReplies.map((reply) => {
                                          const isReplyMinimized = minimizedComments.has(reply.id);
                                          const replyBubbleStyle = getBubbleStyle(reply);

                                          return (
                                            <Box
                                              key={reply.id}
                                              id={`comment-row-${reply.id}`}
                                              sx={{
                                                display: 'flex',
                                                gap: 1.5,
                                                alignItems: 'flex-start',
                                                flexDirection: 'row-reverse',
                                                position: 'relative',
                                                pb: reply.type !== 'system' ? '4px' : 0,
                                              }}
                                            >
                                              {reply.type === 'system' ? (
                                                <Box
                                                  sx={{
                                                    width: 32,
                                                    height: 32,
                                                    borderRadius: '50%',
                                                    bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    color: textSecondary,
                                                    border: '1px solid ' + charcoalBorder,
                                                  }}
                                                >
                                                  <GearIcon sx={{ fontSize: 16 }} />
                                                </Box>
                                              ) : (
                                                <UserAvatar
                                                  name={reply.user?.displayUsername || reply.user?.username}
                                                  avatarUrl={reply.user?.avatar}
                                                  id={reply.userId}
                                                  userColor={reply.user?.userColor}
                                                  isRestricted={reply.user?.is_restricted || reply.user?.is_suspended}
                                                  isAvatarBlurred={reply.user?.is_avatar_blurred}
                                                  onClick={() => navigate(`/profile/${reply.userId}`)}
                                                  size={32}
                                                />
                                              )}
                                              <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                                {/* Bubble + L-Arrow wrapper row */}
                                                <Box
                                                  sx={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 1,
                                                    alignSelf: 'flex-end',
                                                  }}
                                                >
                                                  {/* External L-Arrow thread connector (outside, left of bubble, opposite avatar) */}
                                                  {reply.parentId && !isReplyMinimized && (
                                                    <Tooltip title="Show parent comment">
                                                      <IconButton
                                                        size="small"
                                                        onClick={(e) => {
                                                          e.stopPropagation();
                                                          handleLArrowClick(reply);
                                                        }}
                                                        sx={{
                                                          color: textSecondary,
                                                          p: 0.5,
                                                          '&:hover': {
                                                            color: textPrimary,
                                                            backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                                                          }
                                                        }}
                                                      >
                                                        <SubdirectoryArrowRightIcon sx={{ fontSize: 16 }} />
                                                      </IconButton>
                                                    </Tooltip>
                                                  )}

                                                  {/* Bubble + Other Actions Wrapper */}
                                                  <Box
                                                    sx={{
                                                      display: 'flex',
                                                      flexDirection: 'column',
                                                      alignItems: 'flex-end',
                                                      mr: 0,
                                                      maxWidth: '100%',
                                                      width: 'fit-content',
                                                    }}
                                                  >
                                                    <AnimatePresence mode="wait">
                                                      {isReplyMinimized ? (
                                                        <motion.div
                                                          key="minimized"
                                                          initial={{ opacity: 0, scale: 0.8 }}
                                                          animate={{ opacity: 1, scale: 1 }}
                                                          exit={{ opacity: 0, scale: 0.8 }}
                                                          transition={{ type: 'spring', stiffness: 140, damping: 20 }}
                                                          onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleToggleMinimize(reply.id, false);
                                                          }}
                                                          style={{ transformOrigin: 'top right', width: 'fit-content' }}
                                                        >
                                                          <Box
                                                            whileHover={{ scale: 1.05 }}
                                                            whileTap={{ scale: 0.95 }}
                                                            component={motion.div}
                                                            sx={{
                                                              width: 44,
                                                              height: 32,
                                                              borderRadius: '16px',
                                                              display: 'flex',
                                                              alignItems: 'center',
                                                              justifyContent: 'center',
                                                              background: replyBubbleStyle.bg,
                                                              border: '1px solid ' + replyBubbleStyle.border,
                                                              color: replyBubbleStyle.text,
                                                              boxShadow: replyBubbleStyle.shadow,
                                                              cursor: 'pointer',
                                                              userSelect: 'none',
                                                              mt: 0,
                                                            }}
                                                          >
                                                            <IconButton
                                                              size="small"
                                                              disableRipple
                                                              sx={{
                                                                color: 'inherit',
                                                                p: 0,
                                                                '&:hover': { background: 'none' }
                                                              }}
                                                            >
                                                              <MoreHorizIcon sx={{ fontSize: 18 }} />
                                                            </IconButton>
                                                          </Box>
                                                        </motion.div>
                                                      ) : (
                                                        <motion.div
                                                          key="expanded"
                                                          initial={{ opacity: 0, scale: 0.92 }}
                                                          animate={{ opacity: 1, scale: 1 }}
                                                          exit={{ opacity: 0, scale: 0.92 }}
                                                          transition={{ type: 'spring', stiffness: 140, damping: 20 }}
                                                          style={{ transformOrigin: 'top right', width: 'fit-content' }}
                                                        >
                                                          {/* Bubble */}
                                                          <Box
                                                            onClick={() => handleToggleMinimize(reply.id, false)}
                                                            sx={{
                                                              minWidth: '200px',
                                                              p: 1.25,
                                                              borderRadius: '16px 4px 16px 16px',
                                                              background: replyBubbleStyle.bg,
                                                              border: '1px solid ' + replyBubbleStyle.border,
                                                              color: replyBubbleStyle.text,
                                                              boxShadow: replyBubbleStyle.shadow,
                                                              transform: replyBubbleStyle.transform || 'none',
                                                              transition: 'all 0.2s ease-in-out',
                                                              cursor: 'pointer',
                                                            }}
                                                          >
                                                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', mb: 0.5, gap: 1 }}>
                                                              {Number(reply.userId) === Number(eventCreatorId) && reply.type !== 'system' && (
                                                                <Typography variant="caption" sx={{ px: 0.5, py: 0.05, borderRadius: 0.5, bgcolor: 'rgba(212, 163, 89, 0.25)', fontSize: '0.55rem', fontWeight: 800, color: isDarkMode ? '#ffdd77' : '#996600', mr: 'auto' }}>
                                                                  OP
                                                                </Typography>
                                                              )}
                                                              <Typography sx={{ fontWeight: 700, color: textPrimary, fontSize: '0.825rem', textTransform: reply.type === 'system' ? 'none' : 'capitalize' }}>
                                                                {reply.type === 'system' ? 'System Generated' : (reply.user?.displayUsername || reply.user?.username)}
                                                              </Typography>
                                                            </Box>
                                                            <RichContentRenderer content={reply.content} theme={theme} inheritTextColor={true} textSx={{ fontSize: '0.825rem', textAlign: 'right' }} />
                                                          </Box>

                                                          {/* Bubble Footer Row (Actions + Votes) */}
                                                          <Box
                                                            sx={{
                                                              display: 'flex',
                                                              justifyContent: 'space-between',
                                                              alignItems: 'center',
                                                              width: '100%',
                                                              mt: 0.5,
                                                              pl: 0.5,
                                                              pr: 0.5,
                                                              height: '24px',
                                                            }}
                                                          >
                                                            {/* Left Actions */}
                                                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                                              <Typography variant="caption" sx={{ color: textSecondary, fontSize: '0.65rem' }}>
                                                                {formatCommentTimestamp(reply.createdAt)}
                                                              </Typography>
                                                              {!isGuest && reply.type !== 'system' && (
                                                                <Typography
                                                                  variant="caption"
                                                                  onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleReplyClick(reply);
                                                                  }}
                                                                  sx={{ color: textSecondary, cursor: 'pointer', fontWeight: 600, fontSize: '0.65rem', '&:hover': { color: textPrimary } }}
                                                                >
                                                                  Reply
                                                                </Typography>
                                                              )}
                                                              {canDeleteComment(reply) && (
                                                                <Typography
                                                                  variant="caption"
                                                                  onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleDeleteComment(reply.id);
                                                                  }}
                                                                  sx={{ color: theme.palette.error.main, cursor: 'pointer', fontWeight: 600, fontSize: '0.65rem', '&:hover': { opacity: 0.8 } }}
                                                                >
                                                                  Delete
                                                                </Typography>
                                                              )}
                                                            </Box>

                                                            {/* Right Votes */}
                                                            {reply.type !== 'system' && (
                                                              <Box sx={{ display: 'flex', gap: 0.75, alignItems: 'center', justifyContent: 'center', width: 56 }}>
                                                                <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleVote(reply.id, 'up'); }} sx={{ p: 0.2, color: reply.my_vote === 'up' ? theme.palette.success.main : textSecondary }}>
                                                                  <UpvoteIcon sx={{ fontSize: 13 }} />
                                                                </IconButton>
                                                                <Typography variant="caption" sx={{ fontSize: '0.68rem', color: textSecondary, fontWeight: 700 }}>
                                                                  {reply.upvotes - reply.downvotes}
                                                                </Typography>
                                                                <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleVote(reply.id, 'down'); }} sx={{ p: 0.2, color: reply.my_vote === 'down' ? theme.palette.error.main : textSecondary }}>
                                                                  <DownvoteIcon sx={{ fontSize: 13 }} />
                                                                </IconButton>
                                                              </Box>
                                                            )}
                                                          </Box>
                                                        </motion.div>
                                                      )}
                                                    </AnimatePresence>
                                                  </Box>
                                                </Box>
                                              </Box>
                                            </Box>
                                          );
                                        })}
                                      </Box>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </Box>
                            )}
                          </Box>
                        );
                      })}
                    </Box>
                  )}
                </AnimatePresence>
              </Box>

              {/* Floating scroll to latest button */}
              {(isScrolledUp || hasNewComments) && (
                <Button
                  onClick={() => scrollToBottom('smooth')}
                  sx={{
                    ...getGlassSquareActionButtonSx(theme),
                    position: 'absolute',
                    bottom: 16,
                    right: 24,
                    minWidth: '38px',
                    width: '38px',
                    height: '38px',
                    p: 0,
                    borderRadius: '12px',
                    boxShadow: theme.palette.mode === 'dark' ? '0 4px 12px rgba(0,0,0,0.5)' : '0 4px 12px rgba(0,0,0,0.1)',
                    zIndex: 10,
                    animation: hasNewComments ? 'jiggleBounce 0.7s cubic-bezier(0.68, -0.55, 0.265, 1.55) infinite alternate' : 'none',
                    '@keyframes jiggleBounce': {
                      '0%': { transform: 'translateY(0) scale(1)' },
                      '100%': { transform: 'translateY(5px) scale(1.05)' },
                    }
                  }}
                >
                  <KeyboardDoubleArrowDownRoundedIcon
                    sx={{
                      fontSize: '1.35rem',
                      color: hasNewComments ? (theme.palette.mode === 'dark' ? '#90caf9' : '#1976d2') : textSecondary,
                      filter: hasNewComments ? `drop-shadow(0px 2px 4px rgba(25, 118, 210, 0.4))` : 'none'
                    }}
                  />
                </Button>
              )}
            </Box>

            {/* Comment Write Box */}
            <Box
              component="form"
              onSubmit={handleSubmit}
              sx={{
                p: 2,
                borderTop: '1px solid ' + charcoalBorder,
                background: bottomMixColor,
              }}
            >
              {/* Reply notification bar */}
              {replyTo && (
                <Box
                  sx={{
                    mb: 1.5,
                    p: 1,
                    borderRadius: 1,
                    bgcolor: isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <Typography variant="caption" sx={{ color: textPrimary, fontWeight: 600 }}>
                    Replying to @{replyTo.user?.displayUsername || replyTo.user?.username}
                  </Typography>
                  <IconButton size="small" onClick={() => setReplyTo(null)} sx={{ p: 0.2, color: theme.palette.error.main }}>
                    <CancelIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </Box>
              )}

              <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                <TextField
                  fullWidth
                  inputRef={commentInputRef}
                  size="small"
                  variant="outlined"
                  placeholder={isGuest ? 'Log in to join the discussion...' : 'Write a comment...'}
                  disabled={isGuest || submitting}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  autoComplete="off"
                  inputProps={{
                    autoComplete: 'off',
                    'data-lpignore': 'true',
                    'data-1p-ignore': 'true',
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      backgroundColor: inputBg,
                      color: textPrimary,
                      '& fieldset': { borderColor: charcoalBorder },
                      '&:hover fieldset': { borderColor: textPrimary },
                      '&.Mui-focused fieldset': { borderColor: textPrimary },
                    },
                  }}
                />
                <IconButton
                  type="submit"
                  disabled={!inputValue.trim() || submitting || isGuest}
                  sx={{
                    backgroundColor: textPrimary,
                    color: baseBg,
                    '&:hover': {
                      backgroundColor: textPrimary,
                      opacity: 0.9,
                    },
                    '&.Mui-disabled': {
                      backgroundColor: charcoalBorder,
                      color: textSecondary,
                    },
                    width: 40,
                    height: 40,
                  }}
                >
                  <SendIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </Box>
            </Box>
          </Box>
        </>
      )}
    </AnimatePresence>
  );
};

export default EventCommentDrawer;
