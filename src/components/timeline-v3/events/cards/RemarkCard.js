import React, { useState, forwardRef, useImperativeHandle, useEffect } from 'react';
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
import { castVote, getVoteStats } from '../../../../api/voteApi';

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
  const [voteValue, setVoteValue] = useState(null);
  const [voteRatio] = useState(0.6);
  const [voteStats, setVoteStats] = useState({ promote_count: 0, demote_count: 0, user_vote: null });
  const typeColors = EVENT_TYPE_COLORS[EVENT_TYPES.REMARK];
  const color = theme.palette.mode === 'dark' ? typeColors.dark : typeColors.light;

  // Load vote stats on mount
  useEffect(() => {
    const loadVoteStats = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const stats = await getVoteStats(event.id, token);
        setVoteStats(stats);
        setVoteValue(stats.user_vote);
      } catch (error) {
        console.error('Error loading vote stats:', error);
      }
    };
    
    if (event.id) {
      loadVoteStats();
    }
  }, [event.id]);

  // Handle vote changes
  const handleVoteChange = async (newVoteType) => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        console.error('No authentication token found');
        return;
      }

      const stats = await castVote(event.id, newVoteType, token);
      setVoteStats(stats);
      setVoteValue(stats.user_vote);
    } catch (error) {
      console.error('Error casting vote:', error);
    }
  };

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

  // Function to limit description to 15 words
  const limitDescription = (text) => {
    if (!text) return '';
    const words = text.split(/\s+/);
    if (words.length <= 15) return text;
    return words.slice(0, 15).join(' ') + '...';
  };

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        whileHover={{ y: -4 }}
        whileTap={{ scale: 0.98 }}
        className="relative w-full"
        style={{ perspective: '1000px' }}
        onClick={(e) => {
          e.stopPropagation(); // Prevent event bubbling
          console.log('RemarkCard motion.div clicked');
          handleCardClick();
        }}
      >
        <motion.div
          className={`
            relative overflow-hidden rounded-xl p-4
            ${theme.palette.mode === 'dark' ? 'bg-black/40' : 'bg-white/80'}
            backdrop-blur-md border
            ${theme.palette.mode === 'dark' ? 'border-white/5' : 'border-black/5'}
            shadow-lg
          `}
        >
          {/* Vote overlay for EventList cards */}
          {showVoteOverlay && (
            <VoteOverlay value={voteValue} positiveRatio={voteRatio} />
          )}
          
          {/* Page corner button for details */}
          <PageCornerButton 
            onClick={handleDetailsClick} 
            tooltip="View Details"
            color={color}
          />
          
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1, mb: 2, pr: 8 }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, flex: 1, minWidth: 0 }}>
              <RemarkIcon sx={{ color, mt: 0.5 }} />
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" component="div" sx={{ fontWeight: 'bold', mb: 1 }}>
                  {event.title}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, flexWrap: 'wrap', gap: 1 }}>
                  {event.event_date && (
                    <Chip
                      icon={<EventIcon />}
                      label={formatEventDate(event.event_date)}
                      size="small"
                      color="primary"
                      sx={{ mr: 1 }}
                    />
                  )}
                </Box>
              </Box>
            </Box>
            {showInlineVoteControls && (
              <Box sx={{ mt: 0.25, flexShrink: 0 }}>
                <VoteControls
                  value={voteValue}
                  onChange={handleVoteChange}
                  positiveRatio={voteRatio}
                />
              </Box>
            )}
          </Box>

          {/* Description with larger space */}
          <Box sx={{ mb: 2, maxHeight: '150px', overflow: 'hidden' }}>
            <Typography 
              variant="body1" 
              sx={{ 
                whiteSpace: 'pre-wrap',
                display: '-webkit-box',
                WebkitLineClamp: 5,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {limitDescription(event.description)}
            </Typography>
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
        </motion.div>
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
        setIsPopupOpen={setIsPopupOpen}
        reviewingEventIds={reviewingEventIds}
        voteValue={voteValue}
        onVoteChange={setVoteValue}
        positiveRatio={voteRatio}
      />
    </>
  );
});

export default RemarkCard;
