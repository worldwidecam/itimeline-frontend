import React, { useState, forwardRef, useImperativeHandle } from 'react';
import {
  Typography,
  IconButton,
  Link,
  useTheme,
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
import { motion } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import { Link as RouterLink } from 'react-router-dom';
import { EVENT_TYPES, EVENT_TYPE_COLORS } from '../EventTypes';
import EventCardChipsRow from './EventCardChipsRow';
import EventPopup from '../EventPopup';
import PageCornerButton from '../PageCornerButton';
import VoteControls from '../VoteControls';
import VoteOverlay from '../VoteOverlay';
import UserAvatar from '../../../common/UserAvatar';
import { useEventVote } from '../../../../hooks/useEventVote';

const RemarkCard = forwardRef(({
  event,
  onEdit,
  onDelete,
  isSelected,
  setIsPopupOpen,
  reviewingEventIds = new Set(),
  showInlineVoteControls = true,
  showVoteOverlay = false,
}, ref) => {
  const theme = useTheme();
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
          className={`
            relative overflow-hidden rounded-xl p-4
            ${theme.palette.mode === 'dark' ? 'bg-black/40' : 'bg-white/80'}
            backdrop-blur-md border
            ${theme.palette.mode === 'dark' ? 'border-white/5' : 'border-black/5'}
          `}
          sx={{
            minHeight: 300,
            display: 'flex',
            flexDirection: 'column',
            boxShadow: isSelected
              ? `0 0 0 2px ${color}, 0 4px 8px rgba(0,0,0,0.4)`
              : '0 2px 4px rgba(0,0,0,0.1)',
            transition: 'box-shadow 0.3s ease, transform 0.3s ease',
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
          <PageCornerButton 
            onClick={handleDetailsClick} 
            tooltip="View Details"
            color={color}
          />
          
          <Box
            sx={{
              mb: 1.5,
              pr: 2,
              mt: -1.2,
              position: 'relative',
              borderTop: `2px solid ${color}`,
              borderBottom: `2px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'}`,
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
                mb: 1,
                position: 'relative',
                pr: { xs: 10, sm: 9 },
                borderBottom: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.18)'}`,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                <Box
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 0.5,
                    px: 1,
                    py: 0.25,
                    borderRadius: '4px',
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    fontSize: '0.72rem',
                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(96,165,250,0.2)' : 'rgba(37,99,235,0.1)',
                    border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(96,165,250,0.5)' : 'rgba(37,99,235,0.45)'}`,
                    color,
                    flexShrink: 0,
                  }}
                >
                  <RemarkIcon sx={{ fontSize: '0.9rem' }} />
                  Remark
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

            </Box>

            {showInlineVoteControls && (
              <Box
                sx={{
                  position: 'absolute',
                  top: 2,
                  right: -10,
                  transform: 'scale(0.9)',
                  transformOrigin: 'right top',
                  zIndex: 3,
                }}
              >
                <VoteControls
                  value={voteValue}
                  onChange={handleVoteChange}
                  positiveRatio={positiveRatio}
                  totalVotes={totalVotes}
                  isLoading={voteLoading}
                  hasError={!!voteError}
                  layout="stacked"
                  sizeScale={0.76}
                  pillScale={0.92}
                  badgeScale={0.72}
                />
              </Box>
            )}

            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                mb: 0.8,
                px: 0.3,
              }}
            >
              <Box sx={{ flex: 1, height: 1, bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.18)' : 'rgba(15,23,42,0.2)' }} />
              <Typography
                variant="caption"
                sx={{
                  fontFamily: '"Playfair Display", Georgia, serif',
                  letterSpacing: '0.06em',
                  fontWeight: 700,
                  color: theme.palette.text.secondary,
                  whiteSpace: 'nowrap',
                }}
              >
                {event?.created_by_username
                  ? `${event.created_by_username}'s Thoughts`
                  : 'Author Thoughts'}
              </Typography>
              <Box sx={{ flex: 1, height: 1, bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.18)' : 'rgba(15,23,42,0.2)' }} />
            </Box>

            <Typography
              variant="h6"
              component="div"
              sx={{
                textAlign: 'center',
                fontWeight: 800,
                fontFamily: '"Playfair Display", Georgia, serif',
                letterSpacing: '0.01em',
                lineHeight: 1.14,
                fontSize: 'clamp(1.2rem, 2.2vw, 1.7rem)',
                textTransform: 'uppercase',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                px: 0.5,
              }}
            >
              {headline}
            </Typography>

            <Typography
              variant="body2"
              sx={{
                mt: 1,
                textAlign: 'center',
                fontFamily: '"Playfair Display", Georgia, serif',
                fontStyle: 'italic',
                color: theme.palette.text.secondary,
                lineHeight: 1.35,
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                px: { xs: 0.25, md: 1 },
                minHeight: '3.9em',
              }}
            >
              {summarizedDeckText || 'A developing story from the timeline desk. Open details for the full report.'}
            </Typography>

            <Box
              sx={{
                mt: 1,
                mx: 'auto',
                width: '90%',
                height: 1,
                bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(15,23,42,0.18)',
              }}
            />
          </Box>

          <Box sx={{ mt: 'auto' }}>
            <EventCardChipsRow 
              tags={event.tags} 
              associatedTimelines={event.associated_timelines || []} 
              removedTimelineIds={event.removed_timeline_ids || []}
            />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
              {event.created_by_username && (
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <UserAvatar
                    name={event.created_by_username}
                    avatarUrl={event.created_by_avatar}
                    id={event.created_by}
                    size={24}
                    sx={{ mr: 0.5, fontSize: '0.75rem' }}
                  />
                  <Typography variant="caption" color="text.secondary" sx={{ mr: 0.5 }}>
                    By
                  </Typography>
                  <Link
                    component={RouterLink}
                    to={`/profile/${event.created_by}`}
                    variant="caption"
                    color="primary"
                    sx={{ 
                      textDecoration: 'none',
                      '&:hover': {
                        textDecoration: 'underline'
                      }
                    }}
                  >
                    {event.created_by_username}
                  </Link>
                </Box>
              )}
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <AccessTimeIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary', fontSize: '0.75rem' }} />
                <Typography variant="caption" color="text.secondary">
                  {formatDate(event.created_at)}
                </Typography>
              </Box>
              {/* QUARANTINED: Vertical ellipsis menu removed
                  The edit and delete functionality was incomplete and caused issues
                  Pending impact review for possible deletion
              */}
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
      />
    </>
  );
});

export default RemarkCard;
