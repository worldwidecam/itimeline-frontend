import React, { useState, forwardRef, useImperativeHandle } from 'react';
import { alpha } from '@mui/material/styles';
import {
  Typography,
  IconButton,
  Link,
  useTheme,
  useMediaQuery,
  Box,
  Chip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Comment as RemarkIcon,
  Event as EventIcon,
  AccessTime as AccessTimeIcon,
  MoreVert as MoreVertIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import { Link as RouterLink } from 'react-router-dom';
import { EVENT_TYPES, EVENT_TYPE_COLORS } from '../EventTypes';
import EventCardChipsRow from './EventCardChipsRow';
import EventOriginTimelineBadge from './EventOriginTimelineBadge';
import EventPopup from '../EventPopup';

import VoteControls from '../VoteControls';
import VoteOverlay from '../VoteOverlay';
import UserAvatar from '../../../common/UserAvatar';
import { useEventVote } from '../../../../hooks/useEventVote';
import { displayUsername } from '../../../../utils/usernameDisplay';

const RemarkCard = forwardRef(({
  event,
  onEdit,
  onDelete,
  isSelected,
  setIsPopupOpen,
  reviewingEventIds = new Set(),
  showInlineVoteControls = true,
  showVoteOverlay = false,
  timelineType = 'hashtag',
}, ref) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [popupOpen, setPopupOpen] = useState(false);
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const {
    value: voteValue,
    totalVotes,
    positiveRatio,
    isLoading: voteLoading,
    error: voteError,
    handleVoteChange,
  } = useEventVote(event?.id);

  // Consensus derived values — for label and tie detection
  const positiveVotes = Math.round((positiveRatio || 0) * (totalVotes || 0));
  const negativeVotes = (totalVotes || 0) - positiveVotes;
  const isPositiveWinning = positiveVotes > negativeVotes;
  const winningCount = isPositiveWinning ? positiveVotes : negativeVotes;
  const typeColors = EVENT_TYPE_COLORS[EVENT_TYPES.REMARK];
  const color = theme.palette.mode === 'dark' ? typeColors.dark : typeColors.light;

  // Expose methods to parent component via ref
  useImperativeHandle(ref, () => ({
    setPopupOpen: (open) => {
      console.log('RemarkCard: External call to setPopupOpen', open);
      setPopupOpen(open);
      // Also notify TimelineV3 about popup state change
      if (setIsPopupOpen && typeof setIsPopupOpen === 'function') {
        setIsPopupOpen(open);
      }
    }
  }));

  // Debug log for event data
  console.log('RemarkCard event data:', event);
  console.log('RemarkCard tags:', event.tags);

  const handleMenuOpen = (e) => {
    e.stopPropagation(); // Prevent event bubbling to parent (card click)

    // If the card is not already selected, select it first
    if (!isSelected && onEdit && typeof onEdit === 'function') {
      // We're using onEdit as a proxy to get to the parent component's onEventSelect
      // This is a bit of a hack, but it works because onEdit is passed from the same parent
      // that would handle selection
      onEdit({ type: 'select', event });

      // Delay opening the menu slightly to allow the card to move into position
      setTimeout(() => {
        setMenuAnchorEl(e.currentTarget);
      }, 300);
    } else {
      // If already selected, just open the menu
      setMenuAnchorEl(e.currentTarget);
    }
  };

  const headline = String(event?.title || '').trim() || 'Untitled Remark';
  const deckText = String(event?.description || '').trim();
  const summarizedDeckText = React.useMemo(() => {
    if (!deckText) return '';

    const maxWords = 18;
    const maxChars = 140;
    const normalizedText = deckText.replace(/\s+/g, ' ').trim();
    if (!normalizedText) return '';

    const firstPunctuationMatch = normalizedText.match(/[.!?,]/);
    if (firstPunctuationMatch && typeof firstPunctuationMatch.index === 'number') {
      const sentence = normalizedText.slice(0, firstPunctuationMatch.index + 1).trim();
      if (sentence.length <= maxChars) return sentence;
      return `${sentence.slice(0, maxChars).trimEnd()}…`;
    }

    const words = normalizedText.split(' ');
    if (words.length <= maxWords && normalizedText.length <= maxChars) {
      return normalizedText;
    }

    const limitedWords = words.slice(0, maxWords).join(' ');
    const limitedText = limitedWords.length > maxChars
      ? limitedWords.slice(0, maxChars).trimEnd()
      : limitedWords;

    return `${limitedText}…`;
  }, [deckText]);

  const handleMenuClose = (e) => {
    if (e) e.stopPropagation(); // Prevent event bubbling
    setMenuAnchorEl(null);
  };

  const handleEdit = (e) => {
    if (e) e.stopPropagation(); // Prevent event bubbling
    handleMenuClose();

    // Check if this is a special action
    if (typeof e === 'object' && e !== null && e.type === 'openPopup') {
      console.log('RemarkCard: Opening popup from handleEdit');
      setPopupOpen(true);
      return; // Exit early to prevent edit form from opening
    } else {
      onEdit(event);
    }
  };

  const handleDelete = (e) => {
    if (e) e.stopPropagation(); // Prevent event bubbling
    handleMenuClose();
    onDelete(event);
  };

  const handleDetailsClick = () => {
    setPopupOpen(true);
  };

  const handleCardClick = () => {
    if (onEdit && typeof onEdit === 'function') {
      if (isSelected) {
        // If already selected, open the popup
        console.log('RemarkCard: Opening popup for already selected card');
        setPopupOpen(true);
      } else {
        // Otherwise, select it
        onEdit({ type: 'select', event });
      }
    }
  };

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    openPopup: () => setPopupOpen(true)
  }));

  // We no longer need to listen for custom events
  // The popup will be opened directly by the handleEdit function

  const formatDate = (dateStr) => {
    try {
      if (!dateStr) return 'Invalid date';

      // Parse the ISO string into a Date object
      const date = parseISO(dateStr);

      // Format with "Published on" prefix, without seconds
      // Use explicit formatting to ensure consistency
      return `Published on ${format(date, 'MMM d, yyyy, h:mm a')}`;
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  const formatEventDate = (dateStr) => {
    try {
      if (!dateStr) return 'Invalid date';

      // Parse the ISO string into a Date object
      const date = parseISO(dateStr);

      // Format event date without "Published on" prefix
      // Use explicit formatting to ensure consistency
      if (isMobile) {
        return format(date, 'M/d/yy');
      }
      return format(date, 'MMM d, yyyy, h:mm a');
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        whileHover={{ y: -5 }}
        whileTap={{ scale: 0.98 }}
        className="relative w-full"
        style={{ perspective: '1000px' }}
        onClick={(e) => {
          e.stopPropagation(); // Prevent event bubbling
          console.log('RemarkCard motion.div clicked');
          handleCardClick();
        }}
      >
        <Box
          component={motion.div}
          sx={{
            borderRadius: 2, // 16px to match MediaCard
            overflow: 'hidden',
            minHeight: { xs: 200, sm: 260, md: 300 },
            display: 'flex',
            flexDirection: 'column',
            bgcolor: theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.8)',
            backdropFilter: 'blur(10px)',
            border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
            boxShadow: isSelected
              ? `0 0 0 2px ${color}, 0 4px 8px rgba(0,0,0,0.4)`
              : '0 2px 4px rgba(0,0,0,0.1)',
            transition: 'box-shadow 0.3s ease, transform 0.3s ease',
            p: { xs: 1.5, sm: 2 },
            '&:hover': {
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            },
          }}
        >
          {/* Vote overlay for EventList cards */}
          {showVoteOverlay && (
            <VoteOverlay
              value={voteValue}
              positiveRatio={positiveRatio}
              totalVotes={totalVotes}
              isLoading={voteLoading}
              hasError={!!voteError}
            />
          )}

          {/* Page corner button for details */}
          {/* Corner button removed as outdated */}

          <Box
            sx={{
              mb: 1.5,
              pr: 2,
              mt: -1.2,
              position: 'relative',
              borderTop: `2px solid ${color}`,
              px: 1,
              py: 1.1,
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 1,
                pb: 1,
                mb: 1.5,
                position: 'relative',
                flexWrap: 'wrap',
                borderBottom: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.18)'}`,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                <RemarkIcon sx={{ color, fontSize: '1.2rem', mt: 0.5, mr: 0.5, flexShrink: 0 }} />
                <EventOriginTimelineBadge event={event} />
              </Box>
              {event.event_date && (
                <Chip
                  icon={<EventIcon />}
                  label={formatEventDate(event.event_date)}
                  size="small"
                  color="primary"
                  sx={{ maxWidth: 220, '& .MuiChip-label': { overflow: 'hidden', textOverflow: 'ellipsis' } }}
                />
              )}
            </Box>

            {/* Redesigned Middle: Tweetified Speech Bubble Layout */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: { xs: 1.5, sm: 2.5 },
                mt: 1.5,
                mb: 1.5,
              }}
            >
              {/* Left Column: Creator Avatar (Responsive Size) */}
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  flexShrink: 0,
                }}
              >
                <UserAvatar
                  name={event.created_by_display_username || event.created_by_username || 'User'}
                  avatarUrl={event.created_by_avatar}
                  id={event.created_by}
                  size={60}
                  userColor={event.created_by_user_color}
                  isRestricted={event.created_by_is_restricted || event.created_by?.is_restricted}
                  isSuspended={event.created_by_is_suspended || event.created_by?.is_suspended}
                  isAvatarBlurred={event.created_by_is_avatar_blurred || event.is_avatar_blurred}
                  sx={{
                    width: { xs: 52, sm: 68 },
                    height: { xs: 52, sm: 68 },
                    border: `2.5px solid ${event.created_by_user_color || color}`,
                    boxShadow: `0 0 12px ${alpha(event.created_by_user_color || color, 0.35)}`,
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                    '&:hover': {
                      transform: 'scale(1.05)',
                      boxShadow: `0 0 16px ${alpha(event.created_by_user_color || color, 0.5)}`,
                    }
                  }}
                />
              </Box>

              {/* Right Column: Thoughts Label + Comic-Styled Theme-Aware Speech Bubble */}
              <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                {/* Creator Header Info (Now positioned OUTSIDE and ABOVE the bubble) */}
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    flexWrap: 'wrap',
                    mb: 0.6,
                    pl: 0.5,
                  }}
                >
                  <Typography
                    component="span"
                    variant="caption"
                    sx={{
                      fontFamily: '"Outfit", "Inter", sans-serif',
                      fontWeight: 800,
                      fontSize: '0.85rem',
                      color: theme.palette.mode === 'dark' ? 'rgba(96, 165, 250, 0.8)' : 'rgba(37, 99, 235, 0.8)',
                    }}
                  >
                    @
                  </Typography>
                  {event.created_by_username ? (
                    <Link
                      component={RouterLink}
                      to={`/profile/${event.created_by_username}`}
                      variant="caption"
                      sx={{
                        textDecoration: 'none',
                        fontFamily: '"Outfit", "Inter", sans-serif',
                        fontWeight: 800,
                        fontSize: '0.8rem',
                        color: theme.palette.mode === 'dark' ? 'rgba(96, 165, 250, 0.85)' : 'rgba(37, 99, 235, 0.85)',
                        transition: 'color 0.2s ease',
                        '&:hover': {
                          color: color,
                          textDecoration: 'underline',
                        }
                      }}
                    >
                      {displayUsername(event.created_by_display_username || event.created_by_username)}
                    </Link>
                  ) : (
                    <Typography
                      component="span"
                      variant="caption"
                      sx={{
                        fontFamily: '"Outfit", "Inter", sans-serif',
                        fontWeight: 800,
                        fontSize: '0.8rem',
                        color: theme.palette.text.secondary,
                      }}
                    >
                      Author
                    </Typography>
                  )}
                  <Typography
                    component="span"
                    variant="caption"
                    sx={{
                      fontFamily: '"Outfit", "Inter", sans-serif',
                      fontWeight: 500,
                      fontSize: '0.78rem',
                      color: theme.palette.text.secondary,
                      textTransform: 'none',
                    }}
                  >
                    {" Says"}
                  </Typography>
                </Box>

                {/* Speech Bubble Container */}
                <Box
                  sx={{
                    position: 'relative',
                    background: theme.palette.mode === 'dark'
                      ? 'linear-gradient(165deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.95) 100%)'
                      : 'linear-gradient(165deg, #ffffff 0%, rgba(33, 150, 243, 0.08) 100%)',
                    backdropFilter: 'blur(4px)',
                    border: `2px solid ${
                      theme.palette.mode === 'dark' 
                        ? 'rgba(96, 165, 250, 0.4)' 
                        : 'rgba(33, 150, 243, 0.45)'
                    }`,
                    boxShadow: theme.palette.mode === 'dark' 
                      ? '4px 4px 0 rgba(0,0,0,0.55)' 
                      : '4px 4px 0 rgba(33, 150, 243, 0.18)',
                    borderRadius: '16px',
                    p: { xs: 1.5, sm: 2 },
                    minHeight: '80px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    // Speech Bubble pointer border overlay
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      left: '-10px',
                      top: '20px',
                      width: 0,
                      height: 0,
                      borderTop: '8px solid transparent',
                      borderBottom: '8px solid transparent',
                      borderRight: `10px solid ${
                        theme.palette.mode === 'dark' 
                          ? 'rgba(96, 165, 250, 0.4)' 
                          : 'rgba(33, 150, 243, 0.45)'
                      }`,
                      zIndex: 1,
                    },
                    // Speech Bubble pointer fill
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      left: '-8px',
                      top: '20px',
                      width: 0,
                      height: 0,
                      borderTop: '8px solid transparent',
                      borderBottom: '8px solid transparent',
                      borderRight: `8px solid ${
                        theme.palette.mode === 'dark' 
                          ? '#1e293b'
                          : '#ffffff'
                      }`,
                      zIndex: 2,
                    }
                  }}
                >
                  {/* Natural-Case Dominant Title */}
                  <Typography
                    variant="h6"
                    component="div"
                    sx={{
                      fontWeight: 700,
                      fontFamily: '"Playfair Display", Georgia, serif',
                      letterSpacing: '0.01em',
                      lineHeight: 1.3,
                      fontSize: 'clamp(1.05rem, 1.8vw, 1.35rem)',
                      color: theme.palette.text.primary,
                      display: '-webkit-box',
                      WebkitLineClamp: 4,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      px: 0.2,
                    }}
                  >
                    {headline}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>

          <Box sx={{ mt: 'auto' }}>
            <EventCardChipsRow
              tags={event.tags}
              associatedTimelines={event.associated_timelines || []}
              removedTimelineIds={event.removed_timeline_ids || []}
            />
            {/* Standardized Footer - Two Rows */}
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                mt: 'auto',
                pt: 1.5,
                borderTop: `1px solid ${theme.palette.divider}`,
                gap: 1,
              }}
            >
              {/* Row 1: Creator and Vote */}
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 0 }}>
                  {/* Creator Info has been moved to the prominent Left Column layout above */}
                </Box>
                {showInlineVoteControls && (
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0, pr: { xs: 0.5, sm: 2.5 } }}>
                    {/* Consensus label */}
                    <Box sx={{ height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 0.3 }}>
                      <AnimatePresence mode="wait">
                        {(totalVotes || 0) > 0 && positiveVotes !== negativeVotes && !voteLoading && (
                          <motion.div
                            key={`${winningCount}-${isPositiveWinning ? 'pos' : 'neg'}`}
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 5 }}
                            transition={{ duration: 0.2, ease: 'easeOut' }}
                            style={{ display: 'flex', alignItems: 'center' }}
                          >
                            <Typography sx={{
                              fontSize: '0.9rem', fontWeight: 400, letterSpacing: 0.5,
                              fontFamily: '"Lobster", "Pacifico", cursive',
                              whiteSpace: 'nowrap', lineHeight: 1,
                              color: isPositiveWinning ? theme.palette.success.main : theme.palette.error.main,
                            }}>
                              {isPositiveWinning ? 'Good Moment' : 'Bad Moment'}
                            </Typography>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </Box>
                    {/* Vote pill */}
                    <Box sx={{
                      width: 'auto',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      mr: voteValue ? 0 : 0.5,
                      transition: 'transform 320ms cubic-bezier(0.22, 1, 0.36, 1), width 320ms cubic-bezier(0.22, 1, 0.36, 1)',
                    }}>
                      <VoteControls
                        value={voteValue}
                        onChange={handleVoteChange}
                        positiveRatio={positiveRatio}
                        totalVotes={totalVotes}
                        isLoading={voteLoading}
                        hasError={!!voteError}
                        layout="inline"
                        sizeScale={0.76}
                        pillScale={1}
                        showBreakdown={false}
                        compact
                      />
                    </Box>
                  </Box>
                )}
              </Box>

              {/* Row 2: Published Date (Bottom Locked) */}
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                <AccessTimeIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary', fontSize: '0.75rem' }} />
                <Typography variant="caption" color="text.secondary">
                  {formatDate(event.created_at)}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      </motion.div>

      <EventPopup
        event={event}
        open={popupOpen}
        onClose={() => {
          console.log('RemarkCard: Closing popup');
          setPopupOpen(false);
          // Also notify TimelineV3 about popup state change
          if (setIsPopupOpen && typeof setIsPopupOpen === 'function') {
            setIsPopupOpen(false);
          }
        }}
        onDelete={onDelete}
        onEdit={onEdit}
        setIsPopupOpen={setIsPopupOpen}
        reviewingEventIds={reviewingEventIds}
        timelineType={timelineType}
      />
    </>
  );
});

export default RemarkCard;
